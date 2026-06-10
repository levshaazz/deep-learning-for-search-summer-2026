    {
      id: 'problem-eyeballing', kind: 'prose',
      img: 'L4/L4-01-cant-eyeball.png',
      imgAlt: {
        en: 'Serega overwhelmed by a wall of millions of queries — intuition fails at scale, you need metrics over judged data.',
        ru: 'Серёга, погребённый под стеной из миллионов запросов, — интуиция отказывает на масштабе, нужны метрики по размеченным данным.',
        tt: 'Серёга миллионнарча сораудан торган стена астында күмелгән — интуиция масштабта эшләми, бәяләнгән мәгълүмат буенча метрикалар кирәк.',
      },
      imgCaption: {
        en: 'You can eyeball ten results. You cannot eyeball ten thousand queries twice a day — and that\'s the real job.',
        ru: 'Десять результатов глазом оценишь. Десять тысяч запросов дважды в день — нет, а именно это и есть работа.',
        tt: 'Ун нәтиҗәне күз белән бәяли аласың. Ун мең сорауны көненә ике тапкыр — юк, ә нәкъ менә шул эш.',
      },
      body: {
        en: [
          "You can eyeball ten results. You can squint at a hundred. You cannot eyeball ten thousand queries, twice a day, on every single code change — and that's the real workload, because search teams ship constantly and each ship can quietly break something. Eyeballing doesn't scale, and worse, it doesn't catch the *small* regressions: the change that makes results 2% worse on average is invisible to a human and catastrophic to a business.",
          "So we need a metric — a number per ranking. But a metric is useless without something to compare against: you can't grade an exam without an answer key. That answer key is called **ground truth**, and for search it means knowing, for some set of queries, which documents are actually relevant. Get that, and a vague feeling becomes arithmetic. The whole rest of this chapter is two questions: where does the answer key come from, and how do we turn it into a fair score?",
        ],
        ru: [
          'Десять результатов можно оценить на глаз. На сотню можно прищуриться. Но десять тысяч запросов — дважды в день, на каждое изменение кода — на глаз не оценишь, а это и есть реальная нагрузка, потому что поисковые команды катят релизы постоянно, и каждый может тихо что-то сломать. Глаз не масштабируется и, хуже того, не ловит *мелкие* регрессии: изменение, делающее результаты в среднем на 2% хуже, для человека невидимо, а для бизнеса катастрофично.',
          'Значит, нужна метрика — число на ранжирование. Но метрика бесполезна без того, с чем сравнивать: экзамен не оценить без ключа с ответами. Этот ключ называется **истиной** (ground truth), и для поиска он значит — знать для какого-то набора запросов, какие документы действительно релевантны. Получи его — и смутное ощущение станет арифметикой. Весь остаток главы — два вопроса: откуда берётся ключ с ответами и как превратить его в честную оценку.',
        ],
        tt: [
          'Ун нәтиҗәне күз белән бәяли аласың. Йөзенә күзеңне кысып карый аласың. Ләкин ун мең сорауны — көненә ике тапкыр, кодның һәр үзгәрешенә — күз белән бәяли алмыйсың, ә нәкъ менә шул чын йөкләмә, чөнки эзләү командалары релизларны даими чыгаралар, һәм һәркайсы тыныч кына нәрсәдер ватарга мөмкин. Күз масштаблашмый һәм, тагын да начаррак, *вак* регрессияләрне тотмый: нәтиҗәләрне уртача 2% начарайткан үзгәреш кеше өчен күренми, ә бизнес өчен һәлакәтле.',
          'Димәк, метрика кирәк — ранжлауга бер сан. Ләкин нәрсә белән чагыштырырга юк икән, метрика файдасыз: имтиханны җаваплар ачкычысыз бәяли алмыйсың. Бу ачкыч **хакыйкать** дип атала (ground truth), һәм эзләү өчен ул — нинди дә булса сораулар җыелмасы өчен кайсы документларның чыннан да релевант икәнен белү дигән сүз. Аны ал — һәм томанлы тойгы арифметикага әйләнер. Бүлекнең калган өлеше — ике сорау: җаваплар ачкычы каян килә һәм аны намуслы бәягә ничек әйләндерергә.',
        ],
      },
    },
