/* slide-type-gate.mjs — AUDIT_SITE G21.
   TYPE ↔ CONTENT contract for slides. A slide's `data-type` promises a structure; when
   the markup that structure REQUIRES is missing, two things go wrong at once — both of
   which shipped past every other gate:
     • pre-flight (runtime, lecturer-facing overlay) warns on load — the class of "mass
       warnings on open" this gate kills.
     • the slide misses the layout its REAL content needs. A static formula slide mistyped
       `e2e` never gets `data-type="formula"`'s 280% math scaling + centred fill, so its
       equations render ~19px on the 1920px canvas ("criminally small").

   Two sibling contracts, both lifted from preflight.js (a runtime whisper) into a
   BUILD-TIME HARD gate so a mistyped slide can't reach the deck:
     1. STEPPED — `walkthrough`/`e2e` MUST carry step markers (.walk-step/.e2e-step/[data-step]).
     2. MISCONCEPTION — `misconception` MUST carry .misc-statement AND .misc-truth (the
        myth + its reveal target); otherwise it's a plain slide wearing the wrong type.

   Pure-static (reads the sharded part fragments, the editable source) — no browser,
   deterministic. Severity: HARD. Self-test: each contract must fire when violated, stay
   silent when honoured, and never fire on unrelated types.

   Usage:  node _audit/slide-type-gate.mjs   |   node _audit/slide-type-gate.mjs --selftest
*/
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { REPO_ROOT } from './lib/paths.mjs';

const ROOT = REPO_ROOT;
const hasClass = (body, name) => new RegExp(`class="[^"]*\\b${name}\\b`).test(body);
// Each contract: the types it governs, a body predicate that must hold, and the human
// "need" string. Mirrors preflight.js's stepped-sanity + misconception checks exactly.
const CONTRACTS = [
  {
    types: ['walkthrough', 'e2e'],
    ok: (body) => hasClass(body, 'walk-step') || hasClass(body, 'e2e-step') || /data-step\s*=/.test(body),
    need: '.walk-step/.e2e-step/[data-step]',
  },
  {
    types: ['misconception'],
    ok: (body) => hasClass(body, 'misc-statement') && hasClass(body, 'misc-truth'),
    need: '.misc-statement + .misc-truth (reveal target)',
  },
];

function walkParts(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkParts(p, out);
    else if (extname(e.name) === '.html' && p.includes(`${'parts'}/`)) out.push(p);
  }
  return out;
}

// Every <section class="slide" …> in a fragment, with its data-type, label and body.
// The decks are sharded one-slide-per-fragment, but parse defensively for N sections.
function slidesIn(html) {
  const out = [];
  const re = /<section\b([^>]*\bclass="[^"]*\bslide\b[^"]*"[^>]*)>/g;
  let m;
  const opens = [];
  while ((m = re.exec(html))) opens.push({ attrs: m[1], start: m.index, tagEnd: re.lastIndex });
  opens.forEach((o, i) => {
    const bodyEnd = i + 1 < opens.length ? opens[i + 1].start : html.length;
    const body = html.slice(o.tagEnd, bodyEnd);
    const type = (o.attrs.match(/data-type="([^"]*)"/) || [])[1] || '';
    const label = (o.attrs.match(/data-screen-label="([^"]*)"/) || [])[1] || '';
    out.push({ type, label, body });
  });
  return out;
}

function violationsIn(html) {
  const bad = [];
  for (const s of slidesIn(html)) {
    for (const c of CONTRACTS) {
      if (c.types.includes(s.type) && !c.ok(s.body)) {
        bad.push({ type: s.type, label: s.label, need: c.need });
      }
    }
  }
  return bad;
}

function run() {
  const files = walkParts(join(ROOT, 'Lectures'));
  const report = [];
  let scanned = 0;
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    const slides = slidesIn(html);
    scanned += slides.length;
    for (const v of violationsIn(html)) {
      report.push(`${f.replace(ROOT + '/', '')} — data-type="${v.type}" is missing ${v.need} (${v.label || 'unlabelled'})`);
    }
  }
  console.log(`[slide-type] scanned ${scanned} slides across ${files.length} part fragments; type↔content contracts: stepped needs steps, misconception needs myth+reveal`);
  for (const r of report) console.log(`  ✗ ${r}`);
  console.log(`\n[slide-type] HARD(type↔content mismatch)=${report.length}`);
  return report.length ? 1 : 0;
}

function selftest() {
  const withSteps = '<section class="slide" data-type="e2e" data-screen-label="ok"><div class="e2e-step">a</div></section>';
  const noSteps = '<section class="slide" data-type="e2e" data-screen-label="bad"><div class="formula-stage">$$x$$</div></section>';
  const walkNoSteps = '<section class="slide" data-type="walkthrough">no steps here</section>';
  const notStepped = '<section class="slide" data-type="formula"><div class="formula-stage">$$x$$</div></section>';
  const dataStep = '<section class="slide" data-type="walkthrough"><p data-step="1">x</p></section>';
  const miscOk = '<section class="slide" data-type="misconception"><div class="misc-statement">myth</div><div class="misc-truth">real</div></section>';
  const miscNoTruth = '<section class="slide" data-type="misconception"><div class="misc-statement">myth</div></section>';
  const miscPlain = '<section class="slide" data-type="misconception"><div class="def-card">x</div></section>';
  const cases = [
    ['e2e with .e2e-step', withSteps, 0],
    ['e2e without steps', noSteps, 1],
    ['walkthrough without steps', walkNoSteps, 1],
    ['formula (not stepped) без steps', notStepped, 0],
    ['walkthrough with [data-step]', dataStep, 0],
    ['misconception with statement+truth', miscOk, 0],
    ['misconception missing .misc-truth', miscNoTruth, 1],
    ['misconception with only a def-card', miscPlain, 1],
  ];
  const fails = [];
  for (const [name, html, expect] of cases) {
    const got = violationsIn(html).length;
    if (got !== expect) fails.push(`${name}: expected ${expect}, got ${got}`);
  }
  fails.forEach((f) => console.log(`  ✗ ${f}`));
  console.log(`[selftest] ${fails.length ? 'FAIL' : 'PASS'} — stepped-without-steps fires; stepped-with-steps & non-stepped stay silent (${cases.length} cases)`);
  return fails.length ? 1 : 0;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
