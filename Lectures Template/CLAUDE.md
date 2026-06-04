# CLAUDE.md — how to use the Lecture Template (agent guide)

You are an AI coding agent (Claude Code) working with this **interactive lecture
presentation template** for CS / ML / DL / NLP lectures. It is a single editable
HTML deck driven by vanilla JS — no framework, no build step needed to author.
This file tells you exactly how to create lectures, what every slide type does,
the rules you MUST follow, and how to verify your work. Read it fully before
editing.

---

## 0. TL;DR for the impatient

- **Author** in `Lecture Template.html` (or a copy). Each `<section class="slide" data-type="…">` is one slide.
- **Open** the file in a browser (double-click works — it loads `vendor/` over `file://`, zero network). Arrows/Space navigate; `O` overview; `T` toolbar.
- **Two hard rules:** (1) bilingual text is `<span lang="ru">…</span><span lang="en">…</span>`; (2) **every** math symbol with a sub/superscript must be wrapped in KaTeX `\(…\)` / `$$…$$` — never write `d_k`, `W_Q`, `x^2` as plain text (they render with literal `_` / `^`).
- **Verify** after editing: load it and check the on-screen **pre-flight** badge (bottom-right) is clean; for the full gate run the scripts in `_audit/` (see §8). For `archflow` slides run `_audit/archflow-audit.mjs`.
- **Ship offline:** `node build-vendor.mjs` (once, needs net) → `node build-standalone.mjs` → one self-contained `…(Standalone).html`.

---

## 1. Create a new lecture

```bash
cp -r "Lectures Template/" "Lectures/CS-310 Lecture 06 — Backprop/"
cd "Lectures/CS-310 Lecture 06 — Backprop/"
mv "Lecture Template.html" "Lecture 06.html"
```
Then edit `Lecture 06.html`:
- Title / subtitle / eyebrow → the `<section data-type="title">` block.
- Lecturer / date / room → `.title-footer`.
- Course name (footer + breadcrumbs) → `<div class="slides" data-course-ru="…" data-course-en="…">`.
- Logo → `<template id="tpl-logo">` near the top of `<body>` (reused on every slide).
- Content → the `<section data-type="…">` blocks. Delete the example slides you don't need; the shipped deck is a **living catalogue of all slide types** — keep it open as a reference.
- Speaker notes → `<aside class="slide-notes">…</aside>` inside each slide (HTML allowed). Per-step notes for stepped slides: `<aside data-notes-for-step="3">…</aside>`.

`vendor/`, `css/`, `js/` must travel with the HTML (relative paths). Do not edit `Lecture Template (Standalone).html` by hand — it is generated.

---

## 2. File map

```
Lecture Template.html     # the deck — copy this per lecture; living example of every slide type
README.md                 # human-facing overview (RU)
CLAUDE.md                 # this file — agent guide
build-vendor.mjs          # download KaTeX/Prism/QR/fonts into vendor/ (run once, needs net)
build-standalone.mjs      # inline everything → one offline .html (no net)
vendor/                   # katex/ prism/ qrcode/ fonts/  → ZERO runtime CDN
css/
  template.css            # design tokens (:root), typography, layout, PRINT rules, slide chrome
  slides.css              # per-slide-type styles (title…refs, quiz, arch, demo)
  components.css          # toolbar, overview, callouts, badges, hidden-answer, timer, QR, code-runner
  e2e.css                 # e2e forward-pass slide
  lab.css                 # misconception / derivation / pause / reverse / forward / counterfactual
  archflow.css            # step-by-step architecture reveal (nodes, routed edges, focus ring, image nodes)
  presenter.css           # presenter (second-monitor) window
  tweaks.css              # live customization panel
  preflight.css           # the pre-flight validation overlay
js/
  deck.js                 # ENGINE: navigation, scaling/auto-fit, hash routing, overview, step engine,
                          #   slide:enter/leave + reset-on-reentry, LectureKeys registry, window.Lecture API
  tools.js                # toolbar, theme/lang, TOC, quiz, timer, QR, progress, mobile warning
  pen.js  notes.js  presenter.js
  demos.js                # declarative <interactive-demo> (function-plot / distribution)
  e2e.js                  # e2e forward-pass stepper + tooltips
  lab.js                  # lab slide types + recall + typewriter + devil's-advocate + (opt) pyodide/arxiv
  archflow.js             # archflow engine: declarative edge routing, reveal, focus, image nodes
  handout.js              # ?handout=1 → linear notes+answers export for printing
  preflight.js            # in-browser deck validation (live)
  tweaks.js               # live customization panel
```
(There is intentionally **no** `interactive.js` — step-control wiring lives in `deck.js`.)

