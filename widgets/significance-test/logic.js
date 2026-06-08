/* significance-test/logic.js — L4 'Is the difference real?' the chapter's climax, made live.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no keyboard/scroll (the Book's Scrollama and the deck's
   arrow keys both call setStep). Reads data/l4-systems.json — the SAME source the deck + facts-gate
   check (15 per-query nDCG diffs; meanDiff 0.0397, sdDiff 0.0676, n=15; paired t=2.2753, p=0.03914;
   Wilcoxon W=25/W+=95/W-=25, p=0.04791; permutation p=0.03979 over 2^15=32768; 95% CI [0.0023,0.0772]).
   NO literals in the figure: every number comes from `data` so the displayed values can't drift.

   Stepped story — watch "is this metric gap real or luck?" resolve:
     step0  the 15 per-query B−A differences as a strip — 11 up (B wins), 4 down (A wins), mean +0.0397
     step1  could the sign pattern be luck? the permutation idea — flip every sign over 2^15 ways,
            recount, p ≈ 0.040 (pure counting, no distribution assumed)
     step2  the paired t-test  t = d̄/(s/√n) = 2.275 on df=14 → p ≈ 0.039;  Wilcoxon p ≈ 0.048
     step3  verdict — perm 0.040 / t 0.039 / Wilcoxon 0.048 all < 0.05, CI [0.0023,0.0772] excludes 0
            → the win is real, not noise

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup, the
   caption/counter scaffold, the setStep clamp + host.dataset.step, the el()/svg() namespaced SVG
   builder and the window.mountSignificanceTest registration; render() only draws the strip + readout. */
import { defineWidget } from '../_widget-base.js';

// local formatters — kept inside this module (distinct from the factory fmt's toFixed(6)).
const f4 = (x) => x.toFixed(4);                          // 0.0397, 0.0676, CI ends
const f3 = (x) => x.toFixed(3);                          // p-values shown to 3dp
const f3t = (x) => x.toFixed(3);                         // t = 2.275 (matches the deck exactly)
const sgn = (x) => (x >= 0 ? '+' : '−') + f4(Math.abs(x)); // signed, U+2212 minus

