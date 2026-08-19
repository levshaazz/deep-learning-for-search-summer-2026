#!/usr/bin/env node
/* mechanism-gate.mjs — MECHANISM gate (G32): лекция обязана показывать, а не только сообщать.
 *
 * Класс дефекта (аудит 2026-08, ФАЗА 4.7 плана). Дека набирается таблицами, сравнениями и
 * определениями — каждый слайд по отдельности выглядит содержательным, а вместе они сообщают
 * ВЫВОДЫ и никогда не показывают, откуда те взялись. Так дека 18 доехала до 28 слайдов подряд
 * без единого разбора, а дека 17 — до 6 % механизма: приём назван, а как он устроен, студент
 * не видит нигде. Ни один прежний гейт этого не ловил: слайды валидны, кадр не переполнен,
 * шрифт читаем.
 *
 * Механизм = слайд типа formula | viz | walkthrough | e2e | archflow | sequence: символьная
 * выкладка, проход руками, схема потока или живой виджет. Признак чисто арифметический и не
 * зависит от того, чем именно нарисован разбор.
 *
 * Проверки:
 *   [D] ПЛОТНОСТЬ — доля механизма в деке не ниже FLOOR и НЕ НИЖЕ записанной в храповике.
 *   [G] РАЗРЫВ — самая длинная цепочка подряд идущих слайдов без механизма не длиннее MAX_GAP
 *       и не длиннее записанной в храповике. Средняя плотность обманчива: можно собрать весь
 *       разбор в один акт и оставить три акта пустыми, и [D] промолчит.
 *   [W] ВИДЖЕТЫ — дека без единого смонтированного виджета: у курса они написаны и подключены,
 *       ноль означает, что дека выпала из общей оснастки.
 *
 * Храповик (_audit/baselines/mechanism.json) может только УЛУЧШАТЬСЯ: плотность не падает,
 * разрыв не растёт. --update-baseline отказывается записывать ухудшение.
 *
 * Исключения (EXEMPT) — с причиной каждое; дека, у которой учебного механизма нет по природе.
 *
 * Usage:  node _audit/mechanism-gate.mjs
 *         node _audit/mechanism-gate.mjs --selftest
 *         node _audit/mechanism-gate.mjs --update-baseline
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = join(ROOT, '_audit', 'baselines', 'mechanism.json');
const MECH = new Set(['formula', 'viz', 'walkthrough', 'e2e', 'archflow', 'sequence']);
const FLOOR = 12;      // % — ниже этого дека сообщает выводы, а не показывает механизм
const MAX_GAP = 20;    // слайдов подряд без разбора

/* Деки, к которым правило неприменимо. Причина обязательна: без неё исключение — это дыра. */
const EXEMPT = {
  '00': 'вводная лекция: логистика, оценивание, инструменты. Учебного механизма там нет по природе, ' +
        'и требовать его — значит требовать формулу про расписание',
};

export function scanDeck(dir) {
  const parts = readdirSync(join(dir, 'parts'))
    .filter((f) => f.endsWith('.html') && !/^(00-head|zz-tail)/.test(f))
    .sort();
  const types = [];
  let widgets = 0;
  for (const f of parts) {
    const html = readFileSync(join(dir, 'parts', f), 'utf8');
    const m = html.match(/data-type="([^"]*)"/);
    types.push(m ? m[1] : '');
    if (/data-widget=/.test(html)) widgets++;
  }
  const idx = types.map((t, i) => (MECH.has(t) ? i : -1)).filter((i) => i >= 0);
  let gap = 0, prev = -1;
  for (const i of [...idx, types.length]) { gap = Math.max(gap, i - prev - 1); prev = i; }
  return { slides: types.length, mech: idx.length,
           density: types.length ? +(100 * idx.length / types.length).toFixed(1) : 0, gap, widgets };
}

export function loadBaseline(path = BASELINE) {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')).decks || {};
}

export function ratchet(base, now) {
  const worse = [], better = [];
  for (const [num, cur] of Object.entries(now)) {
    const old = base[num];
    if (!old) continue;
    if (cur.density < old.density - 0.05) worse.push(`${num}: плотность ${old.density}% → ${cur.density}%`);
    else if (cur.density > old.density + 0.05) better.push(`${num}: плотность ${old.density}% → ${cur.density}%`);
    if (cur.gap > old.gap) worse.push(`${num}: разрыв ${old.gap} → ${cur.gap}`);
    else if (cur.gap < old.gap) better.push(`${num}: разрыв ${old.gap} → ${cur.gap}`);
  }
  return { ok: worse.length === 0, worse, better };
}

