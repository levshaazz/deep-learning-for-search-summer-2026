/* cosine-sphere/logic.js — the "explainable unit" for L2 cosine similarity.
   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All numbers come from data/l2-cosine.json; all text from i18n
   keys passed in `labels`. Same module, same data → identical figure in hall and on a phone.

   Usage:
     import { mountCosineSphere } from './logic.js';
     const fig = mountCosineSphere(el, { data, labels, pairId });
     fig.setStep(2); fig.maxStep;  // 4

   Built on the shared widgets/_widget-base.js factory via its escape hatch — this widget predates
   the standard `wgt-root`/`wgt-caption` scaffold and keeps its bespoke `cs-*` DOM byte-for-byte:
     • bareRoot      → host carries ONLY `cs-root` (no wgt-root/wgt-fade);
     • scaffold:false → render() emits its own `.cs-caption`/`.cs-counter` and owns their text;
     • pairId reaches render() through the factory's extra-mount-arg pass-through (ctx.pairId).
   render() owns the cumulative is-hidden layer reveal AND the caption/counter text in update(step).
   The factory still owns the host-class setup, innerHTML clear, setStep clamp + host.dataset.step,
   and the window.mountCosineSphere registration. */
import { defineWidget } from '../_widget-base.js';

let _uid = 0;

