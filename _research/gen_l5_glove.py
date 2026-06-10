#!/usr/bin/env python3
"""gen_l5_glove.py — DATA for the L5 `glove-cooccur` scroll-step widget.

The instructor's note: "GloVe is explained too superficially — no step-by-step calc, no architecture,
no visual examples." This script fixes that by emitting a SMALL, fully-reproducible, REAL GloVe run
that the widget walks through step by step. Everything is computed here in numpy — no downloads, no
pretrained vectors — so every number is facts-gate-checkable and the run is idempotent.

  data/l5-glove.json   the whole worked GloVe story on a TINY king/queen/man/woman/cat/dog corpus:
    • the mini-corpus (8 short sentences) + the fixed-window, 1/distance-weighted, SYMMETRIC
      word-word co-occurrence matrix X (real counts);
    • the GloVe weighting f(x) = (x/x_max)^α if x<x_max else 1 (α=0.75) — emitted for the matrix AND
      sampled as a smooth curve so the widget can draw f(x);
    • a small DETERMINISTIC GloVe optimisation (embedding dim d=8, fixed seed, AdaGrad) that learns
      W, W̃, b, b̃ minimising  Σ f(X_ij) · (w_i·w̃_j + b_i + b̃_j − log X_ij)²  over the non-zero
      entries — emitted: the learned vectors, a 2-D PCA layout of (W+W̃) so the widget shows "the same
      map" as the predictive route, the weighted loss before/after, and a handful of WORKED entries
      (king·queen etc.: X_ij, log X_ij, f(X_ij), the model's dot+biases, the weighted squared error).

GloVe model recap (Pennington–Socher–Manning 2014):  w_i·w̃_j + b_i + b̃_j ≈ log X_ij, fit by the
weighted least-squares objective above. The 2-D map uses PCA on the summed embedding W+W̃ (the GloVe
paper sums the two as the final word vector). Count-based (GloVe) and predictive (word2vec) are two
faces of one coin — Levy & Goldberg (2014) show skip-gram with negative sampling implicitly factorises
a shifted-PMI co-occurrence matrix; GloVe factorises log-counts EXPLICITLY.

Determinism: fixed corpus, fixed window=4, np.random.default_rng(SEED) for the init, full-batch
AdaGrad for ITERS steps. The convergence asserts (loss drops a lot; reconstruction ≈ log X within
tolerance on the high-count pairs) PRINT before/after losses and a worked reconstruction.

Run:  /usr/bin/python3 _research/gen_l5_glove.py
"""
from __future__ import annotations
import json, math, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# ── hyper-parameters (fixed → reproducible) ───────────────────────────────────────────────────────
WINDOW = 4          # symmetric context window (words on each side)
X_MAX = 10.0        # GloVe weighting cap
ALPHA = 0.75        # GloVe weighting exponent
DIM = 8             # embedding dimension
SEED = 7            # init RNG seed
ITERS = 600         # full-batch AdaGrad iterations (plenty to converge on this tiny matrix)
LR = 0.05           # AdaGrad base learning rate

# ── mini-corpus: the course's royalty + animals theme (8 short sentences) ──────────────────────────
CORPUS = [
    "the king loves the queen",
    "the queen loves the king",
    "the king rules the kingdom",
    "the man loves the woman",
    "the woman loves the man",
    "the cat chases the dog",
    "the dog chases the cat",
    "the king has a cat and the queen has a dog",
]


def r(x, n=4):
    return round(float(x), n)


def rm(M, n=4):
    return [[r(v, n) for v in row] for row in np.asarray(M, dtype=float)]


def rv(v, n=4):
    return [r(x, n) for x in np.asarray(v, dtype=float).ravel()]


def tokenize(sentences):
    return [s.lower().split() for s in sentences]


