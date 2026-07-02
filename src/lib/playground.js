// playground.js — build-time grouping + taxonomy for the interactive Playground (/[lang]/playground).
//
// DATA-DRIVEN: the Playground does NOT hardcode a widget list. It reuses WIDGET_META + DATA from
// widgets.js (which auto-globs `widgets/*/manifest.json` + `data/*.json` at build time), so dropping
// a new `widgets/<id>/` folder makes the demo appear automatically — ZERO edits here. This module
// only adds (a) a LECTURE grouping and a TOPIC taxonomy for the cards (BOTH dimensions stay live so
// the page + client can facet on either), and (b) the per-widget data payload the page injects
// (the same { data, labels } the Book mounts with).
//
// LECTURE GROUPING: widgets carry no explicit `lecture` field, but their referenced data files are
// named `l<N>-*` (e.g. `l3-bm25`, `l6-attention`). We derive the lecture from that prefix. Two
// widgets have no data file (course-map = the L0 spine, transformer-block = an L6 schematic); a tiny
// override map places them. Any FUTURE widget whose data is `l<N>-…` (e.g. a `tokenizer-compare` →
// `l2-…`) lands in its lecture group with no edit; one with novel/no data falls into an "Extras"
// group so it is never dropped.
//
// TOPIC TAXONOMY: ~7 trilingual CONCEPT topics cut ACROSS lectures (e.g. embeddings span L02 + L05).
// Every known widget id maps to ONE primary topic via TOPIC_OF. A widget with NO assigned topic
// falls into the resilient "other" bucket (never dropped). A FUTURE widget auto-appears in the grid
// (it's enumerated from the registry) under "other"; classify it by adding ONE line to TOPIC_OF.

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
  { id: '07', title: { en: 'L07 · Scouts and Judges — bi/cross-encoders', ru: 'L07 · Разведчики и судьи — би/кросс-энкодеры', tt: 'L07 · Разведчиклар һәм хөкемчеләр — би/кросс-энкодерлар' } },
  { id: '08', title: { en: 'L08 · The Alliance — late interaction, SPLADE, LTR', ru: 'L08 · Альянс — позднее взаимодействие, SPLADE, LTR', tt: 'L08 · Альянс — соңгы үзара тәэсир, SPLADE, LTR' } },
  { id: '09', title: { en: 'L09 · Hyperspace Lanes — ANN (HNSW, IVF, PQ)', ru: 'L09 · Гиперпространственные трассы — ANN (HNSW, IVF, PQ)', tt: 'L09 · Гиперкосмик юллар — ANN (HNSW, IVF, PQ)' } },
  { id: '10', title: { en: 'L10 · The Oracle — RAG, chunking, queries', ru: 'L10 · Оракул — RAG, чанкование, запросы', tt: 'L10 · Оракул — RAG, чанклау, сораулар' } },
  { id: '11', title: { en: 'L11 · Judging the Oracle — RAG eval & agentic', ru: 'L11 · Судим Оракула — оценка RAG и агентность', tt: 'L11 · Оракулны хөкем итү — RAG бәяләү һәм агентлык' } },
  { id: '12', title: { en: 'L12 · The Deep Field — advanced & multimodal RAG', ru: 'L12 · Глубокое поле — продвинутый и мультимодальный RAG', tt: 'L12 · Тирән кыр — алга киткән һәм мультимодаль RAG' } },
  { id: '13', title: { en: 'L13 · The Crucible of Negatives (deep-dive)', ru: 'L13 · Горнило негативов (углублённо)', tt: 'L13 · Негативлар горны (тирән чуму)' } },
  { id: '14', title: { en: 'L14 · The Artificer’s Quill — query rewriting (deep-dive)', ru: 'L14 · Перо Артефактора — переписывание запросов (углублённо)', tt: 'L14 · Артефактор Каләме — сорауларны язу (тирән чуму)' } },
];
const EXTRAS = { id: 'extras', title: { en: 'More demos', ru: 'Другие демо', tt: 'Башка демолар' } };

// ── TOPIC TAXONOMY (the concept dimension) ──────────────────────────────────
// ~7 trilingual concept topics. `id` is the stable facet key (used in data-topic + chip filtering);
// `title` is the trilingual label (also exposed to the i18n-coverage gate via ui.js mirrors). Order
// here is the chip display order. "other" is the resilient catch-all and is appended last by code.
export const TOPICS = [
  { id: 'foundations',  title: { en: 'Foundations & the IR spine', ru: 'Основы и каркас IR', tt: 'Нигезләр һәм IR кылыч сөяге' } },
  { id: 'tokenization', title: { en: 'Tokenization & text', ru: 'Токенизация и текст', tt: 'Токенлаштыру һәм текст' } },
  { id: 'retrieval',    title: { en: 'Classical retrieval & ranking', ru: 'Классический поиск и ранжирование', tt: 'Классик эзләү һәм ранжлау' } },
  { id: 'embeddings',   title: { en: 'Embeddings & geometry', ru: 'Эмбеддинги и геометрия', tt: 'Эмбеддинглар һәм геометрия' } },
  { id: 'dimred',       title: { en: 'Dimensionality reduction', ru: 'Снижение размерности', tt: 'Үлчәмлелекне киметү' } },
  { id: 'transformers', title: { en: 'Attention & Transformers', ru: 'Внимание и трансформеры', tt: 'Игътибар һәм трансформерлар' } },
  { id: 'evaluation',   title: { en: 'Evaluation & metrics', ru: 'Оценивание и метрики', tt: 'Бәяләү һәм метрикалар' } },
];
// The resilient catch-all: any widget id NOT in TOPIC_OF (incl. every future widget) lands here, so
// no demo is ever dropped from the grid or the topic facet.
export const OTHER_TOPIC = { id: 'other', title: { en: 'Other / misc', ru: 'Прочее', tt: 'Башка / төрле' } };

