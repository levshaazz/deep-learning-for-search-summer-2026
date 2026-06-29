/* pagerank-power/logic.js — L3 'turn-pagerank-power' beat: WATCH the PageRank rank
   vector converge under power iteration on a tiny 3-page web, instead of reading the
   result in prose. Mirrors the deck's 5-step e2e "Power iteration on a 3-page web".

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). ALL numbers come from data/l3-pagerank.json (the exact
   power-iteration trace the deck + facts-gate use); all human text comes from i18n keys in `labels`.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, esc() and the
   window.mountPagerankPower registration; render() below only draws the figure layers and returns
   the per-step update.

   Steps (maxStep = 5) — exact deck parity:
     0  → 3-page graph + uniform bars, all 1/3 ≈ 0.3333; out-degrees A=1,B=1,C=2.   caption s0
     1  → worked B-update set up: base=(1−0.85)/3=0.05, in-links A(whole)+C(half).   caption s1
     2  → PR₁(B)=0.05+0.425=0.475; bars jump to iterations[1].                       caption s2
     3  → settling: bars → deck v₅ (iterations[4]), oscillating, shrinking.          caption s3
     4  → converged: bars → final v₂₅ (iterations[25]); B holds the largest share.   caption s4
     5  → result: B 0.3974 > C 0.3878 > A 0.2148; query-independent signal.          caption s5 */
import { defineWidget, esc } from '../_widget-base.js';

const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const f4 = (n) => n.toFixed(4); // 4-dp display, matches the deck's 0.3333 / 0.4750 / 0.2148 style

