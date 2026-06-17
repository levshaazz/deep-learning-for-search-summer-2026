/* course-map/logic.js — the course spine "you are here" map: Get Data → Measure → Rank → Generate.
   The recurring anchor across every lecture (arc.md §2). DRIVER-AGNOSTIC: setStep/maxStep, no input.
   Self-contained (no numeric data) — all text via i18n keys. In L0 the steps light each territory in
   turn (walk mode); later lectures pass labels.active to PRE-HIGHLIGHT their stop(s) — "you are here".

   FOUR LEGS (E10, L10 "The Oracle"): the spine earned its fourth leg — *Generate* (RAG, on top of
   Rank) — for good (owner-locked, arc.md §2). The map draws four stops; L10/L12 light Rank+Generate.

   MULTI-STOP active: labels.active may be a single stop id OR a list (array, or space/comma-delimited
   string) of stop ids — because per-lecture course.json `spine` arrays are multi-stop (e.g. L2 =
   [Get Data, Measure], L10 = [Rank, Generate]). All listed stops light; absent → walk mode (i < k).
   Back-compatible: a single-string `active` still resolves to a one-element set.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountCourseMap registration; render() only draws the map. */
import { defineWidget } from '../_widget-base.js';

const STOPS = ['get-data', 'measure', 'rank', 'generate'];

// Parse labels.active (single id | array | space/comma list) → a Set of valid stop indices.
function activeSet(active) {
  const list = Array.isArray(active) ? active
    : (typeof active === 'string' && active.trim() ? active.trim().split(/[\s,]+/) : []);
  const s = new Set();
  for (const a of list) { const i = STOPS.indexOf(a); if (i >= 0) s.add(i); }
  return s;
}

export const mountCourseMap = defineWidget({
  id: 'course-map',
  rootClass: 'cm-root',
  exportName: 'mountCourseMap',
  maxStep: STOPS.length, // step 0 = whole map; 1..4 light each stop
  render({ host, labels, el }) {
    const W = 700, H = 250;
    const cy = 96, xs = [100, 267, 433, 600];
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg cm-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // route line
    el('line', { x1: xs[0], y1: cy, x2: xs[STOPS.length - 1], y2: cy, class: 'cm-route' }, svg);

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

    const active = activeSet(labels.active);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      nodes.forEach((g, i) => {
        const lit = active.size ? active.has(i) : i < k; // pre-highlight mode vs. walk mode
        g.classList.toggle('is-lit', lit);
      });
    };
  },
});
