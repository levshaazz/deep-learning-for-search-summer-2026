import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const BASE = 'http://localhost:8099/Lecture%20Template.html';
const SHOTS = decodeURIComponent(new URL('./shots-fixed/', import.meta.url).pathname);
mkdirSync(SHOTS, { recursive: true });
const out = {};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

// ---- FIX 1: dark theme via real 'd' key ----
{
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.LectureTools);
  await page.waitForTimeout(900);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('d'); // -> dark
  await page.waitForTimeout(300);
  out.darkAfterToggle = await page.evaluate(() => {
    const bg = el => getComputedStyle(el).backgroundColor;
    return { theme: document.documentElement.dataset.theme,
             bgVar: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
             slideBg: bg(document.querySelector('.slide.is-active')),
             bodyBg: bg(document.body) };
  });
  // contrast on dark title + pageno + e2e
  await page.evaluate(() => window.Lecture.goTo(0));
  await page.waitForTimeout(150);
  out.darkContrast = await page.evaluate(() => {
    function lum(rgb){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2])}
    function parse(s){const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[0,0,0]}
    function ratio(fg,bg){const a=lum(fg)+0.05,b=lum(bg)+0.05;return +(Math.max(a,b)/Math.min(a,b)).toFixed(2)}
    function bgOf(el){let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return parse(c);e=e.parentElement}return [16,19,26]}
    const r={};
    const h1=document.querySelector('.slide.is-active h1');if(h1){const cs=getComputedStyle(h1);r.titleH1={ratio:ratio(parse(cs.color),bgOf(h1)),px:parseFloat(cs.fontSize)}}
    return r;
  });
  await page.screenshot({ path: SHOTS+'dark-title-fixed.png', clip:{x:0,y:0,width:1920,height:1080} });
  await page.evaluate(() => { window.Lecture.goTo(12); });
  await page.waitForTimeout(150);
  await page.evaluate(() => window.LectureTools && window.LectureTools.applyLang('en'));
  await page.evaluate(() => window.Lecture.goTo(16));
  await page.waitForTimeout(200);
  out.darkPageno = await page.evaluate(() => {
    function lum(rgb){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2])}
    function parse(s){const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[0,0,0]}
    function ratio(fg,bg){const a=lum(fg)+0.05,b=lum(bg)+0.05;return +(Math.max(a,b)/Math.min(a,b)).toFixed(2)}
    function bgOf(el){let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return parse(c);e=e.parentElement}return [16,19,26]}
    const p=document.querySelector('.slide.is-active [data-pageno]');const cs=getComputedStyle(p);
    return {ratio:ratio(parse(cs.color),bgOf(p)),px:parseFloat(cs.fontSize)};
  });
  await page.screenshot({ path: SHOTS+'dark-e2e-fixed.png', clip:{x:0,y:0,width:1920,height:1080} });
  // toggle back to light and confirm bg returns
  await page.keyboard.press('d');
  await page.waitForTimeout(200);
  out.lightAfterToggleBack = await page.evaluate(() => getComputedStyle(document.querySelector('.slide.is-active')).backgroundColor);
  await page.close();
}

// ---- FIX 2: back/forward ----
{
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.LectureTools);
  await page.waitForTimeout(400);
  await page.evaluate(() => window.Lecture.goTo(4)); await page.waitForTimeout(120);
  await page.evaluate(() => window.Lecture.goTo(9)); await page.waitForTimeout(120);
  const before = await page.evaluate(() => ({cur: window.Lecture.current, hash: location.hash, hist: history.length}));
  await page.goBack(); await page.waitForTimeout(300);
  const back1 = await page.evaluate(() => ({cur: window.Lecture?.current ?? 'GONE', hash: location.hash}));
  await page.goBack(); await page.waitForTimeout(300);
  const back2 = await page.evaluate(() => ({cur: window.Lecture?.current ?? 'GONE', hash: location.hash}));
  await page.goForward(); await page.waitForTimeout(300);
  const fwd = await page.evaluate(() => ({cur: window.Lecture?.current ?? 'GONE', hash: location.hash}));
  out.backForward = { before, back1, back2, fwd };
  await page.close();
}

// ---- FIX 3: preflight — clean deck warnings + injected clip = error ----
{
  const page = await ctx.newPage();
  const warns = [];
  page.on('console', m => { if (m.type()==='warning'||m.type()==='error') warns.push(m.type()[0]+':'+m.text().slice(0,80)); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.LectureTools);
  await page.waitForTimeout(1500);
  out.cleanPreflight = await page.evaluate(() => {
    const issues = window.__preflight.runChecks();
    return { errors: issues.filter(i=>i.sev==='error').length,
             warns: issues.filter(i=>i.sev==='warn').length,
             warnMsgs: issues.filter(i=>i.sev==='warn').map(i=>i.slide+': '+i.msg.slice(0,50)),
             badgeVisible: !!document.querySelector('.preflight-overlay .pf-toggle') };
  });
  // inject overflowing content -> expect clip error
  out.clipDetect = await page.evaluate(async () => {
    const s = document.querySelectorAll('.slide')[8];
    const inj = document.createElement('div'); inj.id='__c';
    inj.innerHTML = '<p style="font-size:48px;margin:30px">OVERFLOW LINE</p>'.repeat(80);
    s.querySelector(':scope > .slide-body').appendChild(inj);
    window.Lecture.goTo(8);
    await new Promise(r=>setTimeout(r,400));
    document.dispatchEvent(new CustomEvent('katex:done'));
    await new Promise(r=>setTimeout(r,700));
    const issues = window.__preflight.runChecks();
    const clipErr = issues.find(i=>i.sev==='error' && /ОБРЕЗАН/.test(i.msg));
    const panelOpen = !!document.querySelector('.preflight-overlay .pf-panel.is-open');
    const r = { autoFit: s.dataset.autoFit, clipped: s.dataset.autoFitClipped, clipErrorRaised: !!clipErr, panelAutoOpened: panelOpen };
    inj.remove(); document.dispatchEvent(new CustomEvent('katex:done'));
    return r;
  });
  out.consoleSample = warns.slice(0,8);
  await page.close();
}

// ---- FIX 5: <details> leak ----
{
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.LectureTools);
  await page.waitForTimeout(500);
  await page.evaluate(() => window.Lecture.goTo(11)); await page.waitForTimeout(150);
  await page.evaluate(() => document.querySelector('.slide.is-active details.hidden-answer')?.setAttribute('open',''));
  await page.evaluate(() => window.Lecture.goTo(5)); await page.waitForTimeout(120);
  await page.evaluate(() => window.Lecture.goTo(11)); await page.waitForTimeout(150);
  out.detailsLeak = await page.evaluate(() => ({ stillOpen: document.querySelector('.slide.is-active details.hidden-answer')?.open }));
  await page.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
