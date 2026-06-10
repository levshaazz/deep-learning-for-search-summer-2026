    {
      id: 'problem-raw-text', kind: 'prose',
      heading: { en: 'Raw text is not computable', ru: 'Сырой текст не вычисляем', tt: 'Чи текст исәпләнми' },
      img: 'L2/L2-08-discreteness.png',
      imgAlt: {
        en: 'A continuous grey gradient on the left; on the right, "cat" and "dog" with no word in between.',
        ru: 'Слева непрерывный серый градиент; справа «cat» и «dog», и никакого слова между ними.',
        tt: 'Сулда өзлексез соры градиент; уңда «cat» белән «dog», ә алар арасында бер сүз дә юк.',
      },
      imgCaption: {
        en: 'Pixels interpolate; symbols do not. There is no valid point between two strings — so we have to invent the coordinates ourselves.',
        ru: 'Пиксели интерполируются; символы — нет. Между двумя строками нет допустимой точки — координаты придётся придумать самим.',
        tt: 'Пиксельләр интерполяцияләнә; символлар — юк. Ике юл арасында дөрес нокта юк — координаталарны үзебезгә уйлап табарга туры килә.',
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
        tt: [
          'Беренче кыенлык: компьютер чи хәрефләр белән берни эшли алмый. Аңа саннар кирәк. Иң җиңел чишелеш — сүзлек төзү, һәр бөтен сүзгә үзенең бөтен сан ID-сын бирү һәм бу ID-ларны моделгә тапшыру. Бу чит планеталы без язып куймаган сүзне әйткәнчегә кадәр генә эшли. Бер күрелмәгән сүз — һәм бөтен конвейер кулларын җәя: *сүз сүзлектә юк*. Модельдә аңа күзәнәк юк, шуңа күрә ул отламаган барысын да бер файдасыз `[UNK]` токенына кысып җыя. Исемнәр, ялгышлар, хэштеглар, кодтан идентификаторлар, чит планеталының бөтен теле — барысы да бер буш билгегә яньчелә.',
          'Өметләнергә мөмкин: сүзлекне зуррак кына итик. Күбрәк текст укыйк, сүзләр өсти барыйк — әлбәттә ул туеначак? Юк. Бу турыда ике эмпирик закон сөйли, һәм без аларны хәзер фигура рәвешендә очратырбыз. **Ципф законы**: сүзнең ешлыгы якынча бер-бүленгәне-рангка төшә — реаль 3,7 млн токенлы корпуста бер генә топ-10 сүз барысының 20,6%-ын каплый, топ-100 — 47,3%-ын, топ-1000 — 71,4%-ын, ә аннары нәкъ бер тапкыр очраган сүзләрнең гаять зур койрыгы. **Хипс законы**: сүзләрнең төрле типлары саны уку барышында \\(V \\approx K\\,N^{\\beta}\\) кебек \\(\\beta \\approx 0{,}59\\) белән үсә — сублинеар, ләкин *чиксез*. 3,66 млн токеннан соң без инде 94 287 төрле тип санадык, ә кәкре һаман өскә үрмәли иде.',
          'Бу ике фактны кушсаң — хөкем шикаятькә бирелми: **бөтен сүзләрнең бернинди чикле исемлеге дә чын телне каплый алмый.** Яңа сүзләр мәңге килә. Шуңа күрә без сүзләрне санап чыгуны туктатабыз — һәм аларны беркайчан да бетмәслек дәрәҗәдә вак кисәкләргә ватабыз.',
        ],
      },
    },
