    {
      id: 'hook-map', kind: 'prose',
      heading: { en: 'The Map of Meaning', ru: 'Карта смысла', tt: 'Мәгънә картасы' },
      img: 'L5/L5-00-map-of-meaning.png', imgPos: 'hero',
      imgAlt: {
        en: 'Serega the cartographer standing before a vast star-map where words hang as points of light, charting meaning as terrain.',
        ru: 'Серёга-картограф стоит перед огромной звёздной картой, где слова висят точками света, нанося смысл как местность.',
        tt: 'Серёга-картограф зур йолдыз картасы алдында тора, анда сүзләр яктылык ноктасы булып эленеп тора, мәгънәне җир-су итеп сызып бара.',
      },
      imgCaption: {
        en: 'Three lectures ago an alien said a word we’d never logged. Today that word finally gets a place on the map.',
        ru: 'Три лекции назад инопланетянин сказал слово, которого у нас не было в журнале. Сегодня это слово наконец получит место на карте.',
        tt: 'Өч лекция элек чит планеталы без язмаган сүзне әйтте. Бүген ул сүз ниһаять картада урын ала.',
      },
      body: {
        en: [
          "I'm Serega, and I want to take you back to **First Contact** — the alien on the screen, the translator spitting out symbols, the moment we couldn't tell whether two of its phrases meant the same thing. We solved half of it: we turned the alien's text into countable units and we built cosine, a way to measure when two *vectors* point the same way. But there was a crack we papered over, and it has been widening ever since.",
          "Here's the crack. The whole classical machine — the inverted index, BM25, the bag-of-words vectors — treats a word as a *symbol*: a unique ID, a card in a catalog, a slot in a vector. And symbols have no sense of *nearness in meaning*. To that machine \"couch\" and \"sofa\" are as unrelated as \"couch\" and \"crocodile\" — different IDs, full stop. The alien could hand us a perfect synonym for a word in our index and we'd score it exactly zero.",
          "So today we do the thing the alien needed all along: we give every word **coordinates**. Not an arbitrary ID, but a position in a space where the geometry *means* something — where \"couch\" and \"sofa\" land as neighbours, where the direction from \"king\" to \"queen\" is the same arrow as from \"man\" to \"woman\", and where *near* finally means *related*. We're going to draw the Map of Meaning. Then, because that map lives in three hundred dimensions and you have two eyes, we'll learn to fold it small enough to see.",
        ],
        ru: [
          'Я Серёга, и я хочу вернуть тебя в **Первый контакт** — инопланетянин на экране, переводчик, выплёвывающий символы, миг, когда мы не могли понять, значат ли две его фразы одно и то же. Половину мы решили: превратили текст инопланетянина в счётные единицы и построили косинус — способ мерить, когда два *вектора* смотрят в одну сторону. Но мы заклеили трещину, и с тех пор она только росла.',
          'Вот эта трещина. Вся классическая машина — инвертированный индекс, BM25, векторы мешка слов — обращается со словом как с *символом*: уникальный ID, карточка в каталоге, ячейка в векторе. А у символов нет чувства *близости по смыслу*. Для этой машины «диван» и «софа» так же не связаны, как «диван» и «крокодил» — разные ID, и точка. Инопланетянин мог бы вручить нам идеальный синоним к слову из нашего индекса, а мы поставили бы ему ровно ноль.',
          'Поэтому сегодня мы делаем то, что инопланетянину было нужно с самого начала: даём каждому слову **координаты**. Не произвольный ID, а позицию в пространстве, где геометрия *что-то значит* — где «диван» и «софа» оказываются соседями, где направление от «king» к «queen» — та же стрелка, что от «man» к «woman», и где *близко* наконец значит *связано*. Мы нарисуем Карту смысла. А потом, поскольку эта карта живёт в трёхстах измерениях, а глаз у тебя два, научимся складывать её так, чтобы её можно было увидеть.',
        ],
        tt: [
          'Мин — Серёга, һәм мин сине **Беренче контакт**ка кире кайтарырга телим — экрандагы чит планеталы, символлар чыгарып торган тәрҗемәче, без аның ике фразасы бер үк нәрсә аңлатамы икәнен аера алмаган мизгел. Яртысын чиштек: чит планеталының текстын санала торган берәмлекләргә әйләндердек һәм косинус төзедек — ике *вектор* бер якка караганын үлчәү ысулы. Әмма без бер ярыкны ябыштырган идек, һәм ул шуннан бирле киңәя барды.',
          'Менә шул ярык. Бөтен классик машина — инвертацияләнгән индекс, BM25, сүзләр капчыгы векторлары — сүзне *символ* итеп карый: уникаль ID, каталогтагы карточка, вектордагы оя. Ә символларда *мәгънә буенча якынлык* тойгысы юк. Бу машина өчен «диван» белән «софа» «диван» белән «крокодил» кебек үк бәйләнешсез — төрле ID, шул гына. Чит планеталы безнең индекстагы сүзгә идеаль синоним бирә алыр иде, ә без аңа нәкъ ноль куяр идек.',
          'Шуңа күрә бүген без чит планеталыга башта ук кирәк булганны эшлибез: һәр сүзгә **координаталар** бирәбез. Ирекле ID түгел, ә геометриясе *нәрсәдер аңлаткан* киңлектә позиция — анда «диван» белән «софа» күршеләр булып төшә, анда «king»’тан «queen»’гә юнәлеш «man»’нан «woman»’га булган шул ук ук, һәм анда *якын* ниһаять *бәйле* дигән сүз. Без Мәгънә картасын сызачакбыз. Аннары, бу карта өч йөз үлчәмдә яшәгәнгә, ә синең күзең икәү, аны күреп булырлык итеп бөкләргә өйрәнәчәкбез.',
        ],
      },
    },
