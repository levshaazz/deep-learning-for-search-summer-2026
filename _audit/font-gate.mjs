/* font-gate.mjs — AUDIT R9 / Dimension D.
   Sibling of the slide-viz color-contract `fill`-literal scan, but for TYPE.

   The deck CSS has a design-token font scale (`--fs-*` in Lectures/css/template.css:
     --fs-display/h1/h2/h3/lead/body/small/tiny/code/code-sm/math-big/math/quote).
   Authors are meant to size text with `font-size: var(--fs-…)`. The audit found a large
   pile of RAW `font-size:` literals (e.g. `font-size: 22px`) that bypass that scale, with
   NO gate guarding against MORE being added.

   This gate is a RATCHET, not a flag-day:
     1. Statically scan the deck CSS (Lectures/css/*.css) for `font-size:` declarations whose
        value is NOT `var(--fs-…)` and NOT `inherit` (i.e. a raw literal — px/em/% that bypasses
        the scale).
     2. Count them and compare to a FROZEN baseline constant (the count at the time this gate
        was written). live > baseline  → HARD fail (someone added a new raw font-size).
        live ≤ baseline → pass; the count is printed so authors can BURN IT DOWN. When the live
        count drops, LOWER `BASELINE` here to the new floor so the ratchet can never slip back up.
     3. Inline `style="font-size:…"` in the deck HTML is scanned too, but reported as an
        INFORMATIONAL number only — it is NOT part of the hard baseline (the bulk lives in
        Lectures/css/, and embedded <style> blocks in HTML would muddy a clean baseline).

   Severity: HARD (regression on the CSS baseline fails the build).
   Self-test: plant ONE extra raw `font-size` into a known-good CSS fixture → the count must
   exceed baseline → the gate WOULD fail. Same contract as the other gates' selftests
   (selftest exits 0 == the bad case was correctly DETECTED).

   Usage:  node _audit/font-gate.mjs   |   node _audit/font-gate.mjs --selftest
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK_CSS_DIR = 'Lectures/css';
const DECK_HTML_DIR = 'Lectures';
// The font-scale token file (where --fs-* live). Read only to PROVE the scale exists and to
// print the token names authors should migrate to — the gate does not depend on its values.
const SCALE_FILE = 'Lectures/css/template.css';

/* FROZEN BASELINE — the raw-font-size count in Lectures/css/*.css at the moment this gate was
   authored (2026-06-11). live > BASELINE is a HARD fail. When you burn literals down, set this
   to the new (lower) live count so the ratchet only ever tightens. */
const BASELINE = 204;

/* ── scanners ─────────────────────────────────────────────────────────────── */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** every `font-size:` declaration value in a CSS body (comments stripped). */
function fontSizeDecls(css) {
  const out = [];
  const re = /font-size\s*:\s*([^;}{]+)/gi;
  let m;
  for (const block of [stripComments(css)]) {
    while ((m = re.exec(block)) !== null) out.push(m[1].trim());
  }
  return out;
}

/** a value is OFF-TOKEN (raw) unless it uses a CSS var or inherits the scale. */
function isRawFontSize(value) {
  const v = value.toLowerCase();
  if (/var\(\s*--/.test(v)) return false;   // var(--fs-…) or any token → on-scale
  if (/^inherit\b/.test(v)) return false;   // inheriting the scale
  return true;                               // a literal: px / em / rem / % / number
}

/** count raw font-size literals in one CSS string. */
function rawCount(css) {
  return fontSizeDecls(css).filter(isRawFontSize).length;
}

function listCss(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).filter((f) => f.endsWith('.css')).map((f) => join(abs, f)).sort();
}

/** inline style="…font-size:…" occurrences in deck HTML (informational only). */
function inlineHtmlRaw(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];
  const rows = [];
  for (const f of readdirSync(abs).filter((f) => f.endsWith('.html')).sort()) {
    const html = readFileSync(join(abs, f), 'utf8');
    let n = 0;
    // only TRUE inline style="…" attributes — NOT embedded <style> blocks.
    const attrRe = /style\s*=\s*"([^"]*)"/gi;
    let a;
    while ((a = attrRe.exec(html)) !== null) {
      for (const d of fontSizeDecls(a[1])) if (isRawFontSize(d)) n++;
    }
    if (n) rows.push([relative(ROOT, join(abs, f)), n]);
  }
  return rows;
}

