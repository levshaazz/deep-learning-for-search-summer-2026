/* AUTO-GENERATED offline classic bundle of widgets/ragas-metrics/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_plot-util.js
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/ragas-metrics/logic.js
  var mountRagasMetrics = defineWidget({
    id: "ragas-metrics",
    rootClass: "rg-root",
    exportName: "mountRagasMetrics",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const d = data || {};
      const claims = d.answerClaims || [];
      const metrics = [
        { key: "faithfulness", val: d.faithfulness, frac: `${d.supportedClaims}/${d.answerClaimCount}`, lblKey: "mFaith" },
        { key: "answerRelevance", val: d.answerRelevance, frac: "mean cos", lblKey: "mRel" },
        { key: "contextPrecision", val: d.contextPrecision, frac: "\u03A3 p@k\xB7rel/#rel", lblKey: "mPrec" },
        { key: "contextRecall", val: d.contextRecall, frac: `${d.groundTruthInContext}/${d.groundTruthCount}`, lblKey: "mRec" }
      ];
      const W = 540, PAD = 16;
      const claimsTop = 40, claimRow = 22, nClaims = claims.length;
      const gaugesTop = claimsTop + nClaims * claimRow + 26;
      const gaugeRow = 46, barX = 196, barW = 250;
      const H = frameHeightFor(gaugesTop + metrics.length * gaugeRow + 8, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg rg-svg", role: "img", "aria-label": labels.alt || "" }, host);
      el("text", { x: PAD, y: 22, class: "rg-qhead" }, svg).textContent = labels.answerHead || "generated answer \xB7 claim-by-claim";
      const claimEls = claims.map((c, i) => {
        const g = el("g", { class: "rg-claim" + (c.supported ? " is-ok" : " is-bad") }, svg);
        const y = claimsTop + i * claimRow;
        el("text", { x: PAD, y: y + 12, class: "rg-mark" }, g).textContent = c.supported ? "\u2713" : "\u2717";
        const t = c.text || "";
        el("text", { x: PAD + 18, y: y + 12, class: "rg-claimtxt" }, g).textContent = t.length > 64 ? t.slice(0, 61) + "\u2026" : t;
        return g;
      });
      const gaugeEls = metrics.map((m, i) => {
        const g = el("g", { class: "rg-gauge is-hidden" }, svg);
        const y = gaugesTop + i * gaugeRow;
        el("text", { x: PAD, y: y + 4, class: "rg-mname" }, g).textContent = labels[m.lblKey] || m.key;
        el("text", { x: PAD, y: y + 19, class: "rg-mfrac" }, g).textContent = m.frac;
        el("rect", { x: barX, y: y - 9, width: barW, height: 16, rx: 4, class: "rg-track" }, g);
        const v = Math.max(0, Math.min(1, Number(m.val) || 0));
        const cls = v >= 0.8 ? " is-hi" : v >= 0.6 ? " is-mid" : " is-lo";
        el("rect", { x: barX, y: y - 9, width: Math.round(barW * v), height: 16, rx: 4, class: "rg-fill" + cls }, g);
        el("text", { x: barX + barW + 10, y: y + 4, class: "rg-mval", "text-anchor": "start" }, g).textContent = (Number(m.val) || 0).toFixed(4);
        return g;
      });
      return function update(k) {
        const upto = Math.max(0, Math.min(k, metrics.length));
        claimEls.forEach((g) => g.classList.toggle("is-lit", upto >= 1));
        gaugeEls.forEach((g, i) => g.classList.toggle("is-hidden", i >= upto));
      };
    }
  });
})();
