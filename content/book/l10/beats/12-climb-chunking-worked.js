    {
      id: 'climb-chunking-worked', kind: 'prose',
      heading: { en: 'Size, overlap, by hand', ru: 'Размер и перекрытие вручную', tt: 'Зурлык һәм кисешү кул белән' },
      img: 'L10/L10-04-overlap-saves.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Two stacked passes over the same line: the top pass (size 200, no overlap) slices the answer-phrase in half at a hard boundary; the bottom pass uses an overlapping window that catches the whole phrase, and Séréga points at the rescued span.',
        ru: 'Два наложенных прохода по одной строке: верхний (size 200, без перекрытия) рассекает фразу-ответ пополам жёсткой границей; нижний берёт перекрывающее окно, ловящее фразу целиком, и Серёга указывает на спасённый отрезок.',
        tt: 'Бер үк юлдан ике өстәмә үтү: өстәге (size 200, кисешүсез) җавап-фразаны каты чик буенча урталай кисә; астагысы кисешүле тәрәзә ала, ул фразаны бөтен тота, һәм Серёга коткарылган кисәккә күрсәтә.',
      },
      body: {
        en: [
          "Take a \\(1000\\)-token document whose answer lives in tokens \\([380, 470]\\). The chunk count is \\(\\lceil (L - \\text{overlap})/(\\text{size} - \\text{overlap}) \\rceil\\), and \"found\" is **binary answer-containment**: does any one chunk contain the whole span?",
          ":::calc **size=200, overlap=0** → \\(\\lceil 1000/200 \\rceil = \\mathbf{5}\\) chunks, with windows \\([0,200],[200,400],[400,600],\\dots\\) The answer straddles boundary \\(400\\) — \\(20\\) tokens in chunk 2, \\(70\\) in chunk 3 — so no chunk holds it whole: **recall@3 = 0**. **size=200, overlap=50** → \\(\\lceil 950/150 \\rceil = \\mathbf{7}\\) chunks; the window \\([300,500]\\) contains \\([380,470]\\) whole: **recall@3 = 1.0**. :::",
          "Overlap costs storage — more chunks, each fatter — and buys recall: the answer no longer falls between the cracks. That tension is exactly what the frontier, **Late Chunking** (Günther et al., 2024), attacks: it embeds the whole long document first and chunks *after* the transformer, so each chunk embedding still carries the full document's context — no overlap-vs-context tradeoff.",
        ],
        ru: [
          "Возьмём документ на \\(1000\\) токенов, чей ответ лежит в токенах \\([380, 470]\\). Число чанков — \\(\\lceil (L - \\text{overlap})/(\\text{size} - \\text{overlap}) \\rceil\\), а «найдено» — это **бинарное содержание ответа**: содержит ли хоть один чанк весь отрезок целиком?",
          ":::calc **size=200, overlap=0** → \\(\\lceil 1000/200 \\rceil = \\mathbf{5}\\) чанков, окна \\([0,200],[200,400],[400,600],\\dots\\) Ответ рассекается границей \\(400\\) — \\(20\\) токенов в чанке 2, \\(70\\) в чанке 3 — ни один не держит его целиком: **recall@3 = 0**. **size=200, overlap=50** → \\(\\lceil 950/150 \\rceil = \\mathbf{7}\\) чанков; окно \\([300,500]\\) содержит \\([380,470]\\) целиком: **recall@3 = 1,0**. :::",
          "Перекрытие стоит памяти — больше чанков, каждый толще — и покупает recall: ответ больше не проваливается в щель. Именно это напряжение атакует передний край, **Late Chunking** (Günther et al., 2024): он эмбеддит весь длинный документ сначала и нарезает *после* трансформера, так что каждый чанк несёт контекст всего документа — без компромисса перекрытие-против-контекста.",
        ],
        tt: [
          "Җавабы \\([380, 470]\\) токеннарда яткан \\(1000\\) токенлы документ алыйк. Чанклар саны — \\(\\lceil (L - \\text{overlap})/(\\text{size} - \\text{overlap}) \\rceil\\), ә «табылды» — **бинар җавап эченә алу**: бер чанк та бөтен кисәкне эченә алганмы?",
          ":::calc **size=200, overlap=0** → \\(\\lceil 1000/200 \\rceil = \\mathbf{5}\\) чанк, тәрәзәләр \\([0,200],[200,400],[400,600],\\dots\\) Җавап \\(400\\) чиген кисә — \\(20\\) токен 2 нче чанкта, \\(70\\) 3 нчедә — берсе дә аны бөтен тотмый: **recall@3 = 0**. **size=200, overlap=50** → \\(\\lceil 950/150 \\rceil = \\mathbf{7}\\) чанк; \\([300,500]\\) тәрәзәсе \\([380,470]\\) не бөтен эченә ала: **recall@3 = 1,0**. :::",
          "Кисешү хәтер сорый — күбрәк чанк, һәрберсе калынрак — һәм recall сатып ала: җавап бүтән ярыкка төшми. Нәкъ шушы киеренкелеккә алгы чик, **Late Chunking** (Günther et al., 2024), һөҗүм итә: ул башта бөтен озын документны эмбеддлый һәм трансформердан *соң* кисә, шуңа һәр чанк бөтен документ контекстын йөртә — кисешү-каршы-контекст компромиссыннан башка."
        ],
      },
    },
