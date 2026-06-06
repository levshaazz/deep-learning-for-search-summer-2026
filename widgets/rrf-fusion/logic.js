/* rrf-fusion/logic.js — L3 'climb-rrf' beat: Reciprocal Rank Fusion explainer.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no input. Reads data/l3-rrf.json
   (two input rankers + the RRF-fused order). Three DOM-div columns:
   LEFT = BM25, MIDDLE = Cosine, RIGHT = Fused (revealed last). All text via
   i18n keys; theme via CSS var(--token, fallback). Works under arrow keys
   (slide) or scroll (Book). maxStep = 3.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, esc() and the
   window.mountRrfFusion registration; render() only draws the three columns + score readout. */
import { defineWidget, esc } from '../_widget-base.js';

export const mountRrfFusion = defineWidget({
  id: 'rrf-fusion',
  rootClass: 'rrf-root',
  maxStep: 3,
  render({ host, data, labels }) {
    const k = data.k;
    const bm25 = data.lists?.bm25 || [];
    const cosine = data.lists?.cosine || [];
    const order = data.order || [];
    const fused = data.fused || [];
    const top = fused[0] || null; // the top fused doc, picked at step 1

    const grid = document.createElement('div');
    grid.className = 'rrf-grid';
    host.appendChild(grid);

    // Build one ranked column of chips. `role` themes it; `kind` is "input" or "fused".
    function buildColumn(role, headKey, ids, kind, rankKey) {
      const col = document.createElement('div');
      col.className = 'rrf-col';
      col.dataset.role = role;
      col.dataset.kind = kind;

      const head = document.createElement('div');
      head.className = 'rrf-head';
      head.textContent = labels[headKey] || role;
      col.appendChild(head);

      const list = document.createElement('div');
      list.className = 'rrf-list';
      col.appendChild(list);

      const chips = ids.map((id, i) => {
        const rank = i + 1;
        const chip = document.createElement('div');
        chip.className = 'rrf-chip';
        chip.dataset.id = id;
        chip.dataset.rank = String(rank);
        chip.innerHTML =
          `<span class="rrf-rank">${rank}</span>` +
          `<span class="rrf-docid">${esc(id)}</span>` +
          `<span class="rrf-recip"></span>`;
        list.appendChild(chip);
        return chip;
      });

      grid.appendChild(col);
      return { col, list, chips };
    }

    const colA = buildColumn('bm25', 'headBm25', bm25, 'input');
    const colB = buildColumn('cosine', 'headCosine', cosine, 'input');
    const colF = buildColumn('fused', 'headFused', order, 'fused');

    // Score readout sits under the fused column; revealed at step 2.
    const score = document.createElement('div');
    score.className = 'rrf-score is-hidden';
    if (top) {
      const fmt = (n) => (typeof n === 'number' ? n.toFixed(6) : '');
      score.innerHTML =
        `<span class="rrf-docid">${esc(top.id)}</span>` +
        `<span class="rrf-sum">` +
        `<span class="rrf-term">${fmt(top.contributions?.bm25)}</span>` +
        `<span class="rrf-op">+</span>` +
        `<span class="rrf-term">${fmt(top.contributions?.cosine)}</span>` +
        `<span class="rrf-op">=</span>` +
        `<span class="rrf-total">${fmt(top.rrf)}</span>` +
        `</span>`;
    }
    colF.col.appendChild(score);

    // Find a chip by doc id within a column's chip set.
    function chipOf(set, id) {
      return set.chips.find((c) => c.dataset.id === id) || null;
    }

    // per-step update (factory clamps s to [0,maxStep] and owns caption/counter)
    return function update(s) {
      // Column visibility: inputs always shown; fused only from step 3.
      colF.col.classList.toggle('is-hidden', s < 3);
      score.classList.toggle('is-hidden', s < 2);

      // Reset per-step chip decorations across all columns.
      [colA, colB, colF].forEach((set) => {
        set.chips.forEach((c) => {
          c.classList.remove('is-pick', 'is-top');
          c.querySelector('.rrf-recip').textContent = '';
        });
      });

      // Step 1+: pick the top fused doc in BOTH input lists, annotate reciprocals.
      if (s >= 1 && top) {
        const a = chipOf(colA, top.id);
        const b = chipOf(colB, top.id);
        if (a) {
          a.classList.add('is-pick');
          a.querySelector('.rrf-recip').textContent = reciprocalText(k, top.rankBm25);
        }
        if (b) {
          b.classList.add('is-pick');
          b.querySelector('.rrf-recip').textContent = reciprocalText(k, top.rankCosine);
        }
      }

      // Step 3: the fused doc ranked #1 by both rises to the top — flag it.
      if (s >= 3 && top) {
        const f = chipOf(colF, top.id);
        if (f) f.classList.add('is-top');
      }
    };
  },
});

function reciprocalText(k, rank) {
  return `1/(${k}+${rank})`;
}
