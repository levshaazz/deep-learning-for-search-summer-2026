    {
      id: 'modern-synthesis', kind: 'prose',
      heading: { en: 'The modern recipe', ru: 'Современный рецепт', tt: 'Заманча рецепт' },
      img: 'L13/L13-13-modern-forge.png', imgPos: 'scene',
      imgAlt: {
        en: "Séréga at a modern forge in his green tübetey: one bellows blasts a wide, even heat across the whole blade, while a fine hammer taps a single sharp edge — the two-stage recipe rendered as a smithy.",
        ru: "Серёга у современного горна в зелёной тюбетейке: одни мехи дают широкий ровный жар по всему клинку, а тонкий молоток выстукивает единственную острую кромку — двухэтапный рецепт в виде кузницы.",
        tt: "Яшел түбәтәйле Серёга заманча кузницада: бер күрек бөтен пычак буйлап киң, тигез җылылык өрә, ә нечкә чүкеч бердәнбер үткен кырыйны чүки — ике этаплы рецепт кузница рәвешендә.",
      },
      imgCaption: {
        en: "The modern recipe in one image: a wide blast of in-batch negatives for even heat, plus a few mined hard ones to tap the edge.",
        ru: "Современный рецепт в одной картинке: широкий поток внутрибатчевых негативов для ровного жара плюс несколько добытых трудных, чтобы выстучать кромку.",
        tt: "Заманча рецепт бер сурәттә: тигез җылылык өчен батч эчендәге негативларның киң агымы, өстенә кырыйны чүкү өчен берничә казып алынган авыры.",
      },
      body: {
        en: [
          "Today's strongest open embedding models converge on one two-stage shape. **Stage one:** a *massive* in-batch contrast — tens of thousands of easy negatives at once — to spread the space out evenly. **Stage two:** fine-tune with a *few* mined hard negatives, filtered so no impostor survives.",
          "The huge batch is what a gradient-caching trick makes affordable on real hardware; the filtered hard negatives are what sharpen the boundary. Massive in-batch for the spread, a careful handful of hard-but-honest negatives for the edge — the whole chapter, in one line.",
        ],
        ru: [
          "Сильнейшие современные открытые модели эмбеддингов сходятся к одной двухстадийной форме. **Стадия один:** *массивный* контраст из батча — десятки тысяч лёгких негативов разом — чтобы равномерно расправить пространство. **Стадия два:** дообучение на *немногих* намайненных трудных негативах, отфильтрованных так, чтобы ни один самозванец не выжил.",
          "Огромный батч становится посильным благодаря приёму кэширования градиентов на реальном железе; отфильтрованные трудные негативы — то, что заостряет границу. Массивный батч — для разворота пространства, аккуратная горстка трудных, но честных негативов — для остроты: вся глава в одну строку.",
        ],
        tt: [
          "Бүгенге иң көчле ачык эмбеддинг модельләре бер ике-этаплы формага җыела. **Беренче этап:** *масса* батч контрасты — берьюлы дистәләрчә мең җиңел негатив — киңлекне тигез җәю өчен. **Икенче этап:** *берничә* майнинг катлаулы негатив белән өстәмә өйрәтү, бер алдакчы да исән калмаслык итеп фильтрланган.",
          "Зур батчны реаль җиһазда градиент кэшләү алымы мөмкин итә; фильтрланган катлаулы негативлар чикне үткенли. Киңлекне җәю өчен масса батч, үткенлек өчен катлаулы ләкин намуслы негативларның сак уч төбе — бөтен бүлек, бер юлда.",
        ],
      },
    },
