#!/usr/bin/env node
/* =========================================================
   build-standalone.mjs — produce a TRULY offline single-file deck.

   Reads the editable deck (which now points at ./vendor/ local assets, see
   build-vendor.mjs) and inlines EVERYTHING into one self-contained .html:
     • every local css/*.css and js/*.js
     • KaTeX CSS + its woff2 fonts (→ base64 data URIs)
     • KaTeX JS (katex + auto-render) with a DOMContentLoaded typeset hook
     • Prism core + preloaded grammars (python/bash/yaml/json)
     • qrcode-generator
     • Google Fonts CSS + woff2 (→ base64)

   Because it reads vendor/ (not the network), this build is itself fully
   offline. Run `node build-vendor.mjs` first to populate vendor/.

   Usage:  node build-standalone.mjs
   Output: "Lecture Template (Standalone).html"  (overwritten)
   ========================================================= */
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { syncShared } from './sync-shared.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'Lecture Template.html');
const OUT = join(ROOT, 'Lecture Template (Standalone).html');
const VENDOR = join(ROOT, 'vendor');
const log = (...a) => console.log('[bundle]', ...a);

/* String.replace interprets $$,$&,$`,$',$n in a STRING replacement, which
   corrupts inlined JS/CSS (they contain `$`). Always pass a function. */
const fn = (s) => () => s;

async function dataURI(path, mime) {
  const buf = await readFile(path);
  return `data:${mime};base64,${buf.toString('base64')}`;
}

/* KaTeX CSS: relative url(fonts/X.woff2) → base64 data URIs from vendor. */
async function katexCssInlined() {
  let css = await readFile(join(VENDOR, 'katex/katex.min.css'), 'utf8');
  const woff2 = [...new Set([...css.matchAll(/fonts\/([\w-]+\.woff2)/g)].map(m => m[1]))];
  log(`KaTeX: inlining ${woff2.length} woff2 fonts`);
  const map = {};
  for (const f of woff2) map[f] = await dataURI(join(VENDOR, 'katex/fonts', f), 'font/woff2');
  return css.replace(/url\(fonts\/([\w-]+\.woff2)\)/g, (m, f) => `url(${map[f]})`);
}

/* Google Fonts CSS: relative url(./gf-N.woff2) → base64 data URIs. */
async function gfontsInlined() {
  let css = await readFile(join(VENDOR, 'fonts/fonts.css'), 'utf8');
  const files = [...new Set([...css.matchAll(/url\(\.\/([\w.-]+\.woff2)\)/g)].map(m => m[1]))];
  log(`Google Fonts: inlining ${files.length} woff2 fonts`);
  for (const f of files) css = css.split('./' + f).join(await dataURI(join(VENDOR, 'fonts', f), 'font/woff2'));
  return css;
}

async function ensureVendor() {
  try { await access(join(VENDOR, 'katex/katex.min.js')); }
  catch { throw new Error('vendor/ is missing or incomplete — run `node build-vendor.mjs` first.'); }
}

