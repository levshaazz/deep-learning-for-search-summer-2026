    {
      id: 'hook-the-alliance', kind: 'prose',
      heading: { en: 'The Alliance', ru: 'Альянс', tt: 'Альянс' },
      img: 'L8/L8-00-the-alliance.png', imgPos: 'scene',
      imgAlt: {
        en: 'Two hosts converge — an angular sparse column from the left and a flowing dense column from the right — and at the centre a lone Standard-Bearer holds one tall banner where the two columns merge.',
        ru: 'Две армии сходятся — угловатая разрежённая колонна слева и плавная плотная справа — а в центре одинокий Знаменосец держит одно высокое знамя там, где колонны сливаются.',
        tt: 'Ике гаскәр якынлаша — сулдан почмаклы сирәк колонна, уңнан агышлы тыгыз колонна — һәм үзәктә ялгыз Байракчы ике колонна кушылган җирдә бер биек байрак тота.',
      },
      body: {
        en: [
          "Two armies win different battles. The **lexical** army — sparse, keyword-driven (BM25, SPLADE) — catches the exact words. The **semantic** army — dense, meaning-driven (the bi-encoders of Lecture 7) — catches the paraphrase. Neither wins everywhere. This chapter unites them: the **Standard-Bearer** raises one banner under which sparse and dense fight together (hybrid), late interaction gives a richer per-token read (ColBERT), and a learned captain orders the host (Learning to Rank).",
          "It is also where Lecture 7 pays its debts. There we promised that a forgetful Scout could be given a multi-vector read, and that the RankNet line led somewhere. Here ColBERT delivers the read, hybrid fusion unites the armies, and RankNet → LambdaRank → **LambdaMART** finally arrives. The catchphrase for the whole lecture is *The Alliance*.",
        ],
        ru: [
          "Две армии выигрывают разные битвы. **Лексическая** — разрежённая, по ключевым словам (BM25, SPLADE) — ловит точные слова. **Семантическая** — плотная, по смыслу (би-энкодеры из лекции 7) — ловит перефразировку. Ни одна не побеждает везде. Эта глава объединяет их: **Знаменосец** поднимает одно знамя, под которым разрежённые и плотные сражаются вместе (гибрид), позднее взаимодействие даёт более богатый потокенный взгляд (ColBERT), а выученный капитан строит войско (обучение ранжированию).",
          "Здесь же лекция 7 отдаёт долги. Там мы обещали, что забывчивому Разведчику можно дать многовекторный взгляд и что линия RankNet куда-то ведёт. Теперь ColBERT даёт этот взгляд, гибридное слияние объединяет армии, а RankNet → LambdaRank → **LambdaMART** наконец прибывает. Девиз всей лекции — *Альянс*.",
        ],
        tt: [
          "Ике гаскәр төрле сугышларны җиңә. **Лексик** гаскәр — сирәк, төп сүзләр буенча (BM25, SPLADE) — төгәл сүзләрне тота. **Семантик** гаскәр — тыгыз, мәгънә буенча (7 нче лекциядәге би-энкодерлар) — башка сүзләр белән әйтелгәнне тота. Берсе дә һәр җирдә җиңми. Бу бүлек аларны берләштерә: **Байракчы** бер байрак күтәрә, аның астында сирәк һәм тыгыз бергә сугыша (гибрид), соңгы тәэсир итешү байрак потокенлы карашны бирә (ColBERT), ә өйрәнелгән капитан гаскәрне тәртипкә сала (ранжлауга өйрәнү).",
          "Шунда ук 7 нче лекция бурычларын кайтара. Анда без онытучан Разведчикка күп-векторлы караш бирергә мөмкин дип, RankNet сызыгы кайдадыр алып бара дип вәгъдә иттек. Хәзер ColBERT бу карашны бирә, гибрид берләштерү гаскәрләрне берләштерә, ә RankNet → LambdaRank → **LambdaMART** ниһаять килә. Бөтен лекциянең девизы — *Альянс*.",
        ],
      },
    },
