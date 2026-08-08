    {
      id: 'lemma-vs-stem', kind: 'prose',
      heading: { en: 'Stemming vs lemmatization', ru: 'Стемминг против лемматизации', tt: 'Стемминг каршы лемматизация' },
      body: {
        en: [
          "There are two ways to fold the forms. **Stemming** applies rules to chop an ending, producing a stem that need not be a real word (Snowball/Porter for Russian): cheap, context-blind, and prone to over- or under-stemming that conflates unrelated words. **Lemmatization** maps to the dictionary form using a morphological dictionary, and it can disambiguate homonyms — *стали* is *steel* in one reading and *became* in another.",
          "For BM25, stemming is the fast default and lemmatization the precision option, worth its cost when exact meaning matters and homonymy must be resolved. Russian has a mature, CPU-cheap toolbox for both: Snowball, pymorphy2, Mystem, the spaCy/Stanza pipelines, and the built-in Elasticsearch/OpenSearch *russian* analyzer.",
          "The one non-negotiable rule, whichever you pick: apply the **same** normalization to the query and to the corpus. Normalize the index but not the query — or the reverse — and you reintroduce the very mismatch you were trying to remove.",
        ],
        ru: [
          "Свести формы можно двумя способами. **Стемминг** правилами отрезает окончание, давая основу, которая не обязана быть словом (Snowball/Porter для русского): дёшево, без учёта контекста и с риском срезать слишком много или слишком мало (over-/under-stemming) и склеить чужие слова. **Лемматизация** приводит к словарной форме по морфологическому словарю и умеет снимать омонимию: *стали* — это и *сталь*, и *стать*.",
          "Для BM25 стемминг — быстрый дефолт, лемматизация — вариант точности, оправданный, когда важен точный смысл и надо снять омонимию. У русского зрелый и дешёвый по CPU инструментарий: Snowball, pymorphy2, Mystem, пайплайны spaCy/Stanza и встроенный аналайзер *russian* в Elasticsearch/OpenSearch.",
          "Единственное непреложное правило, каким бы ни был выбор: применяй **одну и ту же** нормализацию к запросу и к корпусу. Нормализуешь индекс, но не запрос — или наоборот — и возвращаешь ровно тот рассинхрон, который пытался убрать.",
        ],
        tt: [
          "Формаларны кайтарырга ике ысул бар. **Стемминг** кагыйдәләр белән кушымчаны кисә, сүз булырга тиеш булмаган нигез бирә (рус өчен Snowball/Porter): арзан, контекстны исәпкә алмый, чит сүзләрне ябыштыручы over/under-stemming куркынычы белән. **Лемматизация** морфологик сүзлек буенча сүзлек формасына кайтара һәм омонимияне чишә ала — *стали* бер укуда *сталь*, икенчесендә *стать*.",
          "BM25 өчен стемминг — тиз default, лемматизация — төгәллек варианты, төгәл мәгънә мөһим булганда һәм омонимияне чишәргә кирәк булганда акланган. Русның өлгергән, CPU буенча арзан коралы бар: Snowball, pymorphy2, Mystem, spaCy/Stanza пайплайннары һәм Elasticsearch/OpenSearch\'тагы кертелгән *russian* анализаторы.",
          "Нәрсә генә сайласаң да, бердәнбер бозылмас кагыйдә: сорауга да, корпуска да **бер үк** нормальләштерүне куллан. Индексны нормальләштереп, сорауны түгел — яки киресенчә — син нәкъ бетерергә теләгән рассинхронны кире кайтарасың.",
        ],
      },
    },
