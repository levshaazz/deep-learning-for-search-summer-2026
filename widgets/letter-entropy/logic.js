/* letter-entropy/logic.js — L17 «пересыпь буквы — и посмотри на пол» / "reshape the letters, watch
   the floor". ONE figure, two panels sharing one vertical band:

     LEFT (~70%)  — a SORTED bar chart of letter probabilities (uniform → English → Russian), and at
                    the last step a STAIRCASE F₀→F₁→F₂→F₃→F₁₀₀ drawn on the bits axis.
     RIGHT (~30%) — a grey "thermometer" of bits/symbol on a fixed 0…5.1 scale, with a RED rule at the
                    current H and a dashed GHOST rule at the uniform ceiling H₀ = log₂A.

   The point the picture makes: reshaping the letter distribution lowers the FLOOR (H drops below the
   uniform ceiling), and changing the ALPHABET moves the ceiling itself — so bits/symbol are only
   comparable through the redundancy R = 1 − H/H₀, never head-to-head across alphabets.

   UNIT DISCIPLINE (the defect this header exists to prevent): the thermometer is NOT always the same
   scale. Steps 0/2/4 read Shannon's 27-SYMBOL series (26 letters + space) — bits per SYMBOL; steps
   1/3 read the 26-letter English and 33-letter Russian frequency tables — bits per LETTER. Those are
   different bases (slide 21b of L17 is written to expose exactly this confusion), so the thermometer
   header is rebuilt on every step from `unitKey` + the alphabet size, and never says just "bits".

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard and NO scroll (deck arrows + Book scrollama
   both call setStep). It COMPUTES NOTHING NUMERIC — every displayed number is read straight off the
   passed-in `data` (data/l17-entropy.json + data/l17-bench.json); the only arithmetic here is
   *geometry* (pixel scaling) and a ×100 unit conversion for the redundancy percentage.

   LABEL BUDGET (the known trap): 26 or 33 letter labels on one row COLLIDE — and a ≥50% label-box
   overlap HARD-fails _audit/viz-probe-gate.mjs. So ONLY the top-8 bars are ever labelled; every other
   bar stays bare, and no per-bar numeric label is drawn at all.

   Steps (maxStep = 4):
     0 → uniform 27 symbols: a flat plateau; F₀ = 4.76 IS the ceiling.                          s0
     1 → English letter frequencies: the bars fan out, H = 4.1758 under a 4.7004 ceiling.        s1
     2 → digrams: the floor drops again to F₂ — context, not frequency, does this.               s2
     3 → Russian, 33 letters: the CEILING rises to 5.0444 while H = 4.4626 — only R compares.    s3
     4 → the whole staircase F₀→F₁→F₂→F₃ descending toward the human 0.6–1.3 band.               s4 */
import { defineWidget } from '../_widget-base.js';
import { frameHeightFor } from '../_plot-util.js';

