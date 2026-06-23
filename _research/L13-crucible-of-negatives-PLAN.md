# L13 — “The Crucible of Negatives” · Lecture blueprint **v4** (consolidated)

*Deep-dive #1 after the core L0–L12. Hard negative mining in contrastive learning for dense retrieval.
Status: PLAN — researched, reviewed (3 passes), consolidated; not yet built. Every number is verified
from primary sources (6-cluster literature sweep); confidence flags carried into the facts-gate.*

> **v4 note.** This is the single source of truth — the prior directive layers (R2/R3 from three review
> rounds) are folded in; there is now ONE slide numbering (§4), ONE widget count (§5: 4 interactive + 3
> static figures), ONE budget (~80 slides). Revision history is one line at the end. Build from this doc.

---

## 0. Thesis · hook · objectives

**Thesis.** *A dense retriever is forged by the opponents it trains against. Easy negatives teach
nothing (no gradient); the hardest are often impostors — unlabeled positives — that corrupt the blade;
effectiveness lives in a narrow “hard-but-honest” band, and the 15-year history of the field is the
search for it.*

**Hook (the paradox students live).** Two teams run the *same* DPR code; one gets NQ top-20 ≈ 64, the
other ≈ 78 — same architecture, same data, only the **negatives** differ (both rows are Karpukhin
Table 3, same model). The reveal *on the same slide* is Karpukhin’s sentence: *“how to select negative
examples is often overlooked but could be decisive.”* That sentence is the lecture.

**Objectives — a student can:**
1. Explain *why* contrastive retrieval needs negatives (collapse without them) and read an InfoNCE loss
   off a batch similarity matrix by hand.
2. Place a negative on the **2×2 grid** — *geometric hardness* `cos(q,d⁻)` **×** *label correctness*
   (true / false = unlabeled positive) — and predict its gradient contribution. The axes are ORTHOGONAL.
3. Trace the arc (random → in-batch → BM25-static → ANCE-dynamic → denoised → distilled → modern
   two-stage) and name the *specific failure* each step fixes.
4. Diagnose a weak dense retriever (“is it a negatives problem?”) and choose a strategy under real
   compute/label constraints.

**Glossary (pinned on the objectives slide — “hard” is overloaded 4 ways):** *geometric-hard* (high
`cos(q,·)`) · *BM25-hard* (lexical) · *dynamic-hard* (the model’s own current near-miss) · *false*
(an unlabeled positive — a **label** property, not a distance).

**Position.** Reuses L5 (word2vec NEG — students met it), L6 (InfoNCE, attention), L7 (bi-/cross-encoders,
in-batch-negatives widget; DPR/ANCE/E5 cited), L9 (the ANN index ANCE mines). Sets up sibling deep-dive
**#4 “The Curved Map”** (anisotropy/hubness) via the alignment–uniformity bridge.

---

## 1. Narrative + mascots

**Metaphor — the forge / the duel (Acts 0–3), pivoting to tutelage (Acts 4–5).** Séréga is a blade
being forged; the **Crucible** is the training loop; negatives are sparring opponents. Easy = dull
practice; the toxic-hardest = an **Impostor** (enemy’s mask over an ally’s badge — a false negative).
At the Act-4 divider the frame pivots **duel → master-smith**: distillation is *teaching* (the
cross-encoder teacher grades the apprentice’s blows), not dueling — honest coverage of the back half.

**Mascots — LOCK in `_research/mascots.py` before drawing (image-gate):**
- **Séréga** — blade/protagonist (reused; ≥40% of plates incl. hero S1 + final).
- **The Impostor / «Самозванец»** *(NEW)* — masked figure; mask half-lifted shows the *positive* badge.
- **The Sparring Ghosts / «Призраки спарринга»** *(NEW)* — translucent faded duelists = stale negatives
  (ANCE between refreshes).
- Reuse **Sir Cosine** (geometry), **Goodhart** (cameo: optimising a metric the labels can’t see).

GREEN only on Séréga’s tübetey. Hero plate (S1) + final plate both feature Séréga.

---

## 2. The running spine example — “Séréga’s sparring lineup” (one toy, every act)

ONE query + positive + a fixed, named set of five candidate negatives, with TWO cosine axes. Every ⊗
calc, every widget, the experiment, operate on these six vectors.

**Two axes (not the same thing):** `cos(q,·)` = *hardness* (how high the miner ranks it); `cos(·,d⁺)` =
*collateral danger* (pushing it away drags the true positive — the corrupting gradient scales with
this). A false negative is dangerous on the **second** axis, which a query-only view never shows.

