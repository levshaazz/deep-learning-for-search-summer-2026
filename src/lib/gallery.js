// gallery.js — the visual glossary manifest: a Bestiary (recurring cast/creatures)
// + Scenes (the metaphor / hero illustrations grouped by lecture).
//
// Mirrors the data-driven shape of `assignments.js`: add an illustration = append one
// object. EN canonical + RU. TT falls back (handled by t() in the page).
//
// NOTE: like assignments.js, this module is NOT scanned by the i18n-coverage gate (it
// only walks ui.js / course.json / book chapters / widget i18n). Rich bilingual prose
// is fine here; keep EN present on every {en,ru} node anyway.
//
// IMAGE URL: the build's copy-static step copies `Lectures/` → `docs/Lectures/`, so the
// `img` field below is a deploy-base-relative path under `/Lectures/...` that the page
// wraps with withBase(). The `href` points to the Book chapter where the concept is
// taught (localizedPath(lang, 'book/0N')).
//
// EASY TO EXTEND: append a new lecture object to `scenes` (e.g. { id:'L5', ... }) when the
// L5–L12 art lands — the page renders every group with no edit.

// Shared front-matter, rendered once on the index page.
export const galleryMeta = {
  intro: {
    en: 'A visual glossary of the course. Browse the metaphor art by lecture, meet the recurring cast in the Bestiary — or search a concept to jump straight to its picture. Every image links to the chapter that teaches it.',
    ru: 'Визуальный глоссарий курса. Листай арт по лекциям, знакомься с повторяющимися персонажами в Бестиарии — или найди концепт поиском, чтобы сразу перейти к картинке. Каждая картинка ведёт в главу, где её учат.',
    tt: 'Курсның визуаль глоссарие. Артны лекцияләр буенча карагыз, Бестиарийда кабатланучы персонажлар белән танышыгыз — яки концептны эзләп, туры аның рәсеменә күчегез. Һәр рәсем аны өйрәткән бүлеккә алып бара.',
  },
  topic: {
    en: 'Hand-drawn, Wait-But-Why style: one idea per picture, one accent colour. The art is the mnemonic — meet the creature, remember the concept.',
    ru: 'Рисунки в стиле Wait But Why: одна идея на картинку, один акцентный цвет. Арт — это мнемоника: познакомься с существом, запомни концепт.',
    tt: 'Wait But Why стилендә: һәр рәсемгә бер идея, бер акцент төс. Арт — ул мнемоника: зат белән таныш, концептны исеңдә калдыр.',
  },
  // Section headings for the two top-level groups.
  bestiary: {
    heading: { en: 'Bestiary — the recurring cast', ru: 'Бестиарий — повторяющиеся персонажи', tt: 'Бестиарий — кабатланучы персонажлар' },
    lead: {
      en: 'Each creature personifies exactly one concept. Meet them once here; they reappear across the lectures as the visual shorthand for that idea.',
      ru: 'Каждое существо олицетворяет ровно один концепт. Познакомься с ними здесь — они возвращаются в лекциях как визуальное сокращение для этой идеи.',
      tt: 'Һәр зат төгәл бер концептны гәүдәләндерә. Алар белән монда танышыгыз — алар лекцияләрдә шул идеянең визуаль кыскартмасы буларак кабат пәйда була.',
    },
  },
  scenesHeading: { en: 'Scenes — by lecture', ru: 'Сцены — по лекциям', tt: 'Сценалар — лекцияләр буенча' },
  appearsIn: { en: 'appears in', ru: 'встречается в', tt: 'очрый' },
  taughtIn: { en: 'taught in', ru: 'изучается в', tt: 'өйрәнелә' },
  // Toolbar UI (search + filter chips + result state). Trilingual; page falls back via t().
  ui: {
    search: { en: 'Search a concept…', ru: 'Поиск по концепту…', tt: 'Концепт буенча эзләү…' },
    all: { en: 'All', ru: 'Все', tt: 'Барысы' },
    typeCast: { en: 'Bestiary', ru: 'Бестиарий', tt: 'Бестиарий' },
    typeScene: { en: 'Scenes', ru: 'Сцены', tt: 'Сценалар' },
    allLectures: { en: 'All lectures', ru: 'Все лекции', tt: 'Барлык лекцияләр' },
    found: { en: 'found', ru: 'найдено', tt: 'табылды' },
    none: {
      en: 'Nothing matches — try another word.',
      ru: 'Ничего не найдено — попробуй другое слово.',
      tt: 'Туры килгәне юк — башка сүз кулланып карагыз.',
    },
    reset: { en: 'reset', ru: 'сбросить', tt: 'ташлау' },
    filterByType: { en: 'Filter by image type', ru: 'Фильтр по типу', tt: 'Тип буенча фильтр' },
    filterByLecture: { en: 'Filter by lecture', ru: 'Фильтр по лекции', tt: 'Лекция буенча фильтр' },
    viewer: { en: 'Image viewer', ru: 'Просмотр изображения', tt: 'Рәсем карау' },
  },
};

