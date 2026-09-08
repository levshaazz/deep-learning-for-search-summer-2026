/*
 * readability-gate.mjs — the READABILITY (SCALE) gate (G20). Browser-rendered.
 *
 * The "масштаб / scale" half of the readability brief: HTML PROSE text must not be
 * authored below a legibility floor. viz-probe only WARNs on sub-16px text and only
 * inside figures; this HARD-enforces a floor on the slide/book PROSE that a reader reads.
 *
 * It floors the RAW authored font-size (the --fs-* scale, which G2b ratchets), NOT the
 * effective post-transform size: the decks fit-scale content to the 1920×1080 frame by
 * design (a diagram renders at ~0.38, a packed body at ~0.9), so effective px swings
 * 6–30px and an effective floor false-fires everywhere. Fit-scale legibility is bounded
 * indirectly by G18 (no walls of text) + G19 (no frame overflow); FIGURE geometry +
 * figure-label OVERLAP are slide-viz's (G9) and viz-probe's (G13, now HARD) domain.
 * Figures/SVG/KaTeX/reveal-answers are excluded here so this gate owns PROSE only.
 *
 *   node readability-gate.mjs            # audit decks + book (needs a build)
 *   node readability-gate.mjs --measure  # print the raw-font distribution, no pass/fail
 *   node readability-gate.mjs --selftest # a planted sub-floor font must fire
 *
 * Exit: non-zero whenever HARD > 0.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { serveDir, withBrowser, withPage, makeReporter } from './lib/gate-harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DECKDIR = join(ROOT, 'Lectures');
const DOCS = join(ROOT, 'docs');

// Per-surface RAW font-size floors (px, before fit-transforms). fontSize is a deterministic
// CSS value (not glyph-metric dependent) → renders identically in CI. CALIBRATED with --measure
// to sit just below the smallest LEGITIMATE prose font on each surface → strict, zero false
// positives. Raise deliberately (and never weaken). Figures/labels are excluded (G9/G13 own those).
const DECK_FONT_FLOOR = 11;   // deck PROSE bottoms out at 11.2px (deck 04 fine-print); sub-11 = a regression
const BOOK_FONT_FLOOR = 12;   // book PROSE bottoms out at 12.5px (the --fz-tiny captions); sub-12 = a regression
const BASE = '/deep-learning-for-search-summer-2026';   // GH-Pages base prefix the built book references

// in-page collector: visible text-bearing leaves + their effective font px + boxes.
// Returns { fonts:[{px,txt,cls}], pairs:[{a,b,frac}] } for the CURRENT visible slide / whole doc.
const COLLECT = (rootSel) => {
  const MIN_CHARS = 6;          // inlined: this fn is stringified + eval'd in the browser (no module scope)
  const root = rootSel ? document.querySelector(rootSel) : document.body;
  if (!root) return { fonts: [], runs: 0 };
  const SVG = 'http://www.w3.org/2000/svg';
  const ownText = (el) => {                         // direct (non-descendant) text of el
    let s = '';
    for (const n of el.childNodes) if (n.nodeType === 3) s += n.textContent;
    return s.replace(/\s+/g, ' ').trim();
  };
  const skip = (el) => {
    if (el.namespaceURI === SVG) return true;                         // SVG internals → slide-viz's job
    if (el.closest && el.closest('svg')) return true;
    if (el.closest && el.closest('.katex') && !(el.classList && el.classList.contains('katex'))) return true;
    if (el.closest && (el.closest('details:not([open])') || el.closest('.ha-content'))) return true; // hidden reveal
    if (el.closest && el.closest('aside.slide-notes')) return true;   // speaker notes never render
    // FIGURES are slide-viz's (G9) domain: their labels are fit-scaled inside viz-frames and judged
    // by figure-internal geometry, not body-text legibility. PROSE scale is what this gate owns.
    if (el.closest && el.closest('.viz-frame, figure, .cs-mount, .scrolly-graphic, .cameo')) return true;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return true;
    return false;
  };
  const fonts = [];
  for (const el of root.querySelectorAll('*')) {
    if (skip(el)) continue;
    const txt = ownText(el);
    if (txt.length < MIN_CHARS) continue;            // a real readable run
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    // RAW authored font-size — NOT effScale-adjusted. The decks fit-scale content to the
    // 1920×1080 frame by design (a GloVe diagram renders at ~0.38, a packed slide-body at 0.9),
    // so effective px varies 6–30px and an effective floor false-fires everywhere. The enforceable
    // knob is the AUTHORED size (the --fs-* scale, which G2b ratchets); fit-scale legibility is
    // bounded indirectly by G18 (no walls of text) + G19 (no overflow) + G9 (figure geometry).
    const px = parseFloat(getComputedStyle(el).fontSize);
    const cls = el.className && el.className.baseVal !== undefined ? el.className.baseVal : (el.className || '');
    fonts.push({ px: +px.toFixed(1), txt: txt.slice(0, 40), cls: typeof cls === 'string' ? cls.slice(0, 30) : '' });
  }
  return { fonts, runs: fonts.length };
};

// Широкий класс: слайд может нести дополнительные классы (<section class="slide w2v-slide">).
// Точный шаблон терял 17 слайдов в деках 03/06/07 — они просто не посещались этим гейтом.
function deckSlideCount(html) { return (html.match(/<section class="(?:[^"]*\s)?slide(?:\s[^"]*)?"/g) || []).length; }

// serve docs/ under the GH-Pages base prefix so the built Book's absolute /BASE/... asset
// paths resolve (the harness serveDir serves at root, which would 404 those).
function serveDocsBase() {
  const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
  const srv = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.startsWith(BASE)) p = p.slice(BASE.length);
      if (p.endsWith('/')) p += 'index.html';
      const body = await readFile(join(DOCS, p));
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('404'); }
  });
  return new Promise((resolve) => srv.listen(0, () => resolve({
    href: (path) => `http://localhost:${srv.address().port}${BASE}${path}`,
    close: () => new Promise((r) => srv.close(r)),
  })));
}

async function eachDeckSlide(page, deck, server, fn) {
  const n = deckSlideCount(readFileSync(join(DECKDIR, deck), 'utf8'));
  await page.goto(server.href(deck), { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  for (let i = 1; i <= n; i++) {
    await page.evaluate((k) => { location.hash = '#/' + k; }, i);
    await page.waitForTimeout(160);
    const vis = await page.evaluate((collectStr) => {
      const COLLECT = eval('(' + collectStr + ')');
      const slides = [...document.querySelectorAll('section.slide')];
      const v = slides.find((s) => { const cs = getComputedStyle(s); return cs.display !== 'none' && cs.visibility !== 'hidden' && s.getAttribute('aria-hidden') !== 'true'; });
      if (!v) return null;
      // mark the visible slide with a CLEARED data-attr (never a reused id — that collided across
      // slides and made querySelector keep returning the now-hidden slide 1).
      document.querySelectorAll('[data-rg1]').forEach((e) => e.removeAttribute('data-rg1'));
      v.setAttribute('data-rg1', '');
      return COLLECT('[data-rg1]');
    }, COLLECT.toString());
    if (vis) await fn(i, vis);
  }
}

async function run({ measure = false } = {}) {
  const R = makeReporter('readability');
  const decks = readdirSync(DECKDIR).filter((f) => /^\d.*\.html$/.test(f)).sort();
  const deckServer = await serveDir(DECKDIR);
  const haveBook = existsSync(join(DOCS, 'en', 'book'));
  const bookServer = haveBook ? await serveDocsBase() : null;
  const bookIds = haveBook ? readdirSync(join(DOCS, 'en', 'book')).filter((d) => /^\d+$/.test(d)).sort() : [];
  const deckMins = {}, bookMins = {};
  try {
    await withBrowser(async (browser) => {
      // ---- DECK pass: native 1920×1080, floor DECK_FONT_FLOOR ----
      await withPage(browser, { viewport: { width: 1920, height: 1080 } }, async (page) => {
        for (const deck of decks) {
          let min = Infinity, minTxt = '';
          await eachDeckSlide(page, deck, deckServer, (i, vis) => {
            for (const f of vis.fonts) if (f.px < min) { min = f.px; minTxt = `${f.cls}|${f.txt}`; }
            for (const f of vis.fonts) if (!measure && f.px < DECK_FONT_FLOOR)
              R.err(`deck ${deck} · slide ${i} — raw font ${f.px}px < ${DECK_FONT_FLOOR}px floor: "${f.txt}" (.${f.cls})`);
          });
          deckMins[deck] = +min.toFixed(1);
        }
      });
      // ---- BOOK pass: desktop width, floor BOOK_FONT_FLOOR (EN; scale + overlap are layout-driven) ----
      if (bookServer) await withPage(browser, { viewport: { width: 1280, height: 1000 } }, async (page) => {
        for (const id of bookIds) {
          await page.goto(bookServer.href(`/en/book/${id}/`), { waitUntil: 'networkidle' });
          await page.waitForTimeout(300);
          const vis = await page.evaluate((s) => eval('(' + s + ')')('.book'), COLLECT.toString());
          let min = Infinity;
          for (const f of vis.fonts) { if (f.px < min) min = f.px;
            if (!measure && f.px < BOOK_FONT_FLOOR) R.err(`book ${id} — raw font ${f.px}px < ${BOOK_FONT_FLOOR}px floor: "${f.txt}" (.${f.cls})`); }
          bookMins[id] = min === Infinity ? null : +min.toFixed(1);
        }
      });
    });
  } finally { await deckServer.close(); if (bookServer) await bookServer.close(); }

  if (measure) {
    console.log('\n[measure] DECK smallest RAW font per deck (px):');
    for (const [d, v] of Object.entries(deckMins)) console.log(`  ${d.padEnd(34)} ${String(v).padStart(5)}px`);
    console.log('\n[measure] BOOK smallest RAW font per chapter (px):');
    for (const [d, v] of Object.entries(bookMins)) console.log(`  book/${d.padEnd(4)} ${String(v).padStart(5)}px`);
    return 0;
  }
  console.log(`\n[readability] scanned ${decks.length} deck(s) + ${bookIds.length} book chapter(s)`);
  console.log(`[readability] HARD(sub-floor raw font)=${R.errors}` + (R.errors ? '' : '  — every authored text run meets the legibility floor ✓'));
  return R.errors ? 1 : 0;
}

async function selftest() {
  const html = `<!doctype html><html><head><style>html,body{margin:0}
    section.slide{height:1080px;width:1920px;position:relative;font-family:sans-serif}
    section.slide[aria-hidden="true"]{display:none}
    .tiny{font-size:9px} .ok{font-size:40px}
  </style></head><body>
    <section class="slide" data-screen-label="01"><p class="ok">This is a perfectly legible heading run.</p></section>
    <section class="slide" data-screen-label="02" aria-hidden="true"><p class="tiny">microscopic illegible caption text here</p></section>
    <script>function go(){const h=location.hash.replace('#/','')||'1';document.querySelectorAll('section.slide').forEach((s,i)=>s.setAttribute('aria-hidden',String(i!==(+h-1))));}
    window.addEventListener('hashchange',go);go();</script></body></html>`;
  const dir = join(ROOT, '_internal', '_readability_selftest');
  (await import('node:fs')).mkdirSync(dir, { recursive: true });
  (await import('node:fs')).writeFileSync(join(dir, 'fixture.html'), html);
  const server = await serveDir(dir);
  let smallFired = false, cleanSilent = true;
  try {
    await withBrowser(async (browser) => {
      await withPage(browser, { viewport: { width: 1920, height: 1080 } }, async (page) => {
        await page.goto(server.href('fixture.html'), { waitUntil: 'networkidle' });
        for (const i of [1, 2]) {
          await page.evaluate((k) => { location.hash = '#/' + k; }, i); await page.waitForTimeout(150);
          const vis = await page.evaluate((collectStr) => {
            const COLLECT = eval('(' + collectStr + ')');
            const v = [...document.querySelectorAll('section.slide')].find((s) => getComputedStyle(s).display !== 'none' && s.getAttribute('aria-hidden') !== 'true');
            if (!v) return { fonts: [] };
            document.querySelectorAll('[data-rg1]').forEach((e) => e.removeAttribute('data-rg1'));
            v.setAttribute('data-rg1', ''); return COLLECT('[data-rg1]');
          }, COLLECT.toString());
          const tooSmall = vis.fonts.some((f) => f.px < DECK_FONT_FLOOR);
          if (i === 1 && tooSmall) cleanSilent = false;       // 40px heading must NOT fire
          if (i === 2 && tooSmall) smallFired = true;          // 9px caption MUST fire
        }
      });
    });
  } finally { await server.close(); }
  const ok = smallFired && cleanSilent;
  console.log(`[selftest] sub-floor raw font fires=${smallFired}  clean slide silent=${cleanSilent}`);
  console.log('[selftest]', ok ? 'PASS — readability detector fires on a sub-floor authored font, silent on a legible one'
                               : 'FAIL — blind to an illegible font size!');
  return ok ? 0 : 1;
}

const argv = process.argv.slice(2);
process.exit(await (argv.includes('--selftest') ? selftest() : run({ measure: argv.includes('--measure') })));
