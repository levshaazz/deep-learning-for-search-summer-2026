/* ru-normalize/logic.js — L20 «Поиск на русском», THE CLIMAX WIDGET of act 2.

   ONE corpus (5 Russian documents), ONE query («котята играют»), THREE normalisation modes run over
   it — raw surface forms · Snowball stems · lemmas — so the student watches the ranking rebuild
   itself three times. It replaces two static worked slides and adds the column the lecture was
   missing: STEMMING, which rescues the gold document from the void and still ranks it behind a puppy,
   because «котята»→«котят» while «котят»→«кот» — one lexeme, three stems.

   HONESTY NOTE (the defect this widget exists to fix): in the surface pass the gold document is NOT
   RETRIEVED (score 0), it is not "rank 2" — rank 2 was an artefact of sorting a column of zeros. No
   step of this figure claims otherwise.

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep and binds NO keyboard and NO scroll — the SLIDE driver
   (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k). Every number comes from
   data/l20-ru.json (threeWay + bm25 — the facts-gated source of truth); every human-readable string
   comes from i18n keys in `labels`; every colour comes from design tokens in style.css.

   STEP MODEL (maxStep = 6):
     0 — the query and the 5 documents, nothing computed yet
     1 — mode «by surface form»: no match anywhere; the postings list for «котята» is empty (df = 0)
     2 — surface scores: gold 0.0 NOT RETRIEVED, the distractor takes #1; 1 document of 5 retrieved
     3 — mode «stemming»: the stem map — three different stems for one lexeme, marked as a split
     4 — stem scores: gold rises to #2 behind the puppy; 3 of 5 retrieved
     5 — mode «lemmatisation»: every form of the lexeme collapses onto one lemma
     6 — lemma scores: gold #1; 4 of 5 retrieved + the three-mode comparison bar and the price row
*/
import { defineWidget, esc } from '../_widget-base.js';

