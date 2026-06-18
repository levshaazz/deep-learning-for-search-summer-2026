    {
      id: 'colpali', kind: 'prose',
      heading: { en: 'ColPali: retrieve over the page', ru: 'ColPali: поиск по странице', tt: 'ColPali: бит буйлап эзләү' },
      img: 'L12/L12-04-colpali.png', imgPos: 'float-right',
      imgAlt: {
        en: 'A scanned document page tiled into a grid of patches, a text query firing a beam to its best-matching patch — a table cell — while Séréga watches: late interaction over the page image, no OCR.',
        ru: 'Скан страницы документа, разбитый на сетку патчей; текстовый запрос пускает луч в наиболее подходящий патч — ячейку таблицы, — а Серёга наблюдает: позднее взаимодействие по изображению страницы, без OCR.',
        tt: 'Документ битенең сканы патчлар челтәренә бүленгән; текст соравы иң туры килгән патчка — таблица күзәнәгенә — нур җибәрә, ә Серёга күзәтә: бит рәсеме буйлап соңгы тәэсир итешү, OCR сыз.',
      },
      body: {
        en: [
          "The frontier idea pushes further: what if the *page itself* is the unit of retrieval? The classic document pipeline is OCR → layout parse → chunk → embed — and it is **brittle** on tables, figures, stamps and scans, where the meaning lives in the layout, not a clean text stream.",
          "**ColPali** (Faysse et al., 2024) skips all of it. Render each page as an **image**, embed it with a vision-language model into **patch-level** vectors, and retrieve with **late interaction** — a query token attends to its most similar image patch (MaxSim). A figure, a table cell, a stamp — all retrievable without ever transcribing them. And notice the lineage: this is **ColBERT's late interaction from L8** (Sir Cosine measuring per-patch), fused with **L12's shared image–text space**. The two frontiers we built meet in one model.",
        ],
        ru: [
          "Фронтирная идея идёт дальше: что, если *сама страница* — единица поиска? Классический конвейер документа — OCR → разбор раскладки → чанк → эмбеддинг — и он **хрупок** на таблицах, рисунках, печатях и сканах, где смысл живёт в раскладке, а не в чистом потоке текста.",
          "**ColPali** (Faysse и др., 2024) пропускает всё это. Отрендерь каждую страницу как **изображение**, заэмбедь её визуально-языковой моделью в **попатчевые** векторы и извлекай **поздним взаимодействием**: токен запроса тянется к наиболее похожему патчу изображения (MaxSim). Рисунок, ячейка таблицы, печать — всё извлекаемо, ни разу не транскрибируясь. И заметь родословную: это **позднее взаимодействие ColBERT из L8** (Сэр Косинус, меряющий попатчево), сплавленное с **общим пространством изображение–текст из L12**. Два построенных нами фронтира встречаются в одной модели.",
        ],
        tt: [
          "Фронтир фикере тагын ераккарак китә: *бит үзе* эзләү берәмлеге булса? Классик документ конвейеры — OCR → макет тикшерү → чанк → эмбеддинг — һәм ул таблицаларда, рәсемнәрдә, мөһерләрдә һәм сканнарда **сынучан**, анда мәгънә макетта яши, чиста текст агымында түгел.",
          "**ColPali** (Faysse һ.б., 2024) боларның барысын калдыра. Һәр битне **рәсем** итеп ясый, аны күрү-тел моделе белән **патч дәрәҗәсендәге** векторларга эмбеддла һәм **соңгы тәэсир итешү** белән ала: сорау токены иң охшаш рәсем патчына омтыла (MaxSim). Рәсем, таблица күзәнәге, мөһер — барысы да, беркайчан күчереп язмыйча, алына. Һәм нәселне игътибар ит: бу — **L8 дагы ColBERT соңгы тәэсир итешүе** (патч буенча үлчәүче Сэр Косинус), **L12 дагы уртак рәсем-текст киңлеге** белән кушылган. Без төзегән ике фронтир бер модельдә очраша."
        ],
      },
    },
