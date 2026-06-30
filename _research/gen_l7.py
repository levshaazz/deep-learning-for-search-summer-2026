#!/usr/bin/env python3
"""gen_l7.py — TOY (stdlib-only, pure-arithmetic) worked-example numbers for L7
"Scouts and Judges" (bi-encoders · cross-encoders & reranking · multi-stage cascade).

Every number here is COMPUTED (math.sqrt / a local sigmoid) and rounded to 4 places, so
the frozen JSON is byte-stable (H3, reproducible under the light vendored toolchain — this
file imports ONLY stdlib + genlib). The hand-calc throughline:

  bi-encoder  : dot(q, docRel)=2, dot(q, docIrr)=0 ; |q|=√2, |docRel|=√3 →
                cos(q,docRel)=2/√6≈0.8165 (similar), cos(q,docIrr)=0 (orthogonal).
  cross-encoder: a [CLS] vector → linear head w·cls+b=logit → sigmoid score.
                rel logit 2.4 → σ≈0.9168 ; the *negation* doc logit −1.1 → σ≈0.2497.
  cascade     : a 3-stage funnel (corpus → bi-encoder retrieve → cross-encoder rerank);
                BM25 nDCG@10 0.6766 (read from data/l4-metrics.json) lifts toward 1.0.

Toy and REAL numbers share one file each (the plan's schema): the toy blocks live here,
the SBERT / cross-encoder "real"/"contrast" blocks are spliced in by the heavy companion
_research/gen_l7_real.py (torch, /usr/bin/python3). To keep H3 robust under reproduce.sh —
which re-runs *this* (stdlib, always succeeds) on a torch-less CI where gen_l7_real fails
soft — this script READ-MERGES: it preserves any pre-existing heavy-owned keys (real /
contrast / latency / rerankDepth / quality.reranked*) rather than clobbering them.

Output: data/l7-biencoder.json, data/l7-crossencoder.json, data/l7-cascade.json
Run:  python3 _research/gen_l7.py     (stdlib only — runs on bare /usr/bin/python3 too)
"""
import json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
from genlib import write_json


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return math.sqrt(sum(x * x for x in a))


def cosine(a, b):
    na, nb = norm(a), norm(b)
    return dot(a, b) / (na * nb) if na and nb else 0.0


def sigmoid(z):
    return 1.0 / (1.0 + math.exp(-z))