---

## 3. The TWO hard rules (most common mistakes)

### 3.1 Bilingual content
Every multilingual run is **one `ru` span + one `en` span, side by side**:
```html
<h2><span lang="ru">Сходимость</span><span lang="en">Convergence</span></h2>
```
CSS hides the inactive language; `L` (or the toolbar) toggles. Never make separate "ru slides" and "en slides". Technical terms (PyTorch, softmax, gradient) stay English in both. Pre-flight warns if a `[lang]` span has no opposite-language sibling.

### 3.2 Math is KaTeX — ALWAYS wrap sub/superscripts
KaTeX auto-renders `$$…$$` (display), `\[…\]` (display), `\(…\)` (inline) at load.
**Any** identifier with a subscript or power MUST be inside delimiters — including in captions, table cells, matrix labels, node labels, headings, and speaker-note asides:
```html
✗ WRONG:  the matrix d_k, weights W_Q, score S_ij, R^p, x^2      → renders literal _ and ^
✓ RIGHT:  \(d_k\), \(W_Q\), \(S_{ij}\), \(\mathbb{R}^p\), \(x^2\)
```
This is the single most frequent defect. After editing, scan rendered slides for stray `_` / `^` in non-KaTeX text (the geometry of math is fine inside `$$`; the danger is plain prose). KaTeX covers ~99% of CS/ML LaTeX; for exotic packages swap to MathJax (see README).

### 3.3 (corollary) One idea per slide; auto-fit is a safety net, not a license
Content is auto-scaled to fit 1920×1080. If a slide would scale below 0.65× you get a density **warning**; below 0.5× content is **clipped** → pre-flight raises an **error**. Fix by splitting the slide, not by relying on shrink. Revealed content (answers, details) re-fits automatically.

---

## 4. Slide-type catalogue

Every type is `<section class="slide" data-type="X" data-screen-label="NN Name">…</section>`.
Open `Lecture Template.html` to see each one fully fleshed out — copy from there. Summary:

**Structural:** `title`, `agenda` (clickable TOC with `#/N` anchors — point each at the right slide!), `objectives` (learning outcomes, distinct from agenda), `divider` (section break), `final` (Q&A + QR + contacts).

**Content:** `definition` (RU/EN term card), `theorem` (`.thm-card data-kind="theorem|lemma|cor|proof"`), `formula` (big centred KaTeX + variable glossary), `code` (Prism, `<pre><code class="language-python">`), `two-col`, `quote`, `refs` (`<ol class="ref-list">`, auto-numbered), `table` (`.cmp-table`, cells `.cell-good|bad|meh`).

**Visual / interactive:**
- `viz` — chart placeholder (`.viz-frame` with inline SVG/canvas).
- `demo` — declarative live demo: `<interactive-demo kind="function-plot" algorithm="gradient-descent">` with `<function fn="…">`, `<param>`, `<readout>` children (see `js/demos.js`; kinds: `function-plot`, `distribution`). No JS needed.
- `arch` — static pipeline of `.arch-node[data-color]` boxes + auto arrows.
- `quiz` — `.quiz-option[data-correct="true|false"]`; click reveals; multi-attempt feedback; optional `<details class="hidden-answer">` explanation (re-fits on reveal).

