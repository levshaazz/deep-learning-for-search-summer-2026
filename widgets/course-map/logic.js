/* course-map/logic.js — the course spine "you are here" map: Get Data → Measure → Rank.
   The recurring anchor across every lecture (arc.md §2). DRIVER-AGNOSTIC: setStep/maxStep, no input.
   Self-contained (no numeric data) — all text via i18n keys. In L0 the steps light each territory
   in turn; later lectures can pass labels.active = 'get-data'|'measure'|'rank' to pre-highlight.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountCourseMap registration; render() only draws the map. */
import { defineWidget } from '../_widget-base.js';

const STOPS = ['get-data', 'measure', 'rank'];

export const mountCourseMap = defineWidget({
  id: 'course-map',
  rootClass: 'cm-root',
  exportName: 'mountCourseMap',
  maxStep: STOPS.length, // step 0 = whole map; 1..3 light each stop
  render({ host, labels, el }) {
    const W = 540, H = 250;
    const cy = 96, xs = [110, 270, 430];
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

    const activeIdx = STOPS.indexOf(labels.active);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      nodes.forEach((g, i) => {
        const lit = activeIdx >= 0 ? i === activeIdx : i < k; // pre-highlight mode vs. walk mode
        g.classList.toggle('is-lit', lit);
      });
    };
  },
});
