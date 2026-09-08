#!/usr/bin/env python3
"""check_derived.py — DERIVED-ARITHMETIC gate: показанные слагаемые дают показанный итог.

Класс дефекта (аудит 2026-08, ФАЗА 2 плана исправлений): рядом в одной записи data/*.json лежат
список компонент (contrib, probs, eigenvalues, goldWork[].bm25, terms[].contrib) и скаляр-итог
(H, probSum, totalVar, goldScore, dcg, sum). Студент, складывающий напечатанную колонку руками,
обязан попасть ровно в напечатанный итог — а генераторы иногда (а) суммируют неокруглённое и
округляют один раз (0.8594 + 0.5291 = 1.3885, а напечатано 1.3884), либо (б) считают производное
поле от УЖЕ округлённого входа (39 × 3.6676 = 143.0364 вместо 39 × H_raw = 143.0371). Гейт ловит
оба варианта:

  [S] СУММЫ — для каждой зарегистрированной пары «список → итог» сумма компонент В ПОКАЗАННОЙ
      ТОЧНОСТИ равна итогу. Числа читаются как Decimal прямо из текста JSON (показанная точность =
      сколько знаков напечатано), сравнение — на максимальной из показанных точностей пары: так
      probSum=1.0 при Σ показанных probs = 0.9999 горит, а законная пара 4dp==4dp сверяется точно.
  [D] ПРОИЗВОДНЫЕ — поле, объявленное производным, пересчитывается от СЫРЫХ входов того же файла
      (pHeads → contrib; phrase.text → floorBits) и сверяется с показанным на его же точности.
      Это ровно запрет «производные не считаются от округлённых входов»: пересчёт от сырья другой
      цифры дать не может, а пересчёт от округлённого — давал.

Пары связываются ПО ИМЕНАМ ПОЛЕЙ (реестр PAIRS). Соседства «список—не-итог» перечислены белым
списком NON_TOTALS с причиной (probs соседствует с H, но Σprobs=1, а H — энтропия, не сумма).
Незнакомое соседство известного списка с известным итогом — WARN: его нужно классифицировать
в один из двух реестров, молча пройти мимо нельзя (правило П4: «все X валидны» ⇒ «X не ноль»).

Usage:  python3 _research/check_derived.py             (гейт по data/*.json)
        python3 _research/check_derived.py --selftest  (сдвиг последнего знака слагаемого горит;
                                                        исправленная фикстура молчит)
CI-регистрация — отдельным шагом, не здесь.
"""
import glob
import json
import math
import os
import sys
from collections import Counter
from decimal import Decimal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_GLOB = os.path.join(glob.escape(ROOT), "data", "*.json")

# ── [S] реестр пар «список компонент → скаляр-итог», по именам полей ────────────────────────────
# (имя списка, числовое под-поле элементов | None для плоского списка чисел, имя итога)
PAIRS = [
    ("contrib",     None,      "H"),          # l17 coin: вклады p·(−log2 p) суммируются в энтропию
    ("probs",       None,      "probSum"),    # l5-skipgram: показанные softmax-вероятности и их сумма
    ("eigenvalues", None,      "totalVar"),   # l5-pca-rotate: λ₁+λ₂+λ₃ = полная дисперсия (= trace C)
    ("goldWork",    "bm25",    "goldScore"),  # l20: по-термовые BM25-вклады и итоговый счёт документа
    ("terms",       "contrib", "dcg"),        # l4-goodhart-steps: gain·discount по рангам и DCG
    ("terms",       "contrib", "sum"),        # l4-graded linearIdcgTerms: те же вклады и их сумма
]

# ── белый список соседств «список—не-итог» (имя списка, имя скаляра) → почему это НЕ пара ───────
NON_TOTALS = {
    ("probs", "H"): "Σprobs = 1 по определению, а H — энтропия распределения; итог у probs — probSum",
    ("selfInfo", "H"): "невзвешенные −log2 p не суммируются в H; в H суммируются p-взвешенные contrib",
}

