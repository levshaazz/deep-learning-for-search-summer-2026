/* query-rewriter/logic.js — L14 "The Artificer's Quill" · the technique-comparison centerpiece.
   DRIVER-AGNOSTIC: setStep/maxStep, binds no input. Reads data/l14-rewrite.json — steps 0..2 show one
   rewrite technique each (raw → RM3 → HyDE): the toy corpus reranked by that technique, with the gold
   passage's rank, reciprocal rank (RR = 1/rank), and its LLM-call cost; step 3 compares RR against
   cost across all three. Every number from data, every string from i18n. maxStep = 3.

   Built on the shared widgets/_widget-base.js factory (default scaffold): the factory owns the host
   setup, caption/counter, setStep clamp + host.dataset.step, esc()/fmt(), and window.mountQueryRewriter
   registration; render() draws the panels and returns update(step) (a SWAP, not a cumulative reveal). */
import { defineWidget } from '../_widget-base.js';

const TECHS = ['raw', 'rm3', 'hyde'];

export const mountQueryRewriter = defineWidget({
  id: 'query-rewriter',
  rootClass: 'qrw-root',
  maxStep: 3,
  render({ host, data, labels, esc, fmt }) {
    host.classList.add('wgt-panel');   // the responsive-gate's laid-out-figure hook (always-visible container)
    const T = data.techniques || {};
    const gold = data.goldDocId, trap = data.trapDocId;
    const corpus = data.corpus || {};
    const name = { raw: labels.techRaw || 'raw', rm3: labels.techRm3 || 'RM3', hyde: labels.techHyde || 'HyDE' };

    // persistent skeleton (repainted by update)
    const head = document.createElement('div'); head.className = 'qrw-head'; host.appendChild(head);
    const body = document.createElement('div'); body.className = 'qrw-body'; host.appendChild(body);
    const listCol = document.createElement('div'); listCol.className = 'qrw-list'; body.appendChild(listCol);
    const detail = document.createElement('div'); detail.className = 'qrw-detail'; body.appendChild(detail);
    const compare = document.createElement('div'); compare.className = 'qrw-compare is-hidden'; host.appendChild(compare);

    const gloss = (id) => (corpus[id] || []).slice(0, 2).join(', ');

    function renderTech(t) {
      const info = T[t] || {};
      head.innerHTML = '';
      const tag = document.createElement('span'); tag.className = 'qrw-tech'; tag.textContent = name[t]; head.appendChild(tag);
      const metrics = document.createElement('span'); metrics.className = 'qrw-metrics';
      metrics.innerHTML = `${esc(labels.rankWord || 'gold rank')} <b>${info.goldRank}</b>`
        + ` · ${esc(labels.rrWord || 'RR')} <b>${fmt(info.rr, 2)}</b>`
        + ` · <span class="qrw-cost">${info.llmCalls} ${esc(labels.callsWord || 'LLM calls')}</span>`;
      head.appendChild(metrics);

      listCol.innerHTML = '';
      (info.rankedList || []).forEach((id, i) => {
        const row = document.createElement('div'); row.className = 'qrw-row';
        if (id === gold) row.classList.add('is-gold');
        if (id === trap) row.classList.add('is-trap');
        let tagHtml = '';
        if (id === gold) tagHtml = `<span class="qrw-tag qrw-tag-gold">${esc(labels.goldTag || 'gold')}</span>`;
        else if (id === trap) tagHtml = `<span class="qrw-tag qrw-tag-trap">${esc(labels.trapTag || 'trap')}</span>`;
        row.innerHTML = `<span class="qrw-rank">${i + 1}</span><span class="qrw-doc">${esc(id)}</span>`
          + `<span class="qrw-gloss">${esc(gloss(id))}</span>${tagHtml}`;
        listCol.appendChild(row);
      });

      let dlabel = labels.queryWord || 'query', dtext = data.query || '';
      if (t === 'rm3') { dlabel = labels.addedWord || 'RM3 added terms'; dtext = (info.addedTerms || []).join(', '); }
      else if (t === 'hyde') { dlabel = labels.pseudoWord || 'HyDE hypothetical answer'; dtext = info.hypotheticalDoc || ''; }
      detail.innerHTML = `<div class="qrw-dlabel">${esc(dlabel)}</div><div class="qrw-dtext">${esc(dtext)}</div>`;
    }

    function renderCompare() {
      compare.innerHTML = `<div class="qrw-ctitle">${esc(labels.compareTitle || 'RR vs cost')}</div>`;
      TECHS.forEach((t) => {
        const info = T[t] || {};
        const rr = info.rr || 0, calls = info.llmCalls || 0;
        const row = document.createElement('div'); row.className = 'qrw-bar-row';
        row.innerHTML = `<span class="qrw-blabel">${esc(name[t])}</span>`
          + `<span class="qrw-bar"><span class="qrw-bar-fill${t === 'hyde' ? ' is-best' : ''}" style="width:${Math.round(rr * 100)}%"></span></span>`
          + `<span class="qrw-bval">${esc(labels.rrWord || 'RR')} ${fmt(rr, 2)} · ${'✦'.repeat(calls) || '—'}</span>`;
        compare.appendChild(row);
      });
    }

    return function update(k) {
      const compareOn = (k >= 3);
      head.classList.toggle('is-hidden', compareOn);
      body.classList.toggle('is-hidden', compareOn);
      compare.classList.toggle('is-hidden', !compareOn);
      if (compareOn) renderCompare();
      else renderTech(TECHS[Math.max(0, Math.min(2, k))]);
    };
  },
});
