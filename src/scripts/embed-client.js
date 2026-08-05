// embed-client.js — runtime for the chromeless /embed/[widget] pages (Stepik iframes).
//
// Reads #em-payload (widget id + merged data + RAW trilingual i18n + step map), resolves the
// language from ?lang (default ru — the Stepik release is RU) with the site's fallback chain
// (tt→ru→en), LAZY-imports only this widget's logic chunk (non-eager glob → per-widget code
// splitting, so an iframe never downloads the other 79 widgets), mounts it the Book/Playground
// way (fn(el, {data, labels}) → setStep), and drives a minimal transport with a step caption.

import { mountName } from '../../widgets/_widget-base.js';

// LAZY glob (no { eager }) — returns { path: () => import(path) }; Vite code-splits per widget.
const logicMods = import.meta.glob('../../widgets/*/logic.js');

const FALLBACK = { en: ['en'], ru: ['ru', 'en'], tt: ['tt', 'ru', 'en'] };
const params = new URLSearchParams(location.search);
const lang = FALLBACK[params.get('lang')] ? params.get('lang') : 'ru';

function t(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  for (const l of FALLBACK[lang]) if (value[l] != null && value[l] !== '') return value[l];
  return value.en ?? '';
}

// Tiny trilingual UI strings (local — the embed page has no site i18n bundle).
const UI = {
  restart: { en: 'Restart', ru: 'Сначала', tt: 'Баштан' },
  prev: { en: 'Step back', ru: 'Шаг назад', tt: 'Артка адым' },
  play: { en: 'Play', ru: 'Проиграть', tt: 'Уйнату' },
  next: { en: 'Step forward', ru: 'Шаг вперёд', tt: 'Алга адым' },
  scrub: { en: 'Step', ru: 'Шаг', tt: 'Адым' },
};

const payload = JSON.parse(document.getElementById('em-payload').textContent);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTOSTEP_MS = 1800; // dwell per step in play mode (embed reads slower than the lab)

async function init() {
  // localized title
  const titleEl = document.getElementById('em-title');
  if (titleEl) { titleEl.textContent = t(payload.title); document.title = t(payload.title); }

  const host = document.getElementById('em-mount');
  const key = Object.keys(logicMods).find((p) => p.split('/').slice(-2)[0] === payload.id);
  if (!host || !key) return;
  const mod = await logicMods[key]();
  const fn = mod[payload.mountName] || mod[mountName(payload.id)]
    || Object.values(mod).find((v) => typeof v === 'function');
  if (typeof fn !== 'function') return;

  // resolve the flat i18n map to THIS language (same shape the Book/Playground mount with)
  const labels = Object.fromEntries(Object.entries(payload.i18n || {}).map(([k, v]) => [k, t(v)]));
  labels.role = 'img';
  // ?data=<key> selects one of the manifest's datasets (reproduces a Book beat that mounts the
  // widget on a non-default data file); any OTHER query param is a label/config override —
  // the Book's beat-level `labels: {…}` mechanism (e.g. ?focusStage=chunk for rag-pipeline).
  const RESERVED = new Set(['lang', 'theme', 'data']);
  for (const [k, v] of params) if (!RESERVED.has(k)) labels[k] = v;
  const dataKey = params.get('data');
  const data = dataKey && payload.dataSets && payload.dataSets[dataKey] !== undefined
    ? payload.dataSets[dataKey] : payload.data;
  const inst = fn(host, { data, labels });
  if (!inst || typeof inst.setStep !== 'function') return;
  window.__fig = inst; // headless verification hook

  const maxStep = (typeof inst.maxStep === 'number' ? inst.maxStep : payload.maxStep) || 0;
  const stepLabel = (k) => {
    const s = (payload.steps || []).find((x) => x.step === k);
    return s ? labels[s.labelKey] || '' : '';
  };

  const capEl = document.getElementById('em-caption');
  const bar = document.getElementById('em-transport');
  const scrub = bar.querySelector('.em-scrub');
  const kEl = bar.querySelector('.em-k');
  const playBtn = bar.querySelector('.em-play');
  let step = 0, timer = null;

  const go = (k) => {
    step = Math.max(0, Math.min(maxStep, k | 0));
    inst.setStep(step);
    if (scrub) scrub.value = String(step);
    if (kEl) kEl.textContent = String(step);
    if (capEl) capEl.textContent = stepLabel(step);
  };
  const stop = () => {
    if (timer) { clearInterval(timer); timer = null; }
    bar.classList.remove('is-playing');
    playBtn.setAttribute('aria-pressed', 'false');
  };
  const play = () => {
    if (maxStep <= 0) return;
    if (step >= maxStep) go(0);
    if (reduceMotion) { go(step + 1); return; } // no timed loop — single deliberate step
    bar.classList.add('is-playing');
    playBtn.setAttribute('aria-pressed', 'true');
    timer = setInterval(() => { if (step >= maxStep) { stop(); return; } go(step + 1); }, AUTOSTEP_MS);
  };

  // localized control labels
  const NAME = { restart: UI.restart, prev: UI.prev, play: UI.play, next: UI.next };
  bar.querySelectorAll('[data-act]').forEach((btn) => {
    const nm = t(NAME[btn.dataset.act] || {});
    btn.title = nm; btn.setAttribute('aria-label', nm);
    btn.addEventListener('click', () => {
      if (btn.dataset.act === 'play') { timer ? stop() : play(); return; }
      stop();
      if (btn.dataset.act === 'next') go(step + 1);
      else if (btn.dataset.act === 'prev') go(step - 1);
      else go(0);
    });
  });
  if (scrub) {
    scrub.title = t(UI.scrub); scrub.setAttribute('aria-label', t(UI.scrub));
    scrub.addEventListener('input', () => { stop(); go(Number(scrub.value)); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stop(); go(step + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { stop(); go(step - 1); e.preventDefault(); }
  });

  if (maxStep > 0) bar.hidden = false; // static (0-step) widgets keep the bar hidden
  go(0);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
