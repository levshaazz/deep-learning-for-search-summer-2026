/* embedding-space/logic.js — L5 'climb-word2vec' / 'climb-analogy' beat: words become points on a
   2-D "map of meaning", and the relation king − man + woman lands on queen.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All NUMBERS (cosines, the ranking, the pairwise bars) come
   from data/l5-embeddings.json — the same source the facts-gate checks, so nothing can drift.
   All human text comes from i18n keys in `labels`.

   The embeddings file ships 6-D vectors + the precomputed analogy/pairs, but NO 2-D coordinates.
   So the four analogy words get a small, fixed, human-readable LAYOUT here: the gender axis runs
   left→right (man/king on the left, woman/queen on the right) and the royalty axis runs bottom→top
   (commoners low, royals high). That makes king−man+woman a literal parallelogram whose fourth
   corner sits on queen — the geometric story the cosines confirm. The layout is illustrative
   geometry; every displayed scalar is the real GloVe number.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountEmbeddingSpace registration); render() only draws the figure layers.

   Steps (maxStep = 3):
     0  → plot the four words as points on the meaning map.                         caption s0
     1  → the arithmetic king − man + woman: draw the parallelogram + the moved ✦.  caption s1
     2  → the nearest word is queen (cos 0.861) + the runner-ups from analogy.top.  caption s2
     3  → pairwise cosines: cat·dog 0.922 ≫ cat·airplane 0.365 — near = related.    caption s3 */
import { defineWidget } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

