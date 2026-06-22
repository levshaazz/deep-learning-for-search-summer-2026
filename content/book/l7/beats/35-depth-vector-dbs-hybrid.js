    {
      id: 'depth-vector-dbs-hybrid', kind: 'prose',
      heading: { en: 'Vector databases & hybrid search', ru: 'Векторные БД и гибридный поиск', tt: 'Вектор БД һәм гибрид эзләү' },
      body: {
        en: [
          "The index lives in a **vector database**. FAISS is a library for full control at billion scale; Qdrant, Weaviate, Milvus, Vespa and Elasticsearch are servers, most with native hybrid; pgvector keeps vectors inside Postgres. Pick by scale, filtering, and whether you need hybrid out of the box.",
          "**Hybrid search** is the robustness trick: a dense vector catches *meaning*, BM25 catches *exact* and rare terms, and **Reciprocal Rank Fusion** combines them by rank — \\(\\mathrm{RRF}(d)=\\sum_i \\frac{1}{k+\\mathrm{rank}_i(d)}\\), \\(k=60\\) — because their scores are incompatible (callback L3). Anthropic reports a contextual hybrid cut retrieval failures by about half, and adding a reranker pushed that to about two-thirds.",
        ],
        ru: [
          'Индекс живёт в **векторной БД**. FAISS — библиотека для полного контроля на миллиардном масштабе; Qdrant, Weaviate, Milvus, Vespa и Elasticsearch — серверы, большинство со встроенным гибридом; pgvector держит векторы прямо в Postgres. Выбирай по масштабу, фильтрам и по тому, нужен ли гибрид «из коробки».',
          '**Гибридный поиск** — приём устойчивости: плотный вектор ловит *смысл*, BM25 ловит *точные* и редкие термины, а **Reciprocal Rank Fusion** сливает их по рангу — \\(\\mathrm{RRF}(d)=\\sum_i \\frac{1}{k+\\mathrm{rank}_i(d)}\\), \\(k=60\\) — ведь их баллы несовместимы (callback L3). Anthropic сообщает: контекстный гибрид срезал промахи поиска примерно вдвое, а реранкер довёл это до ~двух третей.',
        ],
        tt: [
          'Индекс **вектор БД**\'да яши. FAISS — миллиард масштабта тулы контроль өчен китапханә; Qdrant, Weaviate, Milvus, Vespa һәм Elasticsearch — серверлар, күбесе туган гибрид белән; pgvector векторларны Postgres эчендә тота. Масштаб, фильтрлар һәм гибрид «тартмадан» кирәкме икәнлеге буенча сайлагыз.',
          '**Гибрид эзләү** — тотрыклылык алымы: тыгыз вектор *мәгънәне* тота, BM25 *төгәл* һәм сирәк терминнарны тота, ә **Reciprocal Rank Fusion** аларны ранг буенча куша — \\(\\mathrm{RRF}(d)=\\sum_i \\frac{1}{k+\\mathrm{rank}_i(d)}\\), \\(k=60\\) — чөнки аларның баллары туры килми (callback L3). Anthropic хәбәр итә: контекстлы гибрид эзләү уңышсызлыкларын якынча яртыга киметте, ә реранкер моны якынча өчтән икегә җиткерде.',
        ],
      },
    },
