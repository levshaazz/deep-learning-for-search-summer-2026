#!/usr/bin/env python3
"""check_pairing.py — PAIRING gate (G30): глава Книги не должна быть огрызком своей деки,
а написанный виджет — крутиться только в Книге, мимо лекции.

Класс дефекта (аудит 2026-08, ФАЗА 4.10 плана). Два независимых способа развалить пару
«дека ↔ глава», и оба шипели зелёным во всех прежних гейтах:

  [P] ГЛУБИНА ГЛАВЫ. Деку пишут слайд за слайдом, главу — «потом допишем». Так глава про BERT
      доехала до 104 слайдов на 18 битов (5,0 при эталоне 1,3–1,6): студент, читающий Книгу
      вместо лекции, получал вчетверо меньше материала и не знал об этом. Гейт HARD-фейлит
      отношение выше CEIL и держит ХРАПОВИК по каждой известной паре: долг может только
      сокращаться. Эталон 1,3–1,6 — цель автора, не порог гейта: порогом он превратил бы
      в HARD пятнадцать законных глав разом.

  [W] ВИДЖЕТ МИМО ЛЕКЦИИ. Виджет написан, отлажен, включён в главу — и не стоит НИ НА ОДНОМ
      слайде курса. На лекции механизма нет, в Книге он есть; расхождение видит только тот,
      кто открыл оба. Ловится списком «виджет главы ∉ виджеты всех дек», с реестром осознанных
      исключений BOOK_ONLY (с причиной каждое) и храповиком на остальное.

  [S] СТРУКТУРА. Глава без парной деки (и наоборот) — рассинхрон нумерации; HARD сразу,
      без храповика: это не долг, это поломка карты.

Правило П4 («все X валидны» ⇒ «X ≠ ∅»): пустое множество пар — HARD, иначе гейт молча хвалил бы
вакуум. Отдельной проверки «а смонтирован ли хоть один виджет» НЕТ сознательно: если книжные
виджеты есть, а на слайдах нет ни одного, [W] назовёт поимённо каждый — вторая проверка того же
только дублировала бы вывод (и в селфтесте ложно жгла фикстуры без виджетов вовсе).

Usage:  python3 _research/check_pairing.py                    (гейт)
        python3 _research/check_pairing.py --selftest         (каждый класс горит; чистая пара молчит)
        python3 _research/check_pairing.py --update-baseline  (перезапись храповика; рост — отказ)
CI-регистрация — отдельным шагом, не здесь.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE_PATH = os.path.join(ROOT, "_research", "baselines", "pairing.json")

CEIL = 4.0        # выше — HARD: глава мельче деки более чем вчетверо
TARGET = 1.6      # эталон автора (L10–L12), в гейт как порог НЕ входит — только в отчёт
EPS = 0.005       # допуск сравнения округлённых отношений

# Виджеты, которые ЗАКОННО живут только в Книге. Каждый — с причиной, иначе это просто дыра.
BOOK_ONLY = {
    "glove-cooccur": "матрица со-встречаемости не бывает одновременно читаемой и в кадре 1920×1080 "
                     "(виз-проба дала 34 severe-наложения и подписи 7px); механизм акта несёт "
                     "worked-слайд, а виджет остаётся книжным",
}


def deck_dirs(root=ROOT):
    out = {}
    for d in sorted(glob.glob(os.path.join(glob.escape(root), "Lectures", "[0-9][0-9]-*"))):
        if not os.path.isdir(d):
            continue
        out[os.path.basename(d)[:2]] = d
    return out


def chapter_dirs(root=ROOT):
    out = {}
    for ch in sorted(glob.glob(os.path.join(glob.escape(root), "content", "book", "l*"))):
        head = os.path.join(ch, "beats", "00-head.js")
        if not os.path.isdir(ch) or not os.path.exists(head):
            continue
        m = re.search(r"id: *'([^']*)'", open(head, encoding="utf-8").read())
        if not m:
            continue
        out[m.group(1)] = ch
    return out


def _content_files(pattern, skip):
    return [f for f in glob.glob(pattern) if os.path.basename(f) not in skip]


def slides_of(deck_dir):
    return _content_files(os.path.join(glob.escape(deck_dir), "parts", "*.html"),
                          {"00-head.html", "zz-tail.html"})


def beats_of(chapter_dir):
    return _content_files(os.path.join(glob.escape(chapter_dir), "beats", "*.js"),
                          {"00-head.js", "zz-tail.js"})


def deck_widgets(deck_dir):
    ws = set()
    for p in glob.glob(os.path.join(glob.escape(deck_dir), "parts", "*.html")):
        ws.update(re.findall(r'data-widget="([^"]+)"', open(p, encoding="utf-8").read()))
    return ws


def book_widgets(chapter_dir):
    ws = set()
    for b in glob.glob(os.path.join(glob.escape(chapter_dir), "beats", "*.js")):
        ws.update(re.findall(r"widget: *'([^']+)'", open(b, encoding="utf-8").read()))
    return ws


def measure(root=ROOT):
    """→ (ratios {номер: отношение}, book_only {виджет: глава}, elsewhere {виджет: глава}, structure[])"""
    decks, chapters = deck_dirs(root), chapter_dirs(root)
    structure = []
    for num in sorted(set(decks) - set(chapters)):
        structure.append(f"дека {num} ({os.path.basename(decks[num])}) без парной главы Книги")
    for num in sorted(set(chapters) - set(decks)):
        structure.append(f"глава {os.path.basename(chapters[num])} (id={num}) без парной деки")

    all_deck_widgets = set()
    for d in decks.values():
        all_deck_widgets |= deck_widgets(d)

    ratios, orphan, elsewhere = {}, {}, {}
    for num in sorted(set(decks) & set(chapters)):
        ns, nb = len(slides_of(decks[num])), len(beats_of(chapters[num]))
        if nb == 0:
            structure.append(f"глава {os.path.basename(chapters[num])} без единого бита")
            continue
        ratios[num] = round(ns / nb, 2)
        own = deck_widgets(decks[num])
        for w in sorted(book_widgets(chapters[num])):
            if w in BOOK_ONLY:
                continue
            if w not in all_deck_widgets:
                orphan[w] = num                    # нет НИ НА ОДНОМ слайде курса — долг
            elif w not in own:
                elsewhere[w] = num                 # есть, но в другой деке — законно, но к сведению
    return ratios, orphan, elsewhere, structure, all_deck_widgets


def load_baseline(path=BASELINE_PATH):
    if not os.path.exists(path):
        return {"ratios": {}, "book_only_widgets": []}
    d = json.load(open(path, encoding="utf-8"))
    return {"ratios": d.get("ratios", {}), "book_only_widgets": sorted(d.get("book_only_widgets", []))}


def ratchet(base, ratios, orphan):
    """→ (ok, grown[], appeared[], shrunk[]) — долг может только сокращаться."""
    grown, shrunk = [], []
    for num, r in sorted(ratios.items()):
        old = base["ratios"].get(num)
        if old is None:
            continue
        if r > old + EPS:
            grown.append(f"{num}: {old} → {r}")
        elif r < old - EPS:
            shrunk.append(f"{num}: {old} → {r}")
    known = set(base["book_only_widgets"])
    appeared = sorted(set(orphan) - known)
    gone = sorted(known - set(orphan))
    for w in gone:
        shrunk.append(f"виджет {w} встал на слайд")
    return (not grown and not appeared), grown, appeared, shrunk


def run(root=ROOT, baseline_path=BASELINE_PATH, update=False):
    errors, warns = [], []
    ratios, orphan, elsewhere, structure, _all_dw = measure(root)

    if not ratios:
        errors.append("[S] не найдено ни одной пары «дека ↔ глава» — правило П4: «все пары валидны» "
                      "обязано опираться на непустое множество")
    for s in structure:
        errors.append(f"[S] {s}")

    base = load_baseline(baseline_path)
    ok, grown, appeared, shrunk = ratchet(base, ratios, orphan)

    if update:
        first = not os.path.exists(baseline_path)
        if not ok and not first:
            for g in grown:
                print(f"  ✗ РОСТ отношения слайды/биты: {g}")
            for a in appeared:
                print(f"  ✗ НОВЫЙ виджет мимо лекции: {a}")
            print("[pairing-gate] ОТКАЗ записи: храповик может только сокращаться — "
                  "допиши главу / поставь виджет на слайд, а не записывай долг")
            return 1
        os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
        json.dump({"_doc": "храповик G30: отношение слайды/биты по каждой паре и виджеты, живущие "
                           "только в Книге. Может только сокращаться (--update-baseline отказывает росту). "
                           "Осознанные книжные виджеты — в BOOK_ONLY внутри гейта, с причиной.",
                   "ratios": ratios, "book_only_widgets": sorted(orphan)},
                  open(baseline_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1,
                  sort_keys=True)
        for s in shrunk:
            print(f"  ↓ {s}")
        print(f"[pairing-gate] {'ПЕРВИЧНОЕ вооружение' if first else 'бейзлайн записан'}: "
              f"{len(ratios)} пар(ы), {len(orphan)} виджет(ов) вне лекций")
        return 0

    for num, r in sorted(ratios.items()):
        if r > CEIL:
            base_r = base["ratios"].get(num)
            if base_r is None or r > base_r + EPS:
                errors.append(f"[P] глава {num}: {r} слайдов на бит (потолок {CEIL}) — "
                              f"Книга вчетверо мельче лекции")
            else:
                warns.append(f"[P] глава {num}: {r} — известный долг в храповике (эталон {TARGET}); "
                             f"допиши биты, потолок {CEIL}")
    for g in grown:
        errors.append(f"[P] отношение выросло — глава отстаёт от деки сильнее прежнего: {g}")
    for a in appeared:
        errors.append(f"[W] виджет «{a}» крутится в Книге (глава {orphan[a]}), но не стоит ни на одном "
                      f"слайде курса — на лекции этого механизма нет")
    for w in sorted(set(orphan) & set(base["book_only_widgets"])):
        warns.append(f"[W] виджет «{w}» (глава {orphan[w]}) всё ещё вне лекций — известный долг")
    for w, num in sorted(elsewhere.items()):
        warns.append(f"[W] виджет «{w}» стоит на слайде, но не в парной деке {num} — "
                     f"законное переиспользование, к сведению")
    for s in shrunk:
        warns.append(f"[P] долг сократился ({s}) — зафиксируй: --update-baseline")

    for e in errors:
        print(f"  ✗ [HARD] {e}")
    for w in warns:
        print(f"  ! [WARN] {w}")
    above = sum(1 for r in ratios.values() if r > TARGET)
    print(f"[pairing-gate] пар: {len(ratios)} · выше эталона {TARGET}: {above} · "
          f"виджетов вне лекций: {len(orphan)} (книжных по решению: {len(BOOK_ONLY)}) · "
          f"HARD={len(errors)} WARN={len(warns)}")
    return 1 if errors else 0


# ── селфтест ────────────────────────────────────────────────────────────────────────────────────

def _fixture(tmp, name, slides, beats, book_ws=(), deck_ws=(), deck_num="01", chap_id=None,
             extra_deck=None):
    """Собирает мини-репозиторий: одна дека + одна глава (+ опционально вторая дека)."""
    root = os.path.join(tmp, name)
    dd = os.path.join(root, "Lectures", f"{deck_num}-fixture", "parts")
    os.makedirs(dd)
    open(os.path.join(dd, "00-head.html"), "w").write("<head>")
    open(os.path.join(dd, "zz-tail.html"), "w").write("</html>")
    for i in range(slides):
        mounts = "".join(f'<div class="widget-mount" data-widget="{w}"></div>' for w in deck_ws) \
            if i == 0 else ""
        open(os.path.join(dd, f"{i + 1:02d}-slide.html"), "w").write(f"<section>{mounts}</section>")
    if extra_deck:
        num2, ws2 = extra_deck
        dd2 = os.path.join(root, "Lectures", f"{num2}-other", "parts")
        os.makedirs(dd2)
        open(os.path.join(dd2, "01-slide.html"), "w").write(
            "".join(f'<div class="widget-mount" data-widget="{w}"></div>' for w in ws2))
        cd2 = os.path.join(root, "content", "book", f"l{int(num2)}", "beats")
        os.makedirs(cd2)
        open(os.path.join(cd2, "00-head.js"), "w").write(f"  id: '{num2}',\n")
        open(os.path.join(cd2, "01-b.js"), "w").write("{ id: 'b', kind: 'prose' },")
    cid = chap_id if chap_id is not None else deck_num
    cd = os.path.join(root, "content", "book", f"l{int(cid)}", "beats")
    os.makedirs(cd)
    open(os.path.join(cd, "00-head.js"), "w").write(f"  id: '{cid}',\n")
    open(os.path.join(cd, "zz-tail.js"), "w").write("];")
    for i in range(beats):
        w = f"  widget: '{book_ws[i]}'," if i < len(book_ws) else ""
        open(os.path.join(cd, f"{i + 1:02d}-beat.js"), "w").write(
            "{ id: 'b%d', kind: 'prose',%s }," % (i, w))
    return root


def selftest():
    import contextlib
    import io
    import shutil
    import tempfile
    tmp = tempfile.mkdtemp(prefix="check_pairing_selftest_")
    fails = []

    def case(label, want_hard, want_warn=None, baseline=None, **kw):
        root = _fixture(tmp, label, **kw)
        bp = os.path.join(root, "baseline.json")
        if baseline is not None:
            json.dump(baseline, open(bp, "w"))
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = run(root=root, baseline_path=bp)
        out = buf.getvalue()
        got = rc != 0
        bad = got != want_hard or (want_warn is not None and (want_warn in out) != True)
        if bad:
            fails.append(label)
        print(f"  [{'FAIL' if bad else 'OK'}] {label}: HARD={'да' if got else 'нет'} "
              f"(ожидалось {'да' if want_hard else 'нет'})")
        return out

    # 1. здоровая пара: 3 слайда на 2 бита, виджет главы стоит на слайде
    case("clean", False, slides=3, beats=2, book_ws=("w1",), deck_ws=("w1",))
    # 2. глава вчетверо мельче деки — HARD
    case("too-thin", True, slides=9, beats=2)
    # 3. …тот же долг, записанный в храповик, — WARN, не HARD
    case("thin-baselined", False, "известный долг", slides=9, beats=2,
         baseline={"ratios": {"01": 4.5}, "book_only_widgets": []})
    # 4. рост отношения НИЖЕ потолка всё равно HARD: глава отстаёт сильнее прежнего
    case("ratio-grew", True, slides=6, beats=2,
         baseline={"ratios": {"01": 2.0}, "book_only_widgets": []})
    # 5. сокращение отношения — не HARD (и подсказка зафиксировать)
    case("ratio-shrank", False, "--update-baseline", slides=3, beats=3,
         baseline={"ratios": {"01": 2.0}, "book_only_widgets": []})
    # 6. виджет главы не стоит нигде — HARD
    case("widget-orphan", True, slides=3, beats=2, book_ws=("ghost",))
    # 7. …он же в храповике — WARN
    case("widget-baselined", False, "всё ещё вне лекций", slides=3, beats=2, book_ws=("ghost",),
         baseline={"ratios": {"01": 1.5}, "book_only_widgets": ["ghost"]})
    # 8. виджет из реестра BOOK_ONLY молчит вовсе
    case("widget-book-only", False, slides=3, beats=2, book_ws=(next(iter(BOOK_ONLY)),))
    # 9. виджет стоит в ЧУЖОЙ деке — WARN о переиспользовании, не HARD
    case("widget-elsewhere", False, "не в парной деке", slides=3, beats=2, book_ws=("shared",),
         extra_deck=("02", ("shared",)))
    # 10. глава без парной деки — HARD (структура, без храповика)
    case("no-pair", True, slides=3, beats=2, deck_num="01", chap_id="07")
    # 11. пустой репозиторий — П4
    empty = os.path.join(tmp, "empty")
    os.makedirs(empty)
    with contextlib.redirect_stdout(io.StringIO()):
        rc = run(root=empty, baseline_path=os.path.join(empty, "b.json"))
    okp4 = rc != 0
    if not okp4:
        fails.append("empty-set")
    print(f"  [{'OK' if okp4 else 'FAIL'}] empty-set: HARD={'да' if okp4 else 'нет'} (ожидалось да)")
    # 12. --update-baseline отказывает росту, но разрешает первую запись
    root = _fixture(tmp, "upd", slides=6, beats=2)
    bp = os.path.join(root, "b.json")
    with contextlib.redirect_stdout(io.StringIO()):
        rc_first = run(root=root, baseline_path=bp, update=True)
    written = json.load(open(bp))["ratios"] if os.path.exists(bp) else None
    json.dump({"ratios": {"01": 1.0}, "book_only_widgets": []}, open(bp, "w"))
    with contextlib.redirect_stdout(io.StringIO()):
        rc_grow = run(root=root, baseline_path=bp, update=True)
    frozen = json.load(open(bp))["ratios"]
    ok12 = rc_first == 0 and written == {"01": 3.0} and rc_grow == 1 and frozen == {"01": 1.0}
    if not ok12:
        fails.append("ratchet-refuse")
    print(f"  [{'OK' if ok12 else 'FAIL'}] ratchet-refuse: первая запись прошла, рост отвергнут, "
          f"файл не переписан")

    shutil.rmtree(tmp, ignore_errors=True)
    if fails:
        print(f"[selftest] FAIL: {', '.join(fails)}")
        return 1
    print("[selftest] PASS — потолок/храповик отношения, виджет-сирота, книжное исключение, "
          "переиспользование, структура пар, непустота и отказ записи ведут себя как заявлено")
    return 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(run(update="--update-baseline" in sys.argv))
