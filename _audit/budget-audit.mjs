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
import { fileURLToPath } from 'node:url';

const DECK = 'file://' + encodeURI(fileURLToPath(new URL('../Lectures Template/Lecture Template.html', import.meta.url)));
const MARGIN = 8;
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ERROR ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

async function main() {
  const browser = await chromium.launch();
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
      b.hasTotal ? ok(`bar ${b.bi}: has [data-walk-total] and ${b.n} chip(s)`) : err(`bar ${b.bi}: no [data-walk-total] element`);
      b.badBudget.length ? err(`bar ${b.bi}: non-numeric data-budget on chip(s): ${b.badBudget.join(', ')}`) : null;
      b.badStep.length ? err(`bar ${b.bi}: data-step out of [0,${b.max}]: ${b.badStep.join(', ')}`) : null;
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
        if (Math.abs((bar.shown || 0) - bar.sum) > 0.5) { accHits++; err(`step ${step} bar ${bi}: running total ${bar.shown} ≠ Σ revealed ${bar.sum}`); }
        if (!bar.totalTxt) { emptyHits++; err(`step ${step} bar ${bi}: visible total is empty`); }
        if (!isNaN(bar.cap)) { const want = bar.sum > bar.cap; if (want !== bar.isOver) { capHits++; err(`step ${step} bar ${bi}: is-over=${bar.isOver} but sum ${bar.sum} vs cap ${bar.cap}`); } }
        if (bar.rect.left < -MARGIN || bar.rect.right > 1920 + MARGIN || bar.rect.top < -MARGIN || bar.rect.bottom > 1080 + MARGIN) {
          boundHits++; err(`step ${step} bar ${bi}: budget bar off-canvas (top ${Math.round(bar.rect.top)}, bottom ${Math.round(bar.rect.bottom)})`); }
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
main().catch(e => { console.error('[budget-audit] CRASHED', e); process.exit(1); });
