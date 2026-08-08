// toolkit.js — the per-lecture "toolkit": ONE place, in each Book chapter's footer, that gathers
// everything on a lecture's topic — its slide deck, the interactive Playground figures that belong
// to it, the week's assignment, and the Papers-page sections for its research area(s).
//
// Almost entirely DERIVED (deck from course.json, figures from the Playground widget registry, area
// labels from papers.js) + two tiny hand-maps (which of the 6 assignments a chapter carries, and
// which paper areas it touches). NON-GATED: no data/ facts, no i18n registration — edit freely.
import { course } from './course.js';
import { buildDemos } from './playground.js';
import { assignments } from './assignments.js';
import { AREA_LABELS } from './papers.js';

// Playground figures are grouped by the `l<N>-` prefix of their data file (see playground.js).
// Compute once at module load — buildDemos() walks the whole widget registry.
const ALL_DEMOS = buildDemos();

// Each of the 6 assignments belongs to exactly ONE lecture, matched by its content (BM25 → L03,
// ranking metrics → L04, the neural cascade → L07, hybrid+LTR → L08, ANN → L09, RAG → L10). Only
// these chapters show an assignment row; every other chapter omits it.
const CHAPTER_ASSIGNMENT = {
  '03': 'lab-bm25',
  '04': 'hw-ranking-metrics',
  '07': 'lab-cascade',
  '08': 'hw-alliance',
  '09': 'lab-ann',
  '10': 'hw-rag',
};

// Chapter → the Papers-page area section(s) most relevant to it (papers.json `area` keys; the
// section anchors are /papers#<area>). A chapter with no strong area match omits the row.
const CHAPTER_AREAS = {
  '01': ['system-design', 'classical-ir'],
  '02': ['nlp-embeddings'],
  '03': ['classical-ir'],
  '04': ['eval'],
  '05': ['nlp-embeddings'],
  '06': ['nlp-embeddings', 'neural-ranking'],
  '07': ['neural-ranking'],
  '08': ['neural-ranking'],
  '09': ['ann'],
  '10': ['rag'],
  '11': ['rag', 'eval'],
  '12': ['rag', 'nlp-embeddings'],
  '13': ['neural-ranking'],
  '14': ['rag'],
  '15': ['nlp-embeddings'],
  '16': ['rag'],
  '17': ['nlp-embeddings'],
  '18': ['nlp-embeddings'],
};

const areaLabel = (area) => AREA_LABELS[area]?.title || { en: area, ru: area, tt: area };

// Gather the toolkit for one chapter id ('00'..'18'). Every field may be empty; the page renders
// only the rows that have content, and skips the whole panel if all are empty.
export function toolkitFor(chapterId) {
  const lec = course.lectures.find((l) => l.id === chapterId) || null;
  const figures = ALL_DEMOS.filter((d) => d.lecture === chapterId);
  const assignment = assignments.find((a) => a.slug === CHAPTER_ASSIGNMENT[chapterId]) || null;
  const areas = (CHAPTER_AREAS[chapterId] || []).map((area) => ({ area, label: areaLabel(area) }));
  return { lec, figures, assignment, areas };
}

// UI strings for the panel — trilingual, kept here with the feature (non-gated, like the *Meta.ui
// pattern used by gallery/papers).
export const TOOLKIT_UI = {
  heading: { en: 'Lecture toolkit', ru: 'Набор лекции', tt: 'Лекция җыелмасы' },
  sub: {
    en: 'Everything on this topic in one place',
    ru: 'Всё по этой теме — в одном месте',
    tt: 'Бу тема буенча барысы — бер урында',
  },
  slides: { en: 'Slides', ru: 'Слайды', tt: 'Слайдлар' },
  openSlides: { en: 'Open the deck', ru: 'Открыть слайды', tt: 'Слайдларны ач' },
  figures: { en: 'Interactive figures', ru: 'Интерактивные демо', tt: 'Интерактив фигуралар' },
  assignment: { en: 'Assignment', ru: 'Задание', tt: 'Эш' },
  papers: { en: 'Papers', ru: 'Статьи', tt: 'Мәкаләләр' },
};
