    {
      id: 'turn-late-interaction', kind: 'prose',
      heading: { en: 'Three ways to interact', ru: 'Три способа взаимодействия', tt: 'Тәэсир итешүнең өч ысулы' },
      img: 'L8/L8-01-token-muster.png', imgPos: 'scene',
      imgAlt: {
        en: 'A muster Séréga conducts: a front row of query-token figures faces an opposite row of document-token figures across a gap, and from each front figure a single bright beam shoots to the one opposite figure it matches best — late interaction as MaxSim, each token saluting its strongest partner.',
        ru: 'Смотр, который проводит Серёга: передний ряд фигурок-токенов запроса стоит напротив ряда фигурок-токенов документа, и от каждой передней фигурки единственный яркий луч бьёт к той одной фигурке напротив, с которой она совпадает лучше всего — позднее взаимодействие как MaxSim, каждый токен салютует сильнейшему партнёру.',
        tt: 'Серёга үткәргән смотр: алгы рәттәге сорау-токен фигуралары каршыдагы документ-токен фигуралары рәтенә карый, һәм һәр алгы фигурадан бер яктыр нур ул иң яхшы туры килгән бер каршы фигурага бәрә — соңгы тәэсир итешү MaxSim буларак, һәр токен иң көчле партнёрына сәлам бирә.',
      },
      body: {
        en: [
          "There are three ways a query and a document can meet. **Early-pool** (the bi-encoder, L10): collapse each into one vector *before* comparing — cheap and cacheable, but detail is lost. **Every-layer** (the cross-encoder, L10): let them attend at every layer — accurate, but the score is a property of the pair, so it cannot be cached, and it is \\(O(N)\\) per query.",
          "**Late interaction** (ColBERT) is the in-between. Encode the query and document *separately*, all the way down to one vector per token. Precompute the document tokens offline. Then, at query time, interact cheaply at the very end — one max-similarity pass over the token grid. Token detail like the cross-encoder, precompute like the bi-encoder.",
        ],
        ru: [
          "Запрос и документ могут встретиться тремя способами. **Ранний пулинг** (би-энкодер, L10): свернуть каждый в один вектор *до* сравнения — дёшево и кэшируется, но детали потеряны. **Каждый слой** (кросс-энкодер, L10): дать им внимать друг другу на каждом слое — точно, но оценка — свойство пары, её нельзя кэшировать, и это \\(O(N)\\) на запрос.",
          "**Позднее взаимодействие** (ColBERT) — золотая середина. Кодируем запрос и документ *порознь*, вплоть до одного вектора на токен. Токены документа предвычисляем офлайн. А на запросе взаимодействуем дёшево в самом конце — один проход максимального сходства по сетке токенов. Деталь токенов, как у кросс-энкодера, предвычисление, как у би-энкодера.",
        ],
        tt: [
          "Сорау белән документ өч ысул белән очраша ала. **Иртә пулинг** (би-энкодер, L10): чагыштырганчы *алдан* һәрберсен бер векторга җыю — арзан һәм кэшләнә, әмма детальләр югала. **Һәр катлау** (кросс-энкодер, L10): аларга һәр катлауда игътибар итешергә рөхсәт итү — төгәл, әмма балл — парның үзлеге, аны кэшләп булмый, һәм ул сорауга \\(O(N)\\).",
          "**Соңгы тәэсир итешү** (ColBERT) — алтын урта. Сорау белән документны *аерым* кодлыйбыз, һәр токенга бер векторга кадәр. Документ токеннарын офлайн алдан исәплибез. Ә сорауда иң ахырда арзан тәэсир итешәбез — токен челтәре буенча бер максималь охшашлык узуы. Кросс-энкодердагы кебек токен детале, би-энкодердагы кебек алдан исәпләү.",
        ],
      },
    },
