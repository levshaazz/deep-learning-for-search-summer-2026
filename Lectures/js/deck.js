/* =========================================================
   DECK ENGINE — scaling, navigation, hash, overview, progress
   Vanilla JS. Exposes window.Lecture for slide content to hook.
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard — an accidental duplicate <script src="js/deck.js">
     must not re-init the deck or double-bind listeners. */
  if (window.__lec_deck) return;
  window.__lec_deck = 1;

  /* ---------------------------------------------------------------
     CENTRAL KEYBINDING REGISTRY — window.LectureKeys
     deck.js loads first, so it owns the single document keydown listener
     that every module registers shortcuts on. The listener ALWAYS skips
     when focus is in an editable control, and lets Space/Enter fall through
     to a focused interactive control (button / summary / link / quiz option),
     exactly as deck.js did before. register(key, handler, opts) where:
       key     — a string (case-insensitive single chars are matched on both
                 cases) or an array of strings, matched against e.key.
       handler — fn(e); if it returns false the key is treated as not-handled
                 (so e.g. the devil's-advocate key only preventDefaults when an
                 overlay is present on the current slide).
       opts    — { shift } require Shift; default: Shift must be UP for a match
                 unless the key itself is an uppercase letter or named key.
     The first matching handler that does not return false wins (no double
     handling); the listener then preventDefault()s for it.
     --------------------------------------------------------------- */
  const LectureKeys = (function () {
    const bindings = []; // { keys:Set<string>, handler, shift:bool|null }

    function norm(k) { return k.length === 1 ? k.toLowerCase() : k; }

    /* Layout-independent fallback: derive the Latin char from the PHYSICAL key
       (e.code) so single-letter / digit shortcuts (T, F, …) also fire on a
       non-Latin keyboard layout — on a Russian layout e.key is 'е' for the T
       key and never matches a 't' binding, but e.code stays 'KeyT'. Returns ''
       for non letter/digit codes so named keys keep matching on e.key only. */
    function codeChar(e) {
      const c = e.code || '';
      if (/^Key[A-Z]$/.test(c)) return c.slice(3).toLowerCase();   // KeyT -> t
      if (/^Digit[0-9]$/.test(c)) return c.slice(5);               // Digit5 -> 5
      return '';
    }

    function register(key, handler, opts) {
      opts = opts || {};
      const keys = new Set((Array.isArray(key) ? key : [key]).map(norm));
      bindings.push({ keys, handler, shift: opts.shift == null ? null : !!opts.shift });
    }

    function matches(b, e) {
      const cc = codeChar(e);
      if (!b.keys.has(norm(e.key)) && !(cc && b.keys.has(cc))) return false;
      /* Shift discrimination: if a binding declares opts.shift, honor it. For
         single-char letter bindings without an explicit shift opt, treat
         Shift-variants as the same key (e.key is already case-folded by norm)
         so 'v' and 'V' both fire — matching the old per-module handlers. */
      if (b.shift === true && !e.shiftKey) return false;
      if (b.shift === false && e.shiftKey) return false;
      return true;
    }

    function onKey(e) {
      const t = e.target;
      // Ignore when typing in an editable area.
      if (t && (t.isContentEditable || /input|textarea|select/i.test(t.tagName))) return;
      /* Enter / Space belong to whatever interactive control is focused — a
         quiz option, a <summary>, a button, a link, an e2e arch block. Let
         those keys fall through to the control; navigation keys still work. */
      if ((e.key === ' ' || e.key === 'Enter') && t && t.closest &&
          t.closest('button, [role="button"], summary, a[href], label, .quiz-option, [tabindex]:not([tabindex="-1"])')) {
        return;
      }
      for (const b of bindings) {
        if (!matches(b, e)) continue;
        const res = b.handler(e);
        if (res === false) continue; // handler declined — let another try
        e.preventDefault();
        return;
      }
    }

    document.addEventListener('keydown', onKey);
    return { register };
  })();
  window.LectureKeys = LectureKeys;

  const CANVAS_W = 1920;
  const CANVAS_H = 1080;

  const state = {
    slides: [],
    current: 0,
    overview: false,
    onChange: [],
    lastActive: -1, // index of the slide that last held is-active (for slide:leave)
  };

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  function init() {
    const deck = $('.deck');
    if (!deck) return;
    state.slides = $$('.slide', deck);
    state.slides.forEach((slide, i) => {
      // Label fallback
      if (!slide.dataset.screenLabel) {
        const n = String(i + 1).padStart(2, '0');
        const t = slide.dataset.type || 'slide';
        slide.dataset.screenLabel = `${n} ${t}`;
      }
      slide.dataset.index = i;
      slide.dataset.omValidate = 'true';
      // Wrap children so overview-shrink works (idempotent)
      wrapForOverview(slide);
      // Add slide frame chrome (if not divider/title/quote/final/formula)
      injectFrame(slide, i);
      // Wrap regular slide content in a .slide-body so we can auto-scale it
      wrapSlideBody(slide);
      slide.addEventListener('click', (e) => {
        if (state.overview) {
          e.preventDefault();
          goTo(i);
          toggleOverview(false);
        }
      });
      /* Drop .is-entering as soon as the enter animation finishes. Without
         this the class lingers, and when goTo() clears data-nav-dir at 600ms
         the directional rule (slideInRight/Left) stops matching while the base
         rule (.slide.is-entering → slideIn) starts: the changed animation-name
         re-fires a fresh slideIn, a visible ~12px judder ~600ms after every
         navigation. Removing the class at animationend means nothing is left
         to re-animate. (Guard on target+name so child animations don't trip it.) */
      slide.addEventListener('animationend', (e) => {
        if (e.target === slide && /^slideIn/.test(e.animationName)) {
          slide.classList.remove('is-entering');
        }
      });
      /* Re-fit when a <details> (hidden-answer) opens/closes. The reveal grows
         the content AFTER the slide's entry auto-fit ran, so without this the
         expanded answer overflows the slide's fixed bounds and gets clipped.
         `toggle` doesn't bubble — capture it on the slide. */
      slide.addEventListener('toggle', () => {
        requestAnimationFrame(() => { fitElementsIn(slide); autoFitSlide(slide); });
      }, true);
      /* A step change swaps in different content (a new formula / caption), so
         re-run the per-element fit (and global fit) for the new step. Mirrors
         the <details> refit above; reuses the existing slide:step event the
         engine already dispatches on ←/→ and stepper clicks. */
      slide.addEventListener('slide:step', () => {
        requestAnimationFrame(() => { fitElementsIn(slide); autoFitSlide(slide); });
      });
    });

    // Wire scale
    fit();
    window.addEventListener('resize', fit);

    // Hash routing
    const parsed = parseHash();
    state.current = clampIdx(parsed.slide);
    // Restore step state from the hash BEFORE the first render, so
    // applyStepVisibility() uses the deep-linked step (#/N/M).
    const initialSlide = slideAt(state.current);
    if (initialSlide && initialSlide.hasAttribute('data-max-step')) {
      const max = parseInt(initialSlide.dataset.maxStep, 10);
      initialSlide.dataset.currentStep = String(Math.min(max, parsed.step || 0));
    }
    render(false);

    /* hashchange fires for manual URL edits and anchor (`#/N`) clicks;
       popstate fires for browser Back/Forward. Both mean "the URL already
       holds the target" — so we sync state and render WITHOUT writing the
       hash again (render(false)), which would otherwise push duplicate
       history entries and break Back. */
    function onHashNav() {
      const p = parseHash();
      const newSlide = clampIdx(p.slide);
      const cur = slideAt(newSlide);
      /* Sync the step state BEFORE render so applyStepVisibility() applies
         the hash's step (deep-link / TOC / browser hash nav). */
      if (cur && cur.hasAttribute('data-max-step')) {
        const max = parseInt(cur.dataset.maxStep, 10);
        const newStep = String(Math.min(max, p.step || 0));
        if (cur.dataset.currentStep !== newStep) {
          cur.dataset.currentStep = newStep;
          cur.dispatchEvent(new CustomEvent('slide:step', {
            detail: { step: parseInt(newStep, 10), max },
          }));
        }
      }
      if (newSlide !== state.current) {
        state.current = newSlide;
        render(false);
      } else if (cur) {
        applyStepVisibility(cur);
      }
    }
    window.addEventListener('hashchange', onHashNav);
    window.addEventListener('popstate', onHashNav);

    // Keyboard — register deck navigation on the central registry.
    registerKeys();

    // In-slide step controls (walkthrough ←/→ buttons + counter).
    bindStepControls();

    // Touch
    bindTouch(deck);

    // postMessage out (speaker notes)
    notifyParent();

    // Toolbar handles
    window.Lecture = window.Lecture || {};
    Object.assign(window.Lecture, {
      goTo, next, prev, toggleOverview, slideAt,
      /* Re-fit EVERY slide, not just the active one. Printing needs this: the PDF
         path lays out all 51 slides at once, and a slide the viewer never visited
         was never auto-fitted, so overflowing content printed CLIPPED. */
      fitAll: fitAllSlides,
      onChange(fn) { state.onChange.push(fn); fn(state.current, slideAt(state.current)); },
      /* Re-fit a slide (default: the active one) after content grows/shrinks at
         runtime — e.g. a legacy answer reveal or a misconception flip. Native
         <details> are handled automatically via the toggle listener. */
      refit(slide) {
        const s = slide || slideAt(state.current);
        if (s) requestAnimationFrame(() => { fitElementsIn(s); autoFitSlide(s); });
      },
    });
    /* Live navigation state for the public API — accessors so reads always
       reflect the active slide. */
    Object.defineProperties(window.Lecture, {
      current: { get() { return state.current; }, configurable: true, enumerable: true },
      total:   { get() { return state.slides.length; }, configurable: true, enumerable: true },
      slides:  { get() { return state.slides; }, configurable: true, enumerable: true },
    });

    // Dispatch ready
    document.dispatchEvent(new CustomEvent('deck:ready', { detail: { total: state.slides.length } }));

    /* Hook KaTeX (and back-compat with MathJax): re-run auto-fit on the
       current slide whenever formulas finish typesetting. Formulas can
       grow content height after initial layout, so the early autoFit
       might miss the final size. */
    document.addEventListener('katex:done', fitAllSlides);
    if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
      window.MathJax.startup.promise.then(() => {
        document.dispatchEvent(new CustomEvent('katex:done'));
      }).catch(() => {});
    }
    /* Hook fonts.ready — slide layout depends on font metrics; the initial
       autoFit may run before fonts settle. Re-fit ALL slides (not just the
       current one) so the deck-wide data-auto-fit values are correct for
       the pre-flight density check regardless of which slide is active. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitAllSlides).catch(() => {});
    }
  }

  /* Re-measure & fit every slide. Used after KaTeX typesets and after fonts
     load — both can change content size. Each slide is measured IN ISOLATION
     (only it carries is-active during its own measurement) so the result
     matches what render() computes at navigation time. The old version left the
     genuinely-active slide is-active throughout the loop, so every other slide
     was measured with TWO active slides in the layout — yielding a slightly
     different scale than navigation (e.g. 0.858 vs 0.867), which showed up as a
     one-frame jump when you later deep-linked onto that slide. Runs in a single
     synchronous task, so toggling is-active causes no intermediate paint. */
  function fitAllSlides() {
    const active = state.slides.filter((s) => s.classList.contains('is-active'));
    active.forEach((s) => s.classList.remove('is-active'));
    state.slides.forEach((s) => {
      s.classList.add('is-active');
      fitElementsIn(s);
      autoFitSlide(s);
      s.classList.remove('is-active');
    });
    active.forEach((s) => s.classList.add('is-active'));
    const cur = slideAt(state.current);
    if (cur) { fitElementsIn(cur); autoFitSlide(cur); }
  }

  function slideAt(i) { return state.slides[i]; }

  function wrapForOverview(slide) {
    /* No-op at init — overview wrapping is done lazily on enter
       (see enterOverview / exitOverview). Reserved for future use. */
  }

  /* On entering overview, wrap each slide in a .slide-thumb container.
     Each thumb is the grid item that establishes a container-query
     context; CSS scales the slide inside via `cqw` units. */
  function enterOverview() {
    state.slides.forEach((slide, i) => {
      if (slide.parentElement && slide.parentElement.classList.contains('slide-thumb')) return;
      const thumb = document.createElement('div');
      thumb.className = 'slide-thumb';
      thumb.dataset.thumbFor = String(i);
      thumb.dataset.screenLabel = slide.dataset.screenLabel || '';
      if (i === state.current) thumb.classList.add('is-current');
      if (slide.dataset.skipped === 'true') thumb.classList.add('is-skipped');
      slide.parentNode.insertBefore(thumb, slide);
      thumb.appendChild(slide);
      thumb.addEventListener('click', () => {
        goTo(i);
        toggleOverview(false);
      });
    });
    /* Make every slide visible (their layout rules trigger on
       `.is-active`, so set the class universally while in overview). */
    state.slides.forEach((slide) => {
      slide.dataset.wasActive = slide.classList.contains('is-active') ? '1' : '0';
      slide.classList.add('is-active');
      slide.classList.remove('is-entering');
    });
  }

  function exitOverview() {
    /* Restore is-active on only the current slide */
    state.slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === state.current);
      delete slide.dataset.wasActive;
    });
    /* Unwrap thumb containers */
    state.slides.forEach((slide) => {
      const thumb = slide.parentElement;
      if (!thumb || !thumb.classList.contains('slide-thumb')) return;
      thumb.parentNode.insertBefore(slide, thumb);
      thumb.remove();
    });
  }

  function injectFrame(slide, i) {
    const type = slide.dataset.type;
    if (type === 'title' || type === 'divider' || type === 'quote' || type === 'final' || type === 'formula') {
      return; // these slides handle their own chrome
    }
    if (slide.querySelector(':scope > .slide__frame')) return;
    const frame = document.createElement('div');
    frame.className = 'slide__frame';
    frame.innerHTML = `
      <div class="slide__frame-top">
        <div class="slide__crumb">
          <span class="slide__crumb-dot"></span>
          <span class="slide__crumb-label" data-frame-section></span>
        </div>
        <div class="slide__logo-slot" data-logo-slot></div>
      </div>
      <div></div>
      <div class="slide__frame-bot">
        <div class="slide__crumb-label" data-frame-course></div>
        <div class="slide__pageno"><span data-pageno>${String(i + 1).padStart(2,'0')}</span> <span style="opacity:.4"> / </span> <span data-pagetotal>${String(state.slides.length).padStart(2,'0')}</span></div>
      </div>
    `;
    slide.appendChild(frame);
  }

  /* Wrap non-chrome children in a .slide-body div so we can apply
     auto-fit scaling on overflow. Idempotent. Skip layout-driven types. */
  function wrapSlideBody(slide) {
    const type = slide.dataset.type;
    /* `formula` is wrapped (unlike title/divider/quote/final): its layout is a
       TOP-aligned grid (`auto 1fr auto`), not `place-items:center`, so the
       global `autoFitSlide` (transform-origin top-left + width re-expand) scales
       it correctly without misaligning. Wrapping lets a tall formula slide (the
       b-dial: header + 280% math + caption + footnote ≈ 1325px) self-fit as a
       whole instead of overflowing freely past 1080. The grid itself is moved
       onto `.slide-body` via a CSS rule so the three-row layout is preserved.
       title/divider/quote/final stay OUT — they ARE center-laid-out and the
       top-left global scale would shove their centered content off-axis. */
    if (['title','divider','quote','final'].includes(type)) return;
    if (slide.querySelector(':scope > .slide-body')) return;

    const body = document.createElement('div');
    body.className = 'slide-body';

    /* Absolutely-positioned overlays (pen layer, devil's-advocate panel)
       stay out of .slide-body, so auto-fit measures only in-flow content. */
    const skipClasses = ['slide__frame', 'pen-layer', 'step-controls', 'devil-overlay'];
    const moves = [...slide.children].filter(c =>
      !skipClasses.some(cls => c.classList.contains(cls))
    );
    moves.forEach(c => body.appendChild(c));
    slide.insertBefore(body, slide.firstChild);
  }

  /* Measure .slide-body and scale it down if it overflows the slide's
     content area, on EITHER axis. Pixel-perfect — does not change
     font sizes. Honors `data-fit="off"` on the slide for opt-out. */
  function autoFitSlide(slide) {
    if (!slide) return;
    if (slide.dataset.fit === 'off') return;
    const body = slide.querySelector(':scope > .slide-body');
    if (!body) return;

    // Reset prior scaling so we re-measure intrinsic size.
    body.style.transform = '';
    body.style.transformOrigin = '';
    body.style.width = '';
    body.style.height = '';
    void body.offsetHeight;

    const cs = getComputedStyle(slide);
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const availH = CANVAS_H - padT - padB;
    const availW = CANVAS_W - padL - padR;
    const bodyH = body.scrollHeight;
    const bodyW = body.scrollWidth;

    const scaleH = bodyH > availH + 2 ? availH / bodyH : 1;
    const scaleW = bodyW > availW + 2 ? availW / bodyW : 1;
    const scale = Math.min(scaleH, scaleW);

    if (scale < 1) {
      const FLOOR = 0.5;
      let s = Math.max(FLOOR, scale);
      body.style.transformOrigin = 'top left';

      /* The first estimate is measured at the body's NATURAL width, but applying it also
         re-expands the body to 100/s % — a WIDER column, in which prose re-wraps into fewer
         lines and the content becomes substantially shorter than the estimate assumed. The
         old single-pass code shipped that stale estimate, so text-heavy slides were scaled
         to ~0.61 while their content actually fit at ~0.85: tiny type floating above a band
         of empty slide. (It also made trimming feel useless — cutting two lines of prose
         moved the printed auto-fit by nothing, because the number never described the
         rendering anyone was looking at.)

         So converge instead. renderedHeight(s) = scrollHeight(at width 100/s) × s is
         monotonically increasing in s, so the fixed-point step s ← availH / h(s) walks up
         to the largest scale that still fits, in 2–3 layouts. The final guard shrinks back
         if we overshot: fitting is not negotiable, filling the frame is the bonus. */
      const apply = (v) => {
        body.style.transform = `scale(${v})`;
        body.style.width = (100 / v) + '%';
        void body.offsetHeight;
      };
      apply(s);
      for (let i = 0; i < 3 && s < 1; i++) {
        const h = body.scrollHeight;                 // unscaled height at the CURRENT width
        if (!h) break;
        const next = Math.min(1, Math.max(FLOOR, availH / h));
        if (Math.abs(next - s) < 0.005) break;       // converged
        s = next;
        apply(s);
      }
      /* Overshoot guard: never leave content past the frame on EITHER axis (overflow:hidden
         clips it). Width matters as much as height here — the convergence above only chases
         height, so on a slide where WIDTH was the binding constraint (a wide table) it could
         otherwise walk the scale up past what the width allows. */
      for (let i = 0; i < 5 && s > FLOOR; i++) {
        const overH = body.scrollHeight * s > availH + 2 ? availH / (body.scrollHeight * s) : 1;
        const overW = body.scrollWidth * s > availW + 2 ? availW / (body.scrollWidth * s) : 1;
        const k = Math.min(overH, overW);
        if (k >= 1) break;
        s = Math.max(FLOOR, s * k);
        apply(s);
      }
      slide.dataset.autoFit = s.toFixed(3);
      /* If the content WANTED to shrink below the floor, scaling stops at
         FLOOR and the excess is clipped by the slide's overflow:hidden —
         silently. Flag it so the pre-flight overlay can raise a visible
         ERROR (not just a density warning) telling the lecturer content is
         being cut off, not merely small. */
      /* Judge CLIPPING on the CONVERGED render, not on the first estimate: a slide whose
         naive estimate lands under the floor usually fits comfortably once the wider column
         re-wraps it, and flagging that as "being cut off" would cry wolf on healthy slides. */
      if (s <= FLOOR + 1e-6 && body.scrollHeight * s > availH + 2) {
        slide.dataset.autoFitClipped = 'true';
        console.error(
          `[deck] Slide ${(slide.dataset.index | 0) + 1} (${slide.dataset.type})`,
          `content overflows even at the ${FLOOR}× floor — it is being CLIPPED.`,
          `Split this slide.`
        );
      } else {
        delete slide.dataset.autoFitClipped;
        if (s < 0.65) {
          console.warn(
            `[deck] Slide ${(slide.dataset.index | 0) + 1} (${slide.dataset.type})`,
            `auto-fit ${s.toFixed(2)}× — content is unusually dense; consider splitting.`
          );
        }
      }
    } else {
      delete slide.dataset.autoFit;
      delete slide.dataset.autoFitClipped;
    }
  }

  /* -------------------------------------------------------------------------
     PER-ELEMENT FIT-BOX — shrink ONE element to fit the box it is allowed to
     occupy, instead of shrinking the whole slide. This is the local lever that
     keeps the global `autoFitSlide` from firing (and making the WHOLE slide
     "too small") just because a single formula or caption is intrinsically too
     tall: that one element self-fits, everything else stays at 1.0.

     Mechanics: measure the element's own overflow (`scrollHeight/scrollWidth`
     vs `clientHeight/clientWidth` — i.e. does its CONTENT exceed its box). If it
     does, scale the element down with `transform`, origin `top center` (so it
     stays horizontally centered and grows upward from its top edge, matching how
     these stage/formula boxes are laid out). Floor at 0.7 — below that the math
     would be illegible, so we stop and let the content sit (the global fit /
     pre-flight still catches a genuine must-split). A NO-OP when the element
     already fits: it clears any prior transform and returns, so the ~275 slides
     that don't overflow are byte-for-byte unchanged.

     `el.dataset.fitBox = 'off'` opts a single element out. */
  const FITBOX_FLOOR = 0.7;
  /* Only fire on a GENUINE overflow, not the few-px `scrollHeight` slack that
     line-height / glyph-descender metrics give a KaTeX box that is visually
     fine (e.g. an `.e2e-step .step-formula` reports content 69 > box 62 yet
     paints inside its panel). Matching the visual-gate's own TEXTCLIP threshold
     (+8px) means fitToBox shrinks a box only when the gate would itself call it
     clipped — so it stays a true NO-OP on every box that merely has metric slack
     (verified: the e2e step-formulas that overflow by 7-9px are left at 1.0),
     while still catching the real cases (the b-dial overflows by hundreds of
     px). */
  const FITBOX_SLACK = 10;
  /* Flag the owning slide that a LOCAL per-element fitter (fitToBox / fitContainer)
     hit the FITBOX_FLOOR (0.7×) and is CLIPPING the remainder inside its box. The
     slide-level global fit (autoFitSlide) never fires for this case — the box grows
     to fit its own content, only its INTERNAL content overflows the fixed box — so
     without this flag the clip is completely invisible (no data-auto-fit-clipped, no
     visible shrink). Mirrors autoFitSlide's data-auto-fit-clipped. Records the LOWEST
     wanted scale across the slide's boxes in data-fit-clip-scale. SET-ONLY: the flag
     is cleared once per pass at the top of fitElementsIn() so several boxes on one
     slide don't race to clear each other's mark. */
  function markFitClipped(el, wanted) {
    const slide = el.closest && el.closest('.slide');
    if (!slide) return;
    slide.dataset.fitClipped = 'true';
    const prev = parseFloat(slide.dataset.fitClipScale);
    if (!Number.isFinite(prev) || wanted < prev) {
      slide.dataset.fitClipScale = wanted.toFixed(3);
    }
  }
  function fitToBox(el) {
    if (!el || el.dataset.fitBox === 'off') return;
    // Clear prior fit so we re-measure intrinsic size.
    if (el.dataset.fitScale) {
      el.style.transform = '';
      el.style.transformOrigin = '';
      delete el.dataset.fitScale;
      void el.offsetHeight;
    }
    // Content vs box on each axis. The slack ignores sub-line metric overflow.
    const overH = el.scrollHeight > el.clientHeight + FITBOX_SLACK
      ? el.clientHeight / el.scrollHeight : 1;
    const overW = el.scrollWidth > el.clientWidth + FITBOX_SLACK
      ? el.clientWidth / el.scrollWidth : 1;
    const raw = Math.min(overH, overW);
    if (raw >= 1) return; // fits — leave at 1.0 (no-op)
    const s = Math.max(FITBOX_FLOOR, raw);
    el.style.transformOrigin = 'top center';
    el.style.transform = `scale(${s})`;
    el.dataset.fitScale = s.toFixed(3);
    /* Wanted below the floor → scaling stopped at FITBOX_FLOOR and the remainder
       is CLIPPED inside this (often overflow:hidden) box — silently, because the
       slide-level global autoFitSlide never fires here. Flag the owning slide so
       pre-flight raises a visible ERROR (see markFitClipped). */
    if (raw < FITBOX_FLOOR) markFitClipped(el, raw);
  }

  /* -------------------------------------------------------------------------
     PER-ELEMENT FIT-CONTAINER — the NON-formula sibling of fitToBox. Where
     fitToBox handles a box whose CONTENT overflows a height-CONSTRAINED box
     (the formula `1fr` grid row / e2e panel), fitContainer handles the
     overflow-prone LAYOUT CONTAINERS of ordinary slides — a tall/wide
     comparison `table.cmp-table`, a tall `.twocol` grid, a long `.walk-flow`
     step ledger. These grow to fit their own content (scrollHeight ==
     clientHeight), so the content-vs-box test never fires for them; the only
     thing that overflows is the SLIDE, which today triggers the whole-slide
     global `autoFitSlide` ("everything too small"). fitContainer instead
     shrinks JUST that one box so the body fits — the header and every other
     block stay at 1.0×.

     Why this needs more than a bare transform: a CSS `transform: scale()` only
     repaints; it does NOT shrink the element's LAYOUT height, so `.slide-body`
     `scrollHeight` is unchanged and the global fit would still fire. So we also
     pin the element's box to its SCALED height (`height = natH·s`) — origin
     top-left, with the `width:(100/s)%` re-expand that mirrors autoFitSlide so
     the box refills its row instead of leaving a right gap. The scaled paint
     exactly fills the pinned box (no clipping), and the body now reflows
     shorter. A `<table>` ignores a `height` smaller than its content, so a
     table is wrapped once (idempotently) in a `.fit-cwrap` block that DOES
     honour the pinned height; the `table.cmp-table` element itself is
     untouched (the visual-gate's `table.cmp-table` contract still holds).

     Anchored at the container's TOP within the body, so only the room BELOW the
     header is claimed (localAvailH = availH − offsetTop). Floors at the same
     0.7 as fitToBox. STRICT NO-OP when the box already fits its room: it clears
     any prior pin/transform and returns — so every already-fitting slide stays
     byte-for-byte identical. `el.dataset.fitBox = 'off'` opts out. */
  function clearContainerFit(el) {
    if (!el.dataset.fitScale) return;
    const host = el.dataset.fitWrapped === '1' ? el.parentElement : el;
    if (host) {
      host.style.transform = '';
      host.style.transformOrigin = '';
      host.style.width = '';
      host.style.height = '';
    }
    /* Unwrap a previously-added table wrapper so re-measurement sees the
       intrinsic, untransformed table (and the DOM returns to its original
       shape when the box no longer overflows). */
    if (el.dataset.fitWrapped === '1' && host && host.classList.contains('fit-cwrap')) {
      host.parentNode.insertBefore(el, host);
      host.remove();
      delete el.dataset.fitWrapped;
    }
    delete el.dataset.fitScale;
  }
  function fitContainer(el) {
    if (!el || el.dataset.fitBox === 'off') return;
    /* A container that lives INSIDE a fitToBox target (e.g. a `.cmp-table`
       composed into a centered `.formula-stage` on a formula-type slide) is
       already governed by that box's fit; the slide-relative top-left maths
       below assume a normal top-anchored body child, so double-fitting it
       over-shrinks and mildly worsens the global scale. Skip those — the
       parent fitToBox + global fit handle the composition. */
    if (el.closest('.formula-stage, .step-formula, .fit-box')) return;
    const slide = el.closest('.slide');
    const body = slide && slide.querySelector(':scope > .slide-body');
    if (!body) return;
    // Reset any prior fit so we re-measure the intrinsic (unscaled) size.
    clearContainerFit(el);
    void el.offsetHeight;

    // Available slide content area (mirrors autoFitSlide's padding maths).
    const cs = getComputedStyle(slide);
    const availH = CANVAS_H - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    const availW = CANVAS_W - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);

    // Distance from the body's top to the element's top (header + gaps above).
    let top = 0;
    for (let n = el; n && n !== body; n = n.offsetParent) top += n.offsetTop;
    const localAvailH = availH - top;
    if (localAvailH < 80) return; // no usable room below the header — leave to global fit

    const natH = el.scrollHeight;
    const natW = el.scrollWidth;
    const sH = natH > localAvailH + FITBOX_SLACK ? localAvailH / natH : 1;
    const sW = natW > availW + FITBOX_SLACK ? availW / natW : 1;
    const raw = Math.min(sH, sW);
    if (raw >= 1) return; // already fits its room — true no-op (DOM untouched)
    const s = Math.max(FITBOX_FLOOR, raw);

    /* A CSS table won't accept a height below its content, so scale a wrapper
       block instead. Created lazily, reused on later fits, removed on no-op. */
    let host = el;
    if (getComputedStyle(el).display.startsWith('table')) {
      const wrap = document.createElement('div');
      wrap.className = 'fit-cwrap';
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
      el.dataset.fitWrapped = '1';
      host = wrap;
    }
    host.style.transformOrigin = 'top left';
    host.style.transform = `scale(${s})`;
    host.style.width = (100 / s) + '%';
    host.style.height = (natH * s) + 'px';
    el.dataset.fitScale = s.toFixed(3);
    /* Below the floor → the container's overflow is CLIPPED at FITBOX_FLOOR; flag
       the owning slide (see fitToBox / autoFitSlide) so pre-flight surfaces it. */
    if (raw < FITBOX_FLOOR) markFitClipped(el, raw);
  }

  /* Run the per-element fit on every opt-in `.fit-box` plus the auto-targeted
     formula/step math on a slide, BEFORE the global slide fit. Returns nothing;
     purely mutates inline transforms. Cheap + idempotent. The container
     targets (table/two-col/walkthrough ledger) self-fit LOCALLY so a single
     dense box no longer drags the whole slide into the global shrink. */
  function fitElementsIn(slide) {
    if (!slide) return;
    /* Recompute local-fit clipping fresh each pass: clear the slide-level flag
       BEFORE the per-element fitters run, so a box that no longer clips (content
       edited, step changed, fonts/KaTeX settled) drops the flag. The fitters only
       ever SET it — never clear — so several boxes on one slide can't race to
       clear each other. Mirrors how autoFitSlide clears data-auto-fit-clipped. */
    delete slide.dataset.fitClipped;
    delete slide.dataset.fitClipScale;
    slide.querySelectorAll('.fit-box, .formula-stage, .step-formula').forEach(fitToBox);
    /* Container fits are scoped to the slide TYPE whose layout is the simple
       top-anchored body flow fitContainer's slide-relative maths assume
       (header on top, the one box stacked below). On those types the box is
       the canonical self-contained content element. We deliberately do NOT
       chase a `.cmp-table` that a `formula`/other slide composes into a
       different layout (a grid `1fr` row, a centered stage): there the
       top-anchored localAvailH is wrong and a local shrink double-scales
       against the global fit, mildly worsening it (verified on L3:s33). */
    const t = slide.dataset.type;
    if (t === 'table') slide.querySelectorAll('.cmp-table').forEach(fitContainer);
    if (t === 'two-col') slide.querySelectorAll('.twocol').forEach(fitContainer);
    if (t === 'walkthrough') slide.querySelectorAll('.walk-flow').forEach(fitContainer);
  }

  function fit() {
    const stage = $('.stage');
    if (!stage) return;
    if (state.overview) { stage.style.transform = ''; return; }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const raw = Math.min(vw / CANVAS_W, vh / CANVAS_H);
    // Math.floor to 4 decimals — sub-pixel rounding sometimes lets the
    // bottom/right edge clip when the browser rounds DOWN on its own.
    const scale = Math.floor(raw * 10000) / 10000;
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  function parseHash() {
    /* `#/N` → slide N (1-indexed). `#/N/M` → slide N, step M.
       Returns { slide, step } both 0-indexed. */
    const m = location.hash.match(/^#\/?(\d+)(?:\/(\d+))?/);
    if (m) {
      return {
        slide: parseInt(m[1], 10) - 1,
        step: m[2] ? parseInt(m[2], 10) : 0,
      };
    }
    return { slide: 0, step: 0 };
  }

  /* writeHash(push): push a NEW history entry for slide changes (so browser
     Back/Forward steps through visited slides), or replace in place for
     within-slide step changes / non-user renders. */
  function writeHash(push) {
    const cur = slideAt(state.current);
    let h = '#/' + (state.current + 1);
    if (cur && cur.hasAttribute('data-max-step')) {
      const step = parseInt(cur.dataset.currentStep || '0', 10);
      if (step > 0) h += '/' + step;
    }
    if (location.hash === h) return;
    if (push) history.pushState(null, '', h);
    else history.replaceState(null, '', h);
  }

  function clampIdx(i) {
    return Math.max(0, Math.min(state.slides.length - 1, i | 0));
  }

  function render(updateHash) {
    /* slide:leave for the slide we're navigating AWAY from. Emitted BEFORE
       is-active flips so listeners can read the outgoing state. Only when the
       target slide actually differs (step-only renders don't leave). */
    const leaving = (state.lastActive >= 0 && state.lastActive !== state.current)
      ? state.slides[state.lastActive] : null;
    if (leaving) leaving.dispatchEvent(new CustomEvent('slide:leave'));

    state.slides.forEach((s, i) => {
      const active = i === state.current;
      s.classList.toggle('is-active', active);
      if (active) {
        s.classList.remove('is-entering');
        // restart animation
        void s.offsetWidth;
        s.classList.add('is-entering');
      }
    });
    /* Step state — default to 0 if unset. A hash nav (#/N/M) has already set
       currentStep before render() runs (see onHashNav / init). */
    const cur = slideAt(state.current);
    if (cur && cur.hasAttribute('data-max-step')) {
      if (!cur.dataset.currentStep) cur.dataset.currentStep = '0';
    }
    /* Per-type feature reset on RE-ENTRY (only when the active slide actually
       changed). Runs BEFORE writeHash (so the URL matches the rendered step) and
       BEFORE applyStepVisibility. A deep-link / hash navigation that targets THIS
       slide with an explicit step (#/N/M) is honored — `keepStep` preserves it;
       a plain engine-driven re-entry resets to the type's default. We read
       location.hash to tell them apart: for goTo() the hash here still points at
       the PREVIOUS slide (→ reset), while hashchange / popstate / initial
       deep-links already point at the new target with its step (→ keep). */
    const isReEnter = cur && state.lastActive !== state.current;
    if (isReEnter) {
      const ph = parseHash();
      const keepStep = ph.slide === state.current && ph.step > 0;
      resetSlideFeatures(cur, keepStep);
    }
    if (updateHash === 'push') {
      writeHash(true);
    } else if (updateHash !== false) {
      writeHash(false);
    }
    // Apply step visibility (replaces the old hardcoded CSS cascade —
    // works for any number of steps).
    if (cur) applyStepVisibility(cur);
    // Reset quiz + hidden-answer reveals when entering a slide.
    if (cur) {
      cur.querySelectorAll('.quiz-option').forEach((opt) => {
        opt.classList.remove('is-revealed', 'is-correct', 'is-wrong');
        opt.removeAttribute('aria-pressed');
        opt.removeAttribute('aria-disabled');
      });
      cur.querySelectorAll('.quiz-options.is-solved').forEach((g) => g.classList.remove('is-solved'));
      cur.querySelectorAll('.hidden-answer.is-revealed').forEach((ha) => {
        ha.classList.remove('is-revealed');
      });
      /* Native <details> reveals are tracked by the `open` attribute, not a
         class — close them too so a revealed answer doesn't persist when the
         lecturer navigates away and back to the slide. */
      cur.querySelectorAll('details.hidden-answer[open]').forEach((d) => {
        d.removeAttribute('open');
      });
    }
    /* slide:enter — emitted AFTER step visibility/resets are applied so
       feature modules (lab.js, e2e.js) repaint from the fresh state. Only on
       genuine re-entry (active slide changed) so in-slide steppers/deep-links
       aren't clobbered. This is the single source of truth for the
       enter/leave lifecycle — lab.js and e2e.js are CONSUMERS. */
    if (isReEnter) cur.dispatchEvent(new CustomEvent('slide:enter'));
    state.lastActive = state.current;
    /* Auto-fit overflowing content. The FIRST pass runs SYNCHRONOUSLY — before
       the browser paints this slide — so the content is already at its final
       scale when the enter animation begins. Deferring the only fit to rAF (the
       old behavior) let a dense slide paint at the previous / 1.0× scale for one
       frame and then snap to the fitted scale: a visible ~1px "jump" on every
       switch. slide:enter has already fired synchronously above, so feature
       modules (lab/e2e) have repainted and the measurement is final. The rAF +
       300ms passes stay as a safety net for late layout (web-font swap, KaTeX)
       and recompute the same scale → no further visible change. */
    if (cur) {
      fitElementsIn(cur);    // local per-element shrink first…
      autoFitSlide(cur);     // …then global shrink only if still overflowing.
      requestAnimationFrame(() => {
        fitElementsIn(cur);
        autoFitSlide(cur);
        // Run a second pass after fonts/MathJax/Prism settle.
        setTimeout(() => { fitElementsIn(cur); autoFitSlide(cur); }, 300);
      });
    }
    notifyParent();
    state.onChange.forEach((fn) => { try { fn(state.current, cur); } catch (e) { console.warn(e); } });
  }

  function goTo(i) {
    const next = clampIdx(i);
    if (next === state.current) return;
    /* Set data-nav-dir on the deck so CSS can pick a directional
       enter-animation. Cleared on the next frame so it doesn't affect
       subsequent renders that aren't user-driven navigation. */
    const deck = $('.deck');
    if (deck) {
      deck.dataset.navDir = next > state.current ? 'next' : 'prev';
      setTimeout(() => { if (deck.dataset.navDir) delete deck.dataset.navDir; }, 600);
    }
    state.current = next;
    render('push');
  }

  function next() {
    const cur = slideAt(state.current);
    // If slide has steps, advance step before slide
    if (cur && cur.hasAttribute('data-max-step')) {
      const max = parseInt(cur.dataset.maxStep, 10);
      const step = parseInt(cur.dataset.currentStep || '0', 10);
      if (step < max) {
        cur.dataset.currentStep = String(step + 1);
        applyStepVisibility(cur);
        cur.dispatchEvent(new CustomEvent('slide:step', { detail: { step: step + 1, max } }));
        writeHash();
        return;
      }
    }
    goTo(state.current + 1);
  }

  function prev() {
    const cur = slideAt(state.current);
    if (cur && cur.hasAttribute('data-max-step')) {
      const step = parseInt(cur.dataset.currentStep || '0', 10);
      if (step > 0) {
        cur.dataset.currentStep = String(step - 1);
        applyStepVisibility(cur);
        cur.dispatchEvent(new CustomEvent('slide:step', { detail: { step: step - 1, max: parseInt(cur.dataset.maxStep, 10) } }));
        writeHash();
        return;
      }
    }
    goTo(state.current - 1);
  }

  /* Reset interactive/feature state when a slide is RE-ENTERED, so re-showing
     the lecture (or navigating away+back) doesn't leak prior progress. This
     mirrors the misconception/derivation resets that lab.js already does via
     its slide:enter listeners — kept here in the engine so the contract holds
     even in the presenter window (where lab.js/e2e.js bail out). Feature
     modules (lab.js, e2e.js) remain free to do their OWN extra resets on
     slide:enter; this only touches generic state-bearing attributes/classes. */
  function resetSlideFeatures(slide, keepStep) {
    /* Counterfactual toggles → snap back to the initial variant. */
    slide.querySelectorAll('.cf-toggle-bar').forEach((bar) => {
      const group = bar.dataset.cfGroup;
      const buttons = [...bar.querySelectorAll('button')];
      const initial = bar.dataset.cfInitial || buttons[0]?.dataset.cfValue;
      if (initial == null) return;
      buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.cfValue === initial));
      slide.querySelectorAll(`.cf-variant[data-cf-group="${group}"]`).forEach((v) => {
        v.classList.toggle('is-active', v.dataset.cfValue === initial);
      });
    });
    /* Layer-stack reveal (reverse + forward types) → restart at narrative
       step 0. Both directions use step 0 as the entry state; lab.js's paint()
       maps it to the right layer (reverse → final result, forward → input).
       Skipped when keepStep — a deep-link (#/N/M) provided an explicit step. */
    if (slide.querySelector('.reverse-stack') && slide.hasAttribute('data-max-step')) {
      if (!keepStep) slide.dataset.currentStep = '0';
    }
    /* e2e walkthrough → rewind to step 0 (unless a deep-link pinned a step),
       and ALWAYS clear the backtrack flag / re-hide numeric panels (those are
       transient per-enter state, not part of the deep-linkable step). */
    if (slide.dataset.type === 'e2e') {
      if (!keepStep) slide.dataset.currentStep = '0';
      slide.dataset.backtracked = 'false';
      slide.dataset.hideNumeric = 'false';
      const tgl = slide.querySelector('.e2e-toggle');
      if (tgl) tgl.classList.remove('is-on');
    }
  }

  /* Apply .is-step-hidden to every [data-step] above the slide's current
     step. Supports any number of steps. */
  function applyStepVisibility(slide) {
    if (!slide.hasAttribute('data-max-step')) return;
    const cur = parseInt(slide.dataset.currentStep || '0', 10);
    slide.querySelectorAll('[data-step]').forEach((el) => {
      const n = parseInt(el.getAttribute('data-step'), 10);
      el.classList.toggle('is-step-hidden', n > cur);
    });
    /* Step-synced diagram highlight: any element with data-arch-step="k"
       is tagged current/past/future for the active step, so a hand-drawn
       inline-SVG (or DOM) architecture lights up in lock-step with the
       ledger. Pure class toggle — styling lives in css/slides.css, works
       for any number of steps, no per-slide JS. */
    slide.querySelectorAll('[data-arch-step]').forEach((el) => {
      const n = parseInt(el.getAttribute('data-arch-step'), 10);
      el.classList.toggle('is-arch-current', n === cur);
      el.classList.toggle('is-arch-past', n < cur);
      el.classList.toggle('is-arch-future', n > cur);
    });
  }

  /* In-slide step controls — the walkthrough's .step-controls bar with
     [data-step-act="prev"/"next"] buttons and a .step-counter. Migrated here
     from the (now removed) js/interactive.js so it shares the engine's stepping
     logic: clicking a button changes the slide's currentStep AND calls
     applyStepVisibility (the old standalone version dispatched slide:step but
     never toggled .is-step-hidden), writes the hash, and dispatches slide:step
     so other consumers (presenter, e2e, lab) react. The counter re-syncs on
     every slide:step — so it tracks the keyboard ←/→ arrows too. */
  function bindStepControls() {
    $$('.step-controls').forEach((sc) => {
      if (sc.dataset.bound) return;
      sc.dataset.bound = '1';
      const slide = sc.closest('.slide');
      if (!slide) return;
      const max = parseInt(slide.dataset.maxStep || '0', 10);
      const prevBtn = sc.querySelector('[data-step-act="prev"]');
      const nextBtn = sc.querySelector('[data-step-act="next"]');
      const counter = sc.querySelector('.step-counter');

      function update() {
        const step = parseInt(slide.dataset.currentStep || '0', 10);
        if (counter) counter.textContent = `${step}/${max}`;
        if (prevBtn) prevBtn.disabled = step <= 0;
        if (nextBtn) nextBtn.disabled = step >= max;
      }
      function stepTo(step) {
        slide.dataset.currentStep = String(step);
        applyStepVisibility(slide);
        slide.dispatchEvent(new CustomEvent('slide:step', { detail: { step, max } }));
        if (slide === slideAt(state.current)) writeHash();
        update();
      }
      prevBtn && prevBtn.addEventListener('click', () => {
        const step = parseInt(slide.dataset.currentStep || '0', 10);
        if (step > 0) stepTo(step - 1);
      });
      nextBtn && nextBtn.addEventListener('click', () => {
        const step = parseInt(slide.dataset.currentStep || '0', 10);
        if (step < max) stepTo(step + 1);
      });
      // Keep the counter/buttons in sync with keyboard arrows (which step
      // through deck.next()/prev() and dispatch slide:step).
      slide.addEventListener('slide:step', update);
      update();
    });
  }

  /* Register deck navigation shortcuts on the central registry. The
     Space/Enter fall-through to focused controls is handled centrally by
     LectureKeys before any handler runs. */
  function registerKeys() {
    LectureKeys.register(['ArrowRight', 'PageDown', ' ', 'Enter'], () => next());
    LectureKeys.register(['ArrowLeft', 'PageUp', 'Backspace'], () => prev());
    LectureKeys.register('Home', () => goTo(0));
    LectureKeys.register('End', () => goTo(state.slides.length - 1));
    LectureKeys.register(['o', 'Escape'], (e) => {
      // Escape only acts when overview is open; otherwise decline.
      if (e.key === 'Escape' && !state.overview) return false;
      toggleOverview();
    });
  }

  // Touch — simple swipe
  function bindTouch(deck) {
    let startX = 0, startY = 0, startT = 0;
    deck.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; startT = Date.now();
    }, { passive: true });
    deck.addEventListener('touchend', (e) => {
      const t = (e.changedTouches && e.changedTouches[0]); if (!t) return;
      const dx = t.clientX - startX, dy = t.clientY - startY, dt = Date.now() - startT;
      if (dt > 700) return;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) next(); else prev();
      }
    }, { passive: true });
  }

  // Overview mode
  function toggleOverview(force) {
    const deck = $('.deck');
    const want = (force === undefined) ? !state.overview : !!force;
    if (want === state.overview) return;
    state.overview = want;
    if (want) {
      enterOverview();
      deck.classList.add('is-overview');
    } else {
      deck.classList.remove('is-overview');
      exitOverview();
      fit();
    }
    /* Scroll active thumbnail into view in overview */
    if (want) {
      setTimeout(() => {
        const cur = $('.slide-thumb.is-current');
        if (cur && cur.scrollIntoView) {
          cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 60);
    }
  }

  function notifyParent() {
    try {
      /* Notify an embedding parent of slide changes, scoped to our origin
         ('*' only for file://, whose origin is "null"). */
      const target = (location.origin && location.origin !== 'null') ? location.origin : '*';
      window.parent.postMessage({ slideIndexChanged: state.current }, target);
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', init);
})();
