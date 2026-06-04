# ART_INSERTION_MAP.md — Phase D wiring plan (per-image slot + ready `<img>`)

> Purpose: once the PNGs from `IMAGE_PROMPTS.md` land at their target paths, Phase D becomes
> mechanical paste-and-test. This file says, for **every** image: which slide, which insertion
> **mode**, the **ready `<img>` snippet**, and any **risk to verify** in headless render.
> Nothing here is applied yet — it's the plan I execute on your **go** (after images exist).
>
> **Gate after every edit:** `node _audit/wbw-check.mjs <deck.html>` must stay **0/0/0**, plus a
> headless light+dark screenshot check (no overflow, no dark-on-dark, art readable).

---

## The three insertion modes (reusable snippets)

**Mode 2 — REPLACE a hook/metaphor SVG inside an existing `.viz-frame`** (the safe default).
`.viz-frame` pins a **white canvas in both themes** (`css/slides.css:449`), so off-white art
reads correctly in dark mode. Swap the `<svg>…</svg>` for:
```html
<img src="assets/img/Lx/Lx-NN-slug.png?v=1" alt="DESCRIPTIVE ALT"
     style="width:100%; height:100%; object-fit:contain; display:block;" />
```
Keep the slide's `<p class="viz-caption">…</p>` (it carries the precise anchor / citation).

**Mode 1 — FULL-SLIDE hook on title / quote / divider / final** (no viz-frame present).
Drop a framed image into the slide's inner centered `<div>` — `.viz-frame` guarantees the light
canvas; cap height so the centered text layout doesn't overflow (tune in D):
```html
<div class="viz-frame" style="height:auto; max-height:46vh; aspect-ratio:16/9; margin-top:var(--sp-3);">
  <img src="assets/img/Lx/Lx-NN-slug.png?v=1" alt="DESCRIPTIVE ALT"
       style="width:100%; height:100%; object-fit:contain; display:block;" />
</div>
```
⚠️ Risk: vertical overflow on title/quote/final (text + QR + image). Verify headless; shrink
`max-height` or move to a side column if it overflows.

**Mode 3 — Serega CAMEO** (small decorative corner figure). The `.slide` is the positioning
context; keep it non-interactive and out of the safe text area:
```html
<img src="assets/img/_char/serega-cameo-point.png?v=1" alt="" aria-hidden="true"
     style="position:absolute; right:36px; bottom:36px; width:150px; height:auto;
            pointer-events:none; opacity:.95;" />
```
⚠️ Risk: confirm the cameo doesn't overlap `data-screen-label`, page chrome, or body text in
either theme; nudge `right/bottom` if it does. Transparent-background PNG strongly preferred.

> **Precision slides are NEVER replaced.** Where a diagram carries exact data (cascade numbers,
> BPE-merge steps, cosine arithmetic, archflow/sequence, the arch spine), art is at most an
> *added companion* on a hook/divider — the precise SVG stays. Such rows are marked **COMPANION**.

---

## L0 — 00-introduction.html  (`Briefing`)

| Image | Slide (`data-screen-label`) | Mode | Action / risk |
|---|---|---|---|
| `L0-01-briefing.png` | 01 Title | 1 | Full-slide hook. ⚠️ Title already has header/body/footer — likely no room; prefer a **slim banner** (`max-height:30vh`) above the footer, or skip art on title and rely on subtitle. Test overflow. |
| `L0-03-whoami.png` | 03 Divider P01 | 3 | Cameo of Serega waving in the corner of the "Who I am" divider. Transparent PNG. |
| `L0-06-quote-trail.png` | 06 Quote | 1 | Framed trail image under the blockquote (`max-height:40vh`). ⚠️ quote layout is centered — verify it doesn't push the attribution off-canvas. |
| `L0-08-coursearc.png` | 08 Architecture | **COMPANION** | Slide is the precise `arch-diagram` spine — **do not replace**. Optionally add as a small decorative strip below `.small.muted` caption, or skip. Keep the diagram. |
| `L0-20-sendoff.png` | 20 Quote (final callback) | 1 | Captain's send-off under the closing blockquote (`max-height:40vh`). Closes "The Briefing". |

Reserve: `_char/serega-cameo-point.png`, `_char/serega-cameo-puzzled.png` for any divider (mode 3).

---

## L1 — 01-search-ir-ml-system-design.html  (`The Lost Record`)

