    {
      id: 'clip-formally', kind: 'prose',
      heading: { en: 'CLIP, formally', ru: 'CLIP, формально', tt: 'CLIP, формаль рәвештә' },
      body: {
        en: [
          "Two encoders, one space. An image encoder \\(f_{\\text{img}}\\) and a text encoder \\(f_{\\text{txt}}\\) map their inputs into the *same* vector space, so an image embedding and a caption embedding are directly comparable by cosine. Cross-modal retrieval then has a one-line definition:",
          "$$ \\text{retrieve}(\\text{image}) = \\operatorname*{arg\\,max}_{j}\\ \\cos\\!\\big(\\mathbf{e}_{\\text{img}},\\ \\mathbf{e}_{\\text{txt}}^{(j)}\\big) $$",
          "Embed the image, embed every candidate caption, take the nearest neighbour by cosine. That is **the same nearest-neighbour search as L9** — argmax cosine, which at scale runs over L9's ANN index — except one side is now a *picture* and the other its *words*. The cleanest way to see it work is a **cosine matrix** of images against captions — and if the space is any good, the **diagonal** (each image with its own caption) should win every row. Let's compute it.",
        ],
        ru: [
          "Два кодировщика, одно пространство. Кодировщик изображений \\(f_{\\text{img}}\\) и кодировщик текста \\(f_{\\text{txt}}\\) отображают входы в *одно и то же* векторное пространство, так что эмбеддинг изображения и эмбеддинг подписи напрямую сравнимы по косинусу. Тогда у кросс-модального поиска — однострочное определение:",
          "$$ \\text{retrieve}(\\text{image}) = \\operatorname*{arg\\,max}_{j}\\ \\cos\\!\\big(\\mathbf{e}_{\\text{img}},\\ \\mathbf{e}_{\\text{txt}}^{(j)}\\big) $$",
          "Заэмбедь изображение, заэмбедь каждую подпись-кандидат, возьми ближайшего соседа по косинусу. Это **тот же поиск ближайшего соседа, что и в L9** — argmax косинуса, который на масштабе идёт по ANN-индексу из L9, — только одна сторона теперь *картинка*, а другая — её *слова*. Чище всего это видно на **косинусной матрице** изображений против подписей — и если пространство хоть чего-то стоит, **диагональ** (каждое изображение со своей подписью) должна выигрывать в каждой строке. Посчитаем.",
        ],
        tt: [
          "Ике кодлаучы, бер киңлек. Рәсем кодлаучысы \\(f_{\\text{img}}\\) һәм текст кодлаучысы \\(f_{\\text{txt}}\\) кергечләрне *бер үк* вектор киңлегенә чагылдыра, шуңа рәсем эмбеддингы һәм язма эмбеддингы косинус буенча турыдан-туры чагыштырыла. Шунда кросс-модаль эзләүнең бер юллы билгеләмәсе бар:",
          "$$ \\text{retrieve}(\\text{image}) = \\operatorname*{arg\\,max}_{j}\\ \\cos\\!\\big(\\mathbf{e}_{\\text{img}},\\ \\mathbf{e}_{\\text{txt}}^{(j)}\\big) $$",
          "Рәсемне эмбеддла, һәр кандидат язманы эмбеддла, косинус буенча иң якын күршене ал. Бу — **L9 дагы белән үк бер иң якын күрше эзләве** — argmax косинус, ул масштабта L9 ның ANN-индексы буенча эшли, — тик бер ягы хәзер *рәсем*, ә икенчесе аның *сүзләре*. Моны иң ачык күрү ысулы — рәсемнәрне язмаларга каршы куйган **косинус матрицасы** — һәм киңлек берәр нәрсәгә тора икән, **диагональ** (һәр рәсем үз язмасы белән) һәр юлда җиңәргә тиеш. Әйдә исәплик."
        ],
      },
    },
