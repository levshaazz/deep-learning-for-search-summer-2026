/* agentic-loop/logic.js — L11 'agentic RAG' beat: a ReAct loop (Thought → Action → Observation,
   repeated) over a 2-hop question. The toy trace walks the loop step by step; recall@1 climbs from
   0 to 1 as the SECOND hop lands the missing fact. The finish step surfaces a REAL frozen
   llama3.1:8b run badge, and the final step contrasts free-form ReAct with its structured cousins —
   Self-RAG's reflection tokens and CRAG's retrieval grades (callbacks to L10).

   DRIVER-AGNOSTIC: setStep(k)/maxStep; binds NO keyboard/scroll (deck arrows + Book Scrollama both
   call setStep). Every number comes from data/l11-agentic.json (facts-gated, gen_l11.py); all human
   text from i18n `labels` (en+ru+tt). Built on _widget-base.js + _plot-util.js. GREEN marks ONLY the
   solved / answer state (recall@1 = 1, the final answer chip, the real-run badge).

   Steps (maxStep = 4):
     0 → the question + an empty ReAct frame (Thought / Action / Observation lanes), recall@1 = 0.
     1 → trace step 0: Thought + Action lookup[…] + Observation (hop 1). recall@1 still 0.
     2 → trace step 1: second lookup + Observation lands the missing fact. recall@1 → 1 (green).
     3 → finish[answer]: the final answer chip (solved), plus the REAL llama3.1:8b run badge.
     4 → Self-RAG reflection tokens + CRAG grades as compact chips (the structured cousins). */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountAgenticLoop = defineWidget({
  id: 'agentic-loop',
  rootClass: 'al-root',
  exportName: 'mountAgenticLoop',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const d = data || {};
    const react = d.react || {};
    const steps = Array.isArray(react.steps) ? react.steps : [];
    const recallByStep = Array.isArray(react.recallByStep) ? react.recallByStep : [];
    const real = d.real || {};
    const selfRag = d.selfRag || {};
    const crag = d.crag || {};

    const W = 540, PAD = 16;
    const trunc = (s, n) => { const t = String(s == null ? '' : s); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

    // ── geometry ────────────────────────────────────────────────────────────
    const qTop = 22;                         // question head baseline
    const recTop = 46;                       // recall@1 readout row (top-right gauge)
    const laneTop = 86;                       // first lane (Thought) top
    const laneH = 30, laneGap = 8;            // per-lane box height + gap
    const laneStride = laneH + laneGap;       // 38
    const nLanes = 3;                         // Thought / Action / Observation
    const lanesBottom = laneTop + nLanes * laneStride - laneGap;
    const labelW = 86;                        // left lane-label gutter
    const boxX = PAD + labelW, boxW = W - PAD - boxX;

    const finishTop = lanesBottom + 22;       // finish[answer] chip row
    const badgeTop = finishTop + 30;          // real-run badge row
    const chipsTop = badgeTop + 44;           // self-rag + crag chip block
    const chipRowH = 22;
    const chipsBottom = chipsTop + 18 + chipRowH + 14 + chipRowH; // header+row, header+row
    const H = frameHeightFor(chipsBottom + 4, 12);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg al-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── the 2-hop question ────────────────────────────────────────────────────
    el('text', { x: PAD, y: qTop - 12, class: 'al-qhead' }, svg).textContent = labels.qHead || '';
    el('text', { x: PAD, y: qTop + 4, class: 'al-qtext' }, svg).textContent = trunc(react.question, 60);

    // ── recall@1 readout (climbs 0 → 1) ───────────────────────────────────────
    const recG = el('g', { class: 'al-recall' }, svg);
    el('text', { x: W - PAD, y: recTop - 4, class: 'al-reclbl', 'text-anchor': 'end' }, recG).textContent = labels.recallLabel || '';
    const recValEl = el('text', { x: W - PAD, y: recTop + 16, class: 'al-recval', 'text-anchor': 'end' }, recG);

    // ── the empty ReAct frame: three labelled lanes ───────────────────────────
    const laneDefs = [
      { key: 'thought', lblKey: 'laneThought' },
      { key: 'action', lblKey: 'laneAction' },
      { key: 'observation', lblKey: 'laneObservation' },
    ];
    const laneEls = laneDefs.map((ln, i) => {
      const y = laneTop + i * laneStride;
      const g = el('g', { class: 'al-lane al-lane-' + ln.key }, svg);
      el('text', { x: PAD, y: y + laneH / 2 + 4, class: 'al-lanelbl' }, g).textContent = labels[ln.lblKey] || ln.key;
      el('rect', { x: boxX, y, width: boxW, height: laneH, rx: 5, class: 'al-lanebox' }, g);
      const txt = el('text', { x: boxX + 9, y: y + laneH / 2 + 4, class: 'al-lanetxt is-hidden' }, g);
      return { box: g, txt };
    });

    // connectors down the loop (Thought → Action → Observation), drawn behind the boxes
    for (let i = 0; i < nLanes - 1; i++) {
      const y1 = laneTop + i * laneStride + laneH;
      el('line', { x1: boxX + 18, y1, x2: boxX + 18, y2: y1 + laneGap, class: 'al-conn' }, svg);
    }

    // ── finish[answer] chip (solved) ─────────────────────────────────────────
    const finishG = el('g', { class: 'al-finish is-hidden' }, svg);
    el('text', { x: PAD, y: finishTop + 4, class: 'al-finishlbl' }, finishG).textContent = labels.finishLabel || '';
    const ansChip = el('g', { class: 'al-anschip' }, finishG);
    const ansX = PAD + labelW;
    el('rect', { x: ansX, y: finishTop - 13, width: W - PAD - ansX, height: 24, rx: 6, class: 'al-ansbox' }, ansChip);
    el('text', { x: ansX + 10, y: finishTop + 4, class: 'al-anstxt' }, ansChip).textContent = trunc(real.finalAnswer, 52);

    // ── REAL run badge: "<model> solved in <steps> steps" ─────────────────────
    const badgeG = el('g', { class: 'al-badge is-hidden' }, svg);
    el('rect', { x: PAD, y: badgeTop - 13, width: W - 2 * PAD, height: 24, rx: 6, class: 'al-badgebox' }, badgeG);
    el('text', { x: PAD + 11, y: badgeTop + 4, class: 'al-badgemark' }, badgeG).textContent = '✓';
    const badgeTxt = el('text', { x: PAD + 28, y: badgeTop + 4, class: 'al-badgetxt' }, badgeG);
    // text comes from labels; the model name + step count are interpolated from DATA (never hardcoded).
    const badgeTpl = labels.realBadge || '{model} solved in {steps} steps';
    badgeTxt.textContent = badgeTpl
      .replace('{model}', String(real._model || ''))
      .replace('{steps}', String(real.steps == null ? '' : real.steps));

    // ── Self-RAG reflection tokens + CRAG grades (structured cousins) ─────────
    const chipsG = el('g', { class: 'al-chips is-hidden' }, svg);
    const reflect = Array.isArray(selfRag.reflectionTokens) ? selfRag.reflectionTokens : [];
    const grades = Array.isArray(crag.grades) ? crag.grades : [];

    // row helper: a header + a row of small chips, laid left-to-right with wrap-free fixed widths.
    function chipRow(parent, headerKey, items, y, chipClassFor) {
      el('text', { x: PAD, y, class: 'al-chiphdr' }, parent).textContent = labels[headerKey] || '';
      let x = PAD;
      const rowY = y + 9;
      items.forEach((it) => {
        const cw = Math.max(40, 11 + String(it).length * 7.2);
        const g = el('g', { class: 'al-chip ' + (chipClassFor ? chipClassFor(it) : '') }, parent);
        el('rect', { x, y: rowY, width: cw, height: chipRowH - 4, rx: 5, class: 'al-chipbox' }, g);
        el('text', { x: x + cw / 2, y: rowY + (chipRowH - 4) / 2 + 4, class: 'al-chiptxt', 'text-anchor': 'middle' }, g)
          .textContent = String(it);
        x += cw + 7;
      });
    }
    chipRow(chipsG, 'selfRagHdr', reflect, chipsTop + 12, null);
    // CRAG grades carry a semantic class: correct/ambiguous/wrong (green only on 'correct').
    const gradeCls = (g) => 'al-grade-' + String(g);
    chipRow(chipsG, 'cragHdr', grades, chipsTop + 12 + chipRowH + 16, gradeCls);

    // ── per-step update ───────────────────────────────────────────────────────
    return function update(k) {
      // map maxStep 0..4 → number of trace rows revealed: step 1 shows trace[0], step 2 shows trace[1].
      const traceShown = Math.max(0, Math.min(k, steps.length)); // 0,1,2 for k=0,1,2; 2 for k>=2

      // The lanes mirror the MOST RECENTLY revealed trace step (the loop "iterates" in place).
      const cur = traceShown > 0 ? steps[traceShown - 1] : null;
      const laneVals = {
        thought: cur ? cur.thought : '',
        action: cur ? cur.action : '',
        observation: cur ? cur.observation : '',
      };
      laneEls.forEach((le, i) => {
        const v = laneVals[laneDefs[i].key];
        const show = k >= 1 && v != null && v !== '';
        le.txt.classList.toggle('is-hidden', !show);
        le.box.classList.toggle('is-active', show);
        if (show) le.txt.textContent = trunc(v, 56);
      });

      // recall@1 climbs with the trace: recallByStep[traceShown-1] (0,0,1). At step 0 it reads 0.
      const recVal = traceShown > 0 ? Number(recallByStep[traceShown - 1] || 0) : 0;
      recValEl.textContent = String(recVal);
      recG.classList.toggle('is-solved', recVal >= 1);

      // step 3: finish chip + real-run badge (solved / green).
      const solved = k >= 3;
      finishG.classList.toggle('is-hidden', !solved);
      badgeG.classList.toggle('is-hidden', !solved);

      // step 4: the structured cousins.
      chipsG.classList.toggle('is-hidden', k < 4);
    };
  },
});
