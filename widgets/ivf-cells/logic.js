/* ivf-cells/logic.js — L9 'climb-ivf' beat: an inverted file (IVF) carves the space into nlist=3
   Voronoi cells; a query is probed against the nprobe nearest cells, and recall@3 climbs as nprobe
   grows. The committed toy geometry (2 of the 3 true NN in cell c0, the 3rd just across the border in
   c1, and c1 the 2nd-nearest cell) makes recall jump 0.6667 → 1.0 from nprobe 1 → 2 — provenance_l9
   pins all three conditions.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. Every coordinate/recall comes from
   data/l9-ivf.json (facts-gated, recomputed by provenance_l9); all human text from i18n `labels`.

   Steps (maxStep = 3):
     0  → the 9 points coloured by cell + the 3 centroids.                                  s0
     1  → the query lands in its cell (c0).                                                  s1
     2  → nprobe = 1: probe c0 only → 2 of 3 true NN found → recall@3 = 0.6667.              s2
     3  → nprobe = 2: also probe c1 (the 2nd-nearest cell) → 3 of 3 → recall@3 = 1.0.        s3

   VARIANT (backward-compatible): the original `toy` path is the DEFAULT. A new slide may pass
   `labels.variant === 'toy2'` to select the 20-point, 5-centroid sweep on `data.toy2` (maxStep = 6):
     0  → the 20 points coloured by 5 cells + the 5 centroids.                               t0
     1  → the query (★) lands in its cell; its 5 true-NN are ringed.                         t1
     2..6 → nprobe = 1,2,3,4,5: light the probed cells (in cellRankByDist order), mark each
            true-NN found/missed, and read recall + pointsScanned per step (recall climbs
            0.6 → 0.8 → 1.0 → 1.0 → 1.0).                                                    t2..t6
   When `variant !== 'toy2'` NOTHING below changes — the 9-point path renders byte-identically. */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

const CELL_CLS = ['iv-c0', 'iv-c1', 'iv-c2'];     // 3 neutral category colours (accent / amber / violet)
const CELL_CLS5 = ['iv-c0', 'iv-c1', 'iv-c2', 'iv-c3', 'iv-c4'];  // toy2: 5 neutral category colours

export const mountIvfCells = defineWidget({
  id: 'ivf-cells',
  rootClass: 'iv-root',
  exportName: 'mountIvfCells',
  maxStep: 6,                       // toy2 walks 0..6; the toy path clamps itself to 0..3 (back-compat)
  render(ctx) {
    if ((ctx.labels && ctx.labels.variant) === 'toy2') return renderToy2(ctx);
    return renderToy(ctx);
  },
});

