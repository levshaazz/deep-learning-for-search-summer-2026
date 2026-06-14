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
DOCS = ROOT / "docs"               # built site (Book HTML) — present after `npm run build`
# Glob-discovered: adding Lectures/NN-*.html is picked up here with ZERO edits.
# The key "L<n>" is derived from the numeric filename prefix (00-introduction.html → L0),
# preserving the exact id→path mapping the per-deck [C] claim checks address by key.
DECKS = {
    f"L{int(p.name[:2])}": p
    for p in sorted((ROOT / "Lectures").glob("[0-9][0-9]-*.html"))
}

def load(base, name):
    return json.load(open(base / name))

def num(s):  # parse a displayed number: U+2212 minus, thousands spaces/commas, trailing dot
    s = s.replace("−", "-").replace(",", "").replace(" ", "")
    s = re.sub(r"\.+$", "", s)
    return float(s)

def load_book():
    """Built Book chapters docs/<en>/book/NN/index.html, keyed L<n> (glob — L7 auto-covered).
    Empty dict if docs/ is not built (the gate then WARNs and skips Book [C] claims)."""
    out, base = {}, DOCS / "en" / "book"
    if not base.exists():
        return out
    for d in sorted(base.iterdir()):
        idx = d / "index.html"
        if d.is_dir() and d.name.isdigit() and idx.exists():
            out["L" + str(int(d.name))] = idx.read_text()
    return out

# Curated product data (the single source). Loaded once.
COS  = load(DATA, "l2-cosine.json")
CORP = load(DATA, "l2-corpus-stats.json")
TOK  = load(DATA, "l2-tokenizers.json")     # four tokenizers on one input (BPE/WordPiece/Unigram/byte-BPE)
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

# ── L5 (embeddings + dim-reduction) and L6 (attention/positional/contrastive). Same single source. ──
EMB     = load(DATA, "l5-embeddings.json")    # GloVe-50 analogies + pairwise cosines (+ raw vectors)
DIMRED  = load(DATA, "l5-dimred.json")        # PCA explained-variance + t-SNE (44 words / 7 clusters)
GLOVE   = load(DATA, "l5-glove.json")         # GloVe mini-corpus: X / log X / f(x) / worked king·queen + loss
TSNE    = load(DATA, "l5-tsne-math.json")     # t-SNE on 9 GloVe-50 words: σ/perplexity, p_{j|i}, joint P, q, KL
ATTN    = load(DATA, "l6-attention.json")     # scaled-dot-product worked example (√d_k, weights, output)
POSENC  = load(DATA, "l6-positional.json")    # sinusoidal positional-encoding grid
CONTRA  = load(DATA, "l6-contrastive.json")   # InfoNCE / triplet cosines + loss (shares L5 cat-pair cosines)

# ── Enrichment data files (the L5/L6 re-layout DISPLAYS these new trajectory numbers; pin them) ──
W2V     = load(DATA, "l5-word2vec-train.json")  # SGNS training: loss 4.85→2.63, worked SGNS step, related/unrelated pairs
UMAP    = load(DATA, "l5-umap.json")            # REAL UMAP-44: n_neighbors=10, min_dist=0.1, tightness 0.147→0.061
STACK   = load(DATA, "l6-stack-layers.json")    # DistilBERT cross-sense cos(bank,bank) fan 0.957→0.647 over 6 blocks
CTRAJ   = load(DATA, "l6-contrastive-traj.json")# InfoNCE optimisation trajectory: loss 3.31→0.86→0.1191
CTX     = load(DATA, "l6-contextual.json")      # standalone DistilBERT "bank" polysemy demo: cross-sense 0.6465 < within-sense 0.9466 (Book ch.6 prose)

# ── L7 (Scouts and Judges: bi-/cross-encoders + the neural cascade). toy = stdlib-reproducible; real =
#    frozen SBERT / cross-encoder (gen_l7_real.py, fail-soft). Callbacks reuse BENCH (l3) + METRICS (l4). ──
BIENC    = load(DATA, "l7-biencoder.json")      # toy dot/cos (0.8165/0) + real SBERT cosRel 0.6838 > cosIrr 0.4082
CROSSENC = load(DATA, "l7-crossencoder.json")   # toy logit→σ (0.9168/0.2497) + real distractor (Judge 0.9998 vs 0.1159, Scout 0.8434 vs 0.6875)
CASCADE  = load(DATA, "l7-cascade.json")         # stages 10⁶→10³→10; BM25 nDCG 0.6766 → reranked 0.9558 (real cross-encoder on the L4 8-doc set)
MSMARCO  = load(DATA, "l7-msmarco.json")         # frozen MS MARCO subset: retrieve MRR@10 0.5482 → rerank 0.6732 (rerank helps)
BENCH7   = load(DATA, "l7-bench.json")           # CITED reranker benchmarks: small cross-encoder MRR@10 (L6 39.01 vs L12 39.02); LLM-reranker nDCG@10 (gpt-4 75.59, RankZephyr 78.16)

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

