/* ncd-multihead/logic.js — multi-head attention in the NEURAL CIRCUIT DIAGRAM lens (Abbott & Zardini
   v2). Most explanations wave a hand at "and then we do it h times, in parallel" and move on. This
   widget refuses: it draws the heads as h literal COPIES of one circuit, then draws the two glyphs
   that put the axis back — the concat HEXAGON (a reindex) and the output projection L_O (a chipped
   rectangle, a learned op).

   THE ONE THING THIS WIDGET ARGUES. Heads do not ADD dimension — they SPLIT it. From
   data/l15-attention.json: m = params.d = 768 and h = memory.heads = 12, so d_head = m/h = 64. A head
   never sees the model's whole width; it sees a 64-dimensional strip of it. And concat is not glue for
   convenience: h · d_head = 12 · 64 = 768 = m, EXACTLY — the precise inverse of the split. That identity
   is why multi-head costs the same as single-head. The counterfactual sits in the ledger, in red: had
   each head kept all m dims, the head axis would have cost h·m = 9216 — twelve times the work.

   Step 0 = ONE head (project into n×d_head, NOT n×m) · 1 = h heads as h literal copies, the broadcast
   made concrete · 2 = concat (hexagon) + L_O → back to n×m.

   Colour = meaning (course contract): --accent the token wire x · --warm attention · --c-violet the
   head axis h (the broadcast) and its n×64 slices · --c-cyan the concat/reindex and the restored m
   axis · --c-green the output and the identity h·d_head = m · --c-red ONLY the cost of the road not
   taken (ledger). DRIVER-AGNOSTIC, COLLISION-FREE (the ledger is HTML, so it cannot collide by
   construction). */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdMultihead = defineWidget({
  id: 'ncd-multihead',
  rootClass: 'ncdm-root',
  exportName: 'mountNcdMultihead',
  maxStep: 2,
  render({ host, data, labels, el }) {
    // ── the only numbers in the widget, both from data/l15-attention.json ──────
    const P = (data && data.params) || {};
    const MEM = (data && data.memory) || {};
    const d = P.d != null ? P.d : 768;                 // m — the model width
    const heads = MEM.heads != null ? MEM.heads : 12;  // h
    const dHead = heads ? Math.round(d / heads) : d;   // d_head = m/h — DERIVED, never invented
    const ifAdded = heads * d;                         // the road not taken: h·m
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);

    const W = 880, H = 340;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdm-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Multi-head attention as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'width & heads'));

    // ── geometry ──────────────────────────────────────────────────────────────
    const xIn = 22, xBus = 72;
    // step 0 — one head, opened up (+ the model's width drawn as h strips, one of them this head's)
    const S0 = { rows: [104, 175, 246], yM: 175, xL: 140, wL: 56, xAttn: 392, wAttn: 200, xEnd: 628,
                 xBar: 640, wBar: 216 };
    // steps 1–2 — h copies, then the merge
    const S1 = { rows: [104, 170, 262], yEl: 224, yM: 183, xHead: 248, wHead: 214,
                 xSlice: 486, xHex: 600, xLo: 720, xOut: 845 };

    const size = (p, x, y, s) => G.text(p, x, y, s, 'ncdm-size');

    // ── the ledger: the split-not-add argument, counted ───────────────────────
    function setLedger(step) {
      const on = (k) => (step > k ? 'on' : step === k ? 'new' : 'off');
      const rows = [
        { k: `m · ${L('lgWidth', 'model width')}`, v: String(d), state: 'on' },
        { k: `h · ${L('lgHeads', 'heads')}`, v: String(heads), state: 'on' },
        { k: 'd_head = m/h', v: String(dHead), state: on(0) },
        { k: L('lgPerHead', 'per head'), v: `n×${dHead}`, state: on(0) },
      ];
      if (step >= 1) rows.push({ k: `× h ${L('lgCopies', 'copies')}`, v: `${heads} × (n×${dHead})`, state: on(1) });
      if (step >= 2) {
        rows.push({ k: L('lgAfterCat', 'after concat'), v: `n×${d}`, state: 'new', tone: 'good' });
        rows.push({ k: 'h · d_head', v: `${heads}·${dHead} = ${d}`, state: 'new', tone: 'good' });
        rows.push({ k: L('lgIfAdded', 'if heads ADDED width'), v: `h·m = ${ifAdded}`, state: 'new', tone: 'cost' });
      }
      const notes = [
        L('lgN0', `A head does not get its own m. It gets m/h = ${dHead} — one twelfth of the width.`),
        L('lgN1', `h heads are not h models: the SAME ${d} dims, cut into ${heads} strips of ${dHead}.`),
        L('lgN2', `Concat is the inverse of the split: ${heads}·${dHead} = ${d} = m. Nothing was added — the width was folded, then unfolded.`),
      ];
      lg.set(rows, notes[Math.min(step, 2)]);
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ── STEP 0 — one head, honestly: the projections land in n×d_head, not n×m ──
      if (step === 0) {
        const g = el('g', { class: fresh(0) }, main);
        const { rows, yM, xL, wL, xAttn, wAttn, xEnd, xBar, wBar } = S0;

        // the backdrop that names what we are looking at (wide → never a collision candidate)
        el('rect', { class: 'ncdm-back', x: 104, y: 70, width: 500, height: 218, rx: 12 }, g);
        G.text(g, 112, 64, L('lblOneHead', 'one head'), 'ncdm-back-txt', 'start');

        // the insight, stated on the diagram itself — pure arithmetic, so it needs no translation.
        // The callout MEASURES its own text: a box sized from a character count breaks at the next font-size.
        G.tagBox(g, 430, 48, `d_head = m/h = ${d}/${heads} = ${dHead}`,
          'ncdm-callout', 'ncdm-callout-txt', 13, 7).setAttribute('rx', 7);

        // x (n×m) enters and fans out to the three learned projections
        G.text(g, xIn - 4, yM - 14, L('lblIn', 'x  (n×m)'), 'ncdm-axis ncdm-axis-in', 'start');
        G.wire(g, 'ncdm-w ncdm-w-in', xIn, yM, xBus, yM);
        G.wire(g, 'ncdm-w ncdm-w-in', xBus, rows[0], xBus, rows[2]);
        ['Lq', 'Lk', 'Lv'].forEach((nm, i) => {
          const y = rows[i];
          G.wire(g, 'ncdm-w ncdm-w-in', xBus, y, xL - wL / 2, y);
          G.chippedL(g, xL, y, nm, 'ncdm-L', 'ncdm-L-txt', wL, 44);
          // out of a projection the vector is ALREADY narrow: n×d_head, not n×m
          G.wire(g, 'ncdm-w ncdm-w-attn', xL + wL / 2, y, 252, y);
          size(g, 210, y - 9, `${nm[1].toUpperCase()} · n×${dHead}`);
          // bundle the three into the attention box
          el('path', { class: 'ncdm-w ncdm-w-attn',
            d: `M252,${y} C274,${y} 272,${yM} ${xAttn - wAttn / 2},${yM}` }, g);
        });

        G.box(g, xAttn, yM, wAttn, 64, L('lblAttn', 'attention'), 'softmax(QKᵀ/√dₖ)·V',
          'ncdm-attn', 'ncdm-attn-txt', 'ncdm-sub');

        // one head's output — a 64-wide slice of the model's width
        G.wire(g, 'ncdm-w ncdm-w-slice', xAttn + wAttn / 2, yM, xEnd, yM, { arrow: true });
        G.text(g, 540, 163, L('lblHeadOut', 'head output'), 'ncdm-axis ncdm-axis-slice');
        size(g, 540, 196, `n×${dHead}`);

        // THE POINT, drawn rather than asserted: the model's width IS h strips of d_head. The head we
        // just built owns exactly ONE of them — it did not add a dimension, it was handed a twelfth.
        const cw = wBar / heads, yBar = yM - 13;
        for (let i = 0; i < heads; i++) {
          el('rect', { class: 'ncdm-strip' + (i === 0 ? ' is-mine' : ''),
            x: xBar + i * cw, y: yBar, width: cw, height: 26 }, g);
        }
        size(g, xBar + wBar / 2, yBar - 12, `m = ${d} = ${heads} × ${dHead}`);
        G.text(g, xBar + wBar / 2, yBar + 42, L('lblOneOf', `one head = 1 strip of ${heads}`),
          'ncdm-axis ncdm-axis-slice');

        G.text(g, W / 2, H - 8, L('legMap', 'wire = axis · ▭ = learned projection · box = operation'), 'ncdm-legend');
        prev = step;
        return;
      }

      // ── STEPS 1–2 — h literal copies, then the merge that undoes the split ────
      const { rows, yEl, yM, xHead, wHead, xSlice, xHex, xLo, xOut } = S1;
      const gH = el('g', { class: fresh(1) }, main);

      // the head axis h, made concrete: a dashed region around h copies of the SAME circuit
      G.region(gH, 106, 64, 404, 232, `h = ${heads} — ${L('tagHeads', 'the same circuit, copied')}`,
        'ncdm-region', 'ncdm-region-tag', 'ncdm-region-txt');

      // the same x (n×m) is broadcast into every copy
      G.text(gH, xIn - 4, yM - 14, L('lblIn', 'x  (n×m)'), 'ncdm-axis ncdm-axis-in', 'start');
      G.wire(gH, 'ncdm-w ncdm-w-in', xIn, yM, xBus, yM);
      G.wire(gH, 'ncdm-w ncdm-w-in', xBus, rows[0], xBus, rows[2]);

      const headNo = [1, 2, heads];
      rows.forEach((y, i) => {
        G.wire(gH, 'ncdm-w ncdm-w-in', xBus, y, xHead - wHead / 2, y);
        G.box(gH, xHead, y, wHead, 48, `${L('lblHead', 'head')} ${headNo[i]}`, 'Lq Lk Lv · σ',
          'ncdm-attn', 'ncdm-attn-txt', 'ncdm-sub');
        // every copy emits its own slice — n×d_head, never n×m
        G.wire(gH, 'ncdm-w ncdm-w-slice', xHead + wHead / 2, y, xSlice, y, { arrow: step === 1 });
        size(gH, 420, y - 10, `n×${dHead}`);
      });

      // the elision: the heads we did not draw are still there
      G.text(gH, xHead, yEl, '⋮', 'ncdm-dots');
      G.text(gH, xHead + 70, yEl + 3, `× h = ${heads}`, 'ncdm-dots-lbl');
      G.text(gH, 420, yEl, '⋮', 'ncdm-dots');

      // h slices, and nowhere to put them — the empty right half IS the question step 2 answers
      if (step === 1) G.text(gH, 690, yM - 4, L('askBack', 'h slices — now put the axis back'), 'ncdm-hook');

      // ── step 2: concat (a reindex) + L_O (a learned op) put the axis back ─────
      if (step >= 2) {
        const gC = el('g', { class: fresh(2) }, main);
        rows.forEach((y) => {
          el('path', { class: 'ncdm-w ncdm-w-slice',
            d: `M${xSlice},${y} C${xSlice + 34},${y} ${xHex - 78},${yM} ${xHex - 45},${yM}` }, gC);
        });
        // the omitted heads join too
        el('path', { class: 'ncdm-w ncdm-w-ghost',
          d: `M445,${yEl} C505,${yEl} ${xHex - 80},${yM + 3} ${xHex - 45},${yM}` }, gC);

        G.hexagon(gC, xHex, yM, L('lblConcat', 'concat'), 'ncdm-hex', 'ncdm-hex-txt', 52, 32);

        // THE identity: concat is the exact inverse of the split — h·d_head lands back ON m, not past it
        G.tagBox(gC, xHex, yM + 57, `${heads} × ${dHead} = ${d} = m`,
          'ncdm-eq', 'ncdm-eq-txt', 12, 7).setAttribute('rx', 7);

        // the m axis is back — n×768 — and L_O mixes it
        G.wire(gC, 'ncdm-w ncdm-w-cat', xHex + 45, yM, xLo - 28, yM);
        size(gC, 668, yM - 12, `n×${d}`);
        G.chippedL(gC, xLo, yM, 'Lo', 'ncdm-L', 'ncdm-L-txt', 56, 44);
        size(gC, xLo, yM - 35, 'm → m');
        G.wire(gC, 'ncdm-w ncdm-w-out', xLo + 28, yM, xOut, yM, { arrow: true });
        G.text(gC, 800, yM - 12, `${L('lblOut', 'out')} · n×m`, 'ncdm-axis ncdm-axis-out');
      }

      G.text(main, W / 2, H - 8, step >= 2
        ? L('legCat', '⬡ = concat: a reindex, not a computation · ▭ = learned projection · dashed = the head axis h')
        : L('legHeads', 'each head box is the circuit above, copied — same recipe, its own weights'), 'ncdm-legend');
      prev = step;
    };
  },
});
