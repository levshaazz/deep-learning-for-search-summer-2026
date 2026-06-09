/* tsne-steps/logic.js — L5 'climb-tsne' beat companion: the MATH INSIDE t-SNE.
   The instructor's note: "t-SNE is explained too superficially — no step-by-step calc, no
   architecture, no visual examples." The sibling `tsne-migrate` widget shows the MIGRATION (points
   drifting into clusters); THIS widget teaches the ALGORITHM — the real t-SNE pipeline, every number
   taken from data/l5-tsne-math.json (computed on 9 real GloVe-50 words, anchor = 'cat'):

     0 → high-D neighbours of the anchor → GAUSSIAN conditional affinity p_(j|i): a bar per word
         (near = tall, far ≈ 0). Annotate: perplexity ≈ effective # of neighbours (σ tuned to it).
     1 → the low-D 2-D layout (a scatter) → STUDENT-t affinity q_ij (heavy tail): WHY heavy tails —
         the (1+d²)⁻¹ curve gives far points more room, fixing the crowding problem.
     2 → the KL(P‖Q) objective: overlay the anchor's q_ij bars on its p_ij bars — t-SNE pulls the
         low-D affinities to match the high-D ones. Show the REAL KL number.
     3 → the GRADIENT → points move: a force arrow on each low-D point (attractive where p>q,
         repulsive where p<q); tie to the migration tsne-migrate already shows.
     4 → the caveat (P7): perplexity changes the picture; gaps/sizes aren't global distances.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep, binds NO keyboard / NO
   scroll — the SLIDE driver (deck arrows) and the BOOK driver (Scrollama) both call setStep(k).
   EVERY number — σ 2.003, perplexity 5, KL 0.0411, the p/q rows, the gradient — comes straight from
   the data file (the facts-gate source). Human text is i18n. Built on widgets/_widget-base.js. */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor, clampSegmentToRect } from '../_plot-util.js';

// group → theme token (animal vs royalty; 2 distinct categorical hues, matches the house palette).
const GROUP_COLOR = {
  animal: 'var(--accent, #2A6FDB)',
  royalty: 'var(--c-violet, #7D5BA6)',
};
const P_COLOR = 'var(--accent, #2A6FDB)';     // high-D affinity p (bars)
const Q_COLOR = 'var(--warm-ink, #B4521F)';   // low-D Student-t affinity q (overlay)

