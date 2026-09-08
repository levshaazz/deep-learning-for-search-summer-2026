#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fix_terms — mechanical, UNambiguous glossary replacements per
narrative/style-ru.md §7. Everything ambiguous (вы→ты, поиск/извлечение,
«ломоть»-images, latin Goodhart/Chunk Norris morphology, канцелярит) is left
to editors and only flagged by check_style.py.

Rules (each narrow, reviewed via --dry-run):
  T01 выбеливание -> отбеливание                (ru; l5 keeps its L6 promise)
  T02 «поздняя интеракция» -> «позднее взаимодействие»  (6 exact needles —
      gender agreement of neighbours is hand-mapped)
  T03 Артифактор -> Артефактор                  (proper-noun typo; ru+tt)
  T04 переранкер -> реранкер                    (ru)
  T05 жёсткие/сложные негативы -> трудные       (ru; declension-mapped)
  T06 лексический разрыв -> словарный разрыв    (ru; mascot name untouched)
  T07 embed-verb forms -> кодировать-forms      (ru; explicit form map)
  T08 narrative «бит» -> «такт»                 (ru beats; the chapter that OWNS the
      subject "bit" is exempt — resolved by content, never by path)
  T09 расплата -> развязка (payoff beats)       (exact needles)
  T10 перепись/переписыватель -> переписывание/переписчик (exact needles)
  T11 Однашаговый -> одношаговый                (widgets/graphrag i18n)
  T12 сэр Косинус -> Сэр Косинус                (ru)
  T13 gendered finale thanks -> impersonal formulas (4 exact needles)