> **Query q:** *“how long to boil an egg”* — **Positive d⁺:** *“Soft-boiled eggs take ~6 minutes in
> boiling water.”* (cos(q,d⁺)=0.82)
>
> | name | passage (abbrev.) | cos(q,·) *hardness* | cos(·,d⁺) *collateral* | cell |
> |---|---|---|---|---|
> | **n₁ random** | “The 2008 financial crisis…” | 0.05 | 0.03 | easy · true |
> | **n₂ in-batch** | “Best way to scramble eggs.” | 0.41 | 0.37 | semi-hard · true |
> | **n₃ BM25-hard** | “How long to hard-boil potatoes?” | 0.63 | 0.34 | hard · true (lexical to q, ≠ d⁺) |
> | **n₄ dynamic-hard** | “How long must you boil drinking water to make it safe?” | **0.75** | **0.31** | hard · **TRUE** (confuses q via “how-long-to-boil”; content far from *eggs*) |
> | **n₅ IMPOSTOR** | “Eggs need roughly six minutes in simmering water.” | **0.79** | **0.80** | hard · **FALSE** (a paraphrase of d⁺) |

**The lesson is n₄ vs n₅:** both are hard to the query (0.75 / 0.79 — the miner grabs both), so hardness
*alone cannot tell them apart*. They split on the second axis: n₄ `cos(·,d⁺)=0.31` (water-safety ≠ eggs)
→ safe to push away (the worthy opponent); n₅ `cos(·,d⁺)=0.80` (a paraphrase of d⁺) → pushing it away
**drags d⁺ with it** (the impostor). **The danger is invisible on the hardness axis — you need
`cos(·,d⁺)` or the relevance label.** That is the 2×2 made visceral. *(Cosines illustrative; final gated
values come from `gen_l13`, which MUST produce this `cos(·,d⁺)` split — n₄ low, n₅ high.)*

Threads: **Acts 0–3 + the experiment** (continuous), plus ONE back-half hook at S48–49 (the teacher’s
margin on (d⁺,n₅) goes negative → reverses the impostor). Acts 4–5 otherwise operate at the method level.

---

## 3. Verified research foundation (facts that get gated)

Confidence: **[V]** verbatim primary source; **[~]** secondary/derived — gate carefully.

### Foundations
| Work | Cite (verified) | Iconic asset |
|---|---|---|
| NCE | Gutmann & Hyvärinen, **AISTATS 2010**, PMLR v9:297–304 (**no arXiv**) | “learn by contrasting data vs noise” — the taproot |
| word2vec NEG | Mikolov et al., NIPS 2013, **arXiv:1310.4546** | NEG objective; **k=5–20**/2–5; noise **∝U(w)^{3/4}** [V] |
| Triplet/FaceNet | Schroff et al., **CVPR 2015**, **arXiv:1503.03832** | **α=0.2** [V]; semi-hard band **‖a−p‖²<‖a−n‖²<‖a−p‖²+α** [V]; hardest negs **can collapse training** [~ empirical, not a theorem] |
| N-pair | Sohn, **NIPS 2016** (**no arXiv**) | one-neg → **N−1 negs** in a softmax = in-batch [V] |
| InfoNCE/CPC | van den Oord et al., **arXiv:1807.03748** (tech report, **no venue**) | **I ≥ log N − L_N** (L_N=optimal loss; **saturates at log N** → N raises the MI *ceiling*; do **NOT** say “tighter / maximises MI” — caveat **Poole et al. 2019, arXiv:1905.06922**) [V] |
| SimCLR | Chen et al., **ICML 2020**, **arXiv:2002.05709** | NT-Xent; **2(N−1)** negs/pair; batch 256→8192; **τ=0.1** (App. B.1) [V; τ varies 0.05–0.1 by paper — teach the mechanism] |
| MoCo | He et al., **CVPR 2020**, **arXiv:1911.05722** | queue **K=65536**, momentum **m=0.999**, **τ=0.07** [V] |

### DPR — the negative-strategy ablation (spine numbers) [V]
Karpukhin et al., **EMNLP 2020**, **arXiv:2004.04906**, DOI 10.18653/v1/2020.emnlp-main.550. Three
negative types: random / BM25 / gold-in-batch (in-batch = the B×B similarity matrix → B−1 free negs/query).
Encoders 2× BERT-base [CLS], d=768, dot product, NLL, batch 128 + 1 BM25.
- **Table 3 (NQ dev, top-20):** Gold 7 no-in-batch **63.1** → Gold 7 in-batch **69.1** → Gold 127 in-batch
  **73.0** → **G.+BM25(1) best 78.0** (top-5/20/100 best = 65.8/78.0/84.9; a 2nd BM25 neg does **not** help).
- **Table 2 (NQ test top-20):** **DPR 78.4 vs BM25 59.1** (DPR wins everywhere except SQuAD).
- Takeaway: *negative selection is decisive, not architecture; no ICT/REALM pretraining needed.*

