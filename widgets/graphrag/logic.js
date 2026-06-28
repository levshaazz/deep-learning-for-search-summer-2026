/* graphrag/logic.js — L12 'multi-hop / GraphRAG' beat: a small entity graph showing that a single-hop
   retrieval FAILS a 2-hop question while a graph traversal reaches the answer.

   The question — "What field did the founder of Acme Corp study?" — needs two hops: Acme Corp is
   founded_by Dana Reyes (doc d1), and Dana Reyes studied computer science (doc d2). No single retrieved
   doc holds both the founder AND a field of study, so top-1 (d1) lands recall 0. Build the graph from
   data.triples, chain the two path edges, and reach the answer node "computer science" → recall 1.

   DRIVER-AGNOSTIC: setStep(k)/maxStep; binds NO keyboard and NO scroll — deck arrow keys and the Book
   Scrollama both call setStep(k). EVERY entity/relation label is read from data.triples (never hardcoded
   here); every number comes from data/l12-graphrag.json (facts-gated, gen_l12). All human text from the
   i18n `labels` (en+ru+tt). Built on _widget-base.js + _plot-util.js. GREEN marks ONLY the answer node +
   the winning multi-hop path; RED marks the failed single-hop. Nothing is fully lit at step 0.

   Steps (maxStep = 5):
     0 → the question + the three source docs (d1/d2/d3) as small cards; entity nodes placed, edges faint. s0
     1 → single-hop attempt: light the best single doc (d1) red — it names the founder but no field → recall 0. s1
     2 → the PATH edges/nodes appear first (Acme Corp → Dana Reyes → computer science) — the chain that
         answers the question, extracted from d1+d2.                                                     s2
     3 → the remaining CONTEXT edges/nodes fill in (headquartered_in, studied_at, located_in) — the rest
         of the graph the extractor lifted.                                                              s3
     4 → traverse the 2-hop path green → answer node, recall 1.                                          s4
     5 → a 'real' badge: llama3.1:8b extracted N triples and traversed to the derived answer.            s5 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountGraphrag = defineWidget({
  id: 'graphrag',
  rootClass: 'gr-root',
  exportName: 'mountGraphrag',
  maxStep: 5,
  render({ host, data, labels, el }) {
    const d = data || {};
    const docs = d.docs || [];
    const triples = d.triples || [];
    const path = d.path || [];
    const answerNode = d.answerNode || '';
    const singleHopDoc = d.singleHopDoc || '';
    const real = d.real || {};

    const W = 560;

    // ── hand-chosen entity coordinates (deliberate layout, never auto-laid-out into overlaps) ──
    // Acme Corp top-left · Dana Reyes center · computer science (answer) lower-left · MIT right ·
    // Portland top-right · Cambridge lower-right. Boxes + their text never overlap; edges never cross
    // through a box's text (the relation labels are offset off the edge midpoint with a white halo).
    const POS = {
      'Acme Corp':        { x: 120, y: 250, w: 130, h: 38 },
      'Dana Reyes':       { x: 300, y: 330, w: 130, h: 38 },
      'computer science': { x: 130, y: 408, w: 156, h: 38 },
      'MIT':              { x: 462, y: 330, w: 96,  h: 38 },
      'Portland':         { x: 462, y: 250, w: 116, h: 38 },
      'Cambridge':        { x: 462, y: 408, w: 116, h: 38 },
    };
    // node-side anchors so an edge meets a box border (not its center) without crossing the text.
    const anchor = (n, tx, ty) => {
      const dx = tx - n.x, dy = ty - n.y;
      if (dx === 0 && dy === 0) return { x: n.x, y: n.y };
      const sx = (n.w / 2) / Math.max(1e-6, Math.abs(dx));
      const sy = (n.h / 2) / Math.max(1e-6, Math.abs(dy));
      const s = Math.min(sx, sy);
      return { x: n.x + dx * s, y: n.y + dy * s };
    };

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg gr-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const defs = el('defs', {}, svg);
    // two arrow markers so a traversed (green) edge keeps a coloured head independent of the base edge.
    [['gr-ar', 'gr-arhead'], ['gr-ar-win', 'gr-arhead-win']].forEach(([id, cls]) => {
      const mk = el('marker', { id, viewBox: '0 0 10 10', refX: '8.5', refY: '5',
        markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, mk);
    });

    // ════════════════ the question (always shown) ════════════════
    el('text', { x: 16, y: 22, class: 'gr-qhead' }, svg).textContent = labels.questionHead || 'question';
    const qWrap = el('text', { x: 16, y: 41, class: 'gr-qtext' }, svg);
    const qstr = d.question || '';
    qWrap.textContent = qstr.length > 70 ? qstr.slice(0, 67) + '…' : qstr;
    const hopsTag = el('text', { x: W - 16, y: 41, class: 'gr-hopstag', 'text-anchor': 'end' }, svg);
    hopsTag.textContent = `${labels.hopsLabel || 'hops needed'}: ${d.hops != null ? d.hops : ''}`;

    // ════════════════ the three source documents (small cards) ════════════════
    const docTop = 58, docH = 56, docGap = 12, docW = (W - 32 - 2 * docGap) / 3;
    el('text', { x: 16, y: docTop - 4, class: 'gr-sectlbl' }, svg)
      .textContent = labels.docsHead || 'retrieved documents';
    const docEls = {};
    docs.forEach((doc, i) => {
      const x = 16 + i * (docW + docGap);
      const g = el('g', { class: 'gr-doc' }, svg);
      el('rect', { x, y: docTop, width: docW, height: docH, rx: 6, class: 'gr-doc-box' }, g);
      el('text', { x: x + 8, y: docTop + 16, class: 'gr-doc-id' }, g).textContent = String(doc.id || '').toUpperCase();
      // wrap the doc text onto two short lines so nothing clips outside the card.
      // greedy: fill line0 until the next word would exceed cap, then spill onto line1;
      // if line1 also overflows, truncate it with an ellipsis (don't silently drop words).
      const words = String(doc.text || '').split(/\s+/).filter(Boolean);
      const lines = ['', ''];
      const cap = 22;
      let li = 0;
      for (let wi = 0; wi < words.length; wi++) {
        const w = words[wi];
        const cand = lines[li] ? lines[li] + ' ' + w : w;
        if (cand.length <= cap) { lines[li] = cand; continue; }
        if (li === 0) { li = 1; lines[1] = w.length <= cap ? w : w.slice(0, cap - 1) + '…'; continue; }
        // line1 is full and more words remain → mark truncation and stop.
        lines[1] = lines[1].length <= cap - 1 ? lines[1] + '…' : lines[1].slice(0, cap - 1) + '…';
        break;
      }
      el('text', { x: x + 8, y: docTop + 32, class: 'gr-doc-txt' }, g).textContent = lines[0];
      el('text', { x: x + 8, y: docTop + 46, class: 'gr-doc-txt' }, g).textContent = lines[1];
      // a verdict tag drawn but hidden until the single-hop step lights it.
      const tag = el('text', { x: x + docW - 8, y: docTop + 16, class: 'gr-doc-tag', 'text-anchor': 'end' }, g);
      docEls[doc.id] = { g, tag };
    });

    // ════════════════ the entity graph ════════════════
    const graphTop = docTop + docH + 14;
    el('text', { x: 16, y: graphTop + 6, class: 'gr-sectlbl' }, svg)
      .textContent = labels.graphHead || 'entity graph';

    // edges first (under the nodes). Each carries its relation label, offset off the edge with a halo.
    const edgeEls = triples.map((t) => {
      const [subj, rel, obj] = t;
      const ns = POS[subj], no = POS[obj];
      const g = el('g', { class: 'gr-edge' }, svg);
      let a = { x: 0, y: 0 }, b = { x: 0, y: 0 };
      if (ns && no) {
        a = anchor(ns, no.x, no.y);
        b = anchor(no, ns.x, ns.y);
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'gr-edge-line', 'marker-end': 'url(#gr-ar)' }, g);
      }
      // relation label: at the edge midpoint, nudged perpendicular to the line, with a white halo so
      // it stays readable where it would otherwise sit on the stroke. Positions are COMPUTED here and
      // de-collided below (the text is drawn after) so two midpoint labels can never overprint.
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const ex = b.x - a.x, ey = b.y - a.y;
      const len = Math.max(1e-6, Math.hypot(ex, ey));
      // push the label farther off SHORT edges so it clears the node band instead of being
      // overrun by an adjacent box (e.g. the short Dana→MIT 'studied at' label tucking under MIT).
      const off = len < 90 ? 9 + (90 - len) * 0.6 : 9;
      const text = String(rel || '').replace(/_/g, ' ');
      return { g, subj, rel, obj, text, lx: mx - (ey / len) * off, ly: my + (ex / len) * off };
    });
    // AUTO-LAYOUT (the placeLabels idea applied to edge-midpoint labels): relax any two relation
    // labels that overlap horizontally apart in y, so an overprint cannot be authored even when two
    // edges route their offset labels close (e.g. 'studied at' vs 'located in'). Pure number relaxation.
    const GMINGAP = 15, GCHARW = 5.6;
    for (let it = 0; it < 80; it++) {
      for (let i = 0; i < edgeEls.length; i++) for (let j = i + 1; j < edgeEls.length; j++) {
        const A = edgeEls[i], B = edgeEls[j];
        // two middle-anchored labels overlap in x iff |lx_A - lx_B| < (wA + wB)/2
        const sumHalfW = (A.text.length + B.text.length) * GCHARW / 2 + 3;
        if (Math.abs(A.lx - B.lx) > sumHalfW) continue;         // no horizontal overlap → leave them
        const oy = GMINGAP - Math.abs(A.ly - B.ly);
        if (oy > 0) { const d = A.ly <= B.ly ? -1 : 1; A.ly += d * (oy / 2 + 0.3); B.ly -= d * (oy / 2 + 0.3); }
      }
    }
    edgeEls.forEach((e) => {
      el('text', { x: e.lx, y: e.ly + 3, class: 'gr-edge-lbl', 'text-anchor': 'middle' }, e.g)
        .textContent = e.text;
    });

    // nodes on top.
    const nodeEls = {};
    Object.keys(POS).forEach((name) => {
      const n = POS[name];
      const g = el('g', { class: 'gr-node' + (name === answerNode ? ' is-answer' : '') }, svg);
      el('rect', { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h, rx: 8, class: 'gr-node-box' }, g);
      el('text', { x: n.x, y: n.y + 4, class: 'gr-node-txt', 'text-anchor': 'middle' }, g).textContent = name;
      nodeEls[name] = g;
    });

    // ── recall readouts (single-hop ✗ / multi-hop ✓), revealed with their steps ──
    const recallY = POS['computer science'].y + 44;
    const recSingle = el('g', { class: 'gr-recall is-hidden' }, svg);
    el('text', { x: 16, y: recallY, class: 'gr-rec-bad' }, recSingle).textContent = '✗';
    el('text', { x: 34, y: recallY, class: 'gr-rec-bad-txt' }, recSingle)
      .textContent = `${labels.recallSingle || 'single-hop recall'}: ${d.recallSingleHop != null ? d.recallSingleHop : ''}`;

    const recMulti = el('g', { class: 'gr-recall is-hidden' }, svg);
    el('text', { x: 16, y: recallY + 20, class: 'gr-rec-ok' }, recMulti).textContent = '✓';
    el('text', { x: 34, y: recallY + 20, class: 'gr-rec-ok-txt' }, recMulti)
      .textContent = `${labels.recallMulti || 'multi-hop recall'}: ${d.recallMultiHop != null ? d.recallMultiHop : ''}`;

    // ════════════════ the 'real' badge (step 4) ════════════════
    const badgeY = recallY + 38;
    const badge = el('g', { class: 'gr-badge is-hidden' }, svg);
    el('rect', { x: 16, y: badgeY, width: W - 32, height: 48, rx: 8, class: 'gr-badge-box' }, badge);
    el('text', { x: 28, y: badgeY + 19, class: 'gr-badge-ttl' }, badge)
      .textContent = `${labels.realHead || 'real run'} · ${real._model || ''}`;
    el('text', { x: 28, y: badgeY + 38, class: 'gr-badge-txt' }, badge)
      .textContent = `${labels.realExtracted || 'extracted'} ${real.nTriplesExtracted != null ? real.nTriplesExtracted : ''} `
        + `${labels.realTriples || 'triples'} → ${labels.realTraversed || 'traversed to'} “${real.derivedAnswer || ''}”`;
    el('text', { x: W - 28, y: badgeY + 19, class: 'gr-badge-note', 'text-anchor': 'end' }, badge)
      .textContent = labels.communityNote || 'GraphRAG also pre-summarises graph communities';

    const H = frameHeightFor(badgeY + 48, 14);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // which triples are on the winning 2-hop path (compare by subj+rel+obj, NOT by hardcoded names).
    const onPath = (e) => path.some((p) => p[0] === e.subj && p[1] === e.rel && p[2] === e.obj);
    const pathNodes = new Set();
    path.forEach((p) => { pathNodes.add(p[0]); pathNodes.add(p[2]); });

    return function update(k) {
      // step 1 — single-hop: light d1 red (names the founder, no field of study) → recall 0.
      const single = k >= 1;
      Object.keys(docEls).forEach((id) => {
        const isPicked = id === singleHopDoc;
        docEls[id].g.classList.toggle('is-picked-bad', single && isPicked);
        docEls[id].g.classList.toggle('is-dim', single && !isPicked);
        docEls[id].tag.textContent = single && isPicked ? '✗ ' + (labels.noField || 'no field') : '';
      });
      recSingle.classList.toggle('is-hidden', k < 1);

      // step 2 — the PATH edges/nodes appear first (the chain that answers the question); step 3 — the
      // remaining CONTEXT edges/nodes fill in. They are genuinely revealed (is-hidden before their step),
      // so the step-progression gate sees a real per-step reveal, not an opacity tween of present marks.
      const graphOn = k >= 2;                 // any graph element is on once we start building
      svg.classList.toggle('gr-graph-on', graphOn);
      edgeEls.forEach((e) => {
        const shown = onPath(e) ? k >= 2 : k >= 3;   // path edges at step 2, context edges at step 3
        e.g.classList.toggle('is-hidden', !shown);
      });
      Object.keys(nodeEls).forEach((name) => {
        const shown = pathNodes.has(name) ? k >= 2 : k >= 3; // path nodes at step 2, context nodes at 3
        nodeEls[name].classList.toggle('is-hidden', !shown);
      });

      // step 4 — traverse the 2-hop path green; light the answer node; show multi-hop recall 1.
      const traversed = k >= 4;
      edgeEls.forEach((e) => e.g.classList.toggle('is-win', traversed && onPath(e)));
      Object.keys(nodeEls).forEach((name) => {
        nodeEls[name].classList.toggle('is-on-path', traversed && pathNodes.has(name));
        nodeEls[name].classList.toggle('is-answer-lit', traversed && name === answerNode);
      });
      recMulti.classList.toggle('is-hidden', k < 4);

      // step 5 — the real-run badge.
      badge.classList.toggle('is-hidden', k < 5);
    };
  },
});
