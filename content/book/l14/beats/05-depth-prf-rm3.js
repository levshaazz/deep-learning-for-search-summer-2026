    {
      id: 'depth-prf-rm3', kind: 'prose',
      heading: { en: 'Inside RM3: interpolating two vocabularies', ru: 'Внутри RM3: интерполяция двух словарей', tt: 'RM3 эчендә: ике сүзлекне интерполяцияләү' },
      body: {
        en: [
          "Let us open **RM3** and look at the one equation that runs it. RM3 builds a new query language model by *interpolating* — mixing — your original query with a **relevance model** \\( R \\) estimated over the top-\\(k\\) pseudo-relevant documents:",
          "$$ P(w \\mid \\theta_{q'}) = (1-\\lambda)\\, P(w \\mid q) + \\lambda\\, P(w \\mid R) $$",
          "Read it left to right. Every word \\( w \\) gets a new weight. The first term keeps you anchored to what you actually asked; the second term, \\( P(w \\mid R) \\), pours in the words that were *frequent across the top documents*. The dial \\( \\lambda \\) sets how far you drift from your own query toward the feedback set — \\( \\lambda = 0 \\) is the raw query untouched, larger \\( \\lambda \\) leans harder on the borrowed vocabulary.",
          "Now stare at the second term until the whole ceiling of this method becomes visible. \\( R \\) is estimated *only from documents the first pass already retrieved*. So RM3 can lift, drop, or re-weight any word that **already appears** in that pass — but it can never introduce a word that was absent from it. It re-weights an existing vocabulary; it cannot mint a new one.",
        ],
        ru: [
          "Откроем **RM3** и посмотрим на единственное уравнение, которое им движет. RM3 строит новую языковую модель запроса, *интерполируя* — смешивая — твой исходный запрос с **моделью релевантности** \\( R \\), оценённой по топ-\\(k\\) псевдорелевантным документам:",
          "$$ P(w \\mid \\theta_{q'}) = (1-\\lambda)\\, P(w \\mid q) + \\lambda\\, P(w \\mid R) $$",
          "Читай слева направо. Каждое слово \\( w \\) получает новый вес. Первое слагаемое держит тебя привязанным к тому, что ты действительно спросил; второе, \\( P(w \\mid R) \\), вливает слова, что были *частыми в верхних документах*. Ручка \\( \\lambda \\) задаёт, насколько далеко ты уплываешь от собственного запроса к множеству обратной связи: \\( \\lambda = 0 \\) — это сырой запрос нетронутым, больший \\( \\lambda \\) сильнее опирается на заимствованный словарь.",
          "А теперь всматривайся во второе слагаемое, пока не станет виден весь потолок метода. \\( R \\) оценивается *только по документам, которые уже поднял первый проход*. Значит, RM3 может усилить, приглушить или перевзвесить любое слово, что **уже присутствует** в этом проходе, — но никогда не введёт слово, которого там не было. Он перевзвешивает наличный словарь; создать новый он не может.",
        ],
        tt: [
          "**RM3**-не ачыйк һәм аны хәрәкәткә китергән бердәнбер тигезләмәгә карыйк. RM3 яңа сорау тел моделен төзи — синең башлангыч сорауыңны топ-\\(k\\) псевдо-релевант документлар буенча бәяләнгән **релевантлык моделе** \\( R \\) белән *интерполяцияләп* (кушып):",
          "$$ P(w \\mid \\theta_{q'}) = (1-\\lambda)\\, P(w \\mid q) + \\lambda\\, P(w \\mid R) $$",
          "Сулдан уңга укы. Һәр \\( w \\) сүзе яңа авырлык ала. Беренче кушылучы сине чынлап нәрсә сорауыңа бәйле тота; икенчесе, \\( P(w \\mid R) \\), *өске документларда еш булган* сүзләрне коя. \\( \\lambda \\) көйләгече син үз сорауыңнан кире бәйләнеш җыелмасына таба никадәр ераклашуыңны билгели: \\( \\lambda = 0 \\) — чи сорау кагылмыйча, зуррак \\( \\lambda \\) алынган сүзлеккә ныграк таяна.",
          "Хәзер икенче кушылучыга методның бөтен түшәме күренгәнче текәлеп кара. \\( R \\) бары *беренче узыш инде күтәргән документлар буенча гына* бәяләнә. Димәк, RM3 бу узышта **инде булган** теләсә нинди сүзне көчәйтә, тынычландыра яки яңадан авырлык бирә ала — ләкин анда булмаган сүзне беркайчан да кертә алмый. Ул булган сүзлекне яңадан авырлыклый; яңасын иҗат итә алмый.",
        ],
      },
    },
