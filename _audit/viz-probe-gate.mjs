/* viz-probe-gate.mjs — G13 DYNAMIC-ILLUSTRATION gate.
   Forensic measurement of the PUBLISHED docs/ decks, promoted from the AUDIT-3 probe. It drives EVERY
   step of EVERY slide via the deck's #/N/k deep-link engine (so archflow/divider/widget slides are
   exercised, not just step-0), at native 1920×1080 in BOTH EN and RU, and classifies:
     HARD — a defect that loses or breaks content: a COLLAPSED figure image (rendered <40px), a BROKEN
            image (naturalWidth 0 / failed WebP), an element OFF the 1920×1080 slide, or BILINGUAL
            DOUBLING (both lang twins visible). These are 0 on a healthy deck; any >0 fails the build.
     WARN — visible-but-not-content-losing: text OVERLAP (≥30% box cover) or sub-16px text. Dense
            real-data figures can carry justified partial crowding, so these inform without blocking.
   WHY: slide-viz checks OOB/garbled/oversize at step 0; this caught what it missed — the L8 RU divider
   collapsing to 16px and the L11 climb-widget overflow (both step- and image-specific). Read-only.

   Usage:  node viz-probe-gate.mjs            (working-directory _audit; needs ../docs built)
           node viz-probe-gate.mjs --selftest (pure classifier on planted records — must FIRE on each) */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));   // _audit/ → repo root
const DOCS_LECT = join(ROOT, 'docs', 'Lectures');
const TINY_PX = 16, OVERLAP_FRAC = 0.30, OFF_PAD = 2, IMG_MIN = 40;

// ── pure classifier: a measured slide record → { hard:[...], warn:[...] } (shared by run + selftest) ──
export function classify(rec) {
  const where = `${rec.deck || ''} s${rec.slide}/${rec.label || ''} [${rec.lang} step${rec.step}/${rec.maxStep}]`;
  const hard = [], warn = [];
  for (const c of (rec.imgs?.collapsed || [])) hard.push(`${where}: COLLAPSED figure ${c.src} (${c.h}px)`);
  for (const b of (rec.imgs?.broken || [])) hard.push(`${where}: BROKEN image ${b}`);
  for (const o of (rec.offSlide || [])) hard.push(`${where}: OFF-SLIDE ${JSON.stringify(o.t)} by ${o.over}px`);
  if (rec.doubled) hard.push(`${where}: BILINGUAL DOUBLING ×${rec.doubled}`);
  for (const o of (rec.overlaps || [])) warn.push(`${where}: overlap ${JSON.stringify(o.a)}~${JSON.stringify(o.b)} ${o.frac}`);
  if ((rec.tinyText || []).length) warn.push(`${where}: ${rec.tinyText.length} sub-${TINY_PX}px text (min ${rec.minTextPx})`);
  return { hard, warn };
}

function measure({ TINY_PX, OVERLAP_FRAC, OFF_PAD, IMG_MIN }) {
  const slide = document.querySelector('.slide.is-active');
  if (!slide) return null;
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    if (el.closest('.is-hidden,.is-step-hidden')) return false;
    const b = el.getBoundingClientRect();
    return b.width > 1 && b.height > 1;
  };
  const texts = [...slide.querySelectorAll('text, .viz-caption, .matrix-label, .arch-name, .arch-shape, .step-caption')]
    .filter(vis).map(el => { const b = el.getBoundingClientRect();
      return { t: (el.textContent || '').trim().slice(0, 32), x: b.left, y: b.top, w: b.width, h: b.height }; })
    .filter(o => o.t.length > 0);
  const minTextPx = texts.length ? Math.min(...texts.map(o => o.h)) : null;
  const tinyText = texts.filter(o => o.h < TINY_PX).map(o => ({ t: o.t, px: +o.h.toFixed(1) })).slice(0, 12);
  const overlaps = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], c = texts[j];
    const ix = Math.max(0, Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x));
    const iy = Math.max(0, Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y));
    const inter = ix * iy; if (inter <= 0) continue;
    const frac = inter / Math.min(a.w * a.h, c.w * c.h);
    if (frac >= OVERLAP_FRAC) overlaps.push({ a: a.t, b: c.t, frac: +frac.toFixed(2) });
  }
  const sb = slide.getBoundingClientRect();
  const offSlide = [];
  [...slide.querySelectorAll('text, rect, image, img, foreignObject, .viz-caption')].filter(vis).forEach(el => {
    const b = el.getBoundingClientRect();
    const over = Math.max(sb.left - b.left, b.right - sb.right, sb.top - b.top, b.bottom - sb.bottom);
    if (over > OFF_PAD) offSlide.push({ t: (el.textContent || el.tagName).trim().slice(0, 24), over: +over.toFixed(0) });
  });
  const imgEls = [...slide.querySelectorAll('img, image')];
  const broken = [], collapsed = [];
  imgEls.forEach(im => {
    const b = im.getBoundingClientRect();
    const src = (im.currentSrc || im.getAttribute('href') || im.src || '').split('/').pop();
    if (im.tagName === 'IMG' && im.complete && im.naturalWidth === 0) broken.push(src);
    else if (vis(im) && b.height < IMG_MIN && /assets\/img|\.webp|\.png/.test(im.outerHTML)) collapsed.push({ src, h: +b.height.toFixed(0) });
  });
  let doubled = 0;
  slide.querySelectorAll('[lang="en"]').forEach(en => {
    const ru = en.parentElement && en.parentElement.querySelector(':scope > [lang="ru"]');
    if (ru && vis(en) && vis(ru)) doubled++;
  });
  return { minTextPx: minTextPx == null ? null : +minTextPx.toFixed(1), tinyText,
           overlaps: overlaps.slice(0, 20), offSlide: offSlide.slice(0, 12),
           imgs: { total: imgEls.length, broken, collapsed }, doubled };
}

