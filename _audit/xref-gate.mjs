/* xref-gate.mjs — AUDIT_SITE G25.
   LECTURE CROSS-REFERENCES. The Aug-2026 renumbering left three kinds of silent damage that
   every other gate was blind to, all shipped green: prose pointing at the WRONG lecture
   ("Generate joins at L10" in seven decks while course.json says L15), the SAME element naming
   DIFFERENT lectures per language (RU said L4 where EN said L5; the Tatar Book layer was never
   renumbered at all), and non-references rewritten AS references (the migration turned model
   layer indices into lecture pointers: "XLNet L16" for layer 11). ~45 sites were fixed by hand
   in phase 1А of the fix plan; this gate is the ratchet that keeps the class at zero.

   Rules (calibrated on the audited tree — counts in parentheses are what each rule found
   BEFORE the cleanup / must find AFTER):
     A  HARD  a lecture pointer resolves to an existing lecture 0..N_MAX      (0 / 0)
     B  HARD  paired RU/EN spans agree on the lecture numbers they name       (4 / 0)
     B2 HARD  per Book beat, EN and RU/TT layers agree on lecture numbers     (7 / 0)
     E  HARD  a deck never points at ITSELF as its own future                 (4 / 0)
     C  WARN  slide-notes vs slide body: lecture sets must intersect          (11 / ~0)
     D  WARN  "<ModelName> L<n>" adjacency — a layer index posing as a ref    (6 / 0)
   Plus the non-empty pair (rule П4 of the fix plan): a validity check over X must prove
   X ≠ ∅ — this gate exits 1 if it scanned suspiciously few references, because the way
   the Ex-chain check of G24 was defeated was an empty set passing "all X valid".

   Deliberately NOT included: the thematic check "lecture N named in a context owned by
   lecture M" — measured at 5 % precision (453 hits) during the audit; a gate that noisy
   gets ignored, which is worse than not having it.

   Pure-static (sharded part fragments + Book beats, the editable sources). No browser.
   Usage:  node _audit/xref-gate.mjs   |   node _audit/xref-gate.mjs --selftest
*/
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const COURSE = JSON.parse(readFileSync(join(ROOT, 'data', 'course.json'), 'utf8'));
const N_MAX = Math.max(...COURSE.lectures.map((l) => parseInt(l.id, 10)));

/* ── reference extraction ──────────────────────────────────────────────────────────────────
   A lecture pointer is `L<n>` / `Lecture(s) <n>` / `лекци* <n>` / TT `<n> лекция…`, with the
   guards that kept the audit's HARD rules at zero false positives:
   • not part of an identifier: no [A-Za-z0-9-] immediately before `L`, no `-digit` after
     (MiniLM-L6, TinyBERT-L2, plate ids like L17-04, asset paths);
   • asset/attribute contexts stripped before scanning (src/href/alt/aria carry img paths);
   • ranges expand to both endpoints ("Lectures 6–7", "6–7 лекцияләрдә") — the collapsed
     range "6–6" was itself a migration artefact this gate would have caught. */
const stripAttrs = (s) => s.replace(/\b(?:src|href|alt|aria-label)="[^"]*"/g, ' ');
const stripCode = (s) => s.replace(/<code\b[\s\S]*?<\/code>/g, ' ').replace(/<pre\b[\s\S]*?<\/pre>/g, ' ');

function extractRefs(text) {
  const refs = [];
  const push = (a, b) => { const lo = parseInt(a, 10); refs.push(lo); if (b) { const hi = parseInt(b, 10); for (let k = lo + 1; k <= hi; k++) refs.push(k); } };
  for (const m of text.matchAll(/(?<![\w-])L(\d{1,2})(?:[–-]L?(\d{1,2}))?(?![-\d\w])/g)) push(m[1], m[2]);
  for (const m of text.matchAll(/Lectures?\s+(\d{1,2})(?:[–-](\d{1,2}))?\b/g)) push(m[1], m[2]);
  for (const m of text.matchAll(/[Лл]екци\w*\s+(\d{1,2})(?:[–-](\d{1,2}))?\b/g)) push(m[1], m[2]);
  for (const m of text.matchAll(/(\d{1,2})(?:[–-](\d{1,2}))?\s*лекци[яәл]/g)) push(m[1], m[2]);
  return refs;
}

/* ── pure classifiers (selftest-able without the filesystem) ──────────────────────────── */

// A: out-of-range pointer.
export function badRange(text) {
  return extractRefs(stripCode(stripAttrs(text))).filter((n) => n > N_MAX);
}

// B: paired ru/en spans that BOTH name lectures must name the SAME lectures. `own` is the
// deck's own number — subtracted, because "лекция 11 · между L10 и L12" legitimately names
// itself in one language only (without this the audit saw 10 hits, 6 of them false).
export function langPairMismatches(html, own) {
  const out = [];
  for (const m of html.matchAll(/<span lang="ru">([^<]*)<\/span>\s*<span lang="en">([^<]*)<\/span>/g)) {
    const ru = new Set(extractRefs(m[1]).filter((n) => n !== own));
    const en = new Set(extractRefs(m[2]).filter((n) => n !== own));
    if (!ru.size || !en.size) continue;
    if ([...ru].sort().join() !== [...en].sort().join())
      out.push({ ru: [...ru], en: [...en], at: m[1].slice(0, 60) });
  }
  return out;
}

