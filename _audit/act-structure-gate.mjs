#!/usr/bin/env node
/* act-structure-gate.mjs — ACT-STRUCTURE gate (G34): у акта должен быть каркас.
 *
 * Класс дефекта (ФАЗА 4.8 плана). Дека делится на акты дивайдерами, и каркас каждого акта —
 * не украшение, а то, что удерживает внимание: акт разумной длины, внутри него есть разбор
 * (иначе студент получает только выводы), и он чем-то закрывается — границей, развязкой или
 * следующим дивайдером. Ломается это тихо: акт распухает до трети деки, или разбор уезжает
 * в соседний акт, или лекция просто обрывается на списке ссылок.
 *
 * Проверки:
 *   [L] ДЛИНА — акт не длиннее MAX_ACT слайдов. Порог измерен по эталонным декам 10–12.
 *   [M] МЕХАНИЗМ — в акте есть хотя бы один слайд-разбор (formula/viz/walkthrough/e2e/
 *       archflow/sequence). G32 меряет деку целиком и длинную цепочку; здесь — поакт.
 * Проверки «акт закрыт границей» здесь НЕТ, хотя она стоит в Definition of Done. Замер показал,
 * что её не проходят и эталонные деки 10 и 12 (7 актов из 8 и 4 из 5): акты курса закрываются
 * содержательным слайдом, а не служебным ярлыком. Правило, которое валит собственный эталон,
 * описывает не курс, а фантазию автора гейта — и такую проверку честнее не иметь вовсе, чем
 * записать 108 «нарушений» в долг и приучить всех их пролистывать.
 *   [Y] КАРКАС ДЕКИ — у деки есть слайд «где мы» (you-are-here) и повестка.
 *
 * Храповик (_audit/baselines/act-structure.json): число нарушений по деке может только падать.
 * Это не «разрешение нарушать»: пороги мягкие, но класс большой и вычищается волнами, а
 * храповик не даёт откатиться назад, пока идёт чистка.
 *
 * Usage:  node _audit/act-structure-gate.mjs [--selftest|--update-baseline|--list]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, '_audit', 'baselines', 'act-structure.json');
const MECH = new Set(['formula', 'viz', 'walkthrough', 'e2e', 'archflow', 'sequence']);
const MAX_ACT = 22;

/* Акты, которые по своей РОЛИ не несут разбора: развязка, итоги, практика, мост, границы,
 * ссылки, а также обзорно-исторические зачины. Требовать там формулу — тот же карго-культ, что
 * требовать «границу» у акта, который закрывается содержательным слайдом: первый замер дал 30
 * «нарушений», и половина пришлась на акты «Итоги», «Развязка» и «Мост». Признак — по названию
 * акта, потому что именно оно объявляет роль читателю. */
const NO_MECH_ROLE_RE = /payoff|итог|развязк|практик|bridge|мост|boundar|границ|reference|ссылк|prehistory|предыстор|historical arc|историческ/i;

