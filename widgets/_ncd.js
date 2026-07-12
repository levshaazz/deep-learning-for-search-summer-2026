/* _ncd.js — the shared glyph vocabulary for the neural-circuit-diagram widget family (Abbott &
   Zardini v2 lens). Pure geometry: every function takes the SVG element builder `el` and CLASS names,
   so colour lives in each widget's own CSS tokens (semantic contract) while the SHAPES stay identical
   across ncd-attention / ncd-retrieval / ncd-posenc / ncd-embedding / ncd-block / ncd-rag. No DOM
   assumptions beyond `el(tag, attrs, parent)`; inlinable, offline-safe, dependency-free.

   Grammar: a WIRE is a tensor axis; a CUP is a contraction (an axis disappears); a TRIANGLE is
   softmax; a CHIPPED RECTANGLE is a learned op (L); a HEXAGON is a reindex/slice (top-k); a
   left-PENTAGON is an element (a looked-up / pre-computed vector); a BOX is a generic op; a woven
   thin wire + a BROADCAST tag is a broadcast; a dashed REGION is a broadcast axis made concrete.

   ONE WORD PER CONCEPT. The family's whole claim is that a FIXED glyph vocabulary makes bugs visible,
   so an unfixed WORD vocabulary is the same bug one level up. The weave tag reads "broadcast", never
   "Tiling": L15 already spends "tiling"/"тайлинг" on FlashAttention's block tiling, which SAVES the
   n×n matrix — and this weave is the very thing that BILLS you for it. One lesson, one topic, one
   word. The RU/TT canon (enforced by G15 — _research/check_lexicon.py — which HARD-bans the стем
   «свёрт»/«сверт» inside widgets/ncd-*):
     contraction = стягивание (NEVER «свёртка» — that is also Russian for CONVOLUTION, and L06 slide 47
                   tells the same student «Никаких свёрток»)  ·  cup = чаша (never «чашка»)
     box         = прямоугольник (never «коробка»/«блок» — «блок» is the transformer block; tt турыпочмак)
     broadcast   = broadcast  ·  concat = concat (Latin)  ·  ledger = сводка (tt җыелма)
     encoder     = кодировщик (ru) / кодлаучы (tt) */

