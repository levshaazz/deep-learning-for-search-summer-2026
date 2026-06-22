    {
      id: 'turn-ltr', kind: 'prose',
      heading: { en: 'The Captain orders the host', ru: 'Капитан строит войско', tt: 'Капитан гаскәрне тәртипкә сала' },
      img: 'L8/L8-04-the-captain-orders.png', imgPos: 'scene',
      imgAlt: {
        en: 'A marshal arranges a scattered crowd of figures into a clean ranked column, gesturing the line into place.',
        ru: 'Маршал выстраивает разрозненную толпу фигур в чёткую ранжированную колонну, жестом направляя строй на место.',
        tt: 'Маршал таркау төркемне ачык ранжланган баганага тезә, рәтне урынына юнәлтеп.',
      },
      body: {
        en: [
          "We now have a host of signals: BM25, dense cosine, SPLADE weights, ColBERT MaxSim, plus freshness, clicks, document length, and more. Hybrid fusion was one way to combine two of them. But what if you have a *dozen* signals, and you have graded relevance judgments to learn from?",
          "Then you train a captain. Learning to Rank turns a feature vector per (query, document) pair into one learned order, optimizing a ranking metric directly. This is the bridge Lecture 7 promised — and it is where the cross-encoder reranker generalizes into a whole learned ranking function.",
        ],
        ru: [
          "Теперь у нас войско сигналов: BM25, плотный косинус, веса SPLADE, MaxSim ColBERT, плюс свежесть, клики, длина документа и не только. Гибридное слияние было одним способом объединить два из них. Но что если у тебя *дюжина* сигналов и есть размеченные суждения о релевантности для обучения?",
          "Тогда ты обучаешь капитана. Обучение ранжированию превращает вектор признаков пары (запрос, документ) в один выученный порядок, оптимизируя метрику ранжирования напрямую. Это тот мост, который обещала лекция 7 — и здесь реранкер-кросс-энкодер обобщается в целую выученную функцию ранжирования.",
        ],
        tt: [
          "Хәзер бездә сигналлар гаскәре: BM25, тыгыз косинус, SPLADE авырлыклары, ColBERT MaxSim, шулай ук документ яңалыгы, кликлар, документ озынлыгы һәм башкалар. Гибрид берләштерү аларның икесен кушуның бер ысулы иде. Әмма синдә *дистә* сигнал булса һәм өйрәнү өчен билгеләнгән релевантлык хөкемнәре булса?",
          "Алайса син капитан өйрәтәсең. Ранжлауга өйрәнү (сорау, документ) парының билге векторын бер өйрәнелгән тәртипкә әйләндерә, ранжлау метрикасын турыдан-туры оптимальләштереп. Бу — 7 нче лекция вәгъдә иткән күпер — һәм монда кросс-энкодер реранкеры тулы өйрәнелгән ранжлау функциясенә гомумиләшә.",
        ],
      },
    },
