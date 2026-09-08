#!/usr/bin/env python3
"""gen_l5_tsne_math.py — DATA for the L5 `tsne-steps` widget: the MATH behind t-SNE, worked end to end.

The instructor's note: "t-SNE is explained too superficially — no step-by-step calc, no architecture,
no visual examples." The existing `tsne-migrate` widget shows the *migration* (points drifting into
clusters); THIS data drives a complementary widget that teaches the *algorithm* — the actual t-SNE
pipeline computed on REAL GloVe-50 word vectors, with every intermediate emitted so the widget shows
real numbers, not hand-waving.

Reuses the cached GloVe-50 demo vectors written by gen_l5.py (gitignored cache) + the r() rounding
helper + the data/ layout — same conventions as gen_l5_viz.py (which made the tsne-migrate data).

Pipeline emitted to data/l5-tsne-math.json (REAL, reproducible numbers):
  1. a small set of ~9 real high-D points: a handful of GloVe-50 words (animals + royalty), so the
     chosen anchor has clear near neighbours (other animals) and clear far points (royalty);
  2. pairwise squared distances in high-D (full matrix);
  3. for ONE anchor word i: the conditional affinities
        p_{j|i} = exp(-||x_i - x_j||^2 / 2 sigma_i^2) / sum_{k!=i} exp(...)
     with sigma_i tuned by BINARY SEARCH to a target PERPLEXITY (Perp=5). Emits sigma_i, the beta_i
     (= 1/2sigma_i^2), the full p_{j|i} row, the row entropy H(P_i) in bits, and verifies
        Perp = 2^{H(P_i)}  ≈ target   (the entropy → perplexity link);
  4. the symmetrised joint p_ij = (p_{j|i} + p_{i|j}) / (2n) (full matrix + the anchor row);
  5. a low-D 2-D layout (sklearn TSNE on the 9 points) → the Student-t affinities
        q_ij = (1 + ||y_i - y_j||^2)^-1 / sum_{k!=l} (1 + ||y_k - y_l||^2)^-1   (heavy tail);
  6. the cost KL(P||Q) = sum_{i!=j} p_ij log(p_ij / q_ij);
  7. the gradient for the anchor:
        dC/dy_i = 4 sum_j (p_ij - q_ij)(y_i - y_j)(1 + ||y_i - y_j||^2)^-1.

Sanity asserts (PRINTED): Perp(P_i) ≈ target (within tol), and KL >= 0. A couple of worked cells are
emitted so the widget (and a fact-checker) can see one p_{j|i}, one p_ij and one q_ij computed by hand.

Deterministic: fixed word list, sklearn TSNE random_state=0, init='pca'. Run with /usr/bin/python3
(numpy + sklearn). Run:  /usr/bin/python3 _research/gen_l5_tsne_math.py
"""
from __future__ import annotations
import json, pathlib, sys
import numpy as np

from genlib import ROOT, DATA, r, rm, rv      # shared helpers (extracted verbatim; n=4 defaults match)
VEC_CACHE = ROOT / "_research" / "data" / ".cache" / "glove50-demo-vectors.json"

# anchor + the 9-word set. Two semantic groups so the anchor has near (animals) + far (royalty)
# neighbours — the perplexity-5 affinity row then clearly separates "near = high p" from "far ≈ 0".
WORDS = ["cat", "kitten", "dog", "puppy", "lion", "tiger", "king", "queen", "throne"]
ANCHOR = "cat"
TARGET_PERP = 5.0
GROUP = {  # for the widget legend / colouring (not used in the math)
    "cat": "animal", "kitten": "animal", "dog": "animal", "puppy": "animal",
    "lion": "animal", "tiger": "animal", "king": "royalty", "queen": "royalty",
    "throne": "royalty",
}


def load_glove() -> dict[str, np.ndarray]:
    if not VEC_CACHE.exists():
        print(f"[tsne-math] ERROR: GloVe cache missing at {VEC_CACHE}.\n"
              f"            Run `/usr/bin/python3 _research/gen_l5.py` once to populate it.",
              file=sys.stderr)
        raise SystemExit(2)
    raw = json.loads(VEC_CACHE.read_text())
    return {w: np.asarray(v, dtype=np.float64) for w, v in raw.items()}


def pairwise_sq_dists(X: np.ndarray) -> np.ndarray:
    """Full n×n matrix of squared Euclidean distances ||x_i - x_j||^2 (exact, symmetric, 0 diag)."""
    sq = np.sum(X * X, axis=1)
    D2 = sq[:, None] + sq[None, :] - 2.0 * (X @ X.T)
    np.fill_diagonal(D2, 0.0)
    return np.maximum(D2, 0.0)  # clamp tiny negatives from float round-off


