    {
      id: 'multi-hop-formally', kind: 'prose',
      heading: { en: 'Multi-hop, formally', ru: 'Многошаговость, формально', tt: 'Күпадымлылык, формаль рәвештә' },
      body: {
        en: [
          "Make it precise. A knowledge graph is \\(\\mathcal{G} = (\\mathcal{E}, \\mathcal{R})\\): nodes \\(\\mathcal{E}\\) are **entities**, edges \\(\\mathcal{R}\\) are **relations**, each edge a triple *(head, relation, tail)* extracted from a document. A multi-hop answer is not a node you retrieve — it is the result of a **walk**:",
          "$$ \\text{answer} = \\text{walk}\\big(e_0 \\xrightarrow{r_1} e_1 \\xrightarrow{r_2} \\cdots \\xrightarrow{r_h} e_h\\big) $$",
          "There are \\(h\\) **hops** from the start entity \\(e_0\\) to the answer entity \\(e_h\\). Our anchor needs \\(h = 2\\): Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Dana Reyes \\(\\xrightarrow{\\text{studied}}\\) computer science. This sits *on top of* the Oracle's flat \\(R_k\\): plain retrieval finds the documents; the graph's edges **chain facts across them**. The lift is structure, not more text.",
        ],
        ru: [
          "Сделаем точно. Граф знаний — это \\(\\mathcal{G} = (\\mathcal{E}, \\mathcal{R})\\): узлы \\(\\mathcal{E}\\) — **сущности**, рёбра \\(\\mathcal{R}\\) — **отношения**, каждое ребро — тройка *(голова, отношение, хвост)*, извлечённая из документа. Многошаговый ответ — не узел, который ты извлекаешь, а результат **обхода**:",
          "$$ \\text{answer} = \\text{walk}\\big(e_0 \\xrightarrow{r_1} e_1 \\xrightarrow{r_2} \\cdots \\xrightarrow{r_h} e_h\\big) $$",
          "От стартовой сущности \\(e_0\\) до ответной \\(e_h\\) — \\(h\\) **прыжков**. Нашему якорю нужно \\(h = 2\\): Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Дана Рейес \\(\\xrightarrow{\\text{studied}}\\) computer science. Это стоит *поверх* плоского \\(R_k\\) Оракула: простой поиск находит документы; рёбра графа **связывают факты через них**. Прирост — это структура, а не больше текста.",
        ],
        tt: [
          "Төгәл итик. Белем графы — бу \\(\\mathcal{G} = (\\mathcal{E}, \\mathcal{R})\\): төеннәр \\(\\mathcal{E}\\) — **берәмлекләр**, кырлар \\(\\mathcal{R}\\) — **мөнәсәбәтләр**, һәр кыр — документтан тартып алынган *(баш, мөнәсәбәт, койрык)* өчлеге. Күпадымлы җавап — син алган төен түгел, ә **үтүнең** нәтиҗәсе:",
          "$$ \\text{answer} = \\text{walk}\\big(e_0 \\xrightarrow{r_1} e_1 \\xrightarrow{r_2} \\cdots \\xrightarrow{r_h} e_h\\big) $$",
          "Башлангыч берәмлек \\(e_0\\) тан җавап берәмлеге \\(e_h\\) гә кадәр — \\(h\\) **адым**. Безнең таянычка \\(h = 2\\) кирәк: Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Дана Рейес \\(\\xrightarrow{\\text{studied}}\\) computer science. Бу — Оракулның яссы \\(R_k\\) **өстендә**: гади эзләү документларны таба; графның кырлары **алар аша фактларны чылбырлый**. Өстәмә — бу структура, текст күбрәк түгел."
        ],
      },
    },
