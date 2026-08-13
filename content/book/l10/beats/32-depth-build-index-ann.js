    {
      id: 'depth-build-index-ann', kind: 'prose',
      heading: { en: 'Offline: build the index (ANN)', ru: 'Офлайн: построение индекса (ANN)', tt: 'Офлайн: индекс төзү (ANN)' },
      body: {
        en: [
          "Then the bi-encoder embeds the **whole corpus** and the vectors go into an **approximate-nearest-neighbour** index — the fix for the Scout's last weakness, the linear sweep, bringing \\(N\\) dot-products toward \\(\\sim\\log N\\). **HNSW** builds a navigable small-world graph: \\(M\\) (≈16–48 links) is a *build-time* knob — the graph degree fixed at construction (more links = higher recall ceiling but more memory) — while \\(efSearch\\) is the *query-time* dial that trades recall against latency live; **IVF-PQ** partitions space into cells and product-quantizes vectors to about 8 bytes each for billion scale — but PQ is lossy (reconstruction error lowers recall), so you rescore the top-k at full precision, as in the binary/int8 recipe earlier.",
          "Recall versus latency is a dial — on Sift1M, recall climbs from ~80% toward ~100% as efSearch rises. The full story of ANN is **Lecture 13**.",
        ],
        ru: [
          'Затем би-энкодер кодирует **весь корпус**, и векторы кладутся в индекс **приближённого поиска соседей** — лекарство от последней слабости Разведчика, линейного перебора: он снижает \\(N\\) скалярных произведений до \\(\\sim\\log N\\). **HNSW** строит граф «малого мира»: \\(M\\) (≈16–48 связей) — параметр *сборки*, степень графа, фиксируется при построении (больше связей = выше потолок полноты, но больше памяти), а \\(efSearch\\) — ручка *времени запроса*, живой размен полноты на задержку; **IVF-PQ** делит пространство на ячейки и сжимает векторы до ~8 байт каждый для миллиардного масштаба — но PQ с потерями (ошибка восстановления снижает полноту), поэтому top-k пересчитывают в полной точности, как в рецепте binary/int8 ранее.',
          'Полнота против задержки — это ручка: на Sift1M полнота растёт от ~80% к ~100% с ростом efSearch. Полная история ANN — **Лекция 13**.',
        ],
        tt: [
          'Аннары би-энкодер **бөтен корпусны** кодлый, ә векторлар **якынча күрше эзләү** индексына салына — Разведчикның соңгы көчсезлеген, сызыкча эзләүне, дәвалый, \\(N\\) скаляр тапкырчыкны \\(\\sim\\log N\\)\'га китерә. **HNSW** «кечкенә дөнья» графы төзи: \\(M\\) (≈16–48 бәйләнеш) — *төзү* параметры, граф дәрәҗәсе, төзегәндә беркетелә (күбрәк бәйләнеш = тулылык түшәме югарырак, ләкин күбрәк хәтер), ә \\(efSearch\\) — *запрос вакыты* рычагы, тулылыкны тоткарлыкка тере рәвештә алмаштыра; **IVF-PQ** киңлекне күзәнәкләргә бүлә һәм векторларны миллиард масштаб өчен якынча 8 байтка кыса — ләкин PQ югалтулы (торгызу хатасы тулылыкны киметә), шуңа top-k\'ны тулы төгәллектә яңадан саныйлар, элегрәк binary/int8 рецебындагы кебек.',
          'Тулылык каршы тоткарлык — рычаг: Sift1M\'да тулылык ~80%-тан ~100%-ка efSearch үсүе белән арта. ANN\'ның тулы тарихы — **13 нчы лекция**.',
        ],
      },
    },
