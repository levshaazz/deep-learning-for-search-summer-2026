/* hyde-embed/logic.js — L14 "The Artificer's Quill" · the HyDE cosine-jump figure.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no input. Reads data/l14-rewrite.json
   (data.cosineJump.gold = [cosRaw, cosHyde], data.cosineJump.trap = [cosRaw, cosHyde]).
   Two parallel cosine number lines (0 = far, 1 = identical to the query): the RAW query row where
   the lexical trap sits closer than the gold, and the HyDE row where embedding a hypothetical answer
   lifts the gold far to the right (the cosine jump) and drops the trap left. Cumulative reveal over
   4 steps; all numbers from data, all text from i18n. maxStep = 3.

   Built on the shared widgets/_widget-base.js factory (default scaffold): the factory owns the
   wgt-root/wgt-fade host, the caption/counter, the setStep clamp + host.dataset.step, and the
   window.mountHydeEmbed registration; render() only draws the SVG layers + returns update(step). */
import { defineWidget } from '../_widget-base.js';

export const mountHydeEmbed = defineWidget({
  id: 'hyde-embed',
  rootClass: 'hyde-root',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const jump = (data && data.cosineJump) || { gold: [0.22, 0.63], trap: [0.45, 0.16] };
    const gRaw = jump.gold[0], gHyde = jump.gold[1];
    const tRaw = jump.trap[0], tHyde = jump.trap[1];
    const f2 = (x) => x.toFixed(2);

    const W = 560, H = 300, AX0 = 78, AX1 = 512, AXW = AX1 - AX0;
    const rawY = 112, hydeY = 214;
    const x = (c) => AX0 + Math.max(0, Math.min(1, c)) * AXW;

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'hyde-svg wgt-svg',
      role: labels.role || 'img', 'aria-label': labels.alt || '' }, host);

    // cumulative-reveal layer bookkeeping (same pattern as cosine-sphere)
    const layers = {};
    const layer = (name, from) => (layers[name] = { from, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };
    const txt = (name, ax, ay, cls, anchor, s) => {
      const t = add(name, el('text', { x: ax, y: ay, class: cls, 'text-anchor': anchor || 'middle' }, svg));
      t.textContent = s; return t;
    };

    // ── one number-line axis (line + 0/0.5/1 ticks) ──
    function axis(name, rowY, withEnds) {
      add(name, el('line', { x1: AX0, y1: rowY, x2: AX1, y2: rowY, class: 'hyde-axis' }, svg));
      for (const c of [0, 0.5, 1]) {
        add(name, el('line', { x1: x(c), y1: rowY - 5, x2: x(c), y2: rowY + 5, class: 'hyde-tick' }, svg));
      }
      if (withEnds) {
        txt(name, AX0, rowY + 22, 'hyde-end', 'start', labels.farLabel || '0 · far');
        txt(name, AX1, rowY + 22, 'hyde-end', 'end', labels.nearLabel || '1 · identical');
      }
    }

    // ── a labelled marker (dot + name + cosine) on a row ──
    function marker(name, c, rowY, cls, label, above) {
      add(name, el('circle', { cx: x(c), cy: rowY, r: 6, class: 'hyde-dot ' + cls }, svg));
      const ly = above ? rowY - 12 : rowY + 26;
      txt(name, x(c), ly, 'hyde-mlbl ' + cls, 'middle', `${label} · ${f2(c)}`);
    }

    // top axis title (declare the layer BEFORE adding to it)
    layer('title', 0);
    txt('title', W / 2, 26, 'hyde-title', 'middle', labels.axisLabel || 'cosine to the query');

    // RAW row (from step 0; markers from step 1)
    layer('rawAxis', 0); axis('rawAxis', rawY, true);
    txt('rawAxis', AX0, rawY - 26, 'hyde-row', 'start', labels.rawRow || 'raw query');
    layer('rawMark', 1);
    marker('rawMark', gRaw, rawY, 'hyde-gold', labels.goldLabel || 'gold', true);
    marker('rawMark', tRaw, rawY, 'hyde-trap', labels.trapLabel || 'trap', false);

    // HyDE row (axis + draft note from step 2; markers + jump from step 3)
    layer('hydeAxis', 2); axis('hydeAxis', hydeY, false);
    txt('hydeAxis', AX0, hydeY - 26, 'hyde-row', 'start', labels.hydeRow || 'HyDE pseudo-doc');
    layer('draft', 2);
    txt('draft', W / 2, H - 10, 'hyde-note', 'middle', labels.draftNote || '');

    layer('hydeMark', 3);
    marker('hydeMark', gHyde, hydeY, 'hyde-gold', labels.goldLabel || 'gold', true);
    marker('hydeMark', tHyde, hydeY, 'hyde-trap', labels.trapLabel || 'trap', false);

    // jump arrows (raw → hyde) + annotation
    layer('jump', 3);
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'hyde-arrow', class: 'hyde-mk', viewBox: '0 0 10 10', refX: 8, refY: 5,
      markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z' }, mk);
    for (const [c0, c1, cls] of [[gRaw, gHyde, 'hyde-gold'], [tRaw, tHyde, 'hyde-trap']]) {
      add('jump', el('line', { x1: x(c0), y1: rawY + 8, x2: x(c1), y2: hydeY - 8,
        class: 'hyde-jump ' + cls, 'marker-end': 'url(#hyde-arrow)' }, svg));
    }
    const jn = (labels.jumpNote || 'gold {a} → {b}').replace('{a}', f2(gRaw)).replace('{b}', f2(gHyde));
    txt('jump', W / 2, (rawY + hydeY) / 2 + 4, 'hyde-jumpnote', 'middle', jn);

    // per-step cumulative visibility (factory owns the caption + counter)
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