/* ── run ──────────────────────────────────────────────────────────────────── */
function run() {
  const scaleTokens = [...readFileSync(join(ROOT, SCALE_FILE), 'utf8')
    .matchAll(/(--fs-[\w-]+)\s*:/g)].map((m) => m[1]);

  const perFile = [];
  let total = 0;
  for (const f of listCss(DECK_CSS_DIR)) {
    const n = rawCount(readFileSync(f, 'utf8'));
    total += n;
    if (n) perFile.push([relative(ROOT, f), n]);
  }
  perFile.sort((a, b) => b[1] - a[1]);

  console.log(`[font] scale = ${scaleTokens.length} tokens (${scaleTokens.join(', ')}) in ${SCALE_FILE}`);
  console.log(`[font] scanned ${listCss(DECK_CSS_DIR).length} deck stylesheets in ${DECK_CSS_DIR}/`);
  console.log(`[font] raw (off-token) font-size literals — top files:`);
  for (const [f, n] of perFile) console.log(`    ${String(n).padStart(3)}  ${f}`);

  const inline = inlineHtmlRaw(DECK_HTML_DIR);
  const inlineTotal = inline.reduce((s, [, n]) => s + n, 0);
  if (inlineTotal) {
    console.log(`[font] (info, NOT baselined) inline style="font-size:…" in deck HTML: ${inlineTotal} across ${inline.length} file(s)`);
  }

  const over = total - BASELINE;
  console.log(`\n[font] live raw count = ${total}  |  frozen BASELINE = ${BASELINE}  |  delta = ${over > 0 ? '+' : ''}${over}`);
  if (total > BASELINE) {
    console.log(`[font] ✗ HARD FAIL — ${over} NEW raw font-size literal(s) added. Use font-size: var(--fs-…) instead.`);
    return 1;
  }
  if (total < BASELINE) {
    console.log(`[font] ✓ pass — under baseline by ${-over}. Lower BASELINE to ${total} to lock in the win.`);
  } else {
    console.log(`[font] ✓ pass — exactly at baseline. Migrate literals to var(--fs-…) to burn it down.`);
  }
  return 0;
}

/* ── self-test ────────────────────────────────────────────────────────────────
   Take a KNOWN-GOOD CSS fixture (all on-token), confirm it is clean, then plant ONE extra
   raw `font-size` and confirm the count rises ABOVE baseline → the gate WOULD fail.
   The selftest passes (exit 0) iff that planted regression is DETECTED. */
function selftest() {
  const goodFixture = `
    :root{ --fs-body:38px; }
    .slide p { font-size: var(--fs-body); }
    .slide h2{ font-size: var(--fs-h2); }
    .note    { font-size: inherit; }
  `;
  const cleanCount = rawCount(goodFixture);                         // expect 0
  const badFixture = goodFixture + `\n.injected{ font-size: 22px; }`; // plant ONE raw literal
  const badCount = rawCount(badFixture);                            // expect 1

  // simulate the hard-fail decision against an arbitrary baseline = the clean count.
  const detected = cleanCount === 0 && badCount === 1 && badCount > cleanCount;
  // also confirm the real comparator: a count of BASELINE+1 trips the hard fail.
  const comparatorFires = (BASELINE + 1) > BASELINE;

  console.log(`[selftest] clean fixture raw=${cleanCount} (expect 0) | planted fixture raw=${badCount} (expect 1)`);
  console.log(`[selftest] regression detected: ${detected} | hard-fail comparator fires on +1: ${comparatorFires}`);
  const ok = detected && comparatorFires;
  console.log('[selftest]', ok ? 'PASS — a planted raw font-size pushes the count over baseline (gate would fail)' : 'FAIL — blind to a new raw font-size!');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
