#!/usr/bin/env node
/* =========================================================
   assemble-deck.mjs — shard a monolith lecture deck into per-slide source
   fragments and reassemble it BYTE-IDENTICALLY.

   WHY: a deck like Lectures/05-*.html is a 90 k-token monolith; editing one
   slide forces an agent to swallow the whole file. Sharding it into
   Lectures/<slug>/parts/*.html (one fragment per <section class="slide">) means
   "edit slide 5" touches ~1 small file, not the monolith — without changing the
   shipped output: assemble(parts) === the committed Lectures/<slug>.html, proven
   byte-for-byte (the parts are an exact partition of the original file).

   The committed Lectures/<slug>.html stays authoritative (so every gate, the
   build, copy-static and the offline file:// guarantee are untouched). The
   fragments are the EDITABLE source; `check` is the drift-guard that fails if the
   committed deck and its fragments disagree.

   SUBCOMMANDS
     split <slug>     one-time author tool: partition Lectures/<slug>.html into
                      Lectures/<slug>/parts/{00-head, NN-<label>, zz-tail}.html
     build [<slug>]   reassemble one sharded deck (or, with no arg, ALL sharded
                      decks) from its parts → overwrite Lectures/<slug>.html
     check            drift-guard (CI): for every sharded deck assert
                      assemble(parts) === committed Lectures/<slug>.html; exit 1
                      on any drift. Auto-discovers sharded decks (a Lectures/<slug>/
                      with a parts/ dir) → adding L7 needs ZERO edits here.

   A "sharded deck" = a directory Lectures/<slug>/parts/ next to Lectures/<slug>.html.
   Decks without a parts/ dir are left completely alone.
   ========================================================= */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LECT = join(ROOT, 'Lectures');
const SECTION_RE = /<section class="slide"/g;

const deckPath = (slug) => join(LECT, `${slug}.html`);
const partsDir = (slug) => join(LECT, slug, 'parts');

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'slide';
}

// Partition the deck into byte-exact fragments. Concatenating the returned
// `content` values in array order reproduces the input string EXACTLY (no gaps,
// no overlaps) — that is what guarantees byte-identity on reassembly.
function splitDeck(html) {
  const offsets = [];
  let m;
  SECTION_RE.lastIndex = 0;
  while ((m = SECTION_RE.exec(html))) offsets.push(m.index);
  if (offsets.length === 0) throw new Error('no <section class="slide"> found — not a shardable deck');

  const closeTag = '</section>';
  const tailStart = html.lastIndexOf(closeTag) + closeTag.length;
  if (tailStart < offsets[offsets.length - 1]) throw new Error('last </section> precedes last <section> — unexpected structure');

  const parts = [];
  parts.push({ name: '00-head.html', content: html.slice(0, offsets[0]) });
  for (let i = 0; i < offsets.length; i++) {
    const end = i < offsets.length - 1 ? offsets[i + 1] : tailStart;
    const content = html.slice(offsets[i], end);
    const label = (content.match(/data-screen-label="\s*\d*\s*([^"]*)"/) || [, ''])[1].trim();
    const nn = String(i + 1).padStart(2, '0');
    parts.push({ name: `${nn}-${slugify(label)}.html`, content });
  }
  parts.push({ name: 'zz-tail.html', content: html.slice(tailStart) });

  // self-check: the partition must round-trip exactly.
  if (parts.map((p) => p.content).join('') !== html) throw new Error('internal: partition is not byte-exact');
  return parts;
}

// Reassemble: read every *.html fragment, sort by filename, concatenate verbatim.
function assembleParts(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
  return files.map((f) => readFileSync(join(dir, f), 'utf8')).join('');
}

// Discover sharded decks by the PRESENCE OF A parts/ DIR (Lectures/<slug>/parts/).
// NOT by the deck file — the deck Lectures/<slug>.html is BUILD OUTPUT (gitignored) and
// may be absent on a fresh checkout until `build` regenerates it.
function shardedSlugs() {
  return readdirSync(LECT)
    .filter((name) => {
      const d = join(LECT, name);
      try { return statSync(d).isDirectory() && existsSync(join(d, 'parts')); }
      catch { return false; }
    })
    .sort();
}

function cmdSplit(slug) {
  if (!slug) { console.error('usage: assemble-deck.mjs split <slug>'); process.exit(2); }
  const html = readFileSync(deckPath(slug), 'utf8');
  const parts = splitDeck(html);
  const dir = partsDir(slug);
  mkdirSync(dir, { recursive: true });
  for (const p of parts) writeFileSync(join(dir, p.name), p.content);
  // prove the just-written parts reassemble byte-identically
  if (assembleParts(dir) !== html) { console.error('[split] FAIL: reassembly differs from source'); process.exit(1); }
  console.log(`[split] ${slug}: ${parts.length} fragments → ${dir} (byte-identical ✓)`);
}

function cmdBuild(slug) {
  const slugs = slug ? [slug] : shardedSlugs();
  if (!slugs.length) { console.log('[build] no sharded decks'); return; }
  for (const s of slugs) {
    const html = assembleParts(partsDir(s));
    writeFileSync(deckPath(s), html);
    console.log(`[build] ${s}: ${html.length} bytes written`);
  }
}

function cmdCheck() {
  const slugs = shardedSlugs();
  if (!slugs.length) { console.log('[check] no sharded decks — nothing to verify'); return; }
  let drift = 0;
  for (const s of slugs) {
    const assembled = assembleParts(partsDir(s));
    if (!existsSync(deckPath(s))) { console.log(`  · ${s}: not built yet (Lectures/${s}.html is build output) — run npm run build`); continue; }
    const onDisk = readFileSync(deckPath(s), 'utf8');
    if (assembled === onDisk) {
      console.log(`  ✓ ${s}: on-disk deck === assemble(parts)`);
    } else {
      drift++;
      console.log(`  ✗ STALE ${s}: Lectures/${s}.html != assemble(parts). Run: node scripts/assemble-deck.mjs build ${s}`);
    }
  }
  if (drift) { console.error(`[check] ${drift} deck(s) stale — on-disk deck disagrees with fragments (rebuild)`); process.exit(1); }
  console.log(`[check] ${slugs.length} sharded deck(s) checked`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'split') cmdSplit(arg);
else if (cmd === 'build') cmdBuild(arg);
else if (cmd === 'check') cmdCheck();
else { console.error('usage: assemble-deck.mjs <split|build|check> [slug]'); process.exit(2); }
