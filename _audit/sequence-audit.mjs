#!/usr/bin/env node
/* =========================================================
   sequence-audit.mjs — geometric QA for `sequence` slides.
   For every sequence slide AT EVERY STEP:
     [1] STRUCTURE — messages reference existing actors; data-step in [0,max];
                     data-lat numeric; lifelines drawn = actors.
     [2] OVERLAP    — actor chips don't collide; visible message LABELS don't
                     collide with each other.
     [3] BOUNDS     — every visible message label stays inside the canvas.
     [4] BUDGET     — the running total == sum of revealed message latencies.
   file:// — no server. Exit 1 on any error. Run: node sequence-audit.mjs
   ========================================================= */
import { chromium } from 'playwright';
import { HARDENED, TEMPLATE_DECK_URL } from './lib/gate-harness.mjs';

const DECK = TEMPLATE_DECK_URL;
const TOL = 4, MARGIN = 6;
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ERROR ' + m); };
const ok = (m) => console.log('  ✓ ' + m);
const overlap = (a, b) => (Math.min(a.right, b.right) - Math.max(a.left, b.left)) > TOL &&
                          (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > TOL;

async function main() {
  const browser = await chromium.launch(HARDENED);
  const page = await browser.newContext({ viewport: { width: 1920, height: 1080 } }).then(c => c.newPage());
  const perr = []; page.on('pageerror', e => perr.push(String(e).slice(0, 140)));
  await page.goto(DECK, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
  await page.waitForTimeout(1500);

  const slides = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s, i) => ({ i, t: s.dataset.type })).filter(s => s.t === 'sequence'));
  console.log(`[sequence-audit] ${DECK}\nfound ${slides.length} sequence slide(s)`);

  for (const { i } of slides) {
    await page.evaluate(idx => window.Lecture.goTo(idx), i);
    await page.waitForTimeout(400);
    const label = await page.evaluate(() => document.querySelector('.slide.is-active').dataset.screenLabel || '?');
    console.log(`\n── slide ${i + 1} [${label}] ──`);

    const struct = await page.evaluate(() => {
      const s = document.querySelector('.slide.is-active');
      const max = parseInt(s.dataset.maxStep, 10) || 0;
      const actorIds = new Set([...s.querySelectorAll('.seq-actor[data-actor]')].map(a => a.dataset.actor));
      const out = { max, badRef: [], badStep: [], badLat: [], lifelines: s.querySelectorAll('.seq-lines line').length, actors: actorIds.size };
      s.querySelectorAll('.seq-msg').forEach(m => {
        if (!actorIds.has(m.dataset.from)) out.badRef.push(`from "${m.dataset.from}"`);
        if (!actorIds.has(m.dataset.to)) out.badRef.push(`to "${m.dataset.to}"`);
        const st = parseInt(m.dataset.step, 10);
        if (!Number.isFinite(st) || st < 0 || st > max) out.badStep.push(String(m.dataset.step));
        if (m.dataset.lat != null && !Number.isFinite(parseFloat(m.dataset.lat))) out.badLat.push(String(m.dataset.lat));
      });
      return out;
    });
    struct.badRef.length ? struct.badRef.forEach(r => err(`message references unknown actor ${r}`)) : ok('messages reference valid actors');
    struct.badStep.length ? err(`message data-step out of [0,${struct.max}]: ${struct.badStep.join(', ')}`) : ok(`message steps within [0,${struct.max}]`);
    struct.badLat.length ? err(`non-numeric data-lat: ${struct.badLat.join(', ')}`) : null;
    struct.lifelines === struct.actors ? ok(`lifelines drawn = ${struct.actors} actors`) : err(`lifelines (${struct.lifelines}) ≠ actors (${struct.actors})`);

    let chipHits = 0, labelHits = 0, boundsHits = 0, budgetHits = 0;
    for (let step = 0; step <= struct.max; step++) {
      await page.evaluate(st => {
        const s = document.querySelector('.slide.is-active');
        s.dataset.currentStep = String(st);
        s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: st, max: parseInt(s.dataset.maxStep, 10) } }));
      }, step);
      await page.waitForTimeout(110);
      const g = await page.evaluate(() => {
        const s = document.querySelector('.slide.is-active');
        const canvas = s.querySelector('.seq-canvas');
        const crect = canvas.getBoundingClientRect();
        const box = el => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
        const chips = [...s.querySelectorAll('.seq-actor-chip')].map(box);
        const vis = [...s.querySelectorAll('.seq-msg')].filter(m => !m.classList.contains('is-step-hidden'));
        const labels = vis.map(m => { const l = m.querySelector('.seq-msg-label'); return { txt: (l ? l.textContent : '').trim().slice(0, 18), ...box(l || m) }; });
        const totalTxt = (s.querySelector('[data-seq-total]') || {}).textContent || '';
        const cur = parseInt(s.dataset.currentStep, 10) || 0;
        let sum = 0; s.querySelectorAll('.seq-msg').forEach(m => { if ((parseInt(m.dataset.step, 10) || 0) <= cur) sum += parseFloat(m.dataset.lat || '0'); });
        return { crect, chips, labels, total: parseFloat(totalTxt) || 0, sum };
      });
      for (let a = 0; a < g.chips.length; a++) for (let b = a + 1; b < g.chips.length; b++)
        if (overlap(g.chips[a], g.chips[b])) { chipHits++; err(`step ${step}: actor chips overlap`); }
      for (let a = 0; a < g.labels.length; a++) for (let b = a + 1; b < g.labels.length; b++)
        if (overlap(g.labels[a], g.labels[b])) { labelHits++; err(`step ${step}: message labels "${g.labels[a].txt}" ↔ "${g.labels[b].txt}" overlap`); }
      g.labels.forEach(L => { if (L.left < g.crect.left - MARGIN || L.right > g.crect.right + MARGIN) { boundsHits++; err(`step ${step}: message label "${L.txt}" off-canvas`); } });
      if (Math.abs(g.total - g.sum) > 0.5) { budgetHits++; err(`step ${step}: budget total ${g.total} ≠ sum of revealed latencies ${g.sum}`); }
    }
    chipHits === 0 && ok('actor chips never overlap');
    labelHits === 0 && ok('message labels never overlap');
    boundsHits === 0 && ok('message labels stay inside the canvas');
    budgetHits === 0 && ok('running budget == sum of revealed latencies at every step');
  }

  if (perr.length) perr.forEach(e => err('pageerror: ' + e));
  await browser.close();
  console.log(`\n[sequence-audit] ${errors} error(s), ${warns} warning(s)`);
  process.exit(errors === 0 ? 0 : 1);
}
main().catch(e => { console.error('[sequence-audit] CRASHED', e); process.exit(1); });
