    {
      id: 'turn-learned-sparse', kind: 'prose',
      heading: { en: 'Teaching sparsity to read', ru: 'Научить разрежённость читать', tt: 'Сирәклекне укырга өйрәтү' },
      img: 'L8/L8-02-expanded-banner.png', imgPos: 'scene',
      imgAlt: {
        en: 'Séréga holds up a sparse banner of a few already-lit literal points (the words you typed) and, with a small torch, kindles several faint related points nearby that flicker to life — SPLADE expansion. The emblem grows richer yet stays clearly sparse, with plenty of empty dark space; a hand-lettered label by a new point reads "found these too".',
        ru: 'Серёга поднимает разрежённое знамя из нескольких уже зажжённых буквальных точек (слова, которые ты ввёл) и маленьким факелом разжигает рядом несколько тусклых связанных точек, которые загораются — расширение SPLADE. Эмблема становится богаче, но остаётся явно разрежённой, с большим количеством пустого тёмного пространства; рукописная подпись у новой точки гласит «нашли и эти».',
        tt: 'Серёга берничә инде кабынган хәрефи ноктадан (син язган сүзләр) торган сирәк байрак күтәрә һәм кечкенә факел белән янәшәдәге берничә тонык бәйле ноктаны кабыза, алар яктыра — SPLADE киңәйтүе. Эмблема баерак була, әмма ачык сирәк булып кала, күп буш караңгы урын белән; яңа нокта янындагы кулдан язылган язу «боларны да таптык» дип укыла.',
      },
      body: {
        en: [
          "BM25 (Lecture 3) weighs only the words literally present, with raw term-frequency times inverse document frequency. It is fast and lives in an inverted index — but it has a lexical gap: a query \"river flood\" never lights up \"water\" or \"riverbank\".",
          "What if the sparse weights were **learned**, and the vocabulary could **expand** to related terms — while *staying* in that same inverted index? That is SPLADE: learned sparse retrieval.",
        ],
        ru: [
          "BM25 (лекция 3) взвешивает только буквально присутствующие слова, сырой частотой термина на обратную документную частоту. Это быстро и живёт в инвертированном индексе — но есть лексический разрыв: запрос «river flood» никогда не зажжёт «water» или «riverbank».",
          "А что если веса разрежённого вектора **выучить**, а словарь мог бы **расшириться** на связанные термины — *оставаясь* в том же инвертированном индексе? Это SPLADE: выученный разрежённый поиск.",
        ],
        tt: [
          "BM25 (3 нче лекция) бары хәрефи рәвештә булган сүзләрне генә үлчи, чи термин ешлыгын кире документ ешлыгына тапкырлап. Бу тиз һәм инвертланган индекста яши — әмма лексик ара бар: «river flood» сорауы беркайчан «water» яки «riverbank» ны кабызмый.",
          "Ә сирәк векторның авырлыкларын **өйрәнсәк**, ә сүзлек бәйле терминнарга **киңәя** алса — шул ук инвертланган индекста *калып*? Бу — SPLADE: өйрәнелгән сирәк эзләү.",
        ],
      },
    },
