    {
      id: 'acme-by-hand', kind: 'prose',
      heading: { en: "The answer that couldn't prove it was about ACME", ru: "Ответ, который не мог доказать, что он про ACME", tt: "Үзенең ACME турында икәнен исбат итә алмаган җавап" },
      body: {
        en: [
          "Come to my reading desk. I lay out one tiny memo about a company, ACME, and the captain hands me his query: *acme revenue growth*. I do it the naive way first — tear the memo into chunks, then score each torn page alone. The page that actually holds the answer reads *it highlighted 3% growth*. But *it* is a pronoun, and the name ACME sat two sentences up, on a page I already tore away. Cosine to the query: a limp \\(0.5164\\).",
          "Meanwhile a bland decoy — a chunk that literally says *revenue growth* about nobody in particular — scores \\(0.5774\\) and takes rank 1. My gold answer sits at rank 2, out-ranked by a distractor that shares the query's surface words but none of its meaning. The answer is lying right there on the desk, and retrieval walks straight past it, because the gold chunk cannot prove it is about ACME.",
          "Now read the whole memo first, *then* lay the ruler across the spine and pool. Full-document attention has already bled ACME-ness into that lonely *it* before I mark a single boundary. The gold chunk's cosine climbs to \\(0.7071\\) and steps into rank 1; the decoy drops behind it. Same text, same query, same index — the ordering simply inverts. That one flip is the whole lecture, measured.",
        ],
        ru: [
          "Подойди к моему читальному столу. Я раскладываю одну крошечную записку про компанию ACME, и капитан подаёт свой запрос: *acme revenue growth*. Сначала делаю наивно — рву записку на chunk'и и оцениваю каждую оторванную страницу отдельно. Страница, в которой и лежит ответ, гласит: *it highlighted 3% growth*. Но *it* — местоимение, а имя ACME стояло двумя предложениями выше, на странице, которую я уже оторвал. Косинус до запроса — вялые \\(0.5164\\).",
          "А тем временем пустая обманка — chunk, где буквально написано *revenue growth* и не сказано ни про кого конкретно, — набирает \\(0.5774\\) и встаёт на rank 1. Мой золотой ответ остаётся на rank 2: его обходит distractor, разделивший с запросом поверхностные слова, но не смысл. Ответ лежит прямо на столе, а поиск проходит мимо, потому что золотой chunk не может доказать, что он про ACME.",
          "Теперь сначала прочти всю записку целиком, *а потом* клади линейку вдоль корешка и пулингуй. Full-document attention успевает влить «ACME-ность» в это одинокое *it* ещё до того, как я отмечу хоть одну границу. Косинус золотого chunk'а поднимается до \\(0.7071\\) и шагает на rank 1; обманка проваливается назад. Тот же текст, тот же запрос, тот же индекс — а порядок просто переворачивается. Этот один переворот и есть вся лекция, измеренная числом.",
        ],
        tt: [
          "Уку өстәлемә кил. Мин ACME дигән компания турында бер кечкенә записка җәям, ә капитан үз соравын суза: *acme revenue growth*. Башта naive ысул белән эшлим — записканы chunk'ларга йолкыйм һәм һәр йолкынган битне аерым бәялим. Җавапны тотып торган бит: *it highlighted 3% growth* ди. Ләкин *it* — алмашлык, ә ACME исеме ике җөмлә өстә, инде йолкып алынган биттә иде. Сорауга cosine нибары \\(0.5164\\).",
          "Ә шул ук вакыт ялангач decoy — бары *revenue growth* дип язылган, беркем турында да булмаган chunk — \\(0.5774\\) җыя һәм rank 1гә менә. Минем алтын җавабым rank 2 дә кала: соравның өслек сүзләрен уртаклашкан, ләкин мәгънәсен түгел distractor аны узып китә. Җавап нәкъ өстәлдә ята, ә эзләү аның яныннан туры уза, чөнки алтын chunk үзенең ACME турында икәнен исбат итә алмый.",
          "Хәзер башта бөтен записканы укы, *аннан гына* линейканы теркәү буйлап сал да пул ясы. Full-document attention бер генә чикне билгеләгәнче үк, ялгыз *it*кә «ACME-лыкны» коеп өлгергән. Алтын chunk'ның cosine'ы \\(0.7071\\)гә күтәрелә һәм rank 1гә баса; decoy артка төшә. Шул ук текст, шул ук сорау, шул ук index — ә тәртип әйләнеп кенә куя. Менә шушы бер әйләнеш — бөтен лекция, сан белән үлчәнгән.",
        ],
      },
    },
