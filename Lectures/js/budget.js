/* =========================================================
   budget.js — running parameter / FLOP / cost "budget" for an
   architecture walk (walkthrough · e2e · arch · default).

     <div class="walk-budget" data-budget-format="si"
          data-budget-cap="200000" data-budget-suffix=" params">
       <div class="walk-budget-head">…</div>
       <div class="walk-budget-track">
         <span class="walk-budget-item" data-step="2" data-budget="156">conv1 <b>156</b></span>
         …one chip per step (data-step → revealed cumulatively by the engine)…
       </div>
       <div class="walk-budget-total"><span data-walk-total>0</span></div>
     </div>

   Each chip carries data-budget="<number>". On every slide:step / slide:enter
   this sums the chips whose data-step ≤ the slide's current step and writes the
   running total into [data-walk-total]. It is the numeric twin of the sequence
   latency budget: declarative chips, one engine, one total, and a flag past a
   cap. No coordinates, no canvas — pure DOM, so it inlines offline cleanly and
   re-fits with the slide. The raw sum is mirrored onto the bar as
   data-budget-sum so the headless auditor can verify total == Σ revealed.
   ========================================================= */
(function () {
  'use strict';
  if (window.__lec_budget) return;
  window.__lec_budget = 1;

  /* Format a number for display. `si` → 156 / 51.9K / 1.2M / 3B (one decimal,
     trimmed). Default groups thousands with a thin space (51 902) so wide
     counts stay readable on the bar. */
  function fmt(n, mode) {
    if (mode === 'si') {
      const a = Math.abs(n), sign = n < 0 ? '-' : '';
      const unit = (v, u) => sign + (Math.round(v * 10) / 10).toString().replace(/\.0$/, '') + u;
      if (a >= 1e9) return unit(a / 1e9, 'B');
      if (a >= 1e6) return unit(a / 1e6, 'M');
      if (a >= 1e3) return unit(a / 1e3, 'K');
      return sign + a;
    }
    // Group thousands with a narrow no-break space (locale-independent).
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function init(bar) {
    const slide = bar.closest('.slide');
    if (!slide || bar.dataset.budgetBound) return;
    bar.dataset.budgetBound = '1';

    const items = [...bar.querySelectorAll('.walk-budget-item[data-budget]')];
    const totalEl = bar.querySelector('[data-walk-total]');
    const totalBox = bar.querySelector('.walk-budget-total');
    const mode = bar.dataset.budgetFormat || 'plain';
    const cap = parseFloat(bar.dataset.budgetCap || '');
    const prefix = bar.dataset.budgetPrefix || '';
    const suffix = bar.dataset.budgetSuffix || '';

    function update() {
      const cur = parseInt(slide.dataset.currentStep || '0', 10) || 0;
      let sum = 0;
      items.forEach((it) => {
        const s = parseInt(it.getAttribute('data-step') || '0', 10) || 0;
        if (s <= cur) sum += parseFloat(it.dataset.budget) || 0;
      });
      if (totalEl) totalEl.textContent = prefix + fmt(sum, mode) + suffix;
      if (totalBox && !isNaN(cap)) totalBox.classList.toggle('is-over', sum > cap);
      bar.dataset.budgetSum = String(sum); // for the auditor
    }

    slide.addEventListener('slide:step', update);
    slide.addEventListener('slide:enter', update);
    update();
  }

  function initAll() {
    document.querySelectorAll('.walk-budget').forEach(init);
  }

  if (document.readyState !== 'loading') initAll();
  else document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('deck:ready', initAll);
})();
