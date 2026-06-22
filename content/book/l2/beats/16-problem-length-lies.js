    {
      id: 'problem-length-lies', kind: 'prose',
      heading: { en: 'Length lies', ru: 'Длина врёт', tt: 'Озынлык ялгана' },
      img: 'L2/L2-56-cosine-vs-euclid.png',
      imgAlt: {
        en: 'Two arrows (1,1) and (10,10) pointing the same way; Euclidean calls them far, cosine calls them identical.',
        ru: 'Две стрелки (1,1) и (10,10) смотрят в одну сторону; евклид считает их далёкими, косинус — одинаковыми.',
        tt: 'Ике ук (1,1) һәм (10,10) бер якка карый; Евклид аларны ерак дип саный, косинус — бертөрле.',
      },
      imgCaption: {
        en: '\\((1,1)\\) and \\((10,10)\\) point the same way. Euclidean distance \\(\\sqrt{162} \\approx 12.73\\) screams "different" — yet the direction is identical.',
        ru: '\\((1,1)\\) и \\((10,10)\\) смотрят в одну сторону. Евклидово расстояние \\(\\sqrt{162} \\approx 12{,}73\\) вопит «разные» — а направление при этом одинаково.',
        tt: '\\((1,1)\\) һәм \\((10,10)\\) бер якка карый. Евклид ераклыгы \\(\\sqrt{162} \\approx 12{,}73\\) «төрле» дип кычкыра — ә юнәлеш шул ук.',
      },
      body: {
        en: [
          "Tokenization done, every phrase is now a vector of numbers — a point in space, where each coordinate counts (roughly) how much of some feature the phrase carries. To compare two phrases, the obvious move is to measure the straight-line distance between their points: \\(\\lVert a - b\\rVert\\), the Euclidean distance you learned in school. Obvious… and wrong.",
          "Here's the trap, with exact numbers. Take the phrase whose vector is \\(a = (1, 1)\\) and the same phrase said twice as emphatically, \\(b = (10, 10)\\). They carry the *same* meaning — both point in exactly the same direction, up-and-to-the-right at 45°. But the Euclidean distance between them is $$\\lVert a - b\\rVert = \\sqrt{9^2 + 9^2} = \\sqrt{162} \\approx 12.73.$$ Raw distance screams \"these are totally different!\" — when in fact one is just a louder version of the other.",
          "That's the bug in one line: **length lies.** Euclidean distance conflates *how much* a vector says with *what* it says. A long document and a short document on the identical topic land far apart simply because the long one has bigger counts. We don't want loudness. We want a measure that throws away magnitude entirely and listens only to *direction* — to where the vector points.",
        ],
        ru: [
          'Токенизация позади — теперь каждая фраза это вектор чисел, точка в пространстве, где каждая координата считает (грубо), сколько в фразе того или иного признака. Чтобы сравнить две фразы, очевидный ход — измерить расстояние по прямой между их точками: \\(\\lVert a - b\\rVert\\), евклидово расстояние из школы. Очевидно… и неверно.',
          'Вот ловушка, с точными числами. Возьми фразу с вектором \\(a = (1, 1)\\) и ту же фразу, сказанную вдвое напористее, \\(b = (10, 10)\\). Смысл у них *один и тот же* — обе смотрят ровно в одну сторону, вправо-вверх под 45°. Но евклидово расстояние между ними $$\\lVert a - b\\rVert = \\sqrt{9^2 + 9^2} = \\sqrt{162} \\approx 12{,}73.$$ Сырое расстояние вопит: «они совершенно разные!» — хотя на деле одна просто громче другой.',
          'Вот баг в одну строку: **длина врёт.** Евклидово расстояние смешивает *сколько* вектор говорит с тем, *что* он говорит. Длинный документ и короткий на одну и ту же тему оказываются далеко друг от друга просто потому, что у длинного счётчики больше. Нам не нужна громкость. Нам нужна мера, которая полностью выбрасывает величину и слушает только *направление* — куда вектор смотрит.',
        ],
        tt: [
          'Токенлаштыру тәмам, һәр фраза хәзер саннар векторы — киңлектә нокта, анда һәр координата фраза нинди дә бер билгене (тупаслап) күпме йөртә икәнен саный. Ике фразаны чагыштырыр өчен, ачык ход — аларның нокталары арасында туры сызык ераклыгын үлчәү: \\(\\lVert a - b\\rVert\\), мәктәптән өйрәнгән Евклид ераклыгы. Ачык… һәм ялгыш.',
          'Менә тозак, төгәл саннар белән. Векторы \\(a = (1, 1)\\) булган фразаны һәм шул ук фразаны ике тапкыр катырак басым белән әйткәнен, \\(b = (10, 10)\\), ал. Аларның мәгънәсе *бер үк* — икесе дә нәкъ бер юнәлешкә, уңга-өскә 45° астында карый. Ләкин алар арасында Евклид ераклыгы $$\\lVert a - b\\rVert = \\sqrt{9^2 + 9^2} = \\sqrt{162} \\approx 12{,}73.$$ Чи ераклык «болар бөтенләй төрле!» дип кычкыра — ә чынлыкта берсе икенчесенең катырак варианты гына.',
          'Менә баг бер юлда: **озынлык ялгана.** Евклид ераклыгы вектор *күпме* сөйләгәнен ул *нәрсә* сөйләгәне белән бутый. Бер темадагы озын документ белән кыска документ бер-берсеннән еракта була, бары тик озынында санаучылар зуррак булганга. Безгә катылык кирәкми. Безгә зурлыкны тулысынча ыргыта торган һәм бары тик *юнәлешне* — вектор кая караганын — тыңлый торган үлчәм кирәк.',
        ],
      },
    },
