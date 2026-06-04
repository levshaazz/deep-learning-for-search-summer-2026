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

    function register(key, handler, opts) {
      opts = opts || {};
      const keys = new Set((Array.isArray(key) ? key : [key]).map(norm));
      bindings.push({ keys, handler, shift: opts.shift == null ? null : !!opts.shift });
    }

    function matches(b, e) {
      if (!b.keys.has(norm(e.key))) return false;
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
        requestAnimationFrame(() => autoFitSlide(slide));
      }, true);
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
      onChange(fn) { state.onChange.push(fn); fn(state.current, slideAt(state.current)); },
      /* Re-fit a slide (default: the active one) after content grows/shrinks at
         runtime — e.g. a legacy answer reveal or a misconception flip. Native
         <details> are handled automatically via the toggle listener. */
      refit(slide) {
        const s = slide || slideAt(state.current);
        if (s) requestAnimationFrame(() => autoFitSlide(s));
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
      autoFitSlide(s);
      s.classList.remove('is-active');
    });
    active.forEach((s) => s.classList.add('is-active'));
    const cur = slideAt(state.current);
    if (cur) autoFitSlide(cur);
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
    if (['title','divider','quote','final','formula'].includes(type)) return;
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
      const s = Math.max(FLOOR, scale);
      body.style.transformOrigin = 'top left';
      body.style.transform = `scale(${s})`;
      body.style.width = (100 / s) + '%';
      slide.dataset.autoFit = s.toFixed(3);
      /* If the content WANTED to shrink below the floor, scaling stops at
         FLOOR and the excess is clipped by the slide's overflow:hidden —
         silently. Flag it so the pre-flight overlay can raise a visible
         ERROR (not just a density warning) telling the lecturer content is
         being cut off, not merely small. */
      if (scale < FLOOR) {
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
      autoFitSlide(cur);
      requestAnimationFrame(() => {
        autoFitSlide(cur);
        // Run a second pass after fonts/MathJax/Prism settle.
        setTimeout(() => autoFitSlide(cur), 300);
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
