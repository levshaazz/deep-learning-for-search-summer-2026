/* block-geometry/logic.js — L6 'climb-block' / 'turn-block' GEOMETRY companion: the Transformer
   encoder block shown as the EFFECT of each sublayer on a small 2-D token cloud, not as labelled
   boxes. Five tokens start as five points; each scroll-step moves the SAME five dots (keyed by
   index) to the next stage's positions, so the viewer SEES the cloud reshape:
     attention  → the points pull together (blend neighbours);
     Add & Norm → recentre to mean≈0 + rescale to a unit-RMS ring;
     FFN        → each point warps on its own (no token mixing);
     Add & Norm → back onto the ring.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep and renders for any step. It binds NO keyboard and NO
   scroll — the SLIDE driver (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k).
   EVERY coordinate comes from data/l6-block-geo.json (stages[k].points); the stage headings come
   from stages[k].label; the unit ring is drawn at radius = 1 in DATA units (the Add&Norm invariant
   addNorm*Rms ≈ 1 the data carries) so "unit RMS" is literally visible. No raw colours — themed via
   the .bg-* classes (styled at wiring time, mirroring the sibling build-wave widgets).

   This is an illustrative 5-token cloud (seed=5) using the SAME operations as residual-stream /
   layernorm-viz; the numeric worked example stays in attention-e2e / l6-attention.json. Claims here
   are operational ("attention contracts, norm rescales onto a ring, FFN reshapes"), not numeric.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold, setStep
   clamp, window.mountBlockGeometry registration); render() only draws the figure layers. The trail
   segments between stages are clamped to the plot rect with clampSegmentToRect.

   Steps (maxStep = 4) — one per stage:
     0  → stages[0] token points (spread).                                       caption s0
     1  → stages[1]: cloud contracts (attention blends); trails s0→s1.           caption s1
     2  → stages[2]: Add&Norm — recentre + unit-RMS ring.                        caption s2
     3  → stages[3]: FFN warps each point.                                       caption s3
     4  → stages[4]: Add&Norm again — back on the ring.                          caption s4 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor, clampSegmentToRect } from '../_plot-util.js';

export const mountBlockGeometry = defineWidget({
  id: 'block-geometry',
  rootClass: 'bg-root',
  exportName: 'mountBlockGeometry',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const tokens = data.tokens || [];
    const stages = data.stages || [];
    const n = tokens.length;
    const STEPS = stages.length;                  // == maxStep + 1 == 5
    // which stage ids are Add&Norm (draw the unit ring there); read from the data ids.
    const isNorm = (s) => /^addnorm/.test(s.id || '');

    // ── frame geometry (responsive: SVG scales to 100% width via CSS) ──────────
    const W = 480;
    const PAD_L = 16, PAD_T = 34;
    const plotH = 280;
    const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };

    // ONE shared, symmetric data domain across ALL stages so the cloud's contraction/warp is
    // visible as real movement (not re-fit per stage). Use the max extent over every stage point,
    // padded; keep it square+centred so the unit-RMS ring is a true circle on screen.
    let ext = 1;
    for (const s of stages) for (const p of (s.points || [])) ext = Math.max(ext, Math.abs(p[0]), Math.abs(p[1]));
    const d = padDomain(-ext, ext, 0.14);
    const sx = (vx) => box.x + (vx - d.min) / d.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - d.min) / d.span * box.h;
    // pixels-per-data-unit (equal on x & y because the domain is square); ring radius = 1 data unit.
    const unitPx = box.w / d.span;                // = box.h / d.span (square domain)
    const ringR = 1 * unitPx;                     // the Add&Norm unit-RMS radius, in screen px
    const cx0 = sx(0), cy0 = sy(0);               // screen origin (mean≈0 lands here)

    const H = frameHeightFor(PAD_T + plotH + 18, 14);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg bg-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── plane frame + axis labels (inside the corners → never spill past viewBox) ──
    el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'bg-frame' }, svg);
    const ttl = el('text', { x: box.x, y: box.y - 18, class: 'bg-title' }, svg);
    ttl.textContent = labels.planeTitle || 'token cloud (2-D)';
    // the per-stage heading (from data) sits just under the title and swaps per step.
    const stageHead = el('text', { x: box.x, y: box.y - 4, class: 'bg-stage' }, svg);
    el('text', { x: box.x + 6, y: box.y + 14, class: 'bg-axlbl' }, svg)
      .textContent = labels.axY || 'dim ↑';
    el('text', { x: box.x + box.w - 6, y: box.y + box.h - 8, class: 'bg-axlbl',
      'text-anchor': 'end' }, svg).textContent = labels.axX || 'dim →';

    // the unit-RMS ring (shown only on the Add&Norm steps).
    const ring = el('circle', { cx: cx0, cy: cy0, r: ringR.toFixed(2), class: 'bg-ring is-hidden' }, svg);
    const ringLbl = el('text', { x: cx0 + ringR * 0.71 + 4, y: cy0 - ringR * 0.71 - 4,
      class: 'bg-ringlbl is-hidden' }, svg);
    ringLbl.textContent = labels.ringLbl || 'unit RMS ring';

    // ── trail segments (faint lines from the PREVIOUS stage to the current), one set per token ──
    // Drawn once per token and re-pointed each step; clamped to the plot rect.
    const trails = [];
    for (let i = 0; i < n; i++) trails.push(el('line', { class: 'bg-trail is-hidden' }, svg));

    // ── the five token dots + labels (keyed by index; repositioned per step) ──
    const dots = [], dlbls = [];
    for (let i = 0; i < n; i++) {
      const g = el('g', {}, svg);
      dots.push(el('circle', { r: 6, class: 'bg-dot' }, g));
      const t = el('text', { class: 'bg-word', 'text-anchor': 'middle' }, g);
      t.textContent = tokens[i] || '';
      dlbls.push(t);
    }

    function place(k) {
      const stage = stages[k] || stages[0] || { points: [] };
      const prev = stages[Math.max(0, k - 1)] || stage;
      const pts = stage.points || [];
      const pp = prev.points || [];
      // dots + labels to this stage's positions
      for (let i = 0; i < n; i++) {
        const p = pts[i] || [0, 0];
        const X = sx(p[0]), Y = sy(p[1]);
        dots[i].setAttribute('cx', X.toFixed(2));
        dots[i].setAttribute('cy', Y.toFixed(2));
        dlbls[i].setAttribute('x', X.toFixed(2));
        // label baseline lifted clear of the r=6 dot's top edge (was 11 → touched the dot on the tight
        // Add&Norm stages); the CSS halo finishes the separation. (defect-2 fix)
        dlbls[i].setAttribute('y', (Y - 13).toFixed(2));
      }
      // trails: show on every step after 0 (where the cloud moved); clamp to the rect.
      const showTrails = k > 0;
      for (let i = 0; i < n; i++) {
        const tline = trails[i];
        if (!showTrails) { tline.classList.add('is-hidden'); continue; }
        const a = pp[i] || [0, 0], b = pts[i] || [0, 0];
        const seg = clampSegmentToRect(sx(a[0]), sy(a[1]), sx(b[0]), sy(b[1]), box);
        if (seg) {
          tline.setAttribute('x1', seg.x1.toFixed(2)); tline.setAttribute('y1', seg.y1.toFixed(2));
          tline.setAttribute('x2', seg.x2.toFixed(2)); tline.setAttribute('y2', seg.y2.toFixed(2));
          tline.classList.remove('is-hidden');
        } else {
          tline.classList.add('is-hidden');
        }
      }
      // stage heading from the data label
      stageHead.textContent = stage.label || '';
      // the unit ring only on Add&Norm stages
      const norm = isNorm(stage);
      ring.classList.toggle('is-hidden', !norm);
      ringLbl.classList.toggle('is-hidden', !norm);
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      place(Math.max(0, Math.min(STEPS - 1, k)));
    };
  },
});
