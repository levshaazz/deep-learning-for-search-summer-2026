// content/book/l2.js — "First Contact" chapter (the full L2 arc), per narrative/L2.md.
// The single source for this chapter's NARRATIVE prose. SCROLLY beats pull their per-step prose
// from the widget's own i18n.json (the figure narrates itself). EN canonical + RU; TT falls back.
// Built per NARRATIVE_METHOD.md (P1 hook, P2 creatures, P3 metaphor, P9 humor off precision, P12 callback).
// Prose beats may carry an illustration: img:'L2/<file>.png' (+ imgAlt/imgCaption {en,ru}, optional imgPos).

export default {
  id: '02',
  catchphrase: 'First Contact',
  beats: [
    {
      id: 'hook-first-contact', kind: 'prose',
      heading: { en: 'First Contact', ru: 'Первый контакт' },
      img: 'L2/L2-06-first-contact.png',
      imgAlt: {
        en: 'Serega and an alien face each other across a cloud of question marks — no shared symbols.',
        ru: 'Серёга и инопланетянин стоят друг против друга в облаке вопросительных знаков — нет общих символов.',
      },
      imgCaption: {
        en: 'An alien, and not one shared letter. Step one: agree on an alphabet. Step two: learn when two phrases mean the same thing.',
        ru: 'Инопланетянин — и ни одной общей буквы. Шаг один: договориться об алфавите. Шаг два: научиться понимать, когда две фразы об одном.',
      },
      body: {
        en: [
          "I'm Serega, and I've got a problem. There's an alien on my screen, and it won't stop talking. The translator spits out symbols. Are two of its phrases saying the same thing, or completely different things? I genuinely cannot tell.",
          "Here's the thing about meaning: a machine never gets to touch it directly. It only ever sees *strings* — sequences of characters with no built-in sense of which are alike. And strings are stubborn. A grey pixel halfway between black and white is a perfectly real, meaningful colour; you can interpolate it. But there is no word halfway between *cat* and *dog*. Symbols are **discrete** — they share no inherent ruler. \"Cat\" and \"car\" differ by one letter and mean wildly different things; \"couch\" and \"sofa\" share no letters and mean the same thing. You cannot read closeness off the spelling.",
          "So the mission splits into two jobs, and they have to happen in that order. First, **turn the alien's text into something countable** — numbers a machine can hold. Then, on top of those numbers, **manufacture a notion of distance** so the machine can finally judge: are these two meanings close, or far? Get Data, then Measure. Buckle up — we're going to build both halves from scratch.",
        ],
        ru: [
          'Я Серёга, и у меня проблема. На экране — инопланетянин, и он не замолкает. Переводчик выдаёт символы. Две его фразы говорят об одном и том же или о совершенно разном? Честно — не могу понять.',
          'Вот в чём штука со смыслом: машина никогда не касается его напрямую. Она видит только *строки* — последовательности символов без всякого встроенного чувства, какие из них похожи. А строки упрямы. Серый пиксель посередине между чёрным и белым — вполне реальный, осмысленный цвет; его можно интерполировать. Но слова посередине между *cat* и *dog* не существует. Символы **дискретны** — у них нет общей линейки. «Cat» и «car» отличаются одной буквой и значат совершенно разное; «couch» и «sofa» не имеют общих букв и значат одно и то же. По написанию близость не прочитать.',
          'Поэтому миссия распадается на две задачи, и порядок важен. Сначала — **превратить текст инопланетянина в нечто счётное**, в числа, которые машина может удержать. Потом, поверх этих чисел, — **изготовить понятие расстояния**, чтобы машина наконец могла судить: эти два смысла близки или далеки? Сперва Get Data, потом Measure. Пристегнись — обе половины мы построим с нуля.',
        ],
      },
    },
    {
      id: 'problem-raw-text', kind: 'prose',
      heading: { en: 'Raw text is not computable', ru: 'Сырой текст не вычисляем' },
      img: 'L2/L2-08-discreteness.png',
      imgAlt: {
        en: 'A continuous grey gradient on the left; on the right, "cat" and "dog" with no word in between.',
        ru: 'Слева непрерывный серый градиент; справа «cat» и «dog», и никакого слова между ними.',
      },
      imgCaption: {
        en: 'Pixels interpolate; symbols do not. There is no valid point between two strings — so we have to invent the coordinates ourselves.',
        ru: 'Пиксели интерполируются; символы — нет. Между двумя строками нет допустимой точки — координаты придётся придумать самим.',
      },
      body: {
        en: [
          "First snag: a computer can't do anything with raw letters. It needs numbers. The lazy fix is to build a dictionary — give every whole word its own integer ID — and feed those IDs to the model. It works right up until the alien says a word we never logged. One unseen word and the whole pipeline shrugs: *out of vocabulary*. The model has no slot for it, so it collapses everything it hasn't memorised into a single useless `[UNK]` token. Names, typos, hashtags, code identifiers, the alien's whole language — all flattened to the same blank.",
          "You might hope: just make the dictionary bigger. Read more text, keep adding words, surely it saturates? It does not. Two empirical laws say so, and we'll meet them as a figure in a moment. **Zipf's law** says word frequency falls off as roughly one-over-rank: on a real 3.7-million-token corpus, the top 10 words alone cover 20.6% of everything, the top 100 cover 47.3%, the top 1000 cover 71.4% — and then a colossal tail of words seen exactly once. **Heaps' law** says the number of distinct word-types keeps growing as you read, like \\(V \\approx K\\,N^{\\beta}\\) with \\(\\beta \\approx 0.59\\) — sublinear but *unbounded*. After 3.66 million tokens we'd already counted 94,287 distinct types and the curve was still climbing.",
          "Put those two facts together and the verdict is non-negotiable: **no fixed list of whole words can ever cover real language.** New words arrive forever. So we stop trying to enumerate words — and start breaking them into pieces small enough to never run out.",
        ],
        ru: [
          'Первая загвоздка: компьютер ничего не может сделать с сырыми буквами. Ему нужны числа. Ленивое решение — построить словарь, выдать каждому целому слову свой целочисленный ID и скормить эти ID модели. Работает ровно до того мига, когда инопланетянин произносит слово, которого мы не записали. Одно невиданное слово — и весь конвейер разводит руками: *слова нет в словаре*. У модели нет под него ячейки, и она схлопывает всё незаученное в один бесполезный токен `[UNK]`. Имена, опечатки, хэштеги, идентификаторы из кода, весь язык инопланетянина — всё сплющено в один пустой знак.',
          'Можно понадеяться: просто сделаем словарь больше. Прочитаем больше текста, будем добавлять слова — наверняка он насытится? Нет. Об этом говорят два эмпирических закона, и сейчас мы встретим их в виде фигуры. **Закон Ципфа**: частота слова падает примерно как один-на-ранг — на реальном корпусе в 3,7 млн токенов одни только топ-10 слов покрывают 20,6% всего, топ-100 — 47,3%, топ-1000 — 71,4%, а дальше колоссальный хвост слов, встреченных ровно один раз. **Закон Хипса**: число различных типов слов растёт по мере чтения как \\(V \\approx K\\,N^{\\beta}\\) при \\(\\beta \\approx 0{,}59\\) — сублинейно, но *неограниченно*. После 3,66 млн токенов мы уже насчитали 94 287 различных типов, и кривая всё ещё лезла вверх.',
          'Сложи эти два факта — и приговор не подлежит обжалованию: **никакой конечный список целых слов не покроет настоящий язык.** Новые слова приходят вечно. Поэтому мы перестаём перечислять слова — и начинаем дробить их на куски, достаточно мелкие, чтобы они никогда не кончались.',
        ],
      },
    },
    {
      id: 'turn-tokenize', kind: 'prose',
      heading: { en: 'Enter the Tokenosaurus', ru: 'Появляется Токенозавр' },
      img: 'L2/L2-23-tokenosaurus.png', imgPos: 'mascot',
      imgAlt: {
        en: 'The Tokenosaurus, a friendly dinosaur, snipping a word into sub-word chunks with its teeth.',
        ru: 'Токенозавр — дружелюбный динозавр — зубами нарезает слово на под-словные куски.',
      },
      imgCaption: {
        en: "The dino's one job: there's no such thing as an unknown word — only a word he hasn't finished chewing into familiar bites.",
        ru: 'Единственная работа динозавра: неизвестных слов не бывает — есть слово, которое он ещё не дожевал до знакомых кусочков.',
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
      },
    },
    { id: 'climb-bpe', kind: 'scrolly', widget: 'bpe-merge-ledger', data: 'l2-bpe' },
    { id: 'stats-zipf-heaps', kind: 'scrolly', widget: 'zipf-heaps', data: 'l2-corpus-stats' },
    {
      id: 'problem-length-lies', kind: 'prose',
      heading: { en: 'Length lies', ru: 'Длина врёт' },
      img: 'L2/L2-56-cosine-vs-euclid.png',
      imgAlt: {
        en: 'Two arrows (1,1) and (10,10) pointing the same way; Euclidean calls them far, cosine calls them identical.',
        ru: 'Две стрелки (1,1) и (10,10) смотрят в одну сторону; евклид считает их далёкими, косинус — одинаковыми.',
      },
      imgCaption: {
        en: '\\((1,1)\\) and \\((10,10)\\) point the same way. Euclidean distance \\(\\sqrt{162} \\approx 12.73\\) screams "different" — yet the direction is identical.',
        ru: '\\((1,1)\\) и \\((10,10)\\) смотрят в одну сторону. Евклидово расстояние \\(\\sqrt{162} \\approx 12{,}73\\) вопит «разные» — а направление при этом одинаково.',
      },
      body: {
        en: [
          "Tokenization done, every phrase is now a vector of numbers — a point in space, where each coordinate counts (roughly) how much of some feature the phrase carries. To compare two phrases, the obvious move is to measure the straight-line distance between their points: \\(\\lVert a - b\\rVert\\), the Euclidean distance you learned in school. Obvious… and wrong.",
          "Here's the trap, with exact numbers. Take the phrase whose vector is \\(a = (1, 1)\\) and the same phrase said twice as emphatically, \\(b = (10, 10)\\). They carry the *same* meaning — both point in exactly the same direction, up-and-to-the-right at 45°. But the Euclidean distance between them is $$\\lVert a - b\\rVert = \\sqrt{9^2 + 9^2} = \\sqrt{162} \\approx 12.73.$$ Raw distance screams \"these are totally different!\" — when in fact one is just a louder version of the other.",
          "That's the bug in one line: **length lies.** Euclidean distance conflates *how much* a vector says with *what* it says. A long document and a short document on the identical topic land far apart simply because the long one has bigger counts. We don't want loudness. We want a measure that throws away magnitude entirely and listens only to *direction* — to where the vector points.",
        ],
        ru: [
          'Токенизация позади — теперь каждая фраза это вектор чисел, точка в пространстве, где каждая координата считает (грубо), сколько в фразе того или иного признака. Чтобы сравнить две фразы, очевидный ход — измерить расстояние по прямой между их точками: \\(\\lVert a - b\\rVert\\), евклидово расстояние из школы. Очевидно… и неверно.',
          'Вот ловушка, с точными числами. Возьми фразу с вектором \\(a = (1, 1)\\) и ту же фразу, сказанную вдвое напористее, \\(b = (10, 10)\\). Смысл у них *один и тот же* — обе смотрят ровно в одну сторону, вправо-вверх под 45°. Но евклидово расстояние между ними $$\\lVert a - b\\rVert = \\sqrt{9^2 + 9^2} = \\sqrt{162} \\approx 12{,}73.$$ Сырое расстояние вопит: «они совершенно разные!» — хотя на деле одна просто громче другой.',
          'Вот баг в одну строку: **длина врёт.** Евклидово расстояние смешивает *сколько* вектор говорит с тем, *что* он говорит. Длинный документ и короткий на одну и ту же тему оказываются далеко друг от друга просто потому, что у длинного счётчики больше. Нам не нужна громкость. Нам нужна мера, которая полностью выбрасывает величину и слушает только *направление* — куда вектор смотрит.',
        ],
      },
    },
    {
      id: 'turn-measure-angle', kind: 'prose',
      heading: { en: 'Measure the angle, not the length', ru: 'Измеряй угол, а не длину' },
      img: 'L2/L2-48-sir-cosine.png', imgPos: 'mascot',
      imgAlt: {
        en: 'Sir Cosine, a knight of the unit sphere, measuring the angle between two vector-lances with a protractor.',
        ru: 'Сэр Косинус, рыцарь единичной сферы, измеряет транспортиром угол между двумя векторами-копьями.',
      },
      imgCaption: {
        en: "Sir Cosine's creed: relevance is a small angle. Throw away both lengths and only the meaning's direction is left standing.",
        ru: 'Кредо Сэра Косинуса: релевантность — это малый угол. Отбрось обе длины — и устоит только направление смысла.',
      },
      body: {
        en: [
          "Enter **Sir Cosine and the Knights of the Unit Sphere**. Their whole creed: forget distance, measure the *angle* between two vectors. The instrument is **cosine similarity** — the cosine of that angle, $$\\cos\\theta = \\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert} = \\frac{\\sum_i a_i b_i}{\\sqrt{\\sum_i a_i^2}\\,\\sqrt{\\sum_i b_i^2}}.$$ The numerator is the dot product, \\(\\sum_i a_i b_i\\); the denominator divides out *both* lengths, so the magnitude cancels and only direction is left. Point the same way → angle \\(0\\) → \\(\\cos\\theta = 1\\) (as similar as it gets). At right angles → \\(\\cos\\theta = 0\\) (nothing in common). Opposite → \\(\\cos\\theta = -1\\). For ordinary word-count vectors, which can't go negative, the score lives in \\([0, 1]\\).",
          "Run it on our trap from the last beat: \\(a = (1, 1)\\), \\(b = (10, 10)\\). Dot product \\(= 1\\cdot 10 + 1\\cdot 10 = 20\\); \\(\\lVert a\\rVert = \\sqrt{2}\\), \\(\\lVert b\\rVert = \\sqrt{200}\\); so $$\\cos\\theta = \\frac{20}{\\sqrt{2}\\cdot\\sqrt{200}} = \\frac{20}{\\sqrt{400}} = \\frac{20}{20} = 1.0.$$ Where Euclidean said \\(12.73\\) (\"miles apart\"), Sir Cosine says \\(1.0\\) (\"identical\"). He saw through the loudness to the meaning.",
          "And here's the elegant payoff that makes vector search practical. Expand the squared distance: \\(\\lVert x - y\\rVert^2 = \\lVert x\\rVert^2 + \\lVert y\\rVert^2 - 2\\,(x\\cdot y)\\). If you first **normalize** every vector to unit length — push every point onto the surface of the unit sphere — that collapses to $$\\lVert x - y\\rVert^2 = 2\\,(1 - \\cos\\theta).$$ On the sphere, cosine, dot product, and (negative) Euclidean distance all rank neighbours in the *exact same order*. That's why real systems L2-normalize their embeddings and then run a blazing-fast dot-product index: they get cosine's meaning at a dot product's speed. The next figure is the worked example on the sphere — watch the numbers, no jokes.",
        ],
        ru: [
          'На сцену выходят **Сэр Косинус и Рыцари Единичной Сферы**. Весь их девиз: забудь про расстояние, измеряй *угол* между двумя векторами. Инструмент — **косинусная близость**, косинус этого угла: $$\\cos\\theta = \\frac{a\\cdot b}{\\lVert a\\rVert\\,\\lVert b\\rVert} = \\frac{\\sum_i a_i b_i}{\\sqrt{\\sum_i a_i^2}\\,\\sqrt{\\sum_i b_i^2}}.$$ В числителе скалярное произведение, \\(\\sum_i a_i b_i\\); знаменатель делит на *обе* длины, так что величина сокращается и остаётся только направление. Смотрят в одну сторону → угол \\(0\\) → \\(\\cos\\theta = 1\\) (максимально похожи). Под прямым углом → \\(\\cos\\theta = 0\\) (ничего общего). Противоположно → \\(\\cos\\theta = -1\\). Для обычных векторов счётчиков слов, которые не уходят в минус, оценка живёт в \\([0, 1]\\).',
          'Прогоним на нашей ловушке из прошлого бита: \\(a = (1, 1)\\), \\(b = (10, 10)\\). Скалярное произведение \\(= 1\\cdot 10 + 1\\cdot 10 = 20\\); \\(\\lVert a\\rVert = \\sqrt{2}\\), \\(\\lVert b\\rVert = \\sqrt{200}\\); значит $$\\cos\\theta = \\frac{20}{\\sqrt{2}\\cdot\\sqrt{200}} = \\frac{20}{\\sqrt{400}} = \\frac{20}{20} = 1{,}0.$$ Там, где евклид сказал \\(12{,}73\\) («за тридевять земель»), Сэр Косинус говорит \\(1{,}0\\) («одно и то же»). Он разглядел за громкостью смысл.',
          'И вот изящная расплата, которая делает векторный поиск практичным. Разверни квадрат расстояния: \\(\\lVert x - y\\rVert^2 = \\lVert x\\rVert^2 + \\lVert y\\rVert^2 - 2\\,(x\\cdot y)\\). Если сперва **нормировать** каждый вектор к единичной длине — вытолкнуть каждую точку на поверхность единичной сферы — это схлопывается в $$\\lVert x - y\\rVert^2 = 2\\,(1 - \\cos\\theta).$$ На сфере косинус, скалярное произведение и (отрицательное) евклидово расстояние ранжируют соседей в *точно том же порядке*. Поэтому реальные системы L2-нормируют свои эмбеддинги, а потом гоняют молниеносный индекс по скалярному произведению: они получают смысл косинуса на скорости скалярного произведения. Следующая фигура — разобранный пример на сфере; следи за числами, без шуток.',
        ],
      },
    },
    { id: 'climb-cosine', kind: 'scrolly', widget: 'cosine-sphere', data: 'l2-cosine' },
    { id: 'catch-curse-highd', kind: 'scrolly', widget: 'highd-histogram', data: 'l2-highd' },
    {
      id: 'catch-hubness-anisotropy', kind: 'prose',
      heading: { en: 'The Wraith has two more tricks', ru: 'У Призрака есть ещё два трюка' },
      img: 'L2/L2-61-wraith.png', imgPos: 'mascot',
      imgAlt: {
        en: 'The Curse-of-Dimensionality Wraith crushing a wide distance histogram down into a single thin spike.',
        ru: 'Призрак Проклятия Размерности сминает широкую гистограмму расстояний в один тонкий пик.',
      },
      imgCaption: {
        en: "Distance loses its contrast in high dimensions — and that's just the Wraith warming up. Hubness and anisotropy are his other two knives.",
        ru: 'В больших размерностях расстояние теряет контраст — и это лишь разминка Призрака. Хабность и анизотропия — два других его ножа.',
      },
      body: {
        en: [
          "The histogram you just watched is the Wraith's first trick: **distance concentration.** As the number of dimensions climbs from 2 to 1000, the spread of pairwise distances collapses toward a single spike — the nearest point becomes barely closer than the farthest, so \"nearest neighbour\" almost stops meaning anything, and a tiny perturbation flips which point wins. Real embeddings live in hundreds to thousands of dimensions, exactly where this bites. But the Wraith has two subtler tricks, and a working engineer has to recognise both.",
          "**Hubness.** In high dimensions the geometry quietly elects a few **hub** points that show up in almost *everyone's* nearest-neighbour list — not because they're truly relevant, but because of where they happen to sit — while other points (the anti-hubs) appear in nobody's. The symptom is unmistakable in a real system: the same handful of documents keep getting returned for unrelated queries. The fixes rescale the local geometry — mutual proximity, local/global scaling, mutual-kNN graphs — so a point can't be a universal neighbour by accident.",
          "**Anisotropy.** This one is about the embeddings themselves, not the dimension count. Raw representations out of a model like BERT or GPT-2 don't fill space evenly — they cram into a narrow **cone**, so even two unrelated tokens already sit at a small angle, and raw cosine reports everything as \"pretty similar.\" Your beautiful angle-measure gets inflated and loses its bite. The remedy is to push the cloud back toward isotropy — whitening, standardization, or, best of all, contrastive training that deliberately pulls synonyms together and shoves impostors apart. So take it from someone the Wraith has fooled before: never trust raw cosine on out-of-the-box hidden states until you've calibrated them.",
        ],
        ru: [
          'Гистограмма, которую ты только что смотрел, — первый трюк Призрака: **концентрация расстояний.** Когда число размерностей лезет с 2 до 1000, разброс попарных расстояний схлопывается к одному пику — ближайшая точка оказывается едва ли ближе самой дальней, так что «ближайший сосед» почти перестаёт что-либо значить, а крошечное возмущение меняет победителя. Реальные эмбеддинги живут в сотнях и тысячах размерностей — ровно там, где это и кусает. Но у Призрака есть два более тонких трюка, и работающий инженер обязан узнавать оба.',
          '**Хабность.** В высоких размерностях геометрия тихо избирает несколько точек-**хабов**, которые попадают в списки ближайших соседей почти у *всех* — не потому что они и правда релевантны, а из-за того, где они случайно сидят, — тогда как другие точки (анти-хабы) не попадают ни к кому. Симптом в реальной системе ни с чем не спутать: одна и та же горстка документов возвращается на не связанные между собой запросы. Лечат это пересчётом локальной геометрии — взаимная близость, локальное/глобальное масштабирование, графы взаимных kNN — чтобы точка не становилась универсальным соседом по случайности.',
          '**Анизотропия.** Этот трюк уже про сами эмбеддинги, а не про число размерностей. Сырые представления из модели вроде BERT или GPT-2 не заполняют пространство равномерно — они жмутся в узкий **конус**, так что даже два не связанных токена уже стоят под малым углом, и сырой косинус докладывает обо всём как о «довольно похожем». Твоя прекрасная мера угла раздувается и теряет хватку. Лекарство — толкнуть облако обратно к изотропии: отбеливание, стандартизация или, лучше всего, контрастивное обучение, которое нарочно стягивает синонимы и расталкивает самозванцев. И поверь тому, кого Призрак уже однажды провёл: никогда не доверяй сырому косинусу на «из коробки» скрытых состояниях, пока их не откалибруешь.',
        ],
      },
    },
    {
      id: 'payoff-knights-win', kind: 'prose',
      heading: { en: 'The Knights hold the sphere', ru: 'Рыцари удерживают сферу' },
      img: 'L2/L2-70-first-contact-callback.png',
      imgAlt: {
        en: 'Serega and the alien shake hands; the cloud of question marks is replaced by one shared vector arrow.',
        ru: 'Серёга и инопланетянин жмут руки; облако вопросительных знаков заменено одной общей стрелкой-вектором.',
      },
      imgCaption: {
        en: 'Contact. The machine can finally tell when two meanings are close — First Contact resolved.',
        ru: 'Контакт. Машина наконец может сказать, когда два смысла близки — Первый контакт установлен.',
      },
      body: {
        en: [
          "So tally the mission. We turned the alien's raw text into countable units — the Tokenosaurus' sub-words, learned by BPE merges, bounded against Heaps' endless tail. Then we built the first Instrument: cosine, which measures meaning by *direction*, immune to the loudness that fooled Euclidean. And when the Curse-of-Dimensionality Wraith tried to melt every distance into mush, the trick held — because on the unit sphere, where only direction survives, the Wraith's concentration loses its grip and Sir Cosine still stands. The machine can finally judge when two meanings are close. **First Contact established.**",
          "But a question is already glowing on the console. Those vectors — where do their *directions* actually come from? So far the coordinates were just word counts, and counts don't know that *couch* and *sofa* mean the same thing; the Knights can compare directions beautifully, but only if something first points the words the right way. That's the next chapter. We're going to learn where meaning gets its coordinates — where *couch* and *sofa* finally land next to each other on the map: **embeddings.**",
        ],
        ru: [
          'Подведём итог миссии. Мы превратили сырой текст инопланетянина в счётные единицы — подслова Токенозавра, выученные слияниями BPE, ограниченные против бесконечного хвоста Хипса. Потом построили первый Инструмент: косинус, который меряет смысл по *направлению* и невосприимчив к громкости, обманувшей евклид. А когда Призрак Проклятия Размерности попытался расплавить всякое расстояние в кашу, фокус устоял — потому что на единичной сфере, где выживает только направление, концентрация Призрака теряет хватку, а Сэр Косинус по-прежнему стоит. Машина наконец может судить, когда два смысла близки. **Первый контакт установлен.**',
          'Но на консоли уже мигает вопрос. Эти векторы — откуда вообще берутся их *направления*? Пока что координатами были просто счётчики слов, а счётчики не знают, что *couch* и *sofa* значат одно и то же; Рыцари прекрасно сравнивают направления, но лишь если что-то сперва развернёт слова в правильную сторону. Это следующая глава. Мы узнаем, где смысл получает свои координаты — где *couch* и *sofa* наконец оказываются рядом на карте: **эмбеддинги.**',
        ],
      },
    },
  ],
};