**Stepped (use `←/→`; deep-linkable as `#/N/M`):**
- `walkthrough` — `data-max-step="K"`, `.walk-step[data-step="k"]`; reveal one step at a time. Each row is a **ledger line**: `.walk-num` (01/02…) · `.walk-content` (`.walk-label` + `.walk-detail`) · `.walk-state` (right-aligned **result chip** — running value/shape). Mark the closing row `data-final="true"` for the dark answer row; tint a row with `data-color="violet|cyan|amber|green|red|accent"`. Three composable add-ons (see the `17b Arch Walk` example, and §5b):
  - **Diagram highlight** — give any inline-`<svg>` shape (or DOM box with `class="arch-box"`) `data-arch-step="k"`; the engine tags it `.is-arch-current` at step k (and `.is-arch-past`/`.is-arch-future`), so a hand-drawn architecture lights up in lock-step. No per-slide JS, any number of steps. Colour the active shape with `data-arch-color="…"`.
  - **Budget accumulator** — `.walk-budget` bar of `.walk-budget-item[data-step][data-budget]` chips + a `[data-walk-total]`; `js/budget.js` sums the revealed chips into a running parameter/FLOP/cost total (`data-budget-format="si"` → 51.9K; `data-budget-cap` → red past the cap; `data-budget-prefix/suffix`). Audited by `budget-audit.mjs`.
  - **Two-col layout** — wrap a `.walk-diagram` (left) + `.walk-flow` (right) in `.walk-layout` so a forward-pass diagram and its ledger sit side-by-side (the diagram height is capped so the budget bar stays on-canvas).
- `e2e` — synced forward-pass: architecture strip + math panel + numeric example, all advancing together (see the attention example). The `data-arch-step` highlight and `.walk-budget` accumulator work here too.
- `archflow` — **step-by-step reveal of a complex architecture** (vector, the flagship — see §5).
- `reverse` / `forward` — layer-by-layer network walk, one engine, two narrative directions. `.reverse-stack` + `.reverse-layer[data-layer]`. `forward` builds input→output; `reverse` opens on the result and `→` peels back to the input.

**ML System Design:**
- `archflow` **blueprint mode** — for production system diagrams: swim-lanes (`.af-lane[data-lane="offline|online"]`), group containers (`.af-group`), edge labels (`data-label`) + kinds (`data-kind="async"` → dashed), system-design roles (`source/pipeline/store/serving/external/monitor`), and an **auto-legend** (`.af-legend[data-auto]` — the engine fills it from the roles/edge-kinds present). For robustness prefer **auto-layout** (`data-layout="grid"` on `.af-canvas`; give nodes `data-lane`+`data-col` instead of `left/top%` → even spacing, no manual nudging) and **orthogonal routing** (`data-routing="orthogonal"`; per-edge `data-route="curved|orthogonal|around"`). For **back-edges / feedback loops** the engine routes along the node-cluster PERIMETER so they never cross nodes or the forward flow (no manual coords). In orthogonal mode back-edges are **auto-detected** (target far upstream → no `data-route` needed; explicit `data-route="around"` / `data-around="top|bottom"` still override), and **parallel loops nest on separate perimeter tracks**. Example: production recsys (offline↔online, feature store, feedback loop). The auditor also checks edge-label↔node and **edge↔node / edge↔edge crossings**.
- `funnel` — multi-stage cascade that narrows (retrieval→ranking→re-rank, ~10⁶→10): `.funnel-stage[data-step]` with width `--w`; pure CSS on the step engine.
- `sequence` — request flow / latency budget: `.seq-actor[data-actor]` lifelines + `.seq-msg[data-step][data-from][data-to][data-lat]` ordered messages + a running budget (`data-budget`, total turns red past the SLA). Engine: `js/sequence.js`. For serving/latency topics.
- Reuse for the rest: `table` = trade-off/decision matrix; `walkthrough`/`e2e` = capacity estimation; `viz` = monitoring/drift; `archflow` = metric trees & feedback cycles.

**Lab / pedagogy:** `misconception` (state the myth → reveal the truth), `derivation` (FLIP-morph algebra steps), `pause` (`data-pause-seconds`, silent think-timer), plus inline helpers on any slide: counterfactual toggle (`.cf-toggle-bar` + `.cf-variant`), recall link (`.recall-link data-recall="N"`), typewriter (`.typewriter`), devil's-advocate overlay (`.devil-overlay`, key `\`).

---

## 5. `archflow` — the standardized contract (read before building one)

