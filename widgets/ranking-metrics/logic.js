/* ranking-metrics/logic.js — L4 'The Proving Grounds' ranking-metrics explainer.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll. Reads data/l4-metrics.json —
   the SAME source the facts-gate checks (recall@k, precision@k, rr, ap, dcg, idcg, ndcg), so the
   displayed numbers can't drift. NO literals in the figure: every number comes from `data`.
   A persistent ranked list (left) with relevance marks + a per-step metric panel (right/below):
   step1 Recall@k / Precision@k · step2 MRR · step3 MAP · step4 nDCG (the headline).

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountRankingMetrics registration; render() only draws list + panel. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

// local formatters (distinct from the factory fmt's toFixed(6)) — keep inside this module.
const fmt = (x) => (Math.round(x * 10000) / 10000).toString();
const fmt2 = (x) => (Math.round(x * 100) / 100).toString();

export const mountRankingMetrics = defineWidget({
  id: 'ranking-metrics',
  rootClass: 'rm-root',
  exportName: 'mountRankingMetrics',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const W = 480;
    const ranked = data.ranked;

    // viewBox height is patched after the metric panel is laid out (frameHeightFor) so the stacked
    // MRR/MAP/nDCG blocks can never spill past the box — see _internal/book_audit2/p1-widgets.md #1.
    const svg = el('svg', { class: 'wgt-svg rm-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── ranked list (left column) — one row per ranked item, persistent at every step ──────────
    const list = { x: 18, y: 56, w: 196, rowH: 40 };
    el('text', { x: list.x, y: list.y - 20, class: 'rm-col-title' }, svg)
      .textContent = labels.listTitle || 'BM25 ranking';

    // top-k highlight band (step 1) — drawn behind the rows
    const hlK = data.ks.includes(5) ? 5 : data.ks[Math.floor(data.ks.length / 2)];
    const band = el('rect', {
      x: list.x - 4, y: list.y - 4, width: list.w + 8, height: list.rowH * hlK + 8,
      class: 'rm-band is-hidden', rx: 8 }, svg);

    const rows = ranked.map((d, i) => {
      const y0 = list.y + i * list.rowH;
      const g = el('g', { class: 'rm-row', 'data-id': d.id }, svg);
      el('rect', { x: list.x, y: y0, width: list.w, height: list.rowH - 6,
        class: 'rm-rowbg' + (d.rel ? ' is-rel' : ''), rx: 6 }, g);
      // rank number
      el('text', { x: list.x + 14, y: y0 + (list.rowH - 6) / 2 + 4, class: 'rm-rank',
        'text-anchor': 'middle' }, g).textContent = d.rank;
      // doc id
      el('text', { x: list.x + 34, y: y0 + (list.rowH - 6) / 2 + 4, class: 'rm-docid' }, g)
        .textContent = d.id;
      // relevance mark
      const mark = el('text', { x: list.x + list.w - 16, y: y0 + (list.rowH - 6) / 2 + 5,
        class: 'rm-mark ' + (d.rel ? 'is-rel' : 'is-nonrel'), 'text-anchor': 'middle' }, g);
      mark.textContent = d.rel ? '✓' : '✗';
      // per-rank nDCG contribution text (revealed at step 4) — right of the row
      const disc = (data.discounts || []).find((x) => x.rank === d.rank) || { discount: 0, contrib: 0 };
      const contribTxt = el('text', { x: list.x + list.w + 8, y: y0 + (list.rowH - 6) / 2 + 4,
        class: 'rm-contrib is-hidden' }, g);
      contribTxt.textContent = `×${fmt(disc.discount)} = ${fmt(disc.contrib)}`;
      return { d, g, mark, contribTxt, disc, y0 };
    });

    // ── metric panel (below the list) — stacked layers, one block per step ────────────────────
    const panel = { x: 18, y: list.y + ranked.length * list.rowH + 26, w: W - 36 };
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };
    layer('rp', 1); layer('mrr', 2); layer('map', 3); layer('ndcg', 4);

    const head = (name, x, y, cls, text) =>
      (add(name, el('text', { x, y, class: 'rm-annot ' + cls }, svg)).textContent = text);
    const sub = (name, x, y, text) =>
      (add(name, el('text', { x, y, class: 'rm-annot rm-sub' }, svg)).textContent = text);

    // — step 1: Recall@k / Precision@k mini-table (panel y .. +~70)
    let py = panel.y;
    head('rp', panel.x, py, 'rm-rp-h', labels.rpTitle || 'Recall@k  &  Precision@k');
    const colX = [panel.x, panel.x + 90, panel.x + 200];
    add('rp', el('text', { x: colX[0], y: py + 18, class: 'rm-th' }, svg)).textContent = 'k';
    add('rp', el('text', { x: colX[1], y: py + 18, class: 'rm-th' }, svg)).textContent = labels.recall || 'Recall@k';
    add('rp', el('text', { x: colX[2], y: py + 18, class: 'rm-th' }, svg)).textContent = labels.precision || 'Precision@k';
    data.ks.forEach((k, i) => {
      const ry = py + 18 + (i + 1) * 16;
      const hot = k === hlK;
      add('rp', el('text', { x: colX[0], y: ry, class: 'rm-td' + (hot ? ' is-hot' : '') }, svg)).textContent = k;
      add('rp', el('text', { x: colX[1], y: ry, class: 'rm-td' + (hot ? ' is-hot' : '') }, svg))
        .textContent = fmt(data.recallAtK[k]);
      add('rp', el('text', { x: colX[2], y: ry, class: 'rm-td' + (hot ? ' is-hot' : '') }, svg))
        .textContent = fmt(data.precisionAtK[k]);
    });

    // — step 2: MRR — placed beneath the table (account for ks rows)
    const tableBottom = panel.y + 18 + (data.ks.length + 1) * 16 + 10;
    head('mrr', panel.x, tableBottom, 'rm-mrr-h',
      `MRR = RR = 1/${data.firstRelevantRank} = ${fmt(data.rr)}`);
    sub('mrr', panel.x, tableBottom + 16,
      labels.mrrHint || 'first relevant result; MRR averages 1/rank over many queries');

    // — step 3: MAP
    const mapY = tableBottom + 40;
    // per-hit precision at each relevant rank (recompute from the list — derived, not hard-coded)
    let seen = 0;
    const hits = [];
    ranked.forEach((d) => {
      if (d.rel) { seen += 1; hits.push({ rank: d.rank, p: seen / d.rank }); }
    });
    head('map', panel.x, mapY, 'rm-map-h', `MAP = AP = ${fmt(data.ap)}`);
    sub('map', panel.x, mapY + 16,
      labels.mapHint || ('mean of precision at each relevant rank: ' +
        hits.map((h) => fmt2(h.p)).join(' + ') + ' over ' + hits.length));

    // — step 4: nDCG (headline)
    const ndY = mapY + 40;
    head('ndcg', panel.x, ndY, 'rm-ndcg-h',
      `DCG = ${fmt(data.dcg)}   IDCG = ${fmt(data.idcg)}`);
    add('ndcg', el('text', { x: panel.x, y: ndY + 26, class: 'rm-annot rm-ndcg-big' }, svg))
      .textContent = `nDCG = ${fmt(data.ndcg)}`;
    sub('ndcg', panel.x, ndY + 46,
      labels.ndcgHint || ('ideal order: ' + (data.idealOrder || []).join(' › ')));

    // Size the viewBox to the DEEPEST content, not a constant — the panel stacks below the list and
    // its last line (nDCG hint at ndY+46) sits well past the old H=460. frameHeightFor adds bottom
    // padding so the text's descenders clear the box too. (audit p1-widgets.md #1)
    const listBottom = list.y + ranked.length * list.rowH;     // last ranked row bottom
    const panelBottom = ndY + 46;                              // last metric-panel line baseline
    const H = frameHeightFor(Math.max(listBottom, panelBottom));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      // step 1: top-k highlight band
      band.classList.toggle('is-hidden', k < 1);

      // step 2: mark the first relevant row
      rows.forEach((r) => {
        r.g.classList.toggle('is-first-rel', k >= 2 && r.d.rank === data.firstRelevantRank);
        // step 4: reveal per-rank discount/contribution, dim the relevance mark a touch
        r.contribTxt.classList.toggle('is-hidden', k < 4);
        r.g.classList.toggle('is-ndcg', k >= 4);
      });

      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
    };
  },
});
