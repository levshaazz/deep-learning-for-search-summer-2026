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

   The shipped Lectures/<slug>.html is BUILD OUTPUT (gitignored); the fragments are
   the EDITABLE source. `check` is the drift-guard. The shared split/build/check
   engine lives in scripts/lib/shard-harness.mjs — only `splitDeck` (where a deck's
   partition boundaries are) is deck-specific.

   SUBCOMMANDS  split <slug> | build [<slug>] | check   (run from repo root)
   A "sharded deck" = a directory Lectures/<slug>/parts/. Others are left alone.
   ========================================================= */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSharder } from './lib/shard-harness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LECT = join(ROOT, 'Lectures');
const SECTION_RE = /<section class="slide"/g;

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'slide';
}

// Partition the deck into byte-exact fragments: head | one fragment per
// <section class="slide"> | tail. Concatenating the `content` values in array
// order reproduces the input EXACTLY (self-checked) → byte-identity on reassembly.
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

  if (parts.map((p) => p.content).join('') !== html) throw new Error('internal: partition is not byte-exact');
  return parts;
}

makeSharder({
  baseDir: LECT, ext: '.html', markerDir: 'parts', split: splitDeck,
  noun: 'deck', unitArg: 'slug', monoLabel: (s) => `Lectures/${s}.html`,
  buildSlug: 'scripts/assemble-deck.mjs',
}).run(process.argv.slice(2));
