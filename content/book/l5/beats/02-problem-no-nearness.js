    {
      id: 'problem-no-nearness', kind: 'prose',
      heading: { en: 'Symbols have no “near”', ru: 'У символов нет «близко»', tt: 'Символларда «якын» юк' },
      img: 'L5/L5-02-words-to-coordinates.png', imgPos: 'scene',
      imgAlt: {
        en: 'Words being lifted off a flat list of one-hot symbols and dropped as points onto a 2-D coordinate grid.',
        ru: 'Слова поднимают с плоского списка one-hot символов и роняют точками на 2-D координатную сетку.',
        tt: 'Сүзләрне one-hot символлар яссы исемлегеннән күтәреп, 2-D координат челтәренә нокта итеп төшерәләр.',
      },
      imgCaption: {
        en: 'One-hot gives every word its own lonely axis — all pairs the same distance apart. Coordinates make distance mean something.',
        ru: 'One-hot даёт каждому слову свою одинокую ось — все пары на одинаковом расстоянии. Координаты делают расстояние осмысленным.',
        tt: 'One-hot һәр сүзгә үз ялгыз күчәрен бирә — бар парлар бертигез ераклыкта. Координаталар ераклыкны мәгънәле итә.',
      },
      body: {
        en: [
          "Let's make the failure concrete, because it's worse than \"a bit blind\" — it's *total*. The classical way to hand a word to math is **one-hot encoding**: pick a vocabulary of, say, 50,000 words, and represent word number 7 as a vector of 50,000 zeros with a single 1 in slot 7. \"cat\" might be slot 312, \"dog\" slot 6,201, \"airplane\" slot 18,540. Three vectors, each a lone spike on its own axis.",
          "Now measure how *near* any two of them are. The dot product of two different one-hot vectors is always zero — their 1s never line up — so the cosine between any two distinct words is exactly $$\\cos(\\text{cat},\\text{dog}) = 0 = \\cos(\\text{cat},\\text{airplane}).$$ Read that again. \"cat\" and \"dog\" are *exactly as similar* as \"cat\" and \"airplane\": not similar at all, identically not-similar. Every pair of distinct words sits the same fixed distance apart, the corners of a giant simplex, equidistant and meaningless. This is the **Lexical Gremlin's** home turf — the brick wall he wedges between \"couch\" and \"sofa\" is built into the representation itself.",
          "And it's not just one-hot. BM25 and the bag-of-words document vectors inherit the same disease, because they're sums of one-hot word axes: a document about *felines* and a document about *cats* share no terms, so they share no coordinates, so they're orthogonal — zero overlap — even though they're about the same thing. Stemming and synonym lists are buckets bailing the boat, hand-patched, brittle, never enough. The real fix has to change the *representation*: stop giving each word a private axis, and start giving it a position that other words can be *near*.",
        ],
        ru: [
          'Сделаем провал конкретным, потому что он хуже, чем «немного слепой», — он *тотальный*. Классический способ передать слово в математику — **one-hot кодирование**: возьми словарь, скажем, на 50 000 слов и представь слово номер 7 как вектор из 50 000 нулей с единственной 1 в позиции 7. «cat» — пусть позиция 312, «dog» — 6 201, «airplane» — 18 540. Три вектора, каждый — одинокий всплеск на своей оси.',
          'Теперь измерь, насколько *близки* любые два из них. Скалярное произведение двух разных one-hot векторов всегда ноль — их единицы никогда не совпадают, — поэтому косинус между любыми двумя разными словами ровно $$\\cos(\\text{cat},\\text{dog}) = 0 = \\cos(\\text{cat},\\text{airplane}).$$ Перечитай. «cat» и «dog» *ровно так же похожи*, как «cat» и «airplane»: не похожи вовсе, одинаково непохожи. Каждая пара разных слов стоит на одном фиксированном расстоянии, вершины гигантского симплекса, равноудалённые и бессмысленные. Это родная земля **Лексического Гремлина** — кирпичная стена, которую он вставляет между «диваном» и «софой», вшита в само представление.',
          'И дело не только в one-hot. BM25 и векторы мешка слов наследуют ту же болезнь, ведь они — суммы one-hot осей слов: документ про *кошачьих* и документ про *кошек* не делят ни одного терма, значит, не делят координат, значит, ортогональны — нулевое пересечение, — хотя они про одно и то же. Стемминг и списки синонимов — вёдра, вычерпывающие лодку: ручные, хрупкие, всегда недостаточные. Настоящее лечение должно сменить *представление*: перестать давать каждому слову личную ось и начать давать ему позицию, к которой другие слова могут быть *близки*.',
        ],
        tt: [
          'Уңышсызлыкны конкрет итик, чөнки ул «бераз сукыр»дан да начаррак — ул *тулы*. Сүзне математикага тапшыруның классик ысулы — **one-hot кодлау**: әйтик, 50 000 сүзле сүзлек ал һәм 7 нче сүзне 50 000 нульдан, 7 нче оядагы бер генә 1 белән, вектор итеп күрсәт. «cat» — әйтик 312 нче оя, «dog» — 6 201, «airplane» — 18 540. Өч вектор, һәркайсы — үз күчәрендә ялгыз чөй.',
          'Хәзер аларның теләсә кайсы икесе ничек *якын* икәнен үлч. Ике төрле one-hot векторның скаляр тапкырчыгышы һәрвакыт нуль — аларның берәмлекләре беркайчан туры килми, — шуңа теләсә кайсы ике төрле сүз арасындагы косинус нәкъ $$\\cos(\\text{cat},\\text{dog}) = 0 = \\cos(\\text{cat},\\text{airplane}).$$ Тагын укы. «cat» белән «dog» «cat» белән «airplane» кебек *нәкъ шулай ук охшаш*: бөтенләй охшаш түгел, бертигез охшамаган. Һәр төрле сүз пары бер үк беркетелгән ераклыкта тора, гигант симплексның почмаклары, бертигез ерак һәм мәгънәсез. Бу — **Лексик Гремлин**ның туган җире — ул «диван» белән «софа» арасына кыстырган кирпеч стена күрсәтмәнең үзенә салынган.',
          'Һәм бу бары one-hot та гына түгел. BM25 һәм сүзләр капчыгы документ векторлары шул ук авыруны мирас итеп ала, чөнки алар — one-hot сүз күчәрләре суммасы: *мәчеләр* турындагы документ һәм *песиләр* турындагы документ бер генә терминны да уртаклашмый, димәк координаталарны да уртаклашмый, димәк ортогональ — нуль кисешү, — гәрчә алар бер үк нәрсә турында булса да. Стемминг һәм синоним исемлекләре — көймәне суыртучы чиләкләр: кул белән ясалган, сынучан, һәрвакыт җитми. Чын дәвалау *күрсәтмәне* үзгәртергә тиеш: һәр сүзгә шәхси күчәр бирүне туктатып, аңа башка сүзләр *якын* була алырлык позиция бирә башларга.',
        ],
      },
    },
