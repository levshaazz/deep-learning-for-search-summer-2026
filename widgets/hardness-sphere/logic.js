/* hardness-sphere/logic.js — L13 'the geometry of hardness' + the central gradient lens. The query q
   sits on a unit arc; d⁺ and the five spine negatives are placed by their ANGLE to q (θ = arccos cos(q,·)),
   so a small angle = a hard negative crowding the query. Two channels: the hardness BAND (easy/semi/hard)
   and the secretly-POSITIVE flag (the impostor n₅ looks hard but is an unlabelled positive). The
   per-negative gradient weight is a Boltzmann softmax of sim/τ (Wang–Liu): as τ→0 it collapses onto the
   hardest — "a negative is worth exactly its gradient".

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. EVERY number (cos(q,·), the Boltzmann
   weights per τ) comes from data/l13-negatives.json → spine; labels from i18n. Built on _widget-base.js.

   Steps (maxStep = 5):
     0 → place q, d⁺ and n₁..n₅ on the arc by angle to q (closer = harder).            s0
     1 → the three hardness bands: easy / semi-hard / hard.                             s1
     2 → the second channel: n₅ sits in the HARD band but is secretly a positive.       s2
     3 → the Boltzmann gradient weight on each negative at τ=0.2 (hard ones dominate).   s3
     4 → drop τ to 0.1: the weight marches further toward the hardest.                  s4
     5 → drop τ to 0.05: the weight collapses onto the hardest — hard-max.              s5 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountHardnessSphere = defineWidget({
  id: 'hardness-sphere',
  rootClass: 'hsp-root',
  exportName: 'mountHardnessSphere',
  maxStep: 5,
  render({ host, data, labels, el }) {
    const sp = (data && data.spine) || {};
    const pos = sp.positive || { cosQ: 0.82 };
    const lineup = sp.lineup || [];
    const bz = sp.boltzmann || [];
    const f2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));
    const byTau = (t) => bz.find((r) => r.tau === t) || bz[0] || { weights: [], tau: t };
    const SOFT = byTau(0.2), MID = byTau(0.1), SHARP = byTau(0.05);

    const W = 600, PAD = 20;
    const ox = PAD + 26, oy = 248, R = 196;                    // arc origin (q along the +x axis)
    const ang = (c) => Math.acos(Math.max(-1, Math.min(1, c)));  // angle from the q-axis
    const px = (c, rr) => ox + (rr == null ? R : rr) * Math.cos(ang(c));
    const py = (c, rr) => oy - (rr == null ? R : rr) * Math.sin(ang(c));
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg hsp-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };

    // ── hardness band wedges (step 1): easy θ∈(~66°,90°], semi (~45°,66°], hard [0,45°] ──
    layer('bands', 1);
    const wedge = (c0, c1, cls) => {
      const a0 = ang(c0), a1 = ang(c1);
      const large = 0;
      const d = `M ${ox} ${oy} L ${(ox + R * Math.cos(a0)).toFixed(1)} ${(oy - R * Math.sin(a0)).toFixed(1)} ` +
                `A ${R} ${R} 0 ${large} 1 ${(ox + R * Math.cos(a1)).toFixed(1)} ${(oy - R * Math.sin(a1)).toFixed(1)} Z`;
      return add('bands', el('path', { d, class: 'hsp-wedge ' + cls }, svg));
    };
    // Band cuts must match the data's authored `band` thresholds: n₃ (cosQ 0.63) is band:"hard",
    // n₂ (cosQ 0.41) is band:"semi". A semi/hard cut at 0.66 wrongly drops n₃ into the SEMI wedge;
    // moving it to 0.55 puts every lineup dot inside the wedge matching its data band
    // (easy ≤0.40: n₁=0.05 · semi 0.40–0.55: n₂=0.41 · hard ≥0.55: n₃=0.63, n₄=0.75, n₅=0.79, d⁺=0.82).
    wedge(0.0, 0.40, 'hsp-easy');     // far / wide angle
    wedge(0.40, 0.55, 'hsp-semi');
    wedge(0.55, 1.0, 'hsp-hard');     // crowding the query

    // ── arc + q axis (step 0 chrome) ──
    layer('arc', 0);
    add('arc', el('path', { d: `M ${ox + R} ${oy} A ${R} ${R} 0 0 0 ${px(0)} ${py(0)}`, class: 'hsp-arc', fill: 'none' }, svg));
    add('arc', el('line', { x1: ox, y1: oy, x2: ox + R + 14, y2: oy, class: 'hsp-axis' }, svg));
    add('arc', el('text', { x: ox + R + 18, y: oy + 4, class: 'hsp-axislbl' }, svg)).textContent = 'q';

    // ── the points: d⁺ + n₁..n₅ on the arc, with a tidy right-side legend (one row each) ──
    const items = [{ id: 'd⁺', cosQ: pos.cosQ, pos: true },
      ...lineup.map((n) => ({ id: n.id, label: n.label, cosQ: n.cosQ, band: n.band, isFalse: n.isFalse }))];
    const legX = ox + R + 70, legTop = 40, legRowH = 30, legBarMax = W - PAD - (legX + 112);
    const dots = [], falseMarks = [], bars = [], wvals = [];
    items.forEach((it, i) => {
      // one colour CLASS for all true negatives (hardness is read off the wedge bands + arc angle,
      // not the dot hue); the positive and the secretly-positive impostor each get their own.
      const cls = it.pos ? 'hsp-pos' : (it.isFalse ? 'hsp-false' : 'hsp-neg');
      layer('pt' + i, 0);
      // arc dot
      add('pt' + i, el('line', { x1: ox, y1: oy, x2: px(it.cosQ), y2: py(it.cosQ), class: 'hsp-ray ' + cls }, svg));
      add('pt' + i, el('circle', { cx: px(it.cosQ), cy: py(it.cosQ), r: it.pos ? 7 : 6, class: 'hsp-dot ' + cls }, svg));
      // Stagger the on-arc id label radius in the crowded HARD cluster (cosQ ≳ 0.66) so d⁺/n₄/n₅,
      // which sit only ~11–24px apart on the arc, fan OUT along their own rays and stop colliding.
      // Far/easy points keep the tight R+14; harder (larger cos) points push progressively further.
      const lblR = it.cosQ >= 0.66
        ? R + 16 + (it.cosQ - 0.66) * 380     // 0.66→+16 … 0.82→+77 spread along the ray
        : R + 14;
      add('pt' + i, el('text', { x: px(it.cosQ, lblR), y: py(it.cosQ, lblR) + 4, class: 'hsp-dotlbl ' + cls,
        'text-anchor': 'middle' }, svg)).textContent = it.id;
      // second channel: the secretly-positive ring (step 2)
      if (it.isFalse) {
        layer('false', 2);
        falseMarks.push(add('false', el('circle', { cx: px(it.cosQ), cy: py(it.cosQ), r: 11, class: 'hsp-falsering', fill: 'none' }, svg)));
      }
      // legend row
      const ly = legTop + i * legRowH;
      add('pt' + i, el('circle', { cx: legX, cy: ly, r: 5, class: 'hsp-dot ' + cls }, svg));
      add('pt' + i, el('text', { x: legX + 12, y: ly + 4, class: 'hsp-leglbl ' + cls }, svg))
        .textContent = it.pos ? 'd⁺' : it.id + (it.isFalse ? ' ⚠' : '');
      if (!it.pos) {                                            // Boltzmann weight bar (negatives only)
        layer('wt' + i, 3);
        add('wt' + i, el('rect', { x: legX + 56, y: ly - 8, width: legBarMax, height: 15, rx: 3, class: 'hsp-barbg' }, svg));
        const b = add('wt' + i, el('rect', { x: legX + 56, y: ly - 8, width: 2, height: 15, rx: 3, class: 'hsp-bar ' + cls }, svg));
        bars[i] = b;
        wvals[i] = add('wt' + i, el('text', { x: legX + 56 + legBarMax + 5, y: ly + 4, class: 'hsp-wval ' + cls }, svg));
      }
    });
    add('arc', el('text', { x: legX, y: legTop - 16, class: 'hsp-leghead' }, svg))
      .textContent = labels.weightHead || 'gradient weight ∝ softmax(sim/τ)';

    const H = frameHeightFor(oy + 30, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      if (k >= 3) {
        const Wt = k >= 5 ? SHARP : (k >= 4 ? MID : SOFT);   // τ=0.2 @s3 → 0.1 @s4 → 0.05 @s5
        lineup.forEach((n, j) => {
          const i = j + 1;                                     // legend row index (d⁺ is row 0)
          const w = (Wt.weights && Wt.weights[j]) || 0;
          if (bars[i]) bars[i].setAttribute('width', Math.max(2, ((W - PAD - ((ox + R + 70) + 112))) * w));
          if (wvals[i]) wvals[i].textContent = f2(w);
        });
      }
    };
  },
});
