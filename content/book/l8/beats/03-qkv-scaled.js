    {
      id: 'qkv-scaled', kind: 'prose',
      heading: { en: "Query, Key, Value — and why I divide by √dₖ", ru: "Запрос, Ключ, Значение — и зачем я делю на √dₖ", tt: "Query, Key, Value — һәм ни өчен мин √dₖ'ка бүләм" },
      body: {
        en: [
          "Here is how a thread learns who to listen to. From each word I spin three small vectors on the loom. A *Query* — what am I looking for? A *Key* — what do I offer to others? And a *Value* — what I actually pass along if you attend to me. Three learned projections, \\(Q=XW_Q,\\ K=XW_K,\\ V=XW_V\\), nothing more.",
          "To score thread \\(i\\) against thread \\(j\\), I take the dot product of its query with the other's key: \\(E_{ij}=Q_i\\cdot K_j\\). High when they align, low when they don't. A row of softmax turns these scores into weights that sum to one — a *soft* lookup, not a hard pick — and the output is the blended values, \\(Y_i=\\sum_j A_{ij}V_j\\). The thread listens a little to everyone, mostly to whoever fits.",
          "One catch. In \\(d_k\\) dimensions the dot-product's variance grows *with the dimension* — big scores push softmax into a spike, almost one-hot, and the gradient goes numb. So I divide by \\(\\sqrt{d_k}\\) first. Same alignment, gentler numbers: unscaled, \\(\\mathrm{softmax}(0,0,6)\\to(0.002,0.002,0.995)\\); scaled by \\(\\sqrt{4}=2\\), \\(\\mathrm{softmax}(0,0,3)\\to(0.045,0.045,0.909)\\). Still decisive, but the cloth stays *soft* enough to keep learning.",
        ],
        ru: [
          "Вот как нить учится, кого слушать. Из каждого слова я пряду на станке три коротких вектора. *Запрос* (query) — что я ищу? *Ключ* (key) — что я предлагаю другим? И *значение* (value) — что я на самом деле передам, если ты обратишь на меня внимание. Три обучаемые проекции, \\(Q=XW_Q,\\ K=XW_K,\\ V=XW_V\\), и всё.",
          "Чтобы оценить нить \\(i\\) относительно нити \\(j\\), беру скалярное произведение её запроса с чужим ключом: \\(E_{ij}=Q_i\\cdot K_j\\). Высоко — когда совпадают, низко — когда нет. Софтмакс по строке превращает эти оценки в веса с суммой единица — это *мягкое* обращение ко всем ключам, а не жёсткий выбор одного, — а на выходе смесь значений, \\(Y_i=\\sum_j A_{ij}V_j\\). Нить слушает понемногу всех, но больше всего того, кто ей подходит.",
          "Одна загвоздка. В \\(d_k\\) измерениях дисперсия скалярного произведения растёт *с размерностью* — большие оценки толкают софтмакс в пик, почти one-hot, и градиент гаснет. Поэтому сначала делю на \\(\\sqrt{d_k}\\). Та же похожесть, но числа мягче: без масштаба \\(\\mathrm{softmax}(0,0,6)\\to(0{,}002,0.002,0.995)\\); после деления на \\(\\sqrt{4}=2\\) — \\(\\mathrm{softmax}(0,0,3)\\to(0{,}045,0.045,0.909)\\). По-прежнему решительно, но полотно остаётся *мягким* — достаточно, чтобы учиться дальше.",
        ],
        tt: [
          "Менә җеп кемне тыңларга икәнен ничек өйрәнә. Һәр сүздән мин станокта өч кыска вектор эрлим. *Query* (сорау) — мин нәрсә эзлим? *Key* (ачкыч) — мин башкаларга нәрсә тәкъдим итәм? Һәм *Value* (кыйммәт) — син миңа attention бирсәң, мин чынлыкта нәрсә тапшырам. Өч өйрәнелә торган проекция, \\(Q=XW_Q,\\ K=XW_K,\\ V=XW_V\\), шул гына.",
          "\\(i\\) җебен \\(j\\) җебенә карата бәяләр өчен, аның сорауын икенчесенең ачкычы белән скаляр тапкырлыйм: \\(E_{ij}=Q_i\\cdot K_j\\). Туры килсәләр — югары, килмәсәләр — түбән. Юл буенча softmax бу скорларны суммасы бергә тигез булган үлчәүләргә әйләндерә — бу *йомшак* lookup, бер ачкычны каты сайлау түгел, — ә чыгыш кыйммәтләрнең катнашмасы: \\(Y_i=\\sum_j A_{ij}V_j\\). Җеп һәркемне бераз тыңлый, ә иң күп үзенә туры килгәнне.",
          "Бер каршылык бар. \\(d_k\\) үлчәмдә скаляр тапкырчыкның дисперсиясе *үлчәм белән бергә* үсә — зур скорлар softmax'ны очлыкка этәрә, диярлек one-hot, һәм градиент сүрелә. Шуңа күрә башта \\(\\sqrt{d_k}\\)'ка бүләм. Шул ук охшашлык, ләкин саннар йомшаграк: масштабсыз \\(\\mathrm{softmax}(0,0,6)\\to(0.002,0.002,0.995)\\); \\(\\sqrt{4}=2\\)'гә бүлгәч — \\(\\mathrm{softmax}(0,0,3)\\to(0.045,0.045,0.909)\\). Һаман да кискен, ләкин тукыма *йомшак* булып кала — өйрәнүне дәвам итәрлек.",
        ],
      },
    },
