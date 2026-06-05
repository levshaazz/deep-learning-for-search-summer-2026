/* highd-histogram/logic.js — L2 'First Contact' catch-curse-highd beat (the Wraith).
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l2-highd.json (seeded, reproducible).
   Each step raises the dimension; the pairwise-distance histogram collapses into a spike at the mean
   (cv → 0) — near and far become indistinguishable. */
const SVGNS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

export function mountHighdHistogram(host, { data, labels = {} } = {}) {
  const W = 480, H = 320;
  const box = { x: 48, y: 24, w: W - 70, h: H - 70 };
  const dims = data.dims, MAX = dims.length - 1;
  const centers = data.binCenters;
  const nb = centers.length;
  const maxDensity = Math.max(...dims.flatMap((d) => d.hist)) * 1.05;
  const xmin = centers[0], xmax = centers[nb - 1];

  host.classList.add('wgt-root', 'hd-root', 'wgt-fade');
  host.innerHTML = '';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg hd-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

  const sx = (x) => box.x + (x - xmin) / (xmax - xmin) * box.w;
  const sy = (y) => box.y + box.h - (y / maxDensity) * box.h;
  const bw = box.w / nb - 2;

  // axes + mean reference line at distance/mean = 1
  el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'hd-axis' }, svg);
  el('line', { x1: sx(1), y1: box.y, x2: sx(1), y2: box.y + box.h, class: 'hd-mean' }, svg);
  el('text', { x: sx(1), y: box.y - 6, class: 'hd-axlbl', 'text-anchor': 'middle' }, svg).textContent = 'mean';
  el('text', { x: box.x + box.w, y: box.y + box.h + 20, class: 'hd-axlbl', 'text-anchor': 'end' }, svg)
    .textContent = (labels.xaxis || 'distance / mean →');

  const bars = centers.map((c) => el('rect', { x: sx(c) - bw / 2, width: bw, y: sy(0), height: 0, class: 'hd-bar' }, svg));
  const dLbl = el('text', { x: box.x + 6, y: box.y + 20, class: 'hd-dim' }, svg);
  const cvLbl = el('text', { x: box.x + 6, y: box.y + 40, class: 'hd-cv' }, svg);

  const cap = document.createElement('div'); cap.className = 'wgt-caption'; host.appendChild(cap);
  const counter = document.createElement('div'); counter.className = 'wgt-counter'; host.appendChild(counter);

  let step = -1;
  function setStep(k) {
    k = Math.max(0, Math.min(MAX, k | 0));
    if (k === step) return;
    step = k; host.dataset.step = String(k);
    const dim = dims[k];
    dim.hist.forEach((h, i) => {
      bars[i].setAttribute('y', sy(h));
      bars[i].setAttribute('height', Math.max(0, box.y + box.h - sy(h)));
    });
    dLbl.textContent = `d = ${dim.d.toLocaleString('en-US')}`;
    cvLbl.textContent = `cv = std/mean = ${dim.cv.toFixed(3)}`;
    cap.textContent = labels['s' + k] || '';
    counter.textContent = `${k} / ${MAX}`;
  }
  setStep(0);
  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}

if (typeof window !== 'undefined') window.mountHighdHistogram = mountHighdHistogram;
