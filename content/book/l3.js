// content/book/l3.js — "The Star Catalog" (L3): Classical IR + Full-text Ranking + Rank Fusion.
// Beats match narrative/L3.md. Widgets: inverted-index, bm25-calc, rrf-fusion (built by gen_l3.py
// on a real 20 Newsgroups sub-corpus). EN canonical + RU; TT falls back. NARRATIVE_METHOD applies.

export default {
  id: '03',
  catchphrase: 'The Star Catalog',
  beats: [
    {
      id: 'hook-catalog', kind: 'prose',
      heading: { en: 'The Star Catalog', ru: 'Звёздный каталог' },
      body: {
        en: [
          "I'm Serega, and I'm staring at a sky of a billion documents. One of them answers the question on the screen. I can't fly past each star and check — I'd die of old age first. What every astronomer figured out centuries ago, and every search engine reinvented: don't search the sky, search a *catalog* of it.",
        ],
        ru: [
          'Я Серёга, и я смотрю на небо из миллиарда документов. Один из них отвечает на вопрос на экране. Я не могу облететь каждую звезду и проверить — состарюсь раньше. То, что астрономы поняли века назад, а каждый поисковик переоткрыл: не ищи по небу — ищи по его *каталогу*.',
        ],
      },
    },
    {
      id: 'problem-linear-scan', kind: 'prose',
      body: {
        en: [
          "The naive way — read every document at query time and check if it matches — is called a linear scan, and it's a non-starter. Ten milliseconds a document times a billion documents is months per query. Users wait about one second. We need an answer before we've read even a thousandth of the sky.",
        ],
        ru: [
          'Наивный путь — прочитать каждый документ в момент запроса и проверить совпадение — называется линейным сканированием, и это тупик. Десять миллисекунд на документ умножить на миллиард документов — это месяцы на один запрос. Пользователь ждёт около секунды. Нам нужен ответ ещё до того, как мы прочли хотя бы тысячную долю неба.',
        ],
      },
    },
    {
      id: 'turn-inverted-index', kind: 'prose',
      heading: { en: 'Build the catalog', ru: 'Строим каталог' },
      body: {
        en: [
          "Here's the trick. Instead of asking each document \"do you contain this word?\", flip it around: keep a list, for every word, of which documents contain it. That flipped table is the **inverted index** — a catalogue card per word, pointing straight at its stars. A query becomes a lookup, not a scan.",
        ],
        ru: [
          'Вот трюк. Вместо того чтобы спрашивать каждый документ «содержишь ли ты это слово?», переверни задачу: храни для каждого слова список документов, в которых оно есть. Эта перевёрнутая таблица и есть **инвертированный индекс** — каталожная карточка на каждое слово, указывающая прямо на его звёзды. Запрос становится поиском по карточке, а не сканированием.',
        ],
      },
    },
    { id: 'climb-index', kind: 'scrolly', widget: 'inverted-index', data: 'l3-index' },
    {
      id: 'turn-scoring', kind: 'prose',
      heading: { en: 'Matching isn’t ranking', ru: 'Совпадение — это не ранжирование' },
      body: {
        en: [
          "Notice what just happened: asking for documents with *both* query words gave us nothing — strict boolean AND is too brittle. And even when a term does match many documents, the index only tells us *which* ones, not which are *best*. We need to score and **order** them. The classic recipe: weight rare words more, and don't let a word that repeats a hundred times drown out everything else.",
        ],
        ru: [
          'Заметь, что произошло: запрос документов сразу с *обоими* словами не дал ничего — строгое булево AND слишком хрупко. Да и когда термин совпадает со многими документами, индекс говорит лишь *какие* они, а не какие *лучшие*. Нужно оценить и **упорядочить** их. Классический рецепт: редким словам — больший вес, и не давать слову, повторённому сто раз, заглушить всё остальное.',
        ],
      },
    },
    {
      id: 'climb-tfidf', kind: 'prose',
      heading: { en: 'TF-IDF: rare words carry the signal', ru: 'TF-IDF: сигнал несут редкие слова' },
      body: {
        en: [
          "Two ideas. **Term frequency (tf)**: a word that appears more in a document is more about it. **Inverse document frequency (idf)**: a word in *every* document (“the”, “space” in a space corpus) tells you almost nothing, while a rare word is gold. Multiply them — tf · idf — and you get a weight that rewards documents rich in the query's *rare* words. It's a great first instrument. It also has two flaws, which BM25 fixes next.",
        ],
        ru: [
          'Две идеи. **Частота термина (tf)**: слово, что встречается в документе чаще, сильнее о нём говорит. **Обратная частота документа (idf)**: слово, которое есть в *каждом* документе («the», «space» в космическом корпусе), почти ничего не сообщает, а редкое слово — золото. Перемножь их — tf · idf — и получишь вес, награждающий документы, богатые *редкими* словами запроса. Отличный первый инструмент. У него есть два изъяна, которые дальше чинит BM25.',
        ],
      },
    },
    { id: 'climb-bm25', kind: 'scrolly', widget: 'bm25-calc', data: 'l3-bm25' },
    {
      id: 'turn-fusion', kind: 'prose',
      heading: { en: 'One ranker is never enough', ru: 'Одного ранкера всегда мало' },
      body: {
        en: [
          "BM25 is a workhorse, but it's one opinion. A second ranker — say, cosine over TF-IDF vectors — sees the same documents differently. When two good rankers disagree, the smart move isn't to pick a favourite; it's to *fuse* their votes. But their scores live on incomparable scales, so you can't just add them.",
        ],
        ru: [
          'BM25 — рабочая лошадка, но это одно мнение. Второй ранкер — скажем, косинус по TF-IDF векторам — видит те же документы иначе. Когда два хороших ранкера расходятся, умный ход не в том, чтобы выбрать любимчика, а в том, чтобы *слить* их голоса. Но их оценки живут на несравнимых шкалах, поэтому просто сложить их нельзя.',
        ],
      },
    },
    { id: 'climb-rrf', kind: 'scrolly', widget: 'rrf-fusion', data: 'l3-rrf' },
    {
      id: 'catch-gremlin', kind: 'prose',
      heading: { en: 'The Lexical Gremlin laughs', ru: 'Лексический Гремлин смеётся' },
      body: {
        en: [
          "There's a catch, and he's grinning. BM25, RRF, the whole classical catalog — they all match on *exact words*. Search “couch” and a perfect document that says “sofa” scores zero. The **Lexical Gremlin** wedges his wall between every pair of synonyms, and no amount of clever weighting climbs over it. To beat him we'll have to stop matching words and start matching *meaning*.",
        ],
        ru: [
          'Есть подвох, и он ухмыляется. BM25, RRF, весь классический каталог — все они совпадают по *точным словам*. Ищешь «диван» — и идеальный документ со словом «кушетка» получает ноль. **Лексический Гремлин** ставит свою стену между каждой парой синонимов, и никакое хитрое взвешивание её не перелезет. Чтобы победить его, придётся перестать совпадать по словам и начать совпадать по *смыслу*.',
        ],
      },
    },
    {
      id: 'payoff-catalog', kind: 'prose',
      heading: { en: 'The catalog is built', ru: 'Каталог построен' },
      body: {
        en: [
          "So we have a Ship that finds *fast*: an inverted index for instant lookup, BM25 to rank, RRF to fuse. It's the baseline every fancy neural method will have to beat — and you'd be surprised how often it wins. Two questions remain. First: how do we even *know* one ranking is better than another? That's the next chapter, The Proving Grounds. Second: how do we finally cage the Gremlin? That's the chapter after — when words get coordinates.",
        ],
        ru: [
          'Итак, у нас есть Корабль, который ищет *быстро*: инвертированный индекс для мгновенного поиска, BM25 для ранжирования, RRF для слияния. Это базовая планка, которую придётся брать каждому модному нейронному методу — и ты удивишься, как часто она побеждает. Остаются два вопроса. Первый: как вообще *понять*, что один порядок лучше другого? Это следующая глава — «Полигон». Второй: как наконец посадить Гремлина в клетку? Это глава за ней — когда слова получат координаты.',
        ],
      },
    },
  ],
};
