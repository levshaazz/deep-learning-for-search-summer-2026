/* impostor-denoise/logic.js — L13's climax made interactive: the RocketQA inversion and its cure, told
   on the SECOND axis cos(·,d⁺). Two equally-hard mined negatives, n₄ and n₅, both crowd the query — but
   n₄ is far from the positive (cos(·,d⁺)=0.31, safe to push) while n₅ is a paraphrase of it
   (cos(·,d⁺)=0.80, an unlabelled positive). Pushing n₅ away drags d⁺ down, so undenoised hard negatives
   send recall BELOW in-batch; a cross-encoder denoiser filters n₅ and recall recovers above everything.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. recall numbers come from
   data/l13-negatives.json → recallAt10 (measured); the cos(·,d⁺) positions from spine; labels from i18n.
   Built on widgets/_widget-base.js.

   Steps (maxStep = 3):
     0 → the collateral axis cos(·,d⁺): n₄ safe, n₅ in d⁺'s danger zone; recall = in-batch.   s0
     1 → mine both undenoised → pushing n₅ drags d⁺: recall DROPS below in-batch.              s1
     2 → why: the danger is on cos(·,d⁺), invisible on the hardness axis.                       s2
     3 → denoise: filter n₅, keep n₄ → recall recovers and clears the baseline.                s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountImpostorDenoise = defineWidget({
  id: 'impostor-denoise',
  rootClass: 'imd-root',
  exportName: 'mountImpostorDenoise',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const sp = (data && data.spine) || {};
    const pos = sp.positive || { cosQ: 0.82 };
    const lineup = sp.lineup || [];
    const recall = (data && data.recallAt10) || {};
    const f2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));
    const n4 = lineup.find((n) => n.id === 'n4') || { cosPos: 0.31, cosQ: 0.75 };
    const n5 = lineup.find((n) => n.id === 'n5') || { cosPos: 0.80, cosQ: 0.79 };
    const posPos = 1.0;                                        // d⁺ vs itself = 1 on the cos(·,d⁺) axis

    const W = 600, PAD = 24;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg imd-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };

    // ── the collateral axis: cos(·,d⁺) from 0 (far from positive) → 1 (= the positive) ──
    const axL = PAD + 12, axR = W - PAD - 12, axY = 92;
    const cx = (c) => axL + (axR - axL) * Math.max(0, Math.min(1, c));
    layer('axis', 0);
    add('axis', el('text', { x: PAD, y: 28, class: 'imd-head' }, svg))
      .textContent = labels.axisHead || 'the second axis: cos(·, d⁺) — collateral danger';
    // danger zone near the positive (high cos to d⁺)
    add('axis', el('rect', { x: cx(0.62), y: axY - 30, width: axR - cx(0.62), height: 60, rx: 6, class: 'imd-danger' }, svg));
    add('axis', el('text', { x: (cx(0.62) + axR) / 2, y: axY - 36, class: 'imd-zonelbl', 'text-anchor': 'middle' }, svg))
      .textContent = labels.dangerLabel || "d⁺'s neighbourhood — pushing here drags the positive";
    add('axis', el('line', { x1: axL, y1: axY, x2: axR, y2: axY, class: 'imd-axisline' }, svg));
    add('axis', el('text', { x: axL, y: axY + 24, class: 'imd-tick', 'text-anchor': 'middle' }, svg)).textContent = '0';
    add('axis', el('text', { x: axR, y: axY + 24, class: 'imd-tick', 'text-anchor': 'middle' }, svg)).textContent = '1';
    // markers: d⁺, n₄ (safe), n₅ (impostor)
    const marker = (c, lbl, cls, up) => {
      const x = cx(c), y = axY;
      add('axis', el('circle', { cx: x, cy: y, r: 6, class: 'imd-dot ' + cls }, svg));
      add('axis', el('text', { x, y: up ? y - 12 : y + 18, class: 'imd-mklbl ' + cls, 'text-anchor': 'middle' }, svg))
        .textContent = lbl + ' ' + f2(c);
      return x;
    };
    marker(posPos, 'd⁺', 'imd-pos', true);
    marker(n4.cosPos, 'n₄', 'imd-safe', false);
    const n5x = marker(n5.cosPos, 'n₅', 'imd-false', true);

    // ── the drag mechanic (step 1): push n₅, and d⁺ is dragged toward where n₅ goes ──
    layer('drag', 1);
    add('drag', el('text', { x: n5x, y: axY - 34, class: 'imd-pushlbl', 'text-anchor': 'middle' }, svg))
      .textContent = '⟵ push n₅';
    const dragArrow = add('drag', el('path', { d: `M ${cx(posPos)} ${axY - 6} q -20 -16 -40 -2`, class: 'imd-drag', fill: 'none',
      'marker-end': '' }, svg));
    dragArrow.setAttribute('stroke-dasharray', '4 3');

    // ── the filter (step 3): n₅ struck out of the mined set ──
    layer('filter', 3);
    add('filter', el('line', { x1: n5x - 12, y1: axY - 12, x2: n5x + 12, y2: axY + 12, class: 'imd-strike' }, svg));
    add('filter', el('line', { x1: n5x - 12, y1: axY + 12, x2: n5x + 12, y2: axY - 12, class: 'imd-strike' }, svg));
    add('filter', el('text', { x: n5x, y: axY + 36, class: 'imd-filterlbl', 'text-anchor': 'middle' }, svg))
      .textContent = labels.filteredLabel || 'cross-encoder filters n₅';

    // ── recall@10 readout: three bars revealed across the steps ──
    const rows = [
      { key: 'inbatch', from: 0, cls: 'imd-bar' },
      { key: 'undenoised', from: 1, cls: 'imd-bar-drop' },
      { key: 'denoised', from: 3, cls: 'imd-bar-win' },
    ];
    const chL = PAD + 150, chTop = axY + 64, rowH = 30, barMax = W - PAD - chL - 56;
    const ibase = (recall.inbatch && recall.inbatch.mean) || 0;
    layer('recallhead', 0);
    add('recallhead', el('text', { x: PAD, y: chTop - 14, class: 'imd-head' }, svg))
      .textContent = labels.recallHead || 'recall@10 (measured, 20 seeds)';
    rows.forEach((r, i) => {
      layer('r' + i, r.from);
      const m = (recall[r.key] && recall[r.key].mean) || 0;
      const y = chTop + i * rowH;
      add('r' + i, el('text', { x: PAD, y: y + 4, class: 'imd-rowlbl' }, svg)).textContent = labels['lbl_' + r.key] || r.key;
      add('r' + i, el('rect', { x: chL, y: y - 9, width: barMax, height: 19, rx: 4, class: 'imd-barbg' }, svg));
      add('r' + i, el('rect', { x: chL, y: y - 9, width: Math.max(2, barMax * m), height: 19, rx: 4, class: r.cls }, svg));
      add('r' + i, el('text', { x: chL + barMax * m + 6, y: y + 5, class: 'imd-barval' }, svg)).textContent = f2(m);
    });
    // baseline reference tick down the chart
    layer('ref', 0);
    add('ref', el('line', { x1: chL + barMax * ibase, y1: chTop - 16, x2: chL + barMax * ibase, y2: chTop + rows.length * rowH - 12,
      class: 'imd-refline' }, svg));

    const H = frameHeightFor(chTop + rows.length * rowH + 4, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
