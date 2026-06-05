/* inverted-index/logic.js — the "explainable unit" for L3 inverted-index / postings.
   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All ids/postings come from data/l3-index.json; all human text
   comes from i18n keys passed in `labels`. Cumulative reveal via toggling `is-hidden`.

   Steps (maxStep = 3):
     0  → 8 neutral doc cards (id + snippet).                                      caption s0
     1  → reveal query[0] postings list; accent-mark docs in that list.            caption s1
     2  → also reveal query[1] postings list with --warm mark.                     caption s2
     3  → AND-merge: highlight the intersection strongly, dim the rest.            caption s3

   Usage:
     import { mountInvertedIndex } from './logic.js';
     const fig = mountInvertedIndex(el, { data, labels });
     fig.setStep(2); fig.maxStep;  // 3
*/
const MAX = 3;

export function mountInvertedIndex(host, { data, labels = {} } = {}) {
  const docs = data.docs || [];
  const query = data.query || [];
  const t1 = query[0];
  const t2 = query[1];
  const terms = data.terms || {};
  const post1 = (terms[t1] && terms[t1].postings) || [];
  const post2 = (terms[t2] && terms[t2].postings) || [];
  const set1 = new Set(post1);
  const set2 = new Set(post2);
  const intersection = (data.andMerge && data.andMerge.intersection) || [];
  const hit = new Set(intersection);

  host.classList.add('wgt-root', 'ix-root', 'wgt-fade');
  host.innerHTML = '';

  // --- doc card grid (step 0) -------------------------------------------------
  const grid = document.createElement('div');
  grid.className = 'wgt-panel ix-grid';
  host.appendChild(grid);

  const cards = docs.map((d) => {
    const card = document.createElement('div');
    card.className = 'ix-card';
    card.dataset.id = d.id;
    card.innerHTML =
      `<span class="ix-card-id">${esc(d.id)}</span>` +
      `<span class="ix-card-snip">${esc(d.snippet || '')}</span>`;
    // mark dots (one per term) — hidden until their term's step
    const marks = document.createElement('span');
    marks.className = 'ix-marks';
    const m1 = document.createElement('span');
    m1.className = 'ix-mark ix-mark-1 is-hidden';
    const m2 = document.createElement('span');
    m2.className = 'ix-mark ix-mark-2 is-hidden';
    marks.appendChild(m1);
    marks.appendChild(m2);
    card.appendChild(marks);
    grid.appendChild(card);
    return { card, m1, m2, id: d.id };
  });

  // --- postings panel (steps 1–2) --------------------------------------------
  const postings = document.createElement('div');
  postings.className = 'wgt-panel ix-postings';
  host.appendChild(postings);

  const row1 = postingsRow(t1, post1, terms[t1] && terms[t1].df, 'ix-prow-1');
  const row2 = postingsRow(t2, post2, terms[t2] && terms[t2].df, 'ix-prow-2');
  row1.classList.add('is-hidden');
  row2.classList.add('is-hidden');
  postings.appendChild(row1);
  postings.appendChild(row2);

  // --- AND-merge result row (step 3) -----------------------------------------
  const merge = document.createElement('div');
  merge.className = 'ix-merge is-hidden';
  const op = `${esc(t1)} ${labels.andOp || 'AND'} ${esc(t2)}`;
  const ids = intersection.length
    ? intersection.map((id) => esc(id)).join(', ')
    : (labels.empty || '∅');
  merge.innerHTML =
    `<span class="ix-merge-op">${op}</span>` +
    `<span class="ix-merge-arrow">→</span>` +
    `<span class="ix-merge-set">[ ${ids} ]</span>`;
  postings.appendChild(merge);

  // --- caption + counter ------------------------------------------------------
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

    // postings rows: term1 from step 1, term2 from step 2
    row1.classList.toggle('is-hidden', k < 1);
    row2.classList.toggle('is-hidden', k < 2);
    merge.classList.toggle('is-hidden', k < 3);

    cards.forEach((c) => {
      const in1 = set1.has(c.id);
      const in2 = set2.has(c.id);
      // mark dots become visible once their term's step is reached AND the doc is in that list
      c.m1.classList.toggle('is-hidden', !(k >= 1 && in1));
      c.m2.classList.toggle('is-hidden', !(k >= 2 && in2));
      // step-3 AND result: winners pop, losers dim
      const won = hit.has(c.id);
      c.card.classList.toggle('is-hit', k >= 3 && won);
      c.card.classList.toggle('is-dim', k >= 3 && !won);
      // gentle "marked" emphasis on the card in steps 1–2
      c.card.classList.toggle('is-marked',
        k < 3 && ((k >= 1 && in1) || (k >= 2 && in2)));
    });

    cap.textContent = labels['s' + k] || '';
    counter.textContent = `${k} / ${MAX}`;
  }
  setStep(0);

  return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
}

function postingsRow(term, postings, df, cls) {
  const row = document.createElement('div');
  row.className = `ix-prow ${cls}`;
  const dfTxt = (df == null ? postings.length : df);
  const list = postings.map((id) => `<span class="ix-pid">${esc(id)}</span>`).join('');
  row.innerHTML =
    `<span class="ix-term">${esc(term)}</span>` +
    `<span class="ix-df">df=${esc(dfTxt)}</span>` +
    `<span class="ix-arrow">→</span>` +
    `<span class="ix-plist">${list}</span>`;
  return row;
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

if (typeof window !== 'undefined') window.mountInvertedIndex = mountInvertedIndex;
