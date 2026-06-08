/* contrastive-space/logic.js — L6 'climb-contrastive' beat: shape the embedding space FOR retrieval.
   Sir Cosine powers the metric. The anchor "cat" sits at the centre; every other word is placed by
   its cosine to the anchor — a literal angle (cos = 1 → same ray, cos = 0 → a right angle). Then
   the contrastive objective PULLS the positives in and PUSHES the negatives out, and we read off
   the InfoNCE loss (with the triplet loss as a foil).

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY number — the cosines, pPositive 0.8877, InfoNCE loss
   0.1191, the triplet loss, τ and the margin — comes straight from data/l6-contrastive.json (the
   same source the facts-gate checks). All human text comes from i18n `labels`.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountContrastiveSpace registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → the anchor "cat" + the positives and negatives as points (angle = cosine). caption s0
     1  → the cosines as bars: positives high, negatives low.                         caption s1
     2  → PULL the positive in / PUSH the negatives out (arrows + a "trained" ghost).  caption s2
     3  → the InfoNCE loss 0.1191 (cosine inside it) + the triplet loss as a foil.    caption s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountContrastiveSpace = defineWidget({
  id: 'contrastive-space',
  rootClass: 'cs-root',
  exportName: 'mountContrastiveSpace',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const anchor = data.anchor || 'cat';
    const tau = data.tau != null ? data.tau : 0.1;
    const margin = data.margin != null ? data.margin : 0.2;
    const simsP = (data.sims && data.sims.positives) || {};
    const simsN = (data.sims && data.sims.negatives) || {};
    const info = data.infoNCE || {};
    const trip = data.triplet || {};

    // render a cosine exactly as stored (0.6386 → ".639"): 3 places, leading 0 dropped.
    const cos = (c) => (typeof c !== 'number' ? '' : String(+c.toFixed(3)).replace(/^0\./, '.').replace(/^-0\./, '-.'));
    const num4 = (c) => (typeof c !== 'number' ? '' : String(+c.toFixed(4)));

    // flatten into a list, each tagged pos/neg, sorted by cosine (high → low) for tidy placement.
    const items = [
      ...Object.entries(simsP).map(([word, c]) => ({ word, cos: c, kind: 'pos' })),
      ...Object.entries(simsN).map(([word, c]) => ({ word, cos: c, kind: 'neg' })),
    ].sort((a, b) => b.cos - a.cos);
    const posItem = info.positive || (items.find((i) => i.kind === 'pos') || {}).word;

    // ── geometry ───────────────────────────────────────────────────────────
    // The anchor sits at the LEFT-centre; the neighbours fan out across evenly-spaced rays in the
    // right half-disc. We use the cosine for the RADIUS (high cos → near the anchor, low cos →
    // far), and even angular spacing so the five labels never pile up. "Near = related" — Sir
    // Cosine's ruler made geometric, and a clean canvas for the pull/push arrows.
    const W = 480;
    const PAD = 16;
    const scTop = 24, scH = 196;
    const ox = PAD + 18, oy = scTop + scH / 2;    // anchor origin (left-centre)
    const Rmin = 44, Rmax = scH / 2 - 8;          // radius band: cos 1 → Rmin, cos 0 → Rmax

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg cs-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── STEP 0: anchor + neighbours, radius = closeness, fanned by even angle ──
    layer('scatter', 0);
    // faint radial guides at Rmin and Rmax (the "near" and "far" shells), each a right half-circle
    // sweeping from the top of the disc (ox, oy−r) down to the bottom (ox, oy+r).
    [Rmin, Rmax].forEach((r) => add('scatter', el('path',
      { d: `M ${ox} ${oy - r} A ${r} ${r} 0 0 1 ${ox} ${oy + r}`,
        class: 'cs-arc', fill: 'none' }, svg)));
    // the anchor dot + label
    add('scatter', el('circle', { cx: ox, cy: oy, r: 8, class: 'cs-anchor' }, svg));
    add('scatter', el('text', { x: ox + 4, y: oy + 26, class: 'cs-anchor-lbl',
      'text-anchor': 'middle' }, svg)).textContent = anchor;

    // even angular fan across the right half-disc (top → bottom), one ray per item.
    const N = items.length;
    const placed = items.map((it, i) => {
      const frac = N > 1 ? i / (N - 1) : 0.5;            // 0 (top) … 1 (bottom)
      const ang = -Math.PI / 2 + frac * Math.PI;          // -90° … +90°
      const r = Rmin + (1 - Math.max(0, Math.min(1, it.cos))) * (Rmax - Rmin);
      const px = ox + r * Math.cos(ang);
      const py = oy + r * Math.sin(ang);
      const cls = it.kind === 'pos' ? 'cs-pos' : 'cs-neg';
      const g = el('g', {}, svg);
      el('line', { x1: ox, y1: oy, x2: px, y2: py, class: `cs-ray ${cls}` }, g);
      el('circle', { cx: px, cy: py, r: 6, class: `cs-pt ${cls}` }, g);
      // label to the right of the point, clamped so the longest word stays in-frame.
      const lx = Math.min(px + 10, W - PAD - 132);
      el('text', { x: lx, y: py + 4, class: `cs-pt-lbl ${cls}` }, g).textContent = it.word;
      add('scatter', g);
      return { ...it, px, py };
    });
    // a legend chip in the top-right corner, sized to fit the labels within the frame.
    const legW = 124, legX = W - PAD - legW;
    add('scatter', el('rect', { x: legX, y: scTop, width: legW, height: 34, rx: 6,
      class: 'cs-legbox' }, svg));
    add('scatter', el('circle', { cx: legX + 12, cy: scTop + 11, r: 5, class: 'cs-pt cs-pos' }, svg));
    add('scatter', el('text', { x: legX + 22, y: scTop + 15, class: 'cs-leglbl' }, svg))
      .textContent = labels.posLeg || 'positive';
    add('scatter', el('circle', { cx: legX + 12, cy: scTop + 26, r: 5, class: 'cs-pt cs-neg' }, svg));
    add('scatter', el('text', { x: legX + 22, y: scTop + 30, class: 'cs-leglbl' }, svg))
      .textContent = labels.negLeg || 'negative';

    // ── STEP 2: pull/push arrows (drawn here so they overlay the scatter) ─────
    layer('forces', 2);
    placed.forEach((p) => {
      const pull = p.kind === 'pos';
      // arrow direction: positives pulled toward the anchor, negatives pushed away.
      const ux = (p.px - ox) / Math.hypot(p.px - ox, p.py - oy);
      const uy = (p.py - oy) / Math.hypot(p.px - ox, p.py - oy);
      const len = 18;
      const sx = pull ? p.px - ux * 6 : p.px + ux * 6;
      const sy = pull ? p.py - uy * 6 : p.py + uy * 6;
      const ex = pull ? sx - ux * len : sx + ux * len;
      const ey = pull ? sy - uy * len : sy + uy * len;
      const cls = pull ? 'cs-arr cs-arr-pull' : 'cs-arr cs-arr-push';
      add('forces', el('line', { x1: sx, y1: sy, x2: ex, y2: ey, class: cls,
        'marker-end': pull ? 'url(#cs-pull)' : 'url(#cs-push)' }, svg));
    });
    // arrow-head defs
    const defs = el('defs', {}, svg);
    [['cs-pull', 'cs-arrhead-pull'], ['cs-push', 'cs-arrhead-push']].forEach(([id, cls]) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: cls }, m);
    });

    // ── STEP 1: cosine bars (below the scatter) ───────────────────────────────
    layer('bars', 1);
    const barsTop = scTop + scH + 24;
    const barRow = 24, barH = 14;
    const barX = PAD + 86;
    const barMaxW = W - barX - 60;
    add('bars', el('text', { x: PAD, y: barsTop - 8, class: 'cs-barshead' }, svg))
      .textContent = labels.barsHead || 'cosine to “' + anchor + '” — Sir Cosine’s ruler';
    items.forEach((it, i) => {
      const cy = barsTop + i * barRow;
      const g = el('g', {}, svg);
      el('text', { x: barX - 10, y: cy + barH - 2, class: `cs-pairlbl cs-${it.kind}`,
        'text-anchor': 'end' }, g).textContent = it.word;
      el('rect', { x: barX, y: cy, width: barMaxW, height: barH, rx: 3, class: 'cs-bartrack' }, g);
      const frac = Math.max(0, Math.min(1, it.cos));
      el('rect', { x: barX, y: cy, width: Math.max(2, frac * barMaxW), height: barH, rx: 3,
        class: `cs-barfill cs-bar-${it.kind}` }, g);
      el('text', { x: barX + barMaxW + 8, y: cy + barH - 2, class: 'cs-barval' }, g)
        .textContent = cos(it.cos);
      add('bars', g);
    });
    const barsBottom = barsTop + items.length * barRow;

    // ── STEP 3: the loss readout ──────────────────────────────────────────────
    layer('loss', 3);
    const lossTop = barsBottom + 14;
    add('loss', el('rect', { x: PAD, y: lossTop, width: W - 2 * PAD, height: 78, rx: 8,
      class: 'cs-lossbox' }, svg));
    // InfoNCE line
    add('loss', el('text', { x: PAD + 12, y: lossTop + 20, class: 'cs-loss-head' }, svg))
      .textContent = labels.infoHead || 'InfoNCE  (softmax over cosines, τ = ' + tau + ')';
    add('loss', el('text', { x: PAD + 12, y: lossTop + 38, class: 'cs-loss-line' }, svg))
      .textContent = (labels.infoLine || 'P(positive “{p}”) = {pp}   →   loss = {loss}')
        .replace('{p}', posItem || '')
        .replace('{pp}', num4(info.pPositive))
        .replace('{loss}', num4(info.loss));
    // triplet foil
    add('loss', el('text', { x: PAD + 12, y: lossTop + 58, class: 'cs-loss-head2' }, svg))
      .textContent = labels.tripHead || 'triplet  (margin = ' + margin + ', hardest neg)';
    add('loss', el('text', { x: PAD + 12, y: lossTop + 72, class: 'cs-loss-line2' }, svg))
      .textContent = (labels.tripLine || 'max(0, margin − (cos⁺ − cos⁻)) = {loss}  — already satisfied')
        .replace('{loss}', num4(trip.loss));

    const H = frameHeightFor(lossTop + 78, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // per-step update.
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      // once forces fire (step 2), nudge the positive ray to read as "pulled in" and the
      // negatives as "pushed out" via a CSS class on the scatter group.
      svg.classList.toggle('cs-trained', k >= 2);
    };
  },
});
