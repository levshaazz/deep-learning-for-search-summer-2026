#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fix_serega — normalize the mascot's name per narrative/style-ru.md §5.

  * ru strings: any latin / mixed-script / yo-less variant -> Серёга
      (Séréga, Sérega, Séréга [mixed], Серёga [mixed], Серега)
  * en strings: mixed-script repair only: Séréга -> Séréga
  * tt strings: OFF by default (mandate is ru); --include-tt normalizes the
      mixed usage there to Серёга as well (tt already prefers Серёга).

Scope: content/book/*/beats/*.js + Lectures/*/parts/*.html.
Usage: python3 fix_serega.py [--apply] [--include-tt] [--full] [--root PATH]
"""
import argparse
import re
import sys

import rulib

# any mix of S/С, é/e/е, r/р, g/г, a/а spelling the name — built explicitly:
RU_VARIANTS = re.compile(
    r"S[ée]r[ée](?:ga|га|gа|гa)"   # Séréga, Séréга + stray hybrids
    r"|Серёga|Серega|Серёгa"        # cyrillic base with latin tail chars
    r"|Серега"                        # yo-less cyrillic
)
EN_MIXED = re.compile(r"S[ée]r[ée](?:га|гa)|Серёga")


def process_file(path, root, kind, include_tt, reporter):
    text = rulib.read(path)
    file_edits = []

    def scan(region_lang_spans):
        for lang, rs, re_ in region_lang_spans:
            seg = text[rs:re_]
            if lang == "ru" or (lang == "tt" and include_tt):
                pat, rep = RU_VARIANTS, "Серёга"
            elif lang == "en":
                pat, rep = EN_MIXED, "Séréga"
            else:
                continue
            for m in pat.finditer(seg):
                if m.group(0) == rep:
                    continue
                s, e = rs + m.start(), rs + m.end()
                file_edits.append((s, e, rep))
                ctx = text[max(0, s - 20):s] + "‹" + m.group(0) + "›" + text[e:e + 20]
                reporter.add(rulib.rel(root, path), rulib.line_of(text, s),
                             ctx.replace("\n", " "), rep, lang)

    if kind == "beats":
        scan(rulib.lang_string_spans(text))
    else:
        scan([("ru", s, e) for s, e in rulib.ru_text_spans_html(text)])
    return text, file_edits


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--include-tt", action="store_true",
                    help="also normalize tt strings to Серёга")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--root", default=rulib.REPO_DEFAULT)
    args = ap.parse_args(argv)

    reporter = rulib.Reporter("fix_serega")
    pending = []
    for path in rulib.beats_files(args.root):
        text, edits = process_file(path, args.root, "beats", args.include_tt, reporter)
        if edits:
            pending.append((path, text, edits))
    for path in rulib.parts_files(args.root):
        text, edits = process_file(path, args.root, "parts", args.include_tt, reporter)
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
