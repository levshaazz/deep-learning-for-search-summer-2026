#!/usr/bin/env node
/* =========================================================
   wbw-check.mjs — 0/0/0 gate for the REAL lecture decks (Lectures/NN-*.html).
   Serves ../Lectures/ on a free port (shared harness), drives each deck headless,
   and FAILS (exit 1) if any deck violates an invariant.

   DATA-DRIVEN (Dim-E H1): the deck list is globbed from Lectures/NN-*.html and the
   tag is derived from the numeric prefix — adding L7 needs ZERO edits here. The
   slide-count check is self-referential (engine total === DOM .slide count), so
   there are no hand-typed expected counts to drift.

   Per deck checks:
     • window.Lecture.total === number of .slide elements in the DOM (engine registered them all)
     • 0 page errors
     • 0 console errors
     • pre-flight: 0 errors (warns reported, not fatal)
     • KaTeX typeset, no raw $$ leaks

   Usage:
     node wbw-check.mjs                 # all decks
     node wbw-check.mjs 00-introduction.html   # one deck by filename
   ========================================================= */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDir, withBrowser, withPage, ready } from './lib/gate-harness.mjs';

const LECT_DIR = join(fileURLToPath(new URL('../Lectures/', import.meta.url)));

const DECKS = readdirSync(LECT_DIR)
  .filter((f) => /^\d\d-.*\.html$/.test(f)).sort()
  .map((f) => ({ file: f, tag: 'L' + parseInt(f.slice(0, 2), 10) }));

let pass = 0, fail = 0;
const ok = (cond, msg, ev = '') => {
  if (cond) { pass++; console.log(`  ✓ ${msg}${ev ? '  [' + ev + ']' : ''}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}${ev ? '  [' + ev + ']' : ''}`); }
};

async function checkDeck(browser, srv, deck) {
  console.log(`\n[${deck.tag}] ${deck.file}`);
  await withPage(browser, { viewport: { width: 1920, height: 1080 } }, async (page, cap) => {
    await page.goto(srv.href(deck.file), { waitUntil: 'networkidle' });
    await ready(page, () => window.Lecture && window.Lecture.total > 0);
    await page.evaluate(() => document.fonts && document.fonts.ready);   // deterministic settle (was waitForTimeout(1800))

    const counts = await page.evaluate(() => ({
      total: window.Lecture.total,
      slideEls: document.querySelectorAll('.slide').length,
    }));
    ok(counts.total === counts.slideEls && counts.total > 0,
       'engine registered every slide (total === DOM .slide)', `total=${counts.total} dom=${counts.slideEls}`);
    ok(cap.pageerrors.length === 0, 'no pageerrors', cap.pageerrors.join(' | ') || 'none');
    ok(cap.console.length === 0, 'no console errors', cap.console.join(' | ') || 'none');

    const render = await page.evaluate(() => ({
      katex: !!document.querySelector('.katex'),
      rawMath: (document.body.innerText.match(/\$\$/g) || []).length,
    }));
    ok(render.katex && render.rawMath === 0, 'KaTeX typeset (no raw $$)', `rawMath=${render.rawMath}`);

    const pf = await page.evaluate(() => {
      if (!window.__preflight) return { e: -1, w: -1, em: ['no __preflight'] };
      const is = window.__preflight.runChecks();
      return { e: is.filter((i) => i.sev === 'error').length,
               w: is.filter((i) => i.sev === 'warn').length,
               em: is.filter((i) => i.sev === 'error').map((i) => i.slide + ': ' + i.msg.slice(0, 60)) };
    });
    ok(pf.e === 0, 'pre-flight: 0 errors', `errors=${pf.e} warns=${pf.w}${pf.em.length ? ' :: ' + pf.em.join(' ; ') : ''}`);
  });
}

async function main() {
  const only = process.argv[2];
  const decks = only ? DECKS.filter((d) => d.file === only) : DECKS;
  if (!decks.length) { console.error('unknown deck:', only); process.exit(2); }
  const srv = await serveDir(LECT_DIR);
  console.log('[wbw-check] serving', LECT_DIR, 'on', srv.url);
  await withBrowser(async (browser) => {
    for (const d of decks) await checkDeck(browser, srv, d);
  });
  await srv.close();
  console.log(`\n[wbw-check] ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error('[wbw-check] CRASHED', e); process.exit(1); });
