    {
      id: 'normalization-stack', kind: 'prose',
      heading: { en: 'Where normalization lives in the pipeline', ru: 'Где нормализация живёт в конвейере', tt: 'Нормальләштерү конвейерда кайда яши' },
      body: {
        en: [
          "In a real lexical pipeline the normalization sits inside the analyzer. At index time the chain runs tokenize → lowercase → lemma/stem → stop-word removal, so only normalized terms ever enter the index. At query time the *identical* analyzer runs again — otherwise the query *котята* never matches the indexed lemma *котёнок*, and you have quietly rebuilt the miss.",
          "In Elasticsearch or OpenSearch this is one declaration: the built-in *russian* analyzer (a Snowball stemmer) or a hunspell/lemma plugin, attached once to the field so it governs both indexing and search. It needs no GPU, it is deterministic, and it carries the toy's ranking inversion straight into production.",
          "That is the shape of the whole cure for lexical search: rule- or dictionary-based normalization, cheap and symmetric, applied with one code path to both arms of the system.",
        ],
        ru: [
          "В реальном лексическом конвейере нормализация сидит внутри аналайзера. На индексации цепочка идёт токенизация → нижний регистр → лемма/стем → удаление стоп-слов, так что в индекс попадают только нормализованные термы. На запросе работает *тот же* аналайзер — иначе запрос *котята* никогда не совпадёт с индексированной леммой *котёнок*, и промах, который только что убрали, тихо соберётся заново.",
          "В Elasticsearch или OpenSearch это одно объявление: встроенный аналайзер *russian* (стеммер Snowball) или hunspell/лемма-плагин, привязанный к полю один раз, чтобы управлять и индексацией, и поиском. Ему не нужен GPU, он детерминирован и переносит ранговый переворот с игрушки прямо в прод.",
          "Такова форма всего лечения для лексического поиска: нормализация по правилам или по словарю, дешёвая и симметричная, применённая одним кодом к обоим плечам системы.",
        ],
        tt: [
          "Чын лексик конвейерда нормальләштерү анализатор эчендә утыра. Индекслаганда чылбыр токенизация → түбән регистр → лемма/стем → стоп-сүзләрне бетерү булып бара, шуңа индекска бары нормальләштерелгән термнар керә. Сорауда *шул ук* анализатор эшли — юкса *котята* соравы индексланган *котёнок* леммасына бервакытта да туры килми, һәм син тавышсыз промахны кире җыйдың.",
          "Elasticsearch яки OpenSearch\'та бу — бер белдерү: кертелгән *russian* анализаторы (Snowball стеммеры) яки hunspell/лемма плагины, кырга бер тапкыр беркетелгән, ул индекслауны да, эзләүне дә идарә итә. Аңа GPU кирәкми, ул детерминик һәм toy\'ның ранг әйләнешен прод\'ка турыдан-туры күчерә.",
          "Менә лексик эзләү өчен бөтен даруның формасы: кагыйдә- яки сүзлек-нигезле нормальләштерү, арзан һәм симметрик, системаның ике җилкәсенә дә бер код белән кулланылган.",
        ],
      },
    },
