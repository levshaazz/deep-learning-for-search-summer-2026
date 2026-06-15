    {
      id: 'turn-inverted-index', kind: 'prose',
      heading: { en: 'Build the catalog', ru: 'Строим каталог', tt: 'Каталог төзибез' },
      img: 'L3/L3-11-inverted-index-cards.png', imgPos: 'scene',
      imgAlt: {
        en: 'A card catalogue where each card holds one term and points at the list of star-charts (documents) containing it.',
        ru: 'Картотека, где каждая карточка хранит один терм и указывает на список звёздных карт (документов), содержащих его.',
        tt: 'Картотека, анда һәр карточка бер терминны саклый һәм аны эченә алган йолдыз карталары (документлар) исемлегенә күрсәтә.',
      },
      imgCaption: {
        en: 'Stop asking each document “do you have this word?” Keep one card per word that already knows the answer.',
        ru: 'Хватит спрашивать каждый документ «есть у тебя это слово?» Заведи на каждое слово карточку, которая уже знает ответ.',
        tt: 'Һәр документтан «синдә бу сүз бармы?» дип сорауны туктат. Җавапны инде белгән карточканы һәр сүзгә бер итеп тот.',
      },
      body: {
        en: [
          "Here's the trick, and it's almost embarrassingly simple once you see it. Stop asking each document \"do you contain this word?\" — that's the question that forces you to visit every document. Flip it around. Keep a list, *for every word*, of which documents contain it. Ask the question once, store the answer, reuse it forever.",
          "That flipped table is the **inverted index**. \"Inverted\" because the natural direction is document → words (a document is just a list of the words inside it), and we've turned it inside out into word → documents. Picture a card catalogue: one card per word, and on each card a column of document IDs — a constellation card pointing straight at its stars. A query stops being a journey across the sky and becomes a single reach for the right card.",
        ],
        ru: [
          'Вот трюк — и он до неловкости прост, стоит только его увидеть. Перестань спрашивать каждый документ «содержишь ли ты это слово?» — это и есть вопрос, который заставляет обойти каждый документ. Переверни его. Храни список, *для каждого слова*, какие документы его содержат. Задай вопрос один раз, сохрани ответ, переиспользуй вечно.',
          'Эта перевёрнутая таблица и есть **инвертированный индекс**. «Инвертированный» — потому что естественное направление это документ → слова (документ — это просто список слов внутри него), а мы вывернули его наизнанку в слово → документы. Представь картотеку: по карточке на слово, а на каждой карточке — столбик ID документов, созвездная карточка, указывающая прямо на свои звёзды. Запрос перестаёт быть путешествием по небу и становится одним движением к нужной карточке.',
        ],
        tt: [
          'Менә хәйлә — һәм аны күргәч ул кыланмышка кадәр гади. Һәр документтан «син бу сүзне эченә аласыңмы?» дип сорауны туктат — нәкъ менә шул сорау һәр документны әйләнеп чыгарга мәҗбүр итә. Аны әйләндереп куй. *Һәр сүз өчен* нинди документлар аны эченә алганын исемлек итеп тот. Сорауны бер тапкыр бир, җавапны сакла, аны мәңге кабат куллан.',
          'Бу әйләндерелгән таблица — ул **инвертацияләнгән индекс**. «Инвертацияләнгән» — чөнки табигый юнәлеш ул документ → сүзләр (документ — ул бары аның эчендәге сүзләр исемлеге), ә без аны эчке яктан тышка борып сүз → документлар иттек. Картотеканы күз алдыңа китер: һәр сүзгә бер карточка, ә һәр карточкада — документ ID лары баганасы, туры үзенең йолдызларына күрсәткән йолдызлык карточкасы. Сорау күк буенча сәяхәт булудан туктый һәм кирәкле карточкага бер хәрәкәткә әйләнә.',
        ],
      },
    },
