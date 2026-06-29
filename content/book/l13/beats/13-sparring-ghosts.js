    {
      id: 'sparring-ghosts', kind: 'prose',
      heading: { en: 'The sparring ghosts', ru: 'Призраки спарринга', tt: 'Спаррингның өрәкләре' },
      img: 'L13/L13-08-sparring-ghosts.png', imgPos: 'scene',
      imgAlt: {
        en: "Faded ghost opponents still throwing punches at where Séréga used to stand — stale negatives frozen at the last index refresh while the model has already moved on.",
        ru: "Поблёкшие призраки-противники всё ещё бьют туда, где Серёга стоял раньше, — устаревшие негативы, замороженные на последнем обновлении индекса, пока модель уже ушла вперёд.",
        tt: "Уңып беткән өрәк-көндәшләр Серёга элек торган урынга һаман сугалар — модель инде алга киткәндә, соңгы индекс яңартуында каткан искергән негативлар.",
      },
      imgCaption: {
        en: "Refresh the index too rarely and you spar with ghosts: negatives mined from a model you no longer are.",
        ru: "Обновляй индекс слишком редко — и спаррингуешь с призраками: негативами, добытыми из модели, которой ты уже не являешься.",
        tt: "Индексны артык сирәк яңартсаң, өрәкләр белән спарринг ясыйсың: син инде булмаган моделдән казып алынган негативлар.",
      },
      body: {
        en: [
          "Mining from the model's own index has a catch: re-indexing millions of passages is slow, so the index is refreshed only now and then. Between refreshes the model keeps improving while its negatives are frozen — they drift from hard to easy, like **sparring ghosts** still shadow-boxing a position the fighter has long left.",
          "Later work closed the gap by going *per-step*: freeze the document side, train the query encoder, and the negatives stay genuinely current — sharper opponents, and far cheaper than re-indexing the world each round.",
        ],
        ru: [
          "У майнинга из собственного индекса есть подвох: переиндексировать миллионы пассажей медленно, поэтому индекс обновляют лишь время от времени. Между обновлениями модель улучшается, а её негативы заморожены — они дрейфуют от сложных к лёгким, как **призраки спарринга**, всё ещё бьющиеся с тенью на позиции, которую боец давно покинул.",
          "Более поздние работы закрыли разрыв, перейдя на *пошаговый* режим: заморозь сторону документов, обучай энкодер запроса — и негативы остаются по-настоящему свежими: противники острее и куда дешевле, чем переиндексировать весь мир каждый раунд.",
        ],
        tt: [
          "Үз индексыннан майнингның бер хәйләсе бар: миллионлаган пассажны яңадан индекслау әкрен, шуңа индекс вакыт-вакыт кына яңартыла. Яңартулар арасында модель яхшыра, ә аның негативлары туңдырылган — алар катлаулыдан җиңелгә күчә, **спарринг өрәкләре** кебек, көрәшче күптән калдырган позициядә әле дә күләгә белән сугышып.",
          "Соңрак эшләр аерманы *адымлап* режимга күчеп ябты: документ ягын туңдыр, сорау энкодерын өйрәт — негативлар чыннан да яңа кала: көндәшләр үткенрәк һәм һәр раундта дөньяны яңадан индекслаудан күпкә арзан.",
        ],
      },
    },
