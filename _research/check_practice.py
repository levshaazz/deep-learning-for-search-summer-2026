#!/usr/bin/env python3
"""check_practice.py — G24 PRACTICE gate: the mechanical half of narrative/practice-standard.md.

The standard is the floor under every seminar notebook. Its central finding is measured, not
asserted: the exemplar notebook READS its own results after 81% of its substantive code cells,
while the five below-bar notebooks sit at 21–61%. That single ratio — not cell count, not word
count, not code volume — is what separates a live seminar from a script dump, and check #1 below
is that ratio. Run `--measure tmp/*.ipynb` to re-derive the thresholds from the reference set.

Ten HARD checks (standard §15) + four WARN checks. Everything else is review, not CI.

MARKER CONVENTIONS — the gate can only check what the notebook declares. These are the contract
(mirrored in practice-standard.md §15a); a seminar that does not use them cannot be gated:
  • task      — a markdown cell whose heading matches «Задание N»
  • trap      — a markdown line «⚠️ Ловушка X ·» where X ∈ A…F (the six types of §5)
  • no-model  — a markdown line containing «Замер без модели» (rule 7.3)
  • budget    — the header declares «Бюджет: ≈N минут»; each part plan declares «— N мин»
  • pins      — one code cell tagged «# ПИНЫ» holding the version pins / install lines
  • Ex-link   — «Ex<digits>» must resolve to an id present somewhere in data/*.json (rule 9.1)

Usage:  python3 _research/check_practice.py               (gate the seminars/ tree)
        python3 _research/check_practice.py --selftest     (Д1–Д8 must fire; a clean notebook must not)
        python3 _research/check_practice.py --measure <paths…>   (report metrics, gate nothing)
"""
import re
import sys
import os
import json
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEMINAR_GLOB = os.path.join(glob.escape(ROOT), 'seminars', '**', '*.ipynb')

# ── thresholds (standard §1, §6; every one measured on the six reference notebooks) ──────────────
MIN_ANALYSIS_RATIO = 0.80   # exemplar 0.81 · below-bar 0.21–0.61
MIN_MD_PROSE_SHARE = 0.70   # exemplar 0.74 · nlp_base1 0.30 (all didactics in comments)
MIN_MD_CODE_RATIO = 1.40    # exemplar 96/57 = 1.68
MIN_TASKS, MAX_TASKS = 3, 5
MIN_TRAPS, MIN_TRAP_TYPES = 8, 4
ANALYSIS_WORDS_LO, ANALYSIS_WORDS_HI = 100, 150
BUDGET_TOL_MIN = 10         # part budgets may miss the declared total by this many minutes

# A markdown cell counts as ANALYSIS only past this length — a bare heading reads a result no more
# than a blank cell does, and «## 4. Предобученные эмбеддинги» right after a comparison table is
# defect Д1 itself, the one the standard opens with.
ANALYSIS_MIN_WORDS = 25

# ── detectors ────────────────────────────────────────────────────────────────────────────────────
# Substantive = the cell prints a number, draws a figure, or trains. Imports, defs and plain loads
# need no analysis (standard §1.1), so they must NOT enter the denominator.
SUBSTANTIVE = re.compile(r'\bprint\s*\(|plt\.|\.plot\(|sns\.|display\(|\.fit\(|\.train\(|'
                         r'\.evaluate\(|\.score\(|px\.|go\.Figure')
