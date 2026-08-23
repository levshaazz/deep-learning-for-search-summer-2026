    {
      id: 'depth-the-order-the-circuit-hides', kind: 'prose',
      heading: { en: "The order the circuit hides", ru: "Порядок, который схема прячет", tt: "Схема яшергән тәртип" },
      body: {
        en: [
          "Here is a boundary you can watch rather than take on trust. The cup says: contract this axis, sum over the index. Summation on the reals is associative, so the drawing names no order and owes you none. Floating-point addition is not associative, and the gap is not subtle: \\((10^{16} + 1) - 10^{16}\\) evaluates to 0 in double precision, while \\(10^{16} + (1 - 10^{16})\\) evaluates to 1. Same three numbers, same sum, two answers.",
          "So two kernels that draw as the identical circuit — same wires, same cup, same einsum string — may legitimately disagree in their low bits, because one adds in tiles and the other in a reduction tree. This is exactly why the honest phrasing about FlashAttention is *mathematically exact*, not *bit-for-bit identical*: it computes the same sum, in a different order, on purpose.",
          "Two things to keep. First, the practical debugging rule: a mismatch in the sixth significant digit is almost always summation order, not a wrong wire — look at the reduction before you re-read the diagram. Second, the honest scope of the notation: it is a language about **structure**, and arithmetic lives one level below it. A tool that is clear about what it does not model is worth more than one that quietly implies it models everything.",
        ],
        ru: [
          "Вот граница, которую можно увидеть, а не принять на веру. Чаша говорит: стяни эту ось, просуммируй по индексу. Сложение вещественных чисел ассоциативно, поэтому рисунок не называет порядок — и не обязан. Сложение с плавающей точкой не ассоциативно, и расхождение не тонкое: \\((10^{16} + 1) - 10^{16}\\) в двойной точности даёт 0, а \\(10^{16} + (1 - 10^{16})\\) даёт 1. Те же три числа, та же сумма, два ответа.",
          "Значит, два ядра, которые рисуются одной и той же схемой — те же провода, та же чаша, та же строка einsum, — законно расходятся в младших битах: одно складывает тайлами, другое деревом редукции. Ровно поэтому честная формулировка про FlashAttention звучит как *точен математически*, а не *совпадает бит-в-бит*: он считает ту же сумму, но в другом порядке, и делает это намеренно.",
          "Забрать отсюда стоит две вещи. Первое — правило отладки: расхождение в шестом значащем знаке почти всегда означает порядок суммирования, а не перепутанный провод; смотри на редукцию, прежде чем перечитывать схему. Второе — честные границы предмета: нотация говорит о **структуре**, а арифметика живёт этажом ниже. Инструмент, который прямо называет, чего он не моделирует, стоит дороже того, который молча делает вид, что моделирует всё.",
        ],
        tt: [
          "Менә ышанып кабул итәр урынга күреп була торган чик. Касә әйтә: бу күчәрне кыс, индекс буенча сумма ал. Хакыйкый саннарны кушу ассоциатив, шуңа рәсем тәртипне атамый — һәм атарга тиеш тә түгел. Йөзүче нокталы кушу ассоциатив түгел, ә аерма нечкә түгел: \\((10^{16} + 1) - 10^{16}\\) икеле төгәллектә 0 бирә, ә \\(10^{16} + (1 - 10^{16})\\) 1 бирә. Шул ук өч сан, шул ук сумма, ике җавап.",
          "Димәк, бер үк схема белән сурәтләнә торган ике ядро — шул ук чыбыклар, шул ук касә, шул ук einsum юлы — кече битларда законлы рәвештә аерыла: берсе плитәләр белән, икенчесе редукция агачы белән куша. Нәкъ шуңа күрә FlashAttention турындагы намуслы әйтем *математик яктан төгәл*, ә *бит-биткә тәңгәл* түгел: ул шул ук сумманы, әмма башка тәртиптә, атап-белеп исәпли.",
          "Моннан ике нәрсә алырга кирәк. Беренчесе — көйләү кагыйдәсе: алтынчы мәгънәле билгедәге аерма күпчелек очракта кушу тәртибен аңлата, бутап тоташтырылган чыбыкны түгел; схеманы яңадан укыганчы редукциягә кара. Икенчесе — предметның намуслы чикләре: язу ысулы **структура** турында сөйли, ә арифметика бер кат аста яши. Нәрсәне модельләмәгәнен ачык әйтә торган корал, барысын да модельли дигән караш калдырган коралдан кыйммәтрәк.",
        ],
      },
    },
