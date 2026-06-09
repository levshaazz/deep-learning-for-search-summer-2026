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

    // ── STEP 0: anchor at centre + neighbours fanned around it, radius = closeness ──
    layer('scatter', 0);
    // faint concentric "near" + "far" shells (full circles now, centred on the anchor).
    [Rmin, Rmax].forEach((r) => add('scatter', el('circle',
      { cx: cx0, cy: cy0, r, class: 'cs-arc', fill: 'none' }, svg)));

    // even angular fan AROUND the anchor (full 360°, started a touch off vertical so no ray is dead
    // horizontal/vertical), one ray per item; radius from the cosine. The dots scatter across the
    // whole disc rather than huddling in one corner.
    const N = items.length;
    const ang0 = -Math.PI / 2 + 0.32;             // first ray near the top, slightly rotated
    const placed = items.map((it, i) => {
      const ang = ang0 + (i / N) * 2 * Math.PI;    // even fan over the full circle
      const r = Rmin + (1 - Math.max(0, Math.min(1, it.cos))) * (Rmax - Rmin);
      const px = cx0 + r * Math.cos(ang);
      const py = cy0 + r * Math.sin(ang);
      const cls = it.kind === 'pos' ? 'cs-pos' : 'cs-neg';
      const g = el('g', {}, svg);
      el('line', { x1: cx0, y1: cy0, x2: px, y2: py, class: `cs-ray ${cls}` }, g);
      el('circle', { cx: px, cy: py, r: 6, class: `cs-pt ${cls}` }, g);
      add('scatter', g);
      return { ...it, px, py, ux: Math.cos(ang), uy: Math.sin(ang), g, cls };
    });
    // the anchor dot last so it sits ON TOP of the ray ends that meet at the centre.
    add('scatter', el('circle', { cx: cx0, cy: cy0, r: 8, class: 'cs-anchor' }, svg));

    // ── STEP 2: pull/push arrows (drawn here so they overlay the scatter; need them BEFORE the label
    //    relaxation so labels can be repelled away from the arrow shafts). ─────
    layer('forces', 2);
    const ARRLEN = 20;
    const arrows = placed.map((p) => {
      const pull = p.kind === 'pos';
      // arrow direction: positives pulled toward the anchor (inward), negatives pushed away (outward).
      const sx = pull ? p.px - p.ux * 6 : p.px + p.ux * 6;
      const sy = pull ? p.py - p.uy * 6 : p.py + p.uy * 6;
      const ex = pull ? sx - p.ux * ARRLEN : sx + p.ux * ARRLEN;
      const ey = pull ? sy - p.uy * ARRLEN : sy + p.uy * ARRLEN;
      const cls = pull ? 'cs-arr cs-arr-pull' : 'cs-arr cs-arr-push';
      add('forces', el('line', { x1: sx, y1: sy, x2: ex, y2: ey, class: cls,
        'marker-end': pull ? 'url(#cs-pull)' : 'url(#cs-push)' }, svg));
      return { sx, sy, ex, ey };
    });

    // ── label layout: anchor + LEADER LINES (defect-1) ─────────────────────────────────────────────
    // Seed each neighbour label off its dot, then run a force pass: repel label↔label, label↔every dot,
    // and label↔every arrow SEGMENT (closest-point distance, not just the midpoint), so no label
    // overprints a dot OR a push/pull arrow shaft. A leader ties each label back to its dot. The
    // NEGATIVE push-arrow points radially OUTWARD — the same direction a radial label would sit — so a
    // negative label is seeded TANGENTIALLY (rotated ~50° off the radial) to leave the arrow a clear
    // lane to its side. The anchor "cat" gets a box seeded straight DOWN. Mirrors glove-cooccur's
    // anchor+relaxation pattern.
    const CHARW = 6.3, LBL_H = 14, GAP = 5, DOT_R = 6;
    const lblText = (w) => String(w);
    // build label seeds: anchor first, then each neighbour.
    const seeds = [];
    seeds.push({ word: anchor, ref: { dx: cx0, dy: cy0 }, ux: 0, uy: 1, off: 24, cls: 'cs-anchor-lbl',
      isAnchor: true });
    placed.forEach((p) => {
      let sux = p.ux, suy = p.uy, off;
      if (p.kind === 'neg') {
        // rotate the seed direction off the radial so the outward push-arrow doesn't run under the
        // label; sign chosen so the label leans toward the top/bottom rather than across the disc.
        const rot = (p.uy <= 0 ? -1 : 1) * 0.9;          // ≈ 51° tangential lean
        const c = Math.cos(rot), s = Math.sin(rot);
        sux = p.ux * c - p.uy * s; suy = p.ux * s + p.uy * c;
        // seed clear of the OUTWARD push-arrow tip: the shaft starts 6px out and runs ARRLEN(20)
        // further, so the head can land ~26px from the dot. Seed BEYOND that (34) so the label box
        // never starts under the arrowhead.
        off = 34;
      } else {
        // positives: the pull-arrow points INWARD (toward the anchor), so the outward radial lane is
        // clear of the shaft — but the NEIGHBOUR DOT itself + a long word need room, and the head of
        // an INWARD arrow on a closer (high-cos) dot was landing on a radial label. Seed well out (30).
        off = 30;
      }
      seeds.push({ word: p.word, ref: { dx: p.px, dy: p.py }, ux: sux, uy: suy, off,
        cls: `cs-pt-lbl ${p.cls}`, isAnchor: false });
    });
    const lab = seeds.map((s) => ({
      w: Math.max(18, lblText(s.word).length * CHARW + 6), h: LBL_H,
      cx: s.ref.dx + s.ux * s.off, cy: s.ref.dy + s.uy * s.off, ...s,
    }));
    // distance from a point to a segment's closest point → vector pushing the point off the segment.
    const segPush = (px, py, x1, y1, x2, y2) => {
      const dx = x2 - x1, dy = y2 - y1;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((px - x1) * dx + (py - y1) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      const qx = x1 + t * dx, qy = y1 + t * dy;          // closest point on the segment
      return { qx, qy };
    };
    for (let iter = 0; iter < 360; iter++) {
      // label vs label
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
      // label vs EVERY dot (anchor dot + neighbour dots) — no label sits on a dot.
      const allDots = [{ dx: cx0, dy: cy0, r: 8 }, ...placed.map((p) => ({ dx: p.px, dy: p.py, r: DOT_R }))];
      for (const a of lab) {
        for (const d of allDots) {
          const ox = a.w / 2 + d.r + GAP - Math.abs(a.cx - d.dx);
          const oy = a.h / 2 + d.r + GAP - Math.abs(a.cy - d.dy);
          if (ox > 0 && oy > 0) {
            if (oy <= ox) a.cy += (a.cy <= d.dy ? -1 : 1) * (oy + 0.4);
            else          a.cx += (a.cx <= d.dx ? -1 : 1) * (ox + 0.4);
          }
        }
        // label vs every arrow SEGMENT — push the label box off the closest point on each arrow shaft
        // (covers the whole shaft + tip, not just the midpoint) so no shaft runs under a label. The
        // clearance pad is widened (4→8) to also clear the rendered ARROWHEAD (a 6×6 marker that
        // overhangs the geometric segment endpoint) so no arrowHEAD touches a label either.
        const ARR_PAD = 8;
        for (const ar of arrows) {
          const { qx, qy } = segPush(a.cx, a.cy, ar.sx, ar.sy, ar.ex, ar.ey);
          const ox = a.w / 2 + ARR_PAD + GAP - Math.abs(a.cx - qx);
          const oy = a.h / 2 + ARR_PAD + GAP - Math.abs(a.cy - qy);
          if (ox > 0 && oy > 0) {
            if (oy <= ox) a.cy += (a.cy <= qy ? -1 : 1) * (oy + 0.4);
            else          a.cx += (a.cx <= qx ? -1 : 1) * (ox + 0.4);
          }
        }
      }
      // gentle pull back toward the seed so the leader stays short.
      for (const a of lab) {
        const tx = a.ref.dx + a.ux * a.off, ty = a.ref.dy + a.uy * a.off;
        a.cx += (tx - a.cx) * 0.01; a.cy += (ty - a.cy) * 0.01;
      }
    }
    // clamp each label box fully inside the scatter band (OOB guard).
    lab.forEach((a) => {
      a.cx = Math.max(PAD + a.w / 2 + 2, Math.min(W - PAD - a.w / 2 - 2, a.cx));
      a.cy = Math.max(scTop + a.h / 2 + 2, Math.min(scTop + scH - a.h / 2 - 2, a.cy));
    });
    // draw leader + label for each (anchor into 'scatter'; neighbours into their own group so they
    // hide/show with the scatter layer).
    lab.forEach((a) => {
      const onLeft = a.cx >= a.ref.dx;             // box to the RIGHT of dot → text-anchor start
      const tx = onLeft ? a.cx - a.w / 2 + 3 : a.cx + a.w / 2 - 3;
      const ty = a.cy + 4;
      // leader from the dot edge to the box edge nearest the dot.
      add('scatter', el('line', { x1: a.ref.dx, y1: a.ref.dy, x2: tx, y2: a.cy,
        class: 'cs-leader', fill: 'none' }, svg));
      add('scatter', el('text', { x: tx, y: ty, class: a.cls, 'text-anchor': onLeft ? 'start' : 'end' }, svg))
        .textContent = a.word;
    });

    // a legend chip in a corner that the labels were already repelled toward the centre away from.
    const legW = 120, legX = W - PAD - legW, legY = scTop;
    add('scatter', el('rect', { x: legX, y: legY, width: legW, height: 34, rx: 6,
      class: 'cs-legbox' }, svg));
    add('scatter', el('circle', { cx: legX + 12, cy: legY + 11, r: 5, class: 'cs-pt cs-pos' }, svg));
    add('scatter', el('text', { x: legX + 22, y: legY + 15, class: 'cs-leglbl' }, svg))
      .textContent = labels.posLeg || 'positive';
    add('scatter', el('circle', { cx: legX + 12, cy: legY + 26, r: 5, class: 'cs-pt cs-neg' }, svg));
    add('scatter', el('text', { x: legX + 22, y: legY + 30, class: 'cs-leglbl' }, svg))
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
