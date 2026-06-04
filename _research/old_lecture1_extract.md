# OLD Lecture 1 (Summer 2025) — full slide-by-slide extract (126 slides)

> Source: old_slides/Lecture 1.pdf. Use as inspiration for the NEW deeper decks. Visual identity: white bg, light-gray top band, teal+orange underline accent above titles, full-bleed ORANGE slides for section breaks/rhetorical questions, heavy use of real Jupyter screenshots (with exec badges "0.0s/1.1s" + green checks).

## PART A — COURSE INTRO (1–13)
- 1 Title; 2 Instructor bio (photo + bullets: MSc Robotics&CV Innopolis 2021; PhD DL & BCI; teaches Prob&Stats, DSP, ML, DL @ Innopolis/SPSU/HSE; ML for Banking; MTS RnD Agentic AI).
- 3 **Course Aims** (full TOC): NLP; Similarity Search; Deep Learning; Ranking/Relevance/Retrieval; ML System Design; Metrics of Search; RAG.
- 4 Books: Teofili "Deep Learning for Search"; Turnbull&Berryman "Relevant Search".
- 5 Logistics + grade table. Line: "I expect a lot of collaboration from your side!!!"
- 6 Orange quote "I will make your life miserable — Prof. Adil Khan".
- 7 **What is search?** 3 real screenshots side by side: Google ("rag wikipedia"), Ozon ("lego technic", ruble prices), Yandex Neuro answering "how many legs does a horse have?" → WRONG "8 legs" (hallucination hook). Thesis line: **"All of that is search + a little bit of RecSys (which are almost the same)."**
- 8–9 "Why make search better?" → imagery of stacks of $100 bills (money = business value). [Glossed — replace with real revenue/engagement stats.]
- 10–11 **Spine of the course**: 3 boxes "Get Data ↔ Measure of Similarity ↔ To Rank response" with "How?" overlaid on every box/arrow. RECURRING MENTAL MODEL.
- 12–13 Tooling logos OpenSearch/Elasticsearch/Qdrant → then big orange X over them (gag: we build understanding, not just use engines).

