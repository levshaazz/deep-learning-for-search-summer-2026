// content/book/l1.js — "The Lost Record" chapter (the L1 arc), per narrative/L1.md.
// Reuses the retrieve-rank-funnel and pos-bias-curve widgets. EN canonical + RU; TT falls back.
// NARRATIVE_METHOD: P1 hook, P2 creatures (Lexical Gremlin, Iceberg, Goodhart), P4 scale, P12 callback.

export default {
  id: '01',
  catchphrase: 'The Lost Record',
  beats: [
    {
      id: 'hook-lost-record', kind: 'prose',
      heading: { en: 'The Lost Record', ru: 'Потерянная запись' },
      body: {
        en: [
          "I'm Serega, and somewhere in a sea of a billion documents there is exactly one record I need. No map, no index card, no helpful librarian. Just me, a query box, and an ocean of bytes.",
          "Two missions today. First: *find it* — that's information retrieval. Second, the harder one: build the machine that keeps finding it, for every user, every day, forever — that's ML system design.",
        ],
        ru: [
          'Я Серёга, и где-то в море из миллиарда документов есть ровно одна запись, которая мне нужна. Ни карты, ни каталожной карточки, ни услужливого библиотекаря. Только я, строка запроса и океан байтов.',
          'Сегодня две задачи. Первая: *найти её* — это информационный поиск. Вторая, посложнее: построить машину, которая продолжает находить её — для каждого пользователя, каждый день, вечно — это дизайн ML-систем.',
        ],
      },
    },
    {
      id: 'problem-gremlin', kind: 'prose',
      heading: { en: 'The Lexical Gremlin', ru: 'Лексический Гремлин' },
      body: {
        en: [
          "First obstacle, and he's grinning at me: the **Lexical Gremlin**. He wedges a brick wall between words that mean the same thing. You search “couch”; the perfect document says “sofa”; the Gremlin makes sure they never meet. Exact-match search loses, every time, to a synonym.",
        ],
        ru: [
          'Первое препятствие, и он мне ухмыляется: **Лексический Гремлин**. Он вставляет кирпичную стену между словами, которые значат одно и то же. Ты ищешь «диван»; идеальный документ говорит «кушетка»; Гремлин следит, чтобы они не встретились. Поиск по точному совпадению проигрывает синониму каждый раз.',
        ],
      },
    },
    {
      id: 'stakes-scale', kind: 'prose',
      body: {
        en: [
          "And the scale is absurd. The web is ~10¹² pages. Every day, ~15% of queries are ones the engine has *never seen before*. You cannot pre-compute answers; you cannot read everything at query time. Something has to give.",
        ],
        ru: [
          'И масштаб абсурден. Веб — это ~10¹² страниц. Каждый день ~15% запросов — те, которых движок *никогда раньше не видел*. Ответы не предвычислить; всё прочитать в момент запроса нельзя. Чем-то придётся пожертвовать.',
        ],
      },
    },
    {
      id: 'turn-cascade', kind: 'prose',
      heading: { en: 'Narrow before you spend', ru: 'Сужай, прежде чем тратить' },
      body: {
        en: [
          "Here's the central trick of every search system. You don't run your smartest, most expensive model on a billion documents — you'd melt. Instead you build a **funnel**: cheap and broad first, expensive and precise last. Watch it narrow.",
        ],
        ru: [
          'Вот центральный трюк любой поисковой системы. Ты не запускаешь самую умную, самую дорогую модель на миллиарде документов — расплавишься. Вместо этого строишь **воронку**: сначала дёшево и широко, в конце дорого и точно. Смотри, как она сужается.',
        ],
      },
    },
    { id: 'climb-funnel', kind: 'scrolly', widget: 'retrieve-rank-funnel', data: 'l1-funnel' },
    {
      id: 'turn-system', kind: 'prose',
      heading: { en: 'A demo is not a system', ru: 'Демо — это не система' },
      body: {
        en: [
          "Great — we can find the record once, in a notebook. But a notebook isn't a product. The moment real users arrive, the iceberg surfaces.",
        ],
        ru: [
          'Отлично — мы можем найти запись один раз, в ноутбуке. Но ноутбук — это не продукт. Как только приходят реальные пользователи, всплывает айсберг.',
        ],
      },
    },
    {
      id: 'climb-mlsd', kind: 'prose',
      heading: { en: 'The Iceberg', ru: 'Айсберг' },
      body: {
        en: [
          "The model is the gleaming tip above the water. Below it sits everything that actually keeps search alive: data pipelines, feature stores, an offline path that trains and an online path that serves, logging, monitoring, retraining, rollback. This is the **Iceberg** of hidden technical debt — and it's where production search lives or dies.",
          "Designing it means thinking in two loops at once: *offline* (collect data → train → evaluate) and *online* (serve → log → feed back). Which brings us to the most dangerous part of that feedback loop.",
        ],
        ru: [
          'Модель — это блестящая верхушка над водой. Под ней — всё, что на самом деле держит поиск живым: конвейеры данных, хранилища признаков, офлайн-путь, который обучает, и онлайн-путь, который обслуживает, логирование, мониторинг, переобучение, откат. Это **Айсберг** скрытого техдолга — и именно здесь продакшн-поиск живёт или умирает.',
          'Проектировать его — значит думать сразу в двух циклах: *офлайн* (собрать данные → обучить → оценить) и *онлайн* (обслужить → залогировать → вернуть в обучение). Что приводит нас к самой опасной части этой петли обратной связи.',
        ],
      },
    },
    { id: 'catch-goodhart', kind: 'scrolly', widget: 'pos-bias-curve', data: 'l1-click-model' },
    {
      id: 'payoff-forever', kind: 'prose',
      heading: { en: 'The machine that keeps finding', ru: 'Машина, что продолжает находить' },
      body: {
        en: [
          "So that's the shape of it: a cascade to find the record fast, wrapped in a system that learns from its own behaviour without being fooled by it. We can find the Lost Record — and keep finding it.",
          "But the Gremlin is still out there, smirking. Exact match still can't tell “couch” from “sofa”. To beat him for good we need to give words *meaning* — coordinates in a space where synonyms sit close together. That's where we're headed next.",
        ],
        ru: [
          'Вот и вся форма: каскад, чтобы быстро найти запись, обёрнутый в систему, которая учится на собственном поведении, не давая себя обмануть. Мы можем найти Потерянную запись — и продолжать находить её.',
          'Но Гремлин всё ещё там, ухмыляется. Точное совпадение по-прежнему не отличит «диван» от «кушетки». Чтобы победить его окончательно, нужно дать словам *смысл* — координаты в пространстве, где синонимы стоят рядом. Туда мы и направляемся дальше.',
        ],
      },
    },
  ],
};
