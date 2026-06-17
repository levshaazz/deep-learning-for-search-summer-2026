    {
      id: 'catch-iceberg', kind: 'prose',
      heading: { en: 'The Iceberg returns', ru: 'Айсберг возвращается', tt: 'Айсберг кайта' },
      img: 'L9/L9-08-iceberg-returns.png', imgPos: 'float-right',
      imgAlt: {
        en: 'The Iceberg: the demo is the small tip above water; below it the 90% — serving, monitoring, index rebuilds, drift. Séréga peers over the boat edge.',
        ru: 'Айсберг: демо — маленькая верхушка над водой; под ней 90% — обслуживание, мониторинг, перестроение индекса, дрейф. Серёга смотрит за борт.',
        tt: 'Айсберг: демо — су өстендәге кечкенә оч; аның астында 90% — хезмәт күрсәтү, мониторинг, индексны яңадан төзү, дрейф. Серёга кораб читеннән карый.',
      },
      body: {
        en: [
          "A working notebook is a trap. **The Iceberg returns** (Sculley et al., from Lecture 1): the demo that finds neighbours on your laptop is the easy 10% above the waterline. The 90% below it is everything that keeps the lanes open in production — serving under the SLA, monitoring recall and latency, **rebuilding the index** as documents are added and deleted, re-training the IVF centroids and the PQ codebook as the data **drifts**, and the cost of the RAM that holds it all.",
          "\"The demo worked, so we're done\" is the most expensive sentence in search infrastructure. The ANN structures are the easy part; the *operations* around them are the lecture's real warning.",
        ],
        ru: [
          "Работающий ноутбук — это ловушка. **Айсберг возвращается** (Sculley et al., из лекции 1): демо, находящее соседей на вашем ноутбуке, — это лёгкие 10% над водой. 90% под водой — всё, что держит коридоры открытыми в проде: обслуживание под SLA, мониторинг recall и задержки, **перестроение индекса** по мере добавления и удаления документов, переобучение центроидов IVF и кодбука PQ по мере **дрейфа** данных и цена RAM, держащей всё это.",
          "«Демо заработало, значит мы закончили» — самая дорогая фраза в инфраструктуре поиска. ANN-структуры — лёгкая часть; *эксплуатация* вокруг них — настоящее предупреждение лекции.",
        ],
        tt: [
          "Эшләүче ноутбук — капкын. **Айсберг кайта** (Sculley et al., 1 нче лекциядән): синең ноутбугыңда күршеләрне табучы демо — су өстендәге җиңел 10%. Аның астындагы 90% — продакшнда коридорларны ачык тотучы бар нәрсә: SLA астында хезмәт күрсәтү, recall һәм тоткарлыкны күзәтү, документлар өстәлгәндә һәм бетерелгәндә **индексны яңадан төзү**, мәгълүмат **дрейфланганда** IVF центроидларын һәм PQ кодбугын яңадан өйрәтү, һәм барысын тотучы RAM бәясе.",
          "«Демо эшләде, димәк бетердек» — эзләү инфраструктурасында иң кыйммәт җөмлә. ANN структуралары — җиңел өлеш; алар тирәсендәге *эксплуатация* — лекциянең чын кисәтүе.",
        ],
      },
    },
