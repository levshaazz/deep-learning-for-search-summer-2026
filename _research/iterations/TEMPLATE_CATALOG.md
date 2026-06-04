# TEMPLATE_CATALOG.md — slide-type & component contract (single source of truth)

> Every lecture in this course is built from the types below. Pick a type by its **role**; do not
> invent bespoke per-slide CSS — extend a class instead. Keep this file updated whenever a type or
> class changes. Engine (`Lectures/js/*`) is frozen; all styling lives in `Lectures/css/` (the WBW
> layer is `wbw-art.css`). Two gates must always pass: `wbw-check` (0/0/0) + `visual-gate` (HARD=0).

## Slide types (`data-type=…`)
| type | role / when to use | key DOM | notes |
|---|---|---|---|
| `title` | deck opener | `.title-header/.title-body/.title-footer` | hand-font H1 (Patrick Hand) |
| `agenda` | outline w/ jump links | `.agenda-grid > a.toc-item[href="#/N"]` | anchors must resolve to dividers |
| `objectives` | measurable outcomes | `ul.obj-list > li.obj-item` | ✓ check bullets |
| `divider` | section break | `.divider-num / h1 / .divider-sub` | hand-font H1; good host for art/cameo |
| `definition` | key term | `.def-card > .def-tag/.def-term/.def-body` | WBW sketched card; tag in hand-font; term serif |
| `formula` | math derivation | `.formula-stage` (KaTeX) | precise — never replace math with art |
| `table` | comparison/data | `table.cmp-table` | WBW sketched box + hand-font tinted header |
| `two-col` | side-by-side | `.twocol > .twocol-col` | can host `.split-art` (content + art) |
| `viz` | one diagram/illustration | `.viz-frame > svg|img` | img: `max-width/height:100%` (never clips) |
| `walkthrough` | stepped reveal | `.walk-flow > .walk-step[data-step]` | needs `data-max-step`; show every arithmetic step |
| `e2e` | end-to-end worked example | `.e2e-step` | stepwise, all numbers visible |
| `misconception` | bust a myth | `.misc-card > .misc-statement/.misc-truth` + reveal btn | WBW sketched card; can be `.split-art` |
| `quiz` | check understanding | options w/ exactly one `data-correct="true"` | |
| `arch` | architecture flow | `.arch-diagram > .arch-node/.arch-arrow` | precise — keep; art is companion only |
| `sequence` | latency/sequence | `.seq-*` | precise — keep |
| `blueprint` | system blueprint | `.bp-*` | precise — keep |
| `refs` | references | `ol.ref-list` | |
| `final` | closing / Q&A | `.final-body` + contact-grid + QR | dense; art as corner `.cameo` only |
| **`art-hero`** ⭐new | full-bleed narrative beat | `.art-hero > .art-hero__kicker/__fig/__cap` | WBW illustration as the slide |
| **`timeline`** ⭐new | history / evolution arc | `ol.tl > li.tl-node > .tl-card`; `.is-pivot`, `data-density="dense"` | serves the "history" rubric |

## Reusable components (classes, in `css/wbw-art.css`)
| class | purpose |
|---|---|
| `.split-art` (`.split-art__body/__fig`, `.art-left`) | content + framed illustration, 2-col — the **BOTH** layout (example + WBW art) |
| `.art-strip` | thin companion illustration band under a precise diagram |
| `.cameo` (`.br/.tr/.bl`) | small decorative Serega in a corner (absolute, non-interactive) |
| `.numgrid` (`.ng-cell`, `.is-hot/.is-dim`, `.numgrid-zoom`) | data-as-numbers (token-IDs, embedding floats, TF-IDF) |
| `.poses-row` ⭐s3 | DOM strip of pose names under a character-sheet `.art-hero__fig`; one `<span>` per pose, kicker-sized so labels read at hall scale |
| `.viz-frame` | light-canvas figure box (pinned for dark theme); grid track fixed `minmax(0,1fr)` so imgs never clip |
| `.arch-node[data-color="current"]` ⭐s3 | orange-ring accent on the currently-active stage of a reused course-arc; default chips stay monochrome ink (no rainbow) |
| WBW card pass | `.def-card/.misc-card/.callout` sketched border + shadow; `.cmp-table` sketched box + tinted hand-font header |
| `.wbw-mark` / `.wbw-arrow` / `hr.wbw-rule` | highlighter underline / inline arrow / sketch divider |
| display face | Patrick Hand (vendored, OFL) on title/divider H1, kickers, `.def-tag`, `.misc-label`, table headers — never body/math |

## Illustration policy (see AGENDA "REPLACE vs BOTH")
- Precise/worked example → **keep it**, add WBW art as `.split-art`/`.art-strip` companion (BOTH).
- Pure hook/metaphor/placeholder → WBW art may **replace** the SVG.
- Useful example but no art + room → **add** a WBW companion.