def cond_p_row(d2_row: np.ndarray, i: int, beta: float) -> np.ndarray:
    """Conditional affinity row p_{j|i} for a given beta = 1/(2 sigma_i^2). p_{i|i}=0, row sums to 1."""
    # numerator exp(-beta * ||x_i - x_j||^2); the i==i term is forced to 0 (a point is not its own
    # neighbour). Subtract the row max (over j!=i) for numerical stability — does not change the ratio.
    num = -beta * d2_row
    num[i] = -np.inf  # exclude self
    num = num - np.max(num[np.isfinite(num)])
    p = np.exp(num)
    p[i] = 0.0
    s = p.sum()
    return p / s if s > 0 else p


def entropy_bits(p: np.ndarray) -> float:
    """Shannon entropy H(P) in BITS (log base 2). Perplexity = 2^H. Zero terms contribute 0."""
    nz = p[p > 0]
    return float(-np.sum(nz * np.log2(nz)))


def tune_beta_for_perplexity(d2_row: np.ndarray, i: int, target_perp: float,
                             tol: float = 1e-5, max_iter: int = 100):
    """Binary-search beta_i = 1/(2 sigma_i^2) so that 2^{H(p_{j|i})} == target_perp.

    Perplexity rises with sigma (falls with beta): a larger sigma spreads mass over more neighbours →
    higher entropy → higher perplexity. So we bisect on beta to hit log2(target_perp) bits of entropy.
    Returns (beta, sigma, p_row, H_bits, perp). This is exactly the routine in van der Maaten & Hinton.
    """
    target_H = np.log2(target_perp)
    beta = 1.0
    lo, hi = -np.inf, np.inf
    p = cond_p_row(d2_row, i, beta)
    H = entropy_bits(p)
    for _ in range(max_iter):
        diff = H - target_H
        if abs(diff) < tol:
            break
        if diff > 0:          # entropy too HIGH → perplexity too high → need LARGER beta (smaller sigma)
            lo = beta
            beta = beta * 2.0 if hi == np.inf else (beta + hi) / 2.0
        else:                 # entropy too LOW → need SMALLER beta (larger sigma)
            hi = beta
            beta = beta / 2.0 if lo == -np.inf else (beta + lo) / 2.0
        p = cond_p_row(d2_row, i, beta)
        H = entropy_bits(p)
    sigma = float(np.sqrt(1.0 / (2.0 * beta)))
    perp = float(2.0 ** H)
    return beta, sigma, p, H, perp


