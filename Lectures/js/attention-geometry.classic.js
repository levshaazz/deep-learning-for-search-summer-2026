/* AUTO-GENERATED offline classic bundle of widgets/attention-geometry/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function makeProtagonist(svg, opts = {}) {
    const SVGNS2 = "http://www.w3.org/2000/svg";
    const haloClass = opts.haloClass || "wgt-halo";
    const focusClass = opts.focusClass || "is-protagonist";
    const mutedClass = opts.mutedClass || "is-muted";
    const defR = typeof opts.haloR === "number" ? opts.haloR : 11;
    const halo = document.createElementNS(SVGNS2, "circle");
    halo.setAttribute("class", haloClass);
    halo.setAttribute("fill", "none");
    if (opts.haloStroke) halo.setAttribute("stroke", opts.haloStroke);
    halo.style.opacity = "0";
    svg.appendChild(halo);
    let muted = [];
    function unmuteAll() {
      for (const e of muted) e && e.classList && e.classList.remove(mutedClass);
      muted = [];
    }
    return {
      halo,
      focus(star, rest = [], pos = {}) {
        unmuteAll();
        for (const e of rest) {
          if (!e || e === star || !e.classList) continue;
          e.classList.add(mutedClass);
          muted.push(e);
        }
        if (star && star.classList) star.classList.add(focusClass);
        if (pos && pos.cx != null && isFinite(pos.cx)) {
          halo.setAttribute("cx", pos.cx);
          halo.setAttribute("cy", pos.cy);
          halo.setAttribute("r", typeof pos.r === "number" ? pos.r : defR);
          halo.style.opacity = "1";
        } else {
          halo.style.opacity = "0";
        }
      },
      clear() {
        unmuteAll();
        halo.style.opacity = "0";
      }
    };
  }

  // widgets/attention-geometry/logic.js
  var mountAttentionGeometry = defineWidget({
    id: "attention-geometry",
    rootClass: "ag-root",
    exportName: "mountAttentionGeometry",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const tokens = data.tokens || [];
      const valuePoints = data.valuePoints || [];
      const weights = data.weights || [];
      const qi = data.queryIndex != null ? data.queryIndex : 1;
      const qTok = data.queryToken || tokens[qi] || "";
      const wRow = weights[qi] || [];
      const blended = data.blendedPoint || [0, 0];
      const blended4d = data.blended4d || [];
      const outRow = data.l6OutputRow || [];
      const n = valuePoints.length;
      const num = (x) => typeof x !== "number" ? "" : Number.isInteger(x) ? String(x) : fmt(x, 3);
      const rowTxt = (r) => "[" + r.map(num).join(", ") + "]";
      const wTxt = (w) => typeof w !== "number" ? "" : String(+w.toFixed(3)).replace(/^0\./, ".");
      const W = 480;
      const PAD_L = 16, PAD_T = 30;
      const plotH = 250;
      const box = { x: PAD_L, y: PAD_T, w: W - 2 * PAD_L, h: plotH };
      const allX = valuePoints.map((p) => p[0]).concat(blended[0]);
      const allY = valuePoints.map((p) => p[1]).concat(blended[1]);
      const dx = padDomain(Math.min(...allX), Math.max(...allX), 0.22);
      const dy = padDomain(Math.min(...allY), Math.max(...allY), 0.22);
      const sx = (vx) => box.x + (vx - dx.min) / dx.span * box.w;
      const sy = (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h;
      const calloutTop = PAD_T + plotH + 24;
      const H = frameHeightFor(calloutTop + 52, 14);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H}`,
        class: "wgt-svg ag-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from) => layers[name] = { from, nodes: [] };
      const add = (name, node) => {
        layers[name].nodes.push(node);
        return node;
      };
      layer("plane", 0);
      layer("points", 0);
      el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "ag-frame" }, svg);
      const ttl = el("text", { x: box.x, y: box.y - 10, class: "ag-title" }, svg);
      ttl.textContent = labels.planeTitle || "value space (2-D)";
      add("plane", el("text", { x: box.x + 6, y: box.y + 14, class: "ag-axlbl" }, svg)).textContent = labels.axY || "V \u2191";
      add("plane", el("text", {
        x: box.x + box.w - 6,
        y: box.y + box.h - 8,
        class: "ag-axlbl",
        "text-anchor": "end"
      }, svg)).textContent = labels.axX || "V \u2192";
      const dotXY = valuePoints.map((p) => ({ x: sx(p[0]), y: sy(p[1]) }));
      const tokenGroups = [];
      const restGroups = [];
      valuePoints.forEach((p, i) => {
        const isQ = i === qi;
        const g = el("g", {}, svg);
        el("circle", {
          cx: dotXY[i].x,
          cy: dotXY[i].y,
          r: isQ ? 7 : 6,
          class: `ag-dot ${isQ ? "ag-dot-q" : "ag-dot-v"}`
        }, g);
        const lt = el("text", {
          x: dotXY[i].x,
          y: dotXY[i].y - 12,
          class: `ag-word ${isQ ? "ag-word-q" : "ag-word-v"}`,
          "text-anchor": "middle"
        }, g);
        lt.textContent = tokens[i] || "";
        add("points", g);
        tokenGroups[i] = g;
        if (!isQ) restGroups.push(g);
      });
      layer("edges", 1);
      const qPt = dotXY[qi];
      const maxW = Math.max(...wRow, 1e-6);
      wRow.forEach((w, j) => {
        const seg = clampSegmentToRect(qPt.x, qPt.y, dotXY[j].x, dotXY[j].y, box);
        if (!seg) return;
        const sw = 1 + w / maxW * 9;
        const g = el("g", {}, svg);
        el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          class: `ag-edge${j === qi ? " ag-edge-self" : ""}`,
          "stroke-width": sw.toFixed(2),
          "stroke-opacity": (0.25 + 0.6 * (w / maxW)).toFixed(2)
        }, g);
        if (j !== qi) {
          const mx = (qPt.x + dotXY[j].x) / 2, my = (qPt.y + dotXY[j].y) / 2;
          el("text", { x: mx, y: my - 4, class: "ag-wlbl", "text-anchor": "middle" }, g).textContent = wTxt(w);
        }
        add("edges", g);
      });
      add("edges", el("text", { x: qPt.x + 12, y: qPt.y + 4, class: "ag-wlbl ag-wlbl-self" }, svg)).textContent = wTxt(wRow[qi]);
      layer("blend", 2);
      const bx = sx(blended[0]), by = sy(blended[1]);
      valuePoints.forEach((p, j) => {
        const seg = clampSegmentToRect(bx, by, dotXY[j].x, dotXY[j].y, box);
        if (seg) add("blend", el("line", {
          x1: seg.x1,
          y1: seg.y1,
          x2: seg.x2,
          y2: seg.y2,
          class: "ag-guide"
        }, svg));
      });
      const aseg = clampSegmentToRect(qPt.x, qPt.y, bx, by, box);
      if (aseg) add("blend", el("line", {
        x1: aseg.x1,
        y1: aseg.y1,
        x2: aseg.x2,
        y2: aseg.y2,
        class: "ag-arrow",
        "marker-end": "url(#ag-head)"
      }, svg));
      const defs = el("defs", {}, svg);
      const mk = el("marker", {
        id: "ag-head",
        viewBox: "0 0 10 10",
        refX: 8,
        refY: 5,
        markerWidth: 7,
        markerHeight: 7,
        orient: "auto-start-reverse"
      }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: "ag-arrowhead" }, mk);
      const bg = el("g", {}, svg);
      el("path", { d: diamond(bx, by, 8), class: "ag-blend" }, bg);
      el("text", { x: bx, y: by + 22, class: "ag-blendlbl", "text-anchor": "middle" }, bg).textContent = labels.blendTag || "weighted average";
      add("blend", bg);
      layer("match", 3);
      const cg = el("g", {}, svg);
      el("rect", {
        x: PAD_L,
        y: calloutTop,
        width: W - 2 * PAD_L,
        height: 46,
        rx: 8,
        class: "ag-callbox"
      }, cg);
      el("text", { x: PAD_L + 12, y: calloutTop + 18, class: "ag-callrow" }, cg).textContent = "blend\xB7V = " + rowTxt(blended4d);
      el("text", { x: PAD_L + 12, y: calloutTop + 36, class: "ag-callrow ag-callrow-2" }, cg).textContent = (labels.matchTag || "= attention output row") + " " + rowTxt(outRow);
      add("match", cg);
      const matchTag = add("match", el("text", {
        x: bx + 10,
        y: by - 13,
        class: "ag-matchtag",
        "text-anchor": "start"
      }, svg));
      matchTag.textContent = "\u2248 output";
      function diamond(cx, cy, r) {
        return `M${cx},${(cy - r).toFixed(2)} L${(cx + r).toFixed(2)},${cy} L${cx},${(cy + r).toFixed(2)} L${(cx - r).toFixed(2)},${cy} Z`;
      }
      const hero = makeProtagonist(svg, { haloClass: "ag-halo", haloR: 13 });
      return function update(k) {
        for (const name in layers) {
          const on = k >= layers[name].from;
          for (const node of layers[name].nodes) node.classList.toggle("is-hidden", !on);
        }
        const at = k >= 2 ? { cx: bx, cy: by, r: 13 } : { cx: qPt.x, cy: qPt.y, r: 11 };
        hero.focus(tokenGroups[qi], restGroups, at);
      };
    }
  });
})();
