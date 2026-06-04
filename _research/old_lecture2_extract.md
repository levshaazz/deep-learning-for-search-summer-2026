# OLD Lecture 2 (Summer 2025) — full slide-by-slide extract (118 slides)

> Source: old_slides/Lecture 2.pdf. TWO halves: (1) Tokenization 1–56, (2) Ranking/Eval Metrics 57–118. NOTE: similarity measures (cosine/dot/Euclidean/Jaccard) are NOT covered here (only "cosine distance" name-dropped in Diversity/Serendipity). Same visual identity as L1. The ranking-metrics half is mostly FRIDAY's lecture (Ranking Metrics) — but the TOKENIZATION half is directly for the NEW Lecture 2.

## PART A — TOKENIZATION (1–53)  ← CORE for NEW Lecture 2
- 2 Motivation: "Models process arrays of numbers not text; models limited in context length; tokenization robust on density+variability; one of core NLP tasks."
- 3 **Context-length growth chart** (artfish.ai): x=release date 2018–2024, y=context (log 1K→2M). GPT-1/BERT/T5 ≈ **512 tokens**; GPT-3; GPT-4/Gemini 1.0 ~8–32K; Claude 2.1/GPT-4 Turbo ~100K; Gemini 1.5 Pro **2M**. [Refresh with 2025/2026 models.] Link artfish.ai/p/long-context-llms.
- 4 **Token-ID concept** (colored table): "students opened their books" → IDs **11 | 298 | 34 | 567**.
- 5–7 **CORNER-CASE GOLDMINE** (two-col):
  - Contextual awareness: "lead" noun ("lead in the pencil") vs verb ("lead the team").
  - Compound words (German/Finnish): "Donaudampfschifffahrtsgesellschaftskapitän" → Donau/dampf/schiff/fahrts/gesellschaft/kapitän.
  - Abbreviations: "Dr." "Mr." must not split as "Dr"+".".
  - MWEs: "New York" = single entity.
  - Numbers/symbols: "I have 3 apples, 2 bananas, and 1 orange" tokenized w/ numerics; "5 + 3 = 8" keep +,= separate.
  - Punchline: **"Large enough corpus for training a tokenizer handles those problems (almost) itself."**
- 8 **OOV/UNK** (before/after): low-freq words → #UNK#; "lose info about rare words/entities". Welsh example: 'Hen Gapel Lligwy'… → '<unk> <unk>' (Gapel/Lligwy/capel → <unk>).
- 9–10 Word-level treats open/opened/opens/opening as separate types → separate embeddings; char-level → small vocab BUT "you pay with longer input sequences". (sets up subword tradeoff)
- 11 **Pipeline diagram** (rasbt/LLMs-from-scratch): text → tokenized → token IDs → embeddings → LLM → postprocessing → output. "This is an example." → IDs [40134,2052,133,389,12].

### BPE (12–26) — DEEP
- 12 Origin: Philip Gage 1994 "A New Algorithm for Data Compression". (NLP: Sennrich 2016 arxiv 1508.07909.)
- 13 **Toy walkthrough**: `aaabdaaabac` (11 chars) → aa=Z → `ZabdZabac` → ab=Y → `ZYdZYac` → ZY=X → `XdXac` (5 chars).
- 14 Corpus {"old":7,"older":3,"finest":9,"lowest":4}, add end-marker "</w>".
- 15 Initial token freq table (12 tokens): </w>=23, o=14, l=14, d=10, e=16, r=3, f=9, i=9, n=9, s=13, t=13, w=4.
- 17–22 **Merge iterations** (full arithmetic): It1 e+s=9 → "es"; It2 es+t=13 → "est"; It3 est+</w>=13 → "est</w>"; It4 o+l=10 → "ol"; It5 ol+d=10 → "old". Final 11 tokens; "compression in tokens-per-word is significant".
- 23 Bytes-as-base gotcha: ~138K unicode symbols; **GPT-2 uses 256 bytes as base vocab** + BPE on top → no UNK.
- 24–25 "Problem with BPE": >1 way to encode a word. "linear"=li+near OR li+n+ea+r; "algebra"=al+ge+bra OR al+g+e+bra. No priority.
- 26 Stopping criteria: fixed #merges, vocab size, pair-freq convergence, task performance.

