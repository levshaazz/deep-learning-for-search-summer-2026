    {
      id: 'climb-latency-worked', kind: 'prose',
      heading: { en: 'The latency budget', ru: 'Бюджет задержки', tt: 'Тоткарлык бюджеты' },
      img: 'L9/L9-07-latency-budget.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Séréga watches a p99 SLA dial as a request runs the pipeline; a budget meter fills to 89/200 ms and stays green.',
        ru: 'Серёга смотрит на циферблат p99 SLA, пока запрос идёт по конвейеру; счётчик бюджета заполняется до 89/200 мс и остаётся зелёным.',
        tt: 'Серёга, сорау конвейер буйлап барганда, p99 SLA циферблатына карый; бюджет санагычы 89/200 мс га тула һәм яшел кала.',
      },
      body: {
        en: [
          "A production search has a hard latency SLA — and it is measured at the **p99**, the slow tail, not the friendly average. Lay the request path out hop by hop and add it up.",
          ":::calc client→API \\(3\\) + embed query \\(8\\) + ANN search over \\(10^6\\) quantized vectors \\(12\\) + re-rank top-100 with the cross-encoder \\(60\\) + cache & log (async) \\(2\\) + response \\(4\\) \\(= \\mathbf{89}\\) ms, comfortably under the \\(200\\) ms SLA. An *exact* scan of \\(10^6 \\times 768\\)-d vectors would cost \\(\\approx 520\\) ms for the search hop alone — it blows the budget by itself. A warm cache hit returns in \\(\\approx 5\\) ms. :::",
          "Read the budget and the levers fall out. **ANN** turns the \\(520\\) ms scan into \\(12\\) ms — the whole reason this lecture exists. **Quantization** keeps the index in RAM so that \\(12\\) ms stays \\(12\\) ms. **Caching** makes repeated queries nearly free. And the re-rank — the most expensive hop at \\(60\\) ms — runs on only the *hundred* candidates ANN returned, not the billion. The cascade from Lecture 7 now sits *behind* the lanes.",
        ],
        ru: [
          "У продакшн-поиска жёсткий SLA по задержке — и измеряют его по **p99**, медленному хвосту, а не по удобному среднему. Разложим путь запроса по шагам и сложим.",
          ":::calc клиент→API \\(3\\) + эмбеддинг запроса \\(8\\) + ANN-поиск по \\(10^6\\) квантованным векторам \\(12\\) + переранжирование топ-100 кросс-энкодером \\(60\\) + кэш и лог (асинхр.) \\(2\\) + ответ \\(4\\) \\(= \\mathbf{89}\\) мс, уверенно под SLA \\(200\\) мс. *Точное* сканирование \\(10^6 \\times 768\\)-d векторов стоило бы \\(\\approx 520\\) мс на одном шаге поиска — оно само пробивает бюджет. Тёплое попадание в кэш возвращается за \\(\\approx 5\\) мс. :::",
          "Прочти бюджет — и рычаги видны сами. **ANN** превращает \\(520\\) мс скана в \\(12\\) мс — вся причина существования этой лекции. **Квантизация** держит индекс в RAM, чтобы эти \\(12\\) мс оставались \\(12\\) мс. **Кэш** делает повторные запросы почти бесплатными. А переранжирование — самый дорогой шаг в \\(60\\) мс — работает лишь над *сотней* кандидатов от ANN, а не над миллиардом. Каскад из лекции 7 теперь стоит *за* коридорами.",
        ],
        tt: [
          "Продакшн эзләүнең каты тоткарлык SLA сы бар — һәм аны **p99** буенча, акрын койрык буенча үлчиләр, уңайлы урталык буенча түгел. Сорау юлын адымлап җәеп салыйк һәм кушыйк.",
          ":::calc клиент→API \\(3\\) + сорауны эмбеддлау \\(8\\) + \\(10^6\\) квантланган вектор буенча ANN эзләве \\(12\\) + кросс-энкодер белән топ-100 яңадан ранжлау \\(60\\) + кэш һәм лог (асинхр.) \\(2\\) + җавап \\(4\\) \\(= \\mathbf{89}\\) мс, \\(200\\) мс SLA астында иркен. \\(10^6 \\times 768\\)-d векторларны *төгәл* сканлау бары эзләү адымы өчен генә \\(\\approx 520\\) мс торыр иде — ул бюджетны үзе үк ярып чыга. Җылы кэш эләгүе \\(\\approx 5\\) мс та кайта. :::",
          "Бюджетны укы — һәм рычаглар үзләре күренә. **ANN** \\(520\\) мс сканны \\(12\\) мс ка әйләндерә — бу лекциянең бөтен сәбәбе. **Квантизация** индексны RAM да тота, шуңа ул \\(12\\) мс \\(12\\) мс булып кала. **Кэш** кабат сорауларны диярлек бушлай итә. Ә яңадан ранжлау — \\(60\\) мс лы иң кыйммәт адым — ANN кайтарган бары *йөз* кандидат өстендә эшли, миллиард өстендә түгел. 7 нче лекция каскады хәзер коридорлар *артында* тора.",
        ],
      },
    },
