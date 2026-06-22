    {
      id: 'catch-rerank-depth', kind: 'prose',
      heading: { en: 'There is no free k', ru: 'Бесплатного k не бывает', tt: 'Бушлай k юк' },
      body: {
        en: [
          "How deep do you rerank? The depth \\(k\\) is a dial. Turn it up and the Judges see more of the Scouts&rsquo; output, so they can recover answers buried deeper — but each extra candidate is another cross-encoder pass, and the latency rises roughly linearly with \\(k\\). Turn it down and you are fast but you risk leaving good answers unjudged. There is **no free \\(k\\)**: you pick the shallowest depth that still captures the recall your retriever provides, and trade the rest against your latency budget (your SLA).",
        ],
        ru: [
          'Насколько глубоко переранжировать? Глубина \\(k\\) — это ручка. Покрути вверх — Судьи видят больше из того, что вернули Разведчики, и могут вытащить ответы, зарытые глубже, — но каждый лишний кандидат это ещё один проход кросс-энкодера, и задержка растёт примерно линейно с \\(k\\). Покрути вниз — быстро, но рискуешь оставить хорошие ответы без суда. **Бесплатного \\(k\\) нет**: выбираешь самую мелкую глубину, которая ещё ловит полноту твоего ретривера, а остальное меняешь на бюджет задержки (твой SLA).',
        ],
        tt: [
          'Никадәр тирән кабат тәртипкә саласың? Тирәнлек \\(k\\) — борма. Өскә бор — Судьялар Разведчиклар чыгышын күбрәк күрә, тирәнрәк күмелгән җавапларны кайтара ала — ләкин һәр өстәмә кандидат — тагын бер кросс-энкодер үтеше, вакыт якынча \\(k\\) белән сызыкча үсә. Аска бор — тиз, ләкин яхшы җавапларны судсыз калдыру куркынычы. **Бушлай \\(k\\) юк**: табучың биргән тулылыкны әле дә тота торган иң сай тирәнлекне сайлыйсың, калганын вакыт бюджетыңа (SLA) алмаштырасың.',
        ],
      },
    },
