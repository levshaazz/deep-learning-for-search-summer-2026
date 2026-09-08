// copy-static.mjs — after `astro build`, copy the existing slide decks (and their
// vendored assets) into the build output so /Lectures/*.html resolve on the published
// site. The decks keep their own engine/CSS/relative paths untouched (EN-only, per spec).
// Run by `npm run build` (astro build && node scripts/copy-static.mjs).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, sep } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs');

if (!existsSync(outDir)) {
  console.error('[copy-static] docs/ not found — run `astro build` first.');
  process.exit(1);
}

// Whole Lectures/ tree → docs/Lectures (decks + css/ js/ vendor/ assets/). Preserves
// the decks' relative asset paths verbatim. node_modules is not inside Lectures/.
// Skip deck-shard SOURCE fragments (Lectures/<slug>/parts/*) — the assembled
// Lectures/<slug>.html is what ships; the fragments are editor-side source only.
const src = join(root, 'Lectures');
const dst = join(outDir, 'Lectures');
mkdirSync(dst, { recursive: true });
cpSync(src, dst, { recursive: true, dereference: true, filter: (s) => !s.split(sep).includes('parts') });

console.log('[copy-static] copied Lectures/ → docs/Lectures/');
