/* AUTO-GENERATED offline classic bundle of widgets/tsne-migrate/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/tsne-migrate/logic.js
  var CLUSTER_COLOR = [
    "var(--c-amber, #E0A82E)",
    // 0 animals
    "var(--c-violet, #7D5BA6)",
    // 1 royalty
    "var(--c-green, #3A8A5C)",
    // 2 tech
    "var(--accent, #2A6FDB)"
    // 3 places
  ];
  var mountTsneMigrate = defineWidget({
    id: "tsne-migrate",
    rootClass: "tm-root",
    exportName: "mountTsneMigrate",
    maxStep: 3,
    render({ host, data, labels, el, maxStep }) {
      const snaps = data.snapshots || [];
      const clusters = data.clusters || [];
      const colorOf = (c) => CLUSTER_COLOR[c] || "var(--ink-3, #6B7280)";
      const N = snaps[0] && snaps[0].points.length || 0;
      const W = 480;
      const PAD_L = 20, PAD_R = 20, PAD_T = 30;
      const plotH = 300;
      const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };
      const allX = [], allY = [];
      snaps.forEach((s) => (s.points || []).forEach((p) => {
        allX.push(p.x);
        allY.push(p.y);
      }));
      const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.1);
      const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.1);
      const side = Math.min(box.w, box.h);
      const ox = box.x + (box.w - side) / 2, oy = box.y + (box.h - side) / 2;
      const sx = (vx) => ox + (vx - dx.min) / dx.span * side;
      const sy = (vy) => oy + side - (vy - dy.min) / dy.span * side;
      const hash01 = (i, salt) => {
        const v = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      const JIT = 0.18;
      const jx = (i) => (hash01(i, 1) - 0.5) * 2 * JIT;
      const jy = (i) => (hash01(i, 2) - 0.5) * 2 * JIT;
      const H = frameHeightFor(PAD_T + plotH + 16, 8);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg tm-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("frame", 0);
      add("frame", el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "tm-frame" }, svg));
      const ttl = el("text", { x: box.x, y: box.y - 10, class: "tm-title" }, svg);
      const sub = el("text", { x: box.x + box.w, y: box.y - 10, class: "tm-sub", "text-anchor": "end" }, svg);
      layer("trails", 1);
      const trails = [];
      for (let i = 0; i < N; i++) {
        const c = (snaps[0].points[i] || {}).c;
        trails.push(add("trails", el("line", {
          class: "tm-trail",
          fill: "none",
          stroke: colorOf(c),
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0
        }, svg)));
      }
      layer("dots", 0);
      const dots = [];
      for (let i = 0; i < N; i++) {
        const c = (snaps[0].points[i] || {}).c;
        const init = snaps[0].points[i];
        dots.push(add("dots", el("circle", {
          cx: sx(init.x + jx(i)),
          cy: sy(init.y + jy(i)),
          r: 5,
          class: "tm-dot",
          fill: colorOf(c),
          stroke: "var(--bg-card, #fff)",
          "stroke-width": 1
        }, svg)));
      }
      layer("legend", 0);
      const legX = box.x + 6, legY0 = box.y + 14;
      clusters.forEach((c, i) => {
        const ly = legY0 + i * 15;
        const g = el("g", {}, svg);
        el("rect", { x: legX, y: ly - 8, width: 9, height: 9, rx: 2, fill: colorOf(i) }, g);
        el("text", { x: legX + 14, y: ly, class: "tm-leglbl" }, g).textContent = c;
        add("legend", g);
      });
      layer("caveat", 3, 3);
      const caveat = add("caveat", el("text", {
        x: box.x + box.w - 8,
        y: box.y + box.h - 10,
        class: "tm-caveat",
        "text-anchor": "end"
      }, svg));
      caveat.textContent = labels.tsneCaveat || "gaps & sizes are NOT distances";
      const px = (s, i) => {
        const p = snaps[s] && snaps[s].points[i] || snaps[0].points[i];
        return sx(p.x + (s === 0 ? jx(i) : 0));
      };
      const py = (s, i) => {
        const p = snaps[s] && snaps[s].points[i] || snaps[0].points[i];
        return sy(p.y + (s === 0 ? jy(i) : 0));
      };
      function placeSnapshot(k) {
        dots.forEach((d, i) => {
          d.setAttribute("cx", px(k, i));
          d.setAttribute("cy", py(k, i));
        });
        trails.forEach((t, i) => {
          if (k === 0) {
            t.classList.add("is-hidden");
            return;
          }
          const seg = clampSegmentToRect(px(k - 1, i), py(k - 1, i), px(k, i), py(k, i), box) || { x1: px(k - 1, i), y1: py(k - 1, i), x2: px(k, i), y2: py(k, i) };
          t.setAttribute("x1", seg.x1);
          t.setAttribute("y1", seg.y1);
          t.setAttribute("x2", seg.x2);
          t.setAttribute("y2", seg.y2);
        });
      }
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const n of L.nodes) n.classList.toggle("is-hidden", !on);
        }
        placeSnapshot(k);
        const snap = snaps[k] || {};
        ttl.textContent = snap.label || "";
        sub.textContent = k === 0 ? labels.scattered || "scattered" : k >= maxStep ? labels.settled || "settled" : labels.migrating || "migrating";
      };
    }
  });
})();
