/* =========================================================
   shard-harness.mjs — shared split/build/check engine for the two shard tools
   (scripts/assemble-deck.mjs and scripts/assemble-chapter.mjs).

   A "sharder" partitions a monolith (a lecture deck, or a Book chapter) into
   per-unit source fragments under <baseDir>/<name>/<markerDir>/ and reassembles it
   BYTE-IDENTICALLY: assemble(fragments) === the committed monolith. The ONLY
   per-domain logic is `split(src)` (where the partition boundaries are); the
   assemble/discover/split/build/check subcommands and the argv dispatch are all
   shared here — `cmdBuild` writes the exact same bytes the per-domain script did.

   `split(src)` must return an array of { name, content } whose `content` values,
   concatenated in array order, reproduce `src` EXACTLY (it should self-check that).
   Discovery is by the PRESENCE OF A <markerDir>/ dir, NOT the unit file — the unit
   file is BUILD OUTPUT (gitignored) and may be absent on a fresh checkout.
   ========================================================= */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function makeSharder({ baseDir, ext, markerDir, split, noun, unitArg, monoLabel, buildSlug }) {
  const unitPath = (name) => join(baseDir, `${name}${ext}`);
  const fragDir = (name) => join(baseDir, name, markerDir);

  // read every <ext> fragment, sort by filename, concatenate verbatim → byte-identical reassembly
  const assemble = (dir) =>
    readdirSync(dir).filter((f) => f.endsWith(ext)).sort()
      .map((f) => readFileSync(join(dir, f), 'utf8')).join('');

  // discover sharded units by the presence of a <markerDir>/ dir (the unit file is
  // gitignored build output, possibly absent until `build` regenerates it)
  const sharded = () =>
    readdirSync(baseDir).filter((name) => {
      try { return statSync(join(baseDir, name)).isDirectory() && existsSync(join(baseDir, name, markerDir)); }
      catch { return false; }
    }).sort();

  function cmdSplit(name) {
    if (!name) { console.error(`usage: split <${unitArg}>`); process.exit(2); }
    const src = readFileSync(unitPath(name), 'utf8');
    const parts = split(src);
    const dir = fragDir(name);
    mkdirSync(dir, { recursive: true });
    for (const p of parts) writeFileSync(join(dir, p.name), p.content);
    if (assemble(dir) !== src) { console.error('[split] FAIL: reassembly differs from source'); process.exit(1); }
    console.log(`[split] ${name}: ${parts.length} fragments (${parts.length - 2} ${noun} bodies) → ${dir} (byte-identical ✓)`);
  }

  function cmdBuild(name) {
    const names = name ? [name] : sharded();
    if (!names.length) { console.log(`[build] no sharded ${noun}s`); return; }
    for (const s of names) {
      const src = assemble(fragDir(s));
      writeFileSync(unitPath(s), src);
      console.log(`[build] ${s}: ${src.length} bytes written`);
    }
  }

  function cmdCheck() {
    const names = sharded();
    if (!names.length) { console.log(`[check] no sharded ${noun}s — nothing to verify`); return; }
    let drift = 0;
    for (const s of names) {
      const assembled = assemble(fragDir(s));
      if (!existsSync(unitPath(s))) { console.log(`  · ${s}: not built yet (${monoLabel(s)} is build output) — run npm run build`); continue; }
      if (assembled === readFileSync(unitPath(s), 'utf8')) console.log(`  ✓ ${s}: on-disk ${noun} === assemble(fragments)`);
      else { drift++; console.log(`  ✗ STALE ${s}: ${monoLabel(s)} != assemble(fragments). Run: node ${buildSlug} build ${s}`); }
    }
    if (drift) { console.error(`[check] ${drift} ${noun}(s) stale — on-disk disagrees with fragments (rebuild)`); process.exit(1); }
    console.log(`[check] ${names.length} sharded ${noun}(s) checked`);
  }

  function run(argv) {
    const [cmd, arg] = argv;
    if (cmd === 'split') cmdSplit(arg);
    else if (cmd === 'build') cmdBuild(arg);
    else if (cmd === 'check') cmdCheck();
    else { console.error(`usage: ${buildSlug} <split|build|check> [${unitArg}]`); process.exit(2); }
  }

  return { run, assemble, sharded, cmdSplit, cmdBuild, cmdCheck };
}