export function glyphs(el) {
  /* PARENT IS MANDATORY. It used to be optional-by-accident: el() only appends `if (parent)`, so a call
     that forgot it built a <text> node, returned it, and dropped it on the floor — silently. That is
     exactly how ncd-attention's step-4 headline ("the same dot product q·k = 6, two fates") shipped as a
     blank strip at the top of the frame: the node existed in the code, never in the DOM, and no gate
     could see a label that was never drawn. Throwing turns an invisible content loss into a loud crash. */
  const text = (parent, x, y, s, cls, anchor = 'middle') => {
    if (!parent) throw new Error(`_ncd.text("${s}"): no parent — the label would be created and dropped`);
    const t = el('text', { x, y, class: cls || '', 'text-anchor': anchor }, parent); t.textContent = s; return t;
  };
  /* A wire is an axis. Solid wires also get `ncd-wire` + pathLength="1" so the shared step-enter
     motion can DRAW them (one keyframe fits any length once the length is normalised to 1). Dashed
     wires opt out — they own their dash pattern, and animating dashoffset would erase it. */
  const wire = (parent, cls, x1, y1, x2, y2, opt = {}) => {
    const a = { class: opt.dash ? cls : cls + ' ncd-wire', x1, y1, x2, y2 };
    if (!opt.dash) a.pathLength = 1;
    const p = el('line', a, parent);
    if (opt.dash) p.setAttribute('stroke-dasharray', opt.dash);
    if (opt.arrow) el('path', { class: cls, d: `M${x2 - 8},${y2 - 4} L${x2},${y2} L${x2 - 8},${y2 + 4}`,
      fill: 'none', style: 'stroke-linejoin:round' }, parent);
    return p;
  };
  const path = (parent, cls, d) => el('path', { class: cls, d }, parent);

  // chipped rectangle — a learned op, labelled (e.g. "L", "L enc")
  function chippedL(parent, cx, cy, label, boxCls, txtCls, w = 46, h = 40) {
    const c = 10, x = cx - w / 2, y = cy - h / 2;
    el('path', { class: boxCls, d: `M${x},${y} H${x + w - c} L${x + w},${y + c} V${y + h} H${x} Z` }, parent);
    text(parent, cx, cy + 4, label, txtCls);
  }
  // contraction cup (an axis dies here)
  function cup(parent, cx, cy, opCls, dotCls) {
    el('path', { class: opCls, d: `M${cx - 14},${cy - 12} Q${cx},${cy + 16} ${cx + 14},${cy - 12}` }, parent);
    el('circle', { class: dotCls, cx, cy: cy + 6, r: 2.4 }, parent);
  }
  /* softmax expanding triangle. It EXPANDS ALONG the axis it normalises — that direction is the whole
     content of the glyph, which is why `rot` exists: rot=0 points right (normalise along a horizontal
     axis), rot=90 points down (normalise along a vertical axis). ncd-debug's bug 2 is exactly this and
     nothing else: same wires, same n×n grid, the triangle turned a quarter turn. Default rot=0 keeps
     every existing 5-argument call byte-identical. */
  function tri(parent, cx, cy, triCls, txtCls, rot = 0) {
    const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    const P = ([x, y]) => `${cx + x * c - y * s},${cy + x * s + y * c}`;
    el('path', { class: triCls, d: `M${P([-18, -19])} L${P([18, 0])} L${P([-18, 19])} Z` }, parent);
    const tx = -5 * c - 1 * s, ty = -5 * s + 1 * c;   // the σ rides in the fat half, whichever way it faces
    text(parent, cx + tx, cy + ty + 4, 'σ', txtCls);
  }
  // reindex / slice / top-k hexagon
  function hexagon(parent, cx, cy, label, hexCls, txtCls, r = 24, ry = 18) {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(`${cx + r * Math.cos(a)},${cy + ry * Math.sin(a)}`); }
    el('polygon', { class: hexCls, points: pts.join(' ') }, parent);
    if (label) text(parent, cx, cy + 4, label, txtCls);
  }
  // element (a looked-up / pre-computed vector) — left-pointing pentagon
  function pentagon(parent, cx, cy, label, elCls, txtCls, w = 34, h = 30) {
    el('path', { class: elCls, d: `M${cx - w / 2},${cy} L${cx - w / 6},${cy - h / 2} H${cx + w / 2} V${cy + h / 2} H${cx - w / 6} Z` }, parent);
    if (label) text(parent, cx + 5, cy + 4, label, txtCls);
  }
  // generic op box (rounded) with a label + optional sub-label
  function box(parent, cx, cy, w, h, label, sub, boxCls, txtCls, sizeCls) {
    el('rect', { class: boxCls, x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6 }, parent);
    text(parent, cx, cy + (sub ? -2 : 4), label, txtCls);
    if (sub) text(parent, cx, cy + 12, sub, sizeCls);
  }
  /* tagBox — a boxed label that MEASURES its text instead of guessing at it.

     WHY. Every tag box in this family sized itself as `chars x 6.2..6.6px + padding`. That constant is a
     lie in two directions: mono Cyrillic advances wider than Latin (so RU/TT labels burst boxes that fit
     in English), and it is pinned to one font-size (so raising 10px to 11px burst them all over again).
     Both defects shipped, twice. A box that MEASURES cannot be wrong about any language or any size.

     Draws the text first, reads its real bbox, then inserts the rect BEHIND it.

     IT IS NOT ENOUGH FOR THE SVG TO BE IN THE DOCUMENT — IT MUST BE RENDERED. Inside a display:none
     subtree getBBox() returns {0,0,0,0}, so the box comes out padding-sized and pinned to the origin: a
     26×12 rectangle in the figure's top-left corner, and it STAYS there, because nothing measures twice.
     That is not a hypothetical — deck.js's fitAllSlides() strips is-active from every slide to re-measure
     them one by one after the fonts land, and any figure that (re)draws in that window draws itself blind.
     So refuse: a measurement that cannot be taken must not be silently rounded down to zero. The factory
     already declines to paint a hidden host; this is the backstop for every other driver. */
  function tagBox(parent, cx, cy, s, boxCls, txtCls, padX = 9, padY = 5, anchor = 'middle') {
    const t = text(parent, cx, cy, s, txtCls, anchor);
    const b = t.getBBox();
    if (String(s).trim() && b.width === 0) {
      throw new Error(`_ncd.tagBox("${s}"): measured a 0-width box — the figure is being drawn inside a `
        + `hidden subtree, where getBBox() lies. Every measured box would collapse onto the origin.`);
    }
    const r = el('rect', { class: boxCls, x: b.x - padX, y: b.y - padY,
      width: b.width + padX * 2, height: b.height + padY * 2, rx: 5 }, parent);
    parent.insertBefore(r, t);      // behind the glyphs, never over them
    return r;
  }

  // boxed value chips (each number in its own box + gap → never a run-on)
  function chips(parent, centers, y, vals, chipCls, valCls, w, fmt) {
    centers.forEach((cx, i) => {
      el('rect', { class: chipCls, x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 5 }, parent);
      text(parent, cx, y + 4, fmt ? fmt(vals[i]) : String(vals[i]), valCls);
    });
  }
  // broadcast weave — a dashed arc bowing up over [x1..x2] with a broadcast tag
  function weave(parent, wCls, tagCls, txtCls, x1, x2, y, bow, tag) {
    const mx = (x1 + x2) / 2;
    path(parent, wCls, `M${x1},${y} C${x1 + 30},${y - bow} ${mx - 60},${y - bow} ${mx},${y - bow} ` +
      `C${mx + 60},${y - bow} ${x2 - 30},${y - bow} ${x2},${y}`);
    el('circle', { cx: x1, cy: y, r: 3, class: wCls, style: 'stroke:none' }, parent);
    tagBox(parent, mx, y - bow + 3, tag, tagCls, txtCls, 8, 4);   // measures; no char-width guess
  }
  // a dashed region making a broadcast axis concrete, with a corner tag
  function region(parent, x, y, w, h, tag, regionCls, tagCls, txtCls) {
    el('rect', { class: regionCls, x, y, width: w, height: h, rx: 14 }, parent);
    // The tag rides ABOVE the border and MEASURES itself — via tagBox, not a copy of it. It used to
    // carry its own inline measure, which is how it quietly dodged tagBox's guard and kept collapsing
    // onto the origin when it was drawn into a subtree that could not be measured. One measured box in
    // the codebase, or the guard protects only the callers that happened to use it.
    tagBox(parent, x + 24, y - 6, tag, tagCls, txtCls, 9, 4, 'start');
  }
  /* legend — the key line under a figure, WRAPPED BY MEASUREMENT.
     It used to be one long <text> tuned by eye until it looked like it fit. That makes it a hostage to
     font metrics: the same Russian string that sits comfortably inside the frame on macOS renders a few
     px wider under CI's Linux Chromium and pokes out of it — a defect that is invisible on the machine
     that authored it and HARD-fails on the machine that ships it. Legends are already written as items
     joined by ' · ', so pack those items into lines that MEASURE under maxW, and stack them. */
  function legend(parent, cx, y, s, cls, maxW, lh = 15) {
    const items = String(s).split(' · ');
    const probe = text(parent, -9999, -9999, '', cls);    // one throwaway, measured then discarded
    const fits = (str) => { probe.textContent = str; return probe.getBBox().width <= maxW; };
    const lines = [];
    let cur = '';
    for (const it of items) {
      const next = cur ? `${cur} · ${it}` : it;
      if (cur && !fits(next)) { lines.push(cur); cur = it; } else cur = next;
    }
    if (cur) lines.push(cur);
    probe.remove();
    // BOTTOM-ANCHORED: the last line lands on y and the wrap grows UPWARD, into the figure's own
    // bottom margin. A legend sits a few px above the frame's edge by design, so growing downward
    // would trade an overflowing line for an overflowing frame — the same defect, one step later.
    const y0 = y - (lines.length - 1) * lh;
    lines.forEach((ln, i) => text(parent, cx, y0 + i * lh, ln, cls));
    return lines.length;
  }
  const fmt3 = (x) => (typeof x !== 'number' ? '' : Number.isInteger(x) ? String(x) : x.toFixed(3));
  return { text, wire, path, chippedL, cup, tri, hexagon, pentagon, box, chips, weave, region, tagBox, legend, fmt3 };
}