# имена, участвующие хоть в одном реестре, — для детектора незнакомых соседств
_LIST_NAMES = {p[0] for p in PAIRS} | {k[0] for k in NON_TOTALS}
_TOTAL_NAMES = {p[2] for p in PAIRS} | {k[1] for k in NON_TOTALS}


def _dp(x):
    """Показанная точность Decimal (сколько знаков после точки напечатано в JSON)."""
    return max(0, -x.as_tuple().exponent)


def _values(node, subkey):
    """Компоненты пары: плоский список чисел, список записей с числовым под-полем, либо dict."""
    if isinstance(node, dict):
        items = list(node.values())
    else:
        items = node
    out = []
    for it in items:
        if subkey is None:
            if isinstance(it, (Decimal, int)):
                out.append(Decimal(it))
            else:
                return None                       # список не из чисел — пара не применяется
        else:
            if not isinstance(it, dict) or subkey not in it:
                return None
            v = it[subkey]
            if not isinstance(v, (Decimal, int)):
                return None
            out.append(Decimal(v))
    return out


def _quant(x, dp):
    return x.quantize(Decimal(1).scaleb(-dp))


def check_sums(obj, path, hard, warn):
    """Обходит один разобранный (parse_float=Decimal) JSON; пишет находки в hard/warn."""
    if isinstance(obj, list):
        for i, v in enumerate(obj):
            check_sums(v, f"{path}[{i}]", hard, warn)
        return
    if not isinstance(obj, dict):
        return
    for list_key, subkey, total_key in PAIRS:
        if list_key in obj and total_key in obj and isinstance(obj[total_key], (Decimal, int)):
            comps = _values(obj[list_key], subkey)
            if comps is None or not comps:
                continue
            total = Decimal(obj[total_key])
            dp = max([_dp(c) for c in comps] + [_dp(total)])
            shown_sum = _quant(sum(comps), dp)
            if shown_sum != _quant(total, dp):
                hard.append(f"{path}/{list_key}{'[].' + subkey if subkey else ''} → {total_key}: "
                            f"Σ показанных компонент = {shown_sum}, а напечатанный итог = {total} "
                            f"(округляй ПОСЛЕ суммирования — или печатай итог от округлённых компонент)")
    # незнакомое соседство известного списка с известным итогом → классифицировать, не молчать
    for lk in obj:
        if lk not in _LIST_NAMES or not isinstance(obj[lk], (list, dict)):
            continue
        for tk in obj:
            if tk == lk or tk not in _TOTAL_NAMES or not isinstance(obj[tk], (Decimal, int)):
                continue
            known = any(lk == p[0] and tk == p[2] for p in PAIRS) or (lk, tk) in NON_TOTALS
            if not known:
                warn.append(f"{path}: соседство «{lk}» и «{tk}» не классифицировано — добавь пару "
                            f"в PAIRS (это итог) или в NON_TOTALS (это не итог)")
    for k, v in obj.items():
        check_sums(v, f"{path}/{k}", hard, warn)


