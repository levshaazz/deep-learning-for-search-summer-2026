/* course-map/logic.js — the course spine "you are here" map: Get Data → Measure → Rank.
   The recurring anchor across every lecture (arc.md §2). DRIVER-AGNOSTIC: setStep/maxStep, no input.
   Self-contained (no numeric data) — all text via i18n keys. In L0 the steps light each territory
   in turn; later lectures can pass labels.active = 'get-data'|'measure'|'rank' to pre-highlight. */
const SVGNS = 'http://www.w3.org/2000/svg';
const STOPS = ['get-data', 'measure', 'rank'];
function el(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
export function mountCourseMap(host, { labels = {} } = {}) {
  const W = 540, H = 250, MAX = STOPS.length;     // step 0 = whole map; 1..3 light each stop
  const cy = 96, xs = [110, 270, 430];
  host.classList.add('wgt-root', 'cm-root', 'wgt-fade');
  host.innerHTML = '';
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg cm-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

  // route line
  el('line', { x1: xs[0], y1: cy, x2: xs[2], y2: cy, class: 'cm-route' }, svg);

  const nodes = STOPS.map((id, i) => {
    const g = el('g', { class: 'cm-stop', 'data-stop': id }, svg);
    el('circle', { cx: xs[i], cy, r: 30, class: 'cm-node' }, g);
    el('text', { x: xs[i], y: cy + 6, class: 'cm-num', 'text-anchor': 'middle' }, g).textContent = i + 1;
    // spine leg (above)
    el('text', { x: xs[i], y: cy - 46, class: 'cm-leg', 'text-anchor': 'middle' }, g).textContent = labels['leg' + i] || id;
    // territory (below)
    el('text', { x: xs[i], y: cy + 58, class: 'cm-terr', 'text-anchor': 'middle' }, g).textContent = labels['terr' + i] || '';
    // ship subsystem (below, smaller)
    el('text', { x: xs[i], y: cy + 78, class: 'cm-ship', 'text-anchor': 'middle' }, g).textContent = labels['ship' + i] || '';
    return g;
  });

  const cap = document.createElement('div'); cap.className = 'wgt-caption'; host.appendChild(cap);
  const counter = document.createElement('div'); counter.className = 'wgt-counter'; host.appendChild(counter);

  const activeIdx = STOPS.indexOf(labels.active);
  let step = -1;
  function setStep(k) {
    k = Math.max(0, Math.min(MAX, k | 0));
    if (k === step) return;
    step = k; host.dataset.step = String(k);
    nodes.forEach((g, i) => {
      const lit = activeIdx >= 0 ? i === activeIdx : i < k; // pre-highlight mode vs. walk mode
      g.classList.toggle('is-lit', lit);
    });
    cap.textContent = labels['s' + k] || '';
    counter.textContent = `${k} / ${MAX}`;
  }
  setStep(0);
  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}
if (typeof window !== 'undefined') window.mountCourseMap = mountCourseMap;
