    {
      id: 'depth-wordpiece', kind: 'prose',
      heading: { en: "Tokenosaurus returns: WordPiece", ru: "Токенозавр возвращается: WordPiece", tt: "Токенозавр кайта: WordPiece" },
      body: {
        en: [
          "Which threads does the loom accept at all? Not whole words. The jaws you met back in Lecture 2 are back — **Tokenosaurus**, now biting by BERT's own rulebook, the **WordPiece** vocabulary. Frequent words pass whole; a rare word gets bitten into pieces that *are* in the fixed vocabulary. A continuation piece wears the mark \\(\\#\\#\\): *playing* becomes *play \\(\\#\\#\\)ing* — the second bite openly admitting it is not the start of a word.",
          "The payoff is the end of the OOV (out-of-vocabulary) problem: there is no word the loom must refuse, because any word — a typo, a fresh coinage, a chemical name — can be assembled from pieces, down to single characters. And the special threads are citizens of the same vocabulary: \\([CLS]\\), \\([SEP]\\), \\([MASK]\\) are entries in the word-piece list like any other, each with its own embedding row.",
        ],
        ru: [
          "Какие нити станок вообще принимает? Не целые слова. Челюсти, знакомые тебе по второй лекции, вернулись — **Токенозавр**, теперь кусающий по собственному своду правил BERT, по словарю **WordPiece**. Частые слова проходят целиком; редкое слово прокусывается на куски, которые *есть* в фиксированном словаре. Кусок-продолжение носит метку \\(\\#\\#\\): *playing* превращается в *play \\(\\#\\#\\)ing* — второй укус честно признаётся, что он не начало слова.",
          "Выигрыш — конец проблемы OOV (out-of-vocabulary): нет слова, от которого станок обязан отказаться, потому что любое — опечатка, свежее словцо, химическое название — собирается из кусков, вплоть до отдельных символов. И особые нити — граждане того же словаря: \\([CLS]\\), \\([SEP]\\), \\([MASK]\\) — такие же статьи списка подслов, каждая со своей строкой эмбеддингов.",
        ],
        tt: [
          "Станок нинди җепләрне гомумән кабул итә? Бөтен сүзләрне түгел. Икенче лекциядән таныш казналар кайтты — **Токенозавр**, хәзер BERT'ның үз кагыйдәләре, **WordPiece** сүзлеге буенча тешли. Еш сүзләр бөтен килеш үтә; сирәк сүз фиксацияле сүзлектә *булган* кисәкләргә тешләнә. Дәвам кисәге \\(\\#\\#\\) билгесен йөртә: *playing* *play \\(\\#\\#\\)ing* була — икенче теш эзе үзенең сүз башы түгеллеген намуслы таный.",
          "Оту — OOV (out-of-vocabulary) проблемасының бетүе: станок баш тартырга тиеш сүз юк, чөнки теләсә кайсысы — хаталы язылган сүз, яңа сүз, химик атама — кисәкләрдән җыела, аерым символларга кадәр. Һәм аерым җепләр — шул ук сүзлекнең гражданнары: \\([CLS]\\), \\([SEP]\\), \\([MASK]\\) — башкалар кебек үк кисәк-сүзләр исемлегендәге язмалар, һәрберсенең үз эмбеддинг юлы бар.",
        ],
      },
    },
