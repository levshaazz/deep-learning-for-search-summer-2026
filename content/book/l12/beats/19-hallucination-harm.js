    {
      id: 'hallucination-harm', kind: 'prose',
      heading: { en: 'Hallucination is the harm', ru: 'Галлюцинация — это вред', tt: 'Галлюцинация — зыян' },
      body: {
        en: [
          "Start with the harm that is easiest to demonstrate and hardest to catch. We asked **llama3.1:8b** about the *\"Quasar-9 vector database\"* — a **fictional** entity that does not exist. There is no right answer; the only honest response is *\"I don't know.\"*",
          "**Closed-book**, with nothing retrieved, the model does **not** abstain. It confabulates concrete features — *\"a collection of 9000 vectors… large-scale dataset…\"* — fluent, confident, and entirely invented. To a user, this is **indistinguishable** from a true answer; that is precisely what makes it dangerous.",
          "Now **ground** the same question in a retrieved context stating that no such database exists. The model **abstains**: *\"I cannot answer this question. The context does not provide any information…\"* Same model, same question — grounding plus the freedom to refuse turns a confident fabrication into an honest refusal. **Hallucination is the harm; grounding plus abstention is the control.**",
        ],
        ru: [
          "Начнём с вреда, который проще всего показать и труднее всего поймать. Мы спросили **llama3.1:8b** про *«векторную базу данных Quasar-9»* — **вымышленную** сущность, которой не существует. Правильного ответа нет; единственный честный ответ — *«я не знаю».*",
          "**Без контекста**, с пустым поиском, модель **не** воздерживается. Она конфабулирует конкретные характеристики — *«коллекция из 9000 векторов… крупномасштабный датасет…»* — бегло, уверенно и полностью выдуманно. Для пользователя это **неотличимо** от истинного ответа; ровно это и делает её опасной.",
          "Теперь **заземли** тот же вопрос в извлечённом контексте, гласящем, что такой базы не существует. Модель **воздерживается**: *«Я не могу ответить на этот вопрос. Контекст не содержит никакой информации…»* Та же модель, тот же вопрос — заземление плюс свобода отказать превращают уверенную фабрикацию в честный отказ. **Галлюцинация — это вред; заземление плюс воздержание — это контроль.**",
        ],
        tt: [
          "Күрсәтергә иң җиңел һәм тотарга иң авыр зыяннан башлыйк. Без **llama3.1:8b** дан *«Quasar-9 вектор мәгълүмат базасы»* турында сорадык — **уйдырма** берәмлек, ул юк. Дөрес җавап юк; бердәнбер намуслы җавап — *«мин белмим».*",
          "**Контекстсыз**, буш эзләү белән, модель **баш тартмый**. Ул конкрет үзенчәлекләрне конфабуляцияли — *«9000 вектордан торган җыелма… зур масштаблы датасет…»* — шома, ышанычлы һәм тулысынча уйлап чыгарылган. Кулланучы өчен бу чын җаваптан **аерылмый**; нәкъ менә шул аны куркыныч итә.",
          "Хәзер шул ук сорауны мондый база юк дип әйткән алынган контекстта **нигезлә**. Модель **баш тарта**: *«Мин бу сорауга җавап бирә алмыйм. Контекст бернинди мәгълүмат бирми…»* Шул ук модель, шул ук сорау — нигезләү плюс баш тарту иреге ышанычлы уйдырманы намуслы баш тартуга әйләндерә. **Галлюцинация — зыян; нигезләү плюс баш тарту — контроль.**"
        ],
      },
    },
