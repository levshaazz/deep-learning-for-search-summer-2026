    {
      id: 'catch-query-prefix', kind: 'prose',
      heading: { en: 'The prefix is not cosmetic', ru: 'Префикс — не косметика', tt: 'Префикс — косметика түгел' },
      body: {
        en: [
          "Act 2 said symmetry means one lemmatizer in both arms. Nothing is lemmatized in the dense arm, so it is easy to read that lesson as finished here. It is not — it only changes shape. The general form is the one this chapter keeps circling: **the same transformation on the query and on the corpus**, whatever that transformation happens to be.",
          "The E5 family makes it concrete. The `query: ` and `passage: ` prefixes are part of the input the model was trained on, not decoration. Encode the corpus as passages, hand the encoder a bare query, and you have fed it a distribution it never saw. The loss is silent: no exception, no log line, nothing red on any dashboard — just a quieter ranking. The same class of bug covers a corpus encoded with one model version and a query with another, or vectors normalized on one side and not the other.",
          "So ask what would have caught it, because that is the part worth carrying away. No unit test sees a prefix: both sides return vectors of the right shape, and the cosine comes out a perfectly plausible number. Only an end-to-end retrieval metric on held-out Russian queries catches it — the same answer this chapter gives to every question about which model to trust.",
        ],
        ru: [
          "Второй акт сказал: симметрия — это один лемматизатор в обоих плечах. В плотном плече ничего не лемматизируют, и урок легко счесть здесь исчерпанным. Он не исчерпан — он просто меняет форму. Общий вид тот, вокруг которого глава ходит кругами: **одно и то же преобразование на запросе и на корпусе**, каким бы это преобразование ни оказалось.",
          "Семейство E5 делает это осязаемым. Префиксы `query: ` и `passage: ` — часть входа, на котором модель училась, а не украшение. Закодируй корпус как пассажи, отдай энкодеру голый запрос — и ты скормил ему распределение, которого он не видел. Потеря бесшумна: ни исключения, ни строчки в логе, ни красного на дашборде — просто выдача стала тише. Тот же класс ошибки покрывает и корпус, закодированный одной версией модели, при запросе, закодированном другой, и нормировку векторов с одной стороны и не с другой.",
          "Поэтому спроси, чем бы ты это поймал: вот это и стоит унести. Юнит-тест префикса не видит — обе стороны возвращают векторы нужной формы, и косинус выходит вполне правдоподобным числом. Ловит только сквозная метрика поиска на отложенных русских запросах, а это тот же ответ, который глава даёт на любой вопрос «какой модели верить».",
        ],
        tt: [
          "Икенче акт: симметрия — ике җилкәдә дә бер лемматизатор дигән сүз иде. Плотный җилкәдә бернәрсә дә лемматизацияләнми, шуңа сабакны монда тәмамланган дип уку җиңел. Ул тәмамланмаган — ул бары формасын үзгәртә. Гомуми күренеше — бүлек тирәли әйләнеп йөргәне: **сорауда да, корпуста да бер үк үзгәртү**, ул үзгәртү нинди генә булмасын.",
          "E5 гаиләсе моны тотып карарлык итә. `query: ` һәм `passage: ` префикслары — model өйрәнгән керемнең өлеше, бизәк түгел. Корпусны passage итеп кодла, ә энкодерга ялангач сорау бир — һәм син аңа ул күрмәгән бүленешне ашаттың. Югалту тавышсыз: бер исключение дә, логда бер юл да, дашбордта бер кызыл да юк — бары бирелеш тынычланды. Шул ук класстагы хата model'нең бер версиясе белән кодланган корпусны икенче версия белән кодланган сорау янында да, бер якның векторларын нормалап, икенчесенекен нормаламауны да каплый.",
          "Шуңа моны нәрсә тотар иде дип сора — алып китәргә тиешле нәрсә нәкъ шул. Юнит-тест префиксны күрми: ике як та кирәкле формадагы векторлар кайтара, ә косинус бөтенләй ышанычлы сан булып чыга. Тота торган бердәнбер нәрсә — читкә куелган рус сорауларындагы очтан-очка эзләү метрикасы, ә бу — бүлекнең «кайсы model'гә ышанырга» дигән һәр сорауга бирә торган җавабы.",
        ],
      },
    },
