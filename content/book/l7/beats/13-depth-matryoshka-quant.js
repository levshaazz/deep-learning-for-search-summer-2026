    {
      id: 'depth-matryoshka-quant', kind: 'prose',
      heading: { en: 'Matryoshka & quantization', ru: 'Matryoshka и квантование', tt: 'Matryoshka һәм квантлау' },
      body: {
        en: [
          "Two tricks shrink the index. **Matryoshka** representation learning packs coarse meaning into the *first* dimensions, so you can truncate a 768-dim vector to 256 for about one MTEB point and a **3× smaller** index — OpenAI's large model at 256 dims still beats the old ada-002 at 1536.",
          "**Quantization** casts the floats: **int8** is 4× smaller at over 99% quality; **binary** is **32× smaller** and **~25× faster** (Hamming distance) for about 96%. The recipe that recovers the rest: search the quantized vectors, then **rescore the top-k at full precision**. Together they search all of Wikipedia's 41M texts in about a second on a CPU.",
        ],
        ru: [
          'Два приёма ужимают индекс. **Matryoshka** кладёт грубый смысл в *первые* измерения, поэтому вектор \\(768\\) можно усечь до \\(256\\) за ~1 пункт MTEB и индекс **втрое меньше** — модель OpenAI на 256 измерениях обходит старую ada-002 на 1536.',
          '**Квантование** меняет тип чисел: **int8** вчетверо меньше при качестве выше 99%; **бинарные** — **в 32× меньше** и **~25× быстрее** (расстояние Хэмминга) при ~96%. Приём, возвращающий остаток: искать по квантованным, затем **заново оценить топ-k с полной точностью**. Вместе они ищут по всем 41M текстам Википедии примерно за секунду на CPU.',
        ],
        tt: [
          'Ике алым индексны кысалар. **Matryoshka** тупас мәгънәне *беренче* үлчәмнәргә сала, шуңа \\(768\\) векторны \\(256\\)\'га кисеп була — MTEB\'та ~1 балл бәрабәренә һәм индекс **өч тапкыр кечерәк** — OpenAI\'ның 256 үлчәмдәге моделе иске ada-002\'не 1536\'да уза.',
          '**Квантлау** саннар тибын үзгәртә: **int8** дүрт тапкыр кечерәк, сыйфат 99%\'тан югары; **бинар** — **32 тапкыр кечерәк** һәм **~25 тапкыр тизрәк** (Хэмминг ераклыгы), ~96% сыйфат белән. Калганын кайтаручы рецепт: квантланганнар буенча эзлә, аннары **топ-k\'ны тулы төгәллектә кабат бәялә**. Бергә алар Википедиянең 41M текстын CPU\'да якынча секундта эзли.',
        ],
      },
    },