/* shapeTable(obj) — the ONE place a widget names its axes.

   WHY THIS EXISTS. ncd-attention shipped with the score matrix labelled `n×m` on the figure while its own
   ledger, in the same frame, called it `n×n` — and the whole card is titled "the axis that costs 25.8 GB".
   The bug was not a typo; it was that the same shape was TYPED TWICE, in two files, by two hands. A
   notation whose entire claim is "the picture IS the computation" cannot let the picture and the caption
   disagree, so the shape must have exactly one source and both readers must read it.

   Usage — declare once, then use SH.scores in the ledger AND in the SVG label:
       const SH = shapeTable({ x: 'n×m', qkv: 'n×d', scores: 'n×n', ctx: 'n×d' })
   Unknown keys throw rather than yielding `undefined` (which would silently render an empty label). */
export function shapeTable(obj) {
  const t = Object.freeze({ ...obj });
  return new Proxy(t, {
    get(target, k) {
      if (typeof k === 'symbol' || k in target) return target[k];
      throw new Error(`shapeTable: no axis named "${String(k)}" — declared: ${Object.keys(target).join(', ')}`);
    },
  });
}

/* stage(host) — the flex row a ledger-bearing widget draws into: the SVG on the left, the ledger
   aside on the right. Widgets WITHOUT a ledger keep appending their <svg> straight to `host`.
   The outer wrapper is a CONTAINER (not a media query): in a wide deck mount the ledger sits beside
   the diagram, but inside a narrow column it drops BELOW it — otherwise the aside would eat the
   width the diagram needs and shrink its labels below legibility. Scoped here, so declaring the
   container cannot perturb the ~30 non-NCD widgets that share .wgt-root. */
