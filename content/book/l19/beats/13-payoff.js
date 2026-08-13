    {
      id: 'payoff', kind: 'prose',
      heading: { en: 'Morphology strikes back — and loses to the same move', ru: 'Морфология наносит ответный удар — и проигрывает одному приёму', tt: 'Морфология ответный удар ясый — һәм бер алымга оттыра' },
      img: 'L20/L20-07-morphology-tamed.png', imgPos: 'hero',
      imgAlt: { en: "Séréga stands proudly beside a calm, well-fed Tokenosaurus who now neatly holds a Russian word reduced to one tidy lemma card, a small ranking board behind them showing the gold answer risen to #1. His green tübetey is the only green.", ru: "Серёга гордо стоит рядом со спокойным, сытым Токенозавром, который теперь аккуратно держит русское слово, сведённое к одной опрятной карточке-лемме, а на доске за ними золотой ответ поднялся на #1. Единственное зелёное — тюбетейка.", tt: "Séréga тыныч, тук Токенозавр янында горур тора: ул хәзер бер пөхтә лемма-картага кайтарылган рус сүзен җайлап тота, ә алар артындагы тактада алтын җавап #1\'гә күтәрелгән. Бердәнбер яшел — түбәтәе." },
      imgCaption: { en: "One form, both arms — the answer rises to first, and the pipeline never changed.", ru: "Одна форма, оба плеча — ответ поднимается на первое, а конвейер не менялся.", tt: "Бер форма, ике җилкә — җавап беренчегә күтәрелә, ә конвейер үзгәрмәде." },
      body: {
        en: [
          "Morphology struck back, and it lost to the same move three times. The token tax, the surface-form miss and the model mismatch are three faces of one fact — Russian carries its grammar inside its words — and one principle answers all three: **fold the query and the corpus to one form, in both arms.** Whether the form is a token, a string, or a vector, symmetry is the whole game.",
          "On our toy the payoff was one number: the gold answer's BM25 went from \\(0.0\\) to \\(1.3884\\), rank 2 to rank 1, the moment the forms matched. In production it is a multilingual encoder plus lemmatized BM25, fused, with the small orthographic cuts dressed — Tokenosaurus fed, the answer surfaced.",
          "Not a new model. The familiar pipeline, honestly tuned for Russian — and the same discipline waiting for any language that does not happen to be English. L20 takes that pipeline further still — multi-hop, multimodal, and answerable for what it does — and the question it opens there starts right here: whose language does your search speak?",
        ],
        ru: [
          "Морфология нанесла ответный удар — и проиграла одному приёму трижды. Токен-налог, промах по формам и рассинхрон модели — три лица одного факта: русский несёт грамматику внутри слов, — и один принцип отвечает на все три: **сведи запрос и корпус к одной форме, в обоих плечах.** Токен, строка или вектор — симметрия и есть вся игра.",
          "На нашей игрушке развязка уместилась в одно число: BM25 золотого ответа поднялся с \\(0{,}0\\) до \\(1{,}3884\\), со второго места на первое, в тот момент, когда формы совпали. В проде это мультиязычный энкодер плюс лемматизированный BM25, слитые, с обработанными орфографическими порезами — Токенозавр накормлен, ответ всплыл.",
          "Не новая модель. Знакомый конвейер, честно настроенный под русский, — и та же дисциплина ждёт любой язык, который не оказался английским. L20 уводит этот конвейер дальше — многошаговость, мультимодальность и ответственность за то, что он делает, — и вопрос, который там открывается, начинается прямо здесь: на чьём языке говорит твой поиск?",
        ],
        tt: [
          "Морфология ответный удар ясады — һәм бер алымга өч тапкыр оттырды. Токен-налог, форма буенча промах һәм model рассинхроны — бер фактның өч йөзе: рус грамматикасын сүзләре эчендә йөртә — һәм бер принцип өчесенә дә җавап бирә: **сорау белән корпусны бер формага, ике җилкәдә дә кайтар.** Токенмы, юлмы, вектормы — симметрия — бөтен уен.",
          "Безнең toy\'да түләү бер сан булды: алтын җавапның BM25\'е формалар туры килгән мизгелдә \\(0.0\\)\'дән \\(1.3884\\)\'кә, rank 2\'дән rank 1\'гә күтәрелде. Прод\'та бу — мультител энкодер плюс лемматизацияле BM25, кушылган, орфографик кисемнәре бәйләнгән — Токенозавр туйдырылган, җавап калыккан.",
          "Яңа model түгел. Таныш конвейер, русча намус белән көйләнгән — һәм шул ук дисциплина инглиз булып чыкмаган теләсә кайсы телне көтә. L20 бу конвейерны тагын да ераккарак алып китә — күпадымлылык, мультимодальлек һәм эшләгәне өчен җаваплылык — ә анда ачыла торган сорау нәкъ монда башлана: синең эзләвең кем телендә сөйләшә?",
        ],
      },
    },
