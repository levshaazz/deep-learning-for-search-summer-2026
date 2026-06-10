#!/usr/bin/env node
/* l6book-final-shot.mjs — finalize-readiness screenshot pass over the L6 Book chapter.
   Renders /{lang}/book/06 from docs/ at the GH-Pages base, across en/ru × desktop(1280)/
   mobile(390) × light/dark, scrolls every scrolly-widget step into view, screenshots the
   sticky graphic per step, AND probes the page DOM for overflow / KaTeX errors / literal markdown.
   Output → _internal/l56_book_final/shots/  +  a probe.json.
*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 8141;
const OUT = join(ROOT, '_internal/l56_book_final/shots');
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2','.webp':'image/webp' };

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

const VIEWPORTS = [{ name: 'desk', w: 1280, h: 900 }, { name: 'mob', w: 390, h: 800 }];
const THEMES = ['light', 'dark'];
const LANGS = (process.argv[2] || 'en,ru').split(',');
const STEPS_ONLY = process.argv.includes('--steps-only');

const srv = serve();
await new Promise((r) => srv.listen(PORT, r));
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const probeReport = [];

for (const lang of LANGS) {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const ctx = await b.newContext({
        viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1.25,
        colorScheme: theme === 'dark' ? 'dark' : 'light',
      });
      // seed the theme before any script runs
      await ctx.addInitScript((t) => { try { localStorage.setItem('dls.theme', t); } catch(e){} }, theme);
      const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
      const tag = `${lang}-${vp.name}-${theme}`;
      const url = `http://localhost:${PORT}${BASE}/${lang}/book/06/`;
      await page.goto(url, { waitUntil: 'networkidle' });
      // force the dark attribute too (belt & suspenders)
      await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await page.waitForTimeout(700);

      // ---- DOM probe (once per combo) ----
      const probe = await page.evaluate(() => {
        const de = document.documentElement;
        const overflow = de.scrollWidth - de.clientWidth;
        // literal markdown / raw dollar leakage in rendered prose
        const bodyText = document.querySelector('main')?.innerText || '';
        const litStars = (bodyText.match(/\*\*[^*\n]{1,40}\*\*/g) || []).slice(0, 6);
        const rawDollar = (bodyText.match(/\$[^$\n]{1,30}\$/g) || []).slice(0, 6);
        const litBacktick = (bodyText.match(/(?<![`])`[^`\n]{1,30}`/g) || []).slice(0, 6); // raw markdown code spans surviving
        // KaTeX error nodes
        const kerr = [...document.querySelectorAll('.katex-error')].map(e => e.textContent.slice(0,60)).slice(0,8);
        const katexCount = document.querySelectorAll('.katex').length;
        // widest element under main
        let widest = 0, widestSel = '';
        for (const el of document.querySelectorAll('main *')) {
          const w = el.getBoundingClientRect().width;
          if (w > widest) { widest = w; widestSel = (el.className||el.tagName)+''; }
        }
        return { overflow, litStars, rawDollar, litBacktick, kerr, katexCount, widest: Math.round(widest), widestSel: widestSel.slice(0,50) };
      });
      probeReport.push({ tag, errs: errs.slice(0,8), ...probe });

      // ---- step every scrolly graphic ----
      const stepEls = await page.$$('.scrolly [data-step]');
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
        await page.waitForTimeout(550);
        const gH = await el.evaluateHandle((n) => n.closest('.scrolly')?.querySelector('.scrolly-graphic'));
        const gEl = gH.asElement();
        const wtag = (meta.wid || meta.beat || `b${k}`).replace(/[^a-z0-9-]/gi, '_');
        const fname = join(OUT, `${tag}__${wtag}__s${meta.step}.png`);
        try {
          if (gEl) { const box = await gEl.boundingBox();
            if (box && box.height > 20) await gEl.screenshot({ path: fname });
            else await page.screenshot({ path: fname });
          } else await page.screenshot({ path: fname });
        } catch (e) { console.log('FAIL', fname, String(e).slice(0,60)); }
      }
      console.log(`[${tag}] steps=${stepEls.length} overflow=${probe.overflow} katexErr=${probe.kerr.length} pageErr=${errs.length}`);
      await ctx.close();
    }
  }
}

writeFileSync(join(ROOT, '_internal/l56_book_final/probe.json'), JSON.stringify(probeReport, null, 2));
console.log('PROBE →', join(ROOT, '_internal/l56_book_final/probe.json'));
await b.close(); srv.close();
