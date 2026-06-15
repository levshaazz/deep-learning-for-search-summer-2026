    {
      id: 'depth-why-late', kind: 'prose',
      heading: { en: 'The late-interaction sweet spot', ru: 'Золотая середина позднего взаимодействия', tt: 'Соңгы тәэсир итешүнең алтын уртасы' },
      body: {
        en: [
          "Late interaction earns its keep on two axes at once. On **quality**, per-token vectors see the rare words and exact phrases that a single pooled vector blurs — close to the cross-encoder's reading. On **cost**, the document tokens are encoded offline and cached, so at query time you pay only for \\(|q| \\times |d|\\) cheap dot products, not a transformer pass over the joined pair.",
          "That is the bargain the bi-encoder and the cross-encoder each give up half of: the bi-encoder keeps the precompute but loses the detail; the cross-encoder keeps the detail but loses the precompute. ColBERT keeps both — at the price of storage, which is the next concern.",
        ],
        ru: [
          "Позднее взаимодействие окупается сразу по двум осям. По **качеству** потокенные векторы видят редкие слова и точные фразы, которые один свёрнутый вектор размывает, — близко к чтению кросс-энкодера. По **цене** токены документа кодируются офлайн и кэшируются, поэтому на запросе платишь лишь за \\(|q| \\times |d|\\) дешёвых скалярных произведений, а не за проход трансформера по склеенной паре.",
          "Это та сделка, от половины которой отказывается каждый: би-энкодер сохраняет предвычисление, но теряет деталь; кросс-энкодер сохраняет деталь, но теряет предвычисление. ColBERT сохраняет оба — ценой хранения, и это следующая забота.",
        ],
        tt: [
          "Соңгы тәэсир итешү бер үк вакытта ике күчәр буенча үзен аклый. **Сыйфат** буенча потокенлы векторлар сирәк сүзләрне һәм төгәл гыйбарәләрне күрә, аларны бер җыелган вектор томанлый, — кросс-энкодер укуына якын. **Хак** буенча документ токеннары офлайн кодлана һәм кэшләнә, шуңа сорауда син бары \\(|q| \\times |d|\\) арзан скаляр тапкырчыгыш өчен түлисең, ябыштырылган пар буенча трансформер узуы өчен түгел.",
          "Бу — һәркайсы яртысыннан баш тарткан килешү: би-энкодер алдан исәпләүне саклый, әмма детальне югалта; кросс-энкодер детальне саклый, әмма алдан исәпләүне югалта. ColBERT икесен дә саклый — саклау бәясенә, һәм бу — киләсе кайгы.",
        ],
      },
    },
