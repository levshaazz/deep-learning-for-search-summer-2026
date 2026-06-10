#!/usr/bin/env node
/* =========================================================
   archflow-audit.mjs — geometric QA for `archflow` slides.
   Drives the editable deck in headless Chromium and, for every archflow slide
   AT EVERY STEP, checks the things hand-built diagrams get wrong:
     [1] OVERLAP    — no two visible nodes/labels collide.
     [2] CONNECT    — every visible arrow's endpoints actually touch its
                      from/to node (lines drawn correctly, no drift).
     [3] CANVAS     — every visible node/label stays inside the canvas (scale).
     [4] STRUCTURE  — edges reference existing node ids; data-from/-focus/-step
                      within [0,maxStep]; every step has a note; images have alt.
   Exit 1 on any error. Run: node archflow-audit.mjs   (from _audit/)
   ========================================================= */
import { chromium } from 'playwright';
import { HARDENED } from './lib/gate-harness.mjs';
import { fileURLToPath } from 'node:url';

const DECK = 'file://' + encodeURI(fileURLToPath(new URL('../Lectures Template/Lecture Template.html', import.meta.url)));
const OVERLAP_TOL = 6;   // px of allowed incidental overlap between boxes
const CONNECT_TOL = 34;  // px an arrow endpoint may sit from its node's box
const CANVAS_MARGIN = 4; // px a box may stick out of the canvas

/* --break=<kind> deliberately injects a fault into every archflow slide before
   auditing (negative-test mode) — proves the gate actually fails.
   kinds: overlap | offcanvas | dangling | range | alt */
const BREAK = (process.argv.find(a => a.startsWith('--break=')) || '').split('=')[1] || null;

