    {
      id: 'query2doc', kind: 'prose',
      heading: { en: "HyDE's sparse twin", ru: 'Разреженный близнец HyDE', tt: "HyDE'ның сирәк игезәге" },
      body: {
        en: [
          "HyDE lives in dense-embedding space, but its idea has a **sparse twin** for the world of BM25 and inverted indexes: **Query2doc**. The recipe rhymes — prompt the LLM to write a short pseudo-document that answers the query — but instead of embedding it, you *concatenate* the pseudo-doc onto the original query and hand the whole string to a keyword retriever.",
          "Why does bolting a made-up paragraph onto the query help a lexical engine? Because BM25 can only match words it can *see*, and the raw query simply lacks the archive's words — it never says under-extraction. The pseudo-doc *supplies those missing terms*, so the expanded query now overlaps the gold passage on the very vocabulary that used to be absent. It is the same vocabulary-gap cure, delivered through term overlap rather than through geometry.",
          "And it inherits the same *shape* of trade-off. The biggest lift comes exactly where the base retriever is weak and label-poor — **sparse or zero-shot** settings — while against a strong, fine-tuned dense retriever the gain shrinks to a sliver, because that model had already learned the missing words on its own. Cheap magic where you're poor; near-nothing where you're already rich.",
        ],
        ru: [
          "HyDE живёт в пространстве плотных эмбеддингов, но у его идеи есть **разреженный близнец** для мира BM25 и инвертированных индексов — **Query2doc**. Рецепт рифмуется: попроси LLM написать короткий псевдодокумент, отвечающий на запрос, — но вместо того чтобы встраивать его, ты *приклеиваешь* псевдодок к исходному запросу и отдаёшь всю строку целиком поиску по ключевым словам.",
          "Почему приклеенный выдуманный абзац помогает лексическому движку? Потому что BM25 умеет совпадать лишь по словам, которые *видит*, а сырому запросу попросту не хватает слов архива — он ни разу не скажет «недоэкстракция». Псевдодок *подставляет эти недостающие термины*, и расширенный запрос теперь пересекается с золотым пассажем ровно по той лексике, которой раньше не было. То же лекарство от словарной бреши, поданное через пересечение терминов, а не через геометрию.",
          "И наследует ту же *форму* компромисса. Наибольший прирост — ровно там, где базовый ретривер слаб и беден метками, в **разреженных или zero-shot** режимах; а против сильного дообученного плотного ретривера выигрыш ужимается до полоски, потому что та модель и сама уже выучила недостающие слова. Дешёвое чудо там, где ты беден; почти ничего там, где ты уже богат.",
        ],
        tt: [
          "HyDE тыгыз embedding пространствосында яши, ләкин аның идеясының BM25 һәм инверсияләнгән индекслар дөньясы өчен **сирәк игезәге** бар — **Query2doc**. Рецепт рифмалаша: LLM'нан сорауга җавап бирүче кыска псевдодокумент язуын үтен — ләкин аны embed итү урынына, син псевдодокны асыл сорауга *ябыштырасың* һәм бөтен юлны ачкыч сүз буенча эзләүгә бирәсең.",
          "Ни өчен ябыштырылган уйдырма абзац лексик двигательгә ярдәм итә? Чөнки BM25 бары *күргән* сүзләр буенча гына туры килә ала, ә чи сорауда архив сүзләре юк — ул бервакытта да «under-extraction» димәс. Псевдодок *шул җитмәгән терминнарны куя*, һәм киңәйтелгән сорау хәзер алтын пассаж белән нәкъ элек булмаган лексика буенча кисешә. Шул ук сүзлек ярыгы дәвасы, геометрия аша түгел, термин кисешүе аша бирелгән.",
          "Һәм ул шул ук компромисс *формасын* мирас итеп ала. Иң зур өстәмә — нәкъ база ретривер көчсез һәм билге ягыннан ярлы булган җирдә, **сирәк яки zero-shot** режимнарда; ә көчле дообучение ясалган тыгыз ретриверга каршы отыш кечкенә тасмага кадәр кими, чөнки ул модель җитмәгән сүзләрне үзе үк өйрәнгән иде. Ярлы җиреңдә арзан могҗиза; инде бай җиреңдә диярлек бернәрсә дә.",
        ],
      },
    },
