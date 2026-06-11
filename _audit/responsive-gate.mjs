/* responsive-gate.mjs — AUDIT_SITE G8.
   The Book is mobile-first (the inverse of the hall-only decks). This gate serves the built site
   (docs/) and loads each Book chapter at phone + tablet widths, asserting NO horizontal overflow
   and that the figure actually rendered with a non-zero box inside the viewport. Severity: HARD.
   Self-test: the overflow detector must flag a deliberately too-wide element.

   Requires a build first (docs/). Usage:  node _audit/responsive-gate.mjs  |  --selftest
*/
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDir, withBrowser, withPage } from './lib/gate-harness.mjs';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const WIDTHS = [390, 768];
const LANGS = ['en', 'ru'];

// Data-driven (Dim-E H2): every built Book chapter × built language, discovered from docs/.
// Adding L7 needs ZERO edits here — build the chapter and it is responsive-tested automatically.
function discoverPages() {
  const pages = [];
  for (const lang of LANGS) {
    const bookDir = join(DOCS, lang, 'book');
    if (!existsSync(bookDir)) continue;
    for (const id of readdirSync(bookDir).sort()) {
      if (existsSync(join(bookDir, id, 'index.html'))) pages.push(`${lang}/book/${id}/`);
    }
  }
  return pages;
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
  const PAGES = discoverPages();
  if (!PAGES.length) { console.error('[responsive] no built Book pages found under docs/.'); return 1; }
  const server = await serveDir(DOCS, { base: BASE });
  const report = [];
  await withBrowser(async (b) => {
    for (const page of PAGES) {
      for (const w of WIDTHS) {
        await withPage(b, { viewport: { width: w, height: 820 } }, async (p, cap) => {
          await p.goto(server.href(page), { waitUntil: 'networkidle' });
          await p.waitForTimeout(150);
          const r = await p.evaluate(pageChecks);
          const bad = [];
          if (r.overflow > 2) bad.push(`H-OVERFLOW ${r.overflow}px (widest "${r.widestSel}"=${r.widest})`);
          if (!r.figOk) bad.push(`figure not laid out (${r.figCount} figs)`);
          if (cap.pageerrors.length) bad.push(`console errors ${cap.pageerrors.length}`);
          report.push({ page, w, bad });
        });
      }
    }
  });
  await server.close();
  const hard = report.filter((r) => r.bad.length);
  console.log(`[responsive] checked ${PAGES.length} Book pages × ${WIDTHS.join('/')}px`);
  for (const r of report) console.log(`  ${r.bad.length ? '✗' : '·'} ${r.page} @${r.w}  ${r.bad.join('; ') || 'ok'}`);
  console.log(`\n[responsive] HARD(overflow/layout)=${hard.length}`);
  return hard.length ? 1 : 0;
}

async function selftest() {
  const r = await withBrowser((b) => withPage(b, { viewport: { width: 390, height: 800 } }, async (p) => {
    await p.setContent('<main><div style="width:1500px;height:40px;background:#000">wide</div></main>');
    return p.evaluate(pageChecks);
  }));
  const ok = r.overflow > 2;
  console.log('[selftest] overflow on a 1500px element @390:', r.overflow, 'px');
  console.log('[selftest]', ok ? 'PASS — overflow detector fires' : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(await (process.argv.includes('--selftest') ? selftest() : run()));
