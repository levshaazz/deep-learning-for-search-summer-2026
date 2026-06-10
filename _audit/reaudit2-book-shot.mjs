#!/usr/bin/env node
/* reaudit2-book-shot.mjs — render the Book at the GH-Pages base, scroll each scrolly
   widget through its steps, screenshot the sticky graphic per step.
   Usage: node reaudit2-book-shot.mjs <chapter 05|06> [lang=en] */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8132;
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.webp':'image/webp' };

const chapter = process.argv[2] || '05';
const lang = process.argv[3] || 'en';
const outdir = join(ROOT, '_internal/l56_reaudit2', `book-${chapter}-${lang}`);

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

const srv = serve();
await new Promise((r) => srv.listen(PORT, r));
mkdirSync(outdir, { recursive: true });
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0,160)));
const curl = `http://localhost:${PORT}${BASE}/${lang}/book/${chapter}/`;
await page.goto(curl, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);

const widgets = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.scrolly').forEach((sc, i) => {
    const g = sc.querySelector('.scrolly-graphic');
    const beat = g?.getAttribute('data-beat') || sc.querySelector('[data-beat]')?.getAttribute('data-beat') || `scrolly-${i}`;
    const wid = g?.getAttribute('data-widget') || sc.querySelector('[data-widget]')?.getAttribute('data-widget') || '';
    const steps = [...sc.querySelectorAll('[data-step]')].map((s) => +s.getAttribute('data-step'));
    out.push({ i, beat, wid, steps });
  });
  return out;
});
console.log('WIDGETS:', JSON.stringify(widgets));

const stepEls = await page.$$('.scrolly [data-step]');
console.log('step markers:', stepEls.length);
let shots = 0;
for (let k = 0; k < stepEls.length; k++) {
  const el = stepEls[k];
  const meta = await el.evaluate((n) => {
    const sc = n.closest('.scrolly');
    const g = sc?.querySelector('.scrolly-graphic');
    return { step: n.getAttribute('data-step'),
      beat: g?.getAttribute('data-beat') || sc?.querySelector('[data-beat]')?.getAttribute('data-beat') || '',
      wid: g?.getAttribute('data-widget') || '' };
  });
  await el.evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(750);
  const gH = await el.evaluateHandle((n) => n.closest('.scrolly')?.querySelector('.scrolly-graphic'));
  const gEl = gH.asElement();
  const tag = (meta.wid || meta.beat || `b${k}`).replace(/[^a-z0-9-]/gi, '_');
  const fname = join(outdir, `${chapter}-${tag}-step${meta.step}.png`);
  try {
    if (gEl) { const box = await gEl.boundingBox();
      if (box && box.height > 20) await gEl.screenshot({ path: fname });
      else await page.screenshot({ path: fname }); }
    else await page.screenshot({ path: fname });
    shots++;
  } catch (e) { console.log('FAIL', fname, String(e).slice(0,80)); }
}
console.log(`SHOTS ${shots} → ${outdir}`);
console.log('page errors:', errs.length ? errs.join(' | ') : 'none');
await b.close(); srv.close();
