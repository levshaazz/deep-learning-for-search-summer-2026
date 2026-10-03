/* AUTO-GENERATED offline classic bundle of widgets/jev-expected-gain/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_jev-math.js
  function probabilities(p) {
    if (!Array.isArray(p) || p.length !== 4 || p.some((x) => !Number.isFinite(x) || x < 0 || x > 1) || Math.abs(p.reduce((s, x) => s + x, 0) - 1) > 1e-9) throw new Error("Invalid grade distribution");
    return p;
  }
  function expectedValue(p, mode = "exponential") {
    return probabilities(p).reduce((s, x, r) => s + x * (mode === "linear" ? r : 2 ** r - 1), 0);
  }
  function rankDocuments(rows, mode) {
    return rows.map((row, original) => ({ ...row, original, score: expectedValue(row.probabilities, mode) })).sort((a, b) => b.score - a.score || a.original - b.original);
  }

  // widgets/_jev-ui.js
  function html(tag, attrs, parent) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    parent == null ? void 0 : parent.appendChild(node);
    return node;
  }
  function selector(parent, label, choices, onChange) {
    const wrap = html("label", { class: "jev-field" }, parent);
    html("span", { text: label }, wrap);
    const input = html("select", {}, wrap);
    choices.forEach(([value, text2]) => html("option", { value, text: text2 }, input));
    input.addEventListener("change", () => onChange(input.value));
    return input;
  }
  function number(n, labels, digits = 3) {
    return new Intl.NumberFormat(labels.locale || "en", { maximumFractionDigits: digits }).format(n);
  }
  function figure(host, el, labels, height, draw) {
    const svg = el("svg", { class: "jev-chart", role: "img", "aria-label": labels.alt || "" }, host);
    function paint() {
      const scale = host.closest(".slide") ? 1.4 : 1;
      const width = Math.max(270, Math.round((host.clientWidth || 520) / scale));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("height", height * scale);
      svg.replaceChildren();
      draw(svg, width, height);
    }
    const observer = new ResizeObserver(paint);
    observer.observe(host);
    const cleanup = new MutationObserver(() => {
      if (!svg.isConnected) {
        observer.disconnect();
        cleanup.disconnect();
      }
    });
    cleanup.observe(host, { childList: true });
    paint();
    return { svg, paint };
  }
  function text(el, parent, x, y, value, cls = "", anchor = "start") {
    const node = el("text", { x, y, class: cls, "text-anchor": anchor }, parent);
    node.textContent = value;
    return node;
  }

  // widgets/jev-expected-gain/logic.js
  var mountJevExpectedGain = defineWidget({
    id: "jev-expected-gain",
    rootClass: "jev-root",
    exportName: "mountJevExpectedGain",
    maxStep: 2,
    render({ host, data, labels, el }) {
      if (!(data == null ? void 0 : data.documents) || !(data == null ? void 0 : data.crossover)) {
        html("p", { text: labels.missing || "Missing fixture" }, host);
        return () => {
        };
      }
      let step = 0, mode = "exponential", sample = "documents";
      html("p", { class: "jev-provenance", text: labels.synthetic }, host);
      const controls = html("div", { class: "jev-controls" }, host);
      const report = html("p", { class: "jev-result", "aria-live": "polite" }, host);
      const dataset = selector(controls, labels.dataset, [["documents", labels.quartet], ["crossover", labels.crossover]], (v) => {
        sample = v;
        paint();
      });
      const utility = selector(controls, labels.utility, [["exponential", labels.exponential], ["linear", labels.linear]], (v) => {
        mode = v;
        paint();
      });
      function paint() {
        const rows = data[sample], ranked = rankDocuments(rows, mode);
        const values = (step === 2 ? ranked : rows.map((row) => ({ ...row, score: expectedValue(row.probabilities, mode) }))).map((x) => `${x.id}=${number(x.score, labels, 2)}`).join("; ");
        report.textContent = step === 0 ? labels.probability : `${step === 2 ? `${labels.order}: ${ranked.map((x) => x.id).join(" > ")}. ` : `${labels.gain}. `}${labels.expected}: ${values}`;
        chart.paint();
      }
      const chart = figure(host, el, labels, 254, (svg, width) => {
        const rows = step === 2 ? rankDocuments(data[sample], mode) : data[sample];
        const max = step === 0 ? 1 : mode === "linear" ? 3 : 7;
        const left = 36, right = 80, span = width - left - right;
        for (let r = 0; r < 4; r++) {
          const x = 8 + r * (width / 4);
          el("rect", { x, y: 6, width: 12, height: 12, class: `jev-grade-${r}` }, svg);
          text(el, svg, x + 17, 17, `r=${r}`, "jev-small");
        }
        rows.forEach((row, i) => {
          const y = 48 + i * 48;
          text(el, svg, 8, y + 18, row.id, "jev-strong");
          let x = left;
          row.probabilities.forEach((p, r) => {
            const value = step === 0 ? p : p * (mode === "linear" ? r : 2 ** r - 1), w = value / max * span;
            el("rect", { x, y, width: Math.max(0, w), height: 27, class: `jev-grade-${r}` }, svg);
            x += w;
          });
          text(el, svg, width - 8, y + 18, number(step === 0 ? 1 : expectedValue(row.probabilities, mode), labels, 2), "jev-strong", "end");
          text(el, svg, left, y + 42, row.probabilities.map((p) => number(p, labels, 2)).join(" / "), "jev-small");
        });
      });
      html("p", { class: "jev-note", text: labels.boundary }, host);
      paint();
      return (k) => {
        step = k;
        dataset.value = sample;
        utility.value = mode;
        paint();
      };
    }
  });
})();
