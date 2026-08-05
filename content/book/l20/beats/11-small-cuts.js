    {
      id: 'small-cuts', kind: 'prose',
      heading: { en: 'A thousand small cuts', ru: 'Тысяча мелких порезов', tt: 'Мең вак кисем' },
      body: {
        en: [
          "Even with the right model and normalization, recall leaks through Russian orthographic edge cases — each trivial alone, together a real hole, each healed by one line of preprocessing. The **ё/е** collapse: *ёлка* is routinely written *елка*, one word split into two strings; normalize ё→е symmetrically. **Case**: lowercase both arms so *москва* matches *Москва*, but keep a case-preserving field where an acronym like *МИР* must not merge with *мир*.",
          "**Transliteration and code-switching**: users type *Moskva* for *Москва* and drop English brand and tech terms into Russian sentences; expand queries with transliteration variants or lean on a multilingual embedder whose space already spans both scripts. And the uniquely Russian **keyboard-layout typo**: type *привет* on the English layout and out comes *ghbdtn* — same keys, Latin letters, meaningless to the index — fixed by a deterministic ЙЦУКЕН↔QWERTY key map plus a *did you mean*.",
          "The unifying principle is the whole chapter's: fold the query and the corpus to one form, with one code path, in both arms. The small things are cheap alone and costly in aggregate.",
        ],
        ru: [
          "Даже с правильной моделью и нормализацией полнота течёт через орфографические края русского — каждый пустяк поодиночке, вместе заметная дыра, и каждый лечится одной строкой предобработки. Схлопывание **ё/е**: *ёлка* сплошь пишут *елка*, одно слово в двух строках; нормализуй ё→е симметрично. **Регистр**: строчи оба плеча, чтобы *москва* совпало с *Москва*, но держи поле с сохранением регистра, где аббревиатура *МИР* не должна слиться с *мир*.",
          "**Транслит и переключение языков**: пользователи пишут *Moskva* вместо *Москва* и вставляют английские бренды и техслова в русские фразы; расширяй запрос транслит-вариантами или опирайся на мультиязычный эмбеддер, чьё пространство уже охватывает обе графики. И уникально русская **ошибка раскладки**: наберёшь *привет* на английской раскладке — выйдет *ghbdtn*, те же клавиши, латиница, бессмыслица для индекса — чинится детерминированной картой ЙЦУКЕН↔QWERTY плюс *возможно, вы искали*.",
          "Объединяющий принцип — тот же, что вся глава: сведи запрос и корпус к одной форме, одним кодом, в обоих плечах. Мелочи дёшевы поодиночке и дороги в сумме.",
        ],
        tt: [
          "Дөрес model һәм нормальләштерү белән дә русның орфографик кырлары аша тулылык ага — һәрберсе аерым вак, бергә сизелерлек тишек, һәм һәрберсе бер юл препроцессинг белән дәваланá. **ё/е** кушылуы: *ёлка* гел *елка* дип языла, бер сүз ике юлда; ё→е\'ны симметрик нормальләштер. **Регистр**: *москва* *Москва*\'га туры килсен өчен ике җилкәне дә кечкенә хәреф ит, ләкин *МИР* аббревиатурасы *мир* белән кушылмаска тиеш булган регистр саклаучы кыр тот.",
          "**Транслит һәм тел алмаштыру**: кулланучылар *Москва* урынына *Moskva* яза һәм рус җөмләләренә инглиз брендларын, техник сүзләрен куя; сорауны транслит вариантлары белән киңәйт яки киңлеге ике язуны да каплаган мультител эмбеддерга таян. Һәм русча гына булган **раскладка хатасы**: инглиз раскладкасында *привет* җыйсаң — *ghbdtn* чыга, шул ук клавишалар, латин хәрефләре, индекс өчен мәгънәсез — детерминик ЙЦУКЕН↔QWERTY картасы плюс *бәлки эзләгәнегез* белән төзәтелә.",
          "Берләштерүче принцип — бөтен бүлекнеке: сорау белән корпусны бер формага, бер код белән, ике җилкәдә дә кайтар. Ваклар аерым арзан, суммада кыйммәт.",
        ],
      },
    },