Use `archflow` instead of pasting a sequence of near-identical exported PNGs. The
diagram is authored ONCE; the engine reveals it step-by-step, routes the arrows,
moves a focus ring, and syncs a side panel. All vector → themeable, bilingual,
accessible, crisp, deep-linkable.

```html
<section class="slide" data-type="archflow" data-max-step="5" data-current-step="0">
  <div class="af-stage">
    <div class="af-canvas">                         <!-- 1000×600 coordinate space -->
      <!-- EDGES are declarative; the engine routes them between node anchors -->
      <div class="af-edge" data-from-node="af-x" data-to-node="af-q" data-from="2"
           data-from-anchor="right" data-to-anchor="left"></div>

      <!-- NODES: id REQUIRED; position via left/top % (centre). -->
      <div class="af-node" id="af-x" data-role="input" data-from="1" data-focus="1"
           style="left:5%;top:50%">\(X\)</div>

      <!-- a MATRIX node -->
      <div class="af-node af-matrix" id="af-e" data-role="score" data-from="3" data-focus="3"
           style="left:45%;top:42%">
        <span class="af-cell">\(E_{11}\)</span> … 9 cells …
      </div>

      <!-- a REAL IMAGE node (swap src for your PNG / feature-map; alt REQUIRED) -->
      <div class="af-node" id="af-img" data-role="image" data-from="1" style="left:5%;top:18%">
        <img alt="raw input image — a digit" src="…your.png…">
        <div class="af-imgcap">raw input</div>
      </div>

      <div class="af-focus"></div>                  <!-- the moving ring (one per canvas) -->
    </div>
    <div class="af-panel">
      <div class="af-note" data-step="1" data-label="inputs">
        <div class="af-formula">$$X \in \mathbb{R}^{T\times d}$$</div>
        <p><span lang="ru">…</span><span lang="en">…</span></p>
      </div>
      … one .af-note per step (0..max) …
    </div>
  </div>
  <div class="step-controls"><button data-step-act="prev">←</button>
    <span class="step-counter">0/5</span><button data-step-act="next">→</button></div>
</section>
```

