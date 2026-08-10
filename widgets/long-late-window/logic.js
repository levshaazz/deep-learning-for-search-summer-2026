/* long-late-window/logic.js — L16 "the window, the seam, and what we throw away".

   WHY THIS EXISTS: the two Long-Late-Chunking slides were prose plus one formula, and they never said
   the thing that decides whether the student's implementation is correct — the embeddings of the
   OVERLAPPING tokens are computed and then DISCARDED (line 14 of Algorithm 2). The overlap exists so a
   token can SEE its context, not so it can enter the index twice. This widget draws the window to
   scale, draws the seam, and spends a whole step on the discard.

   ALL NUMBERS from data/l16-chunk.json → longLate (generator _research/gen_l16.py):
     stride = l_max − ω · macroChunks = ceil((docTokens − ω)/stride) · overhead = (macroChunks − 1)·ω
     20 000 tokens, l_max = 8192, ω = 512 → stride 7 680 · 3 macro-chunks · 21 024 encoded · +1 024.
   NOTE l_max and ω are OUR example values: §4.3 of the paper publishes no hyper-parameters, and the
   repository ships two different defaults (ω = 256 and ω = 512). That disagreement is itself the lesson.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. Built on _widget-base.js.

   Steps (maxStep = 4):
     0 → the document to scale, the model window, the referent and the answer-chunk.        s0
     1 → truncate: the tail greys out — the answer-chunk is never indexed at all.           s1
     2 → cut naively (ω = 0): 3 macro-chunks, and the seam severs the dependency again.     s2
     3 → long late (ω = 512): starts 0 / 7 680 / 15 360, the overlap carries the context.   s3
     4 → the discard: the overlap embeddings go dark, every token indexed exactly once.     s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

const W = 620;
const BAR = { x: 30, y: 118, w: 560, h: 34 };       // the document, drawn to scale
/* THREE BANDS, and they must not touch (viz-probe HARD-fails a ≥50 % label-box overlap — this widget
   once shipped at 0.65): the DOCUMENT band ends at BAR.y+BAR.h = 152; the LANDMARK labels own 164…182;
   the MACRO-CHUNK rows start at ROW_Y with their own heading at ROW_Y−12, which must clear 178. */
const MARK_LBL_Y = 177;                            // baseline of «the referent» / «the answer-chunk»
const ROW_Y = 206, ROW_H = 22, ROW_GAP = 8;
const REF_TOK = 300, ANS_TOK = 14000;              // where the referent and the answer-chunk sit

