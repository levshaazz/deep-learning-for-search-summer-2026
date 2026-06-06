#!/usr/bin/env python3
"""
check_claims.py — facts-gate (AUDIT_V2 §1.1 claims-ledger + §1.2 arithmetic) upgraded to the
SITE_ARCHITECTURE G1 'shared-data' contract.

The single source of grounded numbers is the curated product layer `data/l*-*.json` (co-located
with data/course.json; read by the decks, the Book, and the widgets). This gate enforces the whole
chain so a number cannot drift at any hop:

  [P] PROVENANCE :  curated data/l*-*.json  ==  generator output _research/data/*.json   (HARD)
  [C] CLAIMS     :  what a DECK displays     ==  curated data/l*-*.json                   (HARD)
  [A] ARITHMETIC :  recompute cos/Euclid & every displayed a·b/(c·d)  ==  result          (HARD)

So `data/` is THE source; [P] proves it matches the upstream generator, [C] proves the decks match
`data/`. When the Book lands, add its built HTML to `texts` and the same [C]/[A] checks cover it.

Usage:  python3 _research/check_claims.py            (check decks against data/)
        python3 _research/check_claims.py --selftest  (known-bad fixtures must flag, §2.4)
"""
from __future__ import annotations
import json, re, sys, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"               # curated product source of truth
RAW  = ROOT / "_research/data"     # generator artifacts (upstream provenance)
DECKS = {
    "L0": ROOT / "Lectures/00-introduction.html",
    "L1": ROOT / "Lectures/01-search-ir-ml-system-design.html",
    "L2": ROOT / "Lectures/02-nlp-tokenization-similarity.html",
    "L3": ROOT / "Lectures/03-classical-ir-fulltext-fusion.html",
    "L4": ROOT / "Lectures/04-ranking-metrics.html",
}

def load(base, name):
    return json.load(open(base / name))

def num(s):  # parse a displayed number: U+2212 minus, thousands spaces/commas, trailing dot
    s = s.replace("−", "-").replace(",", "").replace(" ", "")
    s = re.sub(r"\.+$", "", s)
    return float(s)

# Curated product data (the single source). Loaded once.
COS  = load(DATA, "l2-cosine.json")
CORP = load(DATA, "l2-corpus-stats.json")
CLICK = load(DATA, "l1-click-model.json")
def primary_pair():
    return next(p for p in COS["pairs"] if p["id"] == COS["primary"])

# ── L3 (classical IR) and L4 (ranking metrics): the two biggest decks. Same single source: data/. ──
CATDOG       = load(DATA, "l3-bm25-catdog.json")        # flagship cat/dog BM25 (final idf, B, scores)
CATDOG_STEPS = load(DATA, "l3-bm25-catdog-steps.json")  # intermediate B-factors / docSums
Q2           = load(DATA, "l3-bm25-q2.json")            # nasa/shuttle distinct-idf query
Q2_STEPS     = load(DATA, "l3-bm25-q2-steps.json")      # nasa/shuttle idf + winning-doc B-factors
PAGERANK     = load(DATA, "l3-pagerank.json")           # power-iteration converged vector + worked B-update
COMPRESS     = load(DATA, "l3-compression.json")        # postings gaps + varbyte bytes
BENCH        = load(DATA, "l3-benchmarks.json")         # cited MS MARCO / BEIR baselines
RRF          = load(DATA, "l3-rrf.json")                # reciprocal-rank fusion, k=60
METRICS      = load(DATA, "l4-metrics.json")            # binary nDCG (honest 0.6766) + gamed 0.5434
GRADED       = load(DATA, "l4-graded.json")             # graded nDCG linear/exponential
MULTIQ       = load(DATA, "l4-multiquery.json")         # two-query MRR / MAP
SYSTEMS      = load(DATA, "l4-systems.json")            # significance: t-test, Wilcoxon, permutation, CI
ONLINE       = load(DATA, "l4-online.json")             # A/B z-test + team-draft interleaving
GOODHART     = load(DATA, "l4-goodhart-steps.json")     # binary-gain DCG terms for honest vs gamed

