#!/usr/bin/env python3
"""
check_claims.py — facts-gate (AUDIT_V2 §1.1 claims-ledger + §1.2 arithmetic) upgraded to the
SITE_ARCHITECTURE G1 'shared-data' contract.

The single source of grounded numbers is the curated product layer `data/l*-*.json` (co-located
with data/course.json; read by the decks, the Book, and the widgets). This gate enforces the whole
chain so a number cannot drift at any hop:

  [P] PROVENANCE :  curated data/l*-*.json  ==  generator output _research/data/*.json   (HARD)
  [C] CLAIMS     :  what a DECK displays     ==  curated data/l*-*.json                   (HARD)
  [A] ARITHMETIC :  recompute cos/Euclid & every displayed a·b/(c·d)  ==  result          (HARD)

So `data/` is THE source; [P] proves it matches the upstream generator, [C] proves the decks match
`data/`. When the Book lands, add its built HTML to `texts` and the same [C]/[A] checks cover it.

Usage:  python3 _research/check_claims.py            (check decks against data/)
        python3 _research/check_claims.py --selftest  (known-bad fixtures must flag, §2.4)
"""
from __future__ import annotations
import json, re, sys, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"               # curated product source of truth
RAW  = ROOT / "_research/data"     # generator artifacts (upstream provenance)
DOCS = ROOT / "docs"               # built site (Book HTML) — present after `npm run build`
# Glob-discovered: adding Lectures/NN-*.html is picked up here with ZERO edits.
# The key "L<n>" is derived from the numeric filename prefix (00-introduction.html → L0),
# preserving the exact id→path mapping the per-deck [C] claim checks address by key.
DECKS = {
    f"L{int(p.name[:2])}": p
    for p in sorted((ROOT / "Lectures").glob("[0-9][0-9]-*.html"))
}

def load(base, name):
    return json.load(open(base / name))

def num(s):  # parse a displayed number: U+2212 minus, KaTeX/RU decimal comma, EN thousands, trailing dot
    s = s.replace("−", "-").replace("{,}", ".").strip()      # KaTeX decimal comma  0{,}5 → 0.5
    s = re.sub(r"[\s  ]", "", s)                   # thousands spaces (incl. nbsp / thin space)
    if "." in s and "," in s:                                # EN "1,234.56": comma = thousands, dot = decimal
        s = s.replace(",", "")
    elif re.fullmatch(r"-?[1-9]\d{0,2}(?:,\d{3})+", s):      # pure thousands-grouped integer  "94,287" → 94287
        s = s.replace(",", "")
    else:                                                    # RU decimal comma  "0,75" / "2,3" → 0.75 / 2.3
        s = s.replace(",", ".")
    s = re.sub(r"\.+$", "", s)
    return float(s)

_THOU_GROUP = re.compile(r'(?<!\d)\d{1,3}(?:,\d{3})+(?!\d)')   # EN thousands "94,287" — NOT a decimal comma

def norm_dec(t):
    """Canonicalise the RU decimal comma to a dot so a [C] anchor matches BOTH renderings.

    The deck ships每 number twice (EN span '0.59', RU span '0,59' / KaTeX '0{,}59'); the anchors are
    written once. Normalising the haystack keeps every existing anchor valid and makes the gate check
    the RU rendering too — strictly more coverage, never less. EN thousands groups are protected first.
    """
    t = t.replace("{,}", ".")
    t = _THOU_GROUP.sub(lambda m: m.group(0).replace(",", "\x00"), t)
    t = re.sub(r'(?<=\d),(?=\d)', '.', t)
    return t.replace("\x00", ",")

def load_book():
    """Built Book chapters docs/<en>/book/NN/index.html, keyed L<n> (glob — L7 auto-covered).
    Empty dict if docs/ is not built (the gate then WARNs and skips Book [C] claims)."""
    out, base = {}, DOCS / "en" / "book"
    if not base.exists():
        return out
    for d in sorted(base.iterdir()):
        idx = d / "index.html"
        if d.is_dir() and d.name.isdigit() and idx.exists():
            out["L" + str(int(d.name))] = idx.read_text()
    return out

# Curated product data (the single source). Loaded once.
COS  = load(DATA, "l2-cosine.json")
CORP = load(DATA, "l2-corpus-stats.json")
TOK  = load(DATA, "l2-tokenizers.json")     # four tokenizers on one input (BPE/WordPiece/Unigram/byte-BPE)
CLICK = load(DATA, "l1-click-model.json")
def primary_pair():
    return next(p for p in COS["pairs"] if p["id"] == COS["primary"])

# ── L3 (classical IR) and L4 (ranking metrics): the two biggest decks. Same single source: data/. ──
CATDOG       = load(DATA, "l3-bm25-catdog.json")        # flagship cat/dog BM25 (final idf, B, scores)
CATDOG_STEPS = load(DATA, "l3-bm25-catdog-steps.json")  # intermediate B-factors / docSums
Q2           = load(DATA, "l3-bm25-q2.json")            # nasa/shuttle distinct-idf query
Q2_STEPS     = load(DATA, "l3-bm25-q2-steps.json")      # nasa/shuttle idf + winning-doc B-factors
PAGERANK     = load(DATA, "l3-pagerank.json")           # power-iteration converged vector + worked B-update
COMPRESS     = load(DATA, "l3-compression.json")        # postings gaps + varbyte bytes
BENCH        = load(DATA, "l3-benchmarks.json")         # cited MS MARCO / BEIR baselines
RRF          = load(DATA, "l3-rrf.json")                # reciprocal-rank fusion, k=60
METRICS      = load(DATA, "l4-metrics.json")            # binary nDCG (honest 0.6766) + gamed 0.5434
GRADED       = load(DATA, "l4-graded.json")             # graded nDCG linear/exponential
MULTIQ       = load(DATA, "l4-multiquery.json")         # two-query MRR / MAP
SYSTEMS      = load(DATA, "l4-systems.json")            # significance: t-test, Wilcoxon, permutation, CI
ONLINE       = load(DATA, "l4-online.json")             # A/B z-test + team-draft interleaving
GOODHART     = load(DATA, "l4-goodhart-steps.json")     # binary-gain DCG terms for honest vs gamed

# ── L5 (embeddings + dim-reduction) and L6 (attention/positional/contrastive). Same single source. ──
EMB     = load(DATA, "l5-embeddings.json")    # GloVe-50 analogies + pairwise cosines (+ raw vectors)
DIMRED  = load(DATA, "l5-dimred.json")        # PCA explained-variance + t-SNE (44 words / 7 clusters)
PCAROT  = load(DATA, "l5-pca-rotate.json")    # slide-33 3-D→2-D rotation toy: var2dPct 97.21 (kicker breadcrumb)
GLOVE   = load(DATA, "l5-glove.json")         # GloVe mini-corpus: X / log X / f(x) / worked king·queen + loss
TSNE    = load(DATA, "l5-tsne-math.json")     # t-SNE on 9 GloVe-50 words: σ/perplexity, p_{j|i}, joint P, q, KL
ATTN    = load(DATA, "l6-attention.json")     # scaled-dot-product worked example (√d_k, weights, output)
POSENC  = load(DATA, "l6-positional.json")    # sinusoidal positional-encoding grid
CONTRA  = load(DATA, "l6-contrastive.json")   # InfoNCE / triplet cosines + loss (shares L5 cat-pair cosines)

# ── Enrichment data files (the L5/L6 re-layout DISPLAYS these new trajectory numbers; pin them) ──
W2V     = load(DATA, "l5-word2vec-train.json")  # SGNS training: loss 4.85→2.63, worked SGNS step, related/unrelated pairs
UMAP    = load(DATA, "l5-umap.json")            # REAL UMAP-44: n_neighbors=10, min_dist=0.1, tightness 0.147→0.061
STACK   = load(DATA, "l6-stack-layers.json")    # DistilBERT cross-sense cos(bank,bank) fan 0.957→0.647 over 6 blocks
CTRAJ   = load(DATA, "l6-contrastive-traj.json")# InfoNCE optimisation trajectory: loss 3.31→0.86→0.1191
CTX     = load(DATA, "l6-contextual.json")      # standalone DistilBERT "bank" polysemy demo: cross-sense 0.6465 < within-sense 0.9466 (Book ch.6 prose)

# ── L7 (Scouts and Judges: bi-/cross-encoders + the neural cascade). toy = stdlib-reproducible; real =
#    frozen SBERT / cross-encoder (gen_l7_real.py, fail-soft). Callbacks reuse BENCH (l3) + METRICS (l4). ──
BIENC    = load(DATA, "l7-biencoder.json")      # toy dot/cos (0.8165/0) + real SBERT cosRel 0.6838 > cosIrr 0.4082
CROSSENC = load(DATA, "l7-crossencoder.json")   # toy logit→σ (0.9168/0.2497) + real distractor (Judge 0.9998 vs 0.1159, Scout 0.8434 vs 0.6875)
CASCADE  = load(DATA, "l7-cascade.json")         # stages 10⁶→10³→10; BM25 nDCG 0.6766 → reranked 0.9558 (real cross-encoder on the L4 8-doc set)
MSMARCO  = load(DATA, "l7-msmarco.json")         # frozen MS MARCO subset: retrieve MRR@10 0.5482 → rerank 0.6732 (rerank helps)
BENCH7   = load(DATA, "l7-bench.json")           # CITED reranker benchmarks: small cross-encoder MRR@10 (L6 39.01 vs L12 39.02); LLM-reranker nDCG@10 (gpt-4 75.59, RankZephyr 74.20 matched BM25 top-100)

# ── L8 (The Alliance: late interaction / ColBERT · learned sparse / SPLADE · hybrid · Learning to Rank).
#    toy = stdlib-reproducible (gen_l8.py); real = frozen ColBERT/SPLADE (gen_l8_real.py, fail-soft);
#    cited = l8-bench.json (primary-source verified). Callbacks reuse BENCH (l3) + METRICS (l4). ──
COLBERT8 = load(DATA, "l8-colbert.json")    # toy MaxSim 2.35 (rel) > 1.30 (irr); the lexical-trap BAM
SPLADE8  = load(DATA, "l8-splade.json")     # toy w=log(1+ReLU): river 1.0986/flood 1.2528; expansion bank 0.4055/water 0.7885; dot 3.0494
HYBRID8  = load(DATA, "l8-hybrid.json")     # toy RRF k=60: consensus D2 0.0325 > sparse-#1 D1 0.0318 (falls to 3rd)
LTR8     = load(DATA, "l8-ltr.json")        # toy RankNet σ(1.2)=0.7685, cost 0.2633, grad 0.2315, ΔnDCG 0.3691, λ 0.0854
BENCH8   = load(DATA, "l8-bench.json")      # CITED: ColBERT 286→27 GiB, ColBERTv2 MRR@10 39.7, SPLADE++ 38.0/BEIR 50.7, PLAID 6.8×/45×, MSLR 136 feats

# ── L9 (Hyperspace Lanes: ANN — HNSW/IVF/PQ + production latency). toy = stdlib-reproducible
#    (gen_l9.py); real = frozen FAISS (gen_l9_real.py, fail-soft); cited = l9-bench.json. ──
METRICS9 = load(DATA, "l9-metrics.json")# by-hand L2/dot/cosine pair (2.6458/4/0.5443, norms 3.0/2.4495) + ranking-disagreement (d1/d2/d3 cosines 0.9487/1.0/0.9648, L2 1.0/1.4142/5.3852)
HNSW9  = load(DATA, "l9-hnsw.json")     # toy greedy path n0→n1→n2 (dists 4.5277/2.5495/0.7071), 2 hops, recall@1 1.0; toy2 two-layer climb (b2→b7→b9 NN 1.4142, baseOnly trap b0 17.088→b1 14.3178); efSweep (30-node, NN 5.831, ef recall 0.0→1.0, candidates 5/15/26)
IVF9   = load(DATA, "l9-ivf.json")      # toy 9pts/3 cells; nprobe 1→2 recall@3 0.6667→1.0; toy2 20pts/5 cells nprobe sweep recall 0.6/0.8/1.0, pointsScanned 4/8/13/17/20; committed geometry (2-in-c0/1-in-c1/c1 2nd-nearest)
PQ9    = load(DATA, "l9-pq.json")       # toy 32→4 B (8×); scale 768→96 (32×), 128→8 (64×); adcWorked (adcDistance 35 vs exactDistance 37); memoryConfigs compression 32×/16×/64×/64×; codebookTrain Lloyd inertia 284.0→20.6875→2.6667, centroids 6.75/1.3333/8.3333
LAT9   = load(DATA, "l9-latency.json")  # toy serving budget Σ = 89 ms < 200 SLA; cacheHitMs 5; exactScanMs 520; tailNote p50 45 / p99 180
BENCH9 = load(DATA, "l9-bench.json")    # CITED: HNSW (Malkov&Yashunin), PQ (Jégou), IVF/FAISS (Johnson), TurboQuant (arXiv:2504.19874)
HIGHD  = load(DATA, "l2-highd.json")    # curse-of-dimensionality (displayed on L9 exact-dies slide): cv=std/mean collapses 0.4784→0.1932→0.0602→0.0187 as d 2→10→100→1000 (means 0.5171/1.2688/4.0620/12.9023, stds 0.2474/0.2451/0.2445/0.2410)

# ── L10 (The Oracle: RAG + chunking + query rewriting). toy = stdlib (gen_l10.py); real = frozen
#    retrieve→generate (gen_l10_real.py, fail-soft); cited = l10-bench.json. ──
RAG10     = load(DATA, "l10-rag.json")       # toy token budget: ctx 4096, k=4 stuffed 1024/prompt 1254/headroom 2842, kMax 13; retrievalMath cos4 0.8165/0.7877/0.7071 (2-dp 0.82/0.79/0.71)
CHUNK10   = load(DATA, "l10-chunking.json")  # toy 5→7 chunks; binary answer-containment recall@3 0→1.0 (overlap rescues the straddle); sweep overlap 0/50/100/150 → nChunks 5/7/9/17, recall 0→1→1→1
REWRITE10 = load(DATA, "l10-rewrite.json")   # toy rank 8→2; RR 0.125→0.5; multi-query recall@5 0.4→0.8 (separate 5-relevant gold-set)
BUDGET10  = load(DATA, "l10-budget.json")    # token-budget sweep: kMax = (ctx−sys−q−reserve)//chunk → 13 / 29 / 125 / 497 across windows 4096 / 8192 / 32768 / 128000
FUSION10  = load(DATA, "l10-fusion.json")    # RRF k=60: consensus doc_cardiac_cycle 0.0325 > sparse-#1 doc_circulatory 0.0323 (agreement across paraphrases wins)
RERANK10  = load(DATA, "l10-rerank.json")    # cross-encoder reorder: nDCG@5 0.4935→1.0, MRR 0.3333→1.0 (true doc d2 rank 4→1)
ROUTING10 = load(DATA, "l10-routing.json")   # query routing: cos(q, {factQA/howTo/compare}) = 0.8058/0.9670/0.6447 → route argmax = howTo
DECOMP10  = load(DATA, "l10-decomp.json")    # query decomposition: recallSub [1,1] vs recallJoint 0 (each sub-answer in its own chunk, no chunk holds both)
RAPTOR10  = load(DATA, "l10-raptor.json")    # RAPTOR tree (descriptive): 8 leaf chunks → 3 mid summaries → 1 root, depth 3
BENCH10   = load(DATA, "l10-bench.json")     # CITED: RAG (Lewis), HyDE (Gao et al., ACL 2023, arXiv:2212.10496), Late Chunking (Günther et al.)

# ── L11 (Judging the Oracle: RAG eval — RAGAS, LLM-as-judge — + agentic RAG). toy = stdlib (gen_l11.py);
#    real = frozen llama3.1:8b judge/ReAct (exp_l11_ollama.py, run-once); cited = l11-bench.json. ──
RAGAS11   = load(DATA, "l11-ragas.json")     # toy RAGAS: faithfulness 0.75, answerRelevance 0.7033, contextPrecision 0.8333, contextRecall 0.6667
JUDGE11   = load(DATA, "l11-judge.json")     # toy rubric A 4.0 > B 2.6667; Goodhart flip (honest A vs length-biased C 4.25); REAL verbosity 1.0 / tie 0.6667 / clear 1.0
AGENTIC11 = load(DATA, "l11-agentic.json")   # toy 2-hop ReAct recall 0→0→1; REAL ReAct solved in 3 steps (Pragmatic Bookshelf)
BENCH11   = load(DATA, "l11-bench.json")     # CITED: RAGAS (2309.15217), LLM-judge/MT-Bench (2306.05685), ReAct (2210.03629), CRAG (2401.15884)

# ── L12 (The Deep Field: advanced RAG — multi-hop/GraphRAG — multimodal CLIP/ColPali, ethics). toy =
#    stdlib (gen_l12.py); real = frozen llava:7b/llama3.1:8b (exp_l12_ollama.py, run-once); cited = l12-bench.json. ──
GRAPHRAG12 = load(DATA, "l12-graphrag.json") # toy 2-hop: recallSingleHop 0 → recallMultiHop 1, hops 2; REAL 7 triples → "computer science"
CLIP12     = load(DATA, "l12-clip.json")     # toy CLIP cosine matrix diagonal 3/3; matched 0.9944 vs mismatched 0.3791 (gap 0.6153); REAL llava 5/5
ETHICS12   = load(DATA, "l12-ethics.json")   # framework + REAL hallucination demo (closed-book confabulates, grounded abstains)
BENCH12    = load(DATA, "l12-bench.json")    # CITED: GraphRAG (2404.16130), CLIP (2103.00020), ColPali (2407.01449), HotpotQA (1809.09600)

# ── L13 "The Crucible of Negatives" (deep-dive #1) — toy = measured over 20 seeds (gen_l13_negatives.py,
#    frozen toolchain); bench = cited paper numbers (not reproduced). The deck's killer-ablation slide
#    displays both, on separate axes. ──
NEG13      = load(DATA, "l13-negatives.json") # toy recall@10: in-batch .645 → +undenoised .411 (drops) → +denoised .783 (RocketQA inversion, 20 seeds)
BENCH13    = load(DATA, "l13-bench.json")     # CITED: DPR Table 3 (2004.04906), RocketQA ablation (2010.08191), ANCE (2007.00808), STAR/ADORE, TAS-B

# ── L14 "The Artificer's Quill" (deep-dive #2) — query rewriting & decomposition. toy = stdlib
#    (gen_l14.py: set-overlap cosines, fully re-derivable from concept bags); bench = cited paper numbers. ──
REWRITE14  = load(DATA, "l14-rewrite.json")   # toy vocab gap: gold rank 4→1 (raw→HyDE, cos 0.22→0.63), RM3 4→3 (ceiling); RRF [3,1,2] k=60 → 0.0484 > 0.0164; step-back cos 0.0→0.57; compose p^3 0.729
BENCH14    = load(DATA, "l14-bench.json")     # CITED: HyDE (2212.10496), Query2doc +3–15% (2303.07678), Step-Back (2310.06117), Least-to-Most SCAN 99.7 vs 16.2 CoT (2205.10625), RRF k=60, RM3, GAR, Doc2Query

# ── L15 "BERT & other Transformers" (supplementary) — toy = stdlib (gen_l15.py: self-attention softmax,
#    √dₖ saturation, sinusoidal PE, 12d² params, causal mask, decoding strategies, O(n²) memory — fully
#    re-derivable with math.exp/sin/cos); bench = cited paper numbers. Unlike siblings L16–L18 (baseline-
#    frozen only), L15 is now FULLY gated: l15_deck_claims() pins every flagship worked value deck==data. ──
ATTN15     = load(DATA, "l15-attention.json") # toy: softmax(1,0,3)=(0.114,0.042,0.844)→Y1=(0.958,0.886); √dₖ 0.995 vs 0.909; PE (0.841,0.540,0.010,1.000); 12·768²=7.08M/block; causal (0.035,0.259,0.705)/(0.119,0.881); decoding base+T; mem 0.52MB/2.15GB
BENCH15    = load(DATA, "l15-bench.json")     # CITED: Transformer (vaswani-2017), BERT-base 110M / large 340M (devlin-2019), DistilBERT 40/60/97 (distilbert-2019), GPT-3 175B (gpt3-2020), RoBERTa/ALBERT/ELECTRA, T5/BART, FlashAttention
COST19     = load(DATA, "l19-cost.json")     # DERIVED by gen_l19.py from the GLYPHS: linear 24nd² vs attention core 4n²d;
                                              # share 10.0/47.1/87.7 %; crossover n = 6d = 4608; score box 6.3MB/403MB/25.8GB; KV 36.9KB/token

# ── L20 "Search in Russian" (supplementary) — toy = stdlib-reproducible (gen_l20.py: BPE token tax on a
#    9:1 EN:RU mix + BM25 surface-vs-lemma inversion, k1=1.5/b=0.75, fully re-derivable); bench = cited
#    facts (MIRACL/mMARCO/ruMTEB, BGE-M3, mE5, LaBSE, tokenizer unfairness). Like L14/L15, FULLY gated:
#    l20_deck_claims() pins every displayed worked value deck==data (deck:L20 coverage → 0). ──
L20RU      = load(DATA, "l20-ru.json")       # toy: token tax 1.0→5.8 tok/word; BM25 surface gold 0.0 (rank 2) → lemma gold 1.3884 (rank 1); distractor 1.3608; kitten idf 0.8755 / bm25 0.8594
L20B       = load(DATA, "l20-bench.json")    # CITED: MIRACL (2210.09984), mMARCO (2108.13897), ruMTEB/RoSBERTa (2408.12503), BGE-M3 (2402.03216), mE5 (2402.05672), LaBSE (2007.01852), tokenizer unfairness ×15 (2305.15425)

# ── L18 "The Curved Map" (supplementary deep-dive: anisotropy & hubness) — toy = stdlib-reproducible
#    (gen_l18.py: the cone toy + its HONEST all-but-the-top, the cone dial's c/σ grid, the four-cities
#    whitening walk-through, the reverse-kNN hubness toy and the same cloud under CSLS); bench = the
#    transcribed published numbers, each carrying the exact table it came from. Like L14/L15/L16/L20,
#    now FULLY gated: l18_deck_claims() pins every displayed ≥2-dp value deck==data (deck:L18 coverage
#    baseline 17 → 0; book:L18 stays frozen until the Book's own numbers are anchored). ──
GEOM18     = load(DATA, "l18-geometry.json") # toy: cone 0.8985 → centered −0.0323 → honest ABT −0.0313 (PC1·cone 0.9997); dial c/σ grid; whitenToy 0.9504 → 0.60 → 0.0000; hubness skew 0.0299→2.5904; CSLS 2.5904→0.3923
BENCH18    = load(DATA, "l18-bench.json")    # CITED: Ethayarajh 2019, Timkey 2021 (replication + rogue dims), Rudman 2022 (IsoScore), Tsukagoshi 2025, Radovanović 2010, Feldbauer 2019, Munyampirwa 2024, Li 2020, Su 2021, Gao 2021, Conneau 2018, Bogolin 2022, Kusupati 2022, Diera 2025, Ren 2025 (preprint)
# ── L16 "Late Chunking" (supplementary deep-dive) — toy + three widget blocks are stdlib-reproducible
#    (gen_l16.py: set-overlap cosines, the 4-token pooling toy, the gap law min(1,g/s), the Algorithm-2
#    ledger); bench = transcribed published numbers, each with its source. l16_deck_claims() pins EVERY
#    displayed ≥2-dp value deck==data (deck:L16 coverage → 0, was a frozen baseline of 9). ──
L16CH      = load(DATA, "l16-chunk.json")    # toy: gold 0.5164→0.7071 (rank 2→1) under distractor 0.5774;
                                             # pool (0,2)→(1,1), cos 0→0.7071; gapLaw min(1,40/s); longLate
                                             # stride 7680 × 3 macro-chunks, +1024 tokens = ω per seam
L16B       = load(DATA, "l16-bench.json")    # REPORTED: Berlin cosines, ACME Table 4 (all 5 rows), BeIR
                                             # averages + the 33:2:1 record + the single loss cell, Table 3
                                             # span pooling, Table 6 overlap, the No-Chunking column,
                                             # Merola & Singh 2025 replication, ColBERTv2 §5.3, Anthropic
ENT17      = load(DATA, "l17-entropy.json")  # COMPUTED by gen_l17.py (stdlib math.log2): the coin, the
                                             # dyadic + non-dyadic Huffman codes, block coding, Markov 1913
                                             # conditional entropy, the letter-frequency entropies, IDF in bits
BENCH17    = load(DATA, "l17-bench.json")    # REPORTED: Shannon 1948/1951, Cover-King 1978, Brown 1992,
                                             # Yaglom 1973 (ru), Spärck Jones 1972, Robertson 2004,
                                             # Church & Gale 1995, Pibiri & Venturini 2020, clarity 2002

# frozen run-once Ollama artifacts (REAL measured numbers; provenance recomputes the data/ "real" blocks from these)
def load_research(name):
    try:
        return json.load(open(ROOT / "_research" / "data" / name))
    except Exception:
        return None

# ── [P] PROVENANCE: curated data/ must equal the generator artifact it was lifted from ──────────
def provenance_checks(report):
    raw_heaps, raw_zipf, raw_pos, raw_cos = (load(RAW, "heaps_summary.json"), load(RAW, "zipf_summary.json"),
                                             load(RAW, "position_bias.json"), load(RAW, "cosine_examples.json"))
    rc = raw_cos["classic_pairs"][0]
    pp = primary_pair()
    checks = [
        ("heaps.beta",  CORP["heaps"]["beta"],          raw_heaps["beta"],   1e-9),
        ("vTypes",      CORP["vTypes"],                  raw_heaps["V_total"],0),
        ("heaps.r2",    CORP["heaps"]["r2"],             raw_heaps["r2"],     1e-9),
        ("zipf.slope",  CORP["zipf"]["loglogSlope"],     raw_zipf["loglog_slope_fit_top1000"], 1e-9),
        ("cos.cos",     pp["cos"],                       rc["cos"],           1e-9),
        ("cos.euclid",  pp["euclid"],                    rc["euclid"],        1e-5),
        ("click.gamma", CLICK["gamma"],                  raw_pos["gamma"],    1e-9),
        ("click.top1",  CLICK["top1Pct"],                raw_pos["top1_pct"], 1e-9),
        ("click.top3",  CLICK["top3Pct"],                raw_pos["top3_pct"], 1e-9),
    ]
    bad = 0
    for name, cur, raw, tol in checks:
        if abs(cur - raw) > tol:
            bad += 1
            report.append(("HARD", f"provenance({name}): data/ has {cur} but generator says {raw}"))
    if not bad:
        report.append(("OK", f"provenance: {len(checks)} curated values == generator artifacts ✓"))

# ── [P] PROVENANCE (L3/L4 self-consistency): the L3/L4 generators (gen_l3.py / gen_l4.py) emit the
#    curated data/ files directly, so there is no separate RAW artifact to diff against. Instead we
#    pin the cross-file invariants — the same flagship number lives in several data/ files (the
#    "-steps" companions, the goodhart/metrics overlap, the multiquery means), and they must agree.
#    A drift between two data/ files would otherwise let the deck cite a stale copy and still pass [C].
def provenance_l3l4(report):
    catdog   = {d["id"]: d for d in CATDOG["docs"]}
    cd_steps = {d["id"]: d for d in CATDOG_STEPS["docs"]}
    q2cells  = {(c["doc"], c["t"]): c for c in Q2_STEPS["cells"]}
    q2docs   = {d["id"]: d for d in Q2["docs"]}
    checks = [
        # cat/dog flagship: final idf and per-doc scores must equal the -steps companion's intermediates
        ("catdog.idf.cat", CATDOG["idf"]["cat"],        CATDOG_STEPS["idfSteps"]["cat"]["idf"], 1e-9),
        ("catdog.idf.dog", CATDOG["idf"]["dog"],        CATDOG_STEPS["idfSteps"]["dog"]["idf"], 1e-9),
        ("catdog.D1.sum",  catdog["D1"]["bm25Score"],   cd_steps["D1"]["docSum"],               1e-9),
        ("catdog.D2.sum",  catdog["D2"]["bm25Score"],   cd_steps["D2"]["docSum"],               1e-9),
        ("catdog.D3.sum",  catdog["D3"]["bm25Score"],   cd_steps["D3"]["docSum"],               1e-9),
        # nasa/shuttle: final idf + winning-doc score must match the -steps idf pieces / cell weights
        ("q2.idf.nasa",    Q2["idf"]["nasa"],           Q2_STEPS["idfSteps"]["nasa"]["idf"],    1e-9),
        ("q2.idf.shuttle", Q2["idf"]["shuttle"],        Q2_STEPS["idfSteps"]["shuttle"]["idf"], 1e-9),
        ("q2.D2.score",    q2docs["D2"]["bm25Score"],   Q2_STEPS["winningDoc"]["rowSum"],       1e-9),
        ("q2.D2.shuttleW", q2cells[("D2","shuttle")]["weight"], 1.9842,                         1e-9),
        # PageRank: the worked iteration-1 update for B equals iterations[1][B] = finalVector index
        ("pr.B.update",    PAGERANK["workedUpdate"]["pr1"], PAGERANK["iterations"][1][1],       1e-9),
        ("pr.finalB",      PAGERANK["final"]["B"],       PAGERANK["finalVector"][1],             1e-9),
        # binary nDCG: l4-metrics.json (honest/gamed) must equal the l4-goodhart-steps.json worked terms
        ("ndcg.honest",    METRICS["ndcg"],              GOODHART["honest"]["ndcg"],             1e-9),
        ("ndcg.gamed",     METRICS["gamed"]["ndcg"],     GOODHART["gamed"]["ndcg"],              1e-9),
        ("ndcg.idcg",      METRICS["idcg"],              GOODHART["idcg"],                       1e-9),
        # MRR/MAP: the published means must equal the mean of the two per-query values
        ("mrr.mean",       MULTIQ["mrr"],     round((MULTIQ["q1"]["rr"]+MULTIQ["q2"]["rr"])/2, 4), 1e-9),
        ("map.mean",       MULTIQ["map"],     round((MULTIQ["q1"]["ap"]+MULTIQ["q2"]["ap"])/2, 4), 1e-4),
        # significance: the CI endpoints must equal meanDiff ± (tCrit·SE) from the ciHalfWidth block
        ("ci.lo",  SYSTEMS["ci95"][0], round(SYSTEMS["meanDiff"]-SYSTEMS["ciHalfWidth"]["halfWidth"],4), 1e-4),
        ("ci.hi",  SYSTEMS["ci95"][1], round(SYSTEMS["meanDiff"]+SYSTEMS["ciHalfWidth"]["halfWidth"],4), 1e-4),
        # A/B: relative lift = absolute lift / control CTR
        ("ab.lift", ONLINE["abTest"]["relativeLiftPct"],
                    round(100*ONLINE["abTest"]["absoluteLift"]/ONLINE["abTest"]["control"]["ctr"], 1), 1e-6),
        # interleaving: per-query credits must sum to the published totals
        ("il.totalA", ONLINE["interleaving"]["totalCreditA"],
                      sum(q["creditA"] for q in ONLINE["interleaving"]["queries"]), 0),
        ("il.totalB", ONLINE["interleaving"]["totalCreditB"],
                      sum(q["creditB"] for q in ONLINE["interleaving"]["queries"]), 0),
        # compression: varbyte total bytes = number of gaps (each gap <128 → 1 byte)
        ("zip.bytes", COMPRESS["varbyteBytesTotal"], len(COMPRESS["gaps"]), 0),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L3L4({name}): data/ files disagree — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L3L4: {len(checks)} cross-file invariants consistent ✓"))

# ── [P] PROVENANCE (L5/L6 self-consistency): like the L3/L4 generators, gen_l5/gen_l6 emit data/
#    directly, so we pin cross-file invariants instead of RAW diffs. Two kinds:
#      (a) the SAME cosine lives in two files — l5-embeddings.json's cat-pair cosines are reused
#          verbatim by l6-contrastive.json; a drift between the copies must fire.
#      (b) a derived/structural identity inside one file — InfoNCE loss = −log(p⁺), √d_k = √(d_k),
#          analogy answerCos = top[0].cos, and each softmax attention row sums to 1.
#    Plus two data-only PINS: the triplet margin (0.2) and the gender-direction cosine (0.597) are
#    NEVER displayed numerically in the deck (only symbolic), so the gate cannot reach them via a [C]
#    claim — we pin them here so a silent edit to those data/ numbers is still caught.
def provenance_l5l6(report):
    embp = {(p["a"], p["b"]): p["cos"] for p in EMB["pairs"]}
    co   = CONTRA["sims"]
    checks = [
        # (a) shared cosines: l5-embeddings.json ↔ l6-contrastive.json (cat anchor reused)
        ("l5l6.cat·dog", embp[("cat", "dog")],      co["positives"]["dog"],      1e-9),
        ("l5l6.cat·kit", embp[("cat", "kitten")],   co["positives"]["kitten"],   1e-9),
        ("l5l6.cat·air", embp[("cat", "airplane")], co["negatives"]["airplane"], 1e-9),
        # (b) structural identities
        ("infonce.loss",  CONTRA["infoNCE"]["loss"], round(-math.log(CONTRA["infoNCE"]["pPositive"]), 4), 1e-4),
        ("attn.sqrtdk",   ATTN["sqrtdk"],            math.sqrt(ATTN["d_k"]),      1e-9),
        ("analogy.answer", EMB["analogy"]["answerCos"], EMB["analogy"]["top"][0]["cos"], 1e-9),
        # softmax rows are distributions → each sums to 1 (tol absorbs the 3-dp display rounding)
        ("attn.rowsum0",  sum(ATTN["weights"][0]),   1.0, 2e-3),
        ("attn.rowsum1",  sum(ATTN["weights"][1]),   1.0, 2e-3),
        ("attn.rowsum2",  sum(ATTN["weights"][2]),   1.0, 2e-3),
        # data-only pins (no deck display path) — margin 0.2 and gender-direction cosine 0.597
        ("contra.margin", CONTRA["margin"],          0.2,   1e-9),
        ("emb.genderDir", EMB["genderDirectionCos"], 0.597, 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L5L6({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L5L6: {len(checks)} cross-file/structural invariants consistent ✓"))

# ── [P] PROVENANCE (L5 GloVe + t-SNE-math self-consistency): gen_l5 emits these data/ files directly,
#    so (as with L3/L4 and L5/L6) we pin cross-file + structural invariants instead of a RAW diff. The
#    new l5-glove.json / l5-tsne-math.json carry many internal numbers the deck never displays (the
#    full worked dot/bias decomposition, the σ↔β↔perplexity tuning, the symmetrised joint P, the KL
#    summands, the gradient). A silent edit to any of those would not be caught by a [C] deck claim, so
#    we anchor them here. Two flagship "data-only PINS" the prompt calls out — the GloVe the·king worked
#    pair (model 1.654 vs log X 1.658, NEVER shown numerically) and the t-SNE entropy log₂5≈2.322 bits
#    (perplexity = 2^entropy, also not displayed) — live here as their only verification path.
def provenance_l5_glove_tsne(report):
    g, t = GLOVE, TSNE
    wk = {(w["i"], w["j"]): w for w in g["worked"]}
    kq, tk, cd = wk[("king", "queen")], wk[("the", "king")], wk[("cat", "dog")]
    c = t["conditional"]
    P, Q = t["joint"]["P"], t["lowD"]["Q"]
    near, far = t["worked"]["near"], t["worked"]["far"]
    # KL(P‖Q) recomputed from the symmetrised joint P and the Student-t Q (the deck shows only 0.0411)
    klRecomp = sum(P[i][j] * math.log(P[i][j] / Q[i][j])
                   for i in range(len(P)) for j in range(len(P)) if i != j and P[i][j] > 0 and Q[i][j] > 0)
    checks = [
        # ── GloVe worked-pair structural identities (model = dot+b_i+b̃_j; log X = ln X; residual) ──
        ("glove.kq.logX",   kq["logX"],  math.log(kq["X"]),               1e-3),
        ("glove.kq.model",  kq["model"], kq["dot"] + kq["bi"] + kq["bj"], 1e-3),
        ("glove.kq.resid",  kq["residual"], kq["model"] - kq["logX"],     1e-3),
        ("glove.cd.model",  cd["model"], cd["dot"] + cd["bi"] + cd["bj"], 1e-3),
        # the·king worked pair — DATA-ONLY PIN (deck shows it only symbolically, never the numbers)
        ("glove.tk.model",  tk["model"], 1.654,                           1e-3),
        ("glove.tk.logX",   tk["logX"],  1.6582,                          1e-3),
        ("glove.tk.modelId",tk["model"], tk["dot"] + tk["bi"] + tk["bj"], 1e-3),
        # loss collapse: dropPct = 100·(1−after/before); endpoints == the history series ends
        ("glove.dropPct",   g["loss"]["dropPct"], round(100*(1 - g["loss"]["after"]/g["loss"]["before"]), 2), 1e-2),
        ("glove.lossBefore",g["loss"]["before"],  g["loss"]["history"][0]["loss"],  1e-9),
        ("glove.lossAfter", g["loss"]["after"],   g["loss"]["history"][-1]["loss"], 1e-9),
        # f(x) caps at 1 once x reaches x_max (the green "capped at 1" line in the deck)
        ("glove.fCap",      next(p["f"] for p in g["fCurve"] if p["x"] == g["xMax"]), 1.0, 1e-9),
        # ── t-SNE σ↔β↔perplexity↔entropy tuning identities ──
        ("tsne.rowSum",     sum(c["pRow"]),  1.0,                         1e-6),
        ("tsne.perpEntropy",c["perplexity"], 2 ** c["entropyBits"],       1e-3),
        ("tsne.entropyLog2",c["entropyBits"],math.log2(c["perplexity"]),  1e-3),  # entropy = log₂(perplexity)=2.322 bits
        ("tsne.sigmaBeta",  c["sigma"],      1/math.sqrt(2*c["beta"]),    1e-3),
        ("tsne.betaSigma",  c["beta"],       1/(2*c["sigma"]**2),         1e-4),
        # joint P symmetric + normalised; anchorRow is row 0 of P
        ("tsne.jointSym",   P[0][2],         P[2][0],                     1e-9),
        ("tsne.jointSum",   sum(sum(r) for r in P), 1.0,                  1e-6),
        ("tsne.anchorRow",  t["joint"]["anchorRow"][2], P[0][2],          1e-9),
        # worked near/far entries must equal the array cells the deck reads (cat→dog, cat→throne)
        ("tsne.near.d2",    near["d2_highD"], t["highD"]["anchorSqDist"][2], 1e-3),
        ("tsne.near.pcond", near["p_j_given_i"], c["pRow"][2],            1e-9),
        ("tsne.near.pjoint",near["p_ij_joint"],  P[0][2],                 1e-9),
        ("tsne.near.q",     near["q_ij"],        Q[0][2],                 1e-9),
        ("tsne.far.d2",     far["d2_highD"],  t["highD"]["anchorSqDist"][8],  1e-3),
        ("tsne.far.pjoint", far["p_ij_joint"], P[0][8],                   1e-9),
        # KL field == recompute from P,Q; gradient anchor magnitude == |anchor vector|; all[0]==anchor
        ("tsne.kl",         t["kl"],         round(klRecomp, 6),          1e-4),
        ("tsne.gradMag",    t["gradient"]["anchorMag"], round(math.hypot(*t["gradient"]["anchor"]), 6), 1e-5),
        ("tsne.gradAnchor", t["gradient"]["all"][0][0], t["gradient"]["anchor"][0], 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L5GT({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad:
        report.append(("OK", f"provenance-L5GT: {len(checks)} GloVe+t-SNE cross-file/structural invariants consistent ✓"))

# ── [P] PROVENANCE (L2 tokenizer-compare self-consistency): gen_l2_tokenizers.py emits data/ directly
#    (a Book widget — no deck display path), so we pin the same kind of cross-file + structural
#    invariants as L3/L4/L5. The flagship facts are the FOUR token counts for the one sample input and
#    the rare/compound word `unhappiness`'s segmentation per cutter. We verify:
#      (a) each tokenizer's published count == len(its token list)  [the count can't drift from data];
#      (b) the `counts` flat map == the per-tokenizer count  [the two copies in the file must agree];
#      (c) the ranking is sorted fewest→most AND matches the canonical spread BPE 7 < WP 9 < Uni 13 <
#          byte-BPE 35  [the "fewer = more efficient" story is the whole point of the widget];
#      (d) the rare word `unhappiness` segments as the four KNOWN splits (data-only PINS: never shown in
#          a deck, so a silent edit to the generator's corpus/vocab is only caught here).
TOK_COUNTS = {"BPE": 7, "WordPiece": 9, "Unigram": 13, "Byte-level BPE": 35}
TOK_UNHAPPY = {                                   # the sample word's per-cutter segmentation (the divergence)
    "BPE":            ["un", "happiness"],
    "WordPiece":      ["un", "##h", "##app", "##iness"],
    "Unigram":        ["un", "happi", "ne", "s", "s"],
    "Byte-level BPE": ["Ġ", "u", "n", "h", "a", "p", "p", "i", "n", "e", "s", "s"],  # Ġ u n h a p p i n e s s
}
def _tok_unhappy(t):
    pw = next(p for p in t["perWord"] if p["word"] == "unhappiness")
    return pw["tokens"] if "tokens" in pw else [pp["piece"] for pp in pw["pieces"]]
def provenance_l2_tokenizers(report):
    by = {t["name"]: t for t in TOK["tokenizers"]}
    rank_by = {r["name"]: r for r in TOK["ranking"]}
    bad = 0
    # (a)+(b): count == len(tokens) == counts-map == ranking-count, per cutter; AND == the canonical value
    for name, want in TOK_COUNTS.items():
        t = by[name]
        for label, got in [("count==len", t["count"] == len(t["tokens"])),
                           ("counts-map", TOK["counts"][name] == t["count"]),
                           ("ranking-count", rank_by[name]["count"] == t["count"]),
                           ("canonical", t["count"] == want)]:
            if got is not True and got != True:
                bad += 1
                report.append(("HARD", f"provenance-L2TOK({name}/{label}): token count broke "
                                       f"(count={t['count']}, len={len(t['tokens'])}, want {want})"))
    # (c): ranking sorted fewest→most and the spread endpoints match
    rc = [r["count"] for r in TOK["ranking"]]
    if rc != sorted(rc):
        bad += 1; report.append(("HARD", f"provenance-L2TOK(rank-order): ranking not fewest→most: {rc}"))
    if (TOK["spread"]["min"], TOK["spread"]["max"]) != (rc[0], rc[-1]):
        bad += 1; report.append(("HARD", f"provenance-L2TOK(spread): {TOK['spread']} ≠ ranking ends {rc[0]}…{rc[-1]}"))
    # (d): the rare word `unhappiness` segmentation per cutter (data-only pins)
    for name, want in TOK_UNHAPPY.items():
        got = _tok_unhappy(by[name])
        if got != want:
            bad += 1
            report.append(("HARD", f"provenance-L2TOK({name}/unhappiness): segmentation drifted — "
                                   f"{got} vs {want}"))
    if not bad:
        n = len(TOK_COUNTS) * 4 + 2 + len(TOK_UNHAPPY)
        report.append(("OK", f"provenance-L2TOK: {n} tokenizer-compare count/ranking/segmentation invariants consistent "
                             f"(BPE {TOK_COUNTS['BPE']} < WordPiece {TOK_COUNTS['WordPiece']} < "
                             f"Unigram {TOK_COUNTS['Unigram']} < byte-BPE {TOK_COUNTS['Byte-level BPE']}) ✓"))

# ── [P] PROVENANCE (L5/L6 ENRICHMENT cross-file + structural): the new trajectory data files the
#    re-layout introduced (l5-word2vec-train, l5-umap, l5-glove.trajectory, l6-stack-layers,
#    l6-contrastive-traj) carry many internal frames the deck only shows the ENDPOINTS of. We pin the
#    cross-file identities so an enrichment number cannot drift between files (and still pass [C]):
#      • the GloVe ANIMATION trajectory's first/last frame loss == the canonical static loss before/after
#        (18.0391 / 0.005) — the animated curve must land on the same endpoints the inset prints;
#      • the InfoNCE optimisation trajectory's TUNED endpoint == the canonical InfoNCE state in
#        l6-contrastive.json: loss 0.1191, p⁺ 0.8877, and all four tuned cosines (kitten/airplane/
#        computer/france) — the animation must converge to the deck's exact final numbers;
#      • word2vec/SGNS: related pairs end TIGHTER than unrelated (the whole point of the slide), the
#        separation ratio == unrelated/related mean dist, the loss endpoints == the history-series ends,
#        and the dropPct identity; the worked SGNS step's negatives all push apart (positive σ/grad);
#      • UMAP tightness endpoints == the snapshot series ends; DistilBERT cross-sense final == last layer.
def provenance_enrichment(report):
    g, w, u, s, ct = GLOVE, W2V, UMAP, STACK, CTRAJ
    tr = g["trajectory"]
    tuned = next(c for c in ct["checkpoints"] if c["name"] == "tuned")
    ss = w["similaritySummary"]
    snap = {sn["epoch"]: sn for sn in u["snapshots"]}
    ck = {c["name"]: c for c in ct["checkpoints"]}
    checks = [
        # GloVe animation trajectory ↔ canonical static loss endpoints (18.0391 / 0.005)
        ("glove.traj.lossBefore", tr["frames"][0]["loss"],  g["loss"]["before"], 1e-9),
        ("glove.traj.lossAfter",  tr["frames"][-1]["loss"], g["loss"]["after"],  1e-9),
        # InfoNCE optimisation trajectory TUNED endpoint ↔ l6-contrastive.json canonical final state
        ("ctraj.tuned.loss",   tuned["loss"],              CONTRA["infoNCE"]["loss"],      1e-9),
        ("ctraj.tuned.pPos",   tuned["pPositive"],         CONTRA["infoNCE"]["pPositive"], 1e-9),
        ("ctraj.tuned.kitten", tuned["cosines"]["kitten"], CONTRA["sims"]["positives"]["kitten"], 1e-9),
        ("ctraj.tuned.airplane",tuned["cosines"]["airplane"],CONTRA["sims"]["negatives"]["airplane"],1e-9),
        ("ctraj.tuned.computer",tuned["cosines"]["computer"],CONTRA["sims"]["negatives"]["computer"],1e-9),
        ("ctraj.tuned.france", tuned["cosines"]["france"], CONTRA["sims"]["negatives"]["france"],  1e-9),
        # the lossCurve summary == the per-checkpoint losses (untuned/mid/tuned), in order
        ("ctraj.curve.untuned", ct["lossCurve"][0],  ck["untuned"]["loss"], 1e-9),
        ("ctraj.curve.mid",     ct["lossCurve"][1],  ck["mid"]["loss"],     1e-9),
        ("ctraj.curve.tuned",   ct["lossCurve"][2],  ck["tuned"]["loss"],   1e-9),
        # word2vec/SGNS: loss endpoints == history-series ends; dropPct identity
        ("w2v.lossBefore", w["loss"]["before"], w["loss"]["history"][0]["loss"],  1e-9),
        ("w2v.lossAfter",  w["loss"]["after"],  w["loss"]["history"][-1]["loss"], 1e-9),
        ("w2v.dropPct",    w["loss"]["dropPct"], round(100*(1 - w["loss"]["after"]/w["loss"]["before"]), 2), 1e-2),
        # separation ratio == unrelated/related mean final distance
        ("w2v.sepRatio",   ss["separationRatio"],
                           round(ss["unrelatedMeanDistFinal"]/ss["relatedMeanDistFinal"], 3), 1e-2),
        # UMAP tightness endpoints == snapshot-series ends (0.1469 → 0.0612)
        ("umap.tight.init",  round(snap[0]["tightness"], 4),   round(u["snapshots"][0]["tightness"], 4),  1e-9),
        ("umap.tight.final", round(snap[500]["tightness"], 4), round(u["snapshots"][-1]["tightness"], 4), 1e-9),
        # DistilBERT cross-sense fan: final == the last block's cosine in the by-layer series
        ("stack.final",    s["finalCrossSenseCos"], s["crossSenseCosByLayer"][-1], 1e-9),
        # l6-contextual.json (the STANDALONE DistilBERT polysemy demo behind the Book ch.6 "bank" prose)
        # MUST agree with the stack run: its final cross-sense cos(bank_river, bank_money) == the stack's
        # last-block cosine — same DistilBERT, two generators, one number (both 0.6465). Ties the orphan in.
        ("ctx.crossSense", CTX["cosines"]["crossSense"], s["finalCrossSenseCos"], 1e-9),
        # the displayed 0.30 gap is the within−cross identity (0.9466 − 0.6465 = 0.3001); static is 1.0 by construction.
        ("ctx.gap",        CTX["cosines"]["gap"], round(CTX["cosines"]["withinSense"] - CTX["cosines"]["crossSense"], 4), 1e-9),
        ("ctx.staticSelf", CTX["staticBaseline"]["staticBankSelfCos"], 1.0, 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-ENR({name}): data/ disagree/invariant broken — {a} vs {b}"))
    # structural data-only pin: related pairs MUST end tighter than unrelated (the slide's whole claim);
    # and the worked SGNS step's negatives all push apart (positive σ on a negative ⇒ +grad). Never
    # displayed numerically, so this is their only verification path.
    if not ss["relatedTighter"] or not (ss["relatedMeanDistFinal"] < ss["unrelatedMeanDistFinal"]):
        bad += 1
        report.append(("HARD", f"provenance-ENR(w2v.tighter): related not tighter than unrelated — "
                               f'{ss["relatedMeanDistFinal"]} vs {ss["unrelatedMeanDistFinal"]}'))
    if not all(neg["sigmoid"] > 0 and "push apart" in neg["gradSign"] for neg in w["workedStep"]["negatives"]):
        bad += 1
        report.append(("HARD", "provenance-ENR(w2v.workedStep): a negative-sample grad does not push apart"))
    # contextual polysemy demo: the whole claim is within-sense > cross-sense (context splits the senses).
    if not (CTX["cosines"]["withinSense"] > CTX["cosines"]["crossSense"]):
        bad += 1
        report.append(("HARD", "provenance-ENR(ctx.split): within-sense not > cross-sense — "
                               f'{CTX["cosines"]["withinSense"]} vs {CTX["cosines"]["crossSense"]}'))
    if not bad:
        report.append(("OK", f"provenance-ENR: {len(checks) + 3} enrichment cross-file/structural invariants "
                             f"consistent (GloVe 18.0391→0.005 · InfoNCE traj→0.1191/p⁺0.8877 · "
                             f"w2v related tighter · UMAP 0.1469→0.0612 · DistilBERT fan→0.6465 · "
                             f"l6-contextual 0.6465<0.9466) ✓"))

def _nce_softmax(logits):
    m = max(logits); e = [math.exp(x - m) for x in logits]; s = sum(e)
    return [v / s for v in e]

# ── [P] L6 slide-48 InfoNCE softmax BARS are DATA-BOUND (R8: not hand-tuned magic coords) ──────────
# The 12 softmax bars (4 candidates × 3 checkpoints) on the "InfoNCE loss = 0.1191" slide are
# softmax(checkpoints[k].logits)·H per checkpoint, straight from data/l6-contrastive-traj.json. Before
# this they were 12 hardcoded <rect height> values with NO gate tying them to the data — editing a bar,
# or drifting the trajectory logits, could silently diverge. This binds them: (a) data self-consistency
# — softmax(logits)[kitten] == pPositive and loss == −ln(p⁺) per checkpoint (pins logits↔p⁺↔loss); and
# (b) deck binding — each bar <rect height> == softmax(logits)·H (H=220, declared in the slide as "×220"),
# scoped to the .nce-slide and matched by x-coord (925 kitten / 1075 airplane / 1225 computer / 1375
# france), 3 per x in checkpoint order (untuned/mid/tuned = steps 1/2/3). The deck CANNOT be makeScale'd
# at runtime (L6 has no DeckLayout) — this provenance check is the data-traceability the render would need.
def provenance_l6_nce(report, l6_html):
    H = 220.0
    cks = CTRAJ["checkpoints"]                 # [untuned, mid, tuned] in order == deck steps 1/2/3
    probs = [_nce_softmax(c["logits"]) for c in cks]
    bad = 0
    # (a) data self-consistency: the logits PRODUCE the stored pPositive and loss.
    for c, p in zip(cks, probs):
        if abs(p[0] - c["pPositive"]) > 5e-4:
            bad += 1; report.append(("HARD", f"provenance-L6NCE({c['name']}.pPos): softmax(logits)[kitten] {p[0]:.5f} != pPositive {c['pPositive']}"))
        if abs(-math.log(p[0]) - c["loss"]) > 1e-3:
            bad += 1; report.append(("HARD", f"provenance-L6NCE({c['name']}.loss): −ln(p⁺) {-math.log(p[0]):.4f} != loss {c['loss']}"))
    # (b) deck binding: each bar height == softmax·H (scoped to the nce-slide, matched by x in step order).
    sec = re.search(r'<section class="slide nce-slide".*?</section>', l6_html or "", re.S)
    nbar = 0
    if sec:
        html = sec.group()
        for x, name, idx in [("925", "kitten", 0), ("1075", "airplane", 1), ("1225", "computer", 2), ("1375", "france", 3)]:
            hs = [float(h) for h in re.findall(r'<rect x="%s"[^>]*height="([\d.]+)"' % x, html)]
            if len(hs) != 3:
                bad += 1; report.append(("HARD", f"provenance-L6NCE(bars.{name}): expected 3 <rect x={x}> bar heights, found {len(hs)}")); continue
            for k in range(3):
                want = probs[k][idx] * H; nbar += 1
                if abs(hs[k] - want) > 0.6:
                    bad += 1; report.append(("HARD", f"provenance-L6NCE(bar.{name}.{cks[k]['name']}): height {hs[k]} != softmax·{H:.0f} {want:.1f} (logits {cks[k]['logits']})"))
    if not bad:
        tail = f"{nbar} bars == softmax(traj.logits)·{H:.0f}; " if sec else "(deck not built — bar binding skipped) "
        report.append(("OK", f"provenance-L6NCE: {tail}logits↔p⁺↔loss consistent across untuned/mid/tuned ✓"))

# ── [C] CLAIMS: every grounded value read from data/, asserted present+matching in the deck ─────
def claims():
    pp = primary_pair()
    return [
        dict(id="heaps β",   deck="L2", value=round(CORP["heaps"]["beta"], 2), tol=0.02,
             anchor=r"(?:β|\\beta)\s*(?:≈|\\approx|=)\s*([\d.]+)", must=True),
        dict(id="V types",   deck="L2", value=CORP["vTypes"], tol=0.5,
             anchor=r"\b(94[\s,]?287)\b", must=True),
        dict(id="zipf slope",deck="L2", value=round(CORP["zipf"]["loglogSlope"], 2), tol=0.03,
             anchor=r"([−-]1\.0\d+)", must=True),
        dict(id="heaps R²",  deck="L2", value=round(CORP["heaps"]["r2"], 3), tol=0.002,
             anchor=r"R(?:²|\^?2)\s*=\s*(0\.99\d)", must=True),
        dict(id="euclid",    deck="L2", value=round(pp["euclid"], 2), tol=0.05,
             anchor=r"(?:sqrt\{162\}|√162)\\?\s*(?:≈|\\approx)\s*([\d.]+)", must=True),
        dict(id="γ pos-bias",deck="L1", value=CLICK["gamma"], tol=0.005,
             anchor=r"(?:γ|\\gamma)\s*(?:≈|=|\\?\s*=)?\s*(0\.9\d)", must=True),
        dict(id="top-1 %",   deck="L1", value=CLICK["top1Pct"], tol=0.2,
             anchor=r"\b(32\.3)\s*%", must=True),
        dict(id="top-3 %",   deck="L1", value=CLICK["top3Pct"], tol=0.2,
             anchor=r"\b(60\.6)\b", must=True),
    ] + l3_claims() + l4_claims() + l5_claims() + l6_claims() + l7_deck_claims() + l8_deck_claims() + l9_deck_claims() + l10_deck_claims() + l11_deck_claims() + l12_deck_claims() + l13_deck_claims() + l14_deck_claims() + l15_deck_claims() + l16_deck_claims() + l17_deck_claims() + l18_deck_claims() + l19_deck_claims() + l20_deck_claims()

# ── L16 "Late Chunking" — every displayed ≥2-decimal value, pinned deck == data/ ─────────────────────
#    Anchors are DIGIT LOCATORS (RU comma OR EN dot), not context sniffers: the deck prints each number
#    twice (a `lang="ru"` span with a comma and a `lang="en"` span with a dot), and a context anchor would
#    have to be written twice and would rot on any re-wording. Drift is still caught in both directions —
#    if data/ moves, `value` moves and the located digits mismatch (DRIFT, HARD); if the SLIDE is edited,
#    the locator finds nothing (NOT FOUND, HARD, because must=True). ──
def l16_deck_claims():
    ac = {r["n"]: r for r in L16B["acme"]["rows"]}
    be, rep, nc = L16B["beir"], L16B["replication"], {r["dataset"]: r for r in L16B["noChunking"]["rows"]}
    ber = L16B["berlin"]["rows"]
    lit = lambda s: r'(?<![\d.,])(' + re.escape(s).replace(r'\.', '[.,]') + r')(?![\d])'
    C = lambda id, value, s, tol=1e-4: dict(id="L16 " + id, deck="L16", value=value, tol=tol,
                                            anchor=lit(s), must=True)
    return [
        # ── Table 4 (ACME), all five rows — the three cells per row the deck now prints in full ──
        C("acme r1 naive",      ac[1]["naive"],      "0.8505"),
        C("acme r1 late",       ac[1]["late"],       "0.8305"),
        C("acme r1 contextual", ac[1]["contextual"], "0.8069"),
        C("acme r2 late",       ac[2]["late"],       "0.8516"),
        C("acme r3 late",       ac[3]["late"],       "0.8424"),
        C("acme r3 contextual", ac[3]["contextual"], "0.8546"),
        C("acme r5 late",       ac[5]["late"],       "0.8022"),
        # ── Fig.1/Table 1 (Berlin) + the Δ column the lift slide now carries ──
        C("berlin naming naive", ber[0]["naive"], "0.8486"),
        C("berlin naming late",  ber[0]["late"],  "0.8495"),
        C("berlin city naive",   ber[2]["naive"], "0.7535"),
        C("berlin city late",    ber[2]["late"],  "0.8498"),
        C("berlin city delta",   round(ber[2]["late"] - ber[2]["naive"], 4), "0.0963"),
        # ── the gap law (widget W2 + the by-hand table) ──
        C("gap law s=128", L16CH["gapLaw"]["orphanFraction"][2], "0.3125"),
        # ── Merola & Singh 2025 (arXiv:2504.19754) — the independent replication ──
        C("repl passages late", rep["passages"]["late"],      "0.503"),
        C("repl h2h late",      rep["headToHead"]["late"],    "0.309"),
        C("repl h2h ctx",       rep["headToHead"]["contextual"], "0.317"),
        # ── the No-Chunking column (v1 + the repository README) ──
        C("quora identity",  nc["Quora"]["naive"],     "87.19"),
        C("treccovid late",  nc["TRECCOVID"]["late"],  "64.70"),
        C("treccovid none",  nc["TRECCOVID"]["none"],  "65.18"),
        C("nfcorpus late",   nc["NFCorpus"]["late"],   "29.98"),
        C("nfcorpus none",   nc["NFCorpus"]["none"],   "30.40"),
        # ── §4.1's rounded prose vs its own Table 2, recomputed ──
        C("beir semantic delta recomputed", be["semanticRecomputedDelta"], "1.41",   1e-3),
        # ── Table 3 (span pooling), Table 5 (chunking-vs-not), Anthropic's price ──
        C("span pooling worst", abs(L16B["spanPooling"]["worstGain"]), "0.02"),
        # S10: Table 3 has THREE regressions; printing only the mildest read as "never worse"
        C("span pooling regression 1", abs(L16B["spanPooling"]["regressions"][0]), "0.28"),
        C("span pooling regression 2", abs(L16B["spanPooling"]["regressions"][1]), "0.09"),

        C("chunking rel gain",  L16B["context"]["chunkHelpsRelGainPct"], "24.47", 1e-3),
        C("anthropic usd/Mtok", L16B["anthropic"]["usdPerMillionDocTokens"], "1.02", 1e-3),
    ]


# ── [C] L18 DECK CLAIMS: every displayed ≥2-dp value in "The Curved Map", pinned deck == data/.
#    L18 used to be baseline-frozen at 17 un-gated numbers, which is exactly how it shipped SIX wrong
#    figures/attributions (the CSLS row was cross-lingual SENTENCE retrieval mislabelled as word-translation
#    P@1; SimCSE's supervised gain was compared against the UNSUPERVISED previous best; Su 2021's 71.34 is
#    the transductive "(target)" row; Radovanović's skews are Euclidean, k=5, from a footnote; Ethayarajh's
#    0.99 is read off a figure, not written; and the toy's "all-but-the-top" was not all-but-the-top).
#    Freezing a count catches NEW drift and nothing else. Gating the values catches both — and it is what
#    lets the deck grow from 49 to 76 slides without the coverage-guard turning into a rubber stamp.
#
#    Anchors are DIGIT LOCATORS (RU comma OR EN dot), the L16/L20 pattern: every number is printed twice,
#    once per language span, so a context anchor would have to be written twice and would rot on any
#    re-wording. If data/ moves, `value` moves and the located digits mismatch (DRIFT, HARD); if the slide
#    is edited away, the locator finds nothing (NOT FOUND, HARD, because must=True). Values marked `abs`
#    are displayed without their sign (a correlation, a Δ, a mean activation). Values marked `derived` are
#    differences the deck states in prose — computed here from data/, never re-typed. ──
def l18_deck_claims():
    A, W, H = GEOM18["anisotropy"], GEOM18["whitenToy"], GEOM18["hubToll"]
    OR = GEOM18["orthogonality"]
    HB, D = GEOM18["hubness"], GEOM18["anisotropyDial"]
    F = H["flipExample"]
    BA, BH, BF, BL = (BENCH18[k] for k in ("anisotropy", "hubness", "fixes", "lexicalLeak"))
    REP, ROG, ISO, MOD = BA["replication"], BA["rogueDims"], BA["isoScore"], BA["modern2026"]
    SU, SC, WH, CS, QB, MU, MRL = (BF[k] for k in ("bertWhiteningStsB", "simcse", "whiteningHurts",
                                                   "cslsSentRetrievalP1", "qbNorm", "muViswanathD", "matryoshka"))
    dial = lambda snr, dim: next(c for c in D["cells"] if c["snr"] == snr and c["dim"] == dim)["meanPairCos"]
    lit = lambda s: r'(?<![\d.,])(' + re.escape(s).replace(r'\.', '[.,]') + r')(?![\d])'
    C = lambda id, value, s, tol=1e-4: dict(id="L18 " + id, deck="L18", value=value, tol=tol,
                                            anchor=lit(s), must=True)
    return [
        # ── act 01 · the cone toy, its HONEST all-but-the-top, and the dial behind widgets/cone-dial ──
        C("toy rawCos",      A["rawCos"],            "0.8985"),
        C("toy centeredCos", abs(A["centeredCos"]),  "0.0323"),
        C("toy abtCos",      abs(A["allButTopCos"]), "0.0313"),   # HONEST ABT (was −0.0352, see plan F1)
        C("toy PC1·cone",    A["pc1ConeAlign"],      "0.9997"),
        C("dial snr mid",    D["snrGrid"][3],        "1.2247"),   # cos 0.6 ⇒ c/σ = √(0.6/0.4)
        C("dial snr last",   D["snrGrid"][7],        "9.9499"),   # cos 0.99 ⇒ c/σ = √99
        C("dial cos mid",    dial(D["snrGrid"][3], D["canonicalDim"]), "0.61", 5e-3),
        # ── act 01 · the L9↔L18 misconception, MEASURED (late review §1): L2/L9's uniform [0,1]^d cloud
        #    is itself a cone (mean pair cosine → 3/4 at every d), the gaussian N(0,I) is what actually
        #    goes orthogonal (mean ≈ 0, spread 1/√d). The cv 0.4784 → 0.0187 on that slide stays, but is
        #    now labelled for what L9 measured: EUCLIDEAN distance concentration (gated by l9_deck_claims). ──
        C("ortho uniform d2",    OR["uniform"][0]["meanCos"],  "0.8312"),
        C("ortho uniform d1000", OR["uniform"][3]["meanCos"],  "0.7496"),
        C("ortho uniform limit", OR["uniformLimit"],           "0.75"),
        C("ortho gauss maxabs",  OR["gaussianMaxAbsCos"],      "0.0065"),
        C("ortho gauss sd d2",   OR["gaussian"][0]["sdCos"],   "0.7072"),
        C("ortho gauss sd d1000", OR["gaussian"][3]["sdCos"],  "0.0317"),
        # ── act 01 · Timkey & van Schijndel 2021 Table 1 — the per-model/per-layer replication ──
        C("timkey xlnet",    REP["xlnetL11"],   "0.981"),
        C("timkey gpt2",     REP["gpt2Final"],  "0.885"),
        C("timkey roberta",  REP["robertaL12"], "0.745"),
        C("timkey gpt2 L11", REP["gpt2L11"],    "0.640"),
        C("timkey bert",     REP["bertL11"],    "0.506"),
        C("timkey bert 2dp", REP["bertL11"],    "0.51", 5e-3),    # the checklist rounds it
        C("timkey w2v",      REP["word2vec"],   "0.130"),
        C("timkey glove",    REP["glove"],      "0.104"),
        C("rogue mean act",  abs(ROG["otherDimsMeanAct"]), "0.084"),
        C("ethayarajh last", BA["gpt2Last"],    "0.99", 5e-3),    # also IsoScore's avg-cosine upper cell
        C("isoscore avgcos lo", ISO["avgCosLo"], "0.97"),
        C("isoscore e5-large",  MOD["e5Large"],  "0.2022"),
        # ── act 01 · Li 2020 Table 6 + Table 1 — the lexical leak and the frequency signature ──
        C("li raw",       abs(BL["corrLexical"]),      "50.49"),
        C("li gold",      abs(BL["corrGoldEdit"]),     "24.61"),
        C("li flow",      abs(BL["corrFlowInduced"]),  "28.01"),
        C("li ratio",     BL["ratio"],                 "2.05"),
        C("li norm rare", BL["normByFreq"]["normRare"], "1.45"),
        # ── act 02 · the four-cities whitening walk-through (exact arithmetic) ──
        C("whiten strangers raw", W["stages"]["raw"]["cosines"]["cos"][0], "0.9692"),
        C("whiten loosest raw",   W["stages"]["raw"]["cosines"]["min"],    "0.8824"),
        C("whiten sqrt lambda1",  round(math.sqrt(W["eigenvalues"][0]), 4), "2.8284"),
        # ── act 02 · Su 2021 Table 1 (transductive vs inductive) and Li 2020's flow gain ──
        C("su raw pooled",  SU["raw"],               "59.04"),
        C("su truly raw",   SU["trulyRawBertBase"],  "47.29"),
        C("su inductive",   SU["whitenedInductive"], "68.19"),
        C("su target",      SU["whitenedTarget"],    "71.34"),
        C("su sickr",       SU["sickRBefore"],       "63.75"),
        C("su transduction gap", round(SU["whitenedTarget"] - SU["whitenedInductive"], 2), "3.15"),  # derived
        C("flow avg gain",  BF["bertFlowAvgGain"],   "8.16"),
        # ── act 02 · SimCSE Table 5 — each row against ITS OWN baseline ──
        C("simcse prev unsup", SC["prevSotaUnsup"], "72.05"),
        C("simcse prev sup",   SC["prevSotaSup"],   "79.39"),
        C("simcse unsup",      SC["unsup"],         "76.25"),
        C("simcse sup",        SC["sup"],           "81.57"),
        C("simcse inflated",   round(SC["sup"] - SC["prevSotaUnsup"], 2), "9.52"),   # derived: the WRONG delta
        # ── act 02 · all-but-the-top's honest counter-cell, and the 2024–26 dose-response ──
        C("abt rg65 before", MU["rg65Before"], "76.96"),
        C("abt rg65 after",  MU["rg65After"],  "74.36"),
        C("whiten hurts me5", abs(WH["me5LargeInstruct"]), "5.18"),
        C("whiten hurts bge", abs(WH["bgeBaseEnV15"]),     "1.79"),
        # ── act 02 · Matryoshka: the trained prefix vs variance-ordered axes, and a published curve ──
        C("mrl 8d 1nn",  MRL["mrl8Nn"],  "62.19"),
        C("mrl svd 8d",  MRL["svd8Nn"],  "19.14"),
        C("nomic 768",   MRL["nomic768"], "62.28"),
        C("nomic 256",   MRL["nomic256"], "61.04"),
        C("nomic 64",    MRL["nomic64"],  "56.10"),
        # ── act 03 · Radovanović 2010 (footnote 5 / Fig. 1, S_{N₅}, n = 10 000, EUCLIDEAN) ──
        C("radov unif d3",    BH["skewUniform"]["d3"],   "0.121"),
        C("radov norm d3",    BH["skewNormal"]["d3"],    "0.118"),
        # The RU twin of these three renders as «1,541»/«2,055»/«5,445», which num() cannot tell from a
        # thousands group (1541). So they are pinned to the EN span explicitly instead of via lit().
        dict(id="L18 radov unif d20", deck="L18", value=BH["skewUniform"]["d20"], tol=1e-4, must=True,
             anchor=r'lang="en">(1\.541)<'),
        dict(id="L18 radov norm d20", deck="L18", value=BH["skewNormal"]["d20"], tol=1e-4, must=True,
             anchor=r'lang="en">(2\.055)<'),
        dict(id="L18 radov unif d100", deck="L18", value=BH["skewUniform"]["d100"], tol=1e-4, must=True,
             anchor=r'lang="en">(5\.445)<'),
        C("radov norm d100",  BH["skewNormal"]["d100"],  "19.21"),
        C("feldbauer skewmax", BH["reduction"]["skewMax"], "15.5188"),
        C("feldbauer skewmin", abs(BH["reduction"]["skewMin"]), "0.1156"),
        C("isoscore invariant", ISO["isoScoreAllRotations"], "0.216"),   # the same cloud, four rotations
        C("highway nytimes",   BH["highway"]["effectNytimes"], "0.9305"),
        # ── act 03 · our own reverse-kNN toy (Euclidean, n = 120, k = 5) ──
        C("toy skew d2",   HB["d2"]["skew"],           "0.0299"),   # also covers the rounded 0.03
        C("toy skew d20",  HB["d20"]["skew"],          "2.5904"),   # also covers the rounded 2.59
        C("toy corr d20",  HB["d20"]["corrToCentroid"], "0.81", 5e-3),
        # ── act 04 · the same cloud under CSLS, and the by-hand rank flip ──
        C("csls skew d20",   H["byDim"]["d20"]["csls"]["skew"], "0.3923"),
        C("flip d hub",      F["dHub"],  "4.8211"),
        C("flip r mean",     F["rMean"], "4.7083"),
        C("flip d alt",      F["dAlt"],  "5.0820"),
        C("flip r query",    F["rQuery"], "5.0559"),
        C("flip r hub",      F["rHub"],   "3.6884"),
        C("flip r alt",      F["rAlt"],   "5.5713"),
        C("flip csls hub",   F["cslsHub"], "0.8979"),
        C("flip csls alt",   abs(F["cslsAlt"]), "0.4631"),
        C("flip margin",     F["margin"], "1.3611"),
        C("flip r min",      F["rMin"],   "3.6305"),
        # the four intermediates of the by-hand CSLS line. They were INVISIBLE to the coverage-guard
        # until a raw "<" in that slide's KaTeX (\;<\;) was escaped to &lt; — the tag-stripper had been
        # swallowing the rest of the formula as if it were a tag. Gated now, so they cannot drift.
        C("flip 2d hub",     round(2 * F["dHub"], 4),              "9.6422"),
        C("flip r sum hub",  round(F["rQuery"] + F["rHub"], 4),    "8.7443"),
        C("flip 2d alt",     round(2 * F["dAlt"], 4),              "10.1640"),
        C("flip r sum alt",  round(F["rQuery"] + F["rAlt"], 4),    "10.6272"),
        C("flip d margin",   round(F["dAlt"] - F["dHub"], 4), "0.2609"),   # derived: the raw-distance edge
        # the DOUBLED distance edge — the step the slide used to leave invisible, so a student subtracting
        # 1.8829 − 0.2609 got 1.6220 and no printed number matched (late review §3). Now printed and gated.
        C("flip 2d margin",  round(2 * (F["dAlt"] - F["dHub"]), 4), "0.5218"),  # derived
        C("flip r margin",   round(F["rAlt"] - F["rHub"], 4), "1.8829"),   # derived: the density penalty
        # ── act 04 · QB-Norm's mechanism check (the skew of k-occurrences on REAL cosine embeddings) ──
        C("qbnorm skew after", QB["skewAfter"], "0.509"),
        # ── act 01 · IsoScore's punchline: the mean vector's coordinate range, i.e. distance from origin ──
        C("isoscore meanvec max", ISO["gpt2MeanVecMax"], "198.19"),
        # keep the CSLS headline pinned to the CORRECT task block (Table 3, sentence retrieval)
        C("csls sent nn",   CS["nn"],   "42.6", 5e-2),
        C("csls sent csls", CS["csls"], "66.1", 5e-2),
    ]


# ── L20 "Search in Russian" — the worked BM25 surface-vs-lemma inversion (data/l20-ru.json, gen_l20.py).
#    Every displayed ≥2-dp value is pinned deck==data here, so deck:L20 coverage stays 0 (like L14/L15). ──
def l20_deck_claims():
    b  = L20RU["bm25"]
    gw = b["lemma"]["goldWork"]      # [{t:"котёнок", idf, bm25}, {t:"играть", idf, bm25}]
    C = lambda id, value, anchor, tol=1e-4: dict(id="L20 " + id, deck="L20", value=value, tol=tol, anchor=anchor, must=True)
    return [
        C("surface distractor", b["surface"]["scores"]["d2_distractor"],
          r'&ldquo;дети играют во дворе&rdquo;</span></td><td class="cell-meh">(?:<span lang="ru">[^<]*</span><span lang="en">)?([\d.]+) &middot; #1'),   # 1.3608 (rank 1 surface, slide 18)
        C("lemma gold sum",     b["lemma"]["goldScore"],
          r'<td></td><td></td><td class="cell-good">(?:<span lang="ru"><strong>[^<]*</strong></span><span lang="en">)?<strong>([\d.]+)</strong>'),   # 1.3884 (lemma sum row, slide 19)
        C("lemma kitten idf",   gw[0]["idf"],                            r'котёнок</td><td>2</td><td>(?:<span lang="ru">[^<]*</span><span lang="en">)?([\d.]+)</span>?</td>'),     # 0.8755
        C("lemma kitten bm25",  gw[0]["bm25"],                           r'котёнок</td><td>2</td><td>(?:<span lang="ru">[^<]*</span><span lang="en">)?0\.8755</span>?</td><td>(?:<span lang="ru">[^<]*</span><span lang="en">)?([\d.]+)</span>?</td>'),  # 0.8594
    ] + l20_depth_claims()

# ── [C] L20 DEPTH PASS (2026-08): the deepened deck displays ~70 further grounded numbers — the cited
#    benchmark tables (fertility per tokenizer, the MTEB(rus, v1.1) leaderboard, MIRACL-ru, RusBEIR and
#    its length regime, Savoy 2009's MAP ladder) and the new MEASURED toys (the Snowball third pass, the
#    ё/е recall ladder). deck:L20's coverage baseline is 0, so every one of them must be gated.
#
#    HOW THESE ANCHORS WORK (and why they are honest): a table cell carries no stable textual neighbour —
#    the surrounding literals are RU/EN span pairs that shift whenever the wording is edited — so instead
#    of pinning a POSITION we pin the LITERAL, generated from the data/ value by _dec_pin(). The value
#    still comes from data/ and nowhere else; if data/ changes, the generated pattern no longer occurs in
#    the deck and the claim HARD-fails as NOT FOUND. That catches exactly what matters here (deck drifting
#    away from data/) at the cost of not localising WHICH cell drifted — a trade the older positional
#    anchors above still cover for the flagship worked example. _dec_pin accepts the RU comma and the EN
#    dot alike (the deck renders both), and `dp` is the DISPLAYED precision (75.2 → "75.20").
def _dec_pin(value, dp):
    """The DOT rendering of `value` at `dp` displayed decimals, pinned so no longer number contains it.

    Dot only, on purpose: every bilingual surface renders the EN (dot) form beside the RU (comma) one,
    and a captured "1,227" is genuinely ambiguous (RU decimal vs EN thousands) — pinning the dot keeps
    the check exact. The RU rendering is still WATCHED, by the coverage-guard, which canonicalises both.
    """
    i, f = f"{value:.{dp}f}".split(".")
    return r"(?<![\d.,])(" + i + r"\." + f + r")(?![\d])"

def l20_depth_claims():
    B, RU = L20B, L20RU
    F, LB, RL, MR, RB = B["fertility"], B["ruLeaderboard"], B["rusbeirLength"], B["miraclRu"], B["rusbeir"]
    SV, TW, YO = B["savoy2009"], RU["threeWay"], RU["yoLadder"]
    P = lambda id, value, dp, tol=1e-4: dict(id="L20 " + id, deck="L20", value=value, tol=tol,
                                             anchor=_dec_pin(value, dp), must=True)
    out = []
    # ── Act 1 · fertility per tokenizer (slides 12 / 25a) — the seven rows the deck shows ──────────
    for i in (0, 1, 2, 4, 5, 7, 8):
        r = F["rows"][i]
        tag = r["tokenizer"].split()[0]
        out += [P(f"fert {tag} en", r["en"], 3), P(f"fert {tag} ru", r["ru"], 3),
                P(f"fert {tag} premium", r["premium"], 2)]
    out += [P("byte premium", F["bytePremium"], 3), P("char premium", F["charPremium"], 3),
            P("cyrillic bytes/char", F["cyrillicBytesPerChar"], 3)]
    # ── Act 2 · the third pass + Savoy's MAP ladder ───────────────────────────────────────────────
    out += [P("stem gold score", TW["stem"]["goldScore"], 4),
            P("stem puppy score", TW["stem"]["scores"]["d4_puppy"], 4),
            P("stem kitten idf", TW["stem"]["goldWork"][0]["idf"], 4),
            P("lemma verb idf", TW["lemma"]["goldWork"][1]["idf"], 3),
            P("savoy none", SV["mapNone"], 4), P("savoy light", SV["mapLight"], 4),
            P("savoy snowball", SV["mapSnowball"], 4), P("savoy 4gram", SV["mapNgram4"], 4)]
    # ── Act 3 · MIRACL-ru, the leaderboard, RusBEIR and the length regime ─────────────────────────
    out += [P("miracl bm25", MR["ndcgBm25"], 3), P("miracl dense", MR["ndcgDense"], 3),
            P("miracl hybrid", MR["ndcgHybrid"], 3), P("miracl r@100 bm25", MR["recallBm25"], 3),
            P("miracl r@100 dense", MR["recallDense"], 3), P("miracl r@100 hybrid", MR["recallHybrid"], 3),
            P("miracl gain over bm25", MR["hybridOverBm25"], 3),
            P("miracl gain over dense", MR["hybridOverDense"], 3),
            P("mmarco bleu r2", B["mmarcoRu"]["bleuQualityR2"], 2),
            P("rusbeir bm25", RB["ndcgBm25"], 2), P("rusbeir bm25+rr", RB["ndcgBm25Rerank"], 2),
            P("rusbeir bgem3", RB["ndcgBgeM3"], 2), P("rusbeir bgem3+rr", RB["ndcgBgeM3Rerank"], 2),
            P("rusbeir mmarco-ru bm25", RB["mmarcoRuBm25"], 2),
            P("berta gap", LB["bertaGapToQwen8b"], 2)]
    for i in (0, 1, 2, 3, 5, 6, 7):                      # the 26a leaderboard table
        r = LB["rows"][i]
        tag = r["model"].split("/")[-1]
        out += [P(f"lb {tag} params", r["paramsB"], 3 if r["paramsB"] < 0.2 else 2),
                P(f"lb {tag} avg", r["avg"], 2), P(f"lb {tag} retrieval", r["retrieval"], 2)]
    for i in (8, 9, 10, 11, 12, 13):                     # retrieval-only mentions (26 / 28 / 31a)
        r = LB["rows"][i]
        out += [P(f"lb {r['model'].split('/')[-1]} retrieval", r["retrieval"], 2)]
    for w in RL["windows"]:                              # the length regime, 32b + 33 + 43b
        tag = w["window"]
        for k in ("bm25", "me5Large", "bgeM3", "frida"):
            if k in w:
                out += [P(f"len {tag} {k}", w[k], 2)]
    # ── Act 4 · ё statistics and the recall ladder (displayed to 3 dp) ────────────────────────────
    out += [P("yo share of letters", B["yoStats"]["yoShareOfLettersPct"], 3),
            P("yo share among yo+e", B["yoStats"]["yoShareAmongYoEPct"], 2),
            P("yo ladder raw", YO["ladder"]["raw"], 3, tol=1e-3),
            P("yo ladder both arms", YO["ladder"]["yoBoth"], 3, tol=1e-3),
            P("yo ladder + stem", YO["ladder"]["yoPlusStem"], 3, tol=1e-3),
            P("gost number", B["gost779"]["standardNumber"], 2)]
    # ── Act 2 · the price of context-blindness (slide 20a; the Book restates it in `snowball-inside`) ──
    byForm = {r["form"]: r for r in B["pymorphyBlind"]["rows"]}
    byModel = {r["model"]: r for r in B["lemmaAccuracy"]["rows"]}
    out += [P("pymorphy tom p", byForm["том"]["p"], 3),
            P("pymorphy tom lost", byForm["том"]["pLost"], 3),
            P("pymorphy stali p", byForm["стали"]["p"], 3),
            P("lemma acc pymorphy2", byModel["PyMorphy2"]["rnc"], 2),
            P("lemma acc oracle", byModel["PyMorphy2* (oracle)"]["rnc"], 2)]
    return out

# ── [C] BOOK CLAIMS: the built Book PROSE must show the same flagship numbers as data/ ───────────
# The Book restates the decks' worked examples in its own prose/KaTeX, so the deck anchors do NOT
# match it (only 7/111 do). Each Book claim REUSES the value+tol of the corresponding deck claim by
# id (single source — the number itself is never re-typed here), pairing it with a Book-markup
# anchor (a generic ([\d.]+) capture pinned by stable surrounding literals, so a number that DRIFTS
# at that spot is captured and flagged, not silently missed). Closes the standing gap: until now the
# Book's numbers were ungated (check_claims docstring's own TODO). Adding more is just more rows here.
BOOK_ANCHORS = [
    ("L3 idf cat",      r"\\ln\(1\.1429\) = ([\d.]+)"),
    ("L3 idf dog",      r"\\ln\(1\.6\) = ([\d.]+)"),
    ("L3 D2 score",     r"0\.1161 \(cat\) \+ 0\.6065 \(dog\) = <strong>([\d.]+)</strong>"),
    ("L3 BEIR",         r"BM25 still scores around ([\d.]+) nDCG@10"),
    ("L4 nDCG hon",     r"\\frac\{1\.7333\}\{2\.5616\}=([\d.]+)"),
    ("L4 nDCG gam",     r"\\frac\{1\.3919\}\{2\.5616\}=\\mathbf\{([\d.]+)\}"),
    ("L4 MRR",          r"\\frac\{0\.5\+1\.0\}\{2\}=\\mathbf\{([\d.]+)\}"),
    ("L4 MAP",          r"\\frac\{0\.5\+0\.747\}\{2\}=\\mathbf\{([\d.]+)\}"),
    ("L5 PCA 2-D",      r"keep ([\d.]+)% of the original"),
    ("L5 analogy cos",  r"cosine ([\d.]+), far ahead"),
    ("L5 runner-up",    r"prince \(([\d.]+)\) and throne"),
    ("L5G drop %",      r"a \\\(([\d.]+)\\%\\\) drop"),
    ("L5G loss after",  r"to \\\(([\d.]+)\\\) after 600 AdaGrad"),
    ("L6 InfoNCE loss", r"[−-]ln\(0\.8877\) = ([\d.]+)"),
    ("L6 InfoNCE p+",   r"probability ([\d.]+), so the loss"),
    # ── widened coverage: every flagship + worked intermediate the Book PROSE states (anchor-probed).
    #    Optional 3rd element overrides the deck tol where the Book displays a rounded form. ──
    # L1 / L2
    ("top-1 %",         r"Rank 1 alone takes ~([\d.]+)% of clicks"),
    ("top-3 %",         r"top 3 soak up ~([\d.]+)%"),
    ("heaps β",         r"\\beta \\approx ([\d.]+)"),
    ("V types",         r"counted ([\d,]+) distinct type"),
    ("zipf slope",      r"slope is ≈ ([−\d.]+)"),
    ("euclid",          r"\\sqrt\{162\} \\approx ([\d.]+)"),
    # L3 — BM25 worked example + PageRank + compression + RRF
    ("L3 D1 score",     r"\+ 0\.4700 \(dog\) = <strong>([\d.]+)</strong>\. D3"),
    ("L3 D3 score",     r"D3 = ([\d.]+) \(cat\) \+ 0 \(no"),
    ("L3 B D2dog",      r"B = 5/3\.875 = ([\d.]+)"),
    ("L3 idf nasa",     r"three documents \(idf = <strong>([\d.]+)</strong>\)"),
    ("L3 idf shut",     r"only two \(idf = <strong>([\d.]+)</strong>\)"),
    ("L3 q2 D2",        r"scores <strong>([\d.]+)</strong> and"),
    ("L3 q2 D3",        r"trails at ([\d.]+);"),
    ("L3 PR A",         r"PR = \(([\d.]+), 0\.3974, 0\.3878\)"),
    ("L3 PR B",         r"PR = \(0\.2148, ([\d.]+), 0\.3878\)"),
    ("L3 PR C",         r"PR = \(0\.2148, 0\.3974, ([\d.]+)\)"),
    ("L3 PR Bupd",      r"= 0\.0500 \+ 0\.4250 = ([\d.]+)\."),
    ("L3 gaps",         r"3, \+5, \+4, \+(\d+)</code>"),
    ("L3 raw bytes",    r"four 32-bit IDs is (\d+) bytes"),
    ("L3 RRF top",      r"1/61 \+ 1/61 \\approx ([\d.]+)", 1e-4),
    # L4 — graded nDCG + significance tests + online A/B
    ("L4 nDCG lin",     r"graded nDCG = ([\d.]+)</strong>"),
    ("L4 nDCG exp",     r"lands at <strong>([\d.]+)</strong>"),
    ("L4 t-stat",       r"paired t=([\d.]+),"),
    ("L4 p t-test",     r"t=2\.2753, p=([\d.]+);"),
    ("L4 p wilcox",     r"Wilcoxon W=25, p=([\d.]+);"),
    ("L4 p perm",       r"It happens ([\d.]+) of the time"),
    ("L4 CI lo",        r"true gain is \[([\d.]+), 0\.0772\]"),
    ("L4 CI hi",        r"true gain is \[0\.0023, ([\d.]+)\]"),
    ("L4 AB z",         r"0\.00469 ≈ ([\d.]+)\."),
    ("L4 AB p",         r"maps to p ≈ ([\d.]+) ", 1e-3),
    # L5 — cosines + PCA components + GloVe worked step + t-SNE affinities
    ("L5 cos cat·dog",  r"cosines 0\.861, ([\d.]+), 0\.3654"),
    ("L5 cos cat·air",  r"cosines 0\.861, 0\.9218, ([\d.]+)"),
    ("L5 cos kng·cmp",  r"king·computer just ([\d.]+)", 1e-3),
    ("L5 PCA PC1",      r"PC1 holds ([\d.]+)%"),
    ("L5 PCA PC2",      r"PC2 ([\d.]+)%"),
    ("L5G X count",     r"co-occur \\\(X = ([\d.]+)\\\)"),
    ("L5G logX",        r"\\log X = [−-]([\d.]+)"),
    ("L5G f(X)",        r"the weight is \\\(f = ([\d.]+)\\\)"),
    ("L5G model",       r"\(-0\.127\) = [−-]([\d.]+)"),
    ("L5G loss before", r"loss falls from \\\(([\d.]+)\\\)", 1e-2),
    ("L5G alpha",       r"\(6/10\)\^\{([\d.]+)\}"),
    ("L5T sigma svg",   r"\\sigma = ([\d.]+)\\\)"),
    ("L5T p dog",       r'"dog" gets \\\(p = ([\d.]+)\\\)'),
    ("L5T p puppy",     r'"puppy" \\\(([\d.]+)\\\)'),
    ("L5T p lion",      r'"lion" \\\(([\d.]+)\\\)'),
    ("L5T p kitten",    r'"kitten" \\\(([\d.]+)\\\)'),
    ("L5T q_ij",        r"q_\{ij\} = ([\d.]+)\\\)", 5e-4),
    ("L5T joint p_ij",  r"joint \\\(p_\{ij\} = ([\d.]+)\\\)"),
    ("L5T KL svg",      r"\\mathrm\{KL\} = ([\d.]+)\\\)"),
    # L6 — the worked attention example (now displayed by the ncd-chain climb) + DistilBERT stack
    ("L6 √d_k var",     r"√dₖ = √4 = ([\d.]+)"),
    ("L6 w[sat][sat]",  r"spends ([\d.]+) of its attention on itself"),
    ("L6 out[cat][0]",  r"\(1\.267 \+ ([\d.]+) \+ 1\.364\)"),
    ("L6 stack cos final", r'downtown"\) sit at cosine \\\(([\d.]+)\\\)'),
]
def book_claims():
    base = {c["id"]: c for c in claims()}
    out = []
    for entry in BOOK_ANCHORS:
        src, anchor = entry[0], entry[1]
        tol = entry[2] if len(entry) > 2 else base[src]["tol"]   # override where the Book rounds differently
        out.append(dict(id="book " + src, deck=base[src]["deck"], value=base[src]["value"],
                        tol=tol, anchor=anchor, must=True))
    # Book-ONLY prose numbers with no deck twin → value sourced STRAIGHT from data/ (the deck never shows them).
    # ch.6 within-sense cosine 0.9466 (two money-bank uses) is displayed only in the Book; it lives in
    # data/l6-contextual.json — gating it here makes that file a real consumer (its number drives the prose).
    out.append(dict(id="book L6 within-sense", deck="L6", value=CTX["cosines"]["withinSense"], tol=1e-4,
                    anchor=r'cheque"\) sit at \\\(([\d.]+)\\\), nearly on top', must=True))
    out += l7_book_claims()
    out += l8_book_claims()
    out += l9_book_claims()
    out += l10_book_claims()
    out += l11_book_claims()
    out += l13_book_claims()
    out += l20_book_claims()
    return out

# ── [C] L20 BOOK CLAIMS: the built Book PROSE restates the BM25 surface→lemma inversion (data/l20-ru.json,
#    gen_l20.py): the gold answer's score 0.0 → 1.3884 and the surface distractor 1.3608. Gating both keeps
#    book:L20 coverage at 0. Values from L20RU["bm25"]; anchored to the worked-by-hand beat prose (all 3 langs). ──
def l20_book_claims():
    b = L20RU["bm25"]
    return [
        dict(id="book L20 lemma gold", deck="L20", value=b["lemma"]["goldScore"], tol=1e-4,
             anchor=r'\\\((1\.3884)\\\)', must=True),
        dict(id="book L20 surface distractor", deck="L20", value=b["surface"]["scores"]["d2_distractor"], tol=1e-4,
             anchor=r'\\\((1\.3608)\\\)', must=True),
    ]


# ── [C] L13 BOOK CLAIMS: the built Book PROSE restates TAS-B's achieved MS MARCO MRR@10 (≈ 0.34) — the only
#    NEW ≥2-dp number this depth pass adds to the Book. Gating it keeps book:L13 coverage at 0 (ANCE's 0.33 is
#    already gated == MS MARCO denseDPR). Value from BENCH13["tasb"]["mrr"]; anchored to the topic-aware beat. ──
def l13_book_claims():
    return [
        dict(id="book L13 tasb mrr", deck="L13", value=BENCH13["tasb"]["mrr"], tol=1e-4,
             anchor=r"MS MARCO MRR@10 (?:&asymp;|≈) ([\d.]+) on a single 11", must=True),
    ]

# ── [C] L7 DECK claims: the cited reranker benchmarks the deck DISPLAYS (≥2-decimal → coverage-gated).
#    value sourced from data/l7-bench.json; anchored to the rendered deck tables (slides 31 & 33). These
#    values also COVER any Book restatement (coverage-guard's gated set is claims()+book_claims()). ──
def l7_deck_claims():
    R, L = BENCH7["rerankers"], BENCH7["llmRerankers"]
    C = lambda id, value, anchor: dict(id=id, deck="L7", value=value, tol=1e-4, anchor=anchor, must=True)
    return [
        # slide 31 — small cross-encoder MRR@10 (the L6≈L12, ~2× cost punchline)
        C("L7 rr L6 MRR",  R["miniLM6"]["mrrDev"],  r"<strong>([\d.]+)</strong> · 1800"),
        C("L7 rr L12 MRR", R["miniLM12"]["mrrDev"], r"<strong>([\d.]+)</strong> · 960"),
        # slide 33 — LLM-reranker nDCG@10 on TREC DL19
        C("L7 llm bm25",    L["bm25"],       r"<td>BM25</td><td>([\d.]+)</td>"),
        C("L7 llm monoT5",  L["monoT5_3b"],  r"<td>monoT5-3B</td><td>([\d.]+)</td>"),
        C("L7 llm gpt35",   L["gpt35"],      r"<td>GPT-3\.5 \(RankGPT\)</td><td>([\d.]+)</td>"),
        C("L7 llm gpt4",    L["gpt4"],       r"<td>GPT-4 \(RankGPT\)</td><td>([\d.]+)</td>"),
        C("L7 llm zephyr",  L["rankZephyr"], r"RankZephyr-7B</td><td>([\d.]+)</td>"),
    ]

# ── [C] L8 DECK claims: every visible ≥2-dp worked value the deck DISPLAYS == data/l8-*.json. The deck is
#    authored in Phase 3; until Lectures/08-*.html exists there is nothing to anchor against (the guard
#    returns []). Once built, the coverage-guard (baseline 0 for the NEW deck:L8 surface) HARD-fails on any
#    un-gated ≥2-dp number, forcing each anchor to be added alongside its slide markup. ──
def l8_deck_claims():
    if "L8" not in DECKS:
        return []
    cb, sp, lt = COLBERT8["toy"], SPLADE8["toy"], LTR8["toy"]
    rel, irr = cb["docRel"], cb["docIrr"]
    qw, dw, tm = sp["query"]["weights"], sp["doc"]["weights"], sp["terms"]
    hs = {f["id"]: f["score"] for f in HYBRID8["fused"]}
    C = lambda id, value, anchor, tol=1e-4: dict(id=id, deck="L8", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── ColBERT worked (slide 12 relevant / 13 lexical-trap): row-maxes + MaxSim ──
        C("L8 cb relMax0", rel["rowMax"][0], r"row maxes\} = \(([\d.]+), 0\.50, 0\.95\)"),
        C("L8 cb relMax1", rel["rowMax"][1], r"row maxes\} = \(0\.90, ([\d.]+), 0\.95\)"),
        C("L8 cb relMax2", rel["rowMax"][2], r"row maxes\} = \(0\.90, 0\.50, ([\d.]+)\)"),
        C("L8 cb relMaxSim", rel["maxSim"], r"0\.90 \+ 0\.50 \+ 0\.95 = \\mathbf\{([\d.]+)\}"),
        C("L8 cb irrMax0", irr["rowMax"][0], r"row maxes\} = \(([\d.]+), 0\.98, 0\.12\)"),
        C("L8 cb irrMax1", irr["rowMax"][1], r"row maxes\} = \(0\.20, ([\d.]+), 0\.12\)"),
        C("L8 cb irrMax2", irr["rowMax"][2], r"row maxes\} = \(0\.20, 0\.98, ([\d.]+)\)"),
        C("L8 cb irrMaxSim", irr["maxSim"], r"0\.20 \+ 0\.98 \+ 0\.12 = \\mathbf\{([\d.]+)\}"),
        # ── SPLADE worked (slide 24 weights / 25 dot): query weights, doc weights, products, dot ──
        C("L8 sp wRiver", qw[0], r"\\log\(3\.0\) = \\mathbf\{([\d.]+)\}"),
        C("L8 sp wBank",  qw[1], r"\\log\(1\.5\) = \\mathbf\{([\d.]+)\}"),
        C("L8 sp wFlood", qw[2], r"\\log\(3\.5\) = \\mathbf\{([\d.]+)\}"),
        C("L8 sp wWater", qw[3], r"\\log\(2\.2\) = \\mathbf\{([\d.]+)\}"),
        C("L8 sp dRiver", dw[0], r"w_d = \(([\d.]+),\\, 0\.70"),
        C("L8 sp dBank",  dw[1], r"w_d = \(0\.90,\\, ([\d.]+),\\, 0\.60"),
        C("L8 sp dFlood", dw[2], r"0\.70,\\, ([\d.]+),\\, 1\.30"),
        C("L8 sp dWater", dw[3], r"0\.60,\\, ([\d.]+)\)"),
        C("L8 sp prodRiver", tm[0]["prod"], r"= ([\d.]+) \+ 0\.2839 \+ 0\.7517"),
        C("L8 sp prodBank",  tm[1]["prod"], r"0\.9887 \+ ([\d.]+) \+ 0\.7517"),
        C("L8 sp prodFlood", tm[2]["prod"], r"0\.2839 \+ ([\d.]+) \+ 1\.0251"),
        C("L8 sp prodWater", tm[3]["prod"], r"0\.7517 \+ ([\d.]+) = \\mathbf"),
        C("L8 sp dot", sp["dot"], r"0\.7517 \+ 1\.0251 = \\mathbf\{([\d.]+)\}"),
        # ── Hybrid worked (slide 35): the five fused RRF scores ──
        C("L8 hy D2", hs["D2"], r"\\tfrac\{1\}\{62\}\+\\tfrac\{1\}\{61\} = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D3", hs["D3"], r"\\tfrac\{1\}\{63\}\+\\tfrac\{1\}\{62\} = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D1", hs["D1"], r"\\tfrac\{1\}\{61\}\+\\tfrac\{1\}\{65\} = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D4", hs["D4"], r"D_4 = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D5", hs["D5"], r"D_5 = \\mathbf\{([\d.]+)\}"),
        # ── LTR worked (slide 46 RankNet / 47 LambdaRank) ──
        C("L8 ltr prob", lt["rankNetProb"], r"\\frac\{1\}\{1\+e\^\{-1\.2\}\} = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr cost", lt["rankNetCost"], r"e\^\{-1\.2\}\\big\) = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr grad", lt["gradient"], r"1 - \\sigma\(1\.2\) = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr ndcg", lt["ndcg"]["current"], r"\\mathbf\{([\d.]+)\} \\;\\longrightarrow"),
        C("L8 ltr delta", lt["ndcg"]["deltaNdcg"], r"1\.0 - 0\.6309 = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr lambda", lt["lambda"], r"0\.2315 \\cdot 0\.3691 = \\mathbf\{([\d.]+)\}"),
        # ── callbacks displayed on L8 slides (anchored to existing data files, not duplicated) ──
        C("L8 cb BEIR bm25", BENCH["beir"]["BM25"], r"reaches nDCG@10 \\\(= ([\d.]+)\\\)"),
        C("L8 cb BEIR dpr", BENCH["beir"]["denseDPR"], r"DPR</strong> trails at \\\(([\d.]+)\\\)"),
    ]

# ── [C] L8 BOOK claims: the L8 chapter prose restates every worked number; gate each against data/. Book
#    claims are filtered by `c["deck"] in book` in main(), so an empty list is safe until content/book/l8
#    is built (Phase 4); anchors are added alongside the beat prose. ──
def l8_book_claims():
    C = lambda id, value, anchor, tol=1e-4: dict(id="book " + id, deck="L8", value=value, tol=tol, anchor=anchor, must=True)
    cb, sp, lt = COLBERT8["toy"], SPLADE8["toy"], LTR8["toy"]
    cbr = COLBERT8["real"]   # frozen real ColBERTv2 MaxSim (gen_l8_real.py, heavy step) — surfaced in depth-maxsim-math
    hs = {f["id"]: f["score"] for f in HYBRID8["fused"]}
    return [
        # the per-pillar flagship worked numbers, restated in the L8 chapter :::calc blocks (EN book).
        C("L8 cb relMaxSim", cb["docRel"]["maxSim"], r"0\.90 \+ 0\.50 \+ 0\.95 = \\mathbf\{([\d.]+)\}"),
        C("L8 cb irrMaxSim", cb["docIrr"]["maxSim"], r"0\.20 \+ 0\.98 \+ 0\.12 = \\mathbf\{([\d.]+)\}"),
        # real ColBERTv2 authenticity (depth-maxsim-math): same query/docs, 128-dim projected MaxSim 3.0635 (rel) > 1.7809 (irr).
        C("L8 cb realMaxSimRel", cbr["maxSimRel"], r"= \\mathbf\{([\d.]+)\}\\\) for the relevant"),
        C("L8 cb realMaxSimIrr", cbr["maxSimIrr"], r"versus \\\(\\mathbf\{([\d.]+)\}\\\) for the irrelevant"),
        C("L8 sp dot", sp["dot"], r"0\.9887 \+ 0\.2839 \+ 0\.7517 \+ 1\.0251 = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D2", hs["D2"], r"1/62 \+ 1/61 = \\mathbf\{([\d.]+)\}"),
        C("L8 hy D1", hs["D1"], r"1/61 \+ 1/65 = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr prob", lt["rankNetProb"], r"1/\(1\+e\^\{-1\.2\}\) = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr cost", lt["rankNetCost"], r"\\log\(1\+e\^\{-1\.2\}\) = \\mathbf\{([\d.]+)\}"),
        C("L8 ltr lambda", lt["lambda"], r"0\.2315 \\cdot 0\.3691 = \\mathbf\{([\d.]+)\}"),
    ]

# ── [C] L7 BOOK claims: the L7 chapter prose states every flagship number; gate each against data/.
#    Book-only (the deck restates them on its own slides, gated separately as those slides are authored).
#    value sourced STRAIGHT from data/l7-*.json + the reused l3/l4 callback files. Generic ([\d.]+)
#    capture pinned by stable surrounding literals → a drifted number is captured + flagged, not missed. ──
def l7_book_claims():
    C = lambda id, value, anchor, tol=1e-4: dict(id="book " + id, deck="L7", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # bi-encoder: toy cos 0.8165, real SBERT cosRel 0.6838 > cosIrr 0.4082
        C("L7 toy cosRel",  BIENC["toy"]["cosRel"],  r"\\sqrt6 \\approx \\mathbf\{([\d.]+)\}"),
        C("L7 real cosRel", BIENC["real"]["cosRel"], r"\\approx \\mathbf\{([\d.]+)\}\\\) versus"),
        C("L7 real cosIrr", BIENC["real"]["cosIrr"], r"\\approx \\mathbf\{([\d.]+)\}\\\): the"),
        # cross-encoder: toy σ 0.9168 / 0.2497
        C("L7 toy scoreRel", CROSSENC["toy"]["scoreRel"], r"\\sigma\(2\.4\)\\approx\\mathbf\{([\d.]+)\}"),
        C("L7 toy scoreNeg", CROSSENC["toy"]["scoreNeg"], r"\\sigma\(-1\.1\)\\approx\\mathbf\{([\d.]+)\}"),
        # cross-encoder real distractor: Scout 0.8434 vs 0.6875 (narrow), Judge 0.9998 vs 0.1159 (huge)
        C("L7 biCosRel", CROSSENC["contrast"]["biCosRel"], r"cosine \\\(\\mathbf\{([\d.]+)\}\\\) vs"),
        C("L7 biCosBad", CROSSENC["contrast"]["biCosBad"], r"vs \\\(\\mathbf\{([\d.]+)\}\\\), a"),
        C("L7 crossRel", CROSSENC["real"]["pairRel"]["score"], r"rates them \\\(\\mathbf\{([\d.]+)\}\\\) vs"),
        C("L7 crossBad", CROSSENC["real"]["pairBad"]["score"], r"\\mathbf\{0\.9998\}\\\) vs \\\(\\mathbf\{([\d.]+)\}"),
        # cascade: BM25 nDCG 0.6766 → reranked 0.9558
        C("L7 bm25Ndcg",   CASCADE["quality"]["bm25Ndcg"],     r"documents to <strong>nDCG@10 = ([\d.]+)</strong>"),
        C("L7 rerankNdcg", CASCADE["quality"]["rerankedNdcg"], r"improves to <strong>nDCG@10 = ([\d.]+)</strong>"),
        # MS MARCO subset: retrieve MRR 0.5482 → rerank MRR 0.6732
        C("L7 mm retrMrr",   MSMARCO["retrieve"]["mrrAt10"], r"retrieval <strong>MRR@10 = ([\d.]+)</strong>"),
        C("L7 mm rerankMrr", MSMARCO["rerank"]["mrrAt10"],   r"rises to <strong>([\d.]+)</strong>"),
        # callbacks (reused data files): L4 recall@3 0.25; BEIR 0.43/0.38; MS MARCO 0.187/0.33
        C("L7 cb recall@3", METRICS["recallAtK"]["3"],  r"recall@3 = ([\d.]+), recall"),
        C("L7 cb BEIR bm25", BENCH["beir"]["BM25"],     r"BM25 reaches nDCG@10 = ([\d.]+) and"),
        C("L7 cb BEIR dpr",  BENCH["beir"]["denseDPR"], r"dense DPR only ([\d.]+)</strong>"),
        C("L7 cb MM bm25",   BENCH["msmarco"]["BM25"],     r"BM25&amp;rsquo;s ([\d.]+)\."),
        C("L7 cb MM dpr",    BENCH["msmarco"]["denseDPR"], r"MRR@10 of ([\d.]+) beats"),
    ]

# ── L3 'Star Catalog' [C] claims: every flagship number the deck shows == data/l3-*.json ─────────
# Anchors match the RENDERED numeric text (KaTeX \(…\)/$$…$$, <code> matrix-labels, captions) — the
# digits are literal in the HTML source even inside KaTeX, so a value-targeted regex is robust to
# the surrounding markup. The captured group is a GENERIC number ([\d.]+ / \d+); the surrounding
# literal context (labels, the other numbers in the same expression) pins the location uniquely, so
# a number that DRIFTS at that spot is still matched and flagged as DRIFT (not silently NOT FOUND).
def l3_claims():
    cd = {d["id"]: d for d in CATDOG["docs"]}
    N = r"([\d.]+)"      # generic captured number → catches drift, not just exact match
    return [
        # cat/dog smoothed idf (flagship). idf(cat)=…=0.1335 ; idf(dog)=…=0.4700
        dict(id="L3 idf cat",  deck="L3", value=CATDOG["idf"]["cat"], tol=1e-4,
             anchor=r"\\ln\(1\.1429\)="+N, must=True),
        dict(id="L3 idf dog",  deck="L3", value=CATDOG["idf"]["dog"], tol=1e-4,
             anchor=r"\\ln\(1\.6000\)="+N, must=True),
        # cat/dog per-doc BM25 scores and the final ranking D2 > D1 > D3
        dict(id="L3 D1 score", deck="L3", value=cd["D1"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D1\}\)=0\.1908\+0\.4700="+N, must=True),
        dict(id="L3 D2 score", deck="L3", value=cd["D2"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D2\}\)=0\.1161\+0\.6065="+N, must=True),
        dict(id="L3 D3 score", deck="L3", value=cd["D3"]["bm25Score"], tol=1e-4,
             anchor=r"\\mathrm\{BM25\}\(\\text\{D3\}\)=0\.1571\+0="+N, must=True),
        dict(id="L3 rank",     deck="L3", value=cd["D2"]["bm25Score"], tol=1e-4,
             anchor=r"\\text\{D2\}\\;"+N+r" > \\text\{D1\}\\;0\.6608 > \\text\{D3\}", must=True),
        # cat/dog worked B-factors (only fully substituted in -steps.json)
        dict(id="L3 B D1cat",  deck="L3", value=CATDOG_STEPS["docs"][0]["terms"][0]["B"], tol=1e-4,
             anchor=r"D1 cat: B="+N+r" → 0\.1908", must=True),
        dict(id="L3 B D2dog",  deck="L3", value=CATDOG_STEPS["docs"][1]["terms"][1]["B"], tol=1e-4,
             anchor=r"D2 dog: B="+N+r" → 0\.6065", must=True),
        # nasa/shuttle idf (distinct-df) + bm25 ranking by row order D2 > D3 > D0
        dict(id="L3 idf nasa", deck="L3", value=Q2["idf"]["nasa"], tol=1e-4,
             anchor=r"\\ln\(2\.5714\)="+N, must=True),
        dict(id="L3 idf shut", deck="L3", value=Q2["idf"]["shuttle"], tol=1e-4,
             anchor=r"\\ln\(3\.6000\)="+N, must=True),
        dict(id="L3 q2 D2",    deck="L3", value=Q2_STEPS["winningDoc"]["rowSum"], tol=1e-4,
             anchor=r"<td>66</td><td>1</td><td>3</td><td>0\.8309</td><td>1\.9842</td><td class=\"cell-good\">"+N+r"</td>", must=True),
        dict(id="L3 q2 D3",    deck="L3", value=[d for d in Q2["docs"] if d["id"]=="D3"][0]["bm25Score"],
             tol=1e-4, anchor=r"<td>59</td><td>2</td><td>1</td><td>1\.2811</td><td>1\.1922</td><td>"+N+r"</td>", must=True),
        # PageRank converged vector v25 = (0.2148, 0.3974, 0.3878) + worked iter-1 B update = 0.475
        dict(id="L3 PR A",     deck="L3", value=round(PAGERANK["finalVector"][0], 4), tol=1e-4,
             anchor=r"v_\{25\} = \("+N+r",\\;0\.3974,\\;0\.3878\)", must=True),
        dict(id="L3 PR B",     deck="L3", value=round(PAGERANK["finalVector"][1], 4), tol=1e-4,
             anchor=r"v_\{25\} = \(0\.2148,\\;"+N+r",\\;0\.3878\)", must=True),
        dict(id="L3 PR C",     deck="L3", value=round(PAGERANK["finalVector"][2], 4), tol=1e-4,
             anchor=r"v_\{25\} = \(0\.2148,\\;0\.3974,\\;"+N+r"\)", must=True),
        dict(id="L3 PR Bupd",  deck="L3", value=PAGERANK["workedUpdate"]["pr1"], tol=1e-4,
             anchor=r"0\.05\+0\.425="+N, must=True),
        # postings compression: gaps [3,5,4,18], 16 → 4 bytes
        dict(id="L3 gaps",     deck="L3", value=COMPRESS["gaps"][3], tol=0,
             anchor=r"\[3, 5, 4, (\d+)\]", must=True),
        dict(id="L3 raw bytes",deck="L3", value=COMPRESS["rawBytesTotal"], tol=0,
             anchor=r"naive = (\d+) bytes", must=True),
        dict(id="L3 vb bytes", deck="L3", value=COMPRESS["varbyteBytesTotal"], tol=0,
             anchor=r"varbyte = (\d+) bytes", must=True),
        # cited benchmarks: MS MARCO BM25 0.187, BEIR BM25 0.43
        dict(id="L3 MSMARCO",  deck="L3", value=BENCH["msmarco"]["BM25"], tol=1e-4,
             anchor=r"<td>MS MARCO dev</td><td>MRR@10</td><td>"+N+r"</td>", must=True),
        dict(id="L3 BEIR",     deck="L3", value=BENCH["beir"]["BM25"], tol=1e-4,
             anchor=r"BM25 \("+N+r"\) <strong>beats DPR", must=True),
        # RRF: k=60, top fused score D6 = 0.032787
        dict(id="L3 RRF k",    deck="L3", value=RRF["k"], tol=0,
             anchor=r"\\\(k=(\d+)\\\)", must=True),
        dict(id="L3 RRF top",  deck="L3", value=RRF["fused"][0]["rrf"], tol=1e-6,
             anchor=r"0\.016393\+0\.016393 = \\mathbf\{"+N+r"\}", must=True),
    ]

# ── L4 'Proving Grounds' [C] claims: every flagship metric the deck shows == data/l4-*.json ──────
# Same robustness contract as l3_claims(): generic captured number, literal context pins the spot.
def l4_claims():
    N = r"([\d.]+)"
    return [
        # MRR / MAP over two queries (mean ≠ either query)
        dict(id="L4 MRR",      deck="L4", value=MULTIQ["mrr"], tol=1e-4,
             anchor=r"\\mathrm\{MRR\} = \\dfrac\{0\.5 \+ 1\.0\}\{2\} = "+N, must=True),
        dict(id="L4 MAP",      deck="L4", value=MULTIQ["map"], tol=1e-4,
             anchor=r"MAP \\\(=\\\)</span><span class=\"matrix-label is-highlight\">\\\("+N+r"\\\)", must=True),
        # graded nDCG: linear 0.6622, exponential 0.6563 (same ranking, two gain functions)
        dict(id="L4 nDCG lin", deck="L4", value=GRADED["linear"]["ndcg"], tol=1e-4,
             anchor=r"<td>\\\(5\.8235\\\)</td><td class=\"cell-good\">\\\("+N+r"\\\)", must=True),
        dict(id="L4 nDCG exp", deck="L4", value=GRADED["exponential"]["ndcg"], tol=1e-4,
             anchor=r"8\.1029 / 12\.3472 = "+N, must=True),
        # binary-gain nDCG: honest 0.6766, gamed 0.5434 (Goodhart)
        dict(id="L4 nDCG hon", deck="L4", value=METRICS["ndcg"], tol=1e-4,
             anchor=r"1\.7333/2\.5616 = "+N, must=True),
        dict(id="L4 nDCG gam", deck="L4", value=METRICS["gamed"]["ndcg"], tol=1e-4,
             anchor=r"1\.3919/2\.5616 = "+N, must=True),
        # significance: paired t = 2.275; precise p-values; 95% CI [0.0023, 0.0772]
        dict(id="L4 t-stat",   deck="L4", value=SYSTEMS["pairedTTest"]["t"], tol=5e-3,
             anchor=r"0\.0676/\\sqrt\{15\}\)="+N, must=True),
        dict(id="L4 p t-test", deck="L4", value=SYSTEMS["pairedTTest"]["p"], tol=1e-5,
             anchor=r"\\\(p="+N+r"\\\) from the \\\(t_\{14\}", must=True),
        dict(id="L4 p wilcox", deck="L4", value=SYSTEMS["wilcoxon"]["p"], tol=1e-5,
             anchor=r"\\\(p="+N+r"\\\) \(table value\)", must=True),
        dict(id="L4 p perm",   deck="L4", value=SYSTEMS["permutation"]["p"], tol=1e-5,
             anchor=r"\}/32768="+N, must=True),
        dict(id="L4 CI lo",    deck="L4", value=SYSTEMS["ci95"][0], tol=1e-4,
             anchor=r"\\sqrt\{15\}\} = \[\\,"+N+r",\\ 0\.0772\\,\]", must=True),
        dict(id="L4 CI hi",    deck="L4", value=SYSTEMS["ci95"][1], tol=1e-4,
             anchor=r"\\sqrt\{15\}\} = \[\\,0\.0023,\\ "+N+r"\\,\]", must=True),
        # A/B test: z = 2.557, p = 0.01056, +10% relative lift
        dict(id="L4 AB z",     deck="L4", value=ONLINE["abTest"]["z"], tol=1e-3,
             anchor=r"\{0\.00469\} = "+N+r" \\;\\Rightarrow", must=True),
        dict(id="L4 AB p",     deck="L4", value=ONLINE["abTest"]["p"], tol=1e-5,
             anchor=r"\\Rightarrow\\; p = "+N+r"\$\$", must=True),
        dict(id="L4 AB lift",  deck="L4", value=ONLINE["abTest"]["relativeLiftPct"], tol=1e-3,
             anchor=r"\\frac\{0\.012\}\{0\.12\} = (\d+)\\%", must=True),
        # interleaving: team-draft totals A=9, B=16; preference 16/25 = 0.64 (B wins via clicks, canonical 3/3 draft)
        dict(id="L4 IL totA",  deck="L4", value=ONLINE["interleaving"]["totalCreditA"], tol=0,
             anchor=r"over 5 queries: \} A=(\d+),\\ B=16", must=True),
        dict(id="L4 IL totB",  deck="L4", value=ONLINE["interleaving"]["totalCreditB"], tol=0,
             anchor=r"over 5 queries: \} A=9,\\ B=(\d+)", must=True),
        dict(id="L4 IL pref",  deck="L4", value=ONLINE["interleaving"]["preferenceForB"], tol=0.001,
             anchor=r"\\frac\{16\}\{9\+16\} = ([\d.]+)", must=True),
    ]

# ── L5 'Map of Meaning' [C] claims: every flagship embedding/dim-red number == data/l5-*.json ─────
# Same robustness contract as L3/L4: the captured group is a GENERIC number ([\d.]+) and the literal
# context pins the location, so a value that DRIFTS at that spot is matched and flagged (not silently
# NOT FOUND). The deck rounds data/ to 3 dp for cosines (0.9218→0.922) and 1 dp for variance %, so
# `value` is the data/ canonical and `tol`=1e-3 absorbs the display rounding while still catching real
# drift (a wrong second decimal moves the number far past 1e-3).
def l5_claims():
    pp = {(p["a"], p["b"]): p["cos"] for p in EMB["pairs"]}
    pca = DIMRED["pca"]
    return [
        # analogy king−man+woman→queen: answer cosine 0.861 (+ runner-up prince 0.764)
        dict(id="L5 analogy cos", deck="L5", value=EMB["analogy"]["answerCos"], tol=1e-3,
             anchor=r'queen</div><div class="arch-shape">\\\(\\cos = ([\d.]+)\\\)', must=True),
        dict(id="L5 runner-up",   deck="L5", value=round(EMB["analogy"]["top"][1]["cos"], 3), tol=1e-3,
             anchor=r"queen 0\.861 &middot; prince ([\d.]+) &middot; throne", must=True),
        # capital paris−france+italy→rome: 0.838
        dict(id="L5 capital cos", deck="L5", value=EMB["capitalAnalogy"]["top"][0]["cos"], tol=1e-3,
             anchor=r'<td class="cell-good"><code>rome</code></td><td class="cell-good">([\d.]+)</td>', must=True),
        # pairwise cosines (the headline "nearness = meaning" table)
        dict(id="L5 cos cat·dog", deck="L5", value=pp[("cat", "dog")], tol=1e-3,
             anchor=r'<code>cat &middot; dog</code></td><td class="cell-good">([\d.]+)</td>', must=True),
        dict(id="L5 cos cat·kit", deck="L5", value=pp[("cat", "kitten")], tol=1e-3,
             anchor=r'<code>cat &middot; kitten</code></td><td>([\d.]+)</td>', must=True),
        dict(id="L5 cos cat·air", deck="L5", value=pp[("cat", "airplane")], tol=1e-3,
             anchor=r'<code>cat &middot; airplane</code></td><td class="cell-bad">([\d.]+)</td>', must=True),
        dict(id="L5 cos kng·qn",  deck="L5", value=pp[("king", "queen")], tol=1e-3,
             anchor=r'<code>king &middot; queen</code></td><td>([\d.]+)</td>', must=True),
        dict(id="L5 cos kng·cmp", deck="L5", value=pp[("king", "computer")], tol=1e-3,
             anchor=r'<code>king &middot; computer</code></td><td class="cell-bad">([\d.]+)</td>', must=True),
        # PCA 2-D explained variance: PC1 19.6% + PC2 18.1% = 37.7% (data ratios ×100)
        dict(id="L5 PCA PC1",     deck="L5", value=round(pca["explainedVarRatio"][0]*100, 1), tol=0.05,
             anchor=r"→ PC1 ([\d.]+)% \+ PC2 18\.1% = 37\.7%", must=True),
        dict(id="L5 PCA PC2",     deck="L5", value=round(pca["explainedVarRatio"][1]*100, 1), tol=0.05,
             anchor=r"→ PC1 19\.6% \+ PC2 ([\d.]+)% = 37\.7%", must=True),
        dict(id="L5 PCA 2-D",     deck="L5", value=pca["var2dPct"], tol=0.05,
             anchor=r"→ PC1 19\.6% \+ PC2 18\.1% = ([\d.]+)%", must=True),
        # slide-33 kicker breadcrumb "… → 2-D (97.21%)" — the 3-D→2-D rotation toy's variance kept
        # (l5-pca-rotate.json, distinct from the 44-word DIMRED PCA's 37.7%). [\d.,] captures the RU
        # "97,21%" too; num() normalises both to 97.21. Gating it covers both lang spans for the guard.
        dict(id="L5 PCA 2-D kick", deck="L5", value=PCAROT["var2dPct"], tol=0.05,
             anchor=r"2-D \(([\d.,]+)%\)", must=True),
        # dataset shape: 44 words, 7 clusters, t-SNE perplexity 14
        dict(id="L5 nWords",      deck="L5", value=DIMRED["nWords"], tol=0,
             anchor=r"PCA на ([\d.]+) словах", must=True),
        dict(id="L5 nClusters",   deck="L5", value=len(DIMRED["clusters"]), tol=0,
             anchor=r"нарисованная: ([\d.]+) кластеров", must=True),
        # the 44-word map's t-SNE perplexity = 14 (l5-dimred.json). NOTE the anchor is pinned to the
        # "44 words" kicker: the deck now ALSO shows perplexity \(=5\) on the 9-word t-SNE-math slides
        # (l5-tsne-math.json, checked separately below), so a bare `perplexity \(=…\)` regex would
        # collide on the 5 and false-flag. The "44 слова · " prefix is unique to slide 42.
        dict(id="L5 perplexity",  deck="L5", value=DIMRED["tsne"]["perplexity"], tol=0,
             anchor=r"44 слова · perplexity \\\(=([\d.]+)\\\)", must=True),
    ] + l5_glove_claims() + l5_tsne_claims() + l5_enrichment_claims()

# ── L5 GloVe [C] claims (slides 30 "GloVe co-occurrence" + 31 "GloVe objective") == data/l5-glove.json ─
# Same robustness contract as L3/L4/L5: the captured group is a GENERIC number and the literal context
# (chip labels, the other numbers in the same expression, the SVG x/y coords) pins the location, so a
# value that DRIFTS is matched and flagged (not silently NOT FOUND). The deck rounds the worked
# king·queen pair to 3 dp (X 0.6667→0.667, log X −0.4055→−0.406, f 0.1312→0.131, model −0.4076→−0.408)
# and the loss to 2 dp (18.0391→18.04); `value` is the data/ canonical, `tol` absorbs that rounding.
def l5_glove_claims():
    g  = GLOVE
    kq = next(w for w in g["worked"] if w["i"] == "king" and w["j"] == "queen")
    N  = r"([\d.]+)"
    return [
        # the worked king·queen entry — the four flagship chips on slide 31 (X, log X, f(X), model)
        dict(id="L5G X count",   deck="L5", value=round(kq["X"], 3), tol=1e-3,
             anchor=r'<span class="gob-clab">X \(count\)</span><span class="gob-cval">'+N+r"</span>", must=True),
        dict(id="L5G logX",      deck="L5", value=round(-kq["logX"], 3), tol=1e-3,  # chip prints &minus;0.406
             anchor=r'<span class="gob-clab">log X \(target\)</span><span class="gob-cval">&minus;'+N+r"</span>", must=True),
        dict(id="L5G f(X)",      deck="L5", value=round(kq["f"], 3), tol=1e-3,
             anchor=r'<span class="gob-clab">f\(X\) \(weight\)</span><span class="gob-cval">'+N+r"</span>", must=True),
        dict(id="L5G model",     deck="L5", value=round(-kq["model"], 3), tol=1e-3,  # chip prints &minus;0.408
             anchor=r'<span class="gob-clab">model \(fit\)</span><span class="gob-cval">&minus;'+N+r"</span>", must=True),
        # the same king·queen X echoed in the slide-30 matrix callout
        dict(id="L5G X callout", deck="L5", value=round(kq["X"], 3), tol=1e-3,
             anchor=r'<text x="700" y="228"[^>]*>X = '+N+r"</text>", must=True),
        # loss collapse 18.04 → 0.005 (−99.97% over 600 AdaGrad iters), slide 31 (re-laid-out inset).
        # ROBUST anchors: pin on a STABLE nearby TEXTUAL label + the number (not the old exact
        # <tspan fill=…/font-weight=…> chain, which the enrichment rewrote). "least-squares loss:" is
        # the inset's caption label; "18.04\to" is the math-prose collapse transition (RU+EN); the drop
        # rides the "% over 600 AdaGrad iters" trailing label — all survive a future re-layout.
        dict(id="L5G loss before",deck="L5", value=g["loss"]["before"], tol=1e-2,
             anchor=r"least-squares loss:.{0,80}?>"+N+r"</tspan>", must=True),
        dict(id="L5G loss after", deck="L5", value=g["loss"]["after"], tol=1e-4,
             anchor=r"18\.04\\to"+N+r"\\", must=True),
        dict(id="L5G drop %",     deck="L5", value=g["loss"]["dropPct"], tol=1e-2,
             anchor=r"\("+N+r"% over 600 AdaGrad iters\)", must=True),
        # weighting hyper-params: x_max=10 (amber marker) and α=0.75 (the f(x) exponent, both langs)
        dict(id="L5G x_max",      deck="L5", value=g["xMax"], tol=0,
             anchor=r'<text x="455.5" y="556"[^>]*>x_max='+N+r"</text>", must=True),
        dict(id="L5G alpha",      deck="L5", value=g["alpha"], tol=1e-9,
             anchor=r"f\(x\)=\(x/x_\{\\max\}\)\^\{"+N+r"\}", must=True),
    ]

# ── L5 t-SNE [C] claims (slides 43 "t-SNE affinities" + 44 "t-SNE objective") == data/l5-tsne-math.json ─
# Same contract. The deck rounds: σ to 3 dp (2.003), the conditional p_{j|i} row to 3 dp (dog 0.405,
# puppy 0.196, lion 0.140, kitten 0.136, throne 0.003), the high-D squared distances to 2 dp (dog 3.55,
# throne 43.88), KL to 4 dp (0.0411); the symmetrised joint p_ij (0.0454) and Student-t q_ij (0.06039)
# are bound verbatim in the slide-44 JS arrays (literal in the HTML source, like the slide-30/31 arrays).
def l5_tsne_claims():
    t = TSNE
    c = t["conditional"]
    N = r"([\d.]+)"
    return [
        # σ ≈ 2.003 (SVG annotation + the step-2 caption, both anchored)
        dict(id="L5T sigma svg",  deck="L5", value=c["sigma"], tol=1e-3,
             anchor=r'<tspan font-weight="700">&#963; = '+N+r"</tspan>", must=True),
        dict(id="L5T sigma cap",  deck="L5", value=c["sigma"], tol=1e-3,
             anchor=r"here \\\(\\sigma\\approx"+N+r"\\\)", must=True),
        # perplexity = 5 (the tuning target): the SVG annotation + the slide-43 kicker
        dict(id="L5T perp svg",   deck="L5", value=c["perplexity"], tol=0,
             anchor=r'<tspan>the row has </tspan><tspan font-weight="700">perplexity = '+N+r"</tspan>", must=True),
        dict(id="L5T perp kick",  deck="L5", value=t["targetPerplexity"], tol=0,
             anchor=r"anchor <code>cat</code> · perplexity \\\(="+N+r"\\\)", must=True),
        # the anchor's Gaussian conditional p_{j|i} row (the headline affinities, slide-43 caption)
        dict(id="L5T p dog",      deck="L5", value=round(c["pRow"][2], 3), tol=1e-3,
             anchor=r"\. <code>dog</code> \\\("+N+r"\\\), <code>puppy</code> \\\(0\.196", must=True),
        dict(id="L5T p puppy",    deck="L5", value=round(c["pRow"][3], 3), tol=1e-3,
             anchor=r"<code>dog</code> \\\(0\.405\\\), <code>puppy</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p lion",     deck="L5", value=round(c["pRow"][4], 3), tol=1e-3,
             anchor=r"<code>puppy</code> \\\(0\.196\\\), <code>lion</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p kitten",   deck="L5", value=round(c["pRow"][1], 3), tol=1e-3,
             anchor=r"<code>lion</code> \\\(0\.140\\\), <code>kitten</code> \\\("+N+r"\\\)", must=True),
        dict(id="L5T p throne",   deck="L5", value=round(c["pRow"][8], 3), tol=1e-3,
             anchor=r"<code>kitten</code> \\\(0\.136\\\), … <code>throne</code> \\\("+N+r"\\\)", must=True),
        # the dog/throne worked numbers in the slide-43 low-D box (p_{j|i} → q, both displayed)
        dict(id="L5T near p svg", deck="L5", value=round(c["pRow"][2], 3), tol=1e-3,
             anchor=r'<tspan fill="var\(--accent-ink\)">dog</tspan><tspan>  \(near\): p='+N, must=True),
        dict(id="L5T near q svg", deck="L5", value=round(t["lowD"]["Q"][0][2], 3), tol=1e-3,
             anchor=r"\(near\): p=0\.405  &rarr;  q="+N, must=True),
        dict(id="L5T far p svg",  deck="L5", value=round(c["pRow"][8], 3), tol=1e-3,
             anchor=r'<tspan fill="var\(--ink-3\)">throne</tspan><tspan> \(far\):  p='+N, must=True),
        # high-D squared distances cat→dog (3.55) and cat→throne (43.88), slide-43 step-0 caption
        dict(id="L5T d2 dog",     deck="L5", value=round(t["highD"]["anchorSqDist"][2], 2), tol=5e-3,
             anchor=r"nearest \(\\\(d\^2="+N+r"\\\)\)", must=True),
        dict(id="L5T d2 throne",  deck="L5", value=round(t["highD"]["anchorSqDist"][8], 2), tol=5e-3,
             anchor=r"farthest \(\\\("+N+r"\\\)\)", must=True),
        # the symmetrised joint p_ij and Student-t q_ij for cat–dog (slide-44 JS arrays, index 1)
        dict(id="L5T joint p_ij", deck="L5", value=t["joint"]["P"][0][2], tol=1e-4,
             anchor=r"var p=\[0\.022072, "+N+r",", must=True),
        dict(id="L5T q_ij",       deck="L5", value=t["lowD"]["Q"][0][2], tol=1e-5,
             anchor=r"var q=\[0\.011766, "+N+r",", must=True),
        # KL(P‖Q) ≈ 0.0411 — the single cost number (SVG annotation + the step-1 KaTeX caption)
        dict(id="L5T KL svg",     deck="L5", value=round(t["kl"], 4), tol=1e-4,
             anchor=r"KL\(P‖Q\) = &#931; p log\(p/q\) = "+N, must=True),
        dict(id="L5T KL cap",     deck="L5", value=round(t["kl"], 4), tol=1e-4,
             anchor=r"\\frac\{p_\{ij\}\}\{q_\{ij\}\}=\\mathbf\{"+N+r"\}", must=True),
    ]

# ── L5 ENRICHMENT [C] claims: the re-laid-out slides now DISPLAY two new trajectories the gate must pin
#    so they cannot silently drift — (1) the word2vec/SGNS training-loss endpoints 4.85→2.63 (the new
#    "watch it train" slide) and (2) the REAL-UMAP dials n_neighbors=10, min_dist=0.1 and the
#    within/between tightness collapse 0.147→0.061 (the new UMAP slide). Same robustness contract as the
#    rest of L5: a GENERIC captured number with a STABLE nearby textual label (narrative phrase / KaTeX
#    caption / kicker dial) pinning the spot, so a drift is matched + flagged (not silently NOT FOUND).
#    `value` is the data/ canonical; the deck rounds the losses/tightness to 2–3 dp, `tol` absorbs that.
def l5_enrichment_claims():
    w, u = W2V, UMAP
    p = u["params"]
    snap = {s["epoch"]: s for s in u["snapshots"]}
    N = r"([\d.]+)"
    return [
        # word2vec/SGNS loss curve endpoints: 4.85 (random init) → 2.63 (epoch 150, −46%)
        dict(id="L5W loss before", deck="L5", value=w["loss"]["before"], tol=1e-2,
             anchor=r"loss "+N+r" (?:&rarr;|→) 2\.63", must=True),
        dict(id="L5W loss after",  deck="L5", value=w["loss"]["after"],  tol=1e-2,
             anchor=r"loss \\\("+N+r"\\\), &minus;46%", must=True),
        # REAL-UMAP dials shown in the slide kicker (n_neighbors = perplexity analogue; min_dist packing)
        dict(id="L5U n_neighbors", deck="L5", value=p["nNeighbors"], tol=0,
             anchor=r"n_neighbors="+N+r" ", must=True),
        dict(id="L5U min_dist",    deck="L5", value=p["minDist"], tol=1e-9,
             anchor=r"min_dist="+N+r" ", must=True),
        # within/between tightness collapse 0.147 → 0.061 over the 500-epoch optimisation (init→converged)
        dict(id="L5U tightness init", deck="L5", value=round(snap[0]["tightness"], 3), tol=1e-3,
             anchor=r"drops \\\("+N+r"\\to0\.061\\\)", must=True),
        dict(id="L5U tightness final",deck="L5", value=round(snap[500]["tightness"], 3), tol=1e-3,
             anchor=r"drops \\\(0\.147\\to"+N+r"\\\)", must=True),
    ]

# ── L6 'Council of Attention' [C] claims: every flagship transformer number == data/l6-*.json ─────
# Same robustness contract. The attention weights/output the deck displays are the row for `cat`
# (weights[1], output[1]); the full weight matrix's other two rows are also shown (the/sat). The
# triplet margin (0.2) is NOT displayed numerically in the deck (only symbolic m), so it is a [P]
# cross-file check below, not a [C] claim.
def l6_claims():
    w = ATTN["weights"]
    neg = CONTRA["sims"]["negatives"]
    return [
        # scaled dot-product scale √d_k = 2.0 (d_k=4): shown in the var-block and the prose
        dict(id="L6 √d_k var",    deck="L6", value=ATTN["sqrtdk"], tol=1e-9,
             anchor=r'<span lang="en">here \\\(=([\d.]+)\\\)</span>', must=True),
        dict(id="L6 √d_k prose",  deck="L6", value=ATTN["sqrtdk"], tol=1e-9,
             anchor=r"so \\\(\\sqrt\{d_k\}=([\d.]+)\\\)", must=True),
        # full softmax attention matrix — every displayed row (each sums to 1)
        dict(id="L6 w[the][0]",   deck="L6", value=w[0][0], tol=1e-3,
             anchor=r"\\\(\[([\d.]+),\\,0\.155,\\,0\.422\]\\\)", must=True),
        dict(id="L6 w[cat][cat]", deck="L6", value=w[1][1], tol=1e-3,
             anchor=r"puts <strong>([\d.]+)</strong> on itself", must=True),
        dict(id="L6 w[sat][sat]", deck="L6", value=w[2][2], tol=1e-3,
             anchor=r"\\\(\[0\.212,\\,0\.212,\\,([\d.]+)\]\\\)", must=True),
        # cat's output (context) vector = output[1] = [0.579, 1.996, 0.91, 0.425]
        dict(id="L6 out[cat][0]", deck="L6", value=ATTN["output"][1][0], tol=1e-3,
             anchor=r"<code>out = \[([\d.]+), 1\.996, 0\.91, 0\.425\]</code>", must=True),
        # InfoNCE: positive softmax prob 0.8877 and loss −log = 0.1191. Slide 47/48 is now a dynamic
        # InfoNCE diagram (re-laid-out), so we ROBUSTLY anchor on the STABLE KaTeX labels rather than
        # the old div/step-caption markup chain: p⁺ rides its symbol `\(p^{+}=N\)`, and the loss rides
        # the `\mathcal{L}=-\log … =\mathbf{N}` identity — both survive a re-layout of the surrounding box.
        dict(id="L6 InfoNCE p+",  deck="L6", value=CONTRA["infoNCE"]["pPositive"], tol=1e-4,
             anchor=r"\\\(p\^\{\+\}=([\d.]+)\\\)", must=True),
        dict(id="L6 InfoNCE loss",deck="L6", value=CONTRA["infoNCE"]["loss"], tol=1e-4,
             anchor=r"\\mathcal\{L\}=-\\log[^=]*=\\mathbf\{([\d.]+)\}", must=True),
        # temperature τ = 0.1 (shown in the E2E kicker)
        dict(id="L6 τ",           deck="L6", value=CONTRA["tau"], tol=1e-9,
             anchor=r"positive <code>kitten</code>, \\\(\\tau=([\d.]+)\\\)", must=True),
        # contrastive cosines to anchor cat — the two negatives not shared with L5's pair table
        dict(id="L6 cos cmp",     deck="L6", value=neg["computer"], tol=1e-3,
             anchor=r'<code>computer</code></td><td>[^<]*<span lang="ru">[^<]*</span><span lang="en">[^<]*</span></td><td class="cell-bad">([\d.]+)</td>', must=True),
        dict(id="L6 cos france",  deck="L6", value=neg["france"], tol=1e-3,
             anchor=r'<code>france</code></td><td>[^<]*<span lang="ru">[^<]*</span><span lang="en">[^<]*</span></td><td class="cell-bad">([\d.]+)</td>', must=True),
    ] + l6_enrichment_claims()

# ── L6 ENRICHMENT [C] claims: the re-laid-out slides now DISPLAY two new trajectories the gate must pin
#    so they cannot silently drift — (1) the slide-41 DistilBERT "same word, two senses" fan: the
#    cross-sense cosine of `bank`(river) vs `bank`(money) starting near-identical at the embed layer
#    (0.957) and DRIFTING apart to the final-block value (0.647); and (2) the slide-47 dynamic InfoNCE
#    diagram's loss trajectory endpoints 3.31 → … → 0.1191 (the tuned endpoint 0.1191 is already the
#    canonical InfoNCE loss, here pinned as the END of the animated curve too). Same robustness contract:
#    a GENERIC captured number with a STABLE textual label pinning the spot (the SVG caption phrase / the
#    KaTeX `\mathcal{L}=N` / the diagram's aria narrative). `value` is the data/ canonical, `tol` absorbs
#    the deck's display rounding (the fan prints 4 dp → 3 dp; the trajectory prints 2 dp / the exact loss).
def l6_enrichment_claims():
    s, ct = STACK, CTRAJ
    cp = {c["name"]: c for c in ct["checkpoints"]}
    N = r"([\d.]+)"
    return [
        # slide-41 cross-sense cos(bank,bank): embed-layer (block 0) ≈ 0.957 → final block ≈ 0.647
        # `value` is the data/ canonical (raw, un-rounded); `tol`=1e-3 absorbs the deck's 3-dp display
        # rounding (0.9572→0.957, 0.6465→0.647) while still catching a real drift in the 2nd/3rd decimal.
        dict(id="L6 stack cos init",  deck="L6", value=s["crossSenseCosByLayer"][0], tol=1e-3,
             anchor=r"cross-sense cos\(bank, bank\) = "+N, must=True),
        dict(id="L6 stack cos final", deck="L6", value=s["finalCrossSenseCos"], tol=1e-3,
             anchor=r"final: cos = "+N+r"  &mdash;", must=True),
        # slide-47 InfoNCE loss-trajectory endpoints: untuned 3.31 → tuned 0.1191 (the animated curve)
        dict(id="L6 traj loss start", deck="L6", value=cp["untuned"]["loss"], tol=1e-2,
             anchor=r"loss is high: \\\(\\mathcal\{L\}="+N+r"\\\)", must=True),
        dict(id="L6 traj loss end",   deck="L6", value=cp["tuned"]["loss"], tol=1e-4,
             anchor=r"InfoNCE loss falls from 3\.31 to 0\.86 to "+N+r"\.", must=True),
    ]

def _claim_hits(c, text):
    """Anchor hits + the ones that fail the value check.

    Tried on the raw text first (anchors may carry literal tuples like "0,0,6" that must NOT be
    canonicalised), then on the RU-comma-normalised text. The fallback fires both when the raw pass
    finds nothing AND when it matched but truncated a RU decimal ("0,59" captured as "0") — a hit that
    validates is always preferred, so the gate stays exact while reading both renderings.
    """
    hits = re.findall(c["anchor"], text)
    def _bad(hs):
        out = []
        for h in hs:
            try:
                if abs(num(h) - c["value"]) > c["tol"]:
                    out.append(h)
            except ValueError:
                out.append(h)
        return out
    bad = _bad(hits)
    if not hits or bad:
        alt = re.findall(c["anchor"], norm_dec(text))
        if alt and not _bad(alt):
            return alt, []
    return hits, bad

def check_claim(c, text):
    hits, bad = _claim_hits(c, text)
    if not hits:
        return ("HARD" if c["must"] else "WARN", f'{c["id"]}: NOT FOUND in {c["deck"]} (expected ≈{c["value"]})')
    if bad:
        return ("HARD", f'{c["id"]}: DRIFT in {c["deck"]} — displayed {bad} vs data/ {c["value"]}')
    return ("OK", f'{c["id"]}: {len(hits)} match(es) ≈{c["value"]} ✓')

# ── [A] ARITHMETIC: recompute cos/Euclid from data/ vectors; recompute every displayed fraction ──
FRAC = re.compile(r'\\frac\{(\d+)\\cdot (\d+)\}\{(\d+)\\cdot (\d+)\}\s*=\s*(\d+)')
DIVN = re.compile(r'\((\d+)\\cdot (\d+)\)/\((\d+)\\cdot (\d+)\)\s*=\s*(\d+)')

def arithmetic_checks(report, texts):
    pp = primary_pair()
    u, v = tuple(pp["u"]), tuple(pp["v"])
    cos = (u[0]*v[0] + u[1]*v[1]) / (math.hypot(*u) * math.hypot(*v))
    euclid = math.hypot(u[0]-v[0], u[1]-v[1])
    if abs(cos - pp["cos"]) > 1e-6 or abs(euclid - pp["euclid"]) > 1e-4:
        report.append(("HARD", f"arithmetic(cos): recomputed cos={cos:.4f}/euclid={euclid:.4f} ≠ data/ "
                               f'{pp["cos"]}/{pp["euclid"]}'))
    else:
        report.append(("OK", f"arithmetic(cos): cos={cos:.0f}, euclid=√162≈{euclid:.2f} == data/ ✓"))
    nfrac, bad = 0, 0
    for deck, txt in texts.items():
        for a, b, c, d, res in FRAC.findall(txt) + DIVN.findall(txt):
            nfrac += 1
            if abs(int(a)*int(b)/(int(c)*int(d)) - int(res)) > 1e-9:
                bad += 1
                report.append(("HARD", f"arithmetic({deck}): displayed {a}·{b}/({c}·{d}) = {res} is WRONG "
                                       f"(= {int(a)*int(b)/(int(c)*int(d)):g})"))
    if not bad:
        report.append(("OK", f"arithmetic(fractions): {nfrac} displayed a·b/(c·d) results all correct ✓"))

# ── [G] COVERAGE GUARD — the facts-gate AUTO-EXTENDS to new content (no NEW un-gated displayed number) ──
# A ratchet (mirrors _audit/font-gate.mjs): every "grounded" number a deck/Book DISPLAYS that is not
# value-covered by a [C] claim is counted PER SURFACE; the count may not EXCEED the frozen baseline below.
# Adding an un-gated number to an existing unit — or ANY un-gated number to a NEW unit (L7…, whose baseline
# defaults to 0) — bumps the count → HARD, forcing the author to either gate it (add a [C] claim → the number
# becomes covered and the count drops) or, if it is genuinely NOT data (a math constant, an illustration),
# raise that surface's baseline here with a one-line why. Burn the baseline DOWN over time by gating the
# worked intermediates. This is what makes correctness scale to new content as cheaply as publication.
#
# Surface = the SAME displayed-text surface the [C] anchors match: tags stripped (so SVG geometry attrs
# x=/y=/cx=/height=… are excluded — those are not "displayed numbers") while prose + KaTeX digits are kept.
# "Grounded" = a decimal with ≥2 fractional digits; arXiv ids (1901.04085) and leading-zero dates (03.06)
# are excluded (not numbers in the data sense). "Covered" = within max(claim-tol, 0.001) of a gated value —
# i.e. the displayed number IS, to display precision, a gated value (a coincidental match needs a value
# within 1e-3; a genuinely new data-number, e.g. an L7 cosine 0.7531, is not and so HARD-fails until gated).
# TIGHTENED (2026-08, RU decimal-comma canon + locale-aware coverage key): one number now counts once
# across its EN and RU renderings, and the L15 recap/L9 split resolved a few more to covered. Stronger.
COVERAGE_BASELINE = {
    # L3–L6 deck/book baselines TIGHTENED after L7 and again after L8: each new unit's value-gated worked
    # numbers (L8: the ColBERT/SPLADE/RRF/LambdaRank intermediates 0.0325, 0.7685, 2.35, …) are matched
    # GLOBALLY, so they now ALSO cover some numbers earlier units displayed but had not gated — the un-gated
    # count dropped, so the ratchet is lowered to match (strictly stronger; never raised). New units (L7/L8)
    # stay at 0 via .get(surf, 0), forcing every ≥2-dp number they display to be gated.
    # TIGHTENED again after the L9/L10 A+ expansion: the new L9 (metrics/HNSW-toy2/efSweep/IVF-toy2/PQ-ADC/
    # memory/codebook/highd-cv) and L10 (retrieval-math/budget-sweep/RRF/rerank/routing/decomp/RAPTOR) [C]
    # claims are matched GLOBALLY, so they ALSO cover numbers some earlier units displayed-but-shared
    # (cosines, fractions, √-norms reused across lectures) → those un-gated counts dropped, ratchet lowered
    # to match (strictly stronger; never raised). New units L9/L10 stay at 0 via .get(surf, 0).
    # TIGHTENED again after the L11/L12 [C] expansion: the new L11 reverse-question cosines (0.92/0.88/0.31)
    # and RAGAS/Goodhart means are matched GLOBALLY, so they ALSO coincidentally cover a handful of earlier
    # displayed-but-shared numbers (deck:L2 0.31, deck:L3 0.8798≈0.88, deck:L4 0.6538/0.654/0.88, deck:L5
    # 0.3098≈0.31, book:L1/L6 0.92) → those un-gated counts dropped, ratchet lowered to match (strictly
    # stronger; never raised). New units L11/L12 stay at 0 via .get(surf, 0).
    # RE-BASELINED after the num()/_COV_DEC comma-awareness upgrade (2026-06): the gate now SEES RU/TT
    # decimal-commas (0,6931) as well as dots, so the trilingual Book's grounded numbers are watched on
    # BOTH the EN (dot) and RU/TT (comma) surfaces (strictly more coverage). The RU decimal-comma SWEEP is
    # count-NEUTRAL for the Book (a swept 0.92→0,92 stays counted), so book:L3-L6 are unchanged; the small
    # shifts are deck RU-span commas now made visible (deck:L2 +1, deck:L3 +3, book:L2 +1 grandfathered, same
    # status as their EN twins) and num() resolving a few to covered (deck:L5 −2, deck:L6 −3 — TIGHTENED).
    # FURTHER TIGHTENED (2026-06): gating preferenceForB (L4 IL pref = 0.64) now covers a previously-ungated
    # 0.64-ish number in book:L4 (19->18) and deck:L6 (26->25) — strictly stronger (a [C] claim now pins them).
    # AUDIT-2 (2026-06): gated the slide-33 PCA-rotate kicker var2dPct=97.21 (L5 PCA 2-D kick) → deck:L5 45->44;
    # L5 RU/TT decimal-comma canon fixes resolve one more book number to covered → book:L5 12->11. Both stronger.
    # TIGHTENED again after the L13 deep-dive REBUILD (2026-06): the rebuilt ~52-slide deck shows the spine
    # cosines (0.82/0.05/0.79), the two-axis split (0.18/0.62), BM25 recall (0.625) and the by-hand InfoNCE
    # P+ (0.42) + Boltzmann weights (0.35/0.53) as VISIBLE text, now gated GLOBALLY — those values ALSO cover
    # a few shared numbers in L3-L6 (e.g. 0.82/0.62/0.18/0.05 cosines), so their un-gated counts dropped:
    # deck:L3 49->46, L4 33->30, L5 44->42, L6 25->24; book:L3 12->10, L4 18->16, L5 11->10, L6 6->5. Stronger.
    # RE-BASELINED after the BEIR dense-DPR correction 0.38→0.35 (2026-06, Thakur et al. 2021 canonical DPR
    # BEIR avg nDCG@10): denseDPR is no longer a gated 0.38, so a few earlier units' INDEPENDENT 0.38s that
    # were only INCIDENTALLY covered by that value lose their cover — these are NOT new numbers and are
    # unrelated to BEIR: deck:L6 24→25 + book:L6 5→6 (LayerNorm worked example, variance \(0.38\to1\),
    # l6 beat climb-block-geo); deck:L12 0→2 + book:L12 0→2 (CLIP contrastive-gap cosine, mismatched pairs
    # near \(0.38\), l12 beats clip-matrix/clip-topk, EN+RU surfaces). The new gated BEIR value 0.35 is
    # already gated elsewhere (L13 Boltzmann weight), so nothing regressed; the bump only re-grandfathers
    # pre-existing correct numbers whose accidental cover moved. Strictly: the BEIR number is now pinned to 0.35.
    # deck:L3/L4/L5 + book:L3/L4 TIGHTENED (2026-07) — the new l14_deck_claims() gate values (0.45/0.28/0.57/…)
    # coincide with a few previously-grandfathered un-gated numbers on those surfaces, so the global gated set
    # now covers them; ratchet the baselines down to the residual counts (the coverage-guard's own suggestion).
    # deck:L5/L18 TIGHTENED (2026-07): the new l15_deck_claims() gated values coincide with a couple of
    # previously-grandfathered un-gated numbers on those surfaces (softmax/temperature decimals reused), so
    # the global gated set now covers them → ratchet down (strictly stronger; never raised).
    # TIGHTENED again after the L20 depth pass (2026-08): l20_depth_claims() gates ~90 further values
    # (the fertility table, the MTEB(rus, v1.1) leaderboard, MIRACL-ru, RusBEIR + its length regime,
    # Savoy 2009's MAP ladder, the Snowball third pass, the ё/е recall ladder). They are matched
    # GLOBALLY, so they ALSO cover a handful of numbers L2-L6 displayed but had never gated (shared
    # ratios and MAP-scale decimals) — the un-gated counts dropped, so the ratchet is lowered to match
    # (strictly stronger; never raised). deck/book:L16-L18 are left to their own owners' passes.
    # TIGHTENED (2026-08 debt sweep): the gate had been WARNing for ten surfaces that their real
    # un-gated count sat below the frozen ratchet — the L16–L20 expansion gated numbers that these
    # older units also display. A ratchet wider than the fact is not a ratchet: it silently licenses
    # new un-gated numbers up to the old slack. Every value below is the count the gate itself
    # measured; nothing was raised.
    "deck:L0": 0, "deck:L1": 1, "deck:L2": 4, "deck:L3": 31, "deck:L4": 18, "deck:L5": 31, "deck:L6": 17,
    "book:L0": 0, "book:L1": 0, "book:L2": 5,  "book:L3": 7,  "book:L4": 12, "book:L5": 8,
    # book:L6 — RAISED 6 → 37 when the L06 climb became `ncd-chain`, the end-to-end worked example.
    # Its ten scroll-step captions ARE Book prose, and they walk the whole computation: every
    # embedding row, every scaled score, the exponentials, the row sums, the context cells, the pooled
    # point and both document scores. Raising a coverage baseline is normally how a gate rots, so the
    # justification has to be load-bearing: these numbers are NOT ungated, they are gated HARDER.
    # `_audit/ncd-gate.mjs` check [E] requires that EVERY decimal quoted in an ncd-* widget's captions
    # exist in that widget's own data/ file — all of them, not the handful a C() claim happens to pin —
    # and `_research/gen_l6_chain.py` ASSERTS at generation time that the chain reproduces
    # data/l6-attention.json to the digit. A number here cannot drift without one of those two failing.
    "book:L6": 22,
    "deck:L12": 2, "book:L12": 2,
    # deck:L14 "The Artificer's Quill" — all displayed toy numbers are now gated in l14_deck_claims() → 0.
    "deck:L14": 0,
    # deck:L15 "BERT & other Transformers" — NOW FULLY GROUNDED (2026-07): the worked-example numbers are
    # emitted by gen_l15.py (stdlib math.exp/sin/cos → data/l15-attention.json) and the reported benchmarks are
    # cited in data/l15-bench.json (each `cite` a data/papers.json id). l15_deck_claims() pins EVERY displayed
    # ≥2-dp value deck==data: softmax weights 0.114/0.042/0.844 → Y1 0.958/0.886, √dₖ 0.995 vs 0.909, PE
    # 0.841/0.540/0.010, 12·768²=7.08M, causal 0.035/0.259/0.705 & 0.119/0.881, decoding base+cumulative
    # (0.770/0.896/0.972)+top-k(0.731)+temperature(0.829/0.375), and O(n²) memory 0.52 MB / 2.15 GB. Un-gated
    # count → 0 (was 14 "imported/self-contained"); book:L15 → 0 (the global gated set covers the one prose
    # value). Any FUTURE ungated ≥2-dp number HARD-fails until gated. Goes beyond siblings L16–L18 (baseline-frozen).
    "deck:L15": 0,
    "book:L15": 0,
    # deck:L16 "Late Chunking" — TIGHTENED 9 → 0 (2026-08). Was baseline-frozen with no [C] anchors at all;
    # the deepening pass replaced that with l16_deck_claims(), which pins EVERY displayed ≥2-dp value
    # deck == data/ (ACME Table 4 in full, the Berlin cosines + the Δ column, the gap law, the Merola &
    # Singh replication, the No-Chunking column, Table 3's span-pooling regression, Table 5's +24.47 % and
    # Anthropic's $1.02/Mtok), backed by provenance_l16() which RE-DERIVES the pooling toy, the gap law and
    # the Algorithm-2 ledger and pins the bench's structural invariants. Strictly stronger; never raised.
    "deck:L16": 0,
    # book:L16 — TIGHTENED 10 → 1 (2026-08): l16_deck_claims() gates the values the Book prose reuses
    # (Berlin, the ACME toy, Quora's 87.19, the recomputed +1.41), so only one grandfathered prose decimal
    # is left uncovered. Strictly stronger; never raised.
    "book:L16": 1,
    # deck:L17 "Shannon Entropy" — TIGHTENED 18 → 0 by the depth pass (2026-08). The deck went 45 → 84 slides
    # and every ≥2-dp number it displays is now pinned deck==data by l17_deck_claims(): the computed side against
    # data/l17-entropy.json (gen_l17.py — the coin, Markov 1913 conditional entropy/mutual information, the
    # non-dyadic Huffman gap, the block-coding ladder, Kraft, the EN/RU letter-frequency entropies, IDF in bits)
    # and the reported side against data/l17-bench.json (Shannon 1951 Fn + units, Cover-King 1.34, text8 bpc,
    # WSJ perplexities, Yaglom's Russian ladder, Spärck Jones, Church & Gale, Pibiri & Venturini, clarity).
    # The 18 grandfathered numbers were not deleted — they were GATED, so the ratchet only moves down. A NEW
    # ungated ≥2-dp number on this surface now HARD-fails immediately.
    "deck:L17": 0,
    # book:L17 mirrors the deck's Shannon numbers in prose (coin 0.811, code 1.75, 79/102, Fn 4.76/4.03,
    # bounds 0.6/1.3, 'E' 12.7) — same gen_l17.py + cited-bench provenance as deck:L17.
    "book:L17": 1,
    # deck:L18 / book:L18 "The Curved Map" — numbers from gen_l18.py (data/l18-geometry.json toy: aniso
    # 0.8985/-0.0323/-0.0352, hubness skew/maxNk/corr) + cited bench (data/l18-bench.json: GPT-2 0.6/0.99,
    # Radovanović skew 0.121/1.541/5.445/19.21, Su STS-B 59.04/71.34, SimCSE 76.3/81.6, CSLS 42.6/66.1,
    # Li -50.49/-24.61). Provenance in those files + gen_l18.py; frozen so future ungated additions HARD-fail.
    # deck:L18 "The Curved Map" — NOW FULLY GATED (2026-08): l18_deck_claims() pins every displayed ≥2-dp
    # value deck==data across the deepened 76-slide deck — the cone toy + its corrected all-but-the-top
    # (0.8985 / −0.0323 / −0.0313, PC1·cone 0.9997), the c/σ dial, the four-cities whitening walk-through,
    # the reverse-kNN toy and the same cloud under CSLS (2.5904 → 0.3923), plus every cited table it now
    # displays (Timkey's replication, IsoScore, Radovanović with its real provenance, Su's transductive vs
    # inductive split, SimCSE against BOTH its baselines, Conneau's corrected task, QB-Norm, Feldbauer,
    # Hub Highway, Matryoshka). Baseline 17 → 0: any FUTURE ungated ≥2-dp number HARD-fails.
    "deck:L18": 0,
    # book:L18 mirrors the deck's numbers in trilingual prose; still baseline-frozen (the Book's own
    # anchors are not written yet), so a NEW ungated Book number beyond these still HARD-fails.
    "book:L18": 0,
}
_COV_DEC   = re.compile(r'(?<![\d.,])\d+[.,]\d{2,}(?!\d)')# grounded signature: a decimal (dot OR RU comma), ≥2 fractional digits
_COV_ARXIV = re.compile(r'^\d{4}[.,]\d{4,}$')             # arXiv id (e.g. 1901.04085) — not data
_COV_DATE  = re.compile(r'^0\d+[.,]')                     # leading-zero date (e.g. 03.06) — not data
_COV_THOU  = re.compile(r'^[1-9]\d{0,2}(,\d{3})+$')       # thousands-grouped integer (e.g. 94,287 / 10,000) — not a decimal

def _coverage_visible(html):
    t = re.sub(r'<aside class="slide-notes".*?</aside>', ' ', html, flags=re.S)   # speaker notes: not shown
    t = re.sub(r'<style.*?</style>|<script.*?</script>', ' ', t, flags=re.S)
    return re.sub(r'<[^>]+>', ' ', t)

def _coverage_uncovered(html, gated):
    out = set()
    for m in _COV_DEC.finditer(_coverage_visible(html)):
        s = m.group()
        if _COV_ARXIV.match(s) or _COV_DATE.match(s) or _COV_THOU.match(s):
            continue
        d = num(s)                                           # num() parses dot, RU comma, and KaTeX {,} alike
        if not any(abs(d - v) <= max(tol, 0.001) for v, tol in gated):
            out.add(f"{d!r}")                                # canonical key: one number counts once in EN+RU
    return out

def coverage_guard(report, text, book):
    gated = [(float(c["value"]), float(c.get("tol", 1e-3))) for c in claims()] \
          + [(float(c["value"]), float(c.get("tol", 1e-3))) for c in book_claims()]
    surfaces = {f"deck:{k}": v for k, v in text.items()}
    surfaces.update({f"book:{k}": v for k, v in book.items()})   # book empty if docs/ not built → skipped
    hard = 0
    for surf in sorted(surfaces):
        n = len(_coverage_uncovered(surfaces[surf], gated))
        base = COVERAGE_BASELINE.get(surf, 0)   # a NEW unit (not in the baseline) starts at 0 → must gate
        if n > base:
            hard += 1
            report.append(("HARD", f"coverage-guard({surf}): {n} un-gated displayed number(s) > baseline {base} — "
                                   f"gate the new number (add a [C] claim) or raise this surface's baseline with a why"))
        elif n < base and surf in COVERAGE_BASELINE:
            report.append(("WARN", f"coverage-guard({surf}): {n} < baseline {base} — tighten COVERAGE_BASELINE to {n}"))
    if not hard:
        total = sum(len(_coverage_uncovered(surfaces[s], gated)) for s in surfaces)
        report.append(("OK", f"coverage-guard: {len(surfaces)} surfaces ≤ baseline; {total} grandfathered un-gated "
                             f"number(s) — a NEW number, or any number in a NEW unit (baseline 0), HARD-fails until gated ✓"))

# ── [P] PROVENANCE (L16 "Late Chunking"): gen_l16 emits data/ directly (stdlib, no RAW twin). Recompute
#    every DERIVED block — the pooling toy, the gap law, the Algorithm-2 ledger — and pin the structural
#    invariants of the transcribed bench. The last group is the load-bearing one: it re-derives the three
#    BeIR deltas from the averages the deck prints, so the widget's law-test anchors (+1.9 > +1.8 > +1.4)
#    cannot silently disagree with the table they are supposed to be predicting. ──
def provenance_l16(report):
    ch, be = L16CH, L16B["beir"]
    P, G, L = ch["pool"], ch["gapLaw"], ch["longLate"]
    checks = [
        # W1 — the pooling toy: cos(q, (1,1)) = 1/√2, and naive is exactly orthogonal to the query
        ("pool.lateCos==1/√2", P["lateCos"], round(1 / math.sqrt(2), 4), 1e-4),
        ("pool.naiveCos==0",   P["naiveCos"], 0.0, 1e-9),
        # W2 — the gap law is min(1, g/s), rounded half-UP to 4 places (NOT Python's half-to-even round)
        *[(f"gapLaw[{s}]==min(1,g/s)", G["orphanFraction"][i],
           math.floor(min(1.0, G["gapTokens"] / s) * 10000 + 0.5) / 10000, 1e-9)
          for i, s in enumerate(G["sizes"])],
        # W3 — Algorithm 2's ledger, every line re-derived from (docTokens, lMax, omega)
        ("longLate.stride==lMax−ω",  L["stride"], L["lMax"] - L["omega"], 0),
        ("longLate.macroChunks",     L["macroChunks"], math.ceil((L["docTokens"] - L["omega"]) / L["stride"]), 0),
        ("longLate.overhead==(n−1)ω", L["overheadTokens"], (L["macroChunks"] - 1) * L["omega"], 0),
        ("longLate.encoded==doc+ovh", L["tokensEncoded"], L["docTokens"] + L["overheadTokens"], 0),
        # the three BeIR deltas the widget uses as its law-test anchors == the table the deck prints
        ("gapLaw.anchor.sentence", G["anchors"]["sentence"], round(be["sentenceLateAvg"] - be["sentenceNaiveAvg"], 1), 1e-9),
        ("gapLaw.anchor.fixed256", G["anchors"]["fixed256"], round(be["fixed256LateAvg"] - be["fixed256NaiveAvg"], 1), 1e-9),
        ("gapLaw.anchor.semantic", G["anchors"]["semantic"], round(be["semanticLateAvg"] - be["semanticNaiveAvg"], 1), 1e-9),
        # §4.1's prose rounds to 1.5 %; the recomputed SEMANTIC delta is 1.41 — the deck quotes the latter
        ("beir.semanticRecomputedDelta", be["semanticRecomputedDelta"],
         round(be["semanticRecomputedLate"] - be["semanticRecomputedNaive"], 2), 1e-9),
        # and the recomputed pair must round to the published semantic row, not to the fixed-size one
        ("beir.semanticRecomputedNaive~row", round(be["semanticRecomputedNaive"], 1), be["semanticNaiveAvg"], 1e-9),
        ("beir.semanticRecomputedLate~row",  round(be["semanticRecomputedLate"], 1),  be["semanticLateAvg"],  1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L16({name}): data/ disagree/invariant broken — {a} vs {b}"))
    flags = []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L16({name}): structural invariant broken"))
    # the toy's whole point: naively a GENERIC DISTRACTOR outranks the answer, late chunking inverts that.
    # The header chunk must stay a WEAKER third rival in both columns — an earlier docstring claimed the
    # header did the burying, which is what D-1 of the audit caught.
    need(ch["distractorNaive"] > ch["goldNaive"], "naive: distractor > gold")
    need(ch["goldLate"] > ch["distractorLate"], "late: gold > distractor")
    need(ch["headerNaive"] < ch["goldNaive"] and ch["headerLate"] < ch["goldLate"], "header is never the burier")
    need(ch["goldRankNaive"] == 2 and ch["goldRankLate"] == 1, "rank inversion 2 → 1")
    # the law's ORDER prediction — smaller chunks, bigger delta — must hold for the three reported anchors
    need(G["anchors"]["sentence"] > G["anchors"]["fixed256"] > G["anchors"]["semantic"], "law predicts the Δ order")
    # the record adds up, and the losing cell really is a loss
    rec = be["record"]
    need(rec["wins"] + rec["ties"] + rec["losses"] == rec["cells"], "BeIR record sums to 36 cells")
    need(be["lossCell"]["late"] < be["lossCell"]["naive"], "the loss cell is a loss")
    need(all(t["late"] == t["naive"] for t in be["tieCells"]), "the tie cells are ties")
    # ACME Table 4: naive buries the gold row below the header; late and contextual both surface it at #1
    rows = L16B["acme"]["rows"]
    gold = next(r for r in rows if r["n"] == L16B["acme"]["goldRow"])
    rank = lambda key: sorted(rows, key=lambda r: -r[key]).index(gold) + 1
    need(rank("naive") == 2 and rank("late") == 1 and rank("contextual") == 1, "ACME 2 → 1 under both fixes")
    need(gold["contextual"] > gold["late"], "ACME: contextual edges late out (the paper does not hide it)")
    # Quora is an identity by construction (documents shorter than one chunk) — nothing to restore
    q = next(r for r in L16B["noChunking"]["rows"] if r["dataset"] == "Quora")
    need(q["naive"] == q["late"] == q["none"], "Quora: naive == late == no-chunking")
    # the independent replication really is a REGRESSION on both of its first two rows
    rp = L16B["replication"]
    need(rp["collapse"]["late"] < rp["collapse"]["early"], "replication: BGE-M3 collapses")
    need(rp["passages"]["late"] < rp["passages"]["early"], "replication: early wins on passages")
    need(rp["headToHead"]["contextual"] > rp["headToHead"]["late"], "replication: contextual wins head-to-head")
    # ColBERTv2 at its default (2-bit) really is at parity with a single-vector index — the F-10 repair
    cb = L16B["colbert"]
    need(cb["v2TwoBitGiB"] == cb["singleVectorGiB"], "ColBERTv2 2-bit == single-vector index (parity)")
    need(cb["v1GiB"] > cb["v2TwoBitGiB"] > cb["v2OneBitGiB"], "ColBERT v1 > v2/2-bit > v2/1-bit")
    if not bad and not flags:
        report.append(("OK", f"provenance-L16: {len(checks)} recompute + 16 structural invariants consistent ✓"))


# ── [P] PROVENANCE (L7 self-consistency): gen_l7 emits data/ directly (no RAW twin), so — like L3–L6 —
#    we recompute the stdlib-reproducible toy numbers and pin cross-file + structural invariants. ──
def provenance_l7(report):
    bt, br = BIENC["toy"], BIENC["real"]
    ct, cc, cr = CROSSENC["toy"], CROSSENC["contrast"], CROSSENC["real"]
    q, m = CASCADE["quality"], MSMARCO
    checks = [
        # toy stdlib-reproducible: cos = dot/(|q||d|) = 2/√6 ; score = sigmoid(logit)
        ("toy.cosRel",   bt["cosRel"],   round(2 / math.sqrt(6), 4), 1e-4),
        ("toy.scoreNeg", ct["scoreNeg"], round(1 / (1 + math.exp(-ct["logitNeg"])), 4), 1e-4),
        # cross-path: the cascade BM25 nDCG re-uses the L4 honest nDCG (same number, two files)
        ("cascade.bm25==l4", q["bm25Ndcg"], METRICS["ndcg"], 1e-9),
    ]
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L7({name}): data/ disagree/invariant broken — {a} vs {b}"))
    flags = []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L7({name}): structural invariant broken"))
    need(bt["cosRel"] > bt["cosIrr"], "toy cosRel>cosIrr")
    need(br["cosRel"] > br["cosIrr"], "real cosRel>cosIrr")
    need(ct["scoreRel"] > ct["scoreNeg"], "toy scoreRel>scoreNeg")
    need(cr["pairRel"]["score"] > cr["pairBad"]["score"], "real Judge separates pairRel>pairBad")
    need(cc["biCosBad"] > cr["pairBad"]["score"], "Scout over-rates: biCosBad>crossScoreBad")
    need((cc["crossScoreRel"] - cc["crossScoreBad"]) > (cc["biCosRel"] - cc["biCosBad"]), "Judge gap>Scout gap")
    need(q["bm25Ndcg"] < q["rerankedNdcg"] <= q["idealNdcg"], "bm25<reranked<=ideal")
    need(CASCADE["stages"][0]["w"] > CASCADE["stages"][1]["w"] > CASCADE["stages"][2]["w"], "cascade narrowing")
    need(m["retrieve"]["recallAt"]["100"] >= m["retrieve"]["recallAt"]["10"], "recall monotone")
    need(m["rerank"]["mrrAt10"] > m["retrieve"]["mrrAt10"], "rerank improves MRR")
    need((bt["cosRel"] - bt["cosIrr"]) * (br["cosRel"] - br["cosIrr"]) > 0, "toy<->real sign agree")
    if not bad and not flags:
        report.append(("OK", f"provenance-L7: {len(checks)} recompute + 11 structural invariants consistent ✓"))


# ── [P] PROVENANCE (L8 "The Alliance"): gen_l8 emits data/ directly (stdlib, no RAW twin) — recompute the
#    toy worked numbers and pin the cross-pillar structural invariants (the four BAMs). Real blocks (frozen
#    ColBERT/SPLADE) are optional; only an ORDERING agreement is pinned, and only when the heavy step ran. ──
def provenance_l8(report):
    cb, sp = COLBERT8["toy"], SPLADE8["toy"]
    hy, lt = HYBRID8, LTR8["toy"]
    checks = []
    # ColBERT: maxSim = sum of per-query-token row-maxes
    for tag, doc in (("rel", cb["docRel"]), ("irr", cb["docIrr"])):
        checks.append((f"colbert.{tag}.maxSim==ΣrowMax", doc["maxSim"], round(sum(doc["rowMax"]), 2), 1e-9))
    # SPLADE: w = log(1+ReLU(logit)); dot = Σ round(q·d, 4) (round-then-sum: products sum to the displayed dot)
    relu = [max(0.0, x) for x in sp["query"]["logits"]]
    for i, w in enumerate(sp["query"]["weights"]):
        checks.append((f"splade.w[{i}]==log(1+ReLU)", w, round(math.log(1 + relu[i]), 4), 1e-4))
    checks.append(("splade.dot==Σprod", sp["dot"], round(sum(t["prod"] for t in sp["terms"]), 4), 1e-4))
    # Hybrid: score = 1/(k+rSparse) + 1/(k+rDense)
    k = hy["k"]
    for f in hy["fused"]:
        checks.append((f"hybrid.{f['id']}.score", f["score"], round(1 / (k + f["rSparse"]) + 1 / (k + f["rDense"]), 4), 1e-4))
    # LTR: RankNet σ / cost / gradient, the mis-ordered nDCG, ΔnDCG and λ
    d = lt["scoreDiff"]
    checks.append(("ltr.rankNetProb==σ(Δ)", lt["rankNetProb"], round(1 / (1 + math.exp(-d)), 4), 1e-4))
    checks.append(("ltr.rankNetCost==log(1+e^-Δ)", lt["rankNetCost"], round(math.log(1 + math.exp(-d)), 4), 1e-4))
    checks.append(("ltr.gradient==1-σ(Δ)", lt["gradient"], round(1 - 1 / (1 + math.exp(-d)), 4), 1e-4))
    checks.append(("ltr.ndcg.current", lt["ndcg"]["current"], round((1 / math.log2(3)) / (1 / math.log2(2)), 4), 1e-4))
    checks.append(("ltr.deltaNdcg==after-current", lt["ndcg"]["deltaNdcg"], round(lt["ndcg"]["afterSwap"] - lt["ndcg"]["current"], 4), 1e-9))
    checks.append(("ltr.lambda==grad·ΔnDCG", lt["lambda"], round(lt["gradient"] * lt["ndcg"]["deltaNdcg"], 4), 1e-3))
    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L8({name}): data/ disagree/invariant broken — {a} vs {b}"))
    flags = []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L8({name}): structural invariant broken"))
    # ColBERT: each rowMax IS the row max; the BAM — the relevant doc beats the lexical-trap finance doc
    for tag, doc in (("rel", cb["docRel"]), ("irr", cb["docIrr"])):
        need(all(abs(doc["rowMax"][i] - max(doc["sim"][i])) < 1e-9 for i in range(len(doc["rowMax"]))), f"colbert.{tag} rowMax==max(sim)")
    need(cb["docRel"]["maxSim"] > cb["docIrr"]["maxSim"], "colbert maxSimRel>maxSimIrr (BAM)")
    # SPLADE: products reconcile to the dot; the two expansion terms are positive-weight yet non-literal
    need(all(abs(t["prod"] - t["q"] * t["d"]) <= 1e-3 for t in sp["terms"]), "splade prod==round(q·d)")
    literal = set(sp["query"]["text"].split())
    vocab, w = SPLADE8["toy"]["vocab"], sp["query"]["weights"]
    need(all(w[vocab.index(e)] > 0 and e not in literal for e in sp["query"]["expansion"]), "splade expansion positive & non-literal")
    need(set(sp["query"]["expansion"]) == {"bank", "water"}, "splade expansion=={bank,water}")
    # Hybrid: fused sorted by score desc; the consensus doc D2 beats the sparse favourite D1
    sc = [f["score"] for f in hy["fused"]]
    need(sc == sorted(sc, reverse=True), "hybrid fused sorted desc")
    byid = {f["id"]: f for f in hy["fused"]}
    need(byid["D2"]["score"] > byid["D1"]["score"], "hybrid D2(consensus)>D1(sparse#1)")
    need(hy["sparse"]["order"][0] == "D1", "hybrid D1 is the sparse #1")
    # LTR: a confident pairwise preference (>0.5) and a positive force
    need(lt["rankNetProb"] > 0.5, "ltr rankNetProb>0.5")
    need(lt["lambda"] > 0, "ltr lambda>0")
    # toy↔real ORDERING agreement (only when the heavy ColBERT step has run and spliced a real block)
    real = COLBERT8.get("real")
    if real and isinstance(real.get("maxSimRel"), (int, float)) and isinstance(real.get("maxSimIrr"), (int, float)):
        need((cb["docRel"]["maxSim"] - cb["docIrr"]["maxSim"]) * (real["maxSimRel"] - real["maxSimIrr"]) > 0, "colbert toy<->real sign agree")
    if not bad and not flags:
        report.append(("OK", f"provenance-L8: {len(checks)} recompute + structural invariants consistent ✓"))


# ── [P] PROVENANCE (L9 "Hyperspace Lanes"): gen_l9 emits data/ directly (stdlib, no RAW twin) — recompute
#    the four climbs from the frozen toy geometry and pin the cross-pillar invariants. The IVF committed
#    geometry (2-in-c0 / 3rd-in-c1 / c1 = 2nd-nearest cell) is pinned here too — without it nprobe=2 would
#    not reach the 3rd NN and recall would not climb 0.6667→1.0 (L9.md E12). Real blocks (frozen FAISS) are
#    optional and not recomputed. ──
def provenance_l9(report):
    H, IV, PQ, LT = HNSW9["toy"], IVF9["toy"], PQ9, LAT9
    def dist(a, b):
        return math.hypot(a[0] - b[0], a[1] - b[1])
    checks, flags = [], []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L9({name}): structural invariant broken"))

    # ── HNSW: recompute greedy descent from coords+edges, brute-force NN, recall ──
    nodes, q, labels = H["coords"]["nodes"], H["query"], H["labels"]
    adj = {i: set() for i in range(len(nodes))}
    for i, j in H["edges"]:
        adj[i].add(j); adj[j].add(i)
    cur, path = H["entry"], [H["entry"]]
    while True:
        cur_d = dist(nodes[cur], q); best, best_d = None, cur_d
        for nb in sorted(adj[cur]):
            if dist(nodes[nb], q) < best_d:
                best_d, best = dist(nodes[nb], q), nb
        if best is None:
            break
        cur = best; path.append(cur)
    bf = min(range(len(nodes)), key=lambda i: dist(nodes[i], q))
    g = H["greedy"]
    need([labels[i] for i in path] == g["path"], "hnsw greedy path == recomputed descent")
    need(g["hops"] == len(path) - 1, "hnsw hops == len(path)-1")
    need(g["nodesVisited"] == len(path), "hnsw nodesVisited == len(path)")
    need(H["bruteForce"]["nnIdx"] == bf, "hnsw bruteForce NN == argmin dist")
    checks.append(("hnsw.bruteForce.dist", H["bruteForce"]["dist"], round(dist(nodes[bf], q), 4), 1e-4))
    need(g["recall"] == (1.0 if path[-1] == bf else 0.0), "hnsw recall == (greedyNN==bruteNN) (BAM)")
    for h in H["hopTable"]:
        checks.append((f"hnsw.atDist[{h['at']}]", h["atDist"], round(dist(nodes[h["atIdx"]], q), 4), 1e-4))
        for nb in h["neighbors"]:
            checks.append((f"hnsw.dist[{h['at']}->{nb['id']}]", nb["dist"], round(dist(nodes[nb["idx"]], q), 4), 1e-4))

    # ── IVF: recompute assignment, recall, AND the committed-geometry lesson conditions ──
    pts, cents, qi, K = IV["points"], IV["centroids"], IV["query"], IV["k"]
    assign = [min(range(len(cents)), key=lambda c: dist(p, cents[c])) for p in pts]
    need(assign == IV["assign"], "ivf assign == nearest centroid")
    need(min(range(len(cents)), key=lambda c: dist(qi, cents[c])) == IV["queryCell"], "ivf queryCell == nearest centroid to q")
    true_nn = sorted(range(len(pts)), key=lambda i: dist(pts[i], qi))[:K]
    need(true_nn == IV["trueNN"], "ivf trueNN == K nearest points")
    cell_rank = sorted(range(len(cents)), key=lambda c: dist(qi, cents[c]))
    need(cell_rank == IV["cellRankByDist"], "ivf cellRankByDist == cells by dist to q")
    in_c0 = [i for i in true_nn if assign[i] == 0]
    in_c1 = [i for i in true_nn if assign[i] == 1]
    need(len(in_c0) == 2, "ivf committed-geometry: exactly 2 of 3 trueNN in c0")
    need(len(in_c1) == 1, "ivf committed-geometry: the 3rd trueNN in c1")
    need(cell_rank[1] == 1, "ivf committed-geometry: c1 is the 2nd-nearest cell to q")
    for npb in ("1", "2"):
        cells = cell_rank[:int(npb)]
        probed = [i for i in range(len(pts)) if assign[i] in cells]
        found = [i for i in true_nn if i in probed]
        checks.append((f"ivf.recall@nprobe={npb}", IV["probe"][npb]["recall"], round(len(found) / K, 4), 1e-4))
    need(IV["probe"]["1"]["recall"] < IV["probe"]["2"]["recall"], "ivf recall climbs nprobe 1→2 (BAM)")

    # ── PQ: bytesPQ == m (1 byte/subvector, k=256), bytesFloat32 == dim·4, compression == F32/PQ ──
    t = PQ["toy"]
    need(t["bytesPQ"] == t["m"], "pq toy bytesPQ == m")
    need(t["bytesFloat32"] == t["D"] * 4, "pq toy bytesFloat32 == D·4")
    need(t["compression"] == t["bytesFloat32"] // t["bytesPQ"], "pq toy compression == F32/PQ")
    for s in PQ["scale"]:
        need(s["bytesPQ"] == s["m"], f"pq scale d{s['dim']} bytesPQ == m")
        need(s["bytesFloat32"] == s["dim"] * 4, f"pq scale d{s['dim']} bytesFloat32 == dim·4")
        need(s["compression"] == s["bytesFloat32"] // s["bytesPQ"], f"pq scale d{s['dim']} compression == F32/PQ")

    # ── Latency: total == Σ lat AND total < SLA; warm cache-hit path total == cacheHitMs; tail p50<p99<sla ──
    checks.append(("latency.total == Σ lat", LT["total"], sum(h["lat"] for h in LT["budget"]), 0))
    need(LT["total"] < LT["sla"], "latency total < SLA (BAM)")
    checks.append(("latency.cacheHit == Σ warm lat", LT["cacheHitMs"], sum(h["lat"] for h in LT["cacheHitBudget"]["budget"]), 0))
    need(LT["cacheHitMs"] < LT["total"], "latency cache-hit < cold path")
    need(LT["exactScanMs"] > LT["budget"][2]["lat"], "latency exact scan ≫ ANN search hop (the point of ANN)")
    need(LT["tailNote"]["p50"] < LT["tailNote"]["p99"] < LT["sla"], "latency p50 < p99 < SLA (tail)")

    # ── Metrics: cosine == dot/(‖a‖·‖b‖); the by-hand norms; the ranking-disagreement (3 metrics, 3 winners) ──
    mp = METRICS9["pair"]
    aN, bN = math.hypot(*mp["a"]), math.hypot(*mp["b"])
    checks.append(("metrics.l2 == ‖a−b‖", mp["l2"], round(math.dist(mp["a"], mp["b"]), 4), 1e-4))
    checks.append(("metrics.dot == a·b", mp["dot"], sum(x * y for x, y in zip(mp["a"], mp["b"])), 0))
    checks.append(("metrics.aNorm == ‖a‖", mp["aNorm"], round(aN, 4), 1e-4))
    checks.append(("metrics.bNorm == ‖b‖", mp["bNorm"], round(bN, 4), 1e-4))
    checks.append(("metrics.cosine == dot/(‖a‖‖b‖)", mp["cosine"], round(mp["dot"] / (aN * bN), 4), 1e-4))
    checks.append(("metrics.normalizedDot == cosine", mp["normalizedDot"], mp["cosine"], 1e-9))
    rk = METRICS9["ranking"]
    rq, cand = rk["query"], rk["candidates"]
    for cid, c in cand.items():
        checks.append((f"metrics.{cid}.l2",  c["l2"],  round(math.dist(rq, c["vector"]), 4), 1e-4))
        checks.append((f"metrics.{cid}.dot", c["dot"], sum(x * y for x, y in zip(rq, c["vector"])), 0))
        dotc = sum(x * y for x, y in zip(rq, c["vector"]))
        checks.append((f"metrics.{cid}.cos", c["cosine"], round(dotc / (math.hypot(*rq) * math.hypot(*c["vector"])), 4), 1e-4))
    # the BAM: the three metrics pick three DIFFERENT top-1 candidates (metric choice changes the answer)
    by_l2  = min(cand, key=lambda i: cand[i]["l2"])
    by_cos = max(cand, key=lambda i: cand[i]["cosine"])
    by_ip  = max(cand, key=lambda i: cand[i]["dot"])
    need(by_l2 == rk["top1"]["l2"], "metrics top1 L2 == argmin L2")
    need(by_cos == rk["top1"]["cosine"], "metrics top1 cosine == argmax cosine")
    need(by_ip == rk["top1"]["innerProduct"], "metrics top1 IP == argmax dot")
    need(len({by_l2, by_cos, by_ip}) == 3, "metrics: L2/cosine/IP pick 3 DIFFERENT top-1 (BAM)")

    # ── HNSW toy2 (two-layer): recompute the greedy hub→base descent path & recall, and the base-only trap ──
    t2 = HNSW9["toy2"]
    n2, q2, lab2 = t2["coords"]["nodes"], t2["query"], t2["labels"]
    lidx = {l: i for i, l in enumerate(lab2)}
    adj2 = {lay["layer"]: {i: set() for i in lay["members"]} for lay in t2["layers"]}
    for lay in t2["layers"]:
        for i, j in lay["edges"]:
            adj2[lay["layer"]][i].add(j); adj2[lay["layer"]][j].add(i)
    def greedy_layer(start, layer):
        cur, path = start, [start]
        while True:
            best, best_d = None, math.dist(n2[cur], q2)
            for nb in sorted(adj2[layer][cur]):
                if math.dist(n2[nb], q2) < best_d:
                    best_d, best = math.dist(n2[nb], q2), nb
            if best is None:
                break
            cur = best; path.append(cur)
        return path
    pL1 = greedy_layer(lidx[t2["entryHub"]], 1)
    pL0 = greedy_layer(pL1[-1], 0)
    bf2 = min(range(len(n2)), key=lambda i: math.dist(n2[i], q2))
    need([lab2[i] for i in pL1] == t2["greedy"]["pathL1"], "hnsw2 layer-1 hub path == recomputed")
    need([lab2[i] for i in pL0] == t2["greedy"]["pathL0"], "hnsw2 layer-0 descent path == recomputed")
    need(lab2[bf2] == t2["bruteForce"]["nn"], "hnsw2 bruteForce NN == argmin dist")
    checks.append(("hnsw2.bruteForce.dist", t2["bruteForce"]["dist"], round(math.dist(n2[bf2], q2), 4), 1e-4))
    need(t2["greedy"]["recall"] == (1.0 if pL0[-1] == bf2 else 0.0), "hnsw2 layered recall == (greedyNN==bruteNN) (BAM)")
    pBase = greedy_layer(lidx[t2["baseEntry"]], 0)
    need(lab2[pBase[-1]] == t2["baseOnly"]["trappedAt"], "hnsw2 base-only greedy traps at local min")
    need(t2["baseOnly"]["recall"] == 0.0 and pBase[-1] != bf2, "hnsw2 base-only recall 0.0 (no upper layer ⇒ trap; BAM)")
    for row in t2["hopTable"]["baseOnly"]:
        checks.append((f"hnsw2.baseOnly.atDist[{row['at']}]", row["atDist"], round(math.dist(n2[lidx[row["at"]]], q2), 4), 1e-4))

    # ── efSweep (30-node worst-case start): recall climbs 0.0→1.0 as ef grows, candidates non-decreasing ──
    ev = HNSW9["efSweep"]
    ec, eq = ev["coords"], ev["query"]
    bfe = min(range(len(ec)), key=lambda i: math.dist(ec[i], eq))
    need(bfe == ev["bruteForce"]["nn"], "efSweep bruteForce NN == argmin dist")
    checks.append(("efSweep.bruteForce.dist", ev["bruteForce"]["dist"], round(math.dist(ec[bfe], eq), 4), 1e-4))
    recs = [s["recallAt1"] for s in ev["sweep"]]
    cand_ev = [s["candidatesEvaluated"] for s in ev["sweep"]]
    need(recs[0] == 0.0 and recs[-1] == 1.0, "efSweep recall ef=1 traps (0.0) → large ef escapes (1.0) (BAM)")
    need(all(recs[i] <= recs[i + 1] for i in range(len(recs) - 1)), "efSweep recall non-decreasing in ef")
    need(all(cand_ev[i] <= cand_ev[i + 1] for i in range(len(cand_ev) - 1)), "efSweep candidatesEvaluated non-decreasing in ef")

    # ── IVF toy2 (20 pts / 5 cells): recompute assignment, the per-nprobe recall & pointsScanned sweep ──
    iv2 = IVF9["toy2"]
    p2, c2, q2i, K2 = iv2["points"], iv2["centroids"], iv2["query"], iv2["k"]
    asg2 = [min(range(len(c2)), key=lambda c: math.dist(p, c2[c])) for p in p2]
    need(asg2 == iv2["assign"], "ivf2 assign == nearest centroid")
    rank2 = sorted(range(len(c2)), key=lambda c: math.dist(q2i, c2[c]))
    need(rank2 == iv2["cellRankByDist"], "ivf2 cellRankByDist == cells by dist to q")
    tnn2 = sorted(range(len(p2)), key=lambda i: math.dist(p2[i], q2i))[:K2]
    need(tnn2 == iv2["trueNN"], "ivf2 trueNN == K nearest points")
    for s in iv2["sweep"]:
        cells = rank2[:s["nprobe"]]
        probed = [i for i in range(len(p2)) if asg2[i] in cells]
        found = [i for i in tnn2 if i in probed]
        checks.append((f"ivf2.recall@nprobe={s['nprobe']}", s["recall"], round(len(found) / K2, 4), 1e-4))
        checks.append((f"ivf2.pointsScanned@nprobe={s['nprobe']}", s["pointsScanned"], len(probed), 0))
    sweep_recs = [s["recall"] for s in iv2["sweep"]]
    need(sweep_recs[0] == 0.6 and max(sweep_recs) == 1.0, "ivf2 recall climbs 0.6 → 1.0 with nprobe (BAM)")
    need(all(sweep_recs[i] <= sweep_recs[i + 1] for i in range(len(sweep_recs) - 1)), "ivf2 recall non-decreasing in nprobe")

    # ── PQ ADC: adcDistance == Σ_j adcTable[j][codes[j]]; codes are the per-subspace nearest centroids;
    #    exactDistance == ‖query − dbVector‖²; the ADC approximates exact (gap = quantization error) ──
    aw = PQ["adcWorked"]
    adc_sum = sum(aw["adcTable"][j][aw["codes"][j]] for j in range(aw["m"]))
    checks.append(("pq.adcDistance == Σ adcTable[j][codes[j]]", aw["adcDistance"], adc_sum, 0))
    exact_sq = sum((a - b) ** 2 for a, b in zip(aw["query"], aw["dbVector"]))
    checks.append(("pq.exactDistance == ‖q−db‖²", aw["exactDistance"], exact_sq, 0))
    for j in range(aw["m"]):
        nearest = min(range(aw["k"]), key=lambda c: sum((a - b) ** 2 for a, b in zip(aw["dbSubvectors"][j], aw["codebooks"][j][c])))
        need(aw["codes"][j] == nearest, f"pq.codes[{j}] == nearest codebook centroid")
    need(aw["adcDistance"] != aw["exactDistance"], "pq ADC ≠ exact (lossy: the quantization gap)")

    # ── PQ memoryConfigs: bytesPQ == m·bitsPerCode/8; bytesFloat32 == dim·4; compression == F32/PQ ──
    for cfg in PQ["memoryConfigs"]["configs"]:
        checks.append((f"pq.mem.bytesPQ d{cfg['dim']} m{cfg['m']} k{cfg['k']}", cfg["bytesPQ"], cfg["m"] * cfg["bitsPerCode"] // 8, 0))
        checks.append((f"pq.mem.bytesFloat32 d{cfg['dim']}", cfg["bytesFloat32"], cfg["dim"] * 4, 0))
        checks.append((f"pq.mem.compression d{cfg['dim']} k{cfg['k']}", cfg["compression"], cfg["bytesFloat32"] // cfg["bytesPQ"], 0))
        need(cfg["bitsPerCode"] == round(math.log2(cfg["k"])), f"pq.mem bitsPerCode == log2(k) d{cfg['dim']} k{cfg['k']}")

    # ── PQ codebook training (Lloyd's k-means, by hand): each iter's inertia == Σ‖x−assignedCentroid‖²;
    #    the centroids are the means of their assignment; the inertia sequence is monotone non-increasing ──
    ck = PQ["codebookTrain"]
    sv = ck["subvectors"]
    def inertia(cents, assign):
        return sum(sum((a - b) ** 2 for a, b in zip(sv[i], cents[assign[i]])) for i in range(len(sv)))
    for it in ck["iterations"]:
        checks.append((f"pq.codebook.inertia[iter{it['iter']}]", it["inertia"], round(inertia(it["centroids"], it["assign"]), 4), 1e-3))
    checks.append(("pq.codebook.inertia[final]", ck["final"]["inertia"], round(inertia(ck["final"]["centroids"], ck["final"]["assign"]), 4), 1e-3))
    # final centroids are the means of their assignment (the Lloyd recompute step)
    for c in range(ck["k"]):
        members = [sv[i] for i in range(len(sv)) if ck["final"]["assign"][i] == c]
        mean = [round(sum(col) / len(members), 4) for col in zip(*members)]
        need(all(abs(mean[d] - ck["final"]["centroids"][c][d]) < 1e-3 for d in range(len(mean))), f"pq.codebook final centroid {c} == mean of its members")
    seq = ck["inertiaSequence"]
    need(seq == [ck["iterations"][0]["inertia"], ck["iterations"][1]["inertia"], ck["final"]["inertia"]], "pq.codebook inertiaSequence == per-step inertias")
    need(all(seq[i] >= seq[i + 1] for i in range(len(seq) - 1)), "pq.codebook inertia monotone non-increasing (BAM)")

    # ── Curse of dimensionality (l2-highd, displayed on L9 exact-dies): cv == std/mean, and cv collapses
    #    monotonically as d grows (near ≈ far) — the WHY exact search dies and ANN is needed ──
    cvs = []
    for dd in HIGHD["dims"]:
        checks.append((f"highd.cv[d={dd['d']}] == std/mean", dd["cv"], round(dd["std"] / dd["mean"], 4), 1e-4))
        cvs.append(dd["cv"])
    need(all(cvs[i] > cvs[i + 1] for i in range(len(cvs) - 1)), "highd cv collapses monotonically as d grows (BAM)")

    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L9({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad and not flags:
        report.append(("OK", f"provenance-L9: {len(checks)} recompute + structural invariants consistent ✓"))


# ── [P] PROVENANCE (L10 "The Oracle"): gen_l10 emits data/ directly (stdlib, no RAW twin) — recompute the
#    three climbs (RAG token budget, chunking binary answer-containment, query-rewrite RR/recall) and pin
#    the cross-pillar invariants. The two recall SENSES (single-true-doc binary vs multi-query 5-relevant)
#    are checked against their OWN committed gold-sets, never blended (L10.md E2). ──
def provenance_l10(report):
    R, C, W = RAG10, CHUNK10, REWRITE10
    checks, flags = [], []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L10({name}): structural invariant broken"))

    # ── RAG token budget ──
    kmax = (R["contextWindow"] - R["systemTokens"] - R["queryTokens"] - R["answerReserve"]) // R["chunkTokens"]
    checks.append(("rag.kMax == floor((ctx-sys-q-reserve)/chunk)", R["kMax"], kmax, 0))
    wk = R["worked"]
    checks.append(("rag.stuffed == k·chunk", wk["stuffed"], wk["k"] * R["chunkTokens"], 0))
    checks.append(("rag.promptTotal == sys+q+stuffed", wk["promptTotal"], R["systemTokens"] + R["queryTokens"] + wk["stuffed"], 0))
    checks.append(("rag.headroom == ctx-promptTotal", wk["headroom"], R["contextWindow"] - wk["promptTotal"], 0))
    need(wk["k"] <= R["kMax"], "rag worked k <= kMax")

    # ── Chunking: nChunks == ceil((L-o)/(size-o)); binary answer-containment recomputed from windows+span ──
    L, span = C["docLen"], C["answerSpan"]
    for sc in C["scenarios"]:
        n = math.ceil((L - sc["overlap"]) / (sc["size"] - sc["overlap"]))
        checks.append((f"chunk.nChunks(size{sc['size']},ov{sc['overlap']})", sc["nChunks"], n, 0))
        idx = next((i for i, w in enumerate(sc["windows"]) if w[0] <= span[0] and span[1] <= w[1]), None)
        need(sc["answerChunk"] == idx, f"chunk answerChunk idx(size{sc['size']},ov{sc['overlap']})")
        need((sc["recallAt3"] == 1.0) == (idx is not None), f"chunk recall == binary containment(size{sc['size']},ov{sc['overlap']})")
    need(C["scenarios"][0]["recallAt3"] == 0 and C["scenarios"][1]["recallAt3"] == 1.0, "chunk recall 0→1.0 as overlap rescues the straddle (BAM)")

    # ── Query rewrite: RR == 1/rank; single-doc binary recall; multi-query recall over its OWN gold-set ──
    for key in ("original", "hyde"):
        b = W[key]
        checks.append((f"rewrite.{key}.rr == 1/rank", b["rr"], round(1.0 / b["trueRank"], 4), 1e-4))
        need(b["recallAt5"] == (1 if b["trueRank"] <= 5 else 0), f"rewrite {key} recall@5 == (trueRank<=5)")
        need(b["rankedList"][b["trueRank"] - 1] == W["trueDocId"], f"rewrite {key} trueDoc sits at trueRank")
    mq = W["multiQuery"]; g = len(mq["goldRelevant"])
    checks.append(("rewrite.mq.single == |found|/|gold|", mq["recallAt5Single"], round(len(mq["foundSingle"]) / g, 4), 1e-4))
    checks.append(("rewrite.mq.union  == |found|/|gold|", mq["recallAt5Union"], round(len(mq["foundUnion"]) / g, 4), 1e-4))
    need(set(mq["foundSingle"]) <= set(mq["goldRelevant"]) and set(mq["foundUnion"]) <= set(mq["goldRelevant"]), "rewrite multi-query found ⊆ gold")
    need(mq["recallAt5Union"] > mq["recallAt5Single"], "rewrite multi-query union > single (BAM)")
    need(W["hyde"]["trueRank"] < W["original"]["trueRank"], "rewrite HyDE lifts the true doc's rank (BAM)")

    # ── Budget sweep: kMax == (ctx − sys − q − reserve) // chunk across real context windows; grows in ctx ──
    B = BUDGET10
    kmaxs = []
    for w in B["windows"]:
        km = (w["ctx"] - B["systemTokens"] - B["queryTokens"] - B["answerReserve"]) // B["chunkTokens"]
        checks.append((f"budget.kMax(ctx={w['ctx']})", w["kMax"], km, 0))
        kmaxs.append(w["kMax"])
    need(all(kmaxs[i] < kmaxs[i + 1] for i in range(len(kmaxs) - 1)), "budget kMax grows with context window (BAM)")
    need(B["windows"][0]["kMax"] == R["kMax"], "budget 4096 window == the anchor-trace kMax (13)")

    # ── Retrieval-math: cos4 == dot/(‖q‖·‖d‖); 2-dp cos reproduces the trace.retrieved scores ──
    rmath = R["retrievalMath"]
    rq = rmath["query"]
    nq = math.hypot(*rq)
    checks.append(("retrievalMath.normQuery == ‖q‖", rmath["normQuery"], round(nq, 4), 1e-4))
    trace = {t["id"]: t["score"] for t in R["trace"]["retrieved"]}
    for dd in rmath["docs"]:
        dot = sum(x * y for x, y in zip(rq, dd["vec"]))
        nd = math.hypot(*dd["vec"])
        checks.append((f"retrievalMath.{dd['id']}.dot", dd["dot"], dot, 0))
        checks.append((f"retrievalMath.{dd['id']}.normDoc", dd["normDoc"], round(nd, 4), 1e-4))
        checks.append((f"retrievalMath.{dd['id']}.cos4 == dot/(‖q‖‖d‖)", dd["cos4"], round(dot / (nq * nd), 4), 1e-4))
        checks.append((f"retrievalMath.{dd['id']}.cos == round(cos4,2)", dd["cos"], round(dd["cos4"], 2), 1e-9))
        need(abs(dd["cos"] - trace[dd["id"]]) < 1e-9, f"retrievalMath {dd['id']} 2-dp cos reproduces the trace score")

    # ── RRF fusion: rrf(d) == Σ_lists 1/(k + rank_d); the consensus doc wins despite topping neither list ──
    F = FUSION10
    k = F["k"]
    sc = {s["id"]: s for s in F["scores"]}
    for s in F["scores"]:
        recomputed = round(sum(1.0 / (k + ap["rank"]) for ap in s["appearsIn"]), 4)
        checks.append((f"fusion.rrf({s['id']})", s["rrf"], recomputed, 1e-4))
    order = sorted(F["scores"], key=lambda s: s["rrf"], reverse=True)
    need([s["id"] for s in order] == F["fusedOrder"], "fusion fusedOrder == sort by rrf desc")
    need(F["winner"] == F["fusedOrder"][0], "fusion winner == top of fused order")
    cons = sc[F["winner"]]
    need(all(ap["rank"] != 1 for ap in cons["appearsIn"]) or len(cons["appearsIn"]) > 1, "fusion consensus appears in multiple lists")
    need(sc["doc_cardiac_cycle"]["rrf"] > sc["doc_circulatory"]["rrf"], "fusion consensus 0.0325 > sparse-#1 0.0323 (BAM)")
    # the consensus doc tops NEITHER... it is rank 2 in A but wins on agreement across both paraphrase lists
    need(sc["doc_circulatory"]["appearsIn"][0]["rank"] == 1, "fusion sparse-#1 doc_circulatory tops list A (yet loses)")

    # ── Re-ranking: nDCG == DCG/IDCG and MRR == 1/rank, recomputed from graded gains + the two orders ──
    RR = RERANK10
    gains = RR["gains"]
    def dcg(order):
        return sum(gains[d] / math.log2(r + 2) for r, d in enumerate(order))
    def ndcg(order):
        ideal = sorted(gains.values(), reverse=True)
        idcg = sum(g / math.log2(r + 2) for r, g in enumerate(ideal))
        return round(dcg(order) / idcg, 4)
    def mrr(order):
        for r, d in enumerate(order):
            if gains[d] > 0:
                return round(1.0 / (r + 1), 4)
        return 0.0
    checks.append(("rerank.ndcgBefore == nDCG(biEncoder)", RR["ndcgBefore"], ndcg(RR["biEncoderOrder"]), 1e-4))
    checks.append(("rerank.ndcgAfter == nDCG(crossEncoder)", RR["ndcgAfter"], ndcg(RR["crossEncoderOrder"]), 1e-4))
    checks.append(("rerank.mrrBefore == MRR(biEncoder)", RR["mrrBefore"], mrr(RR["biEncoderOrder"]), 1e-4))
    checks.append(("rerank.mrrAfter == MRR(crossEncoder)", RR["mrrAfter"], mrr(RR["crossEncoderOrder"]), 1e-4))
    checks.append(("rerank.rankBefore == biEncoder rank of trueDoc", RR["rankBefore"], RR["biEncoderOrder"].index(RR["trueDocId"]) + 1, 0))
    checks.append(("rerank.rankAfter == crossEncoder rank of trueDoc", RR["rankAfter"], RR["crossEncoderOrder"].index(RR["trueDocId"]) + 1, 0))
    need(RR["ndcgAfter"] > RR["ndcgBefore"] and RR["mrrAfter"] > RR["mrrBefore"], "rerank lifts nDCG & MRR (cross-encoder reorders the shortlist; BAM)")
    need(RR["rankAfter"] < RR["rankBefore"], "rerank lifts the true doc's rank (4 → 1)")

    # ── Routing: route == argmax_t cos(query, centroid_t); the sims are the recomputed cosines ──
    RT = ROUTING10
    rqv = RT["query"]
    nq2 = math.hypot(*rqv)
    sims = []
    for c in RT["centroids"]:
        cv = c["centroid"]
        cos = round(sum(x * y for x, y in zip(rqv, cv)) / (nq2 * math.hypot(*cv)), 4)
        checks.append((f"routing.cos({c['template']})", c["cos"], cos, 1e-4))
        sims.append((c["template"], c["cos"]))
    need(RT["sims"] == [c["cos"] for c in RT["centroids"]], "routing sims == centroid cosines")
    need(RT["route"] == max(sims, key=lambda x: x[1])[0], "routing route == argmax cosine (BAM)")

    # ── Decomposition: each sub-question is individually answerable (recallSub==1) yet the JOINT fails (0) ──
    D = DECOMP10
    need(all(r == 1 for r in D["recallSub"]), "decomp each sub-answer found (recallSub all 1)")
    need(D["recallJoint"] == 0, "decomp joint retrieval fails (recallJoint 0) ⇒ decomposition recovers both (BAM)")
    need(len(D["subQuestions"]) == len(D["recallSub"]), "decomp one recall per sub-question")

    # ── RAPTOR tree: level sizes fan in 8 → 3 → 1; depth == number of levels; monotone decreasing ──
    levels = [lv["n"] for lv in RAPTOR10["tree"]["levels"]]
    checks.append(("raptor.depth == #levels", RAPTOR10["tree"]["depth"], len(levels), 0))
    need(levels == [8, 3, 1], "raptor levels 8 → 3 → 1 (leaf → mid → root)")
    need(all(levels[i] > levels[i + 1] for i in range(len(levels) - 1)), "raptor level sizes monotone decreasing (fan-in; BAM)")
    need(levels[-1] == 1, "raptor recurses to a single root")

    # ── Chunking sweep: nChunks == ceil((L-o)/(size-o)); recall climbs 0→1 monotone as overlap rises ──
    sw = C["sweep"]
    sw_recs = []
    for s in sw:
        n = math.ceil((L - s["overlap"]) / (s["size"] - s["overlap"]))
        checks.append((f"chunk.sweep.nChunks(ov{s['overlap']})", s["nChunks"], n, 0))
        idx = next((i for i, w in enumerate(s["windows"]) if w[0] <= span[0] and span[1] <= w[1]), None)
        need(s["answerChunk"] == idx, f"chunk.sweep answerChunk idx(ov{s['overlap']})")
        need((s["recallAt3"] == 1) == (idx is not None), f"chunk.sweep recall == containment(ov{s['overlap']})")
        sw_recs.append(s["recallAt3"])
    nchunks_sweep = [s["nChunks"] for s in sw]
    need(sw_recs[0] == 0 and all(r == 1 for r in sw_recs[1:]), "chunk sweep recall 0 → 1 as overlap rescues the straddle (BAM)")
    need(all(sw_recs[i] <= sw_recs[i + 1] for i in range(len(sw_recs) - 1)), "chunk sweep recall non-decreasing in overlap")
    need(all(nchunks_sweep[i] < nchunks_sweep[i + 1] for i in range(len(nchunks_sweep) - 1)), "chunk sweep nChunks grows with overlap (storage cost)")

    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L10({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad and not flags:
        report.append(("OK", f"provenance-L10: {len(checks)} recompute + structural invariants consistent ✓"))


def provenance_l11(report):
    """[P] L11 toy-recompute: RAGAS four metrics (fraction/mean), LLM-judge rubric means + the Goodhart
    flip, agentic recall; plus the REAL llama3.1:8b judge rates recomputed from the frozen artifact."""
    RG, J, AG = RAGAS11, JUDGE11, AGENTIC11
    checks, flags = [], []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L11({name}): structural invariant broken"))

    # ── RAGAS four metrics, recomputed from the toy q/contexts/answer/ground-truth ──
    sup = sum(1 for c in RG["answerClaims"] if c["supported"])
    checks.append(("ragas.faithfulness == supported/claims", RG["faithfulness"], round(sup / len(RG["answerClaims"]), 4), 1e-4))
    rqc = RG["reverseQuestionCos"]
    checks.append(("ragas.answerRelevance == mean(reverseQ cos)", RG["answerRelevance"], round(sum(rqc) / len(rqc), 4), 1e-4))
    rel = [c["relevant"] for c in RG["contexts"]]
    totrel = sum(rel)
    csum = sum((sum(rel[:k]) / k) for k in range(1, len(rel) + 1) if rel[k - 1])
    checks.append(("ragas.contextPrecision == Σ prec@k·rel / #rel", RG["contextPrecision"], round(csum / totrel, 4), 1e-4))
    gin = sum(1 for c in RG["groundTruthClaims"] if c["inContext"])
    checks.append(("ragas.contextRecall == gtInContext/gt", RG["contextRecall"], round(gin / len(RG["groundTruthClaims"]), 4), 1e-4))
    need(0 <= RG["faithfulness"] < 1, "ragas faithfulness < 1 (one hallucinated claim drags it down; BAM)")
    need(not RG["answerClaims"][-1]["supported"], "ragas the last answer-claim is the unsupported (hallucinated) one")

    # ── LLM-judge rubric means + pairwise argmax + the Goodhart winner-flip ──
    for a in J["answers"]:
        checks.append((f"judge.{a['id']}.mean == sum/len", a["mean"], round(sum(a["scores"]) / len(a["scores"]), 4), 1e-4))
    need(J["pairwiseWinner"] == max(J["answers"], key=lambda a: a["mean"])["id"], "judge pairwise winner == argmax rubric mean")
    G = J["goodhart"]
    gs, cs2 = G["goodScores"], G["gamedScores"]
    checks.append(("goodhart.good.honest == mean", G["honest"]["good"], round(sum(gs) / 3, 4), 1e-4))
    checks.append(("goodhart.gamed.lengthBiased == (rel+grnd+2·comp)/4", G["lengthBiased"]["gamed"], round((cs2[0] + cs2[1] + 2 * cs2[2]) / 4, 4), 1e-4))
    need(G["honest"]["winner"] != G["lengthBiased"]["winner"], "goodhart: over-weighting completeness FLIPS the winner (BAM)")
    need(G["honest"]["winner"] == "A" and G["lengthBiased"]["winner"] == "C", "goodhart honest→A but length-biased→C")

    # ── REAL llama3.1:8b judge rates == recomputed from the frozen artifact trials ──
    real = J["real"]
    art = load_research("l11_ollama_judge.json")
    if art:
        pt, vb, pc = art["positionBiasTie"], art["verbosityBias"], art["positionBiasClear"]
        tie_anchor = sum(1 for t in pt["trials"] if t["positionAnchored"])
        checks.append(("judge.real.positionFollowRateTie == anchored/n", real["positionFollowRateTie"], round(tie_anchor / pt["n"], 4), 1e-4))
        vlong = sum(int(t["longerWonOrder1"]) + int(t["longerWonOrder2"]) for t in vb["trials"])
        checks.append(("judge.real.verbosityPreferenceRate == longerWins/2n", real["verbosityPreferenceRate"], round(vlong / (2 * vb["n"]), 4), 1e-4))
        checks.append(("judge.real.accuracyClear == correct/2n", real["accuracyClear"], round(pc["correctPicks"] / (2 * pc["n"]), 4), 1e-4))
        need(real["faithfulnessCaughtPlanted"] == bool(art["faithfulness"]["caughtPlanted"]), "judge.real faithfulness caught matches artifact")
    need(real["verbosityPreferenceRate"] >= 0.5, "judge.real verbosity bias ≥ 0.5 (the judge rewards length — Goodhart, measured)")

    # ── Agentic: toy ReAct recall climbs 0→1→1 (answer lands on hop 2 = step 1); the REAL trace solved the 2-hop ──
    need(AG["react"]["recallByStep"] == [0, 1, 1], "agentic toy ReAct recall climbs 0→1→1 across 2 hops (BAM)")
    need(AG["react"]["recallByStep"] == [s["recallAt1"] for s in AG["react"]["steps"]], "agentic recallByStep matches per-step recallAt1 (internal consistency)")
    art2 = load_research("l11_ollama_react.json")
    if art2:
        need(AG["real"]["solved"] == bool(art2.get("solved")), "agentic.real solved matches artifact")
        need(AG["real"]["steps"] == art2["steps"], "agentic.real steps matches artifact")

    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L11({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad and not flags:
        report.append(("OK", f"provenance-L11: {len(checks)} recompute + structural invariants consistent ✓"))


def provenance_l12(report):
    """[P] L12 toy-recompute: GraphRAG multi-hop containment, the CLIP shared-space cosine matrix
    (recomputed; diagonal must win), and the REAL hallucination/grounding demo from the frozen artifact."""
    GR, CL, ET = GRAPHRAG12, CLIP12, ETHICS12
    checks, flags = [], []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L12({name}): structural invariant broken"))

    # ── GraphRAG: single-hop misses, multi-hop reaches the answer across ≥2 docs ──
    need(GR["recallSingleHop"] == 0, "graphrag single-hop recall 0 (field lives in d2, not the top doc)")
    need(GR["recallMultiHop"] == 1, "graphrag multi-hop recall 1 (traversal reaches the answer node; BAM)")
    need(GR["hops"] == len(GR["path"]), "graphrag hops == path length")
    need(GR["path"][-1][2] == GR["answerNode"], "graphrag path ends at the answer node")
    need(len({e[3] for e in GR["path"]}) >= 2, "graphrag path crosses ≥2 docs (a true multi-hop chain)")
    # ── GraphRAG community summaries (GLOBAL search): partition covers every entity exactly once; the
    #    cross-community edge count is recomputed from the triples + the membership. ──
    comms = GR["communities"]
    need(GR["nCommunities"] == len(comms), "graphrag nCommunities == #communities")
    need(GR["communitySizes"] == [len(c["members"]) for c in comms], "graphrag communitySizes == member counts")
    need(sum(GR["communitySizes"]) == GR["nEntities"], "graphrag community partition covers every entity")
    mem = [m for c in comms for m in c["members"]]
    need(len(mem) == len(set(mem)), "graphrag communities are a partition (no entity in two communities)")
    def _comm(ent):
        return next((c["id"] for c in comms if ent in c["members"]), None)
    cross = sum(1 for t in GR["triples"] if _comm(t[0]) and _comm(t[2]) and _comm(t[0]) != _comm(t[2]))
    checks.append(("graphrag.crossCommunityEdges", GR["crossCommunityEdges"], cross, 0))
    need(GR["crossCommunityEdges"] >= 1, "graphrag ≥1 cross-community edge bridges the partition")

    # ── CLIP: recompute the shared-space cosine matrix; the diagonal (matching pair) must be row-argmax ──
    def cos(a, b):
        return sum(x * y for x, y in zip(a, b)) / (math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(x * x for x in b)))
    cs, img, txt, M = CL["concepts"], CL["imageVectors"], CL["textVectors"], CL["cosineMatrix"]
    for i, ci in enumerate(cs):
        for j, cj in enumerate(cs):
            checks.append((f"clip.cos({ci},{cj})", M[i][j], round(cos(img[ci], txt[cj]), 4), 1e-4))
    diag = sum(1 for i in range(len(cs)) if max(range(len(cs)), key=lambda j: M[i][j]) == i)
    need(CL["diagonalCorrect"] == diag, "clip diagonalCorrect == #rows whose matching caption is the argmax")
    need(diag == len(cs), "clip every image retrieves its OWN caption (diagonal wins; BAM)")
    matched = [M[i][i] for i in range(len(cs))]
    mismatched = [M[i][j] for i in range(len(cs)) for j in range(len(cs)) if i != j]
    checks.append(("clip.matchedMeanCos", CL["matchedMeanCos"], round(sum(matched) / len(matched), 4), 1e-4))
    checks.append(("clip.mismatchedMeanCos", CL["mismatchedMeanCos"], round(sum(mismatched) / len(mismatched), 4), 1e-4))
    need(CL["matchedMeanCos"] > CL["mismatchedMeanCos"], "clip matched-pair cosine > mismatched (contrastive separation; BAM)")
    # ── CLIP top-k retrieval (derived from the SAME matrix): rank-1 per image is the diagonal; recall@1 ──
    for i, ci in enumerate(cs):
        row = CL["topKByImage"][i]
        order = sorted(range(len(cs)), key=lambda j: M[i][j], reverse=True)
        need(row["top1"] == cs[order[0]] == ci, f"clip top-1 for image {ci} is its own caption (the diagonal)")
        need([x["caption"] for x in row["ranked"]] == [cs[j] for j in order], f"clip top-k({ci}) ranks captions by cosine desc")
    checks.append(("clip.recallAt1 == diagonalCorrect/n", CL["recallAt1"], round(diag / len(cs), 4), 1e-4))

    # ── Ethics: REAL hallucination demo — closed-book confabulates, grounding enables abstention ──
    real = ET["real"]
    art = load_research("l12_ollama_safety.json")
    if art:
        need(real["closedBookAbstained"] == bool(art["closedBookAbstained"]), "ethics.real closed-book abstention matches artifact")
        need(real["groundedAbstained"] == bool(art["groundedAbstained"]), "ethics.real grounded abstention matches artifact")
    need(real["closedBookAbstained"] is False and real["groundedAbstained"] is True,
         "ethics: closed-book confabulates, grounding enables abstention (the safety lesson; BAM)")

    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L12({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad and not flags:
        report.append(("OK", f"provenance-L12: {len(checks)} recompute + structural invariants consistent ✓"))


# ── [C] L9 BOOK CLAIMS: the built Book PROSE (worked :::calc + widget captions) must show the same
#    distances/recall as data/l9-*.json. One claim per DISTINCT displayed value covers all its occurrences
#    for the coverage-guard; each anchor also verifies a real display site. The deck claims (l9_deck_claims)
#    are added once the L9 deck exists. Values come straight from the data globals (never re-typed). ──
# ── [C] L9 DECK CLAIMS: the deck `formula` slides must show the same distances/recall as data/l9-*.json.
#    Anchored against the raw KaTeX in the by-hand slides (deck renders KaTeX client-side → LaTeX is in the
#    HTML). Mirrors l9_book_claims values (from the data globals); deck-side anchors. ──
def l9_deck_claims():
    H = HNSW9["toy"]
    nd = {}
    for h in H["hopTable"]:
        nd[h["at"]] = h["atDist"]
        for nb in h["neighbors"]:
            nd.setdefault(nb["id"], nb["dist"])
    d2 = lambda name: round(nd[name], 2)
    m, rk = METRICS9["pair"], METRICS9["ranking"]["candidates"]   # by-hand metric pair + ranking-disagreement
    t2, ev = HNSW9["toy2"], HNSW9["efSweep"]                       # two-layer climb + ef sweep
    iv2 = IVF9["toy2"]                                             # nprobe sweep (20 pts / 5 cells)
    pq, aw, mc, ck = PQ9["scale"], PQ9["adcWorked"], PQ9["memoryConfigs"]["configs"], PQ9["codebookTrain"]
    dim = {h["d"]: h for h in HIGHD["dims"]}                       # curse-of-dimensionality cv collapse
    C = lambda id, value, anchor, tol=1e-4: dict(id=id, deck="L9", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── exact-dies: curse of dimensionality cv = σ/μ collapse over d = 2 / 10 / 100 / 1000 ──
        C("L9 deck hd mu2",  dim[2]["mean"],  r"d=2:\\ \\mu=([\d.]+),"),
        C("L9 deck hd sd2",  dim[2]["std"],   r"\\sigma=([\d.]+) \\;\\Longrightarrow"),
        C("L9 deck hd cv2",  dim[2]["cv"],    r"\\tfrac\{0\.2474\}\{0\.5171\}=\\mathbf\{([\d.]+)\}"),
        C("L9 deck hd mu10", dim[10]["mean"], r"\\tfrac\{0\.2451\}\{([\d.]+)\}=\\mathbf\{0\.1932\}"),
        C("L9 deck hd sd10", dim[10]["std"],  r"d=10:\\ \\mathrm\{cv\}=\\tfrac\{([\d.]+)\}\{1\.2688\}"),
        C("L9 deck hd cv10", dim[10]["cv"],   r"\{1\.2688\}=\\mathbf\{([\d.]+)\}"),
        C("L9 deck hd mu100",dim[100]["mean"],r"\\tfrac\{0\.2445\}\{([\d.]+)\}=\\mathbf\{0\.0602\}"),
        C("L9 deck hd sd100",dim[100]["std"], r"d=100:\\ \\mathrm\{cv\}=\\tfrac\{([\d.]+)\}\{4\.0620\}"),
        C("L9 deck hd cv100",dim[100]["cv"],  r"\{4\.0620\}=\\mathbf\{([\d.]+)\}"),
        C("L9 deck hd mu1k", dim[1000]["mean"],r"\\tfrac\{0\.2410\}\{([\d.]+)\}=\\mathbf\{0\.0187\}"),
        C("L9 deck hd sd1k", dim[1000]["std"], r"d=1000:\\ \\mathrm\{cv\}=\\tfrac\{([\d.]+)\}\{12\.9023\}"),
        C("L9 deck hd cv1k", dim[1000]["cv"],  r"\{12\.9023\}=\\mathbf\{([\d.]+)\}"),
        # ── metrics: the by-hand L2/cosine pair + the ranking-disagreement candidate distances ──
        C("L9 deck m l2",      m["l2"],          r"L2 \\\(=([\d.]+)\\\) \(displacement\)"),
        C("L9 deck m cosine",  m["cosine"],      r"cosine \\\(=([\d.]+)\\\) — the unit-vector"),
        C("L9 deck m d1 cos",  rk["d1"]["cosine"], r"\\cos\(q,d_1\)=([\d.]+)\\\), \\\(\\cos\(q,d_2\)"),
        C("L9 deck m d3 cos",  rk["d3"]["cosine"], r"\\cos\(q,d_3\)=([\d.]+)\\\)\. \\\(d_2"),
        C("L9 deck m d2 l2",   rk["d2"]["l2"],     r"\\lVert q-d_2\\rVert=([\d.]+)\\\), \\\(\\lVert q-d_3"),
        C("L9 deck m d3 l2",   rk["d3"]["l2"],     r"\\lVert q-d_3\\rVert=([\d.]+)\\\)\. The smallest"),
        # ── HNSW toy: greedy n0→n2 (kept, still rendered) ──
        dict(id="L9 deck hnsw n0", deck="L9", value=d2("n0"), tol=0.006, anchor=r"d\(n_0,q\)=([\d.]+)", must=True),
        dict(id="L9 deck hnsw n1", deck="L9", value=d2("n1"), tol=0.006, anchor=r"d\(n_1,q\)=([\d.]+)", must=True),
        dict(id="L9 deck hnsw n3", deck="L9", value=d2("n3"), tol=0.006, anchor=r"d\(n_3,q\)=([\d.]+)", must=True),
        dict(id="L9 deck hnsw nn", deck="L9", value=H["bruteForce"]["dist"], tol=1e-4, anchor=r"d\(n_2,q\)=\\mathbf\{([\d.]+)\}", must=True),
        dict(id="L9 deck hnsw n4", deck="L9", value=d2("n4"), tol=0.006, anchor=r"d\(n_4,q\)=([\d.]+)", must=True),
        dict(id="L9 deck hnsw n5", deck="L9", value=d2("n5"), tol=0.006, anchor=r"d\(n_5,q\)=([\d.]+)", must=True),
        # ── HNSW toy2: the two-layer climb's descent lands on b9 = brute-force NN (1.4142) ──
        C("L9 deck hnsw2 b9", t2["bruteForce"]["dist"], r"d\(b_9,q\)=\\mathbf\{([\d.]+)\}=\\text\{brute-force NN\}"),
        # ── IVF toy: nprobe=1 finds 2/3 → recall 0.6667 (kept) ──
        dict(id="L9 deck ivf recall1", deck="L9", value=IVF9["toy"]["probe"]["1"]["recall"], tol=1e-4, anchor=r"2/3.{0,70}?\\mathbf\{([\d.]+)\}", must=True),
        # ── IVF toy2: nprobe sweep recall 0.6 → 0.8 → 1.0 across the 3 nearest cells ──
        C("L9 deck ivf2 r1", iv2["sweep"][0]["recall"], r"recall@5\}=\\mathbf\{([\d.]+)\} \$\$"),
        C("L9 deck ivf2 r2", iv2["sweep"][1]["recall"], r"4/5 \\;\\Longrightarrow\\; \\mathbf\{([\d.]+)\};"),
        # ── PQ: representative recall@1 (kept) + the ADC worked lookup (35 vs exact 37) ──
        dict(id="L9 deck pq recall", deck="L9", value=PQ9["recallRepresentative"]["m4"], tol=1e-4, anchor=r"PQ-m4\)\} \\approx \\mathbf\{([\d.]+)\}", must=True),
        C("L9 deck pq adc", aw["adcDistance"], r"\\textrm\{code\}_j\]=2\+0\+20\+13=\\mathbf\{(\d+)\}", tol=1e-9),
        C("L9 deck pq exact", aw["exactDistance"], r"The exact distance is \\\((\d+)\\\)", tol=1e-9),
        # ── PQ memory ledger: compression 32× / 16× / 64× (768-d) + 64× (128-d) ──
        C("L9 deck pq comp768", mc[0]["compression"], r"96 B/vec \(\\\(\\mathbf\{(\d+)\\times\}", tol=1e-9),
        C("L9 deck pq comp192", mc[1]["compression"], r"192 B \(\\\(\\mathbf\{(\d+)\\times\}", tol=1e-9),
        C("L9 deck pq compK16", mc[2]["compression"], r"48 B \(\\\(\\mathbf\{(\d+)\\times\}", tol=1e-9),
        # ── PQ codebook training: Lloyd inertia 284.0 → 20.6875 → 2.6667 + the moving centroids ──
        C("L9 deck pq inertia0", ck["iterations"][0]["inertia"], r"\\rVert\^2=\\mathbf\{([\d.]+)\} \$\$", tol=1e-2),
        C("L9 deck pq c1iter1",  ck["iterations"][1]["centroids"][1][0], r"c_1=\(([\d.]+),6\.5\)"),
        C("L9 deck pq inertia1", ck["iterations"][1]["inertia"], r"reassign \}\[0,0,0,1,1,1\],\\quad \\text\{inertia\}=\\mathbf\{([\d.]+)\}"),
        C("L9 deck pq c0final",  ck["final"]["centroids"][0][0], r"c_0=\(([\d.]+),1\.3333\)"),
        C("L9 deck pq c1final",  ck["final"]["centroids"][1][0], r"c_1=\(([\d.]+),8\.3333\)"),
        C("L9 deck pq inertia2", ck["final"]["inertia"], r"8\.3333\):\\quad \\text\{inertia\}=\\mathbf\{([\d.]+)\}"),
        # ── production latency: exact scan ~520 ms, tail p99 180 ms (representative serving figures) ──
        C("L9 deck lat exact", LAT9["exactScanMs"], r"search hop\} \\approx \\mathbf\{(\d+)\}\\text\{ ms\}", tol=1e-9),
        C("L9 deck lat p99",   LAT9["tailNote"]["p99"], r"p_\{99\}=(\d+)\\\)ms \(representative\)", tol=1e-9),
    ]


# ── [C] L10 DECK CLAIMS: the deck `formula` slides must show the same kMax / RR / recall as data/l10-*.json.
#    Anchored against the raw KaTeX in the by-hand slides. Mirrors l10_book_claims values (data globals). ──
def l10_deck_claims():
    R, W = RAG10, REWRITE10
    rm  = {d["id"]: d for d in R["retrievalMath"]["docs"]}        # cos4 = dot/(‖q‖·‖d‖)
    win = {w["ctx"]: w["kMax"] for w in BUDGET10["windows"]}       # token-budget sweep across context windows
    fz  = {s["id"]: s for s in FUSION10["scores"]}                 # RRF fused scores
    rr  = RERANK10                                                 # cross-encoder reorder nDCG/MRR
    rt  = ROUTING10                                                # query-routing cosines
    dc  = DECOMP10                                                 # query decomposition recalls
    lv  = RAPTOR10["tree"]["levels"]                               # RAPTOR tree level sizes
    C = lambda id, value, anchor, tol=1e-4: dict(id=id, deck="L10", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── RAG token budget: kMax = ⌊3354/256⌋ = 13 (the anchor trace) ──
        dict(id="L10 deck kMax", deck="L10", value=R["kMax"], tol=1e-9, anchor=r"3354.{0,40}?\\mathbf\{(\d+)\}", must=True),
        # ── budget sweep across real context windows: kMax 13 / 29 / 125 / 497 (windows table) ──
        C("L10 deck budget 8k",   win[8192],   r"<tr><td>8192</td><td>(\d+)</td>", tol=1e-9),
        C("L10 deck budget 32k",  win[32768],  r"<tr><td>32768</td><td>(\d+)</td>", tol=1e-9),
        C("L10 deck budget 128k", win[128000], r"<tr><td>128000</td><td class=\"cell-good\">(\d+)</td>", tol=1e-9),
        # ── retrieval-math: cos4 = dot/(‖q‖·‖d‖) reproduces the trace scores (numerators 10/11/15 pin each) ──
        C("L10 deck cos cardiac", rm["doc_cardiac_cycle"]["cos4"], r"\\frac\{10\}\{[^}]*\}[^=]*= \\mathbf\{([\d.]+)\}"),
        C("L10 deck cos circ",    rm["doc_circulatory"]["cos4"],   r"\\frac\{11\}\{[^}]*\}[^=]*= \\mathbf\{([\d.]+)\}"),
        C("L10 deck cos valves",  rm["doc_valves"]["cos4"],        r"\\frac\{15\}\{[^}]*\}[^=]*= \\mathbf\{([\d.]+)\}"),
        # ── RRF fusion: consensus doc 0.0325 > sparse-#1 doc 0.0323 (agreement across paraphrases wins) ──
        C("L10 deck rrf consensus", fz["doc_cardiac_cycle"]["rrf"], r"\\tfrac\{1\}\{60\+2\}\+\\tfrac\{1\}\{60\+1\} = \\mathbf\{([\d.]+)\}"),
        C("L10 deck rrf sparse1",   fz["doc_circulatory"]["rrf"],   r"\\tfrac\{1\}\{60\+1\}\+\\tfrac\{1\}\{60\+3\} = \\mathbf\{([\d.]+)\}"),
        # ── cross-encoder rerank: nDCG@5 0.4935 → 1.0, MRR 0.3333 → 1.0 (the before-values, in the notes) ──
        C("L10 deck rerank ndcg", rr["ndcgBefore"], r"nDCG@5 ([\d.]+) (?:&rarr;|→) 1\.0, MRR"),
        C("L10 deck rerank mrr",  rr["mrrBefore"],  r"MRR ([\d.]+) (?:&rarr;|→) 1\.0"),
        # ── query routing: cos(q, {factQA/howTo/compare}) = 0.8058 / 0.9670 / 0.6447 → route argmax ──
        C("L10 deck route factQA", rt["sims"][0], r"cos ([\d.]+) / 0\.9670 / 0\.6447"),
        C("L10 deck route howTo",  rt["sims"][1], r"cos 0\.8058 / ([\d.]+) / 0\.6447"),
        C("L10 deck route compare",rt["sims"][2], r"cos 0\.8058 / 0\.9670 / ([\d.]+) (?:&rarr;|→) route"),
        # ── query decomposition: each sub-answer found (recall per sub [1,1]) but joint retrieval recall 0 ──
        C("L10 deck decomp joint", dc["recallJoint"], r"recall on one joint retrieval = (\d+)", tol=1e-9),
        # ── RAPTOR tree: 8 leaf chunks → 3 cluster summaries → 1 root (viz-caption) ──
        C("L10 deck raptor leaf", lv[0]["n"], r"(\d+) leaf chunks (?:&rarr;|→) 3 cluster", tol=1e-9),  # unanchored: bilingual <span> wrap now sits between viz-caption"> and the digit
        C("L10 deck raptor mid",  lv[1]["n"], r"leaf chunks (?:&rarr;|→) (\d+) cluster summaries", tol=1e-9),
        C("L10 deck raptor root", lv[2]["n"], r"cluster summaries (?:&rarr;|→) (\d+) root", tol=1e-9),
        # ── query rewrite: RR 0.125 → 0.5, multi-query recall@5 0.4 → 0.8 (the by-hand slides, kept) ──
        dict(id="L10 deck rr orig", deck="L10", value=W["original"]["rr"], tol=1e-4, anchor=r"1/8 = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="L10 deck rr hyde", deck="L10", value=W["hyde"]["rr"], tol=1e-4, anchor=r"1/2 = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="L10 deck mq single", deck="L10", value=W["multiQuery"]["recallAt5Single"], tol=1e-4, anchor=r"2/5 \\Rightarrow \\mathbf\{([\d.]+)\}", must=True),
        dict(id="L10 deck mq union", deck="L10", value=W["multiQuery"]["recallAt5Union"], tol=1e-4, anchor=r"4/5 \\Rightarrow \\mathbf\{([\d.]+)\}", must=True),
    ]


# ── [C] L11 DECK CLAIMS: every visible ≥2-dp worked value the L11 deck DISPLAYS == data/l11-*.json.
#    Anchored against the raw KaTeX / prose on the RAGAS + LLM-judge slides. Values from data globals
#    (reverseQuestionCos / answerRelevance / contextPrecision and the Goodhart honest/length-biased means);
#    these also COVER the Book restatement (coverage-guard's gated set is claims()+book_claims()). ──
def l11_deck_claims():
    rqc = RAGAS11["reverseQuestionCos"]                            # [0.92, 0.88, 0.31] — paraphrase→original cosines
    gh  = JUDGE11["goodhart"]                                      # honest A 4.3333 vs length-biased gamed C 4.25
    C = lambda id, value, anchor, tol=1e-4: dict(id=id, deck="L11", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── RAGAS answer-relevance: mean[0.92, 0.88, 0.31] = 2.11/3 = 0.7033 (the reverse-question cosines) ──
        C("L11 deck rqc0",  rqc[0], r"\\operatorname\{mean\}\[([\d.]+), 0\.88, 0\.31\]"),
        C("L11 deck rqc1",  rqc[1], r"\\operatorname\{mean\}\[0\.92, ([\d.]+), 0\.31\]"),
        C("L11 deck rqc2",  rqc[2], r"\\operatorname\{mean\}\[0\.92, 0\.88, ([\d.]+)\]"),
        # numerator 2.11 = Σ reverseQuestionCos (the displayed \frac sum) — value derived from the data, not typed
        C("L11 deck rqc sum", round(sum(rqc), 2), r"= \\frac\{([\d.]+)\}\{3\} = \\mathbf\{0\.703"),
        C("L11 deck ans rel", RAGAS11["answerRelevance"], r"\\frac\{2\.11\}\{3\} = \\mathbf\{([\d.]+)\}"),
        # ── RAGAS context precision: (1 + 2/3)/2 = 0.8333 (ranking-aware precision) ──
        C("L11 deck ctx prec", RAGAS11["contextPrecision"], r"\(1 \+ 2/3\)/2 = ([\d.]+)"),
        # ── LLM-judge Goodhart flip: honest A = mean[5,5,3] = 4.3333; over-weight length and gamed C = 4.25 wins ──
        C("L11 deck honest A", gh["honest"]["good"],       r"A = \\operatorname\{mean\}\[5, 5, 3\] = \\mathbf\{([\d.]+)\}"),
        C("L11 deck gamed C",  gh["lengthBiased"]["gamed"], r"length-biased winner C ([\d.]+) (?:&gt;|>) A 4\.0"),
    ]


# ── [C] L12 DECK CLAIMS: every visible ≥2-dp worked value the L12 deck DISPLAYS == data/l12-*.json.
#    Anchored against the raw KaTeX CLIP cosine matrix (\begin{bmatrix}) + the matched-mean/gap prose.
#    Values from data globals (cosineMatrix cells, matchedMeanCos, contrastiveGap). ──
def l12_deck_claims():
    M = CLIP12["cosineMatrix"]                                     # 3×3 image×text cosines (diagonal = matched pairs)
    C = lambda id, value, anchor, tol=1e-4: dict(id=id, deck="L12", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── CLIP cosine matrix off-diagonals: pinned by each cell's row/column neighbours in the bmatrix ──
        C("L12 deck m01", M[0][1], r"\\mathbf\{0\.9974\} & ([\d.]+) & 0\.171"),
        C("L12 deck m02", M[0][2], r"& 0\.6547 & ([\d.]+) \\\\"),
        C("L12 deck m11", M[1][1], r"0\.6609 & \\mathbf\{([\d.]+)\}"),
        C("L12 deck m12", M[1][2], r"\\mathbf\{0\.991\} & ([\d.]+) \\\\"),
        C("L12 deck m20", M[2][0], r"\\\\ ([\d.]+) & 0\.329"),
        C("L12 deck m21", M[2][1], r"0\.1712 & ([\d.]+) & \\mathbf"),
        C("L12 deck m22", M[2][2], r"0\.329 & \\mathbf\{([\d.]+)\}"),
        # ── contrastive gap: matched mean 0.9944 vs mismatched 0.3791, gap 0.6153 (the punchline carved by the loss) ──
        C("L12 deck matched", CLIP12["matchedMeanCos"], r"matched <strong>([\d.]+)</strong> vs mi"),
        C("L12 deck gap",     CLIP12["contrastiveGap"], r"carved the <strong>([\d.]+)</strong> gap"),
    ]


# ── L13 "The Crucible of Negatives" deck claims: the killer-ablation slide shows DPR Table 3 (reported),
#    the RocketQA inversion (reported), and our toy recall@10 (measured, 20 seeds). Each number is pinned
#    by a UNIQUE preceding phrase + <strong> (generic ([\d.]+) capture → drift-robust). Values come from
#    data/l13-bench.json (cited rows) and data/l13-negatives.json (measured recall). The 2–3-fractional
#    decimals MUST be gated (the coverage-guard counts them on the NEW deck:L13 surface); DPR's 1-frac
#    69.1/78.0 are coverage-safe but gated here too for correctness. ──
def l13_deck_claims():
    DPR, RQ, RC = BENCH13["dprTable3"], BENCH13["rocketqaAblation"], NEG13["recallAt10"]
    C = lambda id, value, anchor, tol=0.005: dict(id=id, deck="L13", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # DPR Table 3 (NQ top-20, reported) — negative selection, not architecture, is decisive
        C("L13 deck dpr inbatch", DPR["goldInbatch"],    r"gold-7 in-batch <strong>([\d.]+)</strong>", 0.05),
        C("L13 deck dpr bm25",    DPR["goldPlusBM25Best"], r"one BM25 hard negative <strong>([\d.]+)</strong>", 0.05),
        # RocketQA ablation (MS MARCO MRR@10, reported) — the inversion + its cure
        C("L13 deck rq inbatch",    RQ["inbatch"],            r"baseline in-batch <strong>([\d.]+)</strong>"),
        C("L13 deck rq undenoised", RQ["plusUndenoisedHard"], r"undenoised hard negatives <strong>([\d.]+)</strong>"),
        C("L13 deck rq denoised",   RQ["plusDenoisedHard"],   r"cross-encoder denoising <strong>([\d.]+)</strong>"),
        C("L13 deck rq augment",    RQ["plusAugmentation"],   r"data augmentation <strong>([\d.]+)</strong>"),
        # our toy (recall@10, measured over 20 seeds) — the same shape, reproduced
        C("L13 deck toy inbatch",    RC["inbatch"]["mean"],    r"toy in-batch <strong>([\d.]+)</strong>"),
        C("L13 deck toy undenoised", RC["undenoised"]["mean"], r"toy \+undenoised <strong>([\d.]+)</strong>"),
        C("L13 deck toy denoised",   RC["denoised"]["mean"],   r"toy \+denoised <strong>([\d.]+)</strong>"),
        # slide-41 TAS-B achieved efficiency (MS MARCO MRR@10, reported) — the only NEW ≥2-dp number this
        # depth pass adds; gating it keeps deck:L13 coverage at 0 (ANCE's 0.33 is already gated == MS MARCO denseDPR).
        C("L13 deck tasb mrr", BENCH13["tasb"]["mrr"], r"MRR@10 &asymp; </span><strong>([\d.]+)</strong>"),
    ] + _l13_spine_coverage(C)

# ── the rebuilt deck (~52 slides) shows the spine cosines, the two-axis split, BM25 recall, and the
#    by-hand InfoNCE P+ and Boltzmann gradient weights as VISIBLE prose/math (the old deck hid them in
#    widget data-attributes). Each is gated to its data source so the coverage-guard stays at 0. ──
def _l13_spine_coverage(C):
    SP, TA = NEG13["spine"], NEG13["twoAxis"]
    LU, POS = SP["lineup"], SP["positive"]
    inf = next(r for r in SP["infonce"] if abs(r["tau"] - 0.1) < 1e-9)
    sm = inf["softmax"]; negsum = sum(sm[1:])           # softmax over [d+, n1..n5]; negatives = sm[1:]
    A = lambda v: r"(?<![\d.])(" + re.escape(f"{v:.2f}") + r")(?![\d])"
    A3 = lambda v: r"(?<![\d.])(" + re.escape(f"{v:.3f}") + r")(?![\d])"
    return [
        C("L13 cov dplus cosq", POS["cosQ"],                  A(0.82), 0.006),
        C("L13 cov n1 cosq",    LU[0]["cosQ"],                A(0.05), 0.006),
        C("L13 cov n5 cosq",    LU[4]["cosQ"],                A(0.79), 0.006),
        C("L13 cov 2axis sep",  TA["secondAxisSeparation"],   A(0.18), 0.006),
        C("L13 cov 2axis htn",  TA["hardTrueNeg"]["cosPositive"], A(0.62), 0.006),
        C("L13 cov bm25 recall", NEG13["recallAt10"]["bm25"]["mean"], A3(0.625), 0.006),
        C("L13 cov infonce ppos", inf["pPos"],                A(0.42), 0.012),
        C("L13 cov grad w4",    sm[4] / negsum,               A(0.35), 0.012),
        C("L13 cov grad w5",    sm[5] / negsum,               A(0.53), 0.012),
    ]


def l9_book_claims():
    H = HNSW9["toy"]
    nd = {}                                   # node label → distance-to-q (from the hop table)
    for h in H["hopTable"]:
        nd[h["at"]] = h["atDist"]
        for nb in h["neighbors"]:
            nd.setdefault(nb["id"], nb["dist"])
    d2 = lambda name: round(nd[name], 2)      # non-NN distances are displayed at 2 dp (the NN at 4 dp)
    nn = H["bruteForce"]["dist"]
    ivf1 = IVF9["toy"]["probe"]["1"]["recall"]
    pqr = PQ9["recallRepresentative"]["m4"]
    m, rk = METRICS9["pair"], METRICS9["ranking"]["candidates"]
    t2, ev = HNSW9["toy2"], HNSW9["efSweep"]
    bo = {h["at"]: h["atDist"] for h in t2["hopTable"]["baseOnly"]}   # base-only trap path distances
    ck = PQ9["codebookTrain"]
    C = lambda id, value, anchor, tol=1e-4: dict(id="book "+id, deck="L9", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── metrics beat: the by-hand √7 L2, √6 norm, and the ranking-disagreement candidate distances ──
        C("L9 m sqrt7",   m["l2"],          r"\\sqrt\{7\} = ([\d.]+)\\\)\. <strong>Cosine"),
        C("L9 m bNorm",   m["bNorm"],       r"\\sqrt\{6\} = ([\d.]+)\\\)\. <strong>L2 distance"),
        C("L9 m d1 cos",  rk["d1"]["cosine"], r"L2 \\\(= 1\.0\\\), dot \\\(= 6\\\), cosine \\\(= ([\d.]+)\\\)"),
        C("L9 m d2 l2",   rk["d2"]["l2"],     r"\(3,3,0,0\)\\\): L2 \\\(= ([\d.]+)\\\), dot \\\(= 12"),
        C("L9 m d3 l2",   rk["d3"]["l2"],     r"\(7,4,0,0\)\\\): L2 \\\(= ([\d.]+)\\\), dot \\\(= 22"),
        C("L9 m d3 cos",  rk["d3"]["cosine"], r"dot \\\(= 22\\\), cosine \\\(= ([\d.]+)\\\)"),
        # ── HNSW toy: greedy n0→n2 (n0 anchor TIGHTENED to the entry-node site, not the toy2 baseOnly b0) ──
        dict(id="book L9 hnsw n0", deck="L9", value=d2("n0"), tol=0.006, anchor=r"entry \\\(n_0\\\) \(distance \\\(([\d.]+)\\\) to", must=True),
        dict(id="book L9 hnsw n1", deck="L9", value=d2("n1"), tol=0.006, anchor=r"\\\(n_1\\\) at \\\(([\d.]+)\\\)", must=True),
        dict(id="book L9 hnsw n3", deck="L9", value=d2("n3"), tol=0.006, anchor=r"\\\(n_3\\\) at \\\(([\d.]+)\\\)", must=True),
        dict(id="book L9 hnsw nn", deck="L9", value=nn, tol=1e-4, anchor=r"neighbour \\\(n_2\\\) is at \\\(([\d.]+)\\\)", must=True),
        dict(id="book L9 hnsw n4", deck="L9", value=d2("n4"), tol=0.006, anchor=r"\\\(n_4\\\) at \\\(([\d.]+)\\\)", must=True),
        dict(id="book L9 hnsw n5", deck="L9", value=d2("n5"), tol=0.006, anchor=r"\\\(n_5\\\) at \\\(([\d.]+)\\\)", must=True),
        # ── HNSW toy2: the true NN b9 (1.4142) + the base-only trap path b0(17.088)→b1(14.3178) ──
        C("L9 hnsw2 nn",  t2["bruteForce"]["dist"], r"true nearest neighbour is \\\(b_9\\\) at distance \\\(([\d.]+)\\\)"),
        C("L9 hnsw2 b0",  bo["b0"], r"walk at \\\(b_0 = \(0,0\)\\\), distance \\\(([\d.]+)\\\) to", tol=0.006),
        C("L9 hnsw2 b1",  bo["b1"], r"\\\(b_0 \\to b_1\\\) \(\\\(([\d.]+)\\\)\)", tol=0.006),
        # ── efSweep: the worst-case brute-force NN distance (node 5 at 5.831) ──
        C("L9 efsweep nn", ev["bruteForce"]["dist"], r"nearest neighbour is node 5, at distance \\\(([\d.]+)\\\)", tol=0.006),
        # ── IVF toy: nprobe=1 → recall@3 0.6667; PQ representative recall@1 0.70 ──
        dict(id="book L9 ivf recall1", deck="L9", value=ivf1, tol=1e-4, anchor=r"recall@3 = ([\d.]+)</strong>\. With", must=True),
        dict(id="book L9 pq recall", deck="L9", value=pqr, tol=1e-4, anchor=r"exact search is <strong>≈ ([\d.]+)", must=True),
        # ── PQ codebook training: Lloyd centroids 6.75 → (1.3333, 8.3333), inertia 20.6875 → 2.6667 ──
        C("L9 cb c1x",      ck["iterations"][1]["centroids"][1][0], r"\\\(c_1=\(([\d.]+),6\.5\)\\\)"),
        C("L9 cb inertia1", ck["iterations"][1]["inertia"], r"Inertia drops to \\\(\\mathbf\{([\d.]+)\}\\\)"),
        C("L9 cb c0final",  ck["final"]["centroids"][0][0], r"\\\(c_0=\(([\d.]+),1\.3333\)\\\)"),
        C("L9 cb c1final",  ck["final"]["centroids"][1][0], r"\\\(c_1=\(([\d.]+),8\.3333\)\\\)"),
        C("L9 cb inertia2", ck["final"]["inertia"], r"Inertia settles at \\\(\\mathbf\{([\d.]+)\}\\\)"),
    ]


# ── [C] L10 BOOK CLAIMS: the built Book PROSE (worked :::calc + widget captions) must show the same
#    kMax / RR / recall as data/l10-*.json. Only RR 0.125 is coverage-caught (≥2-dp); the single-decimal
#    lifts (0.5 / 0.4 / 0.8) and the integer kMax are gated too for drift safety. Values from data globals. ──
def l10_book_claims():
    R, W = RAG10, REWRITE10
    rm  = {d["id"]: d for d in R["retrievalMath"]["docs"]}
    win = {w["ctx"]: w["kMax"] for w in BUDGET10["windows"]}
    fz  = {s["id"]: s for s in FUSION10["scores"]}
    return [
        # ── RAG token budget: kMax = ⌊3354/256⌋ = 13 + the budget sweep across windows (29 / 125 / 497) ──
        dict(id="book L10 kMax", deck="L10", value=R["kMax"], tol=1e-9, anchor=r"3354/256 \\rfloor = \\mathbf\{(\d+)\}", must=True),
        dict(id="book L10 budget 8k",   deck="L10", value=win[8192],   tol=1e-9, anchor=r"\\lfloor 7450/256 \\rfloor = \\mathbf\{(\d+)\}", must=True),
        dict(id="book L10 budget 32k",  deck="L10", value=win[32768],  tol=1e-9, anchor=r"\\lfloor 32026/256 \\rfloor = \\mathbf\{(\d+)\}", must=True),
        dict(id="book L10 budget 128k", deck="L10", value=win[128000], tol=1e-9, anchor=r"\\lfloor 127258/256 \\rfloor = \\mathbf\{(\d+)\}", must=True),
        # ── retrieval-math: cos4 = dot/(‖q‖·‖d‖) reproduces the trace scores (√-denominators pin each) ──
        dict(id="book L10 cos cardiac", deck="L10", value=rm["doc_cardiac_cycle"]["cos4"], tol=1e-4, anchor=r"\\dfrac\{10\}\{\\sqrt\{15\}\\,\\sqrt\{10\}\} = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 cos circ",    deck="L10", value=rm["doc_circulatory"]["cos4"],   tol=1e-4, anchor=r"\\dfrac\{11\}\{\\sqrt\{15\}\\,\\sqrt\{13\}\} = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 cos valves",  deck="L10", value=rm["doc_valves"]["cos4"],        tol=1e-4, anchor=r"\\dfrac\{15\}\{\\sqrt\{15\}\\,\\sqrt\{30\}\} = \\mathbf\{([\d.]+)\}", must=True),
        # ── RRF fusion: consensus doc 0.0325 > sparse-#1 doc 0.0323 ──
        dict(id="book L10 rrf consensus", deck="L10", value=fz["doc_cardiac_cycle"]["rrf"], tol=1e-4, anchor=r"\\frac\{1\}\{62\} \+ \\frac\{1\}\{61\} = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 rrf sparse1",   deck="L10", value=fz["doc_circulatory"]["rrf"],   tol=1e-4, anchor=r"\\frac\{1\}\{61\} \+ \\frac\{1\}\{63\} = \\mathbf\{([\d.]+)\}", must=True),
        # ── query rewrite: RR 0.125 → 0.5, multi-query recall@5 0.4 → 0.8 (kept) ──
        dict(id="book L10 rr orig", deck="L10", value=W["original"]["rr"], tol=1e-4, anchor=r"1/8 = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 rr hyde", deck="L10", value=W["hyde"]["rr"], tol=1e-4, anchor=r"1/2 = \\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 mq single", deck="L10", value=W["multiQuery"]["recallAt5Single"], tol=1e-4, anchor=r"2/5.{0,45}?\\mathbf\{([\d.]+)\}", must=True),
        dict(id="book L10 mq union", deck="L10", value=W["multiQuery"]["recallAt5Union"], tol=1e-4, anchor=r"4/5.{0,45}?\\mathbf\{([\d.]+)\}", must=True),
    ]


# ── [C] L11 BOOK CLAIMS: the built Book PROSE (worked :::calc + KaTeX) must show the same RAGAS answer-
#    relevance trace + Goodhart means as data/l11-*.json. Same numbers the deck shows, but the Book restates
#    them in its own KaTeX (\dfrac / \([\,..\]\)), so the deck anchors don't match — paired here with Book
#    markup. Values from the data globals (single source — never re-typed); 2.11 = Σ reverseQuestionCos. ──
def l11_book_claims():
    rqc = RAGAS11["reverseQuestionCos"]
    gh  = JUDGE11["goodhart"]
    C = lambda id, value, anchor, tol=1e-4: dict(id="book "+id, deck="L11", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # ── RAGAS answer relevance: \([\,0.92,\ 0.88,\ 0.31\,]\) → 2.11/3 = 0.7033 ──
        C("L11 rqc0",  rqc[0], r"question \\\(q\\\): \\\(\[\\,([\d.]+),\\ 0\.88"),
        C("L11 rqc1",  rqc[1], r"\\,0\.92,\\ ([\d.]+),\\ 0\.31"),
        C("L11 rqc2",  rqc[2], r"0\.88,\\ ([\d.]+)\\,\]"),
        C("L11 rqc sum", round(sum(rqc), 2), r"= \\dfrac\{([\d.]+)\}\{3\} = \\mathbf\{0\.7033\}"),
        C("L11 ans rel", RAGAS11["answerRelevance"], r"\\dfrac\{2\.11\}\{3\} = \\mathbf\{([\d.]+)\}"),
        # ── RAGAS context precision: \dfrac{1 + \tfrac{2}{3}}{2} = 0.8333 ──
        C("L11 ctx prec", RAGAS11["contextPrecision"], r"\\dfrac\{1 \+ \\tfrac\{2\}\{3\}\}\{2\} = \\mathbf\{([\d.]+)\}"),
        # ── LLM-judge Goodhart flip: honest A = mean[5,5,3] = 4.3333; padded C = (4+3+2·5)/4 = 4.25 wins ──
        C("L11 honest A", gh["honest"]["good"],        r"A = \\operatorname\{mean\}\[5, 5, 3\] = \\mathbf\{([\d.]+)\}"),
        C("L11 gamed C",  gh["lengthBiased"]["gamed"], r"2\\cdot 5\}\{4\} = \\mathbf\{([\d.]+)\}"),
    ]


# ── [C] L14 "The Artificer's Quill" deck: the query-rewriting toy numbers shown as visible prose/math,
#    each gated to its data source (l14-rewrite.json) so deck==data and the coverage-guard stays at 0. ──
def l14_deck_claims():
    R = REWRITE14; T = R["techniques"]; SB = R["stepBack"]; MQ = R["multiQueryRRF"]; DC = R["decomposition"]
    C = lambda id, value, anchor, tol=0.01: dict(id=id, deck="L14", value=value, tol=tol, anchor=anchor, must=True)
    n = lambda s: r"(?<![\d.])(" + s + r")(?!\d)"     # a standalone decimal (not a fragment of a longer number)
    return [
        C("L14 raw cosGold",         T["raw"]["cosGold"],        n(r"0\.22")),   # trap outranks gold on the raw query
        C("L14 raw cosTrap",         T["raw"]["cosTrap"],        n(r"0\.45")),
        C("L14 rm3 cosGold",         T["rm3"]["cosGold"],        n(r"0\.28")),   # RM3 helps (4→3) but hits its ceiling
        C("L14 hyde cosGold",        T["hyde"]["cosGold"],       n(r"0\.63")),   # the cosine jump 0.22→0.63
        C("L14 hyde cosTrap",        T["hyde"]["cosTrap"],       n(r"0\.16")),
        C("L14 stepback cosGeneric", SB["cosGenericPrinciple"],  n(r"0\.57")),   # generic query retrieves the principle
        C("L14 rrf gold",            MQ["rrfGold"],              n(r"0\.0484"), 0.002),  # RRF consensus
        C("L14 rrf singleHit",       MQ["rrfSingleHitRank1"],    n(r"0\.0164"), 0.002),  # a single rank-1 hit
        C("L14 compose p^n",         DC["composeSuccess"],       n(r"0\.73")),   # error propagation 0.9^3 = 0.729
    ]


# ── [C] L15 DECK CLAIMS: every flagship ≥2-dp worked value the L15 deck DISPLAYS == data/l15-attention.json.
#    Unlike siblings L16–L18 (baseline-frozen only), L15's self-attention / √dₖ / positional-encoding /
#    parameter-count / causal-mask / decoding / O(n²)-memory numbers are now GATED: gen_l15.py (stdlib
#    math.exp/sin/cos) is the single source, so a drift in the deck OR the generator fails here. Values are
#    read from data/ (never re-typed); anchors capture the KaTeX/plain worked-example display sites. ──
def l15_deck_claims():
    A, S, P, Pa, Cc, D, Mem = (ATTN15[k] for k in
        ("attention", "sqrtScale", "posEnc", "params", "causal", "decoding", "memory"))
    C = lambda id, value, anchor, tol=1e-3: dict(id=id, deck="L15", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # Example 1 — self-attention forward: softmax(1,0,3) weights + context output Y1
        C("L15 ex1 w0", A["weights"][0], r"A_1=\((0\.114),\\,0\.042,\\,0\.844\)"),
        C("L15 ex1 w1", A["weights"][1], r"0\.114,\\,(0\.042),\\,0\.844"),
        C("L15 ex1 w2", A["weights"][2], r"0\.042,\\,(0\.844)\)"),
        C("L15 ex1 y0", A["output"][0],  r"Y_1=\((0\.958),\\,0\.886\)"),
        C("L15 ex1 y1", A["output"][1],  r"0\.958,\\,(0\.886)\)"),
        # √dₖ saturation — same dot 6: unscaled peaky 0.995 vs ÷√4 softer 0.909
        C("L15 sqrt unscaled", S["unscaled"][2], r"0,0,6\)=\(0\.002,\\,0\.002,\\,(0\.995)"),
        C("L15 sqrt scaled",   S["scaled"][2],   r"0,0,3\)=\(0\.045,\\,0\.045,\\,(0\.909)"),
        C("L15 sqrt scaled a", S["scaled"][0],   r"0,0,3\)=\((0\.045),\\,0\.045"),
        # Positional encoding pos=1: (sin 1, cos 1, sin .01, cos .01)
        C("L15 pe sin1",  P["pos1"][0], r"\((0\.841),0\.540,0\.010"),
        C("L15 pe cos1",  P["pos1"][1], r"0\.841,(0\.540),0\.010"),
        C("L15 pe sin01", P["pos1"][2], r"0\.540,(0\.010),1\.000"),
        # Block parameters: 12·768² = 7 077 888 ≈ 7.08M
        C("L15 params/block", Pa["perBlockM"], r"\\approx (7\.08)\\text\{M\}"),
        # Causal attention — no-mask future-leak vs causal mask
        C("L15 causal nm0", Cc["noMask"][0], r"softmax\(0, 2, 3\) = \((0\.035), 0\.259, 0\.705\)"),
        C("L15 causal nm1", Cc["noMask"][1], r"softmax\(0, 2, 3\) = \(0\.035, (0\.259), 0\.705\)"),
        C("L15 causal nm2", Cc["noMask"][2], r"softmax\(0, 2, 3\) = \(0\.035, 0\.259, (0\.705)\)"),
        C("L15 causal m0",  Cc["masked"][0], r"softmax\(0, 2\) = \((0\.119), 0\.881\)"),
        C("L15 causal m1",  Cc["masked"][1], r"softmax\(0, 2\) = \(0\.119, (0\.881)\)"),
        # Decoding — base softmax + top-k(2) renormalize + temperature reshape
        C("L15 dec base0",  D["base"][0],      r"softmax\}\(z\)=\((0\.563),\\,0\.207"),
        C("L15 dec base4",  D["base"][4],      r"0\.076,\\,(0\.028)\)"),
        C("L15 dec topk2",  D["topk2"][0],     r"\\to \((0\.731),\\,0\.269\)"),
        C("L15 dec Tsharp", D["tempSharp"][0], r"\((0\.829),\\,0\.112,\\,0\.041"),
        C("L15 dec Tsoft",  D["tempSoft"][0],  r"\((0\.375),\\,0\.227,\\,0\.177"),
        # descending cumulative mass (top-p) 0.563 → 0.770 → 0.896 → 0.972 → 1.000
        C("L15 dec cum1", D["cumulative"][1], r"0\.563 \\to (0\.770)"),
        C("L15 dec cum2", D["cumulative"][2], r"0\.770 \\to (0\.896)"),
        C("L15 dec cum3", D["cumulative"][3], r"0\.896 \\to (0\.972)"),
        # O(n²) score-matrix memory (fp16, per head): 0.52 MB (n=512), 2.15 GB (n=32k)
        C("L15 mem 512", Mem["mb512"], r"(0\.52) MB"),
        C("L15 mem 32k", Mem["gb32k"], r"(2\.15) GB"),
        # …and the ×12-heads bill the walk-through DISPLAYS: 6.3 MB / 403 MB / 25.8 GB. Gated because the
        # generator once re-rounded the per-head figure (round(0.52·12,1)=6.2 ≠ round(2·512²·12/1e6,1)=6.3)
        # and NOTHING caught it — the deck printed 6.3 while data/ said 6.2 for a whole release.
        C("L15 mem 512 ×12", Mem["mb512x12"], r"0\.52 MB · ×12 = ([\d.]+) MB", tol=1e-2),
        C("L15 mem 4k ×12",  Mem["mb4kx12"],  r"33\.6 MB · ×12 = ([\d.]+) MB", tol=1e-2),
        C("L15 mem 32k ×12", Mem["gb32kx12"], r"2\.15 GB · ×12 = ([\d.]+) GB", tol=1e-2),
    ]


def provenance_l14(report):
    """[P] L14 toy-recompute (gen_l14.py, stdlib): the query-rewriting toy is fully re-derivable from the
    stored concept bags — set-overlap cosines, ranks (RR=1/rank), the RRF sum (k=60), and the
    error-propagation p^n — plus the load-bearing ordering invariants (the raw query fails because the
    lexical trap outranks the gold; HyDE lifts the gold to rank 1; raw > rm3 > hyde by rank; step-back
    lifts the principle; RRF consensus beats a single hit). Guards drift before the deck's [C] claims land."""
    W, B = REWRITE14, BENCH14
    checks, flags = [], []
    def need(cond, name):
        if not cond:
            flags.append(name)
            report.append(("HARD", f"provenance-L14({name}): structural invariant broken"))

    corpus = W["corpus"]
    def cosb(a, b):
        A, Bs = set(a), set(b)
        return 0.0 if not A or not Bs else len(A & Bs) / math.sqrt(len(A) * len(Bs))
    def ranked(qbag):
        return sorted(((did, cosb(qbag, bag)) for did, bag in corpus.items()), key=lambda kv: (-kv[1], kv[0]))
    def rank_of(qbag, doc):
        return next((i for i, (did, _) in enumerate(ranked(qbag), 1) if did == doc), len(corpus) + 1)

    gold, trap, prin = W["goldDocId"], W["trapDocId"], W["principleDocId"]
    T = W["techniques"]

    # ── cosines recomputed from the concept bags (like L10 retrievalMath) ──
    checks.append(("raw.cosGold == cos(q,gold)", T["raw"]["cosGold"], round(cosb(W["queryBag"], corpus[gold]), 4), 1e-4))
    checks.append(("raw.cosTrap == cos(q,trap)", T["raw"]["cosTrap"], round(cosb(W["queryBag"], corpus[trap]), 4), 1e-4))
    checks.append(("hyde.cosGold == cos(h,gold)", T["hyde"]["cosGold"], round(cosb(T["hyde"]["hypotheticalBag"], corpus[gold]), 4), 1e-4))
    checks.append(("hyde.cosTrap == cos(h,trap)", T["hyde"]["cosTrap"], round(cosb(T["hyde"]["hypotheticalBag"], corpus[trap]), 4), 1e-4))
    checks.append(("rm3.cosGold == cos(q',gold)", T["rm3"]["cosGold"], round(cosb(T["rm3"]["expandedBag"], corpus[gold]), 4), 1e-4))

    # ── ranks (RR = 1/rank) + rankedList == cosine order ──
    for key, bag in (("raw", W["queryBag"]), ("rm3", T["rm3"]["expandedBag"]), ("hyde", T["hyde"]["hypotheticalBag"])):
        checks.append((f"{key}.goldRank == rank(gold)", T[key]["goldRank"], rank_of(bag, gold), 0))
        checks.append((f"{key}.rr == 1/rank", T[key]["rr"], round(1.0 / T[key]["goldRank"], 4), 1e-4))
        need([d for d, _ in ranked(bag)] == T[key]["rankedList"], f"{key} rankedList == cosine order")
    checks.append(("raw.trapRank == rank(trap)", T["raw"]["trapRank"], rank_of(W["queryBag"], trap), 0))

    # ── step-back cosines (specific matches no principle; generic does) ──
    sb = W["stepBack"]
    checks.append(("stepBack.cosSpecific == cos(qsb,principle)", sb["cosSpecificPrinciple"], round(cosb(sb["specificBag"], corpus[prin]), 4), 1e-4))
    checks.append(("stepBack.cosGeneric == cos(qgen,principle)", sb["cosGenericPrinciple"], round(cosb(sb["genericBag"], corpus[prin]), 4), 1e-4))

    # ── RRF (k=60): Σ 1/(k+r); a single rank-1 hit ──
    mq = W["multiQueryRRF"]; k = mq["k"]
    checks.append(("rrf.gold == Σ 1/(k+r)", mq["rrfGold"], round(sum(1.0 / (k + r) for r in mq["paraphraseGoldRanks"]), 4), 1e-4))
    checks.append(("rrf.singleHit == 1/(k+1)", mq["rrfSingleHitRank1"], round(1.0 / (k + 1), 4), 1e-4))
    for i, r in enumerate(mq["paraphraseGoldRanks"]):
        checks.append((f"rrf.term[{i}] == 1/(k+{r})", mq["rrfTerms"][i], round(1.0 / (k + r), 4), 1e-4))

    # ── decomposition error propagation p^n ──
    D = W["decomposition"]
    checks.append(("decomp.compose == p^n", D["composeSuccess"], round(D["perHopSuccess"] ** D["hops"], 4), 1e-4))
    need(all(r == 1 for r in D["recallSub"]), "decomp each sub found (recallSub all 1)")
    need(D["recallJoint"] == 0, "decomp joint retrieval fails (recallJoint 0) ⇒ decomposition recovers all")

    # ── the load-bearing ordering invariants (the three-gaps pedagogy; BAMs) ──
    need(T["raw"]["cosTrap"] > T["raw"]["cosGold"], "raw query fails: trap outranks gold on surface words (vocab gap)")
    need(T["raw"]["goldRank"] >= 3, "gold is buried under the raw query")
    need(T["hyde"]["goldRank"] == 1, "HyDE lifts gold to rank 1")
    need(T["raw"]["goldRank"] > T["rm3"]["goldRank"] > T["hyde"]["goldRank"], "ordering raw > rm3 > hyde by rank (RM3 helps but ceiling)")
    need(sb["cosGenericPrinciple"] > sb["cosSpecificPrinciple"], "step-back: generic retrieves the principle better than specific")
    need(mq["rrfGold"] > mq["rrfSingleHitRank1"], "RRF consensus beats a single top-1 hit")

    # ── bench provenance: cited rows carry a source; the least-to-most 16.2 is the CoT column (SF-5) ──
    need(B.get("cited") is True, "l14-bench marked cited")
    need("chain-of-thought" in B["leastToMost"]["note"].lower(), "least-to-most 16.2 pinned as the chain-of-thought baseline column")

    bad = 0
    for name, a, b, tol in checks:
        if abs(a - b) > tol:
            bad += 1
            report.append(("HARD", f"provenance-L14({name}): data/ disagree/invariant broken — {a} vs {b}"))
    if not bad and not flags:
        report.append(("OK", f"provenance-L14: {len(checks)} recompute + structural invariants consistent ✓"))


# ── L19 "The Wiring Diagram" — the lecture whose whole promise is that the BILL is readable off the
#    picture. Every figure it prints is derived by _research/gen_l19.py from one counting rule
#    (2·a·b·c per matmul) applied to the glyphs, so every figure it prints must EQUAL that derivation.
#    Note these are all 1-decimal numbers, which is exactly why they need claims: the coverage-guard
#    only forces a gate on ≥2-dp values, so a whole lecture of 10.0 / 47.1 / 87.7 could have drifted
#    from its own generator without a single gate saying a word. ──────────────────────────────────
def l19_deck_claims():
    F, X, S, K = (COST19[k] for k in ("flops", "crossover", "scoreBox", "kvCache"))
    C = lambda id, value, anchor, tol=1e-3: dict(id=id, deck="L19", value=value, tol=tol, anchor=anchor, must=True)
    return [
        # the punchline: attention is 10 % of a block at the length everyone actually trains at, and 88 % at 32k
        C("L19 share 512",    F["512"]["attnSharePct"],     r"доля внимания в блоке: ([\d.]+)%"),
        C("L19 share 32k",    F["32768"]["attnSharePct"],   r"доля внимания в блоке: 10\.0% &rarr; ([\d.]+)%"),
        C("L19 share 4k",     F["4096"]["attnSharePct"],    r'<td class="cell-meh">([\d.]+)&thinsp;%</td>'),
        # the table it is read from — linear (24nd²) against the attention core (4n²d), per length
        C("L19 lin 512",      F["512"]["linearGF"],         r'<strong>512</strong></td>\s*<td class="cell-bad"><span lang="ru">([\d.]+) ГФлопс'),
        C("L19 core 512",     F["512"]["attnCoreGF"],       r'7\.2 GFLOPs</span></td>\s*<td><span lang="ru">([\d.]+) ГФлопс'),
        C("L19 lin 4k",       F["4096"]["linearGF"],        r'<strong>4096</strong></td>\s*<td class="cell-meh"><span lang="ru">([\d.]+) ГФлопс'),
        C("L19 core 4k",      F["4096"]["attnCoreGF"],      r'([\d.]+) GFLOPs</span></td>\s*<td class="cell-meh">47\.1'),
        C("L19 lin 32k",      F["32768"]["linearGF"],       r'<strong>32768</strong></td>\s*<td><span lang="ru">([\d.]+) ГФлопс'),
        C("L19 core 32k",     F["32768"]["attnCoreGF"],     r'463\.9 GFLOPs</span></td>\s*<td class="cell-bad"><span lang="ru">([\d.]+) ГФлопс'),
        # the crossover, which the diagram SOLVES rather than searches for: 4n²d = 24nd² ⟺ n = 6d
        C("L19 crossover GF", X["linearGF"],                r"стоят поровну: <strong>([\d.]+) ГФлопс"),
        C("L19 crossover n",  X["n"],                       r"это \\\(n = (\d+)\\\) токенов"),
        # memory bites long before flops do — and these three MUST agree with L06/L15, which print them too
        C("L19 box 512",      S["512"]["mb"],               r"12 голов: ([\d.]+) МБ при"),
        C("L19 box 4k",       S["4096"]["mb"],              r'<span lang="ru">(\d+) МБ</span>'),
        C("L19 box 32k",      S["32768"]["gb"],             r"<strong>([\d.]+) ГБ</strong> при"),
        # the KV cache: the axis that GROWS, and why MQA/GQA divide the bill without touching the query wire
        C("L19 kv mha/token", K["mha"]["perTokenKB"],       r"бирка «([\d.]+) КБ за токен»"),
        C("L19 kv mha total", K["mha"]["atLongMB"],         r"&rarr; <strong>([\d.]+) МБ</strong> при"),
        C("L19 kv mqa/token", K["mqa"]["perTokenKB"],       r"K и V: <strong>([\d.]+) КБ на токен</strong>"),
        C("L19 kv mqa total", K["mqa"]["atLongMB"],         r"КБ на токен</strong>, ([\d.]+) МБ"),
        C("L19 kv gqa/token", K["gqa4"]["perTokenKB"],      r"GQA-4&nbsp;&mdash; ([\d.]+) КБ"),
        C("L19 kv gqa total", K["gqa4"]["atLongMB"],        r"([\d.]+) МБ, в 3 раза"),
    ]



# ── [C] L17 DECK CLAIMS: "Shannon Entropy" after the depth pass. The deck grew from 45 to 84 slides and
#    now DISPLAYS every worked number the generator computes (conditional entropy on Markov's 1913 counts,
#    the non-dyadic Huffman gap, the block-coding ladder, the letter-frequency entropies of English and
#    Russian, IDF re-read in bits) plus the reported literature it argues from. Each is pinned deck==data
#    here — value from data/l17-entropy.json (ours) or data/l17-bench.json (cited) — so the coverage-guard
#    baseline for deck:L17 can be ratcheted DOWN rather than raised. Anchors quote the display site, so
#    rewording a slide without re-checking its number fails loudly. ────────────────────────────────────
def l17_deck_claims():
    # DIGIT LOCATORS, not context sniffers (same rationale as l16_deck_claims): every displayed number
    # now exists TWICE — a `lang="ru"` span with the comma and a `lang="en"` span with the dot (§2 of
    # narrative/style-ru.md) — so an anchor that quoted the surrounding markup matched one surface only
    # and rotted the moment a cell was split by language. The locator IS the literal value, guarded on
    # both sides, so drift in data/ still fails loudly (value moves, the literal no longer equals it).
    C = lambda id, value, anchor, tol=1e-3: dict(id=id, deck="L17", value=value, tol=tol, anchor=anchor, must=True)
    return [
        C("L17 huffman blocks excess 3", ENT17["huffman"]["blocks"]["excess"][3], r"""(?<![\d.,])(0[.,]0071)(?![\d])"""),
        C("L17 huffman blocks excess 2", ENT17["huffman"]["blocks"]["excess"][2], r"""(?<![\d.,])(0[.,]0116)(?![\d])"""),
        # S13: the clarity-vs-average-IDF baseline, told in full (Table 1/3 + Table 2/4)
        C("L17 search clarityIdfTrec7", BENCH17["search"]["clarityIdfTrec7"], r"""(?<![\d.,])(0[.,]467)(?![\d])"""),
        C("L17 search clarityQueryTrack", BENCH17["search"]["clarityQueryTrack"], r"""(?<![\d.,])(0[.,]39)(?![\d])"""),
        C("L17 search clarityIdfQueryTrack", BENCH17["search"]["clarityIdfQueryTrack"], r"""(?<![\d.,])(0[.,]025)(?![\d])"""),
        # S4: log2(31) — the ceiling of a Russian alphabet with ё and ъ DROPPED (they are merged, not dropped)
        C("L17 ru ceiling31", BENCH17["ru"]["ceiling31"], r"""(?<![\d.,])(4\.954)(?![\d])"""),
        # S15: both operands of the ITU Morse efficiency, now printed on the slide
        C("L17 morse ituUnitsOptimal", BENCH17["morse"]["ituUnitsOptimal"], r"""(?<![\d.,])(5[.,]6616)(?![\d])"""),
        C("L17 morse ituUnitsMorse", BENCH17["morse"]["ituUnitsMorse"], r"""(?<![\d.,])(6[.,]0054)(?![\d])"""),
        C("L17 fn wordFreqOf", BENCH17["fn"]["wordFreqOf"], r"""\s+/>of\s+\&mdash;\s+(0,034)"""),
        # B7: 11.82 is REPORTED, not implied — the recomputation the slide now prints alongside it
        #     (digit locators: the RU span writes the comma, the EN span the dot)
        C("L17 fn zipfSum", BENCH17["fn"]["zipfSum"], r"""(?<![\d.,])(0[.,]9651)(?![\d])"""),
        C("L17 fn zipfH", BENCH17["fn"]["zipfH"], r"""(?<![\d.,])(9[.,]1353)(?![\d])"""),
        C("L17 fn zipfHNormalised", BENCH17["fn"]["zipfHNormalised"], r"""(?<![\d.,])(9[.,]4141)(?![\d])"""),
        C("L17 fn wordFreqThe", BENCH17["fn"]["wordFreqThe"], r"""(?<![\d.,])(0[.,]071)(?![\d])"""),
        C("L17 huffman nonDyadic probs I", ENT17["huffman"]["nonDyadic"]["probs"]["I"], r"""iddot;\s+I\&nbsp;(0,08)"""),
        C("L17 search churchGalePoissonH", BENCH17["search"]["churchGalePoissonH"], r"""вских\s+<strong>(0,092)"""),
        C("L17 search churchGaleSomewhatH", BENCH17["search"]["churchGaleSomewhatH"], r"""t</b>\s+sits\s+at\s+(0\.093)"""),
        C("L17 robertson p 1", ENT17["robertson"]["p"][1], r"""I_2\s+=\s+\-\\log_2\s+(0[.,]11)"""),
        C("L17 robertson selfInfo 0", ENT17["robertson"]["selfInfo"][0], r"""\.89\s+=\s+\\mathbf\{(0[.,]1681)"""),
        C("L17 coin klQ", ENT17["coin"]["klQ"], r"""(?<![\d.,])(0[.,]1887)(?![\d])"""),
        C("L17 coin klReverse", ENT17["coin"]["klReverse"], r"""\|p\)\s+=\s+\\mathbf\{(0[.,]2075)"""),
        C("L17 phraseHuffman entropyGap", ENT17["phraseHuffman"]["entropyGap"], r"""(?<![\d.,])(0[.,]2393)(?![\d])"""),
        C("L17 coin contrib 1", ENT17["coin"]["contrib"][1], r"""\.415\)\s+=\s+0\.5\s+\+\s+(0\.311)"""),
        C("L17 search clarityAp88", BENCH17["search"]["clarityAp88"], r"""0\.409\s+against\s+(0\.368)"""),
        C("L17 markovOnegin pVowel", ENT17["markovOnegin"]["pVowel"], r"""cdot\s+0\.6631\s+=\s+(0[.,]4319)"""),
        C("L17 huffman nonDyadic gallagerBound", ENT17["huffman"]["nonDyadic"]["gallagerBound"], r"""P_1\s+\+\s+0\.086\s+=\s+(0\.436)"""),
        C("L17 markovOnegin HgivenVowel", ENT17["markovOnegin"]["HgivenVowel"], r"""\}\)\s+=\s+0\.4319\\,\((0[.,]5514)"""),
        C("L17 search claritySeries 1", BENCH17["search"]["claritySeries"][1], r"""(?<![\d.,])(0[.,]65)(?![\d])"""),
        C("L17 idfBits natsL3", ENT17["idfBits"]["natsL3"], r"""(?<![\d.,])(0[.,]6931)(?![\d])"""),
        C("L17 modern text8Llmzip", BENCH17["modern"]["text8Llmzip"], r"""and\s+stands\s+at\s+(0\.709)"""),
        C("L17 markovOnegin Hconditional", ENT17["markovOnegin"]["Hconditional"], r""";=\\;\s+0\.9866\s+\-\s+(0[.,]7618)"""),
        C("L17 coin H", ENT17["coin"]["H"], r"""coin\s+by\s+hand:\s+(0\.811)"""),
        C("L17 coin H", ENT17["coin"]["H"], r"""5\\\)\s+gives\s+\\\(H=(0[.,]8113)"""),
        C("L17 robertson p 0", ENT17["robertson"]["p"][0], r"""\s+\$\$\s+p_1\s+=\s+(0[.,]89)"""),
        C("L17 markovOnegin H", ENT17["markovOnegin"]["H"], r"""=\s+H\(0\.4319\)\s+=\s+(0[.,]9866)"""),
        C("L17 modern text8AdaptiveSpan", BENCH17["modern"]["text8AdaptiveSpan"], r"""1\.08\s+\&middot;\s+(1[.,]07)"""),
        C("L17 modern text8TransformerXL", BENCH17["modern"]["text8TransformerXL"], r"""(?<![\d.,])(1[.,]08)(?![\d])"""),
        C("L17 estimates coverKing1978Capital", BENCH17["estimates"]["coverKing1978Capital"], r"""n">\\\(\\approx\\!(1[.,]34)"""),
        C("L17 natsBits natInBits", ENT17["natsBits"]["natInBits"], r"""нат\s+=\s+<strong>(1,4427)"""),
        C("L17 huffman nonDyadic idealLen E", ENT17["huffman"]["nonDyadic"]["idealLen"]["E"], r"""(?<![\d.,])(1[.,]5146)(?![\d])"""),
        C("L17 source4 H", ENT17["source4"]["H"], r"""(?<![\d.,])(1[.,]75)(?![\d])"""),
        C("L17 idfBits natsRareTerm", ENT17["idfBits"]["natsRareTerm"], r"""(?<![\d.,])(2[.,]0794)(?![\d])"""),
        C("L17 fn Fword_27", BENCH17["fn"]["Fword_27"], r"""\\,0\.818\s+\\;=\\;\s+(2[.,]14)"""),
        C("L17 huffman nonDyadic H", ENT17["huffman"]["nonDyadic"]["H"], r"""(?<![\d.,])(2[.,]1531)(?![\d])"""),
        C("L17 huffman nonDyadic avgCodeLen", ENT17["huffman"]["nonDyadic"]["avgCodeLen"], r"""(?<![\d.,])(2[.,]2000)(?![\d])"""),
        C("L17 huffman nonDyadic idealLen A", ENT17["huffman"]["nonDyadic"]["idealLen"]["A"], r"""(?<![\d.,])(2[.,]3219)(?![\d])"""),
        C("L17 search claritySeries 3", BENCH17["search"]["claritySeries"][3], r"""(?<![\d.,])(2[.,]43)(?![\d])"""),
        C("L17 log2 6 (fair die)", round(math.log2(6), 3), r"""r\s+die\s+\(\&\#8776;(2\.585)"""),
        C("L17 search clarityPrimeLendingRate", BENCH17["search"]["clarityPrimeLendingRate"], r"""dash;\s+<strong>(2,85)"""),
        C("L17 search gov2Bic", BENCH17["search"]["gov2Bic"], r"""ts\s+in\s+<strong>(2[.,]94)"""),
        C("L17 ru H3", BENCH17["ru"]["H3"], r"""(?<![\d.,])(3\.006)(?![\d])"""),
        C("L17 search gov2GapEntropy", BENCH17["search"]["gov2GapEntropy"], r"""docID\s+gaps\s+is\s+(3[.,]02)"""),
        C("L17 huffman nonDyadic idealLen O", ENT17["huffman"]["nonDyadic"]["idealLen"]["O"], r"""(?<![\d.,])(3[.,]0589)(?![\d])"""),
        C("L17 search gov2Pef", BENCH17["search"]["gov2Pef"], r"""or\s+scale:\s+PEF\s+(3[.,]12)"""),
        C("L17 robertson selfInfo 1", ENT17["robertson"]["selfInfo"][1], r"""\.11\s+=\s+\\mathbf\{(3[.,]1844)"""),
        C("L17 ru enH2", BENCH17["ru"]["enH2"], r"""(?<![\d.,])(3\.319)(?![\d])"""),
        C("L17 fn F2_27", BENCH17["fn"]["F2_27"], r"""(?<![\d.,])(3[.,]32)(?![\d])"""),
        C("L17 ru H2", BENCH17["ru"]["H2"], r"""(?<![\d.,])(3\.521)(?![\d])"""),
        C("L17 fn F2_26", BENCH17["fn"]["F2_26"], r"""(?<![\d.,])(3[.,]56)(?![\d])"""),
        C("L17 search gov2OptPfor", BENCH17["search"]["gov2OptPfor"], r"""dot;\s+Opt\-PFor\s+(3,63)"""),
        C("L17 huffman nonDyadic idealLen I", ENT17["huffman"]["nonDyadic"]["idealLen"]["I"], r"""(?<![\d.,])(3[.,]6439)(?![\d])"""),
        C("L17 phrase H", ENT17["phrase"]["H"], r"""(?<![\d.,])(3[.,]6676)(?![\d])"""),
        C("L17 phrase H", ENT17["phrase"]["H"], r"""(?<![\d.,])(3[.,]67)(?![\d])""", tol=0.003),
        C("L17 phraseHuffman avgCodeLen", ENT17["phraseHuffman"]["avgCodeLen"], r"""(?<![\d.,])(3[.,]6923)(?![\d])"""),
        C("L17 search gov2EliasDelta", BENCH17["search"]["gov2EliasDelta"], r"""Elias\-\&delta;\s+(3[.,]74)"""),
        C("L17 letterFreq en26 meanPct", ENT17["letterFreq"]["en26"]["meanPct"], r"""ly\s+\\\(100/26\s+=\s+(3[.,]85)"""),
        C("L17 phrase uniformH", ENT17["phrase"]["uniformH"], r"""=\s+\\log_2\s+15\s+=\s+(3[.,]9069)"""),
        C("L17 phrase uniformH", ENT17["phrase"]["uniformH"], r"""iform\s+ceiling\s+(3[.,]91)""", tol=0.004),
        C("L17 ru enH1", BENCH17["ru"]["enH1"], r"""(?<![\d.,])(4\.029)(?![\d])"""),
        C("L17 fn F1_27", BENCH17["fn"]["F1_27"], r"""(?<![\d.,])(4[.,]03)(?![\d])"""),
        C("L17 search gov2Rice", BENCH17["search"]["gov2Rice"], r"""\&middot;\s+Rice\s+(4[.,]08)"""),
        C("L17 fn F1_26", BENCH17["fn"]["F1_26"], r"""(?<![\d.,])(4[.,]14)(?![\d])"""),
        C("L17 letterFreq en26 H", ENT17["letterFreq"]["en26"]["H"], r"""лийского\s+даёт\s+(4,1758)"""),
        C("L17 ru H1", BENCH17["ru"]["H1"], r"""(?<![\d.,])(4\.348)(?![\d])"""),
        C("L17 letterFreq ru33 H", ENT17["letterFreq"]["ru33"]["H"], r"""F_1\s+=\s+\\mathbf\{(4[.,]4626)"""),
        C("L17 fn F0_26", BENCH17["fn"]["F0_26"], r"""аёт\s+4,1758\s+из\s+(4,70)"""),
        C("L17 letterFreq en26 uniformH", ENT17["letterFreq"]["en26"]["uniformH"], r"""аёт\s+4,1758\s+из\s+(4,7004)"""),
        C("L17 fn ceiling27", BENCH17["fn"]["ceiling27"], r"""\\\(\\log_2\s+27\s+=\s+(4\.755)"""),
        C("L17 fn F0_27", BENCH17["fn"]["F0_27"], r"""ong>:\s+\\\(1\-1\.0/(4[.,]76)"""),
        C("L17 letterFreq ru33 uniformH", ENT17["letterFreq"]["ru33"]["uniformH"], r"""\\\(\\log_2\s+33\s+=\s+(5\.044)"""),
        C("L17 letterFreq ru33 uniformH", ENT17["letterFreq"]["ru33"]["uniformH"], r"""\s+33\s+=\s+\\mathbf\{(5[.,]0444)"""),
        C("L17 search churchGaleSomewhatIdf", BENCH17["search"]["churchGaleSomewhatIdf"], r"""\s+\(IDF\s+<strong>(6[.,]45)"""),
        C("L17 perplexity wsjBitsTrigram", BENCH17["perplexity"]["wsjBitsTrigram"], r"""(?<![\d.,])(6[.,]77)(?![\d])"""),
        C("L17 search churchGaleBoycottIdf", BENCH17["search"]["churchGaleBoycottIdf"], r"""\s+\(IDF\s+<strong>(6[.,]98)"""),
        C("L17 search sjSmoothAt3", BENCH17["search"]["sjSmoothAt3"], r"""(?<![\d.,])(7[.,]06)(?![\d])"""),
        C("L17 perplexity shannonWordBits", BENCH17["perplexity"]["shannonWordBits"], r"""(?<![\d.,])(7[.,]15)(?![\d])"""),
        C("L17 perplexity wsjBitsBigram", BENCH17["perplexity"]["wsjBitsBigram"], r"""(?<![\d.,])(7[.,]41)(?![\d])"""),
        C("L17 modern enwikCeilingBits", BENCH17["modern"]["enwikCeilingBits"], r"""\(\\log_2\s+206\s+=\s+(7\.687)"""),
        C("L17 search gov2VByte", BENCH17["search"]["gov2VByte"], r"""middot;\s+VByte\s+(8[.,]81)"""),
        C("L17 perplexity wsjBitsUnigram", BENCH17["perplexity"]["wsjBitsUnigram"], r"""(?<![\d.,])(9[.,]91)(?![\d])"""),
        C("L17 fn wordBitsPerWord", BENCH17["fn"]["wordBitsPerWord"], r"""\s+\$\$\s+\\frac\{(11[.,]82)"""),
        C("L17 perplexity gpt3Ptb", BENCH17["perplexity"]["gpt3Ptb"], r"""(?<![\d.,])(20[.,]50)(?![\d])"""),
        C("L17 perplexity gpt2Ptb", BENCH17["perplexity"]["gpt2Ptb"], r"""(?<![\d.,])(35[.,]76)(?![\d])"""),
    ]

def main():
    text = {k: p.read_text() for k, p in DECKS.items()}
    book = load_book()                              # built Book HTML (empty if docs/ not built)
    report = []
    provenance_checks(report)                       # [P] data/ == generator
    provenance_l3l4(report)                         # [P] L3/L4 cross-file data self-consistency
    provenance_l5l6(report)                         # [P] L5/L6 cross-file + data-only pins
    provenance_l5_glove_tsne(report)                # [P] L5 GloVe + t-SNE-math cross-file + data-only pins
    provenance_l2_tokenizers(report)                # [P] L2 tokenizer-compare counts/ranking/segmentation
    provenance_enrichment(report)                   # [P] L5/L6 enrichment trajectory cross-file + data-only pins
    provenance_l6_nce(report, text.get("L6", ""))   # [P] L6 InfoNCE softmax BARS == softmax(traj.logits)·H (R8 data-bind)
    provenance_l7(report)                            # [P] L7 toy-recompute + cross-file + structural pins
    provenance_l8(report)                            # [P] L8 toy-recompute + the four cross-pillar BAMs
    provenance_l9(report)                            # [P] L9 toy-recompute (HNSW greedy/IVF recall+geometry/PQ bytes/latency sum)
    provenance_l10(report)                           # [P] L10 toy-recompute (RAG kMax/chunking containment/rewrite RR+recall)
    provenance_l11(report)                           # [P] L11 toy-recompute (RAGAS metrics/judge rubric+Goodhart flip/agentic) + REAL judge rates
    provenance_l12(report)                           # [P] L12 toy-recompute (GraphRAG multi-hop/CLIP cosine matrix) + REAL hallucination demo
    provenance_l16(report)                           # [P] L16 late-chunking: the 3 widget blocks re-derived + the bench's structural invariants (incl. the F-10 ColBERTv2 parity and the 33:2:1 record)
    provenance_l14(report)                           # [P] L14 toy-recompute (query-rewrite cosines/ranks/RR + RRF k=60 + step-back + p^n; deep-dive #2)
    for c in claims():                              # [C] deck == data/
        report.append(check_claim(c, text[c["deck"]]))
    if book:                                        # [C] Book == data/ (the Book restates the flagship numbers)
        nbk = sum(1 for c in book_claims() if c["deck"] in book)
        for c in book_claims():
            if c["deck"] in book:
                report.append(check_claim(c, book[c["deck"]]))
        report.append(("OK", f"book: {nbk} Book-prose numbers gated against data/ ✓"))
    else:
        report.append(("WARN", "Book not built (docs/ absent) — Book [C] claims skipped; run `npm run build`"))
    # [A] recompute: deck fractions + (any) Book fractions, in one pass.
    arithmetic_checks(report, {**text, **{"book " + k: v for k, v in book.items()}})
    coverage_guard(report, text, book)              # [G] no NEW un-gated displayed number (auto-extends to L7…)
    hard = sum(1 for s, _ in report if s == "HARD")
    warn = sum(1 for s, _ in report if s == "WARN")
    print(f"[facts-gate] {len(report)} checks — source: data/ (provenance→curated→deck)")
    for sev, msg in report:
        print(f"  {'✗' if sev=='HARD' else ('!' if sev=='WARN' else '✓')} [{sev}] {msg}")
    print(f"\n[facts-gate] HARD(drift/missing)={hard}  WARN={warn}")
    return 1 if hard else 0

def selftest():
    # num(): RU decimal comma, KaTeX {,}, and EN thousands all parse (gate is comma-aware for the trilingual Book).
    assert num("0,75") == 0.75 and num("0{,}75") == 0.75 and num("2,3") == 2.3, "num: RU decimal comma"
    assert num("0,6931") == 0.6931 and num("0,667") == 0.667, "num: comma decimal incl. leading-zero (not thousands)"
    assert num("94,287") == 94287 and num("10,000") == 10000 and num("1,234.56") == 1234.56, "num: EN thousands-comma"
    print("[selftest:num] RU comma / KaTeX {,} / EN thousands all parse ✓")
    # §2.4: a deck snippet with a WRONG β must flag DRIFT against data/.
    bad = 'fill="var(--ink-2)">β ≈ 0.42 — measured</text>'
    c = next(x for x in claims() if x["id"] == "heaps β")
    sev, msg = check_claim(c, bad)
    okD = sev == "HARD" and "DRIFT" in msg
    print("[selftest:claim]", msg)
    # arithmetic: a deliberately-wrong displayed fraction must flag.
    rep = []
    arithmetic_checks(rep, {"L2": r'\frac{1\cdot 29}{1\cdot 1} = 28'})
    okA = any(s == "HARD" and "is WRONG" in m for s, m in rep)
    print("[selftest:arith]", next((m for s, m in rep if s == "HARD"), "arithmetic: NO FLAG"))
    # provenance: a curated value that disagrees with the generator must flag (simulate in-memory).
    rep2 = []
    saved = CORP["heaps"]["beta"]
    CORP["heaps"]["beta"] = 0.42
    provenance_checks(rep2)
    CORP["heaps"]["beta"] = saved
    okP = any(s == "HARD" and "provenance" in m for s, m in rep2)
    print("[selftest:prov]", next((m for s, m in rep2 if s == "HARD"), "provenance: NO FLAG"))
    # L3/L4 [C]: a deck snippet where a flagship number drifted must flag DRIFT (anchor is not blind).
    cL3 = next(x for x in claims() if x["id"] == "L3 D2 score")
    bL3 = r'$$\mathrm{BM25}(\text{D2})=0.1161+0.6065=0.9999$$'  # wrong: data/ says 0.7226
    sevL3, msgL3 = check_claim(cL3, bL3)
    okL3 = sevL3 == "HARD" and "DRIFT" in msgL3
    print("[selftest:L3]", msgL3)
    cL4 = next(x for x in claims() if x["id"] == "L4 nDCG gam")
    bL4 = r'1.3919/2.5616 = 0.9999'  # wrong: data/ gamed nDCG is 0.5434
    sevL4, msgL4 = check_claim(cL4, bL4)
    okL4 = sevL4 == "HARD" and "DRIFT" in msgL4
    print("[selftest:L4]", msgL4)
    # L3/L4 [P]: a curated cross-file value that disagrees with its companion must flag (in-memory).
    rep3 = []
    savedG = GOODHART["gamed"]["ndcg"]
    GOODHART["gamed"]["ndcg"] = 0.9999
    provenance_l3l4(rep3)
    GOODHART["gamed"]["ndcg"] = savedG
    okP2 = any(s == "HARD" and "provenance-L3L4" in m for s, m in rep3)
    print("[selftest:prov-L3L4]", next((m for s, m in rep3 if s == "HARD"), "provenance-L3L4: NO FLAG"))
    # L5 [C]: a deck snippet where the analogy cosine drifted must flag DRIFT (anchor is not blind).
    cL5 = next(x for x in claims() if x["id"] == "L5 analogy cos")
    bL5 = r'queen</div><div class="arch-shape">\(\cos = 0.123\)'  # wrong: data/ says 0.861
    sevL5, msgL5 = check_claim(cL5, bL5)
    okL5 = sevL5 == "HARD" and "DRIFT" in msgL5
    print("[selftest:L5]", msgL5)
    # L6 [C]: a deck snippet where the InfoNCE loss drifted must flag DRIFT.
    cL6 = next(x for x in claims() if x["id"] == "L6 InfoNCE loss")
    bL6 = r'$$\mathcal{L}=-\log(0.8877)=\mathbf{0.9999}$$'  # wrong: data/ loss is 0.1191
    sevL6, msgL6 = check_claim(cL6, bL6)
    okL6 = sevL6 == "HARD" and "DRIFT" in msgL6
    print("[selftest:L6]", msgL6)
    # L5/L6 [P]: a shared cosine drifting between l5-embeddings.json and l6-contrastive.json must flag.
    rep4 = []
    savedC = CONTRA["sims"]["positives"]["dog"]
    CONTRA["sims"]["positives"]["dog"] = 0.1234            # break the l5↔l6 shared cat·dog cosine
    provenance_l5l6(rep4)
    CONTRA["sims"]["positives"]["dog"] = savedC
    okP3 = any(s == "HARD" and "provenance-L5L6" in m for s, m in rep4)
    print("[selftest:prov-L5L6]", next((m for s, m in rep4 if s == "HARD"), "provenance-L5L6: NO FLAG"))
    # L5/L6 [P] data-only pin: a silent edit to the (never-displayed) triplet margin must still flag.
    rep5 = []
    savedM = CONTRA["margin"]
    CONTRA["margin"] = 0.5
    provenance_l5l6(rep5)
    CONTRA["margin"] = savedM
    okP4 = any(s == "HARD" and "contra.margin" in m for s, m in rep5)
    print("[selftest:prov-L5L6-pin]", next((m for s, m in rep5 if s == "HARD"), "provenance-L5L6 pin: NO FLAG"))
    # L5 GloVe [C]: a deck snippet where the king·queen log X chip drifted must flag DRIFT.
    cGX = next(x for x in claims() if x["id"] == "L5G logX")
    bGX = r'<span class="gob-clab">log X (target)</span><span class="gob-cval">&minus;0.999</span>'  # data/ −0.406
    sevGX, msgGX = check_claim(cGX, bGX)
    okGX = sevGX == "HARD" and "DRIFT" in msgGX
    print("[selftest:L5G]", msgGX)
    # L5 t-SNE [C]: a deck snippet where the KL number drifted must flag DRIFT.
    cTK = next(x for x in claims() if x["id"] == "L5T KL svg")
    bTK = r'KL(P‖Q) = &#931; p log(p/q) = 0.9999'  # data/ KL is 0.0411
    sevTK, msgTK = check_claim(cTK, bTK)
    okTK = sevTK == "HARD" and "DRIFT" in msgTK
    print("[selftest:L5T-KL]", msgTK)
    # L5 t-SNE [C]: a deck snippet where σ / perplexity drifted must flag DRIFT (anchor is not blind).
    cTS = next(x for x in claims() if x["id"] == "L5T sigma svg")
    bTS = r'<tspan font-weight="700">&#963; = 9.999</tspan>'  # data/ σ is 2.003
    sevTS, msgTS = check_claim(cTS, bTS)
    cTP = next(x for x in claims() if x["id"] == "L5T perp kick")
    bTP = r'anchor <code>cat</code> · perplexity \(=99\)'  # data/ perplexity is 5
    sevTP, msgTP = check_claim(cTP, bTP)
    okTS = sevTS == "HARD" and "DRIFT" in msgTS and sevTP == "HARD" and "DRIFT" in msgTP
    print("[selftest:L5T-σ]", msgTS, "|", msgTP)
    # L5 GloVe/t-SNE [P]: a drifted king·queen log X identity AND a drifted KL field must flag (in-memory).
    rep6 = []
    savedKQ = GLOVE["worked"][0]["logX"]
    GLOVE["worked"][0]["logX"] = 0.9999            # break the king·queen log X = ln(X) structural identity
    provenance_l5_glove_tsne(rep6)
    GLOVE["worked"][0]["logX"] = savedKQ
    okP5 = any(s == "HARD" and "provenance-L5GT(glove.kq.logX)" in m for s, m in rep6)
    print("[selftest:prov-L5GT-glove]", next((m for s, m in rep6 if s == "HARD"), "provenance-L5GT glove: NO FLAG"))
    rep7 = []
    savedKL = TSNE["kl"]
    TSNE["kl"] = 0.9999                            # break the KL field vs recomputed-from-P,Q invariant
    provenance_l5_glove_tsne(rep7)
    TSNE["kl"] = savedKL
    okP6 = any(s == "HARD" and "provenance-L5GT(tsne.kl)" in m for s, m in rep7)
    print("[selftest:prov-L5GT-kl]", next((m for s, m in rep7 if s == "HARD"), "provenance-L5GT kl: NO FLAG"))
    # L5 t-SNE [P] data-only pin: a silent edit to the (never-displayed) entropy=log₂(perplexity) bits must flag.
    rep8 = []
    savedE = TSNE["conditional"]["entropyBits"]
    TSNE["conditional"]["entropyBits"] = 3.5       # break entropy = log₂5 ≈ 2.322 and perplexity = 2^entropy
    provenance_l5_glove_tsne(rep8)
    TSNE["conditional"]["entropyBits"] = savedE
    okP7 = any(s == "HARD" and "provenance-L5GT(tsne." in m for s, m in rep8)
    print("[selftest:prov-L5GT-pin]", next((m for s, m in rep8 if s == "HARD"), "provenance-L5GT pin: NO FLAG"))
    # L2 tokenizer-compare [P]: a drifted token COUNT must flag (count no longer equals len(tokens)).
    rep9 = []
    bpe_rec = next(t for t in TOK["tokenizers"] if t["name"] == "BPE")
    savedN = bpe_rec["count"]
    bpe_rec["count"] = 99                            # break count==len(tokens) AND the canonical 7
    provenance_l2_tokenizers(rep9)
    bpe_rec["count"] = savedN
    okP8 = any(s == "HARD" and "provenance-L2TOK(BPE" in m for s, m in rep9)
    print("[selftest:prov-L2TOK-count]", next((m for s, m in rep9 if s == "HARD"), "provenance-L2TOK count: NO FLAG"))
    # L2 tokenizer-compare [P] data-only pin: a silent edit to the rare word's segmentation must flag.
    rep10 = []
    uni_rec = next(t for t in TOK["tokenizers"] if t["name"] == "Unigram")
    pw = next(p for p in uni_rec["perWord"] if p["word"] == "unhappiness")
    savedSeg = pw["tokens"]
    pw["tokens"] = ["un", "happiness"]               # pretend Unigram split it like BPE — must be caught
    provenance_l2_tokenizers(rep10)
    pw["tokens"] = savedSeg
    okP9 = any(s == "HARD" and "provenance-L2TOK(Unigram/unhappiness)" in m for s, m in rep10)
    print("[selftest:prov-L2TOK-seg]", next((m for s, m in rep10 if s == "HARD"), "provenance-L2TOK seg: NO FLAG"))
    # ── ENRICHMENT fixtures: the four new trajectory anchors must be drift-catchers, not blind. ──
    # L5 [C]: a drifted word2vec/SGNS training loss endpoint must flag DRIFT (anchor is not blind).
    cW = next(x for x in claims() if x["id"] == "L5W loss before")
    bW = r"loss 9.99 &rarr; 2.63"  # data/ word2vec loss before is 4.85
    sevW, msgW = check_claim(cW, bW)
    okW = sevW == "HARD" and "DRIFT" in msgW
    print("[selftest:L5W]", msgW)
    # L5 [C]: a drifted UMAP min_dist dial must flag DRIFT.
    cU = next(x for x in claims() if x["id"] == "L5U min_dist")
    bU = r"n_neighbors=10 · min_dist=0.99 · 500 epochs"  # data/ min_dist is 0.1
    sevU, msgU = check_claim(cU, bU)
    okU = sevU == "HARD" and "DRIFT" in msgU
    print("[selftest:L5U]", msgU)
    # L6 [C]: a drifted slide-41 DistilBERT cross-sense cosine must flag DRIFT.
    cS = next(x for x in claims() if x["id"] == "L6 stack cos final")
    bS = r"final: cos = 0.999  &mdash; one word, two vectors"  # data/ final cross-sense is 0.6465
    sevS, msgS = check_claim(cS, bS)
    okS = sevS == "HARD" and "DRIFT" in msgS
    print("[selftest:L6stack]", msgS)
    # L6 [C]: a drifted slide-47 InfoNCE loss-trajectory endpoint must flag DRIFT.
    cT47 = next(x for x in claims() if x["id"] == "L6 traj loss start")
    bT47 = r"the negative, loss is high: \(\mathcal{L}=9.99\)"  # data/ untuned trajectory loss is 3.31
    sevT47, msgT47 = check_claim(cT47, bT47)
    okT47 = sevT47 == "HARD" and "DRIFT" in msgT47
    print("[selftest:L6traj]", msgT47)
    # ENR [P]: a drifted GloVe-animation endpoint (vs the canonical static loss after) must flag (in-memory).
    rep11 = []
    savedTrj = GLOVE["trajectory"]["frames"][-1]["loss"]
    GLOVE["trajectory"]["frames"][-1]["loss"] = 9.99   # break traj-last == canonical loss after (0.005)
    provenance_enrichment(rep11)
    GLOVE["trajectory"]["frames"][-1]["loss"] = savedTrj
    okPE = any(s == "HARD" and "provenance-ENR(glove.traj.lossAfter)" in m for s, m in rep11)
    print("[selftest:prov-ENR]", next((m for s, m in rep11 if s == "HARD"), "provenance-ENR: NO FLAG"))
    # ENR [P]: a drifted l6-contextual cross-sense (vs the DistilBERT stack final 0.6465) must flag (in-memory).
    rep12 = []
    savedCX = CTX["cosines"]["crossSense"]
    CTX["cosines"]["crossSense"] = 0.999            # break ctx.crossSense == stack.final (0.6465)
    provenance_enrichment(rep12)
    CTX["cosines"]["crossSense"] = savedCX
    okCX = any(s == "HARD" and "provenance-ENR(ctx." in m for s, m in rep12)
    print("[selftest:prov-ENR-ctx]", next((m for s, m in rep12 if s == "HARD"), "provenance-ENR ctx: NO FLAG"))
    # Book [C]: a Book chapter where a flagship PROSE number drifted must flag DRIFT (anchor not blind).
    cBK = next(x for x in book_claims() if x["id"] == "book L5 PCA 2-D")
    bBK = r'these two axes keep 99.9% of the original variance'  # wrong: data/ says 37.7
    sevBK, msgBK = check_claim(cBK, bBK)
    okBK = sevBK == "HARD" and "DRIFT" in msgBK
    print("[selftest:book]", msgBK)
    # Book [C]: a drifted ch.6 within-sense cosine (sourced from data/l6-contextual.json) must flag DRIFT.
    cBW = next(x for x in book_claims() if x["id"] == "book L6 within-sense")
    bBW = r'to cash a cheque") sit at \(0.999\), nearly on top of each other'  # data/ within-sense is 0.9466
    sevBW, msgBW = check_claim(cBW, bBW)
    okBW = sevBW == "HARD" and "DRIFT" in msgBW
    print("[selftest:book-ctx]", msgBW)
    # [P] L6 InfoNCE bars: BOTH halves must be drift-catchers, not blind.
    #   (a) a drifted checkpoint logit breaks softmax(logits)[kitten] == pPositive (data self-consistency).
    repNCEa = []
    saved = CTRAJ["checkpoints"][0]["logits"][1]
    CTRAJ["checkpoints"][0]["logits"][1] = 0.0      # airplane logit drift → softmax(kitten) no longer == pPositive
    provenance_l6_nce(repNCEa, "")
    CTRAJ["checkpoints"][0]["logits"][1] = saved
    okNCEa = any(s == "HARD" and "provenance-L6NCE" in m for s, m in repNCEa)
    print("[selftest:prov-L6NCE-data]", next((m for s, m in repNCEa if s == "HARD"), "provenance-L6NCE data: NO FLAG"))
    #   (b) a tampered bar <rect height> (unmutated data) breaks the deck binding (height != softmax·H).
    realH = lambda i, p: f'{p*220:.1f}'
    p0 = _nce_softmax(CTRAJ["checkpoints"][0]["logits"]); p1 = _nce_softmax(CTRAJ["checkpoints"][1]["logits"]); p2 = _nce_softmax(CTRAJ["checkpoints"][2]["logits"])
    fixBars = ('<section class="slide nce-slide"><svg>'
        + f'<rect x="925" height="999"/><rect x="925" height="{realH(0,p1[0])}"/><rect x="925" height="{realH(0,p2[0])}"/>'   # untuned kitten TAMPERED → must fire
        + f'<rect x="1075" height="{realH(1,p0[1])}"/><rect x="1075" height="{realH(1,p1[1])}"/><rect x="1075" height="{realH(1,p2[1])}"/>'
        + f'<rect x="1225" height="{realH(2,p0[2])}"/><rect x="1225" height="{realH(2,p1[2])}"/><rect x="1225" height="{realH(2,p2[2])}"/>'
        + f'<rect x="1375" height="{realH(3,p0[3])}"/><rect x="1375" height="{realH(3,p1[3])}"/><rect x="1375" height="{realH(3,p2[3])}"/>'
        + '</svg></section>')
    repNCEb = []
    provenance_l6_nce(repNCEb, fixBars)
    okNCEb = any(s == "HARD" and "bar.kitten" in m for s, m in repNCEb)
    print("[selftest:prov-L6NCE-bar]", next((m for s, m in repNCEb if s == "HARD"), "provenance-L6NCE bar: NO FLAG"))
    okNCE = okNCEa and okNCEb
    # [G] coverage-guard: a NEW un-gated grounded number on a surface (here a new unit "L9", baseline 0)
    # must HARD-fail — proving the ratchet is not blind (a forgotten data-number in L7 can't ship silently).
    repCov = []
    coverage_guard(repCov, {"L9": "<p>the model scores 0.7137 on this set</p>"}, {})
    okCov = any(s == "HARD" and "coverage-guard(deck:L9)" in m for s, m in repCov)
    print("[selftest:coverage]", next((m for s, m in repCov if s == "HARD"), "coverage-guard: NO FLAG"))
    # L7 [C] Book: a drifted reranked nDCG must flag DRIFT (the L7 anchors are not blind).
    cL7 = next(c for c in book_claims() if c["id"] == "book L7 rerankNdcg")
    sevL7, msgL7 = check_claim(cL7, r"improves to <strong>nDCG@10 = 0.1234</strong>")
    okL7c = sevL7 == "HARD" and "DRIFT" in msgL7
    print("[selftest:L7-book]", msgL7)
    # L7 [P]: break the BAM invariant (real Judge no longer separates pairRel>pairBad) → must flag.
    repL7 = []
    savedL7 = CROSSENC["real"]["pairBad"]["score"]
    CROSSENC["real"]["pairBad"]["score"] = 0.9999
    provenance_l7(repL7)
    CROSSENC["real"]["pairBad"]["score"] = savedL7
    okL7p = any(s == "HARD" and "provenance-L7" in m for s, m in repL7)
    print("[selftest:prov-L7]", next((m for s, m in repL7 if s == "HARD"), "provenance-L7: NO FLAG"))
    # L8 [P]: break each of the four cross-pillar BAMs (must flag) — the L8 pins are not blind.
    #   (a) ColBERT: the lexical-trap doc must NOT outscore the relevant doc (maxSimRel>maxSimIrr).
    rep8a = []; sv = COLBERT8["toy"]["docIrr"]["maxSim"]; COLBERT8["toy"]["docIrr"]["maxSim"] = 9.99
    provenance_l8(rep8a); COLBERT8["toy"]["docIrr"]["maxSim"] = sv
    okL8a = any(s == "HARD" and "provenance-L8(colbert" in m for s, m in rep8a)
    print("[selftest:prov-L8-colbert]", next((m for s, m in rep8a if s == "HARD"), "provenance-L8 colbert: NO FLAG"))
    #   (b) SPLADE: a drifted dot must break the round-then-sum reconciliation (dot==Σprod).
    rep8b = []; sv = SPLADE8["toy"]["dot"]; SPLADE8["toy"]["dot"] = 9.999
    provenance_l8(rep8b); SPLADE8["toy"]["dot"] = sv
    okL8b = any(s == "HARD" and "splade.dot" in m for s, m in rep8b)
    print("[selftest:prov-L8-splade]", next((m for s, m in rep8b if s == "HARD"), "provenance-L8 splade: NO FLAG"))
    #   (c) Hybrid: a fused list not sorted by score desc must flag.
    rep8c = []; sv = HYBRID8["fused"][0]["score"]; HYBRID8["fused"][0]["score"] = 0.0001
    provenance_l8(rep8c); HYBRID8["fused"][0]["score"] = sv
    okL8c = any(s == "HARD" and "provenance-L8(hybrid" in m for s, m in rep8c)
    print("[selftest:prov-L8-hybrid]", next((m for s, m in rep8c if s == "HARD"), "provenance-L8 hybrid: NO FLAG"))
    #   (d) LTR: λ ≠ gradient·ΔnDCG must flag.
    rep8d = []; sv = LTR8["toy"]["lambda"]; LTR8["toy"]["lambda"] = 0.9999
    provenance_l8(rep8d); LTR8["toy"]["lambda"] = sv
    okL8d = any(s == "HARD" and "ltr.lambda" in m for s, m in rep8d)
    print("[selftest:prov-L8-ltr]", next((m for s, m in rep8d if s == "HARD"), "provenance-L8 ltr: NO FLAG"))
    okL8 = okL8a and okL8b and okL8c and okL8d
    # L9 [P]: break two cross-pillar BAMs (must flag) — the L9 pins are not blind.
    #   (a) HNSW: greedy must reach the brute-force NN (recall 1.0); a drifted recall must flag.
    repL9a = []; sv = HNSW9["toy"]["greedy"]["recall"]; HNSW9["toy"]["greedy"]["recall"] = 0.0
    provenance_l9(repL9a); HNSW9["toy"]["greedy"]["recall"] = sv
    okL9a = any(s == "HARD" and "provenance-L9(hnsw recall" in m for s, m in repL9a)
    print("[selftest:prov-L9-hnsw]", next((m for s, m in repL9a if s == "HARD"), "provenance-L9 hnsw: NO FLAG"))
    #   (b) IVF: recall must CLIMB nprobe 1→2 (0.6667→1.0); a non-climbing recall must flag (the nprobe lesson).
    repL9b = []; sv = IVF9["toy"]["probe"]["1"]["recall"]; IVF9["toy"]["probe"]["1"]["recall"] = 1.0
    provenance_l9(repL9b); IVF9["toy"]["probe"]["1"]["recall"] = sv
    okL9b = any(s == "HARD" and "provenance-L9(ivf" in m for s, m in repL9b)
    print("[selftest:prov-L9-ivf]", next((m for s, m in repL9b if s == "HARD"), "provenance-L9 ivf: NO FLAG"))
    okL9 = okL9a and okL9b
    # L10 [P]: break two cross-pillar BAMs (must flag).
    #   (a) chunking: overlap must rescue the boundary-straddle (recall 0→1.0); breaking the rescue must flag.
    repL10a = []; sv = CHUNK10["scenarios"][1]["recallAt3"]; CHUNK10["scenarios"][1]["recallAt3"] = 0
    provenance_l10(repL10a); CHUNK10["scenarios"][1]["recallAt3"] = sv
    okL10a = any(s == "HARD" and "provenance-L10(chunk" in m for s, m in repL10a)
    print("[selftest:prov-L10-chunk]", next((m for s, m in repL10a if s == "HARD"), "provenance-L10 chunk: NO FLAG"))
    #   (b) rewrite: HyDE must lift the true doc's rank (8→2); no lift must flag.
    repL10b = []; sv = REWRITE10["hyde"]["trueRank"]; REWRITE10["hyde"]["trueRank"] = 9
    provenance_l10(repL10b); REWRITE10["hyde"]["trueRank"] = sv
    okL10b = any(s == "HARD" and "provenance-L10(rewrite" in m for s, m in repL10b)
    print("[selftest:prov-L10-rewrite]", next((m for s, m in repL10b if s == "HARD"), "provenance-L10 rewrite: NO FLAG"))
    okL10 = okL10a and okL10b

    # ── A+ EXPANSION fixtures: every NEW L9/L10 [C] anchor + provenance block must be a drift-catcher. ──
    # New L9 [C]: the by-hand metric cosine (deck), the PQ codebook inertia (deck), and a NEW book number
    # (the √7 L2) must all flag DRIFT — proving the new metrics/PQ/HNSW-toy2 anchors are not blind.
    cM = next(x for x in claims() if x["id"] == "L9 deck m cosine")
    sevM, msgM = check_claim(cM, r"cosine \(=0.999\) — the unit-vector")  # data/ cosine is 0.5443
    okM = sevM == "HARD" and "DRIFT" in msgM
    print("[selftest:L9-metrics]", msgM)
    cI = next(x for x in claims() if x["id"] == "L9 deck pq inertia2")
    sevI, msgI = check_claim(cI, r"8.3333):\quad \text{inertia}=\mathbf{9.9999}")  # data/ final inertia is 2.6667
    okI = sevI == "HARD" and "DRIFT" in msgI
    print("[selftest:L9-codebook]", msgI)
    cH = next(x for x in book_claims() if x["id"] == "book L9 hnsw2 nn")
    sevH, msgH = check_claim(cH, r"true nearest neighbour is \(b_9\) at distance \(9.9999\)")  # data/ b9 NN is 1.4142
    okH = sevH == "HARD" and "DRIFT" in msgH
    print("[selftest:L9-hnsw2]", msgH)
    # New L9 [C]: the curse-of-dimensionality cv (deck) must flag DRIFT (the highd anchor is not blind).
    cV = next(x for x in claims() if x["id"] == "L9 deck hd cv1k")
    sevV, msgV = check_claim(cV, r"\tfrac{0.2410}{12.9023}=\mathbf{0.9999}")  # data/ cv@d=1000 is 0.0187
    okV = sevV == "HARD" and "DRIFT" in msgV
    print("[selftest:L9-highd]", msgV)
    # New L9 [P]: break three new provenance BAMs (must flag) — metrics 3-way disagreement, PQ ADC sum,
    # codebook inertia monotonicity, highd cv collapse, and the HNSW toy2 layered-vs-base recall.
    repL9c = []; sv = METRICS9["ranking"]["candidates"]["d2"]["cosine"]; METRICS9["ranking"]["candidates"]["d2"]["cosine"] = 0.0
    provenance_l9(repL9c); METRICS9["ranking"]["candidates"]["d2"]["cosine"] = sv
    okL9c = any(s == "HARD" and "provenance-L9(metrics" in m for s, m in repL9c)
    print("[selftest:prov-L9-metrics]", next((m for s, m in repL9c if s == "HARD"), "provenance-L9 metrics: NO FLAG"))
    repL9d = []; sv = PQ9["adcWorked"]["adcDistance"]; PQ9["adcWorked"]["adcDistance"] = 999  # break Σ adcTable lookups
    provenance_l9(repL9d); PQ9["adcWorked"]["adcDistance"] = sv
    okL9d = any(s == "HARD" and "provenance-L9(pq.adcDistance" in m for s, m in repL9d)
    print("[selftest:prov-L9-adc]", next((m for s, m in repL9d if s == "HARD"), "provenance-L9 adc: NO FLAG"))
    repL9e = []; sv = PQ9["codebookTrain"]["final"]["inertia"]; PQ9["codebookTrain"]["final"]["inertia"] = 999.0  # not monotone
    PQ9["codebookTrain"]["inertiaSequence"][-1] = 999.0
    provenance_l9(repL9e); PQ9["codebookTrain"]["final"]["inertia"] = sv; PQ9["codebookTrain"]["inertiaSequence"][-1] = sv
    okL9e = any(s == "HARD" and "provenance-L9(pq.codebook" in m for s, m in repL9e)
    print("[selftest:prov-L9-codebook]", next((m for s, m in repL9e if s == "HARD"), "provenance-L9 codebook: NO FLAG"))
    repL9f = []; sv = HIGHD["dims"][2]["cv"]; HIGHD["dims"][2]["cv"] = 9.99  # break the monotone cv collapse
    provenance_l9(repL9f); HIGHD["dims"][2]["cv"] = sv
    okL9f = any(s == "HARD" and "provenance-L9(highd" in m for s, m in repL9f)
    print("[selftest:prov-L9-highd]", next((m for s, m in repL9f if s == "HARD"), "provenance-L9 highd: NO FLAG"))
    repL9g = []; sv = HNSW9["toy2"]["greedy"]["recall"]; HNSW9["toy2"]["greedy"]["recall"] = 0.0  # layered must reach NN
    provenance_l9(repL9g); HNSW9["toy2"]["greedy"]["recall"] = sv
    okL9g = any(s == "HARD" and "provenance-L9(hnsw2" in m for s, m in repL9g)
    print("[selftest:prov-L9-hnsw2]", next((m for s, m in repL9g if s == "HARD"), "provenance-L9 hnsw2: NO FLAG"))
    repL9h = []; sv = IVF9["toy2"]["sweep"][0]["recall"]; IVF9["toy2"]["sweep"][0]["recall"] = 1.0  # break the climb
    provenance_l9(repL9h); IVF9["toy2"]["sweep"][0]["recall"] = sv
    okL9h = any(s == "HARD" and "provenance-L9(ivf2" in m for s, m in repL9h)
    print("[selftest:prov-L9-ivf2]", next((m for s, m in repL9h if s == "HARD"), "provenance-L9 ivf2: NO FLAG"))
    okL9X = okM and okI and okH and okV and okL9c and okL9d and okL9e and okL9f and okL9g and okL9h

    # New L10 [C]: the retrieval-math cos4 (deck), the RRF fusion score (book), and the routing cosine
    # (deck notes) must all flag DRIFT — proving the new budget/cos4/RRF/rerank/routing anchors are not blind.
    cC4 = next(x for x in claims() if x["id"] == "L10 deck cos cardiac")
    sevC4, msgC4 = check_claim(cC4, r"\frac{10}{\lVert\rVert} = \mathbf{0.9999}")  # data/ cos4 is 0.8165
    okC4 = sevC4 == "HARD" and "DRIFT" in msgC4
    print("[selftest:L10-cos4]", msgC4)
    cRF = next(x for x in book_claims() if x["id"] == "book L10 rrf consensus")
    sevRF, msgRF = check_claim(cRF, r"\frac{1}{62} + \frac{1}{61} = \mathbf{0.9999}")  # data/ RRF is 0.0325
    okRF = sevRF == "HARD" and "DRIFT" in msgRF
    print("[selftest:L10-rrf]", msgRF)
    cRt = next(x for x in claims() if x["id"] == "L10 deck route howTo")
    sevRt, msgRt = check_claim(cRt, r"cos 0.8058 / 0.1234 / 0.6447 &rarr; route")  # data/ howTo cos is 0.967
    okRt = sevRt == "HARD" and "DRIFT" in msgRt
    print("[selftest:L10-routing]", msgRt)
    cBd = next(x for x in claims() if x["id"] == "L10 deck budget 128k")
    sevBd, msgBd = check_claim(cBd, r'<tr><td>128000</td><td class="cell-good">999</td>')  # data/ kMax is 497
    okBd = sevBd == "HARD" and "DRIFT" in msgBd
    print("[selftest:L10-budget]", msgBd)
    # New L10 [P]: break four new provenance BAMs (must flag) — RRF consensus>sparse, rerank lift,
    # routing argmax, RAPTOR fan-in.
    repL10c = []; sv = FUSION10["scores"][0]["rrf"]; FUSION10["scores"][0]["rrf"] = 0.0  # consensus no longer top
    provenance_l10(repL10c); FUSION10["scores"][0]["rrf"] = sv
    okL10c = any(s == "HARD" and "provenance-L10(fusion" in m for s, m in repL10c)
    print("[selftest:prov-L10-fusion]", next((m for s, m in repL10c if s == "HARD"), "provenance-L10 fusion: NO FLAG"))
    repL10d = []; sv = RERANK10["ndcgAfter"]; RERANK10["ndcgAfter"] = 0.1  # rerank must lift nDCG
    provenance_l10(repL10d); RERANK10["ndcgAfter"] = sv
    okL10d = any(s == "HARD" and "provenance-L10(rerank" in m for s, m in repL10d)
    print("[selftest:prov-L10-rerank]", next((m for s, m in repL10d if s == "HARD"), "provenance-L10 rerank: NO FLAG"))
    repL10e = []; sv = ROUTING10["route"]; ROUTING10["route"] = "factQA"  # not argmax
    provenance_l10(repL10e); ROUTING10["route"] = sv
    okL10e = any(s == "HARD" and "provenance-L10(routing" in m for s, m in repL10e)
    print("[selftest:prov-L10-routing]", next((m for s, m in repL10e if s == "HARD"), "provenance-L10 routing: NO FLAG"))
    repL10f = []; sv = RAPTOR10["tree"]["levels"][1]["n"]; RAPTOR10["tree"]["levels"][1]["n"] = 99  # break fan-in
    provenance_l10(repL10f); RAPTOR10["tree"]["levels"][1]["n"] = sv
    okL10f = any(s == "HARD" and "provenance-L10(raptor" in m for s, m in repL10f)
    print("[selftest:prov-L10-raptor]", next((m for s, m in repL10f if s == "HARD"), "provenance-L10 raptor: NO FLAG"))
    okL10X = okC4 and okRF and okRt and okBd and okL10c and okL10d and okL10e and okL10f

    # New L11/L12 [C]: the RAGAS answer-relevance trace (deck), a Book RAGAS number, and a CLIP cosine-matrix
    # cell (deck) must all flag DRIFT — proving the new L11/L12 anchors are not blind.
    cAR = next(x for x in claims() if x["id"] == "L11 deck ans rel")
    sevAR, msgAR = check_claim(cAR, r"\frac{2.11}{3} = \mathbf{0.9999}")  # data/ answerRelevance is 0.7033
    okAR = sevAR == "HARD" and "DRIFT" in msgAR
    print("[selftest:L11-ragas]", msgAR)
    cBR = next(x for x in book_claims() if x["id"] == "book L11 honest A")
    sevBR, msgBR = check_claim(cBR, r"A = \operatorname{mean}[5, 5, 3] = \mathbf{9.9999}")  # data/ honest A is 4.3333
    okBR = sevBR == "HARD" and "DRIFT" in msgBR
    print("[selftest:L11-judge]", msgBR)
    cCM = next(x for x in claims() if x["id"] == "L12 deck m11")
    sevCM, msgCM = check_claim(cCM, r"0.6609 & \mathbf{0.9999} & 0.2877")  # data/ matrix[1][1] is 0.991
    okCM = sevCM == "HARD" and "DRIFT" in msgCM
    print("[selftest:L12-clip]", msgCM)
    okL11L12X = okAR and okBR and okCM

    # New L11 [P]: RAGAS faithfulness<1, the Goodhart winner-flip, the measured verbosity bias.
    repL11a = []; sv = RAGAS11["faithfulness"]; RAGAS11["faithfulness"] = 1.0  # no hallucination → must flag (<1)
    provenance_l11(repL11a); RAGAS11["faithfulness"] = sv
    okL11a = any(s == "HARD" and "provenance-L11(ragas" in m for s, m in repL11a)
    print("[selftest:prov-L11-ragas]", next((m for s, m in repL11a if s == "HARD"), "provenance-L11 ragas: NO FLAG"))
    repL11b = []; sv = JUDGE11["goodhart"]["lengthBiased"]["winner"]; JUDGE11["goodhart"]["lengthBiased"]["winner"] = "A"  # no flip
    provenance_l11(repL11b); JUDGE11["goodhart"]["lengthBiased"]["winner"] = sv
    okL11b = any(s == "HARD" and "provenance-L11(goodhart" in m for s, m in repL11b)
    print("[selftest:prov-L11-goodhart]", next((m for s, m in repL11b if s == "HARD"), "provenance-L11 goodhart: NO FLAG"))
    repL11c = []; sv = JUDGE11["real"]["verbosityPreferenceRate"]; JUDGE11["real"]["verbosityPreferenceRate"] = 0.0  # below 0.5 & ≠ artifact
    provenance_l11(repL11c); JUDGE11["real"]["verbosityPreferenceRate"] = sv
    okL11c = any(s == "HARD" and "verbosity" in m.lower() for s, m in repL11c)
    print("[selftest:prov-L11-verbosity]", next((m for s, m in repL11c if s == "HARD"), "provenance-L11 verbosity: NO FLAG"))
    okL11 = okL11a and okL11b and okL11c

    # New L12 [P]: GraphRAG multi-hop reach, CLIP diagonal-wins, the hallucination/grounding demo.
    repL12a = []; sv = GRAPHRAG12["recallMultiHop"]; GRAPHRAG12["recallMultiHop"] = 0  # traversal must reach the answer
    provenance_l12(repL12a); GRAPHRAG12["recallMultiHop"] = sv
    okL12a = any(s == "HARD" and "provenance-L12(graphrag" in m for s, m in repL12a)
    print("[selftest:prov-L12-graphrag]", next((m for s, m in repL12a if s == "HARD"), "provenance-L12 graphrag: NO FLAG"))
    repL12b = []; sv = CLIP12["cosineMatrix"][0][0]; CLIP12["cosineMatrix"][0][0] = 0.0  # break the matching diagonal
    provenance_l12(repL12b); CLIP12["cosineMatrix"][0][0] = sv
    okL12b = any(s == "HARD" and "provenance-L12(clip" in m for s, m in repL12b)
    print("[selftest:prov-L12-clip]", next((m for s, m in repL12b if s == "HARD"), "provenance-L12 clip: NO FLAG"))
    repL12c = []; sv = ETHICS12["real"]["closedBookAbstained"]; ETHICS12["real"]["closedBookAbstained"] = True  # would mean no hallucination
    provenance_l12(repL12c); ETHICS12["real"]["closedBookAbstained"] = sv
    okL12c = any(s == "HARD" and "provenance-L12(ethics" in m for s, m in repL12c)
    print("[selftest:prov-L12-ethics]", next((m for s, m in repL12c if s == "HARD"), "provenance-L12 ethics: NO FLAG"))
    okL12 = okL12a and okL12b and okL12c

    # New L14 [P]: query-rewrite recompute — a wrong RRF sum must flag (deep-dive #2).
    repL14 = []; sv = REWRITE14["multiQueryRRF"]["rrfGold"]; REWRITE14["multiQueryRRF"]["rrfGold"] = 0.9999
    provenance_l14(repL14); REWRITE14["multiQueryRRF"]["rrfGold"] = sv
    okL14 = any(s == "HARD" and "provenance-L14(rrf.gold" in m for s, m in repL14)
    print("[selftest:prov-L14-rrf]", next((m for s, m in repL14 if s == "HARD"), "provenance-L14 rrf: NO FLAG"))

    ok = (okD and okA and okP and okL3 and okL4 and okP2 and okL5 and okL6 and okP3 and okP4
          and okGX and okTK and okTS and okP5 and okP6 and okP7 and okP8 and okP9
          and okW and okU and okS and okT47 and okPE and okCX and okBK and okBW and okNCE and okCov
          and okL7c and okL7p and okL8 and okL9 and okL10 and okL9X and okL10X and okL11L12X and okL11 and okL12 and okL14)
    print("[selftest]", "PASS — claim-drift + bad-arithmetic + provenance-drift + L3/L4 + L5/L6 + L5-GloVe/t-SNE + L2-tokenizers + enrichment-trajectory + l6-contextual cross-file + L6-InfoNCE-bars (data + deck) + Book-prose deck & cross-file + coverage-guard ratchet (incl. data-only pins) + L7 BAM + L8 four cross-pillar BAMs + L9 (HNSW/IVF + metrics/ADC/codebook/highd/HNSW-toy2/IVF-toy2) + L10 (chunk/rewrite + budget/cos4/RRF/rerank/routing/RAPTOR) + L11 (RAGAS/Goodhart-flip/verbosity) + L12 (GraphRAG/CLIP/hallucination) BAMs all fire"
          if ok else "FAIL — a check is blind!")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv else main())
