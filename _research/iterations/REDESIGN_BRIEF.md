# REDESIGN_BRIEF.md — full visual redesign toward the Wait-But-Why spirit

> Authorized scope: a **full visual redesign** of the deck's look (this overrides the old
> "existing template only" invariant). The redesign is implemented in CSS (`Lectures/css/`,
> primarily a new/extended `wbw-art.css` + overrides), **never by changing the JS engine**
> (`js/deck.js` etc.) and never by breaking the slide-type contract.

## North star
The decks should *feel hand-made and friendly* — like a brilliant explainer drawn on paper —
while staying **crisp and legible from the back of a large lecture hall**. Warmth, not clutter.

## Visual language (target)
- **Canvas:** off-white paper (#FBFAF6) as the default surface in light theme; a deep ink-navy
  paper in dark theme. The doodle art and the slide chrome should look like they live on the
  same paper.
- **Palette:** black ink + exactly two accents — course **blue #2A6FDB** and warm **orange
  #E8743B**. Use accents sparingly for emphasis, never as large fills behind text.
- **Type:** keep the serif for display/headers (friendly, editorial); consider a subtle
  hand-feel only for kickers/labels, NEVER for body or math. Body stays highly legible.
- **Hand-drawn accents:** doodle underlines, arrows, brackets, circled emphasis, torn-paper or
  sketch dividers — as lightweight CSS/SVG flourishes, used with restraint (≤1–2 per slide).
- **Air:** generous margins and line-height; one idea per beat; large minimum font sizes.
- **Art as first-class:** the Serega/creature illustrations are part of the design, not decoration
  bolted on. Section dividers and hooks lean on art.

## Hard constraints (DO NOT break — verified every session by `wbw-check` + screenshots)
1. **0 errors / 0 warnings / 0 console errors** on all three decks (headless).
2. **KaTeX math** must still typeset; **no raw `$$` leaks**; code (Prism) and QR still render.
3. **Light AND dark themes** both legible; viz-frames keep their pinned light canvas.
4. **Auto-layout / auto-scale** must hold: nothing overflows the 1920×1080 canvas; every chart,
   table, diagram and illustration is **fully visible**; type large enough for a big hall.
5. Slide **types keep working** (title, agenda, objectives, divider, definition, formula, table,
   two-col, viz, walkthrough, e2e, misconception, quiz, arch, sequence, blueprint, refs, final,
   art-hero). Don't rename/remove types the decks rely on.
6. **Precision content stays exact:** cascade numbers, BPE-merge steps, cosine computations,
   archflow/sequence diagrams, worked arithmetic — never stylized into vagueness.
7. Contact details, links, QR, the real instructor bio — unchanged.

## Approach (incremental, reversible)
- Prefer a single themeable layer (extend `wbw-art.css`, add CSS custom-property overrides) so the
  redesign can be toggled/rolled back. Back up `css/` before each session (the harness does this).
- Redesign **chrome and rhythm** (headers, kickers, dividers, spacing, accents, dividers/hero
  beats) before touching dense data slides.
- After each change: headless render in **both themes**, screenshot, and confirm hall-legibility
  (no element smaller than ~22px effective; no clipped art).

## Definition of done (judged by the VLM rubric each session)
"Feels unmistakably WBW-friendly AND reads cleanly at hall scale; every slide uses the right
template; nothing overflows; math/code/diagrams intact; light+dark both clean."
