// playground.js — build-time grouping for the interactive Playground (/[lang]/playground).
//
// DATA-DRIVEN: the Playground does NOT hardcode a widget list. It reuses WIDGET_META + DATA from
// widgets.js (which auto-globs `widgets/*/manifest.json` + `data/*.json` at build time), so dropping
// a new `widgets/<id>/` folder makes the demo appear automatically — ZERO edits here. This module
// only adds (a) a lecture/topic grouping for the cards, and (b) the per-widget data payload the page
// injects (the same { data, labels } the Book mounts with).
//
// GROUPING: widgets carry no explicit `lecture` field, but their referenced data files are named
// `l<N>-*` (e.g. `l3-bm25`, `l6-attention`). We derive the lecture from that prefix. Two widgets have
// no data file (course-map = the L0 spine, transformer-block = an L6 schematic); a tiny override map
// places them. Any FUTURE widget whose data is `l<N>-…` (e.g. a `tokenizer-compare` → `l2-…`) lands
// in its lecture group with no edit; one with novel/no data falls into an "Extras" group so it is
// never dropped.

import { WIDGET_META, DATA } from './widgets.js';

// id → lecture override for widgets whose data file doesn't encode a lecture (empty `data`), or that
// should sit somewhere other than their data prefix would imply. Keep tiny.
const LECTURE_OVERRIDE = {
  'course-map': '00',        // the Get-Data → Measure → Rank spine (L0 briefing)
  'transformer-block': '06', // the block schematic (L6), no data file
};

// Derive a lecture id ('00'..'06' or null) for a widget from its first data key's `l<N>-` prefix.
function lectureOf(id, manifest) {
  if (LECTURE_OVERRIDE[id]) return LECTURE_OVERRIDE[id];
  const key = (manifest.data || [])[0] || '';
  const m = /^l(\d+)-/.exec(key);
  return m ? String(m[1]).padStart(2, '0') : null;
}

// Per-lecture group titles (trilingual). The order here is the display order. A widget whose lecture
// isn't listed (e.g. a future L7) still renders, under an "extras" bucket at the end.
export const GROUPS = [
  { id: '00', title: { en: 'L00 · The Galaxy of Information', ru: 'L00 · Галактика Информации', tt: 'L00 · Мәгълүмат Галактикасы' } },
  { id: '01', title: { en: 'L01 · Retrieval & ranking shape', ru: 'L01 · Форма поиска и ранжирования', tt: 'L01 · Эзләү һәм ранжлау формасы' } },
  { id: '02', title: { en: 'L02 · Tokens, vectors & geometry', ru: 'L02 · Токены, векторы и геометрия', tt: 'L02 · Токеннар, векторлар һәм геометрия' } },
  { id: '03', title: { en: 'L03 · Classical IR — index, BM25, fusion', ru: 'L03 · Классический IR — индекс, BM25, слияние', tt: 'L03 · Классик IR — индекс, BM25, кушу' } },
  { id: '04', title: { en: 'L04 · Ranking metrics & significance', ru: 'L04 · Метрики ранжирования и значимость', tt: 'L04 · Ранжлау метрикалары һәм мөһимлек' } },
  { id: '05', title: { en: 'L05 · Embeddings & dimensionality', ru: 'L05 · Эмбеддинги и размерность', tt: 'L05 · Эмбеддинглар һәм үлчәмлелек' } },
  { id: '06', title: { en: 'L06 · The Council of Attention', ru: 'L06 · Совет Внимания', tt: 'L06 · Игътибар Шурасы' } },
];
const EXTRAS = { id: 'extras', title: { en: 'More demos', ru: 'Другие демо', tt: 'Башка демолар' } };

// Merge every data file a manifest references into one object (first-listed key wins on a collision —
// mirrors the Book, which injects the primary data file per beat). Empty `data` → {} (the widget
// supplies its own defaults, e.g. transformer-block / course-map).
function mergeData(manifest) {
  const out = {};
  for (const key of [...(manifest.data || [])].reverse()) {       // reverse so the FIRST key wins
    const d = DATA[key];
    if (d && typeof d === 'object' && !Array.isArray(d)) Object.assign(out, d);
    else if (d !== undefined) return d;                            // non-object payload → use as-is
  }
  return out;
}

// PASCAL mount-name fallback (same rule as the Book + deck-adapter) for widgets that omit
// manifest.export (e.g. cosine-sphere).
const pascalMount = (id) => 'mount' + id.split('-').map((s) => s[0].toUpperCase() + s.slice(1)).join('');

// Build the full list of demos from the auto-registered widget metadata. Each entry carries
// everything the page needs to render a card + the client payload to mount the widget.
export function buildDemos() {
  const demos = Object.entries(WIDGET_META).map(([id, { manifest, i18n }]) => ({
    id,
    title: manifest.title || { en: id },
    maxStep: typeof manifest.maxStep === 'number' ? manifest.maxStep : 0,
    lecture: lectureOf(id, manifest),
    mountName: manifest['export'] || pascalMount(id),
    data: mergeData(manifest),
    i18n: i18n || {},          // flat { key: {en,ru,tt} } map — resolved per-lang on the page
  }));
  // stable order: by id (so the grid is deterministic across builds)
  demos.sort((a, b) => a.id.localeCompare(b.id));
  return demos;
}

// Group demos by lecture into the GROUPS order; unknown lectures fall into EXTRAS. Empty groups are
// dropped so the page only shows lectures that actually have widgets.
export function groupDemos(demos) {
  const byLec = new Map();
  for (const d of demos) {
    const key = GROUPS.some((g) => g.id === d.lecture) ? d.lecture : 'extras';
    if (!byLec.has(key)) byLec.set(key, []);
    byLec.get(key).push(d);
  }
  const ordered = [...GROUPS, EXTRAS]
    .filter((g) => byLec.has(g.id))
    .map((g) => ({ ...g, items: byLec.get(g.id) }));
  return ordered;
}