TRAINING = re.compile(r'\.fit\(|\.train\(|trainer\.|\.fit_transform\(')
BASELINE = re.compile(r'\bBASE\b|\bBASELINE\b|baseline', re.I)
TASK_HEAD = re.compile(r'^\s*#{1,6}[^\n]*Задание\s*\d+', re.M | re.I)
TRAP = re.compile(r'⚠️?\s*Ловушка\s+([A-F])\b')
# The six trap types are LATIN A…F. Written with a Cyrillic homoglyph (А В Е С) the marker looks
# identical and counts as nothing — the same silent class of miss that a path-keyed gate scope has.
# So detect it and say so, instead of quietly reporting «ловушек 0».
TRAP_CYR = re.compile(r'⚠️?\s*Ловушка\s+([АВЕС])\b')
NO_MODEL = re.compile(r'Замер без модели', re.I)
PINS_CELL = re.compile(r'^\s*#\s*ПИНЫ\b', re.M)
EX_ID = re.compile(r'\bEx(\d{1,3})\b')
SEED_SET = [re.compile(r'\bSEED\s*='),
            re.compile(r'random\.seed\s*\('),
            re.compile(r'np(?:\.random)?\.random\.seed\s*\(|numpy\.random\.seed\s*\('),
            re.compile(r'torch\.manual_seed\s*\(')]
FORBIDDEN = [('#@param', re.compile(r'#@param')),
             ('files.upload', re.compile(r'files\.upload\s*\(')),
             ('google.colab.output', re.compile(r'google\.colab\.output|from\s+google\.colab\s+import\s+output')),
             ('ipywidgets', re.compile(r'\bipywidgets\b'))]
IMPORT = re.compile(r'^\s*(?:import\s+([A-Za-z_][\w.]*)|from\s+([A-Za-z_][\w.]*)\s+import)', re.M)
BUDGET_TOTAL = re.compile(r'Бюджет[^\n]*?(\d{2,3})\s*мин', re.I)
BUDGET_PART = re.compile(r'[—–-]\s*(\d{1,3})\s*мин', re.I)
WORD = re.compile(r'[А-Яа-яЁёA-Za-z]+')
# Rule 1.2 counts RUSSIAN words, and it must: a code cell is full of Latin identifiers, so counting
# both alphabets would score every notebook's didactics as «half in code» and the check would fire
# on correct work. Cyrillic-only reproduces the standard's own figures (exemplar 75 %, base1 30 %).
RU_WORD = re.compile(r'[А-Яа-яЁё]+')
HEADING_LINE = re.compile(r'^\s*#{1,6}[^\n]*\n?')

# Stdlib modules a seminar may import without pinning. sys.stdlib_module_names is 3.10+, and this
# gate must run under whatever python3 CI and the frozen repro toolchain (CPython 3.9) provide — so
# the list is explicit rather than introspected.
STDLIB = {
    'abc', 'argparse', 'ast', 'base64', 'bisect', 'collections', 'contextlib', 'copy', 'csv',
    'dataclasses', 'datetime', 'decimal', 'difflib', 'enum', 'functools', 'gc', 'glob', 'gzip',
    'hashlib', 'heapq', 'html', 'io', 'itertools', 'json', 'logging', 'math', 'os', 'pathlib',
    'pickle', 'pprint', 'random', 're', 'shutil', 'string', 'subprocess', 'sys', 'tempfile',
    'textwrap', 'time', 'timeit', 'typing', 'unicodedata', 'urllib', 'uuid', 'warnings', 'zipfile',
}


def cell_src(cell):
    s = cell.get('source', '')
    return s if isinstance(s, str) else ''.join(s)


def words(text):
    return len(WORD.findall(text))


def ru_words(text):
    return len(RU_WORD.findall(text))


def analysis_body(cell_text):
    """The prose of a markdown cell with its leading heading stripped — a heading is not analysis."""
    return HEADING_LINE.sub('', cell_text, count=1)


