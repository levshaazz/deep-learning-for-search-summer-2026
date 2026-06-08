/* pca-rotate/logic.js — L5 'climb-pca' (deck PCA slides) companion: PCA AS ROTATION.
   The user's #2 complaint was that dimred shows only static end-states; this widget shows the
   GEOMETRY MOVING — a correlated 3-D cloud is rotated (a rigid turn, nothing distorted) until its
   own principal axes line up with the screen axes, then the thin third axis is dropped to land in
   2-D. The viewer SEES the cloud turn and flatten.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep, binds NO keyboard / NO
   scroll — the SLIDE driver (deck arrows) and the BOOK driver (Scrollama) both call setStep(k).
   EVERY number — explainedVarPct [79.79,17.42,2.79], var2dPct 97.21, the cloud/frame coordinates,
   the eigenvectors — comes straight from data/l5-pca-rotate.json (the facts-gate source). Human
   text is i18n. Distinct headline from dimred-projection (37.7%): this is 97.21% (30 pts, 3-D).

   Built on widgets/_widget-base.js (host setup, caption/counter scaffold, setStep clamp,
   window.mountPcaRotate registration); render() only draws the figure layers.

   Steps (maxStep = 4):
     0 → the raw correlated 3-D cloud in an isometric box.                          caption s0
     1 → the 3 covariance eigenvectors (PC1/PC2/PC3) drawn as axes from the origin. caption s1
     2 → rotate partway (frames[2], frac 0.66) — cloud + axes swing toward screen.  caption s2
     3 → fully aligned (frames[3], frac 1.0); per-axis variance % labels.           caption s3
     4 → project to 2-D (final2d): drop PC3; headline 97.21% of spread kept.        caption s4 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, clampSegmentToRect, frameHeightFor } from '../_plot-util.js';

// PC axis → theme token (PC1 accent, PC2 secondary, PC3 muted) — matches dimred's palette family.
const PC_COLOR = ['var(--accent, #2A6FDB)', 'var(--c-violet, #7D5BA6)', 'var(--ink-4, #9CA3AF)'];

export const mountPcaRotate = defineWidget({
  id: 'pca-rotate',
  rootClass: 'pcr-root',
  exportName: 'mountPcaRotate',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const cloud = data.cloud3d || [];
    const frames = data.frames || [];
    const eigvec = data.eigenvectors || [];           // rows = PC1, PC2, PC3
    const evPct = data.explainedVarPct || [];
    const var2d = data.var2dPct;
    const final2d = data.final2d || [];

    // which frame each step renders (s0/s1 = frac 0; s2 = partial; s3 = aligned).
    const frameForStep = [0, 0, 2, 3];                 // indices into frames[]
    const ptsAt = (fi) => (frames[fi] && frames[fi].points) || cloud;

    // ── isometric projection: a fixed 3-D→2-D matrix so the SVG reads as a 3-D box ──────────────
    // standard isometric-ish angles; z tilts up-left so the cloud's depth is visible.
    const A = 0.6, B = 0.32;                            // x→(right,down-ish), z→(up,left)
    const iso = (x, y, z) => ({
      u: x - z * A,                                     // screen "x" (data x spreads right, z recedes left)
      v: -y * 0.92 - z * B,                             // screen "y" (data y up; z lifts slightly)
    });

    // collect every projected coord across ALL frames so the scale is stable as the cloud turns
    // (no jump-zoom between steps). Include eigenvector tips too.
    const allUV = [];
    frames.forEach((f) => (f.points || []).forEach((p) => allUV.push(iso(p[0], p[1], p[2]))));
    cloud.forEach((p) => allUV.push(iso(p[0], p[1], p[2])));
    eigvec.forEach((v, i) => {
      const L = 3.4;                                    // fixed visual axis length
      allUV.push(iso(v[0] * L, v[1] * L, v[2] * L));
      allUV.push(iso(-v[0] * L, -v[1] * L, -v[2] * L));
    });
    const us = allUV.map((p) => p.u), vs = allUV.map((p) => p.v);
    const du = padDomain(Math.min(...us), Math.max(...us), 0.12);
    const dv = padDomain(Math.min(...vs), Math.max(...vs), 0.12);

    // ── frame geometry ─────────────────────────────────────────────────────────
    const W = 480;
    const PAD_L = 20, PAD_R = 20, PAD_T = 34;
    const plotH = 300;
    const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };
    // map iso (u,v) into the box, preserving aspect so the rigid rotation doesn't shear visually.
    const sU = box.w / du.span, sV = box.h / dv.span;
    const s = Math.min(sU, sV);
    const cu = (du.min + du.max) / 2, cv = (dv.min + dv.max) / 2;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const projIso = (x, y, z) => { const p = iso(x, y, z); return { x: cx + (p.u - cu) * s, y: cy + (p.v - cv) * s }; };
    const originIso = projIso(0, 0, 0);

    // ── 2-D (final) scatter scaler for step 4 — same box, data (PC1,PC2) ────────
    const fx = final2d.map((p) => p[0]), fy = final2d.map((p) => p[1]);
    const dfx = padDomain(Math.min(...fx), Math.max(...fx), 0.12);
    const dfy = padDomain(Math.min(...fy), Math.max(...fy), 0.12);
    const scaleFlat = Math.min(box.w / dfx.span, box.h / dfy.span);
    const cfx = (dfx.min + dfx.max) / 2, cfy = (dfy.min + dfy.max) / 2;
    const proj2d = (px, py) => ({ x: cx + (px - cfx) * scaleFlat, y: cy - (py - cfy) * scaleFlat });

    const H = frameHeightFor(PAD_T + plotH + 16, 8);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg pcr-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // frame rect + title/subtitle
    layer('frame', 0);
    add('frame', el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'pcr-frame' }, svg));
    const ttl = el('text', { x: box.x, y: box.y - 12, class: 'pcr-title' }, svg);
    const sub = el('text', { x: box.x + box.w, y: box.y - 12, class: 'pcr-sub', 'text-anchor': 'end' }, svg);

    // ── the 3-D cloud (one dot per point) — re-projected every step as the cloud turns ──────────
    layer('cloud', 0, 3);
    const dots = cloud.map(() => add('cloud', el('circle', { r: 4.5, class: 'pcr-dot' }, svg)));

    // ── eigenvector axes (PC1/PC2/PC3) drawn from the origin, clamped to the box ────────────────
    // We rotate the eigenvectors by the SAME per-frame rotation as the cloud so the axes ride with
    // it. The rotation taking frame 0 → frame f is recovered numerically as it's the data's own
    // rotation; instead we draw the axes in each frame's own basis: at the aligned frame PC1 lies on
    // screen-x, PC2 on screen-y. We approximate the intermediate axis directions by interpolating
    // the projected axis tips (visually faithful: the arrows swing toward the screen axes).
    layer('axes', 1, 3);
    const AXLEN = 3.4;
    // aligned-frame axis tips (frac 1.0): PC1 = +x, PC2 = +y, PC3 = +z (the canonical aligned basis).
    const alignedTip = [ [AXLEN, 0, 0], [0, AXLEN, 0], [0, 0, AXLEN] ];
    // initial axis tips (frac 0.0): the eigenvectors themselves in the original data basis.
    const initTip = eigvec.map((v) => [v[0] * AXLEN, v[1] * AXLEN, v[2] * AXLEN]);
    const axisEls = [0, 1, 2].map((i) => {
      const g = el('g', {}, svg);
      const line = el('line', { class: 'pcr-axis', stroke: PC_COLOR[i], 'stroke-width': i === 2 ? 1.6 : 2.6 }, g);
      const lbl = el('text', { class: 'pcr-axislbl', fill: PC_COLOR[i] }, g);
      lbl.textContent = `PC${i + 1}`;
      add('axes', g);
      return { line, lbl };
    });

    // ── per-axis variance % labels (step 3) ─────────────────────────────────────
    layer('varlabels', 3, 3);
    const varEls = [0, 1, 2].map((i) => {
      const t = add('varlabels', el('text', { class: 'pcr-varlbl', fill: PC_COLOR[i] }, svg));
      if (typeof evPct[i] === 'number') t.textContent = `PC${i + 1}: ${evPct[i].toFixed(2)}%`;
      return t;
    });

    // ── 2-D projected scatter (step 4) ──────────────────────────────────────────
    layer('flat', 4, 4);
    // axis cross for the flat view
    add('flat', el('line', { x1: box.x + 10, y1: cy, x2: box.x + box.w - 10, y2: cy, class: 'pcr-flataxis' }, svg));
    add('flat', el('line', { x1: cx, y1: box.y + 10, x2: cx, y2: box.y + box.h - 10, class: 'pcr-flataxis' }, svg));
    add('flat', el('text', { x: box.x + box.w - 6, y: cy - 6, class: 'pcr-flatlbl', 'text-anchor': 'end' }, svg)).textContent = 'PC1';
    add('flat', el('text', { x: cx + 6, y: box.y + 18, class: 'pcr-flatlbl' }, svg)).textContent = 'PC2';
    final2d.forEach((p) => {
      const q = proj2d(p[0], p[1]);
      add('flat', el('circle', { cx: q.x, cy: q.y, r: 4.5, class: 'pcr-flatdot' }, svg));
    });
    // headline: 97.21% kept (from data.var2dPct)
    const flatHead = add('flat', el('text', { x: box.x + 8, y: box.y + box.h - 10, class: 'pcr-flathead' }, svg));
    if (typeof var2d === 'number')
      flatHead.textContent = (labels.kept2d || 'PC1 + PC2 keep') + ' ' + var2d.toFixed(2) + '%';

    // place the rotating dots + eigenvector axes for a given frame index + interpolation toward it.
    function placeFrame(fi) {
      const pts = ptsAt(fi);
      dots.forEach((d, i) => {
        const p = pts[i] || cloud[i] || [0, 0, 0];
        const q = projIso(p[0], p[1], p[2]);
        d.setAttribute('cx', q.x); d.setAttribute('cy', q.y);
      });
      // interpolate each axis tip between its initial (data basis) and aligned (screen basis)
      // position by the frame's fraction, so the arrows visibly swing as the cloud turns.
      const frac = (frames[fi] && typeof frames[fi].frac === 'number') ? frames[fi].frac : 0;
      axisEls.forEach((ax, i) => {
        const t0 = initTip[i] || [0, 0, 0], t1 = alignedTip[i];
        const tip = [0, 1, 2].map((d) => t0[d] + (t1[d] - t0[d]) * frac);
        const tp = projIso(tip[0], tip[1], tip[2]);
        const seg = clampSegmentToRect(originIso.x, originIso.y, tp.x, tp.y, box);
        if (seg) {
          ax.line.setAttribute('x1', seg.x1); ax.line.setAttribute('y1', seg.y1);
          ax.line.setAttribute('x2', seg.x2); ax.line.setAttribute('y2', seg.y2);
          ax.lbl.setAttribute('x', seg.x2 + (seg.x2 >= originIso.x ? 4 : -4));
          ax.lbl.setAttribute('y', seg.y2 - 4);
          ax.lbl.setAttribute('text-anchor', seg.x2 >= originIso.x ? 'start' : 'end');
          ax.line.classList.remove('is-hidden'); ax.lbl.classList.remove('is-hidden');
        } else {
          ax.line.classList.add('is-hidden'); ax.lbl.classList.add('is-hidden');
        }
      });
      // park the per-axis variance labels near each aligned axis tip (used only at step 3).
      varEls.forEach((t, i) => {
        const t1 = alignedTip[i];
        const tp = projIso(t1[0] * 0.62, t1[1] * 0.62, t1[2] * 0.62);
        t.setAttribute('x', Math.max(box.x + 4, Math.min(box.x + box.w - 86, tp.x)));
        t.setAttribute('y', Math.max(box.y + 14, Math.min(box.y + box.h - 6, tp.y)));
      });
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const n of L.nodes) n.classList.toggle('is-hidden', !on);
      }
      if (k <= 3) placeFrame(frameForStep[k]);

      if (k === 0) { ttl.textContent = labels.t3d || '3-D cloud'; sub.textContent = labels.subCorr || 'correlated'; }
      else if (k === 1) { ttl.textContent = labels.tAxes || 'principal axes'; sub.textContent = 'PC1 · PC2 · PC3'; }
      else if (k === 2) { ttl.textContent = labels.tRotate || 'rotating…'; sub.textContent = labels.subRigid || 'rigid turn'; }
      else if (k === 3) { ttl.textContent = labels.tAligned || 'axes aligned'; sub.textContent = labels.subAligned || 'PCs on screen axes'; }
      else { ttl.textContent = labels.tFlat || 'projected to 2-D'; sub.textContent = (typeof var2d === 'number') ? `${var2d.toFixed(2)}% ${labels.varKept || 'kept'}` : ''; }
    };
  },
});
