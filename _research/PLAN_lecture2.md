# EXPANSION PLAN — Lecture 2: NLP · Tokenization · Measures of Similarity
Target: **~68 slides** (from 27). Fill a ~75-min graduate pair with depth, corner cases, worked examples, many visuals. Source: `_research/brief_nlp_tokenization.md`, `_research/brief_similarity.md`, `_research/old_lecture2_extract.md` (PART A Tokenization), `_research/old_lecture1_extract.md` (PART C Measures of Similarity — port worked examples).

Conventions: ENGLISH ONLY (no lang spans); KaTeX for EVERY sub/superscript, all math (`a_i`, `\lVert a\rVert`, `\cos\theta`, `10^6`, `r^{-1}`, etc.). Keep existing head + bottom <script> + both <template> (logo DLS / INNOPOLIS UNIVERSITY). `.slides` data-course-* = "Deep Learning for Search · Summer 2026". Title eyebrow "Lecture 02 · Week 1 / Pair 2", Albert Nasybullin, 03.06.2026, Innopolis University. Final QR data-qr="https://levshaazz.github.io/deep-learning-for-search-summer-2026/". Email a.nasibullin@innopolis.university. Sequential data-screen-label. Agenda anchors → divider indices (fix last). Stepped slides need data-max-step + data-current-step="0" + .step-controls. Speaker notes everywhere; IMAGE PROMPT (Wait-But-Why doodle) on visual/hook slides. ALL arithmetic must be correct & self-consistent.

Light sci-fi through-line: FIRST CONTACT (Project Hail Mary, Rocky) — to make a machine "understand" language you must (1) turn messy text into computable units (tokenization) and (2) measure how CLOSE two meanings are (similarity). Pattern: Problem → what solves it → detailed solution.

## SLIDE LIST
0-open: 1 title. 2 agenda (4 parts). 3 objectives (6). 4 quote/arch — where we are: NLP turns text→numbers; today two "How?"s: tokenization & similarity.

Part 01 — Why text is hard (NLP intro):
5 divider "Part 01 · Teaching a machine to read".
6 quote hook — first contact / language barrier (Rocky). IMAGE PROMPT.
7 definition — NLP.
8 viz — discreteness: pixels interpolate, "average of cat & dog isn't a word"; no inherent metric → must LEARN embeddings. IMAGE PROMPT.
9 two-col — ambiguity: lexical (bank/bat), syntactic ("man with telescope"), semantic/scope, referential (Winograd trophy/suitcase).
10 viz — Zipf's law: freq ∝ r^{-1}; few words dominate; hapax legomena ~40–60% of types appear once. IMAGE PROMPT.
11 definition/viz — Heaps' law: vocab V ∝ N^β never saturates → "a fixed word vocabulary can NEVER cover real text" (motivates subwords).
12 two-col — morphology (Turkish evlerinizden = ev+ler+iniz+den) + multilinguality (~7000 langs, RTL) + no word boundaries (Chinese 今天我很高兴 no spaces; Thai; Japanese).
13 arch — text→model pipeline: raw → normalize → tokenize → token IDs → embeddings → model (rasbt-style); star tokenization & the similarity that vectors enable.
14 two-col — normalization: Unicode NFC/NFD/NFKC/NFKD (é two ways → byte-different → fail match); casing/accents; OVER-normalization pitfall (U.S. vs us; chemistry superscripts).
15 quiz — why is text harder for ML than images? (discreteness/variable-length/Zipf).

