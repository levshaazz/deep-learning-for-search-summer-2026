    {
      id: 'turn-headtohead', kind: 'prose',
      heading: { en: 'Two systems, one number each', ru: 'Две системы, по одному числу', tt: 'Ике система, һәркайсына бер сан' },
      body: {
        en: [
          "Back to the very first problem: two systems, both look fine, which is better. Now we have a metric, so let's do the obvious thing — run both over a set of queries, average their nDCG, and compare. System B scores about 0.64, System A about 0.60. B wins by roughly four hundredths of a point. Ship B, right?",
          "Not so fast, and this is the beat that separates careful people from confident ones. That single average hides a riot of per-query variation. Look underneath and B beats A on most queries — but on several queries A actually *wins*, sometimes by more than the average gap. The mean is a smooth lie told over a bumpy reality. Four hundredths could be a real, durable improvement, or it could be the luck of which fifteen queries happened to land in your test set. If you'd drawn a different fifteen, would B still win? That is exactly the question the next figure forces us to answer honestly — and \"the average is higher\" is not an answer.",
        ],
        ru: [
          'Назад к самой первой проблеме: две системы, обе выглядят прилично, какая лучше. Теперь у нас есть метрика, так сделаем очевидное — прогоним обе по набору запросов, усредним их nDCG, сравним. Система B даёт около 0,64, система A — около 0,60. B побеждает примерно на четыре сотых очка. Катим B, да?',
          'Не так быстро, и это тот самый такт, который отделяет аккуратных от самоуверенных. За единственным средним прячется буря разброса по отдельным запросам. Загляни под него — и B обходит A на большинстве запросов, но на нескольких A и впрямь *побеждает*, иногда с отрывом больше среднего. Среднее — это гладкая ложь, рассказанная поверх ухабистой реальности. Четыре сотых могут быть настоящим, устойчивым улучшением, а могут — везением в том, какие именно пятнадцать запросов попали в твой тест. Вытяни ты другие пятнадцать — победит ли B по-прежнему? Это ровно тот вопрос, на который следующая фигура заставляет ответить честно, а «среднее выше» — не ответ.',
        ],
        tt: [
          'Иң беренче проблемага кире: ике система, икесе дә ярыйсы кебек, кайсысы яхшырак. Хәзер бездә метрика бар, шуңа күрә ачыкны эшлик — икесен дә сораулар җыелмасы буенча эшләтеп, аларның nDCG сын уртачалап, чагыштырыйк. B системасы якынча 0,64, A системасы якынча 0,60 бирә. B якынча дүрт йөздән бер очко белән җиңә. B ны чыгарабыз, шулаймы?',
          'Алай тиз түгел, һәм бу — җентеклеләрне ышанычлылардан аера торган бит. Бу бердәнбер уртача һәр сорау буенча таралуның давылын яшерә. Аның астына кара — һәм B күпчелек сорауларда A ны уза, ләкин берничәсендә A чынлап та *җиңә*, кайчак уртачадан зуррак аерма белән. Уртача — бу үр-чокырлы реальлек өстенә сөйләнгән шома ялган. Дүрт йөздән бер чын, тотрыклы яхшырту булырга мөмкин, ә синең тестка нәкъ кайсы унбиш сорау туры килгәнгә бәйле уңыш та булырга мөмкин. Башка унбишне тартсаң — B һаман җиңәрме? Бу нәкъ менә киләсе фигура намуслы җавап бирергә мәҗбүр иткән сорау, ә «уртачасы югарырак» — җавап түгел.',
        ],
      },
    },
