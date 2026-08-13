    {
      id: 'depth-hybrid-production', kind: 'prose',
      heading: { en: 'Hybrid in the wild', ru: 'Гибрид на практике', tt: 'Гибрид тормышта' },
      body: {
        en: [
          "Every major search engine now ships hybrid retrieval, and the defaults are not arbitrary. **Elasticsearch** exposes RRF with a \\(\\text{rank\\_constant}\\) that defaults to \\(60\\) — Cormack's \\(k\\). **Weaviate** offers a hybrid mode with an \\(\\text{alpha}\\) that defaults to \\(0.5\\), weighting sparse and dense equally. **Vespa** supports learned rank fusion, **OpenSearch** a normalization pipeline plus RRF, and **Qdrant** both RRF and a distribution-based score fusion (DBSF).",
          "The lesson of the worked example is baked into these defaults: rank-based fusion with \\(k=60\\) is the safe starting point, and you tune from there only if your data demands it.",
        ],
        ru: [
          "Каждый крупный поисковик теперь поставляет гибридный поиск, и дефолты не случайны. **Elasticsearch** даёт RRF с \\(\\text{rank\\_constant}\\), по умолчанию \\(60\\) — это \\(k\\) Кормака. **Weaviate** предлагает гибридный режим с \\(\\text{alpha}\\), по умолчанию \\(0{,}5\\), взвешивая разрежённый и плотный поровну. **Vespa** поддерживает выученное слияние рангов, **OpenSearch** — пайплайн нормализации плюс RRF, а **Qdrant** — и RRF, и слияние на основе распределения (DBSF).",
          "Урок из разобранного примера зашит в эти дефолты: слияние по рангам с \\(k=60\\) — безопасная отправная точка, а дальше настраивай, только если того требуют твои данные.",
        ],
        tt: [
          "Хәзер һәр зур эзләү системасы гибрид эзләү тәкъдим итә, һәм дефолтлар очраклы түгел. **Elasticsearch** RRF ны \\(\\text{rank\\_constant}\\) белән бирә, ул килешү буенча \\(60\\) — Кормакның \\(k\\) ы. **Weaviate** \\(\\text{alpha}\\) лы гибрид режим тәкъдим итә, ул килешү буенча \\(0{,}5\\), сирәк һәм тыгызны тигез үлчәп. **Vespa** өйрәнелгән ранг берләштерүен, **OpenSearch** нормалаштыру конвейеры плюс RRF ны, ә **Qdrant** RRF ны да, таралышка нигезләнгән берләштерүне (DBSF) дә яклый.",
          "Чишелгән мисалның дәресе бу дефолтларга салынган: \\(k=60\\) белән ранглар буенча берләштерү — куркынычсыз башлангыч нокта, ә аннары мәгълүматың таләп иткәндә генә көйлә.",
        ],
      },
    },
