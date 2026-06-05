/* bpe-merge-ledger/logic.js — L2 'First Contact' climb-bpe beat (Tokenosaurus).
   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): setStep/maxStep, binds no input. Reads
   data/l2-bpe.json (firstMerges). Reveals the tokenizer's first learned merges one per step —
   the same figure works under arrow keys (slide) or scroll (Book). All text via i18n keys. */
const N_SHOWN = 6;

export function mountBpeLedger(host, { data, labels = {} } = {}) {
  const merges = (data.firstMerges || []).slice(0, N_SHOWN);
  const MAX = Math.max(0, merges.length - 1);

  host.classList.add('wgt-root', 'bpe-root', 'wgt-fade');
  host.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'wgt-panel bpe-panel';
  host.appendChild(panel);

  const head = document.createElement('div');
  head.className = 'bpe-head';
  head.textContent = labels.head || 'First learned merges (by frequency)';
  panel.appendChild(head);

  const rows = merges.map((m) => {
    const row = document.createElement('div');
    row.className = 'bpe-row is-hidden';
    row.innerHTML =
      `<span class="bpe-rank">${String(m.rank).padStart(2, '0')}</span>` +
      `<span class="bpe-tok">${esc(m.left)}</span><span class="bpe-op">+</span>` +
      `<span class="bpe-tok">${esc(m.right)}</span><span class="bpe-op">→</span>` +
      `<span class="bpe-tok bpe-joined">${esc(m.joined)}</span>`;
    panel.appendChild(row);
    return row;
  });

  const cap = document.createElement('div');
  cap.className = 'wgt-caption';
  host.appendChild(cap);
  const counter = document.createElement('div');
  counter.className = 'wgt-counter';
  host.appendChild(counter);

  let step = -1;
  function setStep(k) {
    k = Math.max(0, Math.min(MAX, k | 0));
    if (k === step) return;
    step = k;
    host.dataset.step = String(k);
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

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

if (typeof window !== 'undefined') window.mountBpeLedger = mountBpeLedger;