def load_existing(path):
    """Return the committed JSON (to preserve heavy-owned keys) or {} on first build."""
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def main():
    # ───────────────────────── bi-encoder (Scouts) ─────────────────────────
    # Toy 4-D "concept" space; a query and two docs. The relevant doc shares the
    # river/water directions; the irrelevant doc lives on the finance axis only.
    q = [0, 1, 0, 1]
    docRel = [0, 1, 1, 1]
    docIrr = [1, 0, 0, 0]
    p = DATA / "l7-biencoder.json"
    bi = load_existing(p)
    bi["_doc"] = ("TOY bi-encoder scoring. A query vector and two doc vectors in a 4-D "
                  "concept space; dot / norm / cosine by hand. cos(q,docRel)=2/√6≈0.8165 "
                  "(similar), cos(q,docIrr)=0 (orthogonal). REAL SBERT cosines (the 'real' "
                  "block) are spliced in by _research/gen_l7_real.py.")
    bi["_source"] = "_research/gen_l7.py (toy, stdlib) + gen_l7_real.py (SBERT, /usr/bin/python3)"
    bi["toy"] = {
        "dims": ["finance", "geography", "animal", "water"],
        "query":  {"text": "river bank",                "vec": q},
        "docRel": {"text": "a beaver by the river bank", "vec": docRel},
        "docIrr": {"text": "the bank approved my loan",  "vec": docIrr},
        "dotRel": dot(q, docRel),               # 2  (exact int)
        "dotIrr": dot(q, docIrr),               # 0  (exact int)
        "normQ":   round(norm(q), 4),           # 1.4142
        "normRel": round(norm(docRel), 4),      # 1.7321
        "normIrr": round(norm(docIrr), 4),      # 1.0
        "cosRel":  round(cosine(q, docRel), 4), # 0.8165
        "cosIrr":  round(cosine(q, docIrr), 4), # 0.0
    }
    write_json(p, bi)

    # ───────────────────────── cross-encoder (Judges) ─────────────────────────
    # A toy [CLS] pooled vector → a 2-D linear relevance head w·cls + b → sigmoid.
    # Same surface words, opposite meaning: the "negation" doc the Scout waves through.
    w, b = [0.5, 1.0], 0.4
    clsRel = [1.0, 1.5]
    clsNeg = [1.0, -2.0]
    logitRel = dot(w, clsRel) + b               # 2.4
    logitNeg = dot(w, clsNeg) + b               # -1.1
    attnQxD = [[0.1, 0.1, 0.8],
               [0.2, 0.1, 0.7],
               [0.1, 0.7, 0.2]]                 # rows sum to 1 (inputs, verbatim)
    p = DATA / "l7-crossencoder.json"
    cx = load_existing(p)
    cx["_doc"] = ("TOY cross-encoder scoring. A joint [CLS] vector → linear head w·cls+b "
                  "→ sigmoid relevance score. Relevant logit 2.4 → σ≈0.9168; the negation "
                  "doc logit −1.1 → σ≈0.2497 (the Judge reads the 'not' the Scout missed). "
                  "Plus a 3×3 query×doc attention matrix (rows sum to 1). REAL ms-marco "
                  "cross-encoder scores (the 'real'/'contrast' blocks) come from gen_l7_real.py.")
    cx["_source"] = "_research/gen_l7.py (toy, stdlib) + gen_l7_real.py (cross-encoder, /usr/bin/python3)"
    cx["toy"] = {
        "qTokens": ["did", "river", "flood"],
        "dTokens": ["bank", "not", "flood"],
        "attnQxD": attnQxD,
        "clsRel": clsRel, "clsNeg": clsNeg,
        "w": w, "b": b,
        "logitRel": round(logitRel, 4),         # 2.4
        "scoreRel": round(sigmoid(logitRel), 4),# 0.9168
        "logitNeg": round(logitNeg, 4),         # -1.1
        "scoreNeg": round(sigmoid(logitNeg), 4),# 0.2497
    }
    write_json(p, cx)

    # ───────────────────────── the neural cascade ─────────────────────────
    # Funnel shape reused by the neural-cascade widget (= retrieve-rank-funnel):
    # corpus → bi-encoder retrieve (top-k) → cross-encoder rerank (top-10).
    # bm25Ndcg / idealNdcg are READ from data/l4-metrics.json (not re-derived);
    # rerankedOrder / rerankedNdcg / latency / rerankDepth are spliced by gen_l7_real.py.
    l4 = load_existing(DATA / "l4-metrics.json")
    bm25Ndcg = l4.get("ndcg", 0.6766)
    p = DATA / "l7-cascade.json"
    casc = load_existing(p)
    casc["_doc"] = ("Neural cascade. stages[] = retrieve-rank-funnel shape (reused by the "
                    "neural-cascade widget): corpus → bi-encoder retrieve → cross-encoder "
                    "rerank. bm25Ndcg/idealNdcg read from data/l4-metrics.json; the reranked "
                    "order + nDCG, cited latency, and rerank-depth dial are frozen by "
                    "_research/gen_l7_real.py (cross-encoder over the L4 8-doc set).")
    casc["_source"] = ("_research/gen_l7.py (stages, bm25Ndcg←data/l4-metrics.json) + "
                       "gen_l7_real.py (reranked order/nDCG, MS MARCO) ; latency cited")
    casc["stages"] = [
        {"id": "corpus",   "role": "corpus",    "count": "10⁶", "w": 100},
        {"id": "retrieve", "role": "retrieval", "count": "10³", "w": 55},
        {"id": "rerank",   "role": "rerank",    "count": "10",  "w": 22},
    ]
    # preserve any heavy-spliced quality keys (rerankedOrder/rerankedNdcg) on rerun
    quality = casc.get("quality", {})
    quality["set"] = "L4 8-doc 20NG sci.space (data/l4-metrics.json)"
    quality["bm25Ndcg"] = bm25Ndcg              # 0.6766
    quality["idealNdcg"] = 1.0
    casc["quality"] = quality
    write_json(p, casc)

    # ───────────────────────── CITED benchmarks (l7-bench.json) ─────────────────────────
    # Published reranker numbers — NOT computed here; verbatim with the source string (style of
    # data/l3-benchmarks.json). Only the numbers the deck/Book actually DISPLAY at ≥2 decimals are
    # facts-gated [C]; the rest are cited representative figures shown at 1-decimal/int (free of the
    # coverage-guard) with their source in the references. See _audit-report/L7-EXPANSION-NOTES.md §1.
    bench = {
        "_doc": ("CITED published reranker benchmarks for L7 — NOT computed in this repo. Use verbatim "
                 "with the source string. The small cross-encoder MRR@10 pair (39.01 vs 39.02) is the "
                 "teaching punchline: L12 ≈ L6 quality for ~2× the cost. The LLM-reranker nDCG@10 row "
                 "shows GPT-4 beats monoT5-3B while GPT-3.5 *underperforms* it — capability is not free."),
        "_source": ("_research/gen_l7.py (static, cited) — sentence-transformers cross-encoder docs; "
                    "RankGPT Sun et al. 2023 (arXiv 2304.09542); RankZephyr Pradeep et al. 2023 (arXiv 2312.02724)"),
        "cited": True,
        "rerankers": {
            "metric": "nDCG@10 (TREC DL19) / MRR@10 (MS MARCO dev) / docs-per-sec",
            "split": "sentence-transformers cross-encoder pretrained-models page (GPU unspecified → docs/sec is relative)",
            "tinyL2":   {"ndcgDl19": 69.8, "mrrDev": 32.56, "docsSec": 9000},
            "miniLM6":  {"ndcgDl19": 74.3, "mrrDev": 39.01, "docsSec": 1800},
            "miniLM12": {"ndcgDl19": 74.3, "mrrDev": 39.02, "docsSec": 960},
            "source": "https://sbert.net/docs/cross_encoder/pretrained_models.html",
        },
        "llmRerankers": {
            "metric": "nDCG@10 (TREC DL19, reranking the BM25 top-100)",
            "bm25": 50.58, "monoT5_3b": 71.83, "gpt35": 65.80, "gpt4": 75.59, "rankZephyr": 74.20,
            "source": "RankGPT Sun et al. 2023 Table 1 (arXiv 2304.09542); RankZephyr Pradeep et al. 2023 (arXiv 2312.02724) — all rows rerank the SAME BM25 top-100 for an apples-to-apples comparison: RankZephyr ≈74.2 here (its higher ~78 comes from a stronger SPLADE++ first stage, NOT comparable to the BM25-top-100 column)",
        },
    }
    write_json(DATA / "l7-bench.json", bench)

    # ───────────────────────── TRAINING toy: in-batch negatives (l7-train.json) ─────────────────────────
    # A B=4 batch for the `in-batch-negatives` widget: each query's positive is the diagonal doc; the
    # other B−1 docs are in-batch negatives (free). row-softmax(sims/τ) is the InfoNCE target → the
    # diagonal should win. All numbers are TOY (hand-set cosines) and render client-side in the widget
    # (inside a <script> JSON the deck strips before the coverage scan), so they need no [C] claim.
    tau = 0.2
    sims = [[0.82, 0.21, 0.08, 0.12],
            [0.18, 0.78, 0.10, 0.15],
            [0.07, 0.12, 0.85, 0.09],
            [0.14, 0.16, 0.11, 0.74]]

    def softmax_row(row, t):
        m = max(row)
        ex = [math.exp((v - m) / t) for v in row]
        s = sum(ex)
        return [round(e / s, 4) for e in ex]

    train = {
        "_doc": ("TOY in-batch negatives for the InfoNCE training widget. A B=4 batch: the diagonal (q_i, d_i) "
                 "is the positive; the other B−1 docs in the batch are negatives for free. softmax(sims/τ) per "
                 "row is the InfoNCE target — the diagonal should dominate. Hand-set toy cosines (stdlib)."),
        "_source": "_research/gen_l7.py (toy, stdlib)",
        "toy": {
            "tau": tau,
            "queries": ["river bank", "stock market", "moon landing", "jazz piano"],
            "docs": ["a beaver by the river", "shares rose on the exchange",
                     "Apollo reached the moon", "a smoky jazz club"],
            "sims": sims,
            "softmax": [softmax_row(r, tau) for r in sims],
            "diag": [sims[i][i] for i in range(len(sims))],
        },
    }
    write_json(DATA / "l7-train.json", train)

    # ───────────────────────── RAG pipeline (l7-rag.json) ─────────────────────────
    # Stage list for the `rag-pipeline` widget: OFFLINE build-time stages, then ONLINE query-time stages;
    # the neural cascade (retrieve → rerank) sits inside the online half. Structural only (ids + a phase
    # flag); all human labels come from i18n. No displayed numbers.
    rag = {
        "_doc": ("TOY RAG / full-search pipeline for the rag-pipeline widget. phase 'offline' = build-time "
                 "(amortized once over the corpus); phase 'online' = query-time (the per-query latency budget). "
                 "The retrieve→rerank pair is the neural cascade; generate carries grounding/citations."),
        "_source": "_research/gen_l7.py (toy, stdlib)",
        "offline": [{"id": "ingest"}, {"id": "chunk"}, {"id": "embed"}, {"id": "index"}],
        "online": [{"id": "qembed"}, {"id": "retrieve"}, {"id": "rerank"},
                   {"id": "assemble"}, {"id": "generate"}],
    }
    write_json(DATA / "l7-rag.json", rag)

    print(f"[gen_l7] bi   dotRel={bi['toy']['dotRel']} cosRel={bi['toy']['cosRel']} cosIrr={bi['toy']['cosIrr']}")
    print(f"[gen_l7] cross logitRel={cx['toy']['logitRel']}→{cx['toy']['scoreRel']}  logitNeg={cx['toy']['logitNeg']}→{cx['toy']['scoreNeg']}")
    print(f"[gen_l7] cascade stages={[s['count'] for s in casc['stages']]} bm25Ndcg={bm25Ndcg}")
    print(f"[gen_l7] bench rerankers L6 MRR={bench['rerankers']['miniLM6']['mrrDev']} L12 MRR={bench['rerankers']['miniLM12']['mrrDev']} ; llm gpt4={bench['llmRerankers']['gpt4']}")
    print(f"[gen_l7] train in-batch B={len(train['toy']['queries'])} τ={tau} diag={train['toy']['diag']}")
    print("[gen_l7] wrote l7-biencoder + l7-crossencoder + l7-cascade + l7-bench + l7-train + l7-rag (toy/cited; heavy keys preserved)")


if __name__ == "__main__":
    main()