async function main() {
  await ensureVendor();
  await syncShared();   // regenerate css/ + js/ from canonical Lectures/{css,js}
  let html = await readFile(SRC, 'utf8');

  // 1) local CSS  <link rel="stylesheet" href="css/X.css">
  for (const m of [...new Set([...html.matchAll(/<link rel="stylesheet" href="(css\/[\w.-]+)"\s*\/?>/g)].map(x => x[1]))]) {
    const css = await readFile(join(ROOT, m), 'utf8');
    html = html.replace(new RegExp(`<link rel="stylesheet" href="${m.replace('.', '\\.')}"\\s*/?>`, 'g'),
      fn(`<style>/* ${m} */\n${css}\n</style>`));
    log('inlined', m);
  }

  // 2) Google Fonts <link href="vendor/fonts/fonts.css" …> → <style> (tag may span lines)
  {
    const css = await gfontsInlined();
    html = html.replace(/<link href="vendor\/fonts\/fonts\.css"[\s\S]*?>/,
      fn(`<style>/* Google Fonts (inlined) */\n${css}\n</style>`));
  }

  // 3) KaTeX CSS <link href="vendor/katex/katex.min.css" …> → <style>
  {
    const css = await katexCssInlined();
    html = html.replace(/<link rel="stylesheet" href="vendor\/katex\/katex\.min\.css"[\s\S]*?>/,
      fn(`<style>/* KaTeX (inlined) */\n${css}\n</style>`));
  }

  // 4) KaTeX JS (katex + auto-render) → inline; typeset on DOMContentLoaded
  const kxJs = await readFile(join(VENDOR, 'katex/katex.min.js'), 'utf8');
  const kxAuto = await readFile(join(VENDOR, 'katex/auto-render.min.js'), 'utf8');
  html = html.replace(/<script defer src="vendor\/katex\/katex\.min\.js"[\s\S]*?><\/script>\s*/, '');
  html = html.replace(/<script defer src="vendor\/katex\/auto-render\.min\.js"[\s\S]*?><\/script>\s*/, '');
  const katexBlock = `<script>/* KaTeX (inlined) */\n${kxJs}\n</script>
<script>/* KaTeX auto-render (inlined) */\n${kxAuto}\n</script>
<script>/* typeset once the DOM exists; defer katex:done so deck.js (also
  bound on DOMContentLoaded) has registered its listener. */
document.addEventListener('DOMContentLoaded', function () {
  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\\\[', right: '\\\\]', display: true },
      { left: '\\\\(', right: '\\\\)', display: false }
    ],
    throwOnError: false, strict: 'ignore'
  });
  setTimeout(function () { document.dispatchEvent(new CustomEvent('katex:done')); }, 0);
});
</script>`;
  html = html.replace(/<style>\/\* KaTeX \(inlined\) \*\/[\s\S]*?<\/style>/, (s) => s + '\n' + katexBlock);

  // 5) Prism — inline core + grammars; drop the 5 vendor tags, insert one blob.
  const prismFiles = ['prism-core', 'prism-python', 'prism-bash', 'prism-yaml', 'prism-json'];
  let prismBlob = '';
  for (const f of prismFiles) prismBlob += `\n/* prism ${f} */\n` + await readFile(join(VENDOR, 'prism', f + '.min.js'), 'utf8');
  html = html.replace(/<script src="vendor\/prism\/prism-core\.min\.js"[\s\S]*?><\/script>/,
    fn(`<script>/* Prism (inlined, offline grammars: python bash yaml json) */${prismBlob}\n</script>`));
  html = html.replace(/<script src="vendor\/prism\/prism-(?:python|bash|yaml|json)\.min\.js"><\/script>\s*/g, '');

  // 6) qrcode-generator
  const qr = await readFile(join(VENDOR, 'qrcode/qrcode.js'), 'utf8');
  html = html.replace(/<script src="vendor\/qrcode\/qrcode\.js"[\s\S]*?><\/script>/,
    fn(`<script>/* qrcode-generator (inlined) */\n${qr}\n</script>`));

  // 7) local JS  <script src="js/X.js">
  for (const m of [...new Set([...html.matchAll(/<script src="(js\/[\w.-]+)"><\/script>/g)].map(x => x[1]))]) {
    const js = await readFile(join(ROOT, m), 'utf8');
    html = html.replace(new RegExp(`<script src="${m.replace('.', '\\.')}"></script>`, 'g'),
      fn(`<script>/* ${m} */\n${js}\n</script>`));
    log('inlined', m);
  }

  // sanity: no remaining external http(s) or un-inlined vendor refs
  const leftovers = [...new Set([...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]))];
  if (leftovers.length) log('WARNING: external <src>/<href> remain:', leftovers);
  else log('OK: no external <src>/<href> references remain.');
  const vleft = [...new Set([...html.matchAll(/(?:src|href)="(vendor\/[^"]+)"/g)].map(m => m[1]))];
  if (vleft.length) log('WARNING: vendor refs not inlined:', vleft);
  else log('OK: all vendor refs inlined.');

  /* A src=/href= scan misses URLs fetched at RUNTIME from JS strings — e.g.
     lab.js's arxiv-quote `fetch('https://export.arxiv.org/…')` and the Pyodide
     loader `script.src = 'https://cdn.jsdelivr.net/pyodide/…'`. These don't
     fire in the default deck, but a lecturer who enables those features turns
     the "offline" file back into a networked one. Surface them explicitly. */
  const runtimeUrls = [...new Set(
    [...html.matchAll(/(?:fetch\(|\.src\s*=\s*|loadPyodide|import\()\s*['"`](https?:\/\/[^'"`]+)/g)].map(m => m[1])
      .concat([...html.matchAll(/['"`](https?:\/\/(?:export\.arxiv\.org|cdn\.jsdelivr\.net\/pyodide)[^'"`]*)/g)].map(m => m[1]))
  )];
  if (runtimeUrls.length) {
    log('NOTE: runtime-fetchable URLs remain in inlined JS (fire only if the');
    log('      lecturer enables that feature — NOT offline-safe if used):');
    runtimeUrls.forEach(u => log('        •', u));
  } else {
    log('OK: no runtime-fetchable URLs in inlined JS.');
  }

  await writeFile(OUT, html, 'utf8');
  log(`wrote ${OUT} (${(html.length / 1e6).toFixed(2)} MB)`);
}

main().catch(e => { console.error('[bundle] FAILED:', e); process.exit(1); });