### Canonical BOTH reference slides (the patterns to copy)
- **`.split-art` (side-by-side, content + art):**
  - L1 s14 "Three products, one retrieval problem" — `.cmp-table` (Google/Ozon/Yandex Neuro) on the left, the grounding doodle on the right.
  - L2 s8 "Pixels interpolate; symbols do not" — `.split-art.art-left` (doodle left, precise gradient+discrete SVG right).
- **`.art-strip` (companion band under a precise diagram):**
  - L2 s20 "Granularity trade-off triangle" — full-size SVG triangle on top, the juggler companion below as a narrow band.

### Session-2 body-card refinements (in `wbw-art.css`)
- `.agenda-grid .toc-item` — sketched-corner border + ink shadow (matches def/misc cards).
- `.slide[data-type="divider"] .divider-num` — hand face + accent underline tick.
- `.obj-list .obj-check` — hand face + accent ink so objectives bullets read WBW.
- `.split-art .obj-list` — tightened spacing so BOTH-slides don't feel floaty.

### Session-3 contrast hardening (in `slides.css`)
- `.slide[data-type="divider"] .divider-sub` — theme-aware tone via `color-mix(in srgb, var(--bg) 70%, transparent)` (replaces hardcoded `rgba(255,255,255,.65)` which was ghost-text on the cream canvas in dark theme).
- `:root[data-theme="dark"] .slide[data-type="divider"] .divider-num` — deep amber `#8a5d18` (the light-theme bright `--c-amber` `#F4C975` is 1.26:1 on cream, fails WCAG AA).
- Both fixes caught by the new contrast detector in `visual-gate.mjs` (LOWCONTRAST is HARD).

### `.misc-anchor` ⭐s4 — promoted from inline pattern to shared class
Every `.misc-card .misc-truth` that ends with a WORKED example / numeric anchor / citation now uses:
```
<p class="misc-anchor">
  <strong>Worked example.</strong> …concrete numeric anchor or two-case demo…
</p>
```
Lives in `wbw-art.css` (thin orange-bar left rule, `--fs-small`, line-height 1.45). Replaces the
session-3 inline-style pattern (`style="margin-top:…;padding-left:…;border-left:3px solid …"`).
Applied across **7** misconception slides: L1 s27 (exact-match cases), L1 s29 (Joachims γ=0.94
position-bias simulation, grounded in `_research/data/position_bias.json`), L1 s39 (Kohavi
⅓ online-survival), L1 s52 (Covington 2016 §3 click → weighted-watch-time reframe), L2 s27 (BPE
singer-merge ambiguity), L2 s43 (SolidGoldMagikarp token id 28666), L2 s66 (cosine
counter-example: u=(1,1), v=(10,10) → cos=1.0, Euclid≈12.73, grounded in
`_research/data/cosine_examples.json[classic_pairs[0]]`). Promotion rule: promote inline patterns
to a class once usage ≥6×.

### Session-4 contrast & spacing refinements (in `wbw-art.css`)
- `.slide[data-type="divider"] .divider-sub` — theme-aware opacity per branch: light 0.85
  (cream-on-ink optically loses ~5%), dark 0.78. Replaces the single-opacity rule.
- `.slide[data-type="timeline"] .tl-kicker` — `color-mix(in srgb, var(--ink) 72%, transparent)`
  so the PENN TREEBANK / SCHUSTER & NAKAJIMA / SENNRICH ET AL. row stops reading as faint
  reddish ochre in dark theme. Both themes high-contrast, no per-theme override needed.
- `L2:s62` divider+viz combo — viz-frame inline tweaked to
  `max-height:32vh; margin:var(--sp-6) auto 0; max-width:46%` so wraith art clears the
  divider-sub without OFFFRAME (the cleanest place for one-off divider+art spacing).
- `L2:s53` cosine-formula slide trimmed (viz-frame `210→170 px`, redundant caption moved
  into speaker notes) → no longer in OVERFLOW-V list.

### Session-4 detector promotion (in `_audit/visual-gate.mjs`)
- **`SUBJECTSMALL`** — new in-browser canvas-pixel scan computes per-PNG subject bounding box
  (non-near-white ink area) ÷ canvas area. Flags any non-cameo image whose subject covers
  <55% of its own PNG canvas (i.e. wide white rails baked in by the model). One scan per
  unique URL per deck, light-theme only (PNGs are theme-agnostic). WARN-level by default
  to allow legitimate composition margins; auto-escalates to HARD below 40% (truly wasted
  canvas). Caught the borderline L2-48 sir-cosine PNG at 51% on this session's verify run.

### Session-5 refinements (in `wbw-art.css`)
- **Closing slide H1 marker face** — `.slide[data-type="final"] h1` joins the marker-display
  family alongside title and divider H1s, so the deck bookends the hand-feel chrome it opens
  with. Reversible (one-line selector add).
