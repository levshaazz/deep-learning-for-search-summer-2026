    {
      id: 'depth-build-index-ann', kind: 'prose',
      heading: { en: 'Offline: build the index (ANN)', ru: 'Офлайн: построение индекса (ANN)', tt: 'Офлайн: индекс төзү (ANN)' },
      body: {
        en: [
          "Then the bi-encoder embeds the **whole corpus** and the vectors go into an **approximate-nearest-neighbour** index — the fix for the Scout's last weakness, the linear sweep, bringing \\(N\\) dot-products toward \\(\\sim\\log N\\). **HNSW** builds a navigable small-world graph, with \\(M\\) (≈16–48 links) and \\(efSearch\\) trading recall against latency; **IVF-PQ** partitions space into cells and product-quantizes vectors to about 8 bytes each for billion scale.",
          "Recall versus latency is a dial — on Sift1M, recall climbs from ~80% toward ~100% as efSearch rises. The full story of ANN is **Lecture 9**.",
        ],
        ru: [
          'Затем би-энкодер кодирует **весь корпус**, и векторы кладутся в индекс **приближённого поиска соседей** — лекарство от последней слабости Разведчика, линейного перебора: он снижает \\(N\\) скалярных произведений до \\(\\sim\\log N\\). **HNSW** строит граф «малого мира» с \\(M\\) (≈16–48 связей) и \\(efSearch\\), который разменивает отзыв на задержку; **IVF-PQ** делит пространство на ячейки и сжимает векторы до ~8 байт каждый для миллиардного масштаба.',
          'Отзыв против задержки — это ручка: на Sift1M отзыв растёт от ~80% к ~100% с ростом efSearch. Полная история ANN — **Лекция 9**.',
        ],
        tt: [
          'Аннары би-энкодер **бөтен корпусны** кодлый, ә векторлар **якынча күрше эзләү** индексына салына — Разведчикның соңгы көчсезлеген, сызыкча эзләүне, дәвалый, \\(N\\) скаляр тапкырчыкны \\(\\sim\\log N\\)\'га китерә. **HNSW** «кечкенә дөнья» графы төзи, \\(M\\) (≈16–48 бәйләнеш) һәм \\(efSearch\\) тулылыкны тоткарлыкка алмаштыра; **IVF-PQ** киңлекне күзәнәкләргә бүлә һәм векторларны миллиард масштаб өчен якынча 8 байтка кыса.',
          'Тулылык каршы тоткарлык — рычаг: Sift1M\'да тулылык ~80%-тан ~100%-ка efSearch үсүе белән арта. ANN\'ның тулы тарихы — **9 нчы лекция**.',
        ],
      },
    },
