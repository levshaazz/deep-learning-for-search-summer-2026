#!/usr/bin/env python3
"""check_notebooks.py — NOTEBOOK-GROUNDING gate (G29): проза семинара не выдумывает числа.

Класс дефекта (ФАЗА 4.4 плана; §15a практ-стандарта): разбор в markdown-ячейке называет число,
которого прогон не давал. Так родился Д4 «наблюдение авансом» — «сырой счёт даёт D2, D1, D3»
при фактической ничьей 3:3; так же дважды в hw-ranking-metrics («сидит посередине» — а он хуже
среднего). Все три случая прошли зелёный G24: механическая половина стандарта числа не сверяет.
Опора гейта — дампы прогонов seminars/runs/<имя>.json (авторазбор числовых глобалов, правило
10.5), которые пишет ПОСЛЕДНЯЯ кодовая ячейка каждого ноутбука.

Проверки (HARD, если не сказано иное):
  [D] ДАМП — для каждого seminars/<имя>.ipynb существует runs/<имя>.json, он читается,
      notebook == имя, metrics непуст.
  [A] АССЕРТЫ ИСПОЛНЯЮТСЯ — дамп-ячейка обязана быть ПОСЛЕДНЕЙ кодовой ячейкой ноутбука.
      nbclient исполняет ячейки подряд, поэтому «дамп записан» ⇒ «все assert выше отработали».
      Ячейка дампа не в конце — суррогат ломается, и гейт говорит об этом вслух.
  [S] SEED — SEED в дампе равен литералу `SEED = N` в ноутбуке: разъехались — дамп протух
      (ноутбук правили после прогона) и все сверки чисел ниже бессмысленны.
  [N] ЧИСЛА ПРОЗЫ — каждое число в markdown-прозе (вне ```кода```, `инлайна`, $формул$,
      «Задание N» / «Часть N» / бюджетных «N мин» / номеров правил §N.M) обязано выводиться
      из дампа этого ноутбука или из data/*.json — в ПОКАЗАННОЙ точности (0,63 обосновано
      метрикой 0.6309; 0,64 — нет). «≈»/«~»/«около» дают относительный допуск APPROX_TOL.
      Сужения по адверсарному ревью: ×÷100 — только при знаке « %» рядом; допуск «≈» — только
      против собственного дампа; data-пул — только для чисел с ≥3 значащими цифрами (ниже пул
      из ~17 тыс. чисел совпадает почти с чем угодно — проверка была бы театром); обосновать
      число может любой настоящий прогон тетрадки — базовый ИЛИ T4; голые годы
      маскируются ТОЛЬКО в контексте цитаты/«года»; `ИМЯ = число` в инлайн-коде сверяется с
      одноимённой метрикой дампа. Остаток — храповик ПО СТРОКАМ в разрезе файла
      (_research/baselines/notebook-numbers.json): НОВАЯ строка — HARD (счётчик не годится:
      swap выдумок при том же счётчике проходил); --update-baseline отказывает росту (как G13/G22).
  [K] ЧУЖИЕ ВЕЛИЧИНЫ — имя каждой метрики дампа обязано встречаться в тексте самой
      тетрадки (код + markdown, где живут решения). Ядро Colab переживает смену тетрадки,
      и скребок по globals() утаскивает переменные предыдущего семинара: так числа прозы
      начинают «обосновываться» чужим прогоном.
  [T4] КРОСС-РАНТАЙМ — если есть seminars/runs-t4/<имя>.json (T4-прогон владельца): метрики
      качества сверяются СТРОГО (то самое решение: «качество строго, тайминги с допуском»);
      строгость распространяется на ЗАЯВЛЕННЫЕ метрики — ключи внутри RUN, куда ноутбук
      кладёт результат задания. Дамп без RUN — HARD: сверять качество не с чем. Рабочие
      переменные, попавшие в дамп скребком globals(), — WARN;
      тайминговые (по имени: MS/TIME/SEC/DT, а также t0/t_* и overpay — см. комментарий
      у регекспа) — WARN при расхождении больше TIMING_RATIO раз.
      Каталога нет — шаг молча пропускается (T4-прогон ещё не сделан).
  [T4\u2261] ОДИН РАНТАЙМ — запасной путь для lab-ann, hw-rag и project-search: CPU-базы у них
      нет и не будет (полный набор стоит до суток счёта, четыре захода умерли обрывом
      сессии — решение владельца от 2026-09-04), поэтому [T4] раньше молча выходил с
      предупреждением и не проверял НИЧЕГО. Теперь T4-дамп сверяется с ЗАМОРОЖЕННЫМ
      T4-эталоном (seminars/runs-t4-baseline/): железозависимые расхождения так не
      поймать — и это честно печатается, — зато регрессия кода и данных между двумя
      прогонами на одном и том же T4 ловится строго, ровно как в [T4].
      Заморозка ЯВНАЯ: --freeze-t4 (перезапись существующего эталона — только --force),
      иначе очередной прогон бесшумно объявил бы эталоном сам себя.

Usage:  python3 _research/check_notebooks.py                    (гейт)
        python3 _research/check_notebooks.py --selftest         (каждый класс дефекта горит,
                                                                 чистая фикстура молчит)
        python3 _research/check_notebooks.py --update-baseline  (перезапись храповика; рост — отказ)
        python3 _research/check_notebooks.py --list             (остаток чисел без обоснования)
CI-регистрация — отдельным шагом, не здесь.
"""
import glob
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEM_DIR = os.path.join(ROOT, "seminars")
RUNS_DIR = os.path.join(SEM_DIR, "runs")
RUNS_T4_DIR = os.path.join(SEM_DIR, "runs-t4")
# Эталон ОДНОГО рантайма. Для lab-ann, hw-rag и project-search базы на CPU нет и не будет:
# четыре захода умерли обрывом сессии, а hw-rag считал одну ячейку 3,5 часа — полный набор
# стоит до суток счёта, и владелец прервал (решение от 2026-09-04). Без базы шаг [T4]
# ничего не сверял и молчал с предупреждением. Замороженный T4-дамп возвращает ему зрение:
# железозависимые расхождения он поймать не может — это честно помечено, — но регрессию
# КОДА и ДАННЫХ между двумя прогонами на одном и том же T4 ловит строго.
RUNS_T4_BASE_DIR = os.path.join(SEM_DIR, "runs-t4-baseline")
DATA_GLOB = os.path.join(glob.escape(ROOT), "data", "*.json")
BASELINE_PATH = os.path.join(ROOT, "_research", "baselines", "notebook-numbers.json")

APPROX_TOL = 0.15      # «≈ 90 мс» обосновано измерением в пределах ±15 %
TIMING_RATIO = 20.0    # T4-тайминг, разъехавшийся больше чем в 20 раз, — уже не «другое железо»

# ── извлечение чисел из markdown-прозы ──────────────────────────────────────────────────────────

