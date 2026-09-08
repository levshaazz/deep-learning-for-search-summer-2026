/* ragas-metrics/logic.js — L11 'climb-ragas' beat: the four RAGAS metrics on ONE fixed example, each
   revealed and worked in turn. A scorecard of four horizontal gauges (0..1):

     faithfulness     = supported answer-claims / answer-claims         (3/4 = 0.75)
     answerRelevance  = mean cosine(original-q, reverse-questions)       (mean[0.92,0.88,0.31] = 0.7033)
     contextPrecision = Σ_{rank k relevant} precision@k / #relevant      ((1 + 2/3)/2 = 0.8333)
     contextRecall    = ground-truth claims attributable to context / #gt (2/3 = 0.6667)

   DRIVER-AGNOSTIC: setStep(k)/maxStep; binds NO keyboard/scroll (deck arrows + Book Scrollama both call
   setStep). Every number comes from data/l11-ragas.json (facts-gated, gen_l11.py); all human text from
   i18n `labels` (en+ru+tt). Built on _widget-base.js + _plot-util.js. GREEN marks ONLY a supported claim
   / a high gauge; RED marks the one hallucinated claim.

   Steps (maxStep = 4): 0 → the question + the answer's 4 claims (3 supported, 1 hallucinated). Each next
   step reveals ONE gauge: 1 faithfulness · 2 answer-relevance · 3 context-precision · 4 context-recall. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountRagasMetrics = defineWidget({
  id: 'ragas-metrics',
  rootClass: 'rg-root',
  exportName: 'mountRagasMetrics',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const d = data || {};
    const claims = d.answerClaims || [];
    const metrics = [
      { key: 'faithfulness', val: d.faithfulness, frac: `${d.supportedClaims}/${d.answerClaimCount}`, lblKey: 'mFaith' },
      { key: 'answerRelevance', val: d.answerRelevance, frac: 'mean cos', lblKey: 'mRel' },
      { key: 'contextPrecision', val: d.contextPrecision, frac: 'Σ p@k·rel/#rel', lblKey: 'mPrec' },
      { key: 'contextRecall', val: d.contextRecall, frac: `${d.groundTruthInContext}/${d.groundTruthCount}`, lblKey: 'mRec' },
    ];

    const W = 540, PAD = 16;
    const claimsTop = 40, claimRow = 22, nClaims = claims.length;
    const gaugesTop = claimsTop + nClaims * claimRow + 26;
    const gaugeRow = 46, barX = 196, barW = 250;
    const H = frameHeightFor(gaugesTop + metrics.length * gaugeRow + 8, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg rg-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── the question + the answer's claims (each: supported green ✓ / hallucinated red ✗) ──
    el('text', { x: PAD, y: 22, class: 'rg-qhead' }, svg).textContent = labels.answerHead || 'generated answer · claim-by-claim';
    const claimEls = claims.map((c, i) => {
      const g = el('g', { class: 'rg-claim' + (c.supported ? ' is-ok' : ' is-bad') }, svg);
      const y = claimsTop + i * claimRow;
      el('text', { x: PAD, y: y + 12, class: 'rg-mark' }, g).textContent = c.supported ? '✓' : '✗';
      const t = (c.text || '');
      el('text', { x: PAD + 18, y: y + 12, class: 'rg-claimtxt' }, g).textContent = t.length > 64 ? t.slice(0, 61) + '…' : t;
      return g;
    });

    // ── four metric gauges (revealed one per step) ──
    const gaugeEls = metrics.map((m, i) => {
      const g = el('g', { class: 'rg-gauge is-hidden' }, svg);
      const y = gaugesTop + i * gaugeRow;
      el('text', { x: PAD, y: y + 4, class: 'rg-mname' }, g).textContent = labels[m.lblKey] || m.key;
      el('text', { x: PAD, y: y + 19, class: 'rg-mfrac' }, g).textContent = m.frac;
      el('rect', { x: barX, y: y - 9, width: barW, height: 16, rx: 4, class: 'rg-track' }, g);
      const v = Math.max(0, Math.min(1, Number(m.val) || 0));
      const cls = v >= 0.8 ? ' is-hi' : (v >= 0.6 ? ' is-mid' : ' is-lo');
      el('rect', { x: barX, y: y - 9, width: Math.round(barW * v), height: 16, rx: 4, class: 'rg-fill' + cls }, g);
      el('text', { x: barX + barW + 10, y: y + 4, class: 'rg-mval', 'text-anchor': 'start' }, g)
        .textContent = (Number(m.val) || 0).toFixed(4);
      return g;
    });

    return function update(k) {
      const upto = Math.max(0, Math.min(k, metrics.length));   // step 1..4 reveals gauge 0..3
      // dim the hallucinated claim only once faithfulness (step 1) is shown
      claimEls.forEach((g) => g.classList.toggle('is-lit', upto >= 1));
      gaugeEls.forEach((g, i) => g.classList.toggle('is-hidden', i >= upto));
    };
  },
});
