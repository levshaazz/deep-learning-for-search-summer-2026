/* viz-probe-gate.mjs — G13 DYNAMIC-ILLUSTRATION gate.
   Forensic measurement of the PUBLISHED docs/ decks, promoted from the AUDIT-3 probe. It drives EVERY
   step of EVERY slide via the deck's #/N/k deep-link engine (so archflow/divider/widget slides are
   exercised, not just step-0), at native 1920×1080 in BOTH EN and RU, and classifies:
     HARD — a defect that loses or breaks content: a COLLAPSED figure image (rendered <40px), a BROKEN
            image (naturalWidth 0 / failed WebP), an element OFF the 1920×1080 slide, BILINGUAL
            DOUBLING (both lang twins visible), or a SEVERE label OVERLAP (≥50% box cover — a
            collision, not crowding). These are 0 on a healthy deck; any >0 fails the build.
     WARN — visible-but-not-content-losing: MILD text overlap (30–50% box cover) or sub-16px text.
            Dense real-data figures can carry justified partial crowding, so these inform without blocking.
   WHY: slide-viz checks OOB/garbled/oversize at step 0; this caught what it missed — the L8 RU divider
   collapsing to 16px and the L11 climb-widget overflow (both step- and image-specific). Read-only.

   Usage:  node viz-probe-gate.mjs            (working-directory _audit; needs ../docs built)
           node viz-probe-gate.mjs --selftest (pure classifier on planted records — must FIRE on each) */
import { chromium } from 'playwright';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));   // _audit/ → repo root
const DOCS_LECT = join(ROOT, 'docs', 'Lectures');
const TINY_REL = '_audit/baselines/viz-tiny-text.json';
const TINY_BASE = join(ROOT, '_audit', 'baselines', 'viz-tiny-text.json');
const TINY_META = {
  gate: 'viz-probe (G13) — tiny-text ratchet',
  note: 'Per figure (deck#screen-label): the worst count of sub-16px text nodes seen across '
      + 'languages and steps. Anything NEW or WORSE than this HARD-fails; the frozen counts stay '
      + 'WARN until they are fixed and the entry is deleted. Re-freeze with --update-tiny-baseline '
      + 'ONLY to record a reduction — raising a number here is how the debt would grow back.',
  platform: process.platform,   // sub-pixel text metrics are per-platform; see the `tol` note in classify()
};
function loadTinyBaseline() {
  if (!existsSync(TINY_BASE)) return null;
  try { return JSON.parse(readFileSync(TINY_BASE, 'utf8')); } catch { return null; }
}

const TINY_PX = 16, OVERLAP_FRAC = 0.30, HARD_OVERLAP_FRAC = 0.50, OFF_PAD = 2, IMG_MIN = 40;
// overlap severity split: a SEVERE box cover (>= HARD_OVERLAP_FRAC) is a real label COLLISION
// (illegible — the "наложение" defect) and HARD-fails; mild crowding (OVERLAP_FRAC..HARD) stays
// WARN, since dense real-data figures can carry justified partial overlap. Both were WARN before.

