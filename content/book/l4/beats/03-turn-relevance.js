    {
      id: 'turn-relevance', kind: 'prose',
      heading: { en: 'Ground truth', ru: 'Истина', tt: 'Хакыйкать' },
      img: 'L4/L4-02-qrels-referee.png',
      imgAlt: {
        en: 'A human assessor as referee stamping each query-document pair relevant or not — the qrels every metric is scored against.',
        ru: 'Человек-асессор в роли судьи ставит штамп «релевантно / нет» на каждую пару запрос–документ — это qrels, относительно которых считается любая метрика.',
        tt: 'Хаким ролендәге кеше-асессор һәр сорау–документ парына «релевант / юк» дигән мөһер сала — бу qrels, аларга карата теләсә нинди метрика исәпләнә.',
      },
      imgCaption: {
        en: 'No answer key, no grade. A human stamps each result relevant or not — and only then can the scoreboard tell the truth.',
        ru: 'Нет ключа — нет оценки. Человек ставит штамп «релевантно / нет» на каждый результат — и только тогда табло может сказать правду.',
        tt: 'Ачкыч юк — бәя юк. Кеше һәр нәтиҗәгә «релевант / юк» дигән мөһер сала — һәм бары тик шунда гына табло хакыйкатьне әйтә ала.',
      },
      body: {
        en: [
          "The answer key has a name in IR: **relevance judgments**, or *qrels* for short. At bottom a qrel is the simplest possible thing — a label on a query-document pair: this document is relevant to this query, or it isn't. Pile up enough of those labels and you can grade any ranking any system produces, because you finally know what \"right\" looks like.",
          "Real test collections get these labels from human annotators, slowly and expensively, which is a whole problem we'll dig into next. For our worked example we'll borrow a clean shortcut we set up earlier: our 20-Newsgroups documents already carry category labels from when they were posted. So for the query intent \"space\", we'll simply call a document relevant exactly when it comes from the space category. It's a stand-in, not a real human judgment — but it's consistent and reproducible, and it lets every ranking we built in the last chapter finally get a grade.",
        ],
        ru: [
          'У ключа с ответами в IR есть имя: **суждения о релевантности**, или коротко *qrels*. По сути qrel — это простейшая штука, метка на паре запрос–документ: релевантен этот документ этому запросу или нет. Накопи достаточно таких меток — и сможешь оценить любое ранжирование любой системы, ведь теперь ты знаешь, как выглядит «правильно».',
          'Настоящие тестовые коллекции получают эти метки от людей-асессоров, медленно и дорого, — целая проблема, в которую мы дальше копнём. Для нашего примера возьмём чистый приём, заготовленный раньше: документы 20 Newsgroups несут метки категорий ещё с момента публикации. Поэтому для запроса «space» назовём документ релевантным ровно тогда, когда он из космической категории. Это заменитель, а не настоящее человеческое суждение, — но он непротиворечив и воспроизводим, и он-то наконец позволяет поставить оценку каждому ранжированию, что мы построили в прошлой главе.',
        ],
        tt: [
          'IR-да җаваплар ачкычының исеме бар: **релевантлык бәяләре**, яки кыскача *qrels*. Асылда qrel — иң гади нәрсә: сорау–документ парына билге: бу документ бу сорауга релевантмы яки юкмы. Андый билгеләрне җитәрлек җый — һәм теләсә нинди системаның теләсә нинди ранжлавын бәяли алырсың, чөнки ниһаять «дөрес» нинди күренгәнен беләсең.',
          'Чын тест коллекцияләре бу билгеләрне кеше-разметчиклардан ала, әкрен һәм кыйммәт, — алга таба казыначак бөтен бер проблема. Безнең тикшерелгән мисал өчен үткәннәрдән саф алым алыйк: 20 Newsgroups документлары инде басылган вакыттан категория билгеләрен йөртә. Шуңа күрә «space» соравы өчен документны нәкъ ул космос категориясеннән булганда релевант дип атыйк. Бу алмаштыргыч, чын кеше бәясе түгел, — ләкин ул каршылыксыз һәм кабатлана ала, һәм ул ниһаять үткән бүлектә төзегән һәр ранжлауны бәяләргә мөмкинлек бирә.',
        ],
      },
    },
