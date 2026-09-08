/* neural-cascade/logic.js — L7 'Scouts and Judges' climb-cascade beat.
   REUSE of retrieve-rank-funnel (canon): same {stages:[{id,role,count,w}]} data shape, neural roles
   (corpus → bi-encoder retrieve → cross-encoder rerank). DRIVER-AGNOSTIC: setStep/maxStep, no input
   binding. Reads data/l7-cascade.json; reveals the cascade stage by stage, each narrower than the last.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup, the
   caption/counter scaffold, the setStep clamp + host.dataset.step, the esc() helper and the
   window.mountNeuralCascade registration; render() only draws the stage rows + per-step reveal. */
import { defineWidget, esc } from '../_widget-base.js';

export const mountNeuralCascade = defineWidget({
  id: 'neural-cascade',
  rootClass: 'nc-root',
  exportName: 'mountNeuralCascade',
  maxStep: 3,
  render({ host, data, labels }) {
    const stages = data.stages || [];
    const quality = data.quality || {};
    const latency = data.latency || {};
    // per-stage nDCG (the quality CLIMB): the retrieve row carries the bi-encoder/BM25 shortlist nDCG,
    // the rerank row carries the cross-encoder reranked nDCG. Corpus has none. Keyed by stage role so a
    // mount that omits `quality` (older inline data) simply renders no metric — the reveal is unchanged.
    const ndcgFor = (role) =>
      role === 'retrieval' && typeof quality.bm25Ndcg === 'number' ? quality.bm25Ndcg :
      role === 'rerank' && typeof quality.rerankedNdcg === 'number' ? quality.rerankedNdcg : null;
    const f2 = (x) => (typeof x === 'number' && isFinite(x) ? x.toFixed(2) : '');

    const panel = document.createElement('div');
    panel.className = 'wgt-panel nc-panel';
    host.appendChild(panel);

    const rows = stages.map((s, i) => {
      const row = document.createElement('div');
      row.className = 'nc-stage is-hidden';
      row.style.setProperty('--w', s.w + '%');
      row.dataset.role = s.role;
      // tag each stage as a step block so the deck slide-viz step-detector (which counts visible
      // [data-step] DOM nodes for non-SVG widgets) measures the 1→2→3 reveal correctly. Inert for the
      // is-hidden reveal mechanism + the Book scrollytelling.
      row.dataset.step = String(i);
      const nd = ndcgFor(s.role);
      // the nDCG chip is built now (so the row keeps its shape) but stays hidden until the climb step.
      const metric = nd !== null
        ? `<div class="nc-metric is-hidden">${esc(labels.ndcgLabel || 'nDCG')} = ${esc(f2(nd))}</div>`
        : '';
      row.innerHTML =
        `<div class="nc-bar"><span class="nc-name">${esc(labels['name' + i] || s.id)}</span>` +
        `<span class="nc-count">${esc(s.count)}</span></div>` +
        `<div class="nc-desc">${esc(labels['desc' + i] || '')}</div>` +
        metric;
      panel.appendChild(row);
      return row;
    });

    // step 3 — the quality climb + the cost split: a footer summarising what the cascade BUYS.
    // Only built when the data carries the numbers (deck/book mounts that pass `quality`/`latency`).
    let footer = null;
    const climbBits = [];
    if (typeof quality.bm25Ndcg === 'number' && typeof quality.rerankedNdcg === 'number') {
      climbBits.push((labels.climbLabel || 'quality climbs') + ': ' +
        f2(quality.bm25Ndcg) + ' → ' + f2(quality.rerankedNdcg) + ' nDCG');
    }
    if (typeof latency.totalMs === 'number') {
      const parts = [];
      if (typeof latency.queryEncodeMs === 'number') parts.push('encode ' + latency.queryEncodeMs);
      if (typeof latency.annSearchMs === 'number') parts.push('ANN ' + latency.annSearchMs);
      if (typeof latency.rerankMs === 'number') parts.push('rerank ' + latency.rerankMs);
      climbBits.push((labels.costLabel || 'cost') + ': ' +
        parts.join(' + ') + ' = ' + latency.totalMs + ' ms');
    }
    if (climbBits.length) {
      footer = document.createElement('div');
      footer.className = 'nc-summary is-hidden';
      footer.dataset.step = String(stages.length);   // a distinct step block for the step-detector
      footer.innerHTML = climbBits.map((t) => `<div class="nc-summary-line">${esc(t)}</div>`).join('');
      panel.appendChild(footer);
    }

    const metricEls = rows.map((r) => r.querySelector('.nc-metric'));
    const nStages = stages.length;

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      rows.forEach((r, i) => {
        // stages reveal 0..nStages-1 over steps 0..nStages-1 (unchanged); the final climb step (k ===
        // nStages) keeps every stage shown and lights the nDCG chips + the summary footer.
        const shown = Math.min(k, nStages - 1);
        r.classList.toggle('is-hidden', i > shown);
        r.classList.toggle('is-new', i === k && i < nStages);
      });
      const climb = k >= nStages;
      metricEls.forEach((m) => { if (m) m.classList.toggle('is-hidden', !climb); });
      if (footer) footer.classList.toggle('is-hidden', !climb);
    };
  },
});
