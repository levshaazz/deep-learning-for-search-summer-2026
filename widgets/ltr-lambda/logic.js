/* ltr-lambda/logic.js — L8 'climb-ranknet' beat: Learning to Rank, RankNet → LambdaRank. Two documents
   i (relevant) and j (not) get scores from the model. RankNet reads the preference as a probability of
   the SCORE DIFFERENCE: P(i ≻ j) = σ(s_i − s_j). LambdaRank then weights the gradient by HOW MUCH the
   ranking metric improves if you swap them: λ = gradient · |ΔnDCG| — a force that pulls i up and j down,
   harder where the swap matters more.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. EVERY number comes straight from
   data/l8-ltr.json (toy); all human text from i18n `labels`. Built on widgets/_widget-base.js.

   Steps (maxStep = 3):
     0  → the two docs' scores as bars (i relevant, j not).                       caption s0
     1  → RankNet probability P(i ≻ j) = σ(s_i − s_j) on a 0…1 gauge.             caption s1
     2  → the mis-ordered ranking [j, i] and the ΔnDCG a swap would buy.          caption s2
     3  → λ = gradient · ΔnDCG as a force: i pushed up, j pushed down.            caption s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountLtrLambda = defineWidget({
  id: 'ltr-lambda',
  rootClass: 'll-root',
  exportName: 'mountLtrLambda',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const dI = toy.pair?.docI || {}, dJ = toy.pair?.docJ || {};
    const diff = toy.scoreDiff || 0;
    const prob = toy.rankNetProb || 0;
    const grad = toy.gradient || 0;
    const nd = toy.ndcg || {};
    const lam = toy.lambda || 0;
    const num4 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(4));
    const num1 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : (Number.isInteger(x) ? String(x) : x.toFixed(1)));

    const W = 560, PAD = 16;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg ll-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    layer('docs', 0); layer('prob', 1); layer('ndcg', 2); layer('lambda', 3);
    const defs = el('defs', {}, svg);
    const mk = (id, cls) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, defs); el('path', { d: 'M0 0 L10 5 L0 10 z', class: cls }, m); };
    mk('ll-up', 'll-arrow-up'); mk('ll-dn', 'll-arrow-dn');

    // ── STEP 0: two score bars — i (relevant, blue) above j (not, warm) ──
    add('docs', el('text', { x: PAD, y: 24, class: 'll-head' }, svg))
      .textContent = labels.head || 'two documents, two model scores — which should rank higher?';
    const bx = PAD + 92, bw = 300;
    const maxS = Math.max(0.001, dI.score || 0, dJ.score || 0) * 1.12;
    const rows = [
      { d: dI, y: 48, cls: 'i', lbl: (labels.docI || 'docᵢ') },
      { d: dJ, y: 92, cls: 'j', lbl: (labels.docJ || 'doc_j') },
    ];
    const barEnd = {};
    rows.forEach((r) => {
      add('docs', el('text', { x: PAD, y: r.y + 22, class: 'll-doclbl ll-doclbl-' + r.cls }, svg)).textContent = r.lbl;
      add('docs', el('rect', { x: bx, y: r.y, width: bw, height: 30, rx: 5, class: 'll-track' }, svg));
      const w = ((r.d.score || 0) / maxS) * bw;
      add('docs', el('rect', { x: bx, y: r.y, width: w, height: 30, rx: 5, class: 'll-bar ll-bar-' + r.cls }, svg));
      add('docs', el('text', { x: bx + w + 8, y: r.y + 21, class: 'll-sval' }, svg)).textContent = 's = ' + num1(r.d.score);
      barEnd[r.cls] = { x: bx + w, y: r.y };
    });

    // ── STEP 1: RankNet probability gauge P(i ≻ j) = σ(s_i − s_j) ──
    const py = 150;
    add('prob', el('text', { x: PAD, y: py, class: 'll-line' }, svg))
      .textContent = `RankNet:  P(i ≻ j) = σ(s_i − s_j) = σ(${num1(diff)}) = ${num4(prob)}`;
    const gx = PAD, gy = py + 14, gw = W - 2 * PAD, gh = 16;
    add('prob', el('rect', { x: gx, y: gy, width: gw, height: gh, rx: 8, class: 'll-gauge' }, svg));
    add('prob', el('rect', { x: gx, y: gy, width: gw * prob, height: gh, rx: 8, class: 'll-gaugefill' }, svg));
    add('prob', el('line', { x1: gx + gw * 0.5, y1: gy - 4, x2: gx + gw * 0.5, y2: gy + gh + 4, class: 'll-mid' }, svg));

    // ── STEP 2: the mis-ordered ranking [j, i] and the ΔnDCG a swap buys ──
    const ny = py + 64;
    add('ndcg', el('rect', { x: PAD, y: ny, width: W - 2 * PAD, height: 52, rx: 9, class: 'll-box' }, svg));
    add('ndcg', el('text', { x: PAD + 12, y: ny + 22, class: 'll-line' }, svg))
      .textContent = `order [j, i]: nDCG = ${num4(nd.current)} → swap [i, j]: nDCG = ${num4(nd.afterSwap)}`;
    add('ndcg', el('text', { x: PAD + 12, y: ny + 43, class: 'll-line2' }, svg))
      .textContent = `${labels.deltaLabel || 'ΔnDCG'} = ${num4(nd.afterSwap)} − ${num4(nd.current)} = ${num4(nd.deltaNdcg)}`;

    // ── STEP 3: λ = gradient · ΔnDCG as a force (i pushed up, j pushed down) ──
    const ly = ny + 68;
    add('lambda', el('rect', { x: PAD, y: ly, width: W - 2 * PAD, height: 38, rx: 9, class: 'll-lambdabox' }, svg));
    add('lambda', el('text', { x: PAD + 12, y: ly + 25, class: 'll-lambdaline' }, svg))
      .textContent = `λ = gradient · ${labels.deltaLabel || 'ΔnDCG'} = ${num4(grad)} · ${num4(nd.deltaNdcg)} = ${num4(lam)}`;
    // force arrows beside the two bars: i rises, j sinks (length scaled, just a visual cue).
    // Anchored to a FIXED column beyond the full-track end (bx+bw+40), not barEnd.x+64, so the arrow
    // never floats into the data-driven 's = …' value label however long the bar or the score string.
    const forceX = bx + bw + 40;
    if (barEnd.i) add('lambda', el('line', { x1: forceX, y1: barEnd.i.y + 28, x2: forceX, y2: barEnd.i.y - 6,
      class: 'll-force', 'marker-end': 'url(#ll-up)' }, svg));
    if (barEnd.j) add('lambda', el('line', { x1: forceX, y1: barEnd.j.y + 2, x2: forceX, y2: barEnd.j.y + 36,
      class: 'll-force', 'marker-end': 'url(#ll-dn)' }, svg));

    const H = frameHeightFor(ly + 38, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
