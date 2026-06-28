/* zipf-heaps/logic.js — L2 'First Contact' stats-zipf-heaps beat.
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l2-corpus-stats.json — the SAME
   source the facts-gate checks, so the displayed slope (≈-1.02), β (≈0.59), V (94,287) cannot drift.
   Two stacked log-log plots: Zipf (rank↔frequency) on top, Heaps (tokens↔vocabulary) below.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountZipfHeaps registration; render() only draws the two plots. */
import { defineWidget } from '../_widget-base.js';
import { padDomain, clampSegmentToRect } from '../_plot-util.js';

const log10 = (x) => Math.log(x) / Math.LN10;

export const mountZipfHeaps = defineWidget({
  id: 'zipf-heaps',
  rootClass: 'zh-root',
  exportName: 'mountZipfHeaps',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const W = 480, H = 440;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg zh-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // ── plot frame helper ────────────────────────────────────────────────────
    function frame(box, title) {
      el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'zh-frame' }, svg);
      const t = el('text', { x: box.x, y: box.y - 6, class: 'zh-title' }, svg);
      t.textContent = title;
      return {
        sx: (lx) => box.x + (lx - box.xmin) / (box.xmax - box.xmin) * box.w,
        sy: (ly) => box.y + box.h - (ly - box.ymin) / (box.ymax - box.ymin) * box.h,
      };
    }

    // ── ZIPF (top): log10(rank) vs log10(count) ──────────────────────────────
    const top = data.top10;
    // pad the freq y-domain generously (audit #2): the #1 token dot was jammed at the frame top with
    // its label on the edge — padDomain drops it ~28px below the top so "the ×173,736" has headroom.
    const zy = padDomain(log10(Math.min(...top.map(t => t.count))), log10(Math.max(...top.map(t => t.count))), 0.32);
    // pad the rank x-domain a touch on the left too, so the rank-1 dot (log10(1)=0) sits INSIDE the
    // frame instead of straddling its left edge. (audit #2)
    const zx = padDomain(0, 1, 0.05);
    const zb = { x: 56, y: 28, w: W - 80, h: 150,
      xmin: zx.min, xmax: zx.max, ymin: zy.min, ymax: zy.max };
    const Z = frame(zb, labels.zipfTitle || 'Zipf: rank ↔ frequency (log–log)');
    el('text', { x: zb.x - 8, y: zb.y + 8, class: 'zh-axlbl', 'text-anchor': 'end' }, svg).textContent = 'freq';
    el('text', { x: zb.x + zb.w, y: zb.y + zb.h + 18, class: 'zh-axlbl', 'text-anchor': 'end' }, svg).textContent = 'rank →';

    layer('zline', 1); layer('zpts', 0); layer('zannot', 2);
    const lr = top.map(t => log10(t.rank)), lc = top.map(t => log10(t.count));
    // fit line through centroid with Zipf slope — CLAMP to the frame rect so the extrapolated left
    // end (which used to shoot above the frame to negative screen-y) and the right end stay inside
    // the plot box. We draw only the segment of the trend that lies within the frame. (audit #2)
    // It is painted BEFORE the dots/label (audit #4) so where the descending trend crosses the
    // top-left "the ×173,736" token label, the line reads as passing BEHIND the annotation rather
    // than colliding with it.
    const slope = data.zipf.loglogSlope;
    const xb = lr.reduce((a, b) => a + b, 0) / lr.length, yb = lc.reduce((a, b) => a + b, 0) / lc.length;
    const yAt = (x) => yb + slope * (x - xb);
    const seg = clampSegmentToRect(
      Z.sx(zb.xmin), Z.sy(yAt(zb.xmin)), Z.sx(zb.xmax), Z.sy(yAt(zb.xmax)),
      { x: zb.x, y: zb.y, w: zb.w, h: zb.h }) ||
      { x1: Z.sx(zb.xmin), y1: zb.y, x2: Z.sx(zb.xmax), y2: zb.y + zb.h };
    add('zline', el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, class: 'zh-fit' }, svg));
    top.forEach((t, i) => {
      add('zpts', el('circle', { cx: Z.sx(lr[i]), cy: Z.sy(lc[i]), r: 4, class: 'zh-dot' }, svg));
    });
    // label the #1 token — dropped a touch below the dot (audit #4) so it clears the steep head of
    // the curve where the fit line is still near the frame top.
    const t0 = add('zpts', el('text', { x: Z.sx(lr[0]) + 10, y: Z.sy(lc[0]) + 14, class: 'zh-tok' }, svg));
    t0.textContent = `“${top[0].token}” ×${top[0].count.toLocaleString('en-US')}`;
    const sl = add('zannot', el('text', { x: zb.x + zb.w - 6, y: zb.y + 22, class: 'zh-eq', 'text-anchor': 'end' }, svg));
    sl.textContent = `slope ≈ ${slope.toFixed(2)}`;
    const hc = add('zannot', el('text', { x: zb.x + zb.w - 6, y: zb.y + 40, class: 'zh-sub', 'text-anchor': 'end' }, svg));
    hc.textContent = `top-10 = ${(data.zipf.headCoverage.top10 * 100).toFixed(0)}% of all tokens`;

    // ── HEAPS (bottom): log10(N) vs log10(V) ─────────────────────────────────
    const cp = data.heapsCheckpoints;
    const hb = { x: 56, y: 256, w: W - 80, h: 150,
      xmin: log10(cp[0].N) - 0.1, xmax: log10(cp[cp.length - 1].N) + 0.1,
      ymin: log10(cp[0].V) - 0.1, ymax: log10(cp[cp.length - 1].V) + 0.1 };
    const Hp = frame(hb, labels.heapsTitle || 'Heaps: tokens ↔ vocabulary (log–log)');
    el('text', { x: hb.x - 8, y: hb.y + 8, class: 'zh-axlbl', 'text-anchor': 'end' }, svg).textContent = 'types';
    el('text', { x: hb.x + hb.w, y: hb.y + hb.h + 18, class: 'zh-axlbl', 'text-anchor': 'end' }, svg).textContent = 'tokens →';

    layer('heaps', 3);
    const hx = cp.map(p => log10(p.N)), hy = cp.map(p => log10(p.V));
    const dPath = cp.map((p, i) => `${i ? 'L' : 'M'} ${Hp.sx(hx[i])} ${Hp.sy(hy[i])}`).join(' ');
    add('heaps', el('path', { d: dPath, class: 'zh-heapsline' }, svg));
    cp.forEach((p, i) => add('heaps', el('circle', { cx: Hp.sx(hx[i]), cy: Hp.sy(hy[i]), r: 3.5, class: 'zh-dot zh-dot-h' }, svg)));
    const beq = add('heaps', el('text', { x: hb.x + 8, y: hb.y + 20, class: 'zh-eq' }, svg));
    beq.textContent = `V = K·N^β,  β ≈ ${data.heaps.beta.toFixed(2)}`;
    const bsub = add('heaps', el('text', { x: hb.x + 8, y: hb.y + 38, class: 'zh-sub' }, svg));
    bsub.textContent = `V = ${data.vTypes.toLocaleString('en-US')} types,  R² = ${data.heaps.r2.toFixed(3)}`;

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
    };
  },
});
