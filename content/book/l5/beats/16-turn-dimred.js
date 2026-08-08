    {
      id: 'turn-dimred', kind: 'prose',
      heading: { en: 'Enter the Cartographer', ru: 'Выходит Картограф', tt: 'Картограф чыга' },
      img: 'L5/L5-08-cartographer.png', imgPos: 'scene',
      imgAlt: {
        en: 'The Cartographer, a robed figure creasing a vast star-map along careful folds to make it small enough to carry.',
        ru: 'Картограф, фигура в плаще, заминает огромную звёздную карту по аккуратным складкам, чтобы её можно было унести.',
        tt: 'Картограф, плащлы фигура, зур йолдыз картасын җентекле бөкләрдән сыга, аны күтәреп йөрерлек итеп.',
      },
      imgCaption: {
        en: 'The Cartographer’s one job: fold a map too big to hold down to a size you can carry — without losing the shape of the land.',
        ru: 'Единственная работа Картографа: сложить карту, которую не удержать, до размера, который унесёшь, — не потеряв форму земли.',
        tt: 'Картографның бер генә эше: тотып булмый торган картаны күтәреп йөрерлек зурлыкка бөкләү — җирнең формасын югалтмыйча.',
      },
      body: {
        en: [
          "Meet the **Cartographer**. Her one job, the only thing she does, is **dimensionality reduction**: take a map that lives in 300 dimensions and crease it down to 2 or 3, so a human can finally hold it. Like every good map-folder, she faces a trade-off — the folded map can't be the territory, something is always lost in the creases — and the whole craft is in *choosing what to keep*.",
          "Frame the task precisely. We have forty thousand points in 300-D. We want a new set of forty thousand points in 2-D such that the *structure that matters* — which words are near which, which clusters hang together — survives the projection. \"Structure that matters\" is doing a lot of work in that sentence, and it splits the field in two. One school says: keep the directions of greatest *variance*, the axes along which the data is most spread out — that's **PCA**, and it's linear, fast, and honest about how much it threw away. The other says: forget global geometry, just keep each point's *local neighbours* close — that's **t-SNE** and **UMAP**, non-linear and gorgeous and treacherous. We'll walk through both, with the real numbers, in the climb that follows.",
        ],
        ru: [
          'Знакомься — **Картограф**. Её единственная работа, всё, что она делает, — **снижение размерности**: взять карту, которая живёт в 300 измерениях, и заломить её до 2 или 3, чтобы человек наконец смог её удержать. Как у всякого хорошего складывателя карт, у неё компромисс — сложенная карта не может быть территорией, в складках всегда что-то теряется, — и всё мастерство в том, *что именно сохранять*.',
          'Сформулируем задачу точно. У нас сорок тысяч точек в 300-D. Нужен новый набор из сорока тысяч точек в 2-D такой, что *важная структура* — какие слова рядом с какими, какие кластеры держатся вместе — переживёт проекцию. «Важная структура» несёт в этой фразе немалую нагрузку, и она делит эту область надвое. Одна школа говорит: сохрани направления наибольшей *дисперсии*, оси, вдоль которых данные разбросаны сильнее всего, — это **PCA**, линейный, быстрый и честный в том, сколько он выбросил. Другая говорит: забудь глобальную геометрию, просто держи *локальных соседей* каждой точки рядом — это **t-SNE** и **UMAP**, нелинейные, роскошные и коварные. Пройдём оба, с настоящими числами, в следующем восхождении.',
        ],
        tt: [
          'Таныш бул — **Картограф**. Аның бер генә эше, ул эшләгән бөтен нәрсә — **үлчәмлелекне киметү**: 300 үлчәмдә яшәгән картаны алып, аны 2 яки 3’кә сыгу, кеше ниһаять аны тотып торсын өчен. Һәр яхшы карта бөклүче кебек, аның килешүе бар — бөкләнгән карта җир-су була алмый, бөкләрдә һәрвакыт нәрсәдер югала, — һәм бөтен осталык *нәрсә сакларга икәнен сайлауда*.',
          'Бурычны төгәл әйтик. Бездә 300-D’да кырык мең нокта бар. Безгә 2-D’да кырык мең ноктаның яңа җыелмасы кирәк, *мөһим төзелеш* — кайсы сүзләр кайсыларга якын, кайсы кластерлар бергә тора — проекциядә исән калырлык. «Мөһим төзелеш» бу җөмләдә күп авырлык күтәрә, һәм ул өлкәне икегә яра. Бер мәктәп әйтә: иң зур *дисперсия* юнәлешләрен, мәгълүмат иң нык таралган күчәрләрне сакла, — бу **PCA**, ул линеар, тиз һәм нәрсә ташлаганын ачык әйтә. Икенчесе: глобаль геометрияне оныт, бары һәр ноктаның *локаль күршеләрен* янәшә тот, — бу **t-SNE** һәм **UMAP**, линеар түгел, искиткеч һәм мәкерле. Икесен дә, чын саннар белән, киләсе менүдә үтәрбез.',
        ],
      },
    },
