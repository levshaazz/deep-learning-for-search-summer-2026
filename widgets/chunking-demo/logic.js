/* chunking-demo/logic.js — L10 'climb-chunking' beat: how chunk size & overlap decide what can be
   retrieved. A 1000-token document ruler with the answer span highlighted; chunk windows slide beneath
   it. With size=200/overlap=0 the answer STRADDLES a boundary (no window holds it whole → recall@3 = 0);
   with overlap=50 one window [300,500] contains it whole (recall@3 = 1.0). Binary answer-containment.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. Every number (chunk counts, recall,
   the span, the windows) comes from data/l10-chunking.json (facts-gated, recomputed by provenance_l10);
   all human text from i18n `labels`. Built on _widget-base.js.

   Steps (maxStep = 3):
     0  → the document ruler + the answer span [380,470].                                    s0
     1  → size=200, overlap=0 → 5 windows; the answer straddles boundary 400 → recall@3 = 0.   s1
     2  → size=200, overlap=50 → 7 windows; window [300,500] holds it whole → recall@3 = 1.0.  s2
     3  → the chunk-count formula ceil((L-o)/(size-o)); overlap costs storage, buys recall.    s3

   VARIANT: ctx.variant === 'sweep' renders the OVERLAP-SWEEP path instead (mountChunkingSweep). At a
   FIXED size=200 it sweeps overlap = 0 / 50 / 100 / 150 over the SAME gold span, revealing one config
   per step: recall@3 climbs 0 → 1 → 1 → 1 (overlap rescues the [380,470] boundary straddle) while
   nChunks grows 5 → 7 → 9 → 17 (the storage cost). Every number comes from data.sweep in
   l10-chunking.json. The default (no variant) size/overlap demo above is untouched — same DOM, same
   numbers — so it stays backward-compatible.
     sweep step 0 → just the ruler + gold span.                                               sweep0
     sweep step k → reveal sweep config (k-1): its chunk grid + answer-containment + recall@3. sweep1..4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

// ── shared geometry helpers (used by BOTH the default demo and the sweep variant) ──
const DOC_W = 560, DOC_PADL = 26, DOC_PADR = 26;

export const mountChunkingDemo = defineWidget({
  id: 'chunking-demo',
  rootClass: 'ck-root',
  exportName: 'mountChunkingDemo',
  maxStep: 3,
  render(ctx) {
    if (ctx.variant === 'sweep') return renderSweep(ctx);
    const { host, data, labels, el } = ctx;
    const L = data.docLen || 1000;
    const span = data.answerSpan || [0, 0];
    const scen = data.scenarios || [];
    const W = 560, padL = 26, padR = 26, plotW = W - padL - padR;
    const x = (t) => padL + (t / L) * plotW;

    const rulerY = 58, rowH = 30, rowGap = 18;
    const rowY = (i) => rulerY + 44 + i * (rowH + rowGap + 22);
    const contains = (w) => w[0] <= span[0] && span[1] <= w[1];

    const readTop = rowY(scen.length) + 6;
    const H = frameHeightFor(readTop + 22, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg ck-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // ── document ruler + ticks ──
    el('line', { x1: x(0), y1: rulerY, x2: x(L), y2: rulerY, class: 'ck-ruler' }, svg);
    for (let t = 0; t <= L; t += 200) {
      el('line', { x1: x(t), y1: rulerY - 5, x2: x(t), y2: rulerY + 5, class: 'ck-tick' }, svg);
      el('text', { x: x(t), y: rulerY - 10, class: 'ck-ticklbl', 'text-anchor': 'middle' }, svg).textContent = t;
    }
    el('text', { x: padL, y: rulerY - 26, class: 'ck-doclbl' }, svg).textContent = (labels.docLabel || 'document') + ' · ' + L + ' ' + (labels.tokens || 'tokens');

    // ── the answer span band (drawn through all rows so you see which windows cross it) ──
    const spanBand = el('rect', { x: x(span[0]), y: rulerY - 4, width: x(span[1]) - x(span[0]), height: readTop - rulerY - 6, rx: 3, class: 'ck-span' }, svg);
    el('text', { x: (x(span[0]) + x(span[1])) / 2, y: rulerY + 18, class: 'ck-spanlbl', 'text-anchor': 'middle' }, svg)
      .textContent = (labels.answer || 'answer') + ' [' + span[0] + ',' + span[1] + ']';

    // ── one window-row per scenario ──
    scen.forEach((sc, si) => {
      const name = 'row' + si;
      layer(name, si + 1);
      const y = rowY(si);
      add(name, el('text', { x: padL, y: y - 6, class: 'ck-rowlbl' }, svg))
        .textContent = `size=${sc.size}, overlap=${sc.overlap} → ${sc.nChunks} ${labels.chunks || 'chunks'}`;
      (sc.windows || []).forEach((w, wi) => {
        const ok = contains(w);
        const cls = 'ck-win ' + (ok ? 'is-hold' : (w[0] < span[1] && w[1] > span[0] ? 'is-cross' : 'is-far'));
        add(name, el('rect', { x: x(w[0]) + 1, y, width: Math.max(2, x(w[1]) - x(w[0]) - 2), height: rowH, rx: 4, class: cls }, svg));
      });
      const recall = sc.recallAt3;
      add(name, el('text', { x: W - padR, y: y + rowH + 15, class: 'ck-recall ' + (recall ? 'is-ok' : 'is-bad'), 'text-anchor': 'end' }, svg))
        .textContent = `${labels.intact || 'answer intact?'} ${recall ? '✓' : '✗'} · recall@3 = ${recall}`;
    });

    // ── formula (step 3) ──
    layer('formula', 3);
    add('formula', el('text', { x: W / 2, y: readTop, class: 'ck-formula', 'text-anchor': 'middle' }, svg))
      .textContent = (labels.formulaLbl || 'chunks') + ' = ⌈(L − overlap) / (size − overlap)⌉';

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
    };
  },
});

/* renderSweep — the OVERLAP-SWEEP variant (ctx.variant === 'sweep'). At a FIXED size=200 it sweeps
   overlap = 0 / 50 / 100 / 150 over the SAME gold span [380,470], one config per step (cumulative).
   setStep(k) reveals sweep configs 0..k, so the reader watches recall@3 climb 0 → 1 → 1 → 1 and the
   chunk count grow 5 → 7 → 9 → 17 (the storage cost of overlap). All numbers from data.sweep. */
