    {
      id: 'faithfulness-worked', kind: 'prose',
      heading: { en: 'Faithfulness, by hand', ru: 'Верность, вручную', tt: 'Тугрылык, кул белән' },
      img: 'L11/L11-03-faithfulness-claims.png', imgPos: 'float-right',
      imgAlt: {
        en: 'RAGdoll the Oracle\'s answer broken into four claim-cards — three carry a checkmark with a thread tracing back to a retrieved passage, while the fourth, the William Harvey 1628 claim, floats with a red cross and no thread; Séréga, in his green tübetey, tallies three of four for a faithfulness of 0.75.',
        ru: 'Ответ Оракула RAGdoll разбит на четыре карточки-утверждения: три с галочкой и нитью, ведущей к извлечённому отрывку, а четвёртая — утверждение про Уильяма Гарвея 1628 — висит с красным крестом и без нити; Серёга в зелёной тюбетейке считает три из четырёх, верность 0,75.',
        tt: 'RAGdoll Оракулының җавабы дүрт раслау-картага вата — өчесендә тамга һәм алынган өзеккә кайтучы җеп, ә дүртенчесе, Уильям Гарвей 1628 раславы, кызыл хач белән һәм җепсез эленеп тора; яшел түбәтәйле Серёга дүрттән өчне саный, тугрылык 0,75.',
      },
      body: {
        en: [
          "Take a real answer to *\"How does the heart pump blood?\"* and break it into atomic claims. Faithfulness asks, of each claim: is it **entailed by a retrieved passage**? Count the supported claims, divide by the total. One hallucinated sentence — however fluent — drops the score by a full quarter.",
          ":::calc The answer makes \\(4\\) claims. Three are supported by the context: *the heart is a muscular organ that pumps blood* \\(\\checkmark\\), *it contracts rhythmically* \\(\\checkmark\\), *ventricular systole ejects blood into the arteries* \\(\\checkmark\\). The fourth — *\"William Harvey discovered this circulation in 1628\"* — is fluent, plausible, and **nowhere in the retrieved context** \\(\\times\\). So faithfulness \\(= \\dfrac{3}{4} = \\mathbf{0.75}\\). :::",
          "The Harvey sentence is the planted hallucination: a true-sounding fact the model added from its own parameters, ungrounded in anything we retrieved. Faithfulness catches it directly — it is the metric that puts a number on *grounding*. Notice it says nothing about whether the answer is on-topic or complete; it only asks whether every claim has a source. That is its whole job, and it does it with arithmetic a student can check.",
        ],
        ru: [
          "Возьми настоящий ответ на *«Как сердце качает кровь?»* и разбей на атомарные утверждения. Верность спрашивает о каждом: **следует ли оно из извлечённого отрывка**? Сосчитай поддержанные, подели на общее число. Одно галлюцинированное предложение — сколь угодно беглое — роняет оценку на целую четверть.",
          ":::calc Ответ делает \\(4\\) утверждения. Три поддержаны контекстом: *сердце — мышечный орган, качающий кровь* \\(\\checkmark\\), *оно ритмично сокращается* \\(\\checkmark\\), *желудочковая систола выбрасывает кровь в артерии* \\(\\checkmark\\). Четвёртое — *«Уильям Гарвей открыл это кровообращение в 1628»* — бегло, правдоподобно и **нигде в извлечённом контексте не встречается** \\(\\times\\). Значит верность \\(= \\dfrac{3}{4} = \\mathbf{0{,}75}\\). :::",
          "Предложение про Гарвея — подсаженная галлюцинация: правдоподобный факт, что модель добавила из собственных параметров, не заземлённый ни в чём извлечённом. Верность ловит его напрямую — это метрика, которая ставит число на *заземление*. Заметь: она ничего не говорит о том, по теме ли ответ и полон ли он; она лишь спрашивает, есть ли у каждого утверждения источник. В этом вся её работа, и она делает её арифметикой, которую студент может проверить.",
        ],
        tt: [
          "*«Йөрәк канны ничек кудыра?»* дигәнгә чын җавапны ал һәм атомар раслауларга вата. Тугрылык һәрберсе турында сорый: **ул алынган өзектән киләме**? Раслангыннарны сана, гомуми санга бүл. Бер галлюцинацияләнгән җөмлә — никадәр шома булса да — бәяне дүрттән бергә төшерә.",
          ":::calc Җавап \\(4\\) раслау ясый. Өчесе контекст белән расланган: *йөрәк — канны кудыручы мускуллы орган* \\(\\checkmark\\), *ул ритмлы кысыла* \\(\\checkmark\\), *карынчык систоласы канны артерияләргә чыгара* \\(\\checkmark\\). Дүртенчесе — *«Уильям Гарвей бу кан әйләнешен 1628 дә ачкан»* — шома, ышандыргыч һәм **алынган контекстта беркайда юк** \\(\\times\\). Шуңа тугрылык \\(= \\dfrac{3}{4} = \\mathbf{0{,}75}\\). :::",
          "Гарвей җөмләсе — утыртылган галлюцинация: модель үз параметрларыннан өстәгән ышандыргыч факт, алынган бернәрсәгә дә нигезләнмәгән. Тугрылык аны туры тота — бу *нигезләнүгә* сан куючы метрика. Игътибар ит: ул җавапның тема буенчамы яки тулымы икәне турында бернәрсә әйтми; ул бары һәр раслауның чыганагы бармы дип сорый. Бу — аның бөтен эше, һәм ул аны студент тикшерә алырлык арифметика белән башкара.",
        ],
      },
    },
