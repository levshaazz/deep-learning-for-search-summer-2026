    {
      id: 'modern-synthesis', kind: 'prose',
      heading: { en: 'The modern recipe', ru: 'Современный рецепт', tt: 'Заманча рецепт' },
      body: {
        en: [
          "Today's strongest open embedding models converge on one two-stage shape. **Stage one:** a *massive* in-batch contrast — tens of thousands of easy negatives at once — to spread the space out evenly. **Stage two:** fine-tune with a *few* mined hard negatives, filtered so no impostor survives.",
          "The huge batch is what a gradient-caching trick makes affordable on real hardware; the filtered hard negatives are what sharpen the boundary. Massive in-batch for the spread, a careful handful of hard-but-honest negatives for the edge — the whole chapter, in one line.",
        ],
        ru: [
          "Сильнейшие современные открытые модели эмбеддингов сходятся к одной двухстадийной форме. **Стадия один:** *массивный* контраст из батча — десятки тысяч лёгких негативов разом — чтобы равномерно расправить пространство. **Стадия два:** дообучение на *немногих* намайненных сложных негативах, отфильтрованных так, чтобы ни один импостор не выжил.",
          "Огромный батч становится посильным благодаря приёму кэширования градиентов на реальном железе; отфильтрованные сложные негативы — то, что заостряет границу. Массивный батч — для разворота пространства, аккуратная горстка сложных, но честных негативов — для остроты: вся глава в одну строку.",
        ],
        tt: [
          "Бүгенге иң көчле ачык эмбеддинг модельләре бер ике-этаплы формага җыела. **Беренче этап:** *масса* батч контрасты — берьюлы дистәләрчә мең җиңел негатив — киңлекне тигез җәю өчен. **Икенче этап:** *берничә* майнинг катлаулы негатив белән өстәмә өйрәтү, бер самозванец та исән калмаслык итеп фильтрланган.",
          "Зур батчны реаль җиһазда градиент кэшләү алымы мөмкин итә; фильтрланган катлаулы негативлар чикне үткенли. Киңлекне җәю өчен масса батч, үткенлек өчен катлаулы ләкин намуслы негативларның сак уч төбе — бөтен бүлек, бер юлда.",
        ],
      },
    },
