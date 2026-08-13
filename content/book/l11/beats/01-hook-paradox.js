    {
      id: 'hook-paradox', kind: 'prose',
      heading: { en: 'Same code, a different blade', ru: 'Тот же код — другой клинок', tt: 'Шул ук код — башка пычак' },
      img: 'L13/L13-01-two-blades.png', imgPos: 'hero',
      imgAlt: {
        en: "Two blades forged from the same steel — one keen and bright, one dull and notched. Same code, same data; only the opponents differed.",
        ru: "Два клинка, выкованных из одной стали, — один острый и светлый, другой тупой и зазубренный. Тот же код, те же данные; различались лишь противники.",
        tt: "Бер үк корычтан сугылган ике пычак — берсе үткен һәм якты, икенчесе тупас һәм кителгән. Шул ук код, шул ук мәгълүмат; бары тик көндәшләр генә башка булды.",
      },
      imgCaption: {
        en: "Same forge, two edges. What separated them was the **negatives** each blade was sharpened against.",
        ru: "Одна кузница — две кромки. Разделил их выбор **негативов**, о которые точили каждый клинок.",
        tt: "Бер кузница — ике кырый. Аларны һәр пычакны үткенләгән **негативлар** аерды.",
      },
      body: {
        en: [
          "In the last chapter you built the Scout: a bi-encoder that turns a query and a passage into two vectors and learns by pulling the right passage close and pushing the wrong ones away. We took the wrong ones from whatever happened to be in the batch, and moved on. That choice was never innocent. Two teams clone the same dense-retriever code, train on the same data with the same architecture. One ends up finding the right passage almost every time; the other barely beats keyword search. The only thing they chose differently was the **negatives** — the wrong answers each query is taught to push away.",
          "The team that built one of the first strong dense retrievers said it plainly: how you select negative examples *is often overlooked, but can be decisive*. This chapter is that sentence, unfolded.",
          "Picture the retriever as a blade and training as a forge. You cannot sharpen a blade against air — it is the **opponents** it spars against that give it an edge. Choose them badly and the edge never forms; choose them worse and it dulls.",
        ],
        ru: [
          "В прошлой главе ты собрал Разведчика: би-энкодер, который превращает запрос и пассаж в два вектора и учится, притягивая правильный пассаж и отталкивая неправильные. Неправильные мы брали из того, что случайно оказалось в батче, — и пошли дальше. Этот выбор никогда не был невинным. Две команды берут один и тот же код плотного ретривера, обучают на одних данных с одной архитектурой. Одна почти всегда находит нужный пассаж; другая едва обгоняет поиск по ключевым словам. Различались они лишь выбором **негативов** — неправильных ответов, которые каждый запрос учится отталкивать.",
          "Команда, построившая один из первых сильных плотных ретриверов, сказала прямо: то, как выбираются негативные примеры, *часто упускают из виду, но это может быть решающим*. Эта глава — раскрытие той фразы.",
          "Представь ретривер как клинок, а обучение — как кузницу. Клинок не заточить о воздух — остроту дают **противники**, с которыми он ведёт спарринг. Выбери их плохо — остроты не будет; выбери ещё хуже — клинок затупится.",
        ],
        tt: [
          "Узган бүлектә син Разведчикны кордың: сорауны һәм пассажны ике векторга әйләндерүче би-энкодер; ул дөрес пассажны якынайтып, дөрес булмаганнарын этеп өйрәнә. Дөрес булмаганнарын без батчта очраклы рәвештә булганнардан алдык та алга киттек. Бу сайлау беркайчан да гөнаһсыз булмаган. Ике команда бер үк тыгыз ретривер кодын ала, бер үк мәгълүматта, бер үк архитектура белән өйрәтә. Берсе кирәкле пассажны диярлек һәрвакыт таба; икенчесе ачкыч сүзләр буенча эзләүне көчкә уза. Алар бары тик **негативлар** сайлавы белән аерылды — һәр сорау этәргә өйрәнә торган дөрес булмаган җаваплар.",
          "Беренче көчле тыгыз ретриверларның берсен төзегән команда туры әйтте: негатив мисалларны ничек сайлау *еш кына игътибардан читтә кала, ләкин хәлиткеч булырга мөмкин*. Бу бүлек — шул җөмләне ачу.",
          "Ретриверны пычак, ә өйрәтүне тимерче миче итеп күз алдына китер. Пычакны һавага каршы үткенләп булмый — үткенлекне ул спарринг ясый торган **көндәшләр** бирә. Аларны начар сайла — үткенлек булмас; тагын да начаррак сайла — пычак тупасланыр.",
        ],
      },
    },
