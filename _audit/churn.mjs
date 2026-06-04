import { chromium } from 'playwright';
const BASE = 'http://localhost:8099/Lecture%20Template.html';
const browser = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e).slice(0,160)));
page.on('console', m => { if (m.type()==='error') errs.push('c:'+m.text().slice(0,120)); });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(1500);

async function heap() {
  try { await page.evaluate(() => window.gc && window.gc()); } catch {}
  await page.waitForTimeout(80);
  return page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : 0));
}

// Count DOM nodes + active timers proxy (intervals via patching) baseline
const baselineNodes = await page.evaluate(() => document.getElementsByTagName('*').length);
const h0 = await heap();

// CHURN: 300 navigations across all slides + theme/lang flips + deep steps + demo/e2e visits
const t0 = Date.now();
for (let i = 0; i < 300; i++) {
  await page.keyboard.press(i % 2 ? 'ArrowRight' : 'ArrowLeft');
  if (i % 25 === 0) await page.keyboard.press('d');       // theme churn
  if (i % 33 === 0) await page.keyboard.press('l');       // lang churn
  if (i % 40 === 0) { await page.evaluate(() => window.Lecture.goTo(16)); // e2e
    for (let s=0;s<6;s++) await page.keyboard.press('ArrowRight'); }
  if (i % 50 === 0) await page.evaluate(() => window.Lecture.goTo(10)); // demo slide
  if (i % 17 === 0) await page.evaluate(() => window.Lecture.toggleOverview(true)), await page.evaluate(() => window.Lecture.toggleOverview(false));
}
const dt = Date.now() - t0;
await page.waitForTimeout(800);

const h1 = await heap();
const afterNodes = await page.evaluate(() => document.getElementsByTagName('*').length);

// extra signal: count preflight overlays + toolbars + recall overlays (should each be ≤1 — leak guard)
const singletons = await page.evaluate(() => ({
  toolbars: document.querySelectorAll('.toolbar').length,
  progressBars: document.querySelectorAll('.progress-bar').length,
  preflightOverlays: document.querySelectorAll('.preflight-overlay').length,
  tocPops: document.querySelectorAll('.toc-pop').length,
  e2eTooltips: document.querySelectorAll('.e2e-tooltip').length,
  recallOverlays: document.querySelectorAll('.recall-overlay').length,
  slideBodies: document.querySelectorAll('.slide-body').length,   // must stay == slide count (no double-wrap)
  slides: document.querySelectorAll('.slide').length,
}));

console.log(JSON.stringify({
  churnNavs: 300, churnMs: dt, msPerNav: +(dt/300).toFixed(1),
  heapKB: { before: Math.round(h0/1024), after: Math.round(h1/1024), growthKB: Math.round((h1-h0)/1024) },
  nodes: { before: baselineNodes, after: afterNodes, growth: afterNodes - baselineNodes },
  singletons,
  errors: errs.length, errSample: errs.slice(0,5),
}, null, 2));
await browser.close();