_FENCE = re.compile(r"```.*?```", re.S)
_INLINE = re.compile(r"`[^`\n]*`")
_MATH = re.compile(r"\$\$.*?\$\$|\$[^$\n]*\$", re.S)
_HTMLTAG = re.compile(r"<[^>]+>")
# структурные числа, которые не являются результатами прогона:
_STRUCTURAL = [
    re.compile(r"задани[а-яё]*\s+\d+(?:\.\d+)?", re.I),   # «Задание 3», «Задание 3.2»
    re.compile(r"част[а-яё]*\s+\d+(?:\.\d+)?", re.I),     # «Часть 2», «части 1.1–1.3»
    re.compile(r"шаг[а-яё]*\s+\d+(?:\.\d+)?", re.I),      # «шаг 3»
    re.compile(r"раздел[а-яё]*\s+\d+(?:\.\d+)?", re.I),   # «раздел 4.1»
    re.compile(r"^\s*\|\s*\d+\.\d+\s*\|", re.M),        # план-таблица: «| 1.1 | вопрос | …» —
                                                       # идентификатор шага, не число
    re.compile(r"(?:≈\s*)?\d+\s*мин(?:ут)?\b"),    # бюджет: «Бюджет: ≈45 минут», «— 10 мин»
    re.compile(r"§\s*\d+(?:[.,]\d+)?"),            # номера правил стандарта «§7.3»
    re.compile(r"\bEx\d+\b"),                      # id сцепки Ex12 — проверяет G24/9.1, не мы
    re.compile(r"\b20NG\b"),                       # имя корпуса
    re.compile(r"\((?:19|20)\d\d[a-zа-я]?\)"),      # год в скобках — цитата «(Robertson, 1994)»
    re.compile(r",\s*(?:19|20)\d\d\b"),            # «Devlin et al., 2019»
    re.compile(r"\b(?:19|20)\d\d\s*(?:год|г\.)"),  # «в 2009 году»; ГОЛЫЙ 4-значный год без
    re.compile(r"\b(?:19|20)\d\d[-–—]е\b"),        # контекста («плейофф 1993») уходит в храповик —
                                                   # слепая полоса прятала «2000 документах» (ревью §4)
    re.compile(r"^\s{0,3}\d+\.\s", re.M),          # маркер нумерованного списка markdown
    re.compile(r"#+\s*\d+(?:\.\d+)*[.)]?"),         # нумерация заголовков, вкл. «### 3.2»
]
# число: не приклеено к букве/цифре (D1, BM25, L3, p95 — идентификаторы, не результаты);
# десятичная запятая RU и точка EN равноправны
_NUM = re.compile(
    r"(?<![\w.,])[-−]?\d+(?:\s\d{3})*(?:[.,]\d+)?(?![\w])"
)
_INLINE_ASSIGN = re.compile(r"`\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-−]?\d+(?:[.,]\d+)?)\s*`")
_APPROX_BEFORE = re.compile(r"[≈~]\s*$|около\s+$|примерно\s+$|порядка\s+$", re.I)
# Слово-маркер ПОТЕРИ: проза пишет величину без знака, а знак несёт глагол — «теряем 0,032»,
# «падение 0,04», «минус 0,01». Только в этом окне число сверяется с дампом по модулю.
_LOSS_BEFORE = re.compile(r"(?:теря|потер|паде|упал|снизи|минус|хуже|ниже на)\w*\s+"
                          r"(?:[^.]{0,120}?)$", re.I)


def prose_of(md_source):
    """markdown-ячейка → проза без кода/формул/тегов; структурные числа замазаны."""
    t = _FENCE.sub(" ", md_source)
    t = _INLINE.sub(" ", t)
    t = _MATH.sub(" ", t)
    t = _HTMLTAG.sub(" ", t)
    for rx in _STRUCTURAL:
        t = rx.sub(lambda m: " " * len(m.group(0)), t)
    return t


def numbers_in(prose):
    """[(значение float, знаков после запятой, приблизительное?, сырой текст)]"""
    out = []
    for m in _NUM.finditer(prose):
        raw = m.group(0)
        norm = raw.replace("−", "-").replace(" ", "").replace(",", ".")
        # «1.000» с тремя нулями — это точность, а не тысячи: тысячных разделителей
        # в прозе курса нет (стандарт: неразрывный пробел), точка = десятичная.
        try:
            val = float(norm)
        except ValueError:
            continue
        digits = len(norm.split(".")[1]) if "." in norm else 0
        # Целые 0–20 не проверяем вовсе: это счётные слова прозы («7 недель», «топ-10», «3 задачи»),
        # а не результаты; против любого пула они совпадают почти всегда (ревью §1: 100% на 1–2
        # цифрах), т.е. ни «обосновать», ни «уличить» их проверка не способна — только шум храповика.
        if digits == 0 and abs(val) <= 20:
            continue
        # «≈ **0,66**» — болд между знаком и числом не отменяет приблизительности
        # Пробел возвращаем ВСЕГДА, а не только после «≈». rstrip срезал его вместе с болдом,
        # и словесные маркеры («около 270», «примерно 190», «порядка 0,05») не срабатывали
        # никогда: их шаблоны требуют «\s+$». Документация допуск обещала, гейт его не давал —
        # честные приблизительные формулировки годами копились в остатке [N] как выдумки.
        before = prose[: m.start()].rstrip("*_ ") + " "
        approx = bool(_APPROX_BEFORE.search(before))
        loss = bool(_LOSS_BEFORE.search(before))
        after = prose[m.end(): m.end() + 12]
        pct = bool(re.match(r"\s*(?:%|процент)", after))
        out.append((val, digits, approx, pct, raw, loss))
    return out


# ── пул обоснований: числа дампа + числа data/*.json ────────────────────────────────────────────

def _flatten_nums(obj, acc):
    if isinstance(obj, bool):
        return
    if isinstance(obj, (int, float)):
        acc.append(float(obj))
    elif isinstance(obj, dict):
        for v in obj.values():
            _flatten_nums(v, acc)
    elif isinstance(obj, (list, tuple)):
        for v in obj:
            _flatten_nums(v, acc)


def data_pool(data_glob=DATA_GLOB):
    acc = []
    for p in sorted(glob.glob(data_glob)):
        try:
            _flatten_nums(json.load(open(p, encoding="utf-8")), acc)
        except Exception:
            continue  # нечитаемый data-файл — забота check_claims, не наша
    return acc


def _sig_digits(raw):
    """Значащие цифры показанного числа: '0,0501'→3, '2000'→4 (нули хвоста целого считаем)."""
    s = raw.replace("−", "-").replace(" ", "").replace(",", ".").lstrip("-").lstrip("0").lstrip(".")
    return len(s.replace(".", "").lstrip("0")) or 1


def grounded(val, digits, approx, pct, pool_dump, pool_data, sig, loss=False):
    """Число прозы обосновано? Адверсарный ревью показал: против пула ВСЕХ data/*.json с ×÷100
    и допуском «≈» выдумка проходила 7/7. Сужение: (а) ×÷100 — только при знаке процента рядом;
    (б) допуск «≈» — только против СОБСТВЕННОГО дампа; (в) data-пул — только для чисел с ≥3
    значащими цифрами (ниже — совпадение почти гарантировано случайно, проверка была бы театром)."""
    def hit(pool, with_tol):
        for v in pool:
            # Модуль — потому что проза пишет ВЕЛИЧИНУ потери, а знак несёт слово: «убрав
            # плотную ступень, теряем 0,032», тогда как в дампе delta = −0.032. Только против
            # СОБСТВЕННОГО дампа (см. (б) ниже) — расширять этим data-пул значило бы удвоить
            # его и вернуть те самые случайные совпадения, ради которых он и сужен.
            base = (v, -v) if (loss and pool is pool_dump) else (v,)
            cands = tuple(c for b in base for c in ((b, b * 100.0, b / 100.0) if pct else (b,)))
            for cand in cands:
                if with_tol:
                    if cand != 0 and abs(val - cand) / max(abs(cand), 1e-12) <= APPROX_TOL:
                        return True
                    if cand == 0 and abs(val) <= APPROX_TOL:
                        return True
                elif round(cand, digits) == round(val, digits):
                    return True
        return False
    if hit(pool_dump, approx):
        return True
    if sig >= 3 and hit(pool_data, False):
        return True
    return False


