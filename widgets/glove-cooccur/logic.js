/* glove-cooccur/logic.js — L5 GloVe beat: the step-by-step calculation the instructor asked for.
   The predictive route (skip-gram) learns embeddings by PREDICTING context; GloVe instead COUNTS
   context (a symmetric co-occurrence matrix X), down-weights the counts with f(x), and FACTORISES
   log X with w_i·w̃_j + b_i + b̃_j. This widget draws that whole arc as five stacked panels, one
   revealed per step, ending on the count-based↔predictive "two faces of one coin" (Levy–Goldberg).

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2): exposes setStep(k)/maxStep, binds NO keyboard / NO scroll —
   the SLIDE driver (deck arrows) and the BOOK driver (Scrollama) both call setStep(k). EVERY number
   AND every token shown — the corpus, the X counts, log X, f(X), the king·queen objective terms, the
   loss before/after, the PCA-2D map coords — comes straight from data/l5-glove.json (the same source
   the facts-gate checks), never from i18n. All human prose lives in i18n `labels`.

   Built on the shared widgets/_widget-base.js factory (host setup, caption/counter scaffold, setStep
   clamp, window.mountGloveCooccur registration); render() only draws the figure layers.

   Steps (maxStep = 4):
     0 → mini-corpus (left) + the symmetric co-occurrence matrix X heatmap (right). caption s0
     1 → the weighting f(x) curve: rare pairs down-weighted, frequent ones capped. caption s1
     2 → the objective on a WORKED pair (king·queen): X, log X, f, w·w̃+b+b̃, weighted error. caption s2
     3 → factorise X → the learned vectors as a 2-D PCA map; loss before→after. caption s3
     4 → count-based GloVe vs predictive word2vec: two faces of one coin (PMI nod). caption s4 */
import { defineWidget, fmt } from '../_widget-base.js';
import { padDomain, frameHeightFor } from '../_plot-util.js';

