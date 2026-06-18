    {
      id: 'problem-single-hop', kind: 'prose',
      heading: { en: 'A bag of chunks has no edges', ru: 'У мешка чанков нет рёбер', tt: 'Чанклар капчыгында кырлар юк' },
      body: {
        en: [
          "Why does the Oracle fail here? Because naive RAG treats the corpus as a **flat bag** of independent passages. Embed the query, take the top-\\(k\\) chunks by cosine, stuff them into the prompt, generate — the whole loop from the Oracle. Nowhere in that loop is there a notion of *which entity appears in which document*, or that two documents might be **linked**.",
          "Ask *\"what field did the founder study?\"* and the single best chunk — \\(d_1\\), which names the founder — never mentions the field. The field is one hop away, in \\(d_2\\). Flat retrieval stops at \\(d_1\\) and **misses it entirely**. The question is not a passage you can find; it is a **path** you must walk: company → founder → field. To answer, the corpus must be *navigable*, not merely searchable.",
          "Two failures, two frontiers. When the answer is a chain across documents, build a **graph** of entities and relations and walk it (GraphRAG). When the record is not text at all — an image, a scanned page — search in a **shared multimodal space**. And once the Ship can answer the deepest questions, it must answer them **responsibly**. Three frontiers; one deep field.",
        ],
        ru: [
          "Почему Оракул здесь терпит неудачу? Потому что наивный RAG обращается с корпусом как с **плоским мешком** независимых отрывков. Заэмбедь запрос, возьми топ-\\(k\\) чанков по косинусу, вложи их в промпт, сгенерируй — весь цикл Оракула. Нигде в этом цикле нет понятия о том, *какая сущность в каком документе*, или что два документа могут быть **связаны**.",
          "Спроси *«какую область изучал основатель?»* — и единственный лучший чанк, \\(d_1\\), называющий основателя, ни словом не упоминает область. Область — в одном прыжке, в \\(d_2\\). Плоский поиск останавливается на \\(d_1\\) и **полностью её упускает**. Вопрос — не отрывок, который можно найти; это **путь**, который надо пройти: компания → основатель → область. Чтобы ответить, корпус должен быть *проходимым*, а не просто искомым.",
          "Две неудачи, два фронтира. Когда ответ — цепочка через документы, построй **граф** сущностей и отношений и пройди его (GraphRAG). Когда запись вовсе не текст — изображение, скан страницы — ищи в **общем мультимодальном пространстве**. И как только Корабль сможет отвечать на глубочайшие вопросы, он должен отвечать на них **ответственно**. Три фронтира; одно глубокое поле.",
        ],
        tt: [
          "Ни өчен Оракул монда җиңелә? Чөнки беркатлы RAG корпус белән бәйсез өзекләрнең **яссы капчыгы** кебек эш итә. Сорауны эмбеддла, косинус буенча иң яхшы \\(k\\) чанкны ал, аларны промптка тутыр, генерациялә — Оракулның бөтен циклы. Бу циклда беркайда да *кайсы берәмлек кайсы документта* икәнен яисә ике документ **бәйле** булырга мөмкинлеген аңлау юк.",
          "*«Нигезләүче нинди өлкә укыган?»* дип сора — һәм бердәнбер иң яхшы чанк, нигезләүчене атаган \\(d_1\\), өлкә турында бер сүз дә әйтми. Өлкә — бер адым ераклыкта, \\(d_2\\) дә. Яссы эзләү \\(d_1\\) дә туктый һәм аны **бөтенләй ычкындыра**. Сорау — табып була торган өзек түгел; ул — үтәргә кирәкле **юл**: компания → нигезләүче → өлкә. Җавап бирер өчен корпус *үтемле* булырга тиеш, тик эзләнә торган гына түгел.",
          "Ике җиңелү, ике фронтир. Җавап документлар аша чылбыр булганда, берәмлекләр һәм мөнәсәбәтләр **графын** төзе һәм аны үт (GraphRAG). Язма бөтенләй текст булмаганда — рәсем, сканланган бит — **уртак мультимодаль киңлектә** эзлә. Һәм Корабль иң тирән сорауларга җавап бирә алгач, ул аларга **җаваплы** җавап бирергә тиеш. Өч фронтир; бер тирән кыр."
        ],
      },
    },
