// playground-client.js — the Playground's transport runtime (imported by src/pages/[lang]/playground.astro).
//
// Lives as its own module (rather than an inline page <script>) because a hoisted Astro script that
// only uses import.meta.glob can be dropped on a [lang] static route; a page <script> that imports
// THIS file links reliably. The page injects #pg-payload (per-locale labels + each widget's data);
// here we mount each widget the same way the Book does (glob logic.js → resolve export → fn(el,{data,
// labels}) → setStep), and bind a free-play transport (prev/next/play/scrub/restart) to drive setStep.

import { mountName } from '../../widgets/_widget-base.js';

// Auto-registered widget mounts — eager-glob every widgets/<id>/logic.js, keyed by folder id.
// Identical discovery to the Book renderer: a new widget folder is mounted here with ZERO edits.
const logicMods = import.meta.glob('../../widgets/*/logic.js', { eager: true });
const MOUNT = {};
for (const [path, mod] of Object.entries(logicMods)) {
  const id = path.split('/').slice(-2)[0]; // widgets/<id>/logic.js → <id>
  MOUNT[id] = mod;
}

const payloadEl = document.getElementById('pg-payload');
const payload = payloadEl ? JSON.parse(payloadEl.textContent) : { demos: [], pill: {} };
const byId = Object.fromEntries(payload.demos.map((d) => [d.id, d]));
const PILL = payload.pill || { playing: 'PLAYING', paused: 'PAUSED' };
// prefers-reduced-motion: don't auto-animate. Play still works (explicit user intent) but advances
// ONE step per press instead of running a timed loop, so nothing moves on its own.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTOSTEP_MS = 1400; // dwell per step in play mode

const figs = {};        // demo id → { setStep, maxStep, ... } (headless verification hook)
const players = {};     // demo id → transport controller

function mountCard(card) {
  const id = card.dataset.demo;
  const d = byId[id];
  if (!d) return;
  const host = card.querySelector('.pg-mount');
  const mod = MOUNT[id];
  // pick the manifest-declared export; fall back to the PascalCase rule, then any mount* function.
  const fn = mod && (mod[d.mountName] || mod[mountName(id)] || Object.values(mod).find((v) => typeof v === 'function'));
  if (!host || typeof fn !== 'function') return;
  const inst = fn(host, { data: d.data, labels: d.labels });
  if (!inst || typeof inst.setStep !== 'function') return;
  figs[id] = inst;

  const maxStep = (typeof inst.maxStep === 'number' ? inst.maxStep : d.maxStep) || 0;
  const scrub = card.querySelector('.pg-scrub');
  const kEl = card.querySelector('.pg-k');
  const pill = card.querySelector('[data-pill]');
  const playBtn = card.querySelector('.pg-play');
  let step = 0, timer = null;

  const setPill = (state) => {
    pill.dataset.pill = state;
    pill.textContent = state === 'playing' ? PILL.playing : PILL.paused;
  };
  const go = (k) => {
    step = Math.max(0, Math.min(maxStep, k | 0));
    inst.setStep(step);
    if (scrub) scrub.value = String(step);
    if (kEl) kEl.textContent = String(step);
  };
  const stop = () => {
    if (timer) { clearInterval(timer); timer = null; }
    card.classList.remove('is-playing');
    playBtn.setAttribute('aria-pressed', 'false');
    setPill('paused');
  };
  const play = () => {
    if (maxStep <= 0) return;
    if (step >= maxStep) go(0);                     // replay from the start if parked at the end
    if (reduceMotion) { go(step + 1); return; }     // no timed loop — single deliberate step
    card.classList.add('is-playing');
    playBtn.setAttribute('aria-pressed', 'true');
    setPill('playing');
    timer = setInterval(() => {
      if (step >= maxStep) { stop(); return; }
      go(step + 1);
    }, AUTOSTEP_MS);
  };
  const toggle = () => (timer ? stop() : play());

  card.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'play') { toggle(); return; }
      stop(); // any manual control pauses autoplay
      if (act === 'next') go(step + 1);
      else if (act === 'prev') go(step - 1);
      else if (act === 'restart') go(0);
    });
  });
  if (scrub) scrub.addEventListener('input', () => { stop(); go(Number(scrub.value)); });

  // Keyboard arrows while the card is focused (optional nicety, scoped to the card).
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stop(); go(step + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { stop(); go(step - 1); e.preventDefault(); }
  });

  go(0);
  players[id] = { play, stop, go, get step() { return step; }, maxStep };
}

function init() {
  document.querySelectorAll('.pg-card').forEach(mountCard);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.__figs = figs;       // mirror the Book's headless hook (manual probe / verification)
window.__players = players; // transport controllers, for headless verification
