# Research Brief — ML System Design framework (graduate depth; running example = search/ranking)

## 1. "A model in a notebook ≠ a system" — the iceberg & hidden tech debt
- Sculley et al., *Hidden Technical Debt in ML Systems*, NeurIPS 2015. Canonical figure: tiny "ML code" box amid huge boxes (config, data collection, feature extraction, data verification, serving infra, monitoring, process tools). **"Only a small fraction of real-world ML systems is ML code."**
- Debt categories (each a teaching beat, mapped to search):
  - **CACE — Changing Anything Changes Everything**: no clean module boundaries; re-tune a feature/retrain/change a hyperparam → whole behavior shifts. Search: swap tokenizer or BM25 floor → shifts input distribution to the downstream reranker.
  - **Glue code & pipeline jungles**: mostly glue around general packages; data pipelines grow into jungles testable only end-to-end → errors surface only in prod.
  - **Configuration debt**: thousands of config lines (which features/data range/thresholds/model version); one stale feature-version pin degrades ranking silently, no exception.
  - **Hidden feedback loops** — direct (model outputs logged → next training labels: clicks on what you ranked → tomorrow's labels) & indirect (your ranker changes what's bought → changes a popularity feature another team consumes).
  - **Undeclared consumers (visibility debt)**: downstream teams read your scores with no contract; change scale → silently break them.
  - **Data-dependency debt & correction cascades**: model B corrects A → entangled; improving A regresses B (common when a business-rules fixer stacks on a learned ranker).
- Framing: notebook = the 5% (model); prod = the 95% (data verification, serving, monitoring, config) — where systems rot.

## 2. Framework stages (Huyen DMLS; Babushkin&Kravchenko; Google Rules of ML)
| Stage | Questions | Search instantiation | Pitfalls |
|---|---|---|---|
| Problem framing | business goal → ML objective → proxy | "users find what they want" → learn P(relevant\|q,d) → proxy = clicks/dwell | proxy ≠ goal (Goodhart); Rule#1 launch without ML first |
| Data | collection, labeling, splits, leakage | query/click logs, graded 0–4 judgments | temporal leakage, position bias in clicks, label sourcing bias |
| Modeling & baselines | simplest first | BM25/two-tower → GBDT/neural reranker | Rule#4 keep first model simple; skipping baseline hides whether fancy adds value |
| Evaluation | offline that PREDICTS online; then online | offline nDCG@10; online interleaving+A/B | offline–online gap |
| Serving/infra | latency, throughput, cost; cascade | ANN retrieval → ranking; p99 budget | train/serve skew (Rules 29–37), double hops, cold cache |
| Monitoring & feedback | drift, skew, degeneracy; close loop | track feature/score distributions, online metrics, SRM | silent degradation, no exception thrown |
- Google Rules of ML (cite): #1 Don't be afraid to launch without ML; #4 keep first model simple, get infra right; #29 "train like you serve" (log serving-time features, train on them); #32 reuse code train↔serve; #37 measure training/serving skew. (Zinkevich PDF.)

## 3. Metrics — offline vs online vs guardrail; the gap; Goodhart
- Offline: nDCG@k (graded, position-discounted — workhorse), MAP, MRR, P/R@k; classification proxies AUC, LogLoss (calibration matters if scores feed a cascade/auction).
- Online: CTR, conversion, dwell time, session success/abandonment, time-to-first-click, revenue/GMV.
- Guardrail: must-not-harm metrics — latency p99, error rate, revenue, retention, "no good result" sessions. A treatment that lifts CTR but breaks latency guardrail must NOT ship.
- **Offline–online gap**: offline metrics often fail to predict A/B. Reasons: evaluated in isolation on historical biased logs; online captures behavior/novelty/presentation/session dynamics; temporal dynamics invisible offline. Strategy: validate which offline metrics correlate with online lift; multi-objective/Pareto selection.
- **Goodhart's law**: "when a measure becomes a target it ceases to be a good measure." Optimize CTR → you optimize clickbait/outrage/ambiguity/accidental taps, not satisfaction. Mitigate: prefer causal goal metrics; pair every proxy with guardrails catching its degenerate direction (CTR + dwell time + pogo-sticking/quick-back rate).

## 4. Online experimentation
- A/B = gold standard for causal lift but noisy/slow for ranking (high between-user variance).
- Shadow deploy: run new model in parallel, serve none, log → validates infra+latency, zero risk.
- Canary: ramp 1%→5%→50% with auto-rollback on guardrail breach.
- **Interleaving** (ranking-specific): merge results of A and B into one list (team-draft), attribute clicks to contributing ranker; every user sees both → removes between-user variance. **Netflix: >100× fewer subscribers than most sensitive A/B metric** for 95% power; Chapelle/Joachims 2012: 1–2 orders of magnitude more sensitive, agrees with A/B. Workflow: interleaving filter (days) → survivors to full A/B.
- Novelty & primacy effects: treatment effects non-stationary (users click new UI just because new → lift decays; primacy = anchored users under-respond at first). Don't read out day 1.
- **Sample-Ratio Mismatch (SRM)**: assigned 50/50 but observe 50.2/49.8 → chi-square flags a data bug (bot filtering, redirect, logging loss). Microsoft: every A/B must pass SRM before ANY analysis. Treat like a fever.