### Dynamic / global negatives
- **ANCE** — Xiong et al., **ICLR 2021**, **arXiv:2007.00808** [V]. Async index refresh (**every 10k
  batches**; smooths at 5k); mine 1 neg from ANN top-200. Mined-vs-true-hard overlap: **in-batch ~0% ·
  BM25 15% · ANCE 63%→100%**. `P(random batch even contains a true-hard neg) ≈ b·|D*|/|C| ≈ 0`. **MARCO
  dev MRR@10 = 0.330** (Rand .261/NCE .256/BM25 .299/DPR .311); NQ top-20 **81.9** > 78.4. ~100× cheaper
  than a CE cascade. (Don’t use the fabricated `|C|²` form; the real WHY = gradient-norm theory.)
- **STAR+ADORE** — Zhan et al., **SIGIR 2021**, **arXiv:2104.08051** [V]. Static (incl. ANCE) vs
  **dynamic** (per-step). ADORE: freeze the doc index, train the *query* encoder → genuinely-current hard
  negs, LambdaLoss. **ADORE+STAR MRR@10 = 0.347**; **179× faster**. Fig.4: static negs drift to easy →
  periodic MRR fluctuation. **DEBATE [present as separable, not a field split]:** ANCE attributes the gain
  to *convergence* (gradient-norm); STAR/ADORE add a *staleness fix* (per-step) **and** a *different
  objective* (top-K) — those are two contributions, not a refutation that hard negs help. *(ANCE’s MRR is
  re-evaluated 0.338 in this paper — cite 0.330 as ANCE’s own; 0.338 only inside their table.)*

### False negatives · denoising · sweet spot
- **RocketQA** — Qu et al., **NAACL 2021**, **arXiv:2010.08191** [V]. MS MARCO has **~1.1 positives per
  query** vs an **8.8M**-passage collection; **~70%** of unlabeled top-retrieved are actually relevant.
  **THE KILLER ABLATION (MS MARCO dev MRR@10):** in-batch **32.39** → *+undenoised* hard negs **26.03
  (DROPS below in-batch!)** → *+denoised* (cross-encoder filter) **36.38** → *+augmentation* **37.02**.
  Three tricks: cross-batch (A×B−1), cross-encoder denoising, data augmentation. *(Rows fold in cross-batch
  — the drop is the joint effect of harder-but-noisier negs.)*
- **SimANS** — Zhou et al., **EMNLP 2022**, **arXiv:2210.11773** [V]. Gradient analysis: easy→mean≈0;
  too-hard→variance↑↑ (false negs); ambiguous = sweet. Sampler **p_i ∝ exp(−a·(s(q,d_i) − s(q,d⁺) − b)²)**,
  they use **a=0.5, b=0** (centre at the positive’s score). It **softens** false-neg dominance but, at the
  same `cos(q,·)`, **cannot separate a hard-true from a hard-false** — only a label can.
- **AR2** — Zhang et al., **ICLR 2022**, **arXiv:2110.03611** [V]. Minimax retriever–ranker; the
  noise-robust ranker damps false-neg harm. **MARCO MRR@10 39.5**; **AR2+SimANS 40.9**.

### Distillation & principled sampling
- **Margin-MSE** — Hofstätter et al., **arXiv:2010.02666** (preprint, **no venue**) [V]. Distil the
  **margin** `MSE(S(q,p⁺)−S(q,p⁻), T⁺−T⁻)`, not 0/1 — soft, scale-free, **a negative teacher margin
  reverses a mislabeled pair** (graceful with false negs). Ensemble of 3 BERT_cat teachers.
- **TAS-B** — Hofstätter et al., **SIGIR 2021**, **arXiv:2104.06967**, DOI 10.1145/3404835.3462891 [V].
  **Topic-aware sampling:** cluster the ~400K queries (k-means 2000) once (<10 min); draw each batch from
  **one cluster** → in-batch negs are on-topic = **hard for free**, no index refresh. + balanced margin +
  dual teacher (BERT_cat pairwise + ColBERT in-batch, both Margin-MSE), α=0.75. **Single 11GB GPU, <48h;
  MARCO dev MRR@10 = 0.340.** BEIR: **−2.8% vs BM25**, beats ANCE 14/18, DPR 17/18 [V].

### Theory · unsupervised · modern
- **Alignment & Uniformity** — Wang & Isola, **ICML 2020**, **arXiv:2005.10242** [V]. `L_align=E‖f(x)−f(y)‖^α`,
  `L_uniform=log E e^{−t‖f(x)−f(y)‖²}` (lower=better both); contrastive loss → these two terms.