export function run({ root = ROOT, baselinePath = BASELINE, update = false } = {}) {
  const decks = readdirSync(join(root, 'Lectures'))
    .filter((d) => /^\d\d-/.test(d) && existsSync(join(root, 'Lectures', d, 'parts')))
    .sort();
  if (!decks.length) {
    console.log('[mechanism] дек не найдено — правило П4: «все деки показывают механизм» ⇒ дек не ноль');
    return 1;
  }
  const now = {};
  for (const d of decks) now[d.slice(0, 2)] = scanDeck(join(root, 'Lectures', d));

  const base = loadBaseline(baselinePath);
  const { ok, worse, better } = ratchet(base, now);

  if (update) {
    const first = !existsSync(baselinePath);
    if (!ok && !first) {
      worse.forEach((w) => console.log(`  ✗ УХУДШЕНИЕ: ${w}`));
      console.log('[mechanism] ОТКАЗ записи: храповик может только улучшаться — добавь разбор, не переписывай долг');
      return 1;
    }
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, JSON.stringify({
      _doc: 'храповик G32: доля слайдов-механизмов и самая длинная цепочка без них по каждой деке. ' +
            'Плотность может только расти, разрыв — только сокращаться (--update-baseline отказывает ухудшению).',
      decks: now }, null, 1) + '\n');
    better.forEach((b) => console.log(`  ↑ ${b}`));
    console.log(`[mechanism] ${first ? 'ПЕРВИЧНОЕ вооружение' : 'бейзлайн записан'}: ${Object.keys(now).length} дек`);
    return 0;
  }

  const errors = [], warns = [];
  for (const [num, cur] of Object.entries(now)) {
    if (EXEMPT[num]) { warns.push(`[D] дека ${num} вне правила: ${EXEMPT[num]}`); continue; }
    const old = base[num];
    if (cur.density < FLOOR && (!old || cur.density < old.density - 0.05))
      errors.push(`[D] дека ${num}: механизм ${cur.density}% (пол ${FLOOR}%) — дека сообщает выводы, а не показывает их`);
    else if (cur.density < FLOOR)
      warns.push(`[D] дека ${num}: механизм ${cur.density}% — известный долг храповика, пол ${FLOOR}%`);
    if (cur.gap > MAX_GAP && (!old || cur.gap > old.gap))
      errors.push(`[G] дека ${num}: ${cur.gap} слайдов подряд без разбора (потолок ${MAX_GAP})`);
    else if (cur.gap > MAX_GAP)
      warns.push(`[G] дека ${num}: разрыв ${cur.gap} — известный долг храповика, потолок ${MAX_GAP}`);
    if (cur.widgets === 0)
      errors.push(`[W] дека ${num}: ни одного смонтированного виджета — выпала из оснастки курса`);
  }
  worse.forEach((w) => errors.push(`[R] ухудшение против храповика — ${w}`));
  better.forEach((b) => warns.push(`[R] улучшение (${b}) — зафиксируй: --update-baseline`));

  errors.forEach((e) => console.log(`  ✗ [HARD] ${e}`));
  warns.forEach((w) => console.log(`  ! [WARN] ${w}`));
  console.log(`[mechanism] дек: ${Object.keys(now).length} · пол ${FLOOR}% · потолок разрыва ${MAX_GAP} · ` +
              `HARD=${errors.length} WARN=${warns.length}`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] && process.argv[1].endsWith('mechanism-gate.mjs')) {
  if (process.argv.includes('--selftest')) {
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const tmp = mkdtempSync(join(tmpdir(), 'mech-'));
    const mk = (num, types, widgetOn = 0) => {
      const d = join(tmp, 'Lectures', `${num}-x`, 'parts');
      mkdirSync(d, { recursive: true });
      types.forEach((t, i) => writeFileSync(join(d, `${String(i + 1).padStart(2, '0')}-s.html`),
        `<section class="slide" data-type="${t}">${i < widgetOn ? '<div data-widget="w"></div>' : ''}</section>`));
    };
    const quiet = (fn) => { const l = console.log; console.log = () => {}; const r = fn(); console.log = l; return r; };
    let fails = [];
    // здоровая дека: 2 механизма на 8, виджет есть
    mk('01', ['formula', 'table', 'table', 'viz', 'table', 'table', 'table', 'table'], 1);
    const bp = join(tmp, 'b.json');
    if (quiet(() => run({ root: tmp, baselinePath: bp })) !== 0) fails.push('clean');
    // дека без виджетов вовсе
    mk('02', ['formula', 'table', 'formula', 'table'], 0);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('no-widgets');
    rmSync(join(tmp, 'Lectures', '02-x'), { recursive: true });
    // разрыв длиннее потолка
    mk('03', ['formula', ...Array(25).fill('table')], 1);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('gap');
    rmSync(join(tmp, 'Lectures', '03-x'), { recursive: true });
    // плотность ниже пола
    mk('04', ['formula', ...Array(19).fill('table')], 1);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('density');
    rmSync(join(tmp, 'Lectures', '04-x'), { recursive: true });
    // храповик: вооружение, затем ухудшение
    quiet(() => run({ root: tmp, baselinePath: bp, update: true }));
    mk('01', ['table', 'table', 'table', 'viz', 'table', 'table', 'table', 'table'], 1);   // было 2 механизма, стало 1
    if (quiet(() => run({ root: tmp, baselinePath: bp })) === 0) fails.push('ratchet-detect');
    if (quiet(() => run({ root: tmp, baselinePath: bp, update: true })) === 0) fails.push('ratchet-refuse');
    // исключение адресное: дека 00 не жжётся даже пустой
    mk('00', Array(10).fill('table'), 1);
    mk('01', ['formula', 'table', 'table', 'viz', 'table', 'table', 'table', 'table'], 1);
    if (quiet(() => run({ root: tmp, baselinePath: bp })) !== 0) fails.push('exempt');
    rmSync(tmp, { recursive: true, force: true });
    for (const t of ['clean', 'no-widgets', 'gap', 'density', 'ratchet-detect', 'ratchet-refuse', 'exempt'])
      console.log(`  [${fails.includes(t) ? 'FAIL' : 'OK'}] ${t}`);
    console.log(fails.length ? `[selftest] FAIL: ${fails.join(', ')}` : '[selftest] PASS');
    process.exit(fails.length ? 1 : 0);
  }
  process.exit(run({ update: process.argv.includes('--update-baseline') }));
}
