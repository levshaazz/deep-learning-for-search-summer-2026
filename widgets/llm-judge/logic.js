/* llm-judge/logic.js — L11 'LLM-as-a-judge' beat: pointwise rubric scoring, pairwise comparison,
   the Goodhart "score-becomes-a-target" flip, and the REAL measured judge biases — revealed one
   idea per step.

   DRIVER-AGNOSTIC: setStep(k)/maxStep; binds NO keyboard/scroll (deck arrows + Book Scrollama both
   call setStep). Every number comes from data/l11-judge.json (facts-gated, gen_l11.py); all human
   text from i18n `labels` (en+ru+tt). Built on _widget-base.js + _plot-util.js. GREEN marks ONLY the
   winner / the honest-good answer; RED marks the gamed / losing answer; WARM flags the verbosity bias.

   Steps (maxStep = 4; the deck may pass k up to maxStep so we clamp and hold the final state):
     0 → the rubric (3 criteria) + the two answers' per-criterion score chips.
     1 → pointwise means: A 4.0, B 2.6667 (two 1..5 bars).
     2 → pairwise verdict: A wins (A highlighted green).
     3 → Goodhart: honest mean (A 4.3333 > C 4.0 → A wins) then a length-biased judge
         (A 4.0 < C 4.25 → C wins) — the winner FLIPS to the verbose answer C.
     4 → the REAL measured bars (0..1): accuracyClear 1.0, positionFollowRateTie 0.6667,
         verbosityPreferenceRate 1.0 — the verbosity bar warm/red to flag the bias. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountLlmJudge = defineWidget({
  id: 'llm-judge',
  rootClass: 'lj-root',
  exportName: 'mountLlmJudge',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const d = data || {};
    const rubric = (d.rubric && d.rubric.criteria) || [];
    const sMin = (d.rubric && d.rubric.scaleMin) || 1;
    const sMax = (d.rubric && d.rubric.scaleMax) || 5;
    const answers = d.answers || [];
    const A = answers[0] || { id: 'A', scores: [], mean: 0 };
    const B = answers[1] || { id: 'B', scores: [], mean: 0 };
    const pairWinner = d.pairwiseWinner || 'A';
    const gh = d.goodhart || {};
    const ghHonest = gh.honest || {};
    const ghLen = gh.lengthBiased || {};
    const real = d.real || {};

    // criterion labels (relevance / grounding / completeness) — text from i18n, keys derived
    const critLabel = (name) => labels['crit_' + name] || name;

    const W = 540, PAD = 16, RIGHT = W - PAD;

    // ── vertical layout: four stacked panels, each its OWN step group ──
    // Panel 1 (step 0): rubric table — header row + 2 answer rows of score chips.
    const p1Top = 22;
    const tblHeadY = p1Top + 18;            // "rubric" caption + criterion column heads
    const critColW = 96;                    // width per criterion column
    const tblX0 = PAD + 92;                 // x where the criterion columns begin (after the row label)
    const rowH = 30;
    const row1Y = tblHeadY + 26;            // answer A chip row
    const row2Y = row1Y + rowH;             // answer B chip row
    const p1Bot = row2Y + 20;

    // Panel 2 (step 1): two pointwise mean bars (1..5).
    const p2Top = p1Bot + 16;
    const p2HeadY = p2Top + 4;
    const barX = PAD + 120, barW = 250;     // value labels live to the RIGHT of barX+barW
    const meanRow = 32;
    const meanA_Y = p2HeadY + 22;
    const meanB_Y = meanA_Y + meanRow;
    const p2Bot = meanB_Y + 16;

    // Panel 3 (steps 2..3): pairwise verdict + the Goodhart flip.
    const p3Top = p2Bot + 16;
    const p3HeadY = p3Top + 4;
    // pairwise verdict line (step 2)
    const verdictY = p3HeadY + 22;
    // goodhart two judge columns (step 3): honest | length-biased, each a small 2-bar pair
    const ghTop = verdictY + 22;
    const ghColW = (W - 2 * PAD - 24) / 2;   // two columns with a gap
    const ghColX = [PAD, PAD + ghColW + 24];
    const ghHeadY = ghTop + 14;
    const ghBarTop = ghHeadY + 30;           // first bar baseline; its label sits ~14px above it (clears the column head)
    // answer label sits ABOVE its bar (own line); the bar spans the column minus a value gutter,
    // and the value reads to the RIGHT of the bar — so neither the long bilingual answer label
    // nor the value ever overprints the track/fill (audit L11 #3/#4).
    const ghValGutter = 52;                  // room at the right for the toFixed(4) value
    const ghBarW = ghColW - ghValGutter;
    const ghBarX = (col) => ghColX[col];
    const ghLblDY = -14;                      // answer label baseline, above the bar
    const ghRowH = 38;                        // label line + bar line per row
    const ghBot = ghBarTop + 2 * ghRowH + 22; // room for the winner-flip note below the bars
    const p3Bot = ghBot + 4;

    // Panel 4 (step 4): three REAL measured 0..1 bars on separate baselines.
    const p4Top = p3Bot + 16;
    const p4HeadY = p4Top + 4;
    const realBarX = PAD + 216, realBarW = 200;
    const realRow = 30;
    const real0Y = p4HeadY + 24;
    const real1Y = real0Y + realRow;
    const real2Y = real1Y + realRow;
    const p4Bot = real2Y + 16;

    const H = frameHeightFor(p4Bot, 12);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg lj-svg', role: 'img',
      'aria-label': labels.alt || '' }, host);

    const clampScore = (v) => Math.max(0, Math.min(1, (Number(v) - sMin) / (sMax - sMin || 1)));

    // ───────────────────────── Panel 1 · rubric + score chips (step 0) ─────────────────────────
    const g1 = el('g', { class: 'lj-panel lj-rubric' }, svg);
    el('text', { x: PAD, y: p1Top, class: 'lj-head' }, g1).textContent = labels.rubricHead || 'rubric';
    // criterion column heads
    rubric.forEach((name, j) => {
      const cx = tblX0 + j * critColW + critColW / 2;
      el('text', { x: cx, y: tblHeadY, class: 'lj-crit', 'text-anchor': 'middle' }, g1)
        .textContent = critLabel(name);
    });
    // one row of chips per answer
    const chipRow = (ans, y, ansLbl) => {
      el('text', { x: PAD, y: y + 4, class: 'lj-rowlbl' }, g1)
        .textContent = (labels.answer || 'answer') + ' ' + (ans.id || '');
      (ans.scores || []).forEach((sc, j) => {
        const cx = tblX0 + j * critColW + critColW / 2;
        el('rect', { x: cx - 16, y: y - 12, width: 32, height: 24, rx: 5, class: 'lj-chip' }, g1);
        el('text', { x: cx, y: y + 5, class: 'lj-chipval', 'text-anchor': 'middle' }, g1)
          .textContent = String(sc);
      });
    };
    chipRow(A, row1Y, 'A');
    chipRow(B, row2Y, 'B');
    el('text', { x: RIGHT, y: tblHeadY, class: 'lj-scalenote', 'text-anchor': 'end' }, g1)
      .textContent = (labels.scaleNote || 'scale') + ' ' + sMin + '–' + sMax;

    // ───────────────────────── Panel 2 · pointwise means (step 1) ─────────────────────────
    const g2 = el('g', { class: 'lj-panel lj-pointwise is-hidden' }, svg);
    el('text', { x: PAD, y: p2HeadY, class: 'lj-head' }, g2).textContent =
      labels.pointwiseHead || 'pointwise mean';
    const meanBar = (ans, y, isWinner) => {
      el('text', { x: PAD, y: y + 4, class: 'lj-rowlbl' }, g2)
        .textContent = (labels.answer || 'answer') + ' ' + (ans.id || '');
      el('rect', { x: barX, y: y - 9, width: barW, height: 16, rx: 4, class: 'lj-track' }, g2);
      const w = Math.round(barW * clampScore(ans.mean));
      el('rect', { x: barX, y: y - 9, width: w, height: 16, rx: 4,
        class: 'lj-fill' + (isWinner ? ' is-win' : '') }, g2);
      el('text', { x: barX + barW + 10, y: y + 4, class: 'lj-val', 'text-anchor': 'start' }, g2)
        .textContent = (Number(ans.mean) || 0).toFixed(4);
    };
    const aWins = pairWinner === (A.id || 'A');
    meanBar(A, meanA_Y, aWins);
    meanBar(B, meanB_Y, !aWins);

    // ───────────────────────── Panel 3 · pairwise verdict + Goodhart flip (steps 2,3) ─────────────────────────
    const g3v = el('g', { class: 'lj-panel lj-verdict is-hidden' }, svg);
    el('text', { x: PAD, y: p3HeadY, class: 'lj-head' }, g3v).textContent =
      labels.pairwiseHead || 'pairwise verdict';
    el('text', { x: PAD, y: verdictY, class: 'lj-verdicttxt' }, g3v).textContent =
      (labels.winsPrefix || 'winner:') + ' ' + (labels.answer || 'answer') + ' ' + pairWinner;
    // a small green tick badge marks the pairwise winner
    el('text', { x: PAD + 200, y: verdictY, class: 'lj-tick' }, g3v).textContent = '✓';

    const g3g = el('g', { class: 'lj-panel lj-goodhart is-hidden' }, svg);
    // two judge columns: honest (col 0) and length-biased (col 1)
    const ghCol = (col, judge, headLbl, isFlip) => {
      const x = ghColX[col];
      el('text', { x: x, y: ghHeadY, class: 'lj-ghhead' }, g3g).textContent = headLbl;
      // two bars: good answer vs gamed/verbose answer
      const rows = [
        { lbl: (labels.goodAns || 'honest'), val: judge.good,
          win: (judge.winner === 'A'), cls: 'is-good' },
        { lbl: (labels.gamedAns || 'verbose'), val: judge.gamed,
          win: (judge.winner === 'C'), cls: 'is-gamed' },
      ];
      rows.forEach((r, i) => {
        const y = ghBarTop + i * ghRowH;     // bar baseline for this row
        // answer label on its OWN line above the bar (no left gutter to overrun)
        el('text', { x: x, y: y + ghLblDY, class: 'lj-ghlbl' }, g3g).textContent = r.lbl;
        el('rect', { x: ghBarX(col), y: y - 8, width: ghBarW, height: 14, rx: 3,
          class: 'lj-track' }, g3g);
        const w = Math.round(ghBarW * clampScore(r.val));
        el('rect', { x: ghBarX(col), y: y - 8, width: w, height: 14, rx: 3,
          class: 'lj-fill ' + r.cls + (r.win ? ' is-win' : '') }, g3g);
        // value to the RIGHT of the bar (mid-baseline) — never in the inter-row band
        el('text', { x: ghBarX(col) + ghBarW + 6, y: y + 4, class: 'lj-ghval', 'text-anchor': 'start' }, g3g)
          .textContent = (Number(r.val) || 0).toFixed(4);
      });
      // winner line under the column
      const wy = ghBarTop + 2 * ghRowH + 12;
      el('text', { x: x, y: wy, class: 'lj-ghwin' + (isFlip ? ' is-flip' : '') }, g3g)
        .textContent = (labels.winsPrefix || 'winner:') + ' ' + (judge.winner || '');
    };
    ghCol(0, ghHonest, labels.honestJudge || 'honest judge', false);
    ghCol(1, ghLen, labels.lengthJudge || 'length-biased judge', true);

    // ───────────────────────── Panel 4 · REAL measured bars (step 4) ─────────────────────────
    const g4 = el('g', { class: 'lj-panel lj-real is-hidden' }, svg);
    el('text', { x: PAD, y: p4HeadY, class: 'lj-head' }, g4).textContent =
      labels.realHead || 'measured judge behaviour';
    const realBars = [
      { lbl: labels.rAccuracy || 'accuracy (clear)', val: real.accuracyClear, warn: false },
      { lbl: labels.rPosition || 'follows slot (tie)', val: real.positionFollowRateTie, warn: false },
      { lbl: labels.rVerbosity || 'prefers longer', val: real.verbosityPreferenceRate, warn: true },
    ];
    [real0Y, real1Y, real2Y].forEach((y, i) => {
      const r = realBars[i];
      el('text', { x: PAD, y: y + 4, class: 'lj-rowlbl' }, g4).textContent = r.lbl;
      el('rect', { x: realBarX, y: y - 8, width: realBarW, height: 14, rx: 3, class: 'lj-track' }, g4);
      const v = Math.max(0, Math.min(1, Number(r.val) || 0));
      el('rect', { x: realBarX, y: y - 8, width: Math.round(realBarW * v), height: 14, rx: 3,
        class: 'lj-fill' + (r.warn ? ' is-warn' : '') }, g4);
      el('text', { x: realBarX + realBarW + 10, y: y + 4, class: 'lj-val', 'text-anchor': 'start' }, g4)
        .textContent = (Number(r.val) || 0).toFixed(4);
    });

    // ───────────────────────── per-step reveal ─────────────────────────
    // Panels appear cumulatively; clamp k into [0..maxStep] (the deck may push to maxStep).
    return function update(k) {
      const s = Math.max(0, Math.min(k, 5));
      g2.classList.toggle('is-hidden', s < 1);   // pointwise means
      g3v.classList.toggle('is-hidden', s < 2);  // pairwise verdict
      g3g.classList.toggle('is-hidden', s < 3);  // Goodhart flip
      g4.classList.toggle('is-hidden', s < 4);   // real measured bars
    };
  },
});
