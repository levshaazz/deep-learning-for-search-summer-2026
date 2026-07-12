/* legibility-gate.mjs — AUDIT_SITE G22.
   LECTURE-HALL LEGIBILITY: no PROSE slide may be auto-fit-shrunk below a floor, so its text
   stays readable from the back of a hall.

   Why AUTO-FIT and not measured px: effective size = authored font × the auto-fit scale deck.js
   applies when content overflows 1080px. Measuring rendered px is unreliable here — text lives in
   bilingual <span lang> children inside containers, so "which element's font is the prose" is
   ambiguous (a 20px wrapper whose text renders in a 38px child reads at 38px). The ROBUST signal is
   the single auto-fit number deck.js already computed: base prose fonts are large (body 38, table
   cell 26, def-term 25.6, def-body 24), so a prose slide only becomes hall-illegible when it is
   SQUISHED — auto-fit < ~0.65 (which is also exactly deck.js/pre-flight's "dense" warning). This
   gate lifts that runtime whisper into an enforced floor, catching the same slides that spam the
   pre-flight overlay. The readability gate (G20) already guards the RAW authored font; this guards
   the shrink.

   Scope — PROSE slide types only. Figure/diagram types (viz/archflow/arch/title/divider/…) are
   exempt: their text is diagram labels, fit-scaled by design (G9/G13's domain, per CLAUDE.md).

   Baseline: known-debt slides live in legibility-baseline.json (like the facts-gate's grandfathered
   set). GREEN on that baseline, HARD-fails any NEW or WORSENED slide, nags to ratchet it down as
   debt is remediated. End state: empty baseline.

   Severity: HARD (new/worsened only). Self-test: a squished slide fires; a comfortable one is silent.

   Usage:  node _audit/legibility-gate.mjs                 (enforce vs baseline)
           node _audit/legibility-gate.mjs --deck 14-*     (measure one deck, for remediation)
           node _audit/legibility-gate.mjs --update-baseline
           node _audit/legibility-gate.mjs --selftest
*/
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serveDir, withBrowser, withPage, makeReporter } from './lib/gate-harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DECKDIR = join(ROOT, 'Lectures');
const BASELINE = join(HERE, 'legibility-baseline.json');
const VIEW = { width: 1920, height: 1080 };
// Pre-flight's "dense" threshold is 0.65 — the legibility TARGET remediation aims for. But auto-fit
// is derived from rendered content height, and headless-CI Chromium (Linux) lays out fonts a hair
// differently from a dev machine (macOS), so a slide sitting right at 0.65 locally can read ~0.62 in
// CI. To stay robust across environments, the gate's HARD line is TARGET minus a rendering MARGIN;
// it enforces "not GENUINELY squished", while the 0.65 target is held at authoring time by pre-flight
// + keeping this baseline empty. (Raising the base font or trimming a slide moves it well clear of both.)
const TARGET = 0.65;
const MARGIN = 0.05;
const FLOOR = +(TARGET - MARGIN).toFixed(2);   // 0.60 — hard gate line for a NEW slide
// Decks default to RU, and Russian runs ~15% longer than English, so many prose slides cluster just
// above the floor; with CI's font-rendering downshift (~0.045) they'd flip below it and spuriously
// re-fail. So the BASELINE grandfathers everything under TARGET (not just under FLOOR), and a
// baselined slide only re-fails on a real regression (a drop bigger than the CI-variance band).
const CAPTURE = TARGET;    // grandfather any slide below 0.65 (absorbs the near-floor RU cluster)
const WORSEN = 0.07;       // a baselined slide dropping >0.07 below its recorded fit re-fails (> CI jitter)

// Prose-bearing slide types. Everything else (viz/archflow/arch/title/divider/agenda/objectives/
// refs/quiz/timeline/art-hero/…) is a figure/chrome type and exempt (its text is fit-scaled diagram
// labels — G9/G13's domain). We enforce the ROBUST signal: the auto-fit scale deck.js applied.
const PROSE_TYPES = ['two-col', 'table', 'definition', 'formula', 'default', 'misconception', 'theorem', 'quote', 'derivation', 'code', 'sequence', 'funnel'];

// In-page: auto-fit per prose slide. Returns [{n,type,label,fit}]. Robust — one number deck.js
// computed, no font-attribution guesswork across bilingual span structure.
const MEASURE = (PROSE_TYPES) => {
  const prose = new Set(PROSE_TYPES);
  const out = [];
  document.querySelectorAll('.slide').forEach((s, i) => {
    const type = s.dataset.type || '';
    if (!prose.has(type)) return;
    const fit = parseFloat(s.dataset.autoFit || '1') || 1;
    out.push({ n: i + 1, type, label: s.dataset.screenLabel || '', fit: +fit.toFixed(3) });
  });
  return out;
};

async function measureAll(only = null) {
  const decks = readdirSync(DECKDIR).filter((f) => /^\d\d-.*\.html$/.test(f)).sort()
    .filter((d) => !only || d.startsWith(only.replace(/\*$/, '')));
  const server = await serveDir(DECKDIR);
  const byDeck = {};
  try {
    await withBrowser(async (browser) => {
      for (const deck of decks) {
        await withPage(browser, { viewport: VIEW }, async (page) => {
          await page.goto(server.href(deck), { waitUntil: 'networkidle' });
          await page.waitForTimeout(2600); // let deck.js auto-fit + KaTeX + fonts settle
          byDeck[deck.replace('.html', '')] = await page.evaluate(MEASURE, PROSE_TYPES);
        });
      }
    });
  } finally { await server.close(); }
  return byDeck;
}

