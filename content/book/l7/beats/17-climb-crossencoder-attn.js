    {
      id: 'climb-crossencoder-attn', kind: 'prose',
      heading: { en: 'Reading the q&times;d heatmap', ru: 'Чтение q&times;d теплокарты', tt: 'q&times;d җылыкартаны уку' },
      body: {
        en: [
          "The reason joint reading works is the cross-attention *across* the \\([\\text{SEP}]\\). In the widget&rsquo;s q&times;d heatmap, each query token (a row) spreads its attention over the document tokens (the columns), and each row sums to 1. A query token lights up on the document token that answers it — \"flood\" attends to \"flood\", \"river\" to \"bank\". That is information a bi-encoder can never use: its two towers finish before either has seen the other, so no query token ever attends to a document token.",
        ],
        ru: [
          'Совместное чтение работает за счёт кросс-внимания *через* \\([\\text{SEP}]\\). В теплокарте q&times;d виджета каждый токен запроса (строка) распределяет внимание по токенам документа (столбцы), и каждая строка в сумме даёт 1. Токен запроса загорается на том токене документа, который ему отвечает: «flood» смотрит на «flood», «river» — на «bank». Это информация, которой би-энкодер воспользоваться не может: его две башни завершают работу прежде, чем одна из них увидит другую, так что ни один токен запроса так и не смотрит на токен документа.',
        ],
        tt: [
          'Бергә уку \\([\\text{SEP}]\\) *аша* кросс-игътибар аркасында эшли. Виджетның q&times;d җылыкартасында һәр сорау токены (юл) игътибарын документ токеннары (баганалар) буенча тарата, һәр юл суммасы 1. Сорау токены үзенә җавап бирүче документ токенында яктыра: «flood» «flood»’ка карый, «river» «bank»’ка. Бу — би-энкодер куллана алмаган мәгълүмат: аның ике манарасы берсе икенчесен күргәнче тәмамлана, шуңа бер сорау токены да документ токенына карамый.',
        ],
      },
    },
