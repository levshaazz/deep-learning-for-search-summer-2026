#!/usr/bin/env node
/* =========================================================
   archflow-negative.mjs — negative tests for the archflow checks.
   Proves the QA actually FIRES: it deliberately breaks the archflow slide
   (overlap a node, push one off-canvas, sever an edge reference, push a step
   out of range, strip an image's alt, drop a step's note), confirms each fault
   is DETECTED, then reverts and confirms the deck is clean again.

   Structural faults are checked by the live pre-flight (window.__preflight);
   geometric faults (overlap / off-canvas) use the same box predicate as
   _audit/archflow-audit.mjs. Loads over file:// — no server needed.
   Run:  node archflow-negative.mjs   (from _audit/). Exit 1 if any check
   failed to fire or the deck wasn't clean before/after.
   ========================================================= */
import { chromium } from 'playwright';
import { HARDENED, TEMPLATE_DECK_URL } from './lib/gate-harness.mjs';

const BASE = TEMPLATE_DECK_URL;
const browser = await chromium.launch(HARDENED);
let code = 1;
try {
const page = await browser.newContext({ viewport: { width: 1920, height: 1080 } }).then(c => c.newPage());
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => window.Lecture && window.__preflight);
await page.waitForTimeout(1500);

const out = {};

// 0) clean baseline — no archflow errors before we break anything
out.cleanBefore = await page.evaluate(() => {
  const is = window.__preflight.runChecks();
  const af = is.filter(i => /archflow/.test(i.msg));
  return { err: af.filter(i => i.sev === 'error').length, warn: af.filter(i => i.sev === 'warn').length };
});

// 1) STRUCTURAL faults (live pre-flight) — inject, detect, revert
out.structural = await page.evaluate(() => {
  const r = {};
  const run = () => window.__preflight.runChecks();
  const hit = (re, sev) => run().filter(i => i.sev === sev && re.test(i.msg)).length > 0;
  const canvas = document.querySelector('.slide[data-type="archflow"] .af-canvas');

  // a) sever an edge reference (dangling)
  const edge = canvas.querySelector('.af-edge');
  const savedTo = edge.dataset.toNode;
  edge.dataset.toNode = 'af-does-not-exist';
  r.danglingEdge = hit(/edge data-to-node=.*references no \.af-node/, 'error');
  edge.dataset.toNode = savedTo;

  // b) push a step out of [0,max]
  const node = canvas.querySelector('.af-node[data-from]');
  const savedFrom = node.dataset.from;
  node.dataset.from = '99';
  r.stepOutOfRange = hit(/data-from="99" outside \[0,/, 'error');
  node.dataset.from = savedFrom;

  // c) strip an image node's alt
  const img = canvas.querySelector('.af-node[data-role="image"] img');
  const savedAlt = img.getAttribute('alt');
  img.setAttribute('alt', '');
  r.imageNoAlt = hit(/image node .* has no alt text/, 'error');
  img.setAttribute('alt', savedAlt);

  // d) drop a step's note (re-point one note off the step grid)
  const note = document.querySelector('.slide[data-type="archflow"] .af-note[data-step="3"]');
  const savedStep = note.dataset.step;
  note.dataset.step = '99';
  r.noteMissing = hit(/steps without a side note/, 'warn');
  note.dataset.step = savedStep;

  return r;
});

// 2) GEOMETRIC faults (overlap / off-canvas) — same predicate as the auditor.
//    Slide must be active + all nodes shown, so navigate + max-step first.
out.geometry = await (async () => {
  const i = await page.evaluate(() => [...document.querySelectorAll('.slide')].findIndex(s => s.dataset.type === 'archflow'));
  await page.evaluate((idx) => window.Lecture.goTo(idx), i);
  await page.evaluate(() => {
    const s = document.querySelector('.slide.is-active');
    s.dataset.currentStep = String(s.dataset.maxStep);
    s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: +s.dataset.maxStep, max: +s.dataset.maxStep } }));
  });
  await page.waitForTimeout(250);
  return page.evaluate(() => {
    const TOL = 6, MARGIN = 4, r = {};
    const inter = (a, b) => {
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return ix > TOL && iy > TOL;
    };
    // a) overlap: drop Q onto K
    const q = document.getElementById('af-q'), k = document.getElementById('af-k');
    const sq = q.getAttribute('style');
    q.style.left = k.style.left; q.style.top = k.style.top;
    void q.offsetWidth;
    r.overlap = inter(q.getBoundingClientRect(), k.getBoundingClientRect());
    q.setAttribute('style', sq);

    // b) off-canvas: shove Y far right
    const y = document.getElementById('af-y'), canvas = document.querySelector('.slide.is-active .af-canvas');
    const sy = y.getAttribute('style');
    y.style.left = '140%';
    void y.offsetWidth;
    const ry = y.getBoundingClientRect(), rc = canvas.getBoundingClientRect();
    r.offCanvas = ry.right > rc.right + MARGIN || ry.left < rc.left - MARGIN || ry.top < rc.top - MARGIN || ry.bottom > rc.bottom + MARGIN;
    y.setAttribute('style', sy);
    void y.offsetWidth;
    return r;
  });
})();

// 3) confirm clean again after every revert
out.cleanAfter = await page.evaluate(() => {
  const is = window.__preflight.runChecks();
  const af = is.filter(i => /archflow/.test(i.msg));
  return { err: af.filter(i => i.sev === 'error').length, warn: af.filter(i => i.sev === 'warn').length };
});

const cases = { ...out.structural, ...out.geometry };
const allDetected = Object.values(cases).every(Boolean);
const cleanOk = out.cleanBefore.err === 0 && out.cleanBefore.warn === 0 && out.cleanAfter.err === 0 && out.cleanAfter.warn === 0;
console.log(JSON.stringify({ ...out, cases, allDetected, cleanOk }, null, 2));
code = allDetected && cleanOk ? 0 : 1;
} catch (e) {
  console.error(e);
  code = 1;
} finally {
  await browser.close();
}
process.exit(code);