def measure(nb):
    """→ dict of every metric the HARD/WARN checks read. Pure; the checks below only compare."""
    cells = nb.get('cells', [])
    md = [c for c in cells if c.get('cell_type') == 'markdown']
    code = [c for c in cells if c.get('cell_type') == 'code']
    md_text = '\n'.join(cell_src(c) for c in md)
    code_text = '\n'.join(cell_src(c) for c in code)
    all_text = md_text + '\n' + code_text

    # ── #1 analysis after each substantive measurement (the discriminator) ──
    substantive = analysed = 0
    analysis_lengths = []
    mute = []                                   # substantive cells with no analysis after them (Д1)
    for i, c in enumerate(cells):
        if c.get('cell_type') != 'code':
            continue
        s = cell_src(c)
        if not SUBSTANTIVE.search(s):
            continue
        substantive += 1
        nxt = cells[i + 1] if i + 1 < len(cells) else None
        if nxt and nxt.get('cell_type') == 'markdown':
            body = analysis_body(cell_src(nxt))
            if words(body) >= ANALYSIS_MIN_WORDS:
                analysed += 1
                analysis_lengths.append(words(body))
                continue
        mute.append(i)

    # ── #4 the zero number must precede the first trained model ──
    first_train = next((i for i, c in enumerate(cells)
                        if c.get('cell_type') == 'code' and TRAINING.search(cell_src(c))), None)
    first_base = next((i for i, c in enumerate(cells) if BASELINE.search(cell_src(c))), None)

    # ── #5 every task must carry an assert ──
    task_idx = [i for i, c in enumerate(cells)
                if c.get('cell_type') == 'markdown' and TASK_HEAD.search(cell_src(c))]
    tasks = []
    for n, start in enumerate(task_idx):
        end = task_idx[n + 1] if n + 1 < len(task_idx) else len(cells)
        block = '\n'.join(cell_src(c) for c in cells[start:end] if c.get('cell_type') == 'code')
        head = TASK_HEAD.search(cell_src(cells[start])).group().strip()
        tasks.append({'head': head, 'has_assert': 'assert ' in block})

    # ── #7 every third-party import must appear in the pins cell ──
    pins = '\n'.join(cell_src(c) for c in code if PINS_CELL.search(cell_src(c)))
    imported = set()
    for m in IMPORT.finditer(code_text):
        top = (m.group(1) or m.group(2)).split('.')[0]
        if top not in STDLIB:
            imported.add(top)
    unpinned = sorted(m for m in imported if m not in pins)

    # ── #10 the declared budget must equal the sum of its parts ──
    tot = BUDGET_TOTAL.search(md_text)
    total_min = int(tot.group(1)) if tot else None
    # the total's own «120 мин» also matches BUDGET_PART when written «Бюджет: ≈120 мин» — drop one
    parts = [int(x) for x in BUDGET_PART.findall(md_text)]
    if total_min is not None and total_min in parts:
        parts.remove(total_min)

    traps = TRAP.findall(all_text)
    traps_cyr = TRAP_CYR.findall(all_text)
    return {
        'cells': len(cells), 'md': len(md), 'code': len(code),
        'substantive': substantive, 'analysed': analysed, 'mute': mute,
        'analysis_ratio': analysed / substantive if substantive else 1.0,
        'analysis_lengths': analysis_lengths,
        'md_prose_share': ru_words(md_text) / max(1, ru_words(md_text) + ru_words(code_text)),
        'md_code_ratio': len(md) / len(code) if code else 0.0,
        'first_train': first_train, 'first_base': first_base,
        'tasks': tasks,
        'forbidden': [name for name, pat in FORBIDDEN if pat.search(all_text)],
        'unpinned': unpinned, 'has_pins': bool(pins),
        'seed_ok': all(p.search(code_text) for p in SEED_SET),
        'ex_ids': sorted(set(EX_ID.findall(all_text)), key=int),
        'budget_total': total_min, 'budget_parts': parts,
        'traps': len(traps), 'trap_types': len(set(traps)), 'traps_cyr': len(traps_cyr),
        'no_model': bool(NO_MODEL.search(all_text)),
        'details': all_text.count('<details'),
    }


def data_ex_ids():
    """→ every Ex-id the lecture data actually publishes (rule 9.1: the seminar links to the deck)."""
    ids = set()
    for f in glob.glob(os.path.join(glob.escape(ROOT), 'data', '*.json')):
        try:
            ids.update(EX_ID.findall(open(f, encoding='utf-8').read()))
        except OSError:
            continue
    return ids


