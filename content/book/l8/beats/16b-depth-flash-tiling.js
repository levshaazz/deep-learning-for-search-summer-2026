    {
      id: 'depth-flash-tiling', kind: 'prose',
      heading: { en: "Tiles and a running edge: how Flash weaves", ru: "Тайлы и бегущая кромка: как ткёт Flash", tt: "Тайллар һәм йөгерек кырый: Flash ничек тукый" },
      body: {
        en: [
          "FlashAttention opens the first door: same mathematics, different order. The rule is blunt — the \\(n \\times n\\) sheet is *never written* to the slow table (HBM). Instead, **tiling**: cut \\(Q\\), \\(K\\), \\(V\\) into blocks, carry one small pair of blocks at a time onto the fast bench (SRAM), compute that patch of scores where it lies, fold its contribution into the output — and let the patch vanish before the next one arrives.",
          "The subtle part is that softmax seems to *need* the whole row — its maximum for stability, its sum for normalization — before any single weight is right. The **online softmax** dissolves the objection: keep a running maximum \\(m\\), a running sum \\(\\ell\\), and a running output \\(O\\), and let each new block *correct* everything accumulated so far; when the last block has passed, the row equals exactly the softmax you would have computed whole. Memory falls from \\(O(n^2)\\) to \\(O(n)\\) — and read the savings correctly: not fewer multiplications, but less *memory traffic*, fewer trips to the slow table. The weave itself — unchanged.",
        ],
        ru: [
          "FlashAttention открывает первую дверь: та же математика, другой порядок. Правило грубое и простое — лист \\(n \\times n\\) *никогда не записывается* на медленный стол (HBM). Вместо этого — **тайлинг**: разрежь \\(Q\\), \\(K\\), \\(V\\) на блоки, выноси на быстрый верстак (SRAM) по одной малой паре блоков за раз, сосчитай этот лоскут оценок прямо на месте, вложи его вклад в выход — и дай лоскуту исчезнуть до прихода следующего.",
          "Тонкое место в том, что софтмаксу вроде бы *нужна* вся строка — её максимум для устойчивости, её сумма для нормировки, — прежде чем хоть один вес станет верным. **Online softmax** растворяет это возражение: держи бегущий максимум \\(m\\), бегущую сумму \\(\\ell\\) и бегущий выход \\(O\\) — и пусть каждый новый блок *поправляет* всё накопленное; когда пройдёт последний блок, строка в точности равна софтмаксу, который ты сосчитал бы целиком. Память падает с \\(O(n^2)\\) до \\(O(n)\\) — и читай выигрыш правильно: не меньше умножений, а меньше *трафика памяти*, меньше ходок к медленному столу. Само плетение — без изменений.",
        ],
        tt: [
          "FlashAttention беренче ишекне ача: шул ук математика, башка тәртип. Кагыйдә туры: \\(n \\times n\\) табак әкрен өстәлгә (HBM) *беркайчан язылмый*. Аның урынына — **тайлинг**: \\(Q\\), \\(K\\), \\(V\\)ны блокларга кис, тиз верстакка (SRAM) бер юлы бер кечкенә пар блок чыгар, шул баллар кисәген урынында исәплә, өлешен чыгышка куш — һәм киләсесе килгәнче кисәк юкка чыксын.",
          "Нечкә урыны шунда: softmax'ка бөтен юл *кирәк кебек* — тотрыклылык өчен максимумы, нормалаштыру өчен суммасы — бер генә авырлык та дөрес булганчы. **Online softmax** бу каршылыкны эретә: йөгерек максимум \\(m\\), йөгерек сумма \\(\\ell\\) һәм йөгерек чыгыш \\(O\\)ны тот, һәм һәр яңа блок моңа кадәр җыелганның барысын *төзәтсен*; соңгы блок үткәч, юл нәкъ тулаем исәпләнгән softmax'ка тигез була. Хәтер \\(O(n^2)\\)дан \\(O(n)\\)га төшә — һәм отышны дөрес укы: тапкырлаулар кимүе түгел, *хәтер трафигы* кимүе, әкрен өстәлгә йөрүләр азаюы. Туку үзе — үзгәрешсез.",
        ],
      },
    },
