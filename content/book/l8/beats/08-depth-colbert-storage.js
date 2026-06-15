    {
      id: 'depth-colbert-storage', kind: 'prose',
      heading: { en: 'The price of detail', ru: 'Цена детали', tt: 'Детальнең бәясе' },
      body: {
        en: [
          "Keeping a vector per token is expensive. On MS MARCO, a naive ColBERT index is about **286 GiB** — a vector for every token of every passage. That is the cost of detail, and it is why early ColBERT was admired but rarely deployed.",
          "The fix is compression: ColBERTv2's residual encoding shrinks the index to about **27 GiB** — roughly a tenfold reduction — by storing each token vector as a nearby centroid plus a tiny residual. The detail survives; the storage becomes practical. How, exactly, is the next beat.",
        ],
        ru: [
          "Хранить вектор на токен дорого. На MS MARCO наивный индекс ColBERT — около **286 GiB**: вектор на каждый токен каждого пассажа. Это цена детали, и поэтому ранний ColBERT уважали, но редко разворачивали.",
          "Решение — сжатие: остаточное кодирование ColBERTv2 ужимает индекс примерно до **27 GiB** — почти в десять раз — храня каждый токенный вектор как близкий центроид плюс крошечный остаток. Деталь выживает, хранилище становится практичным. Как именно — в следующем такте.",
        ],
        tt: [
          "Токенга вектор саклау кыйммәт. MS MARCO да ColBERT ның гади индексы — якынча **286 GiB**: һәр пассажның һәр токенына вектор. Бу — детальнең бәясе, һәм шуңа иртә ColBERT ны хөрмәт иттеләр, әмма сирәк урнаштырдылар.",
          "Чишелеш — кысу: ColBERTv2 ның калдык кодлавы индексны якынча **27 GiB** ка кадәр кыса — якынча ун тапкыр — һәр токен векторын якын центроид плюс кечкенә калдык итеп саклап. Детальләр исән кала, саклагыч практик була. Ничек итеп — киләсе тактта.",
        ],
      },
    },
