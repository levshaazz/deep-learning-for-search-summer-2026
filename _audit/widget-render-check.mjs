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
import { HARDENED } from './lib/gate-harness.mjs';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { writeFileSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const CDIR = join(ROOT, 'content', 'book');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8153;
const THEMES = ['light', 'dark'];
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.map': 'application/json' };

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
function bookServer() {
  const s = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.startsWith(BASE)) p = p.slice(BASE.length);
    let file = join(DOCS, p);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.statusCode = 404; res.end('404'); return; }
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
  return new Promise((r) => s.listen(PORT, () => r(s)));
}
const bookUrl = (ch, lang = 'en') => `http://localhost:${PORT}${BASE}/${lang}/book/${ch}/`;

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

  // (1) SVG geometry primitives.
  host.querySelectorAll([...SVG_GEOM].join(',')).forEach((el) => {
    if (seen.has(el) || (el.closest && el.closest('.katex')) || chrome(el)) return;
    if (!effVisible(el)) return;
    if (!hasArea(el.getBoundingClientRect(), el)) return;
    seen.add(el); visible++;
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
    if (directText || paintedBg || borderVisible || isImg) { seen.add(el); visible++; }
  });

  return {
    ok: true,
    figKind, svgCount,
    figW: Math.round(figBox.width), figH: Math.round(figBox.height),
    figArea: Math.round(figArea),
    visible,
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
   BOOK driver: load chapter, attach console/page error listeners BEFORE any
   widget code runs, confirm mount, walk every step under setStep, probe each.
   Returns per-theme: { mountOK, maxStep, steps[], failures[] }.
   ========================================================================= */
async function runWidget(browser, target, opt) {
  const result = { name: `${target.widget}`, beat: target.beat, chapter: target.chapter, themes: {} };
  for (const theme of THEMES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const failures = [];          // {cls, step, msg, stack}
    const consoleErrs = [];       // raw, attributed to the current phase
    let phase = 'mount';          // 'mount' | 'step:k' — tags errors with where they happened

    // CONSOLE — capture error (and warn) lines as they happen, tagging the current phase.
    page.on('console', (m) => {
      const type = m.type();
      const wantWarn = opt.warnAsError && type === 'warning';
      if (type !== 'error' && !wantWarn) return;
      const txt = m.text();
      if (isBenign(txt)) return;
      consoleErrs.push({ cls: 'CONSOLE-ERROR', phase, msg: `[console.${type}] ${txt}` });
    });
    // PAGE ERROR — uncaught exception on the page (window.onerror).
    page.on('pageerror', (e) => {
      consoleErrs.push({ cls: 'PAGE-ERROR', phase, msg: String(e && e.message || e), stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' });
    });

    try {
      // theme + lang BEFORE the page scripts evaluate (so widgets mount in the target theme).
      // CRITICAL: addInitScript runs on EVERY document, including the initial about:blank where
      // document.documentElement is still null — touching it there throws, and OUR pageerror
      // listener would then mis-attribute that harness throw to the widget. So everything here is
      // null-guarded and the theme is (re)applied once the real <html> exists. (This is the gate
      // eating its own dog food: an injected helper that throws would itself trip the detector.)
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

      await page.goto(bookUrl(target.chapter), { waitUntil: 'networkidle' });

      // MOUNT-MISSING — wait for the page to mount this beat's widget onto window.__figs. The mount
      // is a module script (Astro auto-glob); under load it can land just AFTER networkidle, so a
      // single waitForFunction occasionally races (a flaky MOUNT-MISSING). We wait robustly: first
      // for the __figs map itself, then for this beat — and if that races, settle + recheck once
      // before declaring it missing, so MOUNT-MISSING fires ONLY when the widget genuinely never
      // mounts (a real export-not-found / mount-threw), never on a timing flake.
      const waitForBeat = () => page.waitForFunction((beat) => window.__figs && window.__figs[beat] &&
        typeof window.__figs[beat].setStep === 'function', target.beat, { timeout: opt.MOUNT_TIMEOUT })
        .then(() => true).catch(() => false);
      let landed = await waitForBeat();
      if (!landed) {
        // grace: the scrolly module may still be evaluating — give it one more settle + recheck.
        await page.waitForTimeout(1500);
        landed = await page.evaluate((beat) => !!(window.__figs && window.__figs[beat] &&
          typeof window.__figs[beat].setStep === 'function'), target.beat);
      }
      const mounted = await page.evaluate((beat) => {
        const figs = window.__figs;
        if (!figs) return { ok: false, reason: 'window.__figs is undefined — the chapter scrolly script never ran (page load failure)' };
        const f = figs[beat];
        if (!f) return { ok: false, reason: 'window.__figs["' + beat + '"] is undefined — mount export not found or mount threw (other beats mounted: ' + Object.keys(figs).join(', ') + ')' };
        if (typeof f.setStep !== 'function') return { ok: false, reason: 'window.__figs["' + beat + '"].setStep is not a function' };
        return { ok: true, maxStep: typeof f.maxStep === 'number' ? f.maxStep : 0 };
      }, target.beat);

      if (!mounted.ok) {
        failures.push({ cls: 'MOUNT-MISSING', step: 'mount', msg: mounted.reason });
        // fold in any console/page errors that fired during mount (these usually explain WHY).
        for (const c of consoleErrs) failures.push({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack });
        result.themes[theme] = { mountOK: false, failures };
        await ctx.close();
        continue;
      }
      const maxStep = mounted.maxStep;

      // bring the figure into view so it has a real laid-out box (off-screen → 0×0).
      await page.evaluate((beat) => {
        const h = document.getElementById('fig-' + beat);
        if (h) h.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, target.beat);
      await page.waitForTimeout(200);

      const steps = [];
      for (let k = 0; k <= maxStep; k++) {
        phase = 'step:' + k;
        // SETSTEP-THROW — call setStep inside a try in the page so a throw is reported, not swallowed.
        const stepRes = await page.evaluate(({ beat, kk }) => {
          try { window.__figs[beat].setStep(kk); return { ok: true }; }
          catch (e) { return { ok: false, msg: String(e && e.message || e), stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' }; }
        }, { beat: target.beat, kk: k });
        if (!stepRes.ok) {
          failures.push({ cls: 'SETSTEP-THROW', step: k, msg: stepRes.msg, stack: stepRes.stack });
        }
        await page.waitForTimeout(opt.STEP_SETTLE);
        // EMPTY-RENDER — probe the figure health at this step.
        const probe = await page.evaluate(({ beat, o }) => window.__RENDERPROBE(beat, o), { beat: target.beat, o: opt });
        const empty = emptyVerdict(probe);
        if (empty) failures.push({ cls: 'EMPTY-RENDER', step: k, msg: empty });
        steps.push({ k, probe, setStepOk: stepRes.ok });
      }

      // attribute any console/page errors collected over the whole run.
      for (const c of consoleErrs) {
        failures.push({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack });
      }
      result.themes[theme] = { mountOK: true, maxStep, steps, failures };
    } catch (e) {
      // an unexpected harness/navigation error → treat as a render failure for this widget+theme.
      for (const c of consoleErrs) failures.push({ cls: c.cls, step: c.phase, msg: c.msg, stack: c.stack });
      failures.push({ cls: 'HARNESS', step: 'load', msg: String(e).slice(0, 240) });
      result.themes[theme] = { mountOK: false, failures };
    } finally {
      await ctx.close();
    }
  }
  return result;
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
      await ctx.close(); return failures;
    }
    for (let k = 0; k <= mounted.maxStep; k++) {
      phase = 'step:' + k;
      const sr = await page.evaluate(({ b, kk }) => { try { window.__figs[b].setStep(kk); return { ok: true }; } catch (e) { return { ok: false, msg: String(e && e.message || e) }; } }, { b: beat, kk: k });
      if (!sr.ok) failures.push({ cls: 'SETSTEP-THROW', step: k, msg: sr.msg });
      await page.waitForTimeout(60);
      const probe = await page.evaluate(({ b, o }) => window.__RENDERPROBE(b, o), { b: beat, o: opt });
      const empty = emptyVerdict(probe);
      if (empty) failures.push({ cls: 'EMPTY-RENDER', step: k, msg: empty });
    }
    for (const c of consoleErrs) failures.push(c);
    await ctx.close();
    return failures;
  }

  console.log('── BROKEN fixtures (each must FIRE) ──');

  // S1 — MOUNT-MISSING: build a host but register NOTHING on window.__figs.
  const fS1 = await probeFixture('broken-missing', 0, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    window.__figs = window.__figs || {}; /* deliberately do NOT set __figs[beat] */`);
  pass('S1 mount-missing (export not found)', fS1.some((f) => f.cls === 'MOUNT-MISSING'), true, (fS1.find((f) => f.cls === 'MOUNT-MISSING') || {}).msg);

  // S2 — CONSOLE-ERROR: a widget that mounts + paints, but logs console.error during a step.
  const fS2 = await probeFixture('broken-console', 1, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><rect class="x-box" x="10" y="10" width="120" height="80" fill="#3a7"/></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:1, setStep(k){ if(k===1) console.error('widget bug: cannot read x of undefined'); } };`);
  pass('S2 console.error during step', fS2.some((f) => f.cls === 'CONSOLE-ERROR'), true, (fS2.find((f) => f.cls === 'CONSOLE-ERROR') || {}).msg);

  // S3 — SETSTEP-THROW: setStep raises on a later step.
  const fS3 = await probeFixture('broken-throw', 2, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><circle class="x-dot" cx="50" cy="50" r="20" fill="#27e"/></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:2, setStep(k){ if(k===2){ const z=null; return z.nope.deep; } } };`);
  pass('S3 setStep throws (null deref)', fS3.some((f) => f.cls === 'SETSTEP-THROW'), true, (fS3.find((f) => f.cls === 'SETSTEP-THROW') || {}).msg);

  // S4 — EMPTY-RENDER: mounts fine, setStep never errors, but paints an EMPTY figure (no marks).
  const fS4 = await probeFixture('broken-empty', 1, `
    const h=document.createElement('div'); h.id='fig-'+beat; document.getElementById('stage').appendChild(h);
    h.innerHTML='<svg width="300" height="200" viewBox="0 0 300 200"><!-- nothing painted --></svg>';
    window.__figs = window.__figs || {};
    window.__figs[beat] = { maxStep:1, setStep(k){ /* renders nothing, ever */ } };`);
  pass('S4 empty render (zero visible marks)', fS4.some((f) => f.cls === 'EMPTY-RENDER'), true, (fS4.find((f) => f.cls === 'EMPTY-RENDER') || {}).msg);

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
  pass('H1 healthy widget (mounts, paints, steps clean)', fH1.length > 0, false, `failures=${fH1.length}${fH1.length ? ' (' + fH1.map((f) => f.cls).join(',') + ')' : ''}`);

  console.log('\n[selftest]', ok
    ? 'PASS — every broken fixture fires its class AND the healthy fixture stays silent'
    : 'FAIL — the gate is BLIND to a broken widget or fires on a healthy one');
  return ok ? 0 : 1;
}

// ───────────────────────── main ─────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const opt = { ...TH, warnAsError: argv.includes('--warn-as-error') };
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

  const srv = await bookServer();
  console.log(`widget-render-check — "does it RUN" gate. Mounting ${targets.length} book scroll-step widget(s)`
    + `${onlyWidget ? ` (--widget ${onlyWidget})` : ''} in ${THEMES.join('/')} themes, stepping all steps.`);
  console.log(`detection: console.error/pageerror/unhandledrejection · mount-missing · setStep-throw · empty/degenerate render`
    + `${opt.warnAsError ? ' · (console.warn → HARD)' : ''}\n`);

  const results = [];
  let totalHard = 0;
  for (const tg of targets) {
    process.stderr.write(`· ${tg.widget} (${tg.chapter}·${tg.beat})\n`);
    const r = await runWidget(browser, tg, opt);
    results.push(r);
    const p = printResult(r);
    totalHard += p.hard;
    console.log(p.text);
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

  const ji = argv.indexOf('--json');
  if (ji >= 0 && argv[ji + 1]) writeFileSync(argv[ji + 1], JSON.stringify(results, null, 2));

  await browser.close();
  srv.close();
  console.log(`\n[widget-render-check] HARD(console-error/page-error/mount-missing/setstep-throw/empty-render)=${totalHard}`);
  process.exit(totalHard > 0 ? 1 : 0);
}

main();
