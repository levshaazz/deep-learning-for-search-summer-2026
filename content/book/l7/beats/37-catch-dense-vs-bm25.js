    {
      id: 'catch-dense-vs-bm25', kind: 'prose',
      heading: { en: 'Dense isn&rsquo;t a free lunch', ru: 'Dense — не бесплатный обед', tt: 'Dense — бушлай аш түгел' },
      body: {
        en: [
          "One honest twist before we leave. It is tempting to think a learned dense retriever always beats old BM25 — it does not. On the **BEIR** zero-shot benchmark, averaged over 18 out-of-domain datasets, **BM25 reaches nDCG@10 = 0.43 and single-vector denseDPR only 0.38**: lexical search wins out-of-domain (a late-interaction model like ColBERTv2 climbs back to 0.5). In-domain the story flips — on MS MARCO, denseDPR&rsquo;s MRR@10 of 0.33 beats BM25&rsquo;s 0.187. A single dense vector forgets too much; the fix is **hybrid** retrieval and richer late interaction, which is Lecture 8.",
        ],
        ru: [
          'Одна честная оговорка напоследок. Соблазнительно думать, что обученный плотный извлекатель всегда бьёт старый BM25 — нет. На zero-shot бенчмарке **BEIR**, усреднённо по 18 внедоменным датасетам, **BM25 даёт nDCG@10 = 0.43, а одновекторный denseDPR лишь 0.38**: лексический поиск выигрывает вне домена (модель поздней интеракции вроде ColBERTv2 возвращается к 0.5). Внутри домена всё переворачивается — на MS MARCO MRR@10 у denseDPR 0.33 бьёт 0.187 у BM25. Один плотный вектор забывает слишком много; лекарство — **гибридный** поиск и более богатая поздняя интеракция, это Лекция 8.',
        ],
        tt: [
          'Китәр алдыннан бер намуслы борылыш. Өйрәнгән тыгыз табучы һәрвакыт иске BM25’ны җиңә дип уйлау кызыктыргыч — юк. **BEIR** zero-shot бенчмаркында, 18 домен-тыш датасет буенча уртачаланган, **BM25 nDCG@10 = 0.43 бирә, ә бер-векторлы denseDPR бары 0.38**: лексик эзләү домен тышында җиңә (ColBERTv2 кебек соң-интеракция моделе 0.5’кә кире күтәрелә). Домен эчендә хикәя әйләнә — MS MARCO’да denseDPR’ның MRR@10 = 0.33, BM25’ның 0.187’сен җиңә. Бер тыгыз вектор артык күп оныта; чишелеш — **гибрид** эзләү һәм баерак соң-интеракция, бу 8 нче лекция.',
        ],
      },
    },
