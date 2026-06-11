#!/usr/bin/env python3
"""gen_l5_umap.py — DATA for the L5 UMAP "random/spectral init → converged" trajectory widget.

The instructor wants the dim-reduction slides to start from initialization and run to convergence.
This script produces a UMAP trajectory on the REAL GloVe word vectors (the same ~44-word set the PCA
and t-SNE widgets use, from data/l5-dimred.json + the gitignored GloVe cache).

  data/l5-umap.json

UMAP is NOT in the base /usr/bin/python3 (sklearn 1.5.2 + numpy 2.0.2 only). So, exactly like the
GloVe fetch, we FIRST try to install `umap-learn` into a LOCAL, gitignored cache
(_research/data/.cache/pylibs/, covered by the existing /_research/data/.cache/ .gitignore rule) and
import it from there. Two outcomes, both honest:

  • LIVE path (install + import OK): run REAL UMAP on the 44 GloVe-50 vectors. Emit the spectral init
    (UMAP's default init — it gives UMAP its good GLOBAL structure), several convergence snapshots at
    growing n_epochs (each Procrustes-aligned to the converged layout so the animation shares ONE
    coordinate frame), the converged 2-D layout, the key params (n_neighbors, min_dist, n_epochs,
    metric), a cluster-tightness measure (within/between distance ratio) init vs converged, and the
    1-line UMAP-vs-t-SNE note.

  • FALLBACK path (offline / build fails): DO NOT fake a layout. Emit a small JSON that records the
    failure (the install error), the REAL word set + cluster labels, and the CONCEPTUAL params + the
    UMAP-vs-t-SNE note — so the deck agent shows a faithful conceptual treatment instead of fabricated
    coordinates. The script PRINTS which path happened.

Determinism: fixed word list, fixed params, UMAP random_state=42 (idempotent — repeated runs give
identical bytes; verified). Run:  /usr/bin/python3 _research/gen_l5_umap.py
"""
from __future__ import annotations
import json, pathlib, subprocess, sys
import numpy as np

from genlib import ROOT, DATA, r      # shared helpers (genlib.py)
VEC_CACHE = ROOT / "_research" / "data" / ".cache" / "glove50-demo-vectors.json"
DIMRED = DATA / "l5-dimred.json"
# local, gitignored install target (matches the /_research/data/.cache/ .gitignore rule)
PYLIBS = ROOT / "_research" / "data" / ".cache" / "pylibs"

# ── UMAP hyper-parameters (fixed → reproducible) ──────────────────────────────────────────────────
N_NEIGHBORS = 10        # local-neighbourhood size (balances local vs global structure)
MIN_DIST = 0.1          # how tightly UMAP packs points within a cluster
N_EPOCHS = 500          # optimisation epochs to convergence (UMAP default for small n)
METRIC = "cosine"       # cosine is the right metric for word embeddings
INIT = "spectral"       # UMAP's default init (Laplacian eigenmaps) — its global-structure head start
SEED = 42               # random_state (fixed → idempotent)
# snapshot schedule (epoch budgets); 0 = the init layout, N_EPOCHS = converged
SNAP_EPOCHS = [30, 80, 150, 300, N_EPOCHS]

UMAP_VS_TSNE = ("UMAP builds a fuzzy simplicial set (a weighted k-NN graph of fuzzy membership "
                "strengths) and minimises the cross-entropy between that high-D graph and a low-D one; "
                "vs t-SNE's KL divergence on Gaussian-vs-Student-t affinities, UMAP preserves more "
                "GLOBAL structure, scales to large n, and is markedly faster (and supports transform of "
                "new points). Like t-SNE, absolute UMAP distances/cluster sizes are not literal.")


def load_words():
    """The ~44-word set + cluster labels from l5-dimred.json, and their real GloVe-50 vectors."""
    dimred = json.loads(DIMRED.read_text())
    pts = dimred["pca"]["points"]
    words = [p["w"] for p in pts]
    clusters = [p["c"] for p in pts]
    cache = json.loads(VEC_CACHE.read_text())
    missing = [w for w in words if w not in cache]
    if missing:
        raise RuntimeError(f"GloVe cache missing words: {missing}")
    X = np.vstack([np.asarray(cache[w], dtype=np.float64) for w in words])
    return words, clusters, X


