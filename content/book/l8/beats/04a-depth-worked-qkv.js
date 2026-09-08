    {
      id: 'depth-worked-qkv', kind: 'prose',
      heading: { en: "One crossing, worked by hand", ru: "Одно скрещение — разбираем руками", tt: "Бер кисешү — кул белән үтәбез" },
      body: {
        en: [
          "Let me work one crossing in front of you, symbol by symbol, on the smallest cloth that shows everything: three threads, \\(x_1, x_2, x_3\\). From each I spin the three tags with the same shared combs: \\(q_i = x_i W_Q\\), \\(k_i = x_i W_K\\), \\(v_i = x_i W_V\\). Nothing about thread one is special — the same three matrices touch every thread.",
          "Now stand on thread one and put its question to the whole row. Three scores: \\(e_{11} = \\frac{q_1\\cdot k_1}{\\sqrt{d_k}}\\), \\(e_{12} = \\frac{q_1\\cdot k_2}{\\sqrt{d_k}}\\), \\(e_{13} = \\frac{q_1\\cdot k_3}{\\sqrt{d_k}}\\) — thread one against itself, its neighbour, and the far one. A softmax over the row turns them into weights \\(a_{11}, a_{12}, a_{13}\\): all positive, summing to one — a budget of attention, spent across three crossings.",
          "The new thread is the blend: \\(y_1 = a_{11}v_1 + a_{12}v_2 + a_{13}v_3\\) — mostly the value of whoever's key answered the question best, a whisper of the rest. Do the same standing on threads two and three, and you have done by hand exactly what the matrix form \\(\\mathrm{softmax}\\!\\left(QK^\\top/\\sqrt{d_k}\\right)V\\) does in one stroke: every row of it is one thread's question, one budget, one blend.",
        ],
        ru: [
          "Давай я при тебе пройду одно скрещение, символ за символом, на самом маленьком полотне, где видно всё: три нити, \\(x_1, x_2, x_3\\). Из каждой пряду три ярлычка одними и теми же общими гребнями: \\(q_i = x_i W_Q\\), \\(k_i = x_i W_K\\), \\(v_i = x_i W_V\\). В первой нити нет ничего особенного — одни и те же три матрицы касаются каждой нити.",
          "Теперь встань на первую нить и задай её вопрос всему ряду. Три оценки: \\(e_{11} = \\frac{q_1\\cdot k_1}{\\sqrt{d_k}}\\), \\(e_{12} = \\frac{q_1\\cdot k_2}{\\sqrt{d_k}}\\), \\(e_{13} = \\frac{q_1\\cdot k_3}{\\sqrt{d_k}}\\) — первая нить против себя самой, соседки и дальней. Софтмакс по строке превращает их в веса \\(a_{11}, a_{12}, a_{13}\\): все положительные, в сумме единица — бюджет внимания, расписанный на три скрещения.",
          "Новая нить — это смесь: \\(y_1 = a_{11}v_1 + a_{12}v_2 + a_{13}v_3\\) — побольше от того значения, чей ключ лучше всех ответил на вопрос, шёпот от остальных. Проделай то же, стоя на второй и третьей нити, — и вот, руками, ровно то, что матричная запись \\(\\mathrm{softmax}\\!\\left(QK^\\top/\\sqrt{d_k}\\right)V\\) делает одним росчерком: каждая её строка — вопрос одной нити, один бюджет, одна смесь.",
        ],
        tt: [
          "Әйдә, мин синең күз алдыңда бер кисешүне символ артыннан символ үтәм — барысы да күренә торган иң кечкенә тукымада: өч җеп, \\(x_1, x_2, x_3\\). Һәрберсеннән өч билгене бер үк уртак тараклар белән эрлим: \\(q_i = x_i W_Q\\), \\(k_i = x_i W_K\\), \\(v_i = x_i W_V\\). Беренче җептә бернинди аерымлык юк — шул ук өч матрица һәр җепкә кагыла.",
          "Хәзер беренче җепкә бас та аның соравын бөтен рәткә бир. Өч бәя: \\(e_{11} = \\frac{q_1\\cdot k_1}{\\sqrt{d_k}}\\), \\(e_{12} = \\frac{q_1\\cdot k_2}{\\sqrt{d_k}}\\), \\(e_{13} = \\frac{q_1\\cdot k_3}{\\sqrt{d_k}}\\) — беренче җеп үзенә, күршесенә һәм ерактагысына каршы. Юл буенча softmax аларны \\(a_{11}, a_{12}, a_{13}\\) үлчәүләренә әйләндерә: барысы уңай, суммасы бер — өч кисешүгә бүленгән attention бюджеты.",
          "Яңа җеп — катнашма: \\(y_1 = a_{11}v_1 + a_{12}v_2 + a_{13}v_3\\) — сорауга ачкычы иң яхшы җавап биргән кыйммәттән күбрәк, калганнарыннан пышылдау гына. Шуны ук икенче һәм өченче җепкә басып эшлә — һәм син кул белән нәкъ матрица язмасы \\(\\mathrm{softmax}\\!\\left(QK^\\top/\\sqrt{d_k}\\right)V\\) бер селтәнүдә эшләгәнне башкардың: аның һәр юлы — бер җепнең соравы, бер бюджет, бер катнашма.",
        ],
      },
    },
