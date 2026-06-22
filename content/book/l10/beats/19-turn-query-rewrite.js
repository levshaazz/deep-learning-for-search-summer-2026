    {
      id: 'turn-query-rewrite', kind: 'prose',
      heading: { en: 'Hear the real question', ru: 'Услышать настоящий вопрос', tt: 'Чын сорауны ишет' },
      img: 'L10/L10-05-hear-the-real-question.png', imgPos: 'float-right',
      imgAlt: {
        en: "Séréga cups an ear; two speech-bubbles — the captain's literal words and the true intent behind them — converge into a single query slot.",
        ru: 'Серёга прикладывает ладонь к уху; два облачка — буквальные слова капитана и истинное намерение за ними — сходятся в один слот запроса.',
        tt: 'Серёга колагына кулын куя; ике куык — капитанның сүзгә-сүз сүзләре һәм алар артындагы чын ният — бер сорау слотына кушыла.',
      },
      body: {
        en: [
          "Retrieval can only match the words it is given — and the captain's words are rarely the corpus's words. A short, vague query (\"how does the heart pump blood?\") misses a document that says \"cardiac cycle, ventricular systole.\" **Query understanding** rewrites or expands the query *before* retrieving, so the retriever aims at what was really asked. The `rag-pipeline` returns once more with its **query→retrieve** stage in focus — the aiming stage.",
        ],
        ru: [
          "Поиск может сопоставить лишь те слова, что ему дали — а слова капитана редко совпадают со словами корпуса. Короткий, расплывчатый запрос («как сердце качает кровь?») промахивается мимо документа про «сердечный цикл, систолу желудочков». **Понимание запроса** переписывает или расширяет запрос *до* извлечения, чтобы ретривер целился в то, что действительно спросили. `rag-pipeline` возвращается снова — со стадией **query→retrieve** в фокусе, стадией прицеливания.",
        ],
        tt: [
          "Эзләү үзенә бирелгән сүзләрне генә туры китерә ала — ә капитанның сүзләре корпус сүзләре белән сирәк туры килә. Кыска, томанлы сорау («йөрәк канны ничек кудыра?») «йөрәк циклы, карынчык систоласы» дигән документны үтеп китә. **Сорауны аңлау** сорауны алганчы *алдан* яңадан яза яки киңәйтә, эзләгеч чынлап нәрсә соралганга төбәлсен өчен. `rag-pipeline` тагын кайта — **query→retrieve** баскычы фокуста, төбәү баскычы."
        ],
      },
    },
