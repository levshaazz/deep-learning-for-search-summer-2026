/* ncd-kvcache/logic.js — autoregressive decoding with a KV cache, in the NEURAL CIRCUIT DIAGRAM lens
   (Abbott & Zardini v2). Wires are tensor axes; a chipped rectangle is a learned projection; a dashed
   region is the cache made concrete. The whole widget exists to make ONE thing visible:

   THE AXIS THAT GROWS. The sequence axis n is not a constant — during decoding it grows by exactly one
   per step. Everything an inference engineer cares about follows from where that growth lands. The K
   and V rows computed on previous steps do not have to be recomputed: they are already sitting in the
   cache, so on a decode step the projections L_K / L_V run over a 1×d input, not an n×d one.

   HOW THE DIAGRAM ARGUES IT. In step 0 (prefill) every cached row has an L_K / L_V box in front of it —
   a fan of wires from the box into each row. In step 1 that fan is GONE for the old rows: they hang in
   the cache with an EMPTY gutter to their left, and only the single new row still has a box in front of
   it. The absence of the box is the saving; you can point at the empty space. Step 2 puts the boxes
   back, in red, to price what they would have cost: n+1 rows of K and V every step — the entire prefill,
   on every single token.

   WHICH AXIS IS EXPENSIVE, AND WHEN (the thing this widget must not get wrong). During PREFILL the query
   is an n-row block, so the full n×n score matrix really is materialised — that is where the MB/GB from
   data/ live, and the ledger prices them THERE, on step 0. During DECODING the query is ONE row: the
   scores are 1×(n+1) — kilobytes — and no n×n matrix is ever built (the figure already says so: one query
   wire enters attention, "over n+1 keys"). So at decode time the EXPENSIVE axis is the CACHE (2·n·d per
   layer per head — K *and* V, the two stacks in the picture — gigabytes, growing linearly) and the
   per-step attention is the CHEAP one. That inversion is the entire reason MQA / GQA / paged attention
   exist. Pricing a decode step at 25.8 GB — as this file once did — is wrong by ~32000×.

   NUMBERS. Only data/l15-attention.json → memory (heads=12, n=[512,4096,32768], mb512x12/mb4kx12/
   gb32kx12), fp16 (2 bytes/element — the strings SAY fp16, because at fp32 those figures double and a
   student would think the widget was lying). They size the n×n ATTENTION MATRIX at PREFILL across all
   heads — never the cache, never a decode step. The cache's own shape stays symbolic (2·n×d per layer per
   head): data/ has no layer count, so any byte figure for it would be an invented, un-gated number.

   Step 0 = prefill (where n×n is real) · 1 = one decode step (scores 1×(n+1)) · 2 = the trade.
   DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdKvcache = defineWidget({
  id: 'ncd-kvcache',
  rootClass: 'ncdk-root',
  exportName: 'mountNcdKvcache',
  maxStep: 2,
  render({ host, data, labels, el }) {
    const MEM = (data && data.memory) || {};
    const heads = MEM.heads != null ? MEM.heads : 12;
    const nList = MEM.n || [512, 4096, 32768];
    // the n×n ATTENTION matrix across all heads, fp16 — the PREFILL bill. NOT the cache, NOT a decode step.
    const attnSize = [
      MEM.mb512x12 != null ? MEM.mb512x12 : 6.3,   // fallbacks MIRROR data.memory.* — never a second source
      MEM.mb4kx12 != null ? MEM.mb4kx12 : 403,
      MEM.gb32kx12 != null ? MEM.gb32kx12 : 25.8,
    ];
    const L = (k, fb) => (labels && labels[k]) || fb;
    // the unit is a WORD, so it is translated: the ledger printed "GB" while the note beside it said "ГБ".
    const uMB = L('uMB', 'MB'), uGB = L('uGB', 'GB');
    const G = glyphs(el);

    const W = 880, H = 360;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdk-svg', viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': L('alt', 'Autoregressive decoding with a KV cache as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle0', 'prefill: the bill'));

    // ── geometry ───────────────────────────────────────────────────────────────
    const Y_IN = 140, X_IN = 30, X_BUS = 130;          // the token wire + the projection bus
    const BX = 190, BW = 46, BH = 40, B_R = BX + BW / 2, SUB_DY = 32;
    const Y_Q = 40;                                     // q lane (runs over the top to attention)
    const KY0 = 126, KY1 = 168, VY0 = 250, VY1 = 292;   // L_K / L_V centres: over the stack, then over the ONE new row
    const XS = 340, WS = 120, XS_R = XS + WS, RH = 13;  // the K / V row stacks
    const KT = [94, 111, 128, 145], K_NEW = 162;
    const VT = [218, 235, 252, 269], V_NEW = 286;
    const RX = 326, RY = 66, RW = 174, RH_R = 246;      // the cache region
    const AX = 660, AY = 160, AW = 124, AH = 60;        // attention
    const A_L = AX - AW / 2, A_R = AX + AW / 2;
    const rc = (top) => top + RH / 2;                   // a row's centre from its top

    // ── local glyph helpers (class contract lives in style.css) ────────────────
    const wire = (p, cls, x1, y1, x2, y2, opt) => G.wire(p, 'ncdk-w ' + cls, x1, y1, x2, y2, opt || {});
    const curve = (p, cls, d) => el('path', { class: 'ncdk-w ' + cls, d }, p);
    const arrowR = (p, cls, x, y) => el('path', { class: 'ncdk-w ' + cls, d: `M${x - 8},${y - 4} L${x},${y} L${x - 8},${y + 4}`, fill: 'none' }, p);
    const arrowD = (p, cls, x, y) => el('path', { class: 'ncdk-w ' + cls, d: `M${x - 4},${y - 8} L${x},${y} L${x + 4},${y - 8}`, fill: 'none' }, p);
    const rows = (p, tops, cls) => tops.forEach((t) => el('rect', { class: cls, x: XS, y: t, width: WS, height: RH, rx: 3 }, p));
    // a boxed word ON the read path. It MEASURES its text, so the box fits in every language at any size.
    const tag = (p, cx, cy, s) => G.tagBox(p, cx, cy + 4, s, 'ncdk-tag', 'ncdk-tag-txt', 8, 5);

    // ── the ledger. WHOSE bill it is, is the entire point. Step 0 prices the PREFILL — an n-row query, so
    //    the n×n matrix is genuinely built, and THAT is what the MB/GB from data/ measure. Step 1 prices ONE
    //    DECODE STEP — a 1-row query, so the scores are 1×(n+1): kilobytes, no n×n anywhere. Step 2 states
    //    the trade. The TITLE moves with the step: a ledger headed "cost of a step" with 25.8 GB under it is
    //    exactly how this widget used to misprice a decode step by ~32000×.
    const memRow = (i) => ({ k: `n×n · ${heads}h · n=${nList[i]}`,
      v: `${attnSize[i]} ${i === 2 ? uGB : uMB}`, state: 'new', tone: i === 2 ? 'cost' : undefined });
    function setLedger(step) {
      if (step === 0) {
        lg.setTitle(L('lgTitle0', 'prefill: the bill'));
        lg.set([
          { k: L('lgTok', 'new tokens this step'), v: 'n', state: 'new' },
          { k: L('lgComp', 'K,V rows computed'), v: 'n', state: 'new' },
          { k: L('lgScores', 'scores this step'), v: 'n×n', state: 'new' },
          memRow(0), memRow(1), memRow(2),
        ], L('lgN0', 'Prefill is the step that really does build the n×n matrix — in fp16, across 12 heads, 25.8 GB of it at n=32768. And every K and V row it makes is KEPT.'));
        return;
      }
      if (step === 1) {
        lg.setTitle(L('lgTitle1', 'one decode step'));
        lg.set([
          { k: L('lgTok', 'new tokens this step'), v: '1', state: 'new' },
          { k: L('lgComp', 'K,V rows computed'), v: '1', state: 'new', tone: 'good' },
          { k: L('lgRead', 'K,V rows read'), v: 'n', state: 'new' },
          { k: L('lgScores', 'scores this step'), v: '1×(n+1)', state: 'new', tone: 'good' },
          { k: L('lgAxis', 'sequence axis'), v: 'n → n+1', state: 'new' },
        ], L('lgN1', 'One token in, one K row and one V row out — the other n rows are read, not recomputed. And the query is ONE row, so the scores are one row too: 1×(n+1). No n×n matrix is built here.'));
        return;
      }
      lg.setTitle(L('lgTitle2', 'the trade'));
      lg.set([
        { k: L('lgComp', 'K,V rows computed'), v: '1', state: 'on', tone: 'good' },
        { k: L('lgRecomp', 'no cache: rows/step'), v: 'n+1', state: 'new', tone: 'cost' },
        { k: L('lgCache', 'cache / layer / head'), v: '2·n×d', state: 'new' },
        { k: L('lgScores', 'scores this step'), v: '1×(n+1)', state: 'on', tone: 'good' },
        { k: L('lgWork', 'scores over n steps'), v: 'n(n+1)/2', state: 'new' },
      ], L('lgN2', "What the cache buys is compute; what it costs is memory. It holds K AND V — 2·n·d per layer per head — and grows linearly with every token, forever: while you decode, THAT is the expensive axis. One step's scores are only 1×(n+1); they go quadratic only summed over the whole generation — n(n+1)/2."));
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ══ step 2 — the trade: one more token, with the cache and without it ═════
      if (step === 2) {
        const gc = el('g', { class: 'ncd-fx' }, main);
        G.text(gc, W / 2, 28, L('cfHead', 'one more token — with the cache, and without it'), 'ncdk-head');

        // the two rows share one x-grid, so the eye compares the GUTTER: empty above, full of boxes below
        const CB = 245, CB_L = CB - 28, CB_R = CB + 28;   // the projection column
        const CS = 315, CS_W = 120, CT = 470;             // the row stack · the annotation column

        // ── with the cache: n violet rows with NOTHING in front of them, one warm row that has a box
        el('rect', { class: 'ncdk-chip-ok', x: 24, y: 86, width: 100, height: 28, rx: 7 }, gc);
        G.text(gc, 74, 104, L('cfWith', 'with cache'), 'ncdk-chip-txt');
        [68, 85, 102, 119].forEach((t) => el('rect', { class: 'ncdk-row ncdk-row-dim', x: CS, y: t, width: CS_W, height: RH, rx: 3 }, gc));
        el('rect', { class: 'ncdk-row-new', x: CS, y: 136, width: CS_W, height: RH, rx: 3 }, gc);
        G.chippedL(gc, CB, 142, 'L_K,L_V', 'ncdk-box', 'ncdk-btxt-s', 56, 32);
        G.text(gc, CB, 170, '1×d', 'ncdk-sub');
        wire(gc, 'ncdk-w-new ncdk-w-thin', CB_R, 142, CS - 4, rc(136));
        G.text(gc, CT, 96, L('cfA1', '1 new row of K and V computed'), 'ncdk-good-txt', 'start');
        G.text(gc, CT, 116, L('cfA2', 'n rows read straight from the cache'), 'ncdk-good-txt', 'start');

        // ── without it: the boxes come back, one per row — the prefill, re-run on every token
        el('rect', { class: 'ncdk-chip-bad', x: 24, y: 248, width: 100, height: 28, rx: 7 }, gc);
        G.text(gc, 74, 266, L('cfWithout', 'no cache'), 'ncdk-chip-txt');
        G.text(gc, CB, 214, 'L_K,L_V × (n+1)', 'ncdk-cost-lbl');
        [224, 241, 258, 275, 292].forEach((t) => {
          el('rect', { class: 'ncdk-cost-box', x: CB_L, y: t, width: 56, height: RH, rx: 3 }, gc);
          el('rect', { class: 'ncdk-row-cost', x: CS, y: t, width: CS_W, height: RH, rx: 3 }, gc);
          wire(gc, 'ncdk-w-cost', CB_R, rc(t), CS - 4, rc(t));
        });
        G.text(gc, CT, 256, L('cfB1', 'all n+1 rows of K and V recomputed'), 'ncdk-bad-txt', 'start');
        G.text(gc, CT, 276, L('cfB2', 'the whole prefill, on every single token'), 'ncdk-bad-txt', 'start');

        // ── the inversion, in two lines. During decoding the CACHE is the expensive axis (gigabytes, K and
        //    V both) and the per-step attention is the cheap one (one query row → 1×(n+1) scores, kilobytes).
        G.text(gc, W / 2, 322, L('cfLine1', 'the cache holds K and V — 2·n×d per layer per head, growing every step: the EXPENSIVE axis'), 'ncdk-punch-v');
        G.text(gc, W / 2, 342, L('cfLine2', "a step's scores are just 1×(n+1) — kilobytes: the CHEAP axis (quadratic only summed over the run)"), 'ncdk-punch-i');
        prev = step;
        return;
      }

      // ══ steps 0 & 1 — prefill, then one decode step ═══════════════════════════
      const dec = step === 1;
      const kBoxY = dec ? KY1 : KY0, vBoxY = dec ? VY1 : VY0;
      const shape = dec ? '(n+1)×d' : 'n×d';
      const g0 = el('g', { class: fresh(0) }, main);

      // the token wire: beads on a wire. Prefill carries n of them; a decode step carries exactly one.
      // A bead is THREADED on the token wire — that is the glyph — so it declares `ncd-onwire`: the wire
      // running through it is the notation working, not a wire that failed to route around a box.
      G.text(g0, X_IN, 124, dec ? L('lblIn1', '1 new token') : L('lblIn0', 'prompt · n'),
        dec ? 'ncdk-in ncdk-in-new' : 'ncdk-in', 'start');
      G.text(g0, X_IN + 4, 160, dec ? '1×d' : 'n×d', 'ncdk-sub', 'start');
      wire(g0, 'ncdk-w-tok', X_IN, Y_IN, X_BUS, Y_IN);
      (dec ? [92] : [38, 56, 74, 92]).forEach((x) =>
        el('rect', { class: (dec ? 'ncdk-bead-new' : 'ncdk-bead') + ' ncd-onwire',
          x, y: Y_IN - 7, width: 14, height: 14, rx: 3 }, g0));

      // the projection bus: the SAME token vector feeds L_Q, L_K, L_V
      wire(g0, 'ncdk-w-bus', X_BUS, Y_Q, X_BUS, vBoxY);
      [Y_Q, kBoxY, vBoxY].forEach((y) => {
        el('circle', { cx: X_BUS, cy: y, r: 3, fill: 'var(--accent, #2A6FDB)' }, g0);
        wire(g0, 'ncdk-w-bus ncdk-w-thin', X_BUS, y, BX - BW / 2, y);
      });

      // L_Q — the query is never cached: it is used once, this step, and thrown away
      G.chippedL(g0, BX, Y_Q, 'L_Q', 'ncdk-box', 'ncdk-btxt', BW, BH);
      G.text(g0, BX, Y_Q + SUB_DY, dec ? '1×d' : 'n×d', 'ncdk-sub');
      wire(g0, dec ? 'ncdk-w-new' : 'ncdk-w-tok', B_R, Y_Q, AX - 20, Y_Q);
      wire(g0, dec ? 'ncdk-w-new' : 'ncdk-w-tok', AX - 20, Y_Q, AX - 20, AY - AH / 2);
      arrowD(g0, dec ? 'ncdk-w-new' : 'ncdk-w-tok', AX - 20, AY - AH / 2);

      // the cache itself: two stacks of rows inside a dashed violet region
      const gCache = el('g', { class: fresh(0) }, main);
      G.region(gCache, RX, RY, RW, RH_R, L('tagCache', 'KV cache'), 'ncdk-region', 'ncdk-tag', 'ncdk-tag-txt');
      rows(gCache, KT, 'ncdk-row' + (dec ? ' ncdk-row-dim' : ''));
      rows(gCache, VT, 'ncdk-row' + (dec ? ' ncdk-row-dim' : ''));
      G.text(gCache, XS + WS / 2, 88, 'K   ' + shape, 'ncdk-axis');
      G.text(gCache, XS + WS / 2, 212, 'V   ' + shape, 'ncdk-axis');
      // TWO stacks — so the cache is 2·n×d, not n×d. The ledger row says the same thing; this is where you SEE it.
      G.text(gCache, RX + RW / 2, 328, L('lblCacheTot', 'K + V  →  2·n×d / layer / head'), 'ncdk-axis');

      // L_K / L_V. Step 0: one box per stack, its output fanning into EVERY row (the prefill did the work).
      // Step 1: the box has slid down onto the ONE new row — and the gutter in front of the old rows is EMPTY.
      const gK = el('g', { class: fresh(0) }, main);
      G.chippedL(gK, BX, kBoxY, 'L_K', 'ncdk-box', 'ncdk-btxt', BW, BH);
      G.text(gK, BX, kBoxY + SUB_DY, dec ? '1×d' : 'n×d', 'ncdk-sub');
      G.chippedL(gK, BX, vBoxY, 'L_V', 'ncdk-box', 'ncdk-btxt', BW, BH);
      G.text(gK, BX, vBoxY + SUB_DY, dec ? '1×d' : 'n×d', 'ncdk-sub');

      if (!dec) {
        KT.forEach((t) => wire(gK, 'ncdk-w-tok ncdk-w-thin', B_R, KY0, XS - 4, rc(t)));
        VT.forEach((t) => wire(gK, 'ncdk-w-tok ncdk-w-thin', B_R, VY0, XS - 4, rc(t)));
      } else {
        const gN = el('g', { class: fresh(1) }, main);
        // exactly one new k row and one new v row — the only work this step does
        el('rect', { class: 'ncdk-row-new', x: XS, y: K_NEW, width: WS, height: RH, rx: 3 }, gN);
        el('rect', { class: 'ncdk-row-new', x: XS, y: V_NEW, width: WS, height: RH, rx: 3 }, gN);
        wire(gN, 'ncdk-w-new ncdk-w-thin', B_R, KY1, XS - 4, rc(K_NEW));
        wire(gN, 'ncdk-w-new ncdk-w-thin', B_R, VY1, XS - 4, rc(V_NEW));
        G.text(gN, XS_R + 14, rc(K_NEW) + 4, '+1', 'ncdk-plus1', 'start');
        G.text(gN, XS_R + 14, rc(V_NEW) + 4, '+1', 'ncdk-plus1', 'start');
        // THE POINT: nothing stands in front of the cached rows. No box, no wire — nothing runs here.
        G.text(gN, 276, 126, L('lblNoBox', 'not recomputed'), 'ncdk-nobox');
        G.text(gN, 276, 250, L('lblNoBox', 'not recomputed'), 'ncdk-nobox');
        tag(gN, 540, 116, L('tagRead', 'read'));
        tag(gN, 540, 264, L('tagRead', 'read'));
      }

      // the whole cache is read into attention — every row, every step
      const gA = el('g', { class: fresh(0) }, main);
      curve(gA, 'ncdk-w-read', `M${XS_R},${KY0} C520,${KY0} 545,138 ${A_L},150`);
      curve(gA, 'ncdk-w-read', `M${XS_R},${VY0} C520,${VY0} 545,196 ${A_L},172`);
      arrowR(gA, 'ncdk-w-read', A_L, 150);
      arrowR(gA, 'ncdk-w-read', A_L, 172);
      G.box(gA, AX, AY, AW, AH, L('lblAttn', 'attention'),
        dec ? L('subAttn1', 'over n+1 keys') : L('subAttn0', 'over n keys'), 'ncdk-op', 'ncdk-op-txt', 'ncdk-sub');
      // THE SHAPE OF THE SCORES, said out loud under the block. Prefill: an n-row query → a real n×n matrix
      // (that is what the MB/GB in the ledger measure). Decode: ONE query row in — so 1×(n+1), and nothing else.
      G.text(gA, AX, AY + AH / 2 + 26, dec ? L('shpScores1', 'scores  1×(n+1)') : L('shpScores0', 'scores  n×n'),
        dec ? 'ncdk-scores ncdk-scores-new' : 'ncdk-scores');
      wire(gA, 'ncdk-w-out', AX + AW / 2, AY, 840, AY, { arrow: true });
      G.text(gA, 840, AY - 14, L('lblOut', 'next token'), 'ncdk-out-txt', 'end');

      G.legend(main, W / 2, 352, L('legMap', 'violet = cached K,V (read) · warm = computed this step · the n axis grows by 1'), 'ncdk-legend', W - 40);
      prev = step;
    };
  },
});
