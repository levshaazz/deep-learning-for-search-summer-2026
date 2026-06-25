    {
      id: 'turn-teacher', kind: 'prose',
      heading: { en: 'The teacher unmasks the impostor', ru: 'Учитель срывает маску', tt: 'Остаз битлекне ача' },
      img: 'L13/L13-12-master-smith.png', imgPos: 'mascot',
      imgAlt: {
        en: "The master smith — a cross-encoder teacher reading query and passage together — grading each negative so the student keeps the worthy hard one and drops the impostor.",
        ru: "Мастер-кузнец — учитель-кросс-энкодер, читающий запрос и пассаж вместе, — оценивает каждый негатив, чтобы ученик оставил достойный трудный и отбросил самозванца.",
        tt: "Оста тимерче — сорау белән пассажны бергә укый торган кросс-энкодер укытучы — һәр негативны бәяли, шунда укучы лаеклы авырын калдыра, ә алдакчыны ташлый.",
      },
      imgCaption: {
        en: "A cross-encoder teacher reads query and passage together and grades each negative — keeping the worthy, unmasking the impostor.",
        ru: "Учитель-кросс-энкодер читает запрос и пассаж вместе и оценивает каждый негатив — достойного оставляет, самозванца разоблачает.",
        tt: "Кросс-энкодер укытучы сорау белән пассажны бергә укый һәм һәр негативны бәяли — лаеклысын калдыра, алдакчыны фаш итә.",
      },
      body: {
        en: [
          "The duel now becomes tutelage. Instead of a blunt right/wrong label, a strong **teacher** — a cross-encoder that reads the query and passage together — grades each pair with a soft *margin*: how much better the positive is than the negative. The student learns to match that margin.",
          "This is gentle with impostors by design. When a mined negative is really an unlabelled positive, the teacher gives it a *high* score, so the target margin shrinks toward zero or flips sign — and the student is no longer told to shove a correct answer away. The teacher quietly unmasks the impostor.",
        ],
        ru: [
          "Дуэль теперь становится наставничеством. Вместо грубой метки верно/неверно сильный **учитель** — кросс-энкодер, читающий запрос и пассаж вместе, — оценивает каждую пару мягким *отступом*: насколько позитив лучше негатива. Ученик учится воспроизводить этот отступ.",
          "С импостором это мягко по построению. Когда намайненный негатив на самом деле неразмеченный позитив, учитель даёт ему *высокий* балл, так что целевой отступ стремится к нулю или меняет знак — и ученику больше не велят отталкивать верный ответ. Учитель тихо срывает с импостора маску.",
        ],
        tt: [
          "Дуэль хәзер остазлыкка әйләнә. Тупас дөрес/ялгыш билгесе урынына көчле **остаз** — сорауны һәм пассажны бергә укыган кросс-энкодер — һәр парны йомшак *чик* белән бәяли: позитив негативтан күпме яхшырак. Шәкерт шул чикне кабатларга өйрәнә.",
          "Самозванец белән бу төзелеше буенча йомшак. Майнинг негатив чынлыкта билгеләнмәгән позитив булса, остаз аңа *югары* балл бирә, шуңа максат чиге нульгә якынлаша яки тамгасын алмаштыра — һәм шәкерткә дөрес җавапны этәргә кушылмый. Остаз тыныч кына самозванецның битлеген ача.",
        ],
      },
    },
