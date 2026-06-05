/* responsive-gate.mjs — AUDIT_SITE G8.
   The Book is mobile-first (the inverse of the hall-only decks). This gate serves the built site
   (docs/) and loads each Book chapter at phone + tablet widths, asserting NO horizontal overflow
   and that the figure actually rendered with a non-zero box inside the viewport. Severity: HARD.
   Self-test: the overflow detector must flag a deliberately too-wide element.

   Requires a build first (docs/). Usage:  node _audit/responsive-gate.mjs  |  --selftest
*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8099;
const WIDTHS = [390, 768];
const PAGES = ['en/book/00/', 'en/book/01/', 'en/book/02/', 'ru/book/02/'];
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

function serve() {
  return createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.startsWith(BASE)) p = p.slice(BASE.length);
    let file = join(DOCS, p);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.statusCode = 404; res.end('404'); return; }
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
}

// runs IN the page: is there horizontal overflow, and did a widget render?
function pageChecks() {
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;            // >0 → horizontal scroll
  const figs = [...document.querySelectorAll('.wgt-svg, .wgt-panel, .cs-svg')];
  const figBox = figs.map((f) => f.getBoundingClientRect());
  const figOk = figBox.length > 0 && figBox.every((b) => b.width > 0 && b.right <= window.innerWidth + 1);
  // any element wider than the viewport?
  let widest = 0, widestSel = '';
  for (const el of document.querySelectorAll('main *')) {
    const w = el.getBoundingClientRect().width;
    if (w > widest) { widest = w; widestSel = el.className || el.tagName; }
  }
  return { overflow, figCount: figs.length, figOk, widest: Math.round(widest), widestSel: String(widestSel).slice(0, 40) };
}

async function run() {
  if (!existsSync(DOCS)) { console.error('[responsive] docs/ not found — run npm run build first.'); return 1; }
  const server = serve(); await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch();
  const report = [];
  for (const page of PAGES) {
    for (const w of WIDTHS) {
      const p = await b.newPage({ viewport: { width: w, height: 820 } });
      const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
      await p.goto(`http://localhost:${PORT}${BASE}/${page}`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(150);
      const r = await p.evaluate(pageChecks);
      const bad = [];
      if (r.overflow > 2) bad.push(`H-OVERFLOW ${r.overflow}px (widest "${r.widestSel}"=${r.widest})`);
      if (!r.figOk) bad.push(`figure not laid out (${r.figCount} figs)`);
      if (errs.length) bad.push(`console errors ${errs.length}`);
      report.push({ page, w, bad });
      await p.close();
    }
  }
  await b.close(); server.close();
  const hard = report.filter((r) => r.bad.length);
  console.log(`[responsive] checked ${PAGES.length} Book pages × ${WIDTHS.join('/')}px`);
  for (const r of report) console.log(`  ${r.bad.length ? '✗' : '·'} ${r.page} @${r.w}  ${r.bad.join('; ') || 'ok'}`);
  console.log(`\n[responsive] HARD(overflow/layout)=${hard.length}`);
  return hard.length ? 1 : 0;
}

async function selftest() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 800 } });
  await p.setContent('<main><div style="width:1500px;height:40px;background:#000">wide</div></main>');
  const r = await p.evaluate(pageChecks);
  await b.close();
  const ok = r.overflow > 2;
  console.log('[selftest] overflow on a 1500px element @390:', r.overflow, 'px');
  console.log('[selftest]', ok ? 'PASS — overflow detector fires' : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(await (process.argv.includes('--selftest') ? selftest() : run()));
