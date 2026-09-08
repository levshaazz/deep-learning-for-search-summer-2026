#!/usr/bin/env python3
"""gen_l6_viz.py — DATA for the 4 new L6 architectural/geometric scroll-step widgets.

The L6 lecture already COMPUTES attention/positional/contrastive (gen_l6.py). These four widgets
SHOW the architecture/geometry of the Transformer block. Real + reproducible (run with
/usr/bin/python3 — numpy; reuses the worked self-attention from data/l6-attention.json so the
geometry stays consistent with the numbers the deck/Book already display).

  data/l6-layernorm.json    widget E `layernorm-viz` — what LayerNorm DOES to one feature vector:
                            x (varied scale/offset) → subtract mean → divide by std → ·γ+β. Emits the
                            vector at each stage + mean/var/std (facts-check: normalised vector has
                            mean≈0, var≈1).
  data/l6-residual.json     widget F `residual-stream` — the residual HIGHWAY: a running vector x that
                            each sublayer ADDS to (x → x+attn → Norm → x+ffn → Norm), never replaces.
                            Emits the vector + the delta at each add, and the running norm.
  data/l6-attention-geo.json widget G `attention-geometry` — attention as geometric blending: the L6
                            tokens placed as 2-D points (V projected to 2-D), and the query token
                            moving to the attention-weighted average of the value points. REUSES the
                            weights + V from data/l6-attention.json (the average == weights·Vproj,
                            facts-check against l6-attention output).
  data/l6-block-geo.json    widget H `block-geometry` — the GEOMETRIC effect of each sublayer of a
                            Transformer block on a small set of 2-D token points: attention blends
                            neighbours → Add&Norm rescales → FFN transforms → Add&Norm. Emits the
                            point cloud after each sublayer. Reuses E/F/G ideas; toy 2-D.

Deterministic: fixed toy vectors, closed-form normalisation, attention numbers lifted from
l6-attention.json. Facts-gate-checkable. Feeds the Book + decks + the 4 widgets.

Run:  /usr/bin/python3 _research/gen_l6_viz.py
"""
from __future__ import annotations
import json, pathlib, sys
import numpy as np

from genlib import ROOT, DATA, r, rm, rv      # shared helpers (genlib.py)
ATTN_FILE = DATA / "l6-attention.json"


# ── E: layernorm-viz ─────────────────────────────────────────────────────────────────────────────
def build_layernorm(attn: dict) -> dict:
    """LayerNorm on the REAL 4-d attention-output vector for the `cat` token.

    x is the SAME cat context vector the rest of L6 has used — l6-attention.json output[1] =
    [0.579, 1.996, 0.91, 0.425] — so the Book widget and the deck s38 twin normalise the identical
    real vector (no abstract toy). x → subtract mean μ → divide by std (√(var+ε)) → scale·γ + β.
    Standard ML LayerNorm: population variance (ddof=0) + ε. γ/β are toy learned params (γ slight
    per-dim gain, β small shift), matching the deck twin's γ=[1.2,0.9,1.1,1.0], β=[0.1,−0.1,0,0.2].
    Facts-check: the normalised (pre-affine) vector has mean≈0 and var≈1 (and ‖normed‖ = √d = 2)."""
    x = np.asarray(attn["output"], dtype=float)[1]           # cat's attention-output row (real, 4-d)
    eps = 1e-5
    mu = float(x.mean())
    var = float(x.var(ddof=0))
    std = float(np.sqrt(var + eps))
    centred = x - mu
    normed = centred / std                                   # mean≈0, var≈1
    gamma = np.array([1.2, 0.9, 1.1, 1.0])
    beta = np.array([0.1, -0.1, 0.0, 0.2])
    out = normed * gamma + beta
    return {
        "method": "LayerNorm over the real 4-d cat attention-output vector (population var, ε=1e-5, learned γ,β toy)",
        "dim": int(x.size),
        "eps": eps,
        "x": rv(x, 3),                                       # raw (off-centre, spread)
        "mean": r(mu, 4),                                    # μ
        "var": r(var, 4),                                    # σ²
        "std": r(std, 4),                                    # √(σ²+ε)
        "centred": rv(centred, 3),                           # x − μ
        "normed": rv(normed, 4),                             # (x−μ)/std → mean≈0, var≈1
        "normedMean": r(float(normed.mean()), 6),            # ≈ 0 (facts-check)
        "normedVar": r(float(normed.var(ddof=0)), 4),        # ≈ 1 (facts-check)
        "gamma": rv(gamma, 3),
        "beta": rv(beta, 3),
        "out": rv(out, 4),                                   # γ·normed + β
        "note": "the real cat attention-output row; subtract mean, divide by std → centred unit-scale "
                "vector (on a sphere, ‖normed‖=√d=2); then γ scales and β shifts. Pre-affine vector "
                "has mean≈0, var≈1.",
    }


