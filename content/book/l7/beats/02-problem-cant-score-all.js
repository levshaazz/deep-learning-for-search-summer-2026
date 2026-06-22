    {
      id: 'problem-cant-score-all', kind: 'prose',
      heading: { en: 'You can&rsquo;t judge a galaxy', ru: 'Галактику не пересудить', tt: 'Галактиканы хөкем итеп булмый' },
      body: {
        en: [
          "The careful Judge must read the query **and** the document *together* to score them — that is the source of its accuracy, and of its cost. Because the score depends on the pair, nothing about the document can be precomputed and cached. So every query needs one model read per document: \\(O(N)\\) reads, where \\(N\\) is the corpus size. At a hundred documents that is instant; at a million it will not finish; and real corpora hold a billion. A single careful judge simply cannot interview a galaxy of cases.",
        ],
        ru: [
          'Тщательный Судья должен прочитать запрос **и** документ *вместе*, чтобы их оценить — отсюда и его точность, и его цена. Раз оценка зависит от пары, про документ нельзя ничего предпосчитать и закэшировать. Значит, каждый запрос требует по чтению модели на документ: \\(O(N)\\) чтений, где \\(N\\) — размер корпуса. На ста документах это мгновенно; на миллионе не закончится; а реальные корпуса держат миллиард. Один тщательный судья не может опросить галактику дел.',
        ],
        tt: [
          'Җентекле Судья сорауны **һәм** документны бергә укырга тиеш аларны бәяләр өчен — аның төгәллеге дә, бәясе дә шуннан. Бәя парга бәйле булганга, документ турында бернәрсә алдан исәпләп кэшләп булмый. Шуңа һәр сорау документка бер уку таләп итә: \\(O(N)\\) уку, биредә \\(N\\) — корпус зурлыгы. Йөз документта бу шунда ук; миллионда тәмамланмый; ә реаль корпуслар миллиард тота. Бер җентекле судья эшләр галактикасыннан сорау ала алмый.',
        ],
      },
    },
