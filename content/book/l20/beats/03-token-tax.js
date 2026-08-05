    {
      id: 'token-tax', kind: 'prose',
      heading: { en: 'The token tax', ru: 'Токен-налог', tt: 'Токен-налог' },
      img: 'L20/L20-01-token-tax.png', imgPos: 'float-right',
      imgAlt: { en: "One English word swallowed as a single token on the left; the same-meaning Russian word broken into seven character-tiles on the right, a balance scale tipping heavily to the Russian side. Séréga's green tübetey is the only green.", ru: "Слева одно английское слово проглочено одним токеном; справа русское слово того же смысла разбито на семь плиток-символов, весы сильно кренятся в русскую сторону. Единственное зелёное — тюбетейка Серёги.", tt: "Сулда бер инглиз сүзе бер токен белән йотылган; уңда шул ук мәгънәдәге рус сүзе җиде хәреф-плиткага бүленгән, үлчәү рус ягына нык авыша. Бердәнбер яшел — Séréga түбәтәе." },
      imgCaption: { en: "Same meaning, several times the tokens — the bill lands in context length and cost.", ru: "Тот же смысл, кратно больше токенов — счёт приходит в длине контекста и цене.", tt: "Шул ук мәгънә, ничә тапкыр күбрәк токен — хисап контекст озынлыгында һәм бәядә килә." },
      body: {
        en: [
          "The first bill is the **token tax**. BPE (from L2) learns its merges by pair frequency in a training corpus that is overwhelmingly English, so it accumulates rich English sub-word merges and few Russian ones. When it meets a Russian word it has no merges for, it falls back toward characters — and Cyrillic's two-byte UTF-8 encoding makes a byte-level tokenizer start from even smaller pieces.",
          "I trained a tiny character BPE on a 9:1 English-to-Russian mix and ran it on a parallel sentence. English *search* stayed **one** token; Russian *запроса* fell all the way to its **seven** characters. Across the sentence, English cost **1.0** tokens per word and Russian **5.8** — a ×5.8 tax on the same content. The exact ratio is our toy's; production multilingual tokenizers pay a smaller but real premium, often around two tokens per word.",
          "This tax is quiet but real. More tokens per word means less meaning fits a context window, higher per-token API cost, and quadratic attention latency — all borne by the Russian user for the same query. It is a price signal, not an accuracy verdict, but it makes the tokenizer a first-class criterion when you pick a model for Russian.",
        ],
        ru: [
          "Первый счёт — **токен-налог**. BPE (из L2) учит слияния по частоте пар в корпусе обучения, который в подавляющей части английский, — и накапливает богатые английские субслова и почти никаких русских. Встретив русское слово, для которого слияний нет, он откатывается к символам, а двухбайтовая кодировка кириллицы в UTF-8 заставляет байтовый токенизатор начинать с ещё более мелких кусков.",
          "Я обучил крошечный символьный BPE на смеси английского к русскому 9:1 и прогнал на параллельной фразе. Английское *search* осталось **одним** токеном; русское *запроса* рассыпалось на **семь** символов. По фразе английский стоил **1,0** токена на слово, а русский — **5,8**, налог ×5,8 за тот же контент. Точное отношение — нашего toy; продовые мультиязычные токенизаторы платят меньше, но реально — часто около двух токенов на слово.",
          "Налог тихий, но реальный. Больше токенов на слово — меньше смысла влезает в окно контекста, выше цена за токен и квадратичная латентность внимания, и всё это несёт русскоязычный пользователь за тот же запрос. Это сигнал цены, а не приговор точности, но именно он делает токенизатор критерием первого порядка при выборе модели для русского.",
        ],
        tt: [
          "Беренче хисап — **токен-налог**. BPE (L2\'дән) слиянияләрне күпчелек өлеше инглиз булган өйрәтү корпусында пар ешлыгы буенча өйрәнә — һәм бай инглиз субсүзләрен, рус субсүзләрен диярлек юк дәрәҗәдә җыя. Слиянияләре булмаган рус сүзен очратканда ул хәрефләргә кайта, ә кириллицаның UTF-8\'дәге ике байтлы кодлавы байт токенизаторын тагын да ваграк кисәкләрдән башларга мәҗбүр итә.",
          "Мин кечкенә хәреф BPE\'сын инглизчә-русча 9:1 катнашмасында өйрәттем һәм параллель җөмләдә эшләттем. Инглиз *search* **бер** токен булып калды; рус *запроса* **җиде** хәрефкә таркалды. Җөмлә буенча инглиз сүзгә **1.0** токен, ә рус — **5.8**, шул ук эчтәлеккә ×5.8 налог. Төгәл нисбәт — безнең toy\'ныкы; прод мультител токенизаторлары азрак, ләкин чын түли — еш кына сүзгә ике токен тирәсе.",
          "Налог тыныч, ләкин чын. Сүзгә күбрәк токен — контекст тәрәзәсенә азрак мәгънә сыя, токенга бәя югарырак һәм игътибар латентлыгы квадратик, һәм болар барысын да русча кулланучы шул ук сорауга йөкли. Бу — бәя сигналы, төгәллек хөкеме түгел, ләкин нәкъ ул токенизаторны рус өчен model сайлаганда беренче дәрәҗәдәге критерий итә.",
        ],
      },
    },
