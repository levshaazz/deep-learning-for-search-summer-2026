/* AUTO-GENERATED offline classic bundle of widgets/splade-expansion/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/splade-expansion/logic.js
  var mountSpladeExpansion = defineWidget({
    id: "splade-expansion",
    rootClass: "sx-root",
    exportName: "mountSpladeExpansion",
    maxStep: 3,
    render({ host, data, labels, el }) {
      var _a, _b, _c;
      const toy = data.toy || {};
      const vocab = toy.vocab || [];
      const qW = ((_a = toy.query) == null ? void 0 : _a.weights) || [];
      const dW = ((_b = toy.doc) == null ? void 0 : _b.weights) || [];
      const expansion = new Set(((_c = toy.query) == null ? void 0 : _c.expansion) || []);
      const terms = toy.terms || [];
      const dot = typeof toy.dot === "number" ? toy.dot : 0;
      const num4 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(4);
      const num2 = (x) => typeof x !== "number" || !isFinite(x) ? "" : x.toFixed(2);
      const items = vocab.map((t, i) => ({ t, i, q: qW[i] || 0, d: dW[i] || 0, exp: expansion.has(t) })).filter((o) => o.q > 0 || o.d > 0);
      const maxW = Math.max(1e-3, ...items.map((o) => Math.max(o.q, o.d))) * 1.15;
      const W = 560, PAD = 16;
      const svg = el("svg", { viewBox: `0 0 ${W} 10`, class: "wgt-svg sx-svg", role: "img", "aria-label": labels.alt || "" }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("literal", 0);
      layer("curve", 1);
      layer("weights", 1);
      layer("expansion", 2);
      layer("doc", 3);
      layer("dot", 3);
      const box = { x: PAD + 34, y: 144, w: W - 2 * PAD - 34, h: 210 };
      add("literal", el("line", { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: "sx-axis" }, svg));
      add("literal", el("text", { x: PAD, y: 30, class: "sx-head" }, svg)).textContent = labels.head || "learned weights over the vocabulary: w\u2C7C = log(1 + ReLU(z\u2C7C))";
      const groupW = box.w / items.length;
      const barW = Math.min(34, groupW / 2 - 6);
      const yOf = (w) => box.y + box.h - w / maxW * box.h;
      items.forEach((o, gi) => {
        const cx = box.x + gi * groupW + groupW / 2;
        const lname = o.exp ? "expansion" : "literal";
        const qx = cx - barW - 2;
        const qy = yOf(o.q);
        add(lname, el("rect", {
          x: qx,
          y: qy,
          width: barW,
          height: box.y + box.h - qy,
          rx: 4,
          class: "sx-bar " + (o.exp ? "sx-bar-exp" : "sx-bar-q")
        }, svg));
        add("weights", el("text", { x: qx + barW / 2, y: qy - 6, class: "sx-wval", "text-anchor": "middle" }, svg)).textContent = num2(o.q);
        const dx = cx + 2;
        const dy = yOf(o.d);
        add("doc", el("rect", { x: dx, y: dy, width: barW, height: box.y + box.h - dy, rx: 4, class: "sx-bar sx-bar-d" }, svg));
        add("doc", el("text", { x: dx + barW / 2, y: dy - 6, class: "sx-dval", "text-anchor": "middle" }, svg)).textContent = num2(o.d);
        add(lname, el("text", {
          x: cx,
          y: box.y + box.h + 20,
          class: "sx-term" + (o.exp ? " sx-term-exp" : ""),
          "text-anchor": "middle"
        }, svg)).textContent = o.t;
        if (o.exp) add("expansion", el("text", { x: cx, y: box.y + box.h + 38, class: "sx-tag", "text-anchor": "middle" }, svg)).textContent = labels.expandLabel || "+ expansion";
      });
      const ix = box.x + box.w - 150, iy = 40, iw = 140, ih = 96;
      add("curve", el("rect", { x: ix, y: iy, width: iw, height: ih, rx: 8, class: "sx-inset" }, svg));
      const cx0 = ix + 14, cy0 = iy + ih - 16, cw = iw - 26, ch = ih - 30;
      add("curve", el("line", { x1: cx0, y1: cy0, x2: cx0 + cw, y2: cy0, class: "sx-iaxis" }, svg));
      add("curve", el("line", { x1: cx0, y1: cy0, x2: cx0, y2: cy0 - ch, class: "sx-iaxis" }, svg));
      const xa = -2, xb = 3, ymax = Math.log(1 + Math.max(0, xb));
      let dStr = "";
      for (let s = 0; s <= 40; s++) {
        const x = xa + (xb - xa) * (s / 40);
        const y = Math.log(1 + Math.max(0, x));
        const px = cx0 + (x - xa) / (xb - xa) * cw;
        const py = cy0 - y / ymax * ch;
        dStr += (s === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1) + " ";
      }
      add("curve", el("path", { d: dStr, class: "sx-curve", fill: "none" }, svg));
      add("curve", el("text", { x: ix + iw / 2, y: iy + 14, class: "sx-ilbl", "text-anchor": "middle" }, svg)).textContent = "log(1+ReLU)";
      const dotY = box.y + box.h + 64;
      add("dot", el("rect", { x: PAD, y: dotY, width: W - 2 * PAD, height: 60, rx: 9, class: "sx-dotbox" }, svg));
      add("dot", el("text", { x: PAD + 12, y: dotY + 24, class: "sx-dotline" }, svg)).textContent = terms.map((t) => num4(t.prod)).join("  +  ");
      add("dot", el("text", { x: PAD + 12, y: dotY + 48, class: "sx-dottotal" }, svg)).textContent = `${labels.dotLabel || "sparse dot"} = ${num4(dot)}`;
      const H = frameHeightFor(dotY + 60, 12);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
