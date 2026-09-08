#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pptx_theme_back — перенести решения дизайнера ИЗ .potx ОБРАТНО В КУРС.

Зачем это вообще есть. Курс выходит HTML-деками и сайтом; pptx — только среда, в которой
дизайнер работает, и никуда не отгружается. Без обратной дороги дизайн остался бы жить в
мёртвом файле, а между «макет принят» и «курс перекрашен» встал бы ручной перенос сотен
значений — этап неизвестной длины, на котором обычно и умирают редизайны.

ЧТО ПЕРЕНОСИТСЯ МЕХАНИЧЕСКИ (и потому переносится здесь):
  · цветовая схема темы  → переменные tokens/design-tokens.css;
  · шрифтовая пара темы  → --font-sans / --font-display;
  · кегли по ролям       → отчёт «роль: было N px, стало M px» против ЗАМЕРЕННОГО рендера
                           деки, а не против догадки о том, какая переменная за что отвечает.

ЧТО НЕ ПЕРЕНОСИТСЯ И ПОЧЕМУ. Геометрия. В pptx рамка стоит по абсолютным координатам, в
деке — потоковая вёрстка с авто-подгонкой: один и тот же слайд ужимается под свой контент.
Перенести координаты значило бы выбросить авто-подгонку и получить 1472 слайда с жёсткими
координатами — ровно тот слепок, ради ухода от которого всё и затевалось. Из геометрии
берётся ОДНО число, которое смысл имеет: поле кадра (минимальный отступ рамок от края).

Проверки, которые дешевле сделать здесь, чем после вёрстки: кегль ниже пола читаемости
(G20, 11 px) и контраст текста к фону ниже 4.5:1. Дизайн, который их не проходит, нельзя
принять — лучше сказать это до того, как по нему сверстают курс.

Usage:
    _research/.venv-pptx/bin/python scripts/pptx_theme_back.py --template <файл.potx>
    _research/.venv-pptx/bin/python scripts/pptx_theme_back.py --template ... --apply
    _research/.venv-pptx/bin/python scripts/pptx_theme_back.py --selftest
