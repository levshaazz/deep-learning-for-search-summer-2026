    {
      id: 'topic-aware', kind: 'prose',
      heading: { en: 'Manufacture hard negatives for free', ru: 'Производить трудные негативы даром', tt: 'Катлаулы негативларны бушлай ясау' },
      body: {
        en: [
          "There is a cheaper way to get hard negatives than mining a giant index every few thousand steps: **manufacture** them. Cluster the queries by topic first, then build each batch from a *single* topic. Now the in-batch negatives are all on-topic — hard for free, with no index to refresh.",
          "Combined with margin distillation and a balanced sampler, this turns a heavy training pipeline into one that fits on a single modest GPU in under two days — and still generalises across benchmarks. Concretely, TAS-B reaches MS MARCO MRR@10 ≈ 0.34 on a single 11 GB GPU in under 48 h. Be honest about the limit, though: on BEIR zero-shot it still sits about 2.8 points below BM25 — an in-domain win, not an out-of-domain one.",
        ],
        ru: [
          "Есть способ дешевле, чем майнить гигантский индекс каждые несколько тысяч шагов: **производить** трудные негативы. Сначала кластеризуй запросы по теме, потом собирай каждый батч из *одной* темы. Теперь негативы из батча все по теме — трудные даром, без индекса для обновления.",
          "В связке с дистилляцией отступа и сбалансированным сэмплером это превращает тяжёлый пайплайн обучения в такой, что умещается на одной скромной GPU меньше чем за двое суток — и всё ещё обобщается по бенчмаркам. Конкретно: TAS-B достигает MS MARCO MRR@10 ≈ 0,34 на одной 11 ГБ GPU менее чем за 48 ч. Но будь честен насчёт предела: на BEIR zero-shot он всё ещё примерно на 2,8 пункта ниже BM25 — это выигрыш внутри домена, а не вне его.",
        ],
        tt: [
          "Зур индексны һәр берничә мең адым саен майнлаудан арзанрак юл бар: катлаулы негативларны **ясау**. Сорауларны башта тема буенча кластерла, аннары һәр батчны *бер* темадан җый. Хәзер батчтан негативлар барысы да тема буенча — катлаулылар бушлай, яңартырга индекссыз.",
          "Чик дистилляциясе һәм тигезләнгән сэмплер белән бергә бу авыр өйрәтү пайплайнын бер тыйнак GPU'да ике тәүлектән кимрәк сыя торганга әйләндерә — һәм әле дә бенчмарклар буенча гомумиләшә. Конкрет рәвештә: TAS-B бер 11 ГБ GPU'да 48 сәгатьтән кимрәк вакытта MS MARCO MRR@10 ≈ 0.34 кә җитә. Әмма чиге турында намуслы бул: BEIR zero-shot'та ул әле дә BM25'тан якынча 2.8 пунктка түбәнрәк — бу домен эчендәге җиңү, аннан читтәге түгел.",
        ],
      },
    },