let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('  ✗ ERROR ' + m); };
const warn = (m) => { warns++; console.log('  ⚠ warn  ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

function rectsOverlap(a, b, tol) {
  const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ix > tol && iy > tol ? Math.round(Math.min(ix, iy)) : 0;
}
/* Do segments p1p2 and p3p4 properly cross? (orientation test) */
function segCross(p1, p2, p3, p4) {
  const o = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
  const o1 = o(p1, p2, p3), o2 = o(p1, p2, p4), o3 = o(p3, p4, p1), o4 = o(p3, p4, p2);
  return o1 !== o2 && o3 !== o4 && o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0;
}
/* Do two polylines cross? (any segment pair) */
function polyCross(a, b) {
  for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < b.length - 1; j++)
    if (segCross(a[i], a[i + 1], b[j], b[j + 1])) return true;
  return false;
}

async function main() {
  const browser = await chromium.launch(HARDENED);
  const page = await browser.newContext({ viewport: { width: 1920, height: 1080 } }).then(c => c.newPage());
  const perr = [];
  page.on('pageerror', e => perr.push(String(e).slice(0, 160)));
  await page.goto(DECK, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Lecture && window.Lecture.total > 0, { timeout: 20000 });
  await page.waitForTimeout(1500);

  const slides = await page.evaluate(() =>
    [...document.querySelectorAll('.slide')].map((s, i) => ({ i, type: s.dataset.type }))
      .filter(s => s.type === 'archflow'));
  console.log(`[archflow-audit] ${DECK}\nfound ${slides.length} archflow slide(s)`);

  for (const { i } of slides) {
    await page.evaluate((idx) => window.Lecture.goTo(idx), i);
    await page.waitForTimeout(400);
    const label = await page.evaluate(() => document.querySelector('.slide.is-active').dataset.screenLabel || '?');
    console.log(`\n── slide ${i + 1} [${label}]${BREAK ? `  (injected fault: --break=${BREAK})` : ''} ──`);

    if (BREAK) {
      await page.evaluate((kind) => {
        const s = document.querySelector('.slide.is-active'), c = s.querySelector('.af-canvas');
        if (kind === 'overlap') { const q = c.querySelector('#af-q'), k = c.querySelector('#af-k'); if (q && k) { q.style.left = k.style.left; q.style.top = k.style.top; } }
        else if (kind === 'offcanvas') { const n = c.querySelector('.af-node'); if (n) n.style.left = '150%'; }
        else if (kind === 'dangling') { const e = c.querySelector('.af-edge'); if (e) e.dataset.toNode = 'af-nope'; }
        else if (kind === 'range') { const n = c.querySelector('.af-node[data-from]'); if (n) n.dataset.from = '99'; }
        else if (kind === 'alt') { const im = c.querySelector('.af-node[data-role="image"] img'); if (im) im.setAttribute('alt', ''); }
        if (s.__archflow) { s.__archflow.route(); s.__archflow.paint(); }
      }, BREAK);
      await page.waitForTimeout(150);
    }

    /* ---- [4] STRUCTURE (static) ---- */
    const struct = await page.evaluate(() => {
      const s = document.querySelector('.slide.is-active');
      const canvas = s.querySelector('.af-canvas');
      const maxStep = parseInt(s.dataset.maxStep, 10) || 0;
      const ids = new Set([...canvas.querySelectorAll('.af-node[id]')].map(n => n.id));
      const out = { maxStep, dangling: [], badRange: [], noteMissing: [], noAlt: [], noId: [] };
      canvas.querySelectorAll('.af-node:not([id])').forEach(() => out.noId.push(1));
      canvas.querySelectorAll('.af-edge').forEach(e => {
        if (!ids.has(e.dataset.fromNode)) out.dangling.push(`from "${e.dataset.fromNode}"`);
        if (!ids.has(e.dataset.toNode)) out.dangling.push(`to "${e.dataset.toNode}"`);
      });
      const chkRange = (v, what) => {
        const m = String(v).match(/^(\d+)(?:\.\.(\d+))?$/); if (!m) { out.badRange.push(`${what}="${v}"`); return; }
        const hi = m[2] != null ? +m[2] : +m[1];
        if (+m[1] < 0 || hi > maxStep) out.badRange.push(`${what}="${v}" > max ${maxStep}`);
      };
      canvas.querySelectorAll('[data-from]').forEach(e => chkRange(e.dataset.from, 'data-from'));
      canvas.querySelectorAll('[data-focus]').forEach(e => chkRange(e.dataset.focus, 'data-focus'));
      const noteSteps = new Set([...s.querySelectorAll('.af-note')].map(n => parseInt(n.dataset.step, 10)));
      for (let k = 0; k <= maxStep; k++) if (!noteSteps.has(k)) out.noteMissing.push(k);
      canvas.querySelectorAll('.af-node[data-role="image"]').forEach(n => {
        const img = n.querySelector('img'); if (!img || !(img.getAttribute('alt') || '').trim()) out.noAlt.push(n.id || '?');
      });
      return out;
    });
    struct.noId.length ? err(`${struct.noId.length} .af-node without id (edges can't reference them)`) : ok('all nodes have ids');
    struct.dangling.length ? struct.dangling.forEach(d => err(`edge references missing node ${d}`)) : ok('no dangling edges');
    struct.badRange.length ? struct.badRange.forEach(d => err(`step out of [0,${struct.maxStep}]: ${d}`)) : ok(`steps within [0,${struct.maxStep}]`);
    struct.noteMissing.length ? warn(`steps without a side note: ${struct.noteMissing.join(', ')}`) : ok('every step has a note');
    struct.noAlt.length ? struct.noAlt.forEach(n => err(`image node "${n}" has no alt text`)) : null;

    /* ---- per-step geometry: [1] overlap, [2] connect/cross, [3] canvas ---- */
    let overlapHits = 0, connectHits = 0, canvasHits = 0, crossHits = 0, maxEdgeCross = 0;
    for (let step = 0; step <= struct.maxStep; step++) {
      let stepCross = 0;
      await page.evaluate((st) => {
        const s = document.querySelector('.slide.is-active');
        s.dataset.currentStep = String(st);
        s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: st, max: parseInt(s.dataset.maxStep, 10) } }));
      }, step);
      await page.waitForTimeout(120);
      const geo = await page.evaluate((tol) => {
        const s = document.querySelector('.slide.is-active');
        const canvas = s.querySelector('.af-canvas');
        const crect = canvas.getBoundingClientRect();
        const vis = [...canvas.querySelectorAll('.af-node.is-shown, .af-label.is-shown')];
        const boxes = vis.map(el => { const r = el.getBoundingClientRect();
          return { id: el.id || (el.className.includes('af-label') ? 'label:' + (el.textContent || '').trim().slice(0, 10) : 'node'),
            isLabel: el.classList.contains('af-label'), left: r.left, top: r.top, right: r.right, bottom: r.bottom }; });
        // arrows
        const arrows = [...canvas.querySelectorAll('svg.af-wires path.is-shown')].map(p => {
          const L = p.getTotalLength(); if (!L) return null;
          const a = p.getPointAtLength(0), b = p.getPointAtLength(L); const m = p.getScreenCTM();
          const map = (pt) => ({ x: m.a * pt.x + m.c * pt.y + m.e, y: m.b * pt.x + m.d * pt.y + m.f });
          const fn = p.dataset.fromNode && document.getElementById(p.dataset.fromNode);
          const tn = p.dataset.toNode && document.getElementById(p.dataset.toNode);
          /* sample many interior points so checks follow the ACTUAL path
             (orthogonal elbows, perimeter "around" routes), not a chord. */
          const pts = Array.from({ length: 11 }, (_, k) => map(p.getPointAtLength(L * (k + 1) / 12)));
          return { from: p.dataset.fromNode, to: p.dataset.toNode, start: map(a), end: map(b), pts,
            fr: fn ? fn.getBoundingClientRect() : null, tr: tn ? tn.getBoundingClientRect() : null };
        }).filter(Boolean);
        // edge labels (must not sit on a node — text-over-text/line readability)
        const edgeLabels = [...canvas.querySelectorAll('.af-edge-label.is-shown')].map(el => {
          const r = el.getBoundingClientRect();
          return { txt: (el.textContent || '').trim().slice(0, 16), left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        });
        const nodeBoxes = boxes.filter(x => !x.isLabel);
        return { crect, boxes, arrows, edgeLabels, nodeBoxes };
      }, OVERLAP_TOL);

      // [1b] edge labels must not overlap any node (the "text intersections" check)
      geo.edgeLabels.forEach(L => geo.nodeBoxes.forEach(N => {
        const ov = rectsOverlap(L, N, OVERLAP_TOL);
        if (ov) { overlapHits++; err(`step ${step}: edge-label "${L.txt}" overlaps node ${N.id} (${ov}px)`); }
      }));

      // [1] overlaps among visible boxes (node↔node, node↔label, label↔label)
      for (let a = 0; a < geo.boxes.length; a++) for (let b = a + 1; b < geo.boxes.length; b++) {
        // labels may legitimately sit beside their node; only flag if BOTH are nodes,
        // or a label overlaps a DIFFERENT node substantially.
        const A = geo.boxes[a], B = geo.boxes[b];
        const ov = rectsOverlap(A, B, OVERLAP_TOL);
        if (ov) { overlapHits++; err(`step ${step}: overlap ${A.id} ↔ ${B.id} (${ov}px)`); }
      }
      // [3] off-canvas
      geo.boxes.forEach(A => {
        if (A.left < geo.crect.left - CANVAS_MARGIN || A.top < geo.crect.top - CANVAS_MARGIN ||
            A.right > geo.crect.right + CANVAS_MARGIN || A.bottom > geo.crect.bottom + CANVAS_MARGIN) {
          canvasHits++; err(`step ${step}: ${A.id} sticks out of the canvas`);
        }
      });
      // [2] arrow endpoints touch their nodes
      const near = (pt, r) => pt.x >= r.left - CONNECT_TOL && pt.x <= r.right + CONNECT_TOL &&
                              pt.y >= r.top - CONNECT_TOL && pt.y <= r.bottom + CONNECT_TOL;
      geo.arrows.forEach(ar => {
        if (ar.fr && !near(ar.start, ar.fr)) { connectHits++; err(`step ${step}: arrow ${ar.from}→${ar.to} start not on ${ar.from}`); }
        if (ar.tr && !near(ar.end, ar.tr)) { connectHits++; err(`step ${step}: arrow ${ar.from}→${ar.to} end not on ${ar.to}`); }
      });
      // [2b] an edge must NOT pass through an UNRELATED node (line↔node crossing)
      const inset = 10;
      geo.arrows.forEach(ar => {
        const seen = new Set();
        geo.nodeBoxes.forEach(N => {
          if (N.id === ar.from || N.id === ar.to || seen.has(N.id)) return;
          const through = ar.pts.some(pt => pt.x > N.left + inset && pt.x < N.right - inset &&
                                            pt.y > N.top + inset && pt.y < N.bottom - inset);
          if (through) { crossHits++; seen.add(N.id); err(`step ${step}: arrow ${ar.from}→${ar.to} passes through node ${N.id}`); }
        });
      });
      // [2c] count edge↔edge crossings along the ACTUAL polylines — warning
      for (let a = 0; a < geo.arrows.length; a++) for (let b = a + 1; b < geo.arrows.length; b++) {
        const A = geo.arrows[a], B = geo.arrows[b];
        // skip edges that share an endpoint (they meet at a node, not a crossing)
        if (A.from === B.from || A.from === B.to || A.to === B.from || A.to === B.to) continue;
        if (polyCross([A.start, ...A.pts, A.end], [B.start, ...B.pts, B.end])) stepCross++;
      }
      maxEdgeCross = Math.max(maxEdgeCross, stepCross);
    }
    overlapHits === 0 && ok('no overlaps across all steps');
    connectHits === 0 && ok('all arrows connect their nodes across all steps');
    crossHits === 0 && ok('no edge passes through an unrelated node');
    maxEdgeCross === 0 ? ok('no edge↔edge crossings')
                       : warn(`up to ${maxEdgeCross} edge↔edge crossing(s) at a step — consider re-routing`);
    canvasHits === 0 && ok('everything stays inside the canvas across all steps');
  }

  if (perr.length) perr.forEach(e => err('pageerror: ' + e));
  await browser.close();
  console.log(`\n[archflow-audit] ${errors} error(s), ${warns} warning(s)`);
  process.exit(errors === 0 ? 0 : 1);
}
main().catch(e => { console.error('[archflow-audit] CRASHED', e); process.exit(1); });
