#!/usr/bin/env python3
"""gen_l16.py — the L16 "Late Chunking" data generator (contextual chunk embeddings for long docs).

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l16-chunk.json  — MEASURED on a tiny CONSTRUCTED corpus (pure stdlib → byte-identical under
      any CPython; no numpy/ABI dependency, so reproduce.sh holds regardless of the 3.9 toolchain).
  • data/l16-bench.json  — REPORTED published numbers (Günther et al. 2024, arXiv:2409.04701) — the
      Berlin coreference example, the ACME contextual-retrieval example, and the BeIR nDCG@10 table —
      NOT computed here; each row carries its citation so the deck can label provenance "reported by
      <cite>" vs "measured on our toy."

WHAT THE TOY DEMONSTRATES (the coreference gap the lecture is built on):
  Naive chunking = chunk-then-embed: each chunk is embedded ALONE, so a chunk whose subject is a
  pronoun/definite-description ("It highlighted a 3% growth", "the city") has lost its referent — the
  entity was in a DIFFERENT chunk. The relevant answer-chunk then ranks BELOW a generic DISTRACTOR
  chunk that merely repeats the query words ("…strong revenue growth…", about the industry, not about
  ACME). Late chunking = embed the WHOLE document first (full-document self-attention resolves the
  coreference into every token), THEN pool per chunk — so the answer-chunk "inherits" the entity and
  ranks first. The toy reproduces the ORDERING INVERSION (naive: distractor > answer; late: answer >
  distractor), NOT the paper's exact cosines. The header chunk is a THIRD, weaker rival (0.2887) and
  is never the one that buries the answer — an earlier version of this docstring said it was, and the
  deck slides (24/25) always said "distractor". Cosine = set-overlap over a small concept vocabulary
  (|A n B| / sqrt(|A| |B|)) — deterministic, deck-displayable, gate-able.

THREE PURE-ARITHMETIC BLOCKS FEED THE THREE L16 WIDGETS (all stdlib, all re-derivable):
  • pool     → widgets/late-pool-lab   — the 4-token toy where only the ORDER of {cut, attend} moves,
                                          and the chunk vector turns from (0,2) to (2,2): cos 0 → 1/√2.
  • gapLaw   → widgets/chunk-size-law  — orphaned fraction = min(1, g/s) for g = 40 tokens.
  • longLate → widgets/long-late-window— stride = l_max − ω, macro-chunk count, the ω-per-seam bill.

Run: python3 _research/gen_l16.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

# ── The constructed 5-chunk ACME-style corpus, as concept bags (the coreference gap is by design) ─────
# Query asks about the entity's revenue growth. The ANSWER lives in the chunk that says "It highlighted a
# 3% revenue growth" — but that chunk names the entity only as "it". A HEADER chunk repeats the entity word
# but carries no growth fact. Naive embeds each chunk alone (answer loses "acme"); late lets full-document
# attention bind "it" -> "acme" into the answer chunk BEFORE pooling.
QUERY = ["acme", "revenue", "growth"]
ENTITY = "acme"

# chunk -> (own concept bag [naive], set of coref tokens the FULL-DOC context resolves to the entity).
# The GOLD answer-chunk names the entity only as "it", so naively it is OUT-RANKED by a generic distractor
# that literally repeats "revenue growth" (an industry-forecast chunk that is NOT about acme). Late chunking
# binds "it" -> "acme" into the gold chunk, lifting it above the distractor: the ordering INVERTS.
CHUNKS = {
    "c1_header":     (["acme", "sec", "filing", "performance"],          []),        # names acme; no growth fact
    "c2_answer":     (["it", "threepct", "revenue", "growth", "quarter"], ["it"]),   # THE ANSWER; subject = "it"
    "c3_distractor": (["revenue", "growth", "industry", "forecast"],     []),        # generic; repeats query words, NOT acme
    "c4_prior":      (["the_company", "prior", "quarter", "sales"],      ["the_company"]),  # supports; "the company"
    "c5_outlook":    (["report", "resilience", "future", "prospects"],   []),        # off-topic tail
}
GOLD = "c2_answer"


def cos(a, b):
    """Set-overlap cosine over concept bags: |A n B| / sqrt(|A| |B|). Exact, deterministic."""
    A, B = set(a), set(b)
    if not A or not B:
        return 0.0
    return len(A & B) / math.sqrt(len(A) * len(B))


def rank_of(scores, doc):
    """1-based rank of doc when scores sorted desc (stable by insertion order on ties)."""
    order = sorted(scores, key=lambda k: -scores[k])
    return order.index(doc) + 1


def r4(x):
    """Round-half-UP to 4 places (NOT Python's round(), which is half-to-even: round(0.15625,4)
    would give 0.1562 and silently disagree with the hand-worked table on the slide)."""
    return math.floor(x * 10000 + 0.5) / 10000


# ── W1 · late-pool-lab: the smallest object on which "when you pool" changes the answer ──────────────
# Document = [Berlin, is, Its, residents]; the chunk boundary falls after token 2, so chunk B = {Its,
# residents}. Axes are ("Berlin-ness", "population"); v(Berlin) = (4,0), v(residents) = (0,4), the two
# function words carry nothing. ONE rule, applied twice: a token's contextual vector ϑ is the average
# of the value vectors of the tokens it may READ.
#   naive — chunk B is encoded ALONE → each of its tokens reads {Its, residents} → ϑ = (0,2);
#   late  — the whole document is encoded → each token reads all four → ϑ = (1,1).
# Mean-pool the SAME segment either way and the chunk vector goes (0,2) → (1,1): cos to q = (1,0) goes
# 0 → 1/√2 = 0.7071. Same model, same boundary, same number of vectors — only the ORDER moved. Note
# the vector also gets SHORTER (2 → √2): reading more spreads the average thinner. That is the same
# dilution that makes late chunking LOSE on Needle-in-a-Haystack — the failure mode is in the toy.
POOL_TOKENS = ["Berlin", "is", "Its", "residents"]
POOL_VALUES = [[4, 0], [0, 0], [0, 0], [0, 4]]
POOL_BOUNDARY = 2           # chunk A = tokens [0,2), chunk B = tokens [2,4)
POOL_QUERY = [1, 0]

# ── W2 · chunk-size-law: how often a chunk of size s is severed from a referent g tokens back ────────
GAP_TOKENS = 40
GAP_SIZES = [32, 64, 128, 256, 512]

# ── W3 · long-late-window: the macro-chunk ledger of Algorithm 2 ─────────────────────────────────────
# NOTE l_max and ω are OUR example values, not the paper's: §4.3 publishes no hyper-parameters and the
# repository ships TWO different defaults (ω = 256 in run_chunked_eval.py, ω = 512 in mteb_chunked_eval.py).
LONG_DOC_TOKENS = 20000
LONG_L_MAX = 8192
LONG_OMEGA = 512


def vadd(a, b):
    return [a[0] + b[0], a[1] + b[1]]


def vscale(a, k):
    return [a[0] * k, a[1] * k]


def cos2(a, b):
    na, nb = math.hypot(*a), math.hypot(*b)
    if na == 0 or nb == 0:
        return 0.0
    return (a[0] * b[0] + a[1] * b[1]) / (na * nb)


def pool_block():
    """W1 — recomputed, never typed: the two chunk-B vectors and their cosines to the query."""
    b0, b1 = POOL_BOUNDARY, len(POOL_TOKENS)
    # what each token of chunk B may read, naive vs late (indices into POOL_VALUES)
    readable_naive = list(range(b0, b1))          # only its own chunk
    readable_late = list(range(0, b1))            # the whole document
    def theta(readable):
        acc = [0.0, 0.0]
        for i in readable:
            acc = vadd(acc, POOL_VALUES[i])
        return vscale(acc, 1.0 / len(readable))
    th_naive, th_late = theta(readable_naive), theta(readable_late)
    # mean-pool the segment: every token of chunk B carries the same ϑ, so the mean IS that ϑ
    naive_vec = [round(th_naive[0], 4), round(th_naive[1], 4)]
    late_vec = [round(th_late[0], 4), round(th_late[1], 4)]
    return {
        "_doc": "W1 (widgets/late-pool-lab). A 4-token document where ONLY the order of {cut, attend} "
                "moves. ONE rule applied twice: a token's vector is the average of the tokens it may "
                "read — naive reads its own chunk, late reads the whole document. Mean-pool the same "
                "segment either way: the chunk vector turns from (0,2) to (1,1) and cos(q,·) goes "
                "0 -> 1/sqrt(2) = 0.7071. It also gets shorter (2 -> sqrt(2)): reading more spreads "
                "the average thinner — the same dilution that sinks late chunking on Needle tasks.",
        "tokens": POOL_TOKENS,
        "values": POOL_VALUES,
        "boundary": POOL_BOUNDARY,
        "query": POOL_QUERY,
        "naiveTheta": naive_vec,
        "lateTheta": late_vec,
        "naiveChunkVec": naive_vec,
        "lateChunkVec": late_vec,
        "naiveCos": round(cos2(naive_vec, POOL_QUERY), 4),
        "lateCos": round(cos2(late_vec, POOL_QUERY), 4),
    }


def gap_law_block(beir):
    """W2 — the orphaned fraction min(1, g/s), plus the three published Δ anchors it must ORDER."""
    return {
        "_doc": "W2 (widgets/chunk-size-law). DERIVED, not measured: with a referent g tokens behind a "
                "mention and a chunk grid of size s at a uniform offset, the chunk holds its own "
                "referent with probability max(0, 1 - g/s), so the orphaned fraction is min(1, g/s). "
                "The `anchors` are the REPORTED BeIR deltas (Table 2 averages, Guenther et al. 2024) "
                "and exist to TEST the law: the law says smaller chunks -> bigger delta, and the three "
                "published strategies order exactly that way (sentence > fixed-256 > semantic). The "
                "SHAPE of Figure 3 agrees; its numeric values are not published, so they are not here.",
        "gapTokens": GAP_TOKENS,
        "sizes": GAP_SIZES,
        "orphanFraction": [r4(min(1.0, GAP_TOKENS / s)) for s in GAP_SIZES],
        "anchors": {
            "sentence": round(beir["sentenceLateAvg"] - beir["sentenceNaiveAvg"], 1),
            "fixed256": round(beir["fixed256LateAvg"] - beir["fixed256NaiveAvg"], 1),
            "semantic": round(beir["semanticLateAvg"] - beir["semanticNaiveAvg"], 1),
        },
    }


def long_late_block():
    """W3 — Algorithm 2's ledger, recomputed from (docTokens, l_max, omega)."""
    stride = LONG_L_MAX - LONG_OMEGA
    n = max(1, math.ceil((LONG_DOC_TOKENS - LONG_OMEGA) / stride))
    starts = [i * stride for i in range(n)]
    encoded = sum(min(LONG_L_MAX, LONG_DOC_TOKENS - s) for s in starts)
    return {
        "_doc": "W3 (widgets/long-late-window). Algorithm 2: cut the document into macro-chunks of "
                "l_max tokens overlapping by omega, encode each, and DISCARD the embeddings of the "
                "overlapping tokens (line 14) so every token lands in exactly one chunk. l_max and "
                "omega are OUR example values: the paper publishes no hyper-parameters and the "
                "repository ships two different defaults (omega = 256 and omega = 512).",
        "docTokens": LONG_DOC_TOKENS,
        "lMax": LONG_L_MAX,
        "omega": LONG_OMEGA,
        "stride": stride,
        "macroChunks": n,
        "starts": starts,
        "tokensEncoded": encoded,
        "overheadTokens": encoded - LONG_DOC_TOKENS,
        "overheadPct": r4(100.0 * (encoded - LONG_DOC_TOKENS) / LONG_DOC_TOKENS),
    }


