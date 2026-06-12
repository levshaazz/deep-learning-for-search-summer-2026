#!/usr/bin/env node
/* =========================================================================
   widget-render-check.mjs — the "DOES IT RUN" gate (G10).

   ─────────────────────────── WHY THIS GATE EXISTS ───────────────────────────
   slide-viz-gate (G9) answers "does the figure LOOK right" — step-progression,
   overlap/OOB, colour collision, double-painted text. But a widget can SAIL past
   the look-right detectors while it is actually THROWING at runtime: a mount that
   references an undefined symbol, a setStep that divides a null, a render that
   logs `console.error` and bails to an empty <svg>. Those defects don't garble a
   colour — they leave a blank or half-painted figure, or a red console, and ship
   anyway. That is the recurring "widget renders wrong / throws" whack-a-mole.

   This gate is the DETECTION BACKBONE for that class. For EVERY Book scroll-step
   widget (derived live from content/book/*.js — every `kind:'scrolly'` beat, so
   the list self-maintains as widgets are added), in BOTH themes, it:
       1. loads the built chapter (docs/),
       2. confirms the widget's mount EXPORT was found and mounted (window.__figs),
       3. steps through ALL its steps via window.__figs[beat].setStep(k)
          (the page's own headless hook — the same path slide-viz uses),
   while listening for runtime failure, and FAILS HARD on ANY of:

     • CONSOLE-ERROR   — a `console.error` (or `console.warn` if --warn-as-error)
                         emitted during mount or any step. The core get-it signal.
     • PAGE-ERROR      — an uncaught exception on the page (window.onerror) or an
                         unhandledrejection during mount or any step.
     • MOUNT-MISSING   — the widget's mount export isn't found / the beat never
                         landed on window.__figs (mount threw, or wrong export name).
     • SETSTEP-THROW   — calling setStep(k) throws (caught in-page and reported).
     • EMPTY-RENDER    — the figure is empty/degenerate at some step: no <svg> AND
                         no meaningful HTML figure box, OR an SVG with a zero-area
                         viewport box, OR zero visible painted elements. (A widget
                         that mounts silently but paints NOTHING is just as broken
                         as one that throws.)

   It does NOT re-check step-RANGE / manifest↔HTML consistency — scroll-step-gate
   (G6) owns "every scroll-step maps to a real widget step / no dead steps / no
   out-of-range markers". This gate is RUNTIME-errors + EMPTY-render only, so the
   two don't duplicate. (We DO read maxStep from the mounted widget and walk
   0..maxStep, but we do not assert it against the manifest — that's G6's job.)

   ───────────────────── THE "AUTO-REPAIR" LOOP (read me) ─────────────────────
   A committed gate cannot contain an LLM, so there is no repair loop INSIDE this
   file. The repair loop is:

       render-check  →  (actionable report)  →  fix  →  re-run

   This gate is the DETECTION half. It makes the report ACTIONABLE so the FIX half
   (a building agent, or a human) can consume it directly: every failure prints
       widget · step · theme · failure-class · exact error message + stack snippet
   so you can jump straight to the offending line. Author-time, narrow it with
   `--widget <name>` to mount just one widget and see its errors immediately; once
   you've patched the widget, `npm run build` and re-run the gate on that widget
   (or the whole set) until HARD=0. That cycle IS the repair loop.

   ────────────────────────────── USAGE ──────────────────────────────
     node _audit/widget-render-check.mjs              # all book widgets, both themes
     node _audit/widget-render-check.mjs --widget tsne-steps   # one widget, fast author loop
     node _audit/widget-render-check.mjs --selftest   # planted broken+healthy fixtures
     node _audit/widget-render-check.mjs --json out.json       # machine-readable report
     node _audit/widget-render-check.mjs --warn-as-error       # treat console.warn as HARD too

   EXIT: non-zero whenever HARD > 0 (DEFAULT — this gate is a hard CI gate, mirroring
   responsive-gate / scroll-step-gate, NOT slide-viz's lenient default). `--strict`
   is accepted as a no-op alias so the CI line can carry it harmlessly; the failure
   is hard either way. Needs a build first (docs/) — without it, the book targets are
   SKIPPED and the run exits 0 with a loud note (build then re-run).

   Offline: chromium comes from _audit/node_modules / the cached browser; no network.
   ========================================================================= */
