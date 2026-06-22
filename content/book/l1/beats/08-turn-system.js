    {
      id: 'turn-system', kind: 'prose',
      heading: { en: 'A demo is not a system', ru: 'Демо — это не система', tt: 'Демо — бу система түгел' },
      img: 'L1/L1-32-not-a-system.png', imgPos: 'scene',
      imgAlt: {
        en: 'Serega proudly holds a laptop showing accuracy 0.92, dwarfed by a huge tangled production machine of pipes and gauges behind him',
        ru: 'Серёга гордо держит ноутбук с accuracy 0,92, а позади его затмевает огромная запутанная продакшн-машина из труб и датчиков',
        tt: 'Серёга accuracy 0,92 күрсәткән ноутбукны горур тота, ә артында аны торбалар һәм датчиклардан торган зур буталчык продакшн-машина каплый',
      },
      imgCaption: {
        en: 'A model.fit() cell that scores 0.92 has solved maybe 5% of the problem. The other 95% is everything around it.',
        ru: 'Ячейка model.fit() с результатом 0,92 решила, может, 5% задачи. Остальные 95% — это всё, что вокруг неё.',
        tt: '0,92 нәтиҗәле model.fit() күзәнәге мәсьәләнең, бәлки, 5%-ын чишкән. Калган 95% — аның тирәсендәге барлык нәрсә.',
      },
      body: {
        en: [
          "Great — we can find the record once, in a notebook. The cascade works, the numbers look good, the demo lands. But a notebook isn't a product, and this is the moment the ground shifts under the whole lecture: *a model in a notebook is not a system.*",
          "Be concrete about how big the gap is. You wrote a `model.fit()` cell, it scored 0.92 on a held-out set, and it *feels* like you've solved the problem. You've solved maybe **5%** of it. The other 95% is everything the notebook quietly assumed away: where does the data come from, and who keeps it flowing? How is every feature computed *identically* at training time and at serving time? How do predictions come back in under 200 milliseconds, for thousands of users at once, when the cache is cold right after a deploy? Who notices when results slowly get worse — given that nothing ever throws an error? When and how do you retrain, and how do you roll back the night a release goes bad?",
          "The instant real users arrive, all of that surfaces, and it surfaces as the part of the iceberg below the waterline. The demo was the gleaming tip in the sun. The system is the vast, cold mass underneath that actually keeps search alive — and that's where production search lives or dies. So we pivot: from *what is search* to *how do you ship it and keep it breathing*. The second mission of the day starts here.",
        ],
        ru: [
          'Отлично — мы можем найти запись один раз, в ноутбуке. Каскад работает, числа выглядят хорошо, демо заходит. Но ноутбук — это не продукт, и именно сейчас почва уходит из-под всей лекции: *модель в ноутбуке — это не система.*',
          'Будем конкретны насчёт размера разрыва. Ты написал ячейку `model.fit()`, она дала 0,92 на отложенной выборке, и *кажется*, что задача решена. Решено, может, **5%** её. Остальные 95% — всё, что ноутбук тихо принял как данность: откуда берутся данные и кто поддерживает их поток? Как каждый признак вычисляется *одинаково* во время обучения и во время обслуживания? Как предсказания возвращаются меньше чем за 200 миллисекунд, для тысяч пользователей разом, когда кэш холодный сразу после деплоя? Кто замечает, что результаты медленно ухудшаются — учитывая, что никакой ошибки никогда не выбрасывается? Когда и как переобучать и как откатиться той ночью, когда релиз пошёл не так?',
          'В тот миг, когда приходят реальные пользователи, всё это всплывает — и всплывает как та часть айсберга, что скрыта под водой. Демо было блестящей верхушкой на солнце. Система — это огромная холодная масса под ней, которая на самом деле держит поиск живым, и именно там продакшн-поиск живёт или умирает. Так что мы разворачиваемся: от *что такое поиск* к *как его выкатить и не дать ему задохнуться*. Вторая миссия дня начинается здесь.',
        ],
        tt: [
          'Бик яхшы — без язманы бер тапкыр, ноутбукта таба алабыз. Каскад эшли, саннар яхшы күренә, демо барып җитә. Ләкин ноутбук — продукт түгел, һәм нәкъ хәзер бөтен лекция астындагы җир кузгала: *ноутбуктагы модель — система түгел.*',
          'Аерманың никадәр зур икәне турында конкрет булыйк. Син `model.fit()` күзәнәген яздың, ул читләтелгән җыелышта 0,92 бирде, һәм *тоела* ки, мәсьәләне чиштең. Син аның, бәлки, **5%-ын** чиштең. Калган 95% — ноутбук тавышсыз әйтелмеш кабул иткән барлык нәрсә: мәгълүмат кайдан килә һәм аның агымын кем тота? Һәр билге укыту вакытында да, хезмәт күрсәтү вакытында да ничек *бертөрле* исәпләнә? Фаразлар деплойдан соң кэш салкын булганда, бер үк вакытта меңләгән кулланучы өчен, 200 миллисекундтан азрак эчендә ничек кайта? Нәтиҗәләрнең әкренләп начарланганын кем сизә — берни беркайчан хата ыргытмаганны исәпкә алып? Кайчан һәм ничек яңадан укытасың, һәм релиз начар киткән төндә ничек кире кайтасың?',
          'Чын кулланучылар килгән мизгелдә, болар барысы калкып чыга — һәм су астындагы айсбергның өлеше булып калка. Демо кояшта ялтыраган түбә иде. Система — астындагы зур салкын масса, ул чынлыкта эзләүне тере тота, һәм нәкъ шунда продакшн-эзләү яши яки үлә. Шуңа күрә без борылабыз: *эзләү нәрсә* дигәннән *аны ничек чыгарырга һәм сулыш алырлык тотарга* дигәнгә. Көннең икенче миссиясе шуннан башлана.',
        ],
      },
    },
