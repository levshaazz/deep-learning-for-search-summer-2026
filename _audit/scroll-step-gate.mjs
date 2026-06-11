/* scroll-step-gate.mjs — AUDIT_SITE G6.
   Every Book scroll-step must map to a REAL widget step. Checks three things:
     [A] each widget manifest is self-consistent (steps cover 0..maxStep contiguously);
     [B] every scrolly beat in a chapter references a widget that exists;
     [C] (if docs/ built) every rendered .scroll-step has data-step in [0,maxStep], and every
         widget step 0..maxStep is reachable (present) — no dead steps, no out-of-range markers.
   Severity: HARD. Self-test (§2.4): a planted out-of-range step + missing widget must fire.

   Usage:  node _audit/scroll-step-gate.mjs            (run the gate)
           node _audit/scroll-step-gate.mjs --selftest  (known-bad fixtures must flag)
*/
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WDIR = join(ROOT, 'widgets');
const CDIR = join(ROOT, 'content/book');
const LANG = 'en'; // built-HTML check uses the canonical locale

function loadManifests() {
  const m = {};
  for (const id of readdirSync(WDIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
    const f = join(WDIR, id, 'manifest.json');
    if (existsSync(f)) m[id] = JSON.parse(readFileSync(f, 'utf8'));
  }
  return m;
}
async function loadChapters() {
  const out = [];
  for (const f of readdirSync(CDIR).filter((f) => f.endsWith('.js')).sort()) {
    const mod = await import(pathToFileURL(join(CDIR, f)).href);
    out.push({ file: f, ...mod.default });
  }
  return out;
}

// [A] manifest self-consistency
function checkManifest(id, man) {
  const issues = [];
  const steps = (man.steps || []).map((s) => s.step);
  const want = Array.from({ length: man.maxStep + 1 }, (_, i) => i);
  if (steps.length !== want.length) issues.push(`steps[] has ${steps.length}, expected maxStep+1=${want.length}`);
  for (const w of want) if (!steps.includes(w)) issues.push(`missing step ${w}`);
  for (const s of steps) if (s < 0 || s > man.maxStep) issues.push(`step ${s} out of [0,${man.maxStep}]`);
  return issues.map((m) => `manifest(${id}): ${m}`);
}

// [C] built-HTML scroll-steps for one chapter beat
function checkBuiltBeat(html, beat, maxStep) {
  const issues = [];
  const re = new RegExp(`data-beat="${beat}"[^>]*data-step="(\\d+)"`, 'g');
  const steps = [];
  let m;
  while ((m = re.exec(html))) steps.push(parseInt(m[1], 10));
  if (!steps.length) return [`built: beat "${beat}" has no scroll-steps`];
  for (const s of steps) if (s < 0 || s > maxStep) issues.push(`built: beat "${beat}" step ${s} out of [0,${maxStep}]`);
  for (let s = 0; s <= maxStep; s++) if (!steps.includes(s)) issues.push(`built: beat "${beat}" step ${s} unreachable (no marker)`);
  return issues;
}

async function run() {
  const manifests = loadManifests();
  const chapters = await loadChapters();
  const report = [];
  let inspected = 0;

  for (const id in manifests) report.push(...checkManifest(id, manifests[id]));

  for (const ch of chapters) {
    const scrolly = ch.beats.filter((b) => b.kind === 'scrolly');
    const builtPath = join(ROOT, 'docs', LANG, 'book', ch.id, 'index.html');
    const html = existsSync(builtPath) ? readFileSync(builtPath, 'utf8') : null;
    for (const b of scrolly) {
      inspected++;
      const man = manifests[b.widget];
      if (!man) { report.push(`chapter ${ch.id}: beat "${b.id}" → unknown widget "${b.widget}"`); continue; }
      if (html) report.push(...checkBuiltBeat(html, b.id, man.maxStep));
    }
    if (!html) report.push(`(note) chapter ${ch.id}: docs/${LANG}/book/${ch.id} not built — [C] skipped (run npm run build)`);
  }

  const hard = report.filter((r) => !r.startsWith('(note)'));
  console.log(`[scroll-step] inspected ${inspected} scrolly beats across ${chapters.length} chapters, ${Object.keys(manifests).length} widgets`);
  for (const r of report) console.log(`  ${r.startsWith('(note)') ? '·' : '✗'} ${r}`);
  console.log(`\n[scroll-step] HARD(bad-step/unknown-widget/dead-step)=${hard.length}`);
  return hard.length ? 1 : 0;
}

function selftest() {
  let ok = true;
  // bad manifest: maxStep 4 but a step=9
  const badMan = checkManifest('fix', { maxStep: 4, steps: [{ step: 0 }, { step: 9 }] });
  console.log('[selftest:manifest]', badMan[0] || 'NO FLAG');
  ok = ok && badMan.length > 0;
  // out-of-range built marker
  const badHtml = '<div data-beat="climb-x" data-step="9"></div><div data-beat="climb-x" data-step="0"></div>';
  const badBuilt = checkBuiltBeat(badHtml, 'climb-x', 4);
  console.log('[selftest:built]', badBuilt[0] || 'NO FLAG');
  ok = ok && badBuilt.some((m) => m.includes('out of'));
  console.log('[selftest]', ok ? 'PASS — bad step + manifest both fire' : 'FAIL — a check is blind!');
  return ok ? 0 : 1;
}

process.exit(await (process.argv.includes('--selftest') ? Promise.resolve(selftest()) : run()));
