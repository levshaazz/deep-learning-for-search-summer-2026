    {
      id: 'turn-online', kind: 'prose',
      heading: { en: 'The real world votes with clicks', ru: 'Реальный мир голосует кликами', tt: 'Реаль дөнья кликлар белән тавыш бирә' },
      img: 'L4/L4-11-ab-parallel-universes.png',
      imgAlt: {
        en: 'An A/B test as two parallel universes: identical users split into two worlds, one served system A and one system B, then compared on real behaviour.',
        ru: 'A/B-тест как две параллельные вселенные: одинаковых пользователей делят на два мира, одному показывают систему A, другому B, и сравнивают по реальному поведению.',
        tt: 'A/B тест ике параллель галәм буларак: бертөрле кулланучыларны ике дөньяга бүләләр, берсенә A системасын, икенчесенә B ны күрсәтәләр, аннан реаль тәртип буенча чагыштыралар.',
      },
      imgCaption: {
        en: 'Run reality twice. Half your users live in a world with system A, half with B — then let their clicks settle the argument.',
        ru: 'Запусти реальность дважды. Половина пользователей живёт в мире с системой A, половина — с B, и пусть их клики решат спор.',
        tt: 'Реальлекне ике тапкыр эшләт. Кулланучыларыңның яртысы A системасы белән дөньяда яши, яртысы B белән — һәм аларның кликлары бәхәсне хәл итсен.',
      },
      body: {
        en: [
          "Everything so far happened in a lab on frozen labels — that's **offline** evaluation, and it's indispensable, but it's a proxy. The labels came from annotators guessing what users want, not from users. The corpus is a snapshot, not the live, drifting, seasonal stream of real queries. Offline tells you a change *might* help. Only the **online** world, real users in real time, tells you it *did*.",
          "The workhorse of online evaluation is the **A/B test**: split live traffic, send half to the old system and half to the new, and watch what people actually do — clicks, conversions, how long they stay. In our run the new system lifts click-through from 12% to 13.2%, a 10% relative gain, and with twenty thousand users behind it that clears significance comfortably (\\(p \\approx 0.01\\)). But the same statistical discipline from a moment ago applies with teeth: you need enough users for *power*, you have to fight novelty effects (anything new gets clicked just for being new) and seasonality, and you must not *peek* — checking the test every hour and stopping the moment it looks good is a fantastic way to declare victory on pure noise. The cardinal sin of online eval is calling a winner early. ([Kohavi, Tang & Xu (2020)](https://doi.org/10.1017/9781108653985) is the practitioner's bible for getting all of this right.)",
        ],
        ru: [
          'Всё до сих пор происходило в лаборатории, на замороженных метках — это **офлайн**-оценка, незаменимая, но это прокси. Метки пришли от разметчиков, угадывавших, чего хотят пользователи, а не от самих пользователей. Корпус — снимок, а не живой, дрейфующий, сезонный поток реальных запросов. Офлайн говорит, что изменение *может* помочь. И только **онлайн**-мир, реальные пользователи в реальном времени, говорит, что оно *помогло*.',
          'Рабочая лошадка онлайн-оценки — **A/B-тест**: раздели живой трафик, отправь половину на старую систему, половину на новую, и смотри, что люди реально делают — клики, конверсии, как долго остаются. В нашем прогоне новая система поднимает кликабельность с 12% до 13,2%, относительный прирост 10%, и при двадцати тысячах пользователей за спиной это уверенно берёт значимость (\\(p \\approx 0{,}01\\)). Но та же статистическая дисциплина, что и минуту назад, действует здесь во весь рост: пользователей нужно достаточно ради *мощности*, надо бороться с эффектом новизны (на новое кликают просто за то, что оно новое) и с сезонностью, и нельзя *подглядывать* — проверять тест каждый час и остановить его в миг, когда всё выглядит хорошо, — отличный способ объявить победу на чистом шуме. Кардинальный грех онлайн-оценки — назвать победителя слишком рано. ([Kohavi, Tang & Xu (2020)](https://doi.org/10.1017/9781108653985) — настольная книга о том, как сделать всё это правильно.)',
        ],
        tt: [
          'Барысы да хәзергә кадәр туңдырылган билгеләрдә лабораториядә булды — бу **офлайн** бәяләү, ул алыштыргысыз, ләкин ул прокси. Билгеләр кулланучылар нәрсә теләгәнен юраган разметчиклардан килде, кулланучылардан түгел. Корпус — бер мизгел сурәте (snapshot), ә реаль сорауларның тере, дрейфлый, сезонлы агымы түгел. Офлайн үзгәреш ярдәм итәргә *мөмкин* дип әйтә. Бары тик **онлайн** дөнья, реаль вакытта реаль кулланучылар гына аның ярдәм *иткәнен* әйтә.',
          'Онлайн бәяләүнең эшче аты — **A/B тест**: тере трафикны бүл, яртысын иске системага, яртысын яңасына җибәр, һәм кешеләр чынлап нәрсә эшләгәнен кара — кликлар, конверсияләр, ничек озак калалар. Безнең эшләтүдә яңа система кликларны 12% тән 13,2% кә күтәрә, чагыштырмача 10% үсеш, һәм артында егерме мең кулланучы белән бу ышанычлы рәвештә мөһимлекне ала (\\(p \\approx 0{,}01\\)). Ләкин бер минут элек булган шул ук статистик дисциплина тешләре белән кулланыла: *куәт* өчен җитәрлек кулланучы кирәк, яңалык эффекты белән (яңаны яңа булганы өчен генә кликлыйлар) һәм сезонлылык белән көрәшергә кирәк, һәм *күз салырга* ярамый — тестны һәр сәгать тикшерү һәм яхшы күренгән мизгелдә туктау — чиста шауда җиңү игълан итүнең искиткеч ысулы. Онлайн бәяләүнең кардиналь гөнаһы — җиңүчене бик иртә атау. ([Kohavi, Tang & Xu (2020)](https://doi.org/10.1017/9781108653985) — бөтен моны дөрес эшләүнең өстәл китабы.)',
        ],
      },
    },