// ── Bestiary: the recurring cast (Serega + the seven creatures) ──────────────
// Each: { id, name{en,ru}, img, concept{en,ru}, lecture, href(lang) }.
export const cast = [
  {
    id: 'serega',
    name: { en: 'Serega', ru: 'Серёга', tt: 'Серёга' },
    img: '/Lectures/assets/img/_char/serega-charsheet.png',
    concept: {
      en: 'Your narrator and guide — a round-headed explorer in a Tatar tübətəy. He hops the whole arc from keyword search to RAG, and every metaphor is told through his eyes.',
      ru: 'Твой рассказчик и проводник — круглоголовый исследователь в татарской тюбетейке. Он проходит весь путь от поиска по ключевым словам до RAG, и каждая метафора подана его глазами.',
      tt: 'Сезнең сөйләүчегез һәм юлбашчыгыз — татар түбәтәендәге түгәрәк башлы тикшерүче. Ул ачкыч сүзләр буенча эзләүдән алып RAG’ка кадәр бөтен юлны үтә, һәм һәр метафора аның күзләре аша сөйләнә.',
    },
    lecture: 'L0',
    href: (lang, localizedPath) => localizedPath(lang, 'book/00'),
  },
  {
    id: 'lexical-gremlin',
    name: { en: 'The Lexical Gremlin', ru: 'Лексический Гремлин', tt: 'Лексик Гремлин' },
    img: '/Lectures/assets/img/L1/L1-24-lexical-gremlin.png',
    concept: {
      en: 'couch ≠ sofa: exact-term matching is blind to meaning. The gremlin holds the wall between words that mean the same thing — the lexical gap embeddings must bridge.',
      ru: 'диван ≠ софа: точное совпадение по словам слепо к смыслу. Гремлин держит стену между словами с одним значением — словарный разрыв, который должны перекрыть эмбеддинги.',
      tt: 'диван ≠ софа: сүзләр буенча төгәл туры килү мәгънәгә сукыр. Гремлин бер үк мәгънәле сүзләр арасында стенаны тота — эмбеддинглар каплап үтәргә тиешле лексик ярык.',
    },
    lecture: 'L1',
    href: (lang, localizedPath) => localizedPath(lang, 'book/01'),
  },
  {
    id: 'iceberg',
    name: { en: 'The Iceberg', ru: 'Айсберг', tt: 'Айсберг' },
    img: '/Lectures/assets/img/L1/L1-33-iceberg.png',
    concept: {
      en: 'the ML model is ~5% — the tip. Config, data collection, serving, monitoring and feature extraction are the 95% below the waterline.',
      ru: 'ML-модель — это ~5%, верхушка. Конфиги, сбор данных, сервинг, мониторинг и извлечение признаков — это 95% под водой.',
      tt: 'ML-модель — бу ~5%, түбәсе. Конфиглар, мәгълүмат җыю, сервинг, мониторинг һәм билгеләр чыгару — су астындагы 95%.',
    },
    lecture: 'L1',
    href: (lang, localizedPath) => localizedPath(lang, 'book/01'),
  },
  {
    id: 'goodhart',
    name: { en: 'Goodhart the Trickster', ru: 'Гудхарт-Трикстер', tt: 'Гудхарт-Хәйләкәр' },
    img: '/Lectures/assets/img/L1/L1-40-goodhart.png',
    concept: {
      en: 'a measure that becomes a target stops being a good measure. He yanks the CTR line up with a clickbait hook while real satisfaction quietly falls.',
      ru: 'мера, ставшая целью, перестаёт быть хорошей мерой. Он тянет вверх линию CTR кликбейт-крючком, пока реальная удовлетворённость тихо падает.',
      tt: 'максатка әйләнгән үлчәм яхшы үлчәм булудан туктый. Ул кликбейт-кармагы белән CTR сызыгын өскә тарта, ә чын канәгатьлек тыныч кына төшә.',
    },
    lecture: 'L1',
    href: (lang, localizedPath) => localizedPath(lang, 'book/01'),
  },
  {
    id: 'tokenosaurus',
    name: { en: 'Tokenosaurus', ru: 'Токенозавр', tt: 'Токенозавр' },
    img: '/Lectures/assets/img/L2/L2-23-tokenosaurus.png',
    concept: {
      en: 'chops words into sub-word tokens — "tokenization" → "token" + "iza" + "tion" — so the vocabulary stays finite and rare words still get covered.',
      ru: 'разрезает слова на под-словные токены — «tokenization» → «token» + «iza» + «tion» — чтобы словарь оставался конечным, а редкие слова всё равно покрывались.',
      tt: 'сүзләрне өлеш-сүз токеннарга турый — «tokenization» → «token» + «iza» + «tion» — шуңа күрә сүзлек чикле кала, ә сирәк сүзләр барыбер каплана.',
    },
    lecture: 'L2',
    href: (lang, localizedPath) => localizedPath(lang, 'book/02'),
  },
  {
    id: 'sir-cosine',
    name: { en: 'Sir Cosine', ru: 'Сэр Косинус', tt: 'Сэр Косинус' },
    img: '/Lectures/assets/img/L2/L2-48-sir-cosine.png',
    concept: {
      en: 'measures the ANGLE between vectors, not the distance — relevance = a small angle. A knight of the unit sphere with his protractor.',
      ru: 'измеряет УГОЛ между векторами, а не расстояние — релевантность = маленький угол. Рыцарь единичной сферы со своим транспортиром.',
      tt: 'векторлар арасындагы ПОЧМАКНЫ үлчи, ераклыкны түгел — релевантлык = кечкенә почмак. Транспортиры белән берәмлек сфера рыцаре.',
    },
    lecture: 'L2',
    href: (lang, localizedPath) => localizedPath(lang, 'book/02'),
  },
  {
    id: 'wraith',
    name: { en: 'The Curse-of-Dimensionality Wraith', ru: 'Призрак Проклятия Размерности', tt: 'Үлчәмлек Каргышы Шәүләсе' },
    img: '/Lectures/assets/img/L2/L2-61-wraith.png',
    concept: {
      en: 'in high dimensions every point is ~equidistant — distance loses meaning. The wraith crushes the wide distance histogram into one thin spike.',
      ru: 'в высоких размерностях все точки ~равноудалены — расстояние теряет смысл. Призрак сжимает широкую гистограмму расстояний в один тонкий пик.',
      tt: 'зур үлчәмлекләрдә һәр нокта ~бертигез ерак — ераклык мәгънәсен югалта. Шәүлә киң ераклык гистограммасын бер нечкә пикка сытып төшерә.',
    },
    lecture: 'L2',
    href: (lang, localizedPath) => localizedPath(lang, 'book/02'),
  },
  {
    id: 'cartographer',
    name: { en: 'The Cartographer', ru: 'Картограф', tt: 'Картограф' },
    img: '/Lectures/assets/img/L5/L5-08-cartographer.png',
    concept: {
      en: 'dimensionality reduction: folds the 300-D map of meaning down to something you can carry — keep the shape, drop the dimensions (PCA, t-SNE, UMAP).',
      ru: 'снижение размерности: складывает 300-мерную карту смысла до размера, который можно унести — сохранить форму, отбросить измерения (PCA, t-SNE, UMAP).',
      tt: 'үлчәмлекне киметү: 300 үлчәмле мәгънә картасын алып йөрерлек итеп бөкли — формасын сакла, үлчәмнәрне ташла (PCA, t-SNE, UMAP).',
    },
    lecture: 'L5',
    href: (lang, localizedPath) => localizedPath(lang, 'book/05'),
  },
  {
    id: 'attention-head',
    name: { en: 'The Council / Attention-Head', ru: 'Совет / Голова Внимания', tt: 'Совет / Игътибар Башы' },
    img: '/Lectures/assets/img/L6/L6-00-council-of-attention.png',
    concept: {
      en: 'self-attention: each token is a councillor that attends to every other and votes on whom to heed — meaning is built from a weighted blend of neighbours.',
      ru: 'самовнимание: каждый токен — советник, который смотрит на всех остальных и голосует, кого слушать — смысл строится из взвешенной смеси соседей.',
      tt: 'үз-игътибар: һәр токен — һәрберсенә игътибар итеп, кемне тыңларга икәнен тавыш бирүче киңәшче — мәгънә күршеләрнең үлчәүле кушылмасыннан төзелә.',
    },
    lecture: 'L6',
    href: (lang, localizedPath) => localizedPath(lang, 'book/06'),
  },
  {
    id: 'ragdoll',
    name: { en: 'RAGdoll — the Oracle', ru: 'РАГдолл — Оракул', tt: 'РАГдолл — Оракул' },
    img: '/Lectures/assets/img/L10/L10-00-the-oracle.png',
    concept: {
      en: 'the RAG system itself — a patchwork rag-doll stitched from retrieved scraps. It does not know; it retrieves, then speaks from what it found. Feed it good context and it answers grounded; starve it and it confabulates.',
      ru: 'сама RAG-система — лоскутная тряпичная кукла, сшитая из найденных обрывков. Она не знает; она извлекает, а потом говорит из найденного. Дай хороший контекст — ответит обоснованно; оставь без — начнёт сочинять.',
      tt: 'RAG-системасы үзе — табылган кисәкләрдән теккән ямаулы курчак. Ул белми; ул табып ала, аннары тапканыннан сөйли. Яхшы контекст бир — нигезле җавап бирә; ач калдыр — уйлап чыгара башлый.',
    },
    lecture: 'L10',
    href: (lang, localizedPath) => localizedPath(lang, 'book/10'),
  },
  {
    id: 'chunk-norris',
    name: { en: 'Chunk Norris', ru: 'Чанк Норрис', tt: 'Чанк Норрис' },
    img: '/Lectures/assets/img/L10/L10-03-chunk-norris.png',
    concept: {
      en: 'chunking incarnate — a karate master who splits long documents into well-sized, overlapping passages, so no idea is cut in half and nothing falls between the slices.',
      ru: 'воплощённое чанкование — мастер карате, рубящий длинные документы на пассажи нужного размера с нахлёстом, чтобы ни одна мысль не разрезалась пополам и ничто не проваливалось между кусками.',
      tt: 'чанклауның гәүдәләнеше — каратэ остасы, озын документларны кирәкле зурлыктагы, өслек-өслек ятыш пассажларга бүлә, бер фикер дә урталай киселмәсен һәм бернәрсә дә кисәкләр арасына төшмәсен өчен.',
    },
    lecture: 'L10',
    href: (lang, localizedPath) => localizedPath(lang, 'book/10'),
  },
  {
    id: 'confabulous',
    name: { en: 'Confabulous', ru: 'Конфабулус', tt: 'Конфабулус' },
    img: '/Lectures/assets/img/L10/L10-07-garbage-in.png',
    concept: {
      en: 'the hallucination phantom — a fluent, confident ghost that fabricates answers and citations out of thin air. The villain RAG evaluation is built to catch: faithfulness asks whether every claim is grounded in a real source.',
      ru: 'призрак галлюцинаций — гладкий, уверенный фантом, сочиняющий ответы и ссылки из воздуха. Злодей, которого ловит оценка RAG: верность (faithfulness) проверяет, опирается ли каждое утверждение на реальный источник.',
      tt: 'галлюцинация өрәге — шома, үзенә ышанган фантом, җавапларны һәм сылтамаларны юктан уйлап чыгара. RAG бәяләве тоту өчен корылган явыз: тугрылык (faithfulness) һәр раславның чын чыганакка таянуын тикшерә.',
    },
    lecture: 'L11',
    href: (lang, localizedPath) => localizedPath(lang, 'book/11'),
  },
  {
    id: 're-actor',
    name: { en: 'the Re-Actor', ru: 'Ре-Актёр', tt: 'Ре-Актёр' },
    img: '/Lectures/assets/img/L11/L11-13-the-re-actor.png',
    concept: {
      en: 'agentic RAG — a little theatrical actor running the Thought → Action → Observation loop: reason, retrieve, look at what came back, then decide the next move (ReAct, Self-RAG, CRAG).',
      ru: 'агентный RAG — маленький театральный актёр, прогоняющий цикл Мысль → Действие → Наблюдение: рассуждает, извлекает, смотрит на результат и решает следующий ход (ReAct, Self-RAG, CRAG).',
      tt: 'агентлы RAG — Фикер → Гамәл → Күзәтү циклын үткәрүче кечкенә театр актёры: уйлый, табып ала, нәтиҗәгә карый, аннары киләсе адымны хәл итә (ReAct, Self-RAG, CRAG).',
    },
    lecture: 'L11',
    href: (lang, localizedPath) => localizedPath(lang, 'book/11'),
  },
  {
    id: 'clippy',
    name: { en: 'Clippy', ru: 'Клиппи', tt: 'Клиппи' },
    img: '/Lectures/assets/img/L12/L12-16-clippy.png',
    concept: {
      en: 'multimodal alignment — a friendly paperclip who pins an image and its caption into one shared embedding space, so a picture and the words that describe it land close together (CLIP).',
      ru: 'мультимодальное выравнивание — дружелюбная скрепка, скалывающая картинку и её подпись в одно общее пространство эмбеддингов, чтобы изображение и описывающие его слова оказались рядом (CLIP).',
      tt: 'мультимодаль тигезләү — рәсемне һәм аның язмасын бер уртак эмбеддинг киңлегенә кадаклаучы дус кәгазь кыстыргыч, рәсем белән аны тасвирлаган сүзләр янәшә төшсен өчен (CLIP).',
    },
    lecture: 'L12',
    href: (lang, localizedPath) => localizedPath(lang, 'book/12'),
  },
  {
    id: 'joey-multihop',
    name: { en: 'Joey Multi-Hop', ru: 'Джоуи Мульти-Хоп', tt: 'Джоуи Мульти-Хоп' },
    img: '/Lectures/assets/img/L12/L12-17-joey-multihop.png',
    concept: {
      en: 'multi-hop reasoning — a kangaroo who bounds node → node → node, gathering one clue per hop until the scattered pieces add up to an answer no single passage held (multi-hop / GraphRAG).',
      ru: 'многошаговое рассуждение — кенгуру, прыгающий узел → узел → узел и собирающий по подсказке за прыжок, пока разрозненные кусочки не сложатся в ответ, которого не было ни в одном пассаже (multi-hop / GraphRAG).',
      tt: 'күп адымлы фикерләү — төен → төен → төен сикерүче кенгуру, һәр сикерүдә бер ишарә җыя, таркау кисәкләр бер пассажда да булмаган җавапка өстәлгәнче (multi-hop / GraphRAG).',
    },
    lecture: 'L12',
    href: (lang, localizedPath) => localizedPath(lang, 'book/12'),
  },
  {
    id: 'impostor',
    name: { en: 'the Impostor', ru: 'Самозванец', tt: 'Самозванец' },
    img: '/Lectures/assets/img/L13/L13-09-the-impostor.png',
    concept: {
      en: 'the false negative — an unlabelled positive wearing an enemy’s mask. Mine the hardest candidates and you scoop up relevant-but-unlabelled passages and train against them; the danger lives on a second axis, cos(·,d⁺), invisible to query-only hardness.',
      ru: 'ложный негатив — неразмеченный позитив в маске врага. Намайнив самые трудные кандидаты, ты подбираешь релевантные, но неразмеченные пассажи и учишься против них; опасность живёт на второй оси, cos(·,d⁺), невидимой для «трудности» со стороны запроса.',
      tt: 'ялган негатив — дошман битлеген кигән билгеләнмәгән позитив. Иң катлаулы кандидатларны майнинглаганда син мөһим ләкин билгеләнмәгән пассажларны эләктерәсең һәм аларга каршы өйрәнәсең; куркыныч икенче күчәрдә, cos(·,d⁺), сорау ягыннан «катлаулык» өчен күренми.',
    },
    lecture: 'L13',
    href: (lang, localizedPath) => localizedPath(lang, 'book/13'),
  },
  {
    id: 'sparring-ghosts',
    name: { en: 'the Sparring Ghosts', ru: 'Призраки спарринга', tt: 'Спарринг өрәкләре' },
    img: '/Lectures/assets/img/L13/L13-08-sparring-ghosts.png',
    concept: {
      en: 'stale negatives — opponents the blade already beat, lingering between index refreshes. Mining from a frozen ANN index lets the negatives drift out of date and stop teaching; STAR/ADORE refresh them per step so the sparring stays live.',
      ru: 'устаревшие негативы — противники, которых клинок уже победил, оставшиеся между обновлениями индекса. Майнинг из замороженного ANN-индекса делает негативы устаревшими, и они перестают учить; STAR/ADORE обновляют их на каждом шаге, чтобы спарринг оставался живым.',
      tt: 'искергән негативлар — клинок инде жиңгән көндәшләр, индекс яңартулары арасында калган. Туңдырылган ANN индекстан майнинглаганда негативлар искерә һәм өйрәтүдән туктый; STAR/ADORE аларны һәр адымда яңарта, спарринг тере калсын өчен.',
    },
    lecture: 'L13',
    href: (lang, localizedPath) => localizedPath(lang, 'book/13'),
  },
];

