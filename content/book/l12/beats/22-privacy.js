    {
      id: 'privacy', kind: 'prose',
      heading: { en: 'Risk 2 — privacy / PII', ru: 'Риск 2 — приватность / PII', tt: 'Риск 2 — шәхси тормыш / PII' },
      body: {
        en: [
          "The index is an **attack surface**. Indexed documents may leak personal or secret data — and once a passage is *retrievable*, the generator can surface it to anyone who phrases the right query. PII or confidential text swept into the corpus becomes an exfiltration path, and in a multi-tenant system one tenant's query can pull another tenant's records.",
          "Here grounding cuts **both ways**. The very property that makes RAG trustworthy — it answers *from the index* rather than from imagination — is exactly what makes a leaky index dangerous: a faithful answer to a forbidden passage is still a leak.",
          "The mitigation: **scrub PII; put access control on the index; isolate per tenant.** Treat the index with the same care you would the source database it was built from — because, functionally, it now *is* a queryable copy of it.",
        ],
        ru: [
          "Индекс — это **поверхность атаки**. Проиндексированные документы могут утечь персональными или секретными данными — и как только отрывок становится *извлекаемым*, генератор может вынести его любому, кто сформулирует нужный запрос. PII или конфиденциальный текст, попавший в корпус, становится путём эксфильтрации, а в многоарендной системе запрос одного арендатора может вытянуть записи другого.",
          "Здесь заземление режет **в обе стороны**. То самое свойство, что делает RAG надёжным — он отвечает *из индекса*, а не из воображения, — ровно то, что делает дырявый индекс опасным: верный ответ из запретного отрывка — всё равно утечка.",
          "Смягчение: **вычищай PII; ставь контроль доступа на индекс; изолируй по арендаторам.** Обращайся с индексом с той же осторожностью, что и с исходной базой, из которой он построен, — ведь функционально он теперь *и есть* её запрашиваемая копия.",
        ],
        tt: [
          "Индекс — **һөҗүм өслеге**. Индексланган документлар шәхси яисә яшерен мәгълүмат белән агып китәргә мөмкин — һәм өзек *алына торган* булгач, генератор аны дөрес сорау формалаштырган теләсә кемгә чыгара ала. Корпуска эләккән PII яисә яшерен текст эксфильтрация юлына әйләнә, ә күпарендалы системада бер арендатор соравы икенче арендатор язмаларын тартып чыгара ала.",
          "Монда нигезләү **ике якка** да кисә. RAG ны ышанычлы иткән нәкъ шул үзлек — ул хыялдан түгел, *индекстан* җавап бирә — нәкъ менә тишек индексны куркыныч итә: тыелган өзеккә тугры җавап — барыбер агу.",
          "Йомшарту: **PII ны чистарт; индекска керү контролен куй; арендаторлар буенча изоляциялә.** Индекс белән аны төзегән чыганак базасы белән кебек сак эш ит — чөнки функциональ яктан ул хәзер аның сорала торган күчермәсе *үзе*."
        ],
      },
    },
