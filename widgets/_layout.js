/* _layout.js — pure, dependency-free AUTO-LAYOUT primitives for stepped SVG figures (widgets + decks).

   WHY: the optimization audit (Dimension C) traced the recurring "label overprints the chart" /
   "hand-placed coordinate drifted when the data changed" defects to ONE root cause — figures carry
   hand-typed coordinates and per-step dx/dy, and the only defense against overlap is manual offset
   arithmetic. Worse, a working 160-iteration label de-collision solver ALREADY existed but was
   copy-pasted three times inline in a single slide (Lectures/05-…html). These primitives factor that
   out so authors declare WHAT (a rect, the data, the anchor points) and the layout is COMPUTED:

     • makeScale(values, rect, {axis,pad})  — data domain → screen coords (extends _plot-util.padDomain).
                                              Kills hand-typed pixel axes; a value's position is derived.
     • stack(rect, items, {gap,dir})        — lay boxes evenly in a row/column inside a rect.
       grid(rect, n, {cols,gap})             — lay n cells in a grid inside a rect.
     • placeLabels(anchors, rect, {...})    — collision-avoided label placement. Given anchor points,
                                              returns label positions that do NOT overprint each other
                                              (iterative vertical declutter, clamped to the rect). An
                                              overlap becomes un-authorable: labels are the OUTPUT of
                                              overlap resolution, not hand-nudged inputs.

   Like _plot-util.js: NO DOM, NO styling, NO palette (colour stays in CSS role-classes), pure numbers
   in → numbers out. That keeps it theme-agnostic AND inlinable into an offline file:// deck (HARD
   CONSTRAINT #1: standalone, zero-network, 1920×1080). Self-contained (no imports) so a build step can
   inline it into a standalone deck without dragging dependencies.

   Every primitive takes a `rect` = { x, y, w, h } in the SVG's own user-space (viewBox) units. */

/* ── makeScale ────────────────────────────────────────────────────────────────
   Map a 1-D data domain onto a screen axis inside `rect`, padding the domain so marks/labels never
   land on the frame edge (same idea as _plot-util.padDomain, kept inline so this module has no deps).
     values  — array of numbers (the data along this axis).
     rect    — { x, y, w, h } plot box in user space.
     opts.axis — 'x' (left→right) or 'y' (bottom→top; SVG y grows downward, so it is inverted). Default 'x'.
     opts.pad  — fraction of the span to add on BOTH ends (default 0.08; the L5 scree solver used 0.16).
   → { to(v), invert(px), ticks(n), domain:{min,max,span} }
       to(v)      data value → pixel along the axis.
       invert(px) pixel → data value (round-trips with to()).
       ticks(n)   n evenly spaced tick VALUES across the un-padded data range (for axis labels). */
export function makeScale(values, rect, opts = {}) {
  const axis = opts.axis === 'y' ? 'y' : 'x';
  const pad = typeof opts.pad === 'number' ? opts.pad : 0.08;
  const arr = (values || []).filter((v) => Number.isFinite(v));
  let dmin = arr.length ? Math.min(...arr) : 0;
  let dmax = arr.length ? Math.max(...arr) : 1;
  let span = dmax - dmin;
  if (!(span > 0)) span = Math.abs(dmin) || 1;
  const p = span * pad;
  const lo = dmin - p, hi = dmax + p, dspan = (hi - lo) || 1;

  const to = (v) => (axis === 'x')
    ? rect.x + ((v - lo) / dspan) * rect.w
    : rect.y + rect.h - ((v - lo) / dspan) * rect.h;
  const invert = (px) => (axis === 'x')
    ? lo + ((px - rect.x) / rect.w) * dspan
    : lo + ((rect.y + rect.h - px) / rect.h) * dspan;
  const ticks = (n = 5) => {
    if (n < 2) return [dmin];
    return Array.from({ length: n }, (_, i) => dmin + (i * (dmax - dmin)) / (n - 1));
  };
  return { to, invert, ticks, domain: { min: lo, max: hi, span: dspan } };
}

/* ── stack ────────────────────────────────────────────────────────────────────
   Lay out boxes in a single row or column inside `rect`, splitting the available length by weight.
     items — a count (n equal boxes) OR an array (length n; each entry a numeric weight, or {size}).
     opts.dir — 'row' (horizontal, default) | 'col' (vertical).
     opts.gap — px between boxes (default 12).
   → array of { x, y, w, h } boxes that exactly tile `rect` along `dir` (cross-axis = full rect). */
