#!/usr/bin/env node
/* =========================================================
   sync-shared.mjs — regenerate the template's css/ and js/ from the
   CANONICAL single source `Lectures/{css,js}`.

   The template's css/ and js/ are byte-identical to the live decks'
   `Lectures/css/*` and `Lectures/js/*` (they were committed copies that
   silently drifted — a copied template shipped stale CSS). They are now
   GENERATED, not tracked: edit the canonical `Lectures/{css,js}`, then this
   script copies them in so `build-standalone.mjs` inlines the current code.

   Run automatically by build-standalone.mjs; also run it manually before
   previewing `Lecture Template.html` in a fresh checkout.

   Usage:  node sync-shared.mjs
   ========================================================= */
import { readdir, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));            // Lectures Template/
const CANON = join(ROOT, '..', 'Lectures');                     // Lectures/
const log = (...a) => console.log('[sync-shared]', ...a);

async function syncDir(sub, ext) {
  const from = join(CANON, sub);
  const to = join(ROOT, sub);
  await mkdir(to, { recursive: true });
  const files = (await readdir(from)).filter((f) => f.endsWith(ext));
  for (const f of files) await copyFile(join(from, f), join(to, f));
  log(`${sub}: copied ${files.length} ${ext} file(s) from canonical Lectures/${sub}`);
  return files.length;
}

export async function syncShared() {
  const css = await syncDir('css', '.css');
  const js = await syncDir('js', '.js');
  return { css, js };
}

// Run directly: `node sync-shared.mjs`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  syncShared().then(({ css, js }) => log(`done — ${css} css + ${js} js synced from canonical.`))
    .catch((e) => { console.error('[sync-shared] FAILED:', e); process.exit(1); });
}
