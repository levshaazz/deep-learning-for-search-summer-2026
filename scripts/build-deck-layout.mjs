#!/usr/bin/env node
/* =========================================================
   build-deck-layout.mjs — esbuild widgets/_layout.js → Lectures/js/layout.js as a CLASSIC global
   `window.DeckLayout` (R8). The deck is an offline file:// classic page (no ES modules), so the pure
   auto-layout primitives (makeScale/stack/grid/placeLabels) must be shipped as a plain global a deck's
   inline slide scripts can call. Single source of truth: widgets/_layout.js (also imported by widgets);
   Lectures/js/layout.js is BUILD OUTPUT (gitignored), loaded synchronously in each deck's <head> so
   window.DeckLayout exists before any slide IIFE runs. Build-time only — nothing new ships to students.
   Run:  node scripts/build-deck-layout.mjs   (also wired into `npm run build`)
   ========================================================= */
import { build } from 'esbuild';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = join(ROOT, 'widgets', '_layout.js');
const outfile = join(ROOT, 'Lectures', 'js', 'layout.js');

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'iife',
  globalName: 'DeckLayout',   // exports → window.DeckLayout.{makeScale,stack,grid,placeLabels}
  target: 'es2018',
  legalComments: 'none',
  logLevel: 'warning',
  banner: { js: '/* AUTO-GENERATED classic global of widgets/_layout.js — do not edit. Rebuild: node scripts/build-deck-layout.mjs */' },
});
console.log('[deck-layout] widgets/_layout.js → Lectures/js/layout.js (window.DeckLayout)');
