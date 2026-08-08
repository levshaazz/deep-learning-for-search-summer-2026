#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_style — linter for narrative/style-ru.md. Report-only, CI-able.

Scans ru strings in: content/book/*/beats/*.js, Lectures/*/parts/*.html,
widgets/*/i18n.json. Codes:

  ERRORS (exit 1):
    E-DEC     decimal point in ru text/math (versions & idents excluded)
    E-TERM    forbidden glossary variant (выбелив-, интеракци-, переранкер,
              жёсткий/сложный негатив, лексический разрыв, Артифактор,
              Однашаг-, перепись(-as-rewrite is heuristic: WARN instead),
              двойной энкодер, хард-негатив, embed-verbs, чанкинг, антихаб)
    E-MASCOT  latin/mixed mascot name in ru prose (Séréga, Goodhart,
              Chunk Norris, Lexical Gremlin, Tokenosaurus, Artificer)
    E-MIXED   single word mixing latin+cyrillic letters (Séréга…)

  WARNINGS (exit 0 unless --strict):
    W-VY      обращение «вы/вас/вам/ваш» (quotes/dialogue may be legit)
    W-GENDER  gendered 2nd-person past verb near «спасибо» (finales)
    W-KANC    канцелярит: данный/является/осуществл-/имеет место/в рамках
    W-QUOTE   straight "quotes" around cyrillic text
    W-DASH    ' - ' used as a dash in ru prose
    W-YO      common ё-less spellings (еще, объем, трехмерн-, четк-)
    W-BIT     narrative «бит» outside l17 (canon: такт)

