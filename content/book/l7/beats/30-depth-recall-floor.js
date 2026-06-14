    {
      id: 'depth-recall-floor', kind: 'prose',
      heading: { en: 'The recall ceiling', ru: 'Потолок полноты', tt: 'Тулылык түшәме' },
      body: {
        en: [
          "The cascade has a hard floor: a Judge can only rank a document the Scouts actually brought back. So the whole pipeline&rsquo;s quality is capped by the retriever&rsquo;s **recall@k** — if the right answer is not in the top-\\(k\\) the Scouts return, no amount of careful reranking can recover it. On the L4 set, recall climbs with depth: recall@1 = 0, recall@3 = 0.25, recall@5 = 0.5, recall@8 = 1.0. Retrieve too shallow and you cap the Judges below their potential. Recall first, precision second — never the other way round.",
        ],
        ru: [
          'У каскада жёсткий пол: Судья может ранжировать лишь документ, что Разведчики реально принесли. Поэтому качество всего пайплайна ограничено **recall@k** извлекателя — если верного ответа нет в top-\\(k\\), что вернули Разведчики, никакой тщательный реранк его не вернёт. На наборе L4 полнота растёт с глубиной: recall@1 = 0, recall@3 = 0.25, recall@5 = 0.5, recall@8 = 1.0. Извлечёшь слишком мелко — ограничишь Судей ниже их потенциала. Сначала полнота, потом точность — никогда наоборот.',
        ],
        tt: [
          'Каскадның каты идәне бар: Судья бары Разведчиклар чынлап алып кайткан документны тәртипли ала. Шуңа бөтен пайплайн сыйфаты табучының **recall@k**’сы белән чикләнгән — әгәр дөрес җавап Разведчиклар кайтарган top-\\(k\\)’да булмаса, бернинди җентекле кабат тәртип аны кайтара алмый. L4 җыелмасында тулылык тирәнлек белән үсә: recall@1 = 0, recall@3 = 0.25, recall@5 = 0.5, recall@8 = 1.0. Артык сай тапсаң — Судьяларны потенциалларыннан түбән чикләрсең. Башта тулылык, аннары төгәллек — беркайчан да киресенчә.',
        ],
      },
    },
