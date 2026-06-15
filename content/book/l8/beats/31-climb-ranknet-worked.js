    {
      id: 'climb-ranknet-worked', kind: 'prose',
      heading: { en: 'RankNet, by hand', ru: 'RankNet вручную', tt: 'RankNet кул белән' },
      body: {
        en: [
          "RankNet reads a preference as a probability of the *score difference*: \\(P_{ij} = \\sigma(s_i - s_j)\\). Take a relevant document \\(i\\) the model scores \\(1.5\\) and an irrelevant \\(j\\) it scores \\(0.3\\).",
          ":::calc With \\(s_i = 1.5\\) and \\(s_j = 0.3\\), the difference is \\(1.2\\). RankNet's probability is \\(P_{ij} = \\sigma(1.2) = 1/(1+e^{-1.2}) = \\mathbf{0.7685}\\), and the cross-entropy cost is \\(\\log(1+e^{-1.2}) = \\mathbf{0.2633}\\). :::",
          "The model already leans the right way — \\(P_{ij} = \\mathbf{0.7685} \\gt 0.5\\) — but the cost \\(\\mathbf{0.2633}\\) is not yet zero, so there is room to push \\(i\\) up and \\(j\\) down. The next question is the clever one: *how hard* should we push this particular pair?",
        ],
        ru: [
          "RankNet читает предпочтение как вероятность *разности оценок*: \\(P_{ij} = \\sigma(s_i - s_j)\\). Возьмём релевантный документ \\(i\\) с оценкой \\(1{,}5\\) и нерелевантный \\(j\\) с оценкой \\(0{,}3\\).",
          ":::calc При \\(s_i = 1{,}5\\) и \\(s_j = 0{,}3\\) разность равна \\(1{,}2\\). Вероятность RankNet — \\(P_{ij} = \\sigma(1{,}2) = 1/(1+e^{-1{,}2}) = \\mathbf{0{,}7685}\\), а кросс-энтропийная стоимость — \\(\\log(1+e^{-1{,}2}) = \\mathbf{0{,}2633}\\). :::",
          "Модель уже склоняется к верному порядку — \\(P_{ij} = \\mathbf{0{,}7685} \\gt 0{,}5\\) — но стоимость \\(\\mathbf{0{,}2633}\\) ещё не нулевая, значит есть куда толкать \\(i\\) вверх, а \\(j\\) вниз. Следующий вопрос — самый хитрый: *насколько сильно* толкать именно эту пару?",
        ],
        tt: [
          "RankNet өстенлекне *балл аермасы* ихтималы итеп укый: \\(P_{ij} = \\sigma(s_i - s_j)\\). Модель \\(1{,}5\\) бәяләгән релевант \\(i\\) документын һәм \\(0{,}3\\) бәяләгән релевант булмаган \\(j\\) ны алыйк.",
          ":::calc \\(s_i = 1{,}5\\) һәм \\(s_j = 0{,}3\\) булганда, аерма \\(1{,}2\\). RankNet ихтималы — \\(P_{ij} = \\sigma(1{,}2) = 1/(1+e^{-1{,}2}) = \\mathbf{0{,}7685}\\), ә кросс-энтропия бәясе — \\(\\log(1+e^{-1{,}2}) = \\mathbf{0{,}2633}\\). :::",
          "Модель инде дөрес якка авыша — \\(P_{ij} = \\mathbf{0{,}7685} \\gt 0{,}5\\) — әмма бәя \\(\\mathbf{0{,}2633}\\) әле нуль түгел, ягъни \\(i\\) не өскә, \\(j\\) ны аска этәрергә урын бар. Киләсе сорау — иң хәйләкәре: нәкъ бу парны *никадәр көчле* этәргә?",
        ],
      },
    },