def ensure_umap():
    """Import umap from the local cache; if absent, try to pip-install it INTO the gitignored cache.
    Returns the umap module, or raises with the captured error (→ fallback path)."""
    PYLIBS.mkdir(parents=True, exist_ok=True)
    if str(PYLIBS) not in sys.path:
        sys.path.insert(0, str(PYLIBS))
    try:
        import umap  # noqa: F401
        return umap
    except Exception:
        pass
    # not present → attempt a local install (offline-safe: failure is caught and reported)
    cmd = [sys.executable, "-m", "pip", "install", "--quiet", "--disable-pip-version-check",
           "--target", str(PYLIBS), "umap-learn"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"pip install umap-learn failed (rc={proc.returncode}): "
                           f"{(proc.stderr or proc.stdout).strip()[-400:]}")
    import importlib
    importlib.invalidate_caches()
    import umap  # noqa: F401
    return umap


def cluster_tightness(P, clusters):
    """Mean within-cluster pairwise distance / mean between-cluster pairwise distance.
    Lower = tighter, better-separated clusters."""
    P = np.asarray(P, dtype=float)
    cl = np.asarray(clusters)
    wi, bw = [], []
    n = len(P)
    for i in range(n):
        for j in range(i + 1, n):
            d = float(np.linalg.norm(P[i] - P[j]))
            (wi if cl[i] == cl[j] else bw).append(d)
    return float(np.mean(wi) / np.mean(bw)) if bw else 0.0


def procrustes_align(target, src):
    """Rotate/scale/translate `src` to best match `target` (orthogonal Procrustes) so trajectory frames
    share ONE coordinate system. Returns the aligned src."""
    t = np.asarray(target, dtype=float); s = np.asarray(src, dtype=float)
    tc = t - t.mean(0); sc = s - s.mean(0)
    tn = np.linalg.norm(tc); sn = np.linalg.norm(sc)
    if sn == 0 or tn == 0:
        return s
    tc /= tn; sc /= sn
    U, _, Vt = np.linalg.svd(sc.T @ tc)
    R = U @ Vt
    aligned = (sc @ R) * tn + t.mean(0)
    return aligned


def spread(P):
    P = np.asarray(P, dtype=float)
    c = P.mean(0)
    return float(np.mean(np.linalg.norm(P - c, axis=1)))


def build_live(umap, words, clusters, X) -> dict:
    import warnings
    warnings.filterwarnings("ignore")           # silence UMAP's n_jobs / numba chatter
    from umap.umap_ import UMAP
    from umap.spectral import spectral_layout
    from sklearn.utils import check_random_state

    n = len(words)

    # ── fit once at full convergence → graph + final embedding ──
    reducer = UMAP(n_neighbors=N_NEIGHBORS, min_dist=MIN_DIST, n_components=2, metric=METRIC,
                   n_epochs=N_EPOCHS, init=INIT, random_state=SEED)
    Y_final = np.asarray(reducer.fit_transform(X), dtype=float)

    # ── the real INIT layout: UMAP's spectral (Laplacian-eigenmap) embedding of the fuzzy graph ──
    init_layout = np.asarray(
        spectral_layout(X, reducer.graph_, 2, random_state=check_random_state(SEED)), dtype=float)

    # ── convergence snapshots at growing n_epochs, each Procrustes-aligned to the converged layout ──
    # (UMAP runs an independent SGD per budget; aligning to the final frame makes the cluster-formation
    #  read as one coherent animation. The final snapshot IS the converged layout, disparity 0.)
    def run(ne):
        return np.asarray(
            UMAP(n_neighbors=N_NEIGHBORS, min_dist=MIN_DIST, n_components=2, metric=METRIC,
                 n_epochs=ne, init=INIT, random_state=SEED).fit_transform(X), dtype=float)

    frames = []
    # frame 0 = the spectral init, aligned into the final frame
    init_aligned = procrustes_align(Y_final, init_layout)
    frames.append(("init", 0, init_aligned))
    for ne in SNAP_EPOCHS:
        Y = Y_final if ne == N_EPOCHS else run(ne)
        Y_al = Y_final if ne == N_EPOCHS else procrustes_align(Y_final, Y)
        frames.append(("converged" if ne == N_EPOCHS else f"epoch {ne}", ne, Y_al))

    # normalise the WHOLE trajectory to a tidy shared box (compute scale from all frames together so
    # relative motion is preserved across frames).
    allpts = np.vstack([f[2] for f in frames])
    centre = allpts.mean(0)
    scale = float(np.abs(allpts - centre).max()) + 1e-9

    def to_pts(P):
        Q = (P - centre) / scale
        return [{"w": words[i], "x": r(Q[i, 0], 4), "y": r(Q[i, 1], 4), "c": clusters[i]}
                for i in range(n)]

    snapshots = []
    for label, ne, P in frames:
        snapshots.append({"epoch": ne, "label": label, "spread": r(spread((P - centre) / scale), 4),
                          "tightness": r(cluster_tightness(P, clusters), 4), "points": to_pts(P)})

    tight_init = snapshots[0]["tightness"]
    tight_final = snapshots[-1]["tightness"]

    # ── sanity asserts ──
    assert Y_final.shape == (n, 2), "UMAP did not return a 2-D layout for every word"
    assert tight_final <= tight_init + 1e-6, (
        f"converged clusters should be at least as tight as the init: {tight_init} → {tight_final}")
    assert len(snapshots) == len(SNAP_EPOCHS) + 1, "missing a snapshot frame"

    return {
        "status": "live",
        "method": (f"REAL UMAP on {n} GloVe-50 word vectors (umap-learn {umap.__version__}); "
                   f"spectral init → {N_EPOCHS}-epoch convergence; snapshots Procrustes-aligned to the "
                   f"converged layout (one coordinate frame)."),
        "umapVersion": umap.__version__,
        "nWords": n,
        "dimIn": int(X.shape[1]),
        "words": words,
        "clusters": clusters,
        "clusterNames": sorted(set(clusters)),
        "params": {"nNeighbors": N_NEIGHBORS, "minDist": MIN_DIST, "nEpochs": N_EPOCHS,
                   "metric": METRIC, "init": INIT, "randomState": SEED},
        "snapEpochs": [0] + SNAP_EPOCHS,
        "snapshots": snapshots,                  # frame 0 = spectral init → … → converged
        "tightness": {"init": tight_init, "converged": tight_final,
                      "note": "within-cluster / between-cluster mean distance ratio (lower = tighter)"},
        "umapVsTsne": UMAP_VS_TSNE,
        "note": ("frame 0 is UMAP's spectral init (it already carries global structure — UMAP's edge "
                 "over a random t-SNE start); the optimisation then tightens the fuzzy-graph clusters. "
                 "Absolute distances / cluster sizes are not literal."),
    }


