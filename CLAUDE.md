# Deep Learning for Search — repo map

Course site (Astro) + offline lecture decks + trilingual Book + vanilla-JS SVG widgets, gated by 13 CI gates + a facts-gate. **Goal when editing: touch the fewest files; load one unit, not the repo.** This map exists so you don't have to re-derive structure each session.

## Where things live
- `Lectures/NN-*.html` — **offline standalone decks** (the shipped artifact; loads `css/ js/ vendor/` relatively, runs over `file://`, 1920×1080, EN). One `<section class="slide">` per slide.
  - Sharded decks: `Lectures/<slug>/parts/*.html` are the **editable source**; `Lectures/<slug>.html` is the assembled output (kept committed). Today only **`00-introduction`** is sharded.
- `content/book/lN.js` — Book chapters (trilingual beats en/ru/tt). **Glob-discovered** via `src/lib/chapters.js` (adding `l7.js` needs no registration).
- `widgets/<name>/` — `logic.js` + `manifest.json` + `i18n.json` + `style.css` (+ `demo-slide.html`). Shared primitives: `widgets/_widget-base.js`, `_plot-util.js`, `_layout.js`. Auto-registered.
- `data/*.json` — **the single source of grounded numbers** (facts-gated). `data/course.json` = lecture catalog + logistics. Reproduced by `_research/gen_*.py`; `_research/data/*.json` are upstream generator artifacts.
- `_research/check_claims.py` — **facts-gate** (data→generator provenance, deck displays == data, arithmetic). Run: `python3 _research/check_claims.py` (`--selftest` too).
- `_audit/*-gate.mjs` — the CI gates (+ `wbw-check.mjs`, `offline-deck.mjs`). `_audit/lib/gate-harness.mjs` = shared server/browser helpers.
- `src/` — Astro pages/layouts/i18n; `src/lib/{course,chapters,assignments}.js`. `scripts/` — `copy-static.mjs`, `assemble-deck.mjs`. `tokens/design-tokens.css` — colors. `narrative/L*.md` — beat sheets.

## Per-task recipes (touch only these)
- **Fix one slide:** if the deck is sharded, edit `Lectures/<slug>/parts/<NN-slug>.html` then `node scripts/assemble-deck.mjs build <slug>`; else edit the monolith `Lectures/NN-*.html`. Verify: `cd _audit && node wbw-check.mjs <file>` (+ `node slide-viz-gate.mjs --strict` for L5/L6).
- **Change one number:** edit `data/<file>.json` (the source); re-run its generator if one exists; `check_claims` enforces deck==data. The number is also hand-typed prose at each display site — `git grep` it across the deck (and Book) to update all copies. *(Book numbers are not yet facts-gated.)*
- **Add a widget:** create `widgets/<name>/{logic.js,manifest.json,i18n.json,style.css}` — auto-discovered by Book, Playground, and `widget-render-check`.
- **Add lecture L7:** `data/course.json` entry + `content/book/l7.js` + `Lectures/07-*.html`. Registries are glob-driven — `BOOK_READY`, `check_claims DECKS`, `wbw-check`, `responsive-gate`, book route, beat/scroll/i18n gates all auto-discover. (Curated `slide-viz` `DECK_TARGETS`/`BOOK_TARGETS` are optional per-figure defect targets, not per-unit registration.)
- **Add homework/seminar:** `src/lib/assignments.js` — content-first, ~0 plumbing (the reference model).

## Hard constraints (do not break)
H1 decks are offline standalone (`file://`, zero network, 1920×1080, EN/RU). H2 Book is trilingual via i18n. H3 numbers come from `data/` + are reproducible/facts-gated (any data/generator change must leave `data/` JSON byte-identical: `check_claims` green + empty `git diff data/`). H4 the 13 gates + facts-gate stay working (consolidate/strengthen, never weaken). H5 no heavy runtime deps for students; widgets are vanilla-JS SVG.

## Verify before committing
`python3 _research/check_claims.py` · `npm run build` (must be **49 pages**) · the relevant `_audit/` gate(s). Deep context + the refactor plan/log: `_audit-report/` (`CONTEXT-ARCH-AUDIT.md`, `REFACTOR-LOG.md`).
