/* biencoder/logic.js — L7 'climb-biencoder' beat: the Scout. Two towers encode the query and the
   document SEPARATELY into one shared space; the score is the cosine of the angle between the two
   vectors (Sir Cosine's ruler). Doc vectors are precomputed offline — that is the whole speed case.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep, binds NO keyboard and NO scroll — the SLIDE driver
   (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k). EVERY number — the toy
   vectors and the cosine — comes straight from data/l7-biencoder.json (the same source the facts-gate
   checks); the angle θ is derived as arccos(cosRel). All human text comes from i18n `labels`.

   Layout: two towers across the TOP; below them a unit circle on the LEFT with the two rays + an angle
   arc; the cosine/θ readout sits in a panel to the RIGHT of the circle — so NO label is ever drawn on a
   ray (the §1.3 "θ crosses the lines" defect is structurally impossible now). Built on _widget-base.js.

   Steps (maxStep = 3):
     0  → two encoder towers (query, doc) over their input texts.                       caption s0
     1  → each tower emits a vector → an arrow lands it as a point in the shared space.  caption s1
     2  → the ANGLE between the two vectors = the cosine score (read out on the side).   caption s2
     3  → the doc vector is precomputed offline and cached (a stored chip).              caption s3 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountBiencoder = defineWidget({
  id: 'biencoder',
  rootClass: 'bi-root',
  exportName: 'mountBiencoder',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const toy = data.toy || {};
    const q = (toy.query && toy.query.vec) || [];
    const d = (toy.docRel && toy.docRel.vec) || [];
    const qText = (toy.query && toy.query.text) || '';
    const dText = (toy.docRel && toy.docRel.text) || '';
    const cosRel = typeof toy.cosRel === 'number' ? toy.cosRel : 0;
    const theta = Math.acos(Math.max(-1, Math.min(1, cosRel)));      // radians
    const thetaDeg = Math.round(theta * 180 / Math.PI);
    const cos3 = (c) => (typeof c !== 'number' ? '' : String(+c.toFixed(3)).replace(/^0\./, '.').replace(/^-0\./, '-.'));

    const W = 560, PAD = 18;
    const boxW = 176, boxH = 44;
    const qx = PAD, dx = W - PAD - boxW;
    const qcx = qx + boxW / 2, dcx = dx + boxW / 2;

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg bi-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const defs = el('defs', {}, svg);
    ['bi-ar-q', 'bi-ar-d'].forEach((id) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'bi-arhead' }, m);
    });

    function vecChip(name, cx, top, vec, role) {
      const cw = 24, gap = 3, n = vec.length;
      const totW = n * cw + (n - 1) * gap;
      const x0 = cx - totW / 2;
      vec.forEach((v, i) => {
        const x = x0 + i * (cw + gap);
        add(name, el('rect', { x, y: top, width: cw, height: 22, rx: 3, class: `bi-cellchip bi-cellchip-${role}` }, svg));
        add(name, el('text', { x: x + cw / 2, y: top + 16, class: 'bi-cellval', 'text-anchor': 'middle' }, svg))
          .textContent = String(v);
      });
      return { bx: cx, by: top + 22 };
    }

    // ── STEP 0: the two encoder towers + their inputs ──
    layer('towers', 0);
    [['q', qx, qcx, labels.qLabel || 'query tower', qText],
     ['d', dx, dcx, labels.dLabel || 'doc tower', dText]].forEach(([role, x, cx, title, text]) => {
      const top = 14;
      add('towers', el('rect', { x, y: top, width: boxW, height: boxH, rx: 10,
        class: `bi-tower bi-tower-${role}`, id: role === 'd' ? 'bi-dtower' : undefined }, svg));
      add('towers', el('text', { x: cx, y: top + boxH / 2 + 5, class: 'bi-towerlbl', 'text-anchor': 'middle' }, svg))
        .textContent = title;
      add('towers', el('text', { x: cx, y: top + boxH + 17, class: 'bi-input', 'text-anchor': 'middle' }, svg))
        .textContent = '“' + text + '”';
    });

    // ── STEP 1: each tower emits a vector chip + an arrow into the shared space ──
    layer('vecs', 1);
    const chipTop = 98;
    const qChip = vecChip('vecs', qcx, chipTop, q, 'q');
    const dChip = vecChip('vecs', dcx, chipTop, d, 'd');

    // the shared space: a unit circle on the LEFT; the two vectors as rays from the centre.
    const cxc = 196, cyc = 274, R = 84;
    add('vecs', el('circle', { cx: cxc, cy: cyc, r: R, class: 'bi-circle', fill: 'none' }, svg));
    add('vecs', el('circle', { cx: cxc, cy: cyc, r: 3, class: 'bi-origin' }, svg));
    const aUp = -Math.PI / 2;
    const aQ = aUp - theta / 2, aD = aUp + theta / 2;
    const qpt = { x: cxc + R * Math.cos(aQ), y: cyc + R * Math.sin(aQ) };
    const dpt = { x: cxc + R * Math.cos(aD), y: cyc + R * Math.sin(aD) };
    add('vecs', el('line', { x1: cxc, y1: cyc, x2: qpt.x, y2: qpt.y, class: 'bi-ray bi-ray-q' }, svg));
    add('vecs', el('line', { x1: cxc, y1: cyc, x2: dpt.x, y2: dpt.y, class: 'bi-ray bi-ray-d' }, svg));
    add('vecs', el('circle', { cx: qpt.x, cy: qpt.y, r: 5, class: 'bi-pt bi-pt-q' }, svg));
    add('vecs', el('circle', { cx: dpt.x, cy: dpt.y, r: 5, class: 'bi-pt bi-pt-d', id: 'bi-dpt' }, svg));
    // feed arrows from each chip to its point in the space (whole arrows, not on the rays)
    add('vecs', el('line', { x1: qChip.bx, y1: qChip.by + 4, x2: qpt.x - 6, y2: qpt.y - 10,
      class: 'bi-feed bi-feed-q', 'marker-end': 'url(#bi-ar-q)' }, svg));
    add('vecs', el('line', { x1: dChip.bx, y1: dChip.by + 4, x2: dpt.x + 6, y2: dpt.y - 10,
      class: 'bi-feed bi-feed-d', 'marker-end': 'url(#bi-ar-d)' }, svg));
    // tiny ray end-labels OUTSIDE the circle, offset along each ray's direction (never on the ray body)
    add('vecs', el('text', { x: qpt.x - 14, y: qpt.y - 8, class: 'bi-raylbl bi-raylbl-q', 'text-anchor': 'end' }, svg))
      .textContent = 'q';
    add('vecs', el('text', { x: dpt.x + 14, y: dpt.y - 8, class: 'bi-raylbl bi-raylbl-d', 'text-anchor': 'start' }, svg))
      .textContent = 'd';

    // ── STEP 2: the angle arc (no text on it) + a SIDE readout panel (cos θ, θ) ──
    layer('angle', 2);
    const ar = 36;
    const ax1 = cxc + ar * Math.cos(aQ), ay1 = cyc + ar * Math.sin(aQ);
    const ax2 = cxc + ar * Math.cos(aD), ay2 = cyc + ar * Math.sin(aD);
    add('angle', el('path', { d: `M ${ax1.toFixed(1)} ${ay1.toFixed(1)} A ${ar} ${ar} 0 0 1 ${ax2.toFixed(1)} ${ay2.toFixed(1)}`,
      class: 'bi-arc', fill: 'none' }, svg));
    // readout panel to the RIGHT of the circle
    const pX = 348, pY = 222, pW = W - PAD - pX, pH = 108;
    add('angle', el('rect', { x: pX, y: pY, width: pW, height: pH, rx: 12, class: 'bi-callbox' }, svg));
    add('angle', el('text', { x: pX + pW / 2, y: pY + 34, class: 'bi-cosval', 'text-anchor': 'middle' }, svg))
      .textContent = (labels.cosLabel || 'cos θ') + ' = ' + cos3(cosRel);
    add('angle', el('text', { x: pX + pW / 2, y: pY + 64, class: 'bi-theta', 'text-anchor': 'middle' }, svg))
      .textContent = 'θ = ' + thetaDeg + '°';
    add('angle', el('text', { x: pX + pW / 2, y: pY + 90, class: 'bi-readnote', 'text-anchor': 'middle' }, svg))
      .textContent = labels.nearNote || 'small angle ⇒ near';

    // ── STEP 3: the doc vector is precomputed offline & cached (a stored chip) ──
    layer('cache', 3);
    const bx = dpt.x + 34, by = dpt.y - 2;
    add('cache', el('line', { x1: dpt.x, y1: dpt.y, x2: bx - 13, y2: by, class: 'bi-cachetie' }, svg));
    [-6, 0, 6].forEach((dy) => add('cache', el('ellipse',
      { cx: bx, cy: by + dy, rx: 13, ry: 4.5, class: 'bi-cachechip' }, svg)));
    add('cache', el('text', { x: bx, y: by + 24, class: 'bi-cachelbl', 'text-anchor': 'middle' }, svg))
      .textContent = labels.cacheLabel || 'cached';

    const H = frameHeightFor(cyc + R + 10, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      svg.classList.toggle('bi-cached', k >= 3);
    };
  },
});
