# Research Brief — Intro to NLP + Tokenization (graduate depth)

## 1. Why text is hard for computers
Frame: machines want fixed-length continuous vectors; language is discrete, variable-length, ambiguous, Zipfian.
- **Discreteness**: pixels interpolate (0.5 grey is meaningful); the "average" of cat and dog is not a word. No inherent metric on symbols → must LEARN embeddings. Core motivation for representation learning.
- **Variable length**: "Hi." vs 5000-word doc. Transformers need a sequence; length drives cost O(n²).
- **Ambiguity** (one example each): lexical ("bank" river/financial; "bat" animal/sport); syntactic/attachment ("I saw the man with the telescope"); semantic/scope ("Every student read a book"); referential (Winograd: "The trophy didn't fit in the suitcase because it was too big" — it=trophy; flip big→small → it=suitcase).
- **Zipf's law**: freq of r-th word ∝ r^(−1). A few words dominate; huge tail of hapax legomena (~40–60% of distinct types appear once). **Heaps' law**: vocab V ∝ N^β (β≈0.4–0.6) — vocabulary never saturates. **Punchline: a fixed word vocabulary can NEVER cover real text → direct argument for subwords.**
- **Morphology**: Turkish "evlerinizden" = ev+ler+iniz+den ("from your houses"). Agglutinative langs stack morphemes → word vocab explodes.
- **Multilinguality**: ~7000 languages, many scripts, RTL (Arabic/Hebrew).
- **No canonical word boundaries**: Chinese 今天我很高兴 has NO spaces; segmentation is learned + ambiguous. Japanese mixes kanji/hiragana/katakana; Thai no spaces. Even English: "New York", "can't", URLs, hashtags. **"Split on spaces" is an English-centric assumption that breaks for most of the world.**

## 2. Normalization pipeline
Order: decode bytes → Unicode normalize → (optional) lowercase/strip accents → tokenize.
- **Unicode**: "é" = U+00E9 (NFC) OR "e"+U+0301 (NFD) → visually identical, byte-different → different tokens → fail to match. NFC (compact, storage), NFD (decomposed), NFKC/NFKD (fold look-alikes: "ﬁ"→"f"+"i", full-width "Ａ"→"A", "²"→"2"; aggressive, lossy).
- **Casing/accents**: lowercasing collapses Apple/apple, US/us; accent-strip merges French où/ou.
- **Pitfall — over-normalization** destroys signal (U.S. vs us, emoji, code; NFKC changes chemistry/math superscripts). Modern LLM tokenizers (GPT-2/4) do ALMOST NO normalization (byte-level, case-preserving). BERT-uncased lowercases+strips accents (downsides for NER/code). Pattern: NFC + minimal folding for generation; heavy NFKC+casefold only for lexical search index keys.

## 3. Granularity — the tradeoff triangle (vocab size ↔ seq length ↔ OOV)
| Granularity | Vocab | Seq len | OOV | Notes |
|---|---|---|---|---|
| Character | tiny (~26–256 bytes) | very long (≈4–5×) | zero | semantics rebuilt from scratch; long seq blows O(n²) |
| Word | huge/unbounded (Heaps; 10^6+) | short | severe (typo/new word = UNK) | can't spell, can't handle morphology |
| Subword | sweet spot (30k–256k) | moderate | ~zero (byte fallback) | modern default |
- Numbers: GPT-2 vocab **50,257**; cl100k (GPT-3.5/4) **~100k**; o200k (GPT-4o) **~200k**; BERT **30,522**; LLaMA/T5 (SentencePiece) **32k**. English ≈ **4 chars/token** ≈ **0.75 words/token** (100 tokens ≈ 75 words). Bigger vocab → fewer tokens/text → shorter seq & lower cost, but bigger embedding matrix & softmax.

## 4. Subword algorithms (HOW each is trained)
- **BPE** (Sennrich 2016; origin Gage 1994 compression). Train: start chars; repeatedly merge MOST FREQUENT adjacent pair into new symbol; record merge rule; stop at vocab size. Greedy, frequency-driven, deterministic. Encode new text: apply merges in order.
  - **Byte-level BPE (GPT-2)**: start from 256 raw bytes → any byte sequence representable → **UNK mathematically impossible**; emoji/Chinese/code all encode. + regex pre-tokenizer keeps leading space (" the" = one token).
  - **Worked example** (slide it): counts low:5, lower:2, newest:6, widest:3 + "</w>". Pair `e s` = 6+3=9 (most freq) → merge "es"; then `es t`=9 → "est"; `est </w>`=9 → "est</w>"; `l o`=7 → "lo"; `lo w`=7 → "low". "lowest" (UNSEEN) → low+est</w> — generalizes.
