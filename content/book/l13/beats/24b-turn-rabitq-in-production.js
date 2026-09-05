    {
      id: 'turn-rabitq-in-production', kind: 'prose',
      heading: { en: "Where the guarantee already runs", ru: "Где гарантия уже работает", tt: "Гарантия кайда инде эшли" },
      body: {
        en: [
          "A method with a proof is still only a paper until someone ships it. RaBitQ shipped: it is integrated into NVIDIA's cuVS library as **IVF-RaBitQ**, the same pairing you already know — a coarse quantizer to pick the cells, a fine one to score inside them, only with bits instead of a learned codebook.",
          "The numbers from that integration are worth reading as a shape rather than as a scoreboard. At recall around 0.95, IVF-RaBitQ serves three times the queries per second of CAGRA, a graph method, and builds its indexes **14.7×** faster; against IVF-PQ it is better than four times the throughput. The build-time gap is the one to notice, because it is the direct consequence of the design: there is no codebook to train, so index construction is mostly arithmetic on vectors you already have.",
          "And the throughput gap has a cause worth naming too. IVF-PQ typically re-ranks its shortlist against the raw vectors, which means touching full-precision data on the hot path; the bit codes carry enough of the distance that this step can be skipped. What looked like a memory disadvantage on the previous page — 96 bytes against 8 — buys back some of its cost here, in the traffic you do not generate.",
          "The honest summary of the whole comparison, then, is not a winner. It is a shape: PQ compresses harder, RaBitQ predicts better and builds faster, and which one you want depends on whether your bottleneck is RAM or trust.",
        ],
        ru: [
          "Метод с доказательством остаётся статьёй, пока его кто-нибудь не выкатит. RaBitQ выкатили: он встроен в библиотеку cuVS от NVIDIA как **IVF-RaBitQ** — та самая связка, которая тебе уже знакома: грубый квантователь выбирает ячейки, точный оценивает внутри них, только вместо выученной книги здесь биты.",
          "Числа этой интеграции стоит читать как форму, а не как турнирную таблицу. При полноте около 0,95 IVF-RaBitQ обслуживает втрое больше запросов в секунду, чем графовый CAGRA, и строит индексы в **14,7 раза** быстрее; против IVF-PQ — вчетверо с лишним по пропускной способности. Разрыв по времени сборки — тот, который стоит заметить, потому что он прямое следствие устройства: обучать нечего, и построение индекса сводится в основном к арифметике над векторами, которые у тебя и так есть.",
          "У разрыва по пропускной способности причина тоже заслуживает имени. IVF-PQ обычно переранжирует свой короткий список по исходным векторам, а значит трогает данные полной точности на горячем пути; битовые коды несут достаточно расстояния, чтобы этот шаг пропустить. То, что на прошлой странице выглядело проигрышем по памяти — 96 байт против 8, — здесь частично отыгрывается: трафиком, который ты не создаёшь.",
          "Значит честный итог всего сравнения — не победитель, а форма: PQ жмёт сильнее, RaBitQ предсказуемее и строится быстрее, а что из этого нужно тебе, зависит от того, во что ты упёрся — в память или в доверие.",
        ],
        tt: [
          "Дәлилле ысул кемдер аны чыгарганчы мәкалә булып кала. RaBitQ'ны чыгардылар: ул NVIDIA'ның cuVS китапханәсенә **IVF-RaBitQ** буларак кертелгән — сиңа инде таныш булган шул ук бәйләнеш: тупас квантлаучы күзәнәкләрне сайлый, төгәле алар эчендә бәяли, тик өйрәнелгән китап урынына биттар.",
          "Бу интеграциянең саннарын турнир таблицасы итеп түгел, ә форма итеп укырга кирәк. Тулылык 0,95 тирәсендә булганда IVF-RaBitQ граф ысулы CAGRA'га караганда өч тапкыр күбрәк сорау эшкәртә һәм индексларны **14,7 тапкыр** тизрәк төзи; IVF-PQ белән чагыштырганда — үткәрүчәнлек буенча дүрттән артык. Төзү вакытындагы аерма — игътибар итәргә кирәк булганы, чөнки ул төзелешнең турыдан-туры нәтиҗәсе: өйрәтергә нәрсә юк, һәм индекс төзү нигездә синдә инде булган векторлар өстендәге арифметикага кайтып кала.",
          "Үткәрүчәнлектәге аерманың сәбәбе дә аталырга лаек. IVF-PQ гадәттә үзенең кыска исемлеген чыганак векторлар буенча кабат ранжлый, димәк кайнар юлда тулы төгәллекле мәгълүматка кагыла; бит кодлары бу адымны калдырырлык ара йөртә. Узган биттә хәтер буенча оту булып күренгән нәрсә — 8гә каршы 96 байт — монда өлешчә кире кайтарыла: син тудырмаган трафик белән.",
          "Димәк, бөтен чагыштыруның намуслы йомгагы — җиңүче түгел, ә форма: PQ катырак кыса, RaBitQ фаразлаучанрак һәм тизрәк төзелә, ә сиңа моның кайсысы кирәк — нәрсәгә терәлүеңнән тора: хәтергәме, әллә ышанычкамы.",
        ],
      },
    },
