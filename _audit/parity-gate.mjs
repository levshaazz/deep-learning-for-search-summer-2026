/*
 * parity-gate.mjs — the LECTURE-PARITY gate (G18). Pure text, no browser.
 *
 * A deck passes the brand/facts/viz gates while being SHALLOW (too few slides),
 * a WALL OF TEXT (huge median chars/slide), or missing its scaffolding. This gate
 * encodes the depth bar — calibrated from the reference lectures L10-L12 — so a
 * deep-dive that ships at 13 dense slides HARD-fails instead of passing.
 *
 * Floors (the current repo clears all of them; raise deliberately, never weaken):
 *   - SLIDES   >= 45      (full lecture / deep-dive)        — old L13 had 13 → fails
 *   - median visible chars/slide <= 1150 (no walls of text) — old L13 ~1561 → fails
 *   - has an OBJECTIVES slide AND a REFERENCES slide        — the scaffolding floor
 * Per-deck overrides (documented why) live in OVERRIDES — e.g. the intro is short by design.
 *
 *   node _audit/parity-gate.mjs            # audit Lectures/*.html (needs a build first)
 *   node _audit/parity-gate.mjs --selftest # known-bad fixtures must fire
 *
 * Exit: non-zero whenever HARD > 0.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECKDIR = join(ROOT, 'Lectures');

const SLIDE_FLOOR = 45;     // a deep-dive must be the deepest deck, not the shallowest
const MEDIAN_CEIL = 1150;   // wall-of-text ceiling (single-language; densest real lecture sits well under)
const MAX_PARA = 900;       // a single <p> over this many one-language chars is a wall the median hides
// documented exceptions (deck filename → { slides?, why }); the intro is short by design.
const OVERRIDES = {
  '00-introduction.html': { slides: 18, why: 'course intro — short by design (briefing, not a topic lecture)' },
};

const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

// Decks are bilingual: <span lang="ru">…</span><span lang="en">…</span>. Count ONE language so the
// measure reflects what a reader sees, not RU+EN doubled — else translating a deck spuriously
// doubles its char counts. Strip the RU spans (keep EN + untagged); speaker notes are excluded too.
/* …and the RU twin may be a BLOCK, not only a span. Stripping `<span lang="ru">` alone left four
   decks measured with RU+EN counted together — 08 552→461, 09 975→913, 18 971→953, 19 865→846.
   No verdict changed (all four sit far under the ceiling), which is why it survived: a measure can
   be wrong for a long time while the threshold it feeds stays right. */
const stripLangDupes = (html) => html
  .replace(/<aside class="slide-notes"[\s\S]*?<\/aside>/g, ' ')
  .replace(/<(span|p|li|div|h2|h3|td|th)\s+lang="ru"[^>]*>[\s\S]*?<\/\1>/g, ' ');
const textLen = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

function visibleChars(slideHtml) { return textLen(stripLangDupes(slideHtml)); }

// The longest single <p> on a slide, one language — a wall the median smooths over.
function maxParaChars(slideHtml) {
  const paras = stripLangDupes(slideHtml).match(/<p\b[\s\S]*?<\/p>/g) || [];
  return paras.reduce((mx, p) => Math.max(mx, textLen(p)), 0);
}

