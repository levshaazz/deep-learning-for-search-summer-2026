    {
      id: 'catch-quantizer-fails-quietly', kind: 'prose',
      heading: { en: "A quantizer fails quietly", ru: "Квантователь проваливается тихо", tt: "Квантлаучы тавышсыз ега" },
      body: {
        en: [
          "Here is the failure mode worth carrying out of this chapter, whichever method you pick. A broken quantizer does not raise an exception. The index builds, queries return, latency looks fine, and the only symptom is that the answers are slightly worse than they should be — which you will attribute to the encoder, the chunking, the ranker, anything but the compression step you stopped thinking about weeks ago.",
          "The cheap guard is to measure the quantizer directly rather than through end-to-end recall. Take a sample of queries, compute exact distances to a few thousand vectors, compute the estimated distances your index would use, and look at the relative error — the average and, more importantly, the maximum. The average tells you the typical quality; the maximum tells you whether the estimate ever collapses. PQ's MSong failure shows up in exactly this test and does not show up in a smoke test on your favourite five queries.",
          "The second guard is a rule, not a measurement: re-run that check when the corpus changes, not when someone complains. A learned codebook is fitted to the data it saw; the day your corpus takes in a new domain, the codebook is quietly out of date. This is the whole practical difference the bound buys — with RaBitQ the check is a formality, with PQ it is a calendar item.",
        ],
        ru: [
          "Вот режим отказа, который стоит унести из этой главы, какой бы метод ты ни выбрал. Сломанный квантователь не выбрасывает исключение. Индекс собирается, запросы возвращаются, задержка в норме, и единственный симптом — ответы чуть хуже, чем должны быть. А это ты спишешь на энкодер, на чанкование, на ранкер — на что угодно, кроме шага сжатия, о котором перестал думать недели назад.",
          "Дешёвая страховка — мерить квантователь напрямую, а не через сквозную полноту. Возьми выборку запросов, посчитай точные расстояния до нескольких тысяч векторов, посчитай оценки, которыми пользуется индекс, и посмотри на относительную ошибку — среднюю и, что важнее, максимальную. Средняя говорит про типичное качество; максимальная — про то, случается ли, что оценка обваливается совсем. Провал PQ на MSong виден ровно в этой проверке и невиден в дымовом тесте на пяти любимых запросах.",
          "Вторая страховка — это правило, а не замер: перезапускай проверку, когда меняется корпус, а не когда кто-то пожаловался. Выученная кодовая книга подогнана под те данные, которые видела; в день, когда в корпус приходит новая предметная область, книга тихо устаревает. В этом и вся практическая разница, которую покупает граница: с RaBitQ проверка — формальность, с PQ — пункт в календаре.",
        ],
        tt: [
          "Менә бу бүлектән алып китәргә кирәкле ега торган режим, нинди ысул сайласаң да. Ватык квантлаучы искәрмә ташламый. Индекс җыела, сораулар кайта, тоткарлык нормада, һәм бердәнбер симптом — җаваплар тиеш булганнан бераз начаррак. Ә моны син энкодерга, чанклауга, ранкерга сылтарсың — атналар элек уйлаудан туктаган кысу адымыннан тыш нәрсәгә генә булса да.",
          "Арзан иминият — квантлаучыны ахырдан-ахырга тулылык аша түгел, ә турыдан-туры үлчәү. Сораулар үрнәген ал, берничә мең векторга төгәл араларны исәплә, индекс куллана торган бәяләрне исәплә һәм чагыштырма хатага кара — уртачасына һәм, мөһимрәге, максималенә. Уртачасы типик сыйфат турында сөйли; максималь — бәя бөтенләй егылган очраклар бармы дигәне. PQ'ның MSong'тагы уңышсызлыгы нәкъ шушы тикшерүдә күренә һәм биш яраткан сорауда төтен тестында күренми.",
          "Икенче иминият — үлчәү түгел, ә кагыйдә: тикшерүне кемдер зарланганда түгел, ә корпус үзгәргәндә кабат җибәр. Өйрәнелгән код китабы ул күргән мәгълүматка яраклаштырылган; корпуска яңа өлкә килгән көнне китап тавышсыз искерә. Чик сатып ала торган бөтен практик аерма шунда: RaBitQ белән тикшерү — формальлек, PQ белән — календарьдагы пункт.",
        ],
      },
    },
