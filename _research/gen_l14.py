#!/usr/bin/env python3
"""gen_l14.py — the L14 "The Artificer's Quill" data generator (query rewriting & decomposition).

Emits TWO structurally-distinct files (provenance must never blur):

  • data/l14-rewrite.json  — MEASURED on a tiny CONSTRUCTED corpus (pure stdlib → byte-identical under
      any CPython; no numpy/ABI dependency, so reproduce.sh holds regardless of the 3.9 toolchain).
  • data/l14-bench.json    — REPORTED published numbers (HyDE, Query2doc, Step-Back, Least-to-Most,
      RRF k=60, RM3/PRF, GAR, Self-Ask/DecomP, Doc2Query) — NOT computed here; each row carries its
      citation so the deck can label provenance "reported by <cite>" vs "measured on our toy."

WHAT THE TOY DEMONSTRATES (the three gaps the lecture is built on):
  • VOCABULARY gap — a colloquial query ("sour & watery espresso") shares surface words with a lexical
    TRAP ("sour candy"), so the raw query ranks the technical GOLD passage low; HyDE (embed a
    hypothetical ANSWER) closes the gap. RM3 (classical PRF) helps a little but hits a ceiling — it
    reinforces its own first pass and cannot invent the missing word "under-extraction."
  • SPECIFICITY gap — a hyper-specific query matches no principle passage lexically; step-back
    (abstract UP) retrieves the principle.
  • COMPOSITIONALITY gap — a compound query's facts live in different chunks; decomposition recovers
    them, but a wrong hop propagates (compose success = p^n).

The corpus is CONSTRUCTED to be vocabulary-mismatched (the honesty the deck carries, S57): it
reproduces the ORDERING (raw < RM3 < HyDE by rank; step-back lifts the principle; RRF consensus beats a
single hit), NOT MS-MARCO magnitudes. Cosine = set-overlap over a small concept vocabulary
(|A n B| / sqrt(|A| |B|)) — exact rationals, deck-displayable, gate-able.

Run: python3 _research/gen_l14.py   (stdlib only; reproduce.sh re-runs it byte-identically)
"""
import json
import math
import random
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
SEEDS = list(range(20))
RRF_K = 60
PER_HOP_P = 0.9          # design input: per-sub-question retrieval success (error-propagation demo)
HOPS = 3

# ── The constructed 6-passage espresso corpus, as concept bags (the vocabulary gap is by design) ────
# q shares surface words {sour, watery, taste} with the TRAP d4; the GOLD d1 speaks technical
# {under-extraction, channeling}. That mismatch is the Lexical Gremlin; the quill's job is to cross it.
QUERY = "why does my espresso taste sour and watery?"
CORPUS = {
    "d1": ["underextraction", "channeling", "sour", "weak", "shot"],          # GOLD (answers q; vocab != q)
    "d2": ["coarse", "grind", "espresso", "bitter", "taste", "extraction"],   # relevant-ish
    "d3": ["tamping", "wdt", "channeling", "espresso", "watery"],             # relevant-ish
    "d4": ["sour", "candy", "citric", "taste", "sweet"],                      # LEXICAL TRAP (wrong domain)
    "d5": ["extraction", "grind", "temperature", "pressure", "contacttime", "factors", "sourness"],  # PRINCIPLE
    "d6": ["longer", "shot", "contacttime", "extraction", "watery"],         # relevant-ish
}
GOLD, TRAP, PRINCIPLE = "d1", "d4", "d5"
Q_BAG = ["espresso", "sour", "watery", "taste"]
# HyDE: a hypothetical ANSWER — lives in DOCUMENT-space, shares the gold's technical register.
HYDE_TEXT = ("Sour, watery espresso is usually under-extraction: water channels through low-resistance "
             "paths in a coarse or unevenly-ground puck, so it never extracts, leaving a weak, sour shot.")
