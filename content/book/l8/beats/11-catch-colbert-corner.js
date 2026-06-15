    {
      id: 'catch-colbert-corner', kind: 'prose',
      heading: { en: 'Late interaction isn’t free', ru: 'Позднее взаимодействие не бесплатно', tt: 'Соңгы тәэсир итешү бушлай түгел' },
      body: {
        en: [
          "Late interaction is not a free upgrade. A vector per token blows up the index — even compressed, it is bigger than a single-vector store. And searching a multi-vector index is genuinely harder than single-vector nearest-neighbour: PLAID exists precisely because the naive approach does not scale.",
          "So the honest rule: reach for ColBERT when the budget allows and quality matters; otherwise lean on hybrid retrieval (next) or learned sparse, both of which buy much of the gain at a fraction of the cost.",
        ],
        ru: [
          "Позднее взаимодействие — не бесплатное улучшение. Вектор на токен раздувает индекс — даже сжатый, он больше одно-векторного хранилища. А искать по многовекторному индексу действительно сложнее, чем по одному вектору: PLAID существует именно потому, что наивный подход не масштабируется.",
          "Поэтому честное правило: бери ColBERT, когда бюджет позволяет и качество критично; иначе опирайся на гибридный поиск (дальше) или выученную разрежённость — оба дают большую часть выигрыша за долю цены.",
        ],
        tt: [
          "Соңгы тәэсир итешү — бушлай яхшырту түгел. Токенга вектор индексны шештерә — кысылган килеш тә ул бер-векторлы саклагычтан зуррак. Ә күп-векторлы индекс буенча эзләү чыннан да бер вектор буенча эзләүдән катлаулырак: PLAID нәкъ гади ысул масштаблашмаганга бар.",
          "Шуңа намуслы кагыйдә: бюджет рөхсәт иткәндә һәм сыйфат мөһим булганда ColBERT ал; югыйсә гибрид эзләүгә (алда) яки өйрәнелгән сирәклеккә таян — икесе дә отышның күп өлешен бәянең өлешенә бирә.",
        ],
      },
    },
