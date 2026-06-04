# Research Brief — Measures of Similarity (graduate depth)

Conventions: vectors x,y ∈ R^d; sets A,B; distributions P,Q. Metric = non-negativity + identity of indiscernibles + symmetry + triangle inequality.

## 1. The family (formula / captures / range / metric? / use / pitfalls)
- **Cosine**: cos(x,y)=xᵀy/(‖x‖‖y‖); cosine distance = 1−cos. Captures ANGLE/direction only, magnitude-invariant. Range [−1,1] (often [0,1] for non-neg TF-IDF). Cosine DISTANCE is NOT a metric (fails triangle ineq + identity); angular distance arccos(cos)/π IS a metric. Use when magnitude is a nuisance (doc length in TF-IDF). Pitfalls: undefined for zero vector; misleading on anisotropic/un-normalized learned embeddings (§4).
- **Dot product / inner product**: xᵀy = ‖x‖‖y‖cosθ. Range (−∞,∞). Captures angle AND magnitude. Not a metric. **MIPS** (max inner product search): argmax xᵀy — NOT directly LSH-able (IP not a metric; a point isn't its own NN). Shrivastava&Li NIPS2014 asymmetric LSH (ALSH) converts MIPS→L2/angular. Use when model LEARNED meaningful norms (trained dual encoders, recsys).
- **Euclidean (L2)**: ‖x−y‖₂. Range [0,∞). Metric (canonical). Magnitude-sensitive. Use: dense embeddings, k-means (squared-L2). Pitfalls: dominated by large-scale features (standardize); distance concentration in high-d.
- **Manhattan (L1, taxicab)**: Σ|xᵢ−yᵢ|. Metric. More robust to outliers (linear vs quadratic). Aggarwal 2001: L1 preserves contrast better than L2 in high-d.
- **Minkowski (Lp)**: (Σ|xᵢ−yᵢ|^p)^(1/p). p=1 Manhattan, p=2 Euclidean, p→∞ Chebyshev. Metric for p≥1; fractional 0<p<1 is a quasi-norm (violates triangle ineq). Mirkes 2020: fractional norms don't actually cure the curse.
- **Chebyshev (L∞)**: maxᵢ|xᵢ−yᵢ|. Metric. Worst single-coordinate gap (logistics/warehouse).
- **Mahalanobis**: √((x−y)ᵀΣ⁻¹(x−y)). Metric (PD Σ). Scale+correlation aware (= Euclidean after whitening). Use: anomaly detection, correlated features, metric learning (LMNN, ITML). Pitfall: estimating/inverting Σ unstable in high-d/small samples.
- **Jaccard** (sets): J(A,B)=|A∩B|/|A∪B| ∈[0,1]; Jaccard distance 1−J IS a metric. Generalized/Ruzicka (vectors): Σmin(xᵢ,yᵢ)/Σmax(xᵢ,yᵢ). Use: sets/bags — shingled docs, user-item, categorical. Backbone of MinHash dedup. Pitfall: binary version ignores multiplicity; sensitive to set-size disparity.
- **Overlap**: |A∩B|/min(|A|,|B|) → 1 if subset (size-imbalance friendly; not a metric). **Dice**: 2|A∩B|/(|A|+|B|) = 2J/(1+J); Dice distance NOT a metric (unlike Jaccard).
- **Hamming**: # positions differing (equal-length). Metric. Use: binary codes, SimHash/LSH buckets, error-correcting, categorical one-hot.
- **Edit/Levenshtein**: min insert/delete/substitute. Metric. Range [0,max(|s|,|t|)]. Use: spell-check, fuzzy match, bioinformatics. Pitfall: O(nm) DP; not for long docs (use shingling+MinHash). DP-matrix walkthrough is a great worked example.
- **KL divergence**: D_KL(P‖Q)=ΣP log(P/Q). ASYMMETRIC, unbounded (→∞ when Qᵢ=0,Pᵢ>0), not a metric. **JS divergence**: ½D_KL(P‖M)+½D_KL(Q‖M), M=½(P+Q). Symmetric, bounded [0,log2]; JSD not a metric but √JSD IS. Use: comparing distributions (topic models, LM outputs, drift detection).
- **Pearson correlation**: r = cosine of MEAN-CENTERED vectors. Range [−1,1]. Use: collaborative-filtering (centering removes per-user rating bias). 1−r not a metric.
- **Earth Mover's / Wasserstein** (brief): W₁ = min "work" to morph P→Q, respects ground geometry (unlike KL/JS). Metric. Use: image retrieval (color signatures), WGAN, OT over embeddings. Cost O(n³log n) exact (Sinkhorn approx).

## 2. Relationships (cosine ↔ dot ↔ Euclidean)
- ‖x−y‖² = ‖x‖² + ‖y‖² − 2xᵀy.
- **Unit-norm equivalence** (‖x‖=‖y‖=1): ‖x−y‖² = 2 − 2xᵀy = 2(1−cosθ). → on the unit sphere, ranking by cosine↑ ⇔ dot↑ ⇔ squared-Euclidean↓ ⇔ neg-L2↑ — IDENTICAL NN ordering. (Why cosine search = IP after normalization.)
- **DISAGREE when NOT unit-norm**: dot rewards magnitude, cosine ignores it, Euclidean mixes. Counterexample: a=(1,1), b=(10,10) → cos=1 (identical direction) but ‖a−b‖₂≈12.7 (very far), aᵀb=20 vs aᵀa=2. **Magnitude is where they part ways.**
- Conversions: cosine ⇒ normalize then IP/L2. Vector DB cosine = store L2-normalized + pick IP (or L2) metric.

## 3. Sparse vs dense
- Sparse sets/bags → Jaccard + hashing: **MinHash** (Broder 1997, AltaVista dedup) Pr[min h(A)=min h(B)]=J(A,B); k-perm signatures, LSH banding → sublinear near-dup at web scale (still used in LLM training-data dedup). **SimHash** (Charikar) random-hyperplane LSH; collision prob = 1−θ/π → estimates COSINE; compare via Hamming of fingerprints (Google web near-dup). Rule: MinHash↔Jaccard(sets); SimHash↔cosine(dense).
- Dense embeddings → cosine/dot + ANN (HNSW, IVF-PQ in FAISS).

## 4. Corner cases & pitfalls (THE MAIN GAP — emphasize)
- **(a) Curse of dimensionality / distance concentration** (Beyer 1999): as d→∞, (dist_max − dist_min)/dist_min → 0 → nearest & farthest become equidistant → "nearest neighbor" loses meaning; slight perturbations flip NN. Property of concentration of measure, affects all Lp. (Aggarwal 2001: lower-p retains contrast; Mirkes 2020: fractional doesn't truly cure.)
- **(b) Hubness** (Radovanović JMLR 2010): in high-d the distribution of k-occurrences (how often a point is in others' kNN lists) becomes right-skewed → a few HUBS appear in almost everyone's neighbor list, anti-hubs in none. Damages kNN classification/retrieval/recommendation. Fixes: mutual proximity, local/global scaling, mutual-kNN graphs.
- **(c) Anisotropy of contextual embeddings** (Ethayarajh 2019): BERT/GPT-2 reps occupy a NARROW CONE → two RANDOM tokens have avg cosine ≫ 0 (→1 in upper GPT-2 layers) → raw cosine INFLATED/misleading. Fixes: whitening / BERT-flow / standardization, or contrastive training for isotropy.
- **(d) Why dot product (not cosine) in trained retrieval**: DPR/dual encoders score raw E_Q(q)ᵀE_P(p). Cosine forces unit norm, discarding magnitude the model may encode (specificity/length/confidence). Cosine "prefers short documents". (Caveat: cosine=dot after normalization, so gaps sometimes reflect WHETHER you normalize.)
- **(e) Triangle inequality & ANN**: metric trees/ball trees/pivot indexes prune via triangle ineq → need a true metric. Cosine distance, KL, JS, Dice, raw IP violate it → convert (angular distance, √JSD, normalize for cosine→L2) or use graph ANN (works empirically); MIPS needs ALSH.
- **(f) Normalization pitfalls**: forgetting to L2-normalize ⇒ "cosine" silently becomes IP; normalizing destroys magnitude when meaningful (recsys popularity, retrieval confidence); standardize before Euclidean/k-means, not before cosine on TF-IDF.
- **(g) Steck, Ekanadham, Kallus 2024 — "Is Cosine-Similarity Really About Similarity?"** For regularized linear matrix factorization, a diagonal "gauge" matrix D leaves dot-product PREDICTIONS invariant but changes COSINE similarities → cosine of learned embeddings can be ARBITRARY/non-unique. Recs: train directly against cosine (layer-norm), or prefer unnormalized dot, or apply cosine to the reconstruction, or standardize/whiten before learning. (2026 rebuttal "In Defense of Cosine Similarity": normalization removes the gauge freedom — good class debate.)

## 5. Applications (measure / why)
- kNN retrieval (dense): cosine/IP → ANN.
- Semantic search / RAG: cosine on normalized sentence embeddings; dot for trained dual encoders.
- Near-duplicate / dedup: Jaccard via MinHash; cosine via SimHash.
- Plagiarism: Jaccard/containment (shingles) + edit distance.
- Clustering: squared-Euclidean (k-means), cosine (spherical k-means), Mahalanobis.
- Recommendation/CF: Pearson (mean-centered), cosine, learned dot.
- Image search: Euclidean/cosine on CNN features; EMD on color/SIFT histograms.
- Distribution comparison / drift: KL, JS (√JSD), Wasserstein.
- Spelling / fuzzy match: Levenshtein.

## 6. Practical (FAISS / vector DBs / numerics)
- FAISS: METRIC_L2 (returns SQUARED L2 — no sqrt), METRIC_INNER_PRODUCT; also L1/Linf/Lp/Canberra/BrayCurtis/JensenShannon/Mahalanobis. **No native cosine** → L2-normalize + IndexFlatIP. Forgetting to normalize = silently wrong.
- Pinecone/Weaviate/Milvus: cosine/dotproduct/euclidean. Match metric to how the embedding model was TRAINED (most sentence models → cosine; some retrievers → dot).
- Numerics: cosine undefined for zero vector (add ε); catastrophic cancellation in ‖x‖²+‖y‖²−2xᵀy for far-apart large vectors; KL needs smoothing for zero bins; pre-normalize once, store unit vectors.

## 7. Visualization ideas (doodle)
1. Two 2D vectors + angle θ, cosθ annotated (canonical).
2. Magnitude-vs-direction counterexample: a=(1,1), b=(10,10) on same ray — cosine says "identical", dashed Euclidean segment says "very far".
3. Unit-circle collapse: same vectors projected onto unit circle, arc ∝ θ — "cosine == dot == neg-L2 after normalization".
4. Distance-concentration histogram series d=2,10,100,1000 — spread collapses to a spike.
5. Hubness skew bar chart (most points low, few towering "hub" bars).
6. Two overlapping circles (Venn) |A∩B|/|A∪B| Jaccard; 2nd panel Dice 2|A∩B|.
7. MinHash signature strip (two shingle sets → minhash rows → fraction matching ≈ Jaccard).
8. Anisotropy cone (embeddings in narrow cone, high avg cosine → arrow → whitened isotropic ball). Optional SimHash random-hyperplane slicing 2D points into sign bits.

## 8. Sources
- Steck, Ekanadham, Kallus 2024 — Is Cosine-Similarity Really About Similarity? https://arxiv.org/abs/2403.05440
- "In Defense of Cosine Similarity" (2026 rebuttal).
- Aggarwal, Hinneburg, Keim 2001 — surprising behavior of distance metrics in high-d.
- Beyer et al. 1999 — When is nearest neighbor meaningful?
- Radovanović, Nanopoulos, Ivanović JMLR 2010 — Hubs in Space.
- Mirkes et al. 2020 — fractional norms don't cure the curse.
- Ethayarajh 2019 — contextual embeddings anisotropic (narrow cone) https://ai.stanford.edu/blog/contextual/
- Su et al. 2021 — Whitening Sentence Representations.
- Shrivastava & Li NIPS 2014 — Asymmetric LSH for MIPS https://arxiv.org/abs/1405.5869
- Karpukhin et al. 2020 — DPR (dot product retrieval).
- FAISS Wiki — MetricType and distances.
- MinHash (Broder 1997); Jensen–Shannon divergence.
- Manning IIR ch.6 — vector space, TF-IDF, cosine scoring.
- scikit-learn pairwise metrics; Weaviate distance-metrics explainer.

### Biggest emphasis (requested): the NON-cosine measures w/ formulas+pitfalls; the exact unit-sphere equivalence + when magnitude breaks it; sparse-vs-dense (MinHash/SimHash); the high-dimensional corner cases (concentration, hubness, anisotropy, dot-vs-cosine, triangle-ineq/ANN, Steck 2024 critique); applications table; FAISS notes. (Old L1 already had: similarity decision-tree, Euclidean/Manhattan worked, Levenshtein DP, dot-product worked — port + deepen.)
