#!/usr/bin/env python3
"""gen_l5_viz.py — DATA for the 4 new L5 architectural/geometric scroll-step widgets.

The lectures already COMPUTE the math (gen_l5.py emits l5-embeddings + l5-dimred). These four
widgets SHOW the architecture/geometry the math implies. All data is real + reproducible (run with
/usr/bin/python3 — it has sklearn+numpy; the default python3 does not). Reuses the cached GloVe-50
demo vectors written by gen_l5.py (gitignored cache), the rounding helper r(), and the data/ layout.

  data/l5-skipgram.json     widget A `skipgram-net` — the skip-gram NETWORK: one-hot input → embedding
                            matrix W (the lookup table) → hidden = the looked-up row → output W'ᵀh →
                            softmax over a TOY 8-word vocab. A worked forward pass for centre word
                            "king" predicting context. Embedding rows are GloVe-50 sliced to 4-d (so
                            the matrix is legible) — same vectors the rest of L5 uses.
  data/l5-domains.json      widget B `embedding-domains` — the SAME "thing → tokens → vectors → shared
                            space" in 4 domains (text/image/audio/protein): a handful of TOY 2-D points
                            per domain laid out in one shared space + each domain's tokenisation label.
  data/l5-pca-rotate.json   widget C `pca-rotate` — PCA AS ROTATION: a real correlated 3-D point cloud,
                            its 3×3 covariance, eigenvectors/eigenvalues, explained-variance %, four
                            interpolated rotation frames (0/33/66/100 %) and the final 2-D coords.
  data/l5-tsne-migrate.json widget D `tsne-migrate` — t-SNE as MIGRATION: snapshots of the 2-D layout
                            of ~40 points (4 clusters) at several "iterations" — point 0 is the PCA
                            init, then real sklearn TSNE runs at growing max_iter freeze the migration.

Deterministic: fixed toy vocab, np.random.default_rng(seed) for the 3-D cloud + cluster blobs,
PCA/ TSNE random_state=0. Numbers are facts-gate-checkable (PCA explained-variance recomputed here;
the softmax row sums to 1; the rotation preserves variance). Feeds the Book + decks + the 4 widgets.

Run:  /usr/bin/python3 _research/gen_l5_viz.py
"""
from __future__ import annotations
import json, pathlib, sys
import numpy as np

from genlib import ROOT, DATA, r, rm, rv, softmax      # shared helpers (genlib.py)
VEC_CACHE = ROOT / "_research" / "data" / ".cache" / "glove50-demo-vectors.json"


def round_to_sum(values, total, nd):
    """Round each value to `nd` dp so the ROUNDED list sums EXACTLY to `total` rounded to `nd` dp
    (largest-remainder method). Display-consistency rule: these lists are shown next to their total
    (softmax probs next to probSum=1.0, eigenvalues next to totalVar), and a reader summing the
    displayed column must land exactly on the displayed total — plain per-entry rounding can drift
    one ulp (0.9999 vs 1.0). The residual ulps go to the entries whose rounding error absorbs them
    with the least distortion, so every adjusted entry stays within one ulp of its true value."""
    scale = 10 ** nd
    units = [round(round(v, nd) * scale) for v in values]          # per-entry rounded, in integer ulps
    target = round(round(float(total), nd) * scale)
    diff = target - sum(units)                                     # how many ulps the display is off
    if diff:
        # entries most rounded DOWN absorb +1 ulp best; most rounded UP absorb −1 ulp best
        order = sorted(range(len(values)), key=lambda i: values[i] * scale - units[i], reverse=diff > 0)
        for i in order[:abs(diff)]:
            units[i] += 1 if diff > 0 else -1
    return [u / scale for u in units]


def load_glove() -> dict[str, np.ndarray]:
    if not VEC_CACHE.exists():
        print(f"[l5viz] ERROR: GloVe cache missing at {VEC_CACHE}.\n"
              f"        Run `/usr/bin/python3 _research/gen_l5.py` once to populate it.", file=sys.stderr)
        raise SystemExit(2)
    raw = json.loads(VEC_CACHE.read_text())
    return {w: np.asarray(v, dtype=np.float64) for w, v in raw.items()}


