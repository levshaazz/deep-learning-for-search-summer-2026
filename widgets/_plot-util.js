/* _plot-util.js — tiny, dependency-free plot-geometry helpers shared by the Book plot widgets.

   WHY: the widget audit (_internal/book_audit2/p1-widgets.md) found one shared root cause behind 4
   of the 5 widget defects — *geometry computed without clamping/sizing to the frame box*:
     • a fit line evaluated at the raw x-domain endpoints extrapolates ABOVE the frame (negative
       screen-y) and exits the right edge   (zipf-heaps);
     • an SVG box sized for one column while a metric panel stacks far below it overflows the box
       (ranking-metrics);
     • too-small y-domain / edge padding jams the top data point and its label against the frame
       edge   (zipf-heaps, pos-bias-curve).

   These three pure functions fix that class once, theme-agnostically (no DOM, no styling):
     • padDomain(min,max,frac)            — widen a data domain by a fraction of its span so marks
                                            and their labels never land on the frame edge.
     • clampSegmentToRect(x1,y1,x2,y2,r)  — clip a line segment to the plot rect (Liang–Barsky), so
                                            only the part INSIDE the frame is drawn.
     • frameHeightFor(maxY, pad)          — size an SVG's viewBox height to its deepest content, so
                                            nothing stacks past the box. */

/* Widen [min,max] by `frac` of the span on BOTH ends (frac defaults to 0.08). For a degenerate
   (min===max) domain, pads by `frac` of |min| (or 1 if min is 0) so the point isn't on the edge. */
export function padDomain(min, max, frac = 0.08) {
  let span = max - min;
  if (!(span > 0)) span = Math.abs(min) || 1;
  const p = span * frac;
  return { min: min - p, max: max + p, span: max - min + 2 * p };
}

/* Clip the segment (x1,y1)→(x2,y2) to the axis-aligned rect {x,y,w,h} via Liang–Barsky.
   Returns the clipped endpoints {x1,y1,x2,y2} (the portion inside the rect) or null if the segment
   lies entirely outside. Endpoints already inside are returned unchanged. */
export function clampSegmentToRect(x1, y1, x2, y2, rect) {
  const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;            // parallel to this edge AND outside it
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return null; if (t > t0) t0 = t; }
      else          { if (t < t0) return null; if (t < t1) t1 = t; }
    }
  }
  return {
    x1: x1 + t0 * dx, y1: y1 + t0 * dy,
    x2: x1 + t1 * dx, y2: y1 + t1 * dy,
  };
}

/* viewBox height that fits content whose deepest drawn y is `maxY`, plus a bottom `pad` (default 24).
   Use as `const H = frameHeightFor(deepestY)` so the SVG box grows with its content instead of
   clipping/overflowing at a hard-coded height. */
export function frameHeightFor(maxY, pad = 24) {
  return Math.ceil(maxY + pad);
}

/* =============================================================================
   3Blue1Brown / manim VISUAL-GRAMMAR helpers (opt-in, vanilla, offline)
   -----------------------------------------------------------------------------
   Three reusable patterns any stepped SVG widget can adopt. They are PURE behaviour
   (class toggles, a viewBox tween, a KaTeX call) — they own NO palette: colour comes
   from CSS classes the widget styles with ROLE TOKENS (the semantic contract in
   tokens/design-tokens.css), so they theme (light/dark) for free and never double-paint
   text (the protagonist halo is a separate <circle>, never a stroke on a <text>).

   tsne-steps already hand-rolls pattern (1) — a color-locked anchor halo tracked across
   steps; `protagonist()` factors that into a controller other widgets can reuse.
   ============================================================================= */

/* ── PATTERN 1 · follow-one-object ("protagonist") ───────────────────────────
   Keep ONE element color-locked + visually emphasized (a halo ring + the
   `is-protagonist` class) as it moves/transforms across steps, with the rest
   de-emphasized (the `is-muted` class). The widget styles those two classes with
   role tokens (e.g. `.is-muted{opacity:.4}`, `.is-protagonist{}` left to the locked
   fill). The halo is an SVG <circle> the controller creates ONCE in the given svg and
   re-points each step — never a stroke on text, so the double-paint gate stays silent.

   makeProtagonist(svg, { haloClass='wgt-halo', haloR=11, focusClass='is-protagonist',
                          mutedClass='is-muted', haloStroke=null }) → controller with:
     • focus(protagonistEl, restEls, { cx, cy, r })
         — add focusClass to the star, mutedClass to every rest element, and park the
           halo ring at (cx,cy) with radius r (defaults haloR). Pass cx===null to hide
           the halo (e.g. a step before the protagonist has a position).
     • clear()  — drop all emphasis (hide halo, un-mute everyone) for a neutral step.
     • halo     — the underlying <circle> (read-only; the widget may class it further).
   The controller calls the host's own `el`/`svg` builder if given; else uses createElementNS. */
