    {
      id: 'catch-when-two-stacks', kind: 'prose',
      heading: { en: "When two stacks are honestly needed", ru: "Когда два стека честно нужны", tt: "Ике стек кайчан чыннан кирәк" },
      body: {
        en: [
          "Now the honest question: each stack works alone — the encoder understands, the decoder generates — so what are you paying for both for? For a task that itself splits into two halves. Translation is the cleanest case: you must understand the *whole* source sentence at once — the encoder's craft, the full mask — yet you can only write the answer *left to right* — the decoder's craft, the causal mask. Neither half closes the task alone: the reader does not write, and the writer never sees the source whole. Summarization has the same anatomy. Wherever the output is a *transformed* input, the two-loom machine with its cross-attention bridge is the natural shape.",
          "And when is one stack enough? Whenever the task is open continuation — and, ever more often, whenever you can simply lay the source into the prompt: a decoder-only loom then reads it through the same causal self-attention, the bridge moved from the architecture into the context. Keep the mask table as your compass: full mask — understanding; causal — generation; full + causal + cross — transformation. Choose the loom by the cloth, not by fashion.",
        ],
        ru: [
          "Теперь честный вопрос: каждый стек работает и поодиночке — энкодер понимает, декодер генерирует, — за что же платить двумя? За задачу, которая сама распадается на две половины. Перевод — чистейший случай: понять надо *всё* исходное предложение разом — это ремесло энкодера, полная маска, — а писать ответ можно только *слева направо* — ремесло декодера, causal-маска. Ни одна половина в одиночку задачу не закрывает: читатель не пишет, а писатель ни разу не видит исходник целиком. У суммаризации та же анатомия. Везде, где выход — *преобразованный* вход, машина о двух станках с мостом кросс-внимания — естественная форма.",
          "А когда хватает одного? Когда задача — открытое продолжение, и — всё чаще — когда исходник можно просто подложить в промпт: decoder-only станок прочитает его тем же причинным self-attention, мост переехал из архитектуры в контекст. Держи таблицу масок компасом: полная маска — понимание; causal — генерация; полная + causal + cross — преобразование. Выбирай станок по полотну, а не по моде.",
        ],
        tt: [
          "Инде намуслы сорау: һәр стек аерым да эшли — encoder аңлый, decoder генерацияли, — икесе өчен нигә түләргә? Үзе ике яртыга таркала торган бурыч өчен. Тәрҗемә — иң чиста очрак: чыганак җөмләне *тулаем* берьюлы аңларга кирәк — бу энкодер һөнәре, тулы маска, — ә җавапны бары *сулдан уңга* язып була — бу декодер һөнәре, causal маска. Бер ярты да бурычны ялгыз ябмый: укучы язмый, язучы чыганакны бервакытта да тулаем күрми. Суммаризациянең анатомиясе шул ук. Чыгыш *үзгәртелгән* кереш булган һәр урында ике станоклы машина, cross-attention күпере белән, — табигый форма.",
          "Ә кайчан берәү җитә? Бурыч ачык дәвам булганда, һәм — торган саен ешрак — чыганакны промптка гына салып булганда: decoder-only станок аны шул ук causal self-attention белән укый, күпер архитектурадан контекстка күченгән. Маскалар таблицасын компас итеп тот: тулы маска — аңлау; causal — генерация; тулы + causal + cross — үзгәртү. Станокны модага түгел, тукымага карап сайла.",
        ],
      },
    },
