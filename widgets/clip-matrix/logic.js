/* clip-matrix/logic.js — L12 'multimodal CLIP' beat: the shared-space image↔text cosine matrix where
   the matching pairs (the DIAGONAL) win — CLIP cross-modal retrieval, a callback to L6 contrastive
   learning / "Sir Cosine". One shared embedding space holds both image vectors and caption vectors; we
   cosine every image against every caption and read off the argmax per row.

   DRIVER-AGNOSTIC: setStep(k)/maxStep binds NO keyboard/scroll (deck arrows + Book Scrollama both call
   setStep). EVERY number — the matrix cells, the matched/mismatched means, the contrastive gap, the
   real llava accuracy, the concept names — comes from data/l12-clip.json (facts-gated, gen_l12.py); all
   human text comes from i18n `labels` (en+ru+tt). Built on _widget-base.js + _plot-util.js. GREEN
   outlines/marks ONLY the matching diagonal cells.

   Steps (maxStep = 5):
     0 → the 3 image concepts (rows) and 3 text concepts (columns) as a labelled EMPTY 3×3 grid — one
         shared space for both modalities.
     1 → fill the cells with their cosine values + heat shading (from data.cosineMatrix).
     2 → ONE worked row: scan the first image row, dim its losers, ring its argmax cell — the visible
         act of picking the brightest cell in a row IS cross-modal retrieval (search text with a picture).
     3 → generalise: every row's argmax lights the green diagonal (diagonalCorrect / #concepts).
     4 → the contrastive separation: matchedMeanCos (high) vs mismatchedMeanCos (low) as two bars + the
         gap — matching pairs are close, everything else far.
     5 → a REAL badge: llava:7b forced-choice image→caption on text-free shapes scored real.top1Correct /
         real.n = real.top1Accuracy. */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountClipMatrix = defineWidget({
  id: 'clip-matrix',
  rootClass: 'clm-root',
  exportName: 'mountClipMatrix',
  maxStep: 5,
  render({ host, data, labels, el }) {
    const d = data || {};
    const concepts = (d.concepts && d.concepts.length) ? d.concepts : ['cat', 'dog', 'car'];
    const M = (d.cosineMatrix && d.cosineMatrix.length) ? d.cosineMatrix : concepts.map(() => concepts.map(() => 0));
    const n = concepts.length;

    // ── geometry (viewBox 0 0 540 H; ≥10px margins; rows on the left, cols on top, nothing clipped) ──
    const W = 540, PAD = 16;
    const headY = 24;                                  // section head baseline
    const colLblY = 64;                                // column (text j) labels baseline
    const gridTop = 78;                                // matrix top edge
    const CELL = 96, GAP = 8, STEP = CELL + GAP;
    const rowLblW = 96;                                // left gutter for "image i" row labels
    const gridW = n * STEP - GAP;
    // CENTER the [row-label gutter + grid] block in the 540-wide frame so the figure is balanced
    // (was left-skewed: gridLeft=112 → 124px dead band on the right). blockW = rowLblW + gridW.
    const gridLeft = Math.round((W - (rowLblW + gridW)) / 2) + rowLblW; // ≈166, ≥10px margin each side
    const gridBottom = gridTop + n * STEP - GAP;

    // contrastive bars (step 3) sit below the matrix
    const barsTop = gridBottom + 40;
    const barRow = 30, barX = gridLeft, barW = gridW, barLabelX = PAD;
    const barsBottom = barsTop + 2 * barRow + 6;

    // real badge (step 4)
    const badgeY = barsBottom + 26;
    const H = frameHeightFor(badgeY + 30, 14);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg clm-svg', role: 'img',
                            'aria-label': labels.alt || '' }, host);

    // single-hue heat: pale at cos≈0, strong at cos≈1, on the green hue (matching = neighbours).
    const heat = (x) => {
      const v = Math.max(0, Math.min(1, Number(x) || 0));
      return `color-mix(in srgb, var(--c-green, #3A8A5C) ${Math.round((0.08 + 0.82 * v) * 100)}%, var(--bg-card, #fff))`;
    };

    // ── headline ──
    el('text', { x: PAD, y: headY, class: 'clm-head' }, svg).textContent =
      labels.head || 'one shared space · cosine(image i, caption j)';

    // ── axis captions (modality labels) ──
    el('text', { x: gridLeft + gridW / 2, y: 46, class: 'clm-axiscap clm-textcap', 'text-anchor': 'middle' }, svg)
      .textContent = labels.textAxis || 'caption (text) j →';
    el('text', { x: PAD, y: gridTop + gridW / 2, class: 'clm-axiscap clm-imgcap', 'text-anchor': 'middle',
                 transform: `rotate(-90 ${PAD} ${gridTop + gridW / 2})` }, svg)
      .textContent = labels.imgAxis || '↓ image i';

    // ── column (text j) labels, on top ──
    concepts.forEach((cpt, j) => {
      el('text', { x: gridLeft + j * STEP + CELL / 2, y: colLblY, class: 'clm-collbl', 'text-anchor': 'middle' }, svg)
        .textContent = cpt;
    });

    // ── the 3×3 cells (built once; fill + value driven by update) ──
    const cells = [];
    for (let i = 0; i < n; i++) {
      const cy = gridTop + i * STEP;
      // row (image i) label, on the left
      el('text', { x: gridLeft - 12, y: cy + CELL / 2 + 5, class: 'clm-rowlbl', 'text-anchor': 'end' }, svg)
        .textContent = concepts[i];
      for (let j = 0; j < n; j++) {
        const cx = gridLeft + j * STEP;
        const v = Number((M[i] && M[i][j]) || 0);
        const isDiag = (i === j);
        const rect = el('rect', { x: cx, y: cy, width: CELL, height: CELL, rx: 8, class: 'clm-cell' }, svg);
        // value text: always a dark ink so it stays readable against pale OR strong cell fills.
        const valText = el('text', { x: cx + CELL / 2, y: cy + CELL / 2 + 6, class: 'clm-cellval',
                                     'text-anchor': 'middle' }, svg);
        valText.textContent = (typeof v === 'number' && isFinite(v)) ? v.toFixed(4) : '';
        cells.push({ rect, valText, v, isDiag, i, j });
      }
    }

    // step 2 worked-row: which column is the argmax of the FIRST image row (the one we scan by hand).
    const exRow = 0;
    let exArgmax = 0;
    for (let j = 1; j < n; j++) {
      if (Number((M[exRow] && M[exRow][j]) || 0) > Number((M[exRow] && M[exRow][exArgmax]) || 0)) exArgmax = j;
    }

    // ── contrastive bars (step 4): matched-mean vs mismatched-mean + the gap ──
    const matched = Math.max(0, Math.min(1, Number(d.matchedMeanCos) || 0));
    const mismatched = Math.max(0, Math.min(1, Number(d.mismatchedMeanCos) || 0));
    const gapG = el('g', { class: 'clm-bars is-hidden' }, svg);
    const mkBar = (y, val, lblKey, dflt, hi) => {
      // label sits on its own row above the bar; y-7 (not y-4) keeps a clear gap above the 16px track so
      // a long locale label (e.g. 'everything else (off-diagonal)') can't graze the bar it sits over.
      el('text', { x: barLabelX, y: y - 7, class: 'clm-barlbl' }, gapG).textContent = labels[lblKey] || dflt;
      el('rect', { x: barX, y, width: barW, height: 16, rx: 4, class: 'clm-track' }, gapG);
      el('rect', { x: barX, y, width: Math.max(2, Math.round(barW * val)), height: 16, rx: 4,
                   class: 'clm-fill' + (hi ? ' is-hi' : ' is-lo') }, gapG);
      el('text', { x: barX + barW, y: y - 4, class: 'clm-barval', 'text-anchor': 'end' }, gapG)
        .textContent = (Number(hi ? d.matchedMeanCos : d.mismatchedMeanCos) || 0).toFixed(4);
    };
    mkBar(barsTop, matched, 'matched', 'matching pairs (diagonal)', true);
    mkBar(barsTop + barRow, mismatched, 'mismatched', 'everything else (off-diagonal)', false);
    el('text', { x: barX + barW / 2, y: barsBottom + 0, class: 'clm-gap', 'text-anchor': 'middle' }, gapG)
      .textContent = `${labels.gapLbl || 'contrastive gap'} = ${(Number(d.contrastiveGap) || 0).toFixed(4)}`;

    // ── worked-row note (step 2 only) + diagonal tally line (step 3+) share the bottom band ──
    const rowPickG = el('g', { class: 'clm-rowpick is-hidden' }, svg);
    el('text', { x: PAD, y: gridBottom + 22, class: 'clm-rowpicktxt' }, rowPickG).textContent =
      `${labels.rowPick || 'scan one row → pick its brightest cell (argmax)'}: ` +
      `${concepts[exRow]} → ${concepts[exArgmax]}`;

    const tallyG = el('g', { class: 'clm-tally is-hidden' }, svg);
    el('text', { x: PAD, y: gridBottom + 22, class: 'clm-tallytxt' }, tallyG).textContent =
      `${labels.tally || 'top match on the diagonal'}: ${Number(d.diagonalCorrect) || 0} / ${n}`;

    // ── real badge (step 4) ──
    const real = d.real || {};
    const badgeG = el('g', { class: 'clm-badge is-hidden' }, svg);
    el('rect', { x: PAD, y: badgeY - 18, width: W - 2 * PAD, height: 40, rx: 9, class: 'clm-badgebox' }, badgeG);
    const acc = (Number(real.top1Accuracy) || 0);
    el('text', { x: PAD + 14, y: badgeY + 8, class: 'clm-badgetxt' }, badgeG).textContent =
      `${labels.real || 'real llava:7b · image→caption forced choice'}: ` +
      `${Number(real.top1Correct) || 0}/${Number(real.n) || 0} = ${acc.toFixed(2)}`;

    return function update(k) {
      // 1 → fill values + heat; 2 → scan ONE row (ring its argmax, dim its losers);
      // 3 → every row's argmax = green diagonal + tally; 4 → bars; 5 → real badge.
      cells.forEach((c) => {
        c.rect.setAttribute('fill', k >= 1 ? heat(c.v) : 'var(--bg-inset, #EBE7DA)');
        c.valText.classList.toggle('is-shown', k >= 1);
        // step 2 lights ONLY the worked row's argmax; step 3+ lights the whole diagonal.
        const lit = (k >= 3 && c.isDiag) || (k === 2 && c.i === exRow && c.j === exArgmax);
        c.rect.classList.toggle('is-diag', lit);
        c.valText.classList.toggle('is-diag', lit);
        // at step 2, fade the scanned row's non-winning cells so the argmax pick is the visible act.
        c.rect.classList.toggle('is-rowloser', k === 2 && c.i === exRow && c.j !== exArgmax);
        c.valText.classList.toggle('is-rowloser', k === 2 && c.i === exRow && c.j !== exArgmax);
      });
      rowPickG.classList.toggle('is-hidden', !(k === 2));
      tallyG.classList.toggle('is-hidden', !(k >= 3));
      gapG.classList.toggle('is-hidden', !(k >= 4));
      badgeG.classList.toggle('is-hidden', !(k >= 5));
    };
  },
});
