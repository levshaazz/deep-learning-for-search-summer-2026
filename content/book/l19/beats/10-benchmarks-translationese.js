    {
      id: 'benchmarks-translationese', kind: 'prose',
      heading: { en: 'Benchmarks: native vs translationese', ru: 'Бенчмарки: родное против перевода', tt: 'Бенчмарклар: туган каршы тәрҗемә' },
      body: {
        en: [
          "Three benchmarks measure Russian retrieval, with the metrics you already know from L5/L10 — nDCG@10, MRR@10, recall@k. **MIRACL** is the gold standard: open retrieval over 18 languages including Russian, human-annotated on native in-language corpora. **mMARCO** is MS MARCO machine-translated into 13 languages — convenient and large, but it carries *translationese*. **ruMTEB** is the Russian branch of MTEB, 23 tasks spanning retrieval, STS and classification.",
          "Translationese is the quiet trap. Machine-translated Russian syntactically echoes its English source — word order, phrasing, lexical choices a native speaker would not use — and a model with strong English priors can exploit that calque. So a high mMARCO score can reflect the model's grip on *translation*, not your users' language, and it will not transfer.",
          "It is the L5 Goodhart lesson in a new coat: a high score on the wrong distribution is not what you meant to measure. Select on MIRACL and ruMTEB; use mMARCO for scale and training while discounting the bias.",
        ],
        ru: [
          "Русский поиск меряют три бенчмарка, с метриками, знакомыми по L5/L10 — nDCG@10, MRR@10, recall@k. **MIRACL** — золотой стандарт: open retrieval по 18 языкам, включая русский, с родной разметкой на корпусах носителей. **mMARCO** — это MS MARCO, машинно переведённый на 13 языков, удобный и большой, но несёт *translationese*. **ruMTEB** — русская ветка MTEB, 23 задачи: retrieval, STS, классификация.",
          "Translationese — тихая ловушка. Машинно-переведённый русский синтаксически калькирует английский источник — порядок слов, обороты, лексику, которую носитель не выберет, — и модель с сильными английскими приорами ловит эту кальку. Высокий mMARCO может отражать хватку модели за *перевод*, а не за язык твоих пользователей, и не перенесётся.",
          "Это урок Гудхарта из L5 в новом наряде: высокий балл на неверном распределении — не то, что ты хочешь измерить. Выбирай по MIRACL и ruMTEB; mMARCO — для масштаба и обучения, помня о смещении.",
        ],
        tt: [
          "Рус эзләүне өч бенчмарк үлчи, L5/L10\'дан таныш метрикалар белән — nDCG@10, MRR@10, recall@k. **MIRACL** — алтын стандарт: русны да кертеп 18 тел буенча open retrieval, туган телле корпусларда кеше разметкасы белән. **mMARCO** — 13 телгә машина белән тәрҗемә ителгән MS MARCO, уңайлы һәм зур, ләкин *translationese* йөртә. **ruMTEB** — MTEB\'ның рус тармагы, 23 мәсьәлә: retrieval, STS, классификация.",
          "Translationese — тыныч капкын. Машина тәрҗемә иткән рус инглиз чыганагын синтаксик калькалый — сүз тәртибе, әйтелешләр, туган телле сайламас лексика — һәм көчле инглиз приорлары булган model бу кальканы эләктерә. Югары mMARCO model\'нең кулланучыларыгыз теленә түгел, *тәрҗемәгә* тотынуын чагылдырырга мөмкин, һәм ул күчмәячәк.",
          "Бу — L5\'тәге Goodhart сабагы яңа киемдә: дөрес булмаган бүленештә югары балл — син үлчәргә теләгән нәрсә түгел. MIRACL һәм ruMTEB буенча сайла; mMARCO\'ны масштаб һәм өйрәтү өчен куллан, авышуны исәпкә алып.",
        ],
      },
    },
