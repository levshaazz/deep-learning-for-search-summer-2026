/* ncd-retrieval/logic.js — dense retrieval in the neural-circuit-diagram lens (Abbott & Zardini v2),
   CONCRETE redesign. A real toy corpus of 4 documents is scored against one query. The corpus is the
   broadcast axis N (violet dashed region); the three retrievers differ ONLY in the operation run PER
   DOCUMENT — and you can literally COUNT the encoder boxes (1 for bi/ColBERT, N for cross), which is
   the accuracy⇄cost trade-off. Score bars rank the docs; top-k highlighted.

   WHAT THE LEDGER ARGUES. The picture shows you WHAT each retriever does; the ledger prices it. The
   whole accuracy⇄cost trade-off of neural search is three rows: how many encoder passes a QUERY costs,
   whether the corpus can be pre-computed, and what you get for it. Quality is not invented here — it is
   MS MARCO passage-dev MRR@10 from data/l3-benchmarks.json (BM25 0.187 · DPR 0.33 · ColBERT 0.36).
   The cross-encoder has no MRR row on purpose: its cost is N encoder passes PER QUERY, so on a real
   corpus you never run it as a retriever at all — which is exactly why the cascade exists.

   DRIVER-AGNOSTIC (setStep/maxStep). Bar lengths are illustrative; every number in the ledger is not.
   ON-BRAND (tokens + semantic contract) and COLLISION-FREE (rows via _layout.stack, fixed columns).
   Step 0 = bi-encoder · 1 = cross-encoder · 2 = ColBERT. */
