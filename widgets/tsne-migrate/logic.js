/* tsne-migrate/logic.js — L5 'climb-tsne' beat companion: t-SNE AS MIGRATION.
   The user's #2 complaint was that dimred shows only static end-states. dimred-projection plots the
   t-SNE END layout for the 44 real words; THIS widget shows the same algorithm MOVING — the points
   start at the PCA-init layout (scattered, clusters overlapping) and migrate, step by step, into 4
   clean meaning-islands as the iteration budget grows. Each scroll-step = one snapshot; every point
   is keyed by index so it slides from its prior position to the next (same dot, moving home).

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep, binds NO keyboard / NO
   scroll — the SLIDE driver (deck arrows) and the BOOK driver (Scrollama) both call setStep(k).
   EVERY coordinate comes straight from data/l5-tsne-migrate.json (the facts-gate source); no
   positions are invented. Human text is i18n. A separate 40-pt / 4-cluster toy set — distinct from
   dimred-projection's 44-word t-SNE.

   Built on widgets/_widget-base.js (host setup, caption/counter scaffold, setStep clamp,
   window.mountTsneMigrate registration); render() only draws the figure layers.

   Steps (maxStep = 3) — one snapshot per step:
     0 → snapshots[0] PCA init: scattered, clusters overlapping.                    caption s0
     1 → snapshots[1] iter 250: points drift toward true neighbours.                caption s1
     2 → snapshots[2] iter 500: clusters tighten, islands separate.                 caption s2
     3 → snapshots[3] iter 1000: 4 clean islands + the "gaps/sizes aren't distances" caveat. caption s3 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

// cluster index 0..3 → theme token (4 distinct categorical tokens). Order matches data.clusters.
const CLUSTER_COLOR = [
  'var(--c-amber, #E0A82E)',   // 0 animals
  'var(--c-violet, #7D5BA6)',  // 1 royalty
  'var(--c-green, #3A8A5C)',   // 2 tech
  'var(--accent, #2A6FDB)',    // 3 places
];

export const mountTsneMigrate = defineWidget({
  id: 'tsne-migrate',
  rootClass: 'tm-root',
  exportName: 'mountTsneMigrate',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const snaps = data.snapshots || [];
    const clusters = data.clusters || [];
    const colorOf = (c) => CLUSTER_COLOR[c] || 'var(--ink-3, #6B7280)';
    const N = (snaps[0] && snaps[0].points.length) || 0;

    // ── frame geometry ─────────────────────────────────────────────────────────
    const W = 480;
    const PAD_L = 20, PAD_R = 20, PAD_T = 30;
    const plotH = 300;
    const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };

    // ONE shared scaler across all snapshots (the data is already normalised to a tidy box), so the
    // points migrate within a fixed frame — no per-step rescale that would hide the motion.
    const allX = [], allY = [];
    snaps.forEach((s) => (s.points || []).forEach((p) => { allX.push(p.x); allY.push(p.y); }));
    const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.10);
    const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.10);
    const side = Math.min(box.w, box.h);                 // keep it square so distances read evenly
    const ox = box.x + (box.w - side) / 2, oy = box.y + (box.h - side) / 2;
    const sx = (vx) => ox + (vx - dx.min) / dx.span * side;
    const sy = (vy) => oy + side - (vy - dy.min) / dy.span * side;   // y up

    const H = frameHeightFor(PAD_T + plotH + 16, 8);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg tm-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // frame + title/subtitle
    layer('frame', 0);
    add('frame', el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'tm-frame' }, svg));
    const ttl = el('text', { x: box.x, y: box.y - 10, class: 'tm-title' }, svg);
    const sub = el('text', { x: box.x + box.w, y: box.y - 10, class: 'tm-sub', 'text-anchor': 'end' }, svg);

    // ── the migrating dots — keyed by index, color fixed by cluster, position set per snapshot ──
    layer('dots', 0);
    const dots = [];
    for (let i = 0; i < N; i++) {
      const c = (snaps[0].points[i] || {}).c;
      const init = snaps[0].points[i];
      dots.push(add('dots', el('circle', {
        cx: sx(init.x), cy: sy(init.y), r: 5,
        class: 'tm-dot', fill: colorOf(c), stroke: 'var(--bg-card, #fff)', 'stroke-width': 1,
      }, svg)));
    }

    // ── cluster legend (always up) ──────────────────────────────────────────────
    layer('legend', 0);
    const legX = box.x + 6, legY0 = box.y + 14;
    clusters.forEach((c, i) => {
      const ly = legY0 + i * 15;
      const g = el('g', {}, svg);
      el('rect', { x: legX, y: ly - 8, width: 9, height: 9, rx: 2, fill: colorOf(i) }, g);
      el('text', { x: legX + 14, y: ly, class: 'tm-leglbl' }, g).textContent = c;
      add('legend', g);
    });

    // ── caveat (step 3 only) — mirrors dimred-projection's tsneCaveat ───────────
    layer('caveat', 3, 3);
    const caveat = add('caveat', el('text', { x: box.x + box.w - 8, y: box.y + box.h - 10,
      class: 'tm-caveat', 'text-anchor': 'end' }, svg));
    caveat.textContent = labels.tsneCaveat || 'gaps & sizes are NOT distances';

    // move every dot to snapshot `k`'s positions (the CSS transition tweens the slide).
    function placeSnapshot(k) {
      const pts = (snaps[k] && snaps[k].points) || snaps[0].points;
      dots.forEach((d, i) => {
        const p = pts[i] || snaps[0].points[i];
        d.setAttribute('cx', sx(p.x));
        d.setAttribute('cy', sy(p.y));
      });
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const n of L.nodes) n.classList.toggle('is-hidden', !on);
      }
      placeSnapshot(k);
      // title from the snapshot label (data), subtitle is the iter count.
      const snap = snaps[k] || {};
      ttl.textContent = snap.label || '';
      sub.textContent = (k === 0) ? (labels.scattered || 'scattered') : (labels.migrating || 'migrating');
    };
  },
});