HYDE_BAG = ["sour", "watery", "espresso", "underextraction", "channeling", "coarse", "grind", "weak"]
# Step-back: a too-specific event query vs its abstracted generic form (retrieves the PRINCIPLE d5).
QSB_TEXT = "why did my 18g dose in a 58mm basket pull a 22-second sour shot?"
QSB_BAG = ["espresso", "dose18g", "basket58mm", "seconds22", "sour", "shot"]
QGEN_TEXT = "what governs espresso extraction and sourness?"
QGEN_BAG = ["espresso", "extraction", "sourness", "factors"]
# Decomposition: a compound query whose three facts live in different chunks (d2 / d6 / d5).
QDEC_TEXT = "is a finer grind or a longer shot better for reducing sourness, and which changes extraction more?"
SUBQUESTIONS = ["does a finer grind reduce sourness?", "does a longer shot reduce sourness?",
                "which changes extraction more, grind or shot length?"]
SUB_DOCS = ["d2", "d6", "d5"]


def cos(a, b):
    """Set-overlap cosine between two concept bags: |A n B| / sqrt(|A| |B|)."""
    A, B = set(a), set(b)
    if not A or not B:
        return 0.0
    return len(A & B) / math.sqrt(len(A) * len(B))


def rank_corpus(query_bag, corpus):
    """Rank all docs by cos(query, doc), desc; stable tie-break by doc id. Returns [(id, cos)]."""
    scored = [(did, cos(query_bag, bag)) for did, bag in corpus.items()]
    scored.sort(key=lambda kv: (-kv[1], kv[0]))     # desc score, then id asc (deterministic)
    return scored


def rank_of(ranked, doc_id):
    for i, (did, _) in enumerate(ranked, start=1):
        if did == doc_id:
            return i
    return len(ranked) + 1


def rm3_expand(query_bag, corpus, n_feedback=2):
    """Classical RM3/PRF: take the top-n pseudo-relevant docs from the FIRST pass and fold their terms
    back into the query. Ceiling by design: it reinforces its own first pass and can add only terms
    that ALREADY appear in the top docs — never the missing gold term 'under-extraction'."""
    first = rank_corpus(query_bag, corpus)
    feedback_ids = [did for did, _ in first[:n_feedback]]
    added = []
    for did in feedback_ids:
        for t in corpus[did]:
            if t not in query_bag and t not in added:
                added.append(t)
    return query_bag + added, feedback_ids, added


def rrf(rank_lists, k=RRF_K):
    """Reciprocal Rank Fusion (Cormack et al., SIGIR 2009): s(d) = sum_i 1/(k + r_i(d))."""
    scores = {}
    for ranks in rank_lists:
        for did, r in ranks.items():
            scores[did] = scores.get(did, 0.0) + 1.0 / (k + r)
    return scores


def jitter_corpus(corpus, rng, drop_p=0.25, add_p=0.25):
    """Per-seed robustness: drop/add one concept per doc to test that the ORDERING is not knife-edge."""
    vocab = sorted({t for bag in corpus.values() for t in bag})
    out = {}
    for did, bag in corpus.items():
        b = list(bag)
        if len(b) > 2 and rng.random() < drop_p:
            b.pop(rng.randrange(len(b)))
        if rng.random() < add_p:
            cand = rng.choice(vocab)
            if cand not in b:
                b.append(cand)
        out[did] = b
    return out


def technique_ranks(corpus):
    """Compute gold rank + RR for raw / rm3 / hyde on a (possibly jittered) corpus."""
    raw = rank_corpus(Q_BAG, corpus)
    rm3_bag, _, _ = rm3_expand(Q_BAG, corpus)
    rm3 = rank_corpus(rm3_bag, corpus)
    hyde = rank_corpus(HYDE_BAG, corpus)
    return {
        "raw": rank_of(raw, GOLD),
        "rm3": rank_of(rm3, GOLD),
        "hyde": rank_of(hyde, GOLD),
    }