Usage: python3 fix_terms.py [--apply] [--full] [--only T05,T08] [--root PATH]
"""
import argparse
import re
import sys

import rulib

ADJ_NORM = {"ий": "ый", "ие": "ые", "их": "ых", "им": "ым", "ими": "ыми"}


def _neg_repl(m):
    first = "Т" if m.group(1) in "ЖС" else "т"
    end = ADJ_NORM.get(m.group(3), m.group(3))
    return first + "рудн" + end + m.group(4) + m.group(5)


def _lex_repl(m):
    first = "С" if m.group(1) == "Л" else "с"
    end = ADJ_NORM.get(m.group(2), m.group(2))
    return first + "ловарн" + end + m.group(3) + "разрыв"


EMBED_FORMS = [  # longest-first; final lookahead added at compile time
    ("переэмбеддил", "перекодировал"),
    ("заэмбедить", "закодировать"), ("заэмбедим", "закодируем"),
    ("заэмбедили", "закодировали"), ("заэмбедила", "закодировала"),
    ("заэмбедил", "закодировал"),
    ("эмбеддиться", "кодироваться"), ("эмбеддится", "кодируется"),
    ("эмбеддятся", "кодируются"),
    ("эмбеддишь", "кодируешь"), ("эмбедишь", "кодируешь"),
    ("эмбеддите", "кодируете"), ("эмбеддить", "кодировать"),
    ("эмбеддили", "кодировали"), ("эмбеддила", "кодировала"),
    ("эмбеддил", "кодировал"), ("эмбеддит", "кодирует"),
    ("эмбеддим", "кодируем"),
    ("эмбеддь", "закодируй"), ("эмбедди", "закодируй"),
]
EMBED_RE = re.compile(
    r"\b(" + "|".join(f for f, _ in EMBED_FORMS) + r")(?![а-яё])")
EMBED_MAP = dict(EMBED_FORMS)

BIT_RE = re.compile(
    r"\b([Сс]ледующ[а-яё]+|[Ээ]т(?:от|ом|и|им|ими|их)|[Пп]рошл[а-яё]+"
    r"|[Пп]редыдущ[а-яё]+|[Фф]инальн[а-яё]+|[Пп]оследн[а-яё]+"
    r"|[Пп]ерв[а-яё]+|[Кк]ажд[а-яё]+)(\s+)бит(ах|ами|ам|ов|ы|ом|е|у|а)?(?![а-яё])")


def _bit_repl(m):
    return m.group(1) + m.group(2) + "такт" + (m.group(3) or "")


# rule = (id, kind, langs, scopes, pattern, repl, path_filter)
#   kind: "re" | "exact";  scopes subset of {"beats","parts","widgets"}
#   path_filter(root, path) -> bool (None = all)
#   NB: a filter gets root+path, never a bare relpath, so it can address a unit by WHAT IT IS
#   (rulib.owns_subject) instead of where it sits. T08's filter used to test `"/l17/" not in rp`
#   and the Aug-2026 renumbering pointed it at the wrong chapter without turning anything red.
RULES = [
    ("T01", "re", ("ru",), ("beats", "parts"),
     re.compile(r"([Вв])ыбелив"),
     lambda m: ("О" if m.group(1) == "В" else "о") + "тбелив", None),

    ("T02", "exact", ("ru",), ("beats", "parts"), [
        ("Поздняя интеракция (ColBERTv2", "Позднее взаимодействие (ColBERTv2"),
        ("модель поздней интеракции вроде ColBERTv2",
         "модель позднего взаимодействия вроде ColBERTv2"),
        ("более богатая поздняя интеракция, это Лекция 8",
         "более богатое позднее взаимодействие, это Лекция 8"),
        ("Поздняя интеракция на схеме", "Позднее взаимодействие на схеме"),
        ("Вот и вся поздняя интеракция: деталь",
         "Вот и всё позднее взаимодействие: деталь"),
        ("поздняя интеракция &mdash; считайте",
         "позднее взаимодействие &mdash; считайте"),
    ], None, None),

    ("T03", "re", ("ru", "tt"), ("beats", "parts"),
     re.compile(r"Артифактор"), lambda m: "Артефактор", None),

    ("T04", "re", ("ru",), ("beats", "parts"),
     re.compile(r"([Пп])ереранкер"),
     lambda m: ("Р" if m.group(1) == "П" else "р") + "еранкер", None),

    ("T05", "re", ("ru",), ("beats", "parts"),
     re.compile(r"([ЖжСс])(ёстк|ложн)"
                r"(ими|ыми|ого|ому|ий|ие|их|им|ый|ые|ых|ым|ом)"
                r"((?:\s|&nbsp;|-)+)(негатив)"),
     _neg_repl, None),

    ("T06", "re", ("ru",), ("beats", "parts"),
     re.compile(r"([Лл])ексическ(ими|ого|ому|ий|ие|их|им|ом)"
                r"((?:\s|&nbsp;)+)разрыв"),
     _lex_repl, None),

    ("T07", "re", ("ru",), ("beats", "parts"),
     EMBED_RE, lambda m: EMBED_MAP[m.group(1)], None),

    ("T08", "re", ("ru",), ("beats",),
     BIT_RE, _bit_repl,
     lambda root, path: not rulib.owns_subject(root, path, "bit")),

    ("T09", "exact", ("ru",), ("beats",), [
        ("Перед расплатой — последнее предостережение",
         "Перед развязкой — последнее предостережение"),
        ("Следующий бит — расплата; этот бит",
         "Следующий такт — развязка; этот такт"),
        ("держит расплату честной", "держит развязку честной"),
        ("И вот изящная расплата, которая",
         "И вот изящная развязка, которая"),
    ], None, None),

    ("T10", "exact", ("ru",), ("beats",), [
        ("каждая перепись снова почти бесплатна",
         "каждое переписывание снова почти бесплатно"),
        ("каждая перепись — это ещё один вызов LLM",
         "каждое переписывание — это ещё один вызов LLM"),
        ("перепись это лучший вопрос", "переписывание — это лучший вопрос"),
        ("переписыватель, что становится", "переписчик, что становится"),
    ], None, None),

    ("T11", "re", ("ru",), ("widgets",),
     re.compile(r"([Оо])днашаг"),
     lambda m: m.group(1) + "дношаг", None),

    ("T12", "re", ("ru",), ("beats", "parts"),
     re.compile(r"\bсэр(а|у|ом|е)?(\s+|&nbsp;)Косинус"),
     lambda m: "Сэр" + (m.group(1) or "") + m.group(2) + "Косинус", None),

    ("T13", "exact", ("ru",), ("beats",), [
        ("Спасибо, что стоял со мной у станка.",
         "Спасибо за компанию у станка."),
        ("Спасибо, что прочитал всю книгу вместе со мной.",
         "Спасибо, что мы прочли всю книгу вместе."),
        ("Спасибо, что провёл эту съёмку вместе со мной.",
         "Спасибо, что эта съёмка проведена вместе."),
        ("Спасибо, что сидел со мной у ключа.",
         "Спасибо за компанию у ключа."),
    ], None, None),
]


def _regions(path, kind, text):
    if kind in ("beats", "widgets"):
        return rulib.lang_string_spans(text)
    return [("ru", s, e) for s, e in rulib.ru_text_spans_html(text)]


def process_file(path, root, kind, reporter, only):
    text = rulib.read(path)
    relpath = rulib.rel(root, path)
    regions = _regions(path, kind, text)
    file_edits = []  # (s, e, rep)

    def overlaps(s, e):
        return any(not (e <= a or s >= b) for a, b, _ in file_edits)

    for rid, rkind, langs, scopes, pattern, repl, pfilter in RULES:
        if only and rid not in only:
            continue
        if kind not in scopes:
            continue
        if pfilter and not pfilter(root, path):
            continue
        for lang, rs, re_ in regions:
            if lang not in langs:
                continue
            seg = text[rs:re_]
            if rkind == "re":
                for m in pattern.finditer(seg):
                    s, e = rs + m.start(), rs + m.end()
                    rep = repl(m)
                    if rep == m.group(0) or overlaps(s, e):
                        continue
                    file_edits.append((s, e, rep))
                    ctx = text[max(0, s - 24):s] + "‹" + m.group(0) + "›" + text[e:e + 24]
                    reporter.add(relpath, rulib.line_of(text, s),
                                 ctx.replace("\n", " "), rep, "%s/%s" % (rid, lang))
            else:  # exact needles
                for needle, rep in pattern:
                    start = 0
                    while True:
                        idx = seg.find(needle, start)
                        if idx == -1:
                            break
                        s, e = rs + idx, rs + idx + len(needle)
                        if not overlaps(s, e):
                            file_edits.append((s, e, rep))
                            reporter.add(relpath, rulib.line_of(text, s),
                                         needle, rep, "%s/%s" % (rid, lang))
                        start = idx + len(needle)
    return text, file_edits


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--only", help="comma-separated rule ids, e.g. T05,T08")
    ap.add_argument("--root", default=rulib.REPO_DEFAULT)
    args = ap.parse_args(argv)
    only = set(args.only.split(",")) if args.only else None

    reporter = rulib.Reporter("fix_terms")
    pending = []
    groups = [(rulib.beats_files(args.root), "beats"),
              (rulib.parts_files(args.root), "parts"),
              (rulib.widget_i18n_files(args.root), "widgets")]
    for files, kind in groups:
        for path in files:
            text, edits = process_file(path, args.root, kind, reporter, only)
            if edits:
                pending.append((path, text, edits))

    reporter.dump(limit=None if args.full else 80)
    # per-rule stats
    per_rule = {}
    for _, _, _, _, note in reporter.rows:
        rid = note.split("/")[0]
        per_rule[rid] = per_rule.get(rid, 0) + 1
    print("per-rule:", " ".join("%s=%d" % kv for kv in sorted(per_rule.items())))
    if args.apply:
        for path, text, edits in pending:
            rulib.write(path, rulib.apply_edits(text, edits))
        print("APPLIED to %d file(s)." % len(pending))
    else:
        print("DRY-RUN: no files modified. (%d file(s) would change)" % len(pending))
    return 0


if __name__ == "__main__":
    sys.exit(main())
