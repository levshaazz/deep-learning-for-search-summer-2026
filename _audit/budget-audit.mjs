#!/usr/bin/env node
/* =========================================================
   budget-audit.mjs — QA for `.walk-budget` parameter/FLOP accumulators
   (the twin of sequence-audit's latency-budget check).
   For every slide that has a .walk-budget, AT EVERY STEP:
     [1] STRUCTURE — every chip has a numeric data-budget and a data-step
                     in [0, max]; a [data-walk-total] element exists.
     [2] ACCUMULATION — the running total (js/budget.js → data-budget-sum)
                     equals the sum of data-budget over chips revealed so far,
                     and the visible total text is non-empty.
     [3] CAP        — .is-over is set iff the sum exceeds data-budget-cap.
     [4] BOUNDS     — the bar stays inside the 1920×1080 canvas.
   file:// — no server. Exit 1 on any error. Run: node budget-audit.mjs
   ========================================================= */
import { chromium } from 'playwright';
import { HARDENED, TEMPLATE_DECK_URL } from './lib/gate-harness.mjs';

const DECK = TEMPLATE_DECK_URL;
const MARGIN = 8;
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ERROR ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

// ── pure detectors (the REAL assertion logic, also exercised by --selftest so it can't go blind) ──
// each returns [{ code, msg }] for the faults present in the gathered DOM state.
function checkStruct(b) {
  const out = [];
  if (!b.hasTotal) out.push({ code: 'no-total', msg: `bar ${b.bi}: no [data-walk-total] element` });
  if (b.badBudget.length) out.push({ code: 'bad-budget', msg: `bar ${b.bi}: non-numeric data-budget on chip(s): ${b.badBudget.join(', ')}` });
  if (b.badStep.length) out.push({ code: 'bad-step', msg: `bar ${b.bi}: data-step out of [0,${b.max}]: ${b.badStep.join(', ')}` });
  return out;
}
function checkStep(bar, bi, step) {
  const out = [];
  if (Math.abs((bar.shown || 0) - bar.sum) > 0.5) out.push({ code: 'acc', msg: `step ${step} bar ${bi}: running total ${bar.shown} ≠ Σ revealed ${bar.sum}` });
  if (!bar.totalTxt) out.push({ code: 'empty', msg: `step ${step} bar ${bi}: visible total is empty` });
  if (!isNaN(bar.cap) && (bar.sum > bar.cap) !== bar.isOver) out.push({ code: 'cap', msg: `step ${step} bar ${bi}: is-over=${bar.isOver} but sum ${bar.sum} vs cap ${bar.cap}` });
  const r = bar.rect;
  if (r.left < -MARGIN || r.right > 1920 + MARGIN || r.top < -MARGIN || r.bottom > 1080 + MARGIN)
    out.push({ code: 'bounds', msg: `step ${step} bar ${bi}: budget bar off-canvas (top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)})` });
  return out;
}

