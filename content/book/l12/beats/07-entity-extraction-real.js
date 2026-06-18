    {
      id: 'entity-extraction-real', kind: 'prose',
      heading: { en: 'A real model builds the graph', ru: 'Реальная модель строит граф', tt: 'Чын модель графны төзи' },
      body: {
        en: [
          "The toy graph was hand-curated — but is the extraction step realistic? We gave **llama3.1:8b** an open-extraction prompt over the same three documents and asked only: *name the entities and the relations between them.* No schema, no toy. The model emitted **7** *(head, relation, tail)* triples on its own:",
          "From \\(d_1\\), the company — *(Acme Corp, was founded by, Dana Reyes)* and *(Acme Corp, is headquartered in, Portland)*: 2 triples, including the **founded-by** edge we need. From \\(d_2\\), the founder — *(Dana Reyes, studied, computer science)*, *(Dana Reyes, studied at, MIT)*, *(Dana Reyes, founded, a company)*: 3 triples, including the **studied** edge to the field. From \\(d_3\\), the school — *(MIT, is a, research university)* and *(MIT, is located in, Cambridge, Massachusetts)*: 2 more. Total across the three documents: **7 triples**.",
          "Then the same 2-hop traversal runs on the *model's own* graph: Acme Corp *was founded by* Dana Reyes, who *studied* **computer science**. The model named the entities and relations; the graph chained two documents to the answer. Real open extraction, real traversal — the toy was not cheating.",
        ],
        ru: [
          "Игрушечный граф был собран вручную — но реалистичен ли шаг извлечения? Мы дали **llama3.1:8b** промпт открытого извлечения по тем же трём документам и попросили лишь: *назови сущности и отношения между ними.* Без схемы, без игрушки. Модель сама выдала **7** троек *(голова, отношение, хвост)*:",
          "Из \\(d_1\\), компания — *(Acme Corp, was founded by, Dana Reyes)* и *(Acme Corp, is headquartered in, Portland)*: 2 тройки, включая нужное нам ребро **founded-by**. Из \\(d_2\\), основатель — *(Dana Reyes, studied, computer science)*, *(Dana Reyes, studied at, MIT)*, *(Dana Reyes, founded, a company)*: 3 тройки, включая ребро **studied** к области. Из \\(d_3\\), вуз — *(MIT, is a, research university)* и *(MIT, is located in, Cambridge, Massachusetts)*: ещё 2. Всего по трём документам: **7 троек**.",
          "Затем тот же двухпрыжковый обход идёт по *собственному* графу модели: Acme Corp *was founded by* Дана Рейес, которая *studied* **computer science**. Модель назвала сущности и отношения; граф связал два документа с ответом. Реальное открытое извлечение, реальный обход — игрушка не жульничала.",
        ],
        tt: [
          "Уенчык граф кул белән җыелган иде — әмма тартып алу адымы реалистикмы? Без **llama3.1:8b** га шул ук өч документ буйлап ачык тартып алу промпты бирдек һәм бары: *берәмлекләрне һәм алар арасындагы мөнәсәбәтләрне ата* дип сорадык. Схемасыз, уенчыксыз. Модель үзе **7** *(баш, мөнәсәбәт, койрык)* өчлеген чыгарды:",
          "\\(d_1\\) дән, компания — *(Acme Corp, was founded by, Dana Reyes)* һәм *(Acme Corp, is headquartered in, Portland)*: 2 өчлек, безгә кирәкле **founded-by** кырын кертеп. \\(d_2\\) дән, нигезләүче — *(Dana Reyes, studied, computer science)*, *(Dana Reyes, studied at, MIT)*, *(Dana Reyes, founded, a company)*: 3 өчлек, өлкәгә **studied** кырын кертеп. \\(d_3\\) тән, уку йорты — *(MIT, is a, research university)* һәм *(MIT, is located in, Cambridge, Massachusetts)*: тагын 2. Өч документ буенча барлыгы: **7 өчлек**.",
          "Аннары шул ук ике адымлы үтү модельнең *үз* графы буйлап бара: Acme Corp *was founded by* Дана Рейес, ул *studied* **computer science**. Модель берәмлекләрне һәм мөнәсәбәтләрне атады; граф ике документны җавапка чылбырлады. Чын ачык тартып алу, чын үтү — уенчык алдашмаган."
        ],
      },
    },
