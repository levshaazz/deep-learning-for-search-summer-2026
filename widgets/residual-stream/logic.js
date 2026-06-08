/* residual-stream/logic.js — L6 'depth-block-modern' / Add&Norm beat: the residual HIGHWAY. A running
   6-d representation x rides a left→right lane; each sublayer ADDS its output (x → x+attn → Norm →
   x+ffn → Norm), the vector accumulating and never being replaced. The skip arrow that bypasses each
   block is drawn explicitly, and the previous vector is kept faintly visible at every add-step to make
   "added, not replaced" literal.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY number — each stage's 6-d vec, the added deltas, and the
   L2 norm per stage (the two LayerNorm stages both = 2.4495 = √6) — comes straight from
   data/l6-residual.json (the same source the facts-gate checks), never from these strings.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold, setStep
   clamp, window.mountResidualStream registration); render() only draws the figure layers. No raw
   colors — all fills/strokes reference design tokens via var(--…); the .wgt-fade .is-hidden rule in
   widgets/_base.css drives the per-step reveal, so no per-widget style.css is needed.

   Steps (maxStep = 4) — one per stage:
     0  → x enters the highway lane; stages[0].vec + its norm.                      caption s0
     1  → + attn(x): a side branch adds stages[1].delta; vec → stages[1].vec; the
          old x stays faint underneath (added, not replaced).                       caption s1
     2  → LayerNorm: vec → stages[2].vec; norm settles to 2.4495.                   caption s2
     3  → + ffn(x): second side branch adds stages[3].delta → stages[3].vec.        caption s3
     4  → LayerNorm: vec → stages[4].vec; norm = 2.4495 again.                       caption s4 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor, clampSegmentToRect } from '../_plot-util.js';

export const mountResidualStream = defineWidget({
  id: 'residual-stream',
  rootClass: 'rs-root',
  exportName: 'mountResidualStream',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const stages = data.stages || [];
    const dim = data.dim != null ? data.dim : (stages[0] && stages[0].vec.length) || 6;
    const n = stages.length;                 // 5 checkpoints

    const num = (v, d = 2) => (typeof v !== 'number' ? '' : Number.isInteger(v) ? String(v) : fmt(v, d));

    // ── geometry ───────────────────────────────────────────────────────────
    // The per-checkpoint norm readout ("‖x‖ = 2.4495", ~94px) is CENTRED on the checkpoint x.
    // To keep the first/last readouts inside the frame the checkpoints must sit at least half a
    // readout-width in from each edge. SIDE reserves that gutter on both sides; the branch zone
    // (delta glyph + "sublayer(x)" label) needs vertical headroom above the lane → TOPROOM.
    const SIDE = 50;                          // side gutter ≥ half the widest centred readout
    const PAD = 16;
    const TOPROOM = 58;                       // room above the lane for the branch + its label
    const laneY = TOPROOM + 36;               // the highway's centre-line, pushed down for the branch
    const x0 = PAD + SIDE;                     // first checkpoint x (in from the left gutter)
    const W = 540;                            // viewBox width (wider so 5 checkpoints + gutters fit)
    const xEnd = W - PAD - SIDE;              // last checkpoint x (in from the right gutter)
    const slot = (xEnd - x0) / (n - 1);       // horizontal gap between checkpoints
    // a 6-cell vector glyph (a short vertical stack of small cells) centred at (cx, laneY).
    const cellW = 16, cellH = 11, cellGap = 1.5;
    const glyphH = dim * (cellH + cellGap) - cellGap;
    // value → cell colour: accent (positive) / warm (negative), opacity ∝ |value| within the column.
    const cellFill = (v, maxAbs) => {
      const o = Math.max(0.18, Math.min(1, Math.abs(v) / (maxAbs || 1)));
      const base = v < 0 ? 'var(--warm, #E8743B)' : 'var(--accent, #2A6FDB)';
      return `color-mix(in srgb, ${base} ${Math.round(o * 100)}%, var(--bg-card, #fff))`;
    };

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg rs-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const txt = (xx, yy, s, attrs = {}) => {
      const t = el('text', { x: xx, y: yy, ...attrs }, svg);
      t.textContent = s; return t;
    };

    // arrowhead defs
    const defs = el('defs', {}, svg);
    const mk = (id, fill) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '6.5', markerHeight: '6.5', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill }, m);
    };
    mk('rs-flow', 'var(--ink-3, #6B7280)');
    mk('rs-add', 'var(--c-green, #3A8A5C)');

    // ── the highway lane (always visible) ─────────────────────────────────────
    // The "residual highway" caption rides the top-RIGHT of the frame (the branch zone is on the
    // left, above the add-stage checkpoints, so the right side is the only clear top lane),
    // end-anchored inside the right gutter so it never spills or collides with the branch labels.
    layer('lane', 0);
    add('lane', txt(xEnd + SIDE - 2, 14, labels.highwayLbl || 'residual highway',
      { font: '700 11px var(--font-mono, monospace)', fill: 'var(--accent-ink, #1B4FA0)',
        'text-anchor': 'end' }));
    add('lane', el('line', { x1: PAD, y1: laneY, x2: xEnd + 4, y2: laneY, fill: 'none',
      stroke: 'var(--accent, #2A6FDB)', 'stroke-width': 3, opacity: 0.35,
      'marker-end': 'url(#rs-flow)' }, svg));

    // draw one vector glyph (6 cells) for `vec`, centred at column `cx`. Returns its node group.
    function glyph(parentLayer, vec, cx, opts = {}) {
      const faint = opts.faint;
      const maxAbs = Math.max(...vec.map(Math.abs), 1);
      const gx = cx - cellW / 2, gy0 = laneY - glyphH / 2;
      const g = el('g', opts.faint ? { opacity: 0.28 } : {}, svg);
      vec.forEach((v, i) => {
        const cy = gy0 + i * (cellH + cellGap);
        el('rect', { x: gx, y: cy, width: cellW, height: cellH, rx: 1.5,
          fill: faint ? 'var(--ink-4, #9CA3AF)' : cellFill(v, maxAbs),
          stroke: 'var(--rule, #ddd)', 'stroke-width': 0.5 }, g);
        if (!faint) {
          const t = el('text', { x: cx, y: cy + cellH - 2.5, 'text-anchor': 'middle',
            font: '600 6.5px var(--font-mono, monospace)',
            fill: Math.abs(v) / maxAbs > 0.62 ? '#fff' : 'var(--ink, #14181F)' }, g);
          t.textContent = num(v, 1);
        }
      });
      add(parentLayer, g);
      return g;
    }

    // For each stage build: its checkpoint marker + label, the running-vector glyph, the norm
    // readout, and (for add-stages) a curved side branch carrying the delta + a "+" node + the faint
    // previous-vector ghost. Each stage's content appears at step == its index (the lane persists).
    stages.forEach((st, k) => {
      const cx = x0 + k * slot;
      layer('stage' + k, k);
      // checkpoint stage label below the lane
      add('stage' + k, txt(cx, laneY + glyphH / 2 + 16, st.label || '',
        { font: '700 9.5px var(--font-mono, monospace)', fill: 'var(--ink-2, #3D434E)',
          'text-anchor': 'middle' }));
      // the running vector glyph at this checkpoint
      glyph('stage' + k, st.vec, cx);
      // the L2-norm readout above the lane
      add('stage' + k, txt(cx, laneY - glyphH / 2 - 4,
        (labels.normLbl || '‖x‖') + ' = ' + num(st.norm, 4),
        { font: '700 9px var(--font-mono, monospace)',
          fill: (st.label && /LayerNorm/i.test(st.label)) ? 'var(--c-green-ink, #1F6B40)' : 'var(--warm-ink, #B4521F)',
          'text-anchor': 'middle' }));

      // ── add-stage extras: side branch + "+" + faint previous-x ghost ─────────
      if (st.delta) {
        // faint ghost of the PREVIOUS stage's vector, just behind this checkpoint, to show that the
        // old x is still present (added, not replaced).
        const prev = stages[k - 1];
        if (prev) glyph('stage' + k, prev.vec, cx - 4, { faint: true });

        // the merge "+" sits on the lane JUST LEFT of the running vector (not on top of a cell —
        // that produced the s1 "+ × 1.7" stacked-label overlap). The branch and the skip arc both
        // converge here, before the running vector.
        const mergeX = cx - cellW / 2 - 11;

        // the delta glyph + its "sublayer(x)" label live in the TOP band, fitted to TOPROOM so they
        // never exit the top edge. Sizes are derived from the available headroom above the glyph.
        const glyphTop = laneY - glyphH / 2;          // pixel y of the running glyph's top
        const dcw = 8, dch = 4, dgap = 0.8;
        const dgH = dim * (dch + dgap) - dgap;        // delta-glyph height
        const dgLabelY = 16;                          // baseline of the "sublayer(x)" label; ≥ font
                                                      // ascent so its box top stays inside the frame
        const dgy0 = dgLabelY + 5;                    // delta glyph top, just under its label
        const bx = mergeX - slot * 0.42;              // branch entry x (above-left of the merge)
        const dgx = bx - dcw / 2;

        // a curved side branch from the delta glyph down to the merge "+" on the lane.
        const path = `M ${bx} ${dgy0 + dgH + 2} C ${bx} ${glyphTop - 10}, ${mergeX} ${glyphTop - 8}, ${mergeX} ${laneY - 8}`;
        const branch = el('path', { d: path, fill: 'none', stroke: 'var(--c-green, #3A8A5C)',
          'stroke-width': 1.5, 'stroke-dasharray': '4 3', 'marker-end': 'url(#rs-add)' }, svg);
        add('stage' + k, branch);
        // the delta vector as a tiny 6-cell glyph at the branch's top
        const dMaxAbs = Math.max(...st.delta.map(Math.abs), 1);
        const dGlyph = el('g', {}, svg);
        st.delta.forEach((v, i) => {
          el('rect', { x: dgx, y: dgy0 + i * (dch + dgap), width: dcw, height: dch, rx: 1,
            fill: cellFill(v, dMaxAbs), stroke: 'var(--rule, #ddd)', 'stroke-width': 0.4 }, dGlyph);
        });
        add('stage' + k, dGlyph);
        add('stage' + k, txt(bx, dgLabelY, labels.deltaLbl || 'sublayer(x)',
          { font: '700 8px var(--font-mono, monospace)', fill: 'var(--c-green-ink, #1F6B40)',
            'text-anchor': 'middle' }));
        // a "+" node on the lane at the merge point (left of the running vector)
        add('stage' + k, el('circle', { cx: mergeX, cy: laneY, r: 7, fill: 'var(--bg-card, #fff)',
          stroke: 'var(--c-green, #3A8A5C)', 'stroke-width': 1.5 }, svg));
        add('stage' + k, txt(mergeX, laneY + 3.5, labels.addLbl || '+',
          { font: '700 11px var(--font-mono, monospace)', fill: 'var(--c-green-ink, #1F6B40)',
            'text-anchor': 'middle' }));

        // the skip arc: x bypasses the sublayer (a faint arc from the previous checkpoint straight to
        // the merge "+"), drawn with clampSegmentToRect-safe straight skip line under the lane.
        const skipFrom = x0 + (k - 1) * slot + cellW / 2 + 2;
        const skipY = laneY + glyphH / 2 + 26;
        const skipRect = { x: PAD, y: laneY, w: W - 2 * PAD, h: glyphH / 2 + 40 };
        const seg = clampSegmentToRect(skipFrom, skipY, mergeX, skipY, skipRect)
          || { x1: skipFrom, y1: skipY, x2: mergeX, y2: skipY };
        const skip = el('path',
          { d: `M ${seg.x1} ${laneY} C ${seg.x1} ${seg.y1}, ${seg.x2} ${seg.y1}, ${seg.x2} ${laneY}`,
            fill: 'none', stroke: 'var(--accent, #2A6FDB)', 'stroke-width': 1.5,
            opacity: 0.5, 'stroke-dasharray': '2 3' }, svg);
        add('stage' + k, skip);
        add('stage' + k, txt((skipFrom + mergeX) / 2, skipY + 12, labels.skipLbl || 'skip: x passes through',
          { font: '600 8px var(--font-mono, monospace)', fill: 'var(--accent-ink, #1B4FA0)',
            'text-anchor': 'middle' }));
      }
    });

    // size the box to the deepest drawn content (skip-label sits lowest)
    const deepest = laneY + glyphH / 2 + 26 + 14;
    const H = frameHeightFor(deepest, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
