/* pq-quantize/logic.js — L9 'climb-pq' beat: product quantization shrinks a float vector to a handful
   of codebook bytes. A D=8 float32 vector (32 B) → m=4 subvectors of d*=2 → each → the nearest of
   k=256 centroids → a 1-byte index → 4 B/vector → compression 8×. Scale-up rows show 768-d→96 B (32×)
   and 128-d→8 B (64×).

   DRIVER-AGNOSTIC: setStep(k)/maxStep, binds NO keyboard/scroll. The byte/compression numbers come from
   data/l9-pq.json (facts-gated, recomputed by provenance_l9); the example float/index values are
   illustrative decoration (any vector compresses the same way). All human text from i18n `labels`.

   Steps (maxStep = 3):
     0  → the float32 vector: D values, 32 B.                                                s0
     1  → split into m subvectors of d* dims each.                                            s1
     2  → each subvector → its nearest codebook centroid → a 1-byte index → m B.              s2
     3  → totals bar 32 B → 4 B (8×) + the scale-up rows + ADC + representative recall.        s3 */
import { defineWidget, esc } from '../_widget-base.js';

// illustrative D=8 float vector + the m=4 codebook indices it maps to (decorative — not gated numbers).
const VEC = [0.42, -1.13, 0.05, 0.88, -0.30, 0.61, -0.74, 0.19];
const CODES = [37, 201, 9, 154];

export const mountPqQuantize = defineWidget({
  id: 'pq-quantize',
  rootClass: 'pq-root',
  exportName: 'mountPqQuantize',
  maxStep: 3,
  render({ host, data, labels }) {
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
  },
});
