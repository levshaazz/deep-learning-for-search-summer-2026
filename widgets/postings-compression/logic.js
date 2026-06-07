/* postings-compression/logic.js — L3 'climb-compression' beat: watch gap-encoding +
   variable-byte coding shrink a postings list from 16 bytes to 4.

   DRIVER-AGNOSTIC (REFERENCE_IMPL_L2 a.6): exposes setStep(k)/maxStep and renders for any step.
   It binds NO keyboard and NO scroll — the SLIDE driver (deck arrow keys) and the BOOK driver
   (Scrollama) both call setStep(k). All numbers come from data/l3-compression.json (the same
   worked example the deck + facts-gate use); all human text comes from i18n keys in `labels`.

   Built on the shared widgets/_widget-base.js factory: it owns the wgt-root/wgt-fade host setup,
   the caption/counter scaffold, the setStep clamp + host.dataset.step, esc() and the
   window.mountPostingsCompression registration; render() below only draws the figure layers and
   returns the per-step update.

   Steps (maxStep = 3):
     0  → raw sorted doc IDs, each a full 32-bit (4-byte) integer → 16 bytes naive.   caption s0
     1  → turn IDs into GAPS (Δ between neighbours): 3, +5, +4, +18.                   caption s1
     2  → variable-byte encode each gap: 8-bit box = 1 continuation + 7 data bits.     caption s2
     3  → totals bar: 16 bytes → 4 bytes, the compression factor (4×).                 caption s3 */
import { defineWidget, esc } from '../_widget-base.js';

export const mountPostingsCompression = defineWidget({
  id: 'postings-compression',
  rootClass: 'pc-root',
  maxStep: 3,
  render({ host, data, labels }) {
    const ids = data.docIds || [];
    const gaps = data.gaps || [];
    const rawPer = data.rawBytesPerId || [];
    const vbPer = data.varbyteBytesPerGap || [];
    const rawTotal = data.rawBytesTotal != null ? data.rawBytesTotal
      : rawPer.reduce((a, b) => a + b, 0);
    const vbTotal = data.varbyteBytesTotal != null ? data.varbyteBytesTotal
      : vbPer.reduce((a, b) => a + b, 0);
    const ratio = data.compressionRatio != null ? data.compressionRatio
      : (vbTotal ? rawTotal / vbTotal : 0);
    const layout = data.byteLayout || {};
    const dataBits = layout.bitsPerByte || 7;          // 7 data bits per byte

    const fmtRatio = (r) => (Number.isInteger(r) ? String(r) : r.toFixed(1));
    // 7-bit binary string for the data payload of a single-byte gap (gaps here are all < 128).
    const dataBin = (n) => (n & 0x7f).toString(2).padStart(dataBits, '0');

    const panel = document.createElement('div');
    panel.className = 'wgt-panel pc-panel';
    host.appendChild(panel);

    // generic labelled row builder (head + a flex strip of chips)
    function row(cls, headKey) {
      const r = document.createElement('div');
      r.className = `pc-row ${cls}`;
      const head = document.createElement('div');
      head.className = 'pc-head';
      head.textContent = labels[headKey] || '';
      r.appendChild(head);
      const strip = document.createElement('div');
      strip.className = 'pc-strip';
      r.appendChild(strip);
      panel.appendChild(r);
      return { r, strip };
    }

    // ── row 1: raw doc IDs (each a 32-bit / 4-byte integer) ────────────────────
    const rawRow = row('pc-raw', 'rawHead');
    ids.forEach((id, i) => {
      const cell = document.createElement('div');
      cell.className = 'pc-cell pc-id';
      cell.innerHTML =
        `<span class="pc-num">${esc(id)}</span>` +
        `<span class="pc-sz">${esc(rawPer[i] != null ? rawPer[i] : 4)} ${esc(labels.bytesLabel || 'B')}</span>`;
      rawRow.strip.appendChild(cell);
    });

    // ── row 2: gaps (Δ between consecutive IDs; first entry = the base ID) ──────
    const gapRow = row('pc-gap', 'gapHead');
    gaps.forEach((g, i) => {
      const cell = document.createElement('div');
      cell.className = 'pc-cell pc-delta';
      // first gap is the base id itself; the rest are deltas, shown with a leading +
      cell.innerHTML =
        `<span class="pc-num">${i === 0 ? esc(g) : '+' + esc(g)}</span>`;
      gapRow.strip.appendChild(cell);
    });

    // ── row 3: variable-byte encoded bytes (8 bit-cells: 1 continuation + 7 data)
    const vbRow = row('pc-vbyte', 'vbyteHead');
    gaps.forEach((g, i) => {
      const cell = document.createElement('div');
      cell.className = 'pc-cell pc-byte';
      const bits = document.createElement('div');
      bits.className = 'pc-bits';
      // continuation bit (0 → no further byte) then the 7 data bits
      const cont = document.createElement('span');
      cont.className = 'pc-bit pc-bit-cont';
      cont.textContent = '0';
      cont.title = labels.contLabel || 'continuation';
      bits.appendChild(cont);
      for (const ch of dataBin(g)) {
        const b = document.createElement('span');
        b.className = 'pc-bit pc-bit-data';
        b.textContent = ch;
        bits.appendChild(b);
      }
      cell.appendChild(bits);
      const sz = document.createElement('span');
      sz.className = 'pc-sz';
      sz.textContent = `${vbPer[i] != null ? vbPer[i] : 1} ${labels.bytesLabel || 'B'}`;
      cell.appendChild(sz);
      vbRow.strip.appendChild(cell);
    });

    // ── totals bar: naive 16 B  →  packed 4 B  (×ratio) ────────────────────────
    const totals = document.createElement('div');
    totals.className = 'pc-totals';
    totals.innerHTML =
      `<span class="pc-total pc-total-naive">` +
        `<span class="pc-total-lbl">${esc(labels.naiveLabel || 'naive')}</span>` +
        `<span class="pc-total-val">${esc(rawTotal)} ${esc(labels.bytesLabel || 'B')}</span>` +
      `</span>` +
      `<span class="pc-total-arrow">→</span>` +
      `<span class="pc-total pc-total-packed">` +
        `<span class="pc-total-lbl">${esc(labels.packedLabel || 'packed')}</span>` +
        `<span class="pc-total-val">${esc(vbTotal)} ${esc(labels.bytesLabel || 'B')}</span>` +
      `</span>` +
      `<span class="pc-ratio">${esc(fmtRatio(ratio))}×</span>`;
    panel.appendChild(totals);

    // per-step update (factory clamps k to [0,maxStep] and owns caption/counter)
    return function update(k) {
      // cumulative reveal: gaps from step 1, bytes from step 2, totals from step 3
      gapRow.r.classList.toggle('is-hidden', k < 1);
      vbRow.r.classList.toggle('is-hidden', k < 2);
      totals.classList.toggle('is-hidden', k < 3);
      // the raw row dims once gaps replace it as the thing of interest
      rawRow.r.classList.toggle('is-faded', k >= 1);
      // pop the packed total when the ratio lands
      totals.classList.toggle('is-final', k >= 3);
    };
  },
});
