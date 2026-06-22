    {
      id: 'graphrag-recall-worked', kind: 'prose',
      heading: { en: 'Recall, by hand: 0 → 1', ru: 'Полнота, вручную: 0 → 1', tt: 'Тулылык, кул белән: 0 → 1' },
      body: {
        en: [
          "Let's grade both strategies on the anchor question with the simplest possible metric: **does the answer node appear in what we retrieved?** A binary answer-hit indicator, \\(\\text{recall} = \\mathbb{1}[\\text{answer node} \\in \\text{retrieved}]\\), with the answer node being **computer science**. (This is the one-node case, not L04's Recall@k — the *fraction* of relevant items retrieved; we reuse the word here.)",
          ":::calc **Single-hop** stops at the best document \\(d_1\\), which contains \\(\\{\\text{Acme Corp},\\ \\text{Dana Reyes},\\ \\text{Portland}\\}\\) — and **not** computer science. So \\(\\text{recall} = \\mathbf{0}\\). **The 2-hop walk** crosses two documents along the shared entity Dana Reyes: Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Dana Reyes \\(\\xrightarrow{\\text{studied}}\\) **computer science**, touching \\(\\{d_1, d_2\\}\\). The answer node is now reached, so \\(\\text{recall} = \\mathbf{1}\\). :::",
          "Recall climbs from \\(\\mathbf{0}\\) to \\(\\mathbf{1}\\) — and notice the corpus did not change. The same two documents were there all along. The entire lift comes from the **edges**: the same records, now *navigable*. That is GraphRAG in one number.",
        ],
        ru: [
          "Оценим обе стратегии на якорном вопросе простейшей метрикой: **появляется ли ответный узел в том, что мы извлекли?** Бинарный индикатор попадания ответа, \\(\\text{recall} = \\mathbb{1}[\\text{answer node} \\in \\text{retrieved}]\\), где ответный узел — **computer science**. (Это случай одного узла, а не Recall@k из L04 — *доли* извлечённых релевантных элементов; слово мы здесь переиспользуем.)",
          ":::calc **Одношаговый** поиск останавливается на лучшем документе \\(d_1\\), содержащем \\(\\{\\text{Acme Corp},\\ \\text{Dana Reyes},\\ \\text{Portland}\\}\\) — и **не** computer science. Значит \\(\\text{recall} = \\mathbf{0}\\). **Двухпрыжковый обход** проходит два документа по общей сущности Дана Рейес: Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Дана Рейес \\(\\xrightarrow{\\text{studied}}\\) **computer science**, затрагивая \\(\\{d_1, d_2\\}\\). Ответный узел теперь достигнут, значит \\(\\text{recall} = \\mathbf{1}\\). :::",
          "Полнота поднимается с \\(\\mathbf{0}\\) до \\(\\mathbf{1}\\) — и заметь: корпус не изменился. Те же два документа были тут всё время. Весь прирост идёт от **рёбер**: те же записи, теперь *проходимые*. Это GraphRAG в одном числе.",
        ],
        tt: [
          "Ике стратегияне дә таяныч сорауда иң гади метрика белән бәялик: **җавап төене без алган нәрсәдә бармы?** Җавап табылу-табылмавының бинар индикаторы, \\(\\text{recall} = \\mathbb{1}[\\text{answer node} \\in \\text{retrieved}]\\), монда җавап төене — **computer science**. (Бу — бер төен очрагы, L04 тәге Recall@k түгел — алынган релевант элементларның *өлеше*; сүзне без монда яңадан кулланабыз.)",
          ":::calc **Бер адымлы** эзләү иң яхшы документ \\(d_1\\) дә туктый, ул \\(\\{\\text{Acme Corp},\\ \\text{Dana Reyes},\\ \\text{Portland}\\}\\) тота — һәм computer science **түгел**. Димәк \\(\\text{recall} = \\mathbf{0}\\). **Ике адымлы үтү** уртак берәмлек Дана Рейес буйлап ике документны кичә: Acme Corp \\(\\xrightarrow{\\text{founded\\_by}}\\) Дана Рейес \\(\\xrightarrow{\\text{studied}}\\) **computer science**, \\(\\{d_1, d_2\\}\\) гә кагыла. Җавап төене хәзер табылды, димәк \\(\\text{recall} = \\mathbf{1}\\). :::",
          "Тулылык \\(\\mathbf{0}\\) дән \\(\\mathbf{1}\\) гә күтәрелә — һәм игътибар ит: корпус үзгәрмәде. Шул ук ике документ һәрвакыт монда иде. Бөтен өстәмә **кырлардан** килә: шул ук язмалар, хәзер *үтемле*. Бу — бер сандагы GraphRAG."
        ],
      },
    },
