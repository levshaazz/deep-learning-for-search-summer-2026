# SITE_ARCHITECTURE.md — the two-mode course website (design spec, no code yet)

> **Status: DESIGN / CANON-CANDIDATE.** This is the architecture for turning GitHub Pages into a
> full course website with two modes: (1) interactive **scrollytelling** in the Wait-But-Why voice
> with live demos, and (2) **reference subpages** (slides, syllabus, assignments, labs, …).
> It descends from [voice_wbw.md](../voice_wbw.md) (narrative canon), [REDESIGN_BRIEF.md](REDESIGN_BRIEF.md)
> (visual canon), and [AUDIT_V2.md](AUDIT_V2.md) (QA philosophy). No code is written yet — this is
> the plan we build against. Optimised for **robustness, systematicity, reuse, and narrative**.

---

## 0. Decisions locked (2026-06-04, refined)

> **Conceptual frame: Mode 1 is "The Book."** The scrollytelling experience is the trilingual
> Wait-But-Why **textbook** (one chapter per lecture). The slide decks are its **English lecture-hall
> companion**. "Book" and "slides" are two products that share figures, data, and narrative beats.

| # | Decision | Choice | Consequence |
|---|----------|--------|-------------|
| 1 | i18n scope | **Slides EN-only · everything else trilingual** | **Decks stay English** (no i18n weave on decks — big simplification). The Book, site chrome, **and reference pages (syllabus/schedule/HW/labs/cast)** are all EN/RU/TT. |
| 2 | Tatar script | **Both scripts, Cyrillic default** | Language model for the Book is `{en, ru, tt-Cyrl, tt-Latn}`. Author `tt-Cyrl` once; **auto-derive `tt-Latn`** by transliteration + override file. |
| 3 | Slides ↔ Book | **Shared figures+data+beats; prose per medium** | Figures, canonical numbers, and the narrative beat-sheet are single-sourced; slide prose (terse, EN) and Book prose (full WBW, ×3 lang) authored separately. |
| 4 | Tooling | **Astro** | Content collections (single source + schema), native i18n routing, islands to embed existing vanilla-JS widgets with no rewrite, **static HTML output** (bare Pages; decks still work over `file://`). |
| 5 | Translation pipeline | **Draft → author review (native Tatar)** | RU/TT first pass may be MT-assisted; the course author is a **native Tatar speaker** and is the TT-Cyrl reviewer of record. Latin is derived, not authored. |

**Non-negotiable inheritance:** the existing deck engine (`Lectures/js/*`) is **not rewritten**. All
existing hard invariants hold: KaTeX for all math, Prism for code, 0 pre-flight errors, precision
content stays exact, technical terms stay Latin script in every language. **Decks are English-only**;
their dormant `lang` span infrastructure is left inert (not removed).

---

## 1. Principles (the four goals, made operational)

1. **Single source of truth descends; presentation ascends.** Content, data, art, tokens, narrative,
   and translations live in *medium-agnostic source layers*. Slides and scroll stories are
   *renderings*, never the source. Nothing canonical is hand-duplicated.
2. **Two media, two narratives, one set of figures & facts.** We do **not** auto-convert a 56-slide
   deck into a scroll essay — the ideal granularity differs. We share the **interactive figures, the
   canonical data, and the narrative beat-sheet**; we author *prose* per medium.
3. **Every shared layer gets a deterministic gate.** Reuse without enforcement *is* drift. Each
   single-source layer (data, tokens, i18n, links, steps, transliteration) gets an audit — a direct
   extension of AUDIT_V2.
4. **Ship incrementally without breakage.** Per-key i18n fallback (`tt-Latn → tt-Cyrl → ru → en`) +
   coverage badges mean the site is always shippable even when a language is partial.

---

## 2. Layered architecture

