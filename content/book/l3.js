// content/book/l3.js — "The Star Catalog" (L3): Classical IR + Full-text Ranking + Rank Fusion.
// Beats match narrative/L3.md. Widgets: inverted-index, bm25-calc, rrf-fusion (built by gen_l3.py
// on a real 20 Newsgroups sub-corpus). EN canonical + RU; TT falls back. NARRATIVE_METHOD applies.

export default {
  id: '03',
  catchphrase: 'The Star Catalog',
  beats: [
    {
      id: 'hook-catalog', kind: 'prose',
      heading: { en: 'The Star Catalog', ru: 'Звёздный каталог' },
      body: {
        en: [
          "I'm Serega, and I'm staring at a sky of a billion documents. One of them answers the question on the screen. Just one. The other 999,999,999 are noise, and from where I'm floating they all look exactly the same — tiny points of light, indistinguishable, infinite.",
          "I can't fly past each star and check. Do the arithmetic and it's almost funny: even at a microsecond per document, a billion of them is seventeen minutes of pure looking, per query — and a user gives me about one second before they leave. So I won't search the sky at all. I'll do what every astronomer figured out centuries ago, and what every search engine quietly reinvented: don't search the sky. Search a *catalog* of it.",
          "That's the whole job today. Build the catalog, then learn to rank what it returns — because finding the right stars and putting the *best* one first are two different problems, and the second one is sneakier than it looks.",
        ],
        ru: [
          'Я Серёга, и я смотрю на небо из миллиарда документов. Один из них отвечает на вопрос на экране. Ровно один. Остальные 999 999 999 — шум, и отсюда, где я вишу, все они выглядят одинаково — крошечные точки света, неразличимые, бесконечные.',
          'Я не могу облететь каждую звезду и проверить. Прикинь арифметику — даже смешно: пусть микросекунда на документ, но миллиард документов — это семнадцать минут чистого разглядывания на один запрос, а пользователь даёт мне около секунды, прежде чем уйти. Поэтому я вообще не буду искать по небу. Я сделаю то, что астрономы поняли века назад, а каждый поисковик тихо переоткрыл: не ищи по небу — ищи по его *каталогу*.',
          'В этом и вся задача на сегодня. Построить каталог, а потом научиться ранжировать то, что он вернёт, — потому что найти нужные звёзды и поставить *лучшую* первой — это две разные задачи, и вторая коварнее, чем кажется.',
        ],
      },
    },
    {
      id: 'problem-linear-scan', kind: 'prose',
      body: {
        en: [
          "Let's name the naive plan first, so we can watch it die. Read every document at query time and check whether it matches. That's called a **linear scan**, and it is a complete non-starter. Ten milliseconds to open and read a single document, times a billion documents, is months of wall-clock time for *one* search. Multiply by the thousands of queries arriving every second and you haven't built a search engine, you've built a space heater.",
          "And don't fix it by buying more machines. You can shard the scan across a thousand servers and you've still turned months into hours — for a budget that's supposed to be one second. The problem isn't horsepower. The problem is that you're reading the whole library to answer every question, and the library keeps growing.",
          "We need the answer before we've touched even a thousandth of the sky. That means doing the expensive work *once*, ahead of time, and turning each query into a cheap lookup against what we precomputed. Hold that thought — precompute once, look up forever — because it's the spine of everything that follows.",
        ],
        ru: [
          'Сначала назовём наивный план, чтобы посмотреть, как он умрёт. Прочитать каждый документ в момент запроса и проверить совпадение. Это называется **линейное сканирование**, и это полный тупик. Десять миллисекунд, чтобы открыть и прочитать один документ, умножить на миллиард документов — это месяцы реального времени на *один* поиск. Умножь на тысячи запросов, приходящих каждую секунду, — и ты построил не поисковик, а обогреватель.',
          'И не чини это покупкой машин. Размажь скан по тысяче серверов — и месяцы превратятся в часы, при бюджете, который должен быть в одну секунду. Дело не в мощности. Дело в том, что ты перечитываешь всю библиотеку, чтобы ответить на каждый вопрос, а библиотека всё растёт.',
          'Нам нужен ответ ещё до того, как мы тронули хотя бы тысячную долю неба. А значит — сделать дорогую работу *один раз*, заранее, и превратить каждый запрос в дешёвый поиск по тому, что мы предвычислили. Запомни эту мысль — предвычислить однажды, искать вечно, — потому что это хребет всего дальнейшего.',
        ],
      },
    },
    {
      id: 'turn-inverted-index', kind: 'prose',
      heading: { en: 'Build the catalog', ru: 'Строим каталог' },
      body: {
        en: [
          "Here's the trick, and it's almost embarrassingly simple once you see it. Stop asking each document \"do you contain this word?\" — that's the question that forces you to visit every document. Flip it around. Keep a list, *for every word*, of which documents contain it. Ask the question once, store the answer, reuse it forever.",
          "That flipped table is the **inverted index**. \"Inverted\" because the natural direction is document → words (a document is just a list of the words inside it), and we've turned it inside out into word → documents. Picture a card catalogue: one card per word, and on each card a column of document IDs — a constellation card pointing straight at its stars. A query stops being a journey across the sky and becomes a single reach for the right card.",
        ],
        ru: [
          'Вот трюк — и он почти неловко прост, как только ты его увидишь. Перестань спрашивать каждый документ «содержишь ли ты это слово?» — это и есть вопрос, который заставляет обойти каждый документ. Переверни его. Храни список, *для каждого слова*, какие документы его содержат. Задай вопрос один раз, сохрани ответ, переиспользуй вечно.',
          'Эта перевёрнутая таблица и есть **инвертированный индекс**. «Инвертированный» — потому что естественное направление это документ → слова (документ — это просто список слов внутри него), а мы вывернули его наизнанку в слово → документы. Представь картотеку: по карточке на слово, а на каждой карточке — столбик ID документов, созвездная карточка, указывающая прямо на свои звёзды. Запрос перестаёт быть путешествием по небу и становится одним движением к нужной карточке.',
        ],
      },
    },
    { id: 'climb-index', kind: 'scrolly', widget: 'inverted-index', data: 'l3-index' },
    {
      id: 'turn-index-internals', kind: 'prose',
      heading: { en: "What's inside a catalog card", ru: 'Что внутри каталожной карточки' },
      body: {
        en: [
          "A card with a list of document IDs is the cartoon version. The real thing has more on it, and the extras are what make search *fast* rather than merely possible. Each entry in a word's list — a **posting** — usually carries not just the document ID but the count of how many times the word appears there, and often the exact positions, so we can later tell that \"new york\" the city is different from a document that happens to mention \"new\" and \"york\" a paragraph apart.",
          "Then there's how the catalog gets *built* in the first place. You can't sort a trillion postings in memory, so indexers stream the corpus in blocks, sort each block to disk, and merge the sorted runs together — the same merge-sort idea your data-structures course beat into you, just at planetary scale. That's why production engines like Lucene store the index as immutable *segments* that get merged in the background: building and serving never stop fighting for the same machine.",
          "And the lists get *compressed*, hard. The document IDs on a card are sorted, so instead of storing 1{,}000{,}004 then 1{,}000{,}009 you store the first ID and then the **gaps** — 5, then 4 — tiny numbers that pack into a byte or two. A popular word's posting list can shrink several-fold this way, which means more of it fits in cache, which means the lookup the user is waiting on touches memory instead of disk. None of this is glamorous. All of it is the difference between a demo and an engine.",
          "Last piece: matching documents to a multi-word query is a **merge** of sorted lists, and you can make it skip. To find documents containing *both* \"space\" and \"team\", walk the two sorted lists together like a zipper; with skip pointers you can leap over chunks of one list that can't possibly match. Start from the rarest word — its list is shortest, so it does the least work. That instinct, *rarest first*, is going to come back the moment we start ranking.",
        ],
        ru: [
          'Карточка со списком ID документов — это мультяшная версия. У настоящей внутри больше, и именно добавки делают поиск *быстрым*, а не просто возможным. Каждая запись в списке слова — **постинг** — обычно несёт не только ID документа, но и счётчик, сколько раз слово там встречается, а часто и точные позиции, чтобы потом отличить «нью-йорк» как город от документа, где «нью» и «йорк» просто стоят через абзац.',
          'Дальше — как каталог вообще *строится*. Триллион постингов в памяти не отсортируешь, поэтому индексаторы гонят корпус блоками, сортируют каждый блок на диск и сливают отсортированные пробеги вместе — та самая идея слияния-сортировки, которую вбивали в тебя на структурах данных, только в планетарном масштабе. Поэтому продакшн-движки вроде Lucene хранят индекс как неизменяемые *сегменты*, которые сливаются в фоне: построение и обслуживание всё время дерутся за одну машину.',
          'И списки *сжимаются*, жёстко. ID документов на карточке отсортированы, поэтому вместо 1 000 004, а потом 1 000 009 ты хранишь первый ID, а дальше — **разности**: 5, потом 4 — крошечные числа, которые влезают в байт-другой. Список постингов популярного слова так усыхает в несколько раз, а значит, больше его помещается в кэш, а значит, поиск, которого ждёт пользователь, трогает память, а не диск. Ничего гламурного. И при этом — вся разница между демо и движком.',
          'Последнее: сопоставить документы многословному запросу — это **слияние** отсортированных списков, и его можно ускорить пропусками. Чтобы найти документы сразу со «space» и «team», иди по двум отсортированным спискам вместе, как застёжка-молния; со skip-указателями ты перепрыгиваешь куски одного списка, которые заведомо не совпадут. Начинай с самого редкого слова — его список короче, значит, и работы меньше. Этот инстинкт, *сначала редкое*, вернётся в тот же миг, как мы начнём ранжировать.',
        ],
      },
    },
    {
      id: 'turn-scoring', kind: 'prose',
      heading: { en: 'Matching isn’t ranking', ru: 'Совпадение — это не ранжирование' },
      body: {
        en: [
          "Now watch a quieter failure. Ask the catalog for documents that contain *both* of two query words and sometimes you get back… nothing. A strict boolean AND is brittle: one missing word and a genuinely great document is exiled. Loosen it to OR and you get the opposite disaster — hundreds of documents, all technically matching, none of them ordered. The index tells you *which* documents qualify. It says nothing about which are *best*.",
          "Matching is binary; relevance is a spectrum. A document that uses your rare keyword five times in two sentences is almost certainly more on-topic than one that mentions it once in a footnote — and a word that appears in *every* document tells you nothing at all about which to prefer. So the classic recipe has two instincts baked in: reward rare words more than common ones, and don't let a single word repeated a hundred times drown out everything else. Hold those two instincts. We're about to make them arithmetic.",
        ],
        ru: [
          'Теперь смотри на провал потише. Спроси каталог о документах, содержащих сразу *оба* слова запроса, — и иногда получишь… ничего. Строгое булево AND хрупко: одно недостающее слово, и по-настоящему отличный документ отправлен в изгнание. Ослабь до OR — и получишь обратную катастрофу: сотни документов, все формально совпадают, ни один не упорядочен. Индекс говорит, *какие* документы подходят. Он молчит о том, какие *лучшие*.',
          'Совпадение бинарно; релевантность — спектр. Документ, где твоё редкое слово стоит пять раз в двух предложениях, почти наверняка ближе к теме, чем тот, где оно мелькнуло раз в сноске, — а слово, которое есть в *каждом* документе, вообще ничего не говорит о выборе. Поэтому в классическом рецепте зашиты два инстинкта: награждать редкие слова сильнее частых и не давать одному слову, повторённому сто раз, заглушить всё остальное. Запомни эти два инстинкта. Сейчас мы сделаем их арифметикой.',
        ],
      },
    },
    {
      id: 'turn-bow', kind: 'prose',
      heading: { en: 'Bag-of-Words', ru: 'Мешок слов' },
      body: {
        en: [
          "Before we can weigh words, we need to agree on what a document *is* to the math. Here's the move that quietly underlies all of classical IR, and it has a name worth saying out loud: **Bag-of-Words**. Take a document, dump every word into a bag, shake it, throw away the order. All you keep is *which* words appeared and *how many times*. \"Dog bites man\" and \"man bites dog\" become the same bag — which is obviously, comically wrong, and somehow works anyway for an astonishing range of tasks.",
          "Why it works: lay every document's bag out as a row of counts over a fixed vocabulary and you've built a **document-term matrix** — every document is now a vector, a point in a space with one axis per word. Geometry arrives for free. Documents that share many words sit near each other; a query is just another short vector you can compare against all of them. This is the **vector space model**, and it's the bridge from \"a pile of text\" to \"something a computer can rank.\"",
          "And it's immediately, concretely useful. A spam filter is mostly Bag-of-Words: it doesn't parse your email's grammar, it counts words — \"free\", \"winner\", \"viagra\" push the score toward spam; the words in your actual correspondence pull it back — and a naïve probability model on those counts catches the junk with embarrassing reliability. The catch is the one we just admitted: throwing away order means \"the movie was good, not bad\" and \"the movie was bad, not good\" look nearly identical to the bag. Order carries meaning, and we just shredded it. We'll spend a whole later chapter buying it back. For now, the bag is enough — because the real signal isn't *whether* a word appears, it's *how much it should count*.",
        ],
        ru: [
          'Прежде чем взвешивать слова, нужно договориться, чем документ *является* для математики. Вот ход, который тихо лежит в основе всего классического IR, и у него есть имя, которое стоит произнести вслух: **мешок слов** (Bag-of-Words). Берём документ, ссыпаем все слова в мешок, трясём, выбрасываем порядок. Остаётся только то, *какие* слова встретились и *сколько раз*. «Собака кусает человека» и «человек кусает собаку» становятся одним мешком — что очевидно и комично неверно, и почему-то всё равно работает для поразительного спектра задач.',
          'Почему работает: разложи мешок каждого документа строкой счётчиков по фиксированному словарю — и ты построил **матрицу документ–термин**: каждый документ теперь вектор, точка в пространстве с осью на каждое слово. Геометрия приходит бесплатно. Документы, делящие много слов, стоят рядом; запрос — это просто ещё один короткий вектор, который можно сравнить со всеми. Это **векторная модель**, мост от «кучи текста» к «тому, что компьютер умеет ранжировать».',
          'И польза мгновенная, конкретная. Спам-фильтр — это в основном мешок слов: он не разбирает грамматику письма, он считает слова — «бесплатно», «победитель», «viagra» толкают оценку к спаму; слова твоей реальной переписки тянут назад — и наивная вероятностная модель на этих счётчиках ловит мусор с неприличной надёжностью. Подвох тот, что мы только что признали: выбросив порядок, «фильм хороший, а не плохой» и «фильм плохой, а не хороший» для мешка почти неотличимы. Порядок несёт смысл, а мы его только что измельчили. Целую будущую главу мы потратим, чтобы выкупить его обратно. Пока мешка хватит — потому что настоящий сигнал не в том, *встречается* ли слово, а в том, *насколько оно должно считаться*.',
        ],
      },
    },
    {
      id: 'climb-tfidf', kind: 'prose',
      heading: { en: 'TF-IDF: rare words carry the signal', ru: 'TF-IDF: сигнал несут редкие слова' },
      body: {
        en: [
          "So we weight the counts in the bag with two ideas that fight in opposite directions. The first is **term frequency** (tf): a word that appears more often in a document is, all else equal, more *about* that document. The second is **inverse document frequency** (idf), and it's the clever one. A word that shows up in *every* document — \"the\", or \"space\" inside a corpus that's all about space — is useless for telling documents apart, no matter how often it appears. A word that shows up in only a handful of documents is gold: when it matches, it really means something.",
          "Multiply them — tf · idf — and you get a weight that rewards documents rich in the query's *rare* words while shrugging off the common ones. Run it on a tiny car-versus-truck corpus and the effect is stark: words like \"the\" and \"a\" appear everywhere, their idf collapses to zero, and they contribute *nothing* to the score even though they're all over the text. Only the distinguishing words — \"car\", \"truck\", \"engine\" — move the needle. The math is doing exactly what your intuition wanted: it's learning which words are worth listening to, from the corpus alone, with nobody labelling anything.",
          "TF-IDF is a genuinely great first instrument, and for years it *was* search. But it has two flaws you can feel if you push on it. First, tf is **linear**: a word that appears ten times scores ten times as high as a word that appears once — but the tenth mention almost never adds ten times the evidence. Second, it has a weak sense of **length**: a long document accumulates raw counts just by being long, so it can outscore a short, perfectly-on-point one for no good reason. Two flaws, both fixable. Fixing them is the most interesting story in this whole chapter.",
        ],
        ru: [
          'Итак, мы взвешиваем счётчики в мешке двумя идеями, тянущими в разные стороны. Первая — **частота термина** (tf): слово, что встречается в документе чаще, при прочих равных сильнее *о* нём говорит. Вторая — **обратная частота документа** (idf), и она хитрая. Слово, которое есть в *каждом* документе — «the» или «space» в корпусе, целиком про космос, — бесполезно для различения документов, как часто бы оно ни встречалось. Слово, которое есть лишь в горстке документов, — золото: когда оно совпадает, это действительно что-то значит.',
          'Перемножь их — tf · idf — и получишь вес, награждающий документы, богатые *редкими* словами запроса, и отмахивающийся от частых. Прогони на крошечном корпусе «машина против грузовика» — эффект резкий: слова вроде «the» и «a» встречаются всюду, их idf падает в ноль, и они дают *ноль* вклада в оценку, хотя ими испещрён весь текст. Только различающие слова — «машина», «грузовик», «двигатель» — двигают стрелку. Математика делает ровно то, чего хотела интуиция: она учится, какие слова стоит слушать, из одного корпуса, без единой разметки.',
          'TF-IDF — по-настоящему отличный первый инструмент, и годами он *и был* поиском. Но у него два изъяна, которые ощущаешь, если нажать. Первый: tf **линеен**: слово, встретившееся десять раз, набирает в десять раз больше, чем встретившееся раз, — но десятое упоминание почти никогда не добавляет десятикратной улики. Второй: у него слабое чувство **длины**: длинный документ копит сырые счётчики просто потому, что он длинный, и может обойти короткий, идеально по теме, без всякой причины. Два изъяна, оба чинятся. Их починка — самая интересная история во всей этой главе.',
        ],
      },
    },
    { id: 'climb-bm25', kind: 'scrolly', widget: 'bm25-calc', data: 'l3-bm25' },
    {
      id: 'climb-bm25-history', kind: 'prose',
      heading: { en: 'The BM25 saga', ru: 'Сага о BM25' },
      body: {
        en: [
          "That formula you just watched — BM25 — didn't spring out of anyone's head. It's a sextant, tuned over thirty years, each notch filed off only after the previous instrument failed at sea. The \"BM\" stands for *Best Match*, and the number 25 is not a version label some marketer chose; it is literally the twenty-fifth variant the team worked through. The story of how they got there is the best engineering parable I know, so let me actually tell it.",
          "It starts in the 1970s with a question that sounds academic and turns out to be the whole game: given a query, which documents are most *probably* relevant? Stephen Robertson and Karen Spärck Jones formalised it as the **Probabilistic Ranking Principle** — rank documents by their odds of being relevant — and from it fell out the **RSJ weight**, essentially the idf we just used, born from probability rather than guessed. That first ranker, **BM1**, only asked *is the word present or not*. It completely ignored how many times the word appeared. You already know why that's not enough.",
          "So they added term frequency — and immediately hit the linearity flaw, the same one we just found in TF-IDF. Their fix came from a piece of theory called the **2-Poisson model**: imagine a word is \"elite\" to a document when the document is genuinely about that word's topic, and model the counts as a mixture of two Poisson distributions, elite and not. Work through the math and the optimal weight isn't linear in tf at all — it's a *saturating* curve that rises fast for the first few occurrences and then flattens. That is the deep \"why\" behind the shape: the second mention of a word is strong evidence, the fiftieth barely moves you. They didn't bolt saturation on for taste; the probability told them to.",
          "Then length. A long document racks up term counts just by going on, so they normalised by document length — and now they had a fork. Normalise fully and you get **BM11**; don't normalise at all and you get **BM15**; and out in the field, neither extreme won everywhere. BM15 over-rewarded long documents, BM11 over-punished them. They even tried a separate length-correction term and a query-frequency factor, measured the lot on real collections, and — this is the engineer's move — *threw the correction away* when the data said it earned nothing. Tried it, measured it, deleted it. That's the whole discipline in one gesture.",
          "The twenty-fifth variant was the one that stopped the search. Instead of choosing between BM11 and BM15, **put a dial between them** — a single knob *b* that slides from \"ignore length\" to \"fully normalise\" — and let whoever runs the engine tune it to their corpus. Set b ≈ 0.75, let k₁ ≈ 1.5 control how fast tf saturates, and you have BM25: the RSJ idf, a saturating tf, and a tunable length penalty, all in one line. This all came together at City University London on a system called **Okapi**, which is why you'll still hear it called Okapi BM25; it then went and *won* the early **TREC** competitions in the early 1990s, the bake-off that turned IR from opinion into measurement.",
          "Here's the part that should keep you humble. That worked example you just stepped through ranks D2 above D1 above D3 — a short, on-point document beating a longer one that merely mentions the words — and it does it with arithmetic from the 1990s. On the modern **BEIR** benchmark, averaged across eighteen datasets, BM25 still scores around 0.43 nDCG@10 *zero-shot* — and plenty of expensive neural models, trained on GPUs that didn't exist when BM25 was finalised, fail to beat it. Thirty years of careful filing produced a baseline so good it's a little embarrassing. Respect the sextant.",
        ],
        ru: [
          'Та формула, которую ты только что разглядывал, — BM25 — не выпрыгнула из чьей-то головы. Это секстант, который настраивали тридцать лет, и каждую засечку стачивали, только когда прежний прибор подводил в открытом море. «BM» — это *Best Match*, «лучшее совпадение», а число 25 — не версия, выбранная маркетологом; это буквально двадцать пятый вариант, который проработала команда. История того, как они до него дошли, — лучшая инженерная притча, что я знаю, так что дай я её и вправду расскажу.',
          'Всё начинается в 1970-х с вопроса, который звучит академично, а оказывается всей игрой: дан запрос — какие документы *вероятнее всего* релевантны? Стивен Робертсон и Карен Спарк Джонс формализовали это как **принцип вероятностного ранжирования** — ранжируй документы по шансам быть релевантными — и из него выпал **вес RSJ**, по сути та самая idf, что мы только что брали, но рождённая из вероятности, а не угаданная. Тот первый ранкер, **BM1**, спрашивал лишь *есть слово или нет*. Он полностью игнорировал, сколько раз слово встретилось. Ты уже знаешь, почему этого мало.',
          'Тогда добавили частоту термина — и сразу упёрлись в изъян линейности, тот самый, что мы нашли в TF-IDF. Починка пришла из теории под названием **модель 2-Пуассона**: представь, что слово «элитно» документу, когда документ по-настоящему о теме этого слова, и смоделируй счётчики как смесь двух пуассоновских распределений, элитного и нет. Прокрути математику — и оптимальный вес вовсе не линеен по tf, это *насыщающаяся* кривая, что круто растёт на первых вхождениях и потом выполаживается. Вот глубокое «почему» этой формы: второе упоминание слова — сильная улика, пятидесятое едва двигает. Они не прикрутили насыщение для вкуса; так велела вероятность.',
          'Затем длина. Длинный документ копит счётчики просто потому, что тянется, поэтому его нормировали на длину — и тут возникла развилка. Нормируй полностью — получишь **BM11**; не нормируй вовсе — получишь **BM15**; и в поле ни одна крайность не побеждала везде. BM15 переоценивал длинные документы, BM11 их перенаказывал. Они даже пробовали отдельный поправочный член на длину и фактор частоты в запросе, измерили всё это на реальных коллекциях и — вот ход инженера — *выбросили поправку*, когда данные сказали, что она ничего не даёт. Попробовали, измерили, удалили. Вся дисциплина в одном жесте.',
          'Двадцать пятый вариант и оказался тем, на котором поиск остановился. Вместо выбора между BM11 и BM15 — **поставь между ними диск**: одну ручку *b*, что скользит от «игнорируй длину» до «нормируй полностью», — и дай тому, кто крутит движок, настроить её под свой корпус. Поставь b ≈ 0,75, пусть k₁ ≈ 1,5 управляет скоростью насыщения tf — и вот BM25: idf от RSJ, насыщающийся tf и настраиваемый штраф за длину, всё в одной строке. Всё это сложилось в Городском университете Лондона на системе **Okapi**, поэтому до сих пор слышишь «Okapi BM25»; затем оно пошло и *выиграло* ранние соревнования **TREC** в начале 1990-х — тот самый смотр, что превратил IR из мнения в измерение.',
          'А вот часть, что должна держать тебя в смирении. Тот разобранный пример, по которому ты шагал, ставит D2 выше D1 и выше D3 — короткий документ по теме обходит длинный, что просто упоминает слова, — и делает это арифметикой из 1990-х. На современном бенчмарке **BEIR**, усреднённый по восемнадцати наборам, BM25 всё ещё даёт около 0,43 nDCG@10 *zero-shot* — и куча дорогих нейронных моделей, обученных на GPU, которых не было, когда BM25 доделывали, не может его обойти. Тридцать лет аккуратной заточки дали базовую планку, настолько хорошую, что слегка неловко. Уважай секстант.',
        ],
      },
    },
    {
      id: 'turn-fusion', kind: 'prose',
      heading: { en: 'One ranker is never enough', ru: 'Одного ранкера всегда мало' },
      body: {
        en: [
          "BM25 is a workhorse, but it's still one opinion. It scores documents by exact-word overlap, weighted cleverly — that's its lens, and like any lens it has blind spots. A second ranker sees the same documents through a different lens. Take cosine similarity over the TF-IDF vectors we built a moment ago: it cares about the *angle* between a document and the query, the overall shape of their word usage, not the same things BM25 leans on. Two competent rankers, looking at the same shelf, will hand you two different top-tens.",
          "When two good rankers disagree, the rookie move is to crown a favourite and ignore the other. The smart move is to *fuse* their votes — to trust a document that *both* rankers liked more than one that only impressed a single judge. But there's an obstacle, and it's the same one that bit us with the inverted index's score scales: BM25 might hand out numbers like 12.4 while cosine lives between 0 and 1. You cannot just add them; the bigger scale would silently win every time. We need a way to combine rankings that doesn't care how loud each ranker shouts.",
        ],
        ru: [
          'BM25 — рабочая лошадка, но это всё ещё одно мнение. Он оценивает документы по точному пересечению слов, хитро взвешенному, — это его линза, и, как у любой линзы, у неё есть слепые зоны. Второй ранкер смотрит на те же документы через другую линзу. Возьми косинусную близость по TF-IDF векторам, что мы построили минуту назад: его волнует *угол* между документом и запросом, общая форма их словоупотребления, а не то, на что опирается BM25. Два толковых ранкера, глядя на одну полку, выдадут тебе две разные десятки.',
          'Когда два хороших ранкера расходятся, новичок коронует любимчика и игнорирует второго. Умный ход — *слить* их голоса: довериться документу, который понравился *обоим* ранкерам, сильнее, чем тому, что впечатлил лишь одного судью. Но есть препятствие, и оно то же, что укусило нас со шкалами индекса: BM25 может выдавать числа вроде 12,4, а косинус живёт между 0 и 1. Просто сложить нельзя; большая шкала молча победит каждый раз. Нужен способ объединять ранжирования, которому всё равно, как громко кричит каждый ранкер.',
        ],
      },
    },
    {
      id: 'turn-fusion-family', kind: 'prose',
      heading: { en: 'A council of navigators', ru: 'Совет навигаторов' },
      body: {
        en: [
          "There's a whole family of ways to merge ranked lists, and walking the family tree tells you why the winner won. The first instinct is to *fix the scales*: normalise every ranker's scores to a common range — min-max them into [0,1], or z-score them — and then add. That's **CombSUM**; its cousin **CombMNZ** multiplies in a bonus for documents that more than one ranker surfaced at all. It works, but it's fragile: a single ranker with a weird score distribution, one outlier blowing out the min-max range, and your careful normalisation curdles.",
          "So a second school says: throw the scores away entirely and keep only the *ranks*. **Borda count**, borrowed from voting theory, gives a document m points for first place, m−1 for second, and so on down each list, then sums — exactly how some elections tally preferences. More elaborate schemes like **CPMF** model each rank as carrying a probability mass and combine those. The appeal is obvious: a rank is a rank, immune to whatever bizarre scale a ranker reports. The drawback of plain Borda is that it treats the gap between rank 1 and rank 2 the same as the gap between rank 50 and rank 51 — which is wrong, because nobody scrolls to 51.",
          "Which sets up the punchline, and the figure after this beat is it. The trick that quietly won the industry keeps the rank-only robustness but discounts gently as you go down the list, so being near the top counts for a lot and being deep counts for almost nothing. It needs no score normalisation, no per-corpus tuning, and it folds any number of rankers together with a single tiny constant. Watch the council of navigators take their two disagreeing charts and agree on a course.",
        ],
        ru: [
          'Есть целое семейство способов слить ранжированные списки, и прогулка по родословной показывает, почему победитель победил. Первый инстинкт — *починить шкалы*: нормировать оценки каждого ранкера в общий диапазон — min-max в [0,1] или z-оценка — и сложить. Это **CombSUM**; его родич **CombMNZ** домножает бонус документам, которые всплыли больше чем у одного ранкера. Работает, но хрупко: один ранкер со странным распределением оценок, один выброс, разносящий min-max диапазон, — и аккуратная нормировка сворачивается.',
          'Поэтому вторая школа говорит: выброси оценки совсем и оставь только *ранги*. **Подсчёт Борда**, заимствованный из теории голосования, даёт документу m очков за первое место, m−1 за второе и так вниз по каждому списку, потом суммирует — ровно так некоторые выборы считают предпочтения. Более затейливые схемы вроде **CPMF** моделируют каждый ранг как несущий вероятностную массу и комбинируют их. Притяжение очевидно: ранг есть ранг, ему плевать на любую дикую шкалу ранкера. Минус простого Борда в том, что он считает разрыв между рангом 1 и 2 таким же, как между 50 и 51, — что неверно, ведь до 51-го никто не доскролливает.',
          'Что и подводит к развязке, а фигура после этого бита — она и есть. Трюк, тихо выигравший индустрию, сохраняет устойчивость «только по рангам», но мягко дисконтирует по мере спуска, так что быть у верха стоит много, а быть глубоко — почти ничего. Ему не нужна ни нормировка оценок, ни покорпусная настройка, и он складывает любое число ранкеров одной крошечной константой. Смотри, как совет навигаторов берёт две несогласные карты и сходится на курсе.',
        ],
      },
    },
    { id: 'climb-rrf', kind: 'scrolly', widget: 'rrf-fusion', data: 'l3-rrf' },
    {
      id: 'turn-pagerank', kind: 'prose',
      heading: { en: 'Let the links vote', ru: 'Пусть голосуют ссылки' },
      body: {
        en: [
          "Everything so far scores a document by what's *inside* it. But on the web there's a second signal sitting in plain sight, and it's not in any document's text — it's in the *links between them*. Treat every link as a vote: a page that many others point to is probably worth something. That's the seed of **PageRank**, the idea that put a particular search engine on the map in the late 1990s. The twist that made it work is recursive — a vote from an important page should count for more than a vote from a nobody. Importance is defined in terms of itself.",
          "That sounds circular, and it is, in the productive way. Picture a bored web surfer clicking links at random forever; the fraction of time they spend on each page, in the long run, *is* that page's PageRank. You compute it by **power iteration**: start with everyone equal, let each page hand its score out evenly along its outgoing links, repeat, and the numbers settle. Run it on a tiny three-page web — A points to B, B to C, C to both A and B — and B, the page with the most incoming links, ends up holding the largest share, a little under forty percent, while A and C split the rest. One catch worth a footnote: a page with no outgoing links would be a black hole that hoards everyone's score, so the surfer is allowed to randomly teleport (with probability about 0.15) to keep the whole thing from collapsing.",
          "The point for us isn't the algorithm; it's the category. PageRank is a **query-independent** signal — it's about the document, computed once, before anyone searches anything. BM25 is query-*dependent*; it only means something relative to your words. A real engine wants both, plus a dozen more signals, and that raises an obvious question: how do you combine a lexical score, an angle, and an authority number that live on completely different scales? We just built the answer to that. Let's use it.",
        ],
        ru: [
          'Всё до сих пор оценивало документ по тому, что *внутри* него. Но в вебе есть второй сигнал, лежащий на виду, и он не в тексте ни одного документа — он в *ссылках между ними*. Считай каждую ссылку голосом: страница, на которую указывают многие, вероятно, чего-то стоит. Это зерно **PageRank**, идеи, что вывела один конкретный поисковик в люди в конце 1990-х. Поворот, который заставил её работать, рекурсивен: голос важной страницы должен весить больше, чем голос пустого места. Важность определяется через саму себя.',
          'Звучит как круг — и это круг, в продуктивном смысле. Представь скучающего сёрфера, вечно кликающего по случайным ссылкам; доля времени, что он проводит на каждой странице, в пределе *и есть* её PageRank. Считают его **степенным методом**: начни со всех равными, пусть каждая страница раздаёт свою оценку поровну по исходящим ссылкам, повтори — и числа устаканятся. Прогони на крошечном вебе из трёх страниц — A указывает на B, B на C, C сразу на A и B — и B, страница с самым большим числом входящих ссылок, в итоге держит наибольшую долю, чуть меньше сорока процентов, а A и C делят остаток. Один подвох на сноску: страница без исходящих ссылок была бы чёрной дырой, копящей чужие оценки, поэтому сёрферу разрешено случайно телепортироваться (с вероятностью около 0,15), чтобы вся конструкция не схлопнулась.',
          'Суть для нас не в алгоритме, а в категории. PageRank — это **независимый от запроса** сигнал: он о документе, вычислен один раз, до того как кто-то что-то искал. BM25 *зависит* от запроса; он что-то значит лишь относительно твоих слов. Настоящему движку нужны оба, плюс десяток других сигналов, и тут встаёт очевидный вопрос: как объединить лексическую оценку, угол и число авторитетности, живущие на совершенно разных шкалах? Мы только что построили ответ на это. Давай им и воспользуемся.',
        ],
      },
    },
    {
      id: 'catch-gremlin', kind: 'prose',
      heading: { en: 'The Lexical Gremlin laughs', ru: 'Лексический Гремлин смеётся' },
      body: {
        en: [
          "There's a catch, and he's grinning at me from behind the catalog. BM25, RRF, PageRank, the whole classical apparatus — every last piece of it matches on *exact words*. The index is a card per literal token; the scores reward literal overlap. So search \"couch\" and a perfect document that happens to say \"sofa\" scores exactly zero. Not low. Zero. As far as the catalog is concerned, those two words are as unrelated as \"couch\" and \"crocodile.\"",
          "This is the **Lexical Gremlin**, back from chapter one, and he is *thrilled* with everything we just built — because no amount of clever weighting climbs over his wall. You can patch a few cases: stemming so \"running\" and \"runs\" collapse together, query expansion to bolt synonyms on by hand. But those are buckets bailing a boat. The Gremlin wedges a brick wall between every pair of words that mean the same thing and were spelled differently, and our entire toolkit is built on spelling. To beat him for real we'll have to stop matching words and start matching *meaning* — give every word a position in a space where \"couch\" and \"sofa\" sit as neighbours. That's a later chapter, and it's the one he's afraid of.",
        ],
        ru: [
          'Есть подвох, и он ухмыляется мне из-за каталога. BM25, RRF, PageRank, весь классический аппарат — каждая его деталь совпадает по *точным словам*. Индекс — это карточка на буквальный токен; оценки награждают буквальное пересечение. Поэтому ищешь «диван», а идеальный документ, где написано «кушетка», получает ровно ноль. Не мало. Ноль. С точки зрения каталога эти два слова так же не связаны, как «диван» и «крокодил».',
          'Это **Лексический Гремлин**, вернувшийся из первой главы, и он *в восторге* от всего, что мы только что построили, — потому что никакое хитрое взвешивание не перелезет его стену. Можно залатать пару случаев: стемминг, чтобы «бегущий» и «бежит» схлопнулись, расширение запроса, чтобы вручную прицепить синонимы. Но это вёдра, вычерпывающие лодку. Гремлин вставляет кирпичную стену между каждой парой слов, что значат одно, но написаны иначе, а весь наш инструментарий построен на написании. Чтобы победить его по-настоящему, придётся перестать совпадать по словам и начать совпадать по *смыслу* — дать каждому слову позицию в пространстве, где «диван» и «кушетка» стоят соседями. Это следующая глава, и именно её он боится.',
        ],
      },
    },
    {
      id: 'payoff-catalog', kind: 'prose',
      heading: { en: 'The catalog is built', ru: 'Каталог построен' },
      body: {
        en: [
          "So here's the Ship we built, and it finds *fast*. An inverted index — gaps-compressed, skip-merged, segment-merged — for instant lookup instead of a doomed scan. Bag-of-Words to turn documents into vectors. TF-IDF to weight the words, then thirty years of BM25 to weight them *right*. PageRank for authority that needs no query. And reciprocal rank fusion, the council of navigators, to combine all those disagreeing voices into one honest order. It is the baseline every fancy neural method in this course will have to beat — and you'd be genuinely surprised how often it just wins.",
          "Two questions trail us out of here, and each owns a chapter. First, the uncomfortable one: I keep saying \"better\" and \"wins\" — but how would we even *know*? Eyeballing ten results is not a measurement, and BM25's ranking might be quietly worse than I think. That's the next chapter, The Proving Grounds, where we put an honest number on a ranking. Second, the Gremlin is still out there behind his wall, and caging him for good is the chapter after — when words finally get coordinates. The catalog is built. Now we learn whether it's any good, and then we learn to read between the words.",
        ],
        ru: [
          'Итак, вот Корабль, что мы построили, и он ищет *быстро*. Инвертированный индекс — сжатый разностями, со skip-слиянием, со слиянием сегментов — для мгновенного поиска вместо обречённого скана. Мешок слов, чтобы превратить документы в векторы. TF-IDF, чтобы взвесить слова, а потом тридцать лет BM25, чтобы взвесить их *правильно*. PageRank для авторитетности, которой не нужен запрос. И реципрокное слияние рангов, совет навигаторов, чтобы свести все эти несогласные голоса в один честный порядок. Это базовая планка, которую придётся брать каждому модному нейронному методу в этом курсе, — и ты искренне удивишься, как часто она просто побеждает.',
          'Два вопроса тянутся за нами отсюда, и у каждого своя глава. Первый, неудобный: я всё твержу «лучше» и «побеждает» — но как нам вообще это *узнать*? Оценить десять результатов на глаз — не измерение, и ранжирование BM25 может быть тихо хуже, чем я думаю. Это следующая глава, «Полигон», где мы ставим ранжированию честное число. Второй: Гремлин всё ещё там, за своей стеной, и посадить его в клетку навсегда — глава за ней, когда слова наконец получат координаты. Каталог построен. Теперь узнаем, хорош ли он, а потом научимся читать между слов.',
        ],
      },
    },
  ],
};
