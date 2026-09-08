#!/usr/bin/env node
/* =========================================================
   assemble-chapter.mjs — shard a Book chapter (content/book/lN.js) into per-beat
   source fragments and reassemble it BYTE-IDENTICALLY. Book analog of
   scripts/assemble-deck.mjs (shares scripts/lib/shard-harness.mjs).

   WHY: l5.js/l6.js are 54-64 k-token monoliths; editing one beat (≈ one scrolly
   step) forces an agent to swallow the whole chapter. Sharding into
   content/book/<stem>/beats/*.js means "edit beat X" touches ~1 small file —
   without changing the module: assemble(beats) === the chapter source, byte-for-byte.

   A Book chapter is `export default { id, catchphrase, beats: [ {beat}, … ] }`.
   Every beat opens with a line `^    {` (4-space indent + brace); the beats array
   closes with the single `^  ]` line. Those are the partition boundaries — the only
   chapter-specific logic (`splitChapter`); split/build/check are shared in the harness.

   SUBCOMMANDS  split <stem> | build [<stem>] | check   (stem = l0 … l6)
   A "sharded chapter" = a directory content/book/<stem>/beats/. Others are left alone.
   ========================================================= */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSharder } from './lib/shard-harness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = join(ROOT, 'content', 'book');
const BEAT_RE = /^ {4}\{/gm;        // a beat opens: line-start, 4 spaces, '{'
const CLOSE_RE = /^ {2}\]/m;        // the beats array closes: line-start, 2 spaces, ']'

function splitChapter(src) {
  const offsets = [];
  let m;
  BEAT_RE.lastIndex = 0;
  while ((m = BEAT_RE.exec(src))) offsets.push(m.index);
  if (offsets.length === 0) throw new Error('no beat (^    {) found — not a shardable chapter');

  const close = CLOSE_RE.exec(src.slice(offsets[offsets.length - 1]));
  if (!close) throw new Error('no beats-array close (^  ]) after the last beat');
  const tailStart = offsets[offsets.length - 1] + close.index;

  const parts = [];
  parts.push({ name: '00-head.js', content: src.slice(0, offsets[0]) });
  for (let i = 0; i < offsets.length; i++) {
    const end = i < offsets.length - 1 ? offsets[i + 1] : tailStart;
    const content = src.slice(offsets[i], end);
    const id = (content.match(/id: '([^']+)'/) || [, 'beat'])[1];
    const nn = String(i + 1).padStart(2, '0');
    parts.push({ name: `${nn}-${id}.js`, content });
  }
  parts.push({ name: 'zz-tail.js', content: src.slice(tailStart) });

  if (parts.map((p) => p.content).join('') !== src) throw new Error('internal: partition is not byte-exact');
  return parts;
}

makeSharder({
  baseDir: BOOK, ext: '.js', markerDir: 'beats', split: splitChapter,
  noun: 'chapter', unitArg: 'stem', monoLabel: (s) => `content/book/${s}.js`,
  buildSlug: 'scripts/assemble-chapter.mjs',
}).run(process.argv.slice(2));
