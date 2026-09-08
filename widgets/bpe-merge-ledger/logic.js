/* bpe-merge-ledger/logic.js — L2 'First Contact' climb-bpe beat (Tokenosaurus).
   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): setStep/maxStep, binds no input. Reads
   data/l2-bpe.json (firstMerges). Reveals the tokenizer's first learned merges one per step —
   the same figure works under arrow keys (slide) or scroll (Book). All text via i18n keys.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the esc() helper and the
   window.mountBpeMergeLedger registration; render() only draws the merge rows + per-step reveal. */
import { defineWidget, esc } from '../_widget-base.js';

const N_SHOWN = 6;

export const mountBpeMergeLedger = defineWidget({
  id: 'bpe-merge-ledger',
  rootClass: 'bpe-root',
  // Имя ОБЯЗАНО быть mount+PascalCase(id): deck-adapter ищет ровно window[mountName(id)].
  // Стояло 'mountBpeLedger' (без Merge) — виджет регистрировался под одним именем, а адаптер
  // искал под другим, и слайд 27a деки 02 ехал ПУСТЫМ. Ни один гейт этого не видел до G13.
  exportName: 'mountBpeMergeLedger',
  maxStep: 5,
  render({ host, data, labels }) {
    const merges = (data.firstMerges || []).slice(0, N_SHOWN);

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

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      rows.forEach((r, i) => {
        r.classList.toggle('is-hidden', i > k);
        r.classList.toggle('is-new', i === k);
      });
    };
  },
});