export const mountEmbeddingSpace = defineWidget({
  id: 'embedding-space',
  rootClass: 'es-root',
  exportName: 'mountEmbeddingSpace',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const analogy = data.analogy || {};
    const top = analogy.top || [];
    const pairs = data.pairs || [];
    const answer = top[0] || { word: analogy.expected || 'queen', cos: analogy.answerCos };
    // render a cosine exactly as stored (0.861 → ".861", 0.9218 → ".9218"): no rounding, leading 0 dropped.
    const cos = (c) => (typeof c !== 'number' ? '' : String(+c.toFixed(4)).replace(/^0/, '').replace(/^-0/, '-'));

    // ── illustrative 2-D layout for the four analogy words ─────────────────────
    // x = gender (0 male … 1 female), y = royalty (0 commoner … 1 royal).
    const LAY = {
      man:   { x: 0.18, y: 0.20 },
      woman: { x: 0.82, y: 0.20 },
      king:  { x: 0.18, y: 0.80 },
      queen: { x: 0.82, y: 0.80 },
    };
    // the analogy point: king − man + woman, computed in the SAME 2-D layout space.
    const move = {
      x: LAY.king.x - LAY.man.x + LAY.woman.x,
      y: LAY.king.y - LAY.man.y + LAY.woman.y,
    };

    // ── frame geometry (responsive: SVG scales to 100% width via CSS) ──────────
    // The scatter box takes the LEFT ~64% of the width; the right column is reserved for the
    // nearest-words ranking (steps 2–3) so it can never collide with the queen dot/label.
    const W = 480;
    const PAD_L = 16, PAD_T = 30;
    const plotH = 250;                         // scatter plot height
    const RANK_W = 150;                        // reserved right column for the ranking panel
    const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - RANK_W - 16, h: plotH };
    const rankColX = box.x + box.w + 18;       // left edge of the ranking column
    // pad the [0,1] layout domains so points + their labels never touch the frame edge.
    const dx = padDomain(0, 1, 0.16), dy = padDomain(0, 1, 0.16);
    const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
    const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;

    // ── bars panel geometry (below the scatter) — sized so nothing stacks past it
    const barsTop = PAD_T + plotH + 46;        // y of the first pairwise bar's baseline area
    const barRow = 30;                         // per-bar vertical pitch
    const barH = 16;
    const barX = 150;                          // left edge of the bar track
    const barMaxW = W - barX - 56;             // bar track width (room for the value on the right)
    const barsBottom = barsTop + pairs.length * barRow;
    const H = frameHeightFor(barsBottom, 14);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg es-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // layer bookkeeping: a node is shown when step >= its `from`.
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, n) => { layers[name].nodes.push(n); return n; };

    // ── scatter frame + axis labels (labels sit INSIDE the frame corners so they never
    //    spill past the viewBox left edge) ──────────────────────────────────────
    el('rect', { x: box.x, y: box.y, width: box.w, height: box.h, class: 'es-frame' }, svg);
    const ttl = el('text', { x: box.x, y: box.y - 10, class: 'es-title' }, svg);
    ttl.textContent = labels.mapTitle || 'meaning map (2-D sketch)';
    // y-axis: royalty ↑ — top-left, inside the frame
    const yax = el('text', { x: box.x + 6, y: box.y + 14, class: 'es-axlbl' }, svg);
    yax.textContent = labels.axRoyalty || 'royal ↑';
    // x-axis: gender → — bottom-right, just under the frame
    const xax = el('text', { x: box.x + box.w, y: box.y + box.h + 16, class: 'es-axlbl', 'text-anchor': 'end' }, svg);
    xax.textContent = labels.axGender || 'gender →';

    // word dot + label helper
    function wordPoint(name, cls, key) {
      const p = LAY[name];
      const g = el('g', {}, svg);
      el('circle', { cx: sx(p.x), cy: sy(p.y), r: 6, class: `es-dot ${cls}` }, g);
      // lift the label clear of its 6-px dot (15 ≥ r + glyph descent) so glyphs never sit on the
      // marker; the near-bg halo (CSS paint-order stroke) keeps it readable over the dashed
      // parallelogram edge it can graze. (defect-2 fix)
      const t = el('text', { x: sx(p.x), y: sy(p.y) - 15, class: `es-word svg-halo ${cls}`, 'text-anchor': 'middle' }, g);
      t.textContent = name;
      return add(key, g);
    }

    // ── step 0 layer: the four words as points ─────────────────────────────────
    layer('words', 0);
    wordPoint('man', 'es-c-base', 'words');
    wordPoint('woman', 'es-c-base', 'words');
    wordPoint('king', 'es-c-king', 'words');

    // ── step 1 layer: the parallelogram + the moved point (king − man + woman) ──
    layer('arith', 1);
    // edges king→ (−man) and +woman drawn as a parallelogram king, man, woman, move
    const poly = add('arith', el('polyline', {
      points: [LAY.king, LAY.man, LAY.woman, move]
        .map((p) => `${sx(p.x)},${sy(p.y)}`).join(' '),
      class: 'es-paral' }, svg));
    // the moved point ✦ (the analogy result, before we name it)
    const mg = el('g', {}, svg);
    el('path', { d: starPath(sx(move.x), sy(move.y), 8), class: 'es-star' }, mg);
    const mlbl = el('text', { x: sx(move.x), y: sy(move.y) + 22, class: 'es-movelbl', 'text-anchor': 'middle' }, mg);
    mlbl.textContent = labels.moveLabel || 'king − man + woman';
    add('arith', mg);

    // ── step 2 layer: reveal queen at the moved point + the ranking ────────────
    layer('answer', 2);
    // queen dot lands essentially on the moved point
    const qg = el('g', {}, svg);
    el('circle', { cx: sx(LAY.queen.x), cy: sy(LAY.queen.y), r: 7, class: 'es-dot es-c-queen' }, qg);
    const qt = el('text', { x: sx(LAY.queen.x), y: sy(LAY.queen.y) - 16, class: 'es-word svg-halo es-c-queen', 'text-anchor': 'middle' }, qg);
    qt.textContent = answer.word;
    add('answer', qg);
    // the ranking list lives in the RESERVED right column — left-aligned, never over the dots.
    const rankG = el('g', {}, svg);
    const rx = rankColX, ry0 = box.y + 14;
    const rhead = el('text', { x: rx, y: ry0, class: 'es-rankhead' }, rankG);
    rhead.textContent = labels.nearest || 'nearest words';
    top.slice(0, 6).forEach((t, i) => {
      const ry = ry0 + 22 + i * 18;
      const isAns = i === 0;
      const r = el('text', { x: rx, y: ry, class: `es-rank${isAns ? ' es-rank-top' : ''}` }, rankG);
      r.textContent = `${i + 1}. ${t.word}`;
      const c = el('text', { x: W - 8, y: ry, class: `es-rankcos${isAns ? ' es-rank-top' : ''}`, 'text-anchor': 'end' }, rankG);
      c.textContent = cos(t.cos);
    });
    add('answer', rankG);

    // ── step 3 layer: pairwise-cosine bars ─────────────────────────────────────
    layer('bars', 3);
    const bhead = el('text', { x: PAD_L, y: PAD_T + plotH + 28, class: 'es-barshead' }, svg);
    bhead.textContent = labels.pairsTitle || 'pairwise cosine — near means related';
    add('bars', bhead);
    pairs.forEach((p, i) => {
      const cy = barsTop + i * barRow;
      const g = el('g', {}, svg);
      // the pair label, right-aligned to the bar track
      const lab = el('text', { x: barX - 10, y: cy + barH - 3, class: 'es-pairlbl', 'text-anchor': 'end' }, g);
      lab.textContent = `${p.a} · ${p.b}`;
      // track + fill (clamped to [0,1] → never exceeds barMaxW, never leaves the frame)
      const frac = Math.max(0, Math.min(1, p.cos));
      el('rect', { x: barX, y: cy, width: barMaxW, height: barH, rx: 3, class: 'es-bartrack' }, g);
      const hi = p.cos >= 0.7;
      el('rect', { x: barX, y: cy, width: Math.max(1, frac * barMaxW), height: barH, rx: 3,
        class: `es-barfill ${hi ? 'es-bar-hi' : 'es-bar-lo'}` }, g);
      const val = el('text', { x: barX + barMaxW + 8, y: cy + barH - 3, class: 'es-barval' }, g);
      val.textContent = cos(p.cos);
      add('bars', g);
    });

    // five-point star path centered at (cx,cy)
    function starPath(cx, cy, r) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 5;
        const rad = i % 2 === 0 ? r : r * 0.42;
        pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
      }
      return 'M' + pts.join('L') + 'Z';
    }

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle('is-hidden', !on);
      }
      // once queen is revealed, the bare "king−man+woman" ✦ label gives way to the named point.
      mlbl.classList.toggle('is-hidden', k >= 2);
    };
  },
});
