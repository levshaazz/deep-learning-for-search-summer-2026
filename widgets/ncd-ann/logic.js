/* ncd-ann/logic.js — approximate nearest-neighbour search (HNSW / IVF) in the neural-circuit-diagram
   lens (Abbott & Zardini v2). The ORIGINAL claim of this widget, which the notation makes literal:

   EXACT search broadcasts the query over ALL N documents. APPROXIMATE search broadcasts it over a small
   candidate set C ≪ N, reached by walking a proximity graph. It is the SAME CIRCUIT — same query wire,
   same contraction cup, same dot product. The ONLY thing that changed is the SIZE of the axis you
   broadcast over. In NCD that is not a metaphor: the dashed broadcast REGION physically shrinks, and
   the cups in front of the documents it no longer encloses are simply ABSENT.

   TWO WORDS THE DIAGRAM MUST KEEP APART — and the reason this widget was rebuilt.
   SCORED ≠ EXPANDED. A graph search does not only score the nodes it steps on: to choose the next hop
   it must compute q·dᵢ for EVERY NEIGHBOUR of every node it expands. So the candidate set C — the set
   that gets cups — is the CLOSED NEIGHBOURHOOD of the walk: the visited nodes PLUS all their
   neighbours. d5 and d6 are never stepped on, yet they carry cups: scored, found unpromising, never
   expanded. That is why the bill is |C| · d and not hops · d — |C| ≈ hops · degree (in HNSW: efSearch
   × M, M = 16…64). A ledger that charges only for the hops undercounts by the degree of the graph.

   AND THE MISS MUST BE A MISS THE ALGORITHM CAN ACTUALLY MAKE. The first cut of this widget drew d10
   as a direct neighbour of the last visited node — a miss that is impossible, because SEARCH-LAYER
   scores every neighbour of every expanded node, so d10 would have been scored and, being a true
   neighbour, returned. A REAL ANN miss is a LOCAL OPTIMUM: the true neighbour is ≥ 2 hops from every
   node the search ever expanded. Here d10's only routes in are through d5 and d6 — the frontier, which
   was scored but never expanded — so d10 is never even looked at. That is recall < 1, drawn honestly.

   NO INVENTED NUMBERS. The course has no grounded ANN recall/latency figures in data/, so this widget
   is SYMBOLIC end to end: N, C ≪ N, |C| ≈ hops · degree, N·d vs ≈ |C|·d, recall 1.0 vs < 1.0. A
   plausible-looking fake recall would be worse than no recall at all, so there isn't one — not in the
   ledger, not in a caption.

   Colour is meaning: --warm = the query wire (course query-marker canon) and the graph walk it pays
   for · --c-violet = the broadcast axis / the region C (the
   star) · --c-green = a true neighbour that IS scored
   · --c-red = ONLY the missed neighbour and the edges into it that were never crossed · --ink* /
   --rule* = structure, and documents outside C fade (no cup ever ran on them).

   Step 0 = exact (broadcast over N; C = N) · 1 = approximate (the region shrinks to C = the walk plus
   its neighbours) · 2 = the price (a true neighbour 2 hops out, behind the frontier → recall < 1).
   DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdAnn = defineWidget({
  id: 'ncd-ann',
  rootClass: 'ncdann-root',
  exportName: 'mountNcdAnn',
  maxStep: 2,
  render({ host, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);
    // H carries a two-line budget for the legend below the figure: the key line wraps by measurement
    // (Cyrillic runs wider than Latin, and wider still under CI's Linux Chromium), and a wrap that has
    // nowhere to go just trades an overflowing line for a collision with the cost label above it.
    const W = 860, H = 430;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdann-svg', viewBox: `0 0 ${W} ${H}`, role: 'img',
      'aria-label': L('alt', 'Exact vs approximate nearest-neighbour search as a neural circuit diagram') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'cost & recall'));

    /* ── the index, as a proximity graph ──────────────────────────────────────
       Ten indexed documents (pentagons = pre-computed, looked-up vectors), wired into a proximity
       graph. POSITION IS NOT DISTANCE — this is a graph drawing, not a vector space; relevance is
       marked by colour, never by where a node happens to sit. d1 is the entry point; the walk
       d1→d2→d3→d4 EXPANDS four nodes; d4 and d10 are the two TRUE neighbours of q. */
    const NODES = [
      { x: 252, y: 168 }, { x: 334, y: 152 }, { x: 392, y: 254 }, { x: 470, y: 160 }, { x: 545, y: 250 },
      { x: 540, y: 145 }, { x: 740, y: 130 }, { x: 805, y: 220 }, { x: 745, y: 300 }, { x: 655, y: 205 },
    ];
    /* The graph is built to make the miss REAL. Every edge out of an expanded node (0,1,2,3) lands in
       {0..5} — so d10 (9) touches no expanded node at all. Its only ways in are d5 (4) and d6 (5), the
       frontier: scored, never expanded. Verified: min-hop distance from any expanded node to d10 = 2.
       The walk also runs strictly LEFT→RIGHT (x increases at every hop) — the shared wire() glyph draws
       its arrowhead as a fixed rightward chevron, so a leftward hop would render pointing backwards. */
    const EDGES = [[0, 1], [1, 2], [2, 3], [0, 2],   // the cluster the walk moves through
                   [2, 4], [3, 5],                    // the walk's frontier: d5 and d6 — scored, not expanded
                   [4, 9], [5, 9],                    // the ONLY two ways into d10 — and both start on the frontier
                   [5, 6], [6, 7], [7, 8], [8, 9]];   // the far side of the index, never touched
    const WALK = [0, 1, 2, 3];        // the nodes the search EXPANDS (entry → hop → hop → the local optimum)
    /* C — the CLOSED NEIGHBOURHOOD of the walk, and therefore the set that gets cups. To pick the next
       hop the search must score every neighbour of every node it expands, so "scored" is strictly bigger
       than "walked". Computing it (rather than typing it) is what keeps the picture honest: change an
       edge and the cups follow. */
    // ONE hop out of the walk, never two — iterate over WALK (a fixed list), never over the growing set,
    // or the closure would run away down the graph and cup the very node that must stay un-scored.
    const CAND = new Set(WALK);
    WALK.forEach((v) => EDGES.forEach(([i, j]) => { if (i === v) CAND.add(j); else if (j === v) CAND.add(i); }));
    const FRONTIER = [...CAND].filter((i) => !WALK.includes(i));  // scored, never expanded → d5, d6
    const GOLD = new Set([3, 9]);     // the true neighbours of q
    const MISS = 9;                   // the true neighbour NO expanded node can see (2 hops out)
    const HOP_SIDE = [1, -1, 1];      // which side of each walk edge its hop badge sits on

    // full broadcast (N) vs the shrunken broadcast (C) — SAME left edge, so the query wire never moves.
    // RGN_C encloses exactly the SCORED set {d1…d6}: the walk AND its frontier. Width stays > 300 so the
    // region reads as a backdrop, not as a chip a label could burst.
    const RGN_N = { x: 200, y: 86, w: 630, h: 266 };
    const RGN_C = { x: 200, y: 114, w: 385, h: 216 };
    const R = 22;                     // wires stop this far from a node centre → no wire touches a label

    const trim = (a, b, r) => {
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      return { x1: a.x + ux * r, y1: a.y + uy * r, x2: b.x - ux * r, y2: b.y - uy * r, ux, uy };
    };

    function hopBadge(g, i) {          // the hop number, offset OFF the edge so no wire strikes it
      const a = NODES[WALK[i]], b = NODES[WALK[i + 1]];
      const t = trim(a, b, 0);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, s = HOP_SIDE[i] * 17;
      const cx = mx + (-t.uy) * s, cy = my + t.ux * s;
      el('circle', { class: 'ncdann-hop', cx, cy, r: 9 }, g);
      G.text(g, cx, cy + 3.5, String(i + 1), 'ncdann-hop-txt');
    }

    // ── the ledger: the axis shrank, the bill shrank with it, and so did the guarantee ────────────
    // The bill is |C|·d, NOT hops·d. |C| ≈ hops · degree: every hop drags the whole neighbourhood of the
    // node it lands on into the scored set. Symbolic — the course has no grounded ANN measurement.
    const HOPS = L('lgHops', 'hops'), DEG = L('lgDeg', 'degree');
    const CxDEG = '≈ ' + HOPS + ' · ' + DEG;
    const kAxis = L('lgAxis', 'broadcast axis'), kCups = L('lgCups', 'contractions (cups)');
    const kCand = L('lgCands', 'scored set |C|');
    const kWork = L('lgWork', 'work / query'), kRec = L('lgRecall', 'recall');
    const LEDGER = [
      { rows: [{ k: kAxis, v: 'N', state: 'new' }, { k: kCand, v: '= N', state: 'new' },
               { k: kCups, v: 'N', state: 'new' },
               { k: kWork, v: 'N · d', state: 'new', tone: 'cost' },
               { k: kRec, v: '1.0', state: 'new', tone: 'good' }],
        note: L('lgN0', 'Exact search is the special case C = N: you broadcast over the whole corpus, so you pay for the whole corpus — N contractions, N·d multiplications. In exchange you get the only thing exact search can promise: recall 1.0, by construction.') },
      { rows: [{ k: kAxis, v: 'C ≪ N', state: 'new', tone: 'good' },
               { k: kCand, v: CxDEG, state: 'new', tone: 'good' },
               { k: kCups, v: '|C|', state: 'new', tone: 'good' },
               { k: kWork, v: '≈ |C| · d', state: 'new', tone: 'good' },
               { k: kRec, v: '?', state: 'new' }],
        note: L('lgN1', 'The circuit is unchanged; only the axis shrank. C is not the walk — it is the walk PLUS every neighbour of a walked node, because to choose the next hop you must score them all. So |C| ≈ hops · degree, still ≪ N, and the bill follows |C|, not the corpus. What recall survives is now an open question, not a guarantee.') },
      { rows: [{ k: kAxis, v: 'C ≪ N', state: 'on', tone: 'good' },
               { k: kCand, v: CxDEG, state: 'on' },
               { k: kCups, v: '|C|', state: 'on' },
               { k: kWork, v: '≈ |C| · d', state: 'on', tone: 'good' },
               { k: kRec, v: '< 1.0', state: 'new', tone: 'cost' }],
        note: L('lgN2', 'A true neighbour that no expanded node can see is a neighbour you never scored. That is what recall < 1 means — and it is not a bug, it is the deal: you traded a guarantee for a budget.') },
    ];

    let main = null, prev = -1;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const s = Math.max(0, Math.min(2, step));
      const fresh = (k) => (k > prev && k <= s ? 'ncd-fx' : '');
      const LG = LEDGER[s];
      lg.set(LG.rows, LG.note);
      const approx = s >= 1;

      // ── the query: one wire, the same in every step ───────────────────────────
      const gQ = el('g', { class: fresh(0) }, main);
      G.text(gQ, 22, 18, L('lblQuery', 'query'), 'ncdann-qlbl', 'start');
      el('rect', { class: 'ncdann-qchip', x: 22, y: 26, width: 168, height: 30, rx: 8 }, gQ);
      G.text(gQ, 106, 46, '“' + L('query', 'neural search') + '”', 'ncdann-qchip-txt');
      G.wire(gQ, 'ncdann-w ncdann-w-q', 106, 56, 106, 217);
      G.wire(gQ, 'ncdann-w ncdann-w-q', 106, 217, 232, 217, { arrow: true });
      G.text(gQ, 118, 130, 'q · d', 'ncdann-axis', 'start');

      // ── the broadcast axis, made concrete ─────────────────────────────────────
      // exact: ONE region over all N. approximate: the SAME region kept as a ghost (the corpus did
      // not shrink!) with the live, shrunken C-region drawn inside it. The shrink IS the argument —
      // and C is the SCORED set, so the region encloses the frontier (d5, d6) too, not just the walk.
      const gR = el('g', { class: fresh(0) }, main);
      G.region(gR, RGN_N.x, RGN_N.y, RGN_N.w, RGN_N.h,
        approx ? L('tagNghost', 'N · the corpus (unchanged)') : L('tagN', 'N · broadcast over EVERY document'),
        approx ? 'ncdann-region-ghost' : 'ncdann-region',
        approx ? 'ncdann-tag-ghost' : 'ncdann-tag',
        approx ? 'ncdann-tag-ghost-txt' : 'ncdann-tag-txt');
      if (approx) {
        const gC = el('g', { class: fresh(1) }, main);
        G.region(gC, RGN_C.x, RGN_C.y, RGN_C.w, RGN_C.h,
          L('tagC', 'C · scored: walk + neighbours'), 'ncdann-region', 'ncdann-tag', 'ncdann-tag-txt');
      }

      // ── the proximity graph (structure — it never changes; only the region does) ──
      const gE = el('g', { class: fresh(0) }, main);
      EDGES.forEach(([i, j]) => {
        const t = trim(NODES[i], NODES[j], R);
        G.wire(gE, 'ncdann-edge', t.x1, t.y1, t.x2, t.y2);
      });

      // ── the graph walk: how C is REACHED — not chosen at random ───────────────
      if (approx) {
        const gW = el('g', { class: fresh(1) }, main);
        for (let i = 0; i < WALK.length - 1; i++) {
          const t = trim(NODES[WALK[i]], NODES[WALK[i + 1]], 24);
          G.wire(gW, 'ncdann-walk', t.x1, t.y1, t.x2, t.y2, { arrow: true });
        }
        for (let i = 0; i < WALK.length - 1; i++) hopBadge(gW, i);
        G.text(gW, NODES[0].x, NODES[0].y - 26, L('lblEntry', 'entry point'), 'ncdann-entry');
        // the frontier, named: these two carry cups and were never stepped on. SCORED ≠ EXPANDED — the
        // one distinction the old picture could not draw, and the one the miss depends on. The label
        // sits between the two frontier nodes, so it can only be read as belonging to them.
        const fx = (NODES[FRONTIER[0]].x + NODES[FRONTIER[1]].x) / 2 - 5;
        G.text(gW, fx, 196, L('lblScored', 'scored,'), 'ncdann-frontier');
        G.text(gW, fx, 210, L('lblNotExp', 'not expanded'), 'ncdann-frontier');
      }

      // ── the documents, and the cups in front of them (or the cups that are ABSENT) ──
      const gD = el('g', { class: fresh(0) }, main);
      const gFaint = el('g', { class: 'ncdann-faint' }, gD);
      NODES.forEach((n, i) => {
        const scored = !approx || CAND.has(i);          // a cup exists ⇔ this document is broadcast to
        const missed = s === 2 && i === MISS;
        const g = (scored || missed) ? gD : gFaint;     // un-scored documents fade into the background
        const cls = missed ? 'ncdann-node ncdann-node-miss'
          : GOLD.has(i) ? 'ncdann-node ncdann-node-gold' : 'ncdann-node';
        G.pentagon(g, n.x, n.y, 'd' + (i + 1), cls, missed ? 'ncdann-node-txt-miss' : 'ncdann-node-txt');
        if (scored) G.cup(g, n.x, n.y + 30, 'ncdann-cup', 'ncdann-cup-dot');
      });

      // ── the price ─────────────────────────────────────────────────────────────
      if (approx) {
        const gU = el('g', { class: fresh(1) }, main);
        G.text(gU, 700, 340, L('lblUnscored', 'N − C never scored'), 'ncdann-unscored');
      }
      if (s === 2) {
        const gM = el('g', { class: fresh(2) }, main);
        // The two edges into d10 — its ONLY routes in from this side of the index — both start at a
        // frontier node: scored, never expanded, so neither edge was ever crossed. d10 sits 2 hops from
        // every node the search opened. Recall < 1 is not an abstraction here; it is these two wires.
        FRONTIER.forEach((f) => {
          if (!EDGES.some(([i, j]) => (i === f && j === MISS) || (j === f && i === MISS))) return;
          const t = trim(NODES[f], NODES[MISS], R);
          G.wire(gM, 'ncdann-edge-miss', t.x1, t.y1, t.x2, t.y2, { dash: '5 4' });
        });
        G.text(gM, NODES[MISS].x, 272, L('lblMiss', 'never scored'), 'ncdann-miss');
        G.text(gM, NODES[MISS].x, 290, L('lblRecall', 'recall < 1.0'), 'ncdann-miss');
      }

      G.text(main, 515, 374, approx ? L('costAnn', 'cost:  ≈ |C| · d') : L('costExact', 'cost:  N · d'), 'ncdann-cost');
      G.legend(main, W / 2, H - 10, L('legMap',
        'pentagon = a document vector · ⌣ = one contraction q·dᵢ · dashed = the broadcast axis · orange = the graph walk'),
        'ncdann-legend', W - 40);
      prev = s;
    };
  },
});
