    {
      id: 'depth-mlm-worked', kind: 'prose',
      heading: { en: "Mending one hole, in slow motion", ru: "Штопаем одну дыру — в замедленной съёмке", tt: "Бер тишекне ямыйбыз — әкренәйтелгән хәрәкәттә" },
      body: {
        en: [
          "Let me mend one hole in front of you — no numbers, just the motions. Take the sheet *the cat \\([MASK]\\) on the mat*: the third thread pulled out, the gap left open. The whole sheet goes through the encoder as usual, and every crossing is allowed: the empty position reaches left to \"cat\" and right to \"on the mat\" at the same instant. By the top of the stack the hole is no longer empty — it holds a contextual vector woven entirely from both banks of its neighbours.",
          "Now the **MLM head** leans in: one linear layer over that vector, projecting it onto the whole vocabulary — one logit per word-piece. A softmax turns the row of logits into a distribution, and among candidates like *sat*, *ran*, *is* the mass pools on the one that agrees with both banks: the cat *sat* on the mat, because \"cat\" stands on the left **and** \"on the mat\" stands on the right. Either bank alone could mislead; together they pin the verb down.",
          "The lesson is charged only at the holes: the training loss is cross-entropy at the masked positions and nowhere else. Punch holes, weave the sheet, guess the missing threads, pay for the misses — and that, repeated over an ocean of text, is the whole of BERT's schooling.",
        ],
        ru: [
          "Дай заштопаю одну дыру у тебя на глазах — без чисел, одними движениями. Возьми полотно *the cat \\([MASK]\\) on the mat*: третья нить выдернута, прореха открыта. Всё полотно идёт через энкодер как обычно, и все скрещения разрешены: пустая позиция тянется влево к «cat» и вправо к «on the mat» одновременно. К вершине стека дыра уже не пуста — в ней контекстный вектор, сотканный целиком из обоих берегов её соседей.",
          "Теперь склоняется **голова MLM**: один линейный слой над этим вектором, проекция на весь словарь — по логиту на каждое подслово. Софтмакс превращает строку логитов в распределение, и среди кандидатов вроде *sat*, *ran*, *is* масса стекается к тому, кто согласуется с обоими берегами: кошка именно *sat* on the mat, потому что слева стоит «cat» **и** справа стоит «on the mat». Один берег мог бы обмануть; вдвоём они пришпиливают глагол намертво.",
          "Урок оплачивается только у прорех: обучающий лосс — перекрёстная энтропия в замаскированных позициях и нигде больше. Пробей дыры, сотки полотно, угадай пропавшие нити, заплати за промахи — и это, повторённое над океаном текста, вся школа BERT.",
        ],
        tt: [
          "Әйдә, күз алдыңда бер тишекне ямыйм — саннарсыз, хәрәкәтләр белән генә. *the cat \\([MASK]\\) on the mat* тукымасын ал: өченче җеп тартып алынган, тишек ачык. Бөтен тукыма гадәттәгечә энкодер аша үтә, һәм барлык кисешүләр рөхсәт ителгән: буш позиция бер үк мизгелдә сулга «cat»ка һәм уңга «on the mat»ка сузыла. Стек түбәсенә җиткәндә тишек инде буш түгел — анда күршеләрнең ике ярыннан да тулысынча тукылган контекст векторы.",
          "Хәзер **MLM башы** иелә: шул вектор өстендә бер сызыклы катлам, бөтен сүзлеккә проекция — һәр кисәк-сүзгә берәр логит. Softmax логитлар юлын бүленешкә әйләндерә, һәм *sat*, *ran*, *is* кебек кандидатлар арасында авырлык ике яр белән дә килешкәненә җыела: песи нәкъ *sat* on the mat, чөнки сулда «cat» тора **һәм** уңда «on the mat» тора. Бер яр ялгыштыра алыр иде; икәү бергә алар фигыльне кадаклап куя.",
          "Дәрес бары тишекләрдә генә түләнә: өйрәтү лоссы — маскаланган позицияләрдәге кросс-энтропия, башка беркайда да түгел. Тишекләр тиш, тукыманы сук, югалган җепләрне тап, хаталар өчен түлә — һәм шушы, текст океаны өстендә кабатланып, BERT мәктәбенең бөтенесе.",
        ],
      },
    },
