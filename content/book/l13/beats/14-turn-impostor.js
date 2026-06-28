    {
      id: 'turn-impostor', kind: 'prose',
      heading: { en: 'What if the opponent is a friend?', ru: 'А если противник — друг?', tt: 'Ә көндәш дус булса?' },
      img: 'L13/L13-09-the-impostor.png', imgPos: 'hero',
      imgAlt: {
        en: "Séréga freezes mid-strike facing the Impostor — a masked duelist whose fencing mask is half-lifted to reveal a friendly warm-orange plus-badge underneath: the enemy he was about to push away is actually an unlabelled positive.",
        ru: "Серёга замирает на полуударе перед Самозванцем — дуэлянтом в маске, чья фехтовальная маска приподнята и открывает дружелюбный оранжевый плюс-значок: враг, которого он собирался оттолкнуть, на деле неразмеченный позитив.",
        tt: "Серёга Алдакчы каршында сугу уртасында каты кала — битлекле дуэлянтның фехтование битлеге яртылаш күтәрелгән, астында дусларча җылы-оранж плюс-билге: ул этәрергә җыенган дошман чынлыкта билгеләнмәгән позитив булып чыга.",
      },
      imgCaption: {
        en: "Sometimes the hardest opponent is a friend in a mask: a correct answer that was never labelled, punished as if it were wrong.",
        ru: "Иногда самый трудный противник — друг в маске: верный ответ, который не разметили, наказанный как ошибочный.",
        tt: "Кайчак иң авыр көндәш — битлектәге дус: билгеләнмәгән дөрес җавап, ялгыш кебек җәзаланган.",
      },
      body: {
        en: [
          "Mining the hardest negatives surfaces a quiet disaster. Real datasets label barely one correct passage per query, against a corpus of millions — yet many *other* passages are also relevant, just never labelled. When the miner reaches for the hardest candidates, it scoops up these **unlabelled positives** and hands them over as negatives.",
          "This is the **Impostor**: an ally wearing an enemy's mask. Push it away and you train the model to reject a correct answer — and, as the next beats show, you drag the true positive down with it.",
        ],
        ru: [
          "Майнинг самых сложных негативов вскрывает тихую катастрофу. Реальные датасеты размечают едва один верный пассаж на запрос против корпуса в миллионы — но многие *другие* пассажи тоже релевантны, просто не размечены. Когда майнер тянется за самыми сложными кандидатами, он зачерпывает эти **неразмеченные позитивы** и выдаёт их как негативы.",
          "Это **Самозванец** — союзник в маске врага. Оттолкни его — и ты учишь модель отвергать верный ответ; а как покажут следующие биты, вместе с ним ты утягиваешь вниз и истинный позитив.",
        ],
        tt: [
          "Иң катлаулы негативларны майнинг тыныч фаҗиганы ача. Реаль датасетлар сорауга көчкә бер дөрес пассаж билгели, миллионлаган корпуска каршы — ләкин күп *башка* пассажлар да релевант, бары билгеләнмәгән генә. Майнер иң катлаулы кандидатларга үрелгәндә, ул бу **билгеләнмәгән позитивларны** эләктереп ала һәм негатив итеп бирә.",
          "Бу — **Алдакчы**: дошман битлеген кигән иптәш. Аны этсәң — модельне дөрес җавапны кире кагарга өйрәтәсең; ә киләсе битләр күрсәткәнчә, аның белән бергә чын позитивны да түбән тартасың.",
        ],
      },
    },