// pure core: given (filename, html) → HARD findings. Testable offline with a fixture string.
export function auditDeck(file, html) {
  const out = [];
  const slides = html.match(/<section class="slide"[\s\S]*?<\/section>/g) || [];
  const labels = (html.match(/data-screen-label="([^"]+)"/g) || []).join(' ').toLowerCase();
  const floor = OVERRIDES[file]?.slides ?? SLIDE_FLOOR;
  if (slides.length < floor)
    out.push(`SHALLOW: ${slides.length} slides < floor ${floor}` + (OVERRIDES[file] ? '' : ' — a lecture must match L10-L12 depth'));
  const med = median(slides.map(visibleChars));
  if (med > MEDIAN_CEIL)
    out.push(`WALL OF TEXT: median ${med} visible chars/slide > ${MEDIAN_CEIL} — break ideas across more slides`);
  // A single fat paragraph on an otherwise-sparse slide hides from the median — catch it directly.
  let worst = 0, worstLabel = '';
  slides.forEach((s) => { const n = maxParaChars(s); if (n > worst) { worst = n; worstLabel = (s.match(/data-screen-label="([^"]+)"/) || [])[1] || ''; } });
  if (worst > MAX_PARA)
    out.push(`WALL PARAGRAPH: "${worstLabel}" has a single <p> of ${worst} one-language chars > ${MAX_PARA} — split into cards/lists`);
  if (!/objective/.test(labels)) out.push('NO OBJECTIVES slide — every lecture states what you will be able to do');
  if (!/reference|refs/.test(labels)) out.push('NO REFERENCES slide — every lecture cites its sources');
  return out;
}

function run() {
  const decks = readdirSync(DECKDIR).filter((f) => /^\d.*\.html$/.test(f)).sort();
  /* An exception keyed by a NAME must prove its name still exists. Three defects in this repo came
     from exactly this class: `is_l17 = "/l17/"` in check_style kept guarding after the chapter it
     named moved, ADJ_DEMO_SCOPE pointed at a renamed deck, slide-viz carried stale slugs. A stale
     key here fails safe — the override stops applying and the gate goes red — but red for a reason
     nobody can read is nearly as expensive as green for the wrong one. */
  const orphan = Object.keys(OVERRIDES).filter((k) => !decks.includes(k));
  if (orphan.length) {
    console.log(`[parity] ✗ OVERRIDES names ${orphan.length} deck(s) that do not exist: ${orphan.join(', ')}`);
    console.log('    An override outlived the file it excuses — point it at the current name or drop it.');
    process.exit(1);
  }
  let hard = 0;
  console.log(`[parity] floors: slides>=${SLIDE_FLOOR}, median<=${MEDIAN_CEIL} chars, objectives+references present`);
  for (const f of decks) {
    const findings = auditDeck(f, readFileSync(join(DECKDIR, f), 'utf8'));
    if (findings.length) { hard += findings.length; findings.forEach((m) => console.log(`  ✗ [HARD] ${f}: ${m}`)); }
  }
  console.log(`\n[parity] audited ${decks.length} deck(s)`);
  console.log(`[parity] HARD(shallow/wall-of-text/no-scaffold)=${hard}` + (hard ? '' : '  — every deck clears the depth bar ✓'));
  return hard ? 1 : 0;
}

function selftest() {
  const shallow = `<section class="slide" data-screen-label="01 x"><h2>x</h2></section>`.repeat(10); // 10 slides, no obj/refs
  const dense = Array.from({ length: 50 }, (_, i) =>
    `<section class="slide" data-screen-label="${i} objectives references"><p>${'word '.repeat(300)}</p></section>`).join('');
  const good = Array.from({ length: 50 }, (_, i) =>
    `<section class="slide" data-screen-label="${i} ${i === 0 ? 'objectives' : i === 49 ? 'references' : 'x'}"><p>short</p></section>`).join('');
  const a = auditDeck('zz-shallow.html', shallow);   // shallow + no scaffold → must fire
  const b = auditDeck('zz-dense.html', dense);       // wall of text → must fire
  const c = auditDeck('zz-good.html', good);         // 50 slides, obj+refs, short → clean
  const ok = a.length >= 1 && b.some((m) => /WALL/.test(m)) && c.length === 0;
  console.log(`[selftest] shallow fires=${a.length >= 1}  wall-of-text fires=${b.some((m) => /WALL/.test(m))}  good clean=${c.length === 0}`);
  console.log('[selftest]', ok ? 'PASS — parity detector fires on shallow + wall-of-text, silent on a good deck'
                               : 'FAIL — blind to a shallow/dense deck!');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
