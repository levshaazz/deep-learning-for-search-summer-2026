    {
      id: 'catch-base-vs-large', kind: 'prose',
      heading: { en: "Base against large: what grows — and what refuses to", ru: "Base против large: что растёт — и что расти отказывается", tt: "Base белән large: нәрсә үсә — һәм нәрсә үсүдән баш тарта" },
      body: {
        en: [
          "BERT ships in two sizes, and the difference is worth naming in plain words. **Large** is twice as deep — twice the stack of blocks; its threads are wider — a heftier hidden vector per position; and it looks through more attention heads in every block. Pile these together and the whole loom comes out more than three times heavier in parameters, with the bill to match: more memory to hold it, more compute per pass, fine-tuning slower and touchier.",
          "Now the catch: one thing does **not** grow — the length of the cloth. Both sizes read a sheet up to the same fixed number of threads, because the ceiling is set by the learned position table, not by depth or width. A heavier loom weaves a *richer* cloth, not a *longer* one. When someone tells you \"take large, our documents are long\" — that is the trap: size buys depth of reading, and not a single extra thread of length.",
        ],
        ru: [
          "BERT выпускается в двух размерах, и разницу стоит назвать простыми словами. **Large** вдвое глубже — вдвое выше стопка блоков; его нити шире — увесистей скрытый вектор на каждую позицию; и смотрит он через большее число голов внимания в каждом блоке. Сложи это вместе — и весь станок выходит втрое с лишним тяжелее по параметрам, со счётом по всем статьям: больше памяти, чтобы его держать, больше вычислений на каждый проход, дообучение медленнее и капризнее.",
          "А теперь ловушка: одно **не растёт** — длина полотна. Оба размера читают полотно до одного и того же фиксированного числа нитей, потому что потолок задаёт обучаемая таблица позиций, а не глубина и не ширина. Тяжёлый станок ткёт полотно *богаче*, а не *длиннее*. Когда тебе говорят «возьми large, у нас длинные документы» — это и есть ловушка: размер покупает глубину чтения и ни одной лишней нити длины.",
        ],
        tt: [
          "BERT ике зурлыкта чыга, һәм аерманы гади сүзләр белән атарга кирәк. **Large** ике тапкыр тирәнрәк — блоклар өеме ике тапкыр биегрәк; җепләре киңрәк — һәр позициягә саллырак яшерен вектор; һәм һәр блокта ул күбрәк attention башы аша карый. Боларны бергә куш — бөтен станок параметрлар буенча өч тапкырдан артык авыррак чыга, исәп-хисабы да шуңа туры килә: аны тотарга күбрәк хәтер, һәр үтешкә күбрәк исәпләү, fine-tuning әкренрәк һәм назлырак.",
          "Ә хәзер тозак: бер нәрсә **үсми** — тукыма озынлыгы. Ике зурлык та тукыманы бер үк фиксацияле җеп санына кадәр укый, чөнки түшәмне тирәнлек тә, киңлек тә түгел, ә өйрәнелә торган позиция таблицасы куя. Авыр станок тукыманы *байрак* итеп тукый, *озынрак* түгел. Сиңа «large'ны ал, документларыбыз озын» дисәләр — тозак нәкъ шушы: зурлык уку тирәнлеген сатып ала, озынлыкның бер артык җебен дә түгел.",
        ],
      },
    },
