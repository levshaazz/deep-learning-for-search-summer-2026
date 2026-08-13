    {
      id: 'multilingual-vs-ru', kind: 'prose',
      heading: { en: 'Multilingual or ru-specific?', ru: 'Мультиязычный или ru-специфичный?', tt: 'Мультителме, әллә ru-спецификмы?' },
      body: {
        en: [
          "The multilingual route is the safe default. **multilingual-E5** carries the same *query:*/*passage:* prefixes as English E5 across roughly a hundred languages. **BGE-M3** is the flagship: 100+ languages, up to 8192 tokens, and — usefully for Russian — three outputs from one forward pass, a dense vector (L10), a learned-sparse one (SPLADE-style, L12) and a multi-vector one (ColBERT-style, L12), so it hands you the L12 hybrid inside a single model. **LaBSE** covers 109 languages but is a bitext specialist, better at translation retrieval than ad-hoc search.",
          "The ru-specific route — ruBERT/ruRoBERTa as bases, sbert_large_nlu_ru and ru-en-RoSBERTa as sentence encoders — earns its place on a narrow Russian domain (legal, medical, officialese) where a multilingual model spreads its capacity thin across a hundred languages. Otherwise a strong multilingual encoder is frequently just as good.",
          "The decision rule is the L10 choosing-an-embedder slide in a new coat: shortlist by language and domain, then evaluate the finalists on your *own* Russian data rather than a leaderboard average.",
        ],
        ru: [
          "Мультиязычный путь — безопасный дефолт. **multilingual-E5** несёт те же префиксы *query:*/*passage:*, что английский E5, примерно на сотне языков. **BGE-M3** — флагман: 100+ языков, до 8192 токенов и — удобно для русского — три выхода за один проход: плотный вектор (L10), обучаемый разреженный (как SPLADE, L12) и многовекторный (как ColBERT, L12), то есть гибрид из L12 внутри одной модели. **LaBSE** покрывает 109 языков, но это спец по битексту, лучше в поиске переводов, чем в ad-hoc.",
          "Ru-специфичный путь — ruBERT/ruRoBERTa как базы, sbert_large_nlu_ru и ru-en-RoSBERTa как энкодеры предложений — оправдан на узком русском домене (юр., мед., госязык), где мультиязычная модель размазывает ёмкость по сотне языков. Иначе сильная мультиязычная часто не хуже.",
          "Правило выбора — слайд из L10 про выбор эмбеддера в новом наряде: шорт-лист по языку и домену, а финалистов меряй на *своих* русских данных, а не по среднему лидерборда.",
        ],
        tt: [
          "Мультител юл — куркынычсыз default. **multilingual-E5** инглиз E5\'тәге шул ук *query:*/*passage:* префиксларын якынча йөз телдә йөртә. **BGE-M3** — флагман: 100+ тел, 8192 токенга кадәр, һәм — рус өчен уңайлы — бер үтештә өч чыгыш: dense-вектор (L10), learned-sparse (SPLADE кебек, L12) һәм multi-vector (ColBERT кебек, L12), ягъни L12 гибриды бер model эчендә. **LaBSE** 109 телне каплый, ләкин ул битекст белгече, ad-hoc эзләүгә караганда тәрҗемә эзләүдә яхшырак.",
          "Ru-специфик юл — нигез итеп ruBERT/ruRoBERTa, sentence-энкодер итеп sbert_large_nlu_ru һәм ru-en-RoSBERTa — мультител model йөз тел арасында сыйдырышын юкартканда, тар рус доменда (юридик, медицина, дәүләт теле) урынлы. Юкса көчле мультител еш начар түгел.",
          "Сайлау кагыйдәсе — L10\'дәге эмбеддер сайлау слайды яңа киемдә: тел һәм домен буенча кыска исемлек, ә финалистларны лидерборд уртачасы буенча түгел, *үз* рус мәгълүматыгызда үлчә.",
        ],
      },
    },
