    {
      id: 'turn-two-architectures', kind: 'prose',
      heading: { en: 'Encode apart, or together', ru: 'Кодировать порознь или вместе', tt: 'Аерым яки бергә кодлау' },
      body: {
        en: [
          "Side by side, the two designs are one picture. The **bi-encoder** has two towers feeding one shared space; the query goes up one tower, each document up the other, and the score is the cosine of the two output vectors. The **cross-encoder** has a single tower fed a joint input \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\); the whole pair attends to itself, and one logit comes out. The whole lecture hangs on this single contrast: separate encoding lets you precompute; joint encoding lets the words interact.",
        ],
        ru: [
          'Рядом два дизайна — одна картинка. У **би-энкодера** две башни, питающие одно общее пространство; запрос идёт по одной башне, каждый документ — по другой, и оценка — косинус двух выходных векторов. У **кросс-энкодера** одна башня с совместным входом \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\); вся пара смотрит сама на себя, и выходит один логит. Вся лекция держится на этом контрасте: раздельное кодирование позволяет предпосчитать; совместное — даёт словам взаимодействовать.',
        ],
        tt: [
          'Янәшә ике дизайн — бер рәсем. **Би-энкодерда** ике манара бер уртак киңлекне туендыра; сорау бер манарадан, һәр документ икенчесеннән бара, бәя — ике чыгыш векторының косинусы. **Кросс-энкодерда** бер манара уртак керем белән \\([\\text{CLS}]\\,q\\,[\\text{SEP}]\\,d\\,[\\text{SEP}]\\); бөтен пар үзенә-үзе карый, бер логит чыга. Бөтен лекция шул контрастка таяна: аерым кодлау алдан исәпләргә мөмкинлек бирә; бергә кодлау сүзләргә тәэсир итешергә бирә.',
        ],
      },
    },
