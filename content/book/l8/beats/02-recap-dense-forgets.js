    {
      id: 'recap-dense-forgets', kind: 'prose',
      heading: { en: 'One vector forgets', ru: 'Один вектор забывает', tt: 'Бер вектор оныта' },
      body: {
        en: [
          "Recall the Scout from Lecture 7: a bi-encoder pools an entire document into **one** vector. That is fast and cacheable, but a single vector is a blurry average — a rare word or an exact phrase drowns in the mean. The evidence is in the BEIR benchmark: out of domain, robust **BM25** reaches nDCG@10 \\(0.43\\) while the dense **DPR** only \\(0.38\\). One pooled vector is not the whole story.",
          "So what if we refused to pool? What if we kept a vector **per token** and let the query interact with the document at the token level? That is *late interaction*, and the model that does it is ColBERT.",
        ],
        ru: [
          "Вспомни Разведчика из лекции 7: би-энкодер сворачивает весь документ в **один** вектор. Это быстро и кэшируется, но один вектор — это размытое среднее: редкое слово или точная фраза тонут в нём. Доказательство — бенчмарк BEIR: вне домена крепкий **BM25** достигает nDCG@10 \\(0.43\\), а плотный **DPR** — лишь \\(0.38\\). Один свёрнутый вектор — не вся история.",
          "А что если не сворачивать? Что если хранить вектор **на каждый токен** и дать запросу взаимодействовать с документом на уровне токенов? Это *позднее взаимодействие*, и модель, которая так делает, — ColBERT.",
        ],
        tt: [
          "7 нче лекциядәге Разведчикны исеңә төшер: би-энкодер бөтен документны **бер** векторга җыя. Бу тиз һәм кэшләнә, әмма бер вектор — томанлы уртача: сирәк сүз яки төгәл гыйбарә анда батып кала. Дәлил — BEIR бенчмаркы: домен тышында нык **BM25** nDCG@10 \\(0.43\\) ка җитә, ә тыгыз **DPR** — бары \\(0.38\\). Бер җыелган вектор — тулы хикәя түгел.",
          "Алайса җыймасак? **Һәр токенга** вектор саклап, сорауга документ белән токен дәрәҗәсендә тәэсир итешергә рөхсәт итсәк? Бу — *соңгы тәэсир итешү*, һәм аны эшләүче модель — ColBERT.",
        ],
      },
    },
