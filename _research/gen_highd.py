#!/usr/bin/env python3
"""gen_highd.py — generate data/l2-highd.json for the highd-histogram widget (L2 catch-curse-highd).

Curse of dimensionality / distance concentration: as dimension d grows, pairwise Euclidean
distances between uniform-random points concentrate — the coefficient of variation (std/mean) → 0,
so "nearest" and "farthest" become almost indistinguishable. ILLUSTRATIVE but REAL: computed here
with a fixed seed so it's reproducible (not hand-waved). Run:  python3 _research/gen_highd.py
"""
import json, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data/l2-highd.json"
SEED, N = 0, 300
DIMS = [2, 10, 100, 1000]
# histogram of (distance / mean distance) over a fixed range, so shapes compare across d
EDGES = np.linspace(0.0, 2.0, 25)
CENTERS = ((EDGES[:-1] + EDGES[1:]) / 2).round(4).tolist()

def pairwise_dists(X):
    # all unordered pairs
    from itertools import combinations
    # vectorized: ||xi - xj||
    sq = (X[:, None, :] - X[None, :, :]) ** 2
    D = np.sqrt(sq.sum(-1))
    iu = np.triu_indices(len(X), k=1)
    return D[iu]

def main():
    rng = np.random.default_rng(SEED)
    dims = []
    for d in DIMS:
        X = rng.random((N, d))
        dd = pairwise_dists(X)
        mean, std = float(dd.mean()), float(dd.std())
        cv = std / mean
        hist, _ = np.histogram(dd / mean, bins=EDGES, density=True)
        dims.append({
            "d": d,
            "mean": round(mean, 4),
            "std": round(std, 4),
            "cv": round(cv, 4),                       # std/mean → 0 as d grows
            "ratio": round(float((dd.max() - dd.min()) / dd.min()), 4),  # (max-min)/min → 0
            "hist": [round(float(h), 4) for h in hist],
        })
    out = {
        "_doc": "Distance concentration (curse of dimensionality). For N uniform-random points in "
                "[0,1]^d, pairwise Euclidean distances concentrate as d grows: cv=std/mean → 0, so "
                "near and far blur together. ILLUSTRATIVE but reproducible (seeded).",
        "_source": f"_research/gen_highd.py (seed={SEED}, n={N}, uniform [0,1]^d)",
        "seed": SEED, "n": N,
        "binCenters": CENTERS,            # x-axis: distance / mean
        "dims": dims,
    }
    OUT.write_text(json.dumps(out, indent=2))
    print(f"[gen_highd] wrote {OUT.relative_to(ROOT)}  dims={DIMS}  cv={[x['cv'] for x in dims]}")

if __name__ == "__main__":
    main()
