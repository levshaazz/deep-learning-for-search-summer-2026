    {
      id: 'hook-judging', kind: 'prose',
      heading: { en: 'Judging the Oracle', ru: 'Суд над Оракулом', tt: 'Оракулны хөкем итү' },
      img: 'L11/L11-00-judging-the-oracle.png', imgPos: 'scene',
      imgAlt: {
        en: 'Séréga sits across from RAGdoll the Oracle, holding up a scorecard, brow furrowed — the patchwork rag-doll answers fluently and confidently, but Séréga cannot tell from its face whether it is right or wrong.',
        ru: 'Серёга сидит напротив Оракула RAGdoll, держа оценочный лист и нахмурив брови, — лоскутная кукла отвечает бегло и уверенно, но по её лицу Серёга не может понять, права она или нет.',
        tt: 'Серёга RAGdoll Оракулы каршында утыра, бәяләү битен тотып, кашларын җыерган — ямаулы курчак шома һәм ышанычлы җавап бирә, ләкин аның йөзеннән Серёга аның дөресме-ялгышмы икәнен аера алмый.',
      },
      body: {
        en: [
          "Last lecture the Oracle learned to **speak**: retrieve the right passages, stuff them into the prompt, and generate a fluent, sourced answer. The pipeline lit green end to end. But it closed on a question that no amount of green could answer — **is it telling the truth?** Confabulous proved that a confident lie costs the model nothing, and from the outside a confident-and-wrong answer looks exactly like a confident-and-right one.",
          "So today we put the Oracle on trial. *How do you grade an Oracle that sounds confident whether it is right or wrong?* The metrics from the search era — precision, recall, MAP, nDCG — all assumed a **gold answer** to compare against. Generation has no gold key: there are a thousand ways to phrase a correct answer and a thousand more to phrase a fluent wrong one. This lecture builds the courtroom: **RAGAS** (reference-free RAG metrics), the **LLM-as-judge** (a model grading a model), and the **agentic loop** that lets the Ship grade and correct *itself*. And it is here that Goodhart, the villain who haunts every measure, makes his strongest return.",
        ],
        ru: [
          "В прошлой лекции Оракул научился **говорить**: достать нужные отрывки, вложить их в промпт и сгенерировать беглый ответ с источниками. Конвейер загорелся зелёным от начала до конца. Но он закончился вопросом, на который никакая зелень не отвечает — **говорит ли он правду?** Конфабулус доказал, что уверенная ложь не стоит модели ничего, а снаружи уверенно-неверный ответ выглядит ровно как уверенно-верный.",
          "Поэтому сегодня мы ставим Оракула под суд. *Как оценить Оракула, что звучит уверенно — прав он или нет?* Метрики поисковой эпохи — precision, recall, MAP, nDCG — все предполагали **золотой ответ** для сравнения. У генерации нет золотого ключа: есть тысяча способов сформулировать верный ответ и ещё тысяча — беглый неверный. Эта лекция строит зал суда: **RAGAS** (метрики RAG без эталона), **LLM-судья** (модель оценивает модель) и **агентный цикл**, что даёт Кораблю оценивать и исправлять *самого себя*. И именно здесь Гудхарт, злодей, преследующий всякую меру, совершает своё сильнейшее возвращение.",
        ],
        tt: [
          "Узган лекциядә Оракул **сөйләргә** өйрәнде: кирәкле өзекләрне ал, аларны промптка куй һәм чыганаклы шома җавап генерациялә. Пайплайн башыннан ахырына кадәр яшелгә кабынды. Ләкин ул бернинди яшеллек тә җавап бирмәгән сорау белән тәмамланды — **ул дөресен сөйлиме?** Конфабулус ышанычлы ялганның моделгә бернәрсә тормавын исбатлады, ә тыштан ышанычлы-ялгыш җавап нәкъ ышанычлы-дөрес кебек күренә.",
          "Шуңа бүген без Оракулны хөкемгә куябыз. *Дөресме-ялгышмы — ышанычлы яңгыраган Оракулны ничек бәяләргә?* Эзләү чорының метрикалары — precision, recall, MAP, nDCG — барысы да чагыштыру өчен **алтын җавап** күз алдында тотты. Генерациядә алтын ачкыч юк: дөрес җавапны формалаштыруның мең ысулы бар, шома ялгышын — тагын мең. Бу лекция хөкем залын төзи: **RAGAS** (эталонсыз RAG метрикалары), **LLM-хөкемче** (модель моделне бәяли) һәм **агент циклы**, ул Корабльгә *үзен-үзе* бәяләргә һәм төзәтергә бирә. Һәм нәкъ менә монда Goodhart, һәр үлчәүне эзәрлекләүче явыз, иң көчле кайтуын ясый.",
        ],
      },
    },
