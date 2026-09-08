    {
      id: 'depth-learned-sparse-family', kind: 'prose',
      heading: { en: 'The learned-sparse zoo', ru: 'Зоопарк выученной разрежённости', tt: 'Өйрәнелгән сирәклек зоопаркы' },
      body: {
        en: [
          "SPLADE is not alone. **docT5query** generates likely queries for a document and appends them to it — doc-side expansion before indexing. **uniCOIL** learns a single weight per term over contextual representations. **DeepImpact** learns term-impact weights for the document. **TILDE** does language-model-based expansion and re-weighting.",
          "The common thread: push a neural signal into posting lists, and split the work between the query side and the document side differently. All of them keep the inverted index, and all of them beat raw BM25 on the benchmarks that matter.",
        ],
        ru: [
          "SPLADE не одинок. **docT5query** генерирует вероятные запросы к документу и дописывает их в него — расширение со стороны документа до индексации. **uniCOIL** учит один вес на термин поверх контекстных представлений. **DeepImpact** учит веса влияния термина для документа. **TILDE** делает расширение и переоценку на основе языковой модели.",
          "Общая нить: протолкнуть нейронный сигнал в постинг-листы и по-разному поделить работу между стороной запроса и стороной документа. Все они сохраняют инвертированный индекс и все обходят сырой BM25 на значимых бенчмарках.",
        ],
        tt: [
          "SPLADE ялгыз түгел. **docT5query** документ өчен ихтимал сорауларны ясый һәм аларны аңа өсти — индексларга кадәр документ ягыннан киңәйтү. **uniCOIL** контекстлы күзаллаулар өстендә терминга бер авырлык өйрәнә. **DeepImpact** документ өчен термин йогынтысы авырлыкларын өйрәнә. **TILDE** тел моделенә нигезләнгән киңәйтү һәм яңадан үлчәү эшли.",
          "Уртак җеп: постинг-исемлекләргә нейрон сигнал кертү һәм эшне сорау ягы белән документ ягы арасында төрлечә бүлү. Барысы да инвертланган индексны саклый һәм барысы да мөһим бенчмаркларда чи BM25 ны уза.",
        ],
      },
    },