## PART B — NLP BASICS (14–42), all with live code
- 14 Index: Tokenization, Stemming, Lemmatization, Ngrams, Stop-words, Regex, Bag of Words.
- 15 Libs: NLTK, TextBlob, spaCy, Gensim, PyTorch, Keras. Gotcha visual: 1 Arabic word عقد written 6 ways → 6 English meanings (Necklace/Decade/Contract/Held/Complicated/Knots). "1 arabic word = 6 meanings".
- 16–21 Tokenizers walked through with code+output: sent_tokenize vs word_tokenize; wordpunct; TreebankWordTokenizer (do/n't contraction); TweetTokenizer (keeps emoji 😂👌); MWETokenizer ("Hunger","Games"→"Hunger_Games").
- 22–23 Stemming vs Lemmatization (Porter vs WordNet). "seen"→stem seen/lemma see; "drove"→stem drove/lemma drive.
- 24–25 Ngrams ("This is a sentence" N=1/2/3 diagram; nltk.util.ngrams).
- 26–27 Stop-words (nltk stopwords, STOP-sign icon, the real 179-word list screenshot).
- 28–30 Regex cheat-sheet (. \w \d \s [abc] [^abc] [a-g]); interactive "What will print produce?" cyan banner; answer.
- 31–42 **Bag of Words → cosine** (conceptual climax): "ML cannot deal with raw text → convert to vectors"; "similar documents have similar content". CountVectorizer worked (gotcha: default token pattern drops single-char tokens 'I','s'). Canonical BoW matrix diagram (docs×vocab, "each row=document, each column=word"). Sparsity fixes (lowercase, drop punct/stopwords, lemmatize, fix spelling). "documents are points in a multi-dimensional vector space, same length → measure distance". Cosine formula cos θ = a·b/(‖a‖‖b‖) + 3-angle panel (θ≈0 sim, 90 orthogonal, 180 opposite). `cosine_sim` code. End-to-end: doc0 vs doc1 → **Similarity score 0.516**.

## PART C — MEASURES OF SIMILARITY (43–75)  ← PORT INTO NEW LECTURE 2
- 44 "a lot of them; not just vectors (everything is a vector if you try hard enough); some scale-sensitive; 3 groups: distance-based, feature-based, probabilistic." Office meme "they're the same picture".
- 45 **Similarity DECISION TREE**: Data type → Non-numerical→Cosine; Continuous→Scaled? N→Manhattan / Y→Euclidean; Categorical→Jaccard; Ordinal→Spearman; Multivariate→Pearson. (reusable)
- 46 "Distance is almost a metric": Euclidean, Manhattan, Minkowski, Chebyshev.
- 47–49 **Euclidean** worked: d²=(q1−p1)²+(q2−p2)²; right-triangle diagram; "Try: P(3,2),Q(4,1)" → **√2 ≈ 1.4142**. code np.linalg.norm(a−b).
- 50–52 **Manhattan** worked: staircase-vs-diagonal grid; d=Σ|aᵢ−bᵢ|; "useful for high-d (why?)"; "Try: P(2,9),Q(3,5)" → **5**. Citation: Aggarwal/Hinneburg/Keim ICDT 2001 "surprising behavior of distance metrics in high-d".
- 53 Minkowski & Chebyshev SKIPPED "due to time" [EXPAND in new deck].
- 54–58 **String distances**: list Levenshtein/Damerau/Lee/Hamming/Jaro/Jaro-Winkler. Levenshtein: 3 ops (sub/ins/del), weighted, "autocorrection/misspelling". Full recursive formula. **DP-matrix walkthrough HONDA × HYUNDAI empty→filled → answer 3** (6-step procedure). GILY/GEELY example.
- 59–61 **Dot product** family: cosine (angle) vs squared-Euclidean vs dot (angle+magnitude) vs Manhattan — 2×2 panel of formulas. "When NOT to use dot product?" Worked: u=2i−3j, v=4i+2j → **a·b = 2**.
- 62 Break.
- 63–75 **Image similarity** (broad survey): factual vs semantic; image formation; grid of 0–255 intensities; pixel info types (grayscale/RGB/depth/medical/thermal); depth encoding R=256mm/G=1mm/B=1/256mm; color spaces RGB/CMY/YUV/YCrCb/CIE XYZ/Lab/HSV/HLS/HSI; **MSE** formula; **SSIM** formula (μ,σ,σxy); feature-based SIFT/SURF/ORB; invariance limits (Doge augmentation grid: crop/rotate/flip/blur/color/affine/noise); embeddings-based: cat/dog → Model → Embedding → points in space; t-SNE breed scatter; **TensorFlow Similarity** system diagram (query img → inference → embedding → ANN index lookup + metadata → similar items). Link: blog.tensorflow.org/2021/09/introducing-tensorflow-similarity.html

## PART D — DEEP LEARNING FUNDAMENTALS (76–102)
Biological neuron; linear classifier/perceptron (margin, w·x+b); single neuron y=w0+Σxᵢwᵢ; logistic/sigmoid; **activation zoo** (step/sigmoid/tanh/ReLU/LeakyReLU/ELU/softmax/softplus, plotted); cost & update rules w←w−η∂C/∂w; linear-regression cost J=(1/2m)Σ(h−y)²; gradient descent (convex vs non-convex, local vs global minimum trap, 3D loss surface); backprop chain-rule build-up (stops at last-layer δᴸ — never reaches earlier layers [EXPAND]).

## PART E — WORD2VEC (103–110)  [for a later lecture, but good background]
king/queen analogy trio; CBOW vs Skip-gram; "Word2Vec: take hidden weights as embeddings, toss the rest"; 10,000-vocab × 300-hidden architecture; one-hot×matrix = row lookup ([0 0 0 1 0]×5×3 → [10 12 19]); skip-gram sliding-window training pairs from "The quick brown fox…".

## PART F — PCA / SHRINKING EMBEDDINGS (111–124)  ← BEST SYSTEM-DESIGN ARC, MODEL FOR ML-SYS-DESIGN FRAMING
- 112 **Given/Task**: DB of **371M records (2 languages)**, short strings, **SLA 1 second**. Task: top-100 matches for a query + measurable score.
- 114 Resource ledger "BEFORE": DB 371M ≈ 50GB text; LLM float64 embedding len **784** multilang; Vector DB float64 shape (371M, 784); pain: "lots of memory for inference", "no GPU inference".
- 115–116 Feature table (man/woman/king/queen × living/feline/human/gender/royalty/verb/plural); "Assumption: not all features critical" → drop columns.
- 117–123 **PCA step by step**: principal+orthogonal component; scree + cumulative scree plot (elbow rule); Step1 standardize z=(x−μ)/σ; Step2 covariance matrix (Var, Cov formulas); Step3 eigenvectors/eigenvalues; Step4 elbow rule pick #components.
- 124 Resource ledger "AFTER": embedding len **24** (from 784), shape (371M,24), pains annotated "(no problem)". PAYOFF.

## PART G — WRAP (125–126)
HW1 (read Mikolov "Distributed Representations of Words and Phrases", hand-written 2-page essay, redo BoW example by hand). "Tomorrow: Tokenization in details; Embeddings in details."

## WHAT TO PORT (made it good)
1. The "Get Data ↔ Measure Similarity ↔ Rank" spine + "How?" overlays as recurring model.
2. Live Jupyter screenshots w/ exec badges for every algorithm.
3. Socratic "Try / Question / Answer / Exercise" prediction beats; cyan "what will print?" poll.
4. **PCA system-design case study** (371M, 784→24, 1s SLA, before/after ledger) — frame each technique as the FIX to a measured pain point. Best pedagogical arc — reuse pattern in ML-Sys-Design.
5. Reusable visuals: BoW matrix; cosine 3-angle panel; similarity DECISION TREE; Manhattan-vs-Euclidean grid; Levenshtein DP empty→filled; activation zoo; king/queen trio; Word2Vec architecture; skip-gram window; scree plots.
6. Framings: "everything is a vector if you try hard enough"; "similar docs have similar content"; "search ≈ RecSys"; Word2Vec "toss the rest"; Office "same picture"; Doge augmentation grid for invariance.
7. Real REGIONAL product screenshots (Google/Ozon/Yandex) + the wrong-LLM-answer hook into RAG/hallucination.
8. Citations on slides: Aggarwal ICDT 2001 (high-d distance); Mikolov word2vec; TensorFlow Similarity blog.
