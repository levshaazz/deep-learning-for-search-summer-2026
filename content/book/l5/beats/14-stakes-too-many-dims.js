    {
      id: 'stakes-too-many-dims', kind: 'prose',
      heading: { en: 'Three hundred numbers you can’t see', ru: 'Триста чисел, которых не видно', tt: 'Күреп булмый торган өч йөз сан' },
      img: 'L5/L5-06-too-many-dims.png', imgPos: 'scene',
      imgAlt: {
        en: 'A towering column of hundreds of vector cells squeezed through a funnel down to just two dots plotted on a small 2-D grid.',
        ru: 'Высоченный столбец из сотен ячеек вектора протискивается сквозь воронку и сжимается до двух точек на маленькой 2-D сетке.',
        tt: 'Йөзләрчә вектор күзәнәгеннән торган биек багана воронка аша кысылып, кечкенә 2-D челтәрдәге нибары ике ноктага кала.',
      },
      imgCaption: {
        en: 'A real embedding is 300 numbers tall. You have two eyes — so the map has to be folded down to something you can actually plot.',
        ru: 'Настоящий эмбеддинг высотой в 300 чисел. А глаз у тебя два — значит, карту надо сложить до того, что можно нарисовать.',
        tt: 'Чын эмбеддинг 300 сан биеклегендә. Ә синең күзең икәү — димәк картаны сызып булырлык итеп бөкләргә кирәк.',
      },
      body: {
        en: [
          "Time for the catch, and it's a big one. The maps people actually ship aren't the six-number sketch we've been drawing — production embeddings live in **300 dimensions** (GloVe's standard size; word2vec and friends use 100–1000). Three hundred numbers per word. And that's the *good* news: 300-D is exactly what gives the space enough room to encode gender *and* royalty *and* tense *and* topic *and* register all as separate, simultaneous directions. The richness is the dimensionality.",
          "Here's the problem the richness creates. *You cannot see 300 dimensions.* Your visual system maxes out at three, and you really only reason comfortably in two. Every picture in this chapter — the parallelogram, the islands of meaning — has been a *lie of convenience*, a 2-D shadow I drew so the idea would fit on a page. The real space is a 300-dimensional cloud of forty-thousand points, and no eye will ever look at it directly.",
          "This matters beyond the pretty pictures. You debug what you can see. When an embedding model misbehaves — synonyms drifting apart, two senses of a word tangled together, a cluster that shouldn't exist — you need to *look*. And you can't look at 300-D. So we need a way to take that vast, high-dimensional map and **fold it down** to two or three dimensions you can actually plot, while keeping as much of the real shape as possible. Enter a new character, whose entire job is exactly that fold.",
        ],
        ru: [
          'Пора к подвоху, и он крупный. Карты, которые люди реально выкатывают, — не шестичисленный набросок, который мы рисовали: продакшн-эмбеддинги живут в **300 измерениях** (стандартный размер GloVe; word2vec и компания берут 100–1000). Триста чисел на слово. И это *хорошая* новость: именно 300-D даёт пространству достаточно места, чтобы закодировать пол *и* сан *и* время *и* тему *и* регистр — все как отдельные, одновременные направления. Богатство и есть размерность.',
          'Вот проблема, которую это богатство создаёт. *Триста измерений увидеть нельзя.* Зрение упирается в три, а удобно рассуждаешь вообще в двух. Каждая картинка в этой главе — параллелограмм, острова смысла — была *ложью ради удобства*, 2-D тенью, которую я рисовал, чтобы идея влезла на страницу. Настоящее пространство — 300-мерное облако из сорока тысяч точек, и ни один глаз никогда не посмотрит на него прямо.',
          'Это важно не только ради красивых картинок. Ты чинишь то, что видишь. Когда модель эмбеддингов чудит — синонимы расходятся, два смысла слова спутаны, есть кластер, которого быть не должно, — нужно *посмотреть*. А на 300-D не посмотришь. Значит, нужен способ взять эту огромную многомерную карту и **свернуть её** до двух-трёх измерений, которые реально можно нарисовать, сохранив как можно больше настоящей формы. На сцену выходит новый персонаж, чья единственная работа — ровно этот сгиб.',
        ],
        tt: [
          'Менә каршылык, һәм ул зур. Кешеләр чынлап чыгарган карталар — без сызган алты санлы эскиз түгел: продакшн эмбеддинглары **300 үлчәмдә** яши (GloVe’ның стандарт зурлыгы; word2vec һәм иптәшләре 100–1000 ала). Сүзгә өч йөз сан. Һәм бу *яхшы* хәбәр: нәкъ 300-D киңлеккә җенесне *дә*, дәрәҗәне *дә*, заманны *дә*, теманы *дә*, регистрны *дә* — барысын аерым, бер үк вакытлы юнәлешләр итеп кодларга җитәрлек урын бирә. Байлык — ул үлчәмлелек.',
          'Менә бу байлык тудырган проблема. *Өч йөз үлчәмне күреп булмый.* Күрү өчтә туктала, ә уңайлы фикерләү гомумән икедә. Бу бүлектәге һәр рәсем — параллелограмм, мәгънә утраулары — *уңайлык өчен ялган* иде, идея биткә сыйсын өчен мин сызган 2-D күләгә. Чын киңлек — кырык мең нокталы 300-үлчәмле болыт, һәм беркайчан бер күз дә аңа турыдан карамаячак.',
          'Бу матур рәсемнәр өчен генә мөһим түгел. Син күргәнеңне төзәтәсең. Эмбеддинг моделе тилерсә — синонимнар аерылса, сүзнең ике мәгънәсе бутала, булмаска тиешле кластер бар, — *карарга* кирәк. Ә 300-D’га карап булмый. Димәк, бу зур, күп үлчәмле картаны алып, аны чынлап сызып була торган ике-өч үлчәмгә **бөкли** торган ысул кирәк, чын форманы мөмкин кадәр күбрәк саклап. Сәхнәгә яңа персонаж чыга, аның бөтен эше — нәкъ менә шул бөкләү.',
        ],
      },
    },
