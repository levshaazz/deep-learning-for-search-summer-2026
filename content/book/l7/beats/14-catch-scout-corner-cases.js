    {
      id: 'catch-scout-corner-cases', kind: 'prose',
      heading: { en: 'The Scout that travels badly', ru: 'Разведчик, который плохо путешествует', tt: 'Начар сәяхәт итүче Разведчик' },
      body: {
        en: [
          "The Scout that tops MTEB can still travel badly. A retriever trained on MS MARCO **degrades out of domain** — on BEIR (zero-shot) BM25 reaches nDCG@10 \\(\\mathbf{0.43}\\) and often *beats* a single dense vector's \\(\\mathbf{0.38}\\). Long documents hit the token limit and get silently truncated; another language hits an English-only model; and MIPS-versus-cosine means you must normalize vectors consistently.",
          "Generalization is not free. The cures are the throughline of the rest of the lecture: **measure** on your own domain, **adapt** (fine-tune or GPL), or **hybridize** with the lexical signal of BM25.",
        ],
        ru: [
          'Разведчик с вершины MTEB всё ещё может плохо переноситься. Ретривер, обученный на MS MARCO, **деградирует вне домена** — на BEIR (zero-shot) BM25 даёт nDCG@10 \\(\\mathbf{0.43}\\) и часто *обходит* одиночный плотный вектор \\(\\mathbf{0.38}\\). Длинные документы упираются в лимит токенов и молча обрезаются; другой язык — в одноязычную модель; а MIPS против косинуса требует единообразной нормализации векторов.',
          'Обобщение не бесплатно. Лекарства — сквозная тема всей остальной части лекции: **мерь** на своём домене, **адаптируй** (дообучение или GPL) или **гибридизуй** с лексическим сигналом BM25.',
        ],
        tt: [
          'MTEB башындагы Разведчик барыбер начар күчә ала. MS MARCO\'да өйрәтелгән ретривер **домен тышында начарая** — BEIR\'да (zero-shot) BM25 nDCG@10 \\(\\mathbf{0.43}\\) бирә һәм еш кына бер плотный векторның \\(\\mathbf{0.38}\\)\'ен *уза*. Озын документлар токен чигенә төртелә һәм тавышсыз киселә; башка тел — бер телле модельгә; ә MIPS косинуска каршы векторларны бертөрле нормальләштерүне таләп итә.',
          'Гомумиләштерү бушлай түгел. Дәвалар — лекциянең калган өлешенең сызыгы: үз доменыгызда **үлчәгез**, **җайлаштырыгыз** (өстәмә өйрәтү яки GPL), яки BM25\'нең лексик сигналы белән **гибридлаштырыгыз**.',
        ],
      },
    },