def build() -> dict:
    V = load_glove()
    missing = [w for w in WORDS if w not in V]
    if missing:
        print(f"[tsne-math] ERROR: words missing from GloVe cache: {missing}", file=sys.stderr)
        raise SystemExit(2)

    X = np.vstack([V[w] for w in WORDS])          # n×50 real high-D points
    n, dim = X.shape
    ai = WORDS.index(ANCHOR)

    # 1+2. pairwise squared distances in high-D
    D2 = pairwise_sq_dists(X)

    # 3. conditional affinities for the anchor, sigma tuned to TARGET_PERP by binary search
    beta_a, sigma_a, p_anchor_cond, H_a, perp_a = tune_beta_for_perplexity(D2[ai], ai, TARGET_PERP)

    # full conditional matrix P_cond[i] = p_{j|i} (each row tuned to TARGET_PERP) — needed to symmetrise.
    betas = np.zeros(n); sigmas = np.zeros(n)
    P_cond = np.zeros((n, n))
    for i in range(n):
        b, s, pr, _, _ = tune_beta_for_perplexity(D2[i], i, TARGET_PERP)
        betas[i] = b; sigmas[i] = s; P_cond[i] = pr

    # 4. symmetrised joint p_ij = (p_{j|i} + p_{i|j}) / (2n)
    P = (P_cond + P_cond.T) / (2.0 * n)
    np.fill_diagonal(P, 0.0)
    # P should sum to 1 (the joint distribution over ordered pairs i!=j).

    # 5. low-D 2-D layout via sklearn TSNE (real run, deterministic) → Student-t affinities q_ij
    from sklearn.manifold import TSNE
    # perplexity must be < n; for n=9 a perplexity of 4 is the standard usable max. We KEEP the
    # affinity-teaching perplexity at TARGET_PERP=5 (the conditional-P story), and run the layout at
    # a layout-perplexity sklearn accepts for this tiny n. The two are independent knobs; the widget
    # teaches the affinity perplexity (5) and just USES the resulting layout.
    layout_perp = min(4.0, n - 1.5)
    Y = TSNE(n_components=2, random_state=0, init="pca", perplexity=layout_perp,
             learning_rate="auto").fit_transform(X)
    Y = Y - Y.mean(axis=0)                        # centre for a tidy frame

    # Student-t numerator (1 + ||y_i - y_j||^2)^-1, joint q_ij normalised over all ordered pairs k!=l.
    Dy2 = pairwise_sq_dists(Y)
    num_q = 1.0 / (1.0 + Dy2)
    np.fill_diagonal(num_q, 0.0)
    Z = num_q.sum()                               # normaliser = sum over all i!=j
    Q = num_q / Z
    np.fill_diagonal(Q, 0.0)

    # 6. KL(P||Q) = sum_{i!=j} p_ij log(p_ij / q_ij)
    mask = (P > 0) & (Q > 0)
    KL = float(np.sum(P[mask] * np.log(P[mask] / Q[mask])))

    # 7. gradient for the anchor: dC/dy_i = 4 sum_j (p_ij - q_ij)(y_i - y_j)(1 + ||y_i - y_j||^2)^-1
    grad_anchor = np.zeros(2)
    for j in range(n):
        if j == ai:
            continue
        coeff = 4.0 * (P[ai, j] - Q[ai, j]) * num_q[ai, j]
        grad_anchor += coeff * (Y[ai] - Y[j])

    # full gradient (all points) — handy for the widget's "every point feels a force" view
    G = np.zeros_like(Y)
    PQ = (P - Q) * num_q                          # (p_ij - q_ij)(1+d^2)^-1
    for i in range(n):
        diff = Y[i] - Y                           # n×2 of (y_i - y_j)
        G[i] = 4.0 * (PQ[i][:, None] * diff).sum(axis=0)

    # ── a couple of WORKED CELLS (anchor → its nearest other-animal, and anchor → a far royalty word)
    # so the widget + a fact-checker can see one p_{j|i}, one p_ij, one q_ij computed transparently.
    near_j = int(np.argmin([D2[ai, j] if j != ai else np.inf for j in range(n)]))
    far_j = int(np.argmax(D2[ai]))
    def worked(j):
        return {
            "j": j, "word": WORDS[j],
            "d2_highD": r(D2[ai, j], 4),
            "exp_arg": r(-beta_a * D2[ai, j], 6),                     # -beta * d^2 (the exponent)
            "p_j_given_i": r(p_anchor_cond[j], 6),                   # conditional affinity from anchor
            "p_ij_joint": r(P[ai, j], 6),                            # symmetrised joint
            "d2_lowD": r(Dy2[ai, j], 4),
            "q_num": r(num_q[ai, j], 6),                             # (1+d_lowD^2)^-1 before normalising
            "q_ij": r(Q[ai, j], 6),                                  # Student-t joint affinity
        }

    # ── sanity asserts (PRINTED below) ──
    perp_err = abs(perp_a - TARGET_PERP)
    assert perp_err < 1e-2, f"anchor perplexity {perp_a} != target {TARGET_PERP} (err {perp_err})"
    assert KL >= 0.0, f"KL must be >= 0, got {KL}"
    p_sum = float(P.sum())
    assert abs(p_sum - 1.0) < 1e-6, f"joint P must sum to 1, got {p_sum}"
    q_sum = float(Q.sum())
    assert abs(q_sum - 1.0) < 1e-6, f"joint Q must sum to 1, got {q_sum}"
    # mean tuned perplexity across all rows ≈ target (every row tuned independently)
    perp_all = [float(2.0 ** entropy_bits(P_cond[i])) for i in range(n)]

    return {
        "method": "t-SNE pipeline computed on 9 real GloVe-50 word vectors (anchor='cat'); "
                  "conditional affinities tuned to perplexity 5 by binary search; 2-D layout via "
                  "sklearn TSNE (init=pca, random_state=0); Student-t q_ij, KL(P||Q), anchor gradient.",
        "words": WORDS,
        "groups": [GROUP[w] for w in WORDS],
        "dimHighD": dim,
        "anchor": ANCHOR,
        "anchorIndex": ai,
        "targetPerplexity": TARGET_PERP,
        # ── high-D side ──
        "highD": {
            "sqDist": rm(D2, 3),                                     # full n×n ||x_i-x_j||^2
            "anchorSqDist": rv(D2[ai], 3),                           # the anchor's row of squared dists
        },
        # ── conditional affinities + perplexity (the σ binary-search result for the anchor) ──
        "conditional": {
            "beta": r(beta_a, 6),                                    # 1/(2 sigma^2)
            "sigma": r(sigma_a, 4),                                  # tuned bandwidth for the anchor
            "pRow": rv(p_anchor_cond, 6),                            # p_{j|i} for the anchor (sums to 1)
            "entropyBits": r(H_a, 4),                                # H(P_i) in bits
            "perplexity": r(perp_a, 4),                              # 2^H ≈ target (verifies the link)
            "rowSum": r(float(p_anchor_cond.sum()), 6),              # == 1 (fact-check)
            "allSigmas": rv(sigmas, 4),                              # per-row tuned sigma
            "allPerplexities": [r(x, 3) for x in perp_all],          # per-row 2^H ≈ target
        },
        # ── symmetrised joint P ──
        "joint": {
            "P": rm(P, 6),                                           # full symmetrised joint
            "anchorRow": rv(P[ai], 6),                               # p_ij for the anchor
            "sum": r(p_sum, 6),                                      # == 1
        },
        # ── low-D layout + Student-t Q ──
        "lowD": {
            "layoutPerplexity": r(layout_perp, 2),
            "Y": [[r(p[0], 4), r(p[1], 4)] for p in Y],              # 2-D coords (centred)
            "qNum": rm(num_q, 6),                                    # (1+||y_i-y_j||^2)^-1
            "Z": r(Z, 6),                                            # Student-t normaliser
            "Q": rm(Q, 6),                                           # full Student-t joint
            "anchorRow": rv(Q[ai], 6),                               # q_ij for the anchor
            "sum": r(q_sum, 6),                                      # == 1
        },
        # ── objective + gradient ──
        "kl": r(KL, 6),                                              # KL(P||Q) >= 0
        "gradient": {
            "anchor": rv(grad_anchor, 6),                           # dC/dy_anchor (2-vector)
            "anchorMag": r(float(np.linalg.norm(grad_anchor)), 6),
            "all": [[r(g[0], 6), r(g[1], 6)] for g in G],           # dC/dy_i for every point
        },
        # ── transparent worked cells (one near animal, one far royalty word) ──
        "worked": {
            "near": worked(near_j),
            "far": worked(far_j),
        },
        "note": "Conditional p_{j|i} use a Gaussian whose sigma is tuned (binary search) to perplexity "
                "5 = effective # of neighbours; the joint P symmetrises them. The low-D layout uses a "
                "Student-t (heavy tail) for q_ij, which gives clusters room (fixes crowding). t-SNE "
                "minimises KL(P||Q); the gradient is the per-point attractive/repulsive force.",
    }