```
┌─ SOURCE LAYERS (single source of truth, medium-agnostic) ───────────────────┐
│  content/      per-lecture content model: beats + EN prose + refs            │
│  data/         canonical numbers as JSON  (cos=…, β≈0.59, V=94287, …)         │
│  narrative/    course meta-arc  +  per-lecture beat sheets (problem→sol→detail)│
│  widgets/      "explainable units" — vanilla-JS islands (the figures)         │
│  i18n/         keyed translation catalogs ×{ru, tt-Cyrl} + tt-Latn override   │
│  tokens/       ONE design-token file (blue #2A6FDB / orange #E8743B / paper)  │
│  assets/       _char art + IMAGE_PROMPTS                                       │
└──────────────────────────────────────────────────────────────────────────────┘
        │ build-time weave ↓                         │ build-time weave ↓
┌─ RENDERER · SLIDES (Mode 2 source) ─┐   ┌─ RENDERER · SCROLL (Mode 1) ──────────┐
│  existing deck.js engine UNCHANGED   │   │  Astro page + Scrollama driver         │
│  hall projection · arrow-key driver  │   │  scroll position → SAME step model     │
│  embeds widgets/ as <section>        │   │  embeds widgets/ as islands            │
│  EN deck + i18n weave → 4-variant deck│   │  EN prose + i18n weave → 4-variant page│
└───────────────────────────────────────┘   └─────────────────────────────────────┘
        │                                          │
┌─ SITE SHELL (Astro, static HTML) ───────────────────────────────────────────┐
│  / landing · /syllabus · /schedule · /assignments/<n> · /labs/<n> · /cast    │
│  i18n routing · shared nav/footer/language+script switch · links into both   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The keystone: "explainable units" (widget registry)

The decisive audit finding: **`deck.js` is a step-state engine, not a slide engine.** Every figure
(`archflow`, `walkthrough`, `e2e`, `sequence`, `reverse/forward`, budget accumulator) is driven by a
generic `data-max-step` / `data-current-step` / `data-from="k"` / `data-focus="k"` model, with arrow
keys as one input driver. **Scrollytelling is the same model with scroll as a second driver.**

So we promote each interactive figure to a standalone **widget**, authored once, embedded in both media:

```
widgets/
  cosine-sphere/        manifest.json · fragment.html · style.css · logic.js   (Sir Cosine demo)
  bpe-merge-ledger/     …reads data/l2-bpe.json (the slides-29–31 merges)
  retrieve-rank-funnel/ …the retrieval→ranking cascade (10⁶→10)
  zipf-heaps/           …reads data/l2-corpus-stats.json (β≈0.59, V=94287)
  pos-bias-curve/       …reads data/l1-click-model.json (γ≈0.94)