- **WordPiece** (Schuster&Nakajima 2012; BERT). Merge criterion = LIKELIHOOD not raw freq: pick pair maximizing **score = freq(AB)/(freq(A)·freq(B))** → prefers pairs co-occurring more than chance. **`##` continuation marker** for word-internal pieces: "playing"→play+##ing; "tokenization"→token+##ization. German compound → Donau ##dampf ##schiff ##fahrt ##gesellschaft ##kapitän.
- **Unigram LM / SentencePiece** (Kudo 2018). OPPOSITE direction: start with large seed vocab, fit unigram LM (EM), iteratively PRUNE tokens whose removal least hurts likelihood; until target size. Probabilistic, top-down. Enables subword regularization (sample segmentations as augmentation). **SentencePiece** = wrapper (BPE or Unigram); treats whitespace as a char rendered `▁` (U+2581): "Hello world"→`▁Hello ▁world` → fully reversible, language-agnostic (no pre-tokenizer; crucial for CJK). Used by T5/ALBERT/XLNet/LLaMA1/Mistral.
- **One-liner**: BPE = merge by frequency (bottom-up greedy); WordPiece = merge by likelihood gain (bottom-up); Unigram = prune big vocab by likelihood loss (top-down probabilistic).

## 5. Special tokens
[CLS] (BERT start, pooled rep for classification); [SEP] (segment separator — query|doc in BERT cross-encoder reranking → relevant to search); [PAD] (batch fill, masked out); [MASK] (BERT MLM target, ~15%); [UNK] (OOV fallback; byte-level eliminates it); BOS/EOS (<s>/</s> generation start/stop). Chat-template tokens: ChatML <|im_start|>/<|im_end|>; LLaMA-3 <|begin_of_text|>/<|start_header_id|>/<|eot_id|>; added by tokenizer.apply_chat_template(). **Pitfall**: applying chat template AND add_special_tokens=True → DUPLICATE BOS/EOS → degrades quality.

## 6. Corner cases & pitfalls (HEART of the lecture)
- **Numbers/digits**: GPT-2/3 BPE has messy multi-digit tokens (some 3-digit are single tokens; 677, 804 split into two). "327" may be 3+27 or 327 — a frequency artifact, not logic. LLaMA & PaLM FORCE single-digit tokenization. Arithmetic suffers when addends & answer misalign. "Tokenization counts" 2024: right-to-left digit grouping via commas improves GPT-3.5/4 addition; multiplication ≈0 by ~6+ digits.
- **Code & whitespace**: indentation is semantic in Python; GPT-3.5/4 added tokens for runs of spaces (one token for 4/8/16 spaces) — a reason GPT-4 is better at code. YAML often fewer tokens than JSON (less punctuation) — prompt-eng tip.
- **Emoji & rare Unicode**: one emoji can be several byte tokens (ZWJ-joined 👨‍👩‍👧 = multiple code points).
- **CJK / whitespace-free**: byte-level BPE fragments heavily; one Chinese char can be 2–3 tokens.
- **German compounds / agglutinative**: fragment into many subwords → fertility problem.
- **Multilingual "token tax" / fertility** (tokens per word): SAME meaning, more tokens in some languages. Token Tax 2025: fertility predicts accuracy (each extra token/word ≈ −8 to −18 acc pts; explains 20–50% of variance); 2× fertility → ~4× training cost (O(n²)); 5× → ~25× energy/cost. Inference: 2×-fertility language ≈ 2× API price AND 2× latency for same content, smaller effective context. **Fairness**: low-resource speakers pay more, get smaller context, lower accuracy for identical info.
- **Glitch tokens — "SolidGoldMagikarp"**: strings that got a token (scraped usernames) but were rare/absent in TRAINING → embedding untrained → bizarre behavior (repeats "distribute", refuses, hallucinates). Lesson: tokenizer vocab & training data must share distribution.
- **Trailing-space sensitivity**: " the" ≠ "the"; prompt ending in trailing space goes off-distribution → degrades completions.
- **Spelling/char ops**: models see tokens not letters → "how many R's in strawberry?" and string reversal are hard.
- **Context-window & cost**: tokens fill the window; fertility & verbose formats shrink usable context, raise cost.
- **Prompt injection via tokenization**: attacker text with special-token strings (<|im_end|>, </s>) can break role/turn if special tokens not disabled; homoglyph/Unicode tricks smuggle instructions past naive filters. → treat untrusted text with add_special_tokens=False + normalize before matching.