export const mountSignificanceTest = defineWidget({
  id: 'significance-test',
  rootClass: 'sig-root',
  exportName: 'mountSignificanceTest',
  maxStep: 3,
  render({ host, data, labels, el }) {
    const diffs = data.perQueryDiff;                     // 15 per-query B−A nDCG differences
    const n = data.nQueries;                             // 15
    const mean = data.meanDiff;                          // 0.0397
    const sd = data.sdDiff;                              // 0.0676
    const se = data.seDiff;                              // 0.0175 (= sd/√n)
    const tt = data.pairedTTest;                         // { t, df, p }
    const wil = data.wilcoxon;                           // { W, Wplus, Wminus, p }
    const perm = data.permutation;                       // { p, permutations }
    const ci = data.ci95;                                // [0.0023, 0.0772]
    const nPos = diffs.filter((d) => d > 0).length;      // 11
    const nNeg = diffs.filter((d) => d < 0).length;      // 4
    const real = ci[0] > 0 && tt.p < 0.05 && perm.p < 0.05; // CI excludes 0 AND p<0.05

    const W = 480, H = 432;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'wgt-svg sig-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    // ── strip plot: one bar per query, signed around a zero baseline ──────────────────────────────
    const box = { x: 30, y: 40, w: W - 56, h: 150 };
    const maxAbs = Math.max(...diffs.map(Math.abs)) * 1.12;   // headroom
    const mid = box.y + box.h / 2;                            // zero baseline (y)
    const scaleY = (box.h / 2) / maxAbs;                      // value → pixels (half-height each way)
    const slot = box.w / n;
    const bw = Math.min(20, slot * 0.62);

    // title above the strip (left-anchored — always in-frame)
    el('text', { x: box.x, y: box.y - 14, class: 'sig-title', 'text-anchor': 'start' }, svg)
      .textContent = labels.title || 'B − A, per query';

    // zero line (the "tie")
    el('line', { x1: box.x, y1: mid, x2: box.x + box.w, y2: mid, class: 'sig-zero' }, svg);
    el('text', { x: box.x + box.w, y: mid - 5, class: 'sig-axlbl', 'text-anchor': 'end' }, svg)
      .textContent = labels.axisZero || '0 (tie)';

    // the 15 signed bars
    const bars = diffs.map((d, i) => {
      const cx = box.x + slot * i + slot / 2;
      const h = Math.abs(d) * scaleY;
      const up = d >= 0;
      const y0 = up ? mid - h : mid;
      const cls = up ? 'sig-up' : 'sig-down';
      const rect = el('rect', { x: cx - bw / 2, y: y0, width: bw, height: Math.max(h, 1),
        class: `sig-bar ${cls}`, rx: 2 }, svg);
      return { rect, cx, d, up };
    });

    // win-side labels (which direction is which system)
    el('text', { x: box.x, y: box.y + 4, class: 'sig-side sig-up-t', 'text-anchor': 'start' }, svg)
      .textContent = `▲ ${labels.winB || 'B wins'} (${nPos})`;
    el('text', { x: box.x, y: box.y + box.h - 2, class: 'sig-side sig-down-t', 'text-anchor': 'start' }, svg)
      .textContent = `▼ ${labels.winA || 'A wins'} (${nNeg})`;

    // mean-difference line + label (the average gap the whole test is about). The label sits in a
    // dedicated lane ABOVE the strip (between the title and the plot top), end-anchored and clear of
    // every bar, with a leader tick down to the dashed line — so it never collides with a tall bar.
    const meanY = mid - mean * scaleY;
    const meanG = el('g', { class: 'sig-meanline' }, svg);
    el('line', { x1: box.x, y1: meanY, x2: box.x + box.w, y2: meanY, class: 'sig-mean' }, meanG);
    const labY = box.y - 2;                                 // lane above the plot box
    el('line', { x1: box.x + box.w, y1: labY + 3, x2: box.x + box.w, y2: meanY, class: 'sig-mean-tick' }, meanG);
    el('text', { x: box.x + box.w, y: labY, class: 'sig-mean-t', 'text-anchor': 'end' }, meanG)
      .textContent = `${labels.axisMean || 'mean'} ${sgn(mean)}`;

    // ── readout panel below the strip (steps 1–3) ────────────────────────────────────────────────
    const px = box.x - 2;
    let py = box.y + box.h + 30;
    const layers = {};
    const layer = (k) => (layers[k] = layers[k] || []);
    const add = (k, node) => { layer(k).push(node); return node; };
    const line = (k, y, cls, text) => {
      const t = el('text', { x: px, y, class: 'sig-annot ' + cls }, svg);
      t.textContent = text; return add(k, t);
    };

    // step 1 — the permutation idea (flip signs over 2^15, count) → perm p
    line(1, py, 'sig-perm-h',
      `${labels.permLabel || 'flip every sign — 2^15 ways'}  =  ${perm.permutations.toLocaleString('en-US')}`);
    line(1, py + 20, 'sig-perm-sub',
      `count |mean| ≥ ${f4(mean)}  →  p = ${f4(perm.p)}  (≈ ${f3(perm.p)})`);

    // step 2 — paired t-test + Wilcoxon
    py += 50;
    line(2, py, 'sig-t-h',
      `t = ${f4(mean)} / (${f4(sd)}/√${n}) = ${f3t(tt.t)}   (df = ${tt.df})`);
    line(2, py + 20, 'sig-t-sub',
      `→ p = ${f3(tt.p)} (t-test)    ·    Wilcoxon W = ${wil.W} → p = ${f3(wil.p)}`);

    // step 3 — verdict: three p's agree, CI excludes 0
    py += 50;
    line(3, py, 'sig-v-h',
      `perm ${f3(perm.p)}  ·  t ${f3(tt.p)}  ·  Wilcoxon ${f3(wil.p)}   ${real ? 'all < 0.05' : ''}`);
    line(3, py + 22, 'sig-ci-h',
      `95% CI [${f4(ci[0])}, ${f4(ci[1])}]  ${ci[0] > 0 ? 'excludes 0' : 'grazes 0'}`);
    const v = line(3, py + 46, 'sig-v-call' + (real ? ' is-real' : ''),
      real ? (labels.verdictReal || 'All p < 0.05, and the CI excludes 0 — the win is real, not noise.')
           : (labels.verdictNoise || 'Could be luck — hold.'));
    void v;

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      // the mean line appears with the diffs (step 0); bars highlight as "extreme" once we permute.
      meanG.classList.toggle('is-hidden', k < 0); // always on from step 0
      // step 1: bars whose magnitude meets/exceeds the observed mean glow (the "as extreme" set the
      // permutation test counts) — makes the abstract count concrete on the strip.
      for (const b of bars) b.rect.classList.toggle('is-extreme', k >= 1 && Math.abs(b.d) >= mean);
      // step 3: once the verdict lands, B-winning bars turn green (the win is real).
      for (const b of bars) b.rect.classList.toggle('is-real', k >= 3 && real && b.up);

      for (const key in layers) {
        const on = k >= Number(key);
        for (const node of layers[key]) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
