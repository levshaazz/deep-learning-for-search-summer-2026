    {
      id: 'temperature-and-ceiling', kind: 'prose',
      heading: { en: 'Temperature and the ceiling', ru: 'Температура и потолок', tt: 'Температура һәм түшәм' },
      body: {
        en: [
          "Lowering \\(\\tau\\) sharpens the softmax: the probability piles onto the hardest candidate, and the loss falls. Temperature is the **hardness amplifier** — it decides how much a near-miss dominates the gradient.",
          "There is a common myth that more negatives let InfoNCE *maximise* mutual information. The honest statement is narrower: more negatives raise the **ceiling** \\(\\log N\\) that the bound \\(I \\ge \\log N - L_N\\) can reach — and the bound only *saturates* there. That ceiling, not a magic maximisation, is why retrievers scale the negative count.",
        ],
        ru: [
          "Снижение \\(\\tau\\) обостряет софтмакс: вероятность сваливается на самого сложного кандидата, а потеря падает. Температура — **усилитель сложности**: она решает, насколько near-miss доминирует в градиенте.",
          "Есть расхожий миф, будто больше негативов позволяют InfoNCE *максимизировать* взаимную информацию. Честная формулировка ýже: больше негативов поднимают **потолок** \\(\\log N\\), которого может достичь граница \\(I \\ge \\log N - L_N\\) — и граница лишь *насыщается* на нём. Именно этот потолок, а не волшебная максимизация, и есть причина наращивать число негативов.",
        ],
        tt: [
          "\\(\\tau\\) ны төшерү софтмаксны үткенләштерә: ихтималлык иң катлаулы кандидатка өелә, ә югалту төшә. Температура — **катлаулык көчәйткече**: ул near-miss'ның градиентта күпме өстенлек итүен билгели.",
          "Күбрәк негатив InfoNCE'ка үзара мәгълүматны *максимумлый* дигән таралган миф бар. Намуслы әйтелеш тарырак: күбрәк негатив \\(I \\ge \\log N - L_N\\) чиге ирешә ала торган **түшәмне** \\(\\log N\\) күтәрә — ә чик шунда бары *туена*. Нәкъ менә бу түшәм, сихри максимумлау түгел, ретриверларга негатив санын арттырырга сәбәп.",
        ],
      },
    },
