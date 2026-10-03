/* AUTO-GENERATED offline classic bundle of widgets/block-geometry/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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

  // widgets/block-geometry/logic.js
  var mountBlockGeometry = defineWidget({
    id: "block-geometry",
    rootClass: "bg-root",
    exportName: "mountBlockGeometry",
    maxStep: 4,
    render({ host, data, labels, el }) {
      const tokens = data.tokens || [];
      const stages = data.stages || [];
      const n = tokens.length;
      const STEPS = stages.length;
      const isNorm = (s) => /^addnorm/.test(s.id || "");
      const W = 480;
      const PAD_L = 16, PAD_T = 34;
      const plotH = 280;
      const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };
      let ext = 1;
      for (const s of stages) for (const p of s.points || []) ext = Math.max(ext, Math.abs(p[0]), Math.abs(p[1]));
      const d = padDomain(-ext, ext, 0.14);
      const sx = (vx) => box.x + (vx - d.min) / d.span * box.w;
      const sy = (vy) => box.y + box.h - (vy - d.min) / d.span * box.h;
      const unitPx = box.w / d.span;
      const ringR = 1 * unitPx;
      const cx0 = sx(0), cy0 = sy(0);
      const H = frameHeightFor(PAD_T + plotH + 18, 14);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg bg-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "bg-frame" }, svg);
      const ttl = el("text", { x: box.x, y: box.y - 18, class: "bg-title" }, svg);
      ttl.textContent = labels.planeTitle || "token cloud (2-D)";
      const stageHead = el("text", { x: box.x, y: box.y - 4, class: "bg-stage" }, svg);
      el("text", { x: box.x + 6, y: box.y + 14, class: "bg-axlbl" }, svg).textContent = labels.axY || "dim \u2191";
      el("text", {
        x: box.x + box.w - 6,
        y: box.y + box.h - 8,
        class: "bg-axlbl",
        "text-anchor": "end"
      }, svg).textContent = labels.axX || "dim \u2192";
      const ring = el("circle", { cx: cx0, cy: cy0, r: ringR.toFixed(2), class: "bg-ring is-hidden" }, svg);
      const ringLbl = el("text", {
        x: cx0 + ringR * 0.71 + 4,
        y: cy0 - ringR * 0.71 - 4,
        class: "bg-ringlbl is-hidden"
      }, svg);
      ringLbl.textContent = labels.ringLbl || "unit RMS ring";
      const trails = [];
      for (let i = 0; i < n; i++) trails.push(el("line", { class: "bg-trail is-hidden" }, svg));
      const dots = [], dlbls = [];
      for (let i = 0; i < n; i++) {
        const g = el("g", {}, svg);
        dots.push(el("circle", { r: 6, class: "bg-dot" }, g));
        const t = el("text", { class: "bg-word svg-halo", "text-anchor": "middle" }, g);
        t.textContent = tokens[i] || "";
        dlbls.push(t);
      }
      function place(k) {
        const stage = stages[k] || stages[0] || { points: [] };
        const prev = stages[Math.max(0, k - 1)] || stage;
        const pts = stage.points || [];
        const pp = prev.points || [];
        for (let i = 0; i < n; i++) {
          const p = pts[i] || [0, 0];
          const X = sx(p[0]), Y = sy(p[1]);
          dots[i].setAttribute("cx", X.toFixed(2));
          dots[i].setAttribute("cy", Y.toFixed(2));
          dlbls[i].setAttribute("x", X.toFixed(2));
          dlbls[i].setAttribute("y", (Y - 13).toFixed(2));
        }
        const showTrails = k > 0;
        for (let i = 0; i < n; i++) {
          const tline = trails[i];
          if (!showTrails) {
            tline.classList.add("is-hidden");
            continue;
          }
          const a = pp[i] || [0, 0], b = pts[i] || [0, 0];
          const seg = clampSegmentToRect(sx(a[0]), sy(a[1]), sx(b[0]), sy(b[1]), box);
          if (seg) {
            tline.setAttribute("x1", seg.x1.toFixed(2));
            tline.setAttribute("y1", seg.y1.toFixed(2));
            tline.setAttribute("x2", seg.x2.toFixed(2));
            tline.setAttribute("y2", seg.y2.toFixed(2));
            tline.classList.remove("is-hidden");
          } else {
            tline.classList.add("is-hidden");
          }
        }
        stageHead.textContent = stage.label || "";
        const norm = isNorm(stage);
        ring.classList.toggle("is-hidden", !norm);
        ringLbl.classList.toggle("is-hidden", !norm);
      }
      return function update(k) {
        place(Math.max(0, Math.min(STEPS - 1, k)));
      };
    }
  });
})();