function renderSweep({ host, data, labels, el }) {
  const L = data.docLen || 1000;
  const span = data.answerSpan || [0, 0];
  const sweep = data.sweep || [];
  const W = DOC_W, padL = DOC_PADL, padR = DOC_PADR, plotW = W - padL - padR;
  const x = (t) => padL + (t / L) * plotW;

  const rulerY = 58, rowH = 26, rowGap = 16, rowBlock = rowH + rowGap + 22;
  const rowY = (i) => rulerY + 44 + i * rowBlock;
  const contains = (w) => w[0] <= span[0] && span[1] <= w[1];

  const readTop = rowY(sweep.length) + 6;
  const H = frameHeightFor(readTop + 22, 12);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg ck-svg', role: 'img', 'aria-label': labels.altSweep || labels.alt || '' }, host);

  const layers = {};
  const layer = (name, from) => (layers[name] = { from, nodes: [] });
  const add = (name, n) => { layers[name].nodes.push(n); return n; };

  // ── document ruler + ticks (always visible, layer 'base' from step 0) ──
  layer('base', 0);
  add('base', el('line', { x1: x(0), y1: rulerY, x2: x(L), y2: rulerY, class: 'ck-ruler' }, svg));
  for (let t = 0; t <= L; t += 200) {
    add('base', el('line', { x1: x(t), y1: rulerY - 5, x2: x(t), y2: rulerY + 5, class: 'ck-tick' }, svg));
    add('base', el('text', { x: x(t), y: rulerY - 10, class: 'ck-ticklbl', 'text-anchor': 'middle' }, svg)).textContent = t;
  }
  add('base', el('text', { x: padL, y: rulerY - 26, class: 'ck-doclbl' }, svg))
    .textContent = (labels.sweepLabel || labels.docLabel || 'fixed size=200, sweeping overlap') + ' · ' + L + ' ' + (labels.tokens || 'tokens');

  // ── gold answer-span band through every row (always visible) ──
  add('base', el('rect', { x: x(span[0]), y: rulerY - 4, width: x(span[1]) - x(span[0]), height: readTop - rulerY - 6, rx: 3, class: 'ck-span' }, svg));
  add('base', el('text', { x: (x(span[0]) + x(span[1])) / 2, y: rulerY + 18, class: 'ck-spanlbl', 'text-anchor': 'middle' }, svg))
    .textContent = (labels.answer || 'answer') + ' [' + span[0] + ',' + span[1] + ']';

  // ── one window-row per sweep config; config si revealed at step si (cumulative) ──
  sweep.forEach((sc, si) => {
    const name = 'cfg' + si;
    layer(name, si);
    const y = rowY(si);
    add(name, el('text', { x: padL, y: y - 6, class: 'ck-rowlbl' }, svg))
      .textContent = `overlap=${sc.overlap} → ${sc.nChunks} ${labels.chunks || 'chunks'}`;
    (sc.windows || []).forEach((w) => {
      const ok = contains(w);
      const cls = 'ck-win ' + (ok ? 'is-hold' : (w[0] < span[1] && w[1] > span[0] ? 'is-cross' : 'is-far'));
      add(name, el('rect', { x: x(w[0]) + 1, y, width: Math.max(2, x(w[1]) - x(w[0]) - 2), height: rowH, rx: 4, class: cls }, svg));
    });
    const recall = sc.recallAt3;
    add(name, el('text', { x: W - padR, y: y + rowH + 15, class: 'ck-recall ' + (recall ? 'is-ok' : 'is-bad'), 'text-anchor': 'end' }, svg))
      .textContent = `${labels.intact || 'answer intact?'} ${recall ? '✓' : '✗'} · recall@3 = ${recall}`;
  });

  return function update(k) {
    for (const name in layers) {
      const on = k >= layers[name].from;
      for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
    }
  };
}