# ── разбор ноутбука ─────────────────────────────────────────────────────────────────────────────

_SEED_RX = re.compile(r"^SEED\s*=\s*(\d+)\b", re.M)
# Маркер каталога прогона. RUN_DIR (каталог ОДНОГО прогона) добавлен, когда дамп-ячейка
# стала складывать туда и числа, и журнал печатей: имя переменной поменялось, а требование
# рядом — реальный json.dump в ПОСЛЕДНЕЙ кодовой ячейке — осталось прежним.
_DUMP_MARK = re.compile(r"RUNS?_?DIR|runs?_?dir|/runs\b|\"runs\"|'runs'")


def load_nb(path):
    return json.load(open(path, encoding="utf-8"))


def nb_cells(nb, kind):
    return [("".join(c["source"]) if isinstance(c["source"], list) else c["source"])
            for c in nb.get("cells", []) if c.get("cell_type") == kind]


def check_notebook(name, nb_path, runs_dir, pool_data, err, warn, t4_dir=None):
    """Все проверки одного ноутбука. Возвращает остаток [N] (список сырых чисел без обоснования)."""
    nb = load_nb(nb_path)
    code = nb_cells(nb, "code")
    md = nb_cells(nb, "markdown")

    # [D] дамп
    dump_path = os.path.join(runs_dir, name + ".json")
    if not os.path.exists(dump_path):
        err(f"[D] {name}: нет дампа прогона {os.path.relpath(dump_path, ROOT)} — "
            f"прогони ноутбук (правило §15a: без дампа проза не проверяема)")
        return []
    try:
        dump = json.load(open(dump_path, encoding="utf-8"))
    except Exception as e:
        err(f"[D] {name}: дамп не читается ({e})")
        return []
    if dump.get("notebook") != name:
        err(f"[D] {name}: в дампе notebook={dump.get('notebook')!r} — дамп чужой")
        return []
    metrics = dump.get("metrics") or {}
    if not metrics:
        err(f"[D] {name}: metrics пуст — дамп-ячейка ничего не собрала")
        return []

    # [A] дамп-ячейка — последняя кодовая, и она реально ПИШЕТ (json.dump), а не упоминает
    if code:
        last = code[-1]
        if not (_DUMP_MARK.search(last) and re.search(r"json\.dump|_json\.dump", last)):
            err(f"[A] {name}: последняя кодовая ячейка не пишет дамп (нет json.dump) — суррогат "
                f"«дамп есть ⇒ ассерты исполнились» не работает, перенеси дамп-ячейку в конец")

    # [S] SEED
    seeds = [int(m.group(1)) for src in code for m in _SEED_RX.finditer(src)]
    if seeds and "SEED" in metrics and isinstance(metrics["SEED"], (int, float)):
        if int(metrics["SEED"]) not in seeds:
            err(f"[S] {name}: SEED дампа = {int(metrics['SEED'])}, в ноутбуке {sorted(set(seeds))} — "
                f"дамп протух, перегони прогон")

    # [K] дамп собран скребком по globals(), а ядро Colab переживает смену тетрадки:
    # запусти два семинара подряд без перезапуска — и во второй дамп попадут переменные
    # первого. Это не теория: прогон 2026-09-04 дал T4-дампы по ~200 величин, из которых
    # 142–157 принадлежали СОСЕДНИМ тетрадкам, и числа прозы «обосновывались» чужим
    # прогоном. Имя переменной обязано встречаться в тексте САМОЙ тетрадки — код плюс
    # markdown, потому что решения заданий живут в <details> markdown-ячеек.
    own = set(re.findall(r"[A-Za-z_][A-Za-z_0-9]*", "\n".join(code + md)))

    def alien_check(which, ms):
        alien = sorted(k for k in ms if k not in own)
        if alien:
            err(f"[K] {name}: в дампе{which} {len(alien)} величин, которых нет в тексте "
                f"тетрадки ({', '.join(alien[:6])}{' …' if len(alien) > 6 else ''}) — ядро "
                f"помнит предыдущий семинар; перезапусти ядро и прогони заново")
    alien_check("", metrics)
    if t4_dir:                                  # T4-прогон грязнится ровно так же
        t4p = os.path.join(t4_dir, name + ".json")
        if os.path.exists(t4p):
            try:
                alien_check(" T4", json.load(open(t4p, encoding="utf-8")).get("metrics") or {})
            except Exception:
                pass                            # нечитаемость — забота шага [T4]

    # [N] числа прозы. Обосновать число может ЛЮБОЙ настоящий прогон этой тетрадки —
    # и базовый (seminars/runs), и T4 (seminars/runs-t4). Иначе получается наоборот:
    # штатный рантайм курса — Colab T4, проза пишется по его результатам, а гейт ищет
    # эти числа только в CPU-дампе и объявляет честную цитату необоснованной.
    # Сверку «качество не зависит от железа» это не трогает: ею занят шаг [T4],
    # и расхождение между рантаймами он ловит отдельно и строго.
    pool_dump = []
    _flatten_nums(metrics, pool_dump)
    if t4_dir:
        t4_path = os.path.join(t4_dir, name + ".json")
        if os.path.exists(t4_path):
            try:
                t4_metrics = json.load(open(t4_path, encoding="utf-8")).get("metrics") or {}
            except Exception:
                t4_metrics = {}          # нечитаемый T4-дамп — забота шага [T4], не этого
            _flatten_nums(t4_metrics, pool_dump)
    metric_keys = {k.upper() for k in metrics}
    residue = []
    for i, src in enumerate(md):
        if src.count("`") % 2 == 1:
            warn(f"[N] {name}: непарный бэктик в markdown-ячейке #{i} — кусок прозы между двумя "
                 f"случайными бэктиками невидим для проверки чисел")
        for val, digits, approx, pct, raw, loss in numbers_in(prose_of(src)):
            if not grounded(val, digits, approx, pct, pool_dump, pool_data, _sig_digits(raw), loss):
                residue.append(raw)
        # инлайн-код вида `ИМЯ = число` с ИМЕНЕМ метрики дампа, но другим значением — WARN, не долг:
        # проза законно обсуждает контрфактические значения («поставь `b = 0,3` — увидишь…»), а
        # имена коллидируют (`k` РRF-формулы против метрики K). WARN держит класс видимым (ревью §5),
        # не карая обсуждение альтернатив.
        for m in _INLINE_ASSIGN.finditer(src):
            ident, num = m.group(1), m.group(2).replace(",", ".").replace("−", "-")
            if ident.upper() in metric_keys:
                shown = float(num)
                d = len(num.split(".")[1]) if "." in num else 0
                v = metrics[[k for k in metrics if k.upper() == ident.upper()][0]]
                if isinstance(v, (int, float)) and not isinstance(v, bool) \
                        and round(float(v), d) != round(shown, d):
                    warn(f"[N] {name}: инлайн `{ident} = {m.group(2)}` ≠ метрике дампа "
                         f"{ident.upper()}={v} — либо контрфактический пример, либо протухшая цитата")
    return residue


