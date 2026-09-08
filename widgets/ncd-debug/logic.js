/* ncd-debug/logic.js — FIND THE BUG. Three broken circuits, in the neural-circuit-diagram lens.

   WHY THIS WIDGET EXISTS. Every other diagram in this course shows the RIGHT answer, and a notation
   that only ever draws correct things is decoration. Abbott's grammar earns its keep on the day it
   makes a MISTAKE visible — because a wire that does not connect is a picture, not a stack trace.
   These are three bugs a real implementation ships, ordered by how hard they are to catch any other way:

     0. K not transposed — a SHAPE bug. The cup can only contract two axes that MATCH; here d=4 meets
        n=3 and the wires simply do not join. A type checker catches this one. So does a glance.
     1. softmax over the wrong axis — a MEANING bug, and the interesting one. The shape is n×n before
        and n×n after, so every shape check in your stack passes. Nothing crashes; the model just
        learns nonsense. In NCD the triangle is drawn ACROSS the axis it normalises, so a triangle
        pointing the wrong way is visible even though the tensor shape is identical.
     2. heads never merged — a COMPOSITION bug. The h axis is left dangling, so the block's output is
        h×n×64 where the next block wants n×768. Blocks compose only because every sublayer preserves
        n×m; forget the concat and the stack stops fitting together.

   Every number comes from data/l15-attention.json (dk=4, params.d=768, memory.heads=12); the grid in
   step 1 is deliberately EMPTY — that bug is about an axis, not about values.
   Step 0 / 1 / 2 = bug 1 / 2 / 3. DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE. */
import { defineWidget } from '../_widget-base.js';
import { glyphs, stage, ledger } from '../_ncd.js';