def measure(bench_data=None):
    naive, late = {}, {}
    for cid, (bag, coref) in CHUNKS.items():
        naive[cid] = round(cos(bag, QUERY), 4)
        # late chunking: full-document attention rewrites each coref token toward the entity, so the
        # chunk's pooled bag GAINS the entity token it referred to. (Modelled as bag + {entity} iff the
        # chunk contains a coref mention — the "read the whole book first" effect.)
        late_bag = list(bag) + ([ENTITY] if coref else [])
        late[cid] = round(cos(late_bag, QUERY), 4)
    naive_rank = rank_of(naive, GOLD)
    late_rank = rank_of(late, GOLD)
    bench_data = bench_data or bench()
    return {
        "_doc": "MEASURED on a constructed coreference corpus (stdlib set-overlap cosine). Reproduces the "
                "ORDERING INVERSION — naively a GENERIC DISTRACTOR that merely repeats the query words "
                "outranks the answer chunk (0.5774 > 0.5164); late chunking binds 'it' -> 'acme' into the "
                "answer chunk and it takes rank 1 (0.7071). The header chunk is a weaker third rival "
                "(0.2887) and never buries the answer. Not the paper's magnitudes. Blocks `pool`, "
                "`gapLaw` and `longLate` are pure arithmetic feeding the three L16 widgets. "
                "Generator: _research/gen_l16.py.",
        "query": QUERY,
        "entity": ENTITY,
        "goldChunk": GOLD,
        "chunks": {cid: {"naive": naive[cid], "late": late[cid],
                         "coref": bool(CHUNKS[cid][1])} for cid in CHUNKS},
        "goldRankNaive": naive_rank,   # 2 — buried below the DISTRACTOR
        "goldRankLate": late_rank,     # 1 — surfaced
        "goldNaive": naive[GOLD],
        "goldLate": late[GOLD],
        "distractorNaive": naive["c3_distractor"],   # 0.5774 — the chunk that actually buries the answer
        "distractorLate": late["c3_distractor"],     # 0.5774 — unchanged: it has no coreference to resolve
        "headerNaive": naive["c1_header"],
        "headerLate": late["c1_header"],
        "inversion": bool(naive_rank > late_rank),
        "pool": pool_block(),
        "gapLaw": gap_law_block(bench_data["beir"]),
        "longLate": long_late_block(),
    }


