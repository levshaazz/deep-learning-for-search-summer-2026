#!/usr/bin/env node
/* export-pptx-extract — measure every slide in the browser and dump a layout manifest.
 *
 * WHY A BROWSER: the decks are HTML/CSS with auto-fit transforms, KaTeX math and 80 live
 * SVG widgets. Nothing short of a real layout engine knows where a line of text actually
 * lands. So we open the shipped deck, ask the DOM for the geometry, and write it down in
 * the deck's OWN design space (1920×1080) — the auto-fit scale is divided back out, so the
 * numbers are stable no matter what the viewport did.
 *
 * WHAT COMES OUT: _internal/pptx-export/<deck>/manifest.json + one PNG per figure.
 * Text stays TEXT (with bold/italic runs) so a designer can restyle it; only things that
 * cannot be text — illustrations, widget SVGs, rendered math — become pictures.
 *
 *   node scripts/export-pptx-extract.mjs                 # every deck, RU
 *   node scripts/export-pptx-extract.mjs 13-crucible-of-negatives.html --lang en
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDir, withBrowser, withPage } from '../_audit/lib/gate-harness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECKDIR = join(ROOT, 'Lectures');
const OUTDIR = join(ROOT, '_internal', 'pptx-export');
const VIEW = { width: 1920, height: 1080 };

/* Runs inside the page. Returns one entry per visible block, in the slide's design space.
   The rule for "is this a text block": an element whose children are only inline dressing
   (strong/em/span/sub/sup/code/a/br). Such an element is emitted whole and NOT descended
   into, so a bullet comes out as one string instead of five fragments. */
