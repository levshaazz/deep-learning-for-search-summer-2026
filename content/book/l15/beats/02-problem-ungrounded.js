    {
      id: 'problem-ungrounded', kind: 'prose',
      heading: { en: 'Confident ≠ correct', ru: 'Уверенно ≠ верно', tt: 'Ышанычлы ≠ дөрес' },
      img: 'L10/L10-01-confident-and-wrong.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Séréga asks a bare floating LLM brain; it answers fluently but the speech-bubble has no source and a wrong date — RAGdoll slumps, a seam unravelling.',
        ru: 'Серёга спрашивает голый парящий «мозг-LLM»; тот отвечает бегло, но в облачке нет источника и неверная дата — RAGdoll оседает, шов расходится.',
        tt: 'Серёга ялангач очып торган «LLM-мие» сорый; ул шома җавап бирә, ләкин куыкта чыганак юк һәм дата ялгыш — RAGdoll шуа, җөе сүтелә.',
      },
      body: {
        en: [
          "A bare LLM has three failures as a *search answer*. **Stale**: its parametric memory froze at training time, so last week's release or last night's news simply isn't there. **Unciteable**: it cannot point to a source, so you cannot verify it. **Confident either way**: a correct answer and a fabricated one come out in the same fluent, assured voice — the reader cannot tell them apart.",
          "The fix is not a bigger model; it is **grounding**. Don't ask the model to *know* — make it *read* what we retrieved, then answer using only that, with citations. That is the RAG loop, and the rest of this lecture builds it.",
        ],
        ru: [
          "У голой LLM три провала как *поискового ответа*. **Устаревание**: параметрическая память застыла на моменте обучения, поэтому релиза прошлой недели или вчерашних новостей там просто нет. **Нецитируемость**: она не может указать источник, и проверить нельзя. **Уверенность в любом случае**: верный ответ и выдуманный звучат одинаково бегло и убеждённо — читатель их не различит.",
          "Решение — не модель побольше, а **заземление**. Не проси модель *знать* — заставь её *прочитать* то, что мы извлекли, и ответить только по этому, со ссылками. Это и есть цикл RAG, и остаток лекции его строит.",
        ],
        tt: [
          "Ялангач LLM ның *эзләү җавабы* буларак өч җимерелүе бар. **Искерү**: параметрик хәтере өйрәтү вакытында туңган, шуңа узган атнаның релизы яки кичәге яңалыклар анда юк. **Цитата ясап булмый**: ул чыганакка күрсәтә алмый, тикшереп булмый. **Һәрхәлдә ышанычлы**: дөрес җавап һәм уйлап чыгарылган бер үк шома, ышанычлы тавыш белән чыга — укучы аларны аера алмый.",
          "Чишелеш — зуррак модель түгел, ә **җиргә беркетү**. Модельдән *белүен* сорама — аны без тапканны *укырга* мәҗбүр ит, аннары бары шуның буенча, сылтамалар белән җавап бирсен. Бу — RAG циклы, һәм лекциянең калганы аны төзи."
        ],
      },
    },