export const mountTsneSteps = defineWidget({
  id: 'tsne-steps',
  rootClass: 'tss-root',
  exportName: 'mountTsneSteps',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const words = data.words || [];
    const groups = data.groups || [];
    const ai = data.anchorIndex || 0;
    const n = words.length;
    const cond = data.conditional || {};
    const pRow = cond.pRow || [];                       // conditional p_(j|i) for the anchor
    const qRow = (data.lowD && data.lowD.anchorRow) || []; // Student-t q_ij for the anchor
    const Y = (data.lowD && data.lowD.Y) || [];        // 2-D layout
    const grad = (data.gradient && data.gradient.all) || [];
    const colorOf = (i) => GROUP_COLOR[groups[i]] || 'var(--ink-3, #6B7280)';

    // ── frame geometry: a left BAR panel (affinities) + a right SCATTER panel (low-D + forces) ──
    const W = 480;
    const PAD_T = 34;
    const plotH = 300;
    const GAP = 20;
    const box = { x: 14, y: PAD_T, w: W - 28, h: plotH };
    const barBox = { x: box.x, y: box.y, w: 220, h: box.h };               // left: affinity bars
    const sctBox = { x: barBox.x + barBox.w + GAP, y: box.y,               // right: low-D scatter
      w: box.x + box.w - (barBox.x + barBox.w + GAP), h: box.h };

    const H = frameHeightFor(PAD_T + plotH + 16, 8);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg tss-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // shared title + subtitle (text varies per step in update()).
    const ttl = el('text', { x: box.x, y: box.y - 12, class: 'tss-title' }, svg);
    const sub = el('text', { x: box.x + box.w, y: box.y - 12, class: 'tss-sub', 'text-anchor': 'end' }, svg);

    // ─────────────────────────── LEFT: affinity bars (steps 0–2) ───────────────────────────
    // one horizontal bar per OTHER word; length ∝ affinity. p (high-D) is shown from step 0; the q
    // overlay (low-D) is added at step 2 so the KL "match these two" story is visible.
    layer('barpanel', 0, 2);
    add('barpanel', el('text', { x: barBox.x, y: barBox.y + 12, class: 'tss-panellbl' }, svg))
      .textContent = (labels.affinityFrom || 'affinity from') + ' "' + words[ai] + '"';

    const rows = [];
    for (let j = 0; j < n; j++) if (j !== ai) rows.push(j);
    const rowH = (barBox.h - 26) / rows.length;
    const barX = barBox.x + 64;                                            // labels left of the bars
    const barMaxW = barBox.x + barBox.w - barX - 30;                       // value text on the right
    const pMax = Math.max(...pRow, ...qRow, 1e-6);                         // shared scale so p & q compare

    layer('pbars', 0, 2);
    layer('qbars', 2, 2);                                                  // q overlay only at the KL step
    const pBarEls = {}, qBarEls = {}, pValEls = {};
    rows.forEach((j, r) => {
      const cy = barBox.y + 20 + r * rowH;
      // word label (coloured by its group so near animals read together)
      add('pbars', el('text', { x: barBox.x, y: cy + rowH * 0.62, class: 'tss-wordlbl',
        fill: colorOf(j) }, svg)).textContent = words[j];
      // p bar (high-D Gaussian affinity)
      const pw = (pRow[j] / pMax) * barMaxW;
      pBarEls[j] = add('pbars', el('rect', { x: barX, y: cy + rowH * 0.16, width: Math.max(1, pw),
        height: rowH * 0.34, rx: 2, class: 'tss-pbar', fill: P_COLOR }, svg));
      // p value (the real number, right of the bar)
      pValEls[j] = add('pbars', el('text', { x: barX + barMaxW + 4, y: cy + rowH * 0.46,
        class: 'tss-pval' }, svg));
      pValEls[j].textContent = pRow[j].toFixed(3);
      // q bar (low-D Student-t affinity) drawn just under the p bar — the KL overlay
      const qw = (qRow[j] / pMax) * barMaxW;
      qBarEls[j] = add('qbars', el('rect', { x: barX, y: cy + rowH * 0.52, width: Math.max(1, qw),
        height: rowH * 0.30, rx: 2, class: 'tss-qbar', fill: Q_COLOR }, svg));
    });

    // perplexity / σ annotation under the bars (step 0): the headline "effective # of neighbours".
    layer('perp', 0, 0);
    const perpLbl = add('perp', el('text', { x: barBox.x, y: barBox.y + barBox.h - 4,
      class: 'tss-perp' }, svg));
    if (typeof cond.perplexity === 'number' && typeof cond.sigma === 'number')
      perpLbl.textContent = 'σ=' + cond.sigma.toFixed(2) + ' · perplexity=' + cond.perplexity.toFixed(0)
        + ' ≈ ' + (labels.effNeighbours || 'eff. neighbours');

    // p/q legend at the KL step (which bar is which).
    layer('pqlegend', 2, 2);
    const legG = add('pqlegend', el('g', {}, svg));
    el('rect', { x: barBox.x, y: barBox.y + barBox.h - 12, width: 9, height: 9, rx: 2, fill: P_COLOR }, legG);
    el('text', { x: barBox.x + 13, y: barBox.y + barBox.h - 4, class: 'tss-leglbl' }, legG)
      .textContent = 'p (high-D)';
    el('rect', { x: barBox.x + 92, y: barBox.y + barBox.h - 12, width: 9, height: 9, rx: 2, fill: Q_COLOR }, legG);
    el('text', { x: barBox.x + 105, y: barBox.y + barBox.h - 4, class: 'tss-leglbl' }, legG)
      .textContent = 'q (low-D)';

    // ─────────────────────────── RIGHT: low-D scatter (steps 1–4) ───────────────────────────
    // The Student-t heavy-tail CURVE (step 1) + the 2-D points + per-point force arrows (step 3).
    layer('sctpanel', 1);
    add('sctpanel', el('rect', { x: sctBox.x, y: sctBox.y, width: sctBox.w, height: sctBox.h,
      class: 'tss-frame' }, svg));
    add('sctpanel', el('text', { x: sctBox.x + sctBox.w / 2, y: sctBox.y - 2, class: 'tss-panellbl',
      'text-anchor': 'middle' }, svg)).textContent = labels.lowDLayout || 'low-D layout';

    // scatter scaler (square, centred — same approach as tsne-migrate).
    const xs = Y.map((p) => p[0]), ys = Y.map((p) => p[1]);
    const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.16);
    const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.16);
    const side = Math.min(sctBox.w, sctBox.h) - 8;
    const ox = sctBox.x + (sctBox.w - side) / 2, oy = sctBox.y + (sctBox.h - side) / 2;
    const sx = (vx) => ox + (vx - dx.min) / dx.span * side;
    const sy = (vy) => oy + side - (vy - dy.min) / dy.span * side;       // y up

    // ── Student-t heavy-tail curve (step 1 only) — a small inset showing (1+d²)⁻¹ vs a Gaussian,
    //    so "heavy tail = far points keep some affinity = room for clusters" is visual, not asserted.
    layer('ttail', 1, 1);
    const insW = side * 0.92, insH = 52, insX = ox + (side - insW) / 2, insY = oy + side - insH - 4;
    add('ttail', el('rect', { x: insX, y: insY, width: insW, height: insH, class: 'tss-inset' }, svg));
    const tcurve = (d) => 1 / (1 + d * d);                                 // Student-t numerator
    const gcurve = (d) => Math.exp(-d * d);                                // Gaussian (for contrast)
    const DMAX = 3.2;
    const cxAt = (d) => insX + (d / DMAX) * insW;
    const cyAt = (v) => insY + insH - v * (insH - 6) - 3;
    const pathOf = (fn) => {
      let dStr = '';
      for (let s = 0; s <= 40; s++) { const d = (s / 40) * DMAX;
        dStr += (s === 0 ? 'M' : 'L') + cxAt(d).toFixed(1) + ' ' + cyAt(fn(d)).toFixed(1) + ' '; }
      return dStr.trim();
    };
    add('ttail', el('path', { d: pathOf(gcurve), class: 'tss-gauss', fill: 'none' }, svg));
    add('ttail', el('path', { d: pathOf(tcurve), class: 'tss-tstud', fill: 'none', stroke: Q_COLOR }, svg));
    add('ttail', el('text', { x: insX + insW - 3, y: insY + 11, class: 'tss-curvelbl', fill: Q_COLOR,
      'text-anchor': 'end' }, svg)).textContent = 'Student-t';
    add('ttail', el('text', { x: insX + insW - 3, y: insY + insH - 4, class: 'tss-curvelbl',
      'text-anchor': 'end' }, svg)).textContent = labels.heavyTail || 'heavy tail';

    // ── the 2-D points (steps 1+) ──
    layer('dots', 1);
    const dots = [];
    Y.forEach((p, i) => {
      dots.push(add('dots', el('circle', { cx: sx(p[0]), cy: sy(p[1]),
        r: i === ai ? 6 : 4.5, class: i === ai ? 'tss-dot tss-anchor' : 'tss-dot',
        fill: colorOf(i), stroke: 'var(--bg-card, #fff)', 'stroke-width': 1 }, svg)));
    });
    // anchor halo (so 'cat' is locatable in every scatter step)
    add('dots', el('circle', { cx: sx(Y[ai][0]), cy: sy(Y[ai][1]), r: 10, class: 'tss-halo',
      fill: 'none', stroke: colorOf(ai) }, svg));

    // ── per-point GRADIENT force arrows (step 3) ──
    // descent moves each point by -η·∇C; we draw the arrow in that descent direction, length scaled
    // for visibility (the converged-layout gradients are tiny in magnitude). The arrow shows the
    // attractive/repulsive force — the mechanism behind the migration tsne-migrate already shows.
    layer('forces', 3, 3);
    const gmax = Math.max(1e-9, ...grad.map((g) => Math.hypot(g[0], g[1])));
    const ARROW = side * 0.20;                                             // max arrow length (screen px)
    const arrows = [];
    Y.forEach((p, i) => {
      const g = grad[i] || [0, 0];
      const gm = Math.hypot(g[0], g[1]) || 1e-9;
      // descent direction = -∇C; flip screen-y (sy is y-up). Scale by magnitude / gmax.
      const len = (gm / gmax) * ARROW;
      const ux = (-g[0] / gm) * len, uy = (g[1] / gm) * len;              // +y in screen = down → sy flips
      const x1 = sx(p[0]), y1 = sy(p[1]);
      const x2 = x1 + ux, y2 = y1 + uy;
      const seg = clampSegmentToRect(x1, y1, x2, y2, sctBox) || { x1, y1, x2, y2 };
      const g2 = el('g', {}, svg);
      el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, class: 'tss-force',
        'marker-end': 'url(#tss-arrowhead)' }, g2);
      arrows.push(add('forces', g2));
    });
    // arrowhead marker (defined once in <defs>)
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'tss-arrowhead', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', class: 'tss-arrowfill' }, mk);

    // ── KL headline (step 2) — the real cost number, under the scatter ──
    layer('klhead', 2, 2);
    const klHead = add('klhead', el('text', { x: sctBox.x + sctBox.w / 2, y: sctBox.y + sctBox.h - 6,
      class: 'tss-klhead', 'text-anchor': 'middle' }, svg));
    if (typeof data.kl === 'number')
      klHead.textContent = 'KL(P‖Q) = ' + data.kl.toFixed(4);

    // ── caveat (step 4) — perplexity changes the picture; gaps/sizes aren't global ──
    layer('caveat', 4, 4);
    const caveat = add('caveat', el('text', { x: sctBox.x + sctBox.w / 2, y: sctBox.y + sctBox.h - 6,
      class: 'tss-caveat', 'text-anchor': 'middle' }, svg));
    caveat.textContent = labels.tsneCaveat || 'perplexity changes the picture';

    // ─────────────────────────── per-step update ───────────────────────────
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const node of L.nodes) node.classList.toggle('is-hidden', !on);
      }
      // dim the q overlay everywhere except the KL step is handled by layer gating; nothing else here.
      if (k === 0) { ttl.textContent = labels.t0 || 'Gaussian affinity'; sub.textContent = labels.subHighD || 'high-D'; }
      else if (k === 1) { ttl.textContent = labels.t1 || 'Student-t affinity'; sub.textContent = labels.subLowD || 'low-D'; }
      else if (k === 2) { ttl.textContent = labels.t2 || 'match P to Q'; sub.textContent = labels.subKL || 'minimise KL'; }
      else if (k === 3) { ttl.textContent = labels.t3 || 'gradient = forces'; sub.textContent = labels.subForce || 'points move'; }
      else { ttl.textContent = labels.t4 || 'read with care'; sub.textContent = labels.subCaveat || 'P7'; }
    };
  },
});
