    {
      id: 'three-flavors', kind: 'prose',
      heading: { en: 'Three flavors, not three equals', ru: 'Три вкуса, а не три равных', tt: 'Өч тәм, өч тигез түгел' },
      body: {
        en: [
          "\"Decompose the query\" hides three genuinely different moves, and the honest way to keep them apart is by **abstraction level** — *how* the breaking-apart happens, not just that it happens. Treating them as interchangeable is the mistake; each answers a different question about the fan-out.",
          "**Least-to-most is ORDERING.** Solve the *simplest* sub-problem first, then feed its answer forward into the next, harder one, so each step stands on the resolved ground beneath it (Zhou). The insight is sequence: some sub-questions can only be asked once an earlier one is answered.",
          "**Self-ask is ELICITATION.** The model *asks itself* the follow-up questions out loud, answers each, and lets those intermediate answers surface the missing link before it commits (Press). The insight is that the decomposition need not be planned up front — the model can *elicit* the next hop from its own partial reasoning.",
          "**Decomposed Prompting is ARCHITECTURE.** Here the sub-tasks become a modular **library of reusable programs** — a decomposer that dispatches to sub-task handlers, each independently improvable, some recursive (Khot). The insight is engineering: turn a one-off prompt trick into composable, swappable parts. Ordering, elicitation, architecture — the same fan-out seen from three heights.",
        ],
        ru: [
          "«Разложи запрос» прячет три по-настоящему разных хода, и честный способ их различить — по **уровню абстракции**: *как* происходит разбиение, а не просто что оно происходит. Считать их взаимозаменяемыми — и есть ошибка; каждый отвечает на свой вопрос про веер.",
          "**Least-to-most — это ПОРЯДОК.** Реши сначала *простейший* подвопрос, затем передай его ответ вперёд, в следующий, потяжелее, чтобы каждый шаг опирался на уже разрешённую под ним почву (Zhou). Суть — в последовательности: некоторые подвопросы можно задать лишь после того, как отвечен предыдущий.",
          "**Self-ask — это САМОДОПРОС.** Модель *задаёт себе* уточняющие вопросы вслух, отвечает на каждый и позволяет этим промежуточным ответам вытащить недостающее звено, прежде чем что-то утверждать (Press). Суть в том, что разбиение не обязано планироваться заранее — модель может *вызвать* следующий шаг из собственного частичного рассуждения.",
          "**Decomposed Prompting — это АРХИТЕКТУРА.** Здесь подзадачи становятся модульной **библиотекой переиспользуемых программ** — декомпозер, раздающий работу обработчикам подзадач, каждый из которых улучшается независимо, некоторые рекурсивны (Khot). Суть — инженерная: превратить разовый трюк с промптом в собираемые, взаимозаменяемые части. Порядок, вызывание, архитектура — один и тот же веер с трёх высот.",
        ],
        tt: [
          "«Сорауны тарат» өч чын-чынлап төрле хәрәкәтне яшерә, һәм аларны аеру өчен намуслы юл — **абстракция дәрәҗәсе** буенча: таратуның *ничек* булуы, ә бары тик булуы гына түгел. Аларны алмаштырыла торган итеп санау — менә шул хата; һәрберсе җилпәзә турында үз соравына җавап бирә.",
          "**Least-to-most — бу ТӘРТИП.** Башта иң *гади* астпроблеманы чиш, аннары аның җавабын алга, киләсе, авыррагына тапшыр, шулай итеп һәр адым астындагы инде хәл ителгән җиргә таяна (Zhou). Асылы — эзлеклелектә: кайбер астсорауларны алдагысына җавап бирелгәч кенә бирергә мөмкин.",
          "**Self-ask — бу ЧАКЫРУ.** Модель *үзенә* ачыклаучы сорауларны кычкырып бирә, һәрберсенә җавап бирә һәм бу арадаш җаваплар нәрсәдер расларга кадәр җитмәгән буынны тартып чыгарырга рөхсәт итә (Press). Асылы шунда: таратуны алдан планлаштырырга кирәкми — модель киләсе адымны үз өлешле фикер йөртүеннән *чакырып* ала ала.",
          "**Decomposed Prompting — бу АРХИТЕКТУРА.** Монда астбурычлар модуль **кабат кулланыла торган программалар китапханәсенә** әйләнә — эшне астбурыч эшкәртүчеләргә таратучы декомпозер, һәрберсе бәйсез яхшыртыла, кайберләре рекурсив (Khot). Асылы — инженерлык: бер тапкырлык промпт хәйләсен җыела торган, алмаштырыла торган өлешләргә әйләндер. Тәртип, чакыру, архитектура — шул ук җилпәзә өч биеклектән.",
        ],
      },
    },
