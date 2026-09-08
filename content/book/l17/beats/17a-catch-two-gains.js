    {
      id: 'catch-two-gains', kind: 'prose',
      heading: { en: 'Step-back wins twice — and that is a measurement trap', ru: 'Подъём выигрывает дважды — и это ловушка измерения', tt: 'Күтәрелү ике тапкыр ота — һәм бу үлчәү капкыны' },
      body: {
        en: [
          "Step-back has a second effect, and published measurements show it: on tasks where there is no retrieval at all, asking the general question first still improves the final answer. Nothing was retrieved — so the gain cannot be about having found the principle. It is about the principle having been said out loud, landing in the reader's context before the model started reasoning about the particular case.",
          "Good news for the technique, bad news for your ruler. Inside a RAG pipeline step-back changes two things at once: the string that goes to the retriever, and the material the reader sees. So a measured lift is the sum of two effects, and the workshop discipline — hold everything fixed except the query — quietly stops holding, because the query is not the only thing that moved.",
          "Separate them the cheap way. Score the retrieval stage on its own, with no reader involved: did the gold rise in the list, and how high — the same two rulers you used in L16, aimed at the result list instead of the answer. Then freeze the retrieved set and vary only what is handed to the reader. If the lift lives in the retrieval column, step-back closed your specificity gap. If it lives in the reading column, your gap was not specificity at all: you bought a better prompt and paid for a rewrite.",
        ],
        ru: [
          "У подъёма есть второй эффект, и он виден в опубликованных замерах: на задачах, где поиска нет вообще, заданный сначала общий вопрос всё равно улучшает итоговый ответ. Ничего не искали — значит, выигрыш не может быть про то, что принцип нашли. Он про то, что принцип оказался произнесён и лёг в контекст читающей модели раньше, чем та взялась рассуждать о частном случае.",
          "Для приёма это хорошая новость, а для твоей линейки — плохая. Внутри RAG-конвейера step-back меняет сразу две вещи: строку, которая уходит в ретривер, и материал, который видит читающая модель. Значит, измеренный подъём — сумма двух эффектов, а дисциплина мастерской «держи неподвижным всё, кроме запроса» тихо перестаёт работать: запрос — не единственное, что сдвинулось.",
          "Раздели их самым дешёвым способом. Оцени стадию поиска отдельно, без читающей модели: поднялось ли золото в списке и насколько высоко — те же две мерки, которыми ты мерил в L16, только направленные на выдачу, а не на ответ. А потом зафиксируй найденный набор и меняй лишь то, что подают на чтение. Если подъём живёт в столбце поиска — step-back закрыл твой разрыв специфичности. Если в столбце чтения — разрыв был вовсе не в специфичности: ты купил промпт получше и заплатил за переписывание.",
        ],
        tt: [
          "Күтәрелүнең икенче эффекты да бар, һәм ул бастырылган үлчәүләрдә күренә: эзләү бөтенләй булмаган мәсьәләләрдә дә алдан бирелгән гомуми сорау ахыргы җавапны яхшырта. Бернәрсә эзләнмәгән — димәк, отыш принципны тапкан өчен түгел. Ул принципның әйтелгән булуы һәм укучы модель конкрет очрак турында уйлана башлаганчы аның контекстына кереп ятуы турында.",
          "Алым өчен бу яхшы яңалык, ә синең линейкаң өчен начары. RAG-конвейеры эчендә step-back берьюлы ике нәрсәне үзгәртә: ретриверга китә торган юлны һәм укучы модель күргән материалны. Димәк, үлчәнгән күтәрелү — ике эффектның суммасы, ә остаханәнең «сораудан кала бөтен нәрсәне кузгатмыйча тот» дигән дисциплинасы тын гына эшләүдән туктый: кузгалганы бер сорау гына түгел.",
          "Аларны иң арзан ысул белән аер. Эзләү баскычын аерым, укучы модельсез бәялә: алтын исемлектә күтәрелдеме һәм никадәр югары — L16 дагы шул ук ике үлчәү, бары җавапка түгел, ә чыгарылмага юнәлдерелгәне. Аннары табылган җыелманы беркетеп куй һәм бары укуга бирелгәнен генә алыштыр. Күтәрелү эзләү баганасында яши икән — step-back синең конкретлык ярыгыңны япкан. Уку баганасында икән — ярык бөтенләй конкретлыкта булмаган: син яхшырак промпт сатып алгансың һәм күчереп язу өчен түләгәнсең.",
        ],
      },
    },
