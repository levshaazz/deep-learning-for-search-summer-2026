    {
      id: 'stakes-scale', kind: 'prose',
      heading: { en: 'The scale of the thing', ru: 'Масштаб задачи', tt: 'Мәсьәләнең масштабы' },
      img: '_char/serega-cameo-puzzled.png', imgPos: 'mascot',
      imgAlt: {
        en: 'Serega scratching his head, puzzled by the sheer size of the problem.',
        ru: 'Серёга чешет затылок, озадаченный самим размером задачи.',
        tt: 'Серёга, мәсьәләнең үз зурлыгыннан аптырап, башын кашый.',
      },
      imgCaption: {
        en: 'Too much data, too little time — that tension is the whole course in one breath.',
        ru: 'Слишком много данных, слишком мало времени — это напряжение и есть весь курс в одном вдохе.',
        tt: 'Мәгълүмат артык күп, вакыт артык аз — бу киеренкелек бер сулыштагы бөтен курс ул.',
      },
      body: {
        en: [
          "Two numbers to set the mood. The web is around \\(10^{12}\\) pages — a trillion. And every single day, roughly 15% of queries are ones the engine has never seen before: brand-new phrasings, fresh news, typos no one anticipated. Sit with that for a second. You cannot pre-compute the answers, because a meaningful fraction of tomorrow's questions don't exist yet. And you cannot read everything when the user hits enter, because reading a trillion pages takes far longer than the quarter-second a user will wait before deciding your product is broken.",
          "So the naive plans both die immediately. Plan A — “answer every query in advance” — dies on the 15% you've never seen. Plan B — “scan the whole corpus on each query” — dies on the clock: even at a microsecond per document, a trillion documents is over a week of compute for one search. Neither brute force works. That's not a footnote; that's the reason this field exists.",
          "That tension — too much data, too little time — is the whole course in one sentence. Almost everything we build is a clever way to dodge it: indexes that let you jump straight to the few relevant documents without touching the rest; cheap models that quickly throw out the obvious junk so expensive models only judge a handful; approximate methods that trade a sliver of accuracy for a thousandfold speedup. Keep that trade-off in your pocket. Every technique in this course is, at heart, a negotiation between how good the answer is and how fast and cheaply you can get it.",
        ],
        ru: [
          'Два числа для настроения. Веб — это около \\(10^{12}\\) страниц, триллион. И каждый день примерно 15% запросов — те, которых движок никогда раньше не видел: новые формулировки, свежие новости, опечатки, которых никто не предвидел. Задержись на этом на секунду. Ответы не предвычислить, потому что заметная доля завтрашних вопросов ещё попросту не существует. И нельзя прочитать всё в момент, когда пользователь нажимает Enter, потому что прочитать триллион страниц куда дольше, чем те четверть секунды, что пользователь готов ждать, прежде чем решит, что твой продукт сломан.',
          'Поэтому оба наивных плана умирают сразу. План А — «ответить на каждый запрос заранее» — гибнет на тех 15%, которых вы никогда не видели. План Б — «сканировать весь корпус на каждый запрос» — гибнет по часам: даже по микросекунде на документ триллион документов — это больше недели вычислений на один поиск. Грубая сила не работает ни так, ни эдак. Это не сноска — это и есть причина, по которой существует вся область.',
          'Это напряжение — слишком много данных, слишком мало времени — и есть весь курс в одном предложении. Почти всё, что мы строим, — это хитрый способ его обойти: индексы, позволяющие прыгнуть прямо к нескольким релевантным документам, не трогая остальное; дешёвые модели, быстро отсеивающие очевидный мусор, чтобы дорогие судили лишь горстку; приближённые методы, меняющие крупицу точности на тысячекратное ускорение. Держи этот компромисс в кармане. Любая техника в этом курсе по сути — это торг между тем, насколько хорош ответ, и тем, как быстро и дёшево ты можешь его получить.',
        ],
        tt: [
          'Настроение өчен ике сан. Веб — бу якынча \\(10^{12}\\) бит, триллион. Һәм һәр көн якынча 15% сорау — двигатель элек беркайчан күрмәгәннәре: яңа формулировкалар, яңа яңалыклар, беркем дә көтмәгән хаталар. Моңа бер секундка тукталыгыз. Җаваплар алдан исәпләп булмый, чөнки иртәгесе сорауларның сизелерлек өлеше әле бөтенләй юк. Һәм кулланучы Enter баскан мизгелдә барысын да укып булмый, чөнки триллион битне уку — кулланучы продуктыгызны ватык дип уйлаганчы көтәргә әзер торган дүрттән бер секундтан күпкә озаграк.',
          'Шуңа күрә ике беркатлы план да шунда ук үлә. А планы — «һәр сорауга алдан җавап бирү» — сез беркайчан күрмәгән шул 15%-та һәлак була. Б планы — «һәр сорауда бөтен корпусны сканерлау» — сәгать буенча һәлак була: документка микросекунда тигәндә дә триллион документ — бер эзләүгә бер атнадан артык исәпләү. Тупас көч бер генә юл белән дә эшләми. Бу — искәрмә түгел, бу — бөтен өлкәнең яшәвенең сәбәбе.',
          'Бу киеренкелек — мәгълүмат артык күп, вакыт артык аз — бер җөмләдә бөтен курс ул. Без төзегәннең диярлек барысы да — аны әйләнеп үтүнең хәйләкәр ысулы: индекслар, калганын тимичә, берничә релевант документка туры сикерергә мөмкинлек бирәләр; арзан модельләр, ачык чүпне тиз генә бөртекләп, кыйммәтлеләр бары тик бер уч документны хөкем итсен өчен; якынча методлар, төгәллекнең бөртеген мең тапкыр тизләтүгә алыштыралар. Бу компромиссны кесәгездә тотыгыз. Бу курстагы теләсә кайсы техника асылда — җавапның никадәр яхшы булуы белән аны никадәр тиз һәм арзан алуыгыз арасындагы килешү.',
        ],
      },
    },
