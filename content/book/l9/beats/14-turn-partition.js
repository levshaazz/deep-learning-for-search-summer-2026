    {
      id: 'turn-partition', kind: 'prose',
      heading: { en: 'Carve the galaxy into sectors', ru: 'Разбей галактику на секторы', tt: 'Галактиканы секторларга бүл' },
      img: 'L9/L9-03-sectors-ivf.png', imgPos: 'float-right',
      imgAlt: {
        en: 'The galaxy carved into three glowing sectors (Voronoi cells); Séréga probes the two sectors nearest his query and ignores the rest.',
        ru: 'Галактика разбита на три светящихся сектора (ячейки Вороного); Серёга пробует два ближайших к запросу сектора и игнорирует остальное.',
        tt: 'Галактика өч балкып торган секторга (Вороной күзәнәкләре) бүленгән; Серёга сорауга иң якын ике секторны тикшерә, калганын исәпкә алмый.',
      },
      body: {
        en: [
          "A graph walks; a **partition** sorts. The inverted file (IVF) first runs \\(k\\)-means over the corpus to pick a few hundred or thousand **centroids**, carving the space into Voronoi **cells**. Every vector is filed under its nearest centroid — built once, offline. At query time you don't scan the corpus; you find the cells nearest the query and probe only those.",
        ],
        ru: [
          "Граф идёт; **разбиение** сортирует. Инвертированный файл (IVF) сначала прогоняет \\(k\\)-средних по корпусу, выбирая сотни-тысячи **центроидов** и разбивая пространство на **ячейки** Вороного. Каждый вектор подшит под ближайший центроид — строится однажды, офлайн. На запросе ты не сканируешь корпус; ты находишь ячейки, ближайшие к запросу, и пробуешь только их.",
        ],
        tt: [
          "Граф бара; **бүлгәләү** сортлый. Инвертлы файл (IVF) башта корпус буенча \\(k\\)-урталарны эшләтә, берничә йөз яки мең **центроид** сайлап, киңлекне Вороной **күзәнәкләренә** бүлә. Һәр вектор иң якын центроид астына теркәлә — бер тапкыр, офлайн төзелә. Сорауда син корпусны сканламыйсың; сорауга иң якын күзәнәкләрне табасың һәм бары шуларны тикшерәсең.",
        ],
      },
    },
