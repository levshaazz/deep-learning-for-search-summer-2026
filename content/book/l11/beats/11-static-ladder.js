    {
      id: 'static-ladder', kind: 'prose',
      heading: { en: 'Random, in-batch, BM25', ru: 'Случайные, из батча, BM25', tt: 'Очраклы, батчтан, BM25' },
      body: {
        en: [
          "The first rungs are cheap. **Random** negatives are almost always easy — they give little gradient. **In-batch** negatives reuse the other queries' positives already in the batch for free, so a bigger batch quietly buys more (and slightly harder) negatives. **BM25** negatives add lexically-similar passages that look right but aren't.",
          "But all three are *static*: BM25 is lexical and model-independent, so it soon stops matching what the *dense* model actually confuses; in-batch negatives are whatever happened to share the batch. None of them adapt to the model as it learns.",
          "Even static, the rungs *combine*: DPR's strongest published configuration is in-batch negatives **plus one** BM25 hard negative. On Natural Questions its top-20 climbs from \\(69.1\\) (in-batch alone) to \\(78.0\\) — and a *second* BM25 negative buys nothing more (Karpukhin et al., EMNLP 2020). One well-chosen hard negative is worth more than a pile of easy ones.",
        ],
        ru: [
          "Первые ступени дёшевы. **Случайные** негативы почти всегда лёгкие — дают мало градиента. **Из батча** негативы бесплатно переиспользуют позитивы других запросов, уже лежащие в батче, так что больший батч тихо покупает больше — и чуть более трудных — негативов. **BM25**-негативы добавляют лексически похожие пассажи, которые выглядят правильно, но это не так.",
          "Но все три *статичны*: BM25 лексичен и не зависит от модели, поэтому быстро перестаёт совпадать с тем, что путает *плотная* модель; негативы из батча — это кто попал в батч. Ни один из них не подстраивается под модель по мере обучения.",
          "Даже статичные, ступени *складываются*: сильнейшая опубликованная конфигурация DPR — негативы из батча **плюс один** трудный BM25-негатив. На Natural Questions её top-20 поднимается с \\(69{,}1\\) (только из батча) до \\(78{,}0\\) — а *второй* BM25-негатив уже ничего не даёт (Karpukhin et al., EMNLP 2020). Один удачно выбранный трудный негатив стоит больше, чем куча лёгких.",
        ],
        tt: [
          "Беренче баскычлар арзан. **Очраклы** негативлар диярлек һәрвакыт җиңел — аз градиент бирә. **Батчтан** негативлар башка сорауларның батчта яткан позитивларын бушлай куллана, шуңа зуррак батч тыныч кына күбрәк (һәм бераз катлаулырак) негатив сатып ала. **BM25** негативлар лексик охшаш, дөрес кебек күренгән ләкин дөрес булмаган пассажлар өсти.",
          "Ләкин өчесе дә *статик*: BM25 лексик һәм модельгә бәйсез, шуңа тиздән *тыгыз* модель буташтырган белән туры килүдән туктый; батчтан негативлар — батчка кем эләккәне. Берсе дә модель өйрәнгән саен җайлашмый.",
          "Статик булса да, баскычлар *кушыла*: DPR ның басылган иң көчле конфигурациясе — батчтан негативлар **плюс бер** авыр BM25-негатив. Natural Questions та аның top-20 е \\(69.1\\) дән (бары батчтан) \\(78.0\\) гә күтәрелә — ә *икенче* BM25-негатив инде бернәрсә дә бирми (Karpukhin et al., EMNLP 2020). Уңышлы сайланган бер авыр негатив бер өем җиңелдән кыйммәтрәк.",
        ],
      },
    },
