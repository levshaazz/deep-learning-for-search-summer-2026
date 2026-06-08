/* layernorm-viz/logic.js — L6 'climb-block' / Add&Norm beat: what LayerNorm DOES to one feature
   vector, geometrically. A bar view (8 dims on a shared baseline) is paired with a unit-circle view
   so "normalise = put the vector on a sphere" is literally visible.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). EVERY number — x, mean=5.0, var=7.5, std, the centred / normed /
   out bars, normedMean≈0, normedVar≈1, γ, β — comes straight from data/l6-layernorm.json (the same
   source the facts-gate checks), never from these strings.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold, setStep
   clamp, window.mountLayernormViz registration); render() only draws the figure layers. No raw colors
   — all fills/strokes reference design tokens via var(--…); the .wgt-fade .is-hidden rule in
   widgets/_base.css drives the per-step reveal, so no per-widget style.css is needed.

   Steps (maxStep = 3):
     0  → raw vector x as 8 bars, off-centre; mean=5.0 baseline, var=7.5 readout.   caption s0
     1  → subtract the mean: bars → `centred`; the baseline slides 5.0 → 0.         caption s1
     2  → divide by std: bars → `normed`; mean 0 / var 1; the vector lands on the
          unit circle (the sphere glyph activates).                                caption s2
     3  → learned γ·normed + β → `out`: per-dim gain/shift bends the bars.          caption s3 */
import { defineWidget, fmt } from '../_widget-base.js';
import { frameHeightFor, clampSegmentToRect } from '../_plot-util.js';

