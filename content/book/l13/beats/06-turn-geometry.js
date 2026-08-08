    {
      id: 'turn-geometry', kind: 'prose',
      heading: { en: 'Hardness is an angle', ru: 'Трудность — это угол', tt: 'Катлаулык — почмак ул' },
      img: 'L13/L13-04-sir-cosine-hardness.png', imgPos: 'mascot',
      imgAlt: {
        en: "Sir Cosine — Séréga as a knight in his green tübetey — measuring with a protractor the small angle between the query and a crowding hard negative on a warm unit-sphere arc.",
        ru: "Сэр Косинус — Серёга-рыцарь в зелёной тюбетейке — транспортиром измеряет малый угол между запросом и теснящимся трудным негативом на тёплой дуге единичной сферы.",
        tt: "Сэр Косинус — яшел түбәтәйле рыцарь Серёга — транспортир белән сорау һәм кысылып торган авыр негатив арасындагы кечкенә почмакны үлчи, җылы берәмлек сфера дугасында.",
      },
      imgCaption: {
        en: "Hardness is just an angle: the closer a negative sits to the query, the harder — and the more it teaches.",
        ru: "Трудность — это угол: чем ближе негатив к запросу, тем он труднее — и тем большему учит.",
        tt: "Авырлык — ул почмак: негатив сорауга никадәр якынрак, шулкадәр авыррак — һәм күбрәккә өйрәтә.",
      },
      body: {
        en: [
          "What makes a negative *hard*? Geometrically, it is one that sits close to the query in angle — a high \\(\\cos(q, d^-)\\). An easy negative is far away and already separated; a hard one crowds the query and is easy to confuse with the right answer.",
          "Sir Cosine returns to measure it. Lay the query, its positive, and the negatives on a unit arc by their angle, and hardness becomes something you can *see*.",
        ],
        ru: [
          "Что делает негатив *трудным*? Геометрически — это тот, который близок к запросу по углу, с высоким \\(\\cos(q, d^-)\\). Лёгкий негатив далеко и уже отделён; трудный теснит запрос, и его легко спутать с правильным ответом.",
          "Возвращается Сэр Косинус, чтобы это измерить. Разложи запрос, его позитив и негативы на единичной дуге по углу — и трудность станет тем, что можно *увидеть*.",
        ],
        tt: [
          "Негативны *катлаулы* итүче нәрсә? Геометрик яктан — сорауга почмак буенча якын торганы, югары \\(\\cos(q, d^-)\\) белән. Җиңел негатив ерак һәм инде аерылган; катлаулысы сорауны кыса һәм аны дөрес җавап белән буташтыру җиңел.",
          "Моны үлчәр өчен Сэр Косинус кайта. Сорауны, аның позитивын һәм негативларны почмак буенча берәмлек дугасына сал — һәм катлаулык *күреп була* торган нәрсәгә әйләнер.",
        ],
      },
    },
