#!/usr/bin/env node
/* =============================================================================
   stepik-export.mjs — Book (RU layer) → Stepik-ready HTML steps.

   The Book chapters (content/book/lN.js, reassembled from beats/ fragments) are
   the spine of the Stepik course: lesson = chapter, step = beat (small adjacent
   prose beats are merged so no step is a two-sentence stub). The RU layer of
   each beat is resolved with the site's fallback chain (ru→en) and translated
   into the Stepik text-step HTML subset:

     · inline markdown (**bold** / *italic* / `code` / [link](url)) → HTML,
       mirroring the Book renderer's inlineMd() (same stash-protect-escape order)
     · KaTeX delimiters → Stepik/MathJax delimiters:
         Book \(…\)  (inline)   →  $$…$$        (Stepik renders $$…$$ INLINE)
         Book $$…$$  (display)  →  \[…\]        (Stepik display math)
         Book \[…\]  (display)  →  \[…\]        (unchanged)
     · :::calc … ::: worked-calculation fences → <blockquote>
     · images → absolute GitHub Pages URLs ({siteUrl}Lectures/assets/img/…)
     · scrolly (widget) beats → an <iframe> onto the chromeless embed page
       ({siteUrl}embed/{widget}/?lang=ru) + a fallback link + the widget's RU
       step captions as an <ol> (so the narration survives when the mobile app
       degrades the iframe).

   OUTPUT (generated, gitignored — see stepik/README.md):
     stepik/export/lNN/step-XX.html   one paste-ready fragment per step
     stepik/export/manifest.json      course structure: modules → lessons → steps

   RUN:  node scripts/stepik-export.mjs
   (reassembles the chapter monoliths first — they are build output.)
   ============================================================================= */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'stepik', 'export');

// ── step sizing (merging small adjacent prose beats) ─────────────────────────
// A Book prose beat is typically 900–2000 visible chars — a comfortable Stepik
// step. Beats below MIN_STEP_CHARS (a heading + a couple of sentences) read as
// stubs on Stepik, so consecutive prose beats are merged until the step reaches
// MIN, capped at MAX so a merged step never becomes a wall. Widget (scrolly)
// beats always get their OWN step: one interactive per step keeps the iframe
// above the fold and the step's purpose obvious.
const MIN_STEP_CHARS = 800;
const MAX_STEP_CHARS = 4500;

// ── i18n resolver (ru→en, mirrors src/i18n/locales.js for the RU release) ────
const tRu = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v.ru != null && v.ru !== '' ? v.ru : (v.en ?? '');
};

