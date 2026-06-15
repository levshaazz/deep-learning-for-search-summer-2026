    {
      id: 'depth-llm-rerankers', kind: 'prose',
      heading: { en: 'LLM rerankers (listwise)', ru: 'LLM-реранкеры (listwise)', tt: 'LLM-реранкерлар (listwise)' },
      body: {
        en: [
          "The newest Judges are LLMs that rerank **listwise**: prompt the model with a numbered window of passages and it emits a permutation like \\([2]\\gt[3]\\gt[1]\\), sliding the window over the candidates. The lessons are sharp.",
          "**Capability is not free.** On TREC DL19, zero-shot GPT-3.5 (RankGPT) scores nDCG@10 \\(\\mathbf{65.80}\\) — *below* a supervised monoT5-3B's \\(\\mathbf{71.83}\\) — while GPT-4 reaches \\(\\mathbf{75.59}\\). And **distillation closes the gap cheaply**: RankZephyr, an open 7B model distilled from GPT-4-reranked lists, reaches \\(\\mathbf{78.16}\\). Powerful but slow, so they sit at the very tip of the cascade.",
        ],
        ru: [
          'Новейшие Судьи — это LLM, переранжирующие **listwise**: модели подают пронумерованное окно пассажей, и она в ответ выдаёт перестановку вроде \\([2]\\gt[3]\\gt[1]\\), двигая окно по кандидатам. Выводы здесь чёткие.',
          '**Способность не бесплатна.** На TREC DL19 zero-shot GPT-3.5 (RankGPT) даёт nDCG@10 \\(\\mathbf{65.80}\\) — *ниже* обученного monoT5-3B \\(\\mathbf{71.83}\\) — тогда как GPT-4 достигает \\(\\mathbf{75.59}\\). И **дистилляция дёшево закрывает разрыв**: RankZephyr, открытая 7B-модель, дистиллированная из переранжировок GPT-4, достигает \\(\\mathbf{78.16}\\). Мощно, но медленно — поэтому они на самом кончике каскада.',
        ],
        tt: [
          'Иң яңа Судьялар — **listwise** кабат тәртипләүче LLM\'нар: модельгә номерланган өзекләр тәрәзәсе бирелә, ул \\([2]\\gt[3]\\gt[1]\\) кебек урын алмашуын бирә, тәрәзәне кандидатлар буенча шудыра. Сабаклар үткен.',
          '**Сәләт бушлай түгел.** TREC DL19\'да zero-shot GPT-3.5 (RankGPT) nDCG@10 \\(\\mathbf{65.80}\\) бирә — өйрәтелгән monoT5-3B \\(\\mathbf{71.83}\\)\'тән *түбәнрәк* — ә GPT-4 \\(\\mathbf{75.59}\\)\'га җитә. Һәм **дистилляция араны арзан яба**: RankZephyr, GPT-4 кабат тәртипләгән исемлекләрдән дистилләнгән ачык 7B модель, \\(\\mathbf{78.16}\\)\'га җитә. Көчле, әмма әкрен — шуңа каскадның иң очында.',
        ],
      },
    },
