    {
      id: 'ragas-loop-formally', kind: 'prose',
      heading: { en: 'The four metrics, formally', ru: 'Четыре метрики, формально', tt: 'Дүрт метрика, формаль' },
      imgPos: 'inline',
      body: {
        en: [
          "Write the four metrics down once, precisely, before we hand-compute them. Two grade the **answer** against the context; two grade the **context** against the question. Each is a ratio in \\([0,1]\\), so they compose into a single profile rather than a single number — and the *profile* is the point: a RAG system can score high on one and low on another, and which one fails tells you which part of the pipeline to fix.",
          "**Faithfulness** \\(= \\dfrac{\\#\\text{claims supported by context}}{\\#\\text{claims in the answer}}\\) — does the answer *invent* anything the context never said? This is the direct hallucination detector. **Answer relevance** \\(= \\dfrac{1}{n}\\sum_i \\cos(q, \\tilde q_i)\\), where each \\(\\tilde q_i\\) is a question reverse-engineered from the answer — does the answer actually *address* the question, or wander off-topic?",
          "**Context precision** \\(= \\dfrac{1}{\\#\\text{rel}}\\sum_{k:\\,\\text{rel}_k}\\text{precision@}k\\) — are the *relevant* retrieved chunks ranked high, or buried under noise? (This is MAP from Lecture 1, now applied to the retrieved context.) **Context recall** \\(= \\dfrac{\\#\\text{ground-truth claims present in context}}{\\#\\text{ground-truth claims}}\\) — did retrieval bring back *all* the facts the answer needed? The first two audit the generator; the last two audit the retriever. Together they localise blame.",
        ],
        ru: [
          "Выпишем четыре метрики один раз, точно, прежде чем считать руками. Две оценивают **ответ** против контекста; две — **контекст** против вопроса. Каждая — отношение в \\([0,1]\\), поэтому они складываются в единый профиль, а не в одно число — и *профиль* и есть суть: RAG-система может набрать высоко по одной и низко по другой, а то, какая провалилась, говорит, какую часть конвейера чинить.",
          "**Верность (faithfulness)** \\(= \\dfrac{\\#\\text{утверждений, поддержанных контекстом}}{\\#\\text{утверждений в ответе}}\\) — *выдумал* ли ответ что-то, чего контекст не говорил? Это прямой детектор галлюцинаций. **Релевантность ответа** \\(= \\dfrac{1}{n}\\sum_i \\cos(q, \\tilde q_i)\\), где каждый \\(\\tilde q_i\\) — вопрос, обратно восстановленный из ответа, — отвечает ли ответ на вопрос на деле, или уходит в сторону?",
          "**Точность контекста** \\(= \\dfrac{1}{\\#\\text{рел}}\\sum_{k:\\,\\text{rel}_k}\\text{precision@}k\\) — высоко ли ранжированы *релевантные* извлечённые чанки, или погребены под шумом? (Это MAP из лекции 1, теперь над извлечённым контекстом.) **Полнота контекста** \\(= \\dfrac{\\#\\text{эталонных утверждений в контексте}}{\\#\\text{эталонных утверждений}}\\) — принесло ли извлечение *все* факты, что нужны ответу? Первые две проверяют генератор; последние две — поисковик. Вместе они локализуют вину.",
        ],
        tt: [
          "Дүрт метриканы кул белән санаганчы бер тапкыр төгәл язып куйыйк. Икесе **җавапны** контекстка каршы бәяли; икесе **контекстны** сорауга каршы. Һәрберсе \\([0,1]\\) тагы нисбәт, шуңа алар бер сан түгел, ә бер профиль булып җыела — һәм *профиль* — мәгънә: RAG-система берсе буенча югары, икенчесе буенча түбән җыя ала, ә кайсы егылуы пайплайнның кайсы өлешен төзәтергә икәнен әйтә.",
          "**Тугрылык (faithfulness)** \\(= \\dfrac{\\#\\text{контекст раслаган раслаулар}}{\\#\\text{җаваптагы раслаулар}}\\) — җавап контекст әйтмәгән берәр нәрсә *уйлап чыгардымы*? Бу — туры галлюцинация детекторы. **Җавап релевантлыгы** \\(= \\dfrac{1}{n}\\sum_i \\cos(q, \\tilde q_i)\\), биредә һәр \\(\\tilde q_i\\) — җаваптан кире торгызылган сорау — җавап чынлап сорауга *җавап бирәме*, әллә читкә китәме?",
          "**Контекст төгәллеге** \\(= \\dfrac{1}{\\#\\text{рел}}\\sum_{k:\\,\\text{rel}_k}\\text{precision@}k\\) — *релевант* алынган чанклар югары ранжланганмы, әллә шау астында күмелгәнме? (Бу — 1 нче лекциядәге MAP, хәзер алынган контекст өстендә.) **Контекст тулылыгы** \\(= \\dfrac{\\#\\text{контексттагы эталон раслаулар}}{\\#\\text{эталон раслаулар}}\\) — алу җавапка кирәкле *барлык* фактларны кайтардымы? Беренче икесе генераторны тикшерә; соңгы икесе — эзләгечне. Бергә алар гаепне локальләштерә.",
        ],
      },
    },
