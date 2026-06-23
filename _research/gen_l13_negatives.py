#!/usr/bin/env python3
"""gen_l13_negatives.py — the L13 "Crucible of Negatives" data generator.

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l13-negatives.json  — MEASURED on a tiny synthetic corpus we train here (rerunnable;
      reproduce.sh proves byte-identity under the frozen CPython-3.9 + numpy-2.0.2 toolchain).
  • data/l13-bench.json      — REPORTED published numbers (DPR Table 3, RocketQA ablation, ANCE,
      STAR/ADORE, TAS-B, AR2, SimCSE) — NOT computed here; each row carries its citation so the
      deck can label provenance "reported by ⟨cite⟩" vs "measured on our toy."

WHAT THE TOY DEMONSTRATES (de-risked: holds on 100% of 20 seeds — see the printout):
  the RocketQA INVERSION (in-batch → +undenoised-hard DROPS below it → +denoised RECOVERS & exceeds),
  the ANCE direction (dynamic ≫ static), and the two-axis spine (a false negative is near the
  POSITIVE, invisible on the query-hardness axis). The corpus is CONSTRUCTED to be false-negative-dense
  (R relevant docs / topic, only 1 labelled) so the inversion is demonstrable — the honest framing the
  deck carries (S71). The toy reproduces the ORDERING, not MS-MARCO magnitudes.

Run (frozen toolchain): PYTHONPATH=_research/data/.cache/pylibs /usr/bin/python3 _research/gen_l13_negatives.py
"""
import json
import math
from pathlib import Path
import numpy as np

DATA = Path(__file__).resolve().parent.parent / "data"
SEEDS = list(range(20))
STRATEGIES = ["random", "inbatch", "bm25", "undenoised", "denoised"]
CFG = dict(n_topics=40, R=4, n_dist=6, n_irrel=400, dim=32,
           epochs=160, lr=0.05, tau=0.1, k_neg=5, k_inbatch=8, recall_k=10)


def _unit(x):
    return x / np.linalg.norm(x, axis=-1, keepdims=True)


def build_corpus(rng, n_topics, R, n_dist, n_irrel, dim, **_):
    """A corpus with the two failure modes that make hard negatives interesting:
       • R genuinely-relevant docs / topic but only ONE is labelled → R-1 UNLABELLED POSITIVES (false negs);
       • n_dist 'distractor' docs near each topic = hard but TRUE negatives (denoising should push these).
       kinds: 0=relevant, 1=distractor(hard-true), 2=irrelevant-filler."""
    T = _unit(rng.normal(size=(n_topics, dim)))
    docs, doc_topic, doc_kind = [], [], []
    for ti in range(n_topics):
        tj = (ti + 1) % n_topics
        for _ in range(R):                                       # relevant (all truly relevant to ti) — TIGHT
            docs.append(_unit(T[ti] + 0.09 * rng.normal(size=dim))); doc_topic.append(ti); doc_kind.append(0)
        for _ in range(n_dist):                                  # hard TRUE negative: a ti/tj blend, not relevant
            docs.append(_unit(0.72 * T[ti] + 0.5 * T[tj] + 0.10 * rng.normal(size=dim)))
            doc_topic.append(-1); doc_kind.append(1)
    for _ in range(n_irrel):                                     # far filler
        docs.append(_unit(rng.normal(size=dim))); doc_topic.append(-1); doc_kind.append(2)
    docs = _unit(np.array(docs)); doc_topic = np.array(doc_topic); doc_kind = np.array(doc_kind)
    queries = _unit(T + 0.08 * rng.normal(size=(n_topics, dim)))
    stride = R + n_dist
    labeled = {ti: ti * stride for ti in range(n_topics)}                        # first relevant doc = labelled
    relevant = {ti: set(range(ti * stride, ti * stride + R)) for ti in range(n_topics)}  # ALL R (incl. unlabelled)
    return queries, docs, doc_topic, doc_kind, labeled, relevant


def recall_at_k(U, V, relevant, k):
    S = U @ V.T
    rec = [len(set(np.argpartition(-S[ti], k)[:k].tolist()) & rel) / len(rel) for ti, rel in relevant.items()]
    return float(np.mean(rec))