export function makeProtagonist(svg, opts = {}) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const haloClass = opts.haloClass || 'wgt-halo';
  const focusClass = opts.focusClass || 'is-protagonist';
  const mutedClass = opts.mutedClass || 'is-muted';
  const defR = typeof opts.haloR === 'number' ? opts.haloR : 11;
  // halo ring: a fill:none <circle>; its stroke comes from the haloClass CSS (a role token).
  // An optional inline haloStroke is allowed ONLY for a token var() string (themeable) — never a
  // raw saturated hex on a text node (this is a <circle>, so it can't trip the text double-paint
  // detector regardless, but we keep the contract clean by preferring the class).
  const halo = document.createElementNS(SVGNS, 'circle');
  halo.setAttribute('class', haloClass);
  halo.setAttribute('fill', 'none');
  if (opts.haloStroke) halo.setAttribute('stroke', opts.haloStroke);
  halo.style.opacity = '0';
  svg.appendChild(halo);

  let muted = [];
  function unmuteAll() { for (const e of muted) e && e.classList && e.classList.remove(mutedClass); muted = []; }

  return {
    halo,
    focus(star, rest = [], pos = {}) {
      unmuteAll();
      for (const e of rest) {
        if (!e || e === star || !e.classList) continue;
        e.classList.add(mutedClass); muted.push(e);
      }
      if (star && star.classList) star.classList.add(focusClass);
      if (pos && pos.cx != null && isFinite(pos.cx)) {
        halo.setAttribute('cx', pos.cx);
        halo.setAttribute('cy', pos.cy);
        halo.setAttribute('r', typeof pos.r === 'number' ? pos.r : defR);
        halo.style.opacity = '1';
      } else {
        halo.style.opacity = '0';
      }
    },
    clear() {
      unmuteAll();
      halo.style.opacity = '0';
    },
  };
}

/* parse a "x y w h" viewBox string → {x,y,w,h} (numbers). */
function parseViewBox(vb) {
  const p = String(vb || '').trim().split(/[\s,]+/).map(Number);
  return p.length === 4 && p.every((n) => isFinite(n)) ? { x: p[0], y: p[1], w: p[2], h: p[3] } : null;
}

/* ── PATTERN 2 · viewBox "camera move" (zoom / pan to a region, then back) ────
   Animate an <svg>'s `viewBox` to push toward a region of interest, then (optionally)
   pull back to the full frame — the manim "camera.frame" move. Pure rAF tween on the
   four viewBox numbers with smooth easing; honours prefers-reduced-motion (jumps to the
   target instantly there). Because it only moves the camera, EVERY mark shifts on screen
   — which the step-progression gate reads as in-place movement (real progress), not a
   dead step.

   cameraTo(svg, target, { dur=520, ease, pad=0, clampTo, onDone }) → cancel()
     • target  — {x,y,w,h} region in the SAME user-space as the svg's viewBox. Pass null
                 (or the saved full box) to pull back. `pad` insets/outsets the target.
     • clampTo — {x,y,w,h} hard bounds the animated box is kept inside (defaults to the
                 svg's current/declared viewBox) so the camera never shows empty space
                 beyond the content; the target is also aspect-corrected to the svg's
                 own w:h so nothing stretches.
     • returns cancel() — stop the tween early (e.g. on a rapid re-step).
   Reading the live viewBox each call means re-stepping mid-flight starts from where the
   camera actually is (no snap). */
export function cameraTo(svg, target, opts = {}) {
  const dur = typeof opts.dur === 'number' ? opts.dur : 520;
  const ease = opts.ease || ((t) => 1 - Math.pow(1 - t, 3)); // easeOutCubic
  const from = parseViewBox(svg.getAttribute('viewBox')) || { x: 0, y: 0, w: 100, h: 100 };
  const full = opts.clampTo || svg.__cameraFull || from;     // hard bounds (content extent)
  // aspect-correct the target to the svg's own ratio so the picture never stretches.
  const aspect = full.w / full.h;
  let t = target ? { ...target } : { ...full };
  if (opts.pad) { t = { x: t.x - opts.pad, y: t.y - opts.pad, w: t.w + 2 * opts.pad, h: t.h + 2 * opts.pad }; }
  // grow the shorter side so t.w / t.h === aspect (zoom shows AT LEAST the requested region).
  if (t.w / t.h > aspect) { const nh = t.w / aspect; t.y -= (nh - t.h) / 2; t.h = nh; }
  else { const nw = t.h * aspect; t.x -= (nw - t.w) / 2; t.w = nw; }
  // clamp inside the content bounds (never pan past the edges / never zoom out beyond full).
  t.w = Math.min(t.w, full.w); t.h = Math.min(t.h, full.h);
  t.x = Math.max(full.x, Math.min(t.x, full.x + full.w - t.w));
  t.y = Math.max(full.y, Math.min(t.y, full.y + full.h - t.h));

  if (svg.__cameraCancel) svg.__cameraCancel();             // cancel any in-flight move
  const setVB = (b) => svg.setAttribute('viewBox', `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.w.toFixed(2)} ${b.h.toFixed(2)}`);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || dur <= 0 || typeof requestAnimationFrame !== 'function') {
    setVB(t); svg.__cameraCancel = null; if (opts.onDone) opts.onDone(); return () => {};
  }
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let raf = 0, cancelled = false;
  const tick = (now) => {
    if (cancelled) return;
    const p = Math.min(1, ((now || Date.now()) - t0) / dur);
    const e = ease(p);
    setVB({ x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e,
            w: from.w + (t.w - from.w) * e, h: from.h + (t.h - from.h) * e });
    if (p < 1) raf = requestAnimationFrame(tick);
    else { svg.__cameraCancel = null; if (opts.onDone) opts.onDone(); }
  };
  const cancel = () => { cancelled = true; if (raf) cancelAnimationFrame(raf); svg.__cameraCancel = null; };
  svg.__cameraCancel = cancel;
  raf = requestAnimationFrame(tick);
  return cancel;
}