# ── [D] производные поля: пересчёт от СЫРЫХ входов того же файла ────────────────────────────────
def check_derived_l17(doc, path, hard):
    """l17-entropy: contrib от pHeads; floorBits от текста фразы. Сырьё лежит в самом файле,
    поэтому пересчёт честный — от него, а не от округлённых selfInfo / H."""
    coin = doc.get("coin")
    if isinstance(coin, dict) and "pHeads" in coin and "contrib" in coin:
        p = float(coin["pHeads"])
        expect = [p * -math.log2(p), (1 - p) * -math.log2(1 - p)]
        for i, shown in enumerate(coin["contrib"]):
            dp = _dp(Decimal(shown))
            want = round(expect[i], dp)
            if float(shown) != want:
                hard.append(f"{path}/coin/contrib[{i}]: показано {shown}, а p·(−log2 p) от сырого "
                            f"pHeads = {want} — производное посчитано от округлённого входа")
    ph, phrase = doc.get("phraseHuffman"), doc.get("phrase")
    if isinstance(ph, dict) and isinstance(phrase, dict) and "floorBits" in ph and "text" in phrase:
        letters = [c for c in str(phrase["text"]).lower() if c.isalpha()]
        n = len(letters)
        if n:
            freqs = [v / n for v in Counter(letters).values()]
            h_raw = sum(-q * math.log2(q) for q in freqs)
            shown = ph["floorBits"]
            dp = _dp(Decimal(shown))
            want = round(h_raw * n, dp)
            if float(shown) != want:
                hard.append(f"{path}/phraseHuffman/floorBits: показано {shown}, а n·H от сырых частот "
                            f"= {want} — производное посчитано от округлённого H")


def check_file(fp, hard, warn):
    rel = os.path.relpath(fp, ROOT)
    try:
        doc = json.loads(open(fp, encoding="utf-8").read(), parse_float=Decimal)
    except Exception as e:                                    # noqa: BLE001 — битый data-файл = HARD
        hard.append(f"{rel}: JSON не читается ({e})")
        return
    check_sums(doc, rel, hard, warn)
    if os.path.basename(fp) == "l17-entropy.json":
        check_derived_l17(doc, rel, hard)


def main():
    if "--selftest" in sys.argv:
        return selftest()
    files = sorted(glob.glob(DATA_GLOB))
    if not files:
        print("[check-derived] ✗ data/*.json не найдены — гейту нечего проверять (правило П4)")
        sys.exit(1)
    hard, warn = [], []
    pairs_seen = 0
    for fp in files:
        before = len(hard) + len(warn)
        check_file(fp, hard, warn)
        pairs_seen += 1
    for m in hard:
        print(f"  ✗ [HARD] {m}")
    for m in warn:
        print(f"  ! [WARN] {m}")
    # П4: сама проверка обязана на что-то опираться — ноль сработавших пар значит, что реестр
    # разъехался с данными (переименовали поле — и гейт молча перестал видеть класс).
    matched = _count_registered_pairs(files)
    # Храповик покрытия (замечание независимой проверки): переименование одного поля
    # молча выронило бы пару из реестра, а страховка «ноль совпадений» этого не видит.
    # Сегодня пар 10; меньше MIN_PAIRS — значит реестр протух, и это отказ, а не тишина.
    MIN_PAIRS = 10
    if 0 < matched < MIN_PAIRS:
        print(f"[check-derived] ✗ пар сверено {matched} < {MIN_PAIRS} — реестр потерял пары "
              f"(поле переименовали?); обнови реестр, порог только растёт")
        return 1
    if matched == 0:
        print("[check-derived] ✗ ни одна пара из PAIRS не встретилась в data/ — реестр протух")
        sys.exit(1)
    print(f"[check-derived] HARD(слагаемые≠итог / производное от округлённого)={len(hard)}  "
          f"WARN={len(warn)}  · файлов {len(files)} · пар сверено {matched}")
    if hard:
        sys.exit(1)


def _count_registered_pairs(files):
    n = 0
    for fp in files:
        try:
            doc = json.loads(open(fp, encoding="utf-8").read(), parse_float=Decimal)
        except Exception:                                     # noqa: BLE001
            continue
        stack = [doc]
        while stack:
            o = stack.pop()
            if isinstance(o, dict):
                for lk, sk, tk in PAIRS:
                    if lk in o and tk in o and isinstance(o[tk], (Decimal, int)):
                        if _values(o[lk], sk):
                            n += 1
                stack.extend(o.values())
            elif isinstance(o, list):
                stack.extend(o)
    return n