export const mountLongLateWindow = defineWidget({
  id: 'long-late-window',
  rootClass: 'llw-root',
  exportName: 'mountLongLateWindow',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const L = (data && data.longLate) || {};
    const docT = L.docTokens || 20000;
    const lMax = L.lMax || 8192;
    const om = L.omega || 512;
    const stride = L.stride || (lMax - om);
    const nMacro = L.macroChunks || Math.ceil((docT - om) / stride);
    const starts = L.starts || Array.from({ length: nMacro }, (_, i) => i * stride);
    const encoded = L.tokensEncoded || 0;
    const overhead = L.overheadTokens || 0;

    const sx = (t) => BAR.x + (t / docT) * BAR.w;                 // token → px
    const thou = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg llw-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── the document, drawn to scale ────────────────────────────────────────────────────────────
    layer('doc', 0);
    add('doc', el('text', { x: BAR.x, y: 26, class: 'llw-head' }, svg))
      .textContent = (labels.docHead || 'the document, to scale') + ' — ' + thou(docT) +
        ' ' + (labels.tokens || 'tokens');
    add('doc', el('rect', { x: BAR.x, y: BAR.y, width: BAR.w, height: BAR.h, rx: 5, class: 'llw-doc' }, svg));
    const tail = add('doc', el('rect', { x: sx(lMax), y: BAR.y, width: BAR.w - (sx(lMax) - BAR.x),
      height: BAR.h, rx: 5, class: 'llw-tail is-hidden' }, svg));
    // the model window, drawn physically
    add('doc', el('rect', { x: BAR.x, y: BAR.y - 6, width: sx(lMax) - BAR.x, height: BAR.h + 12, rx: 6,
      class: 'llw-window' }, svg));
    add('doc', el('text', { x: sx(lMax) - 4, y: BAR.y - 10, class: 'llw-winlbl', 'text-anchor': 'end' }, svg))
      .textContent = (labels.window || 'model window') + ' = ' + thou(lMax);
    // the two landmarks
    /* A landmark near an EDGE of the bar must not be centred on its own tick — «the referent» sits at
       token 300, i.e. 8 px into a 560 px bar, and a centred label runs off the left of the frame (the
       reviewer saw «референт» sheared by the frame edge). Anchor by position instead. */
    const mark = (t, key, fallback, cls) => {
      const frac = t / docT;
      const anchor = frac < 0.15 ? 'start' : (frac > 0.85 ? 'end' : 'middle');
      add('doc', el('line', { x1: sx(t), y1: BAR.y - 2, x2: sx(t), y2: BAR.y + BAR.h + 2, class: 'llw-mark ' + cls }, svg));
      add('doc', el('text', { x: sx(t), y: MARK_LBL_Y, class: 'llw-marklbl ' + cls, 'text-anchor': anchor }, svg))
        .textContent = labels[key] || fallback;
    };
    mark(REF_TOK, 'refTag', 'the referent', 'is-ref');
    mark(ANS_TOK, 'ansTag', 'the answer-chunk', 'is-ans');
    // the dependency arc: from the answer-chunk back to its referent
    const arc = add('doc', el('path', {
      d: `M${sx(ANS_TOK)} ${BAR.y - 30} Q${(sx(ANS_TOK) + sx(REF_TOK)) / 2} ${BAR.y - 82} ${sx(REF_TOK)} ${BAR.y - 30}`,
      class: 'llw-arc' }, svg));
    const brokenArc = add('doc', el('text', { x: (sx(ANS_TOK) + sx(REF_TOK)) / 2, y: BAR.y - 66,
      class: 'llw-broken', 'text-anchor': 'middle' }, svg));
    brokenArc.textContent = '✕';

    // ── the macro-chunk rows (built fresh per step) ─────────────────────────────────────────────
    const rowsG = el('g', { class: 'llw-rows' }, svg);
    const rowsHead = el('text', { x: BAR.x, y: ROW_Y - 12, class: 'llw-head' }, svg);

    // ── the ledger ──────────────────────────────────────────────────────────────────────────────
    const LY = ROW_Y + 3 * (ROW_H + ROW_GAP) + 24;
    const strat = el('text', { x: BAR.x, y: LY, class: 'llw-strat' }, svg);
    const bill1 = el('text', { x: BAR.x, y: LY + 24, class: 'llw-bill' }, svg);
    const bill2 = el('text', { x: BAR.x, y: LY + 46, class: 'llw-bill2' }, svg);
    const caveat = el('text', { x: BAR.x, y: LY + 74, class: 'llw-caveat' }, svg);
    caveat.textContent = labels.caveat || 'l_max and ω are our example values — the paper publishes none…';
    const caveat2 = el('text', { x: BAR.x, y: LY + 92, class: 'llw-caveat' }, svg);
    caveat2.textContent = labels.caveat2 || '…and the repository ships two different defaults.';

    const H = frameHeightFor(LY + 100, 10);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const SVGNS = 'http://www.w3.org/2000/svg';
    function box(x, w, y, cls) {
      const r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', x); r.setAttribute('y', y);
      r.setAttribute('width', Math.max(2, w)); r.setAttribute('height', ROW_H);
      r.setAttribute('rx', 4); r.setAttribute('class', cls);
      rowsG.appendChild(r);
      return r;
    }
    function tag(x, y, text, cls) {
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y + ROW_H - 7);
      t.setAttribute('class', cls);
      t.textContent = text;
      rowsG.appendChild(t);
      return t;
    }

    function drawRows(k) {
      rowsG.innerHTML = '';
      if (k === 0) { rowsHead.textContent = ''; return; }
      if (k === 1) {                                   // truncate: one covered stretch, the rest lost
        rowsHead.textContent = labels.rowsTruncate || 'what actually gets indexed';
        box(BAR.x, sx(lMax) - BAR.x, ROW_Y, 'llw-mc');
        tag(BAR.x + 6, ROW_Y, '0 – ' + thou(lMax), 'llw-mclbl');
        box(sx(lMax), BAR.w - (sx(lMax) - BAR.x), ROW_Y, 'llw-lost');
        tag(sx(lMax) + 6, ROW_Y, labels.lost || 'never indexed', 'llw-lostlbl');
        return;
      }
      const st = (k === 2) ? Array.from({ length: Math.ceil(docT / lMax) }, (_, i) => i * lMax) : starts;
      rowsHead.textContent = (k === 2 ? (labels.rowsNaive || 'macro-chunks, no overlap')
                                      : (labels.rowsLate || 'macro-chunks with an ω-token overlap'));
      st.forEach((s, i) => {
        const y = ROW_Y + i * (ROW_H + ROW_GAP);
        const end = Math.min(docT, s + lMax);
        box(sx(s), sx(end) - sx(s), y, 'llw-mc');
        tag(sx(s) + 6, y, thou(s) + ' – ' + thou(end), 'llw-mclbl');
        if (k >= 3 && i > 0) {                          // the overlap band this chunk re-reads
          const ov = box(sx(s), sx(s + om) - sx(s), y, 'llw-ov' + (k >= 4 ? ' is-dropped' : ''));
          ov.setAttribute('rx', 2);
        }
      });
    }

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      tail.classList.toggle('is-hidden', k !== 1);
      // the dependency arc: intact at 0, gone at 1 (the tail is not indexed), cut at 2, whole from 3
      arc.classList.toggle('is-hidden', k === 1);
      arc.classList.toggle('is-cut', k === 2);
      brokenArc.classList.toggle('is-hidden', k !== 2);
      drawRows(k);
      if (k === 0) {
        strat.textContent = labels.s0strat || 'a document four times longer than the window';
        bill1.textContent = thou(docT) + ' ' + (labels.tokens || 'tokens') + '  ·  ' +
          (labels.window || 'model window') + ' ' + thou(lMax);
        bill2.textContent = '';
      } else if (k === 1) {
        strat.textContent = labels.s1strat || 'strategy 1 — truncate';
        bill1.textContent = (labels.covered || 'covered:') + ' ' + thou(lMax) + ' / ' + thou(docT);
        bill2.textContent = labels.s1note || 'the answer-chunk at 14 000 is never indexed at all';
      } else if (k === 2) {
        strat.textContent = labels.s2strat || 'strategy 2 — cut naively (ω = 0)';
        bill1.textContent = (labels.encoded || 'tokens encoded:') + ' ' + thou(docT) +
          '  ·  ' + (labels.overheadTag || 'overhead:') + ' 0';
        bill2.textContent = labels.s2note || 'but the seam severs the dependency all over again';
      } else if (k === 3) {
        strat.textContent = (labels.s3strat || 'strategy 3 — long late chunking') +
          ' (ω = ' + om + ', stride = ' + thou(lMax) + ' − ' + om + ' = ' + thou(stride) + ')';
        bill1.textContent = nMacro + ' ' + (labels.macro || 'macro-chunks') + '  ·  ' +
          (labels.starts || 'starts:') + ' ' + starts.map(thou).join(' · ');
        bill2.textContent = labels.s3note || 'the token at the seam reads across it — the arc holds';
      } else {
        strat.textContent = labels.s4strat || 'line 14 — discard the overlap embeddings';
        bill1.textContent = (labels.encoded || 'tokens encoded:') + ' ' + thou(encoded) + '  ·  ' +
          (labels.overheadTag || 'overhead:') + ' ' + thou(overhead) + ' = (' + nMacro + ' − 1) × ' + om;
        bill2.textContent = labels.s4note || 'every token is indexed exactly once; the tax is ω per seam';
      }
      host.dataset.phase = k >= 3 ? 'longlate' : 'naive';
    };
  },
});