## 7. Why it matters for SEARCH
- Query/doc tokenization mismatch: "ensembling" (query) won't match "ensemble" (doc) under exact BM25; plurals/tenses miss = vocabulary mismatch.
- BM25 matches exact terms, needs per-language tokenization/stop-words/stemming; "car"≠"automobile". Concrete cross-lingual: "euthanasia" is one BM25 term but XLM-R splits into subwords → BM25 and neural disagree on units → hurts fusion.
- Subword-aware sparse retrieval helps recall on morphological variants. Multilingual fertility tax → truncation risk + uneven recall (search fairness).

## 8. Tools / playgrounds (demo live)
tiktoken (cl100k_base, o200k_base) github.com/openai/tiktoken; HF `tokenizers` + LLM Course ch.6; OpenAI Tokenizer playground platform.openai.com/tokenizer; **Tiktokenizer** tiktokenizer.vercel.app (encoders + chat templates; show fertility, digit splits, trailing space, glitch tokens live); Karpathy minBPE github.com/karpathy/minbpe. Demos: type "327" then "67890"; same sentence English vs Hindi/Telugu/Turkish (token count jumps 2–4×); type " SolidGoldMagikarp"; toggle trailing space; JSON vs YAML.

## 9. Visualization ideas (doodle)
1. Token-ID strip ("Tokenization"→Token|ization→[6602,2065]).
2. BPE merge tree (chars bottom, arrows merging up, freq annotated — low/lower/newest/widest).
3. Context-length growth chart (refresh to 2025/2026 models).
4. Fertility-by-language bar chart (English≈1.0 vs Hindi/Telugu/Turkish/Finnish 2–4×, $-cost axis right).
5. Vocab-size vs seq-length tradeoff curve (two crossing curves; sweet spot 30k–200k).
6. Tradeoff triangle (Char↔Word↔Subword vertices; vocab/seq-len/OOV on edges).
7. Three-algorithm strip (same word by BPE vs WordPiece `##` vs SentencePiece `▁`).
8. "What the model sees" (strawberry as letters vs opaque token chunks → spelling failure).
9. Glitch-token embedding cloud (dense trained dots + lonely untrained "SolidGoldMagikarp").

## 10. Sources
1. Jurafsky & Martin SLP3 ch.2 https://web.stanford.edu/~jurafsky/slp3/
2. Sennrich, Haddow & Birch 2016 — BPE for NMT https://arxiv.org/abs/1508.07909
3. Kudo 2018 — Subword Regularization (Unigram) https://arxiv.org/abs/1804.10959
4. Kudo & Richardson 2018 — SentencePiece https://arxiv.org/abs/1808.06226
5. HF LLM Course ch.6 https://huggingface.co/learn/llm-course/chapter6/5
6. HF Transformers — Tokenizer summary https://huggingface.co/docs/transformers/tokenizer_summary
7. Karpathy — Let's build the GPT Tokenizer / minBPE https://github.com/karpathy/minbpe
8. Rumbelow & Watkins 2023 — SolidGoldMagikarp (LessWrong).
9. Singh et al. 2024 — Tokenization counts: arithmetic https://arxiv.org/abs/2402.14903
10. The Token Tax 2025 — multilingual fertility bias https://arxiv.org/abs/2509.05486
11. tiktoken https://github.com/openai/tiktoken
12. Unicode UAX #15 Normalization Forms https://www.unicode.org/reports/tr15/

### Highest-leverage additions: Zipf/Heaps → "subwords inevitable"; the 3-way BPE/WordPiece/Unigram training contrast + worked merge; corner cases (digits/arithmetic, fertility token-tax w/ cost multipliers, glitch tokens, trailing space) — most memorable, currently most missing.
