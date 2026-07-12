#!/usr/bin/env python3
"""gen_l15_chain.py — the END-TO-END worked chain: one sentence, from token id to document rank.

WHY THIS EXISTS. An adversarial audit of the ncd-* widget family asked a simple question and got an
ugly answer: is there anywhere in the course a LONG computation carried through, end to end, with the
numbers surviving every arrow? No. Every widget restarted from its own toy inputs, softmax was computed
five times without once showing exp(x)/Σexp, and ncd-attention derived a context vector from a V it
never drew. The family taught the SHAPE of the computation and hid the computation.

This file produces the missing artefact: `data/l15-chain.json`, a single worked example that runs

    "the cat sat"
      → token ids            (a lookup, nothing more)
      → E[ids]               (the embedding table: a row per word)
      → + PE                 (sinusoidal, positions 0,1,2)
      → X · Wq / Wk / Wv     (the three learned projections)
      → Q·Kᵀ                 (the contraction — the axis d dies here)
      → ÷ √d_k               (the scale, the thing whose absence kills the gradient)
      → softmax rows         (exp, Σ, divide — every step of it)
      → · V                  (the second contraction — the key axis dies)
      → mean-pool            (the axis n dies: a sentence becomes a POINT)
      → q · dᵢ               (scored against two documents encoded by the SAME encoder)
      → a rank

and every number at every stage is computed here, not typed. The two documents are deliberately run
through the identical encoder: that is not decoration, it is the whole claim of ncd-atlas — "the index
is not a second machine, it is the same encoder applied offline" — made checkable.

Everything is hand-set and deterministic (the same discipline as gen_l6.py's worked attention): no RNG,
no training, no floats beyond what the arithmetic itself produces. Reproducible under the frozen
toolchain (/usr/bin/python3 3.9 + vendored numpy); `bash _research/reproduce.sh` must leave data/ byte-identical.
"""
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"


def r(x, k=3):
    return round(float(x), k)


def rm(M, k=3):
    return [[r(v, k) for v in row] for row in np.atleast_2d(M)]


def rv(v, k=3):
    return [r(x, k) for x in np.asarray(v).ravel()]


def softmax_rows(S):
    S = S - S.max(axis=1, keepdims=True)
    E = np.exp(S)
    return E / E.sum(axis=1, keepdims=True)


# ── the model. Tiny, fixed, legible. d = 4 so it matches the d_k the rest of L15 uses. ──────────────
VOCAB = ["the", "cat", "sat", "dog", "ran"]
D = 4
DK = 4

# The embedding table. Rows are NOT sorted by meaning — the row index is a token id and carries no
# semantics whatsoever, which is exactly the misconception ncd-embedding exists to kill.
E = np.array([
    [1.0, 0.0, 0.0, 0.0],   # the
    [0.0, 1.0, 0.0, 1.0],   # cat
    [0.0, 0.0, 1.0, 0.0],   # sat
    [0.0, 1.0, 1.0, 0.0],   # dog
    [1.0, 0.0, 0.0, 1.0],   # ran
])

# The three learned projections. Fixed, not trained — this is a worked example, not a model.
WQ = np.array([[1, 0, 1, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 1, 0, 1]], dtype=float)
WK = np.array([[1, 0, 0, 0], [0, 1, 0, 1], [1, 0, 1, 0], [0, 0, 0, 1]], dtype=float)
WV = np.array([[0, 1, 0, 0], [1, 0, 0, 1], [0, 0, 1, 0], [0, 0, 1, 1]], dtype=float)

# Sinusoidal positional encoding, the same two frequencies L15 already uses (1 and 0.01):
# PE(pos, 2i) = sin(pos · f_i), PE(pos, 2i+1) = cos(pos · f_i)
FREQS = [1.0, 0.01]


def pe(n):
    P = np.zeros((n, D))
    for pos in range(n):
        for i, f in enumerate(FREQS):
            P[pos, 2 * i] = math.sin(pos * f)
            P[pos, 2 * i + 1] = math.cos(pos * f)
    return P


