    {
      id: 'reference-free-vs-based', kind: 'prose',
      heading: { en: 'Reference-free vs. reference-based', ru: 'Без эталона против с эталоном', tt: 'Эталонсыз каршы эталонлы' },
      imgPos: 'inline',
      body: {
        en: [
          "Both RAGAS and the LLM-judge can run in two modes, and the distinction is worth a beat. **Reference-based** judging gives the judge a human-written gold answer to compare against — *\"here is the answer; here is the ideal answer; how close is it?\"* When you have a gold answer this is the most reliable mode, because the judge is anchored to a fixed target instead of its own shifting taste. The catch is the one this whole lecture opened on: gold answers are expensive, and for open generation they often do not exist.",
          "**Reference-free** judging gives the judge only the question, the context, and the answer — and asks it to reason about quality directly. This is the default for RAG at scale, precisely because it needs no labels and runs on every answer. It is what makes RAGAS's four metrics and the bare LLM-judge usable in production. The price is that the judge has no external anchor; it is grading on its own internalised sense of \"good,\" which is exactly the surface a bias can exploit.",
          "The practical rule: use **reference-based** wherever you can afford gold answers — on a small, curated regression set you check before every release — and **reference-free** everywhere else, for the long tail of live traffic. And whenever you go reference-free, remember the anchor is gone, so the judge's own biases are now load-bearing. Which brings us, at last, to the trickster.",
        ],
        ru: [
          "И RAGAS, и LLM-судья могут работать в двух режимах, и различие стоит такта. **С эталоном** судья получает золотой ответ, написанный человеком, для сравнения — *«вот ответ; вот идеальный ответ; насколько близко?»* Когда золотой ответ есть, это надёжнейший режим, ведь судья привязан к фиксированной цели, а не к собственному плавающему вкусу. Загвоздка — та, с которой эта лекция началась: золотые ответы дороги, а для открытой генерации их часто попросту нет.",
          "**Без эталона** судья получает лишь вопрос, контекст и ответ — и его просят рассуждать о качестве напрямую. Это режим по умолчанию для RAG в масштабе, ровно потому что не нужны метки и работает на каждом ответе. Это и делает четыре метрики RAGAS и голого LLM-судью пригодными для продакшна. Цена в том, что у судьи нет внешней опоры; он оценивает по собственному усвоенному чувству «хорошего» — ровно та поверхность, которую может эксплуатировать смещение.",
          "Практическое правило: используй **с эталоном** там, где можешь позволить золотые ответы — на малом, тщательно собранном регрессионном наборе, который проверяешь перед каждым релизом — и **без эталона** везде ещё, для длинного хвоста живого трафика. И всякий раз, переходя на без-эталона, помни: опоры больше нет, и собственные смещения судьи теперь несущие. Что и приводит нас, наконец, к трикстеру.",
        ],
        tt: [
          "RAGAS та, LLM-хөкемче дә ике режимда эшли ала, һәм аерма бер биткә лаек. **Эталонлы** хөкемдә хөкемчегә чагыштыру өчен кеше язган алтын җавап бирелә — *«менә җавап; менә идеаль җавап; никадәр якын?»* Алтын җавап булганда бу — иң ышанычлы режим, чөнки хөкемче үз авышкан тәменә түгел, ә беркетелгән максатка бәйләнгән. Каршылык — бу лекция башланган шул: алтын җаваплар кыйммәт, ә ачык генерация өчен алар еш кына гомумән юк.",
          "**Эталонсыз** хөкемдә хөкемчегә бары сорау, контекст һәм җавап бирелә — һәм сыйфат турында туры фикер йөртүен сорыйлар. Бу — масштабтагы RAG өчен килешү буенча режим, нәкъ билгеләр кирәкмәгәнгә һәм һәр җавапта эшләгәнгә. Нәкъ шул RAGAS ның дүрт метрикасын һәм ялангач LLM-хөкемчене продакшнга яраклы итә. Бәясе шунда — хөкемченең тышкы таянычы юк; ул үзенең үзләштергән «яхшы» хисе буенча бәяли — нәкъ авышу куллана ала торган өслек.",
          "Практик кагыйдә: алтын җавапларны күтәрә алган җирдә **эталонлы** куллан — һәр чыгарылыш алдыннан тикшерә торган кечкенә, җыентык регрессия җыелмасында — һәм калган бар җирдә **эталонсыз**, тере трафикның озын койрыгы өчен. Һәм эталонсызга күчкән саен исеңдә тот: таяныч бетте, ә хөкемченең үз авышулары хәзер йөк күтәрә. Бу безне ниһаять мутлык иясенә китерә.",
        ],
      },
    },