# ── F: residual-stream ───────────────────────────────────────────────────────────────────────────
def build_residual() -> dict:
    """The residual HIGHWAY: x is ADDED to, never replaced. Four stages on a toy 6-d vector.

    x0 → +attn(x) → LayerNorm → +ffn(x) → LayerNorm  (post-LN, the original Transformer order).
    Deltas are toy (illustrative sublayer outputs). Emits each stage's vector, the delta added, and
    the running L2 norm so the widget can show the vector accumulating along a highway."""
    def ln(v):  # plain LayerNorm (no affine) for the highway demo
        v = np.asarray(v, dtype=float)
        mu, sd = v.mean(), np.sqrt(v.var(ddof=0) + 1e-5)
        return (v - mu) / sd

    x0 = np.array([1.0, 0.5, -0.5, 2.0, 0.0, 1.5])
    attn_delta = np.array([0.4, -0.2, 0.6, -0.3, 0.5, -0.1])  # attn(x)
    after_attn_add = x0 + attn_delta                          # residual add #1
    after_attn_norm = ln(after_attn_add)
    ffn_delta = np.array([-0.1, 0.3, 0.2, 0.4, -0.5, 0.2])    # ffn(x)
    after_ffn_add = after_attn_norm + ffn_delta               # residual add #2
    after_ffn_norm = ln(after_ffn_add)

    stages = [
        {"id": "x0", "label": "x (input)", "vec": rv(x0, 3), "delta": None,
         "norm": r(float(np.linalg.norm(x0)), 4)},
        {"id": "add-attn", "label": "x + attn(x)", "vec": rv(after_attn_add, 3),
         "delta": rv(attn_delta, 3), "norm": r(float(np.linalg.norm(after_attn_add)), 4)},
        {"id": "norm-1", "label": "LayerNorm", "vec": rv(after_attn_norm, 3), "delta": None,
         "norm": r(float(np.linalg.norm(after_attn_norm)), 4)},
        {"id": "add-ffn", "label": "+ ffn(x)", "vec": rv(after_ffn_add, 3),
         "delta": rv(ffn_delta, 3), "norm": r(float(np.linalg.norm(after_ffn_add)), 4)},
        {"id": "norm-2", "label": "LayerNorm", "vec": rv(after_ffn_norm, 3), "delta": None,
         "norm": r(float(np.linalg.norm(after_ffn_norm)), 4)},
    ]
    return {
        "method": "residual stream over a toy 6-d vector (post-LN Transformer order)",
        "dim": int(x0.size),
        "stages": stages,                                    # x → +attn → Norm → +ffn → Norm
        "note": "each sublayer ADDS a delta to the running x (x = x + sublayer(x)); LayerNorm rescales. "
                "The representation accumulates along a highway, it is never thrown away.",
    }