// id → primary topic. Classified by reading each widget's title/data (see header). Adding a NEW
// widget needs only ONE line here to classify it; omit the line and it auto-buckets into "other".
const TOPIC_OF = {
  // Foundations & the IR spine
  'course-map': 'foundations',
  'retrieve-rank-funnel': 'foundations',
  'pos-bias-curve': 'foundations',
  // Tokenization & text
  'bpe-merge-ledger': 'tokenization',
  'bpe-steps': 'tokenization',
  'tokenizer-compare': 'tokenization',
  'zipf-heaps': 'tokenization',
  // Classical retrieval & ranking
  'bm25-calc': 'retrieval',
  'inverted-index': 'retrieval',
  'pagerank-power': 'retrieval',
  'postings-compression': 'retrieval',
  'rrf-fusion': 'retrieval',
  'query-rewriter': 'retrieval',
  // Embeddings & geometry
  'cosine-compute': 'embeddings',
  'cosine-sphere': 'embeddings',
  'embedding-space': 'embeddings',
  'embedding-domains': 'embeddings',
  'glove-cooccur': 'embeddings',
  'skipgram-net': 'embeddings',
  'contrastive-space': 'embeddings',
  'hyde-embed': 'embeddings',
  // Dimensionality reduction
  'highd-histogram': 'dimred',
  'dimred-projection': 'dimred',
  'pca-rotate': 'dimred',
  'tsne-migrate': 'dimred',
  'tsne-steps': 'dimred',
  // Attention & Transformers
  'attention-e2e': 'transformers',
  'attention-geometry': 'transformers',
  'block-geometry': 'transformers',
  'layernorm-viz': 'transformers',
  'positional-enc': 'transformers',
  'residual-stream': 'transformers',
  'transformer-block': 'transformers',
  // Evaluation & metrics
  'ab-test': 'evaluation',
  'ndcg-graded': 'evaluation',
  'ndcg-multiquery': 'evaluation',
  'ranking-metrics': 'evaluation',
  'significance-test': 'evaluation',
};

// Resolve a widget's primary topic id; unknown → 'other' (resilient catch-all, never dropped).
function topicOf(id) {
  return TOPIC_OF[id] || OTHER_TOPIC.id;
}

// The full topic list in display order, with the catch-all appended. The page renders chips from
// this; topics with zero demos are filtered out at render time (see topicFacets).
export const TOPIC_LIST = [...TOPICS, OTHER_TOPIC];

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
// everything the page needs to render a card + the client payload to mount the widget. BOTH facet
// dimensions (lecture + topic) are attached so the toolbar can filter on either.
export function buildDemos() {
  const demos = Object.entries(WIDGET_META).map(([id, { manifest, i18n }]) => ({
    id,
    title: manifest.title || { en: id },
    maxStep: typeof manifest.maxStep === 'number' ? manifest.maxStep : 0,
    lecture: lectureOf(id, manifest),
    topic: topicOf(id),
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

// The LECTURE facets actually present (for chip rendering): the GROUPS/EXTRAS entries that have at
// least one demo, with a count. Mirrors groupDemos' bucketing so chips and groups stay in sync.
export function lectureFacets(demos) {
  const count = new Map();
  for (const d of demos) {
    const key = GROUPS.some((g) => g.id === d.lecture) ? d.lecture : 'extras';
    count.set(key, (count.get(key) || 0) + 1);
  }
  return [...GROUPS, EXTRAS]
    .filter((g) => count.has(g.id))
    .map((g) => ({ id: g.id, title: g.title, count: count.get(g.id) }));
}

// The TOPIC facets actually present (for chip rendering): the TOPIC_LIST entries that have at least
// one demo, with a count. Empty topics are dropped; "other" only appears if something landed there.
export function topicFacets(demos) {
  const count = new Map();
  for (const d of demos) count.set(d.topic, (count.get(d.topic) || 0) + 1);
  return TOPIC_LIST
    .filter((t) => count.has(t.id))
    .map((t) => ({ id: t.id, title: t.title, count: count.get(t.id) }));
}