def check(rel, m, known_ex):
    """→ (hard, warn) message lists for one notebook. The ten HARD checks are standard §15."""
    hard, warn = [], []
    if m['analysis_ratio'] < MIN_ANALYSIS_RATIO:                                            # 1
        n = len(m['mute'])
        hard.append(f"[Д1] разбор после замера {m['analysis_ratio']:.0%} < {MIN_ANALYSIS_RATIO:.0%} "
                    f"({m['analysed']}/{m['substantive']}) — {n} немых замер(а/ов), ячейки {m['mute'][:6]}")
    if m['md_prose_share'] < MIN_MD_PROSE_SHARE:                                            # 2
        hard.append(f"[Д7] проза в markdown {m['md_prose_share']:.0%} < {MIN_MD_PROSE_SHARE:.0%} — "
                    f"дидактика живёт в комментариях, она невидима до запуска")
    if m['md_code_ratio'] < MIN_MD_CODE_RATIO:                                              # 3
        hard.append(f"[Д8] markdown/код {m['md_code_ratio']:.2f} < {MIN_MD_CODE_RATIO:.2f} "
                    f"({m['md']}/{m['code']}) — сплошной код без сцепки «формула ↔ строка ↔ число»")
    if m['first_train'] is not None and (m['first_base'] is None or m['first_base'] > m['first_train']):
        hard.append(f"[Д2] нет тривиального бэйзлайна до первого обучения "                 # 4
                    f"(обучение в ячейке {m['first_train']}, BASE "
                    f"{'отсутствует' if m['first_base'] is None else 'только в ' + str(m['first_base'])})")
    for t in m['tasks']:                                                                    # 5
        if not t['has_assert']:
            hard.append(f"[Д6] задание без assert-самопроверки: {t['head']!r}")
    for name in m['forbidden']:                                                             # 6
        hard.append(f"запрещённая колаб-UI-идиома {name!r} — интерфейс VS Code её не отрисует")
    for mod in m['unpinned']:                                                               # 7
        hard.append(f"импорт {mod!r} отсутствует в ячейке «# ПИНЫ» — версия не зафиксирована")
    if not m['seed_ok']:                                                                    # 8
        hard.append("SEED не зафиксирован для всех трёх источников (random / numpy / torch)")
    for ex in m['ex_ids']:                                                                  # 9
        if ex not in known_ex:
            hard.append(f"Ex{ex} не найден ни в одном data/*.json — сцепка с лекцией висит на прозе")
    if m['budget_total'] is None:                                                           # 10
        hard.append("поминутный бюджет не заявлен в шапке («Бюджет: ≈N минут»)")
    elif abs(sum(m['budget_parts']) - m['budget_total']) > BUDGET_TOL_MIN:
        hard.append(f"бюджет не сходится: заявлено {m['budget_total']} мин, "
                    f"сумма частей {sum(m['budget_parts'])} мин ({len(m['budget_parts'])} част.)")

    if not (MIN_TASKS <= len(m['tasks']) <= MAX_TASKS):
        hard.append(f"[Д6] заданий {len(m['tasks'])}, требуется {MIN_TASKS}–{MAX_TASKS}")

    if m['traps_cyr']:
        hard.append(f"маркер ловушки написан кириллической буквой-двойником ×{m['traps_cyr']} — "
                    f"типы ловушек это ЛАТИНСКИЕ A…F, иначе метка не засчитывается и выглядит как её отсутствие")
    if m['traps'] < MIN_TRAPS or m['trap_types'] < MIN_TRAP_TYPES:
        warn.append(f"ловушек {m['traps']} (нужно ≥{MIN_TRAPS}), типов {m['trap_types']} "
                    f"(нужно ≥{MIN_TRAP_TYPES} из шести)")
    if not m['no_model']:
        warn.append("ни одного «Замер без модели» — нет замера, не наследующего слабости модели")
    if m['analysis_lengths']:
        avg = sum(m['analysis_lengths']) / len(m['analysis_lengths'])
        if not (ANALYSIS_WORDS_LO <= avg <= ANALYSIS_WORDS_HI):
            warn.append(f"средняя длина разбора {avg:.0f} слов вне коридора "
                        f"{ANALYSIS_WORDS_LO}–{ANALYSIS_WORDS_HI}")
    if not m['details']:
        warn.append("ни одного <details> — двухслойность не реализована")
    return hard, warn


