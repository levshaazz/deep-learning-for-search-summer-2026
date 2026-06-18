    {
      id: 'four-metric-decomposition', kind: 'prose',
      heading: { en: 'The four-metric quad', ru: 'Квадрат из четырёх метрик', tt: 'Дүрт метрика квадраты' },
      img: 'L11/L11-02-four-metrics.png', imgPos: 'float-right',
      imgAlt: {
        en: 'The four RAGAS metrics laid out as a two-by-two grid over RAGdoll the Oracle\'s answer — faithfulness and answer relevance grading the generator, context precision and recall grading the retriever; Séréga, in his green tübetey, points at one low panel to localise which stage failed.',
        ru: 'Четыре метрики RAGAS, разложенные сеткой два-на-два поверх ответа Оракула RAGdoll: верность и релевантность ответа оценивают генератор, точность и полнота контекста — поисковик; Серёга в зелёной тюбетейке указывает на одну низкую панель, чтобы локализовать отказавший этап.',
        tt: 'RAGdoll Оракулының җавабы өстенә ике-ике челтәр итеп куелган дүрт RAGAS метрикасы — тугрылык һәм җавап релевантлыгы генераторны, контекст төгәллеге һәм тулылыгы эзләгечне бәяли; яшел түбәтәйле Серёга кайсы этапның егылганын ачыклар өчен бер түбән панельгә күрсәтә.',
      },
      body: {
        en: [
          "Lay the four side by side and the design clicks into place. They form a two-by-two: **answer vs. context** crossed with **what we have vs. what we needed**. Faithfulness and answer relevance grade the *generator* (given this context, did it write a grounded, on-topic answer?); context precision and context recall grade the *retriever* (did it surface the right passages, ranked well, with nothing missing?).",
          "The diagnostic power is in the *combinations*. **Low faithfulness, high everything else** → the retriever did its job but the generator hallucinated; fix the prompt or the model. **High faithfulness, low context recall** → the generator was honest about thin evidence, but retrieval missed facts; fix chunking or query rewriting. **High answer relevance, low faithfulness** → a confident, on-topic, *fabricated* answer — the most dangerous failure, and exactly Confabulous's signature. A single scalar would blur all of these into one mushy \"6.5/10\"; the quad keeps them apart so you know where to operate.",
          "This is why reference-free evaluation is not a compromise but an upgrade: it does not just tell you *whether* the system is good, it tells you *which component* to blame. That decomposition is the whole reason RAGAS earned its place as the first witness — but, as the next beat warns, the witness has limits of its own.",
        ],
        ru: [
          "Положи четыре рядом — и замысел встаёт на место. Они образуют два-на-два: **ответ против контекста**, скрещённое с **что у нас есть против того, что было нужно**. Верность и релевантность ответа оценивают *генератор* (по этому контексту написал ли он заземлённый ответ по теме?); точность и полнота контекста оценивают *поисковик* (вынес ли он нужные отрывки, хорошо ранжированные, ничего не упустив?).",
          "Диагностическая сила — в *комбинациях*. **Низкая верность, всё остальное высоко** → поисковик сделал работу, но генератор галлюцинировал; чини промпт или модель. **Высокая верность, низкая полнота контекста** → генератор был честен о тонких доказательствах, но извлечение упустило факты; чини нарезку или переписывание запроса. **Высокая релевантность ответа, низкая верность** → уверенный, по теме, *выдуманный* ответ — опаснейший отказ, и ровно подпись Конфабулуса. Один скаляр размазал бы всё это в одно кашеобразное «6,5/10»; квадрат держит их врозь, чтобы ты знал, где оперировать.",
          "Вот почему оценка без эталона — не компромисс, а апгрейд: она не просто говорит, *хороша* ли система, она говорит, *какой компонент* винить. Это разложение — вся причина, по которой RAGAS заслужил место первого свидетеля — но, как предупреждает следующий бит, у свидетеля есть и собственные пределы.",
        ],
        tt: [
          "Дүртне янәшә куй — һәм уй урынына утыра. Алар ике-ике хасил итә: **җавапка каршы контекст**, **бездә булганга каршы кирәк булган** белән кисешкән. Тугрылык һәм җавап релевантлыгы *генераторны* бәяли (бу контекст белән ул нигезле, тема буенча җавап яздымы?); контекст төгәллеге һәм тулылыгы *эзләгечне* бәяли (ул кирәкле өзекләрне яхшы ранжланган, бернәрсә калдырмыйча чыгардымы?).",
          "Диагностик көч — *комбинацияләрдә*. **Түбән тугрылык, калганы югары** → эзләгеч эшен башкарды, ләкин генератор галлюцинацияләде; промптны яки модельне төзәт. **Югары тугрылык, түбән контекст тулылыгы** → генератор нечкә дәлилләр турында намуслы булды, ләкин алу фактларны калдырды; кисүне яки сорауны яңадан язуны төзәт. **Югары җавап релевантлыгы, түбән тугрылык** → ышанычлы, тема буенча, *уйлап чыгарылган* җавап — иң куркыныч егылу, һәм нәкъ Конфабулус имзасы. Бер скаляр боларның барысын да бер ботка «6,5/10» итеп болгатыр иде; квадрат аларны аерым тота, син кайда эшләргә икәнен белсен өчен.",
          "Шуңа эталонсыз бәяләү — компромисс түгел, ә яхшырту: ул бары система *яхшымы* дип кенә әйтми, ул *кайсы компонентны* гаепләргә икәнен әйтә. Бу таркату — RAGAS беренче шаһит урынын яулауының бөтен сәбәбе — ләкин, киләсе бит кисәткәнчә, шаһитнең үз чикләре дә бар.",
        ],
      },
    },