Part 02 — Tokenization:
16 divider "Part 02 · Breaking the code: Tokenization".
17 definition — token / tokenization.
18 viz — token-ID concept "students opened their books" → 11 | 298 | 34 | 567 (port).
19 viz/table — tradeoff triangle char/word/subword (vocab vs seq-len vs OOV) + real numbers (GPT-2 50,257; cl100k ~100k; o200k ~200k; BERT 30,522; LLaMA 32k; ~4 chars/token).
20 walkthrough — granularity on one sentence (char vs word vs subword), chips show vocab/seq-len/OOV (keep/deepen).
21 viz — word-level pain (open/opened/opens/opening = separate embeddings) + OOV/UNK Welsh "Hen Gapel Lligwy" → <unk> (port).
22 definition — BPE (Gage 1994 compression → Sennrich 2016 NMT).
23 e2e/walkthrough — BPE toy `aaabdaaabac` → Z=aa → `ZabdZabac` → Y=ab → `ZYdZYac` → X=ZY → `XdXac` (11→5 chars) (port).
24 e2e/walkthrough — BPE real corpus {low:5,lower:2,newest:6,widest:3}+</w>: merge e+s(9)→es, es+t(9)→est, est+</w>(9)→est</w>, l+o(7)→lo, lo+w(7)→low; "lowest" (unseen) → low+est</w> GENERALIZES. (deepen existing BPE slide; numbers must be exact)
25 two-col — byte-level BPE (GPT-2, 256 bytes) → UNK impossible; ~138K unicode symbols; leading-space token " the".
26 misconception/viz — BPE non-uniqueness: "linear"=li+near OR li+n+ea+r (port).
27 definition — WordPiece (Schuster&Nakajima 2012; BERT; ## continuation marker).
28 formula — WordPiece score = freq(AB)/(freq(A)·freq(B)) (likelihood vs raw frequency; prefers more-than-chance pairs).
29 e2e — WordPiece worked on "the quick brown fox…": scores (q,##u)=29 → qu; (qu,##i)=30 → qui; (qui,##c)=31 → quic → quick; greedy longest match left→right (port).
30 viz — WordPiece OOV: "The fastest brown hare leaps over the sleepy cat" → ['the','[UNK]','brown','[UNK]','ju','##mp','##s','over','the','[UNK]','[UNK]'] (port).
31 two-col — Unigram LM / SentencePiece (Kudo 2018): prune a big vocab by likelihood loss (top-down probabilistic); ▁ whitespace; language-agnostic/reversible; used by T5/LLaMA/Mistral.
32 table — BPE vs WordPiece vs Unigram (direction, merge/prune criterion, marker `##`/`▁`, used-by). One-liner: freq vs likelihood-gain vs likelihood-loss.
33 two-col — special tokens [CLS][SEP][PAD][MASK][UNK], BOS/EOS, chat templates (<|im_start|> etc.); duplicate-BOS pitfall; [SEP] for query|doc in BERT reranking → search link.
34 code — HuggingFace tokenizer (AutoTokenizer.from_pretrained, .tokenize/.encode; ['un','##hap','##pi','##ness']; ## = WordPiece continuation) (keep/deepen).

Part 03 — Where tokenizers break:
35 divider "Part 03 · Where tokenizers break (corner cases)".
36 viz — digits/arithmetic: "327"=3+27? frequency artifact; LLaMA/PaLM force single-digit; R2L grouping improves addition; multiplication ≈0 by ~6+ digits. IMAGE PROMPT.
37 two-col — code & whitespace: Python indentation semantic; GPT-3.5/4 space-run tokens (why GPT-4 better at code); YAML < JSON tokens.
38 viz — emoji/Unicode multi-byte (ZWJ 👨‍👩‍👧); CJK 2–3 tokens/char.
39 two-col — German compounds "Donaudampfschifffahrtsgesellschaftskapitän" → Donau ##dampf … (port); Arabic non-concatenative root k-t-b → kataba/kattaba/iktataba.
40 viz — the multilingual "token tax" / fertility: bar chart English≈1.0 vs Hindi/Telugu/Turkish 2–4×; 2× fertility → ~4× train cost, ~2× API price/latency, smaller context; fairness. IMAGE PROMPT.
41 misconception/viz — glitch tokens "SolidGoldMagikarp" (rare-in-training → untrained embedding → bizarre output); lesson: vocab & training data must share distribution. IMAGE PROMPT.
42 two-col — trailing-space sensitivity (" the"≠"the") + "how many R's in strawberry / reverse this string" (models see tokens not letters).
43 two-col — why tokenization matters for SEARCH: query/doc mismatch ("ensembling"≠"ensemble" in BM25); BM25 needs per-language tokenization/stemming; cross-lingual unit mismatch (euthanasia one BM25 term vs XLM-R subwords); multilingual recall/truncation.
44 quiz — tokenization corner-case quiz.
45 code/viz — tools & live demos (tiktoken, Tiktokenizer, OpenAI playground, Karpathy minBPE); demo ideas (327; English vs Hindi; SolidGoldMagikarp; trailing space; JSON vs YAML).
46 quote — "a large enough corpus handles these problems (almost) itself" (port punchline) + token-free models (ByT5) as the frontier.

Part 04 — Measures of Similarity:
47 divider "Part 04 · How close are two meanings?".
48 quote hook — ranking needs a ruler for meaning; "if query & doc are vectors, relevant = close". IMAGE PROMPT.
49 definition — vector representation / embedding (brief; how to LEARN them = next weeks; today: how to COMPARE them).
50 viz — similarity DECISION TREE (data type → measure: non-numerical→cosine; continuous scaled?→Euclidean/Manhattan; categorical→Jaccard; ordinal→Spearman; multivariate→Pearson) (port old L1 s45).
51 formula — cosine similarity big KaTeX cos θ = a·b/(‖a‖‖b‖) + var glossary + 3-angle panel (θ≈0 sim / 90 orthogonal / 180 opposite); range [−1,1]. (keep/deepen)
52 e2e/walkthrough — cosine worked example (a=(1,2,2),b=(2,0,1): dot=4, ‖a‖=3, ‖b‖=√5≈2.236, cos≈0.596) (keep).
53 formula/e2e — dot product / inner product: a·b=Σaᵢbᵢ=‖a‖‖b‖cosθ; worked u=2i−3j,v=4i+2j → a·b=2; MIPS + "when NOT to use dot product?" (magnitude). (port)
54 e2e/walkthrough — Euclidean worked (P(3,2),Q(4,1)→√2≈1.414) + Manhattan worked (P(2,9),Q(3,5)→5); Minkowski Lp generalization (p=1/2/∞) — FILL the gap old deck skipped. (port + extend)
55 formula/viz — relationships cosine↔dot↔euclidean: ‖x−y‖²=2(1−cosθ) on unit sphere → same NN ordering; DISAGREE when not unit-norm — counterexample a=(1,1),b=(10,10) (cos=1 but ‖a−b‖≈12.7). IMAGE PROMPT.
56 table — the family: cosine/dot/Euclidean/Manhattan/Jaccard/Hamming/edit/KL-JS/Pearson — captures / range / metric? / use / pitfall.
57 definition/viz — Jaccard J=|A∩B|/|A∪B| (Venn) + MinHash (dedup, Pr[collision]=J) ; SimHash↔cosine. Sets/sparse regime.
58 e2e/walkthrough — Levenshtein DP matrix HONDA×HYUNDAI → edit distance 3 (port; show the filled grid as a table or stepped build).
59 two-col — sparse vs dense regimes (Jaccard/MinHash for sets/bags; cosine/dot for dense embeddings; which when).
60 divider-light or continue → high-dimensional pitfalls.
61 viz — curse of dimensionality / distance concentration: (dist_max−dist_min)/dist_min → 0 as d→∞; histogram series d=2,10,100,1000. IMAGE PROMPT.
62 viz — hubness: a few "hub" points in everyone's kNN list (skewed k-occurrence). IMAGE PROMPT.
63 viz — anisotropy of contextual embeddings (narrow cone → random tokens have high cosine → inflated); fix = whitening. IMAGE PROMPT.
64 misconception — "cosine & Euclidean always rank the same?" → only for L2-normalized; + "Is cosine-similarity really about similarity?" (Steck 2024 gauge freedom; dot vs cosine in trained retrieval).
65 table — applications (kNN/RAG/dedup/plagiarism/clustering/recsys/drift → measure & why).
66 two-col — practical: FAISS (METRIC_L2 squared, INNER_PRODUCT, no native cosine → normalize + IndexFlatIP); vector DBs match metric to how the model was TRAINED; numerics (zero-vector ε, smoothing).
67 quote — takeaway: text → tokens → ids → vectors → similarity → ranking; bridge to next lectures (Classical IR: BM25 = the first real ranking function; embeddings = learned vectors).
68 refs — Jurafsky&Martin SLP3; Sennrich 2016; Kudo 2018; Karpathy minBPE; Steck 2024; Aggarwal 2001; Ethayarajh 2019; Manning IIR; Token Tax 2025; HF tokenizers.
69 final — Q&A, contacts (email set), QR to GitHub Pages hub.

(That's ~69; add/split as needed to keep slides un-crowded; don't exceed ~74.)
