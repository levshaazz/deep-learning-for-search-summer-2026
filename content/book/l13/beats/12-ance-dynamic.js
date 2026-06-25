    {
      id: 'ance-dynamic', kind: 'prose',
      heading: { en: 'Let the model pick its opponents', ru: 'Пусть модель выбирает противников', tt: 'Модель көндәшләрен үзе сайласын' },
      img: 'L13/L13-07-mirror-opponent.png', imgPos: 'mascot',
      imgAlt: {
        en: "Séréga sparring against a mirror image of himself — the model mining its own hardest opponents from its current index, an opponent that grows as the fighter grows.",
        ru: "Серёга спаррингует против собственного зеркального отражения — модель добывает самых трудных противников из своего же текущего индекса, и противник растёт вместе с бойцом.",
        tt: "Серёга үзенең көзге чагылышына каршы спарринг ясый — модель үзенең хәзерге индексыннан иң авыр көндәшләрен казып ала, һәм көндәш көрәшче белән бергә үсә.",
      },
      imgCaption: {
        en: "Let the model pick its own opponents: ANCE mines the hardest negatives from the live index, so they sharpen as the model improves.",
        ru: "Пусть модель сама выбирает противников: ANCE добывает самые трудные негативы из живого индекса, и они становятся острее по мере роста модели.",
        tt: "Модель үз көндәшләрен үзе сайласын: ANCE тере индекстан иң авыр негативларны казып ала, һәм алар модель үскән саен үткенләнә.",
      },
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