export function stage(host) {
  const w = document.createElement('div');
  w.className = 'ncd-stagewrap';
  const d = document.createElement('div');
  d.className = 'ncd-stage';
  w.appendChild(d);
  host.appendChild(w);
  return d;
}

/* ledger(parent, title) — the running axis/cost tally beside the diagram.
   rows: [{ k, v, state, tone }] — `state` is 'new' (just introduced by this step), 'on' (already
   established) or 'off' (not reached yet, dimmed); `tone` is 'cost' (red — what this design COSTS)
   or 'good' (green — what it saves). It is deliberately dumb: the widget decides what a step means. */
export function ledger(parent, title) {
  const a = document.createElement('aside');
  a.className = 'ncd-lg';
  const h = document.createElement('div');
  h.className = 'ncd-lg-h';
  h.textContent = title || '';
  a.appendChild(h);
  const body = document.createElement('div');
  body.className = 'ncd-lg-b';
  a.appendChild(body);
  const note = document.createElement('p');
  note.className = 'ncd-lg-note';
  a.appendChild(note);
  parent.appendChild(a);
  return {
    root: a,
    setTitle(t) { h.textContent = t || ''; },
    set(rows, noteText) {
      body.textContent = '';
      (rows || []).forEach((r) => {
        const row = document.createElement('div');
        row.className = 'ncd-lg-row'
          + (r.state === 'new' ? ' is-new' : r.state === 'off' ? '' : ' is-on')
          + (r.tone === 'cost' ? ' is-cost' : r.tone === 'good' ? ' is-good' : '');
        const k = document.createElement('span');
        k.className = 'ncd-lg-k';
        k.textContent = r.k;
        const v = document.createElement('span');
        v.className = 'ncd-lg-v';
        v.textContent = r.v;
        row.appendChild(k);
        row.appendChild(v);
        body.appendChild(row);
      });
      note.textContent = noteText || '';
    },
  };
}