import { chromium } from 'playwright';
import { HARDENED, serveDir } from './lib/gate-harness.mjs';   // serveDir = free-port static server (no port race)
import { readFileSync, existsSync, statSync, readdirSync, mkdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const DOCS = join(ROOT, 'docs');
const CDIR = join(ROOT, 'content', 'book');
const BASE = '/deep-learning-for-search-summer-2026';
const THEMES = ['light', 'dark'];
let srv;   // free-port static server (serveDir), assigned in main(); bookUrl closes over it

// ───────────────────────── thresholds ─────────────────────────
const TH = {
  MIN_BOX: 4,            // px: an element smaller than this on BOTH sides is a hairline, not a "visible mark".
  MIN_FIG_AREA: 64,      // px²: a figure box (svg viewport or html fallback) below this reads as degenerate/empty.
  MIN_VISIBLE: 1,        // a non-degenerate figure must paint at least this many visible meaningful elements.
  MOUNT_TIMEOUT: 15000,  // ms to wait for window.__figs[beat] to appear.
  STEP_SETTLE: 160,      // ms to let a step paint before capturing.
};

// Benign console-error noise we must NOT fail on: a missing favicon / 404 for an asset the page
// references is an environment artifact of the static server, not a widget runtime error. Kept
// deliberately tiny and specific so a REAL widget console.error is never masked.
const BENIGN = [
  /favicon/i,
  /Failed to load resource.*404/i,
  /net::ERR_/i,
];
const isBenign = (msg) => BENIGN.some((re) => re.test(msg));

// ───────────────────────── target discovery ─────────────────────────
// Every scrolly beat across content/book/*.js → { chapter, beat, widget }. Derived LIVE so adding a
// widget folder + beat is covered with zero edits here (same spirit as the Astro auto-glob mount).
async function discoverTargets() {
  const out = [];
  if (!existsSync(CDIR)) return out;
  for (const f of readdirSync(CDIR).filter((f) => f.endsWith('.js')).sort()) {
    const mod = await import(pathToFileURL(join(CDIR, f)).href);
    const ch = mod.default;
    if (!ch || !Array.isArray(ch.beats)) continue;
    for (const b of ch.beats.filter((b) => b.kind === 'scrolly')) {
      out.push({ chapter: ch.id, beat: b.id, widget: b.widget });
    }
  }
  return out;
}

// ───────────────────────── static server (docs/, GH-Pages base) ─────────────────────────
// serveDir (gate-harness): same base-strip + dir→index.html, MIME superset, a path-traversal
// guard, and a FREE port (listen(0)) — no more hardcoded 8153 race / EADDRINUSE on a leaked run.
const bookUrl = (ch, lang = 'en') => srv.href(`${lang}/book/${ch}/`);

/* =========================================================================
   RENDER-PROBE — runs IN the page for one beat at the current step. Reports the
   figure's "health": is there a real figure box, and are there visible marks?
   Mirrors slide-viz's capture philosophy (effective opacity up the chain, skip
   display:none / hidden / .is-step-hidden, ignore hairlines) but returns a small
   verdict instead of the full salience scene — this gate cares about RUNS / EMPTY,
   not look-right.
   ========================================================================= */
const PROBE = (beatId, opt) => {
  const host = document.getElementById('fig-' + beatId);
  if (!host) return { ok: false, reason: 'no host #fig-' + beatId };

  const effVisible = (el) => {
    let n = el;
    while (n && n !== host.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
      if ((parseFloat(cs.opacity) || 1) < 0.05) return false;
      if (n.classList && (n.classList.contains('is-hidden') || n.classList.contains('is-step-hidden'))) return false;
      n = n.parentElement;
    }
    return true;
  };

  // figure box: the largest non-KaTeX <svg> viewport if present, else the host's own box. A
  // figure with NO svg may still be a legit HTML figure (a DOM-card walkthrough), so we fall
  // back to the host box rather than declaring empty on "no svg" alone.
  let figBox = host.getBoundingClientRect();
  let figKind = 'host';
  let svgCount = 0, bestArea = figBox.width * figBox.height;
  host.querySelectorAll('svg').forEach((sv) => {
    if (sv.closest && sv.closest('.katex')) return;     // skip inline-math glyph svgs
    svgCount++;
    const b = sv.getBoundingClientRect();
    const a = b.width * b.height;
    if (figKind !== 'svg' || a > bestArea) { figBox = b; figKind = 'svg'; bestArea = a; }
  });
  const figArea = figBox.width * figBox.height;

  // visible meaningful marks. Two sources, UNION'd, so the count is robust across BOTH widget
  // styles without a hand-curated class list (which would silently miss a pure-HTML-table widget
  // like rrf-fusion, whose classes are rrf-chip/rrf-col/… — none of a fixed vocabulary):
  //   (1) SVG GEOMETRY — rect/circle/ellipse/path/line/polygon/polyline/text/tspan (always a mark);
  //   (2) PAINTED HTML LEAVES — an element with a real box that actually paints something a reader
  //       sees: non-empty text, a non-transparent background, or a visible border. We count LEAVES
  //       (no element-child carrying its own paint) so a wrapper isn't double-counted with its cells.
  // Both skip KaTeX glyph trees and the factory's caption/counter chrome.
  const SVG_GEOM = new Set(['rect', 'circle', 'ellipse', 'path', 'line', 'polygon', 'polyline', 'text', 'tspan']);
  const chrome = (el) => el.classList && (el.classList.contains('wgt-caption') || el.classList.contains('wgt-counter'));
  const hasArea = (b, el) => (b.width >= opt.MIN_BOX || b.height >= opt.MIN_BOX) &&
    ((b.width * b.height) > 0 || (el.tagName && el.tagName.toLowerCase() === 'line'));
  let visible = 0;
  const seen = new Set();

  // VISUAL-REGRESSION signature: alongside the COUNT, record a per-mark token — tag + coarse
  // FRAME-RELATIVE box + paint (fill / stroke / stroke-width / paint-order). Coords are coarsened
  // Math.round(/6) — the same anti sub-pixel-jitter bucketing slide-viz's signature uses — so layout
  // noise between runs doesn't drift the baseline. STROKE + paint-order are captured DELIBERATELY: a
  // dropped `.svg-halo` (paint-order:stroke; stroke:#fff; stroke-width:2.5 on a text label) changes the
  // token even though count + geometry don't — exactly the regression class T3 needed a human EYE for.
  const marks = [];
  const coarse = (v) => Math.round(v / 6);
  const relBox = (b) => `${coarse(b.left - figBox.left)},${coarse(b.top - figBox.top)},${coarse(b.width)},${coarse(b.height)}`;

  // (1) SVG geometry primitives.
  host.querySelectorAll([...SVG_GEOM].join(',')).forEach((el) => {
    if (seen.has(el) || (el.closest && el.closest('.katex')) || chrome(el)) return;
    if (!effVisible(el)) return;
    const b = el.getBoundingClientRect();
    if (!hasArea(b, el)) return;
    seen.add(el); visible++;
    const cs = getComputedStyle(el);
    const sw = Math.round((parseFloat(cs.strokeWidth) || 0) * 2) / 2;          // 0.5px buckets
    const po = cs.paintOrder && cs.paintOrder !== 'normal' ? cs.paintOrder : '';
    const tag = el.tagName ? el.tagName.toLowerCase() : '?';
    marks.push(`${tag}|${relBox(b)}|${cs.fill}|${cs.stroke}|${sw}|${po}`);
  });

  // (2) painted HTML leaves (covers HTML-table / chip / card widgets generically).
  host.querySelectorAll('*').forEach((el) => {
    if (seen.has(el)) return;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'svg' || el.namespaceURI === 'http://www.w3.org/2000/svg') return;   // SVG handled in (1)
    if (el.closest && el.closest('.katex')) return;
    if (chrome(el) || (el.closest && (el.closest('.wgt-caption') || el.closest('.wgt-counter')))) return;
    if (!effVisible(el)) return;
    const b = el.getBoundingClientRect();
    if (!hasArea(b, el)) return;
    // is this a LEAF that paints? skip wrappers whose paint comes from a descendant we'll also count.
    const cs = getComputedStyle(el);
    const directText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length);
    const bg = cs.backgroundColor;
    const paintedBg = bg && bg !== 'transparent' && !/rgba?\([^)]*,\s*0\s*\)/.test(bg);
    const bw = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0) +
      (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
    const borderVisible = bw > 0 && cs.borderStyle !== 'none';
    const isImg = tag === 'img' || tag === 'canvas';
    if (directText || paintedBg || borderVisible || isImg) {
      seen.add(el); visible++;
      marks.push(`h:${tag}|${relBox(b)}|${bg}|${cs.borderTopColor}|${Math.round(bw)}`);
    }
  });

  // hash the SORTED mark tokens → a compact, order-independent, stable per-step paint signature.
  marks.sort();
  let _hs = 0; const _ms = marks.join('§');
  for (let i = 0; i < _ms.length; i++) _hs = (Math.imul(_hs, 31) + _ms.charCodeAt(i)) | 0;
  const sig = (_hs >>> 0).toString(16);

  return {
    ok: true,
    figKind, svgCount,
    figW: Math.round(figBox.width), figH: Math.round(figBox.height),
    figArea: Math.round(figArea),
    visible,
    sig,
    hostHTMLlen: host.innerHTML.length,
  };
};

