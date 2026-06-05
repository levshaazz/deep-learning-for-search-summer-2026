// content/book/l0.js — "The Briefing" (L0), per narrative/L0.md. The meta-chapter: introduces the
// galaxy/spine and the rules. Lighter than the others. EN canonical + RU; TT falls back.

export default {
  id: '00',
  catchphrase: 'The Briefing',
  beats: [
    {
      id: 'hook-briefing', kind: 'prose',
      heading: { en: 'The Briefing', ru: 'Инструктаж' },
      body: {
        en: [
          "I'm Serega, and I'll be your guide for the next seven weeks. Not your captain — by the end, that's you. Think of me as the slightly-too-enthusiastic co-pilot who's flown this route before and knows where the turbulence is.",
          "We're about to cross the Galaxy of Information: an endless ocean of documents, queries, signals and noise, and somewhere in it the one answer a user actually wants. Our job is to build the Ship that finds it — and keeps finding it.",
        ],
        ru: [
          'Я Серёга, и я буду вашим гидом следующие семь недель. Не капитаном — к концу курса капитан это вы. Считайте меня чересчур воодушевлённым вторым пилотом, который уже летал этим маршрутом и знает, где трясёт.',
          'Нам предстоит пересечь Галактику Информации: бесконечный океан документов, запросов, сигналов и шума, и где-то в нём — тот единственный ответ, который на самом деле нужен пользователю. Наша задача — построить Корабль, который его найдёт. И будет находить дальше.',
        ],
      },
    },
    {
      id: 'problem-everywhere', kind: 'prose',
      body: {
        en: [
          "Why care? Because search is the quiet engine under almost everything now — web search, your phone's photo app, recommendations, and the retrieval that keeps large language models honest (that's RAG, and we'll get there). Get search right and a billion documents feel like a tidy bookshelf. Get it wrong and the right answer might as well not exist.",
        ],
        ru: [
          'Зачем это нужно? Потому что поиск сегодня — тихий двигатель почти всего: веб-поиск, фотоприложение в телефоне, рекомендации и то самое извлечение, что держит большие языковые модели честными (это RAG, мы до него дойдём). Сделай поиск правильно — и миллиард документов ощущается как аккуратная книжная полка. Сделай неправильно — и нужный ответ как будто не существует.',
        ],
      },
    },
    {
      id: 'stakes-scale', kind: 'prose',
      heading: { en: 'The scale of the thing', ru: 'Масштаб задачи' },
      body: {
        en: [
          "Two numbers to set the mood. The web is around 10¹² pages. And every single day, roughly 15% of queries are ones the engine has never seen before. You can't pre-compute the answers, and you can't read everything when the user hits enter. That tension — too much data, too little time — is the whole course in one sentence.",
        ],
        ru: [
          'Два числа для настроения. Веб — это около 10¹² страниц. И каждый день примерно 15% запросов — те, которых движок никогда раньше не видел. Ответы не предвычислить, и нельзя прочитать всё в момент, когда пользователь нажимает Enter. Это напряжение — слишком много данных, слишком мало времени — и есть весь курс в одном предложении.',
        ],
      },
    },
    { id: 'turn-the-map', kind: 'scrolly', widget: 'course-map' },
    {
      id: 'climb-logistics', kind: 'prose',
      heading: { en: 'The flight plan', ru: 'План полёта' },
      body: {
        en: [
          "Seven weeks. We start classical (BM25, inverted indexes, ranking metrics), then go neural (embeddings, transformers, bi- and cross-encoders), then make it survive scale (ANN, vector databases, production), then make it answer (RAG, evaluation, agents). Wednesdays we cover ground; Fridays we get our hands dirty with labs.",
          "You'll be assessed with assignments, labs, a midterm, a final, and a project you defend at the end. The exact weights and dates live on the Syllabus page — bookmark it. One rule up front: no late submissions, and cheating is a zero-tolerance black hole.",
        ],
        ru: [
          'Семь недель. Начинаем с классики (BM25, инвертированные индексы, метрики ранжирования), потом уходим в нейросети (эмбеддинги, трансформеры, би- и кросс-энкодеры), потом учим это выживать в масштабе (ANN, векторные базы, продакшн), потом учим это отвечать (RAG, оценка, агенты). По средам проходим материал, по пятницам пачкаем руки в лабах.',
          'Оценивание — задания, лабы, промежуточный экзамен, финал и проект, который вы защищаете в конце. Точные веса и даты — на странице Программы, добавьте в закладки. Одно правило сразу: поздние сдачи не принимаются, а списывание — чёрная дыра с нулевой терпимостью.',
        ],
      },
    },
    {
      id: 'catch-how-to-fail', kind: 'prose',
      heading: { en: 'How to sink (so you don’t)', ru: 'Как утонуть (чтобы не утонуть)' },
      body: {
        en: [
          "Most people who struggle here do one of two things: they watch lectures like TV (passive — nothing sticks), or they cram the night before an exam (a search system isn't a fact you memorize, it's a machine you understand). The cure for both is the same: do the worked examples by hand, break the code, and ask \"what problem does this solve?\" before \"how does it work?\"",
        ],
        ru: [
          'Большинство тех, кому здесь тяжело, делают одно из двух: смотрят лекции как сериал (пассивно — ничего не оседает) или зубрят в ночь перед экзаменом (поисковая система — это не факт для запоминания, а машина для понимания). Лекарство в обоих случаях одно: разбирайте примеры руками, ломайте код и спрашивайте «какую проблему это решает?» прежде, чем «как это работает?».',
        ],
      },
    },
    {
      id: 'payoff-sendoff', kind: 'prose',
      heading: { en: 'Buckle up', ru: 'Пристегнитесь' },
      body: {
        en: [
          "That's the briefing. The route is set: Get Data, Measure, Rank, on repeat, getting deeper each week. I promise the journey is genuinely fun — and I fully intend to make your life a little miserable along the way, in the way a good coach does. Buckle up, crew. First stop: how do we even find one record in a sea of a billion? See you in The Lost Record.",
        ],
        ru: [
          'Вот и весь инструктаж. Маршрут проложен: Get Data, Measure, Rank, по кругу, всё глубже с каждой неделей. Обещаю, путешествие будет действительно весёлым — и я твёрдо намерен слегка усложнить вам жизнь по пути, как делает хороший тренер. Пристегнитесь, экипаж. Первая остановка: как вообще найти одну запись в море из миллиарда? Увидимся в «Потерянной записи».',
        ],
      },
    },
  ],
};
