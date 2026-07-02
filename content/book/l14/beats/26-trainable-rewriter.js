    {
      id: 'trainable-rewriter', kind: 'prose',
      heading: { en: 'The quill that learns', ru: 'Перо, которое учится', tt: 'Өйрәнә торган каләм' },
      body: {
        en: [
          "Everything so far leaned on a *frozen* quill: a prompted rewriter that drafts a hypothetical answer, steps back, fans out, decomposes — but never remembers whether the rewrite actually helped. It is generic by construction. Change the archive, change the retriever, and the same generic prompt keeps drafting the same generic rewrites. So the natural question, the pivot from enchantment to apprenticeship, is simple: *can the quill learn?*",
          "**RRR** — Rewrite-Retrieve-Read (Ma) — answers yes. Put a small language model in front of the pipeline as the rewriter, run the full loop, and let the *downstream answer* be the teacher. Did the rewritten query lead to a passage that produced a correct answer? Reward it. Did it retrieve noise? Punish it. Train the rewriter by reinforcement learning on that final reward, not on any hand-labelled 'good rewrite'.",
          "This is the quill sharpening its own nib. The prompted rewriter is a tool a smith hands you; the trained rewriter is a tool that files itself against the one archive and the one reader it serves — until its edge matches the wood it has to cut.",
        ],
        ru: [
          "Всё до сих пор опиралось на *замороженное* перо: подсказанный переписчик набрасывает гипотетический ответ, делает шаг назад, разворачивается веером, раскладывает вопрос на части — но никогда не помнит, помог ли переписанный запрос на самом деле. Оно универсально по своей природе. Смени архив, смени ретривер — и тот же универсальный промпт продолжит набрасывать те же универсальные переписи. Поэтому естественный вопрос, поворот от волшебства к ученичеству, прост: *а может ли перо учиться?*",
          "**RRR** — Rewrite-Retrieve-Read (Ma) — отвечает: да. Поставь маленькую языковую модель в начало конвейера как переписчика, прогони весь цикл и сделай учителем *итоговый ответ*. Привёл ли переписанный запрос к пассажу, из которого родился верный ответ? Награди его. Достал шум? Накажи. Обучай переписчика обучением с подкреплением на этой финальной награде, а не на размеченной вручную «хорошей переписи».",
          "Это перо, которое само правит своё остриё. Подсказанный переписчик — инструмент, что вручает тебе кузнец; обученный переписчик — инструмент, что сам обтачивается под тот единственный архив и того единственного читателя, которым служит, — пока его кромка не совпадёт с деревом, которое ему резать.",
        ],
        tt: [
          "Хәзергә кадәр барысы да *туңдырылган* каләмгә таянды: кушылган күчереп язучы фаразый җавап сыза, бер адым артка чигенә, җилпәзә кебек җәелә, сорауны кисәкләргә тарката — ләкин күчереп язылган сорау чыннан да ярдәм иттеме, беркайчан да хәтерләми. Ул табигате буенча гомуми. Архивны алыштыр, ретриверны алыштыр — шул ук гомуми промпт шул ук гомуми күчермәләрне сызуын дәвам итә. Шуңа күрә табигый сорау, сихердән шәкертлеккә борылыш, гади: *каләм өйрәнә аламы?*",
          "**RRR** — Rewrite-Retrieve-Read (Ma) — әйе дип җавап бирә. Кечкенә тел моделен конвейер башына күчереп язучы итеп куй, тулы циклны эшләт һәм *ахыргы җавапны* остаз ит. Күчереп язылган сорау дөрес җавап туган пассажга китердеме? Аны бүләклә. Шау-шу тартып чыгардымы? Җәзала. Күчереп язучыны шул ахыргы бүләккә reinforcement learning белән өйрәт, кул белән билгеләнгән «яхшы күчермә»гә түгел.",
          "Бу — үз очын үзе үткенли торган каләм. Кушылган күчереп язучы — тимерче тоттырган корал; өйрәтелгән күчереп язучы — үзе хезмәт иткән бердәнбер архивга һәм бердәнбер укучыга үзен үзе шомарта торган корал — кырые кисәсе агачка туры килгәнче.",
        ],
      },
    },
