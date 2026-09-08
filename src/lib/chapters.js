// Auto-discovered Book chapters — the single source of truth for "which chapters exist".
// Adding content/book/lN.js (with a unique `id`) is picked up here with ZERO edits: no import wall,
// no id list, no CHAPTERS map to maintain (was a triple hand-registration in book/[id].astro).
// Importing this module (rather than calling import.meta.glob inside getStaticPaths, which the Astro
// compiler mis-extracts) keeps getStaticPaths happy — it may reference imports.
const modules = import.meta.glob('../../content/book/l*.js', { eager: true });

/** All chapters, ordered by id (e.g. '00','01',… ,'06'). */
export const chapters = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

/** id → chapter object. */
export const chapterById = Object.fromEntries(chapters.map((c) => [c.id, c]));

/** Just the chapter ids, ordered. */
export const chapterIds = chapters.map((c) => c.id);
