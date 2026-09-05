    {
      id: 'climb-mmbert-shares', kind: 'prose',
      heading: { en: "A hundred all the way, seventeen hundred at the end", ru: "Сто всю дорогу, тысяча семьсот в конце", tt: "Йөзе бөтен юлда, мең җиде йөзе ахырда" },
      body: {
        en: [
          "Turn the headline number into arithmetic and it stops being marketing. Of mmBERT's 1800+ languages, 1700 enter only during the decay phase. Subtract: **100** languages ride the whole training run. That is not a coincidence — it is precisely the coverage the previous generation offers, the 100 of multilingual-E5, the 100+ of BGE-M3, the 109 of LaBSE from the table two beats ago.",
          "So the honest description of mmBERT is not «a model that knows 1800 languages instead of 100». It is «the same hundred, plus seventeen hundred seated at the end» — and the share matters: \\(1700/1800 = 94.4\\,\\%\\) of its coverage was bought in the phase where the learning rate had already collapsed.",
          "Which is exactly why it works, and why it could not have worked earlier. Early, with big steps, a tiny corpus for a rare language would be drowned by the languages with terabytes — or, worse, would drag the shared space toward itself and damage them. Late, with a small step, the space already exists: the new language finds a seat in it, and the old ones do not move.",
          "Carry the shape, not the number. When someone offers you a model «supporting 1800 languages», the question to ask is not how many but *when* — a language present from the start and a language added in the final phase are two different promises, and only the benchmark on your own data tells you which one you got.",
        ],
        ru: [
          "Переведи рекламное число в арифметику — и оно перестанет быть рекламой. Из 1800+ языков mmBERT 1700 входят только в фазе затухания. Вычти: **100** языков едут весь прогон обучения. Это не совпадение — ровно такое покрытие даёт прежнее поколение: 100 у multilingual-E5, 100+ у BGE-M3, 109 у LaBSE из таблицы двумя тактами раньше.",
          "Значит честное описание mmBERT звучит не как «модель, знающая 1800 языков вместо ста». Оно звучит как «та же сотня плюс тысяча семьсот, посаженных в конце» — и доля тут важна: \\(1700/1800 = 94{,}4\\,\\%\\) покрытия куплено в фазе, где шаг обучения уже обвалился.",
          "Ровно поэтому это и работает — и не сработало бы раньше. Рано, при большом шаге, крошечный корпус редкого языка утонул бы среди языков с терабайтами или, хуже, потянул бы общее пространство на себя и испортил их. Поздно, при малом шаге, пространство уже построено: новый язык находит в нём место, а старые не сдвигаются.",
          "Унеси форму, а не число. Когда тебе предлагают модель «с поддержкой 1800 языков», спрашивать надо не сколько, а *когда*: язык, присутствовавший с начала, и язык, добавленный в финальной фазе, — это два разных обещания, и какое из них тебе досталось, скажет только замер на твоих данных.",
        ],
        tt: [
          "Реклама санын арифметикага күчер — һәм ул реклама булудан туктый. mmBERT'ның 1800дән артык теленең 1700е фәкать сүнү фазасында керә. Алып ташла: **100** тел бөтен өйрәтү барышын үтә. Бу очраклылык түгел — нәкъ шундый каплауны алдагы буын бирә: multilingual-E5'та 100, BGE-M3'та 100+, ике такт элеккеге таблицадагы LaBSE'да 109.",
          "Димәк, mmBERT'ның намуслы тасвирламасы «йөз урынына 1800 тел белә торган модель» дип яңгырамый. Ул «шул ук йөз, өстәвенә ахырда утыртылган мең җиде йөз» дип яңгырый — һәм монда өлеш мөһим: каплауның \\(1700/1800 = 94{,}4\\,\\%\\) е өйрәтү адымы инде егылган фазада сатып алынган.",
          "Нәкъ шуңа күрә бу эшли — һәм иртәрәк эшләмәс тә иде. Иртә, зур адым белән, сирәк телнең бик кечкенә корпусы терабайтлы телләр арасында батар иде яисә, начаррагы, гомуми пространствоны үзенә тартып, аларны бозар иде. Соң, кечкенә адым белән, пространство инде төзелгән: яңа тел анда урын таба, ә искеләре кузгалмый.",
          "Форманы алып кит, санны түгел. Сиңа «1800 телне яклый торган» модель тәкъдим иткәндә, күпме дип түгел, *кайчан* дип сорарга кирәк: башыннан булган тел белән финал фазасында өстәлгән тел — ике төрле вәгъдә, ә сиңа кайсы эләккәнен бары тик үз мәгълүматыңдагы үлчәү генә әйтә.",
        ],
      },
    },
