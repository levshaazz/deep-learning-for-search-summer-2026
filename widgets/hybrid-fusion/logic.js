/* hybrid-fusion/logic.js — L8 'climb-hybrid' beat: fuse a SPARSE ranking (BM25 / SPLADE) and a DENSE
   ranking (SBERT) with Reciprocal Rank Fusion. Three SVG columns: LEFT = sparse, MIDDLE = dense, RIGHT =
   fused (revealed last). Reads the L8 data shape (data/l8-hybrid.json): data.sparse.order /
   data.dense.order / data.fused[] with {id, rSparse, rDense, score}. All text via i18n `labels`; theme via
   CSS var(--token, fallback). Driver-agnostic (setStep/maxStep). maxStep = 3.

   SVG (not DOM divs) so the slide-viz step-progression / colour / overprint detectors can see every mark.

   The lesson: the consensus doc D2 (ranked well by BOTH armies) wins, while the sparse favourite D1 —
   ranked #1 by sparse but LAST by dense — falls to 3rd. RRF rewards agreement over a lopsided single vote.

   Steps (maxStep = 3):
     0  → the two input columns (sparse, dense), each a ranked stack of doc chips.   caption s0
     1  → the consensus doc's reciprocal-rank votes light up in both columns.        caption s1
     2  → the fused column builds, each doc's summed RRF score beside it.            caption s2
     3  → the consensus doc is crowned at the top; the sparse favourite is marked.   caption s3 */
import { defineWidget, esc } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountHybridFusion = defineWidget({
  id: 'hybrid-fusion',
  rootClass: 'hf-root',
  exportName: 'mountHybridFusion',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const k = data.k;
    const sparse = data.sparse?.order || [];
    const dense = data.dense?.order || [];
    const fused = data.fused || [];                  // already sorted by score desc
    const order = fused.map((d) => d.id);
    const byId = Object.fromEntries(fused.map((d) => [d.id, d]));
    const top = fused[0] || null;                    // the consensus winner (D2)
    const recip = (rank) => 1 / (k + rank);
    const fmt6 = (n) => (typeof n === 'number' ? n.toFixed(6) : '');

    const W = 640, PAD = 16, COLGAP = 18;
    const colW = (W - 2 * PAD - 2 * COLGAP) / 3;
    const colX = [PAD, PAD + colW + COLGAP, PAD + 2 * (colW + COLGAP)];
    const headY = 30, headH = 38, chipY0 = 84, chipH = 54, chipStep = 62;

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg hf-svg', role: 'img', 'aria-label': labels.alt || '' }, host);
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    layer('inputs', 0); layer('votes', 1); layer('fused', 2); layer('crown', 3);

    const chipY = (i) => chipY0 + i * chipStep;

    // build a ranked column of doc chips; returns the chip rects keyed by doc id.
    function column(lname, x, role, headKey, ids, withScore) {
      add(lname, el('rect', { x, y: headY, width: colW, height: headH, rx: 8, class: 'hf-head hf-head-' + role }, svg));
      add(lname, el('text', { x: x + colW / 2, y: headY + 25, class: 'hf-headtxt', 'text-anchor': 'middle' }, svg))
        .textContent = labels[headKey] || role;
      const chips = {};
      ids.forEach((id, i) => {
        const cy = chipY(i);
        const rect = add(lname, el('rect', { x, y: cy, width: colW, height: chipH, rx: 7, class: 'hf-chip hf-chip-' + role }, svg));
        add(lname, el('text', { x: x + 14, y: cy + 22, class: 'hf-docid' }, svg)).textContent = esc(id);
        if (withScore) {
          // fused column: position IS the rank, so the right slot shows the summed RRF score instead.
          add('fused', el('text', { x: x + colW - 14, y: cy + 22, class: 'hf-score', 'text-anchor': 'end' }, svg))
            .textContent = fmt6(byId[id] ? recip(byId[id].rSparse) + recip(byId[id].rDense) : 0);
        } else {
          add(lname, el('text', { x: x + colW - 14, y: cy + 22, class: 'hf-rank', 'text-anchor': 'end' }, svg))
            .textContent = '#' + (i + 1);
        }
        chips[id] = { rect, i };
      });
      return chips;
    }

    const sChips = column('inputs', colX[0], 'sparse', 'headSparse', sparse, false);
    const dChips = column('inputs', colX[1], 'dense', 'headDense', dense, false);
    const fChips = column('fused', colX[2], 'fused', 'headFused', order, true);

    // step 1: the consensus winner's reciprocal-rank votes appear in both input columns (and light up).
    if (top) {
      const s = sChips[top.id], d = dChips[top.id];
      if (s) add('votes', el('text', { x: colX[0] + colW / 2, y: chipY(s.i) + 44, class: 'hf-vote', 'text-anchor': 'middle' }, svg))
        .textContent = `1/(${k}+${top.rSparse})`;
      if (d) add('votes', el('text', { x: colX[1] + colW / 2, y: chipY(d.i) + 44, class: 'hf-vote', 'text-anchor': 'middle' }, svg))
        .textContent = `1/(${k}+${top.rDense})`;
    }

    // step 3: a "falls" marker beside the sparse favourite (D1) in the fused column.
    const sparseTop = sparse[0];                     // D1 — sparse #1
    if (sparseTop && fChips[sparseTop]) {
      add('crown', el('text', { x: colX[2] + 14, y: chipY(fChips[sparseTop].i) + 44, class: 'hf-falls' }, svg))
        .textContent = labels.fallsLabel || 'sparse #1 ↓';
    }

    const bottomY = chipY(Math.max(sparse.length, order.length) - 1) + chipH;
    const H = frameHeightFor(bottomY, 14);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(step) {
      for (const name in layers) {
        const on = step >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      // step 1: light the consensus winner's chips in both input columns (is-lit → slide-viz HILITE).
      const litWinIn = step >= 1 && top;
      [sChips, dChips].forEach((cc) => Object.entries(cc).forEach(([id, c]) =>
        c.rect.classList.toggle('is-lit', !!litWinIn && id === top.id)));
      // step 3: crown the consensus winner at the top of the fused column; mark the fallen sparse #1.
      Object.entries(fChips).forEach(([id, c]) => {
        c.rect.classList.toggle('is-lit', step >= 3 && top && id === top.id);
        c.rect.classList.toggle('is-fallen', step >= 3 && id === sparseTop);
      });
    };
  },
});