def build_vocab(tokenized):
    """Vocabulary sorted by descending frequency (stable, deterministic)."""
    freq = {}
    for toks in tokenized:
        for w in toks:
            freq[w] = freq.get(w, 0) + 1
    # sort by (-count, word) so order is fully deterministic.
    vocab = sorted(freq, key=lambda w: (-freq[w], w))
    return vocab, freq


def cooccurrence(tokenized, vocab, window):
    """Symmetric word-word co-occurrence with REAL GloVe 1/distance weighting:
    a context word d positions from the centre contributes 1/d to the count (so adjacent words count
    fully, farther ones less). The matrix is symmetric: every centre/context pair is added in both
    directions, so X is symmetric by construction."""
    idx = {w: i for i, w in enumerate(vocab)}
    n = len(vocab)
    X = np.zeros((n, n), dtype=float)
    for toks in tokenized:
        ids = [idx[w] for w in toks]
        L = len(ids)
        for c in range(L):
            i = ids[c]
            for off in range(1, window + 1):
                j_pos = c + off
                if j_pos < L:
                    j = ids[j_pos]
                    w = 1.0 / off          # 1/distance weighting
                    X[i, j] += w
                    X[j, i] += w           # symmetric
    return X


def weighting(X, x_max=X_MAX, alpha=ALPHA):
    """GloVe f(x) = (x/x_max)^alpha if x < x_max else 1.  f(0)=0."""
    F = np.zeros_like(X)
    nz = X > 0
    F[nz] = np.where(X[nz] < x_max, (X[nz] / x_max) ** alpha, 1.0)
    return F


def weighted_loss(W, Wt, b, bt, X, F):
    """J = Σ_{ij : X_ij>0} f(X_ij) (w_i·w̃_j + b_i + b̃_j − log X_ij)²."""
    nz = X > 0
    pred = W @ Wt.T + b[:, None] + bt[None, :]      # n×n model reconstruction
    diff = pred - np.log(X, where=nz, out=np.zeros_like(X))
    return float(np.sum(F[nz] * diff[nz] ** 2))


# checkpoints (iteration indices) at which the trajectory snapshots W+W̃. 0 = the RANDOM init,
# ITERS = the converged layout. These are a SUBSET of the loss-history grid so the curve aligns.
TRAJ_CHECKPOINTS = [0, 10, 25, 50, 100, 200, 350, ITERS]


def train_glove(X, F, dim=DIM, iters=ITERS, lr=LR, seed=SEED, snapshot_iters=None):
    """Deterministic full-batch AdaGrad GloVe fit. Returns the learned params + a loss history.

    `snapshot_iters` (optional): a set of iteration indices at which to record a READ-ONLY copy of the
    summed embedding W+W̃ (for the trajectory animation). Snapshotting does NOT touch the update stream
    or the RNG, so passing it leaves every existing emitted number byte-identical."""
    n = X.shape[0]
    rng = np.random.default_rng(seed)
    scale = 0.5 / dim
    W = (rng.random((n, dim)) - 0.5) * scale         # focus vectors
    Wt = (rng.random((n, dim)) - 0.5) * scale         # context vectors
    b = (rng.random(n) - 0.5) * scale
    bt = (rng.random(n) - 0.5) * scale

    # AdaGrad accumulators (start at 1 so the first step is ~lr, the canonical GloVe init).
    gW = np.ones_like(W); gWt = np.ones_like(Wt); gb = np.ones_like(b); gbt = np.ones_like(bt)

    nz = np.argwhere(X > 0)
    logX = np.log(X, where=(X > 0), out=np.zeros_like(X))
    f = F

    snap_set = set(snapshot_iters) if snapshot_iters is not None else set()
    snaps = {}                                       # iter → (W+W̃ copy, loss at that iter)

    history = []
    for it in range(iters + 1):
        loss_it = None
        if it == 0 or it == iters or it % 50 == 0:
            loss_it = r(weighted_loss(W, Wt, b, bt, X, F), 4)
            history.append({"iter": it, "loss": loss_it})
        if it in snap_set:
            if loss_it is None:                      # a snapshot iter that is NOT on the history grid
                loss_it = r(weighted_loss(W, Wt, b, bt, X, F), 4)
            snaps[it] = ((W + Wt).copy(), loss_it)
        if it == iters:
            break
        # accumulate full-batch gradients over the non-zero entries.
        dW = np.zeros_like(W); dWt = np.zeros_like(Wt)
        db = np.zeros_like(b); dbt = np.zeros_like(bt)
        for i, j in nz:
            inner = W[i] @ Wt[j] + b[i] + bt[j] - logX[i, j]
            coef = 2.0 * f[i, j] * inner
            dW[i] += coef * Wt[j]
            dWt[j] += coef * W[i]
            db[i] += coef
            dbt[j] += coef
        # AdaGrad updates.
        gW += dW ** 2; gWt += dWt ** 2; gb += db ** 2; gbt += dbt ** 2
        W -= lr * dW / np.sqrt(gW)
        Wt -= lr * dWt / np.sqrt(gWt)
        b -= lr * db / np.sqrt(gb)
        bt -= lr * dbt / np.sqrt(gbt)
    if snapshot_iters is not None:
        return W, Wt, b, bt, history, snaps
    return W, Wt, b, bt, history


