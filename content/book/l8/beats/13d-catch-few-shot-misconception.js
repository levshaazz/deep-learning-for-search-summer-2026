    {
      id: 'catch-few-shot-misconception', kind: 'prose',
      heading: { en: "Few-shot is not learning on the fly", ru: "Few-shot — не обучение на лету", tt: "Few-shot — очып барышлый өйрәнү түгел" },
      body: {
        en: [
          "The phrase “in-context *learning*” sets the trap all by itself: it tempts you to think the model *trains* on the examples in the prompt. It does not. No gradient step happens; not one weight moves. Few-shot is **conditioning**: the examples change only the context on which \\( p(x_t \\mid x_{\\lt t}) \\) is computed — the loom before the prompt and the loom after it are the same machine, bolt for bolt.",
          "The test is simple: if this were learning, something would *stay*. Nothing does — take the examples away, and the behaviour goes with them; every new prompt starts from the same frozen weights. And carry over the companion caution from the decoder-misconception catch: the LM objective is to predict a plausible token, so a convincing few-shot answer is evidence of pattern-matching over the pinned examples, not of “understanding” the task. When the weights genuinely must change — that is fine-tuning, the reader's road, not this one.",
        ],
        ru: [
          "Ловушку ставит само выражение «обучение в контексте»: тянет думать, будто модель *дообучается* на примерах из промпта. Нет. Градиентного шага не происходит; ни один вес не сдвигается. Few-shot — это **conditioning**: примеры меняют только контекст, на котором считается \\( p(x_t \\mid x_{\\lt t}) \\), — станок до промпта и станок после него — одна и та же машина, болт в болт.",
          "Проверка проста: будь это обучением, что-то бы *оставалось*. Не остаётся ничего — убери примеры, и поведение уйдёт вместе с ними; каждый новый промпт начинает с тех же замороженных весов. И удержи парное предостережение из ловушки про декодер: objective языковой модели — предсказать правдоподобный токен, так что убедительный few-shot-ответ — свидетельство подгонки узора под подшитые примеры, а не «понимания» задачи. А когда веса должны действительно поменяться — это дообучение, дорога читателя, не эта.",
        ],
        tt: [
          "Тозакны «контекстта *өйрәнү*» дигән сүзтезмә үзе үк куя: модель промпттагы үрнәкләрдә *өйрәнә* дип уйларга этәрә. Юк. Градиент адымы булмый; бер weight та кузгалмый. Few-shot — **conditioning**: үрнәкләр \\( p(x_t \\mid x_{\\lt t}) \\) исәпләнә торган контекстны гына үзгәртә — промптка кадәрге станок белән аннан соңгысы — болтка болт бер үк машина.",
          "Тикшерү гади: бу өйрәнү булса, нәрсәдер *калыр* иде. Бернәрсә калмый — үрнәкләрне ал, тәртип тә алар белән китә; һәр яңа промпт шул ук туңдырылган weights'тан башлана. Һәм декодер турындагы тозактан пар кисәтүне исеңдә тот: тел моделенең objective'ы — ышандыргыч token фаразлау, шуңа ышандыргыч few-shot җавап — бурычны «аңлау» түгел, ә кыстырылган үрнәкләргә бизәк туры китерү билгесе. Ә weights чыннан да үзгәрергә тиеш булганда — бу fine-tune, укучы юлы, монысы түгел.",
        ],
      },
    },
