    {
      id: 'clip-real-llava', kind: 'prose',
      heading: { en: 'A real vision model retrieves', ru: 'Реальная зрительная модель извлекает', tt: 'Чын күрү моделе ала' },
      body: {
        en: [
          "The matrix was a toy. Does a real vision model do this? We ran **llava:7b** — a genuine vision-language model — on a forced-choice image→caption task over **5 text-free shapes**. *Text-free* is the point: with no letters in the picture, the model cannot cheat by reading; it has to actually *see* the shape.",
          ":::calc For each image, embed it and score it against every candidate caption: \\(\\text{image} \\longrightarrow \\operatorname*{arg\\,max}_j \\cos(\\mathbf{e}_{\\text{img}}, \\mathbf{e}_{\\text{txt}}^{(j)})\\) — the same argmax as the matrix diagonal. The model's top pick was the correct caption every single time. Top-1 accuracy \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Five out of five, on a real multimodal model, reading pictures rather than letters. The toy diagonal was not a coincidence of hand-picked vectors — cross-modal retrieval in a shared space is something a real model genuinely does.",
        ],
        ru: [
          "Матрица была игрушкой. А делает ли так реальная зрительная модель? Мы прогнали **llava:7b** — настоящую визуально-языковую модель — на задаче вынужденного выбора изображение→подпись по **5 бестекстовым фигурам**. *Бестекстовость* и есть суть: без букв на картинке модель не может сжульничать чтением — ей приходится по-настоящему *видеть* фигуру.",
          ":::calc Для каждого изображения заэмбедь его и оцени против каждой подписи-кандидата: \\(\\text{image} \\longrightarrow \\operatorname*{arg\\,max}_j \\cos(\\mathbf{e}_{\\text{img}}, \\mathbf{e}_{\\text{txt}}^{(j)})\\) — тот же argmax, что и диагональ матрицы. Лучший выбор модели был верной подписью каждый раз. Точность top-1 \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Пять из пяти, на реальной мультимодальной модели, читающей картинки, а не буквы. Игрушечная диагональ не была совпадением подобранных вручную векторов — кросс-модальный поиск в общем пространстве реальная модель и впрямь умеет.",
        ],
        tt: [
          "Матрица уенчык иде. Чын күрү моделе шулай эшлиме? Без **llava:7b** ны — чын күрү-тел моделен — **5 текстсыз фигура** буйлап рәсем→язма мәҗбүри сайлау бурычында эшләттек. *Текстсызлык* — нәкъ шунда: рәсемдә хәрефләр булмагач, модель уку белән алдаша алмый — аңа фигураны чыннан да *күрергә* туры килә.",
          ":::calc Һәр рәсем өчен аны эмбеддла һәм һәр кандидат язмага каршы бәялә: \\(\\text{image} \\longrightarrow \\operatorname*{arg\\,max}_j \\cos(\\mathbf{e}_{\\text{img}}, \\mathbf{e}_{\\text{txt}}^{(j)})\\) — матрица диагональе белән шул ук argmax. Модельнең иң яхшы сайлавы һәр тапкыр дөрес язма булды. Top-1 төгәллеге \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Биштән биш, чын мультимодаль модельдә, хәрефләрне түгел рәсемнәрне укып. Уенчык диагональ кул белән сайланган векторларның очраклылыгы түгел иде — уртак киңлектә кросс-модаль эзләүне чын модель чыннан да башкара."
        ],
      },
    },