// ── pure classifier: a measured slide record → { hard:[...], warn:[...] } (shared by run + selftest) ──
export function classify(rec) {
  const where = `${rec.deck || ''} s${rec.slide}/${rec.label || ''} [${rec.lang} step${rec.step}/${rec.maxStep}]`;
  const hard = [], warn = [];
  for (const c of (rec.imgs?.collapsed || [])) hard.push(`${where}: COLLAPSED figure ${c.src} (${c.h}px)`);
  for (const b of (rec.imgs?.broken || [])) hard.push(`${where}: BROKEN image ${b}`);
  for (const o of (rec.offSlide || [])) hard.push(`${where}: OFF-SLIDE ${JSON.stringify(o.t)} by ${o.over}px`);
  if (rec.doubled) hard.push(`${where}: BILINGUAL DOUBLING ×${rec.doubled}`);
  for (const o of (rec.overlaps || [])) {
    const msg = `${where}: overlap ${JSON.stringify(o.a)}~${JSON.stringify(o.b)} ${o.frac}`;
    if (o.frac >= HARD_OVERLAP_FRAC) hard.push(msg + ` (SEVERE ≥${HARD_OVERLAP_FRAC} — labels collide)`);
    else warn.push(msg);
  }
  /* Sub-16px labels INSIDE figures. readability-gate (G20) guards the raw authored font of prose
     and deliberately does not look here — figures fit-scale by design — so for a long time nobody
     gated this at all, and 244 such labels accumulated across 40 figure-states. They are now
     ratcheted: whatever the frozen baseline already carries stays a WARN, anything NEW or WORSE
     is HARD. `tinyBase` is injected by the runner (see loadTinyBaseline); with no baseline the
     check stays a pure WARN, exactly as before. */
  const tiny = (rec.tinyText || []).length;
  if (tiny) {
    const msg = `${where}: ${tiny} sub-${TINY_PX}px text (min ${rec.minTextPx})`;
    const base = rec.tinyBase;
    /* `tol` is 0 on the platform the baseline was frozen on, and 1 elsewhere. A label rendering at
       exactly 16.0px on macOS measures 15.9px under CI's Linux font stack and flips to the tiny
       side of a strict `<` — three figures did exactly that, each off by ONE label. The tolerance
       buys back that boundary case without loosening the check where it is authoritative; a real
       regression adds far more than one sub-floor label. Freeze a Linux baseline to make it 0
       everywhere. */
    const tol = rec.tinyTol || 0;
    if (base == null && rec.tinyGated && tiny > tol) hard.push(msg + ' — NEW tiny-text figure, raise the label size');
    else if (base != null && tiny > base + tol) hard.push(msg + ` — WORSE than baselined ${base}`);
    else warn.push(msg);
  }
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

  /* Ratchet the tiny-text debt. Keyed by deck#label — the SCREEN LABEL, never the ordinal, so
     inserting a slide does not present a dozen pieces of old debt as brand new (the mistake
     legibility-baseline.json had to be rescued from). One entry per figure, holding the worst
     count seen across languages and steps: RU labels run longer than EN, and a later step can
     reveal more of them, so anything less would let debt in through the back door. */
  const tinyKey = (r) => `${r.deck}#${r.label}`;
  const baseline = loadTinyBaseline();
  if (process.argv.includes('--update-tiny-baseline')) {
    const fresh = {};
    for (const r of records) {
      const n = (r.tinyText || []).length;
      if (n) fresh[tinyKey(r)] = Math.max(fresh[tinyKey(r)] || 0, n);
    }
    writeFileSync(TINY_BASE, JSON.stringify({ _meta: TINY_META, entries: fresh }, null, 2) + '\n');
    console.log(`[viz-probe-gate] wrote tiny-text baseline: ${Object.keys(fresh).length} figure(s) → ${TINY_REL}`);
    return;
  }
  const basePlat = baseline && baseline._meta && baseline._meta.platform;
  const tinyTol = basePlat && basePlat !== process.platform ? 1 : 0;
  if (tinyTol) console.log(`[viz-probe-gate] tiny-text baseline frozen on '${basePlat}', running on '${process.platform}' — allowing ±1 label for font-metric rounding`);
  for (const r of records) {
    r.tinyGated = !!baseline;                      // no baseline yet ⇒ stay WARN-only, as before
    r.tinyTol = tinyTol;
    if (baseline) r.tinyBase = baseline.entries[tinyKey(r)];
  }

  let hard = [], warn = [];
  for (const rec of records) { const c = classify(rec); hard.push(...c.hard); warn.push(...c.warn); }
  for (const h of hard) console.log('  ✗ [HARD] ' + h);
  for (const w of warn.slice(0, 40)) console.log('  ! [WARN] ' + w);
  console.log(`\n[viz-probe-gate] scanned ${records.length} slide-states across all decks (EN+RU, every step)`);
  console.log(`[viz-probe-gate] HARD(collapsed/broken/off-slide/doubling/severe-overlap)=${hard.length}  WARN(mild-overlap/tiny-text)=${warn.length}`);
  if (hard.length) process.exit(1);
}