Rules:
- **Every `.af-node` referenced by an edge needs an `id`.** `data-role` ∈ `input|query|key|value|score|weight|output|image` (sets colour). Position with `left/top` % (it's the node centre).
- **Edges are `.af-edge` divs** with `data-from-node`/`data-to-node`; the engine draws the SVG — you write no SVG and no path coordinates. `data-{from,to}-anchor` ∈ `left|right|top|bottom|auto` pick exit/entry sides (use explicit sides for a clean left-to-right flow; `auto` guesses).
- `data-from="k"` reveals an element/edge at step k (cumulative). `data-focus="k"` / `"a..b"` rings the element while in range. `.af-note[data-step="k"]` shows that step's caption (current only).
- Matrices: `.af-node.af-matrix` + `.af-cell`; vectors use `style="--cols:1"`.
- **Run the auditor** (`node _audit/archflow-audit.mjs`) — it checks, at every step, that nothing overlaps, every arrow actually touches its nodes, nothing leaves the canvas, and the structure is sound. Fix anything it flags by nudging `left/top` % or anchors.

---

## 6. Lecturer tools & shortcuts

`→/Space/Enter/PageDown` next · `←/PageUp/Backspace` prev · `Home/End` first/last · `O`/`Esc` overview · `T` toolbar · `N` notes · `P` pen · `F` fullscreen · `L` language · `D` theme · `\` devil's-advocate.
Toolbar (bottom, auto-hides) mirrors these. Presenter view: open `?presenter=1` in a second window (BroadcastChannel-synced clock + notes + next-slide). Handout export: `?handout=1` → linear notes+answers for `Cmd/Ctrl+P`. Per-slide `<div class="timer" data-seconds="300">`, QR via `<div class="qr-canvas" data-qr="https://…">`, live JS via `<div class="code-runner">`.

---

## 7. Customization

- Brand colour / fonts: tokens in `css/template.css` `:root` (and `:root[data-theme="dark"]`). Change `--accent` / `--accent-ink` / `--accent-soft`.
- Logo: `<template id="tpl-logo">`.
- Dark theme + language persist in `localStorage`; applied before first paint.

---

## 8. Verify your work (do this after every editing session)

The deck ships with real QA. **Always** run the relevant checks and report results.

1. **Live pre-flight** (cheapest): open the deck; the bottom-right badge shows errors/warnings. It validates step bounds, recall targets, quiz "exactly one correct", language pairs, content-clipping, archflow structure, duplicate slides, etc. 0 errors before you call it done. `window.__preflight.runChecks()` re-runs it from the console.

2. **Headless gates** (in `_audit/`, need Node + Playwright — `npm install` there once):
   - `node ci-gate.mjs` — deck loads, N slides, 0 console errors, KaTeX/Prism/QR render, dark theme, back/forward, and the **standalone makes zero network requests offline**. (If you add/remove a slide, update the expected slide count near the top of `ci-gate.mjs`.)
   - `node preflight-corner.mjs` — pre-flight corner-case detection (needs a static server on :8099, or adapt to `file://`).
   - `node archflow-audit.mjs` — geometry audit of every `archflow` slide (overlaps, arrow connections, off-canvas, edge-label↔node + edge↔node / edge↔edge crossings, structure). Has `--break=overlap|offcanvas|dangling|range|alt` to demo it catching faults.
   - `node sequence-audit.mjs` — geometry audit of every `sequence` slide (actor-chip / message-label overlaps, labels in-bounds, running budget == sum of revealed latencies).
   - `node budget-audit.mjs` — for every `.walk-budget` accumulator, at every step: numeric `data-budget` + in-range `data-step`, running total == Σ revealed chips, `.is-over` matches `data-budget-cap`, and the bar stays on-canvas.
   - `node archflow-negative.mjs` — regression negative tests: injects faults, confirms each is detected, deck clean after.
   `.github/workflows/ci.yml` runs these on every push.

3. **Look at it (VLM).** Render slides to images and actually inspect them — drive with Playwright over `file://`, `page.screenshot()`, then read the PNG. Check: no clipped/overflowing content, subscripts render (no stray `_`/`^`), focus rings sit on the right element, arrows connect, both themes legible, print mode (`page.emulateMedia({media:'print'})`) shows coloured slides (dividers print light-on-dark).

4. **Rebuild the offline file** if you changed css/js/html: `node build-standalone.mjs` (after `build-vendor.mjs` has populated `vendor/`).

---

## 9. Gotchas & lessons (avoid these — each was a real bug)

- **Subscripts/superscripts in plain text** → wrap in KaTeX (§3.2). The #1 issue.
- **Revealed content overflowing** (quiz answers, `<details>`): the engine re-fits on reveal, but keep dense slides compact (e.g. 2×2 option grids) so the fit isn't aggressive.
- **`archflow`: never hand-draw SVG arrows** — use `.af-edge` so they always connect and stay scale-correct; give every node an `id`; image nodes need `alt`; run the auditor.
- **Stepped slides** (`walkthrough/e2e/reverse/forward/archflow`) need `data-max-step`; reverse/forward open at step 0 with `→` as the advance key; deep-links `#/N/M` are honoured.
- **Decorative chrome must not eat clicks** — the slide frame is `pointer-events:none` except real `a`/`button`; keep it that way or sliders/quiz options stop responding.
- **Transitions:** don't add a CSS `transition` to `.slide-body`'s transform (auto-fit reassigns it; a transition causes a bounce). The enter animation is handled in `deck.js`.
- **Slide count** is asserted in `ci-gate.mjs` — update it when you add/remove slides; also fix `agenda` anchors and any deep-links that shift.
- **Standalone stays offline** only if you don't enable the opt-in `arxiv-quote` (live fetch) or the Pyodide runner (CDN, tens of MB). `build-standalone.mjs` prints a NOTE if it finds runtime-fetchable URLs.

---

## 10. What "done" looks like

A lecture is ready when: pre-flight shows 0 errors; `ci-gate.mjs` passes; any `archflow` slide passes `archflow-audit.mjs`; you've VLM-inspected the slides in both themes and print mode; and (if distributing) the standalone rebuilds with zero network requests. Report the check outputs honestly — if something is clipped or a check fails, say so with the evidence.
