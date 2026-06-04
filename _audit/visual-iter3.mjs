import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter3';
mkdirSync(OUT, { recursive: true });
const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

await page.goto(URL);
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(400);

async function idxByLabel(sub) {
  return await page.evaluate((s) => {
    const slides = window.Lecture.slides;
    for (let i = 0; i < slides.length; i++)
      if ((slides[i].dataset.screenLabel || '').includes(s)) return i;
    return -1;
  }, sub);
}
const e2eIdx = await idxByLabel('E2E');
const revIdx = await idxByLabel('Reverse');
const mixIdx = await idxByLabel('Mix');
console.log('e2e=', e2eIdx, 'rev=', revIdx, 'mix=', mixIdx);

// ---------- #3 e2e reset ----------
await page.evaluate((i) => window.Lecture.goTo(i), e2eIdx);
await page.waitForTimeout(300);
await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  for (let k = 0; k < 6; k++) window.Lecture.next();
  const tgl = s.querySelector('.e2e-toggle');
  if (tgl) tgl.click();
});
await page.waitForTimeout(300);
const e2eMutated = await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  return { step: s.dataset.currentStep, hide: s.dataset.hideNumeric, on: !!s.querySelector('.e2e-toggle.is-on') };
});
await page.screenshot({ path: OUT + '/e2e-mutated.png' });
await page.evaluate((i) => window.Lecture.goTo(i + 1), e2eIdx);
await page.waitForTimeout(200);
await page.evaluate((i) => window.Lecture.goTo(i), e2eIdx);
await page.waitForTimeout(400);
const e2eReset = await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  return { step: s.dataset.currentStep, hide: s.dataset.hideNumeric, on: !!s.querySelector('.e2e-toggle.is-on'), backtracked: s.dataset.backtracked };
});
await page.screenshot({ path: OUT + '/e2e-reset.png' });
console.log('E2E mutated:', JSON.stringify(e2eMutated), 'reset:', JSON.stringify(e2eReset));

// ---------- #4 e2e tooltip per-slide ----------
const ttInfo = await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  const block = s.querySelector('.e2e-arch-block[data-tooltip]');
  if (!block) return { note: 'no tooltip block' };
  block.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  const tip = s._e2eTooltip;
  return { hasOwnTip: !!tip, tipInThisSlide: tip ? (tip.parentNode === s) : false, visible: tip ? tip.classList.contains('is-visible') : false };
});
await page.waitForTimeout(250);
await page.screenshot({ path: OUT + '/e2e-tooltip.png' });
console.log('Tooltip:', JSON.stringify(ttInfo));

// ---------- #3 counterfactual reset ----------
await page.evaluate((i) => window.Lecture.goTo(i), mixIdx);
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/cf-initial.png' });
const cfMut = await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  [...s.querySelectorAll('.cf-toggle-bar button')].find(b => b.dataset.cfValue === 'without').click();
  return { active: s.querySelector('.cf-toggle-bar button.is-active')?.dataset.cfValue, variant: s.querySelector('.cf-variant.is-active')?.dataset.cfValue };
});
await page.waitForTimeout(200);
await page.screenshot({ path: OUT + '/cf-mutated.png' });
await page.evaluate((i) => window.Lecture.goTo(i - 1), mixIdx);
await page.waitForTimeout(200);
await page.evaluate((i) => window.Lecture.goTo(i), mixIdx);
await page.waitForTimeout(300);
const cfReset = await page.evaluate(() => {
  const s = window.Lecture.slides[window.Lecture.current];
  return { active: s.querySelector('.cf-toggle-bar button.is-active')?.dataset.cfValue, variant: s.querySelector('.cf-variant.is-active')?.dataset.cfValue };
});
await page.screenshot({ path: OUT + '/cf-reset.png' });
console.log('CF mutated:', JSON.stringify(cfMut), 'reset:', JSON.stringify(cfReset));

// ---------- #3 reverse reset ----------
await page.evaluate((i) => window.Lecture.goTo(i), revIdx);
await page.waitForTimeout(300);
const revEnter = await page.evaluate(() => { const s = window.Lecture.slides[window.Lecture.current]; return { step: s.dataset.currentStep, max: s.dataset.maxStep }; });
await page.screenshot({ path: OUT + '/reverse-enter.png' });
await page.evaluate(() => { for (let k = 0; k < 6; k++) window.Lecture.prev(); });
await page.waitForTimeout(200);
const revRewound = await page.evaluate(() => window.Lecture.slides[window.Lecture.current].dataset.currentStep);
await page.screenshot({ path: OUT + '/reverse-rewound.png' });
await page.evaluate((i) => window.Lecture.goTo(i - 1), revIdx);
await page.waitForTimeout(200);
await page.evaluate((i) => window.Lecture.goTo(i), revIdx);
await page.waitForTimeout(300);
const revReset = await page.evaluate(() => window.Lecture.slides[window.Lecture.current].dataset.currentStep);
await page.screenshot({ path: OUT + '/reverse-reset.png' });
console.log('Reverse enter:', JSON.stringify(revEnter), 'rewound:', revRewound, 'reset-back:', revReset);

// ---------- deep-link preserved for plain step slide ----------
await page.goto(URL + '#/' + (e2eIdx + 1) + '/4');
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(400);
const deep = await page.evaluate(() => { const s = window.Lecture.slides[window.Lecture.current]; return { idx: window.Lecture.current, step: s.dataset.currentStep }; });
console.log('Deep-link #/' + (e2eIdx+1) + '/4 →', JSON.stringify(deep));

console.log('ERRORS:', errs.length ? errs.join('\n') : 'NONE');
await browser.close();
