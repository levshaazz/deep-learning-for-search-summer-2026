/* rag-pipeline/logic.js — L7 'the cascade in a real product' beat. The full retrieval+RAG pipeline as one
   left→right flow split by a build-time / query-time divider:
     OFFLINE (once):  ingest → chunk → embed → index
     ONLINE (per query): retrieve → rerank → assemble → generate
   The neural cascade (Scouts retrieve → Judges rerank) lives inside the online half; the LLM reads the
   reranked context and answers WITH citations (grounding) — that is RAG.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll — deck arrow keys and Book Scrollama both
   call setStep(k). Stage list comes from data/l7-rag.json; all human labels from i18n `labels`. Built on
   widgets/_widget-base.js.

   Steps (maxStep = 3):
     0  → OFFLINE build chain: ingest → chunk → embed → index (amortized once over the corpus).  s0
     1  → ONLINE query chain appears + the query drops in + index feeds retrieve.                 s1
     2  → highlight the cascade inside online: Scouts retrieve, Judges rerank.                    s2
     3  → the LLM generates a grounded answer with citations — RAG.                               s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountRagPipeline = defineWidget({
  id: 'rag-pipeline',
  rootClass: 'rag-root',
  exportName: 'mountRagPipeline',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const offline = (data.offline || []).map((s) => s.id);
    const online = (data.online || []).map((s) => s.id);
    const seq = offline.concat(online);
    const nOff = offline.length;
    const N = seq.length;

    const txt = (id) => labels[id] || id;
    const roleOf = (id) => ({ retrieve: 'scout', rerank: 'judge', generate: 'llm', index: 'index' }[id] || 'stage');

    const W = 760, PAD = 20, GAP = 12, ROWY = 104, BOXH = 66;
    const boxW = (W - 2 * PAD - (N - 1) * GAP) / N;
    const boxX = (i) => PAD + i * (boxW + GAP);
    const cx = (i) => boxX(i) + boxW / 2;

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg rag-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const defs = el('defs', {}, svg);
    const m = el('marker', { id: 'rag-ar', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'rag-arhead' }, m);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // a pipeline box + its label; arrow to the previous box in the same half.
    function drawBox(name, i) {
      const id = seq[i], x = boxX(i);
      add(name, el('rect', { x, y: ROWY, width: boxW, height: BOXH, rx: 9,
        class: 'rag-box rag-' + roleOf(id) }, svg));
      add(name, el('text', { x: cx(i), y: ROWY + BOXH / 2 + 5, class: 'rag-boxtxt rag-boxtxt-' + roleOf(id),
        'text-anchor': 'middle' }, svg)).textContent = txt(id);
    }
    function arrowBetween(name, i) {                 // arrow from box i-1 → box i (same half)
      add(name, el('line', { x1: boxX(i) - GAP + 1, y1: ROWY + BOXH / 2, x2: boxX(i) - 2, y2: ROWY + BOXH / 2,
        class: 'rag-arrow', 'marker-end': 'url(#rag-ar)' }, svg));
    }

    // ── STEP 0: OFFLINE half ──
    layer('offline', 0);
    add('offline', el('text', { x: cx(0) + (cx(nOff - 1) - cx(0)) / 2, y: 40, class: 'rag-band rag-band-off',
      'text-anchor': 'middle' }, svg)).textContent = labels.bandOffline || 'OFFLINE · build-time (once)';
    for (let i = 0; i < nOff; i++) { drawBox('offline', i); if (i > 0) arrowBetween('offline', i); }

    // ── STEP 1: divider + ONLINE half + the query dropping into retrieve + index→retrieve hand-off ──
    layer('online', 1);
    const divX = boxX(nOff) - GAP / 2;
    add('online', el('line', { x1: divX, y1: 30, x2: divX, y2: ROWY + BOXH + 14, class: 'rag-div' }, svg));
    add('online', el('text', { x: cx(nOff) + (cx(N - 1) - cx(nOff)) / 2, y: 40, class: 'rag-band rag-band-on',
      'text-anchor': 'middle' }, svg)).textContent = labels.bandOnline || 'ONLINE · query-time (per request)';
    for (let i = nOff; i < N; i++) { drawBox('online', i); if (i > nOff) arrowBetween('online', i); }
    // index (last offline) → retrieve (first online), across the divider
    add('online', el('line', { x1: boxX(nOff - 1) + boxW, y1: ROWY + BOXH / 2, x2: boxX(nOff) - 2, y2: ROWY + BOXH / 2,
      class: 'rag-arrow rag-arrow-bridge', 'marker-end': 'url(#rag-ar)' }, svg));
    // the query pill drops into retrieve from above
    const qx = cx(nOff), qw = Math.min(96, boxW + 12);
    add('online', el('rect', { x: qx - qw / 2, y: 56, width: qw, height: 26, rx: 13, class: 'rag-query' }, svg));
    add('online', el('text', { x: qx, y: 73, class: 'rag-querytxt', 'text-anchor': 'middle' }, svg))
      .textContent = labels.query || 'query';
    add('online', el('line', { x1: qx, y1: 82, x2: qx, y2: ROWY - 2, class: 'rag-arrow', 'marker-end': 'url(#rag-ar)' }, svg));

    // ── STEP 2: the cascade (retrieve + rerank) ──
    layer('cascade', 2);
    const ri = seq.indexOf('retrieve'), ki = seq.indexOf('rerank');
    if (ri >= 0 && ki >= 0) {
      const x0 = boxX(Math.min(ri, ki)) - 4, x1 = boxX(Math.max(ri, ki)) + boxW + 4;
      add('cascade', el('rect', { x: x0, y: ROWY - 5, width: x1 - x0, height: BOXH + 10, rx: 11,
        class: 'rag-ring', fill: 'none' }, svg));
      add('cascade', el('text', { x: (x0 + x1) / 2, y: ROWY + BOXH + 26, class: 'rag-tag rag-tag-cascade',
        'text-anchor': 'middle' }, svg)).textContent = labels.cascadeTag || 'the neural cascade';
    }

    // ── STEP 3: grounded answer + citations (RAG) — ring the generator, tag BELOW it (right edge is full) ──
    layer('rag', 3);
    const gi = seq.indexOf('generate');
    if (gi >= 0) {
      add('rag', el('rect', { x: boxX(gi) - 4, y: ROWY - 5, width: boxW + 8, height: BOXH + 10, rx: 11,
        class: 'rag-ring rag-ring-gen', fill: 'none' }, svg));
      add('rag', el('text', { x: W - PAD, y: ROWY + BOXH + 26, class: 'rag-tag rag-tag-answer', 'text-anchor': 'end' }, svg))
        .textContent = labels.answerTag || '→ grounded + cited';
    }

    const H = frameHeightFor(ROWY + BOXH + 36, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
