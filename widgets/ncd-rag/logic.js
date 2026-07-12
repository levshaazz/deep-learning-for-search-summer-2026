/* ncd-rag/logic.js — the retrieval-augmented-generation loop in the neural-circuit-diagram lens.

   WHY THIS WIDGET WAS REBUILT. It claimed the notation and used none of it. `alt` and `s0` both asserted
   "the corpus is a BROADCAST AXIS", and the figure was a plain block diagram: no cup, no triangle, no
   hexagon, no chipped-L, no region, no ledger — it imported `{ glyphs }` and used it for nothing but
   `text` and `wire`. Two contradictions were flat lies in ink:

     • the corpus wore the REGION idiom (dashed border, 6% violet fill — pixel-for-pixel `.ncdann-region`,
       which in ncd-ann ENCLOSES the N documents) while being used as a NODE with an arrow coming out of
       it. The same graphic meant "a scope" in one widget and "a datum" in the next. A vocabulary that
       drifts per widget is not a vocabulary. → the corpus is now a true `G.region` that ENCLOSES the N
       document wires feeding the retriever. It is a scope, and it looks like one.

     • `_ncd.js` defines the hexagon as exactly "reindex / slice (top-k)" — and the node LITERALLY
       LABELLED `top-k` was drawn as a stack of cards, while the hexagon went to concat and to masks and
       never once to the thing it is named after. → the two NARROWINGS, N→K and K→k, are the hexagons
       now. That is what a hexagon MEANS.

   WHAT WAS KEPT, DELIBERATELY. This is the only widget in the family that draws the query entering
   TWICE — once to retrieve, once to condition generation — and that grounding arc IS the insight of RAG:
   the answer is conditioned on evidence the same query went and fetched. It stays, and it is now the
   only dashed accent-coloured line on the board.

   NO INVENTED NUMBERS. The funnel is symbolic end to end — N → K → k → 1 — in the figure and in the
   ledger alike. The course has no grounded RAG corpus/latency figures in data/, so there are none here;
   a plausible-looking fake K would be worse than no K at all.

   Colour is meaning: --c-violet = the corpus, the broadcast axis, the offline side · --accent = the
   query (both entries) · --warm = retrieve (cheap, over everything) · --c-cyan = rerank (sharp, over few)
   · --c-amber = the two hexagons, i.e. the slices themselves · --c-pink = the generator · --c-green =
   the grounded answer. Step 0 = retrieve · 1 = + rerank · 2 = + generate.
   DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdRag = defineWidget({
  id: 'ncd-rag',
  rootClass: 'ncdrag-root',
  exportName: 'mountNcdRag',
  maxStep: 2,
  render({ host, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    const W = 820, H = 288, yM = 150;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdrag-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'The RAG loop as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the funnel'));

    // the corpus region and the N document wires it ENCLOSES
    const RGN = { x: 16, y: 70, w: 140, h: 176 };
    const DOCS = [{ y: 92, k: 'd1' }, { y: 126, k: 'd2' }, { y: 160, k: 'd3' }, { y: 216, k: 'dN' }];
    const xDoc = 60, xBus = 166;
    const xQ = 250, yQ = 40;                    // the query sits ABOVE the retriever: a second axis in
    const xRet = 250, xHexK = 372, xRr = 504, xHexk = 624, xGen = 736;

    // ── the ledger: the funnel, priced in axes. Symbolic — N, K, k are shapes, not measurements. ──
    const kAxis = L('lgAxis', 'broadcast axis'), kKept = L('lgKept', 'docs kept'),
          kWork = L('lgWork', 'work / query'), kOrder = L('lgOrder', 'ordering'),
          kCtx = L('lgCtx', 'what the LLM sees'), kOut = L('lgOut', 'answers');
    const LEDGER = [
      { rows: [{ k: kAxis, v: 'N', state: 'new' },
               { k: kKept, v: 'K ≪ N', state: 'new', tone: 'good' },
               { k: kWork, v: L('lgWorkBi', 'N × one dot'), state: 'new' },
               { k: kOrder, v: L('lgOrderRough', 'roughly right'), state: 'new', tone: 'cost' }],
        note: L('lgN0', 'The corpus is not a box the arrow comes out of — it is the AXIS the query is broadcast over, so it is drawn as a region ENCLOSING the N document wires. The first hexagon is the slice that ends it: N → K.') },
      { rows: [{ k: kAxis, v: 'N', state: 'on' },
               { k: kKept, v: 'k ≪ K', state: 'new', tone: 'good' },
               { k: kWork, v: L('lgWorkCross', '+ K × a full BERT'), state: 'new', tone: 'cost' },
               { k: kOrder, v: L('lgOrderSharp', 'sharp'), state: 'new', tone: 'good' }],
        note: L('lgN1', 'A second hexagon, a second slice: K → k. You can afford the expensive reader only because the first slice already threw away everything but K — the cascade is two hexagons, and nothing else.') },
      { rows: [{ k: kAxis, v: 'N', state: 'on' },
               { k: kKept, v: 'k', state: 'on', tone: 'good' },
               { k: kCtx, v: L('lgCtxV', 'k docs + the query'), state: 'new' },
               { k: kOut, v: '1', state: 'new', tone: 'good' }],
        note: L('lgN2', 'The query enters TWICE — that dashed arc is the whole of RAG. The model is not asked what it knows; it is asked what these k documents say, and the same query that fetched them is what it is asked about.') },
    ];

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const s = Math.max(0, Math.min(2, step));
      const fresh = (k) => (k > prev && k <= s ? 'ncd-fx' : '');
      const LG = LEDGER[s];
      lg.set(LG.rows, LG.note);

      /* ── the corpus: a REGION (a scope), enclosing the N document wires it broadcasts over ────
         The tag is drawn CLEAR of the border rather than through G.region's own tag, which tucks it
         onto the top edge: that is fine for ncd-ann's 630px-wide region (a backdrop the detector
         forgives) but this region is only 140 wide, so a tag straddling its stroke reads — correctly —
         as a label lying on a shape. Same fix ncd-debug's head-broadcast region already carries. */
      const gC = el('g', { class: fresh(0) }, main);
      el('rect', { class: 'ncdrag-region', x: RGN.x, y: RGN.y, width: RGN.w, height: RGN.h, rx: 14 }, gC);
      // it MEASURES its own text and starts at the region's left inset — never a character-count guess
      G.tagBox(gC, RGN.x + 19, RGN.y - 12, L('tagCorpus', 'N · the corpus'),
        'ncdrag-rtag', 'ncdrag-rtag-txt', 9, 5, 'start').setAttribute('rx', 6);
      DOCS.forEach((d) => {
        // pentagon = an element: a document that was encoded offline and is only LOOKED UP now
        G.pentagon(gC, xDoc, d.y, d.k, 'ncdrag-doc', 'ncdrag-doc-txt');
        G.wire(gC, 'ncdrag-w ncdrag-w-N', xDoc + 17, d.y, xBus, d.y);
      });
      G.text(gC, xDoc, 192, '⋮', 'ncdrag-dots');                   // N documents, four of them drawn
      G.wire(gC, 'ncdrag-w ncdrag-w-N', xBus, DOCS[0].y, xBus, DOCS[3].y);   // the N axis, bundled
      G.wire(gC, 'ncdrag-w ncdrag-w-N', xBus, yM, xRet - 68, yM, { arrow: true });

      // ── the query: the OTHER axis into the retriever, entering from above ─────────────────────
      const gQ = el('g', { class: fresh(0) }, main);
      el('rect', { class: 'ncdrag-q', x: xQ - 50, y: yQ - 15, width: 100, height: 30, rx: 8 }, gQ);
      G.text(gQ, xQ, yQ + 5, L('lblQuery', 'query'), 'ncdrag-q-txt');
      G.wire(gQ, 'ncdrag-w ncdrag-w-q', xQ, yQ + 15, xQ, yM - 22, { arrow: false });
      el('path', { class: 'ncdrag-w ncdrag-w-q', fill: 'none', style: 'stroke-linejoin:round',
        d: `M${xQ - 4},${yM - 30} L${xQ},${yM - 22} L${xQ + 4},${yM - 30}` }, gQ);

      // ── retrieve: cheap, and it runs over the WHOLE broadcast axis ────────────────────────────
      const gR = el('g', { class: fresh(0) }, main);
      G.box(gR, xRet, yM, 136, 44, L('lblRetrieve', 'retrieve'), L('lblRetrieveSub', 'bi-encoder'),
        'ncdrag-retrieve', 'ncdrag-retrieve-txt', 'ncdrag-sub');
      G.wire(gR, 'ncdrag-w ncdrag-w-flow', xRet + 68, yM, xHexK - 36, yM, { arrow: true });
      // HEXAGON = reindex / slice. This is the narrowing the widget used to draw as a stack of cards.
      G.hexagon(gR, xHexK, yM, L('lblTopK', 'top-K'), 'ncdrag-hex', 'ncdrag-hex-txt', 32, 20);
      G.text(gR, xHexK, 186, 'N → K', 'ncdrag-axis');
      G.wire(gR, 'ncdrag-w ncdrag-w-flow', xHexK + 32, yM, xRr - 66, yM, { arrow: true });
      G.text(gR, 421, 138, 'K', 'ncdrag-axis');            // ON the wire, clear of both glyphs it joins

      if (s >= 1) {
        // ── rerank: expensive, and affordable ONLY because the first hexagon already cut N to K ──
        const gRr = el('g', { class: fresh(1) }, main);
        G.box(gRr, xRr, yM, 124, 44, L('lblRerank', 'rerank'), L('lblRerankSub', 'cross-encoder'),
          'ncdrag-rerank', 'ncdrag-rerank-txt', 'ncdrag-sub');
        G.wire(gRr, 'ncdrag-w ncdrag-w-flow', xRr + 62, yM, xHexk - 34, yM, { arrow: true });
        G.hexagon(gRr, xHexk, yM, L('lblTopk', 'top-k'), 'ncdrag-hex', 'ncdrag-hex-txt', 30, 19);
        G.text(gRr, xHexk, 186, 'K → k', 'ncdrag-axis');
      }

      if (s >= 2) {
        // ── generate: the k documents AND the query, together. Two wires in, one answer out. ─────
        const gG = el('g', { class: fresh(2) }, main);
        G.wire(gG, 'ncdrag-w ncdrag-w-flow', xHexk + 30, yM, xGen - 50, yM, { arrow: true });
        G.text(gG, 670, 138, 'k', 'ncdrag-axis');
        /* THE GROUNDING ARC — the query's SECOND entry, and the reason this widget exists. It leaves the
           query chip and comes down into the TOP of the generator, so the generator visibly takes two
           inputs: the evidence, and the question the evidence was fetched for. */
        el('path', { class: 'ncdrag-w ncdrag-w-qarc', fill: 'none',
          d: `M${xQ + 50},${yQ} C${xQ + 180},${yQ - 26} ${xGen - 90},${yQ - 26} ${xGen},${yM - 30}` }, gG);
        el('circle', { cx: xQ + 50, cy: yQ, r: 3, class: 'ncdrag-qdot' }, gG);
        el('path', { class: 'ncdrag-w ncdrag-w-qarc', fill: 'none', style: 'stroke-linejoin:round',
          d: `M${xGen - 4},${yM - 30} L${xGen},${yM - 22} L${xGen + 4},${yM - 30}` }, gG);
        G.box(gG, xGen, yM, 96, 44, L('lblGenerate', 'generate'), L('lblGenerateSub', 'LLM'),
          'ncdrag-generate', 'ncdrag-generate-txt', 'ncdrag-sub');
        G.wire(gG, 'ncdrag-w ncdrag-w-out', xGen, yM + 22, xGen, yM + 54);
        el('path', { class: 'ncdrag-w ncdrag-w-out', fill: 'none', style: 'stroke-linejoin:round',
          d: `M${xGen - 4},${yM + 46} L${xGen},${yM + 54} L${xGen + 4},${yM + 46}` }, gG);
        el('rect', { class: 'ncdrag-answer', x: xGen - 46, y: yM + 58, width: 92, height: 30, rx: 8 }, gG);
        G.text(gG, xGen, yM + 78, L('lblAnswer', 'answer'), 'ncdrag-answer-txt');
      }

      G.legend(main, W / 2, H - 6, L('legMap',
        'region = the corpus axis N · hexagon = a slice (top-k) · the query enters TWICE'), 'ncdrag-legend', W - 40);
      prev = s;
    };
  },
});
