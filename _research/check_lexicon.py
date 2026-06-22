#!/usr/bin/env python3
"""check_lexicon.py — G15 LEXICON / TYPOGRAPHY gate.

Turns the most-recurring audit classes (RU/TT translation + typography defects that LLM passes kept
re-finding) into a static, deterministic check, so they can't recur silently.

HARD — unambiguous, language-agnostic-wrong, and currently ZERO in the tree (so forbidding them only
       blocks RE-introduction, never a legitimate string):
  • U+00AD soft hyphen in Cyrillic prose (a copy-paste typography defect; none are intentional here).
  • "чанкинг"  — the rejected transliteration; the project canon is "чанкование".
  • "реранкинг" — rejected; canon is "переранжирование" (RU) / "кабат ранжлау" (TT).
  • model/version decimal-COMMA: GPT-3,5 · wav2vec 2,0 · 3,5-turbo — version numbers use a POINT; this
    is exactly the regression a round-2 decimal-comma sweep introduced (caught late by re-review).

WARN — advisory denylist of confirmed RU-into-Tatar stranding + non-canon term renderings. Some of
       these are legitimate Russian words (so not build-blocking), but their presence is worth a look.

Usage:  python3 _research/check_lexicon.py            (HARD-fails on any forbidden token)
        python3 _research/check_lexicon.py --selftest  (planted defects must fire; clean text must not)
"""
import re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (label, compiled-pattern) — HARD: each must be 0 in source prose.
HARD_PATTERNS = [
    ('soft-hyphen U+00AD in Cyrillic', re.compile('[Ѐ-ӿ]­|­[Ѐ-ӿ]')),
    ('"чанкинг" (canon: чанкование)', re.compile('чанкинг')),
    ('"реранкинг" (canon: переранжирование / кабат ранжлау)', re.compile('реранкинг')),
    ('model/version decimal-comma (e.g. GPT-3,5)', re.compile(r'(GPT-\d,\d|wav2vec\s+\d,\d|\d,\d-turbo)')),
]
# WARN denylist: confirmed stranding / non-canon renderings (advisory — some are legit Russian).
WARN_TOKENS = ['выдача', 'расписание', 'предсказаниеләр', 'явные', 'вложи', 'обреченный',
               'обречённый', 'подвох', 'достоверность как faithfulness', 'отзыв как recall']

def scan(text, patterns):
    """→ list of (label, matched-substring) for every HARD pattern hit in `text`."""
    hits = []
    for label, pat in patterns:
        for m in pat.finditer(text):
            hits.append((label, m.group()))
    return hits

def source_files():
    R = glob.escape(ROOT)   # repo path contains "[Summer 2026]" → escape for glob's char-class
    return (glob.glob(os.path.join(R, 'content', 'book', '*', 'beats', '*.js'))
            + glob.glob(os.path.join(R, 'Lectures', '*', 'parts', '*.html'))
            + glob.glob(os.path.join(R, 'widgets', '*', 'i18n.json')))

def main():
    if '--selftest' in sys.argv:
        return selftest()
    files = source_files()
    hard = 0
    for f in files:
        try:
            t = open(f, encoding='utf-8').read()
        except OSError:
            continue
        rel = os.path.relpath(f, ROOT)
        for label, sub in scan(t, HARD_PATTERNS):
            hard += 1
            print(f"  ✗ [HARD] {label}: found {sub!r} in {rel}")
        for tok in WARN_TOKENS:
            if ' как ' in tok:           # term-canon WARN entries are descriptive, skip raw grep
                continue
            if tok in t:
                print(f"  ! [WARN] confirmed-stranding token {tok!r} in {rel}")
    print(f"\n[check-lexicon] scanned {len(files)} source files")
    print(f"[check-lexicon] HARD(soft-hyphen/чанкинг/реранкинг/model-comma)={hard}")
    if hard:
        sys.exit(1)

def selftest():
    bad = "GPT-3,5 turbo · чанкинг · поза­просная · реранкинг"
    good = "GPT-3.5-turbo · чанкование · переранжирование · 0,75 · arXiv 2403.05440"
    hb = scan(bad, HARD_PATTERNS)
    hg = scan(good, HARD_PATTERNS)
    ok1 = len(hb) >= 4            # all four HARD classes fire on the bad string
    ok2 = len(hg) == 0           # the canon-correct string is clean (point-version, чанкование, comma-decimal)
    print(f"  {'✓' if ok1 else '✗'} bad string fires {len(hb)} HARD: {[h[0].split('(')[0].strip() for h in hb]}")
    print(f"  {'✓' if ok2 else '✗'} canon-correct string clean: {hg}")
    if not (ok1 and ok2):
        print('[check-lexicon] SELFTEST FAILED'); sys.exit(1)
    print('[check-lexicon] selftest PASS — fires on soft-hyphen/чанкинг/реранкинг/model-comma; silent on canon-correct prose')

if __name__ == '__main__':
    main()