async function main() {
  const browser = await chromium.launch(HARDENED);
  const page = await browser.newContext({ viewport: { width: 1920, height: 1080 } }).then(c => c.newPage());
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 140)));
  await page.goto(DECK, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
  await page.waitForTimeout(1500);

  const slides = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s, i) => ({ i, has: !!s.querySelector('.walk-budget') })).filter(s => s.has));
  console.log(`[budget-audit] ${DECK}\nfound ${slides.length} slide(s) with .walk-budget`);

  for (const { i } of slides) {
    await page.evaluate(idx => window.Lecture.goTo(idx), i);
    await page.waitForTimeout(400);
    const label = await page.evaluate(() => document.querySelector('.slide.is-active').dataset.screenLabel || '?');
    console.log(`\n── slide ${i + 1} [${label}] ──`);

    const struct = await page.evaluate(() => {
      const s = document.querySelector('.slide.is-active');
      const max = parseInt(s.dataset.maxStep, 10) || 0;
      const bars = [...s.querySelectorAll('.walk-budget')];
      return bars.map((bar, bi) => {
        const items = [...bar.querySelectorAll('.walk-budget-item')];
        const badBudget = [], badStep = [];
        items.forEach(it => {
          if (!Number.isFinite(parseFloat(it.dataset.budget))) badBudget.push(it.textContent.trim().slice(0, 16));
          const st = parseInt(it.getAttribute('data-step'), 10);
          if (!Number.isFinite(st) || st < 0 || st > max) badStep.push(String(it.getAttribute('data-step')));
        });
        return { bi, max, n: items.length, hasTotal: !!bar.querySelector('[data-walk-total]'), badBudget, badStep };
      });
    });
    struct.forEach(b => {
      if (b.hasTotal) ok(`bar ${b.bi}: has [data-walk-total] and ${b.n} chip(s)`);
      checkStruct(b).forEach(x => err(x.msg));
    });

    const max = struct[0]?.max || 0;
    let accHits = 0, capHits = 0, boundHits = 0, emptyHits = 0;
    for (let step = 0; step <= max; step++) {
      await page.evaluate(st => {
        const s = document.querySelector('.slide.is-active');
        s.dataset.currentStep = String(st);
        s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: st, max: parseInt(s.dataset.maxStep, 10) } }));
      }, step);
      await page.waitForTimeout(90);
      const g = await page.evaluate(() => {
        const s = document.querySelector('.slide.is-active');
        const cur = parseInt(s.dataset.currentStep, 10) || 0;
        return [...s.querySelectorAll('.walk-budget')].map(bar => {
          let sum = 0;
          bar.querySelectorAll('.walk-budget-item').forEach(it => {
            const st = parseInt(it.getAttribute('data-step'), 10) || 0;
            if (st <= cur) sum += parseFloat(it.dataset.budget) || 0;
          });
          const shown = parseFloat(bar.dataset.budgetSum);
          const totalTxt = (bar.querySelector('[data-walk-total]') || {}).textContent || '';
          const cap = parseFloat(bar.dataset.budgetCap || '');
          const totalBox = bar.querySelector('.walk-budget-total');
          const r = bar.getBoundingClientRect();
          return { sum, shown, totalTxt: totalTxt.trim(), cap,
                   isOver: !!(totalBox && totalBox.classList.contains('is-over')),
                   rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } };
        });
      });
      g.forEach((bar, bi) => {
        for (const x of checkStep(bar, bi, step)) {
          err(x.msg);
          if (x.code === 'acc') accHits++; else if (x.code === 'empty') emptyHits++;
          else if (x.code === 'cap') capHits++; else if (x.code === 'bounds') boundHits++;
        }
      });
    }
    accHits === 0 && ok('running total == Σ revealed chips at every step');
    emptyHits === 0 && ok('visible total non-empty at every step');
    capHits === 0 && ok('over-cap flag matches sum vs data-budget-cap');
    boundHits === 0 && ok('budget bar stays inside the canvas');
  }

  if (perr.length) perr.forEach(e => err('pageerror: ' + e));
  await browser.close();
  console.log(`\n[budget-audit] ${errors} error(s), ${warns} warning(s)`);
  process.exit(errors === 0 ? 0 : 1);
}
// ── --selftest: feed each clean + planted-fault case to the REAL detectors (no browser) ──────────
function selftest() {
  const f = [];
  const codes = (arr) => arr.map(x => x.code);
  // checkStruct: clean must be silent; each fault class must fire its code
  if (checkStruct({ bi: 0, n: 2, max: 3, hasTotal: true, badBudget: [], badStep: [] }).length) f.push('struct: FALSE-POSITIVE on clean');
  if (!codes(checkStruct({ bi: 0, max: 3, hasTotal: false, badBudget: [], badStep: [] })).includes('no-total')) f.push('struct: missed no-total');
  if (!codes(checkStruct({ bi: 0, max: 3, hasTotal: true, badBudget: ['NaNchip'], badStep: [] })).includes('bad-budget')) f.push('struct: missed bad-budget');
  if (!codes(checkStruct({ bi: 0, max: 3, hasTotal: true, badBudget: [], badStep: ['99'] })).includes('bad-step')) f.push('struct: missed bad-step (out of [0,max])');
  // checkStep: clean must be silent; each fault class must fire
  const good = { shown: 5, sum: 5, totalTxt: '5 tok', cap: NaN, isOver: false, rect: { left: 10, top: 10, right: 100, bottom: 100 } };
  if (checkStep(good, 0, 0).length) f.push('step: FALSE-POSITIVE on clean');
  if (!codes(checkStep({ ...good, shown: 99 }, 0, 0)).includes('acc')) f.push('step: missed accumulation drift');
  if (!codes(checkStep({ ...good, totalTxt: '' }, 0, 0)).includes('empty')) f.push('step: missed empty total');
  if (!codes(checkStep({ ...good, cap: 3, sum: 5, isOver: false }, 0, 0)).includes('cap')) f.push('step: missed over-cap flag mismatch');
  if (!codes(checkStep({ ...good, rect: { left: -99, top: 10, right: 100, bottom: 100 } }, 0, 0)).includes('bounds')) f.push('step: missed off-canvas');
  console.log('[budget-audit:selftest]', f.length ? 'FAIL — blind: ' + f.join('; ')
    : 'PASS — structure (no-total/bad-budget/bad-step) + step (acc/empty/cap/bounds) each fire on the fault and stay silent on clean');
  process.exit(f.length ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
else main().catch(e => { console.error('[budget-audit] CRASHED', e); process.exit(1); });
