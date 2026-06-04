import { chromium } from 'playwright';
const BASE = 'http://localhost:8099/Lecture%20Template.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture);
await page.waitForTimeout(800);
// Toggle dark via the REAL keypress 'd'
await page.evaluate(() => document.activeElement?.blur());
await page.keyboard.press('d');
await page.waitForTimeout(300);
const probe = await page.evaluate(() => {
  const bg = el => el ? getComputedStyle(el).backgroundColor : 'no-el';
  const cs = getComputedStyle(document.documentElement);
  const tokens = ['--bg','--paper','--ink','--ink-2','--ink-3','--surface','--card','--slide-bg'].reduce((o,k)=>{o[k]=cs.getPropertyValue(k).trim();return o},{});
  return {
    htmlThemeAttr: document.documentElement.dataset.theme,
    bodyBg: bg(document.body),
    deckBg: bg(document.querySelector('.deck')),
    stageBg: bg(document.querySelector('.stage')),
    slidesBg: bg(document.querySelector('.slides')),
    activeSlideBg: bg(document.querySelector('.slide.is-active')),
    tokens,
  };
});
console.log(JSON.stringify(probe, null, 2));
await browser.close();
