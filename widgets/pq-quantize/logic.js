/* pq-quantize/logic.js — L9 'climb-pq' beat: product quantization shrinks a float vector to a handful
   of codebook bytes. A D=8 float32 vector (32 B) → m=4 subvectors of d*=2 → each → the nearest of
   k=256 centroids → a 1-byte index → 4 B/vector → compression 8×. Scale-up rows show 768-d→96 B (32×)
   and 128-d→8 B (64×).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. The byte/compression numbers come from
   data/l9-pq.json (facts-gated, recomputed by provenance_l9); the example float/index values are
   illustrative decoration (any vector compresses the same way). All human text from i18n `labels`.

   VARIANTS (backward-compatible, dispatched on labels.variant like hnsw-graph's toy/toy2):
     • DEFAULT (no variant)  — the original ENCODE path. UNCHANGED, byte-identical render. maxStep 3.
         0 → the float32 vector: D values, 32 B.                                              s0
         1 → split into m subvectors of d* dims each.                                          s1
         2 → each subvector → its nearest codebook centroid → a 1-byte index → m B.            s2
         3 → totals bar 32 B → 4 B (8×) + the scale-up rows + ADC + representative recall.      s3
     • variant === 'adc'     — the ADC-table panel over data.adcWorked (a 4×4 squared-sub-distance
         table). Traces one code per subspace down to a cell, sums to adcDistance, contrasts with
         exactDistance (the small quantization error). maxStep 3, reveals one subspace row per step.
         0 → the table + subqueries + the db vector's codes, nothing traced yet.                a0
         1 → trace subspace 0 (code 2): light its row + the chosen cell.                        a1
         2 → trace subspaces 0..2.                                                              a2
         3 → all 4 traced → sum = adcDistance, contrasted with exactDistance (gap = quant err). a3
     • variant === 'memory'  — step through data.memoryConfigs.configs (each {dim,m,k,bitsPerCode,
         bytesPQ,bytesFloat32,compression,indexGB_at_1e9}); one config per step, showing bytes/vector
         + compression. maxStep = configs.length-1; each step reveals (and focuses) one more config. */
import { defineWidget, esc } from '../_widget-base.js';

// illustrative D=8 float vector + the m=4 codebook indices it maps to (decorative — not gated numbers).
const VEC = [0.42, -1.13, 0.05, 0.88, -0.30, 0.61, -0.74, 0.19];
const CODES = [37, 201, 9, 154];

export const mountPqQuantize = defineWidget({
  id: 'pq-quantize',
  rootClass: 'pq-root',
  exportName: 'mountPqQuantize',
  maxStep: 3,
  render(ctx) {
    const v = ctx.labels && ctx.labels.variant;
    if (v === 'adc') return renderAdc(ctx);
    if (v === 'memory') return renderMemory(ctx);
    return renderEncode(ctx);
  },
});