- **Divider "PART NN" dark-theme bump** — `:root[data-theme="dark"] .slide[data-type="divider"]
  .divider-num { font-weight: 600; letter-spacing: 0.22em; }` plus accent-underline thickening
  to 5 px so the part-break reads as a confident kicker at hall scale in dark; light theme
  unchanged.
- **Title-row metadata light-theme contrast** — `.title-footer .meta-label` (`LECTURER / DATE
  / ROOM`) lifted from the AA-floor `--ink-3` to `color-mix(--ink 72%)`; `.meta-value` to 92%.
  Same family-of-fix pattern as the session-2 dark-theme `.divider-sub` and the session-3
  dark-theme `.divider-num`. Selectors added to the gate's text-selector list below.
- **L0:s10 arch-of-course tightening** — `.slide[data-type="arch"][data-screen-label="10 …"]
  .arch-diagram { height: 360px }` (was 660 px), companion `.art-strip img { max-height: 32vh;
  max-width: 88% }` so the L0-08-coursearc stepping-stones doodle can grow into the reclaimed
  ~300 px vertical band. Scoped by `data-screen-label` so L1:s17 / L1:s49 (denser arches)
  keep the full 660 px budget.
- **L0:s08 pull-quote tightening** — `.quote-mark { font-size: 200px; line-height: 0.7;
  margin-bottom: var(--sp-2) }` and `blockquote { margin-top: 0; margin-bottom: var(--sp-3) }`
  on the L0:s08 quote slide only. (Tried raising the viz-frame max-height — pushed the image
  OFFFRAME; reverted to a spacing-only fix that centres the composition vertically without
  changing the figure size.)

### Session-5 detector & exemption refinements (in `_audit/visual-gate.mjs`)
- **`SUBJECTSMALL` horizontal-span heuristic** — the session-4 bbox-area heuristic is blind
  to centred subjects with wide left/right rails (the session-3 L2:s57 failure mode). Added
  a per-axis check: `bbox-width / canvas-width < 60%` ⇒ flag with the message *"centred
  subject with empty left/right rails, re-prompt with 'subject fills ≥85% of frame width
  edge-to-edge'"*. The two-track detector now reports `{area, hspan}` per URL and surfaces
  whichever metric trips first. New image prompts must satisfy BOTH the ≥80% width clause
  (subject extent) AND the area threshold (subject mass).
- **`SUBJECT_EXEMPT` allowlist** — small Node-side `Set<basename>` of editor-blessed
  exemptions, applied before SUBJECTSMALL flags fire. Seeded with `L2-56-cosine-vs-euclid.png`
  (the editor's post-session-4 trim + viz-frame centred-inset fix closed that item; re-flagging
  would re-open a resolved case). Add an entry here ONLY when the editor closes a SUBJECTSMALL
  finding by a slide-level CSS fix rather than a re-prompt.
- **`.title-footer .meta-label / .meta-value`** added to the WCAG-AA `TEXT_SEL` sweep so
  the title-row metadata is gated the same way the session-2 `.divider-sub` and session-3
  `.divider-num` are.

## Gates (both must stay green)
- `node _audit/wbw-check.mjs` → 0 errors / 0 warnings / 0 console errors.
- `node _audit/visual-gate.mjs` → HARD=0 across BOTH light AND dark themes; covers OVERFLOW-H,
  OFFFRAME, CLIPPED, **LOWCONTRAST** (WCAG AA on `.divider-sub`, `.divider-num`,
  `.slide-kicker`, `.tl-kicker`, `.art-hero__kicker`, `.viz-caption`, `.poses-row`, `.obj-text`,
  `.badge`, `.tag`, `figcaption`, **`.title-footer .meta-label`**, **`.title-footer .meta-value`** ⭐s5),
  and **SUBJECTSMALL** ⭐s4 (area heuristic — escalates to HARD <40% subject-coverage; surfaces
  40–55% as WARN for human re-prompt judgement) + **SUBJECTSMALL horizontal-span heuristic** ⭐s5
  (catches centred-with-rails; <60% width = WARN). Editor-blessed exemptions live in
  `SUBJECT_EXEMPT` in `_audit/visual-gate.mjs`.

## Adding a new type/class (checklist)
1. Add the CSS to `wbw-art.css` (reusable class, theme-aware, both light/dark).
2. Document it here (row above) with role + DOM + when-to-use.
3. Add a representative slide to the gates' shot lists if it carries images.
4. Run both gates green (light AND dark). Prefer one correct class over per-slide tuning.

### Authoring rule — math vs literal strings (s-bugfix)
KaTeX display math `$$…$$` renders on ONE line and NEVER wraps. Long literal strings / code
(corpus text, file paths, token lists) must be **wrapping HTML** (`<code>`/mono span with
`white-space:normal; overflow-wrap:anywhere`), never `\texttt{}` inside `$$…$$` — otherwise they
overflow the panel's `overflow:hidden` and clip (L2:s30). The `TEXTCLIP` gate in visual-gate.mjs
(HARD) now catches this class.
