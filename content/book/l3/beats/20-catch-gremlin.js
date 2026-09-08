    {
      id: 'catch-gremlin', kind: 'prose',
      heading: { en: 'The Lexical Gremlin laughs', ru: 'Лексический Гремлин смеётся', tt: 'Лексик Гремлин көлә' },
      img: 'L3/L3-04-lexical-gremlin-wall.png', imgPos: 'scene',
      imgAlt: {
        en: 'The Lexical Gremlin wedging a brick wall between "couch" and "sofa" — exact-term matching is blind to meaning.',
        ru: 'Лексический Гремлин вставляет кирпичную стену между «диваном» и «софой» — точное совпадение по словам слепо к смыслу.',
        tt: 'Лексик Гремлин «диван» белән «софа» арасына кирпеч стена кыстыра — төгәл сүз буенча туры килү мәгънәгә сукыр.',
      },
      imgCaption: {
        en: 'Search “couch,” miss the perfect “sofa,” score it exactly zero. Every clever weight we built still can’t climb his wall.',
        ru: 'Ищешь «диван», промахиваешься мимо идеальной «софы» — и ставишь ровно ноль. Никакой умный вес не лезет через его стену.',
        tt: '«Диван» эзлисең, идеаль «софа» яныннан үтеп китәсең — һәм нәкъ ноль куясың. Без төзегән бер генә акыллы авырлык та аның стенасыннан үтә алмый.',
      },
      body: {
        en: [
          "There's a catch, and he's grinning at me from behind the catalog. BM25, RRF, PageRank, the whole classical apparatus — every last piece of it matches on *exact words*. The index is a card per literal token; the scores reward literal overlap. So search \"couch\" and a perfect document that happens to say \"sofa\" scores exactly zero. Not low. Zero. As far as the catalog is concerned, those two words are as unrelated as \"couch\" and \"crocodile.\"",
          "This is the **Lexical Gremlin**, back from chapter one, and he is *thrilled* with everything we just built — because no amount of clever weighting climbs over his wall. You can patch a few cases: stemming so \"running\" and \"runs\" collapse together, query expansion to bolt synonyms on by hand. But those are buckets bailing a boat. The Gremlin wedges a brick wall between every pair of words that mean the same thing and were spelled differently, and our entire toolkit is built on spelling. To beat him for real we'll have to stop matching words and start matching *meaning* — give every word a position in a space where \"couch\" and \"sofa\" sit as neighbours. That's a later chapter, and it's the one he's afraid of.",
        ],
        ru: [
          'Есть подвох, и он ухмыляется мне из-за каталога. BM25, RRF, PageRank, весь классический аппарат — каждая его деталь совпадает по *точным словам*. Индекс — это карточка на буквальный токен; оценки награждают буквальное пересечение. Поэтому ищешь «диван», а идеальный документ, где написано «софа», получает ровно ноль. Не мало. Ноль. С точки зрения каталога эти два слова так же не связаны, как «диван» и «крокодил».',
          'Это **Лексический Гремлин**, вернувшийся из первой главы, и он *в восторге* от всего, что мы только что построили, — потому что никакое хитрое взвешивание не перелезет его стену. Можно залатать пару случаев: стемминг, чтобы «бегущий» и «бежит» схлопнулись, расширение запроса, чтобы вручную прицепить синонимы. Но это вёдра, вычерпывающие лодку. Гремлин вставляет кирпичную стену между каждой парой слов, которые значат одно, но написаны иначе, а весь наш инструментарий построен на написании. Чтобы победить его по-настоящему, придётся перестать совпадать по словам и начать совпадать по *смыслу* — дать каждому слову позицию в пространстве, где «диван» и «софа» стоят соседями. Это следующая глава, и именно её он боится.',
        ],
        tt: [
          'Бер җитешсезлек бар, һәм ул каталог артыннан миңа елмаеп тора. BM25, RRF, PageRank, бөтен классик аппарат — аның һәр кисәге *төгәл сүзләр* буенча туры килә. Индекс — бу хәрефи токенга бер карточка; бәяләр хәрефи кисешүне бүләкли. Шуңа «диван» эзлисең, ә «софа» дип язылган идеаль документ нәкъ ноль ала. Аз түгел. Ноль. Каталог ягыннан бу ике сүз «диван» белән «крокодил» кебек үк бәйләнешсез.',
          'Бу — **Лексик Гремлин**, беренче бүлектән кире кайткан, һәм ул без хәзер генә төзегәннең барысыннан *рәхәтләнә*, — чөнки бернинди хәйләкәр үлчәү аның стенасыннан үтеп менә алмый. Берничә очракны ямап була: стемминг, «йөгерүче» һәм «йөгерә» бергә ойысын өчен, сорауны киңәйтү, синонимнарны кул белән кыстырыр өчен. Ләкин бу — көймәне суыртучы чиләкләр. Гремлин бер нәрсә аңлаткан, ләкин башкача язылган һәр сүз пары арасына кирпеч стена кыстыра, ә безнең бөтен инструментарий язылышка нигезләнгән. Аны чыннан да җиңәр өчен сүзләр буенча туры килүне туктатып, *мәгънә* буенча туры килә башларга кирәк — һәр сүзгә «диван» белән «софа» күршеләр булып торган киңлектә позиция бирергә. Бу — киләсе бүлек, һәм ул нәкъ менә аннан курка.',
        ],
      },
    },
