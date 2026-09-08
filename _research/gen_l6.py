#!/usr/bin/env python3
"""gen_l6.py — data for L6 'The Council of Attention' (attention + transformer + contrastive).

Real, reproducible worked examples (run with /usr/bin/python3 — numpy; reuses the GloVe-50
cache from gen_l5.py for the contrastive example):
  data/l6-attention.json    a worked scaled-dot-product self-attention: tokens, Q/K/V, QKᵀ scores,
                            /√d_k, row-softmax weights, the weighted-sum output (+ a 2-head note)
  data/l6-positional.json   sinusoidal positional encoding grid PE(pos,2i)=sin(pos/10000^{2i/d}) …
  data/l6-contrastive.json  InfoNCE + triplet on REAL GloVe vectors (anchor cat; positives kitten/dog;
                            negatives airplane/computer/france) — cosines + the loss, before/after

Deterministic: fixed Q/K/V, closed-form PE, GloVe from cache. Feeds the deck, the Book, the
attention-e2e / positional-enc / contrastive-space widgets; facts-gate-checkable.

Run:  /usr/bin/python3 _research/gen_l6.py
"""
from __future__ import annotations
import json, math, pathlib
import numpy as np

from genlib import ROOT, DATA, r      # shared helpers (genlib.py)
VEC_CACHE = ROOT / "_research" / "data" / ".cache" / "glove50-demo-vectors.json"


def rm(M, n=3):
    return [[r(v, n) for v in row] for row in np.asarray(M)]


def softmax_rows(S):
    S = S - S.max(axis=1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=1, keepdims=True)


def build_attention() -> dict:
    # A tiny, legible self-attention: 3 tokens, d_k = 4. Fixed Q/K/V chosen so the pattern is clear
    # (token 0 "the" attends to 2 "cat"; token 1 attends to itself; etc.) — deterministic, hand-set.
    tokens = ["the", "cat", "sat"]
    dk = 4
    Q = np.array([[1, 0, 1, 0], [0, 2, 0, 1], [1, 1, 0, 0]], dtype=float)
    K = np.array([[1, 0, 1, 0], [0, 1, 0, 2], [2, 1, 0, 0]], dtype=float)
    V = np.array([[1, 0, 0, 2], [0, 3, 1, 0], [2, 0, 1, 1]], dtype=float)
    scores = Q @ K.T
    scaled = scores / math.sqrt(dk)
    weights = softmax_rows(scaled)
    out = weights @ V
    return {
        "tokens": tokens,
        "d_k": dk,
        "Q": rm(Q), "K": rm(K), "V": rm(V),
        "scores": rm(scores),                 # QKᵀ
        "sqrtdk": r(math.sqrt(dk)),            # 2.0
        "scaled": rm(scaled),                 # QKᵀ/√d_k
        "weights": rm(weights, 3),            # softmax rows (attention map) — each row sums to 1
        "output": rm(out, 3),                 # weights · V
        "heads": 2,                           # multi-head note: h parallel subspaces, concat + W^O
        "note": "softmax(QKᵀ/√d_k)·V; rows of `weights` sum to 1",
    }


def build_positional() -> dict:
    d, n = 8, 8
    PE = np.zeros((n, d))
    for pos in range(n):
        for i in range(d):
            angle = pos / (10000 ** ((2 * (i // 2)) / d))
            PE[pos, i] = math.sin(angle) if i % 2 == 0 else math.cos(angle)
    return {
        "formula": "PE(pos,2i)=sin(pos/10000^{2i/d}); PE(pos,2i+1)=cos(pos/10000^{2i/d})",
        "d": d, "nPos": n,
        "grid": rm(PE),                       # nPos × d sinusoid values
        "note": "low dims = fast sinusoids (local), high dims = slow (global); fixed, not learned",
    }


def build_contrastive() -> dict:
    V = {w: np.asarray(v, dtype=float) for w, v in json.loads(VEC_CACHE.read_text()).items()}

    def cos(a, b):
        return float(np.dot(V[a], V[b]) / (np.linalg.norm(V[a]) * np.linalg.norm(V[b])))

    anchor = "cat"
    positives = ["kitten", "dog"]
    negatives = ["airplane", "computer", "france"]
    tau = 0.1
    sims = {"positives": {p: r(cos(anchor, p)) for p in positives},
            "negatives": {ng: r(cos(anchor, ng)) for ng in negatives}}

    # InfoNCE with the strongest positive (kitten) vs the negatives + that positive
    pos = "kitten"
    s_pos = cos(anchor, pos)
    cands = [s_pos] + [cos(anchor, ng) for ng in negatives]
    logits = np.array(cands) / tau
    logits -= logits.max()
    p_pos = math.exp(logits[0]) / np.exp(logits).sum()
    infonce = -math.log(p_pos)

    # triplet: max(0, sim(a,neg) − sim(a,pos) + margin) for the hardest negative
    margin = 0.2
    hardest = max(negatives, key=lambda ng: cos(anchor, ng))
    triplet = max(0.0, cos(anchor, hardest) - s_pos + margin)

    return {
        "anchor": anchor, "tau": tau, "margin": margin,
        "sims": sims,                                  # cat·kitten 0.639, cat·dog 0.922 ; cat·airplane 0.365 …
        "infoNCE": {"positive": pos, "negatives": negatives,
                    "pPositive": r(p_pos), "loss": r(infonce)},
        "triplet": {"positive": pos, "hardestNeg": hardest, "loss": r(triplet)},
        "note": "pull the positive in, push negatives out; cosine inside the loss (Sir Cosine). "
                "in-batch negatives = the other examples in the batch, for free",
    }


def main() -> int:
    att = build_attention()
    pos = build_positional()
    con = build_contrastive()
    (DATA / "l6-attention.json").write_text(json.dumps(att, indent=2), encoding="utf-8")
    (DATA / "l6-positional.json").write_text(json.dumps(pos, indent=2), encoding="utf-8")
    (DATA / "l6-contrastive.json").write_text(json.dumps(con, indent=2), encoding="utf-8")
    print(f"[l6] attention: tokens={att['tokens']} d_k={att['d_k']} √d_k={att['sqrtdk']}; "
          f"weights row0={att['weights'][0]}")
    print(f"[l6] positional: {pos['nPos']}×{pos['d']} sinusoid grid")
    print(f"[l6] contrastive: cat·kitten={con['sims']['positives']['kitten']}, "
          f"cat·dog={con['sims']['positives']['dog']}, cat·airplane={con['sims']['negatives']['airplane']}; "
          f"InfoNCE loss={con['infoNCE']['loss']}, triplet={con['triplet']['loss']}")
    print("[l6] wrote data/l6-attention.json + l6-positional.json + l6-contrastive.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
