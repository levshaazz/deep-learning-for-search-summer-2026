    {
      id: 'depth-hyde-averaging', kind: 'prose',
      heading: { en: 'What averaging can and cannot fix', ru: 'Что усреднение чинит, а что — нет', tt: 'Уртачалау нәрсәне төзәтә, нәрсәне — юк' },
      body: {
        en: [
          "Why draft \\( k \\) documents and average, rather than trust one? Because any single draft carries **independent noise** — an odd word choice, a tangent, one hallucinated detail unique to that sample. Average \\( k \\) drafts and these idiosyncrasies, pointing in random directions, partly cancel; the vector \\( e = \\frac{1}{k}\\sum_i f(d_i) \\) converges toward the drafts' shared, stable core. This is plain variance reduction: independent errors shrink like \\( 1/\\sqrt{k} \\).",
          "But averaging is powerless against a **systematic bias**. If the generator is *confidently wrong about the domain* — it thinks your espresso question is about a cocktail, and every one of the \\( k \\) drafts leans that way — then the shared error is not noise, it is signal in the wrong direction. Averaging does not cancel it; it *amplifies* it, sharpening the vector's aim at the wrong neighbourhood.",
          "This is why the optional \\( + f(q) \\) anchor earns its keep. Folding the literal question back into the sum tethers \\( e \\) to what the user actually asked, so a confidently-drifting draft cannot drag the query all the way into a foreign topic. Averaging fights *jitter*; the anchor fights *drift*. You need both, because they fail in different directions.",
        ],
        ru: [
          "Зачем набрасывать \\( k \\) документов и усреднять, а не довериться одному? Потому что любой отдельный черновик несёт **независимый шум** — странное слово, отступление, одна галлюцинированная деталь, уникальная для этого сэмпла. Усредни \\( k \\) черновиков — и эти причуды, глядящие в случайные стороны, отчасти гасятся; вектор \\( e = \\frac{1}{k}\\sum_i f(d_i) \\) сходится к общему, устойчивому ядру черновиков. Это обычное снижение дисперсии: независимые ошибки убывают как \\( 1/\\sqrt{k} \\).",
          "Но перед **систематическим смещением** усреднение бессильно. Если генератор *уверенно ошибается насчёт домена* — решил, что твой вопрос про эспрессо на самом деле про коктейль, и все \\( k \\) черновиков кренятся туда, — то общая ошибка уже не шум, а сигнал в неверную сторону. Усреднение её не гасит, а *усиливает*, всё точнее наводя вектор на неправильное соседство.",
          "Вот почему опциональный якорь \\( + f(q) \\) отрабатывает своё место. Вернув буквальный вопрос в сумму, мы привязываем \\( e \\) к тому, что пользователь и правда спросил, — и уверенно дрейфующий черновик уже не утащит запрос целиком в чужую тему. Усреднение борется с *дрожанием*; якорь — с *дрейфом*. Нужны оба, потому что отказывают они в разные стороны.",
        ],
        tt: [
          "Ни өчен \\( k \\) документ сызып уртачаларга, берсенә ышанмыйча? Чөнки һәр аерым черновик **бәйсез шау** алып килә — сәер сүз сайлау, читкә тайпылу, шул сэмплга гына хас бер галлюцинация детале. \\( k \\) черновикны уртачала — һәм очраклы якларга караган бу үзенчәлекләр өлешчә сүнә; \\( e = \\frac{1}{k}\\sum_i f(d_i) \\) векторы черновикларның уртак, тотрыклы үзәгенә якыная. Бу гади дисперсия кимүе: бәйсез хаталар \\( 1/\\sqrt{k} \\) кебек кими.",
          "Ләкин **системалы авышуга** каршы уртачалау көчсез. Әгәр генератор *домен турында ышанычлы рәвештә ялгыша* — синең espresso соравыңны коктейль турында дип уйлый, һәм \\( k \\) черновикның барысы да шунда авыша — булса, уртак хата инде шау түгел, ә ялгыш якка сигнал. Уртачалау аны сүндерми, ә *көчәйтә*, векторны ялгыш күршелеккә тагын да төгәлрәк юнәлтә.",
          "Менә шуңа күрә опциональ \\( + f(q) \\) якоре үз урынын аклый. Литераль сорауны суммага кире кушып, без \\( e \\)'не кулланучы чыннан да сораган нәрсәгә бәйлибез — һәм ышанычлы дрейф ясаган черновик соравны бөтенләй ят темага өстери алмый. Уртачалау *калтырауга* каршы көрәшә; якорь — *дрейфка*. Икесе дә кирәк, чөнки алар төрле якка ватыла.",
        ],
      },
    },