export function stack(rect, items, opts = {}) {
  const dir = (opts.dir === 'col' || opts.dir === 'column' || opts.dir === 'vertical') ? 'col' : 'row';
  const gap = typeof opts.gap === 'number' ? opts.gap : 12;
  const n = Array.isArray(items) ? items.length : items;
  if (!n || n < 1) return [];
  const weights = Array.isArray(items)
    ? items.map((it) => (typeof it === 'number' ? it : (it && it.size) || 1))
    : Array(n).fill(1);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const along = (dir === 'row' ? rect.w : rect.h) - gap * (n - 1);
  const out = [];
  let cursor = (dir === 'row') ? rect.x : rect.y;
  for (let i = 0; i < n; i++) {
    const seg = (along * weights[i]) / total;
    out.push(dir === 'row'
      ? { x: cursor, y: rect.y, w: seg, h: rect.h }
      : { x: rect.x, y: cursor, w: rect.w, h: seg });
    cursor += seg + gap;
  }
  return out;
}

/* ── grid ─────────────────────────────────────────────────────────────────────
   Lay out n equal cells in a grid inside `rect` (row-major).
     opts.cols — columns (default ceil(sqrt(n))).
     opts.gap  — px between cells (default 12).
   → array of n { x, y, w, h } cells. */
export function grid(rect, n, opts = {}) {
  if (!n || n < 1) return [];
  const gap = typeof opts.gap === 'number' ? opts.gap : 12;
  const cols = Math.max(1, opts.cols || Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const cw = (rect.w - gap * (cols - 1)) / cols;
  const ch = (rect.h - gap * (rows - 1)) / rows;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    out.push({ x: rect.x + c * (cw + gap), y: rect.y + r * (ch + gap), w: cw, h: ch });
  }
  return out;
}

/* ── placeLabels ────────────────────────────────────────────────────────────────
   Collision-avoided label placement — the generalization of the iterative de-collide solver that was
   copy-pasted 3× in Lectures/05-…html (the `for(it<160){ … }` vertical fan). Given anchor points,
   return label positions whose boxes do not overprint each other, then clamp them inside `rect`.

     anchors — [{ x, y, text, side? }]  point to label + its text (drives the width estimate).
                 side: 'right' | 'left' to force which side; omit to auto-pick (right if the anchor is
                 in the left 60% of the rect, else left — exactly the L5 rule).
     opts.minGap — vertical px below which two horizontally-overlapping labels count as colliding (17).
                   This separation is BOUND to slide-viz's text-overprint threshold by _audit/layout-gate.mjs:
                   labels separated by minGap must bury < OVERPRINT_COVER of each other at the deck's label
                   height, so a placeLabels-laid-out figure can never trip the gate. Lowering minGap below
                   that floor HARD-fails layout-gate — "overlap has one definition."
     opts.iters  — relaxation iterations (160, matching the source).
     opts.charW  — px per character for the width estimate (8, matching the source).
     opts.dx     — horizontal offset of the label from its anchor (11).
     opts.pad    — keep labels this many px inside the rect bottom (4).
     opts.topPad — keep labels this many px below the rect top (12; some figures used 10).
   → [{ x, y, anchorX, anchorY, right, text, w, textAnchor }] where (x,y) is where to draw the label,
     textAnchor is 'start' (right side) or 'end' (left side). Two returned labels never overlap in the
     sense the solver checks, so an overprint cannot be expressed by the author. */
export function placeLabels(anchors, rect, opts = {}) {
  const minGap = typeof opts.minGap === 'number' ? opts.minGap : 17;
  const iters = typeof opts.iters === 'number' ? opts.iters : 160;
  const charW = typeof opts.charW === 'number' ? opts.charW : 8;
  const dx = typeof opts.dx === 'number' ? opts.dx : 11;
  const pad = typeof opts.pad === 'number' ? opts.pad : 4;
  const topPad = typeof opts.topPad === 'number' ? opts.topPad : 12;

  const L = (anchors || []).map((a) => {
    const right = (a.side === 'right') || (a.side == null && a.x <= rect.x + rect.w * 0.6);
    const w = String(a.text == null ? '' : a.text).length * charW;
    return { x: a.x, y: a.y, text: a.text, w, right, lx: a.x + (right ? dx : -dx), ly: a.y + 4 };
  });

  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < L.length; i++) {
      for (let j = i + 1; j < L.length; j++) {
        const a = L[i], b = L[j];
        // left edge of each label box (left-anchored labels extend leftward from lx by their width)
        const aLeft = a.right ? a.lx : a.lx - a.w;
        const bLeft = b.right ? b.lx : b.lx - b.w;
        if (Math.abs(aLeft - bLeft) > Math.max(a.w, b.w)) continue;   // no horizontal overlap → leave them
        const oy = minGap - Math.abs(a.ly - b.ly);
        if (oy > 0) {
          const d = a.ly <= b.ly ? -1 : 1;
          a.ly += d * (oy / 2 + 0.4);
          b.ly -= d * (oy / 2 + 0.4);
        }
      }
    }
  }
  for (const p of L) p.ly = Math.max(rect.y + topPad, Math.min(rect.y + rect.h - pad, p.ly));

  return L.map((p) => ({
    x: p.lx, y: p.ly, anchorX: p.x, anchorY: p.y, right: p.right,
    text: p.text, w: p.w, textAnchor: p.right ? 'start' : 'end',
  }));
}
