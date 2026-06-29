/* positional-enc/logic.js — L6 'climb-positional' beat: the sinusoidal positional-encoding grid.
   Attention is order-blind, so we ADD a fixed position signal to each token. Each row is one
   position (0..7); each column is one embedding dimension (0..7). Even columns are sin, odd are
   cos, and the wavelength grows with the dimension index — low dims wiggle fast, high dims drift
   slow. The signal is closed-form (fixed, not learned).

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY cell value comes from data/l6-positional.json (the
   8×8 `grid`, the same source the facts-gate checks); all human text comes from i18n `labels`.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountPositionalEnc registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → the grid frame + the formula; the heatmap is faded in as the canvas.        caption s0
     1  → reveal the positions: step 0 seeds row 0 alone, step 1 un-fades ALL rows at once
            (a one-shot reveal, not a per-row sweep) so the full position×dim code is present. caption s1
     2  → read it dimension by dimension (column by column): low dims fast, high slow. caption s2
     3  → the takeaway band: fixed, not learned; values in [-1, 1].                    caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountPositionalEnc = defineWidget({
  id: 'positional-enc',
  rootClass: 'pe-root',
  exportName: 'mountPositionalEnc',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const grid = data.grid || [];
    const nPos = data.nPos != null ? data.nPos : grid.length;
    const d = data.d != null ? data.d : (grid[0] ? grid[0].length : 0);
    const formula = data.formula || 'PE(pos,2i)=sin(pos/10000^{2i/d}); PE(pos,2i+1)=cos(...)';

    // ── geometry ───────────────────────────────────────────────────────────
    const W = 480;
    const PAD_L = 56;                  // room for the "pos" row labels on the left
    const PAD_T = 58;                  // room for the formula + the "dim" column header
    const PAD_R = 18;                  // right margin so the rightmost cells stay in-frame
    const CELL = (W - PAD_L - PAD_R) / d; // square cells filling the width
    const gridTop = PAD_T;
    const gridLeft = PAD_L;
    const gridBottom = gridTop + nPos * CELL;

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg pe-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // diverging colour for a value in [-1, 1]: blue for +, warm for −, pale near 0.
    function colorFor(v) {
      const t = Math.max(-1, Math.min(1, v));
      if (t >= 0) return `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(t * 90 + 6)}%, var(--bg-card, #fff))`;
      return `color-mix(in srgb, var(--warm, #E8743B) ${Math.round(-t * 90 + 6)}%, var(--bg-card, #fff))`;
    }

    // ── formula banner (step 0 canvas) ───────────────────────────────────────
    layer('canvas', 0);
    // formula centred across the full width, small mono, so it never overruns the right edge.
    const ftxt = add('canvas', el('text', { x: W / 2, y: 18, class: 'pe-formula',
      'text-anchor': 'middle' }, svg));
    ftxt.textContent = labels.formulaLabel || formula;
    // axis captions
    const dimCap = add('canvas', el('text', { x: gridLeft + (d * CELL) / 2, y: 40,
      class: 'pe-axcap', 'text-anchor': 'middle' }, svg));
    dimCap.textContent = labels.dimAxis || 'dimension i  (even = sin · odd = cos) →';
    // y-axis caption: a short upright "pos ↓" label sitting above the row-index gutter (top-left,
    // inside the frame). The row indices 0..nPos-1 below it carry the position scale. (An upright
    // label avoids a rotated bbox spilling past the left frame edge.)
    const posCap = add('canvas', el('text', { x: gridLeft - 6, y: gridTop - 18,
      class: 'pe-axcap', 'text-anchor': 'end' }, svg));
    posCap.textContent = labels.posAxis || 'pos ↓';
    // dimension index header (0..d-1)
    for (let c = 0; c < d; c++) {
      const t = add('canvas', el('text', { x: gridLeft + c * CELL + CELL / 2, y: gridTop - 6,
        class: 'pe-collbl', 'text-anchor': 'middle' }, svg));
      t.textContent = String(c);
    }

    // ── the cells, one reveal-layer per ROW (positions) + per COLUMN (dims) ──
    // Each cell node is added to BOTH its row layer and a column-emphasis set; we manage row
    // reveal in step 1 and a column sweep highlight in step 2.
    const rowLayers = [];              // rowLayers[r] = { nodes:[] }
    const cellByRC = [];               // cellByRC[r][c] = rect (for the column sweep)
    for (let r = 0; r < nPos; r++) {
      rowLayers[r] = { nodes: [] };
      cellByRC[r] = [];
      // row label (the position index) on the left
      const rl = el('text', { x: gridLeft - 10, y: gridTop + r * CELL + CELL / 2 + 4,
        class: 'pe-rowlbl', 'text-anchor': 'end' }, svg);
      rl.textContent = String(r);
      rowLayers[r].nodes.push(rl);
      for (let c = 0; c < d; c++) {
        const v = grid[r][c];
        const rect = el('rect', { x: gridLeft + c * CELL, y: gridTop + r * CELL,
          width: CELL, height: CELL, class: 'pe-cell' }, svg);
        rect.setAttribute('fill', colorFor(v));
        const tt = el('title', {}, rect);   // hover tooltip = exact value
        tt.textContent = `pos ${r}, dim ${c} = ${fmt(v, 3)}`;
        rowLayers[r].nodes.push(rect);
        cellByRC[r][c] = rect;
      }
    }

    // grid frame on top
    add('canvas', el('rect', { x: gridLeft, y: gridTop, width: d * CELL, height: nPos * CELL,
      class: 'pe-frame', fill: 'none' }, svg));

    // ── legend (−1 … 0 … +1) under the grid ──────────────────────────────────
    layer('legend', 0);
    const legY = gridBottom + 22;
    const legW = 160, legX = PAD_L;
    const stops = 16;
    for (let i = 0; i < stops; i++) {
      const v = -1 + (2 * i) / (stops - 1);
      add('legend', el('rect', { x: legX + (i * legW) / stops, y: legY, width: legW / stops + 0.6,
        height: 10, class: 'pe-legcell', fill: colorFor(v) }, svg));
    }
    add('legend', el('text', { x: legX, y: legY + 24, class: 'pe-leglbl' }, svg)).textContent = '−1';
    add('legend', el('text', { x: legX + legW / 2, y: legY + 24, class: 'pe-leglbl',
      'text-anchor': 'middle' }, svg)).textContent = '0';
    add('legend', el('text', { x: legX + legW, y: legY + 24, class: 'pe-leglbl',
      'text-anchor': 'end' }, svg)).textContent = '+1';

    // ── takeaway band (step 3) ───────────────────────────────────────────────
    layer('note', 3);
    const noteY = legY + 38;
    add('note', el('rect', { x: PAD_L, y: noteY, width: W - PAD_L - 16, height: 44, rx: 8,
      class: 'pe-notebox' }, svg));
    const nt = add('note', el('text', { x: PAD_L + 12, y: noteY + 18, class: 'pe-note' }, svg));
    nt.textContent = labels.takeaway || 'low dims wiggle fast (local), high dims drift slow (global).';
    const nt2 = add('note', el('text', { x: PAD_L + 12, y: noteY + 35, class: 'pe-note pe-note-2' }, svg));
    nt2.textContent = labels.takeaway2 || 'fixed by formula — not learned. always in [−1, 1].';

    const H = frameHeightFor(noteY + 44, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // per-step update.
    return function update(k) {
      // canvas + legend always visible (the figure exists from step 0)
      for (const node of layers.canvas.nodes) node.classList.toggle('is-hidden', false);
      for (const node of layers.legend.nodes) node.classList.toggle('is-hidden', false);
      // step 1: reveal positions (rows) one by one as a cumulative wipe; at step 0 only row 0
      // shows so the grid reads as "growing" with position. At step >=1 all rows are present.
      rowLayers.forEach((rl, r) => {
        const on = k >= 1 ? true : r === 0;
        for (const node of rl.nodes) node.classList.toggle('is-faded', !on);
      });
      // step 2: column sweep — emphasise the dimension structure (fast → slow). We outline each
      // column with a class; the CSS makes even/odd (sin/cos) read distinctly at step >=2.
      const showCols = k >= 2;
      for (let r = 0; r < nPos; r++)
        for (let c = 0; c < d; c++)
          cellByRC[r][c].classList.toggle('pe-col-on', showCols);
      // step 3: the note band
      for (const node of layers.note.nodes) node.classList.toggle('is-hidden', k < 3);
    };
  },
});
