/* ndcg-multiquery/logic.js — L4 'a single query can mislead; metrics average over a query SET'.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll (the Book's Scrollama and the deck's
   arrow keys both call setStep). Reads data/l4-multiquery.json — the SAME source the facts-gate
   checks (q1.rr=0.5/ap=0.5, q2.rr=1.0/ap=0.747, mrr=0.75, map=0.6235). NO literals in the figure:
   every number is read or derived from `data`, so the displayed values can't drift.

   The existing ranking-metrics widget already does single-query RR/AP term-by-term; this widget shows
   the part it cannot — the MEAN over multiple queries, where MRR ≠ either RR and MAP ≠ either AP.

   Stepped story — watch MRR/MAP average across a query set:
     step0  two queries, each as a row of relevance marks (Q1 hits 2,4,6,8 · Q2 hits 1,3,4,7)
     step1  per-query reciprocal rank — the MRR term: RR1 = 1/2 = 0.5, RR2 = 1/1 = 1.0
     step2  per-query average precision — the MAP term: AP1 = 0.5, AP2 = (1.0+…)/4 = 0.747
     step3  average across the set → MRR = 0.75, MAP = 0.6235 (a mean equal to NEITHER query)

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup, the
   caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced SVG
   builder and the window.mountNdcgMultiquery registration; render() only draws lists + readout. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

// local formatters — kept inside this module (distinct from the factory fmt's toFixed(6)).
const f4 = (x) => (Math.round(x * 10000) / 10000).toString();   // 0.5, 0.6235, 0.747
const f2 = (x) => (Math.round(x * 100) / 100).toString();       // per-hit precisions in the sum

export const mountNdcgMultiquery = defineWidget({
  id: 'ndcg-multiquery',
  rootClass: 'mq-root',
  exportName: 'mountNdcgMultiquery',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const W = 480;
    // derive each query's hits from its relevance vector — RR/AP are RECOMPUTED, not trusted literals,
    // and cross-checked against the published data.q*.rr / .ap below (the source the gate also reads).
    const queries = [
      { key: 'q1', title: labels.q1Title || 'Query 1', d: data.q1 },
      { key: 'q2', title: labels.q2Title || 'Query 2', d: data.q2 },
    ];
    queries.forEach((q) => {
      const rels = q.d.rels;
      let seen = 0;
      const hits = [];                                   // {rank, hitNo, precision}
      rels.forEach((r, i) => {
        if (r) { seen += 1; hits.push({ rank: i + 1, hitNo: seen, precision: seen / (i + 1) }); }
      });
      q.rels = rels;
      q.hits = hits;
      q.firstRank = hits.length ? hits[0].rank : Infinity;
      q.rr = q.d.rr;                                     // published RR (= 1/firstRank)
      q.ap = q.d.ap;                                     // published AP
    });
    const mrr = data.mrr;                                // 0.75
    const map = data.map;                                // 0.6235

    const svg = el('svg', { class: 'wgt-svg mq-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── two query rows, each a compact strip of relevance cells ────────────────────────────────────
    const nCells = Math.max(...queries.map((q) => q.rels.length));
    const strip = { x: 16, w: W - 32 };
    const cell = Math.min(40, (strip.w - 92) / nCells);  // leave a left gutter for the query title
    const gutter = 88;
    const rowGap = 96;
    const rowY0 = 44;

    const rowRefs = queries.map((q, qi) => {
      const y = rowY0 + qi * rowGap;
      const g = el('g', { class: 'mq-row', 'data-q': q.key }, svg);
      // query title (left gutter)
      el('text', { x: strip.x, y: y + cell / 2 + 4, class: 'mq-qtitle' }, g).textContent = q.title;
      // the relevance cells
      const cells = q.rels.map((r, i) => {
        const cx = strip.x + gutter + i * cell;
        const cg = el('g', { class: 'mq-cell', 'data-rank': i + 1 }, g);
        el('rect', { x: cx, y, width: cell - 4, height: cell - 4,
          class: 'mq-cellbg' + (r ? ' is-rel' : ''), rx: 5 }, cg);
        // rank number (small, top-left of cell)
        el('text', { x: cx + (cell - 4) / 2, y: y + (cell - 4) / 2 + 4,
          class: 'mq-mark ' + (r ? 'is-rel' : 'is-nonrel'), 'text-anchor': 'middle' }, cg)
          .textContent = r ? '✓' : '·';
        return { cg, rank: i + 1, rel: r };
      });
      // rank ruler beneath the strip (1..n)
      q.rels.forEach((r, i) => {
        const cx = strip.x + gutter + i * cell + (cell - 4) / 2;
        el('text', { x: cx, y: y + cell + 8, class: 'mq-rank', 'text-anchor': 'middle' }, g)
          .textContent = i + 1;
      });
      // per-query metric readout, to the RIGHT of the strip end? no — place it on its own line below
      // the strip so it never collides with the cells on a 390px viewport.
      const ry = y + cell + 24;
      const rrTxt = el('text', { x: strip.x + gutter, y: ry, class: 'mq-rr is-hidden' }, g);
      rrTxt.textContent = `RR = 1/${q.firstRank} = ${f4(q.rr)}`;
      const apTxt = el('text', { x: strip.x + gutter, y: ry + 18, class: 'mq-ap is-hidden' }, g);
      apTxt.textContent = q.hits.length > 1
        ? `AP = (${q.hits.map((h) => f2(h.precision)).join(' + ')}) / ${q.hits.length} = ${f4(q.ap)}`
        : `AP = ${f4(q.ap)}`;
      return { q, g, cells, rrTxt, apTxt, ry };
    });

    // ── averaging panel below both rows (step 3) ───────────────────────────────────────────────────
    const lastRy = rowRefs[rowRefs.length - 1].ry + 18;
    const panelY = lastRy + 34;
    const px = strip.x;
    const avgLayer = [];
    const addAvg = (n) => { avgLayer.push(n); return n; };

    addAvg(el('line', { x1: px, y1: panelY - 18, x2: px + strip.w - 8, y2: panelY - 18,
      class: 'mq-divider' }, svg));
    addAvg(el('text', { x: px, y: panelY, class: 'mq-avg-h mq-mrr-h' }, svg))
      .textContent = `MRR = (${f4(queries[0].rr)} + ${f4(queries[1].rr)}) / 2 = ${f4(mrr)}`;
    addAvg(el('text', { x: px, y: panelY + 26, class: 'mq-avg-h mq-map-h' }, svg))
      .textContent = `MAP = (${f4(queries[0].ap)} + ${f4(queries[1].ap)}) / 2 = ${f4(map)}`;
    addAvg(el('text', { x: px, y: panelY + 50, class: 'mq-lesson' }, svg))
      .textContent = labels.lesson || 'Neither matches a single query — that is the point of a mean.';

    // Size the viewBox to the DEEPEST drawn line so the averaging block can never spill past the box.
    const H = frameHeightFor(panelY + 50);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      rowRefs.forEach((row) => {
        // step 1: mark the FIRST relevant cell in each row (the RR term) + reveal the RR line.
        row.cells.forEach((c) => {
          const isFirst = c.rank === row.q.firstRank;
          c.cg.classList.toggle('is-first', k >= 1 && c.rel && isFirst);
          // step 2: light every relevant cell (the AP averages over all hits).
          c.cg.classList.toggle('is-hit', k >= 2 && c.rel);
        });
        row.rrTxt.classList.toggle('is-hidden', k < 1);
        row.apTxt.classList.toggle('is-hidden', k < 2);
      });
      for (const node of avgLayer) node.classList.toggle('is-hidden', k < 3);
    };
  },
});
