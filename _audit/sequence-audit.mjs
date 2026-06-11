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
import { HARDENED, TEMPLATE_DECK_URL, makeReporter } from './lib/gate-harness.mjs';

const DECK = TEMPLATE_DECK_URL;
const TOL = 4, MARGIN = 6;
const R = makeReporter('sequence-audit');
const { err, ok } = R;
const overlap = (a, b) => (Math.min(a.right, b.right) - Math.max(a.left, b.left)) > TOL &&
                          (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > TOL;

// ── pure detectors (the REAL assertion logic, also exercised by --selftest so it can't go blind) ──
function checkStruct(s) {
  const out = [];
  s.badRef.forEach(r => out.push({ code: 'bad-ref', msg: `message references unknown actor ${r}` }));
  if (s.badStep.length) out.push({ code: 'bad-step', msg: `message data-step out of [0,${s.max}]: ${s.badStep.join(', ')}` });
  if (s.badLat.length) out.push({ code: 'bad-lat', msg: `non-numeric data-lat: ${s.badLat.join(', ')}` });
  if (s.lifelines !== s.actors) out.push({ code: 'lifelines', msg: `lifelines (${s.lifelines}) ≠ actors (${s.actors})` });
  return out;
}
function checkStep(g, step) {
  const out = [];
  for (let a = 0; a < g.chips.length; a++) for (let b = a + 1; b < g.chips.length; b++)
    if (overlap(g.chips[a], g.chips[b])) out.push({ code: 'chip', msg: `step ${step}: actor chips overlap` });
  for (let a = 0; a < g.labels.length; a++) for (let b = a + 1; b < g.labels.length; b++)
    if (overlap(g.labels[a], g.labels[b])) out.push({ code: 'label', msg: `step ${step}: message labels "${g.labels[a].txt}" ↔ "${g.labels[b].txt}" overlap` });
  g.labels.forEach(L => { if (L.left < g.crect.left - MARGIN || L.right > g.crect.right + MARGIN) out.push({ code: 'bounds', msg: `step ${step}: message label "${L.txt}" off-canvas` }); });
  if (Math.abs(g.total - g.sum) > 0.5) out.push({ code: 'budget', msg: `step ${step}: budget total ${g.total} ≠ sum of revealed latencies ${g.sum}` });
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
    const sf = checkStruct(struct);
    sf.forEach(x => err(x.msg));
    if (!sf.some(x => x.code === 'bad-ref')) ok('messages reference valid actors');
    if (!sf.some(x => x.code === 'bad-step')) ok(`message steps within [0,${struct.max}]`);
    if (!sf.some(x => x.code === 'lifelines')) ok(`lifelines drawn = ${struct.actors} actors`);

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
      for (const x of checkStep(g, step)) {
        err(x.msg);
        if (x.code === 'chip') chipHits++; else if (x.code === 'label') labelHits++;
        else if (x.code === 'bounds') boundsHits++; else if (x.code === 'budget') budgetHits++;
      }
    }
    chipHits === 0 && ok('actor chips never overlap');
    labelHits === 0 && ok('message labels never overlap');
    boundsHits === 0 && ok('message labels stay inside the canvas');
    budgetHits === 0 && ok('running budget == sum of revealed latencies at every step');
  }

  if (perr.length) perr.forEach(e => err('pageerror: ' + e));
  await browser.close();
  R.done();
}
// ── --selftest: feed each clean + planted-fault case to the REAL detectors (no browser) ──────────
function selftest() {
  const f = [];
  const codes = (arr) => arr.map(x => x.code);
  // checkStruct: clean silent; each fault class fires
  const okStruct = { max: 3, badRef: [], badStep: [], badLat: [], lifelines: 3, actors: 3 };
  if (checkStruct(okStruct).length) f.push('struct: FALSE-POSITIVE on clean');
  if (!codes(checkStruct({ ...okStruct, badRef: ['from "ghost"'] })).includes('bad-ref')) f.push('struct: missed unknown-actor ref');
  if (!codes(checkStruct({ ...okStruct, badStep: ['99'] })).includes('bad-step')) f.push('struct: missed step out of [0,max]');
  if (!codes(checkStruct({ ...okStruct, badLat: ['NaN'] })).includes('bad-lat')) f.push('struct: missed non-numeric data-lat');
  if (!codes(checkStruct({ ...okStruct, lifelines: 2 })).includes('lifelines')) f.push('struct: missed lifelines≠actors');
  // checkStep: clean silent; each fault class fires
  const A = { left: 0, top: 0, right: 50, bottom: 50 }, B = { left: 100, top: 0, right: 150, bottom: 50 };
  const Bover = { left: 10, top: 10, right: 60, bottom: 60 };
  const crect = { left: 0, top: 0, right: 1000, bottom: 800 };
  const lab = (x, txt = 'm') => ({ txt, ...x });
  const okG = { crect, chips: [A, B], labels: [lab(A), lab(B)], total: 5, sum: 5 };
  if (checkStep(okG, 0).length) f.push('step: FALSE-POSITIVE on clean');
  if (!codes(checkStep({ ...okG, chips: [A, Bover] }, 0)).includes('chip')) f.push('step: missed chip overlap');
  if (!codes(checkStep({ ...okG, labels: [lab(A), lab(Bover)] }, 0)).includes('label')) f.push('step: missed label overlap');
  if (!codes(checkStep({ ...okG, labels: [lab({ left: -99, top: 0, right: 20, bottom: 30 })] }, 0)).includes('bounds')) f.push('step: missed off-canvas label');
  if (!codes(checkStep({ ...okG, total: 9 }, 0)).includes('budget')) f.push('step: missed budget≠sum');
  console.log('[sequence-audit:selftest]', f.length ? 'FAIL — blind: ' + f.join('; ')
    : 'PASS — structure (bad-ref/bad-step/bad-lat/lifelines) + step (chip/label/bounds/budget) each fire on the fault and stay silent on clean');
  process.exit(f.length ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
else main().catch(e => { console.error('[sequence-audit] CRASHED', e); process.exit(1); });
