#!/usr/bin/env python3
"""gen_l6_chain.py — the END-TO-END worked chain for L06: "the cat sat", from token id to document rank.

WHY THIS EXISTS. An adversarial audit of the ncd-* widget family asked one question and got an ugly
answer: is there anywhere in this course a LONG computation carried through, end to end, with the
numbers surviving every arrow? No. Every figure restarted from its own toy inputs; softmax was computed
five times and never once opened; a context vector was derived from a V that was never drawn. The course
taught the SHAPE of the computation and hid the computation.

This produces the missing artefact: `data/l6-chain.json`, one worked example that runs

    "the cat sat"
      → token ids          a lookup, and nothing more
      → E[ids]             the embedding table: one row per word
      → + PE               sinusoidal, positions 0,1,2
      → · Wq / Wk / Wv     the three learned projections
      → Q·Kᵀ               the contraction — the axis d dies here
      → ÷ √d_k             the scale whose absence kills the gradient
      → softmax rows       exp, Σ, divide — every step of it shown
      → · V                the second contraction — the key axis dies
      → mean-pool          the axis n dies: a sentence becomes a POINT
      → q · dᵢ             scored against two documents encoded by the SAME encoder
      → a rank

THE CONSTRAINT THAT SHAPES THIS FILE. L06 already has a canonical worked attention example —
`data/l6-attention.json` — and the chapter's prose, the deck and the facts-gate all quote its numbers.
A chain that arrived with its own Q/K/V would put the figure in contradiction with the text beside it,
which is precisely the disease the audit found ("the picture contradicts the caption, and the caption
wins"). So the chain does NOT invent an attention example. It REPRODUCES L06's, exactly, and merely
extends it at both ends.

That forces the projections to be SOLVED FOR rather than chosen. Fix E and PE, form X = E[ids] + PE,
and Wq stops being a design decision and becomes the answer to a linear system:

    Wq = I + X⁺·(Q_L06 − X)      exact (X has full row rank — asserted), and NEAREST TO THE IDENTITY

The identity constraint matters. The plain pseudo-inverse also fits exactly but picks the smallest W,
whose enormous null space destroys the embedding geometry — documents then encode to near-noise and the
DISTRACTOR won the ranking. Staying close to I keeps the encoder sane on the inputs it was never fitted
to, which is every document in the corpus.

The weights still come out ugly, and that is the honest outcome — a better lesson than a tidy fiction:
learned matrices ARE ugly; what the diagram shows is that the OPERATION is clean regardless.

AND THE MARGIN IS THIN ON PURPOSE. The right document wins (cos 0.407 vs 0.271) but not by much — because
NOBODY TRAINED THIS ENCODER. That is not a flaw in the example, it is the bridge: making those numbers
mean something is exactly what contrastive learning does, and contrastive learning is the second half of
this very lecture.

Everything is deterministic — no RNG, no training. Reproducible under the frozen toolchain
(/usr/bin/python3 3.9 + vendored numpy); `bash _research/reproduce.sh` must leave data/ byte-identical.
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


# ── the canonical L06 example. NOT ours to change: the chapter quotes these numbers. ────────────────
L6 = json.loads((DATA / "l6-attention.json").read_text(encoding="utf-8"))
TOKENS = L6["tokens"]                      # ["the", "cat", "sat"]
DK = L6["d_k"]                             # 4
Q6, K6, V6 = (np.array(L6[k], dtype=float) for k in ("Q", "K", "V"))

# ── the front end we are adding. A 5-word vocabulary; the three query tokens are L06's. ─────────────
VOCAB = ["the", "cat", "sat", "dog", "ran"]
D = 4
# Rows are NOT sorted by meaning — a row index is a token id and carries none. That is exactly the
# misconception ncd-embedding exists to kill, so the table must not quietly demonstrate it.
E = np.array([
    [1.0, 0.0, 0.0, 0.0],   # the   ─┐ these three rows ALONE determine X, hence the projections, hence
    [0.0, 1.0, 0.0, 1.0],   # cat    │ the entire attention core the chapter quotes. They are not free.
    [0.0, 0.0, 1.0, 0.0],   # sat   ─┘
    [0.0, 0.0, 0.0, 1.0],   # dog   ─┐ these two touch nothing but the distractor document, so they ARE
    [0.0, 0.0, 1.0, 1.0],   # ran   ─┘ free — chosen (by exhaustive search over distinct binary rows) so
])                          #          that the RELEVANT document wins on dot AND cosine. A worked example
                            #          whose punchline is a wrong ranking teaches the wrong thing.
FREQS = [1.0, 0.01]         # the two frequencies L15 already uses: PE(pos,2i)=sin(pos·f), 2i+1=cos(pos·f)


def pe(n):
    P = np.zeros((n, D))
    for pos in range(n):
        for i, f in enumerate(FREQS):
            P[pos, 2 * i] = math.sin(pos * f)
            P[pos, 2 * i + 1] = math.cos(pos * f)
    return P


def embed(words):
    ids = [VOCAB.index(w) for w in words]
    emb = E[ids]
    P = pe(len(words))
    return ids, emb, P, emb + P


# ── SOLVE for the projections so the chain reproduces L06 exactly ──────────────────────────────────
_, _, _, X_Q = embed(TOKENS)
assert np.linalg.matrix_rank(X_Q) == len(TOKENS), "X must have full row rank for an exact solution"
Xp = np.linalg.pinv(X_Q)
# NEAREST TO THE IDENTITY, not minimum-norm. Both solve X·W = target exactly, but the plain pseudo-inverse
# picks the smallest W, whose vast null space destroys the embedding geometry: documents then encode to
# near-noise and the distractor won. Constraining W to stay as close to I as the exact fit allows,
#     W = I + X⁺·(target − X)      (X·W = X + (target − X) = target, still exact)
# keeps the encoder sane on inputs it was not fitted to — which is every document in the corpus.
WQ, WK, WV = (np.eye(D) + Xp @ (T - X_Q) for T in (Q6, K6, V6))
for name, W, target in (("Wq", WQ, Q6), ("Wk", WK, K6), ("Wv", WV, V6)):
    err = float(np.abs(X_Q @ W - target).max())
    assert err < 1e-9, f"{name} does not reproduce L06 ({err:.2e}) — the chain would contradict the chapter"


def encode(words):
    """The encoder — ONE function, used for the query AND for every document. That identity is the point:
    it is the whole claim ncd-atlas makes about an index, and here it is a line of code."""
    ids, emb, P, X = embed(words)
    Q, K, V = X @ WQ, X @ WK, X @ WV
    scores = Q @ K.T                       # the contraction: d dies
    scaled = scores / math.sqrt(DK)
    weights = softmax_rows(scaled)         # exp / Σexp, per row
    ctx = weights @ V                      # the second contraction: the key axis dies
    pooled = ctx.mean(axis=0)              # the axis n dies: a sentence becomes a point in R^d
    return dict(words=words, ids=ids, emb=emb, pe=P, X=X, Q=Q, K=K, V=V,
                scores=scores, scaled=scaled, weights=weights, ctx=ctx, pooled=pooled)


def build() -> dict:
    q = encode(TOKENS)

    # The chain must AGREE with the chapter it lives in, to the digit the chapter prints.
    for field in ("scores", "scaled", "weights", "output"):
        got = q["ctx"] if field == "output" else q[field]
        want = np.array(L6[field], dtype=float)
        assert np.abs(np.round(got, 3) - want).max() < 1.5e-3, \
            f"chain.{field} drifted from data/l6-attention.json — the figure would contradict the prose"

    docs = [["cat", "sat"], ["dog", "ran"]]
    enc = [encode(d) for d in docs]
    dot = [float(np.dot(q["pooled"], e["pooled"])) for e in enc]

    def cos(a, b):
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
    cosine = [cos(q["pooled"], e["pooled"]) for e in enc]
    order = [int(i) for i in np.argsort(dot)[::-1]]

    # softmax, opened up — so no step of it is a black box
    expm = np.exp(q["scaled"] - q["scaled"].max(axis=1, keepdims=True))
    rowsum = expm.sum(axis=1)

    return {
        "_doc": (
            "END-TO-END worked chain for the ncd-chain widget (L06 climb): 'the cat sat' from token id to "
            "document rank. Every stage is computed by _research/gen_l6_chain.py, never typed. The attention "
            "core REPRODUCES data/l6-attention.json exactly (asserted at generation time): the projections "
            "Wq/Wk/Wv are SOLVED as X⁺·Q from the chapter's canonical Q/K/V, not invented — a chain that "
            "arrived with its own numbers would contradict the prose beside it. The two documents are encoded "
            "by the SAME encoder as the query, which is precisely ncd-atlas's claim about an index."
        ),
        "_source": "_research/gen_l6_chain.py (Q/K/V ← data/l6-attention.json)",
        "vocab": VOCAB,
        "d": D,
        "dk": DK,
        "sqrtDk": r(math.sqrt(DK)),
        "freqs": FREQS,
        "E": rm(E),
        "Wq": rm(WQ), "Wk": rm(WK), "Wv": rm(WV),
        "query": {
            "words": q["words"], "ids": q["ids"],
            "emb": rm(q["emb"]), "pe": rm(q["pe"]), "x": rm(q["X"]),
            "Q": rm(q["Q"]), "K": rm(q["K"]), "V": rm(q["V"]),
            "scores": rm(q["scores"]), "scaled": rm(q["scaled"]),
            "exp": rm(expm), "rowSum": rv(rowsum),
            "weights": rm(q["weights"]), "ctx": rm(q["ctx"]), "pooled": rv(q["pooled"]),
        },
        "docs": [
            {"words": e["words"], "pooled": rv(e["pooled"]), "score": r(s), "cos": r(c)}
            for e, s, c in zip(enc, dot, cosine)
        ],
        "rank": order,
        "note": "one encoder, run once on the query and once per document; the winner is docs[rank[0]]",
    }


def main():
    chain = build()
    (DATA / "l6-chain.json").write_text(json.dumps(chain, indent=2), encoding="utf-8")
    q = chain["query"]
    print("[l6-chain] wrote data/l6-chain.json")
    print(f"  query    {' '.join(q['words'])}  ids={q['ids']}")
    print(f"  Q        {q['Q'][0]}  ← reproduces data/l6-attention.json exactly (asserted)")
    print(f"  weights  {q['weights'][0]}")
    print(f"  pooled   {q['pooled']}")
    for i, d in enumerate(chain["docs"]):
        print(f"  doc{i+1}     {' '.join(d['words']):9} dot={d['score']:7.3f}  cos={d['cos']:.3f}")
    print(f"  rank     {chain['rank']} → winner: {' '.join(chain['docs'][chain['rank'][0]]['words'])}")


if __name__ == "__main__":
    main()
