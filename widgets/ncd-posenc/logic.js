/* ncd-posenc/logic.js — sinusoidal positional encoding in the neural-circuit-diagram lens.
   A position index (blue) is broadcast over the 4-dim embedding axis; each dimension pair carries a
   frequency and a sin/cos op. Every NUMBER comes from data/l15-attention.json (gen_l15.py): freqs
   [1, 0.01], pos0 (0,1,0,1), pos1 (0.841,0.540,0.010,1.000). Step 0 = pos 0, 1 = pos 1, 2 = why two
   scales (fast vs slow frequency). DRIVER-AGNOSTIC, ON-BRAND, COLLISION-FREE (verified by detector). */
import { defineWidget } from '../_widget-base.js';
import { glyphs } from '../_ncd.js';
import { stack } from '../_layout.js';

export const mountNcdPosenc = defineWidget({
  id: 'ncd-posenc',
  rootClass: 'ncdpe-root',
  exportName: 'mountNcdPosenc',
  maxStep: 2,
  render({ host, data, labels, el }) {
    const L = (k, fb) => (labels && labels[k]) || fb;
    const P = (data && data.posEnc) || { freqs: [1.0, 0.01], pos0: [0, 1, 0, 1], pos1: [0.841, 0.540, 0.010, 1.000] };
    const G = glyphs(el);
    const W = 720, H = 288;
    const svg = el('svg', { class: 'ncdpe-svg', viewBox: `0 0 ${W} ${H}`,
      role: 'img', 'aria-label': L('alt', 'Positional encoding as a neural circuit diagram') }, host);

    // dims 0..3 = pairs (sin,cos)×(freq0,freq1)
    const DIMS = [{ op: 'sin', f: 0 }, { op: 'cos', f: 0 }, { op: 'sin', f: 1 }, { op: 'cos', f: 1 }];
    const rows = stack({ x: 40, y: 58, w: 640, h: 196 }, 4, { dir: 'col', gap: 10 });
    const midY = (rows[0].y + rows[0].h / 2 + rows[3].y + rows[3].h / 2) / 2;
    const xPos = 84, xDim = 176, xOp = 250, xFreq = 300, xChip = 432, xBrace = 466;

    let main = null;
    return (step) => {
      if (main) main.remove();
      main = el('g', {}, svg);
      const g = main;
      const posNum = step === 0 ? 0 : 1;
      const vals = step === 0 ? P.pos0 : P.pos1;

      // position index (broadcast source)
      el('rect', { class: 'ncdpe-pos', x: xPos - 44, y: midY - 20, width: 88, height: 40, rx: 8 }, g);
      G.text(g, xPos, midY - 4, L('lblPos', 'position'), 'ncdpe-pos-lbl');
      G.text(g, xPos, midY + 15, 'pos = ' + posNum, 'ncdpe-pos-txt');

      // column headers
      G.text(g, xOp, rows[0].y - 4, 'sin / cos', 'ncdpe-hdr');
      G.text(g, xChip, rows[0].y - 4, L('lblPE', 'PE(pos)'), 'ncdpe-hdr');

      // per-dimension rows
      DIMS.forEach((dm, i) => {
        const cy = rows[i].y + rows[i].h / 2;
        const isFast = dm.f === 0, hot = step === 2 && isFast, cold = step === 2 && !isFast;
        // broadcast fan: position → this dim's op
        el('path', { class: 'ncdpe-fan', d: `M${xPos + 44},${midY} C${xPos + 90},${midY} ${xOp - 80},${cy} ${xOp - 38},${cy}` }, g);
        G.text(g, xDim, cy + 4, L('lblDim', 'dim') + ' ' + i, 'ncdpe-dim');
        // sin/cos op box with the frequency folded in (so nothing floats on the wire)
        const opCls = hot ? 'ncdpe-op-hot' : cold ? 'ncdpe-op-cold' : 'ncdpe-op';
        el('rect', { class: opCls, x: xOp - 34, y: cy - 15, width: 68, height: 30, rx: 6 }, g);
        G.text(g, xOp, cy + 4, dm.op + ' ·' + P.freqs[dm.f], 'ncdpe-op-txt');
        // wire → value chip
        G.wire(g, 'ncdpe-w ncdpe-w-d', xOp + 34, cy, xChip - 30, cy, { arrow: true });
        el('rect', { class: hot ? 'ncdpe-chip ncdpe-chip-hot' : 'ncdpe-chip', x: xChip - 28, y: cy - 12, width: 56, height: 24, rx: 5 }, g);
        G.text(g, xChip, cy + 4, G.fmt3(vals[i]), 'ncdpe-chipv');
      });

      // brace grouping the value chips into the PE vector
      const y0 = rows[0].y + rows[0].h / 2 - 14, y1 = rows[3].y + rows[3].h / 2 + 14;
      el('path', { class: 'ncdpe-brace', d: `M${xBrace},${y0} q6,0 6,8 V${(y0 + y1) / 2 - 6} q0,6 6,6 q-6,0 -6,6 V${y1 - 8} q0,8 -6,8` }, g);
      G.text(g, xBrace + 22, (y0 + y1) / 2 + 4, '= PE', 'ncdpe-pe', 'start');

      // step-2 fast/slow annotations (right of the vector, clear of chips)
      if (step === 2) {
        G.text(g, xBrace + 70, rows[0].y + rows[0].h / 2 + 4, '↕ ' + L('fast', 'fast'), 'ncdpe-anno ncdpe-anno-fast', 'start');
        G.text(g, xBrace + 70, rows[2].y + rows[2].h / 2 + 4, '· ' + L('slow', 'slow'), 'ncdpe-anno ncdpe-anno-slow', 'start');
      }
      G.text(g, W / 2, H - 6, L('legMap', 'position broadcasts over the dimension axis'), 'ncdpe-legend');
    };
  },
});