const loadBaseline = () => (existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {});
/* Key the grandfathered debt by the slide's SCREEN LABEL, not by its ordinal position.
   It used to be `${deck}#${n}`, and that made the baseline punish the wrong thing: inserting one slide
   into a deck renumbers every slide after it, so a dozen pieces of long-grandfathered debt suddenly
   presented as NEW and the gate went red on a deck the change never touched. Screen labels are stable
   under insertion by construction — that is exactly why an inserted slide is labelled `11a` and not
   `12`. Debt should be identified by WHICH slide it is, never by where the slide happens to sit. */
const key = (deck, label) => `${deck}#${label}`;

async function run() {
  const R = makeReporter('legibility');
  const baseline = loadBaseline();
  const byDeck = await measureAll();
  let prose = 0, baselined = 0, ratchet = [];
  for (const [deck, slides] of Object.entries(byDeck)) {
    for (const s of slides) {
      prose++;
      if (s.fit >= FLOOR) {
        if (baseline[key(deck, s.label)] != null) ratchet.push(`${deck} s${s.n} now fit ${s.fit} — remove from baseline`);
        continue;
      }
      const base = baseline[key(deck, s.label)];
      if (base == null) {
        R.err(`${deck} · slide ${s.n} "${s.label}" [${s.type}] — auto-fit ${s.fit} < ${FLOOR} (content squished → too small in a hall) — NEW, trim/split`);
      } else if (s.fit < base - WORSEN) {
        R.err(`${deck} · slide ${s.n} "${s.label}" — auto-fit ${s.fit}, WORSE than baselined ${base}`);
      } else { baselined++; }
    }
  }
  console.log(`\n[legibility] measured ${prose} prose slides across ${Object.keys(byDeck).length} decks; min auto-fit floor ${FLOOR}`);
  console.log(`[legibility] baselined debt still sub-floor: ${baselined}` + (ratchet.length ? ` · ${ratchet.length} baselined slide(s) now PASS — ratchet the baseline:` : ''));
  ratchet.slice(0, 40).forEach((r) => console.log(`   ↑ ${r}`));
  console.log(`[legibility] HARD(new/worsened sub-floor)=${R.errors}`);
  return R.errors ? 1 : 0;
}

async function updateBaseline() {
  const byDeck = await measureAll();
  const base = {};
  for (const [deck, slides] of Object.entries(byDeck))
    for (const s of slides) if (s.fit < CAPTURE) base[key(deck, s.label)] = s.fit;
  writeFileSync(BASELINE, JSON.stringify(base, null, 2) + '\n');
  console.log(`[legibility] wrote baseline: ${Object.keys(base).length} sub-floor slides → ${BASELINE.replace(ROOT + '/', '')}`);
  return 0;
}

async function reportDeck(only) {
  const byDeck = await measureAll(only);
  for (const [deck, slides] of Object.entries(byDeck)) {
    const bad = slides.filter((s) => s.fit < FLOOR).sort((a, b) => a.fit - b.fit);
    console.log(`\n${deck}: ${bad.length} slide(s) < ${FLOOR} auto-fit`);
    bad.forEach((s) => console.log(`   s${s.n} fit=${s.fit} [${s.type}] ${s.label}`));
  }
  return 0;
}

async function selftest() {
  // Prose slides at auto-fit 0.9 (readable) and 0.6 (squished → fails); a viz slide at 0.5 is exempt.
  const html = `<!doctype html><html><head></head><body>
    <section class="slide" data-type="two-col" data-auto-fit="0.9" data-screen-label="ok"><p>fits comfortably</p></section>
    <section class="slide" data-type="two-col" data-auto-fit="0.5" data-screen-label="squished"><p>squished way down</p></section>
    <section class="slide" data-type="viz" data-auto-fit="0.4" data-screen-label="figure exempt"><p>diagram label</p></section>
  </body></html>`;
  const dir = join(ROOT, '_internal', '_legibility_selftest');
  (await import('node:fs')).mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'fixture.html'), html);
  const server = await serveDir(dir);
  let res;
  try {
    await withBrowser(async (browser) => {
      await withPage(browser, { viewport: VIEW }, async (page) => {
        await page.goto(server.href('fixture.html'), { waitUntil: 'networkidle' });
        res = await page.evaluate(MEASURE, PROSE_TYPES);
      });
    });
  } finally { await server.close(); }
  const ok = res.find((s) => s.label === 'ok');
  const squished = res.find((s) => s.label === 'squished');
  const exempt = !res.find((s) => s.label === 'figure exempt'); // viz excluded entirely
  const pass = ok && ok.fit >= FLOOR && squished && squished.fit < FLOOR && exempt;
  console.log(`[selftest] ok=fit ${ok?.fit}(≥${FLOOR}) squished=fit ${squished?.fit}(<${FLOOR}) viz-exempt=${exempt}`);
  console.log('[selftest]', pass ? 'PASS — squished prose fires, comfortable silent, figure types exempt' : 'FAIL');
  return pass ? 0 : 1;
}

const argv = process.argv.slice(2);
const di = argv.indexOf('--deck');
process.exit(await (
  argv.includes('--selftest') ? selftest()
  : argv.includes('--update-baseline') ? updateBaseline()
  : di >= 0 ? reportDeck(argv[di + 1])
  : run()));
