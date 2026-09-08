    {
      id: 'bert-variants', kind: 'prose',
      heading: { en: "Four looms, one machine", ru: "Четыре станка, одна машина", tt: "Дүрт станок, бер машина" },
      body: {
        en: [
          "After BERT, the workshop filled with cousins — and I want to be honest about them: *none* rebuilt the loom. All four are still encoder-only machines weaving the whole cloth bidirectionally. What each one fixed was the *recipe*, the *parts*, or the *lesson* — never the weave itself.",
          "**RoBERTa** just trained the same loom *more carefully*: more thread, more epochs, a mask that reshuffles every pass instead of freezing, bigger batches — and it threw out NSP as dead weight. **ALBERT** built the same cloth from *fewer parts* — it factors the vocabulary embedding and lets every layer share one set of weights (though a slim loom still runs the full pass, so it saves memory, not compute).",
          "**DistilBERT** puts a small apprentice loom beside the master and has it copy the teacher's *soft* choices — about *40% smaller, 60% faster,* and still *~97%* of the quality. **ELECTRA** changes the *lesson*: a tiny helper swaps in plausible fakes, and ELECTRA judges *every single thread* — real or replaced? — so the signal comes from all positions, not just the 15% you masked. Four cousins, one machine.",
        ],
        ru: [
          "После BERT мастерская наполнилась роднёй — и я хочу быть честным: *ни один* родич не перестроил станок. Все четверо остаются машинами-энкодерами, которые ткут полотно целиком, в обе стороны. Каждый чинил *рецепт*, *детали* или *урок* — но не сам переплёт.",
          "**RoBERTa** просто обучила тот же станок *тщательнее*: больше пряжи, больше эпох, маска, которая перетасовывается на каждом проходе, а не застывает, батч побольше — и выбросила NSP как балласт. **ALBERT** собрал то же полотно из *меньшего числа деталей* — факторизует эмбеддинг словаря и отдаёт всем слоям один и тот же набор весов (но тонкий станок всё равно гонит полный проход: экономит память, а не вычисления).",
          "**DistilBERT** ставит рядом маленький станок-подмастерье и учит копировать *мягкие* решения мастера — примерно на *40% меньше, на 60% быстрее,* и всё ещё *~97%* качества. **ELECTRA** меняет *урок*: крошечный помощник подсовывает правдоподобные подделки, а ELECTRA судит *каждую нить* — оригинал или подмена? — и сигнал идёт со всех позиций, а не с 15% замаскированных. Четверо родичей — одна машина.",
        ],
        tt: [
          "BERT'тан соң остаханә туганнар белән тулды — һәм мин намуслы булырга телим: *берсе дә* станокны яңадан төземәде. Дүртесе дә encoder-only машина булып кала, тукыманы бөтенләй, ике якка тукыйлар. Һәрберсе *рецептны*, *өлешләрне* яки *дәресне* төзәтте — тукуны түгел.",
          "**RoBERTa** шул ук станокны бары тик *җентеклерәк* өйрәтте: күбрәк җеп, күбрәк эпоха, һәр үтештә кабат бутала торган маска — катып калмый, зуррак batch — һәм NSP'ны артык йөк итеп ташлады. **ALBERT** шул ук тукыманы *азрак өлештән* җыйды — сүзлек эмбеддингын факторлаштыра һәм барлык катламнарга бер үк авырлыкларны бүлә (ләкин нечкә станок барыбер тулы үтеш ясый: хәтерне саклый, исәпләүне түгел).",
          "**DistilBERT** оста янына кечкенә шәкерт-станок куя һәм останың *йомшак* сайлауларын күчерергә өйрәтә — якынча *40% кечерәк, 60% тизрәк,* һәм әле дә сыйфатның *~97%'ы.* **ELECTRA** *дәресне* үзгәртә: кечкенә ярдәмче ышандыргыч ялганнар куеп тора, ә ELECTRA *һәр җепне* хөкем итә — оригиналмы, алмаштырылганмы? — сигнал барлык урыннардан килә, маскаланган 15%'тан гына түгел. Дүрт туган, бер машина.",
        ],
      },
    },
