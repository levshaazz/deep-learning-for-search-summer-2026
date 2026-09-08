    {
      id: 'catch-not-the-cyrillic', kind: 'prose',
      heading: { en: 'It is not the Cyrillic', ru: 'Дело не в кириллице', tt: 'Эш кириллицада түгел' },
      body: {
        en: [
          "The single most common belief about Russian search is that the alphabet is to blame — and it is a wrong diagnosis, which is worse than no diagnosis, because it buys a wrong cure: a transliteration pipeline, a forced ASCII folding, an encoding audit that finds nothing. BM25 is **alphabet-agnostic**. It tests string equality and does not care which bytes sit inside the string.",
          "Falsifying the myth takes a minute, and it is worth doing once with your own hands. Romanize the corpus and the query together and run the whole thing again: *kotyata* still misses *kotenok*, exactly as *котята* missed *котёнок*, and the token tax does not go away either — those letter sequences are not English words either. Two mechanisms broke your search, and neither of them is the script: the skew of the tokenizer's training mix, and the fusionality of the language.",
          "Keep those two apart, because they are cured at different stages by different people. The vocabulary is decided when you choose a model — this act, and in practice a procurement decision. The forms are folded when you build the index — the next act, and in practice one line in an analyzer. The alphabet changes the bytes, not the retrieval.",
        ],
        ru: [
          "Самое частое, во что верят про русский поиск, — что виноват алфавит. Это неверный диагноз, а неверный диагноз хуже, чем никакого: он покупает неверное лечение — конвейер транслитерации, принудительное сведение к ASCII, аудит кодировок, который ничего не находит. BM25 **алфавит-агностичен**: он проверяет равенство строк, и какие внутри байты, ему безразлично.",
          "Опровергнуть миф — минута работы, и её стоит проделать руками ровно один раз. Переведи корпус и запрос на латиницу разом и прогони всё заново: *kotyata* так же промахнётся мимо *kotenok*, как *котята* промахивались мимо *котёнок*, и токен-налог никуда не денется — слияния для этих последовательностей букв никто и не покупал. Твой поиск сломали два механизма, и ни один из них не графика: перекос обучающей смеси токенизатора и флективность языка.",
          "Держи эти два механизма врозь, потому что лечат их на разных этапах и разные люди. Словарь решается при выборе модели — это текущий акт и, по сути, закупка. Формы сводятся при сборке индекса — это следующий акт и, по сути, одна строка в аналайзере. Алфавит меняет байты, а не поиск.",
        ],
        tt: [
          "Рус эзләү турында иң еш ышана торган нәрсә — гаепле алфавит дигән фикер. Бу — ялгыш диагноз, ә ялгыш диагноз бөтенләй юктан да яманрак: ул ялгыш дару сатып ала — транслитерация конвейеры, көчләп ASCII'га кайтару, бернәрсә тапмый торган кодировка аудиты. BM25 **алфавит-агностик**: ул юллар тигезлеген тикшерә, ә эчендәге байтлар аңа барыбер.",
          "Мифны кире кагу — бер минутлык эш, һәм аны кул белән нәкъ бер тапкыр эшләргә кирәк. Корпусны да, сорауны да берьюлы латинга күчер һәм барысын яңадан җибәр: *kotyata* *kotenok* яныннан нәкъ *котята* *котёнок* яныннан узган кебек узып китәчәк, һәм токен-налог та беркая китмәячәк — ул хәреф эзлеклелекләре өчен слиянияләрне беркем сатып алмаган да. Синең эзләвеңне ике механизм ватты, һәм аларның берсе дә язу түгел: токенизаторның өйрәтү катнашмасы авышуы һәм телнең флективлыгы.",
          "Бу ике механизмны аерым тот, чөнки аларны төрле адымнарда һәм төрле кешеләр дәвалый. Сүзлек model сайлаганда хәл ителә — бу шушы акт һәм, асылда, сатып алу. Формалар индекс җыйганда кайтарыла — бу киләсе акт һәм, асылда, анализатордагы бер юл. Алфавит байтларны үзгәртә, эзләүне түгел.",
        ],
      },
    },