def train(strategy, seed):
    c = CFG
    rng = np.random.default_rng(seed)
    queries, docs, doc_topic, doc_kind, labeled, relevant = build_corpus(rng, **c)
    nq, nd, dim = len(queries), len(docs), docs.shape[1]
    tau, lr, k_neg = c["tau"], c["lr"], c["k_neg"]
    # COSINE-space dual-encoder, projected-gradient on the unit sphere (stable). Start from an
    # already-decent in-batch-quality checkpoint (content-initialised) — exactly RocketQA's setup, where
    # hard negs are ADDED to an in-batch baseline and then either sharpen or corrupt it.
    U = _unit(queries + 0.20 * rng.normal(size=(nq, dim)))
    V = _unit(docs + 0.20 * rng.normal(size=(nd, dim)))
    bm25 = {}  # static negatives: top docs by INITIAL score, excluding relevant (frozen lexical proxy)
    for ti in range(nq):
        order = np.argsort(-(U[ti] @ V.T))
        bm25[ti] = [d for d in order if d not in relevant[ti]][:k_neg]
    order = list(range(nq))
    for _ in range(c["epochs"]):
        rng.shuffle(order)
        for ti in order:
            p = labeled[ti]
            if strategy == "random":
                negs = rng.integers(0, nd, size=k_neg).tolist()
            elif strategy == "inbatch":
                negs = [labeled[o] for o in rng.choice(nq, size=c["k_inbatch"], replace=False) if o != ti]
            elif strategy == "bm25":
                negs = list(bm25[ti])
            else:  # undenoised / denoised — mine the model's own current top-k
                s = U[ti] @ V.T
                w = k_neg + len(relevant[ti]) + 2
                cand = np.argpartition(-s, w)[:w]; cand = cand[np.argsort(-s[cand])]
                if strategy == "undenoised":           # exclude ONLY the labelled positive → keeps false negs
                    negs = [d for d in cand if d != p][:k_neg]
                else:                                  # denoised: oracle-exclude ALL truly-relevant
                    negs = [d for d in cand if d not in relevant[ti]][:k_neg]
            negs = [n for n in negs if n != p][:k_neg]
            if not negs:
                continue
            C = [p] + negs
            s = (U[ti] @ V[C].T) / tau; s -= s.max()
            pi = np.exp(s); pi /= pi.sum()                       # softmax over {positive} ∪ negatives
            gu = (pi[:, None] * V[C]).sum(0) / tau - V[p] / tau  # ∂loss/∂u  (Euclidean InfoNCE grad)
            U[ti] = _unit(U[ti] - lr * gu)                       # step, then re-project to the sphere
            V[p] = _unit(V[p] - lr * (-(1 - pi[0]) * U[ti] / tau))
            for j, cc in enumerate(negs, start=1):
                V[cc] = _unit(V[cc] - lr * (pi[j] * U[ti] / tau))
    return recall_at_k(U, V, relevant, c["recall_k"])


