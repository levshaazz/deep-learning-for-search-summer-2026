    {
      id: 'why-small-chunks', kind: 'prose',
      heading: { en: "You can't fit a whole book on one index card", ru: "Целую книгу не уместить на одной карточке", tt: "Бөтен китапны бер карточкага сыйдырып булмый" },
      body: {
        en: [
          "At my reading desk I once tried a foolish thing: to press an entire book onto a single index card. One embedding, one vector \\(v\\), meant to hold every chapter at once. It does not hold. Ask it about the harbour and it mumbles about the mountains too; every specific fact dissolves into a grey average of the whole. The longer the text, the flatter the card — the model calls this *length-induced collapse*, and I call it a book you can no longer read.",
          "So I stopped cramming. I cut the book into small pages and gave each its own card. Now the card about the harbour smells only of salt and rope; when a reader asks for the harbour, that one card lights up and the mountains stay quiet. Small chunks keep a single clear scent, and retrieval walks straight to the right page instead of to the blurred whole.",
          "This is why we chunk at all — not for tidiness, but because *small segments simply retrieve better*. And so the standard move became almost a reflex: cut the book into chunks first, then embed each one. Chunk-then-embed. Chunk Norris sharpens his blade at the very first line... and that eager *cut-first* order, as we shall see, is exactly where the trouble begins.",
        ],
        ru: [
          "За читальным столом я как-то попробовал глупость: втиснуть целую книгу на одну каталожную карточку. Один эмбеддинг, один вектор \\(v\\), обязанный удержать разом все главы. Он не держит. Спросишь его про гавань — а он заодно бормочет и про горы; каждый конкретный факт растворяется в сером среднем по всему тексту. Чем длиннее текст, тем площе карточка — модель зовёт это *коллапсом от длины*, а я зову это книгой, которую больше не прочесть.",
          "Поэтому я перестал утрамбовывать. Я разрезал книгу на маленькие страницы и дал каждой свою карточку. Теперь карточка про гавань пахнет только солью и канатом; спросит читатель про гавань — вспыхнет именно она, а горы промолчат. Маленькие чанки хранят один ясный запах, и поиск идёт прямо к нужной странице, а не к размытому целому.",
          "Вот зачем мы вообще чанкуем — не ради порядка, а потому что *короткие отрезки просто ищутся лучше*. И стандартный ход стал почти рефлексом: сначала разрезать книгу на чанки, потом эмбеддить каждый. Chunk-then-embed. Chunk Norris точит лезвие уже на первой строке... и этот торопливый порядок *режь-сначала*, как мы увидим, — ровно то место, где начинается беда.",
        ],
        tt: [
          "Уку өстәлендә мин беркөнне юләрлек эшләп карадым: бөтен китапны бер каталог карточкасына кысып сыйдырырга. Бер embedding, бер вектор \\(v\\), барлык бүлекләрне берьюлы тотарга тиеш. Ул тотмый. Аннан гавань турында сора — ул шул ук вакытта таулар турында да мыгырдый; һәр конкрет факт бөтен текст буенча соргылт уртачага эри. Текст никадәр озынрак, карточка шулкадәр яссырак — модель моны *озынлыктан коллапс* дип атый, ә мин моны инде укып булмый торган китап дип атыйм.",
          "Шуңа күрә мин тыгызлауны туктаттым. Китапны кечкенә битләргә кисеп, һәрберсенә үз карточкасын бирдем. Хәзер гавань турындагы карточка бары тоз һәм аркан исе аңкыта; укучы гавань турында сораса — нәкъ шул кабына, ә таулар тын кала. Кечкенә chunk-лар бер ачык исне саклый, һәм эзләү томанлы бөтен урынына туры кирәкле битка бара.",
          "Менә ни өчен без гомумән chunk-лыйбыз — тәртип өчен түгел, ә *кыска кисәкләр гади генә яхшырак табыла* дип. Һәм стандарт хәрәкәт диярлек рефлекска әйләнде: башта китапны chunk-ларга кис, аннары һәрберсен embeddlә. Chunk-then-embed. Chunk Norris инде беренче юлда пычагын үткенли... һәм бу ашыгыч *башта-кис* тәртибе, күрербез, нәкъ бәла башлана торган урын.",
        ],
      },
    },
