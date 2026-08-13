    {
      id: 'turn-chunking', kind: 'prose',
      heading: { en: 'How you cut decides what you can find', ru: 'Как нарежешь — то и найдёшь', tt: 'Ничек кисәсең — шуны табасың' },
      img: 'L10/L10-03-chunk-norris.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Chunk Norris roundhouse-kicks a long scroll into equal passages; Tokenosaurus snips sub-words in the corner; Séréga measures the overlap so nothing falls between slices.',
        ru: 'Чанк Норрис вертушкой разбивает длинный свиток на равные отрывки; Токенозавр в углу щёлкает суб-слова; Серёга вымеряет перекрытие, чтобы ничего не провалилось между ломтями.',
        tt: 'Чанк Норрис озын төргәкне әйләнмә тибү белән тигез өзекләргә бүлә; почмакта Токенозавр суб-сүзләрне кисә; Серёга кисемнәр арасына бернәрсә төшмәсен өчен кисешүне үлчи.',
      },
      body: {
        en: [
          "Before retrieval can find a passage, **chunking** must have carved it. The corpus is split into fixed-size pieces, each embedded and indexed — and you can only ever retrieve a *whole chunk*. So the cut decides what is findable: if the answer is split across two chunks, no single retrieval brings it back whole. **Chunk Norris** chops the scroll into equal passages; **Tokenosaurus** (Lecture 2) reminds us the pieces are sub-word tokens, not characters.",
          "The same `rag-pipeline` figure returns, now with its **chunk→embed** stage in focus — the input stage that decides everything downstream. The knobs are **size** and **overlap**, and the next climb makes their effect exact.",
        ],
        ru: [
          "Прежде чем поиск найдёт отрывок, его должно было нарезать **чанкование**. Корпус режется на куски фиксированного размера, каждый кодируется и индексируется — и извлечь можно только *целый чанк*. Значит, нарезка решает, что вообще находимо: если ответ разрезан между двумя чанками, ни одно извлечение не вернёт его целиком. **Чанк Норрис** рубит свиток на равные отрывки; **Токенозавр** (лекция 2) напоминает, что куски — это суб-словные токены, а не символы.",
          "Та же фигура `rag-pipeline` возвращается — теперь со стадией **chunk→embed** в фокусе, входной стадией, которая решает всё ниже по течению. Ручки — **size** и **overlap**, и следующий подъём делает их эффект точным.",
        ],
        tt: [
          "Эзләү өзекне табганчы, аны **чанклау** кискән булырга тиеш. Корпус билгеле зурлыктагы кисәкләргә киселә, һәрберсе эмбеддлана һәм индекслана — һәм бары *бөтен чанкны* гына алып була. Димәк кисү нәрсә табыла алуын хәл итә: җавап ике чанк арасында киселсә, бер алу да аны бөтен кайтармый. **Чанк Норрис** төргәкне тигез өзекләргә чаба; **Токенозавр** (2 лекция) кисәкләр символлар түгел, ә суб-сүз токеннары икәнен искә төшерә.",
          "Шул ук `rag-pipeline` фигурасы кайта — хәзер **chunk→embed** баскычы фокуста, аскы агымдагы бар нәрсәне хәл итүче керү баскычы. Көйләгечләр — **size** һәм **overlap**, ә киләсе менү аларның тәэсирен төгәл итә."
        ],
      },
    },
