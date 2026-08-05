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
          "One statistic makes the *why* concrete. Take the negatives each strategy mines and ask: what fraction are the model's **actual** hardest? In-batch negatives overlap the true-hard set by **0%**, BM25's lexical negatives by about **15%**, and ANCE's self-mined negatives by **100%** — by construction they *are* what the model confuses. That overlap is the whole win, and the scores follow: ANCE reaches MS MARCO MRR@10 0.33 and NQ top-20 81.9, refreshing its index every ~10k batches so the negatives keep up.",
        ],
        ru: [
          "Поворот, изменивший плотный поиск: перестать угадывать, что сложно, и дать **модели майнить самой**. Проиндексируй весь корпус текущей моделью, достань для каждого запроса ближайшие не-позитивы и обучайся против *них*. Это негативы, которые модель действительно путает, — и они поспевают за ней по мере улучшения.",
          "Одна эта идея — майнинг негативов по приближённым ближайшим соседям — подняла плотные ретриверы выше сильных лексических базовых методов и сделала *динамические* трудные негативы сердцем ремесла.",
          "Одна цифра делает *почему* осязаемым. Возьми негативы, что добывает каждая стратегия, и спроси: какая доля — реально самые трудные для модели? Внутрибатчевые негативы пересекаются с истинно-сложными на **0%**, лексические негативы BM25 — примерно на **15%**, а самодобытые негативы ANCE — на **100%**: по построению они и *есть* то, что модель путает. Это перекрытие и есть вся победа, а метрики идут следом: ANCE достигает MS MARCO MRR@10 0,33 и NQ top-20 81,9, обновляя индекс каждые ~10k батчей, чтобы негативы поспевали.",
        ],
        tt: [
          "Тыгыз эзләүне үзгәрткән борылыш: нәрсә катлаулы икәнен фаразлауны туктат, **модель үзе майнласын**. Бөтен корпусны хәзерге модель белән индекслә, һәр сорауга иң якын позитив-булмаганнарны ал һәм *шуларга* каршы өйрән. Болар модель чыннан да буташтырган негативлар — һәм алар модель яхшырган саен аңа иярә.",
          "Бер генә бу фикер — якынча иң якын күршеләр буенча негатив майнинг — тыгыз ретриверларны көчле лексик базлайннардан өскә күтәрде һәм *динамик* катлаулы негативларны һөнәрнең үзәгенә куйды.",
          "Бер сан *нигә* икәнен ачык итә. Һәр стратегия казып алган негативларны ал да сора: алар арасында модель өчен чыннан да иң авырлары нинди өлеш тәшкил итә? Эчке-батч негативлары чын-катлаулы җыелма белән **0%**ка, BM25'ның лексик негативлары якынча **15%**ка, ә ANCE'ның үзе казыган негативлары **100%**ка кисешә — төзелеше буенча алар модель буташтырганның *нәкъ үзе*. Шул кисешү бөтен җиңү инде, ә метрикалар аңа иярә: ANCE MS MARCO MRR@10 0.33 һәм NQ top-20 81.9 кә җитә, индексын һәр ~10k батч саен яңартып, негативлар иярсен өчен.",
        ],
      },
    },
