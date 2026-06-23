    {
      id: 'ance-dynamic', kind: 'prose',
      heading: { en: 'Let the model pick its opponents', ru: 'Пусть модель выбирает противников', tt: 'Модель көндәшләрен үзе сайласын' },
      body: {
        en: [
          "The turn that changed dense retrieval: stop guessing what is hard, and let the **model mine its own**. Index the whole corpus with the current model, retrieve each query's nearest non-positives, and train against *those*. These are the negatives the model actually confuses — and they keep up with it as it improves.",
          "This single idea — approximate-nearest-neighbour negative mining — lifted dense retrievers past strong lexical baselines and made *dynamic* hard negatives the centre of the craft.",
        ],
        ru: [
          "Поворот, изменивший плотный поиск: перестать угадывать, что сложно, и дать **модели майнить самой**. Проиндексируй весь корпус текущей моделью, достань для каждого запроса ближайшие не-позитивы и обучайся против *них*. Это негативы, которые модель действительно путает, — и они поспевают за ней по мере улучшения.",
          "Одна эта идея — майнинг негативов по приближённым ближайшим соседям — подняла плотные ретриверы выше сильных лексических базлайнов и сделала *динамические* сложные негативы сердцем ремесла.",
        ],
        tt: [
          "Тыгыз эзләүне үзгәрткән борылыш: нәрсә катлаулы икәнен фаразлауны туктат, **модель үзе майнласын**. Бөтен корпусны хәзерге модель белән индекслә, һәр сорауга иң якын позитив-булмаганнарны ал һәм *шуларга* каршы өйрән. Болар модель чыннан да буташтырган негативлар — һәм алар модель яхшырган саен аңа иярә.",
          "Бер генә бу фикер — якынча иң якын күршеләр буенча негатив майнинг — тыгыз ретриверларны көчле лексик базлайннардан өскә күтәрде һәм *динамик* катлаулы негативларны һөнәрнең үзәгенә куйды.",
        ],
      },
    },
