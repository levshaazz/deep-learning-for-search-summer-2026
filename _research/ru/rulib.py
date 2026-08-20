#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""rulib — shared lang-aware scanners for the ru-fix toolkit.

Two document models:
  * beats JS / i18n JSON:  string literals owned by an `en:`/`ru:`/`tt:` key
    (single string or flat array of strings). `lang_string_spans(text)` returns
    [(lang, content_start, content_end)] for every owned literal.
  * deck parts HTML:  text nodes inside <span lang="ru"> / <p lang="ru">
    subtrees, excluding <code>/<script>/<style>/svg and any nested element with
    a different lang. `ru_text_spans_html(text)` returns [(start, end)].

Both return raw offsets into the file text; editing is done by splicing
non-overlapping replacements (apply_edits).
"""
import bisect
import glob
import io
import os
import re
import sys

REPO_DEFAULT = "/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]"

LANGS = ("en", "ru", "tt")

# ---------------------------------------------------------------- JS scanning

def _scan_js(text):
    """Tokenize JS/JSON: return (literals, comments).
    literals: list of (qstart, cstart, cend, qend); comments: list of (s, e)."""
    lits, comments = [], []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if c == "/" and i + 1 < n and text[i + 1] == "/":
            j = text.find("\n", i)
            j = n if j == -1 else j
            comments.append((i, j))
            i = j + 1
            continue
        if c == "/" and i + 1 < n and text[i + 1] == "*":
            j = text.find("*/", i + 2)
            j = n - 2 if j == -1 else j
            comments.append((i, j + 2))
            i = j + 2
            continue
        if c in ("'", '"', "`"):
            q = c
            j = i + 1
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == q:
                    break
                j += 1
            lits.append((i, i + 1, min(j, n), min(j + 1, n)))
            i = j + 1
            continue
        i += 1
    return lits, comments


def lang_string_spans(text):
    """Return sorted list of (lang, cstart, cend) for literals owned by
    en:/ru:/tt: keys (JS) or "en":/"ru":/"tt": keys (JSON)."""
    lits, comments = _scan_js(text)
    lit_starts = [l[0] for l in lits]

    def enclosing_literal(pos):
        k = bisect.bisect_right(lit_starts, pos) - 1
        if k >= 0:
            q0, _, _, q1 = lits[k]
            if q0 <= pos < q1:
                return k
        return None

    def literal_starting_at(pos):
        k = bisect.bisect_left(lit_starts, pos)
        if k < len(lits) and lits[k][0] == pos:
            return k
        return None

    def in_comment(pos):
        return any(s <= pos < e for s, e in comments)

    out = []

    def collect_value(vstart, lang):
        """Value at vstart is a string literal or a flat array of literals."""
        if vstart >= len(text):
            return
        c = text[vstart]
        if c in ("'", '"', "`"):
            k = literal_starting_at(vstart)
            if k is not None:
                _, c0, c1, _ = lits[k]
                out.append((lang, c0, c1))
        elif c == "[":
            depth, j, n = 0, vstart, len(text)
            while j < n:
                k = literal_starting_at(j)
                if k is not None:
                    _, c0, c1, q1 = lits[k]
                    if depth >= 1:
                        out.append((lang, c0, c1))
                    j = q1
                    continue
                ch = text[j]
                if ch == "/" and j + 1 < n and text[j + 1] in "/*":
                    # skip comment inside array
                    for s, e in comments:
                        if s == j:
                            j = e
                            break
                    else:
                        j += 1
                    continue
                if ch == "[":
                    depth += 1
                elif ch == "]":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1

    # JS-style bare keys:  ru: <value>
    for m in re.finditer(r"\b(en|ru|tt)\s*:\s*", text):
        if enclosing_literal(m.start()) is not None or in_comment(m.start()):
            continue
        collect_value(m.end(), m.group(1))

    # JSON-style quoted keys:  "ru": <value>
    for k, (q0, c0, c1, q1) in enumerate(lits):
        if text[c0:c1] in LANGS:
            m = re.match(r"\s*:\s*", text[q1:])
            if m:
                collect_value(q1 + m.end(), text[c0:c1])

    return sorted(set(out), key=lambda t: t[1])


# -------------------------------------------------------------- HTML scanning

_VOID_TAGS = {"br", "img", "hr", "input", "meta", "wbr", "link", "source"}
_EXCL_TAGS = {"code", "script", "style", "svg", "pre", "kbd"}


def ru_text_spans_html(text):
    """Return [(start, end)] text-node ranges inside lang="ru" subtrees,
    excluding excluded tags and nested non-ru lang subtrees."""
    spans = []
    stack = []  # (name, is_ru, is_excl)
    ru_depth = 0
    excl_depth = 0
    i, n = 0, len(text)
    while i < n:
        lt = text.find("<", i)
        if lt == -1:
            lt = n
        if lt > i and ru_depth > 0 and excl_depth == 0:
            spans.append((i, lt))
        if lt >= n:
            break
        if text.startswith("<!--", lt):
            gt = text.find("-->", lt)
            i = n if gt == -1 else gt + 3
            continue
        gt = text.find(">", lt)
        if gt == -1:
            break
        tagtxt = text[lt:gt + 1]
        tm = re.match(r"<\s*(/?)([a-zA-Z][a-zA-Z0-9-]*)", tagtxt)
        if not tm:
            i = gt + 1
            continue
        closing = tm.group(1) == "/"
        name = tm.group(2).lower()
        void = name in _VOID_TAGS or tagtxt.endswith("/>")
        if closing:
            while stack:
                nm, isru, isex = stack.pop()
                if isru:
                    ru_depth -= 1
                if isex:
                    excl_depth -= 1
                if nm == name:
                    break
        elif not void:
            lm = re.search(r'\blang="([a-zA-Z-]+)"', tagtxt)
            isru = bool(lm and lm.group(1) == "ru")
            isex = name in _EXCL_TAGS or bool(lm and lm.group(1) not in ("ru",))
            # <html lang="en"> at doc root must not exclude the whole doc:
            if name == "html":
                isru = isex = False
            if isru:
                ru_depth += 1
            if isex:
                excl_depth += 1
            stack.append((name, isru, isex))
        i = gt + 1
    return spans


# ----------------------------------------------------------------- MD scanning

# A video script is RU spoken prose top-to-bottom EXCEPT structural metadata that mirrors
# deck identifiers: headings and `**Слайд …**` markers quote EN data-screen-labels
# («06 Meet Serega», "(36 Cosine ranker)") and table rows carry timings/label ranges.
# Those labels are identifiers, and the RU slide titles they sit next to are linted at
# their SOURCE (the deck parts) — scanning the copies would double-report and misfire
# E-MASCOT on legitimate EN labels. Fenced blocks and `inline code` are code (§10.2).
_MD_SKIP_LINE = re.compile(r"\s*(?:#{1,6}\s|\||\*\*Слайд)")
_MD_INLINE_CODE = re.compile(r"`[^`\n]*`")


def md_ru_spans(text):
    """Return [(start, end)] prose ranges of a RU markdown script."""
    spans = []
    pos = 0
    fenced = False
    for line in text.splitlines(keepends=True):
        start, end = pos, pos + len(line)
        pos = end
        if line.lstrip().startswith("```"):
            fenced = not fenced
            continue
        if fenced or _MD_SKIP_LINE.match(line):
            continue
        cur = start
        for m in _MD_INLINE_CODE.finditer(line):
            if start + m.start() > cur:
                spans.append((cur, start + m.start()))
            cur = start + m.end()
        if end > cur:
            spans.append((cur, end))
    return spans


# ------------------------------------------------------------------- editing

def apply_edits(text, edits):
    """edits: [(start, end, replacement)] non-overlapping. Returns new text."""
    edits = sorted(edits, key=lambda e: e[0])
    for (a, _, _), (_, b_end, _) in zip(edits[1:], edits[:-1]):
        if a < b_end:
            raise ValueError("overlapping edits")
    out, pos = [], 0
    for s, e, rep in edits:
        out.append(text[pos:s])
        out.append(rep)
        pos = e
    out.append(text[pos:])
    return "".join(out)


def line_of(text, pos, _cache={}):
    key = id(text)
    if key not in _cache or _cache[key][0] is not text:
        starts = [0]
        for m in re.finditer("\n", text):
            starts.append(m.end())
        _cache.clear()
        _cache[key] = (text, starts)
    starts = _cache[key][1]
    return bisect.bisect_right(starts, pos)


# --------------------------------------------------------------- file walking

def beats_files(root):
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "content", "book", "*", "beats", "*.js")))


def parts_files(root):
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "Lectures", "*", "parts", "*.html")))


def widget_i18n_files(root):
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "widgets", "*", "i18n.json")))


def widget_manifest_files(root):
    """widgets/*/manifest.json — the "ru" values (titles etc.) are reader-facing ru strings."""
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "widgets", "*", "manifest.json")))


def video_script_files(root):
    """release/video/*.md — RU voice-over scripts + the recording pipeline doc."""
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "release", "video", "*.md")))


def read(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()


def write(path, text):
    with io.open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text)


def rel(root, path):
    return os.path.relpath(path, root)


# ------------------------------------------------- content-addressed rule scoping
"""Some rules must be switched off for ONE unit, and the key to that unit may never be its path.

W-BIT ("бит" → "такт") is the case that taught this: the narrative word "бит" is prose debt
everywhere EXCEPT the information-theory chapter, where a bit is the SUBJECT. That exemption was
written as `"/l17/" in relpath`, because Shannon was L17 when it was written. The Aug-2026
renumbering moved Shannon to content/book/l4 and gave l17 to "The Artificer's Quill" — so the
exemption began protecting a chapter about query rewriting and left the chapter it exists for
exposed. Nothing went red: the gate stayed green while guarding the wrong unit. It was the third
such defect in one session (ADJ_DEMO_SCOPE pinned to a deck slug, stale slugs in slide-viz).

Hence the rule this implements: an exemption is addressed by what the unit IS, not by where it
sits — and the lookup FAILS LOUDLY when it resolves to zero or to more than one unit, so the next
rename cannot silently disarm it.
"""
SUBJECT_MARKERS = {
    # rule → regex identifying the one chapter whose head declares it owns this subject
    "bit": re.compile(r"Shannon\s+Entropy", re.I),
}


def _chapter_dir(path):
    """content/book/<stem>/beats/NN-x.js → content/book/<stem> (None for non-beats paths)."""
    beats = os.path.dirname(os.path.abspath(path))
    if os.path.basename(beats) != "beats":
        return None
    return os.path.dirname(beats)


def subject_chapter(root, rule, _cache={}):
    """Absolute path of the single chapter that OWNS `rule`'s subject. Raises if not exactly one."""
    # Key the cache by (root, rule), never by rule alone: both callers accept --root, and a
    # rule-only cache would answer a second tree with the first tree's chapter — the very
    # "right answer for the wrong unit" failure this helper exists to prevent.
    key = (os.path.normcase(os.path.abspath(root)), rule)
    if key in _cache:
        return _cache[key]
    marker = SUBJECT_MARKERS[rule]
    hits = []
    for head in sorted(glob.glob(os.path.join(
            glob.escape(root), "content", "book", "*", "beats", "00-head.js"))):
        if marker.search(read(head)):
            hits.append(os.path.dirname(os.path.dirname(head)))
    if len(hits) != 1:
        raise SystemExit(
            "[rulib] scoping FAILED for rule '%s': %d chapter(s) match %s, expected exactly 1.\n"
            "    An exemption that cannot name its unit must not silently apply to none or many.\n"
            "    Fix the marker in rulib.SUBJECT_MARKERS, or the chapter head it looks for."
            % (rule, len(hits), marker.pattern))
    _cache[key] = hits[0]
    return hits[0]


def owns_subject(root, path, rule):
    """True when `path` belongs to the chapter that owns `rule`'s subject."""
    ch = _chapter_dir(path)
    return ch is not None and os.path.normcase(ch) == os.path.normcase(subject_chapter(root, rule))


# ------------------------------------------------------------- math splitting

# In beats JS source, LaTeX appears with doubled backslashes: \\( ... \\)
# In HTML parts it appears raw: \( ... \).  $$...$$ appears in both.
MATH_RE = re.compile(
    r"\$\$.*?\$\$"
    r"|\\\\\(.*?\\\\\)"
    r"|\\\\\[.*?\\\\\]"
    r"|\\\(.*?\\\)"
    r"|\\\[.*?\\\]",
    re.S,
)


def split_math(segment):
    """Yield (is_math, start, end) covering segment (offsets relative to it)."""
    pos = 0
    for m in MATH_RE.finditer(segment):
        if m.start() > pos:
            yield (False, pos, m.start())
        yield (True, m.start(), m.end())
        pos = m.end()
    if pos < len(segment):
        yield (False, pos, len(segment))


# ------------------------------------------------------------------ reporting

class Reporter(object):
    def __init__(self, name):
        self.name = name
        self.rows = []  # (relpath, line, before, after, note)

    def add(self, relpath, line, before, after, note=""):
        self.rows.append((relpath, line, before, after, note))

    def dump(self, limit=None, stream=sys.stdout):
        byfile = {}
        for r in self.rows:
            byfile.setdefault(r[0], []).append(r)
        w = stream.write
        w("== %s: %d replacement(s) in %d file(s) ==\n" % (self.name, len(self.rows), len(byfile)))
        shown = 0
        for path in sorted(byfile):
            rows = byfile[path]
            w("-- %s (%d)\n" % (path, len(rows)))
            for relpath, line, before, after, note in rows:
                if limit is not None and shown >= limit:
                    w("   ... (further rows suppressed; use --full)\n")
                    return
                tag = (" [%s]" % note) if note else ""
                w("   L%-5d %r -> %r%s\n" % (line, before, after, tag))
                shown += 1

    def stats(self):
        byfile = {}
        for r in self.rows:
            byfile.setdefault(r[0], 0)
            byfile[r[0]] += 1
        return byfile


def seminar_files(root):
    """seminars/*.ipynb — тетрадки занятий; в периметре линтера с 20.08.2026."""
    import glob
    return sorted(glob.glob(os.path.join(glob.escape(root), "seminars", "*.ipynb")))


def ipynb_prose(text):
    """Проза ноутбука → (собранный текст, спаны в нём).

    Позиции в самом .ipynb ненадёжны: JSON хранит текст экранированным, а кириллицу — то
    как есть, то как \\uXXXX, в зависимости от того, чем файл записан. Первая редакция искала
    подстроку в сыром файле и молча возвращала пустой список: ноутбуки формально были в
    периметре и при этом не линтовались. Поэтому склеиваем прозу markdown-ячеек в отдельный
    текст и отдаём спаны в НЁМ — номера строк считаются по этому тексту.

    Код не включаем: он выполняется, а не читается как русский текст, и латиница в нём —
    идентификаторы (`recall-QPS`, `efSearch`), а не англицизмы.
    """
    import json as _json
    import re as _re
    try:
        cells = _json.loads(text).get("cells", [])
    except ValueError:
        return "", []
    out, spans = [], []
    pos = 0
    for c in cells:
        if c.get("cell_type") != "markdown":
            continue
        body = _re.sub(r"```.*?```|`[^`\n]*`", " ", "".join(c.get("source", [])), flags=_re.S)
        if not body.strip():
            continue
        out.append(body)
        spans.append((pos, pos + len(body)))
        pos += len(body) + 1
    return "\n".join(out), spans
