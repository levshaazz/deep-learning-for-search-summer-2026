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
     node wbw-check.mjs --selftest      # plant a KNOWN-BAD deck; assert the gate FLAGS it
   ========================================================= */
import { readdirSync, writeFileSync, rmSync } from 'node:fs';
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

// Run the SAME per-deck checks and report how many FAILED for THIS deck only. The real run
// drives this for its side effects (pass/fail tallies + log); the selftest drives it to assert
// the planted defect produced ≥1 fail (proving the detector is not blind). Identical logic ⇒
// no divergence between what CI checks and what the selftest exercises.
async function checkDeck(browser, srv, deck) {
  const failBefore = fail;
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
  return fail - failBefore;   // how many checks FAILED for this deck
}

/* =========================================================
   --selftest — does the gate STILL catch a broken deck, or has it gone blind?
   Plants a SELF-CONTAINED, OFFLINE, KNOWN-BAD deck under Lectures/ (named so it does NOT
   match the real-deck glob ^\d\d-.*\.html$, so it can NEVER pollute the real run), drives it
   through the IDENTICAL checkDeck() pipeline, and asserts it produced ≥1 FAIL.

   The fixture violates MULTIPLE invariants on purpose, every one fully offline (H1 — no src=/network):
     • window.Lecture.total (2) !== DOM .slide count (1)   → "engine registered every slide" FAILS
     • a leaked raw `$$x$$` that is NOT KaTeX-typeset       → "KaTeX typeset (no raw $$)" FAILS
     • a console.error on load                              → "no console errors" FAILS
   ≥1 FAIL ⇒ detector fires ⇒ selftest PASS (exit 0). 0 FAILs ⇒ detector is BLIND ⇒ FAIL (exit 1).
   The fixture is ALWAYS deleted afterward (finally), even on error. */
const SELFTEST_FILE = '_wbw-selftest.html';   // leading _ ⇒ never matches ^\d\d-.*\.html$
const BAD_DECK_HTML = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8">',
  '<title>wbw selftest — KNOWN BAD (offline)</title></head>',
  '<body>',
  '  <!-- only ONE real .slide in the DOM ... -->',
  '  <section class="slide">a leaked raw $$x$$ that no KaTeX ever typeset</section>',
  '  <script>',
  '    // ... but the engine claims TWO ⇒ total (2) !== DOM .slide count (1).',
  '    window.Lecture = { total: 2 };',
  '    // a runtime console.error on load ⇒ "no console errors" must fire.',
  "    console.error('wbw-selftest: planted console.error (deck is intentionally broken)');",
  '    // a pre-flight that reports no errors — the OTHER invariants carry the detection,',
  '    // so the selftest never leans on pre-flight alone.',
  '    window.__preflight = { runChecks: () => [] };',
  '  </script>',
  '</body></html>',
].join('\n');

async function selftest() {
  const fixturePath = join(LECT_DIR, SELFTEST_FILE);
  let code = 1;
  try {
    writeFileSync(fixturePath, BAD_DECK_HTML, 'utf8');
    const srv = await serveDir(LECT_DIR);
    console.log('[wbw-check:selftest] serving', LECT_DIR, 'on', srv.url);
    console.log('[wbw-check:selftest] planted KNOWN-BAD fixture:', SELFTEST_FILE);
    let deckFails = 0;
    await withBrowser(async (browser) => {
      deckFails = await checkDeck(browser, srv, { file: SELFTEST_FILE, tag: 'SELFTEST' });
    });
    await srv.close();
    const detected = deckFails > 0;
    code = detected ? 0 : 1;
    console.log(`\n[wbw-check:selftest] ${detected ? 'PASS' : 'FAIL'} — bad fixture produced ${deckFails} fail(s); ` +
      (detected ? 'detector FIRED (not blind)' : 'detector stayed BLIND — gate would pass a broken deck!'));
  } finally {
    rmSync(fixturePath, { force: true });   // ALWAYS remove the fixture, even on error
  }
  return code;
}

async function main() {
  if (process.argv.includes('--selftest')) { process.exit(await selftest()); }

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
