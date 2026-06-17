    {
      id: 'catch-garbage-in-worked', kind: 'prose',
      heading: { en: 'Garbage in, fluent garbage out', ru: 'Мусор на входе — беглый мусор на выходе', tt: 'Чүп керсә — шома чүп чыга' },
      img: 'L10/L10-07-garbage-in.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Confabulous — a wispy phantom with a too-wide grin — hands RAGdoll a forged "trust me" citation-scroll; RAGdoll, fed garbage, recites it confidently; Séréga frowns.',
        ru: 'Конфабулус — призрак с чересчур широкой улыбкой — вручает RAGdoll поддельный свиток-цитату «доверься мне»; RAGdoll, накормленный мусором, уверенно его декламирует; Серёга хмурится.',
        tt: 'Конфабулус — артык киң елмаюлы өрәк — RAGdoll га «миңа ышан» дигән ялган цитата-төргәген бирә; чүп белән туендырылган RAGdoll аны ышанычлы укый; Серёга кашын җыера.',
      },
      body: {
        en: [
          "RAG has a sharp failure mode, and the poisoned pipeline above shows it: if **retrieve** brings back wrong or irrelevant passages, **augment** stuffs them in, and **generate** dutifully writes a fluent, confident answer grounded in *garbage*. The recall floor strikes again — the generator can only be as good as what retrieval brought back.",
          "Here is **Confabulous**, the hallucination phantom, in its first appearance: it hands the Oracle a forged citation, and the Oracle recites it with the same assurance as a true one. Confident and correct look identical from the outside — which is precisely the problem the next lecture must solve. How do you *grade* an Oracle?",
        ],
        ru: [
          "У RAG есть резкий режим отказа, и отравленный конвейер выше его показывает: если **извлечение** возвращает неверные или нерелевантные отрывки, **дополнение** вставляет их, а **генерация** послушно пишет беглый, уверенный ответ, заземлённый в *мусоре*. Снова бьёт пол recall — генератор не лучше того, что принёс поиск.",
          "Вот **Конфабулус**, призрак галлюцинаций, в первом появлении: он вручает Оракулу поддельную цитату, и Оракул декламирует её с той же уверенностью, что и настоящую. Уверенный и верный снаружи неотличимы — а это ровно та проблема, что должна решить следующая лекция. Как *оценить* Оракула?",
        ],
        tt: [
          "RAG ның кискен җимерелү режимы бар, һәм өстәге агуланган пайплайн аны күрсәтә: **алу** ялгыш яки релевант булмаган өзекләр кайтарса, **өстәү** аларны кертә, ә **генерация** *чүпкә* нигезләнгән шома, ышанычлы җавапны тыңлап яза. Recall идәне тагын суга — генератор эзләү кайтарганнан да яхшырак була алмый.",
          "Менә **Конфабулус**, галлюцинация өрәге, беренче чыгышында: ул Оракулга ялган цитата бирә, һәм Оракул аны чын кебек үк ышаныч белән укый. Ышанычлы һәм дөрес тыштан аерылмый — бу нәкъ киләсе лекция чишәргә тиешле проблема. Оракулны ничек *бәяләргә*?"
        ],
      },
    },
