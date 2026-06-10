#!/usr/bin/env python3
"""gen_l5_word2vec.py — DATA for the L5 word2vec TRAINING-TRAJECTORY widget.

The instructor's note: the optimization/training slides should start from RANDOM initialization and
run to convergence, so the slide can animate "random cloud → meaning emerges." This script trains a
small, fully-reproducible skip-gram-with-negative-sampling (SGNS) model IN NUMPY (no gensim, no
downloads) on the same TINY royalty+animals corpus the GloVe widget uses — so every number is
facts-gate-checkable and the run is idempotent (run twice → identical bytes).

Embedding dim = 2 so the centre vectors are DIRECTLY plottable (no PCA needed): the widget shows the
actual learned 2-D positions drifting from a random scatter into meaning-clusters.

  data/l5-word2vec-train.json
    • the mini-corpus + vocab + the skip-gram (centre, context) training pairs (window=2);
    • the RANDOM initial 2-D positions of every word (seeded);
    • per-checkpoint 2-D positions of every word as SGNS trains (so the slide animates the migration);
    • the loss per epoch (the SGNS negative-log-likelihood, dropping as the cloud organises);
    • init-spread vs final-spread + per-pair cosine before/after (related words drift together);
    • ONE fully worked training step: centre word, its context word, k negative samples, the
      sigmoid scores, the per-vector gradients, the gradient SIGN, and the resulting update — so the
      slide can show the mechanics, not just the animation.

SGNS recap (Mikolov et al. 2013b): for a (centre c, context o) pair and k negative samples n_1..n_k
drawn from the unigram^0.75 noise distribution, maximise
    log σ(v_o·v_c) + Σ_i log σ(−v_{n_i}·v_c)
i.e. push the centre vector toward true context words and away from noise words. We use SEPARATE
input (centre) and output (context) tables v / v' as in the paper; the plotted "word position" is the
input (centre) vector v, which is the conventional word2vec embedding.

Determinism: fixed corpus, fixed window, np.random.default_rng(SEED) for the init AND for the
negative-sample / pair-shuffle draws (one RNG, threaded through), full-pass SGD for EPOCHS epochs.
The convergence asserts (loss drops; related pairs end up MORE similar than unrelated pairs) PRINT a
one-line summary.

Run:  /usr/bin/python3 _research/gen_l5_word2vec.py
"""
from __future__ import annotations
import json, math, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# ── hyper-parameters (fixed → reproducible) ───────────────────────────────────────────────────────
WINDOW = 2          # skip-gram context window (words on each side)
DIM = 2             # embedding dim — 2 so the centre vectors are directly plottable
NEG_K = 6           # negative samples per positive (centre, context) pair
EPOCHS = 150        # full passes over the pair list (plenty for this tiny corpus to organise)
LR = 0.12           # SGD learning rate
SEED = 7            # init + sampling RNG seed
NOISE_POW = 0.75    # unigram^0.75 noise distribution (the word2vec default)
# checkpoints to emit (epoch indices); 0 = the random init, EPOCHS = converged
CHECKPOINTS = [0, 2, 5, 10, 25, 50, 90, EPOCHS]

# ── mini-corpus: the course's royalty + man/woman + cat/dog theme. Enriched (12 short sentences) so
# the three themes have distinct co-occurrence neighbourhoods → at dim=2 the learned positions form
# visible spatial clusters (the slide animates "random scatter → meaning clusters"). ─────────────────
CORPUS = [
    "the king loves the queen",
    "the queen loves the king",
    "the king and the queen rule the kingdom",
    "a king is a royal man and a queen is a royal woman",
    "the prince and the princess live in the palace",
    "the man loves the woman",
    "the woman loves the man",
    "a man and a woman walk together",
    "the cat chases the dog",
    "the dog chases the cat",
    "a cat and a dog are pets",
    "the kitten plays with the puppy",
]

# pairs the slide highlights. Related words should end up SPATIALLY CLOSE (the 2-D animation shows
# distance, not cosine — at dim=2 everything is near-collinear, so distance is the meaningful signal);
# unrelated words should stay farther apart on average.
RELATED = [("king", "queen"), ("man", "woman"), ("cat", "dog")]
UNRELATED = [("king", "cat"), ("queen", "dog"), ("man", "cat"), ("king", "dog")]


def r(x, n=4):
    return round(float(x), n)


