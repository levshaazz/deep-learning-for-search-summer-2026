/* ndcg-graded/logic.js — L4 'state which gain you used': the same ranking scored binary vs graded.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll (the Book's Scrollama and the deck's
   arrow keys both call setStep). Reads data/l4-graded.json — the SAME source the facts-gate checks
   (linear nDCG 0.6622, exponential 0.6563; per-position discounts). NO literals in the figure: every
   number is read or DERIVED from `data`, so the displayed values can't drift. Binary nDCG (0.6766) is
   derived from the same file by flattening grades to 1-if-relevant, then cross-checked numerically.

   The existing ranking-metrics widget does binary nDCG term-by-term for ONE gain; this widget shows
   the part it cannot — three gain functions on the SAME ranking, landing on 0.6766 / 0.6622 / 0.6563.

   Stepped story — watch the gain function change the score:
     step0  the ranking with its relevance grades (0/1/3) and the 1/log₂(rank+1) discount column
     step1  binary gain (grade→0/1): DCG 1.7333, IDCG 2.5616, nDCG 0.6766
     step2  linear graded gain (g):  DCG 3.8565, IDCG 5.8235, nDCG 0.6622
     step3  exponential gain 2^g−1:  DCG 8.1029, IDCG 12.3472, nDCG 0.6563 — lowest of the three

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup, the
   caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced SVG
   builder and the window.mountNdcgGraded registration; render() only draws list + gain + readout. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

// local formatters — kept inside this module (distinct from the factory fmt's toFixed(6)).
const f4 = (x) => (Math.round(x * 10000) / 10000).toFixed(4);   // 0.6766, 3.8565, 12.3472 (fixed 4dp)
const dsc = (x) => (Math.round(x * 10000) / 10000).toString();  // discount, trailing zeros trimmed

export const mountNdcgGraded = defineWidget({
  id: 'ndcg-graded',
  rootClass: 'ndg-root',
  exportName: 'mountNdcgGraded',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const W = 480;
    const ranked = data.ranked;                          // [{id, cat, rank, grade}]
    const disc = {};                                     // rank → discount, from perPosition
    data.perPosition.forEach((p) => (disc[p.rank] = p.discount));

    // three gain functions over a grade g (all derived from the SAME grades + discounts):
    const gainFns = {
      binary: (g) => (g > 0 ? 1 : 0),
      linear: (g) => g,
      exp: (g) => Math.pow(2, g) - 1,
    };
    // build a variant's DCG/IDCG/nDCG by gain fn (DCG in rank order; IDCG by grades sorted desc).
    const grades = ranked.map((r) => r.grade);
    const idealGrades = [...grades].sort((a, b) => b - a);
    const variant = (fn) => {
      let dcg = 0, idcg = 0;
      ranked.forEach((r, i) => { dcg += fn(r.grade) * disc[i + 1]; });
      idealGrades.forEach((g, i) => { idcg += fn(g) * disc[i + 1]; });
      return { dcg, idcg, ndcg: dcg / idcg };
    };
    // DISPLAYED values come straight from data so they are EXACT to the curated source the gate reads:
    //   linear / exponential → the published blocks (DCG/IDCG/nDCG); binary → derived from the same
    //   discounts (no binary block exists in l4-graded.json, and the derivation is exact: 1.7333 /
    //   2.5616 / 0.6766, matching l4-metrics.json). `variant()` is recomputed only to ASSERT parity so
    //   a silent drift between the derivation and the published numbers would surface in dev.
    const V = {
      binary: variant(gainFns.binary),
      linear: { dcg: data.linear.dcg, idcg: data.linear.idcg, ndcg: data.linear.ndcg },
      exp: { dcg: data.exponential.dcg, idcg: data.exponential.idcg, ndcg: data.exponential.ndcg },
    };
    // parity assertion (no-op on correct data): recomputed graded scores must match the published ones.
    const recLin = variant(gainFns.linear), recExp = variant(gainFns.exp);
    if (Math.abs(recLin.ndcg - V.linear.ndcg) > 5e-4 || Math.abs(recExp.ndcg - V.exp.ndcg) > 5e-4) {
      console.warn('[ndcg-graded] recomputed graded nDCG drifts from published data — check l4-graded.json');
    }

    const svg = el('svg', { class: 'wgt-svg ndg-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── ranked table: rank · grade · gain · discount, one row per result ──────────────────────────
    const list = { x: 16, y: 52, rowH: 30, w: W - 32 };
    // column x positions
    const col = { rank: list.x + 12, grade: list.x + 70, gain: list.x + 150, disc: list.x + 250 };
    el('text', { x: col.rank, y: list.y - 14, class: 'ndg-th', 'text-anchor': 'middle' }, svg)
      .textContent = labels.rankCol || 'rank';
    el('text', { x: col.grade, y: list.y - 14, class: 'ndg-th', 'text-anchor': 'middle' }, svg)
      .textContent = labels.gradeCol || 'grade';
    const gainHdr = el('text', { x: col.gain, y: list.y - 14, class: 'ndg-th ndg-th-gain', 'text-anchor': 'middle' }, svg);
    gainHdr.textContent = labels.gainCol || 'gain';
    el('text', { x: col.disc, y: list.y - 14, class: 'ndg-th', 'text-anchor': 'middle' }, svg)
      .textContent = labels.discCol || 'discount';

    const rows = ranked.map((r, i) => {
      const y0 = list.y + i * list.rowH;
      const yc = y0 + list.rowH / 2;
      const g = el('g', { class: 'ndg-row', 'data-rank': r.rank }, svg);
      el('rect', { x: list.x, y: y0, width: list.w, height: list.rowH - 4,
        class: 'ndg-rowbg' + (r.grade > 0 ? ' is-rel' : ''), rx: 5 }, g);
      el('text', { x: col.rank, y: yc + 4, class: 'ndg-rank', 'text-anchor': 'middle' }, g)
        .textContent = r.rank;
      // grade chip (0/1/3)
      el('text', { x: col.grade, y: yc + 4, class: 'ndg-grade g' + r.grade, 'text-anchor': 'middle' }, g)
        .textContent = r.grade;
      // gain value — switches by step (binary/linear/exp)
      const gainTxt = el('text', { x: col.gain, y: yc + 4, class: 'ndg-gain', 'text-anchor': 'middle' }, g);
      // discount
      el('text', { x: col.disc, y: yc + 4, class: 'ndg-disc', 'text-anchor': 'middle' }, g)
        .textContent = dsc(disc[r.rank]);
      return { r, g, gainTxt, yc };
    });

    // ── readout panel below the table (DCG / IDCG / nDCG for the active variant) ────────────────────
    const panelY = list.y + ranked.length * list.rowH + 26;
    const px = list.x;
    // active-variant tag (which gain function is in play)
    const tag = el('text', { x: px, y: panelY, class: 'ndg-tag' }, svg);
    // the DCG accumulation written out term-by-term (gain·discount for each nonzero hit), so the
    // total is BUILT on screen rather than snapping to a finished number — see worklist L4 #1.
    const dcgTerms = el('text', { x: px, y: panelY + 22, class: 'ndg-dcg-terms' }, svg);
    const dcgLine = el('text', { x: px, y: panelY + 42, class: 'ndg-dcg' }, svg);
    const ndcgLine = el('text', { x: px, y: panelY + 64, class: 'ndg-ndcg' }, svg);

    // a small three-row scoreboard that fills in as each variant lands (the disagreement, side by side)
    const board = { x: px, y: panelY + 74, rowH: 20 };
    const boardRows = [
      { key: 'binary', tag: labels.binaryTag || 'binary gain', v: V.binary },
      { key: 'linear', tag: labels.linearTag || 'linear gain  (g)', v: V.linear },
      { key: 'exp', tag: labels.expTag || 'exponential gain  (2^g − 1)', v: V.exp },
    ].map((b, i) => {
      const y = board.y + i * board.rowH + 12;
      const g = el('g', { class: 'ndg-board-row is-hidden', 'data-key': b.key }, svg);
      el('text', { x: board.x, y, class: 'ndg-board-tag' }, g).textContent = b.tag;
      el('text', { x: board.x + W - 64, y, class: 'ndg-board-val', 'text-anchor': 'end' }, g)
        .textContent = 'nDCG = ' + f4(b.v.ndcg);
      return { ...b, g, y };
    });
    const verdict = el('text', { x: px, y: board.y + 3 * board.rowH + 26, class: 'ndg-verdict is-hidden' }, svg);
    verdict.textContent = labels.verdict || 'Same ranking, three scores — state which gain you used.';

    // Size the viewBox to the DEEPEST drawn line so the scoreboard can never spill past the box.
    const H = frameHeightFor(board.y + 3 * board.rowH + 26);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // which variant is active at step k (1→binary, 2→linear, 3→exp; step 0 shows grades only)
    const stepVariant = { 1: 'binary', 2: 'linear', 3: 'exp' };
    const stepGainFn = { 1: gainFns.binary, 2: gainFns.linear, 3: gainFns.exp };
    const stepTag = { 1: labels.binaryTag || 'binary gain', 2: labels.linearTag || 'linear gain  (g)',
      3: labels.expTag || 'exponential gain  (2^g − 1)' };

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      const key = stepVariant[k];
      const fn = stepGainFn[k];
      // gain column: blank at step 0, else the active variant's gain per row
      rows.forEach(({ r, gainTxt, g }) => {
        gainTxt.textContent = fn ? String(fn(r.grade)) : '';
        // highlight the strong (grade-3) rows once exponential dramatises them
        g.classList.toggle('is-strong', k >= 1 && r.grade >= 3);
      });
      gainHdr.classList.toggle('is-active', k >= 1);

      // readout for the active variant
      const v = key ? V[key] : null;
      tag.textContent = k >= 1 ? stepTag[k] : '';
      tag.classList.toggle('is-hidden', k < 1);
      tag.setAttribute('data-key', key || '');
      // DCG accumulation, term by term: gain·discount for each nonzero hit, derived from the same
      // grades + discounts the rows show, so the total below is built, not asserted.
      dcgTerms.textContent = fn
        ? ranked.filter((r) => fn(r.grade) > 0)
            .map((r) => `${dsc(fn(r.grade))}·${dsc(disc[r.rank])}`).join(' + ') + ` = ${f4(v.dcg)}`
        : '';
      dcgTerms.classList.toggle('is-hidden', k < 1);
      dcgLine.textContent = v
        ? `${labels.dcgLabel || 'DCG'} = ${f4(v.dcg)}    ${labels.idcgLabel || 'IDCG'} = ${f4(v.idcg)}`
        : '';
      dcgLine.classList.toggle('is-hidden', k < 1);
      ndcgLine.textContent = v ? `${labels.ndcgLabel || 'nDCG'} = ${f4(v.ndcg)}` : '';
      ndcgLine.classList.toggle('is-hidden', k < 1);
      ndcgLine.setAttribute('data-key', key || '');

      // scoreboard rows accumulate as each variant is reached (binary@1, linear@2, exp@3)
      boardRows.forEach((b, i) => {
        const reached = k >= i + 1;
        b.g.classList.toggle('is-hidden', !reached);
        b.g.classList.toggle('is-current', key === b.key);
      });
      verdict.classList.toggle('is-hidden', k < 3);
    };
  },
});
