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

// the widgets L7 mounts in its deck slides (id → Lectures/js/<id>.classic.js, IIFE → window.mount<Pascal>)
const DECK_WIDGETS = ['biencoder', 'crossencoder', 'neural-cascade'];

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
const mountRule = '.slide .widget-mount { max-width: 820px; margin: 0 auto; }\n' +
  '.slide .widget-mount .wgt-caption, .slide .widget-mount .wgt-counter { display: none; }\n';
const cssParts = [mountRule, readFileSync(join(ROOT, 'widgets', '_base.css'), 'utf8')];
for (const id of DECK_WIDGETS) cssParts.push(readFileSync(join(ROOT, 'widgets', id, 'style.css'), 'utf8'));
writeFileSync(join(CSS, 'deck-widgets.css'),
  '/* AUTO-GENERATED — widgets/_base.css + ' + DECK_WIDGETS.join('/') +
  ' style.css for deck-mounted figures. Do not edit. Rebuild: node scripts/build-deck-widgets.mjs */\n' +
  cssParts.join('\n'));

console.log(`[deck-widgets] ${DECK_WIDGETS.join(', ')} → Lectures/js/*.classic.js + deck-adapter.js + css/deck-widgets.css`);