// ── DEFAULT: the original encode path (UNCHANGED — byte-identical render) ──
function renderEncode({ host, data, labels }) {
    const toy = data.toy || data;
    const D = toy.D || 8, m = toy.m || 4, dStar = toy.dStar || (D / m), k = toy.k || 256;
    const bF32 = toy.bytesFloat32 != null ? toy.bytesFloat32 : D * 4;
    const bPQ = toy.bytesPQ != null ? toy.bytesPQ : m;
    const comp = toy.compression != null ? toy.compression : Math.round(bF32 / bPQ);
    const scale = data.scale || [];
    const rep = data.recallRepresentative || {};
    const B = labels.bytes || 'B';

    const panel = document.createElement('div');
    panel.className = 'wgt-panel pq-panel';
    host.appendChild(panel);

    function row(cls, headKey) {
      const r = document.createElement('div');
      r.className = `pq-row ${cls}`;
      const head = document.createElement('div');
      head.className = 'pq-head';
      head.textContent = labels[headKey] || '';
      r.appendChild(head);
      const strip = document.createElement('div');
      strip.className = 'pq-strip';
      r.appendChild(strip);
      panel.appendChild(r);
      return { r, strip };
    }
    const sizeTag = (n) => `<span class="pq-sz">${esc(n)} ${esc(B)}</span>`;

    // ── row 1: the float32 vector (D cells) ──
    const floatRow = row('pq-floats', 'floatHead');
    VEC.slice(0, D).forEach((v) => {
      const c = document.createElement('div');
      c.className = 'pq-cell pq-float';
      c.textContent = (v >= 0 ? '+' : '') + v.toFixed(2);
      floatRow.strip.appendChild(c);
    });
    floatRow.strip.insertAdjacentHTML('beforeend', sizeTag(bF32));

    // ── row 2: m subvectors of d* dims ──
    const subRow = row('pq-subs', 'subHead');
    for (let s = 0; s < m; s++) {
      const c = document.createElement('div');
      c.className = 'pq-cell pq-sub';
      c.textContent = '[' + VEC.slice(s * dStar, s * dStar + dStar).map((v) => v.toFixed(2)).join(', ') + ']';
      subRow.strip.appendChild(c);
    }

    // ── row 3: codebook indices (1 byte each) ──
    const codeRow = row('pq-codes', 'codeHead');
    CODES.slice(0, m).forEach((idx) => {
      const c = document.createElement('div');
      c.className = 'pq-cell pq-code';
      c.innerHTML = `<span class="pq-num">#${esc(idx)}</span><span class="pq-bits">1 ${esc(B)}</span>`;
      codeRow.strip.appendChild(c);
    });
    codeRow.strip.insertAdjacentHTML('beforeend', sizeTag(bPQ));

    // ── totals bar: 32 B → 4 B (×comp) ──
    const totals = document.createElement('div');
    totals.className = 'pq-totals';
    totals.innerHTML =
      `<span class="pq-total pq-total-naive"><span class="pq-total-lbl">${esc(labels.floatLbl || 'float32')}</span>` +
      `<span class="pq-total-val">${esc(bF32)} ${esc(B)}</span></span>` +
      `<span class="pq-total-arrow">→</span>` +
      `<span class="pq-total pq-total-packed"><span class="pq-total-lbl">PQ</span>` +
      `<span class="pq-total-val">${esc(bPQ)} ${esc(B)}</span></span>` +
      `<span class="pq-ratio">${esc(comp)}×</span>`;
    panel.appendChild(totals);

    // ── scale-up + ADC + representative recall (step 3) ──
    const extra = document.createElement('div');
    extra.className = 'pq-extra';
    const scaleStr = scale.map((s) => `${esc(s.dim)}-d → ${esc(s.bytesPQ)} ${esc(B)} (${esc(s.compression)}×)`).join(' · ');
    extra.innerHTML =
      `<div class="pq-scale">${labels.scaleLbl || 'at scale'}: ${scaleStr}</div>` +
      `<div class="pq-adc">${esc(labels.adc || 'ADC: an m×k distance table turns search into table lookups')} ` +
      `(${esc(m)}×${esc(k)})</div>` +
      (rep.m4 != null ? `<div class="pq-rep">${esc(labels.recallLbl || 'representative recall@1 (PQ-m4 vs exact)')}: ≈ ${esc(rep.m4)}</div>` : '');
    panel.appendChild(extra);

    return function update(k2) {
      subRow.r.classList.toggle('is-hidden', k2 < 1);
      codeRow.r.classList.toggle('is-hidden', k2 < 2);
      totals.classList.toggle('is-hidden', k2 < 3);
      extra.classList.toggle('is-hidden', k2 < 3);
      floatRow.r.classList.toggle('is-faded', k2 >= 2);
      totals.classList.toggle('is-final', k2 >= 3);
    };
}

