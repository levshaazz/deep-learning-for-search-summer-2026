    {
      id: 'turn-production', kind: 'prose',
      heading: { en: 'FAISS, vector DBs, the serving path', ru: 'FAISS, векторные БД, путь обслуживания', tt: 'FAISS, вектор-БД, хезмәт күрсәтү юлы' },
      img: 'L9/L9-06-engine-room-faiss.png', imgPos: 'float-right',
      imgAlt: {
        en: "Séréga in the Ship's engine room where FAISS indexes hum in racks and a vector-DB tank glows.",
        ru: 'Серёга в машинном отделении Корабля, где в стойках гудят индексы FAISS и светится резервуар векторной БД.',
        tt: 'Серёга Корабльнең машина бүлегендә, анда стеллажларда FAISS индекслары гүли һәм вектор-БД резервуары балка.',
      },
      body: {
        en: [
          "These structures don't float in the void — they live in software. **FAISS** is a *library*: you build an index (`IndexFlat`, `IndexIVFPQ`, `IndexHNSWFlat`) in your own process and call it. A **vector database** (the index plus storage, filtering, updates, replication, an API) is a *service* you query over the network. The rule of thumb: FAISS when the index fits one process you control; a vector DB when you need it managed, filtered, and shared.",
          "Either way, a query is now a **request with a budget**. It embeds the query, runs ANN search, re-ranks the shortlist (the Lecture 7 cross-encoder, now sitting *behind* ANN), checks a cache, and responds — all under a latency SLA. That budget is the next climb.",
        ],
        ru: [
          "Эти структуры не висят в пустоте — они живут в софте. **FAISS** — это *библиотека*: вы строите индекс (`IndexFlat`, `IndexIVFPQ`, `IndexHNSWFlat`) в своём процессе и вызываете его. **Векторная база данных** (индекс плюс хранилище, фильтрация, обновления, репликация, API) — это *сервис*, который вы запрашиваете по сети. Правило: FAISS, когда индекс помещается в один контролируемый процесс; векторная БД, когда нужно управляемое, фильтруемое и общее.",
          "Так или иначе, запрос теперь — **запрос с бюджетом**. Он эмбеддит запрос, запускает ANN-поиск, переранжирует шорт-лист (кросс-энкодер из лекции 7, теперь *за* ANN), проверяет кэш и отвечает — всё под SLA по задержке. Этот бюджет — следующий подъём.",
        ],
        tt: [
          "Бу структуралар бушлыкта эленеп тормый — алар софтта яши. **FAISS** — бу *китапханә*: син үз процессыңда индекс (`IndexFlat`, `IndexIVFPQ`, `IndexHNSWFlat`) төзисең һәм аны чакырасың. **Вектор мәгълүмат базасы** (индекс плюс саклагыч, фильтрлау, яңарту, репликация, API) — бу син челтәр аша сорый торган *хезмәт*. Кагыйдә: индекс син контрольдә тоткан бер процесска сыйганда — FAISS; идарә ителгән, фильтрлы һәм уртак кирәк булганда — вектор-БД.",
          "Ничек кенә булса да, сорау хәзер — **бюджетлы сорау**. Ул сорауны эмбеддлый, ANN эзләвен эшләтә, кыска исемлекне яңадан ранжлый (7 нче лекция кросс-энкодеры, хәзер ANN *артында*), кэшны тикшерә һәм җавап бирә — барысы да тоткарлык SLA астында. Бу бюджет — киләсе менү.",
        ],
      },
    },
