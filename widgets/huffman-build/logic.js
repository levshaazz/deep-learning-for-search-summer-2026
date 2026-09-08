/* huffman-build/logic.js — L17 «построй дерево Хаффмана»: the merge log, REPLAYED.

   THE WIDGET COMPUTES NOTHING. It does not run Huffman: the generator already emitted the whole
   merge log (data/l17-entropy.json → huffman.nonDyadic.merges, in algorithm order, each entry
   carrying {pLeft, pRight, pParent, left[], right[]}). This figure only replays it — it removes the
   two nodes the log names, inserts the parent the log names, re-sorts the queue, and draws. Every
   number on screen (the probabilities, H, L̄, the excess, the ideal lengths, the dyadic contrast)
   is READ from data/, never derived here; the only arithmetic is the running Σ p(parent) whose end
   value is checked against data's avgCodeLen and discarded if it disagrees.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. Built on _widget-base.js.

   THE PICTURE — one 600-wide SVG, height from frameHeightFor():
     LEFT  (~40 %) the priority queue, sorted ascending; the two nodes the log merges NOW are warm,
                   a brace carries them into the parent chip.
     RIGHT (~60 %) the tree, root at the top, leaves parked at their final depth; edges labelled 0/1,
                   the codewords read off those edges once the root exists.
     BOTTOM        two bars — H (course red, FIXED) and L̄ (dark, climbing as Σ p(parent)) — with the
                   gap printed; at the last step the dyadic source4 pair, where the gap is exactly 0.

   Steps (maxStep = 4):
     0 → five leaves, sorted by probability; the red H rule is already on the floor.        s0
     1 → merge 1: I + O → 0,20  (merges[0]).                                                s1
     2 → merge 2: A + [IO] → 0,40  (merges[1]).                                             s2
     3 → merge 3: T + E → 0,60 (merges[2]); merges[3] closes the root — codewords readable. s3
     4 → the verdict: L̄ vs H, the excess, WHY (ideal −log₂p vs integer l), and the dyadic
         source where L̄ = H exactly.                                                        s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountHuffmanBuild = defineWidget({
  id: 'huffman-build',
  rootClass: 'hb-root',
  exportName: 'mountHuffmanBuild',
  maxStep: 4,
  render({ host, data, labels, el }) {
    /* ───────────────────────── data (every access guarded) ───────────────────────── */
    const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
    const obj = (v) => (v && typeof v === 'object' ? v : {});
    const nd = obj(obj(obj(data).huffman).nonDyadic);
    const probs = Object.keys(obj(nd.probs)).length ? nd.probs
      : { E: 0.35, T: 0.25, A: 0.20, O: 0.12, I: 0.08 };
    const merges = Array.isArray(nd.merges) ? nd.merges.filter((m) => m && Array.isArray(m.left) && Array.isArray(m.right)) : [];
    const codeLen = obj(nd.codeLen);
    const idealLen = obj(nd.idealLen);
    const H = num(nd.H, 2.1531);
    const LBAR = num(nd.avgCodeLen, 2.2);
    const EXCESS = num(nd.excess, 0.0469);
    const EXCESS_PCT = num(nd.excessPct, 2.2);
    const dy = obj(obj(data).source4);
    const dyH = num(dy.H, 1.75);
    const dyL = num(dy.avgCodeLen, 1.75);
    const dyCode = obj(dy.code);

    /* decimal separator follows the surface language (RU/TT use the comma, §2 of style-ru.md).
       render() re-runs on a language switch, so this re-reads on every swap. */
    const lang = (typeof document !== 'undefined' && document.documentElement
      ? (document.documentElement.dataset.lang || document.documentElement.lang || 'en') : 'en').slice(0, 2);
    const DEC = lang === 'en' ? '.' : ',';
    const fx = (v, d) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d).replace('.', DEC) : '—');
    const p2 = (v) => fx(v, 2);
    const b4 = (v) => fx(v, 4);
    const UNIT = labels.unitBits || 'bits';

    /* ───────────────── replay the merge log: queue states + the tree ───────────────── */
    const key = (syms) => syms.slice().sort().join('');
    let cur = Object.keys(probs)
      .map((s) => ({ syms: [s], p: num(probs[s], 0), leaf: true, sym: s }))
      .sort((a, b) => a.p - b.p);                       // leaves, ascending
    const states = [cur.slice()];                        // states[i+1] = the queue AFTER merges[i]
    const internals = [];
    for (const m of merges) {
      const L = cur.find((n) => key(n.syms) === key(m.left));
      const R = cur.find((n) => key(n.syms) === key(m.right));
      if (!L || !R) break;                               // log disagrees with the leaves → stop replaying
      const parent = { syms: L.syms.concat(R.syms), p: num(m.pParent, num(m.pLeft, 0) + num(m.pRight, 0)),
        leaf: false, left: L, right: R };
      L.side = 'left'; R.side = 'right';                 // which edge (0 / 1) arrives from above
      internals.push(parent);
      cur = cur.filter((n) => n !== L && n !== R);
      cur.push(parent);                                  // the new node joins the queue …
      cur = cur.slice().sort((a, b) => a.p - b.p);       // … and the queue re-sorts (stable: ties keep order)
      states.push(cur.slice());
    }
    const root = internals.length ? internals[internals.length - 1] : null;

    // depths + the left→right leaf order, both read off the replayed tree
    const leafOrder = [];
    (function walk(n, d) {
      if (!n) return;
      n.depth = d;
      if (n.leaf) { leafOrder.push(n); return; }
      walk(n.left, d + 1); walk(n.right, d + 1);
    })(root, 0);
    if (!leafOrder.length) { states[0].forEach((n) => { n.depth = 0; leafOrder.push(n); }); }
    const maxDepth = leafOrder.reduce((m, n) => Math.max(m, n.depth || 0), 0);

    // codewords, read off the edges (left = 0, right = 1) — the picture's own reading, not an algorithm
    const code = {};
    (function bits(n, s) {
      if (!n) return;
      if (n.leaf) { code[n.sym] = s || '0'; return; }
      bits(n.left, s + '0'); bits(n.right, s + '1');
    })(root, '');

    /* Which queue state + which merge each step shows. Step 3 fires TWO merges (T+E, then the root),
       so it shows the queue as it stands between them with the final pair warm. */
    const si = (i) => states[Math.min(i, states.length - 1)] || [];
    const mi = (i) => (i >= 0 && i < merges.length ? merges[i] : null);
    const QSPEC = [{ st: si(0), m: null }, { st: si(0), m: mi(0) }, { st: si(1), m: mi(1) },
      { st: si(3), m: mi(3) }, { st: si(4), m: null }];

    /* Σ p(parent) after each step IS the average code length — a running total over the log, not a
       computation of the code. Trust it only if it lands on data's avgCodeLen. */
    const runSum = [0];
    merges.forEach((m, i) => { runSum[i + 1] = runSum[i] + num(m.pParent, 0); });
    const sumOK = merges.length >= 4 && Math.abs(runSum[merges.length] - LBAR) < 5e-4;
    const lbarAt = (k) => (k <= 0 ? 0 : k >= 3 ? LBAR : (sumOK ? runSum[Math.min(k, runSum.length - 1)] : 0));

    /* ───────────────────────────── geometry ───────────────────────────── */
    const W = 600;
    const LX = 14, QW = 136, QTOP = 52, QH = 22, QGAP = 4;      // queue column: rows 14..150
    const CHIPX = 170, CHIPW = 62;
    const RX = 250;                                             // tree column starts here
    const NW = 44, NH = 20;                                     // node box
    const SLOT0 = 274, SLOT1 = 546;
    const nLeaf = Math.max(1, leafOrder.length);
    const slotX = (i) => (nLeaf > 1 ? SLOT0 + i * ((SLOT1 - SLOT0) / (nLeaf - 1)) : (SLOT0 + SLOT1) / 2);
    const LEVEL0 = 94, LEVELH = maxDepth > 0 ? Math.min(46, 138 / maxDepth) : 46;
    const levelY = (d) => LEVEL0 + d * LEVELH;
    const rowTop = (i) => QTOP + i * (QH + QGAP);
    const rowMid = (i) => rowTop(i) + QH / 2;

    const BX = 48, BMAX = 400;                                  // bars: 48 .. 448
    const SCALE = Math.max(H, LBAR, 0.001) * 1.18;
    const wOf = (v) => Math.max(1, BMAX * Math.min(1, Math.max(0, v) / SCALE));

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg hb-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // layer bookkeeping (same shape as infonce-calc): a named bucket revealed from step `from`
    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };
    const txt = (x, y, cls, s, anchor) => {
      const t = el('text', { x, y, class: cls }, svg);
      if (anchor) t.setAttribute('text-anchor', anchor);
      t.textContent = s == null ? '' : String(s);
      return t;
    };

    /* ── title + column heads ── */
    layer('head', 0);
    add('head', txt(LX, 18, 'hb-title', labels.head || 'build the Huffman tree'));
    add('head', txt(LX, 42, 'hb-head', labels.queueHead || 'queue (ascending)'));
    add('head', txt(RX, 42, 'hb-head', labels.treeHead || 'the tree'));

    /* ── LEFT: five reusable queue rows (content swaps per step; nothing is ever stacked) ── */
    const QROWS = 5;
    const qrow = [];
    for (let i = 0; i < QROWS; i++) {
      layer('q' + i, 0);
      const box = add('q' + i, el('rect', { x: LX, y: rowTop(i), width: QW, height: QH, rx: 5, class: 'hb-qrow' }, svg));
      const sym = add('q' + i, txt(LX + 8, rowMid(i) + 4, 'hb-qsym', ''));
      const pv = add('q' + i, txt(LX + QW - 8, rowMid(i) + 4, 'hb-qp', '', 'end'));
      qrow.push({ box, sym, pv });
    }
    /* the brace: the two nodes at the TOP of the queue are always the pair the log merges, so the
       brace + parent chip live at a fixed place (rows 0–1) and only toggle. */
    layer('brace', 1);
    const braceMid = (rowMid(0) + rowMid(1)) / 2;
    add('brace', el('path', {
      d: `M ${LX + QW + 4} ${rowMid(0)} H ${LX + QW + 12} V ${braceMid} H ${CHIPX - 4}`
       + ` M ${LX + QW + 4} ${rowMid(1)} H ${LX + QW + 12} V ${braceMid}`,
      class: 'hb-brace', fill: 'none' }, svg));
    add('brace', el('rect', { x: CHIPX, y: braceMid - QH / 2, width: CHIPW, height: QH, rx: 5, class: 'hb-chip' }, svg));
    const chipVal = add('brace', txt(CHIPX + CHIPW / 2, braceMid + 4, 'hb-chipval', '', 'middle'));

    /* ── LEFT (step 4): why the gap exists — the ideal length beside the integer one ── */
    layer('tbl', 4);
    add('tbl', txt(LX, 196, 'hb-head', labels.tableHead || 'ideal vs paid length'));
    const CS = LX + 6, CP = 60, CI = 110, CL = 165;
    add('tbl', txt(CS, 214, 'hb-th', labels.colSym || 'sym'));
    add('tbl', txt(CP, 214, 'hb-th', labels.colP || 'p'));
    add('tbl', txt(CI, 214, 'hb-th', labels.colIdeal || '−log₂ p'));
    add('tbl', txt(CL, 214, 'hb-th', labels.colLen || 'len'));
    Object.keys(probs).forEach((s, i) => {
      const y = 230 + i * 16;
      add('tbl', txt(CS, y, 'hb-td hb-td-sym', s));
      add('tbl', txt(CP, y, 'hb-td', p2(num(probs[s], 0))));
      add('tbl', txt(CI, y, 'hb-td hb-ideal', b4(num(idealLen[s], NaN))));
      add('tbl', txt(CL, y, 'hb-td hb-paid', num(codeLen[s], NaN)));
    });

    /* ── RIGHT: the tree. Leaves are parked at their final depth from the start; the internal nodes
          and their 0/1 edges arrive with the merge that creates them. ── */
    const nodeBox = (n, cx, cy, cls) => {
      const g = [];
      g.push(el('rect', { x: cx - NW / 2, y: cy - NH / 2, width: NW, height: NH, rx: 5, class: cls }, svg));
      const t = el('text', { x: cx, y: cy + 4, class: 'hb-nsym' }, svg);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = n.leaf ? n.sym : n.syms.join('');
      g.push(t);
      return g;
    };
    leafOrder.forEach((n, i) => { n.cx = slotX(i); n.cy = levelY(n.depth || 0); });
    // an internal node sits above the midpoint of its two children
    for (const n of internals) {
      n.cx = ((n.left && n.left.cx) + (n.right && n.right.cx)) / 2;
      n.cy = levelY(n.depth || 0);
    }
    /* A leaf whose parent does not exist yet has no depth to stand at, so it waits on the floor and
       RISES to its level on the very step that connects it — the picture never asserts a depth the
       replay has not reached. (Leaves already at the deepest level simply never move.) */
    const parentStep = (n) => {
      const i = internals.findIndex((p) => p.left === n || p.right === n);
      return i < 0 ? 0 : Math.min(i + 1, 3);
    };
    layer('leaves', 0);
    const leafG = [];
    const FLOOR = levelY(maxDepth);
    leafOrder.forEach((n) => {
      const g = el('g', { class: 'hb-leafg' }, svg);
      add('leaves', g);
      el('rect', { x: n.cx - NW / 2, y: n.cy - NH / 2, width: NW, height: NH, rx: 5, class: 'hb-node hb-leaf' }, g);
      const t = el('text', { x: n.cx, y: n.cy + 4, class: 'hb-nsym' }, g);
      t.setAttribute('text-anchor', 'middle'); t.textContent = n.sym;
      const pt = el('text', { x: n.cx, y: n.cy + NH / 2 + 12, class: 'hb-np' }, g);
      pt.setAttribute('text-anchor', 'middle'); pt.textContent = p2(n.p);
      leafG.push({ g, dy: FLOOR - n.cy, at: parentStep(n) });
    });
    const newNodes = [];                                        // [{els, at}] — warm on the step that creates it
    internals.forEach((n, i) => {
      const at = Math.min(i + 1, 3);                            // merges 3 and 4 both land on step 3
      const name = 'in' + i;
      layer(name, at);
      const els = nodeBox(n, n.cx, n.cy, 'hb-node hb-inner');
      els.forEach((e) => add(name, e));
      // the probability label leans AWAY from the incoming edge (left child → left, right child → right)
      const isRight = n.side === 'right';
      const anchor = n === root ? 'middle' : (isRight ? 'start' : 'end');
      const px = n === root ? n.cx : (isRight ? n.cx + 8 : n.cx - 8);
      add(name, txt(px, n.cy - NH / 2 - 6, 'hb-np', p2(n.p), anchor));
      // the two edges, each with its bit
      [[n.left, '0', -1], [n.right, '1', 1]].forEach(([c, bit, dir]) => {
        if (!c) return;
        add(name, el('line', { x1: n.cx, y1: n.cy + NH / 2, x2: c.cx, y2: c.cy - NH / 2, class: 'hb-edge' }, svg));
        const mx = (n.cx + c.cx) / 2, my = (n.cy + c.cy) / 2;
        add(name, txt(mx + dir * 6, my + 4, 'hb-bit', bit, dir < 0 ? 'end' : 'start'));
      });
      newNodes.push({ els: layers[name].nodes, at });
    });

    /* ── RIGHT: the codewords, read off the edges once the root exists ── */
    layer('code', 3);
    add('code', txt(RX, 272, 'hb-head', labels.codeHead || 'read the codewords off the edges'));
    add('code', txt(RX, 290, 'hb-code',
      Object.keys(probs).map((s) => s + ' ' + (code[s] || '?')).join('  ·  ')));

    /* ── BOTTOM: the two bars. H is the floor and never moves; L̄ climbs onto it. ── */
    layer('rule1', 0);
    add('rule1', el('line', { x1: LX, y1: 302, x2: W - LX, y2: 302, class: 'hb-rule' }, svg));
    layer('barH', 0);
    add('barH', txt(LX, 323, 'hb-barlbl', 'H'));
    add('barH', el('rect', { x: BX, y: 310, width: BMAX, height: 18, rx: 4, class: 'hb-barbg' }, svg));
    add('barH', el('rect', { x: BX, y: 310, width: wOf(H), height: 18, rx: 4, class: 'hb-barH' }, svg));
    add('barH', txt(BX + wOf(H) + 8, 323, 'hb-barval hb-valH', b4(H) + ' ' + UNIT));

    layer('barL', 1);
    add('barL', txt(LX, 349, 'hb-barlbl', 'L̄'));
    add('barL', el('rect', { x: BX, y: 336, width: BMAX, height: 18, rx: 4, class: 'hb-barbg' }, svg));
    const barL = add('barL', el('rect', { x: BX, y: 336, width: 1, height: 18, rx: 4, class: 'hb-barL' }, svg));
    const valL = add('barL', txt(BX + 8, 349, 'hb-barval hb-valL', ''));

    layer('gap', 3);
    const gapT = add('gap', txt(LX, 370, 'hb-gap', ''));

    /* ── BOTTOM (step 4): the dyadic source, where the same construction pays exactly H ── */
    layer('dyad', 4);
    add('dyad', el('line', { x1: LX, y1: 382, x2: W - LX, y2: 382, class: 'hb-rule' }, svg));
    add('dyad', txt(LX, 398, 'hb-head', labels.dyadHead || 'a dyadic source: L̄ = H exactly'));
    add('dyad', txt(LX, 414, 'hb-barlbl', 'H'));
    add('dyad', el('rect', { x: BX, y: 404, width: BMAX, height: 14, rx: 3, class: 'hb-barbg' }, svg));
    add('dyad', el('rect', { x: BX, y: 404, width: wOf(dyH), height: 14, rx: 3, class: 'hb-barH' }, svg));
    add('dyad', txt(BX + wOf(dyH) + 8, 414, 'hb-barval hb-valH', b4(dyH) + ' ' + UNIT));
    add('dyad', txt(LX, 434, 'hb-barlbl', 'L̄'));
    add('dyad', el('rect', { x: BX, y: 424, width: BMAX, height: 14, rx: 3, class: 'hb-barbg' }, svg));
    add('dyad', el('rect', { x: BX, y: 424, width: wOf(dyL), height: 14, rx: 3, class: 'hb-barL' }, svg));
    add('dyad', txt(BX + wOf(dyL) + 8, 434, 'hb-barval hb-valL', b4(dyL) + ' ' + UNIT));
    add('dyad', txt(LX, 458, 'hb-gap hb-gap-zero',
      (labels.gapLabel || 'L̄ − H') + ' = ' + b4(Math.max(0, dyL - dyH)) + ' ' + UNIT));
    add('dyad', txt(RX, 458, 'hb-code',
      Object.keys(dyCode).map((s) => s + ' ' + dyCode[s]).join(' · ')));

    const H_SVG = frameHeightFor(462, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H_SVG}`);

    /* ───────────────────────────── per-step update ───────────────────────────── */
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      // the node born on THIS step glows warm; older ones cool down
      for (const nn of newNodes) {
        for (const e of nn.els) e.classList.toggle('is-new', k === nn.at);
      }
      // leaves wait on the floor until the merge that gives them a depth
      for (const L of leafG) L.g.setAttribute('transform', k >= L.at ? 'translate(0,0)' : `translate(0,${L.dy})`);

      // LEFT — the queue as the log leaves it, with the pair that merges now in warm
      const spec = QSPEC[Math.max(0, Math.min(QSPEC.length - 1, k))] || QSPEC[0];
      const st = spec.st || [];
      const hot = spec.m ? [key(spec.m.left), key(spec.m.right)] : [];
      for (let i = 0; i < QROWS; i++) {
        const n = st[i], r = qrow[i];
        const show = !!n;
        r.box.classList.toggle('is-hidden', !show);
        r.sym.classList.toggle('is-hidden', !show);
        r.pv.classList.toggle('is-hidden', !show);
        if (!show) continue;
        const warm = hot.indexOf(key(n.syms)) >= 0;
        r.box.classList.toggle('is-merge', warm);
        r.sym.classList.toggle('is-merge', warm);
        r.pv.classList.toggle('is-merge', warm);
        r.sym.textContent = n.leaf ? n.sym : n.syms.join('');
        r.pv.textContent = p2(n.p);
      }
      const braceOn = !!spec.m;
      for (const node of layers.brace.nodes) node.classList.toggle('is-hidden', !braceOn);
      if (braceOn) chipVal.textContent = p2(num(spec.m.pParent, 0));

      // BOTTOM — L̄ climbs; from step 3 it is data's avgCodeLen, before that the running Σ p(parent)
      const lv = lbarAt(k);
      barL.setAttribute('width', String(Math.max(1, wOf(lv))));
      valL.setAttribute('x', String(BX + wOf(lv) + 8));
      valL.textContent = k >= 3
        ? b4(LBAR) + ' ' + UNIT
        : (lv > 0 ? (labels.partialLabel || 'Σ p(parent) so far') + ' = ' + p2(lv) : '');
      if (k >= 3) {
        gapT.textContent = (labels.gapLabel || 'L̄ − H') + ' = ' + b4(EXCESS) + ' ' + UNIT
          + '  (+' + fx(EXCESS_PCT, 1) + ' %)';
      }
    };
  },
});
