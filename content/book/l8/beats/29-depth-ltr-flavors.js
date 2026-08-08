    {
      id: 'depth-ltr-flavors', kind: 'prose',
      heading: { en: 'Pointwise, pairwise, listwise', ru: 'Поточечный, попарный, списочный', tt: 'Pointwise, pairwise, listwise' },
      body: {
        en: [
          "There are three ways to teach an order. **Pointwise** scores each \\((q, d)\\) pair alone and sorts by the score — which is exactly the cross-encoder from Lecture 7. **Pairwise** learns the relative question \"is \\(d_i\\) better than \\(d_j\\)?\" — this is RankNet. **Listwise** optimizes the *whole* list directly toward the metric, like ListNet, ListMLE, and (by weighting gradients with \\(\\Delta\\)nDCG) LambdaMART.",
          "Why not just go pointwise? Because it optimizes the wrong thing: it regresses each *absolute* relevance label in isolation, so it is blind to position and to the non-decomposable shape of nDCG — a label error at rank 2 and one at rank 800 cost it equally. Pairwise with the \\(\\Delta\\)nDCG weight fixes exactly this: the gradient is large only where reordering actually moves the metric, concentrating learning at the top.",
          "We follow the pairwise-to-listwise thread, because it is the one that produced the workhorse of classical Learning to Rank: RankNet, then LambdaRank, then LambdaMART.",
        ],
        ru: [
          "Есть три способа научить порядку. **Поточечный** (pointwise) оценивает каждую пару \\((q, d)\\) отдельно и сортирует по оценке — это ровно кросс-энкодер из лекции 7. **Попарный** (pairwise) учит относительный вопрос «\\(d_i\\) лучше \\(d_j\\)?» — это RankNet. **Списочный** (listwise) оптимизирует *весь* список прямо под метрику, как ListNet, ListMLE и (взвешивая градиенты на \\(\\Delta\\)nDCG) LambdaMART.",
          "Почему не остаться на поточечном? Потому что он оптимизирует не то: он регрессирует каждую *абсолютную* метку релевантности по отдельности и потому слеп к позиции и к недекомпозируемой форме nDCG — ошибка метки на ранге 2 и на ранге 800 обходятся ему одинаково. Попарный с весом \\(\\Delta\\)nDCG исправляет ровно это: градиент велик лишь там, где перестановка реально сдвигает метрику, концентрируя обучение на верхушке.",
          "Мы идём по нити от попарного к списочному, потому что именно она породила рабочую лошадку классического обучения ранжированию: RankNet, затем LambdaRank, затем LambdaMART.",
        ],
        tt: [
          "Тәртипкә өйрәтүнең өч ысулы бар. **Pointwise** һәр \\((q, d)\\) парын аерым бәяли һәм балл буенча тәртипкә сала — бу нәкъ 7 нче лекциядәге кросс-энкодер. **Pairwise** «\\(d_i\\) \\(d_j\\) дан яхшыракмы?» дигән чагыштырма сорауны өйрәнә — бу RankNet. **Listwise** *бөтен* исемлекне туры метрикага оптимальләштерә, ListNet, ListMLE кебек һәм (градиентларны \\(\\Delta\\)nDCG га үлчәп) LambdaMART кебек.",
          "Ни өчен pointwise да гына калмаска? Чөнки ул кирәкмәгәнне оптимальләштерә: ул һәр *абсолют* релевантлык билгесен аерым регрессияли, шуңа позициягә һәм nDCG ның таркалмый торган формасына сукыр — 2 нче рангтагы билге хатасы белән 800 нче рангтагысы аңа бер үк бәягә төшә. \\(\\Delta\\)nDCG авырлыгы белән pairwise нәкъ шуны төзәтә: градиент тәртипне үзгәртү метриканы чыннан да күчергән урында гына зур, өйрәнүне өске өлешкә туплый.",
          "Без pairwise дан listwise га җепне эзлибез, чөнки нәкъ ул классик ранжлауга өйрәнүнең эш атын тудырды: RankNet, аннары LambdaRank, аннары LambdaMART.",
        ],
      },
    },
