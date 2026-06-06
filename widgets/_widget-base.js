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
   caption + counter are always managed by the factory. */

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
export function defineWidget({ id, maxStep, render, rootClass, exportName, fade = true }) {
  const MAX = maxStep;
  const cls = rootClass || `${id}-root`;

  function mount(host, { data, labels = {} } = {}) {
    host.classList.add('wgt-root', cls);
    if (fade) host.classList.add('wgt-fade');
    host.innerHTML = '';

    // Figure-specific layers (drawn by the widget). May return an update(step) callback.
    const ctx = { host, data, labels, el: svgEl, svg: svgEl, esc, fmt, maxStep: MAX };
    const update = render(ctx);

    // Caption + counter scaffold — always appended AFTER the figure layers.
    const cap = document.createElement('div');
    cap.className = 'wgt-caption';
    host.appendChild(cap);
    const counter = document.createElement('div');
    counter.className = 'wgt-counter';
    host.appendChild(counter);

    let step = -1;
    function setStep(k) {
      k = Math.max(0, Math.min(MAX, k | 0));
      if (k === step) return;
      step = k;
      host.dataset.step = String(k);
      if (typeof update === 'function') update(k);
      cap.textContent = labels['s' + k] || '';
      counter.textContent = `${k} / ${MAX}`;
    }
    setStep(0);

    return { setStep, get step() { return step; }, get maxStep() { return MAX; }, root: host };
  }

  if (typeof window !== 'undefined') window[exportName || mountName(id)] = mount;
  return mount;
}
