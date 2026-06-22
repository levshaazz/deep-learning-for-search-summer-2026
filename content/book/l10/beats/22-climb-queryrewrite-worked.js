    {
      id: 'climb-queryrewrite-worked', kind: 'prose',
      heading: { en: 'HyDE & multi-query, by hand', ru: 'HyDE и multi-query вручную', tt: 'HyDE һәм multi-query кул белән' },
      img: 'L10/L10-06-hyde-hypothetical.png', imgPos: 'float-right',
      imgAlt: {
        en: 'A ghostly dashed-outline hypothetical document is cast like a lure on a line into an embedding-space pond of dots, pulling the one true document to the surface — the HyDE trick.',
        ru: 'Призрачный пунктирный гипотетический документ заброшен, как блесна на леске, в пруд-эмбеддинг-пространство из точек и вытягивает на поверхность один истинный документ — приём HyDE.',
        tt: 'Өрфия пунктир гипотетик документ блесна кебек эмбеддинг-киңлек буасына — нокталар арасына — ташлана һәм бер чын документны өскә тарта — HyDE алымы.',
      },
      body: {
        en: [
          "Two rewrites, two different lifts — measured on two different gold-sets, never blended.",
          ":::calc **HyDE** (single true doc). The bare query ranks the true doc \\(8\\)th → recall@5 \\(= 0\\), RR \\(= 1/8 = \\mathbf{0.125}\\). HyDE writes a hypothetical answer, embeds *that*, and the true doc rises to rank \\(2\\) → recall@5 \\(= 1\\), RR \\(= 1/2 = \\mathbf{0.5}\\). **Multi-query** (a separate \\(5\\)-relevant gold-set). The single query retrieves \\(2/5\\) → recall@5 \\(= \\mathbf{0.4}\\); the union of \\(3\\) paraphrases retrieves \\(4/5\\) → recall@5 \\(= \\mathbf{0.8}\\). :::",
          "HyDE closes the vocabulary gap by searching with answer-shaped text; multi-query widens coverage by asking the same thing several ways. Both lift recall without touching the retriever — they just feed it a better query.",
        ],
        ru: [
          "Два переписывания, два разных прироста — измеренных на двух разных gold-set, никогда не смешиваемых.",
          ":::calc **HyDE** (один истинный документ). Голый запрос ставит истинный документ на \\(8\\)-е → recall@5 \\(= 0\\), RR \\(= 1/8 = \\mathbf{0.125}\\). HyDE пишет гипотетический ответ, эмбеддит *его*, и истинный документ поднимается на ранг \\(2\\) → recall@5 \\(= 1\\), RR \\(= 1/2 = \\mathbf{0.5}\\). **Multi-query** (отдельный gold-set из \\(5\\) релевантных). Один запрос достаёт \\(2/5\\) → recall@5 \\(= \\mathbf{0.4}\\); объединение \\(3\\) перефразировок — \\(4/5\\) → recall@5 \\(= \\mathbf{0.8}\\). :::",
          "HyDE закрывает разрыв лексики, ища текстом в форме ответа; multi-query расширяет покрытие, спрашивая одно и то же по-разному. Оба поднимают recall, не трогая ретривер — просто подают ему запрос получше.",
        ],
        tt: [
          "Ике яңадан язу, ике төрле өстәмә — ике төрле gold-set та үлчәнгән, беркайчан бутамыйча.",
          ":::calc **HyDE** (бер чын документ). Ялангач сорау чын документны \\(8\\) нчегә куя → recall@5 \\(= 0\\), RR \\(= 1/8 = \\mathbf{0.125}\\). HyDE гипотетик җавап яза, *аны* эмбеддлый, һәм чын документ \\(2\\) нче рангка күтәрелә → recall@5 \\(= 1\\), RR \\(= 1/2 = \\mathbf{0.5}\\). **Multi-query** (\\(5\\) релевантлы аерым gold-set). Бер сорау \\(2/5\\) ала → recall@5 \\(= \\mathbf{0.4}\\); \\(3\\) парафразаның берләшмәсе \\(4/5\\) ала → recall@5 \\(= \\mathbf{0.8}\\). :::",
          "HyDE җавап формасындагы текст белән эзләп лексика ярыгын яба; multi-query бер үк нәрсәне берничә төрле сорап каплауны киңәйтә. Икесе дә эзләгечкә кагылмыйча recall күтәрә — аңа яхшырак сорау бирә."
        ],
      },
    },
