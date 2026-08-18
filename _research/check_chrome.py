#!/usr/bin/env python3
"""check_chrome.py — CHROME-SLOT gate (G31): повторяющиеся надписи деков не расходятся.

Класс дефекта (ФАЗА 6.7 плана): «хром» — служебные надписи, которые повторяются из слайда в
слайд (кнопка вскрытия на слайде-заблуждении, его заголовок и кикер, префикс дивайдера-развязки).
Их пишут руками в каждом фрагменте, поэтому они тихо расходятся: было «Показать правду» 47 раз
против «Показать истину» 16, «Распространённое заблуждение» против «Частое», «Развенчиваем миф»
против «Развенчаем». Студент видит один и тот же элемент интерфейса под тремя именами.

Класс вычистили руками в волне 2 и завели закрытый словарь `narrative/chrome-ru.json` — но
ЧИТАТЕЛЯ у словаря не было: ревизия нашла ноль ссылок на него во всём репозитории. Словарь без
гейта — это обещание, а не правило, и разойдётся снова при первом же новом слайде.

Проверка: для каждого слота словаря — если слайд содержит его РОЛЬ (класс/структуру), надпись
обязана совпадать с каноном дословно. Найден вариант, которого в словаре нет, — HARD с указанием
файла, найденного текста и канона.

Usage:  python3 _research/check_chrome.py             (гейт)
        python3 _research/check_chrome.py --selftest  (расхождение горит; канон молчит)
CI-регистрация — отдельным шагом, не здесь.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT_PATH = os.path.join(ROOT, "narrative", "chrome-ru.json")

# Слот опознаётся НЕ позицией, а самим текстом: в этой же позиции законно стоит цитата
# развенчиваемого мифа («русская модель всегда лучше»), и требовать там служебную надпись —
# значит карать содержание. Поэтому для каждого слота перечислены ИЗВЕСТНЫЕ ВАРИАНТЫ — канон и
# те формулировки, между которыми надпись исторически расходилась. Найден вариант не-канон —
# HARD; любой другой текст гейт не трогает, он не про этот слот.
SLOT_VARIANTS = {
    "misc-reveal-btn":       ["Показать правду", "Показать истину", "Показать ответ", "Раскрыть правду"],
    "misconception-h2":      ["Распространённое заблуждение", "Частое заблуждение",
                              "Распространенное заблуждение"],
    "misconception-kicker":  ["Развенчиваем миф", "Развенчаем миф", "Развенчиваем мифы"],
    "payoff-divider-prefix": ["Развязка", "Итог", "Развязка ·", "Итог ·"],
}
# Где искать надпись слота. Позиция одна отсекает прозу («итог такой…» — обычное слово),
# реестр вариантов отсекает содержание (цитата мифа в кикере). Нужны ОБА условия.
SLOT_WHERE = {
    "misc-reveal-btn":       (r'class="[^"]*misc-reveal[^"]*"[^>]*>(.{0,120}?)<', None),
    "misconception-h2":      (r'<h2[^>]*>(.{0,160}?)</h2>', "misconception"),
    "misconception-kicker":  (r'class="slide-kicker"[^>]*>(.{0,160}?)</span>\s*</span>', "misconception"),
    "payoff-divider-prefix": (r'<h2[^>]*>(.{0,160}?)</h2>', "divider"),
}


def load_dict(path=DICT_PATH):
    d = json.load(open(path, encoding="utf-8"))
    return {k: v["ru"] for k, v in d.get("slots", {}).items() if isinstance(v, dict) and "ru" in v}


def slide_type(html):
    m = re.search(r'data-type="([^"]*)"', html)
    return m.group(1) if m else ""


def check_fragment(path, html, canon, err):
    """Слот = позиция + известный вариант. Текст вне реестра — не наш слот, а содержание."""
    typ = slide_type(html)
    for slot, variants in SLOT_VARIANTS.items():
        canon_text = canon.get(slot)
        where, need_type = SLOT_WHERE.get(slot, (None, None))
        if not canon_text or not where:
            continue
        if need_type and typ != need_type:
            continue
        canon_norm = canon_text.rstrip(" ·").strip()
        for m in re.finditer(where, html, re.S):
            zone = re.sub(r"<[^>]+>", " ", m.group(1))
            for var in variants:
                var_norm = var.rstrip(" ·").strip()
                for hit in re.finditer(re.escape(var_norm), zone, re.I):
                    found = hit.group(0)
                    if found == canon_norm:
                        continue          # канон в каноничном регистре — молчим
                    err(f"{os.path.relpath(path, ROOT)}: слот «{slot}» — «{found}», "
                        f"канон «{canon_text}»")


def run(root=ROOT, dict_path=DICT_PATH):
    errors = []
    err = errors.append
    if not os.path.exists(dict_path):
        print(f"[chrome-gate] словарь {os.path.relpath(dict_path, root)} отсутствует — "
              f"без него правило не существует, а не «выполняется»")
        return 1
    canon = load_dict(dict_path)
    if not canon:
        print("[chrome-gate] словарь пуст — правило П4: «все слоты каноничны» ⇒ слотов не ноль")
        return 1
    frags = sorted(glob.glob(os.path.join(glob.escape(root), "Lectures", "*", "parts", "*.html")))
    if not frags:
        print("[chrome-gate] фрагменты дек не найдены — проверять нечего, это не «зелено»")
        return 1
    for f in frags:
        check_fragment(f, open(f, encoding="utf-8").read(), canon, err)
    for e in errors:
        print(f"  ✗ [HARD] {e}")
    print(f"[chrome-gate] слотов: {len(canon)} · фрагментов: {len(frags)} · HARD={len(errors)}")
    return 1 if errors else 0


def selftest():
    import shutil
    import tempfile
    tmp = tempfile.mkdtemp(prefix="chrome_selftest_")
    os.makedirs(os.path.join(tmp, "narrative"))
    json.dump({"slots": {"misconception-kicker": {"ru": "Развенчиваем миф", "en": "Bust the myth"}}},
              open(os.path.join(tmp, "narrative", "chrome-ru.json"), "w"))
    d = os.path.join(tmp, "Lectures", "01-x", "parts")
    os.makedirs(d)
    good = ('<section class="slide" data-type="misconception">'
            '<span class="slide-kicker"><span lang="ru">Развенчаем миф</span></span></section>')
    open(os.path.join(d, "01-a.html"), "w", encoding="utf-8").write(good)
    import contextlib
    import io
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        rc_bad = run(root=tmp, dict_path=os.path.join(tmp, "narrative", "chrome-ru.json"))
    ok1 = rc_bad != 0 and "Развенчаем миф" in buf.getvalue()
    open(os.path.join(d, "01-a.html"), "w", encoding="utf-8").write(good.replace("Развенчаем", "Развенчиваем"))
    with contextlib.redirect_stdout(io.StringIO()):
        rc_good = run(root=tmp, dict_path=os.path.join(tmp, "narrative", "chrome-ru.json"))
    ok2 = rc_good == 0
    # тип слайда решает: тот же текст на НЕ-misconception слайде не наш слот
    open(os.path.join(d, "02-b.html"), "w", encoding="utf-8").write(
        good.replace('data-type="misconception"', 'data-type="definition"').replace("Развенчаем", "Что угодно"))
    with contextlib.redirect_stdout(io.StringIO()):
        rc_type = run(root=tmp, dict_path=os.path.join(tmp, "narrative", "chrome-ru.json"))
    ok3 = rc_type == 0
    # отсутствие словаря — это отказ, а не тишина
    with contextlib.redirect_stdout(io.StringIO()):
        rc_nodict = run(root=tmp, dict_path=os.path.join(tmp, "narrative", "нет.json"))
    ok4 = rc_nodict != 0
    shutil.rmtree(tmp, ignore_errors=True)
    for label, ok in (("расхождение горит", ok1), ("канон молчит", ok2),
                      ("тип слайда ограничивает слот", ok3), ("нет словаря — отказ", ok4)):
        print(f"  [{'OK' if ok else 'FAIL'}] {label}")
    if all((ok1, ok2, ok3, ok4)):
        print("[selftest] PASS")
        return 0
    print("[selftest] FAIL")
    return 1


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else run())
