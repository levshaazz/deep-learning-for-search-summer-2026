/* pos-bias-curve/logic.js — L1 'The Lost Record' catch-goodhart beat.
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l1-click-model.json — the SAME
   source the facts-gate checks (top-1 = 32.3%, top-3 = 60.6%), so the displayed shares can't drift.
   Bars = click share by rank when ALL results are equally relevant → pure position bias (Goodhart). */
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
export function mountPosBiasCurve(host, { data, labels = {} } = {}) {
  const ranks = data.ranks, MAX = 3, W = 480, H = 300;
  const box = { x: 44, y: 24, w: W - 64, h: H - 64 };
  const maxShare = Math.max(...ranks.map((r) => r.clickShare)) * 1.1;

  host.classList.add('wgt-root', 'pb-root', 'wgt-fade');
  host.innerHTML = '';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg pb-svg', role: 'img', 'aria-label': labels.alt || '' }, host);
  el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'pb-axis' }, svg);
  el('text', { x: box.x + box.w, y: box.y + box.h + 20, class: 'pb-axlbl', 'text-anchor': 'end' }, svg)
    .textContent = labels.xaxis || 'rank →';
  el('text', { x: box.x - 6, y: box.y + 8, class: 'pb-axlbl', 'text-anchor': 'end' }, svg)
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
  layer('top1', 1); layer('top3', 2); layer('good', 3);
  const t1 = add('top1', el('text', { x: bars[0].getAttribute('x'), y: box.y + 4, class: 'pb-tag pb-top1' }, svg));
  t1.textContent = `${data.top1Pct}%`;
  t1.setAttribute('x', Number(bars[0].getAttribute('x')) + bw / 2);
  t1.setAttribute('text-anchor', 'middle');
  const t3 = add('top3', el('text', { x: box.x + box.w - 6, y: box.y + 18, class: 'pb-tag pb-top3', 'text-anchor': 'end' }, svg));
  t3.textContent = `top-3 = ${data.top3Pct}%`;
  const gd = add('good', el('text', { x: box.x + box.w - 6, y: box.y + 38, class: 'pb-tag pb-good', 'text-anchor': 'end' }, svg));
  gd.textContent = labels.goodhart || 'optimise this → reward position, not relevance';

  const cap = document.createElement('div'); cap.className = 'wgt-caption'; host.appendChild(cap);
  const counter = document.createElement('div'); counter.className = 'wgt-counter'; host.appendChild(counter);

  let step = -1;
  function setStep(k) {
    k = Math.max(0, Math.min(MAX, k | 0));
    if (k === step) return;
    step = k; host.dataset.step = String(k);
    bars.forEach((b, i) => {
      b.classList.toggle('is-hot', (k >= 1 && i === 0) || (k >= 2 && i < 3));
    });
    for (const n in layers) {
      const on = k >= layers[n].from;
      for (const node of layers[n].nodes) node.classList.toggle('is-hidden', !on);
    }
    cap.textContent = labels['s' + k] || '';
    counter.textContent = `${k} / ${MAX}`;
  }
  setStep(0);
  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}
if (typeof window !== 'undefined') window.mountPosBiasCurve = mountPosBiasCurve;