def load(path):
    return json.load(open(path, encoding='utf-8'))


def seminars():
    return sorted(f for f in glob.glob(SEMINAR_GLOB, recursive=True)
                  if '.ipynb_checkpoints' not in f)


def main():
    if '--selftest' in sys.argv:
        return selftest()
    if '--measure' in sys.argv:
        return report(sys.argv[sys.argv.index('--measure') + 1:])

    files = seminars()
    if not files:
        # Loud, not silent: an empty tree is zero coverage, and a gate that prints ✓ over nothing
        # is exactly how "green means good" becomes a lie.
        print("[check-practice] seminars/ пуст — НИ ОДИН семинар ещё не написан, гейт ничего не покрыл")
        print("[check-practice] HARD(стандарт практик)=0  ПОКРЫТИЕ=0 ноутбуков")
        return

    known_ex = data_ex_ids()
    hard = warn = 0
    for f in files:
        rel = os.path.relpath(f, ROOT)
        m = measure(load(f))
        h, w = check(rel, m, known_ex)
        for msg in h:
            hard += 1
            print(f"  ✗ [HARD] {rel}: {msg}")
        for msg in w:
            warn += 1
            print(f"  ! [WARN] {rel}: {msg}")
        if not h and not w:
            print(f"  ✓ {rel}: разбор {m['analysis_ratio']:.0%} · проза_md {m['md_prose_share']:.0%} · "
                  f"md/код {m['md_code_ratio']:.2f} · ловушек {m['traps']}/{m['trap_types']}тип · "
                  f"заданий {len(m['tasks'])}")

    print(f"\n[check-practice] проверено {len(files)} семинар(ов) против narrative/practice-standard.md")
    print(f"[check-practice] HARD(немой замер/без базы/без assert/колаб-UI/пины/SEED/Ex/бюджет)={hard}  WARN={warn}")
    if hard:
        sys.exit(1)


def report(paths):
    """--measure: the metric table, gating nothing. This is how the thresholds were derived —
    run it over tmp/*.ipynb and the exemplar separates from the five below-bar notebooks."""
    files = []
    for p in paths:
        files.extend(sorted(glob.glob(p)) if any(ch in p for ch in '*?[') else [p])
    print(f"{'ноутбук':34} {'разбор':>7} {'проза_md':>9} {'md/код':>7} {'ловушек':>8} {'заданий':>8}")
    for f in files:
        m = measure(load(f))
        print(f"{os.path.basename(f)[:34]:34} {m['analysis_ratio']:>6.0%} {m['md_prose_share']:>9.0%} "
              f"{m['md_code_ratio']:>7.2f} {m['traps']:>8} {len(m['tasks']):>8}")


# ── selftest ─────────────────────────────────────────────────────────────────────────────────────
def nb(*cells):
    return {'cells': [{'cell_type': t, 'source': s} for t, s in cells]}


def md(s):
    return ('markdown', s)


def code(s):
    return ('code', s)


