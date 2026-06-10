import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

// Self-contained: serve the template dir on :8099 (ci.yml runs this standalone with no server up).
const TEMPLATE_DIR = join(fileURLToPath(new URL('../Lectures Template/', import.meta.url)));
const MIME = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json',
  '.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.map':'application/json' };
const srv = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    p = normalize(join(TEMPLATE_DIR, p));
    if (!p.startsWith(TEMPLATE_DIR)) { res.writeHead(403).end(); return; }
    const s = await stat(p).catch(() => null);
    if (!s || s.isDirectory()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => srv.listen(8099, r));

const BASE = 'http://localhost:8099/Lecture%20Template.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture && window.__preflight);
await page.waitForTimeout(1500);

const out = {};
// 1) clean deck: expect 0 errors / 0 warns (no false positives from new checks)
out.clean = await page.evaluate(() => {
  const is = window.__preflight.runChecks();
  return { err: is.filter(i=>i.sev==='error').length, warn: is.filter(i=>i.sev==='warn').length,
           sample: is.filter(i=>i.sev!=='info').map(i=>i.slide+': '+i.msg.slice(0,55)) };
});

// 2) each corner case injected independently, measured, then reverted
out.cases = await page.evaluate(() => {
  const results = {};
  const slides = [...document.querySelectorAll('.slide')];
  const run = () => window.__preflight.runChecks();
  const find = (re, sev) => run().filter(i=>i.sev===sev && re.test(i.msg)).length;

  // a) duplicate screen-label
  const s2 = slides[1], origLbl = s2.dataset.screenLabel;
  s2.dataset.screenLabel = slides[0].dataset.screenLabel;
  results.dupLabel = find(/дублирует слайд/, 'warn') > 0;
  s2.dataset.screenLabel = origLbl;

  // b) duplicate slide content — pick the first two slides that actually have
  // a .slide-body (layout types like divider/title/formula/quote/final don't),
  // so this stays robust to slide reordering/insertions.
  const bodied = slides.filter(s => s.querySelector(':scope > .slide-body'));
  const donor = bodied[0].querySelector(':scope > .slide-body');
  const victim = bodied[1].querySelector(':scope > .slide-body');
  const savedHTML = victim.innerHTML;
  victim.innerHTML = donor.innerHTML;
  results.dupContent = find(/идентично слайду|дублированный слайд/, 'warn') > 0;
  victim.innerHTML = savedHTML;

  // c) walkthrough duplicate + gap data-step (slide 7 = walkthrough, idx 6)
  const wt = slides.find(s => s.dataset.type === 'walkthrough');
  const steps = [...wt.querySelectorAll('.walk-step[data-step]')];
  const saved = steps.map(s => s.dataset.step);
  // make "1,2,3,3,5" pattern: set step[3] (the 4th) to '3' -> dup 3, gap 4
  steps[3].dataset.step = '3';
  results.dupStepError = find(/повторяющиеся data-step/, 'error') > 0;
  results.stepGapWarn = find(/пропущены шаги/, 'warn') > 0;
  steps.forEach((s,i)=>s.dataset.step = saved[i]);

  // d) off-canvas absolute element in slide-body (any body-bearing slide)
  const host = bodied[2].querySelector(':scope > .slide-body');
  const ghost = document.createElement('div');
  ghost.style.cssText = 'position:absolute; left:3000px; top:0; width:400px; height:200px;';
  ghost.textContent = 'ghost';
  ghost.className = 'rogue-overlay';
  host.appendChild(ghost);
  // need layout; force a tick
  void host.offsetWidth;
  results.offCanvas = find(/спозиционирован за пределами/, "warn") > 0;
  ghost.remove();

  // e) bad demo fn — syntax error
  const demo = document.querySelector('interactive-demo > function[fn]');
  const fnEl = demo; const origFn = fnEl.getAttribute('fn');
  fnEl.setAttribute('fn', '0.4*x*x +');  // syntax error
  results.demoSyntax = find(/синтаксическая ошибка выражения/, 'error') > 0;
  // f) bad demo fn — blacklist
  fnEl.setAttribute('fn', 'window.x');
  results.demoBlacklist = find(/запрещённый идентификатор/, 'error') > 0;
  fnEl.setAttribute('fn', origFn);

  // confirm clean again after reverts
  const after = run();
  results.cleanAfterRevert = { err: after.filter(i=>i.sev==='error').length, warn: after.filter(i=>i.sev==='warn').length };
  return results;
});

console.log(JSON.stringify(out, null, 2));
await browser.close();
srv.close();

// Real gate: FAIL if the clean template reports errors, any detector didn't fire, or revert wasn't clean.
const c = out.cases || {};
const detectorsOk = ['dupLabel','dupContent','dupStepError','offCanvas','demoSyntax','demoBlacklist']
  .every((k) => c[k] === true) && (c.cleanAfterRevert?.err === 0);
const pass = out.clean.err === 0 && detectorsOk;
console.log(`[preflight-corner] ${pass ? 'PASS' : 'FAIL'} — clean err=${out.clean.err}, detectors fired=${detectorsOk}`);
process.exit(pass ? 0 : 1);
