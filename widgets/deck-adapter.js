/* deck-adapter.js — mount "explainable unit" widgets inside a real lecture DECK slide and drive
   them with the deck's own step engine (arrow keys). One figure → slide & Book: the Book uses
   Scrollama → setStep; here the deck's step engine → setStep. Same widget, same data.

   CLASSIC script (not a module): the deck engine (Lectures/js/deck.js) is a classic IIFE so it can
   run over file://. This adapter reads each widget's mount function from a window global that the
   widget's logic.js assigns (window.mount<PascalCaseId>), and the figure DATA + i18n LABELS from an
   inlined <script class="widget-data" type="application/json"> — no fetch, offline-safe.

   AUTHOR a deck slide like:
     <section class="slide" data-type="e2e" data-max-step="4">
       ...header...
       <div class="widget-mount" data-widget="cosine-sphere"></div>
       <script class="widget-data" type="application/json">{ "data": {...}, "labels": {...} }<\/script>
     </section>
   Set data-max-step to the widget's maxStep (the deck steps within that range). Include the widget's
   logic.js (classic-bundled — see note) + this adapter after deck.js.

   NOTE (file://): widget logic.js is ES-module source (for the Book). On the published HTTP site a
   `<script type="module">` sets the window global fine. For offline file:// decks, ship a classic
   bundle of the widget(s) that assigns the same window.mount* global. The adapter code is unchanged. */
(function () {
  'use strict';
  function mountName(id) {
    return 'mount' + id.split('-').map(function (s) { return s.charAt(0).toUpperCase() + s.slice(1); }).join('');
  }
  function readPayload(slide) {
    var el = slide.querySelector('script.widget-data[type="application/json"]');
    if (!el) return {};
    try { return JSON.parse(el.textContent); } catch (e) { return {}; }
  }

  function hook(mountEl) {
    var slide = mountEl.closest('.slide');
    if (!slide || mountEl.__wired) return;
    mountEl.__wired = true;
    var id = mountEl.getAttribute('data-widget');
    var mountFn = window[mountName(id)];
    var payload = readPayload(slide);
    var fig = null;

    function ensure() {
      if (fig) return true;
      if (typeof mountFn !== 'function') return false;
      fig = mountFn(mountEl, { data: payload.data, labels: payload.labels || {} });
      // tell the deck engine the step range if the author didn't.
      if (!slide.hasAttribute('data-max-step')) slide.setAttribute('data-max-step', String(fig.maxStep));
      (window.__deckFigs = window.__deckFigs || {})[id] = fig; // verification hook
      sync();
      return true;
    }
    function sync() { if (fig) fig.setStep(parseInt(slide.dataset.currentStep || '0', 10)); }

    // The deck emits slide:enter (on becoming active) and slide:step (on ←/→ within the slide).
    slide.addEventListener('slide:enter', function () { if (ensure()) sync(); });
    slide.addEventListener('slide:step', function (e) { if (ensure()) fig.setStep(e.detail.step); });
    // mount eagerly if this slide is already the active one at load
    if (slide.classList.contains('is-active')) ensure();
  }

  function wireAll() {
    var mounts = document.querySelectorAll('.slide .widget-mount[data-widget]');
    Array.prototype.forEach.call(mounts, hook);
  }

  // deck.js also inits on DOMContentLoaded; deck:ready fires after it scans slides.
  document.addEventListener('deck:ready', wireAll);
  if (document.readyState !== 'loading') wireAll();
  else document.addEventListener('DOMContentLoaded', wireAll);
})();