def rm(M, n=4):
    return [[r(v, n) for v in row] for row in np.asarray(M, dtype=float)]


def rv(v, n=4):
    return [r(x, n) for x in np.asarray(v, dtype=float).ravel()]


def tokenize(sentences):
    return [s.lower().split() for s in sentences]


def build_vocab(tokenized):
    """Vocabulary sorted by descending frequency (stable, deterministic) — same rule as the GloVe gen."""
    freq = {}
    for toks in tokenized:
        for w in toks:
            freq[w] = freq.get(w, 0) + 1
    vocab = sorted(freq, key=lambda w: (-freq[w], w))
    return vocab, freq


def skipgram_pairs(tokenized, idx, window):
    """All (centre, context) index pairs within +/- window. Deterministic order (sentence, position)."""
    pairs = []
    for toks in tokenized:
        ids = [idx[w] for w in toks]
        L = len(ids)
        for c in range(L):
            for off in range(1, window + 1):
                for j in (c - off, c + off):
                    if 0 <= j < L:
                        pairs.append((ids[c], ids[j]))
    return pairs


def sigmoid(x):
    # numerically stable logistic
    return np.where(x >= 0, 1.0 / (1.0 + np.exp(-x)), np.exp(x) / (1.0 + np.exp(x)))


def sgns_loss(V, U, pairs, noise_p, rng_seed, neg_k):
    """SGNS negative-log-likelihood over all positive pairs with EXPECTED negative term (deterministic).

    For each positive (c, o):  −[ log σ(v_o·v_c) + k · E_{n~noise}[ log σ(−v_n·v_c) ] ].
    We use the EXPECTATION over the noise distribution (not a fresh random draw) so the reported loss
    curve is a clean, reproducible scalar that does not jitter with the sampling RNG — it is the true
    objective the stochastic updates descend in expectation."""
    total = 0.0
    eps = 1e-9
    for c, o in pairs:
        pos = math.log(float(sigmoid(U[o] @ V[c])) + eps)
        # E_n[ log σ(−v_n·v_c) ] = Σ_n noise_p[n] · log σ(−v_n·v_c)
        neg_scores = sigmoid(-(U @ V[c]))                 # σ(−v_n·v_c) for every candidate n
        neg = float(np.sum(noise_p * np.log(neg_scores + eps)))
        total += -(pos + neg_k * neg)
    return total / len(pairs)


def train_sgns(pairs, n, dim, epochs, lr, neg_k, noise_p, seed, checkpoints):
    """Reproducible SGNS training. Returns the random-init V, per-checkpoint snapshots of V (the centre
    table — the plotted embedding), the per-epoch loss, the final V/U, and the RNG used (so the worked
    step is drawn from the SAME deterministic stream as epoch 1)."""
    rng = np.random.default_rng(seed)
    # RANDOM init: small symmetric init around 0 (the classic word2vec init is U(−0.5/d, 0.5/d)).
    V = (rng.random((n, dim)) - 0.5) / dim                 # centre (input) vectors  — the embedding
    U = (rng.random((n, dim)) - 0.5) / dim                 # context (output) vectors
    V0 = V.copy()

    cands = np.arange(n)
    loss_hist = []
    snapshots = {}

    def snap(epoch):
        snapshots[epoch] = V.copy()

    if 0 in checkpoints:
        snap(0)
    loss_hist.append({"epoch": 0, "loss": r(sgns_loss(V, U, pairs, noise_p, seed, neg_k), 5)})

    for epoch in range(1, epochs + 1):
        order = rng.permutation(len(pairs))
        for pi in order:
            c, o = pairs[pi]
            # draw k negative samples from the unigram^0.75 noise distribution
            negs = rng.choice(cands, size=neg_k, p=noise_p)
            # ── forward: positive + negatives ──
            vc = V[c]
            pos_score = float(sigmoid(U[o] @ vc))
            # positive gradient: (σ(v_o·v_c) − 1) flows to v_o and v_c
            g_pos = pos_score - 1.0
            dvc = g_pos * U[o]
            U[o] -= lr * g_pos * vc
            # ── negatives: label 0, gradient σ(v_n·v_c) ──
            for nidx in negs:
                neg_score = float(sigmoid(U[nidx] @ vc))
                g_neg = neg_score - 0.0
                dvc += g_neg * U[nidx]
                U[nidx] -= lr * g_neg * vc
            V[c] -= lr * dvc
        loss_hist.append({"epoch": epoch, "loss": r(sgns_loss(V, U, pairs, noise_p, seed, neg_k), 5)})
        if epoch in checkpoints:
            snap(epoch)

    return V0, snapshots, loss_hist, V, U


