# Research Brief — Search & Information Retrieval (graduate depth)

## 1. What IR is — relevance, need vs query, search-is-everywhere
- IR = finding unstructured material satisfying an *information need* from large collections (Manning IIR ch.1). The system stores DOCUMENTS, the user has a NEED, the only bridge is a lossy 2–3 word QUERY. **need → query is lossy compression; ranking is reconstruction.**
- Example: need = "Is ibuprofen safe while pregnant?"; typed query = `ibuprofen pregnancy`. System never sees the need. Avg web query ≈ 2.3–2.9 words.
- Relevance: **binary vs graded** (modern systems use a 5-point Perfect/Excellent/Good/Fair/Bad scale → nDCG). **topical vs user(situational)** relevance: a doc can be on-topic yet useless (wrong level, outdated, paywalled, wrong language). Relevance is dynamic (freshness), personal, situational. This is WHY offline metrics ≠ user happiness.
- Domains table (corpus / what "relevant" means / distinctive challenge): Web (billions / authoritative+fresh / spam,scale,intent); E-commerce (products / will convert / relevance≠revenue, in-stock); Enterprise/Glean (internal docs / answers coworker / ACLs, no link graph); Code search (files / semantic+exact symbol / identifier mismatch); Legal/Medical (cases,papers / HIGH-RECALL, missing one = catastrophic / controlled vocab MeSH); Desktop (local files / re-finding / tiny corpus,recency).
- **Search vs Recommendation**: Search = PULL (explicit query, active need now); Recsys = PUSH (no query, infer from implicit signals: watch time, dwell, clicks). Better: a CONTINUUM from explicit (Drive file search) → implicit (TikTok For You); e-commerce "you may also like" in middle. Architecturally converge: both use candidate-gen→ranking cascade; recsys swaps user-context embedding for the query. (Old deck: "search ≈ RecSys".)

## 2. Anatomy (offline vs online)
- OFFLINE (batch, latency-insensitive): Crawl/Ingest → Text analysis (tokenize, normalize, stem, lang-detect) → **Index** (inverted index).
- **Inverted index** (teach this): forward index = doc→terms (scan all = O(N)). Inverted = term→docs. Dictionary (term + df) → Postings list (sorted docIDs, optionally tf + positions). Worked: Doc1 "the quick brown fox", Doc2 "the lazy fox" → fox→[1,2], quick→[1], lazy→[2], brown→[1]. Query `fox AND quick` = intersect [1,2]∩[1]=[1]. Cost depends on #matching docs, not corpus size — why web search is possible.
- ONLINE (ms, latency-critical): Query processing (parse, spell-correct, expand, intent) → Retrieval (cheap high-recall: BM25/ANN) → Ranking (LTR) → Re-rank (expensive models, business rules, diversify) → Presentation (SERP, snippets — presentation is part of relevance). **Offline builds the index; online walks it.** Crawl billions in days; answer query in <200ms.

## 3. Multi-stage cascade — why + REAL numbers
- Can't run expensive model on every doc: a BERT cross-encoder ~tens of ms/pair × 10^10 docs = 10^8× too slow → CASCADE cheap-broad → expensive-precise, each stage ~10× shrink.
- Table: L0 Retrieval/candidate-gen (very cheap BM25/ANN, millions→~1000, optimizes RECALL); L1 Ranking (moderate GBDT/LTR, 1000→~100); L2 Re-rank (expensive cross-encoder/rules, 100→~10, optimizes PRECISION@k, nDCG).
- **YouTube (Covington RecSys 2016)**: candidate-gen millions→hundreds; ranking scores hundreds w/ many features; ~1B params, 100s of billions of examples; serving "under tens of ms"; ranking predicts expected watch time.
- **MS MARCO**: bi-encoder/BM25 retrieves 1000 → cross-encoder → top 10. Nogueira&Cho BERT cross-encoder lifted MRR **16.7%→36.5%** but only feasible on ~100 shortlist (quadratic attention).
- **Recall ceiling** (critical): whatever stage-1 misses, NO re-ranker recovers. If BM25 gets 80% of relevant, perfect re-ranker tops at 80%. → invest in first-stage recall + hybrid.
- Hybrid: on lexical queries BM25 ~70% recall, dense ~5%; on semantic queries dense ~70%, BM25 ~5%; combined recall@1000 ≈ 0.98.

