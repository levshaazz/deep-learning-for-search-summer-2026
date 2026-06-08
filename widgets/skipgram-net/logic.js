/* skipgram-net/logic.js — L5 'climb-word2vec' beat: the skip-gram network as a worked forward pass.
   one-hot input → embedding matrix W (= the lookup table) → hidden row → tied output projection →
   softmax over the toy 8-word vocab. The pedagogical punchline drawn literally: multiplying a
   one-hot by W just SELECTS a row, so the embedding matrix IS the lookup table.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrows) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY number AND every word — the vocab, the W cell values,
   the hidden vector, the logits, the probs (Σ = probSum = 1.0), and topContext/runner-up — comes
   straight from data/l5-skipgram.json (the same source the facts-gate checks), never from i18n.
   All human prose comes from i18n keys in `labels`.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountSkipgramNet registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → the vocab as 8 row-cells + the one-hot column ('king' lit).                caption s0
     1  → draw W (8×4); the one-hot selects ROW 0 → the hidden vector appears right.  caption s1
     2  → tied output projection: hidden · each row of W → 8 logits as bars.          caption s2
     3  → softmax → 8 probability bars summing to 1; top context + runner-up marked.  caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { clampSegmentToRect, frameHeightFor } from '../_plot-util.js';

export const mountSkipgramNet = defineWidget({
  id: 'skipgram-net',
  rootClass: 'sg-root',
  exportName: 'mountSkipgramNet',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const vocab = data.vocab || [];
    const oneHot = data.oneHot || [];
    const W = data.W || [];
    const hidden = data.hidden || [];
    const logits = data.logits || [];
    const probs = data.probs || [];
    const ranking = data.ranking || [];
    const centreIndex = data.centreIndex || 0;
    const d = data.d || (W[0] ? W[0].length : 4);
    const topContext = data.topContext || (ranking[0] && ranking[0].word) || '';
    const runnerUp = (ranking[1] && ranking[1].word) || '';
    const n = vocab.length;

    // cell text: integers bare, floats to 3 places (the JSON precision); a 3-dp probability reader.
    const num = (x) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : fmt(x, 3));
    const prob = (x) => (typeof x !== 'number' ? '' : x.toFixed(3));

    // ── geometry: a left→right pipeline in one 480-wide column ────────────────
    const Wd = 480;
    const PAD = 14;
    const ROW = 30;                          // per-vocab-word row pitch (shared by all columns)
    const topY = 64;                         // first row's top edge (room for the column headings)
    const cell = 22;                         // square cell size for one-hot / W / hidden
    const gap = 3;

    // column x-anchors
    const vocabW = 70;                       // width reserved for the vocab word label
    const vocabX = PAD;
    const oneHotX = vocabX + vocabW;          // the 1-of-8 one-hot column
    const wX = oneHotX + cell + 22;           // the 8×4 W grid starts here
    const wW = d * (cell + gap) - gap;
    const hiddenX = wX + wW + 30;             // the hidden 1×4 row sits to the right of W
    const barX = wX + wW + 30;                // logits/probs bars share this left edge
    const barMaxW = Wd - PAD - barX - 56;     // room for the value text on the right

    const H = frameHeightFor(topY + n * ROW + 8, 14);
    const plotRect = { x: 0, y: 0, w: Wd, h: H };   // for clampSegmentToRect on the lookup arrow

    const svg = el('svg', { viewBox: `0 0 ${Wd} ${H}`, class: 'wgt-svg sg-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const rowY = (i) => topY + i * ROW;       // top edge of vocab row i

    // value → fill: diverging map around 0 (W rows are row-normalised in [-1,1]).
    // positive → accent blue, negative → warm red, magnitude → opacity.
    const cellFill = (v) => {
      const mag = Math.min(1, Math.abs(v));
      const tok = v >= 0 ? 'var(--accent, #2A6FDB)' : 'var(--c-red, #D7522C)';
      return `color-mix(in srgb, ${tok} ${Math.round(18 + mag * 70)}%, var(--bg-card, #fff))`;
    };

    // ── always-on: vocab labels down the left edge ────────────────────────────
    layer('vocab', 0);
    vocab.forEach((w, i) => {
      const isCentre = i === centreIndex;
      const t = add('vocab', el('text', { x: vocabX, y: rowY(i) + cell / 2 + 4,
        class: `sg-vocab${isCentre ? ' sg-vocab-centre' : ''}` }, svg));
      t.textContent = w;
    });

    // ── STEP 0: the one-hot input column ──────────────────────────────────────
    layer('onehot', 0);
    add('onehot', el('text', { x: oneHotX + cell / 2, y: topY - 38, class: 'sg-colhead',
      'text-anchor': 'middle' }, svg)).textContent = labels.inHead || 'input · one-hot';
    oneHot.forEach((bit, i) => {
      const on = bit === 1;
      const g = el('g', {}, svg);
      el('rect', { x: oneHotX, y: rowY(i), width: cell, height: cell, rx: 3,
        class: `sg-onehot${on ? ' sg-onehot-on' : ''}` }, g);
      el('text', { x: oneHotX + cell / 2, y: rowY(i) + cell / 2 + 4,
        class: `sg-onehot-v${on ? ' sg-onehot-v-on' : ''}`, 'text-anchor': 'middle' }, g)
        .textContent = String(bit);
      add('onehot', g);
    });

    // ── STEP 1: the embedding matrix W (8×4) + the lookup arrow + hidden ───────
    layer('matrix', 1);
    add('matrix', el('text', { x: wX, y: topY - 38, class: 'sg-colhead' }, svg))
      .textContent = labels.wHead || 'W · embedding matrix = lookup table';
    const wCells = [];                        // keep row-0 cell refs so we can keep them lit
    W.forEach((row, i) => {
      const isSel = i === centreIndex;
      row.forEach((v, c) => {
        const cx = wX + c * (cell + gap);
        const cy = rowY(i);
        const rect = el('rect', { x: cx, y: cy, width: cell, height: cell, rx: 3,
          class: `sg-wcell${isSel ? ' sg-wcell-sel' : ''}` }, svg);
        rect.setAttribute('fill', cellFill(v));
        add('matrix', rect);
        add('matrix', el('text', { x: cx + cell / 2, y: cy + cell / 2 + 3.5,
          class: 'sg-wval', 'text-anchor': 'middle' }, svg)).textContent = num(v);
      });
    });
    // highlight ring around the selected row (king's row 0)
    add('matrix', el('rect', { x: wX - 2, y: rowY(centreIndex) - 2, width: wW + 4, height: cell + 4,
      rx: 4, class: 'sg-rowring', fill: 'none' }, svg));
    // lookup arrow: one-hot lit cell → the selected row of W (clamped to the frame)
    {
      const ax1 = oneHotX + cell + 2, ay = rowY(centreIndex) + cell / 2;
      const ax2 = wX - 4;
      const seg = clampSegmentToRect(ax1, ay, ax2, ay, plotRect) || { x1: ax1, y1: ay, x2: ax2, y2: ay };
      add('matrix', el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2,
        class: 'sg-arrow', 'marker-end': 'url(#sg-ah)' }, svg));
      add('matrix', el('text', { x: (ax1 + ax2) / 2, y: ay - 5, class: 'sg-tag',
        'text-anchor': 'middle' }, svg)).textContent = labels.lookupTag || 'select row';
    }

    // ── STEP 1: the hidden vector (the looked-up row), drawn as 4 cells right ──
    layer('hidden', 1, 1);
    add('hidden', el('text', { x: hiddenX, y: topY - 38, class: 'sg-colhead' }, svg))
      .textContent = labels.hiddenHead || 'hidden = the looked-up row';
    hidden.forEach((v, c) => {
      const cy = rowY(centreIndex) + c * (cell + gap) - 1.5 * (cell + gap);  // centre the 4-cell stack on king's row
      const rect = el('rect', { x: hiddenX, y: cy, width: cell, height: cell, rx: 3, class: 'sg-hcell' }, svg);
      rect.setAttribute('fill', cellFill(v));
      add('hidden', rect);
      add('hidden', el('text', { x: hiddenX + cell / 2, y: cy + cell / 2 + 3.5,
        class: 'sg-wval', 'text-anchor': 'middle' }, svg)).textContent = num(v);
    });

    // ── bar column (logits at s2, probs at s3) — one bar per vocab row ─────────
    function barColumn(name, from, to, vals, fmtFn, opts = {}) {
      layer(name, from, to);
      const headKey = opts.headKey, headFallback = opts.headFallback;
      add(name, el('text', { x: barX, y: topY - 38, class: 'sg-colhead' }, svg))
        .textContent = (labels[headKey] || headFallback);
      // scale bars to the largest magnitude so the track is filled (logits can be negative).
      const maxMag = Math.max(1e-6, ...vals.map((v) => Math.abs(v)));
      const zeroX = opts.signed ? barX + (barMaxW * (vals.some((v) => v < 0) ? 0.32 : 0)) : barX;
      vals.forEach((v, i) => {
        const cy = rowY(i) + 3;
        const bh = cell - 6;
        const g = el('g', {}, svg);
        el('rect', { x: barX, y: cy, width: barMaxW, height: bh, rx: 3, class: 'sg-bartrack' }, g);
        let bx, bw, fillCls;
        if (opts.signed) {
          const w = (Math.abs(v) / maxMag) * (v >= 0 ? barMaxW - (zeroX - barX) : (zeroX - barX));
          bx = v >= 0 ? zeroX : zeroX - w;
          bw = Math.max(1.5, w);
          fillCls = v >= 0 ? 'sg-barfill sg-bar-pos' : 'sg-barfill sg-bar-neg';
        } else {
          bx = barX;
          bw = Math.max(1.5, (v / maxMag) * barMaxW);
          // highlight the top context word (and runner-up) on the probability column.
          const isTop = opts.topWord && vocab[i] === opts.topWord;
          const isRunner = opts.runnerWord && vocab[i] === opts.runnerWord;
          fillCls = `sg-barfill ${isTop ? 'sg-bar-top' : isRunner ? 'sg-bar-runner' : 'sg-bar-lo'}`;
        }
        el('rect', { x: bx, y: cy, width: bw, height: bh, rx: 3, class: fillCls }, g);
        el('text', { x: barX + barMaxW + 6, y: cy + bh - 2.5, class: 'sg-barval' }, g)
          .textContent = fmtFn(v);
        add(name, g);
      });
      return { zeroX };
    }
    barColumn('logits', 2, 2, logits, num,
      { signed: true, headKey: 'logitsHead', headFallback: 'logits · score per vocab word' });
    barColumn('probs', 3, 3, probs, prob,
      { headKey: 'probsHead', headFallback: 'softmax · context distribution (Σ = 1)',
        topWord: topContext, runnerWord: runnerUp });

    // ── STEP 3: top-context + runner-up tags beside the highlighted bars ──────
    layer('toptag', 3, 3);
    const tagFor = (word, tagKey, tagFallback, cls) => {
      const idx = vocab.indexOf(word);
      if (idx < 0) return;
      const cy = rowY(idx) + cell / 2 + 3;
      add('toptag', el('text', { x: barX + barMaxW + 30, y: cy, class: `sg-toptag ${cls}` }, svg))
        .textContent = (labels[tagKey] || tagFallback) + ' · ' + word;
    };
    tagFor(topContext, 'topTag', 'top context', 'sg-toptag-top');
    tagFor(runnerUp, 'runnerTag', 'runner-up', 'sg-toptag-runner');

    // arrow-head def (shared)
    const defs = el('defs', {}, svg);
    const m = el('marker', { id: 'sg-ah', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'sg-arrhead' }, m);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const node of L.nodes) node.classList.toggle('is-hidden', !on);
      }
      // dim the one-hot once the matrix takes over, but keep it visible (it's the selector).
      svg.classList.toggle('sg-lookup', k >= 1);
    };
  },
});
