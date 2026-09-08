    {
      id: 'depth-cup-dies', kind: 'prose',
      heading: { en: "The cup, by hand: where an axis dies", ru: "Чаша, руками: где умирает ось", tt: "Касә, кул белән: күчәр кайда үлә" },
      img: 'L19/L19-03-solder-joint.png', imgPos: 'scene',
      imgAlt: { en: "Séréga solders two wire-ends together into a single joint. The shared wire simply ends there — it does not come out the other side. A small puff of smoke rises, and beside the joint someone has chalked a tiny tally: '2·a·b·c', the price of the joint. Hand-lettered beneath it: 'the axis dies here'. His green tübetey is the only green in the scene.", ru: "Серёга спаивает два конца провода в один стык. Общий провод там просто кончается — с другой стороны он не выходит. Поднимается дымок, а у стыка мелом выведен крошечный счёт: «2·a·b·c» — цена этого стыка. Ниже от руки: «здесь умирает ось». Его зелёная тюбетейка — единственное зелёное в кадре.", tt: "Séréga ике чыбык очын бер тоташмага ябыштыра. Уртак чыбык шунда гына бетә — икенче яктан ул чыкмый. Төтен күтәрелә, ә тоташма янында акбур белән кечкенә хисап язылган: «2·a·b·c» — шул тоташманың бәясе. Аскы юлда кул белән: «күчәр монда үлә». Аның яшел түбәтәе — кадрдагы бердәнбер яшел төс." },
      imgCaption: { en: "A cup is a solder joint. The shared axis goes **in** and does not come out — and the joint has a price you can chalk on the wall.", ru: "Чаша — это спай. Общая ось **входит** и не выходит, а у спая есть цена, которую можно написать мелом на стене.", tt: "Касә — ул ябыштыру. Уртак күчәр **керә** дә чыкмый, ә ябыштыруның акбур белән стенага язып була торган бәясе бар." },
      body: {
        en: [
          "Take the chain L7 already worked end to end — «the cat sat» — and stop at the moment two wires meet. Row 0 of \\(Q\\) is \\((1, 0, 1, 0)\\); row 0 of \\(K\\) is \\((1, 0, 1, 0)\\). The cup does the only thing a cup ever does: multiply term by term along the shared axis, then add.",
          ":::calc \\(1 \\cdot 1 + 0 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 0 = 2\\) — and that single number is \\(\\text{scores}[0][0]\\). **Four numbers went in and one came out. The axis \\(d\\) is gone.** :::",
          "Look at what the drawing tells you that the arithmetic does not. The axis \\(d\\) has *ended* — you can see the wire stop at the joint — and at the same instant a new axis was **born**: the score grid, \\(n\\) queries by \\(n\\) keys, one cell for every pair. Nothing in \\( QK^{\\top} \\) is drawn any larger than \\( \\sqrt{d_k} \\), yet one of these is a constant and the other is a square in \\(n\\). On the circuit it is the widest thing on the page.",
          "That is the discipline the notation forces: every time you draw a cup, ask *which axis just died* — and every time an axis is created, look at how long it is. Both questions have exactly one glyph each, and both have a price. We will put a number on it shortly.",
        ],
        ru: [
          "Возьми цепочку, которую L7 уже прогнала от начала до конца — «the cat sat», — и остановись в тот миг, когда два провода сходятся. Строка 0 у \\(Q\\) — это \\((1, 0, 1, 0)\\); строка 0 у \\(K\\) — тоже \\((1, 0, 1, 0)\\). Чаша делает единственное, что чаша умеет: перемножает поэлементно вдоль общей оси и складывает.",
          ":::calc \\(1 \\cdot 1 + 0 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 0 = 2\\) — и это одно число есть \\(\\text{scores}[0][0]\\). **Вошли четыре числа, вышло одно. Оси \\(d\\) больше нет.** :::",
          "Теперь посмотри, что говорит рисунок и о чём молчит арифметика. Ось \\(d\\) *кончилась* — видно, как провод обрывается на стыке, — и ровно в этот миг **родилась** новая ось: сетка оценок, \\(n\\) запросов на \\(n\\) ключей, по клетке на каждую пару. В \\( QK^{\\top} \\) ничего не нарисовано крупнее, чем \\( \\sqrt{d_k} \\), — а ведь одно из них константа, другое квадрат по \\(n\\). На схеме это самое широкое место на листе.",
          "Вот дисциплина, которую нотация навязывает: рисуешь чашу — спроси, *какая ось только что умерла*; рождается ось — посмотри, какой она длины. У каждого вопроса ровно по одному знаку, и у каждого есть цена. Скоро мы поставим на неё число.",
        ],
        tt: [
          "L7 инде башыннан ахырына кадәр эшләп чыккан чылбырны ал — «the cat sat» — һәм ике чыбык очрашкан мизгелдә туктал. \\(Q\\)’ның 0 нчы юлы — \\((1, 0, 1, 0)\\); \\(K\\)’ның 0 нчы юлы да \\((1, 0, 1, 0)\\). Касә үзе белгән бердәнбер эшне эшли: уртак күчәр буенча элементлап тапкырлый да куша.",
          ":::calc \\(1 \\cdot 1 + 0 \\cdot 0 + 1 \\cdot 1 + 0 \\cdot 0 = 2\\) — һәм бу бер сан \\(\\text{scores}[0][0]\\) була. **Дүрт сан керде, бер сан чыкты. \\(d\\) күчәре юк инде.** :::",
          "Хәзер рәсем нәрсә әйтүен, ә арифметика нәрсә турында дәшмәвен кара. \\(d\\) күчәре *бетте* — чыбыкның тоташмада өзелүе күренә — һәм нәкъ шул мизгелдә яңа күчәр **туды**: баллар челтәре, \\(n\\) сорау × \\(n\\) ачкыч, һәр парга бер күзәнәк. \\( QK^{\\top} \\) эчендә бернәрсә дә \\( \\sqrt{d_k} \\)’дан эрерәк сызылмаган — ә берсе константа, икенчесе \\(n\\) буенча квадрат. Схемада ул биттәге иң киң урын.",
          "Язма мәҗбүр иткән тәртип шул: касә сызасың икән — *кайсы күчәр яңа гына үлде* дип сора; күчәр туа икән — аның озынлыгына кара. Һәр сорауга нәкъ бер билге, һәм һәрберсенең бәясе бар. Тиздән без ул бәягә сан куярбыз.",
        ],
      },
    },
