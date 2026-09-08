    {
      id: 'climb-biencoder-worked', kind: 'prose',
      heading: { en: 'The score by hand', ru: 'Оценка вручную', tt: 'Бәяне кул белән' },
      body: {
        en: [
          "Take a toy 4-D space with axes (finance, geography, animal, water). Let the query \"river bank\" be \\(q=[0,1,0,1]\\), a relevant doc \"a beaver by the river bank\" be \\(d_{\\text{rel}}=[0,1,1,1]\\), and an irrelevant doc \"the bank approved my loan\" be \\(d_{\\text{irr}}=[1,0,0,0]\\). The dot product \\(q\\cdot d_{\\text{rel}} = 0+1+0+1 = \\mathbf{2}\\); the norms are \\(|q|=\\sqrt2\\), \\(|d_{\\text{rel}}|=\\sqrt3\\), so \\(\\cos = 2/\\sqrt6 \\approx \\mathbf{0.8165}\\). For the irrelevant doc \\(q\\cdot d_{\\text{irr}} = 0\\), so \\(\\cos = \\mathbf{0}\\). **BAM** — high for relevant, zero for off-topic.",
          "And the real model agrees. Running SBERT (all-MiniLM-L6-v2) on the same three natural-language strings gives \\(\\cos(q, d_{\\text{rel}}) \\approx \\mathbf{0.6838}\\) versus \\(\\cos(q, d_{\\text{irr}}) \\approx \\mathbf{0.4082}\\): the relevant document scores clearly higher. The toy arithmetic and the real 384-dimensional encoder point the same way.",
        ],
        ru: [
          'Возьмём игрушечное 4-мерное пространство с осями (финансы, география, животное, вода). Пусть запрос «river bank» — \\(q=[0,1,0,1]\\), релевантный документ «a beaver by the river bank» — \\(d_{\\text{rel}}=[0,1,1,1]\\), нерелевантный «the bank approved my loan» — \\(d_{\\text{irr}}=[1,0,0,0]\\). Скалярное произведение \\(q\\cdot d_{\\text{rel}} = 0+1+0+1 = \\mathbf{2}\\); нормы \\(|q|=\\sqrt2\\), \\(|d_{\\text{rel}}|=\\sqrt3\\), значит \\(\\cos = 2/\\sqrt6 \\approx \\mathbf{0{,}8165}\\). Для нерелевантного \\(q\\cdot d_{\\text{irr}} = 0\\), значит \\(\\cos = \\mathbf{0}\\). **БАМ** — высоко для релевантного, ноль для постороннего.',
          'И реальная модель согласна. SBERT (all-MiniLM-L6-v2) на тех же трёх строках даёт \\(\\cos(q, d_{\\text{rel}}) \\approx \\mathbf{0{,}6838}\\) против \\(\\cos(q, d_{\\text{irr}}) \\approx \\mathbf{0{,}4082}\\): релевантный документ заметно выше. Игрушечная арифметика и реальный 384-мерный энкодер указывают в одну сторону.',
        ],
        tt: [
          'Уйнау өчен 4 үлчәмле киңлек алыйк, күчәрләре (финанс, география, хайван, су). Сорау «river bank» — \\(q=[0,1,0,1]\\), релевант документ «a beaver by the river bank» — \\(d_{\\text{rel}}=[0,1,1,1]\\), релевант булмаган «the bank approved my loan» — \\(d_{\\text{irr}}=[1,0,0,0]\\). Скаляр тапкырчык \\(q\\cdot d_{\\text{rel}} = 0+1+0+1 = \\mathbf{2}\\); нормалар \\(|q|=\\sqrt2\\), \\(|d_{\\text{rel}}|=\\sqrt3\\), димәк \\(\\cos = 2/\\sqrt6 \\approx \\mathbf{0.8165}\\). Релевант булмаган өчен \\(q\\cdot d_{\\text{irr}} = 0\\), димәк \\(\\cos = \\mathbf{0}\\). **БАМ** — релевант өчен югары, читтәге өчен ноль.',
          'Һәм реаль модель риза. SBERT (all-MiniLM-L6-v2) шул ук өч юлда \\(\\cos(q, d_{\\text{rel}}) \\approx \\mathbf{0.6838}\\) бирә, \\(\\cos(q, d_{\\text{irr}}) \\approx \\mathbf{0.4082}\\) каршы: релевант документ ачык югарырак. Уенчык арифметика һәм реаль 384 үлчәмле энкодер бер якка күрсәтә.',
        ],
      },
    },