// ── ORIGINAL 9-point / 3-cell path (DEFAULT — unchanged; byte-identical render) ──
function renderToy({ host, data, labels, el }) {
    const toy = data.toy || data;
    const pts = toy.points || [];
    const assign = toy.assign || [];
    const cents = toy.centroids || [];
    const q = toy.query || [0, 0];
    const trueNN = toy.trueNN || [];
    const rank = toy.cellRankByDist || cents.map((_, i) => i);
    const probe = toy.probe || {};

    const W = 480, PAD = 22, plotH = 270;
    const xs = pts.map((p) => p[0]).concat(cents.map((c) => c[0]), q[0]);
    const ys = pts.map((p) => p[1]).concat(cents.map((c) => c[1]), q[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.14);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const box = { x: PAD, y: 28, w: W - 2 * PAD, h: plotH };
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

    const readTop = box.y + box.h + 18;
    const H = frameHeightFor(readTop + 22, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg iv-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── cell regions: a translucent bounding circle per cell (over its member points + its centroid) ──
    const cellRegion = cents.map((c, ci) => {
      const members = pts.filter((_, i) => assign[i] === ci).concat([c]);
      const mx = members.reduce((a, p) => a + sx(p[0]), 0) / members.length;
      const my = members.reduce((a, p) => a + sy(p[1]), 0) / members.length;
      const r = Math.max(28, ...members.map((p) => Math.hypot(sx(p[0]) - mx, sy(p[1]) - my))) + 16;
      return el('circle', { cx: mx, cy: my, r, class: 'iv-cell ' + CELL_CLS[ci] }, svg);
    });

    // ── points coloured by cell; true-NN points get a ring ──
    const ptEl = pts.map((p, i) => {
      const g = el('g', { class: 'iv-pt ' + CELL_CLS[assign[i]] }, svg);
      if (trueNN.includes(i)) el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 11, class: 'iv-nnring' }, g);
      el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 6, class: 'iv-dot' }, g);
      return g;
    });

    // ── centroids (◇) ──
    cents.forEach((c, ci) => {
      const cx = sx(c[0]), cy = sy(c[1]);
      el('path', { d: `M${cx} ${cy - 9} L${cx + 9} ${cy} L${cx} ${cy + 9} L${cx - 9} ${cy} Z`, class: 'iv-cent ' + CELL_CLS[ci] }, svg);
      el('text', { x: cx, y: cy - 13, class: 'iv-clbl', 'text-anchor': 'middle' }, svg).textContent = 'c' + ci;
    });

    // ── query marker (★) ──
    const qx = sx(q[0]), qy = sy(q[1]);
    const qEl = el('g', { class: 'iv-queryg is-hidden' }, svg);
    el('circle', { cx: qx, cy: qy, r: 7, class: 'iv-query' }, qEl);
    el('text', { x: qx + 11, y: qy + 4, class: 'iv-qlbl' }, qEl).textContent = labels.query || 'query';

    const readHead = el('text', { x: PAD, y: readTop, class: 'iv-readhead' }, svg);

    // mark found / missed true-NN given a set of probed cells
    function applyProbe(nprobe) {
      const cells = (probe[String(nprobe)] && probe[String(nprobe)].cells) || rank.slice(0, nprobe);
      cellRegion.forEach((c, ci) => c.classList.toggle('is-probed', cells.includes(ci)));
      cellRegion.forEach((c, ci) => c.classList.toggle('is-dim', !cells.includes(ci)));
      ptEl.forEach((g, i) => {
        const inProbed = cells.includes(assign[i]);
        g.classList.toggle('is-dim', !inProbed);
        if (trueNN.includes(i)) {
          g.classList.toggle('is-found', inProbed);
          g.classList.toggle('is-missed', !inProbed);
        }
      });
      const rec = probe[String(nprobe)] ? probe[String(nprobe)].recall : 0;
      const found = probe[String(nprobe)] ? probe[String(nprobe)].found.length : 0;
      readHead.textContent = `nprobe = ${nprobe} · ${labels.probed || 'probe cells'} {${cells.map((c) => 'c' + c).join(', ')}} · `
        + `${labels.found || 'found'} ${found}/${trueNN.length} · recall@${toy.k || 3} = ${rec}`;
    }
    function clearProbe(msg) {
      cellRegion.forEach((c) => c.classList.remove('is-probed', 'is-dim'));
      ptEl.forEach((g) => g.classList.remove('is-dim', 'is-found', 'is-missed'));
      readHead.textContent = msg || '';
    }

    return function update(k0) {
      const k = Math.min(k0, 3);              // toy path has only 4 steps; clamp the shared maxStep=6
      qEl.classList.toggle('is-hidden', k < 1);
      if (k <= 0) clearProbe(labels.readPoints || '9 vectors, assigned to the nearest of 3 centroids (cells)');
      else if (k === 1) clearProbe(`${labels.qLands || 'the query lands in its cell'}: c${toy.queryCell != null ? toy.queryCell : 0}`);
      else applyProbe(Math.min(k - 1, 2));   // k=2 → nprobe 1, k=3 → nprobe 2
    };
}

/* ── NEW: 20-point / 5-cell nprobe sweep (toy2). The 5 true-NN are spread across the first 3 cells (by
   centroid-to-query distance), so probing more cells climbs recall 0.6 → 0.8 → 1.0. We step nprobe 1→5,
   lighting the probed cells in cellRankByDist order, marking each true-NN found/missed, and reading
   recall + pointsScanned per step. All geometry/recall/scanned come from data.toy2 (l9-ivf.json).      */
