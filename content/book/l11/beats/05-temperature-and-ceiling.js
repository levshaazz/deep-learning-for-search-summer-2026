    {
      id: 'temperature-and-ceiling', kind: 'prose',
      heading: { en: 'Temperature and the ceiling', ru: 'Температура и потолок', tt: 'Температура һәм түшәм' },
      img: 'L13/L13-00-the-crucible.png', imgPos: 'scene',
      imgAlt: {
        en: "Séréga at the forge, heating a glowing blade in a crucible over an orange flame, hammer and anvil beside him — the heat of the fire is the temperature that sets how sharply the contrast bites.",
        ru: "Серёга у горна нагревает раскалённый клинок в тигле над оранжевым пламенем, рядом молот и наковальня, — жар огня и есть температура, что задаёт остроту контраста.",
        tt: "Серёга кузницада оранж ялкын өстендәге тигельдә кызган пычакны җылыта, янәшәдә чүкеч һәм сандал — ут җылысы нәкъ контрастның никадәр үткен тешләвен билгели торган температура ул.",
      },
      imgCaption: {
        en: "Temperature is the forge's heat: too cool and nothing sharpens, too fierce and the steel burns. There is a band that works.",
        ru: "Температура — это жар горна: слишком слабый — ничего не точится, слишком яростный — сталь сгорает. Есть рабочая полоса.",
        tt: "Температура — кузница җылысы: артык салкын булса — берни үткенләнми, артык көчле булса — корыч яна. Эшли торган полоса бар.",
      },
      body: {
        en: [
          "Lowering \\(\\tau\\) sharpens the softmax: the probability piles onto whichever candidate has the highest cosine — so the loss falls when the positive is already first, and rises when a negative is. Temperature is the **hardness amplifier** — it decides how much a near-miss dominates the gradient.",
          "There is a common myth that more negatives let InfoNCE *maximise* mutual information. The honest statement is narrower: here \\(N\\) is the number of **candidates** the softmax chooses among — one positive plus \\(N-1\\) negatives — and more negatives raise the **ceiling** \\(\\log N\\) that the bound \\(I \\ge \\log N - L_N\\) can reach, which the bound only *saturates*. Because it is a *lower* bound, InfoNCE can certify at most \\(\\log N\\) nats of MI no matter how good the encoder is (Poole et al. 2019) — so for high-MI tasks the bound stays loose and large batches are a hard requirement, not a nicety. That ceiling, not a magic maximisation, is why retrievers scale the negative count.",
        ],
        ru: [
          "Снижение \\(\\tau\\) обостряет софтмакс: вероятность сваливается на кандидата с наибольшим косинусом — поэтому потеря падает, когда позитив уже первый, и растёт, когда первым стоит негатив. Температура — **усилитель трудности**: она решает, насколько близкий промах (near-miss) доминирует в градиенте.",
          "Есть расхожий миф, будто большее число негативов позволяет InfoNCE *максимизировать* взаимную информацию. Честная формулировка уже: здесь \\(N\\) — это число **кандидатов**, среди которых выбирает софтмакс (один позитив плюс \\(N-1\\) негативов), и большее число негативов поднимает **потолок** \\(\\log N\\), которого может достичь граница \\(I \\ge \\log N - L_N\\) — и граница лишь *насыщается* на нём. Поскольку это *нижняя* граница, InfoNCE может подтвердить не более \\(\\log N\\) нат взаимной информации, как бы хорош ни был энкодер (Poole et al. 2019) — поэтому на задачах с высокой MI граница остаётся неплотной, а большие батчи — жёсткое требование, а не приятный бонус. Именно этот потолок, а не волшебная максимизация, и есть причина наращивать число негативов.",
        ],
        tt: [
          "\\(\\tau\\) ны төшерү софтмаксны үткенләштерә: ихтималлык иң катлаулы кандидатка өелә, ә югалту төшә. Температура — **катлаулык көчәйткече**: ул якын ялгышлык (near-miss) градиентта күпме өстенлек итүен билгели.",
          "Күбрәк негатив InfoNCE'ка үзара мәгълүматны *максимумлый* дигән таралган миф бар. Намуслы әйтелеш тарырак: монда \\(N\\) — софтмакс арасыннан сайлаган **кандидатлар** саны (бер позитив һәм \\(N-1\\) негатив), һәм күбрәк негатив \\(I \\ge \\log N - L_N\\) чиге ирешә ала торган **түшәмне** \\(\\log N\\) күтәрә — ә чик шунда бары *туена*. Бу *аскы* чик булганга, InfoNCE энкодер никадәр яхшы булса да \\(\\log N\\) наттан артык үзара мәгълүматны раслый алмый (Poole et al. 2019) — шуңа күрә югары MI бурычларында чик бушрак кала, ә зур батчлар — рәхәт өстәмә түгел, ә каты таләп. Нәкъ менә бу түшәм, сихри максимумлау түгел, ретриверларга негатив санын арттырырга сәбәп.",
        ],
      },
    },
