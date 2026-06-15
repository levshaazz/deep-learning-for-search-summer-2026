    {
      id: 'depth-splade-vs-bm25', kind: 'prose',
      heading: { en: 'SPLADE vs BM25', ru: 'SPLADE против BM25', tt: 'SPLADE BM25 га каршы' },
      body: {
        en: [
          "Lay them side by side. BM25 weights are raw term-frequency times IDF, over literal terms only. SPLADE weights are learned, \\(\\log(1 + \\mathrm{ReLU})\\), and the vocabulary is expanded with related terms the model judged relevant. Both write into the *same* inverted index, so both retrieve with the same fast posting-list machinery.",
          "The difference is the signal. BM25 cannot know that \"flood\" implies \"water\"; SPLADE learned it from data and spends a posting on it. That is the whole pitch of learned sparse: a neural signal, in a classical engine.",
        ],
        ru: [
          "Поставим их рядом. Веса BM25 — сырая частота термина на IDF, только по буквальным терминам. Веса SPLADE — выученные, \\(\\log(1 + \\mathrm{ReLU})\\), а словарь расширен связанными терминами, которые модель сочла релевантными. Оба пишут в *тот же* инвертированный индекс, поэтому оба ищут той же быстрой машинерией постинг-листов.",
          "Разница — в сигнале. BM25 не может знать, что «flood» подразумевает «water»; SPLADE выучил это из данных и тратит на это постинг. В этом весь смысл выученной разрежённости: нейронный сигнал в классическом движке.",
        ],
        tt: [
          "Аларны янәшә куйыйк. BM25 авырлыклары — чи термин ешлыгын IDF га тапкырлау, бары хәрефи терминнар буенча. SPLADE авырлыклары — өйрәнелгән, \\(\\log(1 + \\mathrm{ReLU})\\), ә сүзлек модель релевант дип санаган бәйле терминнар белән киңәйтелгән. Икесе дә *шул ук* инвертланган индекска яза, шуңа икесе дә шул ук тиз постинг-исемлек машинасы белән эзли.",
          "Аерма — сигналда. BM25 «flood» «water» ны аңлата дип белә алмый; SPLADE моны мәгълүматтан өйрәнгән һәм аңа постинг сарыф итә. Өйрәнелгән сирәклекнең бөтен мәгънәсе шунда: классик двигательдә нейрон сигнал.",
        ],
      },
    },
