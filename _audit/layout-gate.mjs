#!/usr/bin/env node
/* =========================================================================
   layout-gate.mjs — "overlap has ONE definition." Binds widgets/_layout.js `placeLabels`' label
   SEPARATION to slide-viz-gate's text-overprint threshold so the two can't drift apart.

   placeLabels separates colliding labels by `minGap` px; slide-viz FLAGS overprint when ≥ OVERPRINT_COVER
   of the smaller text box is buried by another (both constants now live in _audit/lib/thresholds.mjs,
   shared with slide-viz). This gate runs the REAL placeLabels, measures the separation it picks for two
   coincident labels, and asserts that at the deck's label height that separation buries < OVERPRINT_COVER
   of the box — i.e. a figure laid out by placeLabels can NEVER trip slide-viz's overprint detector. If
   minGap is lowered, or OVERPRINT_COVER is raised, until they'd conflict, this HARD-fails.

   Pure (no browser, no playwright). Run: node layout-gate.mjs | node layout-gate.mjs --selftest
   ========================================================================= */
import { placeLabels } from '../widgets/_layout.js';
import { OVERPRINT_COVER } from './lib/thresholds.mjs';

// px line-height of the deck's placeLabels-laid-out labels (the L5 figures use ~14px mono text, whose
// rendered box — ascenders+descenders — is ≈17px). Conservative: a taller box → more overlap → stricter.
const LABEL_H = 17;
const RECT = { x: 0, y: 0, w: 400, h: 400 };

// fraction of one LABEL_H-tall box buried when two such boxes' baselines are `gap` px apart.
const coverAt = (gap) => Math.max(0, LABEL_H - gap) / LABEL_H;

// the separation placeLabels actually chooses for two COINCIDENT colliding labels (== its minGap).
function placeLabelsGap() {
  const out = placeLabels([{ x: 200, y: 200, text: 'alpha' }, { x: 200, y: 200, text: 'beta' }], RECT);
  return Math.abs(out[0].y - out[1].y);
}

function run() {
  const gap = placeLabelsGap();
  const cover = coverAt(gap);
  const ok = cover < OVERPRINT_COVER;
  console.log(`[layout-gate] placeLabels separates colliding labels by ${gap.toFixed(1)}px → at label-height ${LABEL_H}px that buries ${(cover * 100).toFixed(0)}% of the smaller box`);
  console.log(`[layout-gate] slide-viz flags overprint at ≥ ${(OVERPRINT_COVER * 100).toFixed(0)}% (shared lib/thresholds.mjs)`);
  console.log(`[layout-gate] ${ok ? '✓ PASS — placeLabels separation stays under the overprint threshold (one definition holds)'
    : '✗ HARD — placeLabels-laid-out labels would OVERPRINT per slide-viz; raise minGap in widgets/_layout.js or reconcile OVERPRINT_COVER'}`);
  return ok ? 0 : 1;
}

function selftest() {
  // (a) the binding must FIRE if separation dropped below the safe floor (here a 40%-of-LABEL_H gap buries 60% ≥ threshold)
  const wouldFire = coverAt(LABEL_H * 0.4) >= OVERPRINT_COVER;
  // (b) and stay SILENT at the real placeLabels separation
  const realSilent = coverAt(placeLabelsGap()) < OVERPRINT_COVER;
  const ok = wouldFire && realSilent;
  console.log('[layout-gate:selftest]', ok
    ? 'PASS — fires when the separation would overprint, silent at the real placeLabels minGap'
    : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
