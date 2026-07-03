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
  entity was in a DIFFERENT chunk. The relevant answer-chunk then ranks BELOW an off-topic header chunk
  that merely repeats the query word. Late chunking = embed the WHOLE document first (full-document
  self-attention resolves the coreference into every token), THEN pool per chunk — so the answer-chunk
  "inherits" the entity and ranks first. The toy reproduces the ORDERING INVERSION (naive: header > answer;
  late: answer > header), NOT the paper's exact cosines. Cosine = set-overlap over a small concept
  vocabulary (|A n B| / sqrt(|A| |B|)) — deterministic, deck-displayable, gate-able.

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


def measure():
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
    return {
        "_doc": "MEASURED on a constructed coreference corpus (stdlib set-overlap cosine). Reproduces the "
                "ORDERING INVERSION (naive ranks the header chunk above the answer; late ranks the answer "
                "first), not the paper's magnitudes. Generator: _research/gen_l16.py.",
        "query": QUERY,
        "entity": ENTITY,
        "goldChunk": GOLD,
        "chunks": {cid: {"naive": naive[cid], "late": late[cid],
                         "coref": bool(CHUNKS[cid][1])} for cid in CHUNKS},
        "goldRankNaive": naive_rank,   # 2 — buried below the header
        "goldRankLate": late_rank,     # 1 — surfaced
        "goldNaive": naive[GOLD],
        "goldLate": late[GOLD],
        "headerNaive": naive["c1_header"],
        "headerLate": late["c1_header"],
        "inversion": bool(naive_rank > late_rank),
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
            "_doc": "Table4 — fictional ACME Corp doc, query='ACME revenue growth for Q2 2023'. Naive ranks "
                    "the relevant chunk BELOW the header; late (and Anthropic contextual) surface it.",
            "relevantNaive": 0.6343, "relevantLate": 0.8516, "relevantContextual": 0.8590,
            "headerNaive": 0.8505, "headerLate": 0.8305,
        },
        "beir": {
            "_doc": "Table2 — BeIR nDCG@10 [%], averaged over 3 long-context models (jina-v2-small, jina-v3, "
                    "nomic-v1) x 4 datasets (SciFact, NFCorpus, FiQA, TRECCOVID). Naive vs late.",
            "sentenceNaiveAvg": 52.4, "sentenceLateAvg": 54.3,
            "fixed256NaiveAvg": 52.2, "fixed256LateAvg": 54.0,
            "semanticNaiveAvg": 52.4, "semanticLateAvg": 53.8,
            "nfcorpusJ2sNaive": 23.5, "nfcorpusJ2sLate": 30.0,   # largest single-cell win
        },
        "context": {
            "_doc": "Method/context facts. contextWindow = jina-v2 max tokens; chunkHelpsRelGain = avg "
                    "relative nDCG gain from chunking a long doc (Table5, 512-tok chunks).",
            "contextWindowTokens": 8192,
            "chunkHelpsRelGainPct": 24.47,
            "overlapTokens": 16,          # Table6 — overlap barely matters once you chunk late
        },
    }


if __name__ == "__main__":
    (DATA / "l16-chunk.json").write_text(json.dumps(measure(), indent=2, ensure_ascii=False) + "\n")
    (DATA / "l16-bench.json").write_text(json.dumps(bench(), indent=2, ensure_ascii=False) + "\n")
    m = measure()
    print(f"[gen_l16] wrote data/l16-chunk.json (gold rank naive={m['goldRankNaive']} -> late={m['goldRankLate']}, "
          f"gold cos {m['goldNaive']} -> {m['goldLate']}, header {m['headerNaive']} -> {m['headerLate']}) + data/l16-bench.json")