export const mountRuNormalize = defineWidget({
  id: 'ru-normalize',
  rootClass: 'rn-root',
  exportName: 'mountRuNormalize',
  maxStep: 6,
  render({ host, data, labels, el }) {
    const tw = (data && data.threeWay) || {};
    const bm = (data && data.bm25) || {};
    const docText = tw.docText || {};
    const docIds = Object.keys(docText);
    const goldId = bm.goldDoc || docIds[0];
    const stemMap = tw.stemMap || {};
    const lemmaMap = tw.lemmaMap || {};

    /* decimal separator follows the surface language (RU/TT use the comma, §2 of style-ru.md).
       render() re-runs on a language switch, so this re-reads on every swap. */
    const decMark = () => {
      const l = (typeof document !== 'undefined' && document.documentElement
        ? (document.documentElement.dataset.lang || document.documentElement.lang || 'en') : 'en').slice(0, 2);
      return (l === 'ru' || l === 'tt') ? ',' : '.';
    };
    /* Print a datum EXACTLY as data/l20-ru.json holds it: 4 decimals, trailing zeros trimmed, at
       least one decimal kept (0.0 → "0.0", 0.539 → "0.539", 1.3608 → "1.3608"). No arithmetic. */
    const num = (v) => {
      if (typeof v !== 'number' || !isFinite(v)) return '—';
      let s = v.toFixed(4);
      if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '.0');
      return s.replace('.', decMark());
    };
    const tmpl = (s, vals) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vals[k] != null ? vals[k] : ''));
    const words = (id) => String(docText[id] || '').split(/\s+/).filter(Boolean);

    // ── the three modes, in the order the student meets them ──────────────────────────────────
    const MODES = [
      { key: 'surface', name: labels.modeSurface, res: tw.surface || {}, terms: bm.query || [],
        norm: (w) => w, cost: labels.cost0 },
      { key: 'stem', name: labels.modeStem, res: tw.stem || {}, terms: tw.queryStems || [],
        norm: (w) => stemMap[w] || w, cost: labels.costStem, map: stemMap, mapTag: labels.mapTagStem },
      { key: 'lemma', name: labels.modeLemma, res: tw.lemma || {}, terms: bm.queryLemmas || [],
        norm: (w) => lemmaMap[w] || w, cost: labels.costLemma, map: lemmaMap, mapTag: labels.mapTagLemma },
    ];
    const modeAt = (k) => (k >= 5 ? 2 : k >= 3 ? 1 : k >= 1 ? 0 : -1);
    const scoredAt = (k) => (k === 2 || k === 4 || k === 6);

    // ranking over the RETRIEVED documents only (score desc, corpus order breaks ties) — the gold
    // document's rank is then taken straight from the data so display and source can never drift.
    const rankMap = (res) => {
      const scores = res.scores || {}, got = res.retrieved || {};
      const out = {};
      docIds.filter((id) => got[id])
        .sort((a, b) => (scores[b] - scores[a]) || (docIds.indexOf(a) - docIds.indexOf(b)))
        .forEach((id, i) => { out[id] = i + 1; });
      if (res.goldRank != null) out[goldId] = res.goldRank;
      return out;
    };

    // the two lexeme families the query lives in — derived from the lemma map, not hand-listed.
    const families = (bm.queryLemmas || []).map((lem) => ({
      lemma: lem,
      forms: Object.keys(lemmaMap).filter((w) => lemmaMap[w] === lem),
    })).filter((f) => f.forms.length > 1);

    // ── static shell ───────────────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'wgt-panel rn-panel';
    host.appendChild(panel);

    const modeRow = document.createElement('div');
    modeRow.className = 'rn-modes';
    const modeChips = MODES.map((m) => {
      const c = document.createElement('span');
      c.className = 'rn-mode rn-mode--' + m.key;
      c.textContent = m.name || m.key;
      modeRow.appendChild(c);
      return c;
    });
    panel.appendChild(modeRow);

    const mkBlock = (cls, tagText) => {
      const b = document.createElement('div');
      b.className = 'rn-block ' + cls;
      const h = document.createElement('div');
      h.className = 'rn-tag';
      h.textContent = tagText || '';
      const body = document.createElement('div');
      body.className = 'rn-body';
      b.appendChild(h); b.appendChild(body);
      panel.appendChild(b);
      return { box: b, head: h, body };
    };

    const qBlock = mkBlock('rn-query', labels.queryTag);
    const mapBlock = mkBlock('rn-map', labels.mapTagStem);
    const postBlock = mkBlock('rn-post', labels.postingsTag);
    const docBlock = mkBlock('rn-docs', labels.docsTag);
    const workBlock = mkBlock('rn-work', labels.workTag);

    const verdict = document.createElement('div');
    verdict.className = 'rn-verdict';
    panel.appendChild(verdict);

    // ── the three-mode comparison (step 6): one bar per mode, gold-document score ───────────────
    const cmp = document.createElement('div');
    cmp.className = 'rn-cmp is-hidden';
    host.appendChild(cmp);

    const cmpTag = document.createElement('div');
    cmpTag.className = 'rn-tag';
    cmpTag.textContent = labels.cmpTag || '';
    cmp.appendChild(cmpTag);

    const CW = 520, ROW = 34, PAD = 14, LAB = 128, BAR0 = LAB + 6, BARW = 300;
    const CH = PAD * 2 + ROW * MODES.length;
    /* No role/aria-label here on purpose: this SVG is only ONE panel of the figure (and it is
       display:none until step 6). The factory puts role="img" + labels.alt on the HOST when no
       descendant claims it, which is the correct scope — the alt describes the whole scene. */
    const svg = el('svg', { viewBox: `0 0 ${CW} ${CH}`, class: 'wgt-svg rn-svg' }, cmp);
    const golds = MODES.map((m) => (typeof m.res.goldScore === 'number' ? m.res.goldScore : 0));
    const gmax = Math.max.apply(null, golds.concat([1])) || 1;
    MODES.forEach((m, i) => {
      const y = PAD + i * ROW;
      el('text', { x: 8, y: y + 17, class: 'rn-cmp-lab' }, svg).textContent = m.name || m.key;
      el('rect', { x: BAR0, y: y + 4, width: BARW, height: 18, rx: 5, class: 'rn-cmp-track' }, svg);
      const w = Math.max(0, Math.round((golds[i] / gmax) * BARW));
      el('rect', { x: BAR0, y: y + 4, width: w, height: 18, rx: 5,
        class: 'rn-cmp-bar rn-cmp-bar--' + m.key }, svg);
      el('text', { x: BAR0 + w + 8, y: y + 17, class: 'rn-cmp-val' }, svg).textContent = num(golds[i]);
    });

    const costRow = document.createElement('div');
    costRow.className = 'rn-cost';
    const costKey = document.createElement('span');
    costKey.className = 'rn-cost-k';
    costKey.textContent = labels.costTag || '';
    costRow.appendChild(costKey);
    MODES.forEach((m) => {
      const c = document.createElement('span');
      c.className = 'rn-cost-c rn-cost-c--' + m.key;
      c.textContent = (m.name || m.key) + ' · ' + (m.cost || '');
      costRow.appendChild(c);
    });
    cmp.appendChild(costRow);

    // ── per-step painters ──────────────────────────────────────────────────────────────────────
    const chip = (parent, text, cls) => {
      const s = document.createElement('span');
      s.className = 'rn-chip' + (cls ? ' ' + cls : '');
      s.textContent = text;
      parent.appendChild(s);
      return s;
    };

    function paintQuery(mi) {
      const b = qBlock.body;
      b.innerHTML = '';
      (bm.query || []).forEach((w) => {
        const c = document.createElement('span');
        c.className = 'rn-chip rn-chip--q' + (mi < 0 ? ' is-idle' : '');
        if (mi <= 0) {
          c.textContent = w;
        } else {
          const n = MODES[mi].norm(w);
          c.innerHTML = `<span class="rn-src">${esc(w)}</span><span class="rn-arr">→</span>` +
            `<span class="rn-dst">${esc(n)}</span>`;
        }
        b.appendChild(c);
      });
    }

    function paintMap(mi) {
      const on = mi >= 1;
      mapBlock.box.classList.toggle('is-hidden', !on);
      if (!on) return;
      const m = MODES[mi];
      mapBlock.head.textContent = m.mapTag || '';
      const b = mapBlock.body;
      b.innerHTML = '';
      const terms = new Set(m.terms);
      families.forEach((fam) => {
        const row = document.createElement('div');
        row.className = 'rn-maprow';
        const distinct = new Set();
        fam.forms.forEach((w) => {
          const n = m.norm(w);
          distinct.add(n);
          const c = document.createElement('span');
          c.className = 'rn-chip rn-chip--map ' + (terms.has(n) ? 'is-hit' : 'is-split');
          c.innerHTML = `<span class="rn-src">${esc(w)}</span><span class="rn-arr">→</span>` +
            `<span class="rn-dst">${esc(n)}</span>`;
          row.appendChild(c);
        });
        const note = document.createElement('span');
        note.className = 'rn-note ' + (distinct.size > 1 ? 'is-bad' : 'is-good');
        note.textContent = distinct.size > 1
          ? tmpl(labels.splitNote, { n: distinct.size })
          : tmpl(labels.collapseNote, { form: m.norm(fam.forms[0]) });
        row.appendChild(note);
        b.appendChild(row);
      });
    }

    function paintPostings(mi) {
      const on = mi >= 0;
      postBlock.box.classList.toggle('is-hidden', !on);
      if (!on) return;
      const m = MODES[mi];
      const b = postBlock.body;
      b.innerHTML = '';
      (m.res.goldWork || []).forEach((w) => {
        const row = document.createElement('div');
        row.className = 'rn-postrow' + (w.df ? '' : ' is-empty');
        const t = document.createElement('span');
        t.className = 'rn-chip rn-chip--term';
        t.textContent = w.t;
        row.appendChild(t);
        const df = document.createElement('span');
        df.className = 'rn-df';
        df.textContent = 'df=' + w.df;
        row.appendChild(df);
        const arr = document.createElement('span');
        arr.className = 'rn-arr';
        arr.textContent = '→';
        row.appendChild(arr);
        const hits = docIds.filter((id) => words(id).map(m.norm).indexOf(w.t) >= 0);
        if (!hits.length) {
          const e = document.createElement('span');
          e.className = 'rn-empty';
          e.textContent = labels.emptyList || '∅';
          row.appendChild(e);
        } else {
          hits.forEach((id) => chip(row, id, 'rn-chip--id'));
        }
        b.appendChild(row);
      });
    }

    function paintDocs(mi, scored) {
      const m = mi >= 0 ? MODES[mi] : null;
      const terms = new Set(m ? m.terms : []);
      const res = m ? m.res : {};
      const ranks = m && scored ? rankMap(res) : {};
      const b = docBlock.body;
      b.innerHTML = '';
      docIds.forEach((id) => {
        const row = document.createElement('div');
        row.className = 'rn-doc';
        if (id === goldId) row.classList.add('is-gold');
        const got = scored && res.retrieved && res.retrieved[id];
        if (scored) row.classList.add(got ? 'is-got' : 'is-out');

        const head = document.createElement('div');
        head.className = 'rn-doc-head';
        const idc = document.createElement('span');
        idc.className = 'rn-doc-id';
        idc.textContent = id;
        head.appendChild(idc);
        if (id === goldId) {
          const g = document.createElement('span');
          g.className = 'rn-gold-tag';
          g.textContent = labels.goldTag || '';
          head.appendChild(g);
        }
        const sc = document.createElement('span');
        sc.className = 'rn-doc-score';
        if (scored) {
          sc.textContent = num(res.scores ? res.scores[id] : 0);
          const rk = document.createElement('span');
          rk.className = 'rn-doc-rank';
          rk.textContent = got ? '#' + ranks[id] : (labels.notRetrieved || '');
          if (!got) rk.classList.add('is-out');
          head.appendChild(rk);
        } else {
          sc.textContent = labels.notScored || '';
          sc.classList.add('is-idle');
        }
        head.appendChild(sc);
        row.appendChild(head);

        const txt = document.createElement('div');
        txt.className = 'rn-doc-text';
        words(id).forEach((w) => {
          const n = m ? m.norm(w) : w;
          const hitp = m ? terms.has(n) : false;
          const c = document.createElement('span');
          c.className = 'rn-chip rn-chip--w' + (hitp ? ' is-hit' : '');
          if (hitp && n !== w) {
            c.innerHTML = `<span class="rn-src">${esc(w)}</span><span class="rn-arr">→</span>` +
              `<span class="rn-dst">${esc(n)}</span>`;
          } else {
            c.textContent = w;
          }
          txt.appendChild(c);
        });
        row.appendChild(txt);
        b.appendChild(row);
      });
    }

    function paintWork(mi, scored) {
      const on = mi >= 0 && scored;
      workBlock.box.classList.toggle('is-hidden', !on);
      if (!on) return;
      const m = MODES[mi];
      const b = workBlock.body;
      b.innerHTML = '';
      const table = document.createElement('div');
      table.className = 'rn-table';
      const head = document.createElement('div');
      head.className = 'rn-trow rn-trow--head';
      ['t', 'tf', 'df', 'idf', 'BM25'].forEach((h) => {
        const c = document.createElement('span');
        c.className = 'rn-tcell';
        c.textContent = h;
        head.appendChild(c);
      });
      table.appendChild(head);
      (m.res.goldWork || []).forEach((w) => {
        const r = document.createElement('div');
        r.className = 'rn-trow' + (w.bm25 ? '' : ' is-zero');
        [w.t, String(w.tf), String(w.df), num(w.idf), num(w.bm25)].forEach((v) => {
          const c = document.createElement('span');
          c.className = 'rn-tcell';
          c.textContent = v;
          r.appendChild(c);
        });
        table.appendChild(r);
      });
      b.appendChild(table);
    }

    function paintVerdict(mi, scored) {
      if (mi < 0) { verdict.textContent = labels.notScored || ''; verdict.className = 'rn-verdict is-idle'; return; }
      const m = MODES[mi];
      if (!scored) {
        verdict.className = 'rn-verdict';
        verdict.textContent = m.key === 'surface' ? (labels.matchNone || '') : (m.mapTag || '');
        return;
      }
      const res = m.res;
      const got = !!res.goldRetrieved;
      verdict.className = 'rn-verdict ' + (got ? (res.goldRank === 1 ? 'is-good' : 'is-mid') : 'is-bad');
      const gold = got
        ? tmpl(labels.goldAt, { rank: res.goldRank, score: num(res.goldScore) })
        : (labels.goldOut || '');
      verdict.textContent = tmpl(labels.retrievedTmpl, { n: res.retrievedCount, N: docIds.length }) + ' · ' + gold;
    }

    // per-step update (the factory clamps k to [0, maxStep] and owns caption + counter)
    return function update(k) {
      const mi = modeAt(k);
      const scored = scoredAt(k);
      modeChips.forEach((c, i) => {
        c.classList.toggle('is-on', i === mi);
        c.classList.toggle('is-done', i < mi);
      });
      paintQuery(mi);
      paintMap(mi);
      paintPostings(mi);
      paintDocs(mi, scored);
      paintWork(mi, scored);
      paintVerdict(mi, scored);
      cmp.classList.toggle('is-hidden', k < 6);
    };
  },
});
