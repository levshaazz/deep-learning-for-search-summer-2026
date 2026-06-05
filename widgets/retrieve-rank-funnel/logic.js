/* retrieve-rank-funnel/logic.js — L1 'The Lost Record' climb-funnel beat.
   DRIVER-AGNOSTIC: setStep/maxStep, no input binding. Reads data/l1-funnel.json (mirrors the deck's
   funnel). Reveals the cascade stage by stage; each stage is narrower (≈10× fewer candidates). */
export function mountRetrieveRankFunnel(host, { data, labels = {} } = {}) {
  const stages = data.stages || [];
  const MAX = Math.max(0, stages.length - 1);
  host.classList.add('wgt-root', 'fn-root', 'wgt-fade');
  host.innerHTML = '';

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

  const cap = document.createElement('div'); cap.className = 'wgt-caption'; host.appendChild(cap);
  const counter = document.createElement('div'); counter.className = 'wgt-counter'; host.appendChild(counter);

  let step = -1;
  function setStep(k) {
    k = Math.max(0, Math.min(MAX, k | 0));
    if (k === step) return;
    step = k; host.dataset.step = String(k);
    rows.forEach((r, i) => {
      r.classList.toggle('is-hidden', i > k);
      r.classList.toggle('is-new', i === k);
    });
    cap.textContent = labels['s' + k] || '';
    counter.textContent = `${k} / ${MAX}`;
  }
  setStep(0);
  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}
function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
if (typeof window !== 'undefined') window.mountRetrieveRankFunnel = mountRetrieveRankFunnel;
