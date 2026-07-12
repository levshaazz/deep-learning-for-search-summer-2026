/* ncd-causal/logic.js — the CAUSAL MASK in the neural-circuit-diagram lens (Abbott & Zardini v2).

   WHAT THIS WIDGET ARGUES. The mask is not a training detail; it is a GLYPH. In this notation it is
   the reindex/slice HEXAGON that sits between the scores and the softmax triangle, and its absence is
   as visible as a missing gear. Without it the query at t₂ scores the key t₃ — the very token it is
   being trained to predict — and softmax(0, 2, 3) hands 0.705 of its attention straight to the answer
   (data/l15-attention.json → causal.noMask). That is not a bug you find in a loss curve; it is a LEAK
   you can point at, because the hexagon isn't there. Insert it, send j > i to −∞, and softmax
   renormalises over the allowed keys only: [0.119, 0.881] (causal.masked). Green.

   WHAT THE LAST STEP ARGUES. Zoom out to the n×n score matrix and the mask blacks out the strictly
   upper triangle — about half the square. But the tensor was allocated n×n BEFORE the mask touched it,
   and a −∞ costs exactly as many bytes as any other float: n=32768 with 12 heads is still 25.8 GB
   (data/l15-attention.json → memory). You pay for the whole square and use half of it.

   Step 0 = no mask, the leak · 1 = insert the hexagon · 2 = the n×n picture and the bill.
   DRIVER-AGNOSTIC (setStep/maxStep). ON-BRAND (--accent tokens, --warm attention, --c-cyan the mask op,
   --c-green the masked result, --c-violet the allocated axis, --c-red ONLY the leak). COLLISION-FREE
   (detector-verified across ru/en/tt): the ledger is HTML, so it cannot collide with the diagram. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdCausal = defineWidget({
  id: 'ncd-causal',
  rootClass: 'ncdc-root',
  exportName: 'mountNcdCausal',
  maxStep: 2,
  render({ host, data, labels, el }) {
    const C = (data && data.causal) || {};
    const MEM = (data && data.memory) || {};
    const scores = C.scores || [0, 2, 3];          // q·kⱼ for j = t₁, t₂, t₃
    const noMask = C.noMask || [0.035, 0.259, 0.705];
    const masked = C.masked || [0.119, 0.881];     // softmax over the ALLOWED keys only
    const heads = MEM.heads != null ? MEM.heads : 12;
    const nList = MEM.n || [512, 4096, 32768];
    const memList = [MEM.mb512x12, MEM.mb4kx12, MEM.gb32kx12];
    const L = (k, fb) => (labels && labels[k]) || fb;
    const T = (k, fb, v) => String(L(k, fb)).replace('{v}', v);
    const G = glyphs(el);
    const F = G.fmt3;

    const W = 820, H = 260;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdc-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'The causal mask as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the leak & the bill'));

    // ── geometry: one query row, left to right. The mask slot is at xMask — filled in step 1,
    //    EMPTY (a dashed ghost) in step 0, which is the whole point. ────────────────────────────
    const yQ = 98, yK = 158, yS = 128;
    const xTok = 22, xQK = 118;
    const scC = [176, 212, 248], xMask = 316, infC = [396, 438, 482];
    const xSM = 546, wtC = [618, 682, 746];
    const KEY = ['t₁', 't₂', 't₃'];

    const wire = (p, cls, x1, y1, x2, y2) => G.wire(p, 'ncdc-w ' + cls, x1, y1, x2, y2);
    const txt = (p, x, y, s, cls, anchor) => G.text(p, x, y, s, cls, anchor || 'middle');
    function chip(p, cx, y, w, val, boxCls, txtCls) {
      el('rect', { class: 'ncdc-chip ' + boxCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, p);
      txt(p, cx, y + 4, val, 'ncdc-chipv ' + (txtCls || ''));
    }
    /* a badge whose width is MEASURED from its text (G.tagBox), never guessed from its character count —
       the guess is wrong in Cyrillic and wrong again at any other font-size, and this badge carries the
       verdict. It is then pulled back inside the frame if the measured box would run off the right edge. */
    function badge(p, cx, cy, s, boxCls, txtCls) {
      const gg = el('g', {}, p);
      const r = G.tagBox(gg, cx, cy + 4, s, 'ncdc-badge ' + boxCls, txtCls, 11, 8);
      r.setAttribute('rx', 7);
      const x = +r.getAttribute('x'), w = +r.getAttribute('width');
      const dx = Math.min(0, (W - 10) - (x + w));      // never past the right edge of the frame
      if (dx) {
        r.setAttribute('x', x + dx);
        const t = gg.querySelector('text');
        t.setAttribute('x', +t.getAttribute('x') + dx);
      }
    }

    // ── the ledger: the leak in red, the fix in green, the bill in plain ink ───────────────────
    const uMB = L('uMB', 'MB'), uGB = L('uGB', 'GB');
    function setLedger(step) {
      if (step === 2) {
        const rows = [
          { k: L('lgLeak', 'w(t₃) with no mask'), v: F(noMask[2]), state: 'on', tone: 'cost' },
          { k: L('lgFixed', 'w(t₃) with the mask'), v: '0', state: 'on', tone: 'good' },
          { k: L('lgKept', 'kept (j ≤ i)'), v: L('lgHalf', '≈ half'), state: 'new' },
          { k: L('lgPaid', 'allocated'), v: 'n × n', state: 'new' },
        ];
        for (let i = 0; i < 3; i++) {
          rows.push({ k: `n=${nList[i]} · h=${heads}`, v: `${memList[i]} ${i === 2 ? uGB : uMB}`, state: 'new' });
        }
        lg.set(rows, L('lgN2', 'The mask throws away half the matrix — and the allocation keeps all of it. O(n²) is paid in full.'));
        return;
      }
      const rows = [
        { k: L('lgScores', 'scores q·kⱼ'), v: scores.join(', '), state: step === 0 ? 'new' : 'on' },
      ];
      if (step === 0) {
        rows.push({ k: 'w(t₁)', v: F(noMask[0]), state: 'new' });
        rows.push({ k: 'w(t₂)', v: F(noMask[1]), state: 'new' });
        rows.push({ k: `w(t₃) — ${L('lgFuture', 'the future')}`, v: F(noMask[2]), state: 'new', tone: 'cost' });
        lg.set(rows, T('lgN0', 'No hexagon, no mask: {v} of the attention lands on t₃ — the token the model is supposed to be predicting. It is reading the answer.', F(noMask[2])));
        return;
      }
      rows.push({ k: L('lgMask', 'mask: j ≤ i'), v: L('lgHex', 'hexagon'), state: 'new' });
      rows.push({ k: `w(t₃) — ${L('lgForbidden', 'forbidden')}`, v: '0', state: 'new', tone: 'good' });
      rows.push({ k: 'w(t₁)', v: F(masked[0]), state: 'new', tone: 'good' });
      rows.push({ k: 'w(t₂)', v: F(masked[1]), state: 'new', tone: 'good' });
      lg.set(rows, L('lgN1', 'The disallowed score goes to −∞, so exp(−∞) = 0: the future gets exactly zero weight and softmax renormalises over the past.'));
    }

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const fresh = (k) => (k > prev && k <= step ? 'ncd-fx' : '');
      setLedger(step);

      // ── step 2: the same mask, seen as the whole n×n matrix ─────────────────────
      if (step === 2) {
        const g = el('g', { class: 'ncd-fx' }, main);
        txt(g, W / 2, 22, L('hd2', 'the same mask, seen as the whole n×n matrix'), 'ncdc-head');

        const x0 = 150, y0 = 56, cs = 46;
        txt(g, x0 + 1.5 * cs, 32, L('gridKeys', 'keys  j →'), 'ncdc-tag');
        txt(g, x0 - 12, y0 - 10, L('gridQueries', 'queries i'), 'ncdc-tag', 'end');
        KEY.forEach((k, j) => txt(g, x0 + j * cs + cs / 2, y0 - 10, k, 'ncdc-key'));
        for (let i = 0; i < 3; i++) {
          txt(g, x0 - 12, y0 + i * cs + cs / 2 + 5, KEY[i], 'ncdc-key', 'end');
          for (let j = 0; j < 3; j++) {
            const cx = x0 + j * cs + cs / 2, cy = y0 + i * cs + cs / 2;
            const allowed = j <= i;
            const isLeak = (i === 1 && j === 2);           // the very cell that leaked 0.705
            const cls = allowed ? 'ncdc-cell-ok' : isLeak ? 'ncdc-cell-leak' : 'ncdc-cell-no';
            el('rect', { class: cls, x: x0 + j * cs, y: y0 + i * cs, width: cs, height: cs }, g);
            // row t₂ is the row we actually computed in steps 0–1 → it carries the real scores
            const v = allowed ? (i === 1 ? String(scores[j]) : '·') : '−∞';
            const vc = allowed ? (i === 1 ? 'ncdc-cell-txt' : 'ncdc-cell-dot') : 'ncdc-cell-txt-no';
            txt(g, cx, cy + 5, v, vc);
          }
        }
        el('rect', { class: 'ncdc-rowhi', x: x0 - 4, y: y0 + cs - 4, width: 3 * cs + 8, height: cs + 8, rx: 6 }, g);
        txt(g, x0 + 1.5 * cs, y0 + 3 * cs + 20, L('gridRow', 'row t₂ — the row we just computed'), 'ncdc-lbl');
        txt(g, x0 + 1.5 * cs, y0 + 3 * cs + 38,
          T('gridLeak', 'the red cell is where {v} of the attention went', F(noMask[2])), 'ncdc-red-txt');

        // the bill you still pay — the n×n tensor is allocated BEFORE the mask touches it
        const xP = 396, chipX = 700;
        txt(g, xP, y0, T('memHead', 'memory for the FULL n×n (h={v})', heads), 'ncdc-head', 'start');
        [92, 126, 160].forEach((y, i) => {
          txt(g, xP + 4, y + 4, `n = ${nList[i]}`, 'ncdc-lbl', 'start');
          chip(g, chipX, y, 104, `${memList[i]} ${i === 2 ? uGB : uMB}`, 'ncdc-mem-chip', 'ncdc-mem-txt');
        });
        txt(g, xP, 194, L('memKept', 'used: j ≤ i — about half of it'), 'ncdc-good-txt', 'start');
        txt(g, xP, 216, L('memPaid', 'allocated: every cell, all n²'), 'ncdc-vio-txt', 'start');
        txt(g, W / 2, H - 6, L('legGrid', 'the mask changes what softmax SEES — not what memory ALLOCATES'), 'ncdc-legend');
        prev = step;
        return;
      }

      const masked1 = step >= 1;

      // ── A. q and K contract d → the three scores are born ──────────────────────
      const gA = el('g', { class: fresh(0) }, main);
      txt(gA, xTok, yQ - 12, L('lblQ', 'q  at t₂'), 'ncdc-axis', 'start');
      wire(gA, 'ncdc-w-in', xTok, yQ, xQK - 18, yQ);
      wire(gA, 'ncdc-w-in', xTok, yK, xQK - 18, yK);
      txt(gA, xTok, yK + 22, L('lblK', 'K  t₁ t₂ t₃'), 'ncdc-axis', 'start');
      el('path', { class: 'ncdc-w ncdc-w-in', d: `M${xQK - 18},${yQ} Q${xQK - 1},${yS} ${xQK - 18},${yK}` }, gA);
      G.cup(gA, xQK, yS, 'ncdc-op', 'ncdc-op-dot');
      txt(gA, xQK, yS - 24, 'q·Kᵀ', 'ncdc-size');
      wire(gA, 'ncdc-w-attn', xQK + 15, yS, scC[0] - 20, yS);
      scC.forEach((cx, j) => {
        chip(gA, cx, yS, 30, String(scores[j]), 'ncdc-chip-sc');
        const hot = !masked1 && j === 2;
        txt(gA, cx, yS - 20, KEY[j], 'ncdc-key' + (hot ? ' ncdc-key-leak' : masked1 && j === 2 ? ' ncdc-key-off' : ''));
      });
      if (!masked1) txt(gA, scC[2], yS - 38, L('lblFuture', 'the future'), 'ncdc-red-txt');

      // ── B. the mask slot: a hexagon in step 1, a HOLE in step 0 ────────────────
      if (!masked1) {
        const gG = el('g', { class: fresh(0) }, main);
        wire(gG, 'ncdc-w-attn', scC[2] + 15, yS, xSM - 18, yS);   // the wire runs straight through
        G.hexagon(gG, xMask, yS, '', 'ncdc-hex-ghost', '', 26, 20);
        txt(gG, xMask, yS + 36, L('noMaskTag', 'no mask — nothing is removed'), 'ncdc-lbl');
      } else {
        const gM = el('g', { class: fresh(1) }, main);
        wire(gM, 'ncdc-w-attn', scC[2] + 15, yS, xMask - 26, yS);
        G.hexagon(gM, xMask, yS, L('lblMask', 'mask'), 'ncdc-hex', 'ncdc-hex-txt', 26, 20);
        txt(gM, xMask, yS - 32, L('maskCond', 'keep j ≤ i'), 'ncdc-lbl');
        wire(gM, 'ncdc-w-attn', xMask + 26, yS, infC[0] - 22, yS);
        infC.forEach((cx, j) => {
          const off = j === 2;
          chip(gM, cx, yS, 38, off ? '−∞' : String(scores[j]),
            off ? 'ncdc-chip-inf' : 'ncdc-chip-sc', off ? 'ncdc-chipv-off' : '');
        });
        txt(gM, infC[1], yS - 20, L('lblMasked', 'masked scores'), 'ncdc-lbl');
        wire(gM, 'ncdc-w-attn', infC[2] + 19, yS, xSM - 18, yS);
      }

      // ── C. softmax → the weights. Step 0 leaks; step 1 is green. ───────────────
      const gC = el('g', { class: fresh(masked1 ? 1 : 0) }, main);
      G.tri(gC, xSM, yS, 'ncdc-sm', 'ncdc-sm-txt');
      txt(gC, xSM, yS + 32, L('lblSoftmax', 'softmax'), 'ncdc-size');
      wire(gC, 'ncdc-w-attn', xSM + 18, yS, wtC[0] - 28, yS);
      wtC.forEach((cx, j) => {
        let val, boxCls, txtCls;
        if (!masked1) {
          val = F(noMask[j]);
          boxCls = j === 2 ? 'ncdc-chip-leak' : 'ncdc-chip-w';
          txtCls = j === 2 ? 'ncdc-chipv-leak' : '';
        } else if (j === 2) {
          val = '0'; boxCls = 'ncdc-chip-off'; txtCls = 'ncdc-chipv-off';
        } else {
          val = F(masked[j]); boxCls = 'ncdc-chip-good'; txtCls = 'ncdc-chipv-good';
        }
        chip(gC, cx, yS, 56, val, boxCls, txtCls);
        txt(gC, cx, yS + 22, KEY[j],
          'ncdc-key' + (!masked1 && j === 2 ? ' ncdc-key-leak' : masked1 && j === 2 ? ' ncdc-key-off' : ''));
      });
      txt(gC, wtC[1], yS - 20, L('lblWeights', 'attention weights'), 'ncdc-lbl');

      txt(main, W / 2, 22, masked1 ? L('hd1', 'insert the hexagon — the future goes to −∞')
                                   : L('hd0', 'no mask — the query can see the answer'), 'ncdc-head');
      if (!masked1) {
        badge(gC, 660, yS + 52, T('leakTag', '{v} of the attention lands on the FUTURE token t₃', F(noMask[2])),
          'ncdc-badge-bad', 'ncdc-badge-txt');
      } else {
        badge(gC, 660, yS + 52, L('okTag', 'the future gets 0 — the model can only look back'),
          'ncdc-badge-ok', 'ncdc-badge-txt');
      }
      txt(main, W / 2, H - 6, L('legMap', 'wire = axis · hexagon = reindex/mask · triangle = softmax'), 'ncdc-legend');
      prev = step;
    };
  },
});