# ── [P] PROVENANCE: curated data/ must equal the generator artifact it was lifted from ──────────
def provenance_checks(report):
    raw_heaps, raw_zipf, raw_pos, raw_cos = (load(RAW, "heaps_summary.json"), load(RAW, "zipf_summary.json"),
                                             load(RAW, "position_bias.json"), load(RAW, "cosine_examples.json"))
    rc = raw_cos["classic_pairs"][0]
    pp = primary_pair()
    checks = [
        ("heaps.beta",  CORP["heaps"]["beta"],          raw_heaps["beta"],   1e-9),
        ("vTypes",      CORP["vTypes"],                  raw_heaps["V_total"],0),
        ("heaps.r2",    CORP["heaps"]["r2"],             raw_heaps["r2"],     1e-9),
        ("zipf.slope",  CORP["zipf"]["loglogSlope"],     raw_zipf["loglog_slope_fit_top1000"], 1e-9),
        ("cos.cos",     pp["cos"],                       rc["cos"],           1e-9),
        ("cos.euclid",  pp["euclid"],                    rc["euclid"],        1e-5),
        ("click.gamma", CLICK["gamma"],                  raw_pos["gamma"],    1e-9),
        ("click.top1",  CLICK["top1Pct"],                raw_pos["top1_pct"], 1e-9),
        ("click.top3",  CLICK["top3Pct"],                raw_pos["top3_pct"], 1e-9),
    ]
    bad = 0
    for name, cur, raw, tol in checks:
        if abs(cur - raw) > tol:
            bad += 1
            report.append(("HARD", f"provenance({name}): data/ has {cur} but generator says {raw}"))
    if not bad:
        report.append(("OK", f"provenance: {len(checks)} curated values == generator artifacts ✓"))

