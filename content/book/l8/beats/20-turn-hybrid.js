    {
      id: 'turn-hybrid', kind: 'prose',
      heading: { en: 'Under one banner', ru: 'Под одно знамя', tt: 'Бер байрак астында' },
      img: 'L8/L8-03-two-rivers.png', imgPos: 'scene',
      imgAlt: {
        en: 'Two rivers — one angular, one smooth — flow toward each other and merge into one broader, stronger river that passes beneath a single raised banner.',
        ru: 'Две реки — угловатая и плавная — текут навстречу и сливаются в одну, более широкую и сильную, которая проходит под единым поднятым знаменем.',
        tt: 'Ике елга — почмаклы һәм шома — бер-берсенә таба ага һәм бер күтәрелгән байрак астыннан узган киңрәк, көчлерәк бер елгага кушыла.',
      },
      body: {
        en: [
          "We have two armies that win different battles. The Standard-Bearer's move is to stop choosing between them: run *both*, and fuse their rankings into one. The problem is that their scores live on incomparable scales — a BM25 score and a cosine similarity cannot be added directly.",
          "The fix is to forget the scores and fuse by **rank** instead. That is Reciprocal Rank Fusion (RRF), which you already met in Lecture 3 — only there it fused two classical rankers, and here it unites neural partners.",
        ],
        ru: [
          "У нас две армии, выигрывающие разные битвы. Ход Знаменосца — перестать выбирать между ними: запустить *обе* и слить их ранжирования в одно. Проблема в том, что их оценки на несравнимых шкалах — оценку BM25 и косинусную близость нельзя складывать напрямую.",
          "Решение — забыть про оценки и сливать по **рангам**. Это слияние обратных рангов (RRF), с которым ты уже встречался в лекции 3 — только там оно сливало два классических ранжировщика, а здесь объединяет нейронных партнёров.",
        ],
        tt: [
          "Бездә төрле сугышларны җиңә торган ике гаскәр бар. Байракчының адымы — алар арасында сайлауны туктату: *икесен дә* җибәрү һәм аларның ранжлауларын берсенә кушу. Проблема шунда: аларның баллары чагыштырып булмаслык шкалаларда — BM25 баллын һәм косинус охшашлыкны турыдан-туры кушып булмый.",
          "Чишелеш — балларны онытып, **ранглар** буенча кушу. Бу — кире ранглар берләштерүе (RRF), син аны 3 нче лекциядә инде очраткан идең — анда ул ике классик ранжлаучыны кушты, ә монда нейрон партнёрларны берләштерә.",
        ],
      },
    },
