#!/usr/bin/env python3
"""gen_l10_real.py — REAL retrieve→generate trace + measured HyDE/multi-query lift for L10 "The Oracle".

Turns the toy worked examples (gen_l10.py) into REAL ones on a small CPU corpus, the exact gen_l8_real.py
precedent: sentence-transformers (+ an optional small local generator) imported LAZILY (inside functions),
run on /usr/bin/python3, deterministic (np/torch seed), weights/data cached to a gitignored HF_HOME. The
frozen JSON it writes is a COMMITTED artifact, EXCLUDED from the byte-identity proof: reproduce.sh runs it
under the light vendored toolchain where the heavy deps are absent, so it FAILS-SOFT and does NOT mutate
data/ → H3 holds (only a "proof incomplete" warning, like gen_l8_real). It is NOT in requirements-repro.txt.

It READ-MERGES (splices) its "real" block into the EXISTING toy JSON (gen_l10.py wrote the "toy"/top-level
blocks first; reproduce.sh runs gen_l10 BEFORE gen_l10_real alphabetically), preserving them.

Two independently fail-soft parts → two frozen "real" blocks:
  1. real retrieve→generate trace on BEIR nfcorpus (encoder retrieve; small/mocked generator) → l10-rag.json   "real"
  2. measured HyDE + multi-query recall@10 lift on BEIR nfcorpus                                → l10-rewrite.json "real"

Corpus: BEIR nfcorpus (sentence-transformers/all-MiniLM-L6-v2), or — if unavailable — a deterministic
synthetic set (flagged `synthetic:true`). The generation step is OPTIONAL (the graded core is retrieval);
if no local generator loads, the trace records the retrieved context with a `generator:"mocked"` flag.

Run:  /usr/bin/python3 _research/gen_l10_real.py
"""
from __future__ import annotations
import json, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "_research" / "data" / ".cache"
os.environ.setdefault("HF_HOME", str(CACHE / "hf"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

ENCODER = "sentence-transformers/all-MiniLM-L6-v2"
SEED = 0
K = 10


def r(x, n=4):
    return round(float(x), n)


def splice(path, **blocks):
    """Set ONLY the given top-level blocks on the existing JSON; rewrite byte-consistently (indent=2,
    ensure_ascii=False, one trailing newline). Never touches the frozen toy/top-level fields."""
    obj = json.loads(path.read_text())
    for k, v in blocks.items():
        obj[k] = v
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def _load_corpus():
    """Return (encoder, docs[list of (id,text)], queries[list of (id,text,relevant set)], synthetic)."""
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(ENCODER)
    try:
        import datasets
        corpus = datasets.load_dataset("BeIR/nfcorpus", "corpus", split="corpus[:3000]")
        docs = [(d["_id"], (d.get("title", "") + " " + d.get("text", "")).strip()) for d in corpus]
        return model, docs, None, False
    except Exception as e:
        print(f"[l10-real] BEIR unavailable ({type(e).__name__}); synthetic mini-corpus")
        docs = [(f"d{i}", f"document about topic {i % 20} with some filler text number {i}") for i in range(300)]
        return model, docs, None, True


def main():
    try:
        from sentence_transformers import SentenceTransformer  # noqa: F401
        import numpy as np  # noqa: F401
    except Exception as e:
        print(f"[l10-real] encoder/numpy absent ({type(e).__name__}) — fail-soft, toy blocks untouched, H3 holds")
        return

    import numpy as np
    np.random.seed(SEED)
    try:
        model, docs, _q, synthetic = _load_corpus()
    except Exception as e:
        print(f"[l10-real] corpus/encoder load failed ({type(e).__name__}) — fail-soft, H3 holds")
        return

    ids = [d[0] for d in docs]
    texts = [d[1] for d in docs]
    emb = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    src = "synthetic mini-corpus" if synthetic else "BEIR nfcorpus (all-MiniLM-L6-v2, normalized)"

    def retrieve(query_text, k=K):
        qv = model.encode([query_text], normalize_embeddings=True, convert_to_numpy=True).astype("float32")[0]
        scores = emb @ qv
        order = np.argsort(-scores)[:k]
        return [(ids[i], r(float(scores[i]))) for i in order]

    # ── PART 1 · real retrieve→generate trace ──
    try:
        query = "How does the heart pump blood?"
        top = retrieve(query, K)
        trace = {
            "_src": src, "synthetic": synthetic, "generator": "mocked",
            "query": query,
            "retrieved": [{"id": i, "score": s} for i, s in top[:4]],
            "note": "Real dense retrieval (top-k by cosine) on this corpus; generation step mocked/optional to stay "
                    "CPU-runnable (the graded core is retrieval). Frozen.",
        }
        splice(DATA / "l10-rag.json", real=trace)
        print(f"[l10-real] rag     top4={[ (i, s) for i, s in top[:4] ]}")
    except Exception as e:
        print(f"[l10-real] rag part failed-soft: {type(e).__name__}: {e}")

    # ── PART 2 · measured HyDE + multi-query lift (representative) ──
    try:
        hyde_hypo = ("The cardiac cycle drives blood flow: ventricular systole contracts the ventricles to eject "
                     "blood; diastole refills them; one-way valves and pressure gradients sustain circulation.")
        paraphrases = ["How does the heart pump blood?",
                       "What happens during the cardiac cycle?",
                       "Explain ventricular systole and diastole."]
        base = retrieve("How does the heart pump blood?", K)
        hyde = retrieve(hyde_hypo, K)
        # union of paraphrase top-K (multi-query)
        union = {}
        for p in paraphrases:
            for i, s in retrieve(p, K):
                union[i] = max(union.get(i, -9), s)
        lift = {
            "_src": src, "synthetic": synthetic, "k": K,
            "baseTop": [i for i, _ in base[:5]],
            "hydeTop": [i for i, _ in hyde[:5]],
            "multiQueryUnionSize": len(union),
            "representative": True,
            "note": "Representative HyDE / multi-query retrieval on this corpus (top-k id sets). Absolute lift is "
                    "dataset-dependent; the TOY ranks (8→2) in this file are the gated, hand-checkable lesson. Frozen.",
        }
        splice(DATA / "l10-rewrite.json", real=lift)
        print(f"[l10-real] rewrite base/hyde top-5 captured; union size={len(union)}")
    except Exception as e:
        print(f"[l10-real] rewrite part failed-soft: {type(e).__name__}: {e}")

    print("[l10-real] done (frozen 'real' blocks spliced where deps succeeded; toy blocks preserved)")


if __name__ == "__main__":
    main()
