/* l2play-audit.mjs — independent VLM-prep render of two NEW surfaces:
   SURFACE 1: tokenizer-compare widget in L2 Book (beat climb-tokenizer-compare), driven by SCROLLING.
   SURFACE 2: the Playground (/[lang]/playground), driven by the transport (window.__players).
   Serves docs/ on PORT 9231, base /deep-learning-for-search-summer-2026/.
   en+ru (spot ru), desktop 1280 + mobile 390, light + dark. Writes PNGs to _internal/l2play_confirm/shots/.
*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const OUT = join(ROOT, '_internal', 'l2play_confirm', 'shots');
mkdirSync(OUT, { recursive: true });
const BASE = '/deep-learning-for-search-summer-2026';
const PORT = 9231;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

function serve() {
  return createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.startsWith(BASE)) p = p.slice(BASE.length);
    let file = join(DOCS, p);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) { res.statusCode = 404; res.end('404 ' + p); return; }
    res.setHeader('Content-Type', MIME[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
}

const findings = [];
function log(s) { console.log(s); findings.push(s); }

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    try { localStorage.setItem('dls.theme', t); } catch {}
    document.documentElement.dataset.theme = t;
  }, theme);
  await page.waitForTimeout(120);
}

// ───────────────────────── SURFACE 1: tokenizer-compare in Book ─────────────────────────
async function auditBook(browser, lang, width, theme) {
  const tag = `book-${lang}-w${width}-${theme}`;
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  const url = `http://localhost:${PORT}${BASE}/${lang}/book/02/`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await setTheme(page, theme);
  await page.reload({ waitUntil: 'networkidle' });   // theme persisted via localStorage → applied pre-paint
  await page.waitForTimeout(250);

  // Confirm the widget mounted in __figs and read its rendered facts.
  const facts = await page.evaluate(() => {
    const f = window.__figs && window.__figs['climb-tokenizer-compare'];
    const sec = document.getElementById('climb-tokenizer-compare');
    const fig = sec && sec.querySelector('.scrolly-graphic');
    const rows = fig ? [...fig.querySelectorAll('.tc-row')] : [];
    const readRow = (r) => ({
      name: (r.querySelector('.tc-name') || {}).textContent || '',
      fam: (r.querySelector('.tc-fam') || {}).textContent || '',
      count: (r.querySelector('.tc-badge-n') || {}).textContent || '',
      chips: [...r.querySelectorAll('.tc-toks .tc-tok')].map((c) => c.textContent).join('·'),
      hidden: r.classList.contains('is-hidden'),
      ranked: r.classList.contains('is-ranked'),
      cls: r.className.replace(/\s*is-(hidden|ranked|new)\s*/g, ' ').match(/tc-row--\w+/)?.[0] || '',
      barW: (r.querySelector('.tc-bar-fill') || {}).style?.width || '',
    });
    return {
      mounted: !!(f && typeof f.setStep === 'function'),
      hasFig: !!fig,
      rowCount: rows.length,
      rows: rows.map(readRow),
      verdictText: (fig && fig.querySelector('.tc-verdict')) ? fig.querySelector('.tc-verdict').textContent.slice(0, 80) : null,
      verdictHidden: (fig && fig.querySelector('.tc-verdict')) ? fig.querySelector('.tc-verdict').classList.contains('is-hidden') : null,
      inputHead: (fig && fig.querySelector('.tc-head')) ? fig.querySelector('.tc-head').textContent : null,
    };
  });
  log(`[${tag}] mounted=${facts.mounted} fig=${facts.hasFig} rows=${facts.rowCount} verdict="${facts.verdictText}"`);
  facts.rows.forEach((r, i) => log(`   row${i}: ${r.name} | ${r.fam} | n=${r.count} | bar=${r.barW} | cls=${r.cls} | chips=${r.chips}`));

  // Drive by SCROLLING each .scroll-step into the trigger zone (offset 0.6).
  const steps = await page.$$('#climb-tokenizer-compare .scroll-step');
  const shots = [];
  for (let i = 0; i < steps.length; i++) {
    await steps[i].scrollIntoViewIfNeeded();
    // nudge so the step top crosses 60% — scroll so the step center sits in the upper viewport
    await page.evaluate((idx) => {
      const el = document.querySelectorAll('#climb-tokenizer-compare .scroll-step')[idx];
      if (el) { const r = el.getBoundingClientRect(); window.scrollBy(0, r.top - window.innerHeight * 0.5); }
    }, i);
    await page.waitForTimeout(450); // let scrollama fire + transitions settle
    const st = await page.evaluate(() => {
      const fig = document.querySelector('#climb-tokenizer-compare .scrolly-graphic');
      const rows = fig ? [...fig.querySelectorAll('.tc-row')] : [];
      return {
        step: fig ? fig.getAttribute('data-step') ?? fig.dataset.step : '?',
        shown: rows.filter((r) => !r.classList.contains('is-hidden')).length,
        ranked: rows.some((r) => r.classList.contains('is-ranked')),
        verdictHidden: fig.querySelector('.tc-verdict')?.classList.contains('is-hidden'),
      };
    });
    // screenshot the sticky figure only (tight crop on the widget)
    const fig = await page.$('#climb-tokenizer-compare .scrolly-graphic');
    const fp = join(OUT, `s1-${tag}-step${i}.png`);
    if (fig) await fig.screenshot({ path: fp });
    shots.push(`step${i}: dataStep=${st.step} shown=${st.shown} ranked=${st.ranked} verdictHidden=${st.verdictHidden}`);
  }
  shots.forEach((s) => log(`   scroll ${s}`));

  // overflow check at this width
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) log(`   ⚠ H-OVERFLOW ${overflow}px @${width}`);
  if (errs.length) log(`   ⚠ ${errs.length} console/page errors: ${errs.slice(0, 3).join(' | ')}`);
  await page.close();
  return facts;
}

