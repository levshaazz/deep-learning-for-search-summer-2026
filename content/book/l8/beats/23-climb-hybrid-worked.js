    {
      id: 'climb-hybrid-worked', kind: 'prose',
      heading: { en: 'RRF, by hand', ru: 'RRF вручную', tt: 'RRF кул белән' },
      body: {
        en: [
          "RRF gives each document a vote of \\(1/(k+\\text{rank})\\) from each list and sums them; the standard constant is \\(k=60\\). Take five documents where the sparse and dense rankers disagree.",
          ":::calc With \\(k=60\\), \\(\\text{score} = 1/(60+r_{\\text{sparse}}) + 1/(60+r_{\\text{dense}})\\). The consensus doc D2 scores \\(1/62 + 1/61 = \\mathbf{0.0325}\\) and wins; D3 follows at \\(\\mathbf{0.0320}\\); the sparse favourite D1 — ranked #1 by sparse but *last* by dense — scores only \\(1/61 + 1/65 = \\mathbf{0.0318}\\) and falls to third. :::",
          "There is the whole point of rank fusion. D1 was somebody's #1, but that single strong vote could not outweigh D2's two solid votes. Consensus across both rankers beats a lopsided favourite — and it needed no score calibration, only ranks.",
        ],
        ru: [
          "RRF даёт каждому документу голос \\(1/(k+\\text{ранг})\\) от каждого списка и суммирует их; стандартная константа — \\(k=60\\). Возьмём пять документов, где разрежённый и плотный ранжировщики расходятся.",
          ":::calc При \\(k=60\\), \\(\\text{score} = 1/(60+r_{\\text{разреж}}) + 1/(60+r_{\\text{плотн}})\\). Консенсусный документ D2 набирает \\(1/62 + 1/61 = \\mathbf{0{,}0325}\\) и выигрывает; D3 следует на \\(\\mathbf{0{,}0320}\\); фаворит разрежённого D1 — №1 у разрежённого, но *последний* у плотного — набирает лишь \\(1/61 + 1/65 = \\mathbf{0{,}0318}\\) и падает на третье место. :::",
          "В этом весь смысл слияния по рангам. D1 был чьим-то №1, но один сильный голос не перевесил два крепких голоса D2. Согласие обоих ранжировщиков побеждает однобокого фаворита — и для этого не понадобилась калибровка оценок, только ранги.",
        ],
        tt: [
          "RRF һәр документка һәр исемлектән \\(1/(k+\\text{ранг})\\) тавышы бирә һәм аларны куша; стандарт константа — \\(k=60\\). Сирәк һәм тыгыз ранжлаучылар ризалашмаган биш документ алыйк.",
          ":::calc \\(k=60\\) булганда, \\(\\text{score} = 1/(60+r_{\\text{сирәк}}) + 1/(60+r_{\\text{тыгыз}})\\). Консенсус документ D2 \\(1/62 + 1/61 = \\mathbf{0{,}0325}\\) җыя һәм җиңә; D3 \\(\\mathbf{0{,}0320}\\) белән бара; сирәкнең фавориты D1 — сирәктә №1, әмма тыгызда *соңгы* — бары \\(1/61 + 1/65 = \\mathbf{0{,}0318}\\) җыя һәм өченче урынга төшә. :::",
          "Ранглар буенча берләштерүнең бөтен мәгънәсе шунда. D1 кемнеңдер №1 е иде, әмма бер көчле тавыш D2 ның ике нык тавышын баса алмады. Ике ранжлаучының ризалыгы бер яклы фаворитны җиңә — һәм моңа балл калибровкасы кирәкмәде, бары ранглар.",
        ],
      },
    },
