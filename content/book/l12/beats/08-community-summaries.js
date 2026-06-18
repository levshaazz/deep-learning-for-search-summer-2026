    {
      id: 'community-summaries', kind: 'prose',
      heading: { en: 'Local walk vs global summary', ru: 'Локальный обход и глобальная сводка', tt: 'Локаль үтү һәм глобаль йомгак' },
      body: {
        en: [
          "Our 2-hop traversal answered a *specific* question — but some questions are corpus-wide: *\"what are the main themes across all these documents?\"* No single walk reaches them. GraphRAG's answer is to **cluster** the graph into **communities** and **pre-summarise** each one, then route a query to one of two modes.",
          "**Local search** walks the neighbourhood of the query's entities — exactly our 2-hop traversal. Best for *specific* questions with a clear starting node. **Global search** queries each community summary and reduces the partial answers into one — a map-reduce over the graph. Best for *broad* \"main themes?\" questions that touch the whole corpus.",
          "The paper's title says it: *From Local to Global*. The close walk **and** the bird's-eye view, from one graph. We showed the local walk in detail; the global summary is the same graph, read top-down (Edge et al., 2024).",
        ],
        ru: [
          "Наш двухпрыжковый обход ответил на *конкретный* вопрос — но некоторые вопросы охватывают весь корпус: *«каковы главные темы по всем этим документам?»* Ни один обход их не достигает. Ответ GraphRAG — **кластеризовать** граф в **сообщества** и **предварительно резюмировать** каждое, затем направлять запрос в один из двух режимов.",
          "**Локальный поиск** обходит окрестность сущностей запроса — ровно наш двухпрыжковый обход. Лучше для *конкретных* вопросов с ясным стартовым узлом. **Глобальный поиск** опрашивает сводку каждого сообщества и сводит частичные ответы в один — map-reduce по графу. Лучше для *широких* вопросов «главные темы?», что затрагивают весь корпус.",
          "Заголовок статьи говорит сам за себя: *From Local to Global*. Близкий обход **и** взгляд с высоты птичьего полёта — из одного графа. Мы подробно показали локальный обход; глобальная сводка — тот же граф, читаемый сверху вниз (Edge и др., 2024).",
        ],
        tt: [
          "Безнең ике адымлы үтү *конкрет* сорауга җавап бирде — әмма кайбер сораулар бөтен корпусны иңли: *«бу документлар буенча төп темалар нинди?»* Бер үтү дә аларга җитми. GraphRAG җавабы — графны **җәмгыятьләргә** **кластерлау** һәм һәрберсен **алдан йомгаклау**, аннары сорауны ике режимның берсенә юнәлтү.",
          "**Локаль эзләү** сорау берәмлекләренең тирәлеген үтә — нәкъ безнең ике адымлы үтү. Ачык башлангыч төенле *конкрет* сораулар өчен яхшырак. **Глобаль эзләү** һәр җәмгыять йомгагын сорый һәм өлешчә җавапларны берсенә җыя — граф буйлап map-reduce. Бөтен корпуска кагылган *киң* «төп темалар?» сораулары өчен яхшырак.",
          "Мәкаләнең исеме үзе әйтә: *From Local to Global*. Якын үтү **һәм** кош күзеннән караш — бер графтан. Без локаль үтүне җентекләп күрсәттек; глобаль йомгак — шул ук граф, өстән аска укылган (Edge һ.б., 2024)."
        ],
      },
    },