"""
import argparse
import json
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOKENS = os.path.join(ROOT, "tokens", "design-tokens.css")
DECK_CSS = os.path.join(ROOT, "Lectures", "css", "template.css")
EXPORT = os.path.join(ROOT, "_internal", "pptx-export")
OUT_DIR = os.path.join(EXPORT, "_return")

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
}

# ── Слот темы → токен курса. ЭТО ДОГОВОР, а не догадка: он напечатан в брифе, чтобы
# дизайнер знал, что accent3 — это «результат / положительное», а не просто «зелёный».
# Курс держит семантический контракт цвета (одна роль — один тон), и без этой таблицы
# перенос темы означал бы молча переназначить смыслы.
COLOR_MAP = [
    ("lt1",     "--bg",       "фон кадра"),
    ("lt2",     "--bg-inset", "фон-вставка"),
    ("dk1",     "--ink",      "основной текст"),
    ("dk2",     "--ink-2",    "вторичный текст"),
    ("accent1", "--accent",   "основной акцент: то, что отслеживаем"),
    ("accent2", "--warm",     "фокус: то, о чём речь сейчас"),
    ("accent3", "--c-green",  "результат, положительное"),
    ("accent4", "--c-red",    "отрицательное, ошибка"),
    ("accent5", "--c-amber",  "предупреждение"),
    ("accent6", "--c-violet", "производная величина"),
    ("hlink",   "--accent-ink", "цветной текст на мягкой подложке"),
]

# Кегль в pptx хранится в сотых пункта. Кадр деки 1920 px = 13,333 дюйма = 960 pt,
# то есть 1 pt ровно 2 px. Множитель не «примерно» — он следует из размера кадра.
PT_PER_PX = 0.5


def sz_to_px(sz):
    return round(int(sz) / 100 / PT_PER_PX, 1)


# ── чтение шаблона ───────────────────────────────────────────────────────────────────────
def read_theme(path):
    """Цвета и шрифты темы. Читаем XML пакета напрямую: python-pptx темы не отдаёт."""
    import xml.etree.ElementTree as ET
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if re.match(r"ppt/theme/theme\d+\.xml$", n)]
        if not names:
            return None
        root = ET.fromstring(z.read(sorted(names)[0]))
    scheme = root.find(".//a:clrScheme", NS)
    colors = {}
    for child in (scheme if scheme is not None else []):
        slot = child.tag.split("}")[-1]
        srgb = child.find("a:srgbClr", NS)
        sysclr = child.find("a:sysClr", NS)
        val = None
        if srgb is not None:
            val = srgb.get("val")
        elif sysclr is not None:
            # sysClr несёт фактическое значение в lastClr; без него это «цвет окна ОС»,
            # который на другой машине другой — переносить такое в курс нельзя.
            val = sysclr.get("lastClr")
        if val:
            colors[slot] = "#" + val.upper()
    fonts = {}
    for kind in ("majorFont", "minorFont"):
        node = root.find(f".//a:{kind}", NS)
        if node is None:
            continue
        latin = node.find("a:latin", NS)
        entry = {"latin": latin.get("typeface") if latin is not None else ""}
        for f in node.findall("a:font", NS):
            if f.get("script") == "Cyrl":
                entry["cyrl"] = f.get("typeface")
        fonts[kind] = entry
    return {"colors": colors, "fonts": fonts}


def read_layouts(path):
    """Роль → что дизайнер задал: рамка в px кадра, кегль, начертание, выключка."""
    from pptx import Presentation
    prs = Presentation(path)
    emu_px = 914400 / 144
    out = {}
    for lay in prs.slide_master.slide_layouts:
        roles = {}
        for ph in lay.placeholders:
            el = ph._element
            rpr = el.find(".//{%s}lvl1pPr/{%s}defRPr" % (NS["a"], NS["a"]))
            if rpr is None:
                rpr = el.find(".//{%s}defRPr" % NS["a"])
            size = sz_to_px(rpr.get("sz")) if rpr is not None and rpr.get("sz") else None
            bold = rpr is not None and rpr.get("b") == "1"
            ppr = el.find(".//{%s}lvl1pPr" % NS["a"])
            algn = ppr.get("algn") if ppr is not None else None
            roles[ph.name.strip()] = {
                "box": [round(v / emu_px) if v is not None else None
                        for v in (ph.left, ph.top, ph.width, ph.height)],
                "size_px": size, "bold": bold, "align": algn,
            }
        out[lay.name.strip()] = roles
    return out


# ── текущее состояние курса ──────────────────────────────────────────────────────────────
def current_tokens():
    s = open(TOKENS, encoding="utf-8").read()
    # СНАЧАЛА вырезаем комментарии, и только потом ищем границу тёмной темы. Файл токенов
    # хорошо документирован: в его шапке перечислены слои и приведён селектор
    # :root[data-theme="dark"] прозой. Обе первые редакции резали по тексту — сначала по
    # метке «[C]», потом по самому селектору — и обе попадали в шапку, оставляя ноль
    # разобранных токенов. Ноль токенов означал бы «дизайнер поменял всё», а на деле
    # сравнивать было не с чем.
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    head = re.split(r':root\s*\[\s*data-theme\s*=\s*["\']dark', s, 1)[0]
    return {m.group(1): m.group(2).upper()
            for m in re.finditer(r"(--[\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;", head)}


# Роли, у которых замеренный кегль — это кегль КОНТЕЙНЕРА, а не того, что видит глаз:
# формулу масштабирует KaTeX, фигуру — авто-подгонка. Показать «formula было 16 px» без
# оговорки значило бы подсунуть число, по которому нельзя принимать решение.
math_roles = {}


def measured_sizes(deck=None):
    """Кегль, которым роль РЕНДЕРИТСЯ в деке сейчас — из выгрузки, замеренной браузером.

    Сравнивать замер с замером честнее, чем гадать, какая CSS-переменная отвечает за роль:
    одна переменная обслуживает несколько компонентов, и «--fs-h2 стало 64» ничего не
    сказало бы о том, что сломается.
    """
    out = {}
    math_roles.clear()
    dirs = ([os.path.join(EXPORT, deck)] if deck else
            [os.path.join(EXPORT, d) for d in sorted(os.listdir(EXPORT))
             if os.path.isdir(os.path.join(EXPORT, d)) and not d.startswith("_")])
    for d in dirs:
        man = os.path.join(d, "manifest.json")
        if not os.path.exists(man):
            continue
        for s in json.load(open(man, encoding="utf-8"))["slides"]:
            for b in s["blocks"]:
                role, st = b.get("role"), b.get("style") or {}
                if role and st.get("size"):
                    out.setdefault(role, []).append(st["size"])
                    math_roles.setdefault(role, [0, 0])
                    math_roles[role][0] += 1 if (b.get("tex") or b["kind"] == "figure") else 0
                    math_roles[role][1] += 1
    return {k: round(sorted(v)[len(v) // 2], 1) for k, v in out.items()}      # медиана


# ── проверки ─────────────────────────────────────────────────────────────────────────────
def _lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def contrast(hex1, hex2):
    def lum(h):
        r, g, b = (int(h[i:i + 2], 16) for i in (1, 3, 5))
        return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)
    a, b = lum(hex1), lum(hex2)
    hi, lo = max(a, b), min(a, b)
    return round((hi + 0.05) / (lo + 0.05), 2)


FLOOR_PX = 11          # пол читаемости деки, гейт G20


# ── отчёт ────────────────────────────────────────────────────────────────────────────────
def build(template, deck=None, apply=False):
    theme = read_theme(template)
    if not theme:
        print("в шаблоне нет темы (ppt/theme/themeN.xml) — переносить нечего")
        return 2
    cur = current_tokens()
    meas = measured_sizes(deck)
    lays = read_layouts(template)

    print(f"[theme-back] шаблон: {os.path.relpath(template, ROOT)}")
    print(f"[theme-back] макетов в шаблоне: {len(lays)}")

    # ── цвета
    changes, lines = [], []
    print("\n== цвета ==")
    for slot, token, meaning in COLOR_MAP:
        new = theme["colors"].get(slot)
        old = cur.get(token)
        if not new:
            print(f"  . {slot:<8} не задан в теме — {token} остаётся {old}")
            continue
        mark = "=" if new == old else "→"
        print(f"  {mark} {slot:<8} {old or '—':<8} {mark} {new:<8}  {token:<14} {meaning}")
        lines.append(f"  {token}: {new};")
        if new != old:
            changes.append((token, old, new))

    bg = theme["colors"].get("lt1") or cur.get("--bg")
    for slot, token, meaning in COLOR_MAP:
        if not token.startswith("--ink"):
            continue
        ink = theme["colors"].get(slot)
        if ink and bg:
            c = contrast(ink, bg)
            if c < 4.5:
                print(f"  ! контраст {token} к фону {c}:1 — ниже 4.5:1, читать будет тяжело")

    # ── шрифты
    print("\n== шрифты ==")
    minor = theme["fonts"].get("minorFont", {})
    major = theme["fonts"].get("majorFont", {})
    for kind, node, token in (("текст", minor, "--font-sans"), ("заголовки", major, "--font-display")):
        name = node.get("latin") or "—"
        cyr = node.get("cyrl")
        note = f" · кириллица: {cyr}" if cyr and cyr != name else ""
        print(f"  {kind:<10} {name}{note}  → {token}")
    if major.get("latin") and major.get("latin") == minor.get("latin"):
        print("  . заголовочная и текстовая гарнитуры совпадают — --font-display не нужен")

    # ── кегли по ролям
    print("\n== кегли по ролям (замер деки → шаблон) ==")
    seen = {}
    for lay_name, roles in lays.items():
        for role, spec in roles.items():
            if spec["size_px"]:
                seen.setdefault(role, []).append(spec["size_px"])
    if not seen:
        print("  . в макетах не задан кегль (defRPr sz) — дизайнер оставил наследование "
              "от образца; кегли переносить нечего")
    for role in sorted(set(seen) | set(meas)):
        was = meas.get(role)
        now = seen.get(role)
        now = round(sorted(now)[len(now) // 2], 1) if now else None
        if was is None and now is None:
            continue
        flag = ""
        if now is not None and now < FLOOR_PX:
            flag = f"  ! ниже пола читаемости {FLOOR_PX} px (G20)"
        hits, total = math_roles.get(role, (0, 0))
        if total and hits / total > 0.5:
            flag += "  (кегль контейнера: формулу/фигуру масштабирует не он)"
        print(f"  {role:<14} было {str(was) + ' px' if was else '—':<10} "
              f"стало {str(now) + ' px' if now else '—':<10}{flag}")

    # ── поле кадра
    edges = [s["box"][0] for r in lays.values() for s in r.values() if s["box"][0] is not None]
    if edges:
        print(f"\n== поле кадра ==\n  минимальный отступ рамки от левого края: {min(edges)} px")

    os.makedirs(OUT_DIR, exist_ok=True)
    proposal = os.path.join(OUT_DIR, "tokens-proposed.css")
    with open(proposal, "w", encoding="utf-8") as fh:
        fh.write("/* Предложение из шаблона дизайнера — сгенерировано "
                 "scripts/pptx_theme_back.py.\n"
                 "   Это НЕ готовый файл токенов: здесь только цвета, которые несёт тема\n"
                 "   PowerPoint. Остальные токены курса (мягкие подложки, тёмная тема,\n"
                 "   радиусы, тени) тема не содержит и содержать не может. */\n:root {\n")
        fh.write("\n".join(lines) + "\n}\n")
    print(f"\n[theme-back] предложение → {os.path.relpath(proposal, ROOT)}")

    if apply:
        if not changes:
            print("[theme-back] применять нечего — цвета совпадают")
            return 0
        s = open(TOKENS, encoding="utf-8").read()
        for token, old, new in changes:
            s = re.sub(rf"({re.escape(token)}:\s*)#[0-9A-Fa-f]{{6}}", rf"\g<1>{new}", s, count=1)
        open(TOKENS, "w", encoding="utf-8").write(s)
        print(f"[theme-back] применено к tokens/design-tokens.css: {len(changes)} цвет(ов)")
        print("[theme-back] тёмная тема НЕ тронута — её соответствия задаёт человек")
        print("[theme-back] подписи у токенов не обновлены: комментарий вроде "
              "«off-white paper» после смены палитры может врать — перечитай глазами")
    elif changes:
        print(f"[theme-back] цветов к переносу: {len(changes)} — "
              f"применить: добавь --apply")
    return 0


def selftest():
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)
        print(("  [OK] " if cond else "  x    ") + label)

    check("кегль 28 pt превращается в 56 px кадра", sz_to_px("2800") == 56.0)
    check("чёрное на белом даёт 21:1", contrast("#000000", "#FFFFFF") == 21.0)
    check("контраст симметричен",
          contrast("#14181F", "#FAF6ED") == contrast("#FAF6ED", "#14181F"))
    check("текущая палитра курса проходит порог 4.5:1",
          contrast("#14181F", "#FAF6ED") >= 4.5)
    cur = current_tokens()
    check("токены читаются и в них есть --bg и --accent",
          "--bg" in cur and "--accent" in cur)
    check("тёмная тема не попадает в разбор светлой", cur.get("--bg") == "#FAF6ED")
    check("каждый слот темы ведёт в существующий токен",
          all(t in cur for _, t, _ in COLOR_MAP))
    theme = read_theme(os.path.join(EXPORT, "_pptx", "_fixture.pptx")) \
        if os.path.exists(os.path.join(EXPORT, "_pptx", "_fixture.pptx")) else None
    if theme is not None:
        check("тема болванки читается и несёт accent1", "accent1" in theme["colors"])
    if fails:
        print(f"[theme-back] selftest FAIL — {len(fails)}")
        return 1
    print("[theme-back] selftest PASS")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template")
    ap.add_argument("--deck", help="сравнивать кегли с этой декой (по умолчанию — со всеми)")
    ap.add_argument("--apply", action="store_true", help="записать цвета в tokens/")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.template:
        ap.error("укажи --template или --selftest")
    return build(a.template, a.deck, a.apply)


if __name__ == "__main__":
    sys.exit(main())
