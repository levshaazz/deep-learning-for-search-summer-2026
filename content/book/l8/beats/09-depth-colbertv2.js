    {
      id: 'depth-colbertv2', kind: 'prose',
      heading: { en: 'ColBERTv2', ru: 'ColBERTv2', tt: 'ColBERTv2' },
      body: {
        en: [
          "ColBERTv2 improves two things at once. **Denoised supervision**: it is trained by distilling from a cross-encoder and mining hard negatives — exactly the recipe from Lecture 7 — which cleans the training signal and lifts quality to MS MARCO MRR@10 \\(39.7\\). **Residual compression**: each token vector becomes a centroid index plus a quantized residual, about \\(20\\)–\\(36\\) bytes per vector versus \\(256\\) for a naive 16-bit store — a \\(6\\)–\\(10\\times\\) reduction.",
          "Together they make late interaction shippable: a model trained well enough to be worth deploying, in an index small enough to deploy. The remaining cost is *search* over a multi-vector index — addressed by PLAID next, and by ANN in Lecture 9.",
        ],
        ru: [
          "ColBERTv2 улучшает сразу два аспекта. **Очищенный обучающий сигнал**: модель обучают дистилляцией из кросс-энкодера и добычей трудных негативов — ровно рецепт из лекции 7 — что чистит обучающий сигнал и поднимает качество до MS MARCO MRR@10 \\(39{,}7\\). **Остаточное сжатие**: каждый токенный вектор становится индексом центроида плюс квантованный остаток, около \\(20\\)–\\(36\\) байт на вектор против \\(256\\) при наивном 16-битном хранении — сокращение в \\(6\\)–\\(10\\) раз.",
          "Вместе они делают позднее взаимодействие пригодным к выпуску: модель обучена достаточно хорошо, чтобы её разворачивать, а индекс достаточно мал, чтобы это сделать. Остаётся цена *поиска* по многовекторному индексу — её решают PLAID дальше и ANN в лекции 9.",
        ],
        tt: [
          "ColBERTv2 бер үк вакытта ике якны яхшырта. **Шомартылган күзәтчелек**: модель кросс-энкодердан дистилляция һәм каты негативлар казу белән өйрәтелә — нәкъ 7 нче лекциядәге рецепт — бу өйрәтү сигналын чистарта һәм сыйфатны MS MARCO MRR@10 \\(39{,}7\\) га күтәрә. **Калдык кысу**: һәр токен векторы центроид индексы плюс квантланган калдык була, векторга якынча \\(20\\)–\\(36\\) байт, гади 16-битлы саклаудагы \\(256\\) гә каршы — \\(6\\)–\\(10\\) тапкыр кимү.",
          "Бергә алар соңгы тәэсир итешүне чыгарырлык итә: модель урнаштырырлык дәрәҗәдә яхшы өйрәтелгән, ә индекс шуны эшләрлек кечкенә. Калганы — күп-векторлы индекс буенча *эзләү* бәясе — аны алдагы PLAID һәм 9 нчы лекциядәге ANN чишә.",
        ],
      },
    },
