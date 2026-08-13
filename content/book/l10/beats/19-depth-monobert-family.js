    {
      id: 'depth-monobert-family', kind: 'prose',
      heading: { en: 'The reranker family', ru: 'Семья реранкеров', tt: 'Реранкерлар гаиләсе' },
      body: {
        en: [
          "The canonical cross-encoder reranker is **monoBERT** (Nogueira &amp; Cho 2019): feed \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\) to BERT, read the \\([\\text{CLS}]\\) through a linear layer, get a relevance score. **monoT5** (Nogueira et al. 2020) does the same with a T5 that emits the token \"true\" or \"false\". These are **pointwise** rerankers (score one document at a time); **pairwise** and **listwise** variants compare documents instead. In practice the small **ms-marco-MiniLM** cross-encoder is the workhorse Judge — fast enough to rerank a hundred candidates in a tight latency budget.",
        ],
        ru: [
          'Канонический реранкер — кросс-энкодер **monoBERT** (Nogueira и Cho 2019): подай \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\) в BERT, прочти \\([\\text{CLS}]\\) через линейный слой, получи оценку релевантности. **monoT5** (Nogueira и др. 2020) делает то же на T5, выдающем токен «true» или «false». Это **поточечные** реранкеры (оценивают по одному документу); **попарные** и **списочные** варианты сравнивают документы. На практике маленький кросс-энкодер **ms-marco-MiniLM** — рабочая лошадка-Судья, достаточно быстрый, чтобы переранжировать сотню кандидатов в жёстком бюджете задержки.',
        ],
        tt: [
          'Канон реранкер — кросс-энкодер **monoBERT** (Nogueira &amp; Cho 2019): \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\) BERT’ка бир, \\([\\text{CLS}]\\)’ны сызыклы катлау аша укы, релевантлык бәясе ал. **monoT5** (Nogueira һ.б. 2020) шуны ук T5 белән эшли, ул «true» яки «false» токены чыгара. Болар — **нокталы** реранкерлар (берәр документ бәяли); **парлы** һәм **исемлекле** вариантлар документларны чагыштыра. Практикада кечкенә кросс-энкодер **ms-marco-MiniLM** — эшче Судья, йөз кандидатны тар вакыт бюджетында кабат тәртипкә салырлык тиз.',
        ],
      },
    },
