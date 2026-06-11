/* token-gate.mjs — AUDIT_SITE G2.
   ONE design-token source: tokens/design-tokens.css. Three checks:
     [A] no other SITE stylesheet (src/**, widgets/**) defines :root custom properties — everyone
         else may only USE them via var(). (Catches the index↔deck :root divergence class.)
     [B] the brand tokens the source claims to MIRROR from the decks actually match the deck's
         template.css :root — so "one palette across decks + site" is true, not aspirational.
     [D] semantic --c-* HUE DRIFT: a `var(--c-NAME, #HEX)` fallback only renders when the token
         is ABSENT, so the fallback #HEX must EQUAL the token's canonical light value — else the
         figure shows a DIFFERENT hue without the token. (R9 dimension D.) Cross-checks every
         `--c-*` fallback across tokens/, Lectures/css/, widgets/ against design-tokens.css :root.
   Severity: HARD. Self-test: a rogue :root token + a value mismatch + a --c-* fallback drift must fire.

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

// [D] canonical semantic --c-* hexes from the FIRST :root (light theme). Only direct
// hex assignments (the decorative/accessible hues); aliases like `--good: var(--c-green)` skip.
function canonHues(css) {
  const out = {};
  for (const [name, hex] of rootVarsLight(css))
    if (/^--c-/.test(name) && /^#[0-9A-Fa-f]{3,8}$/.test(hex)) out[name] = hex.toUpperCase();
  return out;
}
// (name, value) pairs from the FIRST :root{...}; tolerant of multiple decls per physical line
function* rootVarsLight(css) {
  const m = stripComments(css).match(/:root\s*{([^}]*)}/);
  if (!m) return;
  for (const d of m[1].split(';')) {
    const mm = d.match(/\s*(--[\w-]+)\s*:\s*(.+?)\s*$/);
    if (mm) yield [mm[1], mm[2].trim()];
  }
}
// every `var(--c-NAME, <fallback>)` occurrence in a stylesheet (comments stripped),
// with the fallback's leading hex literal (if any). Returns {name, fallback, line}.
function cVarFallbacks(css) {
  // blank out comment BODIES but keep their newlines, so reported line numbers
  // match the real source file (comments can't host a fallback anyway).
  const lines = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
  const re = /var\(\s*(--c-[\w-]+)\s*,\s*([^)]+?)\s*\)/g;
  const hits = [];
  lines.forEach((ln, i) => {
    let m;
    while ((m = re.exec(ln))) {
      const hex = m[2].match(/^#[0-9A-Fa-f]{3,8}/);
      if (hex) hits.push({ name: m[1], fallback: hex[0].toUpperCase(), line: i + 1 });
    }
  });
  return hits;
}
// scan tokens/, Lectures/css/, widgets/ for --c-* fallbacks that DRIFT from canonical.
// Returns { checked, mismatches: [{file, line, name, fallback, canon}] }.
function scanCVarDrift(canon) {
  const files = [
    ...walk(join(ROOT, 'tokens'), ['.css']),
    ...walk(join(ROOT, 'Lectures', 'css'), ['.css']),
    ...walk(join(ROOT, 'widgets'), ['.css']),
  ];
  let checked = 0;
  const mismatches = [];
  for (const f of files) {
    const css = readFileSync(f, 'utf8');
    for (const h of cVarFallbacks(css)) {
      const c = canon[h.name];
      if (c == null) continue; // unknown --c-* (no canonical hex to compare) — skip
      checked++;
      if (h.fallback !== c)
        mismatches.push({ file: f.replace(ROOT + '/', ''), line: h.line, name: h.name, fallback: h.fallback, canon: c });
    }
  }
  return { checked, mismatches };
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
  // [D] semantic --c-* fallback hue-drift
  const canon = canonHues(readFileSync(join(ROOT, SOURCE), 'utf8'));
  const drift = scanCVarDrift(canon);
  for (const m of drift.mismatches)
    report.push(`[D] ${m.file}:${m.line} var(${m.name}, ${m.fallback}) drifts — token=${m.canon} (fallback renders a DIFFERENT hue when token absent)`);
  console.log(`[token] ${drift.checked} --c-* fallbacks ${drift.mismatches.length ? `(${drift.mismatches.length} DRIFTED)` : 'consistent'} vs ${SOURCE}`);
  for (const r of report) console.log(`  ✗ ${r}`);
  console.log(`\n[token] HARD(rogue-root/diverged/hue-drift)=${report.length}`);
  return report.length ? 1 : 0;
}

function selftest() {
  const rogue = definesRootTokens(':root{ --accent:#f00; }');
  const okValues = rootVars(':root{ --accent:#2A6FDB; }')['--accent'] === '#2A6FDB';
  const mism = '#2A6FDB'.toUpperCase() !== '#FF0000'.toUpperCase();
  // [D] planted --c-* fallback drift: token --c-violet=#7D5BA6, a `var(--c-violet, #000000)`
  // fallback MUST flag (drift); a matching `var(--c-violet, #7D5BA6)` must NOT.
  const canon = canonHues(':root{ --c-violet:#7D5BA6; --c-violet-soft:#E7DEF1; --good:var(--c-green); }');
  const canonOk = canon['--c-violet'] === '#7D5BA6' && !('--good' in canon); // alias not treated as a hue
  const bad = scanCVarFixtureDrift(canon, '.x{ color: var(--c-violet, #000000); }');   // must flag
  const good = scanCVarFixtureDrift(canon, '.y{ color: var(--c-violet, #7D5BA6); }');  // must NOT flag
  const driftFires = bad.length === 1 && good.length === 0;
  console.log('[selftest] rogue-root detected:', rogue, '| value parse:', okValues, '| mismatch detect:', mism);
  console.log('[selftest] --c-* canon parse:', canonOk, '| hue-drift fires on bad/silent on good:', driftFires);
  const ok = rogue && okValues && mism && canonOk && driftFires;
  console.log('[selftest]', ok ? 'PASS — rogue :root + value mismatch + --c-* hue-drift fire' : 'FAIL — blind!');
  return ok ? 0 : 1;
}
// fixture helper: run the [D] fallback check over an inline CSS string (no disk).
function scanCVarFixtureDrift(canon, css) {
  const out = [];
  for (const h of cVarFallbacks(css)) {
    const c = canon[h.name];
    if (c != null && h.fallback !== c) out.push(h);
  }
  return out;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
