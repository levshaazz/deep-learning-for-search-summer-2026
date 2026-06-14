    {
      id: 'depth-contrastive-objective', kind: 'prose',
      heading: { en: 'How the Scout is trained: InfoNCE', ru: 'Как обучают Разведчика: InfoNCE', tt: 'Разведчикны ничек өйрәтәләр: InfoNCE' },
      body: {
        en: [
          "Where do these models come from? A Scout is trained with a **contrastive objective**, InfoNCE: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). It is a softmax over similarities that pulls the query toward its positive document and pushes it away from the negatives, scaled by a temperature \\(\\tau\\) — exactly DPR's negative log-likelihood of the positive, and the same InfoNCE from Lecture 6.",
          "The negatives are largely the **other documents in the same batch** — free, no extra forward pass. So **batch size is a lever**: DPR's accuracy climbs as the in-batch negatives grow from 7 to 127, and E5 trains at a batch of \\(32{,}768\\) to drown each positive in negatives. The next beat makes the in-batch trick visual.",
        ],
        ru: [
          'Откуда берутся эти модели? Разведчика обучают **контрастной целью** InfoNCE: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). Это софтмакс по сходствам, притягивающий запрос к позитивному документу и отталкивающий от негативов, с температурой \\(\\tau\\) — ровно отрицательное правдоподобие позитива у DPR и та же InfoNCE из Лекции 6.',
          'Негативы — это в основном **другие документы того же батча** — бесплатно, без лишнего прохода. Поэтому **размер батча — рычаг**: точность DPR растёт по мере роста числа негативов с 7 до 127, а E5 учит при батче \\(32{,}768\\), чтобы утопить каждый позитив в негативах. Следующий бит показывает приём наглядно.',
        ],
        tt: [
          'Бу модельләр кайдан килә? Разведчик **контраст максаты** InfoNCE белән өйрәтелә: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). Бу — охшашлыклар буенча софтмакс, сорауны позитив документка тарта һәм негативлардан этә, \\(\\tau\\) температурасы белән — нәкъ DPR\'ның позитивның тискәре ихтималлыгы һәм 6 нчы лекциядәге шул ук InfoNCE.',
          'Негативлар — нигездә **шул ук батчтагы башка документлар** — бушлай, өстәмә үтүсез. Шуңа **батч күләме — рычаг**: DPR төгәллеге негативлар саны 7\'дән 127\'гә үскәндә арта, ә E5 \\(32{,}768\\) батчта өйрәтелә, һәр позитивны негативларга батыру өчен. Киләсе бит алымны күрсәтеп бирә.',
        ],
      },
    },
