# AGENDA.md — standing brief for each autonomous iteration session

You are running as one autonomous **Claude Code** session inside the repo
`Deep Learning for Search [Summer 2026]`. You are session **{SESSION_N} of {SESSION_TOTAL}**.
Work the standing agenda below, then verify. **Prompts and work get stricter and deeper every
session.** Read `iterations/LESSONS.md` FIRST — it carries the previous sessions' VLM findings;
fix the `blocking` items before anything else.

## The decks (the product)
- `Lectures/00-introduction.html` (L0, 22 slides) · `01-search-ir-ml-system-design.html` (L1, 56)
  · `02-nlp-tokenization-similarity.html` (L2, 70). Same template engine; styles in `Lectures/css/`.
- Canon: `_research/voice_wbw.md` (voice), `iterations/CHARACTER_BIBLE.md` (cast),
  `iterations/REDESIGN_BRIEF.md` (the visual redesign), `iterations/RUBRIC.md` (how you're judged),
  `iterations/TEMPLATE_CATALOG.md` (slide-type contract), `iterations/AUDIT_V2.md` (the audit-
  strengthening spec — implement its build-order; obey its §4.1 coverage rule + §2.4 fixture rule).
- Image pipeline: `_research/gen_images.py` (hardened prompts; `python3 _research/gen_images.py all`
  regenerates, `--force` overwrites). Wiring helper: `_research/wire_art.py`.

## Invariants (NEVER violate)
- Content language **English**; all math in **KaTeX**; code via Prism; QR intact.
- **TWO mandatory gates, both must pass:**
  1. `node _audit/wbw-check.mjs` → **0 errors / 0 warnings / 0 console errors**, counts L0=22,
     L1=56, L2=71 (update a count only if you deliberately add/remove slides — then fix agenda
     `#/N` anchors + renumber `data-screen-label`s).
  2. `node _audit/visual-gate.mjs` → **HARD=0** (no CLIPPED / OFFFRAME / OVERFLOW-H / LOWCONTRAST /
     **TEXTCLIP** — text/math clipped inside its own overflow:hidden box). A slide can be
     0/0/0 AND visually cropped — this catches that. Never ship a HARD finding.
- Do **not** edit the JS engine (`Lectures/js/*`). Redesign via CSS only.
- Precision content stays exact (cascade numbers, BPE merges, cosine computation, archflow/sequence).

## Standing tasks
0. **Audit strengthening (`iterations/AUDIT_V2.md`) — top priority going forward.** Implement the
   AUDIT_V2 items in its "Build order", flipping each Status to DONE and adding it to the gate
   `--list`/summary as you ship it. **Every new HARD detector MUST land with a known-bad fixture in
   `_audit/fixtures/` that proves it fires (§2.4) — no silent detectors.** The §4.1 coverage rule is
   binding immediately: deterministic gates run at 100% of slides, and the VLM moves to full
   coverage with stratified rotation (no fixed ~15% shot-list). Report `inspected/total` per audit.
1. **Course cover image.** Generate a cover/hero illustration in the locked style (Serega + cast,
   green tübetey) usable as the course banner and the GitHub repo social image. Save the exact
   prompt as an artifact in `_research/iterations/prompts/cover.txt` and the image under
   `Lectures/assets/img/_char/cover.png` (+ a README note). Wire it where appropriate (e.g., the
   course `index.html` / L0).
2. **Character bible.** Keep `iterations/CHARACTER_BIBLE.md` authoritative; when you introduce or
   refine a character, update it so future lectures/HW/labs reuse the same cast.
3. **Regenerate ALL images, hardened prompts.** Every image prompt must carry the anti-pattern
   block (no baked-in text/titles/"Wait But Why", locked GREEN tübetey, flat 2D). Rewrite weak
   prompts, then `gen_images.py --force all`, then re-optimize (resize ≤1600px + 128-colour
   palette), and re-verify visually that none has stray text and Serega's cap is green.
4. **Full visual redesign** per `REDESIGN_BRIEF.md` — toward the Wait-But-Why feel, while keeping
   hall-legibility and all hard constraints. Incremental + reversible (CSS layer).

### Mascot reference image (editor directive)
Serega-scenes should use `Lectures/assets/img/L0/L0-03-whoami.png` as the **canonical character
reference** so the mascot looks identical run-to-run. Plumbing is ready: `gen_images.py --ref <url>`
passes a portrait as `image_url` (mode=image) for every `has_serega` job (A/B-validated: it composes
a NEW scene, doesn't edit the portrait; non-Serega jobs stay text-only). **Dependency:** the API
needs a public **https** URL — activate `--ref` once whoami is reachable (GitHub Pages when the
course publishes, or a stable upload). Until then, text-only prompts already hold the green cap.

### Data grounding (applies across all tasks — anti-«отсебятина»)
Wherever a slide shows numbers, distributions, tokenizations, embeddings, or worked examples that
*can* be derived from data, **write Python that generates them from OPEN datasets** (e.g. NLTK
corpora, HuggingFace `tokenizers`/`datasets`, FLORES/Tatoeba, `sentence-transformers`, sklearn
toys). Save each generator as `_research/data/<topic>.py`, its output (CSV/JSON/PNG) alongside, and
document it in `_research/data/README.md` (dataset + license, command, output, which slide consumes
it). Replace invented numbers with these grounded artifacts. If a value cannot be grounded, cite a
source in the slide notes. Prefer regenerating figures from data over hand-drawn SVG where accuracy
matters.

### CNN-derived templates (separate strict task)
Read `cnn_autoencoders_offline.html`. It uses our engine. Critically evaluate the three slide
patterns the editor flagged — an **origin/cause→effect** narrative, a **timeline (1958 → 2020+)**,
and an **image-as-grid-of-numbers** explainer. Be strict:
- Build a reusable **`timeline`** slide template (CSS, our engine) — it directly serves the
  "history / evolution" rubric. Apply it where our decks need a historical arc (e.g. classical IR →
  neural → RAG; tokenization history; similarity-measures history).
- Decide with justification whether the origin-story and image-grid patterns earn a place in the
  search/NLP/similarity decks; only add what genuinely improves teaching — do **not** import a
  template just to use it. Record the verdict in `iterations/LESSONS.md`.

### Illustration appropriateness — REPLACE vs BOTH (per-slide judgement)
For every slide that has, or could have, an illustration, judge the existing concrete content
BEFORE adding WBW art, and pick exactly one:
- **BOTH (keep example + add WBW art):** if the slide's existing diagram/SVG is a *useful, precise,
  or worked example* — real numbers, a comparison, a step-by-step, named cases, a citation anchor —
  then KEEP it and add the WBW illustration as a **companion** (`.split-art` beside it, or an
  `.art-strip`/cameo). **Never delete a working teaching example to make room for a doodle.**
- **REPLACE with WBW art:** only when the slide is a *pure hook / metaphor / divider / placeholder*
  whose SVG carries no precise teaching content (or whose notes literally call it a placeholder).
- **ADD (art was missing):** if a slide has a useful example but NO illustration and there's room,
  add a WBW companion — don't leave it bare just because an example exists.
Rule of thumb: **WBW art replaces placeholders/metaphors and accompanies real examples — it never
removes a working example.** Verify with the visual-gate (companions must not overflow/clip).

Canonical cases to CORRECT (regressions from an over-eager "use every image" pass — fix these and
use them as the reference for the judgement above):
- **L1 s14 (Products hook):** the Google/Ozon/Yandex 3-product comparison was useful → restore it
  and make `L1-14-grounding` a companion (BOTH), not a replacement.
- **L2 s8 (Discreteness):** the gradient-bar / cat·dog discreteness viz was useful → restore +
  `L2-08-discreteness` doodle as companion (BOTH).
- **L2 s20 (Tradeoff):** has a useful viz but no WBW art → ADD a WBW companion.

## Operational rules (hard — learned the hard way)
- **NEVER spawn a background wait-loop like `until ! pgrep -f "X"; do sleep; done` whose pattern
  matches the loop's OWN command line** — it can never exit and will hang the whole session. Run
  `gen_images.py` in the FOREGROUND, or poll by counting output files.
- **After regenerating images, ALWAYS re-optimize** them (`magick <f> -resize '1600x1600>' -strip
  -colors 128 -depth 8 <f>`; cameos at 600px) so the decks stay lightweight (≈22 MB, not ~95 MB).
- **Targeted re-prompt** with `gen_images.py --force --only <slug…>`, not blanket `--force all`,
  unless a *global* prompt change genuinely requires regenerating everything.
- Finish well inside the harness watchdog (default 75 min); do a bounded slice, then stop at 0/0/0.

## Template as a PRODUCT — standardize · unify · automate
This template will carry **many more lectures**. Treat it as a durable, reusable product, not a
one-off. Every session must leave it more standardized than it found it:
- **Reusable classes over inline styles.** When you see an inline-style pattern repeated across
  slides, promote it to a class in `css/wbw-art.css` (as already done for `.split-art`, `.numgrid`,
  `.timeline`, `.cameo`, `.art-strip`, the viz-frame img fix). Refactor stragglers toward classes.
- **Maintain `_research/iterations/TEMPLATE_CATALOG.md`** — the single source of truth for slide
  types: every `data-type`, its required DOM structure, the classes it uses, and a one-line
  "when to use". Update it whenever you add/change a type. New lectures pick types from this catalog.
- **Engine is frozen.** Never edit `Lectures/js/*`. All design lives in the CSS layer so it stays
  reversible and portable to future decks.
- **Consistency:** identical roles get identical treatment across ALL decks (a definition looks the
  same everywhere). Kill bespoke per-slide CSS; fold it into the shared class.
- **Automate the guardrails:** both gates (`wbw-check`, `visual-gate`) must stay green; when you add
  a slide type, add a representative slide to the gates' shot lists and document it in the catalog.
  Prefer a class that's right everywhere over hand-tuning slides one by one.

## Parallelism — go fast where work is INDEPENDENT
Speed matters. Within a session, fan out to **parallel subagents** (the Agent/Task tool) for work
that touches **disjoint files**; serialize anything that touches shared files.
- **Parallelize (disjoint files):**
  - *Per-deck slide edits* — `00`, `01`, `02` are separate `.html` files → up to 3 agents, one per
    deck, at once.
  - *Image generation* — `gen_images.py` jobs are independent (mind the API's 60 req/min limit).
  - *Data scripts* — each `_research/data/*.py` is independent.
  - *Per-slide VLM spot-checks* — independent reads.
- **Serialize (shared files — one agent / one phase only):** `css/*` (especially `wbw-art.css`),
  `_research/gen_images.py`, `TEMPLATE_CATALOG.md`, `AGENDA.md`, `LESSONS.md`.
- **Order:** do shared CSS/template/prompt changes FIRST in a single agent, THEN fan out the
  per-deck/per-image work that consumes them. Never let two agents edit the same file at once.
- **Rejoin:** after parallel work, run BOTH gates once on the merged state before finishing.

## Per-session protocol
1. Read `LESSONS.md`; fix `blocking` items first.
2. Do a bounded, high-value slice of the standing tasks (don't try to finish everything in one
   session — depth over breadth; the loop has {SESSION_TOTAL} sessions).
3. If you changed image prompts, regenerate + re-optimize the affected images.
4. Generate/refresh any data-grounded artifacts you relied on.
5. **Gates (both):** `node _audit/wbw-check.mjs` = 0/0/0 AND `node _audit/visual-gate.mjs` = HARD 0.
   Fix any failure before finishing.
6. Leave the repo in a working state. Summarize what you changed in `session_{SESSION_N}/notes.md`
   (the harness creates the dir): files touched, images regenerated, data artifacts added,
   decisions, and what you recommend the next session tackle.
7. **Evolve the prompts:** make the image prompts and your own working prompts stricter, more
   detailed, and better-targeted than last session; note the diff in `notes.md`.

The harness will screenshot the decks and run an independent VLM review against `RUBRIC.md` after
you finish; its findings land in `LESSONS.md` for the next session.
