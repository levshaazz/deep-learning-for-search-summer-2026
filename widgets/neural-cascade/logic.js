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
  maxStep: 2,
  render({ host, data, labels }) {
    const stages = data.stages || [];

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
      row.innerHTML =
        `<div class="nc-bar"><span class="nc-name">${esc(labels['name' + i] || s.id)}</span>` +
        `<span class="nc-count">${esc(s.count)}</span></div>` +
        `<div class="nc-desc">${esc(labels['desc' + i] || '')}</div>`;
      panel.appendChild(row);
      return row;
    });

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      rows.forEach((r, i) => {
        r.classList.toggle('is-hidden', i > k);
        r.classList.toggle('is-new', i === k);
      });
    };
  },
});
