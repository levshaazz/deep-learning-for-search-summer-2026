    {
      id: 'catch-the-tail-that-vanishes', kind: 'prose',
      heading: { en: "The chunk that quietly disappears", ru: "Чанк, который тихо исчезает", tt: "Тавышсыз югалып кала торган chunk" },
      body: {
        en: [
          "Now look at where that counter closes the cue, because the published pseudocode closes it *inside* the condition — the assignment to the end index fires only when the running sum has caught up with the chunk length. Read the loop with a hostile eye and you can see the hole from here: what happens if the tokens run out first?",
          "Nothing happens. That is the whole problem. The condition never fires, the cue is never completed, and the last stretch of the book — the short tail that did not fill its quota of characters — is **silently dropped**. No exception, no warning, no empty vector to notice: the index simply ends up one card short, and whatever answer lived on the final page has become unreachable by any query you will ever write. A bug that throws costs you an afternoon; a bug that returns a slightly smaller index costs you a fraction of your **recall** and never tells you.",
          "The repair is one line — close the cue after the loop as well as inside it — but the habit is worth more than the repair. Count your cards. Assert that the number of pooled vectors equals the number of chunks the splitter returned, and assert it on a document whose last chunk is deliberately a stub. This is the general shape of index-side defects: they do not break the pipeline, they quietly shrink what the pipeline can find.",
        ],
        ru: [
          "Теперь посмотри, где этот счётчик закрывает подсказку: в опубликованном псевдокоде она закрывается *внутри* условия — присваивание конечного номера срабатывает лишь тогда, когда накопленная сумма догнала длину чанка. Прочти цикл недоверчиво — и дыра видна прямо отсюда: а что, если токены кончатся раньше?",
          "Ничего не произойдёт. В этом и беда. Условие не сработает ни разу, подсказка не достроится, и последний отрезок книги — короткий хвост, не набравший своей нормы символов, — **тихо пропадает**. Ни исключения, ни предупреждения, ни пустого вектора, за который зацепится глаз: индекс просто оказывается на одну карточку короче, а ответ, живший на последней странице, становится недостижим для любого запроса, какой ты когда-либо напишешь. Баг, который падает, стоит тебе вечера; баг, который возвращает чуть меньший индекс, стоит тебе доли **полноты (recall)** и никогда об этом не скажет.",
          "Починка — одна строка: закрывать подсказку и после цикла, не только внутри него. Но привычка дороже починки. Считай карточки. Проверяй, что число усреднённых векторов равно числу чанков, которые вернул разрезатель, — и проверяй на документе, у которого последний чанк нарочно сделан огрызком. Такова общая форма дефектов на стороне индексации: они не ломают конвейер, они молча сужают то, что конвейер способен найти.",
        ],
        tt: [
          "Хәзер бу исәпләгечнең cue ны кайда ябуын кара: бастырылган псевдокодта ул шартның *эчендә* ябыла — ахыргы номерны бирү җыелган сумма chunk озынлыгын куып җиткәндә генә эшли. Циклны ышанмыйча укы — тишек шуннан ук күренә: ә токеннар алдан бетсә?",
          "Берни булмый. Бөтен бәла шунда. Шарт бер тапкыр да эшләми, cue төзелеп бетми, һәм китапның соңгы кисәге — үз символ нормасын җыймаган кыска койрык — **тавышсыз югала**. Ни хата, ни кисәтү, ни күзгә эләгерлек буш вектор: index бары бер карточкага кыскарак булып чыга, ә соңгы биттә яшәгән җавап син язачак теләсә нинди сорау өчен ирешкесез була. Егылып туктый торган баг сиңа бер кичкә төшә; бераз кечерәк index кайтара торган баг сиңа **тулылык (recall)** өлешенә төшә һәм бу турыда беркайчан әйтми.",
          "Төзәтү — бер юл: cue ны цикл эчендә генә түгел, аннан соң да ябарга. Ләкин гадәт төзәтүдән кыйммәтрәк. Карточкаларыңны сана. Уртачаланган векторлар саны кисүче кайтарган chunk лар санына тигез икәнен тикшер — һәм соңгы chunk ы махсус кисәк итеп ясалган документта тикшер. Индекслау ягындагы җитешсезлекләрнең гомуми формасы шундый: алар конвейерны сындырмый, ә конвейер таба алганны тавышсыз кысалар.",
        ],
      },
    },
