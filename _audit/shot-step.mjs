/* _shot-step.mjs — снять ОДИН слайд на ЗАДАННОМ шаге.

   Контактный лист (`composition-gate --contact`) снимает каждый слайд на шаге 0, поэтому всё,
   что виджет показывает дальше по стрелке, приёмкой глазами не проверяется. Именно там и жил
   дефект positional-enc: подпись-вывод появляется на шаге 3 и обрезалась границей viewBox, а на
   контактном листе слайд выглядел безупречно.

   Usage: node _audit/_shot-step.mjs <deck.html> <позиция слайда> <сколько шагов> <куда.png>
   Пример: node _audit/_shot-step.mjs 07-contextual-attention-transformers.html 42 3 /tmp/s.png
*/
import { serveDir, withBrowser, withPage } from './lib/gate-harness.mjs';
import { REPO_ROOT } from './lib/paths.mjs';
import { join } from 'node:path';
const [deck, slide, steps, out] = process.argv.slice(2);
const server = await serveDir(join(REPO_ROOT, 'Lectures'));
await withBrowser(async (browser) => {
  await withPage(browser, { viewport: { width: 1920, height: 1080 } }, async (page) => {
    await page.goto(server.href(deck), { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.evaluate((k) => { location.hash = '#/' + k; }, Number(slide));
    await page.waitForTimeout(500);
    for (let i = 0; i < Number(steps); i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(320);
    }
    await page.screenshot({ path: out });
  });
});
await server.close?.();
console.log('снято:', out);