| Image | Slide | Mode | Action / risk |
|---|---|---|---|
| `L1-06-needle.png` | 06 Hook · Drowning (quote) | 1 | Framed under the Naisbitt quote. Opens the catchphrase. ⚠️ centered-quote overflow. |
| `L1-08-lossy-need.png` | 08 Visualization · Lossy need | 2 | Replace SVG (conceptual funnel, no precise data). Keep caption. |
| `L1-14-grounding.png` | 14 Visualization · Products hook | 2 | Replace — verify slide 14 is a metaphor viz (not a product table) before replacing; else COMPANION. |
| `L1-22-leaky-bucket.png` | 22 Recall ceiling | **COMPANION** | Slide carries the recall-ceiling argument/figure — add as companion on the side; keep any numeric viz. |
| `L1-24-lexical-gremlin.png` | 24 Visualization · Lexical gap | 2 | Replace OK (already a doodle-style couch/sofa/jaguar diagram). **Keep the `viz-caption`** with the Furnas ~80% / <20% anchor. Lexical Gremlin lives here. |
| `L1-25-zipf-beach.png` | 25 Visualization · Long tail | 2 | Replace SVG (conceptual Zipf curve). |
| `L1-29-position-bias.png` | 29 Misconception · Position bias | 2 | Replace inner viz if present; else COMPANION on the misconception card. |
| `L1-32-not-a-system.png` | 32 Hook · Not a system (quote) | 1 | Framed under "A model in a notebook is not a system". Opens the SysDes arc. |
| `L1-33-iceberg.png` | 33 ML iceberg | 2 | Replace the iceberg SVG directly (art IS the iceberg). Keep `slide-kicker` Sculley 2015. |
| `L1-40-goodhart.png` | 40 Visualization · Goodhart | 2 | Replace OK (curves are illustrative, not data). Keep caption. Goodhart the Trickster lives here. |
| `L1-43-flywheel.png` | 43 Data flywheel | 2 | Replace SVG (conceptual flywheels). |
| `L1-56-found.png` | 56 Final | 1 | Decorative on the final slide. ⚠️ final has contact-grid + QR — use a **small** banner or corner image; do not crowd the QR. Closes "The Lost Record". |

---

## L2 — 02-nlp-tokenization-similarity.html  (`First Contact` + LOTR)

| Image | Slide | Mode | Action / risk |
|---|---|---|---|
| `L2-06-first-contact.png` | 6 Hook (quote) | 1 | Framed under "Two minds, no shared symbols". Opens "First Contact". |
| `L2-08-discreteness.png` | 8 Discreteness | 2 | Replace SVG (conceptual). |
| `L2-10-zipf.png` | 10 Zipf | 2 | Replace SVG (conceptual bar chart). |
| `L2-23-tokenosaurus.png` | 23 Definition BPE | **COMPANION** | Definition slide (def-card, no viz-frame). Add as **mode 1** framed companion below the def-card, or a **mode 3** cameo. Tokenosaurus introduced here. Don't touch the worked BPE examples (24–25). |
| `L2-37-digits.png` | 37 Digits | 2 | Replace SVG (illustrative "327" split). |
| `L2-41-token-tax.png` | 41 Token tax | 2 | Replace SVG (illustrative per-language bars). Keep caption / arXiv ref. |
| `L2-42-glitch-token.png` | 42 Glitch tokens | 2 | Replace SVG (conceptual scatter). |
| `L2-49-query-angle.png` | 49 Hook P4 (quote) | 1 | Framed under "relevant = close". |
| `L2-48-sir-cosine.png` | 48 Divider P4 | 1 | Framed on the "How close are two meanings?" divider. Opens the LOTR arc. ⚠️ divider is centered text — cap height. |
| `L2-56-cosine-vs-euclid.png` | 56 Relationships | 2 | Replace SVG (illustrative (1,1)/(10,10)). Keep any formula caption. |
| `L2-61-wraith.png` | 61 Divider high-d | 1 | Framed on the high-d divider. Curse-of-Dimensionality Wraith. |
| `L2-62-concentration.png` | 62 Concentration | 2 | Replace SVG (illustrative histograms). |
| `L2-63-hubness.png` | 63 Hubness | 2 | Replace SVG (conceptual). |
| `L2-64-anisotropy.png` | 64 Anisotropy | 2 | Replace SVG (conceptual cone→sphere). |
| `L2-70-first-contact-callback.png` | 70 Final | 1 | Small decorative on the final (mind the QR). Closes "First Contact". |

---

## Phase D execution order (when images exist)
1. **Mode-2 replacements first** (lowest risk — drop into existing `.viz-frame`, art is already
   off-white on a pinned light canvas). Gate 0/0/0 + light/dark shot per deck.
2. **Mode-1 hooks/dividers/finals** next — these need height tuning; test overflow each.
3. **Mode-3 cameos + COMPANION adds** last — verify no overlap with `data-screen-label`/QR/body.
4. After each deck: `node _audit/wbw-check.mjs <deck>` → 0/0/0; then headless screenshot audit
   (existing `_audit/visual-iter*.mjs` harness pattern) in both themes.
5. When art lands on a slide, **delete that slide's `IMAGE PROMPT` draft** from its speaker notes
   (the `[rewrite]` drafts in `IMAGE_PROMPTS.md` track which).

## Open decisions to confirm before/at Phase D
- **Title (L0-01) and finals (L1-56 / L2-70):** art or skip? These slides are content-dense
  (header/footer, contact-grid, QR). Recommendation: **skip or slim-banner only**.
- **COMPANION vs REPLACE** on L1-14, L1-22, L1-29: depends on whether the current slide viz is a
  metaphor or carries data — I'll confirm by reading each at Phase D start and downgrade to
  COMPANION if it holds precise content.
