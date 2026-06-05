#!/usr/bin/env python3
"""gen_l4.py — data for L4 'The Proving Grounds' (Ranking Metrics).

Reuses L3's BM25 ranking (data/l3-bm25.json) and derives relevance from 20NG categories
(the L1/L2/L3 convention): for the query intent 'space', a doc is relevant iff it's sci.space.
Computes — exactly — Recall@k, Precision@k, MRR, MAP (= AP for one query), and DCG/IDCG/nDCG,
plus a deliberately 'gamed' ranking (popularity-first) whose nDCG collapses — the Goodhart beat.

Output: data/l4-metrics.json. Run:  python3 _research/gen_l4.py  (needs gen_l3.py output)
"""
import json, math, pathlib, random

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
INTENT_CAT = "sci.space"   # query intent: 'space' → relevant = sci.space docs
KS = [1, 3, 5, 8]

try:
    from scipy import stats as _scipy_stats
    HAVE_SCIPY = True
except Exception:                                       # pragma: no cover - environment caveat
    HAVE_SCIPY = False

def dcg(rels):  # rels in rank order (gain per position), 1-based discount
    return sum(g / math.log2(i + 2) for i, g in enumerate(rels))

def dcg_exp(rels):  # exponential gain 2^rel - 1
    return sum((2 ** g - 1) / math.log2(i + 2) for i, g in enumerate(rels))

def ndcg_at(rels, gain="linear"):
    f = dcg_exp if gain == "exp" else dcg
    ideal = f(sorted(rels, reverse=True))
    return (f(rels) / ideal) if ideal else 0.0

def ap_from_rels(rels):  # binary AP from a ranked 0/1 list
    R = sum(1 for r in rels if r)
    if not R:
        return 0.0
    hits, s = 0, 0.0
    for i, r in enumerate(rels):
        if r:
            hits += 1
            s += hits / (i + 1)
    return s / R

