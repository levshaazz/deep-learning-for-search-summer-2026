/* metric-compare/logic.js — L9 'metrics' beat: the SAME vector pair scored under L2, cosine, and
   inner-product, then a ranking where the three metrics pick DIFFERENT top-1 candidates. The teaching
   point: the metric choice changes the answer.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll — the SLIDE driver (deck arrows) and
   the BOOK driver (Scrollama) both call setStep(k). Every number (l2/cosine/dot/norms, the disagree
   winners, the ranking top-1) comes from data/l9-metrics.json (facts-gated); all human text from
   i18n `labels` (en + ru + tt). Built on the shared widgets/_widget-base.js factory.

   Steps (maxStep = 4) — reveal ONE metric at a time on the same pair, then the disagreement:
     0  → the vector pair a, b (D=4) + their two norms; no metric computed yet.                s0
     1  → L2 distance ‖a − b‖ on the pair.                                                      s1
     2  → cosine similarity (= the dot of the unit vectors; normalizedDot).                     s2
     3  → inner product a · b (raw dot, magnitude-sensitive).                                   s3
     4  → the ranking: 1 query, 3 candidates — L2 / cosine / inner-product each crown a
           DIFFERENT top-1 (d1 / d2 / d3). The disagreement is the lesson.                      s4 */
import { defineWidget, esc } from '../_widget-base.js';

export const mountMetricCompare = defineWidget({
  id: 'metric-compare',
  rootClass: 'mc-root',
  exportName: 'mountMetricCompare',
  maxStep: 4,
  render({ host, data, labels }) {
    const pair = data.pair || {};
    const rank = data.ranking || {};
    const cands = rank.candidates || {};
    const top1 = rank.top1 || {};
    const candIds = Object.keys(cands);            // ['d1','d2','d3'] in data order

    const vec = (arr) => '[' + (arr || []).join(', ') + ']';

    const panel = document.createElement('div');
    panel.className = 'wgt-panel mc-panel';
    host.appendChild(panel);

    // ── the vector pair + norms (always shown; step 0 baseline) ──
    const pairBox = document.createElement('div');
    pairBox.className = 'mc-pair';
    pairBox.innerHTML =
      `<div class="mc-pair-head">${esc(labels.pairHead || 'one vector pair')}</div>` +
      `<div class="mc-vrow"><span class="mc-vname mc-a">a</span><span class="mc-vval">${esc(vec(pair.a))}</span>` +
        `<span class="mc-norm">‖a‖ = ${esc(pair.aNorm)}</span></div>` +
      `<div class="mc-vrow"><span class="mc-vname mc-b">b</span><span class="mc-vval">${esc(vec(pair.b))}</span>` +
        `<span class="mc-norm">‖b‖ = ${esc(pair.bNorm)}</span></div>`;
    panel.appendChild(pairBox);

    // ── three metric rows on the SAME pair, revealed one per step ──
    const metrics = document.createElement('div');
    metrics.className = 'mc-metrics';
    panel.appendChild(metrics);

    function metricRow(cls, from, name, formula, value, note) {
      const r = document.createElement('div');
      r.className = `mc-metric ${cls} is-hidden`;
      r.dataset.from = String(from);
      r.innerHTML =
        `<span class="mc-mname">${esc(name)}</span>` +
        `<span class="mc-mform">${esc(formula)}</span>` +
        `<span class="mc-mval">${esc(value)}</span>` +
        (note ? `<span class="mc-mnote">${esc(note)}</span>` : '');
      metrics.appendChild(r);
      return r;
    }
    const rowL2 = metricRow('mc-l2', 1, labels.l2 || 'L2 distance', '‖a − b‖', pair.l2, labels.l2note || 'smaller = nearer');
    const rowCos = metricRow('mc-cos', 2, labels.cosine || 'cosine similarity',
      'a·b / (‖a‖‖b‖)', pair.cosine, `${labels.cosNote || 'unit-vector dot ='} ${pair.normalizedDot}`);
    const rowDot = metricRow('mc-dot', 3, labels.dot || 'inner product', 'a · b', pair.dot,
      labels.dotNote || 'grows with magnitude');
    const metricRows = [rowL2, rowCos, rowDot];

    // ── the ranking table (step 4): 1 query, 3 candidates, top-1 differs across metrics ──
    const rankBox = document.createElement('div');
    rankBox.className = 'mc-rank is-hidden';
    let html =
      `<div class="mc-rank-head">${esc(labels.rankHead || 'one query, three candidates — the metrics disagree')}</div>` +
      `<div class="mc-rank-q">${esc(labels.query || 'query')} q = ${esc(vec(rank.query))}</div>` +
      `<table class="mc-rank-table"><tr class="mc-rank-colhdr">` +
        `<th>${esc(labels.cand || 'candidate')}</th>` +
        `<th class="mc-col-l2">${esc(labels.l2short || 'L2')}</th>` +
        `<th class="mc-col-cos">${esc(labels.cosShort || 'cosine')}</th>` +
        `<th class="mc-col-dot">${esc(labels.dotShort || 'a·b')}</th></tr>`;
    candIds.forEach((id) => {
      const c = cands[id];
      html += `<tr class="mc-rank-row" data-id="${esc(id)}">` +
        `<td class="mc-cand"><b>${esc(id)}</b> ${esc(vec(c.vector))}</td>` +
        `<td class="mc-cell mc-cell-l2${top1.l2 === id ? ' is-top1' : ''}">${esc(c.l2)}</td>` +
        `<td class="mc-cell mc-cell-cos${top1.cosine === id ? ' is-top1' : ''}">${esc(c.cosine)}</td>` +
        `<td class="mc-cell mc-cell-dot${top1.innerProduct === id ? ' is-top1' : ''}">${esc(c.dot)}</td></tr>`;
    });
    html += `</table>` +
      `<div class="mc-verdict">` +
        `<span class="mc-v-l2">${esc(labels.l2short || 'L2')} → <b>${esc(top1.l2)}</b></span>` +
        `<span class="mc-v-cos">${esc(labels.cosShort || 'cosine')} → <b>${esc(top1.cosine)}</b></span>` +
        `<span class="mc-v-dot">${esc(labels.dotShort || 'a·b')} → <b>${esc(top1.innerProduct)}</b></span>` +
      `</div>` +
      `<div class="mc-lesson">${esc(labels.lesson || 'three metrics, three different winners — the metric choice changes the answer')}</div>`;
    rankBox.innerHTML = html;
    panel.appendChild(rankBox);

    return function update(k) {
      // metric rows reveal one per step on steps 1..3; the pair is dimmed once the ranking takes over.
      metricRows.forEach((r) => r.classList.toggle('is-hidden', k < Number(r.dataset.from)));
      // highlight only the metric that JUST appeared (so each step reads as a real reveal).
      metricRows.forEach((r) => r.classList.toggle('is-fresh', k === Number(r.dataset.from)));
      rankBox.classList.toggle('is-hidden', k < 4);
      pairBox.classList.toggle('is-faded', k >= 4);
      metrics.classList.toggle('is-faded', k >= 4);
    };
  },
});
