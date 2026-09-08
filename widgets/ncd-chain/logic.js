/* ncd-chain/logic.js — ONE sentence, carried end to end: "the cat sat" from a token id to a document rank.

   WHY THIS WIDGET EXISTS. An adversarial audit asked the ncd-* family a simple question — is there
   anywhere a LONG computation carried through, with the numbers surviving every arrow? — and the answer
   was no. Every widget restarted from its own toy inputs; softmax was computed five times without once
   showing exp(x)/Σexp; the context vector was derived from a V that was never drawn. The family taught
   the SHAPE of the computation and hid the computation. This widget is the answer: ten steps, one
   sentence, and at every step the matrix that changed, the operation glyph, and — the point — ONE WORKED
   CELL: the actual arithmetic of a single element, spelled out with the real numbers.

   The flagship callout is step 4, the multiply-accumulate the course had never once shown:
       Q[0]·K[0] = 1·1 + 0·0 + 1·1 + 0·0 = 2 = scores[0][0]
   Four multiplies, three adds, one number out. That is what a cup MEANS.

   EVERY number comes from data/l6-chain.json (facts-gated, _research/gen_l6_chain.py) — the embedding
   table, the PE rows, Wq/Wk/Wv, Q/K/V, the scores, the exponentials AND their row sums, the weights, the
   context, the pooled vector, the two documents (encoded by the SAME encoder, offline) and the ranking.
   Nothing here is derived that could be read, and nothing at all is invented: the widget only formats.

   THIS IS L06's CLIMB, and the attention core is L06's OWN canonical example: the generator SOLVES the
   projections (Wq = I + X⁺·(Q_L06 − X)) so that scores/scaled/weights/output reproduce data/l6-attention.json
   to the digit. A chain that arrived with its own Q/K/V would contradict the prose beside it. Two
   consequences, and both are LESSONS: (a) the projections are UGLY — 1.727, −1.636 — because a learned
   matrix is ugly, and the worked cell of step 3 leans on it: four hideous products, and the clean integer
   the chapter prints falls out. (b) the ranking margin is THIN — dot 3.225 vs 2.901, cos 0.407 vs 0.271 —
   because NOBODY TRAINED THIS ENCODER; the weights were solved to fit three tokens, not learned from data.
   Step 9 does not apologise for that. It hands the student to contrastive learning, which is the second
   half of this very lecture.

   WORKED CELLS ARE CHOSEN SO THE ARITHMETIC ON SCREEN LITERALLY ADDS UP. The data is rounded to 3 dp, so
   a cell whose displayed factors sum to 1.266 while its stored value is 1.267 would be a figure that
   contradicts itself in front of the student. Every cell below was verified against data/l6-chain.json:
   the displayed terms sum to the displayed result. The ONE exception is step 9, where a dot product of
   two rounded 4-vectors cannot reproduce a score computed at full precision — so it is written with ≈,
   not with a false "=".

   The chain: 0 lookup · 1 E[ids] · 2 +PE · 3 x·Wq (K,V from the same x) · 4 Q·Kᵀ · 5 ÷√dₖ · 6 softmax
   (exp, Σ, divide) · 7 ·V · 8 mean-pool (where the axis n DIES) · 9 q·dᵢ → rank (dot vs cosine).

   The LEDGER is the spine — it carries the shape as it flows:
       3 tokens → 3×4 → 3×4 → 3×4 → 3×3 → 3×3 → 3×3 → 3×4 → 4 → 1 rank
   and mean-pool is the emphasised row, because that is the contraction that makes a passage indexable. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger, shapeTable } from '../_ncd.js';

/* ── the frame. ONE viewBox for all ten steps, so the figure never jumps between them. ──────────────
   880 wide is also the legibility budget: the narrowest real surface is the Book's 449px figure column,
   so an authored 11px label lands at 11 × 449/880 = 5.6px — above the family's 5.0px floor (ncd-gate [D]).
   Nothing in this widget is authored below 11px. */
const W = 880, H = 380;
const Y_MID = 128;                       // the midline every single-lane step is built around
const CW = 48, CH = 22, GX = 3, GY = 3;  // one matrix cell (fits "-0.416" at 11px with room to spare)
const WX = 88, WY = 256, WW = 704;       // the worked-cell callout box

const mw = (cols) => cols * CW + (cols - 1) * GX;
const mh = (rows) => rows * CH + (rows - 1) * GY;

/* highlight token → (cell class, value class). The colour contract, once: warm = the thing being formed
   (scores/attention), cyan = the contracted dim d / the V lane, green = the result, accent = the token. */
