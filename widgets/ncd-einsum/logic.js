/* ncd-einsum/logic.js — THE ISOMORPHISM. One truth, written three ways at once: as a circuit, as an
   einsum subscript string, and as a formula with a Σ.

   THE RULE, WHICH IS THE WHOLE WIDGET:
       an index that appears in the INPUTS and does NOT appear in the OUTPUT has been CONTRACTED.
       In the diagram that is a CUP. In the formula that is a Σ. In einsum it is simply a letter
       you did not write on the right-hand side.

   Abbott's central claim is that the diagram IS the einsum — not a picture *of* it, but the same
   object. That claim is usually left as an assertion. Here it is checkable: each step highlights ONE
   index simultaneously in all three notations, so you can watch `d` be alive on the left of the arrow,
   absent on the right, drawn as a cup, and summed over in the formula. Same letter, three alphabets.

   Steps: 0 = the contracted index d (the cup) · 1 = the surviving indices n, m (the wires that come
   out) · 2 = softmax normalises ACROSS m without contracting it (shape unchanged — the one operation
   with no cup) · 3 = the second contraction, over m, which produces the context.
   Structural: no grounded numbers, so `data: []`. DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdEinsum = defineWidget({
  id: 'ncd-einsum',
  rootClass: 'ncde-root',
  exportName: 'mountNcdEinsum',
  maxStep: 3,
  render({ host, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const W = 820, H = 344;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncde-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'The same contraction written as a circuit, an einsum and a formula') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the index'));

    const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || 'middle');
    const R = (p, cls, x, y, w, h, rx) => el('rect', { class: cls, x, y, width: w, height: h, rx: rx || 6 }, p);

    /* A monospace string drawn ONE CHARACTER PER <text>, so any single index letter can be lit
       independently. Advance 10px at 15px mono — glyphs never touch, so per-char text elements can
       never be read as a collision. `hot` is the set of characters to light. */
    function mono(p, x0, y, str, baseCls, hotCls, hot) {
      [...str].forEach((ch, i) => {
        const isHot = hot && hot.has(ch);
        if (isHot) R(p, 'ncde-hot-bg', x0 + i * 10 - 5, y - 13, 10, 18, 3);
        T(p, x0 + i * 10, y, ch, isHot ? hotCls : baseCls);
      });
      // NOT a box: this is the pen advancing over a MONOSPACE run, one <text> per character at a fixed
      // 10px advance. It has nothing to burst, so it is exempt from the no-character-count rule.
      return x0 + str.length * 10;   // NCD-ALLOW-ADVANCE
    }
    function paneLbl(p, x, y, s) { T(p, x, y, s, 'ncde-pane-lbl', 'start'); }

    // per step: which letters are lit, the einsum line, the formula line
    const STEPS = [
      { hot: new Set(['d']), ein: "einsum('nd,md->nm', Q, K)", f1: 'S', f2: ' = Σ', f3: 'd', f4: '  Q', f5: 'nd', f6: ' · K', f7: 'md' },
      { hot: new Set(['n', 'm']), ein: "einsum('nd,md->nm', Q, K)", f1: 'S', f2: ' = Σ', f3: 'd', f4: '  Q', f5: 'nd', f6: ' · K', f7: 'md' },
      { hot: new Set(['m']), ein: "A = softmax(S, dim='m')", f1: 'A', f2: ' = softmax', f3: 'm', f4: '(S)', f5: '', f6: '', f7: '' },
      { hot: new Set(['m']), ein: "einsum('nm,md->nd', A, V)", f1: 'Y', f2: ' = Σ', f3: 'm', f4: '  A', f5: 'nm', f6: ' · V', f7: 'md' },
    ];

    const LEDGERS = [
      { rows: [{ k: L('lgIn', 'inputs'), v: 'nd , md' }, { k: L('lgOut', 'output'), v: 'nm' },
               { k: L('lgSurvives', 'repeated, survives'), v: '—' },
               { k: L('lgDies', 'repeated, vanishes'), v: 'd', tone: 'good' },
               { k: L('lgTherefore', 'therefore'), v: '⌣  ' + L('lgCup', 'a cup') , tone: 'good' }],
        note: L('lgN0', 'Read the string, not the picture: d is on the LEFT of the arrow twice and on the RIGHT not at all. That is the entire definition of a contraction. The cup in the diagram and the Σ in the formula are two more ways of writing exactly that.') },
      { rows: [{ k: L('lgIn', 'inputs'), v: 'nd , md' }, { k: L('lgOut', 'output'), v: 'nm' },
               { k: L('lgSurvives', 'repeated, survives'), v: '—' },
               { k: L('lgFree', 'free, survives'), v: 'n , m', tone: 'good' },
               { k: L('lgShape', 'so the shape is'), v: 'n×m' }],
        note: L('lgN1', 'The letters that DO appear on the right are the wires that leave the circuit — and, read in order, they are literally the output shape. n×m. The subscript string is not a mnemonic for the shape; it is the shape.') },
      { rows: [{ k: L('lgIn', 'input'), v: 'nm' }, { k: L('lgOut', 'output'), v: 'nm' },
               { k: L('lgNormOver', 'normalised across'), v: 'm' },
               { k: L('lgContracted', 'contracted'), v: L('lgNothing', 'nothing') },
               { k: L('lgTherefore', 'therefore'), v: L('lgNoCup', 'no cup'), tone: 'cost' }],
        note: L('lgN2', 'softmax is the odd one out: it works ACROSS m but does not consume it — nm goes in, nm comes out. No letter vanishes, so there is no cup. That is why the triangle is a different glyph: it re-weights an axis instead of eating it.') },
      { rows: [{ k: L('lgIn', 'inputs'), v: 'nm , md' }, { k: L('lgOut', 'output'), v: 'nd' },
               { k: L('lgDies', 'repeated, vanishes'), v: 'm', tone: 'good' },
               { k: L('lgTherefore', 'therefore'), v: '⌣  ' + L('lgCup', 'a cup'), tone: 'good' },
               { k: L('lgShape', 'so the shape is'), v: 'n×d' }],
        note: L('lgN3', 'The second contraction, and the same rule: m is repeated on the left, missing on the right, so it dies at a cup. Attention is two contractions with a softmax wedged between them — and you can prove that from the subscript strings alone, without looking at a single picture.') },
    ];

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', { class: 'ncd-fx' }, svg);
      const g = main, s = Math.max(0, Math.min(3, step)), S = STEPS[s], hot = S.hot;
      const LG = LEDGERS[s];
      lg.set(LG.rows.map((r) => ({ ...r, state: 'on' })), LG.note);
      const lit = (ch) => (hot.has(ch) ? 'ncde-idx-hot' : 'ncde-idx');

      // ── PANE 1 — the circuit ────────────────────────────────────────────────
      paneLbl(g, 20, 26, L('paneDiagram', 'the circuit'));
      const yA = 62, yB = 116, yM = 89;
      if (s <= 1) {                          // Q, K → cup(d) → scores
        G.chippedL(g, 96, yA, 'Q', 'ncde-L', 'ncde-L-txt', 40, 34);
        G.chippedL(g, 96, yB, 'K', 'ncde-L', 'ncde-L-txt', 40, 34);
        G.wire(g, 'ncde-w ncde-w-d', 118, yA, 268, yA);
        G.wire(g, 'ncde-w ncde-w-d', 118, yB, 268, yB);
        T(g, 168, yA - 10, 'n', lit('n'));  T(g, 196, yA - 10, 'd', lit('d'));
        T(g, 168, yB + 20, 'm', lit('m'));  T(g, 196, yB + 20, 'd', lit('d'));
        el('path', { class: 'ncde-w ncde-w-d', d: `M${268},${yA} Q${292},${yM} ${268},${yB}`, fill: 'none' }, g);
        G.cup(g, 296, yM, hot.has('d') ? 'ncde-op-hot' : 'ncde-op', 'ncde-op-dot');
        // +44, not +32: the K wire runs in at y=yB (116) and ends at x=268, and the label — centred on the
        // cup at x=296 — reaches back to x≈250, so at +32 the wire struck straight through its left third.
        if (hot.has('d')) T(g, 296, yM + 44, L('cupEats', 'the cup eats d'), 'ncde-cup-lbl');
        G.wire(g, 'ncde-w ncde-w-out', 312, yM, 396, yM, { arrow: true });
        R(g, 'ncde-chip', 400, yM - 15, 76, 30, 6);
        T(g, 424, yM + 5, 'S :', 'ncde-chipv');
        T(g, 452, yM + 5, 'n', lit('n')); T(g, 468, yM + 5, 'm', lit('m'));
      } else if (s === 2) {                  // scores → softmax across m → weights
        R(g, 'ncde-chip', 96, yM - 15, 76, 30, 6);
        T(g, 120, yM + 5, 'S :', 'ncde-chipv');
        T(g, 148, yM + 5, 'n', lit('n')); T(g, 164, yM + 5, 'm', lit('m'));
        G.wire(g, 'ncde-w ncde-w-attn', 176, yM, 250, yM);
        G.tri(g, 274, yM, 'ncde-sm', 'ncde-sm-txt');
        T(g, 274, yM + 34, L('acrossM', 'across m — not eaten'), 'ncde-cup-lbl');
        G.wire(g, 'ncde-w ncde-w-attn', 294, yM, 396, yM, { arrow: true });
        R(g, 'ncde-chip', 400, yM - 15, 76, 30, 6);
        T(g, 424, yM + 5, 'A :', 'ncde-chipv');
        T(g, 452, yM + 5, 'n', lit('n')); T(g, 468, yM + 5, 'm', lit('m'));
      } else {                               // A, V → cup(m) → context
        R(g, 'ncde-chip', 76, yA - 15, 76, 30, 6);
        T(g, 100, yA + 5, 'A :', 'ncde-chipv');
        T(g, 128, yA + 5, 'n', lit('n')); T(g, 144, yA + 5, 'm', lit('m'));
        R(g, 'ncde-chip', 76, yB - 15, 76, 30, 6);
        T(g, 100, yB + 5, 'V :', 'ncde-chipv');
        T(g, 128, yB + 5, 'm', lit('m')); T(g, 144, yB + 5, 'd', lit('d'));
        G.wire(g, 'ncde-w ncde-w-attn', 156, yA, 268, yA);
        G.wire(g, 'ncde-w ncde-w-d', 156, yB, 268, yB);
        el('path', { class: 'ncde-w ncde-w-d', d: `M${268},${yA} Q${292},${yM} ${268},${yB}`, fill: 'none' }, g);
        G.cup(g, 296, yM, 'ncde-op-hot', 'ncde-op-dot');
        T(g, 296, yM + 44, L('cupEatsM', 'the cup eats m'), 'ncde-cup-lbl');   // clear of the V wire at yB
        G.wire(g, 'ncde-w ncde-w-out', 312, yM, 396, yM, { arrow: true });
        R(g, 'ncde-chip', 400, yM - 15, 76, 30, 6);
        T(g, 424, yM + 5, 'Y :', 'ncde-chipv');
        T(g, 452, yM + 5, 'n', lit('n')); T(g, 468, yM + 5, 'd', lit('d'));
      }

      // ── PANE 2 — the einsum ─────────────────────────────────────────────────
      paneLbl(g, 20, 182, L('paneEinsum', 'the einsum'));
      R(g, 'ncde-code', 20, 194, W - 40, 44, 8);
      mono(g, 40, 222, S.ein, 'ncde-code-txt', 'ncde-code-hot', hot);

      // ── PANE 3 — the formula ────────────────────────────────────────────────
      paneLbl(g, 20, 264, L('paneFormula', 'the formula'));
      R(g, 'ncde-formula', 20, 276, W - 40, 44, 8);
      let x = 44;
      x = mono(g, x, 304, S.f1, 'ncde-f-txt', 'ncde-f-hot', hot);
      x = mono(g, x, 304, S.f2, 'ncde-f-txt', 'ncde-f-hot', new Set());
      x = mono(g, x, 304, S.f3, 'ncde-f-txt', 'ncde-f-hot', hot);
      x = mono(g, x, 304, S.f4, 'ncde-f-txt', 'ncde-f-hot', new Set());
      x = mono(g, x, 304, S.f5, 'ncde-f-txt', 'ncde-f-hot', hot);
      x = mono(g, x, 304, S.f6, 'ncde-f-txt', 'ncde-f-hot', new Set());
      x = mono(g, x, 304, S.f7, 'ncde-f-txt', 'ncde-f-hot', hot);
      T(g, W - 30, 304, L('same', 'the same statement'), 'ncde-same', 'end');
    };
  },
});
