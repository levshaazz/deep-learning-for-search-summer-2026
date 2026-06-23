    {
      id: 'static-ladder', kind: 'prose',
      heading: { en: 'Random, in-batch, BM25', ru: 'Случайные, из батча, BM25', tt: 'Очраклы, батчтан, BM25' },
      body: {
        en: [
          "The first rungs are cheap. **Random** negatives are almost always easy — they give little gradient. **In-batch** negatives reuse the other queries' positives already in the batch for free, so a bigger batch quietly buys more (and slightly harder) negatives. **BM25** negatives add lexically-similar passages that look right but aren't.",
          "But all three are *static*: BM25 is lexical and model-independent, so it soon stops matching what the *dense* model actually confuses; in-batch negatives are whatever happened to share the batch. None of them adapt to the model as it learns.",
        ],
        ru: [
          "Первые ступени дёшевы. **Случайные** негативы почти всегда лёгкие — дают мало градиента. **Из батча** негативы бесплатно переиспользуют позитивы других запросов, уже лежащие в батче, так что больший батч тихо покупает больше (и чуть сложнее) негативов. **BM25**-негативы добавляют лексически похожие пассажи, которые выглядят правильно, но это не так.",
          "Но все три *статичны*: BM25 лексичен и не зависит от модели, поэтому быстро перестаёт совпадать с тем, что путает *плотная* модель; негативы из батча — это кто попал в батч. Ни один из них не подстраивается под модель по мере обучения.",
        ],
        tt: [
          "Беренче баскычлар арзан. **Очраклы** негативлар диярлек һәрвакыт җиңел — аз градиент бирә. **Батчтан** негативлар башка сорауларның батчта яткан позитивларын бушлай куллана, шуңа зуррак батч тыныч кына күбрәк (һәм бераз катлаулырак) негатив сатып ала. **BM25** негативлар лексик охшаш, дөрес кебек күренгән ләкин дөрес булмаган пассажлар өсти.",
          "Ләкин өчесе дә *статик*: BM25 лексик һәм модельгә бәйсез, шуңа тиздән *тыгыз* модель буташтырган белән туры килүдән туктый; батчтан негативлар — батчка кем эләккәне. Берсе дә модель өйрәнгән саен җайлашмый.",
        ],
      },
    },