const EXTRACT = () => {
  // the deck hides non-current slides with aria-hidden / display, exactly as composition-gate reads it
  const slide = [...document.querySelectorAll('section.slide')].find((s) => {
    const cs = getComputedStyle(s);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && s.getAttribute('aria-hidden') !== 'true';
  });
  if (!slide) return null;
  const sr = slide.getBoundingClientRect();
  const scale = sr.width / 1920 || 1;
  const px = (v) => Math.round((v / scale) * 100) / 100;
  const CHROME = ['logo-mark', 'slide__pageno', 'slide__brand', 'slide__logo',
                  'slide__crumb', 'slide__crumb-label'];   // подвал деки: тип слайда + имя курса
  const INLINE = new Set(['STRONG', 'B', 'EM', 'I', 'SPAN', 'SUB', 'SUP', 'CODE', 'A', 'BR', 'SMALL', 'ABBR', 'U', 'MARK']);
  const out = [];

  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: px(r.left - sr.left), y: px(r.top - sr.top), w: px(r.width), h: px(r.height) };
  };
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  // inline runs → [{t, b, i}] so bold survives the trip into PowerPoint
  const runsOf = (el) => {
    const runs = [];
    let prevTop = null;
    const walk = (node, bold, ital) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          const t = n.textContent.replace(/\s+/g, ' ');
          if (t.trim()) { runs.push({ t, b: bold, i: ital }); continue; }
          // Текстовый узел ИЗ ОДНОГО ПРОБЕЛА — не мусор. Между «Домен.</strong> <span>Топ»
          // и вокруг инлайновой формулы пробел живёт именно таким узлом, и выбросив его,
          // мы склеивали слова: «Домен.Топ MTEB», «считай заранееO(N)». В деке этого не
          // видно — там пробел ставит вёрстка; видно только в pptx, у дизайнера.
          if (t && runs.length && !/\s$/.test(runs[runs.length - 1].t)) {
            runs[runs.length - 1].t += ' ';
          }
        } else if (n.nodeType === 1) {
          const cs = getComputedStyle(n);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;   // the other language
          // Inline math: KaTeX paints the formula twice (MathML for screen readers + HTML for
          // sighted users). Reading either as text yields mojibake, so take the TeX source it
          // stores in <annotation> and hand the designer something they can actually re-set.
          if (n.classList?.contains('katex') || n.classList?.contains('katex-display')) {
            const disp = n.classList.contains('katex-display');
            const tex = n.querySelector('annotation[encoding="application/x-tex"]');
            const body = tex ? tex.textContent.trim() : '';
            runs.push({ t: body ? (disp ? '\\[' + body + '\\]' : '\\(' + body + '\\)') : '[формула]',
                        b: bold, i: ital, math: true });
            continue;
          }
          const tag = n.tagName;
          if (tag === 'BR') { runs.push({ t: '\n', b: bold, i: ital }); continue; }
          // Разделитель, которого нет в тексте. В .def-term английская расшифровка лежит в
          // <span class="term-en"> с display:block, и между спанами в HTML НЕТ ни пробела,
          // ни переноса: строки разводит вёрстка. В pptx это давало «считай заранееO(N)».
          //
          // Спрашиваем ГЕОМЕТРИЮ, а не display. Первая редакция смотрела на display:block —
          // и ставила перенос после маркера списка «·», который тоже блочный, но стоит на
          // ОДНОЙ строке с текстом: маркер уезжал на свою строку. Верхняя кромка элемента
          // относительно предыдущего — единственный признак, который не врёт.
          const r0 = n.getBoundingClientRect();
          if (runs.length && prevTop !== null && !/[\s\n]$/.test(runs[runs.length - 1].t)) {
            const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2 || 16;
            runs.push({ t: r0.top - prevTop >= lh * 0.6 ? '\n' : ' ', b: bold, i: ital });
          }
          if (r0.width > 0 || r0.height > 0) prevTop = r0.top;
          const w = cs.fontWeight;
          walk(n, bold || tag === 'STRONG' || tag === 'B' || Number(w) >= 600, ital || tag === 'EM' || tag === 'I' || cs.fontStyle === 'italic');
        }
      }
    };
    walk(el, false, false);
    // The deck glues its bullet glyph to the text ("<span class=obj-check>·</span><span>Толчок…").
    // In HTML that is fine (CSS spaces them); as a plain run it reads "·Толчок". Re-space it.
    for (let i = 0; i < runs.length - 1; i++) {
      const t = runs[i].t.trim();
      if (t.length <= 2 && /^[·•✓✗—→≈*+-]+$/u.test(t) && !/^\s/.test(runs[i + 1].t)) {
        // Пробел СЛЕВА сохраняем. Прежняя редакция писала `t + ' '`, то есть подрезала
        // ран целиком, и текстовый узел « — » между </strong> и следующим спаном терял
        // ведущий пробел: «би-энкодером— две башни». Тире здесь не маркер списка, а часть
        // фразы, и его окружение значимо.
        runs[i].t = (/^\s/.test(runs[i].t) ? ' ' : '') + t + ' ';
      }
    }
    return runs;
  };
  const styleOf = (el) => {
    const cs = getComputedStyle(el);
    const rgb = (cs.color.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    return {
      size: Math.round((parseFloat(cs.fontSize) / scale) * 10) / 10,
      weight: Number(cs.fontWeight) || 400,
      italic: cs.fontStyle === 'italic',
      family: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(),
      color: rgb,
      align: cs.textAlign === 'start' ? 'left' : cs.textAlign,
      upper: cs.textTransform === 'uppercase',
      lh: Math.round((parseFloat(cs.lineHeight) / scale) * 10) / 10 || null,
    };
  };

  /* РОЛЬ БЛОКА — то, ради чего всё затевалось.
     Дизайнеру и наливальщику нужен не класс листового элемента (у <h2> внутри
     .slide-header класса нет вовсе), а СМЫСЛ: заголовок, кикер, тело определения,
     подпись. Роль ищется вверх по предкам до корня слайда: ближайший известный
     маркер выигрывает; если ни одного нет — падаем на тег. Имена ролей — это
     будущие имена плейсхолдеров в .potx, поэтому они стабильны и читаемы. */
  const ROLE_BY_CLASS = {
    'slide-kicker': 'kicker', 'slide-header': 'title', 'slide-sub': 'subtitle',
    'def-tag': 'def-tag', 'def-term': 'def-term', 'def-body': 'def-body', 'def-where': 'def-where',
    'obj-list': 'bullet', 'obj-item': 'bullet',
    'twocol-col': 'column', 'cmp-table': 'table',
    'formula-stage': 'formula', 'var-block': 'var', 'var-symbol': 'var-symbol', 'var-desc': 'var-desc',
    'misc-statement': 'myth', 'misc-truth': 'truth',
    'quiz-q': 'quiz-q', 'quiz-options': 'quiz-option', 'quiz-option': 'quiz-option',
    'ref-authors': 'ref-authors', 'ref-title': 'ref-title', 'ref-venue': 'ref-venue',
    'ref-year': 'ref-year', 'ref-body': 'ref-body',
    'code-block': 'code', 'code-header': 'code-header', 'code-lang': 'code-header',
    'step-caption': 'step-caption', 'step-formula': 'formula', 'step-calc-row': 'step-calc',
    'viz-frame': 'figure-frame', 'fig-fit': 'figure-frame',
    'payoff': 'payoff', 'takeaway': 'payoff',
    'viz-caption': 'caption', 'fig-caption': 'caption', 'divider-num': 'act-number',
    'divider-sub': 'act-sub',
  };
  const ROLE_BY_TAG = { H1: 'title', H2: 'title', H3: 'subtitle', H4: 'subtitle',
                        LI: 'bullet', TD: 'cell', TH: 'cell', FIGCAPTION: 'caption',
                        PRE: 'code', CODE: 'code', BLOCKQUOTE: 'quote', P: 'body' };
  const roleOf = (el) => {
    for (let n = el; n && n !== slide; n = n.parentElement) {
      for (const c of (n.classList || [])) {
        if (ROLE_BY_CLASS[c]) {
          // .slide-header — контейнер: заголовок в нём <h2>, кикер отдельным классом.
          if (ROLE_BY_CLASS[c] === 'title' && n !== el && !/^H[1-4]$/.test(el.tagName)) continue;
          return ROLE_BY_CLASS[c];
        }
      }
    }
    return ROLE_BY_TAG[el.tagName] || 'body';
  };
  // Порядковый номер колонки: две .twocol-col различаются только позицией.
  const columnIndex = (el) => {
    for (let n = el; n && n !== slide; n = n.parentElement) {
      if (n.classList?.contains('twocol-col')) {
        const sibs = [...(n.parentElement?.children || [])].filter((k) => k.classList?.contains('twocol-col'));
        return sibs.indexOf(n);
      }
    }
    return null;
  };

  // clear last slide's tags: figN restarts at 1 per slide, so a stale attribute
  // elsewhere in the document would make the screenshot selector grab the wrong element
  document.querySelectorAll('[data-pptx-fig]').forEach((e) => e.removeAttribute('data-pptx-fig'));
  let figN = 0;
  const walk = (el) => {
    if (!visible(el)) return;
    if (el.classList.contains('slide-notes') || el.classList.contains('step-controls')) return;
    // ХРОМ ДЕКИ — не контент слайда, а мебель мастера. Логотип и номер страницы стоят на
    // КАЖДОМ слайде: вывалив их блоками, мы отдали бы дизайнеру 67 копий его же логотипа
    // отдельными текстовыми рамками, которые он должен был бы удалять руками. В PowerPoint
    // номер страницы — это плейсхолдер мастера, а логотип — украшение мастера; там им и место.
    if (CHROME.some((c) => el.classList.contains(c))) return;

    // things that can never be text
    if (el.tagName === 'IMG') {
      out.push({ kind: 'image', rect: rectOf(el), src: el.getAttribute('src').split('?')[0], alt: el.getAttribute('alt') || '', role: 'image' });
      return;
    }
    // NB: must be the math/graphic ROOT itself. Testing `contains a .katex` would match the
    // slide root (almost every slide has math somewhere) and swallow the whole slide as one picture.
    const tag = String(el.tagName).toLowerCase();
    // ТАБЛИЦА — одним блоком, а не россыпью ячеек. Прежде каждая <td> уезжала отдельной
    // текстовой рамкой: в деке 10 это 170 рамок вместо 8 таблиц, и дизайнер, меняя вид
    // таблицы, правил бы каждую ячейку руками. PowerPoint умеет настоящие таблицы со своим
    // стилем — отдаём структуру, пусть он их и рисует.
    if (tag === 'table') {
      const rows = [...el.querySelectorAll('tr')].map((tr) => ({
        head: !!tr.closest('thead'),
        cells: [...tr.children].map((td) => ({
          runs: runsOf(td),
          head: td.tagName === 'TH',
          span: Number(td.getAttribute('colspan') || 1),
          // .cell-good / .cell-bad несут смысл «хорошо/плохо», а не просто цвет: без пометки
          // дизайнер перекрасит их в фирменный акцент и убьёт различение.
          tone: td.classList.contains('cell-good') ? 'good'
              : td.classList.contains('cell-bad') ? 'bad' : null,
        })),
      })).filter((r) => r.cells.length);
      if (rows.length) { out.push({ kind: 'table', rect: rectOf(el), role: 'table', rows,
                                    style: styleOf(el), col: columnIndex(el) }); return; }
    }
    if (tag === 'svg' || tag === 'canvas') {
      figN += 1;
      el.setAttribute('data-pptx-fig', String(figN));
      // Виджет отдаётся ещё и ИСХОДНЫМ SVG: PowerPoint 2016+ кладёт его нативным
      // вектором (asvg:svgBlip), и дизайнер жмёт «Преобразовать в фигуру». PNG остаётся
      // фолбэком — для Keynote, Google Slides и старых версий.
      const svg = tag === 'svg' ? new XMLSerializer().serializeToString(el) : null;
      out.push({ kind: 'figure', rect: rectOf(el), fig: figN, role: 'figure',
                 tex: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
                 ...(svg && svg.length < 400000 ? { svg } : {}) });
      return;
    }

    const kids = Array.from(el.children);
    // KaTeX wraps display math in a <span class="katex-display">, which is technically inline —
    // without this exclusion the whole .def-term would be emitted as text and the formula would
    // arrive as the mojibake KaTeX leaves in textContent ("wi=ecos⁡(q,di−)/τ…").
    const inlineOnly = kids.length === 0 || kids.every((k) => INLINE.has(k.tagName));
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (inlineOnly) {
      if (text) {
        const runs = runsOf(el);
        // TeX формул — отдельным полем, а не только внутри строки: наливальщику он нужен
        // целым, чтобы превратить формулу в НАСТОЯЩУЮ формулу PowerPoint (OMML), а не в код.
        const tex = runs.filter((r) => r.math).map((r) => r.t.replace(/^\\[([(]/, '').replace(/\\[)\]]$/, ''));
        out.push({ kind: 'text', rect: rectOf(el), runs, style: styleOf(el),
                   cls: el.className || '', role: roleOf(el), col: columnIndex(el),
                   ...(tex.length ? { tex } : {}) });
      }
      return;
    }
    for (const k of kids) walk(k);
  };
  walk(slide);

  const notes = slide.querySelector('.slide-notes');
  return {
    label: slide.getAttribute('data-screen-label') || '',
    type: slide.getAttribute('data-type') || '',
    notes: notes ? (notes.textContent || '').replace(/\s+/g, ' ').trim() : '',
    blocks: out,
  };
};

// Широкий класс: иначе 17 слайдов дек 03/06/07 не попадают в экспорт дизайнеру.
const slideCount = (html) => (html.match(/<section class="(?:[^"]*\s)?slide(?:\s[^"]*)?"/g) || []).length;

// Inline-SVG внутри HTML не обязан нести xmlns — браузер знает контекст. Отдельный файл
// обязан: без объявления пространства имён его не откроет ни PowerPoint, ни Illustrator,
// ни сам браузер. Дописываем, если сериализатор не дописал.
const withSvgNs = (svg) => (/xmlns=/.test(svg)
  ? svg
  : svg.replace(/^<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'));

async function run() {
  const args = process.argv.slice(2);
  const lang = (args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'ru');
  const only = args.find((a) => /\.html$/.test(a));
  const decks = readdirSync(DECKDIR).filter((f) => /^\d.*\.html$/.test(f)).sort()
    .filter((d) => !only || d === only);
  if (!decks.length) { console.error('no decks matched'); process.exit(1); }

  const server = await serveDir(DECKDIR);
  let totalSlides = 0, totalFigs = 0;
  try {
    await withBrowser(async (browser) => {
      for (const deck of decks) {
        const stem = deck.replace('.html', '');
        const dir = join(OUTDIR, stem);
        rmSync(dir, { recursive: true, force: true });
        mkdirSync(join(dir, 'fig'), { recursive: true });
        mkdirSync(join(dir, 'ref'), { recursive: true });
        const n = slideCount(readFileSync(join(DECKDIR, deck), 'utf8'));
        const slides = [];
        await withPage(browser, { viewport: VIEW }, async (page) => {
          await page.goto(server.href(deck), { waitUntil: 'networkidle' });
          await page.evaluate((l) => {
            document.documentElement.dataset.lang = l;
            // deck chrome must not land in the designer's reference renders
            const css = document.createElement('style');
            css.textContent = '.toolbar,.kbd-hint,.step-controls,.preflight-badge{display:none !important}';
            document.head.appendChild(css);
          }, lang);
          await page.waitForTimeout(400);
          for (let i = 1; i <= n; i++) {
            await page.evaluate((k) => { location.hash = '#/' + k; }, i);
            await page.waitForTimeout(200);
            const s = await page.evaluate(EXTRACT);
            if (!s) continue;
            // screenshot every figure the extractor tagged
            for (const b of s.blocks.filter((b) => b.kind === 'figure')) {
              const h = await page.$(`[data-pptx-fig="${b.fig}"]`);
              const stemF = `s${String(i).padStart(3, '0')}-${b.fig}`;
              const file = `fig/${stemF}.png`;
              if (h) {
                try { await h.screenshot({ path: join(dir, file), omitBackground: true }); b.file = file; totalFigs++; }
                catch { /* zero-sized or detached: leave a hole, the builder draws a placeholder */ }
              }
              // Исходный SVG — файлом рядом, не строкой в манифесте: манифест читают глазами,
              // а один виджет — это десятки килобайт разметки.
              if (b.svg) {
                const svgFile = `fig/${stemF}.svg`;
                writeFileSync(join(dir, svgFile), withSvgNs(b.svg));
                b.svgFile = svgFile;
                delete b.svg;
              }
            }
            const ref = `ref/s${String(i).padStart(3, '0')}.png`;
            try { await page.screenshot({ path: join(dir, ref) }); s.ref = ref; } catch { /* keep going */ }
            slides.push({ index: i, ...s });
          }
        });
        totalSlides += slides.length;
        writeFileSync(join(dir, 'manifest.json'),
          JSON.stringify({ deck, lang, design: { w: 1920, h: 1080 }, slides }, null, 1));
        console.log(`  ${stem}: ${slides.length} слайд(ов), ${slides.reduce((a, s) => a + s.blocks.filter((b) => b.kind === 'figure').length, 0)} фигур`);
      }
    });
  } finally { await server.close(); }
  console.log(`[pptx-extract] ${decks.length} дек(ов) · ${totalSlides} слайдов · ${totalFigs} фигур → _internal/pptx-export/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
