/* retrieve-rank-funnel/logic.js — L1 'The Lost Record' climb-funnel beat.
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l1-funnel.json (mirrors the deck's
   funnel). Reveals the cascade stage by stage; each stage is narrower (≈10× fewer candidates).

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the esc() helper and the
   window.mountRetrieveRankFunnel registration; render() only draws the stage rows + per-step reveal. */
import { defineWidget, esc } from '../_widget-base.js';

export const mountRetrieveRankFunnel = defineWidget({
  id: 'retrieve-rank-funnel',
  rootClass: 'fn-root',
  exportName: 'mountRetrieveRankFunnel',
  maxStep: 3,
  render({ host, data, labels }) {
    const stages = data.stages || [];

    const panel = document.createElement('div');
    panel.className = 'wgt-panel fn-panel';
    host.appendChild(panel);

    const rows = stages.map((s, i) => {
      const row = document.createElement('div');
      row.className = 'fn-stage is-hidden';
      row.style.setProperty('--w', s.w + '%');
      row.dataset.role = s.role;
      row.innerHTML =
        `<div class="fn-bar"><span class="fn-name">${esc(labels['name' + i] || s.id)}</span>` +
        `<span class="fn-count">${esc(s.count)}</span></div>` +
        `<div class="fn-desc">${esc(labels['desc' + i] || '')}</div>`;
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
