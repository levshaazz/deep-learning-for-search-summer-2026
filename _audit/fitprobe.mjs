/* fitprobe — из чего складывается высота слайда: fit, целевая высота и вклад каждого блока.
   Скрытый слайд меряется нулём, поэтому на слайд переходим по #/N (1-базированный).
   Запуск из _audit:  node fitprobe.mjs <deck.html> "<кусок метки>" ["<ещё>" ...] */
import { serveDir, withBrowser, withPage } from './lib/gate-harness.mjs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DECKDIR = join(ROOT, 'Lectures');
const [deck, ...needles] = process.argv.slice(2);

const FIND = (needles) => {
  const out = [];
  document.querySelectorAll('section.slide').forEach((s, i) => {
    const label = s.dataset.screenLabel || '';
    if (needles.some((n) => label.includes(n))) out.push({ i, label });
  });
  return out;
};

const READ = (i) => {
  const s = document.querySelectorAll('section.slide')[i];
  const body = s.querySelector(':scope > .slide-body');
  const cs = getComputedStyle(s);
  const availH = 1080 - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
  const fit = parseFloat(s.dataset.autoFit || '1');
  const h = body ? body.scrollHeight : 0;
  const parts = [];
  if (body) for (const el of body.children) {
    const r = el.getBoundingClientRect();
    parts.push({ tag: el.tagName.toLowerCase() + '.' + (el.className || '').split(' ')[0],
                 h: Math.round(r.height / (fit || 1)),
                 txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48) });
  }
  return { fit, availH, h, need: Math.round(availH / 0.65), label: s.dataset.screenLabel, parts };
};

const server = await serveDir(DECKDIR);
try {
  await withBrowser(async (browser) => {
    await withPage(browser, { viewport: { width: 1920, height: 1080 } }, async (page) => {
      await page.goto(server.href(deck), { waitUntil: 'networkidle' });
      await page.waitForTimeout(2600);
      const hits = await page.evaluate(FIND, needles);
      if (!hits.length) { console.log('  ничего не найдено'); return; }
      for (const { i } of hits) {
        const atLoad = await page.evaluate(READ, i);
        await page.evaluate((n) => { location.hash = `#/${n}`; }, i + 1);
        await page.waitForTimeout(1400);
        const r = await page.evaluate(READ, i);
        console.log(`\n  «${r.label}»  #/${i + 1}`);
        console.log(`     fit: при загрузке ${atLoad.fit.toFixed(3)} · при заходе ${r.fit.toFixed(3)}`);
        console.log(`     высота ${r.h} → нужна ≤ ${r.need} (для 0,65): срезать ${Math.max(0, r.h - r.need)} px`);
        for (const p of r.parts) console.log(`        ${String(p.h).padStart(5)} px  ${p.tag.padEnd(22)} ${p.txt}`);
      }
    });
  });
} finally { await server.close(); }
