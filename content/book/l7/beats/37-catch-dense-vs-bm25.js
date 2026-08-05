    {
      id: 'catch-dense-vs-bm25', kind: 'prose',
      heading: { en: 'Dense isn&rsquo;t a free lunch', ru: 'Dense — не бесплатный обед', tt: 'Dense — бушлай аш түгел' },
      body: {
        en: [
          "One honest twist before we leave. It is tempting to think a learned dense retriever always beats old BM25 — it does not. On the **BEIR** zero-shot benchmark, averaged over 18 out-of-domain datasets, **BM25 reaches nDCG@10 = 0.43 and single-vector dense DPR only 0.23** — that is the original QA-trained DPR checkpoint; MS MARCO-trained encoders hold up better yet still trail BM25 on average: lexical search wins out-of-domain (a late-interaction model like ColBERTv2 climbs back to 0.5). In-domain the story flips — on MS MARCO, a DPR-style dense bi-encoder&rsquo;s MRR@10 of 0.33 beats BM25&rsquo;s 0.187. (The DPR paper itself never evaluated MS MARCO; the 0.33 comes from later DPR-style reproductions.) A single dense vector forgets too much; the fix is **hybrid** retrieval and richer late interaction, which is Lecture 8.",
        ],
        ru: [
          'Одна честная оговорка напоследок. Соблазнительно думать, что обученный плотный ретривер всегда бьёт старый BM25 — нет. На zero-shot бенчмарке **BEIR**, усреднённо по 18 внедоменным датасетам, **BM25 даёт nDCG@10 = 0,43, а одновекторный dense DPR лишь 0,23** — это оригинальный DPR, обученный на QA-наборах; MS MARCO-модели держатся лучше, но в среднем всё ещё ниже BM25: лексический поиск выигрывает вне домена (модель позднего взаимодействия вроде ColBERTv2 возвращается к 0,5). Внутри домена всё переворачивается — на MS MARCO MRR@10 у DPR-класса плотного би-энкодера 0,33 бьёт 0,187 у BM25. (Сама статья DPR MS MARCO не оценивала; 0,33 — из более поздних DPR-репродукций.) Один плотный вектор забывает слишком много; лекарство — **гибридный** поиск и более богатое позднее взаимодействие, это Лекция 8.',
        ],
        tt: [
          'Китәр алдыннан бер намуслы борылыш. Өйрәнгән тыгыз табучы һәрвакыт иске BM25’ны җиңә дип уйлау кызыктыргыч — юк. **BEIR** zero-shot бенчмаркында, 18 домен-тыш датасет буенча уртачаланган, **BM25 nDCG@10 = 0,43 бирә, ә бер-векторлы dense DPR бары 0,23** — бу QA җыелмаларында өйрәтелгән оригиналь DPR; MS MARCO-модельләре яхшырак тота, ләкин уртача әле дә BM25’тән түбән: лексик эзләү домен тышында җиңә (ColBERTv2 кебек соңгы үзара тәэсир моделе 0,5’кә кире күтәрелә). Домен эчендә хикәя әйләнә — MS MARCO’да DPR-класс тыгыз би-энкодерның MRR@10 = 0,33, BM25’ның 0,187’сен җиңә. (DPR мәкаләсе үзе MS MARCO’ны бәяләмәгән; 0,33 — соңрак DPR-класс репродукцияләрдән.) Бер тыгыз вектор артык күп оныта; чишелеш — **гибрид** эзләү һәм баерак соңгы үзара тәэсир, бу 8 нче лекция.',
        ],
      },
    },