def check_embedded_data(name, nb_path, err):
    """[E] Вшитая копия data/*.json обязана совпадать с оригиналом БАЙТ В БАЙТ.

    Ноутбуки носят нужные им data/*.json внутри себя (zlib+base64): в Colab папки курса нет,
    и до 19.08.2026 занятие падало на первой же сверке с FileNotFoundError. Копия — это долг:
    обнови data/, забудь ноутбук, и студент будет сверяться с прошлогодними числами, причём
    молча. Поэтому копия проверяется здесь, а не держится на обещании в комментарии ячейки.
    Чинится перевшиванием, не правкой JSON внутри ячейки.
    """
    import base64
    import zlib
    nb = load_nb(nb_path)
    for cell in nb.get("cells", []):
        if cell.get("cell_type") != "code":
            continue
        src = "".join(cell.get("source", []))
        if "_EMBEDDED = {" not in src:
            continue
        ns = {}
        try:
            body = src[src.index("_EMBEDDED = {"):]
            body = body[:body.index("\n}") + 2]
            exec(body, ns)                      # только литерал словаря, без побочных эффектов
        except Exception as e:
            err(f"[E] {name}: не читается вшитый блок данных ({type(e).__name__}: {e})")
            return
        for fname, blob in ns["_EMBEDDED"].items():
            orig = os.path.join(ROOT, "data", fname)
            if not os.path.exists(orig):
                err(f"[E] {name}: вшит {fname}, которого нет в data/ — копия пережила оригинал")
                continue
            try:
                got = zlib.decompress(base64.b64decode(blob))
            except Exception as e:
                err(f"[E] {name}: {fname} не распаковывается ({type(e).__name__})")
                continue
            if got != open(orig, "rb").read():
                err(f"[E] {name}: вшитый {fname} разошёлся с data/{fname} — "
                    f"перевши данные, не правь ячейку руками")
        return


def check_t4(name, runs_dir, t4_dir, err, warn, t4_base_dir=None):
    """[T4] сверка локального дампа с T4-дампом: качество строго, тайминги — WARN с допуском."""
    t4_path = os.path.join(t4_dir, name + ".json")
    if not os.path.exists(t4_path):
        return
    base_dir = t4_base_dir or RUNS_T4_BASE_DIR
    loc_path, tag = os.path.join(runs_dir, name + ".json"), "T4"
    if not os.path.exists(loc_path):
        loc_path, tag = os.path.join(base_dir, name + ".json"), "T4\u2261"
        if not os.path.exists(loc_path):
            return
    try:
        loc = json.load(open(loc_path, encoding="utf-8")).get("metrics") or {}
        t4 = json.load(open(t4_path, encoding="utf-8")).get("metrics") or {}
    except Exception as e:
        err(f"[{tag}] {name}: дамп не читается ({e})")
        return
    # Тайминговые имена. Кроме очевидных MS/TIME/SEC сюда входят три формы, на которых
    # сверка ложно горела «расхождением качества» после первого же T4-прогона:
    #   · t0 — абсолютное показание perf_counter (uptime процесса): между машинами
    #     оно несопоставимо В ПРИНЦИПЕ (70072 c против 805 c — это возраст рантайма);
    #   · t_bm / t_index / t_query / t_re25 — секунды из perf_counter, время по сути;
    #   · overpay и speedup — ОТНОШЕНИЯ двух времён (t_max/t_best, t_scan/t_idx), значит
    #     наследуют их разброс: у lab-bm25 speedup дал 113× на CPU против 155× на T4,
    #     и это разница железа, а не качества.
    # Имена перечислены якорно, а не «всё, что начинается на t»: T (температура),
    # TOPK, TF — это качество, и они обязаны остаться под строгой сверкой.
    timing = re.compile(
        r"MS|TIME|SEC|_DT|LATENCY|ELAPSED"
        r"|(^|\.)T\d+$"          # t0, t1 — точки отсчёта
        r"|(^|\.)T_"              # t_bm, t_index, t_query, t_re25 — секунды
        r"|(^|\.)OVERPAY$|(^|\.)SPEEDUP$"   # ОТНОШЕНИЯ времён: t_max/t_best, t_scan/t_idx
        r"|_S$|_SEC$",            # train_s, hnsw_build_s — секунды по суффиксу
        re.I)

    def flat(d):
        out = {}
        def go(k, v):
            if isinstance(v, bool):
                return
            if isinstance(v, (int, float)):
                out[k] = float(v)
            elif isinstance(v, dict):
                for kk, vv in v.items():
                    go(f"{k}.{kk}", vv)
            elif isinstance(v, (list, tuple)):
                for i, vv in enumerate(v):
                    go(f"{k}[{i}]", vv)
        for k, v in d.items():
            go(k, v)
        return out
    loc, t4 = flat(loc), flat(t4)   # «качество строго» обязано покрывать и вложенные метрики

    # ЧТО именно сверяется строго. Дамп собирается скребком по globals(), поэтому в нём
    # вперемешку лежат две разные вещи: ЗАЯВЛЕННЫЕ метрики (всё, что ноутбук сам положил
    # в RUN — результат задания, в тех же единицах, в каких его печатает проза) и рабочие
    # переменные, попавшие туда заодно (m_ — последняя итерация цикла, build_ivf — секунды,
    # theirs — сверочное значение). Строгость держится на первых: расхождение внутри RUN.*
    # между рантаймами — HARD, потому что это разошлось КАЧЕСТВО. Расхождение случайного
    # глобала — WARN: величина не заявлена как метрика, и ловить её строго значит хоронить
    # гейт под ложными срабатываниями (первый же T4-прогон дал их шесть штук из шести).
    # Потерять этим ничего нельзя: качество, за которым следят, лежит в RUN и в виде
    # структуры тоже (RUN.pq.16.mrr), а m_ — та же величина без имени.
    # Сторона, на которой RUN нет, решает строгость реакции. T4-прогон делает владелец
    # сейчас, текущей версией ноутбука — если в нём RUN нет, это недосмотр, и он HARD.
    # Локальная база могла быть снята задолго до починки сборщика (2026-09-03) и на CPU,
    # где тяжёлый ноутбук считается часами: требовать её перепрогона немедленно значит
    # держать CI красным ради того, что никто не может выполнить сегодня. Это WARN,
    # и сверка молча пропускается — сравнивать заявленные метрики всё равно не с чем.
    if "RUN" not in {k.split(".")[0] for k in t4}:
        err(f"[{tag}] {name}: в T4-дампе нет RUN — строгую сверку качества вести не с чем; "
            f"перепрогони T4-прогон текущей версией (сборщик итога кладёт RUN с 2026-09-03)")
        return
    if "RUN" not in {k.split(".")[0] for k in loc}:
        # CPU-база снята прежним сборщиком (до починки 2026-09-03) и заявленных метрик
        # не содержит. Раньше здесь сверка молча кончалась предупреждением. Теперь —
        # падаем на замороженный T4-эталон: сверять «качество не зависит от железа» всё
        # так же не с чем, зато регрессия между двумя прогонами на T4 ловится строго.
        frozen = os.path.join(base_dir, name + ".json")
        if tag == "T4" and os.path.exists(frozen):
            try:
                loc = flat(json.load(open(frozen, encoding="utf-8")).get("metrics") or {})
            except Exception as e:
                err(f"[T4\u2261] {name}: эталон не читается ({e})")
                return
            tag = "T4\u2261"
        if "RUN" not in {k.split(".")[0] for k in loc}:
            warn(f"[{tag}] {name}: в базе сверки нет RUN — снята прежним сборщиком, "
                 f"сверка качества пропущена; перепрогони базу, когда будет чем")
            return
        warn(f"[T4\u2261] {name}: CPU-базы с RUN нет (решение владельца: полный набор стоит "
             f"до суток счёта) — сверяем с замороженным эталоном ТОГО ЖЕ рантайма; "
             f"железозависимые расхождения этим шагом не проверяются")
    for k in sorted(set(loc) & set(t4)):
        a, b = loc[k], t4[k]
        declared = k.split(".")[0] == "RUN"
        if timing.search(k):
            hi, lo = max(abs(a), abs(b)), min(abs(a), abs(b))
            if lo > 0 and hi / lo > TIMING_RATIO:
                warn(f"[{tag}] {name}.{k}: тайминг разъехался {a} ↔ {b} (> {TIMING_RATIO}×) — "
                     f"{'другое железо так не объяснить' if tag == 'T4' else 'на одном рантайме так не бывает'}")
        elif a != b:
            if declared:
                err(f"[{tag}] {name}.{k}: КАЧЕСТВО разошлось "
                    f"{'между рантаймами' if tag == 'T4' else 'с замороженным эталоном того же рантайма'}"
                    f": {a} ↔ {b} — по решению владельца сверка строгая")
            else:
                warn(f"[{tag}] {name}.{k}: рабочая переменная разошлась "
                     f"{a} ↔ {b} — не заявлена в RUN, поэтому не HARD")
    missing = sorted(set(loc) - set(t4))
    if missing:
        warn(f"[{tag}] {name}: в сверяемом дампе нет метрик: {', '.join(missing[:6])}"
             + (" …" if len(missing) > 6 else ""))


