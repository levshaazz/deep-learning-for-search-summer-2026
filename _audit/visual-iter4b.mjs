import { chromium } from 'playwright';
const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const SHOTS = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter4/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(500);

// Find a slide that has a contenteditable code editor (code-runner / pyodide)
const editableSlideIdx = await page.evaluate(() => {
  const slides = [...document.querySelectorAll('.slide')];
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].querySelector('pre[contenteditable]')) return i + 1;
  }
  return -1;
});
let editableResult = 'no-editable-slide';
if (editableSlideIdx > 0) {
  await page.goto(URL + '#/' + editableSlideIdx, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const curBefore = await page.evaluate(() => window.Lecture.current);
  await page.$eval('pre[contenteditable]', el => el.focus());
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('d'); // theme key — must also be ignored while typing
  await page.waitForTimeout(200);
  const curAfter = await page.evaluate(() => window.Lecture.current);
  const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
  editableResult = JSON.stringify({ editableSlideIdx, curBefore, curAfter, navSuppressed: curAfter === curBefore, themeAfter, themeSuppressed: themeAfter === 'light' });
}
console.log('EDITABLE2', editableResult);

// Presenter button presence (tweaks.js retry should have added it)
const presenterBtn = await page.$$eval('.toolbar [data-act="presenter-win"]', els => els.length);
console.log('PRESENTERBTN', JSON.stringify({ presenterBtn }));

// Double-include guard: re-add a <script> with deck.js content would re-run IIFE.
// Simulate by re-running tools IIFE flag check: append a script that sets a sentinel
// only if the guard let a body run. We inject a tiny duplicate guarded IIFE mimic.
const guardWorks = await page.evaluate(() => {
  let ran = 0;
  (function(){ 'use strict'; if (window.__lec_tools) return; ran++; })();
  return ran === 0; // guard already set, so body must NOT run
});
console.log('GUARD_BLOCKS_DUP', JSON.stringify({ guardWorks }));

console.log('ERRORS', JSON.stringify(errors));
await browser.close();
