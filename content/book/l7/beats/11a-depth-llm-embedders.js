    {
      id: 'depth-llm-embedders', kind: 'prose',
      heading: { en: 'When the Scout is a whole LLM', ru: 'Когда Разведчик — целый LLM', tt: 'Разведчик тулы LLM булганда' },
      body: {
        en: [
          "For years the best Scouts were BERT-class encoders — a few hundred million parameters. Since 2024 the top of the **MTEB** leaderboard is something else entirely: **decoder LLMs** fine-tuned to hand back a single vector. **RepLLaMA**, **E5-mistral**, **NV-Embed**, **Qwen3-Embedding** and **gemini-embedding** are all built on 0.6-to-8-billion-parameter decoders, and they sit a clear notch above the strong BERT class — roughly the MTEB seventies where the older encoders plateaued in the mid-sixties.",
          "Why does size win here? A bigger decoder, pre-trained on far more text, already carries richer semantics *before* contrastive fine-tuning even begins — retrieval training only has to *shape* that knowledge, not install it. And because these are language models, you can write the task into the prompt (`Given a query, retrieve relevant passages`), so one model serves dozens of retrieval tasks — the direct heir of the E5/BGE role prefixes from the previous section.",
          "The reassuring part: **nothing about the cascade changes.** An LLM embedder is still a bi-encoder — one vector per text, cosine as the score. Everything else in this chapter — precompute the corpus offline, ANN over the index, a cross-encoder on the shortlist — applies verbatim. Only the *filling* of the tower changed.",
        ],
        ru: [
          'Годами лучшими Разведчиками были энкодеры BERT-класса — сотни миллионов параметров. С 2024 года вершина лидерборда **MTEB** — совсем другое: **декодерные LLM**, дообученные отдавать один вектор. **RepLLaMA**, **E5-mistral**, **NV-Embed**, **Qwen3-Embedding** и **gemini-embedding** построены на декодерах в 0,6–8 миллиардов параметров и стоят на заметную ступень выше сильного BERT-класса — примерно семидесятые MTEB там, где старые энкодеры застревали в середине шестидесятых.',
          'Почему здесь выигрывает размер? Больший декодер, предобученный на куда большем тексте, несёт богатую семантику ещё *до* контрастивного дообучения — тренировке ретривера остаётся лишь *огранить* это знание, а не установить его. А поскольку это языковые модели, задачу можно вписать прямо в промпт (`Given a query, retrieve relevant passages`), и одна модель обслуживает десятки задач поиска — прямой наследник ролевых префиксов E5/BGE из прошлого раздела.',
          'Что успокаивает: **в каскаде не меняется ничего.** LLM-эмбеддер — это всё тот же би-энкодер: один вектор на текст, косинус как счёт. Всё остальное из этой главы — офлайн-кодирование корпуса, ANN по индексу, кросс-энкодер на шорт-листе — применимо дословно. Поменялась только *начинка* башни.',
        ],
        tt: [
          'Еллар буена иң яхшы Разведчиклар BERT-класс энкодерлары иде — берничә йөз миллион параметр. 2024\'тән бирле **MTEB** лидербордының түбәсе бөтенләй башка: бер вектор кайтарырга өйрәтелгән **декодер LLM\'нар**. **RepLLaMA**, **E5-mistral**, **NV-Embed**, **Qwen3-Embedding** һәм **gemini-embedding** барысы да 0.6–8 миллиард параметрлы декодерларга нигезләнгән һәм көчле BERT-класстан сизелерлек югарырак тора — иске энкодерлар алтмышынчыларның уртасында туктаган җирдә якынча җитмешенче MTEB.',
          'Ни өчен монда зурлык җиңә? Күбрәк текстта алдан өйрәтелгән зуррак декодер бай семантиканы контрастив дообучениегә кадәр үк йөртә — retriever өйрәтүенә бу белемне *урнаштыру* түгел, аны *чарлау* гына кала. Һәм болар тел модельләре булганга, мәсьәләне промптка турыдан-туры язып була (`Given a query, retrieve relevant passages`), һәм бер модель дистәләрчә эзләү мәсьәләсен хезмәтли — үткән бүлектәге E5/BGE роль префиксларының туры варисы.',
          'Тынычландыра торган ягы: **каскадта бернәрсә дә үзгәрми.** LLM-эмбеддер — шул ук би-энкодер: текстка бер вектор, счёт итеп косинус. Бу бүлектәге калган бөтен нәрсә — корпусны офлайн кодлау, индекс буенча ANN, кыска исемлектә кросс-энкодер — сүзгә-сүз кулланыла. Бары тик манараның *эчлеге* үзгәрде.',
        ],
      },
    },
