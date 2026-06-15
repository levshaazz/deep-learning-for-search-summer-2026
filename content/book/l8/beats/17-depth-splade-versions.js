    {
      id: 'depth-splade-versions', kind: 'prose',
      heading: { en: 'SPLADE → v2 → ++', ru: 'SPLADE → v2 → ++', tt: 'SPLADE → v2 → ++' },
      body: {
        en: [
          "The family improved in steps. The original **SPLADE** (Formal, Piwowarski & Clinchant, SIGIR 2021) used **sum** pooling and reached MS MARCO MRR@10 \\(34.0\\). **SPLADE v2** (a 2021 arXiv preprint, where Lassance joins) switched to **max** pooling and added distillation, reaching \\(36.8\\). **SPLADE++** (the SIGIR 2022 paper, \"From Distillation to Hard Negative Sampling\") added hard negatives, reaching \\(38.0\\) and a BEIR nDCG@10 of \\(50.7\\).",
          "Two details worth keeping straight: the pooling is version-dependent (sum in the original, max from v2), and \"SPLADE v2\" is the *preprint* — the SIGIR'22 publication is SPLADE++.",
        ],
        ru: [
          "Семейство улучшалось шагами. Оригинальный **SPLADE** (Formal, Piwowarski & Clinchant, SIGIR 2021) использовал **sum**-пулинг и достиг MS MARCO MRR@10 \\(34{,}0\\). **SPLADE v2** (препринт arXiv 2021, где присоединяется Lassance) перешёл на **max**-пулинг и добавил дистилляцию, достигнув \\(36{,}8\\). **SPLADE++** (статья SIGIR 2022, «From Distillation to Hard Negative Sampling») добавил жёсткие негативы, достигнув \\(38{,}0\\) и BEIR nDCG@10 \\(50{,}7\\).",
          "Две детали, которые стоит не путать: пулинг версионно-зависим (sum в оригинале, max с v2), и «SPLADE v2» — это *препринт*, а публикация SIGIR'22 — это SPLADE++.",
        ],
        tt: [
          "Гаилә адымлап яхшырды. Оригиналь **SPLADE** (Formal, Piwowarski & Clinchant, SIGIR 2021) **sum**-пулинг кулланды һәм MS MARCO MRR@10 \\(34{,}0\\) га җитте. **SPLADE v2** (2021 arXiv препринты, анда Lassance кушыла) **max**-пулингка күчте һәм дистилляция өстәде, \\(36{,}8\\) гә җитте. **SPLADE++** (SIGIR 2022 мәкаләсе, «From Distillation to Hard Negative Sampling») каты негативлар өстәде, \\(38{,}0\\) гә һәм BEIR nDCG@10 \\(50{,}7\\) гә җитте.",
          "Бутамаска ике детальне истә тоту кирәк: пулинг версиягә бәйле (оригиналда sum, v2 дән max), һәм «SPLADE v2» — *препринт*, ә SIGIR'22 басмасы — SPLADE++.",
        ],
      },
    },