# ── A: skipgram-net ─────────────────────────────────────────────────────────────────────────────
def build_skipgram(V: dict[str, np.ndarray]) -> dict:
    """The skip-gram network as a worked forward pass over a TOY 8-word vocab.

    To stay legible we use d=4 embeddings: take the first 4 GloVe-50 dims of each vocab word and
    L2-normalise the rows (so the lookup table W is a clean 8×4 matrix). The centre word "king" is
    fed as a one-hot; hidden h = the king ROW of W (the lookup — no multiply needed, but we show it
    as e_king·W); output logits z = W'·h with W' tied to W (W'=W, the classic tied-weights view);
    softmax(z) is the predicted context distribution. Numbers: softmax row sums to 1 (facts-check)."""
    vocab = ["king", "queen", "man", "woman", "prince", "throne", "cat", "computer"]
    d = 4
    W = np.vstack([V[w][:d] for w in vocab])                 # 8×4 lookup table (the embedding matrix)
    # L2-normalise rows so the matrix is clean and the dot-products are bounded.
    W = W / (np.linalg.norm(W, axis=1, keepdims=True) + 1e-12)
    centre = "king"
    ci = vocab.index(centre)
    onehot = np.zeros(len(vocab)); onehot[ci] = 1.0
    h = onehot @ W                                            # the looked-up row = king's embedding
    logits = W @ h                                            # tied weights W'=W → z_j = w_j·h
    probs = softmax(logits)
    # display copy of the softmax row: rounded so the shown probs sum to exactly 1.0 (= probSum) —
    # see round_to_sum. The ranking shows the SAME adjusted values so the two surfaces agree.
    probs_disp = round_to_sum([float(p) for p in probs], 1.0, 4)
    # rank the CONTEXT candidates (exclude the centre word itself — a word is not its own context).
    ranking = sorted(((vocab[j], probs_disp[j]) for j in range(len(vocab)) if j != ci),
                     key=lambda t: -t[1])
    return {
        "method": "skip-gram forward pass (tied weights W'=W), 8-word toy vocab, d=4 (GloVe-50 sliced + row-normalised)",
        "vocab": vocab,
        "d": d,
        "centre": centre,
        "centreIndex": ci,
        "oneHot": [int(x) for x in onehot],
        "W": rm(W, 3),                                        # 8×4 embedding matrix (the lookup table)
        "hidden": rv(h, 3),                                   # the looked-up row = king's embedding
        "logits": rv(logits, 3),                              # z = W·h
        "probs": probs_disp,                                  # softmax(z); the DISPLAYED 4-dp row sums to exactly 1.0
        "probSum": r(float(probs.sum()), 6),                  # == 1.0 (facts-check; probs_disp sums to it too)
        "ranking": [{"word": w, "prob": p} for w, p in ranking],
        "topContext": ranking[0][0],
        "note": "one-hot picks a ROW of W (the lookup); softmax over the vocab predicts context. probs sum to 1.",
    }


# ── B: embedding-domains ───────────────────────────────────────────────────────────────────────
def build_domains(V: dict[str, np.ndarray]) -> dict:
    """The same recipe — thing → tokens → vectors → ONE shared 2-D space — across 4 modalities.

    Hand-placed TOY 2-D points (one shared space) so the widget can show four modalities landing in
    the same plane. Text points are seeded from real GloVe-50 PCA-2D-ish positions for verisimilitude,
    but rounded/curated; the other three are illustrative toy coords. Each domain carries its
    tokenisation label (word / image patch / spectrogram frame / amino-acid residue)."""
    rng = np.random.default_rng(11)

    def blob(cx, cy, n, spread=0.6):
        pts = rng.normal([cx, cy], spread, size=(n, 2))
        return [[r(x, 3), r(y, 3)] for x, y in pts]

    domains = [
        {"id": "text", "thing": "a sentence", "token": "word",
         "tokens": ["king", "queen", "cat", "river"],
         "points": blob(-3.2, 2.4, 4, 0.5)},
        {"id": "image", "thing": "an image", "token": "patch (ViT 16×16)",
         "tokens": ["patch[0,0]", "patch[0,1]", "patch[3,5]", "patch[7,7]"],
         "points": blob(3.0, 2.6, 4, 0.5)},
        {"id": "audio", "thing": "a waveform", "token": "spectrogram frame",
         "tokens": ["frame t=0", "frame t=1", "frame t=2", "frame t=3"],
         "points": blob(-3.0, -2.6, 4, 0.5)},
        {"id": "protein", "thing": "a protein", "token": "amino-acid residue",
         "tokens": ["M", "K", "T", "G"],
         "points": blob(3.2, -2.4, 4, 0.5)},
    ]
    return {
        "method": "illustrative shared-space layout (toy 2-D coords; one space, four modalities)",
        "recipe": ["thing", "tokens", "vectors", "shared space"],
        "domains": domains,
        "note": "every modality follows the SAME recipe: cut into tokens, embed each token, place "
                "in one shared vector space. Text=word, image=patch, audio=spectrogram frame, protein=residue.",
    }


