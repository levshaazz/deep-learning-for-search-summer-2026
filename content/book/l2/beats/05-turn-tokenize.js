    {
      id: 'turn-tokenize', kind: 'prose',
      heading: { en: 'Enter the Tokenosaurus', ru: 'Появляется Токенозавр', tt: 'Токенозавр чыга' },
      img: 'L2/L2-23-tokenosaurus.png', imgPos: 'mascot',
      imgAlt: {
        en: 'The Tokenosaurus, a friendly dinosaur, snipping a word into sub-word chunks with its teeth.',
        ru: 'Токенозавр — дружелюбный динозавр — зубами нарезает слово на подсловные куски.',
        tt: 'Токенозавр — дустанә динозавр — теше белән сүзне өлеш-сүз кисәкләренә кисә.',
      },
      imgCaption: {
        en: "The dino's one job: there's no such thing as an unknown word — only a word he hasn't finished chewing into familiar bites.",
        ru: 'Единственная работа динозавра: неизвестных слов не бывает — есть слово, которое он ещё не дожевал до знакомых кусочков.',
        tt: 'Динозаврның бердәнбер эше: билгесез сүзләр булмый — таныш кисәкләргә кадәр чәйнәп бетермәгән сүз кенә бар.',
      },
      body: {
        en: [
          "So we stop chasing whole words and chop them into *sub-words*. Meet the **Tokenosaurus** — a friendly beast that snips text into reusable chunks. Never seen the word *internationalization*? Fine — it still splits into pieces we *have* seen: `inter` + `national` + `ization`. The vocabulary stays finite, every input is representable, and `[UNK]` simply stops happening.",
          "But how big should the chunks be? That's a genuine three-way tug-of-war — a trade-off triangle between **vocabulary size**, **sequence length**, and **out-of-vocabulary risk**, and you can only ever keep two corners happy. Go to the extreme of single characters (or raw bytes) and the vocabulary shrinks to about 256 symbols and OOV vanishes entirely — but a sentence balloons to four or five times as many tokens, which is brutal when attention costs grow with the square of the length. Go to the extreme of whole words and sequences are short — but the vocabulary is unbounded (that's Heaps again) and OOV is everywhere. **Sub-words sit in the sweet interior:** a bounded vocabulary of roughly 30k–200k pieces, moderate sequence length, near-zero OOV. That's why every modern tokenizer — GPT-2's 50,257, GPT-4's ~100k, BERT's 30,522, LLaMA's 32k — lives there.",
          "The real magic is that we don't hand-pick the chunks. We let the *data* decide which pieces are worth keeping, by a beautifully simple loop. That loop is the next figure — watch the merges happen.",
        ],
        ru: [
          'Поэтому мы перестаём гоняться за целыми словами и режем их на *подслова*. Знакомьтесь — **Токенозавр**, дружелюбный зверь, который кромсает текст на переиспользуемые куски. Не видел слова *internationalization*? Не беда — оно всё равно распадётся на куски, которые мы *видели*: `inter` + `national` + `ization`. Словарь остаётся конечным, любой вход представим, а `[UNK]` просто перестаёт случаться.',
          'Но насколько крупными должны быть куски? Это настоящее перетягивание каната на три стороны — треугольник компромисса между **размером словаря**, **длиной последовательности** и **риском OOV**, и довольными можно держать лишь два угла из трёх. Уйди в крайность одиночных символов (или сырых байтов) — словарь сожмётся до примерно 256 знаков, а OOV исчезнет совсем, но предложение раздуется в четыре-пять раз по числу токенов, что жестоко, ведь стоимость внимания растёт как квадрат длины. Уйди в крайность целых слов — последовательности короткие, но словарь безграничен (это снова Хипс), а OOV повсюду. **Подслова сидят в сладкой середине:** ограниченный словарь примерно в 30k–200k кусков, умеренная длина, почти нулевой OOV. Поэтому каждый современный токенизатор — 50 257 у GPT-2, ~100k у GPT-4, 30 522 у BERT, 32k у LLaMA — живёт именно там.',
          'Настоящая магия в том, что куски мы не выбираем руками. Мы даём *данным* решать, какие куски стоит хранить, по на удивление простому циклу. Этот цикл — следующая фигура: следи, как происходят слияния.',
        ],
        tt: [
          'Шуңа күрә без бөтен сүзләр артыннан куумны туктатабыз һәм аларны *өлеш-сүзләргә* кисәбез. Танышыгыз — **Токенозавр**, текстны кабат кулланыла торган кисәкләргә кисүче дустанә җанвар. *internationalization* сүзен беркайчан күрмәдеңме? Берни түгел — ул барыбер без *күргән* кисәкләргә таркала: `inter` + `national` + `ization`. Сүзлек чикле кала, теләсә нинди керем тасвирланырлык, ә `[UNK]` бары тик булмый башлый.',
          'Ләкин кисәкләр нинди зурлыкта булырга тиеш? Бу — чын өчьяклы канат тарту — **сүзлек зурлыгы**, **эзлеклелек озынлыгы** һәм **OOV-риск** арасында компромисс өчпочмагы, һәм өч почмактан икесен генә канәгать тотып була. Бер символлар (яки чи байтлар) кырыена кит — сүзлек якынча 256 билгегә кысыла, ә OOV бөтенләй юкка чыга, ләкин җөмлә токеннар саны буенча дүрт-биш тапкырга кабара, бу рәхимсез, чөнки игътибар бәясе озынлык квадраты кебек үсә. Бөтен сүзләр кырыена кит — эзлеклелекләр кыска, ләкин сүзлек чиксез (бу тагын Хипс), ә OOV һәр җирдә. **Өлеш-сүзләр татлы урталыкта утыра:** якынча 30k–200k кисәкле чикле сүзлек, уртача озынлык, диярлек нуль OOV. Шуңа күрә һәр хәзерге токенлаштыргыч — GPT-2 да 50 257, GPT-4 да ~100k, BERT та 30 522, LLaMA да 32k — нәкъ шунда яши.',
          'Чын тылсым шунда ки, кисәкләрне без кул белән сайламыйбыз. Без *мәгълүматка* кайсы кисәкләрне сакларга кирәклеген хәл итәргә бирәбез, гаҗәп гади цикл буенча. Бу цикл — киләсе фигура: кушылулар ничек барганын күзәт.',
        ],
      },
    },
