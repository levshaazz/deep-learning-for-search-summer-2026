    {
      id: 'turn-offline-vs-online', kind: 'prose',
      heading: { en: 'Which clock: offline vs online', ru: 'На каких часах: офлайн против онлайн', tt: 'Кайсы сәгать: офлайн каршы онлайн' },
      body: {
        en: [
          "The most clarifying line in production retrieval is **which clock a cost runs on**. **Build-time, offline:** ingest, chunk, embed the corpus, build the index, train the models — expensive, but paid *once* and amortized over every query, and measured on **BEIR / MTEB**.",
          "**Query-time, online:** embed the one query, retrieve, rerank, assemble — the **latency budget lives here**, and you measure it by **A/B testing** clicks and conversions (callback L4). Confuse the two and you either blow the latency budget or rebuild your index on every request.",
        ],
        ru: [
          'Самая проясняющая мысль в продакшен-поиске — **на каких часах считается стоимость**. **Build-time, офлайн:** приём, нарезка, эмбеддинг корпуса, построение индекса, обучение моделей — дорого, но платится *один раз* и амортизируется по всем запросам, меряется на **BEIR / MTEB**.',
          '**Query-time, онлайн:** эмбед одного запроса, извлечение, переранжирование, сборка — **бюджет задержки живёт здесь**, и его меряют **A/B-тестами** по кликам и конверсии (callback L4). Спутаешь два — либо превысишь бюджет задержки, либо будешь пересобирать индекс на каждый запрос.',
        ],
        tt: [
          'Продакшен-эзләүдә иң ачыклаучы фикер — **стоимость кайсы сәгатьтә исәпләнә**. **Build-time, офлайн:** кабул итү, кисү, корпусны эмбедләү, индекс төзү, модельләрне өйрәтү — кыйммәт, әмма *бер тапкыр* түләнә һәм бар сорауларга бүленә, **BEIR / MTEB**\'та үлчәнә.',
          '**Query-time, онлайн:** бер сорауны эмбедләү, алу, кабат тәртипләү, җыю — **тоткарлык бюджеты монда яши**, һәм ул клик-конверсия буенча **A/B-тест** белән үлчәнә (callback L4). Икесен бутасаң — я тоткарлык бюджетын узасың, я һәр сорауга индексны яңадан төзисең.',
        ],
      },
    },
