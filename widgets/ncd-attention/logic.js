/* ncd-attention/logic.js — scaled dot-product attention in the NEURAL CIRCUIT DIAGRAM lens
   (Abbott & Zardini v2): wires are tensor axes, boxes are operations, a contraction is a "cup" where
   an axis disappears, and broadcasting is a wire WOVEN around the whole expression.

   WHAT THIS WIDGET ARGUES. A diagram that only shows the RIGHT answer wastes the notation. Two things
   make NCD earn its keep, and both are here:
     • the LEDGER counts axes as they are born and die. The cup contracts d — and in doing so it
       CREATES an n×n axis. That axis IS the quadratic cost: at n=32768 with 12 heads it is 25.8 GB
       (data/l15-attention.json → memory). O(n²) stops being a fact to memorise and becomes an axis
       you watch appear.
     • the last step is a COUNTERFACTUAL: delete the ÷√dₖ box and the same dot product 6 drives softmax
       to 0.995 — all but one-hot, so the gradient dies. The scale factor stops being decoration.

   THREE BUGS AN AUDIT FOUND HERE, AND WHAT THEY TAUGHT:
     1. The figure labelled the score matrix `n×m` while the ledger, in the SAME frame, called it `n×n`
        — on the card titled "the axis that costs 25.8 GB". The shape had been typed twice, by two
        hands. Fixed structurally: `SH` (shapeTable) is now the ONE place an axis is named, and the
        ledger and the SVG both read from it. They can no longer disagree.
     2. Steps 0–3 drew UNSCALED attention — there was no ÷√dₖ glyph anywhere — and step 4 then invited
        the student to "delete the ÷√dₖ box". The widget whose thesis is "a failure looks like a missing
        glyph" was itself missing the glyph. The box is now drawn, between the cup and the softmax.
     3. The step-4 headline was created and never appended (no parent passed), so it rendered as a blank
        strip and nobody noticed for a week. `_ncd.text()` now throws instead of dropping the node.

   The chain deliberately ENDS AT THE CONTEXT of ONE head: concat + L_O belong to ncd-multihead. (They
   used to be drawn here, INSIDE the head-broadcast weave — which is precisely the configuration
   ncd-debug teaches as "bug 3: the heads were never merged".)

   Every NUMBER comes from data/l15-attention.json (facts-gated, gen_l15.py): scores [1,0,3] (the row
   AFTER ÷√dₖ), weights [0.114,0.042,0.844], context (0.958,0.886), and the √dₖ counterfactual
   (dot 6 → 0.995 unscaled vs 0.909 scaled). Step 0 = contract d, scale → scores · 1 = softmax
   · 2 = context · 3 = broadcast h,b + the memory bill · 4 = the ÷√dₖ counterfactual. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger, shapeTable } from '../_ncd.js';
import { stack } from '../_layout.js';

/* The ONE place this widget names an axis. `m` is the MODEL WIDTH (768) — the same letter the whole
   family uses — so the key axis is `n` too (in self-attention the keys ARE the tokens) and the score
   matrix is n×n. The einsum widget writes the same contraction as 'nd,md->nm', where its `m` is the
   KEY axis: that is correct einsum (a subscript may not repeat on the output side) and is glossed there. */
const SH = shapeTable({
  x: 'n×m',        // the token wire: n tokens × the model width
  qkv: 'n×d',      // Q, K, V after the learned projections (d = the head dim)
  scores: 'n×n',   // BORN at the cup. This is the axis the whole memory bill is about.
  ctx: 'n×d',      // the key axis dies at the second cup
});

