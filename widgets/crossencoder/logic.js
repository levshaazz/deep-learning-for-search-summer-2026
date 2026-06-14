/* crossencoder/logic.js — L7 'climb-crossencoder' beat: the Judge. The query and document are read
   TOGETHER in one joint input [CLS] q [SEP] d [SEP]; attention lets query tokens attend to doc tokens
   (across the [SEP]); the [CLS] vector is read out through a linear head → sigmoid → one relevance
   score. Accurate, but the score is a property of the PAIR — so it cannot be cached.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep, binds NO keyboard and NO scroll. EVERY number comes
   straight from data/l7-crossencoder.json; all human text from i18n `labels`.

   LEGIBILITY (fixes the §1.3 "arrows became a mess" defect): step 1 draws ONE bold link per query token
   to the doc token it attends to most (its arg-max), with the remaining links faint — so the picture is
   readable, and the FULL distribution lives in the step-2 heatmap (numbers inside aligned cells).

   Steps (maxStep = 3):
     0  → the joint input row: [CLS] q… [SEP] d… [SEP].                          caption s0
     1  → each query token's strongest link to a doc token (across the [SEP]).   caption s1
     2  → the q×d attention heatmap (rows q, cols d; rows sum to 1).             caption s2
     3  → [CLS] → w·cls + b = logit → sigmoid → one relevance score.            caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountCrossencoder = defineWidget({
  id: 'crossencoder',
  rootClass: 'ce-root',
  exportName: 'mountCrossencoder',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const qTokens = toy.qTokens || [];
    const dTokens = toy.dTokens || [];
    const attn = toy.attnQxD || [];
    const clsRel = toy.clsRel || [];
    const w = toy.w || [];
    const b = typeof toy.b === 'number' ? toy.b : 0;
    const logitRel = typeof toy.logitRel === 'number' ? toy.logitRel : 0;
    const scoreRel = typeof toy.scoreRel === 'number' ? toy.scoreRel : 0;

    const CLS = labels.clsLabel || '[CLS]';
    const SEP = labels.sepLabel || '[SEP]';
    const num = (x) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : fmt(x, 3));
    const num3 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(3));
    const arr = (a) => '[' + a.map(num).join(', ') + ']';

    const W = 620, PAD = 16;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg ce-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const heat = (x) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.06, x) * 100)}%, var(--bg-card, #fff))`;

    // ── STEP 0: the joint input row [CLS] q… [SEP] d… [SEP] ──
    layer('joint', 0);
    add('joint', el('text', { x: PAD, y: 16, class: 'ce-head' }, svg))
      .textContent = labels.jointHead || 'joint input — query and document read together';
    const seq = [{ t: CLS, role: 'cls' }]
      .concat(qTokens.map((t) => ({ t, role: 'q' })))
      .concat([{ t: SEP, role: 'sep' }])
      .concat(dTokens.map((t) => ({ t, role: 'd' })))
      .concat([{ t: SEP, role: 'sep' }]);
    const nChips = seq.length;
    const gap = 4, rowY = 28, chipH = 28;
    const chipW = (W - 2 * PAD - (nChips - 1) * gap) / nChips;
    const chipCx = [];
    seq.forEach((s, i) => {
      const x = PAD + i * (chipW + gap);
      chipCx.push(x + chipW / 2);
      add('joint', el('rect', { x, y: rowY, width: chipW, height: chipH, rx: 6,
        class: `ce-tok ce-tok-${s.role}` }, svg));
      add('joint', el('text', { x: x + chipW / 2, y: rowY + 19, class: `ce-tok-txt ce-tok-txt-${s.role}`,
        'text-anchor': 'middle' }, svg)).textContent = s.t;
    });
    const qIdx = qTokens.map((_, i) => 1 + i);
    const dIdx = dTokens.map((_, i) => 1 + qTokens.length + 1 + i);

    // ── STEP 1: ONE bold link per query token to its strongest doc token; the rest faint ──
    layer('cross', 1);
    const arcTop = rowY + chipH;
    qTokens.forEach((_, i) => {
      const row = attn[i] || [];
      let best = 0; row.forEach((v, j) => { if (v > (row[best] || 0)) best = j; });
      dTokens.forEach((_, j) => {
        const wv = row[j] || 0;
        const isMax = j === best;
        const x1 = chipCx[qIdx[i]], x2 = chipCx[dIdx[j]];
        const dip = arcTop + 24 + wv * 26;
        add('cross', el('path', {
          d: `M ${x1.toFixed(1)} ${arcTop} Q ${((x1 + x2) / 2).toFixed(1)} ${dip.toFixed(1)} ${x2.toFixed(1)} ${arcTop}`,
          class: 'ce-link' + (isMax ? ' ce-link-max' : ''), fill: 'none',
          'stroke-width': (isMax ? 3.0 : 1).toFixed(2),
          opacity: (isMax ? 0.95 : 0.16).toFixed(2),
        }, svg));
      });
    });

    // ── STEP 2: the q×d attention heatmap (rows q, cols d) ──
    layer('heat', 2);
    const hmTop = arcTop + 78;
    add('heat', el('text', { x: PAD, y: hmTop - 8, class: 'ce-head' }, svg))
      .textContent = labels.heatHead || 'cross-attention — each query token over the doc tokens (rows sum to 1)';
    const LBL = 58, CELL = 42, CGAP = 8, STEP = CELL + CGAP;
    const gx = PAD + LBL, gy = hmTop + 16;
    dTokens.forEach((t, c) => {
      add('heat', el('text', { x: gx + c * STEP + CELL / 2, y: gy - 6, class: 'ce-collbl',
        'text-anchor': 'middle' }, svg)).textContent = t;
    });
    attn.forEach((row, r) => {
      const cy = gy + r * STEP;
      add('heat', el('text', { x: gx - 10, y: cy + CELL / 2 + 5, class: 'ce-rowlbl', 'text-anchor': 'end' }, svg))
        .textContent = qTokens[r] || '';
      row.forEach((v, c) => {
        const cx = gx + c * STEP;
        const rect = el('rect', { x: cx, y: cy, width: CELL, height: CELL, rx: 4, class: 'ce-cell' }, svg);
        rect.setAttribute('fill', heat(v));
        add('heat', rect);
        const t = el('text', { x: cx + CELL / 2, y: cy + CELL / 2 + 5, class: 'ce-cellval',
          'text-anchor': 'middle' }, svg);
        t.textContent = num3(v);
        t.setAttribute('fill', v >= 0.5 ? '#fff' : 'var(--ink, #14181F)');
        add('heat', t);
      });
    });
    const hmBottom = gy + attn.length * STEP;

    // ── STEP 3: [CLS] → w·cls + b = logit → sigmoid → score ──
    layer('head', 3);
    const hT = hmBottom + 12;
    add('head', el('rect', { x: PAD, y: hT, width: W - 2 * PAD, height: 74, rx: 9, class: 'ce-callbox' }, svg));
    add('head', el('text', { x: PAD + 14, y: hT + 24, class: 'ce-headline' }, svg))
      .textContent = '[CLS] = ' + arr(clsRel) + ' · w = ' + arr(w) + ' · b = ' + num(b);
    add('head', el('text', { x: PAD + 14, y: hT + 49, class: 'ce-headline2' }, svg))
      .textContent = 'w·[CLS] + b = ' + num(logitRel) + '   →   ' + (labels.scoreLabel || 'σ(logit)') + ' = ' + num3(scoreRel);
    add('head', el('text', { x: PAD + 14, y: hT + 67, class: 'ce-headnote' }, svg))
      .textContent = labels.headNote || 'one logit per (q, d) pair — uncacheable';

    const H = frameHeightFor(hT + 74, 10);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
