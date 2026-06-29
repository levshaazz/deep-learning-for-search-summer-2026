    {
      id: 'depth-lambdamart', kind: 'prose',
      heading: { en: 'LambdaMART: the workhorse', ru: 'LambdaMART: рабочая лошадка', tt: 'LambdaMART: эш аты' },
      body: {
        en: [
          "LambdaMART is the final step: take the \\(\\lambda\\) forces from LambdaRank and use them as the gradients inside a **gradient-boosted regression tree** ensemble (the MART). Each tree is fit to the current \\(\\lambda\\)s, the ensemble is updated, the \\(\\lambda\\)s are recomputed, and the loop repeats. The trees handle the messy, non-linear interactions between dozens of features that a single neural score cannot.",
          "It is not a museum piece. A LambdaMART-based ensemble won the **Yahoo! Learning to Rank Challenge in 2010** (LambdaMART was the core of the winning blend) and it remains a strong, widely-deployed baseline — often the production ranker that the fancy neural scores merely *feed*. That is the payoff Lecture 7 pointed to: RankNet → LambdaRank → LambdaMART, the workhorse, arrived in full.",
        ],
        ru: [
          "LambdaMART — финальный шаг: взять силы \\(\\lambda\\) из LambdaRank и использовать их как градиенты внутри ансамбля **градиентного бустинга регрессионных деревьев** (MART). Каждое дерево подгоняется под текущие \\(\\lambda\\), ансамбль обновляется, \\(\\lambda\\) пересчитываются, и цикл повторяется. Деревья ловят запутанные нелинейные взаимодействия десятков признаков, которые одной нейронной оценке не под силу.",
          "Это не музейный экспонат. Ансамбль на основе LambdaMART выиграл **Yahoo! Learning to Rank Challenge в 2010** (LambdaMART был ядром победившего блендинга) и остаётся сильным, широко развёрнутым бейзлайном — часто это и есть продакшн-ранжировщик, который модные нейронные оценки лишь *кормят*. Это та кульминация, на которую указывала лекция 7: RankNet → LambdaRank → LambdaMART, рабочая лошадка, прибыла в полном составе.",
        ],
        tt: [
          "LambdaMART — соңгы адым: LambdaRank тан \\(\\lambda\\) көчләрен алып, аларны **градиент бустинглы регрессия агачлары** ансамбле (MART) эчендә градиент итеп куллану. Һәр агач агымдагы \\(\\lambda\\) ларга яраклаштырыла, ансамбль яңартыла, \\(\\lambda\\) лар яңадан исәпләнә, һәм цикл кабатлана. Агачлар дистәләрчә билгенең буталчык, сызыкча булмаган үзара тәэсирләрен тота, аны бер нейрон балл булдыра алмый.",
          "Бу музей әйбере түгел. LambdaMART нигезендәге ансамбль **Yahoo! Learning to Rank Challenge ны 2010 елда** җиңде (LambdaMART җиңүче блендингның үзәге иде) һәм нык, киң таралган бейзлайн булып кала — еш кына нәкъ шул продакшн-ранжлаучы, аны модалы нейрон баллар бары *туендыра*. Бу — 7 нче лекция күрсәткән кульминация: RankNet → LambdaRank → LambdaMART, эш аты, тулысынча килде.",
        ],
      },
    },
