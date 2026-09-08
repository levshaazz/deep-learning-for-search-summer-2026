/* seq-budget-gate.mjs — AUDIT_SITE G28.
   ASYNC HOPS vs THE LATENCY BUDGET on `sequence` slides. The L13 budget slide shipped green
   while charging a fire-and-forget hop (+2 ms cache+log) to the user-facing total: the bullet
   said "off the critical path", the engine summed it anyway, and the printed headroom was wrong
   by the same 2 ms. The engine has had the fix all along — `data-seq-skip-async` (used by L1 §49)
   — the slide just didn't carry it. This gate makes the contradiction structural:

     HARD — a sequence slide has an async hop (`data-kind="async"`), its prose claims the hop is
            off the critical path, and the slide does NOT carry `data-seq-skip-async`: the engine
            will charge to the budget what the slide says it doesn't.
     WARN — an async hop with NO off-critical-path phrase and no skip attribute: not provably
            contradictory (the slide may deliberately price the full sum), but worth a look.

   Pure-static over the sharded part fragments. No browser.
   Usage:  node _audit/seq-budget-gate.mjs   |   node _audit/seq-budget-gate.mjs --selftest */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/paths.mjs';

const OFF_PATH = /вне критического пути|off the (?:user-facing )?critical path|fire-and-forget|не входят? в (?:него|бюджет)|not on it\b/i;

export function classify(html) {
  if (!/data-type="sequence"/.test(html)) return null;
  const hasAsync = /data-kind="async"/.test(html);
  if (!hasAsync) return null;
  const skips = /data-seq-skip-async/.test(html);
  const claims = OFF_PATH.test(html);
  if (claims && !skips) return { level: 'HARD', why: 'проза объявляет шаг вне критического пути, а data-seq-skip-async нет — движок просуммирует то, от чего слайд открестился' };
  if (!claims && !skips) return { level: 'WARN', why: 'асинхронный шаг без оговорки и без skip-атрибута — сумма включает его молча' };
  return null;
}

function run() {
  const hard = [], warn = [];
  let seqs = 0;
  for (const dir of readdirSync(join(REPO_ROOT, 'Lectures')).filter((d) => /^\d\d-/.test(d))) {
    const parts = join(REPO_ROOT, 'Lectures', dir, 'parts');
    if (!existsSync(parts)) continue;
    for (const f of readdirSync(parts).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(join(parts, f), 'utf8');
      if (/data-type="sequence"/.test(html)) seqs++;
      const c = classify(html);
      if (c) (c.level === 'HARD' ? hard : warn).push(`Lectures/${dir}/parts/${f}: ${c.why}`);
    }
  }
  if (seqs === 0) { console.log('[seq-budget] ✗ не найдено ни одного sequence-слайда — сканер сломан'); return 1; }
  for (const h of hard) console.log('  ✗ [HARD] ' + h);
  for (const w of warn) console.log('  ! [WARN] ' + w);
  console.log(`[seq-budget] sequence-слайдов ${seqs} · HARD(async в бюджете при заявленном "вне пути")=${hard.length} WARN=${warn.length}`);
  return hard.length ? 1 : 0;
}

function selftest() {
  const mk = (attrs, body) => `<section class="slide" data-type="sequence" ${attrs}>${body}</section>`;
  const asyncHop = '<div data-kind="async">+2ms</div>';
  const claim = '<p>его +2 мс вне критического пути</p>';
  const cases = [
    ['контрадикция горит', () => classify(mk('', asyncHop + claim))?.level === 'HARD'],
    ['skip-атрибут гасит', () => classify(mk('data-seq-skip-async', asyncHop + claim)) === null],
    ['async без оговорки — WARN', () => classify(mk('', asyncHop))?.level === 'WARN'],
    ['без async — тишина', () => classify(mk('', claim)) === null],
    ['не-sequence — тишина', () => classify('<section class="slide" data-type="table">' + asyncHop + claim) === null],
  ];
  let ok = true;
  for (const [n, fn] of cases) { const p = fn(); console.log(`  ${p ? '✓' : '✗'} ${n}`); if (!p) ok = false; }
  console.log('[seq-budget]', ok ? 'selftest PASS' : 'SELFTEST FAILED');
  return ok ? 0 : 1;
}

process.exit(process.argv.includes('--selftest') ? selftest() : run());
