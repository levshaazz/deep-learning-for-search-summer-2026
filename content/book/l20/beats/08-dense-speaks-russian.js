    {
      id: 'dense-speaks-russian', kind: 'prose',
      heading: { en: 'Dense retrieval speaks Russian — if it saw Russian', ru: 'Плотный поиск говорит по-русски — если видел русский', tt: 'Плотный эзләү русча сөйли — рус күргән булса' },
      img: 'L20/L20-05-multilingual-space.png', imgPos: 'float-left',
      imgAlt: { en: "Séréga before one shared cosine space where a Russian word and its inflected form land next to each other and an English word of the same meaning lands nearby — matched by meaning, not spelling. His green tübetey is the only green.", ru: "Серёга у общего косинусного пространства, где русское слово и его словоформа ложатся рядом, а английское слово того же смысла — поблизости, совпадение по смыслу, а не по написанию. Единственное зелёное — тюбетейка.", tt: "Séréga уртак косинус киңлеге алдында: рус сүзе һәм аның формасы янәшә төшә, шул ук мәгънәдәге инглиз сүзе якында — язылыш түгел, мәгънә буенча туры килү. Бердәнбер яшел — түбәтәе." },
      imgCaption: { en: "One shared space: inflected forms land close on their own, no lemmatizer required.", ru: "Одно общее пространство: словоформы ложатся рядом сами, без лемматизатора.", tt: "Бер уртак киңлек: сүзформалар үзләре янәшә төшә, лемматизаторсыз." },
      body: {
        en: [
          "A bi-encoder (from L7) scores by vector similarity, not string overlap, so it sidesteps the surface-form miss entirely — inflected forms of one word land close in the space on their own. Two mechanisms combine: sub-word tokenization means *котёнок* and *котята* share a stem piece (so the very fragmentation that was a tax in Act 1 becomes a soft match here), and contrastive training places different forms of one meaning near each other.",
          "The catch is a prerequisite: the encoder must have **seen Russian** in training. The English default from L7 has an English-centric vocabulary and was tuned on English pairs, so its Russian is weak and zero-shot transfer sags. You need either a **multilingual** encoder — multilingual-E5, BGE-M3, LaBSE — or a **ru-specific** one.",
          "So dense retrieval usually needs no explicit lemmatizer: the morphology dissolves into the vector. But that only holds if both the query and the corpus live in one Russian-aware space — the same symmetry lesson, one layer up.",
        ],
        ru: [
          "Би-энкодер (из L7) считает по близости векторов, а не по совпадению строк, поэтому промах по формам обходится сам собой — словоформы одного слова ложатся в пространстве рядом. Складываются два механизма: субсловная токенизация означает, что *котёнок* и *котята* делят кусок основы (и то самое дробление, что было налогом в Акте 1, здесь становится мягким совпадением), а контрастное обучение кладёт разные формы одного смысла рядом.",
          "Подвох — предусловие: энкодер должен был **видеть русский** при обучении. Английский дефолт из L7 со словарём под английский и обученный на английских парах знает русский слабо, и zero-shot проседает. Нужен либо **мультиязычный** энкодер — multilingual-E5, BGE-M3, LaBSE, — либо **ru-специфичный**.",
          "Поэтому плотный поиск обычно не требует отдельного лемматизатора: морфология растворяется в векторе. Но это верно, только если и запрос, и корпус живут в одном русско-понимающем пространстве — тот же урок симметрии, этажом выше.",
        ],
        tt: [
          "Би-энкодер (L7\'дән) юллар туры килүе буенча түгел, векторлар якынлыгы буенча исәпли, шуңа форма буенча промахны үзеннән-үзе урап уза — бер сүзнең формалары киңлектә янәшә төшә. Ике механизм кушыла: субсүз токенизациясе *котёнок* белән *котята*\'ның нигез кисәген уртаклашуын аңлата (һәм Акт 1\'дә налог булган шул таркалу монда йомшак туры килүгә әйләнә), ә контрастив өйрәтү бер мәгънәнең төрле формаларын янәшә куя.",
          "Хәйлә — шарт: энкодер өйрәнгәндә **русны күргән** булырга тиеш. L7\'дән инглиз default инглизгә көйләнгән сүзлек белән һәм инглиз парларында өйрәтелгән, шуңа русны начар белә, zero-shot төшә. Я **мультител** энкодер кирәк — multilingual-E5, BGE-M3, LaBSE — я **ru-специфик**.",
          "Шуңа плотный эзләү гадәттә аерым лемматизатор таләп итми: морфология векторда эри. Ләкин бу сорау да, корпус та бер рус-аңлаучы киңлектә яшәгәндә генә дөрес — шул ук симметрия сабагы, бер кат югарырак.",
        ],
      },
    },
