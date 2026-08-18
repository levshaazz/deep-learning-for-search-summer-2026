    {
      id: 'depth-teacher-forcing', kind: 'prose',
      heading: { en: "Teacher forcing: schooled on the truth", ru: "Teacher forcing: выучка на правде", tt: "Teacher forcing: хакыйкатьтә өйрәтү" },
      body: {
        en: [
          "How do you *train* a forward-weaving loom without waiting for it to write one thread at a time? By a trick called **teacher forcing**. During training the whole true text is already known, so I lay the ground-truth threads on the loom and let *every position learn at once*: each one, looking left through the causal curtain at true threads only, predicts its own next token. One parallel pass, a lesson at every position — that is why training a writer is fast.",
          "At inference the truth is gone. The model writes a token, feeds its own output back into the input, and writes the next — strictly one at a time, standing on its own choices. The asymmetry has a name and a price: **exposure bias** — in school the loom always stood on true threads, but at the fair it stands on its own guesses, a situation it never once saw in training, and an early slip can pull the following threads askew. Keep the two regimes apart in your head: parallel over the truth when learning, sequential over itself when weaving.",
        ],
        ru: [
          "Как *обучать* пишущий вперёд станок, не дожидаясь, пока он выпишет нить за нитью? Приёмом под названием **teacher forcing**. На обучении весь истинный текст уже известен, так что я выкладываю на станок правдивые нити и даю *всем позициям учиться разом*: каждая, глядя сквозь занавес causal-маски только на истинные нити слева, предсказывает свой следующий токен. Один параллельный проход — и урок в каждой позиции; вот почему учить писателя быстро.",
          "На инференсе правды нет. Модель пишет токен, подаёт собственный выход обратно на вход и пишет следующий — строго по одному, опираясь на свои же решения. У этой асимметрии есть имя и цена: **экспозиционный сдвиг (exposure bias)** — в школе станок всегда стоял на истинных нитях, а на ярмарке стоит на собственных догадках, в положении, которого на обучении не видел ни разу, и ранняя оплошность может увести за собой следующие нити. Держи два режима в голове порознь: параллельно по правде, когда учимся; последовательно по себе, когда ткём.",
        ],
        tt: [
          "Алга язучы станокны, ул җепне берәм-берәм язганын көтмичә, ничек *өйрәтергә*? **Teacher forcing** дигән алым белән. Өйрәтү вакытында бөтен чын текст инде билгеле, шуңа мин станокка хак җепләрне тезеп куям да *барлык позицияләргә берьюлы өйрәнергә* бирәм: һәрберсе, causal пәрдә аша сулга — хак җепләргә генә — карап, үзенең киләсе token'ын фаразлый. Бер параллель үтеш — һәм һәр позициядә дәрес; язучыны өйрәтү шуңа тиз.",
          "Инференста хакыйкать юк. Модель token яза, үз чыгышын кире керемгә бирә һәм киләсен яза — берәм-берәм, үз карарларына таянып. Бу асимметриянең исеме һәм бәясе бар: **exposure bias** — мәктәптә станок һәрчак хак җепләр өстендә басып торды, ә ярминкәдә үз фаразлары өстендә тора, өйрәнгәндә бер тапкыр да күрмәгән хәлдә, һәм иртә ялгышу арттагы җепләрне дә кыйшайта ала. Ике режимны башыңда аерым тот: өйрәнгәндә — хакыйкать буенча параллель, тукыганда — үз-үзе буенча эзлекле.",
        ],
      },
    },