// ── inline markdown → Stepik HTML ────────────────────────────────────────────
// Mirrors the Book renderer's inlineMd() (src/pages/[lang]/book/[id].astro):
// (a) stash math + code spans so escaping never touches them (math delimiters
//     are REWRITTEN to Stepik's here), (b) HTML-escape the author text,
// (c) **bold** before *italic*, then [text](url) links, (d) restore stashes.
const SENT_L = String.fromCharCode(0xe000), SENT_R = String.fromCharCode(0xe001);
const escAll = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escMath = escAll; // keep \ and $, escape only <>& (MathJax reads textContent)
const escAttr = (s) => escAll(String(s)).replace(/"/g, '&quot;');

function mdToStepik(s) {
  if (s == null) return { html: '', calc: false };
  if (typeof s !== 'string') s = String(s);
  let calc = false;
  const cm = s.match(/^\s*:::calc\s+([\s\S]+?)\s*:::\s*$/);
  if (cm) { s = cm[1]; calc = true; }

  const stash = [];
  const hold = (html) => { stash.push(html); return SENT_L + (stash.length - 1) + SENT_R; };

  // (a) math first (display before inline), delimiters rewritten for Stepik; then code spans.
  let h = s
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => hold('\\[' + escMath(m) + '\\]'))   // display
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => hold('\\[' + escMath(m) + '\\]'))   // display
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => hold('$$' + escMath(m) + '$$'))     // inline
    .replace(/`([^`]+)`/g, (_, m) => hold('<code>' + escAll(m) + '</code>'));

  // (b) escape the remaining author text.
  h = escAll(h);

  // (c) bold BEFORE italic (a `*` inside `**…**` is left for the italic pass), then links.
  // The closing `**` must not split a `***` (bold ending in italic, e.g. `**a *b***`):
  // (?!\*) pushes the boundary right so the inner `*b*` stays intact for the italic pass —
  // otherwise the two passes emit crossed nesting (<strong>…<em>…</strong></em>).
  h = h.replace(/\*\*([\s\S]+?)\*\*(?!\*)/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  h = h.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, '<a href="$2">$1</a>');

  // (d) restore.
  h = h.replace(new RegExp(SENT_L + '(\\d+)' + SENT_R, 'g'), (_, i) => stash[Number(i)]);
  return { html: h, calc };
}
const mdP = (s) => {
  const { html, calc } = mdToStepik(s);
  return calc ? `<blockquote><p>${html}</p></blockquote>` : `<p>${html}</p>`;
};
const mdInline = (s) => mdToStepik(s).html;
const plainLen = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;

// ── load sources ─────────────────────────────────────────────────────────────
// Chapter monoliths are BUILD OUTPUT — reassemble from the tracked beats/ first.
console.log('assembling chapters from beats/ fragments …');
execFileSync(process.execPath, [join(ROOT, 'scripts', 'assemble-chapter.mjs'), 'build'], { stdio: 'inherit' });

const course = JSON.parse(readFileSync(join(ROOT, 'data', 'course.json'), 'utf8'));
const siteUrl = course.meta.siteUrl.endsWith('/') ? course.meta.siteUrl : course.meta.siteUrl + '/';

// widgets/*/manifest.json + i18n.json (fs analog of src/lib/widgets.js — no Vite here)
const WIDGETS = {};
for (const dir of readdirSync(join(ROOT, 'widgets'), { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const mPath = join(ROOT, 'widgets', dir.name, 'manifest.json');
  if (!existsSync(mPath)) continue;
  const manifest = JSON.parse(readFileSync(mPath, 'utf8'));
  const iPath = join(ROOT, 'widgets', dir.name, 'i18n.json');
  const i18n = existsSync(iPath) ? JSON.parse(readFileSync(iPath, 'utf8')) : {};
  WIDGETS[manifest.id || dir.name] = { manifest, i18n };
}

// chapters (auto-discovered like src/lib/chapters.js, but via fs + dynamic import)
const chapterFiles = readdirSync(join(ROOT, 'content', 'book'))
  .filter((f) => /^l\d+\.js$/.test(f));
const chapters = [];
for (const f of chapterFiles) {
  const mod = await import(pathToFileURL(join(ROOT, 'content', 'book', f)).href);
  chapters.push(mod.default);
}
chapters.sort((a, b) => String(a.id).localeCompare(String(b.id)));

// ── beat → HTML block ────────────────────────────────────────────────────────
function proseBeatHtml(b) {
  const parts = [];
  if (b.heading) parts.push(`<h2>${mdInline(tRu(b.heading))}</h2>`);
  if (b.img) {
    // The deployed site ships WebP only: scripts/optimize-images.mjs converts every
    // assets/img PNG → .webp in docs/ and DELETES the .png, so the absolute URL must
    // point at the .webp or it 404s on GitHub Pages.
    const src = siteUrl + 'Lectures/assets/img/' + b.img.replace(/\.png$/, '.webp');
    const alt = tRu(b.imgAlt) || tRu(b.imgCaption) || '';
    parts.push(`<p><img src="${escAttr(src)}" alt="${escAttr(alt)}" width="100%"></p>`);
    if (b.imgCaption) parts.push(`<p><em>${mdInline(tRu(b.imgCaption))}</em></p>`);
  }
  const body = tRu(b.body);
  for (const p of Array.isArray(body) ? body : [body]) parts.push(mdP(p));
  return parts.join('\n');
}

function scrollyBeatHtml(b) {
  const w = WIDGETS[b.widget];
  if (!w) throw new Error(`beat ${b.id}: unknown widget '${b.widget}'`);
  const title = tRu(w.manifest.title) || b.widget;
  // Reproduce the Book beat's exact mount in the iframe: ?data= when the beat uses a
  // non-default dataset, plus any beat-level label/config overrides (e.g. focusStage=chunk).
  const q = new URLSearchParams({ lang: 'ru' });
  if (b.data && (w.manifest.data || [])[0] !== b.data) q.set('data', b.data);
  for (const [k, v] of Object.entries(b.labels || {}))
    if (typeof v === 'string' || typeof v === 'number') q.set(k, String(v));
  const embed = `${siteUrl}embed/${b.widget}/?${q.toString()}`;
  // RU step captions (beat-level label overrides win, as in the Book renderer) —
  // the narration that survives when the mobile app degrades the iframe.
  const labels = {};
  for (const [k, v] of Object.entries(w.i18n)) labels[k] = tRu(v);
  Object.assign(labels, b.labels || {});
  const steps = (w.manifest.steps || [])
    .map((s) => labels[s.labelKey])
    .filter((x) => x && String(x).trim());
  const parts = [];
  parts.push(`<h2>Интерактив: ${mdInline(title)}</h2>`);
  parts.push(`<iframe src="${escAttr(embed)}" width="100%" height="640" frameborder="0" allowfullscreen></iframe>`);
  parts.push(`<p><em>Если интерактив не отображается (например, в мобильном приложении) — <a href="${escAttr(embed)}">откройте его в браузере</a>.</em></p>`);
  if (steps.length) {
    parts.push('<p>Пройдите шаги виджета (кнопка ▶ или стрелки):</p>');
    parts.push('<ol>\n' + steps.map((s) => `<li>${mdInline(s)}</li>`).join('\n') + '\n</ol>');
  }
  return { html: parts.join('\n'), title: `Интерактив: ${title}` };
}

// ── chapter → steps (merge small adjacent prose beats; scrolly = own step) ───
function chapterSteps(ch) {
  const steps = [];
  let cur = null; // { html: [], beats: [], title, chars }
  const flush = () => { if (cur) { steps.push(cur); cur = null; } };

  for (const b of ch.beats) {
    if (b.kind === 'scrolly') {
      flush();
      const { html, title } = scrollyBeatHtml(b);
      steps.push({ html: [html], beats: [b.id], title, chars: plainLen(html), widgets: [b.widget] });
      continue;
    }
    if (b.kind !== 'prose') { console.warn(`  ! skipping beat ${b.id} (unknown kind '${b.kind}')`); continue; }
    const html = proseBeatHtml(b);
    const len = plainLen(html);
    const heading = b.heading ? tRu(b.heading) : null;
    if (cur && cur.chars < MIN_STEP_CHARS && cur.chars + len <= MAX_STEP_CHARS) {
      cur.html.push(html); cur.beats.push(b.id); cur.chars += len;
      if (!cur.title && heading) cur.title = heading;
    } else {
      flush();
      cur = { html: [html], beats: [b.id], title: heading, chars: len, widgets: [] };
    }
  }
  flush();
  steps.forEach((s, i) => { if (!s.title) s.title = `${ch.catchphrase} — часть ${i + 1}`; });
  return steps;
}

// ── write export ─────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const lecById = Object.fromEntries(course.lectures.map((l) => [l.id, l]));
const lessons = [];
for (const ch of chapters) {
  const lec = lecById[ch.id];
  const dir = `l${ch.id}`;
  mkdirSync(join(OUT, dir), { recursive: true });
  const steps = chapterSteps(ch);
  const stepEntries = steps.map((s, i) => {
    const file = `step-${String(i + 1).padStart(2, '0')}.html`;
    writeFileSync(join(OUT, dir, file), s.html.join('\n\n') + '\n');
    return {
      file: `${dir}/${file}`,
      title: s.title,
      block: 'text',            // Stepik step block type (steps API: block.name = "text")
      beats: s.beats,
      chars: s.chars,
      ...(s.widgets && s.widgets.length ? { widgets: s.widgets } : {}),
    };
  });
  lessons.push({
    id: ch.id,
    dir,
    title: `L${lec ? lec.number : Number(ch.id)} · ${lec ? tRu(lec.title) : ch.catchphrase}`,
    catchphrase: ch.catchphrase,
    spine: lec ? lec.spine : undefined,
    steps: stepEntries,
  });
  const nWidget = stepEntries.filter((s) => s.widgets).length;
  console.log(`  ${dir}: ${ch.beats.length} beats → ${stepEntries.length} steps (${nWidget} interactive)`);
}

// Modules (Stepik "sections"): derived from course.json lectures[].when — the
// catalog already partitions itself into the core course (Mission briefing +
// Week N), the deep-dives, and the supplementary lectures. Grouping is by
// consecutive runs, so a future re-partition in course.json flows through.
const phaseOf = (lec) => {
  const w = lec && lec.when && lec.when.en ? lec.when.en : '';
  if (/^Deep-dive/.test(w)) return 'deep-dive';
  if (/^Supplementary/.test(w)) return 'supplementary';
  return 'core';
};
const MODULE_TITLE = {
  core: { ru: 'Основной курс', en: 'Core course' },
  'deep-dive': { ru: 'Глубокие погружения', en: 'Deep-dives' },
  supplementary: { ru: 'Дополнительные лекции', en: 'Supplementary lectures' },
};
const modules = [];
for (const les of lessons) {
  const phase = phaseOf(lecById[les.id]);
  const last = modules[modules.length - 1];
  if (last && last.phase === phase) last.lessons.push(les.id);
  else modules.push({ phase, title: MODULE_TITLE[phase].ru, lessons: [les.id] });
}

const manifest = {
  _doc: 'Stepik course structure generated by scripts/stepik-export.mjs. modules → Stepik sections, lessons → Stepik lessons (one per Book chapter), steps → Stepik text steps (files are paste-ready HTML fragments). See stepik/README.md for the upload workflow.',
  generatedAt: new Date().toISOString(),
  siteUrl,
  course: { code: course.meta.code, title: tRu(course.meta.title), tagline: tRu(course.meta.tagline) },
  modules,
  lessons,
};
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const nSteps = lessons.reduce((a, l) => a + l.steps.length, 0);
console.log(`\nexport: ${lessons.length} lessons, ${nSteps} steps → ${OUT}`);
