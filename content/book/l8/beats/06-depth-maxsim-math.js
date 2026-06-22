    {
      id: 'depth-maxsim-math', kind: 'prose',
      heading: { en: 'Why max, not sum-of-sums', ru: 'Почему максимум, а не сумма сумм', tt: 'Ни өчен максимум, сумма суммасы түгел' },
      body: {
        en: [
          "Write the operator out: \\(S_{q,d} = \\sum_{i \\in q} \\max_{j \\in d} E_{q_i} \\cdot E_{d_j}\\). Two choices matter. First, the vectors are **L2-normalized**, so each dot product \\(E_{q_i} \\cdot E_{d_j}\\) is a cosine in \\([-1, 1]\\) — comparable across token pairs. Second, the inner operator is a **max**, not a sum or an average over the row.",
          "Why max? A sum over all doc tokens would reward *long* documents (more terms to add) and dilute a sharp match among many weak ones. The max asks a cleaner question: *for this query token, how well does its single best match in the document do?* Summing those best-matches over the query tokens then asks: *did the document answer many parts of the query, or just one?* That is exactly what separated \\(2.35\\) from \\(1.30\\).",
          "A real ColBERTv2 model agrees on the very same query and documents: it scores \\(\\text{MaxSim} = \\mathbf{3.0635}\\) for the relevant document versus \\(\\mathbf{1.7809}\\) for the irrelevant one — far larger magnitudes than our toy cells (real 128-dimensional ColBERT token embeddings, not hand-picked values in \\([0,1]\\)), yet the same verdict. Toy and real model agree on the ordering — and the ordering is the point.",
        ],
        ru: [
          "Выпишем оператор: \\(S_{q,d} = \\sum_{i \\in q} \\max_{j \\in d} E_{q_i} \\cdot E_{d_j}\\). Важны два выбора. Во-первых, векторы **L2-нормированы**, поэтому каждое скалярное произведение \\(E_{q_i} \\cdot E_{d_j}\\) — это косинус в \\([-1, 1]\\), сравнимый между парами токенов. Во-вторых, внутренний оператор — **максимум**, а не сумма или среднее по строке.",
          "Почему максимум? Сумма по всем токенам документа награждала бы *длинные* документы (больше слагаемых) и размывала бы резкое совпадение среди многих слабых. Максимум задаёт более чистый вопрос: *насколько хорошо для этого токена запроса его единственное лучшее совпадение в документе?* Суммируя эти лучшие совпадения по токенам запроса, спрашиваем: *ответил ли документ на многие части запроса или лишь на одну?* Именно это и отделило \\(2{,}35\\) от \\(1{,}30\\).",
          "Настоящая модель ColBERTv2 согласна на том же запросе и тех же документах: она даёт \\(\\text{MaxSim} = \\mathbf{3{,}0635}\\) для релевантного документа против \\(\\mathbf{1{,}7809}\\) для нерелевантного — куда большие величины, чем в нашей игрушке (настоящие 128-мерные токенные вложения ColBERT, а не подобранные значения в \\([0,1]\\)), но вердикт тот же. Игрушка и настоящая модель совпадают в порядке — а порядок и есть суть.",
        ],
        tt: [
          "Операторны язып куйыйк: \\(S_{q,d} = \\sum_{i \\in q} \\max_{j \\in d} E_{q_i} \\cdot E_{d_j}\\). Ике сайлау мөһим. Беренчедән, векторлар **L2-нормалаштырылган**, шуңа һәр скаляр тапкырчыгыш \\(E_{q_i} \\cdot E_{d_j}\\) — \\([-1, 1]\\) тәге косинус, токен парлары арасында чагыштырырлык. Икенчедән, эчке оператор — **максимум**, юл буенча сумма яки уртача түгел.",
          "Ни өчен максимум? Бөтен документ токеннары буенча сумма *озын* документларны бүләкләр иде (кушылучылар күбрәк) һәм кискен туры килүне күп көчсезләре арасында йомшартыр иде. Максимум чистарак сорау бирә: *бу сорау токены өчен документтагы аның бердәнбер иң яхшы туры килүе ничек?* Бу иң яхшы туры килүләрне сорау токеннары буенча кушып: *документ сорауның күп өлешләренә җавап бирдеме, әллә берсенә генәме?* дип сорыйбыз. Нәкъ менә шул \\(2{,}35\\) не \\(1{,}30\\) дан аерды.",
          "Чын ColBERTv2 моделе нәкъ шул ук сорау һәм документларда килешә: ул релевант документ өчен \\(\\text{MaxSim} = \\mathbf{3{,}0635}\\), релевант булмаганы өчен \\(\\mathbf{1{,}7809}\\) бирә — безнең уенчыктагыдан күпкә зуррак зурлыклар (чын 128-мерле ColBERT токен векторлары, \\([0,1]\\) эчендә сайланган саннар түгел), әмма карар шул ук. Уенчык һәм чын модель тәртиптә туры килә — ә тәртип иң мөһиме.",
        ],
      },
    },
