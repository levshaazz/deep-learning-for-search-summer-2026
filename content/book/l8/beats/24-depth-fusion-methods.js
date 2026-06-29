    {
      id: 'depth-fusion-methods', kind: 'prose',
      heading: { en: 'RRF vs score combination', ru: 'RRF против комбинации оценок', tt: 'RRF баллар берләштерүенә каршы' },
      body: {
        en: [
          "RRF is not the only way to fuse. The alternative is **score combination**: normalize each ranker's scores to a common range — min-max scaling or z-scores — then add them, often with a weight \\(\\alpha\\cdot\\text{dense} + (1-\\alpha)\\cdot\\text{sparse}\\). Done well, this can be sharper than RRF, because it uses the *magnitude* of the scores, not just their order.",
          "Done badly, it is fragile: a single outlier score blows up min-max scaling, and the right \\(\\alpha\\) varies by query and domain. The concrete trap is the scale gap — BM25 is unbounded above (it can reach the tens) while cosine sits in \\([-1,1]\\), so adding them raw lets BM25 swamp the dense score entirely. RRF sidesteps all of that by throwing away magnitudes and keeping only ranks — which is why it is the robust default, and why production systems reach for it first.",
        ],
        ru: [
          "RRF — не единственный способ слияния. Альтернатива — **комбинация оценок**: нормализовать оценки каждого ранжировщика в общий диапазон — min-max или z-оценки — и сложить их, часто с весом \\(\\alpha\\cdot\\text{плотн} + (1-\\alpha)\\cdot\\text{разреж}\\). При аккуратной реализации это может быть точнее RRF, ведь использует *величину* оценок, а не только их порядок.",
          "При небрежной — хрупко: один выброс ломает min-max, а правильный \\(\\alpha\\) меняется от запроса и домена. Конкретная ловушка — разрыв шкал: BM25 не ограничен сверху (может достигать десятков), а косинус лежит в \\([-1,1]\\), так что при сложении «как есть» BM25 полностью забивает плотную оценку. RRF обходит всё это, выбрасывая величины и оставляя лишь ранги — поэтому он надёжный дефолт, и поэтому продакшн-системы первым делом тянутся к нему.",
        ],
        tt: [
          "RRF — берләштерүнең бердәнбер ысулы түгел. Альтернатива — **баллар берләштерүе**: һәр ранжлаучының балларын уртак диапазонга нормалаштыру — min-max яки z-баллар — һәм аларны кушу, еш кына \\(\\alpha\\cdot\\text{тыгыз} + (1-\\alpha)\\cdot\\text{сирәк}\\) авырлыгы белән. Яхшы эшләнсә, бу RRF дан кискенрәк булырга мөмкин, чөнки балларның тәртибен генә түгел, *зурлыгын* да куллана.",
          "Начар эшләнсә, бу нык түгел: бер чыгынты min-max ны җимерә, ә дөрес \\(\\alpha\\) сорау һәм доменга карап үзгәрә. Конкрет тозак — шкалалар аермасы: BM25 өстән чикләнмәгән (дистәләргә җитә ала), ә косинус \\([-1,1]\\) эчендә ята, шуңа аларны «булганча» кушсаң, BM25 тыгыз баллны бөтенләй басып китә. RRF боларның барысын зурлыкларны ташлап, бары рангларны калдырып урап үтә — шуңа ул нык дефолт, һәм шуңа продакшн-системалар башта аңа тартыла.",
        ],
      },
    },
