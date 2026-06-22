#!/usr/bin/env node
// Build-time image optimization for the GitHub Pages artifact (docs/).
//
// Converts the deck/book illustration plates to WebP (quality 88, longest side
// ≤ 1920px) and rewrites every `assets/img/…png` reference in the built HTML to
// `.webp` (cache-bust `?v=` query strings are preserved).
//
// SOURCE IS UNTOUCHED — this only rewrites build output under docs/. The PNG
// sources (Lectures/assets/img, _research/gen_images.py, the committed offline
// standalone decks) stay full-resolution PNG. WebP is universally supported by
// browsers, so the served site renders it; the offline file:// decks keep PNG
// so their archival rendering is unaffected.
//
// Runs after copy-static + astro build (both decks and book pages reference the
// single shared image dir docs/Lectures/assets/img). Idempotent: a second run
// finds no PNGs left and no .png refs to rewrite.
import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const IMG_DIR = join(DOCS, 'Lectures', 'assets', 'img');
const QUALITY = 88;
const MAX_DIM = 1920;

async function walk(dir, keep) {
  const out = [];
  let ents;
  try { ents = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const ent of ents) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...(await walk(p, keep)));
    else if (keep(p)) out.push(p);
  }
  return out;
}

// Bounded-concurrency map so we don't spawn 161 sharp pipelines at once.
async function mapLimit(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; ret[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return ret;
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

async function main() {
  // 1 — Convert every PNG plate to WebP (downscale-only to ≤1920px), drop the PNG.
  // Each task returns its byte sizes; we total afterwards (a shared `x += await …`
  // would lose updates across concurrent workers — the read happens before the await).
  const pngs = await walk(IMG_DIR, (p) => p.endsWith('.png'));
  const sizes = await mapLimit(pngs, 8, async (png) => {
    const b = (await stat(png)).size;
    const webp = png.replace(/\.png$/, '.webp');
    await sharp(png)
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(webp);
    const a = (await stat(webp)).size;
    await unlink(png);
    return { b, a };
  });
  const before = sizes.reduce((s, x) => s + x.b, 0);
  const after = sizes.reduce((s, x) => s + x.a, 0);
  console.log(`[optimize-images] ${pngs.length} PNG → WebP   ${mb(before)} → ${mb(after)}   (q${QUALITY}, ≤${MAX_DIM}px longest side)`);

  // 2 — Rewrite assets/img/…png references in the built HTML → .webp (keeps ?v=… query).
  const htmls = await walk(DOCS, (p) => p.endsWith('.html'));
  const RE = /(assets\/img\/[^"')\s]+?)\.png/g;
  const counts = await mapLimit(htmls, 16, async (f) => {
    const src = await readFile(f, 'utf8');
    let n = 0;
    const out = src.replace(RE, (_, base) => { n++; return base + '.webp'; });
    if (n > 0) await writeFile(f, out);
    return n;
  });
  const refs = counts.reduce((s, n) => s + n, 0);
  const files = counts.filter((n) => n > 0).length;
  console.log(`[optimize-images] rewrote ${refs} references in ${files} HTML files (.png → .webp)`);

  // 3 — Fail loud if any assets/img PNG reference survived (would 404 on Pages).
  const dangling = [];
  for (const f of htmls) {
    const src = await readFile(f, 'utf8');
    if (/assets\/img\/[^"')\s]+?\.png/.test(src)) dangling.push(f.replace(DOCS + '/', ''));
  }
  if (dangling.length) {
    console.error(`[optimize-images] ERROR: ${dangling.length} HTML file(s) still reference a .png plate:`);
    for (const d of dangling.slice(0, 10)) console.error('  - ' + d);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
