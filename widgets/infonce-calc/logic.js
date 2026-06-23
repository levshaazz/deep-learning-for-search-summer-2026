/* infonce-calc/logic.js — L13 'read an InfoNCE loss off the batch by hand'. The query q is scored
   against its positive d⁺ and the five spine negatives n₁..n₅ (Sereega's sparring lineup). A softmax
   over sim/τ is the InfoNCE target; the loss is −log P⁺. Lowering τ sharpens the softmax (P⁺ up,
   loss down); growing the negative count N raises the mutual-information CEILING log N (which the bound
   I ≥ log N − L_N only saturates — NOT "InfoNCE maximises MI").

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. EVERY number (cos(q,·), the softmax,
   the loss at each τ, the log N ceiling) comes from data/l13-negatives.json → spine; labels from i18n.
   Built on widgets/_widget-base.js.

   Steps (maxStep = 3):
     0 → the similarities cos(q,·): d⁺ and the five negatives, ranked by hardness.       s0
     1 → softmax(sim/τ) at τ=0.2 — the InfoNCE target; the loss L = −log P⁺.             s1
     2 → drop τ to 0.05: the softmax SHARPENS onto the hardest, P⁺↑, loss↓.              s2
     3 → more negatives raise the CEILING log N (bound saturates at log N).              s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountInfonceCalc = defineWidget({
  id: 'infonce-calc',
  rootClass: 'inc-root',
  exportName: 'mountInfonceCalc',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const sp = (data && data.spine) || {};
    const pos = sp.positive || { label: 'positive', cosQ: 0.82 };
    const lineup = sp.lineup || [];
    const inf = sp.infonce || [];
    const logN = sp.logNBound || [];
    const f2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));
    // rows: positive first, then the five negatives (sorted easy→hard by cosQ as authored).
    const rows = [{ id: 'dPlus', label: pos.label, cosQ: pos.cosQ, pos: true },
      ...lineup.map((n) => ({ id: n.id, label: n.label, cosQ: n.cosQ, pos: false, isFalse: n.isFalse }))];
    // InfoNCE rows by τ: index 0=positive then n₁..n₅. softmax at the soft (τ=0.2) and sharp (τ=0.05) step.
    const byTau = (t) => inf.find((r) => r.tau === t) || inf[0] || { softmax: [], pPos: 0, loss: 0, tau: t };
    const SOFT = byTau(0.2), SHARP = byTau(0.05);

    const W = 600, PAD = 20, LBL = 168, rowH = 34, top = 64;
    const barX = PAD + LBL, barMax = W - PAD - barX - 56;
    const rowCy = (i) => top + i * rowH + rowH / 2;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg inc-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };

    // ── header ──
    layer('head', 0);
    add('head', el('text', { x: PAD, y: 24, class: 'inc-head' }, svg))
      .textContent = labels.head || 'q scored against d⁺ and the negatives';
    add('head', el('text', { x: barX, y: 24, class: 'inc-sub' }, svg))
      .textContent = labels.simHead || 'cos(q, ·)';

    // ── rows: label + cos(q,·) bar (step 0), repurposed as the softmax bar from step 1 ──
    const bars = [], vals = [], simbars = [];
    rows.forEach((r, i) => {
      layer('row' + i, 0);
      const cls = r.pos ? 'inc-pos' : (r.isFalse ? 'inc-false' : 'inc-neg');
      add('row' + i, el('text', { x: PAD, y: rowCy(i) + 4, class: 'inc-rowlbl ' + cls }, svg))
        .textContent = (r.pos ? 'd⁺ ' : r.id + ' ') + r.label + (r.isFalse ? ' ⚠' : '');
      add('row' + i, el('rect', { x: barX, y: rowCy(i) - 11, width: barMax, height: 22, rx: 5, class: 'inc-barbg' }, svg));
      const sb = add('row' + i, el('rect', { x: barX, y: rowCy(i) - 11, width: Math.max(2, barMax * r.cosQ), height: 22, rx: 5, class: 'inc-simbar ' + cls }, svg));
      simbars.push(sb);
      const b = add('row' + i, el('rect', { x: barX, y: rowCy(i) - 11, width: 0, height: 22, rx: 5, class: 'inc-bar ' + cls }, svg));
      b.classList.add('is-hidden'); bars.push(b);
      vals.push(add('row' + i, el('text', { x: barX + barMax + 8, y: rowCy(i) + 5, class: 'inc-val ' + cls }, svg)));
      vals[i].textContent = f2(r.cosQ);
    });

    // ── loss readout (steps 1–2) ──
    layer('loss', 1);
    const lossY = top + rows.length * rowH + 24;
    const lossT = add('loss', el('text', { x: PAD, y: lossY, class: 'inc-loss' }, svg));

    // ── ceiling strip: I ≥ log N − L_N, saturates at log N (step 3) ──
    layer('ceil', 3);
    const cy = lossY + 30;
    add('ceil', el('text', { x: PAD, y: cy, class: 'inc-sub' }, svg))
      .textContent = labels.ceilHead || 'more negatives N raise the ceiling log N (the bound saturates there)';
    const cN = logN.slice(0, 6), maxLog = cN.length ? cN[cN.length - 1].logN_nats : 1;
    const cBarMax = W - PAD * 2 - 150;
    cN.forEach((r, i) => {
      const y = cy + 16 + i * 20;
      add('ceil', el('text', { x: PAD, y: y + 10, class: 'inc-ceillbl' }, svg)).textContent = 'N=' + r.N;
      add('ceil', el('rect', { x: PAD + 64, y, width: Math.max(2, cBarMax * (r.logN_nats / maxLog)), height: 13, rx: 3, class: 'inc-ceilbar' }, svg));
      add('ceil', el('text', { x: PAD + 64 + cBarMax * (r.logN_nats / maxLog) + 6, y: y + 10, class: 'inc-ceilval' }, svg))
        .textContent = 'log N = ' + r.logN_nats.toFixed(2);
    });

    const H = frameHeightFor(cy + 16 + cN.length * 20 + 8, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      const showSoftmax = k >= 1;
      const R = k >= 2 ? SHARP : SOFT;            // soft τ at step 1, sharp τ at step 2
      rows.forEach((r, i) => {
        simbars[i].classList.toggle('is-hidden', showSoftmax);
        bars[i].classList.toggle('is-hidden', !showSoftmax);
        if (showSoftmax) {
          const p = (R.softmax && R.softmax[i]) || 0;
          bars[i].setAttribute('width', Math.max(2, barMax * p));
          vals[i].textContent = f2(p);
        } else {
          vals[i].textContent = f2(r.cosQ);
        }
      });
      if (showSoftmax) {
        lossT.textContent = (labels.lossLine || 'L = −log P⁺') +
          ' = ' + R.loss.toFixed(2) + '   (P⁺ = ' + R.pPos.toFixed(2) + ',  τ = ' + R.tau + ')';
      }
    };
  },
});
