    {
      id: 'turn-multimodal', kind: 'prose',
      heading: { en: 'Search beyond text', ru: 'Поиск за пределами текста', tt: 'Текст артындагы эзләү' },
      img: 'L12/L12-02-shared-space.png', imgPos: 'float-right',
      imgAlt: {
        en: 'Sir Cosine on a glowing unit sphere — the shared space — with a photograph and its caption pulled close together at the centre while mismatched picture-word pairs sit far apart, image and text now sharing one coordinate system.',
        ru: 'Сэр Косинус на светящейся единичной сфере — общем пространстве — где фотография и её подпись притянуты близко в центре, а несовпадающие пары картинка–слово сидят далеко, изображение и текст теперь в одной системе координат.',
        tt: 'Сэр Косинус яктырган берәмлек сферасында — уртак киңлектә — фоторәсем һәм аның язмасы үзәктә якын тартылган, ә туры килмәгән рәсем-сүз парлары ерак утыра, рәсем һәм текст хәзер бер координаталар системасында.',
      },
      body: {
        en: [
          "GraphRAG let the Ship reason **across** records. The second frontier lets it search records that are not text at all. Half the world's information is a **picture** — a diagram, a scanned invoice, a chart, a photograph. Text retrieval is blind to all of it.",
          "The fix is a single, audacious idea: train an **image encoder** and a **text encoder** to map into the *same* coordinate system, so a photograph and the sentence that describes it land **next to each other**. This is **CLIP** (Radford et al., OpenAI, 2021). Once image and text share one space, cross-modal retrieval is just nearest-neighbour search — the very lanes we built in L9, now reaching across modalities. And the knight who measures the distance is one we already know: **Sir Cosine**.",
        ],
        ru: [
          "GraphRAG позволил Кораблю рассуждать **поперёк** записей. Второй фронтир позволяет искать записи, которые вовсе не текст. Половина информации мира — это **картинка**: диаграмма, скан счёта, график, фотография. Текстовый поиск слеп ко всему этому.",
          "Решение — одна дерзкая идея: обучить **кодировщик изображений** и **кодировщик текста** отображать в *одну* систему координат, чтобы фотография и описывающее её предложение оказались **рядом**. Это **CLIP** (Radford и др., OpenAI, 2021). Когда изображение и текст делят одно пространство, кросс-модальный поиск — это просто поиск ближайшего соседа: те самые коридоры из L9, теперь дотягивающиеся между модальностями. А рыцарь, что меряет расстояние, нам уже знаком — **Сэр Косинус**.",
        ],
        tt: [
          "GraphRAG Караблгә язмалар **аша** фикер йөртергә мөмкинлек бирде. Икенче фронтир аңа бөтенләй текст булмаган язмаларны эзләргә мөмкинлек бирә. Дөнья мәгълүматының яртысы — **рәсем**: диаграмма, счёт сканы, график, фоторәсем. Текст эзләве боларның барысына да сукыр.",
          "Чишелеш — бер кыю фикер: **рәсем кодлаучысын** һәм **текст кодлаучысын** *бер үк* координаталар системасына чагылдырырга өйрәтү, фоторәсем һәм аны тасвирлаган җөмлә **янәшә** төшсен өчен. Бу — **CLIP** (Radford һ.б., OpenAI, 2021). Рәсем һәм текст бер киңлекне бүлешкәч, кросс-модаль эзләү — гади иң якын күрше эзләве: L9 дагы шул ук коридорлар, хәзер модальлекләр арасына сузыла. Ә араны үлчәгән рыцарь безгә инде таныш — **Сэр Косинус**."
        ],
      },
    },
