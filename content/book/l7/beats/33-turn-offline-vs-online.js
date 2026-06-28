    {
      id: 'turn-offline-vs-online', kind: 'prose',
      heading: { en: 'Which clock: offline vs online', ru: 'На каких часах: офлайн против онлайн', tt: 'Кайсы сәгать: офлайн каршы онлайн' },
      img: 'L7/L7-12-the-product.png', imgPos: 'scene',
      imgAlt: {
        en: 'The finished product: a split workshop where the build-time half (ingest, chunk, embed, index) runs once on a slow clock, and the query-time half (embed, retrieve, rerank, generate a grounded answer) runs per request on a fast clock — the full retrieval-augmented pipeline.',
        ru: 'Готовый продукт: разделённая мастерская, где половина времени сборки (приём, нарезка, эмбеддинг, индекс) работает один раз на медленных часах, а половина времени запроса (эмбеддинг, извлечение, переранжирование, генерация обоснованного ответа) — на каждый запрос на быстрых часах — полный поисково-дополненный конвейер.',
        tt: 'Әзер продукт: бүленгән остаханә, анда төзү вакыты яртысы (кабул итү, кисү, эмбедләү, индекс) акрын сәгатьтә бер тапкыр эшли, ә сорау вакыты яртысы (эмбедләү, табу, кабат тәртипләү, нигезле җавап ясау) — тиз сәгатьтә һәр сорауга — тулы эзләү-тулыландырылган конвейер.',
      },
      body: {
        en: [
          "The most clarifying line in production retrieval is **which clock a cost runs on**. **Build-time, offline:** ingest, chunk, embed the corpus, build the index, train the models — expensive, but paid *once* and amortized over every query, and measured on **BEIR / MTEB**.",
          "**Query-time, online:** embed the one query, retrieve, rerank, assemble — the **latency budget lives here**, and you measure it by **A/B testing** clicks and conversions (callback L4). Confuse the two and you either blow the latency budget or rebuild your index on every request.",
        ],
        ru: [
          'Самая проясняющая мысль в продакшен-поиске — **на каких часах считается стоимость**. **Build-time, офлайн:** приём, нарезка, эмбеддинг корпуса, построение индекса, обучение моделей — дорого, но платится *один раз* и амортизируется по всем запросам, меряется на **BEIR / MTEB**.',
          '**Query-time, онлайн:** эмбеддинг одного запроса, извлечение, переранжирование, сборка — **бюджет задержки живёт здесь**, и его меряют **A/B-тестами** по кликам и конверсии (callback L4). Спутаешь одно с другим — либо превысишь бюджет задержки, либо будешь пересобирать индекс на каждый запрос.',
        ],
        tt: [
          'Продакшен-эзләүдә иң ачыклаучы фикер — **стоимость кайсы сәгатьтә исәпләнә**. **Build-time, офлайн:** кабул итү, кисү, корпусны эмбедләү, индекс төзү, модельләрне өйрәтү — кыйммәт, әмма *бер тапкыр* түләнә һәм бар сорауларга бүленә, **BEIR / MTEB**\'та үлчәнә.',
          '**Query-time, онлайн:** бер сорауны эмбедләү, алу, кабат тәртипләү, җыю — **тоткарлык бюджеты монда яши**, һәм ул клик-конверсия буенча **A/B-тест** белән үлчәнә (callback L4). Икесен бутасаң — я тоткарлык бюджетын узасың, я һәр сорауга индексны яңадан төзисең.',
        ],
      },
    },