Usage: python3 check_style.py [--strict] [--full] [--codes E-DEC,W-VY] [--root PATH]
"""
import argparse
import re
import sys

import rulib
import fix_decimals

CHECKS = [
    # (code, severity, regex, note)
    ("E-TERM", "E", re.compile(r"[Вв]ыбелив\w*"), "→ отбеливание"),
    ("E-TERM", "E", re.compile(r"[Пп]оздн\w+\s+интеракци\w+|интеракци\w+"), "→ позднее взаимодействие"),
    ("E-TERM", "E", re.compile(r"[Пп]ереранкер\w*"), "→ реранкер"),
    ("E-TERM", "E", re.compile(r"[ЖжСс](?:ёстк|ложн)\w+(?:\s|&nbsp;|-)+негатив\w*"), "→ трудный негатив"),
    ("E-TERM", "E", re.compile(r"[Лл]ексическ\w+(?:\s|&nbsp;)+разрыв\w*"), "→ словарный разрыв"),
    ("E-TERM", "E", re.compile(r"Артифактор\w*"), "→ Артефактор"),
    ("E-TERM", "E", re.compile(r"[Оо]днашаг\w*"), "→ одношаговый"),
    ("E-TERM", "E", re.compile(r"[Дд]войн\w+\s+энкодер\w*"), "→ би-энкодер"),
    ("E-TERM", "E", re.compile(r"хард-негатив\w*"), "→ трудный негатив"),
    ("E-TERM", "E", re.compile(r"\b(?:за|пере)?эмбедд?и(?:тся|ться|тся|шь|те|ть|т|м|л|ла|ли)?(?![а-яё])"), "verb → закодировать/кодировать"),
    ("E-TERM", "E", re.compile(r"[Чч]анкинг\w*"), "→ чанкование"),
    ("E-TERM", "E", re.compile(r"[Аа]нтихаб\w*"), "→ анти-хаб"),
    ("E-TERM", "E", re.compile(r"[Ээ]нтейлмент\w*"), "→ логическое следование"),
    ("E-MASCOT", "E", re.compile(r"S[ée]r[ée]ga|Серега\b|Goodhart|Chunk\s+Norris|Lexical\s+Gremlin|Tokenosaurus|Sir\s+Cosine|Artificer"), "mascot name must be cyrillic in ru"),
    ("E-MIXED", "E", re.compile(r"\b(?=[\w’']*[А-Яа-яЁё])(?=[\w’']*[A-Za-z])[A-Za-zА-Яа-яЁё’']+\b"), "mixed latin+cyrillic word"),
    ("W-VY", "W", re.compile(r"\b[Вв](?:ы|ас|ам|ами)\b|\b[Вв]аш\w*\b"), "обращение на «ты» (§1)"),
    # NB: bare «данные» is the ordinary word for *data* and must NOT fire — only the
    # pointer-adjective use ("данный подход") is канцелярит. Requires a following noun
    # that is not one of the data-domain nouns the course legitimately uses.
    ("W-KANC", "W", re.compile(
        r"\b[Дд]анн(?:ый|ая|ое|ого|ой|ом)\s+(?!набор|корпус|срез)[а-яё]{3,}"
        r"|\b[Яя]вля(?:ется|ются)\b|\b[Оо]существл\w+|имеет место|в рамках"), "канцелярит (§6)"),
    # The signature tic of this text: relative «что» where Russian wants «который».
    # Fires only on <noun>, что <finite verb> — the slot «который» would fill.
    # NB: excludes изъяснительное «что» (after a verb of speech/knowledge: «знаешь, что…»)
    # and substantivised superlatives («единственное, что…») — §9.1 forbids touching those.
    ("W-CHTO", "W", re.compile(
        r"\b(?!(?:[а-яё]*(?:ешь|ишь|айте|ай|и|ь|ть|ти|ла|ло|ли|ет|ит))\b)"
        r"[а-яё]{4,}(?:а|ы|о|е|ь|й|я|и|ов|ей|ам|ах|ом)\s*,\s*что\s+"
        r"(?![бы\s])[а-яё]+(?:ет|ит|ут|ют|ат|ят|ал|ала|ало|или|ила)\b"), "→ «который» (§9.1)"),
    # Common nouns left in Latin mid-sentence. `recall@k` is a metric symbol and stays.
    ("W-LAT", "W", re.compile(r"(?<![\w@])recall(?![@\w])|(?<![\w@])precision(?![@\w])"),
     "→ «полнота (recall)» / «точность (precision)» (§9.3)"),
    # Transliterations with a settled Russian equivalent (glossary §7).
    ("W-TRANSLIT", "W", re.compile(r"\b(?:свип|шардинг\w*|аплифт\w*|скорер\w*|фиче[йсв]\w*)\b"),
     "транслит без нужды (§9.2)"),
    ("W-QUOTE", "W", re.compile(r"\"[А-Яа-яЁё][^\"]{0,60}\""), "→ «ёлочки» (§3)"),
    ("W-DASH", "W", re.compile(r"[а-яё»)] - [«а-яёА-ЯЁ(]"), "дефис как тире → « — » (§3)"),
    ("W-YO", "W", re.compile(r"\b(?:еще|объем\w*|трехмерн\w*|четк\w*|звездн\w*|трудоемк\w*|переучет\w*)\b"), "ё обязательна (§3)"),
]

GENDER_RE = re.compile(r"[Сс]пасибо[^.!?]{0,80}?\b(?:прочитал|дочитал|стоял|сидел|провёл|прошёл|дошёл|сделал|построил)\b")
BIT_RE = re.compile(r"\b(?:[Сс]ледующ[а-яё]+|[Ээ]т(?:от|ом)|[Пп]рошл[а-яё]+|[Пп]редыдущ[а-яё]+|[Фф]инальн[а-яё]+|[Пп]оследн[а-яё]+|[Пп]ерв[а-яё]+|[Кк]ажд[а-яё]+)\s+бит(?:ах|ами|ам|ов|ы|ом|е|у|а)?(?![а-яё])")

# words that are legitimately latin inside ru prose — reduce E-MIXED noise on
# things like "L2-норма" (splits at hyphen, so unaffected); no allowlist needed
# beyond skipping pure-latin tokens (regex already requires both scripts).


# Markdown link labels and bare URLs carry English author names as *citations*
# ("[Goodhart (1975)](https://…)"), which is correct bibliography, not a mascot slip.
LINKY = re.compile(r"\[[^\]]*\]\([^)]*\)|https?://\S+")


def _in_link(seg, pos):
    return any(m.start() <= pos < m.end() for m in LINKY.finditer(seg))



# «recall»/«precision» are legitimate when they are (a) the parenthetical gloss of the
# canonical Russian term — "полноты (recall)" — or (b) a symbol inside math / a metric
# enumeration. Only bare prose use is a defect.
GLOSS = re.compile(r"(?:полнот\w+|точност\w+)\s*\((?:recall|precision)\)|"
                   r"\((?:precision|recall)[–—-](?:precision|recall)\)")
MATHY = re.compile(r"\\text\{[^}]*\}|\\\(|\\\)|\$\$")


def _lat_ok(seg, m):
    if any(g.start() <= m.start() < g.end() for g in GLOSS.finditer(seg)):
        return True
    left = seg[max(0, m.start() - 12):m.start()]
    right = seg[m.end():m.end() + 12]
    if "\\text{" in left or MATHY.search(left) or MATHY.search(right):
        return True
    # enumeration of metric names: "precision, recall, MAP, nDCG"
    return bool(re.search(r"(?:MAP|nDCG|MRR|precision|recall)\s*[,–—]\s*$", left) or
                re.match(r"\s*[,–—]\s*(?:MAP|nDCG|MRR|precision|recall)", right))


def lint_segment(seg, relpath, base_line, findings, is_l17, is_beats):
    for code, sev, rx, note in CHECKS:
        for m in rx.finditer(seg):
            if code in ("E-MASCOT", "W-LAT") and _in_link(seg, m.start()):
                continue
            if code == "W-LAT" and _lat_ok(seg, m):
                continue
            findings.append((sev, code, relpath, base_line(m.start()),
                             m.group(0)[:60], note))
    for m in GENDER_RE.finditer(seg):
        findings.append(("W", "W-GENDER", relpath, base_line(m.start()),
                         m.group(0)[:80], "финал без гендер-маркировки (§1)"))
    if is_beats and not is_l17:
        for m in BIT_RE.finditer(seg):
            findings.append(("W", "W-BIT", relpath, base_line(m.start()),
                             m.group(0)[:60], "→ такт (§7)"))
    # decimals via fix_decimals machinery (math-aware)
    for is_math, ms, me in rulib.split_math(seg):
        for s, e, rep, note in fix_decimals.convert_segment(
                seg[ms:me], is_math, " "):
            if note in ("plain", "math"):
                findings.append(("E", "E-DEC", relpath, base_line(ms + s),
                                 seg[ms:me][max(0, s - 15):e + 10].replace("\n", " "),
                                 "десятичная запятая (§2), напр. " + rep))


def process(path, root, kind, findings):
    text = rulib.read(path)
    relpath = rulib.rel(root, path)
    is_l17 = "/l17/" in relpath.replace("\\", "/")
    if kind in ("beats", "widgets"):
        regions = [(s, e) for lang, s, e in rulib.lang_string_spans(text) if lang == "ru"]
    else:
        regions = rulib.ru_text_spans_html(text)
    for rs, re_ in regions:
        seg = text[rs:re_]
        lint_segment(seg, relpath,
                     lambda off, rs=rs: rulib.line_of(text, rs + off),
                     findings, is_l17, kind == "beats")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true", help="warnings also fail")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--codes", help="only these codes, comma-separated")
    ap.add_argument("--summary", action="store_true", help="counts only")
    ap.add_argument("--root", default=rulib.REPO_DEFAULT)
    args = ap.parse_args(argv)
    codes = set(args.codes.split(",")) if args.codes else None

    findings = []
    for path in rulib.beats_files(args.root):
        process(path, args.root, "beats", findings)
    for path in rulib.parts_files(args.root):
        process(path, args.root, "parts", findings)
    for path in rulib.widget_i18n_files(args.root):
        process(path, args.root, "widgets", findings)

    if codes:
        findings = [f for f in findings if f[1] in codes]

    counts = {}
    for sev, code, _, _, _, _ in findings:
        counts[code] = counts.get(code, 0) + 1
    if not args.summary:
        limit = None if args.full else 120
        for i, (sev, code, relpath, line, frag, note) in enumerate(sorted(findings, key=lambda f: (f[1], f[2], f[3]))):
            if limit is not None and i >= limit:
                print("... (%d more; use --full)" % (len(findings) - limit))
                break
            print("%s %-9s %s:%d  %r  [%s]" % (sev, code, relpath, line, frag, note))
    print("== summary ==")
    for code in sorted(counts):
        print("  %-9s %d" % (code, counts[code]))
    n_err = sum(1 for f in findings if f[0] == "E")
    n_warn = len(findings) - n_err
    print("errors: %d, warnings: %d" % (n_err, n_warn))
    return 1 if (n_err or (args.strict and n_warn)) else 0


if __name__ == "__main__":
    sys.exit(main())
