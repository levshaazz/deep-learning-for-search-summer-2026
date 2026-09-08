    {
      id: 'depth-dpo', kind: 'prose',
      heading: { en: "DPO: the same taste, without the RL loop", ru: "DPO: тот же вкус — без RL-петли", tt: "DPO: шул ук зәвык — RL әйләнешеннән башка" },
      body: {
        en: [
          "The three-pass fitting works, but it is heavy machinery: a separate judge to train, an RL loop to keep stable. **DPO** — direct preference optimization — asks the sharp question: if everything begins with pairs \\(y_w \\succ y_l\\), why not learn from the pairs *directly*? One classification loss on the policy itself: \\(\\mathcal{L}_{\\text{DPO}} = -\\log\\sigma\\!\\Big(\\beta\\log\\tfrac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta\\log\\tfrac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\Big)\\). Read it aloud: raise the preferred weave's probability *relative to the reference loom*, push the rejected one down — with \\(\\beta\\) as the same short leash that KL played in PPO. No explicit reward model, no RL loop.",
          "Simpler and more stable than the full RLHF pipeline — but do not mistake the family: DPO is still *preference optimization* on pairs, the same goal reached with fewer moving parts. The customer's taste still enters as comparisons; only the middleman is gone.",
        ],
        ru: [
          "Подгонка в три прохода работает, но это тяжёлая машинерия: отдельный судья, которого надо обучить, RL-петля, которую надо удержать в устойчивости. **DPO** — direct preference optimization — задаёт острый вопрос: если всё начинается с пар \\(y_w \\succ y_l\\), почему не учиться на парах *напрямую*? Один классификационный лосс по самой политике: \\(\\mathcal{L}_{\\text{DPO}} = -\\log\\sigma\\!\\Big(\\beta\\log\\tfrac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta\\log\\tfrac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\Big)\\). Прочти вслух: подними вероятность предпочтённого плетения *относительно эталонного станка*, опусти отвергнутое — а \\(\\beta\\) здесь тот же короткий поводок, каким в PPO был KL. Без явной reward-модели, без RL-петли.",
          "Проще и стабильнее полного RLHF-конвейера — но не перепутай родню: DPO — это по-прежнему *оптимизация предпочтений* на парах, та же цель, достигнутая меньшим числом движущихся частей. Вкус заказчика всё так же входит сравнениями; исчез только посредник.",
        ],
        tt: [
          "Өч үтемле җайлау эшли, ләкин ул авыр машинерия: өйрәтәсе аерым хөкемдар, тотрыклы тотасы RL-әйләнеш. **DPO** — direct preference optimization — үткен сорау бирә: барысы да \\(y_w \\succ y_l\\) парларыннан башлана икән, ни өчен парларда *турыдан-туры* өйрәнмәскә? Политиканың үзе буенча бер классификация лоссы: \\(\\mathcal{L}_{\\text{DPO}} = -\\log\\sigma\\!\\Big(\\beta\\log\\tfrac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\beta\\log\\tfrac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\Big)\\). Кычкырып укы: өстен күрелгән тукуның ихтималлыгын *эталон станокка карата* күтәр, кире кагылганын төшер — ә \\(\\beta\\) монда PPO'да KL уйнаган шул ук кыска җип. Ачык reward-моделсез, RL-әйләнешсез.",
          "Тулы RLHF-конвейерыннан гадирәк һәм тотрыклырак — ләкин нәселен бутама: DPO — һаман парлардагы *өстенлекләр оптимизациясе*, шул ук максат, хәрәкәтләнүче өлешләре генә кимрәк. Заказчик зәвыгы һаман чагыштырулар булып керә; арадашчы гына юкка чыкты.",
        ],
      },
    },
