#!/usr/bin/env python3
"""
check_narrative.py — AUDIT_V2 §1.4 narrative-logic graph (deterministic, static) + §2.5 anchors.

Checks the deck's navigational/structural logic — the class of bug that bit us repeatedly when
inserting slides shifted the 1-based numbering and left agenda jump-links pointing at the wrong
slide (every L0 insert needed a manual anchor remap):

  • ANCHOR INTEGRITY  — every internal `#/N` link resolves to a real slide (1 ≤ N ≤ total). HARD.
  • AGENDA → DIVIDER  — every agenda toc-item jumps to a section break (divider) or the closing
                        (final/refs for the last item), never into the middle of a part. HARD.

Slide numbering is the leading integer of `data-screen-label` (verified sequential 1..N across all
three decks), which is exactly what `#/N` addresses.

NOT done here (deferred to the full-coverage VLM, by design): thematic catchphrase bookending and
term-used-before-defined — both need semantic judgement and would false-positive as a static text
check (e.g. the closing Serega cameo is aria-hidden, so "Serega" has no late-slide *text*).

Severity: BROKEN-ANCHOR = HARD; AGENDA-TARGET (non-divider/closing) = HARD.
Было WARN — и класс тихо разъехался: 41 из 113 якорей курса вели мимо своего акта, потому что
#/N адресует ПОЗИЦИЮ слайда, а любая буквенная вставка (25a) её сдвигает. Класс вычищен
2026-08-18, правило затянуто; законные не-дивайдерные цели перечислены в AGENDA_ALLOW.

Usage:  python3 _research/check_narrative.py            (check the decks)
        python3 _research/check_narrative.py --selftest  (known-bad fixture must flag, §2.4)
"""
from __future__ import annotations
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
# Glob-discovered (matches check_claims.py): adding Lectures/NN-*.html is picked up with ZERO edits.
# The key "L<n>" is derived from the numeric filename prefix (00-introduction.html → L0), preserving
# the exact id→path mapping (00-…→L0 … 06-…→L6) the per-deck report addresses by deck id.
# Lectures/NN-*.html are BUILD OUTPUT (gitignored, reassembled by `npm run build`) and may be ABSENT
# on a fresh checkout — the empty-glob guard in run() skips the deck checks gracefully (no crash).
DECKS = {
    f"L{int(p.name[:2])}": p
    for p in sorted((ROOT / "Lectures").glob("[0-9][0-9]-*.html"))
}
# Any section whose class list CONTAINS `slide` — which is what deck.js selects (`.slide`).
# The old pattern demanded class="slide" exactly and so skipped every modifier-carrying slide
# (`class="slide slide--wide"`): 49 of L5's 58 sections were counted, and `#/N` was therefore
# resolved against a list nine entries short. That is precisely the silent mis-resolution this
# gate exists to prevent, so it was condemning correct anchors and blessing wrong ones.
SECTION = re.compile(r'<section\b([^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*)>')
DTYPE   = re.compile(r'data-type="([^"]*)"')
LABEL   = re.compile(r'data-screen-label="(\d+)')
TOC     = re.compile(r'class="toc-item"[^>]*href="#/(\d+)"|href="#/(\d+)"[^>]*class="toc-item"')
ANYHASH = re.compile(r'href="#/(\d+)"')

def parse(html):
    """slides: the 1-based POSITION of each slide -> its data-type.

    `#/N` is resolved BY POSITION, exactly as the deck engine does it (Lectures/js/deck.js
    parseHash: `slide = N - 1` indexed into the slide list). It used to be resolved by the leading
    integer of `data-screen-label`, which was equivalent only while every deck's labels ran 1..N with
    no gaps. Decks now carry lettered inserts (`18a`, `30a`, `46a`) that share a label integer with
    their neighbour, so the two numberings diverge — and the label-based reading silently blessed
    agenda links that jump to the WRONG slide at runtime. Position is what the engine honours, so
    position is what the gate checks.
    """
    slides = {}                                   # 1-based position -> data-type
    order = []
    for attrs in SECTION.findall(html):
        t = (DTYPE.search(attrs).group(1) if DTYPE.search(attrs) else "?")
        order.append(t)
        slides[len(order)] = t
    total = len(order)
    agenda = [int(a or b) for a, b in TOC.findall(html)]
    allhash = [int(x) for x in ANYHASH.findall(html)]
    return slides, total, agenda, allhash