// B2: whole-beat layer agreement (the granularity that found the unrenumbered Tatar layer:
// 7 stale refs + the collapsed "6–6" ranges, zero false hits).
export function beatLayerMismatch(js) {
  const layer = (name) => {
    const m = js.match(new RegExp(name + ':\\s*\\[([\\s\\S]*?)\\]'));
    return m ? m[1] : '';
  };
  const en = new Set(extractRefs(layer('en')));
  const tt = new Set(extractRefs(layer('tt')));
  const ru = new Set(extractRefs(layer('ru')));
  const cmp = (a, b) => a.size && b.size && [...a].sort().join() !== [...b].sort().join();
  const out = [];
  if (cmp(en, tt)) out.push({ pair: 'EN↔TT', en: [...en], other: [...tt] });
  if (cmp(en, ru)) out.push({ pair: 'EN↔RU', en: [...en], other: [...ru] });
  return out;
}

// E: a deck declaring itself its own future. Word-anchored patterns only — a bare "→ L20"
// inside the chain "L2 → L7 → L20" is a legitimate arc recap (the audit's two false hits).
const SELF_PAT = [
  /(?:это|мост к|мост в)\s+L(\d{1,2})\b/g,
  /(?:that is|bridge to|the bridge to)\s+L(\d{1,2})\b/g,
];
export function selfPointers(text, own) {
  const out = [];
  for (const pat of SELF_PAT)
    for (const m of text.matchAll(pat))
      if (parseInt(m[1], 10) === own) out.push(m[0]);
  return out;
}

// C (WARN): notes naming lectures the body never mentions — both sides non-empty and fully
// disjoint. Historical quotations inside notes make this advisory, never HARD.
export function notesBodyDisjoint(html, own = -1) {
  const notes = [...html.matchAll(/<aside class="slide-notes">([\s\S]*?)<\/aside>/g)].map((m) => m[1]).join(' ');
  const body = html.replace(/<aside class="slide-notes">[\s\S]*?<\/aside>/g, ' ');
  // Subtract the deck's own number from BOTH sides, same as rule B: a note saying "this is
  // L16" inside deck 16 is a self-reference, not a cross-reference — without this the rule
  // warned on eight title/agenda slides whose notes legitimately name the deck they sit in.
  const nb = new Set(extractRefs(stripCode(stripAttrs(notes))).filter((n) => n !== own));
  const bb = new Set(extractRefs(stripCode(stripAttrs(body))).filter((n) => n !== own));
  if (!nb.size || !bb.size) return null;
  return [...nb].some((n) => bb.has(n)) ? null : { notes: [...nb], body: [...bb] };
}

// D (WARN): a model name directly followed by L<n> — a layer index wearing a reference's
// clothes. Space-joined only: the hyphenated forms (MiniLM-L6) are already non-references.
// The leading guard keeps "ColBERT, L12" out — that is the late-interaction LECTURE, and
// "BERT" matching inside "ColBERT" was this rule's first false positive on the real tree.
const MODEL = /(?<![A-Za-z])(?:BERT|RoBERTa|XLNet|GPT-2|MiniLM|TinyBERT|ELECTRA|ALBERT|DistilBERT)[,\s]+L\d{1,2}\b/g;
export function modelLayerCollisions(text) {
  return [...text.matchAll(MODEL)].map((m) => m[0]);
}

/* ── runner ───────────────────────────────────────────────────────────────────────────── */