function selftest() {
  const fixtures = [
    { name: 'collapsed image', rec: { lang: 'ru', slide: 1, step: 0, maxStep: 0, imgs: { collapsed: [{ src: 'x.webp', h: 16 }] } }, mustHard: true },
    { name: 'broken image', rec: { lang: 'en', slide: 2, step: 0, maxStep: 0, imgs: { broken: ['y.webp'] } }, mustHard: true },
    { name: 'off-slide', rec: { lang: 'en', slide: 3, step: 0, maxStep: 0, offSlide: [{ t: 'z', over: 40 }] }, mustHard: true },
    { name: 'bilingual doubling', rec: { lang: 'en', slide: 4, step: 0, maxStep: 0, doubled: 2 }, mustHard: true },
    { name: 'severe overlap (≥0.5 → HARD)', rec: { lang: 'en', slide: 5, step: 0, maxStep: 0, overlaps: [{ a: 'p', b: 'q', frac: 0.6 }] }, mustHard: true, mustWarn: false },
    { name: 'mild overlap (0.3–0.5 → WARN)', rec: { lang: 'en', slide: 5, step: 1, maxStep: 1, overlaps: [{ a: 'p', b: 'q', frac: 0.4 }] }, mustHard: false, mustWarn: true },
    { name: 'clean slide', rec: { lang: 'en', slide: 6, step: 0, maxStep: 0, imgs: {} }, mustHard: false, mustWarn: false },
    // the tiny-text ratchet — all four states it can be in
    { name: 'tiny text, no baseline yet (WARN only)',
      rec: { lang: 'en', slide: 7, step: 0, maxStep: 0, tinyText: [{ t: 'a', px: 12 }], minTextPx: 12 },
      mustHard: false, mustWarn: true },
    { name: 'tiny text, NEW figure under a baseline (HARD)',
      rec: { lang: 'en', slide: 8, step: 0, maxStep: 0, tinyText: [{ t: 'a', px: 12 }], minTextPx: 12, tinyGated: true },
      mustHard: true, mustWarn: false },
    { name: 'tiny text at baseline (WARN, grandfathered)',
      rec: { lang: 'en', slide: 9, step: 0, maxStep: 0, tinyText: [{ t: 'a', px: 12 }, { t: 'b', px: 13 }], minTextPx: 12, tinyGated: true, tinyBase: 2 },
      mustHard: false, mustWarn: true },
    { name: 'tiny text WORSE than baseline (HARD)',
      rec: { lang: 'en', slide: 10, step: 0, maxStep: 0, tinyText: [{ t: 'a', px: 12 }, { t: 'b', px: 13 }, { t: 'c', px: 11 }], minTextPx: 11, tinyGated: true, tinyBase: 2 },
      mustHard: true, mustWarn: false },
    { name: 'figure fixed below its baseline (WARN, ready to ratchet)',
      rec: { lang: 'en', slide: 11, step: 0, maxStep: 0, tinyText: [{ t: 'a', px: 12 }], minTextPx: 12, tinyGated: true, tinyBase: 4 },
      mustHard: false, mustWarn: true },
    // cross-platform tolerance: exactly +1 label is font-metric rounding, +2 is a regression
    { name: 'cross-platform +1 over baseline (WARN)',
      rec: { lang: 'en', slide: 12, step: 0, maxStep: 0, tinyText: [{}, {}, {}, {}], minTextPx: 15.9, tinyGated: true, tinyBase: 3, tinyTol: 1 },
      mustHard: false, mustWarn: true },
    { name: 'cross-platform +2 over baseline (still HARD)',
      rec: { lang: 'en', slide: 13, step: 0, maxStep: 0, tinyText: [{}, {}, {}, {}, {}], minTextPx: 12, tinyGated: true, tinyBase: 3, tinyTol: 1 },
      mustHard: true, mustWarn: false },
    { name: 'same-platform +1 over baseline is HARD (no tolerance)',
      rec: { lang: 'en', slide: 14, step: 0, maxStep: 0, tinyText: [{}, {}, {}, {}], minTextPx: 12, tinyGated: true, tinyBase: 3, tinyTol: 0 },
      mustHard: true, mustWarn: false },
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
  console.log('[viz-probe-gate] selftest PASS — classifier fires on collapsed/broken/off-slide/doubling + severe overlap (HARD), warns on mild overlap, silent on clean');
}

main().catch((e) => { console.error(e); process.exit(1); });
