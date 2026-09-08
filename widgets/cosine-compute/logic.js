/* cosine-compute/logic.js — L2 'climb-cosine-compute' beat: watch cosine get COMPUTED.

   The sibling widget `cosine-sphere` draws the GEOMETRY (vectors, angle, unit sphere) and shows
   `cos` as a precomputed readout. This widget shows the ARITHMETIC instead — dot product on top,
   the two lengths underneath, then the ratio — so the reader sees the single number fall out:
       cos θ = (a·b) / (‖a‖·‖b‖) = 20 / (√2·√200) = 20/20 = 1.0.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All numbers come from data/l2-cosine.json (the same worked
   example the cosine-sphere widget + the facts-gate use — primary pair 'same-dir'); all human text
   comes from i18n keys in `labels`. Row/cell text is plain Unicode math (√, ·, ², ‖…‖), NOT KaTeX —
   the figure narrates itself; the scroll-step labels carry the prose.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup, the
   caption/counter scaffold, the setStep clamp + host.dataset.step, esc() and the
   window.mountCosineCompute registration; render() below only draws the figure layers and returns
   the per-step update.

   Steps (maxStep = 4):
     0  → vectors a, b as coordinate lists.                                            caption s0
     1  → dot product term-by-term: 1·10 + 1·10 = 20.                                  caption s1
     2  → the two norms: ‖a‖ = √(1²+1²) = √2 ≈ 1.41, ‖b‖ = √200 ≈ 14.14.               caption s2
     3  → the product cancellation on its own: √2·√200 = √400 = 20.                    caption s3
     4  → the ratio: cos θ = 20 / (√2·√200) = 20/20 = 1.0, same direction → 1.0.       caption s4
   (audit: step 2 used to bundle the two norms AND the √400=20 cancellation in one frame; the
   "irrational radicals cancel to an integer" beat now lands on its own at step 3.) */
import { defineWidget, esc } from '../_widget-base.js';

// √-as-text helper: render a number's square root exactly when it is a perfect square (√4 → "2"),
// otherwise as the radical form "√n". Keeps the displayed denominator product (√2·√200 = √400 = 20)
// honest without floating-point noise.
function sqrtText(n) {
  const r = Math.sqrt(n);
  return Number.isInteger(r) ? String(r) : '√' + n;
}
// trim a float to at most `d` decimals, dropping trailing zeros (1.414214 → "1.41" at d=2).
function approx(x, d = 2) {
  return Number(x.toFixed(d)).toString();
}

