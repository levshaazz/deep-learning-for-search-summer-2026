/* query-rewrite/logic.js — L10 'climb-queryrewrite' beat: rewriting the query lifts the true doc's rank.
   A short, vocabulary-poor query finds the true doc at rank 8 (below the top-5 cut → recall@5 = 0, RR =
   0.125). HyDE writes a hypothetical answer, embeds THAT, and the true doc rises to rank 2 (recall@5 = 1,
   RR = 0.5). Multi-query is a SEPARATE 5-relevant gold-set: a single query finds 2/5 (recall@5 = 0.4),
   the union of 3 paraphrases finds 4/5 (recall@5 = 0.8) — two recall senses, never blended.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. Every rank/recall/RR comes from
   data/l10-rewrite.json (facts-gated, recomputed by provenance_l10); all human text from i18n `labels`.

   Steps (maxStep = 3):
     0  → the original ranked list; true doc at rank 8 (below the top-5 cut) → recall@5 = 0, RR = 0.125.   s0
     1  → HyDE: generate a hypothetical answer and embed IT (the card appears).                            s1
     2  → re-retrieve with the HyDE vector → true doc rises to rank 2 → recall@5 = 1, RR = 0.5.            s2
     3  → multi-query (separate 5-relevant gold-set): single 2/5 (0.4) → union 4/5 (0.8).                  s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountQueryRewrite = defineWidget({
  id: 'query-rewrite',
  rootClass: 'qr-root',
  exportName: 'mountQueryRewrite',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const original = data.original || {}, hyde = data.hyde || {}, mq = data.multiQuery || {};
    const trueDoc = data.trueDocId;
    const W = 480, padL = 18, listTop = 86, rowH = 20, rowGap = 3, CUT = 5;
    const N = (original.rankedList || []).length || 10;
    const colW = 250;                              // ranked-list column width
    const rowY = (i) => listTop + i * (rowH + rowGap);
    const cutY = rowY(CUT) - rowGap / 2;           // top-5 cutoff line

    const mqTop = rowY(N) + 26;
    const H = frameHeightFor(mqTop + 64, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg qr-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // readout (top) + HyDE card + cutoff
    const readHead = el('text', { x: padL, y: 26, class: 'qr-readhead' }, svg);
    const readSub = el('text', { x: padL, y: 48, class: 'qr-readsub' }, svg);
    el('text', { x: padL, y: 70, class: 'qr-collbl' }, svg).textContent = labels.ranked || 'retrieved, ranked';
    const cutLine = el('line', { x1: padL, y1: cutY, x2: padL + colW, y2: cutY, class: 'qr-cut' }, svg);
    el('text', { x: padL + colW + 6, y: cutY + 4, class: 'qr-cutlbl' }, svg).textContent = labels.cut || 'top-5 cut';

    // HyDE hypothetical-doc card (right side; shown from step 1)
    const cardX = padL + colW + 70, cardW = W - cardX - padL;
    const hydeCard = el('g', { class: 'qr-card is-hidden' }, svg);
    el('rect', { x: cardX, y: listTop, width: cardW, height: 92, rx: 8, class: 'qr-cardbox' }, hydeCard);
    el('text', { x: cardX + 10, y: listTop + 20, class: 'qr-cardttl' }, hydeCard).textContent = labels.hydeTitle || 'HyDE';
    const cardLines = [labels.hydeL1 || 'write a hypothetical', labels.hydeL2 || 'answer, then embed', labels.hydeL3 || 'THAT vector'];
    cardLines.forEach((t, i) => el('text', { x: cardX + 10, y: listTop + 42 + i * 16, class: 'qr-cardtxt' }, hydeCard).textContent = t);

    // multi-query strip (shown from step 3): 5 gold dots, single vs union
    const mqG = el('g', { class: 'qr-mq is-hidden' }, svg);
    el('text', { x: padL, y: mqTop, class: 'qr-mqhead' }, mqG).textContent = labels.mqHead || 'multi-query · a separate 5-relevant gold-set';
    function goldRow(y, foundN, label, recall) {
      const g = el('g', {}, mqG);
      el('text', { x: padL, y: y + 12, class: 'qr-mqlbl' }, g).textContent = label;
      const dotX0 = padL + 150;
      for (let i = 0; i < 5; i++) {
        el('circle', { cx: dotX0 + i * 22, cy: y + 8, r: 7, class: 'qr-gold ' + (i < foundN ? 'is-found' : 'is-miss') }, g);
      }
      el('text', { x: dotX0 + 5 * 22 + 8, y: y + 12, class: 'qr-mqrecall', }, g).textContent = `recall@5 = ${recall}`;
    }
    goldRow(mqTop + 12, (mq.foundSingle || []).length, labels.mqSingle || 'single query', mq.recallAt5Single);
    goldRow(mqTop + 38, (mq.foundUnion || []).length, labels.mqUnion || 'union of 3 paraphrases', mq.recallAt5Union);

    const listG = el('g', {}, svg);
    function drawList(variant) {
      while (listG.firstChild) listG.removeChild(listG.firstChild);
      const v = variant === 'hyde' ? hyde : original;
      (v.rankedList || []).forEach((id, i) => {
        const rank = i + 1, y = rowY(i), isTrue = id === trueDoc, inTop = rank <= CUT;
        const state = isTrue ? (inTop ? ' is-true is-in' : ' is-true is-out') : '';
        el('rect', { x: padL, y, width: colW, height: rowH, rx: 4, class: 'qr-rowbox' + state }, listG);
        el('text', { x: padL + 8, y: y + 14, class: 'qr-rank' + state }, listG).textContent = rank;
        el('text', { x: padL + 34, y: y + 14, class: 'qr-id' + state }, listG).textContent = isTrue ? '★ ' + id : id;
      });
    }

    return function update(k) {
      const variant = k >= 2 ? 'hyde' : 'original';
      drawList(variant);
      const v = variant === 'hyde' ? hyde : original;
      readHead.textContent = (variant === 'hyde' ? (labels.hydeLbl || 'HyDE query') : (labels.origLbl || 'original query'))
        + ` · "${data.query || ''}"`;
      readSub.textContent = `${labels.trueDoc || 'true doc'}: ${labels.rank || 'rank'} ${v.trueRank} · recall@5 = ${v.recallAt5} · RR = ${v.rr}`;
      hydeCard.classList.toggle('is-hidden', k < 1);
      mqG.classList.toggle('is-hidden', k < 3);
    };
  },
});
