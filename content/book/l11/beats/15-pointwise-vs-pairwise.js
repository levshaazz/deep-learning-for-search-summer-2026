    {
      id: 'pointwise-vs-pairwise', kind: 'prose',
      heading: { en: 'Pointwise vs. pairwise', ru: 'Поточечно против попарно', tt: 'Ноктадан-нокта каршы парлап' },
      imgPos: 'inline',
      body: {
        en: [
          "There are two ways to put the judge to work, and the choice shapes what you can trust. **Pointwise**: hand the judge *one* answer and ask for an absolute score on the rubric — *\"rate this answer 1–5 on grounding.\"* It gives you a number you can track over time and average across a test set. But absolute scores from an LLM drift: the same answer can earn \\(4\\) today and \\(3\\) next week, because the model has no fixed internal yardstick for \"what a 4 means.\"",
          "**Pairwise**: hand the judge *two* answers and ask only *\"which is better?\"* This sidesteps the calibration problem — relative judgments are far more stable than absolute ones, the same reason human raters find ranking easier than scoring. It is how Chatbot Arena builds its leaderboards: thousands of pairwise battles aggregated into an Elo rating. The cost is that you get an *ordering*, not a *level* — pairwise tells you A beats B, never that both are terrible.",
          "Most serious eval pipelines use **both**: pointwise scores for tracking absolute quality and catching regressions, pairwise battles for ranking candidate systems against each other. But pairwise has a hidden vulnerability that pointwise mostly avoids — *position*. When you show the judge two answers, you have to put one first, and as the next beats measure, that ordering alone can swing the verdict.",
        ],
        ru: [
          "Есть два способа запрячь судью, и выбор определяет, чему можно доверять. **Поточечно**: дай судье *один* ответ и попроси абсолютную оценку по рубрике — *«оцени этот ответ 1–5 по заземлению».* Это даёт число, что можно отслеживать во времени и усреднять по тест-сету. Но абсолютные оценки LLM дрейфуют: тот же ответ может получить \\(4\\) сегодня и \\(3\\) через неделю, ведь у модели нет фиксированного внутреннего эталона «что значит 4».",
          "**Попарно**: дай судье *два* ответа и спроси лишь *«какой лучше?»* Это обходит проблему калибровки — относительные суждения куда устойчивее абсолютных, по той же причине, по которой людям-оценщикам ранжировать легче, чем выставлять баллы. Так Chatbot Arena строит свои таблицы лидеров: тысячи попарных боёв, сведённые в рейтинг Эло. Цена в том, что ты получаешь *порядок*, а не *уровень* — попарно говорит, что A бьёт B, но не что оба ужасны.",
          "Большинство серьёзных eval-конвейеров используют **оба**: поточечные оценки для слежения за абсолютным качеством и ловли регрессий, попарные бои для ранжирования систем-кандидатов друг против друга. Но у попарного есть скрытая уязвимость, которой поточечное в основном избегает — *позиция*. Когда показываешь судье два ответа, один приходится поставить первым, и, как измеряют следующие биты, один этот порядок может качнуть вердикт.",
        ],
        tt: [
          "Хөкемчене эшкә җигүнең ике ысулы бар, һәм сайлау нәрсәгә ышанырга икәнен билгели. **Ноктадан-нокта**: хөкемчегә *бер* җавап бир һәм рубрика буенча абсолют бәя сора — *«бу җавапны нигезләнү буенча 1–5 бәялә».* Бу вакыт буенча күзәтеп, тест-җыелма буенча уртачаларлык сан бирә. Ләкин LLM ның абсолют бәяләре авыша: шул ук җавап бүген \\(4\\), атнадан \\(3\\) алырга мөмкин, чөнки модельдә «4 нәрсә аңлата» дигән беркетелгән эчке үлчәгеч юк.",
          "**Парлап**: хөкемчегә *ике* җавап бир һәм бары *«кайсысы яхшырак?»* дип сора. Бу калибрлау проблемасын читләтеп үтә — чагыштырмача хөкемнәр абсолютлардан күпкә тотрыклы, кеше-бәяләүчеләргә бәя кую урынына ранжлау җиңелрәк булган шул ук сәбәптән. Chatbot Arena үзенең лидерлар таблицаларын шулай төзи: меңләгән парлы сугыш Эло рейтингына җыела. Бәясе шунда — син *тәртип* аласың, *дәрәҗә* түгел — парлап A B ны җиңә ди, ләкин икесе дә начар дип әйтми.",
          "Җитди eval-пайплайннарының күбесе **икесен дә** куллана: абсолют сыйфатны күзәтеп регрессияләрне тотар өчен ноктадан-нокта бәяләр, кандидат-системаларны бер-берсенә каршы ранжлар өчен парлы сугышлар. Ләкин парлапның яшерен зәгыйфьлеге бар, аннан ноктадан-нокта күбесенчә качып кала — *позиция*. Хөкемчегә ике җавап күрсәткәндә, берсен беренче куярга кирәк, һәм, киләсе битләр үлчәгәнчә, бу бер тәртип кенә хөкемне селкетә ала.",
        ],
      },
    },
