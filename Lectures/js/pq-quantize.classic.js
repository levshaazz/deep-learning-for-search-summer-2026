/* AUTO-GENERATED offline classic bundle of widgets/pq-quantize/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
(() => {
  // widgets/_widget-base.js
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  }
  function fmt(n, digits = 6) {
    if (typeof n !== "number" || !isFinite(n)) return "";
    return Number.isInteger(n) ? String(n) : n.toFixed(digits);
  }
  function mountName(id) {
    return "mount" + String(id).split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
  }
  function defineWidget({
    id,
    maxStep,
    render,
    rootClass,
    exportName,
    fade = true,
    bareRoot = false,
    scaffold = true
  }) {
    const MAX = maxStep;
    const cls = rootClass || `${id}-root`;
    function mount(host, { data, labels = {}, ...rest } = {}) {
      if (bareRoot) {
        host.classList.add(cls);
      } else {
        host.classList.add("wgt-root", cls);
        if (fade) host.classList.add("wgt-fade");
      }
      host.innerHTML = "";
      const base = { ...labels };
      const active = labels;
      const i18nAll = rest && rest.i18nAll && typeof rest.i18nAll === "object" ? rest.i18nAll : null;
      const ctx = { host, data, labels: active, el: svgEl, svg: svgEl, esc, fmt, maxStep: MAX, ...rest };
      let cap = null, counter = null;
      if (scaffold) {
        cap = document.createElement("div");
        cap.className = "wgt-caption";
        counter = document.createElement("div");
        counter.className = "wgt-counter";
      }
      const rendered = () => host.getClientRects().length > 0;
      let dirty = false;
      let update = null;
      function paint() {
        if (!rendered()) {
          dirty = true;
          return;
        }
        dirty = false;
        host.innerHTML = "";
        update = render(ctx);
        if (active.alt && !host.querySelector('[role="img"]')) {
          host.setAttribute("role", "img");
          host.setAttribute("aria-label", active.alt);
        }
        if (scaffold) {
          host.appendChild(cap);
          host.appendChild(counter);
        }
      }
      paint();
      let step = -1;
      function setStep(k) {
        k = Math.max(0, Math.min(MAX, k | 0));
        let same = k === step;
        step = k;
        host.dataset.step = String(k);
        if (dirty) {
          paint();
          same = false;
        }
        if (typeof update === "function" && !same) update(k);
        if (scaffold) {
          cap.textContent = active["s" + k] || "";
          counter.textContent = `${k} / ${MAX}`;
        }
      }
      setStep(0);
      if (typeof document !== "undefined" && document.fonts && document.fonts.status !== "loaded") {
        document.fonts.ready.then(() => {
          const at = step;
          paint();
          step = -1;
          setStep(at);
          lockCaptionHeight();
        });
      }
      function lockCaptionHeight() {
        if (!scaffold || !cap || cap.offsetParent === null) return;
        const langs = i18nAll ? Object.values(i18nAll) : [active];
        const prevText = cap.textContent, prevMin = cap.style.minHeight;
        cap.style.minHeight = "0px";
        let max = 0;
        for (const L of langs) for (let k = 0; k <= MAX; k++) {
          cap.textContent = L && L["s" + k] || "";
          const h = cap.getBoundingClientRect().height;
          if (h > max) max = h;
        }
        cap.textContent = prevText;
        cap.style.minHeight = max > 0 ? Math.ceil(max) + "px" : prevMin;
      }
      lockCaptionHeight();
      let obs = null;
      if (typeof MutationObserver === "function" && typeof document !== "undefined" && document.documentElement) {
        const rootEl = document.documentElement;
        const pickLang = () => (rootEl.dataset.lang || rootEl.lang || "en").slice(0, 2);
        let curLang = pickLang();
        obs = new MutationObserver(() => {
          const lang = pickLang();
          if (lang === curLang) return;
          curLang = lang;
          if (i18nAll && i18nAll[lang]) {
            for (const k of Object.keys(active)) delete active[k];
            Object.assign(active, base, i18nAll[lang]);
            const at = step;
            paint();
            step = -1;
            setStep(at);
          }
          lockCaptionHeight();
        });
        obs.observe(rootEl, { attributes: true, attributeFilter: ["data-lang", "lang"] });
      }
      return {
        setStep,
        get step() {
          return step;
        },
        get maxStep() {
          return MAX;
        },
        root: host,
        relock: lockCaptionHeight,
        destroy() {
          if (obs) obs.disconnect();
        }
      };
    }
    if (typeof window !== "undefined") window[exportName || mountName(id)] = mount;
    return mount;
  }

  // widgets/pq-quantize/logic.js
  var VEC = [0.42, -1.13, 0.05, 0.88, -0.3, 0.61, -0.74, 0.19];
  var CODES = [37, 201, 9, 154];
  var mountPqQuantize = defineWidget({
    id: "pq-quantize",
    rootClass: "pq-root",
    exportName: "mountPqQuantize",
    maxStep: 3,
    render(ctx) {
      const v = ctx.labels && ctx.labels.variant;
      if (v === "adc") return renderAdc(ctx);
      if (v === "memory") return renderMemory(ctx);
      return renderEncode(ctx);
    }
  });
  function renderEncode({ host, data, labels }) {
    const toy = data.toy || data;
    const D = toy.D || 8, m = toy.m || 4, dStar = toy.dStar || D / m, k = toy.k || 256;
    const bF32 = toy.bytesFloat32 != null ? toy.bytesFloat32 : D * 4;
    const bPQ = toy.bytesPQ != null ? toy.bytesPQ : m;
    const comp = toy.compression != null ? toy.compression : Math.round(bF32 / bPQ);
    const scale = data.scale || [];
    const rep = data.recallRepresentative || {};
    const B = labels.bytes || "B";
    const panel = document.createElement("div");
    panel.className = "wgt-panel pq-panel";
    host.appendChild(panel);
    function row(cls, headKey) {
      const r = document.createElement("div");
      r.className = `pq-row ${cls}`;
      const head = document.createElement("div");
      head.className = "pq-head";
      head.textContent = labels[headKey] || "";
      r.appendChild(head);
      const strip = document.createElement("div");
      strip.className = "pq-strip";
      r.appendChild(strip);
      panel.appendChild(r);
      return { r, strip };
    }
    const sizeTag = (n) => `<span class="pq-sz">${esc(n)} ${esc(B)}</span>`;
    const floatRow = row("pq-floats", "floatHead");
    VEC.slice(0, D).forEach((v) => {
      const c = document.createElement("div");
      c.className = "pq-cell pq-float";
      c.textContent = (v >= 0 ? "+" : "") + v.toFixed(2);
      floatRow.strip.appendChild(c);
    });
    floatRow.strip.insertAdjacentHTML("beforeend", sizeTag(bF32));
    const subRow = row("pq-subs", "subHead");
    for (let s = 0; s < m; s++) {
      const c = document.createElement("div");
      c.className = "pq-cell pq-sub";
      c.textContent = "[" + VEC.slice(s * dStar, s * dStar + dStar).map((v) => v.toFixed(2)).join(", ") + "]";
      subRow.strip.appendChild(c);
    }
    const codeRow = row("pq-codes", "codeHead");
    CODES.slice(0, m).forEach((idx) => {
      const c = document.createElement("div");
      c.className = "pq-cell pq-code";
      c.innerHTML = `<span class="pq-num">#${esc(idx)}</span><span class="pq-bits">1 ${esc(B)}</span>`;
      codeRow.strip.appendChild(c);
    });
    codeRow.strip.insertAdjacentHTML("beforeend", sizeTag(bPQ));
    const totals = document.createElement("div");
    totals.className = "pq-totals";
    totals.innerHTML = `<span class="pq-total pq-total-naive"><span class="pq-total-lbl">${esc(labels.floatLbl || "float32")}</span><span class="pq-total-val">${esc(bF32)} ${esc(B)}</span></span><span class="pq-total-arrow">\u2192</span><span class="pq-total pq-total-packed"><span class="pq-total-lbl">PQ</span><span class="pq-total-val">${esc(bPQ)} ${esc(B)}</span></span><span class="pq-ratio">${esc(comp)}\xD7</span>`;
    panel.appendChild(totals);
    const extra = document.createElement("div");
    extra.className = "pq-extra";
    const scaleStr = scale.map((s) => `${esc(s.dim)}-d \u2192 ${esc(s.bytesPQ)} ${esc(B)} (${esc(s.compression)}\xD7)`).join(" \xB7 ");
    extra.innerHTML = `<div class="pq-scale">${labels.scaleLbl || "at scale"}: ${scaleStr}</div><div class="pq-adc">${esc(labels.adc || "ADC: an m\xD7k distance table turns search into table lookups")} (${esc(m)}\xD7${esc(k)})</div>` + (rep.m4 != null ? `<div class="pq-rep">${esc(labels.recallLbl || "representative recall@1 (PQ-m4 vs exact)")}: \u2248 ${esc(rep.m4)}</div>` : "");
    panel.appendChild(extra);
    return function update(k2) {
      subRow.r.classList.toggle("is-hidden", k2 < 1);
      codeRow.r.classList.toggle("is-hidden", k2 < 2);
      totals.classList.toggle("is-hidden", k2 < 3);
      extra.classList.toggle("is-hidden", k2 < 3);
      floatRow.r.classList.toggle("is-faded", k2 >= 2);
      totals.classList.toggle("is-final", k2 >= 3);
    };
  }
  function renderAdc({ host, data, labels }) {
    const w = data.adcWorked || data.toy && data.toy.adcWorked || {};
    const table = w.adcTable || [];
    const codes = w.codes || [];
    const subq = w.subqueries || [];
    const m = w.m || table.length || 0;
    const k = w.k || (table[0] ? table[0].length : 0);
    const adcDistance = w.adcDistance;
    const exactDistance = w.exactDistance;
    const panel = document.createElement("div");
    panel.className = "wgt-panel pq-panel pq-adc-panel";
    host.appendChild(panel);
    const head = document.createElement("div");
    head.className = "pq-adc-head";
    head.textContent = `${labels.adcTableHead || "ADC distance table"} (${m}\xD7${k})`;
    panel.appendChild(head);
    const tbl = document.createElement("table");
    tbl.className = "pq-adc-table";
    const thead = document.createElement("tr");
    thead.className = "pq-adc-colhdr";
    const corner = document.createElement("th");
    corner.className = "pq-adc-corner";
    corner.textContent = labels.adcSubspace || "subspace";
    thead.appendChild(corner);
    for (let c = 0; c < k; c++) {
      const th = document.createElement("th");
      th.className = "pq-adc-ch";
      th.textContent = "c" + c;
      thead.appendChild(th);
    }
    tbl.appendChild(thead);
    const rowEls = [];
    const cellEls = [];
    table.forEach((rowVals, j) => {
      const tr = document.createElement("tr");
      tr.className = "pq-adc-row is-hidden";
      tr.setAttribute("data-step", String(j));
      const rh = document.createElement("td");
      rh.className = "pq-adc-rh";
      const sq = subq[j] ? `[${subq[j].join(", ")}]` : "";
      rh.innerHTML = `<span class="pq-adc-jlbl">j=${esc(j)}</span> <span class="pq-adc-subq">${esc(sq)}</span>`;
      tr.appendChild(rh);
      const cells = [];
      rowVals.forEach((val, c) => {
        const td = document.createElement("td");
        td.className = "pq-adc-cell";
        td.textContent = String(val);
        if (codes[j] === c) td.classList.add("pq-adc-iscode");
        tr.appendChild(td);
        cells.push(td);
      });
      tbl.appendChild(tr);
      rowEls.push(tr);
      cellEls.push(cells);
    });
    panel.appendChild(tbl);
    const trace = document.createElement("div");
    trace.className = "pq-adc-trace";
    panel.appendChild(trace);
    const result = document.createElement("div");
    result.className = "pq-adc-result";
    panel.appendChild(result);
    function renderTrace(upto) {
      const parts = [];
      let running = 0;
      for (let j = 0; j < Math.min(upto, m); j++) {
        const val = table[j][codes[j]];
        running += val;
        parts.push(`<span class="pq-adc-term">table[${esc(j)}][c${esc(codes[j])}] = ${esc(val)}</span>`);
      }
      trace.innerHTML = parts.length ? `${esc(labels.adcSum || "sum of looked-up cells")}: ${parts.join(' <span class="pq-adc-plus">+</span> ')}` + (upto >= m ? ` <span class="pq-adc-eq">= ${esc(running)}</span>` : "") : labels.adcStart || "one squared sub-distance per (subspace, centroid); trace the stored codes \u2192";
    }
    return function update(k2) {
      const upto = Math.min(k2 + 1, m);
      rowEls.forEach((tr, j) => {
        tr.classList.toggle("is-hidden", j >= upto);
        tr.classList.toggle("is-active", j < upto);
      });
      cellEls.forEach((cells, j) => cells.forEach((td) => {
        const chosen = codes[j] === [...cells].indexOf(td) && j < upto;
        td.classList.toggle("is-traced", chosen);
      }));
      renderTrace(upto);
      const done = upto >= m;
      result.classList.toggle("is-hidden", !done);
      if (done && adcDistance != null) {
        const gap = exactDistance != null ? exactDistance - adcDistance : null;
        result.innerHTML = `<span class="pq-adc-adc">ADC = ${esc(adcDistance)}</span>` + (exactDistance != null ? ` <span class="pq-adc-vs">${esc(labels.adcVs || "vs")}</span> <span class="pq-adc-exact">${esc(labels.adcExact || "exact")} = ${esc(exactDistance)}</span>` + (gap != null ? ` <span class="pq-adc-gap">(${esc(labels.adcErr || "quantization error")} = ${esc(gap)})</span>` : "") : "");
      }
    };
  }
  function renderMemory({ host, data, labels }) {
    const mc = data.memoryConfigs || data.toy && data.toy.memoryConfigs || {};
    const configs = mc.configs || [];
    const B = labels.bytes || "B";
    const panel = document.createElement("div");
    panel.className = "wgt-panel pq-panel pq-mem-panel";
    host.appendChild(panel);
    const head = document.createElement("div");
    head.className = "pq-mem-head";
    head.textContent = labels.memHead || "PQ memory ledger \u2014 bytes/vector and compression";
    panel.appendChild(head);
    const cards = configs.map((cfg, i) => {
      const card = document.createElement("div");
      card.className = "pq-mem-card is-hidden";
      card.innerHTML = `<div class="pq-mem-cfg">dim ${esc(cfg.dim)} \xB7 m ${esc(cfg.m)} \xB7 k ${esc(cfg.k)} (${esc(cfg.bitsPerCode)} ${esc(labels.memBits || "bits/code")})</div><div class="pq-mem-bytes"><span class="pq-mem-f32">${esc(cfg.bytesFloat32)} ${esc(B)}</span><span class="pq-mem-arrow">\u2192</span><span class="pq-mem-pq">${esc(cfg.bytesPQ)} ${esc(B)}/${esc(labels.memVec || "vec")}</span><span class="pq-mem-comp">${esc(cfg.compression)}\xD7</span></div>` + (cfg.indexGB_at_1e9 != null ? `<div class="pq-mem-idx">${esc(labels.memIndex || "index @ 1e9 vectors")}: ${esc(cfg.indexGB_at_1e9)} GB</div>` : "");
      panel.appendChild(card);
      return card;
    });
    return function update(k2) {
      cards.forEach((card, i) => {
        card.classList.toggle("is-hidden", i > k2);
        card.classList.toggle("is-focus", i === k2);
      });
    };
  }
})();
