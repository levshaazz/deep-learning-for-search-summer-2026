    {
      id: 'catch-scout-corner-cases', kind: 'prose',
      heading: { en: 'The Scout that travels badly', ru: 'Разведчик, который плохо путешествует', tt: 'Начар сәяхәт итүче Разведчик' },
      body: {
        en: [
          "The Scout that tops MTEB can still travel badly. Even a strong dense retriever **loses ground out of domain** — and how far depends on its training data: on BEIR (zero-shot, avg nDCG@10) BM25 reaches \\(\\mathbf{0.43}\\), while DPR — trained on QA sets (NQ/Trivia), not MS MARCO — falls to \\(\\mathbf{0.23}\\); MS MARCO-trained models (ANCE, TAS-B) hold up much better (&asymp;0.4) yet on average still trail BM25. Long documents hit the token limit and get silently truncated; another language hits an English-only model; and MIPS-versus-cosine means you must normalize vectors consistently.",
          "Generalization is not free. The cures are the throughline of the rest of the lecture: **measure** on your own domain, **adapt** (fine-tune or GPL), or **hybridize** with the lexical signal of BM25.",
        ],
        ru: [
          'Разведчик с вершины MTEB всё ещё может плохо переноситься. Даже сильный плотный ретривер **теряет вне домена** — и размер падения зависит от обучающих данных: на BEIR (zero-shot, средний nDCG@10) BM25 даёт \\(\\mathbf{0{,}43}\\), а DPR — обученный на QA-наборах (NQ/Trivia), а не на MS MARCO — падает до \\(\\mathbf{0{,}23}\\); MS MARCO-модели (ANCE, TAS-B) держатся заметно лучше (&asymp;0,4), но в среднем всё ещё ниже BM25. Длинные документы упираются в лимит токенов и молча обрезаются; другой язык — в одноязычную модель; а MIPS против косинуса требует единообразной нормализации векторов.',
          'Обобщение не бесплатно. Лекарства — сквозная тема всей остальной части лекции: **мерь** на своём домене, **адаптируй** (дообучение или GPL) или **гибридизуй** с лексическим сигналом BM25.',
        ],
        tt: [
          'MTEB башындагы Разведчик барыбер начар күчә ала. Хәтта көчле тыгыз ретривер да **домен тышында югалта** — күпме югалту өйрәтү мәгълүматына бәйле: BEIR\'да (zero-shot, уртача nDCG@10) BM25 \\(\\mathbf{0.43}\\) бирә, ә DPR — QA җыелмаларында (NQ/Trivia) өйрәтелгән, MS MARCO\'да түгел — \\(\\mathbf{0.23}\\)\'кә төшә; MS MARCO-модельләре (ANCE, TAS-B) шактый яхшырак тота (&asymp;0.4), ләкин уртача әле дә BM25\'тән түбән. Озын документлар токен чигенә төртелә һәм тавышсыз киселә; башка тел — бер телле модельгә; ә MIPS косинуска каршы векторларны бертөрле нормальләштерүне таләп итә.',
          'Гомумиләштерү бушлай түгел. Дәвалар — лекциянең калган өлешенең сызыгы: үз доменыгызда **үлчәгез**, **җайлаштырыгыз** (өстәмә өйрәтү яки GPL), яки BM25\'нең лексик сигналы белән **гибридлаштырыгыз**.',
        ],
      },
    },
