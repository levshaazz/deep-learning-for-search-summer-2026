    {
      id: 'turn-compress', kind: 'prose',
      heading: { en: 'Fold the star-charts', ru: 'Сложи звёздные карты', tt: 'Йолдыз карталарын бөклә' },
      img: 'L9/L9-04-fold-the-maps-pq.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Séréga folds a vast star-chart into a tiny pocket codebook of stamped tiles (PQ compression, 32 → 4).',
        ru: 'Серёга складывает огромную звёздную карту в крошечный карманный кодбук из штампованных плиток (сжатие PQ, 32 → 4).',
        tt: 'Серёга зур йолдыз картасын штамплы плиткалардан кечкенә кесә кодбугына бөкли (PQ кысу, 32 → 4).',
      },
      body: {
        en: [
          "Graphs and cells make search *fast*, but the vectors themselves still have to fit in memory — and at a billion vectors of a few hundred dimensions each, that is the wall. The third lane is **compression**: don't store the full float vector, store a handful of codebook indices that *approximate* it. The star-chart folds; the lane stays open.",
        ],
        ru: [
          "Графы и ячейки делают поиск *быстрым*, но сами векторы всё ещё должны помещаться в памяти — а на миллиарде векторов по несколько сотен измерений это и есть стена. Третий коридор — **сжатие**: не хранить полный float-вектор, а хранить горсть индексов кодбука, которые его *приближают*. Звёздная карта складывается; коридор остаётся открытым.",
        ],
        tt: [
          "Графлар һәм күзәнәкләр эзләүне *тиз* итә, ләкин векторлар үзләре һаман хәтергә сыярга тиеш — ә берничә йөз үлчәмле миллиард векторда бу — стена. Өченче коридор — **кысу**: тулы float векторны түгел, ә аны *якынайтучы* бер уч кодбук индексын саклау. Йолдыз картасы бөкләнә; коридор ачык кала.",
        ],
      },
    },
