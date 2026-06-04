#!/usr/bin/env node
/* =========================================================
   gate-selftest.mjs — AUDIT_V2 §2.4 full detector self-test for visual-gate.
   Institutionalizes the manual "inject → confirm it fires → restore" validation (TEXTCLIP/
   CONTRACT/OVERLAP were all hand-validated this way). Writes a TEMPORARY fixture deck — a copy of
   L2 with three deliberate violations injected — runs visual-gate on it, and asserts each new
   detector fires. A blind detector fails this and (via the harness preflight) aborts the series.

   No real deck is mutated: the fixture is a throwaway file in Lectures/ (shares the deck's CSS/JS),
   deleted in `finally`. Usage:  node gate-selftest.mjs
   ========================================================= */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUD = fileURLToPath(new URL('./', import.meta.url));
const LECT = join(AUD, '../Lectures');
const SRC = join(LECT, '02-nlp-tokenization-similarity.html');
const FIX = '_vg-selftest.html';                 // throwaway, shares Lectures/ relative assets
const FIXPATH = join(LECT, FIX);

let html = readFileSync(SRC, 'utf8');
// (1) CONTRACT: break the first .def-card so its definition slide loses its required node.
const before = html;
html = html.replace('class="def-card"', 'class="defcard-SELFTEST"');
if (html === before) { console.error('[gate-selftest] FAIL — no .def-card to break in fixture'); process.exit(1); }
// (2) TEXTCLIP + (3) OVERLAP: inject into the first slide a clipped wide-text box and an
//     oversized .cameo that covers the title text.
const inject =
  '<div style="overflow:hidden;width:160px;height:50px">' +
  '<span style="white-space:nowrap;font-size:36px">SELFTESTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</span></div>' +
  '<img class="cameo" alt="" style="position:absolute;left:0;top:0;width:1800px;height:1000px">';
html = html.replace(/(<section class="slide"[^>]*>)/, `$1${inject}`);
writeFileSync(FIXPATH, html);

let out = '';
try {
  out = execSync(`node visual-gate.mjs ${FIX}`, { cwd: AUD, encoding: 'utf8' });
} catch (e) {                              // visual-gate exits non-zero on HARD findings — that's expected here
  out = (e.stdout || '') + (e.stderr || '');
} finally {
  rmSync(FIXPATH, { force: true });
}

const checks = [
  ['CONTRACT', /CONTRACT type="definition"/],
  ['TEXTCLIP', /TEXTCLIP/],
  ['OVERLAP',  /OVERLAP cameo/],
];
let ok = true;
for (const [name, re] of checks) {
  const hit = re.test(out);
  console.log(`[gate-selftest] ${name}: ${hit ? 'PASS — fires on fixture' : 'FAIL — detector BLIND!'}`);
  if (!hit) ok = false;
}
console.log(ok ? '[gate-selftest] PASS — visual-gate detectors all fire'
               : '[gate-selftest] FAIL — a detector is blind; fix before running a series');
process.exit(ok ? 0 : 1);
