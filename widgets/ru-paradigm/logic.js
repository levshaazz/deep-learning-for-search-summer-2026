/* ru-paradigm/logic.js — L20 «Поиск на русском», act 1: the declension bench.

   ONE Russian lexeme on the left, the inverted index on the right. Step through it and the lexeme
   unfolds into a 6×2 case/number paradigm, the index fills with ten UNRELATED postings lists (df = 1
   each), a query lands on exactly ONE of them — and then lemmatisation folds the ten back into one
   and the same query finds all ten documents. This is the CENTRAL cause of the whole lecture made
   countable: inflection splits the index, normalisation joins it back.

   The part-of-speech segment control is NOT a step: noun 10 · verb 16 · adjective 18 distinct terms,
   so the ten from the case table reads as the LOWER bound it is. Its state lives on host.dataset.pos
   so it survives the factory's repaint (fonts ready / language switch).

   DRIVER-AGNOSTIC: exposes setStep(k)/maxStep and binds NO keyboard and NO scroll — the SLIDE driver
   (deck arrow keys) and the BOOK driver (Scrollama) both call setStep(k). Every number comes from
   data/l20-ru.json (paradigmWidget); every human-readable string comes from `labels`; every colour
   comes from design tokens in style.css.

   STEP MODEL (maxStep = 5):
     0 — the lemma alone, the index empty
     1 — the paradigm unfolds; the repeated cells (nominative = accusative) are marked as repeats
     2 — the index fills: one postings list per distinct form, df = 1 on every one
     3 — a query in one oblique case arrives and lights exactly ONE list of ten
     4 — lemmatisation is switched on: the lists converge onto a single lemma list
     5 — the same query now reaches every document; terms per lexeme drops to one
*/
import { defineWidget } from '../_widget-base.js';

