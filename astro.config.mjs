// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages project site: https://levshaazz.github.io/deep-learning-for-search-summer-2026/
// `site` = origin, `base` = repo subpath. Build output → docs/ (Pages publishes docs/).
export default defineConfig({
  site: 'https://levshaazz.github.io',
  base: '/deep-learning-for-search-summer-2026',
  trailingSlash: 'ignore',
  outDir: './docs',
  build: { format: 'directory' },
  // i18n routing is handled explicitly via the [lang] dynamic segment + getStaticPaths
  // (see src/i18n/locales.js); kept manual for full control over the EN/RU/TT fallback chain.
});
