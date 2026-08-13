    {
      id: 'depth-pretraining-recipe', kind: 'prose',
      heading: { en: 'The modern recipe', ru: 'Современный рецепт', tt: 'Хәзерге рецепт' },
      body: {
        en: [
          "A state-of-the-art embedder is built in **three stages**. First, **self-supervised pretraining** with no labels — the Inverse Cloze Task (a sentence as a pseudo-query against its context), Contriever (random crops with a momentum queue), or RetroMAE. Second, **weakly-supervised contrastive** learning on hundreds of millions of mined pairs at huge batch size — E5 uses about 270M pairs.",
          "Third, **supervised fine-tuning** with mined hard negatives and cross-encoder distillation. The payoff: E5 was the first model to beat BM25 *zero-shot* on BEIR. And with no in-domain labels at all, **GPL** generates synthetic queries and pseudo-labels them with a cross-encoder, lifting nDCG by up to nine points.",
        ],
        ru: [
          'Современный энкодер строится в **три стадии**. Первая — **самообучение** без меток: Inverse Cloze Task (предложение как псевдо-запрос к своему контексту), Contriever (случайные нарезки с моментум-очередью) или RetroMAE. Вторая — **контрастное обучение со слабым надзором** на сотнях миллионов добытых пар при огромном батче — E5 использует ~270M пар.',
          'Третья — **дообучение** с добытыми трудными негативами и дистилляцией кросс-энкодера. Результат: E5 первым обошёл BM25 *zero-shot* на BEIR. А вообще без доменных меток **GPL** генерирует синтетические запросы и проставляет им псевдо-метки кросс-энкодером, поднимая nDCG до девяти пунктов.',
        ],
        tt: [
          'Хәзерге энкодер **өч этапта** төзелә. Беренче — билгесез **үз-үзен өйрәтү**: Inverse Cloze Task (җөмлә үз контекстына псевдо-сорау буларак), Contriever (моментум-чираты белән очраклы кисемнәр), яки RetroMAE. Икенче — йөзләрчә миллион казылган парда зур батчта **көчсез-күзәтүле контраст** — E5 якынча 270M пар куллана.',
          'Өченче — казылган авыр негативлар һәм кросс-энкодер дистилляциясе белән **өстәмә өйрәтү**. Нәтиҗә: E5 BEIR\'да BM25\'не *zero-shot* узган беренче модель. Ә доменда бөтенләй билгеләр булмаганда **GPL** синтетик сораулар ясый һәм аларны кросс-энкодер белән псевдо-билгели, nDCG\'ны тугыз баллга кадәр күтәрә.',
        ],
      },
    },
