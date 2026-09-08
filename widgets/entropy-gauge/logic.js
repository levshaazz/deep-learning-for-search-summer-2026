/* entropy-gauge/logic.js — L17 'стрелка удивления / the surprise needle'. Séréga's brass instrument
   reads SURPRISE in bits: the needle points at −log₂ p for the outcome under the pointer, and a red
   FLOOR line is welded onto the dial at H(p) — the average surprise you cannot get below. The right
   panel plots H(p) on p∈[0,1] (the concave cap that peaks at 1 bit for the fair coin), and a small
   pair of bars shows the two outcomes: raw surprise → weighted by how often it actually happens →
   stacked into H. Step 4 bolts a WRONG model q on top: the needle leaves the floor, and the hatched
   wedge between floor and needle is the KL tax.

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll — the deck driver and the
   Book's Scrollama both call setStep(k). Built on widgets/_widget-base.js.

   IT COMPUTES NOTHING NUMERIC. Every displayed number is read out of data/l17-entropy.json:
     data.coin.pHeads · .H · .crossEntropyQ · .klQ · .pplQ · .pplFloor   (the readouts + the needle)
     data.coinCurve.p[] · .H[] · .argmax · .max                          (the curve + its peak)
   so the browser shows exactly what `_research/check_claims.py` checks. Labels come from i18n.

   ONE DATA GAP, DOCUMENTED: data.coinCurve gives H(p), NOT −log₂ p, so the two SELF-INFORMATION bar
   heights of step 0 are not indexable out of the curve. The widget therefore accepts an OPTIONAL
   `data.coin.selfInfo` = [−log₂ p, −log₂(1−p)] and falls back to the gated pair [2, 0.415] when the
   generator has not (yet) emitted it. Nothing else in the figure has a fallback number: the weighted
   bars carry NO printed value at all (only the symbolic ×p / ×(1−p) tags), and their stack is scaled
   so that its total length is exactly data.coin.H — the sum is the datum, not an arithmetic result.

   Steps (maxStep = 4):
     0 → self-information per outcome: rare = tall, common = short.                        s0
     1 → weight each bar by how often it happens — the rare one contributes LITTLE.         s1
     2 → the contributions stack: the sum IS H(p); the H(p) curve appears, peaking at 1 bit. s2
     3 → the needle locks at p = 0.25 → H = 0.8113; below 1 bit ⇒ the skew is exploitable.  s3
     4 → a wrong model q = 0.5: H(p,q) = 1.0 and the hatched KL gap 0.1887 above the floor.  s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

let UID = 0;                       // unique <pattern> id per paint (two mounts on one page must not clash)

export const mountEntropyGauge = defineWidget({
  id: 'entropy-gauge',
  rootClass: 'eg-root',
  exportName: 'mountEntropyGauge',
  maxStep: 4,
  render({ host, data, labels, el }) {
    // ── data (guarded, infonce-calc style: nothing here is computed, only read) ──
    const c = (data && data.coin) || {};
    const cc = (data && data.coinCurve) || {};
    const P = typeof c.pHeads === 'number' ? c.pHeads : 0.25;
    const HBITS = typeof c.H === 'number' ? c.H : 0.8113;
    const CE = typeof c.crossEntropyQ === 'number' ? c.crossEntropyQ : 1.0;
    const KL = typeof c.klQ === 'number' ? c.klQ : 0.1887;
    const PPQ = typeof c.pplQ === 'number' ? c.pplQ : 2.0;
    const PPF = typeof c.pplFloor === 'number' ? c.pplFloor : 1.7548;
    // OPTIONAL per the note above: [−log₂ p, −log₂(1−p)] for the two step-0 bars.
    const SI = (Array.isArray(c.selfInfo) && c.selfInfo.length === 2) ? c.selfInfo : [2, 0.415];
    const CP = Array.isArray(cc.p) ? cc.p : [];
    const CH = Array.isArray(cc.H) ? cc.H : [];
    const HMAX = typeof cc.max === 'number' ? cc.max : 1;
    const ARGMAX = typeof cc.argmax === 'number' ? cc.argmax : 0.5;

    // ── number → string. NO arithmetic: String() of a datum, with the language's decimal mark. ──
    const DEC = labels.dec === ',' ? ',' : '.';
    const f = (v) => (typeof v !== 'number' || !isFinite(v) ? '' : String(v).replace('.', DEC));
    // unit agreement is a STRING choice, not arithmetic: exactly one bit takes `bits1`
    // (en "bit", ru «бит»), everything else `bits` (en "bits", ru «бита» — the genitive
    // Russian wants after 2 and after any decimal). Tatar has one form for both.
    const unit = (v) => (v === 1 ? (labels.bits1 || labels.bits || 'bit') : (labels.bits || 'bits'));
    const val = (v) => f(v) + ' ' + unit(v);

    // ── frame geometry ──
    const W = 600, PAD = 20;
    const CX = 158, CY = 200, R = 104;              // dial: semicircle, 0 bits at the left, VMAX at the right
    const RLBL = 86, RNEEDLE = 70, RFLOOR_IN = 30, RFLOOR_OUT = 114, RHLBL = 126;
    const VMAX = 6.6;                               // dial span in bits (a p = 0.01 outcome still fits)
    const PX0 = 330, PX1 = 580, PY0 = 104, PY1 = 200;  // H(p) plot rect
    const BAR_X0 = 108, PXB = 62, ROWH = 24, ROW_A = 276, ROW_B = 310;  // the two outcome bars
    const WTAG_X = 246, RD_X = 330;

    const rad = (v) => (180 - Math.max(0, Math.min(1, v / VMAX)) * 180) * Math.PI / 180;
    const dx = (v, r) => CX + r * Math.cos(rad(v));
    const dy = (v, r) => CY - r * Math.sin(rad(v));
    const xFor = (p) => PX0 + Math.max(0, Math.min(1, p)) * (PX1 - PX0);
    const yFor = (h) => PY1 - (Math.max(0, h) / (HMAX || 1)) * (PY1 - PY0);
    const n2 = (x) => x.toFixed(2);

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg eg-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // hatch pattern for the KL wedge (stroke colour comes from CSS → themes for free)
    const HID = 'eg-hatch-' + (++UID);
    const defs = el('defs', {}, svg);
    const pat = el('pattern', { id: HID, width: 6, height: 6, patternUnits: 'userSpaceOnUse',
      patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'eg-hatchline' }, pat);

    const layers = {};
    const layer = (n, from) => (layers[n] = { from, nodes: [] });
    const add = (n, node) => { layers[n].nodes.push(node); return node; };
    const txt = (n, x, y, cls, s, anchor) => {
      const t = add(n, el('text', anchor ? { x, y, class: cls, 'text-anchor': anchor } : { x, y, class: cls }, svg));
      t.textContent = s;
      return t;
    };

    // ── header + panel headers ──
    layer('head', 0);
    txt('head', PAD, 24, 'eg-head', labels.head || 'the surprise needle');
    txt('head', PAD, 52, 'eg-sub', labels.dialHead || 'surprise, bits');
    txt('head', PAD, 264, 'eg-sub', labels.barsHead || 'per-outcome surprise, then weighted');

    /* ── LEFT: the dial. PAINT ORDER IS LOAD-BEARING: rim/ticks, then the red floor, then the
       hatched KL wedge, and the NEEDLE LAST — at step 3 the needle lands exactly on the floor,
       and whichever of the two is drawn second is the one you see. The needle is the protagonist,
       so it goes on top; red stays reserved for the floor + the KL tax it fences off. ── */
    layer('dial', 0);
    add('dial', el('path', { d: `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`, class: 'eg-rim' }, svg));
    for (let v = 0; v <= 6; v++) {
      add('dial', el('line', { x1: n2(dx(v, R - 7)), y1: n2(dy(v, R - 7)),
        x2: n2(dx(v, R)), y2: n2(dy(v, R)), class: 'eg-tickmark' }, svg));
    }
    // sparse tick labels only (0, 1, 2, 4, 6) — a full 0..6 ring collides at this radius.
    for (const v of [0, 1, 2, 4, 6]) {
      const t = txt('dial', n2(dx(v, RLBL)), n2(dy(v, RLBL) + 4), 'eg-tick', String(v), 'middle');
      t.setAttribute('aria-hidden', 'true');
    }

    // ── the entropy FLOOR, welded on the dial at H (course red) + its twin rule on the curve ──
    layer('floor', 3);
    add('floor', el('line', { x1: n2(dx(HBITS, RFLOOR_IN)), y1: n2(dy(HBITS, RFLOOR_IN)),
      x2: n2(dx(HBITS, RFLOOR_OUT)), y2: n2(dy(HBITS, RFLOOR_OUT)), class: 'eg-floor' }, svg));
    txt('floor', n2(dx(HBITS, RHLBL)), n2(dy(HBITS, RHLBL) + 4), 'eg-floorlbl', labels.floorTag || 'H', 'middle');
    add('floor', el('line', { x1: PX0, y1: n2(yFor(HBITS)), x2: n2(xFor(P)), y2: n2(yFor(HBITS)), class: 'eg-rule' }, svg));
    add('floor', el('circle', { cx: n2(xFor(P)), cy: n2(yFor(HBITS)), r: 5, class: 'eg-dot' }, svg));

    // ── the KL wedge: hatched, between the floor H and the needle at H(p,q) ──
    layer('kl', 4);
    add('kl', el('path', { d: `M ${CX} ${CY} L ${n2(dx(HBITS, R))} ${n2(dy(HBITS, R))} ` +
      `A ${R} ${R} 0 0 1 ${n2(dx(CE, R))} ${n2(dy(CE, R))} Z`,
      fill: `url(#${HID})`, class: 'eg-klwedge' }, svg));
    add('kl', el('path', { d: `M ${n2(dx(HBITS, R))} ${n2(dy(HBITS, R))} ` +
      `A ${R} ${R} 0 0 1 ${n2(dx(CE, R))} ${n2(dy(CE, R))}`, class: 'eg-klrim' }, svg));

    // ── the needle itself (last, so it rides over the floor and the wedge) ──
    const needle = add('dial', el('line', { x1: CX, y1: CY, x2: n2(dx(SI[0], RNEEDLE)), y2: n2(dy(SI[0], RNEEDLE)),
      class: 'eg-needle' }, svg));
    add('dial', el('circle', { cx: CX, cy: CY, r: 5, class: 'eg-hub' }, svg));
    const dialRead = txt('dial', CX, 234, 'eg-read-main', '', 'middle');

    // ── RIGHT: the H(p) curve on [0,1] ──
    layer('curve', 2);
    txt('curve', PX0, 52, 'eg-sub', labels.curveHead || 'H(p) — bits per toss');
    add('curve', el('line', { x1: PX0, y1: PY1, x2: PX1, y2: PY1, class: 'eg-axis' }, svg));
    add('curve', el('line', { x1: PX0, y1: PY0, x2: PX0, y2: PY1, class: 'eg-axis' }, svg));
    txt('curve', PX0 - 6, PY1 + 4, 'eg-tick', f(0), 'end');
    txt('curve', PX0 - 6, PY0 + 4, 'eg-tick', f(HMAX), 'end');
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {      // sparse p labels only — the axis carries no others
      txt('curve', n2(xFor(p)), 218, 'eg-tick', f(p), 'middle');
    }
    if (CP.length && CP.length === CH.length) {
      const pts = CP.map((p, i) => n2(xFor(p)) + ',' + n2(yFor(CH[i]))).join(' ');
      add('curve', el('polyline', { points: pts, class: 'eg-curve' }, svg));
    }
    add('curve', el('line', { x1: n2(xFor(ARGMAX)), y1: PY0, x2: n2(xFor(ARGMAX)), y2: PY1, class: 'eg-peakline' }, svg));
    add('curve', el('circle', { cx: n2(xFor(ARGMAX)), cy: n2(yFor(HMAX)), r: 4, class: 'eg-peak' }, svg));
    txt('curve', n2(xFor(ARGMAX)), 94, 'eg-peaklbl', (labels.maxTag || 'max') + ' = ' + val(HMAX), 'middle');

    // ── the two outcome bars (rails + bars + labels) ──
    layer('bars', 0);
    const railW = PXB * SI[0];
    const railA = add('bars', el('rect', { x: BAR_X0, y: ROW_A, width: n2(railW), height: ROWH, rx: 5, class: 'eg-rail' }, svg));
    add('bars', el('rect', { x: BAR_X0, y: ROW_B, width: n2(railW), height: ROWH, rx: 5, class: 'eg-rail' }, svg));
    const barA = add('bars', el('rect', { x: BAR_X0, y: ROW_A, width: n2(railW), height: ROWH, rx: 5, class: 'eg-bar-rare' }, svg));
    const barB = add('bars', el('rect', { x: BAR_X0, y: ROW_B, width: n2(PXB * SI[1]), height: ROWH, rx: 5, class: 'eg-bar-common' }, svg));
    const nameA = txt('bars', BAR_X0 - 8, ROW_A + ROWH / 2 + 4, 'eg-name eg-t-rare', labels.outRare || 'heads (p)', 'end');
    const nameB = txt('bars', BAR_X0 - 8, ROW_B + ROWH / 2 + 4, 'eg-name eg-t-common', labels.outCommon || 'tails (1−p)', 'end');
    const valA = txt('bars', 0, ROW_A + ROWH / 2 + 4, 'eg-val eg-t-rare', val(SI[0]));
    const valB = txt('bars', 0, ROW_B + ROWH / 2 + 4, 'eg-val eg-t-common', val(SI[1]));
    const wtagA = txt('bars', WTAG_X, ROW_A + ROWH / 2 + 4, 'eg-wtag', labels.wRare || '× p');
    const wtagB = txt('bars', WTAG_X, ROW_B + ROWH / 2 + 4, 'eg-wtag', labels.wCommon || '× (1−p)');
    const stackLbl = txt('bars', 0, ROW_B + ROWH / 2 + 4, 'eg-stack', (labels.rdH || 'H(p)') + ' = ' + val(HBITS));

    // ── readouts (right column). H itself is NOT repeated here: the stack label and the needle
    //    already read it off two instruments, and a third copy is noise. ──
    layer('rd3', 3);
    txt('rd3', RD_X, 250, 'eg-read-note', labels.rdBelow || 'below 1 bit ⇒ the skew is exploitable');
    layer('rd4', 4);
    txt('rd4', RD_X, 286, 'eg-read', (labels.rdCE || 'H(p,q)') + ' = ' + val(CE));
    txt('rd4', RD_X, 308, 'eg-read-red', (labels.rdKL || 'KL(p‖q)') + ' = ' + val(KL));
    txt('rd4', RD_X, 330, 'eg-read-note', (labels.rdPP || 'PP') + ' = ' + f(PPQ) +
      '  (' + (labels.rdFloor || 'floor') + ' ' + f(PPF) + ')');

    const H = frameHeightFor(336, 12);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // bar geometry per step — lengths only; the STACK total is pinned to data.coin.H exactly.
    const lenRaw = [PXB * SI[0], PXB * SI[1]];
    const wA = PXB * SI[0] * P;                       // the rare outcome's share of the stack
    const lenW = [wA, PXB * HBITS - wA];              // …and the rest, so wA + rest === PXB · H
    const place = (r, x, y, w) => { r.setAttribute('x', n2(x)); r.setAttribute('y', y); r.setAttribute('width', n2(Math.max(2, w))); };

    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const node of layers[name].nodes) node.classList.toggle('is-hidden', !on);
      }

      // dial: the needle reads self-information (0–2), the floor H (3), then the wrong model's H(p,q) (4).
      const nv = k >= 4 ? CE : (k >= 3 ? HBITS : SI[0]);
      needle.setAttribute('x2', n2(dx(nv, RNEEDLE)));
      needle.setAttribute('y2', n2(dy(nv, RNEEDLE)));
      needle.classList.toggle('is-off-floor', k >= 4);
      dialRead.textContent = (k >= 4 ? (labels.rdCE || 'H(p,q)')
        : k >= 3 ? (labels.rdH || 'H(p)') : (labels.rdSelf || '−log₂ p')) + ' = ' + val(nv);

      // bars: raw (0) → weighted (1) → stacked into H (2+).
      const stacked = k >= 2;
      const L = k >= 1 ? lenW : lenRaw;
      place(barA, BAR_X0, stacked ? ROW_B : ROW_A, L[0]);
      place(barB, stacked ? BAR_X0 + L[0] : BAR_X0, ROW_B, L[1]);
      railA.classList.toggle('is-hidden', stacked);
      valA.setAttribute('x', n2(BAR_X0 + L[0] + 8));
      valB.setAttribute('x', n2(BAR_X0 + L[1] + 8));
      stackLbl.setAttribute('x', n2(BAR_X0 + L[0] + L[1] + 8));
      valA.classList.toggle('is-hidden', k !== 0);
      valB.classList.toggle('is-hidden', k !== 0);
      wtagA.classList.toggle('is-hidden', k !== 1);
      wtagB.classList.toggle('is-hidden', k !== 1);
      nameA.classList.toggle('is-hidden', stacked);
      nameB.classList.toggle('is-hidden', stacked);
      stackLbl.classList.toggle('is-hidden', !stacked);
    };
  },
});
