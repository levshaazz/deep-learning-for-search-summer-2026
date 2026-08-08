#!/usr/bin/env python3
"""check_lexicon.py — G15 LEXICON / TYPOGRAPHY gate.

Turns the most-recurring audit classes (RU/TT translation + typography defects that LLM passes kept
re-finding) into a static, deterministic check, so they can't recur silently.

HARD — unambiguous, language-agnostic-wrong, and currently ZERO in the tree (so forbidding them only
       blocks RE-introduction, never a legitimate string):
  • U+00AD soft hyphen in Cyrillic prose (a copy-paste typography defect; none are intentional here).
  • "чанкинг"  — the rejected transliteration; the project canon is "чанкование".
  • "реранкинг" — rejected; canon is "переранжирование" (RU) / "кабат ранжлау" (TT).
    NOTE the stem "реранк-" itself (реранк · реранкер · реранка) is COURSE CANON and stays legal —
    43 committed files use it. Only the "-инг" transliteration is banned.
  • model/version decimal-COMMA: GPT-3,5 · wav2vec 2,0 · 3,5-turbo — version numbers use a POINT; this
    is exactly the regression a round-2 decimal-comma sweep introduced (caught late by re-review).
  • [A] SCRIPT-MIXING — a Latin letter directly ADJACENT to a Cyrillic letter INSIDE one token:
    «биredә», «ауmый», «кушa», «Séréга». This is mojibake, and it is invisible: a Latin glyph that
    looks like its Cyrillic twin (a/а · c/с · e/е · o/о · p/р · y/у) replaces it and the word still
    LOOKS right, while search, spell-check, screen readers and hyphenation all break. No human
    proofreader has ever caught one of these; three shipped.
    Deliberately NOT "both alphabets somewhere in one token" — that fires ~180× on legitimate forms
    (`softmax'ка`, `head'лар`, `«sat»'ка`) where an apostrophe separates the scripts. Index notation
    (a Cyrillic word carrying a subscript — `докᵢ`, `документᵢ`) is whitelisted: see ADJ_OK.
  • [B] the stem «свёрт»/«сверт», SCOPED to widgets/ncd-*: the NCD family's canon for a contraction is
    «стягивание». A repo-wide ban is impossible — ~43 files use «свёртка/сворачивать» legitimately —
    but INSIDE this family the word is not merely off-canon, it is dangerous: «свёртка» is also the
    Russian for CONVOLUTION. Lectures/06-*/parts/47-vit-patches-as-tokens.html tells the student
    «Никаких свёрток: 196 патчей…» while ncd-einsum used to tell the same student, in the same block,
    «внимание — это ДВЕ свёртки». One literature gloss survives so the term is still findable in the
    papers, and it is capped at one — see NCD_SVERT_GLOSS.

WARN — advisory denylist of confirmed RU-into-Tatar stranding + non-canon term renderings. Some of
       these are legitimate Russian words (so not build-blocking), but their presence is worth a look.

DEBT — script-mixing that already existed in files OUTSIDE the change which introduced rule [A].
       Quarantined, not forgiven: every entry prints on every run, the count can only go DOWN, and a
       quarantine entry that no longer matches anything HARD-fails, so the list cannot rot. It is not
       a way to pass the gate — a NEW mixed token is a hard failure wherever in the tree it appears.

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

# ── [A] script-mixing ────────────────────────────────────────────────────────────────────────────
# The Latin class carries the ACCENTED Latin-1/Extended letters (that is how «бóльшую» hides — a Latin
# ó standing in for Cyrillic о́) and the modifier letters (ᵢ ⁿ), so index notation is SEEN and then
# explicitly allowed, never accidentally missed. × (U+00D7) and ÷ (U+00F7) are maths — excluded.
LAT = 'A-Za-zÀ-ÖØ-öø-ɏᴀ-ᵿⁱⁿ'
CYR = 'Ѐ-ӿԀ-ԯ'
ADJACENT = re.compile('[%s][%s]|[%s][%s]' % (CYR, LAT, LAT, CYR))
# A token: a run of letters plus the apostrophes that LEGITIMATELY join the two scripts (softmax'ка).
TOKEN = re.compile("[%s%s’'ʼ]+" % (CYR, LAT))
# Legitimate: a Cyrillic word carrying a subscript index — докᵢ, документᵢ. Notation, not mojibake.
ADJ_OK = [re.compile('^[%s]+[ᵢⁱⱼₖ]$' % CYR)]

# QUARANTINE — script-mixing that predates this rule and sits outside the NCD family. token → owner.
# NOT a pardon: it prints on every run, and a stale entry HARD-fails so the list can never rot.
ADJ_DEBT = {
    'Séréга':     'content/book/l13,l15,l16,l17,l18 beats — RU/TT image alt-text: Latin "Séré" + Cyrillic "га". Canon: «Серёга» (RU/TT), "Séréga" (EN).',
    'кунa':       'widgets/block-geometry/i18n.json — Latin a in «куна».',
    'сакланa':    'widgets/block-geometry/i18n.json — Latin a in «саклана».',
    'тыелa':      'widgets/block-geometry/i18n.json — Latin a in «тыела».',
    'ясa':        'content/book/l10/beats/40-adaptive-rag.js — Latin a in «яса».',
    'кыланa':     'content/book/l14/beats/08-hyde-idea.js — Latin a in «кылана».',
    'ткачlyk':    'content/book/l15/beats/04-self-attention.js — Latin "lyk" spliced into «ткачлык».',
    'таракcыз':   'content/book/l15/beats/05-multi-head.js — Latin c in «таракcыз».',
    'embeddlә':   'content/book/l16/beats/02-why-small-chunks.js — Latin stem, no apostrophe (canon: embed’лә).',
    'datasetлар': 'content/book/l16/beats/10-evidence.js — Latin stem, no apostrophe (canon: dataset’лар).',
    'bitларда':   'content/book/l17/beats/01-hook-telegraph.js — Latin stem, no apostrophe (canon: bit’ларда).',
    'bitка':      'content/book/l17/beats/01-hook-telegraph.js — Latin stem, no apostrophe (canon: bit’ка).',
}

# ── [B] «свёртка» inside the NCD family ──────────────────────────────────────────────────────────
NCD_SCOPE = os.path.join('widgets', 'ncd-')
SVERT = re.compile('[Сс]в[её]рт[а-яё]*|[Сс]верт[а-яё]*')
# The ONE literature gloss, so the student can still look the term up in the papers. Capped at one
# occurrence across the whole family: it is a signpost, not a synonym you may reach for again.
NCD_SVERT_GLOSS = re.compile('тензорн[а-яё]* +св[её]ртк[а-яё]*')
NCD_SVERT_GLOSS_MAX = 1


def scan(text, patterns):
    """→ list of (label, matched-substring) for every HARD pattern hit in `text`."""
    hits = []
    for label, pat in patterns:
        for m in pat.finditer(text):
            hits.append((label, m.group()))
    return hits


def mixed_tokens(text):
    """→ every token with a Latin letter directly adjacent to a Cyrillic one (index notation aside)."""
    out = []
    for m in TOKEN.finditer(text):
        w = m.group()
        if ADJACENT.search(w) and not any(ok.match(w) for ok in ADJ_OK):
            out.append(w)
    return out


def ncd_svert(text):
    """→ (banned «свёрт/сверт» hits, count of the allowed literature gloss) for one ncd-* file."""
    masked = NCD_SVERT_GLOSS.sub(lambda m: '·' * len(m.group()), text)
    return [m.group() for m in SVERT.finditer(masked)], len(NCD_SVERT_GLOSS.findall(text))


def source_files():
    R = glob.escape(ROOT)   # repo path contains "[Summer 2026]" → escape for glob's char-class
    return (glob.glob(os.path.join(R, 'content', 'book', '*', 'beats', '*.js'))
            + glob.glob(os.path.join(R, 'Lectures', '*', 'parts', '*.html'))
            + glob.glob(os.path.join(R, 'widgets', '*', 'i18n.json'))
            + glob.glob(os.path.join(R, 'widgets', '*', 'manifest.json')))


def main():
    if '--selftest' in sys.argv:
        return selftest()
    files = source_files()
    hard = 0
    debt_seen = {}
    gloss_total = 0
    for f in files:
        try:
            t = open(f, encoding='utf-8').read()
        except OSError:
            continue
        rel = os.path.relpath(f, ROOT)
        for label, sub in scan(t, HARD_PATTERNS):
            hard += 1
            print(f"  ✗ [HARD] {label}: found {sub!r} in {rel}")
        for w in mixed_tokens(t):                                   # [A]
            if w in ADJ_DEBT:
                debt_seen[w] = debt_seen.get(w, 0) + 1
                continue
            hard += 1
            print(f"  ✗ [HARD] Latin letter adjacent to Cyrillic inside a token: {w!r} in {rel}")
        if NCD_SCOPE in rel:                                        # [B]
            bad, gloss = ncd_svert(t)
            gloss_total += gloss
            for sub in bad:
                hard += 1
                print(f"  ✗ [HARD] «свёрт/сверт» in the NCD family (canon: стягивание): {sub!r} in {rel}")
        for tok in WARN_TOKENS:
            if ' как ' in tok:           # term-canon WARN entries are descriptive, skip raw grep
                continue
            if tok in t:
                print(f"  ! [WARN] confirmed-stranding token {tok!r} in {rel}")

    if gloss_total > NCD_SVERT_GLOSS_MAX:
        hard += 1
        print(f"  ✗ [HARD] the «тензорная свёртка» literature gloss appears {gloss_total}× in "
              f"widgets/ncd-* — it is a signpost, allowed {NCD_SVERT_GLOSS_MAX}× only. Use «стягивание».")
    for w, why in sorted(ADJ_DEBT.items()):
        if w not in debt_seen:
            hard += 1
            print(f"  ✗ [HARD] stale quarantine: {w!r} no longer exists — delete it from ADJ_DEBT "
                  f"(the list must shrink, never rot)")
        else:
            print(f"  · [DEBT] script-mixing {debt_seen[w]}× — {w!r}: {why}")

    print(f"\n[check-lexicon] scanned {len(files)} source files")
    print(f"[check-lexicon] HARD(soft-hyphen/чанкинг/реранкинг/model-comma/script-mixing/ncd-«свёртка»)={hard}")
    print(f"[check-lexicon] DEBT(quarantined script-mixing, outside the NCD family)="
          f"{sum(debt_seen.values())} in {len(debt_seen)} tokens — fix one, delete its entry")
    if hard:
        sys.exit(1)


def selftest():
    ok = []
    # the four original HARD classes
    bad = "GPT-3,5 turbo · чанкинг · поза­просная · реранкинг"
    good = "GPT-3.5-turbo · чанкование · переранжирование · 0,75 · arXiv 2403.05440 · реранкер"
    hb, hg = scan(bad, HARD_PATTERNS), scan(good, HARD_PATTERNS)
    ok.append(('bad string fires all 4 original HARD classes', len(hb) >= 4))
    ok.append(('canon-correct string clean — the «реранк-» stem stays legal', len(hg) == 0))

    # [A] one planted token per real defect shape; the legitimate forms must stay silent
    planted = "биredә · ауmый · кушa · Séréга · бóльшую"
    legit = ("softmax'ка · head'лар · «sat»'ка · докᵢ · документᵢ · "
             "n×m · 25.8 ГБ · чыбык = күчәр · concat'тан соң · broadcast күчәре")
    mp, ml = mixed_tokens(planted), mixed_tokens(legit)
    ok.append(('[A] fires on every planted mojibake (5/5)', len(mp) == 5))
    ok.append(('[A] silent on apostrophe-joined stems and subscript index notation', ml == []))
    ok.append(('[A] a QUARANTINED token is still DETECTED (quarantine ≠ blind spot)',
               mixed_tokens('Séréга') == ['Séréга']))
    ok.append(('[A] every ADJ_DEBT key is itself a real mixed token (no dead entries)',
               all(mixed_tokens(w) == [w] for w in ADJ_DEBT)))

    # [B] «свёртка» in the NCD family — banned, except the single literature gloss
    ncd_bad = "внимание — это ДВЕ свёртки с softmax · чашка-свёртка · N свёрток"
    ncd_ok = "это стягивание оси (в литературе — «тензорная свёртка»), и здесь оно съедает d"
    nb, _ = ncd_svert(ncd_bad)
    ng, gl = ncd_svert(ncd_ok)
    ok.append(('[B] «свёрт/сверт» fires in the NCD family (3/3)', len(nb) == 3))
    ok.append(('[B] the single literature gloss is allowed', ng == [] and gl == 1))
    ok.append(('[B] a SECOND gloss breaches the cap',
               len(NCD_SVERT_GLOSS.findall(ncd_ok * 2)) > NCD_SVERT_GLOSS_MAX))
    ok.append(('[B] the ban is SCOPED — L06’s legitimate «Никаких свёрток» is out of scope',
               NCD_SCOPE in os.path.join('widgets', 'ncd-einsum', 'i18n.json')
               and NCD_SCOPE not in os.path.join('Lectures', '06-vit', 'parts', '47.html')))

    for label, passed in ok:
        print(f"  {'✓' if passed else '✗'} {label}")
    if not all(p for _, p in ok):
        print('[check-lexicon] SELFTEST FAILED'); sys.exit(1)
    print('[check-lexicon] selftest PASS — fires on soft-hyphen/чанкинг/реранкинг/model-comma/'
          'script-mixing/ncd-«свёртка»; silent on canon-correct prose')


if __name__ == '__main__':
    main()
