    {
      id: 'depth-lambdarank', kind: 'prose',
      heading: { en: 'LambdaRank', ru: 'LambdaRank', tt: 'LambdaRank' },
      body: {
        en: [
          "LambdaRank's insight is to skip the loss and define the *gradient* directly — and to weight it by how much the ranking metric would improve if you swapped the pair. The gradient magnitude is \\(1 - \\sigma(s_i - s_j)\\), and the weight is \\(|\\Delta\\text{nDCG}|\\) (the nDCG from Lecture 4).",
          ":::calc The gradient is \\(1 - \\sigma(1.2) = \\mathbf{0.2315}\\). The mis-ordered list \\([j, i]\\) has \\(\\text{nDCG} = \\mathbf{0.6309}\\); swapping to \\([i, j]\\) lifts it to \\(1.0\\), so \\(\\Delta\\text{nDCG} = \\mathbf{0.3691}\\). The resulting force is \\(\\lambda = 0.2315 \\cdot 0.3691 = \\mathbf{0.0854}\\). :::",
          "That \\(\\lambda\\) is the whole idea: a force that pulls \\(i\\) up and \\(j\\) down, scaled by *how much the swap matters to the metric*. Pairs whose order barely changes nDCG get a gentle nudge; pairs that would lift the metric a lot get shoved hard. The model spends its effort where the ranking gains the most.",
        ],
        ru: [
          "Прозрение LambdaRank — пропустить функцию потерь и задать *градиент* напрямую, взвесив его на то, насколько улучшится метрика ранжирования, если поменять пару местами. Величина градиента — \\(1 - \\sigma(s_i - s_j)\\), а вес — \\(|\\Delta\\text{nDCG}|\\) (nDCG из лекции 4).",
          ":::calc Градиент — \\(1 - \\sigma(1{,}2) = \\mathbf{0{,}2315}\\). Неверно упорядоченный список \\([j, i]\\) имеет \\(\\text{nDCG} = \\mathbf{0{,}6309}\\); перестановка в \\([i, j]\\) поднимает её до \\(1{,}0\\), поэтому \\(\\Delta\\text{nDCG} = \\mathbf{0{,}3691}\\). Итоговая сила — \\(\\lambda = 0{,}2315 \\cdot 0{,}3691 = \\mathbf{0{,}0854}\\). :::",
          "Эта \\(\\lambda\\) и есть вся идея: сила, тянущая \\(i\\) вверх, а \\(j\\) вниз, масштабированная на то, *насколько обмен важен для метрики*. Пары, чей порядок почти не меняет nDCG, получают лёгкий толчок; пары, которые сильно поднимут метрику, толкаются сильно. Модель тратит усилия там, где ранжирование выигрывает больше всего.",
        ],
        tt: [
          "LambdaRank ның ачышы — югалту функциясен үткәреп, *градиентны* турыдан-туры билгеләү һәм аны парны алыштырганда метрика никадәр яхшырачагына үлчәү. Градиент зурлыгы — \\(1 - \\sigma(s_i - s_j)\\), ә авырлык — \\(|\\Delta\\text{nDCG}|\\) (4 нче лекциядәге nDCG).",
          ":::calc Градиент — \\(1 - \\sigma(1{,}2) = \\mathbf{0{,}2315}\\). Дөрес тәртипләнмәгән \\([j, i]\\) исемлегендә \\(\\text{nDCG} = \\mathbf{0{,}6309}\\); \\([i, j]\\) гә алыштыру аны \\(1{,}0\\) гә күтәрә, шуңа \\(\\Delta\\text{nDCG} = \\mathbf{0{,}3691}\\). Нәтиҗә көч — \\(\\lambda = 0{,}2315 \\cdot 0{,}3691 = \\mathbf{0{,}0854}\\). :::",
          "Бу \\(\\lambda\\) — бөтен идея: \\(i\\) не өскә, \\(j\\) ны аска тарткан көч, *алыштыру метрика өчен никадәр мөһим* булуга үлчәнгән. Тәртибе nDCG ны диярлек үзгәртми торган парлар йомшак этү ала; метриканы күп күтәрә торган парлар каты этелә. Модель көчен ранжлау иң күп откан җиргә сарыф итә.",
        ],
      },
    },
