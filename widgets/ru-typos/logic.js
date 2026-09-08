/* ru-typos/logic.js — L20 «Поиск на русском», act 4: the thousand cuts, made countable.

   A simulated query line (a FIXED set of prepared strings — never a real <input>, so the figure stays
   deterministic and offline-reproducible), a ЙЦУКЕН/QWERTY keyboard with two letters on every key, a
   toy corpus, and three repairs switched on one at a time: the layout map, ё→е in BOTH arms, and
   confusables normalisation (Unicode UTS #39). The student breaks the search with their own hand and
   then repairs it, and the recall ladder counts what each repair is worth.

   THE ROW THAT EARNS THE ACT is the extra toggle: fold ё→е on the INDEX ONLY and recall falls back to
   zero — a one-armed normalisation is worse than none at all. It is not a step, so it can be tried at
   any point from step 3 on; its state lives on host.dataset.onearm so it survives the factory repaint.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep and binds NO keyboard and NO scroll — the SLIDE driver
   (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k). Every number comes from
   data/l20-ru.json (layout · yoLadder · homoglyphs); every human-readable string comes from `labels`;
   every colour comes from design tokens in style.css.

   STEP MODEL (maxStep = 5):
     0 — the keyboard and a query typed in the wrong layout: nothing found
     1 — the layout map switches on, the string turns into Russian — but ё is lost (it lives on `)
     2 — the repaired query meets a corpus spelled with ё: still nothing found
     3 — ё→е in BOTH arms: found. The recall ladder starts climbing
     4 — a homoglyph query: pixel-identical to the real word, different code points, nothing found
     5 — confusables normalisation: found. The full ladder plus the rule that governs all of it
*/
import { defineWidget } from '../_widget-base.js';

// QWERTY rows in physical key order; only keys the data actually maps are drawn.
const KEY_ROWS = ['`qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./'];

