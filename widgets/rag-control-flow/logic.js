/* rag-control-flow/logic.js — L10 'self-correcting RAG' beat: a directed DECISION-GRAPH for CRAG and
   self-RAG. Naive RAG retrieves once and trusts it; self-correcting RAG adds GATES that grade the
   retrieval and branch.

     CRAG (Yan et al. 2024): retrieve → a retrieval evaluator GRADES each doc {correct / ambiguous /
       wrong} (a decision DIAMOND with toy score thresholds) → branch:
         correct   → use the retrieved context as-is               (the good path, green)
         ambiguous → combine retrieved + corrective web search     (refine)
         wrong     → discard, fall back to web search / rewrite     (fallback)
     self-RAG (Asai et al. ICLR 2024): the LM emits REFLECTION TOKENS — Retrieve? · IsRel · IsSup ·
       IsUse — as a chain of decision diamonds gating retrieval and self-critique.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll — deck arrow keys and the Book
   Scrollama both call setStep(k). Grades / thresholds / actions / reflection tokens all come from
   data/l10-selfrag.json (descriptive, gen_l10); all human text from i18n `labels`. Built on
   _widget-base.js. NOTHING but the title shows at step 0 beyond the first node — the flow path is walked
   progressively so the step-progression gate sees a real reveal.

   Steps (maxStep = 4):
     0  → CRAG: the retrieve node + the grade diamond appear.                                       s0
     1  → the three graded branches fan out (correct / ambiguous / wrong) with their threshold tags. s1
     2  → each branch's ACTION box appears (use as-is / +web search / discard→web).                  s2
     3  → self-RAG: the reflection-token diamonds appear (Retrieve? · IsRel · IsSup).                s3
     4  → the final IsUse gate + the grounded answer.                                                s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountRagControlFlow = defineWidget({
  id: 'rag-control-flow',
  rootClass: 'rcf-root',
  exportName: 'mountRagControlFlow',
  maxStep: 4,
  render({ host, data, labels, el }) {
    data = data || {};                          // defensive: a mis-wired mount must not throw
    const crag = data.crag || {};
    const selfRag = data.selfRag || {};
    const grades = crag.grades || ['correct', 'ambiguous', 'wrong'];
    const thr = crag.thresholds || {};
    const acts = crag.actions || {};
    const tokens = selfRag.reflectionTokens || ['Retrieve', 'IsRel', 'IsSup', 'IsUse'];

    const W = 540;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg rcf-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'rcf-ar', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'rcf-arhead' }, mk);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // wrap a string into ≤maxChars greedy-by-word lines so the full action text fits a node box
    // (we WRAP rather than slice — 'web search' vs 'query rewrite' is the teaching contrast and
    // must survive; slicing at 27 chars used to cut exactly that distinguishing tail).
    function wrapLines(s, maxChars) {
      const words = String(s || '').split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        if (!cur) { cur = w; continue; }
        if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
        else { lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      return lines;
    }

    // ── primitive shapes ──
    function box(name, x, y, w, h, txt, cls) {
      const g = el('g', { class: 'rcf-node' }, svg);
      add(name, g);
      el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 8, class: 'rcf-box ' + (cls || '') }, g);
      el('text', { x, y: y + 4, class: 'rcf-boxtxt', 'text-anchor': 'middle' }, g).textContent = txt;
      return { x, y, w, h, g };
    }
    // a box whose text is WRAPPED onto centred lines (for the multi-word action boxes)
    function boxWrap(name, x, y, w, h, txt, cls, maxChars) {
      const g = el('g', { class: 'rcf-node' }, svg);
      add(name, g);
      el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 8, class: 'rcf-box ' + (cls || '') }, g);
      const lines = wrapLines(txt, maxChars || 24);
      const lh = 13, startY = y - ((lines.length - 1) * lh) / 2 + 4;
      lines.forEach((ln, i) => {
        el('text', { x, y: startY + i * lh, class: 'rcf-boxtxt', 'text-anchor': 'middle' }, g).textContent = ln;
      });
      return { x, y, w, h, g };
    }
    function diamond(name, x, y, w, h, txt, cls) {
      const g = el('g', { class: 'rcf-node' }, svg);
      add(name, g);
      el('path', { d: `M${x} ${y - h / 2} L${x + w / 2} ${y} L${x} ${y + h / 2} L${x - w / 2} ${y} Z`,
        class: 'rcf-diamond ' + (cls || '') }, g);
      el('text', { x, y: y + 4, class: 'rcf-diatxt', 'text-anchor': 'middle' }, g).textContent = txt;
      return { x, y, w, h, g };
    }
    // arrow between two points, with an optional edge label.
    function arrow(name, x1, y1, x2, y2, lbl, lblcls) {
      add(name, el('line', { x1, y1, x2, y2, class: 'rcf-arrow', 'marker-end': 'url(#rcf-ar)' }, svg));
      if (lbl) {
        add(name, el('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 4, class: 'rcf-edgelbl ' + (lblcls || ''),
          'text-anchor': 'middle' }, svg)).textContent = lbl;
      }
    }
    const bot = (n) => n.y + n.h / 2;
    const top = (n) => n.y - n.h / 2;

    // ════════════════ CRAG column (top half) ════════════════
    // STEP 0: the CRAG section title + retrieve node + grade diamond
    layer('s0', 0);
    add('s0', el('text', { x: 14, y: 18, class: 'rcf-secttl' }, svg))
      .textContent = labels.cragTitle || 'CRAG · grade the retrieval, then act';
    const nRetrieve = box('s0', W / 2, 46, 130, 30, labels.retrieve || 'retrieve', 'rcf-accent');
    const nGrade = diamond('s0', W / 2, 110, 150, 56, labels.grade || 'grade each doc', 'rcf-judge');
    arrow('s0', nRetrieve.x, bot(nRetrieve), nGrade.x, top(nGrade));

    // STEP 1: the three graded branches
    layer('branches', 1);
    const colX = [W * 0.18, W * 0.5, W * 0.82];
    const branchY = 188;
    const gradeCls = { correct: 'rcf-good', ambiguous: 'rcf-warm', wrong: 'rcf-bad' };
    const gradeNodes = grades.map((g, i) => {
      const n = box('branches', colX[i], branchY, 150, 34, g, gradeCls[g] || '');
      const lblcls = g === 'correct' ? 'rcf-edge-good' : (g === 'wrong' ? 'rcf-edge-bad' : 'rcf-edge-warm');
      // arrow from the grade diamond out to each branch — NOT labelled on the arrow: the three
      // threshold tags share one short fan-out and used to collide at their (near-coincident) midpoints.
      arrow('branches', nGrade.x, bot(nGrade), n.x, top(n));
      // place each threshold tag directly above its OWN branch box — the columns sit far apart
      // (0.18 / 0.5 / 0.82·W) so the tags never overlap; the style.css halo masks the arrow behind it.
      const tg = thr[g] ? `${labels[g] || g} ${thr[g]}` : (labels[g] || g);
      add('branches', el('text', { x: n.x, y: top(n) - 9, class: 'rcf-edgelbl ' + lblcls,
        'text-anchor': 'middle' }, svg)).textContent = tg;
      return n;
    });

    // STEP 2: each branch's action box — text WRAPPED (not sliced) so each branch's full
    // 'keep / +web-search / discard→rewrite' verdict stays legible (the teaching contrast).
    layer('actions', 2);
    const actY = 262, actH = 56;
    grades.forEach((g, i) => {
      const a = acts[g] || '';
      const n = boxWrap('actions', colX[i], actY, 162, actH, a, gradeCls[g] || '', 24);
      arrow('actions', gradeNodes[i].x, bot(gradeNodes[i]), n.x, top(n));
    });

    // ════════════════ self-RAG row (bottom half) ════════════════
    const srTtlY = actY + actH / 2 + 30;
    layer('selfrag', 3);
    add('selfrag', el('text', { x: 14, y: srTtlY, class: 'rcf-secttl' }, svg))
      .textContent = labels.selfRagTitle || 'self-RAG · reflection-token gates';

    // STEP 3: the first three reflection diamonds in a left→right chain
    const diaY = srTtlY + 46;
    // inset the chain to start at 70 / end at W-70 so the outer diamonds (half-width 48) keep
    // ≥22px margin to the frame edge — guards against a wider localized token clipping the viewBox.
    const diaInset = 70;
    const diaXs = tokens.map((_, i) => diaInset + i * ((W - 2 * diaInset) / Math.max(1, tokens.length - 1)));
    const tokGate = selfRag.gates || {};
    const diaNodes = [];
    tokens.forEach((t, i) => {
      const lname = i < tokens.length - 1 ? 'selfrag' : 'finish';   // last token (IsUse) waits for step 4
      if (i === tokens.length - 1) layer('finish', 4);
      const lbl = t.replace(/^Is/, 'Is·');                         // IsRel → Is·Rel for readability
      const n = diamond(lname, diaXs[i], diaY, 96, 50, lbl, 'rcf-judge');
      diaNodes.push(n);
      if (i > 0) {
        const prev = diaNodes[i - 1];
        arrow(lname, prev.x + prev.w / 2, prev.y, n.x - n.w / 2, n.y, labels.pass || 'pass');
      }
    });

    // STEP 4: the grounded answer after the last gate
    const ansY = diaY + 70;
    const nAnswer = box('finish', W / 2, ansY, 200, 34, labels.answer || 'grounded answer', 'rcf-good');
    arrow('finish', diaNodes[diaNodes.length - 1].x, bot(diaNodes[diaNodes.length - 1]), nAnswer.x, top(nAnswer));

    const H = frameHeightFor(ansY + 24, 14);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
