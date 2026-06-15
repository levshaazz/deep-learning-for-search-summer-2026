    {
      id: 'depth-splade-mechanism', kind: 'prose',
      heading: { en: 'The SPLADE mechanism', ru: 'Механизм SPLADE', tt: 'SPLADE механизмы' },
      body: {
        en: [
          "Where do the logits come from? SPLADE reuses BERT's **masked-language-modeling head**. For each input token, that head already produces a score for every word in the vocabulary \\(|V| = 30{,}522\\) — its guess at what could go there. SPLADE takes those logits, applies \\(\\log(1 + \\mathrm{ReLU}(\\cdot))\\), and **max-pools** (in v2) over the input positions to get one weight per vocabulary word.",
          "Two pressures keep it sparse. ReLU zeroes most of the vocabulary outright. And a **FLOPS regularizer** — a differentiable proxy for the number of floating-point operations a query will cost — penalizes dense vectors during training, so the model learns to spend its weight on a few high-value terms. The result is a sparse vector over \\(|V|\\) that drops straight into an inverted index.",
        ],
        ru: [
          "Откуда логиты? SPLADE переиспользует **голову маскированного языкового моделирования** BERT. Для каждого входного токена эта голова уже выдаёт оценку каждому слову словаря \\(|V| = 30{,}522\\) — догадку, что могло бы там стоять. SPLADE берёт эти логиты, применяет \\(\\log(1 + \\mathrm{ReLU}(\\cdot))\\) и **max-пулит** (в v2) по входным позициям, получая один вес на слово словаря.",
          "Разрежённость держат два давления. ReLU обнуляет большую часть словаря сразу. А **регуляризатор FLOPS** — дифференцируемая мера числа операций с плавающей точкой, в которое обойдётся запрос, — штрафует плотные векторы при обучении, так что модель учится тратить вес на немногие ценные термины. Итог — разрежённый вектор над \\(|V|\\), который прямо встаёт в инвертированный индекс.",
        ],
        tt: [
          "Логитлар каян? SPLADE BERT ның **маскаланган тел моделләштерү башын** яңадан куллана. Һәр керем токены өчен бу баш инде сүзлекнең \\(|V| = 30{,}522\\) һәр сүзенә балл бирә — анда нәрсә булырга мөмкин дигән фараз. SPLADE бу логитларны ала, \\(\\log(1 + \\mathrm{ReLU}(\\cdot))\\) куллана һәм керем позицияләре буенча **max-пуллый** (v2 дә), сүзлек сүзенә бер авырлык алып.",
          "Сирәклекне ике басым тота. ReLU сүзлекнең күп өлешен шунда ук нульгә тигезли. Ә **FLOPS регуляризаторы** — сорау кыйммәтенә керәчәк йөзүче нокта операцияләре санының дифференциалланучан үлчәме — өйрәтү вакытында тыгыз векторларны җәзалый, шуңа модель авырлыкны берничә кыйммәтле терминга сарыф итәргә өйрәнә. Нәтиҗә — \\(|V|\\) өстендәге сирәк вектор, ул туры инвертланган индекска керә.",
        ],
      },
    },
