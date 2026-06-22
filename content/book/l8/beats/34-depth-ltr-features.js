    {
      id: 'depth-ltr-features', kind: 'prose',
      heading: { en: 'Features for the Captain', ru: 'Признаки для капитана', tt: 'Капитан өчен билгеләр' },
      body: {
        en: [
          "Here is where the four pillars connect. Each \\((q, d)\\) pair becomes a feature vector, and the scores from the first three pillars are simply *features* in it: BM25, the dense cosine, the SPLADE weight, the ColBERT MaxSim — alongside query length, document age, click counts, and so on.",
          "LambdaMART then learns how to weight them. It is not a competitor to the retrievers; it is the captain that decides, per query, how much to trust each one. The neural retrievers find the candidates; the learned ranker decides the final order.",
        ],
        ru: [
          "Вот где соединяются четыре столпа. Каждая пара \\((q, d)\\) становится вектором признаков, и оценки первых трёх столпов — просто *признаки* в нём: BM25, плотный косинус, вес SPLADE, MaxSim ColBERT — рядом с длиной запроса, возрастом документа, числом кликов и так далее.",
          "А LambdaMART учится их взвешивать. Это не конкурент ретриверам; это капитан, который решает для каждого запроса, насколько доверять каждому. Нейронные ретриверы находят кандидатов; выученный ранжировщик решает финальный порядок.",
        ],
        tt: [
          "Менә дүрт багана кушылган җир. Һәр \\((q, d)\\) пары билге векторына әйләнә, һәм беренче өч баганадан балллар анда — гади *билгеләр*: BM25, тыгыз косинус, SPLADE авырлыгы, ColBERT MaxSim — сорау озынлыгы, документ яше, кликлар саны һәм башкалар янәшәсендә.",
          "Ә LambdaMART аларны ничек үлчәргә икәнен өйрәнә. Бу эзләүчеләргә көндәш түгел; бу — һәр сорау өчен һәркайсына никадәр ышанырга икәнен хәл итүче капитан. Нейрон эзләүчеләр кандидатларны таба; өйрәнелгән ранжлаучы соңгы тәртипне хәл итә.",
        ],
      },
    },