### WordPiece (27–47) — DEEPEST in deck
- 27 Origin Schuster&Nakajima 2012 (Japanese/Korean Voice Search); BERT's tokenizer; differs from BPE in HOW pairs are added (score, not freq).
- 28 Init: char vocab + [UNK] + "##" prefix for non-word-initial subwords.
- 29–30 Build subword pool for "looking" (l, lo, loo, look,…; o, oo,…); count freqs, track initial vs middle/end.
- 31 **KEY SCORE FORMULA**: Score(A,B) = freq(AB)·len(vocab) / (freq(A)·freq(B)). Picks merges more-than-chance.
- 32–36 Iterate: pick highest score, merge, add ## if non-initial, update freqs; stop at vocab size or score threshold.
- 37 **Inference = GREEDY LONGEST MATCH** left→right; first piece bare, rest get ##; no match → [UNK].
- 38–45 **Full worked example** corpus "the quick brown fox jumps over the lazy dog": scores e.g. (q,##u)=(1·29)/(1·1)=**29** → "qu"; (qu,##i)=**30** → "qui"; (qui,##c)=**31** → "quic"; → "quick"; "the"; "brown"; etc. Stop at vocab 1000–3000.
- 46 **OOV test**: "The fastest brown hare leaps over the sleepy cat" → ['the','[UNK]','brown','[UNK]','ju','##mp','##s','over','the','[UNK]','[UNK]'] ("leaps" reuses subwords from "jumps").
- 47 Summary: known→single token; unseen→[UNK]; subword utilization ("quickness"→qu+##ick+##ness); morphological awareness; greedy longest match; ## preserves boundaries.

### Limitations & notes (48–53)
- 48 Hard for agglutinative (Turkish/Tatar) & non-concatenative (Arabic, root k-t-b → kataba/kattaba/iktataba); Thai/Chinese (no spaces); Hawaiian (punctuation as consonants).
- 49 **Token-free models** (ByT5, byte-to-byte) — robust, any language, not industrial standard. arxiv 2105.13626.
- 50 Tokenizer comparison Table 2 (ByT5/mWP/BPE/WP/SP-U across MLM/NER/TOXD/POS/SA). aclanthology 2024.icnlsp-1.22.
- 51 Vocab-size vs task perf (4 charts BPE/WP/Unigram).
- 52–53 Different tokenizers converge to share tokens (BPE&WP stay high ~0.72–0.98). arxiv 2411.17669.
- 54 Takeaways: HuggingFace tokenizers; Karpathy "Let's build the GPT Tokenizer"; SentencePiece paper.

## PART B — RANKING / EVAL METRICS (57–118)  ← mostly FRIDAY's lecture; KEEP LIGHT here, but reusable framings:
- "Ranking ~ most relevant doc on top (w.r.t. query, user, money)"; "most relevant ≠ most useful to display; two duplicates both relevant but show only one".
- 3 metric families: Predictive / Ranking / Behavioral (Diversity, Bias, Novelty, Coverage).
- Taxonomy table: Unranked (MSE/RMSE/MAE/precision/recall); Ranked (Kendall Tau, P@k, R@k, AP@k, MAP@k, RR, MRR); User-oriented (nDCG, RBP, ERR). "Same (almost) for RecSys".
- **"Zero rank awareness"** slide (Model A all-relevant-at-top vs Model B all-relevant-at-bottom, SAME precision@10=50%) → motivates rank-aware metrics. MSE slide makes same point.
- Worked numbers throughout: P@10=5/10=0.5; R@10=5/8=0.625; AP@5=0.81; MAP@5=0.66; MRR@5=0.58; DCG@3=1.5 vs 1.63; RBP=0.58; ERR 0.94 vs 0.38.
- NDCG deep (DCG@K=Σ relᵢ/log₂(i+1); discount table 1, 0.63, 0.5, 0.43, 0.39; IDCG normalization). RBP & ERR derived from probabilistic user models (flowcharts).
- Behavioral: Diversity = avg **cosine distance** between item pairs intra-list; Serendipity = **cosine distance** between recs and user history. Novelty, Popularity bias (Coverage, ARP, Gini, Personalization=1−avg overlap). CTR = clicks/searches.

## WHAT TO PORT
1. BPE two walkthroughs (toy aaabdaaabac→XdXac; {old/older/finest/lowest} freq-merge sequence) — verbatim.
2. WordPiece "quick brown fox" worked example with Score=(freq(AB)·|V|)/(freq(A)·freq(B)) computations + OOV "fastest brown hare leaps…" → [UNK]/subword.
3. Corner-case slides (lead polysemy, German compound, Dr./Mr., New York MWE, apples/bananas + "5+3=8", Welsh <unk>) + "large corpus handles these itself" punchline.
4. Context-length growth chart (refresh to 2026).
5. rasbt pipeline diagram (text→tokens→IDs→embeddings→LLM).
6. "Zero rank awareness" Model A vs B (if touching metrics).
7. Consistent worked-numbers + document-icon visual style.