# ── G: attention-geometry ──────────────────────────────────────────────────────────────────────
def build_attention_geo(attn: dict) -> dict:
    """Attention as geometric blending, REUSING the worked self-attention numbers.

    The L6 example has 3 tokens, V is 4-d. We project V to 2-D (PCA-free: keep the two highest-
    variance coords via a fixed deterministic 4→2 projection so it is reproducible AND legible),
    place each token at its value-point, and show the QUERY token (row 1, "cat") moving to its
    attention-weighted average of the value points = weights[1] · Vproj. Facts-check: the blended
    point equals weights·Vproj (and, in full 4-d, equals l6-attention output[1])."""
    tokens = attn["tokens"]
    V = np.asarray(attn["V"], dtype=float)                   # 3×4 (from l6-attention.json)
    W = np.asarray(attn["weights"], dtype=float)             # 3×3 attention map (rows sum to 1)
    out4 = np.asarray(attn["output"], dtype=float)           # 3×4 weights·V (the l6 output)

    # deterministic 4→2 projection: pick the two coordinate axes of V with the largest spread, so the
    # 2-D layout is reproducible and a faithful shadow of the 4-d value points.
    spread = V.var(axis=0)
    ax = list(np.argsort(spread)[::-1][:2])
    ax.sort()                                                # stable axis order
    Vproj = V[:, ax]                                         # 3×2 value points

    # query token = row 1 ("cat"); its blended point = weights[1] · Vproj
    qi = 1
    blended = W[qi] @ Vproj
    blended4 = W[qi] @ V                                     # full 4-d (== l6 output[qi])

    return {
        "method": "attention as weighted-average blending; V from l6-attention.json, projected 4→2",
        "tokens": tokens,
        "projAxes": [int(a) for a in ax],                    # which 2 of the 4 V-dims we kept
        "valuePoints": rm(Vproj, 3),                         # 3×2: each token's value point
        "weights": rm(W, 3),                                 # reused attention map (rows sum to 1)
        "queryIndex": qi,                                    # "cat" is the moving query
        "queryToken": tokens[qi],
        "blendedPoint": rv(blended, 3),                      # weights[qi]·Vproj (where the query lands)
        "blended4d": rv(blended4, 3),                        # weights[qi]·V == l6 output row (facts-check)
        "l6OutputRow": rv(out4[qi], 3),                      # the l6-attention output[qi] it must equal
        "note": "the query token moves to the attention-weighted AVERAGE of the value points. "
                "2-D blended point = weights·Vproj; in full d it equals the l6-attention output row.",
    }


