/* beat-coverage-gate.mjs — AUDIT_SITE G7.
   The Book and the narrative beat-sheet must tell the SAME story, in the SAME order. The beat sheet
   (narrative/L<n>.md) declares the canonical beat list via a machine-readable header:
       <!-- beats: id1, id2, ... -->
       <!-- book: 02 -->
   This gate asserts, in order:
     [A] content/book/<id>.js beats  ==  the beat-sheet's declared beats   (Book source ↔ contract)
     [B] (if built) the rendered Book HTML has a <section id="beat"> for each, in order
   Catches the "Book drifted from the beat sheet" class (added/removed/reordered beat). Severity HARD.

   Usage:  node _audit/beat-coverage-gate.mjs            (run the gate)
           node _audit/beat-coverage-gate.mjs --selftest  (known-bad fixture must flag)
*/
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NDIR = join(ROOT, 'narrative');
const CDIR = join(ROOT, 'content/book');
const LANG = 'en';

function parseSheet(md) {
  const beats = md.match(/<!--\s*beats:\s*([^>]+?)\s*-->/i);
  const book = md.match(/<!--\s*book:\s*([0-9A-Za-z_-]+)\s*-->/i);
  return {
    beats: beats ? beats[1].split(',').map((s) => s.trim()).filter(Boolean) : null,
    book: book ? book[1].trim() : null,
  };
}

// ordered compare → human diff
function diff(expected, actual) {
  const issues = [];
  const eset = new Set(expected), aset = new Set(actual);
  for (const id of expected) if (!aset.has(id)) issues.push(`MISSING "${id}"`);
  for (const id of actual) if (!eset.has(id)) issues.push(`EXTRA "${id}"`);
  if (!issues.length) {
    for (let i = 0; i < expected.length; i++) if (expected[i] !== actual[i]) { issues.push(`ORDER: pos ${i} expected "${expected[i]}", got "${actual[i]}"`); break; }
  }
  return issues;
}

// section ids in document order, restricted to the known beat set
function builtBeatOrder(html, known) {
  const ids = [];
  const re = /<section\b[^>]*\bid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) if (known.has(m[1])) ids.push(m[1]);
  return ids;
}

async function run() {
  const sheets = readdirSync(NDIR).filter((f) => /^L\d+\.md$/.test(f));
  const report = [];
  let inspected = 0;

  for (const f of sheets) {
    const { beats: sheetBeats, book } = parseSheet(readFileSync(join(NDIR, f), 'utf8'));
    if (!sheetBeats || !book) continue;             // only L<n>.md that opted in
    const n = parseInt(book, 10);                   // "00"->0, "01"->1 (content files are l0.js, l1.js…)
    const cfile = join(CDIR, `l${n}.js`);
    if (!existsSync(cfile)) { report.push(`${f}: book ${book} declared but content/book/l${n}.js missing`); continue; }
    inspected++;
    const ch = (await import(pathToFileURL(cfile).href)).default;
    const contentBeats = ch.beats.map((b) => b.id);

    // [A] content ↔ beat sheet
    const dA = diff(sheetBeats, contentBeats);
    for (const d of dA) report.push(`${f} ↔ content/book: ${d}`);

    // [B] built HTML ↔ beat sheet
    const builtPath = join(ROOT, 'docs', LANG, 'book', book, 'index.html');
    if (existsSync(builtPath)) {
      const order = builtBeatOrder(readFileSync(builtPath, 'utf8'), new Set(sheetBeats));
      for (const d of diff(sheetBeats, order)) report.push(`${f} ↔ built Book(${LANG}): ${d}`);
    } else {
      report.push(`(note) ${f}: docs/${LANG}/book/${book} not built — [B] skipped (run npm run build)`);
    }
  }

  const hard = report.filter((r) => !r.startsWith('(note)'));
  console.log(`[beat-coverage] inspected ${inspected} chapters (beat-sheet ↔ content ↔ built Book)`);
  for (const r of report) console.log(`  ${r.startsWith('(note)') ? '·' : '✗'} ${r}`);
  console.log(`\n[beat-coverage] HARD(missing/extra/reorder)=${hard.length}`);
  return hard.length ? 1 : 0;
}

function selftest() {
  // a Book that dropped a beat + reordered must flag against the sheet.
  const sheet = ['hook', 'problem', 'climb', 'payoff'];
  const drifted = ['hook', 'climb', 'problem'];          // dropped payoff, swapped problem/climb
  const issues = diff(sheet, drifted);
  console.log('[selftest]', issues.join(' | ') || 'NO FLAG');
  const ok = issues.some((i) => i.includes('MISSING')) && issues.length > 0;
  console.log('[selftest]', ok ? 'PASS — drift fires' : 'FAIL — blind!');
  return ok ? 0 : 1;
}

process.exit(await (process.argv.includes('--selftest') ? Promise.resolve(selftest()) : run()));
