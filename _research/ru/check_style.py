#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_style — linter for narrative/style-ru.md. Report-only, CI-able.

Scans ru strings in: content/book/*/beats/*.js, Lectures/*/parts/*.html,
widgets/*/i18n.json, widgets/*/manifest.json ("ru" values only),
release/video/*.md (prose lines; slide-label metadata + code excluded). Codes:

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
    W-BIT     narrative «бит» outside the chapter that owns the subject (canon: такт)

Usage: python3 check_style.py [--strict] [--full] [--codes E-DEC,W-VY] [--root PATH]
"""
import argparse
import os
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
    ("W-VY", "W", re.compile(r"\b[Вв](?:ы|ас|ам|ами)\b|\b[Вв]аш\w*\b|"
                             # …и ПОВЕЛИТЕЛЬНОЕ наклонение на «вы». Правило годами ловило одни
                             # местоимения, и «обратите внимание» проходило мимо: дефект нашёлся
                             # глазами на контакт-листе деки 13, а не гейтом. Список закрытый —
                             # это ровно те глаголы, которыми учебный текст обращается к читателю.
                             r"\b(?:[Оо]братите|[Пп]осмотрите|[Зз]аметьте|[Пп]редставьте|"
                             r"[Пп]опробуйте|[Сс]равните|[Вв]спомните|[Пп]одумайте|[Уу]чтите|"
                             r"[Вв]озьмите|[Пп]рочитайте|[Пп]роверьте|[Зз]апомните|[Нн]ачните|"
                             r"[Сс]делайте|[Нн]апишите|[Зз]апустите|[Вв]ыберите|[Нн]айдите|"
                             r"[Оо]ткройте|[Ии]спользуйте|[Дд]авайте)\b"), "обращение на «ты» (§1)"),
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
    # A relative «что» where «который» belongs. NOT fired after a substantivised adjective or a
    # quantifier — «единственное, что читает индекс», «лучшее, что может дать модель», «всё, что
    # впитала» are idiomatic Russian, and «который» there would be an ERROR. The detector used to
    # flag all seven of those in the course, which is how a linter teaches people to ignore it.
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
BIT_INFO_CTX = re.compile(
    r"байт|бит(?:ах|ами|ам|ов|ы|ом|е|у|а)?\b|знак|координат|нул(?:ь|я|ём|ем)|"
    r"единиц|код(?:а|ом|е|у)?\b|\\pm|±|\\sqrt|разряд", re.I)
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
# re.I, потому что глосса бывает и в начале предложения: «Точность (precision) и полнота
# (recall) отвечают…». Без флага правило видело там кальку и требовало переписать то, что
# уже написано по канону.
GLOSS = re.compile(r"(?:полнот\w+|точност\w+)\s*\((?:recall|precision)\)|"
                   r"\((?:precision|recall)[–—-](?:precision|recall)\)", re.I)
MATHY = re.compile(r"\\text\{[^}]*\}|\\\(|\\\)|\$\$")


# A substantivised adjective or quantifier takes «что», never «который»: «единственное, что
# читает индекс», «лучшее, что может дать модель», «всего, что впитала». The head word is the
# text BEFORE the comma, so this has to be checked on the match, not with a lookbehind.
CHTO_OK = re.compile(r"(?:единственн|лучш|худш|наименьш|наибольш|перв|последн|главн|"
                     r"вс[её]|всег|мног|мал|нов|стар|прост|сложн|важн|интересн|"
                     # …and изъяснительное «что» after a verb/participle of deciding, knowing or
                     # saying: «цепочка, решающая, что хватит» — «который» is impossible there.
                     r"решающ|решивш|знающ|понимающ|считающ|полагающ|говорящ|видящ|"
                     r"замечающ|доказывающ|показывающ|утверждающ|проверяющ|определяющ|"
                     # …и ЛИЧНЫЕ формы тех же изъяснительных глаголов: «часто оказывается, что
                     # нет», «где кажется, что хватит одной». «Который» там невозможен — это не
                     # определительное придаточное, а дополнение. Правило ловило их как ошибку.
                     r"оказыва|оказал|кажет|казал|выясн|получа|получил|выходит|значит|"
                     r"понятн|извест|видн|"
                     # …и сравнительное «то же самое, что»: «лексически трудное — не то
                     # же самое, что путает плотная модель». Это устойчивое сравнение,
                     # «который» в него не подставляется.
                     r"сам)"
                     r"[а-яё]*\s*,\s*что",
                     re.I)


def _chto_ok(m):
    return bool(CHTO_OK.match(m.group(0)))


# A CONTRASTIVE ё-pair is not a ё-less spelling, it is the lesson: «*еще* есть, *ещё* — нет»
# is L20 teaching that the ё-less form is what users actually type. Fires only when the ё-form
# of the very same word stands within a few dozen characters.
YO_PAIR = {"еще": "ещё", "объем": "объём", "трехмерн": "трёхмерн", "четк": "чётк",
           "звездн": "звёздн", "трудоемк": "трудоёмк", "переучет": "переучёт"}


def _yo_ok(seg, m):
    w = m.group(0).lower()
    for bare, yo in YO_PAIR.items():
        if w.startswith(bare):
            near = seg[max(0, m.start() - 60):m.end() + 60].lower()
            return yo in near
    return False


# §2 (десятичная запятая) регулирует ЧИСЛА-ВЕЛИЧИНЫ в русской прозе. Два соседних класса
# выглядят как десятичные, но ими не являются, и оба всплыли при заведении семинаров в счётчик
# долга: из 140 срабатываний в ноутбуках настоящими не было НИ ОДНОГО.
#   (а) СОСТАВНОЙ НОМЕР ПУНКТА — «Шаг 1.1», «Правило 10.5», «§9.3», ячейка таблицы «| 2.3 |».
#       Точка здесь — разделитель уровней, а не разряд; запятая сделала бы номер нечитаемым.
#   (б) ЧИСЛО ВНУТРИ КОДА — `avgdl = 3.0`, ```-блок, `b=0.75`. Код набирают так, как он
#       выполняется; запятая его сломает. В деках и битах код размечен тегами и до этой ветки
#       не доходит, поэтому правило и молчало, пока периметром была только вёрстка.
# Сужение узкое НАМЕРЕННО: «полнота 0.85» в прозе по-прежнему дефект.
IDENT_BEFORE = re.compile(r"(?:шаг|правил|пункт|задач|раздел|глав|верси)\w*\s*$|§\s*$", re.I)
# Склонение обязано входить в шаблон: «в шаге 3.4» — тот же номер пункта, что и «Шаг 3.4»,
# и первая редакция шаблона (без \w*) пропускала ровно косвенные падежи.
TABLE_CELL = re.compile(r"\|\s*$")


def _code_spans(seg):
    """Инлайн-код и fenced-блоки markdown — по ним §2 не ходит."""
    return [(m.start(), m.end()) for m in
            re.finditer(r"```.*?```|`[^`\n]*`", seg, re.S)]


def _dec_ok(sub, s, e):
    left = sub[max(0, s - 24):s]
    if IDENT_BEFORE.search(left) or TABLE_CELL.search(left):
        return True
    return any(cs <= s < ce for cs, ce in _code_spans(sub))


# Латиница внутри ИНЛАЙН-КОДА — это идентификатор, а не англицизм в прозе: `recall-QPS` —
# имя кривой из литературы по ANN, `efSearch` — параметр библиотеки. Их нельзя переводить,
# и §9.3 на них не распространяется. Правило этого не знало и держало их в долге семинаров.
INLINE_CODE = re.compile(r"`[^`\n]*`|```.*?```", re.S)


def _lat_ok(seg, m):
    if any(c.start() <= m.start() < c.end() for c in INLINE_CODE.finditer(seg)):
        return True
    if any(g.start() <= m.start() < g.end() for g in GLOSS.finditer(seg)):
        return True
    left = seg[max(0, m.start() - 12):m.start()]
    right = seg[m.end():m.end() + 12]
    if "\\text{" in left or MATHY.search(left) or MATHY.search(right):
        return True
    # enumeration of metric names: "precision, recall, MAP, nDCG"
    if re.search(r"(?:MAP|nDCG|MRR|precision|recall)\s*[,–—]\s*$", left) or \
       re.match(r"\s*[,–—]\s*(?:MAP|nDCG|MRR|precision|recall)", right):
        return True
    # A metric IDENTIFIER, which §7-тер of the style guide keeps in Latin on purpose:
    #   recall@1 · precision@10        — the @k form
    #   R-precision · MAP-precision    — hyphenated proper names
    #   context precision · average precision · context recall — multi-word metric names
    # These were being reported as calques, which is backwards: the guide REQUIRES the Latin
    # here, so the warning trained the eye to ignore the linter instead of to fix the prose.
    if re.match(r"\s*@\s*\d", right) or re.match(r"\s*\d", right):
        return True
    # Sitting INSIDE a Latin phrase — "rank-biased precision", "16-bit precision", "context
    # recall", or an English quotation embedded in RU prose. The word is then part of a term,
    # not a Russian sentence choosing a calque over «полнота». A genuine calque reads
    # «при precision и recall», where the left context is Cyrillic — still caught.
    # (`R-` is one letter, hence the separate hyphen branch: "R-precision" is a metric name.)
    if re.search(r"[A-Za-z]{2,}[\s-]$", left) or re.search(r"[A-Za-z]-$", left):
        return True
    # ПРОИЗНЕСЁННАЯ форма отсечки. Сценарий озвучки пишет то, что диктор говорит вслух:
    # «recall at k» — это ровно recall@k из ветки выше, только словом. Правило ловило её
    # как кальку и держало сценарии в долге из 18 предупреждений, где ни одно не было
    # калькой. Форма узкая: сразу справа «at» + отсечка (число, k или её кириллическая «к»).
    if re.match(r"\s+at\s+(?:\d+|[kKкК])\b", right):
        return True
    # Перечисление метрик через союз — та же конструкция, что через запятую веткой выше:
    # «nDCG, MAP, MRR, precision и recall на топ-k». Соседний член перечисления опознаётся
    # по имени метрики; «при precision и косинусе» калькой остаётся.
    if re.search(r"(?:MAP|nDCG|MRR|precision|recall|полнота|точность)\s*(?:и|или|против|vs\.?)\s+$", left) or \
       re.match(r"\s+(?:и|или|против|vs\.?)\s+(?:MAP|nDCG|MRR|precision|recall)\b", right):
        return True
    # Глосса через запятую: «там правит полнота, recall, и это переворачивает» — русский
    # термин уже назван, латиница идёт пояснением. GLOSS ловит только скобочную форму.
    if re.search(r"(?:полнота|полноты|полноте|точность|точности)\s*,\s*$", left):
        return True
    # kebab-идентификатор с латиницей по обе стороны дефиса — имя виджета или кривой,
    # а не слово русской фразы: «[ВИДЖЕТ: recall-curve — кривая полноты против ef]».
    if re.match(r"-[A-Za-z]", right) or re.search(r"[A-Za-z]-$", left):
        return True
    return False


# §1 (обращение «ты») регулирует, как автор говорит С ЧИТАТЕЛЕМ. Внутри кавычек «…» стоит не
# обращение, а ЦИТАТА: строка интерфейса («возможно, вы искали»), чужая речь или перевод чужого
# слова («из ваших домов» как разбор турецкого evlerinizden). Переписать их на «ты» нельзя —
# это исказило бы цитируемое. Ограничение по длине держит сужение узким: длинный абзац в
# кавычках — это уже авторский текст, а не короткая цитата.
# Предел длины замерен, а не угадан: по 4007 кавычкам корпуса 99-й перцентиль — 98
# символов, максимум 178. Порог 80 резал ровно жанр слайда-заблуждения, который
# цитирует чужое рассуждение целиком («…значит он самый релевантный — давайте обучим
# ранкер на кликах»). 130 накрывает его и всё ещё далеко от «абзаца в кавычках».
QUOTED = re.compile(r"«[^«»]{0,130}»")
# Чужая речь бывает размечена не только «ёлочками». Три ложных срабатывания, найденных
# аудитом 06.09.2026, все одного класса: реплика внутри метафоры (*насколько мне учесть
# то, что говорит каждый из вас?*), строка интерфейса (*возможно, вы искали*) и цитата
# профессора в <blockquote>. Ни одно не является обращением автора к студенту, а §1
# правит именно обращение. Та же граница по длине: длинный абзац курсивом — снова автор.
EMPHASIZED = re.compile(r"(?<![*\w])\*(?!\*)[^*\n]{0,80}\*(?!\*)|(?<![_\w])_(?!_)[^_\n]{0,80}_(?!_)")
BLOCKQUOTED = re.compile(r"<blockquote\b.*?</blockquote>", re.S | re.I)


def _vy_ok(seg, m):
    return any(q.start() < m.start() < q.end()
               for rx in (QUOTED, EMPHASIZED, BLOCKQUOTED)
               for q in rx.finditer(seg))


def lint_segment(seg, relpath, base_line, findings, owns_bit, is_beats):
    for code, sev, rx, note in CHECKS:
        for m in rx.finditer(seg):
            if code in ("E-MASCOT", "W-LAT") and _in_link(seg, m.start()):
                continue
            if code == "W-LAT" and _lat_ok(seg, m):
                continue
            if code == "W-CHTO" and _chto_ok(m):
                continue
            if code == "W-YO" and _yo_ok(seg, m):
                continue
            if code == "W-VY" and _vy_ok(seg, m):
                continue
            findings.append((sev, code, relpath, base_line(m.start()),
                             m.group(0)[:60], note))
    for m in GENDER_RE.finditer(seg):
        findings.append(("W", "W-GENDER", relpath, base_line(m.start()),
                         m.group(0)[:80], "финал без гендер-маркировки (§1)"))
    if is_beats and not owns_bit:
        for m in BIT_RE.finditer(seg):
            # «бит» бывает и настоящей ЕДИНИЦЕЙ ИНФОРМАЦИИ вне главы про энтропию —
            # напр. в квантовании (RaBitQ): «Каждый бит становится координатой ±1/√8».
            # Такт нарратива не соседствует с байтом, знаком и координатой, поэтому
            # маркер в окне справа снимает подозрение (фикстуры в selftest).
            if BIT_INFO_CTX.search(seg[m.end():m.end() + 90]):
                continue
            findings.append(("W", "W-BIT", relpath, base_line(m.start()),
                             m.group(0)[:60], "→ такт (§7)"))
    # decimals via fix_decimals machinery (math-aware)
    for is_math, ms, me in rulib.split_math(seg):
        for s, e, rep, note in fix_decimals.convert_segment(
                seg[ms:me], is_math, " "):
            if note in ("plain", "math"):
                # A decimal POINT inside a verbatim English quotation embedded in RU prose
                # (e.g. the literal source quote "Its more than 3.85 million inhabitants" in
                # 18-late-chunking) is CORRECT — §2 governs Russian text, not quoted English.
                # Same philosophy as _lat_ok's English-quotation branch: skip only when the
                # number is flanked by Latin words on BOTH sides with no Cyrillic nearby;
                # any Cyrillic context still flags.
                sub = seg[ms:me]
                _l, _r = sub[max(0, s - 25):s], sub[e:e + 25]
                if (re.search(r"[A-Za-z]{2,}\s*$", _l)
                        and re.match(r"\s*[A-Za-z]{2,}", _r)
                        and not re.search(r"[а-яёА-ЯЁ]", _l + _r)):
                    continue
                if _dec_ok(sub, s, e):
                    continue
                findings.append(("E", "E-DEC", relpath, base_line(ms + s),
                                 seg[ms:me][max(0, s - 15):e + 10].replace("\n", " "),
                                 "десятичная запятая (§2), напр. " + rep))


def process(path, root, kind, findings):
    text = rulib.read(path)
    relpath = rulib.rel(root, path)
    if kind == "ipynb":
        # проза ноутбука собирается в отдельный текст: позиции в самом JSON ненадёжны
        text, regions = rulib.ipynb_prose(text)
        for rs, re_ in regions:
            lint_segment(text[rs:re_], relpath,
                         lambda off, rs=rs: rulib.line_of(text, rs + off),
                         findings, False, False)
        return
    # W-BIT is off in the chapter that OWNS the subject "bit" — resolved by content, never by path.
    # This used to read `"/l17/" in relpath`, which the Aug-2026 renumbering turned into a guard
    # over the wrong chapter (see rulib.subject_chapter for the full account).
    owns_bit = rulib.owns_subject(root, path, "bit")
    if kind in ("beats", "widgets"):
        regions = [(s, e) for lang, s, e in rulib.lang_string_spans(text) if lang == "ru"]
    elif kind == "md":
        regions = rulib.md_ru_spans(text)
    else:
        regions = rulib.ru_text_spans_html(text)
        # Слайд-цитата: <blockquote> — чужая речь, а §1 правит обращение АВТОРА к студенту.
        # Регионы режутся по lang-спанам, поэтому сам тег в сегмент не попадает и
        # _vy_ok его не видит — отсекаем на уровне регионов.
        bq = [(m.start(), m.end()) for m in BLOCKQUOTED.finditer(text)]
        if bq:
            regions = [(rs, re_) for rs, re_ in regions
                       if not any(bs <= rs and re_ <= be for bs, be in bq)]
    for rs, re_ in regions:
        seg = text[rs:re_]
        lint_segment(seg, relpath,
                     lambda off, rs=rs: rulib.line_of(text, rs + off),
                     findings, owns_bit, kind == "beats")



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
    for path in rulib.widget_manifest_files(args.root):
        process(path, args.root, "widgets", findings)
    for path in rulib.video_script_files(args.root):
        process(path, args.root, "md", findings)
    # Семинары вошли в периметр 20.08.2026, когда счётчик долга дошёл до нуля: 49 находок
    # вычищены. Берётся ПРОЗА (markdown-ячейки), код ноутбука не линтуется — он выполняется,
    # а не читается как русский текст.
    for path in rulib.seminar_files(args.root):
        process(path, args.root, "ipynb", findings)

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


def selftest():
    """Известно-плохое обязано падать, известно-хорошее — молчать.

    До 19.08.2026 у линтера не было селфтеста вообще: сужения правил держались на честном
    слове, и обратное расширение никто бы не заметил. Первым же поводом стало сужение E-DEC —
    поэтому фикстуры здесь ровно про ту границу, которую сужение провело.
    """
    import json as _json
    import os as _os
    import shutil as _shutil
    import tempfile as _tempfile

    def dec(seg):
        found = []
        lint_segment(seg, "x", lambda off: 1, found, False, False)
        return [f for f in found if f[1] == "E-DEC"]

    fails = []
    if not dec("полнота выросла до 0.85 на этом наборе"):
        fails.append("dec-fires-in-prose")          # настоящий десятичный — дефект
    if dec("### Шаг 1.2 · Замер базовой линии"):
        fails.append("dec-skips-step-number")       # номер пункта — не число
    if dec("вернись в шаге 3.4 к формуле"):
        fails.append("dec-skips-inflected-step")    # тот же номер в косвенном падеже
    if dec("| 2.3 | RRF: как складывать ранги |"):
        fails.append("dec-skips-table-cell")
    if dec("запомни `avgdl = 3.0` — это число из корпуса"):
        fails.append("dec-skips-inline-code")
    if not dec("средняя длина документа равна 3.0 слова"):
        fails.append("dec-fires-outside-code")      # то же число вне кода — снова дефект

    def vy(seg):
        found = []
        lint_segment(seg, "x", lambda off: 1, found, False, False)
        return [f for f in found if f[1] == "W-VY"]

    if not vy("и обратите внимание, чего в процедуре нет"):
        fails.append("vy-fires-on-imperative")         # повелительное на «вы» — тоже §1
    if vy("«давайте обучим ранкер на кликах» — вот ловушка"):
        fails.append("vy-imperative-inside-a-quote")   # чужое заблуждение цитируется дословно
    if vy("обрати внимание, чего в процедуре нет"):
        fails.append("vy-quiet-on-ty-imperative")      # правильная форма молчит
    if vy("«Результат №1 собирает больше всего кликов, значит он самый релевантный — давайте обучим ранкер на кликах»"):
        fails.append("vy-quote-length-130")           # цитата-заблуждение целиком
    if not vy("«" + "и" * 140 + " вы обязаны сделать именно так»"):
        fails.append("vy-quote-length-bound")         # длиннее предела — снова автор
    if not vy("здесь вы увидите, как растёт индекс"):
        fails.append("vy-fires-on-address")            # обращение к читателю — дефект
    if vy("подсказка «возможно, вы искали» чинит опечатку"):
        fails.append("vy-skips-a-quote")               # строка интерфейса — цитата
    if vy("подсказка *возможно, вы искали* чинит опечатку"):
        fails.append("vy-skips-emphasis")              # та же строка курсивом
    if vy("<blockquote>Я сделаю вашу жизнь невыносимой.</blockquote>"):
        fails.append("vy-skips-blockquote")            # цитата третьего лица
    if not vy("*здесь* вы увидите, как растёт индекс"):
        fails.append("vy-fires-outside-emphasis")      # курсив рядом — не индульгенция
    if not vy("а вот целый абзац курсивом, где автор долго и обстоятельно объясняет, "
              "почему вы обязаны сделать именно так, а не иначе, и это уже не цитата"):
        fails.append("vy-emphasis-length-bound")       # длинный кусок — снова автор
    if vy("`evlerinizden` — одно слово, «из ваших домов»"):
        fails.append("vy-skips-a-translation")
    if not vy("«тут» вы найдёте ответ"):
        fails.append("vy-fires-outside-the-quote")

    def chto(seg):
        found = []
        lint_segment(seg, "x", lambda off: 1, found, False, False)
        return [f for f in found if f[1] == "W-CHTO"]

    if chto("часто оказывается, что нет"):
        fails.append("chto-skips-explanatory")        # дополнение, «который» невозможен
    if chto("там, где кажется, что хватит одной"):
        fails.append("chto-skips-seems")
    if not chto("тем же источником, что питает слайды"):
        fails.append("chto-fires-on-attributive")     # здесь «что» = «который»
    if chto("трудное — не то же самое, что путает плотная модель"):
        fails.append("chto-skips-comparison")         # сравнение, «который» невозможен

    def lat(seg):
        found = []
        lint_segment(seg, "x", lambda off: 1, found, False, False)
        return [f for f in found if f[1] == "W-LAT"]

    if lat("лучшая кривая `recall-QPS`, один параметр"):
        fails.append("lat-skips-inline-code")         # идентификатор, не англицизм
    if lat("Точность (precision) и полнота (recall) отвечают по-разному"):
        fails.append("lat-skips-gloss-at-sentence-start")   # глосса с заглавной — тот же канон
    if not lat("здесь recall падает вдвое"):
        fails.append("lat-fires-in-prose")            # тот же термин в прозе — долг     # кавычки рядом ≠ внутри
    if lat("вычислить recall at k и precision at 10 руками"):
        fails.append("lat-skips-spoken-cutoff")       # произнесённая форма recall@k
    if lat("метриками: nDCG, MAP, MRR, precision и recall на топ-k"):
        fails.append("lat-skips-conjunction-list")    # перечисление метрик через союз
    if lat("там правит полнота, recall, и это переворачивает уклон"):
        fails.append("lat-skips-comma-gloss")         # русский термин уже назван
    if lat("[ВИДЖЕТ: recall-curve — кривая полноты против ef]"):
        fails.append("lat-skips-widget-id")           # идентификатор, не англицизм
    if not lat("вспомни recall по шагам"):
        fails.append("lat-still-fires-bare")          # голый термин в реплике — долг
    if not lat("при recall и косинусной близости"):
        fails.append("lat-conjunction-needs-a-metric")  # союз без второй метрики не спасает

    # слайд-цитата <blockquote>: чужая речь молчит, та же фраза вне цитаты — падает
    tmp0 = _tempfile.mkdtemp(prefix="style_selftest_bq_")
    _os.makedirs(_os.path.join(tmp0, "Lectures", "00-x", "parts"))
    bqp = _os.path.join(tmp0, "Lectures", "00-x", "parts", "24-quote.html")
    with open(bqp, "w", encoding="utf-8") as fh:
        fh.write('<section class="slide"><blockquote><span lang="ru">'
                 'Я сделаю вашу жизнь невыносимой.</span></blockquote>'
                 '<p><span lang="ru">И вашу тоже.</span></p></section>')
    got = []
    process(bqp, tmp0, "html", got)
    vy_hits = [f for f in got if f[1] == "W-VY"]
    if len(vy_hits) != 1:
        fails.append("vy-blockquote-region-filter")
    _shutil.rmtree(tmp0)

    # ноутбук В ПЕРИМЕТРЕ: проза линтуется, код — нет
    tmp = _tempfile.mkdtemp(prefix="style_selftest_")
    _os.makedirs(_os.path.join(tmp, "seminars"))
    nbp = _os.path.join(tmp, "seminars", "lab-x.ipynb")
    _json.dump({"cells": [{"cell_type": "markdown",
                           "source": ["полнота выросла до 0.85\n"]}]},
               open(nbp, "w", encoding="utf-8"))
    found = []
    for path in rulib.seminar_files(tmp):
        process(path, tmp, "ipynb", found)
    if not [f for f in found if f[1] == "E-DEC"]:
        fails.append("nb-prose-linted")
    _json.dump({"cells": [{"cell_type": "code", "source": ["x = 0.85  # recall-QPS\n"]}]},
               open(nbp, "w", encoding="utf-8"))
    found = []
    for path in rulib.seminar_files(tmp):
        process(path, tmp, "ipynb", found)
    if found:
        fails.append("nb-code-not-linted")
    _shutil.rmtree(tmp, ignore_errors=True)

    for t in ("dec-fires-in-prose", "dec-skips-step-number", "dec-skips-inflected-step",
              "dec-skips-table-cell", "dec-skips-inline-code", "dec-fires-outside-code",
              "vy-fires-on-address", "vy-skips-a-quote", "vy-skips-a-translation",
              "vy-fires-outside-the-quote", "chto-skips-explanatory", "chto-skips-seems",
              "chto-fires-on-attributive", "lat-skips-inline-code", "lat-fires-in-prose",
              "nb-prose-linted", "nb-code-not-linted"):
        print("  [%s] %s" % ("FAIL" if t in fails else "OK", t))
    print("[selftest] FAIL: " + ", ".join(fails) if fails else "[selftest] PASS")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
