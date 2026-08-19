    {
      id: 'train-for-it', kind: 'prose',
      heading: { en: "And you can train for it, too", ru: "А ещё под это можно обучить", tt: "Моның өчен өйрәтергә дә була" },
      body: {
        en: [
          "I have told you four times that this trick is training-free, and every one of those times was true. But I owe you the rest of the sentence: the same paper that proposes late chunking *also* proposes training for it, and if I leave that out you will walk away thinking training-free is what the method IS, rather than where it starts.",
          "The trained variant is called span pooling, and the recipe is one you already know. Take triples — a query, a document, and a pair of offsets \\(\\langle \\text{start}, \\text{end}\\rangle\\) marking the span that answers it — and train the model to emit a vector for that span directly, instead of averaging it after the fact. The loss is InfoNCE: the very same objective you built a batch for in the lecture on negatives. The data is FEVER and TriviaQA, about four hundred and seventy thousand pairs, batches of 512, five hundred steps. Nothing exotic.",
          "And what does it buy? Very little, honestly. The best cell in their table gains under a point of nDCG, and three cells go slightly *backwards*. Which is exactly why I am telling you: the gap between \"average the span\" and \"learn the span\" is small, so the free version is not a poor cousin of the trained one. It is most of the trained one. Training-free is the floor of this method — and the ceiling turns out to be within arm's reach of it.",
        ],
        ru: [
          "Я четыре раза сказал, что приём не требует обучения, и каждый раз это была правда. Но я должен тебе остаток фразы: та же статья, которая предлагает позднее чанкование, *предлагает и обучение* под него, — и если я об этом промолчу, ты уйдёшь с мыслью, будто «без обучения» и есть определение метода, а не его отправная точка.",
          "Обученный вариант называется span pooling, и рецепт тебе уже знаком. Берём тройки — запрос, документ и пару смещений \\(\\langle \\text{start}, \\text{end}\\rangle\\), отмечающих отвечающий спан, — и учим модель сразу отдавать вектор этого спана, а не усреднять его задним числом. Функция потерь — InfoNCE: ровно та, под которую ты собирал батч в лекции про негативы. Данные — FEVER и TriviaQA, около четырёхсот семидесяти тысяч пар, батч 512, пятьсот шагов. Ничего экзотического.",
          "И что это покупает? Честно говоря, совсем немного. Лучшая клетка в их таблице прибавляет меньше пункта nDCG, а три клетки едут чуть *назад*. Именно поэтому я тебе это и рассказываю: разрыв между «усредни спан» и «выучи спан» мал, значит бесплатная версия — не бедная родственница обученной. Она и есть почти вся обученная. «Без обучения» здесь — не потолок, а пол; а потолок, как выяснилось, на расстоянии вытянутой руки.",
        ],
        tt: [
          "Мин дүрт тапкыр бу алымның өйрәтүне таләп итмәвен әйттем, һәм һәр очракта бу дөрес иде. Ләкин мин сиңа җөмләнең калганын да тиеш: late chunking’ны тәкъдим иткән шул ук мәкалә аның өчен *өйрәтүне дә* тәкъдим итә, — һәм мин моны әйтмәсәм, син «өйрәтүсез» дигәнне методның үзе дип уйлап китәрсең, ә ул бары башлангыч нокта.",
          "Өйрәтелгән вариант span pooling дип атала, ә рецепт сиңа таныш. Өчлекләр алабыз — сорау, документ һәм җавап бирүче span’ны билгеләүче \\(\\langle \\text{start}, \\text{end}\\rangle\\) күчешләр пары, — һәм модельне соңыннан уртачалау урынына шул span векторын турыдан-туры бирергә өйрәтәбез. Югалту функциясе — InfoNCE: негативлар турындагы лекциядә син batch җыйган шул ук функция. Мәгълүматлар — FEVER һәм TriviaQA, якынча дүрт йөз җитмеш мең пар, batch 512, биш йөз адым. Гаҗәеп берни юк.",
          "Ә бу нәрсә сатып ала? Дөресен әйткәндә, бик аз. Аларның таблицасындагы иң яхшы күзәнәк nDCG’ның бер пунктыннан да азрак өсти, ә өч күзәнәк бераз *артка* китә. Мин сиңа моны нәкъ шуңа сөйлим: «span’ны уртачала» белән «span’ны өйрән» арасындагы аерма кечкенә, димәк бушлай версия өйрәтелгәненең ярлы туганы түгел. Ул — өйрәтелгәненең күп өлеше үзе. «Өйрәтүсез» биредә түшәм түгел, ә идән; ә түшәм, күренә ки, кул сузымында.",
        ],
      },
    },
