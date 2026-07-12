/* ncd-atlas/logic.js — THE ATLAS. Every other widget in this family is one node of this picture.

   WHAT IT ARGUES. A gallery of circuits is a pile of islands. The course is not a pile: it is ONE
   funnel, and the funnel is legible as a sequence of SHAPES. Read the ledger down the side and the
   whole subject is there in eight rows:

       n tokens → n×m → n×m → m → N×m → K → k → 1

   Three things worth stopping on. (1) Pooling is where the axis n DIES — that single contraction is
   what turns a passage into a point you can index. (2) The index is not a different machine: it is the
   SAME encoder, run over N documents ahead of time. Search is possible for exactly one reason — the
   encoder can be applied offline. (3) Everything after that is narrowing: N → K → k → one answer, and
   every arrow in that chain costs money, which is why the cascade exists at all.

   Step 0 = the encoder row (text becomes a point) · 1 = the same encoder × N offline IS the index
   · 2 = the funnel: retrieve → rerank → generate. Structural; `data: []`.
   DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdAtlas = defineWidget({
  id: 'ncd-atlas',
  rootClass: 'ncdat-root',
  exportName: 'mountNcdAtlas',
  maxStep: 2,
  render({ host, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const W = 820, H = 300;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdat-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'An atlas of the whole pipeline as one neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the shape, end to end'));

    const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || 'middle');
    const R = (p, cls, x, y, w, h, rx) => el('rect', { class: cls, x, y, width: w, height: h, rx: rx || 6 }, p);
    const chip = (p, cx, cy, w, s, cls, txtCls) => { R(p, cls, cx - w / 2, cy - 15, w, 30, 7); T(p, cx, cy + 5, s, txtCls); };

    const yTop = 76, yBot = 224, yLink = 142;

    function setLedger(step) {
      const on = (k) => (step > k ? 'on' : step === k ? 'new' : 'off');
      const rows = [
        { k: L('rText', 'text'), v: L('vTok', 'n tokens'), state: on(0) },
        { k: L('rEmb', 'after E'), v: 'n×m', state: on(0) },
        { k: L('rBlocks', 'after ×L blocks'), v: 'n×m', state: on(0) },
        { k: L('rPool', 'after pooling'), v: 'm', state: on(0), tone: 'good' },
      ];
      if (step >= 1) rows.push({ k: L('rIndex', 'the index'), v: 'N×m', state: on(1) });
      if (step >= 2) {
        rows.push({ k: L('rRetrieve', 'after retrieve'), v: 'K', state: 'new' });
        rows.push({ k: L('rRerank', 'after rerank'), v: 'k', state: 'new' });
        rows.push({ k: L('rAnswer', 'the answer'), v: '1', state: 'new', tone: 'good' });
      }
      const notes = [
        L('lgN0', 'Pooling is where the axis n DIES: n tokens collapse into one vector of m. That single contraction is what turns a passage into a point you can index.'),
        L('lgN1', 'The index is not a second machine. It is the SAME encoder, run over N documents ahead of time. Search works for exactly one reason: the encoder can be applied offline.'),
        L('lgN2', 'Everything after the index is narrowing: N → K → k → one answer. Every arrow in that chain costs money — which is the whole reason the cascade exists.'),
      ];
      lg.set(rows, notes[Math.min(step, 2)]);
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const g = main;
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ── row 1: the encoder. Text goes in; a point comes out. ────────────────
      const gA = el('g', { class: fresh(0) }, g);
      T(gA, 20, yTop - 34, L('rowEnc', 'encode — a passage becomes a point'), 'ncdat-rowlbl', 'start');
      chip(gA, 52, yTop, 68, L('cText', 'text'), 'ncdat-chip-in', 'ncdat-chipv-in');
      G.wire(gA, 'ncdat-w ncdat-w-in', 86, yTop, 118, yTop, { arrow: true });
      G.box(gA, 162, yTop, 76, 44, 'E', 'V→ℝᵐ', 'ncdat-box-emb', 'ncdat-box-txt', 'ncdat-sub');
      G.wire(gA, 'ncdat-w ncdat-w-in', 200, yTop, 232, yTop, { arrow: true });
      G.box(gA, 274, yTop, 76, 44, '+ PE', 'sin/cos', 'ncdat-box-pe', 'ncdat-box-txt', 'ncdat-sub');
      G.wire(gA, 'ncdat-w ncdat-w-in', 312, yTop, 344, yTop, { arrow: true });
      G.box(gA, 414, yTop, 124, 44, L('cBlocks', '× L blocks'), L('cAttn', 'attention'), 'ncdat-box-blk', 'ncdat-box-txt', 'ncdat-sub');
      G.wire(gA, 'ncdat-w ncdat-w-in', 476, yTop, 508, yTop, { arrow: true });
      G.box(gA, 552, yTop, 76, 44, L('cPool', 'pool'), 'n → 1', 'ncdat-box-pool', 'ncdat-box-txt', 'ncdat-sub');
      G.wire(gA, 'ncdat-w ncdat-w-out', 590, yTop, 622, yTop, { arrow: true });
      chip(gA, 682, yTop, 106, L('cVec', 'vector  m'), 'ncdat-chip-out', 'ncdat-chipv-out');

      // ── the link: that same encoder, run N times offline, IS the index ──────
      if (step >= 1) {
        const gB = el('g', { class: fresh(1) }, g);
        // orthogonal routing — a curve here would have to cross the whole figure
        el('path', { class: 'ncdat-w ncdat-w-off', fill: 'none',
          d: `M${682},${yTop + 15} V${yLink} H${52} V${yBot - 16}` }, gB);
        el('path', { class: 'ncdat-w ncdat-w-off', fill: 'none',
          d: `M${46},${yBot - 24} L${52},${yBot - 14} L${58},${yBot - 24}` }, gB);
        // rides ON the offline wire by design — declared, so the wire-through-shape check does not flag it
        G.tagBox(gB, 400, yLink + 3, L('offline', '× N documents, offline — this IS the index'),
          'ncdat-offtag ncd-onwire', 'ncdat-offtag-txt', 10, 6);
      }

      // ── row 2: the funnel. N documents narrow to one answer. ────────────────
      if (step >= 2) {
        const gC = el('g', { class: fresh(2) }, g);
        // row 2's label lives on the RIGHT: the left shoulder is taken by the query badge
        T(gC, W - 20, yBot - 52, L('rowSearch', 'search — N narrows to one'), 'ncdat-rowlbl', 'end');
        chip(gC, 52, yBot, 84, 'N×m', 'ncdat-chip-idx', 'ncdat-chipv-idx');
        G.wire(gC, 'ncdat-w ncdat-w-N', 94, yBot, 126, yBot, { arrow: true });
        G.box(gC, 178, yBot, 92, 44, L('cRetr', 'retrieve'), 'bi-enc', 'ncdat-box-retr', 'ncdat-box-txt', 'ncdat-sub');
        G.wire(gC, 'ncdat-w ncdat-w-N', 224, yBot, 256, yBot, { arrow: true });
        chip(gC, 288, yBot, 44, 'K', 'ncdat-chip-mid', 'ncdat-chipv-mid');
        G.wire(gC, 'ncdat-w ncdat-w-N', 310, yBot, 342, yBot, { arrow: true });
        G.box(gC, 394, yBot, 92, 44, L('cRerank', 'rerank'), 'cross-enc', 'ncdat-box-rr', 'ncdat-box-txt', 'ncdat-sub');
        G.wire(gC, 'ncdat-w ncdat-w-N', 440, yBot, 472, yBot, { arrow: true });
        chip(gC, 504, yBot, 44, 'k', 'ncdat-chip-mid', 'ncdat-chipv-mid');
        G.wire(gC, 'ncdat-w ncdat-w-N', 526, yBot, 558, yBot, { arrow: true });
        G.box(gC, 610, yBot, 92, 44, L('cGen', 'generate'), 'LLM', 'ncdat-box-gen', 'ncdat-box-txt', 'ncdat-sub');
        G.wire(gC, 'ncdat-w ncdat-w-out', 656, yBot, 688, yBot, { arrow: true });
        chip(gC, 748, yBot, 76, L('cAns', 'answer'), 'ncdat-chip-out', 'ncdat-chipv-out');
        // the query re-enters here — the same encoder output, used online this time
        el('path', { class: 'ncdat-w ncdat-w-q', fill: 'none', d: `M${178},${yBot - 46} V${yBot - 22}` }, gC);
        el('path', { class: 'ncdat-w ncdat-w-q', fill: 'none',
          d: `M${172},${yBot - 30} L${178},${yBot - 20} L${184},${yBot - 30}` }, gC);
        G.tagBox(gC, 178, yBot - 54, L('queryHere', 'the query — same E, online'),
          'ncdat-qtag', 'ncdat-qtag-txt', 10, 6);
      }

      T(g, W / 2, H - 8, L('legMap', 'pooling kills n · the index is the encoder run offline · everything after it narrows'),
        'ncdat-legend');
      prev = step;
    };
  },
});
