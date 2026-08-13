    {
      id: 'catch-pooling-cls-vs-mean', kind: 'prose',
      heading: { en: 'The pooling trap', ru: 'Ловушка пулинга', tt: 'Пулинг тозагы' },
      body: {
        en: [
          "A silent accuracy lever: how you collapse the token vectors into one sentence vector. The natural guess is to take the \\([\\text{CLS}]\\) token, but SBERT showed that for *similarity* tasks, **mean-pooling** the token vectors beats \\([\\text{CLS}]\\). An untuned \\([\\text{CLS}]\\) was trained for classification, not for cosine geometry, so it sits in an awkward spot; averaging all tokens gives a more isotropic, better-behaved sentence vector. Small choice, real points of recall.",
        ],
        ru: [
          'Незаметный рычаг точности: как свернуть векторы токенов в один вектор предложения. Естественная догадка — взять токен \\([\\text{CLS}]\\), но SBERT показал, что для задач *близости* **усреднение** векторов токенов бьёт \\([\\text{CLS}]\\). Ненастроенный \\([\\text{CLS}]\\) учился под классификацию, а не под косинусную геометрию, и потому сидит в неудобном месте; усреднение всех токенов даёт более изотропный, лучше ведущий себя вектор. Мелочь на вид — а полнота растёт вполне ощутимо.',
        ],
        tt: [
          'Тын төгәллек рычагы: токен векторларын бер җөмлә векторына ничек сыендырасың. Табигый фараз — \\([\\text{CLS}]\\) токенын алу, ләкин SBERT *охшашлык* мәсьәләләре өчен токен векторларын **уртачалау** \\([\\text{CLS}]\\)’ны җиңүен күрсәтте. Көйләнмәгән \\([\\text{CLS}]\\) классификация өчен өйрәнгән, косинус геометриясе өчен түгел, шуңа уңайсыз урында утыра; барлык токеннарны уртачалау яхшырак, изотроп вектор бирә. Кечкенә сайлау — чын тулылык пунктлары.',
        ],
      },
    },
