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
    const walk = (node, bold, ital) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          const t = n.textContent.replace(/\s+/g, ' ');
          if (t.trim()) runs.push({ t, b: bold, i: ital });
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
        runs[i].t = t + ' ';
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

  // clear last slide's tags: figN restarts at 1 per slide, so a stale attribute
  // elsewhere in the document would make the screenshot selector grab the wrong element
  document.querySelectorAll('[data-pptx-fig]').forEach((e) => e.removeAttribute('data-pptx-fig'));
  let figN = 0;
  const walk = (el) => {
    if (!visible(el)) return;
    if (el.classList.contains('slide-notes') || el.classList.contains('step-controls')) return;

    // things that can never be text
    if (el.tagName === 'IMG') {
      out.push({ kind: 'image', rect: rectOf(el), src: el.getAttribute('src').split('?')[0], alt: el.getAttribute('alt') || '' });
      return;
    }
    // NB: must be the math/graphic ROOT itself. Testing `contains a .katex` would match the
    // slide root (almost every slide has math somewhere) and swallow the whole slide as one picture.
    const tag = String(el.tagName).toLowerCase();
    if (tag === 'svg' || tag === 'canvas') {
      figN += 1;
      el.setAttribute('data-pptx-fig', String(figN));
      out.push({ kind: 'figure', rect: rectOf(el), fig: figN, tex: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300) });
      return;
    }

    const kids = Array.from(el.children);
    // KaTeX wraps display math in a <span class="katex-display">, which is technically inline —
    // without this exclusion the whole .def-term would be emitted as text and the formula would
    // arrive as the mojibake KaTeX leaves in textContent ("wi=ecos⁡(q,di−)/τ…").
    const inlineOnly = kids.length === 0 || kids.every((k) => INLINE.has(k.tagName));
    const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    if (inlineOnly) {
      if (text) out.push({ kind: 'text', rect: rectOf(el), runs: runsOf(el), style: styleOf(el), cls: el.className || '' });
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

const slideCount = (html) => (html.match(/<section class="slide"/g) || []).length;

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
              const file = `fig/s${String(i).padStart(3, '0')}-${b.fig}.png`;
              if (h) {
                try { await h.screenshot({ path: join(dir, file), omitBackground: true }); b.file = file; totalFigs++; }
                catch { /* zero-sized or detached: leave a hole, the builder draws a placeholder */ }
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