def two_axis(seed=0):
    """The spine's two-axis structure: false neg near POSITIVE; hard-true near QUERY, far from positive."""
    rng = np.random.default_rng(seed)
    queries, docs, doc_topic, doc_kind, labeled, relevant = build_corpus(rng, **CFG)
    stride = CFG["R"] + CFG["n_dist"]
    fp_q, fp_p, ht_q, ht_p = [], [], [], []
    for ti in range(len(queries)):
        q, p = queries[ti], docs[labeled[ti]]
        falses = [d for d in relevant[ti] if d != labeled[ti]]                 # unlabelled positives = false negs
        hardtrue = [d for d in range(len(docs)) if doc_kind[d] == 1 and (d // stride) == ti]
        for d in falses: fp_q.append(float(q @ docs[d])); fp_p.append(float(p @ docs[d]))
        for d in hardtrue: ht_q.append(float(q @ docs[d])); ht_p.append(float(p @ docs[d]))
    return np.mean(fp_q), np.mean(fp_p), np.mean(ht_q), np.mean(ht_p)


def _softmax(xs):
    m = max(xs); ex = [math.exp(x - m) for x in xs]; s = sum(ex)
    return [e / s for e in ex]

def build_widget_data():
    """The pedagogical SPINE (Sereega's sparring lineup). The two cosine axes are design inputs
    chosen to tell the story (cos(q,.)=hardness, cos(.,d+)=collateral danger); everything else —
    the InfoNCE softmax/loss, the Boltzmann gradient weights, the log-N MI ceiling — is COMPUTED
    from them here, so the widget numbers are reproducible and gate-able. Drives infonce-calc,
    hardness-sphere, mining-comparator, impostor-denoise."""
    pos_cos = 0.82
    lineup = [
        {"id": "n1", "label": "random",       "cosQ": 0.05, "cosPos": 0.03, "band": "easy", "isFalse": False},
        {"id": "n2", "label": "in-batch",     "cosQ": 0.41, "cosPos": 0.37, "band": "semi", "isFalse": False},
        {"id": "n3", "label": "BM25-hard",    "cosQ": 0.63, "cosPos": 0.34, "band": "hard", "isFalse": False},
        {"id": "n4", "label": "dynamic-hard", "cosQ": 0.75, "cosPos": 0.31, "band": "hard", "isFalse": False},
        {"id": "n5", "label": "impostor",     "cosQ": 0.79, "cosPos": 0.80, "band": "hard", "isFalse": True},
    ]
    taus = [0.5, 0.2, 0.1, 0.05]
    sims = [pos_cos] + [n["cosQ"] for n in lineup]               # index 0 = the positive d+
    infonce = []
    for t in taus:
        sm = _softmax([x / t for x in sims])
        infonce.append({"tau": t, "softmax": [round(p, 4) for p in sm],
                        "pPos": round(sm[0], 4), "loss": round(-math.log(sm[0]), 4)})
    boltzmann = []                                              # gradient weight on each NEGATIVE (the central lens)
    negsims = [n["cosQ"] for n in lineup]
    for t in taus:
        w = _softmax([x / t for x in negsims])
        boltzmann.append({"tau": t, "weights": [round(x, 4) for x in w]})
    logN = [{"N": N, "logN_nats": round(math.log(N), 4)} for N in [4, 16, 64, 256, 1024, 16384]]
    return {
        "_note": "Pedagogical spine: cosQ/cosPos are design inputs; InfoNCE softmax/loss, Boltzmann "
                 "gradient weights and the log-N MI ceiling are COMPUTED from them. The two-axis story is "
                 "n4 vs n5 — same cosQ (~0.75/0.79, both mined) but cosPos 0.31 vs 0.80: n5 is the impostor.",
        "positive": {"id": "dPlus", "label": "true positive", "cosQ": pos_cos},
        "lineup": lineup,
        "taus": taus,
        "infonce": infonce,
        "boltzmann": boltzmann,
        "logNBound": logN,
        "minedByStrategy": {                                    # which lineup negative each strategy surfaces
            "random": ["n1"], "inbatch": ["n2"], "bm25": ["n3"],
            "undenoised": ["n4", "n5"], "denoised": ["n4"],
        },
    }

def main():
    res = {s: np.array([train(s, sd) for sd in SEEDS]) for s in STRATEGIES}
    recall = {s: {"mean": round(float(res[s].mean()), 3), "std": round(float(res[s].std()), 3)} for s in STRATEGIES}
    stacked = np.array([res[s] for s in STRATEGIES])
    claims = {
        "inversion":                  res["undenoised"] < res["inbatch"],
        "denoisingRecovers":          res["denoised"] > res["inbatch"],
        "dynamicGtStatic":            res["denoised"] > res["bm25"],
        "denoisedBestUndenoisedWorst": (res["denoised"] == stacked.max(0)) & (res["undenoised"] == stacked.min(0)),
    }
    hold = {k: round(float(v.mean()), 3) for k, v in claims.items()}
    fpq, fpp, htq, htp = two_axis()

    neg = {
        "_doc": ("MEASURED on a CONSTRUCTED false-negative-dense toy corpus (R=4 relevant docs per topic, "
                 "only 1 labelled → 3 unlabelled positives), a cosine-space dual-encoder trained under each "
                 "negative strategy, recall@10 over 20 seeds. Demonstrates (100% of seeds) the RocketQA "
                 "INVERSION (in-batch .645 → +undenoised-hard .411 DROPS below it → +denoised .783 recovers) "
                 "and the ANCE direction (dynamic denoised >> static bm25). The inversion is demonstrable-by-"
                 "construction, NOT discovered; reproduces the ORDERING, not MS-MARCO magnitudes. The strict "
                 "random<in-batch<bm25 monotone does NOT hold (those cluster) — that DPR static ladder is a "
                 "REPORTED bench number (l13-bench.json), never a toy claim."),
        "_source": "_research/gen_l13_negatives.py (frozen CPython-3.9 + numpy 2.0.2)",
        "measured": True,
        "config": CFG,
        "recallAt10": recall,
        "claimsHoldFraction": hold,
        "twoAxis": {
            "falseNeg":    {"cosQuery": round(float(fpq), 2), "cosPositive": round(float(fpp), 2)},
            "hardTrueNeg": {"cosQuery": round(float(htq), 2), "cosPositive": round(float(htp), 2)},
            "secondAxisSeparation": round(float(fpp - htp), 2),
            "_note": "A false negative is near the POSITIVE (cosPositive high) but no harder on the QUERY "
                     "axis than a hard-TRUE negative — invisible to a query-only view. This is the 2x2 (S36)."
        },
        "spine": build_widget_data(),
    }

    bench = {
        "_doc": ("CITED published numbers for L13 — NOT computed in this repo. Use verbatim with source. "
                 "The DPR static ladder (Karpukhin Table 3) and the RocketQA denoising ablation are the deck's "
                 "anchor figures; the toy (l13-negatives.json) reproduces the RocketQA SHAPE, not these magnitudes."),
        "_source": "_research/gen_l13_negatives.py (static, cited): DPR, RocketQA, ANCE, STAR/ADORE, TAS-B, AR2, SimCSE",
        "cited": True,
        "dprTable3": {
            "metric": "NQ dev, top-20",
            "goldNoInbatch": 63.1, "goldInbatch": 69.1, "goldInbatch127": 73.0, "goldPlusBM25Best": 78.0,
            "note": "Gold-7 no-in-batch 63.1 -> +in-batch 69.1 -> 127 in-batch 73.0 -> +1 BM25 hard neg (best) 78.0; a 2nd BM25 neg does not help.",
            "source": "Karpukhin et al., 'Dense Passage Retrieval for Open-Domain QA', EMNLP 2020 (arXiv:2004.04906)"
        },
        "rocketqaAblation": {
            "metric": "MS MARCO dev, MRR@10",
            "inbatch": 32.39, "plusUndenoisedHard": 26.03, "plusDenoisedHard": 36.38, "plusAugmentation": 37.02,
            "note": "Undenoised hard negs DROP below in-batch (false negatives); a cross-encoder denoiser recovers and exceeds.",
            "positivesPerQuery": 1.1, "collectionSize": 8800000, "unlabeledTopRelevantPct": 70,
            "source": "Qu et al., 'RocketQA', NAACL 2021 (arXiv:2010.08191)"
        },
        "ance": {
            "metric": "MS MARCO dev MRR@10 / NQ top-20",
            "mrr": 0.330, "nqTop20": 81.9, "refreshEveryBatches": 10000,
            "minedTrueHardOverlapPct": {"inbatch": 0, "bm25": 15, "ance": 100},
            "source": "Xiong et al., 'Approximate Nearest Neighbor Negative Contrastive Learning (ANCE)', ICLR 2021 (arXiv:2007.00808)"
        },
        "starAdore": {
            "metric": "MS MARCO dev MRR@10", "mrr": 0.347, "speedup": "179x",
            "source": "Zhan et al., 'Optimizing Dense Retrieval Model Training with Hard Negatives (STAR/ADORE)', SIGIR 2021 (arXiv:2104.08051)"
        },
        "tasb": {
            "metric": "MS MARCO dev MRR@10", "mrr": 0.340, "gpu": "single 11GB, <48h", "beirVsBm25Pct": -2.8,
            "source": "Hofstaetter et al., 'Efficiently Teaching an Effective Dense Retriever with Balanced Topic-Aware Sampling (TAS-B)', SIGIR 2021 (arXiv:2104.06967)"
        },
        "ar2": {
            "metric": "MS MARCO dev MRR@10", "mrr": 39.5, "plusSimans": 40.9,
            "source": "Zhang et al., 'Adversarial Retriever-Ranker (AR2)', ICLR 2022 (arXiv:2110.03611)"
        },
        "simcse": {
            "metric": "STS-B Spearman x100", "unsupervised": 76.3, "supervisedNLI": 81.6,
            "note": "Supervised SimCSE uses the NLI contradiction sentence as a HARD negative.",
            "source": "Gao, Yao & Chen, 'SimCSE', EMNLP 2021 (arXiv:2104.08821)"
        },
        "marginMse": {
            "method": "distil the teacher MARGIN S(q,p+)-S(q,p-), not the 0/1 label (graceful with false negatives)",
            "source": "Hofstaetter et al., 'Improving Efficient Neural Ranking Models with Cross-Architecture Knowledge Distillation (Margin-MSE)', arXiv:2010.02666"
        }
    }

    (DATA / "l13-negatives.json").write_text(json.dumps(neg, indent=2), encoding="utf-8")
    (DATA / "l13-bench.json").write_text(json.dumps(bench, indent=2), encoding="utf-8")

    print("[gen_l13] recall@10 over 20 seeds:")
    for s in STRATEGIES:
        print(f"    {s:12} {recall[s]['mean']:.3f} +/- {recall[s]['std']:.3f}")
    print("[gen_l13] directional claims (fraction of 20 seeds):")
    for k, v in hold.items():
        print(f"    {k:28} {v:.0%}")
    print(f"[gen_l13] two-axis: false-neg cosPos={neg['twoAxis']['falseNeg']['cosPositive']} "
          f"hard-true cosPos={neg['twoAxis']['hardTrueNeg']['cosPositive']} "
          f"sep={neg['twoAxis']['secondAxisSeparation']}")
    print("[gen_l13] wrote data/l13-negatives.json + data/l13-bench.json")


if __name__ == "__main__":
    main()
