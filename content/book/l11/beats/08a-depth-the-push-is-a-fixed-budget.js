    {
      id: 'depth-the-push-is-a-fixed-budget', kind: 'prose',
      heading: { en: 'The push is one budget, and it always sums to one', ru: 'Толчок — один бюджет, и он всегда сходится к единице', tt: 'Этү — бер бюджет, һәм ул һәрвакыт берәмлеккә җыела' },
      body: {
        en: [
          "The weights are a softmax, so whatever the batch happens to hold, they sum to one. That single fact turns loose talk about negatives into arithmetic: a negative does not *have* a gradient, it has a **share** of a fixed one. Adding an opponent to the lineup can only take weight away from the opponents already standing there.",
          "Two consequences follow, and they point opposite ways. Easy negatives are harmless filler — their weight is near zero, so a great many of them dilute the hard ones by almost nothing, which is precisely why a massive in-batch stage can be piled on without blunting the edge. A second *equally hard* negative is the opposite case: it halves the share the first one used to hold. Easiness is free to add; hardness is rivalrous.",
          "That is the arithmetic under a result this chapter reported and did not explain: one mined hard negative bought a large jump, and a second bought nothing further. It was never that the second negative was bad. It was that the first had already claimed the budget, and now the two of them split what one of them used to own. So ask of a mining strategy not how many negatives it produces, but how the softmax will divide the pouch between them.",
        ],
        ru: [
          'Веса — это софтмакс, поэтому что бы ни лежало в батче, они дают в сумме единицу. Один этот факт превращает разговоры о негативах в арифметику: у негатива нет *своего* градиента — у него есть **доля** общего и неизменного. Добавить противника в строй можно только за счёт тех, кто уже там стоит.',
          'Отсюда два следствия, и смотрят они в разные стороны. Лёгкие негативы — безобидный наполнитель: их вес почти нулевой, так что даже множество их разбавляет трудных почти никак, — ровно поэтому массовый этап in-batch можно наваливать, не притупляя кромку. Второй *равно трудный* негатив — случай обратный: он вдвое урезает долю, которой владел первый. Лёгкость добавляется даром; трудность делится.',
          'Это и есть арифметика под результатом, который глава сообщила, но не объяснила: один добытый трудный негатив дал большой скачок, а второй не дал ничего. Дело никогда не было в том, что второй негатив плох. Дело в том, что первый уже забрал бюджет, и теперь двое делят то, чем прежде владел один. Так что спрашивай со стратегии майнинга не сколько негативов она производит, а как софтмакс поделит между ними кошель.',
        ],
        tt: [
          'Авырлыклар — софтмакс, шуңа батчта нәрсә генә ятмасын, алар суммада берәмлек бирә. Шушы бер факт негативлар турындагы буш сүзне арифметикага әйләндерә: негативның *үз* градиенты юк — аның уртак һәм үзгәрмәс градиенттагы **өлеше** бар. Стройга көндәш өстәү анда инде торучылар хисабына гына мөмкин.',
          'Моннан ике нәтиҗә чыга, һәм алар төрле якка карый. Җиңел негативлар — зарарсыз тутыргыч: аларның авырлыгы диярлек нуль, шуңа аларның күплеге дә авырларны диярлек сыекландырмый — нәкъ шуңа күрә массакүләм in-batch этабын кырыйны тупасландырмыйча өяргә мөмкин. Икенче *шулкадәр үк катлаулы* негатив — киресенчә: ул беренчесе тоткан өлешне яртылаш кыскарта. Җиңеллекне өстәү бушлай; катлаулык исә бүленә.',
          'Менә шушы — бүлек әйткән, ләкин аңлатмаган нәтиҗә астындагы арифметика: казып алынган бер катлаулы негатив зур сикереш бирде, ә икенчесе бернәрсә дә өстәмәде. Эш беркайчан икенче негативның начарлыгында булмады. Эш шунда: беренчесе бюджетны инде алган иде, һәм хәзер икәү элек берәү тоткан нәрсәне бүлешә. Шуңа күрә майнинг стратегиясеннән ул күпме негатив бирүен түгел, ә софтмакс алар арасында янчыкны ничек бүләчәген сора.',
        ],
      },
    },
