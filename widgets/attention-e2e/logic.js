/* attention-e2e/logic.js — L6 'climb-attention' / 'climb-multihead' beat: a small worked
   self-attention, end to end — softmax(QKᵀ/√d_k)·V — over the toy sequence [the, cat, sat].

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY number — Q/K/V, the QKᵀ scores, the /√d_k scaling, the
   row-softmax attention weights, and the weighted-sum output — comes straight from
   data/l6-attention.json (the same source the facts-gate checks), never from these strings.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountAttentionE2e registration); render() only draws the figure layers.

   LAYOUT: everything stacks top→bottom in a single 480-wide column. Q, K, V are drawn as three
   small matrices on ONE row (3×4 each, narrow cells) so they fit; the 3×3 scores, the 3×3 attention
   heatmap and the 3×4 output each get their own row below, with the key-token column headers placed
   clear of the section heading.

   Steps (maxStep = 4):
     0  → the 3 tokens + the Q, K, V matrices (3×4 each).                         caption s0
     1  → scores = Q·Kᵀ — a 3×3 grid of dot products.                            caption s1
     2  → ÷ √d_k (=2.0) then row-softmax → the attention heatmap (rows sum to 1). caption s2
     3  → weighted sum · V → the contextual output (3×4).                         caption s3
     4  → multi-head: 2 heads run in parallel subspaces → concat + Wᴼ.           caption s4 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountAttentionE2e = defineWidget({
  id: 'attention-e2e',
  rootClass: 'ae-root',
  exportName: 'mountAttentionE2e',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const tokens = data.tokens || [];
    const Q = data.Q || [], K = data.K || [], V = data.V || [];
    const scores = data.scores || [];
    const weights = data.weights || [];
    const output = data.output || [];
    const sqrtdk = data.sqrtdk != null ? data.sqrtdk : 2.0;
    const dk = data.d_k != null ? data.d_k : 4;
    const heads = data.heads != null ? data.heads : 2;
    const n = tokens.length;

    // number → compact cell text: integers bare, floats to 3 places (the JSON precision).
    const num = (x) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : fmt(x, 3));

    // ── geometry ───────────────────────────────────────────────────────────
    const W = 480;
    const PAD_L = 14;
    const LBL = 26;                     // width of the left row-label gutter
    const CELL = 24, GAP = 4;           // cell box + inter-cell gap (narrow → 3 matrices fit)
    const STEP = CELL + GAP;
    const matW = (cols) => LBL + cols * STEP - GAP;   // total width of a `cols`-wide matrix
    let cursorY = 12;                   // running top edge as we stack sections

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg ae-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    function heading(name, text, dy = 16) {
      const t = el('text', { x: PAD_L, y: cursorY + 11, class: 'ae-head' }, svg);
      t.textContent = text;
      add(name, t);
      cursorY += dy;
    }

    // heat colour for a softmax weight in [0,1]: accent blue, opacity ∝ weight.
    const heat = (w) => `color-mix(in srgb, var(--accent, #2A6FDB) ${Math.round(Math.max(0.06, w) * 100)}%, var(--bg-card, #fff))`;

    // draw a matrix whose top-left grid cell is at (x0, y0). rowLabels (optional) sit in the left
    // gutter; colorFn(v) (optional) tints cells (the attention heatmap). All nodes go to `name`.
    function matrix(name, vals, x0, y0, opts = {}) {
      const rowLabels = opts.rowLabels || null;
      const colorFn = opts.colorFn || null;
      const gx = x0 + (rowLabels ? LBL : 0);
      vals.forEach((row, r) => {
        const cy = y0 + r * STEP;
        if (rowLabels) {
          const rl = el('text', { x: gx - 6, y: cy + CELL / 2 + 4, class: 'ae-rowlbl',
            'text-anchor': 'end' }, svg);
          rl.textContent = rowLabels[r] || '';
          add(name, rl);
        }
        row.forEach((v, c) => {
          const cx = gx + c * STEP;
          const rect = el('rect', { x: cx, y: cy, width: CELL, height: CELL, rx: 3,
            class: colorFn ? 'ae-cell ae-cell-heat' : 'ae-cell' }, svg);
          if (colorFn) rect.setAttribute('fill', colorFn(v));
          add(name, rect);
          const t = el('text', { x: cx + CELL / 2, y: cy + CELL / 2 + 4,
            class: colorFn ? 'ae-val ae-val-heat' : 'ae-val', 'text-anchor': 'middle' }, svg);
          t.textContent = num(v);
          if (colorFn) t.setAttribute('fill', v >= 0.5 ? '#fff' : 'var(--ink, #14181F)');
          add(name, t);
        });
      });
    }

    // ── STEP 0: tokens + Q / K / V (three matrices on one row) ───────────────
    layer('qkv', 0);
    heading('qkv', labels.tokensHead || 'sequence', 16);
    tokens.forEach((tok, i) => {
      const cx = PAD_L + 24 + i * 64;
      const g = el('g', {}, svg);
      el('rect', { x: cx, y: cursorY, width: 54, height: 20, rx: 6, class: 'ae-tok' }, g);
      el('text', { x: cx + 27, y: cursorY + 14, class: 'ae-tok-txt', 'text-anchor': 'middle' }, g)
        .textContent = tok;
      add('qkv', g);
    });
    cursorY += 30;
    heading('qkv', (labels.qkvHead || 'Q, K, V — one row per token (d_k = {d})').replace('{d}', String(dk)), 18);
    // three matrices Q | K | V across the width
    const triW = matW(dk);
    const triGap = (W - 2 * PAD_L - 3 * triW) / 2;
    const xs = [PAD_L, PAD_L + triW + triGap, PAD_L + 2 * (triW + triGap)];
    const matTop = cursorY + 12;        // leave room for the per-matrix caption above
    [['Q', Q], ['K', K], ['V', V]].forEach(([nm, m], i) => {
      add('qkv', el('text', { x: xs[i] + LBL, y: cursorY + 4, class: 'ae-matcap' }, svg))
        .textContent = nm;
      matrix('qkv', m, xs[i], matTop, { rowLabels: tokens });
    });
    cursorY = matTop + n * STEP - GAP + 18;

    // a row of key-token column headers above a grid whose first cell column starts at gx.
    function colHeaders(name, gx, y) {
      tokens.forEach((tok, c) => {
        add(name, el('text', { x: gx + c * STEP + CELL / 2, y, class: 'ae-collbl',
          'text-anchor': 'middle' }, svg)).textContent = tok;
      });
    }

    // ── STEP 1: scores = Q · Kᵀ (3×3) ────────────────────────────────────────
    layer('scores', 1);
    heading('scores', labels.scoresHead || 'scores = Q · Kᵀ', 30);   // extra room for col headers
    colHeaders('scores', PAD_L + LBL, cursorY - 8);
    matrix('scores', scores, PAD_L, cursorY, { rowLabels: tokens });
    add('scores', el('text', { x: PAD_L + matW(n) + 20, y: cursorY + 1.5 * STEP,
      class: 'ae-divtag' }, svg)).textContent = '÷ √d_k = ' + num(sqrtdk);
    cursorY += n * STEP - GAP + 20;

    // ── STEP 2: ÷√d_k → row-softmax → the attention heatmap ──────────────────
    layer('weights', 2);
    heading('weights', labels.weightsHead || 'softmax → attention weights · each row sums to 1', 30);
    colHeaders('weights', PAD_L + LBL, cursorY - 8);
    matrix('weights', weights, PAD_L, cursorY, { rowLabels: tokens, colorFn: heat });
    weights.forEach((row, r) => {
      const sum = row.reduce((a, b) => a + b, 0);
      add('weights', el('text', { x: PAD_L + matW(n) + 16, y: cursorY + r * STEP + CELL / 2 + 4,
        class: 'ae-rowsum' }, svg)).textContent = 'Σ ≈ ' + sum.toFixed(0);
    });
    cursorY += n * STEP - GAP + 20;

    // ── STEP 3: weighted sum · V → contextual output (3×4) ───────────────────
    layer('output', 3);
    heading('output', labels.outputHead || 'output = weights · V — a context-aware vector per token', 18);
    matrix('output', output, PAD_L, cursorY, { rowLabels: tokens });
    cursorY += n * STEP - GAP + 18;

    // ── STEP 4: multi-head note ──────────────────────────────────────────────
    layer('heads', 4);
    const hg = el('g', {}, svg);
    el('rect', { x: PAD_L, y: cursorY, width: W - 2 * PAD_L, height: 48, rx: 8, class: 'ae-headbox' }, hg);
    el('text', { x: PAD_L + 12, y: cursorY + 19, class: 'ae-headnote' }, hg).textContent =
      (labels.multiHead || '{h} heads run this in parallel subspaces → concat → Wᴼ.').replace('{h}', String(heads));
    el('text', { x: PAD_L + 12, y: cursorY + 36, class: 'ae-headnote ae-headnote-2' }, hg).textContent =
      labels.multiHead2 || 'each head is a councillor heeding a different relation.';
    add('heads', hg);
    cursorY += 58;

    const H = frameHeightFor(cursorY, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
