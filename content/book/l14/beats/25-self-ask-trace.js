    {
      id: 'self-ask-trace', kind: 'prose',
      heading: { en: 'A self-ask, traced', ru: 'Self-ask по шагам', tt: 'Self-ask эзе' },
      body: {
        en: [
          "Watch the quill think out loud on a two-hop question: *\"Was the barista who won the 2019 world title trained on the same machine I own?\"* The model does not lunge at an answer. It first asks itself a gate question — **\"Are follow-up questions needed here?\"** — and answers *yes*, because two facts must meet before this can be settled.",
          "So it opens the first follow-up: *\"Who won the 2019 world barista title?\"* It retrieves, reads, and writes down the intermediate answer — a name. Only with that name in hand can the next hop even be phrased: *\"What machine was that barista trained on?\"* A fresh retrieval, a fresh intermediate answer — a model. Each hop is a small, self-contained self-ask, and each depends on the answer that came before it.",
          "When the model asks itself the gate question once more and finally answers *\"no more follow-ups needed,\"* it composes: it sets the trained-on machine beside the one I own and commits to the final answer. This is the HotpotQA-style multi-hop pattern — *ask whether you need to ask, answer each intermediate question in turn, and only then commit*. The reasoning trace is not decoration; it is the scaffold that keeps a scattered answer from collapsing.",
        ],
        ru: [
          "Посмотри, как перо думает вслух над двухшаговым вопросом: *«Обучался ли бариста, выигравший мировой титул 2019 года, на той же машине, что стоит у меня?»* Модель не бросается к ответу. Сначала она задаёт себе вопрос-ворота — **«Нужны ли здесь уточняющие вопросы?»** — и отвечает *да*, ведь два факта должны встретиться, прежде чем это можно решить.",
          "И она открывает первый уточняющий: *«Кто выиграл мировой титул бариста в 2019 году?»* Она ищет, читает и записывает промежуточный ответ — имя. Только с этим именем в руках можно вообще сформулировать следующий шаг: *«На какой машине обучался этот бариста?»* Новый поиск, новый промежуточный ответ — модель машины. Каждый шаг — маленький самодостаточный self-ask, и каждый зависит от ответа, пришедшего до него.",
          "Когда модель снова задаёт себе вопрос-ворота и наконец отвечает *«больше уточнений не нужно»*, она собирает: ставит машину, на которой учился бариста, рядом с моей и утверждает финальный ответ. Это многошаговый паттерн в духе HotpotQA — *спроси, нужно ли спрашивать, ответь на каждый промежуточный вопрос по очереди и лишь затем утверждай*. Цепочка рассуждений — не украшение; это каркас, который не даёт разбросанному ответу рассыпаться.",
        ],
        tt: [
          "Каләмнең ике адымлы сорау өстендә кычкырып уйлавын күзәт: *«2019 елгы дөнья титулын откан бариста мин йөрткән шул ук машинада өйрәнгәнме?»* Модель җавапка ташланмый. Башта ул үзенә капка-сорауны бирә — **«Монда ачыклаучы сораулар кирәкме?»** — һәм *әйе* дип җавап бирә, чөнки моны хәл итәр алдыннан ике факт очрашырга тиеш.",
          "Шулай итеп ул беренче ачыклаучыны ача: *«2019 елда дөнья бариста титулын кем откан?»* Ул эзли, укый һәм арадаш җавапны — исемне — язып куя. Бары шул исем кулда булганда гына киләсе адымны гомумән формалаштырырга мөмкин: *«Ул бариста нинди машинада өйрәнгән?»* Яңа эзләү, яңа арадаш җавап — машина моделе. Һәр адым — кечкенә, үзе җитәрлек self-ask, һәм һәрберсе аңа кадәр килгән җавапка бәйле.",
          "Модель капка-сорауны тагын бер тапкыр үзенә биреп, ниһаять, *«башка ачыклау кирәкми»* дип җавап биргәч, ул җыя: баристаның өйрәнгән машинасын минекенең янәшәсенә куеп, ахыргы җавапны раслый. Бу — HotpotQA рухындагы күп адымлы үрнәк — *сорарга кирәкме дип сора, һәр арадаш сорауга чиратлап җавап бир, һәм бары шуннан соң раслы*. Фикер йөртү эзе — бизәк түгел; ул таралган җавапны таркалудан саклаган каркас.",
        ],
      },
    },
