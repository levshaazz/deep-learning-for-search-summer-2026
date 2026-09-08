# Stepik release (RU) — export & upload

The Book chapters (`content/book/<stem>/beats/*.js`, RU layer) are the spine of the
Stepik course. This directory holds everything Stepik-specific:

- `export/` — **generated, gitignored** (see `.gitignore`): paste-ready HTML step
  fragments + `manifest.json` (course structure). Regenerate any time with
  `node scripts/stepik-export.mjs`.
- `graders/` — (pre-existing) grading materials.
- this README — the export → upload workflow.

## 1. Export

```bash
node scripts/stepik-export.mjs
```

What it does (see the header of `scripts/stepik-export.mjs` for details):

- reassembles the chapter monoliths from the tracked `beats/` fragments, then reads
  ALL chapters (same auto-discovery as `src/lib/chapters.js`);
- resolves the **RU** layer (fallback ru→en, mirroring `src/i18n/locales.js`);
- converts the beat prose to the Stepik text-step HTML subset
  ([help.stepik.org/article/54794](https://help.stepik.org/article/54794)):
  `**bold**`/`*italic*`/`` `code` ``/links → HTML, `:::calc … :::` → `<blockquote>`;
- rewrites math delimiters for Stepik's MathJax: Book `\( … \)` (inline) → `$$ … $$`
  (Stepik renders `$$…$$` inline), Book `$$ … $$` (display) → `\[ … \]`;
- makes image URLs absolute against `data/course.json` → `meta.siteUrl`
  (GitHub Pages);
- turns each widget (scrolly) beat into an `<iframe>` onto the chromeless embed page
  `{siteUrl}embed/<widget>/?lang=ru` (iframes are allowed in Stepik steps:
  [54795](https://help.stepik.org/article/54795)) + a fallback link + the widget's RU
  step captions as an `<ol>`;
- **groups**: lesson = chapter; step = beat, with consecutive small prose beats merged
  until a step reaches ~800 visible chars (capped at ~4500); every widget beat is its
  own step. Modules (= Stepik sections) are derived from `data/course.json`
  `lectures[].when`: core (L00–L12) / deep-dives (L13–L14) / supplementary (L15–L19).

Output:

```
stepik/export/
  manifest.json          # modules → lessons → steps (RU titles, file paths, sizes)
  l00/step-01.html …     # one HTML fragment per step, paste-ready
  …
  l19/step-NN.html
```

## 2. Embed pages (the widget iframes)

`src/pages/embed/[widget].astro` builds one chromeless page per auto-registered
widget (80 currently): `{siteUrl}embed/<widget>/`. Query params:

- `?lang=ru|en|tt` — UI/caption language (default **ru**; fallback tt→ru→en);
- `?theme=dark|light` — force a theme (default: `prefers-color-scheme`);
- `?data=<key>` — mount on one of the manifest's datasets (the exporter emits this
  when a Book beat uses a non-default dataset, e.g. `rag-pipeline` on `l10-rag`);
- any other param — a label/config override, mirroring the Book's beat-level
  `labels:` (e.g. `?focusStage=chunk`).

The pages ship with the site (`npm run build` → `docs/`), so **deploy the site first**
— the iframes in Stepik point at GitHub Pages.

## 3. Upload via the Stepik API

The exporter deliberately stops at HTML + `manifest.json` — upload is a thin loop any
REST client can do. API root: `https://stepik.org/api/`, OAuth2 app at
`https://stepik.org/oauth2/applications/` (client-credentials flow → Bearer token).

Object model and how `manifest.json` maps onto it:

| manifest.json      | Stepik API object | endpoint                 | notes |
|--------------------|-------------------|--------------------------|-------|
| the course itself  | `course`          | `POST /api/courses` (usually created once in the UI) | note the course `id` |
| `modules[]`        | `section`         | `POST /api/sections` `{section: {course, title, position}}` | `title` = module title (RU) |
| `lessons[]`        | `lesson` + `unit` | `POST /api/lessons` `{lesson: {title}}`, then `POST /api/units` `{unit: {section, lesson, position}}` | a lesson is attached to a section via a **unit** |
| `lessons[].steps[]`| `step-source`     | `POST /api/step-sources` `{stepSource: {lesson, position, block: {name: "text", text: "<contents of step-XX.html>"}}}` | `block.name = "text"`; `text` = the file contents verbatim |

Update flow: `PUT /api/step-sources/{id}` with the same `block` shape re-uploads a
step after re-export (keep a local map file → step-source id).

## 4. Known limitations

- **Mobile app degrades iframes**: the Stepik mobile app may render the widget iframe
  poorly or not at all. Mitigations already baked into the export: every widget step
  carries a fallback browser link + the full RU step narration as an `<ol>`.
  Recommended extra: record a short **GIF/video fallback** of each key widget and add
  it under the iframe for app users (not automated here).
- **iframe height is fixed** (640px) — no cross-origin auto-resize. Tall DOM-flow
  widgets (e.g. `inverted-index`) scroll inside the frame; adjust `height` per step
  by hand if a widget feels cramped.
- **Formulas**: Stepik renders `$$…$$` inline and `\[…\]` display (MathJax). If a
  formula shows raw, check the step was pasted/uploaded as HTML, not plain text.
- **The embed pages live on GitHub Pages** — a site redeploy that breaks
  `{siteUrl}embed/…` breaks every interactive step. The export pins absolute URLs to
  `meta.siteUrl` in `data/course.json`; if the site moves, re-export and re-upload.
- **RU only**: the export takes the RU layer (EN fills gaps). TT is not exported.

## 5. Publication checklist

1. `npm run build` — site builds green, `docs/` contains `embed/<widget>/` pages.
2. Deploy the site (push → Pages workflow) and spot-check 2–3 embed URLs in a
   browser, including one with `?data=`/override params (take them from the export).
3. `node scripts/stepik-export.mjs` — export runs clean over all chapters.
4. Eyeball a few `stepik/export/*/step-*.html` (formulas, images, iframe URLs).
5. Create/refresh the Stepik structure per the mapping above (sections → units →
   step-sources), pasting or API-uploading each `step-XX.html`.
6. In Stepik preview, check: formula rendering, image loading (absolute URLs),
   iframe interactivity, dark theme (`?theme=dark` if you prefer forcing it).
7. Check one lesson in the mobile app — confirm the fallback link + `<ol>` narration
   read fine where the iframe degrades.
