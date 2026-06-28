/* bm25-calc/logic.js — L3 BM25 (and TF-IDF) score explainer.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll. Reads data/l3-bm25.json —
   the SAME source the facts-gate checks, so idf, tf, len, avgdl and the final ranking can't drift.
   A horizontal bar chart of per-doc score plus a step-wise annotation panel that builds up the
   BM25 intuition: idf → tf saturation → length-norm → final ranking.
   Reusable for the TF-IDF beat via labels.mode === 'tfidf' (uses tfidfScore + tfidfRanking + t0..t4).

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced
   SVG builder and the window.mountBm25Calc registration; render() only draws the chart + panel. */
import { defineWidget } from '../_widget-base.js';

// local 2-decimal formatter (distinct from the factory fmt's toFixed(6)) — keep inside this module.
const fmt = (x) => (Math.round(x * 100) / 100).toString();

export const mountBm25Calc = defineWidget({
  id: 'bm25-calc',
  rootClass: 'bm-root',
  exportName: 'mountBm25Calc',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const MAX = 4, W = 480, H = 440;
    const tfidf = labels.mode === 'tfidf';
    const scoreOf = (d) => (tfidf ? d.tfidfScore : d.bm25Score);
    const ranking = tfidf ? data.tfidfRanking : data.bm25Ranking;

    // Captions: BM25 mode uses s0..s4; TF-IDF mode uses t0..t4. The factory's scaffold always reads
    // labels['s'+k], so alias the t-keys onto the s-keys in TF-IDF mode (the figure stays identical).
    if (tfidf) for (let k = 0; k <= MAX; k++) labels['s' + k] = labels['t' + k];

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg bm-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── plot frame (horizontal bars: one row per doc) ─────────────────────────
    const docs = data.docs;
    const box = { x: 48, y: 24, w: W - 64, h: 210 };
    const rowH = box.h / docs.length;
    const bw = rowH - 8;

    // ── partial scores: the bars GROW as each BM25 factor is layered on, instead of staying flat
    // until one terminal jump. Every value below is recomputed from data fields (idf, tf, k1, b,
    // len, avgdl) — nothing invented; the step-3 partial equals the published final score, so the
    // step-4 re-sort moves no bar's width. (REFERENCE_IMPL: matches captions s1 idf · s2 saturation
    // · s3 length-norm · s4 ranking.)
    const k1 = data.k1 != null ? data.k1 : 1.5;
    // step 1 — idf "presence": sum the idf of every query term that occurs in the doc (tf > 0).
    const idfPresence = (d) => d.terms.reduce((s, t) => s + (t.tf > 0 ? t.idf : 0), 0);
    // step 2 — + tf saturation, length-norm switched OFF (b = 0 ⇒ denom = tf + k1):
    //   Σ idf · tf·(k1+1) / (tf + k1). For tf-idf mode this degenerates to Σ idf·tf = tfidfScore.
    const satScore = (d) => {
      if (tfidf) return scoreOf(d); // plain tf-idf: no saturation, partial = full tf-idf score
      return d.terms.reduce((s, t) => {
        if (t.tf <= 0) return s;
        return s + t.idf * (t.tf * (k1 + 1)) / (t.tf + k1);
      }, 0);
    };
    // step 3 — + length normalisation: the published final score (bm25Score / tfidfScore).
    const fullScore = (d) => scoreOf(d);
    // score for a given step: 0/1 → idf-presence base, 2 → saturation, ≥3 → full.
    const partialScore = (d, step) => {
      if (step <= 1) return idfPresence(d);
      if (step === 2) return satScore(d);
      return fullScore(d);
    };

    // y-scale spans the LARGEST value any bar reaches across all steps, so growth never clips frame.
    let scaleMax = 0;
    docs.forEach((d) => {
      scaleMax = Math.max(scaleMax, idfPresence(d), satScore(d), fullScore(d));
    });
    const maxScore = (scaleMax * 1.12) || 1;

    el('line', { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.h, class: 'bm-axis' }, svg);
    el('text', { x: box.x, y: box.y + box.h + 18, class: 'bm-axlbl' }, svg)
      .textContent = labels.xaxis || (tfidf ? 'TF-IDF score →' : 'BM25 score →');

    // baseline neutral score (steps 0–3) = a flat placeholder so bars read as "candidates, unscored".
    const flat = maxScore * 0.28;
    const sx = (v) => (v / maxScore) * box.w;

    // bar rows, keyed by doc id, laid out initially in document order
    const rows = docs.map((d, i) => {
      const y0 = box.y + i * rowH + 4;
      const g = el('g', { class: 'bm-row', 'data-id': d.id }, svg);
      const rect = el('rect', { x: box.x, y: y0, width: sx(flat), height: bw, class: 'bm-bar' }, g);
      el('text', { x: box.x - 6, y: y0 + bw / 2 + 4, class: 'bm-id', 'text-anchor': 'end' }, g)
        .textContent = d.id;
      const val = el('text', { x: box.x + sx(flat) + 6, y: y0 + bw / 2 + 4, class: 'bm-val' }, g);
      val.textContent = '';
      return { d, g, rect, val, y0 };
    });

    // ── annotation panel (below the chart) — each layer = headline + sub-line, stacked ───────────
    const panel = { x: box.x, y: box.y + box.h + 30, w: box.w };
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };
    layer('idf', 1); layer('sat', 2); layer('len', 3);
    const head = (name, y, cls, text) => {
      add(name, el('text', { x: panel.x, y, class: 'bm-annot ' + cls }, svg)).textContent = text;
    };
    const sub = (name, y, text) => {
      add(name, el('text', { x: panel.x, y, class: 'bm-annot bm-sub' }, svg)).textContent = text;
    };

    // idf (step 1) — both query terms on one line, hint beneath
    const terms = docs[0].terms;
    head('idf', panel.y, 'bm-idf', terms.map((t) => `idf(${t.t}) = ${fmt(t.idf)}`).join('    '));
    sub('idf', panel.y + 16, labels.idfHint || 'rarer term ⇒ higher idf');

    // tf saturation (step 2) — representative doc = top-ranked (its top query term has tf ≥ 2)
    const repDoc = docs.find((d) => d.id === ranking[0]) || docs[0];
    const repTerm = repDoc.terms.reduce((a, b) => (b.tf > a.tf ? b : a), repDoc.terms[0]);
    head('sat', panel.y + 40, 'bm-sat', `${repDoc.id}: tf(${repTerm.t}) = ${repTerm.tf}`);
    sub('sat', panel.y + 56, labels.satHint || 'doubling tf adds less each time — saturation');

    // length-norm (step 3) — short doc vs long doc
    const shortDoc = docs.reduce((a, b) => (b.len < a.len ? b : a), docs[0]);
    const longDoc = docs.reduce((a, b) => (b.len > a.len ? b : a), docs[0]);
    head('len', panel.y + 80, 'bm-len',
      `|${shortDoc.id}|/avgdl = ${fmt(shortDoc.len / data.avgdl)}   ·   |${longDoc.id}|/avgdl = ${fmt(longDoc.len / data.avgdl)}`);
    sub('len', panel.y + 96, labels.lenHint || 'short doc ⇒ boost, long doc ⇒ damp');

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      const final = k >= MAX;
      const scored = k >= 1; // step 0 = flat "unscored candidates"; steps 1-4 show real partials.
      rows.forEach((r) => {
        // bars grow with each factor: step 1 idf-presence → 2 +saturation → 3 +length-norm → 4 sort.
        // Re-layout into ranking order only at the final step; widths already reach the full score at
        // step 3, so the sort moves no bar's width — only its row position + winner highlight.
        const rank = final ? ranking.indexOf(r.d.id) : docs.indexOf(r.d);
        const targetY = box.y + rank * rowH + 4;
        r.g.setAttribute('transform', `translate(0 ${targetY - r.y0})`);
        const v = scored ? partialScore(r.d, k) : flat;
        r.rect.setAttribute('width', sx(v));
        r.rect.classList.toggle('is-scored', scored);
        r.rect.classList.toggle('is-winner', final && r.d.id === ranking[0]);
        r.val.setAttribute('x', box.x + sx(v) + 6);
        r.val.textContent = scored ? fmt(v) : '';
        r.val.classList.toggle('is-winner', final && r.d.id === ranking[0]);
      });

      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
    };
  },
});
