/* AUTO-GENERATED offline classic bundle of widgets/pos-bias-curve/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/pos-bias-curve/logic.js
  var mountPosBiasCurve = defineWidget({
    id: "pos-bias-curve",
    rootClass: "pb-root",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const ranks = data.ranks, MAX = 4, W = 480, H = 300;
      const box = { x: 44, y: 24, w: W - 64, h: H - 64 };
      const maxShare = Math.max(...ranks.map((r) => r.clickShare)) * 1.1;
      const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "wgt-svg pb-svg", role: "img", "aria-label": labels.alt || "" }, host);
      el("line", { x1: box.x, y1: box.y + box.h, x2: box.x + box.w, y2: box.y + box.h, class: "pb-axis" }, svg);
      el("text", { x: box.x + box.w, y: box.y + box.h + 32, class: "pb-axlbl", "text-anchor": "end" }, svg).textContent = labels.xaxis || "rank \u2192";
      el("text", { x: 2, y: box.y - 6, class: "pb-axlbl", "text-anchor": "start" }, svg).textContent = labels.yaxis || "clicks";
      const bw = box.w / ranks.length - 6;
      const bars = ranks.map((r, i) => {
        const x = box.x + i * (box.w / ranks.length) + 3;
        const h = r.clickShare / maxShare * box.h;
        const rect = el("rect", { x, y: box.y + box.h - h, width: bw, height: h, class: "pb-bar", "data-rank": r.rank }, svg);
        el("text", { x: x + bw / 2, y: box.y + box.h + 14, class: "pb-rk", "text-anchor": "middle" }, svg).textContent = r.rank;
        return rect;
      });
      const layers = {};
      const layer = (n, from) => layers[n] = { from, nodes: [] };
      const add = (n, node) => {
        layers[n].nodes.push(node);
        return node;
      };
      layer("top1", 1);
      layer("top3", 2);
      layer("flat", 3);
      layer("good", 4);
      const t1 = add("top1", el("text", { x: bars[0].getAttribute("x"), y: box.y + 4, class: "pb-tag pb-top1" }, svg));
      t1.textContent = `${data.top1Pct}%`;
      t1.setAttribute("x", Number(bars[0].getAttribute("x")) + bw / 2);
      t1.setAttribute("text-anchor", "middle");
      const t3 = add("top3", el("text", { x: box.x + box.w - 6, y: box.y + 18, class: "pb-tag pb-top3", "text-anchor": "end" }, svg));
      t3.textContent = `top-3 = ${data.top3Pct}%`;
      const equalShare = 1 / ranks.length;
      const flatY = box.y + box.h - equalShare / maxShare * box.h;
      add("flat", el("line", { x1: box.x, y1: flatY, x2: box.x + box.w, y2: flatY, class: "pb-flat" }, svg));
      const fl = add("flat", el("text", { x: box.x + box.w - 4, y: flatY - 6, class: "pb-tag pb-flatlbl", "text-anchor": "end" }, svg));
      fl.textContent = labels.flat || `true relevance = equal (${Math.round(equalShare * 100)}%)`;
      const goodTxt = labels.goodhart || "optimise this \u2192 reward position, not relevance";
      const goodX = box.x + box.w - 6;
      const gd = add("good", el("text", { x: goodX, y: box.y + 34, class: "pb-tag pb-good", "text-anchor": "end" }, svg));
      const arrowAt = goodTxt.indexOf("\u2192");
      if (arrowAt > 0) {
        const head = goodTxt.slice(0, arrowAt + 1).trim();
        const tail = goodTxt.slice(arrowAt + 1).trim();
        el("tspan", { x: goodX, dy: 0 }, gd).textContent = head;
        el("tspan", { x: goodX, dy: 15 }, gd).textContent = tail;
      } else {
        gd.textContent = goodTxt;
      }
      return function update(k) {
        bars.forEach((b, i) => {
          b.classList.toggle("is-hot", k >= 1 && i === 0 || k >= 2 && i < 3);
        });
        for (const n in layers) {
          const on = k >= layers[n].from;
          for (const node of layers[n].nodes) node.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
