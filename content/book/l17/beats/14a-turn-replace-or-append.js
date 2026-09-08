    {
      id: 'turn-replace-or-append', kind: 'prose',
      heading: { en: 'Replace or append', ru: 'Заменить или дописать', tt: 'Алыштырырга яки өстәргә' },
      body: {
        en: [
          "Put the two moves side by side, because one draft \\( \\hat d \\) serves both and the LLM call is paid for once. HyDE substitutes the **encoder's input**: it embeds the draft, \\( e = f(\\hat d) \\), and the query's terms never reach the index at all. Query2doc substitutes the **query string**: \\( q' = q \\Vert \\hat d \\), so the query's terms stay exactly where they were and the draft's terms simply join them. Replace on the dense side; append on the sparse side.",
          "Read past the surface and both branches are answering one and the same question — *do you keep a thread back to what the captain actually asked?* In dense space that thread is a summand you may add or omit: the optional \\( + f(q) \\) anchor from the averaging beat. In sparse space the thread **is** the construction, because a concatenation cannot drop the original terms — they are half of the string you handed the retriever.",
          "So the difference between their failure modes is structural, not a matter of taste. HyDE's anchor is optional, and that is exactly why drift is HyDE's characteristic boundary rather than Query2doc's: leave the anchor out and nothing in the retrieval score still remembers the question. Choose the substitution knowing which of the two you are choosing — an input swap that is able to forget, or a string extension that is not.",
        ],
        ru: [
          "Поставь два хода рядом: черновик \\( \\hat d \\) у них общий, и за вызов LLM платишь один раз. HyDE подменяет **вход энкодера** — кодирует черновик, \\( e = f(\\hat d) \\), и термы запроса до индекса вообще не доходят. Query2doc подменяет **строку запроса** — \\( q' = q \\Vert \\hat d \\), поэтому термы запроса остаются ровно там, где были, а термы черновика просто к ним прибавляются. Плотная сторона — заменить; разреженная — дописать.",
          "Загляни глубже поверхности — и обе ветки отвечают на один и тот же вопрос: *держишь ли ты нить к тому, что капитан действительно спросил?* В плотном пространстве эта нить — слагаемое, которое можно добавить, а можно и опустить: тот самый необязательный якорь \\( + f(q) \\) из такта про усреднение. В разреженном нить **и есть** конструкция, ведь конкатенация не умеет уронить исходные термы: они — половина строки, которую ты отдал поиску.",
          "Значит, разница в их отказах структурная, а не вкусовая. У HyDE якорь опционален, и именно поэтому дрейф — характерная граница HyDE, а не Query2doc: убери якорь — и в найденной оценке уже ничто не помнит вопрос. Выбирай подмену, понимая, что именно выбираешь: подмену входа, которая умеет забывать, или продление строки, которое не умеет.",
        ],
        tt: [
          "Ике адымны янәшә куй: черновик \\( \\hat d \\) аларда уртак, һәм LLM чакыруы өчен бер тапкыр түлисең. HyDE **энкодер керемен** алыштыра — черновикны кодлый, \\( e = f(\\hat d) \\), һәм сорау термнары индекска бөтенләй җитми. Query2doc **сорау юлын** алыштыра — \\( q' = q \\Vert \\hat d \\), шуңа сорау термнары нәкъ үз урынында кала, ә черновик термнары аларга гына өстәлә. Тыгыз якта — алыштыру; сирәк якта — өстәү.",
          "Өслектән тирәнрәк кара — ике тармак та бер үк сорауга җавап бирә: *капитан чынлап сораган нәрсәгә җепне тотасыңмы?* Тыгыз пространствода бу җеп — өстәргә дә, төшереп калдырырга да мөмкин булган кушылучы: уртачалау тактындагы шул ук мәҗбүри булмаган \\( + f(q) \\) якоре. Сирәктә исә җеп — конструкциянең **үзе**, чөнки конкатенация асыл термнарны төшерә алмый: алар — син эзләүгә биргән юлның яртысы.",
          "Димәк, аларның ватылуындагы аерма структур, тәм-той түгел. HyDE'да якорь опциональ, һәм нәкъ шуңа дрейф — HyDE'ның үз чиге, Query2doc'ныкы түгел: якорьны алып ташла, һәм табылган бәядә сорауны хәтерли торган бернәрсә дә калмый. Алыштыруны нәрсә сайлаганыңны аңлап сайла: онытырга сәләтле керем алыштыруымы, әллә оныта алмый торган юл озынайтуымы.",
        ],
      },
    },
