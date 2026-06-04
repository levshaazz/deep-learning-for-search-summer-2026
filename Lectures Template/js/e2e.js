/* =========================================================
   E2E WALKTHROUGH — sync architecture, math, numeric panels.
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_e2e) return;
  window.__lec_e2e = 1;

  if (new URL(location.href).searchParams.get('presenter') === '1') return;

  function init(slide) {
    if (slide.dataset.e2eBound) return;
    slide.dataset.e2eBound = '1';

    const archBlocks = [...slide.querySelectorAll('.e2e-arch-block')];
    const arrows = [...slide.querySelectorAll('.e2e-arch-arrow')];
    const steps = [...slide.querySelectorAll('.e2e-step')];
    const counter = slide.querySelector('.e2e-counter [data-counter-val]');
    const stageName = slide.querySelector('.e2e-stage-name');
    const stepperPrev = slide.querySelector('.e2e-stepper [data-step-act="prev"]');
    const stepperNext = slide.querySelector('.e2e-stepper [data-step-act="next"]');
    const toggleBtn = slide.querySelector('.e2e-toggle');

    /* Track the highest step the lecturer has reached so we can mark
       a backtrack visually. */
    let maxReached = parseInt(slide.dataset.currentStep || '0', 10);

    /* Click an architecture block — jump to its first step */
    archBlocks.forEach((block) => {
      block.addEventListener('click', () => {
        const range = parseRange(block.dataset.stepRange);
        if (range) setStep(range.from);
      });
      block.addEventListener('mouseenter', () => showTooltip(block));
      block.addEventListener('mouseleave', () => hideTooltip(slide));
      /* a11y — make blocks focusable too */
      if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '0');
      block.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const range = parseRange(block.dataset.stepRange);
          if (range) setStep(range.from);
        }
      });
    });

    if (stepperPrev) stepperPrev.addEventListener('click', () => setStep(currentStep() - 1));
    if (stepperNext) stepperNext.addEventListener('click', () => setStep(currentStep() + 1));

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const hidden = slide.dataset.hideNumeric === 'true';
        slide.dataset.hideNumeric = hidden ? 'false' : 'true';
        toggleBtn.classList.toggle('is-on', !hidden);
      });
    }

    /* Sync visuals on slide:step (deck dispatches via ←/→). */
    slide.addEventListener('slide:step', () => paint());
    /* CONSUMER of the deck's slide:enter — deck.js resets currentStep /
       backtracked / hideNumeric on re-entry; we mirror that into our closure
       state (maxReached) and repaint so the walkthrough rewinds cleanly. */
    slide.addEventListener('slide:enter', () => {
      maxReached = parseInt(slide.dataset.currentStep || '0', 10);
      paint();
    });
    paint();

    function currentStep() {
      return parseInt(slide.dataset.currentStep || '0', 10);
    }
    function max() { return parseInt(slide.dataset.maxStep || '0', 10); }

    function setStep(n) {
      const clamped = Math.max(0, Math.min(max(), n));
      slide.dataset.currentStep = String(clamped);
      slide.dispatchEvent(new CustomEvent('slide:step', {
        detail: { step: clamped, max: max() },
      }));
      paint();
      if (window.Lecture && window.Lecture.slides &&
          window.Lecture.slides[window.Lecture.current] === slide &&
          typeof history.replaceState === 'function') {
        history.replaceState(null, '',
          '#/' + (window.Lecture.current + 1) + (clamped > 0 ? '/' + clamped : ''));
      }
    }

    function paint() {
      const cur = currentStep();
      const m = max();

      /* Track max reached + backtrack flag */
      if (cur > maxReached) maxReached = cur;
      slide.dataset.backtracked = (cur < maxReached) ? 'true' : 'false';

      /* Steps — visibility + lazy KaTeX */
      steps.forEach((s) => {
        const n = parseInt(s.dataset.step || '0', 10);
        s.classList.toggle('is-current', n === cur);
      });
      lazyRenderMath(cur);

      /* Arch blocks — current / visited */
      archBlocks.forEach((b) => {
        const r = parseRange(b.dataset.stepRange);
        if (!r) return;
        const inRange = cur >= r.from && cur <= r.to;
        const visited = cur > r.to;
        b.classList.toggle('is-current', inRange);
        b.classList.toggle('is-visited', visited);
      });
      /* Arrows — flow on whichever arrow corresponds to current step */
      arrows.forEach((arrow) => {
        const r = parseRange(arrow.dataset.stepRange);
        arrow.classList.toggle('is-flowing',
          r ? (cur >= r.from && cur <= r.to) : false);
      });
      /* Counter + stage name */
      if (counter) counter.textContent = cur + ' / ' + m;
      if (stageName) {
        const owner = archBlocks.find(b => {
          const r = parseRange(b.dataset.stepRange);
          return r && cur >= r.from && cur <= r.to;
        });
        const nameEl = owner ? owner.querySelector('.arch-name') : null;
        stageName.textContent = nameEl ? nameEl.textContent.trim() : '';
      }
      /* Stepper buttons */
      if (stepperPrev) stepperPrev.disabled = cur <= 0;
      if (stepperNext) stepperNext.disabled = cur >= m;

      /* Per-step speaker notes — expose to presenter view
         by toggling which aside is "live". */
      slide.querySelectorAll('aside[data-notes-for-step]').forEach((a) => {
        const want = parseInt(a.dataset.notesForStep, 10) === cur;
        a.classList.toggle('is-current-note', want);
      });
    }

    /* Lazy KaTeX rendering — only typeset formulas in [cur-1, cur, cur+1].
       Saves a LOT on slides with 25 steps × KaTeX overhead. */
    function lazyRenderMath(cur) {
      if (!window.renderMathInElement) return;
      [cur - 1, cur, cur + 1].forEach((n) => {
        if (n < 0 || n > max()) return;
        steps.forEach((s) => {
          if (parseInt(s.dataset.step, 10) !== n) return;
          if (s.dataset.mathRendered === '1') return;
          /* Use KaTeX directly (it's loaded synchronously by index.html). */
          try {
            window.renderMathInElement(s, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false },
              ],
              throwOnError: false,
            });
            s.dataset.mathRendered = '1';
          } catch (_) { /* ignore */ }
        });
      });
    }
  }

  function parseRange(raw) {
    if (!raw) return null;
    const m = String(raw).match(/^(\d+)(?:\.\.(\d+))?$/);
    if (!m) return null;
    const from = parseInt(m[1], 10);
    const to = m[2] ? parseInt(m[2], 10) : from;
    return { from, to };
  }

  /* ---- Tooltip (XSS-safe: escape data-tooltip HTML) ----
     PER-SLIDE: the tooltip is stored ON the slide (slide._e2eTooltip), never
     in a module-global — otherwise with two e2e slides the hover tooltip
     binds to whichever slide initialized last and positions against the
     wrong one. */
  function ensureTooltip(slide) {
    let tip = slide._e2eTooltip;
    if (tip && tip.isConnected && tip.parentNode === slide) return tip;
    tip = document.createElement('div');
    tip.className = 'e2e-tooltip';
    slide.appendChild(tip);
    slide._e2eTooltip = tip;
    return tip;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function tooltipMarkup(raw) {
    /* Escape everything, then re-allow a tiny vocabulary of markdown-ish
       tags: **bold**, *italic*, `code`, simple line breaks. */
    return escapeHtml(raw)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
  function showTooltip(block) {
    const raw = block.dataset.tooltip;
    if (!raw) return;
    const slide = block.closest('.slide');
    const tip = ensureTooltip(slide);
    tip.innerHTML = tooltipMarkup(raw);
    const blockRect = block.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const x = (blockRect.left + blockRect.right) / 2 - slideRect.left;
    const y = blockRect.top - slideRect.top - 12;
    tip.style.left = (x - tip.offsetWidth / 2) + 'px';
    tip.style.top = (y - tip.offsetHeight) + 'px';
    requestAnimationFrame(() => tip.classList.add('is-visible'));
  }
  function hideTooltip(slide) {
    const tip = slide && slide._e2eTooltip;
    if (tip) tip.classList.remove('is-visible');
  }

  document.addEventListener('deck:ready', () => {
    document.querySelectorAll('.slide[data-type="e2e"]').forEach(init);
  });
})();