/* ── variant 'adc': ADC-table panel over data.adcWorked ──
   adcTable is m×k (here 4×4) of SQUARED L2 sub-distances; the db vector's `codes` pick one cell per
   subspace; summing those cells = adcDistance (distance to the RECONSTRUCTION), an approximation of
   exactDistance (to the true vector). The gap is the quantization error. We reveal one subspace row
   per step so the slide-viz step gate sees a real left-to-right trace. */
function renderAdc({ host, data, labels }) {
    const w = (data.adcWorked) || (data.toy && data.toy.adcWorked) || {};
    const table = w.adcTable || [];
    const codes = w.codes || [];
    const subq = w.subqueries || [];
    const m = w.m || table.length || 0;
    const k = w.k || (table[0] ? table[0].length : 0);
    const adcDistance = w.adcDistance;
    const exactDistance = w.exactDistance;

    const panel = document.createElement('div');
    panel.className = 'wgt-panel pq-panel pq-adc-panel';
    host.appendChild(panel);

    // header line: what the table is.
    const head = document.createElement('div');
    head.className = 'pq-adc-head';
    head.textContent = `${labels.adcTableHead || 'ADC distance table'} (${m}×${k})`;
    panel.appendChild(head);

    // the table: rows = subspaces j, columns = centroid index c. cell[j][c] = squared sub-distance.
    const tbl = document.createElement('table');
    tbl.className = 'pq-adc-table';
    // column header: centroid indices c = 0..k-1
    const thead = document.createElement('tr');
    thead.className = 'pq-adc-colhdr';
    const corner = document.createElement('th');
    corner.className = 'pq-adc-corner';
    corner.textContent = labels.adcSubspace || 'subspace';
    thead.appendChild(corner);
    for (let c = 0; c < k; c++) {
      const th = document.createElement('th');
      th.className = 'pq-adc-ch';
      th.textContent = 'c' + c;
      thead.appendChild(th);
    }
    tbl.appendChild(thead);

    // one row per subspace; remember each row + each cell so we can light the chosen one.
    const rowEls = [];
    const cellEls = [];
    table.forEach((rowVals, j) => {
      const tr = document.createElement('tr');
      tr.className = 'pq-adc-row';
      const rh = document.createElement('td');
      rh.className = 'pq-adc-rh';
      const sq = subq[j] ? `[${subq[j].join(', ')}]` : '';
      rh.innerHTML = `<span class="pq-adc-jlbl">j=${esc(j)}</span> <span class="pq-adc-subq">${esc(sq)}</span>`;
      tr.appendChild(rh);
      const cells = [];
      rowVals.forEach((val, c) => {
        const td = document.createElement('td');
        td.className = 'pq-adc-cell';
        td.textContent = String(val);
        if (codes[j] === c) td.classList.add('pq-adc-iscode');   // the centroid this db vector stored
        tr.appendChild(td);
        cells.push(td);
      });
      tbl.appendChild(tr);
      rowEls.push(tr);
      cellEls.push(cells);
    });
    panel.appendChild(tbl);

    // running trace: codes[j] → adcTable[j][codes[j]], accumulating to adcDistance.
    const trace = document.createElement('div');
    trace.className = 'pq-adc-trace';
    panel.appendChild(trace);

    // result line: adcDistance vs exactDistance + the quantization-error gap.
    const result = document.createElement('div');
    result.className = 'pq-adc-result';
    panel.appendChild(result);

    function renderTrace(upto) {
      const parts = [];
      let running = 0;
      for (let j = 0; j < Math.min(upto, m); j++) {
        const val = table[j][codes[j]];
        running += val;
        parts.push(`<span class="pq-adc-term">table[${esc(j)}][c${esc(codes[j])}] = ${esc(val)}</span>`);
      }
      trace.innerHTML = parts.length
        ? `${esc(labels.adcSum || 'sum of looked-up cells')}: ${parts.join(' <span class="pq-adc-plus">+</span> ')}`
          + (upto >= m ? ` <span class="pq-adc-eq">= ${esc(running)}</span>` : '')
        : (labels.adcStart || 'one squared sub-distance per (subspace, centroid); trace the stored codes →');
    }

    return function update(k2) {
      // maxStep 3, m=4 subspaces → trace upto = k2+1 rows (step 0 → row 0; step 3 → all 4 rows + the
      // final sum). One MORE chosen cell lights up each step (left→right reveal the step gate reads as
      // real progress), and the ADC↔exact contrast lands once every subspace is traced.
      const upto = Math.min(k2 + 1, m);
      rowEls.forEach((tr, j) => tr.classList.toggle('is-active', j < upto));
      cellEls.forEach((cells, j) => cells.forEach((td) => {
        const chosen = (codes[j] === [...cells].indexOf(td)) && j < upto;
        td.classList.toggle('is-traced', chosen);
      }));
      renderTrace(upto);
      // the final sum + exact contrast appears once all m subspaces are traced (k2 >= m, i.e. step 3).
      const done = upto >= m;
      result.classList.toggle('is-hidden', !done);
      if (done && adcDistance != null) {
        const gap = (exactDistance != null) ? (exactDistance - adcDistance) : null;
        result.innerHTML =
          `<span class="pq-adc-adc">ADC = ${esc(adcDistance)}</span>` +
          (exactDistance != null
            ? ` <span class="pq-adc-vs">${esc(labels.adcVs || 'vs')}</span>` +
              ` <span class="pq-adc-exact">${esc(labels.adcExact || 'exact')} = ${esc(exactDistance)}</span>` +
              (gap != null ? ` <span class="pq-adc-gap">(${esc(labels.adcErr || 'quantization error')} = ${esc(gap)})</span>` : '')
            : '');
      }
    };
}