// classify a captured probe into an EMPTY-RENDER verdict (or null if healthy).
function emptyVerdict(probe) {
  if (!probe || !probe.ok) return `probe failed: ${probe ? probe.reason : 'no probe'}`;
  if (probe.figArea < TH.MIN_FIG_AREA) {
    return `degenerate figure box ${probe.figW}×${probe.figH} (area ${probe.figArea}px² < ${TH.MIN_FIG_AREA}) — ${probe.figKind === 'svg' ? 'SVG has zero-area viewport' : 'figure host has no laid-out box'}`;
  }
  if (probe.visible < TH.MIN_VISIBLE) {
    return `no visible elements rendered (figure box ${probe.figW}×${probe.figH}, svgs=${probe.svgCount}, host HTML ${probe.hostHTMLlen}b) — figure mounted but paints nothing`;
  }
  return null;
}

/* =========================================================================
   VISUAL-REGRESSION — paint-signature drift vs a FROZEN, committable baseline.

   "Does it RUN" (above) proves a widget mounts/steps/paints SOMETHING. This proves
   it paints the SAME thing it did when last frozen. Per (widget·beat, theme) we
   store one {v: visible-count, sig: paint-hash} per step in _audit/baselines/
   widget-viz.json; a normal run recomputes them live and HARD-fails on DRIFT:
     • a mark added / removed            (count + hash change)
     • a step collapsed / added         (step-count change)
     • a fill / stroke / HALO change    (hash change, count unchanged ← the .svg-halo case)
   BOTH themes are stored (light/dark resolve different fills, so the sig differs).

   Ratchet semantics mirror font-gate / coverage-guard: a NEW widget (L7…) not yet
   in the baseline is a soft NOTE (freeze it with --update-baseline), never a silent
   pass-through; an INTENTIONAL visual change is re-frozen the same way, after a diff
   review. The comparison is pure (diffEntry) so --selftest can plant drift offline.
   ========================================================================= */
const BDIR = join(ROOT, '_audit', 'baselines');
const BFILE = join(BDIR, 'widget-viz.json');
const BREL = '_audit/baselines/widget-viz.json';

function loadBaseline() {
  if (!existsSync(BFILE)) return null;
  try { return JSON.parse(readFileSync(BFILE, 'utf8')); } catch { return null; }
}
// extract { light:[{v,sig}…], dark:[…] } from a runChapter beat-result (only MOUNTED themes contribute;
// a theme whose mount failed has no steps[] and is already a RUN HARD, so we don't double-count it).
function liveSigs(r) {
  const out = {};
  for (const theme of THEMES) {
    const t = r.themes[theme];
    if (!t || !t.steps) continue;
    out[theme] = t.steps.map((s) => ({
      v: s.probe && s.probe.ok ? s.probe.visible : -1,
      sig: s.probe && s.probe.ok ? s.probe.sig : 'x',
    }));
  }
  return out;
}
// compare one theme's live step-sigs to the baseline's; return human-readable DRIFT lines (empty = clean).
function diffEntry(theme, live, base) {
  const out = [];
  if (live.length !== base.length)
    out.push(`[${theme}] step-count ${base.length}→${live.length} (a step collapsed, was added, or maxStep changed)`);
  const n = Math.min(live.length, base.length);
  for (let k = 0; k < n; k++) {
    if (live[k].sig !== base[k].sig || live[k].v !== base[k].v)
      out.push(`[${theme}] step ${k}: visible ${base[k].v}→${live[k].v}, sig ${base[k].sig}→${live[k].sig}`);
  }
  return out;
}

