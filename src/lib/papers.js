// papers.js — load + group the course bibliography (data/papers.json) for the /papers page.
//
// data/papers.json is the SINGLE SOURCE OF TRUTH for every work cited in the course. This
// module reads it, drops the `_meta` block, and groups the entries by `area` into a stable,
// ordered structure the page iterates over (area → list, each list sorted by year then author).
//
// LANGUAGE: entry fields (authors/title/venue/url) are language-neutral; only `why` is an
// {en,ru} i18n node resolved by t() in the page. Like gallery.js / assignments.js, this module
// is NOT scanned by the i18n-coverage gate (it walks ui.js / course.json / book / widgets only),
// so the bilingual `why` prose lives here safely. Keep EN present on every {en,ru} node anyway.
//
// EASY TO EXTEND: add a work = append one object to data/papers.json with a known `area`. It
// appears in the right section automatically; no edit here. A brand-new area only needs a label
// added to AREA_LABELS + AREA_ORDER below.

import papersJson from '../../data/papers.json';

// Every work, keyed by slug, with the `_meta` documentation block removed.
export const papers = Object.fromEntries(
  Object.entries(papersJson).filter(([k]) => k !== '_meta')
);

// Stable display order of the areas (matches the audit's §2A–§2H grouping), plus bilingual
// section labels + a one-line kicker per area. An area missing from AREA_ORDER still renders
// (appended after the known ones), but add it here to control its position and label.
export const AREA_ORDER = [
  'classical-ir',
  'eval',
  'system-design',
  'nlp-embeddings',
  'neural-ranking',
  'ann',
  'rag',
  'textbook',
];

export const AREA_LABELS = {
  'classical-ir': {
    title: { en: 'Classical IR', ru: 'Классический IR' },
    kicker: {
      en: 'Probabilistic lineage, term weighting, fusion & link authority — the road to BM25.',
      ru: 'Вероятностная линия, взвешивание термов, фьюжн и ссылочный авторитет — путь к BM25.',
    },
  },
  eval: {
    title: { en: 'Evaluation & online experimentation', ru: 'Оценивание и онлайн-эксперименты' },
    kicker: {
      en: 'Ranking metrics, test collections, significance, click bias & A/B testing.',
      ru: 'Метрики ранжирования, тест-коллекции, значимость, click-смещение и A/B-тесты.',
    },
  },
  'system-design': {
    title: { en: 'Search as system design', ru: 'Поиск как проектирование системы' },
    kicker: {
      en: 'Why a model is not a system: the vocabulary gap, query intent, technical debt.',
      ru: 'Почему модель — это не система: разрыв словаря, намерение запроса, техдолг.',
    },
  },
  'nlp-embeddings': {
    title: { en: 'NLP, tokenization & embedding geometry', ru: 'NLP, токенизация и геометрия эмбеддингов' },
    kicker: {
      en: 'Subword tokenizers, word & contextual embeddings, and high-dimensional geometry.',
      ru: 'Под-словные токенизаторы, словные и контекстные эмбеддинги, геометрия высоких размерностей.',
    },
  },
  'neural-ranking': {
    title: { en: 'Neural ranking & dense/sparse retrieval', ru: 'Нейронное ранжирование и плотный/разреженный поиск' },
    kicker: {
      en: 'Bi-encoders, late interaction, learned sparse retrieval and learning-to-rank.',
      ru: 'Би-энкодеры, поздняя интеракция, обученно-разреженный поиск и learning-to-rank.',
    },
  },
  ann: {
    title: { en: 'ANN, vector indexing & quantization', ru: 'ANN, векторное индексирование и квантование' },
    kicker: {
      en: 'Graph indexes, product quantization and the engineering of billion-scale search.',
      ru: 'Графовые индексы, продуктовое квантование и инженерия поиска по миллиардам.',
    },
  },
  rag: {
    title: { en: 'RAG, generation & multimodal retrieval', ru: 'RAG, генерация и мультимодальный поиск' },
    kicker: {
      en: 'Retrieval-augmented generation, its evaluation, agentic & multimodal variants.',
      ru: 'Поиск-дополненная генерация, её оценка, агентные и мультимодальные варианты.',
    },
  },
  textbook: {
    title: { en: 'Textbooks & course reading', ru: 'Учебники и литература курса' },
    kicker: {
      en: 'The book-length references the syllabus reading list is built from.',
      ru: 'Книжные источники, на которых построен список литературы программы.',
    },
  },
};

// A predictable within-section order: by year (oldest first), then by short-author label.
function bySection(a, b) {
  const ya = a.year ?? Infinity;
  const yb = b.year ?? Infinity;
  if (ya !== yb) return ya - yb;
  return String(a.authorsShort || '').localeCompare(String(b.authorsShort || ''));
}

// Ordered [{ area, label, kicker, items[] }]. Known areas first (AREA_ORDER), any unknown
// area appended afterwards so nothing is ever silently dropped.
export const sections = (() => {
  const groups = {};
  for (const work of Object.values(papers)) {
    const area = work.area || 'textbook';
    (groups[area] ??= []).push(work);
  }
  const known = AREA_ORDER.filter((a) => groups[a]);
  const extra = Object.keys(groups).filter((a) => !AREA_ORDER.includes(a)).sort();
  return [...known, ...extra].map((area) => ({
    area,
    label: AREA_LABELS[area]?.title || { en: area, ru: area },
    kicker: AREA_LABELS[area]?.kicker || null,
    items: groups[area].sort(bySection),
  }));
})();

// Front-matter for the page intro (an i18n node, like galleryMeta.intro). Resolved by t().
export const papersMeta = {
  intro: {
    en: 'Every work cited anywhere in the course — papers, textbooks and tools — with a real canonical link (arXiv, DOI or publisher) and a short note on why it earns its place. Grouped by area, ordered the way the course meets them. This is the bibliography the lectures, the Book and the syllabus reading list all draw from.',
    ru: 'Каждая работа, цитируемая где-либо в курсе — статьи, учебники и инструменты — с реальной канонической ссылкой (arXiv, DOI или издатель) и короткой заметкой, почему она здесь. Сгруппированы по областям в том порядке, в котором курс с ними встречается. Это библиография, из которой берут лекции, Книга и список литературы программы.',
  },
  count: {
    en: 'works',
    ru: 'работ',
  },
};
