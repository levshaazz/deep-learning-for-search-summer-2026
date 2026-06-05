// content/book/l4.js — "The Proving Grounds" (L4): Ranking Metrics. Beats match narrative/L4.md
// (as-built: the five metrics are one stepped ranking-metrics figure on L3's real BM25 ranking).
// EN canonical + RU; TT falls back. NARRATIVE_METHOD applies; Goodhart the Trickster returns.

export default {
  id: '04',
  catchphrase: 'The Proving Grounds',
  beats: [
    {
      id: 'hook-proving', kind: 'prose',
      heading: { en: 'The Proving Grounds', ru: 'Полигон' },
      body: {
        en: [
          "I'm Serega, and I've built two search systems. Both look fine. One of them is better. Which one? \"Looks good to me\" is how you ship garbage with confidence. Before we touch a single neural network, we need an honest scoreboard — a way to put a *number* on a ranking. Welcome to the Proving Grounds.",
        ],
        ru: [
          'Я Серёга, и я построил две поисковые системы. Обе выглядят прилично. Одна из них лучше. Какая? «Мне кажется, норм» — так с уверенностью выкатывают мусор. Прежде чем тронуть хоть одну нейросеть, нам нужна честная доска результатов — способ поставить ранжированию *число*. Добро пожаловать на Полигон.',
        ],
      },
    },
    {
      id: 'problem-eyeballing', kind: 'prose',
      body: {
        en: [
          "You can eyeball ten results. You cannot eyeball ten thousand queries, twice a day, for every code change. Eyeballing doesn't scale, and it doesn't catch small regressions. We need a metric — and to compute one, we need *ground truth*: for some queries, which documents are actually relevant.",
        ],
        ru: [
          'Десять результатов можно оценить на глаз. Десять тысяч запросов — дважды в день, на каждое изменение кода — на глаз не оценишь. Глаз не масштабируется и не ловит мелкие регрессии. Нужна метрика — а чтобы её посчитать, нужна *истина*: для части запросов — какие документы действительно релевантны.',
        ],
      },
    },
    {
      id: 'turn-relevance', kind: 'prose',
      heading: { en: 'Ground truth', ru: 'Истина' },
      body: {
        en: [
          "Relevance judgments (\"qrels\") are simply a label per query-document pair: relevant or not. Real test collections have human annotators do this. We'll borrow a clean shortcut from earlier: our 20-Newsgroups documents already carry category labels, so for the query intent \"space\" we'll call a document relevant exactly when it's from the space category. Now every ranking can be graded.",
        ],
        ru: [
          'Релевантность («qrels») — это просто метка на пару запрос–документ: релевантен или нет. В настоящих тестовых коллекциях это размечают люди. Мы возьмём чистый приём из прошлого: документы 20 Newsgroups уже несут метки категорий, поэтому для запроса «space» назовём документ релевантным ровно тогда, когда он из космической категории. Теперь любое ранжирование можно оценить.',
        ],
      },
    },
    { id: 'climb-metrics', kind: 'scrolly', widget: 'ranking-metrics', data: 'l4-metrics' },
    {
      id: 'catch-goodhart', kind: 'prose',
      heading: { en: 'Goodhart the Trickster returns', ru: 'Возвращается Гудхарт-Трикстер' },
      body: {
        en: [
          "Now the danger. The moment a metric becomes a *target*, someone — or some training loop — will optimise it instead of the thing it was meant to measure. **Goodhart the Trickster** is back, grinning. Optimise for raw clicks and you reward whatever sits on top, not what's relevant (we saw that in The Lost Record). Take a ranking tuned for \"popularity\" — it looks busy and confident, yet its nDCG is *lower* than honest BM25. A number you game stops being a measurement.",
        ],
        ru: [
          'Теперь опасность. Как только метрика становится *целью*, кто-то — или какой-то обучающий цикл — начнёт оптимизировать её вместо того, что она должна была измерять. **Гудхарт-Трикстер** снова здесь, ухмыляется. Оптимизируй сырые клики — и наградишь то, что стоит сверху, а не релевантное (мы видели это в «Потерянной записи»). Возьми ранжирование, заточенное под «популярность», — оно выглядит бойко и уверенно, а его nDCG *ниже*, чем у честного BM25. Число, которое подкручивают, перестаёт быть измерением.',
        ],
      },
    },
    {
      id: 'payoff-scoreboard', kind: 'prose',
      heading: { en: 'An honest scoreboard', ru: 'Честная доска результатов' },
      body: {
        en: [
          "So now we can argue with numbers instead of opinions. nDCG, MAP, MRR, Recall@k — pick the one that matches what your users actually do, and you can finally answer \"is this better?\" honestly. Keep this scoreboard close; every chapter from here on makes a claim that only these metrics can settle.",
          "And the very first claim is waiting: our fast classical catalog is still synonym-blind. Can a machine that understands *meaning* beat BM25 on this scoreboard? To find out, words need coordinates. Next chapter: The Map of Meaning.",
        ],
        ru: [
          'Теперь мы спорим числами, а не мнениями. nDCG, MAP, MRR, Recall@k — выбери ту, что соответствует тому, что реально делают пользователи, и сможешь наконец честно ответить «стало лучше?». Держи эту доску под рукой: каждая следующая глава делает утверждение, которое решают только эти метрики.',
          'И первое утверждение уже ждёт: наш быстрый классический каталог по-прежнему слеп к синонимам. Сможет ли машина, понимающая *смысл*, обойти BM25 на этой доске? Чтобы узнать, словам нужны координаты. Следующая глава: «Карта смысла».',
        ],
      },
    },
  ],
};
