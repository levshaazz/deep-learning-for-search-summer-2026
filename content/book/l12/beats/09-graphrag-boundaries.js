    {
      id: 'graphrag-boundaries', kind: 'prose',
      heading: { en: 'When the graph earns its cost', ru: 'Когда граф окупается', tt: 'Граф үзен аклаганда' },
      body: {
        en: [
          "A graph is powerful — and **expensive** to build and to keep current. Don't reach for one by default. **Reach for GraphRAG when** facts chain across documents (genuine multi-hop), or when the question is corpus-wide — *\"what are the main themes?\"* These are exactly the answers flat retrieval cannot assemble.",
          "**Skip it when** the answer lives in a single passage. Naive RAG from the Oracle is cheaper, simpler, and already correct — a graph would add cost and buy nothing. The **costs** are real: corpus-wide extraction means an LLM call over every document, the graph needs storage, and worst of all it goes **stale** — every corpus update must re-extract and re-link.",
          "The lesson rhymes with the Oracle's applicability rule: **start flat; earn the graph.** Diagnose the question first. If a single passage answers it, you have over-engineered. If the answer is a path no passage holds, the graph has just paid for itself.",
        ],
        ru: [
          "Граф мощен — и **дорог** в построении и поддержании актуальности. Не хватайся за него по умолчанию. **Бери GraphRAG, когда** факты сцеплены через документы (настоящий многошаг), или когда вопрос охватывает весь корпус — *«каковы главные темы?»* Это ровно те ответы, что плоский поиск собрать не может.",
          "**Пропусти его, когда** ответ — в одном отрывке. Наивный RAG из Оракула дешевле, проще и уже верен — граф добавит затрат и ничего не даст. **Издержки** реальны: извлечение по всему корпусу — это вызов LLM на каждый документ, графу нужно хранилище, и хуже всего — он **устаревает**: каждое обновление корпуса требует переизвлечения и пересвязки.",
          "Урок рифмуется с правилом применимости Оракула: **начни плоско; заслужи граф.** Сначала диагностируй вопрос. Если на него отвечает один отрывок — ты переусложнил. Если ответ — путь, которого нет ни в одном отрывке, граф только что окупился.",
        ],
        tt: [
          "Граф көчле — һәм төзергә һәм актуаль тотарга **кыйммәт**. Аңа гадәттәгечә ябышма. **GraphRAG ка мөрәҗәгать ит** фактлар документлар аша чылбырланганда (чын күпадым), яисә сорау бөтен корпусны иңләгәндә — *«төп темалар нинди?»* Болар — нәкъ яссы эзләү җыя алмаган җаваплар.",
          "**Аны калдыр** җавап бер өзектә яшәгәндә. Оракулдан беркатлы RAG арзанрак, гадирәк һәм инде дөрес — граф чыгым өсти һәм бернәрсә бирми. **Чыгымнар** чын: бөтен корпус буйлап тартып алу — һәр документ өчен LLM чакыруы, графка саклагыч кирәк, һәм иң начары — ул **искерә**: корпусның һәр яңартуы яңадан тартып алуны һәм яңадан бәйләүне таләп итә.",
          "Сабак Оракулның кулланучанлык кагыйдәсе белән рифмалаша: **яссыдан башла; графны яулап ал.** Башта сорауны диагностикала. Аңа бер өзек җавап бирсә — син артык катлауландыргансың. Җавап бер өзектә дә булмаган юл булса — граф үзен яңа гына аклады."
        ],
      },
    },
