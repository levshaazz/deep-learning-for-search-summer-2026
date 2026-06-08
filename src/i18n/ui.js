// ui.js — site chrome strings (navigation, section headings, labels).
// EN canonical + RU. TT intentionally omitted on most keys → resolver falls back to RU
// (then EN). The native-speaker reviewer fills `tt` here; the G3 coverage gate will report
// chrome translation completeness. Keep keys flat-ish and stable (they are i18n keys).

export const ui = {
  brandSub: { en: 'Innopolis University', ru: 'Университет Иннополис' },
  graduateCourse: { en: 'Graduate course', ru: 'Магистерский курс' },

  nav: {
    book: { en: 'The Book', ru: 'Книга', tt: 'Китап' },
    lectures: { en: 'Lectures', ru: 'Лекции' },
    syllabus: { en: 'Syllabus', ru: 'Программа' },
    schedule: { en: 'Schedule', ru: 'Расписание' },
    assignments: { en: 'Assignments', ru: 'Задания' },
    gallery: { en: 'Gallery', ru: 'Галерея' },
    papers: { en: 'Papers', ru: 'Статьи' },
  },

  sections: {
    lectures: { en: 'Lectures', ru: 'Лекции' },
    assignments: { en: 'Labs & Homework', ru: 'Лабораторные и домашние задания' },
    assignmentsKicker: {
      en: 'Lecture 03–04 · Classical IR & Ranking Metrics · implement by hand, measure, compare',
      ru: 'Лекции 03–04 · Классический IR и метрики ранжирования · реализуй руками, измеряй, сравнивай',
    },
    lecturesKicker: {
      en: 'Interactive slide decks · open in any browser · ← / → to navigate · O for overview',
      ru: 'Интерактивные слайды · открываются в любом браузере · ← / → навигация · O — обзор',
    },
    gallery: { en: 'Gallery — a visual glossary', ru: 'Галерея — визуальный глоссарий' },
    galleryKicker: {
      en: 'Bestiary + Scenes · the recurring cast and metaphor art · one idea per picture · linked to the chapter',
      ru: 'Бестиарий + Сцены · повторяющиеся персонажи и метафоры · одна идея на картинку · со ссылкой на главу',
    },
    papers: { en: 'Papers & references', ru: 'Статьи и литература' },
    papersKicker: {
      en: 'The course bibliography · every cited work · grouped by area · with a real link and why it is here',
      ru: 'Библиография курса · каждая цитируемая работа · сгруппирована по областям · с реальной ссылкой и пояснением',
    },
    book: { en: 'The Book', ru: 'Книга' },
    bookKicker: {
      en: 'The course as an interactive scrollytelling story — Wait-But-Why style, in three languages',
      ru: 'Курс как интерактивная скролл-история — в стиле Wait But Why, на трёх языках',
    },
    schedule: { en: 'Schedule', ru: 'Расписание' },
    assessment: { en: 'Assessment', ru: 'Оценивание' },
    instructor: { en: 'Instructor', ru: 'Преподаватель' },
    reading: { en: 'Reading', ru: 'Литература' },
    readingKicker: { en: 'Textbooks & sources', ru: 'Учебники и источники' },
  },

  labels: {
    ready: { en: 'Ready', ru: 'Готово' },
    coming: { en: 'Coming', ru: 'Скоро' },
    open: { en: 'Open', ru: 'Открыть' },
    allAssignments: { en: 'All assignments', ru: 'Все задания' },
    prev: { en: 'Prev', ru: 'Пред.' },
    next: { en: 'Next', ru: 'След.' },
    openSlides: { en: 'Open slides', ru: 'Открыть слайды' },
    readBook: { en: 'Read in the Book', ru: 'Читать в Книге' },
    institution: { en: 'Institution', ru: 'Институт' },
    instructor: { en: 'Instructor', ru: 'Преподаватель' },
    term: { en: 'Term', ru: 'Семестр' },
    firstLecture: { en: 'First lecture', ru: 'Первая лекция' },
    week: { en: 'Week', ru: 'Неделя' },
    date: { en: 'Date', ru: 'Дата' },
    topics: { en: 'Topics & milestones', ru: 'Темы и вехи' },
    component: { en: 'Component', ru: 'Компонент' },
    weight: { en: 'Weight', ru: 'Вес' },
    total: { en: 'Total', ru: 'Итого' },
    grades: { en: 'Grades', ru: 'Оценки' },
    contact: { en: 'Contact', ru: 'Контакт' },
    bio: { en: 'Bio', ru: 'О преподавателе' },
    theme: { en: 'Toggle theme', ru: 'Сменить тему' },
    language: { en: 'Language', ru: 'Язык' },
  },

  // Shown on a locale whose page coverage is incomplete (fallback content is visible).
  translationInProgress: {
    en: 'Translation in progress — some text is shown in another language for now.',
    ru: 'Перевод в процессе — часть текста пока показана на другом языке.',
    tt: 'Тәрҗемә бара — кайбер текст хәзергә башка телдә күрсәтелә.',
  },
};
