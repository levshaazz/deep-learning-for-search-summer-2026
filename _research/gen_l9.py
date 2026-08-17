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


def sqdist(a, b):
    """Squared Euclidean over arbitrary dimension (integer in → integer out)."""
    return sum((x - y) ** 2 for x, y in zip(a, b))


def distN(a, b):
    """Euclidean over arbitrary dimension (used by the >2-D toys; 2-D path stays `dist`)."""
    return math.sqrt(sqdist(a, b))


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return math.sqrt(sum(x * x for x in a))


def cosine(a, b):
    na, nb = norm(a), norm(b)
    return dot(a, b) / (na * nb) if na and nb else 0.0


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

    # ── toy2 · the 2-LAYER climb: a base-only greedy hits a local-min trap; entry from an upper
    #    hub bridges the gap and the descent lands on the true NN. 12 base nodes on a frozen integer
    #    grid, split into a LEFT (trap) and RIGHT (true-NN) cluster with NO base edge across the gap.
    t2_labels = ["b%d" % i for i in range(12)]
    t2_coords = [
        [0, 0], [2, 3], [4, 1], [1, 6], [4, 6], [2, 9],     # b0..b5  LEFT cluster (trap side)
        [14, 1], [16, 4], [18, 1], [15, 7], [17, 8], [13, 5],  # b6..b11 RIGHT cluster (true NN here)
    ]
    t2_base_edges = [
        [0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [2, 4],                       # left cluster
        [6, 7], [6, 8], [7, 8], [7, 9], [9, 10], [9, 11], [11, 7], [7, 10],   # right cluster (no cross-gap edge)
    ]
    t2_hubs = [2, 7]            # b2 (left, the trap node) + b7 (right) live on layer 1
    t2_hub_edges = [[2, 7]]    # the long-range hub bridge that spans the gap
    t2_entry_hub = 2           # enter the search at b2 on the upper layer
    t2_base_entry = 0          # base-layer-only search starts here (worst-case corner)
    t2_q = [16, 6]

    t2_adj = {i: set() for i in range(len(t2_coords))}
    for i, j in t2_base_edges:
        t2_adj[i].add(j)
        t2_adj[j].add(i)
    t2_hub_adj = {h: set() for h in t2_hubs}
    for i, j in t2_hub_edges:
        t2_hub_adj[i].add(j)
        t2_hub_adj[j].add(i)

    def greedy_walk(start, adjacency):
        """Deterministic greedy descent (move to the strictly-closer neighbour, ties by sorted id)."""
        cur = start
        path = [cur]
        table = []
        while True:
            cur_d = dist(t2_coords[cur], t2_q)
            neigh = [{"id": t2_labels[nb], "dist": r(dist(t2_coords[nb], t2_q))} for nb in sorted(adjacency[cur])]
            best, best_d = None, cur_d
            for nb in sorted(adjacency[cur]):
                d = dist(t2_coords[nb], t2_q)
                if d < best_d:
                    best_d, best = d, nb
            table.append({"at": t2_labels[cur], "atDist": r(cur_d), "neighbors": neigh,
                          "moveTo": (t2_labels[best] if best is not None else None)})
            if best is None:
                break
            cur = best
            path.append(cur)
        return path, table

    t2_bf = min(range(len(t2_coords)), key=lambda i: (dist(t2_coords[i], t2_q), i))
    t2_path_base_only, t2_table_base_only = greedy_walk(t2_base_entry, t2_adj)   # the trap
    t2_path_l1, t2_table_l1 = greedy_walk(t2_entry_hub, t2_hub_adj)              # hub hop on layer 1
    t2_land = t2_path_l1[-1]
    t2_path_l0, t2_table_l0 = greedy_walk(t2_land, t2_adj)                       # descend on the base layer

    # geometry guards: base-only MUST trap on a non-NN node; the 2-layer descent MUST reach the NN
    t2_base_only_recall = 1.0 if t2_path_base_only[-1] == t2_bf else 0.0
    t2_two_layer_recall = 1.0 if t2_path_l0[-1] == t2_bf else 0.0
    assert t2_base_only_recall == 0.0, "toy2 broken: base-only greedy did NOT trap (it found the NN)"
    assert t2_two_layer_recall == 1.0, "toy2 broken: 2-layer descent did NOT reach the true NN"

    hnsw["toy2"] = {
        "_doc": ("Two-layer climb: base-layer-only greedy from b0 traps at a local min "
                 + t2_labels[t2_path_base_only[-1]] + " (recall@1 = 0.0 — no base edge crosses the gap); "
                 "entering at upper hub b2, one layer-1 hub hop reaches b7, then the base-layer descent "
                 "lands on " + t2_labels[t2_bf] + " = the true NN (recall@1 = 1.0)."),
        "labels": t2_labels,
        "coords": {"nodes": t2_coords},
        "layers": [
            {"layer": 1, "members": t2_hubs, "edges": t2_hub_edges},
            {"layer": 0, "members": list(range(len(t2_coords))), "edges": t2_base_edges},
        ],
        "query": t2_q,
        "entryHub": t2_labels[t2_entry_hub],
        "baseEntry": t2_labels[t2_base_entry],
        "bruteForce": {"nn": t2_labels[t2_bf], "dist": r(dist(t2_coords[t2_bf], t2_q))},
        "hopTable": {
            "L1": t2_table_l1,
            "L0": t2_table_l0,
            "baseOnly": t2_table_base_only,
        },
        "greedy": {
            "pathL1": [t2_labels[i] for i in t2_path_l1],
            "pathL0": [t2_labels[i] for i in t2_path_l0],
            "hopsTotal": (len(t2_path_l1) - 1) + (len(t2_path_l0) - 1),
            "nodesVisited": len(t2_path_l1) + len(t2_path_l0),
            "recall": t2_two_layer_recall,
        },
        "baseOnly": {
            "path": [t2_labels[i] for i in t2_path_base_only],
            "trappedAt": t2_labels[t2_path_base_only[-1]],
            "hops": len(t2_path_base_only) - 1,
            "recall": t2_base_only_recall,
        },
    }

    # ── efSweep · a 30-node graph (seed 909, integer-grid coords), beam-greedy keeping `ef`
    #    candidates. Worst-case start (the node farthest from q) so ef=1 traps; larger ef escapes.
    import heapq
    import random as _random
    EF_SEED = 909
    _random.seed(EF_SEED)
    ef_n = 30
    ef_coords = [[_random.randint(0, 40), _random.randint(0, 40)] for _ in range(ef_n)]
    ef_q = [_random.randint(0, 40), _random.randint(0, 40)]
    ef_M = 2  # base degree per node (M nearest by coord) — sparse enough that ef=1 can trap
    ef_bf = min(range(ef_n), key=lambda i: (distN(ef_coords[i], ef_q), i))
    ef_adj = {i: set() for i in range(ef_n)}
    for i in range(ef_n):
        order = sorted(range(ef_n), key=lambda j: (distN(ef_coords[i], ef_coords[j]), j))
        for j in order[1:ef_M + 1]:
            ef_adj[i].add(j)
            ef_adj[j].add(i)
    ef_entry = max(range(ef_n), key=lambda i: (distN(ef_coords[i], ef_q), i))  # farthest node = worst-case start

    def beam_search(ef):
        """HNSW search-layer beam: keep the best `ef` candidates; stop when the frontier can't improve them."""
        visited = {ef_entry}
        d0 = distN(ef_coords[ef_entry], ef_q)
        frontier = [(d0, ef_entry)]   # min-heap (nearest to expand)
        results = [(-d0, ef_entry)]   # max-heap of the best ef (negated dist)
        evaluated = 1
        while frontier:
            cd, c = heapq.heappop(frontier)
            if cd > -results[0][0] and len(results) >= ef:
                break
            for nb in sorted(ef_adj[c]):
                if nb in visited:
                    continue
                visited.add(nb)
                dn = distN(ef_coords[nb], ef_q)
                evaluated += 1
                if len(results) < ef or dn < -results[0][0]:
                    heapq.heappush(frontier, (dn, nb))
                    heapq.heappush(results, (-dn, nb))
                    if len(results) > ef:
                        heapq.heappop(results)
        best = min(results, key=lambda x: -x[0])[1]
        return evaluated, (1 if best == ef_bf else 0)

    ef_sweep = []
    for ef in (1, 2, 4, 8, 16):
        ev, found = beam_search(ef)
        ef_sweep.append({"ef": ef, "candidatesEvaluated": ev, "recallAt1": r(found)})

    hnsw["efSweep"] = {
        "_doc": ("ef sweep on a 30-node graph (random.seed(%d), integer-grid coords in [0,40]², base degree "
                 "M=%d, search started at the node FARTHEST from q = worst case). Brute-force NN = node %d. ef=1 "
                 "traps (recall 0.0); ef>=2 keeps a candidate list and escapes to recall 1.0, evaluating more "
                 "candidates as ef grows. Seed pinned for byte-stability." % (EF_SEED, ef_M, ef_bf)),
        "seed": EF_SEED,
        "n": ef_n,
        "M": ef_M,
        "grid": [0, 40],
        "coords": ef_coords,
        "query": ef_q,
        "entry": ef_entry,
        "bruteForce": {"nn": ef_bf, "dist": r(distN(ef_coords[ef_bf], ef_q))},
        "sweep": ef_sweep,
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

    # ── toy2 · the full nprobe SWEEP: 20 frozen points, 5 committed centroids, k=5. The 5 true-NN are
    #    distributed across the first 3 cells-by-distance (3 in c0, 1 in c4, 1 in c1) so recall climbs
    #    0.6 → 0.8 → 1.0 as nprobe walks down cellRankByDist. Every fraction is exact (found/5).
    iv2_centroids = [[4, 4], [12, 4], [4, 12], [12, 12], [10, 9]]   # c0..c4
    iv2_q = [5, 5]
    iv2_points = [
        [5, 4], [4, 5], [6, 6],        # 0,1,2  -> c0 (the 3 closest NN)
        [8, 7],                        # 3      -> c4 (a NN sitting in the 2nd-nearest cell)
        [9, 4],                        # 4      -> c1 (a NN sitting in the 3rd-nearest cell)
        [2, 2],                        # 5      -> c0 filler (NOT a NN)
        [12, 4], [13, 5], [11, 3],     # 6,7,8  -> c1
        [4, 12], [5, 13], [3, 11],     # 9,10,11 -> c2
        [12, 12], [13, 13], [11, 11],  # 12,13,14 -> c3
        [10, 9], [11, 10], [9, 8],     # 15,16,17 -> c4
        [1, 9], [9, 1],                # 18,19 scattered far
    ]
    iv2_K = 5
    iv2_assign = [min(range(len(iv2_centroids)), key=lambda c: (dist(p, iv2_centroids[c]), c)) for p in iv2_points]
    iv2_q_cell = min(range(len(iv2_centroids)), key=lambda c: (dist(iv2_q, iv2_centroids[c]), c))
    iv2_cell_rank = sorted(range(len(iv2_centroids)), key=lambda c: (dist(iv2_q, iv2_centroids[c]), c))
    iv2_true_nn = sorted(range(len(iv2_points)), key=lambda i: (dist(iv2_points[i], iv2_q), i))[:iv2_K]

    def iv2_probe(nprobe):
        cells = iv2_cell_rank[:nprobe]
        probed = [i for i in range(len(iv2_points)) if iv2_assign[i] in cells]
        found = [i for i in iv2_true_nn if i in probed]
        return {"nprobe": nprobe, "cellsProbed": cells, "pointsScanned": len(probed),
                "found": found, "recall": r(len(found) / iv2_K)}

    iv2_sweep = [iv2_probe(n) for n in range(1, len(iv2_centroids) + 1)]
    # geometry guard: the NN must straddle the first 3 cells so the climb is non-trivial & monotone
    iv2_nn_cells = sorted({iv2_assign[i] for i in iv2_true_nn})
    iv2_recalls = [row["recall"] for row in iv2_sweep]
    assert len(iv2_nn_cells) == 3, "IVF toy2 broken: true-NN no longer span 3 cells (recall won't climb)"
    assert all(iv2_recalls[i] <= iv2_recalls[i + 1] for i in range(len(iv2_recalls) - 1)), \
        "IVF toy2 broken: nprobe recall not monotone non-decreasing"

    ivf["toy2"] = {
        "_doc": ("nprobe sweep: 20 frozen points, nlist=5 committed centroids, k=5. The 5 true-NN are distributed "
                 "across the first 3 cells-by-distance (3 in c0, 1 in c4, 1 in c1), so probing more cells climbs "
                 "recall 0.6 -> 0.8 -> 1.0. cellRankByDist orders cells by centroid-to-q distance; nprobe takes the "
                 "first n of them. Fractions are exact (found / 5)."),
        "points": iv2_points,
        "assign": iv2_assign,
        "centroids": iv2_centroids,
        "query": iv2_q,
        "queryCell": iv2_q_cell,
        "nlist": len(iv2_centroids),
        "k": iv2_K,
        "trueNN": iv2_true_nn,
        "cellRankByDist": iv2_cell_rank,
        "sweep": iv2_sweep,
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

    # ── adcWorked · ADC (asymmetric distance computation) end-to-end, BY HAND. D=8, m=4, k=4 centroids
    #    per subspace, frozen integer codebooks. Split q into m subqueries, build the m×k squared-distance
    #    table; a db vector's ADC distance is just Σ_j adcTable[j][codes[j]] — the distance to its PQ
    #    RECONSTRUCTION (the centroids its codes point at). The frozen db vector's TRUE subvectors are NEAR
    #    but NOT EQUAL to those centroids (each off by one coordinate → nonzero quantization error), so
    #    adcDistance is an APPROXIMATION of exactDistance, not an identity — the whole point of PQ/ADC.
    adc_D, adc_m, adc_k = 8, 4, 4
    adc_dstar = adc_D // adc_m
    adc_query = [2, 1, 0, 3, 4, 2, 1, 0]
    adc_subqueries = [adc_query[j * adc_dstar:(j + 1) * adc_dstar] for j in range(adc_m)]
    adc_codebooks = [
        [[2, 1], [0, 0], [3, 2], [1, 3]],   # subspace 0 centroids
        [[0, 3], [2, 2], [4, 1], [1, 0]],   # subspace 1
        [[4, 2], [1, 1], [2, 3], [0, 4]],   # subspace 2
        [[1, 0], [3, 3], [0, 2], [2, 1]],   # subspace 3
    ]
    adc_table = [[sqdist(adc_subqueries[j], adc_codebooks[j][c]) for c in range(adc_k)] for j in range(adc_m)]
    # the frozen TRUE (un-quantized) db subvectors: each is its assigned centroid nudged by +1 in ONE
    # coordinate — close enough that the SAME centroid is still uniquely nearest (so codes are clean) but
    # NOT equal to it, giving a small per-subspace reconstruction error of 1 (= the quantization error).
    adc_db_subvectors = [[3, 3], [0, 4], [1, 4], [4, 3]]
    adc_db_vector = []
    for sv in adc_db_subvectors:
        adc_db_vector += sv
    # codes = the index of the NEAREST centroid per subspace (RECOMPUTED — ties broken by lowest index)
    adc_codes = [min(range(adc_k), key=lambda c: (sqdist(adc_db_subvectors[j], adc_codebooks[j][c]), c))
                 for j in range(adc_m)]
    # adcDistance = distance from query to the RECONSTRUCTION (the chosen centroids), via the table
    adc_distance = sum(adc_table[j][adc_codes[j]] for j in range(adc_m))
    adc_recon = []
    for j in range(adc_m):
        adc_recon += adc_codebooks[j][adc_codes[j]]
    # exactDistance = distance from query to the TRUE (un-quantized) db vector
    adc_exact = sqdist(adc_query, adc_db_vector)
    # ADC is an APPROXIMATION: it must DIFFER from exact (nonzero quantization error) yet stay CLOSE
    # (within ~20%) so the lesson is "ADC ≈ exact, cheaply".
    assert adc_distance != adc_exact, "ADC worked example broken: adcDistance == exactDistance (no quantization error)"
    assert abs(adc_distance - adc_exact) <= 0.2 * adc_exact, \
        "ADC worked example broken: quantization gap too large (ADC should be a CLOSE approximation)"
    pq["adcWorked"] = {
        "_doc": ("ADC by hand. D=8 query split into m=4 subqueries (d*=2); adcTable[j][c] = squared L2 between "
                 "subquery j and codebook[j] centroid c (a %d×%d table). The db vector's TRUE subvectors are near "
                 "but not equal to their nearest centroids, so it is stored as codes %s (the nearest per subspace); "
                 "adcDistance = Σ_j adcTable[j][codes[j]] = %d is the distance to the RECONSTRUCTION, an "
                 "APPROXIMATION of the exactDistance = %d to the true vector (gap = the quantization error). "
                 "ADC ≈ exact, computed cheaply from table lookups — the point of PQ." % (adc_m, adc_k, adc_codes, adc_distance, adc_exact)),
        "D": adc_D, "m": adc_m, "dStar": adc_dstar, "k": adc_k,
        "query": adc_query,
        "subqueries": adc_subqueries,
        "codebooks": adc_codebooks,
        "adcTable": adc_table,
        "dbVector": adc_db_vector,
        "dbSubvectors": adc_db_subvectors,
        "codes": adc_codes,
        "reconstructed": adc_recon,
        "adcDistance": adc_distance,
        "exactDistance": adc_exact,
    }

    # ── memoryConfigs · the memory ledger for 4 configs. bytesPQ = m·bitsPerCode/8, bytesFloat32 = dim·4,
    #    compression = float32/PQ, indexGB_at_1e9 = bytesPQ·1e9 bytes → decimal GB (= bytesPQ exactly).
    def mem_config(dim, m_, k_, bits):
        bytes_pq = m_ * bits // 8
        bytes_f32 = dim * 4
        comp = bytes_f32 // bytes_pq
        assert comp * bytes_pq == bytes_f32, "memoryConfigs: compression not integral for (%d,%d,%d,%d)" % (dim, m_, k_, bits)
        return {"dim": dim, "m": m_, "k": k_, "bitsPerCode": bits,
                "bytesPQ": bytes_pq, "bytesFloat32": bytes_f32,
                "compression": comp, "indexGB_at_1e9": bytes_pq}
    pq["memoryConfigs"] = {
        "_doc": ("PQ memory ledger. bytesPQ = m·bitsPerCode/8 (k centroids → log2(k) bits/code); "
                 "bytesFloat32 = dim·4; compression = float32/PQ; indexGB_at_1e9 = bytesPQ·1e9 bytes = bytesPQ GB "
                 "(decimal GB). k=256→8 bits/code; k=16→4 bits/code."),
        "configs": [
            mem_config(768, 96, 256, 8),
            mem_config(768, 192, 256, 8),
            mem_config(768, 96, 16, 4),
            mem_config(128, 8, 256, 8),
        ],
    }

    # ── codebookTrain · Lloyd's (k-means) on one subspace, BY HAND. 6 frozen 2-D subvectors, k=2, fixed
    #    init = the first 2 points, 2 iterations. Per iter: assignment to the CURRENT centroids, the inertia
    #    (Σ||x−c||²) those induce, then the centroid recompute. Inertia must be monotone non-increasing.
    cbt_sub = [[1, 1], [2, 1], [1, 2], [8, 8], [9, 8], [8, 9]]
    cbt_K = 2
    cbt_cents = [list(cbt_sub[0]), list(cbt_sub[1])]   # fixed init = first 2 points
    cbt_iters = []
    for it in range(2):
        cbt_assign = [min(range(cbt_K), key=lambda c: (sqdist(cbt_sub[i], cbt_cents[c]), c)) for i in range(len(cbt_sub))]
        cbt_inertia = r(sum(sqdist(cbt_sub[i], cbt_cents[cbt_assign[i]]) for i in range(len(cbt_sub))))
        cbt_iters.append({"iter": it, "assign": cbt_assign,
                          "centroids": [list(c) for c in cbt_cents], "inertia": cbt_inertia})
        new_cents = []
        for cl in range(cbt_K):
            members = [cbt_sub[i] for i in range(len(cbt_sub)) if cbt_assign[i] == cl]
            if members:
                new_cents.append([r(sum(p[0] for p in members) / len(members)),
                                  r(sum(p[1] for p in members) / len(members))])
            else:
                new_cents.append([float(x) for x in cbt_cents[cl]])
        cbt_cents = new_cents
    cbt_final_assign = [min(range(cbt_K), key=lambda c: (sqdist(cbt_sub[i], cbt_cents[c]), c)) for i in range(len(cbt_sub))]
    cbt_final_inertia = r(sum(sqdist(cbt_sub[i], cbt_cents[cbt_final_assign[i]]) for i in range(len(cbt_sub))))
    cbt_inertia_seq = [x["inertia"] for x in cbt_iters] + [cbt_final_inertia]
    assert all(cbt_inertia_seq[i] >= cbt_inertia_seq[i + 1] for i in range(len(cbt_inertia_seq) - 1)), \
        "codebookTrain broken: inertia not monotone non-increasing"
    pq["codebookTrain"] = {
        "_doc": ("Lloyd's k-means on one PQ subspace, by hand. 6 frozen 2-D subvectors, k=2, fixed init = first "
                 "2 points, 2 iterations. Each iter reports the assignment to the CURRENT centroids, the inertia "
                 "(Σ||x−c||²) they induce, then the recompute. Inertia sequence %s is monotone non-increasing."
                 % cbt_inertia_seq),
        "subvectors": cbt_sub,
        "k": cbt_K,
        "init": [list(cbt_sub[0]), list(cbt_sub[1])],
        "iterations": cbt_iters,
        "final": {"assign": cbt_final_assign, "centroids": cbt_cents, "inertia": cbt_final_inertia},
        "inertiaSequence": cbt_inertia_seq,
    }
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
    # The async hop (fire-and-forget cache+log) is NOT on the user-facing critical path: the
    # response leaves after step 4. Selling its +2 ms inside "user latency" mixed two different
    # quantities on one slide — the deck now shows criticalPathMs to the user and keeps `total`
    # as the sum of ALL hops (both are gated exact computations).
    critical = sum(h["lat"] for h in budget if h.get("kind") != "async")
    latency = {
        "_doc": ("Production serving latency budget (REUSE of the L1 `sequence` slide-type, NOT a widget). The per-hop "
                 "ms are REPRESENTATIVE serving figures; the SUMS are the gated exact computations: "
                 "critical path 3+8+12+60+4 = 87 ms (< 200 ms SLA, headroom 113), all hops incl. the async "
                 "cache+log tail 89 ms. An EXACT scan of 10⁶×768-d would cost the exactScanMs below — "
                 "the search hop alone blows the budget. A cache hit returns in ≈ cacheHitMs. Caching + quantization "
                 "are the levers (callback L1 MLSD; the L7 cross-encoder cascade now sits BEHIND ANN retrieval)."),
        "_source": "_research/gen_l9.py (toy, stdlib): total = Σ lat. Per-hop + exactScan/cacheHit are representative.",
        "sla": 200,
        "budget": budget,
        "total": total,
        "criticalPathMs": critical,
        "slaHeadroomMs": 200 - critical,
        "exactScanMs": 520,   # representative: exact scan of 10⁶×768-d (>500ms; replaces the +12 ANN hop)
        "cacheHitMs": 5,      # representative: repeated-query cache hit
    }

    # ── cacheHitBudget · the WARM path (cache hit): client→api + cache lookup + response. cacheHitMs is the
    #    gated SUM of these hops (it agrees with the representative cacheHitMs=5 above by construction).
    cache_hit_budget = [
        {"step": 1, "from": "client", "to": "API", "label": "request", "lat": 3},
        {"step": 2, "from": "API", "to": "cache", "label": "cache lookup (hit)", "lat": 1},
        {"step": 3, "from": "API", "to": "client", "label": "response", "lat": 1},
    ]
    cache_hit_ms = sum(h["lat"] for h in cache_hit_budget)
    latency["cacheHitBudget"] = {
        "_doc": ("Warm path (cache hit): the per-hop ms are representative, but cacheHitMs is the gated exact SUM "
                 "3+1+1 = %d ms — no ANN search, no rerank." % cache_hit_ms),
        "budget": cache_hit_budget,
        "cacheHitMs": cache_hit_ms,
    }
    # ── tailNote · a representative latency tier {p50, p99} (FLAGGED representative — not computed here).
    latency["tailNote"] = {
        "_doc": ("Representative serving-latency tier: p50/p99 of a warm ANN+rerank tier. Flagged representative "
                 "(illustrative, not measured in this repo) — the tail (p99) is what an SLA is written against."),
        "p50": 45,
        "p99": 180,
        "representative": True,
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

    # ═══════════════════════ NEW · l9-metrics.json — distance/similarity metrics, by hand ═══════════════════════
    # Two frozen D=4 integer vectors; all six metric quantities computed exactly. Then (b) a pair where L2 and
    # cosine DISAGREE on which candidate is closer, and (c) a 1-query/3-candidate ranking whose top-1 DIFFERS
    # under L2 vs cosine vs inner-product — the whole point: the metric choice changes the answer.
    m_a, m_b = [1, 2, 2, 0], [2, 0, 1, 1]
    m_dot = dot(m_a, m_b)
    m_na, m_nb = norm(m_a), norm(m_b)
    m_pair = {
        "a": m_a, "b": m_b,
        "l2": r(distN(m_a, m_b)),
        "dot": m_dot,
        "cosine": r(cosine(m_a, m_b)),
        "aNorm": r(m_na),
        "bNorm": r(m_nb),
        "normalizedDot": r(m_dot / (m_na * m_nb)),
    }

    # (b) disagreement pair: query qq with candidates p1 (near in L2, off-direction) and p2 (far in L2,
    #     perfectly aligned → cosine 1.0). L2 picks p1; cosine picks p2 → the rankings flip.
    dq = [3, 3]
    dp1, dp2 = [1, 0], [6, 6]
    d_l2_1, d_l2_2 = distN(dq, dp1), distN(dq, dp2)
    d_cos_1, d_cos_2 = cosine(dq, dp1), cosine(dq, dp2)
    d_l2_winner = "p1" if d_l2_1 < d_l2_2 else "p2"
    d_cos_winner = "p1" if d_cos_1 > d_cos_2 else "p2"
    assert d_l2_winner != d_cos_winner, "metrics disagree-pair broken: L2 and cosine agree"
    disagree = {
        "query": dq,
        "p1": dp1, "p2": dp2,
        "l2": {"p1": r(d_l2_1), "p2": r(d_l2_2), "winner": d_l2_winner},
        "cosine": {"p1": r(d_cos_1), "p2": r(d_cos_2), "winner": d_cos_winner},
        "note": "L2 prefers the nearer-but-misaligned p1; cosine prefers the aligned-but-farther p2 — rankings flip.",
    }

    # (c) 1 query, 3 candidates → a DIFFERENT top-1 under each metric.
    rq = [2, 2, 0, 0]
    rcands = {"d1": [2, 1, 0, 0], "d2": [3, 3, 0, 0], "d3": [7, 4, 0, 0]}
    rrows = {name: {"vector": v, "l2": r(distN(rq, v)), "dot": dot(rq, v), "cosine": r(cosine(rq, v))}
             for name, v in rcands.items()}
    top_l2 = sorted(rcands, key=lambda n: (distN(rq, rcands[n]), n))[0]
    top_cos = sorted(rcands, key=lambda n: (-cosine(rq, rcands[n]), n))[0]
    top_ip = sorted(rcands, key=lambda n: (-dot(rq, rcands[n]), n))[0]
    assert len({top_l2, top_cos, top_ip}) == 3, "metrics ranking broken: top-1 not distinct across L2/cosine/IP"
    ranking = {
        "query": rq,
        "candidates": rrows,
        "top1": {"l2": top_l2, "cosine": top_cos, "innerProduct": top_ip},
        "note": "L2 → nearest displacement; cosine → best alignment; inner-product → largest magnitude·alignment.",
    }

    metrics = {
        "_doc": ("Distance/similarity metrics, by hand (stdlib). pair = two frozen D=4 integer vectors with l2, dot, "
                 "cosine, the two norms and normalizedDot (= cosine). disagree = a pair where L2 and cosine pick "
                 "DIFFERENT candidates. ranking = 1 query, 3 candidates whose top-1 differs under L2 vs cosine vs "
                 "inner-product. The lesson: the metric choice changes the answer."),
        "_source": "_research/gen_l9.py (toy, stdlib): exact integer-vector arithmetic, rounded to 4 places.",
        "pair": m_pair,
        "disagree": disagree,
        "ranking": ranking,
    }
    write_json(DATA / "l9-metrics.json", metrics)

    # ═══════════════════════ NEW · l9-compare.json — the index-family comparison matrix ═══════════════════════
    # Qualitative cells are build-time STRINGS (O-notation, update cost, best-for). Quantitative cells REFERENCE
    # existing gated values only (PQ compression from l9-pq; representative recall from l9-bench, with a source) —
    # NO new computed decimals are introduced here.
    pq_compression = pq["toy"]["compression"]                       # 8 (from l9-pq.json, gated)
    pq_compression_768 = pq["scale"][0]["compression"]              # 32 (768-d → 96 B, gated)
    bench_recall_m4 = bench["pq"]["recallRepresentativeM4"]         # 0.70 (representative, l9-bench.json)

    def cell(method, value, kind, source=None):
        c = {"method": method, "value": value, "kind": kind}
        if source is not None:
            c["source"] = source
        return c

    methods = ["flat", "HNSW", "IVF", "IVF-PQ", "HNSW-PQ"]
    compare = {
        "_doc": ("Index-family comparison matrix. methods = flat / HNSW / IVF / IVF-PQ / HNSW-PQ. Qualitative cells "
                 "(kind='qual') are build-time strings (search O-notation, update/build cost, best-for). Quantitative "
                 "cells (kind='num') REFERENCE existing gated values — PQ compression from l9-pq.json, representative "
                 "recall from l9-bench.json (with a source) — so this file introduces NO new computed decimals."),
        "_source": "_research/gen_l9.py (qual = build-time strings; num = references to l9-pq.json + l9-bench.json).",
        "methods": methods,
        "rows": [
            {"criterion": "search complexity", "cells": [
                cell("flat", "O(N·D)", "qual"),
                cell("HNSW", "O(log N)", "qual"),
                cell("IVF", "O(nprobe·N/nlist·D)", "qual"),
                cell("IVF-PQ", "O(nprobe·N/nlist) ADC lookups", "qual"),
                cell("HNSW-PQ", "O(log N) ADC lookups", "qual"),
            ]},
            {"criterion": "build / update cost", "cells": [
                cell("flat", "none (append-only)", "qual"),
                cell("HNSW", "high build, incremental insert", "qual"),
                cell("IVF", "train centroids, cheap insert", "qual"),
                cell("IVF-PQ", "train centroids + codebooks", "qual"),
                cell("HNSW-PQ", "high build + codebooks", "qual"),
            ]},
            {"criterion": "memory / compression", "cells": [
                cell("flat", "1× (raw float32)", "qual"),
                cell("HNSW", "1× + graph overhead", "qual"),
                cell("IVF", "1× + inverted lists", "qual"),
                cell("IVF-PQ", pq_compression, "num",
                     "compression from l9-pq.json toy (float32/PQ); 768-d config = %d× (l9-pq.json scale)." % pq_compression_768),
                cell("HNSW-PQ", pq_compression, "num",
                     "same PQ compression as IVF-PQ — from l9-pq.json toy (float32/PQ)."),
            ]},
            {"criterion": "representative recall", "cells": [
                cell("flat", "1.0 (exact)", "qual"),
                cell("HNSW", "high (tunable via efSearch)", "qual"),
                cell("IVF", "tunable via nprobe", "qual"),
                cell("IVF-PQ", bench_recall_m4, "num",
                     "representative PQ-m4 recall@1 from l9-bench.json (Jégou et al., TPAMI 2011)."),
                cell("HNSW-PQ", bench_recall_m4, "num",
                     "representative PQ-m4 recall@1 from l9-bench.json (Jégou et al., TPAMI 2011)."),
            ]},
            {"criterion": "best for", "cells": [
                cell("flat", "small N, exact baseline", "qual"),
                cell("HNSW", "low-latency in-memory recall", "qual"),
                cell("IVF", "large N with cheap training", "qual"),
                cell("IVF-PQ", "billion-scale, RAM-bound", "qual"),
                cell("HNSW-PQ", "low-latency + compressed", "qual"),
            ]},
        ],
    }
    write_json(DATA / "l9-compare.json", compare)

    print(f"[gen_l9] hnsw     dists={[h['atDist'] for h in hop_table]} path={hnsw['toy']['greedy']['path']} hops={len(path)-1} recall={recall}")
    print(f"[gen_l9] ivf      assign={assign} trueNN={true_nn} cellRank={cell_rank} recall@3 1→{ivf['toy']['probe']['1']['recall']} 2→{ivf['toy']['probe']['2']['recall']}")
    print(f"[gen_l9] pq       toy 32→4 (8×); scale {[(s['dim'], s['bytesPQ'], s['compression']) for s in scale]}")
    print(f"[gen_l9] latency  budget sum={total} < {latency['sla']} (exactScan {latency['exactScanMs']}, cacheHit {latency['cacheHitMs']}); cacheHitBudget={cache_hit_ms} tail p50/p99={latency['tailNote']['p50']}/{latency['tailNote']['p99']}")
    print(f"[gen_l9] hnsw2    baseOnly trap@{hnsw['toy2']['baseOnly']['trappedAt']} recall={hnsw['toy2']['baseOnly']['recall']} | 2-layer→{hnsw['toy2']['bruteForce']['nn']} recall={hnsw['toy2']['greedy']['recall']}; efSweep={[(s['ef'], s['candidatesEvaluated'], s['recallAt1']) for s in ef_sweep]}")
    print(f"[gen_l9] ivf2     trueNN cells={[iv2_assign[i] for i in iv2_true_nn]} nprobe recalls={iv2_recalls}")
    print(f"[gen_l9] pq2      adcDistance={adc_distance} (≈ exact {adc_exact}, gap {abs(adc_distance - adc_exact)}); compressions={[c['compression'] for c in pq['memoryConfigs']['configs']]}; inertia={cbt_inertia_seq}")
    print(f"[gen_l9] metrics  pair l2={m_pair['l2']} dot={m_pair['dot']} cos={m_pair['cosine']}; ranking top1 l2/cos/ip={top_l2}/{top_cos}/{top_ip}")
    print("[gen_l9] wrote l9-hnsw + l9-ivf + l9-pq + l9-latency + l9-bench + l9-metrics + l9-compare (toy/cited; heavy 'real' keys preserved)")


if __name__ == "__main__":
    main()
