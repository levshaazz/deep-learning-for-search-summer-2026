#!/usr/bin/env node
/* =========================================================
   ci-gate.mjs — production smoke gate for the lecture template.
   Self-contained: spins up a tiny Node static server (no python needed),
   drives the deck in headless Chromium, and FAILS (exit 1) if any invariant
   is violated. Verbose by design — every assertion logs its evidence.

   Invariants checked:
     [A] editable deck loads, 29 slides, 0 pageerrors, 0 console errors
     [B] KaTeX typesets (no raw $$ leaks), Prism highlights, QR renders
     [C] pre-flight reports 0 errors on the shipped template
     [D] dark theme paints a dark slide surface (regression guard for the
         tweaks-inline-bg blocker)
     [E] browser Back/Forward navigates between slides (pushState routing)
     [F] STANDALONE build makes ZERO non-local network requests offline
   Run:  node ci-gate.mjs            (from _audit/)
   ========================================================= */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE_DIR = join(fileURLToPath(new URL('../Lectures Template/', import.meta.url)));
const PORT = 8137;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.map': 'application/json' };

let pass = 0, fail = 0;
const ok = (cond, msg, evidence = '') => {
  if (cond) { pass++; console.log(`  ✓ ${msg}${evidence ? '  ['+evidence+']' : ''}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}${evidence ? '  ['+evidence+']' : ''}`); }
};

function startServer() {
  const srv = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      p = normalize(join(TEMPLATE_DIR, p));
      if (!p.startsWith(TEMPLATE_DIR)) { res.writeHead(403).end(); return; }
      const s = await stat(p).catch(() => null);
      if (!s || s.isDirectory()) { res.writeHead(404).end(); return; }
      const buf = await readFile(p);
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(500).end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

const url = (f) => `http://localhost:${PORT}/${encodeURIComponent(f)}`;

async function main() {
  console.log('[ci-gate] serving', TEMPLATE_DIR, 'on', PORT);
  const srv = await startServer();
  const browser = await chromium.launch();

  /* ---- editable deck ---- */
  console.log('\n[A–E] Editable deck (Lecture Template.html)');
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errs = [], cerr = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
  await page.goto(url('Lecture Template.html'), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
  await page.waitForTimeout(1800);

  const total = await page.evaluate(() => window.Lecture.total);
  ok(total === 30, 'deck loads with 30 slides', `total=${total}`);
  ok(errs.length === 0, 'no pageerrors', errs.join(' | ') || 'none');
  ok(cerr.length === 0, 'no console errors', cerr.join(' | ') || 'none');

  const render = await page.evaluate(() => ({
    katex: !!document.querySelector('.katex'),
    rawMath: (document.body.innerText.match(/\$\$/g) || []).length,
    prism: !!document.querySelector('code .token'),
    qr: !!document.querySelector('.qr-canvas svg'),
  }));
  ok(render.katex && render.rawMath === 0, 'KaTeX typeset (no raw $$)', `rawMath=${render.rawMath}`);
  ok(render.prism, 'Prism highlighting active');
  ok(render.qr, 'QR code rendered');

  const pf = await page.evaluate(() => {
    const is = window.__preflight.runChecks();
    return { e: is.filter(i => i.sev === 'error').length, w: is.filter(i => i.sev === 'warn').length,
             em: is.filter(i => i.sev === 'error').map(i => i.slide + ': ' + i.msg.slice(0, 50)) };
  });
  ok(pf.e === 0, 'pre-flight: 0 errors on shipped template', `errors=${pf.e} warns=${pf.w} ${pf.em.join(';')}`);

  // dark theme regression guard
  await page.evaluate(() => { document.activeElement?.blur(); });
  await page.keyboard.press('d');
  await page.waitForTimeout(300);
  const darkBg = await page.evaluate(() => getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor);
  const isDark = (() => { const m = darkBg.match(/\d+/g) || [255,255,255]; return (+m[0] + +m[1] + +m[2]) < 200; })();
  ok(isDark, 'dark theme paints a dark slide surface', darkBg);
  await page.keyboard.press('d');

  // back/forward
  await page.evaluate(() => window.Lecture.goTo(4)); await page.waitForTimeout(120);
  await page.evaluate(() => window.Lecture.goTo(9)); await page.waitForTimeout(120);
  await page.goBack(); await page.waitForTimeout(300);
  const afterBack = await page.evaluate(() => window.Lecture?.current);
  ok(afterBack === 4, 'browser Back navigates to previous visited slide', `current=${afterBack}`);
  await ctx.close();

  /* ---- standalone offline ---- */
  console.log('\n[F] Standalone offline (network blocked)');
  const blocked = [], serr = [];
  const octx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await octx.route('**/*', route => {
    const u = route.request().url();
    if (/^(data:|blob:)/.test(u) || u.startsWith('http://localhost')) return route.continue();
    blocked.push(u.slice(0, 60)); return route.abort();
  });
  const op = await octx.newPage();
  op.on('pageerror', e => serr.push(String(e).slice(0, 160)));
  await op.goto(url('Lecture Template (Standalone).html'), { waitUntil: 'load' }).catch(() => {});
  await op.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 }).catch(() => {});
  await op.waitForTimeout(2500);
  const sr = await op.evaluate(() => ({ katex: !!document.querySelector('.katex'),
    raw: (document.body.innerText.match(/\$\$/g) || []).length,
    prism: !!document.querySelector('code .token'), qr: !!document.querySelector('.qr-canvas svg'),
    total: window.Lecture ? window.Lecture.total : 0 })).catch(() => ({}));
  ok(blocked.length === 0, 'standalone makes ZERO non-local requests', `attempted=${blocked.length} ${blocked.slice(0,4).join(',')}`);
  ok(serr.length === 0, 'standalone: no pageerrors offline', serr.join(' | ') || 'none');
  ok(sr.katex && sr.raw === 0 && sr.prism && sr.qr, 'standalone renders math/code/QR offline',
     `katex=${sr.katex} prism=${sr.prism} qr=${sr.qr} raw=${sr.raw}`);
  await octx.close();

  await browser.close();
  srv.close();

  console.log(`\n[ci-gate] ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch(e => { console.error('[ci-gate] CRASHED', e); process.exit(1); });
