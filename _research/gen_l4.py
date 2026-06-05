#!/usr/bin/env python3
"""gen_l4.py — data for L4 'The Proving Grounds' (Ranking Metrics).

Reuses L3's BM25 ranking (data/l3-bm25.json) and derives relevance from 20NG categories
(the L1/L2/L3 convention): for the query intent 'space', a doc is relevant iff it's sci.space.
Computes — exactly — Recall@k, Precision@k, MRR, MAP (= AP for one query), and DCG/IDCG/nDCG,
plus a deliberately 'gamed' ranking (popularity-first) whose nDCG collapses — the Goodhart beat.

Output: data/l4-metrics.json. Run:  python3 _research/gen_l4.py  (needs gen_l3.py output)
"""
import json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
INTENT_CAT = "sci.space"   # query intent: 'space' → relevant = sci.space docs
KS = [1, 3, 5, 8]

def dcg(rels):  # rels in rank order (gain per position), 1-based discount
    return sum(g / math.log2(i + 2) for i, g in enumerate(rels))

def main():
    bm = json.load(open(DATA / "l3-bm25.json"))
    by_id = {d["id"]: d for d in bm["docs"]}
    order = bm["bm25Ranking"]

    ranked = []
    for i, did in enumerate(order):
        d = by_id[did]
        rel = 1 if d["cat"] == INTENT_CAT else 0
        ranked.append({"id": did, "cat": d["cat"], "snippet": d.get("snippet", ""),
                       "rel": rel, "rank": i + 1})
    R = sum(r["rel"] for r in ranked)            # total relevant
    n = len(ranked)

    def rel_in_top(k):
        return sum(r["rel"] for r in ranked[:k])
    recall = {k: round(rel_in_top(k) / R, 4) for k in KS}
    precision = {k: round(rel_in_top(k) / k, 4) for k in KS}

    first = next((r["rank"] for r in ranked if r["rel"]), None)
    rr = round(1 / first, 4) if first else 0.0

    # AP = mean of precision@rank at each relevant rank
    hits, ap_terms = 0, []
    for r in ranked:
        if r["rel"]:
            hits += 1
            ap_terms.append(hits / r["rank"])
    ap = round(sum(ap_terms) / R, 4) if R else 0.0

    # nDCG (binary gains)
    rels_ranked = [r["rel"] for r in ranked]
    DCG = dcg(rels_ranked)
    IDCG = dcg(sorted(rels_ranked, reverse=True))   # ideal: all relevant first
    ndcg = round(DCG / IDCG, 4) if IDCG else 0.0
    discounts = [{"rank": r["rank"], "rel": r["rel"],
                  "discount": round(1 / math.log2(r["rank"] + 1), 4),
                  "contrib": round(r["rel"] / math.log2(r["rank"] + 1), 4)} for r in ranked]
    ideal_ids = [r["id"] for r in sorted(ranked, key=lambda r: (-r["rel"], r["rank"]))]

    # Goodhart: a 'popularity-gamed' ranking that puts non-relevant crowd-pleasers first.
    gamed_order = [r["id"] for r in ranked if r["rel"] == 0] + [r["id"] for r in ranked if r["rel"] == 1]
    gamed_rels = [1 if by_id[i]["cat"] == INTENT_CAT else 0 for i in gamed_order]
    gamed_ndcg = round(dcg(gamed_rels) / IDCG, 4) if IDCG else 0.0

    out = {
        "_doc": "Ranking metrics for L4 'The Proving Grounds'. Reuses L3's BM25 ranking; relevance = "
                "same 20NG category as the query intent (sci.space). Binary relevance. One query "
                "(MRR=RR, MAP=AP shown for it).",
        "_source": "_research/gen_l4.py · reads data/l3-bm25.json · relevance from 20NG categories",
        "queryIntent": "space (relevant = sci.space)", "n": n, "relevantTotal": R, "ks": KS,
        "ranked": ranked,
        "recallAtK": recall, "precisionAtK": precision,
        "firstRelevantRank": first, "rr": rr, "mrr": rr,
        "ap": ap, "map": ap,
        "dcg": round(DCG, 4), "idcg": round(IDCG, 4), "ndcg": ndcg,
        "discounts": discounts, "idealOrder": ideal_ids,
        "gamed": {"order": gamed_order, "ndcg": gamed_ndcg,
                  "note": "popularity-first ranking — looks active, tanks nDCG (Goodhart)"},
    }
    (DATA / "l4-metrics.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"[gen_l4] R={R}/{n} ranked-rel={rels_ranked}")
    print(f"[gen_l4] Recall@5={recall[5]} P@5={precision[5]} MRR={rr} MAP={ap} nDCG={ndcg} (gamed nDCG={gamed_ndcg})")
    print("[gen_l4] wrote data/l4-metrics.json")

if __name__ == "__main__":
    main()