def pca_2d(M):
    """Centre + PCA to 2-D; return the coords and the % variance kept (deterministic, sign-fixed)."""
    Mc = M - M.mean(axis=0)
    U, S, Vt = np.linalg.svd(Mc, full_matrices=False)
    coords = Mc @ Vt[:2].T
    # sign convention: make the largest-|value| entry of each axis positive (deterministic flip).
    for k in range(2):
        j = int(np.argmax(np.abs(coords[:, k])))
        if coords[j, k] < 0:
            coords[:, k] *= -1
    var = (S ** 2)
    var2d = float(var[:2].sum() / var.sum() * 100)
    return coords, var2d


def pca_2d_basis(M):
    """Same PCA as pca_2d but ALSO returns the fitted basis (mean, the two axes, the sign flips) so the
    trajectory can project EARLIER iterations onto the SAME final 2-D frame — giving a coherent
    animation (one coordinate system) where the final frame matches the existing `map` exactly."""
    mean = M.mean(axis=0)
    Mc = M - mean
    U, S, Vt = np.linalg.svd(Mc, full_matrices=False)
    axes = Vt[:2].copy()                              # 2×dim projection axes
    coords = Mc @ axes.T
    signs = np.ones(2)
    for k in range(2):
        j = int(np.argmax(np.abs(coords[:, k])))
        if coords[j, k] < 0:
            signs[k] = -1.0
    return {"mean": mean, "axes": axes, "signs": signs}


def project_2d(M, basis):
    """Project M onto a fixed PCA basis (centred by the basis mean, sign-flipped to match)."""
    coords = (M - basis["mean"]) @ basis["axes"].T
    return coords * basis["signs"][None, :]


