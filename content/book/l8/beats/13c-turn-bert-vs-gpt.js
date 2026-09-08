    {
      id: 'turn-bert-vs-gpt', kind: 'prose',
      heading: { en: "The reader and the writer", ru: "Читатель и писатель", tt: "Укучы һәм язучы" },
      body: {
        en: [
          "Set the two paradigms side by side and the chapter folds into one picture. **BERT — encoder + fine-tune**: the reader. It sees the whole cloth both ways, and to point it at a task you *change it* — pretrain once, then fine-tune a light head and the weights on a labelled set. Its home ground is understanding — classification, QA — wherever labels exist. **GPT — decoder + prompt**: the writer. It weaves forward under the curtain, and to point it at a task you *talk to it* — state the job, pin a few examples if need be; the weights stay untouched.",
          "So the choice is not “which is better” but “whose contract fits”. A fixed task and a labelled set → the fine-tuned reader is precise and hard to beat. No labels, or a task that changes by the hour → the writer takes the job straight from a prompt. One loom, the same crossings of thread over thread — and two ways of bending it to a task: one adapts its *weights*, the other adapts its *context*.",
        ],
        ru: [
          "Поставь две парадигмы рядом — и глава сложится в одну картинку. **BERT — энкодер + дообучение**: читатель. Он видит всё полотно в обе стороны, и, чтобы навести его на задачу, ты его *меняешь* — предобучил один раз, затем дообучаешь лёгкую голову и веса на размеченной выборке. Его родная земля — понимание: классификация, QA — везде, где есть разметка. **GPT — декодер + промпт**: писатель. Он ткёт вперёд под занавесом, и, чтобы навести его на задачу, ты с ним *разговариваешь* — называешь работу, при случае подшиваешь пару примеров; веса остаются нетронутыми.",
          "Так что выбор — не «кто лучше», а «чей контракт подходит». Фиксированная задача и размеченная выборка → дообученный читатель точен, и обойти его трудно. Разметки нет или задача меняется каждый час → писатель берёт работу прямо из промпта. Один станок, те же пересечения нити с нитью — и два способа согнуть его под задачу: один подстраивает *веса*, другой — *контекст*.",
        ],
        tt: [
          "Ике парадигманы янәшә куй — глава бер рәсемгә җыела. **BERT — encoder + fine-tune**: укучы. Ул бөтен тукыманы ике якка күрә, һәм аны бурычка юнәлтер өчен син аны *үзгәртәсең* — бер тапкыр алдан өйрәттең, аннары тамгаланган җыелмада җиңел башны һәм weights'ны fine-tune ясыйсың. Аның туган җире — аңлау: классификация, QA — тамга булган һәр урын. **GPT — decoder + промпт**: язучы. Ул пәрдә астында алга тукый, һәм аны бурычка юнәлтер өчен син аның белән *сөйләшәсең* — эшне атыйсың, кирәк булса берничә үрнәк кыстырасың; weights кагылмыйча кала.",
          "Димәк, сайлау — «кайсысы яхшырак» түгел, «кайсы килешү туры килә». Билгеле бурыч һәм тамгаланган җыелма → fine-tune ясалган укучы төгәл, аны узу кыен. Тамга юк, яки бурыч сәгать саен үзгәрә → язучы эшне туп-туры промпттан ала. Бер станок, җеп белән җепнең шул ук кисешүләре — һәм аны бурычка бөгүнең ике юлы: берсе *weights'ны* көйли, икенчесе — *контекстны*.",
        ],
      },
    },
