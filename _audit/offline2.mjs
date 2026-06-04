import { chromium } from 'playwright';
const EDIT = 'http://localhost:8099/Lecture%20Template.html';
const STANDALONE = 'http://localhost:8099/Lecture%20Template%20(Standalone).html';

async function offlineTest(label, url, { blockVendor = false } = {}) {
  const blocked = [], local = [], errs = [];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await ctx.route('**/*', route => {
    const u = route.request().url();
    if (blockVendor && /\/vendor\//.test(u)) { blocked.push('VENDOR:'+u.split('/').pop().slice(0,40)); return route.abort(); }
    if (/^(data:|blob:)/.test(u) || u.startsWith('http://localhost')) { local.push(u); return route.continue(); }
    blocked.push(u.slice(0,80)); return route.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(String(e).slice(0,160)));
  await page.goto(url, { waitUntil: 'load' }).catch(()=>{});
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(2500);
  const checks = await page.evaluate(() => ({
    katex: !!document.querySelector('.katex'),
    rawMath: (document.body.innerText.match(/\$\$/g) || []).length,
    prism: !!document.querySelector('code .token'),
    qr: !!document.querySelector('.qr-canvas svg'),
    bannerShown: !!document.getElementById('__asset-banner'),
    bannerText: (document.getElementById('__asset-banner')||{}).textContent?.slice(0,70) || null,
    total: window.Lecture ? window.Lecture.total : 0,
  })).catch(e=>({err:String(e)}));
  const nonLocalBlocked = blocked.filter(b=>!b.startsWith('VENDOR:'));
  console.log(`[${label}] nonLocalBlocked=${nonLocalBlocked.length} ${JSON.stringify(nonLocalBlocked.slice(0,6))}`);
  console.log(`         vendorBlocked=${blocked.filter(b=>b.startsWith('VENDOR:')).length} pageerrors=${errs.length} checks=${JSON.stringify(checks)}`);
  await browser.close();
}

await offlineTest('EDITABLE offline (vendor allowed, net blocked)', EDIT);
await offlineTest('STANDALONE offline', STANDALONE);
await offlineTest('EDITABLE + vendor BLOCKED (banner expected)', EDIT, { blockVendor: true });
