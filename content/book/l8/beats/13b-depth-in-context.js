    {
      id: 'depth-in-context', kind: 'prose',
      heading: { en: "In-context learning: examples pinned to the beam", ru: "Обучение в контексте: примеры на брусе", tt: "Контекстта өйрәнү: брустагы үрнәкләр" },
      body: {
        en: [
          "Look closely at what those pinned examples do. **In-context learning**: a handful of worked input→output pairs goes into the prompt, the query goes last, and the loom completes it by analogy. The pairs are not decoration — they *specify the task*. Pin translation pairs and the same loom translates; pin label pairs and it classifies; swap the pins and the job changes, with the machine untouched. And there is no magic in the mechanism: the examples merely change the *context* on which \\( p(x_t \\mid x_{\\lt t}) \\) is computed. The weights stay frozen; no gradient flows.",
          "What this replaces is an entire fine-tuning run. Where the reader needed a labelled set and a training loop to become a classifier, here you show a few examples and simply ask. The price is symmetrical: nothing is kept. The task lives only in the prompt — cut the cloth off, and the next prompt starts from the same frozen weights, needing the same examples pinned all over again.",
        ],
        ru: [
          "Присмотрись, что делают эти подшитые примеры. **Обучение в контексте (in-context learning)**: горстка разобранных пар «вход → выход» идёт в промпт, запрос — последним, и станок доканчивает его по аналогии. Пары — не украшение: они *задают задачу*. Подшей пары-переводы — и тот же станок переводит; подшей пары-метки — и он классифицирует; поменяй примеры — и работа сменилась, а машину никто не трогал. И в механизме нет магии: примеры лишь меняют *контекст*, на котором считается \\( p(x_t \\mid x_{\\lt t}) \\). Веса заморожены; градиент не течёт.",
          "Заменяет это целый прогон дообучения. Там, где читателю нужны были размеченная выборка и цикл обучения, чтобы стать классификатором, здесь ты показываешь несколько примеров — и просто спрашиваешь. Цена симметрична: ничего не остаётся. Задача живёт только в промпте — отрежь полотно, и следующий промпт начнёт с тех же замороженных весов, и те же примеры придётся подшивать заново.",
        ],
        tt: [
          "Кыстырылган үрнәкләр нәрсә эшли — якыннан кара. **Контекстта өйрәнү (in-context learning)**: бер уч аңлатылган «керем → чыгыш» пары промптка керә, сорау — иң соңыннан, һәм станок аны охшашлык буенча тәмамлый. Парлар бизәк түгел: алар *бурычны билгели*. Тәрҗемә парларын кыстыр — шул ук станок тәрҗемә итә; тамга парларын кыстыр — классификацияли; үрнәкләрне алыштыр — эш үзгәрде, ә машинага беркем кагылмады. Һәм механизмда тылсым юк: үрнәкләр \\( p(x_t \\mid x_{\\lt t}) \\) исәпләнә торган *контекстны* гына үзгәртә. Weights туңдырылган; градиент акмый.",
          "Бу тулы бер fine-tune йөгерүен алыштыра. Укучыга классификатор булыр өчен тамгаланган җыелма һәм өйрәтү циклы кирәк булган урында, монда син берничә үрнәк күрсәтәсең дә — сорыйсың гына. Бәясе симметрияле: бернәрсә дә сакланмый. Бурыч промптта гына яши — тукыманы кис, һәм киләсе промпт шул ук туңдырылган weights'тан башлана, шул ук үрнәкләрне яңадан кыстырырга туры килә.",
        ],
      },
    },
