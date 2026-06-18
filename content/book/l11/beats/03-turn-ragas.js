    {
      id: 'turn-ragas', kind: 'prose',
      heading: { en: 'RAGAS: grade without a gold key', ru: 'RAGAS: оцени без золотого ключа', tt: 'RAGAS: алтын ачкычсыз бәялә' },
      imgPos: 'inline',
      body: {
        en: [
          "**RAGAS** (Es, James, Espinosa-Anke & Schockaert, arXiv:2309.15217, 2023) — *Retrieval-Augmented Generation Assessment* — is the first witness. Its trick is to grade a RAG answer using only three things every RAG system already has on hand: the **question**, the **retrieved context**, and the **generated answer**. No human-written gold answer required. That is what *reference-free* means, and it is what makes RAGAS cheap enough to run on every answer, not just a hand-labelled test set.",
          "The genius is the **decomposition**. Instead of one fuzzy score for \"is this a good answer?\", RAGAS splits the question into four sharp, separately-checkable metrics — two about the *answer* and two about the *context* — each of which a small judging model can verify by entailment, not opinion. Break the answer into atomic claims and check each against the evidence; the whole thing reduces to counting supported claims and dividing. Cross-examination, automated.",
        ],
        ru: [
          "**RAGAS** (Эс, Джеймс, Эспиноса-Анке и Шокарт, arXiv:2309.15217, 2023) — *оценка генерации с дополненным поиском* — первый свидетель. Его трюк — оценить RAG-ответ, используя лишь три вещи, что у всякой RAG-системы и так под рукой: **вопрос**, **извлечённый контекст** и **сгенерированный ответ**. Никакого золотого ответа от человека не нужно. Вот что значит *без эталона*, и это то, что делает RAGAS достаточно дешёвым, чтобы гонять на каждом ответе, а не только на размеченном тест-сете.",
          "Гениальность — в **разложении**. Вместо одной размытой оценки «хорош ли ответ?» RAGAS дробит вопрос на четыре резкие, по отдельности проверяемые метрики — две про *ответ* и две про *контекст* — каждую из которых малая судящая модель может проверить вхождением, а не мнением. Разбей ответ на атомарные утверждения и сверь каждое с доказательствами; всё сводится к подсчёту поддержанных утверждений и делению. Допрос, автоматизированный.",
        ],
        tt: [
          "**RAGAS** (Эс, Джеймс, Эспиноса-Анке һәм Шокарт, arXiv:2309.15217, 2023) — *эзләү белән баетылган генерацияне бәяләү* — беренче шаһит. Аның хәйләсе — RAG-җавапны һәр RAG-система кулында инде булган өч нәрсә белән генә бәяләү: **сорау**, **алынган контекст** һәм **генерацияләнгән җавап**. Кешедән алтын җавап кирәкми. *Эталонсыз* шуны аңлата, һәм нәкъ шул RAGAS ны һәр җавапта йөртерлек итеп арзан ясый, тик билгеле тест-җыелмада гына түгел.",
          "Гениальлек — **таркатуда**. «Җавап яхшымы?» дигән бер томанлы бәя урынына RAGAS сорауны дүрт кискен, аерым тикшерелә торган метрикага вата — икесе *җавап* турында, икесе *контекст* турында — һәрберсен кечкенә хөкем итүче модель фикер белән түгел, керү белән тикшерә ала. Җавапны атомар раслауларга вата һәм һәрберсен дәлилләр белән чагыштыр; барысы да раслауларны санап бүлүгә кайтып кала. Тикшерү, автоматлаштырылган.",
        ],
      },
    },
