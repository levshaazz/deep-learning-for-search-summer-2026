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
from genlib import write_json
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
    write_json(DATA / "l4-metrics.json", out)

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

    # ── NEW (от-и-до): per-term EXPONENTIAL-gain DCG/IDCG contributions + IDCG term sums ─────────────
    # Exponential gain 2^rel-1: gains-in-rank-order [0,7,0,7,0,1,0,1]; ideal exp gains [7,7,1,1,0,0,0,0].
    def exp_terms(gains):
        out, total = [], 0.0
        for i, g in enumerate(gains):
            rank = i + 1
            eg = 2 ** g - 1
            disc = 1 / math.log2(rank + 1)
            contrib = eg * disc
            total += contrib
            out.append({"rank": rank, "grade": g, "expGain": eg,
                        "discount": round(disc, 4), "contrib": round(contrib, 4)})
        return out, round(total, 4)
    exp_dcg_terms, exp_dcg_sum = exp_terms(g_rels)
    exp_idcg_terms, exp_idcg_sum = exp_terms(ideal_g)
    # Linear IDCG term sum for the ideal order [3,3,1,1,0,0,0,0] → surfaces rank-1 discount 1/log2(2)=1.
    lin_idcg_terms, lin_idcg_total = [], 0.0
    for i, g in enumerate(ideal_g):
        rank = i + 1
        disc = 1 / math.log2(rank + 1)
        contrib = g * disc
        lin_idcg_total += contrib
        lin_idcg_terms.append({"rank": rank, "grade": g, "discount": round(disc, 4),
                               "contrib": round(contrib, 4)})
    lin_idcg_nonzero = [t for t in lin_idcg_terms if t["grade"]]
    lin_idcg_expr = " + ".join(f"{t['grade']}·{t['discount']:.4f}" for t in lin_idcg_nonzero) \
                    + f" = {lin_idcg_total:.4f}"
    exp_dcg_nonzero = [t for t in exp_dcg_terms if t["expGain"]]
    exp_dcg_expr = " + ".join(f"{t['expGain']}·{t['discount']:.4f}" for t in exp_dcg_nonzero) \
                   + f" = {exp_dcg_sum:.4f}"
    exp_idcg_nonzero = [t for t in exp_idcg_terms if t["expGain"]]
    exp_idcg_expr = " + ".join(f"{t['expGain']}·{t['discount']:.4f}" for t in exp_idcg_nonzero) \
                    + f" = {exp_idcg_sum:.4f}"

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
        "expContributions": {
            "gainsInRankOrder": [2 ** g - 1 for g in g_rels],
            "dcgTerms": exp_dcg_terms, "dcgSum": exp_dcg_sum, "dcgExpr": exp_dcg_expr,
            "idealExpGains": [2 ** g - 1 for g in ideal_g],
            "idcgTerms": exp_idcg_terms, "idcgSum": exp_idcg_sum, "idcgExpr": exp_idcg_expr,
        },
        "linearIdcgTerms": {
            "idealGains": ideal_g, "terms": lin_idcg_terms,
            "sum": round(lin_idcg_total, 4), "expr": lin_idcg_expr,
            "note": "rank-1 discount 1/log2(2)=1; ideal front-loads grades 3,3,1,1.",
        },
    }
    write_json(DATA / "l4-graded.json", graded_out)

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
    # ── NEW (от-и-до): AP₂ per-hit precisions — P@(rank) at each relevant rank, then averaged over R ─
    def ap_hit_terms(rels):
        R = sum(rels)
        hits, terms = 0, []
        for i, r in enumerate(rels):
            if r:
                hits += 1
                rank = i + 1
                p = hits / rank
                terms.append({"rank": rank, "hitNumber": hits,
                              "precision": round(p, 4),
                              "expr": f"P@{rank}={hits}/{rank}={p:.4f}"})
        return R, terms
    q2_R, q2_hit_terms = ap_hit_terms(q2_rels)
    q2_ap_sum = sum(t["precision"] for t in q2_hit_terms)
    q2["apHitPrecisions"] = q2_hit_terms
    q2["apExpr"] = ("(" + " + ".join(f"{t['precision']:.4f}" for t in q2_hit_terms)
                    + f") / {q2_R} = {q2['ap']:.4f}")
    q2["apSumNumerator"] = round(q2_ap_sum, 4)
    q2["relevantTotal"] = q2_R
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

    # ── NEW (от-и-до): full Wilcoxon signed-rank table — each |Δ|, its rank, its sign ───────────────
    # Built from the non-zero diffs nz (zeros are dropped before ranking; here all 15 diffs are non-zero).
    wilcoxon_table = []
    for d, rk in sorted(zip(nz, ranks), key=lambda x: abs(x[0])):
        wilcoxon_table.append({"diff": round(d, 4), "absDiff": round(abs(d), 4),
                               "rank": round(rk, 1), "sign": "+" if d > 0 else "-"})
    n_pos = sum(1 for d in nz if d > 0)
    n_neg = sum(1 for d in nz if d < 0)

    # ── NEW (от-и-до): CI half-width pieces — t-crit (table lookup) · SE = sd/√n ─────────────────────
    ci_se = sd_diff / NQ ** 0.5
    ci_half = t95 * ci_se

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
        "wilcoxonTable": {
            "_doc": "Each non-zero per-query diff |Δ| ranked ascending, its signed-rank and sign; "
                    "W+ = sum of positive ranks, W- = sum of negative ranks, W = min(W+,W-).",
            "nNonZero": len(nz), "nPositive": n_pos, "nNegative": n_neg,
            "rows": wilcoxon_table,
            "Wplus": round(w_plus, 1), "Wminus": round(w_minus, 1),
            "W": round(w_manual, 1),
            "expr": f"W+ = {w_plus:.0f}, W- = {w_minus:.0f} → W = min(W+,W-) = {w_manual:.0f}",
        },
        "ciHalfWidth": {
            "_doc": "95% CI half-width = t_crit · SE, SE = sd/√n. t_crit is a t-table lookup (df=14).",
            "tCrit": round(t95, 3), "tCritSource": "t_{0.975, df=14} table lookup",
            "sd": round(sd_diff, 4), "n": NQ, "sqrtN": round(NQ ** 0.5, 4),
            "se": round(ci_se, 5),
            "seExpr": f"{sd_diff:.4f}/√{NQ} = {sd_diff:.4f}/{NQ**0.5:.4f} = {ci_se:.5f}",
            "halfWidth": round(ci_half, 4),
            "halfWidthExpr": f"{t95:.3f}·{ci_se:.5f} = {ci_half:.4f}",
            "meanDiff": round(mean_diff, 4),
            "interval": [round(mean_diff - ci_half, 4), round(mean_diff + ci_half, 4)],
            "intervalExpr": f"{mean_diff:.4f} ± {ci_half:.4f} = "
                            f"[{mean_diff - ci_half:.4f}, {mean_diff + ci_half:.4f}]",
        },
    }
    write_json(DATA / "l4-systems.json", systems_out)

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

    # ── NEW (от-и-до): pooled-proportion and SE substitution for the two-proportion z-test ──────────
    ab_pooled_expr = (f"({ab_clk_c}+{ab_clk_t})/({ab_n_c}+{ab_n_t}) = "
                      f"{ab_clk_c + ab_clk_t}/{ab_n_c + ab_n_t} = {p_pool:.3f}")
    ab_se_expr = (f"√({p_pool:.3f}·{1 - p_pool:.3f}·(1/{ab_n_c}+1/{ab_n_t})) = {se_ab:.5f}")
    ab_z_expr = f"({p_t:.3f}−{p_c:.3f})/{se_ab:.5f} = {z:.4f}"

    # ── NEW (от-и-до): ONE concrete team-draft interleaving worked query (consistent with q1: A=2,B=4) ─
    # Inputs: ranking A=[a1..a4], B=[b1..b4]. Canonical team-draft: each ROUND a coin picks who drafts
    # first, then BOTH teams take their top remaining doc — so an even-length list splits evenly (3/3 here).
    # B wins not via more slots but via more CLICKS: its 3 slots are all clicked, A's get 2 → A=2, B=3.
    il_A_in = ["a1", "a2", "a3", "a4"]
    il_B_in = ["b1", "b2", "b3", "b4"]
    # Draft order (per-slot source after team-draft coin flips, no duplicates):
    il_draft = [
        {"slot": 1, "doc": "b1", "source": "B"},
        {"slot": 2, "doc": "a1", "source": "A"},
        {"slot": 3, "doc": "b2", "source": "B"},
        {"slot": 4, "doc": "a2", "source": "A"},
        {"slot": 5, "doc": "b3", "source": "B"},
        {"slot": 6, "doc": "a3", "source": "A"},
    ]
    # Clicked slots: B's three (1,3,5) all clicked + two of A's (2,6); slot 4 (a2) not clicked → A=2, B=3.
    il_clicked_slots = [1, 2, 3, 5, 6]      # slot 4 (a2) skipped
    il_credit_A = sum(1 for s in il_draft if s["slot"] in il_clicked_slots and s["source"] == "A")
    il_credit_B = sum(1 for s in il_draft if s["slot"] in il_clicked_slots and s["source"] == "B")

    # Team-draft interleaving: per-query credit to A vs B over a few queries (deterministic).
    # Each query: an interleaved list is shown; clicks credited to the system that contributed the
    # clicked doc. Here a small worked example with explicit credits summed over queries.
    il_queries = [
        {"q": "q1", "creditA": 2, "creditB": 3},
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
            "steps": {
                "_doc": "Substituted pieces for the two-proportion z-test (pooled p̄, SE, z).",
                "pPooled": round(p_pool, 3), "pPooledExpr": ab_pooled_expr,
                "se": round(se_ab, 5), "seExpr": ab_se_expr,
                "z": round(z, 4), "zExpr": ab_z_expr,
                "pSource": "z→p is a standard-normal table lookup (two-sided).",
            },
        },
        "interleaving": {
            "method": "team-draft", "queries": il_queries,
            "totalCreditA": il_A, "totalCreditB": il_B,
            "queriesPreferringB": il_winsB, "nQueries": len(il_queries),
            "preferenceForB": round(il_pref_B, 4),
            "note": "B wins the interleaving preference — far more sensitive than A/B at equal traffic.",
            "interleaveWorkedQuery": {
                "_doc": "ONE concrete team-draft worked query (consistent with q1 above: A=2, B=3). "
                        "Two input rankings, the interleaved draft order with per-slot source tags, the "
                        "clicked positions, and the resulting per-team credit.",
                "q": "q1",
                "rankingA": il_A_in, "rankingB": il_B_in,
                "draft": il_draft,
                "draftOrder": [s["doc"] for s in il_draft],
                "sourceTags": [s["source"] for s in il_draft],
                "clickedSlots": il_clicked_slots,
                "clickedDocs": [s["doc"] for s in il_draft if s["slot"] in il_clicked_slots],
                "creditA": il_credit_A, "creditB": il_credit_B,
                "creditExpr": f"clicks on A-sourced slots = {il_credit_A}; on B-sourced slots = {il_credit_B}",
            },
        },
        "positionBias": {
            "model": "geometric examination P(exam|rank)=γ^(rank-1)", "gamma": gamma,
            "ranks": exam_ranks, "examProb": exam_prob,
        },
    }
    write_json(DATA / "l4-online.json", online_out)

    # also fold the 2nd-query MRR/MAP block into a small companion file (keeps l4-metrics.json intact)
    write_json(DATA / "l4-multiquery.json", multi_out)

    # ══ NEW (от-и-до): Goodhart gamed vs honest BINARY DCG terms, fully reproducible ═════════════════
    # Both rankings scored with BINARY relevance (sci.space = relevant). The gamed (popularity-first)
    # order pushes all non-relevant docs to the top → nDCG collapses to 0.5434; the honest BM25 order
    # gives 0.6766. Emit per-rank gain·discount terms + the shared binary IDCG so both are checkable.
    def binary_dcg_terms(ids):
        terms, total = [], 0.0
        for i, did in enumerate(ids):
            rank = i + 1
            rel = 1 if by_id[did]["cat"] == INTENT_CAT else 0
            disc = 1 / math.log2(rank + 1)
            contrib = rel * disc
            total += contrib
            terms.append({"rank": rank, "id": did, "rel": rel,
                          "discount": round(disc, 4), "contrib": round(contrib, 4)})
        return terms, round(total, 4)
    honest_order = bm["bm25Ranking"]                             # the honest BM25 ranking (top-level)
    gamed_terms, gamed_dcg = binary_dcg_terms(gamed_order)
    honest_terms, honest_dcg = binary_dcg_terms(honest_order)
    bin_idcg = round(IDCG, 4)                                     # ideal: all 4 relevant first
    bin_idcg_terms, _ = binary_dcg_terms([r["id"] for r in
                                          sorted(ranked, key=lambda r: (-r["rel"], r["rank"]))])
    def nonzero_expr(terms, total):
        nz = [t for t in terms if t["rel"]]
        return " + ".join(f"{t['discount']:.4f}" for t in nz) + f" = {total:.4f}"
    goodhart_out = {
        "_doc": "Goodhart worked example — BINARY-gain DCG terms for the gamed (popularity-first) order "
                "[D6,D7,D5,D4,D3,D2,D0,D1] vs the honest BM25 order [D6,D3,D7,D2,D5,D0,D4,D1]. Relevance "
                "= sci.space (4 relevant: D0,D1,D2,D3). Shared binary IDCG = ideal order (all 4 relevant "
                "first). gamed nDCG=0.5434, honest nDCG=0.6766 — both reproducible from these terms.",
        "_source": "_research/gen_l4.py · reads data/l3-bm25.json · binary relevance from 20NG categories",
        "intent": INTENT_CAT, "relevantTotal": R,
        "idcg": bin_idcg, "idcgTerms": bin_idcg_terms,
        "idcgExpr": nonzero_expr(bin_idcg_terms, bin_idcg),
        "gamed": {
            "order": gamed_order, "terms": gamed_terms,
            "dcg": gamed_dcg, "dcgExpr": nonzero_expr(gamed_terms, gamed_dcg),
            "ndcg": round(gamed_dcg / bin_idcg, 4) if bin_idcg else 0.0,
            "ndcgExpr": f"{gamed_dcg:.4f}/{bin_idcg:.4f} = {round(gamed_dcg / bin_idcg, 4)}",
        },
        "honest": {
            "order": honest_order, "terms": honest_terms,
            "dcg": honest_dcg, "dcgExpr": nonzero_expr(honest_terms, honest_dcg),
            "ndcg": round(honest_dcg / bin_idcg, 4) if bin_idcg else 0.0,
            "ndcgExpr": f"{honest_dcg:.4f}/{bin_idcg:.4f} = {round(honest_dcg / bin_idcg, 4)}",
        },
        "note": "Both are BINARY-gain nDCG. The graded-gain nDCG of the honest order (0.6622, "
                "l4-graded.json) differs because it uses 0/1/3 grades, not 0/1.",
    }
    write_json(DATA / "l4-goodhart-steps.json", goodhart_out)

    print(f"[gen_l4] R={R}/{n} ranked-rel={rels_ranked}")
    print(f"[gen_l4] Recall@5={recall[5]} P@5={precision[5]} MRR={rr} MAP={ap} nDCG={ndcg} (gamed nDCG={gamed_ndcg})")
    print(f"[gen_l4] graded: linear nDCG={graded_out['linear']['ndcg']} exp nDCG={graded_out['exponential']['ndcg']} gains={g_rels}")
    print(f"[gen_l4] multi-query: RR1={q1['rr']} RR2={q2['rr']} MRR={mrr2} | AP1={q1['ap']} AP2={q2['ap']} MAP={map2}")
    print(f"[gen_l4] A vs B: meanA={meanA:.4f} meanB={meanB:.4f} Δ={mean_diff:.4f} CI95=[{ci_lo:.4f},{ci_hi:.4f}]")
    print(f"[gen_l4] sig: t={t_stat_sp:.4f} p={t_p} | Wilcoxon W={w_manual} p={w_p} | perm p={perm_p:.5f} (scipy={HAVE_SCIPY})")
    print(f"[gen_l4] A/B: CTR {p_c:.4f}->{p_t:.4f} z={z:.4f} p={ab_p:.5f} relLift={lift_rel*100:.2f}%")
    print(f"[gen_l4] AP2 hits: {[t['expr'] for t in q2_hit_terms]} → AP2={q2['ap']}")
    print(f"[gen_l4] exp DCG sum={exp_dcg_sum} exp IDCG sum={exp_idcg_sum} | lin IDCG sum={round(lin_idcg_total,4)}")
    print(f"[gen_l4] Wilcoxon: W+={w_plus:.0f} W-={w_minus:.0f} W={w_manual:.0f} | CI half-width={round(ci_half,4)} (t={t95:.3f} se={ci_se:.5f})")
    print(f"[gen_l4] A/B pooled p̄={p_pool:.3f} SE={se_ab:.5f} z={z:.4f} | interleave q1: A={il_credit_A} B={il_credit_B}")
    print(f"[gen_l4] Goodhart: gamed DCG={gamed_dcg} nDCG={round(gamed_dcg/bin_idcg,4)} | honest DCG={honest_dcg} nDCG={round(honest_dcg/bin_idcg,4)} (IDCG={bin_idcg})")
    print("[gen_l4] wrote l4-metrics + l4-graded/-multiquery/-systems/-online")
    print("[gen_l4] wrote NEW steps: l4-goodhart-steps")

if __name__ == "__main__":
    main()