export const mountRuTypos = defineWidget({
  id: 'ru-typos',
  rootClass: 'rt-root',
  exportName: 'mountRuTypos',
  maxStep: 5,
  render({ host, data, labels, el }) {
    const layout = (data && data.layout) || {};
    const yo = (data && data.yoLadder) || {};
    const hg = (data && data.homoglyphs) || {};
    const map = layout.map || {};
    const yoKey = layout.yoKey || {};
    const ladder = yo.ladder || {};
    const docs = yo.docs || {};
    const docIds = Object.keys(docs);
    const demo = hg.demo || {};
    const lower = hg.lower || {};
    // latin → cyrillic, the inverse of the measured confusables table
    const unconfuse = {};
    for (const cyr of Object.keys(lower)) unconfuse[lower[cyr]] = cyr;

    const tmpl = (s, vals) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vals[k] != null ? vals[k] : ''));
    const decMark = () => {
      const l = (typeof document !== 'undefined' && document.documentElement
        ? (document.documentElement.dataset.lang || document.documentElement.lang || 'en') : 'en').slice(0, 2);
      return (l === 'ru' || l === 'tt') ? ',' : '.';
    };
    const rec = (v) => (typeof v === 'number' && isFinite(v) ? v.toFixed(3).replace('.', decMark()) : '—');

    // the probe: the LONGEST prepared layout probe — the two-word one the lecture uses.
    const probes = layout.probes || [];
    const probe = probes.reduce((a, b) => ((b.typed || '').length > (a.typed || '').length ? b : a),
      probes[0] || { typed: '', fixed: '' });
    const oneArmRow = (yo.rows || []).find((r) => r.id === 'index-only') || {};

    // ── folds ──────────────────────────────────────────────────────────────────────────────────
    const foldYo = (s) => String(s).replace(/ё/g, 'е');
    const foldCon = (s) => String(s).split('').map((ch) => unconfuse[ch] || ch).join('');
    const applyFolds = (s, useYo, useCon) => {
      let out = String(s);
      if (useYo) out = foldYo(out);
      if (useCon) out = foldCon(out);
      return out;
    };
    const toks = (s) => String(s).split(/\s+/).filter(Boolean);

    const oneArm = () => host.dataset.onearm === 'on';

    /* The scene at step k: which query string, which corpus, which repairs are live in which arm. */
    function scene(k) {
      const yoOn = k >= 3;
      const conOn = k >= 5;
      /* The deliberate production mistake. It is scoped to the ё/е scene (step 3) — that is the one
         the toggle is ABOUT; from step 4 the stage belongs to the homoglyph demo, and the toggle
         keeps speaking only through the measured ladder + the recall readout. */
      const armed = oneArm() && k === 3;
      if (k >= 4) {
        return { q: demo.fake || '', corpus: [{ id: 'd1', text: demo.real || '' }],
          yoOn, conOn, qYo: yoOn, qCon: conOn, armed, homo: true };
      }
      const q = armed ? (oneArmRow.query || '')
        : (k === 0 ? probe.typed : (k === 1 ? probe.fixed : toks(probe.fixed)[0] || ''));
      return { q, corpus: docIds.map((id) => ({ id, text: docs[id] })),
        yoOn, conOn, qYo: yoOn && !armed, qCon: conOn, armed, homo: false };
    }

    function hits(sc) {
      const qt = toks(applyFolds(sc.q, sc.qYo, sc.qCon));
      if (!qt.length) return [];
      return sc.corpus.filter((d) => {
        const dt = toks(applyFolds(d.text, sc.yoOn, sc.conOn));
        return qt.every((t) => dt.indexOf(t) >= 0);
      }).map((d) => d.id);
    }

    // ── static shell ───────────────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'wgt-panel rt-panel';
    host.appendChild(panel);

    const mkTag = (parent, text) => {
      const t = document.createElement('div');
      t.className = 'rt-tag';
      t.textContent = text || '';
      parent.appendChild(t);
      return t;
    };

    // keyboard
    mkTag(panel, labels.kbTag);
    const kb = document.createElement('div');
    kb.className = 'rt-kb';
    panel.appendChild(kb);
    const keyNodes = {};
    KEY_ROWS.forEach((rowStr) => {
      const row = document.createElement('div');
      row.className = 'rt-kbrow';
      rowStr.split('').forEach((ch) => {
        if (!map[ch]) return;
        const key = document.createElement('span');
        key.className = 'rt-key';
        if (ch === (yoKey.key || '`')) key.classList.add('is-yokey');
        const en = document.createElement('span');
        en.className = 'rt-key-en';
        en.textContent = ch;
        const ru = document.createElement('span');
        ru.className = 'rt-key-ru';
        ru.textContent = map[ch];
        key.appendChild(en);
        key.appendChild(ru);
        row.appendChild(key);
        keyNodes[ch] = key;
      });
      kb.appendChild(row);
    });

    // repair badges
    const fixRow = document.createElement('div');
    fixRow.className = 'rt-fixes';
    panel.appendChild(fixRow);
    const FIXES = [
      { key: 'layout', from: 1, name: labels.fixLayout },
      { key: 'yo', from: 3, name: labels.fixYo },
      { key: 'con', from: 5, name: labels.fixConfus },
    ];
    const fixNodes = FIXES.map((f) => {
      const b = document.createElement('span');
      b.className = 'rt-fix rt-fix--' + f.key;
      b.textContent = f.name || f.key;
      fixRow.appendChild(b);
      return b;
    });

    // query line
    const qTag = mkTag(panel, labels.queryTag);
    const qLine = document.createElement('div');
    qLine.className = 'rt-qline';
    panel.appendChild(qLine);

    // the ё / homoglyph note
    const note = document.createElement('div');
    note.className = 'rt-note';
    panel.appendChild(note);

    // code-point rows (steps 4–5)
    const cpBox = document.createElement('div');
    cpBox.className = 'rt-cp is-hidden';
    panel.appendChild(cpBox);

    // corpus
    const cTag = mkTag(panel, labels.corpusTag);
    const corpusBox = document.createElement('div');
    corpusBox.className = 'rt-corpus';
    panel.appendChild(corpusBox);

    // found counter + recall readout
    const found = document.createElement('div');
    found.className = 'rt-found';
    panel.appendChild(found);

    const recallLine = document.createElement('div');
    recallLine.className = 'rt-recall is-hidden';
    panel.appendChild(recallLine);

    // the one-arm toggle (NOT a step)
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'rt-toggle is-hidden';
    toggle.textContent = labels.oneArm || '';
    toggle.addEventListener('click', () => {
      host.dataset.onearm = oneArm() ? 'off' : 'on';
      apply(Number(host.dataset.step) || 0);
    });
    panel.appendChild(toggle);

    // ── the recall ladder (step 5) ─────────────────────────────────────────────────────────────
    const ladBox = document.createElement('div');
    ladBox.className = 'rt-ladder is-hidden';
    host.appendChild(ladBox);
    mkTag(ladBox, labels.ladderTag);

    const RUNGS = [
      { key: 'raw', name: labels.ladderRaw, v: ladder.raw },
      { key: 'both', name: labels.ladderBoth, v: ladder.yoBoth },
      { key: 'stem', name: labels.ladderStem, v: ladder.yoPlusStem },
      { key: 'one', name: labels.ladderOne, v: ladder.yoIndexOnly },
    ];
    const LW = 520, LROW = 32, LPAD = 12, LAB = 200, BAR0 = 206, BARW = 230;
    const LH = LPAD * 2 + LROW * RUNGS.length;
    /* No role/aria-label here on purpose: the ladder is one panel of the figure (and it is
       display:none before step 5). The factory puts role="img" + labels.alt on the HOST when no
       descendant claims it — the right scope, since the alt describes the whole scene. */
    const svg = el('svg', { viewBox: `0 0 ${LW} ${LH}`, class: 'wgt-svg rt-svg' }, ladBox);
    const vmax = RUNGS.reduce((m, r) => Math.max(m, typeof r.v === 'number' ? r.v : 0), 0) || 1;
    const rungNodes = RUNGS.map((r, i) => {
      const y = LPAD + i * LROW;
      const g = el('g', { class: 'rt-rung rt-rung--' + r.key }, svg);
      el('text', { x: 8, y: y + 16, class: 'rt-rung-lab' }, g).textContent = r.name || r.key;
      el('rect', { x: BAR0, y: y + 3, width: BARW, height: 17, rx: 5, class: 'rt-rung-track' }, g);
      const w = Math.max(0, Math.round(((typeof r.v === 'number' ? r.v : 0) / vmax) * BARW));
      el('rect', { x: BAR0, y: y + 3, width: w, height: 17, rx: 5, class: 'rt-rung-bar' }, g);
      el('text', { x: BAR0 + w + 8, y: y + 16, class: 'rt-rung-val' }, g).textContent = rec(r.v);
      return g;
    });

    const rule = document.createElement('div');
    rule.className = 'rt-rule';
    rule.textContent = labels.ruleLine || '';
    ladBox.appendChild(rule);

    // ── painters ───────────────────────────────────────────────────────────────────────────────
    function paintQuery(k, sc) {
      qLine.innerHTML = '';
      qTag.textContent = (k === 0 ? labels.typedTag : labels.queryTag) || '';
      const shown = sc.q;
      shown.split('').forEach((ch) => {
        const c = document.createElement('span');
        c.className = 'rt-ch';
        if (ch === ' ') c.classList.add('is-space');
        c.textContent = ch === ' ' ? '␣' : ch;
        qLine.appendChild(c);
      });
      if (sc.homo) {
        // mark the code points that differ from the real word — those are the Latin impostors
        const rcp = demo.realCodepoints || [], fcp = demo.fakeCodepoints || [];
        [].forEach.call(qLine.children, (c, i) => {
          if (rcp[i] && fcp[i] && rcp[i] !== fcp[i]) c.classList.add('is-latin');
        });
      }
      if (k === 1) {
        const arrow = document.createElement('span');
        arrow.className = 'rt-qsrc';
        arrow.textContent = probe.typed + ' →';
        qLine.insertBefore(arrow, qLine.firstChild);
      }
    }

    function paintKeys(k, sc) {
      const live = k >= 1 && !sc.homo;
      const used = new Set(live ? probe.typed.split('') : []);
      Object.keys(keyNodes).forEach((ch) => {
        keyNodes[ch].classList.toggle('is-lit', used.has(ch));
        keyNodes[ch].classList.toggle('is-warn', live && ch === (yoKey.key || '`'));
      });
    }

    function paintNote(k, sc) {
      note.className = 'rt-note';
      if (sc.armed) { note.classList.add('is-bad'); note.textContent = labels.oneArmWarn || ''; return; }
      if (k === 1) { note.classList.add('is-warn'); note.textContent = tmpl(labels.yoLostTmpl, { key: yoKey.key, letter: yoKey.letter }); return; }
      if (k === 2) { note.classList.add('is-bad'); note.textContent = labels.yoPlaque || ''; return; }
      if (k === 4) { note.classList.add('is-bad'); note.textContent = tmpl(labels.homoNote, { n: demo.swapped }); return; }
      if (k === 5) { note.classList.add('is-good'); note.textContent = labels.homoFixed || ''; return; }
      if (k === 3) { note.classList.add('is-good'); note.textContent = labels.yoFixed || ''; return; }
      note.textContent = labels.startNote || '';
    }

    function paintCodepoints(sc) {
      cpBox.classList.toggle('is-hidden', !sc.homo);
      if (!sc.homo) return;
      cpBox.innerHTML = '';
      const rcp = demo.realCodepoints || [], fcp = demo.fakeCodepoints || [];
      const rows = [
        { tag: labels.cpReal, word: demo.real || '', cps: rcp, cls: 'is-real' },
        { tag: labels.cpFake, word: demo.fake || '', cps: fcp, cls: 'is-fake' },
      ];
      rows.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'rt-cprow ' + r.cls;
        const t = document.createElement('span');
        t.className = 'rt-cptag';
        t.textContent = r.tag || '';
        row.appendChild(t);
        r.word.split('').forEach((ch, i) => {
          const c = document.createElement('span');
          c.className = 'rt-cpcell';
          if (rcp[i] && fcp[i] && rcp[i] !== fcp[i] && r.cls === 'is-fake') c.classList.add('is-latin');
          const g = document.createElement('span');
          g.className = 'rt-cpglyph';
          g.textContent = ch;
          const p = document.createElement('span');
          p.className = 'rt-cppoint';
          p.textContent = r.cps[i] || '';
          c.appendChild(g);
          c.appendChild(p);
          row.appendChild(c);
        });
        cpBox.appendChild(row);
      });
    }

    function paintCorpus(sc, hitIds) {
      corpusBox.innerHTML = '';
      const hitSet = new Set(hitIds);
      sc.corpus.forEach((d) => {
        const row = document.createElement('div');
        row.className = 'rt-doc' + (hitSet.has(d.id) ? ' is-hit' : '');
        const id = document.createElement('span');
        id.className = 'rt-doc-id';
        id.textContent = d.id;
        const tx = document.createElement('span');
        tx.className = 'rt-doc-text';
        tx.textContent = d.text;
        row.appendChild(id);
        row.appendChild(tx);
        corpusBox.appendChild(row);
      });
    }

    function apply(k) {
      const sc = scene(k);
      const hitIds = hits(sc);
      const half = oneArm() && k >= 3;   // the ё/е arm is half-normalised, whatever is on stage now
      paintKeys(k, sc);
      paintQuery(k, sc);
      paintNote(k, sc);
      paintCodepoints(sc);
      paintCorpus(sc, hitIds);

      fixNodes.forEach((n, i) => n.classList.toggle('is-on', k >= FIXES[i].from && !(FIXES[i].key === 'yo' && half)));
      fixNodes[1].classList.toggle('is-half', half);

      found.textContent = tmpl(labels.foundTmpl, { n: hitIds.length, N: sc.corpus.length });
      found.className = 'rt-found ' + (hitIds.length ? 'is-good' : 'is-bad');

      const showRecall = k >= 3;
      recallLine.classList.toggle('is-hidden', !showRecall);
      toggle.classList.toggle('is-hidden', k < 3);
      toggle.classList.toggle('is-on', oneArm());
      toggle.setAttribute('aria-pressed', oneArm() ? 'true' : 'false');
      if (showRecall) {
        const to = half ? ladder.yoIndexOnly : (k >= 5 ? ladder.yoPlusStem : ladder.yoBoth);
        recallLine.textContent = tmpl(labels.recallTmpl, { a: rec(ladder.raw), b: rec(to) });
        recallLine.className = 'rt-recall ' + (half ? 'is-bad' : 'is-good');
      }

      ladBox.classList.toggle('is-hidden', k < 5);
      rungNodes[3].classList.toggle('is-hidden', !half);
      // the viewBox shrinks with the hidden one-arm rung so the ladder never reserves an empty row
      svg.setAttribute('viewBox', `0 0 ${LW} ${LPAD * 2 + LROW * (half ? 4 : 3)}`);
      rungNodes.forEach((g, i) => g.classList.toggle('is-now',
        (half && i === 3) || (!half && i === 2)));
    }

    // per-step update (the factory clamps k to [0, maxStep] and owns caption + counter)
    return function update(k) { apply(k); };
  },
});
