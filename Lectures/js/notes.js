/* =========================================================
   PRESENTER NOTES — floating panel showing notes + next slide
   Read from <script type="application/json" id="speaker-notes">
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_notes) return;
  window.__lec_notes = 1;

  const $ = (s, el) => (el || document).querySelector(s);

  let notes = [];
  let panel = null;
  let visible = false;
  let clockId = null;
  let startTime = null;

  function loadNotes() {
    /* Prefer per-slide inline notes — <aside class="slide-notes"> or
       <aside data-notes> inside each .slide. Falls back to the legacy
       global JSON array <script id="speaker-notes">. */
    const out = [];
    const slides = document.querySelectorAll('.slide');
    let foundInline = 0;
    slides.forEach((slide, i) => {
      const aside = slide.querySelector('aside[data-notes], aside.slide-notes, .slide-notes');
      if (aside) {
        out[i] = aside.innerHTML.trim();
        foundInline++;
      }
    });
    if (foundInline > 0) return out;
    /* Fallback to global JSON. getElementById returns only the FIRST match, so
       on a concatenated multi-lecture deck the 2nd lecture's notes silently
       vanish. Collect EVERY <script id="speaker-notes"> in document order and
       concatenate their arrays so notes align with the flat slide list. */
    const tags = document.querySelectorAll('[id="speaker-notes"]');
    if (!tags.length) return [];
    const merged = [];
    tags.forEach((tag) => {
      try {
        const arr = JSON.parse(tag.textContent);
        if (Array.isArray(arr)) merged.push(...arr);
      } catch { /* skip malformed block */ }
    });
    return merged;
  }

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'presenter';
    panel.innerHTML = `
      <div class="presenter-head">
        <span>
          <span lang="ru">Заметки лектора</span>
          <span lang="en">Speaker notes</span>
        </span>
        <span class="presenter-clock" data-clock>00:00</span>
      </div>
      <div class="presenter-meta">
        <span data-presenter-slide>Slide 1</span>
        <span data-presenter-next style="color:#888"></span>
      </div>
      <div class="presenter-body" data-presenter-body>
        <p style="color:#666"><span lang="ru">Нет заметок для этого слайда.</span><span lang="en">No notes for this slide.</span></p>
      </div>
    `;
    const styles = document.createElement('style');
    styles.textContent = `
      .presenter .presenter-meta {
        display: flex; justify-content: space-between;
        font-family: var(--font-mono); font-size: 11px;
        margin-bottom: 10px; color: #888;
        text-transform: uppercase; letter-spacing: 0.08em;
      }
      .presenter-clock { font-variant-numeric: tabular-nums; color: var(--c-amber); }
    `;
    document.head.appendChild(styles);
    document.body.appendChild(panel);
    return panel;
  }

  function update() {
    if (!panel || !window.Lecture) return;
    const cur = window.Lecture.current;
    const total = window.Lecture.total;
    const slideEl = panel.querySelector('[data-presenter-slide]');
    const nextEl = panel.querySelector('[data-presenter-next]');
    const bodyEl = panel.querySelector('[data-presenter-body]');
    if (slideEl) slideEl.textContent = `Slide ${cur + 1} / ${total}`;
    if (nextEl) nextEl.textContent = cur + 1 < total ? `Next: ${cur + 2}` : 'Last slide';
    const note = notes[cur];
    if (bodyEl) {
      if (note) {
        /* If note was loaded from per-slide inline (already HTML), use it
           directly. The legacy JSON-array notes are plain text and need
           a lightweight markdown pass (**bold** / *italic*). */
        if (/[<][a-z]/i.test(note)) {
          bodyEl.innerHTML = note;
        } else {
          bodyEl.innerHTML = note
            .split(/\n\n+/)
            .map(p => `<p>${escapeHtml(p)
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')}</p>`)
            .join('');
        }
      } else {
        bodyEl.innerHTML = `<p style="color:#666"><span lang="ru">Нет заметок для этого слайда.</span><span lang="en">No notes for this slide.</span></p>`;
      }
    }
  }

  function startClock() {
    if (clockId) return;
    /* Capture the lecture start time ONCE and reuse it across panel toggles —
       pressing N twice (hide+show) must NOT rewind the clock to 00:00. The
       ticking interval is what we stop/start; elapsed time persists. */
    if (startTime == null) startTime = Date.now();
    const el = panel && panel.querySelector('[data-clock]');
    clockId = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const m = Math.floor(s / 60);
      if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
    }, 500);
  }
  function stopClock() { clearInterval(clockId); clockId = null; }

  function toggle(force) {
    notes = loadNotes();
    ensurePanel();
    const want = force === undefined ? !visible : !!force;
    visible = want;
    panel.classList.toggle('is-visible', visible);
    const tbBtn = document.querySelector('.toolbar [data-act="notes"]');
    if (tbBtn) tbBtn.classList.toggle('is-on', visible);
    if (visible) { update(); startClock(); }
    else { stopClock(); }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  document.addEventListener('deck:ready', () => {
    notes = loadNotes();
    if (window.Lecture && window.Lecture.onChange) {
      window.Lecture.onChange(() => { if (visible) update(); });
    }
  });

  window.PresenterNotes = { toggle };
})();
