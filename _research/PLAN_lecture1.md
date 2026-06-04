# EXPANSION PLAN — Lecture 1: Search & IR + ML System Design
Target: **~58 slides** (from 26). Fill a ~75-min graduate pair with real depth, corner cases, worked examples, many visuals. Source material: `_research/brief_search_ir.md`, `_research/brief_ml_system_design.md`, `_research/old_lecture1_extract.md` (PARTS A & F especially).

Conventions: ENGLISH ONLY (no lang spans); KaTeX for every sub/superscript and all of `10^9`, `S_{ij}`, `nDCG@10`. Keep the existing head + bottom <script> block + both <template> blocks (logo DLS / INNOPOLIS UNIVERSITY). `.slides` data-course-* = "Deep Learning for Search · Summer 2026". Title metadata: eyebrow "Lecture 01 · Week 1 / Pair 1", Albert Nasybullin, 03.06.2026, Innopolis University. Final QR data-qr="https://levshaazz.github.io/deep-learning-for-search-summer-2026/". Email a.nasibullin@innopolis.university. Sequential data-screen-label "NN Name". Agenda #/N anchors → the divider slide indices (fix last). Every stepped slide: data-max-step + data-current-step="0" + .step-controls. Speaker notes on every slide; for visual/hook slides add an IMAGE PROMPT block (Wait-But-Why doodle style) per the format in the agent spec.

Light sci-fi through-line (Project Hail Mary): a lone operator must find the ONE record that saves the mission among billions; IR = finding it, ML System Design = building the machine that finds it reliably forever. Pattern per part: Problem → what solves it → detailed solution. Port the recurring **"Get Data → Measure Similarity → Rank · How?"** spine as a mental model.

## SLIDE LIST
0-open:
1 title. 2 agenda (5 parts). 3 objectives (6 outcomes). 4 arch — course spine "Acquire → Represent → Measure similarity → Rank · (each is a How?)" (port old L1 s10-11).

