    {
      id: 'depth-gpt-line', kind: 'prose',
      heading: { en: "One recipe, growing scale, a new interface", ru: "Один рецепт, растущий масштаб, новый интерфейс", tt: "Бер рецепт, үсә торган масштаб, яңа интерфейс" },
      body: {
        en: [
          "The GPT line is one recipe repeated with more of everything: a decoder-only loom trained on a mountain of raw text with the plainest objective there is — \\( \\mathcal{L}_{\\text{LM}} = -\\sum_t \\log p_\\theta(x_t \\mid x_{\\lt t}) \\). The first GPT proved the recipe: pretrain the forward loom, then *fine-tune* it for each task with a light head on top — the gears still re-tuned per job. GPT-2, grown much larger, showed something stranger: phrase the task *inside the prompt itself*, and the loom solves it **zero-shot** — with no per-task tuning at all. GPT-3, larger again, added the last step: show a few examples in the prompt, and it picks the pattern up **few-shot**.",
          "Hold on to what actually changed along that line — and what didn't. The weave never changed: the loom writes forward, one thread at a time, from the first GPT to the last. What changed is the **interface**: from “pretrain, then re-tune the gears for every job” to “pretrain once, and *state the job in words*”. Scale did not build a new machine; it made the old machine answer to language.",
        ],
        ru: [
          "Линейка GPT — один рецепт, повторённый со всё большим размахом: decoder-only станок, обученный на горе сырого текста с самым простым objective на свете — \\( \\mathcal{L}_{\\text{LM}} = -\\sum_t \\log p_\\theta(x_t \\mid x_{\\lt t}) \\). Первый GPT доказал рецепт: предобучи прямой станок, затем *дообучи* под каждую задачу с лёгкой головой сверху — шестерни всё ещё перенастраиваются под работу. GPT-2, выросший заметно крупнее, показал нечто более странное: сформулируй задачу *прямо в промпте* — и станок решает её **zero-shot**, вовсе без настройки под задачу. GPT-3, ещё крупнее, добавил последний шаг: покажи в промпте несколько примеров — и он подхватывает узор **few-shot**.",
          "Удержи главное: что менялось вдоль линейки — и что нет. Переплёт не менялся: станок пишет вперёд, по одной нити, от первого GPT до последнего. Менялся **интерфейс**: от «предобучи, потом перенастраивай шестерни под каждую работу» — к «предобучи один раз и *назови работу словами*». Масштаб не построил новую машину; он заставил старую отзываться на язык.",
        ],
        tt: [
          "GPT линиясе — һәрнәрсәнең күбрәге белән кабатланган бер рецепт: чи текст тавында иң гади objective белән өйрәтелгән decoder-only станок — \\( \\mathcal{L}_{\\text{LM}} = -\\sum_t \\log p_\\theta(x_t \\mid x_{\\lt t}) \\). Беренче GPT рецептны исбатлады: алга станокны алдан өйрәт, аннары һәр бурычка өстенә җиңел баш куеп *fine-tune* яса — тешләр һаман эшкә карап яңадан көйләнә. GPT-2, шактый зурайганы, сәеррәк нәрсә күрсәтте: бурычны *промптның үзендә* әйт — һәм станок аны **zero-shot** чишә, бурычка көйләүсез. GPT-3, тагын да зуррагы, соңгы адымны өстәде: промптта берничә үрнәк күрсәт — һәм ул бизәкне **few-shot** эләктереп ала.",
          "Иң мөһимен тот: линия буенча нәрсә үзгәрде — һәм нәрсә юк. Туку үзгәрмәде: станок беренче GPT'дан соңгысына кадәр алга, берәр җеп яза. **Интерфейс** үзгәрде: «алдан өйрәт, аннары һәр эшкә тешләрне яңадан көйлә» дигәннән — «бер тапкыр алдан өйрәт тә *эшне сүзләр белән әйт*» дигәнгә. Масштаб яңа машина төземәде; ул иске машинаны телгә җавап бирергә өйрәтте.",
        ],
      },
    },
