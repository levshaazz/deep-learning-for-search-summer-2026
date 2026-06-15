    {
      id: 'catch-cant-cache', kind: 'prose',
      heading: { en: '&ldquo;Just precompute it too&rdquo;', ru: '«Просто предпосчитай и его»', tt: '«Аны да алдан исәплә»' },
      body: {
        en: [
          "The tempting fix: \"if precomputing document vectors made the Scout fast, why not precompute the Judge&rsquo;s scores too?\" You can&rsquo;t. A bi-encoder vector is a property of the **document alone**, so it is the same for every query and caches perfectly. A cross-encoder score is a property of the **pair** \\((q,d)\\) — change the query and the score changes — so there is nothing query-independent to store. That is the deep reason you cannot *retrieve* with a cross-encoder, only *rerank* a shortlist someone else retrieved.",
        ],
        ru: [
          'Соблазнительное решение: «раз предподсчёт векторов документов ускорил Разведчика, почему не предпосчитать и оценки Судьи?» Нельзя. Вектор би-энкодера — свойство **только документа**, он одинаков для любого запроса и кэшируется идеально. Оценка кросс-энкодера — свойство **пары** \\((q,d)\\): смени запрос — сменится и оценка, а значит, хранить нечего: ничего не зависящего от запроса тут нет. Это и есть глубокая причина, почему кросс-энкодером нельзя *извлекать* — только *переранжировать* список, извлечённый кем-то другим.',
        ],
        tt: [
          'Кызыктыргыч чишелеш: «документ векторларын алдан исәпләү Разведчикны тизләткәч, ни өчен Судья бәяләрен дә алдан исәпләмәскә?» Булмый. Би-энкодер векторы — **бары документның** сыйфаты, ул һәр сорау өчен бер үк һәм камил кэшләнә. Кросс-энкодер бәясе — **пар** \\((q,d)\\) сыйфаты: сорауны үзгәрт — бәя үзгәрә — димәк, сакларга сораудан бәйсез бернәрсә юк. Менә шул — кросс-энкодер белән *табып* булмавының, бары кемдер тапкан исемлекне *кабат тәртипкә салу* мөмкинлегенең тирән сәбәбе.',
        ],
      },
    },