```

**`manifest.json` per widget declares:** `maxStep`, the `data/*.json` it reads, `altText`, the i18n
keys its labels use, and which `data-type` the slide deck mounts it under. The slide deck embeds it as
`<section data-type="…">`; the scroll story embeds it as an island whose steps are driven by scroll.
Both read the *same* `data/*.json` → the cosine result is `12.73` in both, forever. The existing
[check_claims.py](../check_claims.py) is repointed at `data/` as source-of-truth instead of scraping HTML.

This is where "reuse + robustness" pays off most: the figures that are hardest to build and most
dangerous to get wrong (geometry, numbers) are built and verified **once**.

---

## 4. Data layer (`data/`)

Lift every canonical number out of presentation HTML into typed JSON:

```
data/
  course.json          schedule, weeks, assessment weights, grade bands  (feeds landing + syllabus)
  l1-click-model.json  γ≈0.94, top-1=32.3%, top-3=60.6%, …
  l2-corpus-stats.json Zipf slope≈-1.02, Heaps β≈0.59 R²≈0.998, V=94287, …
  l2-cosine.json       the worked vectors, cos=1, euclid=√162≈12.73
  l2-bpe.json          the BPE/WordPiece merge ledger (scores per slide 29–31)
  refs.json            the bibliography (Furnas 1987, Broder 2002, Sculley 2015, …)
```

The schedule table currently hand-coded in [index.html](../../index.html) becomes `course.json` → one
source feeds the landing page, `/syllabus`, `/schedule`, and per-lecture headers. The
**shared-data gate** asserts every number rendered in *any* surface equals its `data/` source.

---

## 5. i18n architecture (the Book + chrome — NOT the decks)

> **Scope:** the trilingual machinery applies to **the Book (scroll stories), site chrome, and the
> reference pages**. **Slide decks are English-only** and are *not* woven — this removes the hardest
> part of the original plan (no 4-variant weave into 144 KB deck files). **Pipeline:** RU/TT first pass
> may be MT-assisted; the course author (native Tatar) reviews `tt-Cyrl`; `tt-Latn` is derived.

### 5.1 Language model
BCP-47 variants: **`en` (canonical) · `ru` · `tt-Cyrl` (default Tatar) · `tt-Latn` (derived)**.
UI exposes a **language switch (EN/RU/TT)** plus, when TT is active, a **script sub-switch
(Кириллица / Latin, default Cyrillic)**. Persisted in `localStorage` (extends the existing
`prefs = {lang, theme}` in [tools.js](../../Lectures/js/tools.js)).

### 5.2 Do NOT author 4 inline spans
The current mechanism (`<span lang="ru"><span lang="en">` + CSS `display:none` toggle) is correct for
*runtime display* but **wrong as an authoring source** at this scale. Instead:

- **EN is authored inline** in the content model (single language, readable source).
- **RU and `tt-Cyrl`** live in **keyed sidecar catalogs**: `i18n/L2.ru.json`, `i18n/L2.tt-Cyrl.json`,
  keyed by a stable per-string id. Translators edit JSON, not HTML.
- **`tt-Latn` is auto-derived** from `tt-Cyrl` (see 5.4); it is *not* authored except for overrides.
- **Build-time weave (Astro):** for **the Book + chrome + reference pages** the generator reads EN
  content + the catalogs and emits the multi-`<span lang>` HTML (the same CSS `display:none` toggle the
  engine already uses). **Decks are skipped** — they ship EN-only. Output is static (no runtime fetch).

### 5.3 Fallback (mandatory — this is what lets us ship partial languages)
Per-key resolution order: **`tt-Latn → tt-Cyrl → ru → en`** (and `ru → en`). A missing key never
breaks a page; it falls back and is marked with a subtle "not yet translated" affordance. The site is
always shippable.

### 5.4 Tatar dual-script via transliteration
Tatar Cyrillic → Latin (Zamanälif) is largely deterministic. Author `tt-Cyrl` once; generate
`tt-Latn` via a transliteration table + `i18n/tt-translit-overrides.json` for the ambiguous cases
(context-dependent **ц, е, ё, я, ю**, soft/hard signs, loanwords). Caveats: transliteration is **not
100% lossless** → overrides + one TT-native review pass per lecture are required. A gate verifies
`tt-Latn == translit(tt-Cyrl)` except where overridden.

### 5.5 Protected terms
Technical terms (softmax, BM25, embedding, PyTorch, cosine, …) stay **Latin script in all four
variants** — already canon. A gate flags any protected term that got "translated."

### 5.6 Coverage gate
Reports `translated/total` per surface per language, e.g. `L2: en 100% · ru 100% · tt-Cyrl 41% · tt-Latn 41%`.
**HARD-fail only when EN (canonical) is incomplete**; RU/TT report as WARN + a public status badge.

---

## 6. Narrative layer (`narrative/`)

Narrative becomes a first-class source, not prose scattered in slides.

- **`narrative/arc.md`** — the course meta-arc: the *Galaxy of Information* expedition (per
  [voice_wbw.md](../voice_wbw.md) §4) with the shared **Get Data → Measure → Rank** spine threading
  every lecture; each lecture's catchphrase + finale-callback registered here.
- **`narrative/L<n>.md`** — per-lecture **beat sheet**: the canonical ordered beats following the
  course pattern **Problem → What solves it → Detailed solution**, each beat tagged with its
  catchphrase/creature and the widget (if any) it anchors.
- **One narrative, two renderings:** the slide deck renders beats as terse `divider`/`hook`/`quote`
  slides; the scroll story renders the *same* beats as flowing WBW prose. They **cannot tell
  different stories** — the beat sheet is the contract. A gate checks both renderers cover every
  `required` beat in order.
- **Creatures** (Lexical Gremlin, Tokenosaurus, Sir Cosine & the Knights of the Unit Sphere, the
  Curse-of-Dimensionality Wraith, Goodhart) are reused across both media from the shared art layer.

---

## 7. Mode 1 — scrollytelling engine

- **Driver:** **Scrollama** (tiny, IntersectionObserver-based; the NYT/Pudding standard). Vendored
  offline like KaTeX/Prism. Watches `.scroll-step` markers in the prose column.
- **Bridge:** `onStepEnter(k)` sets `data-current-step=k` on the pinned widget and calls the **same
  step API `deck.js` already exposes**. Zero new figure logic — the figures are the audited deck figures.
- **Layout:** sticky pinned-graphic column + scrolling prose column; mobile → graphic pins to top,
  prose flows beneath. This is where the **full WBW voice lives** (long first-person Serega narration,
  inline doodles, the sci-fi/LOTR catchphrase unfolding on scroll) — the literal waitbutwhy.com format.
- **Responsive:** scroll stories are **mobile-first** (the inverse of the deck's hall-only design);
  the deck's small-screen warning does not apply here.

---

## 8. Mode 2 — reference subpages

Generated static pages from the source layers:

- `/slides/<lecture>` — existing decks, embedded/linked **unchanged** and **English-only** (don't touch
  what passes every gate). Each Book chapter cross-links to its slide companion and vice versa.
- `/syllabus`, `/schedule` — generated from `data/course.json`.
- `/assignments/<n>`, `/labs/<n>` — Astro content-collection pages (spec, due date, rubric, starter links).
- `/cast` — public-facing character bible (a WBW delight; reuses CHARACTER_BIBLE + `_char` art).

---

## 9. Tooling, IA & routing (Astro)

- **Astro** generates the shell, scroll stories, and reference pages, and **links/embeds** the decks.
  Decks stay raw HTML on their current engine. Astro output is static HTML → bare GitHub Pages; decks
  still open over `file://`.
- **Content collections** = the single-source content model with schema validation (a malformed beat
  sheet or missing ref fails the build).
- **Islands** embed the vanilla-JS widgets with **no framework rewrite**.
- **URL / i18n routing** (path-based, SEO-friendly, shareable):
  ```
  /                         → redirect to /en/ (or browser-preferred)
  /{lang}/                  landing                     ({lang} ∈ en | ru | tt)
  /{lang}/book/{lecture}    THE BOOK — scroll story (Mode 1)   ?script=cyrl|latn for tt
  /slides/{lecture}         deck (Mode 2) — ENGLISH-ONLY, not language-scoped
  /{lang}/syllabus · /schedule · /assignments/{n} · /labs/{n} · /cast
  ```

---

## 10. QA gates (extend AUDIT_V2 to the whole site)

Existing deck gates stay. New deterministic gates, same spirit (each ships with a known-bad fixture):

| Gate | Checks | Severity |
|------|--------|----------|
| **shared-data** | every number in slides *and* Book == `data/*.json` source | HARD |
| **token** | one design-token file; no divergent `:root` across landing/deck/Book | HARD (kills the index↔deck divergence already present) |
| **i18n-coverage** | `translated/total` per Book chapter + chrome per language (decks excluded — EN-only) | HARD on EN, WARN+badge on RU/TT |
| **i18n-structure** | no orphan keys, no missing keys, no protected-term translation | HARD |
| **tt-translit** | `tt-Latn == translit(tt-Cyrl)` except overrides (Book/chrome only) | HARD |
| **scroll-step** | every `.scroll-step` maps to a valid step in its widget manifest | HARD |
| **beat-coverage** | both renderers cover every `required` narrative beat, in order | HARD |
| **responsive** | scroll stories pass at mobile widths | HARD |
| **link-integrity** | no broken internal links across generated site | HARD |

The existing two mandatory deck gates (`wbw-check`, `visual-gate`) continue to run unchanged on the decks.

---

## 11. Deployment

`git init` → push → GitHub Pages serving Astro static output. This is the literal precondition and it
also **unblocks §3.2 `--ref`** (image character-consistency by public URL), flagged in
[AUDIT_V2.md](AUDIT_V2.md) as "PLUMBING DONE, ACTIVATION BLOCKED on hosting."

---

## 12. Proposed repository layout (target)

```
repo/
  src/                      Astro: pages, layouts, components, i18n routing
  content/                  per-lecture content model (EN canonical) + beat refs
  data/                     canonical numbers (§4)
  narrative/                arc.md + L<n>.md beat sheets (§6)
  widgets/                  explainable units (§3) — shared by deck + scroll
  i18n/                     L<n>.{ru,tt-Cyrl}.json + tt-translit-overrides.json + chrome strings
  tokens/                   design-tokens.css (the single :root)
  Lectures/                 EXISTING decks + engine — unchanged; weave target
  assets/ (_char)           art + IMAGE_PROMPTS
  _audit/                   existing gates + new site gates (§10)
  dist/ (or docs/)          Astro static build → GitHub Pages
```

---

## 13. Phased roadmap (de-risked ordering)

1. **Foundation** — git + Pages + Astro shell; extract `tokens/design-tokens.css` (one `:root`);
   migrate schedule/assessment into `data/course.json` (landing + syllabus from one source).
   *Ships value immediately, low risk.*
2. **Single-source data** — lift canonical numbers into `data/*.json`; repoint `check_claims.py`.
   *Hardens reuse before duplication can occur.*
3. **Widgetize one figure** (cosine-sphere) end-to-end; prove it embeds in both deck and a scroll page
   from one source + reads one data file. *Validates the keystone on one example.*
4. **Trilingual spine** — language model `{en,ru,tt-Cyrl,tt-Latn}`, sidecar catalogs, build-time weave,
   transliteration + override, fallback, coverage gate; on chrome + one pilot lecture.
5. **First full scroll story** — L2 "First Contact" (richest narrative) as the reference
   implementation; freeze the beat-sheet format from it.
6. **Scale** — remaining lectures + reference pages; all gates green at each step.

---

## 14. Open questions / deferred risks

- **RESOLVED — Translation pipeline.** RU/TT first pass may be MT-assisted; the **course author (native
  Tatar) reviews `tt-Cyrl`**; `tt-Latn` derived. Fallback makes partial coverage shippable.
- **RESOLVED — i18n scope.** Slides EN-only; the Book + chrome trilingual. Decks are not woven →
  no presenter/handout/print 4-variant problem on decks.
- **RESOLVED — reference-page scope.** Chrome + syllabus/schedule/HW/labs/cast are **trilingual**
  (short text, native review available). Slides remain the only EN-only surface.
- **Tatar transliteration losses.** `tt-Cyrl → tt-Latn` is not 100% lossless (context-dependent
  ц/е/ё/я/ю, soft/hard signs, loanwords) → override file + author spot-check per chapter.
- **Astro + existing `_audit` Node tooling** coexistence (versions, `node_modules` scoping).
- **Book print/offline export** (the WBW textbook as a downloadable artifact) — nice-to-have; the
  scroll layout doesn't paginate trivially. Deferred.
```