// ── Scenes: the narrative illustrations, grouped by lecture ──────────────────
// Each group: { id, title{en,ru}, href(lang), items:[{ img, concept{en,ru} }] }.
// `href` is the chapter where the lecture's art lives (the same for every scene in it,
//  but each scene could override with its own `href` if ever needed).
// SKIPPED on purpose: _char cameos / cover / _v, _contact/* (social/duplicate, non-narrative),
//  and the creature plates already shown in the Bestiary above (L1-24, L1-33, L1-40,
//  L2-23, L2-48, L2-61, L3-04 gremlin-wall, L4-03 goodhart) to avoid duplication.
export const scenes = [
  {
    id: 'L0',
    title: { en: 'Lecture 0 — The Briefing', ru: 'Лекция 0 — Брифинг', tt: 'Лекция 0 — Брифинг' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/00'),
    items: [
      { img: '/Lectures/assets/img/L0/L0-01-briefing.png', concept: {
        en: 'the mission: search. Captain Serega steers toward a vast Galaxy of Information whose stars are made of 1s, 0s and documents.',
        ru: 'миссия: поиск. Капитан Серёга держит курс на огромную Галактику Информации, чьи звёзды сделаны из единиц, нулей и документов.',
        tt: 'миссия: эзләү. Капитан Серёга йолдызлары бер, нуль һәм документлардан торган гаять зур Мәгълүмат Галактикасына курс тота.' } },
      { img: '/Lectures/assets/img/L0/L0-06-quote-trail.png', concept: {
        en: 'the journey of the course — a trail from typing keywords through meaning and vectors to RAG. The signposts are the syllabus.',
        ru: 'путь курса — тропа от набора ключевых слов через смысл и векторы к RAG. Указатели — это программа.',
        tt: 'курс юлы — ачкыч сүзләр җыюдан мәгънә һәм векторлар аша RAG’ка кадәр сукмак. Юл күрсәткечләре — бу программа.' } },
      { img: '/Lectures/assets/img/L0/L0-08-coursearc.png', concept: {
        en: 'the course arc as stepping stones: IR → embeddings → neural → vector DB → RAG → agentic. Each lecture is one stone.',
        ru: 'арка курса как камни-ступени: IR → эмбеддинги → нейросети → векторная БД → RAG → агенты. Каждая лекция — один камень.',
        tt: 'курс аркасы баскыч-ташлар буларак: IR → эмбеддинглар → нейросетьләр → вектор БД → RAG → агентлар. Һәр лекция — бер таш.' } },
      { img: '/Lectures/assets/img/L0/L0-20-sendoff.png', concept: {
        en: 'the captain’s send-off — torch raised over the Galaxy of Information. The course begins; good luck out there.',
        ru: 'напутствие капитана — факел поднят над Галактикой Информации. Курс начинается; удачи там.',
        tt: 'капитанның озату сүзе — факел Мәгълүмат Галактикасы өстендә күтәрелгән. Курс башлана; уңышлар анда.' } },
    ],
  },
  {
    id: 'L1',
    title: { en: 'Lecture 1 — The Lost Record', ru: 'Лекция 1 — Потерянная Запись', tt: 'Лекция 1 — Югалган Язма' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/01'),
    items: [
      { img: '/Lectures/assets/img/L1/L1-06-needle.png', concept: {
        en: 'the needle in the haystack: one document you need, adrift in an ocean of bytes. This is the search problem.',
        ru: 'иголка в стоге сена: один нужный документ, затерянный в океане байтов. Это и есть задача поиска.',
        tt: 'печән эскертендәге энә: байтлар океанында югалган бер кирәкле документ. Менә эзләү бурычы шул.' } },
      { img: '/Lectures/assets/img/L1/L1-08-lossy-need.png', concept: {
        en: 'need → query → docs is lossy: a rich information need gets squeezed through a narrow funnel into a few keywords.',
        ru: 'потребность → запрос → документы — с потерями: богатая информационная потребность продавливается через узкую воронку в пару ключевых слов.',
        tt: 'ихтыяҗ → сорау → документлар — югалтулар белән: бай мәгълүмат ихтыяҗы тар воронка аша берничә ачкыч сүзгә кысыла.' } },
      { img: '/Lectures/assets/img/L1/L1-14-grounding.png', concept: {
        en: 'grounding: an LLM confidently says "a horse has 8 legs" — retrieval fetches a real source to fix the hallucination.',
        ru: 'опора на источник: LLM уверенно говорит «у лошади 8 ног» — поиск достаёт реальный источник и исправляет галлюцинацию.',
        tt: 'граундинг: LLM ышаныч белән «атның 8 аягы бар» ди — эзләү чын чыганакны табып галлюцинацияне төзәтә.' } },
      { img: '/Lectures/assets/img/L1/L1-22-leaky-bucket.png', concept: {
        en: 'the recall ceiling: you can’t re-rank what you didn’t retrieve. Stars that fell through the bucket are gone for good.',
        ru: 'потолок полноты: нельзя переранжировать то, что не извлёк. Звёзды, выпавшие из ведра, потеряны навсегда.',
        tt: 'тулылык түшәме: чыгармаганны кабат ранжлап булмый. Чиләктән коелган йолдызлар мәңгегә югалган.' } },
      { img: '/Lectures/assets/img/L1/L1-25-zipf-beach.png', concept: {
        en: 'the long tail (Zipf): a few head terms tower over an endless tail of words seen once — most queries live in the tail.',
        ru: 'длинный хвост (Ципф): несколько частых термов возвышаются над бесконечным хвостом слов, встреченных раз — большинство запросов живут в хвосте.',
        tt: 'озын койрык (Ципф): берничә еш терм бер тапкыр очраган сүзләрнең чиксез койрыгы өстендә калка — сорауларның күбесе койрыкта яши.' } },
      { img: '/Lectures/assets/img/L1/L1-29-position-bias.png', concept: {
        en: 'click logs lie: the top-left "golden triangle" gets the clicks because it’s on top, not because it’s best — a feedback loop.',
        ru: 'логи кликов лгут: верхний-левый «золотой треугольник» собирает клики потому что он сверху, а не потому что он лучший — петля обратной связи.',
        tt: 'клик логлары алдый: өске сулдагы «алтын өчпочмак» өстә булганга клик җыя, иң яхшы булганга түгел — кире бәйләнеш элмәге.' } },
      { img: '/Lectures/assets/img/L1/L1-32-not-a-system.png', concept: {
        en: 'a model in a notebook is not a system: accuracy 0.92 on a laptop, but production is a tangle of pipes and gauges.',
        ru: 'модель в ноутбуке — это не система: accuracy 0.92 на лэптопе, но прод — это клубок труб и датчиков.',
        tt: 'ноутбуктагы модель — система түгел: лэптопта accuracy 0.92, ләкин прод — торбалар һәм датчиклар буталчыгы.' } },
      { img: '/Lectures/assets/img/L1/L1-43-flywheel.png', concept: {
        en: 'the data flywheel: users → logs → model → results spins virtuously — or viciously, as bias thickens each lap ("rich get richer").',
        ru: 'маховик данных: пользователи → логи → модель → результаты крутится во благо — или во зло, когда смещение растёт с каждым кругом («богатые богатеют»).',
        tt: 'мәгълүмат маховигы: кулланучылар → логлар → модель → нәтиҗәләр игелеккә әйләнә — яки явызлыкка, чөнки смещение һәр әйләнештә калыная («байлар баеп бара»).' } },
      { img: '/Lectures/assets/img/L1/L1-56-found.png', concept: {
        en: 'found it. — Serega holds the one document overhead, the ocean of bytes calm. The Lost Record closes.',
        ru: 'нашёл. — Серёга держит тот самый документ над головой, океан байтов спокоен. «Потерянная Запись» закрывается.',
        tt: 'тапты. — Серёга нәкъ шул документны баш өстендә тота, байтлар океаны тыныч. «Югалган Язма» ябыла.' } },
    ],
  },
  {
    id: 'L2',
    title: { en: 'Lecture 2 — First Contact', ru: 'Лекция 2 — Первый Контакт', tt: 'Лекция 2 — Беренче Контакт' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/02'),
    items: [
      { img: '/Lectures/assets/img/L2/L2-06-first-contact.png', concept: {
        en: 'no shared symbols: human and machine face each other with a cloud of question marks. NLP is the search for a common language.',
        ru: 'нет общих символов: человек и машина стоят друг против друга с облаком вопросительных знаков. NLP — это поиск общего языка.',
        tt: 'уртак символлар юк: кеше һәм машина сорау билгеләре болыты белән бер-берсенә каршы тора. NLP — уртак тел эзләү.' } },
      { img: '/Lectures/assets/img/L2/L2-08-discreteness.png', concept: {
        en: 'words are discrete: you can interpolate a grey gradient, but there’s no halfway "word" between cat and dog.',
        ru: 'слова дискретны: серый градиент можно интерполировать, но «слова» посередине между cat и dog не существует.',
        tt: 'сүзләр дискрет: соры градиентны интерполяцияләп була, ләкин cat белән dog арасында урталыктагы «сүз» юк.' } },
      { img: '/Lectures/assets/img/L2/L2-10-zipf.png', concept: {
        en: 'Zipf’s law: "the", "of", "and" tower over a long flat tail of words seen once — frequency falls as 1/rank.',
        ru: 'закон Ципфа: «the», «of», «and» возвышаются над длинным хвостом слов, встреченных раз — частота падает как 1/ранг.',
        tt: 'Ципф законы: «the», «of», «and» бер тапкыр очраган сүзләрнең озын койрыгы өстендә калка — ешлык 1/ранг кебек төшә.' } },
      { img: '/Lectures/assets/img/L2/L2-20-tradeoff.png', concept: {
        en: 'the tokenizer trade-off: vocab size, sequence length and out-of-vocabulary — a juggler can only keep two of three in the air.',
        ru: 'компромисс токенизатора: размер словаря, длина последовательности и OOV — жонглёр может удержать в воздухе лишь два из трёх.',
        tt: 'токенизатор компромиссы: сүзлек күләме, эзлеклелек озынлыгы һәм OOV — жонглёр өчтән икесен генә һавада тота ала.' } },
      { img: '/Lectures/assets/img/L2/L2-37-digits.png', concept: {
        en: 'digits don’t line up: "327" can be split as "3|27" or "327", so place values misalign and arithmetic breaks.',
        ru: 'цифры не выравниваются: «327» режется как «3|27» или «327», разряды съезжают, и арифметика ломается.',
        tt: 'цифрлар тигезләнми: «327» «3|27» яки «327» дип киселә ала, шуңа күрә разрядлар шуа, ә арифметика җимерелә.' } },
      { img: '/Lectures/assets/img/L2/L2-41-token-tax.png', concept: {
        en: 'the token tax: the same sentence costs more tokens in Hindi/Telugu/Turkish than in English — a bigger bill for the same meaning.',
        ru: 'токен-налог: одно и то же предложение стоит больше токенов на хинди/телугу/турецком, чем на английском — больший счёт за тот же смысл.',
        tt: 'токен-салым: бер үк җөмлә хинди/телугу/төрек телендә инглизчәгә караганда күбрәк токен тора — шул ук мәгънә өчен зуррак счёт.' } },
      { img: '/Lectures/assets/img/L2/L2-42-glitch-token.png', concept: {
        en: 'glitch tokens: a rare token like "SolidGoldMagikarp" sits far off in embedding space and makes the model short-circuit.',
        ru: 'глитч-токены: редкий токен вроде «SolidGoldMagikarp» сидит далеко в пространстве эмбеддингов и заставляет модель замыкать.',
        tt: 'глитч-токеннар: «SolidGoldMagikarp» кебек сирәк токен эмбеддинглар пространствосында ерак утыра һәм модельне кыска ялганырга мәҗбүр итә.' } },
      { img: '/Lectures/assets/img/L2/L2-49-query-angle.png', concept: {
        en: 'relevant = close: one query arrow, several doc arrows — the smallest angle wins. The intuition behind cosine.',
        ru: 'релевантно = близко: одна стрелка-запрос, несколько стрелок-документов — побеждает наименьший угол. Интуиция за косинусом.',
        tt: 'релевант = якын: бер сорау-ук, берничә документ-ук — иң кечкенә почмак җиңә. Косинус артындагы интуиция.' } },
      { img: '/Lectures/assets/img/L2/L2-56-cosine-vs-euclid.png', concept: {
        en: 'cosine vs Euclidean: (1,1) and (10,10) point the same way — cosine calls them identical, Euclidean calls them far apart.',
        ru: 'косинус vs евклид: (1,1) и (10,10) смотрят в одну сторону — косинус считает их одинаковыми, евклид — далёкими.',
        tt: 'косинус vs евклид: (1,1) һәм (10,10) бер якка карый — косинус аларны бертөрле дип саный, евклид — ерак.' } },
      { img: '/Lectures/assets/img/L2/L2-62-concentration.png', concept: {
        en: 'distance concentration: as d grows 2 → 1000, the spread of pairwise distances collapses to a spike — everything is equidistant.',
        ru: 'концентрация расстояний: с ростом d 2 → 1000 разброс попарных расстояний схлопывается в пик — всё становится равноудалённым.',
        tt: 'ераклык концентрациясе: d 2 → 1000 үскәндә парлы ераклыклар таралышы пикка яньчелә — барысы да бертигез ерак була.' } },
      { img: '/Lectures/assets/img/L2/L2-63-hubness.png', concept: {
        en: 'hubness: in high-d a few "hub" points hog all the nearest-neighbour lists while most points are ignored.',
        ru: 'хабность: в высоких размерностях несколько «хабов» захватывают все списки ближайших соседей, а большинство точек игнорируется.',
        tt: 'хабность: зур үлчәмлекләрдә берничә «хаб» нокта иң якын күршеләр исемлекләрен үзенә ала, ә нокталарның күбесе игътибарсыз кала.' } },
      { img: '/Lectures/assets/img/L2/L2-64-anisotropy.png', concept: {
        en: 'anisotropy: raw embeddings squeeze into a thin cone so everything looks similar; whitening spreads them into a balanced sphere.',
        ru: 'анизотропия: сырые эмбеддинги жмутся в тонкий конус, и всё кажется похожим; отбеливание расправляет их в сбалансированную сферу.',
        tt: 'анизотропия: чи эмбеддинглар нечкә конуска кысыла, һәм барысы да охшаш күренә; агарту аларны сбалансланган сферага җәя.' } },
      { img: '/Lectures/assets/img/L2/L2-70-first-contact-callback.png', concept: {
        en: 'contact. — human and alien shake hands, the question marks replaced by one shared vector arrow. First Contact closes.',
        ru: 'контакт. — человек и пришелец жмут руки, вопросы заменены одной общей стрелкой-вектором. «Первый Контакт» закрывается.',
        tt: 'контакт. — кеше һәм чит планеталы кул кысыша, сорау билгеләре бер уртак вектор-ук белән алыштырылган. «Беренче Контакт» ябыла.' } },
    ],
  },
  {
    id: 'L3',
    title: { en: 'Lecture 3 — The Star Catalog', ru: 'Лекция 3 — Звёздный Каталог', tt: 'Лекция 3 — Йолдызлар Каталогы' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/03'),
    items: [
      { img: '/Lectures/assets/img/L3/L3-00-star-catalog.png', concept: {
        en: 'the Star Catalog: classical IR turns a billion documents into a catalogue you can look up — the lecture’s framing metaphor.',
        ru: 'Звёздный Каталог: классический IR превращает миллиард документов в каталог, по которому можно искать — рамочная метафора лекции.',
        tt: 'Йолдызлар Каталогы: классик IR миллиард документны эзләп була торган каталогка әйләндерә — лекциянең рамка метафорасы.' } },
      { img: '/Lectures/assets/img/L3/L3-01-linear-scan-doom.png', concept: {
        en: 'scanning every document is hopeless: a lone explorer has checked 12 of 1,000,000,000 stars — you need an index, not brute force.',
        ru: 'сканировать каждый документ — безнадёжно: одинокий исследователь проверил 12 из 1 000 000 000 звёзд — нужен индекс, а не перебор.',
        tt: 'һәр документны сканлау — өметсез: ялгыз тикшерүче 1 000 000 000 йолдызның 12-сен тикшергән — кирәк нәрсә индекс, кытыршы көч түгел.' } },
      { img: '/Lectures/assets/img/L3/L3-10-scan-vs-catalog.png', concept: {
        en: '"scan everything?" vs "look it up.": the same billion-star sky, but the card catalogue beams straight to the three stars you wanted.',
        ru: '«сканировать всё?» vs «посмотреть в каталоге»: то же небо из миллиарда звёзд, но картотека ведёт прямо к трём нужным звёздам.',
        tt: '«барысын сканлау?» vs «каталогтан карау»: шул ук миллиард йолдызлы күк, ләкин картотека туры кирәкле өч йолдызга алып бара.' } },
      { img: '/Lectures/assets/img/L3/L3-11-inverted-index-cards.png', concept: {
        en: 'the inverted index: word → list of documents. Each card holds a term and the star-charts (postings) it points to.',
        ru: 'инвертированный индекс: слово → список документов. Каждая карточка хранит терм и звёздные карты (постинги), на которые он указывает.',
        tt: 'инверсияләнгән индекс: сүз → документлар исемлеге. Һәр карточка термны һәм ул күрсәткән йолдыз карталарын (постингларны) саклый.' } },
      { img: '/Lectures/assets/img/L3/L3-12-postings-compression.png', concept: {
        en: 'store the gaps, not the stars: a postings list compresses by keeping the differences between doc IDs (7,12,13,99 → +7,+5,+1,+86).',
        ru: 'храни разрывы, а не звёзды: список постингов сжимается, сохраняя разницу между ID документов (7,12,13,99 → +7,+5,+1,+86).',
        tt: 'йолдызларны түгел, араларны сакла: постинглар исемлеге документ ID’лары арасындагы аерманы саклап кысыла (7,12,13,99 → +7,+5,+1,+86).' } },
      { img: '/Lectures/assets/img/L3/L3-13-bm25-saga.png', concept: {
        en: 'the BM25 saga: a timeline of ranking instruments refined over generations — knotted rope → TF·IDF → sextant (BM25) → tuned BM25 (k₁,b).',
        ru: 'сага BM25: линия времени инструментов ранжирования, оттачиваемых поколениями — узловая верёвка → TF·IDF → секстант (BM25) → настроенный BM25 (k₁,b).',
        tt: 'BM25 сагасы: буыннар буе оттачивать ителгән ранжлау коралларының вакыт сызыгы — төенле бау → TF·IDF → секстант (BM25) → көйләнгән BM25 (k₁,b).' } },
      { img: '/Lectures/assets/img/L3/L3-14-pagerank-stars-voting.png', concept: {
        en: 'PageRank: links are votes. Stars point at each other; authority flows to the star the most arrows pile onto — it glows brightest.',
        ru: 'PageRank: ссылки — это голоса. Звёзды указывают друг на друга; авторитет течёт к звезде, на которую падает больше всего стрелок — она светит ярче всех.',
        tt: 'PageRank: сылтамалар — тавышлар. Йолдызлар бер-берсенә күрсәтә; абруй иң күп ук төшкән йолдызга ага — ул иң якты яна.' } },
      { img: '/Lectures/assets/img/L3/L3-15-fusion-navigators-council.png', concept: {
        en: 'rank fusion (RRF): a council of navigators with disagreeing star-charts merges them into one ranked master-chart.',
        ru: 'слияние ранжирований (RRF): совет навигаторов с расходящимися звёздными картами сводит их в одну ранжированную мастер-карту.',
        tt: 'ранжлауларны кушу (RRF): килешмәгән йолдыз карталары булган навигаторлар советы аларны бер ранжланган мастер-картага җыя.' } },
      { img: '/Lectures/assets/img/L3/L3-16-bag-of-words.png', concept: {
        en: 'bag of words: tip a document into a bag and word order spills out — only the counts remain. The classic IR representation.',
        ru: 'мешок слов: вытряхиваем документ в мешок, и порядок слов теряется — остаются только счётчики. Классическое представление в IR.',
        tt: 'сүзләр капчыгы: документны капчыкка вытряхивать итәбез, сүзләр тәртибе югала — бары тик санаулар кала. IR’дагы классик тасвирлау.' } },
      { img: '/Lectures/assets/img/L3/L3-17-reweight.png', concept: {
        en: 're-weighting (TF·IDF): on the balance, common words shrink and rare words grow heavier — specificity earns weight.',
        ru: 'перевзвешивание (TF·IDF): на весах частые слова легчают, а редкие тяжелеют — специфичность зарабатывает вес.',
        tt: 'яңадан үлчәү (TF·IDF): тәрәзәдә еш сүзләр җиңеләя, ә сирәкләре авырая — спецификлык авырлык яулый.' } },
    ],
  },
  {
    id: 'L4',
    title: { en: 'Lecture 4 — The Proving Grounds', ru: 'Лекция 4 — Полигон', tt: 'Лекция 4 — Полигон' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/04'),
    items: [
      { img: '/Lectures/assets/img/L4/L4-00-proving-grounds.png', concept: {
        en: 'the Proving Grounds: evaluation is where two search systems compete on a scoreboard — you measure, you don’t guess.',
        ru: 'Полигон: оценивание — это арена, где две поисковые системы соревнуются на табло — ты измеряешь, а не угадываешь.',
        tt: 'Полигон: бәяләү — ике эзләү системасы табло өстендә ярыша торган арена — син үлчисең, чамаламыйсың.' } },
      { img: '/Lectures/assets/img/L4/L4-01-cant-eyeball.png', concept: {
        en: 'you can’t eyeball quality at scale: with millions of queries, intuition fails — you need metrics computed over judged data.',
        ru: 'качество на масштабе на глаз не оценить: на миллионах запросов интуиция отказывает — нужны метрики, посчитанные по размеченным данным.',
        tt: 'масштабта сыйфатны күз белән бәяләп булмый: миллионнарча сорауда интуиция эшләми — билгеләнгән мәгълүмат буенча санланган метрикалар кирәк.' } },
      { img: '/Lectures/assets/img/L4/L4-02-qrels-referee.png', concept: {
        en: 'qrels = the referee: a human assessor stamps each result relevant or not — the ground truth every metric is measured against.',
        ru: 'qrels = судья: человек-асессор ставит штамп «релевантно / нет» на каждый результат — это эталон, относительно которого считается любая метрика.',
        tt: 'qrels = хөкемдар: кеше-асессор һәр нәтиҗәгә «релевант / юк» штампын куя — һәр метрика үлчәнә торган эталон.' } },
      { img: '/Lectures/assets/img/L4/L4-04-ndcg-ideal-vs-actual.png', concept: {
        en: 'nDCG = your ladder vs the ideal ladder: discounted gain rewards putting relevant results high; you normalise against the perfect ranking.',
        ru: 'nDCG = твоя лестница против идеальной: дисконтированный gain вознаграждает за релевантные результаты наверху; нормируешь относительно идеального ранжирования.',
        tt: 'nDCG = синең баскыч идеаль баскычка каршы: дисконтланган gain релевант нәтиҗәләрне өскә куюны бүләкли; идеаль ранжлауга карата нормалаштырасың.' } },
      { img: '/Lectures/assets/img/L4/L4-10-significance-dice.png', concept: {
        en: 'real… or random?: two scores 0.612 vs 0.628 — is the gap skill or luck? A significance test rolls the dice of chance.',
        ru: 'реально… или случайно?: два балла 0.612 против 0.628 — это мастерство или удача? Тест значимости бросает кости случая.',
        tt: 'чынмы… әллә очраклымы?: ике балл 0.612 0.628’гә каршы — бу осталыкмы әллә бәхетме? Әһәмиятлелек тесты очраклылык сөякләрен ыргыта.' } },
      { img: '/Lectures/assets/img/L4/L4-11-ab-parallel-universes.png', concept: {
        en: 'the A/B test: split identical users into two parallel universes — one sees system A, one sees B — then compare which world is happier.',
        ru: 'A/B-тест: раздели одинаковых пользователей на две параллельные вселенные — одна видит систему A, другая B — и сравни, в каком мире счастливее.',
        tt: 'A/B-тест: бертөрле кулланучыларны ике параллель галәмгә бүл — берсе A системасын күрә, икенчесе B — аннары кайсы дөнья бәхетлерәк икәнен чагыштыр.' } },
    ],
  },
  {
    id: 'L5',
    title: { en: 'Lecture 5 — The Map of Meaning', ru: 'Лекция 5 — Карта Смысла', tt: 'Лекция 5 — Мәгънә Картасы' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/05'),
    items: [
      { img: '/Lectures/assets/img/L5/L5-00-map-of-meaning.png', concept: {
        en: 'the Map of Meaning: words leave the world of symbols and get coordinates, so near = related. The First-Contact alien finally has a place on the map.',
        ru: 'Карта Смысла: слова покидают мир символов и получают координаты, так что рядом = связано. Пришелец из «Первого Контакта» наконец-то получает место на карте.',
        tt: 'Мәгънә Картасы: сүзләр символлар дөньясыннан чыгып координаталар ала, шуңа күрә якын = бәйле. «Беренче Контакт»тагы чит планеталы ниһаять картада урын ала.' } },
      { img: '/Lectures/assets/img/L5/L5-02-words-to-coordinates.png', concept: {
        en: 'the distributional hypothesis: "you shall know a word by the company it keeps." Meaning is the contexts a word appears in, turned into coordinates.',
        ru: 'дистрибутивная гипотеза: «слово узнаётся по компании, в которой оно встречается». Смысл — это контексты слова, превращённые в координаты.',
        tt: 'дистрибутив гипотеза: «сүз үзе йөргән җәмгыять буенча таныла». Мәгънә — сүз очраган контекстлар, координаталарга әйләндерелгән.' } },
      { img: '/Lectures/assets/img/L5/L5-05-analogy-arrows.png', concept: {
        en: 'directions encode relations: king − man + woman ≈ queen. The same arrow that carries man→woman carries king→queen — meaning becomes arithmetic.',
        ru: 'направления кодируют отношения: король − мужчина + женщина ≈ королева. Та же стрелка, что ведёт мужчина→женщина, ведёт король→королева — смысл становится арифметикой.',
        tt: 'юнәлешләр мөнәсәбәтләрне кодлый: патша − ир + хатын ≈ патшабикә. Ир→хатын алып барган шул ук ук патша→патшабикәне алып бара — мәгънә арифметикага әйләнә.' } },
      { img: '/Lectures/assets/img/L5/L5-10-folded-map-manifold.png', concept: {
        en: 'the manifold: meaning lives on a curved surface inside 300-D, so a straight line isn’t enough — non-linear methods preserve neighbours, not global geometry.',
        ru: 'многообразие: смысл живёт на изогнутой поверхности внутри 300-мерного пространства, так что прямой недостаточно — нелинейные методы сохраняют соседей, а не глобальную геометрию.',
        tt: 'күппочмаклык: мәгънә 300 үлчәмле эчендәге кәкре өслектә яши, шуңа күрә туры сызык җитми — сызыкча булмаган ысуллар глобаль геометрияне түгел, күршеләрне саклый.' } },
      { img: '/Lectures/assets/img/L5/L5-12-tsne-mirage.png', concept: {
        en: 'the t-SNE mirage (P7): don’t over-read the picture — cluster sizes, gaps and between-cluster distances are NOT global; perplexity changes everything.',
        ru: 'мираж t-SNE (P7): не вычитывай из картинки лишнего — размеры кластеров, разрывы и расстояния между кластерами НЕ глобальны; perplexity меняет всё.',
        tt: 'tSNE миражы (P7): рәсемнән артыгын укыма — кластер зурлыклары, ярыклар һәм кластерлар арасы ераклык ГЛОБАЛЬ түгел; perplexity барысын да үзгәртә.' } },
      { img: '/Lectures/assets/img/L5/L5-14-map-drawn.png', concept: {
        en: 'the map is drawn: synonyms now land near each other and Sir Cosine rides it — but "bank" is still one vector for two meanings, cornering the Gremlin → L6.',
        ru: 'карта нарисована: синонимы теперь рядом, и Сэр Косинус скачет по ней — но «банк» всё ещё один вектор на два значения, и Гремлин загнан в угол → L6.',
        tt: 'карта сызылган: синонимнар хәзер янәшә төшә һәм Сэр Косинус аның буйлап чаба — ләкин «банк» һаман ике мәгънә өчен бер вектор, Гремлинны почмакка кысып → L6.' } },
    ],
  },
  {
    id: 'L6',
    title: { en: 'Lecture 6 — The Council of Attention', ru: 'Лекция 6 — Совет Внимания', tt: 'Лекция 6 — Игътибар Советы' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/06'),
    items: [
      { img: '/Lectures/assets/img/L6/L6-01-bank-two-meanings.png', concept: {
        en: '"bank" — river or money?: one static vector (L5) can’t be in two minds. Context is missing — the same word needs different coordinates per sentence.',
        ru: '«банк» — берег или деньги?: один статический вектор (L5) не может быть в двух смыслах сразу. Не хватает контекста — одному слову нужны разные координаты в разных предложениях.',
        tt: '«банк» — яр әллә акчамы?: бер статик вектор (L5) ике уйда була алмый. Контекст җитми — бер сүзгә һәр җөмләдә төрле координаталар кирәк.' } },
      { img: '/Lectures/assets/img/L6/L6-04-attention-weights.png', concept: {
        en: 'attention weights: softmax(QKᵀ/√dₖ)V — each token blends its neighbours by how much it attends to them. The heatmap shows who heeds whom.',
        ru: 'веса внимания: softmax(QKᵀ/√dₖ)V — каждый токен смешивает соседей по тому, насколько он на них смотрит. Тепловая карта показывает, кто кого слушает.',
        tt: 'игътибар авырлыклары: softmax(QKᵀ/√dₖ)V — һәр токен күршеләрен аларга күпме игътибар итүенә карап кушылдыра. Җылылык картасы кем кемне тыңлаганын күрсәтә.' } },
      { img: '/Lectures/assets/img/L6/L6-07-positional-order.png', concept: {
        en: 'attention is order-blind: "dog bites man" = "man bites dog" without position. Sinusoidal encoding sin/cos(pos/10000^{2i/d}) injects the missing order.',
        ru: 'внимание слепо к порядку: «собака кусает человека» = «человек кусает собаку» без позиции. Синусоидальное кодирование sin/cos(pos/10000^{2i/d}) добавляет недостающий порядок.',
        tt: 'игътибар тәртипкә сукыр: позициясез «эт кешене тешли» = «кеше этне тешли». Синусоидаль кодлау sin/cos(pos/10000^{2i/d}) җитмәгән тәртипне өсти.' } },
      { img: '/Lectures/assets/img/L6/L6-09-transformer-block.png', concept: {
        en: 'the Transformer block: multi-head attention → Add & Norm → feed-forward → Add & Norm, stacked ×N. Residuals + LayerNorm keep deep stacks trainable.',
        ru: 'блок Трансформера: multi-head attention → Add & Norm → feed-forward → Add & Norm, повторённый ×N. Остаточные связи + LayerNorm удерживают глубокие стопки обучаемыми.',
        tt: 'Трансформер блогы: multi-head attention → Add & Norm → feed-forward → Add & Norm, ×N тапкыр өелгән. Калдык бәйләнешләр + LayerNorm тирән өемнәрне өйрәнелерлек тота.' } },
      { img: '/Lectures/assets/img/L6/L6-12-contrastive-pull-push.png', concept: {
        en: 'contrastive learning (InfoNCE): pull the positive pair together, push the negatives apart — train the space for retrieval, with cosine inside the loss.',
        ru: 'контрастное обучение (InfoNCE): притяни положительную пару, оттолкни отрицательные — обучи пространство под поиск, с косинусом внутри функции потерь.',
        tt: 'контраст өйрәнү (InfoNCE): уңай парны тарт, тискәреләрне этәр — пространствоны эзләү өчен өйрәт, югалту функциясе эчендә косинус белән.' } },
      { img: '/Lectures/assets/img/L6/L6-15-gremlin-caged.png', concept: {
        en: 'the Lexical Gremlin is finally caged (callback L1): contrastive learning collapses "couch" and "sofa" together — the lexical gap is closed. Bridge → L7.',
        ru: 'Лексический Гремлин наконец заперт (отсылка к L1): контрастное обучение сводит «диван» и «софу» вместе — словарный разрыв закрыт. Мост → L7.',
        tt: 'Лексик Гремлин ниһаять читлеккә ябылды (L1’гә ишарә): контраст өйрәнү «диван» белән «софаны» бергә җыя — лексик ярык ябылды. Күпер → L7.' } },
    ],
  },
  {
    id: 'L7',
    title: { en: 'Lecture 7 — Scouts and Judges', ru: 'Лекция 7 — Разведчики и судьи', tt: 'Лекция 7 — Разведчиклар һәм хөкемчеләр' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/07'),
    items: [
      { img: '/Lectures/assets/img/L7/L7-00-scouts-and-judges.png', concept: {
        en: 'two roles in one pipeline: the bi-encoder is a fast SCOUT that embeds query and documents separately and recalls many candidates; the cross-encoder is a slow JUDGE that reads a (query, doc) pair together and ranks the few.',
        ru: 'две роли в одном конвейере: би-энкодер — быстрый РАЗВЕДЧИК, кодирующий запрос и документы по отдельности и набирающий много кандидатов; кросс-энкодер — медленный СУДЬЯ, читающий пару (запрос, документ) вместе и ранжирующий немногих.',
        tt: 'бер конвейерда ике роль: би-энкодер — сорау белән документларны аерым кодлап күп кандидат җыючы тиз РАЗВЕДЧИК; кросс-энкодер — (сорау, документ) парын бергә укып азларны ранжлаучы әкрен ХӨКЕМЧЕ.' } },
      { img: '/Lectures/assets/img/L7/L7-06-hiring-funnel.png', concept: {
        en: 'the multi-stage funnel: cheap dense retrieval casts a wide net for recall, then an expensive cross-encoder re-ranks the shortlist for precision — recall first, precision last.',
        ru: 'многостадийная воронка: дешёвый плотный поиск забрасывает широкую сеть ради полноты, затем дорогой кросс-энкодер переранжирует короткий список ради точности — сначала полнота, потом точность.',
        tt: 'күп баскычлы воронка: арзан тыгыз эзләү тулылык өчен киң җәя ташлый, аннары кыйммәтле кросс-энкодер кыска исемлекне төгәллек өчен яңадан ранжлый — башта тулылык, аннары төгәллек.' } },
      { img: '/Lectures/assets/img/L7/L7-04-interview-room.png', concept: {
        en: 'the cross-encoder interview: query and document sit in the same room and attend to each other token by token — far more accurate than two separate embeddings, far too slow to run on millions.',
        ru: 'собеседование кросс-энкодера: запрос и документ сидят в одной комнате и обращают внимание друг на друга токен за токеном — куда точнее двух раздельных эмбеддингов, но слишком медленно для миллионов.',
        tt: 'кросс-энкодер әңгәмәсе: сорау белән документ бер бүлмәдә утыра һәм токен-токен бер-берсенә игътибар итә — ике аерым эмбеддингка караганда күпкә төгәлрәк, ләкин миллионнар өчен артык әкрен.' } },
      { img: '/Lectures/assets/img/L7/L7-09-embedder-zoo.png', concept: {
        en: 'the embedder zoo: DPR, SBERT, E5, BGE… choose an encoder by task, budget and domain — there is no single best scout for every mission.',
        ru: 'зоопарк энкодеров: DPR, SBERT, E5, BGE… выбирай энкодер по задаче, бюджету и домену — единственного лучшего разведчика на все случаи нет.',
        tt: 'энкодерлар хайванаты бакчасы: DPR, SBERT, E5, BGE… энкодерны бурыч, бюджет һәм өлкә буенча сайла — һәр миссия өчен бердәнбер иң яхшы разведчик юк.' } },
    ],
  },
  {
    id: 'L8',
    title: { en: 'Lecture 8 — The Alliance', ru: 'Лекция 8 — Альянс', tt: 'Лекция 8 — Альянс' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/08'),
    items: [
      { img: '/Lectures/assets/img/L8/L8-00-the-alliance.png', concept: {
        en: 'the alliance of representations: dense (meaning), sparse (exact terms) and late-interaction (token-level) join forces — each covers the others’ blind spots.',
        ru: 'альянс представлений: плотные (смысл), разреженные (точные термины) и позднее взаимодействие (на уровне токенов) объединяются — каждый закрывает слепые зоны других.',
        tt: 'күрсәтмәләр альянсы: тыгыз (мәгънә), сирәк (төгәл терминнар) һәм соңгы үзара тәэсир (токен дәрәҗәсендә) көчләрен берләштерә — һәрберсе башкаларның сукыр почмакларын каплый.' } },
      { img: '/Lectures/assets/img/L8/L8-01-token-muster.png', concept: {
        en: 'late interaction (ColBERT): keep one vector per token and score by summing each query token’s best match — the accuracy of a cross-encoder at a fraction of the cost.',
        ru: 'позднее взаимодействие (ColBERT): храни по вектору на токен и считай счёт как сумму лучших совпадений каждого токена запроса — точность кросс-энкодера за долю стоимости.',
        tt: 'соңгы үзара тәэсир (ColBERT): һәр токенга бер вектор сакла һәм сорауның һәр токены өчен иң яхшы туры килүләрне кушып бәя сана — кросс-энкодер төгәллеге бәясенең бер өлешенә.' } },
      { img: '/Lectures/assets/img/L8/L8-02-expanded-banner.png', concept: {
        en: 'learned sparse (SPLADE): a neural model expands a query into weighted terms — including words that were never typed — so the inverted index can find synonyms.',
        ru: 'обучаемая разреженность (SPLADE): нейросеть расширяет запрос во взвешенные термины — включая слова, которые не набирали, — чтобы инвертированный индекс находил синонимы.',
        tt: 'өйрәнелгән сирәклек (SPLADE): нейросеть сорауны авырлыклы терминнарга киңәйтә — язылмаган сүзләрне дә кертеп — инверт индекс синонимнарны таба алсын өчен.' } },
      { img: '/Lectures/assets/img/L8/L8-03-two-rivers.png', concept: {
        en: 'hybrid retrieval: two rivers — dense and sparse — merged by rank (RRF), so a result strong in either stream survives the confluence.',
        ru: 'гибридный поиск: две реки — плотная и разреженная — сливаются по рангу (RRF), так что результат, сильный в любом из потоков, переживает слияние.',
        tt: 'гибрид эзләү: ике елга — тыгыз һәм сирәк — ранг буенча кушыла (RRF), шуңа теләсә кайсы агымда көчле нәтиҗә кушылуны кичерә.' } },
    ],
  },
  {
    id: 'L9',
    title: { en: 'Lecture 9 — Hyperspace Lanes', ru: 'Лекция 9 — Гиперпространственные трассы', tt: 'Лекция 9 — Гиперкосмик юллар' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/09'),
    items: [
      { img: '/Lectures/assets/img/L9/L9-00-hyperspace-lanes.png', concept: {
        en: 'approximate nearest-neighbour search: at a billion vectors you cannot scan every star. ANN trades a sliver of recall for orders-of-magnitude speed by precomputing lanes through the space.',
        ru: 'приближённый поиск ближайших соседей: на миллиарде векторов нельзя просканировать каждую звезду. ANN меняет крупицу полноты на ускорение в разы, заранее прокладывая трассы сквозь пространство.',
        tt: 'якынча иң якын күршеләрне эзләү: миллиард вектор булганда һәр йолдызны сканерлап булмый. ANN киңлек аша юлларны алдан салып, тулылыкның бер кисәген тизлеккә алыштыра.' } },
      { img: '/Lectures/assets/img/L9/L9-02-jump-gates-hnsw.png', concept: {
        en: 'HNSW: a multi-layer graph of jump-gates — start coarse on the top layer, descend, and greedily hop toward the query’s neighbourhood in logarithmic steps.',
        ru: 'HNSW: многослойный граф прыжковых врат — начни грубо на верхнем слое, спускайся и жадно прыгай к окрестности запроса за логарифмическое число шагов.',
        tt: 'HNSW: сикерү капкаларының күп катлы графы — өске катламда тупас башла, төш һәм сорау тирәлегенә логарифмик адымнарда комсызланып сикер.' } },
      { img: '/Lectures/assets/img/L9/L9-03-sectors-ivf.png', concept: {
        en: 'IVF: carve the space into sectors (clusters) and search only the few nearest — a coarse map that lets you skip most of the galaxy.',
        ru: 'IVF: разрежь пространство на секторы (кластеры) и ищи только в нескольких ближайших — грубая карта, позволяющая пропустить бо́льшую часть галактики.',
        tt: 'IVF: киңлекне секторларга (кластерларга) бүл һәм бары иң якын берничәсендә эзлә — галактиканың күп өлешен сикереп үтәргә мөмкинлек бирүче тупас карта.' } },
      { img: '/Lectures/assets/img/L9/L9-04-fold-the-maps-pq.png', concept: {
        en: 'product quantization: fold each vector into a short code of sub-space centroids — 32× smaller in memory, with distances read from a tiny lookup table.',
        ru: 'продуктовое квантование: сверни каждый вектор в короткий код центроидов подпространств — в 32× меньше памяти, а расстояния читаются из крошечной таблицы.',
        tt: 'продукт квантлау: һәр векторны асль-киңлек центроидларының кыска кодына төр — хәтердә 32 тапкыр кечерәк, ераклыклар кечкенә таблицадан укыла.' } },
    ],
  },
  {
    id: 'L10',
    title: { en: 'Lecture 10 — The Oracle', ru: 'Лекция 10 — Оракул', tt: 'Лекция 10 — Оракул' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/10'),
    items: [
      { img: '/Lectures/assets/img/L10/L10-02-retrieve-then-speak.png', concept: {
        en: 'the RAG loop: retrieve relevant passages, hand them to the model, THEN let it answer — grounded in what it found, not in what it half-remembers.',
        ru: 'цикл RAG: извлеки релевантные пассажи, передай их модели и ТОЛЬКО ПОТОМ дай ответить — опираясь на найденное, а не на смутно припоминаемое.',
        tt: 'RAG циклы: мөһим пассажларны табып ал, аларны моделгә бир һәм АННАН ГЫНА җавап бирергә рөхсәт ит — тапканына таянып, ярым хәтерләгәненә түгел.' } },
      { img: '/Lectures/assets/img/L10/L10-04-overlap-saves.png', concept: {
        en: 'chunk overlap: let adjacent passages share a margin, so an idea straddling a boundary still lands whole in at least one chunk.',
        ru: 'нахлёст чанков: пусть соседние пассажи делят край, чтобы мысль, попавшая на границу, целиком уместилась хотя бы в одном куске.',
        tt: 'чанклар ятышы: күрше пассажлар чикне уртаклашсын, чик өстенә эләккән фикер ким дигәндә бер кисәктә тулысынча урнашсын өчен.' } },
      { img: '/Lectures/assets/img/L10/L10-05-hear-the-real-question.png', concept: {
        en: 'query understanding: a raw question is often under-specified. Rewrite, expand or decompose it before retrieval, so the index hears what was really meant.',
        ru: 'понимание запроса: сырой вопрос часто недоопределён. Перепиши, расширь или разложи его до поиска, чтобы индекс услышал, что имелось в виду на самом деле.',
        tt: 'сорауны аңлау: чи сорау еш кына җитәрлек ачыкланмаган. Эзләүгә кадәр аны яңадан яз, киңәйт яисә кисәкләргә бүл, индекс чынлыкта нәрсә күздә тотылганын ишетсен өчен.' } },
      { img: '/Lectures/assets/img/L10/L10-10-raptor-tree.png', concept: {
        en: 'RAPTOR: cluster and summarise passages into a tree, so a query can pull a high-level summary or a leaf-level detail as the question needs.',
        ru: 'RAPTOR: кластеризуй и суммируй пассажи в дерево, чтобы запрос мог достать обзор высокого уровня или детальный лист — по потребности вопроса.',
        tt: 'RAPTOR: пассажларны кластерла һәм агачка йомгаклап тупла, сорау кирәгенә карап югары дәрәҗәдәге йомгакны яки яфрак дәрәҗәсендәге детальне ала алсын өчен.' } },
    ],
  },
  {
    id: 'L11',
    title: { en: 'Lecture 11 — Judging the Oracle', ru: 'Лекция 11 — Судим Оракула', tt: 'Лекция 11 — Оракулны хөкем итү' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/11'),
    items: [
      { img: '/Lectures/assets/img/L11/L11-00-judging-the-oracle.png', concept: {
        en: 'you cannot ship what you cannot measure: RAG needs its own scorecard — retrieval quality, answer faithfulness and relevance, not just a single accuracy number.',
        ru: 'нельзя выпустить то, что не можешь измерить: RAG нужна своя оценочная карта — качество поиска, верность и релевантность ответа, а не одно число точности.',
        tt: 'үлчәп булмаганны чыгарып булмый: RAG’ка үз бәя картасы кирәк — эзләү сыйфаты, җавапның тугрылыгы һәм мөнәсәбәтлелеге, бер генә төгәллек саны түгел.' } },
      { img: '/Lectures/assets/img/L11/L11-02-four-metrics.png', concept: {
        en: 'the RAGAS quartet: context precision & recall (did retrieval bring the right passages?) and faithfulness & answer relevance (did the answer use them honestly?).',
        ru: 'квартет RAGAS: точность и полнота контекста (принёс ли поиск нужные пассажи?) и верность с релевантностью ответа (честно ли ответ их использовал?).',
        tt: 'RAGAS дүртлеге: контекстның төгәллеге һәм тулылыгы (эзләү кирәкле пассажларны китердеме?) һәм җавапның тугрылыгы белән мөнәсәбәтлелеге (җавап аларны намуслы кулландымы?).' } },
      { img: '/Lectures/assets/img/L11/L11-03-faithfulness-claims.png', concept: {
        en: 'faithfulness, claim by claim: break the answer into atomic claims and check each one is supported by a retrieved source — catch the confident fabrication.',
        ru: 'верность, утверждение за утверждением: разбей ответ на атомарные утверждения и проверь, что каждое подкреплено найденным источником — поймай уверенную выдумку.',
        tt: 'тугрылык, раслау артыннан раслау: җавапны атомар раславларга бүл һәм һәрберсенең табылган чыганак белән ныгытылуын тикшер — үзенә ышанган уйдырманы тот.' } },
      { img: '/Lectures/assets/img/L11/L11-09-position-bias.png', concept: {
        en: 'the LLM judge has biases — it favours the first option, longer answers and its own style. Robust evaluation swaps positions and ensembles judges to cancel them.',
        ru: 'у LLM-судьи есть смещения — он любит первый вариант, ответы подлиннее и собственный стиль. Надёжная оценка меняет позиции местами и ансамблирует судей, чтобы их погасить.',
        tt: 'LLM-хөкемченең янтаюлары бар — ул беренче вариантны, озынрак җаваптарны һәм үз стилен ярата. Ышанычлы бәяләү позицияләрне алыштыра һәм хөкемчеләрне ансамбльли, аларны юкка чыгару өчен.' } },
    ],
  },
  {
    id: 'L12',
    title: { en: 'Lecture 12 — The Deep Field', ru: 'Лекция 12 — Глубокое поле', tt: 'Лекция 12 — Тирән кыр' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/12'),
    items: [
      { img: '/Lectures/assets/img/L12/L12-00-the-deep-field.png', concept: {
        en: 'some questions no single record answers: stare long enough and a thousand linked galaxies bloom. The deepest answers are scattered across many records, in many forms.',
        ru: 'на иные вопросы не ответит ни одна запись: вглядись подольше — и расцветает тысяча связанных галактик. Самые глубокие ответы рассеяны по многим записям, во многих формах.',
        tt: 'кайбер сорауларга бер язма да җавап бирми: озаграк карап тор — меңләгән бәйле галактика чәчәк ата. Иң тирән җаваптар күп язмаларга, күп формаларга чәчелгән.' } },
      { img: '/Lectures/assets/img/L12/L12-02-shared-space.png', concept: {
        en: 'multimodal embeddings: pull text and images into one shared space, so “a photo of a sunset” retrieves the picture — different modalities, one geometry.',
        ru: 'мультимодальные эмбеддинги: втяни текст и изображения в одно общее пространство, чтобы «фото заката» доставало картинку — разные модальности, одна геометрия.',
        tt: 'мультимодаль эмбеддинглар: текст белән рәсемнәрне бер уртак киңлеккә тарт, «кояш баешы фотосы» рәсемне тапсын өчен — төрле модальлекләр, бер геометрия.' } },
      { img: '/Lectures/assets/img/L12/L12-04-colpali.png', concept: {
        en: 'ColPali: embed a document’s page IMAGE directly with late interaction — skip brittle OCR and parsing and retrieve straight from the rendered page.',
        ru: 'ColPali: закодируй саму КАРТИНКУ страницы документа через позднее взаимодействие — пропусти хрупкий OCR и парсинг и ищи прямо по отрисованной странице.',
        tt: 'ColPali: документ битенең РӘСЕМЕН соңгы үзара тәэсир аша турыдан-туры эмбеддла — челпәрәмә OCR һәм парсингны сикереп үт, ясалган биттән туры эзлә.' } },
      { img: '/Lectures/assets/img/L12/L12-12-ethics-bias.png', concept: {
        en: 'retrieval inherits the corpus: what is under-represented stays unfound. Bias, attribution and safety are part of the system, not an afterthought.',
        ru: 'поиск наследует корпус: недопредставленное так и остаётся ненайденным. Смещения, атрибуция и безопасность — часть системы, а не запоздалая мысль.',
        tt: 'эзләү корпусны мирас итеп ала: аз тәкъдим ителгән нәрсә табылмыйча кала. Янтаюлар, атрибуция һәм куркынычсызлык — системаның өлеше, соңыннан уйланган фикер түгел.' } },
    ],
  },
  {
    id: 'L13',
    title: { en: 'Lecture 13 — The Crucible of Negatives', ru: 'Лекция 13 — Горнило негативов', tt: 'Лекция 13 — Негативлар горны' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/13'),
    items: [
      { img: '/Lectures/assets/img/L13/L13-00-the-crucible.png', concept: {
        en: 'the forge: a dense retriever is forged by the opponents it trains against. Training is the crucible; the negatives are the hammer that gives the blade its edge.',
        ru: 'горнило: плотный ретривер выкован противниками, против которых обучается. Обучение — это горнило; негативы — молот, дающий клинку остроту.',
        tt: 'горн: тыгыз ретривер каршы өйрәнгән көндәшләре тарафыннан чарлана. Өйрәнү — бу горн; негативлар — клинокка үткенлек бирүче чүкеч.' } },
      { img: '/Lectures/assets/img/L13/L13-04-sir-cosine-hardness.png', concept: {
        en: 'hardness is an angle: Sir Cosine measures cos(q,d⁻). Easy negatives sit far and give no gradient; hard ones crowd the query — a negative is worth exactly its gradient.',
        ru: 'трудность — это угол: Сэр Косинус измеряет cos(q,d⁻). Лёгкие негативы далеко и не дают градиента; трудные теснят запрос — негатив стоит ровно своего градиента.',
        tt: 'катлаулык — почмак: Сэр Косинус cos(q,d⁻) үлчи. Җиңел негативлар ерак һәм градиент бирми; катлаулылары сорауны кыса — негатив нәкъ үз градиенты кадәр кыйммәтле.' } },
      { img: '/Lectures/assets/img/L13/L13-06-forge-path.png', concept: {
        en: 'the fifteen-year search for good opponents: random → in-batch → BM25 → model-mined → denoised → distilled → modern two-stage. Each anvil fixes the flaw in the one before.',
        ru: 'пятнадцатилетний поиск хороших противников: случайные → in-batch → BM25 → намайненные моделью → очищенные → дистиллированные → современные двухстадийные. Каждая наковальня чинит изъян предыдущей.',
        tt: 'яхшы көндәшләр өчен унбиш еллык эзләү: очраклы → in-batch → BM25 → модель майнинглаган → чистартылган → дистилляцияләнгән → заманча ике баскычлы. Һәр сандал алдагысының кимчелеген төзәтә.' } },
      { img: '/Lectures/assets/img/L13/L13-14-true-edge.png', concept: {
        en: 'forged by worthy opponents: effectiveness lives in a narrow hard-but-honest band. The impostor and the stale ghosts are beaten; Séréga raises a keen, true-edged blade. Bridge → deep-dive #4, The Curved Map.',
        ru: 'выкован достойными противниками: эффективность живёт в узкой трудной-но-честной полосе. Самозванец и устаревшие призраки повержены; Серёга поднимает острый, истинный клинок. Мост → глубокое погружение №4, Кривая Карта.',
        tt: 'лаеклы көндәшләр тарафыннан чарланган: нәтиҗәлелек тар катлаулы ләкин намуслы полосада яши. Самозванец һәм искергән өрәкләр җиңелде; Серёга үткен, чын кырлы клинок күтәрә. Күпер → тирән чуму №4, Бөгелгән Карта.' } },
    ],
  },
  {
    id: 'L14',
    title: { en: 'Lecture 14 — The Artificer’s Quill', ru: 'Лекция 14 — Перо Артефактора', tt: 'Лекция 14 — Артефактор Каләме' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/14'),
    items: [
      { img: '/Lectures/assets/img/L14/L14-01-gremlin-door.png', concept: {
        en: 'the Lexical Gremlin guards the archive door — he passes only queries whose words match the shelves. The answer may be right there, in different words, and still be turned away: the vocabulary mismatch.',
        ru: 'Лексический Гремлин сторожит дверь архива — пропускает лишь запросы, чьи слова совпадают с полками. Ответ может быть тут же, другими словами, и всё равно не пройдёт: несовпадение словаря.',
        tt: 'Лексик Гремлин архив ишеген саклый — сүзләре киштәләргә туры килгән сорауларны гына үткәрә. Җавап шунда ук, башка сүзләр белән булырга мөмкин, ләкин барыбер үткәрелмәс: сүзлек туры килмәве.' } },
      { img: '/Lectures/assets/img/L14/L14-03-hyde-hypothetical.png', concept: {
        en: 'HyDE: draft a hypothetical answer in the archive’s own wording, then embed that draft — the fake answer lives in document-space and lands where the raw question never could.',
        ru: 'HyDE: набросай гипотетический ответ на языке самого архива, затем закодируй этот черновик — поддельный ответ живёт в пространстве документов и попадает туда, куда сырой вопрос никогда бы не смог.',
        tt: 'HyDE: гипотетик җавапны архивның үз телендә яз, аннары шул караламаны эмбеддла — ясалма җавап документлар киңлегендә яши һәм чи сорау беркайчан җитә алмаган җиргә төшә.' } },
      { img: '/Lectures/assets/img/L14/L14-05-step-back-ladder.png', concept: {
        en: 'step-back: when a query is too specific to match anything, climb the ladder to the governing principle, retrieve that, then descend to answer.',
        ru: 'step-back: когда запрос слишком конкретен, чтобы хоть что-то найти, поднимись по лестнице к управляющему принципу, найди его, затем спустись к ответу.',
        tt: 'step-back: сорау берни табу өчен артык конкрет булганда, идарә итүче принципка баскычтан күтәрел, аны тап, аннары җавапка төш.' } },
      { img: '/Lectures/assets/img/L14/L14-11-captain-takes-quill.png', concept: {
        en: 'one rule for the whole toolbox: change the query, not the retriever. Séréga sets down the Quill and hands it to the captain.',
        ru: 'одно правило на весь инструментарий: меняй запрос, а не ретривер. Серёга кладёт Перо и передаёт его капитану.',
        tt: 'бөтен кораллар өчен бер кагыйдә: ретриверны түгел, сорауны үзгәрт. Серёга Каләмне куя һәм аны капитанга тапшыра.' } },
    ],
  },
  {
    id: 'L15',
    title: { en: 'Lecture 15 — BERT & other Transformers', ru: 'Лекция 15 — BERT и другие трансформеры', tt: 'Лекция 15 — BERT һәм башка трансформерлар' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/15'),
    items: [
      { img: '/Lectures/assets/img/L15/L15-02-self-attention.png', concept: {
        en: 'self-attention: every token looks at every other and mixes in what matters — the one operation the whole Transformer is built from.',
        ru: 'самовнимание: каждый токен смотрит на все остальные и подмешивает важное — единственная операция, из которой собран весь трансформер.',
        tt: 'үз-үзеңә игътибар: һәр токен башка бөтенесенә карый һәм мөһимне кушып ала — бөтен трансформер шуннан җыелган бердәнбер операция.' } },
      { img: '/Lectures/assets/img/L15/L15-05-bert-bidirectional.png', concept: {
        en: 'BERT reads both ways at once: mask a word and predict it from the left AND right context — bidirectional encoding, the backbone of dense retrieval.',
        ru: 'BERT читает сразу в обе стороны: замаскируй слово и предскажи его по левому И правому контексту — двунаправленное кодирование, хребет плотного поиска.',
        tt: 'BERT бер үк вакытта ике якка да укый: сүзне яшер һәм аны сул ҺӘМ уң контексттан юра — ике юнәлешле кодлау, тыгыз эзләүнең умырткасы.' } },
      { img: '/Lectures/assets/img/L15/L15-06-pretrain-finetune.png', concept: {
        en: 'pretrain once, fine-tune many: one expensive self-supervised phase amortizes over many cheap task heads — why BERT was practical.',
        ru: 'предобучи один раз, дообучай много: одна дорогая самообучаемая фаза амортизируется на множество дешёвых задачных голов — почему BERT оказался практичным.',
        tt: 'бер тапкыр предобуч, күп тапкыр дообуч: бер кыйммәтле үзкүзәтүле фаза күп арзан бурыч башлары буенча амортизацияләнә — BERT ни өчен практик булган.' } },
      { img: '/Lectures/assets/img/L15/L15-11-rlhf.png', concept: {
        en: 'from attention to RLHF: align a model with human preference — reward the answers people prefer, and steer the generator toward them.',
        ru: 'от внимания до RLHF: выровняй модель по человеческим предпочтениям — награждай ответы, которые люди предпочитают, и веди генератор к ним.',
        tt: 'игътибардан RLHF’ка: моделне кеше өстенлекләре буенча тигезлә — кешеләр өстен күргән җаваптарны бүләклә, генераторны аларга таба борь.' } },
    ],
  },
  {
    id: 'L16',
    title: { en: 'Lecture 16 — Late Chunking', ru: 'Лекция 16 — Late Chunking', tt: 'Лекция 16 — Late Chunking' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/16'),
    items: [
      { img: '/Lectures/assets/img/L16/L16-01-tear-first.png', concept: {
        en: 'chunk-then-embed tears the document first: each piece is embedded alone, so a chunk whose subject is a pronoun (“it”) loses what “it” refers to.',
        ru: '«нарежь-потом-эмбедь» сначала рвёт документ: каждый кусок кодируется в одиночку, так что чанк, чьё подлежащее — местоимение («it»), теряет то, на что «it» ссылается.',
        tt: '«кис-аннары-эмбеддла» башта документны ерта: һәр кисәк ялгыз эмбеддлана, шуңа подлежащиесе алмашлык («it») булган чанк «it» нәрсәгә ишарә иткәнне югалта.' } },
      { img: '/Lectures/assets/img/L16/L16-03-read-then-mark.png', concept: {
        en: 'late chunking reads the whole document first: full-document attention writes context into every token, THEN pools into chunks — no extra generation call.',
        ru: 'late chunking сначала читает весь документ: полнодокументное внимание вписывает контекст в каждый токен, ЗАТЕМ пулит в чанки — без единого доп. вызова генерации.',
        tt: 'late chunking башта бөтен документны укый: тулы документ игътибары контекстны һәр токенга яза, АННАРЫ чанкларга пуллый — бер өстәмә генерация чакыруы да юк.' } },
      { img: '/Lectures/assets/img/L16/L16-07-vs-llm.png', concept: {
        en: 'as good as the LLM method for free: late chunking matches Contextual Retrieval’s quality without the one LLM call per chunk it costs.',
        ru: 'не хуже LLM-метода — и даром: late chunking сравнивается по качеству с Contextual Retrieval без одного LLM-вызова на чанк, которого тот стоит.',
        tt: 'LLM ысулыннан ким түгел — һәм бушка: late chunking сыйфат буенча Contextual Retrieval белән тиңләшә, ул сораган һәр чанкка бер LLM чакыруыннан башка.' } },
      { img: '/Lectures/assets/img/L16/L16-08-drop-in.png', concept: {
        en: 'a free drop-in default: if your model is long-context with mean pooling, turn it on — only indexing pays more, query-time cost is unchanged.',
        ru: 'бесплатный drop-in по умолчанию: если модель длинноконтекстная с mean-pooling — включай; дороже только индексация, стоимость запроса не меняется.',
        tt: 'бушлай drop-in килешү: модель озын контекстлы һәм mean-pooling булса — кабыз; кыйммәтрәге бары индексация, сорау бәясе үзгәрми.' } },
    ],
  },
  {
    id: 'L17',
    title: { en: 'Lecture 17 — Shannon Entropy', ru: 'Лекция 17 — Энтропия Шеннона', tt: 'Лекция 17 — Шеннон энтропиясе' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/17'),
    items: [
      { img: '/Lectures/assets/img/L17/L17-00-telegraph.png', concept: {
        en: '1948: Shannon asks how much a message really carries. On the telegraph wire, information is surprise — and surprise can be measured in bits.',
        ru: '1948: Шеннон спрашивает, сколько сообщение несёт на самом деле. На телеграфном проводе информация — это неожиданность, а неожиданность измерима в битах.',
        tt: '1948: Shannon хәбәр чынлыкта күпме йөртә дип сорый. Телеграф чыбыгында мәгълүмат — көтелмәгәнлек, ә көтелмәгәнлекне bit’ларда үлчәп була.' } },
      { img: '/Lectures/assets/img/L17/L17-04-surprise-meter.png', concept: {
        en: 'entropy is the average surprise: a symbol you expected costs almost nothing; a rare one spikes the needle. H = −Σ p·log p.',
        ru: 'энтропия — это средняя неожиданность: ожидаемый символ стоит почти ничего; редкий бьёт по стрелке. H = −Σ p·log p.',
        tt: 'энтропия — уртача көтелмәгәнлек: көткән символ диярлек берни тормый; сирәге угны сикертә. H = −Σ p·log p.' } },
      { img: '/Lectures/assets/img/L17/L17-07-guessing-game.png', concept: {
        en: 'the guessing game: reveal English one letter at a time and a reader guesses four in five — the language already told them. Printed English lands near ~1 bit/letter.',
        ru: 'игра в угадайку: открывай английский по букве — и читатель угадывает четыре из пяти: язык уже всё сказал. Печатный английский оседает у ~1 бита на букву.',
        tt: 'юрау уены: инглизне берәмләп ач — укучы биштән дүртне юрый: тел инде барысын әйткән. Басма инглиз ~1 bit/хәрефтә утыра.' } },
      { img: '/Lectures/assets/img/L17/L17-11-the-floor.png', concept: {
        en: 'the entropy floor: no clever code goes under H(p). Cross-entropy is the bits you actually pay, and a language-model loss is exactly that — approaching but never crossing the red line.',
        ru: 'энтропийный пол: никакой хитрый код не опустится ниже H(p). Кросс-энтропия — это биты, которые ты реально платишь, а лосс языковой модели — ровно это: он подходит к красной черте, но не переходит её.',
        tt: 'энтропия идәне: бернинди хәйләкәр код H(p)дан түбән төшмәс. Кросс-энтропия — син чынлап түли торган bit’лар, ә тел моделе лоссы — нәкъ шул: кызыл сызыкка якыная, ләкин аны кичми.' } },
    ],
  },
  {
    id: 'L18',
    title: { en: 'Lecture 18 — The Curved Map', ru: 'Лекция 18 — Кривая карта', tt: 'Лекция 18 — Кәкре карта' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/18'),
    items: [
      { img: '/Lectures/assets/img/L18/L18-00-warped-map.png', concept: {
        en: 'the map of meaning is curved: embeddings don’t fill the sphere evenly. Two distortions — anisotropy and hubness — quietly break naïve cosine search.',
        ru: 'карта смысла искривлена: эмбеддинги не заполняют сферу равномерно. Два искажения — анизотропия и хабность — тихо ломают наивный косинусный поиск.',
        tt: 'мәгънә картасы бөгелгән: эмбеддинглар сфераны тигез тутырмый. Ике бозылу — анизотропия һәм hubness — беркатлы косинус эзләвен тыныч кына ватә.' } },
      { img: '/Lectures/assets/img/L18/L18-02-cone.png', concept: {
        en: 'anisotropy: vectors crowd into a narrow cone, so everything looks similar to everything — the score range collapses and a bi-encoder rates it all high.',
        ru: 'анизотропия: векторы теснятся в узком конусе, так что всё похоже на всё — диапазон оценки схлопывается, и би-энкодер ставит всему высокий балл.',
        tt: 'анизотропия: векторлар тар конуска кысыла, шуңа барысы да барысына охшаш — балл диапазоны сыгыла, би-энкодер барысына да югары балл куя.' } },
      { img: '/Lectures/assets/img/L18/L18-07-rome-hub.png', concept: {
        en: 'hubness: in high dimension a few points become hubs that appear in everyone’s neighbour list, while anti-hubs are found by no one — a curse of dimensionality.',
        ru: 'хабность: в высокой размерности горстка точек становится хабами, попадающими в списки соседей всех подряд, тогда как анти-хабы не находит никто — проклятие размерности.',
        tt: 'hubness: югары үлчәмлелектә берничә нокта hub’ка әйләнә, барысының да күрше исемлегенә эләгә, ә анти-hub’ларны беркем дә тапмый — үлчәмлелек ләгънәте.' } },
      { img: '/Lectures/assets/img/L18/L18-11-even-map.png', concept: {
        en: 'the fix flattens the map: whitening and contrastive training spread the vectors back out, so cosine means what it should again.',
        ru: 'лечение выпрямляет карту: отбеливание (whitening) и контрастное обучение снова разводят векторы, так что косинус опять значит то, что должен.',
        tt: 'дәвалау картаны турайта: whitening һәм контрастив өйрәнү векторларны яңадан җәя, шуңа косинус тагын тиеш булганны аңлата.' } },
      { img: '/Lectures/assets/img/L18/L18-13-signal-noise-dial.png', concept: {
        en: 'one knob behind the cone: the strength of the shared axis against each word’s own noise. Turn c/σ up and the cloud drifts off the origin, the wedge narrows, cosine climbs — the dimension never enters.',
        ru: 'за конусом одна ручка: сила общей оси против собственного шума слова. Крути c/σ — облако уезжает от начала координат, клин сужается, косинус растёт; размерность в это не вмешивается.',
        tt: 'конус артында бер тотка: уртак күчәрнең көче сүзнең үз шаукымына каршы. c/σ-ны бор — болыт башлангычтан ерагая, чөй тарая, косинус үсә; үлчәмлелек монда катнашмый.' } },
      { img: '/Lectures/assets/img/L18/L18-14-whitening-returns.png', concept: {
        en: 'whitening is the L5 tracing sheet laid over the map of meaning: centre it, turn it onto the cloud’s own axes, rescale — and the stretched diamond of four towns becomes a square.',
        ru: 'отбеливание — это калька из L5, положенная на карту смысла: центрируй, поверни на собственные оси облака, растяни — и вытянутый ромб из четырёх городов станет квадратом.',
        tt: 'агарту — мәгънә картасына салынган L5 күчермә кәгазе: үзәкләштер, болытның үз күчәрләренә бор, суз — һәм дүрт шәһәрнең сузылган ромбы квадратка әйләнә.' } },
      { img: '/Lectures/assets/img/L18/L18-15-two-tolls.png', concept: {
        en: 'the crowding toll: CSLS charges every candidate for how dense its own neighbourhood is, so a hub stops winning by living in a crowd.',
        ru: 'пошлина за скученность: CSLS берёт с каждого кандидата плату за плотность его окрестности — и хаб перестаёт выигрывать просто потому, что живёт в толпе.',
        tt: 'кысылу пошлинасы: CSLS һәр кандидаттан үз тирәлегенең тыгызлыгы өчен түләү ала — һәм хаб халык арасында яшәгәне өчен генә җиңүдән туктый.' } },
      { img: '/Lectures/assets/img/L18/L18-16-flat-but-crowded.png', concept: {
        en: 'the two distortions are independent: a map can be flattened (isotropic) and still crowded (hubbed) — which is why the two cures are complementary, not alternatives.',
        ru: 'два искажения независимы: карту можно выпрямить (изотропия) и всё равно оставить скученной (хабы) — поэтому два лекарства дополняют друг друга, а не заменяют.',
        tt: 'ике бозылу бер-берсенә бәйле түгел: картаны турайтып (изотропия) та, ул кысылган (хаблы) булып кала ала — шуңа ике дару бер-берсен алыштырмый, тулыландыра.' } },
    ],
  },
  {
    id: 'L20',
    title: { en: 'Lecture 20 — Search in Russian', ru: 'Лекция 20 — Поиск на русском', tt: 'Лекция 20 — Русча эзләү' },
    href: (lang, localizedPath) => localizedPath(lang, 'book/20'),
    items: [
      { img: '/Lectures/assets/img/L20/L20-00-morphology-strikes-back.png', concept: {
        en: 'morphology strikes back: an English-first pipeline meets a language where one lexeme wears a dozen faces, and every default quietly stops working.',
        ru: 'морфология наносит ответный удар: конвейер, собранный под английский, встречает язык, где одна лексема носит десяток лиц, — и каждый дефолт тихо перестаёт работать.',
        tt: 'морфология каршы суга: инглиз өчен җыелган конвейер бер лексема унлаган йөз кия торган телгә юлыга — һәм һәр дефолт тыныч кына эшләүдән туктый.' } },
      { img: '/Lectures/assets/img/L20/L20-01-token-tax.png', concept: {
        en: 'the token tax: the same sentence costs several times more tokens in Russian, because the vocabulary was budgeted for English. You pay in context length and in money.',
        ru: 'токен-налог: то же предложение стоит в разы больше токенов по-русски, потому что словарь закладывали под английский. Платишь длиной контекста и деньгами.',
        tt: 'токен салымы: шул ук җөмлә русча берничә тапкыр күбрәк токен тора, чөнки сүзлек инглиз өчен уйланган. Түләвең — контекст озынлыгы һәм акча.' } },
      { img: '/Lectures/assets/img/L20/L20-02-noun-paradigm.png', concept: {
        en: 'one lexeme, ten strings: six cases times two numbers, and an un-normalized index opens a separate posting list for every one of them.',
        ru: 'одна лексема — десять строк: шесть падежей на два числа, и индекс без нормализации заводит на каждую свой постинг-лист.',
        tt: 'бер лексема — ун юл: алты килеш ике санга, ә нормальләштерүсез индекс һәрберсенә аерым кергәннәр исемлеге ача.' } },
      { img: '/Lectures/assets/img/L20/L20-04-lemma-mill.png', concept: {
        en: 'the lemma mill: run both the index and the query through a dictionary and the ten lists collapse into one — the ranking inverts, and the right answer comes first.',
        ru: 'лемма-мельница: пропусти через словарь и индекс, и запрос — десять списков схлопнутся в один; ранжирование переворачивается, и верный ответ выходит первым.',
        tt: 'лемма тегермәне: индексны да, сорауны да сүзлек аша уздыр — ун исемлек берсенә җыела; ранжлау әйләнә, дөрес җавап беренче була.' } },
      { img: '/Lectures/assets/img/L20/L20-05-multilingual-space.png', concept: {
        en: 'the dense arm sidesteps morphology: a multilingual encoder puts the forms of one word next to each other, so no lemmatizer is needed on that side.',
        ru: 'плотное плечо обходит морфологию: мультиязычный энкодер кладёт формы одного слова рядом, и лемматизатор на этой стороне не нужен.',
        tt: 'тыгыз як морфологияне урап уза: күп телле энкодер бер сүзнең формаларын янәшә куя, шуңа бу якта лемматизатор кирәкми.' } },
      { img: '/Lectures/assets/img/L20/L20-06-small-cuts.png', concept: {
        en: 'death by a thousand cuts: ё/е, case, transliteration, the wrong keyboard layout, a Latin twin letter — each one small, each one a silent zero-result.',
        ru: 'смерть от тысячи порезов: ё/е, регистр, транслит, не та раскладка, латинская буква-двойник — каждый мелкий, и каждый даёт тихое «ничего не найдено».',
        tt: 'мең кисемнән үлем: ё/е, регистр, транслит, ялгыш макет, латин игезәк хәрефе — һәрберсе вак, һәрберсе тавышсыз «бернәрсә табылмады».' } },
      { img: '/Lectures/assets/img/L20/L20-14-homoglyph-mask.png', concept: {
        en: 'the homoglyph mask: a word written with Latin look-alikes is pixel-identical to the real one and scores exactly zero — same shape, different bytes.',
        ru: 'маска гомоглифа: слово, набранное латинскими двойниками, попиксельно совпадает с настоящим и получает ровно ноль — тот же вид, другие байты.',
        tt: 'гомоглиф маскасы: латин игезәкләре белән язылган сүз чын сүз белән пикселгә кадәр туры килә һәм нәкъ нуль ала — шул ук кыяфәт, башка байтлар.' } },
      { img: '/Lectures/assets/img/L20/L20-07-morphology-tamed.png', concept: {
        en: 'morphology tamed: lemmatize both arms, fold ё, normalise confusables, and put a dense arm beside BM25 — the language stops being an obstacle and becomes a setting.',
        ru: 'морфология укрощена: лемматизируй оба плеча, сверни ё, нормализуй confusables и поставь плотное плечо рядом с BM25 — и язык перестаёт быть препятствием, становясь настройкой.',
        tt: 'морфология тыңлаучан: ике якны да леммалаштыр, ё-ны җый, confusables-ны нормальләштер һәм BM25 янына тыгыз як куй — тел киртә булудан туктап, көйләүгә әйләнә.' } },
    ],
  },
];
