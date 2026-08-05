    {
      id: 'classical-prf', kind: 'prose',
      heading: { en: 'The old quill: pseudo-relevance feedback', ru: 'Старое перо: псевдорелевантная обратная связь', tt: 'Иске каләм: псевдо-релевант кире бәйләнеш' },
      body: {
        en: [
          "Long before any LLM, the field already knew the query was too poor to stand alone — and it built a quill to fatten it. The idea is **pseudo-relevance feedback (PRF)**: run the raw query, *assume* the top handful of results are relevant even though nobody said so, harvest the words that recur in them, and fold those words back into a second, richer query. Retrieve, trust the top-k, expand, retrieve again.",
          "It is worth seeing that PRF grew as **two sibling families, not one lineage** — the same idea discovered twice in two different theories of retrieval. On the vector-space side sits **Rocchio**: treat query and documents as vectors and physically *shove the query point* toward the centroid of the assumed-relevant set and away from the rest. On the language-model side sits the **Relevance Model** family — RM1, RM3 — which asks instead: what distribution over words would have *generated* these top documents, and how do I blend it into my query?",
          "Both answer the vocabulary gap the same way — borrow words from documents the query already surfaced. Rocchio moves a *point*; RM moves a *distribution*. Keep the two apart in your head: they are parallel roads to one destination, not parent and child.",
        ],
        ru: [
          "Задолго до всякой LLM в поле уже знали: запрос слишком беден, чтобы стоять сам по себе, — и построили перо, чтобы его откормить. Идея — **псевдорелевантная обратная связь (PRF)**: прогони сырой запрос, *предположи*, что верхняя горстка результатов релевантна, хотя никто этого не подтверждал, собери слова, что в них повторяются, и вложи эти слова обратно во второй, богатый запрос. Найди, доверься топ-k, расширь, найди снова.",
          "Стоит увидеть, что PRF выросла как **два родственных семейства, а не одна родословная**, — одну идею открыли дважды в двух разных теориях поиска. На стороне векторного пространства — **Рокчио**: считай запрос и документы векторами и физически *подтолкни точку запроса* к центроиду предположительно релевантного множества и прочь от остального. На стороне языковых моделей — семейство **моделей релевантности** — RM1, RM3, — которое спрашивает иначе: какое распределение по словам *породило* бы эти верхние документы и как вмешать его в мой запрос?",
          "Оба отвечают на словарный разрыв одинаково — занимают слова у документов, которые запрос уже поднял. Рокчио двигает *точку*; RM двигает *распределение*. Держи их в голове порознь: это параллельные дороги к одной цели, а не родитель и дитя.",
        ],
        tt: [
          "Теләсә нинди LLM-нан күпкә алда өлкә инде белә иде: сорау үзе генә тору өчен артык ярлы, — һәм аны симертер өчен каләм төзеде. Идея — **псевдо-релевант кире бәйләнеш (PRF)**: чи сорауны эшләт, өске бер уч нәтиҗә релевант дип *фараз ит* — беркем моны расламаса да, аларда кабатланган сүзләрне җый һәм бу сүзләрне икенче, баерак сорауга кире сал. Тап, топ-k-га ышан, киңәйт, яңадан тап.",
          "PRF **бер нәсел түгел, ике туганлык гаиләсе** булып үскәнен күрү кирәк — бер идеяне ике төрле эзләү теориясендә ике тапкыр ачканнар. Вектор пространствосы ягында — **Rocchio**: сорау белән документларны векторлар итеп кара һәм сорау ноктасын релевант дип фаразланган җыелманың үзәгенә таба, ә калганнардан еракка физик рәвештә *этеп җибәр*. Тел модельләре ягында — **Relevance Model** гаиләсе — RM1, RM3 — ул башкача сорый: кайсы сүз бүленеше бу өске документларны *тудырган* булыр иде һәм аны сорауыма ничек кушам?",
          "Икесе дә лексик ярыкка бердәй җавап бирә — сорау инде күтәргән документлардан сүзләр алалар. Rocchio *нокта* күчерә; RM *бүленеш* күчерә. Аларны башыңда аерым тот: бу бер максатка параллель юллар, ата белән бала түгел.",
        ],
      },
    },
