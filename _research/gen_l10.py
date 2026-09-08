#!/usr/bin/env python3
"""gen_l10.py — TOY (stdlib-only, pure-arithmetic) worked-example numbers for L10
"The Oracle" (RAG fundamentals · chunking · query understanding & rewriting).

Every number here is COMPUTED from frozen toy inputs (integer token arithmetic / math.ceil window
tiling / 1/rank and set-intersection recall) so the JSON is byte-stable (H3, reproducible on bare
/usr/bin/python3 — imports ONLY stdlib + genlib.write_json). The three climbs:

  RAG token budget : context 4096; system 200 + query 30 + k·256 chunks, reserving 512 for the answer.
                     At k=4 → stuffed 1024, prompt 1254, headroom 2842. kMax = floor((4096−200−30−512)/256)
                     = floor(3354/256) = 13. The window CAPS how much you can retrieve (why ranking matters).
                     One canonical end-to-end trace (l10-rag.json) is the lecture's recurring anchor figure.
  CHUNKING         : a 1000-token doc, answer span [380,470]. size=200/overlap=0 → ceil(1000/200)=5 chunks;
                     the answer STRADDLES boundary 400 (20 tok in chunk 2, 70 in chunk 3) → no chunk holds it
                     whole → recall@3 = 0 (BINARY answer-containment). overlap=50 → ceil(950/150)=7 chunks;
                     window [300,500] holds [380,470] whole → recall@3 = 1.0. Overlap costs storage, buys recall.
  QUERY REWRITE    : short query finds the true doc at rank 8 → recall@5 = 0, RR = 1/8 = 0.125. HyDE embeds a
                     hypothetical answer → true doc rises to rank 2 → recall@5 = 1, RR = 1/2 = 0.5 (single-true-doc
                     BINARY recall). Multi-query is a SEPARATE 5-relevant gold-set: single query 2/5 → recall@5 0.4;
                     the union of 3 paraphrases 4/5 → recall@5 0.8. Two recall senses, two gold-sets, never blended.

Toy and (optional) REAL numbers share one file each (the L7/L8 schema): toy blocks live here, the real
retrieve→generate trace + measured HyDE/multi-query lift on BEIR nfcorpus are spliced by the heavy
companion _research/gen_l10_real.py (fail-soft, /usr/bin/python3). reproduce.sh re-runs *this* (stdlib,
always succeeds) where the heavy deps are absent, so gen_l10_real fails soft → H3 holds. This script
READ-MERGES: it preserves any pre-existing heavy-owned "real" keys rather than clobbering them.

Output (PHASE-1 A+ expansion ADDS new gated data — existing blocks stay byte-identical):
  data/l10-rag.json (+retrievalMath), data/l10-chunking.json (+sweep), data/l10-rewrite.json,
  data/l10-bench.json (+RAPTOR/step-back/CRAG/self-RAG/adaptive-RAG citations), and NEW files:
  data/l10-budget.json, l10-chunkstrat.json, l10-raptor.json, l10-fusion.json, l10-decomp.json,
  data/l10-routing.json, l10-rerank.json, l10-selfrag.json.
Run:  python3 _research/gen_l10.py     (stdlib only — runs on bare /usr/bin/python3 too)
"""
import json, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
from genlib import write_json


def r(x, n=4):
    return round(float(x), n)


def load_existing(path):
    """Return the committed JSON (to preserve heavy-owned 'real' keys) or {} on first build."""
    try:
        return json.loads(path.read_text())
    except Exception:
        return {}


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def norm(a):
    return math.sqrt(sum(x * x for x in a))


def cos(a, b):
    """Plain cosine = dot/(‖a‖‖b‖) — stdlib, no numpy (this generator imports ONLY stdlib + write_json)."""
    return dot(a, b) / (norm(a) * norm(b))


def dcg_at(order, gains):
    """DCG with the standard log2(rank+1) discount; `order` is a list of doc ids, `gains` maps id→gain."""
    return sum(gains[d] / math.log2(i + 2) for i, d in enumerate(order))


def ndcg_at(order, gains):
    ideal = sorted(gains.values(), reverse=True)
    idcg = sum(g / math.log2(i + 2) for i, g in enumerate(ideal))
    return dcg_at(order, gains) / idcg if idcg > 0 else 0.0


def first_relevant_rr(order, gains):
    """Reciprocal rank of the first relevant (gain>0) doc; 0 if none."""
    for i, d in enumerate(order):
        if gains[d] > 0:
            return 1.0 / (i + 1)
    return 0.0


def chunk_windows(L, size, overlap):
    """Tile [0,L] with windows of `size`, stepping `size-overlap`. nChunks = ceil((L-overlap)/(size-overlap));
    the last window is clamped to L. Returns (nChunks, windows)."""
    step = size - overlap
    n = math.ceil((L - overlap) / step)
    windows = []
    for i in range(n):
        s = i * step
        windows.append([s, min(s + size, L)])
    return n, windows


def contains(window, span):
    return window[0] <= span[0] and span[1] <= window[1]


