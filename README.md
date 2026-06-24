# Deep Learning for Search — Summer 2026

Graduate course at **Innopolis University**. Instructor: **Albert Nasybullin**
(`a.nasibullin@innopolis.university`). From classical information retrieval to neural
retrieval, vector databases, and retrieval-augmented generation.

**Live site:** https://levshaazz.github.io/deep-learning-for-search-summer-2026/

Everything ships from a single source of truth: offline-standalone **lecture decks**
(bilingual EN/RU), a trilingual scrollytelling **Book** (en / ru / tt), and 41 interactive
**widgets** that appear in both. Every displayed number is generated, gated, and reproducible.

## Lectures

All thirteen core decks are live (**L0–L12**), plus the first **deep-dive**, **L13 · The Crucible of
Negatives**. Each deck is an interactive, **offline-standalone** HTML slideshow — open it in any
browser with no network (`file://` works), 1920×1080, with an **EN/RU** language toggle. Navigate
with `←` / `→` / `Space`, `O` for overview, `T` for the toolbar, `F` for fullscreen.

| # | Lecture | Status |
|---|---------|--------|
| 00 | [Course Introduction](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/00-introduction.html) | ✅ ready |
| 01 | [Search & Information Retrieval · ML System Design](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/01-search-ir-ml-system-design.html) | ✅ ready |
| 02 | [NLP · Tokenization · Measures of Similarity](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/02-nlp-tokenization-similarity.html) | ✅ ready |
| 03 | [Classical IR (TF-IDF, BM25, inverted index) · Full-text Ranking & Rank Fusion](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/03-classical-ir-fulltext-fusion.html) | ✅ ready |
| 04 | [Ranking Metrics (Recall@k, Precision@k, MRR, MAP, nDCG)](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/04-ranking-metrics.html) | ✅ ready |
| 05 | [Intro to DL for Search · Word Embeddings · Dimensionality Reduction](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/05-dl-embeddings-dimred.html) | ✅ ready |
| 06 | [Dense & Contextual Embeddings · Contrastive Learning · Transformers & Attention](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/06-contextual-attention-transformers.html) | ✅ ready |
| 07 | [Bi-encoders (DPR, SBERT) · Cross-encoders & Reranking · Multi-stage Pipelines](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/07-bi-cross-encoders-reranking.html) | ✅ ready |
| 08 | [Late Interaction (ColBERT) · SPLADE · Hybrid · Learning to Rank](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/08-colbert-splade-ltr.html) | ✅ ready |
| 09 | [ANN: HNSW, IVF, PQ · FAISS · Vector DBs · Production](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/09-ann-faiss-vector-db-production.html) | ✅ ready |
| 10 | [RAG Fundamentals · Chunking · Query Understanding & Rewriting](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/10-rag-chunking-query-understanding.html) | ✅ ready |
| 11 | [RAG Evaluation (RAGAS, LLM-as-judge) · Agentic RAG (ReAct, Self-RAG, CRAG)](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/11-rag-eval-agentic.html) | ✅ ready |
| 12 | [Advanced RAG (multi-hop, GraphRAG) · Multimodal (CLIP, ColPali) · Ethics & Safety](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/12-advanced-rag-multimodal-ethics.html) | ✅ ready |
| 13 | [Deep-dive · The Crucible of Negatives — hard negative mining in contrastive dense retrieval](https://levshaazz.github.io/deep-learning-for-search-summer-2026/Lectures/13-crucible-of-negatives.html) | ✅ ready · deep-dive |

The shipped `Lectures/NN-*.html` decks are **build output**: `npm run build` reassembles each one
byte-identically from its `Lectures/<slug>/parts/*.html` fragments (the tracked source you edit).
The links above point at the published decks; clone + `npm run build` to produce them locally.

## Website & Book

The course website (landing, syllabus, schedule) and the **Book** are an [Astro](https://astro.build)
site built from the same single-source data. The Book is a **trilingual (en / ru / tt)** scrollytelling
companion to the decks — one chapter per lecture (`content/book/lN.js`, assembled from
`content/book/<stem>/beats/*.js` fragments), with the same widgets mounted inline and advanced by scroll.

- `npm install`, then `npm run build` → static output in `docs/` (**52 pages** + the copied decks);
  GitHub Pages publishes `docs/` via the deploy workflow.
- `npm run dev` → live Astro dev server.

## Repository layout

```
src/                      Astro site: [lang] i18n pages (en/ru/tt), layouts, components, lib/
tokens/design-tokens.css  THE single design-token source (palette/type — decks + site share it)
data/                     single source of numbers: course.json (catalog) + l*-*.json
_research/                number generators (gen_*.py) + the facts-gate (check_claims.py)
content/book/             the trilingual Book: <stem>/beats/*.js fragments → lN.js (build output)
narrative/                per-lecture beat sheets (the story contract)
widgets/                  41 vanilla-JS SVG widgets — one figure → deck slide + Book beat
Lectures/                 lecture decks
  <slug>/parts/*.html     the editable deck source (fragments)
  NN-*.html               the assembled offline decks (BUILD OUTPUT — git-ignored)
  css/ js/ vendor/        deck runtime (KaTeX, Prism, fonts) — travels with each deck
Lectures Template/        the reusable lecture-template system + its docs
scripts/                  build pipeline (assemble-deck, assemble-chapter, build-deck-*, copy-static)
_audit/                   headless CI gates (Playwright) — node_modules git-ignored
.github/workflows/        site-ci.yml (gates) · deploy.yml (Pages) · ci.yml (template smoke)
docs/                     Astro build output (Pages publish dir) — git-ignored, built in CI
CLAUDE.md                 repo map + per-task recipes + hard constraints — start here to contribute
```

## Single source of truth & quality gates

Every displayed number lives in `data/*.json`, is reproduced by a generator under `_research/`,
and is enforced by the **facts-gate** (`python3 _research/check_claims.py`): data↔generator
provenance, deck/Book displays `==` data, and the arithmetic. Any data or generator change must
stay byte-identical — prove it with `bash _research/reproduce.sh` + an empty `git diff data/`.

Beyond the facts-gate, CI runs **13 deterministic gates**, each with its own `--selftest` (so a
detector that has gone blind fails CI too), spanning two workflows:

- **`site-ci.yml`** — gates the rendered site + shipped decks: token, font, layout, i18n-coverage,
  scroll-step, beat-coverage, responsive, slide-viz, widget-render, and the word-by-word (`wbw`) check.
- **`ci.yml`** — the lecture-template smoke gates: offline bundle, pre-flight corner cases, archflow
  geometry, sequence-diagram, and budget accumulator.

Run any gate locally from `_audit/` (after `npm install` there once), e.g.
`node slide-viz-gate.mjs --strict`, `node wbw-check.mjs`, `node offline-deck.mjs`.

## Contributing / authoring

See **[CLAUDE.md](CLAUDE.md)** — the repo map with per-task recipes (fix a slide, change a number,
add a widget, add a lecture) and the five hard constraints: offline-standalone decks · trilingual
Book · numbers come from `data/` and are reproducible/facts-gated · the gates stay green · no heavy
runtime deps (widgets are vanilla-JS SVG). Always edit the **fragment sources**
(`Lectures/<slug>/parts/`, `content/book/<stem>/beats/`), never the assembled build output.

## License

Course materials © 2026 Albert Nasybullin / Innopolis University. All rights reserved unless
stated otherwise.
