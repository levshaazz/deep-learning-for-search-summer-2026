    {
      id: 'climb-crossencoder-attn', kind: 'prose',
      heading: { en: 'Reading the q&times;d heatmap', ru: 'Чтение тепловой карты q&times;d', tt: 'q&times;d җылыкартаны уку' },
      body: {
        en: [
          "The reason joint reading works is the cross-attention *across* the \\([\\text{SEP}]\\). In the widget&rsquo;s q&times;d heatmap, each query token (a row) spreads its attention over the document tokens (the columns), and each row sums to 1. A query token can light up on any document token — here the query \"flood\" lands hardest on the document&rsquo;s \"not\", while \"river\" and \"did\" land on the shared \"flood\". That cross-token link is information a bi-encoder can never use: its two towers finish before either has seen the other, so no query token ever attends to a document token. What the Judge then *does* with that \"not\" — whether it penalises the match — is the linear head&rsquo;s call, worked out on the next slide.",
        ],
        ru: [
          'Совместное чтение работает за счёт кросс-внимания *через* \\([\\text{SEP}]\\). На тепловой карте q&times;d в виджете каждый токен запроса (строка) распределяет внимание по токенам документа (столбцы), и каждая строка в сумме даёт 1. Токен запроса может загореться на любом токене документа: здесь запрос «flood» сильнее всего ложится на «not» документа, а «river» и «did» — на общий «flood». Эта связь через токены — информация, которой би-энкодер воспользоваться не может: его две башни завершают работу прежде, чем одна из них увидит другую, так что ни один токен запроса так и не смотрит на токен документа. А что Судья *сделает* с этим «not» — накажет ли совпадение — решает линейная голова, и это разбирается на следующем слайде.',
        ],
        tt: [
          'Бергә уку \\([\\text{SEP}]\\) *аша* кросс-игътибар аркасында эшли. Виджетның q&times;d җылыкартасында һәр сорау токены (юл) игътибарын документ токеннары (баганалар) буенча тарата, һәр юл суммасы 1. Сорау токены теләсә кайсы документ токенында яктыра ала: монда сорау «flood» иң нык документның «not»’ына төшә, ә «river» белән «did» — уртак «flood»’ка. Бу токеннар арасындагы бәйләнеш — би-энкодер куллана алмаган мәгълүмат: аның ике манарасы берсе икенчесен күргәнче тәмамлана, шуңа бер сорау токены да документ токенына карамый. Ә Судья бу «not» белән нәрсә *эшләр* — туры килүне җәзалармы — сызыклы баш хәл итә, һәм бу киләсе слайдта карала.',
        ],
      },
    },