def main():
    # ═══════════════════════ Climb 1 · RAG — retrieve → stuff → generate + token budget ═══════════════════════
    ctx, sys_t, q_t, reserve, chunk_t = 4096, 200, 30, 512, 256
    k = 4
    stuffed = k * chunk_t                     # 1024
    prompt_total = sys_t + q_t + stuffed      # 1254
    headroom = ctx - prompt_total             # 2842
    k_max = (ctx - sys_t - q_t - reserve) // chunk_t   # floor(3354/256) = 13

    rag_p = DATA / "l10-rag.json"
    rag = load_existing(rag_p)
    rag["_doc"] = ("RAG anchor trace + token budget. Toy (exact, stdlib): context 4096; system 200 + query 30 + "
                   "k·256-token chunks, reserving 512 for the answer. At k=4 → stuffed 1024, prompt 1254, headroom "
                   "2842. kMax = floor((4096−200−30−512)/256) = floor(3354/256) = 13 — the window caps how much you "
                   "can retrieve (why ranking matters). ONE canonical end-to-end trace is the lecture's recurring "
                   "anchor figure (the rag-pipeline widget recurs with one stage in focus on 5 beats). climb-chunking "
                   "and climb-queryrewrite reference this same running example. Real = frozen retrieve→generate trace, "
                   "spliced by _research/gen_l10_real.py.")
    rag["_source"] = "_research/gen_l10.py (toy, stdlib) + gen_l10_real.py (real retrieve→generate, /usr/bin/python3)"
    rag["contextWindow"] = ctx
    rag["systemTokens"] = sys_t
    rag["queryTokens"] = q_t
    rag["answerReserve"] = reserve
    rag["chunkTokens"] = chunk_t
    rag["stages"] = ["chunk", "embed", "retrieve", "stuff", "generate"]
    rag["worked"] = {"k": k, "stuffed": stuffed, "promptTotal": prompt_total, "headroom": headroom}
    rag["kMax"] = k_max
    rag["trace"] = {
        "query": "How does the heart pump blood?",
        "retrieved": [
            {"id": "doc_cardiac_cycle", "score": 0.82, "chunk": "The cardiac cycle alternates systole and diastole; ventricular contraction ejects blood."},
            {"id": "doc_circulatory", "score": 0.79, "chunk": "The circulatory system moves blood through arteries and veins to the body's tissues."},
            {"id": "doc_valves", "score": 0.71, "chunk": "Heart valves keep blood flowing one way between the atria and ventricles."},
            {"id": "doc_anatomy", "score": 0.65, "chunk": "The heart has four chambers: two atria and two ventricles."},
        ],
        "prompt": "System: Answer using ONLY the context. Context: [4 chunks]. Question: How does the heart pump blood?",
        "answer": "The heart pumps blood through the cardiac cycle: during systole the ventricles contract and eject blood, while valves keep it flowing one way [doc_cardiac_cycle, doc_valves].",
    }
    # NEW · retrievalMath — the trace's top-3 scores, DERIVED from frozen raw toy vectors (not hand-picked).
    # 4 toy semantic dims [pump/contraction, anatomy/structure, flow/vessels, valves/one-way]. cos = dot/(‖q‖‖d‖),
    # rounded to 2-dp reproduces the trace's committed 0.82 / 0.79 / 0.71 exactly (verified, not authored).
    rm_query = [3, 2, 1, 1]                       # "How does the heart pump blood?"
    rm_docs = [
        ("doc_cardiac_cycle", [1, 2, 1, 2]),      # dot 10, ‖d‖ √10  → cos 0.8165 → 0.82
        ("doc_circulatory",   [1, 2, 2, 2]),      # dot 11, ‖d‖ √13  → cos 0.7877 → 0.79
        ("doc_valves",        [1, 5, 0, 2]),      # dot 15, ‖d‖ √30  → cos 0.7071 → 0.71
    ]
    nq = norm(rm_query)
    rm_rows = []
    for did, dv in rm_docs:
        d, nd, c = dot(rm_query, dv), norm(dv), cos(rm_query, dv)
        rm_rows.append({"id": did, "vec": dv, "dot": d, "normDoc": r(nd), "cos4": r(c), "cos": round(c, 2)})
    assert [row["cos"] for row in rm_rows] == [0.82, 0.79, 0.71], "retrievalMath must reproduce committed trace scores"
    rag["retrievalMath"] = {
        "dims": ["pump/contraction", "anatomy/structure", "flow/vessels", "valves/one-way"],
        "query": rm_query,
        "normQuery": r(nq),
        "docs": rm_rows,
        "formula": "cos = dot(q,d) / (‖q‖·‖d‖)",
        "note": "2-dp cos reproduces trace.retrieved scores 0.82/0.79/0.71 — recomputed from raw vectors, never hand-picked.",
    }
    write_json(rag_p, rag)

    # ═══════════════════════ NEW · Context-window budget (kMax per window) — l10-budget.json ═══════════════════════
    # Same fixed prompt overhead as climb-1; sweep the context window. kMax = (ctx − sys − q − reserve) // chunk.
    budget_windows = []
    for c in (4096, 8192, 32768, 128000):
        budget_windows.append({"ctx": c, "kMax": (c - sys_t - q_t - reserve) // chunk_t})
    budget = {
        "_doc": ("Token-budget sweep, exact (stdlib). The SAME fixed overhead as the anchor trace — system 200 + "
                 "query 30 + 512 reserved for the answer, 256-token chunks — but across real-world context windows "
                 "4096 / 8192 / 32768 / 128000. kMax = (ctx − sys − q − reserve) // chunk → 13 / 29 / 125 / 497. "
                 "A bigger window buys more chunks, but kMax grows ~linearly in ctx, NOT for free: every extra chunk "
                 "is more latency + more 'lost-in-the-middle' dilution, so ranking still decides WHICH k you keep."),
        "_source": "_research/gen_l10.py (toy, stdlib): kMax = (ctx − systemTokens − queryTokens − answerReserve) // chunkTokens.",
        "systemTokens": sys_t,
        "queryTokens": q_t,
        "answerReserve": reserve,
        "chunkTokens": chunk_t,
        "formula": "(ctx − sys − q − reserve) // chunk",
        "windows": budget_windows,
    }
    write_json(DATA / "l10-budget.json", budget)

    # ═══════════════════════ Climb 2 · Chunking — size/overlap → retrieval quality (binary containment) ═══════════════════════
    doc_len = 1000
    answer_span = [380, 470]
    scenarios = []
    for size, overlap in [(200, 0), (200, 50)]:
        n, windows = chunk_windows(doc_len, size, overlap)
        ans_idx = next((i for i, w in enumerate(windows) if contains(w, answer_span)), None)
        recall = 1.0 if ans_idx is not None else 0       # BINARY answer-containment (0 / 1.0), per L10.md
        scenarios.append({"size": size, "overlap": overlap, "nChunks": n, "windows": windows,
                          "answerChunk": ans_idx, "recallAt3": recall})

    # NEW · sweep — FIXED size=200, INCREASING overlap ∈ {0,50,100,150} over the SAME [380,470] gold span on
    # the 1000-token doc. Same nChunks / binary-containment recall logic as `scenarios`; recallAt3 is recomputed,
    # never authored. This tells the SAME lesson as climb-chunking-worked: overlap=0 straddles boundary 400
    # (recall 0); overlap≥50 gives a window [300,500] that holds [380,470] whole (recall 1) — overlap RESCUES the
    # boundary straddle, so recall climbs 0 → 1 → 1 → 1 (monotonic non-decreasing).
    sweep = []
    for size, overlap in [(200, 0), (200, 50), (200, 100), (200, 150)]:
        n, windows = chunk_windows(doc_len, size, overlap)
        ans_idx = next((i for i, w in enumerate(windows) if contains(w, answer_span)), None)
        recall = 1 if ans_idx is not None else 0       # BINARY answer-containment (recall@3 ∈ {0,1})
        sweep.append({"size": size, "overlap": overlap, "nChunks": n, "windows": windows,
                      "answerChunk": ans_idx, "recallAt3": recall})
    # geometry guards: monotone non-decreasing AND consistent with the established lesson (overlap=0 straddles
    # → recall 0; overlap≥50 rescues → recall 1) — else the sweep would contradict climb-chunking-worked.
    sweep_recalls = [row["recallAt3"] for row in sweep]
    assert all(sweep_recalls[i] <= sweep_recalls[i + 1] for i in range(len(sweep_recalls) - 1)), \
        "chunking sweep broken: recall not monotone non-decreasing in overlap"
    assert sweep[0]["recallAt3"] == 0, "chunking sweep broken: overlap=0 should straddle the boundary (recall 0)"
    assert all(row["recallAt3"] == 1 for row in sweep[1:]), \
        "chunking sweep broken: overlap≥50 should rescue the straddle (recall 1)"

    chunking = {
        "_doc": ("Chunking, exact (stdlib). A 1000-token doc with the answer span at [380,470] (binary "
                 "answer-containment: recall@3 ∈ {0,1} = does ANY window fully contain the span?). size=200/overlap=0 "
                 "→ ceil(1000/200)=5 chunks; the answer STRADDLES boundary 400 (20 tok in chunk 2, 70 in chunk 3) → "
                 "no chunk holds it whole → recall@3 = 0. overlap=50 → ceil(950/150)=7 chunks; window [300,500] holds "
                 "[380,470] whole → recall@3 = 1.0. Overlap costs storage, buys recall. Frontier (essay): Late Chunking "
                 "(arXiv:2409.04701) fixes the context-loss this exposes."),
        "_source": "_research/gen_l10.py (toy, stdlib): nChunks=ceil((L−o)/(size−o)); recallAt3 = 1 iff a window contains answerSpan.",
        "docLen": doc_len,
        "answerSpan": answer_span,
        "scenarios": scenarios,
        "formula": "ceil((L-o)/(size-o))",
        "sweep": sweep,
        "sweepDoc": ("4-config sweep at FIXED size=200, INCREASING overlap = 0 / 50 / 100 / 150, over the same "
                     "[380,470] gold span (computed, not authored). recall@3 climbs 0 → 1 → 1 → 1, monotone: "
                     "overlap=0 → step 200, windows [200,400] & [400,600] STRADDLE boundary 400 → no chunk holds "
                     "[380,470] whole → recall 0; overlap=50 → step 150, window [300,500] holds it → recall 1; "
                     "overlap=100 (step 100) and overlap=150 (step 50) keep that [300,500]-style window → recall 1. "
                     "Lesson (same as climb-chunking-worked): OVERLAP rescues the boundary straddle — more overlap "
                     "never hurts containment (it costs storage / more chunks: 5 → 7 → 9 → 17)."),
    }
    write_json(DATA / "l10-chunking.json", chunking)

    # ═══════════════════════ NEW · Chunking strategies (descriptive, no arithmetic) — l10-chunkstrat.json ═══════════════════════
    chunkstrat = {
        "_doc": ("Four chunking STRATEGIES (descriptive — no computed numbers; cost/quality marked 'representative'). "
                 "fixed = simplest, ignores structure; recursive = respects separators (¶/sentence); semantic = cuts on "
                 "embedding-similarity drops; late-chunking = embed the whole doc first, chunk AFTER the transformer "
                 "(arXiv:2409.04701) so each chunk keeps full-document context. Read with the exact `scenarios`/`sweep` "
                 "blocks (those carry the arithmetic); this block is the qualitative map of the design space."),
        "_source": "_research/gen_l10.py (static, descriptive): no arithmetic; late-chunking cites arXiv:2409.04701.",
        "strategies": [
            {"name": "fixed-size", "howItCuts": "every N tokens, hard boundaries (optionally with overlap)",
             "cost": "cheapest", "whenToUse": "uniform text, fast baseline; pair with overlap to soften boundaries",
             "representative": True},
            {"name": "recursive", "howItCuts": "split on a separator hierarchy (¶ → sentence → word) until each piece fits N",
             "cost": "cheap", "whenToUse": "structured prose / markdown / code where natural boundaries matter",
             "representative": True},
            {"name": "semantic", "howItCuts": "embed sentences, start a new chunk where adjacent-sentence similarity drops",
             "cost": "moderate (one embed pass over sentences)", "whenToUse": "topic-shifting docs where fixed cuts split ideas",
             "representative": True},
            {"name": "late-chunking", "howItCuts": "embed ALL tokens of the long doc first (one long-context pass), then chunk AFTER the transformer, before mean-pooling",
             "cost": "needs a long-context encoder; training-free", "whenToUse": "when chunk embeddings must keep full-document context (fixes isolated-chunk context loss)",
             "representative": True,
             "source": "Günther, Mohr, Williams, Wang & Xiao (Jina AI), 'Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models', arXiv:2409.04701 (2024)"},
        ],
    }
    write_json(DATA / "l10-chunkstrat.json", chunkstrat)

    # ═══════════════════════ NEW · RAPTOR recursive-summary tree (descriptive) — l10-raptor.json ═══════════════════════
    raptor_levels = [{"n": 8}, {"n": 3}, {"n": 1}]
    raptor = {
        "_doc": ("RAPTOR — recursive abstractive tree (descriptive; the level counts are a toy illustration). Cluster + "
                 "summarize leaf chunks into higher nodes, recurse to a root: 8 leaf chunks → 3 mid summaries → 1 root, "
                 "depth 3. Retrieval can pull from ANY level (a high node answers a broad question; a leaf answers a "
                 "detail) — so a single index serves both zoomed-out and zoomed-in queries. Sarthi et al. 2024."),
        "_source": "_research/gen_l10.py (static, descriptive): tree shape is a toy illustration; cites arXiv:2401.18059.",
        "tree": {"levels": raptor_levels, "depth": len(raptor_levels)},
        "idea": "cluster + summarize chunks recursively; retrieve from any tree level (leaf=detail, root=overview)",
        "source": "Sarthi, Abdullah, Tuli, Khanna, Goldie & Manning, 'RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval', ICLR 2024 (arXiv:2401.18059)",
    }
    write_json(DATA / "l10-raptor.json", raptor)

    # ═══════════════════════ NEW · Reciprocal Rank Fusion (RRF) — l10-fusion.json ═══════════════════════
    # Two paraphrase rankings (doc ids by rank, rank 1 = top). RRF(d) = Σ 1/(k+rank_d) over lists where d appears, k=60.
    # doc_cardiac_cycle is the consensus doc (high in BOTH lists) → wins the fused order. Scores recomputed (not authored).
    rrf_k = 60
    list_a = ["doc_circulatory", "doc_cardiac_cycle", "doc_anatomy", "doc_valves", "doc_pressure"]
    list_b = ["doc_cardiac_cycle", "doc_systole", "doc_circulatory", "doc_diastole", "doc_output"]
    rank_a = {d: i + 1 for i, d in enumerate(list_a)}
    rank_b = {d: i + 1 for i, d in enumerate(list_b)}
    all_docs = sorted(set(list_a) | set(list_b))
    fusion_scores = []
    for d in all_docs:
        s = 0.0
        appears = []
        if d in rank_a:
            s += 1.0 / (rrf_k + rank_a[d]); appears.append({"list": "A", "rank": rank_a[d]})
        if d in rank_b:
            s += 1.0 / (rrf_k + rank_b[d]); appears.append({"list": "B", "rank": rank_b[d]})
        fusion_scores.append({"id": d, "appearsIn": appears, "rrf": r(s)})
    fusion_scores.sort(key=lambda x: (-x["rrf"], x["id"]))
    fused_order = [x["id"] for x in fusion_scores]
    winner = fused_order[0]
    assert winner == "doc_cardiac_cycle", "consensus doc must win the fusion"
    fusion = {
        "_doc": ("Reciprocal Rank Fusion, exact (stdlib). Two paraphrase queries each return a ranked list; RRF(d) = "
                 "Σ 1/(k+rank_d) over the lists where d appears, k=60. The CONSENSUS doc (doc_cardiac_cycle: rank 2 in "
                 "A, rank 1 in B) accumulates from both lists and WINS the fused order — even though it tops neither "
                 "single list outright vs. a list-1 leader, agreement across paraphrases beats a single high rank. "
                 "Scores are recomputed from the committed ranks, never hand-picked."),
        "_source": "_research/gen_l10.py (toy, stdlib): rrf(d) = Σ 1/(k+rank) across lists; k=60.",
        "k": rrf_k,
        "formula": "rrf(d) = Σ_lists 1/(k + rank_d),  k=60",
        "rankings": {"A": list_a, "B": list_b},
        "scores": fusion_scores,
        "fusedOrder": fused_order,
        "winner": winner,
    }
    write_json(DATA / "l10-fusion.json", fusion)

    # ═══════════════════════ NEW · Query decomposition + step-back — l10-decomp.json ═══════════════════════
    # Multi-part question → 2 sub-questions. Binary answer-containment: each sub-answer lives in its own chunk
    # (recallSub=[1,1]) but NO single retrieved chunk contains BOTH facts (recallJoint=0) → decomposition wins.
    recall_sub = [1, 1]
    recall_joint = 0
    decomp = {
        "_doc": ("Query decomposition + step-back, exact-binary (stdlib). The multi-part question asks TWO things at "
                 "once; binary answer-containment shows why one retrieval fails: each sub-answer sits in its OWN chunk "
                 "(recallSub=[1,1]) but no single chunk contains BOTH facts (recallJoint=0) — so splitting into 2 "
                 "sub-questions and retrieving each separately recovers both. step-back: abstract a specific question "
                 "to a generic one, retrieve the underlying PRINCIPLE, then answer the specific (Zheng et al. 2023)."),
        "_source": "_research/gen_l10.py (toy, stdlib): binary answer-containment recall; step-back cites arXiv:2310.06117.",
        "question": "Does the heart pump faster during exercise, and what controls that rate?",
        "subQuestions": [
            "Does heart rate increase during exercise?",
            "What controls heart rate?",
        ],
        "recallSub": recall_sub,
        "recallJoint": recall_joint,
        "recallNote": "each sub-answer is contained in its own chunk (1,1); no single chunk contains both (joint=0) — decomposition recovers both facts.",
        "stepBack": {
            "specific": "Why did my heart rate hit 180 bpm running up the stairs?",
            "generic": "What physiological mechanism regulates heart rate under exertion?",
            "principleRetrieved": "The sympathetic nervous system raises heart rate during exertion (autonomic regulation of cardiac output).",
            "idea": "abstract the specific query to a generic one → retrieve the underlying principle → answer the specific",
            "source": "Zheng, Mishra, Chen, Cheng, Chi, Le & Zhou, 'Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models', arXiv:2310.06117 (2023)",
        },
    }
    write_json(DATA / "l10-decomp.json", decomp)

    # ═══════════════════════ NEW · Query routing + construction — l10-routing.json ═══════════════════════
    # Embed the query, cosine to 3 prompt-template centroids (frozen toy 3-dim vectors), route = argmax.
    # 3 dims [factual-lookup, how-to/procedure, comparison]. Sims recomputed (not authored).
    route_query = [2, 3, 1]                          # a "how-to" leaning query
    route_centroids = [
        ("factQA", [3, 1, 1]),
        ("howTo",  [1, 3, 1]),
        ("compare", [1, 1, 3]),
    ]
    route_sims = []
    for name, cvec in route_centroids:
        route_sims.append({"template": name, "centroid": cvec, "cos": r(cos(route_query, cvec))})
    route = max(route_sims, key=lambda x: x["cos"])["template"]
    assert route == "howTo", "routing argmax must be howTo"
    routing = {
        "_doc": ("Query routing + construction, exact (stdlib). Embed the query, take cosine to 3 prompt-template "
                 "centroids (factQA / howTo / compare), route = argmax. The toy query [2,3,1] leans how-to → cos "
                 "0.81 / 0.97 / 0.64 → route 'howTo'. Construction: turn the NL query into a STRUCTURED retrieval — a "
                 "metadata filter (self-query) or a SQL query (text-to-SQL) — descriptive examples below. Sims are "
                 "recomputed from frozen vectors, never hand-picked."),
        "_source": "_research/gen_l10.py (toy, stdlib): sims = cos(query, centroid); route = argmax.",
        "dims": ["factual-lookup", "how-to/procedure", "comparison"],
        "query": route_query,
        "centroids": route_sims,
        "sims": [row["cos"] for row in route_sims],
        "route": route,
        "construct": {
            "metadataFilter": {
                "nl": "papers on retrieval published after 2020",
                "filter": {"topic": "retrieval", "year": {"$gt": 2020}},
                "note": "self-query: NL → a metadata filter applied alongside vector search",
            },
            "textToSql": {
                "nl": "how many documents did we index last month?",
                "sql": "SELECT COUNT(*) FROM documents WHERE indexed_at >= date_trunc('month', now() - interval '1 month');",
                "note": "text-to-SQL: NL → an executable query over a structured store",
            },
        },
    }
    write_json(DATA / "l10-routing.json", routing)

    # ═══════════════════════ NEW · Re-ranking (bi-encoder → cross-encoder) — l10-rerank.json ═══════════════════════
    # Bi-encoder returns a top-5 list with the true doc buried at rank 4. A cross-encoder re-scores → ideal order.
    # nDCG / MRR before & after are RECOMPUTED from graded gains + ranks (not authored).
    rr_gains = {"d1": 0, "d2": 3, "d3": 0, "d4": 1, "d5": 0}      # graded relevance; d2 is the true doc
    rr_true = "d2"
    bi_order = ["d1", "d3", "d4", "d2", "d5"]                      # bi-encoder order (true doc rank 4)
    cross_order = ["d2", "d4", "d1", "d3", "d5"]                   # cross-encoder re-scored order (true doc rank 1)
    rank_before = bi_order.index(rr_true) + 1
    rank_after = cross_order.index(rr_true) + 1
    ndcg_before, ndcg_after = ndcg_at(bi_order, rr_gains), ndcg_at(cross_order, rr_gains)
    mrr_before, mrr_after = first_relevant_rr(bi_order, rr_gains), first_relevant_rr(cross_order, rr_gains)
    rerank = {
        "_doc": ("Re-ranking, exact (stdlib). A fast bi-encoder returns a top-5 with the true doc (graded gain 3) "
                 "buried at rank 4; a slow-but-accurate cross-encoder re-scores the SAME 5 and lifts it to rank 1. "
                 "nDCG@5 0.49 → 1.00, MRR 0.33 → 1.00, recomputed from graded gains + ranks (DCG=Σ gain/log2(rank+1), "
                 "nDCG=DCG/IDCG; MRR=1/rank of first relevant). The cross-encoder reorders the bi-encoder's shortlist — "
                 "you pay its cost on only k candidates, not the whole corpus."),
        "_source": "_research/gen_l10.py (toy, stdlib): nDCG=DCG/IDCG over gains+ranks; MRR=1/rank of first relevant.",
        "gains": rr_gains,
        "trueDocId": rr_true,
        "biEncoderOrder": bi_order,
        "crossEncoderOrder": cross_order,
        "rankBefore": rank_before,
        "rankAfter": rank_after,
        "ndcgBefore": r(ndcg_before),
        "ndcgAfter": r(ndcg_after),
        "mrrBefore": r(mrr_before),
        "mrrAfter": r(mrr_after),
    }
    write_json(DATA / "l10-rerank.json", rerank)

    # ═══════════════════════ NEW · Self-correction (CRAG + Self-RAG) — l10-selfrag.json ═══════════════════════
    # Descriptive + toy thresholds (no measured numbers). CRAG grades retrieval correct/ambiguous/wrong;
    # Self-RAG emits reflection tokens that GATE retrieve / relevance / support / usefulness.
    selfrag = {
        "_doc": ("Self-correcting RAG (descriptive + toy thresholds). CRAG (Yan et al. 2024) runs a lightweight "
                 "retrieval evaluator that grades each retrieval Correct / Ambiguous / Wrong (toy score thresholds "
                 "below) and acts: keep, augment with web search, or discard+rewrite. Self-RAG (Asai et al. ICLR 2024) "
                 "trains the LM to emit REFLECTION TOKENS — Retrieve, IsRel, IsSup, IsUse — that gate whether to "
                 "retrieve, and to critique relevance / support / usefulness. Thresholds are illustrative, not measured."),
        "_source": "_research/gen_l10.py (static, descriptive): toy thresholds; cites CRAG arXiv:2401.15884, Self-RAG arXiv:2310.11511.",
        "crag": {
            "grades": ["correct", "ambiguous", "wrong"],
            "thresholds": {"correct": ">= 0.7", "ambiguous": "0.3 .. 0.7", "wrong": "< 0.3"},
            "actions": {"correct": "use retrieved context as-is",
                        "ambiguous": "combine retrieved + corrective web search",
                        "wrong": "discard, fall back to web search / query rewrite"},
            "source": "Yan, Gu, Zhu & Ling, 'Corrective Retrieval Augmented Generation', arXiv:2401.15884 (2024)",
        },
        "selfRag": {
            "reflectionTokens": ["Retrieve", "IsRel", "IsSup", "IsUse"],
            "gates": {"Retrieve": "decide whether retrieval is needed for this segment",
                      "IsRel": "is the retrieved passage relevant?",
                      "IsSup": "is the generated claim supported by the passage?",
                      "IsUse": "is the overall response useful (1..5)?"},
            "source": "Asai, Wu, Wang, Sil & Hajishirzi, 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection', ICLR 2024 (arXiv:2310.11511)",
        },
    }
    write_json(DATA / "l10-selfrag.json", selfrag)

    # ═══════════════════════ Climb 3 · Query rewrite — HyDE / multi-query → recall lift ═══════════════════════
    true_doc = "doc_cardiac_cycle"
    K5 = 5

    def single_recall(rank):
        return 1 if rank <= K5 else 0

    orig_rank, hyde_rank = 8, 2
    orig_list = ["doc_blood_types", "doc_anatomy", "doc_exercise", "doc_diet", "doc_circulatory",
                 "doc_valves", "doc_pressure", true_doc, "doc_history", "doc_aneurysm"]
    hyde_list = ["doc_circulatory", true_doc, "doc_valves", "doc_anatomy", "doc_pressure",
                 "doc_exercise", "doc_diet", "doc_blood_types", "doc_history", "doc_aneurysm"]
    assert orig_list[orig_rank - 1] == true_doc and hyde_list[hyde_rank - 1] == true_doc, "rank/list mismatch"

    gold = ["gold_cycle", "gold_systole", "gold_ventricle", "gold_diastole", "gold_output"]
    found_single = ["gold_cycle", "gold_systole"]            # single query: 2/5
    found_union = ["gold_cycle", "gold_systole", "gold_ventricle", "gold_diastole"]  # union: 4/5

    rewrite = {
        "_doc": ("Query rewriting, exact (stdlib). A short, vocabulary-poor query finds the true doc at rank 8 → "
                 "recall@5 = 0, RR = 1/8 = 0.125. HyDE writes a hypothetical answer (rich with cardiac-cycle terms), "
                 "embeds THAT → true doc rises to rank 2 → recall@5 = 1, RR = 1/2 = 0.5 (single-true-doc BINARY recall). "
                 "Multi-query is a SEPARATE 5-relevant gold-set (NEVER blended with HyDE's recall): the single query "
                 "retrieves 2/5 → recall@5 = 0.4; the union of 3 paraphrases retrieves 4/5 → recall@5 = 0.8. Real = "
                 "cited/frozen HyDE lift on nfcorpus (gen_l10_real.py)."),
        "_source": "_research/gen_l10.py (toy, stdlib): RR=1/rank; single recall@5=(trueRank≤5); multi recall@5=|gold∩found|/5.",
        "query": "How does the heart pump blood?",
        "trueDocId": true_doc,
        "original": {"rankedList": orig_list, "trueRank": orig_rank,
                     "recallAt5": single_recall(orig_rank), "rr": r(1.0 / orig_rank)},     # 0, 0.125
        "hyde": {"hypotheticalDoc": "The cardiac cycle drives blood flow: during ventricular systole the ventricles "
                                    "contract, ejecting blood; during diastole they refill. Pressure gradients and "
                                    "one-way valves keep circulation moving.",
                 "rankedList": hyde_list, "trueRank": hyde_rank,
                 "recallAt5": single_recall(hyde_rank), "rr": r(1.0 / hyde_rank)},  # rank 2 → recall 1, RR 0.5
        "multiQuery": {
            "paraphrases": ["How does the heart pump blood?",
                            "What happens during the cardiac cycle?",
                            "Explain ventricular systole and diastole."],
            "goldRelevant": gold,
            "foundSingle": found_single,
            "foundUnion": found_union,
            "recallAt5Single": r(len(found_single) / len(gold)),   # 0.4
            "recallAt5Union": r(len(found_union) / len(gold)),     # 0.8
        },
    }
    write_json(DATA / "l10-rewrite.json", rewrite)

    # ═══════════════════════ CITED benchmarks (l10-bench.json) ═══════════════════════
    bench = {
        "_doc": ("CITED published references for L10 — NOT computed in this repo. Use verbatim with source. "
                 "RAG (Lewis et al.); HyDE — the source string carries the paper's REAL title, not just 'HyDE'; "
                 "Late Chunking frontier (Günther et al. — embed-then-chunk, training-free, fixes naive chunking's "
                 "context loss). The HyDE/multi-query LIFT magnitudes are dataset-dependent → 'representative'."),
        "_source": "_research/gen_l10.py (static, cited): RAG, HyDE, Late Chunking",
        "cited": True,
        "rag":  {"note": "Retrieval-Augmented Generation: parametric + non-parametric memory",
                 "source": "Lewis et al., NeurIPS 2020 (arXiv:2005.11401)"},
        "hyde": {"method": "HyDE — generate a hypothetical answer, embed it, retrieve", "representative": True,
                 "source": "Gao, Ma, Lin & Callan, 'Precise Zero-Shot Dense Retrieval without Relevance Labels', "
                           "ACL 2023 (arXiv:2212.10496)"},
        "lateChunking": {"method": "embed all long-doc tokens first, chunk AFTER the transformer (before mean-pooling)",
                         "trainingFree": True,
                         "source": "Günther, Mohr, Williams, Wang & Xiao (Jina AI), 'Late Chunking: Contextual Chunk "
                                   "Embeddings Using Long-Context Embedding Models', arXiv:2409.04701 (2024)"},
        "raptor": {"method": "recursive cluster+summarize tree; retrieve from any level (leaf=detail, root=overview)",
                   "source": "Sarthi, Abdullah, Tuli, Khanna, Goldie & Manning, 'RAPTOR: Recursive Abstractive "
                             "Processing for Tree-Organized Retrieval', ICLR 2024 (arXiv:2401.18059)"},
        "stepBack": {"method": "abstract a specific question to a generic one, retrieve the principle, then answer",
                     "source": "Zheng, Mishra, Chen, Cheng, Chi, Le & Zhou, 'Take a Step Back: Evoking Reasoning via "
                               "Abstraction in Large Language Models', arXiv:2310.06117 (2023)"},
        "crag": {"method": "lightweight retrieval evaluator grades correct/ambiguous/wrong → keep / web-augment / discard",
                 "source": "Yan, Gu, Zhu & Ling, 'Corrective Retrieval Augmented Generation', "
                           "arXiv:2401.15884 (2024)"},
        "selfRag": {"method": "LM emits reflection tokens (Retrieve/IsRel/IsSup/IsUse) to gate retrieval + self-critique",
                    "source": "Asai, Wu, Wang, Sil & Hajishirzi, 'Self-RAG: Learning to Retrieve, Generate, and "
                              "Critique through Self-Reflection', ICLR 2024 (arXiv:2310.11511)"},
        "adaptiveRag": {"method": "a query-complexity classifier routes between no-retrieval / single-step / multi-step RAG",
                        "representative": True,
                        "source": "Jeong, Baek, Cho, Hwang & Park, 'Adaptive-RAG: Learning to Adapt Retrieval-Augmented "
                                  "Large Language Models through Question Complexity', NAACL 2024 (arXiv:2403.14403)"},
    }
    write_json(DATA / "l10-bench.json", bench)

    print(f"[gen_l10] rag      k={k} stuffed={stuffed} prompt={prompt_total} headroom={headroom} kMax={k_max}")
    print(f"[gen_l10] retMath  cos {[row['cos'] for row in rm_rows]} (reproduces trace 0.82/0.79/0.71)")
    print(f"[gen_l10] budget   kMax/window {[(w['ctx'], w['kMax']) for w in budget_windows]}")
    print(f"[gen_l10] chunking {[(s['size'], s['overlap'], s['nChunks'], s['answerChunk'], s['recallAt3']) for s in scenarios]}")
    print(f"[gen_l10] sweep    {[(s['size'], s['overlap'], s['nChunks'], s['recallAt3']) for s in sweep]}")
    print(f"[gen_l10] rewrite  orig rank{orig_rank} RR={rewrite['original']['rr']} → hyde rank{hyde_rank} RR={rewrite['hyde']['rr']}; multiQ {rewrite['multiQuery']['recallAt5Single']}→{rewrite['multiQuery']['recallAt5Union']}")
    print(f"[gen_l10] fusion   k={rrf_k} winner={winner} scores {[(x['id'], x['rrf']) for x in fusion_scores[:3]]}")
    print(f"[gen_l10] routing  sims {[(row['template'], row['cos']) for row in route_sims]} → route={route}")
    print(f"[gen_l10] rerank   rank {rank_before}→{rank_after}; nDCG {rerank['ndcgBefore']}→{rerank['ndcgAfter']}; MRR {rerank['mrrBefore']}→{rerank['mrrAfter']}")
    print(f"[gen_l10] decomp   recallSub={recall_sub} recallJoint={recall_joint}")
    print("[gen_l10] wrote l10-rag(+retrievalMath) + l10-chunking(+sweep) + l10-rewrite + l10-bench(+5 cites)")
    print("[gen_l10]   + NEW l10-budget/chunkstrat/raptor/fusion/decomp/routing/rerank/selfrag (toy/cited; heavy 'real' keys preserved)")


if __name__ == "__main__":
    main()
