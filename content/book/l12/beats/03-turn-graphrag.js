    {
      id: 'turn-graphrag', kind: 'prose',
      heading: { en: 'The constellation map', ru: 'Карта созвездий', tt: 'Йолдызлык картасы' },
      img: 'L12/L12-01-constellation.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Joey Multi-Hop leaping from the Acme Corp node along a founded_by edge to Dana Reyes, then along a studied edge to computer science — a two-hop path drawn across an entity graph laid out like a constellation.',
        ru: 'Джоуи Многопрыг прыгает от узла Acme Corp по ребру founded_by к Дане Рейес, затем по ребру studied к computer science — двухпрыжковый путь, прочерченный по графу сущностей, разложенному как созвездие.',
        tt: 'Джоуи Күпадым Acme Corp төененнән founded_by кыры буйлап Дана Рейеска, аннары studied кыры буйлап computer science га сикерә — йолдызлык кебек таратылган берәмлекләр графы аша сызылган ике адымлы юл.',
      },
      body: {
        en: [
          "Turn the flat bag into a **map**. Read every document, pull out the entities it mentions and the relations between them, and store each as a **triple** — *(head, relation, tail)*. Now the scattered passages become a **constellation**: nodes joined by edges, and the same entity named in two documents becomes the **bridge** between them.",
          "Meet **Joey Multi-Hop**, who never looks for a single record — he *leaps* along edges. From the company node he follows the *founded_by* edge to the founder, then the *studied* edge to the field. The answer that lived in no document at all lives in the **path**. This is **GraphRAG** (Edge et al., Microsoft, 2024): retrieval is no longer find-one-passage; it is **walk-a-graph**.",
        ],
        ru: [
          "Преврати плоский мешок в **карту**. Прочитай каждый документ, вытащи упомянутые в нём сущности и отношения между ними, сохрани каждое как **тройку** — *(голова, отношение, хвост)*. Теперь разрозненные отрывки становятся **созвездием**: узлы, соединённые рёбрами, и одна и та же сущность, названная в двух документах, становится **мостом** между ними.",
          "Знакомься — **Джоуи Многопрыг**, который никогда не ищет одну запись: он *прыгает* по рёбрам. От узла компании он идёт по ребру *founded_by* к основателю, затем по ребру *studied* к области. Ответ, что не жил ни в одном документе, живёт в **пути**. Это **GraphRAG** (Edge и др., Microsoft, 2024): поиск — больше не найти-один-отрывок; это **пройти-граф**.",
        ],
        tt: [
          "Яссы капчыкны **картага** әйләндер. Һәр документны укы, аннан искә алынган берәмлекләрне һәм алар арасындагы мөнәсәбәтләрне тарт, һәрберсен **өчлек** итеп сакла — *(баш, мөнәсәбәт, койрык)*. Хәзер таркау өзекләр **йолдызлыкка** әйләнә: кырлар белән тоташтырылган төеннәр, һәм ике документта аталган бер үк берәмлек алар арасында **күпер** була.",
          "Таныш бул — **Джоуи Күпадым**, ул беркайчан бер язма эзләми: ул кырлар буйлап *сикерә*. Компания төененнән ул *founded_by* кыры буйлап нигезләүчегә, аннары *studied* кыры буйлап өлкәгә бара. Бер документта да яшәмәгән җавап **юлда** яши. Бу — **GraphRAG** (Edge һ.б., Microsoft, 2024): эзләү бүтән бер-өзек-табу түгел; ул — **граф-үтү**."
        ],
      },
    },
