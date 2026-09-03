#!/usr/bin/env python3
"""gen_l8.py — TOY (stdlib-only, pure-arithmetic) worked-example numbers for L8
"The Alliance" (late interaction / ColBERT · learned sparse / SPLADE · hybrid · Learning to Rank).

Every number here is COMPUTED (math.log / a local sigmoid / Decimal round-then-sum) and rounded to
4 places, so the frozen JSON is byte-stable (H3, reproducible under the light vendored toolchain — this
file imports ONLY stdlib + genlib.write_json). The four hand-calc throughlines:

  ColBERT (MaxSim): per query token, take its MAX similarity over the doc tokens, then sum the maxes.
                    relevant doc rowMax [0.90,0.50,0.95] → 2.35 ; the lexical-trap irrelevant doc
                    scores "bank" almost perfectly (0.98) yet rowMax [0.20,0.98,0.12] → 1.30 < 2.35.
  SPLADE  (learned sparse): w = log(1+ReLU(logit)) over the vocabulary; the query "river flood" grows
                    EXPANSION terms (bank 0.4055, water 0.7885 — positive weight, not literal tokens).
                    The sparse dot is ROUND-THEN-SUM: each displayed q·d product is rounded to 4 dp,
                    then summed → 0.9887+0.2839+0.7517+1.0251 = 3.0494 (so the visible arithmetic
                    reconciles; sum-then-round would give 3.0493).
  Hybrid  (RRF): score = 1/(k+r_sparse) + 1/(k+r_dense), k=60. The consensus doc D2 (0.0325) wins;
                    the sparse favourite D1 — dense ranks it LAST — falls to 3rd (0.0318).
  LTR     (RankNet→LambdaRank): P=σ(s_i−s_j)=σ(1.2)=0.7685, cost=log(1+e^−1.2)=0.2633, gradient
                    =1−σ=0.2315, ΔnDCG from the [j,i]→[i,j] swap =1−0.6309=0.3691, λ=grad·ΔnDCG=0.0854.

Toy and (optional) REAL numbers share one file each (the L7 schema): the toy blocks live here, the
ColBERT / SPLADE "real" blocks are spliced in by the heavy companion _research/gen_l8_real.py
(torch, /usr/bin/python3). To keep H3 robust under reproduce.sh — which re-runs *this* (stdlib, always
succeeds) on a torch-less CI where gen_l8_real fails soft — this script READ-MERGES: it preserves any
pre-existing heavy-owned "real" keys rather than clobbering them.

Output: data/l8-colbert.json, data/l8-splade.json, data/l8-hybrid.json, data/l8-ltr.json, data/l8-bench.json
Run:  python3 _research/gen_l8.py     (stdlib only — runs on bare /usr/bin/python3 too)
"""
import json, math, pathlib
from decimal import Decimal, ROUND_HALF_UP

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
from genlib import write_json


def r(x, n=4):
    return round(float(x), n)


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def prod4(a, b):
    """Round-then-sum building block: the displayed q·d product, each rounded to 4 dp HALF_UP from the
    EXACT decimal of the (already 4-dp) operands — deterministic, so the four shown products add up to
    the shown dot (0.4055·0.70 = 0.283850 → 0.2839, never a float-fuzzed 0.2838)."""
    p = (Decimal(str(a)) * Decimal(str(b))).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return float(p)