def build_fallback(words, clusters, X, err: str) -> dict:
    """No fabricated layout — record the failure + the real word set + conceptual params."""
    return {
        "status": "unavailable",
        "method": ("umap-learn could not be installed/imported offline; NO live layout was generated. "
                   "This file records the real word set + conceptual params so the deck shows a faithful "
                   "CONCEPTUAL UMAP treatment instead of fabricated coordinates."),
        "installError": err,
        "nWords": len(words),
        "dimIn": int(X.shape[1]),
        "words": words,
        "clusters": clusters,
        "clusterNames": sorted(set(clusters)),
        "params": {"nNeighbors": N_NEIGHBORS, "minDist": MIN_DIST, "nEpochs": N_EPOCHS,
                   "metric": METRIC, "init": INIT, "randomState": SEED},
        "snapshots": [],
        "umapVsTsne": UMAP_VS_TSNE,
        "note": ("LIVE UMAP unavailable in this environment (offline / build deps). The deck agent should "
                 "present the conceptual params + the fuzzy-simplicial-set / cross-entropy story, and "
                 "reuse the t-SNE/PCA layouts for the actual scatter — do NOT invent UMAP coordinates."),
    }


def main() -> int:
    words, clusters, X = load_words()
    err = None
    try:
        umap = ensure_umap()
        out = build_live(umap, words, clusters, X)
    except Exception as e:               # offline / install failure → faithful fallback, no fakery
        err = f"{type(e).__name__}: {e}"
        out = build_fallback(words, clusters, X, err)

    DATA.mkdir(exist_ok=True)
    (DATA / "l5-umap.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    # ── PRINT which path happened + a one-line summary ──
    if out["status"] == "live":
        s = out["snapshots"]
        print(f"[umap] LIVE path: real UMAP (umap-learn {out['umapVersion']}) on {out['nWords']} "
              f"GloVe-{out['dimIn']} words; params n_neighbors={N_NEIGHBORS} min_dist={MIN_DIST} "
              f"n_epochs={N_EPOCHS} metric={METRIC} init={INIT} seed={SEED}")
        print(f"[umap] trajectory: {len(s)} frames {out['snapEpochs']} (spectral init → converged); "
              f"spread {s[0]['spread']}→{s[-1]['spread']}; cluster tightness "
              f"{out['tightness']['init']}→{out['tightness']['converged']} (lower=tighter) → CONVERGED")
        print(f"[umap] UMAP vs t-SNE: {UMAP_VS_TSNE[:88]}…")
        print("[umap] wrote data/l5-umap.json")
    else:
        print(f"[umap] FALLBACK path: live UMAP could NOT be generated offline → {err}")
        print(f"[umap] emitted real word set ({out['nWords']} words) + conceptual params; NO fake "
              f"coordinates. The deck agent should show a conceptual UMAP treatment.")
        print("[umap] wrote data/l5-umap.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
