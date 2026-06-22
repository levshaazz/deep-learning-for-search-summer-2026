    {
      id: 'problem-linear-scan', kind: 'prose',
      img: 'L3/L3-01-linear-scan-doom.png', imgPos: 'scene',
      imgAlt: {
        en: 'A lone explorer who has checked 12 of 1,000,000,000 stars one by one — the brute-force scan is hopeless.',
        ru: 'Одинокий исследователь проверил 12 из 1 000 000 000 звёзд по одной — перебор безнадёжен.',
        tt: 'Ялгыз тикшерүче 1 000 000 000 йолдызның 12 сен берәм-берәм тикшергән — тулы кичү өметсез.',
      },
      imgCaption: {
        en: 'Twelve stars checked, 999,999,988 to go, and the user already left. Brute force isn’t slow — it’s hopeless.',
        ru: 'Проверено двенадцать звёзд, осталось 999 999 988, а пользователь уже ушёл. Перебор не медленный — он безнадёжный.',
        tt: 'Унике йолдыз тикшерелде, 999 999 988 калды, ә кулланучы инде киткән. Тулы кичү әкрен түгел — ул өметсез.',
      },
      body: {
        en: [
          "Let's name the naive plan first, so we can watch it die. Read every document at query time and check whether it matches. That's called a **linear scan**, and it is a complete non-starter. Ten milliseconds to open and read a single document, times a billion documents, is months of wall-clock time for *one* search. Multiply by the thousands of queries arriving every second and you haven't built a search engine, you've built a space heater.",
          "And the budget you're up against is brutal. A user perceives anything under about **100 milliseconds** as instant, gives you maybe a second before they feel the lag, and is gone by two or three. That 100 ms isn't even all yours — the network round-trip, the page render, and the other services in the request each take a slice, so the actual time the ranker gets to *think* is a fraction of it. A scan that needs months to touch a billion documents has overspent the budget by eight orders of magnitude before it has ranked a single result.",
          "And don't fix it by buying more machines. You can shard the scan across a thousand servers and you've still turned months into hours — for a budget that's supposed to be one second. The problem isn't horsepower. The problem is that you're reading the whole library to answer every question, and the library keeps growing.",
          "We need the answer before we've touched even a thousandth of the sky. That means doing the expensive work *once*, ahead of time, and turning each query into a cheap lookup against what we precomputed. Hold that thought — precompute once, look up forever — because it's the spine of everything that follows.",
        ],
        ru: [
          'Сначала назовём наивный план, чтобы посмотреть, как он умрёт. Прочитать каждый документ в момент запроса и проверить совпадение. Это называется **линейное сканирование**, и это полный тупик. Десять миллисекунд, чтобы открыть и прочитать один документ, умножить на миллиард документов — это месяцы реального времени на *один* поиск. Умножь на тысячи запросов, приходящих каждую секунду, — и ты построил не поисковик, а обогреватель.',
          'А бюджет, с которым ты воюешь, беспощаден. Всё, что меньше примерно **100 миллисекунд**, пользователь воспринимает как мгновенное, секунду ещё терпит до ощущения тормоза, а через две-три уходит. И эти 100 мс даже не все твои — обмен по сети, отрисовка страницы и другие сервисы в запросе откусывают по куску, так что времени, чтобы ранкер *подумал*, остаётся лишь доля от них. Скан, которому нужны месяцы, чтобы тронуть миллиард документов, перерасходовал бюджет на восемь порядков ещё до того, как отранжировал хоть один результат.',
          'И не чини это покупкой машин. Размажь скан по тысяче серверов — и месяцы превратятся в часы, при бюджете, который должен быть в одну секунду. Дело не в мощности. Дело в том, что ты перечитываешь всю библиотеку, чтобы ответить на каждый вопрос, а библиотека всё растёт.',
          'Нам нужен ответ ещё до того, как мы тронули хотя бы тысячную долю неба. А значит — сделать дорогую работу *один раз*, заранее, и превратить каждый запрос в дешёвый поиск по тому, что мы предвычислили. Запомни эту мысль — предвычислить однажды, искать вечно, — потому что это хребет всего дальнейшего.',
        ],
        tt: [
          'Башта беркатлы планны атап чыгыйк, аның ничек үләсен карар өчен. Сорау моментында һәр документны укып, тәңгәл килүен тикшерергә. Моны **линеар сканлау** дип атыйлар, һәм бу тулы тупик. Бер документны ачып укырга ун миллисекунд, аны миллиард документка тапкырла — бу *бер* эзләүгә айлар чын вакыт. Һәр секундта килгән меңләгән сорауга тапкырла — син эзләү системасы түгел, ә җылыткыч төзегәнсең.',
          'Ә син көрәшкән бюджет рәхимсез. Якынча **100 миллисекундтан** кимне кулланучы шунда ук дип кабул итә, латентлык сизелгәнче тагын секунд түзә, ә ике-өч секундтан китә. Һәм бу 100 мс барысы да синеке түгел — челтәр әйләнеше, бит ясау һәм сораудагы башка хезмәтләр һәркайсы өлеш умыра, шуңа ранкер *уйлап* алыр өчен калган вакыт алардан өлеш кенә. Миллиард документны тоту өчен айлар кирәк сканга бюджет сигез тәртип артык тотылган, әле бер нәтиҗәне дә ранжламас борын.',
          'Һәм моны машиналар сатып алып төзәтмә. Сканны мең сервер буенча җәй — һәм айлар сәгатьләргә әйләнер, ә бюджет бер секунд булырга тиеш. Эш куәттә түгел. Эш шунда: син һәр сорауга җавап бирү өчен бөтен китапханәне яңадан укыйсың, ә китапханә һаман үсә.',
          'Безгә җавап күкнең меңдән бер өлешен дә тотканчы кирәк. Ә бу — кыйммәтле эшне *бер тапкыр*, алдан эшләп, һәр сорауны без алдан исәпләгән нәрсә буенча арзан эзләүгә әйләндерү дигән сүз. Бу фикерне истә тот — бер тапкыр алдан исәплә, мәңге эзлә — чөнки бу бөтен алдагысының умыртка баганасы.',
        ],
      },
    },
