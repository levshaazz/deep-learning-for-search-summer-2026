import { chromium } from 'playwright';
const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(400);

// Inject a contenteditable element, focus it, fire arrow + 'd' + 'v' via dispatch
const res = await page.evaluate(() => {
  const ce = document.createElement('div');
  ce.contentEditable = 'true';
  ce.tabIndex = 0;
  ce.textContent = 'edit me';
  document.body.appendChild(ce);
  ce.focus();
  const before = { cur: window.Lecture.current, theme: document.documentElement.dataset.theme, lang: document.documentElement.dataset.lang };
  ['ArrowRight', 'd', 'v', 'l'].forEach(k => {
    ce.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  });
  const after = { cur: window.Lecture.current, theme: document.documentElement.dataset.theme, lang: document.documentElement.dataset.lang };
  ce.remove();
  return { before, after, allSuppressed: before.cur === after.cur && before.theme === after.theme && before.lang === after.lang };
});
console.log('EDITABLE_SKIP', JSON.stringify(res));
console.log('ERRORS', JSON.stringify(errors));
await browser.close();
