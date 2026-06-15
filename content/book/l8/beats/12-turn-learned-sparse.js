    {
      id: 'turn-learned-sparse', kind: 'prose',
      heading: { en: 'Teaching sparsity to read', ru: 'Научить разрежённость читать', tt: 'Сирәклекне укырга өйрәтү' },
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
