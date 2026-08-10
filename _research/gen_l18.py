#!/usr/bin/env python3
"""gen_l18.py — the L18 "The Curved Map" data generator (anisotropy & hubness).

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l18-geometry.json — MEASURED on tiny DETERMINISTIC toys (pure stdlib: random.Random(seed) +
      hand-rolled cosine / kNN / skewness / power-iteration → byte-identical under any CPython; no numpy/ABI
      dependency). Reproduces the QUALITATIVE story (anisotropy raises random-pair cosine; centering/whitening
      restores near-orthogonality; kNN hubness skew rises with dimension; CSLS flattens it back), NOT the
      papers' large-N magnitudes. Five blocks:
        anisotropy      — the cone toy (raw / centered / HONEST all-but-the-top) + its top PC's cone alignment
        orthogonality   — the L9↔L18 misconception measured: uniform [0,1]^d (L9's own cloud) vs gaussian N(0,I)
        anisotropyDial  — the signal-to-noise grid behind widgets/cone-dial: E[cos] = c²/(c²+σ²), invariant in d
        whitenToy       — the four-cities whitening walk-through behind widgets/whiten-grid (exact arithmetic)
        hubness         — the classic d=2 vs d=20 reverse-kNN toy
        hubToll         — the same cloud under raw-kNN vs CSLS retrieval, behind widgets/hub-toll
  • data/l18-bench.json    — REPORTED published numbers (Ethayarajh 2019, Timkey 2021, Radovanović 2010,
      Li 2020, Su 2021, Gao 2021, Conneau 2018, Rudman 2022, Tsukagoshi 2025, Bogolin 2022, Feldbauer 2019,
      Munyampirwa 2024) — NOT computed here; each carries its citation and its exact table provenance.

Run: python3 _research/gen_l18.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
import random
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def dot(a, b): return sum(x * y for x, y in zip(a, b))
def norm(a): return math.sqrt(dot(a, a))
def cos(a, b):
    na, nb = norm(a), norm(b)
    return dot(a, b) / (na * nb) if na and nb else 0.0
def sub(a, b): return [x - y for x, y in zip(a, b)]
def mean_vec(vs): return [sum(v[i] for v in vs) / len(vs) for i in range(len(vs[0]))]


def gaussian(rng, d): return [rng.gauss(0.0, 1.0) for _ in range(d)]


def mean_pairwise_cos(vs, rng, samples=400):
    """average cosine of random PAIRS (isotropic target = 0; a narrow cone pushes it positive)."""
    n = len(vs); tot = 0.0
    for _ in range(samples):
        i = rng.randrange(n); j = rng.randrange(n)
        if i == j: j = (j + 1) % n
        tot += cos(vs[i], vs[j])
    return round(tot / samples, 4)


def skewness(xs):
    n = len(xs); m = sum(xs) / n
    var = sum((x - m) ** 2 for x in xs) / n
    if var == 0: return 0.0
    s = math.sqrt(var)
    return round(sum(((x - m) / s) ** 3 for x in xs) / n, 4)


def pearson(xs, ys):
    n = len(xs); mx = sum(xs) / n; my = sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = math.sqrt(sum((x - mx) ** 2 for x in xs)); vy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return round(cov / (vx * vy), 4) if vx and vy else 0.0


def top_pc(vs, iters=200):
    """Top principal direction of the RAW (un-centred) second-moment matrix Σ xxᵀ by power iteration.

    Deterministic: fixed start vector e₀, fixed iteration count, pure stdlib. This is the direction
    all-but-the-top actually removes — on an ANISOTROPIC cloud it IS the cone axis (see coneAlign).
    """
    d = len(vs[0])
    v = [1.0] + [0.0] * (d - 1)
    for _ in range(iters):
        w = [0.0] * d
        for x in vs:
            c = dot(x, v)
            for i in range(d):
                w[i] += c * x[i]
        nv = norm(w)
        if nv == 0.0:
            break
        v = [wi / nv for wi in w]
    return v


def project_out(vs, u):
    """remove the component along the unit direction u from every vector (the all-but-the-top step)."""
    return [[x[i] - dot(x, u) * u[i] for i in range(len(u))] for x in vs]


def dist_matrix(pts):
    n = len(pts)
    dist = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = norm(sub(pts[i], pts[j])); dist[i][j] = dist[j][i] = d
    return dist


def knn_order(dist):
    n = len(dist)
    return [sorted((j for j in range(n) if j != i), key=lambda j: dist[i][j]) for i in range(n)]


def kocc_from_order(order, k, n):
    """N_k(x) = how many points list x among their k nearest (reverse-kNN count)."""
    counts = [0] * n
    for i in range(n):
        for j in order[i][:k]:
            counts[j] += 1
    return counts


def nk_stats(counts, n):
    return {"skew": skewness(counts), "maxNk": max(counts),
            "antiHubPct": round(100 * sum(1 for c in counts if c == 0) / n, 1)}


def histogram(counts, edges):
    """counts of N_k falling in [edges[i], edges[i+1]) — last bin is closed (catches the tail)."""
    out = [0] * (len(edges) - 1)
    for c in counts:
        for b in range(len(out)):
            hi = edges[b + 1]
            if c < hi or (b == len(out) - 1 and c >= edges[b]):
                if c >= edges[b]:
                    out[b] += 1
                break
    return out


# ── the toy used by acts 03–04: n=120 gaussian points, k=5 neighbour lists, K=10 density window ──
TOY_N, TOY_K, TOY_BIG_K = 120, 5, 10
NK_EDGES = [0, 1, 3, 6, 10, 15, 21, 40]


def toy_cloud(dim):
    rng = random.Random(7)
    return [gaussian(rng, dim) for _ in range(TOY_N)]


def csls_matrix(dist, order, K):
    """CSLS in DISTANCE form: CSLS_d(x,y) = 2·d(x,y) − r̄(x) − r̄(y), lower = better.

    r̄(x) = mean distance to x's K nearest neighbours = how crowded x's own neighbourhood is.
    A hub sits in a dense pocket (small r̄) and therefore pays the biggest toll."""
    n = len(dist)
    rbar = [sum(dist[i][j] for j in order[i][:K]) / K for i in range(n)]
    csls = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                csls[i][j] = 2 * dist[i][j] - rbar[i] - rbar[j]
    return rbar, csls


def measure():
    # ── anisotropy: a NARROW CONE — every vector shares a common direction, so random pairs look similar ──
    rng = random.Random(0)
    d, n = 10, 80
    cone = [1.0] * d                     # the shared "cone" axis
    raw = [[3.0 * cone[i] + gaussian(rng, d)[i] for i in range(d)] for _ in range(n)]
    raw_cos = mean_pairwise_cos(raw, random.Random(1))          # high — the cone
    mu = mean_vec(raw)
    centered = [sub(v, mu) for v in raw]
    cen_cos = mean_pairwise_cos(centered, random.Random(1))     # ~0 — centering pops the cone open
    # HONEST all-but-the-top (Mu & Viswanath 2018): project out the top PC of the RAW cloud, WITHOUT
    # centering first. (The previous version zeroed coordinate 0 of the already-centred vectors — that is
    # neither the top PC nor the raw cloud, so it demonstrated nothing. See _internal/plans/L18-plan.md F1.)
    pc1 = top_pc(raw)
    abt = project_out(raw, pc1)
    abt_cos = mean_pairwise_cos(abt, random.Random(1))
    cone_align = round(abs(cos(pc1, cone)), 4)                  # the top PC IS the cone axis

    # ── WHICH cloud is "random directions"? the L9↔L18 misconception, measured instead of asserted ──
    # L2/L9's concentration toy is n=300 points drawn UNIFORMLY in [0,1]^d. Every coordinate is positive,
    # so that cloud carries a LARGE shared mean (μ = (½,…,½), ‖μ‖² = d/4 against per-coordinate variance
    # 1/12) — it is itself a cone, and its mean pairwise cosine sits at (1/4)/(1/4+1/12) = 3/4 at EVERY
    # dimension. So it cannot be the "no shared mean ⇒ cosine → 0" example; it is a counter-example.
    # The cloud that DOES go orthogonal is the gaussian N(0, I): mean cosine 0, spread ±1/√d. And the
    # bridge is L18's own cure — centre the uniform cloud and it lands exactly on the gaussian curve
    # (its mean cosine pinned at −1/(n−1) = −0.0033 by the centring itself, its spread at 1/√d).
    # ALL pairs, no sampling. See _internal/reviews/L18-late-review.md §1.
    ortho_n, ortho_dims = 300, [2, 10, 100, 1000]

    def pair_cos_stats(vs):
        ns = [norm(v) for v in vs]
        xs = []
        for i in range(len(vs)):
            for j in range(i + 1, len(vs)):
                xs.append(dot(vs[i], vs[j]) / (ns[i] * ns[j]) if ns[i] and ns[j] else 0.0)
        m = sum(xs) / len(xs)
        sd = math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))
        return round(m, 4), round(sd, 4)

    ortho = {"uniform": [], "uniformCentered": [], "gaussian": [], "invSqrtD": []}
    for dim in ortho_dims:
        ru = random.Random(0)
        uni = [[ru.random() for _ in range(dim)] for _ in range(ortho_n)]
        umu = mean_vec(uni)
        cen = [sub(v, umu) for v in uni]
        rg = random.Random(0)
        gau = [gaussian(rg, dim) for _ in range(ortho_n)]
        for key, cloud in (("uniform", uni), ("uniformCentered", cen), ("gaussian", gau)):
            m, sd = pair_cos_stats(cloud)
            ortho[key].append({"d": dim, "meanCos": m, "sdCos": sd})
        ortho["invSqrtD"].append(round(1 / math.sqrt(dim), 4))

    orthogonality = {
        "_doc": "The L9↔L18 misconception, MEASURED. n=300 points per cloud, ALL 44 850 pairs, four "
                "dimensions. uniform = the very cloud L2/L9 use for distance concentration ([0,1]^d, "
                "seed 0) — all coordinates positive, so it carries a big shared mean and reads cos ≈ 3/4 "
                "at EVERY d: it is a cone, not a bag of random directions. gaussian = N(0,I), the real "
                "'random directions': mean cosine 0 with spread ±1/√d. uniformCentered = the same uniform "
                "cloud after subtracting μ — it lands on the gaussian curve, which is L18's own cure "
                "applied to L9's own picture (its mean is pinned at −1/(n−1) = −0.0033 by centring).",
        "n": ortho_n, "seed": 0, "dims": ortho_dims, "pairs": ortho_n * (ortho_n - 1) // 2,
        "uniform": ortho["uniform"], "uniformCentered": ortho["uniformCentered"],
        "gaussian": ortho["gaussian"], "invSqrtD": ortho["invSqrtD"],
        "uniformLimit": 0.75,
        "_limitNote": "E[cos] → ‖μ‖²/(‖μ‖² + d·σ²) = (d/4)/(d/4 + d/12) = 3/4 for uniform [0,1]^d, "
                      "independent of d — the same c²/(c²+σ²) law act 01 derives, with c/σ = √3.",
        "gaussianMaxAbsCos": round(max(abs(r["meanCos"]) for r in ortho["gaussian"]), 4),
        "centeredMeanPinned": round(-1.0 / (ortho_n - 1), 4),
        "l9Cv": {"_doc": "what L9 actually measured on this cloud: the coefficient of variation of pairwise "
                         "EUCLIDEAN distances (data/l2-highd.json), d = 2 → 1000. NOT a cosine statistic.",
                 "d2": 0.4784, "d1000": 0.0187, "metric": "euclidean"},
    }

    # ── the cone dial (widgets/cone-dial): E[cos] = c²/(c²+σ²) — signal-to-noise, NOT dimension ──
    snr_grid = [0.0, 0.5, 1.0, 1.2247, 2.0, 3.0, 5.0, 9.9499, 12.0]
    dial_dims = [2, 10, 100, 768]
    dial_dim = 100                       # the dial's canonical dimension
    cells, points = [], [None] * len(snr_grid)
    for dim in dial_dims:
        for s in snr_grid:
            r = random.Random(11)
            pts = [[s + r.gauss(0.0, 1.0) for _ in range(dim)] for _ in range(80)]
            unit = []
            for p in pts:
                nn = norm(p)
                unit.append([x / nn for x in p] if nn else p)
            r2 = random.Random(12); tot = 0.0; samples = 800
            for _ in range(samples):
                i = r2.randrange(80); j = r2.randrange(80)
                if i == j: j = (j + 1) % 80
                tot += dot(unit[i], unit[j])
            m = round(tot / samples, 4)
            cell = {"snr": s, "dim": dim, "meanPairCos": m,
                    "angleDeg": round(math.degrees(math.acos(max(-1.0, min(1.0, m)))), 1),
                    "predicted": round(s * s / (s * s + 1.0), 4)}
            if dim == dial_dim:
                mu_d = mean_vec(pts)
                cen = [sub(p, mu_d) for p in pts]
                cell["centeredCos"] = mean_pairwise_cos(cen, random.Random(13))
            if dim == 2:
                # the DRAWING twin: the same knob in 2-D, where the wedge is visible to the eye
                # (raw coordinates, so the reader can see the cloud drift AWAY from the origin —
                # which is what makes the angle between any two points shrink), plus its centred copy.
                mu2 = mean_vec(pts)
                points[snr_grid.index(s)] = {
                    "snr": s,
                    "raw": [[round(p[0], 3), round(p[1], 3)] for p in pts],
                    "centered": [[round(p[0] - mu2[0], 3), round(p[1] - mu2[1], 3)] for p in pts]}
            cells.append(cell)

    # ── whitening by hand on FOUR CITIES (widgets/whiten-grid): exact 2×2 arithmetic, no numpy ──
    cities = [[9.0, 7.0], [7.0, 9.0], [3.0, 5.0], [5.0, 3.0]]
    wmu = mean_vec(cities)
    wcen = [sub(c, wmu) for c in cities]
    # population covariance of the centred cloud
    s11 = sum(v[0] * v[0] for v in wcen) / len(wcen)
    s22 = sum(v[1] * v[1] for v in wcen) / len(wcen)
    s12 = sum(v[0] * v[1] for v in wcen) / len(wcen)
    tr, det = s11 + s22, s11 * s22 - s12 * s12
    disc = math.sqrt(max(0.0, tr * tr / 4 - det))
    lam1, lam2 = tr / 2 + disc, tr / 2 - disc                    # 8 and 2 → condition number 4
    u1 = [1.0, (lam1 - s11) / s12] if s12 else [1.0, 0.0]
    u1n = norm(u1); u1 = [x / u1n for x in u1]
    u2 = [-u1[1], u1[0]]
    wwhite = [[dot(v, u1) / math.sqrt(lam1), dot(v, u2) / math.sqrt(lam2)] for v in wcen]

    def cos_table(vs):
        pairs = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
        vals = [round(cos(vs[a], vs[b]), 4) for a, b in pairs]
        return {"pairs": [[a, b] for a, b in pairs], "cos": vals, "mean": round(sum(vals) / len(vals), 4),
                "min": min(vals), "max": max(vals)}

    whiten_toy = {
        "_doc": "Whitening by hand on four cities (9,7)(7,9)(3,5)(5,3). Stage 1 raw: mean pairwise cosine "
                "0.9504 — a cone. Stage 2 centred: the mean shift is gone but the two STRANGERS still read "
                "0.60, because Σ still has an off-diagonal 3. Stage 3 whitened (W = UΛ^-1/2): the diamond "
                "becomes a square and the strangers read EXACTLY 0. Exact arithmetic, no sampling.",
        "cities": cities, "mu": wmu,
        "sigma": [[round(s11, 4), round(s12, 4)], [round(s12, 4), round(s22, 4)]],
        "eigenvalues": [round(lam1, 4), round(lam2, 4)],
        "conditionNumber": round(lam1 / lam2, 4),
        "U": [[round(x, 4) for x in u1], [round(x, 4) for x in u2]],
        "scale": [round(1 / math.sqrt(lam1), 4), round(1 / math.sqrt(lam2), 4)],
        "stages": {
            "raw":      {"points": cities, "cosines": cos_table(cities)},
            "centered": {"points": [[round(x, 4) for x in v] for v in wcen], "cosines": cos_table(wcen)},
            "whitened": {"points": [[round(x, 4) for x in v] for v in wwhite], "cosines": cos_table(wwhite)},
        },
        "strangerPairIdx": 0,   # pair (0,1): the two far-apart cities — 0.9692 → 0.60 → 0.0
    }

    # ── hubness: kNN occurrence skew rises with dimension (same n, k; low-d vs high-d) ──
    k = TOY_K
    hub = {}
    for label, dim in (("d2", 2), ("d20", 20)):
        pts = toy_cloud(dim)
        dist = dist_matrix(pts)
        order = knn_order(dist)
        counts = kocc_from_order(order, k, TOY_N)
        mn = mean_vec(pts)
        prox = [-norm(sub(p, mn)) for p in pts]        # proximity to the data centroid (higher = closer)
        st = nk_stats(counts, TOY_N)
        hub[label] = {"dim": dim, "skew": st["skew"], "maxNk": st["maxNk"],
                      "antiHubPct": st["antiHubPct"], "corrToCentroid": pearson(counts, prox)}

    # ── the toll gate (widgets/hub-toll): the SAME cloud, raw kNN vs CSLS, across five dimensions ──
    toll_dims = [2, 5, 10, 20, 50]
    toll = {}
    flip = None
    for dim in toll_dims:
        pts = toy_cloud(dim)
        dist = dist_matrix(pts)
        order = knn_order(dist)
        mn = mean_vec(pts)
        prox = [-norm(sub(p, mn)) for p in pts]
        raw_counts = kocc_from_order(order, k, TOY_N)
        rbar, csls = csls_matrix(dist, order, TOY_BIG_K)
        corder = [sorted((j for j in range(TOY_N) if j != i), key=lambda j: csls[i][j]) for i in range(TOY_N)]
        csls_counts = kocc_from_order(corder, k, TOY_N)
        hub_id = raw_counts.index(max(raw_counts))
        entry = {"dim": dim, "hubId": hub_id,
                 "raw": dict(nk_stats(raw_counts, TOY_N), corrToCentroid=pearson(raw_counts, prox),
                             hist=histogram(raw_counts, NK_EDGES),
                             hubTop1=sum(1 for i in range(TOY_N) if i != hub_id and order[i][0] == hub_id)),
                 "csls": dict(nk_stats(csls_counts, TOY_N), corrToCentroid=pearson(csls_counts, prox),
                              hist=histogram(csls_counts, NK_EDGES),
                              hubTop1=sum(1 for i in range(TOY_N) if i != hub_id and corder[i][0] == hub_id))}
        # 2-D drawing projection: the first two coordinates, plus each point's N_k under each rule
        entry["points"] = [[round(p[0], 3), round(p[1] if dim > 1 else 0.0, 3)] for p in pts]
        entry["nkRaw"], entry["nkCsls"] = raw_counts, csls_counts
        toll[f"d{dim}"] = entry
        if dim == 20:
            # the by-hand rank FLIP: query #19, the hub #18 vs the honest candidate #58
            q, alt = 19, 58
            flip = {"query": q, "hub": hub_id, "alt": alt,
                    "dHub": round(dist[q][hub_id], 4), "dAlt": round(dist[q][alt], 4),
                    "rQuery": round(rbar[q], 4), "rHub": round(rbar[hub_id], 4), "rAlt": round(rbar[alt], 4),
                    "cslsHub": round(csls[q][hub_id], 4), "cslsAlt": round(csls[q][alt], 4),
                    "margin": round(csls[q][hub_id] - csls[q][alt], 4),
                    "rMean": round(sum(rbar) / TOY_N, 4), "rMin": round(min(rbar), 4)}

    return {
        "_doc": "MEASURED on tiny deterministic toys (stdlib). Reproduces the QUALITATIVE story, not the papers' "
                "large-N magnitudes. Generator: _research/gen_l18.py. k=5, K=10, n=120 (hubness/hubToll); "
                "n=80, d=10 (anisotropy); n=80 (anisotropyDial); exact 4-point arithmetic (whitenToy).",
        "anisotropy": {
            "d": d, "n": n, "k": k,
            "rawCos": raw_cos, "centeredCos": cen_cos, "allButTopCos": abt_cos, "pc1ConeAlign": cone_align,
            "_note": "random-pair cosine: a narrow cone reads HIGH; centering (subtract the mean) restores ~0; "
                     "HONEST all-but-the-top (project out the top PC of the RAW cloud, no centering) also "
                     "restores ~0 — and pc1ConeAlign shows why: that top PC IS the cone axis (|cos| ≈ 1).",
        },
        "orthogonality": orthogonality,
        "anisotropyDial": {
            "_doc": "widgets/cone-dial. One knob: c/σ, the strength of the shared axis against the per-word "
                    "noise. Closed form E[cos] = c²/(c²+σ²) — the dimension CANCELS, which is exactly why "
                    "anisotropy (a signal-to-noise story) is a different animal from hubness (a dimension story).",
            "formula": "E[cos] = c^2 / (c^2 + sigma^2)",
            "snrGrid": snr_grid, "dims": dial_dims, "canonicalDim": dial_dim,
            "samples": 800, "nPoints": 80, "drawingDim": 2,
            "cells": cells, "points": points,
        },
        "whitenToy": whiten_toy,
        "hubness": hub,
        "hubnessNote": "kNN occurrence-count skew rises with dimension; hubs correlate with proximity to the centroid.",
        "hubToll": {
            "_doc": "widgets/hub-toll. The SAME n=120 cloud under two retrieval rules: raw kNN by distance, and "
                    "CSLS in distance form 2·d(x,y) − r̄(x) − r̄(y) with r̄ = mean distance to the K=10 nearest. "
                    "NOTE the metric: this toy is EUCLIDEAN (as in Radovanović 2010); on normalised vectors the "
                    "skew is markedly weaker (see l18-bench.json → hubness._metricNote).",
            "n": TOY_N, "k": TOY_K, "K": TOY_BIG_K, "dims": toll_dims, "histEdges": NK_EDGES,
            "byDim": toll, "flipExample": flip,
        },
    }


def bench():
    """REPORTED numbers — each with the table it was transcribed from. NOT computed here."""
    return {
        "_doc": "REPORTED published numbers (transcribed). Provenance labels, NOT our toy.",
        "anisotropy": {
            "_doc": "Ethayarajh 2019 — average cosine between random words (isotropy = 0). The 0.6 figure is "
                    "written in the TEXT ('roughly 0.6 in layers 2 through 8'); the last-layer figure is NOT: "
                    "the text says only 'almost perfect cosine similarity' and 0.99 is read off Figure 1.",
            "cite": "Ethayarajh 2019",
            "gpt2Mid": 0.6, "gpt2Last": 0.99,
            "_gpt2LastNote": "read off Fig. 1; the paper's text says only 'almost perfect cosine similarity'.",
            "mevAfterAdjustPct": 5,
            "_mevDoc": "Ethayarajh 2019: <5% of the variance IN A WORD'S CONTEXTUALISED REPRESENTATIONS is "
                       "explained by their first principal component (MEV — the ceiling on how well one static "
                       "vector can replace the contextual ones for that word). NOT a statement about the first "
                       "principal component of the SPACE. Raw MEV is <5% for every ELMo/BERT layer but ≈30% for "
                       "GPT-2 layers 2–11.",
            "gpt2RawMevPct": 30,
            "replication": {
                "_doc": "Timkey & van Schijndel, EMNLP 2021 (arXiv 2109.04404) Table 1 — independent replication "
                        "on 85k Wikipedia tokens / 500k pairs. Confirms the effect is model-dependent: BERT's "
                        "anisotropy is roughly HALF of GPT-2's, and the static baselines are near-isotropic.",
                "cite": "Timkey 2021",
                "gpt2Final": 0.885, "gpt2L11": 0.640, "bertL11": 0.506, "robertaL12": 0.745,
                "xlnetL11": 0.981, "word2vec": 0.130, "glove": 0.104,
            },
            "rogueDims": {
                "_doc": "Timkey & van Schijndel 2021 — the COMPETING mechanism: 1–5 'rogue dimensions' dominate "
                        "cosine. XLNet layer 11: ONE coordinate contributes 99.6% of the expected cosine "
                        "(dimension 667 has mean activation 180.0 vs −0.084, σ=0.77 for every other). Remove 5 "
                        "dimensions and Â never exceeds 0.25 in any layer of any model. And in GPT-2/RoBERTa "
                        "layers 2–11 two tokens at POSITION 0 read >0.99 vs 0.623/0.564 elsewhere — the famous "
                        "0.99 is largely a positional artefact.",
                "cite": "Timkey 2021",
                "xlnetOneDimSharePct": 99.6, "xlnetRogueMeanAct": 180.0, "otherDimsMeanAct": -0.084,
                "afterDropping5Max": 0.25, "gpt2Pos0": 0.99, "gpt2OtherPos": 0.623, "robertaOtherPos": 0.564,
            },
            "isoScore": {
                "_doc": "Rudman et al., IsoScore (Findings ACL 2022) Table 3 — the killer counter-example: ONE "
                        "point cloud, rotated four ways. IsoScore returns 0.216 every time; the average-cosine "
                        "measure returns 0.97–0.99. Average cosine fails 4 of the paper's 6 requirements and "
                        "essentially measures DISTANCE FROM THE ORIGIN, not how much of the space is filled "
                        "(GPT-2's mean vector has coordinates from −32.36 to +198.19).",
                "cite": "Rudman 2022",
                "isoScoreAllRotations": 0.216, "avgCosLo": 0.97, "avgCosHi": 0.99,
                "requirementsFailed": 4, "requirementsTotal": 6,
                "gpt2MeanVecMin": -32.36, "gpt2MeanVecMax": 198.19,
            },
            "modern2026": {
                "_doc": "IsoScore of deployed encoders — Tsukagoshi & Sasano, Findings ACL 2025 (arXiv 2506.01435) "
                        "Tables 1–2. Every 2024–25 encoder sits in 0.005–0.44; none is near 1. Contrastive "
                        "training moves the needle but does not finish the job.",
                "cite": "Tsukagoshi 2025",
                "bertLarge": 0.0186, "unsupSimcse": 0.1611, "e5Large": 0.2022, "e5Small": 0.4419,
            },
        },
        "hubness": {
            "_doc": "Radovanović et al. 2010 — N_k skewness of i.i.d. data as dimension grows.",
            "_provenance": "JMLR 11:2487–2531, FOOTNOTE 5 on p. 2492 referring to Figure 1 (not Table 1, which "
                           "reports 50 real datasets). These are S_{N₅} — k = 5, not 10 — at n = 10 000.",
            "_metricNote": "EUCLIDEAN distance. The paper itself flags COSINE as the exception on Fig. 1, and "
                           "Munyampirwa et al. 2024 measure it directly: 'cosine distance does not have a "
                           "dramatic skew, even for d ∈ {1024, 1536}'. This lecture is a COSINE lecture — so the "
                           "table below is a statement about the metric, not a law of embedding space.",
            "cite": "Radovanović 2010",
            "k": 5, "n": 10000,
            "skewUniform": {"d3": 0.121, "d20": 1.541, "d100": 5.445},
            "skewNormal": {"d3": 0.118, "d20": 2.055, "d100": 19.210},
            "dimSkewCorr": 0.62,                  # across 50 real datasets
            "reduction": {
                "_doc": "Feldbauer & Flexer 2019, Knowledge and Information Systems 59(1):137–166, 'A "
                        "comprehensive empirical comparison of hubness reduction in high-dimensional spaces' — "
                        "12 methods + 2 baselines on 50 datasets. Real S_{N₁₀} spans −0.1156 … 15.5188. "
                        "DisSimLocal wins on the hubness metric; Local Scaling wins on kNN classification (the "
                        "only method significantly beating both baselines). OPERATING RULE: the gain only "
                        "appears above S_{N₁₀} ≈ 1.4 — measure before you treat. Mutual Proximity is CUBIC and "
                        "does not scale; LS/NICDM/DSL are quadratic.",
                "cite": "Feldbauer 2019",
                "skewMin": -0.1156, "skewMax": 15.5188, "treatThreshold": 1.4,
            },
            "highway": {
                "_doc": "Munyampirwa, Lakshman & Coleman (arXiv 2412.01940) — the Hub Highway Hypothesis: in NSW "
                        "graphs hubs form a 'highway' that does the job of HNSW's layer hierarchy. Hubs are "
                        "preferentially connected to hubs (P99 effect size 0.83–0.87 on ℓ₂); queries traverse "
                        "hubs within the first 5–10% of steps. Dropping the hierarchy saves peak build memory "
                        "with no recall/latency cost. In LOW dimension the hierarchy exists in order to MANUFACTURE "
                        "hubs; in high dimension the dimension supplies them for free.",
                "cite": "Munyampirwa 2024",
                "effectNytimes": 0.9305, "effectGlove": 0.7642,
                "memSavedBigannPct": 38, "memSavedDeepPct": 39, "memSavedSpacevPct": 18,
            },
            "adversarial": {
                "_doc": "Zhang et al. (arXiv 2412.14113) — the measured price of a hub: a natural hub on "
                        "CUB-200/OpenCLIP is genuinely relevant to 28 queries but is returned for up to 100 "
                        "(≈72 false hits per hub); an ADVERSARIAL hub reaches top-1 for 21 136 of 25 000 queries "
                        "against 102 for the best natural one (×207). QB-Norm kills universal hubs "
                        "(85.1% → 0.0%) but barely touches concept-specific ones (100% → 95.3%).",
                "cite": "Zhang 2024",
                "relevantTo": 28, "returnedFor": 100, "adversarialTop1": 21136, "naturalTop1": 102,
            },
        },
        "fixes": {
            "_doc": "Correction methods — reported STS Spearman / retrieval numbers.",
            "bertWhiteningStsB": {
                "_doc": "Su et al. 2021 (arXiv 2103.15316) Table 1. THREE cautions the lecture must state: "
                        "(a) 59.04 is BERTbase-FIRST-LAST-AVG, already a pooling choice — the truly raw BERT-base "
                        "STS-B is 47.29 (Li et al. 2020); (b) 71.34 is the '(target)' variant — μ and W are fitted "
                        "on the train+dev+TEST sentences, i.e. TRANSDUCTIVE; the inductive number (fitted on NLI) "
                        "is 68.19, 3.15 points lower; (c) whitening HURTS SICK-R in the same table: 63.75 → 60.6.",
                "cite": "Su 2021",
                "raw": 59.04, "pooling": "first-last-avg", "trulyRawBertBase": 47.29,
                "whitenedInductive": 68.19, "whitenedTarget": 71.34,
                "sickRBefore": 63.75, "sickRAfter": 60.6,
            },
            "bertFlowAvgGain": 8.16,              # Li 2020, base
            "simcse": {
                "_doc": "Gao, Yao & Chen 2021 Table 5 (7 STS tasks, Spearman, 'all' setting). The previous best "
                        "WITHOUT a teacher was CT-BERT_base 72.05; the previous best WITH one was CT-SBERT_base "
                        "79.39. The paper's own deltas are +4.2 (76.25 − 72.05) and +2.2 (81.57 − 79.39) — "
                        "comparing 81.57 against 72.05 inflates the supervised gain from 2.2 to 9.55 points.",
                "cite": "Gao 2021",
                "prevSotaUnsup": 72.05, "prevSotaSup": 79.39, "unsup": 76.25, "sup": 81.57,
                "gainUnsup": 4.2, "gainSup": 2.2,
            },
            "simcseUnsup": 76.25, "simcseSup": 81.57,
            "diagnosticPlane": {
                "_doc": "Gao 2021 Fig. 3 — the alignment/uniformity plane, with each point's STS average. "
                        "Flow and whitening BUY uniformity by SPENDING alignment; STS measures alignment. And "
                        "SimCSE §5/Fig. F.1: BERT-flow and BERT-whitening flatten the singular spectrum EVEN "
                        "HARDER than SimCSE does — so whitening did not lose on isotropy. Isotropy is not the goal.",
                "cite": "Gao 2021",
                "avgBert": 56.7, "bertFlow": 66.6, "bertWhitening": 66.3, "sbert": 74.9,
                "unsupSimcse": 76.3, "sbertWhitening": 77.0, "supSimcse": 81.6,
            },
            "whiteningHurts": {
                "_doc": "PREPRINT (⚠ not peer-reviewed). Ren, Sun & Liang (arXiv 2511.11041) Table 2 on MMTEB — "
                        "the dose-response curve: removing the mean DIRECTION and ABTT-1/2 are positive, but FULL "
                        "PCA whitening is negative on 5 of 5 modern embedders. Their one-directional correction "
                        "is significant on 29/38 models with ZERO significant losses. Forooghi et al. (arXiv "
                        "2407.12886) Table 1 find degradation for every model and every dataset without exception, "
                        "growing with dimension (768-d ≈ −3, 4096-d ≈ −15; LLaMA on CR 90.36 → 60.80).",
                "cite": "Ren 2025 (preprint)", "preprint": True,
                "me5LargeInstruct": -5.18, "bgeBaseEnV15": -1.79, "nomicEmbedTextV1": -0.70,
                "snowflakeArcticEmbedM": -0.64, "allMiniLmL6V2": -0.64,
                "forooghiBert": -3.19, "forooghiSimcse": -3.45, "forooghiLlama": -15.21,
            },
            "whiteningStillWins": {
                "_doc": "Diera, Galke & Scherp, 'Isotropy Matters: Soft-ZCA Whitening for Semantic Code Search' "
                        "(arXiv 2411.17538, ESANN 2025) Tables 2–3 — the one place whitening still pays, and its "
                        "own caveat: NON-contrastive models gain hugely, the CONTRASTIVELY pre-trained CodeT5+ "
                        "gains essentially nothing. Plain ZCA (ε=0) 'decreased performance on most datasets'; a "
                        "regulariser ε ∈ {0.1, 0.01} is required. Optimal IsoScore for the base models is "
                        "0.2–0.8, NOT 1.0. ⚠ their whitening matrices are fitted on the full test set.",
                "cite": "Diera 2025",
                "codebertMrrMin": 0.077, "codebertMrrMax": 0.250,
                "codellamaMrrMax": 0.476, "codet5pMrrMax": 0.007,
                "isoScoreOptLo": 0.2, "isoScoreOptHi": 0.8,
            },
            "cslsSentRetrievalP1": {
                "_doc": "Conneau et al. 2018 (arXiv 1710.04087) TABLE 3 — CROSS-LINGUAL SENTENCE RETRIEVAL on "
                        "Europarl: 2 000 query sentences against 200 000 target sentences, idf-weighted bag of "
                        "words, supervised Procrustes, NN vs CSLS. This is a RETRIEVAL task, NOT word-translation "
                        "P@1 (the deck used to label it so). Reverse direction it→en: 53.5 → 69.5.",
                "cite": "Conneau 2018",
                "task": "cross-lingual sentence retrieval (Europarl), en→it, P@1",
                "nn": 42.6, "csls": 66.1, "nnReverse": 53.5, "cslsReverse": 69.5,
            },
            "cslsWordTranslationP1": {
                "_doc": "Conneau et al. 2018 TABLE 1 — the actual WORD-translation P@1 (fastText/Wikipedia, "
                        "1 500 queries, 200k vocabulary, K = 10; stable for K ∈ {5, 10, 50}), NN vs CSLS. The "
                        "authors name the motivation themselves: CSLS is 'a cross-domain similarity adaptation to "
                        "mitigate the so-called hubness problem'.",
                "cite": "Conneau 2018",
                "enEs": {"nn": 77.4, "csls": 81.4}, "enDe": {"nn": 68.4, "csls": 73.5},
                "enRu": {"nn": 47.0, "csls": 51.7}, "enZh": {"nn": 40.6, "csls": 42.7},
            },
            "qbNorm": {
                "_doc": "Bogolin et al., QB-Norm (CVPR 2022) — the production form of CSLS via a query bank. "
                        "R@1 gains on cross-modal retrieval, and the mechanism confirmed (Table 3: the skew of "
                        "k-occurrences falls). THE BOUNDARY (Table 2, MSR-VTT/TT-CE+): no normalisation 14.9 → "
                        "CSLS 16.8 → inverted softmax 17.1, but with a query bank from a FOREIGN domain CSLS "
                        "collapses to 13.4 and IS to 11.6 — BELOW doing nothing. Table 1: a bank drawn from the "
                        "training set captures ~97% of the oracle gain, so this is not transduction.",
                "cite": "Bogolin 2022",
                "msrvttBefore": 29.6, "msrvttAfter": 33.3, "didemoBefore": 21.6, "didemoAfter": 24.2,
                "mscocoBefore": 30.3, "mscocoAfter": 34.8, "cubBefore": 64.4, "cubAfter": 64.8,
                "skewBefore": 0.939, "skewAfter": 0.509, "didemoSkewBefore": 1.21, "didemoSkewAfter": 0.39,
                "baselineNoNorm": 14.9, "cslsSameDomain": 16.8, "cslsForeignBank": 13.4, "isForeignBank": 11.6,
            },
            "muViswanathTopD": "d/100",           # all-but-the-top removes top d/100 PCs
            "muViswanathD": {
                "_doc": "Mu & Viswanath 2018 — the D actually used in their experiments at d = 300: D = 3 for "
                        "word2vec, D = 2 for GloVe; Timkey & van Schijndel take D = 7 at d = 768. And the honest "
                        "cell: GloVe on RG65 goes DOWN, 76.96 → 74.36.",
                "cite": "Mu 2018",
                "word2vecD": 3, "gloveD": 2, "timkeyD": 7, "rg65Before": 76.96, "rg65After": 74.36,
            },
            "matryoshka": {
                "_doc": "Kusupati et al., NeurIPS 2022. Table 1 (ResNet50/ImageNet-1K linear probe) at 8 "
                        "dimensions: MRL 66.63 vs random-LP 4.56 and SVD 2.34; Table 2 (1-NN) at 8 dimensions: "
                        "MRL 62.19 vs FF+SVD 19.14 and a JL projection 0.11. The famous '14×' is a CASCADE "
                        "number (§4.2: 36.26 expected dimensions ≈ FF-512) — Appendix D.1 puts the total-dimension "
                        "figure at 62, i.e. 8.2×. Deployment curve with a PUBLISHED table: nomic-embed-text-v1.5.",
                "cite": "Kusupati 2022",
                "mrl8LinearProbe": 66.63, "mrl8Nn": 62.19, "svd8Nn": 19.14, "jl8Nn": 0.11,
                "nomic768": 62.28, "nomic512": 61.96, "nomic256": 61.04, "nomic128": 59.34, "nomic64": 56.10,
            },
        },
        "lexicalLeak": {
            "_doc": "Li 2020 Table 6 — Spearman ρ×100 against EDIT DISTANCE (a surface measure). Raw BERT cosine "
                    "−50.49; the GOLD human similarity labels −24.61. BOTH are negative: more edits → less "
                    "similar, so string surface LEGITIMATELY explains part of similarity. The finding is the "
                    "RATIO 50.49/24.61 = 2.05 — BERT leans on the surface twice as hard as the human judgements "
                    "do. BERT-flow drops it to −28.01, almost down to the human level.",
            "cite": "Li 2020",
            "corrLexical": -50.49, "corrGoldEdit": -24.61, "corrFlowInduced": -28.01,
            "ratio": 2.05,
            "normByFreq": {
                "_doc": "Li 2020 Table 1 — the frequency signature inside BERT: mean ℓ₂ norm of the embedding "
                        "rises with rarity 0.95 → 1.45, and the mean distance to the 3 nearest neighbours rises "
                        "0.77 → 1.30. Rare words sit further out AND further apart.",
                "normFrequent": 0.95, "normRare": 1.45, "knnDistFrequent": 0.77, "knnDistRare": 1.30,
            },
        },
    }


if __name__ == "__main__":
    m = measure()      # measured ONCE (the orthogonality block walks 44 850 pairs at d = 1000)
    (DATA / "l18-geometry.json").write_text(json.dumps(m, indent=2, ensure_ascii=False) + "\n")
    (DATA / "l18-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    a = m["anisotropy"]; h = m["hubness"]; t = m["hubToll"]["byDim"]["d20"]
    print(f"[gen_l18] wrote data/l18-geometry.json (aniso rawCos={a['rawCos']} -> centered={a['centeredCos']} "
          f"-> allButTop={a['allButTopCos']} (PC1·cone={a['pc1ConeAlign']}); hubness skew d2={h['d2']['skew']} "
          f"-> d20={h['d20']['skew']}, maxNk {h['d2']['maxNk']}->{h['d20']['maxNk']}; CSLS d20 skew "
          f"{t['raw']['skew']}->{t['csls']['skew']}, maxNk {t['raw']['maxNk']}->{t['csls']['maxNk']}) "
          f"+ data/l18-bench.json")
