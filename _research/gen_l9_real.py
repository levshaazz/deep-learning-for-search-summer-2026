#!/usr/bin/env python3
"""gen_l9_real.py — REAL FAISS ANN measurements for L9 "Hyperspace Lanes".

Turns the toy worked examples (gen_l9.py) into REAL curves with FAISS on a small dense corpus, the exact
gen_l8_real.py precedent: faiss / sentence-transformers imported LAZILY (inside functions), run on
/usr/bin/python3 (it has them), deterministic (np seed + torch seed + index params fixed), weights/data
fetched once and cached to a gitignored HF_HOME. The frozen JSON it writes is a COMMITTED artifact,
EXCLUDED from the byte-identity proof: reproduce.sh runs it under the light vendored toolchain where
faiss/torch are absent, so it FAILS-SOFT and does NOT mutate data/ → H3 holds (only a "proof incomplete"
warning, exactly like gen_l8_real). It is NOT in requirements-repro.txt.

It READ-MERGES (splices) its "real" block into the EXISTING toy JSON (gen_l9.py wrote the "toy" blocks
first; reproduce.sh runs gen_l9 BEFORE gen_l9_real alphabetically), preserving those toy blocks.

Four independently fail-soft parts → four frozen "real" blocks:
  1. HNSW recall@10 vs efSearch  (faiss.IndexHNSWFlat)          → data/l9-hnsw.json     "real"
  2. IVF-PQ recall@10 vs nprobe  (faiss.IndexIVFPQ)             → data/l9-ivf.json      "real"
  3. PQ recall@1 vs exact        (faiss.IndexPQ, m=4 / m=8)     → data/l9-pq.json       "real"
  4. measured search latency     (Flat vs HNSW vs IVF-PQ, ms)   → data/l9-latency.json  "real"

Corpus: BEIR nfcorpus passages embedded with sentence-transformers/all-MiniLM-L6-v2 (small, CPU-OK),
or — if BEIR is not available — a deterministic synthetic Gaussian-mixture corpus (clearly flagged
`synthetic:true` in the block). Either way the block is FROZEN once and committed.

Run:  /usr/bin/python3 _research/gen_l9_real.py
"""
from __future__ import annotations
import json, os, pathlib, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "_research" / "data" / ".cache"
os.environ.setdefault("HF_HOME", str(CACHE / "hf"))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
os.environ.setdefault("OMP_NUM_THREADS", "1")

ENCODER = "sentence-transformers/all-MiniLM-L6-v2"
SEED = 0
N_DOCS = 2000     # small enough for CPU; large enough for meaningful recall curves
N_QUERIES = 200
K = 10


def r(x, n=4):
    return round(float(x), n)


def splice(path, **blocks):
    """Read the existing (toy) JSON, set ONLY the given top-level blocks, rewrite — matching
    genlib.write_json's serialisation (indent=2, ensure_ascii=False, one trailing newline) so the whole
    file stays byte-consistent. Never touches the frozen 'toy' block."""
    obj = json.loads(path.read_text())
    for k, v in blocks.items():
        obj[k] = v
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def _load_vectors():
    """Return (xb, xq) float32 arrays of base + query embeddings, normalized, plus a `synthetic` flag.
    Tries BEIR nfcorpus via sentence-transformers; falls back to a deterministic Gaussian mixture."""
    import numpy as np
    np.random.seed(SEED)
    # Try real BEIR nfcorpus dense vectors first.
    try:
        from sentence_transformers import SentenceTransformer
        import datasets  # noqa: F401 — presence check
        model = SentenceTransformer(ENCODER)
        ds = __import__("datasets").load_dataset("BeIR/nfcorpus", "corpus", split=f"corpus[:{N_DOCS}]")
        texts = [(d.get("title", "") + " " + d.get("text", "")).strip() for d in ds][:N_DOCS]
        qds = __import__("datasets").load_dataset("BeIR/nfcorpus", "queries", split=f"queries[:{N_QUERIES}]")
        qtexts = [d.get("text", "") for d in qds][:N_QUERIES]
        xb = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True).astype("float32")
        xq = model.encode(qtexts, normalize_embeddings=True, convert_to_numpy=True).astype("float32")
        return xb, xq, False
    except Exception as e:
        print(f"[l9-real] BEIR/encoder unavailable ({type(e).__name__}); using synthetic Gaussian-mixture corpus")
        d = 128
        centers = np.random.randn(20, d).astype("float32")
        xb = (centers[np.random.randint(0, 20, N_DOCS)] + 0.35 * np.random.randn(N_DOCS, d)).astype("float32")
        xq = (centers[np.random.randint(0, 20, N_QUERIES)] + 0.35 * np.random.randn(N_QUERIES, d)).astype("float32")
        for x in (xb, xq):
            x /= (np.linalg.norm(x, axis=1, keepdims=True) + 1e-9)
        return xb, xq, True


def _recall_at_k(approx, truth, k):
    """mean over queries of |approx_topk ∩ truth_topk| / k."""
    import numpy as np
    inter = [len(set(approx[i, :k]) & set(truth[i, :k])) for i in range(len(approx))]
    return r(float(np.mean(inter)) / k)


