import { chromium } from 'playwright';
const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const DIR = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter5/';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

// Objectives slide is #/3 (light)
await page.goto(URL + '#/3', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(800);
const total = await page.evaluate(() => window.Lecture.total);
const objType = await page.evaluate(() => window.Lecture.slideAt(2)?.dataset.type);
console.log('total=', total, 'slide3type=', objType);
await page.screenshot({ path: DIR + 'objectives-light.png' });

// dark theme
await page.keyboard.press('d');
await page.waitForTimeout(400);
await page.screenshot({ path: DIR + 'objectives-dark.png' });
await page.keyboard.press('d');
await page.waitForTimeout(300);

// Agenda slide (#/2) and verify each anchor resolves to the expected slide TYPE
await page.goto(URL + '#/2', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: DIR + 'agenda-light.png' });
const anchors = await page.evaluate(() => {
  return [...document.querySelectorAll('.slide[data-type="agenda"] .toc-item')].map(a => {
    const num = a.querySelector('.toc-num')?.textContent.trim();
    const href = a.getAttribute('href');
    const n = parseInt(href.replace('#/',''),10);
    const target = window.Lecture.slideAt(n-1);
    return { num, href, targetType: target?.dataset.type, targetLabel: target?.dataset.screenLabel };
  });
});
console.log('AGENDA ANCHORS:', JSON.stringify(anchors, null, 2));

// Actually click anchor 05 (Q&A) and confirm we land on final
await page.evaluate(() => {
  const a = [...document.querySelectorAll('.slide[data-type="agenda"] .toc-item')].find(x => x.querySelector('.toc-num')?.textContent.trim()==='05');
  a.click();
});
await page.waitForTimeout(500);
const afterQA = await page.evaluate(() => ({ current: window.Lecture.current, type: window.Lecture.slideAt(window.Lecture.current)?.dataset.type }));
console.log('after clicking 05 (Q&A):', JSON.stringify(afterQA));
await page.screenshot({ path: DIR + 'qa-target.png' });

await browser.close();
console.log('done');
