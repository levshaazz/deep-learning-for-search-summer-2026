    {
      id: 'hook-lanes', kind: 'prose',
      heading: { en: 'Hyperspace Lanes', ru: 'Гиперпространственные коридоры', tt: 'Гиперкосмик коридорлар' },
      img: 'L9/L9-00-hyperspace-lanes.png', imgPos: 'scene',
      imgAlt: {
        en: 'Séréga at a spaceship console pulls a lever that opens glowing hyperspace lanes across a star-field of document-dots; a vector streaks along a lane.',
        ru: 'Серёга у пульта корабля тянет рычаг, открывающий светящиеся гиперпространственные коридоры через звёздное поле точек-документов; вектор мчится по коридору.',
        tt: 'Серёга корабль пультында рычагны тарта, ул документ-нокталар йолдыз кырыннан балкып торган гиперкосмик коридорларны ача; вектор коридор буйлап чаба.',
      },
      body: {
        en: [
          "You can't fly the whole galaxy star by star. Last lecture the Alliance united sparse and dense retrieval — but the Scouts still **swept linearly** over every vector in the corpus. At a thousand documents that is fine; at a billion it is death. A single query that compares itself to every vector is \\(O(N)\\) work, and \\(N\\) is now the size of the web.",
          "This lecture opens the **lanes**: data structures that reach the nearest neighbours of a query in *milliseconds* instead of scanning everything. Approximate nearest-neighbour search (HNSW, IVF), vector compression (PQ), and the production serving that wraps them. Séréga takes the helm of the Ship's engine room — the part of the Bridge that delivers an order at galaxy scale, forever.",
        ],
        ru: [
          "Нельзя облететь всю галактику звезда за звездой. В прошлой лекции Альянс объединил разрежённый и плотный поиск — но Разведчики всё ещё **сканировали линейно** каждый вектор корпуса. На тысяче документов это нормально; на миллиарде — смерть. Один запрос, сравнивающий себя с каждым вектором, — это \\(O(N)\\) работы, а \\(N\\) теперь размером с веб.",
          "Эта лекция открывает **коридоры**: структуры данных, достающие ближайших соседей запроса за *миллисекунды* вместо сканирования всего. Приближённый поиск ближайших соседей (HNSW, IVF), сжатие векторов (PQ) и продакшн-обвязка вокруг них. Серёга встаёт у штурвала машинного отделения Корабля — той части Мостика, что выдаёт приказ в масштабе галактики, навсегда.",
        ],
        tt: [
          "Бөтен галактиканы йолдыздан йолдызга очып чыгып булмый. Узган лекциядә Альянс сирәк һәм тыгыз эзләүне берләштерде — ләкин Разведчиклар һаман да корпусның һәр векторын **сызыкча сканладылар**. Мең документта бу әйбәт; миллиардта — үлем. Үзен һәр вектор белән чагыштырган бер сорау — бу \\(O(N)\\) эш, ә \\(N\\) хәзер веб зурлыгында.",
          "Бу лекция **коридорларны** ача: сорауның иң якын күршеләрен бар нәрсәне сканлау урынына *миллисекундларда* табучы мәгълүмат структуралары. Якынча иң якын күршеләр эзләве (HNSW, IVF), вектор кысу (PQ) һәм алар тирәсендәге продакшн. Серёга Корабльнең машина бүлеге штурвалына баса — Мостикның масштабта, мәңгегә приказ бирүче өлеше.",
        ],
      },
    },
