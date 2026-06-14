    {
      id: 'depth-data-prep', kind: 'prose',
      heading: { en: 'Offline: data preparation', ru: 'Офлайн: подготовка данных', tt: 'Офлайн: мәгълүмат әзерләү' },
      body: {
        en: [
          "Before any query, a heavy **offline** stage prepares the corpus. **Clean and deduplicate** — near-duplicates crowd the top of the ranking. **Chunk** long documents under the encoder's token limit, typically **512–1024 tokens with 10–20% overlap** so a fact is never cut at a boundary.",
          "And **expand**: doc2query (docTTTTTquery) generates the queries a passage would answer and appends them *before* indexing, lifting MS MARCO MRR@10 from **18.6 to 27.2** by pushing the neural work to index time. Retrieval quality is capped right here — garbage in, garbage in the index.",
        ],
        ru: [
          'До любого запроса тяжёлая **офлайн**-стадия готовит корпус. **Чистка и дедуп** — близкие дубли забивают верх выдачи. **Чанкинг** длинных документов под лимит токенов энкодера, обычно **512–1024 токена с перекрытием 10–20%**, чтобы факт не разорвало на границе.',
          'И **расширение**: doc2query (docTTTTTquery) генерирует запросы, на которые отвечает отрывок, и дописывает их *до* индексации, поднимая MS MARCO MRR@10 с **18.6 до 27.2**, перенося нейро-работу на время индексации. Качество поиска ограничивается уже здесь — мусор на входе, мусор в индексе.',
        ],
        tt: [
          'Теләсә кайсы сорауга кадәр авыр **офлайн** этап корпусны әзерли. **Чистарту һәм дедуп** — якын дубльлар чыгарылышның өстен бутый. Озын документларны энкодерның токен чигеннән кыска **чанклау**, гадәттә **512–1024 токен, 10–20% капланыш белән**, факт чиктә киселмәсен өчен.',
          'Һәм **киңәйтү**: doc2query (docTTTTTquery) өзек җавап бирәчәк сорауларны ясый һәм аларны индекслаудан *алда* өсти, MS MARCO MRR@10\'ны **18.6\'дан 27.2\'гә** күтәрә, нейро-эшне индекслау вакытына күчереп. Эзләү сыйфаты нәкъ менә шунда чикләнә — чүп керсә, индекста чүп.',
        ],
      },
    },
