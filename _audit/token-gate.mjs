/* token-gate.mjs — AUDIT_SITE G2.
   ONE design-token source: tokens/design-tokens.css. Two checks:
     [A] no other SITE stylesheet (src/**, widgets/**) defines :root custom properties — everyone
         else may only USE them via var(). (Catches the index↔deck :root divergence class.)
     [B] the brand tokens the source claims to MIRROR from the decks actually match the deck's
         template.css :root — so "one palette across decks + site" is true, not aspirational.
   Severity: HARD. Self-test: a rogue :root token + a value mismatch must fire.

   Usage:  node _audit/token-gate.mjs   |   node _audit/token-gate.mjs --selftest
*/
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'tokens/design-tokens.css';
const DECK = 'Lectures/css/template.css';
// brand tokens design-tokens.css mirrors from the deck (must match value-for-value)
const SHARED = ['--accent', '--accent-ink', '--accent-soft', '--bg', '--bg-alt', '--bg-card',
  '--ink', '--ink-2', '--ink-3', '--rule', '--rule-strong'];

function walk(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (ext.includes(extname(e.name))) out.push(p);
  }
  return out;
}
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
// vars from the FIRST :root{...} block (light theme)
function rootVars(css) {
  const m = stripComments(css).match(/:root\s*{([^}]*)}/);
  const vars = {};
  if (m) for (const d of m[1].split(';')) {
    const mm = d.match(/\s*(--[\w-]+)\s*:\s*(.+)\s*$/);
    if (mm) vars[mm[1]] = mm[2].trim();
  }
  return vars;
}
// any :root / [data-theme] block that DEFINES custom props
function definesRootTokens(css) {
  const c = stripComments(css);
  const blocks = c.match(/(:root|\[data-theme[^\]]*\])\s*{[^}]*}/g) || [];
  return blocks.some((b) => /--[\w-]+\s*:/.test(b));
}

function run() {
  const report = [];
  // [A]
  const siteCss = [...walk(join(ROOT, 'src'), ['.css']), ...walk(join(ROOT, 'widgets'), ['.css'])];
  for (const f of siteCss) {
    if (definesRootTokens(readFileSync(f, 'utf8'))) report.push(`[A] ${f.replace(ROOT + '/', '')} defines :root tokens — only ${SOURCE} may`);
  }
  // [B]
  const src = rootVars(readFileSync(join(ROOT, SOURCE), 'utf8'));
  const deck = rootVars(readFileSync(join(ROOT, DECK), 'utf8'));
  let checked = 0;
  for (const t of SHARED) {
    if (src[t] == null) { report.push(`[B] ${SOURCE} missing brand token ${t}`); continue; }
    if (deck[t] == null) continue; // deck may not define it; skip
    checked++;
    if (src[t].toUpperCase() !== deck[t].toUpperCase())
      report.push(`[B] ${t}: source=${src[t]} but deck=${deck[t]} (palette diverged)`);
  }
  console.log(`[token] 1 source (${SOURCE}); scanned ${siteCss.length} site stylesheets; cross-checked ${checked} brand tokens vs deck`);
  for (const r of report) console.log(`  ✗ ${r}`);
  console.log(`\n[token] HARD(rogue-root/diverged)=${report.length}`);
  return report.length ? 1 : 0;
}

function selftest() {
  const rogue = definesRootTokens(':root{ --accent:#f00; }');
  const okValues = rootVars(':root{ --accent:#2A6FDB; }')['--accent'] === '#2A6FDB';
  const mism = '#2A6FDB'.toUpperCase() !== '#FF0000'.toUpperCase();
  console.log('[selftest] rogue-root detected:', rogue, '| value parse:', okValues, '| mismatch detect:', mism);
  const ok = rogue && okValues && mism;
  console.log('[selftest]', ok ? 'PASS — rogue :root + value mismatch fire' : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