# ── храповик остатка [N] ────────────────────────────────────────────────────────────────────────

def load_baseline(path=BASELINE_PATH):
    if not os.path.exists(path):
        return {}  # нет файла = нулевой долг: самый строгий режим, «разоружить» гейт нечем
    res = json.load(open(path, encoding="utf-8")).get("residue", {})
    # долг — СПИСКИ сырых строк, не счётчики: swap-атака (заменить старую выдумку новой при том же
    # счётчике) прошла адверсарный ревью — счётчик её не видел, мультимножество строк видит.
    return {k: sorted(v) if isinstance(v, list) else v for k, v in res.items()}


def ratchet_diff(old, new):
    """old/new: файл → сортированный список сырых строк. Новые СТРОКИ запрещены (не только рост
    счётчика); исчезновение строк = сокращение. → (ok, added, grown, shrunk)."""
    from collections import Counter
    added = [k for k in new if k not in old and new[k]]
    grown, shrunk = [], []
    for k in set(old) | set(new):
        co, cn = Counter(old.get(k, [])), Counter(new.get(k, []))
        fresh = list((cn - co).elements())
        gone = list((co - cn).elements())
        if k in old and fresh:
            grown.append(f"{k}: +{fresh}")
        if gone:
            shrunk.append(f"{k}: −{gone}")
    return (not added and not grown), added, grown, shrunk


# ── основной прогон ─────────────────────────────────────────────────────────────────────────────

