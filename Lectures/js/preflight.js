/* =========================================================
   PRE-FLIGHT CHECK — validate deck on load.
   Surfaces warnings as a discreet overlay so lecturers see them
   BEFORE the lecture starts, not silently in DevTools.

   What it validates:
     • Every [data-step="N"] sits inside a [data-max-step="M"] where N ≤ M.
     • Every walkthrough/derivation/reverse slide has valid stepping markup.
     • `data-pause-seconds` is a positive integer.
     • Every `.recall-link[data-recall="N"]` points to an existing slide.
     • Every `.cf-toggle-bar[data-cf-group="X"]` has matching `.cf-variant`s.
     • Every interactive-demo has a valid `kind`.
     • Per-slide speaker notes exist where lecturer might expect them
       (informational, not error).
   ========================================================= */
(function () {
  'use strict';

  /* Double-include guard. */
  if (window.__lec_preflight) return;
  window.__lec_preflight = 1;

  const params = new URL(location.href).searchParams;
  if (params.get('presenter') === '1') return;

  /* The on-screen overlay is a lecturer's tool, not something students should
     see during a show — it is OPT-IN via ?preflight=1. Without the flag the
     checks still run (console group only) and window.__preflight.runChecks()
     stays available, so the CI gates (wbw-check, ci-gate, preflight-corner,
     archflow-negative) keep working on flag-less URLs. */
  const SHOW_OVERLAY = params.get('preflight') === '1';

  const KNOWN_DEMO_KINDS = ['function-plot', 'distribution'];
  /* Warn when auto-fit drops below this — matches deck.js's own console
     threshold and the README ("при scale < 0.65 … warning"). Above this the
     slide is merely a touch scaled (still ≥~25px body); flagging it produced
     false positives on perfectly readable slides. Genuine content CLIPPING
     (scale wanted < 0.5 floor) is reported separately as an ERROR via
     data-auto-fit-clipped below. */
  const FIT_WARN = 0.65;
  /* The "too dense → split" nudge applies only to PROSE slides. Figure/diagram/refs types
     (viz/archflow/arch/e2e/walkthrough/refs/…) fit-scale by design — their small text is
     labels or a bibliography, not body prose — so a low auto-fit there is not a defect.
     (Matches _audit/legibility-gate.mjs G22's prose scope.) A CLIPPED slide is still an
     error for every type, since content actually cut off is always wrong. */
  const PROSE_TYPES = new Set(['two-col', 'table', 'definition', 'formula', 'default',
    'misconception', 'theorem', 'quote', 'derivation', 'code', 'sequence', 'funnel']);

  document.addEventListener('deck:ready', () => {
    setTimeout(runChecks, 800);
    /* Auto-fit scales are written by deck.js asynchronously (after KaTeX
       typesets + fonts settle). Re-run once those are in so the density
       check sees final scales. The overlay/console are idempotent. */
    document.addEventListener('katex:done', () => setTimeout(runChecks, 200));
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => setTimeout(runChecks, 250)).catch(() => {});
    }
  });

  function runChecks() {
    const issues = [];
    const slides = [...document.querySelectorAll('.slide')];

    slides.forEach((slide, i) => {
      const idx = i + 1;
      const label = slide.dataset.screenLabel || `Slide ${idx}`;

      /* Steps inside max-step bounds */
      if (slide.hasAttribute('data-max-step')) {
        const max = parseInt(slide.dataset.maxStep, 10);
        if (!Number.isFinite(max) || max < 0) {
          issues.push({
            sev: 'error', slide: label,
            msg: `data-max-step="${slide.dataset.maxStep}" is not a non-negative integer`,
          });
        }
        slide.querySelectorAll('[data-step]').forEach((el) => {
          const n = parseInt(el.dataset.step, 10);
          if (!Number.isFinite(n)) {
            issues.push({
              sev: 'error', slide: label,
              msg: `[data-step="${el.dataset.step}"] is not a valid integer`,
            });
          } else if (n < 0 || n > max) {
            issues.push({
              sev: 'error', slide: label,
              msg: `[data-step="${n}"] is outside [0, ${max}] of data-max-step`,
            });
          }
        });
      } else {
        /* No max-step but the slide has step elements — common authoring
           mistake. Walkthrough/derivation/reverse types auto-add max-step,
           so we only warn for other types. */
        const stepEls = slide.querySelectorAll('[data-step]');
        if (stepEls.length > 0 &&
            !['walkthrough','derivation','reverse','e2e'].includes(slide.dataset.type)) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `${stepEls.length} [data-step] elements but slide has no data-max-step`,
          });
        }
      }

      /* Pause seconds */
      if (slide.dataset.type === 'pause') {
        const sec = parseInt(slide.dataset.pauseSeconds || '30', 10);
        if (!Number.isFinite(sec) || sec <= 0 || sec > 600) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `data-pause-seconds="${slide.dataset.pauseSeconds}" — should be 1..600`,
          });
        }
      }

      /* Walkthrough/E2E sanity */
      if (['walkthrough', 'e2e'].includes(slide.dataset.type)) {
        const steps = slide.querySelectorAll('.walk-step, .e2e-step');
        if (steps.length === 0) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `data-type="${slide.dataset.type}" has no .walk-step / .e2e-step children`,
          });
        }
      }

      /* recall-link → existing slide */
      slide.querySelectorAll('.recall-link[data-recall]').forEach((link) => {
        const ref = link.dataset.recall;
        if (/^\d+$/.test(ref)) {
          const idxRef = parseInt(ref, 10);
          if (idxRef < 1 || idxRef > slides.length) {
            issues.push({
              sev: 'error', slide: label,
              msg: `recall-link → slide ${idxRef} doesn't exist (deck has ${slides.length})`,
            });
          }
        } else {
          if (!document.querySelector(ref)) {
            issues.push({
              sev: 'error', slide: label,
              msg: `recall-link → "${ref}" — no matching element`,
            });
          }
        }
      });

      /* Counterfactual toggle ↔ variants */
      slide.querySelectorAll('.cf-toggle-bar[data-cf-group]').forEach((bar) => {
        const group = bar.dataset.cfGroup;
        const buttonValues = [...bar.querySelectorAll('button[data-cf-value]')]
          .map(b => b.dataset.cfValue);
        const variantValues = [...slide.querySelectorAll(
          `.cf-variant[data-cf-group="${group}"]`)].map(v => v.dataset.cfValue);
        buttonValues.forEach((v) => {
          if (!variantValues.includes(v)) {
            issues.push({
              sev: 'error', slide: label,
              msg: `cf-toggle button data-cf-value="${v}" has no matching .cf-variant`,
            });
          }
        });
        variantValues.forEach((v) => {
          if (!buttonValues.includes(v)) {
            issues.push({
              sev: 'warn', slide: label,
              msg: `.cf-variant data-cf-value="${v}" has no button — orphan content`,
            });
          }
        });
      });

      /* Interactive-demo kind */
      slide.querySelectorAll('interactive-demo').forEach((demo) => {
        const kind = demo.getAttribute('kind');
        if (!kind) {
          issues.push({
            sev: 'error', slide: label,
            msg: `<interactive-demo> missing kind attribute`,
          });
        } else if (!KNOWN_DEMO_KINDS.includes(kind)) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `<interactive-demo kind="${kind}"> — unknown kind, known: ${KNOWN_DEMO_KINDS.join(', ')}`,
          });
        }
        /* Validate the math expression at LOAD time, not only at runtime.
           demos.js compiles `fn` via `new Function` with a keyword blacklist;
           a malformed expression otherwise fails silently until the slide is
           opened. Mirror that guard + a parse attempt (we never CALL it). */
        const fnEl = demo.querySelector(':scope > function[fn]');
        if (fnEl) {
          const expr = fnEl.getAttribute('fn') || '';
          if (/[;{}\[\]`]|\b(?:while|for|function|class|async|await|new|import|export|window|document|globalThis|this|eval|Function|setTimeout|setInterval|fetch|XMLHttpRequest)\b/i.test(expr)) {
            issues.push({
              sev: 'error', slide: label,
              msg: `<interactive-demo> fn="${expr.slice(0, 40)}" — содержит запрещённый идентификатор/символ`,
            });
          } else {
            try { /* parse-only — not executed */ new Function('x', `with(Math){return (${expr});}`); }
            catch (e) {
              issues.push({
                sev: 'error', slide: label,
                msg: `<interactive-demo> fn="${expr.slice(0, 40)}" — синтаксическая ошибка выражения (${e.message.slice(0, 30)})`,
              });
            }
          }
        }
      });

      /* A quiz should mark exactly one option data-correct="true". */
      slide.querySelectorAll('.quiz-options').forEach((group) => {
        const opts = [...group.querySelectorAll('.quiz-option')];
        if (opts.length === 0) return;
        const correct = opts.filter(o => o.dataset.correct === 'true').length;
        if (correct === 0) {
          issues.push({
            sev: 'error', slide: label,
            msg: `quiz has no correct option — set data-correct="true" on exactly one`,
          });
        } else if (correct > 1) {
          issues.push({
            sev: 'error', slide: label,
            msg: `quiz has ${correct} options marked data-correct="true" — expected exactly one`,
          });
        }
      });

      /* Misconception sanity */
      if (slide.dataset.type === 'misconception') {
        if (!slide.querySelector('.misc-statement')) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `misconception slide has no .misc-statement`,
          });
        }
        if (!slide.querySelector('.misc-truth')) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `misconception slide has no .misc-truth (reveal target)`,
          });
        }
      }

      /* Archflow structural checks (static; the geometric overlap/connection
         checks live in _audit/archflow-audit.mjs which can drive every step).
         Catches the authoring mistakes the engine can't recover from. */
      if (slide.dataset.type === 'archflow') {
        const canvas = slide.querySelector('.af-canvas');
        if (canvas) {
          const max = parseInt(slide.dataset.maxStep, 10);
          const ids = new Set([...canvas.querySelectorAll('.af-node[id]')].map(n => n.id));
          canvas.querySelectorAll('.af-node:not([id])').forEach(() => {
            issues.push({ sev: 'warn', slide: label, msg: `archflow: .af-node without id — edges can't reference it` });
          });
          canvas.querySelectorAll('.af-edge').forEach((e) => {
            ['fromNode', 'toNode'].forEach((k) => {
              const ref = e.dataset[k];
              if (!ref || !ids.has(ref)) {
                issues.push({ sev: 'error', slide: label,
                  msg: `archflow: edge ${k === 'fromNode' ? 'data-from-node' : 'data-to-node'}="${ref}" references no .af-node` });
              }
            });
          });
          const rng = (v) => { const m = String(v).match(/^(\d+)(?:\.\.(\d+))?$/); return m ? [+m[1], m[2] != null ? +m[2] : +m[1]] : null; };
          canvas.querySelectorAll('[data-from], [data-focus]').forEach((el) => {
            ['from', 'focus'].forEach((a) => {
              if (el.dataset[a] == null) return;
              const r = rng(el.dataset[a]);
              if (!r) { issues.push({ sev: 'error', slide: label, msg: `archflow: data-${a}="${el.dataset[a]}" is not a step / range` }); }
              else if (Number.isFinite(max) && (r[0] < 0 || r[1] > max)) {
                issues.push({ sev: 'error', slide: label, msg: `archflow: data-${a}="${el.dataset[a]}" outside [0, ${max}]` });
              }
            });
          });
          canvas.querySelectorAll('.af-node[data-role="image"]').forEach((n) => {
            const img = n.querySelector('img');
            if (!img || !(img.getAttribute('alt') || '').trim()) {
              issues.push({ sev: 'error', slide: label, msg: `archflow: image node "${n.id || '?'}" has no alt text` });
            }
          });
          if (Number.isFinite(max)) {
            const noteSteps = new Set([...slide.querySelectorAll('.af-note')].map(n => parseInt(n.dataset.step, 10)));
            const missing = [];
            for (let k = 0; k <= max; k++) if (!noteSteps.has(k)) missing.push(k);
            if (missing.length) issues.push({ sev: 'warn', slide: label, msg: `archflow: steps without a side note: ${missing.join(', ')}` });
          }
        }
      }

      /* Auto-fit density — deck.js writes data-auto-fit when it had to shrink
         a slide. If it ALSO set data-auto-fit-clipped, the content overflowed
         even at the 0.5× floor and is being cut off — a hard ERROR (the panel
         auto-opens). Otherwise, below FIT_WARN it's just dense → warning. */
      if (slide.dataset.autoFitClipped === 'true') {
        issues.push({
          sev: 'error', slide: label,
          msg: `контент НЕ помещается даже при 0.5× — часть слайда ОБРЕЗАНА (не видна на экране). Разбейте слайд на несколько.`,
        });
      } else {
        const fit = parseFloat(slide.dataset.autoFit);
        if (Number.isFinite(fit) && fit < FIT_WARN && PROSE_TYPES.has(slide.dataset.type)) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `auto-fit ${fit.toFixed(2)}× — контент плотный (текст ~${Math.round(38 * fit)}px); подумайте о разбиении`,
          });
        }
      }

      /* Local fit-box clipping — a per-element fitter (fitToBox / fitContainer in
         deck.js) hit its 0.7× floor and is CLIPPING the remainder inside its (often
         overflow:hidden) box, while the slide-level global auto-fit never fired. This
         stays invisible without a flag: deck.js sets data-fit-clipped on the slide; we surface it
         here as a WARN (known debt across ~41 slides — being remediated), escalating to an ERROR
         only for a SEVERE clip (<0.5×, where most of the box content is cut). */
      if (slide.dataset.fitClipped === 'true') {
        const wanted = parseFloat(slide.dataset.fitClipScale);
        issues.push({
          sev: 'warn', slide: label,
          msg: `контент обрезан локальным fit-box ниже 0.7×${Number.isFinite(wanted) ? ` (требуется ${wanted.toFixed(2)}×)` : ''} — часть не видна; уменьшите содержимое${Number.isFinite(wanted) && wanted < 0.5 ? ' (СИЛЬНОЕ обрезание)' : ''}`,
        });
      }

      /* Missing language pair — the template rule is one
         <span lang="ru"> + one <span lang="en"> side by side. A lecturer
         who writes only one language gets content that silently vanishes
         in the other mode. Flag any [lang] whose parent lacks the
         opposite-language sibling. Report once per offending parent. */
      const reportedParents = new Set();
      slide.querySelectorAll('[lang="ru"], [lang="en"]').forEach((el) => {
        const lang = el.getAttribute('lang');
        const other = lang === 'ru' ? 'en' : 'ru';
        const parent = el.parentElement;
        if (!parent || reportedParents.has(parent)) return;
        const hasOther = !!parent.querySelector(`:scope > [lang="${other}"]`);
        if (!hasOther) {
          reportedParents.add(parent);
          const snippet = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
          issues.push({
            sev: 'warn', slide: label,
            msg: `текст только на «${lang}» (нет пары lang="${other}") — невидим в режиме «${other.toUpperCase()}»: «${snippet}»`,
          });
        }
      });

      /* Duplicate / gapped data-step in SINGLE-FLOW stepped slides.
         walkthrough is a single column, so each step number should appear
         exactly once and the set should be contiguous 1..max. (e2e is
         excluded: its twin math/example panels legitimately repeat each
         data-step on both sides.) A common copy-paste bug is duplicating a
         step and forgetting to renumber → "1,2,3,3,5" with a hole at 4. */
      if (slide.dataset.type === 'walkthrough' && slide.hasAttribute('data-max-step')) {
        const max = parseInt(slide.dataset.maxStep, 10);
        const nums = [...slide.querySelectorAll('.walk-step[data-step]')]
          .map(el => parseInt(el.dataset.step, 10)).filter(Number.isFinite);
        const seen = new Set(), dups = new Set();
        nums.forEach(n => (seen.has(n) ? dups.add(n) : seen.add(n)));
        if (dups.size) {
          issues.push({
            sev: 'error', slide: label,
            msg: `повторяющиеся data-step: ${[...dups].join(', ')} — каждый шаг walkthrough должен быть уникален`,
          });
        }
        const gaps = [];
        for (let n = 1; n <= max; n++) if (!seen.has(n)) gaps.push(n);
        if (gaps.length && Number.isFinite(max)) {
          issues.push({
            sev: 'warn', slide: label,
            msg: `пропущены шаги ${gaps.join(', ')} из 1..${max} — нумерация data-step с дырами`,
          });
        }
      }

      /* Off-canvas absolutely/fixed-positioned element INSIDE .slide-body.
         deck.js keeps known overlays (pen, devil, frame, step-controls) OUT
         of .slide-body so they don't inflate scrollWidth/Height and trigger a
         false auto-fit shrink. A lecturer's own absolutely-positioned element
         left inside the body re-introduces that bug silently — flag it. */
      const body = slide.querySelector(':scope > .slide-body');
      if (body) {
        /* Use COMPUTED offsets (not getBoundingClientRect) so the check works
           for inactive slides too — those are display:none, so their rects are
           all zero. The 1920×1080 canvas is the reference frame. */
        body.querySelectorAll('*').forEach((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== 'absolute' && cs.position !== 'fixed') return;
          const n = (v) => parseFloat(v); // 'auto' → NaN
          const left = n(cs.left), top = n(cs.top), right = n(cs.right), bottom = n(cs.bottom);
          const offCanvas =
            (Number.isFinite(left) && (left > 1920 || left < -200)) ||
            (Number.isFinite(top) && (top > 1080 || top < -200)) ||
            (Number.isFinite(right) && right < -200) ||
            (Number.isFinite(bottom) && bottom < -200);
          if (offCanvas) {
            const cls = (el.className && el.className.toString().trim().split(/\s+/)[0]) || el.tagName.toLowerCase();
            issues.push({
              sev: 'warn', slide: label,
              msg: `элемент «${cls}» (position:${cs.position}) спозиционирован за пределами слайда внутри .slide-body — может ломать auto-fit; вынесите его из контента`,
            });
          }
        });
      }

      /* Widget mounts (deck-adapter) — surface the two silent failure modes the
         adapter itself now logs: an un-parseable inlined widget-data payload (the
         widget silently gets empty {} data), and a missing mount global (the
         widget's classic bundle didn't load / never assigned window.mount<Id>, so
         nothing mounts). Mirrors deck-adapter.js's mountName() so the lecturer sees
         these in the overlay, not only in DevTools. */
      slide.querySelectorAll('.widget-mount[data-widget]').forEach((mount) => {
        const wid = mount.getAttribute('data-widget');
        const dataEl = slide.querySelector('script.widget-data[type="application/json"]');
        if (dataEl) {
          try { JSON.parse(dataEl.textContent); }
          catch (e) {
            issues.push({
              sev: 'warn', slide: label,
              msg: `widget «${wid}»: инлайновый widget-data не парсится как JSON (${String(e.message).slice(0, 40)}) — виджет получит пустые данные`,
            });
          }
        }
        /* mountName(): "cosine-sphere" → "mountCosineSphere" (see deck-adapter.js). */
        const mountGlobal = 'mount' + String(wid).split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
        if (typeof window[mountGlobal] !== 'function') {
          issues.push({
            sev: 'info', slide: label,
            msg: `widget «${wid}»: mount-функция window.${mountGlobal} отсутствует на момент проверки — виджет может не смонтироваться`,
          });
        }
      });

      /* Speaker notes presence — informational */
      if (!slide.querySelector('aside.slide-notes, aside[data-notes], aside[data-notes-for-step]')) {
        issues.push({
          sev: 'info', slide: label,
          msg: `no speaker notes — consider adding for the presenter view`,
        });
      }
    });

    /* Duplicated slide (copy-paste a whole <section> and forget to edit it).
       Two signals: identical data-screen-label, and identical normalized text
       content. Both are near-certain authoring mistakes at deck scale. */
    const labelSeen = new Map();   // label -> first index
    const textSeen = new Map();    // text hash -> first index
    const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    slides.forEach((slide, i) => {
      const idx = i + 1;
      const lbl = slide.dataset.screenLabel || '';
      if (lbl) {
        if (labelSeen.has(lbl)) {
          issues.push({
            sev: 'warn', slide: `Slide ${idx}`,
            msg: `data-screen-label «${lbl}» дублирует слайд ${labelSeen.get(lbl)} — переименуйте копию`,
          });
        } else labelSeen.set(lbl, idx);
      }
      /* Hash the slide body text (ignore chrome/notes) to catch a duplicated
         section even if its label was changed. */
      const body = slide.querySelector(':scope > .slide-body') || slide;
      const clone = body.cloneNode(true);
      clone.querySelectorAll('aside, .slide__frame').forEach(n => n.remove());
      const txt = norm(clone.textContent || '');
      if (txt.length > 40) {
        if (textSeen.has(txt)) {
          issues.push({
            sev: 'warn', slide: `Slide ${idx}`,
            msg: `содержимое идентично слайду ${textSeen.get(txt)} — похоже на дублированный слайд`,
          });
        } else textSeen.set(txt, idx);
      }
    });

    /* Idempotent: clear any prior overlay so re-runs (e.g. after katex:done
       or a manual window.__preflight.runChecks()) refresh rather than no-op. */
    const old = document.querySelector('.preflight-overlay');
    if (old) old.remove();

    if (issues.length === 0) {
      console.info(`✓ Pre-flight: ${slides.length} slides, no issues.`);
      return issues;
    }

    const errors = issues.filter(i => i.sev === 'error').length;
    const warns = issues.filter(i => i.sev === 'warn').length;
    const infos = issues.filter(i => i.sev === 'info').length;

    /* Log full list to console with grouping */
    console.groupCollapsed(
      `Pre-flight: ${errors} error · ${warns} warn · ${infos} info across ${slides.length} slides`
    );
    issues.forEach((i) => {
      const fn = i.sev === 'error' ? console.error
              : i.sev === 'warn'  ? console.warn
              : console.info;
      fn(`[${i.slide}] ${i.msg}`);
    });
    console.groupEnd();

    /* Surface as discreet overlay if there are errors/warnings — but ONLY
       when explicitly requested via ?preflight=1 (hidden from students).
       Info-only is silent (otherwise every deck without notes nags). */
    if (SHOW_OVERLAY && errors + warns > 0) renderOverlay(issues);
    return issues;
  }

  /* ---------- Overlay ---------- */
  function renderOverlay(issues) {
    if (document.querySelector('.preflight-overlay')) return;
    const errors = issues.filter(i => i.sev === 'error');
    const warns  = issues.filter(i => i.sev === 'warn');

    const root = document.createElement('div');
    root.className = 'preflight-overlay';
    /* When there are errors, show a labelled, pulsing toggle and open the
       panel automatically; warnings-only keeps the compact icon. */
    const hasErrors = errors.length > 0;
    const summary = hasErrors
      ? `${errors.length} error${errors.length === 1 ? '' : 's'}` + (warns.length ? ` · ${warns.length} warn` : '')
      : `${warns.length} warning${warns.length === 1 ? '' : 's'}`;
    root.innerHTML = `
      <button class="pf-toggle ${hasErrors ? 'has-errors' : ''}" type="button"
              aria-label="Pre-flight: ${escape(summary)} (click for details)">
        <span class="pf-toggle-label">Pre-flight · ${escape(summary)}</span>
        ${errors.length > 0 ? '<span class="pf-err-badge">' + errors.length + '</span>' : ''}
        ${warns.length  > 0 ? '<span class="pf-warn-badge">' + warns.length + '</span>' : ''}
      </button>
      <div class="pf-panel">
        <div class="pf-head">
          <span class="pf-title">Pre-flight check</span>
          <button class="pf-close" type="button">×</button>
        </div>
        <div class="pf-body">
          ${errors.length ? `
            <div class="pf-section">
              <div class="pf-section-head pf-sec-err">${errors.length} error${errors.length === 1 ? '' : 's'}</div>
              ${errors.map(i => `<div class="pf-item"><span class="pf-slide">${escape(i.slide)}</span><span class="pf-msg">${escape(i.msg)}</span></div>`).join('')}
            </div>
          ` : ''}
          ${warns.length ? `
            <div class="pf-section">
              <div class="pf-section-head pf-sec-warn">${warns.length} warning${warns.length === 1 ? '' : 's'}</div>
              ${warns.map(i => `<div class="pf-item"><span class="pf-slide">${escape(i.slide)}</span><span class="pf-msg">${escape(i.msg)}</span></div>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="pf-foot">
          <span>Full log in console — open DevTools and look for the "Pre-flight" group.</span>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const toggle = root.querySelector('.pf-toggle');
    const panel = root.querySelector('.pf-panel');
    toggle.addEventListener('click', () => panel.classList.toggle('is-open'));
    root.querySelector('.pf-close').addEventListener('click', () => panel.classList.remove('is-open'));

    /* Auto-open the panel when the deck has errors (warnings stay collapsed). */
    if (hasErrors) panel.classList.add('is-open');
  }

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  /* Exposed so a lecturer (or a test) can re-run the pre-flight after
     editing the DOM: window.__preflight.runChecks() returns the issue list. */
  window.__preflight = { runChecks };
})();
