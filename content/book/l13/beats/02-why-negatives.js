    {
      id: 'why-negatives', kind: 'prose',
      heading: { en: 'Why opponents at all?', ru: 'Зачем вообще противники?', tt: 'Гомумән, көндәшләр нигә?' },
      body: {
        en: [
          "A dense retriever maps a query and its true passage to nearby points and everything else far away. Training pulls the query toward its **positive** \\(d^+\\) and pushes it away from **negatives** \\(d^-\\).",
          "Drop the push and the model cheats: it can shrink the whole space to a single point, where every passage is equally close and the loss looks great. Negatives are the only force stopping that collapse. They are not a detail of training — they *are* the training signal that gives the space its shape.",
        ],
        ru: [
          "Плотный ретривер отображает запрос и его истинный пассаж в близкие точки, а всё остальное — далеко. Обучение притягивает запрос к его **позитиву** \\(d^+\\) и отталкивает от **негативов** \\(d^-\\).",
          "Убери отталкивание — и модель схитрит: она может стянуть всё пространство в одну точку, где каждый пассаж одинаково близок, а потеря выглядит прекрасно. Негативы — единственная сила, удерживающая от этого схлопывания. Это не деталь обучения — это *и есть* сигнал, придающий пространству форму.",
        ],
        tt: [
          "Тыгыз ретривер сорауны һәм аның чын пассажын якын нокталарга, ә калганын ераккка сала. Өйрәтү сорауны аның **позитивына** \\(d^+\\) тарта һәм **негативлардан** \\(d^-\\) этә.",
          "Этүне алып ташла — модель хәйләли: ул бөтен киңлекне бер ноктага җыя ала, анда һәр пассаж бертигез якын, ә югалту бик яхшы күренә. Негативлар — бу җыелудан тоткарлый торган бердәнбер көч. Бу өйрәтүнең вак детале түгел — бу киңлеккә форма бирә торган сигнал үзе.",
        ],
      },
    },