def load_existing(path):
    """Return the committed JSON (to preserve heavy-owned 'real' keys) or {} on first build."""
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def main():
    # ═══════════════════════ M1 · Late interaction / ColBERT (MaxSim) ═══════════════════════
    # Toy token×token cosine matrices (hand-set, in [0,1], L2-normalized so dot == cosine). MaxSim =
    # sum over query tokens of the max over doc tokens. The irrelevant finance doc nails "bank" (0.98)
    # but still LOSES — MaxSim rewards matching MANY query tokens, not one loud one.
    def max_sim(sim):
        row_max = [max(row) for row in sim]
        return row_max, r(sum(row_max), 2)

    rel_sim = [[0.10, 0.90, 0.40, 0.30],
               [0.05, 0.50, 0.45, 0.20],
               [0.08, 0.35, 0.25, 0.95]]
    irr_sim = [[0.05, 0.20, 0.10, 0.08],
               [0.05, 0.98, 0.30, 0.15],
               [0.05, 0.12, 0.10, 0.08]]
    rel_rowmax, rel_maxsim = max_sim(rel_sim)        # [0.90,0.50,0.95] → 2.35
    irr_rowmax, irr_maxsim = max_sim(irr_sim)        # [0.20,0.98,0.12] → 1.30

    p = DATA / "l8-colbert.json"
    cb = load_existing(p)
    cb["_doc"] = ("Late interaction / ColBERT MaxSim. Toy = hand-computable token×token cosine matrices "
                  "(stdlib): MaxSim = sum_i max_j cos(E_q[i], E_d[j]). docRel 2.35 > docIrr 1.30 (the "
                  "lexical trap: a perfect 'bank' match alone is not enough). Real = frozen ColBERT-style "
                  "token sims, spliced by _research/gen_l8_real.py.")
    cb["_source"] = "_research/gen_l8.py (toy, stdlib) + gen_l8_real.py (ColBERT checkpoint, /usr/bin/python3)"
    cb["toy"] = {
        "qTokens": ["river", "bank", "flood"],
        "docRel": {
            "text": "the riverside plain flooded",
            "dTokens": ["the", "riverside", "plain", "flooded"],
            "sim": rel_sim, "rowMax": rel_rowmax, "maxSim": rel_maxsim,
        },
        "docIrr": {
            "text": "the bank approved a loan",
            "dTokens": ["the", "bank", "loan", "approved"],
            "sim": irr_sim, "rowMax": irr_rowmax, "maxSim": irr_maxsim,
        },
    }
    write_json(p, cb)

    # ═══════════════════════ M2 · Learned sparse / SPLADE ═══════════════════════
    # w_j = log(1 + ReLU(logit_j)) over a toy 6-word vocabulary. The query "river flood" lights up its
    # two literal terms AND two EXPANSION terms (bank, water) — positive weight, never typed. The sparse
    # dot with the doc is ROUND-THEN-SUM (see prod4): the four displayed products sum to the displayed dot.
    vocab = ["river", "bank", "flood", "water", "loan", "money"]
    q_text = "river flood"
    q_logits = [2.0, 0.5, 2.5, 1.2, -1.0, -2.0]
    q_relu = [max(0.0, x) for x in q_logits]
    q_weights = [r(math.log(1.0 + x)) for x in q_relu]   # [1.0986,0.4055,1.2528,0.7885,0.0,0.0]
    d_weights = [0.90, 0.70, 0.60, 1.30, 0.0, 0.0]       # doc "the riverbank overflowed with water"
    literal = set(q_text.split())
    expansion = [vocab[i] for i, w in enumerate(q_weights) if w > 0 and vocab[i] not in literal]
    terms = [{"t": vocab[i], "q": q_weights[i], "d": d_weights[i], "prod": prod4(q_weights[i], d_weights[i])}
             for i in range(len(vocab)) if q_weights[i] > 0 and d_weights[i] > 0]
    dot = r(sum(t["prod"] for t in terms), 4)            # 0.9887+0.2839+0.7517+1.0251 = 3.0494

    p = DATA / "l8-splade.json"
    sp = load_existing(p)
    sp["_doc"] = ("Learned sparse / SPLADE. Toy = hand-computable weights w = log(1+ReLU(logit)) over a "
                  "6-word vocabulary + the sparse dot (stdlib). The query 'river flood' grows EXPANSION "
                  "terms bank/water (positive weight, not literal). dot = 3.0494 is round-then-sum (each "
                  "displayed product rounded to 4 dp, then summed; sum-then-round would give 3.0493). "
                  "Real = frozen SPLADE top terms, spliced by _research/gen_l8_real.py.")
    sp["_source"] = "_research/gen_l8.py (toy, stdlib) + gen_l8_real.py (SPLADE checkpoint, /usr/bin/python3)"
    sp["toy"] = {
        "vocab": vocab,
        "query": {"text": q_text, "logits": q_logits, "relu": q_relu, "weights": q_weights, "expansion": expansion},
        "doc": {"text": "the riverbank overflowed with water", "weights": d_weights},
        "terms": terms,
        "dot": dot,
    }
    write_json(p, sp)

    # ═══════════════════════ M3 · Hybrid / Reciprocal Rank Fusion ═══════════════════════
    # score = 1/(k+r_sparse) + 1/(k+r_dense), k=60. D1 is the sparse #1 (lexical match) but dense ranks
    # it LAST; the consensus doc D2 wins; D1 falls to 3rd. RRF rewards agreement over a lopsided vote.
    k = 60
    docs = ["D1", "D2", "D3", "D4", "D5"]
    sparse_order = ["D1", "D2", "D3", "D4", "D5"]
    dense_order = ["D2", "D3", "D4", "D5", "D1"]
    rs = {d: sparse_order.index(d) + 1 for d in docs}
    rd = {d: dense_order.index(d) + 1 for d in docs}
    fused = sorted(
        [{"id": d, "rSparse": rs[d], "rDense": rd[d],
          "score": r(1.0 / (k + rs[d]) + 1.0 / (k + rd[d]), 4)} for d in docs],
        key=lambda x: -x["score"])

    hy = {
        "_doc": ("Hybrid retrieval / RRF. Toy = hand-computable reciprocal-rank fusion, k=60 (stdlib): "
                 "score = 1/(k+rSparse) + 1/(k+rDense). The consensus doc D2 (0.0325) wins; the sparse "
                 "favourite D1 — dense ranks it last — falls to 3rd (0.0318)."),
        "_source": "_research/gen_l8.py (toy, stdlib). Callback BEIR numbers live in data/l3-benchmarks.json (not duplicated).",
        "k": k,
        "docs": docs,
        "sparse": {"label": "BM25 / SPLADE", "order": sparse_order},
        "dense": {"label": "SBERT (dense)", "order": dense_order},
        "fused": fused,
        "note": "D1 is the sparse #1 (lexical match) but dense ranks it last; the consensus doc D2 wins. RRF rewards agreement.",
    }
    write_json(DATA / "l8-hybrid.json", hy)

    # ═══════════════════════ M4 · Learning to Rank (RankNet → LambdaRank) ═══════════════════════
    # A single pair (i rel=1 score=1.5, j rel=0 score=0.3), currently mis-ordered [j,i].
    #   RankNet : P_ij = σ(s_i−s_j) = σ(1.2) ; cost = log(1+e^−1.2) ; gradient = 1−σ
    #   LambdaRank : λ = gradient · |ΔnDCG|, ΔnDCG from swapping [j,i]→[i,j]
    s_i, s_j = 1.5, 0.3
    diff = r(s_i - s_j, 4)                                # 1.2
    prob = r(sigmoid(diff), 4)                            # 0.7685
    cost = r(math.log(1.0 + math.exp(-diff)), 4)          # 0.2633
    grad = r(1.0 - sigmoid(diff), 4)                      # 0.2315
    # nDCG (binary gains g_i=1, g_j=0; discount 1/log2(rank+1) — L4's formula).
    dcg_current = 0.0 / math.log2(2) + 1.0 / math.log2(3)  # order [j,i]: i sits at rank 2
    idcg = 1.0 / math.log2(2)                              # ideal: the relevant doc first
    ndcg_current = r(dcg_current / idcg, 4)               # 0.6309
    ndcg_after = 1.0
    delta_ndcg = r(ndcg_after - ndcg_current, 4)          # 0.3691
    lam = r(grad * delta_ndcg, 4)                         # 0.0854

    ltr = {
        "_doc": ("Learning to Rank. Toy = hand-computable RankNet sigmoid + LambdaRank ΔnDCG weighting "
                 "(stdlib). RankNet P=σ(s_i−s_j)=σ(1.2)=0.7685, cost=0.2633, gradient=1−σ=0.2315; the "
                 "mis-ordered [j,i] has nDCG 0.6309, the swap lifts it to 1.0 → ΔnDCG 0.3691; "
                 "λ = gradient·ΔnDCG = 0.0854. Threads RankNet → LambdaRank → LambdaMART."),
        "_source": "_research/gen_l8.py (toy, stdlib). nDCG discount 1/log2(rank+1) is L4's formula (data/l4-metrics.json).",
        "toy": {
            "pair": {"docI": {"id": "i", "rel": 1, "score": s_i}, "docJ": {"id": "j", "rel": 0, "score": s_j}},
            "scoreDiff": diff,
            "rankNetProb": prob,
            "rankNetCost": cost,
            "gradient": grad,
            "ndcg": {"currentOrder": ["j", "i"], "current": ndcg_current, "afterSwap": ndcg_after, "deltaNdcg": delta_ndcg},
            "lambda": lam,
        },
    }
    write_json(DATA / "l8-ltr.json", ltr)

    # ═══════════════════════ CITED benchmarks (l8-bench.json) ═══════════════════════
    # Published numbers — NOT computed here; verbatim with the source string + the 7 verified-source
    # flags from the content plan §4.7 (e.g. ColBERTv2 has NO single BEIR average in its own paper →
    # the 49.7 is cited to the SPLADE++ comparison table; SPLADE pooling is sum→max from v2; PLAID
    # 6.8×/45× is the MS MARCO no-loss point, label "representative").
    bench = {
        "_doc": ("CITED published benchmarks for L8 — NOT computed in this repo. Use verbatim with source. "
                 "Honor the verified-source flags: ColBERTv2 has no single BEIR average in its own paper "
                 "(49.7 → SPLADE++ table); original SPLADE = 3 authors (Lassance joins from v2); SPLADE v2 "
                 "is a 2021 arXiv preprint, the SIGIR'22 paper is SPLADE++; SPLADE pooling is sum (original) "
                 "→ max (from v2); PLAID 6.8×/45× is the MS MARCO no-loss point (representative); BEIR's "
                 "defensible quote is 'BM25 is a robust baseline'; MSLR = 136 features, grades 0-4."),
        "_source": "_research/gen_l8.py (static, cited): ColBERT/ColBERTv2/PLAID, SPLADE/v2/++, BEIR, RRF, LambdaMART/Yahoo, MSLR",
        "cited": True,
        "colbert":       {"storageGiB": {"full": 286, "compact": 27}, "dims": [128, 24],
                          "source": "Khattab & Zaharia, SIGIR 2020 (arXiv:2004.12832), Table 4"},
        "colbertv2":     {"msMarcoMrr10": 39.7, "bytesPerVec": {"v2Low": 20, "v2High": 36, "naive16bit": 256},
                          "compression": "6–10×", "source": "Santhanam et al., NAACL 2022 (arXiv:2112.01488)"},
        "colbertv2Beir": {"ndcg10": 49.7, "representative": True,
                          "source": "BEIR / SPLADE++ comparison table (arXiv:2205.04733, Table 2) — NOT in the ColBERTv2 paper itself"},
        "plaid":         {"gpuSpeedup": 6.8, "cpuSpeedup": 45, "representative": True,
                          "source": "Santhanam et al., CIKM 2022 (arXiv:2205.09707), Table 3 — dataset-dependent"},
        "splade":        {"msMarcoMrr10": 34.0, "variant": "SPLADE-max",
                          "source": "Formal et al., arXiv:2109.10086, Table 1"},
        "spladeDistil":  {"msMarcoMrr10": 36.8, "variant": "DistilSPLADE-max",
                          "source": "arXiv:2109.10086, Table 1"},
        # ОБА числа обязаны быть от ОДНОЙ модели. Прежняя пара 38.0/50.7 склеивала две:
        # по arXiv:2205.04733 Table 1 MRR@10 38.0 — это CoCondenser-EnsembleDistil (‡),
        # а BEIR 50.7 из Table 2 — CoCondenser-SelfDistil (†), у которого MRR@10 37.5.
        # Курс работает с чекпойнтом naver/splade-cocondenser-ensembledistil (см. l8-splade
        # "real"), то есть с ‡ — значит его же BEIR: 50.5.
        "spladePP":      {"msMarcoMrr10": 38.0, "beirNdcg10": 50.5,
                          "variant": "CoCondenser-EnsembleDistil (SPLADE++‡)",
                          "source": "Formal et al., SIGIR 2022 (arXiv:2205.04733), "
                                    "Table 1 (MRR@10) + Table 2 (BEIR) — оба для ‡"},
        "rrf":           {"k": 60, "source": "Cormack, Clarke & Büttcher, SIGIR 2009"},
        "production":    {"elasticRankConstant": 60, "weaviateAlpha": 0.5,
                          "source": "Elasticsearch RRF docs; Weaviate hybrid docs"},
        "ltr":           {"mslrFeatures": 136, "mslrGrades": "0-4", "mslrQueries": "≈30K", "yahooChallengeYear": 2010,
                          "source": "Microsoft MSLR; Burges MSR-TR-2010-82; Chapelle & Chang JMLR W&CP 14, 2011"},
    }
    write_json(DATA / "l8-bench.json", bench)

    print(f"[gen_l8] colbert  rel rowMax={rel_rowmax}→{rel_maxsim}  irr rowMax={irr_rowmax}→{irr_maxsim}")
    print(f"[gen_l8] splade   q.weights={q_weights}  expansion={expansion}  dot={dot}")
    print(f"[gen_l8] hybrid   fused={[(f['id'], f['score']) for f in fused]}")
    print(f"[gen_l8] ltr      σ({diff})={prob} cost={cost} grad={grad} ΔnDCG={delta_ndcg} λ={lam}")
    print(f"[gen_l8] bench    colbertv2 MRR@10={bench['colbertv2']['msMarcoMrr10']} spladePP {bench['spladePP']['msMarcoMrr10']}/{bench['spladePP']['beirNdcg10']}")
    print("[gen_l8] wrote l8-colbert + l8-splade + l8-hybrid + l8-ltr + l8-bench (toy/cited; heavy 'real' keys preserved)")


if __name__ == "__main__":
    main()
