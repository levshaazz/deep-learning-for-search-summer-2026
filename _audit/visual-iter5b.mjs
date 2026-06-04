import { chromium } from 'playwright';
const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const DIR = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter5/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

let dialogMsg = null;
let networkPyodide = false;
page.on('request', r => { if (r.url().includes('pyodide')) networkPyodide = true; });
// First test: DISMISS the dialog -> expect no pyodide network, status 'Cancelled'
page.once('dialog', async d => { dialogMsg = d.message(); await d.dismiss(); });

await page.goto(URL + '#/24', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(500);

// inject a pyodide-runner into the current slide and re-init lab module
await page.evaluate(() => {
  const slide = window.Lecture.slideAt(window.Lecture.current);
  const r = document.createElement('div');
  r.className = 'pyodide-runner';
  r.innerHTML = '<pre>print("hi")</pre><button class="py-run-btn">Run</button><div class="py-status"></div><div class="py-out"></div>';
  slide.appendChild(r);
  // re-fire deck:ready so lab.js binds the new runner (initPyodideRunners is called on deck:ready)
  document.dispatchEvent(new Event('deck:ready'));
});
await page.waitForTimeout(400);
await page.click('.py-run-btn');
await page.waitForTimeout(800);
const status1 = await page.evaluate(() => document.querySelector('.py-status')?.textContent);
console.log('DIALOG MSG (ru, dismissed):', JSON.stringify(dialogMsg));
console.log('status after dismiss:', status1, '| pyodide network fired:', networkPyodide);

await browser.close();
console.log('done');