import { defineWidget } from '../_widget-base.js';
import { stack } from '../_layout.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdRetrieval = defineWidget({
  id: 'ncd-retrieval',
  rootClass: 'ncdr-root',
  exportName: 'mountNcdRetrieval',
  maxStep: 2,
  render({ host, data, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const MM = (data && data.msmarco) || {};
    const bm25 = MM.BM25 != null ? MM.BM25 : 0.187;
    const dpr = MM.denseDPR != null ? MM.denseDPR : 0.33;
    const colb = MM.ColBERT != null ? MM.ColBERT : 0.36;
    const W = 820, H = 366;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdr-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Retrieval as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'cost & quality'));

    // corpus: 4 docs (d1 & d4 are the relevant "gold"; d2 the off-topic distractor)
    const DOCS = ['doc1', 'doc2', 'doc3', 'doc4'];
    const SCORES = { 0: [0.72, 0.15, 0.42, 0.60], 1: [0.94, 0.08, 0.34, 0.82], 2: [0.87, 0.13, 0.38, 0.74] };
    const TOPK = 2;

    // ── helpers ───────────────────────────────────────────────────────────────
    const line = (cls, x1, y1, x2, y2, p) => el('line', { class: 'ncdr-w ' + cls, x1, y1, x2, y2 }, p);
    const text = (x, y, s, cls, anchor = 'middle', p) => {
      const t = el('text', { x, y, class: cls, 'text-anchor': anchor }, p); t.textContent = s; return t; };
    const rect = (cls, x, y, w, h, rx, p) => el('rect', { class: cls, x, y, width: w, height: h, rx }, p);
    function enc(cx, cy, w, h, p) {                        // chipped rectangle "L enc"
      const c = 10, x = cx - w / 2, y = cy - h / 2;
      el('path', { class: 'ncdr-enc', d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, p);
      text(cx, cy + 4, 'L enc', 'ncdr-enc-txt', 'middle', p);
    }
    function cup(cx, cy, p) {                              // cheap contraction (dot product)
      el('path', { class: 'ncdr-op', d: `M${cx - 11},${cy - 9} Q${cx},${cy + 13} ${cx + 11},${cy - 9}` }, p);
      el('circle', { class: 'ncdr-op-dot', cx, cy: cy + 5, r: 2.2 }, p);
    }
    /* THE PRE-COMPUTED DOCUMENT VECTORS — the ink the caption has been pointing at all along.
       s0 said "every document is already encoded offline (the grey vectors)" in three languages, and
       there were no grey vectors: vec() was called ONCE, for the query. The dead `.ncdr-vec` rule and the
       dead `lblPre` key were the fossils of a glyph that had been designed and then fell out of the
       drawing. They are drawn now — and, better, their ABSENCE at step 1 is the lesson: a cross-encoder
       cannot precompute anything, because it must read query and document TOGETHER. */
    function vec(x, y, cls, p, n = 6) { for (let i = 0; i < n; i++) rect(cls, x + i * 8, y, 6, 12, 1, p); }
    // ColBERT: not ONE vector per document but one per TOKEN — a grid, not a row. Same for the query.
    function vecGrid(x, y, cls, p, rows = 3, cols = 6) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rect(cls, x + c * 8, y + r * 7, 6, 5, 1, p);
    }
    function scoreBar(x, cy, w, frac, top, p) {
      rect('ncdr-track', x, cy - 8, w, 16, 4, p);
      rect(top ? 'ncdr-fill-top' : 'ncdr-fill', x + 1.5, cy - 6.5, Math.max(2, (w - 3) * frac), 13, 3, p);
      if (top) text(x + w + 16, cy + 4, '✓', 'ncdr-check', 'middle', p);
    }

    // ── the ledger: what a QUERY costs, and what it buys ─────────────────────
    const YES = L('lgYes', 'yes'), NO = L('lgNo', 'no'), MRR = L('lgMrr', 'MRR@10 · MS MARCO');
    const kEnc = L('lgEnc', 'encoder passes / query'), kPre = L('lgPre', 'corpus precomputable');
    const kPer = L('lgPer', 'work per document');
    const LEDGER = [
      { rows: [{ k: kEnc, v: '1', tone: 'good' }, { k: kPre, v: YES, tone: 'good' },
               { k: kPer, v: L('lgPerBi', 'q·dᵢ  (d mults)') },
               { k: MRR, v: String(dpr) }, { k: 'BM25', v: String(bm25) }],
        note: L('lgN0', 'One encoder pass, on the query. The document vectors were computed offline, so nothing in the corpus is touched at query time — this is why a bi-encoder scales to billions.') },
      { rows: [{ k: kEnc, v: 'N', tone: 'cost' }, { k: kPre, v: NO, tone: 'cost' },
               { k: kPer, v: L('lgPerCross', 'a full BERT pass'), tone: 'cost' }],
        note: L('lgN1', 'Count the encoder boxes: there are N. The encoder reads query and document TOGETHER, so there is nothing to precompute. Best quality — and on a million-document corpus, a million BERT passes per query. That is why it only ever runs as a reranker.') },
      { rows: [{ k: kEnc, v: '1', tone: 'good' }, { k: kPre, v: L('lgPreTok', 'yes, per token'), tone: 'good' },
               { k: kPer, v: 'MaxSim  (nq×nd)' },
               { k: MRR, v: String(colb), tone: 'good' }, { k: 'BM25', v: String(bm25) }],
        note: L('lgN2', 'One pass on the query, like the bi-encoder — but the contraction is LATE: MaxSim compares token to token. You pay in storage (a vector per document token) and you get 0.36, above DPR.') },
    ];

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', { class: 'ncd-fx' }, svg);   // each step is a genuinely different circuit → animate it in
      const LG = LEDGER[Math.max(0, Math.min(2, step))];
      lg.set(LG.rows.map((r) => ({ ...r, state: 'on' })), LG.note);
      const g = main, S = SCORES[Math.max(0, Math.min(2, step))];
      const sorted = [...S].sort((a, b) => b - a);
      const cutoff = sorted[TOPK - 1];
      const isCross = step === 1;

      // ── query strip (above the corpus) ──────────────────────────────────────
      text(24, 26, L('lblQuery', 'query'), 'ncdr-qlbl', 'start', g);
      rect('ncdr-qchip', 24, 30, 226, 28, 8, g);
      text(137, 48, '“' + L('query', 'neural nets for search') + '”', 'ncdr-qchip-txt', 'middle', g);
      const opX = 344;
      /* THE QUERY FAN. This used to be a single dashed stub that left the query vector, crossed the
         corpus border and stopped in empty space at (344, 82) — attached to nothing, meaning nothing.
         Its intent was "the query is shared into every per-document op", and in this notation that is
         not a line but a FAN: a cup has TWO inputs — the document from the left and the query from
         above — and the query side simply was never drawn. Now every op is actually fed. */
      const rowsY = stack({ x: 44, y: 98, w: 732, h: 212 }, 4, { dir: 'col', gap: 8 })
        .map((r) => r.y + r.h / 2);
      if (!isCross) {                                     // bi / ColBERT: encode the query ONCE, up top
        line('ncdr-w-q', 250, 44, 292, 44, g);
        enc(318, 44, 52, 30, g);
        // bi-encoder: ONE query vector. ColBERT: one vector per query TOKEN — the grid the s2 caption
        // promised and the figure used to withhold (it drew the same single 6-cell row as s0).
        if (step === 2) vecGrid(360, 30, 'ncdr-vec-q', g);
        else vec(360, 38, 'ncdr-vec-q', g);               // fresh query vector (cyan)
      } else {                                            // cross: the QUERY ITSELF enters every encoder
        line('ncdr-w-q', 250, 44, 404, 44, g);
        // NO query vector, and (below) no document vectors either. There is nothing to precompute.
        text(432, 47, L('noPre', 'nothing to pre-compute'), 'ncdr-nopre', 'start', g);
      }
      /* The fan leaves from the SAME point in every step (the right of the query strip) and lands on the
         RIGHT shoulder of each op. Routing it from the query chip on the left — the obvious thing —
         drives four diagonals straight through all four document cards; the strengthened line-vs-label
         test caught that immediately. A cup takes the document from the left and the query from the
         right, so this is also the correct NCD reading, not merely the tidy one. */
      /* …and it must land ON the op, never INSIDE it. (opX+14, cy−12) is exactly the right HORN of step 0's
         cup — the correct place for a cup's second input, and a cup is an open stroke, so nothing is
         crossed. But the box ops of steps 1–2 are 66px WIDE, and a diagonal aimed 20px inside their right
         edge has to get there: on its way down it cut straight through the op box of every row ABOVE its
         own. (Same class of bug as the four diagonals through the document cards — moved, not removed.)
         Landing on the op's right EDGE instead keeps every line strictly to the right of every box: x
         never drops below 377, so no diagonal can enter one. A wire stops at the border it connects to. */
      const qfX = step === 0 ? opX + 14 : opX + 33;    // cup horn · the box ops' right edge
      const qfDy = step === 0 ? 12 : 8;
      rowsY.forEach((cy) => line('ncdr-w-qf', 412, 50, qfX, cy - qfDy, g));

      // ── corpus region N ─────────────────────────────────────────────────────
      rect('ncdr-Nregion', 30, 76, 760, 244, 14, g);
      const tag = L('lblCorpus', 'N · corpus (4 docs)');
      G.tagBox(g, 54, 79, tag, 'ncdr-Ntag', 'ncdr-Ntag-txt', 9, 5, 'start');
      text(538, 92, L('lblScore', 'score'), 'ncdr-scorelbl', 'middle', g);
      text(690, 92, L('lblTopk', 'top-k'), 'ncdr-scorelbl', 'middle', g);

      const rows = stack({ x: 44, y: 98, w: 732, h: 212 }, 4, { dir: 'col', gap: 8 });
      DOCS.forEach((key, i) => {
        const cy = rows[i].y + rows[i].h / 2, sc = S[i], top = sc >= cutoff - 1e-9;
        // document card — and what the retriever was able to compute BEFORE the query arrived
        rect(top ? 'ncdr-card ncdr-card-hot' : 'ncdr-card', 44, cy - 22, 224, 44, 8, g);
        text(54, cy - 6, 'd' + (i + 1), 'ncdr-doc-id', 'start', g);
        text(78, cy - 5, L(key, key), 'ncdr-doc-txt', 'start', g);
        if (isCross) {
          // THE VECTORS ARE GONE. A cross-encoder reads query and document together, so the document
          // half cannot be encoded ahead of time — the empty dashed slot is where the offline work
          // WOULD have been cached, and the fact that it is empty is the whole cost of this design.
          text(78, cy + 13, 'q ⊕ d' + (i + 1), 'ncdr-pre', 'start', g);
          rect('ncdr-void', 156, cy + 2, 46, 14, 3, g);
        } else {
          text(78, cy + 14, L('lblPre', 'pre-encoded'), 'ncdr-pre', 'start', g);
          if (step === 2) vecGrid(156, cy + 1, 'ncdr-vec', g);   // ColBERT: a vector per document TOKEN
          else vec(156, cy + 3, 'ncdr-vec', g);                  // bi-encoder: one vector per document
        }
        line('ncdr-w-q', 270, cy, opX - 36, cy, g);
        // per-document operation
        if (step === 0) { cup(opX, cy, g); text(opX - 44, cy - 16, L('opBi', 'q·dᵢ'), 'ncdr-mbox-txt', 'middle', g); }
        else if (step === 1) { enc(opX, cy, 66, 34, g); }
        else { rect('ncdr-mbox', opX - 33, cy - 15, 66, 30, 6, g); text(opX, cy + 4, L('opCol', 'MaxSim'), 'ncdr-mbox-txt', 'middle', g); }
        // score bar + top-k
        line('ncdr-w-N', opX + 36, cy, 430, cy, g);
        scoreBar(438, cy, 232, sc, top, g);
      });

      // per-document tag (inside region) + cost (clear below the region border at y=320)
      const rtag = [L('tagBi', ''), L('tagCross', ''), L('tagCol', '')][step];
      text(784, 306, rtag, 'ncdr-Ntag-txt', 'end', g);
      const cost = [L('costBi', ''), L('costCross', ''), L('costCol', '')][step];
      text(opX, 340, cost, 'ncdr-cost', 'middle', g);
      text(W / 2, 358, L('legMap', 'document · operation per document · score · top-k'), 'ncdr-legend', 'middle', g);
    };
  },
});
