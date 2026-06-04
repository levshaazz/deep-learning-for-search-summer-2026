import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:8099/Lecture%20Template.html';
const SHOTS = decodeURIComponent(new URL('./shots/', import.meta.url).pathname);
mkdirSync(SHOTS, { recursive: true });

const results = { console: [], pageerrors: [], network: [], tests: {} };

function attach(page, tag = 'main') {
  page.on('console', m => {
    const t = m.type();
    if (t === 'error' || t === 'warning' || t === 'info')
      results.console.push({ tag, type: t, text: m.text().slice(0, 300) });
  });
  page.on('pageerror', e => results.pageerrors.push({ tag, text: String(e).slice(0, 300) }));
  page.on('request', r => {
    const u = r.url();
    if (!u.startsWith('http://localhost')) results.network.push({ tag, url: u.slice(0, 120) });
  });
}

const TOTAL = 23;

async function gotoSlide(page, n) { // 1-indexed
  await page.evaluate(i => window.Lecture.goTo(i - 1), n);
  await page.waitForTimeout(120);
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  attach(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
  await page.waitForTimeout(1200); // katex/fonts/preflight settle

  const total = await page.evaluate(() => window.Lecture.total);
  results.tests.total = total;

  // ---------- TEST A: API liveness + downstream UI ----------
  await gotoSlide(page, 8);
  const live = await page.evaluate(() => {
    const cur = window.Lecture.current;
    const progress = document.querySelector('.progress-fill')?.style.width;
    const tbNum = document.querySelector('[data-tb-num]')?.textContent;
    const pageno = document.querySelector('.slide.is-active [data-pageno]')?.textContent;
    return { cur, progress, tbNum, pageno };
  });
  results.tests.apiLiveness = live;

  // ---------- TEST G1: deep-link fresh load #/17/4 (step applied before paint) ----------
  const dl = await ctx.newPage();
  attach(dl, 'deeplink');
  await dl.goto(BASE + '#/17/4', { waitUntil: 'networkidle' });
  await dl.waitForFunction(() => window.Lecture && window.Lecture.current === 16);
  await dl.waitForTimeout(400);
  results.tests.deepLink = await dl.evaluate(() => {
    const s = document.querySelector('.slide[data-type="e2e"]');
    return { current: window.Lecture.current, step: s?.dataset.currentStep,
             counter: document.querySelector('.e2e-counter [data-counter-val]')?.textContent };
  });
  await dl.close();

  // ---------- TEST G2: browser back/forward between slides ----------
  const bf = await ctx.newPage();
  attach(bf, 'backfwd');
  await bf.goto(BASE, { waitUntil: 'networkidle' });
  await bf.waitForFunction(() => window.Lecture);
  await bf.waitForTimeout(300);
  await bf.evaluate(() => window.Lecture.goTo(4));
  await bf.waitForTimeout(150);
  await bf.evaluate(() => window.Lecture.goTo(9));
  await bf.waitForTimeout(150);
  const beforeBack = await bf.evaluate(() => ({ cur: window.Lecture.current, hash: location.hash, histLen: history.length }));
  await bf.goBack({ waitUntil: 'commit' }).catch(() => {});
  await bf.waitForTimeout(400);
  const afterBack = await bf.evaluate(() => ({ cur: window.Lecture?.current ?? 'GONE', hash: location.hash, url: location.href })).catch(() => ({ cur: 'NAV-AWAY' }));
  results.tests.backForward = { beforeBack, afterBack };
  await bf.close();

  // ---------- TEST B: keyboard ownership of quiz ----------
  await gotoSlide(page, 12);
  await page.evaluate(() => {
    const opt = document.querySelector('.slide.is-active .quiz-option[data-correct="true"]');
    opt.focus();
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(120);
  results.tests.quizKeyboard = await page.evaluate(() => {
    const opt = document.querySelector('.slide.is-active .quiz-option[data-correct="true"]');
    return { curAfterEnter: window.Lecture.current, solved: opt.classList.contains('is-correct'),
             focusable: opt.getAttribute('tabindex'), role: opt.getAttribute('role') };
  });
  // details/summary keyboard
  await page.evaluate(() => document.querySelector('.slide.is-active details.hidden-answer summary')?.focus());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  results.tests.detailsKeyboard = await page.evaluate(() => ({
    open: document.querySelector('.slide.is-active details.hidden-answer')?.open,
    cur: window.Lecture.current,
  }));

  // ---------- TEST B2: plain nav still works (nothing focused) ----------
  await gotoSlide(page, 3);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  results.tests.plainNav = await page.evaluate(() => window.Lecture.current); // expect 3 (idx)

  // ---------- TEST C: layout measurement integrity (devil overlay slide 22) ----------
  await gotoSlide(page, 22);
  results.tests.slide22Fit = await page.evaluate(() => {
    const s = document.querySelector('.slide.is-active');
    const body = s.querySelector(':scope > .slide-body');
    return { autoFit: s.dataset.autoFit || 'none',
             bodyScrollW: body?.scrollWidth, bodyClientW: body?.clientWidth,
             devilInBody: !!body?.querySelector('.devil-overlay') };
  });

  // ---------- TEST D: auto-fit floor sweep — inject huge content ----------
  results.tests.autofitFloor = await page.evaluate(() => {
    const s = document.querySelectorAll('.slide')[8]; // slide 9 two-col
    const body = s.querySelector(':scope > .slide-body');
    const inj = document.createElement('div');
    inj.id = '__floortest';
    inj.innerHTML = '<p style="font-size:40px">DENSE LINE</p>'.repeat(60);
    body.appendChild(inj);
    window.Lecture.goTo(8);
    return new Promise(res => setTimeout(() => {
      // trigger refit
      document.dispatchEvent(new CustomEvent('katex:done'));
      setTimeout(() => {
        const af = parseFloat(s.dataset.autoFit);
        const bodyRect = body.getBoundingClientRect();
        const slideRect = s.getBoundingClientRect();
        const clipped = bodyRect.height * 0 + (body.scrollHeight * af) > slideRect.height + 5;
        res({ autoFit: s.dataset.autoFit, scrollH: body.scrollHeight,
              renderedH: Math.round(body.scrollHeight * (af||1)), slideH: Math.round(slideRect.height/ (slideRect.width/1920)) });
      }, 500);
    }, 300));
  });
  // cleanup
  await page.evaluate(() => { document.getElementById('__floortest')?.remove(); document.dispatchEvent(new CustomEvent('katex:done')); });

  // ---------- TEST: smallest rendered font on e2e flagship ----------
  await gotoSlide(page, 17);
  results.tests.e2eFonts = await page.evaluate(() => {
    const s = document.querySelector('.slide[data-type="e2e"]');
    const af = parseFloat(s.dataset.autoFit) || 1;
    const cells = [...s.querySelectorAll('.m-cell')];
    const tiny = [...s.querySelectorAll('.step-caption.tiny')];
    const px = el => parseFloat(getComputedStyle(el).fontSize);
    const minCell = Math.min(...cells.map(px));
    const minTiny = tiny.length ? Math.min(...tiny.map(px)) : null;
    return { autoFit: af, minCellPx: minCell, renderedMinCell: +(minCell*af).toFixed(1),
             minTinyPx: minTiny, renderedMinTiny: minTiny? +(minTiny*af).toFixed(1):null };
  });

  // ---------- SCREENSHOT MATRIX ----------
  async function setThemeLang(theme, lang) {
    await page.evaluate(([t, l]) => {
      window.LectureTools.applyTheme(t);
      window.LectureTools.applyLang(l);
    }, [theme, lang]);
    await page.waitForTimeout(150);
  }
  const shots = [];
  // full matrix light/ru for all slides + dark/en for all slides (2 of 4 combos to bound cost), plus a few all-4
  for (const [theme, lang] of [['light','ru'], ['dark','en']]) {
    await setThemeLang(theme, lang);
    for (let n = 1; n <= total; n++) {
      await gotoSlide(page, n);
      await page.waitForTimeout(120);
      const f = `s${String(n).padStart(2,'0')}-${theme}-${lang}.png`;
      await page.screenshot({ path: SHOTS + f, clip: { x:0,y:0,width:1920,height:1080 } });
      shots.push(f);
    }
  }
  // the other two combos for a representative subset (title, e2e, table, quiz, definition, code)
  for (const [theme, lang] of [['dark','ru'], ['light','en']]) {
    await setThemeLang(theme, lang);
    for (const n of [1,4,12,13,17]) {
      await gotoSlide(page, n);
      const f = `s${String(n).padStart(2,'0')}-${theme}-${lang}.png`;
      await page.screenshot({ path: SHOTS + f, clip: { x:0,y:0,width:1920,height:1080 } });
      shots.push(f);
    }
  }
  results.tests.shots = shots.length;

  await setThemeLang('light','ru');

  // e2e all steps
  await gotoSlide(page, 17);
  for (let st = 0; st <= 10; st++) {
    await page.evaluate(s => {
      const slide = document.querySelector('.slide[data-type="e2e"]');
      slide.dataset.currentStep = String(s);
      slide.dispatchEvent(new CustomEvent('slide:step', { detail: { step: s, max: 10 } }));
    }, st);
    await page.waitForTimeout(180);
    await page.screenshot({ path: SHOTS + `e2e-step${String(st).padStart(2,'0')}.png`, clip:{x:0,y:0,width:1920,height:1080} });
  }

  // quiz solved + details revealed
  await gotoSlide(page, 12);
  await page.evaluate(() => document.querySelector('.slide.is-active .quiz-option[data-correct="false"]')?.click());
  await page.evaluate(() => document.querySelector('.slide.is-active .quiz-option[data-correct="true"]')?.click());
  await page.evaluate(() => document.querySelector('.slide.is-active details.hidden-answer')?.setAttribute('open',''));
  await page.waitForTimeout(150);
  await page.screenshot({ path: SHOTS + 'quiz-solved.png', clip:{x:0,y:0,width:1920,height:1080} });

  // overview
  await page.evaluate(() => window.Lecture.toggleOverview(true));
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + 'overview.png', clip:{x:0,y:0,width:1920,height:1080} });
  await page.evaluate(() => window.Lecture.toggleOverview(false));

  // devil overlay open (slide 22)
  await gotoSlide(page, 22);
  await page.keyboard.press('\\');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + 'devil-open.png', clip:{x:0,y:0,width:1920,height:1080} });
  await page.keyboard.press('\\');

  // misconception revealed
  await gotoSlide(page, 18);
  await page.evaluate(() => document.querySelector('.slide.is-active .misc-reveal-btn')?.click());
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + 'misc-revealed.png', clip:{x:0,y:0,width:1920,height:1080} });

  // ---------- contrast probes ----------
  results.tests.contrast = await page.evaluate(() => {
    function lum(rgb){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2])}
    function parse(s){const m=s.match(/\d+(\.\d+)?/g);return m?m.slice(0,3).map(Number):[0,0,0]}
    function ratio(fg,bg){const a=lum(fg)+0.05,b=lum(bg)+0.05;return +(Math.max(a,b)/Math.min(a,b)).toFixed(2)}
    function bgOf(el){let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&c!=='rgba(0, 0, 0, 0)'&&c!=='transparent')return parse(c);e=e.parentElement}return [255,255,255]}
    const out={};
    const probe=(sel,key)=>{const el=document.querySelector(sel);if(!el)return;const cs=getComputedStyle(el);out[key]={ratio:ratio(parse(cs.color),bgOf(el)),size:parseFloat(cs.fontSize),color:cs.color}};
    // light theme current
    return out;
  });
  // measure contrast across a few elements per theme
  async function contrastSet(theme){
    await page.evaluate(t=>window.LectureTools.applyTheme(t),theme);
    await page.waitForTimeout(150);
    await gotoSlide(page,17);
    const e2e = await page.evaluate(()=>{
      function lum(rgb){const f=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2])}
      function parse(s){const m=s.match(/[\d.]+/g);return m?m.slice(0,3).map(Number):[0,0,0]}
      function ratio(fg,bg){const a=lum(fg)+0.05,b=lum(bg)+0.05;return +(Math.max(a,b)/Math.min(a,b)).toFixed(2)}
      function bgOf(el){let e=el;while(e){const c=getComputedStyle(e).backgroundColor;if(c&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c))return parse(c);e=e.parentElement}return parse(getComputedStyle(document.body).backgroundColor)||[255,255,255]}
      const res={};
      const sel={cell:'.m-cell',tiny:'.step-caption.tiny',caption:'.step-caption',pageno:'[data-pageno]',crumb:'.slide__crumb-label'};
      for(const k in sel){const el=document.querySelector('.slide.is-active '+sel[k]);if(el){const cs=getComputedStyle(el);res[k]={ratio:ratio(parse(cs.color),bgOf(el)),px:parseFloat(cs.fontSize)}}}
      return res;
    });
    return e2e;
  }
  results.tests.contrastLight = await contrastSet('light');
  results.tests.contrastDark = await contrastSet('dark');
  await page.evaluate(()=>window.LectureTools.applyTheme('light'));

  await browser.close();
  writeFileSync(decodeURIComponent(new URL('./report.json', import.meta.url).pathname), JSON.stringify(results, null, 2));
  // print summary
  console.log('TOTAL slides:', results.tests.total);
  console.log('API liveness:', JSON.stringify(results.tests.apiLiveness));
  console.log('deepLink #/17/4:', JSON.stringify(results.tests.deepLink));
  console.log('back/forward:', JSON.stringify(results.tests.backForward));
  console.log('quizKeyboard:', JSON.stringify(results.tests.quizKeyboard));
  console.log('detailsKeyboard:', JSON.stringify(results.tests.detailsKeyboard));
  console.log('plainNav idx (expect 3):', results.tests.plainNav);
  console.log('slide22Fit:', JSON.stringify(results.tests.slide22Fit));
  console.log('autofitFloor:', JSON.stringify(results.tests.autofitFloor));
  console.log('e2eFonts:', JSON.stringify(results.tests.e2eFonts));
  console.log('contrastLight:', JSON.stringify(results.tests.contrastLight));
  console.log('contrastDark:', JSON.stringify(results.tests.contrastDark));
  console.log('shots captured:', results.tests.shots);
  console.log('NETWORK (non-local):', results.network.length, JSON.stringify(results.network.slice(0,20)));
  console.log('PAGEERRORS:', results.pageerrors.length, JSON.stringify(results.pageerrors.slice(0,10)));
  console.log('CONSOLE err/warn:', results.console.filter(c=>c.type!=='info').length);
  console.log(JSON.stringify(results.console.filter(c=>c.type!=='info').slice(0,40), null, 1));
}
main().catch(e => { console.error('HARNESS FAIL', e); process.exit(1); });