# ── selftest ────────────────────────────────────────────────────────────────────────────────────
def _run_on(payload):
    hard, warn = [], []
    doc = json.loads(json.dumps(payload), parse_float=Decimal)
    check_sums(doc, "fixture", hard, warn)
    check_derived_l17(doc, "fixture", hard)
    return hard, warn


def selftest():
    ok = []
    # 1) слагаемое со сдвинутым на единицу последним знаком — горит…
    bad_h, _ = _run_on({"contrib": [0.5, 0.3112], "H": 0.8113})
    ok.append(("сумма: сдвиг последнего знака слагаемого горит", len(bad_h) == 1))
    # …исправленная — молчит.
    good_h, _ = _run_on({"contrib": [0.5, 0.3113], "H": 0.8113})
    ok.append(("сумма: исправленная фикстура молчит", good_h == []))
    # 2) probSum=1.0 при Σ показанных probs 0.9999 — горит (сравнение на точности компонент)
    bad_h, _ = _run_on({"probs": [0.5, 0.2499, 0.25], "probSum": 1.0})
    ok.append(("probSum: недобор одного ulp виден сквозь грубый итог", len(bad_h) == 1))
    good_h, _ = _run_on({"probs": [0.5, 0.25, 0.25], "probSum": 1.0})
    ok.append(("probSum: точная сумма молчит", good_h == []))
    # 3) по-термовая пара со вложенным под-полем
    bad_h, _ = _run_on({"goldWork": [{"bm25": 0.8594}, {"bm25": 0.5291}], "goldScore": 1.3884})
    ok.append(("goldWork→goldScore: итог, округлённый мимо колонки, горит", len(bad_h) == 1))
    good_h, _ = _run_on({"goldWork": [{"bm25": 0.8594}, {"bm25": 0.5291}], "goldScore": 1.3885})
    ok.append(("goldWork→goldScore: сходящаяся колонка молчит", good_h == []))
    # 4) производное от округлённого входа — горит; от сырого — молчит.
    bad_h, _ = _run_on({"coin": {"pHeads": 0.25, "H": 0.8113, "contrib": [0.5, 0.3112]},
                        "phrase": {"text": "information theory measures surprise in bits"},
                        "phraseHuffman": {"floorBits": 143.0364}})
    ok.append(("производные: contrib от округлённого selfInfo горит",
               any("contrib[1]" in m for m in bad_h)))
    ok.append(("производные: floorBits от округлённого H горит",
               any("floorBits" in m for m in bad_h)))
    good_h, _ = _run_on({"coin": {"pHeads": 0.25, "H": 0.8113, "contrib": [0.5, 0.3113]},
                         "phrase": {"text": "information theory measures surprise in bits"},
                         "phraseHuffman": {"floorBits": 143.0371}})
    ok.append(("производные: пересчёт от сырья молчит", good_h == []))
    # 5) белый список: probs рядом с H (не итог) не горит и не WARN-ится
    _, w = _run_on({"probs": {"A": 0.5, "B": 0.25, "C": 0.125, "D": 0.125}, "H": 1.75})
    ok.append(("белый список: (probs, H) классифицировано, тишина", w == []))
    # 6) незнакомое соседство — WARN, не тишина
    _, w = _run_on({"eigenvalues": [1.0, 2.0], "H": 3.0})
    ok.append(("незнакомое соседство списка и итога даёт WARN", len(w) == 1))
    failed = [name for name, passed in ok if not passed]
    for name, passed in ok:
        print(f"  {'✓' if passed else '✗'} [selftest] {name}")
    if failed:
        print(f"[check-derived] selftest FAIL — {len(failed)} of {len(ok)}")
        sys.exit(1)
    print(f"[check-derived] selftest PASS — {len(ok)} проверок: сдвиг ulp горит, чистые молчат, "
          f"производные пересчитываются от сырья, белый список и детектор незнакомых соседств живы")


if __name__ == "__main__":
    main()
