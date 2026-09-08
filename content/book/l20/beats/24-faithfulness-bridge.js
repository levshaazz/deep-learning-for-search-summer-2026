    {
      id: 'faithfulness-bridge', kind: 'prose',
      heading: { en: 'Faithfulness becomes an obligation', ru: 'Верность становится обязательством', tt: 'Тугрылык бурычка әйләнә' },
      body: {
        en: [
          "These risks share a thread back to the previous lecture. In *Judging the Oracle* we **measured** faithfulness — the fraction of an answer's claims that are actually supported by the retrieved context. Here that same metric stops being a score and becomes a **guardrail** against the hallucination harm.",
          "Keep the two metrics apart. **Relevance** asks: did we retrieve the *right* passages? **Faithfulness** asks: did the answer stay *true* to them? The Quasar-9 confabulation is a pure faithfulness failure — the answer invented content no passage supported.",
          "So wire it in: run a **faithfulness check** — an LLM-judge or an NLI model — *before* the answer is shown, and if it falls below threshold, **abstain**. That is the whole thread of the last two lectures, tightened: L16 taught us to *judge* the Oracle; L20 says we are **obliged** to. Measuring faithfulness was a method; enforcing it is an ethic.",
        ],
        ru: [
          "Эти риски связаны нитью с прошлой лекцией. В *Суде над Оракулом* мы **измеряли** верность — долю утверждений ответа, реально подкреплённых извлечённым контекстом. Здесь та же метрика перестаёт быть оценкой и становится **ограждением** против вреда галлюцинаций.",
          "Держи две метрики порознь. **Релевантность** спрашивает: извлекли ли мы *правильные* отрывки? **Верность** спрашивает: остался ли ответ *верен* им? Конфабуляция Quasar-9 — чистый провал верности: ответ выдумал содержание, не подкреплённое ни одним отрывком.",
          "Так встрой это: запусти **проверку верности** — LLM-судью или NLI-модель — *до* показа ответа, и если он ниже порога — **воздержись**. Это вся нить последних двух лекций, затянутая: L16 научил нас *судить* Оракула; L20 говорит, что мы **обязаны**. Измерять верность было методом; добиваться её соблюдения — этика.",
        ],
        tt: [
          "Бу рисклар үткән лекция белән җеп аша бәйле. *Оракулны хөкем итү* дә без тугрылыкны **үлчәдек** — җавап раславларының алынган контекст белән чыннан да ныгытылган өлеше. Монда шул ук метрика бәя булудан туктый һәм галлюцинация зыянына каршы **киртәгә** әйләнә.",
          "Ике метриканы аерым тот. **Релевантлык** сорый: без *дөрес* өзекләрне алдыкмы? **Тугрылык** сорый: җавап аларга *тугры* калдымы? Quasar-9 конфабуляциясе — саф тугрылык җиңелүе: җавап бер өзек тә ныгытмаган эчтәлек уйлап чыгарды.",
          "Шуңа моны җайла: җавап күрсәтелгәнче, **тугрылык тикшерүен** — LLM-хөкемче яисә NLI модель — эшләт, һәм ул бусагадан түбән булса — **баш тарт**. Бу — соңгы ике лекциянең бөтен җебе, кысылган: L16 безне Оракулны *хөкем итәргә* өйрәтте; L20 без моңа **бурычлы** ди. Тугрылыкны үлчәү — ысул иде; аны мәҗбүр итү — этика."
        ],
      },
    },