# ── H: block-geometry ────────────────────────────────────────────────────────────────────────────
def build_block_geo() -> dict:
    """The GEOMETRIC effect of each sublayer of a Transformer block on a small 2-D token cloud.

    5 toy tokens as 2-D points. Stage by stage:
      0 in        : the raw token points (spread out)
      1 attention : each point moves toward the cloud's weighted neighbour-average (blend → contract)
      2 add&norm  : residual add + LayerNorm → recentre to mean 0, rescale to unit RMS (on a ring)
      3 ffn       : a fixed nonlinear-ish per-point transform (a small shear+bias) → reshape
      4 add&norm  : recentre + rescale again
    All transforms are deterministic + reproducible. This is illustrative geometry (not the exact
    l6 numbers) but uses the SAME operations the block applies, so the picture is faithful."""
    rng = np.random.default_rng(5)
    n = 5
    P0 = np.array([[-2.0, 1.5], [1.0, 2.0], [2.5, -0.5], [-1.5, -1.8], [0.5, -1.0]])
    labels = ["the", "cat", "sat", "on", "mat"]

    def recentre_rms(P):
        P = P - P.mean(axis=0)                               # subtract mean (LayerNorm centring)
        rms = np.sqrt((P ** 2).sum(axis=1).mean()) + 1e-9
        return P / rms                                       # rescale to unit RMS radius

    # 1) attention: blend each point toward a softmax-weighted neighbour average (contraction).
    def attn_blend(P):
        S = P @ P.T                                          # similarity (dot-product)
        S = S - S.max(axis=1, keepdims=True)
        Wt = np.exp(S); Wt = Wt / Wt.sum(axis=1, keepdims=True)
        return Wt @ P                                        # weighted neighbour average
    P_attn = attn_blend(P0)
    P_an1 = recentre_rms(P0 + P_attn)                        # residual add + norm

    # 3) FFN: a fixed shear + bias (a deterministic per-point nonlinearity stand-in).
    Wf = np.array([[1.0, 0.6], [-0.4, 1.0]])
    bf = np.array([0.2, -0.1])
    P_ffn = np.tanh(P_an1 @ Wf.T + bf)
    P_an2 = recentre_rms(P_an1 + P_ffn)                      # residual add + norm

    stages = [
        {"id": "in", "label": "token points", "points": rm(P0, 3)},
        {"id": "attention", "label": "attention blends neighbours", "points": rm(P_attn, 3)},
        {"id": "addnorm-1", "label": "Add & Norm (rescale)", "points": rm(P_an1, 3)},
        {"id": "ffn", "label": "FFN transforms each point", "points": rm(P_ffn, 3)},
        {"id": "addnorm-2", "label": "Add & Norm (rescale)", "points": rm(P_an2, 3)},
    ]
    # facts-check: after each Add&Norm the cloud has mean≈0 and unit RMS radius.
    an1_mean = rv(P_an1.mean(axis=0), 6)
    an1_rms = r(float(np.sqrt((P_an1 ** 2).sum(axis=1).mean())), 4)
    an2_rms = r(float(np.sqrt((P_an2 ** 2).sum(axis=1).mean())), 4)
    return {
        "method": "geometric effect of each Transformer sublayer on a toy 5-token 2-D cloud (deterministic)",
        "n": n,
        "tokens": labels,
        "stages": stages,                                    # in → attention → A&N → ffn → A&N
        "addNorm1Mean": an1_mean,                            # ≈ [0,0]
        "addNorm1Rms": an1_rms,                              # ≈ 1.0 (facts-check)
        "addNorm2Rms": an2_rms,                              # ≈ 1.0 (facts-check)
        "note": "attention contracts the cloud (blend neighbours); Add&Norm recentres to mean 0 + "
                "unit RMS (a ring); FFN reshapes each point; Add&Norm rescales again.",
    }


def main() -> int:
    if not ATTN_FILE.exists():
        print(f"[l6viz] ERROR: {ATTN_FILE} missing — run `/usr/bin/python3 _research/gen_l6.py` first.",
              file=sys.stderr)
        return 2
    attn = json.loads(ATTN_FILE.read_text())

    ln = build_layernorm(attn)
    res = build_residual()
    geo = build_attention_geo(attn)
    blk = build_block_geo()
    (DATA / "l6-layernorm.json").write_text(json.dumps(ln, indent=2), encoding="utf-8")
    (DATA / "l6-residual.json").write_text(json.dumps(res, indent=2), encoding="utf-8")
    (DATA / "l6-attention-geo.json").write_text(json.dumps(geo, indent=2), encoding="utf-8")
    (DATA / "l6-block-geo.json").write_text(json.dumps(blk, indent=2), encoding="utf-8")

    print(f"[l6viz] layernorm: mean={ln['mean']} var={ln['var']} → normed mean={ln['normedMean']} "
          f"(≈0) var={ln['normedVar']} (≈1)")
    print(f"[l6viz] residual: {len(res['stages'])} stages, norms="
          f"{[s['norm'] for s in res['stages']]}")
    print(f"[l6viz] attention-geo: query='{geo['queryToken']}' lands at {geo['blendedPoint']} (2-D); "
          f"blended4d={geo['blended4d']} must == l6 output row {geo['l6OutputRow']}")
    print(f"[l6viz] block-geo: {len(blk['stages'])} stages; Add&Norm RMS={blk['addNorm1Rms']}, "
          f"{blk['addNorm2Rms']} (≈1); A&N1 mean={blk['addNorm1Mean']}")
    print("[l6viz] wrote data/l6-layernorm.json + l6-residual.json + l6-attention-geo.json + l6-block-geo.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
