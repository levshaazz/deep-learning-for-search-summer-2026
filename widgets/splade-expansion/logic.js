/* splade-expansion/logic.js — L8 'climb-splade' beat: learned sparse. SPLADE turns an MLM head into a
   weight over the WHOLE vocabulary: w_j = log(1 + ReLU(logit_j)). The query "river flood" re-weights the
   words you typed AND lights up related EXPANSION terms (bank, water) it never saw — yet stays sparse and
   inverted-index compatible. The match is the sparse dot of the query and document weight vectors.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll. EVERY number comes straight from
   data/l8-splade.json (toy); all human text from i18n `labels`. Built on widgets/_widget-base.js.

   Steps (maxStep = 3):
     0  → the two LITERAL query terms as bars (the words you typed).                   caption s0
     1  → the saturating weight curve w = log(1+ReLU(z)); weight values on the bars.    caption s1
     2  → EXPANSION terms (bank, water) light up as new bars — never typed.             caption s2
     3  → overlay the document weights; the sparse dot over shared terms → the score.   caption s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountSpladeExpansion = defineWidget({
  id: 'splade-expansion',
  rootClass: 'sx-root',
  exportName: 'mountSpladeExpansion',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const vocab = toy.vocab || [];
    const qW = toy.query?.weights || [];
    const dW = toy.doc?.weights || [];
    const expansion = new Set(toy.query?.expansion || []);
    const terms = toy.terms || [];
    const dot = typeof toy.dot === 'number' ? toy.dot : 0;
    const num4 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(4));
    const num2 = (x) => (typeof x !== 'number' || !isFinite(x) ? '' : x.toFixed(2));

    // the bar terms: every vocab word with a non-zero query OR doc weight (river, bank, flood, water).
    const items = vocab.map((t, i) => ({ t, i, q: qW[i] || 0, d: dW[i] || 0, exp: expansion.has(t) }))
      .filter((o) => o.q > 0 || o.d > 0);
    const maxW = Math.max(0.001, ...items.map((o) => Math.max(o.q, o.d))) * 1.15;

    const W = 560, PAD = 16;
    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg sx-svg', role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    layer('literal', 0); layer('curve', 1); layer('weights', 1);
    layer('expansion', 2); layer('doc', 3); layer('dot', 3);

    // ── bar chart geometry: one group per term; query bar (left) + doc bar (right, step 3) ──
    const box = { x: PAD + 34, y: 56, w: W - 2 * PAD - 34, h: 210 };
    add('literal', el('line', { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: 'sx-axis' }, svg));
    add('literal', el('text', { x: PAD, y: 30, class: 'sx-head' }, svg))
      .textContent = labels.head || 'learned weights over the vocabulary: wⱼ = log(1 + ReLU(zⱼ))';
    const groupW = box.w / items.length;
    const barW = Math.min(34, groupW / 2 - 6);
    const yOf = (w) => box.y + box.h - (w / maxW) * box.h;

    items.forEach((o, gi) => {
      const cx = box.x + gi * groupW + groupW / 2;
      const lname = o.exp ? 'expansion' : 'literal';
      // query-weight bar
      const qx = cx - barW - 2;
      const qy = yOf(o.q);
      add(lname, el('rect', { x: qx, y: qy, width: barW, height: box.y + box.h - qy, rx: 4,
        class: 'sx-bar ' + (o.exp ? 'sx-bar-exp' : 'sx-bar-q') }, svg));
      // query-weight value label (step 1+)
      add('weights', el('text', { x: qx + barW / 2, y: qy - 6, class: 'sx-wval', 'text-anchor': 'middle' }, svg))
        .textContent = num4(o.q);
      // doc-weight bar (step 3)
      const dx = cx + 2;
      const dy = yOf(o.d);
      add('doc', el('rect', { x: dx, y: dy, width: barW, height: box.y + box.h - dy, rx: 4, class: 'sx-bar sx-bar-d' }, svg));
      add('doc', el('text', { x: dx + barW / 2, y: dy - 6, class: 'sx-dval', 'text-anchor': 'middle' }, svg))
        .textContent = num2(o.d);
      // term label under the group (+ an "expansion" tag for the kindled terms)
      add(lname, el('text', { x: cx, y: box.y + box.h + 20, class: 'sx-term' + (o.exp ? ' sx-term-exp' : ''),
        'text-anchor': 'middle' }, svg)).textContent = o.t;
      if (o.exp) add('expansion', el('text', { x: cx, y: box.y + box.h + 38, class: 'sx-tag', 'text-anchor': 'middle' }, svg))
        .textContent = labels.expandLabel || '+ expansion';
    });

    // ── saturation curve inset (step 1): y = log(1 + ReLU(x)), x in [-2, 3] ──
    const ix = box.x + box.w - 150, iy = box.y - 6, iw = 140, ih = 96;
    add('curve', el('rect', { x: ix, y: iy, width: iw, height: ih, rx: 8, class: 'sx-inset' }, svg));
    const cx0 = ix + 14, cy0 = iy + ih - 16, cw = iw - 26, ch = ih - 30;
    add('curve', el('line', { x1: cx0, y1: cy0, x2: cx0 + cw, y2: cy0, class: 'sx-iaxis' }, svg));
    add('curve', el('line', { x1: cx0, y1: cy0, x2: cx0, y2: cy0 - ch, class: 'sx-iaxis' }, svg));
    const xa = -2, xb = 3, ymax = Math.log(1 + Math.max(0, xb));
    let dStr = '';
    for (let s = 0; s <= 40; s++) {
      const x = xa + (xb - xa) * (s / 40);
      const y = Math.log(1 + Math.max(0, x));
      const px = cx0 + ((x - xa) / (xb - xa)) * cw;
      const py = cy0 - (y / ymax) * ch;
      dStr += (s === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
    }
    add('curve', el('path', { d: dStr, class: 'sx-curve', fill: 'none' }, svg));
    add('curve', el('text', { x: ix + iw / 2, y: iy + 14, class: 'sx-ilbl', 'text-anchor': 'middle' }, svg))
      .textContent = 'log(1+ReLU)';

    // ── sparse-dot readout (step 3): the shared-term products and their sum → the score ──
    const dotY = box.y + box.h + 52;
    add('dot', el('rect', { x: PAD, y: dotY, width: W - 2 * PAD, height: 60, rx: 9, class: 'sx-dotbox' }, svg));
    // products only (the q·d expansion is shown by the bars) so the line stays inside the frame.
    add('dot', el('text', { x: PAD + 12, y: dotY + 24, class: 'sx-dotline' }, svg))
      .textContent = terms.map((t) => num4(t.prod)).join('  +  ');
    add('dot', el('text', { x: PAD + 12, y: dotY + 48, class: 'sx-dottotal' }, svg))
      .textContent = `${labels.dotLabel || 'sparse dot'} = ${num4(dot)}`;

    const H = frameHeightFor(dotY + 60, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