export const mountRuParadigm = defineWidget({
  id: 'ru-paradigm',
  rootClass: 'rp-root',
  exportName: 'mountRuParadigm',
  maxStep: 5,
  render({ host, data, labels }) {
    const pw = (data && data.paradigmWidget) || {};
    const POS = [
      { key: 'noun', name: labels.posNoun, d: pw.noun || {} },
      { key: 'verb', name: labels.posVerb, d: pw.verb || {} },
      { key: 'adj', name: labels.posAdj, d: pw.adjective || {} },
    ].filter((p) => p.d && (p.d.forms || p.d.cells));

    const tmpl = (s, vals) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (vals[k] != null ? vals[k] : ''));
    const uniq = (list) => {
      const seen = new Set(), out = [];
      for (const w of list) if (!seen.has(w)) { seen.add(w); out.push(w); }
      return out;
    };
    // the probe query: the LONGEST surface form of the paradigm (first wins on a tie) — the most
    // heavily inflected one, and for the noun exactly the instrumental plural the lecture uses.
    const probeOf = (forms) => forms.reduce((a, b) => (b.length > a.length ? b : a), forms[0] || '');

    const posIndex = () => {
      const want = host.dataset.pos;
      const i = POS.findIndex((p) => p.key === want);
      return i >= 0 ? i : 0;
    };

    // ── static shell ───────────────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'wgt-panel rp-panel';
    host.appendChild(panel);

    const segRow = document.createElement('div');
    segRow.className = 'rp-seg';
    const segHint = document.createElement('span');
    segHint.className = 'rp-seg-hint';
    segHint.textContent = labels.posHint || '';
    segRow.appendChild(segHint);
    const segBtns = POS.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rp-seg-b';
      b.textContent = p.name || p.key;
      b.addEventListener('click', () => {
        host.dataset.pos = p.key;
        build();
        apply(Number(host.dataset.step) || 0);
      });
      segRow.appendChild(b);
      return b;
    });
    panel.appendChild(segRow);

    const cols = document.createElement('div');
    cols.className = 'rp-cols';
    panel.appendChild(cols);

    const left = document.createElement('div');
    left.className = 'rp-col rp-left';
    cols.appendChild(left);
    const right = document.createElement('div');
    right.className = 'rp-col rp-right';
    cols.appendChild(right);

    // left column
    const lemmaCard = document.createElement('div');
    lemmaCard.className = 'rp-lemma';
    left.appendChild(lemmaCard);
    const formsBox = document.createElement('div');
    formsBox.className = 'rp-forms';
    left.appendChild(formsBox);

    // right column
    const idxTag = document.createElement('div');
    idxTag.className = 'rp-tag';
    idxTag.textContent = labels.indexTag || '';
    right.appendChild(idxTag);
    const counter = document.createElement('div');
    counter.className = 'rp-count';
    right.appendChild(counter);
    const postBox = document.createElement('div');
    postBox.className = 'rp-post';
    right.appendChild(postBox);
    const qRow = document.createElement('div');
    qRow.className = 'rp-q';
    right.appendChild(qRow);
    const recallRow = document.createElement('div');
    recallRow.className = 'rp-recall';
    right.appendChild(recallRow);

    // ── per-part-of-speech build (re-run by the segment control) ───────────────────────────────
    let cur = null;          // { forms, distinct, probe, cells, cellNodes, postNodes, lemmaNode }
    function build() {
      const p = POS[posIndex()];
      segBtns.forEach((b, i) => {
        b.classList.toggle('is-on', i === posIndex());
        b.setAttribute('aria-pressed', i === posIndex() ? 'true' : 'false');
      });

      const forms = p.d.forms || (p.d.cells || []).map((c) => c[2]);
      const distinct = uniq(forms);
      const nTerms = typeof p.d.distinct === 'number' ? p.d.distinct : distinct.length;
      const probe = probeOf(distinct);

      // lemma card
      lemmaCard.innerHTML = '';
      const lt = document.createElement('span');
      lt.className = 'rp-lemma-tag';
      lt.textContent = labels.lemmaTag || '';
      const lw = document.createElement('span');
      lw.className = 'rp-lemma-w';
      lw.textContent = p.d.lemma || '';
      const lm = document.createElement('span');
      lm.className = 'rp-lemma-meta';
      lm.textContent = p.d.slots
        ? tmpl(labels.slotsTmpl, { slots: p.d.slots, distinct: nTerms })
        : tmpl(labels.formsTmpl, { n: forms.length, distinct: nTerms });
      lemmaCard.appendChild(lt);
      lemmaCard.appendChild(lw);
      lemmaCard.appendChild(lm);

      // forms: a case × number grid when the data carries cells, a flat form list otherwise
      formsBox.innerHTML = '';
      const cellNodes = [];
      if (p.d.cells && p.d.cells.length) {
        const cases = uniq(p.d.cells.map((c) => c[0]));
        const nums = uniq(p.d.cells.map((c) => c[1]));
        const grid = document.createElement('div');
        grid.className = 'rp-grid';
        grid.style.gridTemplateColumns = `minmax(0, 1.1fr) repeat(${nums.length}, minmax(0, 1fr))`;
        const head = document.createElement('span');
        head.className = 'rp-gcell rp-gcell--head';
        head.textContent = labels.caseTag || '';
        grid.appendChild(head);
        nums.forEach((n) => {
          const h = document.createElement('span');
          h.className = 'rp-gcell rp-gcell--head';
          h.textContent = n === 'sg' ? (labels.numSg || n) : (labels.numPl || n);
          grid.appendChild(h);
        });
        const seen = new Set();
        cases.forEach((cs) => {
          const rc = document.createElement('span');
          rc.className = 'rp-gcell rp-gcell--case';
          rc.textContent = cs;
          grid.appendChild(rc);
          nums.forEach((n) => {
            const cell = (p.d.cells.find((c) => c[0] === cs && c[1] === n) || [, , ''])[2];
            const node = document.createElement('span');
            node.className = 'rp-gcell rp-gcell--form';
            const w = document.createElement('span');
            w.className = 'rp-gform';
            w.textContent = cell;
            node.appendChild(w);
            const dup = seen.has(cell);
            if (dup) {
              node.classList.add('is-dup');
              const d = document.createElement('span');
              d.className = 'rp-dup';
              d.textContent = labels.dupTag || '';
              node.appendChild(d);
            }
            seen.add(cell);
            grid.appendChild(node);
            cellNodes.push({ node, form: cell, dup });
          });
        });
        formsBox.appendChild(grid);
      } else {
        const list = document.createElement('div');
        list.className = 'rp-list';
        forms.forEach((f) => {
          const node = document.createElement('span');
          node.className = 'rp-gcell rp-gcell--form rp-listform';
          const w = document.createElement('span');
          w.className = 'rp-gform';
          w.textContent = f;
          node.appendChild(w);
          list.appendChild(node);
          cellNodes.push({ node, form: f, dup: false });
        });
        formsBox.appendChild(list);
      }

      // postings: one chip per distinct form (before) + one collapsed lemma chip (after)
      postBox.innerHTML = '';
      const postNodes = distinct.map((f) => {
        const chip = document.createElement('span');
        chip.className = 'rp-plist';
        const t = document.createElement('span');
        t.className = 'rp-pterm';
        t.textContent = f;
        const d = document.createElement('span');
        d.className = 'rp-pdf';
        d.textContent = 'df=1';
        chip.appendChild(t);
        chip.appendChild(d);
        postBox.appendChild(chip);
        return chip;
      });
      const lemmaChip = document.createElement('span');
      lemmaChip.className = 'rp-plist rp-plist--lemma';
      const lct = document.createElement('span');
      lct.className = 'rp-pterm';
      lct.textContent = p.d.lemma || '';
      const lcd = document.createElement('span');
      lcd.className = 'rp-pdf';
      lcd.textContent = 'df=' + nTerms;
      lemmaChip.appendChild(lct);
      lemmaChip.appendChild(lcd);
      postBox.appendChild(lemmaChip);

      const empty = document.createElement('span');
      empty.className = 'rp-empty';
      empty.textContent = labels.emptyIndex || '';
      postBox.appendChild(empty);

      // query row
      qRow.innerHTML = '';
      const qt = document.createElement('span');
      qt.className = 'rp-qtag';
      qt.textContent = labels.queryTag || '';
      const qw = document.createElement('span');
      qw.className = 'rp-qw';
      qw.textContent = probe;
      qRow.appendChild(qt);
      qRow.appendChild(qw);

      cur = { forms, distinct, nTerms, probe, cellNodes, postNodes, lemmaChip, empty };
    }

    // ── per-step painting ──────────────────────────────────────────────────────────────────────
    function apply(k) {
      const c = cur;
      const folded = k >= 4;              // lemmatisation switched on
      const asked = k >= 3;               // the query has arrived
      formsBox.classList.toggle('is-hidden', k < 1);
      lemmaCard.classList.toggle('is-lit', k >= 1);

      c.cellNodes.forEach((cell) => {
        cell.node.classList.toggle('is-on', k >= 1 && !cell.dup);
        cell.node.classList.toggle('is-hit', asked && cell.form === c.probe);
      });

      c.empty.classList.toggle('is-hidden', k >= 2);
      c.postNodes.forEach((chip) => {
        chip.classList.toggle('is-hidden', k < 2 || folded);
        chip.classList.toggle('is-hit', asked && !folded && chip.querySelector('.rp-pterm').textContent === c.probe);
        chip.classList.toggle('is-dim', asked && !folded && chip.querySelector('.rp-pterm').textContent !== c.probe);
      });
      c.lemmaChip.classList.toggle('is-hidden', !folded);
      c.lemmaChip.classList.toggle('is-hit', k >= 5);

      counter.classList.toggle('is-hidden', k < 2);
      counter.textContent = tmpl(labels.termsTmpl, { n: folded ? 1 : c.nTerms });
      counter.classList.toggle('is-good', folded);

      qRow.classList.toggle('is-hidden', !asked);
      recallRow.classList.toggle('is-hidden', !asked);
      const hit = k >= 5 ? c.nTerms : 1;
      recallRow.textContent = tmpl(labels.recallTmpl, { hit, all: c.nTerms });
      recallRow.classList.toggle('is-good', k >= 5);
      recallRow.classList.toggle('is-bad', asked && k < 5);
    }

    build();
    // per-step update (the factory clamps k to [0, maxStep] and owns caption + counter)
    return function update(k) { apply(k); };
  },
});
