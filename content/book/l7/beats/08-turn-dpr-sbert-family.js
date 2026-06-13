    {
      id: 'turn-dpr-sbert-family', kind: 'prose',
      heading: { en: 'DPR vs SBERT', ru: 'DPR против SBERT', tt: 'DPR vs SBERT' },
      body: {
        en: [
          "Two landmark bi-encoders set the template. **DPR** (Karpukhin et al. 2020) uses **two separate encoders** — one for questions, one for passages — trained with **in-batch negatives**, and pools with the \\([\\text{CLS}]\\) token; it is *asymmetric* (query and document are different kinds of text). **SBERT** (Reimers &amp; Gurevych 2019) is a *siamese* network — one shared encoder — that **mean-pools** token vectors and trains on NLI/STS; it is *symmetric*. Asymmetric towers suit question→passage retrieval; a shared tower suits sentence similarity.",
        ],
        ru: [
          'Два знаковых би-энкодера задают шаблон. **DPR** (Karpukhin и др. 2020) использует **два раздельных энкодера** — один для вопросов, другой для пассажей — с **внутрибатчевыми негативами**, и пулит токеном \\([\\text{CLS}]\\); он *асимметричен* (запрос и документ — разные тексты). **SBERT** (Reimers и Gurevych 2019) — *сиамская* сеть (один общий энкодер), что **усредняет** векторы токенов и учится на NLI/STS; он *симметричен*. Асимметричные башни — для поиска вопрос→пассаж; общая башня — для близости предложений.',
        ],
        tt: [
          'Ике билгеле би-энкодер үрнәкне куя. **DPR** (Karpukhin һ.б. 2020) **ике аерым энкодер** куллана — берсе сораулар, икенчесе пассажлар өчен — **батч-эчендәге негативлар** белән, \\([\\text{CLS}]\\) токены белән пулинг ясый; ул *асимметрик*. **SBERT** (Reimers &amp; Gurevych 2019) — *сиам* челтәре (бер уртак энкодер), токен векторларын **уртачалый** һәм NLI/STS өйрәнә; ул *симметрик*. Асимметрик манаралар сорау→пассаж эзләүгә туры килә; уртак манара җөмлә охшашлыгына.',
        ],
      },
    },
