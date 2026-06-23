    {
      id: 'topic-aware', kind: 'prose',
      heading: { en: 'Manufacture hard negatives for free', ru: 'Производить сложные негативы даром', tt: 'Катлаулы негативларны бушлай ясау' },
      body: {
        en: [
          "There is a cheaper way to get hard negatives than mining a giant index every few thousand steps: **manufacture** them. Cluster the queries by topic first, then build each batch from a *single* topic. Now the in-batch negatives are all on-topic — hard for free, with no index to refresh.",
          "Combined with margin distillation and a balanced sampler, this turns a heavy training pipeline into one that fits on a single modest GPU in under two days — and still generalises across benchmarks.",
        ],
        ru: [
          "Есть способ дешевле, чем майнить гигантский индекс каждые несколько тысяч шагов: **производить** сложные негативы. Сначала кластеризуй запросы по теме, потом собирай каждый батч из *одной* темы. Теперь негативы из батча все по теме — сложные даром, без индекса для обновления.",
          "В связке с дистилляцией отступа и сбалансированным сэмплером это превращает тяжёлый пайплайн обучения в такой, что умещается на одной скромной GPU меньше чем за двое суток — и всё ещё обобщается по бенчмаркам.",
        ],
        tt: [
          "Зур индексны һәр берничә мең адым саен майнлаудан арзанрак юл бар: катлаулы негативларны **ясау**. Сорауларны башта тема буенча кластерла, аннары һәр батчны *бер* темадан җый. Хәзер батчтан негативлар барысы да тема буенча — катлаулылар бушлай, яңартырга индекссыз.",
          "Чик дистилляциясе һәм тигезләнгән сэмплер белән бергә бу авыр өйрәтү пайплайнын бер тыйнак GPU'да ике тәүлектән кимрәк сыя торганга әйләндерә — һәм әле дә бенчмарклар буенча гомумиләшә.",
        ],
      },
    },
