#!/usr/bin/env node
/* =========================================================
   assemble-chapter.mjs — shard a Book chapter (content/book/lN.js) into per-beat
   source fragments and reassemble it BYTE-IDENTICALLY. Book analog of
   scripts/assemble-deck.mjs.

   WHY: l5.js/l6.js are 54-64 k-token monoliths; editing one beat (≈ one scrolly
   step) forces an agent to swallow the whole chapter. Sharding into
   content/book/<stem>/beats/*.js means "edit beat X" touches ~1 small file —
   without changing the module: assemble(beats) === the chapter source, byte-for-byte
   (the fragments are an exact partition of the original file).

   A Book chapter is `export default { id, catchphrase, beats: [ {beat}, {beat}, … ] }`.
   Every beat opens with a line `^    {` (4-space indent + brace); the beats array
   closes with the single `^  ]` line. Those are the partition boundaries.

   SUBCOMMANDS
     split <stem>     author tool: partition content/book/<stem>.js into
                      content/book/<stem>/beats/{00-head, NN-<beatid>, zz-tail}.js
     build [<stem>]   reassemble one sharded chapter (or all) → content/book/<stem>.js
     check            drift-guard: for every sharded chapter, assert
                      assemble(beats) === on-disk content/book/<stem>.js; exit 1 on
                      drift. Auto-discovers sharded chapters (a <stem>/beats/ dir).

   stem = the filename without .js (l0 … l6). A "sharded chapter" = a directory
   content/book/<stem>/beats/. Chapters without it are left alone.
   ========================================================= */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = join(ROOT, 'content', 'book');
const BEAT_RE = /^ {4}\{/gm;        // a beat opens: line-start, 4 spaces, '{'
const CLOSE_RE = /^ {2}\]/m;        // the beats array closes: line-start, 2 spaces, ']'

const chapterPath = (stem) => join(BOOK, `${stem}.js`);
const beatsDir = (stem) => join(BOOK, stem, 'beats');

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

function assembleBeats(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
  return files.map((f) => readFileSync(join(dir, f), 'utf8')).join('');
}

function shardedStems() {
  return readdirSync(BOOK)
    .filter((name) => {
      const d = join(BOOK, name);
      try { return statSync(d).isDirectory() && existsSync(join(d, 'beats')); }
      catch { return false; }
    })
    .sort();
}

function cmdSplit(stem) {
  if (!stem) { console.error('usage: assemble-chapter.mjs split <stem>  (e.g. l5)'); process.exit(2); }
  const src = readFileSync(chapterPath(stem), 'utf8');
  const parts = splitChapter(src);
  const dir = beatsDir(stem);
  mkdirSync(dir, { recursive: true });
  for (const p of parts) writeFileSync(join(dir, p.name), p.content);
  if (assembleBeats(dir) !== src) { console.error('[split] FAIL: reassembly differs from source'); process.exit(1); }
  console.log(`[split] ${stem}: ${parts.length} fragments (${parts.length - 2} beats) → ${dir} (byte-identical ✓)`);
}

function cmdBuild(stem) {
  const stems = stem ? [stem] : shardedStems();
  if (!stems.length) { console.log('[build] no sharded chapters'); return; }
  for (const s of stems) {
    const src = assembleBeats(beatsDir(s));
    writeFileSync(chapterPath(s), src);
    console.log(`[build] ${s}: ${src.length} bytes written`);
  }
}

function cmdCheck() {
  const stems = shardedStems();
  if (!stems.length) { console.log('[check] no sharded chapters'); return; }
  let drift = 0;
  for (const s of stems) {
    const assembled = assembleBeats(beatsDir(s));
    if (!existsSync(chapterPath(s))) { console.log(`  · ${s}: not built yet (content/book/${s}.js is build output) — run npm run build`); continue; }
    const onDisk = readFileSync(chapterPath(s), 'utf8');
    if (assembled === onDisk) console.log(`  ✓ ${s}: on-disk chapter === assemble(beats)`);
    else { drift++; console.log(`  ✗ STALE ${s}: content/book/${s}.js != assemble(beats). Run: node scripts/assemble-chapter.mjs build ${s}`); }
  }
  if (drift) { console.error(`[check] ${drift} chapter(s) stale — rebuild`); process.exit(1); }
  console.log(`[check] ${stems.length} sharded chapter(s) checked`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'split') cmdSplit(arg);
else if (cmd === 'build') cmdBuild(arg);
else if (cmd === 'check') cmdCheck();
else { console.error('usage: assemble-chapter.mjs <split|build|check> [stem]'); process.exit(2); }
