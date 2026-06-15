    {
      id: 'depth-two-ways-to-use-encoder', kind: 'prose',
      heading: { en: 'Two ways to use an encoder', ru: 'Два способа применить энкодер', tt: 'Энкодерны куллануның ике юлы' },
      body: {
        en: [
          "Lecture 6 left us a contrastively-trained encoder that turns text into a vector in a search-tuned space. There are exactly **two ways** to put it to work on a (query, document) pair. **Encode them apart** — run the encoder twice, once on each, and compare the two vectors. Or **encode them together** — concatenate the pair into one input and let attention mix them before scoring. That single fork — apart versus together — *is* this lecture: the first is the bi-encoder, cheap and cacheable; the second is the cross-encoder, accurate and uncacheable.",
        ],
        ru: [
          'Лекция 6 оставила нам контрастно обученный энкодер, превращающий текст в вектор в заточенном под поиск пространстве. Есть ровно **два способа** применить его к паре (запрос, документ). **Кодировать порознь** — прогнать энкодер дважды, по разу на каждом, и сравнить два вектора. Или **кодировать вместе** — склеить пару в один вход и дать вниманию перемешать их ещё до оценки. Эта развилка — порознь против вместе — *и есть* вся лекция: первое — би-энкодер, дёшево и кэшируемо; второе — кросс-энкодер, точно и без кэша.',
        ],
        tt: [
          '6 нче лекция безгә контрастлы өйрәтелгән энкодер калдырды, ул текстны эзләүгә көйләнгән киңлектәге векторга әйләндерә. Аны (сорау, документ) парына кулланырга нәкъ **ике юл** бар. **Аерым кодлау** — энкодерны ике тапкыр җибәрү, һәркайсына берәр, аннары ике векторны чагыштыру. Яки **бергә кодлау** — парны бер керемгә ябыштыру һәм бәяләгәнче игътибарга аларны бутарга бирү. Бу аерылыш — аерым яки бергә — *менә шул* лекция: беренчесе — би-энкодер, арзан һәм кэшләнә; икенчесе — кросс-энкодер, төгәл һәм кэшләнми.',
        ],
      },
    },
