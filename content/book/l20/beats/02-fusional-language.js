    {
      id: 'fusional-language', kind: 'prose',
      heading: { en: 'Russian is fusional: the ending carries the grammar', ru: 'Русский флективен: окончание несёт грамматику', tt: 'Рус флектив: кушымча грамматиканы йөртә' },
      body: {
        en: [
          "The reason is a fact about the language. Russian is **fusional**: a single ending fuses several grammatical values at once. The **-ами** in *запросами* encodes both the instrumental case and the plural in one morpheme, and stems alternate as they inflect (котёнок → котята). A noun spans **6 cases × 2 numbers**; a verb adds person, tense, aspect and mood — one verb, dozens of forms.",
          "English is weakly inflected with a visible stem — *cat/cats*, *play/played/playing* — which is exactly why lexical search *mostly works* in English and quietly fails in Russian. In Russian the root often hides behind the ending, so the string a user types and the string the corpus stored are simply different.",
          "Everything downstream inherits this one fact. The tokenizer trips on the endings (the token tax), the keyword index cannot match across forms (the surface-form miss), and even the choice of embedder turns on whether the model ever saw those endings in training. Three bills, one cause.",
        ],
        ru: [
          "Причина — свойство самого языка. Русский **флективен**: одно окончание сплавляет сразу несколько грамматических значений. **-ами** в *запросами* кодирует и творительный падеж, и множественное число одной морфемой, а основа чередуется при словоизменении (котёнок → котята). Существительное — это **6 падежей × 2 числа**; глагол добавляет лицо, время, вид и наклонение — один глагол, десятки форм.",
          "Английский слабо флективен, корень виден — *cat/cats*, *play/played/playing*, — именно поэтому лексический поиск *почти работает* по-английски и тихо проваливается по-русски. В русском корень часто спрятан за окончанием, и строка, которую набрал пользователь, и строка в корпусе просто разные.",
          "Всё, что дальше, наследует этот единственный факт. Токенизатор спотыкается об окончания (токен-налог), keyword-индекс не совпадает между формами (промах по формам), и даже выбор эмбеддера зависит от того, видела ли модель эти окончания при обучении. Три счёта, одна причина.",
        ],
        tt: [
          "Сәбәп — тел үзенең үзлеге. Рус — **флектив**: бер кушымча берьюлы берничә грамматик мәгънәне эретә. *запросами* сүзендәге **-ами** творительный падежны да, күплекне дә бер морфемада кодлый, ә нигез сүз үзгәргәндә алмаша (котёнок → котята). Исем — **6 килеш × 2 сан**; фигыль зат, заман, вид һәм наклонение өсти — бер фигыль, дистәләрчә форма.",
          "Инглиз көчсез флектив, тамыр күренә — *cat/cats*, *play/played/playing* — нәкъ шуңа лексик эзләү инглизчә *диярлек эшли* һәм русча тавышсыз җимерелә. Русча тамыр еш кына кушымча артында яшеренә, һәм кулланучы җыйган юл белән корпустагы юл жәй генә төрле.",
          "Аннан соңгы бөтен нәрсә шушы бер фактны мирас итә. Токенизатор кушымчаларга абына (токен-налог), keyword-индекс формалар арасында туры килми (форма буенча промах), һәм хәтта эмбеддер сайлау да model бу кушымчаларны өйрәнгәндә күргәнме-юкмы дигәнгә бәйле. Өч хисап, бер сәбәп.",
        ],
      },
    },
