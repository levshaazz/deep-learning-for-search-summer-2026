    {
      id: 'infonce-objective', kind: 'prose',
      heading: { en: 'Pick the positive out of N', ru: 'Выбери позитив из N', tt: 'N арасыннан позитивны сайла' },
      img: 'L13/L13-03-in-batch-arena.png', imgPos: 'scene',
      imgAlt: {
        en: "An arena where the query faces one true positive among a lineup of in-batch negatives — InfoNCE as a multiple-choice contest the model must win by scoring the positive highest.",
        ru: "Арена, где запрос стоит против одного истинного позитива среди шеренги внутрибатчевых негативов — InfoNCE как тест с выбором, который модель выигрывает, дав позитиву высший балл.",
        tt: "Сорау батч эчендәге негативлар сафы арасында бер чын позитивга каршы торган арена — InfoNCE сайлаулы тест буларак, монда модель позитивга иң югары балл биреп җиңәргә тиеш.",
      },
      imgCaption: {
        en: "InfoNCE is a multiple-choice exam: score the one positive above every negative in the line-up.",
        ru: "InfoNCE — экзамен с выбором ответа: поставить единственный позитив выше каждого негатива в шеренге.",
        tt: "InfoNCE — сайлаулы имтихан: бердәнбер позитивны сафтагы һәр негативтан өстен куярга.",
      },
      body: {
        en: [
          "The contrastive loss — **InfoNCE** — turns retrieval into a multiple-choice question: among the positive and a batch of negatives, score each by similarity, take a softmax at temperature \\(\\tau\\), and ask the model to put all its probability on the positive. The loss is \\(-\\log P^+\\).",
          "Read it once and the whole field clicks into place: better negatives make the multiple-choice question *harder and more informative*, and the temperature \\(\\tau\\) controls how sharply the model is forced to choose.",
        ],
        ru: [
          "Контрастная потеря — **InfoNCE** — превращает поиск в вопрос с выбором: среди позитива и батча негативов оцени каждого по сходству, возьми софтмакс при температуре \\(\\tau\\) и потребуй, чтобы модель положила всю вероятность на позитив. Потеря — \\(-\\log P^+\\).",
          "Прочитай это один раз — и всё поле встаёт на места: лучшие негативы делают вопрос с выбором *сложнее и информативнее*, а температура \\(\\tau\\) задаёт, насколько резко модель вынуждена выбирать.",
        ],
        tt: [
          "Контраст югалту — **InfoNCE** — эзләүне сайлаулы сорауга әйләндерә: позитив һәм негативлар батчы арасында һәркайсын охшашлык буенча бәялә, \\(\\tau\\) температурасында софтмакс ал һәм модельдән бөтен ихтималлыкны позитивга салуын сора. Югалту — \\(-\\log P^+\\).",
          "Моны бер тапкыр укы — бөтен өлкә урынына утыра: яхшырак негативлар сайлаулы сорауны *катлаулырак һәм мәгълүматлырак* итә, ә \\(\\tau\\) температурасы модельнең күпме кырыс сайларга мәҗбүрлеген билгели.",
        ],
      },
    },
