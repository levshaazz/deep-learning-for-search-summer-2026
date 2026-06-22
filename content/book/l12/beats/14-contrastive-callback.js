    {
      id: 'contrastive-callback', kind: 'prose',
      heading: { en: 'Sir Cosine, across modalities', ru: 'Сэр Косинус, между модальностями', tt: 'Сэр Косинус, модальлекләр арасында' },
      img: 'L12/L12-03-sir-cosine-crossmodal.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Sir Cosine on a glowing unit sphere pulling a photograph and its caption together to a tiny angle while shoving mismatched picture–word pairs to wide angles — the contrastive objective drawn as geometry.',
        ru: 'Сэр Косинус на светящейся единичной сфере стягивает фотографию и её подпись к крошечному углу, расталкивая несовпадающие пары картинка–слово на широкие углы — контрастивная цель, нарисованная как геометрия.',
        tt: 'Сэр Косинус яктырган берәмлек сферасында фоторәсем белән аның язмасын кечкенә почмакка тарта, ә туры килмәгән рәсем-сүз парларын киң почмакларга этәрә — геометрия итеп сызылган контраст максаты.',
      },
      body: {
        en: [
          "*Why* does the diagonal win? Because of how CLIP is trained — and it is a trick we have already met. In L6, **Sir Cosine** taught us **contrastive learning**: the in-batch loss pulls matched pairs together and pushes every mismatch apart, on the unit sphere. CLIP makes one side of each pair an *image* and the other its *caption*, and runs the very same loss.",
          "That training is exactly what carved the gap we just measured: it drives matched cosine **high** (\\(\\mathbf{0.9944}\\)) and mismatched cosine **low** (\\(\\mathbf{0.3791}\\)). The \\(\\mathbf{0.6153}\\) gap *is* the contrastive objective, made visible in a matrix. Sir Cosine has not changed his job — the angle he measured on the unit sphere in L2 and L6 is the very same score here. He simply now compares a photograph to a sentence.",
        ],
        ru: [
          "*Почему* диагональ выигрывает? Из-за того, как обучается CLIP, — и это трюк, который мы уже встречали. В L6 **Сэр Косинус** научил нас **контрастивному обучению**: внутрипакетная функция потерь стягивает совпадающие пары и расталкивает каждое несовпадение на единичной сфере. CLIP делает одну сторону каждой пары *изображением*, другую — её *подписью*, и запускает ту же самую функцию потерь.",
          "Именно это обучение и вырезало разрыв, что мы только что измерили: оно гонит совпавший косинус **вверх** (\\(\\mathbf{0.9944}\\)) и несовпавший **вниз** (\\(\\mathbf{0.3791}\\)). Разрыв \\(\\mathbf{0.6153}\\) — это *и есть* контрастивная цель, сделанная видимой в матрице. Сэр Косинус не сменил работы — угол, что он мерял на единичной сфере в L2 и L6, здесь та же самая оценка. Он просто теперь сравнивает фотографию с предложением.",
        ],
        tt: [
          "Диагональ *ни өчен* җиңә? CLIP ничек өйрәтелгәне сәбәпле — һәм бу безгә инде очраган алым. L6 да **Сэр Косинус** безне **контраст өйрәнүгә** өйрәтте: пакет эчендәге югалту туры килгән парларны тарта һәм һәр туры килмәгәнне берәмлек сферасында этәрә. CLIP һәр парның бер ягын *рәсем*, икенчесен аның *язмасы* итә һәм нәкъ шул ук югалтуны эшләтә.",
          "Нәкъ менә бу өйрәтү без яңа гына үлчәгән ярыкны кисеп ясады: ул туры килгән косинусны **югары** (\\(\\mathbf{0.9944}\\)), туры килмәгәнне **түбән** (\\(\\mathbf{0.3791}\\)) куа. \\(\\mathbf{0.6153}\\) ярыгы — бу матрицада күренешкә әйләндерелгән контраст максаты *үзе*. Сэр Косинус эшен алмаштырмады — ул L2 һәм L6 да берәмлек сферасында үлчәгән почмак монда шул ук бәя. Ул бары хәзер фоторәсемне җөмлә белән чагыштыра."
        ],
      },
    },
