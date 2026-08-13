    {
      id: 'climb-colbert-worked', kind: 'prose',
      heading: { en: 'MaxSim, by hand', ru: 'MaxSim вручную', tt: 'MaxSim кул белән' },
      body: {
        en: [
          "MaxSim is the score: for every query token, take its maximum cosine over the document tokens, then sum those maxes. Take the query *(river, bank, flood)* against the relevant document \"the riverside plain flooded\" and the irrelevant \"the bank approved a loan\".",
          ":::calc For the relevant doc the row-maxes are \\(0.90, 0.50, 0.95\\), so \\(\\text{MaxSim} = 0.90 + 0.50 + 0.95 = \\mathbf{2.35}\\). For the lexical-trap doc, \"bank\" matches almost perfectly \\((0.98)\\) but \"river\" and \"flood\" find no partner \\((0.20, 0.12)\\), so \\(\\text{MaxSim} = 0.20 + 0.98 + 0.12 = \\mathbf{1.30}\\). Since \\(\\mathbf{2.35} \\gt \\mathbf{1.30}\\), the relevant doc wins — **BAM**. :::",
          "That is the whole lesson of late interaction. A single near-perfect match (\"bank\" at \\(0.98\\)) is not enough: MaxSim rewards matching *many* query tokens, each to its best partner. The lexical trap that fools a keyword search is defeated.",
        ],
        ru: [
          "MaxSim — это оценка: для каждого токена запроса берём его максимальный косинус по токенам документа, затем суммируем максимумы. Возьмём запрос *(river, bank, flood)* против релевантного документа «the riverside plain flooded» и нерелевантного «the bank approved a loan».",
          ":::calc Для релевантного документа построчные максимумы — \\(0{,}90, 0{,}50, 0{,}95\\), поэтому \\(\\text{MaxSim} = 0{,}90 + 0{,}50 + 0{,}95 = \\mathbf{2{,}35}\\). Для документа-ловушки «bank» совпадает почти идеально \\((0{,}98)\\), но «river» и «flood» не находят пары \\((0{,}20, 0{,}12)\\), поэтому \\(\\text{MaxSim} = 0{,}20 + 0{,}98 + 0{,}12 = \\mathbf{1{,}30}\\). Так как \\(\\mathbf{2{,}35} \\gt \\mathbf{1{,}30}\\), релевантный документ выигрывает — **BAM**. :::",
          "В этом и весь смысл позднего взаимодействия. Одного почти идеального совпадения («bank» при \\(0{,}98\\)) недостаточно: MaxSim награждает совпадение *многих* токенов запроса, каждого со своим лучшим партнёром. Лексическая ловушка, которая обманывает поиск по ключевым словам, побеждена.",
        ],
        tt: [
          "MaxSim — бу балл: һәр сорау токены өчен документ токеннары буенча аның максималь косинусын алабыз, аннары максимумнарны кушабыз. *(river, bank, flood)* сорауын релевант «the riverside plain flooded» документына һәм релевант булмаган «the bank approved a loan» документына каршы алыйк.",
          ":::calc Релевант документ өчен юл максимумнары — \\(0{,}90, 0{,}50, 0{,}95\\), шуңа \\(\\text{MaxSim} = 0{,}90 + 0{,}50 + 0{,}95 = \\mathbf{2{,}35}\\). Капкын-документта «bank» диярлек камил туры килә \\((0{,}98)\\), әмма «river» һәм «flood» пар тапмый \\((0{,}20, 0{,}12)\\), шуңа \\(\\text{MaxSim} = 0{,}20 + 0{,}98 + 0{,}12 = \\mathbf{1{,}30}\\). \\(\\mathbf{2{,}35} \\gt \\mathbf{1{,}30}\\) булганга, релевант документ җиңә — **BAM**. :::",
          "Соңгы тәэсир итешүнең бөтен мәгънәсе шунда. Бер диярлек камил туры килү (\\(0{,}98\\) дә «bank») җитми: MaxSim *күп* сорау токены туры килүен бүләкли, һәрберсен үзенең иң яхшы партнёры белән. Төп сүзләр эзләвен алдый торган лексик капкын җиңелә.",
        ],
      },
    },
