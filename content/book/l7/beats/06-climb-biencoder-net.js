    {
      id: 'climb-biencoder-net', kind: 'prose',
      heading: { en: 'The forward pass', ru: 'Прямой проход', tt: 'Туры үтеш' },
      body: {
        en: [
          "Narrate the two towers as a forward pass. The query string \\(q\\) goes into the encoder and comes out a vector \\(\\mathbf{q}\\); the document \\(d\\) goes into the *same* (or a twin) encoder and comes out \\(\\mathbf{d}\\); both land in one shared space. **Sir Cosine** then reads the angle between them — that cosine is the score. Nothing in the document tower ever looked at the query, which is exactly why \\(\\mathbf{d}\\) can be computed long before any query arrives.",
        ],
        ru: [
          'Опишем две башни как прямой проход. Строка запроса \\(q\\) входит в энкодер и выходит вектором \\(\\mathbf{q}\\); документ \\(d\\) входит в *тот же* (или близнецовый) энкодер и выходит \\(\\mathbf{d}\\); оба попадают в одно общее пространство. **Сэр Косинус** читает угол между ними — этот косинус и есть оценка. Башня документа ни разу не смотрела на запрос — именно поэтому \\(\\mathbf{d}\\) можно вычислить задолго до прихода любого запроса.',
        ],
        tt: [
          'Ике манараны туры үтеш итеп сөйлик. Сорау юлы \\(q\\) энкодерга керә һәм \\(\\mathbf{q}\\) векторы булып чыга; документ \\(d\\) *шул ук* (яки игезәк) энкодерга керә һәм \\(\\mathbf{d}\\) булып чыга; икесе дә бер уртак киңлеккә төшә. **Сэр Косинус** алар арасындагы почмакны укый — бу косинус — бәя. Документ манарасы сорауга бер тапкыр да карамады — нәкъ шуңа \\(\\mathbf{d}\\) теләсә кайсы сорау килгәнче күптән исәпләнә ала.',
        ],
      },
    },
