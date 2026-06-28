    {
      id: 'depth-embedder-families', kind: 'prose',
      heading: { en: 'The embedder zoo', ru: 'Зоопарк эмбеддеров', tt: 'Эмбеддерлар зоопаркы' },
      img: 'L7/L7-09-embedder-zoo.png', imgPos: 'scene',
      imgAlt: {
        en: 'A zoo of bi-encoder creatures of different sizes behind labelled enclosures — E5, BGE, GTE, the API models — each a distinct Scout breed, ranked on a leaderboard board hung above the menagerie.',
        ru: 'Зоопарк существ-би-энкодеров разного размера за подписанными вольерами — E5, BGE, GTE, API-модели — каждое отдельная порода Разведчика, ранжируемая на доске-лидерборде над зверинцем.',
        tt: 'Төрле зурлыктагы би-энкодер җан ияләре зоопаркы билгеле читлекләр артында — E5, BGE, GTE, API-модельләр — һәркайсы аерым Разведчик токымы, менажерия өстендәге лидерборд тактасында тәртипләнгән.',
      },
      body: {
        en: [
          "The bi-encoder is a **family**, not a model. After DPR and SBERT came a wave of stronger encoders — **E5**, **BGE**, **GTE**, **Nomic**, **Jina**, **mxbai**, **Arctic**, and the API models from **OpenAI**, **Cohere** and **Voyage** — ranked on the **MTEB** leaderboard. They differ on embedding dimension (from all-MiniLM's 384 up to 1024–4096), input length (512 to 8000+ tokens) and training recipe.",
          "But **MTEB is a leaderboard, not gospel**: its averages are computed on different benchmark versions, many vendor scores are self-reported, and a model that tops the table can still lose on *your* corpus. Use MTEB to build a shortlist, then evaluate the finalists on your own data, language and latency budget.",
        ],
        ru: [
          'Би-энкодер — это **семейство**, а не одна модель. После DPR и SBERT пришла волна более сильных энкодеров — **E5**, **BGE**, **GTE**, **Nomic**, **Jina**, **mxbai**, **Arctic** и API-модели от **OpenAI**, **Cohere** и **Voyage** — ранжируемых на лидерборде **MTEB**. Они различаются размерностью эмбеддинга (от 384 у all-MiniLM до 1024–4096), длиной входа (512 и до 8000+ токенов) и рецептом обучения.',
          'Но **MTEB — это лидерборд, а не истина**: его средние считаются на разных версиях бенчмарка, многие числа — это самооценки самих производителей моделей, и модель с вершины таблицы может проиграть на *вашем* корпусе. Используйте MTEB как короткий список, а финалистов меряйте на своих данных, языке и бюджете задержки.',
        ],
        tt: [
          'Би-энкодер — бу **гаилә**, бер модель түгел. DPR һәм SBERT артыннан көчлерәк энкодерлар дулкыны килде — **E5**, **BGE**, **GTE**, **Nomic**, **Jina**, **mxbai**, **Arctic** һәм **OpenAI**, **Cohere**, **Voyage** API-модельләре — алар **MTEB** лидербордында тәртипләнә. Алар эмбеддинг үлчәме (all-MiniLM\'да 384\'тән 1024–4096\'га кадәр), керем озынлыгы (512\'дән 8000+ токенга кадәр) һәм өйрәтү рецепты белән аерыла.',
          'Әмма **MTEB — лидерборд, хакыйкать түгел**: аның уртачалары бенчмаркның төрле версияләрендә исәпләнә, күп саннар — модель чыгаручылар үзләре белдергән бәяләр, һәм таблица башындагы модель *синең* корпуста оттыра ала. MTEB\'ны кыска исемлек итеп кулланыгыз, ә финалистларны үз мәгълүматыгызда, телегездә һәм тоткарлык бюджетыгызда үлчәгез.',
        ],
      },
    },
