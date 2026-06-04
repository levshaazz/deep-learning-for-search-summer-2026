/* =========================================================
   LAB — experimental slide-type behaviors
   misconception · pause · derivation · counterfactual · recall ·
   devil's-advocate · typewriter · reverse · arxiv-quote · pyodide
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_lab) return;
  window.__lec_lab = 1;

  if (new URL(location.href).searchParams.get('presenter') === '1') return;

  /* ---------- MISCONCEPTION ---------- */
  function initMisconception(slide) {
    if (slide.dataset.miscBound) return;
    slide.dataset.miscBound = '1';
    const btn = slide.querySelector('.misc-reveal-btn');
    if (btn) btn.addEventListener('click', () => {
      slide.classList.add('is-truth-shown');
      /* Revealing the truth grows the card — re-fit so it can't overflow. */
      if (window.Lecture && window.Lecture.refit) window.Lecture.refit(slide);
    });
    /* Reset on slide enter — so re-showing the lecture doesn't pre-leak truth */
    slide.addEventListener('slide:enter', () => slide.classList.remove('is-truth-shown'));
  }

  /* ---------- PAUSE ---------- */
  function initPause(slide) {
    if (slide.dataset.pauseBound) return;
    slide.dataset.pauseBound = '1';
    const seconds = parseInt(slide.dataset.pauseSeconds || '30', 10);
    const display = slide.querySelector('.pause-timer');
    const startBtn = slide.querySelector('[data-pause-act="start"]');
    const skipBtn = slide.querySelector('[data-pause-act="skip"]');
    if (display) {
      display.style.setProperty('--pause-duration', seconds + 's');
      display.textContent = fmt(seconds);
    }
    let remaining = seconds, intId = null, running = false;
    function fmt(s) {
      const m = Math.floor(s / 60); s = s % 60;
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    function paint() {
      if (display) {
        display.textContent = fmt(remaining);
        display.classList.toggle('is-running', running);
        display.classList.toggle('is-finished', remaining === 0);
      }
    }
    function start() {
      if (running || remaining <= 0) return;
      running = true; paint();
      intId = setInterval(() => {
        remaining--;
        paint();
        if (remaining <= 0) { clearInterval(intId); running = false; }
      }, 1000);
    }
    function reset() {
      clearInterval(intId); running = false; remaining = seconds; paint();
    }
    if (startBtn) startBtn.addEventListener('click', () => running ? reset() : start());
    if (skipBtn) skipBtn.addEventListener('click', () => {
      reset();
      if (window.Lecture) window.Lecture.next();
    });
    /* Auto-start when slide becomes active. */
    slide.addEventListener('slide:enter', () => { reset(); start(); });
    slide.addEventListener('slide:leave', () => clearInterval(intId));
    paint();
  }

  /* ---------- DERIVATION (term-by-term morph) ---------- */
  function initDerivation(slide) {
    if (slide.dataset.derivBound) return;
    slide.dataset.derivBound = '1';
    const form = slide.querySelector('.deriv-form');
    const captionEl = slide.querySelector('.deriv-step-caption');
    if (!form) return;
    const steps = [...slide.querySelectorAll('.deriv-step')]
      .sort((a, b) => +a.dataset.step - +b.dataset.step);
    const max = steps.length - 1;
    slide.dataset.maxStep = String(max);
    slide.dataset.currentStep = slide.dataset.currentStep || '0';

    function paint() {
      const cur = parseInt(slide.dataset.currentStep, 10);
      const step = steps[cur];
      if (!step) return;
      /* Replace form contents — FLIP-ish: existing same-id terms keep
         their visual identity via getBoundingClientRect snapshotting. */
      const oldTerms = [...form.querySelectorAll('.deriv-term')];
      const oldPositions = new Map();
      oldTerms.forEach((t) => {
        if (t.dataset.id) oldPositions.set(t.dataset.id, t.getBoundingClientRect());
      });
      form.innerHTML = step.querySelector('.deriv-content')?.innerHTML || step.innerHTML;
      const newTerms = [...form.querySelectorAll('.deriv-term')];
      newTerms.forEach((t) => {
        if (t.dataset.id && oldPositions.has(t.dataset.id)) {
          const before = oldPositions.get(t.dataset.id);
          const after = t.getBoundingClientRect();
          const dx = before.left - after.left;
          const dy = before.top - after.top;
          if (dx || dy) {
            t.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(() => {
              t.style.transform = '';
            });
          }
        } else {
          t.classList.add('is-new');
        }
      });
      if (captionEl) captionEl.textContent = step.dataset.caption || '';
    }
    slide.addEventListener('slide:step', paint);
    slide.addEventListener('slide:enter', () => { slide.dataset.currentStep = '0'; paint(); });
    paint();
  }

  /* ---------- COUNTERFACTUAL TOGGLE ---------- */
  function initCounterfactual(slide) {
    slide.querySelectorAll('.cf-toggle-bar').forEach((bar) => {
      if (bar.dataset.cfBound) return;
      bar.dataset.cfBound = '1';
      const group = bar.dataset.cfGroup;
      const buttons = [...bar.querySelectorAll('button')];
      function set(value) {
        buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.cfValue === value));
        slide.querySelectorAll(`.cf-variant[data-cf-group="${group}"]`).forEach((v) => {
          v.classList.toggle('is-active', v.dataset.cfValue === value);
        });
      }
      buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.cfValue)));
      const initial = bar.dataset.cfInitial || buttons[0]?.dataset.cfValue;
      if (initial) set(initial);
    });
  }

  /* ---------- RECALL (split-screen with another slide) ---------- */
  let recallOverlay = null;
  function ensureRecallOverlay() {
    if (recallOverlay) return recallOverlay;
    recallOverlay = document.createElement('div');
    recallOverlay.className = 'recall-overlay';
    recallOverlay.innerHTML = `
      <button class="recall-close" type="button">Close (Esc)</button>
      <div class="recall-split">
        <div class="recall-thumb is-past">
          <div class="recall-thumb-label" data-recall-past-label></div>
        </div>
        <div class="recall-arrow">→</div>
        <div class="recall-thumb is-current">
          <div class="recall-thumb-label" data-recall-current-label></div>
        </div>
      </div>
    `;
    recallOverlay.addEventListener('click', (e) => {
      if (e.target === recallOverlay) hideRecall();
    });
    recallOverlay.querySelector('.recall-close').addEventListener('click', hideRecall);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && recallOverlay.classList.contains('is-visible')) {
        hideRecall();
      }
    });
    document.body.appendChild(recallOverlay);
    return recallOverlay;
  }
  function showRecall(targetSlideRef) {
    const overlay = ensureRecallOverlay();
    /* targetSlideRef is either an index like "5" or an id selector "#slide-svd" */
    let target = null;
    if (/^\d+$/.test(targetSlideRef)) {
      target = document.querySelectorAll('.slide')[parseInt(targetSlideRef, 10) - 1];
    } else {
      target = document.querySelector(targetSlideRef);
    }
    const current = document.querySelector('.slide.is-active');
    if (!target || !current) return;
    const pastThumb = overlay.querySelector('.recall-thumb.is-past');
    const curThumb = overlay.querySelector('.recall-thumb.is-current');
    /* Replace existing clones */
    pastThumb.querySelectorAll('.slide').forEach(s => s.remove());
    curThumb.querySelectorAll('.slide').forEach(s => s.remove());
    const pastClone = target.cloneNode(true);
    pastClone.classList.add('is-active');
    pastClone.style.cssText = '';
    pastThumb.insertBefore(pastClone, pastThumb.querySelector('.recall-thumb-label'));
    const curClone = current.cloneNode(true);
    curClone.classList.add('is-active');
    curClone.style.cssText = '';
    curThumb.insertBefore(curClone, curThumb.querySelector('.recall-thumb-label'));
    overlay.querySelector('[data-recall-past-label]').textContent =
      target.dataset.screenLabel || ('Slide ' + (+target.dataset.index + 1));
    overlay.querySelector('[data-recall-current-label]').textContent =
      current.dataset.screenLabel || ('Slide ' + (window.Lecture.current + 1));
    overlay.classList.add('is-visible');
  }
  function hideRecall() {
    if (recallOverlay) recallOverlay.classList.remove('is-visible');
  }
  function bindRecallLinks() {
    document.querySelectorAll('.recall-link[data-recall]').forEach((link) => {
      if (link.dataset.recallBound) return;
      link.dataset.recallBound = '1';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showRecall(link.dataset.recall);
      });
    });
  }

  /* ---------- DEVIL'S ADVOCATE ---------- */
  function bindDevilAdvocate() {
    /* Backslash toggles the devil's-advocate overlay — but ONLY on slides that
       actually have one. Registering on the central registry and returning
       false when there's no overlay means we DON'T preventDefault on every
       slide (the old bug swallowed `\` everywhere), letting the key pass
       through / other handlers try it when no overlay is present. */
    if (window.LectureKeys) {
      window.LectureKeys.register('\\', () => {
        const cur = document.querySelector('.slide.is-active');
        if (!cur) return false;
        const devil = cur.querySelector('.devil-overlay');
        if (!devil) return false; // no overlay here — decline (don't preventDefault)
        cur.classList.toggle('is-devil');
      });
    }
    /* Bind close buttons */
    document.querySelectorAll('.devil-overlay .devil-close').forEach((b) => {
      if (b.dataset.devilBound) return;
      b.dataset.devilBound = '1';
      b.addEventListener('click', () => {
        b.closest('.slide')?.classList.remove('is-devil');
      });
    });
  }

  /* ---------- TYPEWRITER ---------- */
  function initTypewriter(el) {
    if (el.dataset.twBound) return;
    el.dataset.twBound = '1';
    const text = el.textContent;
    const speed = parseFloat(el.dataset.twSpeed || '0.04');
    el.innerHTML = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'tw-char';
      if (ch === ' ') { span.classList.add('is-space'); span.innerHTML = '&nbsp;'; }
      else span.textContent = ch;
      span.style.animationDelay = (i * speed) + 's';
      el.appendChild(span);
    });
  }

  /* ---------- REVERSE rewind ---------- */
  /* Layer-stack reveal — shared engine for the `reverse` and `forward` types.
     Both use ONE convention so the deck's normal stepper drives them: the
     slide's data-current-step is "narrative progress" 0..max, → advances, ←
     goes back, and the slide is entered at step 0. The ONLY difference is which
     layer that progress reveals:
       • forward  — step k shows layer k        (input → … → result, build up)
       • reverse  — step k shows layer (max−k)  (result → … → input, rewind)
     So a reverse slide opens on the RESULT (its intended entry state) yet →
     still advances the narrative and never kicks the lecturer off the slide by
     accident — it just peels toward the input until exhausted. */
  function initLayerStack(slide) {
    if (slide.dataset.layerStackBound) return;
    slide.dataset.layerStackBound = '1';
    const isReverse = slide.dataset.type === 'reverse';
    const layers = [...slide.querySelectorAll('.reverse-layer')]
      .sort((a, b) => +a.dataset.layer - +b.dataset.layer);
    if (!layers.length) return;
    const max = layers.length - 1;
    slide.dataset.maxStep = String(max);
    if (slide.dataset.currentStep == null || slide.dataset.currentStep === '') {
      slide.dataset.currentStep = '0';
    }
    const counter = slide.querySelector('.reverse-counter [data-reverse-pos]');
    function paint() {
      let step = parseInt(slide.dataset.currentStep || '0', 10);
      if (!Number.isFinite(step)) step = 0;
      step = Math.max(0, Math.min(max, step));
      const activeIdx = isReverse ? (max - step) : step;
      layers.forEach((l, i) => {
        l.dataset.state = i < activeIdx ? 'below' : (i === activeIdx ? 'active' : 'above');
      });
      if (counter) counter.textContent = (activeIdx + 1) + ' / ' + (max + 1);
    }
    slide.addEventListener('slide:step', paint);
    slide.addEventListener('slide:enter', paint);
    paint();
  }

  /* ---------- arXiv-quote (Custom Element) ----------
     <arxiv-quote id="2310.04567"></arxiv-quote>
     Fetches abstract from arXiv API and renders.
  */
  if (!customElements.get('arxiv-quote')) {
    class ArxivQuote extends HTMLElement {
      connectedCallback() {
        if (this.dataset.fetched) return;
        this.dataset.fetched = '1';
        const id = this.getAttribute('id-arxiv') || this.getAttribute('paper-id');
        if (!id) {
          this.innerHTML = '<div class="aq-error">Missing id-arxiv="…" attribute</div>';
          return;
        }
        this.innerHTML = '<div class="aq-loading">Loading arXiv:' + id + '…</div>';
        /* arXiv API: http://export.arxiv.org/api/query?id_list=ID
           Returns Atom XML. CORS-friendly.
           SECURITY/OFFLINE CAVEAT: this is a live network fetch to a third-party
           host (export.arxiv.org). It does NOT work offline and is the only
           runtime network call besides the opt-in Pyodide CDN. SRI cannot be
           applied to a dynamic fetch() (the response body is not fixed), so the
           returned XML is treated as untrusted and every field is escaped via
           escapeHtml() before insertion. Not present in the default deck. */
        fetch('https://export.arxiv.org/api/query?id_list=' + encodeURIComponent(id))
          .then(r => r.text())
          .then(xml => {
            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const entry = doc.querySelector('entry');
            if (!entry) throw new Error('No entry');
            const title = entry.querySelector('title')?.textContent.trim() || '';
            const summary = entry.querySelector('summary')?.textContent.trim() || '';
            const authors = [...entry.querySelectorAll('author name')]
              .map(a => a.textContent.trim()).slice(0, 4).join(', ');
            const year = (entry.querySelector('published')?.textContent || '').slice(0, 4);
            this.innerHTML = `
              <div class="aq-meta">arXiv:${escapeHtml(id)} · ${escapeHtml(year)} · ${escapeHtml(authors)}</div>
              <h4 class="aq-title">${escapeHtml(title)}</h4>
              <div class="aq-body">${escapeHtml(summary)}</div>
            `;
          })
          .catch(err => {
            this.innerHTML = `<div class="aq-error">arXiv:${escapeHtml(id)} — fetch failed (${escapeHtml(err.message)})</div>`;
          });
      }
    }
    customElements.define('arxiv-quote', ArxivQuote);
  }

  /* ---------- PYODIDE live Python ----------
     SECURITY: this injects a CDN script (tens of MB) and then executes
     arbitrary Python typed into a contenteditable. It is OPT-IN (no
     .pyodide-runner in the default deck) and breaks offline use. The injected
     <script> is pinned to v0.26.4 and locked with Subresource Integrity +
     crossorigin so a tampered CDN payload is rejected by the browser.
     SRI computed via:
       curl -fsSL https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js \
         | openssl dgst -sha384 -binary | openssl base64 -A
     If you re-pin to another version you MUST recompute this hash. */
  const PYODIDE_SRC = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  const PYODIDE_SRI = 'sha384-i3R37b3tF+HWudsUf1VSEOY2YxwSNMqY8DQa9Z0O3xh+NkJ9o+yjcGyIi5huj+nB';
  let pyodideConsented = false;
  /* One-time confirm before the very first download/run. Returns true if the
     user accepts. We use the native confirm() so it works without extra DOM. */
  function confirmPyodide() {
    if (pyodideConsented) return true;
    const lang = document.documentElement.getAttribute('data-lang') || 'ru';
    const msg = lang === 'en'
      ? 'Run live Python?\n\nThis downloads the Pyodide interpreter (tens of MB) '
        + 'from a public CDN (cdn.jsdelivr.net) and then executes the code in the '
        + 'editor as untrusted Python in your browser. It requires a network '
        + 'connection (does not work offline). Continue?'
      : 'Запустить Python вживую?\n\nБудет загружен интерпретатор Pyodide '
        + '(десятки МБ) с публичного CDN (cdn.jsdelivr.net), после чего код из '
        + 'редактора выполнится как недоверенный Python в браузере. Нужно '
        + 'интернет-соединение (offline не работает). Продолжить?';
    pyodideConsented = window.confirm(msg);
    return pyodideConsented;
  }
  let pyodidePromise = null;
  function ensurePyodide() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PYODIDE_SRC;
      s.integrity = PYODIDE_SRI;       /* reject a tampered CDN payload */
      s.crossOrigin = 'anonymous';     /* required for SRI on cross-origin */
      s.onload = () => {
        window.loadPyodide().then(resolve).catch(reject);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return pyodidePromise;
  }
  function initPyodideRunners() {
    document.querySelectorAll('.pyodide-runner').forEach((r) => {
      if (r.dataset.pyBound) return;
      r.dataset.pyBound = '1';
      const editor = r.querySelector('pre');
      const out = r.querySelector('.py-out');
      const btn = r.querySelector('.py-run-btn');
      const status = r.querySelector('.py-status');
      if (editor) editor.setAttribute('contenteditable', 'plaintext-only');
      btn.addEventListener('click', async () => {
        /* One-time security confirm before the first CDN download + run. */
        if (!confirmPyodide()) {
          if (status) status.textContent = 'Cancelled';
          return;
        }
        btn.disabled = true;
        if (status) status.textContent = 'Loading Python…';
        try {
          const py = await ensurePyodide();
          if (status) status.textContent = 'Running…';
          /* Capture stdout into a list */
          py.setStdout({
            batched: (line) => {
              out.textContent += line + '\n';
            },
          });
          out.textContent = '';
          out.classList.remove('err');
          const result = await py.runPythonAsync(editor.innerText);
          if (result !== undefined && result !== null && String(result) !== 'undefined') {
            out.textContent += '→ ' + result + '\n';
          }
          if (status) status.textContent = 'Done';
        } catch (err) {
          out.textContent = String(err);
          out.classList.add('err');
          if (status) status.textContent = 'Error';
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  /* ---------- slide:enter / slide:leave ----------
     These are now emitted by the deck engine (js/deck.js, in render()), which
     also performs the generic state resets so the contract holds in the
     presenter window too. lab.js is a pure CONSUMER: the per-feature
     initializers above attach their own slide:enter/leave listeners. We must
     NOT emit them here (that would double-fire). */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  document.addEventListener('deck:ready', () => {
    document.querySelectorAll('.slide[data-type="misconception"]').forEach(initMisconception);
    document.querySelectorAll('.slide[data-type="pause"]').forEach(initPause);
    document.querySelectorAll('.slide[data-type="derivation"]').forEach(initDerivation);
    document.querySelectorAll('.slide[data-type="reverse"], .slide[data-type="forward"]').forEach(initLayerStack);
    document.querySelectorAll('.slide').forEach(initCounterfactual);
    document.querySelectorAll('.typewriter').forEach(initTypewriter);
    bindRecallLinks();
    bindDevilAdvocate();
    initPyodideRunners();
  });

  window.LabExperimental = { showRecall, ensurePyodide };
})();