export const mountCosineCompute = defineWidget({
  id: 'cosine-compute',
  rootClass: 'cc-root',
  maxStep: 4,
  render({ host, data, labels }) {
    // primary worked pair from data/l2-cosine.json (same-dir: a=(1,1), b=(10,10)).
    const pair = data.pairs.find((p) => p.id === data.primary) || data.pairs[0];
    const a = pair.u, b = pair.v;                       // [1,1], [10,10]
    const n = Math.min(a.length, b.length);

    // EXACT numbers, taken from the data file (not re-derived): dot, the two squared-norm sums, cos.
    const dot = pair.u_dot_v;                            // 20
    const sumA2 = a.reduce((s, x) => s + x * x, 0);      // 1²+1² = 2
    const sumB2 = b.reduce((s, x) => s + x * x, 0);      // 10²+10² = 200
    const normA = pair.normU;                            // √2 ≈ 1.414214
    const normB = pair.normV;                            // √200 ≈ 14.142136
    const denomProd = sumA2 * sumB2;                     // 2·200 = 400  → √400 = 20
    const denom = Math.sqrt(denomProd);                  // 20
    const cos = pair.cos;                                // 1.0
    const cosText = Number.isInteger(cos) ? cos.toFixed(1) : approx(cos, 4); // "1.0"

    const panel = document.createElement('div');
    panel.className = 'wgt-panel cc-panel';
    host.appendChild(panel);

    // ── a labelled calculation block (head + body where the arithmetic lives) ──
    function block(cls, headHtml) {
      const r = document.createElement('div');
      r.className = `cc-block ${cls}`;
      const head = document.createElement('div');
      head.className = 'cc-head';
      head.innerHTML = headHtml;
      r.appendChild(head);
      const body = document.createElement('div');
      body.className = 'cc-body';
      r.appendChild(body);
      panel.appendChild(r);
      return { r, body };
    }
    const chip = (parent, txt, cls = '') => {
      const c = document.createElement('span');
      c.className = `cc-chip ${cls}`.trim();
      c.textContent = txt;
      parent.appendChild(c);
      return c;
    };
    const sym = (parent, txt, cls = 'cc-op') => {
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = txt;
      parent.appendChild(s);
      return s;
    };

    // ── block 0: the two vectors as coordinate lists (always visible) ──────────
    const vecRow = document.createElement('div');
    vecRow.className = 'cc-block cc-vectors';
    const vecCard = (key, vec, cls) => {
      const card = document.createElement('div');
      card.className = `cc-veccard ${cls}`;
      const h = document.createElement('div');
      h.className = 'cc-vechead';
      h.textContent = labels[key] || '';
      card.appendChild(h);
      const coords = document.createElement('div');
      coords.className = 'cc-coords';
      coords.textContent = '(' + vec.map((x) => esc(x)).join(', ') + ')';
      card.appendChild(coords);
      vecRow.appendChild(card);
    };
    vecCard('vecHeadA', a, 'cc-vec-a');
    vecCard('vecHeadB', b, 'cc-vec-b');
    panel.appendChild(vecRow);

    // ── block 1: dot product, term by term  → 1·10 + 1·10 = 20 ─────────────────
    const dotBlk = block('cc-dot', esc(labels.dotHead || 'a·b'));
    for (let i = 0; i < n; i++) {
      if (i > 0) sym(dotBlk.body, '+');
      const term = document.createElement('span');
      term.className = 'cc-term';
      term.innerHTML = `<span class="cc-fac cc-fac-a">${esc(a[i])}</span>` +
        `<span class="cc-op cc-times">·</span>` +
        `<span class="cc-fac cc-fac-b">${esc(b[i])}</span>`;
      dotBlk.body.appendChild(term);
    }
    sym(dotBlk.body, '=');
    chip(dotBlk.body, String(dot), 'cc-res cc-res-dot');

    // ── block 2: the two norms  ‖a‖ = √(1²+1²) = √2 ≈ 1.41 ; product = 20 ───────
    const normBlk = block('cc-norm', esc(labels.normHead || '‖a‖, ‖b‖'));
    const normLine = (lbl, vec, sum2, val, cls) => {
      const line = document.createElement('div');
      line.className = 'cc-normline';
      const squares = vec.map((x) => `${esc(x)}²`).join(' + ');
      line.innerHTML =
        `<span class="cc-norm-lbl ${cls}">‖${esc(lbl)}‖</span>` +
        `<span class="cc-op">=</span>` +
        `<span class="cc-rad">√(${squares})</span>` +
        `<span class="cc-op">=</span>` +
        `<span class="cc-rad cc-rad-exact">${esc(sqrtText(sum2))}</span>` +
        `<span class="cc-op">≈</span>` +
        `<span class="cc-approx">${esc(approx(val, 2))}</span>`;
      normBlk.body.appendChild(line);
    };
    normLine('a', a, sumA2, normA, 'cc-fac-a');
    normLine('b', b, sumB2, normB, 'cc-fac-b');
    // product of the two lengths: √2 · √200 = √400 = 20
    const prodLine = document.createElement('div');
    prodLine.className = 'cc-normline cc-prodline';
    prodLine.innerHTML =
      `<span class="cc-norm-lbl">‖a‖·‖b‖</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-rad">${esc(sqrtText(sumA2))}·${esc(sqrtText(sumB2))}</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-rad">√${esc(denomProd)}</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-chip cc-res cc-res-denom">${esc(approx(denom, 2))}</span>`;
    normBlk.body.appendChild(prodLine);

    // ── block 3: the ratio  cos θ = 20 / (√2·√200) = 20/20 = 1.0 ───────────────
    const ratioBlk = block('cc-ratio', esc(labels.ratioHead || 'cosine'));
    const frac = document.createElement('div');
    frac.className = 'cc-frac';
    frac.innerHTML =
      `<span class="cc-cosname">cos θ</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-fraction">` +
        `<span class="cc-numer">${esc(dot)}</span>` +
        `<span class="cc-bar"></span>` +
        `<span class="cc-denom">${esc(sqrtText(sumA2))}·${esc(sqrtText(sumB2))}</span>` +
      `</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-fraction">` +
        `<span class="cc-numer">${esc(dot)}</span>` +
        `<span class="cc-bar"></span>` +
        `<span class="cc-denom">${esc(approx(denom, 0))}</span>` +
      `</span>` +
      `<span class="cc-op">=</span>` +
      `<span class="cc-chip cc-res cc-res-cos">${esc(cosText)}</span>`;
    ratioBlk.body.appendChild(frac);
    const meaning = document.createElement('div');
    meaning.className = 'cc-meaning';
    meaning.textContent = labels.sameDir || 'same direction → 1.0';
    ratioBlk.body.appendChild(meaning);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      // cumulative reveal: vectors always; dot from 1; the two norms from 2; the √400=20
      // product-cancellation line from 3 (its own beat); the ratio from 4.
      dotBlk.r.classList.toggle('is-hidden', k < 1);
      normBlk.r.classList.toggle('is-hidden', k < 2);
      prodLine.classList.toggle('is-hidden', k < 3);
      ratioBlk.r.classList.toggle('is-hidden', k < 4);
      // dim the upstream pieces once they've been consumed into the ratio.
      vecRow.classList.toggle('is-faded', k >= 1);
      dotBlk.r.classList.toggle('is-faded', k >= 4);
      normBlk.r.classList.toggle('is-faded', k >= 4);
      // pop the cosine result when it lands.
      ratioBlk.r.classList.toggle('is-final', k >= 4);
    };
  },
});
