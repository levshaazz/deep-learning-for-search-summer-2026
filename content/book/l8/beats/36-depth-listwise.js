    {
      id: 'depth-listwise', kind: 'prose',
      heading: { en: 'Listwise approaches', ru: 'Listwise-подходы', tt: 'Listwise ысуллары' },
      body: {
        en: [
          "Beyond LambdaMART, the listwise family optimizes a distribution over *whole orderings*. **ListNet** uses a top-one probability — a softmax over scores giving the chance each document ranks first — and minimizes the cross-entropy against the ideal. **ListMLE** maximizes the likelihood of the correct permutation under a Plackett–Luce model.",
          "These are closer to the metric than pairwise methods and can be sharper, at the cost of more expensive training. They are the theoretical backbone behind today's neural list rerankers.",
        ],
        ru: [
          "Помимо LambdaMART, listwise-семейство оптимизирует распределение над *целыми порядками*. **ListNet** использует вероятность «топ-один» — softmax по оценкам, дающий шанс каждого документа стоять первым — и минимизирует кросс-энтропию против идеала. **ListMLE** максимизирует правдоподобие верной перестановки в модели Плакетта–Льюса.",
          "Они ближе к метрике, чем попарные методы, и могут быть точнее ценой более дорогого обучения. Это теоретический костяк за сегодняшними нейронными list-реранкерами.",
        ],
        tt: [
          "LambdaMART тан тыш, listwise гаиләсе *бөтен тәртипләр* өстендәге таралышны оптимальләштерә. **ListNet** «топ-бер» ихтималын куллана — балллар буенча softmax, һәр документның беренче булу мөмкинлеген бирә — һәм идеалга каршы кросс-энтропияне минимальләштерә. **ListMLE** Плакетт–Льюс моделендә дөрес урнаштыруның ихтималлыгын максимальләштерә.",
          "Алар парлы ысуллардан метрикага якынрак һәм кискенрәк булырга мөмкин, кыйммәтрәк өйрәтү бәясенә. Алар — бүгенге нейрон list-реранкерлар артындагы теоретик нигез.",
        ],
      },
    },