export const mountNcdDebug = defineWidget({
  id: 'ncd-debug',
  rootClass: 'ncdd-root',
  exportName: 'mountNcdDebug',
  maxStep: 2,
  render({ host, data, labels, el }) {
    const A = (data && data.attention) || {};
    const P = (data && data.params) || {};
    const MEM = (data && data.memory) || {};
    const dk = A.dk != null ? A.dk : 4;          // the contracted dim, 4
    const n = 3;                                  // three tokens — the worked example's n
    const d = P.d != null ? P.d : 768;
    const h = MEM.heads != null ? MEM.heads : 12;
    const dHead = Math.round(d / h);              // 64
    const L = (k, fb) => (labels && labels[k]) || fb;
    const G = glyphs(el);

    const W = 820, H = 320;
    const wrap = stage(host);
    const svg = el('svg', { class: 'ncdd-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Three broken neural circuit diagrams') }, wrap);
    const lg = ledger(wrap, L('lgTitle', 'the bug'));

    const T = (p, x, y, s, cls, a) => G.text(p, x, y, s, cls, a || 'middle');
    const R = (p, cls, x, y, w, hh, rx) => el('rect', { class: cls, x, y, width: w, height: hh, rx: rx || 5 }, p);
    const chip = (p, cx, cy, w, s, cls, txtCls) => { R(p, cls, cx - w / 2, cy - 13, w, 26, 6); T(p, cx, cy + 4, s, txtCls); };
    function cross(p, cx, cy) {                   // the ✗ that marks where it breaks
      el('circle', { class: 'ncdd-x', cx, cy, r: 13 }, p);
      T(p, cx, cy + 5, '✗', 'ncdd-x-txt');
    }
    function header(p, s) {
      G.tagBox(p, W / 2, 31, s, 'ncdd-hdr', 'ncdd-hdr-txt', 13, 6).setAttribute('rx', 7);
    }
    /* the green "here is the fix" band, always last. It MEASURES its sentence (G.tagBox) instead of
       sizing itself from the string LENGTH: the guess had already been raised 6.8 → 7.4 px/char because
       12px mono Cyrillic advances wider than Latin and the RU sentence hung out of both ends of its own
       chip — and it would have burst again at the next font-size. (The overlap detector cannot see this
       one: it forgives any label sitting inside a shape wider than 240px, i.e. inside a band.) */
    function fixband(p, s) {
      G.tagBox(p, W / 2, H - 40, s, 'ncdd-fix', 'ncdd-fix-txt', 17, 8).setAttribute('rx', 8);
    }

    const LEDGERS = [
      { rows: [{ k: 'Q', v: `${n}×${dk}` }, { k: 'K', v: `${n}×${dk}` },
               { k: L('lgWant', 'must contract'), v: `d = ${dk}` },
               { k: L('lgGot', 'axes that met'), v: `${dk} ✗ ${n}`, tone: 'cost' },
               { k: L('lgFix', 'fix'), v: `Kᵀ (${dk}×${n})`, tone: 'good' }],
        note: L('lgN0', 'A cup can only contract two axes that MATCH. Here d=4 meets n=3, so there is nothing to contract — the wires do not join. In the formula QKᵀ the transpose is one character and easy to lose; on the diagram the circuit simply comes apart.') },
      { rows: [{ k: L('lgShapeIn', 'shape in'), v: 'n×n' }, { k: L('lgShapeOut', 'shape out'), v: 'n×n' },
               { k: L('lgNormOver', 'normalised over'), v: L('lgQueries', 'queries ✗'), tone: 'cost' },
               { k: L('lgShouldBe', 'should be'), v: L('lgKeys', 'keys ✓'), tone: 'good' },
               { k: L('lgTypeCheck', 'a shape check says'), v: 'OK', tone: 'cost' }],
        note: L('lgN1', 'This is the dangerous one. n×n goes in and n×n comes out, so every shape assertion in your stack passes and nothing crashes — the model just learns nonsense. NCD draws the triangle ACROSS the axis it normalises, so a triangle turned the wrong way is visible even when the shape is not.') },
      { rows: [{ k: L('lgPerHead', 'per head'), v: `n×${dHead}` },
               { k: `${L('lgAfter', 'after')} h=${h}`, v: `h×n×${dHead}`, tone: 'cost' },
               { k: L('lgNextWants', 'next block wants'), v: `n×${d}` },
               { k: L('lgFix', 'fix'), v: 'concat + L_O', tone: 'good' }],
        note: L('lgN2', 'The head axis was never put back. Blocks compose end to end only because every sublayer preserves the n×m shape — leave h dangling and the next block will not fit. Concat is not glue for convenience; it is the operation that returns the axis you split.') },
    ];

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', { class: 'ncd-fx' }, svg);   // each step is a different bug → animate the swap
      const g = main, s = Math.max(0, Math.min(2, step));
      const LG = LEDGERS[s];
      lg.set(LG.rows.map((r) => ({ ...r, state: 'on' })), LG.note);

      // ── bug 0: K not transposed — the axes at the cup do not match ───────────
      if (s === 0) {
        header(g, L('h0', 'bug 1 — K is not transposed'));
        const yQ = 108, yK = 186, yS = (yQ + yK) / 2, xL = 118, xCup = 348;
        T(g, 26, yQ - 22, 'x', 'ncdd-axis-in', 'start');
        [['Q', yQ], ['K', yK]].forEach(([nm, y]) => {
          G.wire(g, 'ncdd-w ncdd-w-in', 26, y, xL - 25, y);
          G.chippedL(g, xL, y, nm, 'ncdd-L', 'ncdd-L-txt');
          G.wire(g, 'ncdd-w ncdd-w-d', xL + 24, y, xCup - 62, y);
          T(g, (xL + xCup) / 2 - 16, y - 12, `${nm} : ${n}×${dk}`, 'ncdd-size');
        });
        // the two axes that actually meet at the cup — this is the bug, in two chips
        chip(g, xCup - 42, yQ, 28, String(dk), 'ncdd-chip-bad', 'ncdd-chipv');
        chip(g, xCup - 42, yK, 28, String(n), 'ncdd-chip-bad', 'ncdd-chipv');
        el('path', { class: 'ncdd-w ncdd-w-d', d: `M${xCup - 28},${yQ} Q${xCup - 6},${yS} ${xCup - 28},${yK}`, fill: 'none' }, g);
        G.cup(g, xCup, yS, 'ncdd-op-bad', 'ncdd-op-dot-bad');
        cross(g, xCup, yS);
        chip(g, xCup + 96, yS, 118, `${dk} ≠ ${n}`, 'ncdd-chip-bad', 'ncdd-chipv-bad');
        R(g, 'ncdd-void', xCup + 186, yS - 18, 176, 36, 8);
        T(g, xCup + 274, yS + 5, L('noContract', 'no contraction'), 'ncdd-void-txt');
        fixband(g, L('fix0', `fix: Kᵀ is ${dk}×${n} → (${n}×${dk})·(${dk}×${n}) = ${n}×${n} ✓`));
      }

      /* ── bug 1: softmax normalised over the wrong axis (shape-preserving!) ────
         THE ARGUMENT IS THE TRIANGLE, AND IT HAS TO BE ON THE PAGE. This figure used to make the
         family's best case for NCD — "turn the triangle and you can SEE it" — with two grids and some
         RED AND GREEN ARROWS: not one triangle anywhere, i.e. with exactly the non-NCD crutch the
         widget claims to defeat. Now the score matrix is drawn as what it IS: an n×n grid held between
         TWO WIRES — the query axis n (vertical) and the key axis m (horizontal) — and a softmax
         triangle sits ON one of them, expanding ALONG the axis it normalises.
         The two panels are the SAME PICTURE: same wires, same grid, same n×n shape in and out. The
         only difference is which wire carries the triangle (and the Σ=1 chips that follow from it).
         That is the entire lesson: one glyph turned a quarter turn, and only the picture can tell you. */
      if (s === 1) {
        header(g, L('h1', 'bug 2 — softmax over the wrong axis'));
        const CW = 36, CH = 34, gy = 106, gyBot = gy + 2 * CH + 30;   // 3×3 grid: 104 wide, 102 tall
        const yKey = 84;                                              // the key-axis wire, above the grid
        const colC = (gx, j) => gx + j * CW + 16, rowC = (i) => gy + i * CH + 15;
        const arrowDown = (x, y, cls) => el('path', { class: 'ncdd-w ' + cls, fill: 'none',
          d: `M${x - 4},${y - 8} L${x},${y} L${x + 4},${y - 8}`, style: 'stroke-linejoin:round' }, g);

        function panel(gx, bad) {
          const xv = gx - 34, cyT = (gy + gyBot) / 2;                 // the query-axis wire, left of the grid
          T(g, gx + 52, 56, bad ? L('badHdr', '✗ over queries') : L('okHdr', '✓ over keys'),
            bad ? 'ncdd-bad-hdr' : 'ncdd-ok-hdr');
          /* The two axes of the score matrix — the SAME two wires in both panels, at the same
             coordinates. The only asymmetry is that a wire BREAKS where the σ triangle sits on it: the
             glyph is IN the wire, not painted over it (which is also why the σ is never struck through). */
          if (bad) {                                                  // key axis: uninterrupted here
            G.wire(g, 'ncdd-w ncdd-w-ax', gx, yKey, gx + 104, yKey, { arrow: true });
          } else {                                                    // …and broken by σ in the correct panel
            G.wire(g, 'ncdd-w ncdd-w-ax', gx, yKey, gx + 34, yKey);
            G.wire(g, 'ncdd-w ncdd-w-ax', gx + 70, yKey, gx + 104, yKey, { arrow: true });
          }
          T(g, gx + 112, yKey + 4, L('axKeys', 'm · keys'), 'ncdd-axlbl', 'start');
          if (bad) {                                                  // query axis: broken by σ — the bug
            G.wire(g, 'ncdd-w ncdd-w-ax', xv, gy, xv, cyT - 18);
            G.wire(g, 'ncdd-w ncdd-w-ax', xv, cyT + 18, xv, gyBot);
          } else {
            G.wire(g, 'ncdd-w ncdd-w-ax', xv, gy, xv, gyBot);
          }
          arrowDown(xv, gyBot, 'ncdd-w-ax');
          T(g, xv, 96, L('axQueries', 'n · queries'), 'ncdd-axlbl');
          /* the n×n scores — deliberately EMPTY: this bug is about an axis, not about values. The cells
             carry `ncd-onwire` because the normalisation guide-arrows below are SUPPOSED to sweep across
             them: showing WHICH cells sum to 1 is the whole argument, so the guides run through the grid
             by design and the wire-through-shape check must not read that as a routing defect. */
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
            R(g, 'ncdd-cell ncd-onwire', gx + j * CW, gy + i * CH, CW - 4, CH - 4, 3);

          if (bad) {
            // σ EXPANDS DOWN the query axis → the columns are what sums to 1. Nothing crashes.
            for (let j = 0; j < 3; j++) {
              G.wire(g, 'ncdd-w ncdd-guide-bad', colC(gx, j), gy - 6, colC(gx, j), gyBot + 12, { dash: '4 3' });
              arrowDown(colC(gx, j), gyBot + 12, 'ncdd-guide-bad');
              chip(g, colC(gx, j), 234, 34, 'Σ=1', 'ncdd-chip-bad', 'ncdd-chipv-bad');
            }
            G.tri(g, xv, cyT, 'ncdd-tri-bad', 'ncdd-tri-txt-bad', 90);               // turned: ✗
          } else {
            // σ EXPANDS ALONG the key axis → each ROW is a distribution over the keys. Correct.
            for (let i = 0; i < 3; i++) {
              G.wire(g, 'ncdd-w ncdd-guide-ok', gx - 6, rowC(i), gx + 112, rowC(i), { dash: '4 3' });
              el('path', { class: 'ncdd-w ncdd-guide-ok', fill: 'none', style: 'stroke-linejoin:round',
                d: `M${gx + 104},${rowC(i) - 4} L${gx + 112},${rowC(i)} L${gx + 104},${rowC(i) + 4}` }, g);
              chip(g, gx + 134, rowC(i), 34, 'Σ=1', 'ncdd-chip-ok', 'ncdd-chipv-ok');
            }
            G.tri(g, gx + 52, yKey, 'ncdd-tri-ok', 'ncdd-tri-txt-ok', 0);             // as drawn: ✓
          }
        }
        panel(128, true);
        panel(528, false);

        T(g, W / 2, 142, 'n×n', 'ncdd-size');
        T(g, W / 2, 164, L('vs', 'vs'), 'ncdd-vs');
        T(g, W / 2, 188, 'n×n', 'ncdd-size');
        fixband(g, L('fix1', 'same wires, same n×n shape — only the triangle turned. No shape check can see it.'));
      }

      // ── bug 2: the head axis was never merged back ───────────────────────────
      if (s === 2) {
        header(g, L('h2', 'bug 3 — the heads were never merged'));
        const y = 138;
        // the broadcast region, with its tag drawn CLEAR of the border (the shared region() tucks the
        // tag onto the top edge, which the detector correctly reads as a label sitting on a stroke)
        const rx0 = 78, ry0 = y - 46, rw = 250;
        R(g, 'ncdd-region', rx0, ry0, rw, 96, 14);
        // the tag MEASURES itself and starts at the region's left inset — no character-count guess
        G.tagBox(g, rx0 + 23, ry0 - 10, L('tagHeads', `broadcast: h=${h} heads`),
          'ncdd-rtag', 'ncdd-rtag-txt', 9, 5, 'start').setAttribute('rx', 6);
        T(g, 22, y - 22, 'x', 'ncdd-axis-in', 'start');
        G.wire(g, 'ncdd-w ncdd-w-in', 22, y, 138, y);
        G.box(g, 208, y, 128, 46, L('lblAttn', 'attention'), `n×${dHead}`, 'ncdd-attn', 'ncdd-attn-txt', 'ncdd-size');
        G.wire(g, 'ncdd-w ncdd-w-bad', 328, y, 372, y);
        chip(g, 436, y, 118, `h×n×${dHead}`, 'ncdd-chip-bad', 'ncdd-chipv-bad');
        cross(g, 524, y);
        R(g, 'ncdd-void', 566, y - 24, 190, 48, 8);
        T(g, 661, y - 4, L('nextBlock', 'the next block'), 'ncdd-void-txt');
        T(g, 661, y + 14, `${L('wants', 'wants')} n×${d}`, 'ncdd-void-sub');
        // the fix, drawn as the circuit it should have been
        const fy = 236;
        T(g, 22, fy - 20, L('fixLbl', 'fix'), 'ncdd-ok-hdr', 'start');
        G.wire(g, 'ncdd-w ncdd-w-ok', 78, fy, 244, fy);
        G.hexagon(g, 288, fy, L('concat', 'concat'), 'ncdd-hex', 'ncdd-hex-txt', 44, 19);
        G.wire(g, 'ncdd-w ncdd-w-ok', 332, fy, 386, fy);
        G.chippedL(g, 414, fy, 'O', 'ncdd-L-ok', 'ncdd-L-txt-ok');
        G.wire(g, 'ncdd-w ncdd-w-ok', 438, fy, 500, fy, { arrow: true });
        chip(g, 566, fy, 110, `n×${d}`, 'ncdd-chip-ok', 'ncdd-chipv-ok');
        T(g, 660, fy + 5, '✓', 'ncdd-check', 'start');
      }

      T(g, W / 2, H - 8, L('legMap', 'a cup joins two EQUAL axes · the triangle points across the axis it normalises'),
        'ncdd-legend');
    };
  },
});
