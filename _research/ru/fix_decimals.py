#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fix_decimals — decimal point -> comma inside ru strings only.

Scope: content/book/*/beats/*.js (ru: strings) + Lectures/*/parts/*.html
(<span|p lang="ru"> text nodes). en/tt untouched. Rules (narrative/style-ru.md §2):
  * plain ru text:   3.7  -> 3,7      (12.7% -> 12,7%)
  * ru LaTeX math:   0.75 -> 0{,}75
  * thousands:       32,768 -> 32 768 (U+202F in beats, &nbsp; in parts);
                     LaTeX 32{,}768 -> 32\\,768
  * NEVER: versions/identifiers (GPT-3.5, Python 3.9, v2.0 — guarded by a
    preceding latin letter / '-' / '.' / '/' and a word blocklist), URLs,
    multi-dot tokens (1.2.3), <code>, en/tt strings.

Usage: python3 fix_decimals.py [--apply] [--full] [--root PATH]
Default is dry-run: prints file, line, before -> after; changes nothing.
"""
import argparse
import re
import sys

import rulib

VERSION_WORDS = {
    "llama", "qwen", "gemini", "mistral", "python", "cuda", "node", "faiss",
    "bert", "gpt", "claude", "phi", "gemma", "deepseek", "grok",
    "версия", "версии", "версию", "версией", "версиях",
    "v", "V", "top", "beir", "trec", "unicode",
    # standard numbers are identifiers too: «ГОСТ 7.79-2000», «ISO 9:1995», «ИСО 9».
    "гост", "iso", "исо", "стандарт", "стандарта",
    "wav2vec", "word2vec", "doc2vec", "seq2seq",
}

# Trailing guard is `(?!\d|\.\d)`, NOT `(?![\d.])`: both reject version tails ("1.2.3" — the
# match "1.2" is followed by ".3"), but the old form ALSO rejected a decimal at the end of a
# sentence — "ловушка падает до 0.16." — because the sentence period follows the number. That
# made every sentence-final decimal invisible to E-DEC and to the sweep (found Aug 2026: a
# reviewer caught 0.16 in L14 that three full lint passes had silently skipped).
#
# The LEADING guard has the same history one step later. It was `(?<![\d.,])`, and the `,` in that
# class rejected every decimal preceded by a comma — which in LaTeX means every element of a tuple
# after the first: `\((0{,}829,\,0.112,\,0.041)\)`. So a formula could mix both separators and E-DEC
# saw none of it. `(?<![\d.])(?<!,\d)` keeps the two cases the comma was there for — thousands
# groups (`32,768`) and version tails — while letting a tuple element through.
DEC_RE = re.compile(r"(?<![\d.])(?<!,\d)(\d+)\.(\d+)(?!\d|\.\d)")
# thousands: 1,000,000 — TWO OR MORE comma groups only.
#
# A SINGLE group is not decidable by shape: in Russian canon the comma IS the decimal separator,
# so `50,625` is avgdl = 50.625 and `0,000` is a recall of zero — both identical in form to an
# English thousands group. This rule used to accept one group, and on the corpus of Aug-2026 that
# produced 12 proposed edits of which **12 were wrong**: avgdl 50,625 → "50 625", H₀ 5,000 →
# "5 000", recall 0,000 → "0 000", distance 17,088 → "17 088". Nobody had run --apply, so the
# damage stayed potential — but the fixer was one command away from corrupting five decks.
# Two groups cannot be a decimal, so that is where automatic rewriting is safe; a single group
# needs a human who knows whether the number is a vocabulary size or a measurement.
THOU_RE = re.compile(r"(?<![\d.,])(\d{1,3})((?:,\d{3}){2,})(?![\d])")
# Same reasoning for the LaTeX form: `50{,}625` is avgdl, not fifty thousand.
THOU_TEX_RE = re.compile(r"(?<![\d.,])(\d{1,3})((?:\{,\}\d{3}){2,})(?![\d])")

URL_HINT_RE = re.compile(r"(?:https?:|www\.|://|\.(?:com|org|io|ai|py|js|html|json))", re.I)


def _prev_word(seg, start):
    m = re.search(r"([A-Za-zА-Яа-яЁё][\w.\-]*)[\s(«\"' ;]*$", seg[max(0, start - 24):start])
    return m.group(1) if m else ""


def _guarded(seg, m):
    """Return reason string if this match must NOT be converted."""
    s = m.start()
    # ':' belongs here too — without it "arXiv:2409.04701" reads as a decimal and the
    # sweep silently breaks every citation id it touches (it did: 31 ids, Aug 2026).
    if s > 0 and seg[s - 1] in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz._/:":
        # …unless those letters are a LaTeX control word: `\to0.005`, `\approx2.003`, `\cdot1.3333`
        # are an operator meeting its operand, not a name meeting a version. Reading them as
        # identifiers hid 13 more decimals — and only in ru math, where the separator matters.
        a = s
        while a > 0 and seg[a - 1].isalpha():
            a -= 1
        if not (a > 0 and seg[a - 1] == "\\" and a < s):
            return "ident"
    # A hyphen is BOTH an identifier joiner ("GPT-3.5", "Apache-2.0") and a minus sign
    # ("(1-0.75)", "=-0.406", "{-2.0}"). Treating it as always-identifier hid 26 real decimals in
    # ru regions — every negative number and every subtraction in the corpus. What separates them
    # is the character BEFORE the hyphen: a letter means a name, anything else means arithmetic.
    if s > 1 and seg[s - 1] == "-":
        if seg[s - 2].isalpha():
            return "ident"
    elif s == 1 and seg[0] == "-":
        pass          # segment starts with a minus: arithmetic by construction
    # A section reference — «§4.1», «&sect;3.2» — is not a decimal: papers number their
    # sections with dots in every language. Look back past spaces for the section sign.
    back = seg[max(0, s - 12):s]
    if back.rstrip().endswith("§") or back.rstrip().endswith("&sect;"):
        return "section-ref"
    pw = _prev_word(seg, s).rstrip(".-").lower()
    if pw in VERSION_WORDS:
        return "version-word:%s" % pw
    # crude URL guard: look at the whitespace-delimited token around the match
    a = s
    while a > 0 and not seg[a - 1].isspace():
        a -= 1
    b = m.end()
    while b < len(seg) and not seg[b].isspace():
        b += 1
    if URL_HINT_RE.search(seg[a:b]):
        return "url"
    return None


def convert_segment(seg, is_math, thousands_sep):
    """Return list of (start, end, replacement, note) relative to seg."""
    edits = []
    if is_math:
        for m in DEC_RE.finditer(seg):
            if _guarded(seg, m):
                continue
            edits.append((m.start(), m.end(), "%s{,}%s" % (m.group(1), m.group(2)), "math"))
        for m in THOU_TEX_RE.finditer(seg):
            groups = m.group(2).split("{,}")[1:]
            edits.append((m.start(), m.end(),
                          m.group(1) + "".join("\\," + g for g in groups), "tex-thousands"))
    else:
        for m in DEC_RE.finditer(seg):
            if _guarded(seg, m):
                continue
            edits.append((m.start(), m.end(), "%s,%s" % (m.group(1), m.group(2)), "plain"))
        for m in THOU_RE.finditer(seg):
            # [380,470] / (200,400) are coordinate intervals, not thousands
            if (m.start() > 0 and seg[m.start() - 1] in "[("
                    and m.end() < len(seg) and seg[m.end()] in "])"):
                continue
            # No `int(head) >= 10` / `frac == ",000"` heuristics here any more: those were what
            # let avgdl `50,625` and recall `0,000` be read as thousands. Two groups is the only
            # shape a Russian decimal cannot take, and the regex already requires it.
            groups = m.group(2).split(",")[1:]
            rep = m.group(1) + "".join(thousands_sep + g for g in groups)
            edits.append((m.start(), m.end(), rep, "thousands"))
            # else: ambiguous (e.g. 2,718 could be a decimal) — leave to editors
    return edits


def process_file(path, root, kind, reporter):
    text = rulib.read(path)
    sep = " " if kind == "beats" else "&nbsp;"
    if kind == "beats":
        regions = [(s, e) for (lang, s, e) in rulib.lang_string_spans(text) if lang == "ru"]
    else:
        regions = rulib.ru_text_spans_html(text)
    file_edits = []
    for (rs, re_) in regions:
        segment = text[rs:re_]
        for is_math, ms, me in rulib.split_math(segment):
            sub = segment[ms:me]
            for s, e, rep, note in convert_segment(sub, is_math, sep):
                abs_s = rs + ms + s
                abs_e = rs + ms + e
                file_edits.append((abs_s, abs_e, rep))
                ctx = text[max(0, abs_s - 28):abs_s] + "‹" + text[abs_s:abs_e] + "›" + text[abs_e:abs_e + 18]
                reporter.add(rulib.rel(root, path), rulib.line_of(text, abs_s),
                             ctx.replace("\n", " "), rep, note)
    return text, file_edits


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="write changes (default: dry-run)")
    ap.add_argument("--dry-run", action="store_true", help="explicit dry-run (default)")
    ap.add_argument("--full", action="store_true", help="print all rows, no truncation")
    ap.add_argument("--root", default=rulib.REPO_DEFAULT)
    args = ap.parse_args(argv)

    reporter = rulib.Reporter("fix_decimals")
    pending = []
    for path in rulib.beats_files(args.root):
        text, edits = process_file(path, args.root, "beats", reporter)
        if edits:
            pending.append((path, text, edits))
    for path in rulib.parts_files(args.root):
        text, edits = process_file(path, args.root, "parts", reporter)
        if edits:
            pending.append((path, text, edits))

    reporter.dump(limit=None if args.full else 60)
    if args.apply:
        for path, text, edits in pending:
            rulib.write(path, rulib.apply_edits(text, edits))
        print("APPLIED to %d file(s)." % len(pending))
    else:
        print("DRY-RUN: no files modified. (%d file(s) would change)" % len(pending))
    return 0


if __name__ == "__main__":
    sys.exit(main())
