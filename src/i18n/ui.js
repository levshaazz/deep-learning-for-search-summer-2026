// ui.js — site chrome strings (navigation, section headings, labels).
// EN canonical + RU + TT (Tatar Cyrillic). The resolver falls back tt → ru → en.
// TT is machine-drafted and pending a native-speaker review pass; the G3 coverage
// gate reports chrome translation completeness. Keep keys flat-ish and stable.

export const ui = {
  brandSub: { en: 'Innopolis University', ru: 'Университет Иннополис', tt: 'Иннополис университеты' },
  graduateCourse: { en: 'Graduate course', ru: 'Магистерский курс', tt: 'Магистратура курсы' },

  nav: {
    book: { en: 'The Book', ru: 'Книга', tt: 'Китап' },
    lectures: { en: 'Lectures', ru: 'Лекции', tt: 'Лекцияләр' },
    syllabus: { en: 'Syllabus', ru: 'Программа', tt: 'Программа' },
    schedule: { en: 'Schedule', ru: 'Расписание', tt: 'Җәдвәл' },
    assignments: { en: 'Assignments', ru: 'Задания', tt: 'Биремнәр' },
    gallery: { en: 'Gallery', ru: 'Галерея', tt: 'Галерея' },
    playground: { en: 'Playground', ru: 'Площадка', tt: 'Мәйдан' },
    papers: { en: 'Papers', ru: 'Статьи', tt: 'Мәкаләләр' },
    glossary: { en: 'Glossary', ru: 'Глоссарий', tt: 'Сүзлек' },
    midterm: { en: 'Midterm', ru: 'Мидтерм', tt: 'Аралык имтиханы' },
  },

  sections: {
    lectures: { en: 'Lectures', ru: 'Лекции', tt: 'Лекцияләр' },
    deepdives: { en: 'Additional topics', ru: 'Дополнительные темы', tt: 'Өстәмә темалар' },
    deepdivesKicker: {
      en: 'Optional deep-dive lectures · beyond the core syllabus · taken after the main course',
      ru: 'Необязательные углублённые лекции · вне основной программы · после основного курса',
      tt: 'Сайланма тирәнәйтелгән лекцияләр · төп программадан тыш · төп курстан соң',
    },
    assignments: { en: 'Labs & Homework', ru: 'Лабораторные и домашние задания', tt: 'Лаборатор һәм өй эшләре' },
    assignmentsKicker: {
      en: 'Lecture 03–04 · Classical IR & Ranking Metrics · implement by hand, measure, compare',
      ru: 'Лекции 03–04 · Классический IR и метрики ранжирования · реализуй руками, измеряй, сравнивай',
      tt: '03–04 лекцияләр · Классик IR һәм ранжлау метрикалары · кулдан эшлә, үлчә, чагыштыр',
    },
    lecturesKicker: {
      en: 'Interactive slide decks · open in any browser · ← / → to navigate · O for overview',
      ru: 'Интерактивные слайды · открываются в любом браузере · ← / → навигация · O — обзор',
      tt: 'Интерактив слайдлар · теләсә кайсы браузерда ачыла · ← / → күчү · O — гомуми күренеш',
    },
    gallery: { en: 'Gallery — a visual glossary', ru: 'Галерея — визуальный глоссарий', tt: 'Галерея — күрмә сүзлек' },
    galleryKicker: {
      en: 'Bestiary + Scenes · the recurring cast and metaphor art · one idea per picture · linked to the chapter',
      ru: 'Бестиарий + Сцены · повторяющиеся персонажи и метафоры · одна идея на картинку · со ссылкой на главу',
      tt: 'Бестиарий + Сәхнәләр · кабатланучы персонажлар һәм метафора рәсемнәре · һәр рәсемгә бер идея · бүлеккә сылтама белән',
    },
    papers: { en: 'Papers & references', ru: 'Статьи и литература', tt: 'Мәкаләләр һәм әдәбият' },
    papersKicker: {
      en: 'The course bibliography · every cited work · grouped by area · with a real link and why it is here',
      ru: 'Библиография курса · каждая цитируемая работа · сгруппирована по областям · с реальной ссылкой и пояснением',
      tt: 'Курс библиографиясе · һәр китерелгән хезмәт · өлкәләр буенча төркемләнгән · реаль сылтама һәм ни өчен кирәклеге белән',
    },
    glossary: { en: 'Glossary — the term index', ru: 'Глоссарий — индекс терминов', tt: 'Сүзлек — терминнар индексы' },
    glossaryKicker: {
      en: 'Every core concept · a one-line definition · and the lecture where it is taught · search or filter by lecture',
      ru: 'Каждое ключевое понятие · определение в одну строку · и лекция, где оно преподаётся · поиск или фильтр по лекции',
      tt: 'Һәр төп төшенчә · бер юллык билгеләмә · һәм ул укытыла торган лекция · эзләү яки лекция буенча фильтр',
    },
    playground: { en: 'Playground — drive the algorithms', ru: 'Площадка — управляй алгоритмами', tt: 'Мәйдан — алгоритмнарга идарә ит' },
    playgroundKicker: {
      en: 'The course lab · every interactive figure in free-play · step / scrub / press play · filter by lecture or topic',
      ru: 'Лаборатория курса · каждая интерактивная фигура в свободном режиме · шаг / перемотка / запуск · фильтр по лекции или теме',
      tt: 'Курс лабораториясе · һәр интерактив фигура ирекле режимда · адым / сөйрәп күчерү / җибәрү · лекция яки тема буенча фильтр',
    },
    playgroundIntro: {
      en: 'This is the lab. Each card is one of the course’s 60+ interactive figures, freed from the scrolling story — step through it, scrub the slider, or press play to watch the algorithm run. The figures are the same ones that appear in the Book; here you drive them yourself.',
      ru: 'Это лаборатория. Каждая карточка — одна из 60+ интерактивных фигур курса, освобождённая от скролл-истории — пройди по шагам, перемотай ползунок или нажми play, чтобы увидеть работу алгоритма. Это те же фигуры, что в Книге; здесь ты управляешь ими сам.',
      tt: 'Бу — лаборатория. Һәр карта — курсның 60+ интерактив фигурасыннан берсе, скролл-хикәядән аерылган — адымлап уз, йөгерткечне (слайдерны) сөйрә, яки алгоритм эшләвен күрер өчен play бас. Болар — Китаптагы шул үк фигуралар; биредә аларга үзең идарә итәсең.',
    },
    book: { en: 'The Book', ru: 'Книга', tt: 'Китап' },
    bookKicker: {
      en: 'The course as an interactive scrollytelling story — Wait-But-Why style, in three languages',
      ru: 'Курс как интерактивная скролл-история — в стиле Wait But Why, на трёх языках',
      tt: 'Курс — интерактив скролл-хикәя рәвешендә, Wait But Why стилендә, өч телдә',
    },
    schedule: { en: 'Schedule', ru: 'Расписание', tt: 'Җәдвәл' },
    assessment: { en: 'Assessment', ru: 'Оценивание', tt: 'Бәяләү' },
    instructor: { en: 'Instructor', ru: 'Преподаватель', tt: 'Укытучы' },
    reading: { en: 'Reading', ru: 'Литература', tt: 'Әдәбият' },
    readingKicker: { en: 'Textbooks & sources', ru: 'Учебники и источники', tt: 'Дәреслекләр һәм чыганаклар' },
  },

  labels: {
    ready: { en: 'Ready', ru: 'Готово', tt: 'Әзер' },
    coming: { en: 'Coming', ru: 'Скоро', tt: 'Тиздән' },
    open: { en: 'Open', ru: 'Открыть', tt: 'Ачу' },
    allAssignments: { en: 'All assignments', ru: 'Все задания', tt: 'Барлык биремнәр' },
    prev: { en: 'Prev', ru: 'Пред.', tt: 'Алдагы' },
    next: { en: 'Next', ru: 'След.', tt: 'Киләсе' },
    openSlides: { en: 'Open slides', ru: 'Открыть слайды', tt: 'Слайдларны ачу' },
    readBook: { en: 'Read in the Book', ru: 'Читать в Книге', tt: 'Китапта уку' },
    deepdiveTag: { en: 'Deep-dive', ru: 'Доп. тема', tt: 'Өстәмә' },
    institution: { en: 'Institution', ru: 'Институт', tt: 'Оешма' },
    instructor: { en: 'Instructor', ru: 'Преподаватель', tt: 'Укытучы' },
    term: { en: 'Term', ru: 'Семестр', tt: 'Семестр' },
    firstLecture: { en: 'First lecture', ru: 'Первая лекция', tt: 'Беренче лекция' },
    week: { en: 'Week', ru: 'Неделя', tt: 'Атна' },
    date: { en: 'Date', ru: 'Дата', tt: 'Дата' },
    topics: { en: 'Topics & milestones', ru: 'Темы и вехи', tt: 'Темалар һәм этаплар' },
    component: { en: 'Component', ru: 'Компонент', tt: 'Компонент' },
    weight: { en: 'Weight', ru: 'Вес', tt: 'Өлеш' },
    total: { en: 'Total', ru: 'Итого', tt: 'Барлыгы' },
    grades: { en: 'Grades', ru: 'Оценки', tt: 'Билгеләр' },
    contact: { en: 'Contact', ru: 'Контакт', tt: 'Бәйләнеш' },
    bio: { en: 'Bio', ru: 'О преподавателе', tt: 'Укытучы турында' },
    theme: { en: 'Toggle theme', ru: 'Сменить тему', tt: 'Теманы алмаштыру' },
    language: { en: 'Language', ru: 'Язык', tt: 'Тел' },

    // Playground transport (the "lab-instrument" controls on each demo card).
    play: { en: 'Play', ru: 'Запуск', tt: 'Җибәрү' },
    pause: { en: 'Pause', ru: 'Пауза', tt: 'Пауза' },
    restart: { en: 'Restart', ru: 'Сначала', tt: 'Баштан' },
    step: { en: 'Step', ru: 'Шаг', tt: 'Адым' },
    stepFwd: { en: 'Step forward', ru: 'Шаг вперёд', tt: 'Алга адым' },
    stepBack: { en: 'Step back', ru: 'Шаг назад', tt: 'Артка адым' },
    stepSlider: { en: 'Scrub steps', ru: 'Перемотка шагов', tt: 'Адымнарны сөйрәү' },
    statusPlaying: { en: 'PLAYING', ru: 'ИДЁТ', tt: 'БАРА' },
    statusPaused: { en: 'PAUSED', ru: 'ПАУЗА', tt: 'ПАУЗА' },

    // Lazy-mount placeholder (shown on a card until its widget scrolls into view + mounts).
    mounting: { en: 'mounting…', ru: 'загрузка…', tt: 'йөкләнә…' },
  },

  // Playground filter/search toolbar (sticky). All chrome trilingual; the resolver falls tt→ru→en.
  playgroundFilter: {
    byLecture: { en: 'Lecture', ru: 'Лекция', tt: 'Лекция' },
    byTopic: { en: 'Topic', ru: 'Тема', tt: 'Тема' },
    all: { en: 'All', ru: 'Все', tt: 'Барысы' },
    searchLabel: { en: 'Search demos', ru: 'Поиск демо', tt: 'Демоларны эзләү' },
    searchPlaceholder: { en: 'Search by title, topic, lecture…', ru: 'Поиск по названию, теме, лекции…', tt: 'Исем, тема, лекция буенча эзләү…' },
    // "showing N of M" — the page/client fills {n} and {m}.
    showing: { en: 'showing {n} of {m}', ru: 'показано {n} из {m}', tt: '{m} дан {n} күрсәтелә' },
    clear: { en: 'Clear filters', ru: 'Сбросить фильтры', tt: 'Фильтрларны бетерү' },
    none: { en: 'No demos match these filters.', ru: 'Нет демо под эти фильтры.', tt: 'Бу фильтрларга туры килгән демо юк.' },
  },

  // CONCEPT topic names — mirror src/lib/playground.js TOPICS (kept here so the G3 coverage gate,
  // which scans ui.js, reports topic-name translation completeness). Keyed by the topic `id`.
  playgroundTopics: {
    foundations: { en: 'Foundations & the IR spine', ru: 'Основы и каркас IR', tt: 'Нигезләр һәм IR умыртка сөяге' },
    tokenization: { en: 'Tokenization & text', ru: 'Токенизация и текст', tt: 'Токенлаштыру һәм текст' },
    retrieval: { en: 'Classical retrieval & ranking', ru: 'Классический поиск и ранжирование', tt: 'Классик эзләү һәм ранжлау' },
    embeddings: { en: 'Embeddings & geometry', ru: 'Эмбеддинги и геометрия', tt: 'Эмбеддинглар һәм геометрия' },
    dimred: { en: 'Dimensionality reduction', ru: 'Снижение размерности', tt: 'Үлчәмлелекне киметү' },
    transformers: { en: 'Attention & Transformers', ru: 'Внимание и трансформеры', tt: 'Игътибар һәм трансформерлар' },
    evaluation: { en: 'Evaluation & metrics', ru: 'Оценивание и метрики', tt: 'Бәяләү һәм метрикалар' },
    other: { en: 'Other / misc', ru: 'Прочее', tt: 'Башка / төрле' },
  },

  // Shown on a locale whose page coverage is incomplete (fallback content is visible).
  translationInProgress: {
    en: 'Translation in progress — some text is shown in another language for now.',
    ru: 'Перевод в процессе — часть текста пока показана на другом языке.',
    tt: 'Тәрҗемә бара — кайбер текст хәзергә башка телдә күрсәтелә.',
  },
};
