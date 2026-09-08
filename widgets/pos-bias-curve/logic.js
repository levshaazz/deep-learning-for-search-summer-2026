/* pos-bias-curve/logic.js — L1 'The Lost Record' catch-goodhart beat.
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l1-click-model.json — the SAME
   source the facts-gate checks (top-1 = 32.3%, top-3 = 60.6%), so the displayed shares can't drift.
   Bars = click share by rank when ALL results are equally relevant → pure position bias (Goodhart).

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountPosBiasCurve registration; render() only draws the chart. */
import { defineWidget } from '../_widget-base.js';

export const mountPosBiasCurve = defineWidget({
  id: 'pos-bias-curve',
  rootClass: 'pb-root',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const ranks = data.ranks, MAX = 4, W = 480, H = 300;
    const box = { x: 44, y: 24, w: W - 64, h: H - 64 };
    const maxShare = Math.max(...ranks.map((r) => r.clickShare)) * 1.1;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg pb-svg', role: 'img', 'aria-label': labels.alt || '' }, host);
    el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'pb-axis' }, svg);
    // "rank →" dropped onto its own row BELOW the tick labels (was +20, colliding with the "10" tick
    // at +14) so the last tick and the axis label no longer overlap. (audit #4)
    el('text', { x: box.x + box.w, y: box.y + box.h + 32, class: 'pb-axlbl', 'text-anchor': 'end' }, svg)
      .textContent = labels.xaxis || 'rank →';
    // "clicks" y-label anchored at the LEFT edge inside the box (was end-anchored at x=box.x-6, which
    // pushed its left edge to x≈-1.7 and clipped on the panel border). (audit #4)
    el('text', { x: 2, y: box.y + 8, class: 'pb-axlbl', 'text-anchor': 'start' }, svg)
      .textContent = labels.yaxis || 'clicks';

    const bw = box.w / ranks.length - 6;
    const bars = ranks.map((r, i) => {
      const x = box.x + i * (box.w / ranks.length) + 3;
      const h = (r.clickShare / maxShare) * box.h;
      const rect = el('rect', { x, y: box.y + box.h - h, width: bw, height: h, class: 'pb-bar', 'data-rank': r.rank }, svg);
      el('text', { x: x + bw / 2, y: box.y + box.h + 14, class: 'pb-rk', 'text-anchor': 'middle' }, svg).textContent = r.rank;
      return rect;
    });

    // annotation layers
    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };
    // step 3 (flat) inserts the "true relevance = equal" reference BEFORE Goodhart (now step 4),
    // so the Goodhart label lands on a picture (the gap clicks-vs-flat) instead of empty axes.
    layer('top1', 1); layer('top3', 2); layer('flat', 3); layer('good', 4);
    const t1 = add('top1', el('text', { x: bars[0].getAttribute('x'), y: box.y + 4, class: 'pb-tag pb-top1' }, svg));
    t1.textContent = `${data.top1Pct}%`;
    t1.setAttribute('x', Number(bars[0].getAttribute('x')) + bw / 2);
    t1.setAttribute('text-anchor', 'middle');
    const t3 = add('top3', el('text', { x: box.x + box.w - 6, y: box.y + 18, class: 'pb-tag pb-top3', 'text-anchor': 'end' }, svg));
    t3.textContent = `top-3 = ${data.top3Pct}%`;

    // STEP 3 — the flat "true relevance" line: if all results are equally relevant, an honest click
    // signal would be UNIFORM, i.e. each rank gets an equal 1/N share. Drawn across every bar so the
    // gap between this flat truth and the skewed bars IS the position bias a click-trained model chases.
    const equalShare = 1 / ranks.length;                 // data-driven (N ranks from data), e.g. 0.10
    const flatY = box.y + box.h - (equalShare / maxShare) * box.h;
    add('flat', el('line', { x1: box.x, y1: flatY, x2: box.x + box.w, y2: flatY, class: 'pb-flat' }, svg));
    // label end-anchored at the right edge, just ABOVE the flat line — sits over the short tail bars
    // (ranks ~9-10), clear of the bar-0 head on the left and of the top-right top-3/Goodhart tags.
    const fl = add('flat', el('text', { x: box.x + box.w - 4, y: flatY - 6, class: 'pb-tag pb-flatlbl', 'text-anchor': 'end' }, svg));
    fl.textContent = labels.flat || `true relevance = equal (${Math.round(equalShare * 100)}%)`;

    // Goodhart label, end-anchored top-right. Long RU/TT strings (~55 chars) on one line would
    // run left far enough to reach the y-axis "clicks" label at x=2 — so wrap onto two tspan lines
    // split at the "→" arrow (present in en/ru/tt), keeping each line short of the left margin. (audit #0)
    const goodTxt = labels.goodhart || 'optimise this → reward position, not relevance';
    const goodX = box.x + box.w - 6;
    const gd = add('good', el('text', { x: goodX, y: box.y + 34, class: 'pb-tag pb-good', 'text-anchor': 'end' }, svg));
    const arrowAt = goodTxt.indexOf('→');
    if (arrowAt > 0) {
      const head = goodTxt.slice(0, arrowAt + 1).trim();   // "optimise this →"
      const tail = goodTxt.slice(arrowAt + 1).trim();       // "reward position, not relevance"
      el('tspan', { x: goodX, dy: 0 }, gd).textContent = head;
      el('tspan', { x: goodX, dy: 15 }, gd).textContent = tail;
    } else {
      gd.textContent = goodTxt;
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      bars.forEach((b, i) => {
        b.classList.toggle('is-hot', (k >= 1 && i === 0) || (k >= 2 && i < 3));
      });
      for (const n in layers) {
        const on = k >= layers[n].from;
        for (const node of layers[n].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