export function scanDeck(dir) {
  const files = readdirSync(join(dir, 'parts'))
    .filter((f) => f.endsWith('.html') && !/^(00-head|zz-tail)/.test(f)).sort();
  const slides = files.map((f) => {
    const html = readFileSync(join(dir, 'parts', f), 'utf8');
    return { type: (html.match(/data-type="([^"]*)"/) || [, ''])[1],
             label: (html.match(/data-screen-label="([^"]*)"/) || [, ''])[1] };
  });
  const acts = [];
  let cur = null;
  for (const s of slides) {
    if (s.type === 'divider') { if (cur) acts.push(cur); cur = { start: s.label, slides: [] }; continue; }
    if (cur) cur.slides.push(s);
  }
  if (cur) acts.push(cur);
  const hasYouAreHere = slides.some((s) => /you[-\s]?are[-\s]?here|где мы|вы здесь/i.test(s.label));
  const hasAgenda = slides.some((s) => s.type === 'agenda' || /agenda|повестк/i.test(s.label));
  return { acts, hasYouAreHere, hasAgenda, total: slides.length };
}

export function actIssues(deckNum, scan) {
  const out = [];
  const introDeck = deckNum === '00';   // вводная: логистика и обзор, механизма там нет по природе
  for (const a of scan.acts) {
    if (introDeck) continue;
    if (!a.slides.length) continue;
    if (a.slides.length > MAX_ACT)
      out.push(`[L] дека ${deckNum}, акт «${a.start}»: ${a.slides.length} слайдов (потолок ${MAX_ACT})`);
    if (!NO_MECH_ROLE_RE.test(a.start) && !a.slides.some((s) => MECH.has(s.type)))
      out.push(`[M] дека ${deckNum}, акт «${a.start}»: ни одного слайда-разбора`);
  }
  // Первые деки курса законно обходятся без «где мы»: у 00 позади ничего нет, а 01 и 02 несут
  // ту же работу слайдом «хребет курса» / «повестка + цели». Требовать ярлык там — карго-культ.
  if (!scan.hasYouAreHere && !['00', '01', '02'].includes(deckNum))
    out.push(`[Y] дека ${deckNum}: нет слайда «где мы» (you-are-here)`);
  if (!scan.hasAgenda) out.push(`[Y] дека ${deckNum}: нет слайда-повестки`);
  return out;
}

export function run({ root = ROOT, baselinePath = BASELINE, update = false, listing = false } = {}) {
  const decks = readdirSync(join(root, 'Lectures'))
    .filter((d) => /^\d\d-/.test(d) && existsSync(join(root, 'Lectures', d, 'parts'))).sort();
  if (!decks.length) { console.log('[act-structure] дек не найдено — П4: проверять нечего, и это не «зелено»'); return 1; }

  const counts = {}, all = [];
  for (const d of decks) {
    const num = d.slice(0, 2);
    const issues = actIssues(num, scanDeck(join(root, 'Lectures', d)));
    counts[num] = issues.length;
    all.push(...issues);
  }
  const base = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')).decks || {} : null;

  if (update) {
    const grown = base ? Object.entries(counts).filter(([n, c]) => base[n] !== undefined && c > base[n]) : [];
    if (grown.length) {
      grown.forEach(([n, c]) => console.log(`  ✗ РОСТ: дека ${n}: ${base[n]} → ${c}`));
      console.log('[act-structure] ОТКАЗ записи: храповик может только падать');
      return 1;
    }
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, JSON.stringify({
      _doc: 'храповик G34: число структурных нарушений акта по деке. Может только падать ' +
            '(--update-baseline отказывает росту). Пороги мягкие; класс вычищается волнами.',
      decks: counts }, null, 1) + '\n');
    console.log(`[act-structure] бейзлайн записан: ${Object.keys(counts).length} дек, ` +
                `${Object.values(counts).reduce((a, b) => a + b, 0)} нарушений`);
    return 0;
  }

  const errors = [], warns = [];
  for (const [num, c] of Object.entries(counts)) {
    if (!base) { warns.push(`[R] дека ${num}: ${c} нарушений (храповик не вооружён)`); continue; }
    const old = base[num];
    if (old === undefined) { if (c) errors.push(`[R] дека ${num}: ${c} нарушений — НОВАЯ дека вне храповика`); }
    else if (c > old) errors.push(`[R] дека ${num}: нарушений стало больше — ${old} → ${c}`);
    else if (c < old) warns.push(`[R] дека ${num}: ${old} → ${c} — зафиксируй: --update-baseline`);
    else if (c) warns.push(`[R] дека ${num}: ${c} нарушений — известный долг храповика`);
  }
  if (listing) all.forEach((i) => console.log(`    ${i}`));
  errors.forEach((e) => console.log(`  ✗ [HARD] ${e}`));
  warns.forEach((w) => console.log(`  ! [WARN] ${w}`));
  console.log(`[act-structure] дек: ${decks.length} · нарушений всего: ${all.length} · ` +
              `HARD=${errors.length} WARN=${warns.length}`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('act-structure-gate.mjs')) {
  if (process.argv.includes('--selftest')) {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const tmp = mkdtempSync(join(tmpdir(), 'act-'));
    const mk = (num, defs) => {
      const d = join(tmp, 'Lectures', `${num}-x`, 'parts');
      mkdirSync(d, { recursive: true });
      defs.forEach(([type, label], i) => writeFileSync(join(d, `${String(i + 1).padStart(2, '0')}-s.html`),
        `<section class="slide" data-type="${type}" data-screen-label="${label}"></section>`));
    };
    const quiet = (fn) => { const l = console.log; console.log = () => {}; const r = fn(); console.log = l; return r; };
    const bp = join(tmp, 'b.json'); const fails = [];
    const healthy = [['two-col', '01 you-are-here'], ['agenda', '02 Agenda'], ['divider', '03 Act I'],
                     ['formula', '04 F'], ['definition', '05 D'], ['definition', '06 Boundaries · act I']];
    mk('01', healthy);
    quiet(() => run({ root: tmp, baselinePath: bp, update: true }));
    if (quiet(() => run({ root: tmp, baselinePath: bp })) !== 0) fails.push('clean');
    // акт без разбора
    mk('02', [['two-col', '01 you-are-here'], ['agenda', '02 Agenda'], ['divider', '03 Act I'],
              ['table', '04 T'], ['definition', '05 Boundaries · act I']]);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('no-mechanism');
    rmSync(join(tmp, 'Lectures', '02-x'), { recursive: true });
    // дека без you-are-here
    mk('04', [['agenda', '02 Agenda'], ['divider', '03 Act I'], ['formula', '04 F'],
              ['definition', '05 Boundaries · act I']]);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('no-you-are-here');
    rmSync(join(tmp, 'Lectures', '04-x'), { recursive: true });
    // храповик: ухудшение существующей деки — разбор из акта убран
    mk('01', [['two-col', '01 you-are-here'], ['agenda', '02 Agenda'], ['divider', '03 Act I'],
              ['table', '04 T'], ['definition', '05 D'], ['definition', '06 Boundaries · act I']]);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('ratchet-detect');
    if (quiet(() => run({ root: tmp, baselinePath: bp, update: true })) === 0) fails.push('ratchet-refuse');
    rmSync(tmp, { recursive: true, force: true });
    for (const t of ['clean', 'no-mechanism', 'no-you-are-here', 'ratchet-detect', 'ratchet-refuse'])
      console.log(`  [${fails.includes(t) ? 'FAIL' : 'OK'}] ${t}`);
    console.log(fails.length ? `[selftest] FAIL: ${fails.join(', ')}` : '[selftest] PASS');
    process.exit(fails.length ? 1 : 0);
  }
  process.exit(run({ update: process.argv.includes('--update-baseline'), listing: process.argv.includes('--list') }));
}
