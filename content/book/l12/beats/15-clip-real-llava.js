    {
      id: 'clip-real-llava', kind: 'prose',
      heading: { en: 'A real vision model reads the picture', ru: 'Реальная зрительная модель читает картинку', tt: 'Чын күрү моделе рәсемне укый' },
      body: {
        en: [
          "The matrix was a toy. Does a real vision model do this? We ran **llava:7b** — a genuine vision-language model — on a forced-choice image→caption task over **5 text-free shapes**. *Text-free* is the point: with no letters in the picture, the model cannot cheat by reading; it has to actually *see* the shape.",
          ":::calc For each image, llava is shown the five candidate captions and asked which one fits — *\"Reply with only the number\"*. It is a **generative** model, not a CLIP dual-encoder, so there is no image embedding and no cosine here: it reads the picture and the captions and *generates* its choice \\(j^\\star\\). On all five text-free shapes its pick was the correct caption. Top-1 accuracy \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Five out of five, on a real multimodal model, reading pictures rather than letters. The toy CLIP matrix (cosine in a shared space) was the *mechanism*; here a different kind of model — generative — reaches the same answer by grounding its words in the pixels. Either way, a real vision model genuinely connects images and text. (n=5 is an existence-proof, not a benchmark.)",
        ],
        ru: [
          "Матрица была игрушкой. А делает ли так реальная зрительная модель? Мы прогнали **llava:7b** — настоящую визуально-языковую модель — на задаче вынужденного выбора изображение→подпись по **5 бестекстовым фигурам**. *Бестекстовость* и есть суть: без букв на картинке модель не может сжульничать чтением — ей приходится по-настоящему *видеть* фигуру.",
          ":::calc Для каждого изображения llava показывают пять подписей-кандидатов и спрашивают, какая подходит — *«Ответь только номером»*. Это **генеративная** модель, а не двойной кодировщик CLIP, поэтому здесь нет ни эмбеддинга картинки, ни косинуса: она читает картинку и подписи и *генерирует* свой выбор \\(j^\\star\\). На всех пяти бестекстовых фигурах её выбор был верной подписью. Точность top-1 \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Пять из пяти, на реальной мультимодальной модели, читающей картинки, а не буквы. Игрушечная матрица CLIP (косинус в общем пространстве) была *механизмом*; здесь модель другого типа — генеративная — приходит к тому же ответу, заземляя свои слова в пикселях. Так или иначе, реальная зрительная модель и впрямь связывает изображения и текст. (n=5 — доказательство существования, не бенчмарк.)",
        ],
        tt: [
          "Матрица уенчык иде. Чын күрү моделе шулай эшлиме? Без **llava:7b** ны — чын күрү-тел моделен — **5 текстсыз фигура** буйлап рәсем→язма мәҗбүри сайлау бурычында эшләттек. *Текстсызлык* — нәкъ шунда: рәсемдә хәрефләр булмагач, модель уку белән алдаша алмый — аңа фигураны чыннан да *күрергә* туры килә.",
          ":::calc Һәр рәсем өчен llava га биш кандидат язма күрсәтелә һәм кайсысы туры килгәне сорала — *«Бары номер белән җавап бир»*. Бу — **генератив** модель, CLIP ның ике кодлаучысы (дуаль кодлаучы) түгел, шуңа монда рәсем эмбеддингы да, косинус та юк: ул рәсемне һәм язмаларны укый һәм үз сайлавын *генерацияли* \\(j^\\star\\). Биш текстсыз фигураның барысында да аның сайлавы дөрес язма булды. Top-1 төгәллеге \\(= 5/5 = \\mathbf{1.0}\\). :::",
          "Биштән биш, чын мультимодаль модельдә, хәрефләрне түгел рәсемнәрне укып. Уенчык CLIP матрицасы (уртак киңлектәге косинус) — *механизм* иде; монда башка төрле модель — генератив — үз сүзләрен пиксельләргә нигезләп шул ук җавапка килә. Ничек булса да, чын күрү моделе чыннан да рәсемнәр белән текстны бәйли. (n=5 — бар булуның дәлиле, бенчмарк түгел.)"
        ],
      },
    },
