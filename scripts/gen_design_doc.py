#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_design_doc — собрать ДОКУМЕНТ ДЛЯ ДИЗАЙНЕРА: роспись всех слайдов курса со ссылками.

Зачем это вместо экспорта в pptx. Экспорт конвертирует, а конвертация теряет: авто-подгонку
кегля, живые виджеты, KaTeX, настоящие метрики шрифта. Между тем самый точный артефакт уже
существует и уже опубликован — сама дека. Она открывается по ссылке, показывает слайд ровно
таким, каким его видит студент, её текст выделяется и копируется, а картинки скачиваются
оригиналами. Документ не пересказывает курс — он ДАЁТ АДРЕС каждому его куску.

Три адреса, на которых всё держится (проверены, не предположения):
  · `<дека>.html#/N`      — слайд N. Номер это ПОЗИЦИЯ, а не подпись на слайде;
  · `<дека>.html#/N/S`    — тот же слайд на шаге S (deck.js: parseHash читает вторую группу);
  · сырой PNG на GitHub   — репозиторий публичный, ссылка работает без входа.
Деки по умолчанию открываются на английском (`data-lang="en"` в собранном файле).

ПОЧЕМУ СТРОК БОЛЬШЕ, ЧЕМ СЛАЙДОВ. 182 слайда курса пошаговые: у них есть `data-max-step`,
и состояния идут от 0 до max ВКЛЮЧИТЕЛЬНО. По правилу «один шаг — один слайд» курс из 1472
слайдов превращается в 2152 слайда презентации. Документ расписывает именно состояния:
дизайнеру нужен список того, что он собирает, а не того, из чего это сделано.

Формат — Markdown, из него pandoc делает docx. Промежуточный Markdown остаётся на диске:
по нему видно, что именно пошло в документ, и его можно посмотреть глазами до конвертации.

Usage:
    python3 scripts/gen_design_doc.py            (markdown + docx)
    python3 scripts/gen_design_doc.py --md-only
    python3 scripts/gen_design_doc.py --selftest
