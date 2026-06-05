// assignments.js — the catalog of course activities (labs + homeworks).
// Data-driven: add a new activity = append one object to `assignments`.
// EN canonical + RU. TT falls back (handled by t() in the pages).
// NOTE: this module is NOT scanned by the i18n-coverage gate (only ui.js /
// course.json / book chapters / widget i18n are), so rich bilingual prose is
// fine here. Keep EN present on every {en,ru} node anyway.

// Shared front-matter + common setup, rendered once on the index page.
export const assignmentsMeta = {
  intro: {
    en: 'Two activities turn Lectures 03–04 into working code. The Lab is a small, hands-on build; the Homework is a deeper experimental study plus a paper-reading essay. In both, you implement the core IR algorithms by hand — that is the point. Pick an activity below.',
    ru: 'Две активности превращают лекции 03–04 в работающий код. Лаба — небольшая практическая сборка; домашка — более глубокое экспериментальное исследование плюс эссе по статье. В обоих случаях ключевые алгоритмы IR вы реализуете руками — в этом и смысл. Выберите активность ниже.',
  },
  topic: {
    en: 'Classical IR & Ranking Metrics — implementing BM25 on a corpus; computing nDCG, MAP, MRR; and analysing how tokenization choices change ranking quality.',
    ru: 'Классический IR и метрики ранжирования — реализация BM25 на корпусе; подсчёт nDCG, MAP, MRR; анализ влияния выбора токенизации на качество ранжирования.',
  },
  groups: {
    lab: { en: 'Labs', ru: 'Лабораторные' },
    homework: { en: 'Homeworks', ru: 'Домашние задания' },
  },
  setup: {
    heading: { en: 'Common setup (applies to every activity)', ru: 'Общий setup (для всех активностей)' },
    rulesH: { en: 'Ground rules', ru: 'Общие правила' },
    rules: [
      { en: 'Implement the core IR algorithms by hand: the inverted index, TF-IDF, BM25, RRF, and every metric (nDCG, MAP, MRR). No rank_bm25, no pytrec_eval, no library scorers for the graded parts.', ru: 'Ключевые алгоритмы IR реализуйте руками: инвертированный индекс, TF-IDF, BM25, RRF и все метрики (nDCG, MAP, MRR). Без rank_bm25, pytrec_eval и библиотечных скореров в оцениваемых частях.' },
      { en: 'Allowed helpers: dataset loading (ir_datasets / beir / HuggingFace), numpy, plotting libraries, and a tokenizer/stemmer library — but only for the tokenization study, not the core scorer.', ru: 'Разрешено: загрузка датасета (ir_datasets / beir / HuggingFace), numpy, библиотеки графиков и токенизатор/стеммер — но только для исследования токенизации, не для ядра скорера.' },
      { en: 'Be reproducible: fixed random seed (20260605), the fixed query subsets stated per activity, deterministic output. A grader must reproduce your numbers by re-running.', ru: 'Воспроизводимость: фиксированный seed (20260605), фиксированные поднаборы запросов (указаны в задании), детерминированный вывод. Проверяющий воспроизводит ваши числа повторным запуском.' },
      { en: 'Submit code that runs end-to-end plus a short report (PDF). State every formula variant you chose (tf scheme, idf form, gain function).', ru: 'Сдавайте код, работающий от начала до конца, плюс краткий отчёт (PDF). Укажите все выбранные варианты формул (схема tf, форма idf, gain-функция).' },
    ],
    dataH: { en: 'Dataset & access', ru: 'Датасет и доступ' },
    dataLead: {
      en: 'Both activities use BEIR. The Lab uses nfcorpus (≈3.6K docs, 323 test queries, graded qrels); the Homework may additionally repeat the headline run on scifact. Load via ir_datasets:',
      ru: 'Обе активности используют BEIR. Лаба — nfcorpus (≈ 3,6 тыс. документов, 323 test-запроса, градуированные qrels); в домашке можно дополнительно повторить основной прогон на scifact. Загрузка через ir_datasets:',
    },
    dataCode: `import ir_datasets
ds = ir_datasets.load("beir/nfcorpus/test")     # graded relevance (0..2)
docs    = {d.doc_id: d.text for d in ds.docs_iter()}
queries = {q.query_id: q.text for q in ds.queries_iter()}
qrels   = {}
for qr in ds.qrels_iter():
    qrels.setdefault(qr.query_id, {})[qr.doc_id] = qr.relevance

# Homework deeper run (optional):
# ds = ir_datasets.load("beir/scifact/test")`,
    dataNote: {
      en: 'Alternatives: the beir package GenericDataLoader, or HuggingFace datasets (BeIR/nfcorpus). Fixed query set: the first 30 test queries sorted by query_id for the Lab; the full test query set for the Homework. If memory is tight, restrict the corpus to documents that appear in any qrel plus a seed-20260605 random sample, and document the subsetting.',
      ru: 'Альтернативы: пакет beir (GenericDataLoader) или HuggingFace datasets (BeIR/nfcorpus). Фиксированный набор запросов: первые 30 test-запросов по возрастанию query_id для Лабы; полный test-набор для домашки. Если мало памяти — ограничьте корпус документами из qrels плюс случайная выборка с seed 20260605 и опишите это.',
    },
    logiH: { en: 'Logistics', ru: 'Организация' },
    logi: {
      en: 'Deadlines follow the course schedule. Submit code + report PDF (coding parts) and the scanned essay + figure (essay part). Late and collaboration policy per the syllabus.',
      ru: 'Дедлайны — по расписанию курса. Сдача: код + отчёт PDF (кодовые части) и скан эссе + фигура (часть с эссе). Политика просрочек и сотрудничества — по программе.',
    },
  },
};

