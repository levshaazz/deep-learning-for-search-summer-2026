    {
      id: 'rrf', kind: 'prose',
      heading: { en: 'Consensus beats a single favourite', ru: 'Согласие бьёт единственного любимца', tt: 'Килешү бердәнбер яраткандан көчлерәк' },
      body: {
        en: [
          "The union needs an order, and we already own the right tool — the same **Reciprocal Rank Fusion** from Lecture 3, borrowed for a new job. Each paraphrase returns a ranked list; RRF scores a document by summing a small reward for each list it appears in, weighted by *how high* it appears:",
          "$$ s(d) = \\sum_{i} \\frac{1}{k + r_i(d)}, \\qquad k = 60. $$",
          "Here \\( r_i(d) \\) is the rank of document \\( d \\) in the \\( i \\)-th list, and \\( k = 60 \\) is Cormack's constant. Read the sum aloud: a document that *several* phrasings agree on — appearing in list after list, even at middling rank — accumulates reward from each and climbs. A document that a *single* phrasing loves at rank 1 but no other phrasing sees gets one term and stalls. **Consensus across angles beats one phrasing's favourite.**",
          "Multi-query paraphrasing plus RRF fusion is exactly the recipe called **RAG-Fusion**. And the whole move rests on one condition from the previous beat: the paraphrases must genuinely *differ*. Fuse three phrasings that all miss the archive's word the same way and consensus just re-confirms the same blind spot.",
        ],
        ru: [
          "Объединению нужен порядок, а нужный инструмент у нас уже есть — та самая **Reciprocal Rank Fusion** из Лекции 3, взятая под новую задачу. Каждая перефразировка возвращает ранжированный список; RRF оценивает документ, суммируя малую награду за каждый список, где он встретился, со скидкой на то, *как высоко* он там стоит:",
          "$$ s(d) = \\sum_{i} \\frac{1}{k + r_i(d)}, \\qquad k = 60. $$",
          "Здесь \\( r_i(d) \\) — ранг документа \\( d \\) в \\( i \\)-м списке, а \\( k = 60 \\) — константа Кормака. Прочти сумму вслух: документ, с которым согласны *несколько* формулировок — встречаясь из списка в список, пусть и на средних местах, — набирает награду с каждой и поднимается. Документ, которого *одна* формулировка любит на первом месте, но не видит ни одна другая, получит одно слагаемое и заглохнет. **Согласие между углами бьёт любимца одной формулировки.**",
          "Мультизапросное перефразирование плюс фьюжн через RRF — это ровно рецепт под названием **RAG-Fusion**. И весь ход держится на одном условии из прошлого бита: перефразировки должны по-настоящему *различаться*. Слей три формулировки, что одинаково промахиваются мимо слова архива, — и согласие лишь заново подтвердит одну и ту же слепую зону.",
        ],
        tt: [
          "Берләшмәгә тәртип кирәк, ә кирәкле корал бездә инде бар — 3нче Лекциядәге шул ук **Reciprocal Rank Fusion**, яңа эш өчен алынган. Һәр башкачарак әйтү ранжирланган исемлек кайтара; RRF документны, ул очраган һәр исемлек өчен кечкенә бүләкне кушып, *ничек югары* торуына карап бәяли:",
          "$$ s(d) = \\sum_{i} \\frac{1}{k + r_i(d)}, \\qquad k = 60. $$",
          "Монда \\( r_i(d) \\) — \\( i \\)-нче исемлектәге \\( d \\) документының рангы, ә \\( k = 60 \\) — Кормак константасы. Кушуны кычкырып укы: *берничә* формулировка килешкән документ — исемлектән исемлеккә урта урыннарда булса да очрап — һәрберсеннән бүләк җыя һәм күтәрелә. *Бер* формулировка беренче урында яраткан, ләкин башка берсе күрмәгән документ бер кушылучан ала һәм тукталып кала. **Почмаклар арасындагы килешү бер формулировканың яраткәныннан көчлерәк.**",
          "Күп-сораулы башкачарак әйтү плюс RRF фьюжны — бу нәкъ **RAG-Fusion** дип аталган рецепт. Һәм бөтен адым үткән биттәге бер шартка таяна: башкачарак әйтүләр чыннан да *аерылырга* тиеш. Архив сүзеннән бертөрле читкә тигән өч формулировканы кушсаң — килешү шул ук сукыр почмакны яңадан раслый гына.",
        ],
      },
    },