- **Hardness-aware τ** — Wang & Liu, **CVPR 2021**, **arXiv:2012.09740** [V]. Negative gradient =
  **Boltzmann scaled by 1/τ**: `∂L/∂s_{ij} ∝ (1/τ)·softmax_k(s_{ik}/τ)_j` (the 1/τ IS the hardness
  amplifier). **τ→0 ⇒ nearest-negative hard-max** (the neg a triplet would pick — *not literally* triplet
  loss); **τ→∞ ⇒ all-equal AND weak.** Small τ → more uniform, less tolerant (uniformity–tolerance dilemma).
  *Hard negatives drive uniformity* (hedge: too much → hubness → deep-dive #4). **THE CENTRAL LENS:** a
  negative is worth exactly its gradient; ANCE’s `‖∇l‖²` and SimANS’s mean/variance are VIEWS of this.
- **SimCSE** — Gao, Yao, Chen, **EMNLP 2021**, **arXiv:2104.08821** [V]. Unsup: dropout=positive, in-batch
  negs → **STS 76.3**; sup: NLI **contradiction = hard negative** → **81.6**. Flattens the embedding
  spectrum (counters anisotropy).
- **Contriever** — Izacard et al., **TMLR 2022**, **arXiv:2112.09118** [V] (TMLR, not a conf). Unsup
  contrastive IR (MoCo queue + cropping).
- **Anisotropy bridge** — Ethayarajh **EMNLP 2019, arXiv:1909.00512**; Gao et al. (representation
  degeneration) **ICLR 2019, arXiv:1907.12009** [V]. Raw LM embeddings = narrow cone; uniformity flattens it.
- **Modern two-stage** — **E5** (Wang et al., arXiv:2212.03533): in-batch **32,768** then mined hard negs +
  CE distillation. **GTE** (Li et al., arXiv:2308.03281): *“with hard negatives a large batch is
  unnecessary.”* **BGE/C-Pack** (Xiao et al., **SIGIR 2024**, arXiv:2309.07597): big in-batch pretrain → +1
  ANN-mined hard neg fine-tune. **GradCache** (Gao et al. 2021, **arXiv:2101.06983**) = the systems trick
  that makes 32K in-batch affordable (ties to the MoCo decouple-negatives thread). Pattern: **massive
  in-batch (uniformity) + a few mined-and-filtered hard negs (the boundary)**. **⚠ Do NOT display precise
  MTEB scalars** (leaderboard, not reproducible from `data/`) — say “competitive with much larger-batch
  models.” Reuse existing `papers.json` ids/venues verbatim.

---

## 4. Slide plan — **80 slides, 7 acts** (single canonical numbering; **(W#)** widget, **(F#)** static figure, **⊗** worked calc)

**ACT 0 — The paradox (S1–6)**
- S1 *title* — hero plate (Séréga at the forge).
- S2 *objectives* — the 4 objectives + the **hardness glossary** (4 senses of “hard”).
- S3 *viz* — the paradox: same DPR code, **64 vs 78** (both Karpukhin Table 3, same model) → reveal the Karpukhin quote *on this slide*.
- S4 *viz* — the **GPS map** (timeline 2010→2024: NCE→…→modern); recurs as a progress strip.
- S5 *viz* — introduce **Séréga’s lineup** (q, d⁺, n₁–n₅, both cosine columns).
- S6 *divider P1* — “Why opponents at all?”

**ACT 1 — Why negatives (S7–13)** *(compressed: L5/L6 already taught InfoNCE + in-batch)*
- S7 *viz* — pull q→d⁺, push q→d⁻; **without negatives → collapse** (Sir Cosine).
- S8 *viz* — the lineage in one refresh slide: NCE (data vs noise) → **word2vec NEG** (L5 callback: k=5–20, **3/4-power** noise) → InfoNCE.
- S9 *formula* — **InfoNCE** as “pick the positive out of N”; the log-bilinear score.
- S10 *e2e ⊗* **(W1 infonce-calc)** — the **4×4 matrix on the lineup**, softmax, loss; slider τ, N; the bound **I ≥ log N − L_N** (saturates at log N — the “why scale negatives,” NOT “maximises MI”).
- S11 *viz* — in-batch trick (N-pair→SimCLR→DPR): **B×B matrix**, B−1 free negs; **temperature τ** (mechanism, not the constant — varies 0.05–0.1); **MoCo** queue one-liner (decouple #negs from batch).
- S12 *quiz* — more negatives in one step: batch-64 in-batch vs a 65k MoCo queue?
- S13 *divider P2* — “The geometry of hardness.”

**ACT 2 — Geometry of hardness (S14–23)**
- S14 *viz* **(W2 hardness-sphere)** — easy/semi-hard/hard on the unit circle; plot n₁–n₅ at their `cos(q,·)`.
- S15 *formula* — FaceNet inequalities incl. the explicit **semi-hard band** `‖a−p‖²<‖a−n‖²<‖a−p‖²+α`; **α=0.2**.
- S16 *viz* — the toxic-hardest (FaceNet): hardest negs **can collapse training** [~ empirical] → semi-hard/curriculum. *Label it the **optimization** failure of a **real** negative; foreshadow Act 3’s darker **labeling** failure.*
- S17 *e2e ⊗* — gradient view: easy neg → ≈0 gradient. Compute on the spine’s **n₂ (0.41) vs n₄ (0.75)**.
- S18 *formula* — **THE CENTRAL LENS — Wang-Liu Boltzmann ×1/τ:** `∂L/∂s_{ij} ∝ (1/τ)·softmax_k(s_{ik}/τ)_j`. “A negative is worth exactly its gradient.” **(W2 live)**.
- S19 *viz + quiz* — τ→0 ⇒ nearest-neg hard-max; τ→∞ ⇒ all-equal & weak; uniformity–tolerance. Quiz: ratio **w(n₄ at 0.75):w(n₂ at 0.41)** from τ=0.5→0.1.
- S20 *viz* — **ANCE’s quantification**: mined-vs-true-hard overlap **0% / 15% / 63→100%**; `P(batch has a true-hard) ≈ b·|D*|/|C| ≈ 0`. (The real WHY = gradient-norm, the S18 lens.)
- S21 *viz* **(F3 align-uniform)** — alignment & uniformity (ONE bridge slide): the two terms; “hard negs drive uniformity” (hedge: too much → hubness → **deep-dive #4** forward pointer).
- S22 *viz* — the **2×2 grid, axis 1 only** (hardness): place n₁–n₅ on the horizontal band; the vertical (true/false) axis is *deliberately blank* — “we’ll earn it in Act 3.”
- S23 *divider P3* — “The historical arc of mining.”

**ACT 3 — The arc (S24–46)** *(chronological; each = mechanism + number + the failure it fixes)*
- S24 *viz* — **Random** negatives: cheap, test-distribution mismatch, near-useless.
- S25 *e2e ⊗* — **In-batch (DPR)**: Table 3 **63.1 → 69.1**, bigger batch **→73.0**. (mining surfaces **n₂**.)
- S26 *e2e ⊗* — **BM25 static hard (DPR)**: **G.+BM25(1) → 78.0**; AND a **2nd BM25 neg doesn’t help** (plateau). (surfaces **n₃**.)
- S27 *viz* — the **static-negative trap**: BM25 is lexical, model-independent — uncorrelated with what the *dense* model confuses; in-batch is local & easy. Both miss.
- S28 *transition* — “Let the model pick its own opponents.”
- S29 *viz* — **ANCE**: mine from the model’s **own ANN index** of the whole corpus. (surfaces **n₄**.)
- S30 *e2e* **(F1 stale-index)** — the **async refresh** (Trainer ∥ Inferencer, every 10k batches; why async) + the gradient-norm callout; numbers **MRR .330 > .311**, NQ **81.9**.
- S31 *viz* **(F1)** — **The Sparring Ghosts**: between refreshes the index is stale → negatives drift hard→easy (n₄ → n₂); periodic MRR fluctuation.
- S32 *e2e* — **STAR/ADORE**: freeze the doc index, train the query encoder → **per-step** current hard negs; **ADORE+STAR .347**, **179×** faster.
- S33 *two-column* — the **DEBATE** (separable, not a split): ANCE *convergence* vs STAR/ADORE *staleness-fix + different objective*.
- S34 *transition* — “But what if the hardest opponent is a friend?”
- S35 *viz* — **The Impostor** reveal: top-retrieved “negatives” are often *unlabeled positives*; MS MARCO **~1.1 positives/query** vs **8.8M**, **~70%** of unlabeled-top relevant. *(“Act 2’s too-hard was real but unstable; this one isn’t a negative at all.”)*
- S36 *viz* **(W2 two-channel)** — **THE 2×2 REVEAL**: add the vertical **true/false** axis to S22’s band → the grid; place n₁–n₅; n₄ vs n₅ (same `cos(q,·)`, opposite label) — **the danger is invisible on the hardness axis.** Thesis = the path to **(hard, true)**.
- S37 *e2e ⊗* **(W4 impostor-denoise)** — **THE KILLER ABLATION (RocketQA)**: **32.39 → 26.03 (↓ below in-batch!) → 36.38 → 37.02.** The deck’s climax.
- S38 *viz* — *why it drops*: pushing **n₅** (cos(·,d⁺)=0.80) away **drags d⁺ (0.82) with it** (the second axis).
- S39 *e2e ⊗* **(F2 sweet-spot)** — **signal − collateral**: collateral ∝ `cos(·,d⁺)`; sweep the lineup → peaks at **n₄ (0.31 → no crater)**, **craters at n₅ (0.80) because n₅ is FALSE**, not hardest. The sweet spot, *derived*; axes stay separate. (Next slide confirms it empirically.)
- S40 *viz* — **RocketQA’s 3 tricks**: cross-batch · cross-encoder **denoising** · augmentation (the 4-step rocket).
- S41 *viz* — **SimANS**: gradient mean/variance vs rank; Gaussian sampler centred at s⁺; **softens** false-neg dominance but at equal `cos(q,·)` **can’t separate n₄ from n₅** — only a label can (→ motivates Act 4).
- S42 *viz* — **AR2**: adversarial retriever–ranker; the noise-robust ranker damps false-neg harm; **MRR 39.5**.
- S43 *two-column* — the **three cures for false negatives**: **filter** (RocketQA) · **center-sample** (SimANS) · **co-train** (AR2).
- S44 *quiz* — “Adding harder negatives **dropped** your MRR — most likely cause + fix?” (the practitioner moment).
- S45 *viz* — the **arc recap** (ONE accumulating ladder Random→AR2; Goodhart cameo: “the metric the labels can’t see”).
- S46 *divider P4* — “Where good negatives come from: the teacher.” **Metaphor pivots duel → master-smith.**

**ACT 4 — Distillation / the teacher (S47–54)**
- S47 *viz* — the **label problem**: 0/1 is too crude; it can’t see false negatives.
- S48 *formula ⊗* — **Margin-MSE**: match the **margin** `MSE(S⁺−S⁻, T⁺−T⁻)`; ⊗ a worked teacher-vs-student margin on the lineup.
- S49 *viz* — why margins beat labels: soft, scale-free, **the teacher’s margin on (d⁺, n₅) goes negative → it *reverses* the impostor** the miner kept. *(the back-half spine hook — the teacher unmasks n₅.)*
- S50 *viz* — ensemble of 3 BERT_cat teachers → averaged margins; a DistilBERT student can beat its teachers.
- S51 *e2e* — **TAS-B topic-aware sampling**: cluster the queries once → batch from **one cluster** → **hard in-batch negs for FREE** (no index refresh).
- S52 *viz* — + balanced-margin + dual teacher (BERT_cat pairwise + ColBERT in-batch).
- S53 *viz* — the payoff: **single 11GB GPU, <48h, MRR .340**; BEIR generalises (**−2.8% vs BM25, beats ANCE 14/18**).
- S54 *two-column* — **mine vs manufacture**: ANCE/ADORE *mine* hard negs; TAS-B *manufactures* them by batching. Trade-offs.

**ACT 5 — The modern synthesis (S55–63)**
- S55 *divider P5* — “The modern synthesis.”
- S56 *viz* — **SimCSE**: unsup dropout positives + in-batch → **76.3**; sup NLI **contradiction = hard neg → 81.6**; the **spectrum-flattening** (anisotropy counter).
- S57 *viz* — **Contriever**: unsupervised contrastive IR (MoCo queue + cropping).
- S58 *viz* — **the two-stage recipe** (E5/BGE/GTE): **massive in-batch (16K–32K)** → **a few mined-and-filtered hard negs**. GTE: *“with hard negatives a large batch is unnecessary.”*
- S59 *viz* — **who filters in 2024**: LLM / strong-CE relevance scoring of mined negatives + synthetic query/positive generation (the actual E5/BGE recipe).
- S60 *viz* — **GradCache** (the systems trick): how 32K in-batch is affordable on real hardware (callback to MoCo S11). No precise MTEB scalar — “competitive with far larger-batch models.”
- S61 *viz* — **the positive-side fix**: the cleanest impostor cure is often *relabel it a positive* / positive-aware in-batch masking (RocketQAv2). Name that this lecture’s framing is negative-centric.
- S62 *viz + quiz* — the **practitioner’s decision tree** (cheap in-batch → TAS-B → mined+denoised/E5 → dynamic ADORE → adversarial AR2) **with a compute/label-cost axis**; diagnosis quiz: given constraints, pick the strategy.
- S63 *viz* — the unifying picture: **hardness has a sweet spot; the history is the search for hard-but-honest opponents.**

**ACT 6 — The crucible: run it yourself (S64–71)**
- S64 *divider P6* — “The crucible — now YOU run the forge.”
- S65 *viz* — frame the experiment: the toy corpus contains q + n₁–n₅; what we’ll measure.
- S66 *e2e* **(W3 mining-comparator, centerpiece)** — pick a strategy {random · in-batch · BM25-hard · dynamic-hard · denoised}; watch which negatives get mined + **recall@k** + a loss curve.
- S67 *e2e* **(W3)** — *modify it*: sliders **τ, batch, strategy** → recall **and** embedding **uniformity** move together (theory → demo).
- S68 *e2e* **(W4 impostor-denoise)** — inject the unlabeled positive **n₅** → recall **drops** → toggle **denoising** → recovers. The Impostor, live.
- S69 *viz* — toy ↔ literature: the toy’s **in-batch → undenoised(↓) → denoised(↑) curve has the same SHAPE** as RocketQA’s ablation (32.39→26.03→36.38) — **never on a shared y-axis**; plot the **multi-seed band** (±std from the pilot: in-batch .645, undenoised .411, denoised .783). *Do not* claim the DPR static ladder here — that’s the reported bench panel.
- S70 *walkthrough* — “diagnose your own retriever”: checklist (symptom → which fix).
- S71 *viz* — limits / honesty: a toy ≠ MS MARCO; **the inversion is *constructed to be demonstrable*** (we build a false-negative-dense corpus), not discovered; the toy reproduces the **ordering**, not magnitudes.

**ACT 7 — Payoff & sendoff (S72–80)**
- S72 *viz* — recap: the **thesis sentence first**, then the GPS strip lit end-to-end, then the one-line **bridge to deep-dive #4** (anisotropy/hubness — *why the geometry itself misbehaves*).
- S73 *final* — Séréga with a forged, true-edged blade (final plate). “Worthy opponents make a worthy blade.”
- S74–80 *references* — verified bibliography, grouped: foundations / DPR–dynamic / false-neg / distillation / theory-modern (≈ 6–7 ref slides; one group per slide).

*(80 slides. Climax — the RocketQA reversal, S37 — lands at ~46%.)*

**Per-act budget:** 0:6 · 1:7 · 2:10 · 3:23 · 4:8 · 5:9 · 6:8 · 7:9 = **80**.

---

## 5. Interactive widgets (4) + static figures (3)

**Interactive (vanilla-JS SVG, auto-registered):**
1. **`infonce-calc`** (S10) — batch similarity matrix → softmax → loss; sliders τ, N; the `log N` bound. (extends L7 `in-batch-negatives`).
2. **`hardness-sphere`** (S14, S18, **S36 two-channel**) — query/positive/negatives on the circle; **two colour channels** (distance-band + a *secretly-positive* flag); live Boltzmann gradient weight vs τ.
3. **`mining-comparator`** (S66–67, centerpiece) — toy corpus; strategy selector → mined-negatives highlight + recall@k + loss curve. Data from `gen_l13`.
4. **`impostor-denoise`** (S37, S68) — inject a false negative + cross-encoder denoise toggle; recall before/after.

**Static SVG figures (not interactive — drawn from gated data; cheaper across the 13 gates):**
- **F1 `stale-index`** (S30–31) — model moves, index frozen → negatives drift hard→easy; periodic MRR fluctuation.
- **F2 `sweet-spot`** (S39) — the **signal − collateral** curve vs `cos(·,d⁺)` (peaks n₄, craters n₅) + the SimANS Gaussian.
- **F3 `align-uniform`** (S21) — the ℓ_align–ℓ_uniform plane; hard negs → more uniform (ties to deep-dive #4).

---

## 6. Reproducible experiment — `gen_l13_negatives.py` (frozen toolchain, H3)
- A small synthetic corpus (≈ `l5-word2vec`/`l7-biencoder` scale) **containing the spine lineup** (q, d⁺,
  n₁–n₅) + a tiny dual-encoder; train under each negative strategy; emit **recall@k per strategy** + the
  InfoNCE worked numbers + uniformity scores.
- **TWO structurally-distinct data files (provenance must never blur):** `data/l13-negatives.json`
  (the toy, `source:"measured (rerunnable)"`, reproduced via `reproduce.sh`) **vs** `data/l13-bench.json`
  (paper numbers — DPR Table 3, RocketQA ablation, ANCE/TAS-B MRR — each row `source:"reported, not
  reproduced"` + `cites:[…]`). Slides label provenance: *“reported by ⟨cite⟩”* vs *“measured on our toy.”*
- **✅ BUILT + DE-RISKED — `_research/gen_l13_negatives.py`** (frozen CPython-3.9 + numpy 2.0.2, 20 seeds;
  emits `data/l13-negatives.json` + `data/l13-bench.json`, byte-identical across runs; G1 facts-gate &
  G14 citation-gate green). recall@10 (mean ± std), all DIRECTIONS holding on **100% of 20 seeds**:
  | strategy | recall@10 | maps to |
  |---|---|---|
  | random | 0.620 ± 0.033 | baseline |
  | in-batch | 0.645 ± 0.037 | the RocketQA *baseline* row |
  | bm25-static | 0.625 ± 0.037 | static negs |
  | **+undenoised hard** | **0.411 ± 0.030** | **S37/S38/W4 — the INVERSION (drops below in-batch)** |
  | **+denoised hard** | **0.783 ± 0.039** | **S37/S68 — denoising recovers & exceeds; ANCE dynamic ≫ static** |
  4 load-bearing claims @ **100%**: inversion (undenoised < in-batch) · denoising recovers (denoised >
  in-batch) · dynamic ≫ static (denoised > bm25) · denoised best ∧ undenoised worst.
  Two-axis confirmed: false-neg `cos(q,·)=0.81 / cos(d⁺,·)=0.80`, hard-true `0.64 / 0.62` → separation
  **+0.18** (the impostor is invisible on the hardness axis — exactly the spine’s n₅=0.80).
- **Honesty (carry to S71):** the corpus is **constructed** to be false-negative-dense (R relevant docs /
  topic, only 1 labelled) so the inversion is *demonstrable, not discovered*; the toy reproduces the
  **ordering**, not MS-MARCO magnitudes. **The strict `random<in-batch<bm25` monotone does NOT hold** (those
  three cluster ~0.62–0.65) — so **S24–26’s DPR static ladder stays a *reported* bench number**
  (`l13-bench.json`, Karpukhin Table 3), never a toy claim. The toy owns the **inversion + dynamic≫static +
  the two-axis**; the experiment slides (S66–69, W3/W4) must show *those* curves, not a forced monotone.
- **Gating:** toy numbers → `check_claims` (deck==data==book); paper rows → G14 enforces every cited
  arXiv id resolves. Frozen CPython-3.9 toolchain; byte-identity via `reproduce.sh`.

## 7. `data/papers.json` additions
**Reuse verbatim (already present):** `oord-2018-cpc`, `karpukhin-2020-dpr` (+ add DOI), `xiong-2020-ance`,
`hofstatter-2020-margin-mse`, `hofstatter-2021-tasb`, `wang-2022-e5`, `radovanovic-2010-hubness`,
`steck-2024-cosine`, `gonen-goldberg-2019`.
**ADD (metadata verified in §3):** `schroff-2015-facenet` (1503.03832) · word2vec-NEG (1310.4546, or reuse
L5) · `chen-2020-simclr` (2002.05709) · `he-2020-moco` (1911.05722) · `sohn-2016-npair` (**arxiv:null**) ·
`gutmann-2010-nce` (**arxiv:null**) · `zhan-2021-star-adore` (2104.08051) · `qu-2021-rocketqa` (2010.08191)
· `zhang-2022-ar2` (2110.03611) · `zhou-2022-simans` (2210.11773) · `gao-2021-simcse` (2104.08821) ·
`wang-isola-2020-uniformity` (2005.10242) · `wang-liu-2021-contrastive-behaviour` (2012.09740) ·
`izacard-2022-contriever` (2112.09118, **TMLR**) · `ethayarajh-2019-contextual` (1909.00512) ·
`gao-2019-degeneration` (1907.12009) · `li-2023-gte` (2308.03281) · `xiao-2023-bgecpack` (2309.07597) ·
`gao-2021-gradcache` (2101.06983) · `poole-2019-mi-bounds` (1905.06922).
**Gate notes:** NCE/N-pair `arxiv:null` (confirm G14/`check_citations` tolerates null — precedent
`burges-2010-lambdamart`); CPC/Margin-MSE are preprints (no conf venue); SimCLR τ=0.1 (not 0.5); ANCE 0.330
(0.338 only in STAR/ADORE table); no precise MTEB scalars displayed.

## 8. Build checklist (per CLAUDE.md recipes)
1. Lock the 2 new mascots in `mascots.py`; add briefs to `gen_images.py` (Séréga ≥40% + hero S1 + final S73); `gen_images.py L13`; `check_images.py`.
2. `data/course.json` L13 entry (catalog + `when` + `deckFile`).
3. Book chapter `content/book/l13/beats/*.js` (en/ru/tt) → `assemble-chapter split l13`.
4. Deck `Lectures/13-crucible-of-negatives/parts/*.html` (~80 fragments) → `assemble-deck build`.
5. 4 widgets under `widgets/<name>/` (auto-registered) + 3 static figures inline; extend `in-batch-negatives`.
6. `gen_l13_negatives.py` + `data/l13-*.json` (frozen toolchain) + `check_claims` claims + baselines; add the ~20 papers to `papers.json`.
7. Verify: `npm run build` (now 80+ pages) · facts-gate (+selftest) · G13 viz-probe · G14 citations · G15 lexicon · slide-viz `--strict` · wbw · offline-deck · responsive · beat/scroll/i18n · `reproduce.sh`.

---
*Revision history: v1 initial → v2/v3 folded in fixes from three independent review passes (single
running spine; hardness⊥label 2×2 with the `cos(·,d⁺)` second axis; one central gradient lens; InfoNCE
log-N caveat, FaceNet semi-hard band, Wang-Liu 1/τ, deleted the fabricated ANCE `|C|²`; constructed-not-
reproduced experiment honesty; widgets 7→4+3; modern filtering / positive-side / GradCache added). v4 =
this consolidated single-source document.*
