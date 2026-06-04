# Deep Learning for Search — Summer 2026

Graduate course at **Innopolis University**. Instructor: **Albert Nasybullin**
(`a.nasibullin@innopolis.university`). From classical information retrieval to neural
retrieval, vector databases and retrieval-augmented generation.

**Live site:** https://levshaazz.github.io/deep-learning-for-search-summer-2026/
*(enable GitHub Pages in **Settings → Pages → Branch: `main` / root** after you populate the repo)*

## Lectures

Interactive HTML slide decks — open in any browser, fully offline (`file://` works).
Navigate with `←`/`→`/`Space`, `O` for overview, `T` for the toolbar, `F` fullscreen.

| # | Lecture | File |
|---|---------|------|
| 00 | Course Introduction | [`Lectures/00-introduction.html`](Lectures/00-introduction.html) |
| 01 | Search & IR · ML System Design | [`Lectures/01-search-ir-ml-system-design.html`](Lectures/01-search-ir-ml-system-design.html) |
| 02 | NLP · Tokenization · Similarity | [`Lectures/02-nlp-tokenization-similarity.html`](Lectures/02-nlp-tokenization-similarity.html) |

The course **website** (landing, syllabus, schedule, and the scrollytelling **Book**) is an
Astro site built from single-source data. `npm install` then `npm run build` → static output in
`docs/`; `npm run dev` for a live server. The decks are linked/embedded unchanged (English-only).

## Repository layout

```
src/                     Astro site: [lang] i18n pages (en/ru/tt), layouts, components
tokens/design-tokens.css THE single design-token source (palette/type — decks + site share it)
data/                    single source of numbers: course.json + l*-*.json (decks/Book/widgets/gate)
narrative/               course meta-arc + per-lecture beat sheets (the story contract)
widgets/                 "explainable units" — one figure → slide + Book (e.g. cosine-sphere)
Lectures/                lecture decks + shared runtime
  *.html                 the decks
  assets/                images (instructor photo, …)
  css/ js/ vendor/       template runtime (KaTeX, Prism, fonts) — travels with the decks
Lectures Template/       the reusable lecture-template system + its docs (CLAUDE.md, README.md)
_audit/                  headless QA scripts (Playwright) — node_modules git-ignored
_research/               briefs, image pipeline, facts-gate (check_claims.py), design canon
main_ideas.md            course narrative principles
DLS_course_keynotes.docx.pdf   syllabus
docs/                    Astro build output (GitHub Pages publish dir) — git-ignored, built in CI
```

The site is published by `.github/workflows/deploy.yml` (build + GitHub Pages via Actions).

## Authoring & QA

The decks are built on the template in [`Lectures Template/`](Lectures%20Template/).
See [`Lectures Template/CLAUDE.md`](Lectures%20Template/CLAUDE.md) for the slide-type
catalogue and the two hard rules (bilingual spans — unused here since the course is in
English; and **all** sub/superscript math must be wrapped in KaTeX).

- **Live pre-flight:** every deck self-validates (badge, bottom-right).
- **Headless gates:** in `_audit/` — `npm install` once, then `node ci-gate.mjs`,
  `node archflow-audit.mjs`, `node sequence-audit.mjs`, `node budget-audit.mjs`.
- **Offline bundle:** `node build-vendor.mjs` (once) → `node build-standalone.mjs`.

## License

Course materials © 2026 Albert Nasybullin / Innopolis University. All rights reserved
unless stated otherwise.
