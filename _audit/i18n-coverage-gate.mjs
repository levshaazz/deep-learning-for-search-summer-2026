/* i18n-coverage-gate.mjs — AUDIT_SITE G3.
   Reports translation completeness per surface per language across the trilingual surfaces (chrome,
   course data, Book chapters, widget captions). An i18n node = a plain object with a string `en`.
     - EN is canonical: any node missing `en` is a HARD failure (a hole in the source of truth).
     - RU / TT are translation layers: reported as translated/total %, WARN (never block — the
       per-key fallback tt→ru→en keeps the site whole). These drive the public coverage badge.
   Self-test: a node missing EN must HARD-fire; a partial RU must report < 100%.

   Usage:  node _audit/i18n-coverage-gate.mjs   |   node _audit/i18n-coverage-gate.mjs --selftest
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = ['en', 'ru', 'tt'];

// Count i18n nodes in a value tree. A node = object with a string `en`. Returns {total, en, ru, tt, missingEn:[]}
function tally(value, acc, path = '') {
  if (value == null) return acc;
  if (Array.isArray(value)) { value.forEach((v, i) => tally(v, acc, `${path}[${i}]`)); return acc; }
  if (typeof value === 'object') {
    // an i18n node = a plain object carrying at least one of en/ru/tt as a string
    const isNode = LANGS.some((l) => typeof value[l] === 'string');
    if (isNode) {
      acc.total++;
      if (typeof value.en === 'string' && value.en !== '') acc.en++; else acc.missingEn.push(path || '(root)');
      if (typeof value.ru === 'string' && value.ru !== '') acc.ru++;
      if (typeof value.tt === 'string' && value.tt !== '') acc.tt++;
      return acc; // don't recurse into the i18n leaf
    }
    for (const k of Object.keys(value)) if (!k.startsWith('_')) tally(value[k], acc, path ? `${path}.${k}` : k);
  }
  return acc;
}
const fresh = () => ({ total: 0, en: 0, ru: 0, tt: 0, missingEn: [] });

async function gatherSurfaces() {
  const S = [];
  // chrome
  const ui = (await import(pathToFileURL(join(ROOT, 'src/i18n/ui.js')).href)).ui;
  S.push(['chrome (ui.js)', ui]);
  // course data
  S.push(['course.json', JSON.parse(readFileSync(join(ROOT, 'data/course.json'), 'utf8'))]);
  // Book chapters
  for (const f of readdirSync(join(ROOT, 'content/book')).filter((f) => f.endsWith('.js')).sort())
    S.push([`book/${f}`, (await import(pathToFileURL(join(ROOT, 'content/book', f)).href)).default]);
  // widget captions
  const wdir = join(ROOT, 'widgets');
  for (const d of readdirSync(wdir, { withFileTypes: true }).filter((d) => d.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const f = join(wdir, d.name, 'i18n.json');
    if (existsSync(f)) S.push([`widget/${d.name}`, JSON.parse(readFileSync(f, 'utf8'))]);
  }
  return S;
}

async function run() {
  const surfaces = await gatherSurfaces();
  const grand = fresh();
  let hardMsgs = [];
  console.log(`[i18n-coverage] per surface — en (HARD if <100%) · ru · tt (WARN/badge)`);
  for (const [name, val] of surfaces) {
    const a = tally(val, fresh());
    for (const k of ['total', 'en', 'ru', 'tt']) grand[k] += a[k];
    grand.missingEn.push(...a.missingEn.map((p) => `${name}:${p}`));
    const pct = (n) => a.total ? Math.round((100 * n) / a.total) : 100;
    const flag = a.en < a.total ? ' ✗EN-HOLE' : '';
    console.log(`  ${name.padEnd(22)} en ${String(pct(a.en)).padStart(3)}% · ru ${String(pct(a.ru)).padStart(3)}% · tt ${String(pct(a.tt)).padStart(3)}%  (${a.total} strings)${flag}`);
  }
  const pct = (n) => grand.total ? Math.round((100 * n) / grand.total) : 100;
  if (grand.missingEn.length) hardMsgs = grand.missingEn.slice(0, 8);
  console.log(`\n[i18n-coverage] TOTAL ${grand.total} strings — en ${pct(grand.en)}% · ru ${pct(grand.ru)}% · tt ${pct(grand.tt)}%`);
  for (const m of hardMsgs) console.log(`  ✗ EN missing: ${m}`);
  console.log(`[i18n-coverage] HARD(en-holes)=${grand.missingEn.length}  WARN(ru ${100 - pct(grand.ru)}% / tt ${100 - pct(grand.tt)}% untranslated)`);
  return grand.missingEn.length ? 1 : 0;
}

function selftest() {
  const a = tally({ ok: { en: 'x', ru: 'у' }, hole: { ru: 'у' }, partial: { en: 'y' } }, fresh());
  const okHole = a.missingEn.length === 1;       // {hole} has ru but no en → EN hole
  const okPartial = a.ru === 2 && a.total === 3; // ok+hole have ru; three nodes total
  console.log('[selftest] nodes:', a.total, 'en:', a.en, 'ru:', a.ru, 'missingEn:', a.missingEn);
  const ok = okHole && okPartial;
  console.log('[selftest]', ok ? 'PASS — EN hole + partial RU detected' : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(await (process.argv.includes('--selftest') ? Promise.resolve(selftest()) : run()));