export const mountCosineSphere = defineWidget({
  id: 'cosine-sphere',
  rootClass: 'cs-root',
  bareRoot: true,
  scaffold: false,
  maxStep: 4,
  render({ host, data, labels, el, pairId }) {
    const pair = data.pairs.find((p) => p.id === (pairId || data.primary)) || data.pairs[0];
    const VB = data.coordSpace || { w: 520, h: 360 };
    const W = 520, H = 360;
    const O = { x: 80, y: 280 };                       // origin (lower-left)
    const len = (a) => Math.hypot(a[0], a[1]);
    const maxLen = Math.max(len(pair.u), len(pair.v), 1);
    const unit = 200 / maxLen;                          // px per unit-vector length
    const P = (vec) => ({ x: O.x + vec[0] * unit, y: O.y - vec[1] * unit });
    const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
    const uid = 'cs' + ++_uid;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'cs-svg',
      role: labels.role || 'img', 'aria-label': labels.alt || '' }, host);

    // arrowhead markers (per-instance ids so multiple widgets don't clash)
    const defs = el('defs', {}, svg);
    for (const [cls, id] of [['cs-mk-u', uid + '-u'], ['cs-mk-v', uid + '-v']]) {
      const mk = el('marker', { id, class: cls, viewBox: '0 0 10 10', refX: 8, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z' }, mk);
    }

    // layers keyed by the step they appear from (cumulative reveal)
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    // axes (always visible, step 0)
    layer('axes', 0);
    add('axes', el('line', { x1: 30, y1: O.y, x2: W - 20, y2: O.y, class: 'cs-axis' }, svg));
    add('axes', el('line', { x1: O.x, y1: H - 20, x2: O.x, y2: 30, class: 'cs-axis' }, svg));

    // unit sphere (cross-section) — step 3
    layer('unit', 3);
    add('unit', el('circle', { cx: O.x, cy: O.y, r: unit, class: 'cs-unit' }, svg));

    // vectors u, v — step 0
    const tu = P(pair.u), tv = P(pair.v);
    layer('vectors', 0);
    add('vectors', el('line', { x1: O.x, y1: O.y, x2: tu.x, y2: tu.y, class: 'cs-vec cs-vec-u',
      'marker-end': `url(#${uid}-u)` }, svg));
    add('vectors', el('line', { x1: O.x, y1: O.y, x2: tv.x, y2: tv.y, class: 'cs-vec cs-vec-v',
      'marker-end': `url(#${uid}-v)` }, svg));
    // Tip labels offset ALONG each vector's own direction (outward from the origin), not by a fixed
    // (+8,-4) screen nudge — so a short vector (e.g. u in the collinear cos=1 pair) still gets its
    // label pushed clear of the origin instead of piling up there. (audit #3)
    const tipLbl = (vec, tip, cls, txt) => {
      const d = norm(vec);                  // unit direction in data space (y up)
      const off = 16;                       // px past the arrowhead, along the vector
      add('vectors', el('text', { x: tip.x + d[0] * off, y: tip.y - d[1] * off + 5,
        class: 'cs-lbl ' + cls, 'text-anchor': 'middle' }, svg)).textContent = txt;
    };
    tipLbl(pair.u, tu, 'cs-lbl-u', 'u');
    tipLbl(pair.v, tv, 'cs-lbl-v', 'v');

    // Euclidean ruler tip→tip — step 1
    layer('euclid', 1);
    add('euclid', el('line', { x1: tu.x, y1: tu.y, x2: tv.x, y2: tv.y, class: 'cs-euclid' }, svg));
    const em = { x: (tu.x + tv.x) / 2, y: (tu.y + tv.y) / 2 };
    // Offset the ‖u−v‖ label PERPENDICULAR to the u−v segment, not by a flat +10 in x (audit #3).
    // For the collinear cos=1 pair the segment lies along both vectors, so a flat x-nudge drops the
    // label straight onto the vector strokes + the "u" tip label. The screen-space normal of the
    // segment pushes it clear of that shared line. We bias the normal AWAY from the origin (toward
    // the emptier upper-left of the plot) and clamp x so the label never leaves the frame.
    const segx = tv.x - tu.x, segy = tv.y - tu.y;
    const segLen = Math.hypot(segx, segy) || 1;
    let nx = -segy / segLen, ny = segx / segLen;            // unit normal to the segment
    // point the normal away from the origin O so the label sits in open space, not over the wedge
    if ((em.x - O.x) * nx + (em.y - O.y) * ny < 0) { nx = -nx; ny = -ny; }
    const NOFF = 14;
    let elx = em.x + nx * NOFF, ely = em.y + ny * NOFF + 4; // +4 ≈ baseline centring
    elx = Math.max(38, Math.min(W - 8, elx));               // keep inside the plot frame
    const eLbl = add('euclid', el('text', { x: elx, y: ely, class: 'cs-tag cs-tag-euclid',
      'text-anchor': 'middle' }, svg));
    eLbl.textContent = `‖u−v‖ = ${pair.euclidExact || ''} ≈ ${pair.euclid.toFixed(2)}`;

    // angle + cosine readout — step 2
    layer('angle', 2);
    if (Math.abs(pair.angleDeg) > 1) {
      const a0 = Math.atan2(pair.u[1], pair.u[0]), a1 = Math.atan2(pair.v[1], pair.v[0]);
      const r = unit * 0.6, large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
      const sweep = a1 > a0 ? 0 : 1;
      add('angle', el('path', { class: 'cs-arc',
        d: `M ${O.x + r * Math.cos(a0)} ${O.y - r * Math.sin(a0)} A ${r} ${r} 0 ${large} ${sweep} ${O.x + r * Math.cos(a1)} ${O.y - r * Math.sin(a1)}` }, svg));
    }
    // Readout pinned to a FIXED top-left corner of the plot, not on the origin — so when u and v are
    // collinear (cos=1 / θ=0) it never piles onto the "u" label or the angle arc. (audit #3)
    const aTag = add('angle', el('text', { x: 12, y: 24, class: 'cs-tag cs-tag-angle' }, svg));
    aTag.textContent = `${labels.angleLabel || 'θ'} = ${pair.angleDeg}°   ${labels.cosLabel || 'cos'} = ${pair.cos}`;

    // normalized points on the unit sphere — step 3
    const nu = P(norm(pair.u)), nv = P(norm(pair.v));
    add('unit', el('circle', { cx: nu.x, cy: nu.y, r: 5, class: 'cs-dot cs-dot-u' }, svg));
    add('unit', el('circle', { cx: nv.x, cy: nv.y, r: 5, class: 'cs-dot cs-dot-v' }, svg));

    // caption panel (below the figure) — this widget owns its caption/counter (scaffold:false)
    const cap = document.createElement('div');
    cap.className = 'cs-caption';
    host.appendChild(cap);
    const counter = document.createElement('div');
    counter.className = 'cs-counter';
    host.appendChild(counter);

    const MAX = 4;
    // per-step update (factory clamps k to [0,maxStep] and owns host.dataset.step)
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
      cap.textContent = labels['s' + k] || '';
      counter.textContent = `${k} / ${MAX}`;
    };
  },
});