## 4. Why search is HARD
- **(a) Vocabulary mismatch / lexical gap (#1 problem).** Furnas et al. 1987: two people pick the SAME term for the same object **<20%** of the time (disagree ~80%). Synonymy (buy/purchase, car/automobile) → hurts RECALL; Polysemy (jaguar=cat/car/OS; apple; mouse) → hurts PRECISION. Motivated LSI, query expansion, neural/dense retrieval.
- **(b) Long tail of queries.** Zipfian. **~15% of daily Google queries are never-seen-before** (was 25% in 2007; 15% since ~2013, reaffirmed through 2022 + AI-search era). At ~8.5B/day ≈ 1.3B brand-new queries/day. Can't memorize → must generalize → motivates ML/semantic matching.
- **(c) Intent — Broder 2002 (AltaVista):** Navigational (~24.5%, "facebook login", one right answer), Informational (~39%, "how vaccines work"), Transactional (~36%, "buy iphone 15"). (Other studies differ — labeling is fuzzy; that's itself a teaching point.)
- **(d)** Short queries (2–3 words, no context); spelling/typos; freshness (earthquake → 1-hr-old beats perfect 5-yr-old); personalization (python: programmer vs herpetologist; "coffee near me"); zero-result queries.

## 5. Corner cases & pitfalls (THE GAP)
- **Zero-result queries**: 10–20% of on-site e-commerce searches return nothing (15–30% unoptimized). Usually vocab mismatch (`joggers` vs catalog `sweatpants`), not missing inventory. 100k searches/mo × 10% = 10,000 high-intent visitors lost/mo. Fix: synonyms, typo tolerance, autocomplete.
- **Exact match ≠ relevance**: keyword-stuffed spam has all words & is useless; best doc may share ZERO query words (synonymy). Lexical match neither necessary nor sufficient.
- **Recall ceiling** (restate): teams over-invest in re-ranker; loss already happened at retrieval.
- **Position/presentation bias**: "Golden Triangle" eye-tracking (Enquiro 2005) — attention top-left; #1 organic ≈ 32–33% of clicks LARGELY because it's #1. → click logs are BIASED training data; naive LTR reinforces incumbents → motivates counterfactual/unbiased LTR (IPW).
- **Offline ≠ online**: nDCG/MAP measure topical relevance vs labels; miss freshness, diversity, trust, UI, latency. Reconcile: offline for iteration, A/B + interleaving for ground truth. Classic gotcha: wins nDCG offline, loses A/B engagement.
- **Ambiguous queries** (jaguar/apple/python): diversify SERP rather than commit.

## 6. Classic vs Neural IR (the bridge to the course)
- Lexical/sparse (BM25/TF-IDF over inverted index): fast, interpretable, strong on rare/exact terms (names, IDs, codes), no training. Hard wall = lexical gap (can't match car↔automobile, heart attack↔myocardial infarction).
- Neural/dense: embed query+docs into shared space, relevance = vector similarity (ANN). Bridges synonymy/polysemy. But underperforms on rare/exact terms (recall ~5% on lexical-heavy). → **hybrid (BM25+dense fused)** is production norm (recall@1000 ≈ 0.98).
- Narrative arc for students: inverted index → BM25 → lexical gap → embeddings/dense → hybrid → cross-encoder re-rank → cascade ties it together.

## 7. Visualization ideas (Wait-But-Why doodle)
1. need→query lossy funnel (fuzzy thought-bubble squeezed to 2-word query, fanning back to docs).
2. Inverted-index FLIP (docs forward → flip arrow → term list w/ docID chips; animate fox∩quick).
3. Cascade funnel w/ shrinking numbers 10^10→1000→100→10, $-per-doc gauge fattening; left "RECALL" right "PRECISION".
4. Recall ceiling = leaky bucket (catches 80% gold stars, 20% fall through; re-ranker robot can't reach dropped stars). "can't re-rank what you didn't retrieve".
5. Lexical gap cartoon (couch vs sofa, brick wall = BM25, embedding cloud lets them hold hands; jaguar thought-cloud splits cat/car/OS).
6. Zipf long-tail beach (HEAD spikes → TORSO → endless TAIL "15% never seen").
7. Broder intent triptych (navigational arrow→bullseye; informational head+lightbulbs; transactional cart).
8. Golden-triangle heatmap + biased-clicks loop ("click #1 → logs say #1 best → rank #1 again").

## 8. Sources
1. Manning, Raghavan & Schütze — Intro to IR (Cambridge 2008, free) https://nlp.stanford.edu/IR-book/
2. Croft, Metzler & Strohman — Search Engines: IR in Practice https://ciir.cs.umass.edu/irbook/
3. Broder 2002 — A Taxonomy of Web Search (SIGIR Forum) https://sigir.org/files/forum/F2002/broder.pdf
4. Furnas et al. 1987 — The Vocabulary Problem (CACM) — 80% disagreement.
5. Covington, Adams & Sargin 2016 — DNN for YouTube Recommendations (RecSys) https://dl.acm.org/doi/10.1145/2959100.2959190
6. Nogueira & Cho 2019 — Passage Re-ranking with BERT (MS MARCO 16.7→36.5) https://arxiv.org/abs/1901.04085
7. Karpukhin et al. 2020 — Dense Passage Retrieval (DPR) https://arxiv.org/abs/2004.04906
8. Pinecone Hybrid Search https://www.pinecone.io/learn/hybrid-search-intro/
9. Elastic — What is an inverted index? / BM25 https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables
10. Google "15% of searches are new" https://searchengineland.com/google-reaffirms-15-searches-new-273786
11. Enquiro/Eyetools Golden Triangle (2005).
12. TechPolicy.Press — Search vs Recommendation continuum.

### Highest-leverage additions: need→query lossy framing; inverted-index fox∩quick; cascade w/ real numbers + recall ceiling; Furnas 80% + Google 15%-new; Broder 24.5/39/36; position bias ("click logs lie").
