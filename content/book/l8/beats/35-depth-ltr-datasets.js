    {
      id: 'depth-ltr-datasets', kind: 'prose',
      heading: { en: 'LETOR and MSLR', ru: 'LETOR и MSLR', tt: 'LETOR һәм MSLR' },
      body: {
        en: [
          "To train a captain you need labeled data. **LETOR** was the early standard: query-document feature vectors with relevance labels. **MSLR-WEB30K** is the modern benchmark — about \\(30\\text{K}\\) queries, each query-document pair described by \\(136\\) features, with graded relevance labels from \\(0\\) to \\(4\\).",
          "Those graded labels are exactly what nDCG (Lecture 4) was built to measure — which is why LambdaMART, optimizing \\(\\Delta\\)nDCG, is such a natural fit for these datasets.",
        ],
        ru: [
          "Чтобы обучить капитана, нужны размеченные данные. **LETOR** был ранним стандартом: векторы признаков «запрос-документ» с метками релевантности. **MSLR-WEB30K** — современный бенчмарк: около \\(30\\text{K}\\) запросов, каждая пара «запрос-документ» описана \\(136\\) признаками, с градуированными метками релевантности от \\(0\\) до \\(4\\).",
          "Эти градуированные метки — ровно то, что nDCG (лекция 4) создан измерять — поэтому LambdaMART, оптимизирующий \\(\\Delta\\)nDCG, так естественно подходит этим датасетам.",
        ],
        tt: [
          "Капитан өйрәтер өчен билгеләнгән мәгълүмат кирәк. **LETOR** иртә стандарт иде: релевантлык билгеле «сорау–документ» билге векторлары. **MSLR-WEB30K** — заманча бенчмарк: якынча \\(30\\text{K}\\) сорау, һәр «сорау–документ» пары \\(136\\) билге белән сурәтләнгән, \\(0\\) дән \\(4\\) кә кадәр дәрәҗәле релевантлык билгеләре белән.",
          "Бу дәрәҗәле билгеләр — нәкъ nDCG (4 нче лекция) үлчәргә ясалган нәрсә — шуңа \\(\\Delta\\)nDCG ны оптимальләштерүче LambdaMART бу датасетларга шулкадәр табигый туры килә.",
        ],
      },
    },
