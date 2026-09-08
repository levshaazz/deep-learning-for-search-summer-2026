    {
      id: 'when-to-reach', kind: 'prose',
      heading: { en: 'When to reach for what', ru: 'Что брать под задачу', tt: 'Кайсы очракта нәрсә алырга' },
      body: {
        en: [
          "Tie it together. For keyword search on exact terms, use **BM25 with lemmatization** — cheap, transparent, and it fixes the forms. For semantics, synonyms and paraphrase, use a **multilingual dense** encoder — meaning past morphology, no lemmatizer. For a narrow Russian domain, try a **ru-specific** model or fine-tune. For cross-lingual ru↔en, use a **multilingual vector** or LaBSE, one shared space for both languages.",
          "And for production search, the best Russian baseline is neither alone but the **hybrid**: lemmatized BM25 fused with a multilingual dense retriever by RRF (from L12). The lexical arm keeps the exact terms a dense vector blurs — names, product codes, legal citations — while the dense arm carries meaning past the morphology. Two failure modes, two arms, one fused ranking.",
          "None of this is a new architecture. It is the familiar pipeline — tokenizer, BM25, bi-encoder, hybrid — honestly tuned for a language that carries its grammar inside its words.",
        ],
        ru: [
          "Свяжем всё вместе. Для лексического поиска по точным термам — **BM25 с лемматизацией**, дёшево, прозрачно и чинит формы. Для семантики, синонимов и парафраза — **мультиязычный плотный** энкодер, смысл поверх морфологии, без лемматизатора. Для узкого русского домена — **ru-специфичная** модель или дообучение. Для кросс-язычного ru↔en — **мультиязычный вектор** или LaBSE, одно пространство для двух языков.",
          "А для прод-поиска лучшее русское базовое решение — не одно из двух, а **гибрид**: лемматизированный BM25, слитый с мультиязычным плотным ретривером через RRF (из L12). Лексическое плечо держит точные термы, которые плотный вектор размывает — имена, коды, юридические ссылки, — а плотное несёт смысл поверх морфологии. Два режима отказа, два плеча, одно слитое ранжирование.",
          "Ничего из этого не новая архитектура. Это знакомый конвейер — токенизатор, BM25, би-энкодер, гибрид, — честно настроенный под язык, который несёт свою грамматику внутри слов.",
        ],
        tt: [
          "Барысын бергә бәйлик. Төгәл термнар буенча keyword-эзләү өчен — **лемматизация белән BM25**, арзан, ачык һәм формаларны төзәтә. Семантика, синонимнар һәм парафраз өчен — **мультител плотный** энкодер, морфология аша мәгънә, лемматизаторсыз. Тар рус доменда — **ru-специфик** model яки дообучение. Кросс-тел ru↔en өчен — **мультител вектор** яки LaBSE, ике телгә бер уртак киңлек.",
          "Ә прод-эзләү өчен иң яхшы рус baseline — икесеннән берсе түгел, ә **гибрид**: RRF (L12\'дән) аша мультител плотный retriever белән кушылган лемматизацияле BM25. Лексик җилкә плотный вектор юкартучы төгәл термнарны — исемнәр, кодлар, юридик сылтамалар — тота, ә плотный морфология аша мәгънәне йөртә. Ике җимерелү режимы, ике җилкә, бер кушылган ранжирлау.",
          "Боларның һичберсе яңа архитектура түгел. Бу — таныш конвейер — токенизатор, BM25, би-энкодер, гибрид — грамматикасын сүзләре эчендә йөрткән телгә намус белән көйләнгән.",
        ],
      },
    },