async function run() {
  const decks = readdirSync(DOCS_LECT).filter(f => /^\d\d-.*\.html$/.test(f)).map(f => f.replace(/\.html$/, ''));
  const records = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => errors.push('PAGEERR ' + String(e).slice(0, 120)));
  for (const deck of decks) {
    const file = join(DOCS_LECT, deck + '.html');
    if (!existsSync(file)) continue;
    await page.goto('file://' + file, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const meta = await page.evaluate(() => [...document.querySelectorAll('.slide')].map(s => ({
      label: s.getAttribute('data-screen-label') || '', type: s.getAttribute('data-type') || '',
      max: parseInt(s.getAttribute('data-max-step') || '0', 10) })));
    for (const lang of ['en', 'ru']) {
      await page.evaluate(l => document.documentElement.setAttribute('data-lang', l), lang);
      for (let i = 0; i < meta.length; i++) {
        const M = meta[i].max || 0;
        for (let k = 0; k <= M; k++) {
          errors.length = 0;
          await page.evaluate(([idx, step]) => { location.hash = `#/${idx + 1}/${step}`; }, [i, k]);
          await page.waitForTimeout(M > 0 ? 110 : 90);
          const m = await page.evaluate(measure, { TINY_PX, OVERLAP_FRAC, OFF_PAD, IMG_MIN });
          if (!m) continue;
          records.push({ deck, slide: i, step: k, maxStep: M, lang, label: meta[i].label, type: meta[i].type, ...m });
        }
      }
    }
  }
  await browser.close();
  return records;
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest();
  if (!existsSync(DOCS_LECT)) { console.log('[viz-probe-gate] docs/ not built — run `npm run build` first. SKIPPED.'); return; }
  const records = await run();
  let hard = [], warn = [];
  for (const rec of records) { const c = classify(rec); hard.push(...c.hard); warn.push(...c.warn); }
  for (const h of hard) console.log('  ✗ [HARD] ' + h);
  for (const w of warn.slice(0, 40)) console.log('  ! [WARN] ' + w);
  console.log(`\n[viz-probe-gate] scanned ${records.length} slide-states across all decks (EN+RU, every step)`);
  console.log(`[viz-probe-gate] HARD(collapsed/broken/off-slide/doubling)=${hard.length}  WARN(overlap/tiny-text)=${warn.length}`);
  if (hard.length) process.exit(1);
}

function selftest() {
  const fixtures = [
    { name: 'collapsed image', rec: { lang: 'ru', slide: 1, step: 0, maxStep: 0, imgs: { collapsed: [{ src: 'x.webp', h: 16 }] } }, mustHard: true },
    { name: 'broken image', rec: { lang: 'en', slide: 2, step: 0, maxStep: 0, imgs: { broken: ['y.webp'] } }, mustHard: true },
    { name: 'off-slide', rec: { lang: 'en', slide: 3, step: 0, maxStep: 0, offSlide: [{ t: 'z', over: 40 }] }, mustHard: true },
    { name: 'bilingual doubling', rec: { lang: 'en', slide: 4, step: 0, maxStep: 0, doubled: 2 }, mustHard: true },
    { name: 'overlap (warn only)', rec: { lang: 'en', slide: 5, step: 0, maxStep: 0, overlaps: [{ a: 'p', b: 'q', frac: 0.6 }] }, mustHard: false, mustWarn: true },
    { name: 'clean slide', rec: { lang: 'en', slide: 6, step: 0, maxStep: 0, imgs: {} }, mustHard: false, mustWarn: false },
  ];
  let ok = true;
  for (const f of fixtures) {
    const c = classify(f.rec);
    const hard = c.hard.length > 0, warn = c.warn.length > 0;
    const pass = (hard === !!f.mustHard) && (f.mustWarn == null || warn === !!f.mustWarn);
    console.log(`  ${pass ? '✓' : '✗'} ${f.name}: HARD=${hard} WARN=${warn}`);
    if (!pass) ok = false;
  }
  if (!ok) { console.log('[viz-probe-gate] SELFTEST FAILED'); process.exit(1); }
  console.log('[viz-probe-gate] selftest PASS — classifier fires on collapsed/broken/off-slide/doubling, warns on overlap, silent on clean');
}

main().catch((e) => { console.error(e); process.exit(1); });
