    {
      id: 'problem-exact-dies', kind: 'prose',
      heading: { en: 'Why exact search dies', ru: 'Почему точный поиск умирает', tt: 'Ни өчен төгәл эзләү үлә' },
      img: 'L9/L9-01-star-by-star-death.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Séréga rows star-to-star one at a time while the Curse-of-Dimensionality Wraith flattens a distance histogram into a thin spike behind him.',
        ru: 'Серёга гребёт от звезды к звезде по одной, а Призрак Проклятия Размерности за его спиной сплющивает гистограмму расстояний в тонкий пик.',
        tt: 'Серёга йолдыздан йолдызга берәмләп ишә, ә артында Үлчәмлелек Ләгънәте Өрәге ара гистограммасын нечкә очка яньчи.',
      },
      body: {
        en: [
          "Exact \\(k\\)-nearest-neighbour search is doomed twice over. First the **cost**: comparing a query against \\(N\\) vectors of dimension \\(d\\) is \\(O(N \\cdot d)\\) — linear in the corpus, every single query. Second the **geometry**: the **Curse-of-Dimensionality Wraith** returns from Lecture 2. In high dimensions distances *concentrate* — the nearest and farthest points sit at almost the same distance, so the very notion of \"the nearest\" becomes fragile and the brute-force scan you paid so much for buys you less than you think.",
          "So we make a bargain. We give up a *sliver* of recall we can't even feel — occasionally missing a true neighbour — in exchange for a *mountain* of speed. That bargain is **approximate** nearest-neighbour search, and the rest of this lecture is three ways to strike it.",
        ],
        ru: [
          "Точный поиск \\(k\\) ближайших соседей обречён дважды. Сначала **цена**: сравнить запрос с \\(N\\) векторами размерности \\(d\\) — это \\(O(N \\cdot d)\\), линейно по корпусу, на каждый запрос. Затем **геометрия**: **Призрак Проклятия Размерности** возвращается из лекции 2. В больших размерностях расстояния *концентрируются* — ближайшая и дальняя точки оказываются почти на одном расстоянии, так что само понятие «ближайшего» становится хрупким, а дорогущий полный перебор приносит меньше, чем кажется.",
          "Поэтому мы заключаем сделку. Отдаём *крупицу* recall, которую даже не почувствуем — изредка пропуская истинного соседа, — в обмен на *гору* скорости. Эта сделка и есть **приближённый** поиск ближайших соседей, и остаток лекции — три способа её заключить.",
        ],
        tt: [
          "Төгәл \\(k\\) иң якын күршеләр эзләве ике тапкыр һәлак. Башта **бәя**: сорауны \\(d\\) үлчәмле \\(N\\) вектор белән чагыштыру — бу \\(O(N \\cdot d)\\), корпус буенча сызыкча, һәр сорауда. Аннары **геометрия**: **Үлчәмлелек Ләгънәте Өрәге** 2 нче лекциядән кайта. Зур үлчәмнәрдә аралар *концентрацияләнә* — иң якын һәм иң ерак нокталар диярлек бер ераклыкта, шуңа «иң якын» төшенчәсе үзе хрупкий була, ә кыйммәтле тулы эзләү уйлаганнан азрак бирә.",
          "Шуңа без килешү төзибез. Сизелми торган *кисәкчә* recall'ны бирәбез — сирәк кенә чын күршене калдырып — *тау* тизлеккә алмашка. Бу килешү — **якынча** иң якын күршеләр эзләве, ә лекциянең калганы — аны төзүнең өч ысулы.",
        ],
      },
    },
