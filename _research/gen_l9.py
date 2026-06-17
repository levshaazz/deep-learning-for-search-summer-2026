#!/usr/bin/env python3
"""gen_l9.py — TOY (stdlib-only, pure-arithmetic) worked-example numbers for L9
"Hyperspace Lanes" (ANN: HNSW · IVF · PQ · Production/latency).

Every number here is COMPUTED from frozen toy geometry (math.hypot / integer byte arithmetic /
a deterministic greedy walk) and rounded to 4 places, so the JSON is byte-stable (H3, reproducible
on bare /usr/bin/python3 — this file imports ONLY stdlib + genlib.write_json). The four climbs:

  HNSW  (greedy small-world search): 6 nodes in 2-D, M=2 edges, entry n0. Greedy hops to the closest
                    neighbour until a local min: n0(4.5277)→n1(2.5495)→n2(0.7071) = 2 hops, NN=n2 =
                    the brute-force NN → recall@1 = 1.0. This shows the MECHANISM, not a speedup (on
                    6 nodes there is no eval saving; the O(log N) win is asymptotic — see climb-latency
                    and the "10⁶ vectors" zoom). The ef knob: a trap query where ef=1 stops at a local
                    min (recall 0.0) but ef=3 keeps a candidate list and escapes (recall 1.0).
  IVF   (coarse-quantize + cell probing): 9 points, nlist=3 frozen centroids, query q in cell c0. Its
                    true 3-NN = 2 points in c0 + 1 point just across the border in c1. nprobe=1 probes
                    c0 only → 2/3 → recall@3 = 0.6667; nprobe=2 also probes c1 (the 2nd-nearest cell) →
                    3/3 → 1.0. The COMMITTED GEOMETRY is asserted: exactly 2 NN in c0, the 3rd in c1,
                    AND c1 is the 2nd-nearest cell to q — else nprobe=2 would not reach the 3rd NN.
  PQ    (product quantization, memory math): D=8 float32 → m=4 subvectors → each → 1 of k=256 centroids
                    → 1 byte → 4 bytes/vector vs 8×4=32 → compression 8×. Scale-up: 768-d→96 B (32×),
                    128-d→8 B (64×). The PQ-m4 recall is REPRESENTATIVE (cited, not hand-derived).
  LATENCY (serving budget): client +3 · embed +8 · ANN search +12 · rerank +60 · cache/log +2 ·
                    response +4 → total 89 ms < 200 ms SLA. Exact scan of 10⁶×768-d would blow it
                    (the search hop alone). Per-hop ms are REPRESENTATIVE; only the SUM is the gated
                    exact computation. (This climb REUSES the L1 `sequence` slide-type, not a widget.)

Toy and (optional) REAL numbers share one file each (the L7/L8 schema): toy blocks live here, the FAISS
"real" blocks (HNSW recall@10 vs efSearch, IVF-PQ recall vs nprobe, measured latency) are spliced in by
the heavy companion _research/gen_l9_real.py (FAISS, /usr/bin/python3). To keep H3 robust under
reproduce.sh — which re-runs *this* (stdlib, always succeeds) on a FAISS-less CI where gen_l9_real fails
soft — this script READ-MERGES: it preserves any pre-existing heavy-owned "real" keys rather than clobbering.

Output: data/l9-hnsw.json, data/l9-ivf.json, data/l9-pq.json, data/l9-latency.json, data/l9-bench.json
Run:  python3 _research/gen_l9.py     (stdlib only — runs on bare /usr/bin/python3 too)
"""
import json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
from genlib import write_json


def r(x, n=4):
    return round(float(x), n)


