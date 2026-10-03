/* AUTO-GENERATED offline classic bundle of widgets/decision-cost/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function decisionThreshold(mode, cost1, cost2) {
    if (!(cost1 > 0) || !(cost2 > 0) || !Number.isFinite(cost1 + cost2)) throw new Error("Costs must be finite and positive");
    return mode === "context" ? 1 - cost2 / cost1 : cost1 / (cost1 + cost2);
  }
  function decisionLosses(mode, p, cost1, cost2) {
    if (!Number.isFinite(p) || p < 0 || p > 1) throw new Error("Invalid probability");
    return { act: cost1 * (1 - p), defer: mode === "context" ? cost2 : cost2 * p };
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

  // widgets/decision-cost/logic.js
  var mountDecisionCost = defineWidget({
    id: "decision-cost",
    rootClass: "jev-root",
    exportName: "mountDecisionCost",
    maxStep: 2,
    render({ host, data, labels, el }) {
      if (!(data == null ? void 0 : data.costs)) {
        html("p", { text: labels.missing || "Missing fixture" }, host);
        return () => {
        };
      }
      let mode = "filter", cost1 = data.costs.filter.falsePositive, cost2 = data.costs.filter.falseNegative, p = 0.85;
      html("p", { class: "jev-provenance", text: labels.synthetic }, host);
      const controls = html("div", { class: "jev-controls" }, host);
      const report = html("p", { class: "jev-result", "aria-live": "polite" }, host);
      const chooser = selector(controls, labels.event, [["filter", labels.filter], ["context", labels.context]], (v) => {
        mode = v;
        cost1 = v === "filter" ? data.costs.filter.falsePositive : data.costs.context.unsupported;
        cost2 = v === "filter" ? data.costs.filter.falseNegative : data.costs.context.defer;
        sync();
        paint();
      });
      const fp = slider(controls, labels.cost1, 1, 12, 1, cost1, (v) => {
        cost1 = v;
        paint();
      });
      const fn = slider(controls, labels.cost2, 1, 12, 1, cost2, (v) => {
        cost2 = v;
        paint();
      });
      const prob = slider(controls, labels.probability, 0, 1, 0.01, p, (v) => {
        p = v;
        paint();
      });
      function sync() {
        chooser.value = mode;
        fp.input.value = cost1;
        fn.input.value = cost2;
      }
      function paint() {
        fp.caption.textContent = `${labels.cost1}: ${cost1}`;
        fn.caption.textContent = `${mode === "context" ? labels.deferCost : labels.cost2}: ${cost2}`;
        prob.caption.textContent = `${labels.probability}: ${number(p, labels, 2)}`;
        const cut = decisionThreshold(mode, cost1, cost2), loss = decisionLosses(mode, p, cost1, cost2);
        const act = p > cut;
        report.textContent = `${labels.threshold}: p > ${number(cut, labels, 4)} \xB7 ${labels.loss}: ${number(loss.act, labels, 2)} / ${number(loss.defer, labels, 2)} \xB7 ${act ? mode === "context" ? labels.allow : labels.pass : mode === "context" ? labels.defer : labels.drop}`;
        chart.paint();
      }
      const chart = figure(host, el, labels, 248, (svg, width) => {
        const left = 42, right = 18, top = 30, bottom = 204, span = width - left - right, max = Math.max(cost1, cost2);
        const X = (x) => left + x * span, Y = (y) => bottom - y / max * (bottom - top);
        const lossAt0 = decisionLosses(mode, 0, cost1, cost2), lossAt1 = decisionLosses(mode, 1, cost1, cost2);
        el("line", { x1: left, y1: bottom, x2: width - right, y2: bottom, class: "jev-axis" }, svg);
        el("line", { x1: left, y1: top, x2: left, y2: bottom, class: "jev-axis" }, svg);
        el("line", { x1: X(0), y1: Y(lossAt0.act), x2: X(1), y2: Y(lossAt1.act), class: "jev-act-line" }, svg);
        el("line", { x1: X(0), y1: Y(lossAt0.defer), x2: X(1), y2: Y(lossAt1.defer), class: "jev-defer-line" }, svg);
        const cut = decisionThreshold(mode, cost1, cost2);
        if (cut >= 0 && cut <= 1) el("line", { x1: X(cut), y1: top, x2: X(cut), y2: bottom, class: "jev-threshold" }, svg);
        const losses = decisionLosses(mode, p, cost1, cost2);
        el("circle", { cx: X(p), cy: Y(losses.act), r: 5, class: "jev-fill" }, svg);
        el("circle", { cx: X(p), cy: Y(losses.defer), r: 5, class: "jev-defer-fill" }, svg);
        text(el, svg, 8, top + 5, String(max), "jev-small");
        text(el, svg, 17, bottom + 4, "0", "jev-small");
        text(el, svg, left, 222, "0", "jev-small");
        text(el, svg, width - right, 222, "1", "jev-small", "end");
        text(el, svg, (left + width - right) / 2, 242, labels.probability, "jev-small", "middle");
        text(el, svg, left, 24, mode === "context" ? labels.allow : labels.pass, "jev-act-label");
        text(el, svg, width - right, 24, mode === "context" ? labels.defer : labels.drop, "jev-defer-label", "end");
      });
      html("p", { class: "jev-note", text: labels.boundary }, host);
      paint();
      return (k) => {
        mode = k === 2 ? "context" : "filter";
        cost1 = k === 0 ? data.costs.filter.falsePositive : data.costs.context.unsupported;
        cost2 = k === 2 ? data.costs.context.defer : data.costs.filter.falseNegative;
        sync();
        paint();
      };
    }
  });
})();