def run(sem_dir=SEM_DIR, runs_dir=RUNS_DIR, t4_dir=RUNS_T4_DIR, data_glob=DATA_GLOB,
        baseline_path=BASELINE_PATH, update=False, listing=False,
        t4_base_dir=RUNS_T4_BASE_DIR):
    errors, warns = [], []
    err, warn = errors.append, warns.append
    pool_data = data_pool(data_glob)
    notebooks = sorted(glob.glob(os.path.join(glob.escape(sem_dir), "*.ipynb")))
    if not notebooks:
        err(f"[D] в {os.path.relpath(sem_dir, ROOT)} нет ни одного .ipynb — "
            f"правило П4: «все ноутбуки прошли» обязано опираться на непустое множество")
    residue_by_file = {}
    for nb_path in notebooks:
        name = os.path.splitext(os.path.basename(nb_path))[0]
        residue = check_notebook(name, nb_path, runs_dir, pool_data, err, warn, t4_dir)
        if residue:
            residue_by_file[name] = sorted(residue)
            if listing:
                for raw in residue:
                    print(f"    [N] {name}: {raw!r} — нет ни в дампе, ни в data/")
        check_embedded_data(name, nb_path, err)
        check_t4(name, runs_dir, t4_dir, err, warn, t4_base_dir)

    baseline = load_baseline(baseline_path)
    ok, added, grown, shrunk = ratchet_diff(baseline, residue_by_file)
    if update:
        # первичное вооружение: файла-храповика ещё нет — первая запись легальна (иначе новый
        # гейт с ненулевым долгом невозможно ввести); все последующие записи — только сокращение.
        if not os.path.exists(baseline_path):
            os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
            json.dump({"_doc": "храповик [N] check_notebooks.py: счётчик необоснованных чисел прозы "
                               "по ноутбуку; может только сокращаться (--update-baseline отказывает росту)",
                       "residue": residue_by_file},
                      open(baseline_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1,
                      sort_keys=True)
            print(f"[notebooks-gate] ПЕРВИЧНОЕ вооружение: {len(residue_by_file)} файл(ов) с остатком "
                  f"({sum(len(v) for v in residue_by_file.values())} чисел) — дальше только сокращение")
            return 0
        if not ok:
            for a in added:
                print(f"  ✗ НОВЫЙ файл с необоснованными числами: {a} ({residue_by_file[a]})")
            for g in grown:
                print(f"  ✗ НОВЫЕ числа: {g}")
            print("[notebooks-gate] ОТКАЗ записи: бейзлайн может только сокращаться — "
                  "обоснуй числа (дамп/data), не записывай долг")
            return 1
        os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
        json.dump({"_doc": "храповик [N] check_notebooks.py: счётчик необоснованных чисел прозы "
                           "по ноутбуку; может только сокращаться (--update-baseline отказывает росту)",
                   "residue": residue_by_file},
                  open(baseline_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1,
                  sort_keys=True)
        for s in shrunk:
            print(f"  ↓ {s}")
        print(f"[notebooks-gate] бейзлайн записан: {len(residue_by_file)} файл(ов) с остатком")
        return 0

    for a in added:
        err(f"[N] {a}: {len(residue_by_file[a])} число(сел) прозы без обоснования — НОВЫЙ файл долга: "
            f"{residue_by_file[a]}")
    for g in grown:
        err(f"[N] новые необоснованные числа (замена старых не амнистирует): {g}")
    for s in shrunk:
        warn(f"[N] долг сократился ({s}) — зафиксируй: --update-baseline")

    for e in errors:
        print(f"  ✗ [HARD] {e}")
    for w in warns:
        print(f"  ! [WARN] {w}")
    print(f"[notebooks-gate] ноутбуков: {len(notebooks)} · HARD={len(errors)} WARN={len(warns)}")
    return 1 if errors else 0


# ── селфтест ────────────────────────────────────────────────────────────────────────────────────

def _mk_nb(md, code_cells):
    return {"cells": [{"cell_type": "markdown", "source": md}] +
                     [{"cell_type": "code", "source": c} for c in code_cells]}


def selftest():
    import shutil
    import tempfile
    tmp = tempfile.mkdtemp(prefix="check_nb_selftest_")
    fails = []

    def case(label, want_hard, md, dump_metrics, code_extra=None, baseline=None, t4=None,
             alien=(), t4_base=None):
        # Настоящая тетрадка упоминает свои метрики в коде — иначе они бы там не появились.
        # Фикстура обязана быть такой же, иначе проверка [K] («чужая величина в дампе»)
        # горит на каждой синтетике. Что должно остаться ЧУЖИМ, перечисляется в alien.
        sem = os.path.join(tmp, label, "seminars")
        runs = os.path.join(sem, "runs")
        t4d = os.path.join(sem, "runs-t4")
        t4b = os.path.join(sem, "runs-t4-baseline")
        os.makedirs(runs)
        dglob = os.path.join(tmp, label, "data", "*.json")
        os.makedirs(os.path.dirname(dglob))
        code = ["SEED = 42\n", "import json\njson.dump({}, open('runs/x'))  # RUNS_DIR\n"]
        if code_extra is not None:
            code = list(code_extra)
        mentioned = set()
        for src in (dump_metrics, t4, t4_base):
            for k, v in (src or {}).items():
                mentioned.add(k)
                if isinstance(v, dict):
                    mentioned.update(v)
        mentioned -= set(alien)
        if mentioned:
            # в НАЧАЛО: последняя кодовая ячейка обязана оставаться дамп-ячейкой (проверка [A])
            code = ["# величины прогона: " + " ".join(sorted(mentioned)) + "\n"] + code
        json.dump(_mk_nb(md, code), open(os.path.join(sem, "nb.ipynb"), "w"))
        if dump_metrics is not None:
            json.dump({"notebook": "nb", "runtime": {}, "metrics": dump_metrics},
                      open(os.path.join(runs, "nb.json"), "w"))
        if t4 is not None:
            os.makedirs(t4d, exist_ok=True)
            json.dump({"notebook": "nb", "runtime": {"gpu": "T4"}, "metrics": t4},
                      open(os.path.join(t4d, "nb.json"), "w"))
        if t4_base is not None:
            os.makedirs(t4b, exist_ok=True)
            json.dump({"notebook": "nb", "runtime": {"gpu": "T4"}, "metrics": t4_base},
                      open(os.path.join(t4b, "nb.json"), "w"))
        bpath = os.path.join(tmp, label, "baseline.json")
        if baseline is not None:
            json.dump({"residue": baseline}, open(bpath, "w"))
        import io
        import contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = run(sem_dir=sem, runs_dir=runs, t4_dir=t4d, data_glob=dglob,
                     baseline_path=bpath, t4_base_dir=t4b)
        got_hard = rc != 0
        status = "OK" if got_hard == want_hard else "FAIL"
        if got_hard != want_hard:
            fails.append(label)
        print(f"  [{status}] {label}: HARD={'да' if got_hard else 'нет'} "
              f"(ожидалось {'да' if want_hard else 'нет'})")
        return buf.getvalue()

    seed_code = ["SEED = 42\n",
                 "import json\njson.dump({}, open('runs/nb.json','w'))  # RUNS_DIR\n"]

    # 1. чистая пара: число прозы 0,63 обосновано метрикой 0.6309
    case("clean", False, "разбор: получилось 0,63 — совпало с доской",
         {"SEED": 42, "NDCG": 0.6309}, seed_code)
    # 2. выдуманное число прозы горит
    case("invented", True, "разбор: получилось 0,77", {"SEED": 42, "NDCG": 0.6309}, seed_code)
    # 3. отсутствие дампа горит
    case("no-dump", True, "проза без чисел", None, seed_code)
    # 4. дамп-ячейка не последняя — суррогат ассертов сломан
    case("dump-not-last", True, "проза без чисел", {"SEED": 42, "X": 1.0},
         ["import json\njson.dump({}, open('runs/nb.json','w'))  # RUNS_DIR\n",
          "SEED = 42\nprint('после дампа')\n"])
    # 5. протухший дамп: SEED разъехался
    case("stale-seed", True, "проза без чисел", {"SEED": 7, "X": 1.0}, seed_code)
    # 6. приблизительное число: ≈ 90 мс при замере 93.1 — допуск живёт…
    case("approx-ok", False, "стадия заняла ≈ 90 мс на CPU", {"SEED": 42, "STAGE_MS": 93.1},
         seed_code)
    # 7. …а трёхкратное расхождение — нет
    case("approx-fail", True, "стадия заняла ≈ 90 мс", {"SEED": 42, "STAGE_MS": 300.0}, seed_code)
    # 8. код/формулы/структурные числа не считаются: Задание 3, §7.3, 10 мин, `top=100`, $2^{10}$
    case("exclusions", False,
         "### Задание 3 — 10 мин\nправило §7.3; статья (Robertson, 1994); в коде `rank(top=100)`; формула $2^{10}$",
         {"SEED": 42, "X": 1.0}, seed_code)
    # 9. бейзлайн покрывает старый долг — не горит…
    case("baselined", False, "разбор: получилось 0,77", {"SEED": 42, "NDCG": 0.6309},
         seed_code, baseline={"nb": ["0,77"]})
    # 10. …рост поверх бейзлайна горит…
    case("growth", True, "разбор: 0,77 и ещё 0,88", {"SEED": 42, "NDCG": 0.6309},
         seed_code, baseline={"nb": ["0,77"]})
    # 10b. …и SWAP горит: счётчик тот же (1), но строка другая — замена не амнистирует
    case("swap", True, "разбор: получилось 0,88", {"SEED": 42, "NDCG": 0.6309},
         seed_code, baseline={"nb": ["0,77"]})
    # 10c. полное погашение долга — гейт не падает (KeyError из ревью §2) и лишь хвалит WARN-ом
    case("paid-off", False, "проза без чисел", {"SEED": 42, "NDCG": 0.6309},
         seed_code, baseline={"nb": ["0,77"]})
    # 10d. процент НЕ масштабируется без знака «%»: 0,21 в дампе не обосновывает голое «21»
    case("pct-context", True, "смещение достигло 21 балла", {"SEED": 42, "SHARE": 0.2126},
         seed_code)
    # 10e. «≈» против data-пула не работает (допуск только к своему дампу): в data лежит 100,
    #      в прозе «≈ 95» — не обосновано
    sem_x = os.path.join(tmp, "approx-data", "seminars")
    os.makedirs(os.path.join(sem_x, "runs"))
    ddir = os.path.join(tmp, "approx-data", "data")
    os.makedirs(ddir)
    json.dump({"x": 100.0}, open(os.path.join(ddir, "d.json"), "w"))
    json.dump(_mk_nb("замер дал ≈ 95 единиц", seed_code), open(os.path.join(sem_x, "nb.ipynb"), "w"))
    json.dump({"notebook": "nb", "runtime": {}, "metrics": {"SEED": 42, "Y": 7.0}},
              open(os.path.join(sem_x, "runs", "nb.json"), "w"))
    import io as _io
    import contextlib as _ctx
    with _ctx.redirect_stdout(_io.StringIO()):
        rc_ad = run(sem_dir=sem_x, runs_dir=os.path.join(sem_x, "runs"),
                    t4_dir=os.path.join(sem_x, "t4"), data_glob=os.path.join(ddir, "*.json"),
                    baseline_path=os.path.join(tmp, "approx-data", "b.json"))
    okad = rc_ad != 0
    print(f"  [{'OK' if okad else 'FAIL'}] approx-vs-data: HARD={'да' if okad else 'нет'} (ожидалось да)")
    if not okad:
        fails.append("approx-vs-data")
    # 10f. инлайн-цитата константы дампа: `K1 = 1,6` при метрике K1=1.5 — WARN (не HARD: проза
    #      законно обсуждает контрфактические значения)
    out_ic = case("inline-const", False, "с параметром `K1 = 1,6` счёт другой",
                  {"SEED": 42, "K1": 1.5}, seed_code)
    if "[WARN]" not in out_ic or "K1" not in out_ic:
        fails.append("inline-const-warn")
        print("  [FAIL] inline-const-warn: WARN о протухшей цитате не выдан")
    else:
        print("  [OK] inline-const-warn: WARN выдан")
    # 10g. количество «2000 документах» больше не прячется за маской лет (в дампе есть — молчит)
    case("year-vs-count", False, "замеряем на 2000 документах; статья (Robertson, 1994)",
         {"SEED": 42, "N_DOCS": 2000}, seed_code)
    # 11. T4: расхождение КАЧЕСТВА — HARD
    case("t4-quality", True, "проза без чисел", {"SEED": 42, "RUN": {"NDCG": 0.6309}},
         seed_code, t4={"SEED": 42, "RUN": {"NDCG": 0.6417}})
    # 12. T4: расхождение тайминга в 3 раза — WARN, не HARD
    case("t4-timing", False, "проза без чисел", {"SEED": 42, "RUN": {"STAGE_MS": 100.0}},
         seed_code, t4={"SEED": 42, "RUN": {"STAGE_MS": 300.0}})
    # 10f-K. чужая величина в дампе — HARD: ядро помнит предыдущий семинар
    case("alien-metric", True, "проза без чисел",
         {"SEED": 42, "RUN": {"NDCG": 0.63}, "AVGDL_LEC": 50.6}, seed_code,
         alien=("AVGDL_LEC",))
    # 10g-K. …а величина из РЕШЕНИЯ (живёт в markdown, не в коде) — своя, молчим
    case("solution-var", False, "решение: `mid = 0,5` — середина\n",
         {"SEED": 42, "RUN": {"NDCG": 0.63}, "mid": 0.5}, seed_code, alien=("mid",))
    # 10e-L. «теряем 0,032» сверяется с дампом ПО МОДУЛЮ: знак несёт глагол, а не число
    case("loss-abs", False, "убрав плотную ступень, теряем 0,032 при интервале",
         {"SEED": 42, "RUN": {"delta": -0.032}}, seed_code)
    # 10f-L. …но без слова потери модуль не применяется: p-value не обосновать границей интервала
    case("loss-abs-absent", True, "ошибка того же рода, что «p > 0,0488 значит эффекта нет»",
         {"SEED": 42, "RUN": {"ciLow": -0.0488}}, seed_code)
    # 10f-A. словесный маркер приблизительности работает так же, как «≈»: 268 → «около 270»
    case("approx-word", False, "медиана длины у нас около 270 слов",
         {"SEED": 42, "RUN": {"median_doc_words": 268.0}}, seed_code)
    # 10g-A. …но без маркера то же число остаётся выдумкой
    case("approx-word-absent", True, "медиана длины у нас ровно 270 слов",
         {"SEED": 42, "RUN": {"median_doc_words": 268.0}}, seed_code)
    # 10h. число прозы, взятое из T4-прогона, обосновано им, а не объявлено выдумкой
    out = case("number-from-t4", False, "на T4 вышло 0,77 — вдвое быстрее",
               {"SEED": 42, "RUN": {"NDCG": 0.63}}, seed_code,
               t4={"SEED": 42, "RUN": {"NDCG": 0.63, "SPEEDUP": 0.7712}})
    assert "0,77" not in out, "число из T4-дампа попало в остаток [N]"
    # 10i. …но выдумка не спасается наличием T4-дампа
    out = case("number-in-neither", True, "получилось 0,4242 — ниоткуда",
               {"SEED": 42, "RUN": {"NDCG": 0.63}}, seed_code,
               t4={"SEED": 42, "RUN": {"NDCG": 0.63}})
    assert "0,4242" in out, "выдуманное число не попало в остаток [N]"
    # 11a. T4: строгость держится на RUN — расхождение ЗАЯВЛЕННОЙ метрики HARD…
    case("t4-run-quality", True, "проза без чисел",
         {"SEED": 42, "RUN": {"ndcg": 0.6309}}, seed_code,
         t4={"SEED": 42, "RUN": {"ndcg": 0.6417}})
    # 11b. …а расхождение рабочей переменной, не заявленной в RUN, — WARN
    case("t4-scratch-var", False, "проза без чисел",
         {"SEED": 42, "RUN": {"ndcg": 0.63}, "m_": 0.2889}, seed_code,
         t4={"SEED": 42, "RUN": {"ndcg": 0.63}, "m_": 0.2866})
    # 11c. T4-дамп без RUN — HARD: прогон делается сейчас, значит это недосмотр
    case("t4-no-run", True, "проза без чисел", {"SEED": 42, "RUN": {"NDCG": 0.63}}, seed_code,
         t4={"SEED": 42, "NDCG": 0.63})
    # 11d. …а старая ЛОКАЛЬНАЯ база без RUN — WARN: её перепрогон бывает недоступен
    case("t4-old-baseline", False, "проза без чисел", {"SEED": 42, "NDCG": 0.63}, seed_code,
         t4={"SEED": 42, "RUN": {"NDCG": 0.63}})
    # 11e. CPU-базы с RUN нет, но T4-эталон заморожен и совпадает — не HARD, только WARN
    #      о том, что сверка идёт внутри одного рантайма.
    out = case("t4eq-matches", False, "проза без чисел", {"SEED": 42, "NDCG": 0.63}, seed_code,
               t4={"SEED": 42, "RUN": {"ndcg": 0.63}},
               t4_base={"SEED": 42, "RUN": {"ndcg": 0.63}})
    assert "T4\u2261" in out, "падение на замороженный эталон не объявлено"
    # 11f. …и та же связка ловит регрессию: RUN разошёлся с эталоном ТОГО ЖЕ рантайма.
    #      Раньше здесь была тишина — сверять было не с чем, и шаг молча выходил.
    case("t4eq-drifts", True, "проза без чисел", {"SEED": 42, "NDCG": 0.63}, seed_code,
         t4={"SEED": 42, "RUN": {"ndcg": 0.71}},
         t4_base={"SEED": 42, "RUN": {"ndcg": 0.63}})
    # 11g. эталон без RUN эталоном не работает — остаётся прежний WARN
    case("t4eq-base-no-run", False, "проза без чисел", {"SEED": 42, "NDCG": 0.63}, seed_code,
         t4={"SEED": 42, "RUN": {"ndcg": 0.63}}, t4_base={"SEED": 42, "NDCG": 0.63})
    # 12a. T4: t0 — абсолютный perf_counter; между машинами он расходится в 87 раз, и это
    #      возраст рантайма, а не качество. Тайминг по имени, значит WARN, а не HARD.
    case("t4-t0", False, "проза без чисел", {"SEED": 42, "RUN": {"t0": 70072.7}},
         seed_code, t4={"SEED": 42, "RUN": {"t0": 804.9}})
    # 12b. T4: t_index / overpay — секунды и отношение секунд, тоже тайминги
    case("t4-t-underscore", False, "проза без чисел",
         {"SEED": 42, "RUN": {"t_index": 4.27, "overpay": 7.2, "train_s": 2.24,
                              "speedup": 113.5}},
         seed_code, t4={"SEED": 42, "RUN": {"t_index": 5.51, "overpay": 8.3, "train_s": 14.0,
                                            "speedup": 154.6}})
    # 12c. соседние имена на ту же букву остаются КАЧЕСТВОМ: tf (частота), theirs (метрика)
    case("t4-not-timing", True, "проза без чисел", {"SEED": 42, "RUN": {"tf": 3.0}},
         seed_code, t4={"SEED": 42, "RUN": {"tf": 4.0}})
    # 13. процент: «21 %» обоснован метрикой 0.2126 в показанной точности
    case("percent", False, "top-частоты дают 21 % всех токенов", {"SEED": 42, "SHARE": 0.2126},
         seed_code)
    # 14. пустой каталог семинаров — П4: непустота множества
    sem_e = os.path.join(tmp, "empty", "seminars")
    os.makedirs(os.path.join(sem_e, "runs"))
    import io
    import contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        rc = run(sem_dir=sem_e, runs_dir=os.path.join(sem_e, "runs"),
                 t4_dir=os.path.join(sem_e, "t4"),
                 data_glob=os.path.join(tmp, "empty", "data", "*.json"),
                 baseline_path=os.path.join(tmp, "empty", "b.json"))
    ok = rc != 0
    print(f"  [{'OK' if ok else 'FAIL'}] empty-set: HARD={'да' if ok else 'нет'} (ожидалось да)")
    if not ok:
        fails.append("empty-set")

    # 15. отказ храповика: --update-baseline не записывает рост
    ok_r, added, grown, _ = ratchet_diff({"nb": ["0,77"]}, {"nb": ["0,77", "0,88", "0,99"]})
    if ok_r or not grown:
        fails.append("ratchet-refuse")
    print(f"  [{'OK' if not ok_r else 'FAIL'}] ratchet-refuse: рост отвергнут")

    # 16. первичное вооружение: нет файла — запись легальна; повторная с ростом — отказ
    sem_s = os.path.join(tmp, "seed", "seminars")
    runs_s = os.path.join(sem_s, "runs")
    os.makedirs(runs_s)
    os.makedirs(os.path.join(tmp, "seed", "data"))
    json.dump(_mk_nb("разбор: 0,77", ["SEED = 42\nX = 1.0\n",
              "import json\njson.dump({}, open('runs/nb.json','w'))  # RUNS_DIR\n"]),
              open(os.path.join(sem_s, "nb.ipynb"), "w"))
    json.dump({"notebook": "nb", "runtime": {}, "metrics": {"SEED": 42, "X": 1.0}},
              open(os.path.join(runs_s, "nb.json"), "w"))
    bp = os.path.join(tmp, "seed", "b.json")
    with contextlib.redirect_stdout(io.StringIO()):
        rc1 = run(sem_dir=sem_s, runs_dir=runs_s, t4_dir=os.path.join(sem_s, "t4"),
                  data_glob=os.path.join(tmp, "seed", "data", "*.json"),
                  baseline_path=bp, update=True)
        rc2 = run(sem_dir=sem_s, runs_dir=runs_s, t4_dir=os.path.join(sem_s, "t4"),
                  data_glob=os.path.join(tmp, "seed", "data", "*.json"),
                  baseline_path=bp)
    seeded = json.load(open(bp))["residue"] if os.path.exists(bp) else None
    ok16 = rc1 == 0 and seeded == {"nb": ["0,77"]} and rc2 == 0
    if not ok16:
        fails.append("initial-seed")
    print(f"  [{'OK' if ok16 else 'FAIL'}] initial-seed: первая запись легальна, гейт после неё молчит")

    shutil.rmtree(tmp, ignore_errors=True)
    if fails:
        print(f"[selftest] FAIL: {', '.join(fails)}")
        return 1
    print("[selftest] PASS — дамп/ассерты/SEED/выдуманное число/допуск ≈/исключения/храповик/"
          "T4-качество-vs-тайминг/непустота все ведут себя как заявлено")
    return 0


def freeze_t4(t4_dir=RUNS_T4_DIR, runs_dir=RUNS_DIR, base_dir=RUNS_T4_BASE_DIR, force=False):
    """--freeze-t4: заморозить T4-эталон там, где CPU-базы с RUN нет.

    Заморозка эталона — это то, чем визуальный долг заводят в репозиторий, поэтому она
    ЯВНАЯ и отказывается перезаписывать уже замороженное без --force: иначе очередной
    прогон бесшумно объявил бы эталоном сам себя, и сверка перестала бы что-либо ловить.
    """
    os.makedirs(base_dir, exist_ok=True)
    frozen = skipped = 0
    for t4p in sorted(glob.glob(os.path.join(glob.escape(t4_dir), "*.json"))):
        name = os.path.splitext(os.path.basename(t4p))[0]
        try:
            t4 = json.load(open(t4p, encoding="utf-8"))
        except Exception as e:
            print(f"  ✗ {name}: T4-дамп не читается ({e})")
            continue
        if "RUN" not in (t4.get("metrics") or {}):
            print(f"  · {name}: в T4-дампе нет RUN — эталоном быть не может")
            continue
        locp = os.path.join(runs_dir, name + ".json")
        if os.path.exists(locp):
            try:
                if "RUN" in (json.load(open(locp, encoding="utf-8")).get("metrics") or {}):
                    skipped += 1
                    print(f"  · {name}: есть CPU-база с RUN — эталон не нужен, "
                          f"сверка кросс-рантаймовая и она сильнее")
                    continue
            except Exception:
                pass
        dst = os.path.join(base_dir, name + ".json")
        if os.path.exists(dst) and not force:
            print(f"  · {name}: эталон уже заморожен — перезапись только с --force")
            continue
        with io.open(dst, "w", encoding="utf-8") as fh:
            json.dump(t4, fh, ensure_ascii=False, indent=1, sort_keys=True)
            fh.write("\n")
        frozen += 1
        print(f"  ✓ {name}: эталон заморожен ({len(t4.get('metrics') or {})} величин)")
    print(f"[notebooks-gate] эталонов заморожено: {frozen} · пропущено (есть CPU-база): {skipped}")
    return 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    if "--freeze-t4" in sys.argv:
        sys.exit(freeze_t4(force="--force" in sys.argv))
    sys.exit(run(update="--update-baseline" in sys.argv, listing="--list" in sys.argv))
