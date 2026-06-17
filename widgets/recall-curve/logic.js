/* recall-curve/logic.js — L9: a GENERIC recall-vs-knob line plot, reused by two slides:
     • the HNSW ef-sweep   (data/l9-hnsw.json  efSweep.sweep = [{ef, candidatesEvaluated, recallAt1}])
     • the IVF nprobe-sweep (data/l9-ivf.json   toy2.sweep   = [{nprobe, pointsScanned, recall}])
   Recall (y) is plotted against the knob (x); each point is labelled, and a faint second annotation
   reports the cost (candidates evaluated / points scanned) — the work the recall is bought with.

   WHICH SERIES: pick with `labels.series` ('ef' | 'nprobe'). Absent the flag the widget AUTODETECTS
   from the data shape (efSweep present → ef; toy2.sweep present → nprobe), so a slide can also just
   hand it the right data. The series config (where the sweep lives, the knob key, the recall key, the
   cost key) is the ONLY thing that differs — the plot code is shared.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll — deck arrows and Book Scrollama both
   call setStep(k). Every coordinate comes from the facts-gated data JSON; all human text from i18n
   `labels` (en + ru + tt). Built on widgets/_widget-base.js + _plot-util.js.

   STEP REVEAL: points appear LEFT→RIGHT, one more per step (step 0 → first point only; step maxStep →
   the whole curve). Nothing is drawn at "full" on step 0, so the slide-viz step gate sees a real
   reveal. maxStep = (number of sweep points − 1). */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

// the per-series wiring: where the sweep array lives + which keys are knob / recall / cost.
const SERIES = {
  ef: {
    sweep: (d) => (d.efSweep && d.efSweep.sweep) || [],
    knob: 'ef', recall: 'recallAt1', cost: 'candidatesEvaluated',
    knobLabelKey: 'efKnob', costLabelKey: 'efCost',
  },
  nprobe: {
    sweep: (d) => (d.toy2 && d.toy2.sweep) || [],
    knob: 'nprobe', recall: 'recall', cost: 'pointsScanned',
    knobLabelKey: 'nprobeKnob', costLabelKey: 'nprobeCost',
  },
};

function pickSeries(data, labels) {
  const want = labels && labels.series;
  if (want && SERIES[want]) return { name: want, cfg: SERIES[want] };
  // autodetect from the data shape.
  if (data.efSweep && data.efSweep.sweep) return { name: 'ef', cfg: SERIES.ef };
  if (data.toy2 && data.toy2.sweep) return { name: 'nprobe', cfg: SERIES.nprobe };
  return { name: 'ef', cfg: SERIES.ef };
}

export const mountRecallCurve = defineWidget({
  id: 'recall-curve',
  rootClass: 'rc-root',
  exportName: 'mountRecallCurve',
  maxStep: 4,                          // a generic ceiling; the widget clamps to (#points − 1) live
  render({ host, data, labels, el }) {
    const { name, cfg } = pickSeries(data, labels);
    const sweep = cfg.sweep(data);
    const N = sweep.length;

    const knobs = sweep.map((p) => Number(p[cfg.knob]));
    const recalls = sweep.map((p) => Number(p[cfg.recall]));
    const costs = sweep.map((p) => Number(p[cfg.cost]));

    // ── frame (SVG scales to 100% width via CSS) ──
    const W = 480, PAD_L = 46, PAD_R = 18, PAD_T = 30;
    const plotW = W - PAD_L - PAD_R, plotH = 230;
    const dx = padDomain(Math.min(...knobs), Math.max(...knobs), 0.08);
    const dy = padDomain(0, 1, 0.10);            // recall is a fraction in [0,1]
    const box = { x: PAD_L, y: PAD_T, w: plotW, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

    const captionTop = PAD_T + plotH + 40;       // room for the x tick labels + axis label
    const H = frameHeightFor(captionTop + 18, 10);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg rc-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── axes ──
    el('line', { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.h, class: 'rc-axis' }, svg);                 // y
    el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'rc-axis' }, svg); // x

    // y gridlines + ticks at recall 0, 0.5, 1.0
    [0, 0.5, 1].forEach((t) => {
      const y = sy(t);
      el('line', { x1: box.x, y1: y, x2: box.x + box.w, y2: y, class: 'rc-grid' }, svg);
      el('text', { x: box.x - 8, y: y + 4, class: 'rc-ytick', 'text-anchor': 'end' }, svg).textContent = t.toFixed(1);
    });
    el('text', { x: 4, y: box.y - 12, class: 'rc-axlbl', 'text-anchor': 'start' }, svg)
      .textContent = labels.yaxis || 'recall';

    // x ticks = the knob values
    knobs.forEach((kv, i) => {
      el('text', { x: sx(kv), y: box.y + box.h + 18, class: 'rc-xtick', 'text-anchor': 'middle' }, svg)
        .textContent = String(kv);
    });
    const knobName = labels[cfg.knobLabelKey] || cfg.knob;
    el('text', { x: box.x + box.w, y: box.y + box.h + 36, class: 'rc-axlbl', 'text-anchor': 'end' }, svg)
      .textContent = `${knobName} →`;

    // ── the connecting polyline (drawn under the points) — clipped to the prefix revealed so far ──
    const line = el('polyline', { points: '', class: 'rc-line', fill: 'none' }, svg);

    // ── points (+ recall value label + faint cost annotation), one group per sweep entry ──
    const ptEls = sweep.map((p, i) => {
      const cx = sx(knobs[i]), cy = sy(recalls[i]);
      const g = el('g', { class: 'rc-pt is-hidden' }, svg);
      el('circle', { cx, cy, r: 6, class: 'rc-dot' + (recalls[i] >= 1 ? ' is-perfect' : '') }, g);
      // recall value above the point
      el('text', { x: cx, y: cy - 11, class: 'rc-rlbl', 'text-anchor': 'middle' }, g).textContent = recalls[i].toFixed(recalls[i] === Math.round(recalls[i]) ? 1 : 4);
      // cost annotation below the point (the work this recall costs)
      el('text', { x: cx, y: cy + 20, class: 'rc-clbl', 'text-anchor': 'middle' }, g).textContent = `${costs[i]}`;
      return g;
    });

    // the cost-legend line (what the small under-point numbers mean)
    const costName = labels[cfg.costLabelKey] || cfg.cost;
    el('text', { x: box.x, y: captionTop, class: 'rc-costkey', 'text-anchor': 'start' }, svg)
      .textContent = `${labels.costPrefix || 'small number under each point ='} ${costName}`;

    // clamp the factory's generic maxStep down to this series' real length so we never over-step.
    const lastStep = Math.max(0, N - 1);

    return function update(k) {
      const upto = Math.min(k, lastStep);        // reveal points 0..upto (left→right)
      ptEls.forEach((g, i) => g.classList.toggle('is-hidden', i > upto));
      // polyline through the revealed prefix
      const pts = sweep.slice(0, upto + 1).map((p, i) => `${sx(knobs[i])},${sy(recalls[i])}`).join(' ');
      line.setAttribute('points', pts);
    };
  },
});