def bench():
    """REPORTED numbers — Günther, Mohr, Williams, Wang & Xiao (2024), arXiv:2409.04701. Not computed here."""
    return {
        "_doc": "REPORTED published numbers — transcribed from Günther et al. 2024 (Late Chunking, "
                "arXiv:2409.04701). Provenance: 'reported by Jina AI', NOT measured on our toy.",
        "_source": "arXiv:2409.04701 (Günther, Mohr, Williams, Wang & Xiao, 2024)",
        "cite": "Günther et al. 2024",
        "berlin": {
            "_doc": "Fig.1/Table1 — Wikipedia 'Berlin', model jina-embeddings-v2-small, query='Berlin'. "
                    "Cosine of each sentence-chunk to the query, naive vs late.",
            "query": "Berlin",
            "rows": [
                {"chunk": "Berlin is the capital and largest city of Germany...", "naive": 0.8486, "late": 0.8495, "coref": False},
                {"chunk": "Its more than 3.85 million inhabitants...",             "naive": 0.7084, "late": 0.8249, "coref": True},
                {"chunk": "The city is also one of the states of Germany...",      "naive": 0.7535, "late": 0.8498, "coref": True},
            ],
        },
        "acme": {
            "_doc": "Table4 — fictional ACME Corp doc, ALL FIVE chunks, query verbatim. Naive ranks the "
                    "relevant chunk BELOW the document header; late and Anthropic contextual both surface "
                    "it (and contextual edges late out, 0.8590 > 0.8516). n = 1, the document is invented, "
                    "and the authors are the authors of the method: an anecdote, not an evaluation.",
            "query": "What is ACME Corp's revenue growth for Q2 2023?",
            "encoder": "jina-embeddings-v2-small-en",
            "contextGenerator": "claude-3-haiku-20240307",
            "goldRow": 2,
            "rows": [
                {"n": 1, "role": "header",     "naive": 0.8505, "late": 0.8305, "contextual": 0.8069},
                {"n": 2, "role": "gold",       "naive": 0.6343, "late": 0.8516, "contextual": 0.8590},
                {"n": 3, "role": "supporting", "naive": 0.6169, "late": 0.8424, "contextual": 0.8546},
                {"n": 4, "role": "outlook",    "naive": 0.5191, "late": 0.7997, "contextual": 0.8234},
                {"n": 5, "role": "boilerplate","naive": 0.6007, "late": 0.8022, "contextual": 0.8061},
            ],
            "relevantNaive": 0.6343, "relevantLate": 0.8516, "relevantContextual": 0.8590,
            "headerNaive": 0.8505, "headerLate": 0.8305,
        },
        "beir": {
            "_doc": "Table2 — BeIR nDCG@10 [%], averaged over 3 long-context models (jina-v2-small, jina-v3, "
                    "nomic-v1) x 4 datasets (SciFact, NFCorpus, FiQA, TRECCOVID). Naive vs late. `record` "
                    "is the win/tie/loss count over all 36 cells of the table; `lossCell` is the SINGLE "
                    "cell late loses. NOTE the paper's own prose (§4.1) rounds a lift to '1.5% absolute'; "
                    "the 12 SEMANTIC-chunking cells recompute to 52.417 -> 53.825 = +1.41 (the fixed-size "
                    "row is a different pair, 52.2 -> 54.0 = +1.8). Read the table, not the abstract.",
            "sentenceNaiveAvg": 52.4, "sentenceLateAvg": 54.3,
            "fixed256NaiveAvg": 52.2, "fixed256LateAvg": 54.0,
            "semanticNaiveAvg": 52.4, "semanticLateAvg": 53.8,
            "nfcorpusJ2sNaive": 23.5, "nfcorpusJ2sLate": 30.0,   # largest single-cell win
            "record": {"wins": 33, "ties": 2, "losses": 1, "cells": 36},
            "lossCell": {"model": "nomic-embed-text-v1", "dataset": "SciFact", "strategy": "fixed-256",
                         "naive": 70.7, "late": 70.6},
            # the paper's own §4.1 prose vs its own Table 2, recomputed over the 12 SEMANTIC cells
            # (52.417 -> 53.825 rounds to the published 52.4 -> 53.8 semantic row, not to fixed-256)
            "semanticRecomputedNaive": 52.417, "semanticRecomputedLate": 53.825,
            "semanticRecomputedDelta": 1.41,
            "paperRoundedAbsPct": 1.5,
            "tieCells": [
                {"model": "nomic-embed-text-v1", "dataset": "NFCorpus", "strategy": "fixed-256",
                 "naive": 35.3, "late": 35.3},
                {"model": "nomic-embed-text-v1", "dataset": "NFCorpus", "strategy": "semantic",
                 "naive": 35.3, "late": 35.3},
            ],
        },
        "spanPooling": {
            "_doc": "§3.2 + Table3 — the paper ALSO proposes TRAINING for late chunking (span pooling): "
                    "triples (query, document, <start,end>) with the SAME InfoNCE loss as L13. The lift "
                    "over mean pooling after training is small and not uniform: best +0.82 nDCG "
                    "(jina-v3 / FiQA), and THREE regressions: -0.28, -0.09, -0.02. The batch/step numbers are "
                    "jina-v3's hyper-parameters, not both models'. Training-free is true; the ceiling is a "
                    "little higher than training-free.",
            "datasets": ["FEVER", "TriviaQA"],
            "pairsThousands": 470, "batchSize": 512, "steps": 500,
            "loss": "InfoNCE",
            "bestGain": 0.82,
            # Table 3 carries THREE cells where span pooling is WORSE than mean pooling, not one.
            # The deck used to print only the mildest (−0.02), which reads as "essentially never worse".
            "regressions": [-0.28, -0.09, -0.02], "bestCell": "jina-embeddings-v3 / FiQA", "worstGain": -0.02,
        },
        "overlap": {
            "_doc": "Table6 (Appendix A.2, v3 only) — 16-token overlap on 256-token chunks, jina-v2-small. "
                    "The paper's verdict is 'no clear advantage', for BOTH methods. Read column by column: "
                    "the NAIVE pipeline is helped 3 datasets out of 4, the LATE pipeline is a coin flip "
                    "(1 of 4). NOTE the paper's §4.1 says 'in all experiments the chunks are "
                    "non-overlapping', yet the fixed-size row of Table 2 equals the 'w/ Overlap' column "
                    "here — an internal contradiction of the published text.",
            "overlapTokens": 16, "chunkTokens": 256,
            "rows": [
                {"dataset": "SciFact",   "naiveWith": 64.2, "naiveWithout": 61.7, "lateWith": 66.1, "lateWithout": 65.9},
                {"dataset": "NFCorpus",  "naiveWith": 23.5, "naiveWithout": 22.8, "lateWith": 30.0, "lateWithout": 30.5},
                {"dataset": "FiQA",      "naiveWith": 33.3, "naiveWithout": 32.8, "lateWith": 33.8, "lateWithout": 34.0},
                {"dataset": "TRECCOVID", "naiveWith": 63.4, "naiveWithout": 64.5, "lateWith": 64.7, "lateWithout": 64.9},
            ],
        },
        "noChunking": {
            "_doc": "The 'No Chunking' column — present in v1 and in the repository README, dropped from "
                    "v2/v3. Two lessons: on Quora (documents of ~62 characters) naive = late = no-chunking "
                    "to the digit, because there is nothing to restore; and on 2 of 5 datasets NOT "
                    "chunking at all beats late chunking.",
            "rows": [
                {"dataset": "Quora",     "naive": 87.19, "late": 87.19, "none": 87.19},
                {"dataset": "TRECCOVID", "late": 64.70, "none": 65.18},
                {"dataset": "NFCorpus",  "late": 29.98, "none": 30.40},
            ],
        },
        "replication": {
            "_doc": "INDEPENDENT replication — Merola & Singh, 'Reconstructing Context', arXiv:2504.19754 "
                    "(KEIR @ ECIR 2025, code MIT). NDCG@5. Not a confirmation: on BGE-M3/NFCorpus late "
                    "chunking does not merely fail to help, it collapses; on MS MARCO passages early "
                    "pooling wins outright; and head-to-head against Contextual Retrieval late chunking "
                    "loses on all six reported metrics. Authors' conclusion, verbatim: 'Late Chunking does "
                    "not consistently outperform the Early approach across all models and datasets.'",
            "cite": "Merola & Singh 2025",
            "_source": "arXiv:2504.19754",
            "collapse":   {"model": "BGE-M3",    "dataset": "NFCorpus", "early": 0.246, "late": 0.070},
            "passages":   {"model": "Stella-V5", "dataset": "MS MARCO", "early": 0.630, "late": 0.503},
            "headToHead": {"model": "Jina-V3",   "dataset": "NFCorpus", "late": 0.309, "contextual": 0.317},
        },
        "colbert": {
            "_doc": "ColBERTv2 §5.3 (Santhanam et al., arXiv:2112.01488), MS MARCO ~8.8 M passages — the "
                    "numbers that retire the folklore 'a ColBERT index is a hundred times bigger'. With "
                    "2-bit residuals ColBERTv2 sits at PARITY with an ordinary 768-d fp32 single-vector "
                    "index. The real mirror between the two 'lates' is not storage, it is the QUERY: "
                    "MaxSim is paid by every query, pooling is paid once at index time.",
            "cite": "Santhanam et al. 2022 (ColBERTv2)",
            "_source": "arXiv:2112.01488",
            "passagesMillions": 8.8,
            "v1GiB": 154, "v2TwoBitGiB": 25, "v2OneBitGiB": 16, "singleVectorGiB": 25,
            "maxsimMsLow": 50, "maxsimMsHigh": 250,
        },
        "anthropic": {
            "_doc": "Anthropic, 'Introducing Contextual Retrieval' (+ the cookbook). The comparison "
                    "baseline of Table 4 — and a UNITS warning: Anthropic reports a RELATIVE reduction of "
                    "the top-20 failure rate on its own internal mixture, Jina reports ABSOLUTE nDCG@10 on "
                    "BeIR. The two numbers are not comparable. The prepended context also grows each chunk "
                    "by ~100 tokens, which silently TRUNCATES it on models with a hard input limit.",
            "cite": "Anthropic 2024",
            "model": "claude-3-haiku-20240307",
            "usdPerMillionDocTokens": 1.02,
            "failureDropPct": [35, 49, 67],
            "chunkGrowthTokens": 100,
            "inlineWholeCorpusBelowTokens": 200000,
        },
        "context": {
            "_doc": "Method/context facts. contextWindow = jina-v2 max tokens; chunkHelpsRelGain = avg "
                    "relative nDCG gain from CHUNKING a long doc at all vs one long vector (Table5, "
                    "512-tok chunks) — it is NOT the gain of late chunking, however often the web says so.",
            "contextWindowTokens": 8192,
            "chunkHelpsRelGainPct": 24.47,
            "overlapTokens": 16,          # Table6 — overlap barely matters once you chunk late
        },
    }


if __name__ == "__main__":
    b = bench()
    m = measure(b)
    (DATA / "l16-chunk.json").write_text(json.dumps(m, indent=2, ensure_ascii=False) + "\n")
    (DATA / "l16-bench.json").write_text(json.dumps(b, indent=2, ensure_ascii=False) + "\n")
    print(f"[gen_l16] wrote data/l16-chunk.json (gold rank naive={m['goldRankNaive']} -> late={m['goldRankLate']}, "
          f"gold cos {m['goldNaive']} -> {m['goldLate']}, distractor {m['distractorNaive']} -> {m['distractorLate']}; "
          f"pool cos {m['pool']['naiveCos']} -> {m['pool']['lateCos']}; gapLaw {m['gapLaw']['orphanFraction']}; "
          f"longLate stride {m['longLate']['stride']} x {m['longLate']['macroChunks']} macro-chunks, "
          f"+{m['longLate']['overheadTokens']} tokens) + data/l16-bench.json")
