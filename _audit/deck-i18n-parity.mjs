/* deck-i18n-parity.mjs — AUDIT_SITE G23.
   DECK RU-PARITY. Decks are meant to be bilingual (H1/H2): every visible prose run wrapped as
   `<span lang="ru">…</span><span lang="en">…</span>`, and the toggle hides the other language.
   BUT untagged prose (no lang attribute) shows in BOTH modes, so any English left untagged LEAKS
   into RU mode — and NO existing gate catches it: i18n-coverage-gate (G3) scans course.json + Book
   + widget JSON, never the deck HTML fragments, and RU is WARN-only there.

   This gate scans the sharded deck fragments and counts, per deck, the PROSE slides that carry no
   Russian at all ("English-only slides") — the exact failure the audit found (L1–L4 + L13 render
   English in RU mode). Grandfathered baseline like the facts-gate coverage-guard: GREEN on the
   recorded debt, HARD-fails only a REGRESSION (a bilingual deck gaining a new English-only slide),
   and ratchets down as legacy decks get translated. End state: empty/zero baseline.

   Pure-static (reads parts/*.html). Speaker notes (<aside class="slide-notes">), math, numbers and
   figure/widget internals are excluded — only body prose a reader reads. Severity: HARD (regression
   only). Self-test: a newly-untagged prose slide over baseline must fire; a bilingual one must not.

   Usage:  node _audit/deck-i18n-parity.mjs            (enforce vs baseline)
           node _audit/deck-i18n-parity.mjs --report   (full per-deck coverage table)
           node _audit/deck-i18n-parity.mjs --update-baseline
           node _audit/deck-i18n-parity.mjs --selftest
*/
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const BASELINE = join(ROOT, '_audit', 'deck-i18n-baseline.json');
const PROSE_LETTERS = 40;   // a slide counts as "prose" once its visible copy exceeds this many letters

// Visible letter-count of a fragment's body prose, and whether it carries any Russian.
// Strips: speaker notes, tags, KaTeX/TeX math, HTML entities — leaving reader-facing text.
function analyse(html) {
  let s = html
    .replace(/<aside class="slide-notes">[\s\S]*?<\/aside>/g, ' ')  // speaker notes: EN-only is fine
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')                               // display math
    .replace(/\\\([\s\S]*?\\\)/g, ' ').replace(/\\\[[\s\S]*?\\\]/g, ' '); // inline/display TeX
  const hasRu = /lang="ru"/.test(s);
  const enSpans = (s.match(/lang="en"/g) || []).length;
  const ruSpans = (s.match(/lang="ru"/g) || []).length;
  const text = s.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ');
  const letters = (text.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;
  return { letters, hasRu, enOnly: Math.max(0, enSpans - ruSpans) };
}

function isSlide(html) { return /<section class="slide"/.test(html); }

// Per-deck: englishOnly = prose slides with NO Russian at all; enOnlySpans = lang="en" without a ru pair.
function scanDeck(dir) {
  let englishOnly = 0, proseSlides = 0, enOnlySpans = 0;
  for (const f of readdirSync(join(dir, 'parts')).filter((n) => extname(n) === '.html' && !/^(00-head|zz-tail)/.test(n))) {
    const html = readFileSync(join(dir, 'parts', f), 'utf8');
    if (!isSlide(html)) continue;
    const a = analyse(html);
    enOnlySpans += a.enOnly;
    if (a.letters >= PROSE_LETTERS) {
      proseSlides++;
      if (!a.hasRu) englishOnly++;
    }
  }
  return { englishOnly, proseSlides, enOnlySpans };
}

function scanAll() {
  const decksDir = join(ROOT, 'Lectures');
  const out = {};
  for (const d of readdirSync(decksDir).filter((n) => /^\d\d-/.test(n))) {
    const dir = join(decksDir, d);
    if (existsSync(join(dir, 'parts'))) out[d] = scanDeck(dir);
  }
  return out;
}

const loadBaseline = () => (existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {});

function run() {
  const base = loadBaseline();
  const scan = scanAll();
  const report = [];
  let totalEnglishOnly = 0;
  for (const [deck, m] of Object.entries(scan)) {
    totalEnglishOnly += m.englishOnly;
    const b = base[deck] != null ? base[deck] : 0;
    if (m.englishOnly > b) {
      report.push(`${deck}: ${m.englishOnly} English-only prose slides (baseline ${b}) — ${m.englishOnly - b} NEW untagged; wrap prose in <span lang="ru">…</span><span lang="en">…</span>`);
    }
  }
  console.log(`[deck-i18n] scanned ${Object.keys(scan).length} decks; ${totalEnglishOnly} English-only prose slides total (debt tracked in baseline)`);
  for (const r of report) console.log(`  ✗ ${r}`);
  console.log(`\n[deck-i18n] HARD(new English-only vs baseline)=${report.length}`);
  return report.length ? 1 : 0;
}

function reportTable() {
  const base = loadBaseline();
  const scan = scanAll();
  console.log('deck                                     prose  EN-only  (baseline)  en-only-spans');
  for (const [deck, m] of Object.entries(scan)) {
    const cov = m.proseSlides ? Math.round(100 * (1 - m.englishOnly / m.proseSlides)) : 100;
    console.log(`  ${deck.padEnd(38)} ${String(m.proseSlides).padStart(4)}  ${String(m.englishOnly).padStart(6)}  (${String(base[deck] ?? 0).padStart(3)})   ${String(m.enOnlySpans).padStart(4)}   RU-cov ${cov}%`);
  }
  return 0;
}

function updateBaseline() {
  const scan = scanAll();
  const base = {};
  for (const [deck, m] of Object.entries(scan)) if (m.englishOnly > 0) base[deck] = m.englishOnly;
  writeFileSync(BASELINE, JSON.stringify(base, null, 2) + '\n');
  console.log(`[deck-i18n] wrote baseline: ${Object.keys(base).length} decks with English-only debt → ${BASELINE.replace(ROOT + '/', '')}`);
  return 0;
}

function selftest() {
  const bilingual = '<section class="slide"><h2><span lang="ru">Заголовок который достаточно длинный чтобы считаться прозой</span><span lang="en">A title long enough to count as prose here</span></h2></section>';
  const englishOnly = '<section class="slide"><h2>A title that is long enough to count as prose but has no russian</h2></section>';
  const shortLabel = '<section class="slide"><h2>OK</h2></section>';
  const a = analyse(bilingual), b = analyse(englishOnly), c = analyse(shortLabel);
  const cases = [
    ['bilingual has ru', a.hasRu === true && a.letters >= PROSE_LETTERS],
    ['english-only lacks ru', b.hasRu === false && b.letters >= PROSE_LETTERS],
    ['short label below prose threshold', c.letters < PROSE_LETTERS],
    ['math stripped', analyse('<section class="slide"><p>\\(x^2 + y^2\\) $$\\sum_i a_i$$</p></section>').letters < PROSE_LETTERS],
  ];
  const fails = cases.filter(([, ok]) => !ok).map(([n]) => n);
  fails.forEach((n) => console.log(`  ✗ ${n}`));
  console.log(`[selftest] ${fails.length ? 'FAIL' : 'PASS'} — english-only detected, bilingual clean, short labels & math excluded (${cases.length} cases)`);
  return fails.length ? 1 : 0;
}

const argv = process.argv.slice(2);
process.exit(
  argv.includes('--selftest') ? selftest()
  : argv.includes('--update-baseline') ? updateBaseline()
  : argv.includes('--report') ? reportTable()
  : run());