def cos(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    if na == 0 or nb == 0:
        return 0.0
    return float(a @ b / (na * nb))


def spread(P):
    """Mean distance of points to their centroid — a scalar 'how scattered is the cloud' measure."""
    c = P.mean(axis=0)
    return float(np.mean(np.linalg.norm(P - c, axis=1)))


def main() -> int:
    tokenized = tokenize(CORPUS)
    vocab, freq = build_vocab(tokenized)
    n = len(vocab)
    idx = {w: i for i, w in enumerate(vocab)}
    pairs = skipgram_pairs(tokenized, idx, WINDOW)

    # unigram^0.75 noise distribution (the word2vec negative-sampling default)
    counts = np.array([freq[w] for w in vocab], dtype=float)
    noise = counts ** NOISE_POW
    noise_p = noise / noise.sum()

    # ── train (random init → full pass) ───────────────────────────────────────────────────────────
    V0, snapshots, loss_hist, V, U = train_sgns(
        pairs, n, DIM, EPOCHS, LR, NEG_K, noise_p, SEED, CHECKPOINTS)
    loss0 = loss_hist[0]["loss"]
    lossN = loss_hist[-1]["loss"]

    # ── trajectory: per-checkpoint 2-D positions of every word ────────────────────────────────────
    traj = []
    for ep in CHECKPOINTS:
        P = snapshots[ep]
        traj.append({
            "epoch": ep,
            "label": "random init" if ep == 0 else ("converged" if ep == EPOCHS else f"epoch {ep}"),
            "loss": next(h["loss"] for h in loss_hist if h["epoch"] == ep),
            "spread": r(spread(P), 4),
            "points": [{"w": vocab[i], "x": r(P[i, 0], 4), "y": r(P[i, 1], 4)} for i in range(n)],
        })
    init_spread = traj[0]["spread"]
    final_spread = traj[-1]["spread"]

    # ── related vs unrelated: 2-D distance (the animation's signal) + cosine, init vs converged ────
    # At dim=2 every word is near-collinear (all co-occur with "the"/"a"), so cosine barely separates
    # clusters; the 2-D POSITION animation separates them by DISTANCE. We emit both, and assert on the
    # distance gap (related words end up spatially TIGHTER than unrelated ones).
    def dist(a, b):
        return float(np.linalg.norm(a - b))

    def pair_block(plist):
        out = []
        for a, b in plist:
            ia, ib = idx[a], idx[b]
            out.append({"a": a, "b": b,
                        "distInit": r(dist(V0[ia], V0[ib]), 4),
                        "distFinal": r(dist(V[ia], V[ib]), 4),
                        "cosInit": r(cos(V0[ia], V0[ib]), 4),
                        "cosFinal": r(cos(V[ia], V[ib]), 4)})
        return out
    related = pair_block(RELATED)
    unrelated = pair_block(UNRELATED)
    rel_mean_dist = float(np.mean([p["distFinal"] for p in related]))
    unrel_mean_dist = float(np.mean([p["distFinal"] for p in unrelated]))
    rel_mean_final = float(np.mean([p["cosFinal"] for p in related]))
    unrel_mean_final = float(np.mean([p["cosFinal"] for p in unrelated]))

    # ── ONE fully worked training step (the mechanics) ────────────────────────────────────────────
    # A transparent, representative SGNS update from the RANDOM-INIT vectors on a real (centre, context)
    # skip-gram pair the slide cares about — so it can walk through exactly what one update does: the k
    # negatives drawn, the sigmoid scores, the per-vector gradients, the gradient SIGN, and the resulting
    # vector update. We start from a fresh copy of the random init (reconstructed deterministically) and
    # use a dedicated seeded RNG for the negative draw so the worked numbers are fixed/reproducible.
    # (In this corpus content words never sit inside window=2 of each other — "the"/"a"/"loves" separate
    #  them — so the worked centre word is "king" with its true context "loves", the verb tying king→queen.)
    rng0 = np.random.default_rng(SEED)
    Vw = (rng0.random((n, DIM)) - 0.5) / DIM
    Uw = (rng0.random((n, DIM)) - 0.5) / DIM
    assert np.allclose(Vw, V0), "worked-step replay must reproduce the random init"
    cands = np.arange(n)
    real_pairs = {(vocab[a], vocab[b]) for a, b in pairs}
    WORKED_PAIR = ("king", "loves")
    assert WORKED_PAIR in real_pairs, \
        f"worked-step pair {WORKED_PAIR} must be a real skip-gram pair in the corpus"
    c, o = idx[WORKED_PAIR[0]], idx[WORKED_PAIR[1]]
    wrng = np.random.default_rng(SEED + 1)   # dedicated stream for the worked step's negative draw
    # for the WORKED step we exclude the centre + true context from the negative pool (a clean variant)
    # so the displayed negatives are unambiguously "noise" words — clearer for the slide. (The training
    # loop above uses the plain word2vec draw, where a collision is allowed and rare.)
    wmask = noise_p.copy(); wmask[c] = 0.0; wmask[o] = 0.0; wmask /= wmask.sum()
    negs = wrng.choice(cands, size=NEG_K, replace=False, p=wmask)
    vc_before = Vw[c].copy()
    pos_dot = float(Uw[o] @ vc_before)
    pos_sig = float(sigmoid(pos_dot))
    g_pos = pos_sig - 1.0                      # gradient on the positive logit: σ(·) − 1  (NEGATIVE → pull together)
    neg_entries = []
    dvc = g_pos * Uw[o]
    for nidx in negs:
        nd = float(Uw[nidx] @ vc_before)
        ns = float(sigmoid(nd))
        g_neg = ns - 0.0                       # gradient on a negative logit: σ(·) − 0  (POSITIVE → push apart)
        dvc = dvc + g_neg * Uw[nidx]
        neg_entries.append({
            "word": vocab[int(nidx)], "index": int(nidx),
            "dot": r(nd, 4), "sigmoid": r(ns, 4),
            "gradOnLogit": r(g_neg, 4), "gradSign": "+ (push apart)",
        })
    vc_after = vc_before - LR * dvc
    worked = {
        "from": "random init (epoch 0); representative SGNS update on the (king, loves) corpus pair",
        "centre": vocab[c], "centreIndex": c,
        "context": vocab[o], "contextIndex": o,
        "k": NEG_K,
        "negatives": neg_entries,
        "positive": {
            "word": vocab[o], "dot": r(pos_dot, 4), "sigmoid": r(pos_sig, 4),
            "target": 1, "gradOnLogit": r(g_pos, 4), "gradSign": "− (pull together)",
        },
        "centreVecBefore": rv(vc_before, 4),
        "gradOnCentre": rv(dvc, 4),            # ∂L/∂v_c = Σ over pos+neg of (σ−label)·v'
        "lr": LR,
        "update": "v_c ← v_c − lr · ∂L/∂v_c",
        "centreVecAfter": rv(vc_after, 4),
        "step": rv(vc_after - vc_before, 4),
        "note": ("positive context: gradient on the logit is σ(v_o·v_c)−1 < 0, so v_c moves TOWARD v_o "
                 "(pull together). each negative: gradient σ(v_n·v_c)−0 > 0, so v_c moves AWAY from v_n "
                 "(push apart). the net update is v_c − lr·Σ(σ−label)·v'."),
    }

    # ── convergence asserts ───────────────────────────────────────────────────────────────────────
    assert lossN < loss0, f"loss did not drop: {loss0} → {lossN}"
    assert rel_mean_dist < unrel_mean_dist, (
        f"related pairs (mean dist {rel_mean_dist:.3f}) should end up SPATIALLY TIGHTER than unrelated "
        f"({unrel_mean_dist:.3f}) after training")
    assert final_spread > init_spread, (
        f"cloud should expand from the tiny random init: {init_spread:.3f} → {final_spread:.3f}")
    assert len(snapshots) == len(CHECKPOINTS), "missing a checkpoint snapshot"

    out = {
        "method": ("skip-gram with negative sampling (SGNS) trained in numpy on a mini royalty+animals "
                   "corpus; dim=2 (directly plottable); window=2; k=4 negatives from unigram^0.75; "
                   f"SGD lr={LR}, {EPOCHS} epochs; RANDOM seeded init (seed={SEED})"),
        "window": WINDOW, "dim": DIM, "negK": NEG_K, "epochs": EPOCHS, "lr": LR, "seed": SEED,
        "noisePow": NOISE_POW,
        "corpus": CORPUS,
        "vocab": vocab,
        "freq": [freq[w] for w in vocab],
        "n": n,
        "noiseDist": [{"w": vocab[i], "p": r(noise_p[i], 4)} for i in range(n)],
        "nPairs": len(pairs),
        "pairsSample": [{"centre": vocab[c], "context": vocab[o]} for c, o in pairs[:12]],
        "checkpoints": CHECKPOINTS,
        "init2d": [{"w": vocab[i], "x": r(V0[i, 0], 4), "y": r(V0[i, 1], 4)} for i in range(n)],
        "trajectory": traj,                    # epoch 0 (random) → … → converged: positions + loss + spread
        "final2d": [{"w": vocab[i], "x": r(V[i, 0], 4), "y": r(V[i, 1], 4)} for i in range(n)],
        "vectors": {"V": rm(V, 4), "U": rm(U, 4)},   # learned centre + context tables
        "loss": {"history": loss_hist, "before": loss0, "after": lossN,
                 "dropPct": r((1 - lossN / loss0) * 100, 2)},
        "spread": {"init": init_spread, "final": final_spread,
                   "ratio": r(final_spread / init_spread, 3)},
        "related": related, "unrelated": unrelated,
        "similaritySummary": {
            "relatedMeanDistFinal": r(rel_mean_dist, 4),
            "unrelatedMeanDistFinal": r(unrel_mean_dist, 4),
            "separationRatio": r(unrel_mean_dist / rel_mean_dist, 3),   # >1 → related are tighter
            "relatedTighter": bool(rel_mean_dist < unrel_mean_dist),
            "relatedMeanCosFinal": r(rel_mean_final, 4),
            "unrelatedMeanCosFinal": r(unrel_mean_final, 4),
            "metricNote": ("primary signal is 2-D DISTANCE (what the position animation shows): related "
                           "words end up tighter. cosine barely separates at dim=2 since all words "
                           "co-occur with the/a and become near-collinear."),
        },
        "workedStep": worked,                  # one transparent SGNS update (the mechanics)
        "note": ("RANDOM init → full pass: the centre vectors start as a seeded random scatter and SGNS "
                 "pulls co-occurring words together / pushes noise words apart, so related words "
                 "(king·queen, man·woman, cat·dog) drift into clusters. dim=2 so the positions are the "
                 "raw learned embedding — no projection."),
    }

    DATA.mkdir(exist_ok=True)
    (DATA / "l5-word2vec-train.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    # ── PRINT a one-line summary (facts-checkable) ────────────────────────────────────────────────
    print(f"[w2v] vocab ({n}): {vocab}")
    print(f"[w2v] {len(pairs)} skip-gram pairs (window={WINDOW}); k={NEG_K} negatives (unigram^{NOISE_POW}); "
          f"dim={DIM} (plottable); {EPOCHS} epochs lr={LR} seed={SEED}")
    print(f"[w2v] loss: before={loss0:.5f}  after={lossN:.5f}  (drop {out['loss']['dropPct']}%)")
    print(f"[w2v] cloud spread: init={init_spread:.4f} → final={final_spread:.4f} "
          f"(×{out['spread']['ratio']})")
    print(f"[w2v] related dist (final): " +
          ", ".join(f"{p['a']}·{p['b']}={p['distFinal']}" for p in related) +
          f"  mean={rel_mean_dist:.3f}")
    print(f"[w2v] unrelated dist (final): " +
          ", ".join(f"{p['a']}·{p['b']}={p['distFinal']}" for p in unrelated) +
          f"  mean={unrel_mean_dist:.3f}  → related TIGHTER? "
          f"{out['similaritySummary']['relatedTighter']} (×{out['similaritySummary']['separationRatio']})")
    w = worked
    print(f"[w2v] worked step: centre='{w['centre']}' context='{w['context']}' "
          f"σ(pos)={w['positive']['sigmoid']} grad={w['positive']['gradOnLogit']} "
          f"({w['positive']['gradSign']}); {NEG_K} negs={[e['word'] for e in w['negatives']]}; "
          f"v_c {w['centreVecBefore']} → {w['centreVecAfter']}")
    print(f"[w2v] wrote data/l5-word2vec-train.json ({len(CHECKPOINTS)} checkpoints)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
