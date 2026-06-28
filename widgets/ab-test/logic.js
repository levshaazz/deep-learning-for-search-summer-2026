/* ab-test/logic.js — L4 'The real world votes with clicks' online-eval beat.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll. Reads data/l4-online.json → abTest —
   the SAME source the deck + facts-gate check (control CTR 12%, treatment 13.2%, +10% rel lift,
   pooled p̄=0.126, SE=0.00469, z=2.557, p=0.01056), so the displayed numbers can't drift. NO literals
   in the figure: every number comes from `data.abTest`.

   Stepped story — watch an A/B test resolve:
     step0  two arms A (control) vs B (treatment) with their CTR bars
     step1  the observed lift — Δ (absolute points) and the +relative% gain
     step2  the catch — could it be noise? the two-proportion z-test (pooled p̄, SE → z ≈ 2.557)
     step3  the verdict — p ≈ 0.011 < 0.05, so the lift is real → ship B

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountAbTest registration; render() only draws bars + readout. */
import { defineWidget } from '../_widget-base.js';

// local formatters — keep inside this module (distinct from the factory fmt's toFixed(6)).
const pct = (x, d = 1) => (Math.round(x * 100 * 10 ** d) / 10 ** d).toString() + '%';
const pp = (x, d = 1) => (Math.round(x * 100 * 10 ** d) / 10 ** d).toString();
const num = (x, d) => (Math.round(x * 10 ** d) / 10 ** d).toString();

export const mountAbTest = defineWidget({
  id: 'ab-test',
  rootClass: 'ab-root',
  exportName: 'mountAbTest',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const t = data.abTest;
    const A = t.control, B = t.treatment;
    const W = 480, H = 426;     // +22 over the old 404 to fit the third z-test line (SE shown explicitly)
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg ab-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── plot box + two bars (control A, variant B) ────────────────────────────────────────────
    const box = { x: 28, y: 44, w: W - 56, h: 188 };
    const maxRate = Math.max(A.ctr, B.ctr) * 1.28;          // headroom for the value label above

    // y axis baseline + label (label sits above the plot, left-anchored — always in-frame)
    el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'ab-axis' }, svg);
    el('text', { x: box.x, y: box.y - 12, class: 'ab-axlbl', 'text-anchor': 'start' }, svg)
      .textContent = labels.yaxis || 'click-through rate';

    const arms = [
      { d: A, label: labels.armA || 'A · control', cls: 'ab-a' },
      { d: B, label: labels.armB || 'B · variant', cls: 'ab-b' },
    ];
    const slot = box.w / arms.length;
    const bw = Math.min(116, slot * 0.5);
    const bars = arms.map((arm, i) => {
      const cx = box.x + slot * i + slot / 2;
      const h = (arm.d.ctr / maxRate) * box.h;
      const y0 = box.y + box.h - h;
      const rect = el('rect', { x: cx - bw / 2, y: y0, width: bw, height: h,
        class: `ab-bar ${arm.cls}`, rx: 6 }, svg);
      // value (CTR) above the bar
      const val = el('text', { x: cx, y: y0 - 8, class: `ab-val ${arm.cls}`, 'text-anchor': 'middle' }, svg);
      val.textContent = pct(arm.d.ctr);
      // arm label below the axis
      el('text', { x: cx, y: box.y + box.h + 18, class: 'ab-arm', 'text-anchor': 'middle' }, svg)
        .textContent = arm.label;
      // user-count sub-label below the arm label
      el('text', { x: cx, y: box.y + box.h + 34, class: 'ab-sub', 'text-anchor': 'middle' }, svg)
        .textContent = `n = ${arm.d.n.toLocaleString('en-US')}`;
      return { rect, val, cx, y0 };
    });

    // ── lift bracket between the two bars (step 1) ────────────────────────────────────────────
    const liftG = el('g', { class: 'ab-layer ab-lift is-hidden' }, svg);
    const xA = bars[0].cx, xB = bars[1].cx, yTop = bars[1].y0 - 30;
    el('path', { d: `M ${xA} ${bars[0].y0 - 24} L ${xA} ${yTop} L ${xB} ${yTop} L ${xB} ${bars[1].y0 - 24}`,
      class: 'ab-bracket', fill: 'none' }, liftG);
    const liftTxt = el('text', { x: (xA + xB) / 2, y: yTop - 8, class: 'ab-lift-txt', 'text-anchor': 'middle' }, liftG);
    liftTxt.textContent = `Δ +${pp(t.absoluteLift)} pts  ·  +${num(t.relativeLiftPct, 1)}%`;

    // ── significance readout panel (steps 2–3) ───────────────────────────────────────────────
    const panel = { x: box.x - 8, y: box.y + box.h + 50, w: box.w + 16 };
    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };
    layer('lift', 1); layer('z', 2); layer('verdict', 3);

    // step 1 also writes a compact lift line into the panel (in case the bracket is tight on mobile)
    const head = (n, x, y, cls, text) =>
      (add(n, el('text', { x, y, class: 'ab-annot ' + cls }, svg)).textContent = text);
    head('lift', panel.x, panel.y, 'ab-lift-h',
      `lift:  ${pct(A.ctr)} → ${pct(B.ctr)}   (+${num(t.relativeLiftPct, 1)}% relative)`);

    // step 2 — the two-proportion z-test, with the SUBSTITUTED pieces from data.abTest.steps so the
    // derivation (pool the rate → form SE → form z) is shown, not just three finished numbers.
    const st = t.steps || {};
    head('z', panel.x, panel.y + 26, 'ab-z-h',
      `pooled  p̄ = ${st.pPooledExpr || ((1200 + 1320) + '/' + (10000 + 10000) + ' = ' + num(t.pooledCtr, 3))}`);
    head('z', panel.x, panel.y + 46, 'ab-z-sub',
      `SE = ${st.seExpr || ('√(p̄·(1−p̄)·(1/nC+1/nT)) = ' + num(t.se, 5))}`);
    head('z', panel.x, panel.y + 64, 'ab-z-sub',
      `z = ${st.zExpr || ('(' + num(B.ctr, 3) + ' − ' + num(A.ctr, 3) + ')/' + num(t.se, 5) + ' = ' + num(t.z, 3))}`);

    // step 3 — verdict: p-value, threshold, and the call (pushed down to clear the third z-line)
    const sig = t.significant05;
    head('verdict', panel.x, panel.y + 86, 'ab-v-h',
      `p ≈ ${num(t.p, 3)}  ${sig ? '<' : '≥'}  0.05`);
    const v = add('verdict', el('text', { x: panel.x, y: panel.y + 110, class: 'ab-annot ab-v-call' + (sig ? ' is-real' : '') }, svg));
    v.textContent = sig ? (labels.verdictReal || 'The lift is real — ship B.')
                        : (labels.verdictNoise || 'Could be noise — hold.');

    // a small badge on B's bar at the verdict (✓ when significant)
    const badge = el('text', { x: bars[1].cx, y: bars[1].y0 + 26, class: 'ab-badge is-hidden', 'text-anchor': 'middle' }, svg);
    badge.textContent = sig ? '✓' : '?';

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      // B's bar lights up once we're talking about the lift (step ≥ 1); the verdict confirms it.
      bars[1].rect.classList.toggle('is-hot', k >= 1);
      bars[1].rect.classList.toggle('is-real', k >= 3 && sig);
      badge.classList.toggle('is-hidden', k < 3);

      liftG.classList.toggle('is-hidden', k < 1);
      for (const n in layers) {
        const on = k >= layers[n].from;
        for (const node of layers[n].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
