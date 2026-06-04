/* =========================================================
   LECTURE TOOLS — i18n, theme, toolbar, hidden, timer, QR,
   TOC popover, code runner, progress bar
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_tools) return;
  window.__lec_tools = 1;

  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  const LS_KEY = 'lecture.template.prefs.v1';
  const prefs = loadPrefs();

  function loadPrefs() {
    try {
      return Object.assign({ lang: 'ru', theme: 'light' },
        JSON.parse(localStorage.getItem(LS_KEY) || '{}'));
    } catch { return { lang: 'ru', theme: 'light' }; }
  }
  function savePrefs() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)); } catch {}
  }

  function applyLang(lang) {
    prefs.lang = lang;
    document.documentElement.dataset.lang = lang;
    /* Sync the document lang attribute for screen readers — without
       this they read all content with the same locale's phonetics. */
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';
    savePrefs();
    updateToolbarState();
    if (typeof syncDocTitle === 'function') syncDocTitle();
  }
  function applyTheme(theme) {
    prefs.theme = theme;
    document.documentElement.dataset.theme = theme;
    savePrefs();
    /* Announce the theme change as a document event instead of reaching into
       window.Tweaks directly — this de-couples load order (tweaks.js may load
       after tools.js). tweaks.js listens and re-runs its apply() pass so the
       inline background/accent overrides are re-evaluated for the new theme
       (without this a light-theme tint leaks into dark mode and the slide
       surface stays light). */
    document.dispatchEvent(new CustomEvent('lecture:themechanged', { detail: { theme } }));
    updateToolbarState();
  }

  /* ---------------- Toolbar ---------------- */
  let toolbarVisible = false;
  function ensureToolbar() {
    if ($('.toolbar')) return $('.toolbar');
    const tb = document.createElement('div');
    tb.className = 'toolbar';
    tb.innerHTML = `
      <button data-act="prev" title="Previous (←)" aria-label="Previous">${icon('arrow-left')}</button>
      <span class="toolbar-slide-num"><span data-tb-num>1</span> / <span data-tb-total>—</span></span>
      <button data-act="next" title="Next (→)" aria-label="Next">${icon('arrow-right')}</button>
      <span class="toolbar-sep"></span>
      <button data-act="overview" title="Overview (O)" aria-label="Overview">${icon('grid')}</button>
      <button data-act="toc" title="Table of contents" aria-label="TOC">${icon('list')}</button>
      <span class="toolbar-sep"></span>
      <button data-act="lang" title="Toggle language" aria-label="Language"><span data-lang-label>RU</span></button>
      <button data-act="theme" title="Toggle theme" aria-label="Theme">${icon('sun')}</button>
      <span class="toolbar-sep"></span>
      <button data-act="pen" title="Pen (P)" aria-label="Pen">${icon('pen')}</button>
      <button data-act="notes" title="Presenter notes (N)" aria-label="Notes">${icon('note')}</button>
      <button data-act="fullscreen" title="Fullscreen (F)" aria-label="Fullscreen">${icon('expand')}</button>
    `;
    document.body.appendChild(tb);

    tb.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]'); if (!btn) return;
      const act = btn.dataset.act;
      switch (act) {
        case 'prev': window.Lecture.prev(); break;
        case 'next': window.Lecture.next(); break;
        case 'overview': window.Lecture.toggleOverview(); break;
        case 'toc': toggleTocPop(); break;
        case 'lang': applyLang(prefs.lang === 'ru' ? 'en' : 'ru'); break;
        case 'theme': applyTheme(prefs.theme === 'light' ? 'dark' : 'light'); break;
        case 'pen': window.Pen && window.Pen.toggle(); break;
        case 'notes': window.PresenterNotes && window.PresenterNotes.toggle(); break;
        case 'fullscreen': toggleFullscreen(); break;
      }
    });

    // Mouse move to show toolbar
    let hideTimer;
    function showToolbar() {
      tb.classList.add('is-visible');
      toolbarVisible = true;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        tb.classList.remove('is-visible');
        toolbarVisible = false;
      }, 2500);
    }
    document.addEventListener('mousemove', showToolbar);
    /* T — reveal the toolbar. Registered on the central keybinding registry. */
    if (window.LectureKeys) window.LectureKeys.register('t', () => showToolbar());
    showToolbar();

    return tb;
  }

  function updateToolbarState() {
    const tb = $('.toolbar'); if (!tb) return;
    const langBtn = tb.querySelector('[data-act="lang"] [data-lang-label]');
    if (langBtn) langBtn.textContent = prefs.lang === 'ru' ? 'RU' : 'EN';
    const themeBtn = tb.querySelector('[data-act="theme"]');
    if (themeBtn) {
      themeBtn.innerHTML = prefs.theme === 'light' ? icon('moon') : icon('sun');
    }
    if (window.Lecture) {
      const num = tb.querySelector('[data-tb-num]');
      const tot = tb.querySelector('[data-tb-total]');
      if (num) num.textContent = window.Lecture.current + 1;
      if (tot) tot.textContent = window.Lecture.total;
    }
  }

  /* ---------------- Icons (inline SVG) ---------------- */
  function icon(name) {
    const o = {
      'arrow-left':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
      'arrow-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
      'grid':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
      'list':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
      'sun':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>',
      'moon':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      'pen':         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
      'note':        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>',
      'expand':      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v4a2 2 0 0 0 2 2h4"/><path d="M20 10V6a2 2 0 0 0-2-2h-4"/><path d="M14 20h4a2 2 0 0 0 2-2v-4"/><path d="M10 4H6a2 2 0 0 0-2 2v4"/></svg>',
    };
    return o[name] || '';
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen && document.exitFullscreen();
    }
  }

  /* ---------------- TOC popover ---------------- */
  /* Focus management — when the popover opens, focus the first link;
     restore previous focus on close. Trap Tab inside the dialog. */
  let _tocLastFocus = null;
  function buildTocPop() {
    if ($('.toc-pop')) return;
    const slides = window.Lecture.slides;
    const pop = document.createElement('div');
    pop.className = 'toc-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-labelledby', 'toc-pop-title');
    pop.tabIndex = -1;
    pop.innerHTML = `
      <div class="toc-pop-inner">
        <h3 id="toc-pop-title">
          <span lang="ru">Перейти к слайду</span>
          <span lang="en">Jump to slide</span>
        </h3>
        <div class="toc-pop-list"></div>
      </div>
    `;
    const list = pop.querySelector('.toc-pop-list');
    slides.forEach((s, i) => {
      const titleEl = s.querySelector('h1, h2, h3, .quiz-q, blockquote');
      const titleText = titleEl ? titleEl.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : `Slide ${i + 1}`;
      const row = document.createElement('a');
      row.className = 'toc-pop-row';
      row.href = '#/' + (i + 1);
      row.innerHTML = `
        <span class="pop-num">${String(i + 1).padStart(2,'0')}</span>
        <span class="pop-title">${escapeHtml(titleText)}</span>
        <span class="pop-type">${s.dataset.type || ''}</span>
      `;
      row.addEventListener('click', (e) => {
        e.preventDefault();
        window.Lecture.goTo(i);
        toggleTocPop(false);
      });
      list.appendChild(row);
    });
    pop.addEventListener('click', (e) => {
      if (e.target === pop) toggleTocPop(false);
    });
    /* Trap Tab + Escape inside */
    pop.addEventListener('keydown', (e) => {
      if (!pop.classList.contains('is-visible')) return;
      if (e.key === 'Escape') { e.preventDefault(); toggleTocPop(false); return; }
      if (e.key !== 'Tab') return;
      const focusables = pop.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    document.body.appendChild(pop);
  }

  function toggleTocPop(force) {
    const pop = $('.toc-pop'); if (!pop) return;
    const want = force === undefined ? !pop.classList.contains('is-visible') : !!force;
    if (want === pop.classList.contains('is-visible')) return;
    pop.classList.toggle('is-visible', want);
    if (want) {
      _tocLastFocus = document.activeElement;
      const first = pop.querySelector('.toc-pop-row');
      if (first) first.focus();
    } else {
      if (_tocLastFocus && _tocLastFocus.focus) _tocLastFocus.focus();
      _tocLastFocus = null;
    }
  }

  /* ---------------- Hidden answers ---------------- */
  /* Two markup styles supported:
     • <details class="hidden-answer"> ... </details> — native a11y
     • <div class="hidden-answer">…<button class="ha-reveal">…</button>…</div>
       (legacy; we toggle .is-revealed) */
  function bindHiddenAnswers() {
    $$('div.hidden-answer').forEach((ha) => {
      if (ha.dataset.bound) return;
      ha.dataset.bound = '1';
      const btn = ha.querySelector('.ha-reveal');
      if (btn) {
        btn.addEventListener('click', () => {
          ha.classList.add('is-revealed');
          /* Re-fit so a revealed answer can't overflow the slide bounds
             (native <details> get this via deck.js's toggle listener). */
          if (window.Lecture && window.Lecture.refit) window.Lecture.refit();
        });
      }
    });
    /* <details> needs no JS — native browser behaviour. */
  }

  /* ---------------- Quiz (multi-attempt feedback) ----------------
     Click a WRONG option → it turns red and is eliminated, but the correct
     answer is NOT revealed — other options stay clickable so students keep
     trying. Click the CORRECT option → it turns green and the group locks.
     Reads data-correct to mark the chosen option right or wrong. */
  function bindQuiz() {
    $$('.quiz-option').forEach((opt) => {
      if (opt.dataset.bound) return;
      opt.dataset.bound = '1';
      if (!opt.hasAttribute('role')) opt.setAttribute('role', 'button');
      if (!opt.hasAttribute('tabindex')) opt.setAttribute('tabindex', '0');

      const answer = () => {
        const parent = opt.closest('.quiz-options');
        if (!parent || parent.classList.contains('is-solved')) return;
        if (opt.classList.contains('is-wrong')) return; // already eliminated
        if (opt.dataset.correct === 'true') {
          opt.classList.add('is-correct');
          opt.setAttribute('aria-pressed', 'true');
          parent.classList.add('is-solved');
        } else {
          opt.classList.add('is-wrong');
          opt.setAttribute('aria-disabled', 'true');
        }
      };
      opt.addEventListener('click', answer);
      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answer(); }
      });
    });
  }

  /* ---------------- Timer ---------------- */
  function bindTimers() {
    $$('.timer').forEach((t) => {
      if (t.dataset.bound) return;
      t.dataset.bound = '1';
      const display = t.querySelector('.timer-display');
      const startBtn = t.querySelector('[data-act="start"]');
      const resetBtn = t.querySelector('[data-act="reset"]');
      const init = parseInt(t.dataset.seconds || '300', 10);
      let remaining = init, intId = null, running = false;

      function fmt(s) {
        const m = Math.floor(s / 60), sec = s % 60;
        return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
      }
      function paint() {
        display.textContent = fmt(remaining);
        t.classList.toggle('is-warning', remaining > 0 && remaining <= Math.min(30, init * 0.2));
        t.classList.toggle('is-finished', remaining === 0);
      }
      function tick() {
        if (remaining > 0) { remaining--; paint(); }
        if (remaining === 0) { clearInterval(intId); running = false; startBtn.textContent = startBtn.dataset.startLabel || 'Start'; }
      }
      function toggle() {
        if (running) { clearInterval(intId); running = false; startBtn.textContent = startBtn.dataset.startLabel || 'Start'; }
        else if (remaining > 0) {
          intId = setInterval(tick, 1000); running = true;
          startBtn.textContent = startBtn.dataset.pauseLabel || 'Pause';
        }
      }
      function reset() {
        clearInterval(intId); running = false; remaining = init; paint();
        startBtn.textContent = startBtn.dataset.startLabel || 'Start';
      }
      startBtn && startBtn.addEventListener('click', toggle);
      resetBtn && resetBtn.addEventListener('click', reset);
      paint();
    });
  }

  /* ---------------- Code runner (JS in-browser) ---------------- */
  function bindCodeRunners() {
    $$('.code-runner').forEach((cr) => {
      if (cr.dataset.bound) return;
      cr.dataset.bound = '1';
      const pre = cr.querySelector('pre[contenteditable]') || cr.querySelector('pre');
      if (pre) pre.setAttribute('contenteditable', 'plaintext-only');
      const runBtn = cr.querySelector('.runner-run-btn');
      const out = cr.querySelector('.runner-out');
      function run() {
        if (!pre || !out) return;
        const code = pre.innerText;
        out.textContent = '';
        out.classList.remove('err');
        const logs = [];
        const origLog = console.log;
        const fakeLog = (...a) => logs.push(a.map(s => typeof s === 'object' ? JSON.stringify(s) : String(s)).join(' '));
        try {
          /* Runs locally-authored code with a shadowed console; not isolated
             from window — only evaluate trusted (author/local) input. */
          const fn = new Function('console', code);
          const result = fn({ log: fakeLog, error: (...a) => { fakeLog('Error:', ...a); }, warn: fakeLog, info: fakeLog });
          if (result !== undefined) logs.push('→ ' + (typeof result === 'object' ? JSON.stringify(result) : String(result)));
        } catch (err) {
          out.classList.add('err');
          logs.push(String(err));
        } finally {
          out.textContent = logs.join('\n') || '(no output)';
        }
      }
      runBtn && runBtn.addEventListener('click', run);
    });
  }

  /* ---------------- QR codes (uses qrcode-generator from CDN) ---------------- */
  function renderQRs() {
    if (typeof qrcode === 'undefined') return; // CDN not loaded yet
    $$('.qr-canvas[data-qr]').forEach((el) => {
      if (el.dataset.qrRendered) return;
      const text = el.dataset.qr;
      if (!text) return;
      try {
        const q = qrcode(0, 'M');
        q.addData(text);
        q.make();
        el.innerHTML = q.createSvgTag({ scalable: true, margin: 1 });
        el.dataset.qrRendered = '1';
      } catch (e) { console.warn('QR error', e); }
    });
  }

  /* ---------------- Progress bar ---------------- */
  function ensureProgressBar() {
    if ($('.progress-bar')) return;
    const pb = document.createElement('div');
    pb.className = 'progress-bar';
    pb.innerHTML = '<div class="progress-fill"></div>';
    $('.stage').appendChild(pb);
  }
  function updateProgress() {
    const fill = $('.progress-bar .progress-fill');
    if (!fill || !window.Lecture) return;
    const pct = ((window.Lecture.current + 1) / window.Lecture.total) * 100;
    fill.style.width = pct + '%';
  }

  /* ---------------- Logo slot ---------------- */
  function applyLogoSlot() {
    const courseLabel = $('[data-meta-course]') ? $('[data-meta-course]').textContent.trim() : '';
    const sectionLabels = (slide) => {
      // Section = nearest preceding [data-type="divider"] h1
      // Returns { ru, en } so both languages can be injected and the
      // CSS [lang] selector handles the toggle live.
      let s = slide.previousElementSibling;
      while (s) {
        if (s.dataset && s.dataset.type === 'divider') {
          const get = (lang) => {
            const h = s.querySelector('h1 [lang="' + lang + '"]');
            if (!h) return '';
            // Replace any <br ...> (even with attributes like data-om-id) with a space,
            // then strip all other tags.
            const txt = h.innerHTML.replace(/<br[^>]*>/gi, ' ').replace(/<[^>]+>/g, '');
            return txt.replace(/\s+/g, ' ').trim();
          };
          return { ru: get('ru'), en: get('en') };
        }
        s = s.previousElementSibling;
      }
      return { ru: '', en: '' };
    };

    $$('.slide').forEach((slide) => {
      // logo slot — resolve the logo template scoped to this slide's OWN deck
      // (getElementById would always return the FIRST #tpl-logo, so a
      // concatenated multi-lecture deck would paint lecture 1's logo
      // everywhere). Prefer a template inside the slide's .slides container,
      // falling back to the first one in the document.
      const logoSlot = slide.querySelector('[data-logo-slot]');
      if (logoSlot && !logoSlot.dataset.applied) {
        const scope = slide.closest('.slides') || document;
        const tpl = scope.querySelector('[id="tpl-logo"]') || $('[id="tpl-logo"]');
        if (tpl) logoSlot.innerHTML = tpl.innerHTML;
        logoSlot.dataset.applied = '1';
      }
      // section breadcrumb
      const secEl = slide.querySelector('[data-frame-section]');
      if (secEl) {
        const labels = sectionLabels(slide);
        if (labels.ru || labels.en) {
          secEl.innerHTML = `<span lang="ru">${escapeHtml(labels.ru)}</span><span lang="en">${escapeHtml(labels.en)}</span>`;
        } else {
          secEl.textContent = (slide.dataset.type || '').toUpperCase();
        }
      }
      // course breadcrumb
      const cEl = slide.querySelector('[data-frame-course]');
      if (cEl) {
        const ru = slide.parentElement.dataset.courseRu || '';
        const en = slide.parentElement.dataset.courseEn || '';
        cEl.innerHTML = `<span lang="ru">${escapeHtml(ru)}</span><span lang="en">${escapeHtml(en)}</span>`;
      }
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------- Document title ---------------- */
  function syncDocTitle() {
    /* Pull the deck's title from the title slide's h1 (preferring the
       currently-displayed language), falling back to <title>. */
    const titleSlide = document.querySelector('.slide[data-type="title"] h1');
    if (!titleSlide) return;
    const lang = prefs.lang || 'ru';
    const span = titleSlide.querySelector(`[lang="${lang}"]`) || titleSlide;
    // Replace any <br> with a space so multi-line titles read correctly.
    const txt = span.innerHTML
      .replace(/<br[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!txt) return;
    const slides = document.querySelector('.slides');
    const course = slides ?
      (lang === 'en' ? slides.dataset.courseEn : slides.dataset.courseRu) || ''
      : '';
    document.title = course ? `${txt} · ${course}` : txt;
  }

  /* ---------------- Mobile warning ---------------- */
  function ensureMobileWarning() {
    if ($('.mobile-warning')) return;
    const w = document.createElement('div');
    w.className = 'mobile-warning';
    w.innerHTML = `
      <div class="mw-inner">
        <div class="mw-icon">⚠</div>
        <h3>
          <span lang="ru">Презентация для большого экрана</span>
          <span lang="en">Designed for a large screen</span>
        </h3>
        <p>
          <span lang="ru">Темплейт рассчитан на лекционную проекцию (1920×1080). На небольших экранах текст может быть нечитаемым.</span>
          <span lang="en">This deck targets lecture-hall projection (1920×1080). Small screens may render text below the readable threshold.</span>
        </p>
        <button class="mw-dismiss">
          <span lang="ru">Всё равно показать</span>
          <span lang="en">Show anyway</span>
        </button>
      </div>
    `;
    document.body.appendChild(w);
    w.querySelector('.mw-dismiss').addEventListener('click', () => {
      try { localStorage.setItem('lecture.mw.dismissed', '1'); } catch {}
      w.classList.remove('is-visible');
    });
    function check() {
      const dismissed = (() => {
        try { return localStorage.getItem('lecture.mw.dismissed') === '1'; } catch { return false; }
      })();
      const tooSmall = window.innerWidth < 640 || window.innerHeight < 400;
      w.classList.toggle('is-visible', tooSmall && !dismissed);
    }
    check();
    window.addEventListener('resize', check);
  }

  /* ---------------- Init wiring ---------------- */
  document.addEventListener('deck:ready', () => {
    applyLang(prefs.lang);
    applyTheme(prefs.theme);
    ensureToolbar();
    ensureProgressBar();
    ensureMobileWarning();
    buildTocPop();
    bindHiddenAnswers();
    bindQuiz();
    bindTimers();
    bindCodeRunners();
    renderQRs();
    applyLogoSlot();
    syncDocTitle();
    updateToolbarState();
    updateProgress();

    // Kbd hint
    const hint = document.createElement('div');
    hint.className = 'kbd-hint';
    hint.innerHTML = `<kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>O</kbd> overview · <kbd>T</kbd> tools`;
    document.body.appendChild(hint);
    hint.classList.add('is-visible');
    setTimeout(() => hint.classList.remove('is-visible'), 4500);

    // Hotkeys for tools — registered on the central keybinding registry
    // (it handles the editable-focus skip and Space/Enter fall-through).
    if (window.LectureKeys) {
      window.LectureKeys.register('l', () => applyLang(prefs.lang === 'ru' ? 'en' : 'ru'));
      window.LectureKeys.register('d', () => applyTheme(prefs.theme === 'light' ? 'dark' : 'light'));
      window.LectureKeys.register('f', () => toggleFullscreen());
    }
  });

  window.Lecture = window.Lecture || {};
  window.Lecture.onChange && window.Lecture.onChange((i) => { updateToolbarState(); updateProgress(); });
  document.addEventListener('deck:ready', () => {
    window.Lecture.onChange((i) => { updateToolbarState(); updateProgress(); });
  });

  // Expose
  window.LectureTools = { applyLang, applyTheme, toggleTocPop, renderQRs };
})();
