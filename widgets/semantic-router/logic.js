/* semantic-router/logic.js — L10 'route + construct' beat: a query is embedded, cosine-compared to 3
   prompt-template centroids (factQA / howTo / compare), and ROUTED to the argmax template. Then the same
   NL query is CONSTRUCTED into a structured retrieval — a metadata filter (self-query) or a SQL query
   (text-to-SQL).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll — the deck arrow keys and the Book
   Scrollama both call setStep(k). EVERY number (the 3 cosines, the argmax route) comes straight from
   data/l10-routing.json (facts-gated, recomputed by gen_l10); all human text from i18n `labels`. The two
   construct examples (NL→filter, NL→SQL) are descriptive, also read from the data. Built on _widget-base.js.

   Steps (maxStep = 3):
     0  → the query pill appears above 3 empty template targets (factQA / howTo / compare).        s0
     1  → cosine sims computed: the 3 bars grow to their cos values (from data.sims).               s1
     2  → the argmax route lights up (→ howTo) — that template wins.                                s2
     3  → CONSTRUCT: the winning route hands the NL query to a structured builder — NL→metadata
           filter (self-query) and NL→SQL (text-to-SQL) cards appear.                               s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountSemanticRouter = defineWidget({
  id: 'semantic-router',
  rootClass: 'sr-root',
  exportName: 'mountSemanticRouter',
  maxStep: 3,
  render({ host, data, labels, el }) {
    data = data || {};                       // defensive: a mis-wired mount must not throw
    const cents = data.centroids || [];      // [{template, centroid, cos}]
    const sims = data.sims || cents.map((c) => c.cos || 0);
    const route = data.route || (cents.length ? cents[0].template : '');
    const construct = data.construct || {};
    const fmt4 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(4));

    const N = Math.max(1, cents.length);
    const argmax = sims.reduce((best, v, i) => (v > sims[best] ? i : best), 0);

    const W = 480, PAD = 22;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg sr-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'sr-ar', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'sr-arhead' }, mk);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // ── the query pill (top) ──
    layer('query', 0);
    const qW = Math.min(300, W - 2 * PAD), qx = W / 2 - qW / 2, qy = 20;
    add('query', el('rect', { x: qx, y: qy, width: qW, height: 30, rx: 15, class: 'sr-query' }, svg));
    add('query', el('text', { x: W / 2, y: qy + 20, class: 'sr-querytxt', 'text-anchor': 'middle' }, svg))
      .textContent = labels.query || 'embed the query · cosine to each template';

    // ── 3 template targets, each with a horizontal cosine bar ──
    const rowTop = 72, rowH = 34, rowGap = 18, labelW = 96;
    const barX = PAD + labelW, barMaxW = W - barX - PAD - 64;   // leave room for the value at the right
    const rowY = (i) => rowTop + i * (rowH + rowGap);
    const SIMMAX = 1;                                          // cosine domain ceiling (full bar = 1.0)

    layer('targets', 0);
    const bars = [], barVals = [], rowGroups = [];
    cents.forEach((c, i) => {
      const y = rowY(i), tmpl = c.template;
      const g = el('g', { class: 'sr-row' }, svg);
      add('targets', g);
      rowGroups.push(g);
      // template name (the route target node)
      el('text', { x: PAD, y: y + rowH / 2 + 5, class: 'sr-tmpl', 'text-anchor': 'start' }, g).textContent = tmpl;
      // bar track + the growable bar
      el('rect', { x: barX, y: y + 4, width: barMaxW, height: rowH - 8, rx: 6, class: 'sr-track' }, g);
      const bar = el('rect', { x: barX, y: y + 4, width: 0, height: rowH - 8, rx: 6, class: 'sr-bar' }, g);
      bars.push(bar);
      const val = el('text', { x: barX + barMaxW + 8, y: y + rowH / 2 + 5, class: 'sr-barval is-hidden' }, g);
      barVals.push(val);
    });

    // ── the route flag (appears at step 2 on the winning row) ──
    layer('route', 2);
    const wy = rowY(argmax);
    const flag = add('route', el('text', { x: barX, y: wy - 6, class: 'sr-routeflag', 'text-anchor': 'start' }, svg));
    flag.textContent = `${labels.routeTo || 'route →'} ${route}`;

    // ── construct cards (step 3): NL → metadata-filter, NL → SQL ──
    const cardsTop = rowY(N - 1) + rowH + 28;
    layer('construct', 3);
    add('construct', el('text', { x: PAD, y: cardsTop, class: 'sr-conhead' }, svg))
      .textContent = labels.constructHead || 'construct: turn NL into a structured retrieval';

    const cardW = W - 2 * PAD, cardH = 58, cardGap = 12;
    function card(idx, title, nlText, codeText) {
      const cy = cardsTop + 12 + idx * (cardH + cardGap);
      add('construct', el('rect', { x: PAD, y: cy, width: cardW, height: cardH, rx: 9, class: 'sr-card' }, svg));
      add('construct', el('text', { x: PAD + 12, y: cy + 18, class: 'sr-cardttl' }, svg)).textContent = title;
      add('construct', el('text', { x: PAD + 12, y: cy + 35, class: 'sr-cardnl' }, svg)).textContent = '“' + nlText + '”';
      add('construct', el('text', { x: PAD + 12, y: cy + 51, class: 'sr-cardcode' }, svg)).textContent = codeText;
      return cy + cardH;
    }
    const mf = construct.metadataFilter || {};
    const ts = construct.textToSql || {};
    let deepest = cardsTop + 12;
    if (mf.nl) deepest = card(0, labels.selfQuery || 'self-query · NL → metadata filter',
      mf.nl, JSON.stringify(mf.filter || {}));
    if (ts.nl) deepest = card(1, labels.textToSql || 'text-to-SQL · NL → SQL',
      ts.nl, (ts.sql || '').length > 56 ? (ts.sql || '').slice(0, 53) + '…' : (ts.sql || ''));

    const H = frameHeightFor(Math.max(rowY(N - 1) + rowH, deepest) + 16, 14);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      // bars grow from step 1; argmax row lights up from step 2.
      bars.forEach((bar, i) => {
        const grown = k >= 1;
        const w = grown ? Math.max(2, Math.min(1, sims[i] / SIMMAX) * barMaxW) : 0;
        bar.setAttribute('width', w);
        // 'is-lit' is a HILITE class → the argmax reveal at step 2 registers as a real change.
        bar.classList.toggle('is-win', k >= 2 && i === argmax);
        bar.classList.toggle('is-faint', k >= 2 && i !== argmax);
        barVals[i].classList.toggle('is-hidden', !grown);
        barVals[i].textContent = fmt4(sims[i]);
        barVals[i].classList.toggle('is-win', k >= 2 && i === argmax);
        rowGroups[i].classList.toggle('is-win', k >= 2 && i === argmax);
      });
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
