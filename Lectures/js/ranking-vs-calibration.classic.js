/* AUTO-GENERATED offline classic bundle of widgets/ranking-vs-calibration/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/_jev-math.js
  function brier(p, y) {
    if (!p.length || p.length !== y.length || p.some((x) => !Number.isFinite(x) || x < 0 || x > 1) || y.some((x) => x !== 0 && x !== 1)) throw new Error("Invalid binary predictions");
    return p.reduce((s, x, i) => s + (x - y[i]) ** 2, 0) / p.length;
  }
  function temperatureScale(p, t) {
    if (!(t > 0) || !Number.isFinite(t) || p.some((x) => !Number.isFinite(x) || x <= 0 || x >= 1)) throw new Error("Invalid temperature inputs");
    return p.map((x) => 1 / (1 + Math.exp(-Math.log(x / (1 - x)) / t)));
  }
  function policyStats(p, y, threshold, strict = false) {
    brier(p, y);
    const indices = p.map((x, i) => i).filter((i) => strict ? p[i] > threshold : p[i] >= threshold);
    return {
      count: indices.length,
      coverage: indices.length / p.length,
      risk: indices.length ? indices.filter((i) => y[i] === 0).length / indices.length : null,
      indices
    };
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
  function slider(parent, label, min, max, step, value, onChange) {
    const wrap = html("label", { class: "jev-field" }, parent);
    const caption = html("span", { text: label }, wrap);
    const input = html("input", { type: "range", min, max, step, value, "aria-label": label }, wrap);
    input.addEventListener("input", () => onChange(Number(input.value)));
    return { input, caption };
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

  // widgets/ranking-vs-calibration/logic.js
  var mountRankingVsCalibration = defineWidget({
    id: "ranking-vs-calibration",
    rootClass: "jev-root",
    exportName: "mountRankingVsCalibration",
    maxStep: 2,
    render({ host, data, labels, el }) {
      if (!(data == null ? void 0 : data.calibration)) {
        html("p", { text: labels.missing || "Missing fixture" }, host);
        return () => {
        };
      }
      const d = data.calibration;
      let mode = "original", t = 1, cut = d.threshold;
      html("p", { class: "jev-provenance", text: labels.synthetic }, host);
      const controls = html("div", { class: "jev-controls" }, host);
      const report = html("p", { class: "jev-result", "aria-live": "polite" }, host);
      const chooser = selector(controls, labels.mode, [["original", labels.original], ["shifted", labels.shifted], ["temperature", labels.temperature]], (v) => {
        mode = v;
        paint();
      });
      const temp = slider(controls, labels.temperature, 0.25, 4, 0.25, t, (v) => {
        t = v;
        paint();
      });
      const threshold = slider(controls, labels.threshold, 0, 1, 0.05, cut, (v) => {
        cut = v;
        paint();
      });
      function predictions() {
        return mode === "temperature" ? temperatureScale(d.original, t) : d[mode];
      }
      function paint() {
        const p = predictions(), stats = policyStats(p, d.labels, cut);
        temp.input.disabled = mode !== "temperature";
        temp.caption.textContent = `${labels.temperature}: ${number(t, labels, 2)}`;
        threshold.caption.textContent = `${labels.threshold}: ${number(cut, labels, 2)}`;
        report.textContent = `Brier = ${number(brier(p, d.labels), labels, 6)} \xB7 ${labels.accepted}: ${stats.count}/${p.length} \xB7 ${labels.order}: ${p.map((x, i) => ({ x, i })).sort((a, b) => b.x - a.x).map((x) => x.i + 1).join(" > ")}`;
        chart.paint();
      }
      const chart = figure(host, el, labels, 252, (svg, width) => {
        const p = predictions(), left = 72, span = width - left - 65;
        const xcut = left + cut * span;
        el("line", { x1: xcut, y1: 18, x2: xcut, y2: 216, class: "jev-threshold" }, svg);
        p.forEach((value, i) => {
          const y = 28 + i * 47;
          text(el, svg, 8, y + 17, `${i + 1}: y=${d.labels[i]}`, "jev-small");
          el("rect", { x: left, y, width: span, height: 23, class: "jev-track" }, svg);
          el("rect", { x: left, y, width: value * span, height: 23, class: value >= cut ? "jev-fill" : "jev-muted-fill" }, svg);
          text(el, svg, width - 6, y + 17, number(value, labels, 3), "jev-strong", "end");
        });
        text(el, svg, left, 235, "0", "jev-small");
        text(el, svg, left + span, 235, "1", "jev-small", "end");
        text(el, svg, (left + left + span) / 2, 244, labels.probability, "jev-small", "middle");
      });
      html("p", { class: "jev-note", text: labels.boundary }, host);
      paint();
      return (k) => {
        mode = ["original", "shifted", "temperature"][k];
        chooser.value = mode;
        paint();
      };
    }
  });
})();