# Пункты повестки, законно ведущие НЕ на дивайдер: у акта его просто нет. Каждый — с причиной,
# иначе исключение превращается в дыру. Ключ — (имя деки без .html, позиция слайда).
AGENDA_ALLOW = {
    ("L3", 78):
        "пункт 08 «Гремлин и развязка» — восьмого дивайдера в деке нет, акт открывает сам Гремлин "
        "(misconception), и заметки слайда так и говорят: «Part 8: the lexical gap»",
    ("L9", 54):
        "пункт 07 «Границы» — 6 дивайдеров на 7 объявленных частей; акт открывает слайд-таблица "
        "«чего нотация сказать не может». Позиция 53→54 после вставки слайда карты курса "
        "(2026-08-19): исключения в этом списке — ПОЗИЦИИ, значит любая вставка их двигает, "
        "ровно как двигает сами якоря",
}


def check(deck, html):
    slides, total, agenda, allhash = parse(html)
    issues = []
    # ANCHOR INTEGRITY — every #/N resolves
    for n in sorted(set(allhash)):
        if n not in slides:
            issues.append(("HARD", f"{deck}: BROKEN-ANCHOR #/{n} → no slide (total={total})"))
    # AGENDA → ITS OWN DIVIDER. Попадания «на какой-нибудь дивайдер» мало: после вставки слайдов
    # позиции съезжают ТАК, что новая позиция акта 5 совпадает со старой позицией акта 6 — все
    # якоря по-прежнему указывают на дивайдеры, и правило молчит, а план ведёт читателя не туда.
    # Поэтому: когда пунктов повестки ровно столько же, сколько дивайдеров, k-й пункт обязан вести
    # на k-й дивайдер. Если счётчики не равны (акт без дивайдера, дивайдер-перерыв), такой проверки
    # не существует и остаётся слабая — «цель является дивайдером».
    div_positions = [pos for pos, ty in sorted(slides.items()) if ty == "divider"]
    uniq_agenda = []
    for n in agenda:
        if n not in uniq_agenda:
            uniq_agenda.append(n)
    if div_positions and len(uniq_agenda) == len(div_positions) and uniq_agenda != div_positions:
        for k, (got, want) in enumerate(zip(uniq_agenda, div_positions), 1):
            if got != want:
                issues.append(("HARD", f"{deck}: AGENDA-SHIFT пункт {k}: #/{got} → дивайдер "
                                       f"#{want} (якорь указывает на чужой акт)"))
    for i, n in enumerate(agenda):
        if n not in slides:
            continue                               # already reported as broken
        t = slides[n]
        last = (i == len(agenda) - 1)
        # Decks spell the references type BOTH ways — L19 uses data-type="references", older decks
        # "refs". The gate only knew "refs", so an agenda item correctly pointing at a references
        # slide (L19 #56) was flagged as landing mid-act. Accept both spellings; this widens the
        # vocabulary to what the decks actually use, not the rule itself.
        ok = (t == "divider") or (last and t in ("final", "refs", "references", "divider"))
        if not ok and (deck, n) in AGENDA_ALLOW:
            ok = True
        if not ok:
            issues.append(("HARD", f'{deck}: AGENDA-TARGET #/{n} → type="{t}" (expected divider'
                                   f'{"/final/refs" if last else ""})'))
    return issues, total, len(agenda)

