/* paths.mjs — dependency-FREE shared path constants for the gates.
   Kept separate from gate-harness.mjs (which eagerly imports playwright): the pure non-browser gates
   (font/beat-coverage/i18n/scroll-step/token) must NOT pull a Chromium dependency in just to learn the
   repo root. `'..','..'` climbs from _audit/lib/ to the repo root — byte-identical to each gate's prior
   local `const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')` (which resolved from _audit/). */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
