    {
      id: 'surface-form-miss', kind: 'prose',
      heading: { en: 'Surface forms miss: BM25 rewards only a shared string', ru: 'Промах по формам: BM25 награждает только общую строку', tt: 'Форма буенча промах: BM25 бары уртак юлны бүләкли' },
      body: {
        en: [
          "The second bill is worse, and it lands in **BM25** (from L3). BM25 sums the contribution of terms the query and document *share* — its whole score is a sum over `t ∈ q ∩ d`. No shared string, no term, no contribution. On a fusional language the query and the answer routinely share nothing, so the true answer scores **exactly zero** and never even enters the candidate set.",
          "Worse than a miss: the *wrong* document wins. A passage that happens to repeat the query's exact surface form — even one that is entirely off-topic — out-ranks the real answer. And inverse document frequency splinters: ten forms of one word become ten rare terms, so the frequency statistics smear and the weights lie.",
          "The cure is to normalize **before** you index, symmetrically on both sides, so the query and the corpus fold to a common form and their terms can finally match. The next beats measure exactly how much that changes, by hand.",
        ],
        ru: [
          "Второй счёт хуже, и приходит он в **BM25** (из L3). BM25 суммирует вклад термов, которые запрос и документ *делят*, — весь счёт это сумма по `t ∈ q ∩ d`. Нет общей строки — нет терма, нет вклада. На флективном языке запрос и ответ сплошь и рядом не делят ничего, поэтому настоящий ответ получает **ровно ноль** и даже не попадает в кандидаты.",
          "Хуже промаха: побеждает *не тот* документ. Отрывок, случайно повторивший точную поверхностную форму запроса — пусть даже совсем не по теме, — обходит настоящий ответ. А обратная документная частота раскалывается: десять форм одного слова становятся десятью редкими термами, статистика размывается, веса врут.",
          "Лечение — нормализовать **до** индексации, симметрично с обеих сторон, чтобы запрос и корпус свелись к общей форме и их термы наконец совпали. Следующие такты меряют руками, насколько это меняет картину.",
        ],
        tt: [
          "Икенче хисап яманрак, һәм ул **BM25**\'кә (L3\'тән) килә. BM25 сорау белән документ *уртаклашкан* термнарның өлешен җыя — аның бөтен счёты `t ∈ q ∩ d` буенча сумма. Уртак юл юк — терм юк, өлеш юк. Флектив телдә сорау белән җавап еш кына бернәрсә дә уртаклашмый, шуңа чын җавап **төп-төгәл ноль** ала һәм кандидатларга да кермичә кала.",
          "Промахтан яманрак: *дөрес булмаган* документ җиңә. Сорауның төгәл өслек формасын очраклы кабатлаган өзек — бөтенләй темага туры килмәсә дә — чын җавапны узып китә. Ә кире документ ешлыгы ярыла: бер сүзнең ун формасы ун сирәк термга әйләнә, статистика юкка чыга, авырлыклар алдый.",
          "Дару — индекслаганчы **алдан**, ике якта да симметрик нормальләштерү, сорау белән корпус уртак формага кайтсын һәм алар термнары ниһаять туры килсен. Киләсе битләр моның күпме үзгәртүен кул белән үлчи.",
        ],
      },
    },