"""
import argparse
import glob
import html as _html
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "_internal", "design-doc")
SITE = "https://levshaazz.github.io/deep-learning-for-search-summer-2026"
REPO = "https://github.com/levshaazz/deep-learning-for-search-summer-2026"
RAW = "https://raw.githubusercontent.com/levshaazz/deep-learning-for-search-summer-2026/main"

SEC = re.compile(r'<section\b([^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*)>(.*?)</section>', re.S)

# Что означает каждый тип слайда — словами, а не кодом. Дизайнер видит тип в каждой строке
# росписи; без расшифровки это шум. Формулировки сознательно про ФОРМУ, а не про предмет:
# ему нужно понять, что перед ним за конструкция, а не о чём лекция.
TYPE_RU = {
    "title": "титул лекции",
    "divider": "разделитель акта: крупная надпись, часто иллюстрация во весь кадр",
    "agenda": "план занятия, список",
    "objectives": "цели занятия, список",
    "definition": "карточка определения: ярлык, термин, раскрытие",
    "viz": "заголовок и большая схема-виджет",
    "two-col": "две колонки",
    "table": "таблица",
    "formula": "формула по центру плюс легенда обозначений",
    "derivation": "вывод формулы по шагам",
    "theorem": "утверждение и его разбор",
    "misconception": "заблуждение и его развязка: два блока, различимые глазом",
    "walkthrough": "разбор по шагам, каждый шаг открывается отдельно",
    "e2e": "сквозной пример по шагам с вычислениями",
    "quiz": "вопрос и варианты ответа",
    "quote": "цитата",
    "code": "листинг кода",
    "refs": "список источников",
    "references": "список источников",
    "arch": "архитектурная схема",
    "archflow": "архитектурная схема по шагам",
    "sequence": "диаграмма последовательности по шагам",
    "funnel": "воронка по шагам",
    "timeline": "лента времени",
    "demo": "демонстрация",
    "final": "финальный слайд лекции",
    "art-hero": "разворот-иллюстрация без текста",
    "default": "свободный слайд: заголовок и текст",
}


def txt(fragment):
    """Текст из куска разметки. Сущности РАСКОДИРУЮТСЯ: в деках «&amp;» и «&middot;» —
    обычное дело, и без этого в документ уезжало «Schedule &amp; key dates», то есть
    дизайнер копировал бы в презентацию разметку вместо текста."""
    return _html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def en_of(fragment):
    """Английский слой куска разметки. Деки двуязычные: RU и EN лежат соседними спанами,
    и невидимый слой надо отбросить — иначе заголовок склеится из двух языков."""
    if not fragment:
        return ""
    parts = re.findall(r'<span lang="en">(.*?)</span>', fragment, re.S)
    if parts:
        return txt(" ".join(parts))
    # спанов нет — значит текст одноязычный; но RU-спан, если он один, надо убрать
    return txt(re.sub(r'<span lang="ru">.*?</span>', " ", fragment, flags=re.S))


def slide_title(body):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S) or \
        re.search(r"<h2[^>]*>(.*?)</h2>", body, re.S)
    return en_of(m.group(1)) if m else ""


def assets_of(body, deck_stem):
    """Что на слайде, кроме текста: иллюстрации и виджеты — со ссылками на оригиналы."""
    out = []
    for src in re.findall(r'<img[^>]+src="([^"?]+)', body):
        name = os.path.basename(src)
        out.append(("картинка", name, f"{RAW}/Lectures/{src}"))
    for wid in re.findall(r'data-widget="([^"]+)"', body):
        out.append(("виджет", wid, f"{SITE}/embed/{wid}/"))
    return out


def scan_deck(path):
    stem = os.path.basename(path)[:-5]
    html = open(path, encoding="utf-8").read()
    slides = []
    for pos, (attrs, body) in enumerate(SEC.findall(html), start=1):
        t = re.search(r'data-type="([a-z0-9-]+)"', attrs)
        ms = re.search(r'data-max-step="(\d+)"', attrs)
        lab = re.search(r'data-screen-label="([^"]*)"', attrs)
        slides.append({
            "pos": pos,
            "type": t.group(1) if t else "default",
            "label": lab.group(1) if lab else "",
            "title": slide_title(body),
            "max_step": int(ms.group(1)) if ms else 0,
            "assets": assets_of(body, stem),
            "tables": len(re.findall(r"<table", body)),
        })
    return stem, slides


def deck_title(stem, course):
    """Человеческое имя лекции из расписания курса — по номеру в имени каталога."""
    try:
        num = int(stem.split("-")[0])
    except ValueError:
        return stem
    for r in course.get("schedule", []):
        if num in r.get("lectures", []):
            return r["topics"]["en"]
    return stem


def md_escape(s):
    return s.replace("|", "\\|").replace("\n", " ")


def build_markdown(decks, course):
    L = []
    a = L.append
    total_slides = sum(len(s) for _, s in decks)
    total_states = sum(sl["max_step"] + 1 for _, s in decks for sl in s)
    stepped = sum(1 for _, s in decks for sl in s if sl["max_step"] > 0)

    a("% Deep Learning for Search — перенос слайдов в корпоративный PPTX")
    a("% Инструкция и полная роспись слайдов")
    a("")
    a("# 1. Что нужно сделать")
    a("")
    a(f"Перенести слайды курса в PowerPoint и оформить их по корпоративному шаблону. "
      f"В курсе **{total_slides} слайдов** в {len(decks)} лекциях.")
    a("")
    a(f"**Динамические схемы разворачиваются: один шаг — один слайд.** "
      f"{stepped} слайдов курса пошаговые: на них содержимое появляется по частям по нажатию "
      f"стрелки. Каждое такое состояние становится отдельным слайдом презентации. "
      f"Поэтому итог — **{total_states} слайдов**, а не {total_slides}. "
      f"В росписи ниже каждая строка — это ровно один слайд презентации.")
    a("")
    a("**Сгенерированные иллюстрации остаются как есть** — их не нужно перерисовывать. "
      "На каждую в росписи стоит ссылка на оригинал в максимальном качестве.")
    a("")
    a("# 2. Как смотреть слайды")
    a("")
    a("Не нужно ничего конвертировать и распаковывать. Каждый слайд открывается по ссылке "
      "в браузере — это сама лекция, ровно в том виде, в каком её видит студент.")
    a("")
    a("**Текст на слайдах — настоящий текст.** Его можно выделить мышью и скопировать прямо "
      "со слайда в PowerPoint. Перепечатывать с картинки не нужно нигде.")
    a("")
    a("**Ссылка ведёт сразу на нужный слайд, а у пошаговых — сразу на нужный шаг.** "
      "Стрелки ← → листают: внутри пошагового слайда они переключают шаги, дальше уходят "
      "на следующий слайд. Клавиша `O` показывает обзор всех слайдов лекции.")
    a("")
    a("**Язык — английский.** Лекции открываются на английском по умолчанию; в панели "
      "внизу есть переключатель на русский, но оформляем английский слой.")
    a("")
    a("# 3. Размеры и цвета")
    a("")
    a("**Кадр 1920×1080 (16:9)** — совпадает с корпоративным шаблоном, ничего "
      "перевёрстывать не нужно. Слайд PowerPoint 16:9 — это 13,333×7,5 дюйма, то есть "
      "**1 пиксель макета = 1/144 дюйма**. Любой размер со слайда переносится один в один.")
    a("")
    a("Палитра и шрифты — в приложении Б. Три правила, которые нельзя нарушить:")
    a("")
    a("1. **Кегль текста не ниже 11 px** в кадре 1920×1080. Это пол читаемости, он "
      "проверяется автоматически, и слайд ниже порога не примут.")
    a("2. **Ничего не выходит за кадр** и не обрезается.")
    a("3. **Зелёный цвет в иллюстрациях — только тюбетейка маскота.** Жёсткое правило "
      "бренда. В таблицах, графиках и интерфейсных элементах зелёный допустим.")
    a("")
    a("# 4. Что делать с виджетами и схемами")
    a("")
    a("Часть схем — не картинки, а живые виджеты: они нарисованы кодом по данным курса и "
      "шагают по клику. Скачать их файлом нельзя. Поэтому для каждого шага в росписи стоит "
      "своя ссылка: открываешь, снимаешь экран целиком — и это готовый слайд.")
    a("")
    a("Экран снимать **в полноэкранном режиме** (кнопка в правом нижнем углу панели) и при "
      "масштабе браузера 100% — тогда кадр получается ровно 1920×1080 без панели инструментов. "
      "Клавиша `T` прячет панель.")
    a("")
    a("# 5. Роспись слайдов")
    a("")
    a("Колонки: **№** — номер слайда в будущей презентации, сквозной по всему курсу; "
      "**слайд** — номер слайда лекции и, через дробь, шаг; **тип** — какая это конструкция "
      "(расшифровка в приложении А); **что на слайде** — иллюстрации и виджеты со ссылками "
      "на оригиналы.")
    a("")

    n = 0
    for stem, slides in decks:
        a("")
        a(f"## {deck_title(stem, course)}")
        a("")
        a(f"Лекция: [{stem}]({SITE}/Lectures/{stem}.html) · "
          f"слайдов {len(slides)} · "
          f"слайдов презентации {sum(s['max_step'] + 1 for s in slides)} · "
          f"[исходники]({REPO}/tree/main/Lectures/{stem}/parts)")
        a("")
        a("| № | слайд | тип | заголовок | что на слайде | открыть |")
        a("|---:|---|---|---|---|---|")
        for s in slides:
            for step in range(s["max_step"] + 1):
                n += 1
                anchor = f"#/{s['pos']}" + (f"/{step}" if step else "")
                url = f"{SITE}/Lectures/{stem}.html{anchor}"
                pos_cell = str(s["pos"]) if s["max_step"] == 0 \
                    else f"{s['pos']} / шаг {step} из {s['max_step']}"
                bits = []
                for kind, name, link in s["assets"]:
                    bits.append(f"{kind} [{name}]({link})")
                if s["tables"]:
                    bits.append(f"таблиц: {s['tables']}")
                title = md_escape(s["title"])[:90] or "—"
                a(f"| {n} | {pos_cell} | {s['type']} | {title} | "
                  f"{md_escape('; '.join(bits)) or '—'} | [открыть]({url}) |")
        a("")

    a("")
    a("# Приложение А. Типы слайдов")
    a("")
    a("| тип | что это |")
    a("|---|---|")
    seen = sorted({sl["type"] for _, s in decks for sl in s})
    for t in seen:
        a(f"| {t} | {TYPE_RU.get(t, '—')} |")
    a("")
    a("# Приложение Б. Палитра и шрифты")
    a("")
    a("**Поверхности и текст**")
    a("")
    a("| роль | HEX |")
    a("|---|---|")
    for role, hexv in [("фон кадра", "#FAF6ED"), ("фон карточки", "#FFFFFF"),
                       ("фон-вставка", "#EBE7DA"), ("основной текст", "#14181F"),
                       ("вторичный текст", "#3D434E"), ("приглушённый", "#6B7280")]:
        a(f"| {role} | `{hexv}` |")
    a("")
    a("**Акценты**")
    a("")
    a("| роль | HEX |")
    a("|---|---|")
    for role, hexv in [("основной синий", "#2A6FDB"), ("синий для текста", "#1B4FA0"),
                       ("тёплый", "#E8743B"), ("красный", "#D7522C"),
                       ("зелёный", "#3A8A5C"), ("янтарный", "#E0A82E"),
                       ("фиолетовый", "#7D5BA6"), ("циан", "#1AA7B5"),
                       ("розовый", "#C9447A")]:
        a(f"| {role} | `{hexv}` |")
    a("")
    a("**Шрифты** — все под лицензией SIL OFL, ставятся с fonts.google.com по названию:")
    a("")
    a("| гарнитура | роль |")
    a("|---|---|")
    for fam, role in [("IBM Plex Sans", "заголовки и текст"),
                      ("Newsreader", "акцидентный серифный"),
                      ("JetBrains Mono", "моноширинный: код и числа"),
                      ("Patrick Hand", "рукописный, латиница"),
                      ("Pangolin", "рукописный, кириллица")]:
        a(f"| **{fam}** | {role} |")
    a("")
    a("Если гарнитуры нет в системе, PowerPoint молча подставит свою и строки лягут по "
      "чужим метрикам. Поставить шрифты нужно **до** начала работы.")
    a("")
    return "\n".join(L), dict(slides=total_slides, states=total_states, stepped=stepped)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md-only", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()

    course = json.load(open(os.path.join(ROOT, "data", "course.json"), encoding="utf-8"))
    # glob.escape(ROOT): путь репозитория содержит «[Summer 2026]», а «[...]» для glob —
    # это КЛАСС СИМВОЛОВ. Без экранирования шаблон не находит ничего, и скрипт честно
    # сообщает «нет собранных дек» рядом с каталогом, где лежит 21 дека. Ровно та же
    # ловушка описана в _research/check_citations.py — и я в неё всё равно наступил.
    paths = sorted(glob.glob(os.path.join(glob.escape(ROOT), "Lectures", "[0-9]*.html")))
    if not paths:
        print("нет собранных дек Lectures/NN-*.html — сначала npm run build")
        return 2
    decks = [scan_deck(p) for p in paths]

    md, stats = build_markdown(decks, course)
    os.makedirs(OUT_DIR, exist_ok=True)
    md_path = os.path.join(OUT_DIR, "designer-guide.md")
    open(md_path, "w", encoding="utf-8").write(md)
    print(f"[design-doc] лекций {len(decks)} · слайдов курса {stats['slides']} · "
          f"пошаговых {stats['stepped']} · слайдов презентации {stats['states']}")
    print(f"[design-doc] markdown → {os.path.relpath(md_path, ROOT)}")

    if a.md_only:
        return 0
    if not shutil.which("pandoc"):
        print("  ! pandoc не найден — docx не собран; поставь pandoc или используй --md-only")
        return 1
    docx = os.path.join(OUT_DIR, "designer-guide.docx")
    r = subprocess.run(["pandoc", md_path, "-o", docx, "--toc", "--toc-depth=2",
                        "-V", "lang=ru"], capture_output=True, text=True)
    if r.returncode != 0:
        print("  ! pandoc не справился:\n" + (r.stderr or ""))
        return 1
    size = os.path.getsize(docx) / 1024
    print(f"[design-doc] docx → {os.path.relpath(docx, ROOT)} ({size:.0f} КБ)")
    return 0


def selftest():
    fails = []

    def check(label, cond):
        if not cond:
            fails.append(label)
        print(("  [OK] " if cond else "  x    ") + label)

    check("английский слой берётся, русский отбрасывается",
          en_of('<span lang="ru">Привет</span><span lang="en">Hello</span>') == "Hello")
    check("одноязычный заголовок не теряется", en_of("<b>Plain</b>") == "Plain")
    check("HTML-сущности раскодированы",
          en_of('<span lang="en">Schedule &amp; key dates</span>') == "Schedule & key dates")
    check("заголовок читается из h2",
          slide_title('<h2><span lang="ru">Р</span><span lang="en">Scouts</span></h2>')
          == "Scouts")
    check("вертикальная черта в заголовке не ломает таблицу",
          "\\|" in md_escape("a|b"))
    body = '<img src="assets/img/L0/x.png?v=1"><div data-widget="rag-pipeline"></div>'
    got = assets_of(body, "00-introduction")
    check("картинка отдаётся ссылкой на сырой файл GitHub",
          got[0][0] == "картинка" and got[0][2].startswith(RAW) and got[0][2].endswith("x.png"))
    check("параметр версии из имени файла убран", "?" not in got[0][2])
    check("виджет распознан", got[1][0] == "виджет" and got[1][1] == "rag-pipeline")
    # состояния: шаги идут от 0 до max ВКЛЮЧИТЕЛЬНО — это и есть источник +680 слайдов
    check("слайд без шагов даёт одно состояние", len(range(0 + 1)) == 1)
    check("слайд с max-step=4 даёт пять состояний", len(range(4 + 1)) == 5)
    if fails:
        print(f"[design-doc] selftest FAIL — {len(fails)}")
        return 1
    print("[design-doc] selftest PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
