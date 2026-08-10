/* chunk-size-law/logic.js — L16 "turn the chunk-size dial and watch the gap".

   WHY THIS EXISTS: the deck used to ASSERT "the smaller the chunk, the bigger the win" with no curve,
   no cause and no exception. This widget closes all three holes at once: it DERIVES the law, DRAWS it,
   and on the last step BREAKS it — showing where the gain turns negative. One widget repairs the
   chunk-size slide, the Needle slide, and the "late never loses" error.

   THE LAW (data/l16-chunk.json → gapLaw, generator _research/gen_l16.py): a mention whose referent sits
   g tokens behind it survives the cut only if no chunk boundary falls between them. With a chunk grid
   of size s at a uniform offset, that happens with probability max(0, 1 − g/s) — so the ORPHANED
   fraction is min(1, g/s). At g = 40: s=32 → 1,0 · 64 → 0,625 · 128 → 0,3125 · 256 → 0,1563 · 512 → 0,0781.

   THE TEST (last step): the law predicts an ORDER, and the three published BeIR strategies obey it —
   sentence chunks are smallest → biggest Δ (+1.9); fixed-256 in the middle (+1.8); semantic chunks are
   largest → smallest Δ (+1.4). Three out of three. And then the counterexample: on Needle-8192 the
   neighbours carry no referent at all, Δ goes NEGATIVE, and min(1, g/s) has nothing to say about it.
   The law predicts a gain only when the neighbour is RELEVANT.

   NOT DRAWN FROM FIGURE 3: the paper prints that figure but not its numbers, so the curve here is the
   law's own curve, and the figure is cited for its SHAPE only.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. Built on _widget-base.js.

   Steps (maxStep = 6):
     0 → the ruler, the referent→mention pair, g = 40 tokens.                                s0
     1..5 → the chunk grid at s = 32 / 64 / 128 / 256 / 512, orphaned fraction plotted.      s1..s5
     6 → no cut at all: 0 orphans — but length collapse is back; plus the three real anchors
         in the predicted order, and the Needle counterexample where Δ is negative.          s6 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

const W = 900;
const DOC = { x: 30, y: 104, w: 408, h: 32 };      // the document window: 1.5 px == 1 token
const TOKPX = 1.5;                                 // px per token on the ruler
const REF_TOK = 100;                               // where the referent is named
const PLOT = { x: 520, y: 78, w: 350, h: 208 };

export const mountChunkSizeLaw = defineWidget({
  id: 'chunk-size-law',
  rootClass: 'csl-root',
  exportName: 'mountChunkSizeLaw',
  maxStep: 6,
  render({ host, data, labels, el }) {
    const G = (data && data.gapLaw) || {};
    const g = typeof G.gapTokens === 'number' ? G.gapTokens : 40;
    const sizes = G.sizes || [32, 64, 128, 256, 512];
    const frac = G.orphanFraction || sizes.map((s) => Math.min(1, g / s));
    const anch = G.anchors || { sentence: 1.9, fixed256: 1.8, semantic: 1.4 };

    const dec = () => {
      const l = (typeof document !== 'undefined' && document.documentElement &&
                 (document.documentElement.dataset.lang || document.documentElement.lang || 'en')).slice(0, 2);
      return (l === 'ru' || l === 'tt') ? ',' : '.';
    };
    const pct = (x) => (Math.round(x * 1000) / 10).toFixed(1).replace('.', dec()) + ' %';
    const sig = (x) => (x > 0 ? '+' : '−') + Math.abs(x).toFixed(1).replace('.', dec());

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg csl-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── left · the document window ──────────────────────────────────────────────────────────────
    layer('doc', 0);
    add('doc', el('text', { x: DOC.x, y: 26, class: 'csl-head' }, svg))
      .textContent = labels.docHead || 'a 272-token window of the document';
    add('doc', el('rect', { x: DOC.x, y: DOC.y, width: DOC.w, height: DOC.h, rx: 4, class: 'csl-doc' }, svg));
    const refX = DOC.x + REF_TOK * TOKPX, menX = DOC.x + (REF_TOK + g) * TOKPX;
    add('doc', el('circle', { cx: refX, cy: DOC.y + DOC.h / 2, r: 6, class: 'csl-ref' }, svg));
    add('doc', el('circle', { cx: menX, cy: DOC.y + DOC.h / 2, r: 6, class: 'csl-men' }, svg));
    add('doc', el('line', { x1: refX, y1: DOC.y - 12, x2: menX, y2: DOC.y - 12, class: 'csl-gapline' }, svg));
    add('doc', el('text', { x: (refX + menX) / 2, y: DOC.y - 18, class: 'csl-gaplbl', 'text-anchor': 'middle' }, svg))
      .textContent = 'g = ' + g;
    add('doc', el('text', { x: refX - 6, y: DOC.y + DOC.h + 18, class: 'csl-ptlbl is-ref', 'text-anchor': 'end' }, svg))
      .textContent = labels.refTag || 'Berlin';
    add('doc', el('text', { x: menX + 6, y: DOC.y + DOC.h + 18, class: 'csl-ptlbl is-men', 'text-anchor': 'start' }, svg))
      .textContent = labels.menTag || '«Its …»';

    // the sliding chunk grid — redrawn every step into its own group
    const gridG = el('g', { class: 'csl-grid' }, svg);
    const verdict = el('text', { x: DOC.x, y: DOC.y + DOC.h + 58, class: 'csl-verdict' }, svg);
    const readout = el('text', { x: DOC.x, y: DOC.y + DOC.h + 84, class: 'csl-readout' }, svg);

    // ── right · the curve ───────────────────────────────────────────────────────────────────────
    layer('plot', 0);
    const N = sizes.length + 1;                                   // + the "no cut" point
    const cx = (i) => PLOT.x + (i + 0.5) * (PLOT.w / N);
    const cy = (v) => PLOT.y + PLOT.h - v * PLOT.h;
    add('plot', el('text', { x: PLOT.x, y: 26, class: 'csl-head' }, svg))
      .textContent = labels.plotHead || 'orphaned fraction = min(1, g/s)';
    add('plot', el('rect', { x: PLOT.x, y: PLOT.y, width: PLOT.w, height: PLOT.h, rx: 5, class: 'csl-plotbg' }, svg));
    add('plot', el('line', { x1: PLOT.x, y1: PLOT.y + PLOT.h, x2: PLOT.x + PLOT.w, y2: PLOT.y + PLOT.h, class: 'csl-axis' }, svg));
    add('plot', el('line', { x1: PLOT.x, y1: PLOT.y, x2: PLOT.x, y2: PLOT.y + PLOT.h, class: 'csl-axis' }, svg));
    for (const t of [0, 0.5, 1]) {
      add('plot', el('line', { x1: PLOT.x, y1: cy(t), x2: PLOT.x + PLOT.w, y2: cy(t), class: 'csl-grid-h' }, svg));
      add('plot', el('text', { x: PLOT.x - 6, y: cy(t) + 4, class: 'csl-tick', 'text-anchor': 'end' }, svg))
        .textContent = Math.round(t * 100) + '%';
    }
    const labelsX = sizes.map(String).concat([labels.noCut || 'no cut']);
    labelsX.forEach((s, i) => {
      add('plot', el('text', { x: cx(i), y: PLOT.y + PLOT.h + 18, class: 'csl-tick', 'text-anchor': 'middle' }, svg))
        .textContent = s;
    });
    add('plot', el('text', { x: PLOT.x + PLOT.w / 2, y: PLOT.y + PLOT.h + 36, class: 'csl-axislbl', 'text-anchor': 'middle' }, svg))
      .textContent = labels.axisS || 'chunk size s (tokens)';

    const path = el('path', { d: '', class: 'csl-curve' }, svg);
    const dots = [], dotLbls = [];
    const allFrac = frac.concat([0]);
    for (let i = 0; i < N; i++) {
      const d = el('circle', { cx: cx(i), cy: cy(allFrac[i]), r: 5, class: 'csl-dot is-hidden' }, svg);
      const t = el('text', { x: cx(i), y: cy(allFrac[i]) - 11, class: 'csl-dotlbl is-hidden', 'text-anchor': 'middle' }, svg);
      t.textContent = pct(allFrac[i]);
      dots.push(d); dotLbls.push(t);
    }

    // ── the payoff strip: the three published anchors + the counterexample (step 6) ──────────────
    layer('anchors', 6);
    const AY = Math.max(DOC.y + DOC.h + 116, PLOT.y + PLOT.h + 62);
    add('anchors', el('text', { x: DOC.x, y: AY, class: 'csl-head' }, svg))
      .textContent = labels.anchorHead || 'the law predicts an ORDER — the reported Δ nDCG@10 obeys it';
    const rows = [
      [labels.aSentence || 'sentence (smallest)', anch.sentence],
      [labels.aFixed || 'fixed-256 (middle)', anch.fixed256],
      [labels.aSemantic || 'semantic (largest)', anch.semantic],
    ];
    const barX = DOC.x + 300, barU = 72;
    rows.forEach((r, i) => {
      const y = AY + 24 + i * 24;
      add('anchors', el('text', { x: DOC.x, y: y, class: 'csl-arow' }, svg)).textContent = r[0];
      add('anchors', el('rect', { x: barX, y: y - 11, width: Math.max(3, r[1] * barU), height: 14, rx: 3, class: 'csl-abar' }, svg));
      add('anchors', el('text', { x: barX + r[1] * barU + 8, y: y, class: 'csl-aval' }, svg)).textContent = sig(r[1]);
    });
    const cyY = AY + 24 + rows.length * 24 + 12;
    add('anchors', el('text', { x: DOC.x, y: cyY, class: 'csl-counter' }, svg))
      .textContent = labels.counter || 'Needle-8192: the neighbours carry no referent — Δ is NEGATIVE.';
    add('anchors', el('text', { x: DOC.x, y: cyY + 20, class: 'csl-counter2' }, svg))
      .textContent = labels.counter2 || 'The law predicts a gain only when the neighbour is relevant.';

    const H = frameHeightFor(cyY + 30, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    function drawGrid(s) {
      gridG.innerHTML = '';
      if (!s) return;
      for (let t = s; t * TOKPX < DOC.w; t += s) {
        const x = DOC.x + t * TOKPX;
        const cut = t > REF_TOK && t <= REF_TOK + g;
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('x1', x); ln.setAttribute('y1', DOC.y - 4);
        ln.setAttribute('x2', x); ln.setAttribute('y2', DOC.y + DOC.h + 4);
        ln.setAttribute('class', 'csl-seam' + (cut ? ' is-cut' : ''));
        gridG.appendChild(ln);
      }
    }

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      const idx = k - 1;                                   // -1 at step 0; 0..4 sizes; 5 = "no cut"
      const s = (idx >= 0 && idx < sizes.length) ? sizes[idx] : 0;
      drawGrid(s);
      // the curve grows one point per step
      const shown = Math.max(0, Math.min(N, k));
      dots.forEach((d, i) => {
        d.classList.toggle('is-hidden', i >= shown);
        dotLbls[i].classList.toggle('is-hidden', i >= shown);
        d.classList.toggle('is-current', i === idx || (idx === sizes.length && i === N - 1));
      });
      path.setAttribute('d', shown < 2 ? '' :
        allFrac.slice(0, shown).map((v, i) => (i ? 'L' : 'M') + cx(i) + ' ' + cy(v)).join(' '));
      // the readout under the ruler
      if (k === 0) {
        verdict.textContent = labels.setup || 'a referent named once, then only pronouns — g tokens back';
        readout.textContent = '';
      } else if (idx < sizes.length) {
        verdict.textContent = (labels.sizeTag || 'chunk size s =') + ' ' + s;
        readout.textContent = (labels.orphanTag || 'orphaned:') + ' ' + pct(allFrac[idx]) +
          '  =  min(1, ' + g + '/' + s + ')';
      } else {
        verdict.textContent = labels.noCutTag || 'no cut at all — nothing is orphaned';
        readout.textContent = labels.noCutNote || '…and length collapse is back: the answer is averaged away';
      }
      host.dataset.phase = k >= 6 ? 'payoff' : 'sweep';
    };
  },
});