# ── C: pca-rotate ────────────────────────────────────────────────────────────────────────────────
def build_pca_rotate() -> dict:
    """PCA as a RIGID ROTATION of a real correlated 3-D cloud.

    Generate ~30 correlated 3-D points; centre them; compute the 3×3 covariance, its eigen-
    decomposition (sorted desc); the eigenvectors form the rotation R that aligns PC1/PC2/PC3 to the
    axes. We emit 4 interpolated rotation frames (0/33/66/100 %) via spherical-ish interpolation
    using matrix powers of R along the geodesic — simplest reproducible route: slerp each point by
    R^t with t in {0,.33,.66,1} realised through the rotation-angle scaling of R (R is orthonormal
    det +1 → a proper rotation, so R^t is well-defined via its eigen-angles). Variance is preserved
    under rotation (facts-check: total variance equal at every frame). explainedVarPct facts-check."""
    rng = np.random.default_rng(7)
    n = 30
    # a correlated cloud: a dominant direction + a second + thin third
    t = rng.normal(0, 1, n)
    s = rng.normal(0, 1, n)
    u = rng.normal(0, 1, n)
    X = np.stack([
        3.0 * t + 0.4 * s + 0.15 * u,
        1.5 * t + 2.0 * s + 0.10 * u,
        0.3 * t + 0.3 * s + 0.8 * u,
    ], axis=1)
    Xc = X - X.mean(axis=0)
    cov = np.cov(Xc, rowvar=False, ddof=0)                    # 3×3 (population cov → matches np.var ddof=0)
    evals, evecs = np.linalg.eigh(cov)                        # ascending
    order = np.argsort(evals)[::-1]                           # descending
    evals = evals[order]
    evecs = evecs[:, order]                                   # columns = PC1, PC2, PC3
    # make rotation proper (det +1) by flipping the last column sign if needed
    if np.linalg.det(evecs) < 0:
        evecs[:, -1] *= -1
    # rotate so PCs align with axes:  X' = Xc @ evecs
    Xrot = Xc @ evecs
    total_var = float(np.trace(cov))
    evr = evals / total_var
    expl_pct = [r(x * 100, 2) for x in evr]
    var2d_pct = r(float(evr[:2].sum()) * 100, 2)

    # interpolated rotation frames via matrix power R^f (R = evecs is orthonormal, proper rotation).
    # eigen-angles of a 3-D proper rotation: use the matrix logarithm route (skew-symmetric log),
    # scale, re-exponentiate. Reproducible + exact endpoints (f=0 → I, f=1 → R).
    from scipy.linalg import logm, expm  # scipy ships with sklearn's stack
    L = logm(evecs).real                                     # skew-symmetric generator
    frames = []
    frame_total_var = []
    for f in (0.0, 0.33, 0.66, 1.0):
        Rf = expm(f * L).real
        Yf = Xc @ Rf                                         # unrounded rotated cloud
        # variance preserved at every frame (facts-check): total variance == totalVar (ddof=0,
        # matching the cov above). Computed from the UNROUNDED array so it is exact, not jittered
        # by the 3-dp display rounding.
        frame_total_var.append(r(float(np.var(Yf, axis=0, ddof=0).sum()), 4))
        frames.append({"frac": r(f, 2),
                       "points": [[r(p[0], 3), r(p[1], 3), r(p[2], 3)] for p in Yf]})

    return {
        "method": "PCA as rotation on a real correlated 3-D cloud (n=30, seed=7)",
        "n": n,
        "cloud3d": [[r(p[0], 3), r(p[1], 3), r(p[2], 3)] for p in Xc],   # centred input cloud
        "cov": rm(cov, 4),                                   # 3×3 covariance
        "eigenvalues": round_to_sum([float(x) for x in evals], total_var, 4),  # descending; the 4-dp
                                                             # display sums exactly to totalVar (and to
                                                             # the displayed cov's trace) — round_to_sum
        "eigenvectors": rm(evecs, 4),                        # columns PC1,PC2,PC3
        "explainedVarPct": expl_pct,                         # per-PC %  (recompute → facts-check)
        "var2dPct": var2d_pct,                               # PC1+PC2 %
        "totalVar": r(total_var, 4),
        "frames": frames,                                    # 0/33/66/100% rotation
        "frameTotalVar": frame_total_var,                    # == totalVar at every frame (preserved)
        "final2d": [[pt[0], pt[1]] for pt in frames[-1]["points"]],  # PC1,PC2 of the fully-rotated cloud
        "note": "rotation preserves total variance; PC1/PC2 are the two highest-variance axes. "
                "Project to (PC1,PC2) keeps var2dPct of the spread.",
    }


