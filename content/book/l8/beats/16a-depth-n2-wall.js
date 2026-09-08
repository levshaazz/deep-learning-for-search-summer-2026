    {
      id: 'depth-n2-wall', kind: 'prose',
      heading: { en: "Every thread against every thread: the quadratic wall", ru: "Каждая нить против каждой: квадратичная стена", tt: "Һәр җеп һәр җепкә каршы: квадратик стена" },
      body: {
        en: [
          "Where exactly does the wall stand? In the score matrix. Attention computes \\(E = QK^{\\top}\\): one score for every pair of threads, an \\(n \\times n\\) sheet — *per head, per layer*. Double the length of the cloth and the crossings do not double, they *quadruple*; stretch it tenfold and the sheet grows a hundredfold. On a short scarf the sheet is a trifle; walk the length out to a real document — a contract, a book chapter — and the score sheets alone, head after head, layer after layer, swallow the whole bench. That is what \\(O(n^2)\\) means once it stops being notation and starts being memory.",
          "And note *what kind* of cost this is. The arithmetic itself — the multiplications — is the smaller half of the pain; the killer is *materializing* the \\(n \\times n\\) sheet in the loom's slow, distant memory and hauling it back and forth. That diagnosis writes the prescription twice over: you can keep the mathematics and change the *order* of the work, so the sheet never exists whole — or change the *mathematics itself*, so there is less sheet to make. The next two beats open those two doors in turn.",
        ],
        ru: [
          "Где именно стоит стена? В матрице оценок. Внимание считает \\(E = QK^{\\top}\\): по оценке на каждую пару нитей, лист \\(n \\times n\\) — *на голову, на слой*. Удвой длину полотна — пересечения не удвоятся, а *учетверятся*; вытяни её вдесятеро — лист разрастётся во сто крат. На коротком шарфе этот лист — пустяк; растяни длину до настоящего документа — договора, главы книги — и одни только листы оценок, голова за головой, слой за слоем, съедят весь верстак. Вот что значит \\(O(n^2)\\), когда оно перестаёт быть значком и становится памятью.",
          "И заметь, *какого рода* эта цена. Сама арифметика — умножения — меньшая половина беды; убивает *материализация* листа \\(n \\times n\\) в медленной, дальней памяти станка и таскание его туда-сюда. Этот диагноз дважды выписывает рецепт: можно сохранить математику и поменять *порядок* работы — чтобы лист никогда не существовал целиком, — а можно поменять саму *математику* — чтобы листа требовалось меньше. Следующие два такта открывают эти двери по очереди.",
        ],
        tt: [
          "Стена нәкъ кайда тора? Баллар матрицасында. Attention \\(E = QK^{\\top}\\) исәпли: һәр җеп парына берәр балл, \\(n \\times n\\) табак — *башка, катламга*. Тукыманың озынлыгын икеләт — кисешүләр икеләтелми, *дүртләтелә*; ун тапкыр суз — табак йөз тапкыр үсә. Кыска шарфта бу табак — вак нәрсә; озынлыкны чын документка кадәр суз — килешүгә, китап бүлегенә — һәм бары баллар табаклары гына, баш арты баш, катлам арты катлам, бөтен верстакны йота. Билге булудан туктап хәтергә әйләнгәч, \\(O(n^2)\\) менә шуны аңлата.",
          "Һәм бу бәянең *нинди төрдән* икәнен күр. Арифметика үзе — тапкырлаулар — газапның кечерәк яртысы; үтерә торганы — \\(n \\times n\\) табакны станокның әкрен, ерак хәтерендә *материализацияләү* һәм аны әрле-бирле ташу. Бу диагноз рецептны ике тапкыр яза: математиканы саклап, эш *тәртибен* үзгәртергә мөмкин — табак беркайчан тулаем яшәмәсен, — яки *математиканың* үзен үзгәртергә — табак азрак кирәк булсын. Киләсе ике такт бу ике ишекне чиратлап ача.",
        ],
      },
    },