export const mountNcdAttention = defineWidget({
  id: 'ncd-attention',
  rootClass: 'ncda-root',
  exportName: 'mountNcdAttention',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const A = (data && data.attention) || {};
    const SC = (data && data.sqrtScale) || {};
    const MEM = (data && data.memory) || {};
    const scores = A.scores || [1, 0, 3];
    const weights = A.weights || [0.114, 0.042, 0.844];
    const output = A.output || [0.958, 0.886];
    const values = A.values || [[1, 0], [0, 1], [1, 1]];   // V — drawn now; the context is A·V and V was invisible
    const dk = A.dk != null ? A.dk : 4;
    const sqrtDk = A.sqrtDk != null ? A.sqrtDk : 2;
    const cfDot = SC.dot != null ? SC.dot : 6;
    const cfScaled = SC.scaledScore != null ? SC.scaledScore : 3;
    const cfHot = SC.unscaled || [0.002, 0.002, 0.995];
    const cfSoft = SC.scaled || [0.045, 0.045, 0.909];
    const heads = MEM.heads != null ? MEM.heads : 12;
    const nList = MEM.n || [512, 4096, 32768];
    const memList = [MEM.mb512x12, MEM.mb4kx12, MEM.gb32kx12];
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const F = G.fmt3;

    const W = 820, H = 292;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncda-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Attention as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'axes & cost'));

    // ── local glyphs that carry this widget's own class contract ───────────────
    const line = (cls, x1, y1, x2, y2, p) => G.wire(p, 'ncda-w ' + cls, x1, y1, x2, y2);
    const path = (cls, d, p) => el('path', { class: 'ncda-w ' + cls, d }, p);
    const text = (x, y, s, cls, anchor, p) => G.text(p, x, y, s, cls, anchor || 'middle');
    function chippedL(cx, cy, lab, p) {
      const w = 46, h = 40, c = 10, x = cx - w / 2, y = cy - h / 2;
      el('path', { class: 'ncda-L', d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, p);
      text(cx - 3, cy + 5, 'L', 'ncda-L-txt', 'middle', p);
      text(cx + 9, cy + 8, lab, 'ncda-size', 'middle', p);
    }
    function cup(cx, cy, p) {
      el('path', { class: 'ncda-op', d: `M${cx - 15},${cy - 13} Q${cx},${cy + 18} ${cx + 15},${cy - 13}` }, p);
      el('circle', { class: 'ncda-op-dot', cx, cy: cy + 6, r: 2.6 }, p);
    }
    function tri(cx, cy, p) {
      el('path', { class: 'ncda-sm', d: `M${cx - 18},${cy - 19} L${cx + 18},${cy} L${cx - 18},${cy + 19} Z` }, p);
      text(cx - 5, cy + 5, 'σ', 'ncda-sm-txt', 'middle', p);
    }
    function chips(centers, y, vals, chipCls, w, p, fmt) {
      centers.forEach((cx, i) => {
        el('rect', { class: 'ncda-chip ' + chipCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, p);
        text(cx, y + 4, (fmt || F)(vals[i]), 'ncda-chipv', 'middle', p);
      });
    }
    /* The broadcast weave. The anchor dot used to inherit no fill rule and rendered BLACK, as a blob on
       the last letter of the "tokens" label; it now carries its own filled class and starts clear of it.
       The tag MEASURES itself (G.tagBox) instead of guessing chars × 6.6px — the guess burst the box in
       Cyrillic and again at every font-size bump. It rides ON the woven wire by design (that IS the
       idiom: the tag names the wire it sits on), so it declares `ncd-onwire` for the wire-through check. */
    function weave(cls, dotCls, tagCls, tagTxtCls, x1, x2, y, bow, tag, p) {
      const mx = (x1 + x2) / 2;
      path(cls, `M${x1},${y} C${x1 + 30},${y - bow} ${mx - 60},${y - bow} ${mx},${y - bow} ` +
                `C${mx + 60},${y - bow} ${x2 - 30},${y - bow} ${x2},${y}`, p);
      el('circle', { cx: x1, cy: y, r: 3, class: dotCls }, p);
      G.tagBox(p, mx, y - bow + 3, tag, 'ncda-tag-box ' + tagCls + ' ncd-onwire',
        'ncda-tag-txt ' + tagTxtCls, 8, 4);
    }

    // ── geometry. The ÷√dₖ box needed ~60px between the cup and the scores; dropping L_O (which belongs
    //    to ncd-multihead anyway) freed exactly that, so everything downstream simply shifted right.
    const rows = stack({ x: 62, y: 78, w: 46, h: 168 }, 3, { dir: 'col', gap: 18 });
    const yQ = rows[0].y + rows[0].h / 2, yK = rows[1].y + rows[1].h / 2, yV = rows[2].y + rows[2].h / 2;
    const xTok = 20, xL = 85, xQK = 246, xScale = 296, yS = (yQ + yK) / 2;
    const scC = [346, 382, 418], xSM = 460, wtC = [514, 566, 618], xSig = 678, ctxC = [730, 782];
    const ySig = (yS + yV) / 2;

    // ── the ledger. Every shape here comes from SH — the same object the figure labels read. ──
    const uMB = L('uMB', 'MB'), uGB = L('uGB', 'GB');
    const memRow = (i) => ({ k: `n=${nList[i]}`, v: `${memList[i]}${i === 2 ? ' ' + uGB : ' ' + uMB}`,
      state: 'new', tone: i === 2 ? 'cost' : undefined });
    function setLedger(step) {
      const on = (upto) => (step > upto ? 'on' : step === upto ? 'new' : 'off');
      if (step === 4) {
        lg.set([
          { k: 'q·k', v: String(cfDot), state: 'on' },
          { k: `÷√dₖ (=${sqrtDk})`, v: String(cfScaled), state: 'on', tone: 'good' },
          { k: L('lgNoScale', 'no ÷√dₖ'), v: F(cfHot[2]), state: 'new', tone: 'cost' },
          { k: L('lgWithScale', 'with ÷√dₖ'), v: F(cfSoft[2]), state: 'new', tone: 'good' },
        ], L('lgN4', 'Without the scale, softmax saturates: 0.995 is all but one-hot, so the gradient dies.'));
        return;
      }
      const rowsL = [
        { k: 'x', v: SH.x, state: on(0) },
        { k: 'Q, K, V', v: SH.qkv, state: on(0) },
        { k: 'Q·Kᵀ ÷√dₖ', v: SH.scores, state: on(0), tone: 'cost' },
        { k: 'softmax', v: SH.scores, state: step >= 1 ? on(1) : 'off' },
        { k: 'ctx = A·V', v: SH.ctx, state: step >= 2 ? on(2) : 'off', tone: 'good' },
      ];
      if (step >= 3) {
        rowsL.push({ k: `× h (=${heads})`, v: `h · ${SH.scores}`, state: 'new' });
        for (let i = 0; i < 3; i++) rowsL.push(memRow(i));
      }
      const notes = [
        L('lgN0', 'The cup contracts d — and in doing so BIRTHS an n×n axis. That axis is the quadratic cost.'),
        L('lgN1', 'softmax does not change the shape: n×n in, n×n out.'),
        L('lgN2', 'The sum over keys contracts n×n back down to n×d. The big axis lived and died right here.'),
        L('lgN3', 'The weave multiplies that n×n axis by h. This is the memory bill, not a metaphor.'),
      ];
      lg.set(rowsL, notes[Math.min(step, 3)]);
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ── step 4: the counterfactual. One dot product, two fates. ──────────────
      if (step === 4) {
        const g = el('g', { class: 'ncd-fx' }, main);
        const yT = 104, yB = 214, xDot = 66, xLbl = 174, sC = [252, 292, 332], xSg = 378,
              wC = [446, 512, 578], xVer = 704;
        text(W / 2, 34, L('cfHead', 'the same dot product q·k = ' + cfDot + ', two fates'), 'ncda-cf-head', 'middle', g);
        el('rect', { class: 'ncda-chip ncda-chip-sc', x: xDot - 26, y: 151 - 15, width: 52, height: 30, rx: 6 }, g);
        text(xDot, 151 + 5, String(cfDot), 'ncda-chipv', 'middle', g);
        path('ncda-w-d', `M${xDot + 26},${151} C${xDot + 60},${151} ${xLbl - 70},${yT} ${xLbl - 50},${yT}`, g);
        path('ncda-w-d', `M${xDot + 26},${151} C${xDot + 60},${151} ${xLbl - 70},${yB} ${xLbl - 50},${yB}`, g);

        [[yT, L('cfNo', 'no ÷√dₖ'), cfDot, cfHot, 'bad'], [yB, L('cfYes', '÷√dₖ = ' + sqrtDk), cfScaled, cfSoft, 'ok']]
          .forEach(([y, lab, sVal, wVals, kind]) => {
            const boxCls = kind === 'bad' ? 'ncda-cf-bad' : 'ncda-cf-ok';
            el('rect', { class: 'ncda-cf-lbl ' + boxCls, x: xLbl - 50, y: y - 15, width: 100, height: 30, rx: 7 }, g);
            text(xLbl, y + 5, lab, 'ncda-cf-lbl-txt', 'middle', g);
            line('ncda-w-attn', xLbl + 50, y, sC[0] - 20, y, g);
            chips(sC, y, [0, 0, sVal], 'ncda-chip-sc', 26, g);
            line('ncda-w-attn', sC[2] + 16, y, xSg - 20, y, g);
            tri(xSg, y, g);
            line('ncda-w-attn', xSg + 20, y, wC[0] - 28, y, g);
            chips(wC, y, wVals, kind === 'bad' ? 'ncda-chip-bad' : 'ncda-chip-good', 54, g);
            el('rect', { class: 'ncda-cf-ver ' + boxCls, x: xVer - 96, y: y - 14, width: 192, height: 28, rx: 7 }, g);
            text(xVer, y + 5, kind === 'bad' ? L('cfVerBad', 'one-hot → gradient ≈ 0')
                                             : L('cfVerOk', 'soft → gradient lives'), 'ncda-cf-ver-txt', 'middle', g);
          });
        text(W / 2, H - 6, L('legCf', 'delete one box and the circuit still runs — it just stops learning'),
          'ncda-stage', 'middle', main);
        prev = step;
        return;
      }

      // ── the head backdrop (only once the head is whole) ───────────────────────
      if (step >= 2) {
        const gb = el('g', { class: fresh(2) }, main);
        el('rect', { class: 'ncda-block', x: xQK - 40, y: yQ - 26, width: (xSig + 26) - (xQK - 40),
          height: (yV + 26) - (yQ - 26), rx: 12 }, gb);
        text(xQK - 34, yQ - 30, L('blockCore', 'one head'), 'ncda-block-txt', 'start', gb);
      }

      // ── A. tokens → the three learned projections ─────────────────────────────
      const gA = el('g', { class: fresh(0) }, main);
      text(xTok - 4, yQ - 34, L('lblIn', 'tokens'), 'ncda-axis ncda-axis-in', 'start', gA);
      [['Q', yQ], ['K', yK], ['V', yV]].forEach(([nm, y]) => {
        line('ncda-w-in', xTok, y, xL - 25, y, gA);
        text(xTok, y - 8, 'x', 'ncda-axis ncda-axis-in', 'start', gA);
        chippedL(xL, y, nm, gA);
        text(xL, y - 26, 'L' + nm.toLowerCase(), 'ncda-size', 'middle', gA);
      });

      // ── B. Q·Kᵀ contracts d, ÷√dₖ rescales → the n×n scores are BORN ──────────
      const gQK = el('g', { class: fresh(0) }, main);
      line('ncda-w-d', xL + 24, yQ, xQK - 18, yQ, gQK);
      line('ncda-w-d', xL + 24, yK, xQK - 18, yK, gQK);
      text((xL + xQK) / 2, yQ - 8, 'q', 'ncda-axis ncda-axis-d', 'middle', gQK);
      text((xL + xQK) / 2 - 14, yK + 17, 'k', 'ncda-axis ncda-axis-d', 'middle', gQK);
      text((xL + xQK) / 2 + 14, yK + 17, SH.qkv, 'ncda-size', 'middle', gQK);
      path('ncda-w-d', `M${xQK - 18},${yQ} Q${xQK - 1},${yS} ${xQK - 18},${yK}`, gQK);
      cup(xQK, yS, gQK);
      text(xQK, yS - 22, 'Q·Kᵀ', 'ncda-size', 'middle', gQK);
      // the scale box — the glyph whose ABSENCE step 4 is about
      line('ncda-w-attn', xQK + 15, yS, xScale - 23, yS, gQK);
      el('rect', { class: 'ncda-scale', x: xScale - 23, y: yS - 20, width: 46, height: 40, rx: 6 }, gQK);
      text(xScale, yS - 2, '÷√dₖ', 'ncda-scale-txt', 'middle', gQK);
      text(xScale, yS + 12, `√${dk} = ${sqrtDk}`, 'ncda-size', 'middle', gQK);
      line('ncda-w-attn', xScale + 23, yS, scC[0] - 15, yS, gQK);
      chips(scC, yS, scores, 'ncda-chip-sc', 26, gQK);
      text(scC[1], yS - 21, L('lblScores', 'scores'), 'ncda-axis ncda-axis-attn', 'middle', gQK);
      text(scC[1], yS + 21, SH.scores, 'ncda-size', 'middle', gQK);

      // ── C. softmax ACROSS the key axis → the attention weights ────────────────
      if (step >= 1) {
        const gSM = el('g', { class: fresh(1) }, main);
        line('ncda-w-attn', scC[2] + 16, yS, xSM - 20, yS, gSM);
        tri(xSM, yS, gSM);
        text(xSM, yS + 34, L('lblSoftmax', 'softmax over keys'), 'ncda-size', 'middle', gSM);
        line('ncda-w-attn', xSM + 20, yS, wtC[0] - 22, yS, gSM);
        chips(wtC, yS, weights, 'ncda-chip-attn', 44, gSM);
        text(wtC[1], yS - 21, L('lblWeights', 'attention'), 'ncda-axis ncda-axis-attn', 'middle', gSM);
        text(wtC[1], yS + 21, 'Σ=1', 'ncda-size', 'middle', gSM);

        /* OPEN THE BLACK BOX. An audit noted that this widget computed softmax FIVE times and never once
           showed exp(x)/Σexp — the student was handed [1,0,3] and [0.114,0.042,0.844] with the middle
           hidden. Drawn ONLY on step 1, where softmax IS the subject and the lower half of the frame is
           still empty (from step 2 the V matrix lives exactly here). The exponentials are computed live
           from the gated scores with Math.exp — never typed into a string. */
        if (step === 1) {
          const ex = scores.map((s) => Math.exp(s));
          const sum = ex.reduce((a, b) => a + b, 0);
          const eC = [400, 482, 564], yE = 216;
          el('rect', { class: 'ncda-work', x: 300, y: yE - 40, width: 420, height: 66, rx: 8 }, gSM);
          text(312, yE - 23, L('workHead', 'inside the triangle:'), 'ncda-work-head', 'start', gSM);
          text(330, yE + 5, 'exp', 'ncda-size', 'middle', gSM);
          chips(eC, yE, ex, 'ncda-chip-attn', 66, gSM, (v) => v.toFixed(3));   // 1.000, not 1
          text(664, yE + 5, 'Σ = ' + sum.toFixed(3), 'ncda-work-sum', 'middle', gSM);
          text(510, yE + 38, L('workDiv', 'each ÷ Σ → the weights above'), 'ncda-size', 'middle', gSM);
        }
      }

      // ── D. V → weighted sum (the key axis dies) → the context of ONE head ─────
      if (step >= 2) {
        const gD = el('g', { class: fresh(2) }, main);
        /* DRAW V. The context (0.958, 0.886) is A·V — and V used to be an unlabelled wire, so the output
           was underivable from anything on screen. `attention.values` was in data/l15-attention.json all
           along, gated, unused. Now the weighted sum has both its operands visible. */
        const vGx = 300, vCell = 30, vRowH = 20;
        line('ncda-w-d', xL + 24, yV, vGx - 8, yV, gD);
        text(220, yV - 14, 'v   ' + SH.qkv, 'ncda-axis ncda-axis-d', 'middle', gD);
        values.forEach((row, r) => row.forEach((v, c) => {
          const x = vGx + c * vCell, y = yV - vRowH + r * vRowH;
          el('rect', { class: 'ncda-chip ncda-chip-v', x, y: y - 9, width: vCell - 3, height: vRowH - 3, rx: 3 }, gD);
          text(x + (vCell - 3) / 2, y + 4, String(v), 'ncda-vcell', 'middle', gD);
        }));
        line('ncda-w-d', vGx + 2 * vCell + 4, yV, xSig - 4, yV, gD);
        path('ncda-w-attn', `M${wtC[2] + 22},${yS} Q${xSig},${(yS + ySig) / 2} ${xSig - 2},${ySig}`, gD);
        path('ncda-w-d', `M${xSig - 4},${yV} Q${xSig + 4},${(ySig + yV) / 2} ${xSig - 2},${ySig + 12}`, gD);
        cup(xSig, ySig + 6, gD);
        text(xSig + 2, ySig - 16, L('sumKeys', 'Σ keys'), 'ncda-size', 'middle', gD);
        line('ncda-w-out', xSig + 15, ySig + 6, ctxC[0] - 23, ySig + 6, gD);
        chips(ctxC, ySig + 6, output, 'ncda-chip-out', 44, gD);
        text((ctxC[0] + ctxC[1]) / 2, ySig - 16, L('lblOut', 'context'), 'ncda-axis ncda-axis-out', 'middle', gD);
        text((ctxC[0] + ctxC[1]) / 2, ySig + 27, SH.ctx, 'ncda-size', 'middle', gD);
        // the head's output leaves here. No label: the backdrop already reads "one head", and a second
        // "one head" caption 30px away collided with "context" in all three languages.
        line('ncda-w-out', ctxC[1] + 23, ySig + 6, W - 6, ySig + 6, gD);
      }

      // ── E. the broadcasts — and the bill they run up ──────────────────────────
      if (step >= 3) {
        const gE = el('g', { class: fresh(3) }, main);
        weave('ncda-w-h', 'ncda-dot-h', 'ncda-tag-h', 'ncda-tag-txt-h', xL + 10, 806, 58, 22,
          L('tagHead', 'broadcast: h heads'), gE);
        weave('ncda-w-b', 'ncda-dot-b', 'ncda-tag-b', 'ncda-tag-txt-b', 14, 812, 34, 20,
          L('tagBatch', 'broadcast: b batch'), gE);
      }

      text(W / 2, H - 6, L('legMap', 'wire = axis · box = operation · woven wire = broadcast'),
        'ncda-stage', 'middle', main);
      prev = step;
    };
  },
});
