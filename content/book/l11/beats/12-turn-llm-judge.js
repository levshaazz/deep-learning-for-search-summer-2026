    {
      id: 'turn-llm-judge', kind: 'prose',
      heading: { en: 'The LLM-as-judge', ru: 'LLM в роли судьи', tt: 'LLM хөкемче ролендә' },
      imgPos: 'inline',
      body: {
        en: [
          "If you cannot diff against a gold answer and you want a *holistic* verdict, the modern move is disarmingly direct: **ask another language model to grade it.** The LLM-as-judge (Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*, NeurIPS 2023, arXiv:2306.05685) hands the answer — and a written rubric — to a capable model and asks it to score, or to pick a winner between two candidates. It is fast, cheap, and correlates surprisingly well with human preference on clear-cut cases.",
          "The appeal is obvious: a strong judge model reads the whole answer the way a human grader would, weighing coherence and tone alongside correctness — exactly the holistic judgment RAGAS cannot give. The setup is just a prompt: *here is the question, here is the answer, here is the rubric; return a score per criterion.* No labels, no training, runs at inference time on any answer you can produce.",
          "But the moment you make a model the judge, you have created a **metric to optimise** — and the instant a metric becomes a target, the trickster who has shadowed every measure since Lecture 1 sits up. The LLM-judge is where Goodhart finally gets his courtroom. First, though, let us see the judge working honestly.",
        ],
        ru: [
          "Если нельзя сравнить с золотым ответом, а хочется *холистического* вердикта, современный ход обезоруживающе прям: **попроси другую языковую модель оценить.** LLM-судья (Чжэн и др., *Судим LLM-судью с MT-Bench и Chatbot Arena*, NeurIPS 2023, arXiv:2306.05685) передаёт ответ — и письменную рубрику — способной модели и просит выставить оценку или выбрать победителя между двумя кандидатами. Это быстро, дёшево и на ясных случаях удивительно хорошо коррелирует с человеческим предпочтением.",
          "Привлекательность очевидна: сильная судящая модель читает весь ответ так, как читал бы человек-оценщик, взвешивая связность и тон наряду с верностью — ровно то холистическое суждение, что RAGAS дать не может. Настройка — лишь промпт: *вот вопрос, вот ответ, вот рубрика; верни оценку по каждому критерию.* Ни меток, ни обучения, работает на инференсе над любым ответом, что ты можешь произвести.",
          "Но в тот миг, когда ты делаешь модель судьёй, ты создал **метрику для оптимизации** — а в момент, когда метрика становится целью, трикстер, что тенью идёт за всякой мерой с лекции 1, поднимает голову. LLM-судья — это где Гудхарт наконец получает свой зал суда. Но сперва посмотрим, как судья работает честно.",
        ],
        tt: [
          "Алтын җавап белән чагыштырып булмаса, ә *холистик* хөкем кирәк булса, заманча хәрәкәт коралсызландыргыч туры: **башка тел моделеннән бәяләвен сора.** LLM-хөкемче (Чжэн һ.б., *LLM-хөкемчене MT-Bench һәм Chatbot Arena белән хөкем итү*, NeurIPS 2023, arXiv:2306.05685) җавапны — һәм язма рубриканы — сәләтле моделгә бирә һәм бәя куюын яки ике кандидат арасыннан җиңүчене сайлавын сорый. Бу тиз, арзан һәм ачык очракларда кеше өстенлеге белән гаҗәп яхшы корреляцияли.",
          "Җәлеп итүчелек ачык: көчле хөкем итүче модель бөтен җавапны кеше-бәяләүче укыган кебек укый, дөреслек белән бергә эзлеклелек һәм тонны үлчәп — нәкъ RAGAS бирә алмаган холистик хөкем. Көйләү — бары промпт: *менә сорау, менә җавап, менә рубрика; һәр критерий буенча бәя кайтар.* Билгеләр юк, өйрәтү юк, син ясый алган теләсә кайсы җавап өстендә инференста эшли.",
          "Ләкин син моделне хөкемче иткән мизгелдә син **оптимизацияләр өчен метрика** тудырдың — ә метрика максатка әйләнгән мизгелдә, 1 нче лекциядән бирле һәр үлчәү артыннан күләгә булып барган мутлык иясе башын күтәрә. LLM-хөкемче — Goodhart ниһаять үз хөкем залын алган урын. Ләкин башта хөкемченең намуслы эшләвен карыйк.",
        ],
      },
    },