function renderToy2({ host, data, labels, el }) {
  const toy = data.toy2 || {};
  const pts = toy.points || [];
  const assign = toy.assign || [];
  const cents = toy.centroids || [];
  const q = toy.query || [0, 0];
  const trueNN = toy.trueNN || [];
  const rank = toy.cellRankByDist || cents.map((_, i) => i);
  const sweep = toy.sweep || [];
  const k = toy.k || 5;
  const cls = (ci) => CELL_CLS5[ci % CELL_CLS5.length];

  const W = 480, PAD = 22, plotH = 280, topPad = 44;   // top pad 28→44: a cell bounding-circle
  // (its centre is the member-mean, radius reaches the farthest member + 14) can extend ABOVE the
  // plot box; 44px of headroom keeps the topmost cell (c2) inside the viewBox (was overrunning ~6px).
  const xs = pts.map((p) => p[0]).concat(cents.map((c) => c[0]), q[0]);
  const ys = pts.map((p) => p[1]).concat(cents.map((c) => c[1]), q[1]);
  const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.14);
  const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
  const box = { x: PAD, y: topPad, w: W - 2 * PAD, h: plotH };
  const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
  const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

  const readTop = box.y + box.h + 18, readRow = 18;
  const H = frameHeightFor(readTop + 2 * readRow, 12);
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg iv-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

  // ── cell regions: a dashed bounding circle per cell (over its members + its centroid) ──
  const cellRegion = cents.map((c, ci) => {
    const members = pts.filter((_, i) => assign[i] === ci).concat([c]);
    const mx = members.reduce((a, p) => a + sx(p[0]), 0) / members.length;
    const my = members.reduce((a, p) => a + sy(p[1]), 0) / members.length;
    const r = Math.max(24, ...members.map((p) => Math.hypot(sx(p[0]) - mx, sy(p[1]) - my))) + 14;
    return el('circle', { cx: mx, cy: my, r, class: 'iv-cell ' + cls(ci) }, svg);
  });

  // ── points coloured by cell; true-NN points get a ring ──
  const ptEl = pts.map((p, i) => {
    const g = el('g', { class: 'iv-pt ' + cls(assign[i]) }, svg);
    if (trueNN.includes(i)) el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 10, class: 'iv-nnring' }, g);
    el('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 5.5, class: 'iv-dot' }, g);
    return g;
  });

  // ── centroids (◇) ──
  cents.forEach((c, ci) => {
    const cx = sx(c[0]), cy = sy(c[1]);
    el('path', { d: `M${cx} ${cy - 8} L${cx + 8} ${cy} L${cx} ${cy + 8} L${cx - 8} ${cy} Z`, class: 'iv-cent ' + cls(ci) }, svg);
    el('text', { x: cx, y: cy - 12, class: 'iv-clbl', 'text-anchor': 'middle' }, svg).textContent = 'c' + ci;
  });

  // ── query marker (★) ──
  const qx = sx(q[0]), qy = sy(q[1]);
  const qEl = el('g', { class: 'iv-queryg is-hidden' }, svg);
  el('circle', { cx: qx, cy: qy, r: 7, class: 'iv-query' }, qEl);
  el('text', { x: qx + 11, y: qy + 4, class: 'iv-qlbl' }, qEl).textContent = labels.query || 'query';

  const readHead = el('text', { x: PAD, y: readTop, class: 'iv-readhead' }, svg);
  const readSub = el('text', { x: PAD, y: readTop + readRow, class: 'iv-readhead' }, svg);

  // mark found / missed given the sweep entry for an nprobe value
  function applyStep(s) {
    const cells = s.cellsProbed || rank.slice(0, s.nprobe);
    const found = s.found || [];
    cellRegion.forEach((c, ci) => {
      c.classList.toggle('is-probed', cells.includes(ci));
      c.classList.toggle('is-dim', !cells.includes(ci));
    });
    ptEl.forEach((g, i) => {
      const inProbed = cells.includes(assign[i]);
      g.classList.toggle('is-dim', !inProbed);
      if (trueNN.includes(i)) {
        g.classList.toggle('is-found', found.includes(i));
        g.classList.toggle('is-missed', !found.includes(i));
      }
    });
    readHead.textContent = `nprobe = ${s.nprobe} · ${labels.probed || 'probe cells'} {${cells.map((c) => 'c' + c).join(', ')}}`;
    readSub.textContent = `${labels.scanned || 'points scanned'} ${s.pointsScanned} · ${labels.found || 'found'} ${found.length}/${trueNN.length} · recall@${k} = ${s.recall}`;
  }
  function clearProbe(head, sub) {
    cellRegion.forEach((c) => c.classList.remove('is-probed', 'is-dim'));
    ptEl.forEach((g) => g.classList.remove('is-dim', 'is-found', 'is-missed'));
    readHead.textContent = head || '';
    readSub.textContent = sub || '';
  }

  return function update(kk) {
    qEl.classList.toggle('is-hidden', kk < 1);
    if (kk <= 0) {
      clearProbe(labels.readPoints5 || `${pts.length} vectors, assigned to the nearest of ${cents.length} centroids (cells)`, '');
    } else if (kk === 1) {
      clearProbe(`${labels.qLands || 'the query lands in its cell'}: c${toy.queryCell != null ? toy.queryCell : 0}`,
        `${labels.trueNNlbl || 'true nearest neighbours'} (k=${k}): ${trueNN.length} ${labels.ringed || 'ringed'}`);
    } else {
      const idx = Math.min(kk - 2, sweep.length - 1);   // kk=2 → sweep[0] (nprobe 1) … kk=6 → sweep[4] (nprobe 5)
      if (sweep[idx]) applyStep(sweep[idx]);
    }
  };
}
