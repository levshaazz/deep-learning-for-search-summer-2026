    {
      id: 'climb-cascade-worked', kind: 'prose',
      heading: { en: 'The cascade by the numbers', ru: 'Каскад в числах', tt: 'Каскад саннарда' },
      body: {
        en: [
          "Put numbers on it with the L4 8-document set. BM25 alone ranks those 8 documents to **nDCG@10 = 0.6766** (Lecture 4&rsquo;s honest figure). Run the real cross-encoder over the same 8 and rerank by its score, and the order improves to **nDCG@10 = 0.9558** — most of the way to the ideal **1.0**. On a frozen MS MARCO passage subset the same lift shows up as ranking quality: retrieval **MRR@10 = 0.5482** rises to **0.6732** after the cross-encoder reranks the top candidates. The Judges earn their latency by moving the right answers up.",
        ],
        ru: [
          'Подставим числа на 8-документном наборе L4. Один BM25 ранжирует эти 8 документов до **nDCG@10 = 0.6766** (честная цифра Лекции 4). Прогоните реальный кросс-энкодер по тем же 8 и переранжируйте по его оценке — порядок улучшается до **nDCG@10 = 0.9558**, почти до идеала **1.0**. На замороженном сабсете MS MARCO тот же подъём виден как качество ранжирования: извлечение **MRR@10 = 0.5482** растёт до **0.6732** после реранка топа кросс-энкодером. Судьи окупают свою задержку, поднимая верные ответы наверх.',
        ],
        tt: [
          'L4’нең 8 документлы җыелмасында саннар куйыйк. Бер BM25 бу 8 документны **nDCG@10 = 0.6766**’га тәртипли (4 нче лекциянең намуслы саны). Реаль кросс-энкодерны шул ук 8’дә җибәр һәм бәясе буенча кабат тәртипкә сал — тәртип **nDCG@10 = 0.9558**’гә яхшыра, идеал **1.0**’гә диярлек. Туңдырылган MS MARCO пассаж сабсетында шул ук күтәрелеш тәртип сыйфаты булып күренә: табу **MRR@10 = 0.5482**, кросс-энкодер топны кабат тәртипкә салгач **0.6732**’гә үсә. Судьялар дөрес җавапларны өскә күтәреп, вакытларын аклый.',
        ],
      },
    },
