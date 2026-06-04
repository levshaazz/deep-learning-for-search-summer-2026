import { chromium } from 'playwright';

const URL = 'file://' + encodeURI('/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/Lectures Template/Lecture Template (Standalone).html');
const SHOTS = '/Users/levshaazz/Downloads/Deep Learning for Search [Summer 2026]/_audit/shots-iter4/';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

// ---------- WALKTHROUGH step controls (slide 7) ----------
await page.goto(URL + '#/7', { waitUntil: 'load' });
await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0);
await page.waitForTimeout(400);

const sel = '.slide[data-type="walkthrough"]';
// initial counter
let counterStart = await page.$eval(sel + ' .step-counter', el => el.textContent.trim());
// click next button twice
await page.click(sel + ' [data-step-act="next"]');
await page.click(sel + ' [data-step-act="next"]');
await page.waitForTimeout(150);
let counterAfterBtns = await page.$eval(sel + ' .step-counter', el => el.textContent.trim());
let curStepAfterBtns = await page.$eval(sel, el => el.dataset.currentStep);
// check that data-step visibility applied (some [data-step] hidden)
let hiddenCount = await page.$$eval(sel + ' [data-step]', els => els.filter(e => e.classList.contains('is-step-hidden')).length);
// now press keyboard Right arrow — counter should follow
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(150);
let counterAfterArrow = await page.$eval(sel + ' .step-counter', el => el.textContent.trim());
// press Left arrow
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(150);
let counterAfterLeft = await page.$eval(sel + ' .step-counter', el => el.textContent.trim());
await page.screenshot({ path: SHOTS + 'walkthrough-stepped.png' });
console.log('WALKTHROUGH', JSON.stringify({ counterStart, counterAfterBtns, curStepAfterBtns, hiddenCount, counterAfterArrow, counterAfterLeft }));

// ---------- DEVIL backslash bug: on a NON-devil slide, backslash must NOT be swallowed ----------
// Use a slide with a focusable link/anchor behavior: instead, test preventDefault by
// checking that on a non-devil slide pressing '\' does not add .is-devil anywhere and
// that default isn't prevented. We approximate: press '\' on slide 1 (no overlay) and
// confirm no error + no .is-devil. Then go to slide 22 (devil) and toggle works.
await page.goto(URL + '#/1', { waitUntil: 'load' });
await page.waitForTimeout(300);
// Track default-prevented on a synthetic keydown for '\'
const backslashPreventedOnPlain = await page.evaluate(() => {
  return new Promise(resolve => {
    const handler = (e) => { if (e.key === '\\') { document.removeEventListener('keydown', handler); resolve(e.defaultPrevented); } };
    // listen at the very end (bubble) AFTER registry handlers ran
    document.addEventListener('keydown', handler);
    const ev = new KeyboardEvent('keydown', { key: '\\', bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
  });
});
let devilOnPlain = await page.$$eval('.slide.is-devil', els => els.length);

// devil slide
await page.goto(URL + '#/22', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.keyboard.press('Backslash');
await page.waitForTimeout(200);
let devilActive = await page.$$eval('.slide.is-active.is-devil', els => els.length);
await page.screenshot({ path: SHOTS + 'devil-toggled.png' });
// And that on the devil slide, '\' WAS prevented (handled)
const backslashPreventedOnDevil = await page.evaluate(() => {
  return new Promise(resolve => {
    const handler = (e) => { if (e.key === '\\') { document.removeEventListener('keydown', handler); resolve(e.defaultPrevented); } };
    document.addEventListener('keydown', handler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\', bubbles: true, cancelable: true }));
  });
});
console.log('DEVIL', JSON.stringify({ backslashPreventedOnPlain, devilOnPlain, devilActive, backslashPreventedOnDevil }));

// ---------- THEME toggle re-applies tweaks (D key) — surface must go dark ----------
await page.goto(URL + '#/1', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.keyboard.press('d');
await page.waitForTimeout(300);
let themeAttr = await page.evaluate(() => document.documentElement.dataset.theme);
let surfaceBg = await page.$eval('.slide.is-active', el => getComputedStyle(el).backgroundColor);
await page.screenshot({ path: SHOTS + 'theme-dark.png' });
console.log('THEME', JSON.stringify({ themeAttr, surfaceBg }));

// ---------- V key opens tweaks panel ----------
await page.keyboard.press('v');
await page.waitForTimeout(250);
let tweaksVisible = await page.$$eval('.tweaks-panel.is-visible', els => els.length);
await page.screenshot({ path: SHOTS + 'tweaks-panel.png' });
console.log('VKEY', JSON.stringify({ tweaksVisible }));

// ---------- L key toggles language ----------
await page.keyboard.press('v'); // close panel
await page.waitForTimeout(100);
let langBefore = await page.evaluate(() => document.documentElement.dataset.lang);
await page.keyboard.press('l');
await page.waitForTimeout(150);
let langAfter = await page.evaluate(() => document.documentElement.dataset.lang);
console.log('LKEY', JSON.stringify({ langBefore, langAfter }));

// ---------- Idempotency: re-inject deck.js logic guard. Inject the same module twice ----------
// We can't easily re-run the IIFE; instead verify the guard flags exist.
let guards = await page.evaluate(() => ({
  deck: !!window.__lec_deck, tools: !!window.__lec_tools, tweaks: !!window.__lec_tweaks,
  lab: !!window.__lec_lab, notes: !!window.__lec_notes, pen: !!window.__lec_pen,
  e2e: !!window.__lec_e2e, demos: !!window.__lec_demos, preflight: !!window.__lec_preflight,
  handout: !!window.__lec_handout, presenter: !!window.__lec_presenter,
  keys: typeof window.LectureKeys === 'object' && typeof window.LectureKeys.register === 'function',
}));
console.log('GUARDS', JSON.stringify(guards));

// ---------- Editable-focus skip: typing in a contenteditable code runner must NOT navigate ----------
await page.goto(URL + '#/1', { waitUntil: 'load' });
await page.waitForTimeout(300);
const curBefore = await page.evaluate(() => window.Lecture.current);
// focus a code runner pre if present, else skip
const hasEditable = await page.$('pre[contenteditable]');
let navWhileTyping = 'n/a';
if (hasEditable) {
  await hasEditable.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);
  const curAfter = await page.evaluate(() => window.Lecture.current);
  navWhileTyping = (curAfter === curBefore) ? 'no-nav(ok)' : 'NAVIGATED(bad)';
}
console.log('EDITABLE', JSON.stringify({ navWhileTyping }));

console.log('ERRORS', JSON.stringify(errors));
await browser.close();
