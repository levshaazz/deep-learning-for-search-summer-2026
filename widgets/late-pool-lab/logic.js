/* late-pool-lab/logic.js — L16 "where do you cut: before attention or after?".

   WHY THIS EXISTS: the deck asserts six times that "attention writes Berlin into the pronoun's vector
   BEFORE pooling". A student reads that as an incantation. This widget shows the GEOMETRY: with the
   chunk boundary, the model and the number of output vectors all held fixed, the chunk's vector
   physically TURNS toward the query the moment the wall between the chunks falls. That cannot be
   written in a sentence and cannot be drawn as a still — it needs motion at constant boundaries.

   ONE RULE, APPLIED TWICE (data/l16-chunk.json → pool, generator _research/gen_l16.py):
   a token's contextual vector ϑ is the average of the tokens it may READ.
     • naive — chunk B is encoded alone → ϑ = mean{Its, residents}      = (0, 2), cos(q,·) = 0
     • late  — the whole document is encoded → ϑ = mean{all four}        = (1, 1), cos(q,·) = 0.7071
   The vector also gets SHORTER (2 → √2): reading more spreads the average thinner. That is the very
   dilution that makes late chunking lose on Needle-in-a-Haystack — the failure mode is already in the toy.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. EVERY number comes from
   data/l16-chunk.json → pool; every string from i18n.json. Built on widgets/_widget-base.js.

   Steps (maxStep = 5):
     0 → the document, the chunk boundary, the wall.                                          s0
     1 → naive: chunk B is encoded alone → chunk vector (0,2), cos = 0.                        s1
     2 → the wall falls: the arcs from "Its"/"residents" reach "Berlin".                       s2
     3 → late: every token of chunk B now averages the whole document → ϑ = (1,1).             s3
     4 → pool the SAME segment → the chunk vector turns to the query, cos = 0.7071.            s4
     5 → both vectors at once: same boundary, same model — only the moment of pooling moved.   s5 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

const W = 620;
const TOK_Y = 74, TOK_H = 46, TOK_W = 120, TOK_GAP = 14, TOK_X0 = 34;
const PLANE = { x: 86, y: 208, w: 216, h: 216 };   // 2-D reading plane (origin at its bottom-left)
const UNIT = PLANE.h / 2.5;                        // px per axis unit (domain 0…2.5)

export const mountLatePoolLab = defineWidget({
  id: 'late-pool-lab',
  rootClass: 'lpl-root',
  exportName: 'mountLatePoolLab',
  maxStep: 5,
  render({ host, data, labels, el }) {
    const P = (data && data.pool) || {};
    const tokens = P.tokens || ['Berlin', 'is', 'Its', 'residents'];
    const values = P.values || [[4, 0], [0, 0], [0, 0], [0, 4]];
    const bnd = typeof P.boundary === 'number' ? P.boundary : 2;
    const q = P.query || [1, 0];
    const vNaive = P.naiveChunkVec || [0, 2];
    const vLate = P.lateChunkVec || [1, 1];
    const cosNaive = typeof P.naiveCos === 'number' ? P.naiveCos : 0;
    const cosLate = typeof P.lateCos === 'number' ? P.lateCos : 0.7071;

    const n = tokens.length;
    const tx = (i) => TOK_X0 + i * (TOK_W + TOK_GAP);
    const tcx = (i) => tx(i) + TOK_W / 2;
    const pair = (v) => '(' + fmtN(v[0]) + ', ' + fmtN(v[1]) + ')';
    function fmtN(x) { return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100); }
    // decimal separator follows the page language (RU/TT use a comma) — §2 of narrative/style-ru.md
    const dec = () => {
      const l = (typeof document !== 'undefined' && document.documentElement &&
                 (document.documentElement.dataset.lang || document.documentElement.lang || 'en')).slice(0, 2);
      return (l === 'ru' || l === 'tt') ? ',' : '.';
    };
    const cos4 = (x) => x.toFixed(4).replace('.', dec());

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg lpl-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── layer bookkeeping: a named group of nodes revealed from step `from` ──────────────────────
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── 1 · the document ribbon ─────────────────────────────────────────────────────────────────
    layer('doc', 0);
    add('doc', el('text', { x: TOK_X0, y: 26, class: 'lpl-head' }, svg))
      .textContent = labels.docHead || 'one document, one boundary';
    const tokVals = [];                                   // the (x, y) under each token — REWRITTEN at step 3
    for (let i = 0; i < n; i++) {
      const isB = i >= bnd;
      const cls = 'lpl-tok ' + (isB ? 'is-chunkb' : 'is-chunka') +
        (values[i][0] === 0 && values[i][1] === 0 ? ' is-empty' : '');
      add('doc', el('rect', { x: tx(i), y: TOK_Y, width: TOK_W, height: TOK_H, rx: 7, class: cls }, svg));
      add('doc', el('text', { x: tcx(i), y: TOK_Y + 21, class: 'lpl-toklbl', 'text-anchor': 'middle' }, svg))
        .textContent = tokens[i];
      tokVals.push(add('doc', el('text', { x: tcx(i), y: TOK_Y + 38, class: 'lpl-tokval', 'text-anchor': 'middle' }, svg)));
      tokVals[i].textContent = pair(values[i]);
    }
    // chunk brackets under the ribbon
    const brk = (i0, i1, key, fallback) => {
      const x0 = tx(i0), x1 = tx(i1) + TOK_W, y = TOK_Y + TOK_H + 12;
      add('doc', el('path', { d: `M${x0} ${y - 6} L${x0} ${y} L${x1} ${y} L${x1} ${y - 6}`, class: 'lpl-brk' }, svg));
      add('doc', el('text', { x: (x0 + x1) / 2, y: y + 16, class: 'lpl-brklbl', 'text-anchor': 'middle' }, svg))
        .textContent = labels[key] || fallback;
    };
    brk(0, bnd - 1, 'chunkA', 'chunk A');
    brk(bnd, n - 1, 'chunkB', 'chunk B');

    /* STEP 3 HAS TO DO SOMETHING (2026-08, slide-viz STEP-PROG HARD: "dead step 3 — identical to step 2,
       31→31 marks, nothing revealed or moved"). The wall falls at step 2 and the arcs open; step 3 was
       narrated as "now every token of chunk B averages the whole document" but drew NOTHING — the reader
       was told the contextual vectors changed and shown the same picture. Now they change on screen: the
       (x, y) printed under each chunk-B token is REWRITTEN from its raw value to ϑ (= the contextual
       vector, data → pool.lateChunkVec), and this line says why. Pooling happens one step later, at 4. */
    layer('ctx', 3);
    const ctxNote = add('ctx', el('text', { x: (tx(bnd) + tx(n - 1) + TOK_W) / 2, y: TOK_Y + TOK_H + 50,
      class: 'lpl-ctxnote', 'text-anchor': 'middle' }, svg));

    // ── 2 · the wall in the boundary (steps 0–1) and the attention arcs ──────────────────────────
    const wallX = tx(bnd) - TOK_GAP / 2;
    layer('wall', 0);
    add('wall', el('line', { x1: wallX, y1: TOK_Y - 30, x2: wallX, y2: TOK_Y + TOK_H + 6, class: 'lpl-wall' }, svg));
    // beside the wall line, not above it: at the bumped 15px label size the old centred spot
    // (y = TOK_Y − 36) collided with the head line — G13 flags that as a label overlap.
    add('wall', el('text', { x: wallX + 8, y: TOK_Y - 20, class: 'lpl-walllbl', 'text-anchor': 'start' }, svg))
      .textContent = labels.wall || 'the wall';

    // arcs: from each chunk-B token up and over to "Berlin" (token 0). Blocked ones stop at the wall.
    const arcs = [];
    for (let i = bnd; i < n; i++) {
      const from = tcx(i), to = tcx(0), top = TOK_Y - 22 - (i - bnd) * 12;
      const blocked = `M${from} ${TOK_Y - 4} Q${(from + wallX) / 2} ${top} ${wallX + 6} ${top + 6}`;
      const open = `M${from} ${TOK_Y - 4} Q${(from + to) / 2} ${top} ${to} ${TOK_Y - 4}`;
      layer('arc' + i, 0);
      arcs.push(add('arc' + i, el('path', { d: blocked, class: 'lpl-arc' }, svg)));
      arcs[arcs.length - 1].__blocked = blocked;
      arcs[arcs.length - 1].__open = open;
    }

    // ── 3 · the 2-D reading plane ───────────────────────────────────────────────────────────────
    const ox = PLANE.x, oy = PLANE.y + PLANE.h;                 // origin (bottom-left of the plane)
    const px = (v) => [ox + v[0] * UNIT, oy - v[1] * UNIT];
    layer('plane', 0);
    add('plane', el('rect', { x: PLANE.x, y: PLANE.y, width: PLANE.w, height: PLANE.h, rx: 6, class: 'lpl-plane' }, svg));
    add('plane', el('line', { x1: ox, y1: oy, x2: ox + PLANE.w, y2: oy, class: 'lpl-axis' }, svg));
    add('plane', el('line', { x1: ox, y1: oy, x2: ox, y2: PLANE.y, class: 'lpl-axis' }, svg));
    add('plane', el('text', { x: ox + PLANE.w, y: oy + 18, class: 'lpl-axislbl', 'text-anchor': 'end' }, svg))
      .textContent = labels.axisX || 'Berlin-ness';
    add('plane', el('text', { x: ox - 8, y: PLANE.y + 4, class: 'lpl-axislbl', 'text-anchor': 'end' }, svg))
      .textContent = labels.axisY || 'population';
    // the query ray q = (1,0)
    const qEnd = [ox + PLANE.w - 6, oy];
    add('plane', el('line', { x1: ox, y1: oy, x2: qEnd[0], y2: qEnd[1], class: 'lpl-qray' }, svg));
    add('plane', el('text', { x: qEnd[0], y: oy - 8, class: 'lpl-qlbl', 'text-anchor': 'end' }, svg))
      .textContent = (labels.query || 'query q') + ' = (' + q[0] + ', ' + q[1] + ')';

    // the two chunk-B vectors (naive stays visible from step 1; late appears at step 4)
    const [nx, ny] = px(vNaive), [lx, ly] = px(vLate);
    layer('vecNaive', 1);
    add('vecNaive', el('line', { x1: ox, y1: oy, x2: nx, y2: ny, class: 'lpl-vec is-naive' }, svg));
    add('vecNaive', el('circle', { cx: nx, cy: ny, r: 5, class: 'lpl-dot is-naive' }, svg));
    add('vecNaive', el('text', { x: nx + 10, y: ny - 6, class: 'lpl-veclbl is-naive' }, svg))
      .textContent = (labels.naiveTag || 'naive') + ' ' + pair(vNaive);
    layer('vecLate', 4);
    add('vecLate', el('line', { x1: ox, y1: oy, x2: lx, y2: ly, class: 'lpl-vec is-late' }, svg));
    add('vecLate', el('circle', { cx: lx, cy: ly, r: 5, class: 'lpl-dot is-late' }, svg));
    add('vecLate', el('text', { x: lx + 10, y: ly + 16, class: 'lpl-veclbl is-late' }, svg))
      .textContent = (labels.lateTag || 'late') + ' ' + pair(vLate);
    // the turn: an arc from the naive vector to the late one (step 5)
    layer('turn', 5);
    add('turn', el('path', { d: `M${nx} ${ny} Q${(nx + lx) / 2 + 26} ${(ny + ly) / 2 - 18} ${lx} ${ly}`,
      class: 'lpl-turn' }, svg));

    // ── 4 · the ledger to the right of the plane ─────────────────────────────────────────────────
    const LX = PLANE.x + PLANE.w + 34;
    const rowY = (i) => PLANE.y + 22 + i * 30;
    layer('ledger', 1);
    add('ledger', el('text', { x: LX, y: PLANE.y - 4, class: 'lpl-leghead' }, svg))
      .textContent = labels.ledgerHead || 'cos(q, chunk B)';
    const rN = add('ledger', el('text', { x: LX, y: rowY(0), class: 'lpl-legrow is-naive' }, svg));
    rN.textContent = (labels.naiveTag || 'naive') + ':  ' + cos4(cosNaive);
    const rL = add('ledger', el('text', { x: LX, y: rowY(1), class: 'lpl-legrow is-late' }, svg));
    const note = add('ledger', el('text', { x: LX, y: rowY(2) + 6, class: 'lpl-legnote' }, svg));
    const note2 = add('ledger', el('text', { x: LX, y: rowY(2) + 24, class: 'lpl-legnote' }, svg));

    const H = frameHeightFor(oy + 30, 10);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      // the wall stands until step 2; from there the arcs reach across it
      const walled = k < 2;
      for (const node of layers.wall.nodes) node.classList.toggle('is-hidden', !walled);
      arcs.forEach((a) => {
        a.setAttribute('d', walled ? a.__blocked : a.__open);
        a.classList.toggle('is-blocked', walled);
        a.classList.toggle('is-hidden', k < 1);
      });
      // the naive vector is the only one on the plane until the pool at step 4
      for (const node of layers.vecLate.nodes) node.classList.toggle('is-hidden', k < 4);
      rL.classList.toggle('is-hidden', k < 4);
      rL.textContent = (labels.lateTag || 'late') + ':  ' + cos4(cosLate);
      note.classList.toggle('is-hidden', k < 5);
      note2.classList.toggle('is-hidden', k < 5);
      note.textContent = labels.legNote || 'same boundary, same model';
      note2.textContent = labels.legNote2 || 'only the moment of pooling moved';
      // step 3 — the contextual rewrite: every chunk-B token now carries ϑ, the mean of all it may read.
      // (Chunk A keeps its RAW values on purpose: they are the inputs the arcs are carrying into B.)
      const ctxOn = k >= 3;
      for (let i = bnd; i < n; i++) {
        tokVals[i].textContent = ctxOn ? pair(vLate) : pair(values[i]);
        tokVals[i].classList.toggle('is-context', ctxOn);
      }
      // no number in this line ON PURPOSE — ϑ's value is printed inside the token boxes right above it.
      ctxNote.textContent = labels.ctxNote || 'each token of B now averages all four → ϑ';
      // chunk-A tokens dim once we are working inside chunk B
      host.dataset.phase = k >= 3 ? 'late' : (k >= 1 ? 'naive' : 'setup');
    };
  },
});
