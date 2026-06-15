    {
      id: 'depth-ltr-flavors', kind: 'prose',
      heading: { en: 'Pointwise, pairwise, listwise', ru: 'Pointwise, pairwise, listwise', tt: 'Pointwise, pairwise, listwise' },
      body: {
        en: [
          "There are three ways to teach an order. **Pointwise** scores each \\((q, d)\\) pair alone and sorts by the score — which is exactly the cross-encoder from Lecture 7. **Pairwise** learns the relative question \"is \\(d_i\\) better than \\(d_j\\)?\" — this is RankNet. **Listwise** optimizes the *whole* list directly toward the metric, like ListNet, ListMLE, and (by weighting gradients with \\(\\Delta\\)nDCG) LambdaMART.",
          "We follow the pairwise-to-listwise thread, because it is the one that produced the workhorse of classical Learning to Rank: RankNet, then LambdaRank, then LambdaMART.",
        ],
        ru: [
          "Есть три способа научить порядку. **Pointwise** оценивает каждую пару \\((q, d)\\) отдельно и сортирует по оценке — это ровно кросс-энкодер из лекции 7. **Pairwise** учит относительный вопрос «\\(d_i\\) лучше \\(d_j\\)?» — это RankNet. **Listwise** оптимизирует *весь* список прямо под метрику, как ListNet, ListMLE и (взвешивая градиенты на \\(\\Delta\\)nDCG) LambdaMART.",
          "Мы идём по нити от pairwise к listwise, потому что именно она породила рабочую лошадку классического обучения ранжированию: RankNet, затем LambdaRank, затем LambdaMART.",
        ],
        tt: [
          "Тәртипкә өйрәтүнең өч ысулы бар. **Pointwise** һәр \\((q, d)\\) парын аерым бәяли һәм балл буенча тәртипкә сала — бу нәкъ 7 нче лекциядәге кросс-энкодер. **Pairwise** «\\(d_i\\) \\(d_j\\) дан яхшыракмы?» дигән чагыштырма сорауны өйрәнә — бу RankNet. **Listwise** *бөтен* исемлекне туры метрикага оптимальләштерә, ListNet, ListMLE кебек һәм (градиентларны \\(\\Delta\\)nDCG га үлчәп) LambdaMART кебек.",
          "Без pairwise дан listwise га җепне эзлибез, чөнки нәкъ ул классик ранжлауга өйрәнүнең эш атын тудырды: RankNet, аннары LambdaRank, аннары LambdaMART.",
        ],
      },
    },
