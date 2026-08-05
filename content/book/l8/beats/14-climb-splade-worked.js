    {
      id: 'climb-splade-worked', kind: 'prose',
      heading: { en: 'A learned weight, by hand', ru: 'Выученный вес вручную', tt: 'Өйрәнелгән авырлык кул белән' },
      body: {
        en: [
          "Each SPLADE weight is \\(w = \\log(1 + \\mathrm{ReLU}(\\text{logit}))\\): ReLU drops the negatives, the log tames the large ones. Take the query \"river flood\" over a toy vocabulary.",
          ":::calc The literal terms get \\(w_{\\text{river}} = \\log(3.0) = \\mathbf{1.0986}\\) and \\(w_{\\text{flood}} = \\log(3.5) = \\mathbf{1.2528}\\). But two terms you never typed also light up — the **expansion**: \\(w_{\\text{bank}} = \\log(1.5) = \\mathbf{0.4055}\\) and \\(w_{\\text{water}} = \\log(2.2) = \\mathbf{0.7885}\\) (water is the brightest newcomer). The sparse dot with the document rounds each product to four places and sums them: \\(0.9887 + 0.2839 + 0.7517 + 1.0251 = \\mathbf{3.0494}\\). :::",
          "Two things are remarkable. The model assigned weight to *bank* and *water* without seeing them in the query — that is term expansion closing the lexical gap. And the score is still a sparse dot product over shared terms: the same inverted-index arithmetic BM25 uses, with a richer, learned signal.",
        ],
        ru: [
          "Каждый вес SPLADE — это \\(w = \\log(1 + \\mathrm{ReLU}(\\text{логит}))\\): ReLU отбрасывает отрицательные, логарифм усмиряет большие. Возьмём запрос «river flood» по игрушечному словарю.",
          ":::calc Буквальные термины получают \\(w_{\\text{river}} = \\log(3{,}0) = \\mathbf{1{,}0986}\\) и \\(w_{\\text{flood}} = \\log(3{,}5) = \\mathbf{1{,}2528}\\). Но загораются и два термина, которых ты не вводил, — **расширение**: \\(w_{\\text{bank}} = \\log(1{,}5) = \\mathbf{0{,}4055}\\) и \\(w_{\\text{water}} = \\log(2{,}2) = \\mathbf{0{,}7885}\\) (water — самый яркий новичок). Разрежённое скалярное произведение с документом округляет каждое произведение до четырёх знаков и суммирует: \\(0{,}9887 + 0{,}2839 + 0{,}7517 + 1{,}0251 = \\mathbf{3{,}0494}\\). :::",
          "Замечательны две вещи. Модель назначила вес *bank* и *water*, не видя их в запросе, — это расширение терминов закрывает словарный разрыв. И оценка по-прежнему разрежённое скалярное произведение по общим терминам: та же арифметика инвертированного индекса, что у BM25, но с более богатым выученным сигналом.",
        ],
        tt: [
          "Һәр SPLADE авырлыгы — \\(w = \\log(1 + \\mathrm{ReLU}(\\text{логит}))\\): ReLU тискәреләрне ташлый, логарифм зурларны тыя. «river flood» сорауын уенчык сүзлек буенча алыйк.",
          ":::calc Хәрефи терминнар \\(w_{\\text{river}} = \\log(3{,}0) = \\mathbf{1{,}0986}\\) һәм \\(w_{\\text{flood}} = \\log(3{,}5) = \\mathbf{1{,}2528}\\) ала. Әмма син язмаган ике термин да кабына — **киңәйтү**: \\(w_{\\text{bank}} = \\log(1{,}5) = \\mathbf{0{,}4055}\\) һәм \\(w_{\\text{water}} = \\log(2{,}2) = \\mathbf{0{,}7885}\\) (water — иң ачык яңа килүче). Документ белән сирәк скаляр тапкырчыгыш һәр тапкырчыгышны дүрт билгегә кадәр түгәрәкли һәм куша: \\(0{,}9887 + 0{,}2839 + 0{,}7517 + 1{,}0251 = \\mathbf{3{,}0494}\\). :::",
          "Ике нәрсә искиткеч. Модель *bank* һәм *water* ка авырлык билгеләде, аларны сорауда күрмичә — бу термин киңәйтүе лексик араны яба. Һәм балл һаман уртак терминнар буенча сирәк скаляр тапкырчыгыш: BM25 куллана торган шул ук инвертланган индекс арифметикасы, әмма баерак өйрәнелгән сигнал белән.",
        ],
      },
    },
