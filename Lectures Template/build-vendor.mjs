#!/usr/bin/env node
/* =========================================================
   build-vendor.mjs — download every runtime CDN dependency into ./vendor/
   so the EDITABLE deck (Lecture Template.html) runs with ZERO runtime
   network calls. Run once (needs network); after that the deck — and the
   standalone bundler, which now reads vendor/ — work fully offline.

   Layout produced:
     vendor/katex/katex.min.css         (+ vendor/katex/fonts/*.woff2)
     vendor/katex/katex.min.js
     vendor/katex/auto-render.min.js
     vendor/prism/prism-core.min.js + prism-{python,bash,yaml,json}.min.js
     vendor/qrcode/qrcode.js
     vendor/fonts/fonts.css             (+ vendor/fonts/*.woff2)

   Downloads run concurrently (Promise.all) — it is pure I/O, so the wall
   clock is the slowest single file, not the sum.

   Usage:  node build-vendor.mjs
   ========================================================= */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const VENDOR = join(ROOT, 'vendor');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const log = (...a) => console.log('[vendor]', ...a);

const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
const PRISM = 'https://unpkg.com/prismjs@1.29.0/';
const QR = 'https://unpkg.com/qrcode-generator@1.4.4/qrcode.js';
const GFONTS = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';

async function getText(url, headers = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}
async function getBuf(url, headers = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
async function out(rel, data) {
  const p = join(VENDOR, rel);
  await mkdir(dirname(p), { recursive: true });
  await writeFile(p, data);
  return p;
}

/* ---- KaTeX CSS: keep relative url(fonts/…) (resolves to vendor/katex/fonts),
        strip legacy woff/ttf, download the woff2 fonts in parallel. ---- */
async function katex() {
  let css = await getText(KATEX + 'katex.min.css');
  const fonts = [...new Set([...css.matchAll(/fonts\/([\w-]+\.woff2)/g)].map(m => m[1]))];
  css = css.replace(/,url\(fonts\/[\w-]+\.woff\) format\("woff"\)/g, '')
           .replace(/,url\(fonts\/[\w-]+\.ttf\) format\("truetype"\)/g, '');
  await Promise.all([
    out('katex/katex.min.css', css),
    out('katex/katex.min.js', await getText(KATEX + 'katex.min.js')),
    out('katex/auto-render.min.js', await getText(KATEX + 'contrib/auto-render.min.js')),
    ...fonts.map(async f => out('katex/fonts/' + f, await getBuf(KATEX + 'fonts/' + f))),
  ]);
  log(`KaTeX: css + 2 js + ${fonts.length} woff2`);
}

async function prism() {
  const files = ['prism-core', 'prism-python', 'prism-bash', 'prism-yaml', 'prism-json'];
  await Promise.all(files.map(async f =>
    out('prism/' + f + '.min.js', await getText(PRISM + 'components/' + f + '.min.js'))));
  log(`Prism: ${files.length} grammars (autoloader dropped — needs network anyway)`);
}

async function qrcode() {
  await out('qrcode/qrcode.js', await getText(QR));
  log('qrcode-generator');
}

/* ---- Google Fonts: fetch CSS with a real UA (→ woff2), download each
        gstatic woff2 in parallel, rewrite url() to local relative paths. ---- */
async function gfonts() {
  let css = await getText(GFONTS, { 'User-Agent': UA });
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]))];
  const named = urls.map((u, i) => ({ u, name: `gf-${i}-${u.split('/').pop().split('?')[0]}` }));
  await Promise.all(named.map(async ({ u, name }) => out('fonts/' + name, await getBuf(u, { 'User-Agent': UA }))));
  for (const { u, name } of named) css = css.split(u).join('./' + name);
  await out('fonts/fonts.css', css);
  log(`Google Fonts: css + ${named.length} woff2`);
}

async function main() {
  await mkdir(VENDOR, { recursive: true });
  const t = process.hrtime.bigint();
  // All four resource groups download concurrently.
  await Promise.all([katex(), prism(), qrcode(), gfonts()]);
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  log(`done in ${ms.toFixed(0)}ms → ${VENDOR}`);
  log('Editable deck now has zero runtime CDN. Re-run build-standalone.mjs to refresh the bundle.');
}
main().catch(e => { console.error('[vendor] FAILED:', e); process.exit(1); });
