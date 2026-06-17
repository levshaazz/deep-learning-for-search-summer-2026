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

Output: data/l10-rag.json, data/l10-chunking.json, data/l10-rewrite.json, data/l10-bench.json
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
    write_json(rag_p, rag)

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
    }
    write_json(DATA / "l10-chunking.json", chunking)

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
    }
    write_json(DATA / "l10-bench.json", bench)

    print(f"[gen_l10] rag      k={k} stuffed={stuffed} prompt={prompt_total} headroom={headroom} kMax={k_max}")
    print(f"[gen_l10] chunking {[(s['size'], s['overlap'], s['nChunks'], s['answerChunk'], s['recallAt3']) for s in scenarios]}")
    print(f"[gen_l10] rewrite  orig rank{orig_rank} RR={rewrite['original']['rr']} → hyde rank{hyde_rank} RR={rewrite['hyde']['rr']}; multiQ {rewrite['multiQuery']['recallAt5Single']}→{rewrite['multiQuery']['recallAt5Union']}")
    print("[gen_l10] wrote l10-rag + l10-chunking + l10-rewrite + l10-bench (toy/cited; heavy 'real' keys preserved)")


if __name__ == "__main__":
    main()
