/*
 * composition-gate.mjs — the DECK-COMPOSITION gate (G19). Browser-rendered.
 *
 * slide-viz checks geometry INSIDE the figure <svg>; it is blind to a slide whose
 * HTML CONTENT overflows the 1920×1080 frame and gets cut off at the edge (the
 * "composition breaks / spills out" class — e.g. a wall-of-text slide whose last
 * line is clipped, or a card that runs past the bottom). This gate renders every
 * slide of every shipped deck and HARD-fails when content overflows its frame.
 *
 *   node _audit/composition-gate.mjs            # audit every Lectures/*.html (needs a build)
 *   node _audit/composition-gate.mjs --selftest # a planted overflow must fire
 *   node _audit/composition-gate.mjs --contact 13-crucible-of-negatives.html  # render slides to PNGs for review
 *
 * Exit: non-zero whenever HARD > 0.
 */
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serveDir, withBrowser, withPage, makeReporter } from './lib/gate-harness.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DECKDIR = join(ROOT, 'Lectures');
const VIEW = { width: 1920, height: 1080 };
const TOL = 24;   // px a VISIBLE element may extend past the frame edge before it is a real cut-off.
// We trigger on SPILL (an element's box past the frame), NOT on section scrollHeight/scrollWidth —
// the latter counts margins/padding/off-screen layout slack and false-fires on slides that fit fine
// (verified: a clean synthesis table reads overY=56 but spill=0). scrollH/W are reported for context only.

// in-page: for the VISIBLE slide, does its content overflow the frame? (runs in the browser)
const MEASURE = () => {
  const slides = [...document.querySelectorAll('section.slide')];
  const vis = slides.find((s) => {
    const cs = getComputedStyle(s);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && s.getAttribute('aria-hidden') !== 'true';
  });
  if (!vis) return { ok: false };
  const frame = vis.getBoundingClientRect();
  const SVG = 'http://www.w3.org/2000/svg';
  // an element's box CLIPPED by every overflow-hidden ancestor BELOW the slide frame. Content hidden by
  // an intermediate container (a collapsed reveal-answer, a clipping card) doesn't count; content clipped
  // by the FRAME itself (the real cut-off) still does → null means fully hidden by an intermediate clip.
  const clippedRect = (el) => {
    const r0 = el.getBoundingClientRect();
    let L = r0.left, T = r0.top, R = r0.right, B = r0.bottom;
    for (let n = el.parentElement; n && n !== vis && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (/(hidden|clip|scroll|auto)/.test(cs.overflow + cs.overflowX + cs.overflowY)) {
        const nb = n.getBoundingClientRect();
        L = Math.max(L, nb.left); T = Math.max(T, nb.top); R = Math.min(R, nb.right); B = Math.min(B, nb.bottom);
        if (R - L <= 1 || B - T <= 1) return null;
      }
    }
    return { left: L, top: T, right: R, bottom: B, w: R - L, h: B - T };
  };
  let spill = 0, worst = '';
  for (const el of vis.querySelectorAll('*')) {
    // SVG internals (KaTeX stretchy paths, figure <path>/<g>) report their COORDINATE-space box (a glyph
    // reads as 15000px); KaTeX struts likewise. Skip them; the figure's own <svg> + the .katex root stay.
    if (el.namespaceURI === SVG && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.closest && el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.closest && el.closest('.katex') && !(el.classList && el.classList.contains('katex'))) continue;
    // reveal-answer content (a closed <details> / .ha-content) is laid out below the fold ON PURPOSE,
    // hidden until the reader clicks — it is not a composition break. (The visible <summary> stays.)
    if (el.closest && (el.closest('details:not([open])') || el.closest('.ha-content'))) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    const raw = el.getBoundingClientRect();
    if (raw.width < 2 || raw.height < 2 || raw.width > 5000 || raw.height > 5000) continue;
    const r = clippedRect(el);
    if (!r || r.w < 2 || r.h < 2) continue;                  // fully hidden by an intermediate clip
    const past = Math.max(r.bottom - frame.bottom, r.right - frame.right);
    if (past > spill) { spill = past; worst = (el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 34); }
  }
  return { ok: true, label: vis.getAttribute('data-screen-label') || '', overY: vis.scrollHeight - vis.clientHeight, overX: vis.scrollWidth - vis.clientWidth, spill, worst };
};

function slideCount(html) { return (html.match(/<section class="slide"/g) || []).length; }