ANALYSIS = ('Что видно. Сравнивать надо не модели друг с другом, а каждую с пунктиром базы: '
            'предсказатель «всегда 5» уже даёт 0,80, и всё, что ниже этой линии, — шум, а не метод. '
            'Ожидаемая картина ровно такая по механизму: класс несбалансирован, и метрика '
            'вознаграждает угадывание большинства, а не понимание текста. Чего график НЕ '
            'показывает: разброса между запусками, поэтому знак разницы здесь утверждать нельзя, '
            'даже если столбик визуально выше соседнего. Отдельно отмечу, что подвыборка смещает '
            'все числа вверх — чем меньше корпус, тем выше метрики, и сравнивать их с '
            'опубликованными по полному корпусу нельзя. Что делать: прежде чем говорить '
            '«помогло», прогнать три сида и посмотреть на разброс, а не на одно число из ячейки '
            'выше. Если знак поменяется — это и есть результат занятия.')

WHY = ('Зачем это сейчас. Следующая ячейка считает число, с которым мы будем сравнивать всё '
       'остальное; без него любая метрика ниже повиснет в вакууме.')

SUMMARY = ('Итог части. Мы получили базу, сравнили с ней обученную модель и назвали вслух, чего '
           'наш замер не показывает. Дальше — задания, где ты повторишь это сам.')

PINS = ('# ПИНЫ\n!pip install -q numpy==1.26.4 torch==2.3.0 sklearn==1.4.2\n'
        'import numpy, torch, sklearn\n')
CONFIG = 'SEED = 42\nimport random\nrandom.seed(SEED)\nnp.random.seed(SEED)\ntorch.manual_seed(SEED)\n'


def clean_nb(ntasks=3):
    """A notebook that satisfies every HARD check — the silence half of the selftest.

    It is also the shape a real seminar takes: rule 1.1 wraps every substantive code cell in TWO
    markdown cells, «зачем это сейчас» before and «что видно» after. That wrapping is what carries
    the md/code ratio past 1.4 on its own — the threshold is a consequence of the rule, not a
    separate quota to pad toward."""
    cells = [md('# Семинар\nБюджет: ≈120 минут.'),
             code(PINS), code(CONFIG),
             md('## План части — 60 мин'), md(WHY),
             code('print(BASE)'), md(ANALYSIS),
             md('## План части — 60 мин'), md(WHY),
             code('model.fit(X, y)\nprint(score)'), md(ANALYSIS)]
    for i in range(ntasks):
        cells += [md(f'### Задание {i + 1}\nПрочитай до запуска.'),
                  code('assert len(a) < len(b), "не уменьшилось"')]
    cells.append(md(SUMMARY))
    return nb(*cells)


def mutate(notebook, needle, cell_type, source):
    """Replace the FIRST cell containing `needle` — fixtures address cells by content, never by
    index. An index-addressed fixture silently edits the wrong cell the moment the skeleton grows
    a step, and then asserts on a defect it never planted."""
    for c in notebook['cells']:
        if needle in cell_src(c):
            c['cell_type'], c['source'] = cell_type, source
            return notebook
    raise AssertionError(f'фикстура не нашла ячейку с {needle!r} — скелет изменился')


