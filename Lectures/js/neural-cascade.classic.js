/* AUTO-GENERATED offline classic bundle of widgets/neural-cascade/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
      const i18nAll = rest && rest.i18nAll && typeof rest.i18nAll === "object" ? rest.i18nAll : null;
      const active = { ...labels };
      const localeKeys = /* @__PURE__ */ new Set();
      if (i18nAll) for (const map of Object.values(i18nAll)) {
        if (map && typeof map === "object") for (const key of Object.keys(map)) localeKeys.add(key);
      }
      const configKeys = /* @__PURE__ */ new Set(["role", "variant", "series"]);
      const base = Object.fromEntries(Object.entries(labels).filter(([key]) => !localeKeys.has(key) || configKeys.has(key)));
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
      const originalHostRole = host.getAttribute("role");
      const originalHostAlt = host.getAttribute("aria-label");
      let ownsHostAlt = false;
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
          ownsHostAlt = true;
        } else if (ownsHostAlt) {
          for (const [key, value] of [["role", originalHostRole], ["aria-label", originalHostAlt]]) {
            if (value === null) host.removeAttribute(key);
            else host.setAttribute(key, value);
          }
          ownsHostAlt = false;
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
        if (!rendered()) {
          dirty = true;
          return;
        }
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
          if (i18nAll) {
            for (const k of Object.keys(active)) delete active[k];
            Object.assign(active, i18nAll.en || {}, i18nAll[lang] || {}, base);
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

  // widgets/neural-cascade/logic.js
  var mountNeuralCascade = defineWidget({
    id: "neural-cascade",
    rootClass: "nc-root",
    exportName: "mountNeuralCascade",
    maxStep: 3,
    render({ host, data, labels }) {
      const stages = data.stages || [];
      const quality = data.quality || {};
      const latency = data.latency || {};
      const ndcgFor = (role) => role === "retrieval" && typeof quality.bm25Ndcg === "number" ? quality.bm25Ndcg : role === "rerank" && typeof quality.rerankedNdcg === "number" ? quality.rerankedNdcg : null;
      const f2 = (x) => typeof x === "number" && isFinite(x) ? x.toFixed(2) : "";
      const panel = document.createElement("div");
      panel.className = "wgt-panel nc-panel";
      host.appendChild(panel);
      const rows = stages.map((s, i) => {
        const row = document.createElement("div");
        row.className = "nc-stage is-hidden";
        row.style.setProperty("--w", s.w + "%");
        row.dataset.role = s.role;
        row.dataset.step = String(i);
        const nd = ndcgFor(s.role);
        const metric = nd !== null ? `<div class="nc-metric is-hidden">${esc(labels.ndcgLabel || "nDCG")} = ${esc(f2(nd))}</div>` : "";
        row.innerHTML = `<div class="nc-bar"><span class="nc-name">${esc(labels["name" + i] || s.id)}</span><span class="nc-count">${esc(s.count)}</span></div><div class="nc-desc">${esc(labels["desc" + i] || "")}</div>` + metric;
        panel.appendChild(row);
        return row;
      });
      let footer = null;
      const climbBits = [];
      if (typeof quality.bm25Ndcg === "number" && typeof quality.rerankedNdcg === "number") {
        climbBits.push((labels.climbLabel || "quality climbs") + ": " + f2(quality.bm25Ndcg) + " \u2192 " + f2(quality.rerankedNdcg) + " nDCG");
      }
      if (typeof latency.totalMs === "number") {
        const parts = [];
        if (typeof latency.queryEncodeMs === "number") parts.push("encode " + latency.queryEncodeMs);
        if (typeof latency.annSearchMs === "number") parts.push("ANN " + latency.annSearchMs);
        if (typeof latency.rerankMs === "number") parts.push("rerank " + latency.rerankMs);
        climbBits.push((labels.costLabel || "cost") + ": " + parts.join(" + ") + " = " + latency.totalMs + " ms");
      }
      if (climbBits.length) {
        footer = document.createElement("div");
        footer.className = "nc-summary is-hidden";
        footer.dataset.step = String(stages.length);
        footer.innerHTML = climbBits.map((t) => `<div class="nc-summary-line">${esc(t)}</div>`).join("");
        panel.appendChild(footer);
      }
      const metricEls = rows.map((r) => r.querySelector(".nc-metric"));
      const nStages = stages.length;
      return function update(k) {
        rows.forEach((r, i) => {
          const shown = Math.min(k, nStages - 1);
          r.classList.toggle("is-hidden", i > shown);
          r.classList.toggle("is-new", i === k && i < nStages);
        });
        const climb = k >= nStages;
        metricEls.forEach((m) => {
          if (m) m.classList.toggle("is-hidden", !climb);
        });
        if (footer) footer.classList.toggle("is-hidden", !climb);
      };
    }
  });
})();
