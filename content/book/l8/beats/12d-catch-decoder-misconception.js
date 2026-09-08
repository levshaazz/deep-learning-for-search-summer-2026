    {
      id: 'catch-decoder-misconception', kind: 'prose',
      heading: { en: "A decoder is not a lesser encoder", ru: "Декодер — не «энкодер похуже»", tt: "Decoder — «зәгыйфьрәк encoder» түгел" },
      body: {
        en: [
          "Two myths ride together here, and both are worth breaking. First: “a decoder is just for generating text — a crippled encoder that lost half its sight”. No. The curtain is not a defect; it is a *different reading contract*. The encoder's contract: see the whole cloth, both sides of every thread — and so it reads. The decoder's contract: see only the left side, because its craft is laying the *next* thread — and so it writes. And a next-token LM is no narrow gadget: the same single objective carries classification, translation, code, step-by-step reasoning — anything you can phrase as “continue this text”.",
          "Second myth: “more parameters = more understanding”. The objective is to predict a *plausible* next token — plausible, not true. Scale buys fluency and reach; by itself it buys neither truth nor intent. Size is not alignment — that gap is exactly what RLHF exists to close, at the end of this chapter. So choose by contract, not by prestige: need to *read* a finished text deeply — take the reader; need to *write* one forward — take the writer.",
        ],
        ru: [
          "Здесь ездят парой два мифа, и оба стоит сломать. Первый: «декодер — это только генерация текста, покалеченный энкодер, потерявший полглаза». Нет. Занавес — не дефект, а *другой контракт чтения*. Контракт энкодера: видеть всё полотно, обе стороны каждой нити — потому он читает. Контракт декодера: видеть только левую сторону, потому что его ремесло — класть *следующую* нить, — потому он пишет. И next-token LM — не узкий гаджет: один и тот же objective везёт классификацию, перевод, код, пошаговые рассуждения — всё, что можно сформулировать как «продолжи этот текст».",
          "Второй миф: «больше параметров — больше понимания». Objective — предсказать *правдоподобный* следующий токен; правдоподобный, а не истинный. Масштаб покупает беглость и охват, но сам по себе не покупает ни истину, ни намерение. Размер — не выравнивание: этот зазор и закрывает RLHF в конце главы. Так что выбирай по контракту, а не по престижу: нужно глубоко *прочитать* готовый текст — бери читателя; нужно *написать* его вперёд — бери писателя.",
        ],
        tt: [
          "Монда ике миф парлап йөри, икесен дә ватарга кирәк. Беренчесе: «decoder — текст тудыру өчен генә, ярты күзен югалткан имгәнгән encoder». Юк. Пәрдә — кимчелек түгел, *башка уку килешүе*. Encoder килешүе: бөтен тукыманы, һәр җепнең ике ягын күрү — шуңа ул укый. Decoder килешүе: сул якны гына күрү, чөнки аның һөнәре — *киләсе* җепне салу, — шуңа ул яза. Һәм next-token LM тар корал түгел: бер үк objective классификацияне, тәрҗемәне, кодны, адымлап фикерләүне күтәрә — «бу текстны дәвам ит» дип әйтеп була торган һәрнәрсәне.",
          "Икенче миф: «күбрәк параметр — күбрәк аңлау». Objective — *ышандыргыч* киләсе token'ны фаразлау; ышандыргыч, хак түгел. Масштаб йөгереклек һәм колач сатып ала, ләкин үзеннән-үзе хакыйкатьне дә, ниятне дә бирми. Зурлык — тигезләү түгел: нәкъ шул ярыкны глава ахырында RLHF яба. Шуңа дәрәҗәгә түгел, килешүгә карап сайла: әзер текстны тирән *укырга* кирәк — укучыны ал; аны алга *язарга* кирәк — язучыны ал.",
        ],
      },
    },