export const assignments = [
  {
    slug: 'lab-bm25',
    kind: 'lab',
    code: 'Lab 1',
    status: 'ready',
    title: { en: 'Build BM25 by hand, compare two rankers', ru: 'BM25 руками, сравнение двух ранжировщиков' },
    blurb: {
      en: 'Inverted index + TF-IDF + BM25 from scratch on a real judged corpus; compare TF-IDF vs BM25 on a fixed query set with nDCG@10.',
      ru: 'Инвертированный индекс + TF-IDF + BM25 с нуля на реальном judged-корпусе; сравнение TF-IDF и BM25 на фиксированном наборе запросов по nDCG@10.',
    },
    due: { en: 'Small · 1 dataset · ~1 evening', ru: 'Небольшая · 1 датасет · ~вечер' },
    blocks: [
      { t: 'h4', v: { en: 'Goal', ru: 'Цель' } },
      { t: 'p', v: { en: 'Implement an inverted index, TF-IDF, and BM25 from scratch on a real judged corpus, then compare TF-IDF against BM25 on a fixed query set and explain — with a concrete example from your own output — where and why they differ.', ru: 'Реализовать инвертированный индекс, TF-IDF и BM25 с нуля на реальном judged-корпусе, затем сравнить TF-IDF и BM25 на фиксированном наборе запросов и объяснить — на конкретном примере из своего вывода — где и почему они расходятся.' } },
      { t: 'h4', v: { en: 'Tasks', ru: 'Задачи' } },
      { t: 'ol', v: [
        { en: 'Load BEIR nfcorpus/test and build the fixed query set (first 30 by query_id).', ru: 'Загрузите BEIR nfcorpus/test и постройте фиксированный набор запросов (первые 30 по query_id).' },
        { en: 'Tokenize with one fixed scheme: lowercase → strip punctuation → split on whitespace. (The Lab holds tokenization fixed; the Homework varies it.)', ru: 'Токенизация одной фиксированной схемой: нижний регистр → убрать пунктуацию → разбиение по пробелам. (В Лабе токенизация фиксирована; в домашке варьируется.)' },
        { en: 'Build an inverted index from scratch: term → postings [(doc_id, tf)]; also record document lengths and avgdl.', ru: 'Постройте инвертированный индекс с нуля: терм → postings [(doc_id, tf)]; запишите длины документов и avgdl.' },
        { en: 'Implement TF-IDF by hand: w(t,d) = tf · log(N/df). State your tf and idf variant; score by summing query-term weights or by cosine (your choice, stated).', ru: 'Реализуйте TF-IDF руками: w(t,d) = tf · log(N/df). Укажите вариант tf и idf; скоринг — сумма весов термов запроса или косинус (на ваш выбор, укажите).' },
        { en: 'Implement BM25 by hand: k₁ = 1.5, b = 0.75, smoothed idf ln(1 + (N−df+0.5)/(df+0.5)). Reuse the same index.', ru: 'Реализуйте BM25 руками: k₁ = 1.5, b = 0.75, сглаженный idf ln(1 + (N−df+0.5)/(df+0.5)). Тот же индекс.' },
        { en: 'For each query, retrieve the top-10 under TF-IDF and under BM25.', ru: 'Для каждого запроса выдайте top-10 по TF-IDF и по BM25.' },
        { en: 'Compute nDCG@10 (by hand, graded gain 2^rel−1, log₂(i+1) discount) per query for both rankers; report the mean for each and show one query where they rank differently.', ru: 'Посчитайте nDCG@10 (руками, gain 2^rel−1, дисконт log₂(i+1)) по каждому запросу для обоих; дайте среднее и покажите запрос, где ранжирование различается.' },
        { en: 'Write a half-page analysis: where does BM25 diverge from TF-IDF, and why? Point to term-frequency saturation and document-length normalization using your concrete example.', ru: 'Напишите полстраницы анализа: где BM25 расходится с TF-IDF и почему? Сошлитесь на насыщение tf и нормировку длины на своём примере.' },
      ] },
      { t: 'h4', v: { en: 'Deliverables', ru: 'Что сдавать' } },
      { t: 'p', v: { en: 'lab.py (or a notebook) that runs end-to-end and prints the comparison table, plus a 1-page report: the mean-nDCG@10 table, one divergent-query table, and the analysis paragraph.', ru: 'lab.py (или notebook), работающий от начала до конца и печатающий таблицу сравнения, плюс отчёт на 1 страницу: таблица среднего nDCG@10, таблица расходящегося запроса и абзац анализа.' } },
      { t: 'h4', v: { en: 'Grading (100)', ru: 'Оценка (100)' } },
      { t: 'grade', rows: [
        { label: { en: 'Inverted index correct', ru: 'Инвертированный индекс' }, w: '20' },
        { label: { en: 'TF-IDF correct', ru: 'TF-IDF' }, w: '20' },
        { label: { en: 'BM25 correct', ru: 'BM25' }, w: '30' },
        { label: { en: 'nDCG@10 correct', ru: 'nDCG@10' }, w: '15' },
        { label: { en: 'Analysis', ru: 'Анализ' }, w: '15' },
      ] },
    ],
  },

  {
    slug: 'hw-ranking-metrics',
    kind: 'homework',
    code: 'A1',
    status: 'soon',
    title: { en: 'Deeper experiments + paper essay', ru: 'Глубже эксперименты + эссе по статье' },
    blurb: {
      en: 'Four rankers, three metrics, a parameter sweep, a tokenization study and a significance test — then read one paper and re-draw its hero figure by hand.',
      ru: 'Четыре ранжировщика, три метрики, свип параметров, исследование токенизации и тест значимости — затем прочитать статью и перерисовать её hero-фигуру рукой.',
    },
    due: { en: 'Extended · coding + handwritten essay', ru: 'Расширенная · код + рукописное эссе' },
    blocks: [
      { t: 'lead', v: { en: 'Build on the Lab. Part 1 is an extended experimental study; Part 2 is a close reading of one paper with a hand-drawn re-interpretation of its hero figure.', ru: 'На основе Лабы. Часть 1 — расширенное экспериментальное исследование; часть 2 — внимательное чтение одной статьи с рукописной переинтерпретацией её hero-фигуры.' } },

      { t: 'h3', v: { en: 'Part 1 — Coding & experiments (60%)', ru: 'Часть 1 — Код и эксперименты (60%)' } },
      { t: 'p', v: { en: 'Use BEIR nfcorpus/test over the full test query set (optionally repeat the headline experiment on scifact/test).', ru: 'BEIR nfcorpus/test на полном test-наборе запросов (опционально повторите основной эксперимент на scifact/test).' } },
      { t: 'ol', v: [
        { en: 'Rankers (by hand): a Boolean-OR baseline, TF-IDF (cosine), BM25, and RRF fusion (Σ 1/(k+rank), k=60) of BM25 + TF-IDF.', ru: 'Ранжировщики (руками): Boolean-OR базлайн, TF-IDF (косинус), BM25 и RRF-фьюжн (Σ 1/(k+rank), k=60) BM25 + TF-IDF.' },
        { en: 'Metrics (by hand): nDCG@10, MAP, MRR over all queries — report the mean and the per-query distribution (box/violin or histogram). Use graded gain 2^rel−1 and the log₂(i+1) discount.', ru: 'Метрики (руками): nDCG@10, MAP, MRR по всем запросам — среднее и распределение по запросам (box/violin или гистограмма). gain 2^rel−1, дисконт log₂(i+1).' },
        { en: 'BM25 parameter study: sweep k₁ ∈ {0.5,1.0,1.2,1.5,2.0,3.0} and b ∈ {0,0.25,0.5,0.75,1.0}; plot nDCG@10 vs k₁ (b fixed) and vs b (k₁ fixed); identify the best (k₁,b) and explain the shape (saturation; the b=0/1 extremes).', ru: 'Свип параметров BM25: k₁ ∈ {0.5,1.0,1.2,1.5,2.0,3.0}, b ∈ {0,0.25,0.5,0.75,1.0}; графики nDCG@10 от k₁ (b фикс.) и от b (k₁ фикс.); найдите лучшую (k₁,b) и объясните форму (насыщение; крайние b=0/1).' },
        { en: 'Tokenization study: compare ≥3 pipelines on the same BM25 — (a) lowercase+whitespace, (b) + stopword removal, (c) + Porter stemming, (optional d) subword/BPE. Report nDCG@10 / MAP / MRR for each and explain why each choice helps or hurts (vocabulary size, df shifts, conflation vs over-conflation). Tie back to Lecture 02 and 03.', ru: 'Исследование токенизации: сравните ≥3 пайплайна на одном BM25 — (a) нижний регистр+пробелы, (b) + удаление стоп-слов, (c) + стемминг Портера, (опц. d) subword/BPE. nDCG@10 / MAP / MRR для каждого и объяснение, почему помогает/вредит (размер словаря, сдвиги df, конфляция). Свяжите с лекциями 02 и 03.' },
        { en: 'Statistical significance: is your best system better than the BM25 baseline, or is it chance? Run a paired test (t-test and/or Wilcoxon signed-rank) on per-query nDCG@10; report the mean difference, a 95% CI, and the p-value, and interpret it (necessary-not-sufficient; the small-n caveat).', ru: 'Статистическая значимость: лучшая система действительно лучше BM25-базлайна или это случайность? Парный тест (t-test и/или Wilcoxon) по per-query nDCG@10; средняя разница, 95% CI, p-value и интерпретация (необходимо-но-недостаточно; малое n).' },
        { en: 'Report: plots + tables + a discussion connecting the parameter sweep, the tokenization study, and the significance test into one story about what actually moves ranking quality.', ru: 'Отчёт: графики + таблицы + обсуждение, связывающее свип, токенизацию и значимость в одну историю о том, что реально двигает качество.' },
      ] },
      { t: 'h4', v: { en: 'Part 1 grading (60)', ru: 'Оценка части 1 (60)' } },
      { t: 'grade', rows: [
        { label: { en: 'Four rankers correct', ru: 'Четыре ранжировщика' }, w: '15' },
        { label: { en: 'Three metrics correct', ru: 'Три метрики' }, w: '15' },
        { label: { en: 'Parameter study + plots', ru: 'Свип + графики' }, w: '10' },
        { label: { en: 'Tokenization study', ru: 'Токенизация' }, w: '12' },
        { label: { en: 'Significance', ru: 'Значимость' }, w: '8' },
      ] },

      { t: 'h3', v: { en: 'Part 2 — Paper reading & hand-written essay (40%)', ru: 'Часть 2 — Чтение статьи и рукописное эссе (40%)' } },
      { t: 'p', v: { en: 'Pick one of the five papers below, read it closely, and write a two-page A4 hand-written essay in your own words — your interpretation, not a summary. Then complete the hero-figure sub-task.', ru: 'Выберите одну из пяти статей ниже, внимательно прочитайте и напишите рукописное эссе на две страницы A4 своими словами — ваша интерпретация, не пересказ. Затем выполните подзадачу с hero-фигурой.' } },
      { t: 'callout', title: { en: 'Hero-figure sub-task', ru: 'Подзадача: hero-фигура' }, v: { en: 'Identify the paper’s hero figure — the one diagram that carries its central idea. Redesign it your own way (hand-drawn is fine) to expose the concept more deeply than the original: change the encoding, add the missing axis or annotation, show the failure case, or re-draw it using your own Lab/Homework numbers. Add a short caption stating what your version makes visible that the original did not.', ru: 'Определите hero-фигуру статьи — диаграмму, несущую её центральную идею. Перерисуйте её по-своему (можно от руки), чтобы раскрыть концепт глубже оригинала: смените кодировку, добавьте недостающую ось/подпись, покажите случай отказа или перерисуйте её на своих числах из Лабы/домашки. Добавьте короткую подпись — что ваш вариант делает видимым, чего не было в оригинале.' } },
      { t: 'h4', v: { en: 'Submission', ru: 'Что сдавать' } },
      { t: 'p', v: { en: 'A photo/scan of the two-page hand-written essay, the redesigned hero figure (hand-drawn or digital), and one paragraph naming the figure you chose and why it is the hero figure.', ru: 'Фото/скан рукописного эссе на две страницы A4, перерисованная hero-фигура (от руки или цифровая) и один абзац — какую фигуру выбрали и почему она hero.' } },
      { t: 'h4', v: { en: 'Choose one paper', ru: 'Выберите одну статью' } },
      { t: 'papers', items: [
        { cite: 'Spärck Jones, K. (1972). A Statistical Interpretation of Term Specificity and Its Application in Retrieval. Journal of Documentation.', hero: { en: 'The origin of IDF. Hero figure: the term-specificity / frequency relationship.', ru: 'Происхождение IDF. Hero-фигура: связь специфичности терма и частоты.' } },
        { cite: 'Robertson, S. & Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. Foundations & Trends in IR.', hero: { en: 'The definitive BM25 treatment. Hero figure: the term-frequency saturation curve(s).', ru: 'Определяющий труд по BM25. Hero-фигура: кривая насыщения tf.' } },
        { cite: 'Singhal, A., Buckley, C. & Mitra, M. (1996). Pivoted Document Length Normalization. SIGIR.', hero: { en: 'Hero figure: P(relevance) vs P(retrieval) as a function of document length — the crossing curves that motivate the b parameter.', ru: 'Hero-фигура: P(релевантность) против P(выдачи) от длины документа — пересекающиеся кривые, мотивирующие параметр b.' } },
        { cite: 'Järvelin, K. & Kekäläinen, J. (2002). Cumulated Gain-based Evaluation of IR Techniques. ACM TOIS.', hero: { en: 'The (n)DCG paper. Hero figure: cumulated and discounted gain curves across rank.', ru: 'Статья про (n)DCG. Hero-фигура: кривые cumulated/discounted gain по рангу.' } },
        { cite: 'Cormack, G. V., Clarke, C. L. A. & Büttcher, S. (2009). Reciprocal Rank Fusion Outperforms Condorcet and Individual Rank Learning Methods. SIGIR.', hero: { en: 'RRF. Hero element: the RRF formula and its results table — redesign it as a figure.', ru: 'RRF. Hero-элемент: формула RRF и таблица результатов — перерисуйте как фигуру.' } },
      ] },
      { t: 'h4', v: { en: 'Part 2 grading (40)', ru: 'Оценка части 2 (40)' } },
      { t: 'grade', rows: [
        { label: { en: 'Interpretation depth & correctness', ru: 'Глубина и корректность интерпретации' }, w: '20' },
        { label: { en: 'Hero-figure redesign (insight added)', ru: 'Перерисовка hero-фигуры (добавленный инсайт)' }, w: '15' },
        { label: { en: 'Clarity, structure, handwriting', ru: 'Ясность, структура, почерк' }, w: '5' },
      ] },
    ],
  },
];
