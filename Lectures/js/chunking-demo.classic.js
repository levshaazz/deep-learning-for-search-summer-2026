/* AUTO-GENERATED offline classic bundle of widgets/chunking-demo/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/chunking-demo/logic.js
  var DOC_W = 560;
  var DOC_PADL = 26;
  var DOC_PADR = 26;
  var mountChunkingDemo = defineWidget({
    id: "chunking-demo",
    rootClass: "ck-root",
    exportName: "mountChunkingDemo",
    maxStep: 3,
    render(ctx) {
      const variant = ctx.labels && ctx.labels.variant || ctx.variant;
      if (variant === "sweep") return renderSweep(ctx);
      const { host, data, labels, el } = ctx;
      const L = data.docLen || 1e3;
      const span = data.answerSpan || [0, 0];
      const scen = data.scenarios || [];
      const W = 560, padL = 26, padR = 26, plotW = W - padL - padR;
      const x = (t) => padL + t / L * plotW;
      const rulerY = 58, rowH = 30, rowGap = 18;
      const rowY = (i) => rulerY + 44 + i * (rowH + rowGap + 22);
      const contains = (w) => w[0] <= span[0] && span[1] <= w[1];
      const readTop = rowY(scen.length) + 6;
      const H = frameHeightFor(readTop + 22, 12);
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg ck-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      el("line", { x1: x(0), y1: rulerY, x2: x(L), y2: rulerY, class: "ck-ruler" }, svg);
      for (let t = 0; t <= L; t += 200) {
        el("line", { x1: x(t), y1: rulerY - 5, x2: x(t), y2: rulerY + 5, class: "ck-tick" }, svg);
        el("text", { x: x(t), y: rulerY - 10, class: "ck-ticklbl", "text-anchor": "middle" }, svg).textContent = t;
      }
      el("text", { x: padL, y: rulerY - 26, class: "ck-doclbl" }, svg).textContent = (labels.docLabel || "document") + " \xB7 " + L + " " + (labels.tokens || "tokens");
      const spanBand = el("rect", { x: x(span[0]), y: rulerY - 4, width: x(span[1]) - x(span[0]), height: readTop - rulerY - 6, rx: 3, class: "ck-span" }, svg);
      el("text", { x: x(span[0]) - 6, y: rulerY + 18, class: "ck-spanlbl", "text-anchor": "end" }, svg).textContent = labels.answer || "answer";
      el("text", { x: (x(span[0]) + x(span[1])) / 2, y: rulerY + 18, class: "ck-spanlbl", "text-anchor": "middle" }, svg).textContent = "[" + span[0] + "," + span[1] + "]";
      scen.forEach((sc, si) => {
        const name = "row" + si;
        layer(name, si + 1);
        const y = rowY(si);
        add(name, el("text", { x: padL, y: y - 6, class: "ck-rowlbl" }, svg)).textContent = `size=${sc.size}, overlap=${sc.overlap} \u2192 ${sc.nChunks} ${labels.chunks || "chunks"}`;
        (sc.windows || []).forEach((w, wi) => {
          const ok = contains(w);
          const cls = "ck-win " + (ok ? "is-hold" : w[0] < span[1] && w[1] > span[0] ? "is-cross" : "is-far");
          add(name, el("rect", { x: x(w[0]) + 1, y, width: Math.max(2, x(w[1]) - x(w[0]) - 2), height: rowH, rx: 4, class: cls }, svg));
        });
        const recall = sc.recallAt3;
        add(name, el("text", { x: W - padR, y: y + rowH + 15, class: "ck-recall " + (recall ? "is-ok" : "is-bad"), "text-anchor": "end" }, svg)).textContent = `${labels.intact || "answer intact?"} ${recall ? "\u2713" : "\u2717"} \xB7 recall@3 = ${recall}`;
      });
      layer("formula", 3);
      add("formula", el("text", { x: W / 2, y: readTop, class: "ck-formula", "text-anchor": "middle" }, svg)).textContent = (labels.formulaLbl || "chunks") + " = \u2308(L \u2212 overlap) / (size \u2212 overlap)\u2309";
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
  function renderSweep({ host, data, labels, el }) {
    const L = data.docLen || 1e3;
    const span = data.answerSpan || [0, 0];
    const sweep = data.sweep || [];
    const W = DOC_W, padL = DOC_PADL, padR = DOC_PADR, plotW = W - padL - padR;
    const x = (t) => padL + t / L * plotW;
    const rulerY = 58, rowH = 26, rowGap = 16, rowBlock = rowH + rowGap + 22;
    const rowY = (i) => rulerY + 44 + i * rowBlock;
    const contains = (w) => w[0] <= span[0] && span[1] <= w[1];
    const readTop = rowY(sweep.length) + 6;
    const H = frameHeightFor(readTop + 22, 12);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg ck-svg", role: "img", "aria-label": labels.altSweep || labels.alt || "" }, host);
    const layers = {};
    const layer = (name, from) => layers[name] = { from, nodes: [] };
    const add = (name, n) => {
      layers[name].nodes.push(n);
      return n;
    };
    layer("base", 0);
    add("base", el("line", { x1: x(0), y1: rulerY, x2: x(L), y2: rulerY, class: "ck-ruler" }, svg));
    for (let t = 0; t <= L; t += 200) {
      add("base", el("line", { x1: x(t), y1: rulerY - 5, x2: x(t), y2: rulerY + 5, class: "ck-tick" }, svg));
      add("base", el("text", { x: x(t), y: rulerY - 10, class: "ck-ticklbl", "text-anchor": "middle" }, svg)).textContent = t;
    }
    add("base", el("text", { x: padL, y: rulerY - 26, class: "ck-doclbl" }, svg)).textContent = (labels.sweepLabel || labels.docLabel || "fixed size=200, sweeping overlap") + " \xB7 " + L + " " + (labels.tokens || "tokens");
    add("base", el("rect", { x: x(span[0]), y: rulerY - 4, width: x(span[1]) - x(span[0]), height: readTop - rulerY - 6, rx: 3, class: "ck-span" }, svg));
    add("base", el("text", { x: (x(span[0]) + x(span[1])) / 2, y: rulerY + 18, class: "ck-spanlbl", "text-anchor": "middle" }, svg)).textContent = (labels.answer || "answer") + " [" + span[0] + "," + span[1] + "]";
    sweep.forEach((sc, si) => {
      const name = "cfg" + si;
      layer(name, si);
      const y = rowY(si);
      add(name, el("text", { x: padL, y: y - 6, class: "ck-rowlbl" }, svg)).textContent = `overlap=${sc.overlap} \u2192 ${sc.nChunks} ${labels.chunks || "chunks"}`;
      (sc.windows || []).forEach((w) => {
        const ok = contains(w);
        const cls = "ck-win " + (ok ? "is-hold" : w[0] < span[1] && w[1] > span[0] ? "is-cross" : "is-far");
        add(name, el("rect", { x: x(w[0]) + 1, y, width: Math.max(2, x(w[1]) - x(w[0]) - 2), height: rowH, rx: 4, class: cls }, svg));
      });
      const recall = sc.recallAt3;
      add(name, el("text", { x: W - padR, y: y + rowH + 15, class: "ck-recall " + (recall ? "is-ok" : "is-bad"), "text-anchor": "end" }, svg)).textContent = `${labels.intact || "answer intact?"} ${recall ? "\u2713" : "\u2717"} \xB7 recall@3 = ${recall}`;
    });
    return function update(k) {
      for (const name in layers) {
        const on = k >= layers[name].from;
        for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
      }
    };
  }
})();
