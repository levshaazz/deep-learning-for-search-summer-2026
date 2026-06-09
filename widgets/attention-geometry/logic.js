/* attention-geometry/logic.js — L6 'climb-attention' GEOMETRY companion: attention shown as a
   weighted PULL in space, not "just numbers QKV". The three tokens' Value vectors are plotted as
   points in a 2-D plane (the 2 highest-variance V-axes); the query token "cat" draws a weighted
   edge to every value point (stroke width ∝ its attention weight), then slides from its own point
   to the attention-WEIGHTED AVERAGE of the value points — and that blended point is the same output
   row the worked numeric example (attention-e2e / l6-attention.json) already shows.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep and renders for any step. It binds NO keyboard and NO
   scroll — the SLIDE driver (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k).
   EVERY number — valuePoints, weights[queryIndex], blendedPoint, blended4d, l6OutputRow — comes
   straight from data/l6-attention-geo.json (which traces back to data/l6-attention.json), never from
   the i18n strings. The blend ≈ output check uses a TOLERANCE (2e-3): we never assert exact equality
   (both sides are derived from already-3dp-rounded V/weights, diff ≈ 0.001).

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold, setStep
   clamp, window.mountAttentionGeometry registration); render() only draws the figure layers and the
   attention edges/arrow are clamped to the plot rect with clampSegmentToRect.

   Steps (maxStep = 3):
     0  → the 3 value points (the/cat/sat) as labelled dots in the plane.            caption s0
     1  → the query "cat" + its 3 attention weights as edges (width ∝ weight).        caption s1
     2  → the blended point = weighted average; an arrow glides cat → blend.          caption s2
     3  → callout: blended4d ≈ l6 attention output row (within tol 2e-3).             caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { padDomain, frameHeightFor, clampSegmentToRect } from '../_plot-util.js';

export const mountAttentionGeometry = defineWidget({
  id: 'attention-geometry',
  rootClass: 'ag-root',
  exportName: 'mountAttentionGeometry',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const tokens = data.tokens || [];
    const valuePoints = data.valuePoints || [];
    const weights = data.weights || [];
    const qi = data.queryIndex != null ? data.queryIndex : 1;
    const qTok = data.queryToken || tokens[qi] || '';
    const wRow = weights[qi] || [];
    const blended = data.blendedPoint || [0, 0];
    const blended4d = data.blended4d || [];
    const outRow = data.l6OutputRow || [];
    const n = valuePoints.length;

    // 4-number row → "[a, b, c, d]" at the JSON precision (3 dp; integers bare).
    const num = (x) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : fmt(x, 3));
    const rowTxt = (r) => '[' + r.map(num).join(', ') + ']';
    // weight → ".665"/".09" (no rounding past the stored value, leading 0 dropped).
    const wTxt = (w) => (typeof w !== 'number' ? '' : String(+w.toFixed(3)).replace(/^0\./, '.'));

    // ── frame geometry (responsive: SVG scales to 100% width via CSS) ──────────
    const W = 480;
    const PAD_L = 16, PAD_T = 30;
    const plotH = 250;
    const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };

    // data domain over ALL points + the blend, padded so dots/labels never touch the edge.
    const allX = valuePoints.map((p) => p[0]).concat(blended[0]);
    const allY = valuePoints.map((p) => p[1]).concat(blended[1]);
    const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.22);
    const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.22);
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

    // callout panel sits BELOW the plot so it never collides with the dots.
    const calloutTop = PAD_T + plotH + 24;
    const H = frameHeightFor(calloutTop + 52, 14);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg ag-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // layer bookkeeping: a node is shown when step >= its `from`.
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    // declare the always-on plane + the step-0 points layer up front (before any add()).
    layer('plane', 0);
    layer('points', 0);

    // ── plane frame + axis labels (inside the corners → never spill past viewBox) ──
    el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'ag-frame' }, svg);
    const ttl = el('text', { x: box.x, y: box.y - 10, class: 'ag-title' }, svg);
    ttl.textContent = labels.planeTitle || 'value space (2-D)';
    add('plane', el('text', { x: box.x + 6, y: box.y + 14, class: 'ag-axlbl' }, svg))
      .textContent = labels.axY || 'V ↑';
    add('plane', el('text', { x: box.x + box.w - 6, y: box.y + box.h - 8, class: 'ag-axlbl',
      'text-anchor': 'end' }, svg)).textContent = labels.axX || 'V →';

    // STEP 0: the three value points (the/cat/sat). The query dot is styled distinctly.
    const dotXY = valuePoints.map((p) => ({ x: sx(p[0]), y: sy(p[1]) }));
    valuePoints.forEach((p, i) => {
      const isQ = i === qi;
      const g = el('g', {}, svg);
      el('circle', { cx: dotXY[i].x, cy: dotXY[i].y, r: isQ ? 7 : 6,
        class: `ag-dot ${isQ ? 'ag-dot-q' : 'ag-dot-v'}` }, g);
      const lt = el('text', { x: dotXY[i].x, y: dotXY[i].y - 12,
        class: `ag-word ${isQ ? 'ag-word-q' : 'ag-word-v'}`, 'text-anchor': 'middle' }, g);
      lt.textContent = tokens[i] || '';
      add('points', g);
    });

    // STEP 1: the query's attention weights as edges (stroke width ∝ weight), clamped to the rect.
    layer('edges', 1);
    const qPt = dotXY[qi];
    // widest stroke maps to the heaviest weight; a tiny floor keeps near-zero edges visible.
    const maxW = Math.max(...wRow, 1e-6);
    wRow.forEach((w, j) => {
      const seg = clampSegmentToRect(qPt.x, qPt.y, dotXY[j].x, dotXY[j].y, box);
      if (!seg) return;
      const sw = 1 + (w / maxW) * 9;                 // 1..10 px
      const g = el('g', {}, svg);
      el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2,
        class: `ag-edge${j === qi ? ' ag-edge-self' : ''}`, 'stroke-width': sw.toFixed(2),
        'stroke-opacity': (0.25 + 0.6 * (w / maxW)).toFixed(2) }, g);
      // weight label at the edge midpoint (skip the self-loop, whose mid sits on the dot).
      if (j !== qi) {
        const mx = (qPt.x + dotXY[j].x) / 2, my = (qPt.y + dotXY[j].y) / 2;
        el('text', { x: mx, y: my - 4, class: 'ag-wlbl', 'text-anchor': 'middle' }, g)
          .textContent = wTxt(w);
      }
      add('edges', g);
    });
    // self-weight badge next to the query dot (the "leans hardest on itself" beat).
    add('edges', el('text', { x: qPt.x + 12, y: qPt.y + 4, class: 'ag-wlbl ag-wlbl-self' }, svg))
      .textContent = wTxt(wRow[qi]);

    // STEP 2: the blended point + an arrow gliding cat → blend (weighted average).
    layer('blend', 2);
    const bx = sx(blended[0]), by = sy(blended[1]);
    // faint guide lines from the blend to each value point (the "centroid of" framing).
    valuePoints.forEach((p, j) => {
      const seg = clampSegmentToRect(bx, by, dotXY[j].x, dotXY[j].y, box);
      if (seg) add('blend', el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2,
        class: 'ag-guide' }, svg));
    });
    // the moving arrow from the query's own point to the blended point (clamped + arrowhead via marker)
    const aseg = clampSegmentToRect(qPt.x, qPt.y, bx, by, box);
    if (aseg) add('blend', el('line', { x1: aseg.x1, y1: aseg.y1, x2: aseg.x2, y2: aseg.y2,
      class: 'ag-arrow', 'marker-end': 'url(#ag-head)' }, svg));
    // arrowhead marker
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'ag-head', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'ag-arrowhead' }, mk);
    // the blended marker (diamond) + its label
    const bg = el('g', {}, svg);
    el('path', { d: diamond(bx, by, 8), class: 'ag-blend' }, bg);
    el('text', { x: bx, y: by + 22, class: 'ag-blendlbl', 'text-anchor': 'middle' }, bg)
      .textContent = labels.blendTag || 'weighted average';
    add('blend', bg);

    // STEP 3: callout tying the 2-D/4-D blend to the l6 attention output row (tolerance, not '=').
    layer('match', 3);
    const cg = el('g', {}, svg);
    el('rect', { x: PAD_L, y: calloutTop, width: W - 2 * PAD_L, height: 46, rx: 8,
      class: 'ag-callbox' }, cg);
    el('text', { x: PAD_L + 12, y: calloutTop + 18, class: 'ag-callrow' }, cg).textContent =
      'blend·V = ' + rowTxt(blended4d);
    el('text', { x: PAD_L + 12, y: calloutTop + 36, class: 'ag-callrow ag-callrow-2' }, cg)
      .textContent = (labels.matchTag || '= attention output row') + ' ' + rowTxt(outRow);
    add('match', cg);
    // tag the blended diamond as the output once we reach the match step. Placed ABOVE the diamond
    // (its own lane, left-anchored just right of centre) so it clears the cat→blend line AND the
    // "weighted average" label that sits BELOW the diamond — they no longer crowd (m4 fix).
    const matchTag = add('match', el('text', { x: bx + 10, y: by - 13,
      class: 'ag-matchtag', 'text-anchor': 'start' }, svg));
    matchTag.textContent = '≈ output';

    function diamond(cx, cy, r) {
      return `M${cx},${(cy - r).toFixed(2)} L${(cx + r).toFixed(2)},${cy} L${cx},${(cy + r).toFixed(2)} L${(cx - r).toFixed(2)},${cy} Z`;
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
