#!/usr/bin/env node
/* =========================================================
   wbw-check.mjs — 0/0/0 gate for the THREE real lecture decks.
   Serves ../Lectures/ in a tiny static server, drives each deck headless,
   and FAILS (exit 1) if any deck violates an invariant.

   Per deck checks:
     • window.Lecture.total === expected slide count
     • 0 page errors
     • 0 console errors
     • pre-flight: 0 errors (warns reported, not fatal)
     • KaTeX typeset, no raw $$ leaks

   Usage:
     node wbw-check.mjs                 # all three decks
     node wbw-check.mjs 00-introduction.html   # one deck by filename
   ========================================================= */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const LECT_DIR = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));
const PORT = 8141;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.map': 'application/json' };

const DECKS = [
  { file: '00-introduction.html',                 expect: 22, tag: 'L0' },
  { file: '01-search-ir-ml-system-design.html',   expect: 56, tag: 'L1' },
  { file: '02-nlp-tokenization-similarity.html',  expect: 71, tag: 'L2' },
  { file: '03-classical-ir-fulltext-fusion.html', expect: 75, tag: 'L3' },
  { file: '04-ranking-metrics.html',              expect: 58, tag: 'L4' },
];

let pass = 0, fail = 0;
const ok = (cond, msg, ev = '') => {
  if (cond) { pass++; console.log(`  ✓ ${msg}${ev ? '  ['+ev+']' : ''}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}${ev ? '  ['+ev+']' : ''}`); }
};

function startServer() {
  const srv = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]);
      p = normalize(join(LECT_DIR, p));
      if (!p.startsWith(LECT_DIR)) { res.writeHead(403).end(); return; }
      const s = await stat(p).catch(() => null);
      if (!s || s.isDirectory()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(await readFile(p));
    } catch { res.writeHead(500).end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

const url = (f) => `http://localhost:${PORT}/${encodeURIComponent(f)}`;

async function checkDeck(browser, deck) {
  console.log(`\n[${deck.tag}] ${deck.file}`);
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errs = [], cerr = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
  await page.goto(url(deck.file), { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
  await page.waitForTimeout(1800);

  const total = await page.evaluate(() => window.Lecture.total);
  ok(total === deck.expect, `loads with ${deck.expect} slides`, `total=${total}`);
  ok(errs.length === 0, 'no pageerrors', errs.join(' | ') || 'none');
  ok(cerr.length === 0, 'no console errors', cerr.join(' | ') || 'none');

  const render = await page.evaluate(() => ({
    katex: !!document.querySelector('.katex'),
    rawMath: (document.body.innerText.match(/\$\$/g) || []).length,
  }));
  ok(render.katex && render.rawMath === 0, 'KaTeX typeset (no raw $$)', `rawMath=${render.rawMath}`);

  const pf = await page.evaluate(() => {
    if (!window.__preflight) return { e: -1, w: -1, em: ['no __preflight'] };
    const is = window.__preflight.runChecks();
    return { e: is.filter(i => i.sev === 'error').length,
             w: is.filter(i => i.sev === 'warn').length,
             em: is.filter(i => i.sev === 'error').map(i => i.slide + ': ' + i.msg.slice(0, 60)) };
  });
  ok(pf.e === 0, 'pre-flight: 0 errors', `errors=${pf.e} warns=${pf.w}${pf.em.length ? ' :: '+pf.em.join(' ; ') : ''}`);

  await ctx.close();
}

async function main() {
  const only = process.argv[2];
  const decks = only ? DECKS.filter(d => d.file === only) : DECKS;
  if (!decks.length) { console.error('unknown deck:', only); process.exit(2); }
  console.log('[wbw-check] serving', LECT_DIR, 'on', PORT);
  const srv = await startServer();
  const browser = await chromium.launch();
  for (const d of decks) await checkDeck(browser, d);
  await browser.close();
  srv.close();
  console.log(`\n[wbw-check] ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch(e => { console.error('[wbw-check] CRASHED', e); process.exit(1); });