export const mountLayernormViz = defineWidget({
  id: 'layernorm-viz',
  rootClass: 'ln-root',
  exportName: 'mountLayernormViz',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const x = data.x || [];
    const centred = data.centred || [];
    const normed = data.normed || [];
    const out = data.out || [];
    const gamma = data.gamma || [];
    const beta = data.beta || [];
    const dim = data.dim != null ? data.dim : x.length;
    const mean = data.mean, vAr = data.var, std = data.std;
    const normedMean = data.normedMean, normedVar = data.normedVar;

    // per-step value vector for the bars, and the baseline (μ-line) value in DATA units.
    const series = [x, centred, normed, out];
    const baseVal = [mean, 0, 0, 0];          // s0 baseline = mean 5.0; s1+ baseline = 0
    // mean/var readout per step (from data; not invented): s0 raw, s1 centred (mean 0, same var),
    // s2/s3 normalised (mean 0, var 1).
    const meanReadout = [mean, 0, normedMean, normedMean];
    const varReadout = [vAr, vAr, normedVar, normedVar];

    const num = (v, d = 2) => (typeof v !== 'number' ? '' : Number.isInteger(v) ? String(v) : fmt(v, d));

    // ── geometry ───────────────────────────────────────────────────────────
    const PAD = 16, RPAD = 64;                // RPAD: right gutter so the raw/normed arrow LABELS
                                              // (drawn just past the ring) never run off the frame.
    // BAR PANEL (left ~62%): 8 vertical bars on a shared baseline that can sit anywhere in the band.
    const barTop = 30, barH = 188;            // drawing band for the bars
    const barBase = barTop + barH;            // pixel y of the band's floor
    const panelW = 286;                       // bar panel width
    const gutter = 46;                        // y-axis gutter (holds the short "μ = …" line label)
    const bx0 = PAD + gutter;                 // first bar's left
    const slotW = (panelW - gutter) / dim;
    const barW = slotW * 0.62;
    // value→pixel: a symmetric data range that holds the largest |value| across all steps, so bars
    // never escape the band. Raw x peaks at 9 (above μ); centred/normed/out are small. We scale the
    // RAW step against [0, maxRaw] and the centred/normed/out steps against a symmetric [-S, S].
    const maxRaw = Math.max(...x, 1);                          // 9
    const S = Math.max(2, ...centred.map(Math.abs), ...normed.map(Math.abs), ...out.map(Math.abs));
    // pixel for a value at a given step: raw step maps [0,maxRaw] onto the band bottom→top;
    // centred/normed/out map [-S,S] onto bottom→top (0 in the middle of the band).
    const yRaw = (v) => barBase - (v / maxRaw) * barH;
    const ySym = (v) => barBase - (barH / 2) - (v / S) * (barH / 2 - 6);
    const yFor = (v, step) => (step === 0 ? yRaw(v) : ySym(v));

    // UNIT-CIRCLE PANEL (right): the vector reduced to 2 representative coords, drawn as an arrow from
    // the origin. Before normalisation the arrow is long/off; after, it sits exactly on the unit ring.
    const circR = 64;
    // FIXED circle-panel width (was W-derived, which let cx drift right and pushed the arrow LABELS
    // off the frame at 1280). The panel sits right of the bars; the frame's total width W is then
    // panel-right + RPAD, so the labels just past the ring always have room and nothing clips.
    const cBox = { x: PAD + panelW + 8, y: barTop, w: 150, h: barH };
    const W = cBox.x + cBox.w + RPAD;         // = 310 + 150 + 64 = 524 (viewBox width)
    const cx = cBox.x + cBox.w / 2, cy = cBox.y + cBox.h / 2 - 4;
    const sphereRect = { x: cBox.x, y: cBox.y, w: cBox.w, h: cBox.h };
    // pick two dims with opposite sign in `normed` so the arrow points into a clear quadrant.
    const di = 2, dj = 0;                     // normed[2]=+1.46 (max), normed[0]=+.365 → use [2],[6]
    const dk = 6;                             // normed[6] = -0.7303 (negative) for a 2-quadrant arrow
    // raw 2-vector (x) vs normed 2-vector — normalise each to its own L2 so the ring landing is exact.
    const rawVec = [x[di] - mean, x[dk] - mean];                // pre-norm direction (centred coords)
    const normVec = [normed[di], normed[dk]];
    const unit = (v) => { const m = Math.hypot(v[0], v[1]) || 1; return [v[0] / m, v[1] / m]; };
    // raw arrow drawn LONGER than the ring (off the unit sphere); normed arrow ends ON the ring.
    const rawU = unit(rawVec), normU = unit(normVec);
    const rawLen = circR * 1.42, normLen = circR;

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg ln-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const txt = (x0, y0, s, attrs = {}) => {
      const t = el('text', { x: x0, y: y0, ...attrs }, svg);
      t.textContent = s; return t;
    };

    // ── headings ─────────────────────────────────────────────────────────────
    layer('frame', 0);
    add('frame', txt(PAD, barTop - 12, labels.rawHead || 'feature vector x',
      { font: '700 12px var(--font-mono, monospace)', fill: 'var(--ink-2, #3D434E)' }));
    // zero / band-floor axis line (always shown) — the reference the baseline rides on.
    // fill:none keeps it stroke-only (guide lines must not read as a black-filled void).
    add('frame', el('line', { x1: bx0 - 8, y1: barBase, x2: PAD + panelW - 8, y2: barBase, fill: 'none',
      stroke: 'var(--rule-strong, #B8B19E)', 'stroke-width': 1.25 }, svg));

    // ── the baseline / μ-line (animated 5.0 → 0) ──────────────────────────────
    // one line element reused across steps; its y + label update in update(k).
    const baseLine = el('line', { x1: bx0 - 8, y1: yRaw(mean), x2: PAD + panelW - 8, y2: yRaw(mean),
      fill: 'none', stroke: 'var(--warm, #E8743B)', 'stroke-width': 1.5, 'stroke-dasharray': '5 3' }, svg);
    // the μ-line label sits in the LEFT y-gutter (left-anchored, just above the line) so it never
    // overlaps a bar; it is the SHORT "μ = …" form (the full mean/var/std prose is the bottom
    // readout). Its y follows the line in update().
    const baseLbl = txt(PAD, yRaw(mean) - 4, '', { font: '700 10px var(--font-mono, monospace)',
      fill: 'var(--warm-ink, #B4521F)', 'text-anchor': 'start' });
    add('frame', baseLine); add('frame', baseLbl);

    // ── the 8 bars (one rect per dim, redrawn in place each step) ─────────────
    const bars = [];
    for (let i = 0; i < dim; i++) {
      const bxi = bx0 + i * slotW + (slotW - barW) / 2;
      const r = el('rect', { x: bxi, width: barW, rx: 2,
        fill: 'var(--accent, #2A6FDB)', stroke: 'var(--accent-ink, #1B4FA0)', 'stroke-width': 0.75 }, svg);
      add('frame', r);
      bars.push({ r, bxi });
    }

    // ── mean / var / std readout (two lines under the BAR panel; updates per step) ────
    // Anchored under the bars (left) so it has a stable home from step 0, before the circle panel
    // is revealed — it narrates mean 5→0 / var 7.5→1 / std as the bars transform.
    const roY = barBase + 18;
    const roLine1 = txt(PAD, roY, '', { font: '700 11px var(--font-mono, monospace)',
      fill: 'var(--ink-2, #3D434E)' });
    const roLine2 = txt(PAD, roY + 16, '', { font: '700 11px var(--font-mono, monospace)',
      fill: 'var(--warm-ink, #B4521F)' });
    add('frame', roLine1); add('frame', roLine2);

    // ── unit-circle panel (the "sphere") ──────────────────────────────────────
    // Revealed at step 2 — the beat where the vector is rescaled to unit variance and "lands on the
    // unit circle". Before that the panel is hidden so the build reads one reveal per step.
    // The heading is CENTRED over the circle (it is wider than the 150px panel; left-anchored it ran
    // off the right edge) so it always stays inside the frame.
    layer('sphere', 2);
    add('sphere', txt(cx, barTop - 12, labels.sphereHead || 'the vector on the unit circle',
      { font: '700 11px var(--font-mono, monospace)', fill: 'var(--ink-2, #3D434E)',
        'text-anchor': 'middle' }));
    // unit ring + axes. Guide lines carry fill:none so they are stroke-only (no spurious black fill).
    add('sphere', el('circle', { cx, cy, r: circR, fill: 'none',
      stroke: 'var(--rule-strong, #B8B19E)', 'stroke-width': 1.5 }, svg));
    add('sphere', el('line', { x1: cx - circR - 6, y1: cy, x2: cx + circR + 6, y2: cy, fill: 'none',
      stroke: 'var(--rule-strong, #B8B19E)', 'stroke-width': 1 }, svg));
    add('sphere', el('line', { x1: cx, y1: cy - circR - 6, x2: cx, y2: cy + circR + 6, fill: 'none',
      stroke: 'var(--rule-strong, #B8B19E)', 'stroke-width': 1 }, svg));
    add('sphere', el('circle', { cx, cy, r: 2.5, fill: 'var(--ink-3, #6B7280)' }, svg));
    // arrowhead def
    const defs = el('defs', {}, svg);
    const mk = (id, fill) => {
      const m = el('marker', { id, viewBox: '0 0 10 10', refX: '8', refY: '5',
        markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', fill }, m);
    };
    mk('ln-raw', 'var(--ink-4, #9CA3AF)');
    mk('ln-norm', 'var(--accent, #2A6FDB)');
    // a label placed at an arrow tip, nudged so its box stays inside the right gutter (RPAD).
    const tipLabel = (lyr, tx0, ty0, s, fill) => {
      // a ~6-char mono label at 10px is ~36px wide; if the tip is in the right gutter, anchor at end.
      const farRight = tx0 + 40 > W - 6;
      add(lyr, txt(farRight ? tx0 - 4 : tx0 + 4, ty0, s,
        { font: '700 10px var(--font-mono, monospace)', fill,
          'text-anchor': farRight ? 'end' : 'start' }));
    };
    // RAW arrow (off the ring) — appears WITH the circle at step 2 as the faint "before" reference,
    // so the contrast "long/off-ring → lands exactly on the ring" reads at the normalisation beat.
    layer('arrowRaw', 2);
    {
      const ex = cx + rawU[0] * rawLen, ey = cy - rawU[1] * rawLen;   // SVG y is down → invert
      const seg = clampSegmentToRect(cx, cy, ex, ey, sphereRect) || { x1: cx, y1: cy, x2: ex, y2: ey };
      add('arrowRaw', el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, fill: 'none',
        stroke: 'var(--ink-4, #9CA3AF)', 'stroke-width': 2, 'stroke-dasharray': '4 3',
        'marker-end': 'url(#ln-raw)' }, svg));
      // (no tip label: the faint dashed "before" arrow points the same way as the solid normed arrow,
      //  so a "raw x" tag here would stack on the "normed" tag — the dashed style reads as "before".)
    }
    // NORMED arrow (lands ON the ring) — appears at step 2
    layer('arrowNorm', 2);
    {
      const ex = cx + normU[0] * normLen, ey = cy - normU[1] * normLen;
      const seg = clampSegmentToRect(cx, cy, ex, ey, sphereRect) || { x1: cx, y1: cy, x2: ex, y2: ey };
      add('arrowNorm', el('line', { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, fill: 'none',
        stroke: 'var(--accent, #2A6FDB)', 'stroke-width': 2.5, 'marker-end': 'url(#ln-norm)' }, svg));
      // a dot exactly on the ring to make "landed on the sphere" literal
      add('arrowNorm', el('circle', { cx: cx + normU[0] * circR, cy: cy - normU[1] * circR, r: 4,
        fill: 'var(--accent, #2A6FDB)' }, svg));
      tipLabel('arrowNorm', cx + normU[0] * normLen, cy - normU[1] * normLen + 12,
        labels.normedTag || 'normed', 'var(--accent-ink, #1B4FA0)');
    }

    const H = frameHeightFor(Math.max(roY + 16, cBox.y + cBox.h) + 8, 8);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // stage label (the transform applied at this step) — RIGHT-anchored near the bar panel's right
    // edge so it never collides with the left-anchored "feature vector x (8 dims)" panel title, and
    // pulled in a little so it clears the centred circle-panel heading on its right.
    const stageLbl = txt(PAD + panelW - 24, barTop - 12, '',
      { font: '700 11px var(--font-mono, monospace)', fill: 'var(--accent-ink, #1B4FA0)',
        'text-anchor': 'end' });
    add('frame', stageLbl);
    const stageKey = ['stageRaw', 'stageCentred', 'stageNormed', 'stageOut'];

    return function update(k) {
      // layer visibility (range gating: a layer with a `to` hides once k passes it)
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const node of L.nodes) node.classList.toggle('is-hidden', !on);
      }
      // redraw the 8 bars for step k (each spans from the band-floor reference to the value pixel,
      // EXCEPT for negative values which hang below — we draw from the value to the baseline ref).
      const vals = series[k] || [];
      const ref = (k === 0) ? barBase : ySym(0);     // bars grow from this reference line
      vals.forEach((v, i) => {
        const yv = yFor(v, k);
        const top = Math.min(yv, ref), hgt = Math.max(2, Math.abs(yv - ref));
        bars[i].r.setAttribute('y', top);
        bars[i].r.setAttribute('height', hgt);
        // colour negatives warm, positives accent, so the recentred sign split reads at a glance
        bars[i].r.setAttribute('fill', v < 0 ? 'var(--warm, #E8743B)' : 'var(--accent, #2A6FDB)');
        bars[i].r.setAttribute('stroke', v < 0 ? 'var(--warm-ink, #B4521F)' : 'var(--accent-ink, #1B4FA0)');
      });
      // baseline (μ-line): s0 at mean 5.0 (in raw scale), s1+ at 0 (sym scale)
      const bY = (k === 0) ? yRaw(mean) : ySym(0);
      baseLine.setAttribute('y1', bY); baseLine.setAttribute('y2', bY);
      baseLbl.setAttribute('y', bY - 4);
      baseLbl.textContent = 'μ = ' + num(baseVal[k], 1);   // short form (gutter); prose is the readout
      // stage label
      stageLbl.textContent = labels[stageKey[k]] || '';
      // mean / var / std readout under the circle
      roLine1.textContent = (labels.meanLbl || 'mean μ') + ' = ' + num(meanReadout[k], 1)
        + '   ·   ' + (labels.varLbl || 'var σ²') + ' = ' + num(varReadout[k], 1);
      roLine2.textContent = (k === 0)
        ? (labels.stdLbl || 'std') + ' = ' + num(std, 4)
        : (k >= 2 ? '✓ ' + (labels.normedTag || 'normed') : '');
    };
  },
});
