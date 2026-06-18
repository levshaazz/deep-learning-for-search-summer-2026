    {
      id: 'clip-matrix-worked', kind: 'prose',
      heading: { en: 'The diagonal wins', ru: 'Диагональ побеждает', tt: 'Диагональ җиңә' },
      body: {
        en: [
          "Three concepts — **cat, dog, car** — each with an image vector and a caption vector in the shared space. Score every image against every caption by cosine and you get a \\(3\\times 3\\) matrix. The diagonal is each image paired with *its own* caption; everything off-diagonal is a mismatch.",
          ":::calc The cosine matrix \\(\\cos(\\text{img}_i, \\text{txt}_j)\\) comes out as \\(\\begin{bmatrix} \\mathbf{0.9974} & 0.6547 & 0.171 \\\\ 0.6609 & \\mathbf{0.991} & 0.2877 \\\\ 0.1712 & 0.329 & \\mathbf{0.9949} \\end{bmatrix}\\). Take \\(\\operatorname*{arg\\,max}_j\\) of each row: the top match is the **diagonal** every time — cross-modal retrieval is right \\(\\mathbf{3/3}\\). Average the matched (diagonal) cells: \\(\\overline{\\cos}_{\\text{matched}} = \\tfrac{0.9974 + 0.991 + 0.9949}{3} = \\mathbf{0.9944}\\). Average the six off-diagonal cells: \\(\\overline{\\cos}_{\\text{mismatched}} = \\tfrac{2.2745}{6} = \\mathbf{0.3791}\\). The **contrastive gap** is \\(0.9944 - 0.3791 = \\mathbf{0.6153}\\). :::",
          "Matched pairs sit near \\(1.0\\); everything else sits near \\(0.38\\). That \\(\\mathbf{0.6153}\\) gap is exactly why the diagonal wins so cleanly — and it is no accident. It is the **contrastive objective**, made visible.",
        ],
        ru: [
          "Три концепта — **кот, собака, машина** — у каждого вектор изображения и вектор подписи в общем пространстве. Оцени каждое изображение против каждой подписи по косинусу — получишь матрицу \\(3\\times 3\\). Диагональ — это каждое изображение со *своей* подписью; всё вне диагонали — несовпадение.",
          ":::calc Косинусная матрица \\(\\cos(\\text{img}_i, \\text{txt}_j)\\) выходит такой: \\(\\begin{bmatrix} \\mathbf{0.9974} & 0.6547 & 0.171 \\\\ 0.6609 & \\mathbf{0.991} & 0.2877 \\\\ 0.1712 & 0.329 & \\mathbf{0.9949} \\end{bmatrix}\\). Возьми \\(\\operatorname*{arg\\,max}_j\\) каждой строки: лучшее совпадение каждый раз — **диагональ**: кросс-модальный поиск верен \\(\\mathbf{3/3}\\). Усредни совпавшие (диагональные) ячейки: \\(\\overline{\\cos}_{\\text{matched}} = \\tfrac{0.9974 + 0.991 + 0.9949}{3} = \\mathbf{0.9944}\\). Усредни шесть внедиагональных: \\(\\overline{\\cos}_{\\text{mismatched}} = \\tfrac{2.2745}{6} = \\mathbf{0.3791}\\). **Контрастивный разрыв** — \\(0.9944 - 0.3791 = \\mathbf{0.6153}\\). :::",
          "Совпавшие пары сидят около \\(1.0\\); всё прочее — около \\(0.38\\). Этот разрыв \\(\\mathbf{0.6153}\\) — ровно почему диагональ выигрывает так чисто, и это не случайность. Это **контрастивная цель**, сделанная видимой.",
        ],
        tt: [
          "Өч төшенчә — **песи, эт, машина** — һәркайсының уртак киңлектә рәсем векторы һәм язма векторы бар. Һәр рәсемне һәр язмага каршы косинус буенча бәялә — \\(3\\times 3\\) матрица аласың. Диагональ — һәр рәсем *үз* язмасы белән; диагональдән тыш бар нәрсә — туры килмәү.",
          ":::calc Косинус матрицасы \\(\\cos(\\text{img}_i, \\text{txt}_j)\\) болай чыга: \\(\\begin{bmatrix} \\mathbf{0.9974} & 0.6547 & 0.171 \\\\ 0.6609 & \\mathbf{0.991} & 0.2877 \\\\ 0.1712 & 0.329 & \\mathbf{0.9949} \\end{bmatrix}\\). Һәр юлның \\(\\operatorname*{arg\\,max}_j\\) ын ал: иң яхшы туры килү һәрвакыт — **диагональ**: кросс-модаль эзләү \\(\\mathbf{3/3}\\) дөрес. Туры килгән (диагональ) күзәнәкләрне уртачала: \\(\\overline{\\cos}_{\\text{matched}} = \\tfrac{0.9974 + 0.991 + 0.9949}{3} = \\mathbf{0.9944}\\). Алты диагональдән тыш күзәнәкне уртачала: \\(\\overline{\\cos}_{\\text{mismatched}} = \\tfrac{2.2745}{6} = \\mathbf{0.3791}\\). **Контраст ярыгы** — \\(0.9944 - 0.3791 = \\mathbf{0.6153}\\). :::",
          "Туры килгән парлар \\(1.0\\) тирәсендә утыра; калганы — \\(0.38\\) тирәсендә. Бу \\(\\mathbf{0.6153}\\) ярыгы — нәкъ диагональ ни өчен шулкадәр чиста җиңгәненең сәбәбе, һәм бу очраклы түгел. Бу — күренешкә әйләндерелгән **контраст максаты**."
        ],
      },
    },
