    {
      id: 'bias', kind: 'prose',
      heading: { en: 'Risk 1 — bias', ru: 'Риск 1 — смещение', tt: 'Риск 1 — авышлык' },
      img: 'L12/L12-12-ethics-bias.png', imgPos: 'float-right',
      imgAlt: {
        en: 'A two-stage pipeline where a skewed corpus feeds a tilted retriever and then a generator, the imbalance growing at each stage; an audit magnifier inspects the corpus and the subgroup bars on the side.',
        ru: 'Двухстадийный конвейер, где перекошенный корпус питает наклонённый ретривер, а затем генератор, и дисбаланс растёт на каждой стадии; лупа аудита изучает корпус и столбики подгрупп сбоку.',
        tt: 'Кыек корпус авышкан эзләгечне, аннары генераторны туендырган ике этаплы пайплайн, тигезсезлек һәр этапта үсә; аудит лупасы корпусны һәм яктагы төркемчә баганаларын тикшерә.',
      },
      body: {
        en: [
          "Bias enters a RAG system at **two stages** and compounds. **Retrieval** inherits the corpus: a skewed corpus surfaces skewed passages — the recall floor from the Oracle, now an ethical problem. **Generation** inherits the model: an LLM amplifies whatever its training taught it to say. The retriever picks biased evidence; the generator dresses it in fluent prose.",
          "Multimodal makes it **sharper**. CLIP's shared space is only as fair as its image–caption training pairs — the limit we just flagged — so a biased pairing distribution becomes a biased retrieval space.",
          "The mitigation is operational, not aspirational: **audit the corpora; measure subgroup performance; diversify the sources.** Bias you do not measure, you ship. The point is to make fairness a *metric you track*, the way the Oracle made faithfulness a metric — not a hope you hold.",
        ],
        ru: [
          "Смещение входит в RAG-систему на **двух стадиях** и накапливается. **Поиск** наследует корпус: перекошенный корпус выносит перекошенные отрывки — порог полноты из Оракула, теперь этическая проблема. **Генерация** наследует модель: LLM усиливает всё, чему её научило обучение. Ретривер выбирает смещённые свидетельства; генератор облекает их в беглую прозу.",
          "Мультимодальность делает это **острее**. Общее пространство CLIP справедливо ровно настолько, насколько справедливы его обучающие пары изображение–подпись — предел, который мы только что отметили, — так что смещённое распределение пар становится смещённым пространством поиска.",
          "Смягчение операционно, а не декларативно: **аудируй корпуса; измеряй результаты по подгруппам; диверсифицируй источники.** Смещение, которое не измеряешь, ты так и выпускаешь пользователям. Суть — сделать справедливость *метрикой, которую отслеживаешь*, как Оракул сделал метрикой верность, — а не надеждой, на которую уповаешь.",
        ],
        tt: [
          "Авышлык RAG системасына **ике этапта** керә һәм җыела. **Эзләү** корпусны мирас итә: кыек корпус кыек өзекләр чыгара — Оракулдан тулылык идәне, хәзер этик проблема. **Генерация** модельне мирас итә: LLM өйрәтү аңа нәрсә әйтергә өйрәткәнне көчәйтә. Эзләгеч авышлыклы дәлилләр сайлый; генератор аларны шома прозага киендерә.",
          "Мультимодальлек моны **кискенрәк** итә. CLIP ның уртак киңлеге үзенең рәсем-язма өйрәтү парлары күпме гадел булса, шулкадәр гадел — без яңа гына билгеләгән чик — шуңа авышлыклы пар таралышы авышлыклы эзләү киңлегенә әйләнә.",
          "Йомшарту операцион, декларатив түгел: **корпусларны тикшер; төркемчәләр буенча нәтиҗәләрне үлчә; чыганакларны төрләндер.** Үлчәмәгән авышлыкны син продакшнга чыгарасың. Максат — гаделлекне *син күзәтә торган метрика* итү, Оракул тугрылыкны метрика иткән кебек, — тоткан өмет түгел."
        ],
      },
    },
