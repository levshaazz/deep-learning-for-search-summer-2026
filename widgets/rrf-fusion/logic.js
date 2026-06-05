/* rrf-fusion/logic.js — L3 'climb-rrf' beat: Reciprocal Rank Fusion explainer.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no input. Reads data/l3-rrf.json
   (two input rankers + the RRF-fused order). Three DOM-div columns:
   LEFT = BM25, MIDDLE = Cosine, RIGHT = Fused (revealed last). All text via
   i18n keys; theme via CSS var(--token, fallback). Works under arrow keys
   (slide) or scroll (Book). maxStep = 3. */
export function mountRrfFusion(host, { data, labels = {} } = {}) {
  const MAX = 3;
  const k = data.k;
  const bm25 = data.lists?.bm25 || [];
  const cosine = data.lists?.cosine || [];
  const order = data.order || [];
  const fused = data.fused || [];
  const top = fused[0] || null; // the top fused doc, picked at step 1

  host.classList.add('wgt-root', 'rrf-root', 'wgt-fade');
  host.innerHTML = '';

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

  const cap = document.createElement('div');
  cap.className = 'wgt-caption';
  host.appendChild(cap);
  const counter = document.createElement('div');
  counter.className = 'wgt-counter';
  host.appendChild(counter);

  // Find a chip by doc id within a column's chip set.
  function chipOf(set, id) {
    return set.chips.find((c) => c.dataset.id === id) || null;
  }

  let step = -1;
  function setStep(s) {
    s = Math.max(0, Math.min(MAX, s | 0));
    if (s === step) return;
    step = s;
    host.dataset.step = String(s);

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

    cap.textContent = labels['s' + s] || '';
    counter.textContent = `${s} / ${MAX}`;
  }

  setStep(0);
  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}

function reciprocalText(k, rank) {
  return `1/(${k}+${rank})`;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

if (typeof window !== 'undefined') window.mountRrfFusion = mountRrfFusion;
