    {
      id: 'climb-ivf-worked', kind: 'prose',
      heading: { en: 'Recall vs nprobe, by hand', ru: 'Полнота против nprobe вручную', tt: 'Recall nprobe га каршы, кул белән' },
      body: {
        en: [
          "The knob is **nprobe** — how many of the nearest cells to probe. Take nine points in three cells, a query \\(q\\) that lands in cell \\(c_0\\), and its three true nearest neighbours: two inside \\(c_0\\), one just across the border in \\(c_1\\).",
          ":::calc With **nprobe = 1** we probe only \\(c_0\\). We find the two neighbours inside it but miss the third (stranded in \\(c_1\\)): \\(2/3\\) → **recall@3 = 0.6667**. With **nprobe = 2** we also probe \\(c_1\\) — the second-nearest cell, exactly where the third neighbour sits — so \\(3/3\\) → **recall@3 = 1.0**. :::",
          "That is the whole IVF tradeoff: probing more cells raises recall but costs more work. The danger is the **boundary neighbour** — a true neighbour that sits just outside the query's own cell. One cell alone always risks missing it; a couple of probes recover it. nprobe is the dial between speed and recall, and it is the reason IVF is paired with a re-ranking pass over the candidates it returns.",
        ],
        ru: [
          "Ручка — **nprobe**: сколько ближайших ячеек пробовать. Возьмём девять точек в трёх ячейках, запрос \\(q\\), попадающий в ячейку \\(c_0\\), и три его истинных ближайших соседа: два внутри \\(c_0\\), один — сразу за границей, в \\(c_1\\).",
          ":::calc При **nprobe = 1** пробуем только \\(c_0\\). Находим двух соседей внутри неё, но третьего (застрявшего в \\(c_1\\)) пропускаем: \\(2/3\\) → **recall@3 = 0,6667**. При **nprobe = 2** пробуем и \\(c_1\\) — вторую по близости ячейку, ровно где сидит третий сосед, — поэтому \\(3/3\\) → **recall@3 = 1,0**. :::",
          "В этом весь компромисс IVF: больше ячеек — выше полнота, но дороже. Опасность — **пограничный сосед**, истинный сосед сразу за пределами собственной ячейки запроса. Одна ячейка всегда рискует его упустить; пара проб его возвращает. nprobe — ручка между скоростью и полнотой, и поэтому IVF сопровождают переранжированием возвращённых кандидатов.",
        ],
        tt: [
          "Көйләгеч — **nprobe**: ничә иң якын күзәнәкне тикшерергә. Өч күзәнәктә тугыз нокта, \\(c_0\\) күзәнәгенә төшкән \\(q\\) сорауы һәм аның өч чын иң якын күршесен алыйк: икесе \\(c_0\\) эчендә, берсе нәкъ чик артында, \\(c_1\\) дә.",
          ":::calc **nprobe = 1** белән бары \\(c_0\\) ны тикшерәбез. Аның эчендәге ике күршене табабыз, ләкин өченчесен (\\(c_1\\) дә калган) калдырабыз: \\(2/3\\) → **recall@3 = 0,6667**. **nprobe = 2** белән \\(c_1\\) не дә тикшерәбез — икенче иң якын күзәнәкне, нәкъ өченче күрше торган җирне — шуңа \\(3/3\\) → **recall@3 = 1,0**. :::",
          "IVF компромиссы шул: күбрәк күзәнәк — югарырак recall, ләкин кыйммәтрәк. Куркыныч — **чик күршесе**, сорауның үз күзәнәге читендә торган чын күрше. Бер күзәнәк һәрвакыт аны калдыру куркынычында; берничә тикшерү аны кайтара. nprobe — тизлек белән recall арасындагы көйләгеч, һәм шуңа IVF кайтарылган кандидатларны яңадан ранжлау белән кушыла.",
        ],
      },
    },