def rr_from_rels(rels):
    for i, r in enumerate(rels):
        if r:
            return 1.0 / (i + 1)
    return 0.0

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

    # ══ NEW (deepening): graded relevance with exponential vs linear gain ════════════════════════════
    # Assign graded gains 0/1/3 to the running BM25 ranking: sci.space docs split into highly-relevant
    # (the strongest hits — those with tf(space)≥2 → D2,D3) =3 vs marginally relevant =1; off-topic =0.
    bm_by_id = {d["id"]: d for d in bm["docs"]}
    def space_tf(did):
        for t in bm_by_id[did]["terms"]:
            if t["t"] == "space":
                return t["tf"]
        return 0
    def grade(did):
        d = bm_by_id[did]
        if d["cat"] != INTENT_CAT:
            return 0
        return 3 if space_tf(did) >= 2 else 1      # strong space hit → grade 3, else marginal → 1
    graded_ranked = [{"id": r["id"], "cat": r["cat"], "rank": r["rank"], "grade": grade(r["id"])}
                     for r in ranked]
    g_rels = [r["grade"] for r in graded_ranked]
    ideal_g = sorted(g_rels, reverse=True)
    g_dcg_lin, g_idcg_lin = dcg(g_rels), dcg(ideal_g)
    g_dcg_exp, g_idcg_exp = dcg_exp(g_rels), dcg_exp(ideal_g)
    graded_out = {
        "_doc": "Graded relevance for the L4 running example. Gains 0/1/3: sci.space docs with tf(space)≥2 "
                "(strong hits) → grade 3, other sci.space → grade 1, off-topic → 0. nDCG with BOTH the "
                "exponential gain (2^rel−1) and the linear gain, with DCG/IDCG for each.",
        "_source": "_research/gen_l4.py · reads data/l3-bm25.json · grades from 20NG category + tf(space)",
        "gradeScale": {"0": "off-topic", "1": "marginally relevant", "3": "highly relevant"},
        "ranked": graded_ranked, "gainsInRankOrder": g_rels, "idealGains": ideal_g,
        "linear": {"dcg": round(g_dcg_lin, 4), "idcg": round(g_idcg_lin, 4),
                   "ndcg": round(g_dcg_lin / g_idcg_lin, 4) if g_idcg_lin else 0.0},
        "exponential": {"gainFormula": "2^rel - 1", "dcg": round(g_dcg_exp, 4), "idcg": round(g_idcg_exp, 4),
                        "ndcg": round(g_dcg_exp / g_idcg_exp, 4) if g_idcg_exp else 0.0},
        "perPosition": [
            {"rank": r["rank"], "grade": r["grade"],
             "discount": round(1 / math.log2(r["rank"] + 1), 4),
             "linGain": r["grade"], "expGain": 2 ** r["grade"] - 1,
             "linContrib": round(r["grade"] / math.log2(r["rank"] + 1), 4),
             "expContrib": round((2 ** r["grade"] - 1) / math.log2(r["rank"] + 1), 4)}
            for r in graded_ranked],
    }
    (DATA / "l4-graded.json").write_text(json.dumps(graded_out, indent=2, ensure_ascii=False) + "\n")

    # ══ NEW: a SECOND query so MRR≠RR and MAP≠AP are demonstrated ════════════════════════════════════
    # Query 1 = the existing running BM25 ranking (rel pattern below). Query 2 = a different pattern
    # where the first relevant doc sits at rank 1 (so RR2=1.0) and relevants cluster differently.
    q1_rels = rels_ranked                                  # [0,1,0,1,0,1,0,1] from l3 BM25 ranking
    q2_rels = [1, 0, 1, 1, 0, 0, 1, 0]                     # synthetic 2nd query: top hit + early cluster
    def pr_at(rels, k):
        topk = rels[:k]
        Rtot = sum(rels)
        return {"p": round(sum(topk) / k, 4), "r": round(sum(topk) / Rtot, 4) if Rtot else 0.0}
    q1 = {"rels": q1_rels, "rr": round(rr_from_rels(q1_rels), 4), "ap": round(ap_from_rels(q1_rels), 4),
          "atK": {str(k): pr_at(q1_rels, k) for k in KS}}
    q2 = {"rels": q2_rels, "rr": round(rr_from_rels(q2_rels), 4), "ap": round(ap_from_rels(q2_rels), 4),
          "atK": {str(k): pr_at(q2_rels, k) for k in KS}}
    mrr2 = round((q1["rr"] + q2["rr"]) / 2, 4)
    map2 = round((q1["ap"] + q2["ap"]) / 2, 4)
    multi_out = {
        "_doc": "Two-query example so MRR≠RR and MAP≠AP are actually demonstrated. Q1 = the L3 BM25 "
                "ranking's relevance pattern; Q2 = a second query with a different pattern (top hit at "
                "rank 1). MRR/MAP are the means over the two queries.",
        "_source": "_research/gen_l4.py · Q1 from l3-bm25.json relevance, Q2 synthetic deterministic",
        "ks": KS, "q1": q1, "q2": q2, "mrr": mrr2, "map": map2,
        "note": f"RR1={q1['rr']}, RR2={q2['rr']} → MRR={mrr2} (≠ either RR); "
                f"AP1={q1['ap']}, AP2={q2['ap']} → MAP={map2} (≠ either AP).",
    }

    # ══ NEW: two systems A vs B across many queries → significance tests ══════════════════════════════
    # Deterministic synthetic per-query nDCG@10: System B (e.g. tuned BM25) modestly beats System A
    # (baseline) on most queries with realistic per-query variance. Fixed seed → reproducible.
    rng = random.Random(20260605)
    NQ = 15
    sysA, sysB = [], []
    for _ in range(NQ):
        base = rng.gauss(0.55, 0.12)                       # per-query difficulty
        a = min(0.99, max(0.05, base + rng.gauss(0.0, 0.05)))
        b = min(0.99, max(0.05, base + 0.04 + rng.gauss(0.0, 0.05)))   # B has a small true edge
        sysA.append(round(a, 4))
        sysB.append(round(b, 4))
    diffs = [round(b - a, 4) for a, b in zip(sysA, sysB)]
    meanA, meanB = sum(sysA) / NQ, sum(sysB) / NQ
    mean_diff = sum(diffs) / NQ
    sd_diff = (sum((d - mean_diff) ** 2 for d in diffs) / (NQ - 1)) ** 0.5
    se_diff = sd_diff / NQ ** 0.5

    # paired t-test
    t_stat = mean_diff / se_diff if se_diff else 0.0
    # Wilcoxon signed-rank (manual fallback) and scipy
    if HAVE_SCIPY:
        tt = _scipy_stats.ttest_rel(sysB, sysA)
        t_stat_sp, t_p = float(tt.statistic), float(tt.pvalue)
        try:
            ww = _scipy_stats.wilcoxon(sysB, sysA)
            w_stat, w_p = float(ww.statistic), float(ww.pvalue)
        except Exception:
            w_stat, w_p = None, None
        t95 = _scipy_stats.t.ppf(0.975, NQ - 1)
    else:                                                  # pragma: no cover - environment caveat
        t_stat_sp, t_p = t_stat, None
        w_stat, w_p = None, None
        t95 = 2.145                                        # t_{0.975, df=14} approx
    ci_lo, ci_hi = mean_diff - t95 * se_diff, mean_diff + t95 * se_diff

    # manual Wilcoxon signed-rank (so the number exists even without scipy)
    nz = [d for d in diffs if d != 0]
    order = sorted(range(len(nz)), key=lambda i: abs(nz[i]))
    ranks = [0.0] * len(nz)
    i = 0
    while i < len(nz):
        j = i
        while j + 1 < len(nz) and abs(nz[order[j + 1]]) == abs(nz[order[i]]):
            j += 1
        avg_rank = (i + 1 + j + 1) / 2
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1
    w_plus = sum(r for d, r in zip(nz, ranks) if d > 0)
    w_minus = sum(r for d, r in zip(nz, ranks) if d < 0)
    w_manual = min(w_plus, w_minus)

    # randomization / permutation test on paired diffs (sign-flip), exact over 2^NQ
    obs = abs(mean_diff)
    count_ge, total = 0, 0
    for mask in range(1 << NQ):
        s = 0.0
        for k in range(NQ):
            s += diffs[k] if (mask >> k) & 1 else -diffs[k]
        if abs(s / NQ) >= obs - 1e-12:
            count_ge += 1
        total += 1
    perm_p = count_ge / total

    systems_out = {
        "_doc": "Two retrieval systems' per-query nDCG@10 over 15 queries (deterministic synthetic, "
                "seed=20260605; System B = a tuned BM25 with a small true edge over baseline A). "
                "Significance: paired t-test, Wilcoxon signed-rank, exact sign-flip permutation test, "
                "plus mean diff and 95% CI. Computed with scipy where available; Wilcoxon W and the "
                "permutation p are also implemented manually (independent of scipy).",
        "_source": "_research/gen_l4.py · synthetic per-query nDCG, seed=20260605",
        "scipyAvailable": HAVE_SCIPY,
        "nQueries": NQ, "systemA": sysA, "systemB": sysB, "perQueryDiff": diffs,
        "meanA": round(meanA, 4), "meanB": round(meanB, 4), "meanDiff": round(mean_diff, 4),
        "sdDiff": round(sd_diff, 4), "seDiff": round(se_diff, 4),
        "ci95": [round(ci_lo, 4), round(ci_hi, 4)],
        "pairedTTest": {"t": round(t_stat_sp, 4), "df": NQ - 1,
                        "p": round(t_p, 5) if t_p is not None else None,
                        "tManual": round(t_stat, 4)},
        "wilcoxon": {"W": round(w_stat, 4) if w_stat is not None else round(w_manual, 4),
                     "Wmanual": round(w_manual, 4), "Wplus": round(w_plus, 4), "Wminus": round(w_minus, 4),
                     "p": round(w_p, 5) if w_p is not None else None},
        "permutation": {"method": "exact sign-flip over 2^15", "p": round(perm_p, 5),
                        "permutations": total},
    }
    (DATA / "l4-systems.json").write_text(json.dumps(systems_out, indent=2, ensure_ascii=False) + "\n")

    # ══ NEW: online evaluation — A/B z-test, team-draft interleaving, position-bias curve ════════════
    # A/B test: control vs treatment CTR with sample sizes → two-proportion z-test.
    ab_n_c, ab_clk_c = 10000, 1200        # control: 12.00% CTR
    ab_n_t, ab_clk_t = 10000, 1320        # treatment: 13.20% CTR
    p_c, p_t = ab_clk_c / ab_n_c, ab_clk_t / ab_n_t
    p_pool = (ab_clk_c + ab_clk_t) / (ab_n_c + ab_n_t)
    se_ab = (p_pool * (1 - p_pool) * (1 / ab_n_c + 1 / ab_n_t)) ** 0.5
    z = (p_t - p_c) / se_ab if se_ab else 0.0
    if HAVE_SCIPY:
        ab_p = float(2 * (1 - _scipy_stats.norm.cdf(abs(z))))
    else:                                  # pragma: no cover
        # erfc fallback for two-sided normal p
        ab_p = math.erfc(abs(z) / math.sqrt(2))
    lift_abs = p_t - p_c
    lift_rel = (p_t - p_c) / p_c

    # Team-draft interleaving: per-query credit to A vs B over a few queries (deterministic).
    # Each query: an interleaved list is shown; clicks credited to the system that contributed the
    # clicked doc. Here a small worked example with explicit credits summed over queries.
    il_queries = [
        {"q": "q1", "creditA": 2, "creditB": 4},
        {"q": "q2", "creditA": 1, "creditB": 3},
        {"q": "q3", "creditA": 3, "creditB": 2},
        {"q": "q4", "creditA": 1, "creditB": 5},
        {"q": "q5", "creditA": 2, "creditB": 3},
    ]
    il_A = sum(q["creditA"] for q in il_queries)
    il_B = sum(q["creditB"] for q in il_queries)
    il_winsB = sum(1 for q in il_queries if q["creditB"] > q["creditA"])
    il_pref_B = il_B / (il_A + il_B)

    # Position-bias / examination-probability curve: P(examine | rank). Geometric decay γ^(rank-1),
    # reusing the L1 click-model γ if present, else γ=0.85.
    try:
        gamma = json.load(open(DATA / "l1-click-model.json"))["gamma"]
    except Exception:
        gamma = 0.85
    exam_ranks = list(range(1, 11))
    exam_prob = [round(gamma ** (k - 1), 4) for k in exam_ranks]

    online_out = {
        "_doc": "Online evaluation numbers for L4: (a) an A/B test (control vs treatment CTR with sample "
                "sizes + two-proportion z-test and p-value); (b) a team-draft interleaving worked example "
                "(per-query credit to A vs B); (c) a position-bias / examination-probability curve P(exam|rank) "
                "= γ^(rank−1), γ reused from l1-click-model.json.",
        "_source": "_research/gen_l4.py · A/B and interleaving are illustrative synthetic counts; "
                   "γ reused from data/l1-click-model.json",
        "abTest": {
            "control": {"n": ab_n_c, "clicks": ab_clk_c, "ctr": round(p_c, 4)},
            "treatment": {"n": ab_n_t, "clicks": ab_clk_t, "ctr": round(p_t, 4)},
            "pooledCtr": round(p_pool, 4), "se": round(se_ab, 5), "z": round(z, 4),
            "p": round(ab_p, 5), "absoluteLift": round(lift_abs, 4),
            "relativeLiftPct": round(lift_rel * 100, 2),
            "significant05": bool(ab_p < 0.05),
        },
        "interleaving": {
            "method": "team-draft", "queries": il_queries,
            "totalCreditA": il_A, "totalCreditB": il_B,
            "queriesPreferringB": il_winsB, "nQueries": len(il_queries),
            "preferenceForB": round(il_pref_B, 4),
            "note": "B wins the interleaving preference — far more sensitive than A/B at equal traffic.",
        },
        "positionBias": {
            "model": "geometric examination P(exam|rank)=γ^(rank-1)", "gamma": gamma,
            "ranks": exam_ranks, "examProb": exam_prob,
        },
    }
    (DATA / "l4-online.json").write_text(json.dumps(online_out, indent=2, ensure_ascii=False) + "\n")

    # also fold the 2nd-query MRR/MAP block into a small companion file (keeps l4-metrics.json intact)
    (DATA / "l4-multiquery.json").write_text(json.dumps(multi_out, indent=2, ensure_ascii=False) + "\n")

    print(f"[gen_l4] R={R}/{n} ranked-rel={rels_ranked}")
    print(f"[gen_l4] Recall@5={recall[5]} P@5={precision[5]} MRR={rr} MAP={ap} nDCG={ndcg} (gamed nDCG={gamed_ndcg})")
    print(f"[gen_l4] graded: linear nDCG={graded_out['linear']['ndcg']} exp nDCG={graded_out['exponential']['ndcg']} gains={g_rels}")
    print(f"[gen_l4] multi-query: RR1={q1['rr']} RR2={q2['rr']} MRR={mrr2} | AP1={q1['ap']} AP2={q2['ap']} MAP={map2}")
    print(f"[gen_l4] A vs B: meanA={meanA:.4f} meanB={meanB:.4f} Δ={mean_diff:.4f} CI95=[{ci_lo:.4f},{ci_hi:.4f}]")
    print(f"[gen_l4] sig: t={t_stat_sp:.4f} p={t_p} | Wilcoxon W={w_manual} p={w_p} | perm p={perm_p:.5f} (scipy={HAVE_SCIPY})")
    print(f"[gen_l4] A/B: CTR {p_c:.4f}->{p_t:.4f} z={z:.4f} p={ab_p:.5f} relLift={lift_rel*100:.2f}%")
    print("[gen_l4] wrote l4-metrics + l4-graded/-multiquery/-systems/-online")

if __name__ == "__main__":
    main()