/* Remember the svg's FULL viewBox as the camera's "pulled-back" home + clamp bounds. Call once at
   mount, after the final viewBox is set, so cameraTo() can clamp to it and `cameraHome()` returns. */
export function cameraInit(svg) {
  const vb = parseViewBox(svg.getAttribute('viewBox'));
  if (vb) svg.__cameraFull = vb;
  return vb;
}
export function cameraHome(svg, opts = {}) {
  return cameraTo(svg, svg.__cameraFull || null, opts);
}

/* ── PATTERN 3 · term-by-term formula reveal (≈ manim TransformMatchingTex) ───
   Render a KaTeX formula as an ORDERED list of term spans and reveal them term-by-term
   across steps, cross-fading + highlighting the term that changed since the previous
   step (instead of swapping the whole equation). Offline: uses the vendored KaTeX on
   window.katex; if KaTeX hasn't evaluated yet (the book loads it `defer`, AFTER the
   widget mount module), it retries on `load` and via a short poll, so the math always
   lands without a network call. Term text is escaped by KaTeX itself.

   makeFormulaReveal(host, { terms, termClass='wgt-term', highlightClass='is-changed',
                             display=false, katexOpts })
     terms — [{ tex, from, to=Infinity }] each a KaTeX fragment shown when from<=step<=to.
             Renders each fragment into its OWN inline span so opacity/highlight is
             per-term. The widget styles `.wgt-term` (base) + `.is-changed` (the
             token-coloured emphasis on the just-revealed term) — role tokens only.
   → controller with:
     • show(step) — reveal terms whose [from,to] covers `step`; the term(s) whose `from`
                    === step (just appeared) get highlightClass for one step; fade the rest in.
     • el         — the container element (already appended to host).
   It NEVER swaps the whole string: a term already shown stays shown (manim's "matching"
   feel), only opacity + the highlight class change between steps. */
export function makeFormulaReveal(host, opts = {}) {
  const terms = opts.terms || [];
  const termClass = opts.termClass || 'wgt-term';
  const hiClass = opts.highlightClass || 'is-changed';
  const display = !!opts.display;
  const katexOpts = { throwOnError: false, displayMode: display, ...(opts.katexOpts || {}) };

  const el = document.createElement(display ? 'div' : 'span');
  el.className = (opts.containerClass || 'wgt-formula') + (display ? ' wgt-formula-block' : '');
  host.appendChild(el);

  // one span per term (kept in DOM order); each starts hidden (opacity:0) for the fade-in.
  const spans = terms.map((tm) => {
    const s = document.createElement('span');
    s.className = termClass;
    s.style.opacity = '0';
    el.appendChild(s);
    return s;
  });

  let rendered = false;
  function renderAll() {
    if (rendered) return;
    const K = (typeof window !== 'undefined') && window.katex;
    if (!K || typeof K.render !== 'function') return false; // KaTeX not ready yet
    terms.forEach((tm, i) => {
      try { K.render(tm.tex, spans[i], katexOpts); }
      catch { spans[i].textContent = tm.tex; }               // graceful: show raw tex
    });
    rendered = true;
    return true;
  }
  // try now; if KaTeX is still deferring, retry on load + a short bounded poll (offline, no network).
  if (!renderAll() && typeof window !== 'undefined') {
    const retry = () => { if (renderAll() && pending != null) { clearInterval(pending); pending = null; } };
    window.addEventListener('load', retry, { once: true });
    let tries = 0; let pending = setInterval(() => { if (renderAll() || ++tries > 40) { clearInterval(pending); pending = null; } }, 50);
  }

  let lastStep = -1;
  function show(step) {
    renderAll(); // in case KaTeX arrived between mount and the first real step
    terms.forEach((tm, i) => {
      const to = tm.to == null ? Infinity : tm.to;
      const on = step >= tm.from && step <= to;
      spans[i].style.opacity = on ? '1' : '0';
      // highlight a term ONLY on the step it first appears (a one-step cross-fade emphasis).
      const justAppeared = on && tm.from === step && step !== lastStep;
      spans[i].classList.toggle(hiClass, justAppeared);
    });
    lastStep = step;
  }

  return { el, show, render: renderAll };
}
