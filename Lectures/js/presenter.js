/* =========================================================
   PRESENTER VIEW — second-window dashboard for the lecturer
   Same HTML file; URL `?presenter=1` switches into presenter
   UI. BroadcastChannel keeps the two windows in sync.
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_presenter) return;
  window.__lec_presenter = 1;

  const PARAM = 'presenter';
  const CHANNEL = 'lecture-deck-sync';

  function isPresenterWindow() {
    return new URL(location.href).searchParams.get(PARAM) === '1';
  }

  /* ---------- Main-window side: broadcast slide changes ---------- */
  function setupBroadcaster() {
    if (!('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel(CHANNEL);

    function broadcast() {
      if (!window.Lecture) return;
      const slide = window.Lecture.slides[window.Lecture.current];
      const step = slide && slide.hasAttribute('data-max-step')
        ? parseInt(slide.dataset.currentStep || '0', 10)
        : null;
      channel.postMessage({
        type: 'state',
        slide: window.Lecture.current,
        total: window.Lecture.total,
        step,
        ts: Date.now(),
      });
    }

    document.addEventListener('deck:ready', () => {
      window.Lecture.onChange(broadcast);
      broadcast();
    });
    /* Re-broadcast on stepper events too */
    document.addEventListener('slide:step', broadcast, true);
    /* Answer hellos from a freshly-opened presenter window */
    channel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'hello') broadcast();
    });
    /* Inbound nav from presenter window */
    channel.addEventListener('message', (e) => {
      if (!e.data || !window.Lecture) return;
      if (e.data.type === 'goto') window.Lecture.goTo(e.data.slide);
      if (e.data.type === 'next') window.Lecture.next();
      if (e.data.type === 'prev') window.Lecture.prev();
    });

    window._lectureBroadcastChannel = channel;
  }

  /* ---------- Presenter window: render the dashboard ---------- */
  function setupPresenterUI() {
    document.body.classList.add('is-presenter');
    document.title = 'Presenter · ' + document.title;

    /* Wait until deck.js wraps everything so we can read slide
       structure and re-render in our layout. */
    document.addEventListener('deck:ready', () => {
      buildPresenterShell();
      const channel = new BroadcastChannel(CHANNEL);
      // Hello — ask main window for current state
      channel.postMessage({ type: 'hello' });
      channel.addEventListener('message', (e) => {
        if (!e.data || e.data.type !== 'state') return;
        renderState(e.data);
      });

      /* Local keyboard nav still works (and is mirrored back). */
      document.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.isContentEditable || /input|textarea|select/i.test(t.tagName))) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault(); channel.postMessage({ type: 'next' });
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault(); channel.postMessage({ type: 'prev' });
        }
      });

      window._lectureBroadcastChannel = channel;
      startClock();
    });
  }

  function buildPresenterShell() {
    /* Hide the normal deck wholesale */
    const deck = document.querySelector('.deck');
    if (deck) deck.style.display = 'none';

    const root = document.createElement('div');
    root.className = 'presenter-view';
    root.innerHTML = `
      <header class="pv-header">
        <span class="pv-meta">
          <span class="pv-label" lang="ru">Лекция</span>
          <span class="pv-label" lang="en">Lecture</span>
          <span class="pv-slidepos" data-pv-pos>—</span>
        </span>
        <span class="pv-clock" data-pv-clock>00:00</span>
        <span class="pv-progress" data-pv-progress>—</span>
      </header>
      <main class="pv-main">
        <section class="pv-now">
          <div class="pv-section-head">
            <span lang="ru">Сейчас на экране</span>
            <span lang="en">Currently on screen</span>
          </div>
          <div class="pv-thumb pv-thumb-now" data-pv-thumb-now></div>
        </section>
        <section class="pv-notes">
          <div class="pv-section-head">
            <span lang="ru">Заметки лектора</span>
            <span lang="en">Speaker notes</span>
          </div>
          <div class="pv-notes-body" data-pv-notes></div>
        </section>
        <section class="pv-next">
          <div class="pv-section-head">
            <span lang="ru">Дальше</span>
            <span lang="en">Up next</span>
          </div>
          <div class="pv-thumb pv-thumb-next" data-pv-thumb-next></div>
          <div class="pv-step" data-pv-step></div>
        </section>
      </main>
    `;
    document.body.appendChild(root);
  }

  function renderState(state) {
    const slides = document.querySelectorAll('.slide');
    const cur = slides[state.slide];
    const nextSlide = slides[state.slide + 1] || null;
    if (!cur) return;

    const posEl = document.querySelector('[data-pv-pos]');
    if (posEl) posEl.textContent = `${state.slide + 1} / ${state.total}`;

    const progEl = document.querySelector('[data-pv-progress]');
    if (progEl) progEl.textContent = `${Math.round(((state.slide + 1) / state.total) * 100)}%`;

    renderThumb('[data-pv-thumb-now]', cur);
    renderThumb('[data-pv-thumb-next]', nextSlide);

    const notesEl = document.querySelector('[data-pv-notes]');
    if (notesEl) {
      const aside = cur.querySelector('aside.slide-notes, aside[data-notes]');
      let html = aside ? aside.innerHTML : '';
      /* Per-step note: prepend the step-specific note
         if one matches the current step. */
      if (state.step != null) {
        const stepNote = cur.querySelector(`aside[data-notes-for-step="${state.step}"]`);
        if (stepNote) {
          html = `<div class="pv-step-note"><strong>Step ${state.step}:</strong> ${stepNote.innerHTML}</div><hr>` + html;
        }
      }
      notesEl.innerHTML = html ||
        '<p class="pv-no-notes" lang="ru">Заметок нет.</p><p class="pv-no-notes" lang="en">No notes.</p>';
    }

    const stepEl = document.querySelector('[data-pv-step]');
    if (stepEl) {
      if (state.step != null && cur.hasAttribute('data-max-step')) {
        stepEl.textContent = `Step ${state.step} / ${cur.dataset.maxStep}`;
        stepEl.style.display = '';
      } else {
        stepEl.style.display = 'none';
      }
    }
  }

  function renderThumb(selector, slide) {
    const wrap = document.querySelector(selector);
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!slide) {
      wrap.classList.add('is-empty');
      return;
    }
    wrap.classList.remove('is-empty');
    /* Clone the slide so layout/animations don't affect the live deck */
    const clone = slide.cloneNode(true);
    clone.classList.add('is-active');
    clone.style.cssText = 'position: absolute; inset: 0; width: 1920px; height: 1080px;';
    wrap.appendChild(clone);
  }

  /* ---------- Lecturer-running clock ---------- */
  function startClock() {
    const el = document.querySelector('[data-pv-clock]');
    if (!el) return;
    const start = Date.now();
    setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
  }

  /* ---------- Entrypoint ---------- */
  if (isPresenterWindow()) {
    setupPresenterUI();
  } else {
    setupBroadcaster();
    /* Expose a helper to open the presenter window from the toolbar */
    window.openPresenterWindow = function () {
      const url = new URL(location.href);
      url.searchParams.set(PARAM, '1');
      window.open(url.toString(), 'lecture-presenter', 'width=1200,height=800');
    };
  }
})();