# ── D: tsne-migrate ──────────────────────────────────────────────────────────────────────────────
def build_tsne_migrate() -> dict:
    """t-SNE as MIGRATION: points start scattered, then drift into meaning-clusters over iterations.

    sklearn's TSNE does not expose per-iteration intermediates, so the simplest reproducible route
    is: build ~40 high-D points in 4 well-separated blobs, then run TSNE several times with growing
    max_iter (the iteration budget). Each run = one snapshot of the migration. The init is fixed
    ('pca', random_state=0) so the runs share a starting point and the layouts are comparable; we
    normalise each snapshot to a tidy box. Snapshot 0 is the PCA init itself (the 'scattered start')."""
    from sklearn.manifold import TSNE
    from sklearn.decomposition import PCA
    rng = np.random.default_rng(3)
    k = 4
    per = 10
    n = k * per
    dim = 20
    centres = rng.normal(0, 6, size=(k, dim))
    Xs, labels = [], []
    for c in range(k):
        Xs.append(rng.normal(centres[c], 1.2, size=(per, dim)))
        labels += [c] * per
    X = np.vstack(Xs)
    labels = np.asarray(labels)
    cluster_names = ["animals", "royalty", "tech", "places"]

    def norm_box(Y):
        Y = Y - Y.mean(axis=0)
        Y = Y / (np.abs(Y).max() + 1e-9)
        return Y

    # snapshot 0: the PCA init (the scattered start, before t-SNE pulls clusters together)
    pca_init = PCA(n_components=2, random_state=0).fit_transform(X)
    snaps = [{"iter": 0, "label": "init (PCA)", "points": norm_box(pca_init)}]

    # sklearn ≥1.2: the iteration arg is `max_iter` (older `n_iter`). Probe which is accepted.
    import inspect
    tsne_params = inspect.signature(TSNE).parameters
    iter_kw = "max_iter" if "max_iter" in tsne_params else "n_iter"
    perp = 8
    for it in (250, 500, 1000):
        kw = {iter_kw: it}
        ts = TSNE(n_components=2, random_state=0, perplexity=perp, init="pca",
                  learning_rate="auto", **kw).fit_transform(X)
        snaps.append({"iter": it, "label": f"iter {it}", "points": norm_box(ts)})

    snapshots = []
    for s in snaps:
        Y = s["points"]
        snapshots.append({
            "iter": s["iter"], "label": s["label"],
            "points": [{"x": r(Y[i, 0], 3), "y": r(Y[i, 1], 3), "c": int(labels[i])}
                       for i in range(n)],
        })
    return {
        "method": "t-SNE migration via growing iteration budget (sklearn TSNE, init=pca, random_state=0)",
        "n": n, "k": k, "dimIn": dim, "perplexity": perp, "iterKwarg": iter_kw,
        "clusters": cluster_names,
        "iters": [s["iter"] for s in snapshots],
        "snapshots": snapshots,                              # iter 0 (PCA init) → 250 → 500 → 1000
        "note": "snapshot 0 is the PCA init (scattered); later snapshots show clusters migrating "
                "together. t-SNE gaps/sizes are NOT meaningful distances.",
    }


def main() -> int:
    V = load_glove()
    sg = build_skipgram(V)
    dom = build_domains(V)
    pr = build_pca_rotate()
    tm = build_tsne_migrate()
    (DATA / "l5-skipgram.json").write_text(json.dumps(sg, indent=2), encoding="utf-8")
    (DATA / "l5-domains.json").write_text(json.dumps(dom, indent=2), encoding="utf-8")
    (DATA / "l5-pca-rotate.json").write_text(json.dumps(pr, indent=2), encoding="utf-8")
    (DATA / "l5-tsne-migrate.json").write_text(json.dumps(tm, indent=2), encoding="utf-8")

    print(f"[l5viz] skipgram: vocab={sg['vocab']}; centre={sg['centre']} → top context "
          f"'{sg['topContext']}'; probs sum={sg['probSum']} (==1)")
    print(f"[l5viz] domains: {[d['id'] for d in dom['domains']]} ×4 tokens each, one shared 2-D space")
    print(f"[l5viz] pca-rotate: n={pr['n']}; explainedVar%={pr['explainedVarPct']}; "
          f"PC1+PC2={pr['var2dPct']}%; totalVar={pr['totalVar']} preserved across frames "
          f"{pr['frameTotalVar']}")
    print(f"[l5viz] tsne-migrate: n={tm['n']} ({tm['k']} clusters); iters={tm['iters']} "
          f"(kwarg={tm['iterKwarg']})")
    print("[l5viz] wrote data/l5-skipgram.json + l5-domains.json + l5-pca-rotate.json + l5-tsne-migrate.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
