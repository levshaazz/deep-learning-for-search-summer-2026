/* _widget-base.js — the shared "explainable unit" factory.

   WHY: every widget repeats the same boilerplate — the `wgt-root`/`wgt-fade` host setup, the
   trailing `.wgt-caption` + `.wgt-counter` scaffold, the `setStep(k)` clamp + `host.dataset.step`
   bookkeeping, the caption/counter text loop, an `el()`/`svg()` namespaced builder, an `esc()`
   HTML escaper, ad-hoc number `fmt()`, and the `window.mount<Pascal>` registration. `defineWidget`
   owns all of it so each widget's `render(ctx)` only draws its figure-specific layers.

   DRIVER CONTRACT (unchanged): the returned mount function is
     mount<Pascal>(host, { data, labels }) -> { setStep(k), get step, get maxStep, root }
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). Caption text comes from labels['s'+k]; the counter shows
   "k / maxStep". The host gets classes wgt-root + <rootClass> + wgt-fade, is cleared, and the
   caption/counter are appended LAST (after render()'s layers) — byte-identical to the hand-rolled
   widgets, so migrating a widget keeps its rendered DOM the same.

   USAGE:
     import { defineWidget } from '../_widget-base.js';
     export const mountInvertedIndex = defineWidget({
       id: 'inverted-index',     // manifest.id — also derives the default rootClass (ix? no: 'inverted-index-root')
       rootClass: 'ix-root',     // optional override (most widgets use a short namespace)
       maxStep: 3,
       render(ctx) {
         // ctx: { host, data, labels, el, svg, esc, fmt, maxStep }
         // ...build figure layers on ctx.host...
         return (step) => { ...per-step update; step is already clamped to [0..maxStep]... };
       },
     });

   render() may either (a) return an `update(step)` callback that the factory calls on every
   setStep, or (b) handle stepping itself and return nothing (back-compat escape hatch). The
   caption + counter are managed by the factory unless `scaffold:false` is set.

   ESCAPE HATCH (minimal & general — for widgets whose hand-rolled DOM predates the standard
   scaffold; default values reproduce the original behavior exactly, so existing widgets are
   untouched):
     • bareRoot   — when true, the host carries ONLY `rootClass` (no `wgt-root`, no `wgt-fade`),
                    for widgets that own their host class entirely. Default false.
     • scaffold   — when false, the factory does NOT append `.wgt-caption`/`.wgt-counter` and does
                    NOT manage their text; render()'s update(step) owns the whole per-step DOM
                    (its own caption/counter included). Default true.
     • extra mount args — anything beyond { data, labels } passed to mount(host, {...}) is spread
                    onto `ctx`, so render(ctx) can read e.g. ctx.pairId. */

const SVGNS = 'http://www.w3.org/2000/svg';

