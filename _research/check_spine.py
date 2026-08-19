#!/usr/bin/env python3
"""check_spine.py — SPINE gate (G35): у narrative/arc.md появился читатель.

Класс дефекта. `narrative/arc.md` помечен «Status: CANON» и обещает вещь, которую студент
обязан видеть в каждой лекции: общий якорь «ты здесь» — карта хребта курса
**Get Data → Measure → Rank → Generate** с подсвеченной ногой текущей лекции. Под это обещание
заведены данные: у каждой лекции в `data/course.json` есть массив `spine`. Читателя у этой пары
не было ни одного — ни один гейт не открывал arc.md, — и обещание разошлось с курсом молча:
шесть дек не показывают хребет ничем (замер 19.08.2026), то есть их `spine` — мёртвые данные.

Что проверяется:

  [S] СИНХРОННОСТЬ ДОКУМЕНТА И ДАННЫХ — ноги, объявленные таблицей территорий в arc.md, и ноги,
      реально встречающиеся в course.json, совпадают КАК МНОЖЕСТВА. Без этого документ и данные
      разъедутся, и обе стороны будут «правы».
  [D] У каждой лекции непустой `spine`, и каждая нога известна. Лекция без ноги — лекция вне
      карты, а карта в этом курсе и есть скелет.
  [R] ЧИТАТЕЛЬ НА СЛАЙДАХ — дека показывает хребет: либо смонтирован виджет `course-map`, либо
      есть слайд, где слово «хребет»/«spine» стоит рядом с двумя и более ногами (дека 02 несёт
      хребет прозой — это законный читатель, требовать именно виджет было бы карго-культом).
      Долг держится ХРАПОВИКОМ: список дек-должников может только сокращаться.

  [A] КАРТА НЕ ЗАБЫВАЕТ НОГУ — подсветка слайда (`labels.active`) ВКЛЮЧАЕТ весь spine лекции.
      Именно включает, а не равна ему: первая редакция требовала равенства и пометила четыре
      деки, из которых три подсвечивают шире СОЗНАТЕЛЬНО и говорят об этом вслух — дека 04
      зажигает все четыре («бит лежит под каждой остановкой»), 16 добавляет Generate («Measure
      перезажжён для генеративной эры»), финальная карта деки 20 показывает пройденный маршрут
      целиком. Расширение — редакторский жест; ПРОПАЖА объявленной ноги — дефект. Долг
      держится тем же храповиком.

Чего гейт СОЗНАТЕЛЬНО не проверяет: «карта обязана быть виджетом» — эталонная дека 11 хребта не
показывает вовсе, так что такое правило валило бы один из трёх эталонов. Этот курс уже трижды
ловил себя на правилах строже собственного эталона, и цена каждого — выброшенный гейт.

Правило П4: пустой список дек или пустой список ног — HARD, иначе гейт хвалил бы вакуум.

Usage:  python3 _research/check_spine.py
        python3 _research/check_spine.py --update-baseline   (перезапись храповика; РОСТ отвергается)
        python3 _research/check_spine.py --selftest
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, "_research", "baselines", "spine.json")

# Названия ног на слайде. Ноги пишутся по-английски во всех трёх языках (см. widgets/course-map/
# i18n.json), но деки, несущие хребет прозой, называют их по-русски — читатель обязан понимать оба.
LEG_WORDS = {
    "Get Data":  [r"get\s*data", r"получить\s+данные", r"получаем\s+данные"],
    "Measure":   [r"\bmeasure\b", r"измерить", r"измеряем", r"измерение\s+близости"],
    "Rank":      [r"\brank\b", r"ранжировать", r"ранжируем", r"ранжирование"],
    "Generate":  [r"\bgenerate\b", r"сгенерировать", r"генерировать", r"генерация\s+ответа"],
}
SPINE_WORD = re.compile(r"хребет|spine|карта\s+курса|course\s+map", re.I)
TAGS = re.compile(r"<[^>]+>")


def arc_legs(path=None, root=None):
    """Ноги из ТАБЛИЦЫ ТЕРРИТОРИЙ arc.md — колонка «Spine leg».

    Колонку ищем по заголовку, а таблицу — по паре «Territory» + «Spine leg»: в arc.md есть
    вторая таблица (полный список лекций), у которой колонка «Spine leg» тоже есть, а вторая
    колонка — название лекции. Первая редакция брала «вторую колонку любой таблицы с жирным» и
    записала в ноги хребта «Midterm» и «The Curved Map».
    """
    path = path or os.path.join(root or ROOT, "narrative", "arc.md")
    md = open(path, encoding="utf-8").read()
    legs, col = [], None
    for line in md.split("\n"):
        if not line.startswith("|"):
            col = None if legs else col      # таблица кончилась
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        low = [c.lower() for c in cells]
        if col is None:
            if "territory" in low and "spine leg" in low:
                col = low.index("spine leg")
            continue
        if col >= len(cells):
            continue
        m = re.fullmatch(r"\*\*(.+?)\*\*", cells[col])
        if m and re.fullmatch(r"[A-Za-z ]+", m.group(1)):
            legs.append(m.group(1).strip())
    seen, out = set(), []
    for l in legs:
        if l not in seen:
            seen.add(l)
            out.append(l)
    return out


def course_spines(path=None, root=None):
    path = path or os.path.join(root or ROOT, "data", "course.json")
    c = json.load(open(path, encoding="utf-8"))
    return {str(l["number"]).zfill(2): list(l.get("spine") or []) for l in c.get("lectures", [])}


def deck_dirs(root=ROOT):
    out = {}
    for d in sorted(glob.glob(os.path.join(glob.escape(root), "Lectures", "*"))):
        b = os.path.basename(d)
        if re.match(r"^\d\d-", b) and os.path.isdir(os.path.join(d, "parts")):
            out[b[:2]] = d
    return out


def shows_spine(deck_dir):
    """→ (показывает ли, чем именно)."""
    for p in sorted(glob.glob(os.path.join(glob.escape(deck_dir), "parts", "*.html"))):
        text = open(p, encoding="utf-8").read()
        if 'data-widget="course-map"' in text:
            return True, "виджет course-map"
        plain = TAGS.sub(" ", text)
        if not SPINE_WORD.search(plain):
            continue
        hits = sum(1 for pats in LEG_WORDS.values()
                   if any(re.search(pat, plain, re.I) for pat in pats))
        if hits >= 2:
            return True, f"прозой в {os.path.basename(p)} ({hits} ноги)"
    return False, ""


ACTIVE_RE = re.compile(r'"active":\s*(\[[^\]]*\]|"[^"]*")')


def deck_active(deck_dir):
    """→ [(файл, множество подсвеченных ног)] по каждому смонтированному course-map."""
    out = []
    for p in sorted(glob.glob(os.path.join(glob.escape(deck_dir), "parts", "*.html"))):
        text = open(p, encoding="utf-8").read()
        if 'data-widget="course-map"' not in text:
            continue
        m = ACTIVE_RE.search(text)
        if not m:
            out.append((os.path.basename(p), None))
            continue
        raw = m.group(1)
        try:
            val = json.loads(raw)
        except ValueError:
            out.append((os.path.basename(p), None))
            continue
        legs = val if isinstance(val, list) else re.split(r"[\s,]+", val.strip())
        out.append((os.path.basename(p), {str(x).strip() for x in legs if str(x).strip()}))
    return out


def leg_key(leg):
    """«Get Data» → «get-data»: слайд знает ноги идентификаторами виджета, arc.md — словами."""
    return leg.strip().lower().replace(" ", "-")


def measure(root=ROOT):
    # Читаем канон и данные ИЗ ПЕРЕДАННОГО корня: пока эти две строки ходили в живой
    # репозиторий, селфтест проверял фикстуру против настоящего course.json и падал на том,
    # что у деки «07» в фикстуре нет ног настоящей лекции 7.
    legs = arc_legs(root=root)
    spines = course_spines(root=root)
    decks = deck_dirs(root)
    debt = sorted(num for num, d in decks.items() if not shows_spine(d)[0])
    forgot = []
    for num, d in sorted(decks.items()):
        want = {leg_key(l) for l in spines.get(num, [])}
        if not want:
            continue
        for fname, active in deck_active(d):
            if active is None:
                forgot.append((num, fname, "подсветка не читается"))
            elif not want <= active:
                lost = sorted(want - active)
                forgot.append((num, fname, f"карта потеряла ногу(и) {lost}"))
    return legs, spines, decks, debt, forgot


def load_baseline(path=BASELINE):
    if not os.path.exists(path):
        return None                      # арминг-пин храповика: пропажа файла — HARD, не «зелено»
    try:
        d = json.load(open(path, encoding="utf-8"))
        return d.get("decks_without_reader", []), d.get("maps_missing_a_leg", [])
    except (ValueError, OSError):
        return None


def run(root=ROOT, baseline_path=BASELINE, update=False):
    errors, notes = [], []
    legs, spines, decks, debt, forgot = measure(root)

    if not legs:
        print("[spine] в narrative/arc.md не найдено ни одной ноги хребта — "
              "правило П4: «все ноги известны» ⇒ ног не ноль")
        return 1
    if not decks:
        print("[spine] дек не найдено — П4: проверять нечего, и это не «зелено»")
        return 1

    used = set()
    for num, sp in spines.items():
        if not sp:
            errors.append(f"[D] лекция {num}: пустой spine — лекция вне карты курса")
        for leg in sp:
            used.add(leg)
            if leg not in legs:
                errors.append(f"[D] лекция {num}: нога «{leg}» не объявлена в arc.md")
    missing = [l for l in legs if l not in used]
    if missing:
        errors.append(f"[S] ноги {missing} объявлены в arc.md, но не стоят ни у одной лекции — "
                      f"документ и данные разъехались")

    if update:
        first = not os.path.exists(baseline_path)   # первая заморозка — сравнивать не с чем
        base = load_baseline(baseline_path)
        if base is None and not first:
            print("[spine] ✗ ОТКАЗ: храповик существует, но не читается — почини файл, "
                  "не переписывай его вслепую")
            return 1
        base_debt, base_forgot = base if base else ([], [])
        keys = [f"{n}/{f}" for n, f, _ in forgot]
        # Скобки здесь не украшение: первая редакция писала это одним выражением
        # «[] if first else A + [] if first else B» — тернарник связывает слабее «+», и правая
        # половина проверки долга молча выключалась.
        if first:
            grew = []
        else:
            grew = ([d for d in debt if d not in base_debt]
                    + [k for k in keys if k not in base_forgot])
        if grew:
            print(f"[spine] ✗ ОТКАЗ перезаписать храповик: долг вырос на {grew} — "
                  f"почини деку, а не бейзлайн")
            return 1
        os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
        json.dump({"_doc": "храповик G35: деки, не показывающие хребет курса ни виджетом "
                           "course-map, ни прозой, и карты, потерявшие объявленную ногу. "
                           "Оба списка могут только сокращаться.",
                   "decks_without_reader": debt,
                   "maps_missing_a_leg": sorted(keys)},
                  open(baseline_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"[spine] бейзлайн {'создан' if first else 'записан'}: "
              f"{len(debt)} дек(и) без читателя хребта — {debt}")
        return 0

    base = load_baseline(baseline_path)
    if base is None:
        errors.append("[R] храповик _research/baselines/spine.json отсутствует или испорчен — "
                      "без него правило молча превращается в ничто")
    else:
        base_debt, base_forgot = base
        for d in debt:
            if d not in base_debt:
                errors.append(f"[R] дека {d}: не показывает хребет курса ни виджетом course-map, "
                              f"ни прозой — её spine в course.json стал мёртвыми данными")
        healed = [d for d in base_debt if d not in debt]
        if healed:
            notes.append(f"[R] долг сократился ({healed}) — зафиксируй: --update-baseline")
        keys = [f"{n}/{f}" for n, f, _ in forgot]
        for (num, fname, why), key in zip(forgot, keys):
            if key not in base_forgot:
                errors.append(f"[A] дека {num}, {fname}: {why} — spine лекции "
                              f"{spines.get(num)} объявлен в данных, но студент его не увидит")
        healed_a = [k for k in base_forgot if k not in keys]
        if healed_a:
            notes.append(f"[A] подсветка починена ({healed_a}) — зафиксируй: --update-baseline")

    for e in errors:
        print(f"  ✗ [HARD] {e}")
    for n in notes:
        print(f"  ! [WARN] {n}")
    print(f"[spine] ног: {len(legs)} · лекций: {len(spines)} · дек: {len(decks)} · "
          f"без читателя хребта: {len(debt)} · карт с потерянной ногой: {len(forgot)} · "
          f"HARD={len(errors)} WARN={len(notes)}")
    return 1 if errors else 0


def selftest():
    import contextlib
    import io
    import shutil
    import tempfile

    tmp = tempfile.mkdtemp(prefix="spine_selftest_")
    parts = os.path.join(tmp, "Lectures", "07-x", "parts")
    os.makedirs(parts)
    os.makedirs(os.path.join(tmp, "narrative"))
    os.makedirs(os.path.join(tmp, "data"))
    bp = os.path.join(tmp, "baseline.json")
    # Фикстура несёт СВОЙ канон и СВОИ данные — гейт нельзя тестировать против живого курса.
    open(os.path.join(tmp, "narrative", "arc.md"), "w", encoding="utf-8").write(
        "| Territory | Spine leg | What it asks |\n|---|---|---|\n"
        "| **I. The Archives** | **Get Data** | *how?* |\n"
        "| **II. The Instruments** | **Measure** | *how?* |\n"
        "| **III. The Bridge** | **Rank** | *how?* |\n"
        "| **IV. The Oracle** | **Generate** | *how?* |\n")
    json.dump({"lectures": [{"number": 7, "slug": "x", "spine": ["Get Data", "Measure", "Rank",
                                                                "Generate"]}]},
              open(os.path.join(tmp, "data", "course.json"), "w", encoding="utf-8"))
    ALL = '"active": ["get-data", "measure", "rank", "generate"]'

    def write(html):
        open(os.path.join(parts, "01-s.html"), "w", encoding="utf-8").write(html)

    def once(**kw):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = run(root=tmp, baseline_path=bp, **kw)
        return rc, buf.getvalue()

    fails = []
    json.dump({"decks_without_reader": []}, open(bp, "w", encoding="utf-8"))

    write('<section class="slide"><div data-widget="course-map"></div>'
          '<script class="widget-data" type="application/json">{"labels": {' + ALL + '}}</script>'
          '</section>')
    rc, out = once()
    if rc != 0: fails.append("widget-is-a-reader")

    # [A] карта, забывшая объявленную ногу, — дефект, даже если сама карта на месте
    write('<section class="slide"><div data-widget="course-map"></div>'
          '<script class="widget-data" type="application/json">'
          '{"labels": {"active": ["rank"]}}</script></section>')
    rc, out = once()
    if rc == 0 or "потеряла ногу" not in out: fails.append("map-must-not-forget-a-leg")

    # …но подсветка ШИРЕ объявленной — законный редакторский жест, не дефект
    # Вторая лекция держит остальные три ноги: [S] требует, чтобы каждая нога arc.md стояла
    # хотя бы у одной лекции, и без неё фикстура падала бы на другом правиле, а не на проверяемом.
    json.dump({"lectures": [{"number": 7, "slug": "x", "spine": ["Rank"]},
                            {"number": 8, "slug": "y",
                             "spine": ["Get Data", "Measure", "Generate"]}]},
              open(os.path.join(tmp, "data", "course.json"), "w", encoding="utf-8"))
    write('<section class="slide"><div data-widget="course-map"></div>'
          '<script class="widget-data" type="application/json">{"labels": {' + ALL + '}}</script>'
          '</section>')
    rc, _ = once()
    if rc != 0: fails.append("wider-highlight-is-allowed")
    json.dump({"lectures": [{"number": 7, "slug": "x", "spine": ["Get Data", "Measure", "Rank",
                                                                "Generate"]}]},
              open(os.path.join(tmp, "data", "course.json"), "w", encoding="utf-8"))

    write('<section class="slide"><p>хребет курса · получить данные → ранжировать</p></section>')
    rc, _ = once()
    if rc != 0: fails.append("prose-is-a-reader")

    # слово «хребет» без ног — не читатель: это упоминание, а не карта
    write('<section class="slide"><p>вернёмся к хребту курса позже</p></section>')
    rc, out = once()
    if rc == 0 or "не показывает хребет" not in out: fails.append("mention-is-not-a-reader")

    # храповик: известный долг молчит…
    json.dump({"decks_without_reader": ["07"]}, open(bp, "w", encoding="utf-8"))
    rc, _ = once()
    if rc != 0: fails.append("ratchet-known-debt-silent")
    # …а починка предлагает пере-заморозку
    write('<section class="slide"><div data-widget="course-map"></div>'
          '<script class="widget-data" type="application/json">{"labels": {' + ALL + '}}</script>'
          '</section>')
    rc, out = once()
    if rc != 0 or "долг сократился" not in out: fails.append("ratchet-notices-healing")

    # храповик отказывается записывать РОСТ
    json.dump({"decks_without_reader": []}, open(bp, "w", encoding="utf-8"))
    write('<section class="slide"><p>ничего про карту</p></section>')
    rc, out = once(update=True)
    if rc == 0 or "ОТКАЗ" not in out: fails.append("ratchet-refuses-growth")

    # пропавший храповик — HARD, а не «зелено»
    os.remove(bp)
    rc, out = once()
    if rc == 0 or "храповик" not in out: fails.append("missing-baseline-is-hard")

    # …но ПЕРВАЯ заморозка обязана пройти: сравнивать не с чем, и отказ здесь означал бы,
    # что гейт невозможно завести (первая редакция ровно так и делала).
    write('<section class="slide"><p>ничего про карту</p></section>')
    rc, out = once(update=True)
    if rc != 0 or "создан" not in out: fails.append("first-freeze-allowed")
    # испорченный храповик при перезаписи — отказ, а не тихая перезапись поверх
    open(bp, "w", encoding="utf-8").write("{ не json")
    rc, out = once(update=True)
    if rc == 0 or "не читается" not in out: fails.append("corrupt-baseline-refuses-update")
    json.dump({"decks_without_reader": ["07"]}, open(bp, "w", encoding="utf-8"))

    # П4: дек нет
    shutil.rmtree(os.path.join(tmp, "Lectures"))
    os.makedirs(os.path.join(tmp, "Lectures"))
    rc, _ = once()
    if rc == 0: fails.append("empty-set")

    shutil.rmtree(tmp, ignore_errors=True)
    for t in ("widget-is-a-reader", "prose-is-a-reader", "mention-is-not-a-reader",
              "ratchet-known-debt-silent", "ratchet-notices-healing", "ratchet-refuses-growth",
              "missing-baseline-is-hard", "first-freeze-allowed", "corrupt-baseline-refuses-update",
              "map-must-not-forget-a-leg", "wider-highlight-is-allowed", "empty-set"):
        print(f"  [{'FAIL' if t in fails else 'OK'}] {t}")
    print("[selftest] FAIL: " + ", ".join(fails) if fails else "[selftest] PASS")
    return 1 if fails else 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(run(update="--update-baseline" in sys.argv))
