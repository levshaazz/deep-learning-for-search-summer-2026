    {
      id: 'catch-mlm-8020', kind: 'prose',
      heading: { en: "Why not always [MASK]: the 80/10/10 theatre", ru: "Почему не всегда [MASK]: театр 80/10/10", tt: "Ни өчен һәрвакыт [MASK] түгел: 80/10/10 театры" },
      body: {
        en: [
          "There is a trap hidden inside the mending lesson, and the first weavers spotted it. Suppose every hidden thread literally became \\([MASK]\\). The loom would then learn a lazy rule: *work hard only where the mask token stands; everywhere else, coast.* But at fine-tuning time — the entire life the model is actually built for — the token \\([MASK]\\) **never appears at all**. The loom would have trained itself on a signal its real work never shows: a clean train/inference mismatch.",
          "Hence the little theatre. Of the threads chosen for hiding, only **80%** become a literal \\([MASK]\\); **10%** are swapped for a random thread, and **10%** are left untouched — yet still must be predicted. Now no position grants the right to coast: an innocent-looking thread may be an impostor, an untouched one may be the exam. The only strategy that survives is to build an honest representation of *every* thread on the sheet — which is exactly what we wanted the loom to learn all along.",
        ],
        ru: [
          "В уроке штопки спрятана ловушка, и первые ткачи её разглядели. Представь, что каждая спрятанная нить буквально становилась бы \\([MASK]\\). Тогда станок выучил бы ленивое правило: *старайся только там, где стоит токен маски; во всех остальных местах — халтурь*. Но на дообучении — а это вся жизнь, ради которой модель и строится, — токен \\([MASK]\\) **не появляется вовсе**. Станок натренировался бы на сигнал, которого в его настоящей работе нет: чистый рассинхрон между обучением и применением.",
          "Отсюда маленький театр. Из нитей, выбранных для прятанья, лишь **80%** становятся буквальным \\([MASK]\\); **10%** подменяются случайной нитью, а **10%** остаются нетронутыми — но угадать их всё равно нужно. Теперь ни одна позиция не даёт права халтурить: невинная с виду нить может оказаться подменой, нетронутая — экзаменом. Выживает единственная стратегия — строить честное представление *каждой* нити полотна. А это ровно то, чему мы и хотели научить станок с самого начала.",
        ],
        tt: [
          "Ямау дәресендә тозак яшеренгән, һәм беренче тукучылар аны күреп алган. Күз алдыңа китер: һәр яшерелгән җеп сүзгә-сүз \\([MASK]\\) булып китсен. Ул чакта станок ялкау кагыйдә өйрәнер иде: *маска токены торган урында гына тырыш; калган бөтен җирдә — җилкә сикерт*. Ләкин fine-tuning вакытында — ә бу модель төзелгән бөтен тормыш — \\([MASK]\\) токены **бөтенләй күренми**. Станок үзен чын эшендә булмаган сигналга өйрәткән булыр иде: өйрәтү белән куллану арасындагы саф аерылу.",
          "Шуннан кечкенә театр. Яшерүгә сайланган җепләрнең бары **80%'ы** сүзгә-сүз \\([MASK]\\) була; **10%'ы** очраклы җепкә алмаштырыла, ә **10%'ы** тимәгән килеш кала — ләкин аларны барыбер табарга кирәк. Хәзер бер позиция дә җилкә сикертергә хокук бирми: гаепсез күренгән җеп алмаштырылган булып чыгарга мөмкин, тимәгәне — имтихан. Бердәнбер исән калучы стратегия — тукыманың *һәр* җебенә намуслы күзаллау төзү. Ә бу — станокны иң башыннан ук өйрәтергә теләгәнебезнең нәкъ үзе.",
        ],
      },
    },