// createElementNS(SVG) builder with the (tag, attrs, parent) signature used across the widgets.
function svgEl(tag, attrs, parent) {
  const n = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// HTML-escape for the three ampersand-class characters (matches every widget's local esc()).
export function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Number formatter: fmt(n) → integers stay bare; floats round to `digits` (default 6) places, no
// trailing-zero trimming (so it matches rrf-fusion's toFixed(6)). Non-numbers → ''.
export function fmt(n, digits = 6) {
  if (typeof n !== 'number' || !isFinite(n)) return '';
  return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

// PascalCase mount-fn name from a kebab id (same rule as widgets/deck-adapter.js mountName()).
export function mountName(id) {
  return 'mount' + String(id).split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

/* defineWidget — returns the standard mount<Pascal>(host,{data,labels}) function and, in a browser,
   registers it on window under `exportName` (falling back to mountName(id)). */
export function defineWidget({ id, maxStep, render, rootClass, exportName, fade = true,
                               bareRoot = false, scaffold = true }) {
  const MAX = maxStep;
  const cls = rootClass || `${id}-root`;

  function mount(host, { data, labels = {}, ...rest } = {}) {
    if (bareRoot) {
      host.classList.add(cls);                 // widget owns the host class outright
    } else {
      host.classList.add('wgt-root', cls);
      if (fade) host.classList.add('wgt-fade');
    }
    host.innerHTML = '';

    /* THE LABEL MAP IS ONE OBJECT FOR THE WIDGET'S WHOLE LIFE — mutated in place on a language
       switch, NEVER replaced. This shape is load-bearing: render() closes over `ctx.labels`, so
       handing it a fresh object on a switch would leave every label render() drew frozen at the
       language the widget booted in. That is exactly the bug this used to have — the deck flips
       `data-lang`, the caption followed, and the figure silently did not. */
    const base = { ...labels };            // non-step keys (alt/role/…) — they survive every swap
    const active = labels;                 // === ctx.labels, BY IDENTITY. Do not reassign.
    const i18nAll = (rest && rest.i18nAll && typeof rest.i18nAll === 'object') ? rest.i18nAll : null;

    // Extra mount args (e.g. pairId) are spread onto ctx so render() can read them.
    const ctx = { host, data, labels: active, el: svgEl, svg: svgEl, esc, fmt, maxStep: MAX, ...rest };

    // Caption + counter scaffold — appended AFTER the figure layers, unless the widget renders
    // its own (scaffold:false), in which case the factory leaves all caption/counter DOM to it.
    let cap = null, counter = null;
    if (scaffold) {
      cap = document.createElement('div');
      cap.className = 'wgt-caption';
      counter = document.createElement('div');
      counter.className = 'wgt-counter';
    }

    /* paint() draws the figure from scratch. It runs at mount AND on every language switch — not
       just update(step) — because a widget draws its STATIC labels (axis names, box captions, the
       ledger) in the render() body and only its per-step text inside update(). Swapping the map and
       re-running update alone would repaint the moving half of the figure and leave the rest in the
       boot language. Re-running render() is safe by construction: no widget's render() attaches a
       global listener or appends outside `host` (nothing to duplicate, nothing to leak). */
    /* A HIDDEN HOST CANNOT BE MEASURED, SO IT MUST NOT BE PAINTED. Inside a display:none subtree every
       geometry API answers zero — getBBox(), getBoundingClientRect(), getComputedTextLength() — so a
       figure that sizes anything by measuring (which is the whole point of the NCD tag boxes) draws
       itself blind and pins its labels to the origin. It then NEVER re-measures, so the damage is
       permanent and, because it depends on WHEN the paint happened, intermittent.
       This is not hypothetical: deck.js's fitAllSlides() strips is-active from every slide to re-measure
       them one at a time after the fonts land, and both repaint triggers below (fonts, language) fire
       asynchronously — i.e. exactly into that window, or onto a slide the presenter has already left.
       So: paint only into a rendered host, and remember the debt. setStep() settles it the moment the
       host is shown — which the deck does on slide:enter and the Book on scroll, so nothing is ever lost. */
    const rendered = () => host.getClientRects().length > 0;
    let dirty = false;

    let update = null;
    function paint() {
      if (!rendered()) { dirty = true; return; }   // measure nothing; owe a paint
      dirty = false;
      host.innerHTML = '';
      update = render(ctx);
      // Accessibility: every figure exposes a text alternative. SVG widgets set role/aria-label on
      // their own <svg>; DOM-only figures (no [role="img"] descendant) get it on the host here.
      if (active.alt && !host.querySelector('[role="img"]')) {
        host.setAttribute('role', 'img');
        host.setAttribute('aria-label', active.alt);
      }
      if (scaffold) { host.appendChild(cap); host.appendChild(counter); }
    }
    paint();

    let step = -1;
    function setStep(k) {
      k = Math.max(0, Math.min(MAX, k | 0));
      let same = (k === step);
      step = k;
      host.dataset.step = String(k);
      if (dirty) { paint(); same = false; }        // settle a paint we owed a hidden host — it is visible now
      if (typeof update === 'function' && !same) update(k); // figure layers: only redraw on real move
      if (scaffold) {
        cap.textContent = active['s' + k] || '';
        counter.textContent = `${k} / ${MAX}`;
      }
    }
    setStep(0);

    /* REPAINT ONCE THE FONTS ARE SHAPED. A figure that sizes a box by MEASURING its label (getBBox)
       is only correct if that label has been laid out in its real font. Mount before the webfont
       arrives and getBBox returns a 0×0 box, so the box gets built around the ORIGIN: the label becomes
       a tiny rectangle pinned to the figure's top-left corner — and it stays there, because nothing
       ever measures again. The deck mounts a widget on slide:enter, which can easily beat the font.
       It is intermittent by construction, which is exactly how it survives review: whoever looks, looks
       a second too late, sees a correct figure, and moves on. (slide-viz caught it; my own eyes did not.)
       So: if the fonts were not ready when we drew, draw again when they are. */
    if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => {
        const at = step;
        paint();
        step = -1;
        setStep(at);
        lockCaptionHeight();
      });
    }

    /* ── TRILINGUAL-UX ROBUSTNESS (both tricks live in the factory, so every widget inherits them) ──
       Vanilla, offline, dependency-free. Feature-detected: each piece no-ops when its precondition
       (a caption block / an in-place lang switch / a trilingual bundle) is absent, so widgets that
       render fine are untouched.

       TRICK 1 — theory-height-lock. The per-step caption text differs in length across en/ru/tt, so
       a language switch (and even plain stepping) reflows the caption block and everything below it.
       We measure the caption height for EVERY step — across all bundled languages when i18nAll is
       present, else across the steps of the one language we have — and pin min-height to that MAX, so
       the block never jumps. (Captions are display:none in the Book's scroll context: a 0-height
       measure yields no lock, which is the correct no-op there. It bites where captions show: decks
       and any standalone mount.) */
    function lockCaptionHeight() {
      if (!scaffold || !cap || cap.offsetParent === null) return; // no caption, or hidden (Book) → skip
      const langs = i18nAll ? Object.values(i18nAll) : [active];
      const prevText = cap.textContent, prevMin = cap.style.minHeight;
      cap.style.minHeight = '0px';                 // release any prior lock before remeasuring
      let max = 0;
      for (const L of langs) for (let k = 0; k <= MAX; k++) {
        cap.textContent = (L && L['s' + k]) || '';
        const h = cap.getBoundingClientRect().height; // forces layout; tallest wins
        if (h > max) max = h;
      }
      cap.textContent = prevText;                  // restore the real current-step caption
      cap.style.minHeight = max > 0 ? Math.ceil(max) + 'px' : prevMin;
    }
    lockCaptionHeight();

    /* TRICK 2 — re-render-on-language-switch. The Book mounts one page PER language (full reload), so
       this matters for surfaces that toggle in place: the deck flips document.documentElement's
       `data-lang` and lets CSS swap static [lang] spans — but text a widget GENERATES (its captions,
       and every label its render() drew) won't follow. We watch that attribute and, if we were given
       a trilingual bundle, mutate the label map IN PLACE and re-run render() at the SAME step, so the
       whole figure regenerates. With no bundle (or no in-place switch) it's a no-op. */
    let obs = null;
    if (typeof MutationObserver === 'function' && typeof document !== 'undefined' && document.documentElement) {
      const rootEl = document.documentElement;
      const pickLang = () => (rootEl.dataset.lang || rootEl.lang || 'en').slice(0, 2);
      let curLang = pickLang();
      obs = new MutationObserver(() => {
        const lang = pickLang();
        if (lang === curLang) return;
        curLang = lang;
        if (i18nAll && i18nAll[lang]) {
          // Mutate the object render() closed over. Replacing it would repaint nothing.
          for (const k of Object.keys(active)) delete active[k];
          Object.assign(active, base, i18nAll[lang]); // non-step keys survive; step text swaps
          const at = step;
          paint();                                    // redraw every label the figure owns
          step = -1;                                  // force setStep to repaint caption + layers once
          setStep(at);                                // …at the step the presenter was already on
        }
        lockCaptionHeight();                          // re-pin for the new language's text lengths
      });
      obs.observe(rootEl, { attributes: true, attributeFilter: ['data-lang', 'lang'] });
    }

    return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host,
             relock: lockCaptionHeight, destroy() { if (obs) obs.disconnect(); } };
  }

  if (typeof window !== 'undefined') window[exportName || mountName(id)] = mount;
  return mount;
}