async function run({ contact = null } = {}) {
  const R = makeReporter('composition');
  const decks = readdirSync(DECKDIR).filter((f) => /^\d.*\.html$/.test(f)).sort();
  const targets = contact ? decks.filter((d) => d === contact) : decks;
  const server = await serveDir(DECKDIR);
  let scanned = 0;
  try {
    await withBrowser(async (browser) => {
      for (const deck of targets) {
        const n = slideCount(readFileSync(join(DECKDIR, deck), 'utf8'));
        await withPage(browser, { viewport: VIEW }, async (page) => {
          await page.goto(server.href(deck), { waitUntil: 'networkidle' });
          await page.waitForTimeout(500);
          let shotDir;
          if (contact) { shotDir = join(ROOT, '_internal', 'contact-sheets', deck.replace('.html', '')); mkdirSync(shotDir, { recursive: true }); }
          for (let i = 1; i <= n; i++) {
            await page.evaluate((k) => { location.hash = '#/' + k; }, i);
            await page.waitForTimeout(220);
            const m = await page.evaluate(MEASURE);
            scanned++;
            if (contact) await page.screenshot({ path: join(shotDir, `s${String(i).padStart(2, '0')}.png`) });
            if (!m.ok) continue;
            if (m.spill > TOL) {
              R.err(`${deck} · slide ${i} "${m.label}" — an element spills ${Math.round(m.spill)}px past the frame` +
                     (m.worst ? ` (worst: "${m.worst}")` : '') + ` [scrollH+${Math.round(m.overY)} scrollW+${Math.round(m.overX)}]`);
              if (!contact) { const fd = join(ROOT, '_internal', 'composition-fails'); mkdirSync(fd, { recursive: true });
                await page.screenshot({ path: join(fd, `${deck.replace('.html', '')}-s${i}.png`) }); }
            }
          }
        });
      }
    });
  } finally { await server.close(); }
  if (contact) console.log(`[composition] contact sheet → _internal/contact-sheets/${contact.replace('.html', '')}/`);
  console.log(`\n[composition] scanned ${scanned} slide-state(s) across ${targets.length} deck(s)`);
  console.log(`[composition] HARD(content-overflow)=${R.errors}` + (R.errors ? '' : '  — no slide content spills its 1920×1080 frame ✓'));
  return R.errors ? 1 : 0;
}

async function selftest() {
  // a fixture deck whose ONE slide has content far taller than the 1080 frame must fire.
  const html = `<!doctype html><html><head><style>
    html,body{margin:0} section.slide{height:1080px;width:1920px;overflow:hidden;position:relative}
  </style></head><body>
    <section class="slide" data-screen-label="01 ok"><p style="height:200px">fits</p></section>
    <section class="slide" data-screen-label="02 overflow" aria-hidden="true"><div style="height:1600px">way too tall — cut off</div></section>
    <script>function go(){const h=location.hash.replace('#/','')||'1';document.querySelectorAll('section.slide').forEach((s,i)=>s.setAttribute('aria-hidden', String(i!==(+h-1))));}
    window.addEventListener('hashchange',go);go();</script>
  </body></html>`;
  const dir = join(ROOT, '_internal', '_composition_selftest'); mkdirSync(dir, { recursive: true });
  const f = join(dir, 'fixture.html'); (await import('node:fs')).writeFileSync(f, html);
  const server = await serveDir(dir);
  let firedOverflow = false, silentOk = true;
  try {
    await withBrowser(async (browser) => {
      await withPage(browser, { viewport: VIEW }, async (page) => {
        await page.goto(server.href('fixture.html'), { waitUntil: 'networkidle' });
        for (const i of [1, 2]) {
          await page.evaluate((k) => { location.hash = '#/' + k; }, i); await page.waitForTimeout(150);
          const m = await page.evaluate(MEASURE);
          const over = m.ok ? Math.max(m.overY, m.overX, m.spill) : 0;
          if (i === 2 && over > TOL) firedOverflow = true;
          if (i === 1 && over > TOL) silentOk = false;
        }
      });
    });
  } finally { await server.close(); }
  const ok = firedOverflow && silentOk;
  console.log(`[selftest] overflow slide fires=${firedOverflow}  clean slide silent=${silentOk}`);
  console.log('[selftest]', ok ? 'PASS — composition detector fires on an overflowing slide, silent on a fitting one'
                               : 'FAIL — blind to content overflow!');
  return ok ? 0 : 1;
}

const argv = process.argv.slice(2);
const ci = argv.indexOf('--contact');
process.exit(await (argv.includes('--selftest') ? selftest()
  : run({ contact: ci >= 0 ? argv[ci + 1] : null })));
