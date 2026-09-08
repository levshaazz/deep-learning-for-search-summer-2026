/* colbert-maxsim/logic.js — L8 'climb-colbert' beat: late interaction. ColBERT keeps one embedding PER
   TOKEN. The score is MaxSim: for every QUERY token, take its MAX cosine over the DOCUMENT tokens, then
   SUM those maxes. Each query token "salutes" the one doc token it matches best.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. EVERY number comes straight from
   data/l8-colbert.json (toy.docRel); all human text from i18n `labels`. Built on widgets/_widget-base.js.

   Steps (maxStep = 3):
     0  → the two token rows: query tokens vs document tokens (the stage).           caption s0
     1  → the full token×token similarity matrix (colour = cosine in [0,1]).         caption s1
     2  → each query token's argmax cell lights up — the best doc token it matches.  caption s2
     3  → sum the row-maxes → MaxSim score (toy.docRel.maxSim).                       caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountColbertMaxsim = defineWidget({
  id: 'colbert-maxsim',
  rootClass: 'cm-root',
  exportName: 'mountColbertMaxsim',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const qTokens = toy.qTokens || [];
    const doc = toy.docRel || {};
    const dTokens = doc.dTokens || [];
    const sim = doc.sim || [];
    const rowMax = doc.rowMax || [];
    const maxSim = typeof doc.maxSim === 'number' ? doc.maxSim : 0;
    const num2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));

    const W = 620, PAD = 16;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg cm-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.05, x) * 100)}%, var(--bg-card, #fff))`;

    // ── geometry: a row label gutter, then |d| doc columns, then a rowMax column ──
    const LBL = 84, CELL = 74, CGAP = 9, STEP = CELL + CGAP;
    const gx = PAD + LBL, gy = 56;

    // ── STEP 0: the doc-token column heads + query-token row labels (the stage) ──
    layer('tokens', 0);
    add('tokens', el('text', { x: PAD, y: 22, class: 'cm-head' }, svg))
      .textContent = labels.head || 'every query token vs every document token — cosine in each cell';
    add('tokens', el('text', { x: PAD, y: gy - 10, class: 'cm-axislbl cm-q', 'text-anchor': 'start' }, svg))
      .textContent = labels.qLabel || 'query ↓';
    dTokens.forEach((t, c) => {
      add('tokens', el('text', { x: gx + c * STEP + CELL / 2, y: gy - 10, class: 'cm-collbl',
        'text-anchor': 'middle' }, svg)).textContent = t;
    });

    // ── the cells (created once; coloured + valued from step 1; argmax flagged from step 2) ──
    const cells = [];
    qTokens.forEach((qt, r) => {
      const cy = gy + r * STEP;
      add('tokens', el('text', { x: gx - 12, y: cy + CELL / 2 + 5, class: 'cm-rowlbl', 'text-anchor': 'end' }, svg))
        .textContent = qt;
      const isMaxCol = rowMax.length > r ? (sim[r] || []).indexOf(rowMax[r]) : -1;
      (sim[r] || []).forEach((v, c) => {
        const cx = gx + c * STEP;
        const rect = el('rect', { x: cx, y: cy, width: CELL, height: CELL, rx: 6, class: 'cm-cell' }, svg);
        const valText = el('text', { x: cx + CELL / 2, y: cy + CELL / 2 + 6, class: 'cm-cellval',
          'text-anchor': 'middle' }, svg);
        valText.textContent = num2(v);
        cells.push({ rect, valText, v, r, c, isMax: c === isMaxCol });
      });
    });
    // (cell fill, value visibility and the argmax flag are all driven by update() below.)

    // ── STEP 3: the rowMax column + the MaxSim sum readout ──
    const rmx = gx + dTokens.length * STEP + 6;
    layer('rowmax', 3);
    add('rowmax', el('text', { x: rmx + CELL / 2, y: gy - 10, class: 'cm-collbl cm-maxlbl',
      'text-anchor': 'middle' }, svg)).textContent = labels.maxLabel || 'max';
    qTokens.forEach((_, r) => {
      const cy = gy + r * STEP;
      add('rowmax', el('rect', { x: rmx, y: cy, width: CELL, height: CELL, rx: 6, class: 'cm-maxcell' }, svg));
      add('rowmax', el('text', { x: rmx + CELL / 2, y: cy + CELL / 2 + 6, class: 'cm-maxval',
        'text-anchor': 'middle' }, svg)).textContent = num2(rowMax[r]);
    });
    const sumY = gy + qTokens.length * STEP + 16;
    add('rowmax', el('rect', { x: PAD, y: sumY, width: W - 2 * PAD, height: 48, rx: 9, class: 'cm-sumbox' }, svg));
    add('rowmax', el('text', { x: PAD + 14, y: sumY + 31, class: 'cm-sumline' }, svg))
      .textContent = `${(labels.scoreLabel || 'MaxSim')} = ${rowMax.map(num2).join(' + ')} = ${num2(maxSim)}`;

    const H = frameHeightFor(sumY + 48, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      cells.forEach((c) => {
        c.rect.setAttribute('fill', k >= 1 ? heat(c.v) : 'var(--bg-inset, #EBE7DA)');
        c.valText.classList.toggle('is-hidden', k < 1);
        // 'is-lit' is a slide-viz HILITE class → the argmax reveal at step 2 registers as a real change.
        c.rect.classList.toggle('is-lit', k >= 2 && c.isMax);
        c.valText.classList.toggle('is-lit', k >= 2 && c.isMax);
        if (k >= 1) c.valText.setAttribute('fill', c.v >= 0.55 ? '#fff' : 'var(--ink, #14181F)');
      });
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
