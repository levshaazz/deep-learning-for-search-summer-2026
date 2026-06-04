import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const OUT = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter1';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

// --- 1. Handout mode ---
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await page.goto(URL + '?handout=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/handout-top.png' });
  await page.evaluate(() => {
    const a = document.querySelector('.handout-answer');
    if (a) a.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/handout-answer.png' });
  await page.close();
}

// --- 2. Print emulation: divider + theorem + PDF ---
{
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const d = document.querySelector('.slide[data-type="divider"]');
    if (d) d.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/print-divider.png' });
  await page.evaluate(() => {
    const d = document.querySelector('.slide[data-type="theorem"]');
    if (d) d.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/print-theorem.png' });
  await page.pdf({ path: OUT + '/print.pdf', preferCSSPageSize: true, printBackground: true });
  await page.close();
}

await browser.close();
console.log('done');
