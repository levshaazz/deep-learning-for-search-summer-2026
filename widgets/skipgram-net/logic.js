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

    // ── geometry: a left→right pipeline; WIDE canvas so the five columns (one-hot · W · hidden ·
    //    logits/probs) each get breathing room and their headings never collide (re-audit fix).
    //    Widened from 740 → 880 to absorb the now-wider W/hidden decimal cells without squeezing the
    //    softmax bars or their top-context/runner tags. ──
    const Wd = 880;
    const PAD = 16;
    const ROW = 32;                          // per-vocab-word row pitch (shared by all columns)
    const headBand = 36;                     // vertical room above the first row for a 2-line heading
    const topY = 78;                         // first row's top edge (room for the stacked column headings)
    const cell = 22;                         // square cell size for the one-hot column (single digit)
    // The W matrix and the hidden column hold 3-decimal SIGNED values ("-0.573", ~6 chars). A 22px
    // cell was too narrow, so adjacent decimals ran together (".485.660-0.573-0.022"). Give those
    // grids a WIDER cell so every value sits fully inside its own box with a clear gap to its
    // neighbour. The cell HEIGHT stays at `cell` (square-ish rows on the shared ROW pitch).
    const wCell = 44;                        // wide cell for W / hidden decimals
    const gap = 6;                           // gap BETWEEN matrix cells
    const colGap = 56;                       // horizontal breathing room between adjacent columns

    // column x-anchors — each block is separated by colGap so nothing crowds its neighbour.
    const vocabW = 60;                       // width reserved for the vocab word label
    const vocabX = PAD;
    const oneHotX = vocabX + vocabW;          // the 1-of-8 one-hot column
    const wX = oneHotX + cell + colGap;       // the 8×4 W grid starts here
    const wW = d * (wCell + gap) - gap;
    const hiddenX = wX + wW + colGap;         // the hidden 1×4 row sits to the right of W
    const hiddenW = wCell;                    // the hidden column is one (wide) cell wide
    const barX = hiddenX + hiddenW + colGap;  // logits/probs bars sit to the right of the hidden column
    const barMaxW = Wd - PAD - barX - 200;    // room for the value text AND the top-context/runner tags

    const H = frameHeightFor(topY + n * ROW + 10, 14);
    const plotRect = { x: 0, y: 0, w: Wd, h: H };   // for clampSegmentToRect on the lookup arrow

    const svg = el('svg', { viewBox: `0 0 ${Wd} ${H}`, class: 'wgt-svg sg-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const rowY = (i) => topY + i * ROW;       // top edge of vocab row i

    // ── column heading: centred over its column and word-wrapped onto (up to) two BALANCED stacked
    //    lines, so the (often long, often translated) heading stays narrow enough to sit inside its
    //    own column and never collides with the neighbouring column's heading. Returns the <g> so the
    //    caller can layer-gate it. Wrapping is by words, splitting as close to the midpoint as possible
    //    (chars ≈ a proxy for width at this single mono size), so neither line runs long.
    const headTop = topY - headBand;          // y of the heading's first line
    const wrapHead = (text) => {
      const words = String(text || '').trim().split(/\s+/);
      if (words.length <= 1) return [text || ''];
      const full = words.join(' ');
      // pick the word boundary whose running length is nearest half the total → balanced lines.
      let best = 1, bestDiff = Infinity;
      for (let i = 1; i < words.length; i++) {
        const left = words.slice(0, i).join(' ').length;
        const right = words.slice(i).join(' ').length;
        const diff = Math.abs(left - right);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      }
      // single short line: don't wrap (≤ ~18 chars comfortably fits a column).
      if (full.length <= 18) return [full];
      return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
    };
    const colHead = (name, cx, text) => {
      const g = el('g', {}, svg);
      const lines = wrapHead(text);
      lines.forEach((ln, i) => {
        const t = el('text', { x: cx, y: headTop + i * 14,
          class: `sg-colhead${i > 0 ? ' sg-colhead-2' : ''}`, 'text-anchor': 'middle' }, g);
        t.textContent = ln;
      });
      return add(name, g);
    };

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
    colHead('onehot', oneHotX + cell / 2, labels.inHead || 'input · one-hot');
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
    colHead('matrix', wX + wW / 2, labels.wHead || 'W · embedding matrix = lookup table');
    const wCells = [];                        // keep row-0 cell refs so we can keep them lit
    W.forEach((row, i) => {
      const isSel = i === centreIndex;
      row.forEach((v, c) => {
        const cx = wX + c * (wCell + gap);     // WIDE pitch so decimals never run together
        const cy = rowY(i);
        const rect = el('rect', { x: cx, y: cy, width: wCell, height: cell, rx: 3,
          class: `sg-wcell${isSel ? ' sg-wcell-sel' : ''}` }, svg);
        rect.setAttribute('fill', cellFill(v));
        add('matrix', rect);
        add('matrix', el('text', { x: cx + wCell / 2, y: cy + cell / 2 + 3.5,
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
    colHead('hidden', hiddenX + hiddenW / 2, labels.hiddenHead || 'hidden = the looked-up row');
    // centre the 4-cell stack on the matrix's vertical middle (rows 0..n-1), so it never rides up
    // into the heading band and reads as one tidy 4-vector beside W.
    const hidMidY = rowY((n - 1) / 2) + cell / 2;          // pixel centre of the matrix block
    const hidTop0 = hidMidY - (hidden.length / 2) * (cell + gap) + gap / 2;
    hidden.forEach((v, c) => {
      const cy = hidTop0 + c * (cell + gap);                // stacked downward from the centred top
      const rect = el('rect', { x: hiddenX, y: cy, width: hiddenW, height: cell, rx: 3, class: 'sg-hcell' }, svg);
      rect.setAttribute('fill', cellFill(v));
      add('hidden', rect);
      add('hidden', el('text', { x: hiddenX + hiddenW / 2, y: cy + cell / 2 + 3.5,
        class: 'sg-wval', 'text-anchor': 'middle' }, svg)).textContent = num(v);
    });

    // ── bar column (logits at s2, probs at s3) — one bar per vocab row ─────────
    function barColumn(name, from, to, vals, fmtFn, opts = {}) {
      layer(name, from, to);
      const headKey = opts.headKey, headFallback = opts.headFallback;
      colHead(name, barX + barMaxW / 2, (labels[headKey] || headFallback));
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
    // The tag sits CLEAR of the probability value text. The value ("0.165", ~38px) is drawn at
    // barMaxW+6; the tag begins at barMaxW+56 so the two never overlap (was +30 → "0.165" ran into
    // "top context · prince"). The +200 reserved in barMaxW holds value (~44) + the longest tag.
    const TAG_X = barX + barMaxW + 56;
    layer('toptag', 3, 3);
    const tagFor = (word, tagKey, tagFallback, cls) => {
      const idx = vocab.indexOf(word);
      if (idx < 0) return;
      const cy = rowY(idx) + cell / 2 + 3;
      add('toptag', el('text', { x: TAG_X, y: cy, class: `sg-toptag ${cls}` }, svg))
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
