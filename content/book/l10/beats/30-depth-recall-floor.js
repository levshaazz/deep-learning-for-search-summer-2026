    {
      id: 'depth-recall-floor', kind: 'prose',
      heading: { en: 'The recall floor', ru: 'Нижняя граница полноты', tt: 'Тулылык идәне' },
      body: {
        en: [
          "The cascade has a hard floor: a Judge can only rank a document the Scouts actually brought back. So the whole pipeline&rsquo;s quality is capped by the retriever&rsquo;s **recall@k** — if the right answer is not in the top-\\(k\\) the Scouts return, no amount of careful reranking can recover it. On the L5 set, recall climbs with depth: recall@1 = 0, recall@3 = 0.25, recall@5 = 0.5, recall@8 = 1.0. Retrieve too shallow and you cap the Judges below their potential. Recall first, precision second — never the other way round. (The worked cascade in the previous beat reranks the full top-8, where recall@8 = 1.0, so it sits at the ceiling — the floor only bites when you retrieve shallower than full recall.)",
        ],
        ru: [
          'У каскада жёсткий пол: Судья может ранжировать лишь те документы, которые Разведчики реально принесли. Поэтому качество всего пайплайна ограничено **recall@k** ретривера — если верного ответа нет в top-\\(k\\), который вернули Разведчики, никакой тщательный реранк его не вернёт. На наборе L5 полнота растёт с глубиной: recall@1 = 0, recall@3 = 0,25, recall@5 = 0,5, recall@8 = 1,0. Извлечёшь слишком мелко — и ограничишь Судей ниже их потенциала. Сначала полнота, потом точность — и никогда наоборот. (Разобранный каскад в предыдущем такте переранжирует весь top-8, где recall@8 = 1,0, то есть стоит у самого потолка — пол даёт о себе знать лишь при извлечении мельче полной полноты.)',
        ],
        tt: [
          'Каскадның каты идәне бар: Судья бары Разведчиклар чынлап алып кайткан документны тәртипли ала. Шуңа бөтен пайплайн сыйфаты табучының **recall@k**’сы белән чикләнгән — әгәр дөрес җавап Разведчиклар кайтарган top-\\(k\\)’да булмаса, бернинди җентекле кабат тәртип аны кайтара алмый. L5 җыелмасында тулылык тирәнлек белән үсә: recall@1 = 0, recall@3 = 0,25, recall@5 = 0,5, recall@8 = 1,0. Артык сай тапсаң — Судьяларны потенциалларыннан түбән чикләрсең. Башта тулылык, аннары төгәллек — беркайчан да киресенчә. (Алдагы биттәге каскад тулы top-8\'не кабат тәртипли, анда recall@8 = 1,0, ягъни ул иң түшәмдә тора — идән исә тулы тулылыктан сайрак тапканда гына тешли.)',
        ],
      },
    },