/* ── variant 'memory': step through data.memoryConfigs.configs ──
   one config per step; each {dim,m,k,bitsPerCode,bytesPQ,bytesFloat32,compression,indexGB_at_1e9}.
   Reveals (and focuses) one more config card per step so the step gate sees a real reveal. */
function renderMemory({ host, data, labels }) {
    const mc = (data.memoryConfigs) || (data.toy && data.toy.memoryConfigs) || {};
    const configs = mc.configs || [];
    const B = labels.bytes || 'B';

    const panel = document.createElement('div');
    panel.className = 'wgt-panel pq-panel pq-mem-panel';
    host.appendChild(panel);

    const head = document.createElement('div');
    head.className = 'pq-mem-head';
    head.textContent = labels.memHead || 'PQ memory ledger — bytes/vector and compression';
    panel.appendChild(head);

    const cards = configs.map((cfg, i) => {
      const card = document.createElement('div');
      card.className = 'pq-mem-card is-hidden';
      card.innerHTML =
        `<div class="pq-mem-cfg">dim ${esc(cfg.dim)} · m ${esc(cfg.m)} · k ${esc(cfg.k)} ` +
          `(${esc(cfg.bitsPerCode)} ${esc(labels.memBits || 'bits/code')})</div>` +
        `<div class="pq-mem-bytes">` +
          `<span class="pq-mem-f32">${esc(cfg.bytesFloat32)} ${esc(B)}</span>` +
          `<span class="pq-mem-arrow">→</span>` +
          `<span class="pq-mem-pq">${esc(cfg.bytesPQ)} ${esc(B)}/${esc(labels.memVec || 'vec')}</span>` +
          `<span class="pq-mem-comp">${esc(cfg.compression)}×</span>` +
        `</div>` +
        (cfg.indexGB_at_1e9 != null
          ? `<div class="pq-mem-idx">${esc(labels.memIndex || 'index @ 1e9 vectors')}: ${esc(cfg.indexGB_at_1e9)} GB</div>`
          : '');
      panel.appendChild(card);
      return card;
    });

    return function update(k2) {
      cards.forEach((card, i) => {
        card.classList.toggle('is-hidden', i > k2);
        card.classList.toggle('is-focus', i === k2);
      });
    };
}
