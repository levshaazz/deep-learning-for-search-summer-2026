import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const BASE = 'http://localhost:8099/Lecture%20Template.html';
const PDF = decodeURIComponent(new URL('./deck.pdf', import.meta.url).pathname);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(1500);

await page.emulateMedia({ media: 'print' });
await page.waitForTimeout(300);

const m = await page.evaluate(() => {
  const out = {};
  const slides = [...document.querySelectorAll('.slide')];
  // e2e: does stacking all steps overflow the fixed-height print page?
  const e2e = slides.find(s => s.dataset.type === 'e2e');
  if (e2e) {
    const cs = getComputedStyle(e2e);
    out.e2e = { height: cs.height, overflow: cs.overflow,
                scrollH: e2e.scrollHeight, clientH: e2e.clientHeight,
                clipped: e2e.scrollHeight > e2e.clientHeight + 5,
                stepsVisible: [...e2e.querySelectorAll('.e2e-step')].filter(s=>getComputedStyle(s).display!=='none').length,
                totalSteps: e2e.querySelectorAll('.e2e-step').length };
  }
  // walkthrough
  const wt = slides.find(s => s.dataset.type === 'walkthrough');
  if (wt) out.walkthrough = { scrollH: wt.scrollHeight, clientH: wt.clientHeight, clipped: wt.scrollHeight > wt.clientHeight + 5,
                stepsVisible: [...wt.querySelectorAll('.walk-step')].filter(s=>getComputedStyle(s).display!=='none').length };
  // quiz native <details> expansion
  const det = document.querySelector('details.hidden-answer');
  if (det) {
    const content = det.querySelector('.ha-content');
    out.detailsContent = { open: det.open,
      contentDisplay: content ? getComputedStyle(content).display : 'none',
      contentVisible: content ? content.offsetHeight > 0 : false };
  }
  return out;
});
console.log('PRINT MEASURE:', JSON.stringify(m, null, 2));

// real PDF
await page.pdf({ path: PDF, width: '1920px', height: '1080px', printBackground: true, pageRanges: '' }).catch(e=>console.log('pdf err', e.message));
const buf = readFileSync(PDF);
const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
console.log(`PDF: ${(buf.length/1e6).toFixed(2)}MB, ~${pages} pages (expect 23)`);
await browser.close();
