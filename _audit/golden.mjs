#!/usr/bin/env node
/* =========================================================
   golden.mjs — AUDIT_V2 §2.3 golden-screenshot regression.
   Pixel-diffs every slide's current render against an approved baseline, so an
   unintended visual change (e.g. the editor's L2-57 inset fix that crowded the
   bottom line) surfaces as a localized CHANGED region — deterministically, not
   via the VLM. Light theme, full coverage (all slides).

   Baselines live in _audit/golden/ (one PNG per slide). They are a LOCAL
   regression reference (gitignored) that persists between sessions in a series.

   Usage:
     node golden.mjs --approve   capture the current render as the new baseline
     node golden.mjs             diff current vs baseline; lists CHANGED slides
   Severity: CHANGED = review-gate (reported, non-blocking — a change may be intended).
   ========================================================= */
import { execSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUD = fileURLToPath(new URL('./', import.meta.url));     // _audit/
const GOLD = join(AUD, 'golden');
const CUR  = join(AUD, 'golden-cur');
const DECKS = ['00-introduction.html','01-search-ir-ml-system-design.html','02-nlp-tokenization-similarity.html'];
const FUZZ = '2%';        // ignore sub-threshold AA / font-rendering jitter
const THRESH = 2500;      // changed pixels above this = a real visual change

const approve = process.argv.includes('--approve');

function shootAll(relOut) {
  for (const d of DECKS)
    execSync(`node shot.mjs "${d}" all "${relOut}" light --no-chrome`, { cwd: AUD, stdio: 'ignore' });
}

function diffCount(a, b) {
  try {
    const out = execSync(`magick compare -metric AE -fuzz ${FUZZ} "${a}" "${b}" null: 2>&1`,
      { cwd: AUD, encoding: 'utf8' });
    return parseInt(out.trim().split(/\s+/)[0], 10) || 0;
  } catch (e) {                          // compare exits 1 when images differ; the count is on stderr
    const m = (e.stdout || e.message || '').toString().trim().match(/^\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }
}

if (approve) {
  rmSync(GOLD, { recursive: true, force: true });
  mkdirSync(GOLD, { recursive: true });
  shootAll('_audit/golden');
  const n = readdirSync(GOLD).filter(f => f.endsWith('.png')).length;
  console.log(`[golden] approved ${n} baseline slides → _audit/golden/`);
  process.exit(0);
}

if (!existsSync(GOLD) || readdirSync(GOLD).filter(f => f.endsWith('.png')).length === 0) {
  console.log('[golden] no baseline yet — run `node golden.mjs --approve` first.');
  process.exit(0);
}

rmSync(CUR, { recursive: true, force: true });
mkdirSync(CUR, { recursive: true });
shootAll('_audit/golden-cur');

const curFiles = readdirSync(CUR).filter(f => f.endsWith('.png'));
const changed = [], added = [], removed = [];
for (const f of curFiles) {
  if (!existsSync(join(GOLD, f))) { added.push(f); continue; }
  const d = diffCount(join(GOLD, f), join(CUR, f));
  if (d > THRESH) changed.push({ f, d });
}
for (const f of readdirSync(GOLD).filter(f => f.endsWith('.png')))
  if (!curFiles.includes(f)) removed.push(f);

console.log(`[golden] compared ${curFiles.length} slides vs baseline (100% light coverage)`);
changed.sort((a, b) => b.d - a.d).forEach(({ f, d }) => console.log(`  ~ CHANGED ${f}  (${d} px > ${THRESH})`));
added.forEach(f => console.log(`  + NEW ${f} (no baseline — approve to bless)`));
removed.forEach(f => console.log(`  - GONE ${f} (in baseline, not rendered now)`));
if (!changed.length && !added.length && !removed.length) console.log('  ✓ no visual changes');
rmSync(CUR, { recursive: true, force: true });
console.log(`\n[golden] CHANGED=${changed.length} NEW=${added.length} GONE=${removed.length} (review-gate; non-blocking)`);
process.exit(0);
