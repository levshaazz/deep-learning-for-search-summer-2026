    {
      id: 'ragas-boundaries', kind: 'prose',
      heading: { en: 'Where RAGAS stops', ru: 'Где RAGAS останавливается', tt: 'RAGAS кайда туктый' },
      imgPos: 'inline',
      body: {
        en: [
          "RAGAS is automated, reference-free, and decomposed — but it is not magic, and its limits matter before we lean on it. **It runs on a judging model.** Faithfulness and answer relevance are computed by *prompting an LLM* to break claims into pieces and check entailment. That means RAGAS inherits the judge's own blind spots — a weak judge mis-counts supported claims, and the score is only as trustworthy as the model computing it. We will measure exactly this in the LLM-judge section.",
          "**It assumes the question is answerable from the context.** Context recall needs ground-truth claims to check against; for open-ended or subjective questions (*\"write a moving poem about the sea\"*) the whole framing collapses — there is no factual claim to ground. RAGAS is built for **factual, retrieval-grounded** question answering, which is most of search-adjacent RAG but not all of generation.",
          "**And it grades pieces, not the whole.** Decomposition is RAGAS's strength, but a stack of high per-claim scores does not guarantee a *coherent* answer — the metrics say nothing about flow, tone, or whether the pieces fit together into something a human would call good writing. For that holistic judgment we need a different witness, one that reads the whole answer and renders an opinion. Enter the LLM-as-judge — and with it, the trickster who has been waiting since Lecture 1.",
        ],
        ru: [
          "RAGAS автоматизирован, без эталона и разложен — но он не магия, и его пределы важны, прежде чем на него опереться. **Он работает на судящей модели.** Верность и релевантность ответа вычисляются *подсказкой LLM* разбить утверждения на куски и проверить вхождение. Значит RAGAS наследует слепые пятна самого судьи — слабый судья неверно считает поддержанные утверждения, и оценка надёжна ровно настолько, насколько надёжна модель, что её считает. Ровно это мы измерим в разделе про LLM-судью.",
          "**Он предполагает, что вопрос отвечаем из контекста.** Полноте контекста нужны эталонные утверждения для сверки; для открытых или субъективных вопросов (*«напиши трогательное стихотворение о море»*) вся рамка рушится — нет фактического утверждения для заземления. RAGAS построен для **фактического, заземлённого на поиске** ответа на вопрос — это большая часть около-поискового RAG, но не вся генерация.",
          "**И он оценивает куски, а не целое.** Разложение — сила RAGAS, но стопка высоких по-утверждениям оценок не гарантирует *связного* ответа — метрики ничего не говорят о потоке, тоне или о том, складываются ли куски в нечто, что человек назвал бы хорошим письмом. Для этого холистического суждения нужен иной свидетель, что прочтёт весь ответ и вынесет мнение. Входит LLM-судья — а с ним и трикстер, что ждёт с лекции 1.",
        ],
        tt: [
          "RAGAS автоматлаштырылган, эталонсыз һәм таркатылган — ләкин ул сихер түгел, һәм аңа таянганчы аның чикләре мөһим. **Ул хөкем итүче модельдә эшли.** Тугрылык һәм җавап релевантлыгы *LLM ны кисәтеп* раслауларны кисәкләргә ватарга һәм керүне тикшерергә кушу белән исәпләнә. Бу RAGAS хөкемченең үз сукыр тапларын мирас итеп ала дигән сүз — көчсез хөкемче раслаган раслауларны ялгыш саный, ә бәя аны исәпләүче модель никадәр ышанычлы — шуннан ышанычлы. Нәкъ моны без LLM-хөкемче бүлегендә үлчәячәкбез.",
          "**Ул сорау контексттан җавап бирелә ала дип фараз итә.** Контекст тулылыгына чагыштыру өчен эталон раслаулар кирәк; ачык яки субъектив сораулар өчен (*«диңгез турында тәэсирле шигырь яз»*) бөтен кысалар җимерелә — нигезләр өчен фактик раслау юк. RAGAS **фактик, эзләүгә нигезләнгән** сорауга җавап өчен корылган — бу эзләүгә якын RAG ның күп өлеше, ләкин бөтен генерация түгел.",
          "**Һәм ул кисәкләрне бәяли, бөтенне түгел.** Таркату — RAGAS көче, ләкин һәр раслау буенча югары бәяләр өеме *эзлекле* җавапны гарантияләми — метрикалар агым, тон яки кисәкләрнең кеше яхшы язу дип атаган нәрсәгә җыелуы турында бернәрсә әйтми. Бу холистик хөкем өчен башка шаһит кирәк, бөтен җавапны укып фикер бирүче. LLM-хөкемче керә — һәм аның белән 1 нче лекциядән бирле көтеп торган мутлык иясе.",
        ],
      },
    },