def main() -> int:
    tokenized = tokenize(CORPUS)
    vocab, freq = build_vocab(tokenized)
    n = len(vocab)
    X = cooccurrence(tokenized, vocab, WINDOW)
    F = weighting(X)

    # ── train ───────────────────────────────────────────────────────────────────────────────────
    # Pass the trajectory checkpoints so we ALSO get read-only W+W̃ snapshots (the snapshot does not
    # perturb the update stream → every existing emitted number stays byte-identical).
    W, Wt, b, bt, history, traj_snaps = train_glove(X, F, snapshot_iters=TRAJ_CHECKPOINTS)
    loss0 = history[0]["loss"]
    lossN = history[-1]["loss"]

    # final reconstruction model values  m_ij = w_i·w̃_j + b_i + b̃_j
    model = W @ Wt.T + b[:, None] + bt[None, :]
    nz_mask = X > 0
    logX = np.log(X, where=nz_mask, out=np.zeros_like(X))

    # final word vectors = W + W̃ (the GloVe paper sums focus + context). 2-D PCA layout = "the map".
    word_vecs = W + Wt
    coords, var2d = pca_2d(word_vecs)

    # ── trajectory: random-init → converged, all frames in the SAME (final) PCA frame ─────────────
    # The slide animates "init scattered → converged where related words cluster". We project EVERY
    # checkpoint's W+W̃ through the FINAL PCA basis (one coordinate system), so points move smoothly and
    # the last frame matches `map` exactly. Frame 0 = the RANDOM AdaGrad init.
    traj_basis = pca_2d_basis(word_vecs)
    traj_frames = []
    for it in TRAJ_CHECKPOINTS:
        Wsum_it, loss_it = traj_snaps[it]
        P = project_2d(Wsum_it, traj_basis)
        centroid = P.mean(axis=0)
        sp = float(np.mean(np.linalg.norm(P - centroid, axis=1)))   # cloud spread (mean dist to centroid)
        traj_frames.append({
            "iter": it,
            "label": "random init" if it == 0 else ("converged" if it == ITERS else f"iter {it}"),
            "loss": loss_it,
            "spread": r(sp, 4),
            "points": [{"w": vocab[i], "x": r(P[i, 0], 3), "y": r(P[i, 1], 3), "freq": freq[vocab[i]]}
                       for i in range(n)],
        })
    traj_init_spread = traj_frames[0]["spread"]
    traj_final_spread = traj_frames[-1]["spread"]

    # related vs unrelated 2-D distance in the trajectory frame, init (random) vs converged.
    def traj_pair_dist(frame_pts, a, c):
        pa = next(p for p in frame_pts if p["w"] == a)
        pc = next(p for p in frame_pts if p["w"] == c)
        return float(np.hypot(pa["x"] - pc["x"], pa["y"] - pc["y"]))
    TRAJ_RELATED = [("king", "queen"), ("man", "woman"), ("cat", "dog")]
    init_pts, final_pts = traj_frames[0]["points"], traj_frames[-1]["points"]
    traj_related = [{"a": a, "b": c,
                     "distInit": r(traj_pair_dist(init_pts, a, c), 3),
                     "distFinal": r(traj_pair_dist(final_pts, a, c), 3)}
                    for a, c in TRAJ_RELATED]

    # the final trajectory frame must equal the existing `map` (same vectors, same basis) — consistency.
    map_check_max = float(np.max(np.abs(coords - project_2d(word_vecs, traj_basis))))
    assert map_check_max < 1e-9, f"trajectory final frame must match the map basis (off {map_check_max})"

    # ── worked entries: a few high-count pairs the widget walks through step-by-step ──────────────
    def entry(a, c):
        i, j = vocab.index(a), vocab.index(c)
        xij = X[i, j]
        logx = math.log(xij) if xij > 0 else float("-inf")
        m = float(model[i, j])
        fij = float(F[i, j])
        werr = fij * (m - logx) ** 2
        return {
            "i": a, "j": c, "iIndex": i, "jIndex": j,
            "X": r(xij, 4), "logX": r(logx, 4), "f": r(fij, 4),
            "model": r(m, 4),                    # w_i·w̃_j + b_i + b̃_j
            "dot": r(float(W[i] @ Wt[j]), 4),    # the w_i·w̃_j part alone
            "bi": r(float(b[i]), 4), "bj": r(float(bt[j]), 4),
            "residual": r(m - logx, 4),
            "weightedErr": r(werr, 6),
        }

    worked = [entry("king", "queen"), entry("the", "king"), entry("cat", "dog")]

    # ── convergence asserts (high-count pairs reconstruct log X within tolerance) ─────────────────
    # check the reconstruction on the entries with the largest weights f (those GloVe is told to fit).
    flat = [(i, j, F[i, j]) for i in range(n) for j in range(n) if X[i, j] > 0]
    flat.sort(key=lambda t: -t[2])
    top = flat[: max(5, len(flat) // 4)]
    resid = [abs(model[i, j] - logX[i, j]) for i, j, _ in top]
    max_resid = max(resid)
    mean_resid = sum(resid) / len(resid)

    assert lossN < loss0 * 0.05, f"loss did not drop enough: {loss0} → {lossN}"
    assert max_resid < 0.25, f"high-weight reconstruction off by {max_resid:.4f} (want < 0.25)"
    # X symmetric, f in [0,1], f(0)=0.
    assert np.allclose(X, X.T), "co-occurrence matrix is not symmetric"
    assert F.min() >= 0.0 and F.max() <= 1.0, "weighting f(x) out of [0,1]"
    assert F[X == 0].sum() == 0.0, "f(0) must be 0"

    # ── f(x) sample curve for the widget (smooth, 0..1.5*x_max) ───────────────────────────────────
    xs = np.linspace(0, X_MAX * 1.5, 31)
    f_curve = [{"x": r(x, 3), "f": r(1.0 if x >= X_MAX else (x / X_MAX) ** ALPHA, 4)} for x in xs]

    # non-zero co-occurrence cells as a tidy list (for the heatmap + the f-overlay).
    cells = []
    for i in range(n):
        for j in range(n):
            if X[i, j] > 0:
                cells.append({"i": i, "j": j, "x": r(X[i, j], 3), "f": r(F[i, j], 4),
                              "logX": r(math.log(X[i, j]), 4)})
    xmaxval = float(X.max())

    out = {
        "method": ("GloVe on a mini royalty+animals corpus: symmetric word-word co-occurrence with "
                   "1/distance weighting, window=4; weighting f(x)=(x/x_max)^0.75 capped at 1 "
                   "(x_max=10); AdaGrad fit of w_i·w̃_j+b_i+b̃_j≈log X_ij, dim=8, seed=7"),
        "window": WINDOW, "xMax": X_MAX, "alpha": ALPHA, "dim": DIM, "iters": ITERS, "seed": SEED,
        "weightingScheme": "1/distance (a context word d steps from centre adds 1/d to the count)",
        "corpus": CORPUS,
        "vocab": vocab,
        "freq": [freq[w] for w in vocab],
        "n": n,
        "X": rm(X, 3),                          # symmetric co-occurrence matrix (real weighted counts)
        "F": rm(F, 4),                          # GloVe weighting f(X_ij) per cell
        "logX": rm(logX, 4),                    # log X_ij (0 where X_ij==0)
        "cells": cells,                         # non-zero cells as {i,j,x,f,logX}
        "xMaxObserved": r(xmaxval, 3),
        "fCurve": f_curve,                      # smooth f(x) sample for the curve plot
        "vectors": {                            # the learned GloVe parameters (dim=8)
            "W": rm(W, 4), "Wtilde": rm(Wt, 4),
            "b": rv(b, 4), "btilde": rv(bt, 4),
            "wordVec": rm(word_vecs, 4),        # W + W̃ (the final GloVe word vector)
        },
        "map": {                                # PCA-2D of W+W̃ — "the same map" as word2vec
            "method": "PCA(2) of W+W̃", "var2dPct": r(var2d, 1),
            "points": [{"w": vocab[i], "x": r(coords[i, 0], 3), "y": r(coords[i, 1], 3),
                        "freq": freq[vocab[i]]} for i in range(n)],
        },
        "loss": {"history": history, "before": loss0, "after": lossN,
                 "dropPct": r((1 - lossN / loss0) * 100, 2)},
        "worked": worked,                       # king·queen etc.: X, logX, f, model dot+biases, w-err
        "reconstruction": {"maxAbsResidualTopWeighted": r(max_resid, 4),
                           "meanAbsResidualTopWeighted": r(mean_resid, 4),
                           "nTopChecked": len(top)},
        "levyGoldberg": ("count-based (GloVe factorises log-counts) and predictive (word2vec skip-gram) "
                         "are two faces of one coin: Levy & Goldberg (2014) show SGNS implicitly "
                         "factorises a shifted-PMI co-occurrence matrix."),
        "note": ("GloVe fits w_i·w̃_j + b_i + b̃_j ≈ log X_ij by weighted least squares; f(x) down-weights "
                 "rare noisy pairs and caps frequent ones. The learned vectors land in the same kind of "
                 "geometry as the predictive route."),
        # ── NEW: random-init → converged trajectory (appended last; all keys above are unchanged) ──
        "trajectory": {
            "method": ("AdaGrad GloVe fit from RANDOM init to convergence; each checkpoint's W+W̃ is "
                       "projected through the FINAL PCA(2) basis (one coordinate frame) so the animation "
                       "is coherent and the last frame equals `map`."),
            "checkpoints": TRAJ_CHECKPOINTS,
            "basis": "fixed: PCA(2) of the converged W+W̃ (the same axes as `map`)",
            "frames": traj_frames,                  # iter 0 (random init) → … → converged: pts+loss+spread
            "lossCurve": [{"iter": h["iter"], "loss": h["loss"]} for h in history],  # the full per-step curve
            "spread": {"init": traj_init_spread, "final": traj_final_spread,
                       "ratio": r(traj_final_spread / traj_init_spread, 3) if traj_init_spread else None},
            "related": traj_related,                # king·queen etc.: 2-D distance init vs converged
            "finalFrameMatchesMap": True,           # asserted above (max |Δ| < 1e-9)
            "note": ("frame 0 is the random AdaGrad init (scattered); as the weighted least-squares loss "
                     "drops, related words (king·queen, man·woman, cat·dog) pull together. The loss curve "
                     "is the same history emitted under `loss` (re-listed here for the trajectory plot)."),
        },
    }

    DATA.mkdir(exist_ok=True)
    (DATA / "l5-glove.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    # ── PRINT before/after loss + a worked reconstruction (facts-checkable) ───────────────────────
    print(f"[l5glove] vocab ({n}): {vocab}")
    print(f"[l5glove] X_max observed = {xmaxval:.3f}; weighting f(x)=(x/{X_MAX:g})^{ALPHA} capped at 1")
    print(f"[l5glove] weighted loss: before={loss0:.4f}  after={lossN:.4f}  "
          f"(drop {out['loss']['dropPct']}%)  over {ITERS} AdaGrad iters")
    for w in worked:
        print(f"[l5glove] worked {w['i']}·{w['j']}: X={w['X']}  logX={w['logX']}  f={w['f']}  "
              f"model(w·w̃+b+b̃)={w['model']}  residual={w['residual']}  weightedErr={w['weightedErr']}")
    print(f"[l5glove] top-weighted reconstruction: max|resid|={max_resid:.4f}, "
          f"mean|resid|={mean_resid:.4f} over {len(top)} pairs (want max<0.25) → CONVERGED")
    print(f"[l5glove] PCA-2D map keeps {out['map']['var2dPct']}% var; wrote data/l5-glove.json")
    t = out["trajectory"]
    print(f"[l5glove] trajectory: {len(t['frames'])} frames {t['checkpoints']} (random init → converged); "
          f"loss {t['frames'][0]['loss']} → {t['frames'][-1]['loss']}; "
          f"spread init={t['spread']['init']} → final={t['spread']['final']} (×{t['spread']['ratio']}); "
          f"final frame == map: {t['finalFrameMatchesMap']}")
    print("[l5glove] trajectory related 2-D dist (init→final): " +
          ", ".join(f"{p['a']}·{p['b']} {p['distInit']}→{p['distFinal']}" for p in t["related"]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
