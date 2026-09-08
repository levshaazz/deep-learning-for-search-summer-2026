/* =========================================================
   HANDOUT — linear notes/answers export (?handout=1)
   Renders a single scrollable, print-friendly document with, per slide:
     • the slide title (first h1/h2, else data-screen-label)
     • speaker notes (aside.slide-notes) + per-step notes (aside[data-notes-for-step])
     • revealed hidden answers (details.hidden-answer .ha-content)
     • the misconception truth (.misc-truth)
   Slide chrome / transforms / animations are dropped; the result is
   Cmd+P friendly (a flat answer key, not a deck snapshot).

   Robust by design: it only READS existing DOM, never mutates the deck, and
   bails out quietly (leaving the normal deck) if the param is absent.
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_handout) return;
  window.__lec_handout = 1;

  function wantsHandout() {
    try {
      const p = new URLSearchParams(location.search);
      return p.get('handout') === '1' || p.has('handout') && p.get('handout') !== '0';
    } catch { return false; }
  }
  if (!wantsHandout()) return;

  const $  = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* Build the title node for a slide. Prefer the first heading, cloning its
     markup so bilingual <span lang> pairs survive (CSS then shows only the
     active language — flattening to textContent would print BOTH). Falls
     back to the data-screen-label as plain text. */
  function appendTitle(into, slide) {
    const h = slide.querySelector('.slide-header h1, .slide-header h2, h1, h2');
    if (h && (h.textContent || '').trim()) {
      // Move the heading's inline children (incl. lang spans) into `into`.
      cleanClone(h).childNodes.forEach((n) => into.appendChild(n.cloneNode(true)));
      return;
    }
    into.appendChild(document.createTextNode(slide.getAttribute('data-screen-label') || 'Slide'));
  }

  /* Clone a fragment of author HTML, stripping interactive-only buttons so
     the printed answer key stays clean. Keeps bilingual <span lang> pairs
     intact — the page's data-lang still hides the inactive one in print. */
  function cleanClone(node) {
    const c = node.cloneNode(true);
    c.querySelectorAll('button, .misc-reveal-btn, .ha-reveal').forEach((b) => b.remove());
    return c;
  }

  function build() {
    const slides = $$('.slide');
    if (!slides.length) return;

    const doc = document.createElement('main');
    doc.className = 'handout-doc';

    const head = document.createElement('header');
    head.className = 'handout-head';
    head.innerHTML =
      '<h1>' +
        '<span lang="ru">Конспект лекции — заметки и ответы</span>' +
        '<span lang="en">Lecture handout — notes &amp; answers</span>' +
      '</h1>' +
      '<p class="handout-sub">' +
        '<span lang="ru">Линейная версия для печати. Каждый слайд — заголовок, заметки лектора и раскрытые ответы.</span>' +
        '<span lang="en">Linear, print-friendly version. Per slide: title, speaker notes, and revealed answers.</span>' +
      '</p>';
    doc.appendChild(head);

    slides.forEach((slide, i) => {
      const sec = document.createElement('section');
      sec.className = 'handout-slide';

      const h = document.createElement('h2');
      h.className = 'handout-slide-title';
      const num = document.createElement('span');
      num.className = 'handout-num';
      num.textContent = String(i + 1).padStart(2, '0');
      h.appendChild(num);
      h.appendChild(document.createTextNode(' '));
      appendTitle(h, slide);
      sec.appendChild(h);

      let added = false;

      /* Main speaker notes. */
      const mainNote = slide.querySelector('aside.slide-notes, aside[data-notes]');
      if (mainNote && mainNote.innerHTML.trim()) {
        const blk = document.createElement('div');
        blk.className = 'handout-notes';
        blk.appendChild(cleanClone(mainNote));
        sec.appendChild(blk);
        added = true;
      }

      /* Per-step notes (e2e etc.) — labelled by their step number. */
      $$('aside[data-notes-for-step]', slide).forEach((aside) => {
        if (!aside.innerHTML.trim()) return;
        const blk = document.createElement('div');
        blk.className = 'handout-notes handout-step-note';
        const lbl = document.createElement('span');
        lbl.className = 'handout-step-label';
        lbl.textContent = 'Step ' + aside.getAttribute('data-notes-for-step');
        blk.appendChild(lbl);
        blk.appendChild(cleanClone(aside));
        sec.appendChild(blk);
        added = true;
      });

      /* Revealed hidden answers + misconception truth — the "answer key". */
      const answers = $$('.hidden-answer .ha-content, .misc-truth', slide);
      answers.forEach((ans) => {
        const blk = document.createElement('div');
        blk.className = 'handout-answer';
        const lbl = document.createElement('span');
        lbl.className = 'handout-answer-label';
        lbl.innerHTML = '<span lang="ru">Ответ</span><span lang="en">Answer</span>';
        blk.appendChild(lbl);
        blk.appendChild(cleanClone(ans));
        sec.appendChild(blk);
        added = true;
      });

      if (!added) {
        const none = document.createElement('p');
        none.className = 'handout-empty';
        none.innerHTML = '<span lang="ru">— нет заметок —</span><span lang="en">— no notes —</span>';
        sec.appendChild(none);
      }

      doc.appendChild(sec);
    });

    /* Replace the deck shell with the linear document. We hide (not remove)
       the deck so any already-bound module doesn't throw on a missing node. */
    const deck = $('.deck');
    if (deck) deck.style.display = 'none';
    document.documentElement.classList.add('is-handout');
    document.body.classList.add('is-handout');
    document.body.appendChild(doc);

    /* Re-typeset math inside the cloned fragments if KaTeX is present. */
    function typeset() {
      if (typeof window.renderMathInElement === 'function') {
        try {
          window.renderMathInElement(doc, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false, strict: 'ignore'
          });
        } catch {}
      }
    }
    // KaTeX may fire before or after us; cover both.
    if (window.renderMathInElement) typeset();
    document.addEventListener('katex:done', typeset);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
