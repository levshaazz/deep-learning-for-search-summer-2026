import { chromium } from 'playwright';
const TARGETS = {
  modular: 'http://localhost:8099/Lecture%20Template.html',
  standalone: 'http://localhost:8099/Lecture%20Template%20(Standalone).html',
};
const browser = await chromium.launch();
for (const [name, url] of Object.entries(TARGETS)) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  const errs = [], warns = [];
  page.on('pageerror', e => errs.push(String(e).slice(0,120)));
  page.on('console', m => { if (m.type()==='error') errs.push('c.err:'+m.text().slice(0,90)); if (m.type()==='warning') warns.push(m.text().slice(0,90)); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const total = await page.evaluate(() => window.Lecture.total);
  // sweep light then dark
  let darkOK = null;
  for (const theme of ['light','dark']) {
    await page.evaluate(t => { document.activeElement?.blur(); (window.LectureTools||window.Tweaks)&&window.LectureTools&&window.LectureTools.applyTheme?window.LectureTools.applyTheme(t):null; }, theme).catch(()=>{});
    // fallback: press 'd' to reach dark if needed
    const cur = await page.evaluate(() => document.documentElement.dataset.theme);
    if (cur !== theme) { await page.keyboard.press('d'); await page.waitForTimeout(150); }
    for (let n=0;n<total;n++){ await page.evaluate(i=>window.Lecture.goTo(i), n); await page.waitForTimeout(40); }
    if (theme==='dark') darkOK = await page.evaluate(()=>getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor);
  }
  console.log(`[${name}] total=${total} pageerrors/c.err=${errs.length} warns=${warns.length} darkSlideBg=${darkOK}`);
  if (errs.length) console.log('   ERRORS:', JSON.stringify(errs.slice(0,6)));
  if (warns.length) console.log('   WARNS:', JSON.stringify([...new Set(warns)].slice(0,6)));
  await ctx.close();
}
await browser.close();
