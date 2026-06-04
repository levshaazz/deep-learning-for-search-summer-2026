import { chromium } from 'playwright';
const STANDALONE = 'http://localhost:8099/Lecture%20Template%20(Standalone).html';
const net = [], blocked = [], errs = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
// Block EVERYTHING not local/data/blob
await ctx.route('**/*', route => {
  const u = route.request().url();
  if (/^(data:|blob:)/.test(u) || u.startsWith('http://localhost')) { net.push(u.slice(0,80)); return route.continue(); }
  blocked.push(u.slice(0,90)); return route.abort();
});
const page = await ctx.newPage();
page.on('pageerror', e => errs.push(String(e).slice(0,200)));
await page.goto(STANDALONE, { waitUntil: 'load' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 15000 });
await page.waitForTimeout(2500);
const checks = await page.evaluate(() => {
  const katexRendered = !!document.querySelector('.katex');
  const rawMath = (document.body.innerText.match(/\$\$/g) || []).length;
  const prism = !!document.querySelector('code .token');
  const qr = !!document.querySelector('.qr-canvas svg');
  const fontFam = getComputedStyle(document.querySelector('h2,h1')).fontFamily;
  return { katexRendered, rawMathDelimsVisible: rawMath, prismHighlighted: prism, qrGenerated: qr, fontFamily: fontFam.slice(0,60), total: window.Lecture.total };
});
console.log('STANDALONE OFFLINE:');
console.log('  blocked (non-local) requests attempted:', blocked.length, JSON.stringify(blocked.slice(0,10)));
console.log('  local/data requests:', net.length);
console.log('  pageerrors:', errs.length, JSON.stringify(errs.slice(0,5)));
console.log('  checks:', JSON.stringify(checks, null, 1));
await browser.close();
