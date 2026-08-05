    {
      id: 'turn-scoring', kind: 'prose',
      heading: { en: 'Matching isn’t ranking', ru: 'Совпадение — это не ранжирование', tt: 'Туры килү — ранжлау түгел' },
      body: {
        en: [
          "Now watch a quieter failure. Ask the catalog for documents that contain *both* of two query words and sometimes you get back… nothing. A strict boolean AND is brittle: one missing word and a genuinely great document is exiled. Loosen it to OR and you get the opposite disaster — hundreds of documents, all technically matching, none of them ordered. The index tells you *which* documents qualify. It says nothing about which are *best*.",
          "Matching is binary; relevance is a spectrum. A document that uses your rare keyword five times in two sentences is almost certainly more on-topic than one that mentions it once in a footnote — and a word that appears in *every* document tells you nothing at all about which to prefer. So the classic recipe has two instincts baked in: reward rare words more than common ones, and don't let a single word repeated a hundred times drown out everything else. Hold those two instincts. We're about to make them arithmetic.",
        ],
        ru: [
          'Теперь второй провал — не такой громкий. Спроси каталог о документах, содержащих сразу *оба* слова запроса, — и иногда получишь… ничего. Строгое булево AND хрупко: одно недостающее слово, и по-настоящему отличный документ отправлен в изгнание. Ослабь до OR — и получишь обратную катастрофу: сотни документов, все формально совпадают, ни один не упорядочен. Индекс говорит, *какие* документы подходят. Он молчит о том, какие *лучшие*.',
          'Совпадение бинарно; релевантность — спектр. Документ, где твоё редкое слово стоит пять раз в двух предложениях, почти наверняка ближе к теме, чем тот, где оно мелькнуло раз в сноске, — а слово, которое есть в *каждом* документе, вообще ничего не говорит о выборе. Поэтому в классическом рецепте зашиты два инстинкта: награждать редкие слова сильнее частых и не давать одному слову, повторённому сто раз, заглушить всё остальное. Запомни эти два инстинкта. Сейчас мы сделаем их арифметикой.',
        ],
        tt: [
          'Хәзер тынрак уңышсызлыкка кара. Каталогтан сорауның ике сүзенең *икесен дә* эченә алган документларны сора — һәм кайчак син кире… бернәрсә алмыйсың. Каты логик AND нык сынучан: бер сүз җитми, һәм чыннан да шәп документ сөргенгә җибәрелә. Аны OR га бушат — һәм киресенчә фаҗига аласың: йөзләрчә документ, барысы да рәсми рәвештә туры килә, берсе дә тәртипкә салынмаган. Индекс сиңа *кайсы* документлар туры килүен әйтә. Ул кайсылары *иң яхшы* икәне турында дәшми.',
          'Туры килү бинар; релевантлык — спектр. Синең сирәк сүзең ике җөмләдә биш тапкыр торган документ, билгеле, искәрмәдә бер тапкыр җемелдәгәненнән теманы якынрак, ә *һәр* документта булган сүз сайлау турында бөтенләй бернәрсә әйтми. Шуңа күрә классик рецептта ике инстинкт салынган: сирәк сүзләрне еш сүзләрдән көчлерәк бүләкләргә һәм йөз тапкыр кабатланган бер сүзгә калганын тончыктырырга бирмәскә. Бу ике инстинктны истә тот. Хәзер без аларны арифметика итәчәкбез.',
        ],
      },
    },
