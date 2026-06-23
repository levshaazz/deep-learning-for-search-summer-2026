/* mining-comparator/logic.js — L13 centerpiece: step through the negative-mining strategies and watch
   which candidate each one surfaces AND the recall it yields (measured on our toy, 20 seeds). The arc:
   random → in-batch → BM25-static all cluster; the DYNAMIC miner with NO denoising reaches for the
   hardest — which includes the impostor n₅ — and recall DROPS below in-batch (the RocketQA inversion);
   denoising filters n₅ and recall recovers above everything.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. EVERY recall number comes from
   data/l13-negatives.json → recallAt10 (measured), and the mined set from spine.minedByStrategy; labels
   from i18n. Built on widgets/_widget-base.js.

   Steps (maxStep = 4) — one strategy each:
     0 random (mines n₁) · 1 in-batch (n₂) · 2 BM25-static (n₃) ·
     3 undenoised dynamic (n₄+n₅ → recall DROPS) · 4 denoised (n₄ only → recovers). */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

const ORDER = ['random', 'inbatch', 'bm25', 'undenoised', 'denoised'];

export const mountMiningComparator = defineWidget({
  id: 'mining-comparator',
  rootClass: 'mcp-root',
  exportName: 'mountMiningComparator',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const sp = (data && data.spine) || {};
    const pos = sp.positive || { cosQ: 0.82 };
    const lineup = sp.lineup || [];
    const mined = sp.minedByStrategy || {};
    const recall = (data && data.recallAt10) || {};
    const f2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));
    const stratLabel = (s) => (labels['strat_' + s] || s);

    const W = 600, PAD = 20;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg mcp-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };

    // ── candidate chips: d⁺ + n₁..n₅ (the pool the miner draws from) ──
    layer('chips', 0);
    add('chips', el('text', { x: PAD, y: 22, class: 'mcp-head' }, svg))
      .textContent = labels.poolHead || 'the candidate pool (d⁺ must stay on top)';
    const chips = [{ id: 'd⁺', cosQ: pos.cosQ, pos: true },
      ...lineup.map((n) => ({ id: n.id, cosQ: n.cosQ, isFalse: n.isFalse }))];
    const cW = 84, cGap = 6, cTop = 34, cH = 44;
    const rings = {};                                          // id → mined-ring rect
    chips.forEach((c, i) => {
      const x = PAD + i * (cW + cGap);
      const cls = c.pos ? 'mcp-pos' : (c.isFalse ? 'mcp-false' : 'mcp-neg');
      const ring = add('chips', el('rect', { x: x - 3, y: cTop - 3, width: cW + 6, height: cH + 6, rx: 8,
        class: 'mcp-ring', fill: 'none' }, svg));
      ring.classList.add('is-hidden'); rings[c.id] = ring;     // ring is toggled per strategy, not by layer
      add('chips', el('rect', { x, y: cTop, width: cW, height: cH, rx: 6, class: 'mcp-chip ' + cls }, svg));
      add('chips', el('text', { x: x + cW / 2, y: cTop + 19, class: 'mcp-chiplbl ' + cls, 'text-anchor': 'middle' }, svg))
        .textContent = c.pos ? 'd⁺' : c.id + (c.isFalse ? ' ⚠' : '');
      add('chips', el('text', { x: x + cW / 2, y: cTop + 36, class: 'mcp-chipcos', 'text-anchor': 'middle' }, svg))
        .textContent = f2(c.cosQ);
    });

    // ── recall@10 bar chart, one bar per strategy, revealed cumulatively ──
    const chTop = cTop + cH + 46, chH = 150, baseY = chTop + chH;
    const chLeft = PAD + 34, slot = (W - PAD - chLeft) / ORDER.length, barW = slot * 0.6;
    layer('axis', 0);
    add('axis', el('text', { x: PAD, y: chTop - 12, class: 'mcp-head' }, svg))
      .textContent = labels.recallHead || 'recall@10 (measured on the toy, 20 seeds)';
    add('axis', el('line', { x1: chLeft, y1: chTop, x2: chLeft, y2: baseY, class: 'mcp-axisline' }, svg));
    add('axis', el('line', { x1: chLeft, y1: baseY, x2: W - PAD, y2: baseY, class: 'mcp-axisline' }, svg));
    // in-batch reference line (so the drop below / recovery above reads as the inversion)
    const ibase = (recall.inbatch && recall.inbatch.mean) || 0;
    const refY = baseY - chH * ibase;
    add('axis', el('line', { x1: chLeft, y1: refY, x2: W - PAD, y2: refY, class: 'mcp-refline' }, svg));
    add('axis', el('text', { x: W - PAD, y: refY - 5, class: 'mcp-reflbl', 'text-anchor': 'end' }, svg))
      .textContent = (labels.refLabel || 'in-batch baseline') + ' ' + f2(ibase);

    const barNodes = ORDER.map((s, i) => {
      layer('bar' + i, 0);
      const m = (recall[s] && recall[s].mean) || 0;
      const x = chLeft + i * slot + (slot - barW) / 2;
      const h = chH * m;
      const cls = s === 'undenoised' ? 'mcp-bar-drop' : (s === 'denoised' ? 'mcp-bar-win' : 'mcp-bar');
      const bar = add('bar' + i, el('rect', { x, y: baseY - h, width: barW, height: h, rx: 4, class: cls }, svg));
      add('bar' + i, el('text', { x: x + barW / 2, y: baseY - h - 6, class: 'mcp-barval', 'text-anchor': 'middle' }, svg))
        .textContent = f2(m);
      add('bar' + i, el('text', { x: x + barW / 2, y: baseY + 15, class: 'mcp-barlbl', 'text-anchor': 'middle' }, svg))
        .textContent = stratLabel(s);
      return bar;
    });

    const H = frameHeightFor(baseY + 24, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      // reveal strategy bars 0..k; emphasize the current one
      for (let i = 0; i < ORDER.length; i++) {
        const on = i <= k;
        for (const node of layers['bar' + i].nodes) node.classList.toggle('is-hidden', !on);
        barNodes[i].classList.toggle('mcp-current', i === k);
      }
      // highlight the candidates the CURRENT strategy mines
      const picked = new Set(mined[ORDER[k]] || []);
      for (const id in rings) rings[id].classList.toggle('is-hidden', !picked.has(id));
    };
  },
});
