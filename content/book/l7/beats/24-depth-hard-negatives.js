    {
      id: 'depth-hard-negatives', kind: 'prose',
      heading: { en: 'Hard negatives — and the twin trap', ru: 'Трудные негативы — и ловушка твинов', tt: 'Авыр негативлар — һәм игезәк капкыны' },
      body: {
        en: [
          "Better negatives make a better Scout, and the field's history is a march toward harder ones: random, then **BM25 hard negatives** (DPR), then **global hard negatives mined from the index** (ANCE), then **cross-batch negatives** (RocketQA). The harder the negative, the sharper the boundary the Scout must learn.",
          "But there is a **trap**. Raw hard negatives — the top retrieved documents — secretly include *false* negatives that are actually relevant, and training on them **regresses** MRR by about six points. RocketQA's fix is to **denoise** them with a cross-encoder, turning the same negatives into a gain. A hard negative that is really a *twin* of the answer poisons training.",
        ],
        ru: [
          'Лучше негативы — лучше Разведчик, и история области — марш к более трудным: случайные, затем **BM25-негативы** (DPR), затем **глобальные негативы из индекса** (ANCE), затем **кросс-батч-негативы** (RocketQA). Чем труднее негатив, тем резче граница, которую учит Разведчик.',
          'Но есть **ловушка**. Сырые трудные негативы — топ извлечённых документов — тайно содержат *ложные* негативы, на деле релевантные, и обучение на них **роняет** MRR примерно на шесть пунктов. Решение RocketQA — **очистить** их кросс-энкодером, обратив те же негативы в выигрыш. Трудный негатив, который на деле *твин* ответа, отравляет обучение.',
        ],
        tt: [
          'Яхшырак негативлар — яхшырак Разведчик, ә өлкә тарихы — авыррак негативларга юл: очраклы, аннары **BM25-негативлар** (DPR), аннары **индекстан казылган глобаль негативлар** (ANCE), аннары **кросс-батч негативлар** (RocketQA). Негатив никадәр авыррак, Разведчик өйрәнергә тиешле чик шулкадәр үткенрәк.',
          'Әмма **капкын** бар. Чимал авыр негативлар — алынган документларның өсте — яшерен рәвештә *ялган* негативларны эченә ала, алар чынлыкта релевант, һәм аларда өйрәнү MRR\'ны якынча алты балл **төшерә**. RocketQA чишелеше — аларны кросс-энкодер белән **чистарту**, шул ук негативларны отышка әйләндерү. Чынлыкта җавапның *игезәге* булган авыр негатив өйрәнүне агулый.',
        ],
      },
    },
