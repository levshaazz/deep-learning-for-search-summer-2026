#!/usr/bin/env python3
"""
check_narrative.py — AUDIT_V2 §1.4 narrative-logic graph (deterministic, static) + §2.5 anchors.

Checks the deck's navigational/structural logic — the class of bug that bit us repeatedly when
inserting slides shifted the 1-based numbering and left agenda jump-links pointing at the wrong
slide (every L0 insert needed a manual anchor remap):

  • ANCHOR INTEGRITY  — every internal `#/N` link resolves to a real slide (1 ≤ N ≤ total). HARD.
  • AGENDA → DIVIDER  — every agenda toc-item jumps to a section break (divider) or the closing
                        (final/refs for the last item), never into the middle of a part. WARN.

Slide numbering is the leading integer of `data-screen-label` (verified sequential 1..N across all
three decks), which is exactly what `#/N` addresses.

NOT done here (deferred to the full-coverage VLM, by design): thematic catchphrase bookending and
term-used-before-defined — both need semantic judgement and would false-positive as a static text
check (e.g. the closing Serega cameo is aria-hidden, so "Serega" has no late-slide *text*).

Severity: BROKEN-ANCHOR = HARD; AGENDA-TARGET (non-divider/closing) = WARN.

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
SECTION = re.compile(r'<section class="slide"([^>]*)>')
DTYPE   = re.compile(r'data-type="([^"]*)"')
LABEL   = re.compile(r'data-screen-label="(\d+)')
TOC     = re.compile(r'class="toc-item"[^>]*href="#/(\d+)"|href="#/(\d+)"[^>]*class="toc-item"')
ANYHASH = re.compile(r'href="#/(\d+)"')

def parse(html):
    slides = {}                                   # num -> data-type
    order = []
    for attrs in SECTION.findall(html):
        m_lab = LABEL.search(attrs)
        if not m_lab:
            continue
        n = int(m_lab.group(1))
        t = (DTYPE.search(attrs).group(1) if DTYPE.search(attrs) else "?")
        slides[n] = t
        order.append(n)
    total = len(order)
    agenda = [int(a or b) for a, b in TOC.findall(html)]
    allhash = [int(x) for x in ANYHASH.findall(html)]
    return slides, total, agenda, allhash

def check(deck, html):
    slides, total, agenda, allhash = parse(html)
    issues = []
    # ANCHOR INTEGRITY — every #/N resolves
    for n in sorted(set(allhash)):
        if n not in slides:
            issues.append(("HARD", f"{deck}: BROKEN-ANCHOR #/{n} → no slide (total={total})"))
    # AGENDA → DIVIDER — each agenda jump lands on a section break (last may be the closing)
    for i, n in enumerate(agenda):
        if n not in slides:
            continue                               # already reported as broken
        t = slides[n]
        last = (i == len(agenda) - 1)
        ok = (t == "divider") or (last and t in ("final", "refs", "divider"))
        if not ok:
            issues.append(("WARN", f'{deck}: AGENDA-TARGET #/{n} → type="{t}" (expected divider'
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
    print("[selftest]", "PASS — broken-anchor fires" if ok else "FAIL — anchor check blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else run())
