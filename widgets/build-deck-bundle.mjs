/* build-deck-bundle.mjs — produce a CLASSIC (IIFE) offline bundle of a widget's ES-module logic.js,
   so a lecture DECK can mount the SAME widget over file:// (zero network) instead of re-implementing
   the figure natively (the "authored twice" duplication the audit flagged).

   HOW: the widget's logic.js calls defineWidget(), which registers window.mount<Pascal> at load. ES
   modules don't load over file://, so we bundle logic.js (+ its _widget-base/_plot-util/_layout imports)
   into one classic IIFE that runs on <script src> and performs that same window registration. The
   deck-adapter (widgets/deck-adapter.js) then drives it via the deck's step engine.

   Build-time only: esbuild is already a dev dependency (transitive); NOTHING new ships to students,
   and the OUTPUT is plain vanilla JS (HARD CONSTRAINT #5). The bundle is self-contained and offline.

   Usage:  node widgets/build-deck-bundle.mjs cosine-sphere [more-ids…]   → widgets/_dist/<id>.classic.js
*/
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ids = process.argv.slice(2);
if (!ids.length) { console.error('usage: node widgets/build-deck-bundle.mjs <widget-id> [...]'); process.exit(2); }

for (const id of ids) {
  const entry = join(HERE, id, 'logic.js');
  if (!existsSync(entry)) { console.error(`[deck-bundle] no such widget logic: ${entry}`); process.exit(1); }
  const outfile = join(HERE, '_dist', `${id}.classic.js`);
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'iife',          // wrap as a classic IIFE that runs on load (registers window.mount<Pascal>)
    target: 'es2018',
    legalComments: 'none',
    logLevel: 'warning',
    banner: { js: `/* AUTO-GENERATED offline classic bundle of widgets/${id}/logic.js — do not edit. Rebuild: node widgets/build-deck-bundle.mjs ${id} */` },
  });
  console.log(`[deck-bundle] ${id} → widgets/_dist/${id}.classic.js`);
}
