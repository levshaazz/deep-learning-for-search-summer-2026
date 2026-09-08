    {
      id: 'turn-rag', kind: 'prose',
      heading: { en: 'Retrieve → augment → generate', ru: 'Извлечь → дополнить → сгенерировать', tt: 'Алу → өстәү → генерацияләү' },
      img: 'L10/L10-02-retrieve-then-speak.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Séréga hands RAGdoll the Oracle a stack of retrieved scrolls; RAGdoll reads them, then speaks a grounded answer — a circular arrow traces the retrieve → augment → generate loop.',
        ru: 'Серёга вручает RAGdoll-Оракулу стопку извлечённых свитков; RAGdoll читает их и затем произносит заземлённый ответ — круговая стрелка обводит цикл извлечь → дополнить → сгенерировать.',
        tt: 'Серёга RAGdoll-Оракулга алынган төргәкләр өемен бирә; RAGdoll аларны укый һәм аннары нигезле җавап әйтә — түгәрәк ук алу → өстәү → генерацияләү циклын сыза.',
      },
      body: {
        en: [
          "RAG is three moves. **Retrieve**: run the query through everything we built (index, embeddings, the cascade, the ANN lanes) and pull the top passages. **Augment**: stuff those passages into the model's prompt as context. **Generate**: the model writes an answer grounded in that context, citing the passages. Retrieval (Lectures 3–9) sits *upstream*; RAG does not replace it, it **consumes** it.",
        ],
        ru: [
          "RAG — это три хода. **Извлечь**: прогнать запрос через всё, что мы построили (индекс, эмбеддинги, каскад, ANN-коридоры), и достать топовые отрывки. **Дополнить**: вставить эти отрывки в промпт модели как контекст. **Сгенерировать**: модель пишет ответ, заземлённый в этом контексте, цитируя отрывки. Поиск (лекции 3–9) стоит *выше по течению*; RAG не заменяет его, а **потребляет**.",
        ],
        tt: [
          "RAG — өч хәрәкәт. **Алу**: сорауны без төзегән бар нәрсә аша (индекс, эмбеддинглар, каскад, ANN-коридорлар) җибәреп, иң яхшы өзекләрне тарт. **Өстәү**: бу өзекләрне модель промптына контекст итеп куй. **Генерацияләү**: модель шул контекстка нигезләнгән җавап яза, өзекләрне цитата итеп. Эзләү (3–9 лекцияләр) *югарырак агымда* тора; RAG аны алмаштырмый, ә **куллана**."
        ],
      },
    },
