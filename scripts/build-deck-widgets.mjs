#!/usr/bin/env node
/* =========================================================
   build-deck-widgets.mjs — make the L7 "Scouts and Judges" widgets mountable inside the OFFLINE deck.

   L7 is the first deck to MOUNT real widgets (biencoder / crossencoder / neural-cascade) in its slides
   (the Book has always done this via Scrollama; the deck drives them with its own step engine via
   widgets/deck-adapter.js). A deck is an offline file:// classic page (HARD CONSTRAINT #1: standalone,
   zero-network, 1920×1080) — ES modules don't load over file:// — so each widget's logic.js is esbuilt
   into a CLASSIC IIFE bundle that registers window.mount<Pascal> on load, and the classic deck-adapter
   is copied alongside. Both land in Lectures/js/ (served relatively by the deck, exactly like
   js/layout.js), are BUILD OUTPUT (gitignored), and ship nothing new to students (plain vanilla JS).

   Single source of truth: widgets/<id>/logic.js (+ widgets/deck-adapter.js). Run:
     node scripts/build-deck-widgets.mjs            (also wired into `npm run build`)
   ========================================================= */
import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'Lectures', 'js');
const CSS = join(ROOT, 'Lectures', 'css');

// the widgets mounted inside deck slides (id → Lectures/js/<id>.classic.js, IIFE → window.mount<Pascal>).
// course-map is the recurring spine "you are here" slide, now mounted in EVERY deck (E10 migrate-all):
// the bespoke per-lecture spine SVGs were replaced by this one shared 4-leg widget driven by per-lecture
// `active` (mirrors each lecture's course.json `spine`). L7/L8 mount the neural figures.
const DECK_WIDGETS = ['course-map',
  'biencoder', 'crossencoder', 'neural-cascade', 'in-batch-negatives', 'rag-pipeline',
  'colbert-maxsim', 'splade-expansion', 'hybrid-fusion', 'ltr-lambda',
  'hnsw-graph', 'ivf-cells', 'pq-quantize', 'metric-compare', 'recall-curve', 'highd-histogram',    // L9 "Hyperspace Lanes" deck-mounted figures (highd-histogram reused from L2 for distance-concentration)
  'chunking-demo', 'query-rewrite', 'query-tree', 'raptor-tree', 'semantic-router', 'rag-control-flow',  // L10 "The Oracle" deck-mounted figures (rag-pipeline already listed)
  'ragas-metrics', 'llm-judge', 'agentic-loop',          // L11 "Judging the Oracle" deck-mounted figures
  'graphrag', 'clip-matrix'];                            // L12 "The Deep Field" deck-mounted figures (rag-control-flow reused for CRAG/self-RAG callback)

for (const id of DECK_WIDGETS) {
  await build({
    entryPoints: [join(ROOT, 'widgets', id, 'logic.js')],
    outfile: join(JS, `${id}.classic.js`),
    bundle: true,
    format: 'iife',          // classic IIFE: runs on <script src>, registers window.mount<Pascal>
    target: 'es2018',
    legalComments: 'none',
    logLevel: 'warning',
    banner: { js: `/* AUTO-GENERATED offline classic bundle of widgets/${id}/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */` },
  });
}

// the deck-adapter (classic) that wires the mounts to the deck step engine — copied verbatim.
copyFileSync(join(ROOT, 'widgets', 'deck-adapter.js'), join(JS, 'deck-adapter.js'));

// the widgets' CSS — the deck does NOT load widgets/*/style.css the way the Book does, so without this
// the deck-mounted figures render UNSTYLED (default-black SVG). Concatenate the shared _base.css (.wgt-*
// host/caption/fade + the .is-hidden step-reveal rule) and each widget's style.css into one offline
// stylesheet the deck head links. BUILD OUTPUT (gitignored). Single source: widgets/.
// constrain the mount width so the 480-unit-wide widget SVG scales to a height that fits a 1080-tall
// slide (full slide-width would scale it ~3.5× → taller than the slide → OOB). Mirrors deck-adapter-proof.
// Mount sizing — BIG-on-1920 (owner: the 820px cap rendered the figures too small). Each widget SVG is
// ~480–560 user-units wide; we cap the rendered width so its height still fits the ~830px figure band
// under the slide header, and let autofit handle the rest. `min(px, cqw)` keeps it scale-robust against
// the 1920×1080 .slides size-container (autofit.css). Per-widget overrides because aspect ratios differ:
// the bi/cross figures are ~1.5:1 (tall-ish), the cascade is content-tall, the RAG pipeline is wide-short.
const mountRule =
  '.slide .widget-mount { max-width: min(1180px, 64cqw); margin: 0 auto; }\n' +
  // the spine map is wide-short (700×250 ≈ 2.8:1): let it run wide so the four stops read big.
  '.slide .widget-mount[data-widget="course-map"]         { max-width: min(1320px, 72cqw); }\n' +
  '.slide .widget-mount[data-widget="biencoder"]          { max-width: min(1180px, 64cqw); }\n' +
  '.slide .widget-mount[data-widget="crossencoder"]       { max-width: min(1220px, 66cqw); }\n' +
  '.slide .widget-mount[data-widget="neural-cascade"]     { max-width: min(1200px, 64cqw); }\n' +
  '.slide .widget-mount[data-widget="in-batch-negatives"] { max-width: min(1040px, 58cqw); }\n' +
  '.slide .widget-mount[data-widget="rag-pipeline"]       { max-width: min(1480px, 80cqw); }\n' +
  // the cascade is HTML (not an autoscaling SVG): bump its type + bar height DECK-ONLY so it reads big on
  // 1920 without enlarging it in the narrower Book column.
  // size via calc(var(--fz-…)*k) so the font-gate sees an on-scale token (raw px/rem literals would HARD-fail it)
  '.slide .widget-mount[data-widget="neural-cascade"] .nc-panel { gap: 2rem; padding: 1rem 0; }\n' +
  '.slide .widget-mount[data-widget="neural-cascade"] .nc-bar  { min-height: 116px; }\n' +
  '.slide .widget-mount[data-widget="neural-cascade"] .nc-name { font-size: calc(var(--fz-small, .9rem) * 1.7); }\n' +
  '.slide .widget-mount[data-widget="neural-cascade"] .nc-count{ font-size: calc(var(--fz-body, 1rem) * 1.7); }\n' +
  '.slide .widget-mount[data-widget="neural-cascade"] .nc-desc { font-size: calc(var(--fz-body, 1rem) * 1.05); max-width: 64ch; }\n' +
  '.slide .widget-mount .wgt-caption, .slide .widget-mount .wgt-counter { display: none; }\n';
const cssParts = [mountRule, readFileSync(join(ROOT, 'widgets', '_base.css'), 'utf8')];
for (const id of DECK_WIDGETS) cssParts.push(readFileSync(join(ROOT, 'widgets', id, 'style.css'), 'utf8'));
writeFileSync(join(CSS, 'deck-widgets.css'),
  '/* AUTO-GENERATED — widgets/_base.css + ' + DECK_WIDGETS.join('/') +
  ' style.css for deck-mounted figures. Do not edit. Rebuild: node scripts/build-deck-widgets.mjs */\n' +
  cssParts.join('\n'));

console.log(`[deck-widgets] ${DECK_WIDGETS.join(', ')} → Lectures/js/*.classic.js + deck-adapter.js + css/deck-widgets.css`);
