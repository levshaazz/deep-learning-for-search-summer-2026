    {
      id: 'depth-instruction-prefixes', kind: 'prose',
      heading: { en: 'Instruction prefixes & asymmetry', ru: 'Префиксы-инструкции и асимметрия', tt: 'Күрсәтмә-префикслар һәм асимметрия' },
      body: {
        en: [
          "A query and a passage live on different distributions — short and under-specified versus long and declarative — so many encoders are trained with a **role prefix**, and omitting it *measurably* hurts. **E5** prepends `query: ` to queries and `passage: ` to documents. **BGE** prepends a `Represent this sentence for searching relevant passages:` instruction to the query only.",
          "This is **DPR's asymmetric two towers, folded into one** shared encoder plus a role token — cheaper than two separate models, and the reason a question and its answer-passage land close despite different surface form. For symmetric tasks (similarity, clustering) you simply use the query prefix on both sides.",
        ],
        ru: [
          'Запрос и документ живут на разных распределениях — короткий и недосказанный против длинного и утвердительного — поэтому многие энкодеры обучают с **префиксом роли**, и без него качество *заметно* падает. **E5** дописывает `query: ` к запросам и `passage: ` к документам. **BGE** дописывает инструкцию `Represent this sentence…:` только к запросу.',
          'Это **асимметричные две башни DPR, свёрнутые в один** общий энкодер плюс токен роли — дешевле двух отдельных моделей и причина, по которой вопрос и отвечающий отрывок оказываются рядом, несмотря на разную форму. Для симметричных задач (похожесть, кластеризация) просто берут префикс запроса с обеих сторон.',
        ],
        tt: [
          'Сорау һәм документ төрле бүленешләрдә яши — кыска һәм тулы әйтелмәгән, озын һәм раслаучан — шуңа күп энкодерлар **роль префиксы** белән өйрәтелә, ансыз сыйфат *сизелерлек* төшә. **E5** сорауларга `query: `, документларга `passage: ` өсти. **BGE** `Represent this sentence…:` күрсәтмәсен бары тик сорауга гына өсти.',
          'Бу — **DPR\'ның асимметрик ике манарасы, бер** уртак энкодерга роль токены белән җыелган — ике аерым модельгә караганда арзанрак, һәм сорау белән җавап-өзеге, формалары төрле булса да, янәшә төшүнең сәбәбе. Симметрик мәсьәләләр (охшашлык, кластерлау) өчен сорау префиксын ике якта да кулланалар.',
        ],
      },
    },
