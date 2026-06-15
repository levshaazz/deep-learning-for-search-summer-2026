    {
      id: 'depth-choosing', kind: 'prose',
      heading: { en: 'When to pick what', ru: 'Что выбрать и когда', tt: 'Кайчан нәрсә сайларга' },
      body: {
        en: [
          "There is no single right architecture — only a tradeoff across latency, memory, domain, and data. If latency and memory are tight, lean on sparse retrieval in an inverted index. If you face domain shift, hybrid (lexical plus dense) covers the gap that either alone leaves. If quality matters and the budget allows, add ColBERT for per-token precision. And if you have graded judgments, put a Learning-to-Rank model on top of all of it.",
          "Hybrid is the sensible default; ColBERT and LTR are quality you buy when the budget and the labels are there. The whole point of this lecture is that these are *allies*, not rivals — and the Standard-Bearer's job is to assemble the right alliance for the job in front of you.",
        ],
        ru: [
          "Единственно верной архитектуры нет — есть лишь компромисс между задержкой, памятью, доменом и данными. Если задержка и память жмут, опирайся на разрежённый поиск в инвертированном индексе. Если у тебя смена домена, гибрид (лексика плюс плотность) закрывает разрыв, который оставляет каждый по отдельности. Если важно качество и бюджет позволяет, добавь ColBERT ради потокенной точности. А если есть размеченные суждения, поставь модель обучения ранжированию поверх всего.",
          "Гибрид — разумный дефолт; ColBERT и LTR — это качество, которое покупаешь, когда есть бюджет и метки. Весь смысл этой лекции в том, что это *союзники*, а не соперники — и задача Знаменосца собрать правильный альянс под задачу перед тобой.",
        ],
        tt: [
          "Бердәнбер дөрес архитектура юк — бары тоткарлык, хәтер, домен һәм мәгълүмат арасында компромисс бар. Тоткарлык һәм хәтер кысса, инвертланган индекстагы сирәк эзләүгә таян. Домен алмашынуы булса, гибрид (лексика плюс тыгызлык) һәрберсе ялгыз калдырган араны яба. Сыйфат мөһим булса һәм бюджет рөхсәт итсә, потокенлы төгәллек өчен ColBERT өст. Ә дәрәҗәле хөкемнәрең булса, барысының өстенә ранжлауга өйрәнү моделен куй.",
          "Гибрид — акыллы дефолт; ColBERT һәм LTR — бюджет һәм билгеләр булганда сатып ала торган сыйфат. Бу лекциянең бөтен мәгънәсе — болар *союздашлар*, көндәшләр түгел — ә Байракчының эше алдыңдагы эш өчен дөрес альянс җыю.",
        ],
      },
    },
