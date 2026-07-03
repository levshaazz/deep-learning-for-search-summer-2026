#!/usr/bin/env python3
"""gen_l18.py — the L18 "The Curved Map" data generator (anisotropy & hubness).

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l18-geometry.json — MEASURED on tiny DETERMINISTIC toys (pure stdlib: random.Random(seed) +
      hand-rolled cosine / kNN / skewness → byte-identical under any CPython; no numpy/ABI dependency).
      Reproduces the QUALITATIVE story (anisotropy raises random-pair cosine; centering/whitening restores
      near-orthogonality; kNN hubness skew rises with dimension), NOT the papers' large-N magnitudes.
  • data/l18-bench.json    — REPORTED published numbers (Ethayarajh 2019, Radovanović 2010, Li 2020,
      Su 2021, Gao 2021, Conneau 2018) — NOT computed here; each carries its citation.

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


def kocc(vs, k):
    """N_k(x) = how many points list x among their k nearest (reverse-kNN count)."""
    n = len(vs)
    dist = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i + 1, n):
            d = norm(sub(vs[i], vs[j])); dist[i][j] = dist[j][i] = d
    counts = [0] * n
    for i in range(n):
        order = sorted((j for j in range(n) if j != i), key=lambda j: dist[i][j])
        for j in order[:k]:
            counts[j] += 1
    return counts


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
    # "all-but-the-top" style: also drop the single dominant coordinate direction (toy whitening step)
    abt = [[(0.0 if i == 0 else c[i]) for i in range(d)] for c in centered]
    abt_cos = mean_pairwise_cos(abt, random.Random(1))

    # ── hubness: kNN occurrence skew rises with dimension (same n, k; low-d vs high-d) ──
    k = 5
    hub = {}
    for label, dim in (("d2", 2), ("d20", 20)):
        rng2 = random.Random(7)
        pts = [gaussian(rng2, dim) for _ in range(120)]
        counts = kocc(pts, k)
        mn = mean_vec(pts)
        prox = [-norm(sub(p, mn)) for p in pts]        # proximity to the data centroid (higher = closer)
        # correlation(N_k, proximity-to-centroid)
        cm = sum(counts) / len(counts); pm = sum(prox) / len(prox)
        cov = sum((c - cm) * (p - pm) for c, p in zip(counts, prox))
        vc = math.sqrt(sum((c - cm) ** 2 for c in counts)); vp = math.sqrt(sum((p - pm) ** 2 for p in prox))
        corr = round(cov / (vc * vp), 4) if vc and vp else 0.0
        hub[label] = {"dim": dim, "skew": skewness(counts), "maxNk": max(counts),
                      "antiHubPct": round(100 * sum(1 for c in counts if c == 0) / len(counts), 1),
                      "corrToCentroid": corr}

    return {
        "_doc": "MEASURED on tiny deterministic toys (stdlib). Reproduces the QUALITATIVE story, not the papers' "
                "large-N magnitudes. Generator: _research/gen_l18.py. k=5, n=120 (hubness); n=80, d=10 (anisotropy).",
        "anisotropy": {
            "d": d, "n": n, "k": k,
            "rawCos": raw_cos, "centeredCos": cen_cos, "allButTopCos": abt_cos,
            "_note": "random-pair cosine: a narrow cone reads HIGH; centering (subtract the mean) restores ~0; "
                     "dropping the dominant direction keeps it flat — isotropy recovered.",
        },
        "hubness": hub,
        "hubnessNote": "kNN occurrence-count skew rises with dimension; hubs correlate with proximity to the centroid.",
    }


def bench():
    """REPORTED numbers — Ethayarajh 2019, Radovanović 2010, Li 2020, Su 2021, Gao 2021, Conneau 2018."""
    return {
        "_doc": "REPORTED published numbers (transcribed). Provenance labels, NOT our toy.",
        "anisotropy": {
            "_doc": "Ethayarajh 2019 — average cosine between random words (isotropy = 0).",
            "cite": "Ethayarajh 2019",
            "gpt2Mid": 0.6, "gpt2Last": 0.99,     # GPT-2 layers 2-8 ~0.6, last layer ~0.99
            "mevAfterAdjustPct": 5,               # <5% variance in the first PC after removing anisotropy
        },
        "hubness": {
            "_doc": "Radovanović et al. 2010 — N_k skewness of i.i.d. data as dimension grows.",
            "cite": "Radovanović 2010",
            "skewUniform": {"d3": 0.121, "d20": 1.541, "d100": 5.445},
            "skewNormal": {"d3": 0.118, "d20": 2.055, "d100": 19.210},
            "dimSkewCorr": 0.62,                  # across 50 real datasets
        },
        "fixes": {
            "_doc": "Correction methods — reported STS Spearman / retrieval numbers.",
            "bertWhiteningStsB": {"raw": 59.04, "whitened": 71.34, "cite": "Su 2021"},
            "bertFlowAvgGain": 8.16,              # Li 2020, base
            "simcseUnsup": 76.3, "simcseSup": 81.6, "simcsePrevSota": 72.05,  # Gao 2021
            "cslsWordTransP1": {"nn": 42.6, "csls": 66.1, "cite": "Conneau 2018"},  # en-it P@1
            "muViswanathTopD": "d/100",           # all-but-the-top removes top d/100 PCs
        },
        "lexicalLeak": {
            "_doc": "Li 2020 — raw BERT cosine tracks surface edit-distance more than meaning.",
            "cite": "Li 2020",
            "corrLexical": -50.49, "corrSemantic": -24.61,
        },
    }


if __name__ == "__main__":
    (DATA / "l18-geometry.json").write_text(json.dumps(measure(), indent=2, ensure_ascii=False) + "\n")
    (DATA / "l18-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    m = measure()
    a = m["anisotropy"]; h = m["hubness"]
    print(f"[gen_l18] wrote data/l18-geometry.json (aniso rawCos={a['rawCos']} -> centered={a['centeredCos']} "
          f"-> allButTop={a['allButTopCos']}; hubness skew d2={h['d2']['skew']} -> d20={h['d20']['skew']}, "
          f"maxNk {h['d2']['maxNk']}->{h['d20']['maxNk']}) + data/l18-bench.json")
