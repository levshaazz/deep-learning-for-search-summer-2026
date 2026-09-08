// locales.js — the trilingual core: locale list, fallback chain, resolver, base-aware paths.
// EN canonical · RU translation · TT (Tatar Cyrillic) translation with fallback tt -> ru -> en.
// (Tatar Latin script is a per-page sub-switch handled later; Phase 1 ships Cyrillic + fallback.)

export const LOCALES = ['en', 'ru', 'tt'];
export const DEFAULT_LOCALE = 'en';

export const LOCALE_LABEL = { en: 'EN', ru: 'RU', tt: 'TT' };
export const LOCALE_NAME = { en: 'English', ru: 'Русский', tt: 'Татарча' };
export const HTML_LANG = { en: 'en', ru: 'ru', tt: 'tt' };

// Per-locale fallback order. The resolver walks this until it finds a string.
const FALLBACK = {
  en: ['en'],
  ru: ['ru', 'en'],
  tt: ['tt', 'ru', 'en'], // SITE_ARCHITECTURE §5.3
};

/**
 * Resolve an i18n value for a locale.
 * @param {string|object} value  a plain string (locale-agnostic) or { en, ru, tt }
 * @param {string} lang          target locale
 * @returns {string}
 */
export function t(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  for (const l of FALLBACK[lang] || FALLBACK[DEFAULT_LOCALE]) {
    if (value[l] != null && value[l] !== '') return value[l];
  }
  return value.en ?? '';
}

/** True when `value` actually has a string for `lang` (no fallback used). */
export function hasTranslation(value, lang) {
  if (value == null) return false;
  if (typeof value === 'string') return true;
  return value[lang] != null && value[lang] !== '';
}

// ── base-aware path helpers (project Pages live under /<repo>/) ──────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ''); // e.g. "/deep-learning-for-search-summer-2026"

/** Prefix a root-absolute path with the deploy base. withBase('/x') -> '/<base>/x'. */
export function withBase(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

/** Localized page path. localizedPath('ru','syllabus') -> '/<base>/ru/syllabus'. */
export function localizedPath(lang, page = '') {
  const clean = page.replace(/^\/|\/$/g, '');
  return withBase(`/${lang}${clean ? '/' + clean : '/'}`);
}