const HL = { w: 'attn', g: 'out', c: 'proj', a: 'tok' };

export const mountNcdChain = defineWidget({
  id: 'ncd-chain',
  rootClass: 'ncdch-root',
  exportName: 'mountNcdChain',
  maxStep: 9,
  render({ host, data, labels, el }) {
    const D = data || {};
    const Q = D.query || {};
    const vocab = D.vocab || [];
    const words = Q.words || [];
    const ids = Q.ids || [];
    const docs = D.docs || [];
    const rank = D.rank || [0, 1];
    const dim = D.d != null ? D.d : 4;
    const dk = D.dk != null ? D.dk : 4;
    const sqrtDk = D.sqrtDk != null ? D.sqrtDk : 2;
    const n = words.length || 3;
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const F = G.fmt3;                                     // the ONE formatter: cells and callouts agree
    const T = (v) => (v < 0 ? `(${F(v)})` : F(v));        // a negative factor gets parentheses, not "·-"
    const sumM = (Q.rowSum || []).map((v) => [v]);        // the row sums, as a 1-column matrix

    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdch-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'One sentence carried from token id to document rank') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the shape as it flows'));

    // ── local glyph wrappers carrying this widget's class contract ───────────────────────────────
    const text = (x, y, s, cls, anchor, p) => G.text(p, x, y, s, cls, anchor || 'middle');
    const line = (cls, x1, y1, x2, y2, p, arrow) => G.wire(p, 'ncdch-w ' + cls, x1, y1, x2, y2, arrow ? { arrow: 1 } : {});
    const path = (cls, dd, p) => el('path', { class: 'ncdch-w ' + cls, d: dd }, p);
    const cup = (cx, cy, p) => G.cup(p, cx, cy, 'ncdch-op', 'ncdch-op-dot');
    const tri = (cx, cy, p) => G.tri(p, cx, cy, 'ncdch-sm', 'ncdch-sm-txt');
    const hex = (cx, cy, lab, p) => G.hexagon(p, cx, cy, lab, 'ncdch-hex', 'ncdch-hex-txt', 34, 20);
    const chip = (cx, cy, w, val, cls, vcls, p) => G.chips(p, [cx], cy, [val], 'ncdch-chip ' + cls, 'ncdch-chipv ' + vcls, w, (v) => String(v));

    /* A generic op box (a FIXED operation — not learned, so a plain rectangle, never a chipped one).
       Every label inside a box in this widget is language-neutral (÷√dₖ, Σ/n, +, ·, =): a box sized in
       chars × px fits Latin and BURSTS in Tatar, and that class of defect already shipped once. */
    function opBox(cx, cy, w, h, lab, sub, p) {
      el('rect', { class: 'ncdch-box', x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6 }, p);
      text(cx, cy + (sub ? -2 : 5), lab, 'ncdch-box-lbl', 'middle', p);
      if (sub) text(cx, cy + 13, sub, 'ncdch-box-sub', 'middle', p);
    }

    /* matrix(x, y, M, …) — a grid of real numbers with its name AND its shape in one title, so the
       figure and the ledger can never disagree about a shape (the shape has ONE source: SH). */
    function matrix(x, y, M, opt, p) {
      const g = el('g', {}, p);
      const o = opt || {};
      if (o.title) text(x, y - 9, o.shape ? `${o.title}  ${o.shape}` : o.title, 'ncdch-mt ' + (o.tcls || ''), 'start', g);
      M.forEach((row, r) => row.forEach((v, c) => {
        const cx = x + c * (CW + GX), cy = y + r * (CH + GY);
        const t = o.hi ? o.hi(r, c) : null;
        const off = o.off && o.off(r, c);
        el('rect', { class: `ncdch-cell ${off ? 'ncdch-c-off' : (o.cls || 'ncdch-c-neu')}${t ? ' ncdch-hl ncdch-hl-' + t : ''}`,
          x: cx, y: cy, width: CW, height: CH, rx: 4 }, g);
        text(cx + CW / 2, cy + CH / 2 + 4, F(v),
          `ncdch-v ${off ? 'ncdch-v-off' : (o.vcls || '')}${t ? ' ncdch-hv-' + t : ''}`, 'middle', g);
      }));
      if (o.rowLabels) M.forEach((_, r) => text(x - 8, y + r * (CH + GY) + CH / 2 + 4, o.rowLabels[r], 'ncdch-rl', 'end', g));
      if (o.rowLabelsR) M.forEach((_, r) => text(x + mw(M[0].length) + 8, y + r * (CH + GY) + CH / 2 + 4, o.rowLabelsR[r], 'ncdch-rl', 'start', g));
      return g;
    }

    /* The WORKED CELL — the reason this widget exists. head + the arithmetic, spelled out with the real
       numbers, + one short note. The box is 704px wide on purpose: wider than any line it can hold.
       xml:space="preserve" because SVG COLLAPSES runs of whitespace by default, and the equations use
       wide gaps to separate two facts on one line ("Q[0] = (…)      K[0] = (…)"): without it the two
       run together and the callout stops being readable — which is the entire point of this widget. */
    const XMLNS = 'http://www.w3.org/XML/1998/namespace';
    function worked(head, eqs, note, p) {
      const g = el('g', {}, p);
      const h = 30 + 21 * eqs.length + (note ? 20 : 0);
      el('rect', { class: 'ncdch-work', x: WX, y: WY, width: WW, height: h, rx: 8 }, g);
      let y = WY + 20;
      text(WX + 14, y, head, 'ncdch-work-head', 'start', g);
      eqs.forEach((e) => {
        y += 21;
        text(WX + 14, y, e, 'ncdch-eq', 'start', g).setAttributeNS(XMLNS, 'xml:space', 'preserve');
      });
      if (note) { y += 20; text(WX + 14, y, note, 'ncdch-work-note', 'start', g); }
      return g;
    }

    // ── the ONE place this widget names an axis. Ten shapes, one per stage: the ledger reads them, and
    //    so does every on-figure shape label. (ncd-attention once labelled the same matrix n×m on the
    //    figure and n×n in the ledger of the same frame, because the shape was typed twice.)
    const shapes = () => shapeTable({
      ids: `${n} ${L('uTokens', 'tokens')}`,
      emb: `${n}×${dim}`,
      x: `${n}×${dim}`,
      qkv: `${n}×${dim}`,
      scores: `${n}×${n}`,
      scaled: `${n}×${n}`,
      weights: `${n}×${n}`,
      ctx: `${n}×${dim}`,
      pooled: `${dim}`,
      rank: `1 ${L('uRank', 'rank')}`,
    });

    const LKEY = ['ids', 'emb', 'x', 'qkv', 'scores', 'scaled', 'weights', 'ctx', 'pooled', 'rank'];
    const LFB = ['ids', 'E[ids]', '+ PE', '· Wq / Wk / Wv', 'Q·Kᵀ', '÷ √dₖ', 'softmax', '· V', 'mean-pool', 'q·dᵢ → rank'];
    function setLedger(step, SH) {
      lg.setTitle(L('lgTitle', 'the shape as it flows'));
      lg.set(LKEY.map((k, i) => ({
        k: L('lgK' + i, LFB[i]),
        v: SH[k],
        state: step > i ? 'on' : step === i ? 'new' : 'off',
        tone: i === 8 ? 'good' : undefined,          // mean-pool: the contraction that kills the axis n
      })), L('lgN' + step, ''));
    }

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const SH = shapes();
      setLedger(step, SH);
      const g = el('g', { class: 'ncd-fx' }, main);

      // ── chrome: the ten-tick rail, the step's operation, the sentence being carried ──────────────
      for (let i = 0; i <= 9; i++) {
        el('rect', { class: 'ncdch-tick' + (i === step ? ' is-now' : i < step ? ' is-done' : ''),
          x: 20 + i * 20, y: 14, width: 14, height: 9, rx: 2 }, main);
      }
      text(238, 24, `${step} · ${L('op' + step, '')}`, 'ncdch-op-head', 'start', main);
      text(W - 14, 24, `«${words.join(' ')}»`, 'ncdch-sent', 'end', main);
      text(W / 2, H - 8, L('legMap', 'one sentence · every number survives the arrow'), 'ncdch-stage', 'middle', main);

      // ── 0 · the lookup. No arithmetic — and the widget says so out loud. ─────────────────────────
      if (step === 0) {
        const vx = 160, vy = Y_MID - mh(vocab.length) / 2;      // the vocabulary, 5 rows
        text(vx, vy - 9, L('lblVocab', 'vocabulary'), 'ncdch-mt ncdch-mt-tok', 'start', g);
        vocab.forEach((w, i) => {
          const y = vy + i * (CH + GY), used = ids.indexOf(i) >= 0;
          el('rect', { class: 'ncdch-cell ' + (used ? 'ncdch-c-tok' : 'ncdch-c-off'), x: vx, y, width: 34, height: CH, rx: 4 }, g);
          text(vx + 17, y + 15, String(i), 'ncdch-v ' + (used ? 'ncdch-v-tok' : 'ncdch-v-off'), 'middle', g);
          el('rect', { class: 'ncdch-cell ' + (used ? 'ncdch-c-tok' : 'ncdch-c-off'), x: vx + 37, y, width: 76, height: CH, rx: 4 }, g);
          text(vx + 75, y + 15, w, 'ncdch-v ' + (used ? 'ncdch-v-tok' : 'ncdch-v-off'), 'middle', g);
        });
        hex(400, Y_MID, 'ids', g);
        const qx = 540, qy = Y_MID - mh(n) / 2;                 // the query, 3 rows: word → id
        text(qx, qy - 9, `${L('lblQuery', 'the query')}  ${SH.ids}`, 'ncdch-mt ncdch-mt-tok', 'start', g);
        words.forEach((w, i) => {
          const y = qy + i * (CH + GY);
          el('rect', { class: 'ncdch-cell ncdch-c-tok', x: qx, y, width: 76, height: CH, rx: 4 }, g);
          text(qx + 38, y + 15, w, 'ncdch-v ncdch-v-tok', 'middle', g);
          el('rect', { class: 'ncdch-cell ncdch-c-tok ncdch-hl ncdch-hl-a', x: qx + 79, y, width: 34, height: CH, rx: 4 }, g);
          text(qx + 96, y + 15, String(ids[i]), 'ncdch-v ncdch-hv-a', 'middle', g);
          // the gather: from the vocabulary row this word IS, into the hexagon, out to the query row
          path('ncdch-w-tok', `M${vx + 113},${vy + ids[i] * (CH + GY) + 11} C${vx + 160},${vy + ids[i] * (CH + GY) + 11} ${330},${Y_MID} ${366},${Y_MID}`, g);
          path('ncdch-w-tok', `M${434},${Y_MID} C${470},${Y_MID} ${500},${y + 11} ${qx - 6},${y + 11}`, g);
        });
        worked(L('w0', 'a lookup is not a computation'),
          [words.map((w, i) => `${w} → ${ids[i]}`).join('      ')],
          L('n0', 'The row index is an address, not a meaning. Nothing is multiplied here.'), g);
      }

      // ── 1 · E[ids]. Three rows are PULLED out of the table. Still no arithmetic. ─────────────────
      if (step === 1) {
        const ex = 154, ey = Y_MID - mh(vocab.length) / 2;
        matrix(ex, ey, D.E || [], { title: 'E', shape: `${vocab.length}×${dim}`, tcls: 'ncdch-mt-tok',
          cls: 'ncdch-c-tok', vcls: 'ncdch-v-tok', rowLabels: vocab,
          off: (r) => ids.indexOf(r) < 0 }, g);
        hex(440, Y_MID, 'E[ids]', g);
        const bx = 525, by = Y_MID - mh(n) / 2;
        matrix(bx, by, Q.emb || [], { title: 'emb', shape: SH.emb, tcls: 'ncdch-mt-tok',
          cls: 'ncdch-c-tok', vcls: 'ncdch-v-tok', rowLabelsR: words,
          hi: (r) => (r === 1 ? 'a' : null) }, g);
        ids.forEach((id, i) => {
          path('ncdch-w-tok', `M${ex + mw(dim) + 4},${ey + id * (CH + GY) + 11} C${ex + 240},${ey + id * (CH + GY) + 11} ${370},${Y_MID} ${406},${Y_MID}`, g);
          path('ncdch-w-tok', `M${474},${Y_MID} C${500},${Y_MID} ${500},${by + i * (CH + GY) + 11} ${bx - 6},${by + i * (CH + GY) + 11}`, g);
        });
        /* The head carries no numbers and no words FROM THE DATA — the equation does. That is the rule
           the whole family lives by: prose never re-types a fact it could read. */
        worked(L('w1', 'the row IS the embedding — copied, not computed'),
          [`E[${ids[1]}] «${words[1]}» = (${(D.E[ids[1]] || []).map(F).join(', ')})   →   emb[1] = (${(Q.emb[1] || []).map(F).join(', ')})`],
          L('n1', 'A lookup moves a row; it does not change it. The address carries no meaning of its own.'), g);
      }

      // ── 2 · + PE. The first arithmetic of the whole chain: one addition, per element. ────────────
      if (step === 2) {
        const y = Y_MID - mh(n) / 2;
        matrix(70, y, Q.emb || [], { title: 'emb', shape: SH.emb, tcls: 'ncdch-mt-tok', cls: 'ncdch-c-tok',
          vcls: 'ncdch-v-tok', rowLabels: words, hi: (r, c) => (r === 1 && c === 1 ? 'w' : null) }, g);
        line('ncdch-w-tok', 271 + 4, Y_MID, 292 - 6, Y_MID, g);
        opBox(309, Y_MID, 34, 34, '+', null, g);
        line('ncdch-w-tok', 326 + 6, Y_MID, 345 - 4, Y_MID, g);
        matrix(345, y, Q.pe || [], { title: 'PE', shape: `${n}×${dim}`, cls: 'ncdch-c-neu',
          hi: (r, c) => (r === 1 && c === 1 ? 'w' : null) }, g);
        line('ncdch-w-tok', 546 + 4, Y_MID, 567 - 6, Y_MID, g);
        opBox(584, Y_MID, 34, 34, '=', null, g);
        line('ncdch-w-tok', 601 + 6, Y_MID, 620 - 4, Y_MID, g, true);
        matrix(620, y, Q.x || [], { title: 'x', shape: SH.x, tcls: 'ncdch-mt-tok', cls: 'ncdch-c-tok',
          vcls: 'ncdch-v-tok', hi: (r, c) => (r === 1 && c === 1 ? 'w' : null) }, g);
        worked(L('w2', 'one element, one addition'),
          [`x[1][1] = emb[1][1] + PE[1][1] = ${F(Q.emb[1][1])} + ${F(Q.pe[1][1])} = ${F(Q.x[1][1])}`],
          L('n2', 'Position is ADDED into the vector, not concatenated beside it: the shape does not grow.'), g);
      }

      // ── 3 · the projections. x meets a learned matrix — and a dot product appears. ───────────────
      /* The worked cell is x[«sat»] · Wq[:,1] → Q[2][1], and it is chosen, not arbitrary: the four
         displayed products sum to exactly the displayed result (0.909·(−1.751) + (−0.416)·0.082 +
         1.020·0.938 + 1·1.669 = 1.000). Q[1][1] would have shown 2.001 under a result printed as 2 —
         a figure contradicting itself, which is the disease this family exists to cure. It also makes
         the LESSON: four hideous products, one clean integer. Learned weights ARE ugly; the OPERATION
         is clean regardless — and this Q is the chapter's own, because Wq was solved to reproduce it. */
      if (step === 3) {
        const y = Y_MID - mh(n) / 2;
        const R3 = 2, C3 = 1;
        matrix(70, y, Q.x || [], { title: 'x', shape: SH.x, tcls: 'ncdch-mt-tok', cls: 'ncdch-c-tok',
          vcls: 'ncdch-v-tok', rowLabels: words, hi: (r) => (r === R3 ? 'w' : null) }, g);
        line('ncdch-w-tok', 275, Y_MID, 286, Y_MID, g);
        opBox(309, Y_MID, 34, 34, '·', null, g);
        line('ncdch-w-d', 332, Y_MID, 341, Y_MID, g);
        matrix(345, Y_MID - mh(dim) / 2, D.Wq || [], { title: 'Wq', shape: `${dim}×${dim}`, tcls: 'ncdch-mt-proj',
          cls: 'ncdch-c-proj', vcls: 'ncdch-v-proj', hi: (r, c) => (c === C3 ? 'w' : null) }, g);
        line('ncdch-w-d', 550, Y_MID, 561, Y_MID, g);
        opBox(584, Y_MID, 34, 34, '=', null, g);
        line('ncdch-w-tok', 607, Y_MID, 616, Y_MID, g, true);
        matrix(620, y, Q.Q || [], { title: 'Q', shape: SH.qkv, tcls: 'ncdch-mt-tok', cls: 'ncdch-c-tok',
          vcls: 'ncdch-v-tok', hi: (r, c) => (r === R3 && c === C3 ? 'g' : null) }, g);
        // T() on BOTH factors: Wq is full of negatives now, and "0.909·-1.751" is not an equation
        worked(L('w3', 'ugly weights, clean result: one dot product = one element of Q'),
          [`Q[${R3}][${C3}] = ${(Q.x[R3] || []).map((v, j) => `${T(v)}·${T(D.Wq[j][C3])}`).join(' + ')} = ${F(Q.Q[R3][C3])}`],
          L('n3', 'K = x·Wk and V = x·Wv come from the SAME x — three views of one input.'), g);
      }

      // ── 4 · Q·Kᵀ — THE CONTRACTION. The multiply-accumulate the course never once showed. ────────
      if (step === 4) {
        matrix(167, 56, Q.Q || [], { title: 'Q', shape: SH.qkv, tcls: 'ncdch-mt-tok', cls: 'ncdch-c-tok',
          vcls: 'ncdch-v-tok', rowLabels: words, hi: (r) => (r === 0 ? 'w' : null) }, g);
        matrix(167, 156, Q.K || [], { title: 'K', shape: SH.qkv, tcls: 'ncdch-mt-proj', cls: 'ncdch-c-proj',
          vcls: 'ncdch-v-proj', rowLabels: words, hi: (r) => (r === 0 ? 'w' : null) }, g);
        path('ncdch-w-tok', `M${372},${92} C${420},${92} ${449},${110} ${449},${130}`, g);
        path('ncdch-w-d', `M${372},${192} C${420},${192} ${449},${172} ${449},${154}`, g);
        cup(463, 142, g);
        text(463, 116, 'Q·Kᵀ', 'ncdch-glyph-lbl', 'middle', g);
        line('ncdch-w-attn', 480, 142, 557, 142, g, true);
        matrix(563, 106, Q.scores || [], { title: L('lblScores', 'scores'), shape: SH.scores,
          tcls: 'ncdch-mt-attn', cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn',
          hi: (r, c) => (r === 0 && c === 0 ? 'g' : null) }, g);
        // BELOW the K wire's swing, not on it: at y=178 the wire drew a line straight through this label
        text(463, 208, L('lblDdies', 'the axis d dies here'), 'ncdch-size', 'middle', g);
        worked(L('w4', 'the multiply–accumulate: a whole row and a whole column collapse into ONE number'),
          [`Q[0] = (${(Q.Q[0] || []).map(F).join(', ')})      K[0] = (${(Q.K[0] || []).map(F).join(', ')})`,
           `Q[0]·K[0] = ${(Q.Q[0] || []).map((v, j) => `${F(v)}·${F(Q.K[0][j])}`).join(' + ')} = ${F(Q.scores[0][0])} = ${L('lblScores', 'scores')}[0][0]`],
          L('n4', 'Multiply term by term, then add. Every cell of the score matrix is one of these — that is what a cup MEANS.'), g);
      }

      // ── 5 · ÷ √dₖ. Nine cells, one divisor. The shape does not move. ─────────────────────────────
      if (step === 5) {
        const y = Y_MID - mh(n) / 2;
        matrix(205, y, Q.scores || [], { title: L('lblScores', 'scores'), shape: SH.scores, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', hi: (r, c) => (r === 0 && c === 0 ? 'w' : null) }, g);
        line('ncdch-w-attn', 359, Y_MID, 406, Y_MID, g);
        opBox(440, Y_MID, 62, 44, '÷√dₖ', `√${dk} = ${F(sqrtDk)}`, g);
        line('ncdch-w-attn', 474, Y_MID, 521, Y_MID, g, true);
        matrix(525, y, Q.scaled || [], { title: L('lblScaled', 'scaled'), shape: SH.scaled, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', hi: (r, c) => (r === 0 && c === 0 ? 'g' : null) }, g);
        worked(L('w5', 'one element, divided'),
          [`${L('lblScaled', 'scaled')}[0][0] = ${L('lblScores', 'scores')}[0][0] ÷ √dₖ = ${F(Q.scores[0][0])} ÷ ${F(sqrtDk)} = ${F(Q.scaled[0][0])}`],
          L('n5', 'Every cell is divided by the same √dₖ. A divide changes no shape at all — only the size of the numbers.'), g);
      }

      // ── 6 · softmax, opened. exp, then Σ, then divide — no step of it left as a black box. ───────
      if (step === 6) {
        const y = Y_MID - mh(n) / 2;
        matrix(80, y, Q.scaled || [], { title: L('lblScaled', 'scaled'), shape: SH.scaled, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', hi: (r, c) => (r === 0 && c === 0 ? 'w' : null) }, g);
        line('ncdch-w-attn', 234, Y_MID, 246, Y_MID, g);
        tri(265, Y_MID, g);
        line('ncdch-w-attn', 285, Y_MID, 304, Y_MID, g);
        matrix(310, y, Q.exp || [], { title: 'exp', shape: SH.weights, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', hi: (r, c) => (r === 0 && c === 0 ? 'w' : null) }, g);
        matrix(470, y, sumM, { title: 'Σ', shape: `${n}`, tcls: 'ncdch-mt-attn', cls: 'ncdch-c-neu',
          hi: (r) => (r === 0 ? 'w' : null) }, g);
        line('ncdch-w-attn', 522, Y_MID, 539, Y_MID, g);
        opBox(560, Y_MID, 34, 34, '÷', null, g);
        line('ncdch-w-attn', 581, Y_MID, 596, Y_MID, g, true);
        matrix(600, y, Q.weights || [], { title: L('lblWeights', 'attention'), shape: SH.weights, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', hi: (r, c) => (r === 0 && c === 0 ? 'g' : null) }, g);
        worked(L('w6', 'inside the triangle'),
          [`Σ[0] = ${(Q.exp[0] || []).map(F).join(' + ')} = ${F(Q.rowSum[0])}`,
           `${L('lblWeights', 'attention')}[0][0] = exp[0][0] ÷ Σ[0] = ${F(Q.exp[0][0])} ÷ ${F(Q.rowSum[0])} = ${F(Q.weights[0][0])}`],
          L('n6', 'exp is taken on (scaled − row max); the shift cancels in the ratio. The shape is unchanged.'), g);
      }

      // ── 7 · · V — the SECOND contraction. Every output row is a weighted sum of the V rows. ──────
      /* Row «sat» (R7 = 2), column 0 — again chosen so the displayed terms literally sum to the
         displayed result (0.212·1 + 0.212·0 + 0.576·2 = 1.364, exact). Row 0's cell would print
         1.266 = 1.267. And 1.364 is one of the three numbers step 8 then averages — the arrow survives. */
      if (step === 7) {
        const R7 = 2;
        matrix(167, 56, Q.weights || [], { title: L('lblWeights', 'attention'), shape: SH.weights, tcls: 'ncdch-mt-attn',
          cls: 'ncdch-c-attn', vcls: 'ncdch-v-attn', rowLabels: words, hi: (r) => (r === R7 ? 'w' : null) }, g);
        matrix(167, 156, Q.V || [], { title: 'V', shape: SH.qkv, tcls: 'ncdch-mt-proj', cls: 'ncdch-c-proj',
          vcls: 'ncdch-v-proj', rowLabels: words, hi: (r, c) => (c === 0 ? 'c' : null) }, g);
        path('ncdch-w-attn', `M${321},${92} C${400},${92} ${449},${110} ${449},${130}`, g);
        path('ncdch-w-d', `M${372},${192} C${420},${192} ${449},${172} ${449},${154}`, g);
        cup(463, 142, g);
        text(463, 116, '· V', 'ncdch-glyph-lbl', 'middle', g);
        line('ncdch-w-out', 480, 142, 557, 142, g, true);
        matrix(563, 106, Q.ctx || [], { title: 'ctx', shape: SH.ctx, tcls: 'ncdch-mt-out',
          cls: 'ncdch-c-out', vcls: 'ncdch-v-out', hi: (r, c) => (r === R7 && c === 0 ? 'g' : null) }, g);
        text(463, 208, L('lblKdies', 'the key axis dies here'), 'ncdch-size', 'middle', g);
        worked(L('w7', 'one output element = a weighted sum down one column of V'),
          [`ctx[${R7}][0] = ${(Q.weights[R7] || []).map((w, i) => `${F(w)}·${T(Q.V[i][0])}`).join(' + ')} = ${F(Q.ctx[R7][0])}`],
          L('n7', 'Every output row is now a MIX of all the V rows — that is what the second cup buys you.'), g);
      }

      // ── 8 · mean-pool. THIS is where the axis n dies: three vectors become ONE point. ────────────
      if (step === 8) {
        const y = Y_MID - mh(n) / 2;
        matrix(150, y, Q.ctx || [], { title: 'ctx', shape: SH.ctx, tcls: 'ncdch-mt-out', cls: 'ncdch-c-out',
          vcls: 'ncdch-v-out', rowLabels: words, hi: (r, c) => (c === 0 ? 'w' : null) }, g);
        (Q.ctx || []).forEach((_, r) => {
          const yy = y + r * (CH + GY) + 11;
          path('ncdch-w-out', `M${355},${yy} C${390},${yy} ${390},${Y_MID} ${415},${Y_MID}`, g);
        });
        opBox(460, Y_MID, 76, 44, 'Σ/n', `n = ${n} → 1`, g);
        line('ncdch-w-out', 498, Y_MID, 556, Y_MID, g, true);
        matrix(560, Y_MID - CH / 2, [Q.pooled || []], { title: L('lblPooled', 'pooled'), shape: SH.pooled,
          tcls: 'ncdch-mt-out', cls: 'ncdch-c-out', vcls: 'ncdch-v-out', hi: (r, c) => (c === 0 ? 'g' : null) }, g);
        text(460, 196, L('lblNdies', 'the axis n dies here'), 'ncdch-size ncdch-size-hot', 'middle', g);
        worked(L('w8', 'the axis n dies here — and that is what makes a passage indexable'),
          [`${L('lblPooled', 'pooled')}[0] = ( ${(Q.ctx || []).map((r) => F(r[0])).join(' + ')} ) ÷ ${n} = ${F(Q.pooled[0])}`],
          L('n8', 'Every token vector collapses into ONE point. A passage is now a single address in the index.'), g);
      }

      // ── 9 · the rank. The SAME encoder ran offline over the documents; now one dot product each. ──
      if (step === 9) {
        matrix(60, 60, [Q.pooled || []], { title: `q «${words.join(' ')}»  ${SH.pooled}`, tcls: 'ncdch-mt-tok',
          cls: 'ncdch-c-tok', vcls: 'ncdch-v-tok' }, g);
        /* The index side. A dashed REGION, deliberately 256px wide, and its label rides INSIDE it: the
           family's tag-box helper sizes a label at chars×6.3px, which fits Latin and BURSTS in Tatar
           (that defect has shipped once already). A plain text on a wide backdrop cannot burst. */
        el('rect', { class: 'ncdch-region', x: 44, y: 96, width: 256, height: 126, rx: 12 }, g);
        text(52, 111, L('tagIndex', 'the same encoder, run offline'), 'ncdch-size ncdch-size-idx', 'start', g);
        docs.forEach((doc, i) => {
          const gy = 138 + i * 48;                       // the two document vectors, inside the index
          matrix(60, gy, [doc.pooled || []], { title: `d${i + 1} «${(doc.words || []).join(' ')}»  ${SH.pooled}`,
            tcls: 'ncdch-mt-idx', cls: 'ncdch-c-idx', vcls: 'ncdch-v-idx' }, g);
          line('ncdch-w-idx', 265, gy + 11, 364, gy + 11, g);
          cup(378, gy + 23, g);
          const win = rank[0] === i;
          line(win ? 'ncdch-w-out' : 'ncdch-w-idx', 393, gy + 29, 408, gy + 29, g);
          chip(450, gy + 29, 76, F(doc.score), win ? 'ncdch-chip-win' : 'ncdch-chip-lose',
            win ? 'ncdch-chipv-win' : 'ncdch-chipv-lose', g);
          chip(556, gy + 29, 68, F(doc.cos), win ? 'ncdch-chip-win' : 'ncdch-chip-lose',
            win ? 'ncdch-chipv-win' : 'ncdch-chipv-lose', g);
          chip(646, gy + 29, 44, '#' + (rank.indexOf(i) + 1), win ? 'ncdch-chip-win' : 'ncdch-chip-lose',
            win ? 'ncdch-chipv-win' : 'ncdch-chipv-lose', g);
        });
        // ONE query wire feeds BOTH cups: the query is scored against every document by the same op
        line('ncdch-w-tok', 265, 71, 392, 71, g);
        line('ncdch-w-tok', 392, 71, 392, 197, g);
        text(450, 130, 'q·d', 'ncdch-glyph-lbl', 'middle', g);
        text(556, 130, 'cos', 'ncdch-glyph-lbl', 'middle', g);
        const d0 = docs[rank[0]] || {}, d1 = docs[rank[1]] || {};
        /* ≈, not =. The score in data/ is the dot product of the FULL-PRECISION pooled vectors; these
           factors are rounded to 3 dp, so their sum cannot land on it exactly. An "=" here would be the
           one false equation in a widget whose entire promise is that every number survives the arrow.
           And no Δ%: a margin is a number nobody can read out of the data file. The two scores and the
           two cosines are printed instead — the gap is thin, and the widget does not hide it. */
        worked(L('w9', 'one encoder, two ways to score it'),
          [`q·d${rank[0] + 1} = ${(Q.pooled || []).map((v, j) => `${T(v)}·${T(d0.pooled[j])}`).join(' + ')} ≈ ${F(d0.score)}`,
           `q·d${rank[1] + 1} = ${F(d1.score)}      cos d${rank[0] + 1} = ${F(d0.cos)}  ${L('uVs', 'vs')}  cos d${rank[1] + 1} = ${F(d1.cos)}`],
          L('n9', 'Same order both ways — but a thin gap: nobody trained this encoder. Widening it IS contrastive learning.'), g);
      }
    };
  },
});
