    {
      id: 'depth-finetune-heads', kind: 'prose',
      heading: { en: "One tower, snap-on heads", ru: "Одна башня, сменные головы", tt: "Бер манара, алмаш башлар" },
      body: {
        en: [
          "Here is what the tailoring looks like up close. The pretrained tower stays one and the same: threads go in, and out comes the fully woven sheet \\(H\\) — one contextual vector per position. On top of that sheet you pin a **head**, and the head is deliberately tiny. For classification — is the review sour or sweet? does one sentence entail the other? — the head is a single linear layer over the \\([CLS]\\) aggregate, softmax over the labels, done. For extractive question answering the head is two span pointers over the context threads: one scores every position as a possible *start* of the answer, the other as a possible *end*.",
          "The tower is one; the heads are interchangeable — a different light attachment per task, snapped onto the same loom. And in the usual recipe the tower is not frozen under the head: base and head are stitched **together**, end to end — the whole cloth shifts slightly toward the task while the head learns to read it.",
        ],
        ru: [
          "Вот как выглядит кройка вблизи. Предобученная башня остаётся одной и той же: нити входят — выходит целое сотканное полотно \\(H\\), по контекстному вектору на позицию. Поверх полотна прикалывается **голова**, и она нарочно крохотная. Для классификации — отзыв кислый или сладкий? следует ли одно предложение из другого? — голова — это один линейный слой над агрегатом \\([CLS]\\), софтмакс по меткам, всё. Для извлекающего QA голова — два указателя пролёта (span) над нитями контекста: один оценивает каждую позицию как возможное *начало* ответа, другой — как возможный *конец*.",
          "Башня одна; головы сменные — по лёгкой насадке на задачу, пристёгнутой к тому же станку. И в обычном рецепте башню под головой не замораживают: базу и голову прошивают **вместе**, насквозь, — полотно чуть сдвигается к задаче, пока голова учится его читать.",
        ],
        tt: [
          "Менә кисү-тегү якыннан ничек күренә. Pretrain ителгән манара бер үк булып кала: җепләр керә — тулы тукылган тукыма \\(H\\) чыга, һәр позициягә берәр контекст вектор. Тукыма өстенә **баш** кадала, һәм ул юри бик кечкенә. Классификация өчен — отзыв әчеме, төчеме? бер җөмлә икенчесеннән киләме? — баш \\([CLS]\\) агрегаты өстендәге бер сызыклы катлам, метка буенча softmax, бетте. Extractive QA өчен баш — контекст җепләре өстендә ике span-күрсәткеч: берсе һәр позицияне җавапның мөмкин *башы* итеп бәяли, икенчесе — мөмкин *ахыры* итеп.",
          "Манара бер; башлар алмаш — һәр бурычка үз җиңел кушымтасы, шул ук станокка эләктерелә. Һәм гадәти рецептта манараны баш астында катырмыйлар: нигез белән башны **бергә**, үтәли тегәләр — баш укырга өйрәнгәндә тукыма үзе дә бурычка таба бераз күчә.",
        ],
      },
    },