export const mountGloveCooccur = defineWidget({
  id: 'glove-cooccur',
  rootClass: 'gv-root',
  exportName: 'mountGloveCooccur',
  maxStep: 4,
  render({ host, data, labels, el }) {
    const vocab = data.vocab || [];
    const corpus = data.corpus || [];
    const X = data.X || [];
    const F = data.F || [];
    const cells = data.cells || [];
    const fCurve = data.fCurve || [];
    const worked = data.worked || [];
    const mapData = data.map || { points: [] };
    const loss = data.loss || {};
    const xMax = data.xMax || 10;
    const n = vocab.length;

    const num = (x, d = 2) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : fmt(x, d));

    // ── overall geometry: a single WIDE canvas, panels stacked top→bottom so each step's panel sits
    //    in its own band and never collides with another (the slide-viz-gate flags overlap/OOB). ──
    const Wd = 900;
    const PAD = 18;

    // panel vertical bands (top edges); each panel reveals at its step.
    const P0_Y = 14;          // s0: corpus + heatmap
    const P1_Y = 250;         // s1: f(x) curve
    const P2_Y = 466;         // s2: worked objective
    const P3_Y = 690;         // s3: map + loss
    const P4_Y = 980;         // s4: two faces of one coin
    const P4_H = 150;
    const H = frameHeightFor(P4_Y + P4_H, 16);

    const svg = el('svg', { viewBox: `0 0 ${Wd} ${H}`, class: 'wgt-svg gv-svg',
      role: 'img', 'aria-label': labels.alt || '' }, host);

    const layers = {};
    const layer = (name, from, to = Infinity) => (layers[name] = { from, to, nodes: [] });
    const add = (name, node) => { layers[name].nodes.push(node); return node; };

    const text = (name, x, y, cls, anchor, str) => {
      const t = el('text', { x, y, class: cls, 'text-anchor': anchor || 'start' }, svg);
      t.textContent = str;
      return add(name, t);
    };
    const panelHead = (name, x, y, head, sub) => {
      text(name, x, y, 'gv-head', 'start', head || '');
      if (sub) text(name, x, y + 15, 'gv-subhead', 'start', sub);
    };

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // PANEL 0 (step 0): mini-corpus on the left, the co-occurrence matrix X heatmap on the right.
    // ════════════════════════════════════════════════════════════════════════════════════════════
    layer('corpus', 0);
    panelHead('corpus', PAD, P0_Y + 12, labels.corpusHead || 'mini-corpus + sliding window');
    const corpusTop = P0_Y + 42;
    const lineH = 18;
    const maxLines = Math.min(corpus.length, 8);
    corpus.slice(0, maxLines).forEach((line, i) => {
      const t = text('corpus', PAD, corpusTop + i * lineH, 'gv-corpus', 'start', line);
      // a faint "window" pill behind the FIRST two tokens of line 0 → the sliding window cue.
      if (i === 0) {
        const wpx = Math.min(120, line.split(' ').slice(0, 2).join(' ').length * 7 + 10);
        const r = el('rect', { x: PAD - 4, y: corpusTop + i * lineH - 12, width: wpx, height: 16,
          rx: 4, class: 'gv-window' }, svg);
        svg.insertBefore(r, t);                 // draw window BEHIND the text
        add('corpus', r);
      }
    });

    // ── the X heatmap (symmetric n×n; cell tint ∝ count) ──
    layer('matrix', 0);
    const mX = 360, mY = P0_Y + 12;
    // DEFECT-1 FIX: the subtitle no longer sits in the head→grid gap (the rotated -60° column headers
    // rise UP into that very gap and used to overprint it). We draw ONLY the head up top, give the
    // rotated headers their own clear band beneath it, and move the subtitle to its OWN line BELOW the
    // finished grid — so column labels and subtitle occupy disjoint bands and can never collide.
    panelHead('matrix', mX, mY, labels.matrixHead || 'co-occurrence matrix X');
    // A 7-char header rotated -60° rises ≈ 30px above its anchor (gridTop-6). Keep that rise clear of
    // the head's visual bottom (≈ mY+15): anchor must sit ≥ mY+15+30, so gridTop = mY+52.
    const gridTop = mY + 52;
    const gridLeft = mX + 60;                   // room for the row labels
    // cap cell size at 12 so the n-row grid still fits its band below the deeper gridTop.
    const csz = Math.min(12, Math.floor((Wd - PAD - gridLeft) / n));   // square cell, fits canvas
    const gridBottom = gridTop + n * csz;
    const maxX = Math.max(1e-6, ...X.flat());
    // row labels (left of the grid) + column labels (rotated above)
    vocab.forEach((w, i) => {
      text('matrix', gridLeft - 4, gridTop + i * csz + csz - 2, 'gv-mlabel', 'end', w.slice(0, 7));
      const ct = el('text', { x: gridLeft + i * csz + csz / 2, y: gridTop - 6,
        class: 'gv-mlabel gv-mcol', 'text-anchor': 'start',
        transform: `rotate(-60 ${gridLeft + i * csz + csz / 2} ${gridTop - 6})` }, svg);
      ct.textContent = w.slice(0, 7);
      add('matrix', ct);
    });
    // subtitle on its OWN line below the grid (disjoint from the rotated header band).
    if (labels.matrixSub)
      text('matrix', mX, gridBottom + 16, 'gv-subhead', 'start', labels.matrixSub);
    // cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const v = X[i][j];
        const rect = el('rect', { x: gridLeft + j * csz, y: gridTop + i * csz,
          width: csz - 1, height: csz - 1, rx: 1.5, class: 'gv-xcell',
          'data-role': 'xcount' }, svg);
        const mag = v > 0 ? Math.min(1, v / maxX) : 0;
        rect.setAttribute('fill', v > 0
          ? `color-mix(in srgb, var(--accent) ${Math.round(15 + mag * 75)}%, var(--bg-card))`
          : 'var(--bg-inset)');
        add('matrix', rect);
      }
    }

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // PANEL 1 (step 1): the weighting f(x) curve.
    // ════════════════════════════════════════════════════════════════════════════════════════════
    layer('curve', 1);
    panelHead('curve', PAD, P1_Y + 12, labels.curveHead || 'weighting f(x)', labels.curveSub);
    const cAxX = PAD + 36, cAxY0 = P1_Y + 44, cAxH = 130, cAxW = 360;
    const cAxY1 = cAxY0 + cAxH;
    const xs = fCurve.map((p) => p.x);
    const xd = padDomain(0, Math.max(...xs), 0.02);
    const sx = (x) => cAxX + ((x - xd.min) / xd.span) * cAxW;
    const sy = (f) => cAxY1 - f * cAxH;          // f in [0,1]
    // axes
    add('curve', el('line', { x1: cAxX, y1: cAxY1, x2: cAxX + cAxW, y2: cAxY1, class: 'gv-axis' }, svg));
    add('curve', el('line', { x1: cAxX, y1: cAxY0, x2: cAxX, y2: cAxY1, class: 'gv-axis' }, svg));
    text('curve', cAxX - 6, cAxY0 + 4, 'gv-tick', 'end', '1');
    text('curve', cAxX - 6, cAxY1 + 4, 'gv-tick', 'end', '0');
    text('curve', cAxX - 22, (cAxY0 + cAxY1) / 2, 'gv-axlabel', 'middle', 'f');
    text('curve', cAxX + cAxW, cAxY1 + 16, 'gv-axlabel', 'end', 'x');
    // x_max vertical marker + cap line at f=1
    add('curve', el('line', { x1: cAxX, y1: cAxY0, x2: cAxX + cAxW, y2: cAxY0, class: 'gv-caplevel' }, svg));
    text('curve', cAxX + cAxW - 4, cAxY0 - 4, 'gv-caplabel', 'end', labels.capLabel || 'capped at 1');
    const xmaxPx = sx(xMax);
    add('curve', el('line', { x1: xmaxPx, y1: cAxY0, x2: xmaxPx, y2: cAxY1, class: 'gv-xmax' }, svg));
    text('curve', xmaxPx, cAxY1 + 16, 'gv-tick', 'middle', labels.xMaxTick || 'x_max');
    // the f(x) curve as a polyline
    const pts = fCurve.map((p) => `${sx(p.x).toFixed(1)},${sy(p.f).toFixed(1)}`).join(' ');
    add('curve', el('polyline', { points: pts, class: 'gv-fcurve', fill: 'none' }, svg));
    // overlay the REAL f-values for the matrix cells as dots (the data the curve scores).
    const seen = new Set();
    cells.forEach((c) => {
      const key = `${c.x.toFixed(3)}`;
      if (seen.has(key)) return; seen.add(key);
      add('curve', el('circle', { cx: sx(c.x), cy: sy(c.f), r: 2.6, class: 'gv-fdot',
        'data-role': 'fvalue' }, svg));
    });

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // PANEL 2 (step 2): the objective on a WORKED pair (king·queen).
    // ════════════════════════════════════════════════════════════════════════════════════════════
    layer('obj', 2);
    panelHead('obj', PAD, P2_Y + 12, labels.objHead || 'objective · worked pair');
    const we = worked.find((w) => w.i === 'king' && w.j === 'queen') || worked[0] || {};
    const eqY = P2_Y + 52;
    // the model equation, term by term: w_i·w̃_j + b_i + b̃_j ≈ log X_ij
    const eqX = PAD + 4;
    text('obj', eqX, eqY, 'gv-eqword', 'start', `${we.i || ''} · ${we.j || ''}`);
    text('obj', eqX, eqY + 24, 'gv-eq', 'start',
      `w·w̃ (${num(we.dot, 3)}) + b (${num(we.bi, 3)}) + b̃ (${num(we.bj, 3)})  =  ${num(we.model, 3)}`);
    text('obj', eqX, eqY + 48, 'gv-eq', 'start',
      `≈  log X  =  log(${num(we.X, 3)})  =  ${num(we.logX, 3)}`);
    // term chips: X, logX, f, model, weighted error
    const chips = [
      { lab: labels.xCell || 'X', val: num(we.X, 3), role: 'xcount', cls: 'gv-chip-x' },
      { lab: labels.logLabel || 'log X', val: num(we.logX, 3), role: 'logx', cls: 'gv-chip-log' },
      { lab: labels.fLabel || 'f(X)', val: num(we.f, 3), role: 'fvalue', cls: 'gv-chip-f' },
      { lab: labels.modelLabel || 'model', val: num(we.model, 3), role: 'model', cls: 'gv-chip-m' },
      { lab: labels.errLabel || 'weighted error', val: num(we.weightedErr, 5), role: 'werr', cls: 'gv-chip-e' },
    ];
    const chW = 162, chH = 44, chGap = 12, chY = eqY + 78;
    chips.forEach((c, i) => {
      const cx = eqX + i * (chW + chGap);
      const g = el('g', {}, svg);
      el('rect', { x: cx, y: chY, width: chW, height: chH, rx: 6, class: `gv-chip ${c.cls}`,
        'data-role': c.role }, g);
      el('text', { x: cx + 10, y: chY + 17, class: 'gv-chiplab' }, g).textContent = c.lab;
      el('text', { x: cx + 10, y: chY + 36, class: 'gv-chipval' }, g).textContent = c.val;
      add('obj', g);
    });

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // PANEL 3 (step 3): factorise X → the learned vectors as a 2-D PCA map + the loss readout.
    // ════════════════════════════════════════════════════════════════════════════════════════════
    layer('map', 3);
    panelHead('map', PAD, P3_Y + 12, labels.mapHead || 'factorise X → the map', labels.mapSub);
    const mapPts = mapData.points || [];
    const pX = PAD + 30, pY0 = P3_Y + 44, pW = 470, pH = 220;
    const pY1 = pY0 + pH;
    const exs = mapPts.map((p) => p.x), eys = mapPts.map((p) => p.y);
    const dx = padDomain(Math.min(...exs), Math.max(...exs), 0.12);
    const dy = padDomain(Math.min(...eys), Math.max(...eys), 0.12);
    const psx = (x) => pX + ((x - dx.min) / dx.span) * pW;
    const psy = (y) => pY1 - ((y - dy.min) / dy.span) * pH;
    // map frame
    add('map', el('rect', { x: pX, y: pY0, width: pW, height: pH, rx: 6, class: 'gv-mapframe',
      fill: 'none' }, svg));
    // semantic category by word → a distinct hue (royalty / people / animals / structure).
    const ROYAL = new Set(['king', 'queen', 'kingdom', 'rules', 'throne', 'prince']);
    const PEOPLE = new Set(['man', 'woman']);
    const ANIMAL = new Set(['cat', 'dog', 'chases']);
    const catOf = (w) => ROYAL.has(w) ? 'royal' : PEOPLE.has(w) ? 'people'
      : ANIMAL.has(w) ? 'animal' : 'structure';
    // dot screen positions
    const dots = mapPts.map((p) => ({ w: p.w, dx: psx(p.x), dy: psy(p.y), cat: catOf(p.w) }));
    // PCA drops man/woman/chases/rules almost on the SAME point, so their dots overlap into one blob.
    // A short symmetric de-overlap pass nudges any two coincident dots just far enough apart to read
    // as distinct marks (≥ 2·r + 1.5px), preserving the tight cluster (meaning-as-geometry) while
    // letting each dot — and its leader — stand on its own.  (defect-2 fix, dot half)
    const DOT_MIN = 2 * 5 + 1.5;
    for (let iter = 0; iter < 80; iter++) {
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          let vx = b.dx - a.dx, vy = b.dy - a.dy;
          let dist = Math.hypot(vx, vy);
          if (dist < DOT_MIN) {
            if (dist < 1e-3) { vx = (i - j) || 1; vy = ((i + j) % 2) ? 1 : -1; dist = Math.hypot(vx, vy); }
            const push = (DOT_MIN - dist) / 2 + 0.3;
            vx /= dist; vy /= dist;
            a.dx -= vx * push; a.dy -= vy * push;
            b.dx += vx * push; b.dy += vy * push;
          }
        }
      }
    }
    // keep the (now spread) dots inside the frame.
    dots.forEach((d) => {
      d.dx = Math.max(pX + 5, Math.min(pX + pW - 5, d.dx));
      d.dy = Math.max(pY0 + 5, Math.min(pY1 - 5, d.dy));
    });
    // ── label de-clutter (defect-2 fix) ──────────────────────────────────────────────────────────
    // The PCA projection drops man/woman/chases/rules almost on the origin, so their DOTS overlap and
    // the old "vertical-only" repulsion left labels piled on each other and sitting on dots. We run a
    // proper anchor+leader layout: each label box (sized to its real text width) is seeded OUTWARD
    // from the cluster centroid, then a force pass repels it from (a) every other label box and
    // (b) every dot, so no label overprints another label OR any dot. A leader line ties each label
    // back to its dot. The slide-viz-gate flags stacked labels (IoU / centre dist) — this clears it.
    const DOT_R = 5;
    const LBL_H = 12, GAP = 3, CHARW = 5.0;             // gv-maplabel is 9px mono
    const lblText = (w) => w.slice(0, 8);
    const cenX = dots.reduce((s, d) => s + d.dx, 0) / (dots.length || 1);
    const cenY = dots.reduce((s, d) => s + d.dy, 0) / (dots.length || 1);
    // each label: box width from its glyph count; centre seeded a fixed radius OUTWARD from centroid.
    const lab = dots.map((d) => {
      const w = Math.max(16, lblText(d.w).length * CHARW + 4);
      let ax = d.dx - cenX, ay = d.dy - cenY;
      const r = Math.hypot(ax, ay) || 1;
      ax /= r; ay /= r;                                  // unit radial direction (centroid → dot)
      const off = 14;                                    // initial label stand-off from the dot
      return { w, h: LBL_H, cx: d.dx + ax * off, cy: d.dy + ay * off, ref: d };
    });
    // force relaxation: label↔label and label↔dot separation.
    for (let iter = 0; iter < 220; iter++) {
      // label vs label
      for (let i = 0; i < lab.length; i++) {
        for (let j = i + 1; j < lab.length; j++) {
          const a = lab[i], b = lab[j];
          const ox = (a.w + b.w) / 2 + GAP - Math.abs(a.cx - b.cx);
          const oy = (a.h + b.h) / 2 + GAP - Math.abs(a.cy - b.cy);
          if (ox > 0 && oy > 0) {                        // overlapping → push along the cheaper axis
            if (oy <= ox) {
              const push = oy / 2 + 0.4, dir = a.cy <= b.cy ? -1 : 1;
              a.cy += dir * push; b.cy -= dir * push;
            } else {
              const push = ox / 2 + 0.4, dir = a.cx <= b.cx ? -1 : 1;
              a.cx += dir * push; b.cx -= dir * push;
            }
          }
        }
      }
      // label vs EVERY dot (so no label sits on a dot)
      for (const a of lab) {
        for (const d of dots) {
          const ox = a.w / 2 + DOT_R + GAP - Math.abs(a.cx - d.dx);
          const oy = a.h / 2 + DOT_R + GAP - Math.abs(a.cy - d.dy);
          if (ox > 0 && oy > 0) {
            if (oy <= ox) a.cy += (a.cy <= d.dy ? -1 : 1) * (oy + 0.4);
            else          a.cx += (a.cx <= d.dx ? -1 : 1) * (ox + 0.4);
          }
        }
      }
      // gentle pull back toward the seed direction so labels stay near their own dot
      for (let i = 0; i < lab.length; i++) {
        const a = lab[i], d = dots[i];
        a.cx += (d.dx - a.cx) * 0.012;
        a.cy += (d.dy - a.cy) * 0.012;
      }
    }
    // clamp each label box fully inside the map frame (OOB guard).
    lab.forEach((a) => {
      a.cx = Math.max(pX + a.w / 2 + 2, Math.min(pX + pW - a.w / 2 - 2, a.cx));
      a.cy = Math.max(pY0 + a.h / 2 + 2, Math.min(pY1 - a.h / 2 - 2, a.cy));
    });
    dots.forEach((d, i) => {
      const a = lab[i];
      const g = el('g', {}, svg);
      el('circle', { cx: d.dx, cy: d.dy, r: DOT_R, class: `gv-mapdot gv-cat-${d.cat}`,
        'data-role': `cat-${d.cat}` }, g);
      // text anchor: left/right edge of the box, whichever side faces the dot, baseline at box mid.
      const onLeft = a.cx >= d.dx;                       // box is to the RIGHT of dot → anchor start
      const tx = onLeft ? a.cx - a.w / 2 + 2 : a.cx + a.w / 2 - 2;
      const ty = a.cy + 3.2;
      // leader from the dot to the box edge nearest the dot.
      el('line', { x1: d.dx, y1: d.dy, x2: tx, y2: a.cy, class: 'gv-leader', fill: 'none' }, g);
      el('text', { x: tx, y: ty, class: 'gv-maplabel', 'text-anchor': onLeft ? 'start' : 'end' }, g)
        .textContent = lblText(d.w);
      add('map', g);
    });
    // loss readout (right of the map): before → after, with a shrinking bar.
    const lx = pX + pW + 40, lyTop = pY0 + 16;
    const lbBefore = typeof loss.before === 'number' ? loss.before : 0;
    const lbAfter = typeof loss.after === 'number' ? loss.after : 0;
    const lbMax = Math.max(1e-6, lbBefore);
    const lossBarW = Wd - PAD - lx;
    text('map', lx, lyTop, 'gv-losslab', 'start', labels.lossBefore || 'loss before');
    add('map', el('rect', { x: lx, y: lyTop + 8, width: lossBarW, height: 16, rx: 3,
      class: 'gv-lossbar gv-loss-before', 'data-role': 'loss-before' }, svg));
    text('map', lx, lyTop + 20, 'gv-lossval', 'start', num(lbBefore, 2));
    text('map', lx, lyTop + 56, 'gv-losslab', 'start', labels.lossAfter || 'loss after');
    const afterW = Math.max(3, (lbAfter / lbMax) * lossBarW);
    add('map', el('rect', { x: lx, y: lyTop + 64, width: afterW, height: 16, rx: 3,
      class: 'gv-lossbar gv-loss-after', 'data-role': 'loss-after' }, svg));
    text('map', lx, lyTop + 76, 'gv-lossval', 'start', num(lbAfter, 4));

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // PANEL 4 (step 4): count-based GloVe vs predictive word2vec — two faces of one coin.
    // ════════════════════════════════════════════════════════════════════════════════════════════
    layer('coin', 4);
    panelHead('coin', PAD, P4_Y + 12, labels.coinHead || 'two faces of one coin');
    const boxY = P4_Y + 32, boxH = 64, boxW = 360;
    // left box: count-based GloVe
    add('coin', el('rect', { x: PAD, y: boxY, width: boxW, height: boxH, rx: 8,
      class: 'gv-coinbox gv-coin-count', 'data-role': 'count-route' }, svg));
    text('coin', PAD + 14, boxY + 26, 'gv-coinword', 'start', 'GloVe');
    text('coin', PAD + 14, boxY + 48, 'gv-coinsub', 'start', labels.coinCount || 'count-based');
    // right box: predictive word2vec
    const rbx = Wd - PAD - boxW;
    add('coin', el('rect', { x: rbx, y: boxY, width: boxW, height: boxH, rx: 8,
      class: 'gv-coinbox gv-coin-pred', 'data-role': 'pred-route' }, svg));
    text('coin', rbx + 14, boxY + 26, 'gv-coinword', 'start', 'word2vec');
    text('coin', rbx + 14, boxY + 48, 'gv-coinsub', 'start', labels.coinPred || 'predictive');
    // connector + PMI nod between them
    const midY = boxY + boxH / 2;
    add('coin', el('line', { x1: PAD + boxW, y1: midY, x2: rbx, y2: midY,
      class: 'gv-coinlink', 'marker-end': 'url(#gv-ah)', 'marker-start': 'url(#gv-ah)' }, svg));
    text('coin', Wd / 2, boxY + boxH + 26, 'gv-pmi', 'middle', labels.coinPmi || 'shifted PMI');

    // shared arrow-head def
    const defs = el('defs', {}, svg);
    const m = el('marker', { id: 'gv-ah', viewBox: '0 0 10 10', refX: '8', refY: '5',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'gv-arrhead' }, m);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter).
    return function update(k) {
      for (const name in layers) {
        const L = layers[name];
        const on = k >= L.from && k <= L.to;
        for (const node of L.nodes) node.classList.toggle('is-hidden', !on);
      }
    };
  },
});