/* =========================================================================
   BOOK driver — PER CHAPTER (not per beat). All scrolly beats of a chapter mount
   EAGERLY on the one page load (window.__figs holds every beat — the mount check
   never pre-scrolls, yet works for all 37 beats), so we load each chapter ONCE per
   theme and walk every beat on that shared page. This cuts the page-load count from
   74 (37 beats × 2 themes) to ~14 (≈7 chapters × 2 themes) — the dominant cost was
   goto(networkidle)+grace. Per-beat ERROR ATTRIBUTION is preserved: `curBeat` tags
   each console/page error with the beat being stepped at the time; load-time errors
   bucket under '(mount)' and are surfaced ONCE on the chapter (its first beat), so a
   real defect still HARD-fails and the message+stack stay actionable.
   Returns one result per beat: { name, beat, chapter, themes:{[theme]:{mountOK, maxStep, steps[], failures[]}} }.
   ========================================================================= */
async function runChapter(browser, chapter, beats, opt) {
  const results = beats.map((b) => ({ name: `${b.widget}`, beat: b.beat, chapter, themes: {} }));
  for (const theme of THEMES) {
    // reducedMotion: 'reduce' makes the widgets' JS camera tweens (_plot-util cameraTo/cameraHome,
    // which check matchMedia('(prefers-reduced-motion: reduce)')) JUMP to their target viewBox instead
    // of rAF-animating — so a step's figure is captured at its unique REST state, not mid-tween. Paired
    // with the transition-freeze stylesheet below, every captured frame is deterministic.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    let curBeat = '(mount)';      // the listeners attribute each error to whatever beat is being stepped now
    const errBy = new Map();      // beat (or '(mount)') → [{cls, phase, msg, stack}]
    const pushErr = (e) => { const k = curBeat; if (!errBy.has(k)) errBy.set(k, []); errBy.get(k).push(e); };

    // CONSOLE — capture error (and warn) lines as they happen, tagging the current beat.
    page.on('console', (m) => {
      const type = m.type();
      const wantWarn = opt.warnAsError && type === 'warning';
      if (type !== 'error' && !wantWarn) return;
      const txt = m.text();
      if (isBenign(txt)) return;
      pushErr({ cls: 'CONSOLE-ERROR', phase: curBeat, msg: `[console.${type}] ${txt}` });
    });
    // PAGE ERROR — uncaught exception on the page (window.onerror).
    page.on('pageerror', (e) => {
      pushErr({ cls: 'PAGE-ERROR', phase: curBeat, msg: String(e && e.message || e), stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' });
    });

    try {
      // theme + lang BEFORE the page scripts evaluate (so widgets mount in the target theme).
      // CRITICAL: addInitScript runs on EVERY document, including the initial about:blank where
      // document.documentElement is still null — touching it there throws, and OUR pageerror
      // listener would then mis-attribute that harness throw to the widget. So everything here is
      // null-guarded and the theme is (re)applied once the real <html> exists.
      await page.addInitScript((t) => {
        try { localStorage.setItem('lecture.template.prefs.v1', JSON.stringify({ theme: t, lang: 'en' })); } catch {}
        const applyTheme = () => { try { if (document.documentElement) document.documentElement.setAttribute('data-theme', t); } catch {} };
        applyTheme();   // works on the real document; safely no-ops on about:blank
        try { document.addEventListener('DOMContentLoaded', applyTheme); } catch {}
        // surface unhandled promise rejections as page errors (Playwright's pageerror misses these).
        try {
          window.addEventListener('unhandledrejection', (ev) => {
            const r = ev && ev.reason;
            throw new Error('unhandledrejection: ' + (r && r.message || r));
          });
        } catch {}
      }, theme);

      await page.goto(bookUrl(chapter), { waitUntil: 'networkidle' });
      // Freeze CSS transitions/animations to 0s: a mid-flight opacity/transform/colour transition (the
      // wgt-fade 220ms, a 600ms widget transition) would otherwise be sampled between states and drift
      // the signature. Forcing duration 0 changes only the animation PATH, never the rest state we freeze.
      await page.addStyleTag({ content: '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;}' }).catch(() => {});

      for (const r of results) {
        const beat = r.beat;
        curBeat = beat;                     // attribute this beat's console/page errors to it
        const failures = [];

        // MOUNT-MISSING — wait for THIS beat's widget on window.__figs. The mount is a module script
        // (Astro auto-glob); under load it can land just AFTER networkidle, so a single waitForFunction
        // occasionally races. We wait robustly: first for the beat, and if that races, settle + recheck
        // once before declaring it missing — so MOUNT-MISSING fires ONLY on a genuine never-mount.
        const waitForBeat = () => page.waitForFunction((b) => window.__figs && window.__figs[b] &&
          typeof window.__figs[b].setStep === 'function', beat, { timeout: opt.MOUNT_TIMEOUT })
          .then(() => true).catch(() => false);
        let landed = await waitForBeat();
        if (!landed) {
          await page.waitForTimeout(1500);
          landed = await page.evaluate((b) => !!(window.__figs && window.__figs[b] &&
            typeof window.__figs[b].setStep === 'function'), beat);
        }
        const mounted = await page.evaluate((b) => {
          const figs = window.__figs;
          if (!figs) return { ok: false, reason: 'window.__figs is undefined — the chapter scrolly script never ran (page load failure)' };
          const f = figs[b];
          if (!f) return { ok: false, reason: 'window.__figs["' + b + '"] is undefined — mount export not found or mount threw (other beats mounted: ' + Object.keys(figs).join(', ') + ')' };
          if (typeof f.setStep !== 'function') return { ok: false, reason: 'window.__figs["' + b + '"].setStep is not a function' };
          return { ok: true, maxStep: typeof f.maxStep === 'number' ? f.maxStep : 0 };
        }, beat);

        if (!mounted.ok) {
          failures.push({ cls: 'MOUNT-MISSING', step: 'mount', msg: mounted.reason });
          for (const c of (errBy.get(beat) || [])) failures.push({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack });
          r.themes[theme] = { mountOK: false, failures };
          continue;
        }
        const maxStep = mounted.maxStep;

        // bring the figure into view so it has a real laid-out box (off-screen → 0×0).
        await page.evaluate((b) => {
          const h = document.getElementById('fig-' + b);
          if (h) h.scrollIntoView({ block: 'center', behavior: 'instant' });
        }, beat);
        await page.waitForTimeout(200);

        const steps = [];
        for (let k = 0; k <= maxStep; k++) {
          // SETSTEP-THROW — call setStep inside a try in the page so a throw is reported, not swallowed.
          const stepRes = await page.evaluate(({ b, kk }) => {
            try { window.__figs[b].setStep(kk); return { ok: true }; }
            catch (e) { return { ok: false, msg: String(e && e.message || e), stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' }; }
          }, { b: beat, kk: k });
          if (!stepRes.ok) {
            failures.push({ cls: 'SETSTEP-THROW', step: k, msg: stepRes.msg, stack: stepRes.stack });
          }
          await page.waitForTimeout(opt.STEP_SETTLE);
          // EMPTY-RENDER — probe the figure health at this step.
          const probe = await page.evaluate(({ b, o }) => window.__RENDERPROBE(b, o), { b: beat, o: opt });
          const empty = emptyVerdict(probe);
          if (empty) failures.push({ cls: 'EMPTY-RENDER', step: k, msg: empty });
          steps.push({ k, probe, setStepOk: stepRes.ok });
        }

        // attribute this beat's console/page errors (collected while curBeat === beat).
        for (const c of (errBy.get(beat) || [])) failures.push({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack });
        r.themes[theme] = { mountOK: true, maxStep, steps, failures };
      }

      // LOAD-TIME errors (fired during the initial chapter load, before any beat was stepped) are a
      // chapter-level defect — surface them ONCE on the first beat so the gate still HARD-fails and the
      // report stays actionable (message + stack point to the offending mount code).
      const mountErrs = errBy.get('(mount)') || [];
      if (mountErrs.length && results.length) {
        const first = results[0];
        if (!first.themes[theme]) first.themes[theme] = { mountOK: true, maxStep: 0, steps: [], failures: [] };
        for (const c of mountErrs) first.themes[theme].failures.push({ cls: c.cls, step: 'chapter-mount', msg: c.msg, stack: c.stack });
      }
    } catch (e) {
      // an unexpected harness/navigation error makes the whole shared page unusable → fail every beat
      // of this chapter+theme (mirrors the old per-beat HARNESS failure, now chapter-wide).
      const mountErrs = errBy.get('(mount)') || [];
      for (const r of results) {
        if (r.themes[theme]) continue;
        const failures = mountErrs.map((c) => ({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack }));
        failures.push({ cls: 'HARNESS', step: 'load', msg: String(e).slice(0, 240) });
        r.themes[theme] = { mountOK: false, failures };
      }
    } finally {
      await ctx.close();
    }
  }
  return results;
}

// ───────────────────────── report rendering ─────────────────────────
function printResult(r) {
  let hard = 0;
  const lines = [`\n=== ${r.name}  (book ${r.chapter}·${r.beat}) ===`];
  for (const theme of THEMES) {
    const t = r.themes[theme];
    if (!t) continue;
    const counts = t.steps ? t.steps.map((s) => (s.probe && s.probe.ok ? s.probe.visible : 'x')).join('→') : '';
    const head = t.mountOK
      ? `mounted · maxStep=${t.maxStep} · visible-marks/step: ${counts}`
      : `NOT MOUNTED`;
    lines.push(`  [${theme}] ${head}`);
    const fails = t.failures || [];
    if (!fails.length) { lines.push(`      · clean`); continue; }
    for (const f of fails) {
      hard++;
      const where = typeof f.step === 'number' ? `step ${f.step}` : f.step;
      lines.push(`      ✗ [${f.cls} · ${where} · ${theme}] ${f.msg}`);
      if (f.stack) lines.push(`           stack: ${f.stack}`);
    }
  }
  return { hard, text: lines.join('\n') };
}

/* =========================================================================
   SELFTEST — proves the gate fires on a broken widget AND stays silent on a
   healthy one, using PLANTED in-page fixtures (no docs/ build needed). Each
   fixture sets up a fake window.__figs[beat] + a #fig-<beat> host, exactly like
   the real page, then runs the same probe + setStep-try logic the driver uses.

   BROKEN fixtures (each must FIRE):
     S1 mount-missing  — window.__figs has no entry for the beat.
     S2 console.error  — mount/step logs console.error.
     S3 setStep throws — setStep(k) raises.
     S4 empty render   — mount produces an empty (zero-mark / zero-area) figure.
   HEALTHY fixture (must stay SILENT):
     H1 — a normal widget: mounts, paints a real SVG with marks, steps cleanly.
   ========================================================================= */
async function selftest(browser) {
  let ok = true;
  const pass = (label, fired, want, detail) => {
    const good = fired === want;
    ok = ok && good;
    const verdict = want ? (fired ? 'FIRE' : 'NO FLAG (BLIND)') : (fired ? 'FIRE (FALSE POSITIVE)' : 'silent');
    console.log(`${good ? ' ok ' : 'FAIL'} ${label}: ${verdict}${detail ? ' — ' + detail : ''}`);
  };

  // Drive ONE planted fixture through the exact mount→step→probe pipeline the real driver uses,
  // returning the failures[] it would emit. `setupJs` builds #fig-<beat> + window.__figs[beat].
  async function probeFixture(beat, maxStep, setupJs, opt = { ...TH, warnAsError: false }) {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
    const page = await ctx.newPage();
    const consoleErrs = []; let phase = 'mount';
    page.on('console', (m) => { if (m.type() === 'error' && !isBenign(m.text())) consoleErrs.push({ cls: 'CONSOLE-ERROR', phase, msg: `[console.error] ${m.text()}` }); });
    page.on('pageerror', (e) => consoleErrs.push({ cls: 'PAGE-ERROR', phase, msg: String(e && e.message || e) }));
    const failures = [];
    const sigs = [];   // per-step {v, sig} — the visual signature the VR drift check compares.
    await page.setContent('<div id="stage" style="position:relative;width:600px;height:400px;background:#fff"></div>');
    // run the fixture's setup (it may throw / log / build a broken figure).
    await page.evaluate(({ body, b }) => { (new Function('beat', body))(b); }, { body: setupJs, b: beat });

    const mounted = await page.evaluate((b) => {
      const f = window.__figs && window.__figs[b];
      if (!f) return { ok: false, reason: 'window.__figs["' + b + '"] is undefined' };
      if (typeof f.setStep !== 'function') return { ok: false, reason: 'setStep not a function' };
      return { ok: true, maxStep: typeof f.maxStep === 'number' ? f.maxStep : maxStep };
    }, beat);
    if (!mounted.ok) {
      failures.push({ cls: 'MOUNT-MISSING', step: 'mount', msg: mounted.reason });
      for (const c of consoleErrs) failures.push(c);
      await ctx.close(); return { failures, sigs };
    }
    for (let k = 0; k <= mounted.maxStep; k++) {
      phase = 'step:' + k;
      const sr = await page.evaluate(({ b, kk }) => { try { window.__figs[b].setStep(kk); return { ok: true }; } catch (e) { return { ok: false, msg: String(e && e.message || e) }; } }, { b: beat, kk: k });
      if (!sr.ok) failures.push({ cls: 'SETSTEP-THROW', step: k, msg: sr.msg });
      await page.waitForTimeout(60);
      const probe = await page.evaluate(({ b, o }) => window.__RENDERPROBE(b, o), { b: beat, o: opt });
      const empty = emptyVerdict(probe);
      if (empty) failures.push({ cls: 'EMPTY-RENDER', step: k, msg: empty });
      sigs.push({ v: probe && probe.ok ? probe.visible : -1, sig: probe && probe.ok ? probe.sig : 'x' });
    }
    for (const c of consoleErrs) failures.push(c);
    await ctx.close();
    return { failures, sigs };
  }

  console.log('── BROKEN fixtures (each must FIRE) ──');

  // S1 — MOUNT-MISSING: build a host but register NOTHING on window.__figs.
  const fS1 = await probeFixture('broken-missing', 0, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    window.__figs = window.__figs || {}; /* deliberately do NOT set __figs[beat] */`);
  pass('S1 mount-missing (export not found)', fS1.failures.some((f) => f.cls === 'MOUNT-MISSING'), true, (fS1.failures.find((f) => f.cls === 'MOUNT-MISSING') || {}).msg);

  // S2 — CONSOLE-ERROR: a widget that mounts + paints, but logs console.error during a step.
  const fS2 = await probeFixture('broken-console', 1, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><rect class="x-box" x="10" y="10" width="120" height="80" fill="#3a7"/></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:1, setStep(k){ if(k===1) console.error('widget bug: cannot read x of undefined'); } };`);
  pass('S2 console.error during step', fS2.failures.some((f) => f.cls === 'CONSOLE-ERROR'), true, (fS2.failures.find((f) => f.cls === 'CONSOLE-ERROR') || {}).msg);

  // S3 — SETSTEP-THROW: setStep raises on a later step.
  const fS3 = await probeFixture('broken-throw', 2, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><circle class="x-dot" cx="50" cy="50" r="20" fill="#27e"/></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:2, setStep(k){ if(k===2){ const z=null; return z.nope.deep; } } };`);
  pass('S3 setStep throws (null deref)', fS3.failures.some((f) => f.cls === 'SETSTEP-THROW'), true, (fS3.failures.find((f) => f.cls === 'SETSTEP-THROW') || {}).msg);

  // S4 — EMPTY-RENDER: mounts fine, setStep never errors, but paints an EMPTY figure (no marks).
  const fS4 = await probeFixture('broken-empty', 1, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><!-- nothing painted --></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:1, setStep(k){ /* renders nothing, ever */ } };`);
  pass('S4 empty render (zero visible marks)', fS4.failures.some((f) => f.cls === 'EMPTY-RENDER'), true, (fS4.failures.find((f) => f.cls === 'EMPTY-RENDER') || {}).msg);

  console.log('── HEALTHY fixture (must stay SILENT) ──');

  // H1 — a well-behaved widget: real SVG, real marks, clean stepping, no console output.
  const fH1 = await probeFixture('healthy', 2, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    const draw=(n)=>{ h.innerHTML='<svg width="320" height="200" viewBox="0 0 320 200">'+
      Array.from({length:n+2},(_,i)=>'<rect class="h-bar" x="'+(10+i*40)+'" y="40" width="30" height="100" fill="#48c"/>').join('')+
      '</svg>'; };
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:2, setStep(k){ draw(k); } };
    draw(0);`);
  pass('H1 healthy widget (mounts, paints, steps clean)', fH1.failures.length > 0, false, `failures=${fH1.failures.length}${fH1.failures.length ? ' (' + fH1.failures.map((f) => f.cls).join(',') + ')' : ''}`);

  // ── VISUAL-REGRESSION fixtures: the paint-signature must DRIFT on a planted change, stay SILENT on a
  //    match. Each fixture is frozen against `baseVR` (a healthy 3-step widget whose bars shift per step),
  //    then re-probed with one deliberate mutation. This is the half that proves the gate now sees a
  //    SILENTLY-WRONG render (a vanished element, a dropped halo, a frozen step) — not just a crash. ──
  console.log('── VISUAL-REGRESSION (paint-signature drift — must FIRE on a planted change, SILENT on a match) ──');

  // healthy: 3 stroked bars whose y SHIFTS each step → the three steps are visually distinct.
  const healthyVR = `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    const draw=(n)=>{ h.innerHTML='<svg width="320" height="240" viewBox="0 0 320 240">'+
      Array.from({length:3},(_,i)=>'<rect class="vr-bar" x="'+(20+i*90)+'" y="'+(40+n*30)+'" width="60" height="120" fill="#48c" stroke="#123" stroke-width="2"/>').join('')+
      '</svg>'; };
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:2, setStep(k){ draw(k); } };
    draw(0);`;
  const baseVR = (await probeFixture('vr-base', 2, healthyVR)).sigs;
  const drift = (live) => diffEntry('t', live, baseVR);

  // (i) IDENTICAL re-render → NO drift (proves the baseline is stable run-to-run).
  const sameVR = (await probeFixture('vr-same', 2, healthyVR)).sigs;
  pass('VR identical re-render (stable baseline)', drift(sameVR).length > 0, false, `drift-lines=${drift(sameVR).length}`);

  // (ii) MISSING ELEMENT — drop one bar (3→2 marks) → drift MUST fire (count + hash change).
  const missVR = (await probeFixture('vr-miss', 2, healthyVR.replace('{length:3}', '{length:2}'))).sigs;
  pass('VR missing element (planted 3→2 marks)', drift(missVR).length > 0, true, `drift-lines=${drift(missVR).length}`);

  // (iii) DROPPED HALO/STROKE — remove the stroke (the `.svg-halo` regression class) → paint-hash drifts
  //       even though count + geometry are UNCHANGED. This is the case T3 needed a human eye to catch.
  const haloVR = (await probeFixture('vr-halo', 2, healthyVR.replace(/ stroke="#123" stroke-width="2"/g, ''))).sigs;
  pass('VR dropped halo/stroke (count unchanged)', drift(haloVR).length > 0, true, `drift-lines=${drift(haloVR).length}`);

  // (iv) COLLAPSED STEP — setStep becomes a no-op (always renders step 0) → later steps drift from baseline.
  const collVR = (await probeFixture('vr-coll', 2, healthyVR.replace('setStep(k){ draw(k); }', 'setStep(k){ draw(0); }'))).sigs;
  pass('VR collapsed step (setStep no-op)', drift(collVR).length > 0, true, `drift-lines=${drift(collVR).length}`);

  console.log('\n[selftest]', ok
    ? 'PASS — every broken fixture fires its class, the healthy fixture stays silent, AND visual drift is caught'
    : 'FAIL — the gate is BLIND to a broken/drifted widget or fires on a healthy one');
  return ok ? 0 : 1;
}

// ───────────────────────── main ─────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const opt = { ...TH, warnAsError: argv.includes('--warn-as-error') };
  const updateBaseline = argv.includes('--update-baseline');   // re-freeze the visual baseline (deliberate)
  const browser = await chromium.launch(HARDENED);
  // inject the render-probe into EVERY future page context as window.__RENDERPROBE.
  const injectProbe = `window.__RENDERPROBE = ${PROBE.toString()};`;
  const origNewContext = browser.newContext.bind(browser);
  browser.newContext = async (...a) => { const c = await origNewContext(...a); await c.addInitScript(injectProbe); return c; };

  if (argv.includes('--selftest')) {
    const code = await selftest(browser);
    await browser.close();
    process.exit(code);
  }

  // book targets require a build.
  const bookBuilt = existsSync(join(DOCS, 'en', 'book', '05', 'index.html')) || existsSync(join(DOCS, 'en', 'book', '00', 'index.html'));
  if (!bookBuilt) {
    console.log('widget-render-check — docs/ not built. Book widgets SKIPPED. Run `npm run build`, then re-run.');
    console.log('\n[widget-render-check] HARD=0 (no targets — docs/ missing)');
    await browser.close();
    process.exit(0);
  }

  let targets = await discoverTargets();
  // --widget <name>: mount just that one widget (across whatever beat(s) use it) for a fast author loop.
  const wi = argv.indexOf('--widget');
  let onlyWidget = null;
  if (wi >= 0 && argv[wi + 1]) {
    onlyWidget = argv[wi + 1];
    targets = targets.filter((t) => t.widget === onlyWidget);
    if (!targets.length) {
      console.error(`[widget-render-check] --widget "${onlyWidget}" matched no scrolly beat. Known book widgets:`);
      console.error('  ' + [...new Set((await discoverTargets()).map((t) => t.widget))].sort().join(', '));
      await browser.close();
      process.exit(2);
    }
  }
  // only probe chapters that are actually built (BOOK_READY may gate some).
  targets = targets.filter((t) => existsSync(join(DOCS, 'en', 'book', t.chapter, 'index.html')));

  srv = await serveDir(DOCS, { base: BASE });
  let totalHard = 0;
  try {
  console.log(`widget-render-check — "does it RUN" gate. Mounting ${targets.length} book scroll-step widget(s)`
    + `${onlyWidget ? ` (--widget ${onlyWidget})` : ''} in ${THEMES.join('/')} themes, stepping all steps`
    + ` (one shared page load per chapter).`);
  console.log(`detection: console.error/pageerror/unhandledrejection · mount-missing · setStep-throw · empty/degenerate render`
    + `${opt.warnAsError ? ' · (console.warn → HARD)' : ''}\n`);

  // GROUP BY CHAPTER — load each chapter's page ONCE per theme and probe all its beats on the shared
  // page (all scrolly beats mount eagerly on load). Preserves discovery order of both chapters and beats.
  const byChapter = new Map();
  for (const tg of targets) {
    if (!byChapter.has(tg.chapter)) byChapter.set(tg.chapter, []);
    byChapter.get(tg.chapter).push(tg);
  }
  const results = [];
  for (const [chapter, beats] of byChapter) {
    process.stderr.write(`· chapter ${chapter} — ${beats.length} beat(s): ${beats.map((b) => b.widget).join(', ')}\n`);
    const chResults = await runChapter(browser, chapter, beats, opt);
    for (const r of chResults) {
      results.push(r);
      const p = printResult(r);
      totalHard += p.hard;
      console.log(p.text);
    }
  }

  // summary — list every widget+theme with a HARD failure, with its classes, so the report is
  // directly actionable (widget · step · theme · class · message already printed above).
  console.log(`\n──────── SUMMARY ────────`);
  const offenders = [];
  for (const r of results) {
    for (const theme of THEMES) {
      const t = r.themes[theme];
      if (t && t.failures && t.failures.length) {
        const classes = [...new Set(t.failures.map((f) => f.cls))].join(',');
        offenders.push(`✗ ${r.name} [${theme}] — ${t.failures.length} failure(s): ${classes}`);
      }
    }
  }
  console.log(`widgets mounted: ${results.length}  ·  themes: ${THEMES.length}  ·  HARD failures: ${totalHard}`);
  if (offenders.length) { console.log('offenders (fix these — details above):'); for (const o of offenders) console.log('   ' + o); }
  else console.log('all widgets mount, step, and render cleanly in both themes.');

  // ───────────────────────── VISUAL REGRESSION: paint-signature drift vs frozen baseline ─────────────────────────
  const entries = {};
  for (const r of results) entries[`${r.name}·${r.beat}`] = liveSigs(r);

  if (updateBaseline) {
    if (!existsSync(BDIR)) mkdirSync(BDIR, { recursive: true });
    const payload = {
      _meta: {
        gate: 'widget-render-check (G10) — visual regression',
        note: 'Per (widget·beat, theme): {v:visible-count, sig:paint-hash} per step — the frozen healthy render. '
          + 'The gate HARD-fails on DRIFT (mark added/removed, step collapsed, fill/stroke/halo change). After an '
          + 'INTENTIONAL visual change run `node _audit/widget-render-check.mjs --update-baseline`, then REVIEW the '
          + 'git diff before committing. A new widget (L7…) auto-adds its row on the first --update-baseline.',
        themes: THEMES,
        coarsen: 'Math.round(box/6) px buckets (anti sub-pixel jitter — matches slide-viz signature)',
        platform: process.platform,   // a paint signature is PER-PLATFORM (font/sub-pixel render differs)
        widgets: Object.keys(entries).length,
      },
      entries,
    };
    writeFileSync(BFILE, JSON.stringify(payload, null, 2) + '\n');
    console.log(`\n[visual-baseline] wrote ${Object.keys(entries).length} widget entr(ies) → ${BREL}. REVIEW the diff before committing.`);
  } else {
    const base = loadBaseline();
    let driftN = 0, newN = 0;
    // A paint signature is PER-PLATFORM: font metrics + sub-pixel rendering differ across OSes (like a
    // golden screenshot), so the baseline HARD-gates drift only on the platform it was frozen on (local
    // dev, or a same-OS runner). On a different OS (e.g. a macOS-frozen baseline under GitHub's ubuntu
    // runner) the drift is reported but NOT gated — the RUN checks (mount/console/setStep/empty) still
    // gate every platform. WIDGET_VIZ_FORCE=1 forces the comparison anywhere.
    const basePlat = base && base._meta && base._meta.platform;
    const crossPlatform = basePlat && basePlat !== process.platform && !process.env.WIDGET_VIZ_FORCE;
    if (!base || !base.entries) {
      console.log(`\n[visual-regression] NO BASELINE (${BREL} missing) — run \`--update-baseline\` to freeze. Visual drift NOT checked this run.`);
    } else {
      console.log('\n──────── VISUAL REGRESSION (paint-signature drift vs baseline) ────────');
      for (const key of Object.keys(entries)) {
        const liveE = entries[key], baseE = base.entries[key];
        if (!baseE) { newN++; console.log(`  • NEW (not baselined): ${key} — freeze with --update-baseline`); continue; }
        for (const theme of THEMES) {
          const live = liveE[theme], b = baseE[theme];
          if (!live || !b) continue;   // theme not mounted → the RUN gate already HARD-failed it
          for (const m of diffEntry(theme, live, b)) { driftN++; console.log(`  ${crossPlatform ? '·' : '✗'} DRIFT ${key} ${m}`); }
        }
      }
      for (const key of Object.keys(base.entries)) if (!entries[key]) console.log(`  • STALE baseline entry (widget no longer discovered): ${key} — prune via --update-baseline`);
      console.log(driftN || newN ? `  → drift=${driftN}  new=${newN}` : '  all widget signatures match baseline (no visual drift).');
      if (crossPlatform && driftN) {
        console.log(`  ⚠ CROSS-PLATFORM: baseline frozen on '${basePlat}', running on '${process.platform}' — the ${driftN} drift(s) above are INFORMATIONAL (a paint signature is per-platform), NOT gated. RUN checks still gate; freeze a '${process.platform}' baseline (\`--update-baseline\`) or set WIDGET_VIZ_FORCE=1 to gate here.`);
      }
    }
    if (!crossPlatform) totalHard += driftN;   // DRIFT is HARD only on the baseline's own platform
  }

  const ji = argv.indexOf('--json');
  if (ji >= 0 && argv[ji + 1]) writeFileSync(argv[ji + 1], JSON.stringify(results, null, 2));

  await browser.close();
  } finally {
    await srv.close();
  }
  console.log(`\n[widget-render-check] HARD(console-error/page-error/mount-missing/setstep-throw/empty-render/visual-drift)=${totalHard}`);
  process.exit(totalHard > 0 ? 1 : 0);
}

main();
