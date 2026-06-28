    {
      id: 'cures-false-negatives', kind: 'prose',
      heading: { en: 'Three cures', ru: 'Три лекарства', tt: 'Өч дәва' },
      img: 'L13/L13-11-blade-dulls.png', imgPos: 'scene',
      imgAlt: {
        en: "Séréga strikes the Impostor and his own keen blade visibly dulls and chips from the blow — pushing away a hidden ally drags the true target with it — while Goodhart the Trickster smirks, pleased that a metric is being chased blind.",
        ru: "Серёга бьёт Самозванца, и его собственный острый клинок заметно тупится и щербится от удара — оттолкнув скрытого союзника, он тянет за собой истинную цель, — а Гудхарт-Трикстер ухмыляется, довольный, что метрику гонят вслепую.",
        tt: "Серёга Алдакчыга суга, һәм аның үткен пычагы суктан күзгә күренеп тупаслана һәм кителә — яшерен иптәшне этеп, ул чын максатны да тарта, — ә Гудхарт-Трикстер метрика сукырларча куылганга шатланып елмая.",
      },
      imgCaption: {
        en: "Push the impostor away and the blade dulls: chasing the metric blind drags the true target down with the hidden ally — exactly the cost the cures undo.",
        ru: "Оттолкни самозванца — и клинок тупится: погоня за метрикой вслепую тянет истинную цель вниз вместе со скрытым союзником — ровно ту цену, которую снимают лекарства.",
        tt: "Алдакчыны эт — пычак тупаслана: метриканы сукырларча куу чын максатны яшерен иптәш белән бергә түбән тарта — нәкъ дәвалар бетергән бәя.",
      },
      body: {
        en: [
          "Once you see the impostor, three families of cure appear. **Filter** it out: score each mined candidate with a strong cross-encoder and drop the ones that look too much like a positive — the move that first turned the inversion back into a gain. **Sample** around it: prefer *ambiguous* negatives near a sweet spot rather than always the very hardest. **Co-train** against it: pair the retriever with a noise-robust ranker that learns to discount likely false negatives.",
          "All three accept the same truth: at equal hardness, only something that knows about *relevance* — a filter, a teacher, a label — can tell a worthy negative from an impostor.",
        ],
        ru: [
          "Стоит увидеть самозванца — появляются три семейства лекарств. **Отфильтровать**: оцени каждого намайненного кандидата сильным кросс-энкодером и выбрось тех, кто слишком похож на позитив, — приём, впервые превративший провал обратно в выигрыш. **Сэмплировать** вокруг: предпочитай *неоднозначные* негативы у сладкой точки, а не всегда самые сложные. **Со-обучать** против: соедини ретривер с устойчивым к шуму ранкером, который учится снижать вес вероятных ложных негативов.",
          "Все три принимают одну истину: при равной сложности отличить достойного негатива от самозванца может лишь то, что знает о *релевантности*, — фильтр, учитель или метка.",
        ],
        tt: [
          "Алдакчыны күргәч, өч гаилә дәва пәйда була. **Фильтрла**: һәр майнинг кандидатын көчле кросс-энкодер белән бәялә һәм позитивга артык охшаганнарын ташла — инверсияне яңадан отышка әйләндергән беренче алым. Тирәсендә **сэмплла**: һәрвакыт иң катлаулысын түгел, татлы нокта янындагы *билгесез* негативларны өстен күр. Каршы **бергә өйрәт**: ретриверны шомга чыдам ранкер белән бергә куй, ул мөгаен ялган негативларны кимрәк бәяләргә өйрәнә.",
          "Өчесе дә бер хакыйкатьне кабул итә: бертигез катлаулыкта лаеклы негативны алдакчыдан аеру өчен бары *релевантлык* турында белгән нәрсә — фильтр, остаз яки билге — генә ярдәм итә.",
        ],
      },
    },
