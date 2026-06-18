    {
      id: 'problem-no-gold', kind: 'prose',
      heading: { en: 'No gold answer, and fluent is not correct', ru: 'Нет золотого ответа, и беглый — не значит верный', tt: 'Алтын җавап юк, ә шома — дөрес дигән сүз түгел' },
      imgPos: 'inline',
      body: {
        en: [
          "Two facts break every classical metric at once. **First: there is no gold answer.** In ranking we held a labelled relevance judgment for each document and scored the system against it. A generated paragraph has no single correct string — paraphrase, ordering, level of detail, and citation style all vary while the answer stays correct. You cannot diff the model's output against a key that does not exist.",
          "**Second: fluent is not correct.** A language model is, above all, a fluency engine — it will produce smooth, grammatical, confident prose for a true claim and a false one alike. The surface signal you would naively trust (does it read well? does it sound sure?) is exactly the signal the model optimises *regardless of truth*. So the two things we actually care about — **is the answer grounded in real evidence?** and **does it address the question?** — are invisible to any metric that only looks at the words.",
          "The way out is to stop demanding one gold string and instead **decompose** the answer into checkable pieces and grade each against the evidence we *do* have: the retrieved context, and the question itself. That is the idea behind RAGAS — and behind every honest courtroom: you do not ask the witness *\"are you telling the truth?\"*; you cross-examine the claims one by one.",
        ],
        ru: [
          "Два факта разом ломают всякую классическую метрику. **Первый: нет золотого ответа.** В ранжировании мы держали размеченное суждение о релевантности на каждый документ и оценивали систему против него. У сгенерированного абзаца нет единственной верной строки — перефраз, порядок, уровень детализации и стиль цитат варьируются, а ответ остаётся верным. Нельзя сравнить вывод модели с ключом, которого не существует.",
          "**Второй: беглый — не значит верный.** Языковая модель — прежде всего машина беглости: она выдаст гладкую, грамотную, уверенную прозу и для истинного утверждения, и для ложного. Поверхностный сигнал, которому ты наивно доверился бы (хорошо ли читается? звучит ли уверенно?), — ровно тот сигнал, что модель оптимизирует *независимо от истины*. Поэтому две вещи, что нас на деле волнуют, — **заземлён ли ответ в реальных доказательствах?** и **отвечает ли он на вопрос?** — невидимы любой метрике, что смотрит лишь на слова.",
          "Выход — перестать требовать одну золотую строку и вместо этого **разложить** ответ на проверяемые куски и оценить каждый против тех доказательств, что у нас *есть*: извлечённого контекста и самого вопроса. Это и есть идея RAGAS — и идея всякого честного суда: ты не спрашиваешь свидетеля *«говоришь ли ты правду?»*; ты допрашиваешь утверждения одно за другим.",
        ],
        tt: [
          "Ике факт берьюлы һәр классик метриканы җимерә. **Беренче: алтын җавап юк.** Ранжлауда без һәр документка билгеле релевантлык хөкемен тоттык һәм системаны аңа каршы бәяләдек. Генерацияләнгән абзацның бер генә дөрес юлы юк — парафраз, тәртип, детальләштерү дәрәҗәсе һәм цитата стиле үзгәрә, ә җавап дөрес кала. Модель чыгарганын булмаган ачкыч белән чагыштырып булмый.",
          "**Икенче: шома — дөрес дигән сүз түгел.** Тел моделе — иң элек шомалык машинасы: ул чын раслау өчен дә, ялган өчен дә шома, грамоталы, ышанычлы проза чыгарачак. Син беркатлы рәвештә ышаныр идең торган өслек сигналы (яхшы укыламы? ышанычлы яңгырыймы?) — нәкъ модель *хакыйкатькә карамастан* оптимизацияли торган сигнал. Шуңа безне чынлап борчый торган ике нәрсә — **җавап чын дәлилләргә нигезләнгәнме?** һәм **ул сорауга җавап бирәме?** — сүзләргә генә караган теләсә кайсы метрикага күренми.",
          "Чыгу юлы — бер алтын юл таләп итүне туктатып, аның урынына җавапны тикшереп була торган кисәкләргә **таркат** һәм һәрберсен бездә *булган* дәлилләргә каршы бәялә: алынган контекст һәм сорауның үзенә. Бу — RAGAS идеясе, һәм һәр намуслы хөкемнең идеясе: син шаһиттан *«син дөресен сөйлисеңме?»* дип сорамыйсың; син раслауларны бер-бер артлы тикшерәсең.",
        ],
      },
    },