# ── [P] PROVENANCE (L5/L6 self-consistency): like the L3/L4 generators, gen_l5/gen_l6 emit data/
#    directly, so we pin cross-file invariants instead of RAW diffs. Two kinds:
#      (a) the SAME cosine lives in two files — l5-embeddings.json's cat-pair cosines are reused
#          verbatim by l6-contrastive.json; a drift between the copies must fire.
#      (b) a derived/structural identity inside one file — InfoNCE loss = −log(p⁺), √d_k = √(d_k),
#          analogy answerCos = top[0].cos, and each softmax attention row sums to 1.
#    Plus two data-only PINS: the triplet margin (0.2) and the gender-direction cosine (0.597) are
#    NEVER displayed numerically in the deck (only symbolic), so the gate cannot reach them via a [C]
#    claim — we pin them here so a silent edit to those data/ numbers is still caught.
def provenance_l5l6(report):
    embp = {(p["a"], p["b"]): p["cos"] for p in EMB["pairs"]}
    co   = CONTRA["sims"]
    checks = [
        # (a) shared cosines: l5-embeddings.json ↔ l6-contrastive.json (cat anchor reused)
        ("l5l6.cat·dog", embp[("cat", "dog")],      co["positives"]["dog"],      1e-9),
        ("l5l6.cat·kit", embp[("cat", "kitten")],   co["positives"]["kitten"],   1e-9),
        ("l5l6.cat·air", embp[("cat", "airplane")], co["negatives"]["airplane"], 1e-9),
        # (b) structural identities
        ("infonce.loss",  CONTRA["infoNCE"]["loss"], round(-math.log(CONTRA["infoNCE"]["pPositive"]), 4), 1e-4),
        ("attn.sqrtdk",   ATTN["sqrtdk"],            math.sqrt(ATTN["d_k"]),      1e-9),
        ("analogy.answer", EMB["analogy"]["answerCos"], EMB["analogy"]["top"][0]["cos"], 1e-9),
        # softmax rows are distributions → each sums to 1 (tol absorbs the 3-dp display rounding)
        ("attn.rowsum0",  sum(ATTN["weights"][0]),   1.0, 2e-3),
        ("attn.rowsum1",  sum(ATTN["weights"][1]),   1.0, 2e-3),
        ("attn.rowsum2",  sum(ATTN["weights"][2]),   1.0, 2e-3),
        # data-only pins (no deck display path) — margin 0.2 and gender-direction cosine 0.597
        ("contra.margin", CONTRA["margin"],          0.2,   1e-9),
        ("emb.genderDir", EMB["genderDirectionCos"], 0.597, 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L5L6({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L5L6: {len(checks)} cross-file/structural invariants consistent ✓"))

# ── [P] PROVENANCE (L5 GloVe + t-SNE-math self-consistency): gen_l5 emits these data/ files directly,
#    so (as with L3/L4 and L5/L6) we pin cross-file + structural invariants instead of a RAW diff. The
#    new l5-glove.json / l5-tsne-math.json carry many internal numbers the deck never displays (the
#    full worked dot/bias decomposition, the σ↔β↔perplexity tuning, the symmetrised joint P, the KL
#    summands, the gradient). A silent edit to any of those would not be caught by a [C] deck claim, so
#    we anchor them here. Two flagship "data-only PINS" the prompt calls out — the GloVe the·king worked
#    pair (model 1.654 vs log X 1.658, NEVER shown numerically) and the t-SNE entropy log₂5≈2.322 bits
#    (perplexity = 2^entropy, also not displayed) — live here as their only verification path.
def provenance_l5_glove_tsne(report):
    g, t = GLOVE, TSNE
    wk = {(w["i"], w["j"]): w for w in g["worked"]}
    kq, tk, cd = wk[("king", "queen")], wk[("the", "king")], wk[("cat", "dog")]
    c = t["conditional"]
    P, Q = t["joint"]["P"], t["lowD"]["Q"]
    near, far = t["worked"]["near"], t["worked"]["far"]
    # KL(P‖Q) recomputed from the symmetrised joint P and the Student-t Q (the deck shows only 0.0411)
    klRecomp = sum(P[i][j] * math.log(P[i][j] / Q[i][j])
                   for i in range(len(P)) for j in range(len(P)) if i != j and P[i][j] > 0 and Q[i][j] > 0)
    checks = [
        # ── GloVe worked-pair structural identities (model = dot+b_i+b̃_j; log X = ln X; residual) ──
        ("glove.kq.logX",   kq["logX"],  math.log(kq["X"]),               1e-3),
        ("glove.kq.model",  kq["model"], kq["dot"] + kq["bi"] + kq["bj"], 1e-3),
        ("glove.kq.resid",  kq["residual"], kq["model"] - kq["logX"],     1e-3),
        ("glove.cd.model",  cd["model"], cd["dot"] + cd["bi"] + cd["bj"], 1e-3),
        # the·king worked pair — DATA-ONLY PIN (deck shows it only symbolically, never the numbers)
        ("glove.tk.model",  tk["model"], 1.654,                           1e-3),
        ("glove.tk.logX",   tk["logX"],  1.6582,                          1e-3),
        ("glove.tk.modelId",tk["model"], tk["dot"] + tk["bi"] + tk["bj"], 1e-3),
        # loss collapse: dropPct = 100·(1−after/before); endpoints == the history series ends
        ("glove.dropPct",   g["loss"]["dropPct"], round(100*(1 - g["loss"]["after"]/g["loss"]["before"]), 2), 1e-2),
        ("glove.lossBefore",g["loss"]["before"],  g["loss"]["history"][0]["loss"],  1e-9),
        ("glove.lossAfter", g["loss"]["after"],   g["loss"]["history"][-1]["loss"], 1e-9),
        # f(x) caps at 1 once x reaches x_max (the green "capped at 1" line in the deck)
        ("glove.fCap",      next(p["f"] for p in g["fCurve"] if p["x"] == g["xMax"]), 1.0, 1e-9),
        # ── t-SNE σ↔β↔perplexity↔entropy tuning identities ──
        ("tsne.rowSum",     sum(c["pRow"]),  1.0,                         1e-6),
        ("tsne.perpEntropy",c["perplexity"], 2 ** c["entropyBits"],       1e-3),
        ("tsne.entropyLog2",c["entropyBits"],math.log2(c["perplexity"]),  1e-3),  # entropy = log₂(perplexity)=2.322 bits
        ("tsne.sigmaBeta",  c["sigma"],      1/math.sqrt(2*c["beta"]),    1e-3),
        ("tsne.betaSigma",  c["beta"],       1/(2*c["sigma"]**2),         1e-4),
        # joint P symmetric + normalised; anchorRow is row 0 of P
        ("tsne.jointSym",   P[0][2],         P[2][0],                     1e-9),
        ("tsne.jointSum",   sum(sum(r) for r in P), 1.0,                  1e-6),
        ("tsne.anchorRow",  t["joint"]["anchorRow"][2], P[0][2],          1e-9),
        # worked near/far entries must equal the array cells the deck reads (cat→dog, cat→throne)
        ("tsne.near.d2",    near["d2_highD"], t["highD"]["anchorSqDist"][2], 1e-3),
        ("tsne.near.pcond", near["p_j_given_i"], c["pRow"][2],            1e-9),
        ("tsne.near.pjoint",near["p_ij_joint"],  P[0][2],                 1e-9),
        ("tsne.near.q",     near["q_ij"],        Q[0][2],                 1e-9),
        ("tsne.far.d2",     far["d2_highD"],  t["highD"]["anchorSqDist"][8],  1e-3),
        ("tsne.far.pjoint", far["p_ij_joint"], P[0][8],                   1e-9),
        # KL field == recompute from P,Q; gradient anchor magnitude == |anchor vector|; all[0]==anchor
        ("tsne.kl",         t["kl"],         round(klRecomp, 6),          1e-4),
        ("tsne.gradMag",    t["gradient"]["anchorMag"], round(math.hypot(*t["gradient"]["anchor"]), 6), 1e-5),
        ("tsne.gradAnchor", t["gradient"]["all"][0][0], t["gradient"]["anchor"][0], 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L5GT({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L5GT: {len(checks)} GloVe+t-SNE cross-file/structural invariants consistent ✓"))

# ── [P] PROVENANCE (L2 tokenizer-compare self-consistency): gen_l2_tokenizers.py emits data/ directly
#    (a Book widget — no deck display path), so we pin the same kind of cross-file + structural
#    invariants as L3/L4/L5. The flagship facts are the FOUR token counts for the one sample input and
#    the rare/compound word `unhappiness`'s segmentation per cutter. We verify:
#      (a) each tokenizer's published count == len(its token list)  [the count can't drift from data];
#      (b) the `counts` flat map == the per-tokenizer count  [the two copies in the file must agree];
#      (c) the ranking is sorted fewest→most AND matches the canonical spread BPE 7 < WP 9 < Uni 13 <
#          byte-BPE 35  [the "fewer = more efficient" story is the whole point of the widget];
#      (d) the rare word `unhappiness` segments as the four KNOWN splits (data-only PINS: never shown in
#          a deck, so a silent edit to the generator's corpus/vocab is only caught here).
TOK_COUNTS = {"BPE": 7, "WordPiece": 9, "Unigram": 13, "Byte-level BPE": 35}
TOK_UNHAPPY = {                                   # the sample word's per-cutter segmentation (the divergence)
    "BPE":            ["un", "happiness"],
    "WordPiece":      ["un", "##h", "##app", "##iness"],
    "Unigram":        ["un", "happi", "ne", "s", "s"],
    "Byte-level BPE": ["Ġ", "u", "n", "h", "a", "p", "p", "i", "n", "e", "s", "s"],  # Ġ u n h a p p i n e s s
}
def _tok_unhappy(t):
    pw = next(p for p in t["perWord"] if p["word"] == "unhappiness")
    return pw["tokens"] if "tokens" in pw else [pp["piece"] for pp in pw["pieces"]]
def provenance_l2_tokenizers(report):
    by = {t["name"]: t for t in TOK["tokenizers"]}
    rank_by = {r["name"]: r for r in TOK["ranking"]}
    bad = 0
    # (a)+(b): count == len(tokens) == counts-map == ranking-count, per cutter; AND == the canonical value
    for name, want in TOK_COUNTS.items():
        t = by[name]
        for label, got in [("count==len", t["count"] == len(t["tokens"])),
                           ("counts-map", TOK["counts"][name] == t["count"]),
                           ("ranking-count", rank_by[name]["count"] == t["count"]),
                           ("canonical", t["count"] == want)]:
            if got is not True and got != True:
                bad += 1
                report.append(("HARD", f"provenance-L2TOK({name}/{label}): token count broke "
                                       f"(count={t['count']}, len={len(t['tokens'])}, want {want})"))
    # (c): ranking sorted fewest→most and the spread endpoints match
    rc = [r["count"] for r in TOK["ranking"]]
    if rc != sorted(rc):
        bad += 1; report.append(("HARD", f"provenance-L2TOK(rank-order): ranking not fewest→most: {rc}"))
    if (TOK["spread"]["min"], TOK["spread"]["max"]) != (rc[0], rc[-1]):
        bad += 1; report.append(("HARD", f"provenance-L2TOK(spread): {TOK['spread']} ≠ ranking ends {rc[0]}…{rc[-1]}"))
    # (d): the rare word `unhappiness` segmentation per cutter (data-only pins)
    for name, want in TOK_UNHAPPY.items():
        got = _tok_unhappy(by[name])
        if got != want:
            bad += 1
            report.append(("HARD", f"provenance-L2TOK({name}/unhappiness): segmentation drifted — "
                                   f"{got} vs {want}"))
    if not bad:
        n = len(TOK_COUNTS) * 4 + 2 + len(TOK_UNHAPPY)
        report.append(("OK", f"provenance-L2TOK: {n} tokenizer-compare count/ranking/segmentation invariants consistent "
                             f"(BPE {TOK_COUNTS['BPE']} < WordPiece {TOK_COUNTS['WordPiece']} < "
                             f"Unigram {TOK_COUNTS['Unigram']} < byte-BPE {TOK_COUNTS['Byte-level BPE']}) ✓"))

# ── [P] PROVENANCE (L5/L6 ENRICHMENT cross-file + structural): the new trajectory data files the
#    re-layout introduced (l5-word2vec-train, l5-umap, l5-glove.trajectory, l6-stack-layers,
#    l6-contrastive-traj) carry many internal frames the deck only shows the ENDPOINTS of. We pin the
#    cross-file identities so an enrichment number cannot drift between files (and still pass [C]):
#      • the GloVe ANIMATION trajectory's first/last frame loss == the canonical static loss before/after
#        (18.0391 / 0.005) — the animated curve must land on the same endpoints the inset prints;
#      • the InfoNCE optimisation trajectory's TUNED endpoint == the canonical InfoNCE state in
#        l6-contrastive.json: loss 0.1191, p⁺ 0.8877, and all four tuned cosines (kitten/airplane/
#        computer/france) — the animation must converge to the deck's exact final numbers;
#      • word2vec/SGNS: related pairs end TIGHTER than unrelated (the whole point of the slide), the
#        separation ratio == unrelated/related mean dist, the loss endpoints == the history-series ends,
#        and the dropPct identity; the worked SGNS step's negatives all push apart (positive σ/grad);
#      • UMAP tightness endpoints == the snapshot series ends; DistilBERT cross-sense final == last layer.
def provenance_enrichment(report):
    g, w, u, s, ct = GLOVE, W2V, UMAP, STACK, CTRAJ
    tr = g["trajectory"]
    tuned = next(c for c in ct["checkpoints"] if c["name"] == "tuned")
    ss = w["similaritySummary"]
    snap = {sn["epoch"]: sn for sn in u["snapshots"]}
    ck = {c["name"]: c for c in ct["checkpoints"]}
    checks = [
        # GloVe animation trajectory ↔ canonical static loss endpoints (18.0391 / 0.005)
        ("glove.traj.lossBefore", tr["frames"][0]["loss"],  g["loss"]["before"], 1e-9),
        ("glove.traj.lossAfter",  tr["frames"][-1]["loss"], g["loss"]["after"],  1e-9),
        # InfoNCE optimisation trajectory TUNED endpoint ↔ l6-contrastive.json canonical final state
        ("ctraj.tuned.loss",   tuned["loss"],              CONTRA["infoNCE"]["loss"],      1e-9),
        ("ctraj.tuned.pPos",   tuned["pPositive"],         CONTRA["infoNCE"]["pPositive"], 1e-9),
        ("ctraj.tuned.kitten", tuned["cosines"]["kitten"], CONTRA["sims"]["positives"]["kitten"], 1e-9),
        ("ctraj.tuned.airplane",tuned["cosines"]["airplane"],CONTRA["sims"]["negatives"]["airplane"],1e-9),
        ("ctraj.tuned.computer",tuned["cosines"]["computer"],CONTRA["sims"]["negatives"]["computer"],1e-9),
        ("ctraj.tuned.france", tuned["cosines"]["france"], CONTRA["sims"]["negatives"]["france"],  1e-9),
        # the lossCurve summary == the per-checkpoint losses (untuned/mid/tuned), in order
        ("ctraj.curve.untuned", ct["lossCurve"][0],  ck["untuned"]["loss"], 1e-9),
        ("ctraj.curve.mid",     ct["lossCurve"][1],  ck["mid"]["loss"],     1e-9),
        ("ctraj.curve.tuned",   ct["lossCurve"][2],  ck["tuned"]["loss"],   1e-9),
        # word2vec/SGNS: loss endpoints == history-series ends; dropPct identity
        ("w2v.lossBefore", w["loss"]["before"], w["loss"]["history"][0]["loss"],  1e-9),
        ("w2v.lossAfter",  w["loss"]["after"],  w["loss"]["history"][-1]["loss"], 1e-9),
        ("w2v.dropPct",    w["loss"]["dropPct"], round(100*(1 - w["loss"]["after"]/w["loss"]["before"]), 2), 1e-2),
        # separation ratio == unrelated/related mean final distance
        ("w2v.sepRatio",   ss["separationRatio"],
                           round(ss["unrelatedMeanDistFinal"]/ss["relatedMeanDistFinal"], 3), 1e-2),
        # UMAP tightness endpoints == snapshot-series ends (0.1469 → 0.0612)
        ("umap.tight.init",  round(snap[0]["tightness"], 4),   round(u["snapshots"][0]["tightness"], 4),  1e-9),
        ("umap.tight.final", round(snap[500]["tightness"], 4), round(u["snapshots"][-1]["tightness"], 4), 1e-9),
        # DistilBERT cross-sense fan: final == the last block's cosine in the by-layer series
        ("stack.final",    s["finalCrossSenseCos"], s["crossSenseCosByLayer"][-1], 1e-9),
        # l6-contextual.json (the STANDALONE DistilBERT polysemy demo behind the Book ch.6 "bank" prose)
        # MUST agree with the stack run: its final cross-sense cos(bank_river, bank_money) == the stack's
        # last-block cosine — same DistilBERT, two generators, one number (both 0.6465). Ties the orphan in.
        ("ctx.crossSense", CTX["cosines"]["crossSense"], s["finalCrossSenseCos"], 1e-9),
        # the displayed 0.30 gap is the within−cross identity (0.9466 − 0.6465 = 0.3001); static is 1.0 by construction.
        ("ctx.gap",        CTX["cosines"]["gap"], round(CTX["cosines"]["withinSense"] - CTX["cosines"]["crossSense"], 4), 1e-9),
        ("ctx.staticSelf", CTX["staticBaseline"]["staticBankSelfCos"], 1.0, 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-ENR({name}): data/ disagree/invariant broken — {a} vs {b}"))
    # structural data-only pin: related pairs MUST end tighter than unrelated (the slide's whole claim);
    # and the worked SGNS step's negatives all push apart (positive σ on a negative ⇒ +grad). Never
    # displayed numerically, so this is their only verification path.
    if not ss["relatedTighter"] or not (ss["relatedMeanDistFinal"] < ss["unrelatedMeanDistFinal"]):
        bad += 1
        report.append(("HARD", f"provenance-ENR(w2v.tighter): related not tighter than unrelated — "
                               f'{ss["relatedMeanDistFinal"]} vs {ss["unrelatedMeanDistFinal"]}'))
    if not all(neg["sigmoid"] > 0 and "push apart" in neg["gradSign"] for neg in w["workedStep"]["negatives"]):
        bad += 1
        report.append(("HARD", "provenance-ENR(w2v.workedStep): a negative-sample grad does not push apart"))
    # contextual polysemy demo: the whole claim is within-sense > cross-sense (context splits the senses).
    if not (CTX["cosines"]["withinSense"] > CTX["cosines"]["crossSense"]):
        bad += 1
        report.append(("HARD", "provenance-ENR(ctx.split): within-sense not > cross-sense — "
                               f'{CTX["cosines"]["withinSense"]} vs {CTX["cosines"]["crossSense"]}'))
    if not bad:
        report.append(("OK", f"provenance-ENR: {len(checks) + 3} enrichment cross-file/structural invariants "
                             f"consistent (GloVe 18.0391→0.005 · InfoNCE traj→0.1191/p⁺0.8877 · "
                             f"w2v related tighter · UMAP 0.1469→0.0612 · DistilBERT fan→0.6465 · "
                             f"l6-contextual 0.6465<0.9466) ✓"))

def _nce_softmax(logits):
    m = max(logits); e = [math.exp(x - m) for x in logits]; s = sum(e)
    return [v / s for v in e]

# ── [P] L6 slide-48 InfoNCE softmax BARS are DATA-BOUND (R8: not hand-tuned magic coords) ──────────
# The 12 softmax bars (4 candidates × 3 checkpoints) on the "InfoNCE loss = 0.1191" slide are
# softmax(checkpoints[k].logits)·H per checkpoint, straight from data/l6-contrastive-traj.json. Before
# this they were 12 hardcoded <rect height> values with NO gate tying them to the data — editing a bar,
# or drifting the trajectory logits, could silently diverge. This binds them: (a) data self-consistency
# — softmax(logits)[kitten] == pPositive and loss == −ln(p⁺) per checkpoint (pins logits↔p⁺↔loss); and
# (b) deck binding — each bar <rect height> == softmax(logits)·H (H=220, declared in the slide as "×220"),
# scoped to the .nce-slide and matched by x-coord (925 kitten / 1075 airplane / 1225 computer / 1375
# france), 3 per x in checkpoint order (untuned/mid/tuned = steps 1/2/3). The deck CANNOT be makeScale'd
# at runtime (L6 has no DeckLayout) — this provenance check is the data-traceability the render would need.
def provenance_l6_nce(report, l6_html):
    H = 220.0
    cks = CTRAJ["checkpoints"]                 # [untuned, mid, tuned] in order == deck steps 1/2/3
    probs = [_nce_softmax(c["logits"]) for c in cks]
    bad = 0
    # (a) data self-consistency: the logits PRODUCE the stored pPositive and loss.
    for c, p in zip(cks, probs):
        if abs(p[0] - c["pPositive"]) > 5e-4:
            bad += 1; report.append(("HARD", f"provenance-L6NCE({c['name']}.pPos): softmax(logits)[kitten] {p[0]:.5f} != pPositive {c['pPositive']}"))
        if abs(-math.log(p[0]) - c["loss"]) > 1e-3:
            bad += 1; report.append(("HARD", f"provenance-L6NCE({c['name']}.loss): −ln(p⁺) {-math.log(p[0]):.4f} != loss {c['loss']}"))
    # (b) deck binding: each bar height == softmax·H (scoped to the nce-slide, matched by x in step order).
    sec = re.search(r'<section class="slide nce-slide".*?</section>', l6_html or "", re.S)
    nbar = 0
    if sec:
        html = sec.group()
        for x, name, idx in [("925", "kitten", 0), ("1075", "airplane", 1), ("1225", "computer", 2), ("1375", "france", 3)]:
            hs = [float(h) for h in re.findall(r'<rect x="%s"[^>]*height="([\d.]+)"' % x, html)]
            if len(hs) != 3:
                bad += 1; report.append(("HARD", f"provenance-L6NCE(bars.{name}): expected 3 <rect x={x}> bar heights, found {len(hs)}")); continue
            for k in range(3):
                want = probs[k][idx] * H; nbar += 1
                if abs(hs[k] - want) > 0.6:
                    bad += 1; report.append(("HARD", f"provenance-L6NCE(bar.{name}.{cks[k]['name']}): height {hs[k]} != softmax·{H:.0f} {want:.1f} (logits {cks[k]['logits']})"))
    if not bad:
        tail = f"{nbar} bars == softmax(traj.logits)·{H:.0f}; " if sec else "(deck not built — bar binding skipped) "
        report.append(("OK", f"provenance-L6NCE: {tail}logits↔p⁺↔loss consistent across untuned/mid/tuned ✓"))

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
    ] + l3_claims() + l4_claims() + l5_claims() + l6_claims() + l7_deck_claims()

# ── [C] BOOK CLAIMS: the built Book PROSE must show the same flagship numbers as data/ ───────────
# The Book restates the decks' worked examples in its own prose/KaTeX, so the deck anchors do NOT
# match it (only 7/111 do). Each Book claim REUSES the value+tol of the corresponding deck claim by
# id (single source — the number itself is never re-typed here), pairing it with a Book-markup
# anchor (a generic ([\d.]+) capture pinned by stable surrounding literals, so a number that DRIFTS
# at that spot is captured and flagged, not silently missed). Closes the standing gap: until now the
# Book's numbers were ungated (check_claims docstring's own TODO). Adding more is just more rows here.
BOOK_ANCHORS = [
    ("L3 idf cat",      r"\\ln\(1\.1429\) = ([\d.]+)"),
    ("L3 idf dog",      r"\\ln\(1\.6\) = ([\d.]+)"),
    ("L3 D2 score",     r"0\.1161 \(cat\) \+ 0\.6065 \(dog\) = <strong>([\d.]+)</strong>"),
    ("L3 BEIR",         r"BM25 still scores around ([\d.]+) nDCG@10"),
    ("L4 nDCG hon",     r"\\frac\{1\.7333\}\{2\.5616\}=([\d.]+)"),
    ("L4 nDCG gam",     r"\\frac\{1\.3919\}\{2\.5616\}=\\mathbf\{([\d.]+)\}"),
    ("L4 MRR",          r"\\frac\{0\.5\+1\.0\}\{2\}=\\mathbf\{([\d.]+)\}"),
    ("L4 MAP",          r"\\frac\{0\.5\+0\.747\}\{2\}=\\mathbf\{([\d.]+)\}"),
    ("L5 PCA 2-D",      r"keep ([\d.]+)% of the original"),
    ("L5 analogy cos",  r"cosine ([\d.]+), far ahead"),
    ("L5 runner-up",    r"prince \(([\d.]+)\) and throne"),
    ("L5G drop %",      r"a \\\(([\d.]+)\\%\\\) drop"),
    ("L5G loss after",  r"to \\\(([\d.]+)\\\) after 600 AdaGrad"),
    ("L6 InfoNCE loss", r"[−-]ln\(0\.8877\) = ([\d.]+)"),
    ("L6 InfoNCE p+",   r"probability ([\d.]+), so the loss"),
    # ── widened coverage: every flagship + worked intermediate the Book PROSE states (anchor-probed).
    #    Optional 3rd element overrides the deck tol where the Book displays a rounded form. ──
    # L1 / L2
    ("top-1 %",         r"Rank 1 alone takes ~([\d.]+)% of clicks"),
    ("top-3 %",         r"top 3 soak up ~([\d.]+)%"),
    ("heaps β",         r"\\beta \\approx ([\d.]+)"),
    ("V types",         r"counted ([\d,]+) distinct type"),
    ("zipf slope",      r"slope is ≈ ([−\d.]+)"),
    ("euclid",          r"\\sqrt\{162\} \\approx ([\d.]+)"),
    # L3 — BM25 worked example + PageRank + compression + RRF
    ("L3 D1 score",     r"\+ 0\.4700 \(dog\) = <strong>([\d.]+)</strong>\. D3"),
    ("L3 D3 score",     r"D3 = ([\d.]+) \(cat\) \+ 0 \(no"),
    ("L3 B D2dog",      r"B = 5/3\.875 = ([\d.]+)"),
    ("L3 idf nasa",     r"three documents \(idf = <strong>([\d.]+)</strong>\)"),
    ("L3 idf shut",     r"only two \(idf = <strong>([\d.]+)</strong>\)"),
    ("L3 q2 D2",        r"scores <strong>([\d.]+)</strong> and"),
    ("L3 q2 D3",        r"trails at ([\d.]+);"),
    ("L3 PR A",         r"PR = \(([\d.]+), 0\.3974, 0\.3878\)"),
    ("L3 PR B",         r"PR = \(0\.2148, ([\d.]+), 0\.3878\)"),
    ("L3 PR C",         r"PR = \(0\.2148, 0\.3974, ([\d.]+)\)"),
    ("L3 PR Bupd",      r"= 0\.0500 \+ 0\.4250 = ([\d.]+)\."),
    ("L3 gaps",         r"3, \+5, \+4, \+(\d+)</code>"),
    ("L3 raw bytes",    r"four 32-bit IDs is (\d+) bytes"),
    ("L3 RRF top",      r"1/61 \+ 1/61 \\approx ([\d.]+)", 1e-4),
    # L4 — graded nDCG + significance tests + online A/B
    ("L4 nDCG lin",     r"graded nDCG = ([\d.]+)</strong>"),
    ("L4 nDCG exp",     r"lands at <strong>([\d.]+)</strong>"),
    ("L4 t-stat",       r"paired t=([\d.]+),"),
    ("L4 p t-test",     r"t=2\.2753, p=([\d.]+);"),
    ("L4 p wilcox",     r"Wilcoxon W=25, p=([\d.]+);"),
    ("L4 p perm",       r"It happens ([\d.]+) of the time"),
    ("L4 CI lo",        r"true gain is \[([\d.]+), 0\.0772\]"),
    ("L4 CI hi",        r"true gain is \[0\.0023, ([\d.]+)\]"),
    ("L4 AB z",         r"0\.00469 ≈ ([\d.]+)\."),
    ("L4 AB p",         r"maps to p ≈ ([\d.]+) ", 1e-3),
    # L5 — cosines + PCA components + GloVe worked step + t-SNE affinities
    ("L5 cos cat·dog",  r"cosines 0\.861, ([\d.]+), 0\.3654"),
    ("L5 cos cat·air",  r"cosines 0\.861, 0\.9218, ([\d.]+)"),
    ("L5 cos kng·cmp",  r"king·computer just ([\d.]+)", 1e-3),
    ("L5 PCA PC1",      r"PC1 holds ([\d.]+)%"),
    ("L5 PCA PC2",      r"PC2 ([\d.]+)%"),
    ("L5G X count",     r"co-occur \\\(X = ([\d.]+)\\\)"),
    ("L5G logX",        r"\\log X = [−-]([\d.]+)"),
    ("L5G f(X)",        r"the weight is \\\(f = ([\d.]+)\\\)"),
    ("L5G model",       r"\(-0\.127\) = [−-]([\d.]+)"),
    ("L5G loss before", r"loss falls from \\\(([\d.]+)\\\)", 1e-2),
    ("L5G alpha",       r"\(6/10\)\^\{([\d.]+)\}"),
    ("L5T sigma svg",   r"\\sigma = ([\d.]+)\\\)"),
    ("L5T p dog",       r'"dog" gets \\\(p = ([\d.]+)\\\)'),
    ("L5T p puppy",     r'"puppy" \\\(([\d.]+)\\\)'),
    ("L5T p lion",      r'"lion" \\\(([\d.]+)\\\)'),
    ("L5T p kitten",    r'"kitten" \\\(([\d.]+)\\\)'),
    ("L5T q_ij",        r"q_\{ij\} = ([\d.]+)\\\)", 5e-4),
    ("L5T joint p_ij",  r"joint \\\(p_\{ij\} = ([\d.]+)\\\)"),
    ("L5T KL svg",      r"\\mathrm\{KL\} = ([\d.]+)\\\)"),
    # L6 — attention weights + DistilBERT stack (pinned to the "bank downtown" context)
    ("L6 √d_k var",     r"Divide by √d_k = ([\d.]+)"),
    ("L6 w[cat][cat]",  r"pours ([\d.]+) of its weight"),
    ("L6 out[cat][0]",  r"becomes ≈ \[([\d.]+), 1\.996"),
    ("L6 stack cos final", r'downtown"\) sit at cosine \\\(([\d.]+)\\\)'),
]
def book_claims():
    base = {c["id"]: c for c in claims()}
    out = []
    for entry in BOOK_ANCHORS:
        src, anchor = entry[0], entry[1]
        tol = entry[2] if len(entry) > 2 else base[src]["tol"]   # override where the Book rounds differently
        out.append(dict(id="book " + src, deck=base[src]["deck"], value=base[src]["value"],
                        tol=tol, anchor=anchor, must=True))
    # Book-ONLY prose numbers with no deck twin → value sourced STRAIGHT from data/ (the deck never shows them).
    # ch.6 within-sense cosine 0.9466 (two money-bank uses) is displayed only in the Book; it lives in
    # data/l6-contextual.json — gating it here makes that file a real consumer (its number drives the prose).
    out.append(dict(id="book L6 within-sense", deck="L6", value=CTX["cosines"]["withinSense"], tol=1e-4,
                    anchor=r'cheque"\) sit at \\\(([\d.]+)\\\), nearly on top', must=True))
    out += l7_book_claims()
    return out

# ── [C] L7 DECK claims: the cited reranker benchmarks the deck DISPLAYS (≥2-decimal → coverage-gated).
#    value sourced from data/l7-bench.json; anchored to the rendered deck tables (slides 31 & 33). These
#    values also COVER any Book restatement (coverage-guard's gated set is claims()+book_claims()). ──
def l7_deck_claims():
    R, L = BENCH7["rerankers"], BENCH7["llmRerankers"]
    C = lambda id, value, anchor: dict(id=id, deck="L7", value=value, tol=1e-4, anchor=anchor, must=True)
    return [
        # slide 31 — small cross-encoder MRR@10 (the L6≈L12, ~2× cost punchline)
        C("L7 rr L6 MRR",  R["miniLM6"]["mrrDev"],  r"<strong>([\d.]+)</strong> · 1800"),
        C("L7 rr L12 MRR", R["miniLM12"]["mrrDev"], r"<strong>([\d.]+)</strong> · 960"),
        # slide 33 — LLM-reranker nDCG@10 on TREC DL19
        C("L7 llm bm25",    L["bm25"],       r"<td>BM25</td><td>([\d.]+)</td>"),
        C("L7 llm monoT5",  L["monoT5_3b"],  r"<td>monoT5-3B</td><td>([\d.]+)</td>"),
        C("L7 llm gpt35",   L["gpt35"],      r"<td>GPT-3\.5 \(RankGPT\)</td><td>([\d.]+)</td>"),
        C("L7 llm gpt4",    L["gpt4"],       r"<td>GPT-4 \(RankGPT\)</td><td>([\d.]+)</td>"),
        C("L7 llm zephyr",  L["rankZephyr"], r"RankZephyr-7B</td><td>([\d.]+)</td>"),
    ]

# ── [C] L7 BOOK claims: the L7 chapter prose states every flagship number; gate each against data/.
#    Book-only (the deck restates them on its own slides, gated separately as those slides are authored).
#    value sourced STRAIGHT from data/l7-*.json + the reused l3/l4 callback files. Generic ([\d.]+)
#    capture pinned by stable surrounding literals → a drifted number is captured + flagged, not missed. ──
def l7_book_claims():
    C = lambda id, value, anchor, tol=1e-4: dict(id="book " + id, deck="L7", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # bi-encoder: toy cos 0.8165, real SBERT cosRel 0.6838 > cosIrr 0.4082
        C("L7 toy cosRel",  BIENC["toy"]["cosRel"],  r"\\sqrt6 \\approx \\mathbf\{([\d.]+)\}"),
        C("L7 real cosRel", BIENC["real"]["cosRel"], r"\\approx \\mathbf\{([\d.]+)\}\\\) versus"),
        C("L7 real cosIrr", BIENC["real"]["cosIrr"], r"\\approx \\mathbf\{([\d.]+)\}\\\): the"),
        # cross-encoder: toy σ 0.9168 / 0.2497
        C("L7 toy scoreRel", CROSSENC["toy"]["scoreRel"], r"\\sigma\(2\.4\)\\approx\\mathbf\{([\d.]+)\}"),
        C("L7 toy scoreNeg", CROSSENC["toy"]["scoreNeg"], r"\\sigma\(-1\.1\)\\approx\\mathbf\{([\d.]+)\}"),
        # cross-encoder real distractor: Scout 0.8434 vs 0.6875 (narrow), Judge 0.9998 vs 0.1159 (huge)
        C("L7 biCosRel", CROSSENC["contrast"]["biCosRel"], r"cosine \\\(\\mathbf\{([\d.]+)\}\\\) vs"),
        C("L7 biCosBad", CROSSENC["contrast"]["biCosBad"], r"vs \\\(\\mathbf\{([\d.]+)\}\\\), a"),
        C("L7 crossRel", CROSSENC["real"]["pairRel"]["score"], r"rates them \\\(\\mathbf\{([\d.]+)\}\\\) vs"),
        C("L7 crossBad", CROSSENC["real"]["pairBad"]["score"], r"\\mathbf\{0\.9998\}\\\) vs \\\(\\mathbf\{([\d.]+)\}"),
        # cascade: BM25 nDCG 0.6766 → reranked 0.9558
        C("L7 bm25Ndcg",   CASCADE["quality"]["bm25Ndcg"],     r"documents to <strong>nDCG@10 = ([\d.]+)</strong>"),
        C("L7 rerankNdcg", CASCADE["quality"]["rerankedNdcg"], r"improves to <strong>nDCG@10 = ([\d.]+)</strong>"),
        # MS MARCO subset: retrieve MRR 0.5482 → rerank MRR 0.6732
        C("L7 mm retrMrr",   MSMARCO["retrieve"]["mrrAt10"], r"retrieval <strong>MRR@10 = ([\d.]+)</strong>"),
        C("L7 mm rerankMrr", MSMARCO["rerank"]["mrrAt10"],   r"rises to <strong>([\d.]+)</strong>"),
        # callbacks (reused data files): L4 recall@3 0.25; BEIR 0.43/0.38; MS MARCO 0.187/0.33
        C("L7 cb recall@3", METRICS["recallAtK"]["3"],  r"recall@3 = ([\d.]+), recall"),
        C("L7 cb BEIR bm25", BENCH["beir"]["BM25"],     r"BM25 reaches nDCG@10 = ([\d.]+) and"),
        C("L7 cb BEIR dpr",  BENCH["beir"]["denseDPR"], r"denseDPR only ([\d.]+)</strong>"),
        C("L7 cb MM bm25",   BENCH["msmarco"]["BM25"],     r"BM25&amp;rsquo;s ([\d.]+)\."),
        C("L7 cb MM dpr",    BENCH["msmarco"]["denseDPR"], r"MRR@10 of ([\d.]+) beats"),
    ]

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

# ── L5 'Map of Meaning' [C] claims: every flagship embedding/dim-red number == data/l5-*.json ─────
# Same robustness contract as L3/L4: the captured group is a GENERIC number ([\d.]+) and the literal
# context pins the location, so a value that DRIFTS at that spot is matched and flagged (not silently
# NOT FOUND). The deck rounds data/ to 3 dp for cosines (0.9218→0.922) and 1 dp for variance %, so
# `value` is the data/ canonical and `tol`=1e-3 absorbs the display rounding while still catching real
# drift (a wrong second decimal moves the number far past 1e-3).
def l5_claims():
    pp = {(p["a"], p["b"]): p["cos"] for p in EMB["pairs"]}
    pca = DIMRED["pca"]
    return [
        # analogy king−man+woman→queen: answer cosine 0.861 (+ runner-up prince 0.764)
        dict(id="L5 analogy cos", deck="L5", value=EMB["analogy"]["answerCos"], tol=1e-3,
             anchor=r'queen</div><div class="arch-shape">\\\(\\cos = ([\d.]+)\\\)', must=True),
        dict(id="L5 runner-up",   deck="L5", value=round(EMB["analogy"]["top"][1]["cos"], 3), tol=1e-3,
             anchor=r"queen 0\.861 &middot; prince ([\d.]+) &middot; throne", must=True),
        # capital paris−france+italy→rome: 0.838
        dict(id="L5 capital cos", deck="L5", value=EMB["capitalAnalogy"]["top"][0]["cos"], tol=1e-3,
             anchor=r'<td class="cell-good"><code>rome</code></td><td class="cell-good">([\d.]+)</td>', must=True),
        # pairwise cosines (the headline "nearness = meaning" table)
        dict(id="L5 cos cat·dog", deck="L5", value=pp[("cat", "dog")], tol=1e-3,
             anchor=r'<code>cat &middot; dog</code></td><td class="cell-good">([\d.]+)</td>', must=True),
        dict(id="L5 cos cat·kit", deck="L5", value=pp[("cat", "kitten")], tol=1e-3,
             anchor=r'<code>cat &middot; kitten</code></td><td>([\d.]+)</td>', must=True),
        dict(id="L5 cos cat·air", deck="L5", value=pp[("cat", "airplane")], tol=1e-3,
             anchor=r'<code>cat &middot; airplane</code></td><td class="cell-bad">([\d.]+)</td>', must=True),
        dict(id="L5 cos kng·qn",  deck="L5", value=pp[("king", "queen")], tol=1e-3,
             anchor=r'<code>king &middot; queen</code></td><td>([\d.]+)</td>', must=True),
        dict(id="L5 cos kng·cmp", deck="L5", value=pp[("king", "computer")], tol=1e-3,
             anchor=r'<code>king &middot; computer</code></td><td class="cell-bad">([\d.]+)</td>', must=True),
        # PCA 2-D explained variance: PC1 19.6% + PC2 18.1% = 37.7% (data ratios ×100)
        dict(id="L5 PCA PC1",     deck="L5", value=round(pca["explainedVarRatio"][0]*100, 1), tol=0.05,
             anchor=r"→ PC1 ([\d.]+)% \+ PC2 18\.1% = 37\.7%", must=True),
        dict(id="L5 PCA PC2",     deck="L5", value=round(pca["explainedVarRatio"][1]*100, 1), tol=0.05,
             anchor=r"→ PC1 19\.6% \+ PC2 ([\d.]+)% = 37\.7%", must=True),
        dict(id="L5 PCA 2-D",     deck="L5", value=pca["var2dPct"], tol=0.05,
             anchor=r"→ PC1 19\.6% \+ PC2 18\.1% = ([\d.]+)%", must=True),
        # dataset shape: 44 words, 7 clusters, t-SNE perplexity 14
        dict(id="L5 nWords",      deck="L5", value=DIMRED["nWords"], tol=0,
             anchor=r"PCA на ([\d.]+) словах", must=True),
        dict(id="L5 nClusters",   deck="L5", value=len(DIMRED["clusters"]), tol=0,
             anchor=r"нарисованная: ([\d.]+) кластеров", must=True),
        # the 44-word map's t-SNE perplexity = 14 (l5-dimred.json). NOTE the anchor is pinned to the
        # "44 words" kicker: the deck now ALSO shows perplexity \(=5\) on the 9-word t-SNE-math slides
        # (l5-tsne-math.json, checked separately below), so a bare `perplexity \(=…\)` regex would
        # collide on the 5 and false-flag. The "44 слова · " prefix is unique to slide 42.
        dict(id="L5 perplexity",  deck="L5", value=DIMRED["tsne"]["perplexity"], tol=0,
             anchor=r"44 слова · perplexity \\\(=([\d.]+)\\\)", must=True),
    ] + l5_glove_claims() + l5_tsne_claims() + l5_enrichment_claims()

# ── L5 GloVe [C] claims (slides 30 "GloVe co-occurrence" + 31 "GloVe objective") == data/l5-glove.json ─
# Same robustness contract as L3/L4/L5: the captured group is a GENERIC number and the literal context
# (chip labels, the other numbers in the same expression, the SVG x/y coords) pins the location, so a
# value that DRIFTS is matched and flagged (not silently NOT FOUND). The deck rounds the worked
# king·queen pair to 3 dp (X 0.6667→0.667, log X −0.4055→−0.406, f 0.1312→0.131, model −0.4076→−0.408)
# and the loss to 2 dp (18.0391→18.04); `value` is the data/ canonical, `tol` absorbs that rounding.
def l5_glove_claims():
    g  = GLOVE
    kq = next(w for w in g["worked"] if w["i"] == "king" and w["j"] == "queen")
    N  = r"([\d.]+)"
    return [
        # the worked king·queen entry — the four flagship chips on slide 31 (X, log X, f(X), model)
        dict(id="L5G X count",   deck="L5", value=round(kq["X"], 3), tol=1e-3,
             anchor=r'<span class="gob-clab">X \(count\)</span><span class="gob-cval">'+N+r"</span>", must=True),
        dict(id="L5G logX",      deck="L5", value=round(-kq["logX"], 3), tol=1e-3,  # chip prints &minus;0.406
             anchor=r'<span class="gob-clab">log X \(target\)</span><span class="gob-cval">&minus;'+N+r"</span>", must=True),
        dict(id="L5G f(X)",      deck="L5", value=round(kq["f"], 3), tol=1e-3,
             anchor=r'<span class="gob-clab">f\(X\) \(weight\)</span><span class="gob-cval">'+N+r"</span>", must=True),
        dict(id="L5G model",     deck="L5", value=round(-kq["model"], 3), tol=1e-3,  # chip prints &minus;0.408
             anchor=r'<span class="gob-clab">model \(fit\)</span><span class="gob-cval">&minus;'+N+r"</span>", must=True),
        # the same king·queen X echoed in the slide-30 matrix callout
        dict(id="L5G X callout", deck="L5", value=round(kq["X"], 3), tol=1e-3,
             anchor=r'<text x="700" y="228"[^>]*>X = '+N+r"</text>", must=True),
        # loss collapse 18.04 → 0.005 (−99.97% over 600 AdaGrad iters), slide 31 (re-laid-out inset).
        # ROBUST anchors: pin on a STABLE nearby TEXTUAL label + the number (not the old exact
        # <tspan fill=…/font-weight=…> chain, which the enrichment rewrote). "least-squares loss:" is
        # the inset's caption label; "18.04\to" is the math-prose collapse transition (RU+EN); the drop
        # rides the "% over 600 AdaGrad iters" trailing label — all survive a future re-layout.
        dict(id="L5G loss before",deck="L5", value=g["loss"]["before"], tol=1e-2,
             anchor=r"least-squares loss:.{0,80}?>"+N+r"</tspan>", must=True),
        dict(id="L5G loss after", deck="L5", value=g["loss"]["after"], tol=1e-4,
             anchor=r"18\.04\\to"+N+r"\\", must=True),
        dict(id="L5G drop %",     deck="L5", value=g["loss"]["dropPct"], tol=1e-2,
             anchor=r"\("+N+r"% over 600 AdaGrad iters\)", must=True),
        # weighting hyper-params: x_max=10 (amber marker) and α=0.75 (the f(x) exponent, both langs)
        dict(id="L5G x_max",      deck="L5", value=g["xMax"], tol=0,
             anchor=r'<text x="455.5" y="556"[^>]*>x_max='+N+r"</text>", must=True),
        dict(id="L5G alpha",      deck="L5", value=g["alpha"], tol=1e-9,
             anchor=r"f\(x\)=\(x/x_\{\\max\}\)\^\{"+N+r"\}", must=True),
    ]

# ── L5 t-SNE [C] claims (slides 43 "t-SNE affinities" + 44 "t-SNE objective") == data/l5-tsne-math.json ─
# Same contract. The deck rounds: σ to 3 dp (2.003), the conditional p_{j|i} row to 3 dp (dog 0.405,
# puppy 0.196, lion 0.140, kitten 0.136, throne 0.003), the high-D squared distances to 2 dp (dog 3.55,
# throne 43.88), KL to 4 dp (0.0411); the symmetrised joint p_ij (0.0454) and Student-t q_ij (0.06039)
# are bound verbatim in the slide-44 JS arrays (literal in the HTML source, like the slide-30/31 arrays).
def l5_tsne_claims():
    t = TSNE
    c = t["conditional"]
    N = r"([\d.]+)"
    return [
        # σ ≈ 2.003 (SVG annotation + the step-2 caption, both anchored)
        dict(id="L5T sigma svg",  deck="L5", value=c["sigma"], tol=1e-3,
             anchor=r'<tspan font-weight="700">&#963; = '+N+r"</tspan>", must=True),
        dict(id="L5T sigma cap",  deck="L5", value=c["sigma"], tol=1e-3,
             anchor=r"here \\\(\\sigma\\approx"+N+r"\\\)", must=True),
        # perplexity = 5 (the tuning target): the SVG annotation + the slide-43 kicker
        dict(id="L5T perp svg",   deck="L5", value=c["perplexity"], tol=0,
             anchor=r'<tspan>the row has </tspan><tspan font-weight="700">perplexity = '+N+r"</tspan>", must=True),
        dict(id="L5T perp kick",  deck="L5", value=t["targetPerplexity"], tol=0,
             anchor=r"anchor <code>cat</code> · perplexity \\\(="+N+r"\\\)", must=True),
        # the anchor's Gaussian conditional p_{j|i} row (the headline affinities, slide-43 caption)
        dict(id="L5T p dog",      deck="L5", value=round(c["pRow"][2], 3), tol=1e-3,
             anchor=r"\. <code>dog</code> \\\("+N+r"\\\), <code>puppy</code> \\\(0\.196", must=True),
        dict(id="L5T p puppy",    deck="L5", value=round(c["pRow"][3], 3), tol=1e-3,
             anchor=r"<code>dog</code> \\\(0\.405\\\), <code>puppy</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p lion",     deck="L5", value=round(c["pRow"][4], 3), tol=1e-3,
             anchor=r"<code>puppy</code> \\\(0\.196\\\), <code>lion</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p kitten",   deck="L5", value=round(c["pRow"][1], 3), tol=1e-3,
             anchor=r"<code>lion</code> \\\(0\.140\\\), <code>kitten</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p throne",   deck="L5", value=round(c["pRow"][8], 3), tol=1e-3,
             anchor=r"<code>kitten</code> \\\(0\.136\\\), … <code>throne</code> \\\("+N+r"\\\)", must=True),
        # the dog/throne worked numbers in the slide-43 low-D box (p_{j|i} → q, both displayed)
        dict(id="L5T near p svg", deck="L5", value=round(c["pRow"][2], 3), tol=1e-3,
             anchor=r'<tspan fill="var\(--accent-ink\)">dog</tspan><tspan>  \(near\): p='+N, must=True),
        dict(id="L5T near q svg", deck="L5", value=round(t["lowD"]["Q"][0][2], 3), tol=1e-3,
             anchor=r"\(near\): p=0\.405  &rarr;  q="+N, must=True),
        dict(id="L5T far p svg",  deck="L5", value=round(c["pRow"][8], 3), tol=1e-3,
             anchor=r'<tspan fill="var\(--ink-3\)">throne</tspan><tspan> \(far\):  p='+N, must=True),
        # high-D squared distances cat→dog (3.55) and cat→throne (43.88), slide-43 step-0 caption
        dict(id="L5T d2 dog",     deck="L5", value=round(t["highD"]["anchorSqDist"][2], 2), tol=5e-3,
             anchor=r"nearest \(\\\(d\^2="+N+r"\\\)\)", must=True),
        dict(id="L5T d2 throne",  deck="L5", value=round(t["highD"]["anchorSqDist"][8], 2), tol=5e-3,
             anchor=r"farthest \(\\\("+N+r"\\\)\)", must=True),
        # the symmetrised joint p_ij and Student-t q_ij for cat–dog (slide-44 JS arrays, index 1)
        dict(id="L5T joint p_ij", deck="L5", value=t["joint"]["P"][0][2], tol=1e-4,
             anchor=r"var p=\[0\.022072, "+N+r",", must=True),
        dict(id="L5T q_ij",       deck="L5", value=t["lowD"]["Q"][0][2], tol=1e-5,
             anchor=r"var q=\[0\.011766, "+N+r",", must=True),
        # KL(P‖Q) ≈ 0.0411 — the single cost number (SVG annotation + the step-1 KaTeX caption)
        dict(id="L5T KL svg",     deck="L5", value=round(t["kl"], 4), tol=1e-4,
             anchor=r"KL\(P‖Q\) = &#931; p log\(p/q\) = "+N, must=True),
        dict(id="L5T KL cap",     deck="L5", value=round(t["kl"], 4), tol=1e-4,
             anchor=r"\\frac\{p_\{ij\}\}\{q_\{ij\}\}=\\mathbf\{"+N+r"\}", must=True),
    ]

# ── L5 ENRICHMENT [C] claims: the re-laid-out slides now DISPLAY two new trajectories the gate must pin
#    so they cannot silently drift — (1) the word2vec/SGNS training-loss endpoints 4.85→2.63 (the new
#    "watch it train" slide) and (2) the REAL-UMAP dials n_neighbors=10, min_dist=0.1 and the
#    within/between tightness collapse 0.147→0.061 (the new UMAP slide). Same robustness contract as the
#    rest of L5: a GENERIC captured number with a STABLE nearby textual label (narrative phrase / KaTeX
#    caption / kicker dial) pinning the spot, so a drift is matched + flagged (not silently NOT FOUND).
#    `value` is the data/ canonical; the deck rounds the losses/tightness to 2–3 dp, `tol` absorbs that.
def l5_enrichment_claims():
    w, u = W2V, UMAP
    p = u["params"]
    snap = {s["epoch"]: s for s in u["snapshots"]}
    N = r"([\d.]+)"
    return [
        # word2vec/SGNS loss curve endpoints: 4.85 (random init) → 2.63 (epoch 150, −46%)
        dict(id="L5W loss before", deck="L5", value=w["loss"]["before"], tol=1e-2,
             anchor=r"loss "+N+r" (?:&rarr;|→) 2\.63", must=True),
        dict(id="L5W loss after",  deck="L5", value=w["loss"]["after"],  tol=1e-2,
             anchor=r"loss \\\("+N+r"\\\), &minus;46%", must=True),
        # REAL-UMAP dials shown in the slide kicker (n_neighbors = perplexity analogue; min_dist packing)
        dict(id="L5U n_neighbors", deck="L5", value=p["nNeighbors"], tol=0,
             anchor=r"n_neighbors="+N+r" ", must=True),
        dict(id="L5U min_dist",    deck="L5", value=p["minDist"], tol=1e-9,
             anchor=r"min_dist="+N+r" ", must=True),
        # within/between tightness collapse 0.147 → 0.061 over the 500-epoch optimisation (init→converged)
        dict(id="L5U tightness init", deck="L5", value=round(snap[0]["tightness"], 3), tol=1e-3,
             anchor=r"drops \\\("+N+r"\\to0\.061\\\)", must=True),
        dict(id="L5U tightness final",deck="L5", value=round(snap[500]["tightness"], 3), tol=1e-3,
             anchor=r"drops \\\(0\.147\\to"+N+r"\\\)", must=True),
    ]

# ── L6 'Council of Attention' [C] claims: every flagship transformer number == data/l6-*.json ─────
# Same robustness contract. The attention weights/output the deck displays are the row for `cat`
# (weights[1], output[1]); the full weight matrix's other two rows are also shown (the/sat). The
# triplet margin (0.2) is NOT displayed numerically in the deck (only symbolic m), so it is a [P]
# cross-file check below, not a [C] claim.
def l6_claims():
    w = ATTN["weights"]
    neg = CONTRA["sims"]["negatives"]
    return [
        # scaled dot-product scale √d_k = 2.0 (d_k=4): shown in the var-block and the prose
        dict(id="L6 √d_k var",    deck="L6", value=ATTN["sqrtdk"], tol=1e-9,
             anchor=r'<span lang="en">here \\\(=([\d.]+)\\\)</span>', must=True),
        dict(id="L6 √d_k prose",  deck="L6", value=ATTN["sqrtdk"], tol=1e-9,
             anchor=r"so \\\(\\sqrt\{d_k\}=([\d.]+)\\\)", must=True),
        # full softmax attention matrix — every displayed row (each sums to 1)
        dict(id="L6 w[the][0]",   deck="L6", value=w[0][0], tol=1e-3,
             anchor=r"\\\(\[([\d.]+),\\,0\.155,\\,0\.422\]\\\)", must=True),
        dict(id="L6 w[cat][cat]", deck="L6", value=w[1][1], tol=1e-3,
             anchor=r"puts <strong>([\d.]+)</strong> on itself", must=True),
        dict(id="L6 w[sat][sat]", deck="L6", value=w[2][2], tol=1e-3,
             anchor=r"\\\(\[0\.212,\\,0\.212,\\,([\d.]+)\]\\\)", must=True),
        # cat's output (context) vector = output[1] = [0.579, 1.996, 0.91, 0.425]
        dict(id="L6 out[cat][0]", deck="L6", value=ATTN["output"][1][0], tol=1e-3,
             anchor=r"<code>out = \[([\d.]+), 1\.996, 0\.91, 0\.425\]</code>", must=True),
        # InfoNCE: positive softmax prob 0.8877 and loss −log = 0.1191. Slide 47/48 is now a dynamic
        # InfoNCE diagram (re-laid-out), so we ROBUSTLY anchor on the STABLE KaTeX labels rather than
        # the old div/step-caption markup chain: p⁺ rides its symbol `\(p^{+}=N\)`, and the loss rides
        # the `\mathcal{L}=-\log … =\mathbf{N}` identity — both survive a re-layout of the surrounding box.
        dict(id="L6 InfoNCE p+",  deck="L6", value=CONTRA["infoNCE"]["pPositive"], tol=1e-4,
             anchor=r"\\\(p\^\{\+\}=([\d.]+)\\\)", must=True),
        dict(id="L6 InfoNCE loss",deck="L6", value=CONTRA["infoNCE"]["loss"], tol=1e-4,
             anchor=r"\\mathcal\{L\}=-\\log[^=]*=\\mathbf\{([\d.]+)\}", must=True),
        # temperature τ = 0.1 (shown in the E2E kicker)
        dict(id="L6 τ",           deck="L6", value=CONTRA["tau"], tol=1e-9,
             anchor=r"positive <code>kitten</code>, \\\(\\tau=([\d.]+)\\\)", must=True),
        # contrastive cosines to anchor cat — the two negatives not shared with L5's pair table
        dict(id="L6 cos cmp",     deck="L6", value=neg["computer"], tol=1e-3,
             anchor=r'<code>computer</code></td><td>[^<]*<span lang="ru">[^<]*</span><span lang="en">[^<]*</span></td><td class="cell-bad">([\d.]+)</td>', must=True),
        dict(id="L6 cos france",  deck="L6", value=neg["france"], tol=1e-3,
             anchor=r'<code>france</code></td><td>[^<]*<span lang="ru">[^<]*</span><span lang="en">[^<]*</span></td><td class="cell-bad">([\d.]+)</td>', must=True),
    ] + l6_enrichment_claims()

# ── L6 ENRICHMENT [C] claims: the re-laid-out slides now DISPLAY two new trajectories the gate must pin
#    so they cannot silently drift — (1) the slide-41 DistilBERT "same word, two senses" fan: the
#    cross-sense cosine of `bank`(river) vs `bank`(money) starting near-identical at the embed layer
#    (0.957) and DRIFTING apart to the final-block value (0.647); and (2) the slide-47 dynamic InfoNCE
#    diagram's loss trajectory endpoints 3.31 → … → 0.1191 (the tuned endpoint 0.1191 is already the
#    canonical InfoNCE loss, here pinned as the END of the animated curve too). Same robustness contract:
#    a GENERIC captured number with a STABLE textual label pinning the spot (the SVG caption phrase / the
#    KaTeX `\mathcal{L}=N` / the diagram's aria narrative). `value` is the data/ canonical, `tol` absorbs
#    the deck's display rounding (the fan prints 4 dp → 3 dp; the trajectory prints 2 dp / the exact loss).
def l6_enrichment_claims():
    s, ct = STACK, CTRAJ
    cp = {c["name"]: c for c in ct["checkpoints"]}
    N = r"([\d.]+)"
    return [
        # slide-41 cross-sense cos(bank,bank): embed-layer (block 0) ≈ 0.957 → final block ≈ 0.647
        # `value` is the data/ canonical (raw, un-rounded); `tol`=1e-3 absorbs the deck's 3-dp display
        # rounding (0.9572→0.957, 0.6465→0.647) while still catching a real drift in the 2nd/3rd decimal.
        dict(id="L6 stack cos init",  deck="L6", value=s["crossSenseCosByLayer"][0], tol=1e-3,
             anchor=r"cross-sense cos\(bank, bank\) = "+N, must=True),
        dict(id="L6 stack cos final", deck="L6", value=s["finalCrossSenseCos"], tol=1e-3,
             anchor=r"final: cos = "+N+r"  &mdash;", must=True),
        # slide-47 InfoNCE loss-trajectory endpoints: untuned 3.31 → tuned 0.1191 (the animated curve)
        dict(id="L6 traj loss start", deck="L6", value=cp["untuned"]["loss"], tol=1e-2,
             anchor=r"loss is high: \\\(\\mathcal\{L\}="+N+r"\\\)", must=True),
        dict(id="L6 traj loss end",   deck="L6", value=cp["tuned"]["loss"], tol=1e-4,
             anchor=r"InfoNCE loss falls from 3\.31 to 0\.86 to "+N+r"\.", must=True),
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

# ── [G] COVERAGE GUARD — the facts-gate AUTO-EXTENDS to new content (no NEW un-gated displayed number) ──
# A ratchet (mirrors _audit/font-gate.mjs): every "grounded" number a deck/Book DISPLAYS that is not
# value-covered by a [C] claim is counted PER SURFACE; the count may not EXCEED the frozen baseline below.
# Adding an un-gated number to an existing unit — or ANY un-gated number to a NEW unit (L7…, whose baseline
# defaults to 0) — bumps the count → HARD, forcing the author to either gate it (add a [C] claim → the number
# becomes covered and the count drops) or, if it is genuinely NOT data (a math constant, an illustration),
# raise that surface's baseline here with a one-line why. Burn the baseline DOWN over time by gating the
# worked intermediates. This is what makes correctness scale to new content as cheaply as publication.
#
# Surface = the SAME displayed-text surface the [C] anchors match: tags stripped (so SVG geometry attrs
# x=/y=/cx=/height=… are excluded — those are not "displayed numbers") while prose + KaTeX digits are kept.
# "Grounded" = a decimal with ≥2 fractional digits; arXiv ids (1901.04085) and leading-zero dates (03.06)
# are excluded (not numbers in the data sense). "Covered" = within max(claim-tol, 0.001) of a gated value —
# i.e. the displayed number IS, to display precision, a gated value (a coincidental match needs a value
# within 1e-3; a genuinely new data-number, e.g. an L7 cosine 0.7531, is not and so HARD-fails until gated).
COVERAGE_BASELINE = {
    # L3–L6 deck/book baselines TIGHTENED after L7: the L7 callback claims (BEIR 0.43/0.38, MS MARCO
    # 0.187/0.33, L4 recall@k, etc.) are value-gated globally, so they now ALSO cover some numbers those
    # earlier units displayed but had not gated — the un-gated count dropped, so the ratchet is lowered to
    # match (strictly stronger; never raised). New units (L7) stay at 0 via .get(surf, 0).
    "deck:L0": 0, "deck:L1": 2, "deck:L2": 10, "deck:L3": 54, "deck:L4": 45, "deck:L5": 55, "deck:L6": 37,
    "book:L0": 0, "book:L1": 1, "book:L2": 8,  "book:L3": 17, "book:L4": 23, "book:L5": 13, "book:L6": 11,
}
_COV_DEC   = re.compile(r'(?<![\d.])\d+\.\d{2,}(?!\d)')   # grounded signature: a decimal, ≥2 fractional digits
_COV_ARXIV = re.compile(r'^\d{4}\.\d{4,}$')               # arXiv id (e.g. 1901.04085) — not data
_COV_DATE  = re.compile(r'^0\d+\.')                       # leading-zero date (e.g. 03.06) — not data

def _coverage_visible(html):
    t = re.sub(r'<aside class="slide-notes".*?</aside>', ' ', html, flags=re.S)   # speaker notes: not shown
    t = re.sub(r'<style.*?</style>|<script.*?</script>', ' ', t, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', t)

def _coverage_uncovered(html, gated):
    out = set()
    for m in _COV_DEC.finditer(_coverage_visible(html)):
        s = m.group()
        if _COV_ARXIV.match(s) or _COV_DATE.match(s):
            continue
        d = float(s)
        if not any(abs(d - v) <= max(tol, 0.001) for v, tol in gated):
            out.add(s)
    return out

def coverage_guard(report, text, book):
    gated = [(float(c["value"]), float(c.get("tol", 1e-3))) for c in claims()] \
          + [(float(c["value"]), float(c.get("tol", 1e-3))) for c in book_claims()]
    surfaces = {f"deck:{k}": v for k, v in text.items()}
    surfaces.update({f"book:{k}": v for k, v in book.items()})   # book empty if docs/ not built → skipped
    hard = 0
    for surf in sorted(surfaces):
        n = len(_coverage_uncovered(surfaces[surf], gated))
        base = COVERAGE_BASELINE.get(surf, 0)   # a NEW unit (not in the baseline) starts at 0 → must gate
        if n > base:
            hard += 1
            report.append(("HARD", f"coverage-guard({surf}): {n} un-gated displayed number(s) > baseline {base} — "
                                   f"gate the new number (add a [C] claim) or raise this surface's baseline with a why"))
        elif n < base and surf in COVERAGE_BASELINE:
            report.append(("WARN", f"coverage-guard({surf}): {n} < baseline {base} — tighten COVERAGE_BASELINE to {n}"))
    if not hard:
        total = sum(len(_coverage_uncovered(surfaces[s], gated)) for s in surfaces)
        report.append(("OK", f"coverage-guard: {len(surfaces)} surfaces ≤ baseline; {total} grandfathered un-gated "
                             f"number(s) — a NEW number, or any number in a NEW unit (baseline 0), HARD-fails until gated ✓"))

# ── [P] PROVENANCE (L7 self-consistency): gen_l7 emits data/ directly (no RAW twin), so — like L3–L6 —
#    we recompute the stdlib-reproducible toy numbers and pin cross-file + structural invariants. ──
def provenance_l7(report):
    bt, br = BIENC["toy"], BIENC["real"]
    ct, cc, cr = CROSSENC["toy"], CROSSENC["contrast"], CROSSENC["real"]
    q, m = CASCADE["quality"], MSMARCO
    checks = [
        # toy stdlib-reproducible: cos = dot/(|q||d|) = 2/√6 ; score = sigmoid(logit)
        ("toy.cosRel",   bt["cosRel"],   round(2 / math.sqrt(6), 4), 1e-4),
        ("toy.scoreNeg", ct["scoreNeg"], round(1 / (1 + math.exp(-ct["logitNeg"])), 4), 1e-4),
        # cross-path: the cascade BM25 nDCG re-uses the L4 honest nDCG (same number, two files)
        ("cascade.bm25==l4", q["bm25Ndcg"], METRICS["ndcg"], 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L7({name}): data/ disagree/invariant broken — {a} vs {b}"))
    flags = []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L7({name}): structural invariant broken"))
    need(bt["cosRel"] > bt["cosIrr"], "toy cosRel>cosIrr")
    need(br["cosRel"] > br["cosIrr"], "real cosRel>cosIrr")
    need(ct["scoreRel"] > ct["scoreNeg"], "toy scoreRel>scoreNeg")
    need(cr["pairRel"]["score"] > cr["pairBad"]["score"], "real Judge separates pairRel>pairBad")
    need(cc["biCosBad"] > cr["pairBad"]["score"], "Scout over-rates: biCosBad>crossScoreBad")
    need((cc["crossScoreRel"] - cc["crossScoreBad"]) > (cc["biCosRel"] - cc["biCosBad"]), "Judge gap>Scout gap")
    need(q["bm25Ndcg"] < q["rerankedNdcg"] <= q["idealNdcg"], "bm25<reranked<=ideal")
    need(CASCADE["stages"][0]["w"] > CASCADE["stages"][1]["w"] > CASCADE["stages"][2]["w"], "cascade narrowing")
    need(m["retrieve"]["recallAt"]["100"] >= m["retrieve"]["recallAt"]["10"], "recall monotone")
    need(m["rerank"]["mrrAt10"] > m["retrieve"]["mrrAt10"], "rerank improves MRR")
    need((bt["cosRel"] - bt["cosIrr"]) * (br["cosRel"] - br["cosIrr"]) > 0, "toy<->real sign agree")
    if not bad and not flags:
        report.append(("OK", f"provenance-L7: {len(checks)} recompute + 11 structural invariants consistent ✓"))


def main():
    text = {k: p.read_text() for k, p in DECKS.items()}
    book = load_book()                              # built Book HTML (empty if docs/ not built)
    report = []
    provenance_checks(report)                       # [P] data/ == generator
    provenance_l3l4(report)                         # [P] L3/L4 cross-file data self-consistency
    provenance_l5l6(report)                         # [P] L5/L6 cross-file + data-only pins
    provenance_l5_glove_tsne(report)                # [P] L5 GloVe + t-SNE-math cross-file + data-only pins
    provenance_l2_tokenizers(report)                # [P] L2 tokenizer-compare counts/ranking/segmentation
    provenance_enrichment(report)                   # [P] L5/L6 enrichment trajectory cross-file + data-only pins
    provenance_l6_nce(report, text.get("L6", ""))   # [P] L6 InfoNCE softmax BARS == softmax(traj.logits)·H (R8 data-bind)
    provenance_l7(report)                            # [P] L7 toy-recompute + cross-file + structural pins
    for c in claims():                              # [C] deck == data/
        report.append(check_claim(c, text[c["deck"]]))
    if book:                                        # [C] Book == data/ (the Book restates the flagship numbers)
        nbk = sum(1 for c in book_claims() if c["deck"] in book)
        for c in book_claims():
            if c["deck"] in book:
                report.append(check_claim(c, book[c["deck"]]))
        report.append(("OK", f"book: {nbk} Book-prose numbers gated against data/ ✓"))
    else:
        report.append(("WARN", "Book not built (docs/ absent) — Book [C] claims skipped; run `npm run build`"))
    # [A] recompute: deck fractions + (any) Book fractions, in one pass.
    arithmetic_checks(report, {**text, **{"book " + k: v for k, v in book.items()}})
    coverage_guard(report, text, book)              # [G] no NEW un-gated displayed number (auto-extends to L7…)
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
    # L5 [C]: a deck snippet where the analogy cosine drifted must flag DRIFT (anchor is not blind).
    cL5 = next(x for x in claims() if x["id"] == "L5 analogy cos")
    bL5 = r'queen</div><div class="arch-shape">\(\cos = 0.123\)'  # wrong: data/ says 0.861
    sevL5, msgL5 = check_claim(cL5, bL5)
    okL5 = sevL5 == "HARD" and "DRIFT" in msgL5
    print("[selftest:L5]", msgL5)
    # L6 [C]: a deck snippet where the InfoNCE loss drifted must flag DRIFT.
    cL6 = next(x for x in claims() if x["id"] == "L6 InfoNCE loss")
    bL6 = r'$$\mathcal{L}=-\log(0.8877)=\mathbf{0.9999}$$'  # wrong: data/ loss is 0.1191
    sevL6, msgL6 = check_claim(cL6, bL6)
    okL6 = sevL6 == "HARD" and "DRIFT" in msgL6
    print("[selftest:L6]", msgL6)
    # L5/L6 [P]: a shared cosine drifting between l5-embeddings.json and l6-contrastive.json must flag.
    rep4 = []
    savedC = CONTRA["sims"]["positives"]["dog"]
    CONTRA["sims"]["positives"]["dog"] = 0.1234            # break the l5↔l6 shared cat·dog cosine
    provenance_l5l6(rep4)
    CONTRA["sims"]["positives"]["dog"] = savedC
    okP3 = any(s == "HARD" and "provenance-L5L6" in m for s, m in rep4)
    print("[selftest:prov-L5L6]", next((m for s, m in rep4 if s == "HARD"), "provenance-L5L6: NO FLAG"))
    # L5/L6 [P] data-only pin: a silent edit to the (never-displayed) triplet margin must still flag.
    rep5 = []
    savedM = CONTRA["margin"]
    CONTRA["margin"] = 0.5
    provenance_l5l6(rep5)
    CONTRA["margin"] = savedM
    okP4 = any(s == "HARD" and "contra.margin" in m for s, m in rep5)
    print("[selftest:prov-L5L6-pin]", next((m for s, m in rep5 if s == "HARD"), "provenance-L5L6 pin: NO FLAG"))
    # L5 GloVe [C]: a deck snippet where the king·queen log X chip drifted must flag DRIFT.
    cGX = next(x for x in claims() if x["id"] == "L5G logX")
    bGX = r'<span class="gob-clab">log X (target)</span><span class="gob-cval">&minus;0.999</span>'  # data/ −0.406
    sevGX, msgGX = check_claim(cGX, bGX)
    okGX = sevGX == "HARD" and "DRIFT" in msgGX
    print("[selftest:L5G]", msgGX)
    # L5 t-SNE [C]: a deck snippet where the KL number drifted must flag DRIFT.
    cTK = next(x for x in claims() if x["id"] == "L5T KL svg")
    bTK = r'KL(P‖Q) = &#931; p log(p/q) = 0.9999'  # data/ KL is 0.0411
    sevTK, msgTK = check_claim(cTK, bTK)
    okTK = sevTK == "HARD" and "DRIFT" in msgTK
    print("[selftest:L5T-KL]", msgTK)
    # L5 t-SNE [C]: a deck snippet where σ / perplexity drifted must flag DRIFT (anchor is not blind).
    cTS = next(x for x in claims() if x["id"] == "L5T sigma svg")
    bTS = r'<tspan font-weight="700">&#963; = 9.999</tspan>'  # data/ σ is 2.003
    sevTS, msgTS = check_claim(cTS, bTS)
    cTP = next(x for x in claims() if x["id"] == "L5T perp kick")
    bTP = r'anchor <code>cat</code> · perplexity \(=99\)'  # data/ perplexity is 5
    sevTP, msgTP = check_claim(cTP, bTP)
    okTS = sevTS == "HARD" and "DRIFT" in msgTS and sevTP == "HARD" and "DRIFT" in msgTP
    print("[selftest:L5T-σ]", msgTS, "|", msgTP)
    # L5 GloVe/t-SNE [P]: a drifted king·queen log X identity AND a drifted KL field must flag (in-memory).
    rep6 = []
    savedKQ = GLOVE["worked"][0]["logX"]
    GLOVE["worked"][0]["logX"] = 0.9999            # break the king·queen log X = ln(X) structural identity
    provenance_l5_glove_tsne(rep6)
    GLOVE["worked"][0]["logX"] = savedKQ
    okP5 = any(s == "HARD" and "provenance-L5GT(glove.kq.logX)" in m for s, m in rep6)
    print("[selftest:prov-L5GT-glove]", next((m for s, m in rep6 if s == "HARD"), "provenance-L5GT glove: NO FLAG"))
    rep7 = []
    savedKL = TSNE["kl"]
    TSNE["kl"] = 0.9999                            # break the KL field vs recomputed-from-P,Q invariant
    provenance_l5_glove_tsne(rep7)
    TSNE["kl"] = savedKL
    okP6 = any(s == "HARD" and "provenance-L5GT(tsne.kl)" in m for s, m in rep7)
    print("[selftest:prov-L5GT-kl]", next((m for s, m in rep7 if s == "HARD"), "provenance-L5GT kl: NO FLAG"))
    # L5 t-SNE [P] data-only pin: a silent edit to the (never-displayed) entropy=log₂(perplexity) bits must flag.
    rep8 = []
    savedE = TSNE["conditional"]["entropyBits"]
    TSNE["conditional"]["entropyBits"] = 3.5       # break entropy = log₂5 ≈ 2.322 and perplexity = 2^entropy
    provenance_l5_glove_tsne(rep8)
    TSNE["conditional"]["entropyBits"] = savedE
    okP7 = any(s == "HARD" and "provenance-L5GT(tsne." in m for s, m in rep8)
    print("[selftest:prov-L5GT-pin]", next((m for s, m in rep8 if s == "HARD"), "provenance-L5GT pin: NO FLAG"))
    # L2 tokenizer-compare [P]: a drifted token COUNT must flag (count no longer equals len(tokens)).
    rep9 = []
    bpe_rec = next(t for t in TOK["tokenizers"] if t["name"] == "BPE")
    savedN = bpe_rec["count"]
    bpe_rec["count"] = 99                            # break count==len(tokens) AND the canonical 7
    provenance_l2_tokenizers(rep9)
    bpe_rec["count"] = savedN
    okP8 = any(s == "HARD" and "provenance-L2TOK(BPE" in m for s, m in rep9)
    print("[selftest:prov-L2TOK-count]", next((m for s, m in rep9 if s == "HARD"), "provenance-L2TOK count: NO FLAG"))
    # L2 tokenizer-compare [P] data-only pin: a silent edit to the rare word's segmentation must flag.
    rep10 = []
    uni_rec = next(t for t in TOK["tokenizers"] if t["name"] == "Unigram")
    pw = next(p for p in uni_rec["perWord"] if p["word"] == "unhappiness")
    savedSeg = pw["tokens"]
    pw["tokens"] = ["un", "happiness"]               # pretend Unigram split it like BPE — must be caught
    provenance_l2_tokenizers(rep10)
    pw["tokens"] = savedSeg
    okP9 = any(s == "HARD" and "provenance-L2TOK(Unigram/unhappiness)" in m for s, m in rep10)
    print("[selftest:prov-L2TOK-seg]", next((m for s, m in rep10 if s == "HARD"), "provenance-L2TOK seg: NO FLAG"))
    # ── ENRICHMENT fixtures: the four new trajectory anchors must be drift-catchers, not blind. ──
    # L5 [C]: a drifted word2vec/SGNS training loss endpoint must flag DRIFT (anchor is not blind).
    cW = next(x for x in claims() if x["id"] == "L5W loss before")
    bW = r"loss 9.99 &rarr; 2.63"  # data/ word2vec loss before is 4.85
    sevW, msgW = check_claim(cW, bW)
    okW = sevW == "HARD" and "DRIFT" in msgW
    print("[selftest:L5W]", msgW)
    # L5 [C]: a drifted UMAP min_dist dial must flag DRIFT.
    cU = next(x for x in claims() if x["id"] == "L5U min_dist")
    bU = r"n_neighbors=10 · min_dist=0.99 · 500 epochs"  # data/ min_dist is 0.1
    sevU, msgU = check_claim(cU, bU)
    okU = sevU == "HARD" and "DRIFT" in msgU
    print("[selftest:L5U]", msgU)
    # L6 [C]: a drifted slide-41 DistilBERT cross-sense cosine must flag DRIFT.
    cS = next(x for x in claims() if x["id"] == "L6 stack cos final")
    bS = r"final: cos = 0.999  &mdash; one word, two vectors"  # data/ final cross-sense is 0.6465
    sevS, msgS = check_claim(cS, bS)
    okS = sevS == "HARD" and "DRIFT" in msgS
    print("[selftest:L6stack]", msgS)
    # L6 [C]: a drifted slide-47 InfoNCE loss-trajectory endpoint must flag DRIFT.
    cT47 = next(x for x in claims() if x["id"] == "L6 traj loss start")
    bT47 = r"the negative, loss is high: \(\mathcal{L}=9.99\)"  # data/ untuned trajectory loss is 3.31
    sevT47, msgT47 = check_claim(cT47, bT47)
    okT47 = sevT47 == "HARD" and "DRIFT" in msgT47
    print("[selftest:L6traj]", msgT47)
    # ENR [P]: a drifted GloVe-animation endpoint (vs the canonical static loss after) must flag (in-memory).
    rep11 = []
    savedTrj = GLOVE["trajectory"]["frames"][-1]["loss"]
    GLOVE["trajectory"]["frames"][-1]["loss"] = 9.99   # break traj-last == canonical loss after (0.005)
    provenance_enrichment(rep11)
    GLOVE["trajectory"]["frames"][-1]["loss"] = savedTrj
    okPE = any(s == "HARD" and "provenance-ENR(glove.traj.lossAfter)" in m for s, m in rep11)
    print("[selftest:prov-ENR]", next((m for s, m in rep11 if s == "HARD"), "provenance-ENR: NO FLAG"))
    # ENR [P]: a drifted l6-contextual cross-sense (vs the DistilBERT stack final 0.6465) must flag (in-memory).
    rep12 = []
    savedCX = CTX["cosines"]["crossSense"]
    CTX["cosines"]["crossSense"] = 0.999            # break ctx.crossSense == stack.final (0.6465)
    provenance_enrichment(rep12)
    CTX["cosines"]["crossSense"] = savedCX
    okCX = any(s == "HARD" and "provenance-ENR(ctx." in m for s, m in rep12)
    print("[selftest:prov-ENR-ctx]", next((m for s, m in rep12 if s == "HARD"), "provenance-ENR ctx: NO FLAG"))
    # Book [C]: a Book chapter where a flagship PROSE number drifted must flag DRIFT (anchor not blind).
    cBK = next(x for x in book_claims() if x["id"] == "book L5 PCA 2-D")
    bBK = r'these two axes keep 99.9% of the original variance'  # wrong: data/ says 37.7
    sevBK, msgBK = check_claim(cBK, bBK)
    okBK = sevBK == "HARD" and "DRIFT" in msgBK
    print("[selftest:book]", msgBK)
    # Book [C]: a drifted ch.6 within-sense cosine (sourced from data/l6-contextual.json) must flag DRIFT.
    cBW = next(x for x in book_claims() if x["id"] == "book L6 within-sense")
    bBW = r'to cash a cheque") sit at \(0.999\), nearly on top of each other'  # data/ within-sense is 0.9466
    sevBW, msgBW = check_claim(cBW, bBW)
    okBW = sevBW == "HARD" and "DRIFT" in msgBW
    print("[selftest:book-ctx]", msgBW)
    # [P] L6 InfoNCE bars: BOTH halves must be drift-catchers, not blind.
    #   (a) a drifted checkpoint logit breaks softmax(logits)[kitten] == pPositive (data self-consistency).
    repNCEa = []
    saved = CTRAJ["checkpoints"][0]["logits"][1]
    CTRAJ["checkpoints"][0]["logits"][1] = 0.0      # airplane logit drift → softmax(kitten) no longer == pPositive
    provenance_l6_nce(repNCEa, "")
    CTRAJ["checkpoints"][0]["logits"][1] = saved
    okNCEa = any(s == "HARD" and "provenance-L6NCE" in m for s, m in repNCEa)
    print("[selftest:prov-L6NCE-data]", next((m for s, m in repNCEa if s == "HARD"), "provenance-L6NCE data: NO FLAG"))
    #   (b) a tampered bar <rect height> (unmutated data) breaks the deck binding (height != softmax·H).
    realH = lambda i, p: f'{p*220:.1f}'
    p0 = _nce_softmax(CTRAJ["checkpoints"][0]["logits"]); p1 = _nce_softmax(CTRAJ["checkpoints"][1]["logits"]); p2 = _nce_softmax(CTRAJ["checkpoints"][2]["logits"])
    fixBars = ('<section class="slide nce-slide"><svg>'
        + f'<rect x="925" height="999"/><rect x="925" height="{realH(0,p1[0])}"/><rect x="925" height="{realH(0,p2[0])}"/>'   # untuned kitten TAMPERED → must fire
        + f'<rect x="1075" height="{realH(1,p0[1])}"/><rect x="1075" height="{realH(1,p1[1])}"/><rect x="1075" height="{realH(1,p2[1])}"/>'
        + f'<rect x="1225" height="{realH(2,p0[2])}"/><rect x="1225" height="{realH(2,p1[2])}"/><rect x="1225" height="{realH(2,p2[2])}"/>'
        + f'<rect x="1375" height="{realH(3,p0[3])}"/><rect x="1375" height="{realH(3,p1[3])}"/><rect x="1375" height="{realH(3,p2[3])}"/>'
        + '</svg></section>')
    repNCEb = []
    provenance_l6_nce(repNCEb, fixBars)
    okNCEb = any(s == "HARD" and "bar.kitten" in m for s, m in repNCEb)
    print("[selftest:prov-L6NCE-bar]", next((m for s, m in repNCEb if s == "HARD"), "provenance-L6NCE bar: NO FLAG"))
    okNCE = okNCEa and okNCEb
    # [G] coverage-guard: a NEW un-gated grounded number on a surface (here a new unit "L9", baseline 0)
    # must HARD-fail — proving the ratchet is not blind (a forgotten data-number in L7 can't ship silently).
    repCov = []
    coverage_guard(repCov, {"L9": "<p>the model scores 0.7137 on this set</p>"}, {})
    okCov = any(s == "HARD" and "coverage-guard(deck:L9)" in m for s, m in repCov)
    print("[selftest:coverage]", next((m for s, m in repCov if s == "HARD"), "coverage-guard: NO FLAG"))
    # L7 [C] Book: a drifted reranked nDCG must flag DRIFT (the L7 anchors are not blind).
    cL7 = next(c for c in book_claims() if c["id"] == "book L7 rerankNdcg")
    sevL7, msgL7 = check_claim(cL7, r"improves to <strong>nDCG@10 = 0.1234</strong>")
    okL7c = sevL7 == "HARD" and "DRIFT" in msgL7
    print("[selftest:L7-book]", msgL7)
    # L7 [P]: break the BAM invariant (real Judge no longer separates pairRel>pairBad) → must flag.
    repL7 = []
    savedL7 = CROSSENC["real"]["pairBad"]["score"]
    CROSSENC["real"]["pairBad"]["score"] = 0.9999
    provenance_l7(repL7)
    CROSSENC["real"]["pairBad"]["score"] = savedL7
    okL7p = any(s == "HARD" and "provenance-L7" in m for s, m in repL7)
    print("[selftest:prov-L7]", next((m for s, m in repL7 if s == "HARD"), "provenance-L7: NO FLAG"))
    ok = (okD and okA and okP and okL3 and okL4 and okP2 and okL5 and okL6 and okP3 and okP4
          and okGX and okTK and okTS and okP5 and okP6 and okP7 and okP8 and okP9
          and okW and okU and okS and okT47 and okPE and okCX and okBK and okBW and okNCE and okCov
          and okL7c and okL7p)
    print("[selftest]", "PASS — claim-drift + bad-arithmetic + provenance-drift + L3/L4 + L5/L6 + L5-GloVe/t-SNE + L2-tokenizers + enrichment-trajectory + l6-contextual cross-file + L6-InfoNCE-bars (data + deck) + Book-prose deck & cross-file + coverage-guard ratchet (incl. data-only pins) all fire"
          if ok else "FAIL — a check is blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