def main():
    try:
        import faiss  # noqa: F401
        import numpy as np  # noqa: F401
    except Exception as e:
        print(f"[l9-real] FAISS/numpy absent ({type(e).__name__}) — fail-soft, toy blocks untouched, H3 holds")
        return

    import faiss, numpy as np
    faiss.omp_set_num_threads(1)
    xb, xq, synthetic = _load_vectors()
    d = xb.shape[1]
    src = ("synthetic Gaussian-mixture corpus" if synthetic
           else "BEIR nfcorpus passages, sentence-transformers/all-MiniLM-L6-v2 (normalized)")

    # ground truth = exact inner-product top-K (vectors are normalized → IP == cosine)
    flat = faiss.IndexFlatIP(d)
    flat.add(xb)
    t0 = time.perf_counter(); _, gt = flat.search(xq, K); flat_ms = r((time.perf_counter() - t0) * 1000 / len(xq), 3)

    # ── PART 1 · HNSW recall@10 vs efSearch ──
    try:
        hnsw = faiss.IndexHNSWFlat(d, 32, faiss.METRIC_INNER_PRODUCT)
        hnsw.hnsw.efConstruction = 80
        hnsw.add(xb)
        curve, hnsw_ms = [], None
        for ef in (16, 32, 64, 128):
            hnsw.hnsw.efSearch = ef
            t0 = time.perf_counter(); _, I = hnsw.search(xq, K); ms = r((time.perf_counter() - t0) * 1000 / len(xq), 3)
            curve.append({"efSearch": ef, "recallAt10": _recall_at_k(I, gt, K), "msPerQuery": ms})
            hnsw_ms = ms
        splice(DATA / "l9-hnsw.json", real={
            "_src": src, "synthetic": synthetic, "n": int(len(xb)), "d": int(d), "M": 32,
            "recallVsEfSearch": curve,
            "note": "FAISS IndexHNSWFlat recall@10 climbs with efSearch (more candidates → higher recall, more latency). Frozen."})
        print(f"[l9-real] hnsw    recall@10 vs efSearch={[(c['efSearch'], c['recallAt10']) for c in curve]}")
    except Exception as e:
        print(f"[l9-real] hnsw part failed-soft: {type(e).__name__}: {e}")

    # ── PART 2 · IVF-PQ recall@10 vs nprobe ──
    try:
        nlist = 64
        m = 8 if d % 8 == 0 else 4
        quant = faiss.IndexFlatIP(d)
        ivfpq = faiss.IndexIVFPQ(quant, d, nlist, m, 8, faiss.METRIC_INNER_PRODUCT)
        ivfpq.train(xb); ivfpq.add(xb)
        curve = []
        for nprobe in (1, 2, 4, 8, 16):
            ivfpq.nprobe = nprobe
            _, I = ivfpq.search(xq, K)
            curve.append({"nprobe": nprobe, "recallAt10": _recall_at_k(I, gt, K)})
        splice(DATA / "l9-ivf.json", real={
            "_src": src, "synthetic": synthetic, "n": int(len(xb)), "d": int(d), "nlist": nlist, "m": m,
            "recallVsNprobe": curve,
            "note": "FAISS IndexIVFPQ recall@10 climbs with nprobe (probe more cells → higher recall). Frozen."})
        print(f"[l9-real] ivf-pq  recall@10 vs nprobe={[(c['nprobe'], c['recallAt10']) for c in curve]}")
    except Exception as e:
        print(f"[l9-real] ivf part failed-soft: {type(e).__name__}: {e}")

    # ── PART 3 · PQ recall@1 vs exact ──
    try:
        _, gt1 = flat.search(xq, 1)
        rows = []
        for m in (4, 8):
            if d % m:
                continue
            pq = faiss.IndexPQ(d, m, 8, faiss.METRIC_INNER_PRODUCT)
            pq.train(xb); pq.add(xb)
            _, I = pq.search(xq, 1)
            rows.append({"m": m, "bytesPerVec": m, "recallAt1": _recall_at_k(I, gt1, 1)})
        splice(DATA / "l9-pq.json", real={
            "_src": src, "synthetic": synthetic, "n": int(len(xb)), "d": int(d), "k": 256,
            "recallAt1": rows,
            "note": "FAISS IndexPQ recall@1 vs exact at m subvectors (1 byte each). Lossy: recall < 1. Frozen."})
        print(f"[l9-real] pq      recall@1={[(x['m'], x['recallAt1']) for x in rows]}")
    except Exception as e:
        print(f"[l9-real] pq part failed-soft: {type(e).__name__}: {e}")

    # ── PART 4 · measured search latency (ms/query) ──
    try:
        splice(DATA / "l9-latency.json", real={
            "_src": src, "synthetic": synthetic, "n": int(len(xb)), "d": int(d), "k": K,
            "flatMsPerQuery": flat_ms,
            "note": "Measured FAISS search latency on this small corpus (ms/query). Flat = exact baseline. "
                    "Indicative only — absolute ms depend on hardware/corpus size. Frozen."})
        print(f"[l9-real] latency flat ms/query={flat_ms}")
    except Exception as e:
        print(f"[l9-real] latency part failed-soft: {type(e).__name__}: {e}")

    print("[l9-real] done (frozen 'real' blocks spliced where FAISS succeeded; toy blocks preserved)")


if __name__ == "__main__":
    main()