export const mountLetterEntropy = defineWidget({
  id: 'letter-entropy',
  rootClass: 'le-root',
  exportName: 'mountLetterEntropy',
  maxStep: 4,
  render({ host, data, labels, el }) {
    /* ── data, every access guarded (a missing branch degrades to an empty panel, never a crash) ── */
    const D = data || {};
    const lf = D.letterFreq || {};
    const en = lf.en26 || {};
    const ru = lf.ru33 || {};
    const fn = D.fn || (D.bench && D.bench.fn) || {};
    const hb = D.humanBounds || (D.bench && D.bench.humanBounds) || {};

    const arr = (a) => (Array.isArray(a) ? a : []);
    const enBars = arr(en.bars), ruBars = arr(ru.bars);
    const enTop = arr(en.top).slice(0, 8), ruTop = arr(ru.top).slice(0, 8);
    const letterOf = (t) => (Array.isArray(t) ? String(t[0] || '') : String((t && (t.letter || t.l)) || ''));

    /* Number formatting only — no numeric computation. `dec` is the i18n decimal separator so the RU
       layer prints 4,76 (§2 of narrative/style-ru.md) without the widget knowing the language. */
    const DEC = labels.dec || '.';
    const num = (x, d) => (typeof x === 'number' && isFinite(x) ? x.toFixed(d).replace('.', DEC) : '—');
    // percentage of a fraction: a pure UNIT conversion of a gated number, not a derived claim.
    const pct = (x, d) => (typeof x === 'number' && isFinite(x) ? (x * 100).toFixed(d).replace('.', DEC) + ' %' : '—');
    const L = (k, fb) => labels[k] || fb;

    /* ── geometry ──────────────────────────────────────────────────────────────────────────────── */
    const W = 600, PAD = 18;
    const X0 = PAD, X1 = 396;                 // left panel (bars / staircase)
    const DIV = 414;                          // panel divider
    const TX = 452, TW = 30;                  // thermometer track
    const RX1 = 448, RX2 = 496, LX = 502;     // marker rule span + its label x
    const YTOP = 72, BASE = 262;              // the vertical band BOTH panels live in
    const BITS_MAX = 5.1;                     // fixed grey scale 0…5.1 bits/symbol
    const SPAN = BASE - YTOP;
    const yBits = (b) => BASE - (Math.max(0, Math.min(BITS_MAX, b)) / BITS_MAX) * SPAN;

    // probability scale for the bar panel: the tallest bar in EITHER alphabet, plus headroom.
    let pTop = 0;
    for (const p of enBars) if (typeof p === 'number' && p > pTop) pTop = p;
    for (const p of ruBars) if (typeof p === 'number' && p > pTop) pTop = p;
    const pScale = (pTop > 0 ? pTop : 1) * 1.08;
    const yProb = (p) => BASE - (Math.max(0, p) / pScale) * SPAN;
    // The uniform plateau is DRAWN as a flat fraction of the band — a picture of "all equal", not a
    // displayed number (its value, F₀, is read off data and printed on the thermometer instead).
    const UNIFORM_FRAC = 0.275, UNIFORM_N = 27;
    // Shannon's 27-symbol alphabet IS the 26 English letters plus the space — derived, not typed,
    // so the thermometer header can never drift from the alphabet size the data actually carries.
    const SYMBOL_N = (typeof en.alphabet === 'number' ? en.alphabet + 1 : UNIFORM_N);

    const NBAR = Math.max(UNIFORM_N, enBars.length, ruBars.length, 1);

    const svg = el('svg', { viewBox: `0 0 ${W} 10`, class: 'wgt-svg le-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);
    const txt = (x, y, cls, anchor) => {
      const a = { x, y, class: cls };
      if (anchor) a['text-anchor'] = anchor;
      return el('text', a, svg);
    };

    /* ── static chrome ─────────────────────────────────────────────────────────────────────────── */
    txt(PAD, 20, 'le-head').textContent = L('head', 'reshape the letters — watch the floor');
    const panelHead = txt(PAD, 40, 'le-sub');
    el('line', { x1: DIV, y1: 52, x2: DIV, y2: BASE, class: 'le-div' }, svg);
    el('line', { x1: X0, y1: BASE, x2: X1, y2: BASE, class: 'le-axis' }, svg);
    // NOT static: the base flips between bits/SYMBOL (27) and bits/LETTER (26 / 33) — see the header.
    const thermoHead = txt(TX - 28, 52, 'le-sub');

    // full-width gridline extensions — step 4 only, when the LEFT panel switches to the bits axis.
    const grid = [];
    for (let b = 1; b <= 5; b++) {
      grid.push(el('line', { x1: X0, y1: yBits(b), x2: TX - 8, y2: yBits(b), class: 'le-grid' }, svg));
    }

    /* ── left panel · sorted probability bars (steps 0–3) ──────────────────────────────────────── */
    const bars = [];
    for (let i = 0; i < NBAR; i++) {
      bars.push(el('rect', { x: X0, y: BASE - 2, width: 4, height: 2, rx: 1.5, class: 'le-bar' }, svg));
    }
    // ONLY eight letter labels, ever (26/33 in a row is the collision the viz-probe gate hard-fails).
    const letters = [];
    for (let i = 0; i < 8; i++) letters.push(txt(X0, BASE + 13, 'le-letter', 'middle'));

    /* ── left panel · the F-staircase (step 4) ─────────────────────────────────────────────────── */
    const stair = [];                            // every node that belongs to the staircase layer
    const COLW = (X1 - X0) / 5;
    const colC = (i) => X0 + COLW * (i + 0.5);
    const treads = [], risers = [], stairVal = [];
    for (let i = 0; i < 4; i++) {
      treads.push(el('line', { x1: X0 + COLW * i + 4, y1: BASE, x2: X0 + COLW * (i + 1) - 4, y2: BASE, class: 'le-tread' }, svg));
      stair.push(treads[i]);
    }
    for (let i = 0; i < 4; i++) {
      risers.push(el('line', { x1: X0 + COLW * (i + 1), y1: BASE, x2: X0 + COLW * (i + 1), y2: BASE, class: 'le-riser' }, svg));
      stair.push(risers[i]);
    }
    const band = el('rect', { x: X0 + COLW * 4 + 4, y: BASE, width: COLW - 8, height: 2, rx: 3, class: 'le-band' }, svg);
    stair.push(band);
    for (let i = 0; i < 5; i++) {
      const t = txt(colC(i), BASE, 'le-stairval', 'middle');
      stairVal.push(t); stair.push(t);
    }
    const STAIR_TICKS = ['F₀', 'F₁', 'F₂', 'F₃', 'F₁₀₀'];
    for (let i = 0; i < 5; i++) {
      const t = txt(colC(i), BASE + 13, 'le-letter', 'middle');
      t.textContent = STAIR_TICKS[i];
      stair.push(t);
    }

    /* ── right panel · the thermometer ─────────────────────────────────────────────────────────── */
    el('rect', { x: TX, y: YTOP, width: TW, height: SPAN, rx: 6, class: 'le-track' }, svg);
    const merc = el('rect', { x: TX, y: BASE, width: TW, height: 0, class: 'le-merc' }, svg);
    for (let b = 0; b <= 5; b++) {
      el('line', { x1: TX - 6, y1: yBits(b), x2: TX, y2: yBits(b), class: 'le-tick' }, svg);
      txt(TX - 8, yBits(b) + 4, 'le-ticklbl', 'end').textContent = String(b);
    }
    // ghost ceiling (dashed) — hidden at step 0, where H IS the ceiling and the two labels would collide.
    const ceilRule = el('line', { x1: RX1, y1: YTOP, x2: RX2, y2: YTOP, class: 'le-ceil' }, svg);
    const ceilLbl = txt(LX, YTOP, 'le-ceillbl');
    // an optional intermediate marker (step 2 shows F₁ between the ceiling and F₂).
    const markRule = el('line', { x1: RX1, y1: YTOP, x2: RX2, y2: YTOP, class: 'le-mark' }, svg);
    const markLbl = txt(LX, YTOP, 'le-marklbl');
    // the RED floor rule at the current H — the course red, drawn last so it sits on top.
    const hRule = el('line', { x1: RX1, y1: BASE, x2: RX2, y2: BASE, class: 'le-hrule' }, svg);
    const hLbl = txt(LX, BASE, 'le-hlbl');

    /* ── two note lines under the frame: prose (i18n) + a numeric readout (data) ────────────────── */
    // Two lines are RESERVED for the prose note, not grown on demand: the RU string is ~20 %
    // longer than the EN one, so a one-line box that fits in English silently runs past the
    // frame in Russian (it did: +29 px past a 449-px frame). Wrapping is measured, not guessed.
    const noteA = txt(PAD, BASE + 34, 'le-note');
    const noteB = txt(PAD, BASE + 70, 'le-numnote');
    const NOTE_MAXW = W - 2 * PAD;
    const setNote = (t) => {
      noteA.textContent = '';
      const words = String(t || '').split(/\s+/).filter(Boolean);
      if (!words.length) return;
      const line = (s, dy) => {
        const ts = el('tspan', { x: PAD, dy }, noteA);
        ts.textContent = s;
        return ts;
      };
      const probe = line(words.join(' '), 0);
      // getComputedTextLength is the browser's own metric — no per-language char-width fudge
      const wide = (() => { try { return probe.getComputedTextLength() > NOTE_MAXW; } catch { return false; } })();
      if (!wide) return;
      let cut = words.length >> 1;                       // balance the two lines by word count,
      for (let i = cut; i < words.length; i++) {         // then prefer a clause break near it
        if (/[—;:,]$/.test(words[i - 1])) { cut = i; break; }
      }
      probe.textContent = words.slice(0, cut).join(' ');
      line(words.slice(cut).join(' '), 16);
    };

    const H = frameHeightFor(BASE + 70 + 4, 10);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    /* ── per-step configuration — pure lookups into `data`, nothing derived ─────────────────────── */
    const HSYM = L('hSym', 'H'), CSYM = L('ceilSym', 'H₀');
    function cfg(k) {
      if (k === 1) {
        return { bars: enBars, top: enTop, warm: 8, h: en.H, hSym: HSYM, hDig: 4,
          ceil: en.uniformH, ceilSym: CSYM, ceilDig: 4, unitKey: 'thermoLetter', unitN: en.alphabet,
          note: L('n1', ''), numB: L('redLbl', 'R = 1 − H/H₀') + ' = ' + pct(en.redundancy, 1) };
      }
      if (k === 2) {
        return { bars: enBars, top: enTop, warm: 8, h: fn.F2_27, hSym: 'F₂', hDig: 2,
          ceil: fn.F0_27, ceilSym: 'F₀', ceilDig: 2, mark: fn.F1_27, markSym: 'F₁',
          unitKey: 'thermo', unitN: SYMBOL_N,
          note: L('n2', ''),
          numB: 'F₂ = ' + num(fn.F2_27, 2) + ' (27) · ' + num(fn.F2_26, 2) + ' (26)' };
      }
      if (k === 3) {
        return { bars: ruBars, top: ruTop, warm: 8, h: ru.H, hSym: HSYM, hDig: 4,
          ceil: ru.uniformH, ceilSym: CSYM, ceilDig: 4, unitKey: 'thermoLetter', unitN: ru.alphabet,
          note: L('n3', ''),
          numB: L('redLbl', 'R = 1 − H/H₀') + ': EN ' + pct(en.redundancy, 1) + ' · RU ' + pct(ru.redundancy, 1) };
      }
      if (k === 4) {
        return { stair: true, h: fn.F3_27, hSym: 'F₃', hDig: 2, ceil: fn.F0_27, ceilSym: 'F₀', ceilDig: 2,
          unitKey: 'thermo', unitN: SYMBOL_N, note: L('n4', ''),
          numB: '26: F₀ ' + num(fn.F0_26, 2) + ' · F₁ ' + num(fn.F1_26, 2) +
                ' · F₂ ' + num(fn.F2_26, 2) + ' · F₃ ' + num(fn.F3_26, 2) };
      }
      return { uniform: true, h: fn.F0_27, hSym: 'F₀', hDig: 2, unitKey: 'thermo', unitN: SYMBOL_N,
        note: L('n0', ''), numB: '' };
    }

    return function update(k) {
      const c = cfg(k);
      panelHead.textContent = L('p' + k, '');
      // the thermometer's BASE, spelled out every step: bits/symbol (27) vs bits/letter (26 | 33)
      thermoHead.textContent = L(c.unitKey || 'thermo', 'bits / symbol')
        + (typeof c.unitN === 'number' ? ' · ' + c.unitN : '');

      /* left panel — bars OR staircase, never both */
      const showBars = !c.stair;
      const n = c.uniform ? UNIFORM_N : (c.bars ? c.bars.length : 0);
      const slot = n > 0 ? (X1 - X0) / n : 0;
      const bw = Math.max(2, slot * 0.82);
      for (let i = 0; i < bars.length; i++) {
        const on = showBars && i < n;
        bars[i].classList.toggle('is-hidden', !on);
        if (!on) continue;
        const y = c.uniform ? BASE - UNIFORM_FRAC * SPAN : yProb(c.bars[i]);
        bars[i].setAttribute('x', X0 + i * slot + (slot - bw) / 2);
        bars[i].setAttribute('width', bw);
        bars[i].setAttribute('y', y);
        bars[i].setAttribute('height', Math.max(2, BASE - y));
        bars[i].classList.toggle('is-top', !c.uniform && i < (c.warm || 0));
      }
      const tops = c.top || [];
      for (let i = 0; i < letters.length; i++) {
        const on = showBars && i < tops.length && slot > 0;
        letters[i].classList.toggle('is-hidden', !on);
        if (!on) continue;
        letters[i].setAttribute('x', X0 + i * slot + slot / 2);
        letters[i].textContent = letterOf(tops[i]);
      }

      /* the staircase + the gridline extensions belong to step 4 only */
      for (const g of grid) g.classList.toggle('is-hidden', !c.stair);
      for (const s of stair) s.classList.toggle('is-hidden', !c.stair);
      if (c.stair) {
        const F = [fn.F0_27, fn.F1_27, fn.F2_27, fn.F3_27];
        for (let i = 0; i < 4; i++) {
          const y = yBits(F[i]);
          treads[i].setAttribute('y1', y); treads[i].setAttribute('y2', y);
          stairVal[i].setAttribute('y', y - 5);
          stairVal[i].textContent = num(F[i], 2);
        }
        const yHi = yBits(hb.at100Upper), yLo = yBits(hb.at100Lower);
        band.setAttribute('y', yHi);
        band.setAttribute('height', Math.max(3, yLo - yHi));
        stairVal[4].setAttribute('y', yHi - 5);
        stairVal[4].textContent = num(hb.at100Lower, 1) + '–' + num(hb.at100Upper, 1);
        for (let i = 0; i < 4; i++) {
          const yA = yBits(F[i]);
          const yB = i < 3 ? yBits(F[i + 1]) : yHi;
          risers[i].setAttribute('y1', yA); risers[i].setAttribute('y2', yB);
        }
      }

      /* thermometer — the red floor, the ghost ceiling, the optional intermediate mark */
      const yH = yBits(c.h);
      merc.setAttribute('y', yH);
      merc.setAttribute('height', Math.max(0, BASE - yH));
      hRule.setAttribute('y1', yH); hRule.setAttribute('y2', yH);
      hLbl.setAttribute('y', yH + 12);                    // just BELOW its rule…
      hLbl.textContent = c.hSym + ' = ' + num(c.h, c.hDig || 2);

      const hasCeil = typeof c.ceil === 'number';
      ceilRule.classList.toggle('is-hidden', !hasCeil);
      ceilLbl.classList.toggle('is-hidden', !hasCeil);
      if (hasCeil) {
        const yC = yBits(c.ceil);
        ceilRule.setAttribute('y1', yC); ceilRule.setAttribute('y2', yC);
        ceilLbl.setAttribute('y', yC - 3);                // …and just ABOVE its own, so they never collide
        ceilLbl.textContent = c.ceilSym + ' = ' + num(c.ceil, c.ceilDig || 2);
      }

      const hasMark = typeof c.mark === 'number';
      markRule.classList.toggle('is-hidden', !hasMark);
      markLbl.classList.toggle('is-hidden', !hasMark);
      if (hasMark) {
        const yM = yBits(c.mark);
        markRule.setAttribute('y1', yM); markRule.setAttribute('y2', yM);
        markLbl.setAttribute('y', yM + 12);
        markLbl.textContent = c.markSym + ' = ' + num(c.mark, 2);
      }

      setNote(c.note);
      noteB.textContent = c.numB || '';
    };
  },
});
