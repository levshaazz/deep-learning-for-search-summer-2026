    {
      id: 'two-axis', kind: 'prose',
      heading: { en: 'Two axes, not one', ru: 'Две оси, а не одна', tt: 'Бер түгел, ике күчәр' },
      img: 'L13/L13-10-two-by-two.png', imgPos: 'scene',
      imgAlt: {
        en: "A 2x2 plane: the horizontal query-hardness axis where two negatives look like twins, and the vertical collateral-danger axis where only one sits dangerously inside the positive's neighbourhood.",
        ru: "Плоскость 2x2: горизонтальная ось трудности к запросу, где два негатива выглядят близнецами, и вертикальная ось сопутствующей опасности, где лишь один опасно сидит в окрестности позитива.",
        tt: "2x2 яссылык: горизонталь сорау-авырлыгы күчәре, монда ике негатив игезәкләр кебек, һәм вертикаль янәшә-куркыныч күчәре, монда бары берсе генә позитив тирәлегендә куркынычлы утыра.",
      },
      imgCaption: {
        en: "Hardness alone hides the danger: you need a second axis — how close the negative sits to the *positive* it could collide with.",
        ru: "Одна трудность прячет опасность: нужна вторая ось — насколько негатив близок к *позитиву*, с которым может столкнуться.",
        tt: "Бер авырлык куркынычны яшерә: икенче күчәр кирәк — негатив бәрелешә ала торган *позитивга* никадәр якын.",
      },
      body: {
        en: [
          "The impostor exposes a confusion the field carried for years. *Hardness* is one axis — \\(\\cos(q, d^-)\\), how close a candidate sits to the query. But danger lives on a **second, orthogonal axis** — \\(\\cos(d^-, d^+)\\), how close it sits to the *positive*.",
          "A worthy hard negative is close to the query and far from the positive: push it freely. An impostor is close to the query *and* close to the positive: push it and the positive comes along. From a query-only view the two look identical — same hardness, opposite truth. You cannot tell them apart without the second axis, or a label.",
        ],
        ru: [
          "Самозванец обнажает путаницу, которую поле несло годами. *Сложность* — одна ось, \\(\\cos(q, d^-)\\): насколько близко кандидат к запросу. Но опасность живёт на **второй, ортогональной оси**, \\(\\cos(d^-, d^+)\\): насколько близко он к *позитиву*.",
          "Достойный трудный негатив близок к запросу и далёк от позитива — толкай его смело. Самозванец близок к запросу *и* к позитиву: толкнёшь его — потянется и позитив. На взгляде только со стороны запроса оба выглядят одинаково: та же сложность, противоположная истина. Их не различить без второй оси или метки.",
        ],
        tt: [
          "Алдакчы өлкә еллар буе йөрткән буталчыкны ача. *Катлаулык* — бер күчәр, \\(\\cos(q, d^-)\\): кандидат сорауга күпме якын. Ләкин куркыныч **икенче, ортогональ күчәрдә** яши, \\(\\cos(d^-, d^+)\\): ул *позитивга* күпме якын.",
          "Лаеклы катлаулы негатив сорауга якын, позитивтан ерак — аны иркен эт. Алдакчы сорауга да, позитивга да якын: аны этсәң — позитив да иярә. Бары сорау ягыннан караганда икесе бертөсле күренә: шул ук катлаулык, кире хакыйкать. Аларны икенче күчәрсез яки билгесез аеру мөмкин түгел.",
        ],
      },
    },