def main() -> int:
    out = build()
    (DATA / "l5-tsne-math.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    c = out["conditional"]
    print(f"[tsne-math] words={out['words']} (n={len(out['words'])}, dim={out['dimHighD']}); "
          f"anchor='{out['anchor']}'")
    print(f"[tsne-math] anchor sigma={c['sigma']} beta={c['beta']}; "
          f"H(P_i)={c['entropyBits']} bits → perplexity 2^H={c['perplexity']} "
          f"(target {out['targetPerplexity']})  [ASSERT perp≈target PASS]")
    print(f"[tsne-math] anchor p_(j|i) row sums to {c['rowSum']} (==1); joint P sum={out['joint']['sum']} "
          f"(==1); Q sum={out['lowD']['sum']} (==1)")
    print(f"[tsne-math] KL(P||Q)={out['kl']}  [ASSERT KL>=0 PASS]")
    print(f"[tsne-math] anchor gradient dC/dy={out['gradient']['anchor']} |g|={out['gradient']['anchorMag']}")
    w = out["worked"]
    print(f"[tsne-math] worked NEAR '{w['near']['word']}': d2HD={w['near']['d2_highD']} "
          f"p(j|i)={w['near']['p_j_given_i']} p_ij={w['near']['p_ij_joint']} q_ij={w['near']['q_ij']}")
    print(f"[tsne-math] worked FAR  '{w['far']['word']}': d2HD={w['far']['d2_highD']} "
          f"p(j|i)={w['far']['p_j_given_i']} p_ij={w['far']['p_ij_joint']} q_ij={w['far']['q_ij']}")
    print(f"[tsne-math] per-row perplexities (all ≈ target): {out['conditional']['allPerplexities']}")
    print("[tsne-math] wrote data/l5-tsne-math.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