function run() {
  const hard = [], warn = [];
  let scanned = 0;

  const deckDirs = readdirSync(join(ROOT, 'Lectures')).filter((d) => /^\d\d-/.test(d) && existsSync(join(ROOT, 'Lectures', d, 'parts')));
  for (const dir of deckDirs) {
    const own = parseInt(dir.slice(0, 2), 10);
    for (const f of readdirSync(join(ROOT, 'Lectures', dir, 'parts')).filter((f) => f.endsWith('.html'))) {
      const rel = `Lectures/${dir}/parts/${f}`;
      const html = readFileSync(join(ROOT, 'Lectures', dir, 'parts', f), 'utf8');
      const prose = stripCode(stripAttrs(html));
      scanned += extractRefs(prose).length;
      for (const n of badRange(html)) hard.push(`${rel}: pointer to L${n} — lecture does not exist (max L${N_MAX})`);
      for (const d of langPairMismatches(html, own)) hard.push(`${rel}: RU names L${d.ru} where EN names L${d.en} ("${d.at}…")`);
      for (const s of selfPointers(prose, own)) hard.push(`${rel}: deck points at ITSELF as its future ("${s}")`);
      const c = notesBodyDisjoint(html, own);
      if (c) warn.push(`${rel}: notes name L${c.notes} but body names L${c.body} — check which went stale`);
      for (const s of modelLayerCollisions(prose)) warn.push(`${rel}: "${s}" — layer index posing as a lecture ref? write "layer N" / "слой N"`);
    }
  }

  const bookDir = join(ROOT, 'content', 'book');
  for (const ch of readdirSync(bookDir).filter((d) => existsSync(join(bookDir, d, 'beats')))) {
    for (const f of readdirSync(join(bookDir, ch, 'beats')).filter((f) => f.endsWith('.js'))) {
      const rel = `content/book/${ch}/beats/${f}`;
      const js = readFileSync(join(bookDir, ch, 'beats', f), 'utf8');
      scanned += extractRefs(js).length;
      for (const n of badRange(js)) hard.push(`${rel}: pointer to L${n} — lecture does not exist (max L${N_MAX})`);
      for (const d of beatLayerMismatch(js)) hard.push(`${rel}: ${d.pair} disagree — EN names L${d.en}, other layer L${d.other}`);
    }
  }

  /* П4: "all references valid" is meaningless if the scanner found none. The audited tree
     carries ~2200 pointer references; a scan an order of magnitude below that means the
     extraction regex rotted, not that the course stopped cross-referencing. */
  if (scanned < 200) {
    console.log(`[xref-gate] ✗ scanned only ${scanned} lecture reference(s) — extraction is broken, refusing to report a vacuous pass`);
    return 1;
  }

  for (const h of hard) console.log('  ✗ [HARD] ' + h);
  for (const w of warn) console.log('  ! [WARN] ' + w);
  console.log(`\n[xref-gate] scanned ${scanned} lecture reference(s) across ${deckDirs.length} decks + the Book (en/ru/tt)`);
  console.log(`[xref-gate] HARD(out-of-range/lang-mismatch/self-pointer)=${hard.length}  WARN(notes-vs-body/model-layer)=${warn.length}`);
  return hard.length ? 1 : 0;
}

/* ── selftest: every rule must fire on a planted defect and stay silent on the clean twin ── */
function selftest() {
  const cases = [
    ['A fires on L27', () => badRange('see L27 for details').length === 1],
    ['A silent on valid L15', () => badRange('Generate joins at L15 (RAG)').length === 0],
    ['A silent on MiniLM-L6 / plate L17-04 / src path', () =>
      badRange('ms-marco-MiniLM-L6 beats MiniLM-L12; plate L17-04; <img src="assets/img/L99/x.png">').length === 0],
    ['B fires on RU L4 vs EN L5', () =>
      langPairMismatches('<span lang="ru">nDCG из L4</span> <span lang="en">L5\'s nDCG</span>', 12).length === 1],
    ['B silent on agreeing pair', () =>
      langPairMismatches('<span lang="ru">из L2</span> <span lang="en">in L2</span>', 12).length === 0],
    ['B subtracts own deck number', () =>
      langPairMismatches('<span lang="ru">лекция 11 против L10</span> <span lang="en">L10 here</span>', 11).length === 0],
    ['B2 fires on EN 10 vs TT 7', () =>
      beatLayerMismatch("en: ['Lecture 10 cascade'], ru: ['каскад лекции 10'], tt: ['7 лекциядәге каскад'],").length === 1],
    ['B2 silent when layers agree', () =>
      beatLayerMismatch("en: ['Lecture 10'], ru: ['лекции 10'], tt: ['10 лекциядәге'],").length === 0],
    ['B2 expands ranges (6–7 vs 5–7 fires)', () =>
      beatLayerMismatch("en: ['Lectures 6–7'], ru: ['лекций 6–7'], tt: ['5–7 лекцияләрдә'],").length === 1],
    ['E fires on self-pointer', () => selfPointers('нужны эмбеддинги → это L6.', 6).length === 1],
    ['E silent on pointer to another deck', () => selfPointers('это L7.', 6).length === 0],
    ['E silent on arc chain "L2 → L7 → L20"', () => selfPointers('the line runs L2 → L7 → L20', 20).length === 0],
    ['C fires on disjoint notes', () =>
      notesBodyDisjoint('<p>про L5</p><aside class="slide-notes">callback to L9</aside>', 13) !== null],
    ['C silent when sets meet', () =>
      notesBodyDisjoint('<p>про L5 и L9</p><aside class="slide-notes">callback to L9</aside>', 13) === null],
    ['C silent on a self-reference in notes', () =>
      notesBodyDisjoint('<p>про L5</p><aside class="slide-notes">this deck is L13</aside>', 13) === null],
    ['D fires on "RoBERTa L20"', () => modelLayerCollisions('RoBERTa L20 collapses').length === 1],
    ['D silent on "RoBERTa, layer 12"', () => modelLayerCollisions('RoBERTa, layer 12 collapses').length === 0],
    ['D silent on "ColBERT, L12" (a lecture, not a layer)', () => modelLayerCollisions('late interaction (ColBERT, L12)').length === 0],
  ];
  let ok = true;
  for (const [name, fn] of cases) {
    const pass = fn();
    console.log(`  ${pass ? '✓' : '✗'} ${name}`);
    if (!pass) ok = false;
  }
  console.log('[xref-gate]', ok ? 'selftest PASS — every rule fires on its planted defect, silent on the clean twin'
                                : 'SELFTEST FAILED');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
