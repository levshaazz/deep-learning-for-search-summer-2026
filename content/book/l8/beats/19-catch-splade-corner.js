    {
      id: 'catch-splade-corner', kind: 'prose',
      heading: { en: 'Sparse isn’t always cheap', ru: 'Разрежённость не всегда дёшева', tt: 'Сирәклек һәрвакыт арзан түгел' },
      body: {
        en: [
          "There is a catch. Expansion adds terms to the query, which means longer posting lists to traverse — so a SPLADE query can be *slower* than a bare BM25 query, despite living in the same index. And if the learned weights become too dense, the inverted-index advantage erodes entirely.",
          "This is exactly what the FLOPS regularizer trades off: turn it up for sparser, faster vectors; turn it down for richer, slower ones. \"Sparse\" is a dial, not a guarantee — tune it to your latency budget.",
        ],
        ru: [
          "Есть подвох. Расширение добавляет термины в запрос, а значит более длинные постинг-листы для обхода — поэтому запрос SPLADE может быть *медленнее* голого BM25, хотя живёт в том же индексе. А если выученные веса станут слишком плотными, преимущество инвертированного индекса исчезает совсем.",
          "Именно это балансирует регуляризатор FLOPS: усиль его для более разрежённых, быстрых векторов; ослабь для более богатых, медленных. «Разрежённость» — это ручка, а не гарантия: настраивай под свой бюджет задержки.",
        ],
        tt: [
          "Бер хәйлә бар. Киңәйтү сорауга терминнар өсти, ягъни узарга озынрак постинг-исемлекләр — шуңа SPLADE сорауы шул ук индекста яшәсә дә, ялангач BM25 дан *әкренрәк* була ала. Ә өйрәнелгән авырлыклар артык тыгыз булса, инвертланган индекс өстенлеге бөтенләй юкка чыга.",
          "Нәкъ менә шуны FLOPS регуляризаторы баланслый: сирәгрәк, тизрәк векторлар өчен аны көчәйт; баерак, әкренрәк өчен — киметерт. «Сирәклек» — ул кагыйдә түгел, көйләгеч: үз тоткарлык бюджетыңа көйлә.",
        ],
      },
    },
