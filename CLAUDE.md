# Deep Learning for Search — repo map

Course site (Astro) + offline lecture decks + trilingual Book + vanilla-JS SVG widgets, gated by 13 CI gates + a facts-gate. **Goal when editing: touch the fewest files; load one unit, not the repo.** This map exists so you don't have to re-derive structure each session.

## Where things live
- `Lectures/<slug>/parts/*.html` — **the editable deck source** (one fragment per `<section class="slide">`, plus `00-head`/`zz-tail`). All 7 decks (L0–L6) are sharded.
  - `Lectures/NN-*.html` — the **offline standalone deck** (shipped artifact; loads `css/ js/ vendor/` relatively, runs over `file://`, 1920×1080, EN). It is **BUILD OUTPUT** (gitignored): `npm run build` reassembles it byte-identically from the fragments (`scripts/assemble-deck.mjs build`). **Do not edit it** — edit the fragments.
- `content/book/<stem>/beats/*.js` — **the editable Book chapter source** (one fragment per beat, trilingual en/ru/tt). `content/book/lN.js` is the assembled chapter — **BUILD OUTPUT** (gitignored), reassembled byte-identically by `npm run build` (`scripts/assemble-chapter.mjs build`); **don't edit it**, edit the beat fragments. Glob-discovered via `src/lib/chapters.js` (adding a chapter needs no registration).
- `widgets/<name>/` — `logic.js` + `manifest.json` + `i18n.json` + `style.css` (+ `demo-slide.html`). Shared primitives: `widgets/_widget-base.js`, `_plot-util.js`, `_layout.js`. Auto-registered.
- `data/*.json` — **the single source of grounded numbers** (facts-gated). `data/course.json` = lecture catalog + logistics. Reproduced by `_research/gen_*.py`; `_research/data/*.json` are upstream generator artifacts.
- `_research/check_claims.py` — **facts-gate** (data→generator provenance, deck displays == data, arithmetic). Run: `python3 _research/check_claims.py` (`--selftest` too).
- `_audit/*-gate.mjs` — the CI gates (+ `wbw-check.mjs`, `offline-deck.mjs`). `_audit/lib/gate-harness.mjs` = shared server/browser helpers.
- `src/` — Astro pages/layouts/i18n; `src/lib/{course,chapters,assignments}.js`. `scripts/` — `copy-static.mjs`, `assemble-deck.mjs`. `tokens/design-tokens.css` — colors. `narrative/L*.md` — beat sheets.

## Per-task recipes (touch only these)
- **Fix one slide:** edit the fragment `Lectures/<slug>/parts/<NN-slug>.html`, then `node scripts/assemble-deck.mjs build <slug>` (or `npm run build`) to reassemble `Lectures/<slug>.html`. Never edit the assembled `Lectures/NN-*.html` (it's gitignored build output and gets overwritten). Verify: `cd _audit && node wbw-check.mjs <slug>.html` (+ `node slide-viz-gate.mjs --strict` for L5/L6) and `node offline-deck.mjs <slug>.html` for the `file://` guarantee.
- **Change one number:** edit `data/<file>.json` (the source); re-run its generator and prove H3 byte-identity with `bash _research/reproduce.sh`; `check_claims` enforces deck==data, Book==data, AND (coverage-guard `[G]`) that no NEW displayed number is un-gated. The number is also hand-typed prose at each display site — `git grep` it across the deck + Book to update all copies (a new display site must be gated or it HARD-fails the coverage-guard).
- **Add a widget:** create `widgets/<name>/{logic.js,manifest.json,i18n.json,style.css}` — auto-discovered by Book, Playground, and `widget-render-check`.
- **Add lecture L7:** `data/course.json` entry + the Book chapter (write `content/book/l7.js`, then `node scripts/assemble-chapter.mjs split l7` to shard it — the monolith is gitignored, the `beats/` fragments are tracked) + the deck under `Lectures/07-slug/parts/`. Registries are glob-driven — `BOOK_READY`, `check_claims DECKS`, `wbw-check`, `responsive-gate`, book route, beat/scroll/i18n gates all auto-discover. (Curated `slide-viz` `DECK_TARGETS`/`BOOK_TARGETS` are optional per-figure defect targets, not per-unit registration.)
- **Add homework/seminar:** `src/lib/assignments.js` — content-first, ~0 plumbing (the reference model).

## Hard constraints (do not break)
H1 decks are offline standalone (`file://`, zero network, 1920×1080, EN/RU). H2 Book is trilingual via i18n. H3 numbers come from `data/` + are reproducible/facts-gated (any data/generator change must leave `data/` JSON byte-identical: `check_claims` green + empty `git diff data/`; **prove with `bash _research/reproduce.sh`** — the full local toolchain is CPython 3.9 + vendored pylibs, spec frozen in `_research/requirements-repro.txt`). H4 the 13 gates + facts-gate stay working (consolidate/strengthen, never weaken). H5 no heavy runtime deps for students; widgets are vanilla-JS SVG.

## Verify before committing
`python3 _research/check_claims.py` (+`--selftest`) · `npm run build` (must be **49 pages**) · the relevant `_audit/` gate(s) · for a `data/`/generator change: `bash _research/reproduce.sh` (byte-identity, H3). Deep context + the refactor plan/log: `_audit-report/` (`CONTEXT-ARCH-AUDIT.md`, `REFACTOR-LOG.md`).
