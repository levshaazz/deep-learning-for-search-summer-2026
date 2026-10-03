/* AUTO-GENERATED offline classic bundle of widgets/postings-compression/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/postings-compression/logic.js
  var mountPostingsCompression = defineWidget({
    id: "postings-compression",
    rootClass: "pc-root",
    maxStep: 3,
    render({ host, data, labels }) {
      const ids = data.docIds || [];
      const gaps = data.gaps || [];
      const rawPer = data.rawBytesPerId || [];
      const vbPer = data.varbyteBytesPerGap || [];
      const rawTotal = data.rawBytesTotal != null ? data.rawBytesTotal : rawPer.reduce((a, b) => a + b, 0);
      const vbTotal = data.varbyteBytesTotal != null ? data.varbyteBytesTotal : vbPer.reduce((a, b) => a + b, 0);
      const ratio = data.compressionRatio != null ? data.compressionRatio : vbTotal ? rawTotal / vbTotal : 0;
      const layout = data.byteLayout || {};
      const dataBits = layout.bitsPerByte || 7;
      const fmtRatio = (r) => Number.isInteger(r) ? String(r) : r.toFixed(1);
      const dataBin = (n) => (n & 127).toString(2).padStart(dataBits, "0");
      const panel = document.createElement("div");
      panel.className = "wgt-panel pc-panel";
      host.appendChild(panel);
      function row(cls, headKey) {
        const r = document.createElement("div");
        r.className = `pc-row ${cls}`;
        const head = document.createElement("div");
        head.className = "pc-head";
        head.textContent = labels[headKey] || "";
        r.appendChild(head);
        const strip = document.createElement("div");
        strip.className = "pc-strip";
        r.appendChild(strip);
        panel.appendChild(r);
        return { r, strip };
      }
      const rawRow = row("pc-raw", "rawHead");
      ids.forEach((id, i) => {
        const cell = document.createElement("div");
        cell.className = "pc-cell pc-id";
        cell.innerHTML = `<span class="pc-num">${esc(id)}</span><span class="pc-sz">${esc(rawPer[i] != null ? rawPer[i] : 4)} ${esc(labels.bytesLabel || "B")}</span>`;
        rawRow.strip.appendChild(cell);
      });
      const gapRow = row("pc-gap", "gapHead");
      gaps.forEach((g, i) => {
        const cell = document.createElement("div");
        cell.className = "pc-cell pc-delta";
        cell.innerHTML = `<span class="pc-num">${i === 0 ? esc(g) : "+" + esc(g)}</span>`;
        gapRow.strip.appendChild(cell);
      });
      const vbRow = row("pc-vbyte", "vbyteHead");
      gaps.forEach((g, i) => {
        const cell = document.createElement("div");
        cell.className = "pc-cell pc-byte";
        const bits = document.createElement("div");
        bits.className = "pc-bits";
        const cont = document.createElement("span");
        cont.className = "pc-bit pc-bit-cont";
        cont.textContent = "0";
        cont.title = labels.contLabel || "continuation";
        bits.appendChild(cont);
        for (const ch of dataBin(g)) {
          const b = document.createElement("span");
          b.className = "pc-bit pc-bit-data";
          b.textContent = ch;
          bits.appendChild(b);
        }
        cell.appendChild(bits);
        const sz = document.createElement("span");
        sz.className = "pc-sz";
        sz.textContent = `${vbPer[i] != null ? vbPer[i] : 1} ${labels.bytesLabel || "B"}`;
        cell.appendChild(sz);
        vbRow.strip.appendChild(cell);
      });
      const totals = document.createElement("div");
      totals.className = "pc-totals";
      totals.innerHTML = `<span class="pc-total pc-total-naive"><span class="pc-total-lbl">${esc(labels.naiveLabel || "naive")}</span><span class="pc-total-val">${esc(rawTotal)} ${esc(labels.bytesLabel || "B")}</span></span><span class="pc-total-arrow">\u2192</span><span class="pc-total pc-total-packed"><span class="pc-total-lbl">${esc(labels.packedLabel || "packed")}</span><span class="pc-total-val">${esc(vbTotal)} ${esc(labels.bytesLabel || "B")}</span></span><span class="pc-ratio">${esc(fmtRatio(ratio))}\xD7</span>`;
      panel.appendChild(totals);
      return function update(k) {
        gapRow.r.classList.toggle("is-hidden", k < 1);
        vbRow.r.classList.toggle("is-hidden", k < 2);
        totals.classList.toggle("is-hidden", k < 3);
        rawRow.r.classList.toggle("is-faded", k >= 1);
        totals.classList.toggle("is-final", k >= 3);
      };
    }
  });
})();
