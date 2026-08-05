    {
      id: 'depth-contrastive-objective', kind: 'prose',
      heading: { en: 'How the Scout is trained: InfoNCE', ru: 'Как обучают Разведчика: InfoNCE', tt: 'Разведчикны ничек өйрәтәләр: InfoNCE' },
      img: 'L7/L7-10-the-forge.png', imgPos: 'scene',
      imgAlt: {
        en: 'A forge where a Scout is hammered into shape: the positive document pulled toward the glowing query, a crowd of negatives driven away — the contrastive objective tempering the blade against what it must NOT match.',
        ru: 'Кузница, где Разведчика куют по форме: позитивный документ притягивается к раскалённому запросу, толпа негативов отгоняется прочь — контрастная цель закаляет клинок о то, с чем он НЕ должен совпасть.',
        tt: 'Разведчик формага суккан горн: позитив документ кызган сорауга тартыла, негативлар төркеме куыла — контраст максаты пычакны нәрсә белән туры килМӘСкә тиеш икәненә чыныктыра.',
      },
      body: {
        en: [
          "Where do these models come from? A Scout is trained with a **contrastive objective**, InfoNCE: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). It is a softmax over similarities that pulls the query toward its positive document and pushes it away from the negatives, scaled by a temperature \\(\\tau\\) — exactly DPR's negative log-likelihood of the positive, and the same InfoNCE from Lecture 6.",
          "The negatives are largely the **other documents in the same batch** — free, no extra forward pass. So **batch size is a lever**: a bigger batch gives *more* negatives (mostly easy, random ones — which is why we later *mine* hard negatives). DPR's accuracy climbs as the in-batch negatives grow from 7 to 127, and E5 trains at a batch of \\(32{,}768\\) to drown each positive in negatives. One caveat on \\(\\tau\\): too small a temperature over-penalises **false negatives** — unlabeled paraphrases of the positive that happen to land in the batch — so \\(\\tau\\) and batch size trade discrimination against false-negative collapse. The next beat makes the in-batch trick visual.",
        ],
        ru: [
          'Откуда берутся эти модели? Разведчика обучают **контрастной целью** InfoNCE: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). Это софтмакс по сходствам, притягивающий запрос к позитивному документу и отталкивающий от негативов, с температурой \\(\\tau\\) — ровно отрицательное правдоподобие позитива у DPR и та же InfoNCE из Лекции 6.',
          'Негативы — это в основном **другие документы того же батча** — бесплатно, без лишнего прохода. Поэтому **размер батча — рычаг**: больший батч даёт *больше* негативов (в основном лёгких, случайных — поэтому трудные негативы потом ещё и *добывают*). Точность DPR растёт по мере роста числа негативов с 7 до 127, а E5 учит при батче \\(32\,768\\), чтобы утопить каждый позитив в негативах. Одна оговорка про \\(\\tau\\): слишком маленькая температура чрезмерно штрафует **ложные негативы** — неразмеченные парафразы позитива, случайно попавшие в батч — так что \\(\\tau\\) и размер батча балансируют различение против коллапса на ложных негативах. Следующий такт показывает приём наглядно.',
        ],
        tt: [
          'Бу модельләр кайдан килә? Разведчик **контраст максаты** InfoNCE белән өйрәтелә: \\(\\mathcal{L} = -\\log \\frac{e^{\\,\\mathrm{sim}(q,d^+)/\\tau}}{\\sum_d e^{\\,\\mathrm{sim}(q,d)/\\tau}}\\). Бу — охшашлыклар буенча софтмакс, сорауны позитив документка тарта һәм негативлардан этә, \\(\\tau\\) температурасы белән — нәкъ DPR\'ның позитивның тискәре ихтималлыгы һәм 6 нчы лекциядәге шул ук InfoNCE.',
          'Негативлар — нигездә **шул ук батчтагы башка документлар** — бушлай, өстәмә үтүсез. Шуңа **батч күләме — рычаг**: зуррак батч *күбрәк* негатив бирә (нигездә җиңел, очраклы — шуңа трудный негативларны соңыннан ешрак *казып табалар*). DPR төгәллеге негативлар саны 7\'дән 127\'гә үскәндә арта, ә E5 \\(32{,}768\\) батчта өйрәтелә, һәр позитивны негативларга батыру өчен. \\(\\tau\\) турында бер искәрмә: артык кечкенә температура **ялган негативларны** — батчка очраклы эләккән позитивның билгеләнмәгән парафразларын — артык җәзалый, шуңа \\(\\tau\\) һәм батч күләме аеруны ялган-негатив коллапсына каршы баланслый. Киләсе бит алымны күрсәтеп бирә.',
        ],
      },
    },
