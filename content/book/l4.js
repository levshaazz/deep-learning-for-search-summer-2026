// content/book/l4.js — "The Proving Grounds" (L4): Ranking Metrics + Significance + Online Eval.
// Beats match narrative/L4.md. The five offline metrics are one stepped ranking-metrics figure on
// L3's real BM25 ranking; significance & online are prose beats (no new widgets).
// EN canonical + RU; TT falls back. NARRATIVE_METHOD applies; Goodhart the Trickster returns.

export default {
  id: '04',
  catchphrase: 'The Proving Grounds',
  beats: [
    {
      id: 'hook-proving', kind: 'prose',
      heading: { en: 'The Proving Grounds', ru: 'Полигон' },
      img: 'L4/L4-00-proving-grounds.png',
      imgAlt: {
        en: 'Serega at a proving-grounds scoreboard where two search ships compete; you measure, you don\'t guess.',
        ru: 'Серёга у табло Полигона, где соревнуются два поисковых корабля; ты измеряешь, а не угадываешь.',
      },
      imgCaption: {
        en: 'The Proving Grounds: evaluation is where two search systems compete on a scoreboard — you measure, you don\'t guess.',
        ru: 'Полигон: оценивание — арена, где две поисковые системы соревнуются на табло, — ты измеряешь, а не угадываешь.',
      },
      imgPos: 'hero',
      body: {
        en: [
          "I'm Serega, and I've built two search systems. Both look fine. I ran a few queries through each, the results looked reasonable, I nodded sagely. One of them is better than the other. Which one? I genuinely cannot tell you, and \"looks good to me\" is precisely how you ship garbage with total confidence.",
          "Here's the trap. Every chapter from here on is going to make a *claim* — neural beats BM25, reranking helps, this loss is better than that one — and every one of those claims is hot air until I can put a number on it. Before we touch a single neural network, we need an honest scoreboard: a way to turn \"this ranking feels better\" into a measurement I'd bet money on. Welcome to the Proving Grounds, where every Ship gets tested and opinions don't get a vote.",
        ],
        ru: [
          'Я Серёга, и я построил две поисковые системы. Обе выглядят прилично. Я прогнал через каждую пару запросов, результаты показались разумными, я глубокомысленно кивнул. Одна из них лучше другой. Какая? Честно — не скажу, а «мне кажется, норм» — это ровно тот способ, которым с полной уверенностью выкатывают мусор.',
          'Вот ловушка. Каждая следующая глава будет делать *утверждение* — нейронка обходит BM25, реранкинг помогает, этот лосс лучше того — и любое из этих утверждений пустой звук, пока я не поставлю ему число. Прежде чем тронуть хоть одну нейросеть, нам нужна честная доска результатов: способ превратить «это ранжирование ощущается лучше» в измерение, на которое я бы поставил деньги. Добро пожаловать на Полигон, где каждый Корабль проходит испытание, а у мнений нет права голоса.',
        ],
      },
    },
    {
      id: 'problem-eyeballing', kind: 'prose',
      img: 'L4/L4-01-cant-eyeball.png',
      imgAlt: {
        en: 'Serega overwhelmed by a wall of millions of queries — intuition fails at scale, you need metrics over judged data.',
        ru: 'Серёга, погребённый под стеной из миллионов запросов, — интуиция отказывает на масштабе, нужны метрики по размеченным данным.',
      },
      imgCaption: {
        en: 'You can\'t eyeball quality at scale: with millions of queries, intuition fails — you need metrics computed over judged data.',
        ru: 'Качество на масштабе на глаз не оценить: на миллионах запросов интуиция отказывает — нужны метрики, посчитанные по размеченным данным.',
      },
      body: {
        en: [
          "You can eyeball ten results. You can squint at a hundred. You cannot eyeball ten thousand queries, twice a day, on every single code change — and that's the real workload, because search teams ship constantly and each ship can quietly break something. Eyeballing doesn't scale, and worse, it doesn't catch the *small* regressions: the change that makes results 2% worse on average is invisible to a human and catastrophic to a business.",
          "So we need a metric — a number per ranking. But a metric is useless without something to compare against: you can't grade an exam without an answer key. That answer key is called **ground truth**, and for search it means knowing, for some set of queries, which documents are actually relevant. Get that, and a vague feeling becomes arithmetic. The whole rest of this chapter is two questions: where does the answer key come from, and how do we turn it into a fair score?",
        ],
        ru: [
          'Десять результатов можно оценить на глаз. На сотню можно прищуриться. Но десять тысяч запросов — дважды в день, на каждое изменение кода — на глаз не оценишь, а это и есть реальная нагрузка, потому что поисковые команды катят релизы постоянно, и каждый может тихо что-то сломать. Глаз не масштабируется и, хуже того, не ловит *мелкие* регрессии: изменение, делающее результаты в среднем на 2% хуже, для человека невидимо, а для бизнеса катастрофично.',
          'Значит, нужна метрика — число на ранжирование. Но метрика бесполезна без того, с чем сравнивать: экзамен не оценить без ключа с ответами. Этот ключ называется **истиной** (ground truth), и для поиска он значит — знать для какого-то набора запросов, какие документы действительно релевантны. Получи его — и смутное ощущение станет арифметикой. Весь остаток главы — два вопроса: откуда берётся ключ с ответами и как превратить его в честную оценку.',
        ],
      },
    },
    {
      id: 'turn-relevance', kind: 'prose',
      heading: { en: 'Ground truth', ru: 'Истина' },
      img: 'L4/L4-02-qrels-referee.png',
      imgAlt: {
        en: 'A human assessor as referee stamping each query-document pair relevant or not — the qrels every metric is scored against.',
        ru: 'Человек-асессор в роли судьи ставит штамп «релевантно / нет» на каждую пару запрос–документ — это qrels, относительно которых считается любая метрика.',
      },
      imgCaption: {
        en: 'qrels = the referee: a human assessor stamps each result relevant or not — the ground truth every metric is measured against.',
        ru: 'qrels = судья: человек-асессор ставит штамп «релевантно / нет» на каждый результат — это эталон, относительно которого считается любая метрика.',
      },
      body: {
        en: [
          "The answer key has a name in IR: **relevance judgments**, or *qrels* for short. At bottom a qrel is the simplest possible thing — a label on a query-document pair: this document is relevant to this query, or it isn't. Pile up enough of those labels and you can grade any ranking any system produces, because you finally know what \"right\" looks like.",
          "Real test collections get these labels from human annotators, slowly and expensively, which is a whole problem we'll dig into next. For our worked example we'll borrow a clean shortcut we set up earlier: our 20-Newsgroups documents already carry category labels from when they were posted. So for the query intent \"space\", we'll simply call a document relevant exactly when it comes from the space category. It's a stand-in, not a real human judgment — but it's consistent and reproducible, and it lets every ranking we built in the last chapter finally get a grade.",
        ],
        ru: [
          'У ключа с ответами в IR есть имя: **суждения о релевантности**, или *qrels* для краткости. По сути qrel — это простейшая вещь: метка на пару запрос–документ: этот документ релевантен этому запросу или нет. Накопи достаточно таких меток — и сможешь оценить любое ранжирование любой системы, потому что наконец знаешь, как выглядит «правильно».',
          'Настоящие тестовые коллекции получают эти метки от людей-разметчиков, медленно и дорого, — целая проблема, в которую мы дальше копнём. Для нашего разобранного примера возьмём чистый приём из прошлого: документы 20 Newsgroups уже несут метки категорий с момента публикации. Поэтому для запроса «space» назовём документ релевантным ровно тогда, когда он из космической категории. Это заменитель, а не настоящее человеческое суждение, — но он непротиворечив и воспроизводим, и он наконец позволяет оценить каждое ранжирование, что мы построили в прошлой главе.',
        ],
      },
    },
    {
      id: 'turn-judgments-deep', kind: 'prose',
      heading: { en: 'Where the answer key comes from', ru: 'Откуда берётся ключ с ответами' },
      body: {
        en: [
          "Borrowing category labels is a teaching trick. Building a real answer key is one of the hardest, least glamorous jobs in the field, and it's worth understanding because every number downstream inherits its sins. First decision: how *fine-grained* are the labels? The simplest is **binary** — relevant or not. But that throws away an obvious truth: some relevant documents are *more* relevant. So serious collections use **graded** relevance, often a 0-to-4 scale from \"off-topic\" through \"marginally useful\" up to \"perfect answer.\" Binary is easy to collect and easy to compute; graded captures what users actually feel. We'll use both.",
          "Second problem, and it's a brutal one: you cannot judge every document. A real collection has millions of them and a query has, what, a few dozen genuinely relevant? Paying humans to label millions of obvious non-matches per query is impossible. The trick the field landed on is **pooling**, born from the **Cranfield** experiments in the 1960s and industrialised by **TREC**: run many different systems, take the top-k results from each, pool them together, and only have humans judge that pool. The bet is that between all those systems, almost every relevant document surfaces *somewhere* in the top-k, so the pool catches what matters without judging the ocean.",
          "It's a good bet, but it leaves a sharp edge. What about a relevant document that *no* system ranked highly, so it never entered the pool? It's **unjudged** — and here's the quiet bias that trips up newcomers: most metrics treat \"unjudged\" as \"not relevant.\" Which means a genuinely new system that surfaces good documents the old systems missed can get *punished* by an old pool, because its discoveries score as zeros. Metrics like bpref were invented specifically to soften this. The lesson: a test collection isn't neutral ground. It quietly encodes whatever the systems that built its pool already believed.",
        ],
        ru: [
          'Заимствовать метки категорий — учебный приём. Построить настоящий ключ с ответами — одна из самых тяжёлых и негламурных работ в области, и её стоит понимать, потому что каждое число ниже по течению наследует её грехи. Первое решение: насколько *детальны* метки? Простейшее — **бинарные**: релевантен или нет. Но это выбрасывает очевидную истину: одни релевантные документы *более* релевантны. Поэтому серьёзные коллекции используют **градуированную** релевантность, часто шкалу от 0 до 4 — от «не по теме» через «слегка полезно» до «идеальный ответ». Бинарную легко собирать и считать; градуированная схватывает то, что пользователь реально чувствует. Мы возьмём обе.',
          'Вторая проблема, и она жестокая: оценить каждый документ нельзя. В реальной коллекции их миллионы, а у запроса — ну, пара десятков по-настоящему релевантных? Платить людям за разметку миллионов очевидных несовпадений на запрос невозможно. Приём, на котором остановилась область, — **пулинг**, рождённый в экспериментах **Крэнфилда** в 1960-х и поставленный на поток **TREC**: прогони много разных систем, возьми топ-k каждой, слей их в пул и дай людям оценить только этот пул. Ставка в том, что среди всех систем почти каждый релевантный документ всплывёт *где-то* в топ-k, так что пул ловит важное, не оценивая весь океан.',
          'Ставка хорошая, но оставляет острый край. А как же релевантный документ, который *ни одна* система не подняла высоко, так что он не попал в пул? Он **неоценён** — и вот тихий перекос, на котором спотыкаются новички: большинство метрик считают «неоценён» за «нерелевантен». А значит, по-настоящему новая система, поднимающая хорошие документы, которые старые пропустили, может быть *наказана* старым пулом, ведь её находки засчитываются нулями. Метрики вроде bpref придумали именно чтобы это смягчить. Урок: тестовая коллекция — не нейтральная почва. Она тихо кодирует то, во что уже верили системы, построившие её пул.',
        ],
      },
    },
    {
      id: 'turn-agreement', kind: 'prose',
      heading: { en: 'Do the annotators even agree?', ru: 'А разметчики вообще согласны?' },
      body: {
        en: [
          "Now the question nobody wants to ask out loud: are the labels even *right*? Hand the same query-document pair to two trained annotators and they will sometimes disagree — relevance is genuinely a judgment, not a fact, and \"is this article about space useful for someone searching space\" has fuzzy edges. If your two judges flip a coin's worth of the time, your gold standard isn't gold; it's noise wearing a crown.",
          "So we measure how much they agree, and we don't measure it naively. Two annotators who both say \"relevant\" 90% of the time will *agree* most of the time purely by chance, which tells you nothing. The fix is **Cohen's kappa** (and **Fleiss' kappa** for more than two judges): it measures agreement *above what chance alone would produce*, so a high kappa means the judges are really tracking the same signal, not just both leaning the same way. When kappa is low, you don't ship a sharper model — you go fix your annotation guidelines, because no metric computed on noisy labels can be trusted, no matter how clean the arithmetic looks. Your scoreboard is only ever as honest as the people who built its answer key.",
        ],
        ru: [
          'Теперь вопрос, который никто не хочет задавать вслух: а метки вообще *верны*? Дай одну и ту же пару запрос–документ двум обученным разметчикам — и иногда они разойдутся: релевантность — это действительно суждение, а не факт, и у «полезна ли эта статья про космос тому, кто ищет космос» размытые края. Если твои двое судей расходятся как при подбрасывании монеты, твой золотой стандарт не золотой; это шум в короне.',
          'Поэтому мы измеряем, насколько они согласны, и измеряем не наивно. Двое разметчиков, говорящих «релевантно» в 90% случаев, *совпадут* почти всегда чисто случайно, и это ни о чём не говорит. Решение — **каппа Коэна** (и **каппа Фляйсса** для более чем двух судей): она измеряет согласие *сверх того, что дала бы одна случайность*, так что высокая каппа значит, что судьи действительно ловят один сигнал, а не просто оба клонятся в одну сторону. Когда каппа низка, ты не катишь более острую модель — ты идёшь чинить инструкции для разметки, потому что ни одной метрике на шумных метках нельзя верить, как бы чисто ни выглядела арифметика. Твоя доска результатов ровно настолько честна, насколько честны люди, построившие её ключ с ответами.',
        ],
      },
    },
    { id: 'climb-metrics', kind: 'scrolly', widget: 'ranking-metrics', data: 'l4-metrics' },
    {
      id: 'climb-metrics-numbers', kind: 'prose',
      heading: { en: 'The metrics, by the numbers', ru: 'Метрики в числах' },
      img: 'L4/L4-04-ndcg-ideal-vs-actual.png',
      imgAlt: {
        en: 'nDCG as two ladders side by side: your actual ranking versus the ideal sorted-by-gain ranking; the score is their ratio.',
        ru: 'nDCG как две лестницы рядом: твоё реальное ранжирование против идеального, отсортированного по gain; оценка — их отношение.',
      },
      imgCaption: {
        en: 'nDCG = your ladder vs the ideal ladder: discounted gain rewards relevant results high up; you normalise against the perfect ranking, so the score lands in [0,1].',
        ru: 'nDCG = твоя лестница против идеальной: дисконтированный gain вознаграждает за релевантные результаты наверху; нормируешь относительно идеального ранжирования, и оценка попадает в [0,1].',
      },
      body: {
        en: [
          "Let me pin those metrics to actual arithmetic, because every one of them is just careful counting and you should be able to redo it by hand. Take the real BM25 ranking we just graded — eight results, and using our qrels the relevant/not pattern down the list is `[0,1,0,1,0,1,0,1]`: rank 1 is a miss, rank 2 a hit, alternating to the bottom. Four of the eight are relevant, and all four relevant documents are in the list, so 4 is also the total relevant count.",
          "**Recall@k** asks: of all the relevant documents, how many have we found by rank k? At k=1 we've found none → 0. By k=3 we've caught one of four → 0.25. By k=5, two of four → 0.5. By k=8, all four → 1.0. It climbs **0 → 0.25 → 0.5 → 1.0**, and it can only ever go up as k grows. **Precision@k** asks the complementary question: of the k results we've shown, what fraction are relevant? At k=1, zero of one → 0. At k=3, one of three → 0.333. At k=5, two of five → 0.4. At k=8, four of eight → 0.5. So precision runs **0 → 0.333 → 0.4 → 0.5**. Recall rewards finding everything; precision rewards not wasting the user's slots — and on this ranking they pull in different directions exactly as the theory promises.",
          "**MRR** — mean reciprocal rank — cares only about the *first* hit. The first relevant document sits at rank 2, so the reciprocal rank is 1/2 = **0.5**; if the very first result had been relevant it would be 1/1 = 1.0, and a first hit at rank 10 would score only 0.1. That's the known-item metric: get the one right answer to the top, or pay for every rank it sits below.",
          "Two of these only show their teeth across *multiple* queries, so add a second query whose pattern is `[1,0,1,1,0,0,1,0]` — a strong one that hits at rank 1. Its reciprocal rank is 1/1 = 1.0, so averaging the two queries gives **MRR = (0.5 + 1.0)/2 = 0.75** — a number equal to *neither* query alone, which is the whole point of a mean. **MAP** goes one level deeper: average precision (AP) averages the precision *at each rank where a relevant document appears*. For the second query the hits land at ranks 1, 3, 4, 7, with precisions 1.0, 0.667, 0.75, 0.571, so AP = (1.0 + 0.667 + 0.75 + 0.571)/4 = **0.747**; the first query's AP works out to 0.5. Average the two and **MAP = (0.5 + 0.747)/2 = 0.6235**.",
          "Now the headline metric, **nDCG**, the only one of the five that cares *where* on the list each hit lands. It rests on one idea: a relevant document at rank 1 is worth more than the same document at rank 8, so each gain gets *discounted* by how far down it sits. The discount is `1/log₂(rank+1)`, which at rank 1 is `1/log₂2 = 1.0` (full credit), at rank 2 is `1/log₂3 = 0.6309`, at rank 4 is 0.4307, and keeps shrinking — 0.3562 at rank 6, 0.3155 at rank 8. **DCG** is just the sum of (gain × discount) down the list. With *binary* gains, only our four hits at ranks 2, 4, 6, 8 contribute, so DCG = 0.6309 + 0.4307 + 0.3562 + 0.3155 = **1.7333**. But a raw DCG isn't comparable across queries — a query with more relevant documents can pile up more gain — so we normalise by the **ideal** DCG: the score the *perfect* ranking would get if it sorted every relevant document to the very top. Here the ideal puts all four hits at ranks 1–4, so IDCG = 1.0 + 0.6309 + 0.5 + 0.4307 = **2.5616**. Divide: **nDCG = 1.7333 / 2.5616 = 0.6766**. That's our BM25 ranking's score — one comparable number in [0,1], where 1.0 means \"already perfect.\"",
          "Binary gains throw away the obvious truth that some hits are *better* hits, so real nDCG uses **graded** gains. Re-grade the same four space documents — two strong ones (a clear, on-topic match) get gain 3, two marginal ones get gain 1 — and the arithmetic re-runs with those gains in place of 1s. The actual ranking now scores DCG = 3·0.6309 + 3·0.4307 + 1·0.3562 + 1·0.3155 = 3.8565, against an ideal IDCG = 5.8235 that front-loads the grades 3, 3, 1, 1, giving **graded nDCG = 0.6622**. (Many systems instead weight gains as `2^grade − 1`, which punishes burying a great result even harder; that variant lands at **0.6563** here.) Notice graded and binary nDCG *disagree* slightly — 0.66 vs 0.68 — because they reward different things, which is exactly why you state which one you used. Five metrics, one pile of counting — and now you can reproduce every one of them without trusting a widget.",
        ],
        ru: [
          'Дай я привяжу эти метрики к настоящей арифметике, потому что каждая из них — это просто аккуратный подсчёт, и ты должен уметь повторить его руками. Возьми реальное ранжирование BM25, что мы только что оценили, — восемь результатов, и по нашим qrels шаблон «релевантно/нет» вниз по списку такой: `[0,1,0,1,0,1,0,1]`: ранг 1 — промах, ранг 2 — попадание, и так по очереди до низа. Четыре из восьми релевантны, и все четыре релевантных документа в списке, так что 4 — это и общее число релевантных.',
          '**Recall@k** спрашивает: из всех релевантных документов сколько мы нашли к рангу k? На k=1 не нашли ни одного → 0. К k=3 поймали один из четырёх → 0,25. К k=5 — два из четырёх → 0,5. К k=8 — все четыре → 1,0. Он лезет вверх **0 → 0,25 → 0,5 → 1,0** и с ростом k может только расти. **Precision@k** задаёт встречный вопрос: из k показанных результатов какая доля релевантна? На k=1 — ноль из одного → 0. На k=3 — один из трёх → 0,333. На k=5 — два из пяти → 0,4. На k=8 — четыре из восьми → 0,5. Итак, precision идёт **0 → 0,333 → 0,4 → 0,5**. Recall награждает за то, что найдено всё; precision — за то, что слоты пользователя не растрачены, — и на этом ранжировании они тянут в разные стороны ровно так, как обещает теория.',
          '**MRR** — средний обратный ранг — заботится только о *первом* попадании. Первый релевантный документ стоит на ранге 2, поэтому обратный ранг — 1/2 = **0,5**; будь первый же результат релевантным, было бы 1/1 = 1,0, а первое попадание на ранге 10 дало бы лишь 0,1. Это метрика известного объекта: подними единственный верный ответ наверх — или плати за каждый ранг, на который он опустился.',
          'Две из этих метрик показывают зубы лишь на *нескольких* запросах, так что добавь второй запрос с шаблоном `[1,0,1,1,0,0,1,0]` — сильный, с попаданием на ранге 1. Его обратный ранг — 1/1 = 1,0, так что усреднение двух запросов даёт **MRR = (0,5 + 1,0)/2 = 0,75** — число, не равное *ни одному* запросу по отдельности, в чём и весь смысл среднего. **MAP** копает на уровень глубже: средняя точность (AP) усредняет precision *на каждом ранге, где появляется релевантный документ*. У второго запроса попадания на рангах 1, 3, 4, 7 с точностями 1,0, 0,667, 0,75, 0,571, поэтому AP = (1,0 + 0,667 + 0,75 + 0,571)/4 = **0,747**; AP первого запроса выходит 0,5. Усредни оба — и **MAP = (0,5 + 0,747)/2 = 0,6235**.',
          'Теперь главная метрика — **nDCG**, единственная из пяти, которой важно, *где* в списке оказалось каждое попадание. Она держится на одной идее: релевантный документ на ранге 1 ценнее того же документа на ранге 8, поэтому каждый gain *дисконтируется* тем, насколько глубоко он сидит. Дисконт — это `1/log₂(ранг+1)`, что на ранге 1 даёт `1/log₂2 = 1,0` (полный кредит), на ранге 2 — `1/log₂3 = 0,6309`, на ранге 4 — 0,4307 и всё уменьшается: 0,3562 на ранге 6, 0,3155 на ранге 8. **DCG** — это просто сумма (gain × дисконт) вниз по списку. С *бинарными* gain вклад дают только наши четыре попадания на рангах 2, 4, 6, 8, так что DCG = 0,6309 + 0,4307 + 0,3562 + 0,3155 = **1,7333**. Но сырой DCG несравним между запросами — у запроса с бóльшим числом релевантных документов накопится больше gain, — поэтому мы нормируем на **идеальный** DCG: оценку, которую получило бы *идеальное* ранжирование, поставив все релевантные документы в самый верх. Здесь идеал ставит все четыре попадания на ранги 1–4, так что IDCG = 1,0 + 0,6309 + 0,5 + 0,4307 = **2,5616**. Делим: **nDCG = 1,7333 / 2,5616 = 0,6766**. Это и есть оценка нашего ранжирования BM25 — одно сравнимое число в [0,1], где 1,0 значит «уже идеально».',
          'Бинарные gain выбрасывают очевидную истину, что одни попадания *лучше* других, поэтому настоящий nDCG использует **градуированные** gain. Переоцени те же четыре космических документа — двум сильным (чёткое попадание в тему) дай gain 3, двум маргинальным — gain 1 — и арифметика пересчитывается с этими gain вместо единиц. Реальное ранжирование теперь даёт DCG = 3·0,6309 + 3·0,4307 + 1·0,3562 + 1·0,3155 = 3,8565 против идеального IDCG = 5,8235, что выводит вперёд оценки 3, 3, 1, 1, давая **градуированный nDCG = 0,6622**. (Многие системы вместо этого взвешивают gain как `2^оценка − 1`, что ещё жёстче карает за зарытый отличный результат; этот вариант здесь выходит на **0,6563**.) Заметь, что градуированный и бинарный nDCG слегка *расходятся* — 0,66 против 0,68 — потому что награждают за разное, и именно поэтому ты указываешь, какой из них взял. Пять метрик, одна куча подсчётов — и теперь ты можешь воспроизвести каждую, не доверяясь виджету.',
        ],
      },
    },
    {
      id: 'turn-metric-choice', kind: 'prose',
      heading: { en: 'Pick the metric that matches the user', ru: 'Выбери метрику под пользователя' },
      body: {
        en: [
          "You just watched five metrics fall out of one ranking, and the natural reaction is \"so which one do I use?\" The honest answer is: it depends entirely on what your user is *trying to do*, and choosing the wrong metric is its own quiet way of lying. Each metric encodes an assumption about behaviour, so the trick is to match the metric to the task.",
          "Looking up one specific thing — a known-item search, a question with a single right answer? Then only the rank of the *first* good result matters, and that's **MRR**: it rewards getting the answer to the very top and ignores everything below. Browsing a set, like shopping or research, where you'll skim several results? Then **precision@k** and **recall@k** speak your language — how much of page one is good, and how much of the good stuff you found. Care about ordering across many relevant documents with different degrees of usefulness, the way real web search works? Then you want graded **nDCG**, which alone among these knows that a great result at rank 1 beats a great result at rank 8. Same ranking, five numbers, and they can disagree about which system wins — so the discipline is to decide what your users actually do *before* you read the scoreboard, not after.",
        ],
        ru: [
          'Ты только что видел, как из одного ранжирования выпало пять метрик, и естественная реакция — «так какую же брать?». Честный ответ: целиком зависит от того, что твой пользователь *пытается сделать*, и выбор не той метрики — это свой тихий способ врать. Каждая метрика кодирует допущение о поведении, поэтому фокус в том, чтобы подобрать метрику под задачу.',
          'Ищешь одну конкретную вещь — поиск известного объекта, вопрос с единственным верным ответом? Тогда важен только ранг *первого* хорошего результата, и это **MRR**: он награждает за вывод ответа в самый верх и игнорирует всё ниже. Просматриваешь набор — покупки, ресёрч, — где пробежишь глазами несколько результатов? Тогда на твоём языке говорят **precision@k** и **recall@k** — сколько на первой странице хорошего и сколько хорошего ты вообще нашёл. Важен порядок среди многих релевантных документов с разной степенью полезности, как в реальном веб-поиске? Тогда нужен градуированный **nDCG**, который один из всех знает, что отличный результат на ранге 1 бьёт отличный на ранге 8. Одно ранжирование, пять чисел, и они могут спорить, какая система победила, — поэтому дисциплина в том, чтобы решить, что реально делают твои пользователи, *до* того как читаешь доску, а не после.',
        ],
      },
    },
    {
      id: 'turn-headtohead', kind: 'prose',
      heading: { en: 'Two systems, one number each', ru: 'Две системы, по одному числу' },
      body: {
        en: [
          "Back to the very first problem: two systems, both look fine, which is better. Now we have a metric, so let's do the obvious thing — run both over a set of queries, average their nDCG, and compare. System B scores about 0.64, System A about 0.60. B wins by roughly four hundredths of a point. Ship B, right?",
          "Not so fast, and this is the beat that separates careful people from confident ones. That single average hides a riot of per-query variation. Look underneath and B beats A on most queries — but on several queries A actually *wins*, sometimes by more than the average gap. The mean is a smooth lie told over a bumpy reality. Four hundredths could be a real, durable improvement, or it could be the luck of which fifteen queries happened to land in your test set. If you'd drawn a different fifteen, would B still win? That is exactly the question the next figure forces us to answer honestly — and \"the average is higher\" is not an answer.",
        ],
        ru: [
          'Назад к самой первой проблеме: две системы, обе выглядят прилично, какая лучше. Теперь у нас есть метрика, так сделаем очевидное — прогоним обе по набору запросов, усредним их nDCG, сравним. Система B даёт около 0,64, система A около 0,60. B побеждает примерно на четыре сотых очка. Катим B, да?',
          'Не так быстро, и это бит, отделяющий аккуратных от уверенных. Это единственное среднее прячет бурю поквенного разброса. Загляни под него — и B обходит A на большинстве запросов, но на нескольких A на самом деле *побеждает*, иногда с отрывом больше среднего. Среднее — это гладкая ложь, рассказанная поверх ухабистой реальности. Четыре сотых могут быть настоящим, устойчивым улучшением, а могут — удачей в том, какие именно пятнадцать запросов попали в твой тест. Вытяни ты другие пятнадцать — победит ли B по-прежнему? Это ровно тот вопрос, на который следующая фигура заставляет ответить честно, а «среднее выше» — не ответ.',
        ],
      },
    },
    {
      id: 'climb-significance', kind: 'prose',
      heading: { en: 'Is the difference real?', ru: 'Разница настоящая?' },
      img: 'L4/L4-10-significance-dice.png',
      imgAlt: {
        en: 'Two close scores facing off over a pair of dice: real skill, or the luck of which queries you happened to draw? A significance test rolls the dice of chance.',
        ru: 'Два близких балла напротив друг друга над парой костей: настоящее мастерство или удача в том, какие запросы выпали? Тест значимости бросает кости случая.',
      },
      imgCaption: {
        en: 'Real… or random?: a small gap between two scores — is it skill or luck? A significance test models the dice of chance and asks how often luck alone would produce a gap this big.',
        ru: 'Реально… или случайно?: малый разрыв между двумя баллами — мастерство или удача? Тест значимости моделирует кости случая и спрашивает, как часто одна удача дала бы такой разрыв.',
      },
      body: {
        en: [
          "Here's the question made precise: if the two systems were *actually equally good*, how often would pure luck hand me a four-hundredths gap this big or bigger, just from which queries I happened to test? That probability is the **p-value**, and the whole machinery of statistical significance exists to compute it. If luck would produce my result only rarely, the difference is probably real. If luck would produce it all the time, I've discovered nothing but noise wearing a result's clothes.",
          "There are several honest ways to compute it, and the good news is they mostly agree. The **paired t-test** looks at the per-query differences and asks whether their average is far enough from zero relative to how much they scatter — for our two systems it gives t ≈ 2.27 and lands at about p ≈ 0.039. The **Wilcoxon signed-rank test** does the same thing using only the ranks of the differences, which makes it safer when the differences aren't bell-shaped; it gives about p ≈ 0.048 (just under 0.05). And the **permutation test** is the most honest of all and barely uses any theory: if the systems were truly equal, the sign on each query's difference was a coin flip, so just flip all the signs every possible way, recompute the average each time, and *count* how often you get a gap as big as the one you saw — about p ≈ 0.040 again. Three methods, three roads, same destination.",
          "By the usual convention — p below 0.05 — B's win clears the bar, but only just. And there's a companion to the p-value that's arguably more useful: the **confidence interval**, which here says the true improvement is somewhere around 0.00 to 0.08. That interval grazing zero is the tell — the effect is real but small and fragile, and the obvious fix is *more queries*. Significance isn't a stamp of importance; it's a guard against fooling yourself. Run fifteen queries and you can detect only large differences. Run a thousand and you can trust small ones. Power comes from sample size, and there is no test clever enough to rescue you from too little data.",
        ],
        ru: [
          'Вот вопрос, поставленный точно: будь две системы *на самом деле одинаково хороши*, как часто чистая удача выдавала бы мне разрыв в четыре сотых такого размера или больше — только из-за того, какие запросы я случайно проверил? Эта вероятность и есть **p-значение**, и вся машинерия статистической значимости существует, чтобы его посчитать. Если удача давала бы мой результат лишь редко — разница, вероятно, настоящая. Если удача давала бы его постоянно — я не открыл ничего, кроме шума в одежде результата.',
          'Есть несколько честных способов его посчитать, и хорошая новость — они в основном сходятся. **Парный t-тест** смотрит на поквенные разности и спрашивает, достаточно ли их среднее далеко от нуля относительно их разброса, — для наших двух систем выходит t ≈ 2,27 и около p ≈ 0,039. **Знаково-ранговый тест Уилкоксона** делает то же, используя только ранги разностей, что безопаснее, когда разности не колоколом; он даёт около p ≈ 0,048 (чуть меньше 0,05). А **перестановочный тест** — самый честный из всех и почти не использует теории: будь системы и впрямь равны, знак разности на каждом запросе был бы броском монеты, так что переверни все знаки всеми возможными способами, пересчитывай среднее каждый раз и *посчитай*, как часто получаешь разрыв не меньше увиденного, — снова около p ≈ 0,040. Три метода, три дороги, один пункт назначения.',
          'По обычной конвенции — p ниже 0,05 — победа B берёт планку, но впритык. И у p-значения есть спутник, пожалуй, полезнее: **доверительный интервал**, который здесь говорит, что истинное улучшение где-то от 0,00 до 0,08. То, что интервал задевает ноль, и есть знак — эффект настоящий, но малый и хрупкий, и очевидное лекарство — *больше запросов*. Значимость — не печать важности; это защита от самообмана. Прогони пятнадцать запросов — и поймаешь только большие разницы. Прогони тысячу — и сможешь верить малым. Мощность идёт от размера выборки, и нет теста, достаточно хитрого, чтобы спасти тебя от нехватки данных.',
        ],
      },
    },
    {
      id: 'turn-online', kind: 'prose',
      heading: { en: 'The real world votes with clicks', ru: 'Реальный мир голосует кликами' },
      img: 'L4/L4-11-ab-parallel-universes.png',
      imgAlt: {
        en: 'An A/B test as two parallel universes: identical users split into two worlds, one served system A and one system B, then compared on real behaviour.',
        ru: 'A/B-тест как две параллельные вселенные: одинаковых пользователей делят на два мира, одному показывают систему A, другому B, и сравнивают по реальному поведению.',
      },
      imgCaption: {
        en: 'The A/B test: split identical users into two parallel universes — one sees system A, one sees B — then compare which world clicks, converts and stays more.',
        ru: 'A/B-тест: раздели одинаковых пользователей на две параллельные вселенные — одна видит систему A, другая B — и сравни, в каком мире больше кликают, конвертируются и остаются.',
      },
      body: {
        en: [
          "Everything so far happened in a lab on frozen labels — that's **offline** evaluation, and it's indispensable, but it's a proxy. The labels came from annotators guessing what users want, not from users. The corpus is a snapshot, not the live, drifting, seasonal stream of real queries. Offline tells you a change *might* help. Only the **online** world, real users in real time, tells you it *did*.",
          "The workhorse of online evaluation is the **A/B test**: split live traffic, send half to the old system and half to the new, and watch what people actually do — clicks, conversions, how long they stay. In our run the new system lifts click-through from 12% to 13.2%, a 10% relative gain, and with twenty thousand users behind it that clears significance comfortably (p ≈ 0.01). But the same statistical discipline from a moment ago applies with teeth: you need enough users for *power*, you have to fight novelty effects (anything new gets clicked just for being new) and seasonality, and you must not *peek* — checking the test every hour and stopping the moment it looks good is a fantastic way to declare victory on pure noise. The cardinal sin of online eval is calling a winner early.",
        ],
        ru: [
          'Всё до сих пор происходило в лаборатории на замороженных метках — это **офлайн**-оценка, незаменимая, но это прокси. Метки пришли от разметчиков, угадывавших, чего хотят пользователи, а не от пользователей. Корпус — снимок, а не живой, дрейфующий, сезонный поток реальных запросов. Офлайн говорит, что изменение *может* помочь. Только **онлайн**-мир, реальные пользователи в реальном времени, говорит, что оно *помогло*.',
          'Рабочая лошадка онлайн-оценки — **A/B-тест**: раздели живой трафик, отправь половину на старую систему, половину на новую, и смотри, что люди реально делают — клики, конверсии, как долго остаются. В нашем прогоне новая система поднимает кликабельность с 12% до 13,2%, относительный прирост 10%, и при двадцати тысячах пользователей за спиной это уверенно берёт значимость (p ≈ 0,01). Но та же статистическая дисциплина, что минуту назад, применяется с зубами: нужно достаточно пользователей ради *мощности*, надо бороться с эффектом новизны (новое кликают просто за то, что оно новое) и сезонностью, и нельзя *подглядывать* — проверять тест каждый час и остановить в миг, когда выглядит хорошо, — отличный способ объявить победу на чистом шуме. Кардинальный грех онлайн-оценки — назвать победителя слишком рано.',
        ],
      },
    },
    {
      id: 'turn-online-bias', kind: 'prose',
      heading: { en: 'Clicks lie too', ru: 'Клики тоже врут' },
      body: {
        en: [
          "Now the nasty part, and it should feel familiar — because it's a cousin of the position-bias monster from the very first chapter. Clicks are *not* a clean signal of relevance. People click the top result far more than the bottom one **regardless of how good it is**, simply because they look there first; in our model the chance of even *examining* a result decays from 100% at rank 1 down past 50% by rank 10. So a result at the top gets clicks it didn't earn, and a great result buried at rank 9 gets ignored it didn't deserve. If you just count clicks, you'll \"learn\" that being on top is what makes a result good — which is circular and false.",
          "Two ideas rescue online eval from its own clicks. The first is **interleaving**: instead of showing one user system A and another user system B, blend both systems' results into a single list and see which system's contributions get clicked more. Because every user sees both, position bias hits both equally and cancels out — which is why interleaving can detect a winner with a fraction of the traffic an A/B test needs. In our run it cleanly prefers system B. The second idea is **inverse propensity scoring**: if you *know* a result at rank 9 only had, say, a 60% chance of being examined, you up-weight its clicks to correct for the seat it was given. That's the seed of counterfactual, *unbiased* evaluation — estimating how a ranking *would* have done if its results had been seen fairly.",
          "And one humbling truth ties the offline and online halves of this chapter together: they don't always agree. A change can lift nDCG in the lab and move *nothing* online — or even hurt. When that happens, your offline metric isn't predicting the thing you actually care about, and the grown-up response isn't to trust the lab harder; it's to ask why your proxy lied and fix the proxy. The whole point of a scoreboard is to stop fooling yourself, and the surest way to keep fooling yourself is to fall in love with one number.",
        ],
        ru: [
          'Теперь скверная часть, и она должна показаться знакомой — ведь это родич монстра позиционного перекоса из самой первой главы. Клики — *не* чистый сигнал релевантности. Люди кликают верхний результат куда чаще нижнего **независимо от того, насколько он хорош**, просто потому что смотрят туда первым; в нашей модели шанс хотя бы *посмотреть* на результат падает со 100% на ранге 1 до меньше 50% к рангу 10. Так что результат наверху получает клики, которых не заслужил, а отличный результат, зарытый на ранге 9, получает игнор, которого не заслужил. Просто считая клики, ты «выучишь», что хорошим результат делает нахождение наверху, — а это замкнутый круг и неправда.',
          'Две идеи спасают онлайн-оценку от её собственных кликов. Первая — **переслаивание** (interleaving): вместо того чтобы показывать одному пользователю систему A, а другому B, смешай результаты обеих в один список и смотри, чьи вклады кликают чаще. Поскольку каждый пользователь видит обе, позиционный перекос бьёт по обеим поровну и сокращается, — поэтому переслаивание ловит победителя на доле трафика, нужного A/B-тесту. В нашем прогоне оно чисто предпочитает систему B. Вторая идея — **взвешивание обратной склонностью** (inverse propensity scoring): если ты *знаешь*, что результат на ранге 9 имел, скажем, лишь 60% шанс быть рассмотренным, ты повышаешь вес его кликов, поправляя на доставшееся ему место. Это зерно контрфактической, *несмещённой* оценки — прикинуть, как ранжирование *сработало бы*, если бы его результаты увидели честно.',
          'И одна отрезвляющая истина связывает офлайн- и онлайн-половины этой главы: они не всегда согласны. Изменение может поднять nDCG в лаборатории и не двинуть *ничего* онлайн — или даже навредить. Когда так, твоя офлайн-метрика не предсказывает то, что тебя реально волнует, и взрослый ответ не в том, чтобы сильнее верить лаборатории; он в том, чтобы спросить, почему твой прокси соврал, и починить прокси. Весь смысл доски результатов — перестать себя обманывать, а вернейший способ продолжать обманывать себя — влюбиться в одно число.',
        ],
      },
    },
    { id: 'climb-online-bias', kind: 'scrolly', widget: 'pos-bias-curve', data: 'l1-click-model' },
    {
      id: 'turn-eval-numbers', kind: 'prose',
      heading: { en: 'The evidence, by the numbers', ru: 'Доказательства в числах' },
      body: {
        en: [
          "Let me put the hard numbers on the table so \"the difference is real\" stops being a vibe. Over fifteen queries, system B's mean nDCG@10 beats system A's by exactly **0.0397** — that's the whole edge, four hundredths of a point. The question is whether four hundredths survives the luck of which fifteen queries we drew. The paired t-test turns the per-query differences into **t ≈ 2.27 on 14 degrees of freedom → p ≈ 0.039**. The Wilcoxon signed-rank test, which throws away the magnitudes and keeps only the ranks of the differences, gives **p ≈ 0.048**. The permutation test — flip the sign of each query's difference every one of the 2¹⁵ = 32768 ways, recount how often the gap reaches 0.0397 — lands at **p ≈ 0.040**. Three methods, three roads, the same verdict: just under 0.05.",
          "The confidence interval tells the same story with more honesty than the p-value alone. The 95% CI for the true improvement is **[0.0023, 0.0772]** — it clears zero, but barely; its lower edge is a whisker above nothing. So the effect is real *and* small *and* fragile, all at once. And here's the load-bearing caveat: p < 0.05 is **necessary but not sufficient**. It says \"probably not pure luck\"; it does *not* say \"big enough to matter,\" and with only fifteen queries the test can detect just this kind of marginal result. The cure for a CI grazing zero is never a cleverer test — it's **more queries**. Power comes from sample size, full stop.",
          "Online, the numbers come from behaviour instead of labels. The A/B test sends 10,000 users to each arm; click-through rises from **12% to 13.2%** — a **+10% relative** lift — and with 20,000 users behind it the two-proportion z-test gives **p ≈ 0.01**, comfortably significant because the sample is large. Interleaving, which blends both systems into one list so position bias cancels, is even more sensitive: across five queries it hands system B a credit of **17** against A's **9**, a clean preference for B on a fraction of the traffic an A/B test would need. Offline said \"probably,\" online said \"yes\" — but never forget they can disagree, and when they do, it's the proxy you fix, not the verdict you force.",
        ],
        ru: [
          'Дай я выложу на стол твёрдые числа, чтобы «разница настоящая» перестала быть ощущением. На пятнадцати запросах среднее nDCG@10 системы B обходит A ровно на **0,0397** — вот и весь отрыв, четыре сотых очка. Вопрос — переживут ли эти четыре сотых удачу в том, какие именно пятнадцать запросов мы вытянули. Парный t-тест превращает поквенные разности в **t ≈ 2,27 при 14 степенях свободы → p ≈ 0,039**. Знаково-ранговый тест Уилкоксона, выбрасывающий величины и оставляющий лишь ранги разностей, даёт **p ≈ 0,048**. Перестановочный тест — переверни знак разности каждого запроса всеми 2¹⁵ = 32768 способами и пересчитай, как часто разрыв достигает 0,0397 — выходит на **p ≈ 0,040**. Три метода, три дороги, один вердикт: чуть меньше 0,05.',
          'Доверительный интервал рассказывает то же, но честнее p-значения в одиночку. 95% ДИ для истинного улучшения — **[0,0023, 0,0772]** — он переходит ноль, но впритык; его нижний край на волосок выше нуля. Так что эффект настоящий *и* малый *и* хрупкий — всё разом. И вот несущая оговорка: p < 0,05 **необходимо, но не достаточно**. Оно говорит «вероятно, не чистая удача»; оно *не* говорит «достаточно велико, чтобы иметь значение», а на пятнадцати запросах тест и способен поймать лишь такой пограничный результат. Лекарство от ДИ, задевающего ноль, — никогда не хитрее тест, а **больше запросов**. Мощность идёт от размера выборки, и точка.',
          'Онлайн числа идут от поведения, а не от меток. A/B-тест отправляет по 10 000 пользователей в каждое плечо; кликабельность растёт с **12% до 13,2%** — **+10% относительно** — и при 20 000 пользователей за спиной двухпропорциональный z-тест даёт **p ≈ 0,01**, уверенно значимо, ведь выборка велика. Переслаивание, смешивающее обе системы в один список, чтобы позиционный перекос сократился, ещё чувствительнее: на пяти запросах оно отдаёт системе B кредит **17** против **9** у A — чистое предпочтение B на доле трафика, нужного A/B-тесту. Офлайн сказал «вероятно», онлайн сказал «да» — но не забывай, что они могут разойтись, и когда расходятся, чинишь прокси, а не продавливаешь вердикт.',
        ],
      },
    },
    {
      id: 'catch-goodhart', kind: 'prose',
      heading: { en: 'Goodhart the Trickster returns', ru: 'Возвращается Гудхарт-Трикстер' },
      img: 'L4/L4-03-goodhart-trickster.png',
      imgAlt: {
        en: 'Goodhart the Trickster grinning as he bends a metric line upward with a clickbait hook while the real relevance line quietly flatlines.',
        ru: 'Гудхарт-Трикстер ухмыляется, выгибая линию метрики вверх кликбейт-крючком, пока линия настоящей релевантности тихо стелется по полу.',
      },
      imgCaption: {
        en: 'Goodhart the Trickster: a measure that becomes a target stops being a good measure. He yanks the metric up with a clickbait hook while real relevance quietly falls.',
        ru: 'Гудхарт-Трикстер: мера, ставшая целью, перестаёт быть хорошей мерой. Он тянет метрику вверх кликбейт-крючком, пока настоящая релевантность тихо падает.',
      },
      imgPos: 'mascot',
      body: {
        en: [
          "And now the danger that's been circling this whole chapter, made flesh. The moment a metric becomes a *target* — the moment someone's bonus, or a training loop's gradient, points at the number instead of the thing the number was supposed to stand for — somebody will optimise the metric and quietly abandon the goal. **Goodhart the Trickster** is back, grinning, because we just handed him a scoreboard to game.",
          "Watch him do it. Optimise for raw clicks, and since clicks flock to the top regardless of merit, you'll \"learn\" to reward whatever already sits on top — exactly the trap from The Lost Record. Take a ranking tuned to chase popularity instead of relevance: it shoves the busiest documents up front and pushes our four real space hits down to ranks 5, 6, 7, 8. Run the very same nDCG arithmetic on it — same four hits, same IDCG of 2.5616, just worse seats — and its DCG collapses to 0.3869 + 0.3562 + 0.3333 + 0.3155 = 1.3919, so **nDCG = 1.3919 / 2.5616 = 0.5434**: *lower* than honest BM25's **0.6766**, even though it looks busy, confident and full of things people clicked. The gamed ranking optimised the proxy for relevance and lost the relevance. A number you optimise directly stops being a measurement and becomes a costume. This is why everything earlier in the chapter matters: significance keeps you from chasing noise, online eval keeps you from chasing lab artifacts, and a clear head keeps you from chasing a metric off a cliff.",
        ],
        ru: [
          'И вот опасность, что кружила над всей главой, обретает плоть. Как только метрика становится *целью* — как только чья-то премия или градиент обучающего цикла нацеливается на число вместо того, что оно должно было обозначать, — кто-то оптимизирует метрику и тихо бросит цель. **Гудхарт-Трикстер** снова здесь, ухмыляется, потому что мы только что вручили ему доску, которую можно подкрутить.',
          'Смотри, как он это делает. Оптимизируй сырые клики — а раз клики слетаются наверх вне зависимости от заслуг, ты «выучишь» награждать то, что уже стоит сверху, — ровно ловушка из «Потерянной записи». Возьми ранжирование, заточенное гнаться за популярностью вместо релевантности: оно выталкивает вперёд самые «бойкие» документы, а наши четыре настоящих космических попадания опускает на ранги 5, 6, 7, 8. Прогони на нём ту же самую арифметику nDCG — те же четыре попадания, тот же IDCG 2,5616, просто места хуже — и его DCG складывается в 0,3869 + 0,3562 + 0,3333 + 0,3155 = 1,3919, так что **nDCG = 1,3919 / 2,5616 = 0,5434**: *ниже*, чем у честного BM25 с его **0,6766**, хотя выглядит бойко, уверенно и полно того, что кликали. Подкрученное ранжирование оптимизировало прокси релевантности и потеряло релевантность. Число, которое оптимизируешь напрямую, перестаёт быть измерением и становится костюмом. Вот почему важно всё раннее в главе: значимость не даёт гнаться за шумом, онлайн-оценка не даёт гнаться за лабораторными артефактами, а ясная голова не даёт гнаться за метрикой с обрыва.',
        ],
      },
    },
    {
      id: 'payoff-scoreboard', kind: 'prose',
      heading: { en: 'An honest scoreboard', ru: 'Честная доска результатов' },
      body: {
        en: [
          "So now I can argue with numbers instead of opinions — and, just as importantly, I know which numbers lie and how. nDCG, MAP, MRR, recall@k: pick the one that matches what your users actually do. Test collections built from pooled, agreed-upon judgments. A significance test so you don't ship noise, an A/B test so you don't ship a lab fantasy, interleaving and propensity weighting so clicks don't con you, and a healthy fear of Goodhart so you never optimise a number into meaninglessness. That's the Proving Grounds. Keep this scoreboard close; every chapter from here on makes a claim only these tools can settle.",
          "And the very first claim is already waiting at the gate. Our fast classical catalog from last chapter is brilliant and *still synonym-blind* — the Gremlin is right there behind his wall. Can a machine that understands *meaning* actually beat BM25 on this scoreboard, fair and square, significance and all? To even attempt it, words need coordinates. Next chapter: The Map of Meaning.",
        ],
        ru: [
          'Итак, теперь я могу спорить числами, а не мнениями, — и, что не менее важно, я знаю, какие числа врут и как. nDCG, MAP, MRR, recall@k: выбери ту, что соответствует тому, что реально делают пользователи. Тестовые коллекции из пулинговых, согласованных суждений. Тест значимости, чтобы не выкатить шум, A/B-тест, чтобы не выкатить лабораторную фантазию, переслаивание и взвешивание склонностью, чтобы клики тебя не обманули, и здоровый страх перед Гудхартом, чтобы ты никогда не оптимизировал число до бессмыслицы. Это и есть Полигон. Держи эту доску под рукой: каждая следующая глава делает утверждение, которое решают только эти инструменты.',
          'И самое первое утверждение уже ждёт у ворот. Наш быстрый классический каталог из прошлой главы блестящ и *по-прежнему слеп к синонимам* — Гремлин прямо там, за своей стеной. Сможет ли машина, понимающая *смысл*, и вправду обойти BM25 на этой доске, честно, со значимостью и всем прочим? Чтобы хотя бы попытаться, словам нужны координаты. Следующая глава: «Карта смысла».',
        ],
      },
    },
  ],
};
