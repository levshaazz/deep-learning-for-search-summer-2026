/* in-batch-negatives/logic.js — L7 'how the Scouts are trained' beat: the InfoNCE / contrastive objective.
   A batch of B matched (query, document) pairs. Score EVERY query against EVERY document in the batch:
   the diagonal (q_i, d_i) is the positive; the other B−1 documents in the same batch are negatives — for
   FREE, no extra forward pass. A per-row softmax over the similarities (at temperature τ) is the InfoNCE
   target: it should put all its mass on the diagonal. Bigger batch ⇒ more in-batch negatives ⇒ harder,
   better training (DPR/E5/RocketQA). This is exactly why batch size matters for retrievers.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll — deck arrow keys and Book Scrollama both
   call setStep(k). EVERY number (the B×B similarity grid, the row softmax, τ) comes from data/l7-train.json;
   figure labels come from i18n `labels`. Built on widgets/_widget-base.js (host/caption/counter scaffold).

   Steps (maxStep = 3):
     0  → the batch: B matched (query, doc) pairs — the diagonal positives.            caption s0
     1  → score the full B×B grid: every query × every doc; off-diagonal = free negatives. caption s1
     2  → mark the diagonal (positives) vs the off-diagonal (in-batch negatives).       caption s2
     3  → row softmax(sims/τ) = the InfoNCE target: push each row's mass onto the diagonal. caption s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountInBatchNegatives = defineWidget({
  id: 'in-batch-negatives',
  rootClass: 'ibn-root',
  exportName: 'mountInBatchNegatives',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const Q = toy.queries || [];
    const D = toy.docs || [];
    const sims = toy.sims || [];
    const soft = toy.softmax || [];
    const B = Q.length;
    const tau = typeof toy.tau === 'number' ? toy.tau : 0.2;
    const f2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));

    const W = 600, PAD = 18;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg ibn-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // similarity → blue fill (opacity ∝ sim). Diagonal gets a warm fill instead (the positive).
    const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.05, x) * 86)}%, var(--bg-card, #fff))`;
    const heatPos = (x) => `color-mix(in srgb, var(--warm, #E8743B) ${Math.round(Math.max(0.25, x) * 92)}%, var(--bg-card, #fff))`;

    // ── geometry ──
    // ROWLBL is the reserved gutter for the right-aligned "qi  <phrase>" row labels. At 12px mono
    // (~7.0px/glyph) a 138px gutter (minus the 12px pad to the grid) holds ~18 chars; clampLbl()
    // ellipsizes anything longer so a long/data-driven query phrase or a wider locale can never
    // clip past the SVG's left edge (overlap-fix: was 120 with zero margin on "q1  stock market").
    const ROWLBL = 138, CELL = 54, CGAP = 6, STEP = CELL + CGAP;
    const LBL_MAXCH = 18;
    const clampLbl = (s) => (s.length > LBL_MAXCH ? s.slice(0, LBL_MAXCH - 1) + '…' : s);
    const gx = PAD + ROWLBL, gyTop = 30, gy = gyTop + 30;     // grid origin (first cell top-left)
    const gridW = B * CELL + (B - 1) * CGAP;
    const gridH = B * CELL + (B - 1) * CGAP;
    const panelX = gx + gridW + 24;
    const panelW = W - PAD - panelX;
    const colCx = (j) => gx + j * STEP + CELL / 2;
    const rowCy = (i) => gy + i * STEP + CELL / 2;

    // ── STEP 0 (static chrome): title, axis labels, the diagonal positive cells ──
    layer('head', 0);
    add('head', el('text', { x: PAD, y: 18, class: 'ibn-head' }, svg))
      .textContent = labels.gridHead || 'one batch: query × document similarities';
    // column headers d0..d3
    D.forEach((_, j) => add('head', el('text', { x: colCx(j), y: gy - 9, class: 'ibn-collbl', 'text-anchor': 'middle' }, svg))
      .textContent = 'd' + j);
    // row labels: the query phrase, right-aligned to the grid
    Q.forEach((q, i) => add('head', el('text', { x: gx - 12, y: rowCy(i) + 4, class: 'ibn-rowlbl', 'text-anchor': 'end' }, svg))
      .textContent = clampLbl('q' + i + '  ' + q));

    layer('diag', 0);                                          // the positives (known before any scoring)
    for (let i = 0; i < B; i++) {
      const x = gx + i * STEP, y = gy + i * STEP;
      const r = el('rect', { x, y, width: CELL, height: CELL, rx: 5, class: 'ibn-cell ibn-pos' }, svg);
      r.setAttribute('fill', heatPos((sims[i] && sims[i][i]) || 0.8));
      add('diag', r);
    }

    // ── STEP 1: the full B×B grid (off-diagonal cells = in-batch negatives) + every similarity number ──
    layer('off', 1);
    for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) {
      if (i === j) continue;
      const x = gx + j * STEP, y = gy + i * STEP;
      const r = el('rect', { x, y, width: CELL, height: CELL, rx: 5, class: 'ibn-cell ibn-neg' }, svg);
      r.setAttribute('fill', heat((sims[i] && sims[i][j]) || 0));
      add('off', r);
    }
    layer('vals', 1);
    for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) {
      const v = (sims[i] && sims[i][j]);
      if (typeof v !== 'number') continue;
      const t = el('text', { x: colCx(j), y: rowCy(i) + 5, class: 'ibn-cellval', 'text-anchor': 'middle' }, svg);
      t.textContent = f2(v);
      t.setAttribute('fill', (i === j || v >= 0.5) ? '#fff' : 'var(--ink, #14181F)');
      add('vals', t);
    }

    // ── STEP 2: mark positives vs negatives (diagonal ring + side legend) ──
    layer('mark', 2);
    for (let i = 0; i < B; i++) {
      add('mark', el('rect', { x: gx + i * STEP - 2, y: gy + i * STEP - 2, width: CELL + 4, height: CELL + 4,
        rx: 7, class: 'ibn-ring', fill: 'none' }, svg));
    }
    const legY = gy + gridH + 22;
    add('mark', el('rect', { x: PAD, y: legY - 11, width: 14, height: 14, rx: 3, class: 'ibn-cell ibn-pos' }, svg))
      .setAttribute('fill', 'var(--warm, #E8743B)');
    add('mark', el('text', { x: PAD + 20, y: legY, class: 'ibn-legtxt' }, svg))
      .textContent = labels.posLabel || 'diagonal = the positive (q_i, d_i)';
    add('mark', el('rect', { x: PAD + 270, y: legY - 11, width: 14, height: 14, rx: 3, class: 'ibn-cell ibn-neg' }, svg))
      .setAttribute('fill', 'var(--accent-soft, #DCE8F8)');
    add('mark', el('text', { x: PAD + 294, y: legY, class: 'ibn-legtxt' }, svg))
      .textContent = labels.negLabel || 'off-diagonal = in-batch negatives (free)';

    // ── STEP 3: per-row softmax(sims/τ) = the InfoNCE target → the loss ──
    layer('nce', 3);
    add('nce', el('text', { x: panelX, y: gy - 9, class: 'ibn-panelhead' }, svg))
      .textContent = labels.softHead || 'softmax(sim / τ)';
    const barMax = panelW - 52;
    for (let i = 0; i < B; i++) {
      const p = (soft[i] && soft[i][i]) || 0;                 // P assigned to the positive
      const y = gy + i * STEP + CELL / 2;
      add('nce', el('rect', { x: panelX, y: y - 11, width: barMax, height: 22, rx: 5, class: 'ibn-barbg' }, svg));
      add('nce', el('rect', { x: panelX, y: y - 11, width: Math.max(2, barMax * p), height: 22, rx: 5, class: 'ibn-bar' }, svg));
      add('nce', el('text', { x: panelX + barMax + 6, y: y + 5, class: 'ibn-barval', 'text-anchor': 'start' }, svg))
        .textContent = f2(p);
    }
    add('nce', el('text', { x: panelX, y: gy + gridH + 6, class: 'ibn-loss' }, svg))
      .textContent = (labels.lossLine || 'L = −Σ log P⁺') + '   (τ = ' + tau + ')';

    const H = frameHeightFor(gy + gridH + 34, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      svg.classList.toggle('ibn-marked', k >= 2);              // dim negatives once positives are marked
    };
  },
});
