    {
      id: 'three-gaps', kind: 'prose',
      heading: { en: 'Change the query, not the retriever', ru: 'Меняй запрос, а не ретривер', tt: 'Ретриверны түгел, сорауны үзгәрт' },
      body: {
        en: [
          "When retrieval fails, the reflex is to blame the retriever — swap the encoder, retrain the index, buy a bigger model. Resist it. The far cheaper fix is usually the other side of the arrow: **change the query, not the retriever.** The corpus is fine; the *question* is malformed for the shelves it must search.",
          "A raw, human-typed query fails in three distinct ways, and naming which one you have is the whole skill. There is the **vocabulary gap** — right meaning, wrong words. There is the **specificity gap** — the query is pitched at the wrong altitude, too specific to match a principle, or too vague to match a fact. And there is the **compositionality gap** — one question whose pieces of evidence live in *different* passages that no single retrieval can gather.",
          "One instrument closes all three: a language model reshaping the query before it reaches the door. But every reshape is at least one extra **LLM call** — latency, money, and a fresh surface for the model to hallucinate on. Rewriting is high-ROI, never free. So the real craft is *diagnosis*: read the failure, name the gap, and reach for the one stroke that fits it.",
        ],
        ru: [
          "Когда поиск проваливается, рефлекс — винить ретривер: сменить энкодер, переобучить индекс, купить модель побольше. Не поддавайся. Гораздо дешевле почти всегда другая сторона стрелки: **меняй запрос, а не ретривер.** С корпусом всё в порядке; это *вопрос* сформулирован не под те полки, где ему искать.",
          "Сырой, набранный человеком запрос проваливается тремя разными способами, и назвать, который из них у тебя, — и есть всё мастерство. Есть **словарный разрыв** — смысл верный, слова не те. Есть **разрыв специфичности** — запрос взят не на той высоте: слишком конкретен, чтобы попасть в принцип, или слишком расплывчат, чтобы попасть в факт. И есть **разрыв композициональности** — один вопрос, чьи улики лежат в *разных* пассажах, которых ни один поиск не соберёт за раз.",
          "Один инструмент закрывает все три: языковая модель, перекраивающая запрос до того, как он дойдёт до двери. Но каждая перекройка — минимум один лишний **вызов LLM**: задержка, деньги и свежая поверхность, на которой модель может нафантазировать. Переписывание — высокая отдача, но никогда не бесплатно. Поэтому настоящее ремесло — это *диагноз*: прочти провал, назови разрыв и потянись за тем единственным росчерком, который ему подходит.",
        ],
        tt: [
          "Эзләү уңышсыз булганда, рефлекс — ретриверны гаепләү: энкодерны алыштыр, индексны яңадан өйрәт, зуррак модель сатып ал. Бирешмә. Күпкә арзаны — гадәттә укның икенче ягы: **ретриверны түгел, сорауны үзгәрт.** Корпус белән бар да яхшы; бу *сорау* эзләргә тиешле киштәләргә карата дөрес формалашмаган.",
          "Кеше язган чи сорау өч төрле рәвештә уңышсыз була, ә кайсы синдә икәнен атау — ул бөтен осталык. **Лексик ярык** бар — мәгънә дөрес, сүзләр түгел. **Конкретлык ярыгы** бар — сорау дөрес булмаган биеклектә: принципка туры килерлек артык конкрет, яки фактка туры килерлек артык томанлы. Һәм **композициональлек ярыгы** бар — бер сорау, аның дәлилләре *төрле* пассажларда ята, аларны бер эзләү дә бергә җыя алмый.",
          "Бер корал өчесен дә яба: сорауны ишеккә җиткәнче яңадан кискән тел моделе. Ләкин һәр кисү — кимендә бер артык **LLM чакыруы**: тоткарлык, акча һәм модель уйдырма чыгара алырлык яңа өслек. Яңадан язу — югары кайтарым, ләкин беркайчан да бушка түгел. Шуңа күрә чын һөнәр — ул *диагноз*: уңышсызлыкны укы, ярыкны ата һәм аңа туры килгән бердәнбер сызыкка үрел.",
        ],
      },
    },
