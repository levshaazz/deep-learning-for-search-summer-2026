    {
      id: 'depth-precompute-why', kind: 'prose',
      heading: { en: 'Why precompute wins', ru: 'Почему предподсчёт выигрывает', tt: 'Ни өчен алдан исәпләү җиңә' },
      body: {
        en: [
          "Here is the whole speed argument for Scouts. Because the document tower never sees the query, you encode every document **once, offline**, and store the vectors. At query time you encode the query **once** and then do \\(N\\) cheap dot-products — not \\(N\\) encoder passes. One forward pass plus a vector sweep, versus a million forward passes. That gap is why retrieval is feasible at all, and it sets up the next jump: even the \\(N\\) dot-products can be made sub-linear with approximate nearest-neighbour search (Lecture 9).",
        ],
        ru: [
          'Вот весь аргумент скорости для Разведчиков. Раз башня документа не видит запрос, каждый документ кодируется **один раз, офлайн**, и векторы хранятся. На запросе ты кодируешь запрос **один раз** и делаете \\(N\\) дешёвых скалярных произведений — не \\(N\\) прогонов энкодера. Один проход плюс проход по векторам против миллиона проходов энкодера. Этот разрыв и делает поиск вообще возможным, и готовит следующий скачок: даже \\(N\\) произведений можно сделать сублинейными приближённым поиском соседей (Лекция 9).',
        ],
        tt: [
          'Менә Разведчиклар өчен бөтен тизлек дәлиле. Документ манарасы сорауны күрмәгәнгә, һәр документ **бер тапкыр, офлайн** кодлана, векторлар саклана. Сорау вакытында сорауны **бер тапкыр** кодлыйсың, аннары \\(N\\) арзан скаляр тапкырчык эшлисең — \\(N\\) энкодер үтеше түгел. Бер үтеш плюс векторлар буенча үтеш — миллион энкодер үтешенә каршы. Бу аерма эзләүне гомумән мөмкин итә, һәм киләсе сикерүне әзерли: \\(N\\) тапкырчыкны да якынча күрше эзләве белән сублиняр итеп була (9 нчы лекция).',
        ],
      },
    },
