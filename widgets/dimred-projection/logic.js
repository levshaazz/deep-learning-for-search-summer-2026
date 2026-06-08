/* dimred-projection/logic.js — L5 'climb-pca' / 'climb-tsne' beats: fold a 300-D word space down
   to a picture you can read. The Cartographer's two methods, side by side in time.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep, binds NO keyboard / NO
   scroll — the SLIDE driver (deck arrows) and BOOK driver (Scrollama) both call setStep(k). Every
   NUMBER (the per-component explained-variance ratios, the 37.7% 2-D total, every point's x/y/cluster)
   comes from data/l5-dimred.json — the facts-gate source — so nothing can drift. Human text is i18n.

   Built on widgets/_widget-base.js (host setup, caption/counter scaffold, setStep clamp,
   window.mountDimredProjection registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → the 300-D "blur": a faint cloud — you cannot see 300 dimensions.            caption s0
     1  → PCA → the 2-D scatter (pca.points), colored by cluster; 37.7% variance kept. caption s1
     2  → the per-component explained-variance bars (pca.explainedVarRatio).           caption s2
     3  → t-SNE (tsne.points): tighter neighbor clusters — but its distances aren't global. caption s3 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

// fixed cluster → theme-token mapping (7 distinct categorical tokens). Order matches data.clusters.
const CLUSTER_COLOR = {
  royalty:   'var(--c-violet, #7D5BA6)',
  family:    'var(--c-pink, #C9447A)',
  animals:   'var(--c-amber, #E0A82E)',
  countries: 'var(--accent, #2A6FDB)',
  capitals:  'var(--c-cyan, #1AA7B5)',
  tech:      'var(--c-green, #3A8A5C)',
  transport: 'var(--c-red, #D7522C)',
};

export const mountDimredProjection = defineWidget({
  id: 'dimred-projection',
  rootClass: 'dr-root',
  exportName: 'mountDimredProjection',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const pca = data.pca || {};
    const tsne = data.tsne || {};
    const pcaPts = pca.points || [];
    const tsnePts = tsne.points || [];
    const evr = pca.explainedVarRatio || [];
    const clusters = data.clusters || Object.keys(CLUSTER_COLOR);
    const var2d = pca.var2dPct;
    const colorOf = (c) => CLUSTER_COLOR[c] || 'var(--ink-3, #6B7280)';

    // ── frame geometry ─────────────────────────────────────────────────────────
    const W = 480;
    const PAD_L = 20, PAD_R = 20, PAD_T = 30;
    const plotH = 280;                        // square-ish scatter region
    const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };

    // a scaler builder for a given point set, with padded domains so marks + labels stay in-frame.
    function scalerFor(pts) {
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.10);
      const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.12);
      return {
        sx: (vx) => box.x + (vx - dx.min) / dx.span * box.w,
        // y up: data +y → toward top of the box
        sy: (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h,
      };
    }
    const SP = scalerFor(pcaPts);
    const ST = scalerFor(tsnePts);

    // ── variance-bars region (step 2) — sized so the box grows to fit it ────────
    const barsTop = PAD_T + plotH + 44;
    const barRow = 19;
    const barH = 12;
    const barX = 92;                          // left edge of bar track (room for "PC1 19.6%")
    const barMaxW = W - barX - 60;
    // scale bar widths by the largest ratio so PC1 fills the track.
    const evrMax = evr.length ? Math.max(...evr) : 1;
    const nBars = Math.min(evr.length, 10);
    const barsBottom = barsTop + nBars * barRow;
    const H = frameHeightFor(barsBottom, 10);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg dr-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // shared scatter frame (hidden on step 2, where the variance bars take the stage).
    layer('scatterframe', 0, 1);             // re-enabled for step 3 in update()
    const frameRect = add('scatterframe', el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'dr-frame' }, svg));
    const ttl = el('text', { x: box.x, y: box.y - 10, class: 'dr-title' }, svg);
    const sub = el('text', { x: box.x + box.w, y: box.y - 10, class: 'dr-sub', 'text-anchor': 'end' }, svg);

    // ── step 0: the 300-D blur — a faint scattered cloud ───────────────────────
    layer('blur', 0, 0);
    // deterministic pseudo-random cloud (no Math.random → stable screenshots/tests)
    let seed = 1337;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < 90; i++) {
      const cx = box.x + 14 + rnd() * (box.w - 28);
      const cy = box.y + 14 + rnd() * (box.h - 28);
      add('blur', el('circle', { cx, cy, r: 3 + rnd() * 2, class: 'dr-blurdot' }, svg));
    }
    const blurLbl = add('blur', el('text', { x: box.x + box.w / 2, y: box.y + box.h / 2,
      class: 'dr-blurlbl', 'text-anchor': 'middle' }, svg));
    blurLbl.textContent = labels.blur300 || '300-D · unseeable';

    // ── point-cloud layer builder (PCA at step 1, t-SNE at step 3) ─────────────
    function scatter(name, from, to, pts, scaler) {
      layer(name, from, to);
      // label ONE well-separated anchor per cluster so the picture is readable AND no two labels
      // collide in either layout (cat/dog and france/paris sit on top of each other — label just one).
      const labelSet = new Set(['king', 'dog', 'germany', 'tokyo', 'computer', 'car', 'woman']);
      pts.forEach((p) => {
        add(name, el('circle', { cx: scaler.sx(p.x), cy: scaler.sy(p.y), r: 5,
          class: 'dr-dot', fill: colorOf(p.c), stroke: 'var(--bg-card, #fff)', 'stroke-width': 1 }, svg));
        if (labelSet.has(p.w)) {
          const t = add(name, el('text', { x: scaler.sx(p.x) + 7, y: scaler.sy(p.y) + 3,
            class: 'dr-ptlbl' }, svg));
          t.textContent = p.w;
        }
      });
    }
    scatter('pca', 1, 1, pcaPts, SP);
    scatter('tsne', 3, 3, tsnePts, ST);

    // t-SNE caveat note (inside the frame, bottom-left of the scatter)
    const caveat = add('tsne', el('text', { x: box.x + 8, y: box.y + box.h - 8,
      class: 'dr-caveat' }, svg));
    caveat.textContent = labels.tsneCaveat || 'distances not global';

    // ── cluster legend (shown whenever a colored scatter is up: steps 1 and 3) ──
    layer('legend', 1);
    // appears for PCA (1) and t-SNE (3) but NOT the variance bars (2): handled in update().
    const legX = box.x + 6, legY0 = box.y + 14;
    clusters.forEach((c, i) => {
      const ly = legY0 + i * 15;
      const g = el('g', {}, svg);
      el('rect', { x: legX, y: ly - 8, width: 9, height: 9, rx: 2, fill: colorOf(c) }, g);
      const t = el('text', { x: legX + 14, y: ly, class: 'dr-leglbl' }, g);
      t.textContent = c;
      add('legend', g);
    });

    // ── step 2: per-component explained-variance bars ──────────────────────────
    layer('bars', 2, 2);
    const bhead = add('bars', el('text', { x: PAD_L, y: PAD_T + plotH + 26, class: 'dr-barshead' }, svg));
    bhead.textContent = labels.evrTitle || 'PCA explained variance per component';
    evr.slice(0, nBars).forEach((v, i) => {
      const cy = barsTop + i * barRow;
      const g = el('g', {}, svg);
      const lab = el('text', { x: barX - 8, y: cy + barH - 2, class: 'dr-pclbl', 'text-anchor': 'end' }, g);
      lab.textContent = `PC${i + 1}`;
      el('rect', { x: barX, y: cy, width: barMaxW, height: barH, rx: 2, class: 'dr-bartrack' }, g);
      const w = Math.max(1, (v / evrMax) * barMaxW);
      // PC1 + PC2 are the two axes of the 2-D plot → highlight them.
      el('rect', { x: barX, y: cy, width: w, height: barH, rx: 2,
        class: `dr-barfill ${i < 2 ? 'dr-bar-2d' : 'dr-bar-rest'}` }, g);
      const val = el('text', { x: barX + barMaxW + 8, y: cy + barH - 2, class: 'dr-barval' }, g);
      val.textContent = (v * 100).toFixed(1) + '%';
      add('bars', g);
    });
    // the headline: PC1+PC2 = var2dPct of the variance
    const tot = add('bars', el('text', { x: PAD_L, y: barsTop - 8, class: 'dr-bartot' }, svg));
    if (typeof var2d === 'number')
      tot.textContent = (labels.first2 || 'PC1 + PC2 keep') + ' ' + var2d.toFixed(1) + '%';

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const n of L.nodes) n.classList.toggle('is-hidden', !on);
      }
      // legend rides with the colored scatters (steps 1 and 3), hidden on 0 and 2.
      const legendOn = k === 1 || k === 3;
      for (const n of layers.legend.nodes) n.classList.toggle('is-hidden', !legendOn);
      // the scatter frame is up for the cloud + both scatters (0,1,3), hidden for the bars (2).
      frameRect.classList.toggle('is-hidden', k === 2);

      // scatter title + subtitle per step
      if (k <= 0) { ttl.textContent = labels.t300 || '300-D space'; sub.textContent = ''; }
      else if (k === 1) {
        ttl.textContent = labels.tPca || 'PCA → 2-D';
        sub.textContent = (typeof var2d === 'number') ? `${var2d.toFixed(1)}% ${labels.varKept || 'variance kept'}` : '';
      } else if (k === 2) {
        ttl.textContent = labels.tEvr || 'per-component variance';
        sub.textContent = '';
      } else {
        ttl.textContent = labels.tTsne || 't-SNE → 2-D';
        sub.textContent = labels.neighbors || 'neighbors preserved';
      }
    };
  },
});