# ── [P] PROVENANCE (L3/L4 self-consistency): the L3/L4 generators (gen_l3.py / gen_l4.py) emit the
#    curated data/ files directly, so there is no separate RAW artifact to diff against. Instead we
#    pin the cross-file invariants — the same flagship number lives in several data/ files (the
#    "-steps" companions, the goodhart/metrics overlap, the multiquery means), and they must agree.
#    A drift between two data/ files would otherwise let the deck cite a stale copy and still pass [C].
def provenance_l3l4(report):
    catdog   = {d["id"]: d for d in CATDOG["docs"]}
    cd_steps = {d["id"]: d for d in CATDOG_STEPS["docs"]}
    q2cells  = {(c["doc"], c["t"]): c for c in Q2_STEPS["cells"]}
    q2docs   = {d["id"]: d for d in Q2["docs"]}
    checks = [
        # cat/dog flagship: final idf and per-doc scores must equal the -steps companion's intermediates
        ("catdog.idf.cat", CATDOG["idf"]["cat"],        CATDOG_STEPS["idfSteps"]["cat"]["idf"], 1e-9),
        ("catdog.idf.dog", CATDOG["idf"]["dog"],        CATDOG_STEPS["idfSteps"]["dog"]["idf"], 1e-9),
        ("catdog.D1.sum",  catdog["D1"]["bm25Score"],   cd_steps["D1"]["docSum"],               1e-9),
        ("catdog.D2.sum",  catdog["D2"]["bm25Score"],   cd_steps["D2"]["docSum"],               1e-9),
        ("catdog.D3.sum",  catdog["D3"]["bm25Score"],   cd_steps["D3"]["docSum"],               1e-9),
        # nasa/shuttle: final idf + winning-doc score must match the -steps idf pieces / cell weights
        ("q2.idf.nasa",    Q2["idf"]["nasa"],           Q2_STEPS["idfSteps"]["nasa"]["idf"],    1e-9),
        ("q2.idf.shuttle", Q2["idf"]["shuttle"],        Q2_STEPS["idfSteps"]["shuttle"]["idf"], 1e-9),
        ("q2.D2.score",    q2docs["D2"]["bm25Score"],   Q2_STEPS["winningDoc"]["rowSum"],       1e-9),
        ("q2.D2.shuttleW", q2cells[("D2","shuttle")]["weight"], 1.9842,                         1e-9),
        # PageRank: the worked iteration-1 update for B equals iterations[1][B] = finalVector index
        ("pr.B.update",    PAGERANK["workedUpdate"]["pr1"], PAGERANK["iterations"][1][1],       1e-9),
        ("pr.finalB",      PAGERANK["final"]["B"],       PAGERANK["finalVector"][1],             1e-9),
        # binary nDCG: l4-metrics.json (honest/gamed) must equal the l4-goodhart-steps.json worked terms
        ("ndcg.honest",    METRICS["ndcg"],              GOODHART["honest"]["ndcg"],             1e-9),
        ("ndcg.gamed",     METRICS["gamed"]["ndcg"],     GOODHART["gamed"]["ndcg"],              1e-9),
        ("ndcg.idcg",      METRICS["idcg"],              GOODHART["idcg"],                       1e-9),
        # MRR/MAP: the published means must equal the mean of the two per-query values
        ("mrr.mean",       MULTIQ["mrr"],     round((MULTIQ["q1"]["rr"]+MULTIQ["q2"]["rr"])/2, 4), 1e-9),
        ("map.mean",       MULTIQ["map"],     round((MULTIQ["q1"]["ap"]+MULTIQ["q2"]["ap"])/2, 4), 1e-4),
        # significance: the CI endpoints must equal meanDiff ± (tCrit·SE) from the ciHalfWidth block
        ("ci.lo",  SYSTEMS["ci95"][0], round(SYSTEMS["meanDiff"]-SYSTEMS["ciHalfWidth"]["halfWidth"],4), 1e-4),
        ("ci.hi",  SYSTEMS["ci95"][1], round(SYSTEMS["meanDiff"]+SYSTEMS["ciHalfWidth"]["halfWidth"],4), 1e-4),
        # A/B: relative lift = absolute lift / control CTR
        ("ab.lift", ONLINE["abTest"]["relativeLiftPct"],
                    round(100*ONLINE["abTest"]["absoluteLift"]/ONLINE["abTest"]["control"]["ctr"], 1), 1e-6),
        # interleaving: per-query credits must sum to the published totals
        ("il.totalA", ONLINE["interleaving"]["totalCreditA"],
                      sum(q["creditA"] for q in ONLINE["interleaving"]["queries"]), 0),
        ("il.totalB", ONLINE["interleaving"]["totalCreditB"],
                      sum(q["creditB"] for q in ONLINE["interleaving"]["queries"]), 0),
        # compression: varbyte total bytes = number of gaps (each gap <128 → 1 byte)
        ("zip.bytes", COMPRESS["varbyteBytesTotal"], len(COMPRESS["gaps"]), 0),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L3L4({name}): data/ files disagree — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L3L4: {len(checks)} cross-file invariants consistent ✓"))

# ── [C] CLAIMS: every grounded value read from data/, asserted present+matching in the deck ─────
def claims():
    pp = primary_pair()
    return [
        dict(id="heaps β",   deck="L2", value=round(CORP["heaps"]["beta"], 2), tol=0.02,
             anchor=r"(?:β|\\beta)\s*(?:≈|\\approx|=)\s*([\d.]+)", must=True),
        dict(id="V types",   deck="L2", value=CORP["vTypes"], tol=0.5,
             anchor=r"\b(94[\s,]?287)\b", must=True),
        dict(id="zipf slope",deck="L2", value=round(CORP["zipf"]["loglogSlope"], 2), tol=0.03,
             anchor=r"([−-]1\.0\d+)", must=True),
        dict(id="heaps R²",  deck="L2", value=round(CORP["heaps"]["r2"], 3), tol=0.002,
             anchor=r"R(?:²|\^?2)\s*=\s*(0\.99\d)", must=True),
        dict(id="euclid",    deck="L2", value=round(pp["euclid"], 2), tol=0.05,
             anchor=r"(?:sqrt\{162\}|√162)\\?\s*(?:≈|\\approx)\s*([\d.]+)", must=True),
        dict(id="γ pos-bias",deck="L1", value=CLICK["gamma"], tol=0.005,
             anchor=r"(?:γ|\\gamma)\s*(?:≈|=|\\?\s*=)?\s*(0\.9\d)", must=True),
        dict(id="top-1 %",   deck="L1", value=CLICK["top1Pct"], tol=0.2,
             anchor=r"\b(32\.3)\s*%", must=True),
        dict(id="top-3 %",   deck="L1", value=CLICK["top3Pct"], tol=0.2,
             anchor=r"\b(60\.6)\b", must=True),
    ] + l3_claims() + l4_claims()

# ── L3 'Star Catalog' [C] claims: every flagship number the deck shows == data/l3-*.json ─────────
# Anchors match the RENDERED numeric text (KaTeX \(…\)/$$…$$, <code> matrix-labels, captions) — the
# digits are literal in the HTML source even inside KaTeX, so a value-targeted regex is robust to
# the surrounding markup. The captured group is a GENERIC number ([\d.]+ / \d+); the surrounding
# literal context (labels, the other numbers in the same expression) pins the location uniquely, so
# a number that DRIFTS at that spot is still matched and flagged as DRIFT (not silently NOT FOUND).
def l3_claims():
    cd = {d["id"]: d for d in CATDOG["docs"]}
    N = r"([\d.]+)"      # generic captured number → catches drift, not just exact match
    return [
        # cat/dog smoothed idf (flagship). idf(cat)=…=0.1335 ; idf(dog)=…=0.4700
        dict(id="L3 idf cat",  deck="L3", value=CATDOG["idf"]["cat"], tol=1e-4,
             anchor=r"\\ln\(1\.1429\)="+N, must=True),
        dict(id="L3 idf dog",  deck="L3", value=CATDOG["idf"]["dog"], tol=1e-4,
             anchor=r"\\ln\(1\.6000\)="+N, must=True),
        # cat/dog per-doc BM25 scores and the final ranking D2 > D1 > D3
        dict(id="L3 D1 score", deck="L3", value=cd["D1"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D1\}\)=0\.1908\+0\.4700="+N, must=True),
        dict(id="L3 D2 score", deck="L3", value=cd["D2"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D2\}\)=0\.1161\+0\.6065="+N, must=True),
        dict(id="L3 D3 score", deck="L3", value=cd["D3"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D3\}\)=0\.1571\+0="+N, must=True),
        dict(id="L3 rank",     deck="L3", value=cd["D2"]["bm25Score"], tol=1e-4,
             anchor=r"\\text\{D2\}\\;"+N+r" > \\text\{D1\}\\;0\.6608 > \\text\{D3\}", must=True),
        # cat/dog worked B-factors (only fully substituted in -steps.json)
        dict(id="L3 B D1cat",  deck="L3", value=CATDOG_STEPS["docs"][0]["terms"][0]["B"], tol=1e-4,
             anchor=r"D1 cat: B="+N+r" → 0\.1908", must=True),
        dict(id="L3 B D2dog",  deck="L3", value=CATDOG_STEPS["docs"][1]["terms"][1]["B"], tol=1e-4,
             anchor=r"D2 dog: B="+N+r" → 0\.6065", must=True),
        # nasa/shuttle idf (distinct-df) + bm25 ranking by row order D2 > D3 > D0
        dict(id="L3 idf nasa", deck="L3", value=Q2["idf"]["nasa"], tol=1e-4,
             anchor=r"\\ln\(2\.5714\)="+N, must=True),
        dict(id="L3 idf shut", deck="L3", value=Q2["idf"]["shuttle"], tol=1e-4,
             anchor=r"\\ln\(3\.6000\)="+N, must=True),
        dict(id="L3 q2 D2",    deck="L3", value=Q2_STEPS["winningDoc"]["rowSum"], tol=1e-4,
             anchor=r"<td>66</td><td>1</td><td>3</td><td>0\.8309</td><td>1\.9842</td><td class=\"cell-good\">"+N+r"</td>", must=True),
        dict(id="L3 q2 D3",    deck="L3", value=[d for d in Q2["docs"] if d["id"]=="D3"][0]["bm25Score"],
             tol=1e-4, anchor=r"<td>59</td><td>2</td><td>1</td><td>1\.2811</td><td>1\.1922</td><td>"+N+r"</td>", must=True),
        # PageRank converged vector v25 = (0.2148, 0.3974, 0.3878) + worked iter-1 B update = 0.475
        dict(id="L3 PR A",     deck="L3", value=round(PAGERANK["finalVector"][0], 4), tol=1e-4,
             anchor=r"v_\{25\} = \("+N+r",\\;0\.3974,\\;0\.3878\)", must=True),
        dict(id="L3 PR B",     deck="L3", value=round(PAGERANK["finalVector"][1], 4), tol=1e-4,
             anchor=r"v_\{25\} = \(0\.2148,\\;"+N+r",\\;0\.3878\)", must=True),
        dict(id="L3 PR C",     deck="L3", value=round(PAGERANK["finalVector"][2], 4), tol=1e-4,
             anchor=r"v_\{25\} = \(0\.2148,\\;0\.3974,\\;"+N+r"\)", must=True),
        dict(id="L3 PR Bupd",  deck="L3", value=PAGERANK["workedUpdate"]["pr1"], tol=1e-4,
             anchor=r"0\.05\+0\.425="+N, must=True),
        # postings compression: gaps [3,5,4,18], 16 → 4 bytes
        dict(id="L3 gaps",     deck="L3", value=COMPRESS["gaps"][3], tol=0,
             anchor=r"\[3, 5, 4, (\d+)\]", must=True),
        dict(id="L3 raw bytes",deck="L3", value=COMPRESS["rawBytesTotal"], tol=0,
             anchor=r"naive = (\d+) bytes", must=True),
        dict(id="L3 vb bytes", deck="L3", value=COMPRESS["varbyteBytesTotal"], tol=0,
             anchor=r"varbyte = (\d+) bytes", must=True),
        # cited benchmarks: MS MARCO BM25 0.187, BEIR BM25 0.43
        dict(id="L3 MSMARCO",  deck="L3", value=BENCH["msmarco"]["BM25"], tol=1e-4,
             anchor=r"<td>MS MARCO dev</td><td>MRR@10</td><td>"+N+r"</td>", must=True),
        dict(id="L3 BEIR",     deck="L3", value=BENCH["beir"]["BM25"], tol=1e-4,
             anchor=r"BM25 \("+N+r"\) <strong>beats DPR", must=True),
        # RRF: k=60, top fused score D6 = 0.032787
        dict(id="L3 RRF k",    deck="L3", value=RRF["k"], tol=0,
             anchor=r"\\\(k=(\d+)\\\)", must=True),
        dict(id="L3 RRF top",  deck="L3", value=RRF["fused"][0]["rrf"], tol=1e-6,
             anchor=r"0\.016393\+0\.016393 = \\mathbf\{"+N+r"\}", must=True),
    ]

# ── L4 'Proving Grounds' [C] claims: every flagship metric the deck shows == data/l4-*.json ──────
# Same robustness contract as l3_claims(): generic captured number, literal context pins the spot.
def l4_claims():
    N = r"([\d.]+)"
    return [
        # MRR / MAP over two queries (mean ≠ either query)
        dict(id="L4 MRR",      deck="L4", value=MULTIQ["mrr"], tol=1e-4,
             anchor=r"\\mathrm\{MRR\} = \\dfrac\{0\.5 \+ 1\.0\}\{2\} = "+N, must=True),
        dict(id="L4 MAP",      deck="L4", value=MULTIQ["map"], tol=1e-4,
             anchor=r"MAP \\\(=\\\)</span><span class=\"matrix-label is-highlight\">\\\("+N+r"\\\)", must=True),
        # graded nDCG: linear 0.6622, exponential 0.6563 (same ranking, two gain functions)
        dict(id="L4 nDCG lin", deck="L4", value=GRADED["linear"]["ndcg"], tol=1e-4,
             anchor=r"<td>\\\(5\.8235\\\)</td><td class=\"cell-good\">\\\("+N+r"\\\)", must=True),
        dict(id="L4 nDCG exp", deck="L4", value=GRADED["exponential"]["ndcg"], tol=1e-4,
             anchor=r"8\.1029 / 12\.3472 = "+N, must=True),
        # binary-gain nDCG: honest 0.6766, gamed 0.5434 (Goodhart)
        dict(id="L4 nDCG hon", deck="L4", value=METRICS["ndcg"], tol=1e-4,
             anchor=r"1\.7333/2\.5616 = "+N, must=True),
        dict(id="L4 nDCG gam", deck="L4", value=METRICS["gamed"]["ndcg"], tol=1e-4,
             anchor=r"1\.3919/2\.5616 = "+N, must=True),
        # significance: paired t = 2.275; precise p-values; 95% CI [0.0023, 0.0772]
        dict(id="L4 t-stat",   deck="L4", value=SYSTEMS["pairedTTest"]["t"], tol=5e-3,
             anchor=r"0\.0676/\\sqrt\{15\}\)="+N, must=True),
        dict(id="L4 p t-test", deck="L4", value=SYSTEMS["pairedTTest"]["p"], tol=1e-5,
             anchor=r"\\\(p="+N+r"\\\) from the \\\(t_\{14\}", must=True),
        dict(id="L4 p wilcox", deck="L4", value=SYSTEMS["wilcoxon"]["p"], tol=1e-5,
             anchor=r"\\\(p="+N+r"\\\) \(table value\)", must=True),
        dict(id="L4 p perm",   deck="L4", value=SYSTEMS["permutation"]["p"], tol=1e-5,
             anchor=r"\}/32768="+N, must=True),
        dict(id="L4 CI lo",    deck="L4", value=SYSTEMS["ci95"][0], tol=1e-4,
             anchor=r"\\sqrt\{15\}\} = \[\\,"+N+r",\\ 0\.0772\\,\]", must=True),
        dict(id="L4 CI hi",    deck="L4", value=SYSTEMS["ci95"][1], tol=1e-4,
             anchor=r"\\sqrt\{15\}\} = \[\\,0\.0023,\\ "+N+r"\\,\]", must=True),
        # A/B test: z = 2.557, p = 0.01056, +10% relative lift
        dict(id="L4 AB z",     deck="L4", value=ONLINE["abTest"]["z"], tol=1e-3,
             anchor=r"\{0\.00469\} = "+N+r" \\;\\Rightarrow", must=True),
        dict(id="L4 AB p",     deck="L4", value=ONLINE["abTest"]["p"], tol=1e-5,
             anchor=r"\\Rightarrow\\; p = "+N+r"\$\$", must=True),
        dict(id="L4 AB lift",  deck="L4", value=ONLINE["abTest"]["relativeLiftPct"], tol=1e-3,
             anchor=r"\\frac\{0\.012\}\{0\.12\} = (\d+)\\%", must=True),
        # interleaving: team-draft totals A=9, B=17
        dict(id="L4 IL totA",  deck="L4", value=ONLINE["interleaving"]["totalCreditA"], tol=0,
             anchor=r"over 5 queries: \} A=(\d+),\\ B=17", must=True),
        dict(id="L4 IL totB",  deck="L4", value=ONLINE["interleaving"]["totalCreditB"], tol=0,
             anchor=r"over 5 queries: \} A=9,\\ B=(\d+)", must=True),
    ]

def check_claim(c, text):
    hits = re.findall(c["anchor"], text)
    if not hits:
        return ("HARD" if c["must"] else "WARN", f'{c["id"]}: NOT FOUND in {c["deck"]} (expected ≈{c["value"]})')
    bad = [h for h in hits if abs(num(h) - c["value"]) > c["tol"]]
    if bad:
        return ("HARD", f'{c["id"]}: DRIFT in {c["deck"]} — displayed {bad} vs data/ {c["value"]}')
    return ("OK", f'{c["id"]}: {len(hits)} match(es) ≈{c["value"]} ✓')

# ── [A] ARITHMETIC: recompute cos/Euclid from data/ vectors; recompute every displayed fraction ──
FRAC = re.compile(r'\\frac\{(\d+)\\cdot (\d+)\}\{(\d+)\\cdot (\d+)\}\s*=\s*(\d+)')
DIVN = re.compile(r'\((\d+)\\cdot (\d+)\)/\((\d+)\\cdot (\d+)\)\s*=\s*(\d+)')

def arithmetic_checks(report, texts):
    pp = primary_pair()
    u, v = tuple(pp["u"]), tuple(pp["v"])
    cos = (u[0]*v[0] + u[1]*v[1]) / (math.hypot(*u) * math.hypot(*v))
    euclid = math.hypot(u[0]-v[0], u[1]-v[1])
    if abs(cos - pp["cos"]) > 1e-6 or abs(euclid - pp["euclid"]) > 1e-4:
        report.append(("HARD", f"arithmetic(cos): recomputed cos={cos:.4f}/euclid={euclid:.4f} ≠ data/ "
                               f'{pp["cos"]}/{pp["euclid"]}'))
    else:
        report.append(("OK", f"arithmetic(cos): cos={cos:.0f}, euclid=√162≈{euclid:.2f} == data/ ✓"))
    nfrac, bad = 0, 0
    for deck, txt in texts.items():
        for a, b, c, d, res in FRAC.findall(txt) + DIVN.findall(txt):
            nfrac += 1
            if abs(int(a)*int(b)/(int(c)*int(d)) - int(res)) > 1e-9:
                bad += 1
                report.append(("HARD", f"arithmetic({deck}): displayed {a}·{b}/({c}·{d}) = {res} is WRONG "
                                       f"(= {int(a)*int(b)/(int(c)*int(d)):g})"))
    if not bad:
        report.append(("OK", f"arithmetic(fractions): {nfrac} displayed a·b/(c·d) results all correct ✓"))

def main():
    text = {k: p.read_text() for k, p in DECKS.items()}
    report = []
    provenance_checks(report)                       # [P] data/ == generator
    provenance_l3l4(report)                         # [P] L3/L4 cross-file data self-consistency
    for c in claims():                              # [C] deck == data/
        report.append(check_claim(c, text[c["deck"]]))
    arithmetic_checks(report, text)                 # [A] recompute
    hard = sum(1 for s, _ in report if s == "HARD")
    warn = sum(1 for s, _ in report if s == "WARN")
    print(f"[facts-gate] {len(report)} checks — source: data/ (provenance→curated→deck)")
    for sev, msg in report:
        print(f"  {'✗' if sev=='HARD' else ('!' if sev=='WARN' else '✓')} [{sev}] {msg}")
    print(f"\n[facts-gate] HARD(drift/missing)={hard}  WARN={warn}")
    return 1 if hard else 0

def selftest():
    # §2.4: a deck snippet with a WRONG β must flag DRIFT against data/.
    bad = 'fill="var(--ink-2)">β ≈ 0.42 — measured</text>'
    c = next(x for x in claims() if x["id"] == "heaps β")
    sev, msg = check_claim(c, bad)
    okD = sev == "HARD" and "DRIFT" in msg
    print("[selftest:claim]", msg)
    # arithmetic: a deliberately-wrong displayed fraction must flag.
    rep = []
    arithmetic_checks(rep, {"L2": r'\frac{1\cdot 29}{1\cdot 1} = 28'})
    okA = any(s == "HARD" and "is WRONG" in m for s, m in rep)
    print("[selftest:arith]", next((m for s, m in rep if s == "HARD"), "arithmetic: NO FLAG"))
    # provenance: a curated value that disagrees with the generator must flag (simulate in-memory).
    rep2 = []
    saved = CORP["heaps"]["beta"]
    CORP["heaps"]["beta"] = 0.42
    provenance_checks(rep2)
    CORP["heaps"]["beta"] = saved
    okP = any(s == "HARD" and "provenance" in m for s, m in rep2)
    print("[selftest:prov]", next((m for s, m in rep2 if s == "HARD"), "provenance: NO FLAG"))
    # L3/L4 [C]: a deck snippet where a flagship number drifted must flag DRIFT (anchor is not blind).
    cL3 = next(x for x in claims() if x["id"] == "L3 D2 score")
    bL3 = r'$$\mathrm{BM25}(\text{D2})=0.1161+0.6065=0.9999$$'  # wrong: data/ says 0.7226
    sevL3, msgL3 = check_claim(cL3, bL3)
    okL3 = sevL3 == "HARD" and "DRIFT" in msgL3
    print("[selftest:L3]", msgL3)
    cL4 = next(x for x in claims() if x["id"] == "L4 nDCG gam")
    bL4 = r'1.3919/2.5616 = 0.9999'  # wrong: data/ gamed nDCG is 0.5434
    sevL4, msgL4 = check_claim(cL4, bL4)
    okL4 = sevL4 == "HARD" and "DRIFT" in msgL4
    print("[selftest:L4]", msgL4)
    # L3/L4 [P]: a curated cross-file value that disagrees with its companion must flag (in-memory).
    rep3 = []
    savedG = GOODHART["gamed"]["ndcg"]
    GOODHART["gamed"]["ndcg"] = 0.9999
    provenance_l3l4(rep3)
    GOODHART["gamed"]["ndcg"] = savedG
    okP2 = any(s == "HARD" and "provenance-L3L4" in m for s, m in rep3)
    print("[selftest:prov-L3L4]", next((m for s, m in rep3 if s == "HARD"), "provenance-L3L4: NO FLAG"))
    ok = okD and okA and okP and okL3 and okL4 and okP2
    print("[selftest]", "PASS — claim-drift + bad-arithmetic + provenance-drift + L3/L4 deck & cross-file all fire"
          if ok else "FAIL — a check is blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