def dist(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def load_existing(path):
    """Return the committed JSON (to preserve heavy-owned 'real' keys) or {} on first build."""
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def main():
    # ═══════════════════════ Climb 1 · HNSW — greedy search on a tiny small-world graph ═══════════════════════
    labels = ["n0", "n1", "n2", "n3", "n4", "n5"]
    nodes = [[0, 0], [2, 0], [4, 0], [1, 3], [3, 3], [5, 2]]
    edges = [[0, 1], [0, 3], [1, 2], [1, 3], [2, 4], [2, 5], [3, 4], [4, 5]]
    q = [4.5, 0.5]
    entry = 0

    adj = {i: set() for i in range(len(nodes))}
    for i, j in edges:
        adj[i].add(j)
        adj[j].add(i)

    # deterministic greedy descent: at each node move to the strictly-closer neighbour (lowest dist),
    # neighbours scanned in sorted order so ties are stable; stop at a local minimum.
    cur = entry
    path = [cur]
    hop_table = []
    while True:
        cur_d = dist(nodes[cur], q)
        neigh = [{"id": labels[nb], "idx": nb, "dist": r(dist(nodes[nb], q))} for nb in sorted(adj[cur])]
        best, best_d = None, cur_d
        for nb in sorted(adj[cur]):
            d = dist(nodes[nb], q)
            if d < best_d:
                best_d, best = d, nb
        hop_table.append({"at": labels[cur], "atIdx": cur, "atDist": r(cur_d),
                          "neighbors": neigh, "moveTo": (labels[best] if best is not None else None)})
        if best is None:
            break
        cur = best
        path.append(cur)

    bf_idx = min(range(len(nodes)), key=lambda i: dist(nodes[i], q))
    bf_dist = r(dist(nodes[bf_idx], q))
    recall = 1.0 if path[-1] == bf_idx else 0.0

    hnsw_p = DATA / "l9-hnsw.json"
    hnsw = load_existing(hnsw_p)
    hnsw["_doc"] = ("HNSW greedy search. Toy = a 6-node small-world graph (M=2) in 2-D, hand-computable "
                    "Euclidean distances (stdlib). Greedy from entry n0 hops to the closest neighbour until a "
                    "local min: n0(4.5277)→n1(2.5495)→n2(0.7071), 2 hops, NN=n2 = brute-force NN → recall@1 = 1.0. "
                    "This is the MECHANISM, not a speedup (6 nodes → no eval saving; the O(log N) win is asymptotic, "
                    "shown on climb-latency / the 10⁶-vector zoom). The ef knob: a trap where ef=1 stops at a local "
                    "min (recall 0.0) but ef=3 keeps a candidate list and escapes (recall 1.0). Real = frozen FAISS "
                    "HNSW recall@10 vs efSearch, spliced by _research/gen_l9_real.py.")
    hnsw["_source"] = "_research/gen_l9.py (toy, stdlib) + gen_l9_real.py (FAISS HNSW, /usr/bin/python3)"
    hnsw["toy"] = {
        "labels": labels,
        "coords": {"nodes": nodes},
        "edges": edges,
        "query": q,
        "entry": entry,
        "bruteForce": {"nn": labels[bf_idx], "nnIdx": bf_idx, "dist": bf_dist},
        "greedy": {"path": [labels[i] for i in path], "pathIdx": path,
                   "hops": len(path) - 1, "nodesVisited": len(path), "recall": recall},
        "hopTable": hop_table,
        # the ef knob (conceptual second scenario — the local-min trap; recalls are the lesson outcomes,
        # not derived from the 6-node toy above): ef=1 stops in the trap (0.0), ef=3 escapes (1.0).
        "trap": {"ef1": {"recall": 0.0}, "ef3": {"recall": 1.0}},
        "knobs": {"M": 2, "ef": 1, "efOptions": [1, 3]},
    }
    write_json(hnsw_p, hnsw)

    # ═══════════════════════ Climb 2 · IVF — recall@k vs nprobe ═══════════════════════
    points = [[2.5, 2.2], [3.0, 2.8], [4.0, 2.0], [1.5, 1.5], [1.0, 3.0],
              [6.0, 1.0], [5.5, 3.0], [2.0, 6.0], [3.0, 6.5]]
    centroids = [[2, 2], [5, 2], [2, 6]]
    qi = [3, 2]
    K = 3  # k in recall@k (and the number of true NN)

    assign = [min(range(len(centroids)), key=lambda c: dist(p, centroids[c])) for p in points]
    q_cell = min(range(len(centroids)), key=lambda c: dist(qi, centroids[c]))
    true_nn = sorted(range(len(points)), key=lambda i: dist(points[i], qi))[:K]
    cell_rank = sorted(range(len(centroids)), key=lambda c: dist(qi, centroids[c]))

    def probe(nprobe):
        cells = cell_rank[:nprobe]
        probed = [i for i in range(len(points)) if assign[i] in cells]
        found = [i for i in true_nn if i in probed]
        return {"cells": cells, "found": found, "recall": r(len(found) / K)}

    # geometry guards (the climb breaks if any fails) — recomputed independently by provenance_l9 too
    in_c0 = [i for i in true_nn if assign[i] == 0]
    in_c1 = [i for i in true_nn if assign[i] == 1]
    geom_ok = (len(in_c0) == 2 and len(in_c1) == 1 and cell_rank[1] == 1 and q_cell == 0)
    assert geom_ok, f"IVF toy geometry broken: in_c0={in_c0} in_c1={in_c1} cellRank={cell_rank} qCell={q_cell}"

    ivf = {
        "_doc": ("IVF coarse-quantizer + cell probing. Toy = 9 points, nlist=3 frozen centroids, query q in "
                 "cell c0 (stdlib). True 3-NN = 2 points in c0 + 1 just across the border in c1. nprobe=1 probes "
                 "c0 only → 2/3 → recall@3 = 0.6667; nprobe=2 also probes c1 (the 2nd-nearest cell) → 3/3 → 1.0. "
                 "COMMITTED GEOMETRY is asserted here and in provenance_l9: exactly 2 NN in c0, the 3rd in c1, AND "
                 "c1 is the 2nd-nearest cell to q (cellRankByDist[1]==c1) — else nprobe=2 would not reach the 3rd NN "
                 "and recall would not climb 0.6667→1.0. Real = frozen FAISS IVF-PQ recall vs nprobe (gen_l9_real.py)."),
        "_source": "_research/gen_l9.py (toy, stdlib) + gen_l9_real.py (FAISS IVF-PQ, /usr/bin/python3)",
        "toy": {
            "points": points,
            "assign": assign,
            "centroids": centroids,
            "query": qi,
            "queryCell": q_cell,
            "nlist": len(centroids),
            "k": K,
            "trueNN": true_nn,
            "cellRankByDist": cell_rank,
            "probe": {"1": probe(1), "2": probe(2)},
        },
    }
    write_json(DATA / "l9-ivf.json", ivf)

    # ═══════════════════════ Climb 3 · PQ — subvectors / codebooks + memory math ═══════════════════════
    BYTES_F32 = 4

    def pq_row(dim, m, k=256):
        return {"dim": dim, "m": m, "k": k,
                "bytesFloat32": dim * BYTES_F32, "bytesPQ": m,        # 1 byte per subvector (k=256 → log2 256 = 8 bits)
                "compression": (dim * BYTES_F32) // m}

    toy = {"D": 8, "m": 4, "dStar": 8 // 4, "k": 256,
           "bytesFloat32": 8 * BYTES_F32, "bytesPQ": 4, "compression": (8 * BYTES_F32) // 4}
    scale = [pq_row(768, 96), pq_row(128, 8)]

    pq_p = DATA / "l9-pq.json"
    pq = load_existing(pq_p)
    pq["_doc"] = ("Product Quantization, memory math. Toy (by-hand, exact, stdlib): a D=8 float32 vector → m=4 "
                  "subvectors of d*=2 dims → each → nearest of k=256 centroids → index fits in 1 byte → 4 bytes/vector "
                  "vs 8×4=32 → compression 8×. Scale-up (representative): 768-d→m=96→96 B vs 3072 (32×); 128-d→m=8→8 B "
                  "vs 512 (64×). ADC = split the query into m subvectors, precompute an m×k distance table, sum lookups. "
                  "The PQ-m4 recall@1 is REPRESENTATIVE (cited in l9-bench, not hand-derived). Real = frozen FAISS PQ "
                  "recall@1, spliced by _research/gen_l9_real.py.")
    pq["_source"] = "_research/gen_l9.py (toy, stdlib) + gen_l9_real.py (FAISS PQ, /usr/bin/python3)"
    pq["toy"] = toy
    pq["scale"] = scale
    pq["adc"] = {"tableShape": [toy["m"], toy["k"]]}
    pq["recallRepresentative"] = {"m4": 0.70, "representative": True,
                                  "source": "Representative recall@1 for 4-subvector PQ vs exact (PQ is lossy; "
                                            "Jégou, Douze & Schmid, TPAMI 2011). Measured value: gen_l9_real.py / l9-bench."}
    write_json(pq_p, pq)

    # ═══════════════════════ Climb 4 · Latency — serving budget (REUSE L1 `sequence` slide-type) ═══════════════════════
    budget = [
        {"step": 1, "from": "client", "to": "API", "label": "request", "lat": 3},
        {"step": 2, "from": "API", "to": "encoder", "label": "embed query", "lat": 8},
        {"step": 3, "from": "API", "to": "ANN index", "label": "ANN search (10⁶ quantized)", "lat": 12},
        {"step": 4, "from": "API", "to": "reranker", "label": "rerank top-100 (cross-encoder)", "lat": 60},
        {"step": 5, "from": "API", "to": "cache/log", "label": "cache + log (async)", "lat": 2, "kind": "async"},
        {"step": 6, "from": "API", "to": "client", "label": "response", "lat": 4},
    ]
    total = sum(h["lat"] for h in budget)
    latency = {
        "_doc": ("Production serving latency budget (REUSE of the L1 `sequence` slide-type, NOT a widget). The per-hop "
                 "ms are REPRESENTATIVE serving figures; only the SUM is the gated exact computation: "
                 "3+8+12+60+2+4 = 89 ms < 200 ms SLA. An EXACT scan of 10⁶×768-d would cost the exactScanMs below — "
                 "the search hop alone blows the budget. A cache hit returns in ≈ cacheHitMs. Caching + quantization "
                 "are the levers (callback L1 MLSD; the L7 cross-encoder cascade now sits BEHIND ANN retrieval)."),
        "_source": "_research/gen_l9.py (toy, stdlib): total = Σ lat. Per-hop + exactScan/cacheHit are representative.",
        "sla": 200,
        "budget": budget,
        "total": total,
        "exactScanMs": 520,   # representative: exact scan of 10⁶×768-d (>500ms; replaces the +12 ANN hop)
        "cacheHitMs": 5,      # representative: repeated-query cache hit
    }
    write_json(DATA / "l9-latency.json", latency)

    # ═══════════════════════ CITED benchmarks (l9-bench.json) ═══════════════════════
    bench = {
        "_doc": ("CITED published benchmarks for L9 — NOT computed in this repo. Use verbatim with source. "
                 "HNSW (Malkov & Yashunin); PQ (Jégou et al.); IVF/FAISS (Johnson et al.); TurboQuant frontier "
                 "(Zandieh et al., arXiv:2504.19874 — data-oblivious/online, no codebook; ≈2.7× from the distortion "
                 "lower bound; better recall with near-zero indexing time). The PQ-m4 recall is representative."),
        "_source": "_research/gen_l9.py (static, cited): HNSW, PQ, IVF/FAISS, TurboQuant",
        "cited": True,
        "hnsw":      {"complexity": "O(log N) search", "knobs": ["M", "efConstruction", "efSearch"],
                      "source": "Malkov & Yashunin, IEEE TPAMI 2018/2020 (arXiv:1603.09320)"},
        "pq":        {"recallRepresentativeM4": 0.70, "representative": True,
                      "source": "Jégou, Douze & Schmid, IEEE TPAMI 2011 (Product Quantization for NN search)"},
        "ivfFaiss":  {"note": "coarse quantizer (IVF) + GPU-scale ANN", "k256": 256,
                      "source": "Johnson, Douze & Jégou, 'Billion-scale similarity search with GPUs' (arXiv:1702.08734)"},
        "turboquant": {"fromLowerBound": 2.7, "online": True, "noCodebook": True,
                       "mechanism": "random rotation → Beta-concentrated coordinates → per-coordinate optimal scalar "
                                    "quantizer; two-stage MSE + 1-bit QJL residual → unbiased inner product",
                       "claim": "outperforms existing PQ techniques in recall while reducing indexing time to ~0",
                       "source": "Zandieh, Daliri, Hadian & Mirrokni, arXiv:2504.19874 (2025, Google Research)"},
    }
    write_json(DATA / "l9-bench.json", bench)

    print(f"[gen_l9] hnsw     dists={[h['atDist'] for h in hop_table]} path={hnsw['toy']['greedy']['path']} hops={len(path)-1} recall={recall}")
    print(f"[gen_l9] ivf      assign={assign} trueNN={true_nn} cellRank={cell_rank} recall@3 1→{ivf['toy']['probe']['1']['recall']} 2→{ivf['toy']['probe']['2']['recall']}")
    print(f"[gen_l9] pq       toy 32→4 (8×); scale {[(s['dim'], s['bytesPQ'], s['compression']) for s in scale]}")
    print(f"[gen_l9] latency  budget sum={total} < {latency['sla']} (exactScan {latency['exactScanMs']}, cacheHit {latency['cacheHitMs']})")
    print("[gen_l9] wrote l9-hnsw + l9-ivf + l9-pq + l9-latency + l9-bench (toy/cited; heavy 'real' keys preserved)")


if __name__ == "__main__":
    main()
