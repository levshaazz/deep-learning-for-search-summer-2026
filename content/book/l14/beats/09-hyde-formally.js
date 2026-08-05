    {
      id: 'hyde-formally', kind: 'prose',
      heading: { en: 'HyDE, formally', ru: 'HyDE, формально', tt: 'HyDE, формаль рәвештә' },
      body: {
        en: [
          "Strip the metaphor and the recipe is three steps. First, prompt an instruction-tuned generator to write \\( k \\) hypothetical documents \\( d_1, \\dots, d_k \\) that would answer the query. Second, push each through an encoder \\( f \\) — the original paper uses **Contriever**, a contrastively pre-trained dense model — and average the resulting vectors into a single query embedding:",
          "$$ e = \\frac{1}{k}\\sum_{i=1}^{k} f(d_i) $$",
          "Third, retrieve the real passages whose embeddings have the highest cosine similarity to \\( e \\). Optionally you can fold the encoded question back in — add \\( f(q) \\) into the sum — as a small anchor to the literal query, but the heavy lifting is done by the drafted answers.",
          "One label people love to misapply: HyDE is **zero-shot** in the sense that it needs *no relevance judgments*, no query-passage pairs, no fine-tuning of the retriever. But it is emphatically **not unsupervised** — it leans on a generator that was itself *instruction-tuned* to follow the prompt. The supervision moved; it did not vanish.",
        ],
        ru: [
          "Сними метафору — и рецепт умещается в три шага. Первый: попроси инструктивно настроенный генератор написать \\( k \\) гипотетических документов \\( d_1, \\dots, d_k \\), которые ответили бы на запрос. Второй: прогони каждый через энкодер \\( f \\) — в оригинальной статье это **Contriever**, плотная модель контрастивного предобучения, — и усредни полученные векторы в одно эмбеддинг-представление запроса:",
          "$$ e = \\frac{1}{k}\\sum_{i=1}^{k} f(d_i) $$",
          "Третий: достань реальные пассажи, чьи эмбеддинги ближе всего к \\( e \\) по косинусу. По желанию можно вернуть в сумму и сам вопрос — добавить \\( f(q) \\) — как небольшой якорь к буквальному запросу, но основную работу делают черновики ответа.",
          "Ярлык, который любят лепить не туда: HyDE — **zero-shot** в том смысле, что ему *не нужны суждения о релевантности*, ни пары «запрос — пассаж», ни дообучение ретривера. Но это решительно **не unsupervised** — он опирается на генератор, который сам был *инструктивно настроен* следовать промпту. Разметка не исчезла — она переместилась.",
        ],
        tt: [
          "Метафораны алып ташла — рецепт өч адымга сыя. Беренче: instruction-tuned генератордан сорауга җавап бирерлек \\( k \\) гипотетик документ \\( d_1, \\dots, d_k \\) язуын үтен. Икенче: һәрберсен \\( f \\) encoder аша үткәр — оригиналь мәкаләдә бу **Contriever**, контрастив рәвештә алдан өйрәтелгән тыгыз модель, — һәм чыккан векторларны бер сорау embedding'ына уртачала:",
          "$$ e = \\frac{1}{k}\\sum_{i=1}^{k} f(d_i) $$",
          "Өченче: embedding'лары \\( e \\)'гә cosine буенча иң якын булган чын пассажларны ал. Теләсәң, сорауны да суммага кире кайтарырга була — \\( f(q) \\) өстә — литераль сорауга кечкенә якорь итеп, ләкин төп эшне җавап черновиклары башкара.",
          "Кешеләр урынсыз ябыштырырга ярата торган ярлык: HyDE — **zero-shot**, чөнки аңа *релевантлык хөкемнәре* кирәкми, «сорау — пассаж» парлары да, ретриверны дообучение дә кирәкми. Ләкин ул катгый рәвештә **unsupervised түгел** — ул промптны үтәргә үзе *instruction-tuned* ителгән генераторга таяна. Күзәтчелек күченде; ул юкка чыкмады.",
        ],
      },
    },
