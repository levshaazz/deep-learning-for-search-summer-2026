    {
      id: 'catch-flash-misconception', kind: 'prose',
      heading: { en: "Flash is not an approximation", ru: "Flash — не аппроксимация", tt: "Flash — аппроксимация түгел" },
      body: {
        en: [
          "The two doors get blurred so often that the confusion deserves its own stitch. The myth: «FlashAttention is a linear or approximate attention — it changes the formula.» The truth: FlashAttention computes the *very same* softmax attention — not an approximation; the result matches the standard computation up to the order of floating-point operations, because tiling reorders the summation and touches nothing else. It is an **IO trick**: the win is in memory and traffic, \\(O(n^2)\\!\\to\\!O(n)\\), not in the mathematics. The approximators are the *other* family — Linformer, Performer, Longformer, BigBird. A field test to carry away: if switching it on changed your model's *quality*, then whatever you switched on was not FlashAttention.",
        ],
        ru: [
          "Две двери путают так часто, что путаница заслуживает отдельного стежка. Миф: «FlashAttention — это линейное или приближённое внимание, оно меняет формулу». Правда: FlashAttention считает *то же самое* софтмакс-внимание — не аппроксимацию; результат совпадает с обычным с точностью до порядка операций с плавающей точкой, потому что тайлинг переставляет порядок суммирования и не трогает больше ничего. Это **IO-трюк**: выигрыш — в памяти и трафике, \\(O(n^2)\\!\\to\\!O(n)\\), а не в математике. Приближает — *другое* семейство: Linformer, Performer, Longformer, BigBird. Полевой тест на вынос: если после включения у модели изменилось *качество* — включил ты что угодно, только не FlashAttention.",
        ],
        tt: [
          "Ике ишекне шулкадәр еш бутыйлар ки, буталчык үз тегүенә лаек. Миф: «FlashAttention — линейный яки якынча attention, ул формуланы үзгәртә». Дөресе: FlashAttention *нәкъ шул ук* softmax-attention'ны исәпли — аппроксимация түгел; нәтиҗә гадәти исәпләү белән йөзүчән нокта операцияләре тәртибенә кадәр төгәллектә туры килә, чөнки тайлинг суммалау тәртибен генә үзгәртә, башка бернәрсәгә кагылмый. Бу — **IO-хәйлә**: отыш хәтердә һәм трафикта, \\(O(n^2)\\!\\to\\!O(n)\\), математикада түгел. Якынайтучылар — *башка* гаилә: Linformer, Performer, Longformer, BigBird. Үзең белән алып китәргә кыр тесты: кабызганнан соң моделеңнең *сыйфаты* үзгәрсә — син кабызганың теләсә нәрсә, тик FlashAttention түгел.",
        ],
      },
    },
