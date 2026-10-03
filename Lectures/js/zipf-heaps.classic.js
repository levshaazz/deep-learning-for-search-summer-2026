/* AUTO-GENERATED offline classic bundle of widgets/zipf-heaps/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function padDomain(min, max, frac = 0.08) {
    let span = max - min;
    if (!(span > 0)) span = Math.abs(min) || 1;
    const p = span * frac;
    return { min: min - p, max: max + p, span: max - min + 2 * p };
  }
  function clampSegmentToRect(x1, y1, x2, y2, rect) {
    const xmin = rect.x, ymin = rect.y, xmax = rect.x + rect.w, ymax = rect.y + rect.h;
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return null;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }
    return {
      x1: x1 + t0 * dx,
      y1: y1 + t0 * dy,
      x2: x1 + t1 * dx,
      y2: y1 + t1 * dy
    };
  }

  // widgets/zipf-heaps/logic.js
  var log10 = (x) => Math.log(x) / Math.LN10;
  var mountZipfHeaps = defineWidget({
    id: "zipf-heaps",
    rootClass: "zh-root",
    exportName: "mountZipfHeaps",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const W = 480, H = 440;
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg zh-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      function frame(box, title) {
        el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "zh-frame" }, svg);
        const t = el("text", { x: box.x, y: box.y - 6, class: "zh-title" }, svg);
        t.textContent = title;
        return {
          sx: (lx) => box.x + (lx - box.xmin) / (box.xmax - box.xmin) * box.w,
          sy: (ly) => box.y + box.h - (ly - box.ymin) / (box.ymax - box.ymin) * box.h
        };
      }
      const top = data.top10;
      const zy = padDomain(log10(Math.min(...top.map((t) => t.count))), log10(Math.max(...top.map((t) => t.count))), 0.32);
      const zx = padDomain(0, 1, 0.05);
      const zb = {
        x: 56,
        y: 28,
        w: W - 80,
        h: 150,
        xmin: zx.min,
        xmax: zx.max,
        ymin: zy.min,
        ymax: zy.max
      };
      const Z = frame(zb, labels.zipfTitle || "Zipf: rank \u2194 frequency (log\u2013log)");
      el("text", { x: zb.x - 8, y: zb.y + 8, class: "zh-axlbl", "text-anchor": "end" }, svg).textContent = "freq";
      el("text", { x: zb.x + zb.w, y: zb.y + zb.h + 18, class: "zh-axlbl", "text-anchor": "end" }, svg).textContent = "rank \u2192";
      layer("zline", 1);
      layer("zpts", 0);
      layer("zannot", 2);
      const lr = top.map((t) => log10(t.rank)), lc = top.map((t) => log10(t.count));
      const slope = data.zipf.loglogSlope;
      const xb = lr.reduce((a, b) => a + b, 0) / lr.length, yb = lc.reduce((a, b) => a + b, 0) / lc.length;
      const yAt = (x) => yb + slope * (x - xb);
      const seg = clampSegmentToRect(
        Z.sx(zb.xmin),
        Z.sy(yAt(zb.xmin)),
        Z.sx(zb.xmax),
        Z.sy(yAt(zb.xmax)),
        { x: zb.x, y: zb.y, w: zb.w, h: zb.h }
      ) || { x1: Z.sx(zb.xmin), y1: zb.y, x2: Z.sx(zb.xmax), y2: zb.y + zb.h };
      add("zline", el("line", { x1: seg.x1, y1: seg.y1, x2: seg.x2, y2: seg.y2, class: "zh-fit" }, svg));
      top.forEach((t, i) => {
        add("zpts", el("circle", { cx: Z.sx(lr[i]), cy: Z.sy(lc[i]), r: 4, class: "zh-dot" }, svg));
      });
      const t0 = add("zpts", el("text", { x: Z.sx(lr[0]) + 10, y: Z.sy(lc[0]) + 14, class: "zh-tok" }, svg));
      t0.textContent = `\u201C${top[0].token}\u201D \xD7${top[0].count.toLocaleString("en-US")}`;
      const sl = add("zannot", el("text", { x: zb.x + zb.w - 6, y: zb.y + 22, class: "zh-eq", "text-anchor": "end" }, svg));
      sl.textContent = `slope \u2248 ${slope.toFixed(2)}`;
      const hc = add("zannot", el("text", { x: zb.x + zb.w - 6, y: zb.y + 40, class: "zh-sub", "text-anchor": "end" }, svg));
      hc.textContent = `top-10 = ${(data.zipf.headCoverage.top10 * 100).toFixed(0)}% of all tokens`;
      const cp = data.heapsCheckpoints;
      const hb = {
        x: 56,
        y: 256,
        w: W - 80,
        h: 150,
        xmin: log10(cp[0].N) - 0.1,
        xmax: log10(cp[cp.length - 1].N) + 0.1,
        ymin: log10(cp[0].V) - 0.1,
        ymax: log10(cp[cp.length - 1].V) + 0.1
      };
      const Hp = frame(hb, labels.heapsTitle || "Heaps: tokens \u2194 vocabulary (log\u2013log)");
      el("text", { x: hb.x - 8, y: hb.y + 8, class: "zh-axlbl", "text-anchor": "end" }, svg).textContent = "types";
      el("text", { x: hb.x + hb.w, y: hb.y + hb.h + 18, class: "zh-axlbl", "text-anchor": "end" }, svg).textContent = "tokens \u2192";
      layer("heaps", 3);
      const hx = cp.map((p) => log10(p.N)), hy = cp.map((p) => log10(p.V));
      const dPath = cp.map((p, i) => `${i ? "L" : "M"} ${Hp.sx(hx[i])} ${Hp.sy(hy[i])}`).join(" ");
      add("heaps", el("path", { d: dPath, class: "zh-heapsline" }, svg));
      cp.forEach((p, i) => add("heaps", el("circle", { cx: Hp.sx(hx[i]), cy: Hp.sy(hy[i]), r: 3.5, class: "zh-dot zh-dot-h" }, svg)));
      const beq = add("heaps", el("text", { x: hb.x + 8, y: hb.y + 20, class: "zh-eq" }, svg));
      beq.textContent = `V = K\xB7N^\u03B2,  \u03B2 \u2248 ${data.heaps.beta.toFixed(2)}`;
      const bsub = add("heaps", el("text", { x: hb.x + 8, y: hb.y + 42, class: "zh-sub" }, svg));
      bsub.textContent = `V = ${data.vTypes.toLocaleString("en-US")} types,  R\xB2 = ${data.heaps.r2.toFixed(3)}`;
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const n of layers[name].nodes) n.classList.toggle("is-hidden", !on);
        }
      };
    }
  });
})();
