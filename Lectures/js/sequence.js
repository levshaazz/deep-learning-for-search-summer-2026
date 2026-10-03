/* =========================================================
   sequence.js — `sequence` slide type: request-flow / latency-budget diagram.
   Lifelines (actors) + ordered messages revealed step-by-step (via the deck's
   generic step engine: data-max-step / [data-step] / is-step-hidden), with a
   running latency budget that turns red if it blows the SLA.

   Contract:
     <section data-type="sequence" data-max-step="5" data-budget="100">
       <div class="seq-stage">
         <div class="seq-canvas">
           <div class="seq-actors">
             <div class="seq-actor" data-actor="client"><span class="seq-actor-chip">Client</span></div> …
           </div>
           <svg class="seq-lines"></svg>                 (engine draws lifelines)
           <div class="seq-msgs">
             <div class="seq-msg" data-step="1" data-from="client" data-to="api" data-lat="2">
               <span class="seq-msg-label">request</span><span class="seq-lat">+2ms</span>
             </div> …
           </div>
         </div>
         <div class="seq-budget">
           <div class="seq-budget-head">latency budget</div>
           <div class="seq-budget-row" data-step="1"><span>request</span><span class="seq-b-lat">2ms</span></div> …
           <div class="seq-budget-total"><span>total</span><span class="seq-b-lat" data-seq-total>0</span></div>
         </div>
       </div>
     </section>

   The engine lays out lifelines + message arrows from the live actor positions
   (re-laid on resize); reveal is the generic stepper; the total sums the
   latency of messages revealed so far and flags `is-over` past data-budget.
   ========================================================= */
(function () {
  'use strict';
  if (window.__lec_sequence) return;
  window.__lec_sequence = 1;
  const NS = 'http://www.w3.org/2000/svg';

  function init(slide) {
    if (slide.dataset.seqBound) return;
    slide.dataset.seqBound = '1';
    const canvas = slide.querySelector('.seq-canvas');
    if (!canvas) return;
    const actors = [...slide.querySelectorAll('.seq-actor')];
    const msgs = [...slide.querySelectorAll('.seq-msg')];
    const budget = parseFloat(slide.dataset.budget || '0');
    const totalEl = slide.querySelector('[data-seq-total]');
    const totalRow = slide.querySelector('.seq-budget-total');

    if (!slide.hasAttribute('data-max-step')) slide.dataset.maxStep = String(msgs.length);
    if (!slide.dataset.currentStep) slide.dataset.currentStep = '0';

    let svg = canvas.querySelector('svg.seq-lines');
    if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'seq-lines'); canvas.insertBefore(svg, canvas.firstChild); }

    const actorX = (name) => {
      const a = actors.find(x => x.dataset.actor === name);
      return a ? a.offsetLeft + a.offsetWidth / 2 : null;
    };

    function layout() {
      const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const chipBottom = (actors[0] ? actors[0].offsetTop + actors[0].offsetHeight : 50) + 6;
      actors.forEach(a => {
        const x = a.offsetLeft + a.offsetWidth / 2;
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x); ln.setAttribute('x2', x);
        ln.setAttribute('y1', chipBottom); ln.setAttribute('y2', ch);
        svg.appendChild(ln);
      });
      const top0 = chipBottom + 34;
      const row = Math.min(82, Math.max(48, (ch - top0 - 16) / Math.max(1, msgs.length)));
      msgs.forEach((m, i) => {
        const fx = actorX(m.dataset.from), tx = actorX(m.dataset.to);
        if (fx == null || tx == null) return;
        const y = top0 + i * row;
        m.style.left = Math.min(fx, tx) + 'px';
        m.style.top = y + 'px';
        m.style.width = Math.abs(tx - fx) + 'px';
        m.dataset.dir = tx >= fx ? 'right' : 'left';
      });
    }

    // Opt-in (data-seq-skip-async): async fire-and-forget hops (data-kind="async")
    // are off the user-facing critical path, so they are kept visible but NOT
    // added to the latency total that gates the p99 SLA. Off by default so other
    // decks whose stated total counts every hop are unaffected.
    const skipAsync = slide.hasAttribute('data-seq-skip-async');

    function updateTotal() {
      const cur = parseInt(slide.dataset.currentStep || '0', 10) || 0;
      let sum = 0;
      msgs.forEach(m => {
        if ((parseInt(m.dataset.step, 10) || 0) > cur) return;
        if (skipAsync && m.dataset.kind === 'async') return;
        sum += parseFloat(m.dataset.lat || '0');
      });
      if (totalEl) totalEl.textContent = (Math.round(sum * 10) / 10) + 'ms';
      if (totalRow && budget) totalRow.classList.toggle('is-over', sum > budget);
    }

    slide.addEventListener('slide:step', updateTotal);
    slide.addEventListener('slide:enter', () => { layout(); updateTotal(); });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(layout).observe(canvas);
    window.addEventListener('resize', layout);
    layout(); updateTotal();
    requestAnimationFrame(() => { layout(); updateTotal(); });
    setTimeout(() => { layout(); updateTotal(); }, 400);
  }

  document.addEventListener('deck:ready', () => {
    document.querySelectorAll('.slide[data-type="sequence"]').forEach(init);
  });
})();