def selftest():
    ok = []
    known = {'8'}

    def run(notebook, ex=known):
        return check('t.ipynb', measure(notebook), ex)

    base_h, _ = run(clean_nb())
    ok.append(('чистый ноутбук молчит по всем десяти HARD', base_h == []))

    # Д1 — немой замер: the analysis after the second measurement becomes a bare heading.
    d1 = mutate(clean_nb(), 'Что видно', 'markdown', '## 4. Предобученные эмбеддинги')
    h, _ = run(d1)
    ok.append(('Д1 немой замер (заголовок вместо разбора)', any('[Д1]' in x for x in h)))

    # Д2 — число без базы: training happens, BASE never does.
    d2 = mutate(clean_nb(), 'print(BASE)', 'code', 'print(accuracy)')
    h, _ = run(d2)
    ok.append(('Д2 число без базы (обучение раньше BASE)', any('[Д2]' in x for x in h)))

    # Д2 again — BASE exists but AFTER the first fit: order is the whole point of rule 3.1.
    d2b = nb(md('# С\nБюджет: ≈120 минут.'), code(PINS), code(CONFIG),
             code('model.fit(X, y)\nprint(s)'), md(ANALYSIS),
             md('## План — 120 мин'), code('BASE = 0.8\nprint(BASE)'), md(ANALYSIS),
             md('### Задание 1'), code('assert a < b'),
             md('### Задание 2'), code('assert a < b'),
             md('### Задание 3'), code('assert a < b'))
    h, _ = run(d2b)
    ok.append(('Д2 бэйзлайн ПОСЛЕ первого обучения тоже валит', any('[Д2]' in x for x in h)))

    # Д6 — задание без критерия: no assert in the task block.
    d6 = mutate(clean_nb(), 'assert len(a)', 'code', 'result = analyze(data)')
    h, _ = run(d6)
    ok.append(('Д6 задание без assert', any('[Д6] задание без assert' in x for x in h)))

    # Д6 — задание вне коридора 3–5.
    h, _ = run(clean_nb(ntasks=2))
    ok.append(('Д6 заданий меньше трёх', any('заданий 2' in x for x in h)))

    # Д7 — разбор в print(): the prose moves from markdown into comments.
    d7 = nb(md('# С\nБюджет: ≈120 минут.'), code(PINS), code(CONFIG),
            code('print(BASE)\n# ' + ANALYSIS * 3), md('короткий'),
            md('## План — 120 мин'),
            md('### Задание 1'), code('assert a < b'),
            md('### Задание 2'), code('assert a < b'),
            md('### Задание 3'), code('assert a < b'))
    h, _ = run(d7)
    ok.append(('Д7 дидактика в комментариях (проза_md < 70 %)', any('[Д7]' in x for x in h)))

    # Д8 — теория отдельно, практика отдельно: markdown/code ratio collapses.
    d8 = clean_nb()
    d8['cells'] += [{'cell_type': 'code', 'source': 'x = %d' % i} for i in range(30)]
    h, _ = run(d8)
    ok.append(('Д8 сплошной код (md/код < 1,4)', any('[Д8]' in x for x in h)))

    # §10.1 forbidden Colab-UI idioms, one per shape.
    for idiom, snippet in [('#@param', 'n = 5 #@param {type:"integer"}'),
                           ('files.upload', 'from google.colab import files\nfiles.upload()'),
                           ('google.colab.output', 'from google.colab import output'),
                           ('ipywidgets', 'import ipywidgets as w')]:
        bad = clean_nb()
        bad['cells'].append({'cell_type': 'code', 'source': snippet})
        h, _ = run(bad)
        ok.append((f'§10.1 запрещённая идиома {idiom}', any(idiom in x for x in h)))

    # #7 an import that never reached the pins cell.
    unp = clean_nb()
    unp['cells'].append({'cell_type': 'code', 'source': 'import faiss'})
    h, _ = run(unp)
    ok.append(('#7 незапиненный импорт', any("'faiss'" in x for x in h)))
    ok.append(('#7 стандартная библиотека пинов не требует',
               not any('json' in x for x in run(nb(*[('code', 'import json')] ))[0]
                       if 'ПИНЫ' in x or 'пин' in x)))

    # #8 SEED — all three sources, not just the constant.
    ns = mutate(clean_nb(), 'torch.manual_seed', 'code', 'SEED = 42')
    h, _ = run(ns)
    ok.append(('#8 SEED задан, но не разведён по random/numpy/torch', any('SEED' in x for x in h)))

    # #9 an Ex-id the lecture data does not publish.
    ex = clean_nb()
    ex['cells'].append({'cell_type': 'markdown', 'source': 'сверяемся с Ex99 из лекции'})
    h, _ = run(ex)
    ok.append(('#9 Ex-идентификатор без опоры в data/*.json', any('Ex99' in x for x in h)))
    ok.append(('#9 известный Ex молчит',
               not any('Ex8' in x for x in run(clean_nb(), {'8'})[0])))

    # #10 the budget must exist and must add up.
    nobud = mutate(clean_nb(), 'Бюджет', 'markdown', '# Семинар')
    h, _ = run(nobud)
    ok.append(('#10 бюджет не заявлен', any('бюджет не заявлен' in x for x in h)))
    badbud = mutate(clean_nb(), 'План части', 'markdown', '## План части — 10 мин')
    h, _ = run(badbud)
    ok.append(('#10 бюджет не сходится с суммой частей', any('не сходится' in x for x in h)))

    # WARN half: a notebook clean on HARD still reports the four advisory holes.
    _, w = run(clean_nb())
    ok.append(('WARN: ловушки, замер без модели, <details> — отчёт без падения',
               len(w) >= 3 and any('ловушек' in x for x in w)
               and any('Замер без модели' in x for x in w)
               and any('<details>' in x for x in w)))

    # The discriminator must hold on the REAL reference set, not only on fixtures. The six
    # notebooks live in gitignored tmp/ (another course's material), so CI cannot see them — the
    # measurements are frozen in _research/baselines/practice-calibration.json instead. Without
    # that file this case would SKIP in CI, and a skipped case reads exactly like a passing one.
    cal = os.path.join(ROOT, '_research', 'baselines', 'practice-calibration.json')
    frozen = json.load(open(cal, encoding='utf-8'))['notebooks']
    ok.append(('калибровочный базлайн на месте (иначе случай молча пропустится в CI)',
               len(frozen) == 6))

    ratios = {n: v['analysis_ratio'] for n, v in frozen.items()}
    top_n = max(ratios, key=ratios.get)
    rest = [r for n, r in ratios.items() if n != top_n]
    ok.append((f'калибровка: эталон {ratios[top_n]:.0%} ≥ порога, остальные пять ниже '
               f'({min(rest):.0%}–{max(rest):.0%}) — порог измерен, а не назначен',
               ratios[top_n] >= MIN_ANALYSIS_RATIO and max(rest) < MIN_ANALYSIS_RATIO))

    # Check #1 is the discriminator and the others are NOT interchangeable with it. Three of the
    # five below-bar notebooks clear the prose-share threshold outright — if a future session ever
    # "simplifies" the gate down to word counts, this case fails and says why.
    wordy = [n for n, v in frozen.items()
             if v['md_prose_share'] >= MIN_MD_PROSE_SHARE and ratios[n] < MIN_ANALYSIS_RATIO]
    ok.append((f'доля прозы НЕ разделяет: {len(wordy)} ноутбука ниже планки проходят порог №2 — '
               f'разделяет только «разбор после замера»', len(wordy) >= 2))

    # When the sources ARE present, re-measure: the frozen numbers must still fall out of the
    # detectors. This turns the calibration from a one-time observation into a regression test.
    live = sorted(glob.glob(os.path.join(glob.escape(ROOT), 'tmp', '*.ipynb')))
    if live:
        drift = []
        for f in live:
            name = os.path.basename(f)
            if name not in frozen:
                continue
            m = measure(load(f))
            for key in ('analysis_ratio', 'md_prose_share', 'md_code_ratio'):
                if abs(m[key] - frozen[name][key]) > 0.005:
                    drift.append(f'{name}:{key} {m[key]:.3f}≠{frozen[name][key]:.3f}')
        ok.append((f'детектор не поехал — пересчёт {len(live)} исходников совпал с базлайном'
                   + (f' · РАСХОЖДЕНИЯ: {drift[:3]}' if drift else ''), not drift))
    else:
        print('  · [инфо] tmp/*.ipynb недоступны (gitignore) — сверка с базлайном без пересчёта')

    for label, passed in ok:
        print(f"  {'✓' if passed else '✗'} {label}")
    if not all(p for _, p in ok):
        print('[check-practice] SELFTEST FAILED')
        sys.exit(1)
    print('[check-practice] selftest PASS — ловит Д1/Д2/Д6/Д7/Д8 + все десять HARD; '
          'молчит на корректном ноутбуке')


if __name__ == '__main__':
    main()
