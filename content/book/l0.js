// content/book/l0.js — "The Briefing" (L0), per narrative/L0.md. The meta-chapter: introduces the
// galaxy/spine and the rules. Lighter than the others. EN canonical + RU; TT falls back.

export default {
  id: '00',
  catchphrase: 'The Briefing',
  beats: [
    {
      id: 'hook-briefing', kind: 'prose',
      heading: { en: 'The Briefing', ru: 'Инструктаж' },
      img: 'L0/L0-01-briefing.png', imgPos: 'hero',
      imgAlt: {
        en: 'Captain Serega at a spaceship console, pointing through a viewport at the Galaxy of Information whose stars are made of 1s, 0s and documents.',
        ru: 'Капитан Серёга за пультом корабля показывает в иллюминатор на Галактику Информации, чьи звёзды сделаны из единиц, нулей и документов.',
      },
      imgCaption: {
        en: 'The mission is search: one flight across a galaxy whose stars are documents.',
        ru: 'Миссия — поиск: один перелёт через галактику, где звёзды — это документы.',
      },
      body: {
        en: [
          "I'm Serega, and I'll be your guide for the next seven weeks. Not your captain — by the end, that's you. Think of me as the slightly-too-enthusiastic co-pilot who's flown this route before and knows where the turbulence is. A word on the cast: I'm the doodle in the embroidered cap who narrates the story. The human actually teaching this course, grading your work, and answering your emails is Albert Nasybullin — his bio and contact live on the Syllabus, and I never speak for him. I'm the mascot; he's the lecturer. Two different jobs.",
          "We're about to cross the Galaxy of Information: an endless ocean of documents, queries, signals and noise, and somewhere in it the one answer a user actually wants. Picture a single user typing four words into a box, hoping that out of a billion candidate documents the machine hands back the one that helps. That gap — between a vague need in someone's head and the right record buried in the dark — is the whole problem we spend seven weeks learning to close.",
          "Our job is to build the Ship that finds it — and keeps finding it. Not a one-off lucky hit in a notebook, but a machine that finds the right thing for every user, every query, every day, and doesn't fall over when the corpus grows or the questions get weird. We build that Ship one part per lecture: this week the sensors and archives, next the instruments that measure closeness, then the bridge that ranks and serves answers at scale. By the final defense, I step back and hand you the helm — you take the Ship out alone.",
          "Today is the briefing, so we don't build anything yet. We lay out the galaxy you're about to cross, the three territories that make up the map, the schedule and the rules, and how not to crash. Then we fly.",
        ],
        ru: [
          'Я Серёга, и я буду вашим гидом следующие семь недель. Не капитаном — к концу курса капитан это вы. Считайте меня чересчур воодушевлённым вторым пилотом, который уже летал этим маршрутом и знает, где трясёт. Пара слов о составе экипажа: я — дудл в вышитой тюбетейке, который рассказывает историю. Человек, который на самом деле ведёт этот курс, проверяет ваши работы и отвечает на письма, — это Альберт Насыбуллин; его биография и контакты на странице Программы, и я никогда не говорю за него. Я — маскот, он — преподаватель. Это две разные роли.',
          'Нам предстоит пересечь Галактику Информации: бесконечный океан документов, запросов, сигналов и шума, и где-то в нём — тот единственный ответ, который на самом деле нужен пользователю. Представьте одного человека, который вбивает четыре слова в строку поиска и надеется, что из миллиарда документов-кандидатов машина вернёт ровно тот, что поможет. Этот разрыв — между смутной потребностью в чьей-то голове и нужной записью, зарытой в темноте, — и есть та задача, закрывать которую мы учимся семь недель.',
          'Наша задача — построить Корабль, который его найдёт. И будет находить дальше. Не разовое удачное попадание в ноутбуке, а машину, которая находит нужное для каждого пользователя, для каждого запроса, каждый день — и не падает, когда корпус растёт, а вопросы становятся странными. Этот Корабль мы собираем по одной детали за лекцию: на этой неделе — сенсоры и архивы, дальше — инструменты, измеряющие близость, затем — мостик, который ранжирует и выдаёт ответы в масштабе. К финальной защите я отступаю в сторону и передаю вам штурвал — Корабль вы уводите в путь сами.',
          'Сегодня — инструктаж, так что мы пока ничего не строим. Мы раскладываем галактику, которую вам предстоит пересечь, три территории, из которых состоит карта, расписание и правила, и как не разбиться. А потом летим.',
        ],
      },
    },
    {
      id: 'problem-everywhere', kind: 'prose',
      heading: { en: 'Search is everywhere', ru: 'Поиск повсюду' },
      img: 'L0/L0-06-quote-trail.png', imgPos: 'scene',
      imgAlt: {
        en: 'A winding trail from a stick figure typing keywords, through signposts marked meaning and vectors, ending at a glowing RAG database.',
        ru: 'Извилистая тропа от фигурки, набирающей ключевые слова, через указатели «смысл» и «векторы», к светящейся базе RAG.',
      },
      imgCaption: {
        en: 'Every costume search wears, end to end: keywords → meaning → vectors → RAG. We walk it left to right.',
        ru: 'Все костюмы поиска по порядку: ключевые слова → смысл → векторы → RAG. Идём слева направо.',
      },
      body: {
        en: [
          "Why care? Because search is the quiet engine under almost everything now. Type into Google and a retrieval system ranks a trillion pages in a quarter of a second. Open your phone's photos and search “dog on a beach” — that's retrieval over pixels, not text. Your feed, your shopping recommendations, the autocomplete in your code editor, the support bot that finds the right help article: all of them are search wearing different costumes. Once you learn to see it, you can't stop spotting it.",
          "The newest costume is the one keeping large language models honest. Ask a chatbot a factual question and, left alone, it will sometimes answer with total confidence and zero correctness — it will tell you a horse has eight legs and not blink. The fix is to retrieve real evidence first and let the model answer from that, instead of from its hazy memory. That pattern — retrieve, then generate — is called [RAG](https://arxiv.org/abs/2005.11401), and the entire back half of this course builds toward it. A language model without retrieval is a brilliant student who never opens a book; retrieval is the library card.",
          "Here's the catch that makes all of this hard, and it's worth feeling viscerally. A user doesn't hand you their actual need — a rich, fuzzy thing in their head. They hand you a query: a few keywords squeezed through a tiny funnel, most of the meaning lost on the way down. “python” — the snake, or the language? “jaguar” — the cat, the car, or the football team? Your job is to reconstruct the need from the crumbs of the query and find the matching record. Get search right and a billion documents feel like a tidy bookshelf you can pull from in a heartbeat. Get it wrong and the right answer might as well not exist — it's there, it's just unreachable.",
        ],
        ru: [
          'Зачем это нужно? Потому что поиск сегодня — тихий двигатель почти всего. Набираете запрос в Google — и система поиска ранжирует триллион страниц за четверть секунды. Открываете фото в телефоне и ищете «собака на пляже» — это поиск по пикселям, а не по тексту. Ваша лента, товарные рекомендации, автодополнение в редакторе кода, бот поддержки, находящий нужную статью помощи: всё это поиск в разных костюмах. Стоит научиться его замечать — и вы уже не сможете перестать.',
          'Самый свежий костюм — тот, что держит большие языковые модели честными. Задайте чат-боту фактический вопрос — и, оставленный сам по себе, он порой ответит с полной уверенностью и нулевой правильностью: скажет вам, что у лошади восемь ног, и глазом не моргнёт. Лекарство — сначала достать реальные источники и дать модели отвечать по ним, а не по своей мутной памяти. Этот приём — сначала достать, потом сгенерировать — называется [RAG](https://arxiv.org/abs/2005.11401), и вся вторая половина курса ведёт к нему. Языковая модель без поиска — это блестящий студент, который ни разу не открыл книгу; поиск — это читательский билет.',
          'А вот и подвох, который делает всё это сложным, и его стоит прочувствовать нутром. Пользователь не отдаёт вам свою настоящую потребность — богатую, размытую штуку у себя в голове. Он отдаёт запрос: пару ключевых слов, продавленных через крошечную воронку, где по пути теряется бо́льшая часть смысла. «python» — это змея или язык программирования? «jaguar» — кошка, машина или футбольный клуб? Ваша задача — восстановить потребность по крошкам запроса и найти подходящую запись. Сделай поиск правильно — и миллиард документов ощущается как аккуратная книжная полка, с которой достаёшь нужное в одно мгновение. Сделай неправильно — и нужный ответ как будто не существует: он есть, просто до него не дотянуться.',
        ],
      },
    },
    {
      id: 'stakes-scale', kind: 'prose',
      heading: { en: 'The scale of the thing', ru: 'Масштаб задачи' },
      img: '_char/serega-cameo-puzzled.png', imgPos: 'mascot',
      imgAlt: {
        en: 'Serega scratching his head, puzzled by the sheer size of the problem.',
        ru: 'Серёга чешет затылок, озадаченный самим размером задачи.',
      },
      imgCaption: {
        en: 'Too much data, too little time — that tension is the whole course in one breath.',
        ru: 'Слишком много данных, слишком мало времени — это напряжение и есть весь курс в одном вдохе.',
      },
      body: {
        en: [
          "Two numbers to set the mood. The web is around \\(10^{12}\\) pages — a trillion. And every single day, roughly 15% of queries are ones the engine has never seen before: brand-new phrasings, fresh news, typos no one anticipated. Sit with that for a second. You cannot pre-compute the answers, because a meaningful fraction of tomorrow's questions don't exist yet. And you cannot read everything when the user hits enter, because reading a trillion pages takes far longer than the quarter-second a user will wait before deciding your product is broken.",
          "So the naive plans both die immediately. Plan A — “answer every query in advance” — dies on the 15% you've never seen. Plan B — “scan the whole corpus on each query” — dies on the clock: even at a microsecond per document, a trillion documents is over a week of compute for one search. Neither brute force works. That's not a footnote; that's the reason this field exists.",
          "That tension — too much data, too little time — is the whole course in one sentence. Almost everything we build is a clever way to dodge it: indexes that let you jump straight to the few relevant documents without touching the rest; cheap models that quickly throw out the obvious junk so expensive models only judge a handful; approximate methods that trade a sliver of accuracy for a thousandfold speedup. Keep that trade-off in your pocket. Every technique in this course is, at heart, a negotiation between how good the answer is and how fast and cheaply you can get it.",
        ],
        ru: [
          'Два числа для настроения. Веб — это около \\(10^{12}\\) страниц, триллион. И каждый день примерно 15% запросов — те, которых движок никогда раньше не видел: новые формулировки, свежие новости, опечатки, которых никто не предвидел. Задержитесь на этом на секунду. Ответы не предвычислить, потому что заметная доля завтрашних вопросов ещё попросту не существует. И нельзя прочитать всё в момент, когда пользователь нажимает Enter, потому что прочитать триллион страниц куда дольше, чем те четверть секунды, что пользователь готов ждать, прежде чем решит, что ваш продукт сломан.',
          'Поэтому оба наивных плана умирают сразу. План А — «ответить на каждый запрос заранее» — гибнет на тех 15%, которых вы никогда не видели. План Б — «сканировать весь корпус на каждый запрос» — гибнет по часам: даже по микросекунде на документ триллион документов — это больше недели вычислений на один поиск. Грубая сила не работает ни так, ни эдак. Это не сноска — это и есть причина, по которой существует вся область.',
          'Это напряжение — слишком много данных, слишком мало времени — и есть весь курс в одном предложении. Почти всё, что мы строим, — это хитрый способ его обойти: индексы, позволяющие прыгнуть прямо к нескольким релевантным документам, не трогая остальное; дешёвые модели, быстро отсеивающие очевидный мусор, чтобы дорогие судили лишь горстку; приближённые методы, меняющие крупицу точности на тысячекратное ускорение. Держите этот компромисс в кармане. Любая техника в этом курсе по сути — переговоры между тем, насколько хорош ответ, и тем, как быстро и дёшево вы можете его получить.',
        ],
      },
    },
    { id: 'turn-the-map', kind: 'scrolly', widget: 'course-map' },
    {
      id: 'climb-logistics', kind: 'prose',
      heading: { en: 'The flight plan', ru: 'План полёта' },
      img: 'L0/L0-08-coursearc.png', imgPos: 'scene',
      imgAlt: {
        en: 'Serega hopping across six stepping stones: classical IR, embeddings, neural retrieval, vector databases, RAG, and agentic.',
        ru: 'Серёга перепрыгивает по шести камням-ступеням: классический IR, эмбеддинги, нейропоиск, векторные БД, RAG и агенты.',
      },
      imgCaption: {
        en: "Each lecture is one stone. Skip one and you're standing on water — the next stone assumes the last.",
        ru: 'Каждая лекция — один камень. Пропустишь — окажешься на воде: следующий камень опирается на предыдущий.',
      },
      body: {
        en: [
          "Seven weeks, and the climb is left to right. We start classical: TF-IDF and [BM25](https://doi.org/10.1007/978-1-4471-2099-5_24), inverted indexes, and the ranking metrics ([nDCG](https://doi.org/10.1145/582415.582418), MAP, MRR, \\(\\text{Recall@}k\\)) you'll use to tell a good system from a bad one. This is the baseline and the vocabulary — skip it and the neural stuff is just magic words. Then we go neural: word and contextual embeddings that turn meaning into coordinates, [transformers and attention](https://arxiv.org/abs/1706.03762), and bi- and cross-encoders that learn what's relevant instead of just counting matched words. Then we make it survive scale: approximate nearest-neighbor search ([HNSW](https://arxiv.org/abs/1603.09320), IVF, [PQ](https://doi.org/10.1109/TPAMI.2010.57)), [FAISS](https://arxiv.org/abs/1702.08734), vector databases, and the unglamorous production work — quantization, caching, latency — that decides whether your system is usable. Finally we make it answer: [RAG](https://arxiv.org/abs/2005.11401), its evaluation (which is harder than it sounds — how do you grade a confident-sounding answer?), and agentic loops that critique and correct themselves.",
          "The week-by-week rhythm is simple. Wednesdays we cover ground in lectures; Fridays we get our hands dirty in labs, building the thing we just discussed. The three assignments chain together into one growing pipeline: A1 is classical IR and metrics (implement BM25, compute nDCG/MAP/MRR, analyze your tokenization choices); A2 is two-stage neural retrieval and learning-to-rank (bi-encoder then cross-encoder, hard-negative mining); A3 is a full RAG system with evaluation and an agentic loop. Each one assumes the last. Fall behind on A1 and A3 will feel like a foreign language.",
          "Now the part to write down. Grading is split 30% continuous and 70% summative. The continuous 30% is three assignments and three labs, 5% each. The summative 70% is the Midterm (20%), the Final (30%), and the Project Defense (20%) — the defense is where you show the system you actually built and argue your design choices with metrics, not vibes. Letter grades: A is \\((90, 100]\\), B is \\((70, 90]\\), C is \\([50, 70]\\), D is \\([0, 50]\\). The exact dates live on the Syllabus and Schedule pages — bookmark them, because two rules are absolute and I'll say them once: no late submissions (a missed deadline is a zero, not a negotiation), and cheating is a zero-tolerance black hole. Everything else I'll help you through; those two I won't.",
        ],
        ru: [
          'Семь недель, и подъём идёт слева направо. Начинаем с классики: TF-IDF и [BM25](https://doi.org/10.1007/978-1-4471-2099-5_24), инвертированные индексы и метрики ранжирования ([nDCG](https://doi.org/10.1145/582415.582418), MAP, MRR, \\(\\text{Recall@}k\\)), которыми вы будете отличать хорошую систему от плохой. Это база и словарь — пропустите их, и нейросетевая часть превратится в волшебные слова. Потом уходим в нейросети: словные и контекстные эмбеддинги, превращающие смысл в координаты, [трансформеры и внимание](https://arxiv.org/abs/1706.03762), би- и кросс-энкодеры, которые учатся релевантности, а не просто считают совпавшие слова. Потом учим это выживать в масштабе: приближённый поиск ближайших соседей ([HNSW](https://arxiv.org/abs/1603.09320), IVF, [PQ](https://doi.org/10.1109/TPAMI.2010.57)), [FAISS](https://arxiv.org/abs/1702.08734), векторные базы и негламурную продакшн-работу — квантизацию, кэширование, латентность, — которая и решает, можно ли вашей системой пользоваться. Наконец, учим это отвечать: [RAG](https://arxiv.org/abs/2005.11401), его оценку (а она сложнее, чем кажется — как поставить балл уверенно звучащему ответу?) и агентные циклы, которые сами себя критикуют и исправляют.',
          'Ритм по неделям прост. По средам проходим материал на лекциях; по пятницам пачкаем руки в лабах, собирая то, что только что обсудили. Три задания сцепляются в один растущий конвейер: A1 — классический IR и метрики (реализовать BM25, посчитать nDCG/MAP/MRR, разобрать свои решения по токенизации); A2 — двухстадийный нейропоиск и learning-to-rank (би-энкодер, затем кросс-энкодер, добыча трудных негативов); A3 — полноценная система RAG с оценкой и агентным циклом. Каждое опирается на предыдущее. Отстанете на A1 — и A3 покажется иностранным языком.',
          'А теперь то, что стоит записать. Оценивание делится на 30% накопительных и 70% итоговых. Накопительные 30% — это три задания и три лабы, по 5% каждое. Итоговые 70% — промежуточный экзамен (20%), финал (30%) и защита проекта (20%); защита — это где вы показываете систему, которую реально построили, и отстаиваете свои решения метриками, а не ощущениями. Буквенные оценки: A — это \\((90, 100]\\), B — \\((70, 90]\\), C — \\([50, 70]\\), D — \\([0, 50]\\). Точные даты — на страницах Программы и Расписания, добавьте в закладки, потому что два правила абсолютны, и я скажу их один раз: поздние сдачи не принимаются (пропущенный дедлайн — это ноль, а не предмет торга), а списывание — чёрная дыра с нулевой терпимостью. Со всем остальным я помогу; с этими двумя — нет.',
        ],
      },
    },
    {
      id: 'catch-how-to-fail', kind: 'prose',
      heading: { en: 'How to sink (so you don’t)', ru: 'Как утонуть (чтобы не утонуть)' },
      body: {
        en: [
          "Most people who struggle here do one of two things, and I want to name both so you can dodge them. The first is watching lectures like TV — passive, pleasant, and useless. The slides slide by, everything makes sense in the moment, nothing sticks, and a week later you couldn't rederive a single formula. The cure is to do the work with your hands while it's in front of you: pause, compute the BM25 score yourself on the toy example, predict what the next line of code does before you run it, run the lab instead of reading it. Understanding feels like reading; it is actually doing.",
          "The second is cramming the night before an exam. This fails harder here than in most courses, and there's a specific reason: a search system isn't a fact you memorize, it's a machine you understand. You can't bluff your way through “why does the cross-encoder rerank only the top-k and not the whole corpus?” by having read the slide once at 2am. Either you understand the funnel — cheap-and-broad first, expensive-and-precise last — or you don't, and an exam (and the defense, and any real job) will find out instantly. The knowledge compounds week over week; trying to back-load it into one night is like trying to build the whole Ship the morning of the launch.",
          "Both traps have the same antidote, and it's a single change in the order of your questions. Before you ask “how does this work?”, ask “what problem does this solve?” Every technique in this course is an answer to a specific pain — BM25 answers “how do I rank by relevance cheaply?”, embeddings answer “how do I match couch to sofa?”, ANN answers “how do I search a billion vectors in milliseconds?”. Hold the problem in your head first and the mechanism stops being arbitrary machinery and becomes the obvious, almost inevitable fix. That reframe is worth more than any single algorithm I'll teach you.",
        ],
        ru: [
          'Большинство тех, кому здесь тяжело, делают одно из двух, и я хочу назвать оба, чтобы вы могли их обойти. Первое — смотреть лекции как сериал: пассивно, приятно и бесполезно. Слайды проплывают, в моменте всё понятно, ничего не оседает, а через неделю вы не выведете заново ни одной формулы. Лекарство — делать работу руками, пока она перед глазами: остановитесь, посчитайте BM25 сами на игрушечном примере, предскажите, что сделает следующая строка кода, прежде чем запустить её, запустите лабу, а не прочитайте. Понимание ощущается как чтение; на деле это действие.',
          'Второе — зубрить в ночь перед экзаменом. Здесь это проваливается жёстче, чем на большинстве курсов, и тому есть конкретная причина: поисковая система — это не факт для запоминания, а машина для понимания. Вы не выкрутитесь на вопросе «почему кросс-энкодер переранжирует только топ-k, а не весь корпус?», один раз прочитав слайд в два часа ночи. Либо вы понимаете воронку — сначала дёшево и широко, в конце дорого и точно, — либо нет, и экзамен (и защита, и любая реальная работа) выяснит это мгновенно. Знание накапливается из недели в неделю; пытаться затолкать его в одну ночь — всё равно что строить весь Корабль утром в день старта.',
          'У обеих ловушек одно противоядие, и это всего одна перестановка в порядке ваших вопросов. Прежде чем спросить «как это работает?», спросите «какую проблему это решает?». Каждая техника в этом курсе — ответ на конкретную боль: BM25 отвечает на «как дёшево ранжировать по релевантности?», эмбеддинги — на «как сопоставить диван и кушетку?», ANN — на «как искать по миллиарду векторов за миллисекунды?». Держите проблему в голове первой — и механизм перестаёт быть произвольной машинерией и становится очевидным, почти неизбежным решением. Этот разворот ценнее любого отдельного алгоритма, которому я вас научу.',
        ],
      },
    },
    {
      id: 'payoff-sendoff', kind: 'prose',
      heading: { en: 'Buckle up', ru: 'Пристегнитесь' },
      img: 'L0/L0-20-sendoff.png', imgPos: 'scene',
      imgAlt: {
        en: 'Captain Serega raising a torch over the Galaxy of Information in a send-off; the course begins.',
        ru: 'Капитан Серёга поднимает факел над Галактикой Информации в напутствии; курс начинается.',
      },
      imgCaption: {
        en: 'The captain’s send-off — coordinates set, hatch open. See you out in the galaxy.',
        ru: 'Напутствие капитана — координаты заданы, люк открыт. Увидимся там, в галактике.',
      },
      body: {
        en: [
          "That's the briefing. The route is set: Get Data, Measure, Rank, on repeat, getting deeper each week. You'll cross all three territories, build one part of the Ship at a time, and by the Project Defense you'll do the thing I keep promising — you'll take the helm and fly it yourself, with no co-pilot leaning over your shoulder.",
          "I promise the journey is genuinely fun — and I fully intend to make your life a little miserable along the way, in the way a good coach does. “Miserable” here means stretched, not abandoned: three labs, three assignments, two exams and a defense, all on hard deadlines, with office hours and these materials there to pull you through when it bites. The misery is the training; the find at the end is the point.",
          "So buckle up, crew. First stop: how do we even find one record in a sea of a billion — and then build the machine that keeps finding it forever? See you in The Lost Record.",
        ],
        ru: [
          'Вот и весь инструктаж. Маршрут проложен: Get Data, Measure, Rank, по кругу, всё глубже с каждой неделей. Вы пересечёте все три территории, соберёте Корабль по одной детали за раз, и к защите проекта сделаете то, что я всё обещаю, — встанете к штурвалу и поведёте его сами, без второго пилота за плечом.',
          'Обещаю, путешествие будет действительно весёлым — и я твёрдо намерен слегка усложнить вам жизнь по пути, как делает хороший тренер. «Усложнить» здесь значит растянуть, а не бросить: три лабы, три задания, два экзамена и защита, все на жёстких дедлайнах, — а часы консультаций и эти материалы рядом, чтобы вытащить вас, когда прижмёт. Тяжесть — это тренировка; находка в конце — это смысл.',
          'Так что пристегнитесь, экипаж. Первая остановка: как вообще найти одну запись в море из миллиарда — и затем построить машину, которая будет находить её вечно? Увидимся в «Потерянной записи».',
        ],
      },
    },
  ],
};
