    {
      id: 'positional', kind: 'prose',
      heading: { en: "The loom that forgot the order", ru: "Станок, который забыл порядок", tt: "Тәртипне оныткан станок" },
      body: {
        en: [
          "Here is a secret the loom won't confess on its own: attention has no sense of order. Shuffle the threads on the beam and the pattern comes out shuffled the very same way — nothing complains. It reads a *bag* of threads, not a line of them. So \"cat sat on mat\" and \"mat sat on cat\" arrive as the exact same heap, and the loom weaves them identically. That is a disaster for meaning.",
          "So before I feed the threads in, I clip a small tag onto each one — a **positional encoding** — added right onto its vector: \\( \\tilde{x}_t = x_t + PE_t \\). Now thread number three *knows* it is third, and \"first\" no longer looks like \"last.\"",
          "Two ways to stamp the tag. The original Transformer used *sinusoidal* marks — fixed \\(\\sin/\\cos\\) at many frequencies, no parameters, and they keep counting past any length seen in training. BERT instead *learns* a table of position tags, positions \\(0 \\dots 511\\) — more flexible, but it runs out at 512. Fixed and clever, or learned and capped: I choose by how long the cloth must grow.",
        ],
        ru: [
          "Вот тайна, которую станок сам не выдаст: у внимания нет чувства порядка. Переставь нити на навое — узор выйдет переставленным ровно так же, и никто не возмутится. Оно читает *мешок* нитей, а не строку. Поэтому «мать любит дочь» и «дочь любит мать» приходят одной и той же кучей, и станок ткёт их одинаково. Для смысла это катастрофа.",
          "Поэтому, прежде чем пустить нити в дело, я цепляю на каждую бирку — **позиционное кодирование** — прямо к её вектору: \\( \\tilde{x}_t = x_t + PE_t \\). Теперь третья нить *знает*, что она третья, и «первый» больше не похож на «последний».",
          "Ставить бирку можно двумя способами. Оригинальный Transformer брал *синусоидальные* метки — фиксированные \\(\\sin/\\cos\\) на разных частотах, без параметров, и они продолжают считать за пределами длин, виденных при обучении. BERT же *обучает* таблицу позиций \\(0 \\dots 511\\) — гибче, но заканчивается на 512. Фиксированное и хитрое или обучаемое и с потолком — выбираю по тому, насколько длинным будет полотно.",
        ],
        tt: [
          "Менә станок үзе әйтеп бирмәячәк сер: attention'да тәртип тойгысы юк. Җепләрне навойда алыштыр — үрнәк тә нәкъ шулай алышынып чыга, беркем ризасызлык белдерми. Ул җепләр *капчыгын* укый, юлны түгел. Шуңа күрә «песи этне тешләде» һәм «этне песи тешләде» бер үк өем булып килә, һәм станок аларны бертөрле үрә. Мәгънә өчен бу — фаҗига.",
          "Шуңа күрә, җепләрне эшкә җибәргәнче, мин һәрберсенә билге тагам — **positional encoding** — туры аның векторына өстәп: \\( \\tilde{x}_t = x_t + PE_t \\). Хәзер өченче җеп үзенең өченче икәнен *белә*, һәм «беренче» инде «соңгы»га охшамый.",
          "Билгене ике төрле сугарга була. Оригиналь Transformer *sinusoidal* билгеләр алды — төрле ешлыктагы фиксацияләнгән \\(\\sin/\\cos\\), параметрсыз, һәм алар өйрәнүдә күрелгән озынлыктан узып та санауны дәвам итә. BERT исә позицияләр \\(0 \\dots 511\\) таблицасын *өйрәнә* — сыгылмалырак, ләкин 512дә бетә. Фиксацияле дә хәйләкәр, яки өйрәнүле дә түшәмле — тукыма никадәр озын үсәчәгенә карап сайлыйм.",
        ],
      },
    },