def run():
    if not DECKS:
        # Decks are build output (gitignored) — absent on a fresh checkout. Skip rather than crash.
        print("[narrative-gate] no decks found in Lectures/ — decks not built; "
              "run `npm run build` first. Skipping anchor/agenda checks.")
        return 0
    report, hard, warn = [], 0, 0
    for deck, p in DECKS.items():
        issues, total, na = check(deck, p.read_text())
        report.append((deck, total, na, issues))
    print("[narrative-gate] anchor integrity + agenda→divider (100% of internal #/N links)")
    for deck, total, na, issues in report:
        print(f"  {deck}: {total} slides, {na} agenda links — {'OK ✓' if not issues else f'{len(issues)} issue(s)'}")
        for sev, msg in issues:
            print(f"    {'✗' if sev=='HARD' else '!'} [{sev}] {msg}")
            if sev == "HARD": hard += 1
            else: warn += 1
    print(f"\n[narrative-gate] HARD(broken-anchor)={hard}  WARN(agenda-target)={warn}")
    return 1 if hard else 0

def selftest():
    # §2.4: an agenda jump-link to a non-existent slide must flag BROKEN-ANCHOR.
    html = ('<section class="slide" data-type="agenda" data-screen-label="1 A">'
            '<a class="toc-item" href="#/999">x</a></section>'
            '<section class="slide" data-type="divider" data-screen-label="2 B"></section>')
    issues, *_ = check("FIX", html)
    ok = any(s == "HARD" and "BROKEN-ANCHOR #/999" in m for s, m in issues)
    print("[selftest]", next((m for s, m in issues if s == "HARD"), "NO FLAG"))

    # Якорь, ведущий В СЕРЕДИНУ акта, обязан быть HARD, а не WARN: именно в этом виде класс и
    # разъехался — 41 из 113 якорей курса промахивались, потому что #/N адресует позицию слайда.
    mid = ('<section class="slide" data-type="agenda"><a class="toc-item" href="#/2">часть 1</a>'
           '<a class="toc-item" href="#/3">часть 2</a></section>'
           '<section class="slide" data-type="quiz"></section>'
           '<section class="slide" data-type="divider"></section>')
    iss2, *_ = check("FIX", mid)
    ok2 = any(s == "HARD" and "AGENDA-TARGET #/2" in m for s, m in iss2)

    # Последний пункт законно закрывает деку литературой/финалом — это не промах.
    close = ('<section class="slide" data-type="agenda"><a class="toc-item" href="#/2">итог</a></section>'
             '<section class="slide" data-type="refs"></section>')
    iss3, *_ = check("FIX", close)
    ok3 = not any(s == "HARD" for s, m in iss3)

    # Реестр исключений адресный: снимает ровно свою пару «дека + позиция», а не тип целиком.
    iss4, *_ = check("L3", mid)
    ok4 = any(s == "HARD" and "AGENDA-TARGET #/2" in m for s, m in iss4)

    # Сдвиг «на чужой, но настоящий дивайдер» — тот случай, который слабое правило пропускает:
    # оба якоря целятся в дивайдеры, но второй пункт ведёт на третий акт.
    shift = ('<section class="slide" data-type="agenda">'
             '<a class="toc-item" href="#/2">часть 1</a><a class="toc-item" href="#/4">часть 2</a>'
             '</section>'
             '<section class="slide" data-type="divider"></section>'
             '<section class="slide" data-type="divider"></section>')
    iss5, *_ = check("FIX", shift)
    ok5 = any(s == "HARD" and "AGENDA-SHIFT" in m for s, m in iss5)
    print(f"[selftest] {'PASS' if ok5 else 'FAIL'} — anchor on the WRONG divider")

    for label, good in (("broken-anchor", ok), ("agenda-target HARD", ok2),
                        ("closing slide ok", ok3), ("allowlist is address-scoped", ok4)):
        print(f"[selftest] {'PASS' if good else 'FAIL'} — {label}")
    return 0 if all((ok, ok2, ok3, ok4, ok5)) else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else run())
