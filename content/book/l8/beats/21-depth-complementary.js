    {
      id: 'depth-complementary', kind: 'prose',
      heading: { en: 'Neither army wins alone', ru: 'Ни одна армия не побеждает одна', tt: 'Берсе дә ялгыз җиңми' },
      body: {
        en: [
          "Why fuse at all? Because the two armies are genuinely complementary. On the zero-shot BEIR benchmark, robust **BM25** holds nDCG@10 \\(0.43\\) while dense **DPR** trails at \\(0.38\\) — yet on in-domain MS MARCO the order flips and dense wins easily. Lexical retrieval catches exact terms, rare words, and IDs; dense retrieval catches paraphrase and synonymy. Neither dominates everywhere.",
          "That is the textbook case for fusion: when two systems make *different* mistakes, combining them recovers documents each alone would miss. The question is only how to combine rankings whose scores you cannot compare.",
        ],
        ru: [
          "Зачем вообще сливать? Потому что две армии действительно дополняют друг друга. На zero-shot бенчмарке BEIR крепкий **BM25** держит nDCG@10 \\(0{,}43\\), а плотный **DPR** отстаёт на \\(0{,}38\\) — но на доменном MS MARCO порядок переворачивается, и плотный легко выигрывает. Лексический поиск ловит точные термины, редкие слова и идентификаторы; плотный — перефразировку и синонимию. Никто не доминирует везде.",
          "Это хрестоматийный случай для слияния: когда две системы делают *разные* ошибки, их объединение возвращает документы, которые каждая в одиночку упустила бы. Остаётся лишь вопрос, как объединить ранжирования, чьи оценки нельзя сравнить.",
        ],
        tt: [
          "Гомумән ни өчен кушарга? Чөнки ике гаскәр чыннан да бер-берсен тулыландыра. Zero-shot BEIR бенчмаркында нык **BM25** nDCG@10 \\(0{,}43\\) тота, ә тыгыз **DPR** \\(0{,}38\\) дә кала — әмма домендагы MS MARCO да тәртип әйләнә, һәм тыгыз җиңел җиңә. Лексик эзләү төгәл терминнарны, сирәк сүзләрне һәм идентификаторларны тота; тыгыз — башка сүзләр белән әйтелгәнне һәм синонимияне. Берсе дә һәр җирдә өстенлек итми.",
          "Бу — берләштерү өчен дәреслек очрагы: ике система *төрле* хаталар ясаганда, аларны кушу һәрберсе ялгыз җибәрә торган документларны кайтара. Бары бер сорау кала: балларын чагыштырып булмый торган ранжлауларны ничек берләштерергә.",
        ],
      },
    },
