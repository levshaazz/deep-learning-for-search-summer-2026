    {
      id: 'toxic-hardest', kind: 'prose',
      heading: { en: 'The hardest can break the blade', ru: 'Самый сложный может сломать клинок', tt: 'Иң катлаулысы пычакны сындырырга мөмкин' },
      img: 'L13/L13-05-shattered-blade.png', imgPos: 'scene',
      imgAlt: {
        en: "A shattered blade lying in pieces — quenching the steel too hard makes it brittle, just as feeding only the very hardest negatives collapses training.",
        ru: "Разлетевшийся на куски клинок — слишком резкая закалка делает сталь хрупкой, как и обучение на одних самых трудных негативах разрушает тренировку.",
        tt: "Кисәкләргә таркалган пычак — корычны артык кискен чыныктыру аны вак-төякле итә, нәкъ бары тик иң авыр негативлар белән өйрәтү дә өйрәнүне җимергән кебек.",
      },
      imgCaption: {
        en: "Feed *only* the hardest and the blade shatters: the very hardest negatives are often mislabeled positives in disguise.",
        ru: "Дай *только* самые трудные — и клинок разлетится: самые трудные негативы часто оказываются переодетыми позитивами.",
        tt: "*Бары тик* иң авырларны бирсәң, пычак чәлпәрәмә килә: иң авыр негативлар еш кына кыяфәт алыштырган позитивлар булып чыга.",
      },
      body: {
        en: [
          "If a negative is worth its gradient, why not always train on the very hardest? Because the early work on triplet losses found the opposite: feeding a model only the hardest negatives can **collapse** training — the gradients become huge and unstable, and the model folds. FaceNet warned of exactly this, so it sampled in a *semi-hard* band from the outset, hard enough to teach but not so hard it destabilises.",
          "Keep this in mind — it is an optimisation failure of a *genuine* negative. The next act meets a darker failure, where the hardest opponent is not a negative at all.",
        ],
        ru: [
          "Если негатив стоит своего градиента, почему не учить всегда на самых сложных? Потому что ранние работы по triplet-потерям нашли обратное: кормить модель только самыми трудными негативами может **обрушить** обучение — градиенты становятся огромными и нестабильными, и обучение разваливается. FaceNet предупреждал именно об этом и потому с самого начала сэмплировал в *полу-сложной* полосе: достаточно сложно, чтобы учить, но не настолько, чтобы дестабилизировать.",
          "Запомни это — здесь оптимизация ломается на *настоящем* негативе. Следующий акт встречает более тёмный провал, где самый сложный противник вовсе не негатив.",
        ],
        tt: [
          "Әгәр негатив үз градиенты кадәр кыйммәтле булса, ни өчен һәрвакыт иң катлаулыларда өйрәтмәскә? Чөнки triplet-югалтулар буенча беренче эшләр кирешен тапты: модельне бары иң катлаулы негативлар белән туендыру өйрәтүне **җимерергә** мөмкин — градиентлар бик зур һәм тотрыксыз була, модель бөкләнә. FaceNet нәкъ менә шуннан кисәткән, шуңа да башыннан ук *ярым-катлаулы* полосада сэмпллаган: өйрәтер өчен җитәрлек катлаулы, ләкин тотрыксызландырырлык түгел.",
          "Моны истә тот — биредә оптимизация *чын* негативда сына. Киләсе акт караңгырак уңышсызлык белән очраша, анда иң катлаулы көндәш бөтенләй негатив түгел.",
        ],
      },
    },
