    {
      id: 'depth-linear-sparse', kind: 'prose',
      heading: { en: "The second door: approximate the crossing", ru: "Вторая дверь: приблизить пересечение", tt: "Икенче ишек: кисешүне якынайту" },
      body: {
        en: [
          "The second door changes the mathematics itself. **Linear attention** shrinks the crossing by algebra: Linformer projects \\(K\\) and \\(V\\) down to low rank — as if the reader's threads were retold in a few representative strands before anyone crosses them; Performer (FAVOR+) replaces the softmax kernel with random features, so the crossing factorizes. **Sparse attention** shrinks it by geography: Longformer and BigBird let each thread cross only a local window of neighbours, plus a few *global* anchor threads that everyone may consult. All of them come out at \\(O(n)\\).",
          "Now the price tag, in one line: all of these *approximate* full softmax attention. The cloth is no longer the one the slow loom would have woven — usually close, never guaranteed identical; that fidelity is what you spend to buy the length. It is an honest bargain — but it *is* a bargain, which is exactly what the sly door of the previous beat never was, and that distinction is the next beat's whole point.",
        ],
        ru: [
          "Вторая дверь меняет саму математику. **Линейное внимание** сжимает пересечение алгеброй: Linformer проецирует \\(K\\) и \\(V\\) в низкий ранг — как будто нити читателя пересказали несколькими представительными прядями ещё до всякого скрещения; Performer (FAVOR+) подменяет софтмакс-ядро случайными признаками, и пересечение факторизуется. **Разреженное внимание** сжимает его географией: Longformer и BigBird разрешают нити скреститься лишь с локальным окном соседей плюс несколькими *глобальными* нитями-якорями, к которым можно обратиться всем. Все выходят в \\(O(n)\\).",
          "Теперь ценник, одной строкой: все они *приближают* полное софтмакс-внимание. Полотно уже не то, что выткал бы медленный станок, — обычно близкое, но никогда не гарантированно то же; этой точностью ты и платишь за длину. Сделка честная — но это именно сделка, чем хитрая дверь из прошлого такта не была никогда, и в этом различии — весь смысл следующего такта.",
        ],
        tt: [
          "Икенче ишек математиканың үзен үзгәртә. **Линейный attention** кисешүне алгебра белән кыса: Linformer \\(K\\) белән \\(V\\)ны түбән рангка проекцияли — укучы җепләрен кисешүгә кадәр берничә вәкил учмә белән кыскача сөйләп биргән кебек; Performer (FAVOR+) softmax-ядрәне очраклы билгеләр белән алыштыра, һәм кисешү факторлаша. **Сирәк attention** аны география белән кыса: Longformer һәм BigBird җепкә бары күршеләрнең локаль тәрәзәсе плюс барысы да мөрәҗәгать итә алган берничә *глобаль* якорь-җеп белән генә кисешергә рөхсәт итә. Барысы да \\(O(n)\\)га чыга.",
          "Инде бәя язуы, бер юл белән: болар барысы да тулы softmax-attention'ны *якынайталар*. Тукыма инде әкрен станок тукыганы түгел — гадәттә якын, ләкин нәкъ шул ук дип беркайчан гарантияләнмәгән; озынлыкны сатып алу өчен түләгән төгәллек шул. Килешү намуслы — ләкин ул нәкъ менә килешү, ә узган тактагы хәйләкәр ишек андый булмады бервакытта да; бу аерма — киләсе тактның бөтен мәгънәсе.",
        ],
      },
    },
