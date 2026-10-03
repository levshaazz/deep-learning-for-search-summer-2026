# Лицензии вендорных файлов

Деки — офлайн-standalone (правило H1): всё, что им нужно для работы без сети, лежит
рядом, в `Lectures/vendor/`. Значит эти файлы **распространяются вместе с курсом**, и их
лицензии обязаны ехать вместе с ними. Этот файл — то самое уведомление.

Ничего из перечисленного не запрещает коммерческое использование: OFL и MIT его прямо
разрешают. Требование у обеих лицензий одно — сохранять уведомление об авторстве, что
и делает этот файл.

## Шрифты — SIL Open Font License 1.1

Полный текст лицензии: [`fonts/OFL-pangolin.txt`](fonts/OFL-pangolin.txt). Текст OFL 1.1
одинаков для всех пяти семейств; различаются только строки Copyright, они приведены ниже.

| Семейство | Где используется | Copyright |
|---|---|---|
| **IBM Plex Sans** | основной наборный шрифт слайдов | Copyright © 2017 IBM Corp. |
| **Newsreader** | заголовки и «книжная» типографика | Copyright © 2019 The Newsreader Project Authors (github.com/productiontype/Newsreader) |
| **JetBrains Mono** | код, моноширинные подписи, метки таблиц | Copyright © 2020 The JetBrains Mono Project Authors (github.com/JetBrains/JetBrainsMono) |
| **Pangolin** | рукописный слой (заголовки-скетчи) | Copyright © 2016 The Pangolin Project Authors (github.com/googlefonts/pangolin) |
| **Patrick Hand** | рукописные подписи в фигурах | Copyright © 2011 The Patrick Hand Project Authors (github.com/googlefonts/patrickhand) |

Ключевое условие OFL, которое здесь соблюдается: шрифты поставляются как есть, не
продаются отдельно и не переименованы (Reserved Font Name не нарушено).

## Библиотеки — MIT

**KaTeX 0.16.11** (`katex/`) — рендер формул.
Copyright © 2013–2020 Khan Academy and other contributors.
<https://github.com/KaTeX/KaTeX/blob/main/LICENSE>

**Prism** (`prism/`) — подсветка кода (ядро + грамматики bash, json, python, yaml).
Copyright © 2012 Lea Verou.
<https://github.com/PrismJS/prism/blob/master/LICENSE>

**qrcode.js** (`qrcode/`) — QR-коды на слайдах со ссылками.
Copyright © 2009 Kazuhiko Arase. Уведомление MIT сохранено в шапке самого файла.
<http://www.opensource.org/licenses/mit-license.php>

Полный текст MIT одинаков для всех трёх:

```
Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

## Сборочные зависимости (в деки не попадают)

`astro` (MIT), `scrollama` (MIT), `sharp` (Apache-2.0) — участвуют только в сборке сайта
и оптимизации картинок, в офлайн-деках их нет. Приведены для полноты картины.