Part 01 — The problem of finding:
5 divider "Part 01 · The needle in the cosmos".
6 quote hook — drowning in data, sci-fi. IMAGE PROMPT.
7 definition — Information Retrieval (Manning).
8 viz — need→query→docs lossy funnel; ibuprofen example; avg query 2.3–2.9 words. IMAGE PROMPT.
9 definition — relevance (binary vs graded; topical vs user/situational; dynamic/personal).
10 viz — graded relevance scale Perfect/Excellent/Good/Fair/Bad → why we RANK not filter.
11 table — search vs database lookup (query type, data, result=ranked list vs set, correctness, failure).
12 two-col — search vs recommendation: PULL vs PUSH continuum (explicit↔implicit), "search ≈ recsys", converge on cascade.
13 table — search is everywhere (web/e-commerce/enterprise/code/legal-medical/desktop × what's relevant × challenge).
14 viz — real products hook (Google/Ozon/Yandex wrong "8 legs" answer) → hallucination/RAG teaser. IMAGE PROMPT (or describe screenshots as placeholders).
15 quiz — why return a RANKED list, not all matches? (graded relevance, top-k attention).

Part 02 — Anatomy & why search is hard:
16 divider "Part 02 · Anatomy of a search engine".
17 arch — full pipeline: offline (crawl→analyze→index) + online (query proc→retrieve→rank→rerank→present).
18 two-col — offline vs online (build index in days vs walk it in <200ms).
19 definition — inverted index (dictionary+df → postings; tf/positions).
20 e2e (or walkthrough) — inverted index WORKED: build from Doc1"the quick brown fox"/Doc2"the lazy fox" → postings → query `fox AND quick` = intersect [1,2]∩[1]=[1]. stepped.
21 funnel — the cascade with real numbers (corpus ~10^9 → retrieve ~10^3 → rank ~10^2 → rerank ~10); recall→precision. (keep/deepen)
22 viz — recall ceiling = leaky bucket ("can't re-rank what you didn't retrieve"; BM25 80% → reranker caps at 80%). IMAGE PROMPT.
23 table — cascade stages L0/L1/L2 (job, cost/doc, set size, optimizes) + YouTube numbers (millions→hundreds, ~1B params, serving <tens of ms; MS MARCO MRR 16.7→36.5).
24 definition/viz — vocabulary mismatch / lexical gap; Furnas 80%; synonymy(recall) vs polysemy(precision). IMAGE PROMPT (couch/sofa wall; jaguar splits cat/car/OS).
25 viz — Zipf long tail of queries; "~15% never seen before" (~1.3B/day) → must generalize. IMAGE PROMPT (beach).
26 table (triptych) — Broder intent: navigational ~24.5% / informational ~39% / transactional ~36% (+ note labeling is fuzzy).
27 misconception — "exact match = relevant" → truth (spam has all words; best doc shares none; lexical neither necessary nor sufficient).
28 two-col — more hard realities (short queries, spelling, freshness earthquake, personalization python, zero-result 10–20% of e-commerce searches).
29 misconception/viz — position/presentation bias: Golden Triangle, #1≈33% because it's #1 → "click logs lie" → biased LTR. IMAGE PROMPT (feedback loop).
30 quote — classic→neural IR bridge: lexical gap → embeddings/dense → hybrid (recall@1000≈0.98); narrative arc for the course.

Part 03 — ML System Design:
31 divider "Part 03 · Building the machine that never sleeps".
32 quote hook — "a model in a notebook is not a system". IMAGE PROMPT.
33 viz — the ML iceberg (Sculley 2015): tiny ML-code box, huge submerged plumbing; "~5% is ML code". IMAGE PROMPT.
34 definition — ML System Design (end-to-end around the model).
35 two-col — hidden tech debt: CACE, glue code/pipeline jungles, config debt, hidden feedback loops (mapped to search).
36 walkthrough — the framework as 6 steps (frame→data→model & baselines→eval→serve→monitor); walk-state chips = artifacts (spec, (q,d,label), BM25 baseline, nDCG@10, p99<200ms, logs→retrain); data-final on step 6. Include Google Rule#1/#4.
37 table — business goal → ML objective → proxy metric (3-4 rows: "find what they want"→rank relevant→nDCG@10; "fast"→latency→p99; "fresh"→index freshness→lag).
38 two-col — metrics: offline (nDCG/MAP/MRR/AUC/logloss) vs online (CTR/conversion/dwell/session) vs guardrail (p99/revenue/retention).
39 misconception — "better offline metric = better search" → offline–online gap (deepen existing). 
40 viz — Goodhart loop: optimize CTR → clickbait while true satisfaction falls. IMAGE PROMPT.
41 two-col — online experimentation: A/B, shadow, canary, interleaving (Netflix >100× more sensitive; Chapelle 1–2 orders).
42 viz/table — SRM gate + guardrails (A/B funnel; chi-square before any analysis).
43 viz — the data flywheel + evil twin (bias amplification, rich-get-richer). IMAGE PROMPT.
44 two-col — feedback loops: position bias, exposure bias, degenerate loops → fix = unbiased LTR (IPW) + exploration + context features.
45 definition/arch — training-serving skew → feature store as the architectural fix (Rules #29/#32).
46 table — drift: covariate (P(x), monitor feature dist/KL/PSI) vs concept (P(y|x), monitor error vs fresh labels) + leakage, label delay, cold start, Simpson's paradox.
47 archflow BLUEPRINT — production search system offline↔online + feature/index store + feedback loop (KEEP existing, deepen labels). 5 steps.
48 sequence — online request path & latency budget p99<200ms (KEEP, deepen; mention YouTube tens-of-ms, p99 not p50).
49 table — cascade as a SYSTEMS decision: per-stage latency/cost (ANN ~10ms, light rerank ~60ms +5–15 nDCG, heavy +200ms; distilled 70–90% gain at 30–50% cost).
50 two-col (before/after ledger) — a measured-pain→fix CASE STUDY in the spirit of old L1 PCA arc: e.g. "371M docs, 2 langs, 1s SLA" → naive (huge memory, no GPU) vs engineered (cascade + smaller embeddings + cache) "(no problem)". Port the before/after resource-ledger pattern.

Part 04 — Synthesis:
51 divider "Part 04 · Putting it together".
52 quote/misconception — "the most expensive bug is in problem framing, not modeling" (wrong objective → perfect model makes it worse).
53 two-col/arch — how this maps to the course (each week = a pipeline block: classical IR → embeddings → neural retrieval → ANN/vector DBs → RAG).
54 quote — takeaway (IR gives the problem & metrics; DL fills the pipeline; ML-sys-design keeps it alive).
55 refs — Manning IIR; Croft; Broder 2002; Furnas 1987; Covington 2016; Nogueira&Cho 2019; DPR 2020; Sculley 2015; Huyen DMLS; Google Rules of ML.
56 final — Q&A, contacts (email set; office hours/GitHub TODO), QR to GitHub Pages hub.

(That's ~56; you may add 2-3 more if a topic needs splitting to avoid density. Don't exceed ~62.)
