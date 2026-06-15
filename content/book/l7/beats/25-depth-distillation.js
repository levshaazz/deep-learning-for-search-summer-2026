    {
      id: 'depth-distillation', kind: 'prose',
      heading: { en: 'Teach a Scout to think like a Judge', ru: 'Научи Разведчика думать как Судья', tt: 'Разведчикны Судья кебек уйларга өйрәт' },
      body: {
        en: [
          "You can transfer some of the Judge&rsquo;s skill back to the Scout. **Cross-encoder &rarr; bi-encoder distillation** trains the fast bi-encoder to mimic the slow cross-encoder&rsquo;s scores — typically with a **margin-MSE** loss on score *differences*. **TAS-B** (Hofstätter et al. 2021) is a well-known recipe: topic-aware sampling plus dual-teacher distillation. The reranker thus lifts the retriever, not just the final ranking — a forward link to the multi-vector and hybrid retrievers of Lecture 8.",
        ],
        ru: [
          'Часть мастерства Судьи можно передать обратно Разведчику. **Дистилляция кросс-энкодер &rarr; би-энкодер** учит быстрый би-энкодер подражать оценкам медленного кросс-энкодера — обычно лоссом **margin-MSE** на *разностях* оценок. **TAS-B** (Hofstätter и др. 2021) — известный рецепт: выборка с учётом тем плюс дистилляция от двух учителей. Так реранкер подтягивает не только финальное ранжирование, но и сам извлекатель — мост к мультивекторным и гибридным извлекателям Лекции 8.',
        ],
        tt: [
          'Судьяның осталыгының бер өлешен Разведчикка кире тапшырып була. **Кросс-энкодер &rarr; би-энкодер дистилляциясе** тиз би-энкодерны әкрен кросс-энкодер бәяләренә охшарга өйрәтә — гадәттә бәя *аермаларында* **margin-MSE** югалтуы белән. **TAS-B** (Hofstätter һ.б. 2021) — билгеле рецепт: тема-белүчән сайлау плюс ике-укытучы дистилляциясе. Шулай реранкер бары соңгы тәртипне түгел, табучыны да күтәрә — 8 нче лекциянең күп-вектор һәм гибрид табучыларына күпер.',
        ],
      },
    },
