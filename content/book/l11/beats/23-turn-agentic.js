    {
      id: 'turn-agentic', kind: 'prose',
      heading: { en: 'The Ship critiques itself', ru: 'Корабль критикует себя', tt: 'Корабль үзен тәнкыйтьли' },
      imgPos: 'inline',
      body: {
        en: [
          "So far the judge has been *external* — a separate model grading the Oracle from outside. The agentic turn folds that judgement back **inside the loop**: instead of generating once and being scored afterward, the Ship retrieves, **grades its own retrieval**, decides whether it has enough, and — if not — retrieves again, rewrites, or reaches outside the corpus. Evaluation stops being a verdict delivered at the end and becomes a *control signal* that steers generation as it happens.",
          "This is the same self-correcting family Lecture 10 previewed with CRAG and Self-RAG, now seen through the lens of evaluation: every one of these methods is, at heart, *a generator that judges itself mid-stream*. The four-metric quad and the LLM-judge gave us the vocabulary — relevance, grounding, is-this-retrieval-good — and the agentic loop wires that vocabulary into the model's own decision-making, turn by turn.",
          "Three methods build the loop, in increasing depth. **ReAct** interleaves reasoning and acting, retrieving on demand across multiple hops. **Self-RAG** trains the model to critique its own retrieval and output with reflection tokens. **CRAG** adds an explicit retrieval-grader that branches on confidence. And **Adaptive-RAG** asks the prior question — whether to retrieve at all. Start with ReAct, because it is the one that turns a passive answerer into an active agent.",
        ],
        ru: [
          "Пока судья был *внешним* — отдельная модель, оценивающая Оракула снаружи. Агентный поворот складывает это суждение обратно **внутрь цикла**: вместо того чтобы сгенерировать раз и быть оценённым после, Корабль извлекает, **оценивает собственное извлечение**, решает, хватает ли ему, и — если нет — извлекает снова, переписывает или тянется вне корпуса. Оценка перестаёт быть вердиктом в конце и становится *управляющим сигналом*, что рулит генерацией по ходу.",
          "Это то же самокорректирующее семейство, что лекция 10 показала с CRAG и Self-RAG, теперь увиденное через призму оценки: каждый из этих методов в сердце — *генератор, который судит себя на лету*. Квадрат из четырёх метрик и LLM-судья дали нам словарь — релевантность, заземление, хорошо-ли-это-извлечение — а агентный цикл вплетает этот словарь в собственное принятие решений модели, ход за ходом.",
          "Три метода строят цикл, по нарастающей глубине. **ReAct** чередует рассуждение и действие, извлекая по требованию через несколько прыжков. **Self-RAG** обучает модель критиковать собственное извлечение и вывод рефлексивными токенами. **CRAG** добавляет явный оценщик извлечения, ветвящийся на уверенности. А **Adaptive-RAG** задаёт предшествующий вопрос — извлекать ли вообще. Начни с ReAct, ведь именно он превращает пассивного отвечающего в активного агента.",
        ],
        tt: [
          "Әлегә хөкемче *тышкы* иде — Оракулны тыштан бәяләүче аерым модель. Агент борылышы бу хөкемне кире **цикл эченә** төри: бер тапкыр генерацияләп аннары бәяләнү урынына, Корабль ала, **үз алуын бәяли**, аңа җитәме дип хәл итә, һәм — юк икән — кабат ала, яңадан яза яки корпус тышына үрелә. Бәяләү ахырда чыгарылган хөкем булудан туктый һәм генерацияне барышында рулльләүче *идарә сигналы* була.",
          "Бу — 10 нчы лекция CRAG һәм Self-RAG белән күрсәткән шул ук үзен-үзе төзәтүче гаилә, хәзер бәяләү призмасы аша күрелгән: бу методларның һәрберсе йөрәгендә — *үзен очышта хөкем итүче генератор*. Дүрт метрика квадраты һәм LLM-хөкемче безгә сүзлек бирде — релевантлык, нигезләнү, бу-алу-яхшымы — ә агент циклы бу сүзлекне модельнең үз карар кабул итүенә, ход саен, үри.",
          "Өч метод циклны төзи, тирәнлеге арта барган тәртиптә. **ReAct** фикер йөртүне һәм гамәлне чиратлаштыра, берничә сикерү аша таләп буенча алып. **Self-RAG** моделне рефлексия токеннары белән үз алуын һәм чыгышын тәнкыйтьләргә өйрәтә. **CRAG** ышанычка тармакланучы ачык алу-бәяләгеч өсти. Ә **Adaptive-RAG** алданрак сорауны бирә — гомумән алыргамы. ReAct тан башла, чөнки нәкъ ул пассив җавап бирүчене актив агентка әйләндерә.",
        ],
      },
    },
