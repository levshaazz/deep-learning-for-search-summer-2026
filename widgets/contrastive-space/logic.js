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

   Steps (maxStep = 4):
     0  → the anchor "cat" + the positives and negatives as points (angle = cosine). caption s0
     1  → the cosines as bars: positives high, negatives low.                         caption s1
     2  → the force: PULL arrows on the positives / PUSH arrows on the negatives, on   caption s2
           the ORIGINAL positions (the gradient drawn, nothing has moved yet).
     3  → the dots LAND at their trained positions — positives tighten around the      caption s3
           anchor, negatives slide out to the rim (the space actually re-shapes).
     4  → the InfoNCE loss 0.1191 (cosine inside it) + the triplet loss as a foil.    caption s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountContrastiveSpace = defineWidget({
  id: 'contrastive-space',
  rootClass: 'cs-root',
  exportName: 'mountContrastiveSpace',
  maxStep: 4,
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
    // FULL-PANEL DISC (defect-1 rework). The anchor sits at the CENTRE of a disc that fills the whole
    // panel width+height (the old half-disc cowered in the top-left ¼). Each neighbour is placed at
    // angle = its position on an even angular FAN and radius = its closeness (high cos → near the
    // anchor, low cos → out toward the rim) — "near = related", Sir Cosine's ruler made geometric.
    // EVERY label (anchor + positives + negatives) is then laid out by a force pass with LEADER LINES
    // (the same anchor+relaxation pattern as glove-cooccur) so no label sits on its dot OR on a
    // push/pull arrow shaft. The disc breathes; the cosine bars + loss below stay intact.
    const W = 480;
    const PAD = 16;
    const scTop = 22, scH = 250;                  // taller scatter band → the geometry breathes
    const cx0 = W / 2, cy0 = scTop + scH / 2;     // anchor at the panel CENTRE
    const Rmax = Math.min(W / 2 - PAD, scH / 2) - 22;  // rim radius (clear of the frame)
    const Rmin = 46;                              // cos 1 → Rmin (near), cos 0 → Rmax (far)

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg cs-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── shared angular fan: positives across the TOP hemisphere, negatives across the BOTTOM, so the
    //    gestalt "positives cluster / negatives scatter" is carried SPATIALLY (not by colour alone).
    //    Each kind gets an even sub-fan inset from the horizontal axis so no ray is dead-horizontal and
    //    the two groups never interleave. The SAME angles are reused for the trained layout (the dots
    //    only change RADIUS — they slide along their own ray), so the motion reads as a clean radial
    //    pull/push rather than a teleport. ──
    const posItems = items.filter((it) => it.kind === 'pos');
    const negItems = items.filter((it) => it.kind === 'neg');
    const fanAngle = (idx, n, a0, a1) => (n <= 1 ? (a0 + a1) / 2 : a0 + (idx / (n - 1)) * (a1 - a0));
    const angOf = (it) => {
      if (it.kind === 'pos') {                      // TOP hemisphere: angles in (-π, 0), inset 0.35
        const i = posItems.indexOf(it);
        return fanAngle(i, posItems.length, -Math.PI + 0.35, -0.35);
      }
      const i = negItems.indexOf(it);               // BOTTOM hemisphere: angles in (0, π), inset 0.35
      return fanAngle(i, negItems.length, 0.35, Math.PI - 0.35);
    };
    // ORIGINAL radius = closeness (high cos → near the anchor, low cos → out toward the rim).
    const rOrig = (it) => Rmin + (1 - Math.max(0, Math.min(1, it.cos))) * (Rmax - Rmin);
    // TRAINED radius: the objective pulls EVERY positive in toward the anchor and pushes EVERY negative
    // out to the rim. We do NOT collapse all positives to an identical Rmin (that stacked their labels
    // and tripped 8 OVERLAP HARDs) — each positive keeps its OWN ray (distinct angle) AND gets a small
    // per-index radial offset, so even two positives on near rays land at different (x,y) with their
    // labels well apart. Negatives splay out to just inside the rim, also per-index, along the bottom.
    const rTrained = (it) => {
      if (it.kind === 'pos') {
        const i = posItems.indexOf(it), n = Math.max(1, posItems.length);
        return Rmin + 6 + i * 22;                   // tight cluster near the anchor, each on its own shell
      }
      const i = negItems.indexOf(it), n = Math.max(1, negItems.length);
      return Rmax - 4 - i * 4;                       // splayed just inside the rim
    };

    const CHARW = 6.3, LBL_H = 14, GAP = 5, DOT_R = 6;
    const lblText = (w) => String(w);
    // the legend chip's fixed bounds (drawn later in the top-right of the scatter band) — declared HERE
    // so the relaxation pass can treat it as a static obstacle and never relax a label underneath it.
    const legW = 120, legH = 34, legX = W - PAD - legW, legY = scTop;
    const legBox = { x: legX, y: legY, w: legW, h: legH, cx: legX + legW / 2, cy: legY + legH / 2 };

    // place a neighbour at (angle, radius) and return its screen point + unit ray direction.
    const placeAt = (it, r) => {
      const ang = angOf(it);
      return { ...it, px: cx0 + r * Math.cos(ang), py: cy0 + r * Math.sin(ang),
        ux: Math.cos(ang), uy: Math.sin(ang), cls: it.kind === 'pos' ? 'cs-pos' : 'cs-neg' };
    };

    // distance from a point to a segment's closest point → for repelling a label off an arrow shaft.
    const segClosest = (px, py, x1, y1, x2, y2) => {
      const dx = x2 - x1, dy = y2 - y1;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((px - x1) * dx + (py - y1) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      return { qx: x1 + t * dx, qy: y1 + t * dy };
    };

    // ── reusable label-relaxation pass (run once per LAYOUT: original + trained). Seeds each label off
    //    its dot, then repels label↔label, label↔every dot, label↔legend, label↔every arrow segment, so
    //    no label overprints a dot/arrow/another label or stacks centre-on-centre. Returns the laid-out
    //    label boxes. (Same anchor+relaxation pattern as glove-cooccur.) ──
    const relaxLabels = (placedSet, arrowSet) => {
      const seeds = [];
      seeds.push({ word: anchor, ref: { dx: cx0, dy: cy0 }, ux: 0, uy: 1, off: 24,
        cls: 'cs-anchor-lbl svg-halo', isAnchor: true });
      placedSet.forEach((p) => {
        let sux = p.ux, suy = p.uy, off;
        if (p.kind === 'neg') {
          const rot = (p.uy <= 0 ? -1 : 1) * 0.9;          // ≈ 51° tangential lean off the radial
          const c = Math.cos(rot), s = Math.sin(rot);
          sux = p.ux * c - p.uy * s; suy = p.ux * s + p.uy * c;
          off = 34;
        } else {
          off = 30;
        }
        seeds.push({ word: p.word, ref: { dx: p.px, dy: p.py }, ux: sux, uy: suy, off,
          cls: `cs-pt-lbl svg-halo ${p.cls}`, isAnchor: false });
      });
      const lab = seeds.map((s) => ({
        w: Math.max(18, lblText(s.word).length * CHARW + 6), h: LBL_H,
        cx: s.ref.dx + s.ux * s.off, cy: s.ref.dy + s.uy * s.off, ...s,
      }));
      const allDots = [{ dx: cx0, dy: cy0, r: 8 }, ...placedSet.map((p) => ({ dx: p.px, dy: p.py, r: DOT_R }))];
      const ARR_PAD = 8;
      for (let iter = 0; iter < 360; iter++) {
        for (let i = 0; i < lab.length; i++) {
          for (let j = i + 1; j < lab.length; j++) {
            const a = lab[i], b = lab[j];
            const ox = (a.w + b.w) / 2 + GAP - Math.abs(a.cx - b.cx);
            const oy = (a.h + b.h) / 2 + GAP - Math.abs(a.cy - b.cy);
            if (ox > 0 && oy > 0) {
              if (oy <= ox) { const push = oy / 2 + 0.4, dir = a.cy <= b.cy ? -1 : 1; a.cy += dir * push; b.cy -= dir * push; }
              else          { const push = ox / 2 + 0.4, dir = a.cx <= b.cx ? -1 : 1; a.cx += dir * push; b.cx -= dir * push; }
            }
          }
        }
        for (const a of lab) {
          for (const d of allDots) {
            const ox = a.w / 2 + d.r + GAP - Math.abs(a.cx - d.dx);
            const oy = a.h / 2 + d.r + GAP - Math.abs(a.cy - d.dy);
            if (ox > 0 && oy > 0) {
              if (oy <= ox) a.cy += (a.cy <= d.dy ? -1 : 1) * (oy + 0.4);
              else          a.cx += (a.cx <= d.dx ? -1 : 1) * (ox + 0.4);
            }
          }
          {
            const ox = a.w / 2 + legBox.w / 2 + GAP - Math.abs(a.cx - legBox.cx);
            const oy = a.h / 2 + legBox.h / 2 + GAP - Math.abs(a.cy - legBox.cy);
            if (ox > 0 && oy > 0) {
              if (oy <= ox) a.cy += (a.cy <= legBox.cy ? -1 : 1) * (oy + 0.4);
              else          a.cx += (a.cx <= legBox.cx ? -1 : 1) * (ox + 0.4);
            }
          }
          for (const ar of arrowSet) {
            const { qx, qy } = segClosest(a.cx, a.cy, ar.sx, ar.sy, ar.ex, ar.ey);
            const ox = a.w / 2 + ARR_PAD + GAP - Math.abs(a.cx - qx);
            const oy = a.h / 2 + ARR_PAD + GAP - Math.abs(a.cy - qy);
            if (ox > 0 && oy > 0) {
              if (oy <= ox) a.cy += (a.cy <= qy ? -1 : 1) * (oy + 0.4);
              else          a.cx += (a.cx <= qx ? -1 : 1) * (ox + 0.4);
            }
          }
        }
        for (const a of lab) {
          const tx = a.ref.dx + a.ux * a.off, ty = a.ref.dy + a.uy * a.off;
          a.cx += (tx - a.cx) * 0.01; a.cy += (ty - a.cy) * 0.01;
        }
      }
      lab.forEach((a) => {
        a.cx = Math.max(PAD + a.w / 2 + 2, Math.min(W - PAD - a.w / 2 - 2, a.cx));
        a.cy = Math.max(scTop + a.h / 2 + 2, Math.min(scTop + scH - a.h / 2 - 2, a.cy));
      });
      return lab;
    };

    // draw one scatter LAYOUT (rays + dots + relaxed labels + leaders) into a given step layer.
    const drawScatter = (layerName, placedSet, arrowSet) => {
      placedSet.forEach((p) => {
        const g = el('g', {}, svg);
        el('line', { x1: cx0, y1: cy0, x2: p.px, y2: p.py, class: `cs-ray ${p.cls}` }, g);
        el('circle', { cx: p.px, cy: p.py, r: 6, class: `cs-pt ${p.cls}` }, g);
        add(layerName, g);
      });
      add(layerName, el('circle', { cx: cx0, cy: cy0, r: 8, class: 'cs-anchor' }, svg));
      const lab = relaxLabels(placedSet, arrowSet);
      lab.forEach((a) => {
        const onLeft = a.cx >= a.ref.dx;
        const tx = onLeft ? a.cx - a.w / 2 + 3 : a.cx + a.w / 2 - 3;
        const ty = a.cy + 4;
        add(layerName, el('line', { x1: a.ref.dx, y1: a.ref.dy, x2: tx, y2: a.cy,
          class: 'cs-leader', fill: 'none' }, svg));
        add(layerName, el('text', { x: tx, y: ty, class: a.cls, 'text-anchor': onLeft ? 'start' : 'end' }, svg))
          .textContent = a.word;
      });
    };

    // ── STEP 0: anchor at centre + neighbours fanned at their ORIGINAL (cosine) radii ──
    layer('scatter', 0);          // the original layout — visible at steps 0,1,2 (hidden once trained)
    [Rmin, Rmax].forEach((r) => add('scatter', el('circle',
      { cx: cx0, cy: cy0, r, class: 'cs-arc', fill: 'none' }, svg)));
    const placed = items.map((it) => placeAt(it, rOrig(it)));

    // ── STEP 2: pull/push arrows on the ORIGINAL positions (the gradient drawn; nothing has moved yet).
    //    Built BEFORE the label relaxation so the labels can be repelled away from the arrow shafts. ──
    layer('forces', 2);
    const ARRLEN = 20;
    const arrows = placed.map((p) => {
      const pull = p.kind === 'pos';
      const sx = pull ? p.px - p.ux * 6 : p.px + p.ux * 6;
      const sy = pull ? p.py - p.uy * 6 : p.py + p.uy * 6;
      const ex = pull ? sx - p.ux * ARRLEN : sx + p.ux * ARRLEN;
      const ey = pull ? sy - p.uy * ARRLEN : sy + p.uy * ARRLEN;
      const cls = pull ? 'cs-arr cs-arr-pull' : 'cs-arr cs-arr-push';
      add('forces', el('line', { x1: sx, y1: sy, x2: ex, y2: ey, class: cls,
        'marker-end': pull ? 'url(#cs-pull)' : 'url(#cs-push)' }, svg));
      return { sx, sy, ex, ey };
    });
    drawScatter('scatter', placed, arrows);     // original dots + labels (relaxed around the arrows)

    // ── STEP 3: the dots LAND at their trained positions — positives tighten around the anchor,
    //    negatives slide out to the rim. A separate layer that REPLACES the original scatter (the
    //    original is hidden at step ≥ 3), so the audience sees the space re-shape, not a teleport. ──
    layer('trained', 3);
    [Rmin, Rmax].forEach((r) => add('trained', el('circle',
      { cx: cx0, cy: cy0, r, class: 'cs-arc', fill: 'none' }, svg)));
    const placedTrained = items.map((it) => placeAt(it, rTrained(it)));
    drawScatter('trained', placedTrained, []);  // no arrows now — the force has already acted

    // a legend chip in the top-right corner — shared by both layouts (always on). Its bounds were
    // declared above and fed into the relaxation pass as an obstacle so no label sits under it.
    layer('legend', 0);
    add('legend', el('rect', { x: legX, y: legY, width: legW, height: legH, rx: 6,
      class: 'cs-legbox' }, svg));
    add('legend', el('circle', { cx: legX + 12, cy: legY + 11, r: 5, class: 'cs-pt cs-pos' }, svg));
    add('legend', el('text', { x: legX + 22, y: legY + 15, class: 'cs-leglbl' }, svg))
      .textContent = labels.posLeg || 'positive';
    add('legend', el('circle', { cx: legX + 12, cy: legY + 26, r: 5, class: 'cs-pt cs-neg' }, svg));
    add('legend', el('text', { x: legX + 22, y: legY + 30, class: 'cs-leglbl' }, svg))
      .textContent = labels.negLeg || 'negative';

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

    // ── STEP 4: the loss readout ──────────────────────────────────────────────
    layer('loss', 4);
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
      // visibility per layer. The ORIGINAL scatter + its force arrows are REPLACED by the trained
      // scatter at step ≥ 3 (so the two never paint on top of each other — a double-paint / OVERLAP),
      // and the trained scatter only appears once the dots have "landed".
      const shown = {
        scatter: k >= 0 && k < 3,    // original layout: steps 0,1,2; gone once trained
        forces:  k === 2,            // arrows live only on the original positions, at the force step
        trained: k >= 3,             // trained layout: the dots have landed
        bars:    k >= 1,
        legend:  true,
        loss:    k >= 4,
      };
      for (const name in layers) {
        const on = name in shown ? shown[name] : k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      // tighten the positive rays / fade the negatives once the space is trained (step ≥ 3).
      svg.classList.toggle('cs-trained', k >= 3);
    };
  },
});