## 5. Feedback loops & data flywheel
- Flywheel: more users → more logs → better model → better results → more users. SAME loop amplifies bias if logs used naively as labels.
- **Position bias**: users click rank-1 because it's rank-1; training on raw clicks teaches "predict what was on top". Fix: Unbiased LTR (Joachims) — IPW clicks by examination probability; or click models separating examination from relevance.
- **Degenerate loops / rich-get-richer**: model only sees feedback on what it shows; popular items → more exposure → more clicks → ranked higher. Fixes (Huyen): randomization/exploration (ε-greedy), context features (time/device) instead of pure interaction history; measure popularity diversity over time.
- **Exposure bias**: never-shown items get no feedback (missing-not-at-random) → exposure-aware models / contextual bandits.
- **Training/serving skew** (#1 silent killer): different feature code paths, data changing between train/serve, or a feedback loop. Fix: Rules #29/#32 + **the feature store** (one source of feature values for both training & serving → guarantees parity). (Eugene Yan, Feature Stores.)

## 6. Corner cases & pitfalls (high-value)
- **Data leakage**: random split on temporal data leaks future → inflated offline, collapse online. Split by TIME. Subtle: a feature computed over the label window.
- **Label delay**: conversions arrive hours–days later; "no conversion" may be "not yet" → mislabel positives as negatives.
- **Distribution shift** — match fix to type: covariate shift (P(x) changes, P(y|x) fixed: holiday traffic) → monitor feature distributions (KL/PSI); concept drift (P(y|x) changes: "corona" pre/post-2020) → monitor error vs fresh labels. Applying a covariate-shift fix to concept drift solves nothing.
- **Cold start**: new user/query/doc, no history → content features, popularity priors, exploration.
- **Simpson's paradox**: aggregate A/B metric moves +X% while EVERY segment moves opposite (traffic mix shifted). Rule: if aggregate moves but no cohort moves same direction, suspect Simpson's — never trust aggregate without segment cuts.
- **Cost of a wrong objective**: misaligned proxy → a technically PERFECT model makes things worse (perfect CTR ranker that tanks retention). Most expensive bug is in problem framing, not modeling.

## 7. Latency budgets & cost — cascade is a SYSTEMS decision
- Budgets: end-to-end typically <few hundred ms, users expect <200ms; YouTube ranking serving "under tens of ms". Alert on **p99**, not p50 (tail = what users feel). If p99 rises while p50 falls → request queue backed up.
- Cascade: stage-1 ANN narrows millions→hundreds (~99.99% reduction, ~10ms); stage-2 expensive model scores hundreds; tune candidate-set size & model complexity per stage = the systems knob.
- Numbers: fast cross-encoder (MiniLM) top-100→top-20 ~60ms; heavier finalizes top-5 +~200ms; reranking adds ~5–15 nDCG@10 points for <~200ms; distilled 60–120M rerankers ~70–90% of gain at 30–50% cost; candidate 100→50 ≈ halves cost, tiny relevance loss.
- Caching: cache popular query results/embeddings; cold cache after deploy spikes p99; stale cache reintroduces train/serve skew.

## 8. Visualization ideas (doodle)
1. ML iceberg (tiny ML-code above water; huge submerged config/data/serving/monitoring). "~5% is the model."
2. Data flywheel + evil twin (virtuous loop vs degenerate "bias arrow thickens each lap → rich get richer").
3. Offline-vs-online gap (two bar charts: offline ranks A>B>C, online ranks B>C>A; lightning-bolt gap).
4. A/B funnel + SRM gate (50/50 splitter → SRM chi-square gate red-X → guardrail gate → readout).
5. Drift over time (histogram morphing t1→t2→t3; covariate shift P(x) moves vs concept drift boundary moves).
6. Cascade/latency budget funnel (millions→ANN 10ms→hundreds→light rerank 60ms→tens→heavy 200ms→top-5; p99=300ms bar).
7. Interleaving vs A/B (A/B two crowds noisy; interleaving one user one merged list, clicks colored by source). ">100× fewer users (Netflix)."
8. Goodhart loop ("optimize CTR" → model learns clickbait → proxy rises while dotted "true satisfaction" falls).

## 9. Sources
1. Sculley et al. NeurIPS 2015 — Hidden Technical Debt in ML Systems.
2. Chip Huyen — Designing ML Systems (O'Reilly 2022); summary repo github.com/serodriguez68/designing-ml-systems-summary.
3. Google/Zinkevich — Rules of ML https://developers.google.com/machine-learning/guides/rules-of-ml
4. Babushkin & Kravchenko — ML System Design (Manning).
5. Eugene Yan — System Design for Recommendations and Search https://eugeneyan.com/writing/system-design-for-discovery/
6. Eugene Yan — Feature Stores: A Hierarchy of Needs.
7. Shankar et al. 2022 — Operationalizing ML: An Interview Study (arXiv 2209.09125).
8. Chapelle, Joachims, Radlinski, Yue 2012 — Large-Scale Validation of Interleaved Search Evaluation.
9. Netflix Tech Blog — Interleaving in Online Experiments.
10. Joachims et al. — Unbiased Learning-to-Rank with Biased Feedback (IPW).
11. Chen et al. 2020 — Bias and Debias in Recommender Systems: A Survey (arXiv 2010.03240).
12. Kohavi, Tang & Xu 2020 — Trustworthy Online Controlled Experiments; Microsoft SRM article.
13. Covington et al. 2016 — DNN for YouTube Recommendations (serving "tens of ms").

### Highest-leverage additions: the ML iceberg; data-flywheel + bias amplification; offline–online gap & Goodhart (CTR→clickbait); train/serve skew + feature store; interleaving >100×; SRM gate; p99 latency budget; the "wrong objective = perfect model makes it worse" point. Use a PCA-style before/after "measured pain → fix" arc (see old_lecture1_extract PART F).
