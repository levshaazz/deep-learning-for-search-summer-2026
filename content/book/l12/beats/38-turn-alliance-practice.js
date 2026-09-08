    {
      id: 'turn-alliance-practice', kind: 'prose',
      heading: { en: 'The Alliance marches', ru: 'Альянс выступает', tt: 'Альянс юлга чыга' },
      body: {
        en: [
          "Put the four pillars in one pipeline. Three retrieval armies — sparse (BM25/SPLADE), dense (SBERT), and late-interaction (ColBERT) — each bring back candidates. A hybrid fusion stage (RRF) merges them into one set. A Learning-to-Rank captain (LambdaMART) reranks the top of that set into the final order.",
          "Two bridges run forward from here. ANN search makes each retrieval army sublinear so the whole thing stays fast — that is Lecture 13 (PLAID, HNSW). And turning the ranked results into a grounded answer is Lecture 15 (RAG). The host is assembled; the road leads on.",
        ],
        ru: [
          "Соберём четыре столпа в один пайплайн. Три армии поиска — разрежённая (BM25/SPLADE), плотная (SBERT) и позднего взаимодействия (ColBERT) — каждая приносит кандидатов. Этап гибридного слияния (RRF) объединяет их в один набор. Капитан обучения ранжированию (LambdaMART) переупорядочивает верх этого набора в финальный порядок.",
          "Отсюда вперёд ведут два моста. Поиск ANN делает каждую армию сублинейной, чтобы всё оставалось быстрым — это лекция 13 (PLAID, HNSW). А превращение ранжированных результатов в обоснованный ответ — это лекция 15 (RAG). Войско собрано; дорога ведёт дальше.",
        ],
        tt: [
          "Дүрт багананы бер конвейерга җыйыйк. Өч эзләү гаскәре — сирәк (BM25/SPLADE), тыгыз (SBERT) һәм соңгы тәэсир итешү (ColBERT) — һәрберсе кандидатлар алып кайта. Гибрид берләштерү этабы (RRF) аларны бер җыелмага куша. Ранжлауга өйрәнү капитаны (LambdaMART) шул җыелманың өске өлешен соңгы тәртипкә яңадан тәртипли.",
          "Моннан алга ике күпер бара. ANN эзләве һәр гаскәрне сублинеар итә, шуңа барысы тиз кала — бу 13 нчы лекция (PLAID, HNSW). Ә ранжланган нәтиҗәләрне нигезле җавапка әйләндерү — 15 нчы лекция (RAG). Гаскәр җыелган; юл алга алып бара.",
        ],
      },
    },
