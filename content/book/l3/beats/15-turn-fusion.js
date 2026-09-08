    {
      id: 'turn-fusion', kind: 'prose',
      heading: { en: 'One ranker is never enough', ru: 'Одного ранкера всегда мало', tt: 'Бер ранкер беркайчан җитми' },
      body: {
        en: [
          "BM25 is a workhorse, but it's still one opinion. It scores documents by exact-word overlap, weighted cleverly — that's its lens, and like any lens it has blind spots. A second ranker sees the same documents through a different lens. Take cosine similarity over the TF-IDF vectors we built a moment ago: it cares about the *angle* between a document and the query, the overall shape of their word usage, not the same things BM25 leans on. Two competent rankers, looking at the same shelf, will hand you two different top-tens.",
          "When two good rankers disagree, the rookie move is to crown a favourite and ignore the other. The smart move is to *fuse* their votes — to trust a document that *both* rankers liked more than one that only impressed a single judge. But there's an obstacle, and it's the one the two scorers raise the moment you line them up: BM25 might hand out numbers like 12.4 while cosine lives between 0 and 1. You cannot just add them; the bigger scale would silently win every time. We need a way to combine rankings that doesn't care how loud each ranker shouts.",
        ],
        ru: [
          'BM25 — рабочая лошадка, но это всё ещё одно мнение. Он оценивает документы по точному пересечению слов, хитро взвешенному, — это его линза, и, как у любой линзы, у неё есть слепые зоны. Второй ранкер смотрит на те же документы через другую линзу. Возьми косинусную близость по TF-IDF векторам, что мы построили минуту назад: его волнует *угол* между документом и запросом, общая форма их словоупотребления, а не то, на что опирается BM25. Два толковых ранкера, глядя на одну полку, выдадут тебе две разные десятки.',
          'Когда два хороших ранкера расходятся, новичок коронует любимчика и игнорирует второго. Умный ход — *слить* их голоса: довериться документу, который понравился *обоим* ранкерам, сильнее, чем тому, что впечатлил лишь одного судью. Но есть препятствие, и его поднимают сами два ранкера, едва ты их выстроишь рядом: BM25 может выдавать числа вроде 12,4, а косинус живёт между 0 и 1. Просто сложить нельзя; большая шкала молча победит каждый раз. Нужен способ объединять ранжирования, которому всё равно, как громко кричит каждый ранкер.',
        ],
        tt: [
          'BM25 — эш аты, ләкин ул барыбер бер фикер. Ул документларны хәйләкәр үлчәнгән төгәл сүз кисешүе буенча бәяли — бу аның линзасы, һәм теләсә кайсы линза кебек, аның сукыр зоналары бар. Икенче ранкер шул ук документларга башка линза аша карый. Без бер минут элек төзегән TF-IDF векторлары буенча косинус якынлыкны ал: аны документ белән сорау арасындагы *почмак*, аларның сүз кулланышының гомуми формасы кызыксындыра, BM25 таянган нәрсәләр түгел. Ике белемле ранкер, бер үк киштәгә карап, сиңа ике төрле унлык бирәчәк.',
          'Ике яхшы ранкер килешмәгәндә, башлап йөрүче берсен яраткан итеп патшага күтәрә һәм икенчесен игътибарсыз калдыра. Акыллы хәрәкәт — аларның тавышларын *берләштерү*: *икесе дә* яраткан документка, бары бер судьяны гына таң калдырганнан көчлерәк ышану. Ләкин киртә бар, һәм аны ике ранкерны янәшә тезгәч үк алар үзләре күтәрә: BM25 12,4 кебек саннар бирә ала, ә косинус 0 белән 1 арасында яши. Аларны бары кушып булмый; зуррак шкала һәр тапкыр тын гына җиңәчәк. Безгә һәр ранкерның никадәр катырак кычкыруына карамый торган ранжлауларны берләштерү ысулы кирәк.',
        ],
      },
    },
