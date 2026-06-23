    {
      id: 'sparring-ghosts', kind: 'prose',
      heading: { en: 'The sparring ghosts', ru: 'Призраки спарринга', tt: 'Спаррингның призраклары' },
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
          "Үз индексыннан майнингның бер хәйләсе бар: миллионлаган пассажны яңадан индекслау әкрен, шуңа индекс вакыт-вакыт кына яңартыла. Яңартулар арасында модель яхшыра, ә аның негативлары туңдырылган — алар катлаулыдан җиңелгә күчә, **спарринг призраклары** кебек, көрәшче күптән калдырган позициядә әле дә күләгә белән сугышып.",
          "Соңрак эшләр аерманы *адымлап* режимга күчеп ябты: документ ягын туңдыр, сорау энкодерын өйрәт — негативлар чыннан да яңа кала: көндәшләр үткенрәк һәм һәр раундта дөньяны яңадан индекслаудан күпкә арзан.",
        ],
      },
    },