def encode(words):
    """The encoder — ONE function, used for the query AND for every document. That identity is the point."""
    ids = [VOCAB.index(w) for w in words]
    emb = E[ids]                          # the lookup: a row per token
    P = pe(len(words))
    X = emb + P                           # tokens carry their position
    Q, K, V = X @ WQ, X @ WK, X @ WV      # the three projections
    scores = Q @ K.T                      # the contraction: d dies
    scaled = scores / math.sqrt(DK)       # ÷ √d_k
    weights = softmax_rows(scaled)        # exp / Σexp, per row
    ctx = weights @ V                     # the second contraction: the key axis dies
    pooled = ctx.mean(axis=0)             # the axis n dies: a sentence becomes a point in R^d
    return dict(words=words, ids=ids, emb=emb, pe=P, X=X, Q=Q, K=K, V=V,
                scores=scores, scaled=scaled, weights=weights, ctx=ctx, pooled=pooled)


def build_chain() -> dict:
    q = encode(["the", "cat", "sat"])
    docs = [["cat", "sat"], ["dog", "ran"]]
    enc = [encode(d) for d in docs]
    dscore = [float(np.dot(q["pooled"], e["pooled"])) for e in enc]
    # Also the COSINE. The raw dot product ranks correctly here but only just — sinusoidal PE injects a
    # large near-constant offset into every token (cos(pos·0.01) ≈ 1), so magnitude starts to drown out
    # direction. That is not a defect of this example; it is exactly why real retrieval normalises, and
    # the chain's last step gets to SHOW it rather than assert it.
    def cos(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    dcos = [cos(q["pooled"], e["pooled"]) for e in enc]
    order = list(np.argsort(dscore)[::-1])   # rank: best first

    # softmax, opened up: the exponentials and the row sums, so no step of it is a black box
    expm = np.exp(q["scaled"] - q["scaled"].max(axis=1, keepdims=True))
    rowsum = expm.sum(axis=1)

    return {
        "_doc": (
            "END-TO-END worked chain for the ncd-chain widget: 'the cat sat' from token id to document "
            "rank. Every stage is computed by _research/gen_l15_chain.py, never typed: lookup -> +PE -> "
            "Wq/Wk/Wv -> QK^T -> /sqrt(d_k) -> softmax (exp + rowSum shown) -> ·V -> mean-pool -> q·d -> rank. "
            "The two documents are encoded by the SAME encoder as the query, which is precisely the claim "
            "ncd-atlas makes about an index. Hand-set, deterministic, no training, no RNG."
        ),
        "_source": "_research/gen_l15_chain.py",
        "vocab": VOCAB,
        "d": D,
        "dk": DK,
        "sqrtDk": r(math.sqrt(DK)),
        "freqs": FREQS,
        "E": rm(E),
        "Wq": rm(WQ), "Wk": rm(WK), "Wv": rm(WV),
        "query": {
            "words": q["words"],
            "ids": q["ids"],
            "emb": rm(q["emb"]),
            "pe": rm(q["pe"]),
            "x": rm(q["X"]),
            "Q": rm(q["Q"]), "K": rm(q["K"]), "V": rm(q["V"]),
            "scores": rm(q["scores"]),
            "scaled": rm(q["scaled"]),
            "exp": rm(expm),
            "rowSum": rv(rowsum),
            "weights": rm(q["weights"]),
            "ctx": rm(q["ctx"]),
            "pooled": rv(q["pooled"]),
        },
        "docs": [
            {"words": e["words"], "pooled": rv(e["pooled"]), "score": r(s), "cos": r(c)}
            for e, s, c in zip(enc, dscore, dcos)
        ],
        "rank": [int(i) for i in order],
        "note": "one encoder, run once on the query and once per document; the winner is docs[rank[0]]",
    }


def main():
    chain = build_chain()
    (DATA / "l15-chain.json").write_text(json.dumps(chain, indent=2), encoding="utf-8")
    q = chain["query"]
    print("[l15-chain] wrote data/l15-chain.json")
    print(f"  query   {' '.join(q['words'])}  ids={q['ids']}")
    print(f"  pooled  {q['pooled']}")
    for i, d in enumerate(chain["docs"]):
        print(f"  doc{i+1}    {' '.join(d['words']):10} pooled={d['pooled']}  dot={d['score']}  cos={d['cos']}")
    print(f"  rank    {chain['rank']}  → winner: {' '.join(chain['docs'][chain['rank'][0]]['words'])}")


if __name__ == "__main__":
    main()
