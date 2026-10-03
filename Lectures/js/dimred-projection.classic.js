/* AUTO-GENERATED offline classic bundle of widgets/dimred-projection/logic.js — do not edit. Rebuild: node scripts/build-deck-widgets.mjs */
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
  function frameHeightFor(maxY, pad = 24) {
    return Math.ceil(maxY + pad);
  }

  // widgets/dimred-projection/logic.js
  var CLUSTER_COLOR = {
    royalty: "var(--c-violet, #7D5BA6)",
    family: "var(--c-pink, #C9447A)",
    animals: "var(--c-amber, #E0A82E)",
    countries: "var(--accent, #2A6FDB)",
    capitals: "var(--c-cyan, #1AA7B5)",
    tech: "var(--c-green, #3A8A5C)",
    transport: "var(--c-red, #D7522C)"
  };
  var mountDimredProjection = defineWidget({
    id: "dimred-projection",
    rootClass: "dr-root",
    exportName: "mountDimredProjection",
    maxStep: 3,
    render({ host, data, labels, el }) {
      const pca = data.pca || {};
      const tsne = data.tsne || {};
      const pcaPts = pca.points || [];
      const tsnePts = tsne.points || [];
      const evr = pca.explainedVarRatio || [];
      const clusters = data.clusters || Object.keys(CLUSTER_COLOR);
      const var2d = pca.var2dPct;
      const colorOf = (c) => CLUSTER_COLOR[c] || "var(--ink-3, #6B7280)";
      const W = 480;
      const PAD_L = 20, PAD_R = 20, PAD_T = 30;
      const plotH = 280;
      const box = { x: PAD_L, y: PAD_T, w: W - PAD_L - PAD_R, h: plotH };
      function scalerFor(pts) {
        const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
        const dx = padDomain(Math.min(...xs), Math.max(...xs), 0.1);
        const dy = padDomain(Math.min(...ys), Math.max(...ys), 0.12);
        return {
          sx: (vx) => box.x + (vx - dx.min) / dx.span * box.w,
          // y up: data +y → toward top of the box
          sy: (vy) => box.y + box.h - (vy - dy.min) / dy.span * box.h
        };
      }
      const SP = scalerFor(pcaPts);
      const ST = scalerFor(tsnePts);
      const barsHeadY = PAD_T + 16;
      const barsTotY = barsHeadY + 22;
      const barsTop = barsTotY + 16;
      const barRow = 19;
      const barH = 12;
      const barX = 92;
      const barMaxW = W - barX - 60;
      const evrMax = evr.length ? Math.max(...evr) : 1;
      const nBars = Math.min(evr.length, 10);
      const barsBottom = barsTop + nBars * barRow;
      const H_SCATTER = frameHeightFor(PAD_T + plotH, 24);
      const H_BARS = frameHeightFor(barsBottom, 12);
      const svg = el("svg", {
        viewBox: `0 0 ${W} ${H_SCATTER}`,
        class: "wgt-svg dr-svg",
        role: "img",
        "aria-label": labels.alt || ""
      }, host);
      const layers = {};
      const layer = (name, from, to = Infinity) => layers[name] = { from, to, nodes: [] };
      const add = (name, n) => {
        layers[name].nodes.push(n);
        return n;
      };
      layer("scatterframe", 0, 1);
      const frameRect = add("scatterframe", el("rect", { x: box.x, y: box.y, width: box.w, height: box.h, class: "dr-frame" }, svg));
      const ttl = el("text", { x: box.x, y: box.y - 10, class: "dr-title" }, svg);
      const sub = el("text", { x: box.x + box.w, y: box.y - 10, class: "dr-sub", "text-anchor": "end" }, svg);
      layer("blur", 0, 0);
      let seed = 1337;
      const rnd = () => {
        seed = seed * 1103515245 + 12345 & 2147483647;
        return seed / 2147483647;
      };
      for (let i = 0; i < 90; i++) {
        const cx = box.x + 14 + rnd() * (box.w - 28);
        const cy = box.y + 14 + rnd() * (box.h - 28);
        add("blur", el("circle", { cx, cy, r: 3 + rnd() * 2, class: "dr-blurdot" }, svg));
      }
      const blurLbl = add("blur", el("text", {
        x: box.x + box.w / 2,
        y: box.y + box.h / 2,
        class: "dr-blurlbl",
        "text-anchor": "middle"
      }, svg));
      blurLbl.textContent = labels.blur300 || "300-D \xB7 unseeable";
      function scatter(name, from, to, pts, scaler) {
        layer(name, from, to);
        const labelSet = /* @__PURE__ */ new Set(["king", "dog", "germany", "tokyo", "computer", "car", "woman"]);
        pts.forEach((p) => {
          add(name, el("circle", {
            cx: scaler.sx(p.x),
            cy: scaler.sy(p.y),
            r: 5,
            class: "dr-dot",
            fill: colorOf(p.c),
            stroke: "var(--bg-card, #fff)",
            "stroke-width": 1
          }, svg));
          if (labelSet.has(p.w)) {
            const t = add(name, el("text", {
              x: scaler.sx(p.x) + 9,
              y: scaler.sy(p.y) - 11,
              class: "dr-ptlbl svg-halo"
            }, svg));
            t.textContent = p.w;
          }
        });
      }
      scatter("pca", 1, 1, pcaPts, SP);
      scatter("tsne", 3, 3, tsnePts, ST);
      const caveat = add("tsne", el("text", {
        x: box.x + 8,
        y: box.y + box.h - 8,
        class: "dr-caveat"
      }, svg));
      caveat.textContent = labels.tsneCaveat || "distances not global";
      layer("legend", 1);
      const legX = box.x + 6, legY0 = box.y + 14;
      clusters.forEach((c, i) => {
        const ly = legY0 + i * 15;
        const g = el("g", {}, svg);
        el("rect", { x: legX, y: ly - 8, width: 9, height: 9, rx: 2, fill: colorOf(c) }, g);
        const t = el("text", { x: legX + 14, y: ly, class: "dr-leglbl" }, g);
        t.textContent = c;
        add("legend", g);
      });
      layer("bars", 2, 2);
      const bhead = add("bars", el("text", { x: PAD_L, y: barsHeadY, class: "dr-barshead" }, svg));
      bhead.textContent = labels.evrTitle || "PCA explained variance per component";
      evr.slice(0, nBars).forEach((v, i) => {
        const cy = barsTop + i * barRow;
        const g = el("g", {}, svg);
        const lab = el("text", { x: barX - 8, y: cy + barH - 2, class: "dr-pclbl", "text-anchor": "end" }, g);
        lab.textContent = `PC${i + 1}`;
        el("rect", { x: barX, y: cy, width: barMaxW, height: barH, rx: 2, class: "dr-bartrack" }, g);
        const w = Math.max(1, v / evrMax * barMaxW);
        el("rect", {
          x: barX,
          y: cy,
          width: w,
          height: barH,
          rx: 2,
          class: `dr-barfill ${i < 2 ? "dr-bar-2d" : "dr-bar-rest"}`
        }, g);
        const val = el("text", { x: barX + barMaxW + 8, y: cy + barH - 2, class: "dr-barval" }, g);
        val.textContent = (v * 100).toFixed(1) + "%";
        add("bars", g);
      });
      const tot = add("bars", el("text", { x: PAD_L, y: barsTotY, class: "dr-bartot" }, svg));
      if (typeof var2d === "number")
        tot.textContent = (labels.first2 || "PC1 + PC2 keep") + " " + var2d.toFixed(1) + "%";
      return function update(k) {
        for (const name in layers) {
          const L = layers[name];
          const on = k >= L.from && k <= L.to;
          for (const n of L.nodes) n.classList.toggle("is-hidden", !on);
        }
        const legendOn = k === 1 || k === 3;
        for (const n of layers.legend.nodes) n.classList.toggle("is-hidden", !legendOn);
        frameRect.classList.toggle("is-hidden", k === 2);
        svg.setAttribute("viewBox", `0 0 ${W} ${k === 2 ? H_BARS : H_SCATTER}`);
        if (k <= 0) {
          ttl.textContent = labels.t300 || "300-D space";
          sub.textContent = "";
        } else if (k === 1) {
          ttl.textContent = labels.tPca || "PCA \u2192 2-D";
          sub.textContent = typeof var2d === "number" ? `${var2d.toFixed(1)}% ${labels.varKept || "variance kept"}` : "";
        } else if (k === 2) {
          ttl.textContent = labels.tEvr || "per-component variance";
          sub.textContent = "";
        } else {
          ttl.textContent = labels.tTsne || "t-SNE \u2192 2-D";
          sub.textContent = labels.neighbors || "neighbors preserved";
        }
      };
    }
  });
})();