export const mountPagerankPower = defineWidget({
  id: 'pagerank-power',
  rootClass: 'pr-root',
  maxStep: 5,
  render({ host, data, labels }) {
    const nodes = data.nodes || ['A', 'B', 'C'];
    const outdeg = data.outDegree || {};
    const iters = data.iterations || [];
    const damping = data.damping != null ? data.damping : 0.85;
    const n = nodes.length;

    // EXACT vectors pulled from the trace — nothing computed/invented here.
    const vInit = iters[0] || [1 / 3, 1 / 3, 1 / 3];      // uniform start
    const vAfter1 = iters[1] || vInit;                    // after first full pass (B → 0.475)
    const vSettle = iters[4] || vAfter1;                  // deck v₅ (oscillating, shrinking)
    const finalArr = data.finalVector
      || (data.final ? nodes.map((id) => data.final[id]) : iters[iters.length - 1]);
    const vConverged = finalArr;                          // deck v₂₅ (settled)

    // The worked B-update numbers, straight from data.workedUpdate (exact, deck-verbatim).
    const wu = data.workedUpdate || {};
    const wBase = wu.baseTerm != null ? wu.baseTerm : (1 - damping) / n;     // 0.05
    const wA = wu.contribFromA != null ? wu.contribFromA : 0;                // 0.3333
    const wC = wu.contribFromC != null ? wu.contribFromC : 0;               // 0.1667
    const wSum = wu.contribSum != null ? wu.contribSum : wA + wC;            // 0.5
    const wDamped = wu.dampedTerm != null ? wu.dampedTerm : damping * wSum;  // 0.425
    const wPR1 = wu.pr1 != null ? wu.pr1 : wBase + wDamped;                  // 0.475

    // Which node is the authority (largest converged share) → highlight in graph + bars.
    let authIdx = 0;
    for (let i = 1; i < n; i++) if (vConverged[i] > vConverged[authIdx]) authIdx = i;

    const panel = document.createElement('div');
    panel.className = 'wgt-panel pr-panel';
    host.appendChild(panel);

    // ── ROW 1: the 3-page link graph (SVG) ─────────────────────────────────────
    const gWrap = document.createElement('div');
    gWrap.className = 'pr-graph';
    const gHead = document.createElement('div');
    gHead.className = 'pr-head';
    gHead.textContent = labels.graphHead || 'The 3-page web';
    gWrap.appendChild(gHead);
    panel.appendChild(gWrap);

    // viewBox top raised to -34 (was -20) so the authority tag's baseline at B.y−44 = −6 keeps full
    // cap-height clearance above the frame edge (and headroom for the longer RU/TT tag). Height
    // extended to 226 (bottom edge −34 + 226 = 192) so node C's out-degree label baseline at
    // C.y+48 = 176 keeps ≥14px clearance to the bottom frame edge (was 8px at height 218).
    const svg = s('svg', {
      viewBox: '0 -34 420 226', width: '100%', class: 'wgt-svg pr-svg',
      role: 'img',
      'aria-label': 'Three-page link graph: A points to B, B points to C, C points to A and B, so B has two in-links and is the authority.',
    }, gWrap);
    const defs = s('defs', null, svg);
    const mk = (id, fill) => {
      const m = s('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto' }, defs);
      s('path', { d: 'M0 0 L10 5 L0 10 z', fill }, m);
    };
    mk('pr-arr', 'var(--ink-3, #6B7280)');
    mk('pr-arrA', 'var(--accent, #2A6FDB)');

    // node positions (A top-left, B top-centre/authority, C bottom-right) — matches deck layout
    const P = { A: { x: 64, y: 56 }, B: { x: 240, y: 38 }, C: { x: 352, y: 128 } };
    // edges drawn first (under nodes). Accent = edges feeding the authority B.
    const edge = (a, b, accent) => {
      const dx = P[b].x - P[a].x, dy = P[b].y - P[a].y;
      const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const rA = a === 'B' ? 34 : 30, rB = b === 'B' ? 34 : 30;
      s('line', {
        x1: P[a].x + ux * rA, y1: P[a].y + uy * rA,
        x2: P[b].x - ux * (rB + 4), y2: P[b].y - uy * (rB + 4),
        stroke: accent ? 'var(--accent, #2A6FDB)' : 'var(--ink-3, #6B7280)',
        'stroke-width': accent ? 3.5 : 3,
        'marker-end': accent ? 'url(#pr-arrA)' : 'url(#pr-arr)',
      }, svg);
    };
    edge('A', 'B', true);   // A→B feeds B
    edge('B', 'C', false);  // B→C
    edge('C', 'A', false);  // C→A
    edge('C', 'B', true);   // C→B feeds B

    nodes.forEach((id) => {
      const isAuth = id === nodes[authIdx];
      const r = isAuth ? 34 : 30;
      s('circle', {
        cx: P[id].x, cy: P[id].y, r,
        class: 'pr-node' + (isAuth ? ' pr-node-auth' : ''),
        fill: isAuth ? 'var(--accent-soft, #DCE8FB)' : 'var(--bg-card, #fff)',
        stroke: isAuth ? 'var(--accent, #2A6FDB)' : 'var(--ink-3, #6B7280)',
        'stroke-width': isAuth ? 4 : 3,
      }, svg);
      const txt = s('text', {
        x: P[id].x, y: P[id].y + 9, 'text-anchor': 'middle',
        class: 'pr-node-lbl', fill: isAuth ? 'var(--accent-ink, #1B4FA0)' : 'var(--ink, #14181F)',
      }, svg);
      txt.textContent = id;
      // out-degree caption under each node
      const od = s('text', {
        x: P[id].x, y: P[id].y + (isAuth ? 52 : 48), 'text-anchor': 'middle',
        class: 'pr-node-od', fill: 'var(--ink-3, #6B7280)',
      }, svg);
      od.textContent = `${labels.outdegLabel || 'out'} ${outdeg[id] != null ? outdeg[id] : ''}`;
    });
    // authority tag near B
    const tag = s('text', {
      x: P[nodes[authIdx]].x, y: P[nodes[authIdx]].y - 44, 'text-anchor': 'middle',
      class: 'pr-auth-tag', fill: 'var(--accent-ink, #1B4FA0)',
    }, svg);
    tag.textContent = labels.authorityTag || '2 in-links → authority';

    // ── ROW 2: the rank-vector bar chart ───────────────────────────────────────
    const barWrap = document.createElement('div');
    barWrap.className = 'pr-bars-wrap';
    const bHead = document.createElement('div');
    bHead.className = 'pr-head';
    const bHeadTxt = document.createElement('span');
    bHeadTxt.textContent = labels.vectorHead || 'Rank vector PR';
    bHead.appendChild(bHeadTxt);
    const iterTag = document.createElement('span');
    iterTag.className = 'pr-iter-tag';
    bHead.appendChild(iterTag);
    barWrap.appendChild(bHead);

    const bars = document.createElement('div');
    bars.className = 'pr-bars';
    // max share across the whole trace → fixed y-scale so bars are comparable across steps
    let vmax = 0;
    iters.forEach((v) => v.forEach((x) => { if (x > vmax) vmax = x; }));
    if (!vmax) vmax = 0.5;
    const cells = nodes.map((id, i) => {
      const cell = document.createElement('div');
      cell.className = 'pr-bar-cell';
      const track = document.createElement('div');
      track.className = 'pr-bar-track';
      const fill = document.createElement('div');
      fill.className = 'pr-bar-fill' + (i === authIdx ? ' pr-bar-auth' : '');
      const val = document.createElement('div');
      val.className = 'pr-bar-val';
      fill.appendChild(val);
      track.appendChild(fill);
      const name = document.createElement('div');
      name.className = 'pr-bar-name';
      name.textContent = id;
      cell.appendChild(track);
      cell.appendChild(name);
      bars.appendChild(cell);
      return { fill, val };
    });
    barWrap.appendChild(bars);
    panel.appendChild(barWrap);

    function setBars(vec, iterTagText) {
      vec.forEach((x, i) => {
        cells[i].fill.style.height = `${Math.max(2, (x / vmax) * 100)}%`;
        cells[i].val.textContent = f4(x);
      });
      iterTag.textContent = iterTagText || '';
    }

    // ── ROW 3: the power-iteration update (formula + worked B-substitution) ─────
    const upd = document.createElement('div');
    upd.className = 'pr-update';
    const uHead = document.createElement('div');
    uHead.className = 'pr-head pr-update-head';
    uHead.textContent = labels.updateHead || 'Power-iteration update';
    upd.appendChild(uHead);

    // the general rule (static, always visible)
    const rule = document.createElement('div');
    rule.className = 'pr-rule';
    rule.textContent = 'PR(i) = (1−d)/n + d · Σ_{j→i} PR(j)/outdeg(j)';
    upd.appendChild(rule);

    // the worked B-substitution, revealed in pieces across steps 1→2
    const work = document.createElement('div');
    work.className = 'pr-work';
    work.innerHTML =
      `<div class="pr-work-line pr-w-base">` +
        `base = (1−${esc(damping)})/${esc(n)} = <b>${esc(f4(wBase))}</b></div>` +
      `<div class="pr-work-line pr-w-in">` +
        `in-links of B: A/${esc(outdeg.A != null ? outdeg.A : 1)} = ${esc(f4(wA))} · ` +
        `C/${esc(outdeg.C != null ? outdeg.C : 2)} = ${esc(f4(wC))}` +
      `</div>` +
      `<div class="pr-work-line pr-w-pr1">` +
        `PR₁(B) = ${esc(f4(wBase))} + ${esc(damping)}·${esc(f4(wSum))} = ` +
        `${esc(f4(wBase))} + ${esc(f4(wDamped))} = <b class="pr-hot">${esc(f4(wPR1))}</b>` +
      `</div>`;
    upd.appendChild(work);
    panel.appendChild(upd);

    // ── final-result banner (query-independent signal) ─────────────────────────
    const banner = document.createElement('div');
    banner.className = 'pr-banner';
    const order = nodes.map((id, i) => ({ id, v: vConverged[i] }))
      .sort((a, b) => b.v - a.v);
    banner.innerHTML =
      `<span class="pr-banner-rank">` +
        order.map((o, i) => `<b>${esc(o.id)}</b> ${esc(f4(o.v))}`).join(' <span class="pr-gt">&gt;</span> ') +
      `</span>` +
      `<span class="pr-banner-tag">query-independent</span>`;
    panel.appendChild(banner);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      // bars track the iteration the reader is watching
      if (k <= 1) setBars(vInit, `${labels.iterLabel || 'iter'} 0`);
      else if (k === 2) setBars(vAfter1, `${labels.iterLabel || 'iter'} 1`);
      else if (k === 3) setBars(vSettle, `${labels.iterLabel || 'iter'} 5`);
      else setBars(vConverged, `${labels.iterLabel || 'iter'} 25 · ${labels.convergedTag || 'converged'}`);

      // the update panel reveals the worked B-substitution across steps 1→2
      upd.classList.toggle('is-active', k >= 1);
      work.querySelector('.pr-w-base').classList.toggle('is-hidden', k < 1);
      work.querySelector('.pr-w-in').classList.toggle('is-hidden', k < 1);
      work.querySelector('.pr-w-pr1').classList.toggle('is-hidden', k < 2);

      // authority bar pops once converged; result banner only at the very end
      bars.classList.toggle('is-settled', k >= 4);
      banner.classList.toggle('is-shown', k >= 5);
    };
  },
});
