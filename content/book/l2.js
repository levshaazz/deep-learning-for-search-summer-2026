// content/book/l2.js — "First Contact" chapter (the full L2 arc), per narrative/L2.md.
// The single source for this chapter's NARRATIVE prose. SCROLLY beats pull their per-step prose
// from the widget's own i18n.json (the figure narrates itself). EN canonical + RU; TT falls back.
// Built per NARRATIVE_METHOD.md (P1 hook, P2 creatures, P3 metaphor, P9 humor off precision, P12 callback).

export default {
  id: '02',
  catchphrase: 'First Contact',
  beats: [
    {
      id: 'hook-first-contact', kind: 'prose',
      heading: { en: 'First Contact', ru: 'Первый контакт' },
      body: {
        en: [
          "I'm Serega, and I've got a problem. There's an alien on my screen, and it won't stop talking. The translator spits out symbols. Are two of its phrases saying the same thing, or completely different things? I genuinely cannot tell.",
          "That's today's mission: teach a machine to handle language it has never seen — and to judge when two pieces of meaning are *close*. Two jobs, really: first turn the noise into something countable, then measure similarity. Buckle up.",
        ],
        ru: [
          'Я Серёга, и у меня проблема. На экране — инопланетянин, и он не замолкает. Переводчик выдаёт символы. Две его фразы говорят об одном и том же или о совершенно разном? Честно — не могу понять.',
          'Это и есть задача на сегодня: научить машину работать с языком, которого она никогда не видела, — и судить, когда два смысла *близки*. По сути две работы: сперва превратить шум в нечто счётное, потом измерить близость. Пристегнись.',
        ],
      },
    },
    {
      id: 'problem-raw-text', kind: 'prose',
      body: {
        en: [
          "First snag: a computer can't do anything with raw letters. It needs numbers. The lazy fix — give every whole word an ID — breaks the instant the alien says a word we've never logged. One unknown word and the whole pipeline shrugs: *out of vocabulary*.",
        ],
        ru: [
          'Первая загвоздка: компьютер ничего не может сделать с сырыми буквами. Ему нужны числа. Ленивое решение — выдать каждому целому слову свой ID — рушится в тот миг, когда инопланетянин произносит слово, которого мы не записали. Одно неизвестное слово — и весь конвейер разводит руками: *слова нет в словаре*.',
        ],
      },
    },
    {
      id: 'turn-tokenize', kind: 'prose',
      heading: { en: 'Enter the Tokenosaurus', ru: 'Появляется Токенозавр' },
      body: {
        en: [
          "So we stop chasing whole words and chop them into *sub-words*. Meet the **Tokenosaurus** — a friendly beast that snips text into reusable chunks. Never seen the word? Fine — it still splits into pieces we *have* seen. The trick is letting the data decide which chunks are worth keeping.",
        ],
        ru: [
          'Поэтому мы перестаём гоняться за целыми словами и режем их на *подслова*. Знакомьтесь — **Токенозавр**, дружелюбный зверь, который кромсает текст на переиспользуемые куски. Не видел слова? Не беда — оно всё равно распадётся на куски, которые мы *видели*. Фокус в том, чтобы данные сами решали, какие куски стоит хранить.',
        ],
      },
    },
    { id: 'climb-bpe', kind: 'scrolly', widget: 'bpe-merge-ledger', data: 'l2-bpe' },
    { id: 'stats-zipf-heaps', kind: 'scrolly', widget: 'zipf-heaps', data: 'l2-corpus-stats' },
    {
      id: 'problem-length-lies', kind: 'prose',
      heading: { en: 'Length lies', ru: 'Длина врёт' },
      body: {
        en: [
          "Now every phrase is a vector of numbers — a point in space. To compare two phrases, the obvious move is to measure the straight-line distance between their points. Obvious… and wrong.",
          "A phrase repeated twice points the same way as the phrase said once — same meaning — but it sits twice as far out. Raw distance screams \"these are different!\" Length lies. We need a measure that ignores how *loud* a vector is and listens only to where it *points*.",
        ],
        ru: [
          'Теперь каждая фраза — это вектор чисел, точка в пространстве. Чтобы сравнить две фразы, очевидный ход — измерить расстояние по прямой между их точками. Очевидно… и неверно.',
          'Фраза, повторённая дважды, смотрит в ту же сторону, что и сказанная один раз, — тот же смысл, — но стоит вдвое дальше. Сырое расстояние вопит: «они разные!» Длина врёт. Нам нужна мера, которая игнорирует, насколько вектор *громкий*, и слушает только, куда он *смотрит*.',
        ],
      },
    },
    {
      id: 'turn-measure-angle', kind: 'prose',
      heading: { en: 'Measure the angle, not the length', ru: 'Измеряй угол, а не длину' },
      body: {
        en: [
          "Enter **Sir Cosine and the Knights of the Unit Sphere**. Their whole creed: forget distance, measure the *angle* between two vectors. Point the same way → angle zero → as similar as it gets. The next figure is the worked example — watch the numbers.",
        ],
        ru: [
          'На сцену выходят **Сэр Косинус и Рыцари Единичной Сферы**. Весь их девиз: забудь про расстояние, измеряй *угол* между двумя векторами. Смотрят в одну сторону → угол ноль → максимально похожи. Следующая фигура — разобранный пример, следи за числами.',
        ],
      },
    },
    { id: 'climb-cosine', kind: 'scrolly', widget: 'cosine-sphere', data: 'l2-cosine' },
    { id: 'catch-curse-highd', kind: 'scrolly', widget: 'highd-histogram', data: 'l2-highd' },
    {
      id: 'payoff-knights-win', kind: 'prose',
      heading: { en: 'The Knights hold the sphere', ru: 'Рыцари удерживают сферу' },
      body: {
        en: [
          "So the Wraith of high dimensions melts raw distance into mush — but on the unit sphere, where only direction survives, Sir Cosine still stands. The machine can finally judge when two meanings are close: First Contact established.",
          "But a question is already glowing on the console: those vectors — where do their *directions* actually come from? That's the next chapter. We're going to learn where meaning gets its coordinates: embeddings.",
        ],
        ru: [
          'Итак, Призрак высоких размерностей превращает сырое расстояние в кашу — но на единичной сфере, где выживает только направление, Сэр Косинус по-прежнему стоит. Машина наконец может судить, когда два смысла близки: Первый контакт установлен.',
          'Но на консоли уже мигает вопрос: эти векторы — откуда вообще берутся их *направления*? Это следующая глава. Мы узнаем, где смысл получает свои координаты: эмбеддинги.',
        ],
      },
    },
  ],
};