def main():
    # ── canonical (un-jittered) computation — these are the deck's displayed / gated numbers ──────────
    raw_ranked = rank_corpus(Q_BAG, CORPUS)
    hyde_ranked = rank_corpus(HYDE_BAG, CORPUS)
    rm3_bag, rm3_feedback, rm3_added = rm3_expand(Q_BAG, CORPUS)
    rm3_ranked = rank_corpus(rm3_bag, CORPUS)

    raw_gold_rank = rank_of(raw_ranked, GOLD)
    hyde_gold_rank = rank_of(hyde_ranked, GOLD)
    rm3_gold_rank = rank_of(rm3_ranked, GOLD)

    def rr(r):
        return round(1.0 / r, 4)

    cos_q_gold = round(cos(Q_BAG, CORPUS[GOLD]), 4)
    cos_q_trap = round(cos(Q_BAG, CORPUS[TRAP]), 4)
    cos_h_gold = round(cos(HYDE_BAG, CORPUS[GOLD]), 4)
    cos_h_trap = round(cos(HYDE_BAG, CORPUS[TRAP]), 4)
    cos_rm3_gold = round(cos(rm3_bag, CORPUS[GOLD]), 4)

    # step-back: the specific query matches no principle passage; the generic one does.
    cos_qsb_prin = round(cos(QSB_BAG, CORPUS[PRINCIPLE]), 4)
    cos_qgen_prin = round(cos(QGEN_BAG, CORPUS[PRINCIPLE]), 4)
    qsb_prin_rank = rank_of(rank_corpus(QSB_BAG, CORPUS), PRINCIPLE)
    qgen_prin_rank = rank_of(rank_corpus(QGEN_BAG, CORPUS), PRINCIPLE)

    # multi-query + RRF: THREE paraphrase rankings. The gold's per-paraphrase ranks [3,1,2] are a
    # documented DESIGN-INPUT scenario (chosen to tell the "consensus beats a single hit" story, exactly
    # like L13's spine cosines); the RRF score is COMPUTED from them → the gate-able worked number.
    para_gold_ranks = [3, 1, 2]
    rank_lists = [{GOLD: r} for r in para_gold_ranks]
    rrf_gold = round(sum(1.0 / (RRF_K + r) for r in para_gold_ranks), 4)
    rrf_single_hit = round(1.0 / (RRF_K + 1), 4)                 # a doc one paraphrase loves at rank 1
    # a measured multi-query union recall (separate from the RRF scenario), over the real corpus:
    paraphrases_bags = [Q_BAG,
                        ["espresso", "underextraction", "weak", "shot"],
                        ["coffee", "bitter", "thin", "watery", "sour"]]
    found_union = set()
    for pb in paraphrases_bags:
        top3 = [did for did, _ in rank_corpus(pb, CORPUS)[:3]]
        found_union |= set(top3)
    multi_recall_union = round(len(found_union & {GOLD}) / 1.0, 4)   # binary: is gold in the union top-3?

    # decomposition: compound query facts in different chunks; error propagation p^n.
    compose_success = round(PER_HOP_P ** HOPS, 4)
    recall_sub = [1, 1, 1]
    recall_joint = 0

    # ── multi-seed robustness: does the raw < rm3 < hyde ordering survive corpus jitter? ─────────────
    holds = {"raw>rm3": 0, "rm3>hyde": 0, "raw>hyde": 0, "trap_beats_gold_raw": 0}
    rr_samples = {"raw": [], "rm3": [], "hyde": []}
    for sd in SEEDS:
        rng = random.Random(sd)
        jc = jitter_corpus(CORPUS, rng)
        tr = technique_ranks(jc)
        rr_samples["raw"].append(1.0 / tr["raw"])
        rr_samples["rm3"].append(1.0 / tr["rm3"])
        rr_samples["hyde"].append(1.0 / tr["hyde"])
        if tr["raw"] > tr["rm3"]:
            holds["raw>rm3"] += 1
        if tr["rm3"] > tr["hyde"]:
            holds["rm3>hyde"] += 1
        if tr["raw"] > tr["hyde"]:
            holds["raw>hyde"] += 1
        rjc = rank_corpus(Q_BAG, jc)
        if rank_of(rjc, TRAP) < rank_of(rjc, GOLD):
            holds["trap_beats_gold_raw"] += 1
    n = len(SEEDS)
    hold_frac = {k: round(v / n, 3) for k, v in holds.items()}

    def band(xs):
        m = sum(xs) / len(xs)
        var = sum((x - m) ** 2 for x in xs) / len(xs)
        return {"mean": round(m, 3), "std": round(math.sqrt(var), 3)}

    recall_band = {k: band(v) for k, v in rr_samples.items()}

    # ── assert the load-bearing invariants (fail loud if the toy stops telling the story) ────────────
    assert cos_q_trap > cos_q_gold, "raw query must fail: trap must outrank gold on surface words"
    assert raw_gold_rank >= 3, "gold must be buried under the raw query"
    assert hyde_gold_rank == 1, "HyDE must lift gold to rank 1"
    assert cos_h_gold > cos_q_gold, "HyDE must raise the gold cosine"
    assert raw_gold_rank > rm3_gold_rank > hyde_gold_rank, "ordering raw > rm3 > hyde (by rank) must hold"
    assert cos_qgen_prin > cos_qsb_prin, "step-back: generic must retrieve the principle better than specific"
    assert rrf_gold > rrf_single_hit, "RRF consensus must beat a single top-1 hit"

    rewrite = {
        "_doc": ("MEASURED on a CONSTRUCTED, vocabulary-mismatched espresso corpus (6 passages), cosine = "
                 "set-overlap over a small concept vocabulary. Demonstrates the THREE gaps: (vocabulary) raw "
                 f"query buries GOLD d1 at rank {raw_gold_rank} because the lexical TRAP d4 shares {{sour,taste}} "
                 f"— RM3 helps to rank {rm3_gold_rank} but cannot invent 'under-extraction'; HyDE lifts d1 to "
                 f"rank {hyde_gold_rank} (cos {cos_q_gold}->{cos_h_gold}); (specificity) step-back retrieves the "
                 f"principle d5 (cos {cos_qsb_prin}->{cos_qgen_prin}); (compositionality) a 3-hop compound query, "
                 f"compose success p^n = {compose_success}. Reproduces the ORDERING, not MS-MARCO magnitudes; the "
                 "corpus is constructed to be demonstrable, not discovered."),
        "_source": "_research/gen_l14.py (toy, stdlib): cos=|A n B|/sqrt(|A||B|); RR=1/rank; RRF=sum 1/(k+r), k=60.",
        "measured": True,
        "query": QUERY,
        "queryBag": Q_BAG,
        "goldDocId": GOLD,
        "trapDocId": TRAP,
        "principleDocId": PRINCIPLE,
        "corpus": CORPUS,
        "techniques": {
            "raw": {"goldRank": raw_gold_rank, "cosGold": cos_q_gold, "cosTrap": cos_q_trap,
                    "trapRank": rank_of(raw_ranked, TRAP), "rr": rr(raw_gold_rank), "llmCalls": 0,
                    "rankedList": [did for did, _ in raw_ranked]},
            "rm3": {"goldRank": rm3_gold_rank, "cosGold": cos_rm3_gold, "rr": rr(rm3_gold_rank), "llmCalls": 0,
                    "feedbackDocs": rm3_feedback, "addedTerms": rm3_added, "expandedBag": rm3_bag,
                    "ceilingNote": "gained 'channeling' but NOT 'underextraction' (absent from the top pass); "
                                   "also drifts toward the trap's terms — the classical PRF ceiling.",
                    "rankedList": [did for did, _ in rm3_ranked]},
            "hyde": {"goldRank": hyde_gold_rank, "cosGold": cos_h_gold, "cosTrap": cos_h_trap,
                     "rr": rr(hyde_gold_rank), "llmCalls": 1, "hypotheticalDoc": HYDE_TEXT, "hypotheticalBag": HYDE_BAG,
                     "rankedList": [did for did, _ in hyde_ranked]},
        },
        "cosineJump": {"gold": [cos_q_gold, cos_h_gold], "trap": [cos_q_trap, cos_h_trap],
                       "_note": "the lecture's central visual (S17): raw query -> HyDE pseudo-doc."},
        "stepBack": {"specific": QSB_TEXT, "generic": QGEN_TEXT, "principleDocId": PRINCIPLE,
                     "specificBag": QSB_BAG, "genericBag": QGEN_BAG,
                     "cosSpecificPrinciple": cos_qsb_prin, "cosGenericPrinciple": cos_qgen_prin,
                     "principleRankSpecific": qsb_prin_rank, "principleRankGeneric": qgen_prin_rank,
                     "_note": "climb to retrieve (generic), descend to answer (specific)."},
        "multiQueryRRF": {"k": RRF_K, "paraphraseGoldRanks": para_gold_ranks,
                          "paraphraseGoldRanks_note": "DESIGN-INPUT scenario (chosen to tell the consensus story); "
                                                      "the RRF score below is COMPUTED from it.",
                          "rrfGold": rrf_gold, "rrfSingleHitRank1": rrf_single_hit,
                          "rrfTerms": [round(1.0 / (RRF_K + r), 4) for r in para_gold_ranks],
                          "measuredUnionHasGold": multi_recall_union,
                          "_note": "gold at ranks [3,1,2] -> 1/63+1/61+1/62 = %.4f beats a single rank-1 hit 1/61 = %.4f"
                                   % (rrf_gold, rrf_single_hit)},
        "decomposition": {"query": QDEC_TEXT, "subQuestions": SUBQUESTIONS, "subDocIds": SUB_DOCS,
                          "recallSub": recall_sub, "recallJoint": recall_joint,
                          "perHopSuccess": PER_HOP_P, "hops": HOPS, "composeSuccess": compose_success,
                          "_note": "each sub-answer sits in its own chunk (recallSub all 1); no single chunk holds "
                                   "all three (recallJoint 0). But compose success = p^n = %.1f^%d = %.3f — a wrong "
                                   "hop propagates." % (PER_HOP_P, HOPS, compose_success)},
        "robustness": {"seeds": n, "orderingHoldFraction": hold_frac, "rrBand": recall_band,
                       "_note": "over %d seeds jittering the corpus bags: fraction where each ordering invariant "
                                "still holds (1.0 = knife-edge-free)." % n},
        "config": {"seeds": n, "rrfK": RRF_K, "perHopP": PER_HOP_P, "hops": HOPS,
                   "cosine": "set-overlap |A n B|/sqrt(|A||B|)"},
    }

    bench = {
        "_doc": ("CITED published numbers for L14 — NOT computed in this repo. Use verbatim with source. The toy "
                 "(l14-rewrite.json) reproduces the ORDERING/SHAPE of these results, never their magnitudes."),
        "_source": "_research/gen_l14.py (static, cited): HyDE, Query2doc, Step-Back, Least-to-Most, RRF, RM3, GAR, Doc2Query.",
        "cited": True,
        "hyde": {
            "claim": "HyDE (InstructGPT generator + unsupervised Contriever encoder) significantly outperforms "
                     "the unsupervised Contriever zero-shot across web search / QA / fact-verification + multilingual.",
            "boundary": "Zero-shot / low-resource move — does NOT beat a strong FINE-TUNED dense retriever; "
                        "no precise BEIR scalar displayed (leaderboard, not reproduced).",
            "source": "Gao, Ma, Lin & Callan, 'Precise Zero-Shot Dense Retrieval without Relevance Labels (HyDE)', ACL 2023 (arXiv:2212.10496)"
        },
        "query2doc": {
            "metric": "BM25 improvement, MS-MARCO / TREC-DL",
            "minPct": 3, "maxPct": 15,
            "note": "+3% to 15% on BM25, LARGEST on sparse / zero-shot; small-to-negligible on strong fine-tuned dense retrievers.",
            "source": "Wang, Yang & Wei, 'Query2doc: Query Expansion with Large Language Models', EMNLP 2023 (arXiv:2303.07678)"
        },
        "stepBack": {
            "retrievalAugmented": {"TimeQA": 27, "MuSiQue": 7, "_metric": "absolute-point gain, PaLM-2L"},
            "pureReasoning": {"MMLU_Physics": 7, "MMLU_Chemistry": 11, "_metric": "absolute-point gain, PaLM-2L (no retrieval)"},
            "note": "Foreground the retrieval-augmented gains (TimeQA/MuSiQue); MMLU deltas are reasoning-without-retrieval.",
            "source": "Zheng et al., 'Take a Step Back: Evoking Reasoning via Abstraction in LLMs', ICLR 2024 (arXiv:2310.06117)"
        },
        "leastToMost": {
            "metric": "SCAN length-split accuracy, code-davinci-002",
            "leastToMost": 99.7, "chainOfThoughtBaseline": 16.2,
            "note": "16.2 is the CHAIN-OF-THOUGHT column (not standard prompting) — pin this provenance.",
            "source": "Zhou et al., 'Least-to-Most Prompting Enables Complex Reasoning in LLMs', ICLR 2023 (arXiv:2205.10625)"
        },
        "rrf": {
            "k": 60, "formula": "s(d) = sum_i 1/(k + r_i(d))",
            "note": "k=60 is the empirical constant set on TREC data; rank-based, score-agnostic. Reused from L3.",
            "source": "Cormack, Clarke & Buettcher, 'Reciprocal Rank Fusion outperforms Condorcet...', SIGIR 2009 (DOI 10.1145/1571941.1572114)"
        },
        "rm3": {
            "method": "Pseudo-relevance feedback: interpolate the query LM with a relevance model over the top-k first-pass docs.",
            "note": "A LANGUAGE-MODEL PRF family (RM1 -> RM3), PARALLEL to vector-space Rocchio feedback — not a lineage.",
            "sources": ["Lavrenko & Croft, 'Relevance-Based Language Models', SIGIR 2001 (DOI 10.1145/383952.383972)",
                        "Abdul-Jaleel et al., 'UMass at TREC 2004: Novelty and HARD' (RM3), TREC 2004"]
        },
        "gar": {
            "method": "Generation-Augmented Retrieval: generate and APPEND contexts to the query for sparse+reader.",
            "note": "Antecedent of the expansion/concatenation branch (-> Query2doc), NOT of HyDE (which embeds-instead).",
            "source": "Mao et al., 'Generation-Augmented Retrieval for Open-Domain QA (GAR)', ACL 2021 (arXiv:2009.08553)"
        },
        "decomposition": {
            "selfAsk": "Press et al., 'Measuring and Narrowing the Compositionality Gap (Self-Ask)', Findings of EMNLP 2023 (arXiv:2210.03350)",
            "decomposedPrompting": "Khot et al., 'Decomposed Prompting: A Modular Approach (DecomP)', ICLR 2023 (arXiv:2210.02406)",
            "note": "Distinguished BY ABSTRACTION LEVEL: least-to-most=ordering, self-ask=elicitation, DecomP=architecture."
        },
        "docExpansion": {
            "method": "Document expansion (query prediction) — expand DOCS at index time, the mirror of query expansion.",
            "note": "Doc2Query (4 authors, arXiv-only); its T5 follow-up docTTTTTquery is an informal preprint (no arXiv).",
            "source": "Nogueira, Yang, Lin & Cho, 'Document Expansion by Query Prediction (Doc2Query)', 2019 (arXiv:1904.08375)"
        },
        "trainableRewriter": {
            "method": "Rewrite-Retrieve-Read (RRR): a small-LM rewriter trained by RL on the downstream answer reward.",
            "source": "Ma et al., 'Query Rewriting for Retrieval-Augmented Large Language Models (RRR)', EMNLP 2023 (arXiv:2305.14283)"
        },
        "queryExpansionPrompting": {
            "method": "Prompt an LLM (Q2D / CoT / few-shot) to generate query-expansion terms; CoT-style expansion strong.",
            "source": "Jagerman et al., 'Query Expansion by Prompting Large Language Models', 2023 (arXiv:2305.03653, arXiv-only)"
        },
    }

    (DATA / "l14-rewrite.json").write_text(json.dumps(rewrite, indent=2), encoding="utf-8")
    (DATA / "l14-bench.json").write_text(json.dumps(bench, indent=2), encoding="utf-8")

    print("[gen_l14] vocabulary gap (gold rank / RR / cos-to-gold):")
    print(f"    raw   rank {raw_gold_rank}  RR {rr(raw_gold_rank):.4f}  cos {cos_q_gold}  (trap cos {cos_q_trap} @ rank {rewrite['techniques']['raw']['trapRank']})")
    print(f"    rm3   rank {rm3_gold_rank}  RR {rr(rm3_gold_rank):.4f}  cos {cos_rm3_gold}  (added {rm3_added})")
    print(f"    hyde  rank {hyde_gold_rank}  RR {rr(hyde_gold_rank):.4f}  cos {cos_h_gold}  (trap cos {cos_h_trap})")
    print(f"[gen_l14] step-back: cos(specific,principle) {cos_qsb_prin} -> cos(generic,principle) {cos_qgen_prin}")
    print(f"[gen_l14] RRF (k={RRF_K}): gold ranks {para_gold_ranks} -> {rrf_gold} > single-hit {rrf_single_hit}")
    print(f"[gen_l14] decomposition: recallSub {recall_sub} vs joint {recall_joint}; compose p^n {compose_success}")
    print(f"[gen_l14] robustness (20 seeds) ordering-hold: {hold_frac}")
    print("[gen_l14] wrote data/l14-rewrite.json + data/l14-bench.json")


if __name__ == "__main__":
    main()
