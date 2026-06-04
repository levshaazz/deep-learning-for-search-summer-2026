/* =========================================================
   TWEAKS PANEL — live customization (vanilla JS, no React)
   Floating panel that lets the lecturer adjust visual params
   without editing CSS. State persists in localStorage.
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_tweaks) return;
  window.__lec_tweaks = 1;

  /* Don't run in the presenter window — there's no audience to tweak for. */
  if (new URL(location.href).searchParams.get('presenter') === '1') return;

  const LS_KEY = 'lecture.tweaks.v1';
  const DEFAULTS = {
    accent: '#2A6FDB',
    fontScale: 1.0,
    typePair: 'serif-sans',
    bgTint: 'cream',
    density: 'regular',
  };

  const ACCENTS = {
    '#2A6FDB': { name: 'Indigo',  ink: '#1B4FA0', soft: '#DCE8F8' },
    '#C9447A': { name: 'Magenta', ink: '#8A2050', soft: '#F6DCE5' },
    '#3A8A5C': { name: 'Forest',  ink: '#1F5535', soft: '#DDEDDF' },
    '#E0A82E': { name: 'Amber',   ink: '#8A6510', soft: '#F8ECCB' },
    '#7D5BA6': { name: 'Violet',  ink: '#4F3776', soft: '#E7DEF1' },
  };

  const TYPE_PAIRS = {
    'serif-sans': {
      label: 'Serif + Sans',
      sans: '"IBM Plex Sans", "Helvetica Neue", system-ui, sans-serif',
      serif: '"Newsreader", "Source Serif 4", Georgia, serif',
    },
    'sans-sans': {
      label: 'Sans only',
      sans: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
      serif: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
    },
    'mono-serif': {
      label: 'Mono headings',
      sans: '"IBM Plex Sans", system-ui, sans-serif',
      serif: '"JetBrains Mono", ui-monospace, monospace',
    },
  };

  const BG_TINTS = {
    cream: { name: 'Cream',     bg: '#FBFAF6', alt: '#F2EFE6', card: '#FFFFFF', inset: '#EBE7DA' },
    white: { name: 'White',     bg: '#FFFFFF', alt: '#F4F4F5', card: '#FFFFFF', inset: '#E5E7EB' },
    sand:  { name: 'Sand',      bg: '#F4EFE0', alt: '#EBE4CF', card: '#FFFCF1', inset: '#E0D7BB' },
    slate: { name: 'Slate',     bg: '#F2F4F8', alt: '#E5E9F0', card: '#FFFFFF', inset: '#D8DDE6' },
  };

  let state = load();

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
    catch { return Object.assign({}, DEFAULTS); }
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
  }

  function apply() {
    const root = document.documentElement;
    /* Accent — patch the trio of accent vars ONLY when the lecturer changed
       it from the default. Pinning it inline unconditionally would clobber
       the theme-specific accent (e.g. the brighter dark-theme blue) because
       an inline style beats the :root[data-theme="dark"] stylesheet block. */
    if (state.accent && state.accent !== DEFAULTS.accent) {
      const accent = ACCENTS[state.accent] || ACCENTS[DEFAULTS.accent];
      root.style.setProperty('--accent', state.accent);
      root.style.setProperty('--accent-ink', accent.ink);
      root.style.setProperty('--accent-soft', accent.soft);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-ink');
      root.style.removeProperty('--accent-soft');
    }

    /* Font scale — multiply every fs-* token */
    const scale = state.fontScale;
    const BASE = {
      '--fs-display': 132, '--fs-h1': 96, '--fs-h2': 72, '--fs-h3': 52,
      '--fs-lead': 44, '--fs-body': 38, '--fs-small': 30, '--fs-tiny': 24,
      '--fs-code': 32, '--fs-code-sm': 28, '--fs-math-big': 96, '--fs-math': 56,
      '--fs-quote': 64,
    };
    Object.entries(BASE).forEach(([k, v]) => {
      root.style.setProperty(k, Math.round(v * scale) + 'px');
    });

    /* Type pair */
    const pair = TYPE_PAIRS[state.typePair] || TYPE_PAIRS[DEFAULTS.typePair];
    root.style.setProperty('--font-sans', pair.sans);
    root.style.setProperty('--font-serif', pair.serif);

    /* Background tint — a LIGHT-theme concept. In dark theme we must REMOVE
       any previously-set inline --bg* so the dark stylesheet values win;
       otherwise a tint applied while light leaks into dark as an inline
       override (inline > stylesheet) and the slide surface stays light while
       text turns light → unreadable. This is why apply() must re-run on every
       theme toggle (see tools.js applyTheme → Tweaks.reapply). */
    if (root.dataset.theme !== 'dark') {
      const tint = BG_TINTS[state.bgTint] || BG_TINTS[DEFAULTS.bgTint];
      root.style.setProperty('--bg', tint.bg);
      root.style.setProperty('--bg-alt', tint.alt);
      root.style.setProperty('--bg-card', tint.card);
      root.style.setProperty('--bg-inset', tint.inset);
    } else {
      root.style.removeProperty('--bg');
      root.style.removeProperty('--bg-alt');
      root.style.removeProperty('--bg-card');
      root.style.removeProperty('--bg-inset');
    }

    /* Density — adjust slide padding */
    const DENSITY = {
      compact: { padX: 80,  padY: 56 },
      regular: { padX: 120, padY: 88 },
      comfy:   { padX: 160, padY: 112 },
    };
    const d = DENSITY[state.density] || DENSITY.regular;
    root.style.setProperty('--slide-pad-x', d.padX + 'px');
    root.style.setProperty('--slide-pad-top', d.padY + 'px');
    root.style.setProperty('--slide-pad-bottom', d.padY + 'px');

    /* Re-fit current slide because tokens changed */
    if (window.Lecture && window.Lecture.slides) {
      requestAnimationFrame(() => {
        const cur = window.Lecture.slides[window.Lecture.current];
        if (cur) cur.dispatchEvent(new CustomEvent('tweaks:applied'));
      });
    }
  }

  function setTweak(key, value) {
    state[key] = value;
    save();
    apply();
    paintPanel();
  }

  function resetAll() {
    state = Object.assign({}, DEFAULTS);
    save();
    apply();
    paintPanel();
  }

  /* ---------- Panel UI ---------- */
  let panel = null;
  function buildPanel() {
    panel = document.createElement('div');
    panel.className = 'tweaks-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Visual tweaks');
    panel.innerHTML = `
      <div class="tw-head">
        <span class="tw-title">
          <span lang="ru">Tweaks</span><span lang="en">Tweaks</span>
        </span>
        <button class="tw-close" type="button" aria-label="Close">✕</button>
      </div>

      <div class="tw-section">
        <div class="tw-label"><span lang="ru">Акцент</span><span lang="en">Accent</span></div>
        <div class="tw-swatches" data-tw-accent>
          ${Object.entries(ACCENTS).map(([hex, info]) => `
            <button type="button" data-accent="${hex}" style="background:${hex}" aria-label="${info.name}"></button>
          `).join('')}
        </div>
      </div>

      <div class="tw-section">
        <div class="tw-label">
          <span lang="ru">Размер шрифта</span><span lang="en">Font size</span>
          <span class="tw-value" data-tw-scale-val>1.00×</span>
        </div>
        <input type="range" data-tw-scale min="0.85" max="1.15" step="0.05">
      </div>

      <div class="tw-section">
        <div class="tw-label"><span lang="ru">Шрифты</span><span lang="en">Type pair</span></div>
        <div class="tw-segmented" data-tw-typepair>
          ${Object.entries(TYPE_PAIRS).map(([key, info]) => `
            <button type="button" data-typepair="${key}">${info.label}</button>
          `).join('')}
        </div>
      </div>

      <div class="tw-section">
        <div class="tw-label"><span lang="ru">Фон</span><span lang="en">Background</span></div>
        <div class="tw-swatches tw-bg-swatches" data-tw-bg>
          ${Object.entries(BG_TINTS).map(([key, info]) => `
            <button type="button" data-bg="${key}" style="background:${info.bg};border:1px solid ${info.inset}" aria-label="${info.name}"></button>
          `).join('')}
        </div>
      </div>

      <div class="tw-section">
        <div class="tw-label"><span lang="ru">Плотность</span><span lang="en">Density</span></div>
        <div class="tw-segmented" data-tw-density>
          <button type="button" data-density="compact"><span lang="ru">Компакт</span><span lang="en">Compact</span></button>
          <button type="button" data-density="regular"><span lang="ru">Обычно</span><span lang="en">Regular</span></button>
          <button type="button" data-density="comfy"><span lang="ru">Просторно</span><span lang="en">Comfy</span></button>
        </div>
      </div>

      <div class="tw-actions">
        <button type="button" class="tw-reset">
          <span lang="ru">Сбросить</span><span lang="en">Reset</span>
        </button>
      </div>
    `;
    document.body.appendChild(panel);

    /* Wire interactions */
    panel.querySelector('.tw-close').addEventListener('click', () => toggle(false));
    panel.querySelector('.tw-reset').addEventListener('click', resetAll);

    panel.querySelector('[data-tw-accent]').addEventListener('click', (e) => {
      const t = e.target.closest('[data-accent]'); if (t) setTweak('accent', t.dataset.accent);
    });
    panel.querySelector('[data-tw-scale]').addEventListener('input', (e) => {
      setTweak('fontScale', parseFloat(e.target.value));
    });
    panel.querySelector('[data-tw-typepair]').addEventListener('click', (e) => {
      const t = e.target.closest('[data-typepair]'); if (t) setTweak('typePair', t.dataset.typepair);
    });
    panel.querySelector('[data-tw-bg]').addEventListener('click', (e) => {
      const t = e.target.closest('[data-bg]'); if (t) setTweak('bgTint', t.dataset.bg);
    });
    panel.querySelector('[data-tw-density]').addEventListener('click', (e) => {
      const t = e.target.closest('[data-density]'); if (t) setTweak('density', t.dataset.density);
    });

    paintPanel();
  }

  function paintPanel() {
    if (!panel) return;
    panel.querySelectorAll('[data-accent]').forEach(b =>
      b.classList.toggle('is-on', b.dataset.accent === state.accent));
    panel.querySelectorAll('[data-typepair]').forEach(b =>
      b.classList.toggle('is-on', b.dataset.typepair === state.typePair));
    panel.querySelectorAll('[data-bg]').forEach(b =>
      b.classList.toggle('is-on', b.dataset.bg === state.bgTint));
    panel.querySelectorAll('[data-density]').forEach(b =>
      b.classList.toggle('is-on', b.dataset.density === state.density));
    const scaleEl = panel.querySelector('[data-tw-scale]');
    if (scaleEl) scaleEl.value = state.fontScale;
    const scaleVal = panel.querySelector('[data-tw-scale-val]');
    if (scaleVal) scaleVal.textContent = state.fontScale.toFixed(2) + '×';
  }

  function toggle(force) {
    if (!panel) buildPanel();
    const want = force === undefined ? !panel.classList.contains('is-visible') : !!force;
    panel.classList.toggle('is-visible', want);
    const btn = document.querySelector('.toolbar [data-act="tweaks"]');
    if (btn) btn.classList.toggle('is-on', want);
  }

  /* Apply on load (even without panel open). */
  apply();

  /* Integration: insert a Tweaks button into the toolbar after it's built. */
  document.addEventListener('deck:ready', () => {
    const tb = document.querySelector('.toolbar');
    if (tb && !tb.querySelector('[data-act="tweaks"]')) {
      const btn = document.createElement('button');
      btn.dataset.act = 'tweaks';
      btn.title = 'Visual tweaks (V)';
      btn.setAttribute('aria-label', 'Visual tweaks');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="3.5" y1="3.5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="20.5" y2="20.5"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/><line x1="3.5" y1="20.5" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="20.5" y2="3.5"/></svg>';
      btn.addEventListener('click', () => toggle());
      /* Place before the fullscreen button */
      const fs = tb.querySelector('[data-act="fullscreen"]');
      if (fs) tb.insertBefore(btn, fs);
      else tb.appendChild(btn);
    }

    /* Presenter window button — added once openPresenterWindow exists. We no
       longer assume presenter.js has finished by deck:ready (load order is not
       guaranteed); poll briefly and bail out if the API never shows up. */
    addPresenterButton();
  });

  function addPresenterButton() {
    const tb = document.querySelector('.toolbar');
    if (!tb || tb.querySelector('[data-act="presenter-win"]')) return true;
    if (!window.openPresenterWindow) return false;
    const btn = document.createElement('button');
    btn.dataset.act = 'presenter-win';
    btn.title = 'Open presenter window (Shift+N)';
    btn.setAttribute('aria-label', 'Open presenter window');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="12" y1="3" x2="12" y2="17"/></svg>';
    btn.addEventListener('click', () => window.openPresenterWindow());
    const fs = tb.querySelector('[data-act="fullscreen"]');
    if (fs) tb.insertBefore(btn, fs);
    else tb.appendChild(btn);
    return true;
  }

  /* Retry the presenter button a few times in case presenter.js defines
     window.openPresenterWindow AFTER our deck:ready handler ran. */
  function retryPresenterButton(tries) {
    if (addPresenterButton() || tries <= 0) return;
    setTimeout(() => retryPresenterButton(tries - 1), 120);
  }
  document.addEventListener('deck:ready', () => retryPresenterButton(8));

  /* Hotkeys — registered on the central keybinding registry (deck.js owns the
     single document keydown listener; it skips editable focus for us). */
  if (window.LectureKeys) {
    window.LectureKeys.register('v', () => toggle());
    /* Shift+N — open presenter window (declines if the API is absent so the
       registry can let another handler try the key). */
    window.LectureKeys.register('n', () => {
      if (!window.openPresenterWindow) return false;
      window.openPresenterWindow();
    }, { shift: true });
  }

  /* Re-run apply() against the CURRENT theme when the theme changes, so the
     bg-tint / accent inline overrides are re-evaluated for the new theme
     (fixes light→dark leaving a light --bg). Event-driven so tools.js need
     not reach into window.Tweaks directly and load order is irrelevant. */
  document.addEventListener('lecture:themechanged', apply);

  /* reapply kept for back-compat with any caller that still invokes it. */
  window.Tweaks = { toggle, setTweak, resetAll, reapply: apply, getState: () => ({ ...state }) };
})();
