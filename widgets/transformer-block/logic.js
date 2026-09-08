/* transformer-block/logic.js — L6 'climb-block' beat: assemble the full Transformer ENCODER block,
   one piece at a time. A pure structural diagram (boxes, arrows, labels) — NO numeric data — so it
   omits a data dependency (manifest `data: []`) and is fully self-contained.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All human text comes from i18n `labels`; the diagram geometry
   is fixed here.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold,
   setStep clamp, window.mountTransformerBlock registration); render() only draws the figure layers.

   The block, bottom → top (data flows UP):
     input embeddings (+ positional)  →  Multi-Head Attention  →  Add & Norm  (residual #1)
       →  Feed-Forward (FFN)  →  Add & Norm  (residual #2)  →  out, repeated ×N.

   Steps (maxStep = 5):
     0  → the input row (token + positional encoding) enters.                    caption s0
     1  → Multi-Head Attention.                                                  caption s1
     2  → Add & Norm #1 — the residual skip + LayerNorm around attention.        caption s2
     3  → position-wise Feed-Forward (FFN).                                      caption s3
     4  → Add & Norm #2 — the residual skip + LayerNorm around the FFN.          caption s4
     5  → the whole thing is one layer; stack it ×N.                             caption s5 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountTransformerBlock = defineWidget({
  id: 'transformer-block',
  rootClass: 'tb-root',
  exportName: 'mountTransformerBlock',
  maxStep: 5,
  render({ host, labels, el }) {
    const W = 480;
    const COLX = 150;                 // left edge of the main column
    const COLW = 200;                 // box width
    const CX = COLX + COLW / 2;       // column centre x (the data spine)
    const RES_X = COLX + COLW + 28;   // x of the residual skip rail (to the right)

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg tb-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // arrow-head marker for the flow + residual arrows
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'tb-arrow', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'tb-arrhead' }, mk);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // We lay the block out TOP→BOTTOM in screen-y but the data flows BOTTOM→UP, so the input box is
    // the lowest one drawn and the output exits the top. Compute y-positions from the top down.
    let y = 14;
    const boxH = 40, gap = 30;
    const ys = {};                    // name → {y, h}
    function reserve(name, h = boxH) { ys[name] = { y, h }; y += h + gap; }
    // top → bottom on screen: stack note, out, add-norm-2, ffn, add-norm-1, mha, input
    reserve('stack', 30);
    reserve('addnorm2');
    reserve('ffn');
    reserve('addnorm1');
    reserve('mha');
    reserve('input');
    const totalBottom = y - gap + 10;

    // a labelled box; `cls` themes it. Returns the group.
    function box(name, key, cls, textKey, subKey) {
      const b = ys[key];
      const g = el('g', {}, svg);
      el('rect', { x: COLX, y: b.y, width: COLW, height: b.h, rx: 8, class: `tb-box ${cls}` }, g);
      const t = el('text', { x: CX, y: b.y + (subKey ? b.h / 2 - 2 : b.h / 2 + 4),
        class: 'tb-box-lbl', 'text-anchor': 'middle' }, g);
      t.textContent = labels[textKey] || textKey;
      if (subKey) {
        const s = el('text', { x: CX, y: b.y + b.h / 2 + 13, class: 'tb-box-sub',
          'text-anchor': 'middle' }, g);
        s.textContent = labels[subKey] || '';
      }
      add(name, g);
      return b;
    }

    // a vertical flow arrow between two boxes (from the lower box UP into the upper box).
    function flow(name, fromKey, toKey) {
      const f = ys[fromKey], t = ys[toKey];
      add(name, el('line', { x1: CX, y1: f.y, x2: CX, y2: t.y + t.h, class: 'tb-flow',
        'marker-end': 'url(#tb-arrow)' }, svg));
    }

    // a residual skip rail on the right: from just-above `srcKey` up around to the Add&Norm `dstKey`.
    function residual(name, srcKey, dstKey) {
      const src = ys[srcKey], dst = ys[dstKey];
      const yStart = src.y + src.h / 2;     // leaves the column at the source's mid-height
      const yEnd = dst.y + dst.h / 2;       // re-enters at the Add&Norm box
      const d = `M ${COLX + COLW} ${yStart} H ${RES_X} V ${yEnd} H ${COLX + COLW}`;
      add(name, el('path', { d, class: 'tb-resid', fill: 'none', 'marker-end': 'url(#tb-arrow)' }, svg));
      add(name, el('text', { x: RES_X + 6, y: (yStart + yEnd) / 2, class: 'tb-resid-lbl' }, svg))
        .textContent = labels.residual || 'skip';
      // a small ⊕ on the re-entry segment makes the residual ADD (x + sublayer(x)) VISIBLE in the block
      // view — the addition was previously only NAMED ("Add & Norm") here and shown numerically in the
      // separate residual-stream widget. Sits at the midpoint of the horizontal merge arrow, clear of
      // the box label (centred at CX) and the vertical rail / "skip" label (at RES_X).
      add(name, el('text', { x: (COLX + COLW + RES_X) / 2, y: yEnd - 5, class: 'tb-resid-add',
        'text-anchor': 'middle' }, svg)).textContent = '⊕';
    }

    // ── STEP 0: input row ─────────────────────────────────────────────────────
    layer('input', 0);
    box('input', 'input', 'tb-input', 'inputLbl', 'inputSub');

    // ── STEP 1: Multi-Head Attention ──────────────────────────────────────────
    layer('mha', 1);
    box('mha', 'mha', 'tb-attn', 'mhaLbl', 'mhaSub');
    flow('mha', 'input', 'mha');

    // ── STEP 2: Add & Norm #1 (residual + LayerNorm around attention) ─────────
    layer('an1', 2);
    box('an1', 'addnorm1', 'tb-norm', 'addNormLbl', 'addNormSub');
    flow('an1', 'mha', 'addnorm1');
    residual('an1', 'input', 'addnorm1');

    // ── STEP 3: Feed-Forward (FFN) ────────────────────────────────────────────
    layer('ffn', 3);
    box('ffn', 'ffn', 'tb-ffn', 'ffnLbl', 'ffnSub');
    flow('ffn', 'addnorm1', 'ffn');

    // ── STEP 4: Add & Norm #2 (residual + LayerNorm around the FFN) ───────────
    layer('an2', 4);
    box('an2', 'addnorm2', 'tb-norm', 'addNormLbl', 'addNormSub');
    flow('an2', 'ffn', 'addnorm2');
    residual('an2', 'addnorm1', 'addnorm2');

    // ── STEP 5: the ×N stack note + the output arrow ──────────────────────────
    layer('stack', 5);
    // output arrow leaving the top of Add&Norm #2 up into the stack band
    const an2 = ys.addnorm2, st = ys.stack;
    add('stack', el('line', { x1: CX, y1: an2.y, x2: CX, y2: st.y + st.h, class: 'tb-flow',
      'marker-end': 'url(#tb-arrow)' }, svg));
    // the dashed "×N" band wrapping the whole block
    add('stack', el('rect', { x: COLX - 16, y: ys.addnorm2.y - 8,
      width: COLW + 32 + 60, height: (ys.input.y + ys.input.h) - ys.addnorm2.y + 16, rx: 12,
      class: 'tb-stackband', fill: 'none' }, svg));
    add('stack', el('text', { x: st.y != null ? CX : CX, y: st.y + st.h / 2 + 4,
      class: 'tb-stack-lbl', 'text-anchor': 'middle' }, svg)).textContent =
      labels.stackLbl || 'repeat this block ×N (e.g. N = 6, 12, 24)';

    const H = frameHeightFor(totalBottom, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // per-step update.
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
