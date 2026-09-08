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
    title: { en: 'Classical IR', ru: 'Классический IR', tt: 'Классик IR' },
    kicker: {
      en: 'Probabilistic lineage, term weighting, fusion & link authority — the road to BM25.',
      ru: 'Вероятностная линия, взвешивание термов, слияние и ссылочный авторитет — путь к BM25.',
      tt: 'Ихтималлык нәселе, термнарны үлчәү, кушу һәм сылтама абруе — BM25’ка юл.',
    },
  },
  eval: {
    title: { en: 'Evaluation & online experimentation', ru: 'Оценивание и онлайн-эксперименты', tt: 'Бәяләү һәм онлайн экспериментлар' },
    kicker: {
      en: 'Ranking metrics, test collections, significance, click bias & A/B testing.',
      ru: 'Метрики ранжирования, тест-коллекции, значимость, click-смещение и A/B-тесты.',
      tt: 'Ранжлау метрикалары, тест-коллекцияләр, мөһимлек, клик-янтаю һәм A/B тестлау.',
    },
  },
  'system-design': {
    title: { en: 'Search as system design', ru: 'Поиск как проектирование системы', tt: 'Эзләү система дизайны буларак' },
    kicker: {
      en: 'Why a model is not a system: the vocabulary gap, query intent, technical debt.',
      ru: 'Почему модель — это не система: словарный разрыв, намерение запроса, техдолг.',
      tt: 'Ни өчен модель — система түгел: сүзлек аермасы, сорау максаты, техник бурыч.',
    },
  },
  'nlp-embeddings': {
    title: { en: 'NLP, tokenization & embedding geometry', ru: 'NLP, токенизация и геометрия эмбеддингов', tt: 'NLP, токенлаштыру һәм эмбеддинг геометриясе' },
    kicker: {
      en: 'Subword tokenizers, word & contextual embeddings, and high-dimensional geometry.',
      ru: 'Под-словные токенизаторы, словные и контекстные эмбеддинги, геометрия высоких размерностей.',
      tt: 'Сүзасты токенлаштыргычлар, сүз һәм контекст эмбеддинглары, югары үлчәмле геометрия.',
    },
  },
  'neural-ranking': {
    title: { en: 'Neural ranking & dense/sparse retrieval', ru: 'Нейронное ранжирование и плотный/разреженный поиск', tt: 'Нейрон ранжлау һәм тыгыз/сирәк эзләү' },
    kicker: {
      en: 'Bi-encoders, late interaction, learned sparse retrieval and learning-to-rank.',
      ru: 'Би-энкодеры, позднее взаимодействие, обученно-разреженный поиск и learning-to-rank.',
      tt: 'Би-энкодерлар, соңгы үзара тәэсир, өйрәнелгән сирәк эзләү һәм learning-to-rank.',
    },
  },
  ann: {
    title: { en: 'ANN, vector indexing & quantization', ru: 'ANN, векторное индексирование и квантование', tt: 'ANN, вектор индекслау һәм квантлау' },
    kicker: {
      en: 'Graph indexes, product quantization and the engineering of billion-scale search.',
      ru: 'Графовые индексы, продуктовое квантование и инженерия поиска по миллиардам.',
      tt: 'Граф индекслары, продукт квантлау һәм миллиард масштаблы эзләү инженериясе.',
    },
  },
  rag: {
    title: { en: 'RAG, generation & multimodal retrieval', ru: 'RAG, генерация и мультимодальный поиск', tt: 'RAG, генерация һәм мультимодаль эзләү' },
    kicker: {
      en: 'Retrieval-augmented generation, its evaluation, agentic & multimodal variants.',
      ru: 'Поиск-дополненная генерация, её оценка, агентные и мультимодальные варианты.',
      tt: 'Эзләү белән баетылган генерация, аны бәяләү, агент һәм мультимодаль вариантлар.',
    },
  },
  textbook: {
    title: { en: 'Textbooks & course reading', ru: 'Учебники и литература курса', tt: 'Дәреслекләр һәм курс әдәбияты' },
    kicker: {
      en: 'The book-length references the syllabus reading list is built from.',
      ru: 'Книжные источники, на которых построен список литературы программы.',
      tt: 'Программа әдәбияты исемлеге нигезләнгән китап күләмендәге чыганаклар.',
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
    tt: 'Курста кайдадыр китерелгән һәр хезмәт — мәкаләләр, дәреслекләр һәм кораллар — чын каноник сылтама (arXiv, DOI яки нәшер итүче) һәм ни өчен ул биредә икәнлеге турында кыска искәрмә белән. Өлкәләр буенча төркемләнгән, курс алар белән очрашкан тәртиптә. Бу — лекцияләр, Китап һәм программаның әдәбият исемлеге алган библиография.',
  },
  count: {
    en: 'works',
    ru: 'работ',
    tt: 'хезмәт',
  },
  // Toolbar UI (search + area chips + result state). Trilingual; page falls back via t().
  ui: {
    search: { en: 'Search author, title or note…', ru: 'Поиск по автору, названию или заметке…', tt: 'Автор, исем яки искәрмә буенча эзләү…' },
    all: { en: 'All', ru: 'Все', tt: 'Барысы' },
    of: { en: 'of', ru: 'из', tt: 'дан' },
    none: { en: 'No works match — try another word.', ru: 'Ничего не найдено — попробуй другое слово.', tt: 'Туры килгәне юк — башка сүз кулланып карагыз.' },
    reset: { en: 'reset', ru: 'сбросить', tt: 'ташлау' },
    filterByArea: { en: 'Filter by research area', ru: 'Фильтр по области', tt: 'Өлкә буенча фильтр' },
  },
};
