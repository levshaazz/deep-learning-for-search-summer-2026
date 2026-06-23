    {
      id: 'central-lens', kind: 'prose',
      heading: { en: 'A negative is worth its gradient', ru: 'Негатив стоит своего градиента', tt: 'Негатив үз градиенты кадәр кыйммәтле' },
      body: {
        en: [
          "Here is the lens that unifies the whole chapter. The push each negative exerts is a **Boltzmann weight** — a softmax of its similarity divided by \\(\\tau\\). An easy negative gets almost no weight, so it contributes almost no gradient: training it is wasted effort.",
          "As \\(\\tau\\) shrinks toward zero, the weight collapses onto the single hardest negative — a nearest-neighbour *hard-max*. A negative is worth exactly its gradient, and every mining strategy in this chapter is, at heart, a different way to spend the gradient budget on negatives that are worth it.",
        ],
        ru: [
          "Вот линза, объединяющая всю главу. Толчок каждого негатива — это **больцмановский вес**, софтмакс его сходства, делённого на \\(\\tau\\). Лёгкий негатив получает почти нулевой вес и почти не даёт градиента: тренировать на нём — впустую.",
          "По мере того как \\(\\tau\\) стремится к нулю, вес сваливается на единственный самый сложный негатив — *hard-max* ближайшего соседа. Негатив стоит ровно своего градиента, и каждая стратегия майнинга в этой главе — по сути, свой способ потратить бюджет градиента на негативы, которые того стоят.",
        ],
        tt: [
          "Менә бөтен бүлекне берләштерүче линза. Һәр негатив ясый торган этеш — **Больцман авырлыгы**, аның \\(\\tau\\) га бүленгән охшашлыгының софтмаксы. Җиңел негатив диярлек нуль авырлык ала, шуңа диярлек градиент бирми: аны өйрәтү — бушка.",
          "\\(\\tau\\) нульгә якынлашкан саен авырлык бер иң катлаулы негативга өелә — иң якын күршенең *hard-max* ы. Негатив нәкъ үз градиенты кадәр кыйммәтле, ә бу бүлектәге һәр майнинг стратегиясе — асылда, градиент бюджетын лаеклы негативларга тотуның үз ысулы.",
        ],
      },
    },
