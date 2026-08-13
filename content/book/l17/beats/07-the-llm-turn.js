    {
      id: 'the-llm-turn', kind: 'prose',
      heading: { en: 'A quill that has read the world', ru: 'Перо, прочитавшее мир', tt: 'Дөньяны укыган каләм' },
      body: {
        en: [
          "Here is the turn the whole chapter pivots on. PRF was trapped inside the corpus because it had never read anything else. An **LLM has read the web** — millions of documents this archive never held. So when your query lacks the word *under-extraction*, the model does not have to *find* it in the top-\\(k\\); it can simply **supply** it, from everything it absorbed in training. The missing vocabulary is no longer trapped behind the first pass.",
          "The first clean expression of this move is **GAR — Generation-Augmented Retrieval**. Its recipe is disarmingly plain: prompt the model to *generate* helpful context for the query — a likely answer sentence, related entities, a title — and **append** that generated text to the original query before retrieving. The query keeps its own words and gains the archive's words alongside them. Expansion, not replacement.",
          "Mark GAR carefully on the family tree, because it is easy to misfile. GAR is the **antecedent of the expansion branch** — it grows straight into **Query2doc**, which concatenates a generated pseudo-document onto the query for a sparse retriever. It is *not* the ancestor of HyDE. HyDE will make a stranger, sharper move — throw the question away entirely and search with the answer alone — and that is where the next section forges the real blade.",
        ],
        ru: [
          "Вот поворот, вокруг которого разворачивается вся глава. PRF был заперт внутри корпуса, потому что не читал ничего иного. А **LLM прочитала веб** — миллионы документов, которых этот архив никогда не держал. И когда твоему запросу не хватает слова *недоэкстракция*, модели не нужно *искать* его в топ-\\(k\\); она может просто **выдать** его из всего, что впитала при обучении. Недостающий словарь больше не заперт за первым проходом.",
          "Первое чистое выражение этого приёма — **GAR, Generation-Augmented Retrieval** (поиск, усиленный генерацией). Рецепт обезоруживающе прост: попроси модель *сгенерировать* полезный контекст для запроса — вероятное предложение-ответ, связанные сущности, заголовок — и **допиши** этот сгенерированный текст к исходному запросу перед поиском. Запрос сохраняет свои слова и получает рядом слова архива. Расширение, а не замена.",
          "Отметь GAR на генеалогическом древе внимательно — его легко положить не туда. GAR — это **предок ветви расширения**: он прорастает прямо в **Query2doc**, который приклеивает сгенерированный псевдодокумент к запросу для разреженного ретривера. Он *не* предок HyDE. HyDE сделает шаг страннее и острее — выбросит вопрос целиком и будет искать одним лишь ответом, — и именно там следующий раздел выкует настоящий клинок.",
        ],
        tt: [
          "Менә бөтен бүлек әйләнгән борылыш. PRF корпус эчендә бикләнгән иде, чөнки ул бүтән бернәрсә укымады. Ә **LLM вебны укыды** — бу архив беркайчан тотмаган миллионнарча документ. Шуңа күрә синең сорауыңа *under-extraction* сүзе җитмәгәндә, модельгә аны топ-\\(k\\)-да *эзләргә* кирәкми; ул аны, өйрәнгәндә сеңдергән бар нәрсәдән, гади генә **бирә** ала. Җитмәгән сүзлек хәзер беренче узыш артында бикләнмәгән.",
          "Бу алымның беренче саф чагылышы — **GAR, Generation-Augmented Retrieval** (генерация белән көчәйтелгән эзләү). Рецепт гаҗәп гади: модельдән сорау өчен файдалы контекст *генерацияләвен* сора — ихтимал җавап җөмләсен, бәйле объектларны, башлыкны — һәм бу генерацияләнгән текстны эзләр алдыннан башлангыч сорауга **өстә**. Сорау үз сүзләрен саклый һәм янына архив сүзләрен ала. Алыштыру түгел, киңәйтү.",
          "GAR-ны нәсел агачында игътибар белән билгелә — аны ялгыш урынга кую җиңел. GAR — **киңәйтү ботагының атасы**: ул туры **Query2doc**-ка үсеп керә, ул генерацияләнгән псевдо-документны сирәк ретривер өчен сорауга ябыштыра. Ул HyDE-ның атасы *түгел*. HyDE сәеррәк һәм үткенрәк адым ясаячак — сорауны бөтенләй ташлап, бары җавап белән генә эзләячәк, — һәм нәкъ шунда киләсе бүлек чын пычакны сугачак.",
        ],
      },
    },
