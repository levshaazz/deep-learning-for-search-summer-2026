    {
      id: 'depth-colbert-storage', kind: 'prose',
      heading: { en: 'The price of detail', ru: 'Цена детали', tt: 'Детальнең бәясе' },
      body: {
        en: [
          "Keeping a vector per token is expensive. On MS MARCO, a naive ColBERT index is about **286 GiB** — a vector for every token of every passage. That is the cost of detail, and it is why early ColBERT was admired but rarely deployed.",
          "The original ColBERT already had a partial fix: reducing the embedding dimension from 128 to 24 and storing each value as a 2-byte float shrinks the index to about **27 GiB** (Khattab & Zaharia 2020, Table 4) — roughly a tenfold reduction. The detail mostly survives; the storage becomes practical. ColBERTv2 pushes this much further with learned compression — the next beat.",
        ],
        ru: [
          "Хранить вектор на токен дорого. На MS MARCO наивный индекс ColBERT — около **286 GiB**: вектор на каждый токен каждого пассажа. Это цена детали, и поэтому ранний ColBERT уважали, но редко разворачивали.",
          "У оригинального ColBERT уже было частичное решение: снизив размерность вложения со 128 до 24 и храня каждое значение как 2-байтовый float, индекс ужимается примерно до **27 GiB** (Khattab & Zaharia 2020, табл. 4) — почти в десять раз. Деталь в основном выживает, хранилище становится практичным. ColBERTv2 идёт гораздо дальше с обучаемым сжатием — в следующем такте.",
        ],
        tt: [
          "Токенга вектор саклау кыйммәт. MS MARCO да ColBERT ның гади индексы — якынча **286 GiB**: һәр пассажның һәр токенына вектор. Бу — детальнең бәясе, һәм шуңа иртә ColBERT ны хөрмәт иттеләр, әмма сирәк урнаштырдылар.",
          "Оригиналь ColBERT та өлешчә чишелеш бар иде: вложение үлчәмен 128 дән 24 кә киметеп һәм һәр кыйммәтне 2-байтлы float итеп саклап, индекс якынча **27 GiB** ка кадәр кыса (Khattab & Zaharia 2020, табл. 4) — якынча ун тапкыр. Детальләр нигездә исән кала, саклагыч практик була. ColBERTv2 өйрәтелә торган кысу белән моны күпкә алга этәрә — киләсе тактта.",
        ],
      },
    },
