    {
      id: 'depth-pointwise-pairwise-listwise', kind: 'prose',
      heading: { en: 'Pointwise, pairwise, listwise', ru: 'Pointwise, pairwise, listwise', tt: 'Pointwise, pairwise, listwise' },
      body: {
        en: [
          "There are three ways to teach a Judge an **order**. **Pointwise** scores each \\((q,d)\\) alone and sorts — binary cross-entropy, which is exactly what a cross-encoder does. **Pairwise** learns whether \\(d_i\\) outranks \\(d_j\\) with the RankNet logistic loss \\(\\log(1+e^{\\,s_j-s_i})\\) (duoT5).",
          "**Listwise** optimizes the *whole list* toward the metric: LambdaRank weights the RankNet gradients by the nDCG change from a swap, and **LambdaMART** puts those gradients inside gradient-boosted trees — the long-standing workhorse of classic Learning-to-Rank. That RankNet → LambdaMART line is the bridge into **Lecture 12**.",
        ],
        ru: [
          'Есть три способа научить Судью **порядку**. **Поточечный** (pointwise) оценивает каждую пару \\((q,d)\\) отдельно и сортирует — бинарная кросс-энтропия, ровно то, что делает кросс-энкодер. **Попарный** (pairwise) учит, выше ли \\(d_i\\) чем \\(d_j\\), логистическим лоссом RankNet \\(\\log(1+e^{\\,s_j-s_i})\\) (duoT5).',
          '**Списочный** (listwise) оптимизирует *весь список* к метрике: LambdaRank взвешивает градиенты RankNet изменением nDCG от перестановки, а **LambdaMART** кладёт их в градиентный бустинг деревьев — давняя рабочая лошадка классического Learning-to-Rank. Линия RankNet → LambdaMART — это мост в **Лекцию 12**.',
        ],
        tt: [
          'Судьяны **тәртипкә** өйрәтүнең өч юлы бар. **Pointwise** һәр \\((q,d)\\) парын аерым бәяли һәм сортлый — бинар кросс-энтропия, нәкъ кросс-энкодер эшләгәне. **Pairwise** \\(d_i\\) \\(d_j\\)\'дан өстенрәкме икәнен RankNet логистик югалтуы \\(\\log(1+e^{\\,s_j-s_i})\\) белән өйрәнә (duoT5).',
          '**Listwise** *бөтен исемлекне* метрикага оптимальләштерә: LambdaRank RankNet градиентларын алмаштырудан nDCG үзгәреше белән үлчи, ә **LambdaMART** аларны градиент бустинг агачларына сала — классик Learning-to-Rank\'ның күптәнге эш аты. RankNet → LambdaMART сызыгы — **12 нче лекциягә** күпер.',
        ],
      },
    },