// ───────────────────────── SURFACE 2: Playground ─────────────────────────
async function auditPlayground(browser, lang, width, theme) {
  const tag = `pg-${lang}-w${width}-${theme}`;
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  const url = `http://localhost:${PORT}${BASE}/${lang}/playground/`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await setTheme(page, theme);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const overview = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.pg-group')].map((g) => ({
      title: (g.querySelector('.pg-group-title') || {}).textContent || '',
      cards: g.querySelectorAll('.pg-card').length,
    }));
    const cards = [...document.querySelectorAll('.pg-card')].map((c) => ({
      id: c.dataset.demo, max: c.dataset.max,
      title: (c.querySelector('.pg-title') || {}).textContent || '',
      pill: (c.querySelector('.pg-pill') || {}).textContent || '',
      mountEmpty: ((c.querySelector('.pg-mount') || {}).childElementCount || 0) === 0,
      mountChildren: (c.querySelector('.pg-mount') || {}).childElementCount || 0,
    }));
    return {
      intro: (document.querySelector('.lead') || {}).textContent || '',
      kicker: (document.querySelector('.kicker') || {}).textContent || '',
      groups, cards,
      mountedFigs: window.__figs ? Object.keys(window.__figs).length : 0,
      players: window.__players ? Object.keys(window.__players).length : 0,
    };
  });
  log(`[${tag}] groups=${overview.groups.length} cards=${overview.cards.length} mountedFigs=${overview.mountedFigs} players=${overview.players}`);
  log(`   kicker="${overview.kicker.slice(0, 60)}" intro="${overview.intro.slice(0, 80)}"`);
  overview.groups.forEach((g) => log(`   group "${g.title}" — ${g.cards} cards`));
  const empties = overview.cards.filter((c) => c.mountEmpty);
  if (empties.length) log(`   ⚠ EMPTY MOUNTS (${empties.length}): ${empties.map((c) => c.id).join(', ')}`);
  log(`   cards: ${overview.cards.map((c) => `${c.id}(max${c.max},ch${c.mountChildren})`).join(' ')}`);

  // full-page screenshot (light desktop only gets the long one; others a viewport shot)
  await page.screenshot({ path: join(OUT, `s2-${tag}-full.png`), fullPage: true });

  // Drive a few cards via the transport controller window.__players[id].
  const probeIds = ['tokenizer-compare', 'tsne-steps', 'pagerank-power', 'bm25-calc', 'ndcg-multiquery', 'attention-e2e'];
  const present = overview.cards.map((c) => c.id);
  const toProbe = probeIds.filter((id) => present.includes(id)).slice(0, 4);
  for (const id of toProbe) {
    // bring the card into view
    await page.evaluate((cid) => {
      const c = document.querySelector(`.pg-card[data-demo="${cid}"]`);
      if (c) c.scrollIntoView({ block: 'center' });
    }, id);
    await page.waitForTimeout(120);
    // step 0 baseline
    await page.evaluate((cid) => window.__players[cid].go(0), id);
    await page.waitForTimeout(120);
    const card0 = await page.$(`.pg-card[data-demo="${id}"]`);
    if (card0) await card0.screenshot({ path: join(OUT, `s2-${tag}-${id}-step0.png`) });

    // advance via NEXT button (real transport), capture mid + last
    const max = Number(present.includes(id) ? (overview.cards.find((c) => c.id === id).max) : 0);
    const probe = await page.evaluate((cid) => {
      const out = { steps: [] };
      const p = window.__players[cid];
      const f = window.__figs[cid];
      const card = document.querySelector(`.pg-card[data-demo="${cid}"]`);
      const readK = () => (card.querySelector('.pg-k') || {}).textContent;
      const readScrub = () => (card.querySelector('.pg-scrub') || {}).value;
      // click NEXT to max
      const nextBtn = card.querySelector('[data-act="next"]');
      for (let i = 0; i < p.maxStep; i++) { nextBtn.click(); }
      out.afterNext = { k: readK(), scrub: readScrub(), step: p.step };
      // scrub jump to 1
      const scrub = card.querySelector('.pg-scrub');
      scrub.value = '1'; scrub.dispatchEvent(new Event('input', { bubbles: true }));
      out.afterScrub1 = { k: readK(), scrub: readScrub(), step: p.step };
      // restart
      card.querySelector('[data-act="restart"]').click();
      out.afterRestart = { k: readK(), scrub: readScrub(), step: p.step };
      out.maxStep = p.maxStep;
      return out;
    }, id);
    log(`   transport[${id}] max=${probe.maxStep} afterNext=k${probe.afterNext.k}/scrub${probe.afterNext.scrub}/step${probe.afterNext.step} scrub1=k${probe.afterScrub1.k}/step${probe.afterScrub1.step} restart=k${probe.afterRestart.k}/step${probe.afterRestart.step}`);

    // capture at max step (drive to max, screenshot)
    await page.evaluate((cid) => window.__players[cid].go(window.__players[cid].maxStep), id);
    await page.waitForTimeout(200);
    const cardN = await page.$(`.pg-card[data-demo="${id}"]`);
    if (cardN) await cardN.screenshot({ path: join(OUT, `s2-${tag}-${id}-stepMax.png`) });

    // PLAY toggle test (just verify pill flips, then stop)
    const playTest = await page.evaluate(async (cid) => {
      const card = document.querySelector(`.pg-card[data-demo="${cid}"]`);
      window.__players[cid].go(0);
      card.querySelector('[data-act="play"]').click();
      const playingPill = (card.querySelector('.pg-pill') || {}).textContent;
      const isPlaying = card.classList.contains('is-playing');
      card.querySelector('[data-act="play"]').click(); // stop
      const pausedPill = (card.querySelector('.pg-pill') || {}).textContent;
      return { playingPill, isPlaying, pausedPill };
    }, id);
    log(`   transport[${id}] play→pill="${playTest.playingPill}" isPlaying=${playTest.isPlaying} stop→pill="${playTest.pausedPill}"`);
  }

  // overflow + nav check
  const meta = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const navLinks = [...document.querySelectorAll('nav a, header a')].map((a) => a.textContent.trim());
    const playgroundNav = navLinks.find((t) => /playground|площад|мәйдан/i.test(t)) || null;
    return { overflow, playgroundNav, navLinks: navLinks.slice(0, 12) };
  });
  if (meta.overflow > 2) log(`   ⚠ H-OVERFLOW ${meta.overflow}px @${width}`);
  log(`   navPlayground="${meta.playgroundNav}" nav=[${meta.navLinks.join(', ')}]`);
  if (errs.length) log(`   ⚠ ${errs.length} console/page errors: ${errs.slice(0, 4).join(' | ')}`);
  await page.close();
  return overview;
}

async function run() {
  if (!existsSync(DOCS)) { console.error('docs/ not found'); return 1; }
  const server = serve(); await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch();

  log('═══════════ SURFACE 1: tokenizer-compare (L2 Book) ═══════════');
  await auditBook(b, 'en', 1280, 'light');
  await auditBook(b, 'en', 1280, 'dark');
  await auditBook(b, 'en', 390, 'light');
  await auditBook(b, 'en', 390, 'dark');
  await auditBook(b, 'ru', 1280, 'light');
  await auditBook(b, 'ru', 390, 'dark');

  log('\n═══════════ SURFACE 2: Playground ═══════════');
  await auditPlayground(b, 'en', 1280, 'light');
  await auditPlayground(b, 'en', 1280, 'dark');
  await auditPlayground(b, 'en', 390, 'light');
  await auditPlayground(b, 'ru', 1280, 'light');
  await auditPlayground(b, 'ru', 390, 'dark');
  await auditPlayground(b, 'tt', 1280, 'light'); // spot-check tt chrome

  await b.close(); server.close();
  console.log('\n[done] shots in', OUT);
  return 0;
}

process.exit(await run());
