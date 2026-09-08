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
  if (card.dataset.mounted === 'true') return;   // mount ONCE (the observer unobserves after, but guard anyway)
  const id = card.dataset.demo;
  const d = byId[id];
  if (!d) return;
  card.dataset.mounted = 'true';                 // flips CSS to hide the lazy-mount placeholder
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

// ── LAZY MOUNT ───────────────────────────────────────────────────────────────
// Scales to 70+ widgets: instead of eagerly mounting every .pg-card on load (the old
// `forEach(mountCard)` — 36 widgets booting at once), an IntersectionObserver mounts a card's widget
// only when it nears the viewport (rootMargin 280px), then UNOBSERVES it (mount once). Result: on
// initial load only the handful of cards in/near view mount; scrolling mounts the rest. A card hidden
// by the filter (display:none → never intersects) is NEVER mounted; revealing it re-observes so it
// mounts on the next scroll into view.
const LAZY = 'IntersectionObserver' in window;
let observer = null;

function observeCard(card) {
  if (!LAZY) { mountCard(card); return; }       // no IO support → eager fallback (still correct)
  if (card.dataset.mounted === 'true' || !observer) return;
  observer.observe(card);
}

// Build the IntersectionObserver (mount-once-then-unobserve). Created BEFORE the filter runs so that
// applyFilter()'s initial pass can observe the visible cards. Hidden cards are never observed here.
function makeObserver() {
  if (!LAZY) return;
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const card = e.target;
      observer.unobserve(card);                  // mount once, then stop watching this card
      mountCard(card);
    }
  }, { rootMargin: '280px 0px', threshold: 0 });
}

// ── FILTER / SEARCH TOOLBAR ────────────────────────────────────────────────────
// Composes a LECTURE facet + a TOPIC facet + free-text search. Show/hide is via the `hidden` attr on
// each .pg-card (CSS: .pg-card[hidden]{display:none}); empty lecture-groups collapse too. Filtering
// composes with lazy mount: a card hidden by the filter stays unmounted; one revealed by clearing a
// filter is re-observed so it mounts when scrolled into view. "showing N of M" + clear-filters update
// live. The active filter state lives here (the chips toggle it).
function initFilter() {
  const toolbar = document.querySelector('.pg-toolbar');
  if (!toolbar) return;
  const cards = [...document.querySelectorAll('.pg-card')];
  const groups = [...document.querySelectorAll('.pg-group')];
  const searchEl = document.getElementById('pg-search');
  const showingEl = document.querySelector('.pg-showing');
  const clearBtn = document.getElementById('pg-clear');
  const emptyEl = document.getElementById('pg-empty');
  const showingTpl = showingEl ? (showingEl.dataset.tpl || '{n}/{m}') : '{n}/{m}';
  const total = showingEl ? Number(showingEl.dataset.total) || cards.length : cards.length;

  const state = { lecture: '', topic: '', q: '' };

  const matches = (card) => {
    if (state.lecture && card.dataset.lecture !== state.lecture) return false;
    if (state.topic && card.dataset.topic !== state.topic) return false;
    if (state.q && !(card.dataset.search || '').includes(state.q)) return false;
    return true;
  };

  function applyFilter() {
    let shown = 0;
    for (const card of cards) {
      const ok = matches(card);
      card.hidden = !ok;
      if (ok) {
        shown++;
        // revealed + not yet mounted → re-observe so it lazy-mounts when scrolled into view.
        if (card.dataset.mounted !== 'true') observeCard(card);
      }
    }
    // Collapse a lecture-group whose cards are all hidden (keeps the headings tidy).
    for (const g of groups) {
      const any = [...g.querySelectorAll('.pg-card')].some((c) => !c.hidden);
      g.hidden = !any;
    }
    if (showingEl) showingEl.textContent = showingTpl.replace('{n}', String(shown)).replace('{m}', String(total));
    if (emptyEl) emptyEl.hidden = shown !== 0;
    const dirty = !!(state.lecture || state.topic || state.q);
    if (clearBtn) clearBtn.hidden = !dirty;
  }

  // Chip toggles (single-select per facet; clicking the active chip / "All" resets that facet).
  toolbar.querySelectorAll('.pg-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const facet = chip.dataset.facet;            // 'lecture' | 'topic'
      const val = chip.dataset.val || '';
      state[facet] = val;
      // reflect pressed state across this facet's chips
      toolbar.querySelectorAll(`.pg-chip[data-facet="${facet}"]`).forEach((c) => {
        const on = (c.dataset.val || '') === val;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilter();
    });
  });

  if (searchEl) searchEl.addEventListener('input', () => {
    state.q = searchEl.value.trim().toLowerCase();
    applyFilter();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    state.lecture = ''; state.topic = ''; state.q = '';
    if (searchEl) searchEl.value = '';
    toolbar.querySelectorAll('.pg-chip').forEach((c) => {
      const on = (c.dataset.val || '') === '';
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    applyFilter();
    if (searchEl) searchEl.focus();
  });

  applyFilter();   // initial pass (no-op for the "all" default, but sets showing N of M + clear state)
}

function init() {
  makeObserver();  // create the IO first so the filter's initial pass can observe visible cards
  initFilter();    // sets initial visibility AND observes each visible (non-filtered) card for lazy mount
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.__figs = figs;       // mirror the Book's headless hook (manual probe / verification)
window.__players = players; // transport controllers, for headless verification
window.__mountCard = mountCard; // headless: force-mount a specific card to test the transport
