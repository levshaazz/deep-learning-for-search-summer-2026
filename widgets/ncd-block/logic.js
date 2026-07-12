/* ncd-block/logic.js — one pre-norm transformer block in the neural-circuit-diagram lens.
   The token-vector wire (blue) runs through two shape-preserving sublayers: self-attention then FFN,
   each wrapped by a residual skip (⊕, green) and a LayerNorm (◎, violet). The head axis h is a
   broadcast woven around attention; the block stacks ×L to make the model.

   WHAT THE LEDGER ARGUES. Ask a student where a transformer keeps its parameters and they say
   "attention". The ledger says otherwise, straight from data/l15-attention.json: attention is 4d², the
   FFN is 8d² — TWICE as much. Two thirds of every block lives in the part nobody talks about.

   WHAT THE LEDGER DOES *NOT* COUNT — and used to lie about. 12d² per block → 7.08M, ×12 blocks +
   the token embeddings = 108.38M. That is ALL this skeleton contains, and it is what the `total` row
   prints. The card used to sit that row under the words "≈ 110M — BERT-base, TO THE MILLION" and
   "counted, not quoted", which was exactly backwards: it counted the 12d² skeleton and QUOTED the
   headline. Real bert-base-uncased is 109,482,240, and the 1,106,688 gap is not rounding — it is the
   positional (512×768) and segment (2×768) embeddings, the embedding LayerNorm, the biases + LN gains
   inside the 12 blocks, and the pooler. Those terms are NOT in data/l15-attention.json, so they must
   never appear as a ledger ROW (the facts-gate coverage-guard would hard-fail a new displayed number).
   The rule this card now keeps: the LEDGER shows only what it computes from data/; the CAPTION (s2)
   names, in prose, precisely what the ledger omits. "Counted, not quoted" has to survive being checked.

   WHAT THE LAST STEP ARGUES. Delete the residual arcs and the circuit still type-checks — every shape
   still lines up. What it loses is the only IDENTITY path from x to the output: the gradient now has to
   travel back THROUGH every sublayer, attenuating at each one. The failure of a deep stack without
   residuals is a MISSING WIRE, and in this notation you can point at where it isn't.

   Step 0 = attention sublayer · 1 = + FFN sublayer · 2 = + head broadcast, the ×L stack, the param bill
   · 3 = the no-residual counterfactual. DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdBlock = defineWidget({
  id: 'ncd-block',
  rootClass: 'ncdb-root',
  exportName: 'mountNcdBlock',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const P = (data && data.params) || {};
    const d = P.d != null ? P.d : 768;
    const attnCoef = P.attnCoef != null ? P.attnCoef : 4;
    const ffnCoef = P.ffnCoef != null ? P.ffnCoef : 8;
    const blockCoef = P.blockCoef != null ? P.blockCoef : 12;
    const blocks = P.blocks != null ? P.blocks : 12;
    const perBlockM = P.perBlockM != null ? P.perBlockM : 7.08;
    const tokenEmb = P.tokenEmb != null ? P.tokenEmb : 23440896;
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const M = (x) => (x / 1e6).toFixed(2) + 'M';
    const attnP = attnCoef * d * d, ffnP = ffnCoef * d * d;
    const stackP = blockCoef * d * d * blocks;
    const totalP = stackP + tokenEmb;

    const W = 800, H = 250, yM = 150;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdb-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'A transformer block as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'parameters'));

    const xIn = 22, xTap1 = 86, xAttn = 184, xAdd1 = 286, xLN1 = 338;
    const xTap2 = 384, xFFN = 500, xAdd2 = 618, xLN2 = 670, xOut = 780;

    function plus(g, cx, cy = yM) { el('circle', { class: 'ncdb-plus', cx, cy, r: 13 }, g); G.text(g, cx, cy + 5, '+', 'ncdb-plus-txt'); }
    function ln(g, cx) { el('circle', { class: 'ncdb-ln', cx, cy: yM, r: 15 }, g); G.text(g, cx, yM + 4, L('lblLN', 'LN'), 'ncdb-ln-txt'); }
    function residual(g, x1, x2) {
      const top = yM - 54;
      el('path', { class: 'ncdb-w ncdb-w-res', d: `M${x1},${yM} C${x1},${top} ${x2},${top} ${x2},${yM - 13}` }, g);
      el('circle', { cx: x1, cy: yM, r: 3, fill: 'var(--accent, #2A6FDB)' }, g);
      G.text(g, (x1 + x2) / 2, top - 4, L('lblRes', 'residual'), 'ncdb-lbl');
    }

    function setLedger(step) {
      if (step === 3) {
        lg.set([
          { k: L('lgPath', 'identity path'), v: L('lgGone', 'gone'), state: 'new', tone: 'cost' },
          { k: L('lgDepth', 'sublayers to cross'), v: String(blocks * 2), state: 'new', tone: 'cost' },
        ], L('lgN3', 'With no residual the ONLY path from x to the output runs THROUGH every sublayer. The gradient has nothing to hold on to.'));
        return;
      }
      const on = (k) => (step > k ? 'on' : step === k ? 'new' : 'off');
      const rows = [
        { k: 'd', v: String(d), state: 'on' },
        { k: `attention ${attnCoef}d²`, v: M(attnP), state: on(0) },
        { k: `FFN ${ffnCoef}d²`, v: M(ffnP), state: step >= 1 ? on(1) : 'off', tone: 'cost' },
      ];
      if (step >= 2) {
        rows.push({ k: `${L('lgBlock', 'block')} ${blockCoef}d²`, v: perBlockM + 'M', state: 'new' });
        rows.push({ k: `× ${blocks} ${L('lgBlocks', 'blocks')}`, v: M(stackP), state: 'new' });
        rows.push({ k: '+ ' + L('lgEmb', 'embeddings'), v: M(tokenEmb), state: 'new' });
        rows.push({ k: L('lgTotal', 'total'), v: '≈ ' + M(totalP), state: 'new', tone: 'good' });
      }
      const notes = [
        L('lgN0', 'The shape never changes: n×m in, n×m out. A sublayer refines; it does not reshape.'),
        L('lgN1', 'The surprise: the FFN is 8d² — TWICE attention. Two thirds of the block is not attention at all.'),
        L('lgN2', 'This tally counts what the diagram draws: 12 blocks of 12d² plus the token embeddings. The quoted “110M” also pays for positions, segments, every bias, the LayerNorm gains and the pooler — the caption does that arithmetic.'),
      ];
      lg.set(rows, notes[Math.min(step, 2)]);
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const g = main;
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ── step 3: delete the residual and watch the gradient die ───────────────
      if (step === 3) {
        const gc = el('g', { class: 'ncd-fx' }, main);
        G.text(gc, W / 2, 26, L('cfHead', 'the same circuit — one wire apart'), 'ncdb-cf-head');
        [{ y: 88, keep: true, lab: L('cfWith', 'with residual'), cls: 'ncdb-cf-ok' },
         { y: 196, keep: false, lab: L('cfWithout', 'no residual'), cls: 'ncdb-cf-bad' }]
          .forEach(({ y, keep, lab, cls }) => {
            /* GEOMETRY, rebuilt. The skip arcs used to dip only 32px while the sublayer boxes are 40 tall,
               so the wire whose ENTIRE MEANING is "this path bypasses the sublayer" was drawn straight
               through the sublayer it bypasses. And the ⊕ was missing altogether, though this widget's own
               legend teaches "⊕ = residual add". The arcs now clear the boxes by ~19px and LAND on a ⊕
               sitting on the main wire, which is what a residual connection actually is. */
            const xX = 130, b1 = 214, xAdd1 = 296, b2 = 384, xAdd2 = 466, xO = 512;
            G.tagBox(gc, 68, y + 4, lab, 'ncdb-cf-lbl ' + cls, 'ncdb-cf-lbl-txt', 12, 8);
            G.wire(gc, 'ncdb-w ncdb-w-main', xX, y, b1 - 56, y);
            G.box(gc, b1, y, 112, 40, L('lblAttn', 'self-attention'), null, 'ncdb-attn', 'ncdb-attn-txt', 'ncdb-sub');
            G.wire(gc, 'ncdb-w ncdb-w-main', b1 + 56, y, keep ? xAdd1 - 12 : b2 - 56, y);
            if (keep) {
              plus(gc, xAdd1, y);
              G.wire(gc, 'ncdb-w ncdb-w-main', xAdd1 + 12, y, b2 - 56, y);
            }
            G.box(gc, b2, y, 112, 40, L('lblFFN', 'FFN'), null, 'ncdb-ffn', 'ncdb-ffn-txt', 'ncdb-sub');
            G.wire(gc, 'ncdb-w ncdb-w-main', b2 + 56, y, keep ? xAdd2 - 12 : xO, y, { arrow: !keep });
            if (keep) {
              plus(gc, xAdd2, y);
              G.wire(gc, 'ncdb-w ncdb-w-main', xAdd2 + 12, y, xO, y, { arrow: true });
              // the identity path: it goes AROUND the box (19px of daylight) and lands on the ⊕
              [[144, xAdd1], [318, xAdd2]].forEach(([a, b]) => {
                el('path', { class: 'ncdb-w ncdb-w-res', fill: 'none',
                  d: `M${a},${y} C${a},${y + 52} ${b},${y + 52} ${b},${y + 12}` }, gc);
                el('circle', { cx: a, cy: y, r: 3, fill: 'var(--accent, #2A6FDB)' }, gc);
              });
            }
            // the BACKWARD wire above the row: it survives the skip, it dies through the boxes
            const gy = y - 38;
            if (keep) {
              G.wire(gc, 'ncdb-w ncdb-grad-ok', xO, gy, xX - 4, gy);
              el('path', { class: 'ncdb-w ncdb-grad-ok', fill: 'none',
                d: `M${xX + 4},${gy - 4} L${xX - 4},${gy} L${xX + 4},${gy + 4}` }, gc);
            } else {       // three segments, each fainter — the attenuation IS the picture
              [[xO, b2, 1], [b2, b1, .45], [b1, xX - 4, .15]].forEach(([a, b, o]) => {
                G.wire(gc, 'ncdb-w ncdb-grad-bad', a, gy, b, gy).setAttribute('opacity', String(o));
              });
            }
            G.tagBox(gc, 640, gy + 4, keep ? L('cfGradOk', '∇ reaches x intact') : L('cfGradBad', '∇ ≈ 0 by the time it lands'),
              'ncdb-cf-grad ' + cls, 'ncdb-cf-grad-txt', 12, 8);
          });
        G.text(gc, W / 2, H - 6, L('legCf', 'every shape still lines up — it just never learns'), 'ncdb-legend');
        prev = step;
        return;
      }

      const hasFFN = step >= 1;
      const endX = hasFFN ? xLN2 : xLN1;

      const gA = el('g', { class: fresh(0) }, g);
      G.text(gA, xIn, yM - 30, L('lblIn', 'x  (n×m)'), 'ncdb-axis', 'start');
      G.wire(gA, 'ncdb-w ncdb-w-main', xIn, yM, xAttn - 58, yM);
      residual(gA, xTap1, xAdd1);
      // 116 wide, not 98: "self-attention" is 14 mono chars ≈ 100px and was grazing the box border
      G.box(gA, xAttn, yM, 116, 46, L('lblAttn', 'self-attention'), 'n×m', 'ncdb-attn', 'ncdb-attn-txt', 'ncdb-sub');
      G.wire(gA, 'ncdb-w ncdb-w-main', xAttn + 58, yM, xAdd1 - 13, yM, { arrow: true });
      plus(gA, xAdd1);
      G.wire(gA, 'ncdb-w ncdb-w-main', xAdd1 + 13, yM, xLN1 - 15, yM);
      ln(gA, xLN1);

      if (hasFFN) {
        const gB = el('g', { class: fresh(1) }, g);
        G.wire(gB, 'ncdb-w ncdb-w-main', xLN1 + 15, yM, xFFN - 62, yM);
        residual(gB, xTap2, xAdd2);
        el('circle', { cx: xTap2, cy: yM, r: 3, fill: 'var(--accent, #2A6FDB)' }, gB);
        G.box(gB, xFFN, yM, 118, 46, L('lblFFN', 'FFN'), L('lblFFNsub', 'm → 4m → m'), 'ncdb-ffn', 'ncdb-ffn-txt', 'ncdb-sub');
        G.wire(gB, 'ncdb-w ncdb-w-main', xFFN + 59, yM, xAdd2 - 13, yM, { arrow: true });
        plus(gB, xAdd2);
        G.wire(gB, 'ncdb-w ncdb-w-main', xAdd2 + 13, yM, xLN2 - 15, yM);
        ln(gB, xLN2);
      }
      const gO = el('g', { class: fresh(hasFFN ? 1 : 0) }, g);
      G.wire(gO, 'ncdb-w ncdb-w-main', endX + 15, yM, xOut, yM, { arrow: true });
      G.text(gO, xOut - 2, yM - 26, L('lblOut', 'out'), 'ncdb-axis', 'end');

      if (step >= 2) {
        const gC = el('g', { class: fresh(2) }, g);
        const tag = L('tagHead', 'broadcast: h heads');
        el('path', { class: 'ncdb-weave', d: `M${xTap1 + 8},${yM + 40} C${xAttn - 60},${yM + 62} ${xAttn + 60},${yM + 62} ${xAdd1 + 8},${yM + 40}` }, gC);
        G.tagBox(gC, xAttn, yM + 67, tag, 'ncdb-tag ncd-onwire', 'ncdb-tag-txt');   // rides ON the weave, by design
        G.tagBox(gC, xOut - 76, 35, L('tagStack', '× L blocks → the model'), 'ncdb-stack', 'ncdb-stack-txt');
      }
      G.text(g, W / 2, H - 6, L('legMap', 'wire = token vectors · ⊕ = residual add · ◎ = LayerNorm'), 'ncdb-legend');
      prev = step;
    };
  },
});
