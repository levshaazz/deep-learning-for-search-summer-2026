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

    print(f"[gen_l7] bi   dotRel={bi['toy']['dotRel']} cosRel={bi['toy']['cosRel']} cosIrr={bi['toy']['cosIrr']}")
    print(f"[gen_l7] cross logitRel={cx['toy']['logitRel']}→{cx['toy']['scoreRel']}  logitNeg={cx['toy']['logitNeg']}→{cx['toy']['scoreNeg']}")
    print(f"[gen_l7] cascade stages={[s['count'] for s in casc['stages']]} bm25Ndcg={bm25Ndcg}")
    print("[gen_l7] wrote l7-biencoder + l7-crossencoder + l7-cascade (toy blocks; heavy keys preserved)")


if __name__ == "__main__":
    main()
