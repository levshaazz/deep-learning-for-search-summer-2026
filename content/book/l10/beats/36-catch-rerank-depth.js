    {
      id: 'catch-rerank-depth', kind: 'prose',
      heading: { en: 'There is no free k', ru: 'Бесплатного k не бывает', tt: 'Бушлай k юк' },
      img: 'L7/L7-07-depth-dial.png', imgPos: 'scene',
      imgAlt: {
        en: 'A control dial marked with rerank depth k: turning it up feeds more candidates to the Judges (more recovered answers) while a rising latency gauge tracks the cost — there is no setting that is both deep and free.',
        ru: 'Регулятор с делениями глубины переранжирования k: поворот вверх подаёт Судьям больше кандидатов (больше вытащенных ответов), а растущий индикатор задержки отслеживает цену — нет положения, что глубоко и бесплатно одновременно.',
        tt: 'Кабат тәртипләү тирәнлеге k белән билгеләнгән борма: өскә бору Судьяларга күбрәк кандидат бирә (күбрәк кайтарылган җавап), ә үсүче тоткарлык күрсәткече бәяне күзәтә — тирән дә, бушлай да булган көйләнеш юк.',
      },
      body: {
        en: [
          "How deep do you rerank? The depth \\(k\\) is a dial. Turn it up and the Judges see more of the Scouts&rsquo; output, so they can recover answers buried deeper — but each extra candidate is another cross-encoder pass, and the latency rises roughly linearly with \\(k\\) (GPU batching shrinks the per-pair constant — it does not change the linear growth). Turn it down and you are fast but you risk leaving good answers unjudged. There is **no free \\(k\\)**: you pick the shallowest depth that still captures the recall your retriever provides, and trade the rest against your latency budget (your SLA).",
        ],
        ru: [
          'Насколько глубоко переранжировать? Глубина \\(k\\) — это ручка. Покрути вверх — Судьи видят больше из того, что вернули Разведчики, и могут вытащить ответы, зарытые глубже, — но каждый лишний кандидат — это ещё один проход кросс-энкодера, и задержка растёт примерно линейно с \\(k\\) (батчинг на GPU уменьшает константу на пару — но не меняет линейный рост). Покрути вниз — быстро, но рискуешь оставить хорошие ответы без суда. **Бесплатного \\(k\\) нет**: выбираешь самую мелкую глубину, которая ещё ловит полноту твоего ретривера, а остальное меняешь на бюджет задержки (твой SLA).',
        ],
        tt: [
          'Никадәр тирән кабат тәртипкә саласың? Тирәнлек \\(k\\) — борма. Өскә бор — Судьялар Разведчиклар чыгышын күбрәк күрә, тирәнрәк күмелгән җавапларны кайтара ала — ләкин һәр өстәмә кандидат — тагын бер кросс-энкодер үтеше, вакыт якынча \\(k\\) белән сызыкча үсә (GPU’да төркемләү пар башына константаны кечерәйтә — сызыкча үсешне үзгәртми). Аска бор — тиз, ләкин яхшы җавапларны судсыз калдыру куркынычы. **Бушлай \\(k\\) юк**: табучың биргән тулылыкны әле дә тота торган иң сай тирәнлекне сайлыйсың, калганын вакыт бюджетыңа (SLA) алмаштырасың.',
        ],
      },
    },
