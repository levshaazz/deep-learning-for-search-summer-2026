    {
      id: 'depth-plaid', kind: 'prose',
      heading: { en: 'PLAID: fast late interaction', ru: 'PLAID: быстрое позднее взаимодействие', tt: 'PLAID: тиз соңгы тәэсир итешү' },
      body: {
        en: [
          "Even with a compact index, scoring every candidate by full MaxSim is slow. PLAID makes it fast with a cheap-first, expensive-last cascade: candidates are first **pruned by centroids** (a coarse, fast filter), and full residual decompression — the expensive part — runs only for the survivors.",
          "The payoff is representative speedups of about \\(6.8\\times\\) on GPU and \\(45\\times\\) on CPU at no measurable quality loss on MS MARCO (the exact factor is dataset-dependent). Making a multi-vector index searchable at scale is the broader theme of approximate nearest-neighbour search — Lecture 13.",
        ],
        ru: [
          "Даже с компактным индексом оценивать каждого кандидата полным MaxSim медленно. PLAID ускоряет это каскадом «сначала дёшево, потом дорого»: кандидаты сперва **отсеиваются по центроидам** (грубый быстрый фильтр), а полная остаточная декомпрессия — дорогая часть — выполняется только для выживших.",
          "Выигрыш — типичные ускорения около \\(6{,}8\\times\\) на GPU и \\(45\\times\\) на CPU без заметной потери качества на MS MARCO (точный множитель зависит от датасета). Сделать многовекторный индекс пригодным для поиска в большом масштабе — это более широкая тема приближённого поиска ближайших соседей, лекция 13.",
        ],
        tt: [
          "Компакт индекс белән дә һәр кандидатны тулы MaxSim белән бәяләү әкрен. PLAID моны «башта арзан, аннары кыйммәт» каскады белән тизләтә: кандидатлар башта **центроидлар буенча сөзелә** (тупас, тиз фильтр), ә тулы калдык декомпрессиясе — кыйммәт өлеш — бары исән калганнар өчен эшләнә.",
          "Отыш — MS MARCO да сизелерлек сыйфат югалтуысыз GPU да якынча \\(6{,}8\\times\\), CPU да \\(45\\times\\) вәкаләтле тизләнү (төгәл коэффициент датасетка бәйле). Күп-векторлы индексны зурлыкта эзләрлек итү — якынча иң якын күршеләрне эзләүнең киңрәк темасы, 13 нчы лекция.",
        ],
      },
    },
