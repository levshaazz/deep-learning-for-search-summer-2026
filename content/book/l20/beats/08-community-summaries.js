    {
      id: 'community-summaries', kind: 'prose',
      heading: { en: 'Local walk vs global summary', ru: 'Локальный обход и глобальная сводка', tt: 'Локаль үтү һәм глобаль йомгак' },
      body: {
        en: [
          "Our 2-hop traversal answered a *specific* question — but some questions are corpus-wide: *\"what are the main themes across all these documents?\"* No single walk reaches them. GraphRAG's answer is to **cluster** the graph into **communities** and **pre-summarise** each one, then route a query to one of two modes.",
          "**Local search** walks the neighbourhood of the query's entities — exactly our 2-hop traversal. Best for *specific* questions with a clear starting node. **Global search** is a map-reduce over the graph: in the *map* step each community summary independently yields a partial answer **and a self-rated relevance score**; in the *reduce* step the low-scored partials are dropped and the survivors are combined into one answer. That per-community LLM pass is the cost global search pays for corpus-wide coverage — which is why it is best for *broad* \"main themes?\" questions that touch the whole corpus.",
          "The paper's title says it: *From Local to Global*. The close walk **and** the bird's-eye view, from one graph. We showed the local walk in detail; the global summary is the same graph, read top-down (Edge et al., 2024).",
        ],
        ru: [
          "Наш двухпрыжковый обход ответил на *конкретный* вопрос — но некоторые вопросы охватывают весь корпус: *«каковы главные темы по всем этим документам?»* Ни один обход их не достигает. Ответ GraphRAG — **кластеризовать** граф в **сообщества** и **предварительно резюмировать** каждое, затем направлять запрос в один из двух режимов.",
          "**Локальный поиск** обходит окрестность сущностей запроса — ровно наш двухпрыжковый обход. Лучше для *конкретных* вопросов с ясным стартовым узлом. **Глобальный поиск** — это map-reduce по графу: на шаге *map* сводка каждого сообщества самостоятельно выдаёт частичный ответ **и собственную оценку релевантности**; на шаге *reduce* частичные ответы с низкой оценкой отбрасываются, а оставшиеся сводятся в один. Этот проход LLM по каждому сообществу — та цена, которую глобальный поиск платит за охват всего корпуса, и потому он лучше для *широких* вопросов «главные темы?», которые затрагивают весь корпус.",
          "Заголовок статьи говорит сам за себя: *From Local to Global*. Близкий обход **и** взгляд с высоты птичьего полёта — из одного графа. Мы подробно показали локальный обход; глобальная сводка — тот же граф, читаемый сверху вниз (Edge и др., 2024).",
        ],
        tt: [
          "Безнең ике адымлы үтү *конкрет* сорауга җавап бирде — әмма кайбер сораулар бөтен корпусны иңли: *«бу документлар буенча төп темалар нинди?»* Бер үтү дә аларга җитми. GraphRAG җавабы — графны **җәмгыятьләргә** **кластерлау** һәм һәрберсен **алдан йомгаклау**, аннары сорауны ике режимның берсенә юнәлтү.",
          "**Локаль эзләү** сорау берәмлекләренең тирәлеген үтә — нәкъ безнең ике адымлы үтү. Ачык башлангыч төенле *конкрет* сораулар өчен яхшырак. **Глобаль эзләү** — граф буйлап map-reduce: *map* адымында һәр җәмгыять йомгагы мөстәкыйль рәвештә өлешчә җавап **һәм үзе куйган мөһимлек бәясен** бирә; *reduce* адымында түбән бәяле өлешчә җаваплар ташлана, ә калганнары берсенә җыела. Һәр җәмгыять буенча бу LLM үтүе — глобаль эзләүнең бөтен корпусны иңләве өчен түли торган бәясе, шуңа ул бөтен корпуска кагылган *киң* «төп темалар?» сораулары өчен яхшырак.",
          "Мәкаләнең исеме үзе әйтә: *From Local to Global*. Якын үтү **һәм** кош күзеннән караш — бер графтан. Без локаль үтүне җентекләп күрсәттек; глобаль йомгак — шул ук граф, өстән аска укылган (Edge һ.б., 2024)."
        ],
      },
    },
