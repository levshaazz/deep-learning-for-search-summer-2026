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
    en: 'A navigable visual glossary for the course. The Bestiary collects the recurring cast — Serega and the creatures that personify a single idea each. The Scenes are the metaphor and hero illustrations, grouped by lecture. Every image carries a short concept caption tying it to what it teaches, and a link to the chapter where it lives.',
    ru: 'Навигируемый визуальный глоссарий курса. Бестиарий собирает повторяющихся персонажей — Серёгу и существ, каждое из которых олицетворяет одну идею. Сцены — это метафоры и hero-иллюстрации, сгруппированные по лекциям. У каждой картинки короткая подпись-концепт, связывающая её с тем, чему она учит, и ссылка на главу, где она живёт.',
    tt: 'Курсның навигацияле визуаль глоссарие. Бестиарий кабатланучы персонажларны җыя — Серёганы һәм һәрберсе бер генә идеяне гәүдәләндергән затларны. Сценалар — лекцияләр буенча төркемләнгән метафоралар һәм hero-иллюстрацияләр. Һәр рәсемдә аны нәрсәгә өйрәткәне белән бәйләгән кыска концепт-аннотация һәм ул яшәгән бүлеккә сылтама бар.',
  },
  topic: {
    en: 'Hand-drawn, Wait-But-Why style — one idea per picture, one accent colour, no gradients. The art is the mnemonic: meet the creature, remember the concept.',
    ru: 'Рисунки в стиле Wait But Why — одна идея на картинку, один акцентный цвет, без градиентов. Арт — это мнемоника: познакомься с существом, запомни концепт.',
    tt: 'Wait But Why стилендә кулдан ясалган рәсемнәр — һәр рәсемгә бер идея, бер акцент төс, градиентларсыз. Арт — ул мнемоника: зат белән таныш, концептны исеңдә калдыр.',
  },
  // Section headings for the two top-level groups.
  bestiary: {
    heading: { en: 'Bestiary — the recurring cast', ru: 'Бестиарий — повторяющиеся персонажи', tt: 'Бестиарий — кабатланучы персонажлар' },
    lead: {
      en: 'Each creature personifies exactly one concept. Meet them once here; they reappear across the lectures as the visual shorthand for that idea.',
      ru: 'Каждое существо олицетворяет ровно один концепт. Познакомьтесь с ними здесь — они возвращаются в лекциях как визуальное сокращение для этой идеи.',
      tt: 'Һәр зат төгәл бер концептны гәүдәләндерә. Алар белән монда танышыгыз — алар лекцияләрдә шул идеянең визуаль кыскартмасы буларак кабат пәйда була.',
    },
  },
  scenesHeading: { en: 'Scenes — by lecture', ru: 'Сцены — по лекциям', tt: 'Сценалар — лекцияләр буенча' },
  appearsIn: { en: 'appears in', ru: 'встречается в', tt: 'очрый' },
  taughtIn: { en: 'taught in', ru: 'изучается в', tt: 'өйрәнелә' },
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
      ru: 'Ваш рассказчик и проводник — круглоголовый исследователь в татарской тюбетейке. Он проходит весь путь от поиска по ключевым словам до RAG, и каждая метафора подана его глазами.',
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
      ru: 'диван ≠ софа: точное совпадение по словам слепо к смыслу. Гремлин держит стену между словами с одним значением — лексический разрыв, который должны перекрыть эмбеддинги.',
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
        ru: 'граундинг: LLM уверенно говорит «у лошади 8 ног» — поиск достаёт реальный источник и исправляет галлюцинацию.',
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
];
